// What there is to do here (the operator's LA1 sheet, journal Passe LA2, nine of nine: LA-5 « Le combat, les personnes qui ont du neuf et les activités du lieu
// (jamais un vol, le repos, l’attente) », LA-6 « Le combat, une suite, un événement, ce qui rapporte, un objet, le lieu », LA-7 « L’aperçu part une fois la liste
// ouverte (ou après 8 s) ; le nombre reste ; tout revient avec une nouveauté », LA-9 « La bande de la visite et une ligne du guide, pas de conseil »). The oracles
// are the decisions written out here: who offers what at a given moment, read from the game's own actions and refusals, not from the list's table.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const T = await load('/src/simulation/v2todo.ts');
const TUT = await load('/src/ui/tutorial.ts');
const TXT = await load('/src/narrative/text/index.ts');
const FR = (await load('/src/narrative/text/fr-texts.ts')).FR_TEXTS;

const v2 = () => G.makeV2(G.namedState('day1-morning'));
const at = (st, place, slot, day) => { const s = structuredClone(st); s.place = place; s.slot = slot; if (day) s.day = day; return s; };
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const ok = (st, type) => G.actions(st).filter((o) => o.ok && o.action.type === type);

// Tam's steel cargo is a quest to take since journal Passe QE2 (the operator's Q-07 « Ainsi »: a quest offered wears the filled diamond, an event; before it the talk's
// quest was a follow-up)
test('the first morning on the quay: the events (Tam\'s quest to take, a challenge), what pays, an item, in that order; never a theft nor the wait (LA-5, LA-6, Q-07)', () => {
  const st = v2(), list = T.todoHere(st);
  assert.ok(ok(st, 'steal').length && ok(st, 'wait').length, 'a theft and the wait are open on the quay (the case is reached)');
  // Nell, the quay's passer-by in the morning (journal Passe PN1, GP-06 « Un passant par lieu et par moment (douze) »), her piece an item
  assert.deepEqual(list.map((t) => [t.who ?? t.what, t.kind]), [['tam', 'event'], ['piers', 'event'], ['mara', 'item'], ['bram', 'item'], ['nell', 'item']]);
  // the list says what (GP-11, Q-07): Tam's quest by its name, Mara's job before her goods
  assert.deepEqual(list.map((t) => t.act), ['quest:cargo', 'challenge', 'work', 'upgradeWeapon', 'barter']);
  assert.equal(list[2].gain, ok(st, 'work')[0]?.gain, 'Mara\'s job: what it pays, as the action says');
  assert.ok(!list.some((t) => /steal|wait|rest|scout/.test(t.key)), JSON.stringify(list.map((t) => t.key)));
});

test('the training ground in the morning: the people first, then the practice sand and the drills, each once and spending the moment; watching a rival who is not the next opponent never (LA-5, GP-16)', () => {
  const st = at(v2(), 'training', 'morning'), list = T.todoHere(st);
  assert.ok(ok(st, 'scout').length >= 1 && ok(st, 'train').length === 5 && ok(st, 'drillSkill').length >= 5, 'the cases are reached');
  const place = list.filter((t) => t.kind === 'place');
  assert.deepEqual(place.map((t) => [t.what, t.slot]), [['train', true], ['drill', true]], 'one line each, a slot each');
  assert.deepEqual(list.slice(-2), place, 'the place last');
  assert.ok(list.findIndex((t) => t.kind === 'event') > list.findIndex((t) => t.kind === 'follow'), 'what follows before an event');
  assert.ok(!list.some((t) => /scout/.test(t.key)));
  // the sand shut at night: only Dov Harl, the lists' passer-by in the evening (GP-06), and his piece
  assert.deepEqual(T.todoHere(at(v2(), 'training', 'evening')).map((t) => [t.who ?? t.what, t.kind]), [['dov', 'item']], 'the sand shut at night: nothing to do there but the piece of Dov');
});

