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

test('the player: a baked hero runs on walkClock (the run key included), the generated sprite keeps x1 / x1.7', () => {
  const atlas = { specs: new Map(), counts: new Map([['hero/walk', 6]]), frames: new Map() };
  const at = () => ({ x: 0, y: 0, z: 0, clone() { return { ...this }; } });
  const run = (baked, shift) => {
    const sys = new ActorSystem(atlas);
    if (baked) sys.cast.set('player', { id: 'hero', scale: 0.9, height: 1.78, walkSpeed: 1.4 });
    sys.player = sys.spawn('player', 'player', at(), { t: 0 });
    sys.camYaw = 0; sys.controlYaw = 0; sys.charScale = 1.12;
    sys.keys.add('d'); if (shift) sys.keys.add('shift');                   // straight across the screen: shown in profile
    sys.update(0.02, 0);
    return { t: sys.player.t, dir: sys.player.dir, base: sys.player.base };
  };
  const b = run(true, false);
  assert.equal(b.base, 'player'); assert.equal(b.dir, 'side');
  assert.ok(Math.abs(b.t - 0.02 * (2.5 / (1.4 * 1.12))) < 1e-9, 'its steps at 2.5 m/s over the speed its cycle draws');
  assert.ok(Math.abs(run(true, true).t - 0.02 * 1.6) < 1e-9, 'bounded with the run key');
  assert.ok(Math.abs(run(false, false).t - 0.02) < 1e-9, 'generated: x1');
  assert.ok(Math.abs(run(false, true).t - 0.02 * 1.7) < 1e-9, 'generated: the run key x1.7');
});
