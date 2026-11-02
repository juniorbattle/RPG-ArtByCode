// The combat sheets' chain (journal Passes RC1, RC2, CX1), shared by Ren's rig and the rivals': a figure alone on its generated sheet (the other figures painted with
// the background) -> reconstruct-grid.mjs at the sheet's own pitch into a wide frame, feet on the cell's foot row -> the sheet's background halo peeled on the full colours ->
// nearest OKLab colour of the fighter's pinned palette (no new colour) -> loose texels removed -> the hips put on the cell's axis, cropped to the cell. Then the frames a rig makes
// from a figure: the breath of a loop, the guard's « encaisse », a blade redrawn at two texels of steel and a dark edge (RC2-3).
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import * as R from '../../../../tools/art-lab/rig-engine.mjs';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..', '..');
/** the arena cell at x3 (CELL_W x CELL_H x CELL_FOOT of FighterArt, times 3) */
export const FRAME = { W: 192, H: 288, FOOT: 270, AXIS: 96, K: 3 };
const WIDE = 384, CLOSING = 207;
/** the sheet's outer rows are not its flat ground */
const EDGE = 8;

export const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const chroma = (c) => { const [, a, b] = R.oklab(c); return Math.hypot(a, b); };

/** the figure alone: foreground components (8-connected, 2-pixel reach) whose box centre lies inside `box`; everything else the background */
function isolate(sh, box, thr) {
  const { W, H, px } = sh, bg = [px[0], px[1], px[2]];
  const fg = (x, y) => { const i = (y * W + x) * 4; return Math.max(Math.abs(px[i] - bg[0]), Math.abs(px[i + 1] - bg[1]), Math.abs(px[i + 2] - bg[2])) > thr; };
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
/** the sheet's background blended into the figure's border texels (full colours, before the palette): peeled twice */
function dehalo(v, bg, near = (c) => Math.max(Math.abs(c[0] - bg[0]), Math.abs(c[1] - bg[1]), Math.abs(c[2] - bg[2])) <= 18) {
  let o = R.clone(v);
  for (let pass = 0; pass < 2; pass++) {
    const n = R.clone(o);
    for (let y = 0; y < o.H; y++) for (let x = 0; x < o.W; x++) {
      const c = R.get(o, x, y); if (!c) continue;
      if (R.opaque(o, x + 1, y) && R.opaque(o, x - 1, y) && R.opaque(o, x, y + 1) && R.opaque(o, x, y - 1)) continue;
      if (near(c)) R.put(n, x, y, null);
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
export function despeckle(im, min) {
  const o = R.clone(im), seen = new Uint8Array(im.W * im.H);
  o.push = im.push;
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (seen[y * im.W + x] || !R.opaque(im, x, y)) continue;
    const comp = [], st = [[x, y]]; seen[y * im.W + x] = 1;
    while (st.length) { const [a, b] = st.pop(); comp.push([a, b]); for (const [p, q] of [[a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]]) if (p >= 0 && q >= 0 && p < im.W && q < im.H && !seen[q * im.W + p] && R.opaque(im, p, q)) { seen[q * im.W + p] = 1; st.push([p, q]); } }
    if (comp.length < min) for (const [a, b] of comp) R.put(o, a, b, null);
  }
  return o;
}
/** every figure reconstructed in a wide frame (feet on the foot row, the bbox centred), on the pinned palette: { name: image }. `bgThr`: how far from the sheet's background a
 *  pixel starts being figure; `tint(c)`: a sheet background far from every colour of the figure may peel what leans toward it; `min`: the loose islands' size; `head`: { s, r } grows the head
 *  of the figures that give theirs (`head: [x, y, dir]`, sheet pixels, degrees toward the neck); `extra`: colours added to the pinned palette (a town sheet without a weapon has no steel) */
export function reconstructFigures({ id, palette, sheets, figures, bgThr = 40, tint, min = 12, head = null, extra = [] }) {
  const pal = [...R.paletteOf(R.load(path.join(ROOT, palette.path))), ...extra];
  if (sha(path.join(ROOT, palette.path)) !== palette.sha256) throw new Error(`${palette.path}: not the pinned palette`);
  const loaded = {};
  for (const [k, s] of Object.entries(sheets)) { const got = sha(path.join(ROOT, s.path)); if (got !== s.sha256) throw new Error(`${s.path}: SHA-256 ${got}, the rig expects ${s.sha256}`); loaded[k] = R.load(path.join(ROOT, s.path)); }
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), `artlab-${id}-`)), out = {};
  try {
    for (const [name, f] of Object.entries(figures)) {
      const { im, bg } = isolate(loaded[f.sheet], f.box, bgThr), file = path.join(tmp, `${name}.png`), pre = path.join(tmp, name);
      R.save(file, f.head ? growHead(im, { c: f.head.slice(0, 2), r: f.r ?? head.r, dir: ((f.head[2] ?? 90) * Math.PI) / 180, blade: !!head.blade }, head.s) : im);
      execFileSync(process.execPath, [path.join(ROOT, 'tools/art-lab/reconstruct-grid.mjs'), file, (f.head ? grownBox(f, f.r ?? head.r, head.s) : f.box).join(','), String(f.pitch ?? sheets[f.sheet].pitch), String(WIDE), String(FRAME.H), String(FRAME.FOOT), pre, 'full', '--holes', '--no-shadow', `--closing-from=${CLOSING}`, ...(tint ? [`--bg-threshold=${bgThr}`] : [])], { stdio: 'ignore' });
      const rep = JSON.parse(fs.readFileSync(`${pre}.json`, 'utf8'));
      if (rep.clipped) throw new Error(`${name}: ${rep.clipped} texels clipped by the ${WIDE}-wide frame`);
      out[name] = despeckle(toPalette(dehalo(R.load(`${pre}-full.png`), bg, tint ? (c) => tint(c, bg) : undefined), pal), min);
    }
  } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  return out;
}
/** a blade's pixel on a sheet: light and without colour */
const bright = (im, x, y) => { const q = R.get(im, x, y); if (!q) return false; const [L, a, b] = R.oklab(q); return L > 0.62 && Math.hypot(a, b) < 0.04; };
/** the head enlarged on the sheet itself, before the reconstruction, so it holds the source's own detail (the town sheets' `head`, journal Passes CA3 / CA4: the clean figures draw smaller heads
 *  than the cast's): the head's disc, centre `c` and radius `r` in sheet pixels, grows by `s` around a centre moved along `dir` (radians, toward the neck, 90 degrees = down) so its chin stays on
 *  the neck, then falls back to the sheet over a quarter of the radius. `blade`: a thin blade near the head would bend with it (blind critique, journal Passe CX3): its bright neutral pixels stay
 *  where the sheet has them, and the disc takes the colour beside them instead */
