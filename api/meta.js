// GET /api/meta -> fresh card and deck stats from the recent battles of top Path of Legends players.
// Same output as scripts/refresh-meta.mjs, computed on demand and cached for a day, so the site keeps its
// ratings current without any scheduled job. ?summary=1 returns a short readable digest instead.
const { aggregate } = require('./_meta.js');
const API_BASE = process.env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';
const N_PLAYERS = 160, CONCURRENCY = 24, BUDGET_MS = 14000;

async function api(path) {
  const r = await fetch(API_BASE + path, { headers: { Authorization: `Bearer ${process.env.CR_API_KEY}`, Accept: 'application/json', 'User-Agent': 'ElixirForge-meta/1.0' } });
  if (!r.ok) throw new Error(`${path} -> ${r.status}`);
  return r.json();
}
async function topPlayers(n) {
  const errors = [];
  for (const p of [`/locations/global/pathoflegend/players?limit=${n}`, `/locations/global/rankings/players?limit=${n}`]) {
    try { const j = await api(p); if (j.items && j.items.length) return j.items.map(x => x.tag); errors.push(p + ' -> empty'); } catch (e) { errors.push(e.message); }
  }
  throw new Error('no ranking endpoint answered: ' + errors.join('; '));
}

module.exports = async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (!process.env.CR_API_KEY) { res.statusCode = 503; return res.end(JSON.stringify({ error: 'no_key' })); }
  const t0 = Date.now();
  try {
    const tags = await topPlayers(N_PLAYERS);
    const battles = [], queue = tags.slice(); let fetched = 0, failed = 0;
    await Promise.all(Array.from({ length: CONCURRENCY }, async () => {
      while (queue.length && Date.now() - t0 < BUDGET_MS) {
        const tag = queue.shift();
        try { battles.push(...await api(`/players/%23${encodeURIComponent(tag.replace(/^#/, ''))}/battlelog`)); fetched++; } catch (e) { failed++; }
      }
    }));
    const agg = aggregate(battles);
    const meta = { version: 1, generated: new Date().toISOString(), source: 'official-api', players: fetched, battles: battles.length, ranked: agg.ranked, duo: agg.duo };
    const q = req.query || {};
    if (q.summary) {
      // How the live numbers would move the built-in 1v1 ratings (same formula as the app's statPower).
      const TABLE = require('./_table.json'), byId = new Map(TABLE.map(c => [String(c.id), c]));
      const power = st => { if (!st || !st.games) return null; const r = 50 + 2.7 * (st.wins / st.games * 100 - 50) + 6 * Math.log10(1 + (st.usage || 0)); const u = st.usage == null ? 3 : st.usage; return Math.max(1, Math.min(10, Math.round((50 + (r - 50) * u / (u + 3) - 36) / 2.2))); };
      const movers = [], dist = {};
      for (const [id, c] of Object.entries(agg.ranked.cards)) {
        const t = byId.get(id); if (!t) continue; const lp = power(c.base); dist[lp] = (dist[lp] || 0) + 1;
        if (Math.abs(lp - t.p) >= 3) movers.push(`${t.name}: ${t.p} -> ${lp} (${c.base.usage}% use, ${Math.round(c.base.wins / c.base.games * 100)}% wins)`);
        for (const [f, key] of [['evo', 'ev'], ['hero', 'he']]) { const fp = power(c[f]); if (fp != null && t[key] && Math.abs(fp - t[key]) >= 3) movers.push(`${f} ${t.name}: ${t[key]} -> ${fp} (${c[f].usage}% use, ${Math.round(c[f].wins / c[f].games * 100)}% wins)`); }
      }
      const names = l => l.map(x => { const [id, rest] = x.split(': '); return (byId.get(id) || { name: id }).name + ': ' + rest; });
      const top = m => Object.entries(m.cards).map(([id, c]) => ({ id, u: c.base.usage, wr: Math.round(c.base.wins / c.base.games * 100) })).sort((a, b) => b.u - a.u).slice(0, 12).map(x => `${x.id}: ${x.u}% use, ${x.wr}% wins`);
      return res.end(JSON.stringify({ ms: Date.now() - t0, playersListed: tags.length, fetched, failed, battles: battles.length, rankedSides: agg.ranked.sides, duoSides: agg.duo.sides, rankedCards: Object.keys(agg.ranked.cards).length, duoCards: Object.keys(agg.duo.cards).length, rankedDecks: agg.ranked.decks.length, duoDecks: agg.duo.decks.length, rankedTop: names(top(agg.ranked)), livePowerSpread: dist, bigMovers: movers, topDecks: agg.ranked.decks.slice(0, 4).map(d => ({ cards: d.cards.map(x => { const [id, f] = x.split(':'); return (f ? f + ' ' : '') + (byId.get(id) || { name: id }).name; }), games: d.games, wins: d.wins })) }));
    }
    if (agg.ranked.sides < 500) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'thin_sample', sides: agg.ranked.sides })); }
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.end(JSON.stringify(meta));
  } catch (e) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'failed', message: String(e.message || e), ms: Date.now() - t0 })); }
};
