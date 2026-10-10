import { Rng } from '../core/rng';
import { fbm, vnoise, worley, heightToNormal, clamp01, lerp, smoothstep } from '../core/noise';

/** CPU painters producing tileable albedo(+height in alpha) and normal/AO/roughness maps.
 *  Everything is authored in sRGB-ish 0..255 values; the lighting model turns them into night.
 *  No photographic data, only fbm / voronoi / hand-tuned painting rules. */

export type RGB = [number, number, number];
export interface TexSet { size: number; albedo: Uint8ClampedArray; nr: Uint8ClampedArray }

class Buf {
  r: Float32Array; g: Float32Array; b: Float32Array; h: Float32Array; ro: Float32Array; ao: Float32Array;
  constructor(readonly size: number) {
    const n = size * size;
    this.r = new Float32Array(n); this.g = new Float32Array(n); this.b = new Float32Array(n);
    this.h = new Float32Array(n); this.ro = new Float32Array(n).fill(0.8); this.ao = new Float32Array(n).fill(1);
  }
  pack(normalStrength: number): TexSet {
    const n = this.size * this.size;
    const albedo = new Uint8ClampedArray(n * 4), nr = new Uint8ClampedArray(n * 4);
    heightToNormal(this.h, this.size, normalStrength, nr, 4, 0);
    for (let i = 0; i < n; i++) {
      albedo[i * 4] = this.r[i]; albedo[i * 4 + 1] = this.g[i]; albedo[i * 4 + 2] = this.b[i]; albedo[i * 4 + 3] = this.h[i] * 255;
      nr[i * 4 + 2] = this.ao[i] * 255; nr[i * 4 + 3] = this.ro[i] * 255;
    }
    return { size: this.size, albedo, nr };
  }
}

const mixc = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function randomWalkCracks(mask: Float32Array, size: number, rng: Rng, count: number, len: number, w = 1.1): void {
  const stamp = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const xx = (Math.round(x) + dx + size) % size, yy = (Math.round(y) + dy + size) % size;
      const d = Math.hypot(dx, dy) / w;
      const v = clamp01(1 - d * 0.8);
      if (v > mask[yy * size + xx]) mask[yy * size + xx] = v;
    }
  };
  const walk = (x: number, y: number, ang: number, L: number, depth: number) => {
    for (let i = 0; i < L; i++) {
      stamp(x, y);
      ang += (rng.next() - 0.5) * 0.7;
      x = (x + Math.cos(ang) + size) % size; y = (y + Math.sin(ang) + size) % size;
      if (depth < 2 && rng.next() < 0.018) walk(x, y, ang + rng.sign() * rng.range(0.5, 1.1), Math.floor(L * 0.45), depth + 1);
    }
  };
  for (let c = 0; c < count; c++) walk(rng.range(0, size), rng.range(0, size), rng.range(0, Math.PI * 2), Math.floor(len * rng.range(0.5, 1.2)), 0);
}

export interface AshlarOpts {
  rows: number; blockW: number; rowVar: number; widthVar: number; offsetRows: boolean;
  palette: RGB[]; mortar: RGB; mortarW: number; bevel: number; moss: number; chip: number; streak: number; crack: number; normal: number;
}

