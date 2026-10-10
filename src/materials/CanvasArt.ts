import { Rng } from '../core/rng';

/** Canvas2D painters for everything that is easier to draw than to simulate: windows, shop interiors,
 *  heraldry, decals, leaves, halos, smoke. All are deterministic (seeded) and generated at boot. */

export function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d', { willReadFrequently: false })!;
  return [c, ctx];
}

const rgba = (r: number, g: number, b: number, a = 1) => `rgba(${r | 0},${g | 0},${b | 0},${a})`;

/* ------------------------------------------------------------------ glow sprites */
export function makeHalo(size = 128): HTMLCanvasElement {
  const [c, x] = makeCanvas(size, size);
  const img = x.createImageData(size, size);
  for (let j = 0; j < size; j++) for (let i = 0; i < size; i++) {
    const dx = (i + 0.5) / size * 2 - 1, dy = (j + 0.5) / size * 2 - 1;
    const d = Math.hypot(dx, dy);
    const core = Math.exp(-d * d * 22);
    const body = Math.exp(-d * d * 4.2) * 0.55;
    const tail = Math.max(0, 1 - d) ** 3 * 0.35;
    const a = Math.min(1, core + body + tail) * (d < 1 ? 1 : 0);
    const k = (j * size + i) * 4;
    img.data[k] = 255; img.data[k + 1] = 255; img.data[k + 2] = 255; img.data[k + 3] = a * 255;
  }
  x.putImageData(img, 0, 0);
  return c;
}

export function makeSmokePuff(size = 128, seed = 3): HTMLCanvasElement {
  const [c, x] = makeCanvas(size, size);
  const rng = new Rng(seed);
  x.clearRect(0, 0, size, size);
  for (let i = 0; i < 26; i++) {
    const a = rng.range(0, Math.PI * 2), r = rng.range(0, size * 0.22);
    const cx = size / 2 + Math.cos(a) * r, cy = size / 2 + Math.sin(a) * r;
    const rad = rng.range(size * 0.1, size * 0.24);
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, rad);
    g.addColorStop(0, 'rgba(255,255,255,0.28)'); g.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, rad, 0, Math.PI * 2); x.fill();
  }
  // soft circular mask so the quad edge never shows
  const m = x.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size * 0.5);
  m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)');
  x.globalCompositeOperation = 'destination-in'; x.fillStyle = m; x.fillRect(0, 0, size, size);
  x.globalCompositeOperation = 'source-over';
  return c;
}

export function makeSoftDot(size = 32): HTMLCanvasElement {
  const [c, x] = makeCanvas(size, size);
  const g = x.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.35, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = g; x.fillRect(0, 0, size, size);
  return c;
}

/* ------------------------------------------------------------------ foliage */
function leafPath(x: CanvasRenderingContext2D, s: number): void {
  x.beginPath();
  x.moveTo(0, -s);
  x.bezierCurveTo(s * 0.9, -s * 0.55, s * 0.95, s * 0.35, 0, s);
  x.bezierCurveTo(-s * 0.95, s * 0.35, -s * 0.9, -s * 0.55, 0, -s);
  x.closePath();
}

/** 4x4 atlas of single ivy-ish leaves (alpha = cutout). */
export function makeLeafAtlas(seed = 5): HTMLCanvasElement {
  const N = 4, cell = 64;
  const [c, x] = makeCanvas(N * cell, N * cell);
  const rng = new Rng(seed);
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    x.save();
    x.translate(i * cell + cell / 2, j * cell + cell / 2);
    x.rotate(rng.range(-0.5, 0.5));
    const s = cell * rng.range(0.34, 0.44);
    const hue = rng.range(88, 128), sat = rng.range(32, 52), lit = rng.range(22, 36);
    x.scale(rng.range(0.7, 0.95), 1);
    leafPath(x, s);
    const g = x.createLinearGradient(-s, -s, s, s);
    g.addColorStop(0, `hsl(${hue + 6},${sat + 8}%,${lit + 14}%)`); g.addColorStop(1, `hsl(${hue - 8},${sat}%,${lit - 6}%)`);
    x.fillStyle = g; x.fill();
    x.strokeStyle = `hsla(${hue},${sat - 8}%,${lit + 26}%,0.55)`; x.lineWidth = 1.2;
    x.beginPath(); x.moveTo(0, -s * 0.9); x.lineTo(0, s * 0.9); x.stroke();
    for (let v = -1; v <= 1; v += 1) { if (!v) continue; x.beginPath(); x.moveTo(0, v * s * 0.2); x.lineTo(s * 0.5, v * s * 0.2 - s * 0.35); x.moveTo(0, v * s * 0.2); x.lineTo(-s * 0.5, v * s * 0.2 - s * 0.35); x.stroke(); }
    x.restore();
  }
  return c;
}

