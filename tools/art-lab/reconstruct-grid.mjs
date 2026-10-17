// Strict-grid reconstruction of one painted figure from a reference sheet (Art Lab, development only; never a runtime / build step).
// The figure is resampled on its own pixel grid (pitch + phase searched by minimum in-cell variance, median of 9 taps per cell),
// separated from the background (flood fill from the border + cast-shadow rows), fitted in a frame with the feet on a fixed row,
// closed (short vertical gaps) and cleaned (islands), then optionally reduced with an OKLab k-means (deterministic farthest-point
// seeding, face rows weighted x4). Origin: Pass 4A E2 (JOURNAL); it reproduces the approved NPC baseline bit for bit (see
// art-lab/characters/provenance/dockworker-x2-v1/).
//   node tools/art-lab/reconstruct-grid.mjs <sheet> "x0,y0,x1,y1" <pitch> <frameW> <frameH> <footRow> <outPrefix> ["full,96,64"] [--holes] [--no-shadow] [--bg-threshold=<n>]
// writes <outPrefix>-<variant>.png (native size) and <outPrefix>.json (report). Needs Chrome / Edge (CHROME_PATH), like the other tools.
// Options (off by default: without them the output is unchanged, bit for bit): --holes = background-coloured cells enclosed by the
// figure (pockets between hair, arm and body) are background too; --no-shadow = no cast-shadow rule (a source drawn without a shadow,
// whose dark boot soles must not be taken for one); --bg-threshold=<n> = the colour distance under which a cell joins the background flood
// fill (default 26; a lower value keeps cloth darker than the default allows, e.g. a navy cloak close to the sheet's background, which the
// fill otherwise cuts into slits). Counts and options are reported when an option is set.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome']
  .filter(Boolean).find((p) => fs.existsSync(p));
