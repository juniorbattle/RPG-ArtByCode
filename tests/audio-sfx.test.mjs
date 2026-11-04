// Lot S3 of the sound (journal Passe SN15): the duel's sounds proposed on the listening sheet briefs/fiche-son-duel.html, one for each of the arena's effect
// recipes. Not in the game until the operator says so; here, that the bank and the recipes stay one to one, and that a sound is the same bytes each time.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const R = await load('/src/arena/fx/fxRecipes.ts');
const { CUES, renderCue } = await import('../art-lab/audio/sfx/duel.sfx.mjs');
const { CROWD } = await import('../art-lab/audio/sfx/crowd.sfx.mjs');
// the duel's reading, silent until now (the audit, « Lecture du duel : Muet »), a blow missed and an order refused: sounds without an effect recipe
const READING = ['threat', 'window', 'dodge', 'stun', 'pushed', 'whiff', 'denied'];

test('one sound for each effect recipe of the duel, and the reading\'s five; the crowd\'s murmur and its four reactions', () => {
  const recipes = Object.keys(R.RECIPES).sort(), cues = Object.keys(CUES);
  assert.deepEqual(cues.filter((id) => !READING.includes(id)).sort(), recipes, 'every recipe has its sound, no sound without a recipe');
  for (const id of READING) assert.ok(CUES[id], id);
  assert.deepEqual(Object.keys(CROWD).sort(), ['bed', 'cheer', 'gasp', 'oh', 'roar']);
  for (const [id, [family, secs, takes]] of Object.entries(CUES)) { assert.ok(['blow', 'ko', 'ren', 'rival', 'charge', 'read', 'ward', 'boost'].includes(family), id); assert.ok(secs > 0 && secs <= 3 && takes >= 1 && takes <= 3, id); }
});

test('a sound is its writing alone: the same bytes twice, its takes different, its level set, no sample past full scale', () => {
  const a = renderCue('light'), b = renderCue('light');
  assert.equal(a.takes.length, 3);
  for (let k = 0; k < 3; k++) { assert.deepEqual(a.takes[k].L, b.takes[k].L); assert.deepEqual(a.takes[k].R, b.takes[k].R); }
  assert.notDeepEqual(a.takes[0].L, a.takes[1].L, 'two takes, two draws');
  for (const id of ['light', 'window', 'ko']) for (const t of renderCue(id).takes) { let peak = 0; for (const x of [t.L, t.R]) for (const v of x) peak = Math.max(peak, Math.abs(v)); assert.ok(peak > 0.01 && peak < 1, `${id}: peak ${peak}`); }
});
