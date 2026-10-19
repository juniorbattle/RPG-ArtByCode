// The arena's generated fighters and floor (src/arena/FighterArt.ts, ArenaScene.ts, journal Passe P1): every clip the simulation can ask
// for has its frames for both fighters, the atlas fits the WebGL2 guarantee, a strike's reach lies inside its cell, the frames are the same
// bytes from one build to the next (no Math.random, as the town's painters), a clip shows its strike frame at the impact time, and the floor
// mask is deterministic.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { load } from './load.mjs';

const { buildArenaAtlas, clipFrame, CLIPS, CELL_W, FIGHTER_K } = await load('/src/arena/FighterArt.ts');
const { arenaMask } = await load('/src/arena/ArenaScene.ts');
const { CombatSim, COMBAT_DATA } = await load('/src/arena/CombatSim.ts');

const sha = (a) => crypto.createHash('sha256').update(Buffer.from(a.buffer, a.byteOffset, a.byteLength)).digest('hex');

test('every clip the simulation asks for has frames for both fighters, inside a WebGL2-sized atlas', () => {
  const set = buildArenaAtlas(1842, 5), a = set.atlas;
  assert.ok(a.width <= 2048 && a.height <= 2048, `${a.width} x ${a.height}`);
  // the simulation's anim names (CombatSim.refreshAnims and the actions' anims) and the presentation's own (victory)
  const names = new Set(['ko', 'recover', 'dodge', 'block', 'hit', 'idle', 'ready', 'victory', ...Object.values(COMBAT_DATA.actions).map((d) => d.anim)]);
  for (const id of ['ren', 'marek']) for (const n of names) {
    const clip = CLIPS[id][n];
    assert.ok(clip, `${id}: no clip ${n}`);
    clip.frames.forEach((_, i) => assert.ok(a.frames.get(`${id}/side/${n}.${i}/0`), `${id}/side/${n}.${i}`));
  }
  for (const [k, r] of Object.entries(set.reach)) assert.ok(r > 0 && r <= CELL_W / 2, `${k}: reach ${r}`);
  assert.equal(FIGHTER_K, 2);
});

test('the fighters paint the same bytes on every build', () => {
  assert.equal(sha(buildArenaAtlas(1842, 5).atlas.rgba), sha(buildArenaAtlas(1842, 5).atlas.rgba));
});

test('an attack clip shows its strike frame at the impact', () => {
  const s = new CombatSim();
  for (const [clip, ia, at] of [['strike', 0.2, 1], ['heavy', 0.5, 2], ['skill', 0.18, 1], ['slash', 0.3, 1]]) {
    const n = CLIPS.ren[clip].frames.length;
    assert.equal(clipFrame(clip, n, ia, ia), at, clip);
    assert.equal(clipFrame(clip, n, 0, ia), 0, `${clip} starts on its wind-up`);
    assert.equal(clipFrame(clip, n, ia + 0.3, ia), n - 1, `${clip} ends on its follow-through`);
  }
  assert.equal(clipFrame('idle', 2, 0.7, 0, 1.7), 1);
  void s;
});

test('the arena floor mask is deterministic and in range', () => {
  const r = { x0: -22, z0: -27, w: 44, h: 38 };
  const a = arenaMask(1842, r, 96, 83), b = arenaMask(1842, r, 96, 83);
  assert.equal(sha(a), sha(b));
  assert.ok(a.some((v, i) => i % 4 === 0 && v > 200), 'some puddles');
});