export function growHead(im, { c, r, dir = Math.PI / 2, blade = false }, s) {
  const d = (s - 1) * r, ox = c[0] - Math.cos(dir) * d, oy = c[1] - Math.sin(dir) * d, big = r * s, fall = r * 0.25;
  const o = R.clone(im);
  for (let y = Math.max(0, Math.floor(oy - big - fall)); y <= Math.min(im.H - 1, Math.ceil(oy + big + fall)); y++) for (let x = Math.max(0, Math.floor(ox - big - fall)); x <= Math.min(im.W - 1, Math.ceil(ox + big + fall)); x++) {
    const px = x - ox, py = y - oy, rho = Math.hypot(px, py);
    if (rho >= big + fall) continue;
    const w = rho <= big ? 1 : 1 - (rho - big) / fall, sx = c[0] + px / s, sy = c[1] + py / s;
    let tx = Math.round(w * sx + (1 - w) * x), ty = Math.round(w * sy + (1 - w) * y);
    if (blade && bright(im, tx, ty)) { const near = [[9, 0], [-9, 0], [0, 9], [0, -9], [14, 0], [-14, 0], [0, 14], [0, -14]].find(([a, b]) => !bright(im, tx + a, ty + b)); if (near) { tx += near[0]; ty += near[1]; } }
    for (let k = 0; k < 4; k++) o.px[(y * im.W + x) * 4 + k] = im.px[(ty * im.W + tx) * 4 + k];
  }
  if (blade) for (let y = Math.max(0, Math.floor(oy - big - fall)); y <= Math.min(im.H - 1, Math.ceil(oy + big + fall)); y++) for (let x = Math.max(0, Math.floor(ox - big - fall)); x <= Math.min(im.W - 1, Math.ceil(ox + big + fall)); x++) if (bright(im, x, y)) for (let k = 0; k < 4; k++) o.px[(y * im.W + x) * 4 + k] = im.px[(y * im.W + x) * 4 + k];
  return o;
}
/** the figure's box with room for its grown head, up and forward only where it needs it (the box's corner stands for the background, journal Passe CA2) */
function grownBox(f, r, s) {
  const dir = ((f.head[2] ?? 90) * Math.PI) / 180, d = (s - 1) * r, big = r * s * 1.25 + 4, x = f.head[0] - Math.cos(dir) * d - big, y = f.head[1] - Math.sin(dir) * d - big;
  return [Math.max(EDGE, Math.min(f.box[0], Math.round(x))), Math.max(EDGE, Math.min(f.box[1], Math.round(y))), f.box[2], f.box[3]];
}
/** a flat saturated sheet's background: what stays near it, and a border texel that leans toward it (the green the generated edges blend in): peeled */
export const chromaKey = (c, bg) => Math.max(Math.abs(c[0] - bg[0]), Math.abs(c[1] - bg[1]), Math.abs(c[2] - bg[2])) <= 18 || c[1] > Math.max(c[0], c[2]) + 24;
/** a blade pointing left too long for the cell: its `n` leftmost columns cut off, the new end pointed over 5 columns (each column keeps the middle of its run, narrower toward the tip) */
export function trimTip(im, n) {
  let left = im.W; for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (R.opaque(im, x, y)) left = Math.min(left, x);
  const end = left + n, o = R.erase(im, (x) => x < end);
  for (let k = 0; k < 5; k++) {
    const x = end + k, rows = []; for (let y = 0; y < o.H; y++) if (R.opaque(o, x, y)) rows.push(y);
    if (!rows.length) continue;
    const mid = (rows[0] + rows[rows.length - 1]) / 2, half = ((rows.length / 2) * (k + 1)) / 5;
    for (const y of rows) if (Math.abs(y - mid) > half) R.put(o, x, y, null);
  }
  return o;
}
/** the feet's midpoint: on the lowest 9 rows, the coloured runs (the steel of a blade lying low is left out) at least 5 texels wide; the two
 *  hindmost are the feet (a sword's hilt or tip in front of them comes first, the figure facing left); one run = its centre */