export function paintAshlar(size: number, seed: number, o: AshlarOpts): TexSet {
  const rng = new Rng(seed);
  const B = new Buf(size);
  const S = size / 512;
  // --- course layout
  const rh: number[] = []; let tot = 0;
  for (let r = 0; r < o.rows; r++) { const v = 1 + (rng.next() - 0.5) * 2 * o.rowVar; rh.push(v); tot += v; }
  const rowY0: number[] = []; let acc = 0;
  for (let r = 0; r < o.rows; r++) { rowY0.push(acc); acc += (rh[r] / tot) * size; }
  rowY0.push(size);
  const rowOfY = new Int16Array(size), rowH = new Float32Array(o.rows);
  for (let r = 0; r < o.rows; r++) {
    rowH[r] = rowY0[r + 1] - rowY0[r];
    for (let y = Math.round(rowY0[r]); y < Math.round(rowY0[r + 1]) && y < size; y++) rowOfY[y] = r;
  }
  // --- blocks per row (tile in x)
  const lu = new Float32Array(o.rows * size), bwA = new Float32Array(o.rows * size), bidA = new Float32Array(o.rows * size);
  for (let r = 0; r < o.rows; r++) {
    const widths: number[] = []; let sum = 0;
    const n = Math.max(2, Math.round(1 / o.blockW));
    for (let i = 0; i < n; i++) { const w = 1 + (rng.next() - 0.5) * 2 * o.widthVar; widths.push(w); sum += w; }
    let off = o.offsetRows ? (r % 2) * 0.5 * (size / n) : rng.next() * size;
    let x = off; const starts: number[] = [], ws: number[] = [];
    for (let i = 0; i < n; i++) { const w = (widths[i] / sum) * size; starts.push(x); ws.push(w); x += w; }
    for (let i = 0; i < n; i++) {
      const id = rng.next();
      for (let px = 0; px < Math.ceil(ws[i]); px++) {
        const xx = Math.floor(starts[i] + px);
        if (px >= ws[i]) break;
        const wx = ((xx % size) + size) % size;
        lu[r * size + wx] = px; bwA[r * size + wx] = ws[i]; bidA[r * size + wx] = id;
      }
    }
  }
  // per-block cracks and tint seeds
  const crackM = new Float32Array(size * size);
  randomWalkCracks(crackM, size, rng.fork('cr'), Math.round(o.crack * 14), Math.round(size * 0.22), 1.0);
  const mortarPx = Math.max(1.5, o.mortarW * S);
  const bevelPx = Math.max(1.5, o.bevel * S);
  for (let y = 0; y < size; y++) {
    const r = rowOfY[y];
    const lv = y - rowY0[r], bh = rowH[r];
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const luv = lu[r * size + x], bw = bwA[r * size + x], bid = bidA[r * size + x];
      const dEdge = Math.min(luv, bw - luv, lv, bh - lv);
      const u = x / size, v = y / size;
      const face = fbm(u * 8, v * 8, 8, 4, 11);
      const fine = vnoise(u * 96, v * 96, 96, 96, 5);
      let hgt: number;
      const palIdx = Math.floor(bid * o.palette.length * 0.999);
      let col = mixc(o.palette[palIdx], o.palette[(palIdx + 1) % o.palette.length], (bid * 37) % 1);
      const lightVar = 0.8 + 0.34 * face + (bid - 0.5) * 0.18 + (fine - 0.5) * 0.12;
      if (dEdge < mortarPx) {
        hgt = 0.02 * fine;
        const mm = 0.75 + 0.5 * vnoise(u * 60, v * 60, 60, 60, 3);
        B.r[i] = o.mortar[0] * mm; B.g[i] = o.mortar[1] * mm; B.b[i] = o.mortar[2] * mm;
        B.ro[i] = 0.95; B.ao[i] = 0.55;
      } else {
        const t = clamp01((dEdge - mortarPx) / bevelPx);
        const hb = t * t * (3 - 2 * t);
        hgt = 0.18 + 0.62 * hb + 0.2 * (face - 0.5) + (fine - 0.5) * 0.06;
        const edgeDark = 0.62 + 0.38 * hb;
        B.r[i] = col[0] * lightVar * edgeDark; B.g[i] = col[1] * lightVar * edgeDark; B.b[i] = col[2] * lightVar * edgeDark;
        B.ro[i] = 0.7 + 0.25 * face; B.ao[i] = 0.6 + 0.4 * hb;
      }
      // chips / pits
      if (o.chip > 0) {
        const w = worley(u * 22, v * 22, 22, 91, 1);
        if (w.f1 < 0.11 && w.id < o.chip) { hgt -= 0.18 * (1 - w.f1 / 0.11); const k = 0.75 + 0.25 * (w.f1 / 0.11); B.r[i] *= k; B.g[i] *= k; B.b[i] *= k; }
      }
      // vertical water streaks
      if (o.streak > 0) {
        const s = vnoise(u * 70, v * 3.5, 70, 4, 21);
        const k = 1 - o.streak * smoothstep(0.55, 0.85, s) * 0.5;
        B.r[i] *= k; B.g[i] *= k * 0.99; B.b[i] *= k * 1.01;
      }
      // cracks
      const cm = crackM[i];
      if (cm > 0.05 && dEdge >= mortarPx) { const k = 1 - cm * 0.65; B.r[i] *= k; B.g[i] *= k; B.b[i] *= k; hgt -= cm * 0.25; B.ao[i] *= 1 - cm * 0.4; }
      // moss, favouring crevices and a low-frequency patch field
      if (o.moss > 0) {
        const mp = fbm(u * 5, v * 5, 5, 4, 47);
        const crev = dEdge < mortarPx + bevelPx * 0.9 ? 1 : 0.25;
        const m = smoothstep(1 - o.moss, 1 - o.moss + 0.18, mp) * crev;
        if (m > 0) { B.r[i] = lerp(B.r[i], 52, m * 0.7); B.g[i] = lerp(B.g[i], 74, m * 0.7); B.b[i] = lerp(B.b[i], 40, m * 0.7); }
      }
      B.h[i] = clamp01(hgt);
    }
  }
  // painter's bevel light: pushes lit-edge highlights and shaded-edge darks into the albedo
  const n = size * size;
  const tmpR = new Float32Array(n), tmpG = new Float32Array(n), tmpB = new Float32Array(n);
  const m = size - 1;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const sh = (B.h[((y + 1) & m) * size + ((x - 1) & m)] - B.h[((y - 1) & m) * size + ((x + 1) & m)]);
    const k = 1 + sh * 0.9;
    tmpR[i] = B.r[i] * k; tmpG[i] = B.g[i] * k; tmpB[i] = B.b[i] * k;
  }
  B.r.set(tmpR); B.g.set(tmpG); B.b.set(tmpB);
  return B.pack(o.normal);
}

