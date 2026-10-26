// Rig of hero-x3-combat (LAB, not approved, never in production without the operator's approval): Ren's combat sheet, the production hero
// hero-x2-v4 at x3 in the arena's cells (journal Passes RC1 and RC2; the operator's decisions AA2-1 « ×3 », for its first 22 frames « Génération
// (Recommandé) » and « Clés hors C2 (Recommandé) », for the rest RC1-1 « Bonne base : compléter après la fiche C2, avec les reprises », C2-7
// « En arrière », C2-10 « Les garder »). A cell is the arena's 64 x 96 town pixels at 3 texels per pixel: 192 x 288 texels, the feet
// on row 270, the body axis (the hips) on column 96, the fighter facing LEFT (FighterArt's frames, keys `ren/side/<clip>.<i>/0`).
// Sources: ten generated pose sheets (NON-CANONICAL, archived with their records under reference/sources/: ren-combat-x3-2026-10-25-a1, -a2,
// -b2 of Passe RC1, ren-combat-x3-2026-10-26-c1, -c2, -d1, -d2, -e1, -e2, -f2 of Passe RC2), the hero's design from the v4-b turnaround and the
// v3 sheet given as references (and the RC1 sheets a2 / b2 for RC2's); the figures chosen by blind critiques (Passes RC1, RC2).
// Chain per figure: the figure alone on its sheet (the other figures painted with the background) -> reconstruct-grid.mjs at the sheet's
// own pitch (its standing figure's height over the 128 rows of hero-x3-trial's idle: every clip at the hero's x3 height) into a 384 x 288
// frame, feet on row 270 -> the sheet's grey halo peeled on the full colours -> nearest OKLab colour of hero-x2-v4's palette (pinned: no new
// colour) -> loose texels removed -> the hips put on column 96, cropped to the 192-texel cell. Then the rig: the alternate frames of the loops
// (idle, ready, victory: the inhale; recover: the exhale, head lower) by rig-engine's breath, and the guard's « encaisse » (block 1) by a
// shear of the upper body; every blade at two texels of steel and a dark edge (blade2, pinned per figure in BLADES). The 34 frames of the CB-2 list (briefs/combat-
// system.md § 14): idle 2, ready 2, strike 3, heavy 4, skillOff 4, skillDef 3, skillSup 3, block 2, dodge 2 (backward, C2-7), hit 2,
// recover 2, ko 3, victory 2 (in profile since Passe RC2).
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
export const clips = { idle: 2, ready: 2, strike: 3, heavy: 4, skillOff: 4, skillDef: 3, skillSup: 3, block: 2, dodge: 2, hit: 2, recover: 2, ko: 3, victory: 2 };
export const PALETTE = { path: 'art-lab/characters/exports/hero-x2-v4.png', sha256: '06a7fab7c90ee0d83b97477c3276710bb217161c2be32b12ab4143c338c603f1' };
/** the hero's standing height at x3 (hero-x3-trial's side idle: rows 8..135) */
const HEIGHT = 128;
/** each sheet: its file, its SHA-256, the standing figure's height in sheet pixels (hair to soles) -> its pitch; c1 / c2 draw a smaller body
 *  under the same head (at the pitch of their stand, 214, the reconstructed heads came out 15 % larger than the RC1 frames', measured side by
 *  side, journal Passe RC2): their pitch splits the gap (heads 7 % larger, bodies 7 % shorter) */
export const SHEETS = {
  a1: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-25-a1.png', sha256: '7455dfa020a4ec7d8a833b4785bd25deaa526675b229b6c52eca204db0d92fed', stand: 280 },
  a2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-25-a2.png', sha256: 'de039a7ecb6e3d7a48c807c925e7707a2430c9166aa4def86e32cd81e51fffbb', stand: 240 },
  b2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-25-b2.png', sha256: 'd04766360cbb835c945be9a3e8f38004c2e14cfa2b44a133eb3f65fb5cae9d76', stand: 285 },
  c1: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-c1.png', sha256: '46c21a063f659bf10832803b24447a7eb9848981d1d064e75fa785741587b405', stand: 214, pitch: 1.797 },
  c2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-c2.png', sha256: 'dcdbddba587678deae68a8b155baa667aa34430e4abc052322870edee9e41f9f', stand: 214, pitch: 1.797 },
  d1: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-d1.png', sha256: 'ac4b8b9335ceee927e3c343c7435735f5b4e22abb0317a85eb6ea40cda2e9357', stand: 313 },
  d2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-d2.png', sha256: '5914d20addfa19db1d78a0eec556c7dfd1ca4de4bdfb2ba6a001dba46dcae9fa', stand: 308 },
  e1: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-e1.png', sha256: '1193d4b4efd1477c7e57bcbcab86e44827b2e839cc884a7a0ee08594487fcbd7', stand: 292 },
  e2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-e2.png', sha256: '2fe682c35284825f4adbd5c3c13734662913426159bfcbdac7dc73876eef5cb0', stand: 289 },
  f2: { path: 'art-lab/characters/reference/sources/ren-combat-x3-2026-10-26-f2.png', sha256: '579ce9bfe118bfc4aef8111a174387ea997a2797db3ab1801cb39f27e370d2a4', stand: 273 },
};
for (const s of Object.values(SHEETS)) s.pitch ??= +(s.stand / HEIGHT).toFixed(4);
/** the figures: sheet, box (sheet pixels), and for the three knockout figures the hips' column in the 384-wide reconstruction, set by eye (null =
 *  the midpoint of the two feet on the ground, FighterArt's body axis between its front and back foot) */
