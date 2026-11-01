import { Rng, mix32 } from '../core/rng';
import { rgb, type Tone } from '../ui/design/tokens';

/** The duel's own pixel-art effects (journal Passe FX1): pure functions, (frame, seed, ramp) -> texels, painted once at boot behind the DEV
 *  parameter `fx=new` (src/lab/combatFx.ts). No Math.random, no DOM, no third party: every shape below is written here. The texels are those of
 *  the combat sheets at x3 (2.3 px per texel at 1080p). A texel is one of three things, and nothing in between (dither, never transparency):
 *    alpha 255          the effect's core, an opaque pixel of the ramp, emissive (it reaches the bloom);
 *    alpha 254          a matte pixel of the core (dust: it takes the scene's level, it does not shine);
 *    alpha 0, rgb > 0   its glow, added to the scene (the same ramp, dithered);
 *    all zero           nothing.
 *  A blow travels toward +x in the painters: the runtime mirrors a frame for a blow going the other way. */

export type RGB = [number, number, number];

/** the colours an effect may use, all tokens of the page's tone (src/ui/design/tokens.ts, the interface's palette, L2 / S3); `hot` is the
 *  amber, the one warm accent of the night; by day what is dying stays light (a dark ember on the sand reads as a fly); `ink` closes the solid
 *  shapes, against the light sand by day and the cream of a sword's arc at night */
export interface FxRamp {
  /** dark to light */
  steel: [RGB, RGB, RGB, RGB]; hot: [RGB, RGB, RGB, RGB]; dust: [RGB, RGB, RGB];
  ink: RGB;
  /** on the light sand: the thin marks take the deep tones (a pale mote is lost in the cobbles) */
  byDay: boolean;
}

export function fxRamp(t: Tone, byDay: boolean): FxRamp {
  const c = (hex: string): RGB => rgb(hex);
  return {
    steel: [c(byDay ? t.blue2 : t.blue1), c(t.blue2), c(t.blue3), c(t.ivory)],
    hot: [c(byDay ? t.amber : t.amberLo), c(t.amber), c(t.amberHi), c(t.ivory)],
    dust: byDay ? [c(t.parchLo), c(t.parch), c(t.ivory)] : [c(t.blue1), c(t.blue2), c(t.muted)],
    ink: c(t.ink), byDay,
  };
}

/** the ordered dither: 4 x 4 Bayer; `d` the share of texels kept */
const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
export const dithered = (x: number, y: number, d: number): boolean => (BAYER[((y & 3) << 2) | (x & 3)] + 0.5) / 16 < d;
/** a texel's own draw (0..1), for what must not read as a grid: the dust */
const speck = (x: number, y: number, seed: number): number => mix32(mix32(seed, x), y) / 4294967296;

export class Cell {
  readonly rgba: Uint8ClampedArray;
  constructor(readonly w: number, readonly h: number) { this.rgba = new Uint8ClampedArray(w * h * 4); }
  private at(x: number, y: number): number { return x < 0 || y < 0 || x >= this.w || y >= this.h ? -1 : (y * this.w + x) * 4; }
  isCore(x: number, y: number): boolean { const q = this.at(x, y); return q >= 0 && this.rgba[q + 3] >= 254; }
  isShining(x: number, y: number): boolean { const q = this.at(x, y); return q >= 0 && this.rgba[q + 3] === 255; }
  core(x: number, y: number, c: RGB, alpha = 255): void {
    const q = this.at(Math.round(x), Math.round(y)); if (q < 0) return;
    this.rgba[q] = c[0]; this.rgba[q + 1] = c[1]; this.rgba[q + 2] = c[2]; this.rgba[q + 3] = alpha;
  }
  /** a glow texel (under the core, never over it) */
  glow(x: number, y: number, c: RGB): void {
    const q = this.at(Math.round(x), Math.round(y)); if (q < 0 || this.rgba[q + 3] >= 254) return;
    this.rgba[q] = c[0]; this.rgba[q + 1] = c[1]; this.rgba[q + 2] = c[2];
  }
  line(x0: number, y0: number, x1: number, y1: number, c: RGB, th = 1): void {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))), a = -Math.floor((th - 1) / 2);
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + ((x1 - x0) * i) / n), y = Math.round(y0 + ((y1 - y0) * i) / n);
      for (let j = 0; j < th; j++) for (let k = 0; k < th; k++) this.core(x + a + k, y + a + j, c);
    }
  }
}

