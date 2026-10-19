// Camera graph zone choice (src/app/CameraGraph.ts, AGENTS.md "Camera graph"): A at the west end (x < -9.4), B by default, C in the
// forge yard (x 4.2..13.2, z < 2.4), D past the forge (x >= 14); the zone in force holds until the player is 0.9 m past its edge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const { CameraGraph, DEFAULT_ZONES, lerpState } = await load('/src/app/CameraGraph.ts');
// Every module is loaded before the first test: a load left pending while the tests already run is cut by the after() hook
// that closes the loader (Windows: an unsettled top-level await, journal Passe H7).
const THREE = await import('three');
const { CameraRig, applyPose } = await load('/src/app/CameraRig.ts');
const graph = () => new CameraGraph();

test('the authored zones and margin', () => {
  const z = Object.fromEntries(DEFAULT_ZONES.map((d) => [d.id, d]));
  assert.equal(z.A.x1, -9.4);
  assert.deepEqual([z.C.x0, z.C.x1, z.C.z1], [4.2, 13.2, 2.4]);
  assert.equal(z.D.x0, 14);
  assert.ok(z.D.priority > z.C.priority && z.C.priority > z.A.priority && z.A.priority > z.B.priority);
  assert.equal(graph().margin, 0.9);
});

test('a fresh choice (no current zone) takes the highest-priority zone containing the player', () => {
  const g = graph();
  for (const [x, z, want] of [[-20, 0, 'A'], [-9.5, 3, 'A'], [-9.3, 0, 'B'], [0, 0, 'B'], [4.3, 0, 'C'], [13.1, 2.3, 'C'],
    [8, 2.5, 'B'], [13.5, 0, 'B'], [14.1, 0, 'D'], [20, 5, 'D'], [5000, 0, 'B']]) {
    assert.equal(g.zoneFor(x, z, null), want, `(${x}, ${z})`);
  }
});

test('hysteresis: the current zone holds within 0.9 m past its edge, then releases', () => {
  const g = graph();
  // D releases at 13.1 (into C on the quay, into B along the water's edge)
  assert.equal(g.zoneFor(13.5, 0, 'D'), 'D');
  assert.equal(g.zoneFor(13.15, 0, 'D'), 'D');
  assert.equal(g.zoneFor(13.05, 0, 'D'), 'C');
  assert.equal(g.zoneFor(13.05, 3, 'D'), 'B');
  // C releases 0.9 m west of x 4.2 and 0.9 m north of z 2.4
  assert.equal(g.zoneFor(3.35, 0, 'C'), 'C');
  assert.equal(g.zoneFor(3.25, 0, 'C'), 'B');
  assert.equal(g.zoneFor(8, 3.25, 'C'), 'C');
  assert.equal(g.zoneFor(8, 3.35, 'C'), 'B');
  // A releases 0.9 m east of x -9.4
  assert.equal(g.zoneFor(-8.55, 0, 'A'), 'A');
  assert.equal(g.zoneFor(-8.45, 0, 'A'), 'B');
});

test('a higher-priority zone takes over at its own edge, whatever the current zone', () => {
  const g = graph();
  assert.equal(g.zoneFor(4.25, 0, 'B'), 'C');
  assert.equal(g.zoneFor(14.05, 0, 'C'), 'D');
  assert.equal(g.zoneFor(14.05, 3, 'B'), 'D');
  assert.equal(g.zoneFor(-9.45, 0, 'B'), 'A');
});

test('the margin is read from the instance', () => {
  const g = graph();
  g.margin = 0.2;
  assert.equal(g.zoneFor(13.75, 0, 'D'), 'B');
  assert.equal(g.zoneFor(13.85, 0, 'D'), 'D');
});

// Anchored blends everywhere (?camblend=anchored, journal Passe K1): a proposal behind a flag; without it the graph is the approved one
const WALK = { x0: -13.5, x1: 26, z0: -3.2, z1: 4.05 };
/** the player's screen x (px, 1920 wide) per frame while walking from x0 to x1 at 2.5 m/s along the quay (z 0.5), through graph.update */
function walk(anchorAll, x0, x1) {
  const g = new CameraGraph(), rig = new CameraRig(), cam = new THREE.PerspectiveCamera();
  g.anchorAll = anchorAll; rig.setAspect?.(16 / 9);
  const p = new THREE.Vector3(x0, 0, 0.5), v = new THREE.Vector3(), out = [];
  g.snap(p, rig);
  const dir = Math.sign(x1 - x0);
  for (let i = 0; i < 60 * 6 && (x1 - p.x) * dir > 0; i++) {
    p.x += dir * 2.5 / 60;
    g.update(p, 1 / 60, rig);
    applyPose(cam, g.state, 16 / 9);
    v.set(p.x, 1, p.z).project(cam);
    out.push({ sx: v.x * 960, blending: g.blending, yaw: g.state.yaw });
  }
  return out;
}
/** the worst screen speed against the walk during the blend (px/s, 1920 wide; > 0 = the player glides backwards), and the frames beyond the
 *  camsim threshold (8 px/s) */
