// The frame cap's URL grammar (src/app/FrameCap.ts parseFrameCap / frameCapLabel, AGENTS.md "fps="): off | <n> | v<k> | e<n> | a<n>; anything
// else is not a cap (the default a60 applies). Test gap listed in journal Passe Q1, filled in Passe Q2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const { parseFrameCap, frameCapLabel } = await load('/src/app/FrameCap.ts');

test('parseFrameCap: every accepted form', () => {
  assert.equal(parseFrameCap(null), null, 'absent');
  assert.deepEqual(parseFrameCap('off'), { kind: 'off' });
  assert.deepEqual(parseFrameCap('max'), { kind: 'off' });
  assert.deepEqual(parseFrameCap('60'), { kind: 'fps', fps: 60 });
  assert.deepEqual(parseFrameCap('144'), { kind: 'fps', fps: 144 });
  assert.deepEqual(parseFrameCap('v1'), { kind: 'vsync', every: 1 });
  assert.deepEqual(parseFrameCap('v3'), { kind: 'vsync', every: 3 });
  assert.deepEqual(parseFrameCap('e60'), { kind: 'even', fps: 60 });
  assert.deepEqual(parseFrameCap('a60'), { kind: 'adaptive', fps: 60 });
  assert.deepEqual(parseFrameCap('a120'), { kind: 'adaptive', fps: 120 });
});

test('parseFrameCap: what is not a cap', () => {
  for (const s of ['', 'on', 'v0', 'v12', 'e6', 'e1000', 'a5', '7', '1000', '60fps', ' 60', 'a60 ', 'E60', 'v', 'off2']) assert.equal(parseFrameCap(s), null, JSON.stringify(s));
});

test('frameCapLabel writes back what parseFrameCap reads', () => {
  for (const s of ['off', '60', '144', 'v1', 'v2', 'e60', 'e72', 'a60', 'a144']) assert.equal(frameCapLabel(parseFrameCap(s)), s);
  assert.equal(frameCapLabel(parseFrameCap('max')), 'off');
});
