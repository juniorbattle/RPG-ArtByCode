// Where a version 2 game's player can go (the operator's trial of 2026-11-11, journal Passe AL1, word for word: « durant mes tests je ne suis pas parvenu a acceder
// au training ground lors du premier jour »). Every place at every moment of every day: the move to it allowed from every other place, or refused with the
// reason its way's tag says (the parade's evening, MK-14); on foot, every way out of every square reached from every way in, by day and by night
// (the moments and the tiers change no walk); the Training Ground open at night while its practice sand is not, which the way's tag and the map's line say with the reason, as the drills' refusals.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const ST = await load('/src/simulation/state.ts');
const ACC = await load('/src/simulation/v2access.ts');
const VP = await load('/src/simulation/v2places.ts');
const FE = await load('/src/simulation/v2festival.ts');
const LAB = await load('/src/tournament/lab.ts');
const TXT = await load('/src/narrative/text/index.ts');
const { FR } = await load('/src/narrative/text/fr.ts');
const PZ = await load('/src/world/Plazas.ts');
(await load('/src/materials/CanvasArt.ts')).setTournamentHeraldry(true);
const lib = { ground: Object.assign(new THREE.ShaderMaterial(), { uniforms: { tGroundMask: { value: null }, uGroundRect: { value: new THREE.Vector4() } } }), slot: new Proxy({}, { get: (o, k) => (o[k] ??= new THREE.MeshBasicMaterial()) }) };

const tx = TXT.tx;
const at = (st, place, slot, day) => { const s = structuredClone(st); s.place = place; s.slot = slot; s.day = day; return s; };
const moveTo = (s, to) => G.actions(s).find((o) => o.action.type === 'move' && o.action.to === to);
const v2 = () => G.makeV2(G.newGame(1842, 'Ren'));

test('every place at every moment of every day: open from every other place, or shut with its reason (only the parade\'s street, on its evening)', () => {
  const base = v2();
  let shut = 0;
  for (let day = 1; day <= 10; day++) for (const slot of ST.SLOTS) for (const from of ST.V2_PLACES) for (const to of ST.V2_PLACES) {
    if (to === from) continue;
    const s = at(base, from, slot, day), o = moveTo(s, to), why = ACC.wayShut(s, to);
    assert.ok(o, `day ${day} ${slot}: ${from} lists the way to ${to}`);
    const parade = day === FE.FESTIVAL_DAY && slot === 'evening' && [from, to].sort().join() === 'forecourt,lanterns';
    if (parade) {
      shut++;
      assert.equal(o.ok, false, `day ${day} ${slot}: the parade fills ${from} -> ${to}`);
      assert.equal(o.reason, tx('v2.fest.wayShut'), 'the refusal says why');
      assert.equal(why, o.reason, 'the way\'s tag says the same reason');
    } else {
      assert.ok(o.ok, `day ${day} ${slot}: ${from} -> ${to} refused: ${o.reason}`);
      assert.equal(why, null, `day ${day} ${slot}: ${from} -> ${to} not shut`);
    }
  }
  assert.equal(shut, 2, 'the parade\'s street, both ways, on day 9\'s evening (the test reaches the case)');
});

test('the Training Ground on the first day: reached from the quay and the forecourt at every moment; its sand open by day, shut at dusk, and said so', () => {
  const base = v2();
  for (const slot of ST.SLOTS) for (const from of ['district', 'forecourt', 'lanterns']) {
    const s = at(base, from, slot, 1), o = moveTo(s, 'training');
    assert.ok(o.ok, `day 1 ${slot}: ${from} -> training: ${o.reason}`);
    const r = G.advance(s, o.action); assert.ok(r.ok); assert.equal(r.state.place, 'training');
    const drills = G.actions(r.state).filter((x) => x.action.type === 'train');
    assert.ok(drills.length > 0, 'the sand\'s sessions are listed there');
    const note = ACC.placeNote(s, 'training');
    if (slot === 'evening') {
      assert.ok(drills.every((x) => !x.ok && x.reason === tx('train.closed')), `day 1 evening: the sand closes at dusk (${drills.map((x) => x.reason)})`);
      assert.equal(note, tx('v2.access.sandNight'), 'the way and the map say the sand is shut until dawn');
      assert.equal(o.label, tx('move.labelNote', { place: ST.placeName('training', true), note }), 'the map\'s line says it');
    } else {
      assert.ok(drills.some((x) => x.ok), `day 1 ${slot}: a session open (${drills.map((x) => x.reason)})`);
      assert.equal(note, null, `day 1 ${slot}: nothing shut`);
      assert.equal(o.label, tx('move.label', { place: ST.placeName('training', true) }));
    }
  }
});

