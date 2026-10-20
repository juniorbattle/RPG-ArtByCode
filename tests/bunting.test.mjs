// The tournament's bunting (src/props/Bunting.ts, journal Passe Y3): blue and ivory pennants hanging under their cords, along the frontage
// (the first upper floor's anchors), across the street to the quay lamps and along the quay wall with the landing steps left clear; the
// back-row houses ('bg*') carry none; no random draw (two builds are identical); only built by day (the generator's opts.bunting).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const { garland, buildBunting } = await load('/src/props/Bunting.ts');
const { SlotSet } = await load('/src/core/MeshBuilder.ts');

const sock = (building, tag, pos) => ({ kind: 'bunting', tag, pos, dir: [0, 0, 1], building });
const SOCKETS = [
  sock('a', 'left1', [0, 6, -1]), sock('a', 'right1', [8, 6, -1]), sock('a', 'left', [0, 9, -1]), sock('a', 'right', [8, 9, -1]),
  sock('bgX', 'left1', [20, 6, -9]), sock('bgX', 'right1', [28, 6, -9]),
];
const INPUT = (sockets) => ({ sockets, lampTops: [[1, 3.05, 4.15]], quay: { x0: 0, x1: 12, y: -0.02, z: 5.04, skip: [[5, 8]] } });
const build = (sockets = SOCKETS) => { const S = new SlotSet(); buildBunting(S, INPUT(sockets)); return S.cloth; };

test('a garland: pennants hang under the cord, only blue, ivory and the cord', () => {
  const S = new SlotSet();
  garland(S, [0, 5, 0], [4, 5, 0], 0.3, { size: 0.4, width: 0.3, spacing: 0.4 });
  const b = S.cloth, cols = new Set();
  const stride = b.tint.length / b.vertexCount;   // the tint carries more than rgb per vertex
  for (let i = 0; i < b.tint.length; i += stride) cols.add(b.tint.slice(i, i + 3).map((v) => v.toFixed(2)).join(','));
  assert.deepEqual([...cols].sort(), ['0.20,0.30,0.78', '0.30,0.26,0.22', '1.00,0.94,0.78'], 'blue, ivory and the cord, nothing else');
  const ys = []; for (let i = 1; i < b.pos.length; i += 3) ys.push(b.pos[i]);
  assert.ok(Math.max(...ys) <= 5 + 1e-9, 'nothing above the anchors');
  assert.ok(Math.min(...ys) < 5 - 0.3 - 0.35, 'the pennants hang below the sagging cord');
});

test('buildBunting: front swags on the first upper floor, one garland to each quay lamp, the quay row clear of the steps; no back-row house', () => {
  const b = build();
  const xs = [], zs = [];
  for (let i = 0; i < b.pos.length; i += 3) { xs.push(b.pos[i]); zs.push(b.pos[i + 2]); }
  // nothing on the back-row house (x 20..28, z -9), nothing from the top-of-facade anchors (y 9)
  assert.ok(!zs.some((z) => z < -1.5), 'the bg house carries no bunting');
  const ys = []; for (let i = 1; i < b.pos.length; i += 3) ys.push(b.pos[i]);
  assert.ok(Math.max(...ys) <= 6 + 1e-9, 'the first upper floor anchors (y 6), not the eaves (y 9)');
  // the quay row: on the wall (z 5.04), never over the landing steps (x 5..8)
  const onQuay = xs.filter((_, k) => Math.abs(zs[k] - 5.04) < 1e-6);
  assert.ok(onQuay.length > 0 && !onQuay.some((x) => x > 5 && x < 8), 'the quay row skips the steps');
  // the garland to the lamp ends at its top
  assert.ok(xs.some((x, k) => Math.abs(x - 1) < 1e-6 && Math.abs(zs[k] - 4.15) < 1e-6), 'a garland reaches the lamp top');
  // the back-row sockets change nothing
  assert.equal(build(SOCKETS.filter((s) => !s.building.startsWith('bg'))).triCount, b.triCount);
});

test('no random draw: two builds are identical; built only by day (the generator gates it on opts.bunting, which App sets from the day)', () => {
  const a = build(), b = build();
  assert.deepEqual(a.pos, b.pos); assert.deepEqual(a.idx, b.idx);
  const gen = fs.readFileSync('src/district/MerchantDistrictGenerator.ts', 'utf8');
  assert.match(gen, /if \(opts\.bunting\) world\.inPart\(0, \(\) => buildBunting\(/);
  assert.match(fs.readFileSync('src/app/App.ts', 'utf8'), /bunting: this\.day/);
  assert.doesNotMatch(fs.readFileSync('src/props/Bunting.ts', 'utf8'), /Math\.random|rng\./);
});
