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

test('the first morning on the quay: what follows, an event, what pays, an item, in that order; never a theft nor the wait (LA-5, LA-6)', () => {
  const st = v2(), list = T.todoHere(st);
  assert.ok(ok(st, 'steal').length && ok(st, 'wait').length, 'a theft and the wait are open on the quay (the case is reached)');
  assert.deepEqual(list.map((t) => [t.who ?? t.what, t.kind]), [['tam', 'follow'], ['piers', 'event'], ['mara', 'item'], ['bram', 'item']]);
  assert.equal(list[2].gain, ok(st, 'work')[0]?.gain, 'Mara\'s job: what it pays, as the action says');
  assert.ok(!list.some((t) => /steal|wait|rest|scout/.test(t.key)), JSON.stringify(list.map((t) => t.key)));
});

test('the training ground in the morning: the people first, then the practice sand and the drills, each once and spending the moment; watching a rival never (LA-5)', () => {
  const st = at(v2(), 'training', 'morning'), list = T.todoHere(st);
  assert.ok(ok(st, 'scout').length >= 1 && ok(st, 'train').length === 5 && ok(st, 'drillSkill').length >= 5, 'the cases are reached');
  const place = list.filter((t) => t.kind === 'place');
  assert.deepEqual(place.map((t) => [t.what, t.slot]), [['train', true], ['drill', true]], 'one line each, a slot each');
  assert.deepEqual(list.slice(-2), place, 'the place last');
  assert.ok(list.findIndex((t) => t.kind === 'event') > list.findIndex((t) => t.kind === 'follow'), 'what follows before an event');
  assert.ok(!list.some((t) => /scout/.test(t.key)));
  assert.deepEqual(T.todoHere(at(v2(), 'training', 'evening')), [], 'the sand shut at night: nothing to do there');
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