/** a four-pointed star (a flash), long along `ang`: its band from `hollow` (0 = full) to 1, dark tip to bright heart, kept by the dither `d` */
function star(C: Cell, cx: number, cy: number, ra: number, rb: number, ang: number, cols: readonly RGB[], d = 1, hollow = 0): void {
  const r = Math.ceil(Math.max(ra, rb)) + 1, ca = Math.cos(ang), sa = Math.sin(ang);
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    const dx = x - cx, dy = y - cy, u = Math.abs(dx * ca + dy * sa) / ra, v = Math.abs(-dx * sa + dy * ca) / rb;
    const s = Math.pow(u, 0.62) + Math.pow(v, 0.62);
    if (s > 1 || s < hollow || !dithered(x, y, d)) continue;
    C.core(x, y, s < 0.5 ? cols[3] : s < 0.72 ? cols[2] : s < 0.88 ? cols[1] : cols[0]);
  }
}

/** a lens (a cut in the air): long along `ang`, thickest at its middle */
function lens(C: Cell, cx: number, cy: number, len: number, th: number, ang: number, cols: readonly RGB[]): void {
  const ca = Math.cos(ang), sa = Math.sin(ang), r = Math.ceil(len) + 1;
  for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) {
    const dx = x - cx, dy = y - cy, u = (dx * ca + dy * sa) / len, v = -dx * sa + dy * ca;
    if (Math.abs(u) > 1) continue;
    const half = (th / 2) * (1 - u * u) * (1 + 0.35 * u);
    if (Math.abs(v) > half) continue;
    C.core(x, y, Math.abs(v) < half * 0.5 ? cols[2] : cols[1]);
  }
}

/** the additive halo: a disc of glow texels thinning outward, its colour dimming outward too (`far`), so the dither's last dots do not read as a
 *  grid; the runtime draws it behind the fighters */
function halo(C: Cell, cx: number, cy: number, r: number, c: RGB, d: number, sq = 1, far: RGB = c): void {
  const ry = r * sq;
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
    const q = Math.hypot((x - cx) / r, (y - cy) / ry);
    if (q <= 1 && dithered(x, y, d * (1 - q) * (1 - q * 0.5))) C.glow(x, y, q < 0.5 ? c : far);
  }
}

/** a ring (`sq` flattens it); `dash` dashes around it, `phase` of a dash turned; kept by the dither `d` */
function ring(C: Cell, cx: number, cy: number, r: number, th: number, c: RGB, d = 1, sq = 1, dash = 0, phase = 0): void {
  const R = r + th, ry = R * sq + 1;
  for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - R); x <= cx + R; x++) {
    const dx = x - cx, dy = (y - cy) / sq, q = Math.hypot(dx, dy);
    if (Math.abs(q - r) > th / 2 || !dithered(x, y, d)) continue;
    if (dash) { const a = (Math.atan2(dy, dx) / (Math.PI * 2) + 1) * dash + phase; if (a - Math.floor(a) > 0.55) continue; }
    C.core(x, y, c);
  }
}

/** a dashed ring lying on the ground, seen almost edge on: walked by its angle (a ring by distance leaves nothing at its top and bottom) */
function floorRing(C: Cell, cx: number, cy: number, r: number, sq: number, c: RGB, dash: number, phase: number): void {
  const n = Math.ceil(r * 7);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2, k = (i / n) * dash + phase;
    if (k - Math.floor(k) > 0.55) continue;
    const x = Math.round(cx + Math.cos(a) * r), y = Math.round(cy + Math.sin(a) * r * sq);
    C.core(x, y, c); C.core(x + 1, y, c);
  }
}