export interface PlasterOpts { base: RGB; alt: RGB; crumble: number; cracks: number; stain: number; underlying: TexSet }

export function paintPlaster(size: number, seed: number, o: PlasterOpts): TexSet {
  const rng = new Rng(seed);
  const B = new Buf(size);
  const crackM = new Float32Array(size * size);
  randomWalkCracks(crackM, size, rng.fork('c'), Math.round(o.cracks * 10), Math.round(size * 0.3), 0.9);
  const under = o.underlying;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const u = x / size, v = y / size;
    const blotch = fbm(u * 4, v * 4, 4, 5, 3);
    const trowel = fbm(u * 6, v * 22, 6, 4, 8);
    const grain = vnoise(u * 180, v * 180, 180, 180, 9);
    const grain2 = vnoise(u * 90, v * 90, 90, 90, 12);
    const tone = clamp01(blotch * 1.25 - 0.1);
    let col = mixc(o.base, o.alt, tone);
    const k = 0.9 + 0.14 * trowel + (grain - 0.5) * 0.1;
    let r = col[0] * k, g = col[1] * k, b = col[2] * k;
    let hgt = 0.62 + 0.14 * trowel + (grain2 - 0.5) * 0.12;
    let ro = 0.88, ao = 1;
    // crumbled patches reveal what the wall is made of
    const cmask = fbm(u * 3, v * 3, 3, 5, 71);
    const cm2 = fbm(u * 11, v * 11, 11, 3, 72);
    const cv = cmask * 0.8 + cm2 * 0.2;
    const thr = 1 - o.crumble;
    const t = smoothstep(thr, thr + 0.03, cv);
    if (t > 0) {
      const ui = i * 4;
      const ur = under.albedo[ui], ug = under.albedo[ui + 1], ub = under.albedo[ui + 2], uh = under.albedo[ui + 3] / 255;
      r = lerp(r, ur * 0.95, t); g = lerp(g, ug * 0.95, t); b = lerp(b, ub * 0.95, t);
      hgt = lerp(hgt, uh * 0.45, t);
      ro = lerp(ro, 0.9, t);
      ao *= 1 - 0.35 * (1 - Math.abs(t - 0.5) * 2) * (t > 0 && t < 1 ? 1 : 0);
    }
    // plaster lip highlight and shadow at the crumble boundary
    const edge = smoothstep(thr - 0.035, thr, cv) * (1 - smoothstep(thr, thr + 0.03, cv));
    if (edge > 0) { r *= 1 - 0.28 * edge; g *= 1 - 0.28 * edge; b *= 1 - 0.28 * edge; hgt += 0.12 * edge; }
    // damp streaks that run down the wall
    if (o.stain > 0) {
      const s = vnoise(u * 38, v * 2.4, 38, 3, 31) * vnoise(u * 9, v * 5, 9, 5, 33);
      const sk = 1 - o.stain * smoothstep(0.35, 0.8, s) * 0.45;
      r *= sk; g *= sk * 0.98; b *= sk * 0.96;
    }
    const cm = crackM[i];
    if (cm > 0.05) { const kk = 1 - cm * 0.6; r *= kk; g *= kk; b *= kk; hgt -= cm * 0.3; ao *= 1 - cm * 0.3; }
    B.r[i] = r; B.g[i] = g; B.b[i] = b; B.h[i] = clamp01(hgt); B.ro[i] = ro; B.ao[i] = ao;
  }
  return B.pack(2.2);
}

