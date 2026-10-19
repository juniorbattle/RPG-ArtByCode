// Visibility need masks (src/district/Visibility.ts needMask / cfgMask, AGENTS.md "Visibility-driven generation"): a part's mask = the baked
// sets that show it (pixels of the reveal-window pass count too), 0 = never seen (Tier 3), untracked geometry needed everywhere; a draw
// configuration needs its framings and the blend sets whose two ends are on screen. Test gap listed in journal Passe Q1, filled in Passe Q2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const { needMask, cfgMask, SETS, ALL_MASK } = await load('/src/district/Visibility.ts');
// the bit order, written out: A B C D AB BC CD BD
const BIT = { A: 1, B: 2, C: 4, D: 8, AB: 16, BC: 32, CD: 64, BD: 128 };

const result = (n, seen, behind) => {
  const mk = (src) => Object.fromEntries(SETS.map((s) => { const a = new Uint32Array(n); for (const [id, px] of src?.[s] ?? []) a[id] = px; return [s, a]; }));
  return { counts: mk(seen), ...(behind ? { behind: mk(behind) } : {}), poses: 0, ms: 0, split: { render: 0, readback: 0, decode: 0 }, pages: 0, page: [0, 0], targetBytes: 0 };
};

test('the set order and the all-sets mask', () => {
  assert.deepEqual(SETS, ['A', 'B', 'C', 'D', 'AB', 'BC', 'CD', 'BD']);
  assert.equal(ALL_MASK, 255);
});

test('needMask: the sets that show a part', () => {
  const v = result(6, { A: [[1, 3]], C: [[2, 1], [3, 9]], CD: [[3, 1]], BD: [[4, 2]] });
  assert.equal(needMask(v, 1), BIT.A);
  assert.equal(needMask(v, 2), BIT.C);
  assert.equal(needMask(v, 3), BIT.C | BIT.CD);
  assert.equal(needMask(v, 4), BIT.BD, 'seen only during a blend');
  assert.equal(needMask(v, 5), 0, 'never seen: Tier 3');
  assert.equal(needMask(v, 0), 255, 'untracked geometry (id 0) is needed everywhere');
  assert.equal(needMask(v, -1), 255);
});

test('needMask: pixels behind an occluder (reveal windows) count like visible ones', () => {
  const v = result(4, { B: [[1, 2]] }, { B: [[2, 5]], AB: [[1, 1]] });
  assert.equal(needMask(v, 1), BIT.B | BIT.AB);
  assert.equal(needMask(v, 2), BIT.B, 'only the behind pass shows it');
  assert.equal(needMask(v, 3), 0);
});

test('cfgMask: framings on screen and the blends between them', () => {
  assert.equal(cfgMask(['A']), BIT.A);
  assert.equal(cfgMask(['D']), BIT.D);
  assert.equal(cfgMask(['A', 'B']), BIT.A | BIT.B | BIT.AB);
  assert.equal(cfgMask(['C', 'D']), BIT.C | BIT.D | BIT.CD);
  assert.equal(cfgMask(['B', 'D']), BIT.B | BIT.D | BIT.BD);
  assert.equal(cfgMask(['B', 'C', 'D']), BIT.B | BIT.C | BIT.D | BIT.BC | BIT.CD | BIT.BD, 'an interrupted blend: every pair on screen');
  assert.equal(cfgMask(['A', 'C']), BIT.A | BIT.C, 'no AC set');
});
