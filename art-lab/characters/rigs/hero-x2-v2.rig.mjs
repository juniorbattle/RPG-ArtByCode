// Rig of hero-x2-v2 (lab candidate, not approved): the protagonist, idle (4 frames) and run (8 frames) in the three runtime facings, from the
// operator's base sheet (archived as reference/sources/hero-turnaround-v3-2026-10-19.png; brief, decision 7): its 1st (front), 4th (back)
// and 3rd (profile, facing left: the runtime's native side) idle views, one joint 64-colour palette. Pitch 3.4 sheet pixels per texel:
// front 85 rows, like the cast. The sheet draws a soft drop shadow under every figure: removed from every reconstruction (neutral greys
// on the lowest rows reachable from the outside, never the boots' own greys inside their outline).
// Profile run: the sheet's own eight run frames, reconstructed here at the same pitch (each figure cut out of the row first: the frames
// touch), mirrored to face left and mapped onto the joint palette, upper bodies and legs as drawn; the sheet's planted foot jumps about 28
// texels from one drawn frame to the next (contact and gathered poses only, no flight), so every frame's legs are sheared from the hip to
// put the planted foot on a 9-texel-per-frame track (see `sideRun`). A first version painted IK legs under the drawn upper bodies (the
// method of hero-x2-v1): stiff boots next to the sheet's drawn ones, and the coat's skirt cut ragged; the drawn legs read better.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/hero-x2-v2.rig.mjs`.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as R from '../../../tools/art-lab/rig-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const id = 'hero-x2-v2';

export const source = {
  sheet: 'art-lab/characters/reference/sources/hero-turnaround-v3-2026-10-19.png',
  pitch: 3.4,
  views: { down: '22,48,201,342', up: '536,48,707,342', side: '386,56,527,344' },
  palette: { k: 64 },
  // background-grey cells enclosed by the figure cleared; the vertical closing only from row 48 down (Pass 4A-unvicies)
  options: { holes: true, closingFrom: 48 },
};

const chroma = (c) => { const [, a, b] = R.oklab(c); return Math.hypot(a, b); };
/** the sheet's drop shadow: neutral greys (OKLab chroma < 0.03, L 0.3-0.62) on rows >= 78, flooded from the transparent outside */
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
/** the sheet's grey background blended into the figure's border cells: edge texels (touching the outside, 4-neighbourhood) of a neutral grey
 *  as light as the background (OKLab chroma < 0.012, L 0.49-0.66), peeled twice; a blind critique found them as a light halo (Pass H5) */
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
export function prepare(dir, v) {
  return align(closeSlits(cleanStrands(dehalo(dropShadow(v)))));
}