export function paintTimber(size: number, seed: number, mode: 'beam' | 'planks', base: RGB, accent: RGB): TexSet {
  const rng = new Rng(seed);
  const B = new Buf(size);
  const crackM = new Float32Array(size * size);
  // checks (splits along the grain)
  const checks = mode === 'beam' ? 18 : 10;
  for (let c = 0; c < checks; c++) {
    let x = rng.next() * size; let y = rng.next() * size; const L = rng.range(size * 0.08, size * 0.35);
    for (let s = 0; s < L; s++) {
      const xx = Math.round(x) & (size - 1), yy = Math.round(y) & (size - 1);
      crackM[yy * size + xx] = Math.max(crackM[yy * size + xx], 0.9 * (1 - s / L));
      x += (rng.next() - 0.5) * 0.35; y += 1;
    }
  }
  const plankW = size / 6;
  const knots: Array<[number, number, number]> = [];
  for (let k = 0; k < 3; k++) knots.push([rng.next(), rng.next(), rng.range(0.02, 0.045)]);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const u = x / size, v = y / size;
    // grain along v
    let warp = fbm(u * 3, v * 1.5, 3, 3, 4) * 0.25;
    for (const kn of knots) {
      const dx = (((u - kn[0] + 1.5) % 1) - 0.5), dy = (((v - kn[1] + 1.5) % 1) - 0.5);
      const d = Math.hypot(dx * 0.7, dy * 0.18);
      if (d < kn[2] * 3) warp += Math.sin(d / kn[2] * 3) * 0.05 * (1 - d / (kn[2] * 3)) * 3;
    }
    const gr = fbm(u * 14 + warp * 12, v * 1.2, 14, 4, 2);
    const rings = 0.5 + 0.5 * Math.sin((u * 30 + warp * 40 + gr * 6) * Math.PI);
    const fine = vnoise(u * 160, v * 12, 160, 12, 6);
    let tone = 0.55 + 0.35 * gr + 0.12 * rings + (fine - 0.5) * 0.12;
    let col = mixc(base, accent, clamp01((gr - 0.45) * 1.4));
    let h = 0.55 + 0.3 * rings + 0.15 * fine;
    let ao = 1;
    let r = col[0] * tone, g = col[1] * tone, b = col[2] * tone;
    if (mode === 'planks') {
      const pi = Math.floor(x / plankW);
      const lx = x - pi * plankW;
      const pseed = ((pi * 2654435761) >>> 0) / 4294967296;
      const gap = Math.min(lx, plankW - lx);
      const t = clamp01(gap / 3.2);
      const pt = 0.82 + 0.3 * pseed;
      r *= pt; g *= pt; b *= pt;
      // greyed, weathered face
      const wth = smoothstep(0.55, 0.85, fbm(u * 5, v * 9 + pi, 5, 3, 44));
      r = lerp(r, 110, wth * 0.22); g = lerp(g, 108, wth * 0.22); b = lerp(b, 104, wth * 0.22);
      r *= 0.4 + 0.6 * t; g *= 0.4 + 0.6 * t; b *= 0.4 + 0.6 * t;
      h = h * (0.35 + 0.65 * t);
      ao = 0.45 + 0.55 * t;
      // nails at plank ends
      const ny = (y % (size / 3)) / (size / 3);
      if ((ny < 0.04 || ny > 0.96) && Math.abs(lx - plankW / 2) < 2.2) { r = 35; g = 32; b = 32; h += 0.2; }
    } else {
      // gentle cylinder shading across the beam face
      const edge = Math.min(u, 1 - u) * 2;
      const e = smoothstep(0, 0.35, edge);
      r *= 0.78 + 0.22 * e; g *= 0.78 + 0.22 * e; b *= 0.78 + 0.22 * e;
      ao = 0.8 + 0.2 * e;
    }
    const cm = crackM[i];
    if (cm > 0.05) { const kk = 1 - cm * 0.75; r *= kk; g *= kk; b *= kk; h -= cm * 0.35; ao *= 1 - cm * 0.4; }
    B.r[i] = r; B.g[i] = g; B.b[i] = b; B.h[i] = clamp01(h); B.ro[i] = 0.78 + 0.18 * fine; B.ao[i] = ao;
  }
  return B.pack(1.8);
}