interface SparkOpts { cx: number; cy: number; a0: number; a1: number; v0: number; v1: number; g: number; cols: readonly RGB[]; tail?: number }
/** `n` sparks thrown from a point: every draw is made whatever `t` (0..1 of the effect), so one seed gives one flight across the frames */
function sparks(C: Cell, rng: Rng, n: number, t: number, o: SparkOpts): void {
  const tail = o.tail ?? 0.2;
  for (let i = 0; i < n; i++) {
    const a = rng.range(o.a0, o.a1), v = rng.range(o.v0, o.v1), life = rng.range(0.55, 1), u = t / life;
    if (u > 1 || u <= 0) continue;
    const at = (w: number): [number, number] => { const e = 1 - (1 - w) * (1 - w); return [o.cx + Math.cos(a) * v * e, o.cy + Math.sin(a) * v * e + o.g * w * w]; };
    const p = at(u), q = at(Math.max(0, u - tail));
    C.line(q[0], q[1], p[0], p[1], o.cols[u < 0.3 ? 3 : u < 0.6 ? 2 : u < 0.85 ? 1 : 0], u < 0.45 ? 2 : 1);
  }
}

/** a puff of dust: a lumpy disc lit from above, dark at its foot; it goes as pixel smoke goes, a hole opening from its middle (`hollow`, 0..1),
 *  and its texels go one by one, in no pattern (`d`: the Bayer dither makes a net of a mass this large) */
function puff(C: Cell, rng: Rng, cx: number, cy: number, r: number, cols: readonly RGB[], d: number, hollow = 0): void {
  const p0 = rng.range(0, 6.28), p1 = rng.range(0, 6.28);
  for (let y = Math.floor(cy - r * 1.3); y <= cy + r * 1.3; y++) for (let x = Math.floor(cx - r * 1.3); x <= cx + r * 1.3; x++) {
    const dx = x - cx, dy = y - cy, a = Math.atan2(dy, dx), rr = r * (1 + 0.16 * Math.sin(3 * a + p0) + 0.1 * Math.sin(7 * a + p1)), q = Math.hypot(dx, dy) / rr;
    if (q > 1 || q < hollow || speck(x, y, Math.floor(p0 * 1000)) > d) continue;
    const lit = -dy / r + dx * 0.15 / r;
    C.core(x, y, cols[lit > 0.42 ? 2 : lit > 0 ? 1 : 0], 254);
  }
}

/** every free texel beside a solid shining shape takes the ink: a star holds on the sand and on a sword's arc. A lone texel (a spark, the dither of a dying
 *  ring) takes none, or the ink would outweigh it; the matte dust keeps its own edge */
function inked(C: Cell, ink: RGB): Cell {
  const edge: Array<[number, number]> = [], s = (x: number, y: number) => (C.isShining(x, y) ? 1 : 0);
  const lit = (x: number, y: number) => s(x, y) === 1 && s(x - 1, y) + s(x + 1, y) + s(x, y - 1) + s(x, y + 1) >= 3;
  for (let y = 0; y < C.h; y++) for (let x = 0; x < C.w; x++) if (!C.isCore(x, y) && (lit(x - 1, y) || lit(x + 1, y) || lit(x, y - 1) || lit(x, y + 1))) edge.push([x, y]);
  for (const [x, y] of edge) C.core(x, y, ink);
  return C;
}

/* ------------------------------------------------------------------ the effects */