/** One alpha-cut leafy cluster for crossed-plane bushes and trees. */
export function makeBushCard(seed = 8, size = 256): HTMLCanvasElement {
  const [c, x] = makeCanvas(size, size);
  const rng = new Rng(seed);
  const leaves: Array<[number, number, number, number, number]> = [];
  for (let i = 0; i < 150; i++) {
    const a = rng.range(0, Math.PI * 2), r = Math.sqrt(rng.next()) * size * 0.42;
    const px = size / 2 + Math.cos(a) * r * 1.05, py = size * 0.52 + Math.sin(a) * r * 0.82;
    leaves.push([px, py, rng.range(0, Math.PI * 2), size * rng.range(0.05, 0.085), py]);
  }
  leaves.sort((a, b) => a[4] - b[4]);
  for (const [px, py, rot, s] of leaves) {
    x.save(); x.translate(px, py); x.rotate(rot);
    leafPath(x, s);
    const lit = 20 + 22 * (1 - py / size) + rng.range(-4, 6);
    x.fillStyle = `hsl(${rng.range(92, 132)},${rng.range(30, 50)}%,${lit}%)`; x.fill();
    x.strokeStyle = 'rgba(8,16,8,0.45)'; x.lineWidth = 1; x.stroke();
    x.restore();
  }
  return c;
}

/* ------------------------------------------------------------------ windows */
export const WINDOW_CELLS = { warm: 0, dim: 1, hot: 2, dark: 3, arch: 4, curtain: 5, candle: 6, shutter: 7 } as const;
export type WindowKind = keyof typeof WINDOW_CELLS;

