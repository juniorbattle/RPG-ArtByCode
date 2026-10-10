/** Deterministic integer-grid rasteriser for procedural pixel art. No canvas anti-aliasing involved,
 *  so sprites are identical on every machine and stay pixel-sharp. */

export type RGB = [number, number, number];
const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
export const mixRGB = (a: RGB, b: RGB, t: number): RGB => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
export const hsl = (h: number, s: number, l: number): RGB => {
  h = ((h % 360) + 360) % 360; s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12, a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return [clamp(f(0) * 255), clamp(f(8) * 255), clamp(f(4) * 255)];
};

/** 5-tone hue-shifted ramp: cool saturated shadows, warm highlights (the classic pixel-art rule). */
export function skinRamp(c: RGB): RGB[] {
  const m = (k: [number, number, number], add = 0): RGB => [clamp(c[0] * k[0] + add), clamp(c[1] * k[1] + add), clamp(c[2] * k[2] + add)];
  return [m([0.5, 0.36, 0.42]), m([0.8, 0.64, 0.64]), c, m([1.04, 1.01, 0.98], 3), m([1.08, 1.04, 1.0], 6)];
}

export function ramp(c: RGB): RGB[] {
  const lum = (c[0] * 0.3 + c[1] * 0.59 + c[2] * 0.11) / 255;
  const cool: RGB = [26, 28, 66];
  const d2 = mixRGB([c[0] * 0.36, c[1] * 0.36, c[2] * 0.36], cool, 0.3);
  const d1 = mixRGB([c[0] * 0.64, c[1] * 0.62, c[2] * 0.68], cool, 0.1);
  const l1: RGB = [c[0] * 1.2 + 16 * (1 - lum), c[1] * 1.14 + 10 * (1 - lum), c[2] * 1.02];
  const l2: RGB = [c[0] * 1.45 + 44, c[1] * 1.34 + 34, c[2] * 1.15 + 16];
  return [d2, d1, c, l1, l2].map((q) => [clamp(q[0]), clamp(q[1]), clamp(q[2])] as RGB);
}

export class Layer {
  m: Uint8Array;
  constructor(readonly w: number, readonly h: number) { this.m = new Uint8Array(w * h); }
  clear(): this { this.m.fill(0); return this; }
  set(x: number, y: number, v = 1): void { if (x >= 0 && y >= 0 && x < this.w && y < this.h) this.m[y * this.w + x] = v; }
  get(x: number, y: number): number { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.m[y * this.w + x]; }
  rect(x: number, y: number, w: number, h: number): this { for (let j = Math.round(y); j < Math.round(y + h); j++) for (let i = Math.round(x); i < Math.round(x + w); i++) this.set(i, j); return this; }
  ellipse(cx: number, cy: number, rx: number, ry: number): this {
    for (let j = Math.floor(cy - ry); j <= Math.ceil(cy + ry); j++) for (let i = Math.floor(cx - rx); i <= Math.ceil(cx + rx); i++) {
      const dx = (i + 0.5 - cx) / rx, dy = (j + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) this.set(i, j);
    }
    return this;
  }
  poly(pts: Array<[number, number]>): this {
    let minY = 1e9, maxY = -1e9;
    for (const p of pts) { minY = Math.min(minY, p[1]); maxY = Math.max(maxY, p[1]); }
    for (let j = Math.floor(minY); j <= Math.ceil(maxY); j++) {
      const y = j + 0.5, xs: number[] = [];
      for (let i = 0; i < pts.length; i++) {
        const a = pts[i], b = pts[(i + 1) % pts.length];
        if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) xs.push(a[0] + ((y - a[1]) / (b[1] - a[1])) * (b[0] - a[0]));
      }
      xs.sort((p, q) => p - q);
      for (let k = 0; k + 1 < xs.length; k += 2) for (let i = Math.round(xs[k]); i < Math.round(xs[k + 1]); i++) this.set(i, j);
    }
    return this;
  }
  line(x0: number, y0: number, x1: number, y1: number, th = 1): this {
    const dx = x1 - x0, dy = y1 - y0, l2 = dx * dx + dy * dy || 1;
    const r = th / 2;
    for (let j = Math.floor(Math.min(y0, y1) - r - 1); j <= Math.ceil(Math.max(y0, y1) + r + 1); j++) for (let i = Math.floor(Math.min(x0, x1) - r - 1); i <= Math.ceil(Math.max(x0, x1) + r + 1); i++) {
      const t = Math.max(0, Math.min(1, ((i + 0.5 - x0) * dx + (j + 0.5 - y0) * dy) / l2));
      const px = x0 + dx * t, py = y0 + dy * t;
      if (Math.hypot(i + 0.5 - px, j + 0.5 - py) <= r) this.set(i, j);
    }
    return this;
  }
  cut(fn: (x: number, y: number) => boolean): this { for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) if (this.m[j * this.w + i] && fn(i, j)) this.m[j * this.w + i] = 0; return this; }
  bounds(): [number, number, number, number] | null {
    let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) if (this.m[j * this.w + i]) { x0 = Math.min(x0, i); y0 = Math.min(y0, j); x1 = Math.max(x1, i); y1 = Math.max(y1, j); }
    return x1 < 0 ? null : [x0, y0, x1, y1];
  }
}

export type ShadeMode = 'edge' | 'sphere' | 'flat' | 'cloth' | 'vertical' | 'two';

