// The five-view rule (journal Passe V5, decision H3 of 2026-10-19, « Cinq vues, le héros d'abord »): sectors of the on-screen step's angle
// from the vertical (front / back < 22.5 deg, three-quarter 22.5-67.5, profile beyond), each edge held 5 deg; only for the sheets that hold
// both three-quarter facings (idle + walk), and only with ActorSystem.views5 (DEV ?views=5). Every other sprite keeps the three-view rule.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

globalThis.window ??= { addEventListener() {} };
const { ActorSystem, fiveViewFacing, heroWalkFacing } = await load('/src/characters/ActorSystem.ts');
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

// the hero's diagonal (the operator's request of 2026-11-11, journal Passe MD1): the heading picks the view (K9), a three-quarter whose step
// crosses the screen beyond the profile's edge (67.5 deg, held to 62.5 once in profile) is shown in profile; front and back stay the heading's
test('heroWalkFacing: a three-quarter heading whose step crosses the screen turns to profile, front and back stay, the edge held 5 deg', () => {
  // a diagonal heading (45 deg) whose step crosses the screen at 75 deg (the low pitch): the profile, not the three-quarter
  assert.equal(heroWalkFacing('up', ...step(45, true), ...step(75, true)), 'side');
  assert.equal(heroWalkFacing('down', ...step(45, false), ...step(76, false, false)), 'side');
  // a diagonal heading whose step stays within the three-quarter sector on screen: the three-quarter, as before
  assert.equal(heroWalkFacing('up', ...step(45, true), ...step(55, true)), 'upSide');
  assert.equal(heroWalkFacing('down', ...step(40, false), ...step(66, false)), 'downSide');
  // a walk away (the heading's back) sliding toward the vanishing point keeps its back (K9), a heading across keeps its profile
  assert.equal(heroWalkFacing('up', ...step(10, true), ...step(80, true)), 'up');
  assert.equal(heroWalkFacing('side', ...step(85, true), ...step(40, true)), 'side');
  // the edge: entered beyond 67.5, left below 62.5 (no flicker on a straight slant)
  assert.equal(heroWalkFacing('upSide', ...step(45, true), ...step(66, true)), 'upSide');
  assert.equal(heroWalkFacing('upSide', ...step(45, true), ...step(68, true)), 'side');
  assert.equal(heroWalkFacing('side', ...step(45, true), ...step(64, true)), 'side');
  assert.equal(heroWalkFacing('side', ...step(45, true), ...step(61, true)), 'upSide');
});

test('the hero on a diagonal in the town: profile with heroStepView (a version 2 town, Explore), the heading three-quarter without it; the NPCs untouched', () => {
  const frames = new Map(), specs = new Map([['sheet', { id: 'sheet', detail: 'crowd' }]]);
  for (const d of ['down', 'up', 'side', 'downSide', 'upSide']) for (const m of ['idle', 'walk']) frames.set(`sheet/${d}/${m}/0`, {});
  // camera B's pose (yaw -57.5, pitch 8, 26 m) on a hero at the frame's centre
  const cam = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 400), yaw = -57.5 * Math.PI / 180, pitch = 8 * Math.PI / 180;
  cam.position.set(Math.sin(yaw) * Math.cos(pitch) * 26, 1 + Math.sin(pitch) * 26, Math.cos(yaw) * Math.cos(pitch) * 26); cam.lookAt(0, 1, 0);
  cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const sys = new ActorSystem({ specs, counts: new Map(), frames }, cam);
  const hero = sys.spawn('sheet', 'player', new THREE.Vector3(0, 0, 0)), npc = sys.spawn('sheet', 'crowd', new THREE.Vector3(0, 0, 0));
  sys.player = hero;
  const away = new THREE.Vector3(-cam.position.x, 0, -cam.position.z).normalize(), right = new THREE.Vector3(-away.z, 0, away.x);
  const diag = (f, r) => away.clone().multiplyScalar(f).add(right.clone().multiplyScalar(r)).normalize();
  assert.equal(sys.heroStepView, false, 'off by default: today game and the district keep the heading view');
  sys.face(hero, diag(1, 1), true); assert.equal(hero.dir, 'upSide', 'without it: the heading three-quarter back');
  sys.face(npc, diag(1, 1), true); const npcDir = npc.dir, npcFlip = npc.flip;
  sys.heroStepView = true;
  for (const [f, r, want, flip] of [[1, 1, 'side', true], [1, -1, 'side', false], [-1, 1, 'side', true], [-1, -1, 'side', false]]) {
    hero.dir = 'down'; sys.face(hero, diag(f, r), true);
    assert.equal(hero.dir, want, `the diagonal ${f},${r} crosses the screen: the profile`);
    assert.equal(hero.flip, flip, `mirrored by the step on screen (${f},${r})`);
  }
  hero.dir = 'down'; sys.face(hero, away, true); assert.equal(hero.dir, 'up', 'straight away: the back, as before');
  hero.dir = 'down'; sys.face(hero, away.clone().negate(), true); assert.equal(hero.dir, 'down', 'straight toward the camera: the front');
  hero.dir = 'down'; sys.face(hero, right, true); assert.equal(hero.dir, 'side', 'across: the profile');
  sys.face(npc, diag(1, 1), true); assert.deepEqual([npc.dir, npc.flip], [npcDir, npcFlip], 'the NPCs keep their rule');
});

