// Rig of hero-x2-v4 (lab candidate, not approved): hero-x2-v3 (the production hero, Passes H8-H10) with DRAWN run cycles in the front, back
// and three-quarter facings, and a three-quarter back idle turned further away. The operator, word for word (journal Passe K10): « Refais les
// cycles de face et de dos du héros en course, comme le profil (bras et jambes), et corrige son trois-quarts dos trop tourné ; montre-moi avant
// la production. »
// - Kept from hero-x2-v3, texel for texel: its palette (pinned: its export), its front, three-quarter front, profile and back idle views (its
//   provenance pack) and its profile run (rebuilt by hero-x2-v3's own rig from the v3 sheet's run row). Its idle frames in those four facings
//   and its walk-side frames are therefore hero-x2-v3's; so are its height (the front idle) and its ground speed (the profile run's slide).
// - New: the run cycles of the front, back, three-quarter front and three-quarter back facings, eight frames each, are the run frames drawn by
//   the image tool on generated sheets (journal Passe K11; archived as NON-CANONICAL sources, reference/sources/hero-run-v4-2026-10-20-*), each
//   figure reconstructed at the pitch that gives its head hero-x2-v3's head height, mapped onto the palette, cleaned like the views, its head
//   on one column for the cycle and lifted as far as the sheet lifts it above the row's ground line (`drawnRun`). The three-quarter back idle
//   is the generated sheet's corrected view (« mostly his back »), reconstructed and prepared through the build's own chain.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v4.rig.mjs`.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as R from '../../../tools/art-lab/rig-engine.mjs';
import * as V3 from './hero-x2-v3.rig.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const id = 'hero-x2-v4';
const V3PACK = 'art-lab/characters/provenance/hero-x2-v3';
const SRC = 'art-lab/characters/reference/sources';

export const source = {
  // the three-quarter back idle: sheet b2, second row, first figure (facing left, « mostly his back »), at the pitch of that sheet's heads
  sheet: `${SRC}/hero-run-v4-2026-10-20-b2.png`,
  pitch: 2.77,
  views: { upSide: '390,556,517,798' },
  keep: { down: `${V3PACK}/view-down.png`, downSide: `${V3PACK}/view-downSide.png`, side: `${V3PACK}/view-side.png`, up: `${V3PACK}/view-up.png` },
  palette: { from: 'art-lab/characters/exports/hero-x2-v3.png' },
  options: { holes: true, noShadow: true, closingFrom: 48 },
};

/** what this rig takes from hero-x2-v3 (its views, its export as the palette, its rig, which rebuilds its frames) must be what hero-x2-v3's
 *  provenance pack hashes: a changed file is refused (text hashed with LF line endings, as the packs do) */
function checkV3() {
  const files = JSON.parse(fs.readFileSync(path.join(ROOT, V3PACK, 'PROVENANCE.json'), 'utf8')).files;
  const used = [...['down', 'downSide', 'side', 'upSide', 'up'].map((d) => `${V3PACK}/view-${d}.png`), source.palette.from, 'art-lab/characters/rigs/hero-x2-v3.rig.mjs'];
  for (const rel of used) {
    let b = fs.readFileSync(path.join(ROOT, rel)); if (rel.endsWith('.mjs')) b = Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
    const got = crypto.createHash('sha256').update(b).digest('hex');
    if (got !== files[rel]) throw new Error(`${rel}: SHA-256 ${got}, hero-x2-v3's provenance pack records ${files[rel]}`);
  }
}
checkV3();

/** the kept views are hero-x2-v3's prepared views (used as they are); the new view gets hero-x2-v3's preparation (halo, strands, slits,
 *  feet centred on the anchor column; no face edit in a three-quarter back) */
export function prepare(dir, v) {
  return source.keep[dir] ? v : V3.prepare(dir, v);
}