/** a light blow: a short star along the blow, a few sparks thrown on; the star goes hollow, then only the sparks are left */
export function paintHitLight(frame: number, seed: number, R: FxRamp): Cell {
  const C = new Cell(48, 48), cx = 24, cy = 24, ang = -0.42, rng = new Rng(mix32(seed, 11));
  const cols = [R.steel[1], R.hot[2], R.hot[3], R.hot[3]];
  const S = [[16, 7], [20, 8], [14, 5], [7, 3]][frame];
  if (frame < 3) halo(C, cx, cy, [16, 20, 18][frame], R.hot[1], 0.7, 1, R.hot[0]);
  const u = [0.14, 0.36, 0.6, 0.84][frame];
  sparks(C, rng, 7, u, { cx, cy, a0: -1.1, a1: 0.8, v0: 12, v1: 21, g: 7, cols: [R.steel[2], R.hot[1], R.hot[2], R.hot[3]] });
  sparks(C, rng, 3, u, { cx, cy, a0: 2.3, a1: 4, v0: 7, v1: 12, g: 6, cols: [R.steel[2], R.hot[1], R.hot[2], R.hot[3]] });
  if (S) star(C, cx, cy, S[0], S[1], ang, cols, 1, [0, 0, 0.5, 0.62][frame]);
  return inked(C, R.ink);
}

/** a heavy blow: the cut in the air, the star at its full reach, a ring thrown out and torn by the dither, embers falling */
export function paintHitHeavy(frame: number, seed: number, R: FxRamp): Cell {
  const C = new Cell(96, 96), cx = 46, cy = 46, ang = -0.5, rng = new Rng(mix32(seed, 22));
  const t = [0.06, 0.22, 0.42, 0.64, 0.86][frame], cols = [R.hot[0], R.hot[1], R.hot[2], R.hot[3]];
  halo(C, cx, cy, [22, 40, 44, 40, 30][frame], R.hot[1], [0.8, 0.85, 0.7, 0.45, 0.25][frame], 1, R.hot[0]);
  sparks(C, rng, 12, t, { cx, cy, a0: -1.3, a1: 0.9, v0: 26, v1: 46, g: 18, cols });
  sparks(C, rng, 5, t, { cx, cy, a0: 2.2, a1: 4.1, v0: 14, v1: 26, g: 14, cols });
  const rr = [0, 13, 25, 34, 41][frame], th = [0, 5, 4, 3, 2][frame], dd = [0, 1, 1, 0.8, 0.45][frame];
  if (rr) ring(C, cx, cy, rr, th, frame < 3 ? R.hot[2] : R.hot[1], dd, 0.9);
  if (frame === 0) lens(C, cx, cy, 40, 12, ang, [R.hot[2], R.hot[3], R.hot[3]]);
  const S = [[20, 8], [36, 15], [26, 11], [13, 5]][frame];
  if (S) star(C, cx, cy, S[0], S[1], ang, cols, 1, frame === 3 ? 0.55 : 0);
  return inked(C, R.ink);
}

/** a guard: a crescent of steel before the guard, bulging toward the blow; it thins, breaks up and leaves the sparks thrown back */
export function paintGuard(frame: number, seed: number, R: FxRamp): Cell {
  const C = new Cell(56, 88), cy = 44, rng = new Rng(mix32(seed, 33));
  const r = [24, 28, 31, 33, 34][frame], th = [10, 8, 5, 3, 2][frame], d = [1, 1, 0.9, 0.6, 0.3][frame], cx = 16 + r;
  halo(C, 16, cy, [14, 20, 18, 12, 1][frame], R.steel[2], 0.55, 1, R.steel[1]);
  // the crescent: thickest in front, gone at its two ends
  for (let y = 0; y < C.h; y++) for (let x = 0; x < C.w; x++) {
    const dx = x - cx, dy = y - cy, q = Math.hypot(dx, dy), a = Math.atan2(dy, -dx);
    if (dx > 0 || Math.abs(a) > 1.02) continue;
    const half = (th / 2) * (1 - (a / 1.02) * (a / 1.02)) + 0.4;
    if (Math.abs(q - r) > half || !dithered(x, y, d)) continue;
    C.core(x, y, Math.abs(q - r) < half * 0.45 ? R.steel[3] : q < r ? R.steel[2] : R.steel[1]);
  }
  const cols = [R.steel[1], R.steel[2], R.steel[3], R.steel[3]];
  sparks(C, rng, 8, [0.12, 0.34, 0.56, 0.78, 1][frame], { cx: 16, cy, a0: 2.1, a1: 4.2, v0: 12, v1: 18, g: 8, cols });
  if (frame < 3) star(C, 16, cy, [14, 12, 7][frame], [9, 7, 4][frame], 1.57, [R.steel[1], R.steel[2], R.steel[3], R.steel[3]]);
  return inked(C, R.ink);
}