export function feetMid(im) {
  const runs = [];
  for (let x = 0; x < im.W; x++) {
    let hit = false; for (let y = FRAME.FOOT - 8; y <= FRAME.FOOT; y++) { const c = R.get(im, x, y); if (c && chroma(c) > 0.02) hit = true; }
    if (!hit) continue; const r = runs[runs.length - 1]; if (r && x - r[1] <= 2) r[1] = x; else runs.push([x, x]);
  }
  const big = runs.filter((r) => r[1] - r[0] >= 4);
  if (!big.length) throw new Error('no foot on the ground');
  const [a, b] = big.length === 1 ? [big[0], big[0]] : big.slice(-2);
  return Math.round((a[0] + b[1]) / 2);
}
/** the soles' midpoint: on the three lowest rows only, runs at least 8 texels wide: a blade held low over the ground, which feetMid can take for the back foot, stays out of it (blind critique,
 *  journal Passe CX3: the preparation of the heavy attack sat 50 texels forward of its neighbours); a figure without two soles on the ground (lying, kneeling) falls back on feetMid */
export function solesMid(im) {
  const bot = R.bottom(im);
  // from the lowest row up: a blade's tip can stand lower than the soles
  for (let up = 0; up <= 14; up++) {
    const runs = [];
    for (let x = 0; x < im.W; x++) { let hit = false; for (let y = bot - up - 2; y <= bot - up; y++) { const c = R.get(im, x, y); if (c && !steelLike(c)) hit = true; } if (!hit) continue; const r = runs[runs.length - 1]; if (r && x - r[1] <= 3) r[1] = x; else runs.push([x, x]); }
    const big = runs.filter((r) => r[1] - r[0] >= 11);
    if (big.length >= 2) return Math.round((big[big.length - 2][0] + big[big.length - 1][1]) / 2);
  }
  return feetMid(im);
}
/** the figure's hips on the cell's axis (moved by the least that keeps it inside the cell's transparent ring), cropped to the cell. `report`: per figure the hips' column and how
 *  far the cell pushed the body (a lunge whose blade reaches past the cell's front edge moves its body back in the cell: the figure is shifted until it fits; the image carries that
 *  `push`, and the sheet's metadata with it: the arena moves the sprite by as much, so the body does not jump at the frame) */