const against = (log, sign) => { let worst = 0, n = 0; log.slice(1).forEach((e, i) => { if (!e.blending) return; const v = -(e.sx - log[i].sx) * 60 * sign; worst = Math.max(worst, v); if (v > 8) n++; }); return { worst, n }; };

test('approved transitions: B -> A swings the player backwards on screen (the measured defect, journal Passes 4B / K1)', () => {
  const w = walk(false, -5, -12.5), r = against(w, -1);
  assert.ok(w.some((e) => e.blending), 'the walk crosses the A / B transition');
  assert.ok(r.worst > 150 && r.n >= 20, `worst ${r.worst.toFixed(0)} px/s over ${r.n} frames`);
});

test('?camblend=anchored: the backwards glide of B -> A drops below 30 px/s, A -> B none', () => {
  const ba = against(walk(true, -5, -12.5), -1), ab = against(walk(true, -12.5, -5), 1);
  assert.ok(ba.worst < 30, `B -> A worst ${ba.worst.toFixed(1)} px/s`);
  assert.ok(ab.worst <= 0, `A -> B worst ${ab.worst.toFixed(1)} px/s`);
});

test('?camblend=anchored: the bake samples the anchored A <-> B / B <-> C blends; without it the poses are the approved ones', () => {
  const a = new CameraGraph(), b = new CameraGraph(); b.anchorAll = true;
  const pa = a.samplePoses(WALK), pb = b.samplePoses(WALK);
  const count = (ps, set) => ps.filter((p) => p.set === set).length;
  for (const set of ['A', 'B', 'C', 'D', 'CD', 'BD']) assert.deepEqual(pb.filter((p) => p.set === set), pa.filter((p) => p.set === set), set);
  assert.ok(count(pb, 'AB') > count(pa, 'AB') && count(pb, 'BC') > count(pa, 'BC'), 'more blend poses with the anchored weights');
  // the approved AB / BC poses are plain interpolations (lerpState): the pivot lies on the segment between the two framings' pivots
  for (const p of pa.filter((q) => q.set === 'AB' || q.set === 'BC')) {
    const [s, t] = p.set === 'AB' ? ['A', 'B'] : ['B', 'C'], e0 = a.evalAnchor(s, p.player[0], p.player[1]), e1 = a.evalAnchor(t, p.player[0], p.player[1]);
    const w = (p.pose.dist - e0.dist) / (e1.dist - e0.dist || 1);
    if (Math.abs(e1.dist - e0.dist) > 1e-6) assert.ok(Math.abs(p.pose.tx - (e0.tx + (e1.tx - e0.tx) * w)) < 1e-6, `${p.set} pivot x on the segment`);
  }
});

// lerpState (the blend of two framings' states): ends exact, every field linear, the yaw the short way round (Passe Q2)
test('lerpState: exact ends, linear fields, the yaw takes the short way round', () => {
  const s = (yaw, k) => ({ yaw, pitch: 0.1 * k, dist: 20 + k, fov: 30 + k, shift: 0.01 * k, tx: k, ty: 2 + k, tz: -k, charScale: 1 + 0.1 * k });
  const a = s(-1, 0), b = s(-0.5, 2);
  assert.deepEqual(lerpState(a, b, 0), a);
  for (const [k, v] of Object.entries(lerpState(a, b, 1))) assert.ok(Math.abs(v - b[k]) < 1e-12, `t = 1: ${k}`);
  const m = lerpState(a, b, 0.25);
  assert.ok(Math.abs(m.yaw + 0.875) < 1e-12 && Math.abs(m.dist - 20.5) < 1e-12 && Math.abs(m.charScale - 1.05) < 1e-12 && Math.abs(m.tz + 0.5) < 1e-12);
  // across +-pi: from 3.0 to -3.0 rad is 0.283 rad the short way (through pi), not 6 rad back through 0
  const w = lerpState(s(3.0, 0), s(-3.0, 0), 0.5);
  assert.ok(Math.abs(Math.abs(w.yaw) - Math.PI) < 1e-9, `mid yaw ${w.yaw}`);
  const q = lerpState(s(3.0, 0), s(-3.0, 0), 0.25);
  assert.ok(Math.abs(q.yaw - (3.0 + (2 * Math.PI - 6) / 4)) < 1e-9, `quarter yaw ${q.yaw}`);
  // and the other way round (-3.0 to 3.0: through -pi)
  const r = lerpState(s(-3.0, 0), s(3.0, 0), 0.25);
  assert.ok(Math.abs(r.yaw - (-3.0 - (2 * Math.PI - 6) / 4)) < 1e-9, `quarter yaw back ${r.yaw}`);
});