// ---- the sheet's run frames (bottom row, facing right): each figure is cut out of the row (a breadth-first fill through the foreground
// from a seed on its head; frames 3 and 4 touch), the others painted with the background, then reconstructed like the views
const RUN_ROW = { y0: 736, y1: 1022, seeds: [98, 282, 450, 620, 834, 1014, 1191, 1362].map((x) => [x, 790]), bg: [117, 119, 118], thr: 40 };
function sheetRunFrames() {
  const sh = R.load(path.join(ROOT, source.sheet)), { W, H } = sh, { y0, y1, bg, thr } = RUN_ROW;
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
/** the face: skin texels (OKLab L > 0.68, a > 0.025, b > 0.03) on rows top + 12 .. top + 27 (below the hair, above the hands); its front
 *  column (lowest x, facing left) and chin row */
function face(im) {
  const t = R.top(im); let fx = 99, cy = -1;
  for (let y = t + 12; y <= t + 27; y++) for (let x = 0; x < im.W; x++) { const c = R.get(im, x, y); if (!c) continue; const [L, a, b] = R.oklab(c); if (L > 0.68 && a > 0.025 && b > 0.03) { fx = Math.min(fx, x); cy = Math.max(cy, y); } }
  return [fx, cy];
}
const isBlue = (c) => R.oklab(c)[2] < -0.035;
const isTrousers = (c) => { const [L, a, b] = R.oklab(c); return L >= 0.27 && Math.hypot(a, b) < 0.045 && b >= -0.035; };
/** the sheet's run frames, mirrored (facing left), shadowless, without the background halo, on the joint palette, aligned on the face (front column 14, chin row 37) */
export function runFrames(pal) {
  return sheetRunFrames().map((im) => { const u = toPalette(dehalo(R.mirror(dropShadow(im))), pal), [fx, cy] = face(u); return R.shift(u, 14 - fx, 37 - cy); });
}
/** a run frame split into its upper body (rows < 58, but the front thigh's trousers greys from row 54 left of x 24; rows 58-64: the coat's
 *  skirt, the non-trousers texels joined to row 57 between x 18 and 48; the cape's blue everywhere) and its drawn legs (the rest, pieces
 *  of at least 60 texels: no crumbs of the coat) */
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

// ---- profile run (the operator's running stride, 2.5 m/s: brief section 4). The sheet's own run frames, legs included: four per step,
// contact (the planted foot far ahead), two in-betweens, gathered (the planted foot behind the hips). The sheet only draws contact and
// gathered poses (the planted foot about 28 texels apart, no flight), so the in-betweens reuse a contact and a gathered pose whose legs are
// SHEARED: rows from the hip (row 60) down to the ankle move progressively, the foot (the lowest 6 rows) moves as a block and stays flat,
// the hip stays attached under the coat (a rotation about the hip that never resamples the boots' texture). Every frame's legs are placed
// this way so that the planted foot moves exactly 9 texels per frame, from column 14 to 41 (the runtime's walkSlide, Stride.ts: the clock
// reaches 2.5 m/s at about x1.56 in B / D); the frame then stands on the foot row. [upper body, legs, step position 0-3]; the upper bodies
// keep the sheet's order (cape and arms as drawn).
const RUN = [[2, 2, 0], [3, 3, 1], [4, 4, 2], [5, 4, 3], [6, 5, 0], [7, 6, 1], [8, 1, 2], [1, 1, 3]];
const STEP = { from: 14, slide: 9, hip: 60, foot: 6 };
function sideRun(parts, i) {
  const [u, l, t] = RUN[i], P = parts[u - 1], L = parts[l - 1].legs;
  const legs = R.shear(L, STEP.hip, R.bottom(L) - STEP.foot, Math.round(STEP.from + STEP.slide * t - footX(L)));
  const blue = (x, y) => { const c = R.get(P.upper, x, y); return !!c && isBlue(c); };
  const im = R.over(R.cut(P.upper, blue), legs, R.cut(P.upper, (x, y) => !blue(x, y)));
  // the frame's border ring stays empty (contract section 3): the sheared back boot of frame 5 reaches column 63 (6 texels trimmed)
  return R.erase(despeckle(R.shift(im, 0, R.FOOT - R.bottom(legs)), () => true, 4), (x, y) => x === 0 || x === R.FW - 1 || y === 0);
}

// ---- front / back run: the body (everything above the legs, the cape's panels and lining included) bobs with the profile's rhythm and
// shifts its weight 1 texel, the cape's hem sways; each leg (trousers and boot, or the boot alone under the back of the cape) is a rigid part
// drawn BEHIND the body, planted or lifted (it slides up under the body); each visible hand drops when its arm swings forward, opposite to
// the leg of its side. Measured per view: the legs' texels (front: the trousers between the cape's panels, then
// the boots; back: the boots under the cape's hem), the hands (gauntlets beside the cape), the row the cape's sway starts from (`hem`).
const notBlue = (v, m) => (x, y) => { const c = R.get(v, x, y); return !!c && !isBlue(c) && m(x, y); };
const FB = {
  down: {
    hem: 59,
    legs: [(x, y) => (y >= 66 && y <= 75 && x >= 18 && x <= 30) || (y >= 76 && x >= 15 && x <= 30), (x, y) => (y >= 66 && y <= 75 && x >= 32 && x <= 45) || (y >= 76 && x >= 33 && x <= 50)],
    hands: [(x, y) => y >= 52 && y <= 64 && x >= 11 && x <= 20, (x, y) => y >= 52 && y <= 64 && x >= 43 && x <= 53],
  },
  up: { hem: 64, legs: [(x, y) => y >= 80 && x <= 30, (x, y) => y >= 80 && x >= 34], hands: [(x, y) => y >= 52 && y <= 66 && x >= 7 && x <= 15] },
};
const LIFT = [0, 0, 0, 3, 7, 9, 5, 1];
const BOB = [1, 2, 1, 0, 1, 2, 1, 0];
const SHIFT = [0, 1, 1, 0, 0, -1, -1, 0];
const HEM = [-1, -2, -1, 1, 1, 2, 1, -1];
const HAND = [-2, -1, 0, 1, 2, 1, 0, -1];
function frontBack(v, o, i) {
  const legM = o.legs.map((m) => notBlue(v, m)), all = (x, y) => legM.some((m) => m(x, y));
  let body = R.erase(v, all);
  // hand j (screen left first) swings with the leg of the other side (leg 1 is four frames after leg 0); a forward swing drops the hand up
  // to 2 texels, drawn over the hand at rest (the wrist lengthens: nothing is uncovered)
  o.hands.forEach((m, j) => { const d = Math.max(0, (j ? -1 : 1) * HAND[i]); if (d) body = R.over(body, R.shift(R.cut(body, notBlue(body, m)), 0, d)); });
  body = R.shift(R.shear(body, o.hem, 81, HEM[i]), SHIFT[i], BOB[i]);
  const legs = legM.map((m, j) => R.shift(R.cut(v, m), 0, -LIFT[(i + 4 * j) % 8]));
  return R.over(...legs, body);
}

export function frames(V, uppers = null) {
  const out = [], parts = (uppers ?? runFrames(R.paletteOf(V.down, V.up, V.side))).map(split);
  for (const dir of ['down', 'up', 'side']) {
    const v = V[dir];
    // idle: rest, rest, inhale, exhale with the head one frame late (rig-engine breath, as the approved cast; neck under the chin, row 32)
    const [inhale, exhale] = R.breath(v, 32, 35, 62);
    [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
    for (let i = 0; i < 8; i++) out.push({ anim: 'walk', dir, i, im: dir === 'side' ? sideRun(parts, i) : frontBack(v, FB[dir], i) });
  }
  return out;
}