test('GP-16: the next opponent watched where they train while there is more to see of them, then Master Corvin\'s rehearsal while it is to do, each a line spending the moment; never another rival', async () => {
  const UI = await load('/src/ui/todo.ts');
  // day 1: the next opponent is Vessa (day 2), at practice on the forecourt with Marek
  const fc = at(v2(), 'forecourt', 'morning'), list = T.todoHere(fc);
  assert.ok(ok(fc, 'scout').some((o) => o.action.who === 'marek') && ok(fc, 'scout').some((o) => o.action.who === 'vessa'), 'both can be watched there (the case is reached)');
  assert.deepEqual(list.filter((t) => t.what === 'scout').map((t) => [t.foe, t.kind, t.slot]), [['vessa', 'place', true]]);
  assert.ok(!list.some((t) => t.foe === 'marek' || t.who === 'marek'), 'another rival never');
  // the rival herself wears no diamond for being watched (MK-6 kept): her person's line, there for her challenge of the first day, is the same without the watch
  const her = list.find((t) => t.who === 'vessa'), noWatch = structuredClone(fc); noWatch.facts.push('scouted:vessa', 'scouted2:vessa');
  assert.equal(her?.key, T.todoHere(noWatch).find((t) => t.who === 'vessa')?.key);
  assert.match(UI.todoLine(fc, list.find((t) => t.what === 'scout')), /Watch Vessa Lark, your next opponent/);
  assert.equal(FR['ui.todo.scout'].includes('{name}') && FR['ui.todo.rehearse'].includes('{name}'), true);
  // watched today: nothing more to see of her today; the rehearsal is open on the training ground
  const w = act(fc, { type: 'scout', who: 'vessa' });
  assert.ok(!T.todoHere(at(w, 'forecourt', 'afternoon')).some((t) => t.what === 'scout'), 'the second watch is another day');
  const tr = at(w, 'training', 'afternoon'), tl = T.todoHere(tr);
  assert.deepEqual(tl.filter((t) => t.what === 'rehearse').map((t) => [t.foe, t.slot]), [['vessa', true]]);
  assert.match(UI.todoLine(tr, tl.find((t) => t.what === 'rehearse')), /Rehearse your bout against Vessa Lark's shadow/);
  // one line for one thing: Master Corvin's own line, when he has something else new, never counts the rehearsal twice
  assert.ok(!tl.filter((t) => t.who === 'corvin').some((t) => t.key.includes('rehearse')));
  // rehearsed with what is known of her: the line goes; once her plan is seen it comes back, and the second watch, the next day
  const done = at(act(tr, { type: 'rehearse' }), 'training', 'afternoon');
  assert.ok(!T.todoHere(done).some((t) => t.what === 'rehearse'));
  const plan = structuredClone(done); plan.facts.push('scouted2:vessa');
  assert.ok(T.todoHere(plan).some((t) => t.what === 'rehearse' && t.foe === 'vessa'));
  assert.ok(T.todoHere(at(done, 'forecourt', 'morning', 2)).some((t) => t.what === 'scout' && t.foe === 'vessa'), 'the second watch, another day');
  // her plan known: nothing more to see
  assert.ok(!T.todoHere(at(plan, 'forecourt', 'morning', 2)).some((t) => t.what === 'scout'));
});

test('the day\'s bout comes first; a person talked to leaves the list (LA-6; MK-4)', () => {
  const st = G.makeV2(G.namedState('v2-day2-afternoon'));
  const list = T.todoHere(st);
  assert.deepEqual([list[0].kind, list[0].what], ['bout', 'fight']);
  const q = v2(), after = act(q, { type: 'talk', who: 'mara' });
  assert.ok(T.todoHere(q).some((t) => t.who === 'mara') && !T.todoHere(after).some((t) => t.who === 'mara'), 'her dialogue opened, she has nothing new');
});

test('what pays ranks before an item that does not (LA-6: « ce qui rapporte, un objet »)', () => {
  const st = v2(), list = T.todoHere(st);
  const mara = list.findIndex((t) => t.who === 'mara'), bram = list.findIndex((t) => t.who === 'bram');
  assert.ok(list[mara].gain > 0 && !list[bram].gain && mara < bram);
});

test('what was seen in the list is saved with the game, left out of its fingerprint, and the moment is told (LA-7)', () => {
  const st = v2(), list = T.todoHere(st), before = G.hash(st);
  T.seeTodo(st, list);
  assert.equal(G.hash(st), before, 'the fingerprint ignores it');
  assert.ok(T.todoSeen(st).has(T.openedKey(st)), 'opened here at this moment');
  assert.deepEqual(T.freshTodo(list, T.todoSeen(st)), [], 'nothing new once seen');
  const back = G.deserialize(G.serialize(st));
  assert.deepEqual(back.v2.$todo, st.v2.$todo, 'the save keeps it');
  // a new thing: the next day's job at Mara's
  const next = at(back, 'district', 'morning', 2);
  assert.ok(T.freshTodo(T.todoHere(next), T.todoSeen(next)).length > 0, 'the next day brings something new');
  for (let i = 0; i < 400; i++) T.seeTodo(st, [{ key: `x${i}`, kind: 'item' }]);
  assert.ok(st.v2.$todo.length <= 160, 'the kept keys stay few');
});

test('today\'s game has nothing of it', () => {
  assert.deepEqual(T.todoHere(G.namedState('day1-morning')), []);
});

test('the tour\'s band and a guide line say it, in English and in French, no digit of their own (LA-9)', () => {
  const st = v2(), ch = TUT.CHAPTERS.find((c) => c.id === 'moving');
  assert.ok(TUT.chapterText(st, ch).endsWith(TXT.tx('tut.ch.moving.todo')), 'a line after the chapter\'s own text');
  for (const k of ['tut.ch.moving.todo', 'tut.tour.list.body']) {
    assert.match(FR[k], /\[Q\]/); assert.doesNotMatch(FR[k], /\d/);
    assert.match(TXT.tx(k), /\[Q\]/); assert.doesNotMatch(TXT.tx(k), /\d/);
  }
});

test('the order of LA-6, whatever the order the people stand in: the bout, what follows, an event, what pays, an item, the place', () => {
  const td = (key, kind, gain) => ({ key, kind, ...(gain ? { gain } : {}) });
  const given = [td('place', 'place'), td('item', 'item'), td('pays', 'item', 10), td('event', 'event'), td('follow', 'follow'), td('bout', 'bout'), td('item2', 'item')];
  assert.deepEqual(T.orderTodo(given).map((t) => t.key), ['bout', 'follow', 'event', 'pays', 'item', 'item2', 'place']);
});