export class Sprite {
  rgba: Uint8ClampedArray;
  emis: Uint8ClampedArray;
  part: Int16Array;
  private tmp: Layer;
  constructor(readonly w: number, readonly h: number) {
    this.rgba = new Uint8ClampedArray(w * h * 4);
    this.emis = new Uint8ClampedArray(w * h);
    this.part = new Int16Array(w * h).fill(-1);
    this.tmp = new Layer(w, h);
  }
  layer(): Layer { return this.tmp.clear(); }
  px(x: number, y: number, c: RGB, a = 255): void {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    const k = (y * this.w + x) * 4;
    this.rgba[k] = c[0]; this.rgba[k + 1] = c[1]; this.rgba[k + 2] = c[2]; this.rgba[k + 3] = a;
  }
  getA(x: number, y: number): number { return x < 0 || y < 0 || x >= this.w || y >= this.h ? 0 : this.rgba[(y * this.w + x) * 4 + 3]; }
  rect(x: number, y: number, w: number, h: number, c: RGB, em = 0): void { for (let j = Math.round(y); j < Math.round(y + h); j++) for (let i = Math.round(x); i < Math.round(x + w); i++) { this.px(i, j, c); if (em) this.emis[j * this.w + i] = em; } }

  /** Composite a mask with a 5-tone ramp using the selected shading model. */
  commit(L: Layer, colors: RGB[], mode: ShadeMode = 'edge', o: { light?: [number, number]; cx?: number; cy?: number; rx?: number; ry?: number; bands?: number; id?: number; em?: number; noShadeThin?: boolean } = {}): void {
    const b = L.bounds();
    if (!b) return;
    const [x0, y0, x1, y1] = b;
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    const thin = bw < 4 || bh < 4;
    const cx = o.cx ?? (x0 + x1 + 1) / 2, cy = o.cy ?? (y0 + y1 + 1) / 2, rx = o.rx ?? bw / 2, ry = o.ry ?? bh / 2;
    const lx = o.light?.[0] ?? -0.55, ly = o.light?.[1] ?? -0.65;
    for (let j = y0; j <= y1; j++) for (let i = x0; i <= x1; i++) {
      if (!L.get(i, j)) continue;
      let tone = 2;
      if (mode === 'flat' || (thin && mode !== 'sphere' && !o.noShadeThin)) tone = 2;
      else if (mode === 'edge' || mode === 'cloth') {
        const up = !L.get(i, j - 1), left = !L.get(i - 1, j), down = !L.get(i, j + 1), right = !L.get(i + 1, j);
        const upl = !L.get(i - 1, j - 1);
        if (down || right) tone = down && right ? 0 : 1;
        else if (up || left || upl) tone = up && left ? 4 : 3;
        // second inner shadow row on the lower-right for volume
        else if (!L.get(i + 1, j + 1) || !L.get(i, j + 2) && bh > 6) tone = 1;
        if (mode === 'cloth' && tone === 2) { const fold = ((i * 7 + (o.id ?? 0) * 3) % 5 === 0 && j > y0 + 2) ? 1 : 2; tone = fold; }
      } else if (mode === 'sphere') {
        const nx = (i + 0.5 - cx) / rx, ny = (j + 0.5 - cy) / ry;
        const r2 = nx * nx + ny * ny;
        const nz = Math.sqrt(Math.max(0, 1 - Math.min(1, r2)));
        const d = nx * lx + ny * ly + nz * 0.55;
        tone = d > 0.72 ? 4 : d > 0.38 ? 3 : d > 0.0 ? 2 : d > -0.4 ? 1 : 0;
        if (o.bands === 3) tone = d > 0.45 ? 3 : d > -0.1 ? 2 : 1;
      } else if (mode === 'vertical') {
        const t = (j - y0) / Math.max(1, bh - 1);
        tone = t < 0.18 ? 3 : t < 0.62 ? 2 : t < 0.85 ? 1 : 0;
      } else if (mode === 'two') {
        tone = (!L.get(i, j + 1) || !L.get(i + 1, j)) ? 1 : 2;
      }
      const c = colors[Math.max(0, Math.min(colors.length - 1, tone))];
      this.px(i, j, c);
      this.part[j * this.w + i] = o.id ?? 0;
      if (o.em) this.emis[j * this.w + i] = o.em; else this.emis[j * this.w + i] = 0;
    }
  }

  /** 1px selective outline: colour derived from the neighbouring fill so it feels painted, not stroked. */
  outline(strength = 0.42, tint: RGB = [18, 16, 38]): void {
    const out: Array<[number, number, RGB]> = [];
    for (let j = 0; j < this.h; j++) for (let i = 0; i < this.w; i++) {
      if (this.getA(i, j) > 0) continue;
      let best: RGB | null = null, lum = 1e9;
      for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]] as const) {
        if (this.getA(i + dx, j + dy) > 0) {
          const k = ((j + dy) * this.w + (i + dx)) * 4;
          const l = this.rgba[k] + this.rgba[k + 1] + this.rgba[k + 2];
          if (l < lum) { lum = l; best = [this.rgba[k], this.rgba[k + 1], this.rgba[k + 2]]; }
        }
      }
      if (best) {
        const dark: RGB = [best[0] * strength, best[1] * strength, best[2] * strength];
        out.push([i, j, mixRGB(dark, tint, 0.45)]);
      }
    }
    for (const [i, j, c] of out) this.px(i, j, [clamp(c[0]), clamp(c[1]), clamp(c[2])]);
  }
}
