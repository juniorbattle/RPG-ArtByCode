// Walk cadence of the baked cast (journal Passe S2): the ground speed a side-view walk cycle draws (src/characters/Stride.ts walkSlide) and
// the walker's animation clock (ActorSystem.walkClock): in profile the planted foot slides along the camera's right, so the clock follows the
// velocity along that axis; from the front or the back, the full speed; bounded; 1 for a generated sprite or an unsteady cycle.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

globalThis.window ??= { addEventListener() {} };   // ActorSystem listens to the keyboard
const { walkSlide } = await load('/src/characters/Stride.ts');
const { decodePng, sheetFrames } = await load('/src/characters/BakedDecode.ts');
const { ActorSystem } = await load('/src/characters/ActorSystem.ts');

/** six 32k x 48k side walk frames, one foot run per frame on the foot row (45k) at the given left edges (texels), `w` wide */
function cycle(k, lefts, w = 5 * k) {
  const fw = 32 * k, fh = 48 * k;
  return lefts.map((x0, i) => {
    const rgba = new Uint8Array(fw * fh * 4);
    for (const l of [].concat(x0)) for (let x = l; x < l + w; x++) rgba[(45 * k * fw + x) * 4 + 3] = 255;
    return { dir: 'side', anim: 'walk', i, rgba };
  });
}

test('walkSlide: a steady treadmill gives its slide per frame, whatever the direction', () => {
  assert.equal(walkSlide(cycle(2, [18, 22, 27, 18, 22, 27]), 2), 4.5);          // 4, 5, (landing), 4, 5, (landing)
  assert.equal(walkSlide(cycle(2, [40, 36, 31, 40, 36, 31]), 2), 4.5);          // the same cycle facing the other way
  assert.equal(walkSlide(cycle(1, [10, 12, 14, 16, 10, 12]), 1), 2);
});

test('walkSlide: null without a side walk, without feet, or for an unsteady cycle', () => {
  assert.equal(walkSlide(cycle(2, [18, 22, 27]).map((f) => ({ ...f, dir: 'down' })), 2), null);
  assert.equal(walkSlide(cycle(2, [18]), 2), null, 'a single frame');
  assert.equal(walkSlide(cycle(2, [[], [], []]), 2), null, 'no foot on the foot row');
  // a boot held one frame, then 4 texels (the dock worker's until journal Passe V3): no single cadence keeps it planted
  assert.equal(walkSlide(cycle(2, [23, 23, 27, 23, 23, 27]), 2), null);
});

