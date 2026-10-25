// Rig of hero-x3-combat (LAB, not approved, never in production without the operator's approval): Ren's first combat sheet, the production
// hero hero-x2-v4 at x3 in the arena's cells (journal Passe RC1; the operator's decisions AA2-1 « ×3 », and for this sheet « Génération
// (Recommandé) » and « Clés hors C2 (Recommandé) »). A cell is the arena's 64 x 96 town pixels at 3 texels per pixel: 192 x 288 texels, the feet
// on row 270, the body axis (the hips) on column 96, the fighter facing LEFT (FighterArt's frames, keys `ren/side/<clip>.<i>/0`).
// Sources: three generated pose sheets (NON-CANONICAL, archived with their records under reference/sources/: ren-combat-x3-2026-10-25-a1, -a2,
// -b2), the hero's design from the v4-b turnaround and the v3 sheet given as references; the figures chosen by a blind critique (Passe RC1).
// Chain per figure: the figure alone on its sheet (the other figures painted with the background) -> reconstruct-grid.mjs at the sheet's
// own pitch (its standing figure's height over the 128 rows of hero-x3-trial's idle: every clip at the hero's x3 height) into a 384 x 288
// frame, feet on row 270 -> the sheet's grey halo peeled on the full colours -> nearest OKLab colour of hero-x2-v4's palette (pinned: no new
// colour) -> loose texels removed -> the hips put on column 96, cropped to the 192-texel cell. Then the rig: the alternate frames of the loops
// (idle, ready, victory: the inhale; recover: the exhale, head lower) by rig-engine's breath, and the guard's « encaisse » (block 1) by a
// shear of the upper body. The 22 frames of the keys the C2 trial does not touch (CB-2 list: idle 2, ready 2, strike 3, heavy 4, block 2,
// hit 2, recover 2, ko 3, victory 2); dodge, skillOff, skillDef and skillSup wait for the C2 decision sheet.
//   node tools/art-lab/build-combat.mjs art-lab/characters/rigs/hero-x3-combat.rig.mjs [--check]
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as R from '../../../tools/art-lab/rig-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
export const id = 'hero-x3-combat';
/** the arena cell at x3 (CELL_W x CELL_H x CELL_FOOT of FighterArt, times 3) */
export const frame = { W: 192, H: 288, FOOT: 270, AXIS: 96, K: 3 };
/** the clips, in the sheet's order, with their frame counts (briefs/combat-system.md § 14) */
export const clips = { idle: 2, ready: 2, strike: 3, heavy: 4, block: 2, hit: 2, recover: 2, ko: 3, victory: 2 };
export const PALETTE = { path: 'art-lab/characters/exports/hero-x2-v4.png', sha256: '06a7fab7c90ee0d83b97477c3276710bb217161c2be32b12ab4143c338c603f1' };
/** the hero's standing height at x3 (hero-x3-trial's side idle: rows 8..135) */
const HEIGHT = 128;
/** each sheet: its file, its SHA-256, the standing figure's height in sheet pixels (hair to soles) -> its pitch */
export const SHEETS = {
  a1: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-25-a1.png', sha256: '7455dfa020a4ec7d8a833b4785bd25deaa526675b229b6c52eca204db0d92fed', stand: 280 },
  a2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-25-a2.png', sha256: 'de039a7ecb6e3d7a48c807c925e7707a2430c9166aa4def86e32cd81e51fffbb', stand: 240 },
  b2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-25-b2.png', sha256: 'd04766360cbb835c945be9a3e8f38004c2e14cfa2b44a133eb3f65fb5cae9d76', stand: 285 },
};
for (const s of Object.values(SHEETS)) s.pitch = +(s.stand / HEIGHT).toFixed(4);
/** the figures: sheet, box (sheet pixels), and for the three knockout figures the hips' column in the 384-wide reconstruction, set by eye (null =
 *  the midpoint of the two feet on the ground, FighterArt's body axis between its front and back foot) */
export const FIGURES = {
  idle: { sheet: 'a2', box: [57, 232, 232, 471], hips: null },
  ready: { sheet: 'a2', box: [284, 253, 572, 471], hips: null },
  windup: { sheet: 'a2', box: [687, 192, 851, 471], hips: null },
  cut: { sheet: 'a2', box: [855, 263, 1193, 471], hips: null },
  follow: { sheet: 'a2', box: [1235, 285, 1459, 471], hips: null },
  guard: { sheet: 'a2', box: [123, 552, 267, 815], hips: null },
  recoil: { sheet: 'a2', box: [386, 611, 648, 816], hips: null },
  recovery: { sheet: 'a1', box: [715, 591, 969, 840], hips: null },
  stunned: { sheet: 'a2', box: [1207, 598, 1339, 816], hips: null },
  gather: { sheet: 'b2', box: [120, 266, 392, 490], hips: null },
  raise: { sheet: 'b2', box: [475, 168, 719, 490], hips: null },
  cleave: { sheet: 'b2', box: [778, 255, 1121, 498], hips: null },
  victory: { sheet: 'b2', box: [1238, 47, 1419, 490], hips: null },
  through: { sheet: 'b2', box: [47, 643, 353, 877], hips: null },
  fall: { sheet: 'b2', box: [490, 626, 725, 889], hips: 188 },
  kneel: { sheet: 'b2', box: [735, 708, 1084, 881], hips: 232 },
  ground: { sheet: 'b2', box: [1175, 795, 1477, 886], hips: 178 },
};
const WIDE = 384, BG_THR = 40, CLOSING = 207;

