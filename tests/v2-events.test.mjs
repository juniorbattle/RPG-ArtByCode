// The version 2's dynamic events (lot V7; the operator's decision AV-16 « Relier et compléter », journal Passe V7): today's eighteen tied to
// the new systems, each district its own events by day and by night, the elimination phase's targeted sabotage with its signs and its
// answers (GAMEPLAY § 9), each event's effect on the new systems (prices, thefts, the gear in a duel). Today's game reads today's catalogue.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const E = await load('/src/events/engine.ts');
const CAT = await load('/src/events/catalog.ts');
const V = await load('/src/events/v2catalog.ts');
const VG = await load('/src/simulation/v2gear.ts');
const VS = await load('/src/simulation/v2skills.ts');
const T = await load('/src/simulation/v2town.ts');
const { Rng } = await load('/src/core/rng.ts');

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const byId = Object.fromEntries(V.V2_EVENTS.map((e) => [e.id, e]));
const run = (s, ids) => { const out = []; E.runEvents(s, s.pulse, (e) => { out.push(e); return e; }, new Rng(1), ids.map((id) => byId[id] ?? CAT.EVENTS.find((x) => x.id === id))); return out; };

test('today\'s game reads today\'s eighteen events; a version 2 game reads them, then its own', () => {
  assert.equal(CAT.EVENTS.length, 18);
  const src = fs.readFileSync(new URL('../src/simulation/slot.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  assert.match(src, /s\.flags\.v2 === true \? V2_CATALOG : EVENTS/);
  assert.ok(V.V2_EVENTS.every((e) => e.id.startsWith('v2-')), 'their own ids');
  assert.equal(new Set([...CAT.EVENTS, ...V.V2_EVENTS].map((e) => e.id)).size, CAT.EVENTS.length + V.V2_EVENTS.length);
  // the festival square in Lantern Row's place: today's text for today's game, the square's for a version 2 game
  const nm = CAT.EVENTS.find((e) => e.id === 'night-market'), d = G.namedState('day1-morning');
  assert.match(nm.outcomes.find((o) => !o.when || E.holds(o.when, d, d.pulse)).text, /Lantern Row/);
  const s = v2(); assert.match(nm.outcomes.find((o) => !o.when || E.holds(o.when, s, s.pulse)).text, /festival square/);
});

test('each district has its events by day and by night', () => {
  const where = {
    district: ['v2-steel-caravan', 'v2-quay-alert'], forecourt: ['v2-bookmakers', 'v2-gate-vigil'], training: ['v2-masterclass', 'v2-barracks-brawl'],
    festival: ['v2-puppet-show', 'v2-lantern-parade', 'v2-card-sharps'],
  };
  for (const [place, ids] of Object.entries(where)) {
    const evs = ids.map((id) => byId[id]); assert.ok(evs.every(Boolean), place);
    assert.ok(evs.some((e) => e.slots.some((x) => x !== 'evening')), `${place} by day`);
    assert.ok(evs.some((e) => e.slots.includes('evening')), `${place} at night`);
  }
});

test('the gear\'s sabotage: two signs, at least two answers; the strap cut makes the next bout hurt more; Hilde\'s check or the paid watch answer it', () => {
  const ev = byId['v2-gear-tamper'];
  assert.ok(ev.major.signs.length >= 2 && ev.major.answers.length >= 2);
  for (const sign of ev.major.signs) assert.ok(byId[sign], sign);
  const base = () => { const s = v2(); s.competitors.cassius.relationships.player = -40; s.tournament.matches.push({ round: 4, a: 'player', b: 'marek', winner: null, close: false, day: 6, seen: true, stage: 'semi' }); s.day = 5; s.slot = 'evening'; s.flags['ev:v2-sign-armourer'] = 10; return s; };
  const s = base(); assert.equal(run(s, ['v2-gear-tamper'])[0].id, 'v2-gear-tamper');
  assert.ok(s.flags['tampered:6'] && !s.flags['tampered:5']);
  s.day = 6; s.slot = 'morning'; s.place = 'forecourt';
  const hurt = VG.v2Mods(s).taken, clean = VG.v2Mods({ ...s, flags: { ...s.flags, 'tampered:6': undefined } }).taken;
  assert.equal(hurt, +(clean * 1.15).toFixed(4));
  // Hilde finds it: the strap stitched, the culprit known once the sign was seen
  s.facts.push('armour-asked'); s.player.coins = 20;
  const r = G.advance(s, { type: 'checkGear' }); assert.ok(r.ok, r.reason);
  assert.equal(r.events[0].id, 'check:found'); assert.equal(VG.v2Mods(r.state).taken, clean); assert.equal(r.state.flags['culprit-known'], 'cassius'); assert.equal(r.state.player.coins, 15);
  // the paid watch catches the servant: no strap cut
  const w = base(); w.services.forgeWatch = true; run(w, ['v2-gear-tamper']);
  assert.ok(w.facts.includes('tamper-foiled') && !w.flags['tampered:6']);
  // once only
  const again = base(); run(again, ['v2-gear-tamper']); again.day = 7; assert.equal(run(again, ['v2-gear-tamper']).length, 0);
});

test('what the events change: the master\'s lesson, the alert after a theft, a challenge won, the steel caravan', () => {
  const s = v2(); s.place = 'training'; const before = VS.skillPrice(s, 't3');
  s.flags['lesson:1'] = true; assert.equal(VS.skillPrice(s, 't3'), Math.round(before * 0.8));
  const t = v2(); const c = T.stealChance(t, 'mara'); t.flags['alert:1'] = true; assert.ok(Math.abs(c - 0.15 - T.stealChance(t, 'mara')) < 1e-9 || T.stealChance(t, 'mara') === 0.05);
  const caught = v2(); caught.slot = 'evening'; caught.flags['caught:1'] = true;
  const evs = run(caught, ['v2-quay-alert', 'v2-thief-talk']).map((e) => e.id); assert.deepEqual(evs, ['v2-quay-alert', 'v2-thief-talk']); assert.ok(caught.flags['alert:2']);
  const ch = v2(); ch.flags['challenge-won'] = true; assert.equal(run(ch, ['v2-challenge-fame']).length, 1);
  const car = v2(); car.services.forge = 'repaired'; car.services.shopFactor = 1.4; car.flags['ev:steel-shortage'] = 3; run(car, ['v2-steel-caravan']); assert.equal(car.services.shopFactor, 1);
  // a version 2 condition never holds in today's game
  assert.equal(E.holds({ v2: true }, G.namedState('day1-morning'), G.namedState('day1-morning').pulse), false);
});
