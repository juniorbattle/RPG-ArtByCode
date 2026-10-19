// The five-view rule (journal Passe V5, decision H3 of 2026-10-19, « Cinq vues, le héros d'abord »): sectors of the on-screen step's angle
// from the vertical (front / back < 22.5 deg, three-quarter 22.5-67.5, profile beyond), each edge held 5 deg; only for the sheets that hold
// both three-quarter facings (idle + walk), and only with ActorSystem.views5 (DEV ?views=5). Every other sprite keeps the three-view rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

globalThis.window ??= { addEventListener() {} };
const { ActorSystem, fiveViewFacing } = await load('/src/characters/ActorSystem.ts');
const THREE = await import('three');

/** a screen step at `deg` from the vertical, upward (away) or downward (toward the camera), rightward */
const step = (deg, up, right = true) => { const r = deg * Math.PI / 180; return [Math.sin(r) * (right ? 1 : -1), Math.cos(r) * (up ? 1 : -1)]; };

test('sectors: front / back below 22.5 deg, three-quarter to 67.5, profile beyond (from a neutral start)', () => {
  const at = (deg, up, prev = up ? 'up' : 'down') => fiveViewFacing(prev, ...step(deg, up));
  assert.equal(at(0, false), 'down'); assert.equal(at(0, true), 'up');
  assert.equal(at(20, false), 'down'); assert.equal(at(35, false), 'downSide'); assert.equal(at(35, true), 'upSide');
  assert.equal(at(60, true), 'upSide'); assert.equal(at(75, true), 'side'); assert.equal(at(90, false), 'side');
  // the left / right mirror gives the same view
  assert.equal(fiveViewFacing('down', ...step(35, false, false)), 'downSide');
});

test('each edge is held 5 deg past it from the side the walker is on: no flicker on a straight walk', () => {
  // front -> three-quarter at 27.5, back at 17.5
  assert.equal(fiveViewFacing('down', ...step(26, false)), 'down');
  assert.equal(fiveViewFacing('down', ...step(29, false)), 'downSide');
  assert.equal(fiveViewFacing('downSide', ...step(19, false)), 'downSide');
  assert.equal(fiveViewFacing('downSide', ...step(16, false)), 'down');
  // three-quarter -> profile at 72.5, back at 62.5
  assert.equal(fiveViewFacing('upSide', ...step(70, true)), 'upSide');
  assert.equal(fiveViewFacing('upSide', ...step(74, true)), 'side');
  assert.equal(fiveViewFacing('side', ...step(64, true)), 'side');
  assert.equal(fiveViewFacing('side', ...step(61, true)), 'upSide');
  // a sweep 0 -> 90 -> 0 changes view exactly 4 times (front, 3/4, profile, 3/4, front), never back and forth
  let prev = 'down', changes = 0;
  for (const d of [...Array(91).keys(), ...[...Array(91).keys()].reverse()]) { const v = fiveViewFacing(prev, ...step(d, false)); if (v !== prev) changes++; prev = v; }
  assert.equal(changes, 4);
});

// ActorSystem: a walker seen through camera B's pose, facing every heading; a sheet with or without three-quarter frames
function system(with34, views5) {
  const frames = new Map(), specs = new Map([['sheet', { id: 'sheet', detail: 'crowd' }]]);
  for (const d of ['down', 'up', 'side', ...(with34 ? ['downSide', 'upSide'] : [])]) for (const m of ['idle', 'walk']) frames.set(`sheet/${d}/${m}/0`, {});
  const cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 200);
  cam.position.set(-20, 5.5, 15); cam.lookAt(0, 1, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const sys = new ActorSystem({ specs, counts: new Map(), frames }, cam);
  sys.views5 = views5;
  const a = sys.spawn('sheet', 'crowd', new THREE.Vector3(0, 0, 0));
  return { sys, a };
}
const headings = [...Array(72).keys()].map((i) => (i * 5 * Math.PI) / 180);
const views = (with34, views5) => { const { sys, a } = system(with34, views5); return headings.map((h) => { sys.face(a, new THREE.Vector3(Math.sin(h), 0, Math.cos(h)), true); return `${a.dir}${a.flip ? '>' : '<'}`; }); };

test('fallback: a sheet without three-quarter frames keeps the three-view rule exactly, ?views=5 or not', () => {
  assert.deepEqual(views(false, true), views(false, false));
  assert.deepEqual(views(true, false), views(false, false), 'without ?views=5 a sheet with three-quarters is unchanged too');
});

test('with three-quarter frames and ?views=5: the five views appear, a three-quarter mirrored for a rightward step like the profile', () => {
  const v = views(true, true), seen = new Set(v.map((s) => s.slice(0, -1)));
  for (const d of ['down', 'up', 'side', 'downSide', 'upSide']) assert.ok(seen.has(d), `view ${d} shown`);
  assert.ok(v.includes('downSide>') && v.includes('downSide<') && v.includes('upSide>') && v.includes('upSide<'), 'both mirrors');
  assert.ok(!v.includes('down>') && !v.includes('up>'), 'front / back never flipped');
});
