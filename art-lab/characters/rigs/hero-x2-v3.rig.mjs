// Rig of hero-x2-v3 (lab candidate, not approved): the protagonist in FIVE facings, idle (4 frames) and run (8 frames), from the eight-view
// turnaround generated with the image tool and archived as a non-canonical source (reference/sources/hero-turnaround-v4-2026-10-19-b.png,
// journal Passe I1), chosen by the operator as the source of the face and the three-quarter views (decision sheet, H4 « Source : la b »;
// H1 « Retouches d'abord (visage, palette) »; H3 « Cinq vues, le héros d'abord »; journal Passe D1). Views, all drawn facing left like the
// runtime's native side: 1st (front), 2nd (three-quarter front), 3rd (profile), 4th (three-quarter back), 5th (back); one joint 64-colour
// palette over the five. Pitch 3.4 sheet pixels per texel (the sheet has the scale of the v3 sheet: figures 290-293 px): 85-87 rows.
// The sheet draws no drop shadow (--no-shadow).
// Profile run: the eight drawn run frames of the v3 sheet (the run of hero-x2-v2, Pass H6: the 14-texel stride, flight frames), mapped onto
// this rig's palette: the v4-b sheet draws no run. Front / back / three-quarter runs: rigged like hero-x2-v2's front and back (bob, weight,
// cape sway, legs lifted 5 texels at most, hands dropping on the forward swing), with masks measured on each view.
// The face retouched at the texel (Pass H9, `FACE` in prepare): the reconstruction at pitch 3.4 lost the source's mouth and closed its eyes.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v3.rig.mjs`.
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as R from '../../../tools/art-lab/rig-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const id = 'hero-x2-v3';

export const source = {
  sheet: 'art-lab/characters/reference/sources/hero-turnaround-v4-2026-10-19-b.png',
  pitch: 3.4,
  views: { down: '5,377,198,681', downSide: '216,377,393,681', side: '424,377,560,681', upSide: '614,377,760,681', up: '772,377,961,681' },
  palette: { k: 64 },
  // background-grey cells enclosed by the figure cleared; no cast-shadow rule (the sheet draws none); the vertical closing from row 48 down
  options: { holes: true, noShadow: true, closingFrom: 48 },
};
/** the second source, the v3 sheet's run row (the profile run): checked by its SHA-256 before use (its record:
 *  reference/sources/hero-turnaround-v3-2026-10-19.source.json) */
const RUN_SHEET = { path: 'art-lab/characters/reference/sources/hero-turnaround-v3-2026-10-19.png', sha256: 'a86cea282b5645ec4ab008dd0dc469f76d5105e792a12b62ec587758385d29a1' };

