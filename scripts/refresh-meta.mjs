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

export async function api(path, fetchImpl = fetch) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetchImpl(API + path, { headers: { Authorization: `Bearer ${KEY}`, Accept: 'application/json', 'User-Agent': 'ElixirForge-meta/1.0' } });
    if (r.status === 429 || r.status >= 500) { await new Promise(s => setTimeout(s, 1500 * (attempt + 1))); continue; }
    if (!r.ok) throw new Error(`${path} -> ${r.status}`);
    return r.json();
  }
  throw new Error(`${path} -> gave up after retries`);
}

import { createRequire } from 'node:module';
const { formsOf, aggregate } = createRequire(import.meta.url)('../api/_meta.js');
export { formsOf, aggregate };

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
