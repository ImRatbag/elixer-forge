// GET /api/battles?tag=2PP -> the decks a player used in their most recent battles (Supercell keeps about the last 25).
// Used for the "player decks" tab: a creator's or friend's recent decks, grouped, with wins and losses.

const TAG_RE = /^[0289PYLQGRJCUV]{3,14}$/;
const API_BASE = process.env.CR_API_BASE || 'https://proxy.royaleapi.dev/v1';
const norm = raw => String(raw || '').toUpperCase().replace(/^#/, '').replace(/O/g, '0').trim();

// Which card is played as Evo / Hero: the API lists cards in deck-slot order (slot 1 Evo, slot 2 Hero or Champion,
// slot 3 Wild) and evolutionLevel is a bitmask (1 Evo unlocked, 2 Hero unlocked).
function formsOf(cards) {
  return cards.map((c, i) => {
    const bits = c.evolutionLevel || 0;
    if (i === 0 && bits & 1) return 'evo';
    if (i === 1 && bits & 2) return 'hero';
    if (i === 2) return bits & 1 ? 'evo' : bits & 2 ? 'hero' : 'base';
    return 'base';
  });
}

function toDecks(battles, tag) {
  const decks = new Map();
  let name = '';
  for (const b of battles || []) {
    const team = b.team || [], opp = b.opponent || [];
    const me = team.find(t => (t.tag || '').replace(/^#/, '') === tag) || team[0];
    const rawMode = (b.gameMode && b.gameMode.name) || b.type || '';
    if (/draft/i.test(rawMode)) continue; // draft games use cards picked on the spot, not the player's own deck
    if (!me || !Array.isArray(me.cards) || me.cards.length !== 8) continue;
    name = me.name || name;
    const forms = formsOf(me.cards);
    const cards = me.cards.map((c, i) => c.id + (forms[i] !== 'base' ? ':' + forms[i] : ''));
    const key = [...cards].sort().join(',');
    const tc = team.reduce((a, t) => a + (t.crowns || 0), 0), oc = opp.reduce((a, t) => a + (t.crowns || 0), 0);
    const mode = team.length === 2 ? '2v2' : ((b.gameMode && b.gameMode.name) || b.type || 'Battle');
    const tower = (me.supportCards && me.supportCards[0] && me.supportCards[0].id) || null;
    const d = decks.get(key) || { cards, tower, games: 0, wins: 0, losses: 0, last: b.battleTime || '', modes: [] };
    d.games++; if (tc > oc) d.wins++; else if (oc > tc) d.losses++;
    if ((b.battleTime || '') > d.last) d.last = b.battleTime;
    if (!d.modes.includes(mode)) d.modes.push(mode);
    decks.set(key, d);
  }
  return { tag, name, decks: [...decks.values()].sort((a, b) => (b.last > a.last ? 1 : -1)).slice(0, 12) };
}

async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  const tag = norm((req.query && req.query.tag) || new URL(req.url, 'http://x').searchParams.get('tag'));
  if (!TAG_RE.test(tag)) { res.statusCode = 400; return res.end(JSON.stringify({ error: 'bad_tag', message: 'That is not a valid player tag.' })); }
  if (!process.env.CR_API_KEY) { res.statusCode = 503; return res.end(JSON.stringify({ error: 'no_key', message: 'The server has no Clash Royale API key yet.' })); }
  let r;
  try {
    r = await fetch(`${API_BASE}/players/%23${tag}/battlelog`, { headers: { Authorization: `Bearer ${process.env.CR_API_KEY}`, Accept: 'application/json', 'User-Agent': 'ElixirForge/1.0 (+deck builder)' } });
  } catch (e) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'network', message: 'Could not reach the Clash Royale API. Try again in a minute.' })); }
  if (r.status === 404) { res.statusCode = 404; return res.end(JSON.stringify({ error: 'not_found', message: `No player found with tag #${tag}.` })); }
  if (r.status === 403) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'forbidden', message: 'The API key was refused.' })); }
  if (r.status === 503) { res.statusCode = 503; return res.end(JSON.stringify({ error: 'maintenance', message: 'Clash Royale is under maintenance. Try again later.' })); }
  if (r.status === 429) { res.statusCode = 429; return res.end(JSON.stringify({ error: 'rate_limited', message: 'Too many lookups right now. Try again in a minute.' })); }
  if (!r.ok) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'upstream', message: `The Clash Royale API answered ${r.status}.` })); }
  let out;
  try { out = toDecks(await r.json(), tag); }
  catch (e) { res.statusCode = 502; return res.end(JSON.stringify({ error: 'bad_response', message: 'The Clash Royale API sent an answer that could not be read. Try again in a minute.' })); }
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate=1800');
  res.statusCode = 200;
  return res.end(JSON.stringify(out));
}

module.exports = handler;
module.exports.toDecks = toDecks;