/** the charge, at its level 1 to 3 (a tier reached): frames 0-1 the tier's pop, a ring closing on the fighter; frames 2-5 the aura held, a loop drawn
 *  behind the silhouette and wider than it: a dashed ring turning on the ground, motes rising, from level 2 amber, at level 3 two tongues of light */
export function paintCharge(frame: number, seed: number, R: FxRamp, level = 1): Cell {
  const C = new Cell(128, 168), cx = 64, foot = 160, L = level - 1, fi = (frame + 2) % 4, rng = new Rng(mix32(seed, 40 + level));
  const H = [92, 122, 152][L], P = 32, n = [16, 22, 30][L], spread = [52, 56, 60][L];
  const low = level === 1 ? R.steel[1] : R.hot[0], mid = level === 1 ? R.steel[2] : R.hot[1], hi = level === 1 ? R.steel[R.byDay ? 2 : 3] : R.hot[R.byDay ? 1 : 2];
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1, off = rng.range(22, spread), phi = rng.range(0, P), cut = rng.next(), len = 3 + Math.floor(rng.range(0, 2 + 2 * level));
    for (let k = 0; k < 6; k++) {
      const h = ((phi + (fi * P) / 4) % P) + k * P;
      if (h < 10 || h > H || 1 - h / H < cut * 0.6) continue;
      const x = Math.round(cx + side * off + Math.sin((h / P) * Math.PI * 2 + phi) * 1.6), y = Math.round(foot - 6 - h);
      const th = h < H * 0.45 ? 2 : 1;
      C.line(x, y, x, y + len, h < H * 0.5 ? mid : low, th);
      C.line(x, y, x, y + 1, h < H * 0.65 && (i + fi) % 2 ? hi : mid, th);
    }
  }
  floorRing(C, cx, foot - 7, [46, 52, 58][L], 0.13, hi, 8 + 2 * L, fi / 4);
  if (level === 3) for (const side of [-1, 1]) for (let h = 2; h < 100; h++) {
    const w = 3.4 * (1 - h / 100) + 0.6, x0 = cx + side * (46 + Math.sin(h * 0.15 - fi * (Math.PI / 2)) * 4 + h * 0.05);
    for (let x = Math.floor(x0 - w - 2); x <= x0 + w + 2; x++) {
      const q = Math.abs(x - x0), y = foot - 6 - h;
      if (q <= w && dithered(x, y, 1 - h * 0.006)) C.core(x, y, q < w * 0.5 ? hi : mid);
      else if (q <= w + 2 && dithered(x, y, 0.42 - h * 0.003)) C.glow(x, y, mid);
    }
  }
  if (frame < 2) {
    const body = foot - 54;
    ring(C, cx, body, [[50, 54, 58][L], [32, 36, 40][L]][frame], 3, hi, 1, 1.05, 8 + 2 * level, frame * 0.25);
    if (frame === 1) { star(C, cx, body, [14, 18, 24][L], [20, 26, 34][L], 1.57, [low, mid, hi, R.hot[3]]); halo(C, cx, body, 38, mid, 0.7, 1, low); }
  }
  return inked(C, R.ink);
}