export function paintRoofTiles(size: number, seed: number, palette: RGB[], rows = 10, cols = 9): TexSet {
  const rng = new Rng(seed);
  const B = new Buf(size);
  const th = size / rows, tw = size / cols;
  const tileCol = new Float32Array(rows * cols * 2);
  for (let i = 0; i < rows * cols; i++) { tileCol[i * 2] = rng.next(); tileCol[i * 2 + 1] = rng.next(); }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const u = x / size, v = y / size;
    const row = Math.floor(y / th);
    const xo = x + (row % 2 ? tw * 0.5 : 0);
    const col = Math.floor(xo / tw) % cols;
    const lx = xo % tw, ly = y - row * th;
    const id = tileCol[(row * cols + col) * 2], id2 = tileCol[(row * cols + col) * 2 + 1];
    // scalloped lower edge: tile bottom curves up toward the sides
    const cxn = (lx / tw - 0.5) * 2;
    const scallop = th * 0.16 * cxn * cxn;
    const bottom = th - scallop;
    const along = ly / bottom; // 0 at the top (hidden under previous row) .. 1 at the bottom lip
    const palIdx = Math.floor(id * palette.length * 0.999);
    const c = mixc(palette[palIdx], palette[(palIdx + 1) % palette.length], id2);
    const fn = fbm(u * 10, v * 10, 10, 3, 17);
    const lit = 0.72 + 0.4 * smoothstep(0, 1, along) * (along < 1 ? 1 : 0);
    let k = (0.78 + 0.3 * fn) * lit * (0.9 + 0.2 * id2);
    // shadow cast on the next row below the lip
    let sh = 1;
    if (ly > bottom) sh = 0.28 + 0.72 * clamp01(1 - (ly - bottom) / (th * 0.25));
    const side = Math.min(lx, tw - lx);
    const sideDark = 0.6 + 0.4 * smoothstep(0, 2.6, side);
    k *= sh * sideDark;
    let h = along < 1 ? 0.25 + 0.7 * smoothstep(0, 1, along) : 0.3 * sh;
    h *= 0.6 + 0.4 * sideDark;
    let r = c[0] * k, g = c[1] * k, b = c[2] * k;
    // lichen and the odd missing tile
    const lichen = smoothstep(0.7, 0.9, fbm(u * 7, v * 7, 7, 3, 61));
    r = lerp(r, 92, lichen * 0.35); g = lerp(g, 108, lichen * 0.35); b = lerp(b, 66, lichen * 0.35);
    B.r[i] = r; B.g[i] = g; B.b[i] = b; B.h[i] = clamp01(h);
    B.ro[i] = 0.62 + 0.3 * fn; B.ao[i] = 0.5 + 0.5 * clamp01(along * 1.2) * sh;
  }
  return B.pack(3.2);
}

export function paintCloth(size: number, seed: number): TexSet {
  const B = new Buf(size);
  const period = size / 64;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const u = x / size, v = y / size;
    const wx = 0.5 + 0.5 * Math.sin((x / period) * Math.PI * 2), wy = 0.5 + 0.5 * Math.sin((y / period) * Math.PI * 2);
    const over = ((Math.floor(x / period) + Math.floor(y / period)) & 1) ? wx : wy;
    const f = fbm(u * 6, v * 6, 6, 3, seed);
    const k = 0.76 + 0.2 * over + 0.12 * (f - 0.5);
    const pill = smoothstep(0.7, 0.9, vnoise(u * 90, v * 90, 90, 90, seed + 4));
    const kk = k * (1 - pill * 0.15);
    B.r[i] = 190 * kk; B.g[i] = 190 * kk; B.b[i] = 190 * kk;
    B.h[i] = 0.35 + 0.4 * over; B.ro[i] = 0.92; B.ao[i] = 1;
  }
  return B.pack(1.2);
}