const chroma = (c) => { const [, a, b] = R.oklab(c); return Math.hypot(a, b); };
/** the v3 sheet's drop shadow (its run frames only): neutral greys (OKLab chroma < 0.03, L 0.3-0.62) on rows >= 78, flooded from outside */
function dropShadow(v) {
  const o = R.clone(v), isGrey = (x, y) => { const c = R.get(o, x, y); if (!c || y < 78) return false; const L = R.oklab(c)[0]; return chroma(c) < 0.03 && L > 0.3 && L < 0.62; };
  let changed = true;
  while (changed) {
    changed = false;
    for (let y = 78; y < o.H; y++) for (let x = 0; x < o.W; x++) {
      if (!isGrey(x, y)) continue;
      if ([[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]].some(([p, q]) => q >= o.H || p < 0 || p >= o.W || !R.opaque(o, p, q))) { R.put(o, x, y, null); changed = true; }
    }
  }
  return o;
}
/** thin vertical strands below row `from` (runs of >= 2 texels one texel wide), then detached islands of fewer than 6 texels */
function cleanStrands(v, from = 60) {
  const o = R.clone(v);
  for (let x = 1; x < v.W - 1; x++) for (let y = from; y < v.H; y++) {
    if (!R.opaque(v, x, y) || R.opaque(v, x - 1, y) || R.opaque(v, x + 1, y)) continue;
    let e = y; while (e + 1 < v.H && R.opaque(v, x, e + 1) && !R.opaque(v, x - 1, e + 1) && !R.opaque(v, x + 1, e + 1)) e++;
    if (e > y) for (let k = y; k <= e; k++) R.put(o, x, k, null);
    y = e;
  }
  return despeckle(o, () => true, 6);
}
/** soles on the foot row and the feet (the lowest three rows) centred on the anchor column 31.5 */
function align(v) {
  const b = R.bottom(v); let x0 = 64, x1 = 0;
  for (let y = b - 2; y <= b; y++) for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  return R.shift(v, Math.round(31.5 - (x0 + x1) / 2), R.FOOT - b);
}
/** one-texel slits from row `from` down, filled with the darker neighbour */
function closeSlits(v, from = 56) {
  const o = R.clone(v);
  for (let y = from; y < v.H; y++) for (let x = 1; x < v.W - 1; x++) {
    if (R.opaque(v, x, y) || !R.opaque(v, x - 1, y) || !R.opaque(v, x + 1, y)) continue;
    const a = R.get(v, x - 1, y), b = R.get(v, x + 1, y);
    R.put(o, x, y, R.oklab(a)[0] <= R.oklab(b)[0] ? a : b);
  }
  return o;
}
/** loose texels: 4-connected islands of fewer than `min` texels inside `area` removed */
function despeckle(im, area, min = 6) {
  const o = R.clone(im), seen = new Uint8Array(im.W * im.H);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (seen[y * im.W + x] || !R.opaque(im, x, y)) continue;
    const comp = [], st = [[x, y]]; seen[y * im.W + x] = 1;
    while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); for (const [p, q] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) if (p >= 0 && q >= 0 && p < im.W && q < im.H && !seen[q * im.W + p] && R.opaque(im, p, q)) { seen[q * im.W + p] = 1; st.push([p, q]); } }
    if (comp.length < min && comp.every(([a, b]) => area(a, b))) for (const [a, b] of comp) R.put(o, a, b, null);
  }
  return o;
}
/** the sheet's grey background blended into the figure's border cells: edge texels of a neutral grey as light as the background (OKLab
 *  chroma < 0.012, L 0.49-0.66), peeled twice (the halo a blind critique found on hero-x2-v2, Pass H5) */
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
/** Pass H9, recorded texel edits of the face (operator decision H1 « Retouches d'abord (visage, palette) »; the blind critique of Pass H8:
 *  half-closed eyes, no mouth, the skin one tone), in the prepared views, colours of the joint palette (the palette is unchanged: the profile
 *  run is mapped onto it). Front: each pupil two rows tall (rows 25-26) with a shine on its inner side and the lit iris on row 27 (lash, pupil,
 *  glow: the eye reads open), a two-texel mouth on row 30, a shade along the cheeks and the chin. Three-quarter front: the near eye as the
 *  front's, the far eye's pupil two rows tall, the mouth under the nose. Profile: the dark iris at the front of the eye (the sclera kept behind
 *  it; the reconstruction left a white eye), the mouth at the contour. [x, y, colour] */
const PUPIL = '#151017', GLOW = '#b76d37', SHINE = '#f8e9d8', MOUTH = '#a37e71', SHADE = '#f8ba8f', SHADE2 = '#f6ad7a';
const FACE = {
  down: [[27, 25, PUPIL], [27, 26, PUPIL], [28, 26, SHINE], [27, 27, GLOW], [28, 27, GLOW],
    [36, 26, PUPIL], [35, 26, SHINE], [35, 27, GLOW], [36, 27, GLOW],
    [31, 30, MOUTH], [32, 30, MOUTH],
    [26, 28, SHADE], [26, 29, SHADE], [27, 30, SHADE], [29, 31, SHADE], [37, 27, SHADE], [37, 28, SHADE], [37, 29, SHADE], [36, 30, SHADE2], [34, 31, SHADE2]],
  downSide: [[32, 26, PUPIL], [31, 26, SHINE], [31, 27, GLOW], [32, 27, GLOW], [25, 26, PUPIL], [25, 27, GLOW], [28, 30, MOUTH], [29, 30, MOUTH]],
  side: [[26, 25, PUPIL], [26, 26, GLOW], [26, 29, MOUTH]],
};
export function prepare(dir, v) {
  return R.patch(align(closeSlits(cleanStrands(dehalo(v)))), (FACE[dir] ?? []).map(([x, y, c]) => ({ x, y, c })));
}

