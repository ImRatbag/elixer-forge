// GET /api/player?tag=2PP
// Looks up a player's collection through Supercell's official Clash Royale API and returns only what
// Elixir Forge needs: owned cards with levels, which Evos and Heroes are unlocked, and tower troops.
//
// Setup (see README): create a key at https://developer.clashroyale.com allowing IP 45.79.218.79
// (the RoyaleAPI proxy), then set CR_API_KEY in your host's environment variables.
// Key facts this relies on:
//  - cards[].evolutionLevel is a bitmask: 1 = Evo unlocked, 2 = Hero unlocked, 3 = both.
//  - levels come back per rarity; we convert them to the 1-16 scale players see in game.

const TAG_RE = /^[0289PYLQGRJCUV]{3,14}$/;
const API_BASE = process.env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';

function normalizeTag(raw) {
  return String(raw || '').toUpperCase().replace(/^#/, '').replace(/O/g, '0').trim();
}

// Convert per-rarity levels to the in-game number: commons have the highest maxLevel,
// so every card's level is shifted by (highest maxLevel - its own maxLevel).
function toPlayer(p) {
  const all = [...(p.cards || []), ...(p.supportCards || [])];
  const top = Math.max(...all.map(c => c.maxLevel || 0), 0);
  const lvl = c => (c.level || 0) + (top - (c.maxLevel || top));
  return {
    tag: (p.tag || '').replace(/^#/, ''),
    name: p.name || '',
    trophies: p.trophies ?? null,
    arena: p.arena ? p.arena.name : null,
    cards: (p.cards || []).map(c => ({
      id: c.id,
      name: c.name,
      level: lvl(c),
      evo: ((c.evolutionLevel || 0) & 1) === 1,
      hero: ((c.evolutionLevel || 0) & 2) === 2,
    })),
    towers: (p.supportCards || []).map(c => ({ id: c.id, name: c.name, level: lvl(c) })),
    currentDeck: (p.currentDeck || []).map(c => c.id),
  };
}

async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const tag = normalizeTag((req.query && req.query.tag) || new URL(req.url, 'http://x').searchParams.get('tag'));
  if (!TAG_RE.test(tag)) {
    res.statusCode = 400;
    return res.end(JSON.stringify({ error: 'bad_tag', message: 'That is not a valid player tag. Tags use only 0 2 8 9 P Y L Q G R J C U V.' }));
  }
  if (!process.env.CR_API_KEY) {
    res.statusCode = 503;
    return res.end(JSON.stringify({ error: 'no_key', message: 'The server has no Clash Royale API key yet. Add CR_API_KEY in the hosting settings.' }));
  }
  let r;
  try {
    r = await fetch(`${API_BASE}/players/%23${tag}`, {
      headers: { Authorization: `Bearer ${process.env.CR_API_KEY}`, Accept: 'application/json', 'User-Agent': 'ElixirForge/1.0 (+deck builder)' },
    });
  } catch (e) {
    res.statusCode = 502;
    return res.end(JSON.stringify({ error: 'network', message: 'Could not reach the Clash Royale API. Try again in a minute.' }));
  }
  if (r.status === 404) { res.statusCode = 404; return res.end(JSON.stringify({ error: 'not_found', message: `No player found with tag #${tag}.` })); }
  if (r.status === 403) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'forbidden', message: 'The API key was refused. Check that it allows IP 45.79.218.79.' })); }
  if (r.status === 429) { res.statusCode = 429; return res.end(JSON.stringify({ error: 'rate_limited', message: 'Too many lookups right now. Try again in a minute.' })); }
  if (r.status === 503) { res.statusCode = 503; return res.end(JSON.stringify({ error: 'maintenance', message: 'Clash Royale is under maintenance. Try again later.' })); }
  if (!r.ok) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'upstream', message: `The Clash Royale API answered ${r.status}.` })); }
  let out;
  try { out = toPlayer(await r.json()); }
  catch (e) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'bad_response', message: 'The Clash Royale API sent an answer that could not be read. Try again in a minute.' })); }
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.statusCode = 200;
  return res.end(JSON.stringify(out));
}

module.exports = handler;
module.exports.toPlayer = toPlayer;
module.exports.normalizeTag = normalizeTag;
