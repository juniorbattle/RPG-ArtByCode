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

test('?facing=ray (Passe K9): the view by the heading against the line of sight - a walk away along the camera axis shows the back even off the frame centre, toward the camera the front, across it the mirrored profile; off by default', () => {
  const frames = new Map(), specs = new Map([['sheet', { id: 'sheet', detail: 'crowd' }]]);
  for (const d of ['down', 'up', 'side', 'downSide', 'upSide']) for (const m of ['idle', 'walk']) frames.set(`sheet/${d}/${m}/0`, {});
  // an establishing-like camera (far, low pitch) and a walker off the frame's centre
  const cam = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 400);
  cam.position.set(-37, 2.5, 12); cam.lookAt(6, 1, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const sys = new ActorSystem({ specs, counts: new Map(), frames }, cam);
  assert.equal(sys.facingRay, false, 'the screen rule stays the default');
  const a = sys.spawn('sheet', 'crowd', new THREE.Vector3(-14, 0, -2));   // 16 deg off the camera axis
  const away = new THREE.Vector3(a.pos.x - cam.position.x, 0, a.pos.z - cam.position.z).normalize();
  const right = new THREE.Vector3(-away.z, 0, away.x);   // across the line of sight, to the camera's right
  const fwd = new THREE.Vector3(6 - cam.position.x, 0, 0 - cam.position.z).normalize();   // the camera axis on the ground (the key « up »)
  sys.face(a, fwd, true); const screen = a.dir;
  assert.notEqual(screen, 'up', `the screen rule shows that walk as ${screen} (the case the ray rule is for)`);
  sys.facingRay = true;
  sys.face(a, fwd, true); assert.equal(a.dir, 'up', 'away along the camera axis: the back');
  sys.face(a, away, true); assert.equal(a.dir, 'up', 'straight away: the back');
  sys.face(a, away.clone().negate(), true); assert.equal(a.dir, 'down', 'straight toward the camera: the front');
  sys.face(a, right, true); assert.equal(a.dir, 'side'); assert.equal(a.flip, true, 'to the right: the profile mirrored to face right');
  sys.face(a, right.clone().negate(), true); assert.equal(a.dir, 'side'); assert.equal(a.flip, false);
  sys.face(a, away.clone().add(right).normalize(), true); assert.equal(a.dir, 'upSide', '45 deg away and right: the three-quarter back');
  assert.equal(a.flip, true);
});

test('by default the hero walks by the line of sight, the NPCs by the screen (decision K9, Passe K10); ?facing=screen gives the hero the screen rule', () => {
  const frames = new Map(), specs = new Map([['sheet', { id: 'sheet', detail: 'crowd' }]]);
  for (const d of ['down', 'up', 'side', 'downSide', 'upSide']) for (const m of ['idle', 'walk']) frames.set(`sheet/${d}/${m}/0`, {});
  const cam = new THREE.PerspectiveCamera(38, 16 / 9, 0.1, 400);
  cam.position.set(-37, 2.5, 12); cam.lookAt(6, 1, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const sys = new ActorSystem({ specs, counts: new Map(), frames }, cam);
  assert.equal(sys.facingRayPlayer, true, 'the hero by the line of sight, by default');
  assert.equal(sys.facingRay, false, 'not everyone');
  const hero = sys.spawn('sheet', 'player', new THREE.Vector3(-14, 0, -2)), npc = sys.spawn('sheet', 'crowd', new THREE.Vector3(-14, 0, -2));
  sys.player = hero;
  const fwd = new THREE.Vector3(6 - cam.position.x, 0, 0 - cam.position.z).normalize();   // the key « up » in this framing
  sys.face(hero, fwd, true); sys.face(npc, fwd, true);
  assert.equal(hero.dir, 'up', 'the hero walking away shows his back');
  assert.notEqual(npc.dir, 'up', `the NPC keeps the screen rule (${npc.dir})`);
  sys.facingRayPlayer = false; hero.dir = 'down';
  sys.face(hero, fwd, true);
  assert.equal(hero.dir, npc.dir, '?facing=screen: the hero takes the screen rule like the NPCs');
});