/** a gauge breaks: the guard's ring flashes whole, cracks, and its plates fly out and fall */
export function paintBreak(frame: number, seed: number, R: FxRamp): Cell {
  const C = new Cell(112, 112), cx = 56, cy = 54, ang = -0.42, rng = new Rng(mix32(seed, 55)), N = 12, r0 = 32, t = Math.max(0, (frame - 1) / 5.6);
  const hot = [R.hot[0], R.hot[1], R.hot[2], R.hot[3]];
  if (frame < 6) halo(C, cx, cy, [38, 50, 54, 50, 40, 30][frame], frame < 2 ? R.steel[2] : R.hot[1], [0.8, 0.85, 0.7, 0.5, 0.36, 0.2][frame], 1, frame < 2 ? R.steel[1] : R.hot[0]);
  sparks(C, rng, 12, Math.max(0.02, t), { cx, cy, a0: 0, a1: 6.28, v0: 26, v1: 50, g: 20, cols: hot });
  if (frame === 0) ring(C, cx, cy, r0, 7, R.steel[3]);
  for (let i = 0; i < N; i++) {
    const a = ((i + 0.5) / N) * Math.PI * 2 + rng.range(-0.08, 0.08), v = rng.range(16, 34), g = rng.range(16, 34), spin = rng.range(-3, 3), fade = rng.next();
    if (frame === 0 || (frame > 1 && t > 0.6 + fade * 0.4)) continue;
    const e = 1 - (1 - t) * (1 - t), r = r0 + v * e, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r + g * t * t;
    const b = a + Math.PI / 2 + spin * t, l = 7 - 2.5 * t, th = frame < 3 ? 5 : frame < 5 ? 4 : 3;
    const col = frame === 1 ? R.steel[3] : i % 3 === 0 ? R.hot[2] : i % 3 === 1 ? R.steel[2] : R.steel[3];
    C.line(x - Math.cos(b) * l, y - Math.sin(b) * l, x + Math.cos(b) * l, y + Math.sin(b) * l, col, th);
  }
  const S = [null, [24, 12], [32, 15], [22, 10], [12, 5]][frame];
  if (S) star(C, cx, cy, S[0], S[1], ang, hot, 1, frame >= 3 ? 0.55 : 0);
  return inked(C, R.ink);
}

/** the K.O.: a flash on the fallen, a line of light along the ground, the dust thrown both ways and rising, embers going up */
export function paintKo(frame: number, seed: number, R: FxRamp): Cell {
  const C = new Cell(176, 112), cx = 88, foot = 104, t = (frame + 0.5) / 7, rng = new Rng(mix32(seed, 66));
  const hot = [R.hot[0], R.hot[1], R.hot[2], R.hot[3]];
  if (frame < 4) halo(C, cx, foot - 34, [44, 64, 70, 60][frame], R.hot[1], [0.85, 0.75, 0.55, 0.3][frame], 0.75, R.hot[0]);
  sparks(C, rng, 12, frame < 2 ? 0 : t, { cx, cy: foot - 22, a0: -2.5, a1: -0.65, v0: 40, v1: 70, g: 34, cols: hot, tail: 0.14 });
  for (let i = 0; i < 16; i++) {
    const side = i % 2 ? 1 : -1, v = rng.range(30, 84), rise = rng.range(6, 34), r0 = rng.range(3, 6), r1 = rng.range(7, 13), lag = rng.range(0, 0.2), u = (t - lag) / (1 - lag);
    if (u <= 0) continue;
    const e = 1 - (1 - u) * (1 - u), pr = new Rng(mix32(seed, 700 + i));
    const late = Math.max(0, (u - 0.55) / 0.45);
    puff(C, pr, cx + side * (10 + v * e), foot - 3 - rise * u - r0 * 0.5, (r0 + (r1 - r0) * e) * (1 - 0.4 * late), R.dust, 1 - late * 0.85, late * 0.5);
  }
  if (frame < 3) { const w = [46, 74, 84][frame]; C.line(cx - w, foot, cx + w, foot, R.hot[3], [3, 2, 1][frame]); C.line(cx - w * 0.6, foot - 1, cx + w * 0.6, foot - 1, R.hot[2], 1); }
  const S = [[22, 44], [14, 30]][frame];
  if (S) star(C, cx, foot - 40, S[0], S[1], 0, hot);
  return inked(C, R.ink);
}