/** 4x2 atlas, 128x192 per cell, emissive glass with painted interiors and lead bars. */
export function makeWindowAtlas(seed = 21): HTMLCanvasElement {
  const cw = 128, ch = 192;
  const [c, x] = makeCanvas(cw * 4, ch * 2);
  const rng = new Rng(seed);
  const cell = (idx: number, paint: (w: number, h: number) => void) => {
    x.save(); x.translate((idx % 4) * cw, Math.floor(idx / 4) * ch); x.beginPath(); x.rect(0, 0, cw, ch); x.clip(); paint(cw, ch); x.restore();
  };
  const glow = (cxn: number, cyn: number, inner: string, outer: string, w: number, h: number) => {
    const g = x.createRadialGradient(w * cxn, h * cyn, 2, w * cxn, h * cyn, h * 0.8);
    g.addColorStop(0, inner); g.addColorStop(1, outer); x.fillStyle = g; x.fillRect(0, 0, w, h);
  };
  const bars = (w: number, h: number, cols: number, rows: number, th = 5, col = 'rgba(28,16,10,0.95)') => {
    x.fillStyle = col;
    for (let i = 1; i < cols; i++) x.fillRect((w * i) / cols - th / 2, 0, th, h);
    for (let j = 1; j < rows; j++) x.fillRect(0, (h * j) / rows - th / 2, w, th);
  };
  const paneVar = (w: number, h: number, cols: number, rows: number, amt: number) => {
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const v = rng.range(-amt, amt);
      x.fillStyle = v > 0 ? `rgba(255,240,200,${v})` : `rgba(40,12,0,${-v})`;
      x.fillRect((w * i) / cols, (h * j) / rows, w / cols, h / rows);
    }
  };
  const silhouette = (w: number, h: number) => {
    x.fillStyle = 'rgba(40,18,8,0.8)';
    const px = w * rng.range(0.28, 0.7);
    x.beginPath(); x.arc(px, h * 0.52, 8, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.ellipse(px, h * 0.75, 18, 24, 0, Math.PI, 0); x.fill();
    x.fillRect(px - 18, h * 0.75, 36, h);
  };
  const frameShade = (w: number, h: number) => {
    const g = x.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(10,4,0,0.55)'); g.addColorStop(0.18, 'rgba(10,4,0,0)'); g.addColorStop(1, 'rgba(10,4,0,0.15)');
    x.fillStyle = g; x.fillRect(0, 0, w, h);
    const gx = x.createLinearGradient(0, 0, w, 0);
    gx.addColorStop(0, 'rgba(10,4,0,0.35)'); gx.addColorStop(0.14, 'rgba(10,4,0,0)'); gx.addColorStop(0.86, 'rgba(10,4,0,0)'); gx.addColorStop(1, 'rgba(10,4,0,0.35)');
    x.fillStyle = gx; x.fillRect(0, 0, w, h);
  };

  cell(WINDOW_CELLS.warm, (w, h) => {
    x.fillStyle = '#7a3a10'; x.fillRect(0, 0, w, h);
    glow(0.5, 0.55, '#ffd890', '#c8631a', w, h); paneVar(w, h, 2, 3, 0.16); silhouette(w, h); bars(w, h, 2, 3); frameShade(w, h);
  });
  cell(WINDOW_CELLS.dim, (w, h) => {
    x.fillStyle = '#4a200a'; x.fillRect(0, 0, w, h);
    glow(0.4, 0.7, '#e8a050', '#6a2c0c', w, h); paneVar(w, h, 2, 3, 0.2); bars(w, h, 2, 3); frameShade(w, h);
    x.fillStyle = 'rgba(20,10,4,0.7)'; x.fillRect(w * 0.62, 0, w * 0.4, h);
  });
  cell(WINDOW_CELLS.hot, (w, h) => {
    x.fillStyle = '#8a2a08'; x.fillRect(0, 0, w, h);
    glow(0.5, 0.5, '#ffc070', '#d4420c', w, h); paneVar(w, h, 2, 3, 0.12); bars(w, h, 2, 3); frameShade(w, h);
  });
  cell(WINDOW_CELLS.dark, (w, h) => {
    const g = x.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, '#16233a'); g.addColorStop(0.5, '#0c1424'); g.addColorStop(1, '#101b2e'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(120,160,220,0.14)';
    x.beginPath(); x.moveTo(0, h * 0.2); x.lineTo(w * 0.5, 0); x.lineTo(w * 0.75, 0); x.lineTo(0, h * 0.5); x.fill();
    bars(w, h, 2, 3, 5, 'rgba(6,8,12,0.95)');
  });
  cell(WINDOW_CELLS.arch, (w, h) => {
    x.fillStyle = '#0a0604'; x.fillRect(0, 0, w, h);
    x.save(); x.beginPath(); x.moveTo(6, h); x.lineTo(6, h * 0.32); x.arc(w / 2, h * 0.32, w / 2 - 6, Math.PI, 0); x.lineTo(w - 6, h); x.closePath(); x.clip();
    x.fillStyle = '#7a3a10'; x.fillRect(0, 0, w, h);
    glow(0.5, 0.5, '#ffe0a0', '#c0601a', w, h);
    x.strokeStyle = 'rgba(30,16,8,0.9)'; x.lineWidth = 3;
    for (let k = -8; k <= 8; k++) { x.beginPath(); x.moveTo(w / 2 + k * 22, 0); x.lineTo(w / 2 + k * 22 - h * 0.6, h); x.stroke(); x.beginPath(); x.moveTo(w / 2 - k * 22, 0); x.lineTo(w / 2 - k * 22 + h * 0.6, h); x.stroke(); }
    frameShade(w, h); x.restore();
  });
  cell(WINDOW_CELLS.curtain, (w, h) => {
    x.fillStyle = '#6a3014'; x.fillRect(0, 0, w, h);
    glow(0.5, 0.45, '#f6c27a', '#a8501a', w, h);
    for (let i = 0; i < 9; i++) { x.fillStyle = `rgba(60,24,6,${0.06 + (i % 2) * 0.06})`; x.fillRect((w * i) / 9, 0, w / 9, h); }
    bars(w, h, 2, 3, 5); frameShade(w, h);
  });
  cell(WINDOW_CELLS.candle, (w, h) => {
    x.fillStyle = '#1a0c06'; x.fillRect(0, 0, w, h);
    glow(0.35, 0.78, '#ffb860', '#1a0c06', w, h);
    x.fillStyle = '#fff2c0'; x.beginPath(); x.ellipse(w * 0.35, h * 0.74, 4, 8, 0, 0, Math.PI * 2); x.fill();
    bars(w, h, 2, 3, 5); frameShade(w, h);
  });
  cell(WINDOW_CELLS.shutter, (w, h) => {
    x.fillStyle = '#0c0806'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#d98438'; x.fillRect(w * 0.42, 0, w * 0.16, h);
    const g = x.createLinearGradient(w * 0.38, 0, w * 0.62, 0); g.addColorStop(0, 'rgba(0,0,0,0.5)'); g.addColorStop(0.5, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)');
    x.fillStyle = g; x.fillRect(w * 0.38, 0, w * 0.24, h);
  });
  return c;
}