test('walkSlide on the production sheets (regression: re-measure on purpose after any rebuild of a walk)', async () => {
  const want = { 'artisan-x2-v1': 4.5, 'blacksmith-x2-v1': 4, 'courier-x2-v1': 4.25, 'dockworker-x2-v2': 4, 'guard-x2-v1': 4, 'hooded-x2-v1': 4,
    'merchant-x2-v2': 4.5, 'older-merchant-x2-v1': 4.25, 'townswoman-x2-v1': 4.5, 'traveler-x2-v1': 4.25 };
  const production = fs.readdirSync(path.join(ROOT, 'art-lab/characters/manifests')).filter((f) => f.endsWith('.manifest.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/manifests', f), 'utf8'))).filter((m) => m.runtimeUse === 'production').map((m) => m.id).sort();
  assert.deepEqual(production, Object.keys(want).sort(), 'every production sheet has an expected value');
  for (const id of production) {
    const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`))));
    const { k, frames } = sheetFrames(id, img, JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8')));
    assert.equal(walkSlide(frames, k), want[id], id);
  }
});

test('walkClock: the speed the steps show over the speed the cycle draws, at the character scale, bounded', () => {
  const sys = new ActorSystem({ specs: new Map(), counts: new Map(), frames: new Map() });
  sys.cast.set('crowd0', { id: 'baked', scale: 0.9, height: 1.8, walkSpeed: 0.7 });
  const a = { base: 'crowd0', dir: 'side' };
  sys.camYaw = 0; sys.charScale = 1;                         // camera right = +x
  assert.ok(Math.abs(sys.walkClock(a, 0.7, 0) - 1) < 1e-9, 'across the screen at the drawn speed');
  assert.ok(Math.abs(sys.walkClock(a, -0.7, 0) - 1) < 1e-9, 'either way');
  assert.ok(Math.abs(sys.walkClock(a, 0.35, -0.6) - 0.5) < 1e-9, 'in profile, only the velocity along the camera right counts');
  sys.charScale = 1.12;
  assert.ok(Math.abs(sys.walkClock(a, 0.7 * 1.12, 0) - 1) < 1e-9, 'a larger sprite takes longer strides');
  sys.charScale = 1; sys.camYaw = Math.PI / 2;               // camera right = -z
  assert.ok(Math.abs(sys.walkClock(a, 0, -0.7) - 1) < 1e-9, 'the axis follows the camera');
  a.dir = 'down'; sys.camYaw = 0;
  assert.ok(Math.abs(sys.walkClock(a, 0.35, -0.6) - Math.hypot(0.35, 0.6) / 0.7) < 1e-9, 'front / back: the full speed');
  assert.equal(sys.walkClock(a, 5, 0), 1.6, 'upper bound');
  a.dir = 'side';
  assert.equal(sys.walkClock(a, 0.01, 0.9), 0.4, 'lower bound');
  assert.equal(sys.walkClock({ base: 'crowd1', dir: 'side' }, 0.9, 0), 1, 'no measured cycle');
  assert.equal(sys.walkClock({ dir: 'side' }, 0.9, 0), 1, 'a generated sprite');
  sys.cast.set('porter', { id: 'dock', scale: 0.9, height: 1.7, walkSpeed: null });
  assert.equal(sys.walkClock({ base: 'porter', dir: 'side' }, 0.9, 0), 1, 'an unsteady cycle');
});

test('the player: a baked hero runs at the speed its cycle draws (journal Passe H6), the generated sprite keeps 2.5 m/s, x1 / x1.7', () => {
  const atlas = { specs: new Map(), counts: new Map([['hero/walk', 6]]), frames: new Map() };
  const at = () => ({ x: 0, y: 0, z: 0, clone() { return { ...this }; } });
  const run = (baked, shift, cs = 1.12, ws = 1.4) => {
    const sys = new ActorSystem(atlas);
    sys.rebind({ walk: { x0: -10, x1: 10, z0: -10, z1: 10 }, colliders: [], heightAt: () => 0 });
    if (baked) sys.cast.set('player', { id: 'hero', scale: 0.9, height: 1.78, walkSpeed: ws });
    sys.player = sys.spawn('player', 'player', at(), { t: 0 });
    sys.camYaw = 0; sys.controlYaw = 0; sys.charScale = cs;
    sys.keys.add('d'); if (shift) sys.keys.add('shift');                   // straight across the screen: shown in profile
    sys.update(0.02, 0);
    return { t: sys.player.t, dir: sys.player.dir, base: sys.player.base, x: sys.player.pos.x, speed: sys.playerSpeed() };
  };
  const near = (a, b, what) => assert.ok(Math.abs(a - b) < 1e-9, `${what}: ${a} vs ${b}`);
  const b = run(true, false);
  assert.equal(b.base, 'player'); assert.equal(b.dir, 'side');
  // the oracle in numbers, not through the code's constants: walkSpeed 1.4 m/s x 1.12 x 1.5 = 2.352 m/s
  near(b.speed, 2.352, 'speed: the stride the cycle draws at x1.5 in B / D');
  near(b.x, 2.352 * 0.02, 'it moves at that speed');
  near(b.t, 0.02 * 1.5, 'its frames at x1.5 in B / D: the planted foot stays put');
  near(run(true, false, 1.15).t, 0.02 * 2.352 / (1.4 * 1.15), 'in C (x1.15) a little slower');
  const s = run(true, true);
  near(s.x, 2.352 * 1.2 * 0.02, 'the run key: a sprint at x1.2');
  near(s.t, 0.02 * 1.8, 'the sprint\'s clock (x1.8, above the NPC bound of 1.6)');
  near(run(true, true, 1).t, 0.02 * 2, 'the sprint in A (character scale 1): bounded at x2');
  near(run(true, false, 1.12, 14 * 7.5 * 0.0235 * 0.9).speed, 3.73086, 'a 14-texel stride (the Pass H6 rig): 3.73 m/s');
  const g = run(false, false), gs = run(false, true);
  near(g.speed, 2.5, 'generated: 2.5 m/s'); near(g.x, 0.05, 'generated: moves 2.5 m/s');
  near(g.t, 0.02, 'generated: x1'); near(gs.t, 0.02 * 1.7, 'generated: the run key x1.7'); near(gs.x, 0.02 * 2.5 * 1.7, 'generated: runs x1.7');
});

test('a walker pushed along a collider faces, and steps, the way it actually moves (journal Passe F1)', () => {
  const atlas = { specs: new Map(), counts: new Map([['hero/walk', 6]]), frames: new Map() };
  const at = () => ({ x: 0, y: 0, z: 0, clone() { return { ...this }; } });
  const step = (colliders) => {
    const sys = new ActorSystem(atlas);
    sys.rebind({ walk: { x0: -10, x1: 10, z0: -10, z1: 10 }, colliders, heightAt: () => 0 });
    sys.cast.set('player', { id: 'hero', scale: 0.9, height: 1.78, walkSpeed: 1.4 });
    sys.player = sys.spawn('player', 'player', at(), { t: 0 });
    sys.camYaw = 0; sys.controlYaw = 0; sys.charScale = 1.12;
    sys.keys.add('d'); sys.keys.add('s');                    // right and toward the camera: the world rule shows the front
    sys.update(0.02, 0);
    return sys.player;
  };
  const free = step([]);
  assert.equal(free.dir, 'down', 'a free diagonal step: the front');
  // a stall just in front of the player (toward the camera): the step slides to the right only
  const slid = step([{ kind: 'box', x0: -5, x1: 5, z0: 0.3, z1: 1 }]);
  assert.ok(slid.pos.z === 0 && slid.pos.x > 0, 'blocked toward the camera, slid to the right');
  assert.equal(slid.dir, 'side', 'it faces the way it moves (profile), not the way it was heading');
  assert.equal(slid.flip, true, 'to the right');
  // its clock follows the slide (the speed along the camera right), not the intended diagonal (the hero's speed: 1.4 x 1.12 x 1.5 m/s)
  const v = 2.352 * Math.SQRT1_2;
  assert.ok(Math.abs(slid.t - 0.02 * (v / (1.4 * 1.12))) < 1e-9, 'clock at the slide speed');
});