export const FIGURES = {
  idle: { sheet: 'a2', box: [57, 232, 232, 471], hips: null },
  ready: { sheet: 'a2', box: [284, 253, 572, 471], hips: null },
  windup: { sheet: 'a2', box: [687, 192, 851, 471], hips: null },
  thrust: { sheet: 'a2', box: [855, 263, 1193, 471], hips: null },
  cut: { sheet: 'f2', box: [102, 105, 495, 422], hips: null },
  follow: { sheet: 'a2', box: [1235, 285, 1459, 471], hips: null },
  guard: { sheet: 'a2', box: [123, 552, 267, 815], hips: null },
  recoil: { sheet: 'a2', box: [386, 611, 648, 816], hips: null },
  recovery: { sheet: 'a1', box: [715, 591, 969, 840], hips: null },
  stunned: { sheet: 'a2', box: [1207, 598, 1339, 816], hips: null },
  gather: { sheet: 'b2', box: [120, 266, 392, 490], hips: null },
  raise: { sheet: 'b2', box: [475, 168, 719, 490], hips: null },
  cleave: { sheet: 'b2', box: [778, 255, 1121, 498], hips: null },
  through: { sheet: 'b2', box: [47, 643, 353, 877], hips: null },
  fall: { sheet: 'b2', box: [490, 626, 725, 889], hips: 188 },
  kneel: { sheet: 'b2', box: [735, 708, 1084, 881], hips: 232 },
  ground: { sheet: 'b2', box: [1175, 795, 1477, 886], hips: 178 },
  lungePrep: { sheet: 'c2', box: [58, 221, 337, 408], hips: null },
  surge: { sheet: 'c2', box: [365, 217, 688, 408], hips: null },
  lungeBack: { sheet: 'c1', box: [1215, 214, 1475, 424], hips: null },
  wardPrep: { sheet: 'd2', box: [206, 77, 424, 416], hips: null },
  ward: { sheet: 'e2', box: [178, 632, 430, 886], hips: null },
  wardBack: { sheet: 'd1', box: [1022, 549, 1371, 850], hips: null },
  fervourPrep: { sheet: 'd2', box: [225, 548, 368, 859], hips: null },
  cry: { sheet: 'e2', box: [1118, 242, 1354, 510], hips: null },
  fervourBack: { sheet: 'd2', box: [1059, 543, 1334, 829], hips: null },
  hop: { sheet: 'c2', box: [429, 558, 674, 791], hips: null },
  land: { sheet: 'c1', box: [762, 575, 1058, 776], hips: null },
  victory: { sheet: 'e1', box: [572, 30, 794, 468], hips: null },
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
/** the blade's palette colours (hero-x2-v4 has no steel): two light rows, its brightest ecru and the next one (the two texels of steel the
 *  night's dark ground shows), and a dark neutral edge row (the outline the day's light cobbles show). A light row with a dark one read as a
 *  one-texel wire in the scene, one row lost in each light (blind critique, journal Passe RC2) */
export const STEEL = { light: [248, 233, 216], light2: [230, 201, 183], edge: [50, 46, 50] };
/** steel-like texels: the colours the generated steel and its dark edge took on the palette (neutral: low chroma, any lightness) */
const steelLike = (c) => { const [, a, b] = R.oklab(c); return Math.hypot(a, b) < 0.05; };
/** the blade at two texels of steel and its dark edge (the operator's decision RC1-1, « avec les reprises »: the reconstruction left it one
 *  texel wide and broken):
 *  from the hilt end `h` to the tip `t` (cell texels, pinned per figure in BLADES), the old blade's loose neutral texels within 5 texels of
 *  the segment are removed (those touching a coloured texel of the body stay), then a line of the light steel along the segment, a line of the
 *  second light beside it and a line of the dark edge beyond (below a flat blade, behind a steep one), drawn only where the figure was
 *  transparent or neutral (a hand or a sleeve over the blade stays in front); each line one texel shorter than the last, the point. `was`: where the generated blade's tip
 *  was, when the new segment turns the blade around the hilt (the cut, Passe RC2): the old blade's loose texels go too */
export function blade2(im, h, t, was = t) {
  const o = R.clone(im), dx = t[0] - h[0], dy = t[1] - h[1];
  const body = (x, y) => { const c = R.get(im, x, y); return !!c && !steelLike(c); };
  // the crossguard and the hand around the hilt end do not hold a loose texel of the blade
  const holds = (x, y) => body(x, y) && Math.hypot(x - h[0], y - h[1]) > 6;
  const near = (x, y, e) => { const len = Math.hypot(e[0] - h[0], e[1] - h[1]), ux = (e[0] - h[0]) / len, uy = (e[1] - h[1]) / len, s = (x - h[0]) * ux + (y - h[1]) * uy; return Math.abs((x - h[0]) * uy - (y - h[1]) * ux) <= 5 && s >= -1 && s <= len + 2; };
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    const c = R.get(im, x, y); if (!c || !steelLike(c)) continue;
    if (!near(x, y, t) && !near(x, y, was)) continue;
    let touch = false; for (let q = -1; q <= 1; q++) for (let p = -1; p <= 1; p++) if ((p || q) && holds(x + p, y + q)) touch = true;
    if (!touch) R.put(o, x, y, null);
  }
  const flat = Math.abs(dx) >= Math.abs(dy), n = Math.max(Math.abs(dx), Math.abs(dy));
  const free = (x, y) => x >= 1 && y >= 1 && x <= im.W - 2 && y <= frame.FOOT && !body(x, y);
  for (let i = 0; i <= n; i++) {
    const x = Math.round(h[0] + (dx * i) / n), y = Math.round(h[1] + (dy * i) / n), [px, py] = flat ? [0, 1] : [1, 0];
    if (free(x, y)) R.put(o, x, y, STEEL.light);
    if (i < n && free(x + px, y + py)) R.put(o, x + px, y + py, STEEL.light2);
    if (i < n - 1 && free(x + 2 * px, y + 2 * py)) R.put(o, x + 2 * px, y + 2 * py, STEEL.edge);
  }
  return o;
}
/** the guard taking a blow: the upper body leans back (to the right), 3 texels at the head, nothing at the hips */
function encaisse(v, top) {
  const hip = top + 85, o = R.blank(v.W, v.H);
  for (let y = 0; y < v.H; y++) { const d = y >= hip ? 0 : Math.min(3, Math.round((3 * (hip - y)) / (hip - top))); for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) R.put(o, x + d, y, R.get(v, x, y)); }
  return o;
}