// ---- the drawn runs: the generated sheets (SHA-256 checked before use) and, per facing, the row's eight figure boxes (frames 0-7, left to
// right: the prompt's order, right foot contact, down, passing, flight, then the left foot) with the pitch that gives the head hero-x2-v3's
// (measured on each sheet: the head's rows against hero-x2-v3's idle views)
const SHEETS = {
  a1: { path: `${SRC}/hero-run-v4-2026-10-20-a1.png`, sha256: '91b7635ab05a3bbba1b9b07aedf82cba27b929e2ee1c6e45d94db8941bb1c8dd' },
  a2: { path: `${SRC}/hero-run-v4-2026-10-20-a2.png`, sha256: 'd45a10d4b02b09d778b215dd092cdf91f46f07b3c4cd4cad01c3b0f387cb78c0' },
  b1: { path: `${SRC}/hero-run-v4-2026-10-20-b1.png`, sha256: '79b39a5d5ac91b02382b03ce991cf6c77720b30f9068835e677cd0af2eceb7dd' },
};
const RUNS = {
  // sheet a1, first row: the front run. Its cape flares to 172 sheet pixels: at the head's pitch (2.67) the widest frame is 64.4 texels, wider than
  // the frame; at 2.78 it is 62 (the border ring kept) and the runner stands 3-4 rows lower than the idle (the profile run: 6-8 rows lower)
  down: { sheet: 'a1', pitch: 2.78, boxes: ['44,90,213,319', '258,92,413,319', '441,92,612,319', '644,92,801,319', '830,92,992,316', '1017,91,1170,319', '1201,94,1354,321', '1372,94,1508,316'] },
  // sheet a2, second row: the back run (its elbows and fists swing out beside the cape)
  up: { sheet: 'a2', pitch: 2.72, boxes: ['54,368,204,608', '245,368,385,596', '441,367,593,599', '625,366,774,606', '810,366,941,607', '986,369,1146,608', '1180,368,1327,608', '1359,370,1506,598'] },
  // sheet b1, first row: the three-quarter front run, facing left
  downSide: { sheet: 'b1', pitch: 2.93, boxes: ['50,179,221,427', '238,180,403,429', '425,179,589,423', '603,174,773,427', '793,177,956,428', '975,174,1148,428', '1166,174,1327,426', '1344,178,1512,428'] },
  // sheet a1, third row: the three-quarter back run, facing left
  upSide: { sheet: 'a1', pitch: 2.67, boxes: ['56,673,211,901', '270,672,413,904', '469,672,610,898', '667,674,812,897', '859,673,1000,899', '1049,674,1193,908', '1237,674,1367,904', '1387,675,1516,902'] },
};

/** a generated sheet's figures: the 5 x 5-connected components of its foreground (more than 40 off the median of the four corners per
 *  channel) with at least 4000 pixels; returns the image, its background colour and a lookup from a figure's box to its component */
function figures(key) {
  const s = SHEETS[key], file = path.join(ROOT, s.path), got = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if (got !== s.sha256) throw new Error(`${s.path}: SHA-256 ${got}, the rig expects ${s.sha256}`);
  const im = R.load(file), { W, H, px } = im;
  const corner = [[2, 2], [W - 3, 2], [2, H - 3], [W - 3, H - 3]].map(([x, y]) => [0, 1, 2].map((k) => px[(y * W + x) * 4 + k]));
  const bg = [0, 1, 2].map((k) => corner.map((c) => c[k]).sort((a, b) => a - b)[1]);
  const fg = (i) => Math.max(Math.abs(px[i * 4] - bg[0]), Math.abs(px[i * 4 + 1] - bg[1]), Math.abs(px[i * 4 + 2] - bg[2])) > 40;
  const lab = new Int32Array(W * H).fill(-1), boxes = new Map();
  for (let s0 = 0, id = 0; s0 < W * H; s0++) {
    if (lab[s0] >= 0 || !fg(s0)) continue;
    const q = [s0]; lab[s0] = id; let x0 = W, y0 = H, x1 = 0, y1 = 0;
    for (let h = 0; h < q.length; h++) {
      const i = q[h], x = i % W, y = (i - x) / W; x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const u = x + dx, v = y + dy; if (u < 0 || v < 0 || u >= W || v >= H) continue; const j = v * W + u; if (lab[j] < 0 && fg(j)) { lab[j] = id; q.push(j); } }
    }
    if (q.length >= 4000) boxes.set([x0, y0, x1, y1].join(','), id);
    id++;
  }
  return { im, bg, lab, boxes };
}
/** every colour replaced by the nearest (OKLab) colour of the palette */
function toPalette(im, pal) {
  const P = pal.map((c) => [c, R.oklab(c)]), memo = new Map();
  return R.recolour(im, (c) => { const k = c.join(','); if (!memo.has(k)) { const o = R.oklab(c); let best = null, bd = 1e9; for (const [p, q] of P) { const d = (q[0] - o[0]) ** 2 + (q[1] - o[1]) ** 2 + (q[2] - o[2]) ** 2; if (d < bd) { bd = d; best = p; } } memo.set(k, best); } return memo.get(k); });
}
/** the head's centre column: the mean column of the opaque texels on the figure's top 25 rows */
function headX(im) { const t = R.top(im); let s = 0, n = 0; for (let y = t; y <= t + 24; y++) for (let x = 0; x < im.W; x++) if (R.opaque(im, x, y)) { s += x; n++; } return s / n; }