export function paintMetal(size: number, seed: number): TexSet {
  const rng = new Rng(seed);
  const B = new Buf(size);
  const scratch = new Float32Array(size * size);
  for (let s = 0; s < 70; s++) {
    let x = rng.next() * size, y = rng.next() * size; const a = rng.range(-0.4, 0.4) + (rng.bool() ? 0 : Math.PI / 2);
    const L = rng.range(8, 46);
    for (let t = 0; t < L; t++) { const xx = Math.round(x) & (size - 1), yy = Math.round(y) & (size - 1); scratch[yy * size + xx] = 0.6; x += Math.cos(a); y += Math.sin(a); }
  }
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const u = x / size, v = y / size;
    const n = fbm(u * 5, v * 5, 5, 4, 2);
    const fine = vnoise(u * 120, v * 120, 120, 120, 5);
    const rust = smoothstep(0.58, 0.8, fbm(u * 4, v * 4, 4, 4, 9));
    const dimple = worley(u * 12, v * 12, 12, 33, 0.9);
    const dm = smoothstep(0.38, 0.1, dimple.f1);
    let r = 44 + 22 * n + 14 * (fine - 0.5), g = 47 + 22 * n + 14 * (fine - 0.5), b = 56 + 24 * n + 14 * (fine - 0.5);
    r = lerp(r, 128, rust * 0.55); g = lerp(g, 70, rust * 0.55); b = lerp(b, 40, rust * 0.55);
    const sc = scratch[i];
    r += sc * 60; g += sc * 62; b += sc * 66;
    B.r[i] = r * (0.9 + 0.2 * dm); B.g[i] = g * (0.9 + 0.2 * dm); B.b[i] = b * (0.9 + 0.2 * dm);
    B.h[i] = 0.5 + 0.2 * dm + 0.08 * fine - sc * 0.1;
    B.ro[i] = 0.36 + 0.4 * rust + 0.1 * fine - sc * 0.15; B.ao[i] = 1 - rust * 0.25;
  }
  return B.pack(1.5);
}

