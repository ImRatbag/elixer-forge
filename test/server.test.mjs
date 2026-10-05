// Offline tests: simulated Supercell API responses -> server function and meta refresh -> app engine.
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import assert from 'node:assert';
const require = createRequire(import.meta.url);
const player = require('../api/player.js');
const { aggregate, formsOf } = await import('../scripts/refresh-meta.mjs');

// 1) player normalisation
const fake = { tag: '#2PP', name: 'Tester', trophies: 9000, arena: { name: 'Legendary Arena' },
  cards: [ { id: 26000000, name: 'Knight', level: 14, maxLevel: 16, evolutionLevel: 3 },
           { id: 26000021, name: 'Hog Rider', level: 13, maxLevel: 14, evolutionLevel: 0 },
           { id: 26000046, name: 'Bandit', level: 6, maxLevel: 8 },
           { id: 26000074, name: 'Golden Knight', level: 3, maxLevel: 6 },
           { id: 26000010, name: 'Skeletons', level: 15, maxLevel: 16, evolutionLevel: 1 } ],
  supportCards: [ { id: 159000000, name: 'Tower Princess', level: 15, maxLevel: 16 } ],
  currentDeck: [ { id: 26000000 } ] };
const p = player.toPlayer(fake);
assert.equal(p.cards.find(c => c.id === 26000000).level, 14);
assert.equal(p.cards.find(c => c.id === 26000021).level, 15, 'rare shifted by 2');
assert.equal(p.cards.find(c => c.id === 26000046).level, 14, 'legendary shifted by 8');
assert.equal(p.cards.find(c => c.id === 26000074).level, 13, 'champion shifted by 10');
assert.deepEqual([p.cards[0].evo, p.cards[0].hero], [true, true]);
assert.deepEqual([p.cards[4].evo, p.cards[4].hero], [true, false]);
assert.equal(p.towers[0].id, 159000000);
assert.equal(player.normalizeTag('#2ppO'), '2PP0');

// 2) handler: bad tag, missing key, upstream 404
const call = async (url, env = {}) => { const old = { ...process.env }; Object.assign(process.env, env); let out = {}; const res = { statusCode: 0, headers: {}, setHeader(k, v) { this.headers[k] = v; }, end(b) { out = { status: this.statusCode, body: JSON.parse(b) }; } };
  await player({ url, query: Object.fromEntries(new URL(url, 'http://x').searchParams) }, res); process.env = old; return out; };
assert.equal((await call('/api/player?tag=ABC')).status, 400);
delete process.env.CR_API_KEY; assert.equal((await call('/api/player?tag=2PP')).body.error, 'no_key');
const realFetch = globalThis.fetch;
globalThis.fetch = async () => ({ status: 404, ok: false, json: async () => ({}) });
assert.equal((await call('/api/player?tag=2PP', { CR_API_KEY: 'k' })).status, 404);
globalThis.fetch = async () => ({ status: 200, ok: true, json: async () => fake });
const ok = await call('/api/player?tag=2PP', { CR_API_KEY: 'k' });
assert.equal(ok.status, 200); assert.equal(ok.body.cards.length, 5);
globalThis.fetch = realFetch;

