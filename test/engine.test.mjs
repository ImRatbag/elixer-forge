// Rule tests for the deck engine: every deck legal, collections respected, 2v2 pairs legal.
import { readFileSync } from 'node:fs';
import assert from 'node:assert';
const src = readFileSync(new URL('../src/data.js', import.meta.url), 'utf8') + readFileSync(new URL('../src/engine.js', import.meta.url), 'utf8');
const E = new Function(src + '; return {generate,generateDuo,collectionToRules,C,isChamp,EVO_CARDS,HERO_CARDS,syncCards,CARD_IDS,ID_TO_CARD};')();
let decks = 0;
function check(d, col, locked = []) {
  decks++;
  assert.equal(new Set(d.ids).size, 8);
  const sp = d.forms.specials, e = sp.filter(x => x.form === 'evo').length, h = sp.length - e;
  assert.ok(e <= 2 && h <= 2, 'max 2 of a type');
  assert.ok(d.ids.filter(i => E.isChamp(E.C[i])).length <= 1, 'one champion');
  if (col.evo.size > 2 && col.hero.size > 2) assert.equal(sp.length, 3, 'all 3 slots filled when owned');
  for (const x of sp) {
    if (x.form === 'evo') assert.ok(col.evo.has(x.id), 'owns Evo ' + x.id);
    if (x.form === 'hero') assert.ok(col.hero.has(x.id), 'owns Hero ' + x.id);
  }
  locked.forEach(id => assert.ok(d.ids.includes(id)));
}
// Two realistic partial collections (Evos and Heroes each player has NOT unlocked).
const FIXTURES = [
  { missingEvo: ['hunter','royal-recruits','lumberjack','battle-ram','inferno-dragon','barbarians','furnace','skeleton-army','witch','pekka','bats','royal-giant','executioner','baby-dragon','dart-goblin','musketeer','valkyrie','mega-knight','goblin-drill'], missingHero: ['giant','valkyrie','mega-minion','mini-pekka','dark-prince','wizard','tombstone','balloon'] },
  { missingEvo: ['princess','minion-horde','royal-giant','zap','witch','goblin-giant','battle-ram'], missingHero: ['ice-wizard','mini-pekka','balloon','ice-golem','giant'] },
];
const cols = FIXTURES.map(p => ({ base: null, evo: new Set(E.EVO_CARDS.filter(i => !p.missingEvo.includes(i))), hero: new Set(E.HERO_CARDS.filter(i => !p.missingHero.includes(i))) }));
for (const col of cols) for (const style of ['any', 'beatdown', 'hyperbait', 'cycle']) {
  const r = E.collectionToRules(col);
  E.generate({ locked: [], forms: {}, exclude: r.exclude, ban: r.ban, style, maxAvg: 4.3, count: 3, maxChamps: 1 }).forEach(d => check(d, col));
}
const ra = E.collectionToRules(cols[0]), rb = E.collectionToRules(cols[1]);
const side = (r, o = {}) => ({ locked: [], forms: {}, exclude: r.exclude, ban: r.ban, style: 'any', role: 'flex', ...o });
for (const [x, y] of [['flex', 'flex'], ['attack', 'defend']]) {
  E.generateDuo({ A: side(ra, { role: x }), B: side(rb, { role: y, locked: ['hog-rider'] }), maxAvg: 4.3, count: 2, priority: 'balanced', names: { A: 'A', B: 'B' } }).forEach(p => {
    check({ ids: p.A, forms: p.sa.forms }, cols[0]); check({ ids: p.B, forms: p.sb.forms }, cols[1], ['hog-rider']);
    assert.ok(p.A.filter(i => p.B.includes(i)).length <= 2, 'max 2 shared');
  });
}
console.log('engine rule tests passed:', decks, 'decks checked');

// syncCards: a newly released form is switched on, IDs follow the API, champions never gain a Hero form.
{
  const before = E.EVO_CARDS.length, hadEvo = !!E.C['hog-rider'].ev;
  const added = E.syncCards({ ids: { knight: 26999999 }, forms: [{ id: 'hog-rider', evo: true, hero: false }, { id: 'knight', evo: true, hero: true }, { id: 'golden-knight', evo: false, hero: true }] });
  assert.equal(E.CARD_IDS.knight, 26999999); assert.equal(E.ID_TO_CARD[26999999], 'knight');
  if (!hadEvo) { assert.ok(E.C['hog-rider'].ev >= 5); assert.equal(E.EVO_CARDS.length, before + 1); assert.ok(added.some(x => x.id === 'hog-rider' && x.form === 'evo')); }
  assert.ok(!added.some(x => x.id === 'golden-knight'));
  const col = { base: null, evo: new Set(['hog-rider']), hero: new Set() };
  const r = E.collectionToRules(col);
  E.generate({ locked: ['hog-rider'], forms: {}, exclude: r.exclude, ban: r.ban, style: 'any', maxAvg: 4.3, count: 2, maxChamps: 1 }).forEach(d => check(d, col, ['hog-rider']));
  console.log('syncCards test passed');
}

// Forms released after launch sit at the end of the Evo/Hero lists, so older collection codes keep their meaning.
{
  const E2 = new Function(src + '; return {EVO_CARDS,HERO_CARDS,encodeCollection,decodeCollection,C};')();
  assert.equal(E2.EVO_CARDS.at(-1), 'electro-giant'); assert.equal(E2.HERO_CARDS.at(-1), 'electro-wizard');
  assert.equal(E2.C.furnace.type, 't', 'Furnace is a troop');
  const col = { base: null, evo: new Set(['knight', 'electro-giant']), hero: new Set(['electro-wizard']), towers: new Set(['tower-princess']) };
  const back = E2.decodeCollection(E2.encodeCollection(col));
  assert.deepEqual([...back.evo].sort(), ['electro-giant', 'knight']); assert.deepEqual([...back.hero], ['electro-wizard']);
  console.log('late forms test passed');
}