// ---- the v3 sheet's run frames (bottom row, facing right): each figure cut out of the row (a breadth-first fill through the foreground from a
// seed on its head; frames 3 and 4 touch), the others painted with the background, then reconstructed at the same pitch (hero-x2-v2)
const RUN_ROW = { y0: 736, y1: 1022, seeds: [98, 282, 450, 620, 834, 1014, 1191, 1362].map((x) => [x, 790]), bg: [117, 119, 118], thr: 40 };
function sheetRunFrames() {
  const file = path.join(ROOT, RUN_SHEET.path), got = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
  if (got !== RUN_SHEET.sha256) throw new Error(`${RUN_SHEET.path}: SHA-256 ${got}, the rig expects ${RUN_SHEET.sha256}`);
  const sh = R.load(file), { W, H } = sh, { y0, y1, bg, thr } = RUN_ROW;
  const fg = (x, y) => { const i = (y * W + x) * 4; return Math.max(Math.abs(sh.px[i] - bg[0]), Math.abs(sh.px[i + 1] - bg[1]), Math.abs(sh.px[i + 2] - bg[2])) > thr; };
  const lab = new Int8Array(W * H).fill(-1), q = [];
  for (const [k, [sx, sy]] of RUN_ROW.seeds.entries()) {
    let s = null; for (let r = 0; r < 40 && !s; r++) for (let dy = -r; dy <= r && !s; dy++) for (let dx = -r; dx <= r; dx++) if (fg(sx + dx, sy + dy)) { s = [sx + dx, sy + dy]; break; }
    lab[s[1] * W + s[0]] = k; q.push(s);
  }
  for (let h = 0; h < q.length; h++) {
    const [x, y] = q[h], k = lab[y * W + x];
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const u = x + dx, v = y + dy; if (u < 0 || v < y0 || u >= W || v > y1 || lab[v * W + u] >= 0 || !fg(u, v)) continue; lab[v * W + u] = k; q.push([u, v]); }
  }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `artlab-${id}-run-`)), out = [];
  const ropt = ['--holes', `--closing-from=${source.options.closingFrom}`];
  try {
    for (let k = 0; k < RUN_ROW.seeds.length; k++) {
      const m = R.clone(sh), box = [W, H, -1, -1];
      for (let y = y0; y <= y1; y++) for (let x = 0; x < W; x++) {
        const l = lab[y * W + x]; if (l < 0) continue;
        if (l !== k) { const i = (y * W + x) * 4; m.px[i] = bg[0]; m.px[i + 1] = bg[1]; m.px[i + 2] = bg[2]; }
        else { box[0] = Math.min(box[0], x); box[1] = Math.min(box[1], y); box[2] = Math.max(box[2], x); box[3] = Math.max(box[3], y); }
      }
      const f = path.join(tmp, `run${k}.png`), pre = path.join(tmp, `run${k}`); R.save(f, m);
      execFileSync(process.execPath, [path.join(ROOT, 'tools/art-lab/reconstruct-grid.mjs'), f, box.join(','), String(source.pitch), String(R.FW), String(R.FH), String(R.FOOT), pre, 'full', ...ropt], { stdio: 'ignore' });
      out.push(R.load(`${pre}-full.png`));
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  return out;
}
/** every colour replaced by the nearest (OKLab) colour of the palette */
function toPalette(im, pal) {
  const P = pal.map((c) => [c, R.oklab(c)]), memo = new Map();
  return R.recolour(im, (c) => { const k = c.join(','); if (!memo.has(k)) { const o = R.oklab(c); let best = null, bd = 1e9; for (const [p, q] of P) { const d = (q[0] - o[0]) ** 2 + (q[1] - o[1]) ** 2 + (q[2] - o[2]) ** 2; if (d < bd) { bd = d; best = p; } } memo.set(k, best); } return memo.get(k); });
}
/** the face: skin texels (OKLab L > 0.68, a > 0.025, b > 0.03) on rows top + 12 .. top + 27; its front column (facing left) and chin row */
function face(im) {
  const t = R.top(im); let fx = 99, cy = -1;
  for (let y = t + 12; y <= t + 27; y++) for (let x = 0; x < im.W; x++) { const c = R.get(im, x, y); if (!c) continue; const [L, a, b] = R.oklab(c); if (L > 0.68 && a > 0.025 && b > 0.03) { fx = Math.min(fx, x); cy = Math.max(cy, y); } }
  return [fx, cy];
}
const isBlue = (c) => R.oklab(c)[2] < -0.035;
const isTrousers = (c) => { const [L, a, b] = R.oklab(c); return L >= 0.27 && Math.hypot(a, b) < 0.045 && b >= -0.035; };
/** the v3 run frames, mirrored (facing left), shadowless, without the background halo, on this rig's palette, aligned on the face (front
 *  column 14, chin row 37: hero-x2-v2's alignment, the frame its foot track was measured in) */
export function runFrames(pal) {
  return sheetRunFrames().map((im) => { const u = toPalette(dehalo(R.mirror(dropShadow(im))), pal), [fx, cy] = face(u); return R.shift(u, 14 - fx, 37 - cy); });
}
/** a run frame split into its upper body (hero-x2-v2: rows < 58 but the front thigh's trousers from row 54 left of x 24; the coat's skirt on
 *  rows 58-64 joined to row 57 between x 18 and 48; the cape's blue everywhere) and its drawn legs (pieces of at least 60 texels) */
function split(u) {
  const keep = new Uint8Array(u.W * u.H), st = [];
  for (let y = 0; y < 58; y++) for (let x = 0; x < u.W; x++) { const c = R.get(u, x, y); if (c && !(y >= 54 && x < 24 && isTrousers(c))) keep[y * u.W + x] = 1; }
  for (let x = 0; x < u.W; x++) if (keep[57 * u.W + x]) st.push([x, 57]);
  while (st.length) {
    const [x, y] = st.pop();
    for (const [p, q] of [[x + 1, y], [x - 1, y], [x, y + 1]]) {
      if (q < 58 || q > 64 || p < 18 || p > 48 || keep[q * u.W + p]) continue;
      const c = R.get(u, p, q); if (!c || isTrousers(c)) continue;
      keep[q * u.W + p] = 1; st.push([p, q]);
    }
  }
  const upper = R.cut(u, (x, y) => { if (keep[y * u.W + x]) return true; const c = R.get(u, x, y); return !!c && isBlue(c); });
  return { upper, legs: pieces(R.cut(u, (x, y) => !R.opaque(upper, x, y)), 60) };
}
/** the 8-connected pieces of a layer with at least `min` texels */
function pieces(im, min) {
  const seen = new Uint8Array(im.W * im.H), o = R.blank(im.W, im.H);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (seen[y * im.W + x] || !R.opaque(im, x, y)) continue;
    const st = [[x, y]], c = []; seen[y * im.W + x] = 1;
    while (st.length) { const [a, b] = st.pop(); c.push([a, b]); for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const p = a + dx, q = b + dy; if (p < 0 || q < 0 || p >= im.W || q >= im.H || seen[q * im.W + p] || !R.opaque(im, p, q)) continue; seen[q * im.W + p] = 1; st.push([p, q]); } }
    if (c.length >= min) for (const [a, b] of c) R.put(o, a, b, R.get(im, a, b));
  }
  return o;
}
/** centre of the opaque run on a layer's lowest row (the planted foot) */
function footX(im) { const b = R.bottom(im); let a = 99, c = -1; for (let x = 0; x < im.W; x++) if (R.opaque(im, x, b)) { a = Math.min(a, x); c = Math.max(c, x); } return (a + c) / 2; }