// ?npcfacing= (journal Passe F2): the five townsfolk's 'down' is drawn turned left (no true front on their reference sheet: BakedCast's
// frontLeft). Oracle: the step's on-screen angle from the vertical, computed here from the camera, and the edges written out in degrees.
test('npcfacing: mirror turns a frontLeft "down" toward a rightward step, 34 (the default, Passe F3) keeps it to 67.5 deg going down, wide widens every front / back to 60; screen (\'\') = the rule of Passe F1', () => {
  const rig = (frontLeft, mode) => { const { sys, a } = system(false, true); sys.cast = new Map([['crowd0', { id: 'sheet', scale: 0.9, height: 1.7, walkSpeed: null, ...(frontLeft ? { frontLeft: true } : {}) }]]); sys.npcFacing = mode; return { sys, a }; };
  const screen = (h) => { const c = new THREE.PerspectiveCamera(30, 16 / 9, 0.1, 200); c.position.set(-20, 5.5, 15); c.lookAt(0, 1, 0); c.updateMatrixWorld(); c.updateProjectionMatrix();
    const p0 = new THREE.Vector3(0, 0, 0).project(c), p1 = new THREE.Vector3(Math.sin(h) * 0.05, 0, Math.cos(h) * 0.05).project(c), dx = (p1.x - p0.x) * c.aspect, dy = p1.y - p0.y;
    return { dx, dy, ang: Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI }; };
  const shown = (r, h, prev) => { r.a.dir = prev; r.a.flip = false; r.sys.face(r.a, new THREE.Vector3(Math.sin(h), 0, Math.cos(h)), true); return { dir: r.a.dir, flip: r.a.flip }; };
  assert.equal(system(false, true).sys.npcFacing, '34', '34 by default (the operator\'s decision, journal Passe F3)');
  const fine = [...Array(360).keys()].map((i) => (i * Math.PI) / 180);
  let checked = { mirror: 0, near: 0, keep34: 0, side34: 0, wide: 0 };
  for (const h of fine) {
    const { dx, dy, ang } = screen(h), down = dy <= 0;
    for (const prev of ['down', 'up', 'side']) {
      const base = shown(rig(true, ''), h, prev);
      // absent: a frontLeft sheet and a plain sheet show the same view (the screen rule, 50 / 40 deg)
      assert.deepEqual(base, shown(rig(false, ''), h, prev));
      assert.equal(base.dir === 'side', ang > (prev === 'side' ? 40 : 50), `screen rule at ${ang.toFixed(1)} deg from ${prev}`);
      // mirror: the same view; a frontLeft 'down' turned toward the step beyond 8 deg (from a 'down' start) or at once (from another view)
      const m = shown(rig(true, 'mirror'), h, prev);
      assert.equal(m.dir, base.dir);
      if (m.dir === 'down' && (prev !== 'down' || ang >= 8)) { assert.equal(m.flip, dx > 0, `mirror at ${ang.toFixed(1)} deg`); checked.mirror++; }
      if (m.dir === 'down' && prev === 'down' && ang < 8) { assert.equal(m.flip, false, 'held within 8 deg of the vertical'); checked.near++; }
      assert.deepEqual(shown(rig(false, 'mirror'), h, prev), base, 'a sheet with a true front is untouched by mirror');
      // 34: a frontLeft step going down keeps 'down' up to 72.5 deg (from down) / 62.5 (from the profile); a plain sheet is untouched
      const q = shown(rig(true, '34'), h, prev);
      if (down) { const isSide = ang > (prev === 'side' ? 62.5 : 72.5); assert.equal(q.dir === 'side', isSide, `34 at ${ang.toFixed(1)} deg from ${prev}`); if (!isSide && ang > 50) checked.keep34++; if (isSide) checked.side34++; if (!isSide) assert.equal(q.flip, prev === 'down' && ang < 8 ? false : dx > 0); }
      else assert.deepEqual(q, base, 'a step going up keeps the screen rule under 34');
      assert.deepEqual(shown(rig(false, '34'), h, prev), base, 'a sheet with a true front is untouched by 34');
      // wide: a plain sheet's front / back up to 65 deg (from front / back) / 55 (from the profile)
      const w = shown(rig(false, 'wide'), h, prev);
      assert.equal(w.dir === 'side', ang > (prev === 'side' ? 55 : 65), `wide at ${ang.toFixed(1)} deg from ${prev}`); checked.wide++;
    }
  }
  for (const [k, n] of Object.entries(checked)) assert.ok(n > 0, `case ${k} reached (${n})`);
});