test('what is shut at the Training Ground is said exactly when its sand refuses a session, in whole games (the evening, the brawl, Rhosk)', () => {
  const seen = { evening: 0, brawl: 0, rhosk: 0, open: 0 };
  const check = (st) => {
    const there = at(st, 'training', st.slot, st.day), note = ACC.placeNote(st, 'training');
    const refused = G.actions(there).filter((x) => x.action.type === 'train').map((x) => x.reason);
    const sand = refused.find((r) => r === tx('train.closed') || r === tx('v2.sand.rhosk') || r === tx('v2.sand.brawl')) ?? null;
    const want = { [tx('train.closed')]: tx('v2.access.sandNight'), [tx('v2.sand.rhosk')]: tx('v2.access.sandRhosk'), [tx('v2.sand.brawl')]: tx('v2.access.sandBrawl') };
    assert.equal(note, sand ? want[sand] : null, `day ${st.day} ${st.slot}: the note (${note}) and the sand's refusal (${sand})`);
    seen[sand === tx('train.closed') ? 'evening' : sand === tx('v2.sand.rhosk') ? 'rhosk' : sand ? 'brawl' : 'open']++;
  };
  for (const [seed, pol] of [[1, 'curious'], [6, 'diligent']]) {
    let st = G.makeV2(G.newGame(seed, 'Ren'));
    for (let i = 0; i < 500 && !st.over; i++) { check(st); const r = G.advance(st, LAB.POLICIES[pol].choose(st)); assert.ok(r.ok, r.reason); st = r.state; }
  }
  // Rhosk on the sand and the brawl's morning, from their named states (the games above may not meet them)
  check(G.namedState('v2-sand-training'));
  const brawl = at(v2(), 'training', 'morning', 3); brawl.flags['brawl:3'] = true; check(brawl);
  assert.ok(seen.evening > 0 && seen.open > 0 && seen.rhosk > 0 && seen.brawl > 0, `every case reached: ${JSON.stringify(seen)}`);
});

test('the guide says how the places connect: two squares open from the quay, the Training Ground from the forecourt', () => {
  for (const lang of ['en', 'fr']) {
    TXT.useLanguage(lang, FR);
    try {
      const body = TXT.tx('tut.ch.places.body', { quay: 'Q', a: 'A', b: 'B', c: 'C' });
      assert.ok(!/three squares open from it|trois places s.ouvrent/i.test(body), `${lang}: no « three squares open from the quay »: the quay has two ways (${body})`);
      assert.ok(body.includes('{') === false && body.includes('C'), `${lang}: the Training Ground named in the guide`);
    } finally { TXT.useLanguage('en'); }
  }
  // the quay has two ways, the forecourt three, the Training Ground one: the guide's sentence is the graph's
  assert.deepEqual(VP.V2_EXITS.district.map((e) => e.to).sort(), ['forecourt', 'lanterns']);
  assert.ok(VP.V2_EXITS.forecourt.some((e) => e.to === 'training') && VP.V2_EXITS.training.every((e) => e.to === 'forecourt'));
});

test('on foot: every way out of every square reached from every way in, by day and by night (the squares\' own walk)', () => {
  const inR = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
  const shapes = new Map();
  // (the moments and the festival's tiers change the light and the garlands, not the walk: fifteen builds gave three shapes, journal Passe AL1; by day and by night here)
  for (const kind of ['forecourt', 'training', 'festival']) for (const [day, period, bunting] of [[true, 'midday', 3], [false, 'night', 3]]) {
    const b = PZ.buildPlaza(lib, kind, 1842, { day, period, bunting });
    const key = JSON.stringify([kind, b.walk, b.lanes, b.blockers.map((o) => [o.x, o.z, o.r]), b.exits.map((e) => [e.to, e.lane, e.out, e.spawn])]);
    if (!shapes.has(key)) shapes.set(key, { kind, b, at: `${period} b${bunting}` });
  }
  let pairs = 0;
  for (const { kind, b, at: when } of shapes.values()) for (const from of b.exits) {
    // a flood over the walk with the hero's own steps (walkTo, half a metre in eight directions: the narrowest passage to a way is about three metres) from the way in
    const key = (x, z) => `${Math.round(x * 4)},${Math.round(z * 4)}`, seen = new Set([key(...from.spawn)]), reached = new Set();
    let q = [from.spawn];
    while (q.length) {
      const nq = [];
      for (const [x, z] of q) for (let a = 0; a < 8; a++) {
        const [px, pz] = PZ.walkTo(b, x, z, x + Math.cos(a * Math.PI / 4) * 0.5, z + Math.sin(a * Math.PI / 4) * 0.5);
        for (const e of b.exits) if (inR(e.out, px, pz) && inR(e.lane, px, pz)) reached.add(e.to);
        if (b.exits.some((e) => inR(e.out, px, pz))) continue;
        const k = key(px, pz); if (!seen.has(k)) { seen.add(k); nq.push([px, pz]); }
      }
      q = nq;
    }
    for (const to of b.exits) { if (to === from) continue; pairs++; assert.ok(reached.has(to.to), `${kind} (${when}): from the way in from ${from.to}, the way to ${to.to} is reached on foot`); }
  }
  assert.ok(pairs >= 8, `the squares' ways walked (${pairs} pairs, ${shapes.size} shapes)`);
});