export const SHOP_CELLS = { smith: 0, apothecary: 1, cloth: 2, tavern: 3 } as const;
export type ShopKind = keyof typeof SHOP_CELLS;

/** 2x2 atlas of glowing shop interiors, 256x160 per cell. */
export function makeShopAtlas(seed = 33): HTMLCanvasElement {
  const cw = 256, ch = 160;
  const [c, x] = makeCanvas(cw * 2, ch * 2);
  const rng = new Rng(seed);
  const cell = (idx: number, paint: (w: number, h: number) => void) => {
    x.save(); x.translate((idx % 2) * cw, Math.floor(idx / 2) * ch); x.beginPath(); x.rect(0, 0, cw, ch); x.clip(); paint(cw, ch); x.restore();
  };
  const bg = (w: number, h: number, a: string, b: string) => {
    const g = x.createRadialGradient(w * 0.5, h * 0.55, 8, w * 0.5, h * 0.55, w * 0.75); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, w, h);
  };
  const vignette = (w: number, h: number) => {
    const g = x.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(8,3,0,0.7)'); x.fillStyle = g; x.fillRect(0, 0, w, h);
  };
  const shelf = (w: number, y: number) => { x.fillStyle = 'rgba(32,16,6,0.95)'; x.fillRect(0, y, w, 5); x.fillStyle = 'rgba(255,200,120,0.25)'; x.fillRect(0, y, w, 1); };
  cell(SHOP_CELLS.smith, (w, h) => {
    bg(w, h, '#ffb050', '#7a2308'); vignette(w, h);
    x.fillStyle = 'rgba(24,10,4,0.92)';
    for (let i = 0; i < 6; i++) { x.save(); x.translate(26 + i * 38, 22); x.rotate(rng.range(-0.3, 0.3)); x.fillRect(-2, 0, 4, 40); x.fillRect(-9, -4, 18, 9); x.restore(); }
    x.fillRect(w * 0.1, h * 0.7, w * 0.3, 10); x.fillRect(w * 0.15, h * 0.62, w * 0.18, 10);
    const g = x.createLinearGradient(0, h * 0.8, 0, h); g.addColorStop(0, 'rgba(255,90,20,0)'); g.addColorStop(1, 'rgba(255,120,40,0.9)'); x.fillStyle = g; x.fillRect(0, h * 0.8, w, h * 0.2);
  });
  cell(SHOP_CELLS.apothecary, (w, h) => {
    bg(w, h, '#e8d890', '#4a5a20'); vignette(w, h);
    for (let r = 0; r < 3; r++) {
      const y = 40 + r * 40; shelf(w, y + 26);
      for (let i = 0; i < 9; i++) {
        const jx = 12 + i * 27 + rng.range(-3, 3), jh = rng.range(14, 26);
        const hue = rng.pick([80, 28, 140, 10, 50]);
        x.fillStyle = `hsl(${hue},55%,${rng.range(30, 52)}%)`; x.beginPath(); x.roundRect(jx, y + 26 - jh, 15, jh, 3); x.fill();
        x.fillStyle = 'rgba(255,255,220,0.5)'; x.fillRect(jx + 2, y + 26 - jh + 2, 3, jh - 6);
        x.fillStyle = 'rgba(30,16,6,0.9)'; x.fillRect(jx + 3, y + 26 - jh - 4, 9, 4);
      }
    }
    x.strokeStyle = 'rgba(40,60,20,0.85)'; x.lineWidth = 2;
    for (let i = 0; i < 6; i++) { const hx = 20 + i * 44; x.beginPath(); x.moveTo(hx, 0); x.lineTo(hx + rng.range(-3, 3), 18); x.stroke(); x.fillStyle = 'rgba(70,90,30,0.9)'; x.beginPath(); x.ellipse(hx, 24, 4, 9, 0, 0, Math.PI * 2); x.fill(); }
  });
  cell(SHOP_CELLS.cloth, (w, h) => {
    bg(w, h, '#f0c880', '#6a2c3a'); vignette(w, h);
    for (let r = 0; r < 3; r++) {
      const y = 36 + r * 42; shelf(w, y + 28);
      for (let i = 0; i < 8; i++) {
        const jx = 10 + i * 30 + rng.range(-2, 2);
        x.fillStyle = `hsl(${rng.pick([350, 210, 40, 160, 280, 20])},${rng.range(35, 55)}%,${rng.range(30, 46)}%)`;
        x.beginPath(); x.roundRect(jx, y + 4, 22, 24, 5); x.fill();
        x.fillStyle = 'rgba(255,230,190,0.28)'; x.fillRect(jx + 3, y + 6, 4, 20);
      }
    }
    x.fillStyle = 'rgba(30,14,10,0.85)'; x.beginPath(); x.ellipse(w * 0.84, h * 0.64, 10, 28, 0, 0, Math.PI * 2); x.fill(); x.fillRect(w * 0.84 - 2, h * 0.7, 4, 50);
  });
  cell(SHOP_CELLS.tavern, (w, h) => {
    bg(w, h, '#ffd078', '#8a3a0c'); vignette(w, h);
    x.fillStyle = 'rgba(30,14,6,0.9)';
    for (let i = 0; i < 4; i++) { x.beginPath(); x.ellipse(36 + i * 62, h - 24, 22, 28, 0, 0, Math.PI * 2); x.fill(); }
    x.fillStyle = 'rgba(255,230,160,0.9)';
    for (let i = 0; i < 3; i++) { x.beginPath(); x.arc(52 + i * 76, 34, 9, 0, Math.PI * 2); x.fill(); x.fillStyle = 'rgba(30,14,6,0.9)'; x.fillRect(52 + i * 76 - 1, 0, 2, 26); x.fillStyle = 'rgba(255,230,160,0.9)'; }
    for (let i = 0; i < 7; i++) { x.fillStyle = 'rgba(40,20,8,0.9)'; x.fillRect(14 + i * 34, 64, 12, 14); x.fillStyle = 'rgba(255,240,200,0.5)'; x.fillRect(14 + i * 34, 64, 12, 3); }
  });
  return c;
}