/* ------------------------------------------------------------------ the table and the atlas */

export type FxId = 'hitLight' | 'hitHeavy' | 'guard' | 'charge' | 'break' | 'ko';
export interface FxDef {
  w: number; h: number;
  /** each frame's time on screen (ms); `charge`: its two pop frames, then the aura's loop */
  ms: number[];
  /** levels (the charge's 3) */
  levels: number;
  /** the cell's row on the ground (null: it floats at the body) */
  foot: number | null;
  paint: (frame: number, seed: number, R: FxRamp, level?: number) => Cell;
}
export const FX: Record<FxId, FxDef> = {
  hitLight: { w: 48, h: 48, ms: [34, 34, 50, 66], levels: 1, foot: null, paint: paintHitLight },
  hitHeavy: { w: 96, h: 96, ms: [50, 50, 50, 66, 83], levels: 1, foot: null, paint: paintHitHeavy },
  guard: { w: 56, h: 88, ms: [34, 50, 50, 66, 66], levels: 1, foot: null, paint: paintGuard },
  charge: { w: 128, h: 168, ms: [50, 66, 83, 83, 83, 83], levels: 3, foot: 160, paint: paintCharge },
  break: { w: 112, h: 112, ms: [50, 50, 50, 66, 66, 83, 100], levels: 1, foot: null, paint: paintBreak },
  ko: { w: 176, h: 112, ms: [66, 66, 83, 83, 100, 100, 116], levels: 1, foot: 104, paint: paintKo },
};

/** the frame's key in the atlas */
export const fxKey = (id: FxId, frame: number, level = 1): string => `${id}.${level}.${frame}`;

export interface FxAtlas { width: number; height: number; rgba: Uint8ClampedArray; cells: Map<string, [number, number, number, number]> }
const ATLAS_W = 1024;
/** every frame of every effect, shelf by shelf (row 0 on top; WebGL2 guarantees 2048 x 2048) */
export function paintFxAtlas(R: FxRamp, seed: number): FxAtlas {
  const cells = new Map<string, [number, number, number, number]>(), todo: Array<{ key: string; c: Cell; x: number; y: number }> = [];
  let x = 0, y = 0, shelf = 0;
  for (const [id, d] of Object.entries(FX) as Array<[FxId, FxDef]>) for (let l = 1; l <= d.levels; l++) d.ms.forEach((_, f) => {
    const c = d.paint(f, seed, R, l), key = fxKey(id, f, l);
    if (x + c.w > ATLAS_W) { x = 0; y += shelf; shelf = 0; }
    todo.push({ key, c, x, y }); cells.set(key, [x, y, c.w, c.h]);
    x += c.w; shelf = Math.max(shelf, c.h);
  });
  const height = y + shelf, rgba = new Uint8ClampedArray(ATLAS_W * height * 4);
  for (const { c, x: bx, y: by } of todo) for (let j = 0; j < c.h; j++) rgba.set(c.rgba.subarray(j * c.w * 4, (j + 1) * c.w * 4), ((by + j) * ATLAS_W + bx) * 4);
  return { width: ATLAS_W, height, rgba, cells };
}

/** the charge's level for a tier of the charge (0 the light attack: no aura; the heavy 1; the skills' tiers, the first half 2, the last 3) */
export function chargeLevel(idx: number, tiers: number): number {
  if (idx <= 0) return 0;
  if (idx === 1) return 1;
  return idx - 2 < Math.ceil((tiers - 2) / 2) ? 2 : 3;
}
