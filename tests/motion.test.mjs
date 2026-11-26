// How the hero and the walkers move (journal Passe MV1): the operator's answers on the sheet briefs/fiche-deplacements-mv1.html, MV-1 to MV-6 (six of six
// « A »): the hero's speed on the quay and on the squares (MV-1, MV-2), the ease in and out of a walk (MV-3), the walkers' hops, halts and speed
// (MV-4 to MV-6), the squares' walkers shown by their step on screen, the camera's gentle start. Oracles written from the decisions in numbers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import * as THREE from 'three';
import { load, ROOT } from './load.mjs';

globalThis.window ??= { addEventListener() {} };
const M = await load('/src/characters/motion.ts');
const { ActorSystem, npcWalkView } = await load('/src/characters/ActorSystem.ts');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const near = (a, b, what, e = 1e-9) => assert.ok(Math.abs(a - b) < e, `${what}: ${a} vs ${b}`);
const DT = 1 / 60;

test('MV-1 / MV-2: the hero walks at the stride his cycle draws x 1.12 x 1.875 and runs at x1.2 of it, bounded clock 2.5', () => {
  near(M.heroSpeed(1.4), 2.94, 'a 1.4 m/s cycle: 1.4 x 1.12 x 1.875');
  near(M.heroSpeed(14 * 7.5 * 0.0235 * 0.9), 4.663575, 'the 14-texel stride of hero-x2-v4: 4.66 m/s');
  near(M.heroSpeed(2.221) * M.HERO_RUN, 5.6, 'the run key: 5.6 m/s', 0.01);
  assert.equal(M.HERO_CLOCK_MAX, 2.5);
  // the clock follows the speed over the ground the cycle draws, bounded, with no floor while the hero eases (MV-3)
  near(M.walkerClock(2.221, 1.12, 4.6636, true), 1.875, 'the quay and the squares: x1.875', 1e-3);
  assert.equal(M.walkerClock(2.221, 1.12, 20, true), 2.5, 'the hero\'s bound');
  assert.equal(M.walkerClock(2.221, 1.12, 20, false), 1.6, 'a walker\'s bound');
  assert.equal(M.walkerClock(2.221, 1.12, 0.05, true, false), 0.4, 'the floor of a walk');
  near(M.walkerClock(2.221, 1.12, 0.05, true, true), 0.05 / (2.221 * 1.12), 'no floor while easing');
});