/** Irregular wet cobblestones with polish, grime in the joints, per-stone tilt and tone. 4m x 4m tile. */
export function paintCobble(size: number, seed: number): TexSet {
  const rng = new Rng(seed);
  const B = new Buf(size);
  const rows = 14;
  const rh: number[] = []; let tot = 0;
  for (let r = 0; r < rows; r++) { const v = 1 + (rng.next() - 0.5) * 0.42; rh.push(v); tot += v; }
  const rowY0: number[] = []; let acc = 0;
  for (let r = 0; r < rows; r++) { rowY0.push(acc); acc += (rh[r] / tot) * size; }
  rowY0.push(size);
  const rowOfY = new Int16Array(size);
  for (let r = 0; r < rows; r++) for (let y = Math.round(rowY0[r]); y < Math.round(rowY0[r + 1]) && y < size; y++) rowOfY[y] = r;
  const lu = new Float32Array(rows * size), bw = new Float32Array(rows * size), bid = new Float32Array(rows * size);
  for (let r = 0; r < rows; r++) {
    const n = 14 + (r % 3); let sum = 0; const ws: number[] = [];
    for (let i = 0; i < n; i++) { const w = 1 + (rng.next() - 0.5) * 1.0; ws.push(w); sum += w; }
    let x = rng.next() * size; const starts: number[] = [], widths: number[] = [];
    for (let i = 0; i < n; i++) { const w = (ws[i] / sum) * size; starts.push(x); widths.push(w); x += w; }
    for (let i = 0; i < n; i++) {
      const id = rng.next();
      for (let px = 0; px < Math.ceil(widths[i]); px++) {
        if (px >= widths[i]) break;
        const wx = (((Math.floor(starts[i] + px)) % size) + size) % size;
        lu[r * size + wx] = px; bw[r * size + wx] = widths[i]; bid[r * size + wx] = id;
      }
    }
  }
  const pal: RGB[] = [[96, 100, 112], [84, 88, 102], [112, 108, 110], [128, 118, 108], [70, 76, 92], [104, 104, 100], [88, 84, 90], [120, 112, 118]];
  const gapPx = size * 0.0085;
  const bev = size * 0.012;
  const crackM = new Float32Array(size * size);
  randomWalkCracks(crackM, size, rng.fork('c'), 22, size * 0.07, 0.9);
  for (let y = 0; y < size; y++) {
    const r = rowOfY[y];
    const lv = y - rowY0[r], bh = rowY0[r + 1] - rowY0[r];
    for (let x = 0; x < size; x++) {
      const i = y * size + x;
      const luv = lu[r * size + x], bwv = bw[r * size + x], id = bid[r * size + x];
      // rounded-rect signed distance
      const hx = bwv / 2, hy = bh / 2, rad = Math.min(hx, hy) * 0.5;
      const qx = Math.abs(luv - hx) - (hx - rad), qy = Math.abs(lv - hy) - (hy - rad);
      const d = Math.hypot(Math.max(qx, 0), Math.max(qy, 0)) + Math.min(Math.max(qx, qy), 0) - rad; // negative inside
      const dIn = -d;
      const u = x / size, v = y / size;
      const nf = fbm(u * 14, v * 14, 14, 4, 5);
      const fine = vnoise(u * 200, v * 200, 200, 200, 8);
      if (dIn < gapPx) {
        // joint: dirt, dark, a little moss
        const m = 0.55 + 0.6 * vnoise(u * 90, v * 90, 90, 90, 12);
        const moss = smoothstep(0.62, 0.8, fbm(u * 6, v * 6, 6, 3, 71));
        B.r[i] = lerp(34 * m, 50, moss * 0.6); B.g[i] = lerp(31 * m, 62, moss * 0.6); B.b[i] = lerp(34 * m, 36, moss * 0.6);
        B.h[i] = 0.04 + 0.04 * fine; B.ro[i] = 0.95; B.ao[i] = 0.45;
      } else {
        const t = clamp01((dIn - gapPx) / bev);
        const hb = t * t * (3 - 2 * t);
        const cu = luv / bwv - 0.5, cv = lv / bh - 0.5;
        const dome = 1 - (cu * cu + cv * cv) * 1.2;
        const ts = id * 12.9898;
        const tx = (Math.sin(ts) * 0.5) * 0.16, ty = (Math.cos(ts * 1.7) * 0.5) * 0.16; // per-stone tilt
        const h = 0.22 + 0.5 * hb * (0.8 + 0.2 * dome) + tx * cu + ty * cv + 0.08 * (nf - 0.5) + 0.035 * (fine - 0.5);
        const c1 = pal[Math.floor(id * pal.length * 0.999)], c2 = pal[Math.floor(((id * 7.31) % 1) * pal.length * 0.999)];
        const cc = mixc(c1, c2, (id * 13.7) % 1);
        const k = (0.72 + 0.4 * nf + 0.14 * (fine - 0.5)) * (0.6 + 0.4 * hb) * (0.9 + (id - 0.5) * 0.3);
        B.r[i] = cc[0] * k; B.g[i] = cc[1] * k; B.b[i] = cc[2] * k;
        // polished centers, rough rims
        B.ro[i] = 0.42 + 0.4 * (1 - smoothstep(0, 0.5, dome - 0.55)) + 0.25 * (1 - hb) + 0.22 * ((id * 3.7) % 1);
        B.ao[i] = 0.55 + 0.45 * hb;
        B.h[i] = clamp01(h);
        const cm = crackM[i];
        if (cm > 0.05) { const kk = 1 - cm * 0.6; B.r[i] *= kk; B.g[i] *= kk; B.b[i] *= kk; B.h[i] -= cm * 0.15; }
      }
    }
  }
  // painter bevel pass
  const n = size * size, m = size - 1;
  const tr = new Float32Array(n), tg = new Float32Array(n), tb = new Float32Array(n);
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const i = y * size + x;
    const sh = B.h[((y + 1) & m) * size + ((x - 1) & m)] - B.h[((y - 1) & m) * size + ((x + 1) & m)];
    const k = 1 + sh * 0.9;
    tr[i] = B.r[i] * k; tg[i] = B.g[i] * k; tb[i] = B.b[i] * k;
  }
  B.r.set(tr); B.g.set(tg); B.b.set(tb);
  return B.pack(3.4);
}
