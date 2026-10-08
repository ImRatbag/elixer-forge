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

// Data integrity: every reference points at a real card, every list is legal, and no form is rated below its own card.
{
  const D = new Function(src + '; return {C,CARDS,has,META,META2,COUNTERS,SPELL_VULN,ARCH,CARD_IDS,WIN_COUNTER,SYN_RAW,isChamp};')();
  const bad = [], C = D.C, chk = (id, w) => { if (!C[id]) bad.push('unknown ' + w + ': ' + id); };
  for (const c of D.CARDS) {
    for (const [b, f] of [['p', 'ev'], ['p', 'he'], ['p2', 'ev2'], ['p2', 'he2']]) if (c[f] && c[f] <= c[b]) bad.push(f + ' not above base: ' + c.id);
    if (!!c.ev !== !!c.ev2 || !!c.he !== !!c.he2) bad.push('form in one mode only: ' + c.id);
    if (!D.CARD_IDS[c.id]) bad.push('no game id: ' + c.id);
    if (D.isChamp(c) && (c.ev || c.he)) bad.push('champion with a form: ' + c.id);
    if (D.has(c, 'W') && !D.COUNTERS[c.id]) bad.push('win condition without counters: ' + c.id);
    if (D.has(c, 'W') && !D.ARCH[c.id]) bad.push('win condition without a playstyle: ' + c.id);
  }
  const seen = {};
  D.SYN_RAW.trim().split('\n').forEach(l => { const [a, b, w] = l.split(','); chk(a, 'synergy'); chk(b, 'synergy'); const k = [a, b].sort().join('|'); if (seen[k] || a === b || !(+w > 0)) bad.push('bad synergy row: ' + l.slice(0, 40)); seen[k] = 1; });
  for (const [k, v] of Object.entries(D.COUNTERS)) { chk(k, 'counter key'); v.forEach(i => chk(i, 'counter of ' + k)); if (new Set(v).size !== v.length || v.includes(k)) bad.push('bad counter list: ' + k); }
  for (const k of [...Object.keys(D.SPELL_VULN), ...Object.keys(D.ARCH), ...Object.keys(D.WIN_COUNTER)]) chk(k, 'table key');
  for (const [nm, L] of [['Ranked', D.META], ['2v2', D.META2]]) for (const d of L) {
    const ids = d.cards.map(x => x.split(':')[0]); let e = 0, h = 0;
    d.cards.forEach(x => { const [i, f] = x.split(':'); chk(i, nm + ' deck'); if (!C[i]) return; if (f === 'evo') { e++; if (!C[i].ev) bad.push('no Evo of ' + i); } if (f === 'hero') { h++; if (!C[i].he) bad.push('no Hero of ' + i); } if (D.isChamp(C[i])) h++; });
    if (ids.length !== 8 || new Set(ids).size !== 8 || e > 2 || h > 2 || e + h > 3 || !ids.some(i => C[i] && D.has(C[i], 'W'))) bad.push('illegal ' + nm + ' top deck: ' + d.n);
  }
  assert.deepEqual(bad, []);
  console.log('data integrity test passed');
}

// Special slots go to the forms that add the most: Evo Goblin Barrel (weak card made strong) must get a slot.
{
  const A = new Function(src + '; return {assignForms};')();
  const ids = ['princess', 'ice-wizard', 'barbarian-barrel', 'suspicious-bush', 'goblin-barrel', 'poison', 'cannon-cart', 'ronin'];
  const sp = A.assignForms(ids, { forms: {}, ban: {}, maxChamps: 1, duo: true, tag: 'd|' }).specials;
  assert.ok(sp.some(x => x.id === 'goblin-barrel' && x.form === 'evo'), 'Evo Goblin Barrel takes a slot in 2v2');
  console.log('slot choice test passed');
}

// Slot model: forms that add the most win the slots, and a stronger normal card never lowers a deck's score.
{
  const A = new Function(src + '; return {assignForms,scoreDeck,C,generate,generateDuo,syncCards,CARD_IDS,ID_TO_CARD};')();
  const ctx = duo => ({ forms: {}, ban: {}, maxChamps: 1, duo, tag: duo ? 'd|' : '', maxAvg: 9, style: 'any' });
  const pick = A.assignForms(['mirror', 'little-prince', 'bomb-tower', 'firecracker', 'furnace', 'knight', 'barbarian-barrel', 'archers'], ctx(true)).specials.map(x => x.id);
  assert.ok(pick.includes('firecracker') && pick.includes('knight'), 'biggest gains take the slots');
  const ids = ['royal-giant', 'fisherman', 'hunter', 'royal-ghost', 'fireball', 'the-log', 'skeletons', 'electro-spirit'];
  const before = A.scoreDeck(ids, ctx(false)).s; A.C['royal-giant'].p += 1;
  const after = A.scoreDeck(ids, { ...ctx(false), tag: 'x|' }).s; A.C['royal-giant'].p -= 1;
  assert.ok(after >= before - 1e-9, 'a stronger normal card must not lower the score');
  // The elixir limit holds when nothing is pinned.
  for (const cap of [3.0, 3.4]) {
    for (const d of A.generate({ locked: [], forms: {}, exclude: new Set(), ban: {}, style: 'any', maxAvg: cap, count: 3, maxChamps: 1, restarts: 60 })) assert.ok(d.avg <= cap + 1e-9, '1v1 deck over the elixir limit');
    const sd = () => ({ locked: [], forms: {}, exclude: new Set(), ban: {}, style: 'any', role: 'flex' });
    for (const p of A.generateDuo({ A: sd(), B: sd(), maxAvg: cap, count: 2, priority: 'balanced', names: { A: 'A', B: 'B' } })) assert.ok(p.sa.avg <= cap + 1e-9 && p.sb.avg <= cap + 1e-9, '2v2 deck over the elixir limit');
  }
  // Two cards swapping game IDs must both stay reachable.
  const a = A.CARD_IDS.vines, b = A.CARD_IDS['spirit-empress'];
  A.syncCards({ ids: { vines: b, 'spirit-empress': a } });
  assert.equal(A.ID_TO_CARD[b], 'vines'); assert.equal(A.ID_TO_CARD[a], 'spirit-empress');
  console.log('slot model, elixir limit and ID swap tests passed');
}