export function place(name, im, hipsAt, report, feet = feetMid) {
  let a = im.W, b = -1; for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (R.opaque(im, x, y)) { a = Math.min(a, x); b = Math.max(b, x); }
  const hips = hipsAt ?? feet(im);
  if (b - a + 1 > FRAME.W - 2) throw new Error(`${name}: ${b - a + 1} texels wide, the cell holds ${FRAME.W - 2}`);
  // left edge a lands on a + AXIS - at >= 1, right edge b on b + AXIS - at <= W - 2
  const at = Math.max(Math.min(hips, a + FRAME.AXIS - 1), b - (FRAME.W - 2 - FRAME.AXIS));
  report[name] = { hips, pushed: hips - at, lifted: FRAME.FOOT - R.bottom(im) };
  const o = R.blank(FRAME.W, FRAME.H), dx = FRAME.AXIS - at, dy = FRAME.FOOT - R.bottom(im);   // the halo peeled off a sole: back on the foot row
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) if (R.opaque(im, x, y)) R.put(o, x + dx, y + dy, R.get(im, x, y));
  o.push = hips - at;
  return o;
}
/** the head's top row: the highest opaque texel that is not the blade (steel greys and whites, low chroma) */
export function headTop(im, min = 0.03) {
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) { const c = R.get(im, x, y); if (c && chroma(c) > min) return y; }
  return -1;
}
/** rig-engine's breath at x3 (hero-x3-trial's rows measured from the head's top: neck +40, chest +45, cut +85; lifts of 2 rows) */
export function breath(v, top) {
  const neck = top + 40, chest = top + 45, cutY = top + 85;
  const lower = R.cut(v, (x, y) => y >= cutY), upper = R.cut(v, (x, y) => y < cutY), all = () => true;
  const inhale = R.over(lower, R.remapRows(upper, all, 0, cutY - 1, -2, cutY - 1, chest, 6)), exhale = R.over(lower, R.remapRows(upper, all, 0, cutY - 1, -2, cutY - 1, neck, cutY - 1 - (neck + 5)));
  inhale.push = exhale.push = v.push;
  return { inhale, exhale };
}
/** the blade's colours (RC2-3 « Deux texels d'acier et un bord sombre »): two light rows, the two texels of steel the night's dark ground shows, and a dark neutral edge row, the
 *  outline the day's light cobbles show. A light row with a dark one read as a one-texel wire in the scene, one row lost in each light (blind critique, journal Passe RC2) */
export const STEEL = { light: [248, 233, 216], light2: [230, 201, 183], edge: [50, 46, 50] };
/** steel-like texels: the colours the generated steel and its dark edge took on the palette (neutral: low chroma, any lightness) */
const steelLike = (c) => { const [, a, b] = R.oklab(c); return Math.hypot(a, b) < 0.05; };
/** the blade at two texels of steel and its dark edge (the operator's decision RC1-1, « avec les reprises »: the reconstruction left it one
 *  texel wide and broken):
 *  from the hilt end `h` to the tip `t` (cell texels, pinned per figure), the old blade's loose neutral texels within 5 texels of
 *  the segment are removed (those touching a coloured texel of the body stay), then a line of the light steel along the segment, a line of the
 *  second light beside it and a line of the dark edge beyond (below a flat blade, behind a steep one), drawn only where the figure was
 *  transparent or neutral (a hand or a sleeve over the blade stays in front); each line one texel shorter than the last, the point. `was`: where the generated blade's tip
 *  was, when the new segment turns the blade around the hilt (the cut, Passe RC2): the old blade's loose texels go too */