if (!exe) { console.error('No Chrome / Edge found: set CHROME_PATH.'); process.exit(2); }
const argv = process.argv.slice(2), bgArg = argv.find((a) => a.startsWith('--bg-threshold='));
const opts = { holes: argv.includes('--holes'), noShadow: argv.includes('--no-shadow'), ...(bgArg ? { bgThreshold: Number(bgArg.split('=')[1]) } : {}) };
if (bgArg && !(opts.bgThreshold > 0)) { console.error('--bg-threshold=<n> needs a positive number'); process.exit(2); }
const [ref, box, pitchS, fwS, fhS, footS, outPrefix, variantsS = 'full'] = argv.filter((a) => !a.startsWith('--'));
if (!outPrefix) { console.error('usage: node tools/art-lab/reconstruct-grid.mjs <sheet> "x0,y0,x1,y1" <pitch> <frameW> <frameH> <footRow> <outPrefix> ["full,96,64"]'); process.exit(2); }
const mime = ref.toLowerCase().endsWith('.png') ? 'image/png' : ref.toLowerCase().match(/.jpe?g$/) ? 'image/jpeg' : 'image/webp';
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new' });
try {
  const page = await browser.newPage();
  const src = `data:${mime};base64,` + fs.readFileSync(ref).toString('base64');
  const r = await page.evaluate(async (src, box, P, FW, FH, FOOT, variants, opts) => {
    const img = await new Promise((res) => { const i = new Image(); i.onload = () => res(i); i.src = src; });
    let [x0, y0, x1, y1] = box.split(',').map(Number); x0 -= 6; y0 -= 6; x1 += 6; y1 += 10;
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
    const W = x1 - x0, H = y1 - y0, d = g.getImageData(x0, y0, W, H).data, px = (x, y) => { const i = (y * W + x) * 4; return [d[i], d[i + 1], d[i + 2]]; };
    const diff = (a, q) => Math.abs(a[0] - q[0]) + Math.abs(a[1] - q[1]) + Math.abs(a[2] - q[2]);
    let best = null;
    for (let ox = 0; ox < P; ox += P / 10) for (let oy = 0; oy < P; oy += P / 10) {
      let v = 0, n = 0;
      for (let cy = oy; cy + P <= H; cy += P) for (let cx = ox; cx + P <= W; cx += P) {
        const s = []; for (let y = Math.ceil(cy); y < cy + P - 0.01; y++) for (let x = Math.ceil(cx); x < cx + P - 0.01; x++) s.push(px(x, y));
        if (!s.length) continue; const m = [0, 1, 2].map((k) => s.reduce((a, p) => a + p[k], 0) / s.length); for (const p of s) v += (p[0] - m[0]) ** 2 + (p[1] - m[1]) ** 2 + (p[2] - m[2]) ** 2; n += s.length;
      }
      if (n && (!best || v / n < best.v)) best = { ox, oy, v: v / n };
    }
    const cols = Math.floor((W - best.ox) / P), rows = Math.floor((H - best.oy) / P), cell = [];
    const R = Math.max(1, P / 4);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const cx = best.ox + (i + 0.5) * P, cy = best.oy + (j + 0.5) * P, s = [];
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const x = Math.round(cx + dx * R * 0.9), y = Math.round(cy + dy * R * 0.9); if (x >= 0 && y >= 0 && x < W && y < H) s.push(px(x, y)); }
      cell.push([0, 1, 2].map((k) => s.map((p) => p[k]).sort((a, q) => a - q)[s.length >> 1]));
    }
    const at = (i, j) => cell[j * cols + i], bg = at(0, 0), T = opts.bgThreshold ?? 26, isBg = new Uint8Array(cols * rows), q = [];
    for (let i = 0; i < cols; i++) q.push([i, 0], [i, rows - 1]); for (let j = 0; j < rows; j++) q.push([0, j], [cols - 1, j]);
    while (q.length) { const [i, j] = q.pop(); if (i < 0 || j < 0 || i >= cols || j >= rows) continue; const k = j * cols + i; if (isBg[k] || diff(at(i, j), bg) > T) continue; isBg[k] = 1; q.push([i + 1, j], [i - 1, j], [i, j + 1], [i, j - 1]); }
    const sh = (p) => Math.max(...p) < 46 && Math.max(...p) - Math.min(...p) < 16, shRows = Math.round(9 * 3.55 / P);
    let changed = !opts.noShadow, shadowCells = 0; while (changed) { changed = false; for (let j = rows - shRows; j < rows; j++) for (let i = 0; i < cols; i++) { const k = j * cols + i; if (isBg[k] || !sh(at(i, j))) continue; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([a, b]) => { const ii = i + a, jj = j + b; return ii < 0 || jj < 0 || ii >= cols || jj >= rows || isBg[jj * cols + ii]; })) { isBg[k] = 1; changed = true; shadowCells++; } } }    // frame
    let minx = 1e9, maxx = -1, miny = 1e9, maxy = -1;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) if (!isBg[j * cols + i]) { minx = Math.min(minx, i); maxx = Math.max(maxx, i); miny = Math.min(miny, j); maxy = Math.max(maxy, j); }
    const offX = Math.round(FW / 2 - (minx + maxx + 1) / 2), offY = FOOT - maxy;
    let grid = Array.from({ length: FH }, () => new Array(FW).fill(null)), clipped = 0;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { if (isBg[j * cols + i]) continue; const x = i + offX, y = j + offY; if (x < 0 || y < 0 || x >= FW || y >= FH) { clipped++; continue; } grid[y][x] = at(i, j); }
    // shape rules: vertical closing of short gaps (background-coloured ankle bands / outlines), islands < 6 px removed
    const gap = Math.max(3, Math.round(3 * 3.55 / P));
    const darkest = () => { let b = null; for (const r of grid) for (const p of r) if (p && (!b || p[0] + p[1] + p[2] < b[0] + b[1] + b[2])) b = p; return b; };
    const dk = darkest(); let closed = 0;
    for (let x = 0; x < FW; x++) for (let y = 1; y < FH - 1; y++) { if (grid[y][x] || !grid[y - 1][x]) continue; let e = y; while (e < FH && !grid[e][x] && e - y <= gap) e++; if (e < FH && e - y <= gap && grid[e][x]) for (let k = y; k < e; k++) { grid[k][x] = dk; closed++; } }
    // --holes, after the closing (which would refill a cleared pocket with the darkest colour): enclosed background-coloured texels
    let holeCells = 0; if (opts.holes) for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (grid[y][x] && diff(grid[y][x], bg) <= T) { grid[y][x] = null; holeCells++; }
    const lab = Array.from({ length: FH }, () => new Array(FW).fill(-1)), sizes = [];
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (grid[y][x] && lab[y][x] < 0) { const id = sizes.length, st = [[x, y]]; let n = 0; while (st.length) { const [a, b] = st.pop(); if (a < 0 || b < 0 || a >= FW || b >= FH || lab[b][a] >= 0 || !grid[b][a]) continue; lab[b][a] = id; n++; st.push([a + 1, b], [a - 1, b], [a, b + 1], [a, b - 1]); } sizes.push(n); }
    const main = sizes.indexOf(Math.max(...sizes)); let islands = 0;
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (lab[y][x] >= 0 && lab[y][x] !== main && sizes[lab[y][x]] < 6 * (3.55 / P) ** 2) { grid[y][x] = null; islands++; }
    // OKLab k-means (deterministic farthest-point seeding), face region (top 30 % of the figure) weighted x4
    const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
    const ok = ([r, gg, b]) => { const R1 = lin(r), G1 = lin(gg), B1 = lin(b); const l = Math.cbrt(0.4122214708 * R1 + 0.5363325363 * G1 + 0.0514459929 * B1), m = Math.cbrt(0.2119034982 * R1 + 0.6806995451 * G1 + 0.1073969566 * B1), s = Math.cbrt(0.0883024619 * R1 + 0.2817188376 * G1 + 0.6299787005 * B1); return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s]; };
    const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
    const fy0 = FOOT - (maxy - miny), faceY = fy0 + (maxy - miny) * 0.3;
    const pts = []; for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (grid[y][x]) pts.push({ x, y, rgb: grid[y][x], lab: ok(grid[y][x]), w: y < faceY ? 4 : 1 });
    const fullColours = new Set(pts.map((p) => p.rgb.join(','))).size;
    const out = {};
    for (const v of variants.split(',')) {
      let q2 = pts.map((p) => p.rgb);
      if (v !== 'full') {
        const K = +v, cent = [pts[0].lab.slice()];
        while (cent.length < K) { let bi = 0, bd = -1; pts.forEach((p, i) => { const dd = Math.min(...cent.map((cc) => d2(p.lab, cc))) * p.w; if (dd > bd) { bd = dd; bi = i; } }); cent.push(pts[bi].lab.slice()); }
        let as = [];
        for (let it = 0; it < 25; it++) {
          as = pts.map((p) => { let bi = 0, bd = 1e9; cent.forEach((cc, i) => { const dd = d2(p.lab, cc); if (dd < bd) { bd = dd; bi = i; } }); return bi; });
          const acc = cent.map(() => [0, 0, 0, 0]); pts.forEach((p, i) => { const a = acc[as[i]]; a[0] += p.lab[0] * p.w; a[1] += p.lab[1] * p.w; a[2] += p.lab[2] * p.w; a[3] += p.w; });
          acc.forEach((a, i) => { if (a[3]) cent[i] = [a[0] / a[3], a[1] / a[3], a[2] / a[3]]; });
        }
        const rgbOf = cent.map(() => [0, 0, 0, 0]); pts.forEach((p, i) => { const a = rgbOf[as[i]]; a[0] += p.rgb[0] * p.w; a[1] += p.rgb[1] * p.w; a[2] += p.rgb[2] * p.w; a[3] += p.w; });
        const pal = rgbOf.map((a) => (a[3] ? [a[0], a[1], a[2]].map((x) => Math.round(x / a[3])) : [0, 0, 0]));
        q2 = as.map((i) => pal[i]);
      }
      const oc = document.createElement('canvas'); oc.width = FW; oc.height = FH; const og = oc.getContext('2d'); const id = og.createImageData(FW, FH);
      pts.forEach((p, i) => { const o = (p.y * FW + p.x) * 4; id.data[o] = q2[i][0]; id.data[o + 1] = q2[i][1]; id.data[o + 2] = q2[i][2]; id.data[o + 3] = 255; });
      og.putImageData(id, 0, 0); out[v] = { colours: new Set(q2.map((x) => x.join(','))).size, png: oc.toDataURL('image/png').split(',')[1] };
    }
    return { pitch: P, phase: [best.ox, best.oy], figure: [maxx - minx + 1, maxy - miny + 1], frame: [FW, FH], foot: FOOT, clipped, closed, islands, opaque: pts.length, fullColours,
      ...(opts.holes || opts.noShadow || opts.bgThreshold ? { options: opts, holeCells, shadowCells } : {}), out };
  }, src, box, +pitchS, +fwS, +fhS, +footS, variantsS, opts);
  const report = { ...r, out: undefined, variants: {} };
  for (const [v, o] of Object.entries(r.out)) { fs.writeFileSync(`${outPrefix}-${v}.png`, Buffer.from(o.png, 'base64')); report.variants[v] = o.colours; }
  delete report.out; fs.writeFileSync(`${outPrefix}.json`, JSON.stringify(report, null, 1)); console.log(JSON.stringify(report));
} finally { await browser.close(); }
