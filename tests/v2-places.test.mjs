// The version 2's districts (lot V5; the operator's decisions AV-13 « Le cloud les bâtit, la revue en local après » and AV-14 « Cuits
// réutilisés, générés provisoires pour le reste », journal Passe V5): the forecourt, the training ground and the festival square in place of
// Lantern Row, open squares; who stands where at which hour; every person on a square has a spot inside its walkable surface; the default
// game keeps its three places, its people where they are and its pages.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const P = await load('/src/narrative/people.ts');
const VP = await load('/src/simulation/v2places.ts');
const PZ = await load('/src/world/Plazas.ts');

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const moves = (st) => G.actions(st).filter((o) => o.action.type === 'move').map((o) => o.action.to).sort();
const talks = (st) => G.actions(st).filter((o) => o.action.type === 'talk' && o.ok).map((o) => o.action.who).sort();
const SLOTS = ['morning', 'afternoon', 'evening'];

test('the places: the version 2 walks to the training ground and to the festival square by day as by night; the default game keeps its three', () => {
  assert.deepEqual(moves(v2()), ['forecourt', 'lanterns', 'training']);
  assert.deepEqual(moves(G.namedState('day1-morning')), ['forecourt', 'lanterns']);
  assert.equal(G.advance(G.namedState('day1-morning'), { type: 'move', to: 'training' }).reason, 'No such place.');
  assert.match(G.advance(G.namedState('day1-morning'), { type: 'move', to: 'lanterns' }).reason, /sleeps until dusk/);
  const sq = act(v2(), { type: 'move', to: 'lanterns' });
  assert.equal(sq.place, 'lanterns');
  assert.equal(G.placeName('lanterns', true), 'the Festival Square'); assert.equal(G.placeName('training', true), 'the Training Ground');
  assert.equal(G.placeName('lanterns'), 'Lantern Row'); assert.equal(G.placeName('forecourt'), 'the Arena Forecourt'); assert.equal(G.placeName('district'), 'the Merchant District');
});

test('who stands where: the teachers and Orla at the training ground, the bard and Pip on the square; today\'s game keeps Orla on the forecourt', () => {
  const at = (place, slot = 'morning', name = 'day1-morning', flag = true) => { const s = flag ? v2(name) : G.namedState(name); s.place = place; s.slot = slot; return talks(s); };
  assert.deepEqual(at('training'), ['corvin', 'drill', 'ilse', 'orla']);
  assert.deepEqual(at('training', 'evening'), []);
  assert.deepEqual(at('forecourt'), ['anwen', 'hilde', 'marek', 'odo', 'vessa']);
  assert.deepEqual(at('lanterns', 'afternoon'), ['bard', 'lio', 'pip']);
  assert.deepEqual(at('lanterns', 'evening'), ['bard', 'cassius', 'lio', 'pip']);
  assert.deepEqual(at('forecourt', 'morning', 'day1-morning', false), ['anwen', 'marek', 'odo', 'orla', 'vessa']);
  assert.deepEqual(at('lanterns', 'evening', 'day1-morning', false), ['cassius', 'lio']);
  // sparring with Orla and the practice sand follow her to the training ground
  const tr = act(v2(), { type: 'move', to: 'training' }), types = G.actions(tr).map((o) => o.action.type);
  assert.ok(types.includes('spar') && types.includes('train') && types.includes('buySkill'));
  const fc = act(v2(), { type: 'move', to: 'forecourt' }), ft = G.actions(fc).map((o) => o.action.type);
  assert.ok(!ft.includes('spar') && !ft.includes('train'));
  assert.match(G.advance(fc, { type: 'train' }).reason, /Training Ground/);
  const def = act(G.namedState('day1-morning'), { type: 'move', to: 'forecourt' });
  assert.ok(G.actions(def).some((o) => o.action.type === 'spar') && G.actions(def).some((o) => o.action.type === 'train'));
});

test('every person on a square, at every hour of every named state, has a spot inside the walkable surface; the crowd walks inside it', () => {
  const inside = ([x, z], kind) => { const W = PZ.PLAZA_WALKS[kind]; return x >= W.x0 && x <= W.x1 && z >= W.z0 && z <= W.z1; };
  // (none nearer the camera than its framings' foot: z 1 where they stand south, x 10 on the lists seen from the east, journal Passe VP9)
  const far = ([x, z], kind) => (kind === 'training' ? x <= 10 : z <= 1);
  for (const name of Object.keys(G.NAMED_STATES)) for (const place of ['forecourt', 'training', 'lanterns']) for (const slot of SLOTS) {
    const s = v2(name); s.place = place; s.slot = slot;
    const kind = VP.PLAZA_OF[place], spots = PZ.PLAZA_SPOTS[kind];
    for (const id of VP.plazaPeople(s)) { assert.ok(spots[id], `${id} has a spot on the ${kind} (${name} ${slot})`); assert.ok(inside(spots[id], kind), `${id} inside`); }
    if (!s.over) for (const p of VP.plazaPeople(s)) if (P.PEOPLE[p]) assert.ok(talks(s).includes(p), `${p} on the ${kind} can be talked to`);
  }
  for (const kind of ['forecourt', 'training', 'festival']) for (const [period, pts] of Object.entries(PZ.PLAZA_GATHER[kind])) { assert.ok(pts.length >= 5, `${kind} ${period}`); for (const w of pts) assert.ok(inside(w, kind) && far(w, kind), `${kind} ${period} point ${w}`); }
  // the extras: the guards at the forecourt's gate; no hooded figure on the square at any hour (journal Passe VP1: the stranger of the
  // simulation is on the quay, and an extra one could not talk to read as him)
  const fc = v2(); fc.place = 'forecourt'; assert.ok(VP.plazaPeople(fc).includes('guardA'));
  for (const slot of SLOTS) { const sq = v2(); sq.place = 'lanterns'; sq.slot = slot; assert.ok(!VP.plazaPeople(sq).includes('hooded'), slot); }
  assert.ok(VP.PLAZA_CROWD.midday > VP.PLAZA_CROWD.night);
});

test('the pages: a version 2 game opens the squares; the default game\'s forecourt and Lantern Row pages are today\'s', () => {
  const src = fs.readFileSync(new URL('../src/ui/play.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const plaza = src.indexOf("isV2(state) && state.place !== 'district'"), fore = src.indexOf("state.place === 'forecourt'"), arena = src.indexOf("b.params.get('scene') === 'arena'");
  assert.ok(arena > 0 && plaza > arena && fore > plaza, 'the arena first, the squares for a version 2 game, then today\'s pages');
  assert.match(src, /s\.place === 'lanterns' && !isV2\(s\) \? 'night'/);
  const town = fs.readFileSync(new URL('../src/ui/playPlaza.ts', import.meta.url), 'utf8');
  assert.match(town, /PlazaApp/);
});
