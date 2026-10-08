// GET /api/audit -> differences between the app's card table and Supercell's live card list.
// A maintenance check: an empty result means the table matches the game.
const API_BASE = process.env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';
const TABLE = require('./_table.json');
const nk = x => String(x || '').toLowerCase().replace(/[^a-z0-9]/g, '');

function audit(items) {
  const api = new Map(items.map(c => [nk(c.name), c])), tab = new Map(TABLE.map(c => [nk(c.name), c]));
  const has = (c, re) => Object.keys(c.iconUrls || {}).some(k => re.test(k));
  const out = { apiCards: items.length, tableCards: TABLE.length, notInTable: [], notInGame: [], elixir: [], id: [], evoInGameOnly: [], evoInTableOnly: [], heroInGameOnly: [], heroInTableOnly: [] };
  for (const [k, c] of api) {
    const t = tab.get(k);
    if (!t) { out.notInTable.push(`${c.name} (${c.elixirCost} elixir, ${c.rarity}, id ${c.id}${has(c, /^evolution/i) ? ', evo' : ''}${has(c, /^hero/i) ? ', hero' : ''})`); continue; }
    if (c.elixirCost != null && c.elixirCost !== t.e) out.elixir.push(`${c.name}: game ${c.elixirCost}, table ${t.e}`);
    if (c.id !== t.id) out.id.push(`${c.name}: game ${c.id}, table ${t.id}`);
    const ge = has(c, /^evolution/i), gh = has(c, /^hero/i);
    if (ge && !t.evo) out.evoInGameOnly.push(c.name); if (!ge && t.evo) out.evoInTableOnly.push(c.name);
    if (gh && !t.hero) out.heroInGameOnly.push(c.name); if (!gh && t.hero) out.heroInTableOnly.push(c.name);
  }
  for (const [k, t] of tab) if (!api.has(k)) out.notInGame.push(t.name);
  return out;
}

// ?tag=XXXX checks how a real account's Evo/Hero flags line up with the table: a flag on a card the table says has
// no such form would mean the flag is being misread.
function auditPlayer(p) {
  const tab = new Map(TABLE.map(c => [nk(c.name), c]));
  const out = { name: p.name, cards: (p.cards || []).length, flagValues: {}, evoFlag: 0, heroFlag: 0, evoFlagButNoEvoInTable: [], heroFlagButNoHeroInTable: [], unknownCards: [], maxLevels: {} };
  for (const c of p.cards || []) {
    const v = c.evolutionLevel || 0, t = tab.get(nk(c.name));
    out.flagValues[v] = (out.flagValues[v] || 0) + 1;
    out.maxLevels[c.rarity || '?'] = c.maxLevel;
    if (!t) { out.unknownCards.push(c.name); continue; }
    if (v & 1) { out.evoFlag++; if (!t.evo) out.evoFlagButNoEvoInTable.push(c.name); }
    if (v & 2) { out.heroFlag++; if (!t.hero) out.heroFlagButNoHeroInTable.push(c.name); }
  }
  out.currentDeck = (p.currentDeck || []).map(c => `${c.name}${c.evolutionLevel ? ' [' + c.evolutionLevel + ']' : ''}`);
  return out;
}

module.exports = async (req, res) => {
  const tag = String((req.query && req.query.tag) || '').toUpperCase().replace(/[^0289PYLQGRJCUV]/g, '');
  if (tag) {
    res.setHeader('Content-Type', 'application/json');
    if (tag.length < 3 || tag.length > 14) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'bad_tag' })); }
    if (!process.env.CR_API_KEY) { res.statusCode = 503; return res.end(JSON.stringify({ error: 'no_key' })); }
    try {
      const r = await fetch(`${API_BASE}/players/%23${tag}`, { headers: { Authorization: `Bearer ${process.env.CR_API_KEY}`, Accept: 'application/json' } });
      if (!r.ok) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'upstream', status: r.status })); }
      const body = auditPlayer(await r.json());
      res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
      return res.end(JSON.stringify(body));
    } catch (e) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'network' })); }
  }
  res.setHeader('Content-Type', 'application/json');
  if (!process.env.CR_API_KEY) { res.statusCode = 503; return res.end(JSON.stringify({ error: 'no_key' })); }
  try {
    const r = await fetch(`${API_BASE}/cards`, { headers: { Authorization: `Bearer ${process.env.CR_API_KEY}`, Accept: 'application/json' } });
    if (!r.ok) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'upstream', status: r.status })); }
    const j = await r.json();
    res.setHeader('Cache-Control', 's-maxage=3600');
    return res.end(JSON.stringify(audit(j.items || [])));
  } catch (e) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'network' })); }
};
module.exports.audit = audit;
