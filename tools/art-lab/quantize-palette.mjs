// One palette for several views of a character (Art Lab, development only; never a runtime / build step). Deterministic, no browser.
//   node tools/art-lab/quantize-palette.mjs --k 64 --out <dir> a.png b.png ...           joint OKLab k-means over every view
//   node tools/art-lab/quantize-palette.mjs --palette-from ref.png --out <dir> a.png ...   map every view onto the colours of ref.png
// The k-means is the one of reconstruct-grid.mjs (deterministic farthest-point seeding from the first opaque texel, 25 iterations, the
// top 30 % of each figure weighted x4, a cluster's colour = the weighted mean RGB of its texels), run on the texels of ALL views at once,
// so the same material gets the same colour in every facing. --palette-from keeps an approved sprite's palette (nearest colour in OKLab).
// Writes <dir>/<name>-q.png per view (alpha copied: 0 or 255) and <dir>/palette.json (colours, texels per view, mean / max OKLab error).
import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from './png.mjs';

const args = process.argv.slice(2), opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : null; };
const K = Number(opt('--k') ?? 0), from = opt('--palette-from'), outDir = opt('--out'), files = args;
if (!outDir || !files.length || (!K && !from)) { console.error('usage: quantize-palette.mjs (--k N | --palette-from ref.png) --out <dir> a.png ...'); process.exit(2); }

const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const ok = ([r, g, b]) => { const R = lin(r), G = lin(g), B = lin(b); const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B), m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B), s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B); return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; };
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;

const views = files.map((f) => ({ f, ...decodePng(fs.readFileSync(f)) }));
const pts = [];
for (const [vi, v] of views.entries()) {
  let miny = v.H, maxy = -1;
  for (let y = 0; y < v.H; y++) for (let x = 0; x < v.W; x++) if (v.rgba[(y * v.W + x) * 4 + 3] >= 128) { miny = Math.min(miny, y); maxy = Math.max(maxy, y); }
  const faceY = miny + (maxy - miny) * 0.3;
  for (let y = 0; y < v.H; y++) for (let x = 0; x < v.W; x++) {
    const i = (y * v.W + x) * 4; if (v.rgba[i + 3] < 128) continue;
    const rgb = [v.rgba[i], v.rgba[i + 1], v.rgba[i + 2]];
    pts.push({ vi, i, rgb, lab: ok(rgb), w: y < faceY ? 4 : 1 });
  }
}
let pal, as;
if (from) {
  const r = decodePng(fs.readFileSync(from)), set = new Map();
  for (let i = 0; i < r.W * r.H; i++) if (r.rgba[i * 4 + 3] >= 128) { const c = [r.rgba[i * 4], r.rgba[i * 4 + 1], r.rgba[i * 4 + 2]]; set.set(c.join(','), c); }
  pal = [...set.values()].sort((a, b) => a[0] - b[0] || a[1] - b[1] || a[2] - b[2]);
  const pl = pal.map(ok);
  as = pts.map((p) => { let bi = 0, bd = 1e9; pl.forEach((c, k) => { const d = d2(p.lab, c); if (d < bd) { bd = d; bi = k; } }); return bi; });
} else {
  const cent = [pts[0].lab.slice()], near = pts.map((p) => d2(p.lab, cent[0]) * p.w);
  while (cent.length < K) {
    let bi = 0, bd = -1; near.forEach((d, i) => { if (d > bd) { bd = d; bi = i; } });
    const c = pts[bi].lab.slice(); cent.push(c); pts.forEach((p, i) => { near[i] = Math.min(near[i], d2(p.lab, c) * p.w); });
  }
  for (let it = 0; it < 25; it++) {
    as = pts.map((p) => { let bi = 0, bd = 1e9; cent.forEach((c, k) => { const d = d2(p.lab, c); if (d < bd) { bd = d; bi = k; } }); return bi; });
    const acc = cent.map(() => [0, 0, 0, 0]); pts.forEach((p, i) => { const a = acc[as[i]]; a[0] += p.lab[0] * p.w; a[1] += p.lab[1] * p.w; a[2] += p.lab[2] * p.w; a[3] += p.w; });
    acc.forEach((a, k) => { if (a[3]) cent[k] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
  }
  const rgbOf = cent.map(() => [0, 0, 0, 0]); pts.forEach((p, i) => { const a = rgbOf[as[i]]; a[0] += p.rgb[0] * p.w; a[1] += p.rgb[1] * p.w; a[2] += p.rgb[2] * p.w; a[3] += p.w; });
  pal = rgbOf.map((a) => (a[3] ? [a[0], a[1], a[2]].map((x) => Math.round(x / a[3])) : [0, 0, 0]));
}
fs.mkdirSync(outDir, { recursive: true });
const report = { mode: from ? `palette-from ${path.basename(from)}` : `joint k-means ${K}`, colours: new Set(as.map((k) => pal[k].join(','))).size, views: {} };
for (const [vi, v] of views.entries()) {
  const o = Buffer.alloc(v.W * v.H * 4); let n = 0, sum = 0, max = 0;
  pts.forEach((p, k) => { if (p.vi !== vi) return; const c = pal[as[k]]; o[p.i] = c[0]; o[p.i + 1] = c[1]; o[p.i + 2] = c[2]; o[p.i + 3] = 255; const e = Math.sqrt(d2(p.lab, ok(c))); n++; sum += e; max = Math.max(max, e); });
  const name = path.basename(v.f, '.png') + '-q.png';
  fs.writeFileSync(path.join(outDir, name), encodePng(v.W, v.H, o));
  report.views[name] = { texels: n, meanOklabErrPermille: +(sum / n * 1000).toFixed(1), maxOklabErrPermille: +(max * 1000).toFixed(1) };
}
report.palette = [...new Set(as.map((k) => pal[k].join(',')))].map((s) => '#' + s.split(',').map((x) => (+x).toString(16).padStart(2, '0')).join(''));
fs.writeFileSync(path.join(outDir, 'palette.json'), JSON.stringify(report, null, 1));
console.log(JSON.stringify({ ...report, palette: undefined }));