/** each figure's blade in its cell (texels): [hilt end, tip] or [hilt end, tip, generated tip] (proposed by a RANSAC over the steel texels of
 *  the placed figures, checked on overlays, journal Passe RC2); where the generated blade was the figure's lowest point (the cleave, the
 *  planted sword, the sword on the ground), its tip is pinned on the foot row: the frame keeps standing on row 270 */
export const BLADES = {
  idle: [[76, 226], [44, 268]], ready: [[68, 202], [1, 200]], windup: [[80, 164], [128, 123]], cut: [[51, 160], [2, 122]], follow: [[55, 242], [20, 269]],
  gather: [[112, 233], [166, 257]], raise: [[115, 147], [155, 195]], cleave: [[46, 232], [3, 270]], through: [[47, 246], [11, 270]],
  lungePrep: [[119, 224], [75, 245]], surge: [[64, 214], [3, 212]], thrust: [[59, 201], [2, 199]], lungeBack: [[65, 233], [7, 261]],
  wardPrep: [[77, 198], [79, 131]], ward: [[106, 165], [38, 162]], wardBack: [[55, 208], [6, 180]],
  fervourPrep: [[95, 215], [96, 270]], cry: [[74, 219], [72, 268]], fervourBack: [[64, 216], [24, 241]],
  guard: [[79, 185], [88, 130]], hop: [[90, 193], [39, 217]], land: [[72, 223], [1, 220]], recoil: [[79, 199], [24, 221]], recovery: [[75, 220], [31, 243]],
  stunned: [[81, 235], [58, 270]], fall: [[84, 237], [110, 270]], kneel: [[45, 259], [3, 270]], ground: [[82, 263], [43, 270]], victory: [[65, 127], [32, 79]],
};
export function frames(F = figures()) {
  const P = Object.fromEntries(Object.keys(FIGURES).map((n) => { const im = place(n, F[n]), b = BLADES[n]; return [n, b ? blade2(im, ...b) : im]; }));
  const out = [], add = (anim, list) => list.forEach((im, i) => out.push({ anim, dir: 'side', i, im }));
  const T = (n) => headTop(P[n]);
  add('idle', [P.idle, breath(P.idle, T('idle')).inhale]);
  add('ready', [P.ready, breath(P.ready, T('ready')).inhale]);
  add('strike', [P.windup, P.cut, P.follow]);
  add('heavy', [P.gather, P.raise, P.cleave, P.through]);
  add('skillOff', [P.lungePrep, P.surge, P.thrust, P.lungeBack]);
  add('skillDef', [P.wardPrep, P.ward, P.wardBack]);
  add('skillSup', [P.fervourPrep, P.cry, P.fervourBack]);
  add('block', [P.guard, encaisse(P.guard, T('guard'))]);
  add('dodge', [P.hop, P.land]);
  add('hit', [P.recoil, P.recovery]);
  add('recover', [P.stunned, breath(P.stunned, T('stunned')).exhale]);
  add('ko', [P.fall, P.kneel, P.ground]);
  add('victory', [P.victory, breath(P.victory, T('victory')).inhale]);
  return out;
}
