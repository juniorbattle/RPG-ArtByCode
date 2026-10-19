// Ambient walkers (src/characters/ActorSystem.ts populate, journal Passe C1): as approved, round(2 x density) walkers of randomly picked
// townsfolk kinds; `?crowd=<n>` (a staging proposal) spawns n of them, the five kinds in turn, and draws the district RNG exactly as before
// for the walkers both have (positions and every later spawn of the default stay put).
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

test('approved: round(2 x density) walkers of picked kinds', () => {
  assert.equal(crowd(null).walkers.length, 2);
  assert.equal(crowd(null, 1842, 2).walkers.length, 4);
  assert.equal(crowd(null, 1842, 0.2).walkers.length, 0);
  // the kinds the RNG picks in this test district (regression values, measured on purpose: a change of the default picks must show)
  assert.deepEqual(crowd(null, 1842).walkers.map((a) => a.spec), ['crowd4', 'crowd0']);
  assert.deepEqual(crowd(null, 7719).walkers.map((a) => a.spec), ['crowd0', 'crowd0']);
  assert.deepEqual(crowd(null, 30417).walkers.map((a) => a.spec), ['crowd1', 'crowd3']);
});

test('?crowd=5: the five townsfolk, once each', () => {
  const w = crowd(5).walkers;
  assert.equal(w.length, 5);
  assert.deepEqual(w.map((a) => a.spec).sort(), KINDS);
  assert.equal(crowd(8).walkers.length, 8);
  assert.equal(crowd(0).walkers.length, 0);
});

test('?crowd draws the RNG as before: the walkers both have stand where they stood', () => {
  for (const seed of [1842, 7719, 30417]) {
    const a = crowd(null, seed).walkers, b = crowd(5, seed).walkers;
    a.forEach((w, i) => assert.ok(w.pos.equals(b[i].pos), `seed ${seed}, walker ${i}`));
    // and with as many walkers as the default, the porter after them too (only the kinds differ)
    const c = crowd(2, seed);
    assert.ok(crowd(null, seed).porter.pos.equals(c.porter.pos), `seed ${seed}: the porter`);
  }
});