export function blade2(im, h, t, was = t, steel = STEEL) {
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
  const free = (x, y) => x >= 1 && y >= 1 && x <= im.W - 2 && y <= FRAME.FOOT && !body(x, y);
  for (let i = 0; i <= n; i++) {
    const x = Math.round(h[0] + (dx * i) / n), y = Math.round(h[1] + (dy * i) / n), [px, py] = flat ? [0, 1] : [1, 0];
    if (free(x, y)) R.put(o, x, y, steel.light);
    if (i < n && free(x + px, y + py)) R.put(o, x + px, y + py, steel.light2);
    if (i < n - 1 && free(x + 2 * px, y + 2 * py)) R.put(o, x + 2 * px, y + 2 * py, steel.edge);
  }
  o.push = im.push;
  return o;
}
/** the guard taking a blow: the upper body leans back (to the right), 3 texels at the head, nothing at the hips */
export function encaisse(v, top) {
  const hip = top + 85, o = R.blank(v.W, v.H);
  for (let y = 0; y < v.H; y++) { const d = y >= hip ? 0 : Math.min(3, Math.round((3 * (hip - y)) / (hip - top))); for (let x = 0; x < v.W; x++) if (R.opaque(v, x, y)) R.put(o, x + d, y, R.get(v, x, y)); }
  o.push = v.push;
  return o;
}

/** a blade's steel for a town palette that holds none (a fighter without a weapon in town: a blade came out rose, blind critique, journal Passe CX2) */
export const STEEL_RAMP = [[236, 238, 244], [190, 196, 208], [132, 138, 152], [78, 82, 96], [44, 46, 58]];
/** a rival's sheet from its figures (journal Passe CX1): the figures carry the roles of the § 14 list, the rig only says who it is and where each figure stands; the clips follow
 *  from the figures it has (`guard`: block; `hop`, `land`: dodge; the three skill families). `hair` on a figure: its head's top row, when a raised hilt stands above it. `height`: its
 *  standing height at x3, its town sheet's side idle (each sheet's pitch from a figure's height in pixels, `stand`). */
export function rivalRig({ id, palette, height, sheets, figures: fig, head = null, extra = [], soles = false }) {
  // the head a third of the figure: a head grown by s adds (s - 1) / 3 of the height, the body gives it back
  const body = head ? 2 / 3 + head.s / 3 : 1;
  for (const s of Object.values(sheets)) s.pitch ??= +((s.stand * body) / height).toFixed(4);
  const has = (n) => !!fig[n];
  const clips = { idle: 2, ready: 2, strike: 3, heavy: 4, skillOff: 4, ...(has('defPrep') ? { skillDef: 3 } : {}), ...(has('supPrep') ? { skillSup: 3 } : {}), ...(has('guard') ? { block: 2 } : {}), ...(has('hop') ? { dodge: 2 } : {}), hit: 2, recover: 2, ko: 3, victory: 2 };
  const figures = () => reconstructFigures({ id, palette, sheets, figures: fig, bgThr: 60, tint: chromaKey, head, extra });
  const placement = {};
  const frames = (F = figures()) => {
    const P = Object.fromEntries(Object.keys(fig).map((n) => [n, place(n, despeckle(fig[n].trim ? trimTip(F[n], fig[n].trim) : F[n], 40), fig[n].hips, placement, soles ? solesMid : feetMid)]));
    const out = [], add = (anim, list) => list.forEach((im, i) => out.push({ anim, dir: 'side', i, im }));
    const T = (n) => fig[n].hair ?? headTop(P[n], 0.015);
    add('idle', [P.idle, breath(P.idle, T('idle')).inhale]);
    add('ready', [P.ready, breath(P.ready, T('ready')).inhale]);
    add('strike', [P.windup, P.cut, P.follow]);
    add('heavy', [P.gather, P.raise, P.cleave, P.through]);
    add('skillOff', [P.offPrep, P.offSurge, P.offHit, P.offBack]);
    if (clips.skillDef) add('skillDef', [P.defPrep, P.def, P.defBack]);
    if (clips.skillSup) add('skillSup', [P.supPrep, P.sup, P.supBack]);
    if (clips.block) add('block', [P.guard, encaisse(P.guard, T('guard'))]);
    if (clips.dodge) add('dodge', [P.hop, P.land]);
    add('hit', [P.recoil, P.recovery]);
    add('recover', [P.stunned, breath(P.stunned, T('stunned')).exhale]);
    add('ko', [P.fall, P.kneel, P.ground]);
    add('victory', [P.victory, breath(P.victory, T('victory')).inhale]);
    return out;
  };
  return { id, frame: FRAME, clips, PALETTE: palette, EXTRA: extra, SHEETS: sheets, FIGURES: fig, figures, placement, frames };
}