/** opaque columns of a frame: [first, last] */
function span(im) { let a = im.W, b = -1; for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (R.opaque(im, x, y)) { a = Math.min(a, x); b = Math.max(b, x); } return [a, b]; }
const count = (im) => { let n = 0; for (let i = 3; i < im.px.length; i += 4) if (im.px[i]) n++; return n; };

// ---- hero-x2-v3's cleaning of a reconstructed view (its prepare without the final `align`, which centres the feet on the anchor column: a run
// frame's stride and flying cape are wider than a standing view, and that move pushed the cape out of the frame), copied as they are
const chroma = (c) => { const [, a, b] = R.oklab(c); return Math.hypot(a, b); };
/** loose texels: 4-connected islands of fewer than `min` texels */
function despeckle(im, min) {
  const o = R.clone(im), seen = new Uint8Array(im.W * im.H);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (seen[y * im.W + x] || !R.opaque(im, x, y)) continue;
    const comp = [], st = [[x, y]]; seen[y * im.W + x] = 1;
    while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); for (const [p, q] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) if (p >= 0 && q >= 0 && p < im.W && q < im.H && !seen[q * im.W + p] && R.opaque(im, p, q)) { seen[q * im.W + p] = 1; st.push([p, q]); } }
    if (comp.length < min) for (const [a, b] of comp) R.put(o, a, b, null);
  }
  return o;
}
/** the sheet's grey background blended into the figure's border cells (edge texels of a neutral grey as light as the background), peeled twice */
function dehalo(v) {
  let o = R.clone(v);
  for (let pass = 0; pass < 2; pass++) {
    const n = R.clone(o);
    for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) {
      const c = R.get(o, x, y); if (!c) continue;
      if (R.opaque(o, x + 1, y) && R.opaque(o, x - 1, y) && R.opaque(o, x, y + 1) && R.opaque(o, x, y - 1)) continue;
      const L = R.oklab(c)[0]; if (chroma(c) < 0.012 && L > 0.49 && L < 0.66) R.put(n, x, y, null);
    }
    o = n;
  }
  return o;
}
/** thin vertical strands below row 60 (runs of >= 2 texels one texel wide), then detached islands of fewer than 6 texels */
function cleanStrands(v) {
  const o = R.clone(v);
  for (let x = 1; x < v.W - 1; x++) for (let y = 60; y < v.H; y++) {
    if (!R.opaque(v, x, y) || R.opaque(v, x - 1, y) || R.opaque(v, x + 1, y)) continue;
    let e = y; while (e + 1 < v.H && R.opaque(v, x, e + 1) && !R.opaque(v, x - 1, e + 1) && !R.opaque(v, x + 1, e + 1)) e++;
    if (e > y) for (let k = y; k <= e; k++) R.put(o, x, k, null);
    y = e;
  }
  return despeckle(o, 6);
}
/** one-texel slits from row 56 down, filled with the darker neighbour */
function closeSlits(v) {
  const o = R.clone(v);
  for (let y = 56; y < v.H; y++) for (let x = 1; x < v.W - 1; x++) {
    if (R.opaque(v, x, y) || !R.opaque(v, x - 1, y) || !R.opaque(v, x + 1, y)) continue;
    const a = R.get(v, x - 1, y), b = R.get(v, x + 1, y);
    R.put(o, x, y, R.oklab(a)[0] <= R.oklab(b)[0] ? a : b);
  }
  return o;
}

/** the eight run frames of one facing: each figure alone on the sheet (the other figures painted with the background), reconstructed like the
 *  views, on the palette, cleaned like the views, and placed: its head on one column for the whole cycle (the idle view's when every frame then
 *  stays off the frame's border ring; else the column that keeps the frames nearest to it, a frame held one texel off it when the rounding asks),
 *  its lowest texel lifted above the foot row as many texels as its sheet figure stands above the row's ground line. The ground line is the
 *  row's median figure bottom (the sheets' baselines wander by a few pixels, and in a three-quarter view the near foot lands lower than the far
 *  one: with the lowest figure as the ground, most frames floated); a figure at or below it stands on the foot row. A texel pushed out of the
 *  frame is an error, never a silent crop. */