// 3) meta aggregation from synthetic battle logs
const deckA = [26000036, 26000074, 26000050, 26000106, 26000042, 26000046, 27000010, 28000001].map((id, i) => ({ id, evolutionLevel: i === 0 || i === 2 ? 1 : 0 }));
const deckB = [26000021, 26000014, 28000011, 26000010, 26000030, 27000000, 28000000, 26000038].map(id => ({ id }));
const battles = [];
for (let i = 0; i < 30; i++) battles.push({ type: 'pathOfLegend', battleTime: 't' + i, team: [{ tag: '#A' + i, crowns: i % 3 ? 1 : 0, cards: deckA }], opponent: [{ tag: '#B' + i, crowns: i % 3 ? 0 : 2, cards: deckB }] });
for (let i = 0; i < 12; i++) battles.push({ type: 'clanMate2v2', battleTime: 'd' + i, team: [{ tag: '#C' + i, crowns: 1, cards: deckA }, { tag: '#D' + i, crowns: 1, cards: deckB }], opponent: [{ tag: '#E' + i, crowns: 0, cards: deckB }, { tag: '#F' + i, crowns: 0, cards: deckA }] });
battles.push(battles[0]); // duplicate is ignored
const agg = aggregate(battles);
assert.equal(agg.ranked.sides, 60);
assert.equal(agg.ranked.cards[26000036].evo.games, 30, 'Evo Battle Ram counted in slot 1');
assert.equal(agg.ranked.cards[26000050].evo.games, 30, 'Evo Royal Ghost counted in Wild slot');
assert.equal(agg.duo.sides, 48);
assert.ok(agg.ranked.decks.length >= 2);
assert.deepEqual(formsOf([{ evolutionLevel: 2 }, { evolutionLevel: 2 }, { evolutionLevel: 3 }]), ['base', 'hero', 'evo']);

// 4) the app engine accepts the refresh output
const engineSrc = readFileSync(new URL('../src/data.js', import.meta.url), 'utf8') + readFileSync(new URL('../src/engine.js', import.meta.url), 'utf8');
const fn = new Function(engineSrc + '; return {applyMeta, C, META, META2};');
const E = fn();
const meta = { version: 1, generated: new Date().toISOString(), source: 'official-api', ranked: agg.ranked, duo: agg.duo };
for (let i = 0; i < 4; i++) meta.ranked.decks.push(meta.ranked.decks[0]);
assert.ok(E.applyMeta(meta));
assert.equal(E.META[0].cards.length, 8);
console.log('server + refresh tests passed:', JSON.stringify({ rankedDecks: agg.ranked.decks.length, battleRamEvoPower: E.C['battle-ram'].ev, topDeck: E.META[0].n }));

// card list normalisation
{
  const { createRequire } = await import('node:module');
  const { toCards } = createRequire(import.meta.url)('../api/cards.js');
  const out = toCards({ items: [{ id: 26000000, name: 'Knight', elixirCost: 3, rarity: 'common', iconUrls: { medium: 'a.png', evolutionMedium: 'b.png', heroMedium: 'c.png' } }], supportItems: [{ id: 159000000, name: 'Tower Princess', iconUrls: { medium: 't.png' } }] });
  if (out.cards[0].evo !== 'b.png' || out.cards[0].hero !== 'c.png' || out.towers[0].id !== 159000000) throw new Error('toCards failed');
  console.log('card list test passed');
}

// battle log -> recent decks
{
  const { createRequire } = await import('node:module');
  const { toDecks } = createRequire(import.meta.url)('../api/battles.js');
  const cards = [26000000, 26000001, 26000002, 26000003, 26000004, 26000005, 26000006, 26000007].map((id, i) => ({ id, evolutionLevel: i === 0 ? 1 : i === 1 ? 2 : 0 }));
  const mk = (t, mine, theirs) => ({ battleTime: t, type: 'pathOfLegend', gameMode: { name: 'Ranked1v1' }, team: [{ tag: '#2PP', name: 'Ken', crowns: mine, cards, supportCards: [{ id: 159000000 }] }], opponent: [{ tag: '#9', crowns: theirs, cards }] });
  const out = toDecks([mk('20261001T100000.000Z', 3, 0), mk('20261002T100000.000Z', 0, 1)], '2PP');
  const d = out.decks[0];
  if (out.name !== 'Ken' || out.decks.length !== 1 || d.games !== 2 || d.wins !== 1 || d.losses !== 1 || d.cards[0] !== '26000000:evo' || d.cards[1] !== '26000001:hero' || d.tower !== 159000000) throw new Error('toDecks failed ' + JSON.stringify(out));
  console.log('battle log test passed');
}