// ---- profile run: hero-x2-v2's (Pass H6): the drawn legs sheared from the hip so that the planted foot moves 14 texels per frame (columns
// 14 to 42), the fourth frame of each step a flight FLIGHT rows above the foot row. [upper body, legs, step position 0-3]
const RUN = [[2, 2, 0], [3, 3, 1], [4, 4, 2], [5, 4, 3], [6, 5, 0], [7, 6, 1], [8, 1, 2], [1, 1, 3]];
const STEP = { from: 14, slide: 14, hip: 60, foot: 6 };
const FLIGHT = 2;
function sideRun(parts, i) {
  const [u, l, t] = RUN[i], P = parts[u - 1], L = parts[l - 1].legs;
  const legs = R.shear(L, STEP.hip, R.bottom(L) - STEP.foot, Math.round(STEP.from + STEP.slide * Math.min(t, 2) - footX(L)));
  const blue = (x, y) => { const c = R.get(P.upper, x, y); return !!c && isBlue(c); };
  const im = R.over(R.cut(P.upper, blue), legs, R.cut(P.upper, (x, y) => !blue(x, y)));
  return R.erase(despeckle(R.shift(im, 0, R.FOOT - R.bottom(legs) - (t === 3 ? FLIGHT : 0)), () => true, 4), (x, y) => x === 0 || x === R.FW - 1 || y === 0);
}

