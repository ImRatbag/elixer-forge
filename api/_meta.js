// Shared by scripts/refresh-meta.mjs (weekly GitHub Action) and api/meta.js (on-demand refresh).
const MIN_DECK_GAMES = +(process.env.MIN_DECK_GAMES || 8);
// Which card in a battle deck is played as Evo / Hero. The API lists cards in deck-slot order:
// slot 1 = Evo slot, slot 2 = Hero/Champion slot, slot 3 = Wild. evolutionLevel is a bitmask (1 Evo, 2 Hero).
function formsOf(cards) {
  return cards.map((c, i) => {
    const bits = c.evolutionLevel || 0;
    if (i === 0 && bits & 1) return 'evo';
    if (i === 1 && bits & 2) return 'hero';
    if (i === 2) return bits & 1 ? 'evo' : bits & 2 ? 'hero' : 'base';
    return 'base';
  });
}

function aggregate(battles) {
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


module.exports = { formsOf, aggregate };