export function drawnRun(dir, pal, idle) {
  const run = RUNS[dir], F = figures(run.sheet), { W, H } = F.im;
  const bottoms = run.boxes.map((b) => +b.split(',')[3]).sort((a, b) => a - b), ground = (bottoms[3] + bottoms[4]) / 2;
  const ropt = ['--holes', '--no-shadow', `--closing-from=${source.options.closingFrom}`];
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `artlab-${id}-${dir}-`)), drawn = [];
  try {
    run.boxes.forEach((b, k) => {
      const comp = F.boxes.get(b); if (comp === undefined) throw new Error(`${dir} frame ${k}: no figure with the box ${b} on ${SHEETS[run.sheet].path}`);
      const m = R.clone(F.im);
      for (let i = 0; i < W * H; i++) { const l = F.lab[i]; if (l >= 0 && l !== comp) { m.px[i * 4] = F.bg[0]; m.px[i * 4 + 1] = F.bg[1]; m.px[i * 4 + 2] = F.bg[2]; } }
      const [x0, y0, x1, y1] = b.split(',').map(Number), f = path.join(tmp, `f${k}.png`), pre = path.join(tmp, `f${k}`); R.save(f, m);
      execFileSync(process.execPath, [path.join(ROOT, 'tools/art-lab/reconstruct-grid.mjs'), f, [x0 - 3, y0 - 3, x1 + 3, y1 + 3].join(','), String(run.pitch), String(R.FW), String(R.FH), String(R.FOOT), pre, 'full', ...ropt], { stdio: 'ignore' });
      const rep = JSON.parse(fs.readFileSync(`${pre}.json`, 'utf8')); if (rep.clipped) throw new Error(`${dir} frame ${k}: the reconstruction clipped ${rep.clipped} cells`);
      drawn.push({ v: closeSlits(cleanStrands(dehalo(toPalette(R.load(`${pre}-full.png`), pal)))), lift: Math.max(0, Math.round((ground - y1) / run.pitch)) });
    });
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  // the head columns each frame allows (all of it within columns 1 .. FW - 2), and the shared column
  const lo = Math.max(...drawn.map(({ v }) => headX(v) - span(v)[0] + 1)), hi = Math.min(...drawn.map(({ v }) => headX(v) + (R.FW - 2 - span(v)[1])));
  const col = lo <= hi ? Math.min(hi, Math.max(lo, headX(idle))) : (lo + hi) / 2;
  return drawn.map(({ v, lift }, k) => {
    const [s0, s1] = span(v), dx = Math.min(R.FW - 2 - s1, Math.max(1 - s0, Math.round(col - headX(v))));
    const moved = R.shift(v, dx, R.FOOT - lift - R.bottom(v)), [a, b] = span(moved);
    if (count(moved) !== count(v) || a < 1 || b > R.FW - 2 || R.top(moved) < 1) throw new Error(`${dir} frame ${k}: placed out of the frame`);
    return moved;
  });
}

export const DIRS5 = V3.DIRS5;
/** hero-x2-v3's frames (rebuilt by its rig from its pack's views), with the new three-quarter back idle and the drawn runs in place of the rigged
 *  front / back / three-quarter runs */
export function frames(V) {
  const v3 = Object.fromEntries(DIRS5.map((d) => [d, R.load(path.join(ROOT, V3PACK, `view-${d}.png`))]));
  const pal = R.paletteOf(...DIRS5.map((d) => v3[d]));
  const runs = Object.fromEntries(Object.keys(RUNS).map((d) => [d, drawnRun(d, pal, V[d])]));
  const [inhale, exhale] = R.breath(V.upSide, 32, 35, 62), upIdle = [R.clone(V.upSide), R.clone(V.upSide), inhale, exhale];
  return V3.frames(v3).map((f) => {
    if (f.anim === 'idle' && f.dir === 'upSide') return { ...f, im: upIdle[f.i] };
    if (f.anim === 'walk' && runs[f.dir]) return { ...f, im: runs[f.dir][f.i] };
    return f;
  });
}