// ---- front / back / three-quarter runs (hero-x2-v2's front / back rig): the body bobs with the profile's rhythm and shifts its weight
// 1 texel, the cape's hem sways from row `hem`; each leg (trousers and boot, or the boot alone under a cape) is a rigid part drawn BEHIND the
// body, planted or lifted (5 texels at most: 9 read as a knee raise, journal Passe F1); each visible hand drops when its arm swings forward,
// opposite to the leg of its side. Masks measured on this rig's views (journal Passe H8: ASCII maps of each view by material).
const notBlue = (v, m) => (x, y) => { const c = R.get(v, x, y); return !!c && !isBlue(c) && m(x, y); };
const FB = {
  // front: the trousers between the cape's panels (rows 64-75), the boots (76-90); the gauntlets beside the cape (rows 49-62)
  down: {
    hem: 62,
    legs: [(x, y) => (y >= 64 && y <= 75 && x >= 19 && x <= 30) || (y >= 76 && x >= 15 && x <= 30), (x, y) => (y >= 64 && y <= 75 && x >= 33 && x <= 45) || (y >= 76 && x >= 34 && x <= 49)],
    hands: [(x, y) => y >= 49 && y <= 62 && x >= 11 && x <= 21, (x, y) => y >= 49 && y <= 62 && x >= 42 && x <= 53],
  },
  // three-quarter front: the same parts, a little to the right (the body turned to the left)
  downSide: {
    hem: 62,
    legs: [(x, y) => (y >= 64 && y <= 75 && x >= 20 && x <= 30) || (y >= 76 && x >= 17 && x <= 31), (x, y) => (y >= 64 && y <= 75 && x >= 32 && x <= 44) || (y >= 76 && x >= 35 && x <= 48)],
    hands: [(x, y) => y >= 49 && y <= 63 && x >= 13 && x <= 23, (x, y) => y >= 49 && y <= 63 && x >= 40 && x <= 51],
  },
  // back: only the boots show under the cape's hem (rows 81-90); no hand shows
  up: { hem: 64, legs: [(x, y) => y >= 81 && x <= 31, (x, y) => y >= 81 && x >= 32], hands: [] },
  // three-quarter back: the near leg (trousers from row 68, boot) beside the cape, the far boot under its hem; the near arm and gauntlet
  upSide: { hem: 64, legs: [(x, y) => y >= 68 && x <= 32, (x, y) => y >= 81 && x >= 33], hands: [(x, y) => y >= 50 && y <= 67 && x >= 18 && x <= 30] },
};
const LIFT = [0, 0, 0, 2, 4, 5, 3, 1];
const BOB = [1, 2, 1, 0, 1, 2, 1, 0];
const SHIFT = [0, 1, 1, 0, 0, -1, -1, 0];
const HEM = [-1, -2, -1, 1, 1, 2, 1, -1];
const HAND = [-2, -1, 0, 1, 2, 1, 0, -1];
function frontBack(v, o, i) {
  const legM = o.legs.map((m) => notBlue(v, m)), all = (x, y) => legM.some((m) => m(x, y));
  let body = R.erase(v, all);
  o.hands.forEach((m, j) => { const d = Math.max(0, (j ? -1 : 1) * HAND[i]); if (d) body = R.over(body, R.shift(R.cut(body, notBlue(body, m)), 0, d)); });
  body = R.shift(R.shear(body, o.hem, 81, HEM[i]), SHIFT[i], BOB[i]);
  const legs = legM.map((m, j) => R.shift(R.cut(v, m), 0, -LIFT[(i + 4 * j) % 8]));
  return R.erase(R.over(...legs, body), (x, y) => x === 0 || x === R.FW - 1 || y === 0);
}

export const DIRS5 = ['down', 'downSide', 'side', 'upSide', 'up'];
export function frames(V, uppers = null) {
  const out = [], parts = (uppers ?? runFrames(R.paletteOf(...DIRS5.map((d) => V[d])))).map(split);
  for (const dir of DIRS5) {
    const v = V[dir];
    // idle: rest, rest, inhale, exhale with the head one frame late (rig-engine breath, as the approved cast)
    const [inhale, exhale] = R.breath(v, 32, 35, 62);
    [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
    for (let i = 0; i < 8; i++) out.push({ anim: 'walk', dir, i, im: dir === 'side' ? sideRun(parts, i) : frontBack(v, FB[dir], i) });
  }
  return out;
}
