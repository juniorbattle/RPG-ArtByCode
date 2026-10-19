// Ambient walkers (src/characters/ActorSystem.ts populate, journal Passes C1 / C2): by default round(5 x density) walkers, the five townsfolk
// in turn (the operator's decision of 2026-10-19, « Cinq par défaut »: at density 1 each approved townsperson walks once); `?crowd=<n>` spawns
// n of them, in turn too. The old random pick of the kind is still drawn, so the district RNG keeps every later draw in place.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

globalThis.window ??= { addEventListener() {} };
const { ActorSystem } = await load('/src/characters/ActorSystem.ts');
const THREE = await import('three');

const KINDS = ['crowd0', 'crowd1', 'crowd2', 'crowd3', 'crowd4'];
const atlas = { specs: new Map([...KINDS, 'player', 'porter'].map((id) => [id, { id, detail: 'crowd' }])), counts: new Map(), frames: new Map() };
const district = { walk: { x0: -13.5, x1: 26, z0: -3.2, z1: 4.05 }, colliders: [], npcs: [], spawn: [0, 0, 0.5], heightAt: () => 0 };
function crowd(count, seed = 1842, density = 1) {
  const sys = new ActorSystem(atlas);
  sys.crowdCount = count;
  sys.populate(district, density, seed);
  return { walkers: sys.actors.filter((a) => a.role === 'crowd'), porter: sys.actors.find((a) => a.spec === 'porter') };
}

test('default: round(5 x density) walkers, the five townsfolk in turn (decision C1, « Cinq par défaut »)', () => {
  assert.equal(crowd(null).walkers.length, 5);
  assert.deepEqual(crowd(null).walkers.map((a) => a.spec), KINDS);           // each approved townsperson once, in turn
  assert.equal(crowd(null, 1842, 2).walkers.length, 10);
  assert.deepEqual(crowd(null, 1842, 2).walkers.map((a) => a.spec), [...KINDS, ...KINDS]);
  assert.equal(crowd(null, 1842, 0.2).walkers.length, 1);
  assert.equal(crowd(null, 1842, 0).walkers.length, 0);
  for (const seed of [7719, 30417]) assert.deepEqual(crowd(null, seed).walkers.map((a) => a.spec), KINDS, `seed ${seed}`);
});

test('?crowd=<n> keeps setting the count, in turn', () => {
  assert.equal(crowd(8).walkers.length, 8);
  assert.deepEqual(crowd(2).walkers.map((a) => a.spec), ['crowd0', 'crowd1']);
  assert.equal(crowd(0).walkers.length, 0);
});

test('the default is exactly the former ?crowd=5, and the RNG draws stay in place', () => {
  for (const seed of [1842, 7719, 30417]) {
    const a = crowd(null, seed), b = crowd(5, seed);
    assert.equal(a.walkers.length, b.walkers.length);
    a.walkers.forEach((w, i) => { assert.ok(w.pos.equals(b.walkers[i].pos), `seed ${seed}, walker ${i}`); assert.equal(w.spec, b.walkers[i].spec); });
    assert.ok(a.porter.pos.equals(b.porter.pos), `seed ${seed}: the porter after them`);
    // fewer walkers keep the first ones where they stood (each walker draws the same values whatever the count)
    crowd(2, seed).walkers.forEach((w, i) => assert.ok(w.pos.equals(a.walkers[i].pos), `seed ${seed}, crowd=2 walker ${i}`));
  }
  // oracle measured on the code before Passe C2 (its ?crowd=5, seed 1842, this test district): the default must be those exact places,
  // which also holds only while the old random pick of the kind is still drawn
  const OLD_CROWD5 = [[-9.096452, -2.484877], [-10.430815, 2.085279], [-5.344796, 0.871441], [11.246686, 2.49917], [18.140877, 1.439683]];
  const d = crowd(null, 1842);
  d.walkers.forEach((w, i) => { assert.ok(Math.abs(w.pos.x - OLD_CROWD5[i][0]) < 1e-6 && Math.abs(w.pos.z - OLD_CROWD5[i][1]) < 1e-6, `walker ${i}`); });
  assert.ok(Math.abs(d.porter.pos.x - 17.401212) < 1e-6 && Math.abs(d.porter.pos.z - 1.391807) < 1e-6, 'the porter');
});
