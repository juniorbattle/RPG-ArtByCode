import { hash2 } from './rng';

/** CPU noise toolkit used by the texture painters. All functions can wrap (tile) with integer periods
 *  so generated materials are seamless. */

const sm = (t: number) => t * t * (3 - 2 * t);
const wrap = (i: number, p: number) => (p > 0 ? ((i % p) + p) % p : i);

export function vnoise(x: number, y: number, px = 0, py = 0, seed = 0): number {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = sm(x - ix), fy = sm(y - iy);
  const x0 = wrap(ix, px), x1 = wrap(ix + 1, px), y0 = wrap(iy, py), y1 = wrap(iy + 1, py);
  const a = hash2(x0, y0, seed), b = hash2(x1, y0, seed), c = hash2(x0, y1, seed), d = hash2(x1, y1, seed);
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy;
}

/** fractal value noise, ~[0,1], tiles when (period) given in lattice cells for the first octave. */
export function fbm(x: number, y: number, period = 0, octaves = 4, seed = 0, gain = 0.5): number {
  let amp = 0.5, sum = 0, norm = 0, f = 1;
  for (let o = 0; o < octaves; o++) {
    sum += amp * vnoise(x * f, y * f, period * f, period * f, seed + o * 31);
    norm += amp; amp *= gain; f *= 2;
  }
  return sum / norm;
}

export interface Worley { f1: number; f2: number; id: number; dx: number; dy: number }
const _w: Worley = { f1: 0, f2: 0, id: 0, dx: 0, dy: 0 };

/** tileable worley/voronoi noise, period in cells (integers) */
export function worley(x: number, y: number, period = 0, seed = 0, jitter = 1): Worley {
  const ix = Math.floor(x), iy = Math.floor(y);
  let f1 = 9, f2 = 9, id = 0, bx = 0, by = 0;
  for (let j = -1; j <= 1; j++) {
    for (let i = -1; i <= 1; i++) {
      const cx = ix + i, cy = iy + j;
      const wx = wrap(cx, period), wy = wrap(cy, period);
      const px = cx + 0.5 + (hash2(wx, wy, seed) - 0.5) * jitter;
      const py = cy + 0.5 + (hash2(wx, wy, seed + 77) - 0.5) * jitter;
      const dx = px - x, dy = py - y;
      const d = dx * dx + dy * dy;
      if (d < f1) { f2 = f1; f1 = d; id = hash2(wx, wy, seed + 5); bx = dx; by = dy; }
      else if (d < f2) f2 = d;
    }
  }
  _w.f1 = Math.sqrt(f1); _w.f2 = Math.sqrt(f2); _w.id = id; _w.dx = bx; _w.dy = by;
  return _w;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const smoothstep = (a: number, b: number, x: number) => { const t = clamp01((x - a) / (b - a)); return t * t * (3 - 2 * t); };

/** Convert a tileable height field into a normal map (xy in 0..255, z unused) */
export function heightToNormal(h: Float32Array, size: number, strength: number, out: Uint8ClampedArray, stride = 4, offset = 0): void {
  const m = size - 1;
  for (let y = 0; y < size; y++) {
    const ym = ((y - 1) & m) * size, yp = ((y + 1) & m) * size, y0 = y * size;
    for (let x = 0; x < size; x++) {
      const xm = (x - 1) & m, xp = (x + 1) & m;
      const dx = (h[y0 + xp] - h[y0 + xm]) * strength;
      const dy = (h[yp + x] - h[ym + x]) * strength;
      const inv = 1 / Math.sqrt(dx * dx + dy * dy + 1);
      const o = (y0 + x) * stride + offset;
      out[o] = (-dx * inv * 0.5 + 0.5) * 255;
      out[o + 1] = (-dy * inv * 0.5 + 0.5) * 255;
    }
  }
}

