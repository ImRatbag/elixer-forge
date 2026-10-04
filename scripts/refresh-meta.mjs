#!/usr/bin/env node
// Weekly meta refresh for Elixir Forge.
// Pulls recent battles of top Path of Legends players from Supercell's official API, then writes
// data/meta.json with per-card (and per-Evo / per-Hero) usage and win rates for 1v1 and 2v2,
// plus the most-played decks. The app loads this file on start, so ratings stay current without
// copying anyone else's data.
//
// Usage:  CR_API_KEY=... node scripts/refresh-meta.mjs [--players 300] [--out data/meta.json]
// The key must allow IP 45.79.218.79 (RoyaleAPI proxy), which lets it run from GitHub Actions.

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), []));
const API = process.env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';
const KEY = process.env.CR_API_KEY;
const N_PLAYERS = +(args.players || 300);
const OUT = args.out || 'data/meta.json';
const MIN_DECK_GAMES = +(args.minDeckGames || 8);

export async function api(path, fetchImpl = fetch) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetchImpl(API + path, { headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json', 'User-Agent': 'ElixirForge-meta/1.0' } });
    if (r.status === 429 || r.status >= 500) { await new Promise(s => setTimeout(s, 1500 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error(`${path} -> ${r.status}`);
    return r.json();
  }
  throw new Error(`${path} -> gave up after retries`);
}

// Which card in a battle deck is played as Evo / Hero. The API lists cards in deck-slot order:
// slot 1 = Evo slot, slot 2 = Hero/Champion slot, slot 3 = Wild. evolutionLevel is a bitmask (1 Evo, 2 Hero).
export function formsOf(cards) {
  return cards.map((c, i) => {
    const bits = c.evolutionLevel || 0;
    if (i === 0 && bits & 1) return 'evo';
    if (i === 1 && bits & 2) return 'hero';
    if (i === 2) return bits & 1 ? 'evo' : bits & 2 ? 'hero' : 'base';
    return 'base';
  });
}

export function aggregate(battles) {
  const modes = { ranked: { sides: 0, cards: {}, decks: {} }, duo: { sides: 0, cards: {}, decks: {} } };
  const seen = new Set();
  for (const b of battles) {
    const team = b.team || [], opp = b.opponent || [];
    if (!team.length || team.length !== opp.length) continue;
    const mode = team.length === 2 ? 'duo' : (b.type === 'pathOfLegend' || b.type === 'PvP' || b.type === 'ranked') ? 'ranked' : null;
    if (!mode) continue;
    const id = [b.battleTime, ...team.map(t => t.tag), ...opp.map(t => t.tag)].sort().join('|');
    if (seen.has(id)) continue;
    seen.add(id);
    const tc = team.reduce((a, t) => a + (t.crowns || 0), 0) / team.length, oc = opp.reduce((a, t) => a + (t.crowns || 0), 0) / opp.length;
    if (tc === oc) continue; // skip draws
    for (const [side, won] of [[team, tc > oc], [opp, oc > tc]]) {
      for (const pl of side) {
        const cards = pl.cards || [];
        if (cards.length !== 8) continue; // the API drops a Hero sitting in the Champion slot; skip those decks
        const m = modes[mode]; m.sides++;
        const forms = formsOf(cards);
        cards.forEach((c, i) => {
          const e = (m.cards[c.id] ||= { base: { games: 0, wins: 0 }, evo: { games: 0, wins: 0 }, hero: { games: 0, wins: 0 } });
          e.base.games++; if (won) e.base.wins++;
          if (forms[i] !== 'base') { e[forms[i]].games++; if (won) e[forms[i]].wins++; }
        });
        const key = cards.map((c, i) => c.id + (forms[i] !== 'base' ? ':' + forms[i] : '')).sort().join(',');
        const d = (m.decks[key] ||= { games: 0, wins: 0 }); d.games++; if (won) d.wins++;
      }
    }
  }
  const out = {};
  for (const [mode, m] of Object.entries(modes)) {
    const cards = {};
    for (const [id, e] of Object.entries(m.cards)) {
      cards[id] = {};
      for (const f of ['base', 'evo', 'hero']) if (e[f].games) cards[id][f] = { games: e[f].games, wins: e[f].wins, usage: Math.round(e[f].games / Math.max(1, m.sides) * 1000) / 10 };
    }
    // Bayesian-smoothed win rate so a deck with 9 games and 8 wins doesn't top the list.
    const decks = Object.entries(m.decks).filter(([, d]) => d.games >= MIN_DECK_GAMES)
      .map(([k, d]) => ({ cards: k.split(','), games: d.games, wins: d.wins, score: (d.wins + 10) / (d.games + 20) }))
      .sort((a, b) => b.score - a.score).slice(0, 12).map(({ score, ...d }) => d);
    out[mode] = { sides: m.sides, cards, decks };
  }
  return out;
}

async function topPlayers(n) {
  const paths = [`/locations/global/pathoflegend/players?limit=${n}`, `/locations/global/rankings/players?limit=${n}`];
  for (const p of paths) { try { const j = await api(p); if (j.items && j.items.length) return j.items.map(x => x.tag); } catch (e) { console.warn('ranking endpoint failed:', p, e.message); } }
  throw new Error('No ranking endpoint answered. Check the API key and IP allowlist.');
}

async function main() {
  if (!KEY) { console.error('Set CR_API_KEY first.'); process.exit(1); }
  const tags = await topPlayers(N_PLAYERS);
  console.log(`Fetching battle logs for ${tags.length} players…`);
  const battles = [];
  const queue = tags.slice();
  await Promise.all(Array.from({ length: 6 }, async () => {
    while (queue.length) {
      const tag = queue.shift();
      try { battles.push(...await api(`/players/%23${encodeURIComponent(tag.replace(/^#/, ''))}/battlelog`)); } catch (e) { console.warn('skip', tag, e.message); }
    }
  }));
  const agg = aggregate(battles);
  const meta = { version: 1, generated: new Date().toISOString(), source: 'official-api', players: tags.length, battles: battles.length, ranked: agg.ranked, duo: agg.duo };
  mkdirSync(dirname(OUT), { recursive: true });
  writeFileSync(OUT, JSON.stringify(meta));
  console.log(`Wrote ${OUT}: ${agg.ranked.sides} ranked decks, ${agg.duo.sides} 2v2 decks.`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch(e => { console.error(e.message); process.exit(1); });