test('the squares read the same speed as the quay and no longer their own 2.22 m/s (source)', () => {
  const plaza = src('src/world/PlazaApp.ts');
  assert.ok(/heroSpeed\(ws\)/.test(plaza), 'PlazaApp takes the hero speed from motion.ts');
  assert.ok(!/walkSpeed \?\? 3\.2\) \* \(actHeld/.test(plaza), 'the former speed line is gone');
  assert.ok(/stepGait\(this\.gait/.test(plaza), 'the squares ease the hero too');
  const actors = src('src/characters/ActorSystem.ts');
  assert.ok(/heroSpeed\(ws\)/.test(actors), 'the quay reads it from the same place');
});

test('MV-3: the gait climbs to the speed in 0.12 s, stops in 0.10 s, keeps heading and speed through a turn, glides about 20 cm', () => {
  const T = 4.663575, g = M.newGait();
  const first = M.stepGait(g, 1, 0, T, DT);
  near(first.speed, T * DT / 0.12, 'the first step: a seventh of the speed (T x dt / 0.12)');
  let n = 1, v = first.speed;
  while (v < T - 1e-9 && n < 20) { v = M.stepGait(g, 1, 0, T, DT).speed; n++; }
  assert.equal(n, 8, '7.2 steps of 1/60 s: reached at the eighth');
  near(v, T, 'full speed');
  // a turn: the heading changes at once, the speed stays
  const turn = M.stepGait(g, 0, -1, T, DT);
  near(turn.speed, T, 'the speed through a turn'); near(turn.dz, -T * DT, 'the heading follows at once'); near(turn.dx, 0, 'no drift');
  // the key released: down in 6 steps, the heading kept, a glide of about 20 cm
  let glide = 0, steps = 0, last;
  for (let i = 0; i < 30; i++) { last = M.stepGait(g, 0, 0, 0, DT); if (last.speed <= 0) break; steps++; glide += Math.hypot(last.dx, last.dz); assert.ok(last.dz < 0 && Math.abs(last.dx) < 1e-12, 'the heading kept'); }
  assert.ok(steps >= 5 && steps <= 6, `stops in about 0.10 s: ${steps} steps`);
  assert.ok(glide > 0.14 && glide < 0.24, `glides about 20 cm: ${glide}`);
  assert.equal(last.speed, 0); assert.equal(g.v, 0);
  // the run key let go while walking: down to the walk's speed by the ramp, not at once
  const g2 = M.newGait(); for (let i = 0; i < 20; i++) M.stepGait(g2, 1, 0, T * 1.2, DT);
  const slower = M.stepGait(g2, 1, 0, T, DT);
  assert.ok(slower.speed <= T * 1.2 && slower.speed >= T - 1e-9, 'the speed comes down to the walk by the ramp, never below it');
  // a half tilt of the stick asks half the speed
  const g3 = M.newGait(); let s3; for (let i = 0; i < 20; i++) s3 = M.stepGait(g3, 1, 0, T * 0.5, DT);
  near(s3.speed, T * 0.5, 'half the speed');
});

function hero(v2, shift, ws = 2.221) {
  const atlas = { specs: new Map(), counts: new Map([['hero/walk', 8]]), frames: new Map() };
  const at = () => ({ x: 0, y: 0, z: 0, clone() { return { ...this }; } });
  const sys = new ActorSystem(atlas);
  sys.rebind({ walk: { x0: -50, x1: 50, z0: -50, z1: 50 }, colliders: [], heightAt: () => 0 });
  sys.cast.set('player', { id: 'hero', scale: 0.9, height: 1.78, walkSpeed: ws });
  sys.player = sys.spawn('player', 'player', at(), { t: 0 });
  sys.camYaw = 0; sys.controlYaw = 0; sys.charScale = 1.12; sys.v2Motion = v2;
  return sys;
}
const press = (sys, k) => sys.keys.add(k);

test('the town\'s hero with v2Motion eases in and out; without it (today\'s game, the district) the walk is as it was', () => {
  const T = M.heroSpeed(2.221);
  const a = hero(true); press(a, 'd');
  const xs = []; for (let i = 0; i < 12; i++) { const x0 = a.player.pos.x; a.update(DT, i * DT); xs.push((a.player.pos.x - x0) / DT); }
  near(xs[0], T * DT / 0.12, 'the first step of the new walk', 1e-6);
  assert.ok(xs[0] < T / 5 && xs[6] < T, 'not at full speed before 0.12 s'); near(xs[8], T, 'full speed after 8 steps', 1e-6);
  // the frames follow the ground the hero covers: the clock at the first step is small, then x1.5
  const clocks = []; const b = hero(true); press(b, 'd');
  for (let i = 0; i < 10; i++) { const t0 = b.player.t; b.update(DT, i * DT); clocks.push((b.player.t - t0) / DT); }
  assert.ok(clocks[0] < 0.3, `the first clock is slow: ${clocks[0]}`); near(clocks[9], 1.875, 'then x1.875', 1e-3);
  // released: he keeps walking a moment, then stands
  b.keys.clear(); const x0 = b.player.pos.x; let moved = 0, ws = 0;
  for (let i = 0; i < 12; i++) { const px = b.player.pos.x; b.update(DT, i * DT); if (b.player.pos.x > px + 1e-9) { ws++; moved = b.player.pos.x - x0; } }
  assert.ok(ws >= 4 && ws <= 7, `glides ${ws} steps`); assert.ok(moved > 0.14 && moved < 0.24, `20 cm: ${moved}`);
  assert.equal(b.player.anim, 'idle', 'then idle');
  // control: today's walk is at full speed from the first step and stops dead
  const c = hero(false); press(c, 'd'); c.update(DT, 0); near(c.player.pos.x, T * DT, 'full speed at once');
  c.keys.clear(); const cx = c.player.pos.x; c.update(DT, 0); near(c.player.pos.x, cx, 'stops dead');
  // the run key: x1.2 of the walk, reached by the ramp
  const r = hero(true, true); press(r, 'd'); press(r, 'shift'); for (let i = 0; i < 12; i++) r.update(DT, i * DT);
  const rx = r.player.pos.x; r.update(DT, 0); near((r.player.pos.x - rx) / DT, T * 1.2, 'the run: 5.6 m/s', 1e-6);
});

test('npcWalkView: the squares\' walkers use the quay\'s rule (npcfacing=34), by the step on screen', () => {
  const prev = (dir, flip = false) => ({ dir, flip });
  const deg = (d) => [Math.sin((d * Math.PI) / 180), Math.cos((d * Math.PI) / 180)];   // a step d degrees from the screen vertical, going up
  const v = (p, d, up, fl = false) => { const [x, y] = deg(d); return npcWalkView(p, x, up ? y : -y, fl); };
  assert.equal(v(prev('down'), 10, false).dir, 'down'); assert.equal(v(prev('down'), 10, true).dir, 'up');
  assert.equal(v(prev('down'), 45, false).dir, 'down', 'held in between: still the front');
  assert.equal(v(prev('down'), 55, false).dir, 'side', 'beyond 50 deg: the profile');
  assert.equal(v(prev('side'), 45, false).dir, 'side', 'held 5 deg back once in profile');
  assert.equal(v(prev('side'), 35, false).dir, 'down', 'and back to the front below 40 deg');
  assert.equal(v(prev('down'), 70, false, true).dir, 'down', 'a frontLeft sheet keeps its three-quarter front up to 72.5 deg');
  assert.equal(v(prev('down'), 75, false, true).dir, 'side');
  assert.equal(v(prev('down'), 30, false, true).flip, true, 'mirrored toward a rightward step');
  assert.equal(v(prev('side'), 80, true).flip, true); assert.equal(npcWalkView(prev('side'), -1, 0.1, false).flip, false, 'leftward: not mirrored');
  assert.equal(v(prev('up'), 10, true, true).flip, false, 'the back never mirrored');
  const plaza = src('src/world/PlazaApp.ts');
  assert.ok(/npcWalkView\(/.test(plaza), 'PlazaApp uses it');
  assert.ok(!/Math\.abs\(ux\) > Math\.abs\(uz\) \* 1\.2/.test(plaza), 'the ground-axes rule of the squares is gone');
});

test('MV-4 / MV-5: a walker\'s plan - hops of 2.4 to 4 m, halts of 2 to 4 s, a long stop of 8 to 14 s, a look aside in two halts of five', () => {
  const plans = []; for (let seed = 7; seed < 400; seed += 31) for (let n = 0; n < 40; n++) plans.push(M.hopPlan(seed, n));
  for (const p of plans) {
    assert.ok(p.hop >= 2.4 && p.hop <= 4, `hop ${p.hop}`); assert.ok(p.halt >= 2 && p.halt <= 4, `halt ${p.halt}`); assert.ok(p.linger >= 8 && p.linger <= 14, `linger ${p.linger}`);
    assert.ok(p.look === null || (p.look >= 0.25 && p.look <= 0.75)); assert.ok([0, 1, 2].includes(p.lookSide));
  }
  const looks = plans.filter((p) => p.look !== null).length / plans.length;
  assert.ok(looks > 0.33 && looks < 0.47, `a look in ${Math.round(looks * 100)} % of the halts (0.4)`);
  assert.deepEqual(M.hopPlan(31 * 3 + 7, 5), M.hopPlan(31 * 3 + 7, 5), 'the same walker stops the same way');
  assert.notDeepEqual(M.hopPlan(7, 1), M.hopPlan(8, 1));
  near(M.walkerSpeed(true), 0.95, 'the townsfolk', 1e-12); near(M.walkerSpeed(false), 0.8, 'the others', 1e-12); near(M.walkerSpeed(true, true), 0.9, 'the porter', 1e-12);
});

function crowdWalker(v2) {
  const frames = new Map(), specs = new Map([['sheet', { id: 'sheet', detail: 'crowd' }]]);
  for (const d of ['down', 'up', 'side']) for (const m of ['idle', 'walk']) frames.set(`sheet/${d}/${m}/0`, {});
  const sys = new ActorSystem({ specs, counts: new Map(), frames }, null);
  sys.rebind({ walk: { x0: -12, x1: 12, z0: -6, z1: 6 }, colliders: [], heightAt: () => 0 });
  sys.v2Motion = v2;
  sys.player = sys.spawn('player', 'player', new THREE.Vector3(11, 0, 5));
  const a = sys.spawn('sheet', 'crowd', new THREE.Vector3(-10, 0, 0), { detail: 'crowd' });
  a.behaviour = { kind: 'wander', seed: 77, wait: 0 };
  return { sys, a };
}
function watch(v2, secs) {
  const { sys, a } = crowdWalker(v2);
  const trips = [], pauses = []; let len = 0, rest = 0, walking = false, frames = 0, walked = 0;
  for (let i = 0; i < secs * 60; i++) {
    const x = a.pos.x, z = a.pos.z; sys.update(DT, i * DT);
    const moved = Math.hypot(a.pos.x - x, a.pos.z - z), w = moved > 1e-6 && a.anim === 'walk';
    frames++; if (w) walked++;
    if (w) { if (!walking) { if (rest) pauses.push(rest * DT); rest = 0; len = 0; } len += moved; } else { if (walking) trips.push(len); rest++; }
    walking = w;
  }
  return { trips, pauses, share: walked / frames };
}

test('MV-4 / MV-5: a walker of the quay walks in hops of 4 m at most with halts, and lingers at its destination (a control without v2Motion keeps its long walks)', () => {
  const on = watch(true, 600), off = watch(false, 600);
  assert.ok(on.trips.length > 60, `trips ${on.trips.length}`);
  assert.ok(Math.max(...on.trips) <= 4.05, `no hop over 4 m: ${Math.max(...on.trips)}`);
  assert.ok(on.pauses.every((p) => p >= 1.9), `every stop at least 2 s: ${Math.min(...on.pauses)}`);
  assert.ok(on.pauses.some((p) => p >= 8) && on.pauses.some((p) => p <= 4.2), 'long stops and halts');
  assert.ok(on.share < 0.55, `in walk ${Math.round(on.share * 100)} % of the time`);
  assert.ok(Math.max(...off.trips) > 8, `the control walks long: ${Math.max(...off.trips)} m`);
  assert.ok(off.share > 0.6, `the control walks ${Math.round(off.share * 100)} % of the time`);
});

test('a halt that looks aside turns the resting view to the left, the right or the camera, once (MV-5)', () => {
  const { sys, a } = crowdWalker(true); sys.camYaw = 0;
  const seen = new Set();
  for (let i = 0; i < 600 * 60; i++) { sys.update(DT, i * DT); if (a.anim === 'idle') seen.add(`${a.dir}${a.dir === 'side' ? (a.flip ? '>' : '<') : ''}`); }
  for (const v of ['down', 'side<', 'side>']) assert.ok(seen.has(v), `a resting view ${v} seen: ${[...seen]}`);
});

test('smoothDamp: the camera starts gently, never overshoots, trails a steady walk by about its response time (rule 6 bis)', () => {
  // from rest toward a target: the first step moves a sliver, the exponential it replaces moved 5 % at once
  let [x, v] = M.smoothDamp(0, 1, 0, 1 / 3, DT);
  assert.ok(x < 0.01 && x < 0.05 / 5, `gentle start: ${x} (the exponential it replaces moved 0.05)`);
  let max = x, steps = 1;
  while (x < 0.99 && steps < 600) { [x, v] = M.smoothDamp(x, 1, v, 1 / 3, DT); max = Math.max(max, x); steps++; }
  assert.ok(max <= 1 + 1e-9, 'no overshoot'); assert.ok(steps > 60 && steps < 150, `settles in about ${steps / 60} s`);
  // a target moving at 1 unit / s: the trail settles near the response time
  let p = 0, vel = 0; for (let i = 0; i < 600; i++) { [p, vel] = M.smoothDamp(p, (i + 1) * DT, vel, 1 / 3, DT); }
  near(10 - p, 1 / 3, 'trail', 0.02);
  const same = M.smoothDamp(5, 5, 0, 1 / 3, DT); assert.deepEqual(same, [5, 0]);
  assert.deepEqual(M.smoothDamp(0, 1, 0.2, 1 / 3, 0), [0, 0.2], 'no time, no move');
  const plaza = src('src/world/PlazaApp.ts');
  assert.ok(/smoothDamp\(M\[key\], want\[key\]/.test(plaza) && /smoothDamp\(P\[key\], m,/.test(plaza) && !/P\[key\] \+= \(want\[key\] - P\[key\]\) \* k/.test(plaza), 'the squares\' camera follows through two springs, the second after the first');
  // two springs one after the other start without a velocity and without an acceleration: the first step of a jump is far smaller than one spring's
  const [m1] = M.smoothDamp(0, 1, 0, 1 / 6, DT), [p1] = M.smoothDamp(0, m1, 0, 1 / 6, DT), [one] = M.smoothDamp(0, 1, 0, 1 / 3, DT);
  assert.ok(p1 < one / 10, `the cascade's first step ${p1} against one spring's ${one}`);
  assert.ok(/applyCamera\(null\)/.test(plaza) && /applyCamera\(dt > 0 \? dt : null\)/.test(plaza), 'a frame of no time (a pose set, a resize) snaps');
});