/* ------------------------------------------------------------------ heraldry */
export const EMBLEM_CELLS = { scales: 0, hammers: 1, fleur: 2, key: 3, mortar: 4, scissors: 5, tankard: 6, anvil: 7 } as const;
export type EmblemKind = keyof typeof EMBLEM_CELLS;
export const EMBLEM_FIELD: Record<EmblemKind, [string, string]> = {
  scales: ['#1e3a7a', '#0e2150'], hammers: ['#9a2a24', '#5c1412'], fleur: ['#1c3f86', '#0c2154'], key: ['#1c6a62', '#0b3a38'],
  mortar: ['#3a7a34', '#1c4a1c'], scissors: ['#6a2f6a', '#3a1640'], tankard: ['#8a5a22', '#4a2a0c'], anvil: ['#34343c', '#16161c'],
};

/** 4x2 atlas of vertical banner/sign textures (192x256 each). */
export function makeEmblemAtlas(): HTMLCanvasElement {
  const cw = 192, ch = 256;
  const [c, x] = makeCanvas(cw * 4, ch * 2);
  const gold = '#e4b84e', goldD = '#8a6420', cream = '#ece4cc';
  const draw = (kind: EmblemKind, idx: number) => {
    x.save(); x.translate((idx % 4) * cw, Math.floor(idx / 4) * ch);
    const [a, b] = EMBLEM_FIELD[kind];
    const g = x.createLinearGradient(0, 0, 0, ch); g.addColorStop(0, a); g.addColorStop(1, b); x.fillStyle = g; x.fillRect(0, 0, cw, ch);
    // weave & fold shading
    for (let i = 0; i < cw; i += 3) { x.fillStyle = `rgba(0,0,0,${0.025 + 0.03 * Math.sin(i * 0.31)})`; x.fillRect(i, 0, 1, ch); }
    // border trim
    x.strokeStyle = gold; x.lineWidth = 5; x.strokeRect(9, 9, cw - 18, ch - 18);
    x.strokeStyle = goldD; x.lineWidth = 1.5; x.strokeRect(17, 17, cw - 34, ch - 34);
    for (let i = 0; i < 5; i++) { x.fillStyle = gold; x.beginPath(); x.arc(cw / 2 + (i - 2) * 22, 28, 3, 0, Math.PI * 2); x.fill(); }
    const stroke = (col: string, w: number) => { x.strokeStyle = col; x.lineWidth = w; x.lineCap = 'round'; x.lineJoin = 'round'; };
    const both = (fn: (col: string, dx: number) => void) => { fn('rgba(0,0,0,0.45)', 3); fn(gold, 0); };
    if (kind === 'scales') {
      both((col, o) => {
        stroke(col, 6); x.beginPath(); x.moveTo(96 + o, 72 + o); x.lineTo(96 + o, 196 + o); x.stroke();
        stroke(col, 5); x.beginPath(); x.moveTo(40 + o, 98 + o); x.quadraticCurveTo(96 + o, 82 + o, 152 + o, 98 + o); x.stroke();
        stroke(col, 2); for (const px of [40, 152]) { x.beginPath(); x.moveTo(px + o, 98 + o); x.lineTo(px - 18 + o, 150 + o); x.moveTo(px + o, 98 + o); x.lineTo(px + 18 + o, 150 + o); x.stroke(); }
        x.fillStyle = col; for (const px of [40, 152]) { x.beginPath(); x.moveTo(px - 24 + o, 150 + o); x.quadraticCurveTo(px + o, 178 + o, px + 24 + o, 150 + o); x.closePath(); x.fill(); }
        x.beginPath(); x.arc(96 + o, 68 + o, 7, 0, Math.PI * 2); x.fill();
        x.beginPath(); x.moveTo(66 + o, 204 + o); x.lineTo(126 + o, 204 + o); x.lineTo(114 + o, 190 + o); x.lineTo(78 + o, 190 + o); x.closePath(); x.fill();
      });
    } else if (kind === 'hammers') {
      both((col, o) => {
        for (const s of [-1, 1]) {
          x.save(); x.translate(96 + o, 130 + o); x.rotate(s * 0.72);
          stroke(col === gold ? cream : col, 7); x.beginPath(); x.moveTo(0, 62); x.lineTo(0, -52); x.stroke();
          x.fillStyle = col === gold ? '#d6d8dc' : col; x.fillRect(-23, -66, 46, 20); x.fillStyle = col === gold ? '#8a8e96' : col; x.fillRect(-23, -50, 46, 4);
          x.restore();
        }
      });
    } else if (kind === 'fleur') {
      both((col, o) => {
        x.fillStyle = col; x.save(); x.translate(o, o);
        x.beginPath(); x.moveTo(96, 56); x.bezierCurveTo(132, 86, 122, 128, 96, 150); x.bezierCurveTo(70, 128, 60, 86, 96, 56); x.fill();
        for (const s of [-1, 1]) {
          x.beginPath(); x.moveTo(96 + s * 6, 140); x.bezierCurveTo(96 + s * 34, 100, 96 + s * 70, 100, 96 + s * 66, 134); x.bezierCurveTo(96 + s * 62, 162, 96 + s * 30, 156, 96 + s * 14, 150); x.fill();
        }
        x.fillRect(66, 150, 60, 12);
        x.beginPath(); x.moveTo(96, 214); x.bezierCurveTo(78, 192, 82, 176, 96, 164); x.bezierCurveTo(110, 176, 114, 192, 96, 214); x.fill();
        x.restore();
      });
    } else if (kind === 'key') {
      both((col, o) => {
        stroke(col, 7); x.beginPath(); x.arc(96 + o, 92 + o, 24, 0, Math.PI * 2); x.stroke();
        x.beginPath(); x.moveTo(96 + o, 116 + o); x.lineTo(96 + o, 206 + o); x.stroke();
        x.fillStyle = col; x.fillRect(96 + o, 170 + o, 24, 9); x.fillRect(96 + o, 190 + o, 18, 9);
      });
    } else if (kind === 'mortar') {
      both((col, o) => {
        x.fillStyle = col; x.beginPath(); x.moveTo(52 + o, 142 + o); x.quadraticCurveTo(96 + o, 232 + o, 140 + o, 142 + o); x.closePath(); x.fill();
        x.fillRect(46 + o, 134 + o, 100, 10);
        stroke(col, 14); x.beginPath(); x.moveTo(104 + o, 130 + o); x.lineTo(138 + o, 66 + o); x.stroke();
      });
    } else if (kind === 'scissors') {
      both((col, o) => {
        stroke(col, 7);
        x.beginPath(); x.moveTo(72 + o, 76 + o); x.lineTo(120 + o, 186 + o); x.moveTo(120 + o, 76 + o); x.lineTo(72 + o, 186 + o); x.stroke();
        x.beginPath(); x.arc(70 + o, 200 + o, 14, 0, Math.PI * 2); x.arc(122 + o, 200 + o, 14, 0, Math.PI * 2); x.stroke();
      });
    } else if (kind === 'tankard') {
      both((col, o) => {
        x.fillStyle = col; x.fillRect(66 + o, 96 + o, 60, 84); stroke(col, 8); x.beginPath(); x.arc(134 + o, 134 + o, 20, -Math.PI / 2, Math.PI / 2); x.stroke();
        x.fillStyle = col === gold ? cream : col; x.beginPath(); x.arc(76 + o, 94 + o, 12, 0, Math.PI * 2); x.arc(96 + o, 88 + o, 14, 0, Math.PI * 2); x.arc(116 + o, 94 + o, 12, 0, Math.PI * 2); x.fill();
      });
    } else if (kind === 'anvil') {
      both((col, o) => {
        x.fillStyle = col === gold ? '#c8ccd2' : col; x.beginPath();
        x.moveTo(44 + o, 112 + o); x.lineTo(150 + o, 112 + o); x.lineTo(150 + o, 132 + o); x.lineTo(118 + o, 136 + o); x.lineTo(112 + o, 160 + o); x.lineTo(140 + o, 184 + o); x.lineTo(60 + o, 184 + o); x.lineTo(80 + o, 160 + o); x.lineTo(76 + o, 136 + o); x.lineTo(60 + o, 132 + o); x.closePath(); x.fill();
        x.fillStyle = col === gold ? '#ff8030' : col; x.beginPath(); x.arc(96 + o, 96 + o, 8, 0, Math.PI * 2); x.fill();
      });
    }
    x.restore();
  };
  (Object.keys(EMBLEM_CELLS) as EmblemKind[]).forEach((k) => draw(k, EMBLEM_CELLS[k]));
  return c;
}

