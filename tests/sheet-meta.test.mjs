// Aseprite sheet metadata (parseAsepriteJson, src/characters/SheetMeta.ts) and its cut into baked frames (sheetFrames,
// src/characters/BakedDecode.ts): the committed exports, both Aseprite layouts, and the malformed inputs that must be refused.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const { parseAsepriteJson } = await load('/src/characters/SheetMeta.ts');
const { sheetFrames } = await load('/src/characters/BakedDecode.ts');

const EXPORTS = path.join(ROOT, 'art-lab/characters/exports');
const exportsJson = fs.readdirSync(EXPORTS).filter((f) => f.endsWith('.json')).sort();
const readJson = (f) => JSON.parse(fs.readFileSync(path.join(EXPORTS, f), 'utf8'));
/** width / height from the PNG's IHDR chunk */
const pngSize = (f) => { const b = fs.readFileSync(path.join(EXPORTS, f)); return { w: b.readUInt32BE(16), h: b.readUInt32BE(20) }; };

test('every committed export parses: frames inside the sheet, tags in range, sheet size = its PNG', () => {
  assert.ok(exportsJson.length >= 10);
  for (const f of exportsJson) {
    const json = readJson(f), m = parseAsepriteJson(json), png = pngSize(f.replace(/\.json$/, '.png'));
    assert.deepEqual([m.width, m.height], [png.w, png.h], f);
    assert.equal(m.frames.length, Array.isArray(json.frames) ? json.frames.length : Object.keys(json.frames).length, f);
    for (const fr of m.frames) assert.ok(fr.x >= 0 && fr.y >= 0 && fr.x + fr.w <= m.width && fr.y + fr.h <= m.height && fr.duration > 0, `${f}: ${fr.name}`);
    for (const t of m.tags) assert.ok(t.from >= 0 && t.from <= t.to && t.to < m.frames.length, `${f}: tag ${t.name}`);
  }
});

const frame = (x, extra = {}) => ({ frame: { x, y: 0, w: 2, h: 3 }, duration: 50, ...extra });
const sheet = (frames, meta = {}) => ({ frames, meta: { size: { w: 4, h: 3 }, frameTags: [{ name: 'walk-side', from: 0, to: 1 }], ...meta } });

test('json-array and json-hash layouts read the same', () => {
  const arr = parseAsepriteJson(sheet([{ filename: 'a', ...frame(0) }, { filename: 'b', ...frame(2) }]));
  const hash = parseAsepriteJson(sheet({ a: frame(0), b: frame(2) }));
  assert.deepEqual(hash, arr);
  assert.deepEqual(arr.frames[1], { name: 'b', x: 2, y: 0, w: 2, h: 3, sw: 2, sh: 3, ox: 0, oy: 0, duration: 50 });
  assert.deepEqual(arr.tags, [{ name: 'walk-side', from: 0, to: 1, direction: 'forward' }]);
});

test('defaults: unnamed frames take their index, a missing or zero duration is 100 ms, trimmed frames keep their offset', () => {
  const m = parseAsepriteJson(sheet([frame(0, { duration: 0 }), { frame: { x: 2, y: 0, w: 1, h: 2 }, sourceSize: { w: 2, h: 3 }, spriteSourceSize: { x: 1, y: 1, w: 1, h: 2 } }]));
  assert.deepEqual(m.frames.map((f) => [f.name, f.duration]), [['0', 100], ['1', 100]]);
  assert.deepEqual([m.frames[1].sw, m.frames[1].sh, m.frames[1].ox, m.frames[1].oy], [2, 3, 1, 1]);
});

test('tags outside the frame list are dropped', () => {
  const m = parseAsepriteJson(sheet([frame(0), frame(2)], { frameTags: [{ name: 'ok', from: 0, to: 1 }, { name: 'past', from: 1, to: 2 }, { name: 'back', from: 1, to: 0 }] }));
  assert.deepEqual(m.tags.map((t) => t.name), ['ok']);
});

test('malformed metadata is refused', () => {
  assert.throws(() => parseAsepriteJson({}), /no "frames"/);
  assert.throws(() => parseAsepriteJson(sheet([])), /no "frames"/);
  assert.throws(() => parseAsepriteJson(sheet([frame(0)], { size: { w: '4', h: 3 } })), /meta\.size\.w must be a number/);
  assert.throws(() => parseAsepriteJson(sheet([{ frame: { x: 'a', y: 0, w: 2, h: 3 } }])), /frames\[0\]\.frame\.x must be a number/);
  assert.throws(() => parseAsepriteJson(sheet([frame(3)])), /outside the 4x3 sheet/);
  assert.throws(() => parseAsepriteJson(sheet([frame(0, { rotated: true })])), /rotated/);
});

test('sheetFrames: <anim>-<dir> tags, frames cut texel for texel, size and tag checks', () => {
  const rgba = Uint8Array.from({ length: 4 * 3 * 4 }, (_, i) => i);
  const img = { w: 4, h: 3, rgba };
  const json = sheet([frame(0), frame(2)], { size: { w: 4, h: 3 }, frameTags: [{ name: 'walk-side', from: 0, to: 1 }] });
  const { frames } = sheetFrames('t', img, json);
  assert.deepEqual(frames.map((f) => [f.anim, f.dir, f.i]), [['walk', 'side', 0], ['walk', 'side', 1]]);
  const texel = (x, y) => [...rgba.subarray((y * 4 + x) * 4, (y * 4 + x) * 4 + 4)];
  assert.deepEqual([...frames[1].rgba.subarray(4, 8)], texel(3, 0));
  assert.deepEqual([...frames[1].rgba.subarray(20, 24)], texel(3, 2));
  assert.throws(() => sheetFrames('t', { ...img, w: 5 }, json), /JSON says 4x3, PNG is 5x3/);
  assert.throws(() => sheetFrames('t', img, { ...json, meta: { ...json.meta, frameTags: [{ name: 'dance-side', from: 0, to: 1 }] } }), /is not <anim>-<dir>/);
  const untagged = sheetFrames('t', img, { ...json, meta: { ...json.meta, frameTags: [] } }).frames;
  assert.deepEqual(untagged.map((f) => [f.anim, f.dir, f.i]), [['idle', 'down', 0], ['idle', 'down', 1]]);
});
