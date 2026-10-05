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
      const top = m => Object.entries(m.cards).map(([id, c]) => ({ id, u: c.base.usage, wr: Math.round(c.base.wins / c.base.games * 100) })).sort((a, b) => b.u - a.u).slice(0, 12).map(x => `${x.id}: ${x.u}% use, ${x.wr}% wins`);
      return res.end(JSON.stringify({ ms: Date.now() - t0, playersListed: tags.length, fetched, failed, battles: battles.length, rankedSides: agg.ranked.sides, duoSides: agg.duo.sides, rankedCards: Object.keys(agg.ranked.cards).length, duoCards: Object.keys(agg.duo.cards).length, rankedDecks: agg.ranked.decks.length, duoDecks: agg.duo.decks.length, rankedTop: top(agg.ranked), duoTop: top(agg.duo) }));
    }
    if (agg.ranked.sides < 500) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'thin_sample', sides: agg.ranked.sides })); }
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    return res.end(JSON.stringify(meta));
  } catch (e) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'failed', message: String(e.message || e), ms: Date.now() - t0 })); }
};