/* ------------------------------------------------------------------ decals */
export const DECAL_CELLS = { grate: 0, manhole: 1, crack: 2, stain: 3, straw: 4, leaves: 5, coal: 6, scorch: 7, ruts: 8, splinters: 9, mud: 10, ash: 11 } as const;
export type DecalKind = keyof typeof DECAL_CELLS;

export function makeDecalAtlas(seed = 77): HTMLCanvasElement {
  const N = 4, cs = 128;
  const [c, x] = makeCanvas(N * cs, N * cs);
  const rng = new Rng(seed);
  const cell = (idx: number, paint: () => void) => { x.save(); x.translate((idx % N) * cs, Math.floor(idx / N) * cs); x.beginPath(); x.rect(0, 0, cs, cs); x.clip(); paint(); x.restore(); };
  const blob = (cx: number, cy: number, r: number, col: string, a: number) => {
    const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, rgba(0, 0, 0, a)); g.addColorStop(1, rgba(0, 0, 0, 0));
    x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, Math.PI * 2); x.fill(); void col;
  };
  cell(DECAL_CELLS.grate, () => {
    x.fillStyle = 'rgba(14,14,18,0.95)'; x.fillRect(10, 30, 108, 68);
    x.fillStyle = 'rgba(60,62,70,1)'; x.fillRect(10, 30, 108, 5); x.fillRect(10, 93, 108, 5); x.fillRect(10, 30, 5, 68); x.fillRect(113, 30, 5, 68);
    for (let i = 0; i < 9; i++) { x.fillStyle = 'rgba(74,76,84,1)'; x.fillRect(18 + i * 11, 36, 5, 57); }
    x.fillStyle = 'rgba(0,0,0,0.55)'; x.fillRect(10, 98, 108, 3);
  });
  cell(DECAL_CELLS.manhole, () => {
    x.fillStyle = 'rgba(12,12,16,0.95)'; x.beginPath(); x.arc(64, 64, 46, 0, Math.PI * 2); x.fill();
    x.strokeStyle = 'rgba(70,72,80,1)'; x.lineWidth = 5; x.beginPath(); x.arc(64, 64, 42, 0, Math.PI * 2); x.stroke();
    x.lineWidth = 3; for (let i = 0; i < 4; i++) { x.beginPath(); x.arc(64, 64, 14 + i * 8, 0, Math.PI * 2); x.stroke(); }
    x.beginPath(); x.moveTo(24, 64); x.lineTo(104, 64); x.moveTo(64, 24); x.lineTo(64, 104); x.stroke();
  });
  cell(DECAL_CELLS.crack, () => {
    x.strokeStyle = 'rgba(8,6,8,0.9)'; x.lineCap = 'round'; x.lineWidth = 2.2;
    let px = 6, py = 64; x.beginPath(); x.moveTo(px, py);
    for (let i = 0; i < 12; i++) { px += 9 + rng.range(0, 3); py += rng.range(-9, 9); x.lineTo(px, py); } x.stroke();
    x.lineWidth = 1.2; x.beginPath(); x.moveTo(60, 64); x.lineTo(76, 40); x.lineTo(86, 26); x.stroke();
  });
  cell(DECAL_CELLS.stain, () => { for (let i = 0; i < 6; i++) blob(rng.range(36, 92), rng.range(36, 92), rng.range(18, 36), '#000', rng.range(0.2, 0.4)); });
  cell(DECAL_CELLS.straw, () => {
    for (let i = 0; i < 70; i++) { x.strokeStyle = `hsla(${rng.range(36, 50)},${rng.range(40, 60)}%,${rng.range(38, 58)}%,0.95)`; x.lineWidth = rng.range(1, 1.8); const px = rng.range(20, 108), py = rng.range(20, 108), a = rng.range(0, Math.PI), L = rng.range(8, 20); x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * L, py + Math.sin(a) * L); x.stroke(); }
  });
  cell(DECAL_CELLS.leaves, () => {
    for (let i = 0; i < 18; i++) { x.save(); x.translate(rng.range(14, 114), rng.range(14, 114)); x.rotate(rng.range(0, 6.28)); leafPath(x, rng.range(5, 9)); x.fillStyle = `hsl(${rng.range(18, 90)},${rng.range(30, 55)}%,${rng.range(18, 30)}%)`; x.fill(); x.restore(); }
  });
  cell(DECAL_CELLS.coal, () => {
    for (let i = 0; i < 40; i++) { x.save(); x.translate(rng.range(14, 114), rng.range(14, 114)); x.rotate(rng.range(0, 6.28)); const s = rng.range(2.5, 6); x.fillStyle = `rgb(${rng.range(12, 30)},${rng.range(12, 28)},${rng.range(14, 30)})`; x.beginPath(); x.moveTo(-s, -s * 0.5); x.lineTo(0, -s); x.lineTo(s, -s * 0.3); x.lineTo(s * 0.6, s); x.lineTo(-s * 0.7, s * 0.7); x.closePath(); x.fill(); x.restore(); }
  });
  cell(DECAL_CELLS.scorch, () => {
    for (let i = 0; i < 14; i++) blob(64 + rng.range(-18, 18), 64 + rng.range(-18, 18), rng.range(18, 42), '#000', rng.range(0.25, 0.5));
    for (let i = 0; i < 26; i++) { x.strokeStyle = 'rgba(0,0,0,0.5)'; x.lineWidth = rng.range(1, 3); const a = rng.range(0, 6.28), r0 = rng.range(20, 34), r1 = r0 + rng.range(6, 24); x.beginPath(); x.moveTo(64 + Math.cos(a) * r0, 64 + Math.sin(a) * r0); x.lineTo(64 + Math.cos(a) * r1, 64 + Math.sin(a) * r1); x.stroke(); }
  });
  cell(DECAL_CELLS.ruts, () => {
    for (const oy of [38, 90]) { const g = x.createLinearGradient(0, oy - 12, 0, oy + 12); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.5, 'rgba(0,0,0,0.55)'); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fillRect(0, oy - 12, cs, 24); }
  });
  cell(DECAL_CELLS.splinters, () => {
    for (let i = 0; i < 22; i++) { x.save(); x.translate(rng.range(14, 114), rng.range(14, 114)); x.rotate(rng.range(0, 6.28)); x.fillStyle = `hsl(${rng.range(24, 36)},${rng.range(30, 50)}%,${rng.range(22, 40)}%)`; x.fillRect(-rng.range(5, 14), -1.5, rng.range(10, 26), rng.range(2, 4)); x.restore(); }
  });
  cell(DECAL_CELLS.mud, () => { for (let i = 0; i < 10; i++) blob(rng.range(30, 98), rng.range(30, 98), rng.range(10, 26), '#000', rng.range(0.25, 0.45)); });
  cell(DECAL_CELLS.ash, () => {
    for (let i = 0; i < 9; i++) { const cx = 64 + rng.range(-24, 24), cy = 64 + rng.range(-24, 24), r = rng.range(14, 30); const g = x.createRadialGradient(cx, cy, 0, cx, cy, r); g.addColorStop(0, 'rgba(120,118,122,0.5)'); g.addColorStop(1, 'rgba(120,118,122,0)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r, 0, 6.28); x.fill(); }
  });
  return c;
}