const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const chroma = (c) => { const [, a, b] = R.oklab(c); return Math.hypot(a, b); };

/** the figure alone: foreground components (8-connected, 2-pixel reach) whose box centre lies inside `box`; everything else the background */
function isolate(sh, box) {
  const { W, H, px } = sh, bg = [px[0], px[1], px[2]];
  const fg = (x, y) => { const i = (y * W + x) * 4; return Math.max(Math.abs(px[i] - bg[0]), Math.abs(px[i + 1] - bg[1]), Math.abs(px[i + 2] - bg[2])) > BG_THR; };
  const [x0, y0, x1, y1] = box, X0 = Math.max(0, x0 - 40), Y0 = Math.max(0, y0 - 40), X1 = Math.min(W - 1, x1 + 40), Y1 = Math.min(H - 1, y1 + 40);
  const lab = new Int32Array(W * H).fill(-1), keep = [];
  let n = 0;
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) {
    if (lab[y * W + x] >= 0 || !fg(x, y)) continue;
    const st = [[x, y]], b = [x, y, x, y]; lab[y * W + x] = n;
    while (st.length) {
      const [a, c] = st.pop(); b[0] = Math.min(b[0], a); b[1] = Math.min(b[1], c); b[2] = Math.max(b[2], a); b[3] = Math.max(b[3], c);
      for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) { const p = a + dx, q = c + dy; if (p < X0 || q < Y0 || p > X1 || q > Y1 || lab[q * W + p] >= 0 || !fg(p, q)) continue; lab[q * W + p] = n; st.push([p, q]); }
    }
    const cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2;
    if (cx >= x0 && cx <= x1 && cy >= y0 && cy <= y1) keep.push(n);
    n++;
  }
  const o = R.clone(sh);
  for (let y = Y0; y <= Y1; y++) for (let x = X0; x <= X1; x++) { const l = lab[y * W + x]; if (l >= 0 && !keep.includes(l)) { const i = (y * W + x) * 4; o.px[i] = bg[0]; o.px[i + 1] = bg[1]; o.px[i + 2] = bg[2]; } }
  return { im: o, bg };
}
/** the sheet's grey background blended into the figure's border texels (full colours, before the palette): peeled twice */
function dehalo(v, bg) {
  let o = R.clone(v);
  for (let pass = 0; pass < 2; pass++) {
    const n = R.clone(o);
    for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) {
      const c = R.get(o, x, y); if (!c) continue;
      if (R.opaque(o, x + 1, y) && R.opaque(o, x - 1, y) && R.opaque(o, x, y + 1) && R.opaque(o, x, y - 1)) continue;
      if (Math.max(Math.abs(c[0] - bg[0]), Math.abs(c[1] - bg[1]), Math.abs(c[2] - bg[2])) <= 18) R.put(n, x, y, null);
    }
    o = n;
  }
  return o;
}
function toPalette(im, pal) {
  const P = pal.map((c) => [c, R.oklab(c)]), memo = new Map();
  return R.recolour(im, (c) => { const k = c.join(','); if (!memo.has(k)) { const o = R.oklab(c); let best = null, bd = 1e9; for (const [p, q] of P) { const d = (q[0] - o[0]) ** 2 + (q[1] - o[1]) ** 2 + (q[2] - o[2]) ** 2; if (d < bd) { bd = d; best = p; } } memo.set(k, best); } return memo.get(k); });
}
/** loose texels: 4-connected islands of fewer than `min` texels removed */
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
/** every figure reconstructed in a 384 x 288 frame (feet on row 270, the bbox centred), on the palette: { name: image } */
export function figures() {
  const pal = R.paletteOf(R.load(path.join(ROOT, PALETTE.path)));
  if (sha(path.join(ROOT, PALETTE.path)) !== PALETTE.sha256) throw new Error(`${PALETTE.path}: not the pinned palette`);
  const sheets = {};
  for (const [k, s] of Object.entries(SHEETS)) { const got = sha(path.join(ROOT, s.path)); if (got !== s.sha256) throw new Error(`${s.path}: SHA-256 ${got}, the rig expects ${s.sha256}`); sheets[k] = R.load(path.join(ROOT, s.path)); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `artlab-${id}-`)), out = {};
  try {
    for (const [name, f] of Object.entries(FIGURES)) {
      const { im, bg } = isolate(sheets[f.sheet], f.box), file = path.join(tmp, `${name}.png`), pre = path.join(tmp, name);
      R.save(file, im);
      execFileSync(process.execPath, [path.join(ROOT, 'tools/art-lab/reconstruct-grid.mjs'), file, f.box.join(','), String(SHEETS[f.sheet].pitch), String(WIDE), String(frame.H), String(frame.FOOT), pre, 'full', '--holes', '--no-shadow', `--closing-from=${CLOSING}`], { stdio: 'ignore' });
      const rep = JSON.parse(fs.readFileSync(`${pre}.json`, 'utf8'));
      if (rep.clipped) throw new Error(`${name}: ${rep.clipped} texels clipped by the ${WIDE}-wide frame`);
      out[name] = despeckle(toPalette(dehalo(R.load(`${pre}-full.png`), bg), pal), 12);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  return out;
}
/** the feet's midpoint: on the lowest 9 rows, the coloured runs (the steel of a blade lying low is left out) at least 5 texels wide; the two
 *  hindmost are the feet (a sword's hilt or tip in front of them comes first, the figure facing left); one run = its centre */
function feetMid(im) {
  const runs = [];
  for (let x = 0; x < im.W; x++) {
    let hit = false; for (let y = frame.FOOT - 8; y <= frame.FOOT; y++) { const c = R.get(im, x, y); if (c && chroma(c) > 0.02) hit = true; }
    if (!hit) continue; const r = runs[runs.length - 1]; if (r && x - r[1] <= 2) r[1] = x; else runs.push([x, x]);
  }
  const big = runs.filter((r) => r[1] - r[0] >= 4);
  if (!big.length) throw new Error('no foot on the ground');
  const [a, b] = big.length === 1 ? [big[0], big[0]] : big.slice(-2);
  return Math.round((a[0] + b[1]) / 2);
}
/** the placement report: per figure, the hips' column and how far the cell pushed the body (a lunge whose blade reaches past the cell's
 *  front edge moves its body forward: the figure is shifted until it fits, its hips no longer on the axis by that much) */
export const placement = {};
/** the figure's hips on the cell's axis (moved by the least that keeps it inside the cell's transparent ring), cropped to the cell */
function place(name, im) {
  let a = im.W, b = -1; for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (R.opaque(im, x, y)) { a = Math.min(a, x); b = Math.max(b, x); }
  const hips = FIGURES[name].hips ?? feetMid(im);
  if (b - a + 1 > frame.W - 2) throw new Error(`${name}: ${b - a + 1} texels wide, the cell holds ${frame.W - 2}`);
  // left edge a lands on a + AXIS - at >= 1, right edge b on b + AXIS - at <= W - 2
  const at = Math.max(Math.min(hips, a + frame.AXIS - 1), b - (frame.W - 2 - frame.AXIS));
  placement[name] = { hips, pushed: hips - at, lifted: frame.FOOT - R.bottom(im) };
  const o = R.blank(frame.W, frame.H), dx = frame.AXIS - at, dy = frame.FOOT - R.bottom(im);   // the halo peeled off a sole: back on the foot row
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (R.opaque(im, x, y)) R.put(o, x + dx, y + dy, R.get(im, x, y));
  return o;
}
/** the head's top row: the highest opaque texel that is not the blade (steel greys and whites, low chroma) */
function headTop(im) {
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) { const c = R.get(im, x, y); if (c && chroma(c) > 0.03) return y; }
  return -1;
}
/** rig-engine's breath at x3 (hero-x3-trial's rows measured from the head's top: neck +40, chest +45, cut +85; lifts of 2 rows) */
function breath(v, top) {
  const neck = top + 40, chest = top + 45, cutY = top + 85;
  const lower = R.cut(v, (x, y) => y >= cutY), upper = R.cut(v, (x, y) => y < cutY), all = () => true;
  return { inhale: R.over(lower, R.remapRows(upper, all, 0, cutY - 1, -2, cutY - 1, chest, 6)), exhale: R.over(lower, R.remapRows(upper, all, 0, cutY - 1, -2, cutY - 1, neck, cutY - 1 - (neck + 5))) };
}
/** the guard taking a blow: the upper body leans back (to the right), 3 texels at the head, nothing at the hips */
function encaisse(v, top) {
  const hip = top + 85, o = R.blank(v.W, v.H);
  for (let y = 0; y < v.H; y++) { const d = y >= hip ? 0 : Math.min(3, Math.round((3 * (hip - y)) / (hip - top))); for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) R.put(o, x + d, y, R.get(v, x, y)); }
  return o;
}

export function frames(F = figures()) {
  const P = Object.fromEntries(Object.keys(FIGURES).map((n) => [n, place(n, F[n])]));
  const out = [], add = (anim, list) => list.forEach((im, i) => out.push({ anim, dir: 'side', i, im }));
  const T = (n) => headTop(P[n]);
  add('idle', [P.idle, breath(P.idle, T('idle')).inhale]);
  add('ready', [P.ready, breath(P.ready, T('ready')).inhale]);
  add('strike', [P.windup, P.cut, P.follow]);
  add('heavy', [P.gather, P.raise, P.cleave, P.through]);
  add('block', [P.guard, encaisse(P.guard, T('guard'))]);
  add('hit', [P.recoil, P.recovery]);
  add('recover', [P.stunned, breath(P.stunned, T('stunned')).exhale]);
  add('ko', [P.fall, P.kneel, P.ground]);
  add('victory', [P.victory, breath(P.victory, T('victory')).inhale]);
  return out;
}
