// Every baked sheet in production is clean (journal Passe SA1, the operator: « en combat j'ai remarque le fond d'un sprite n'est pas totalement transparent ( gris il me semble ) il faut
// audit et corriger cela et s'assurer que les autres sprites sont clean aussi »): Marek's `strike.1` carried the green ground of its pose sheet, kept opaque by reconstruct-grid and turned beige
// grey by the palette, the greys of the figure cleared in its place. The rule the audit justifies, on every frame of every production sheet: binary alpha, a transparent ring, and no background
// left in the cell: the figure never fills its own box like a rectangle (the defect 0.95; the fullest real figure 0.81 in town, 0.69 in combat) nor runs a straight edge of half the cell (the
// defect 165 texels; a blade 61 of 192, a town figure 25 of 64). Then the chain's own guard: reconstruct-grid's corner must be the sheet's background.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './load.mjs';
import { decodePng } from '../tools/art-lab/png.mjs';

const json = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
/** the production sheets: every approved character manifest the game may load */
const PRODUCTION = fs.readdirSync(path.join(ROOT, 'art-lab/characters/manifests')).filter((f) => f.endsWith('.manifest.json'))
  .map((f) => json(`art-lab/characters/manifests/${f}`)).filter((m) => m.kind === 'character' && m.approved && m.runtimeUse === 'production').map((m) => m.id).sort();
/** a figure's opaque share of its own box, at most */
const FILL = 0.9;

/** each frame of a sheet, measured: partial alpha, opaque texels on the cell's ring, the box's fill, the longest straight silhouette edge */
function measure(id) {
  const img = decodePng(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`))), meta = json(`art-lab/characters/exports/${id}.json`);
  const frames = Array.isArray(meta.frames) ? meta.frames : Object.values(meta.frames), tags = meta.meta.frameTags ?? [];
  const partial = img.rgba.filter((v, i) => i % 4 === 3 && v !== 0 && v !== 255).length;
  return { partial, frames: frames.map((f, n) => {
    const { x: fx, y: fy, w, h } = f.frame, ox = f.spriteSourceSize.x, oy = f.spriteSourceSize.y, W = f.sourceSize.w, H = f.sourceSize.h;
    const op = (x, y) => { x -= ox; y -= oy; return x >= 0 && y >= 0 && x < w && y < h && img.rgba[((fy + y) * img.W + fx + x) * 4 + 3] === 255; };
    let x0 = W, y0 = H, x1 = -1, y1 = -1, count = 0, ring = 0, run = 0;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (op(x, y)) { count++; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); if (!x || !y || x === W - 1 || y === H - 1) ring++; }
    // straight runs of silhouette edge: along the rows (open above or below), along the columns (open left or right)
    for (let y = 0; y < H; y++) for (const d of [-1, 1]) { let r = 0; for (let x = 0; x < W; x++) { r = op(x, y) && !op(x, y + d) ? r + 1 : 0; run = Math.max(run, r); } }
    for (let x = 0; x < W; x++) for (const d of [-1, 1]) { let r = 0; for (let y = 0; y < H; y++) { r = op(x, y) && !op(x + d, y) ? r + 1 : 0; run = Math.max(run, r); } }
    const t = tags.find((t) => n >= t.from && n <= t.to);
    return { name: t ? `${t.name}.${n - t.from}` : `#${n}`, W, fill: count / ((x1 - x0 + 1) * (y1 - y0 + 1)), ring, run, count };
  }) };
}

test('every production sheet is measured: the town, the casting, the citizens, the hero and the combat sheets', () => {
  for (const id of ['hero-x2-v4', 'dockworker-x2-v2', 'marek-x2-v2', 'girl-x2-v1', 'hero-x3-combat', 'marek-x3-combat', 'tobin-x3-combat']) assert.ok(PRODUCTION.includes(id), id);
  assert.ok(PRODUCTION.length >= 39, `${PRODUCTION.length} production sheets`);
});

test('no background left in a production sheet: binary alpha, a transparent ring, no figure filling its box, no straight edge of half the cell', () => {
  const bad = [];
  for (const id of PRODUCTION) {
    const { partial, frames } = measure(id);
    if (partial) bad.push(`${id}: ${partial} texels of partial alpha`);
    for (const f of frames) {
      if (!f.count) bad.push(`${id} ${f.name}: empty`);
      if (f.ring) bad.push(`${id} ${f.name}: ${f.ring} opaque texels on the cell's ring`);
      if (f.fill > FILL) bad.push(`${id} ${f.name}: the figure fills ${(100 * f.fill).toFixed(0)} % of its box`);
      if (f.run >= f.W / 2) bad.push(`${id} ${f.name}: a straight edge of ${f.run} texels in a cell ${f.W} wide`);
    }
  }
  assert.deepEqual(bad, []);
});

test('the chain refuses a crop whose corner is not the background: Marek\'s cut, its grown head\'s box on the windup\'s blade', async () => {
  const R = await import('../tools/art-lab/rig-engine.mjs');
  const { isolate, grownBox, cornerIsBackground } = await import('../art-lab/characters/rigs/lib/combat.mjs');
  const rig = fs.readFileSync(path.join(ROOT, 'art-lab/characters/rigs/marek-x3-combat.rig.mjs'), 'utf8');
  assert.match(rig, /head: \{ s: 1\.3, r: 48 \}/);
  assert.match(rig, /cut: \{ sheet: 'a', box: \[1055, 144, 1470, 417\], head: \[1280, 194\]/);
  const sheet = R.load(path.join(ROOT, 'art-lab/characters/reference/sources/marek-combat-x3-2026-11-01-a.png'));
  const f = { box: [1055, 144, 1470, 417], head: [1280, 194] }, crop = grownBox(f, 48, 1.3), pitch = +((281 * (2 / 3 + 1.3 / 3)) / 132).toFixed(4);
  assert.deepEqual(crop, [1055, 98, 1470, 417], 'the grown box reaches 46 pixels above the figure\'s');
  // the isolation over the figure's box alone (the chain before Passe SA1): the windup's blade stays in the crop's corner
  const before = isolate(sheet, f.box, 60);
  assert.throws(() => cornerIsBackground('cut', before.im, crop, pitch, before.bg, 60), /not the sheet's background/);
  // over the crop too: the corner is the green ground
  const after = isolate(sheet, f.box, 60, crop);
  assert.doesNotThrow(() => cornerIsBackground('cut', after.im, crop, pitch, after.bg, 60));
});
