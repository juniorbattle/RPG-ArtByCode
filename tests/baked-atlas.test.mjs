// The baked characters' texture (src/characters/SpriteAtlas.ts, journal Passe T1): frames are shelf-packed in columns of 1024 x 2048 texels
// (the WebGL2 guarantee), a second column opens past 336 x2 frames, and a frame's cell never moves when frames are added after it. Oracle:
// the single-column formula of the texture as it was (16 x2 frames per shelf of 96 rows), written here independently of the packer.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const { packBaked, SpriteAtlas } = await load('/src/characters/SpriteAtlas.ts');
const cast = await load('/src/characters/BakedCast.ts');

const old = (n) => [(n % 16) * 64, Math.floor(n / 16) * 96, 64, 96];

test('one column: the x2 frames pack exactly as the single-column texture did', () => {
  for (const n of [1, 16, 17, 322, 336]) {
    const p = packBaked(Array(n).fill(2));
    assert.equal(p.width, 1024, `${n} frames`);
    assert.equal(p.height, Math.ceil(n / 16) * 96, `${n} frames`);
    p.cells.forEach((c, i) => assert.deepEqual(c, old(i), `frame ${i} of ${n}`));
  }
  assert.deepEqual(packBaked([]), { cells: [], width: 1, height: 1 });
});

test('past 336 x2 frames a second column opens; the first column does not move', () => {
  const p = packBaked(Array(358).fill(2));
  assert.equal(p.width, 2048); assert.equal(p.height, 2016);
  p.cells.slice(0, 336).forEach((c, i) => assert.deepEqual(c, old(i), `frame ${i}`));
  p.cells.slice(336).forEach((c, j) => assert.deepEqual(c, [1024 + (j % 16) * 64, Math.floor(j / 16) * 96, 64, 96], `frame ${336 + j}`));
  for (const c of p.cells) assert.ok(c[0] + c[2] <= 2048 && c[1] + c[3] <= 2048, 'inside the WebGL2 guarantee');
  const full = packBaked(Array(672).fill(2));
  assert.equal(full.width, 2048); assert.equal(full.height, 2016);
  assert.equal(new Set(full.cells.map((c) => `${c[0]},${c[1]}`)).size, 672, 'no two frames share a cell');
  assert.throws(() => packBaked(Array(673).fill(2)), /baked sprite texture full/);
});

test('a new density starts a new shelf, in the column that has room', () => {
  const p = packBaked([2, 2, 1, 1, 2]);
  assert.deepEqual(p.cells, [[0, 0, 64, 96], [64, 0, 64, 96], [0, 96, 32, 48], [32, 96, 32, 48], [0, 144, 64, 96]]);
  assert.equal(p.height, 240);
  // a shelf of x3 frames (144 rows) that no longer fits under 2048 rows goes to the next column
  const q = packBaked([...Array(320).fill(2), 3]);
  assert.deepEqual(q.cells.at(-1), [1024, 0, 96, 144]);
  assert.equal(q.height, 1920);
  assert.throws(() => packBaked([64]), /larger than a column/);
});

/** fetch served from the repo (the `?url` imports resolve to root-relative paths) */
async function withRepoFetch(fn) {
  const real = globalThis.fetch;
  globalThis.fetch = async (url) => new Response(fs.readFileSync(path.join(ROOT, decodeURIComponent(String(url)).replace(/[?#].*$/, '').replace(/^\//, ''))));
  try { return await fn(); } finally { globalThis.fetch = real; }
}

test('the production NPCs keep their texture byte for byte; the hero, loaded last, fills the first column and opens the second', async () => {
  await withRepoFetch(async () => {
    // the hero in production (journal Passes H10, H11): the last entry of the cast, after the NPCs approved on 2026-10-17
    const prod = await cast.loadProductionCast(false), withCand = await cast.loadProductionCast(true);
    assert.equal(prod.sheets.at(-1).id, 'hero-x2-v4', 'the hero is the last production sheet');
    const npcs = prod.sheets.slice(0, -1), extra = prod.sheets.slice(-1);
    const a = SpriteAtlas.build([], npcs, 2048), b = SpriteAtlas.build([], prod.sheets, 2048);
    const n = npcs.reduce((s, x) => s + x.frames.length, 0), total = n + extra[0].frames.length;
    assert.ok(n <= 336, `${n} NPC frames fit one column`);
    assert.deepEqual([a.bakedWidth, a.bakedHeight], [1024, Math.ceil(n / 16) * 96]);
    assert.ok(total > 336 && total <= 672, `${total} production frames: past one column, within the two guaranteed`);
    assert.equal(b.bakedWidth, 2048);
    assert.ok(b.bakedHeight <= 2048);
    // DEV candidates (none today) come after the production cast and move none of its frames
    assert.deepEqual(withCand.sheets.slice(0, prod.sheets.length).map((s) => s.id), prod.sheets.map((s) => s.id));
    // every production frame: same cell, same bytes (texture of 1024 vs 2048 columns: compared texel by texel)
    let frames = 0;
    for (const [key, r] of a.frames) {
      if (!r.cell) continue;
      const rb = b.frames.get(key);
      assert.deepEqual(rb.cell, r.cell, key);
      const [x0, y0, w, h] = r.cell;
      for (let y = y0; y < y0 + h; y++) {
        const ra = a.bakedRgba.subarray((y * 1024 + x0) * 4, (y * 1024 + x0 + w) * 4), rbb = b.bakedRgba.subarray((y * 2048 + x0) * 4, (y * 2048 + x0 + w) * 4);
        assert.ok(Buffer.from(ra).equals(Buffer.from(rbb)), `${key} row ${y}`);
      }
      frames++;
    }
    assert.equal(frames, n);
    // the hero's frames fill the last shelf of the first column, then the second column
    const hero = extra.flatMap((s) => s.frames.map((f) => b.frames.get(`${s.id}/${f.dir}/${f.anim}/${f.i}`).cell));
    assert.equal(hero.filter((c) => c[0] >= 1024).length, total - 336);
  });
});
