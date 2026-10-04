// GET /api/cards -> the official card list with image links, from Supercell's Clash Royale API.
// The app uses it to show card pictures and to keep card and tower troop IDs exact.
// Images are served from Supercell's own asset host; Supercell's Fan Content Policy allows fan sites to show them unmodified.

const API_BASE = process.env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';

function toCards(j) {
  const pick = (u, re) => { const k = Object.keys(u || {}).find(x => re.test(x)); return k ? u[k] : null; };
  return {
    cards: (j.items || []).map(c => ({
      id: c.id, name: c.name, elixir: c.elixirCost ?? null, rarity: c.rarity || null,
      icon: (c.iconUrls && c.iconUrls.medium) || null,
      evo: pick(c.iconUrls, /^evolution/i),
      hero: pick(c.iconUrls, /^hero/i),
    })),
    towers: (j.supportItems || []).map(c => ({ id: c.id, name: c.name, icon: (c.iconUrls && c.iconUrls.medium) || null })),
  };
}

async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  if (!process.env.CR_API_KEY) { res.statusCode = 503; return res.end(JSON.stringify({ error: 'no_key' })); }
  let r;
  try {
    r = await fetch(`${API_BASE}/cards`, { headers: { Authorization: `Bearer ${process.env.CR_API_KEY}`, Accept: 'application/json', 'User-Agent': 'ElixirForge/1.0 (+deck builder)' } });
  } catch (e) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'network' })); }
  if (!r.ok) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'upstream', status: r.status })); }
  res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
  res.statusCode = 200;
  return res.end(JSON.stringify(toCards(await r.json())));
}

module.exports = handler;
module.exports.toCards = toCards;
