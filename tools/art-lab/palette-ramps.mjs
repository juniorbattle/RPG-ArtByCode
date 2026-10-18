// Hair and skin ramps of the production cast's baked sheets (journal Passe V0, NPC variants): the colours a palette swap would change.
// Per sheet, every colour's texels are counted over all frames and located in the figure's height (0 = top of the figure, 1 = the soles).
//   skin: warm, moderately saturated, light colours (hue 8-45 deg, saturation 0.18-0.65, value >= 0.42) found on the face / hands;
//   hair: colours whose texels sit mostly in the top 30 % of the figure (>= 75 %) and are not skin; a hat or hood lands here too: the
//   classification is a PROPOSAL for the operator to confirm on the swatch sheet, never applied silently.
// Writes a review sheet (front idle x4 next to its hair / skin / other swatches) and a JSON.
//   node tools/art-lab/palette-ramps.mjs <out.png> [--json=out.json]
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2), out = args.find((a) => !a.startsWith('--')), jsonOut = args.find((a) => a.startsWith('--json='))?.slice(7);
if (!out) throw new Error('usage: node tools/art-lab/palette-ramps.mjs <out.png> [--json=out.json]');
const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const hsv = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx / 255]; };
const sheets = [];
try {
  const { decodePng, sheetFrames } = await server.ssrLoadModule('/src/characters/BakedDecode.ts');
  const ids = fs.readdirSync(path.join(ROOT, 'art-lab/characters/manifests')).filter((f) => f.endsWith('.manifest.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/manifests', f), 'utf8'))).filter((m) => m.runtimeUse === 'production').map((m) => m.id).sort();
  for (const id of ids) {
    const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`))));
    const { k, frames } = sheetFrames(id, img, JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8')));
    const fw = 32 * k, fh = 48 * k, stats = new Map();
    for (const f of frames) {
      let top = fh; for (let y = 0; y < fh && top === fh; y++) for (let x = 0; x < fw; x++) if (f.rgba[(y * fw + x) * 4 + 3] > 127) { top = y; break; }
      const foot = 45 * k, H = Math.max(1, foot - top);
      for (let y = top; y < fh; y++) for (let x = 0; x < fw; x++) { const i = (y * fw + x) * 4; if (f.rgba[i + 3] < 128) continue;
        const key = (f.rgba[i] << 16) | (f.rgba[i + 1] << 8) | f.rgba[i + 2]; const s = stats.get(key) ?? { n: 0, top: 0 }; s.n++; if ((y - top) / H < 0.3) s.top++; stats.set(key, s); }
    }
    const colours = [...stats].map(([key, s]) => { const r = key >> 16, g = (key >> 8) & 255, b = key & 255, [h, sat, v] = hsv(r, g, b);
      const skin = h >= 8 && h <= 45 && sat >= 0.18 && sat <= 0.65 && v >= 0.42, hair = !skin && s.top / s.n >= 0.75;
      return { hex: '#' + key.toString(16).padStart(6, '0'), rgb: [r, g, b], n: s.n, topShare: +(s.top / s.n).toFixed(2), class: skin ? 'skin' : hair ? 'hair' : 'other', lum: 0.2126 * r + 0.7152 * g + 0.0722 * b }; })
      .sort((a, b) => a.lum - b.lum);
    const front = frames.find((f) => f.dir === 'down' && f.anim === 'idle' && f.i === 0);
    sheets.push({ id, k, fw, fh, front: front.rgba, colours });
  }
} finally { await server.close(); }
// review sheet: one row per sheet: front idle x4, then the hair / skin / other swatches (8 x 24 px each)
const T = 2, SW = 14, rowH = 96 * T + 24, W = 8 + 64 * T + 40 + 3 * (12 * (SW + 2) + 16), H = sheets.length * rowH + 16;   // a x2 texel = T px
const px = Buffer.alloc(W * H * 4); for (let i = 0; i < W * H; i++) { px.set([128, 128, 128, 255], i * 4); }
const rect = (x0, y0, w, h, c) => { for (let y = y0; y < y0 + h; y++) for (let x = x0; x < x0 + w; x++) if (x >= 0 && y >= 0 && x < W && y < H) px.set([...c, 255], (y * W + x) * 4); };
sheets.forEach((s, r) => {
  const oy = 8 + r * rowH;
  for (let y = 0; y < s.fh; y++) for (let x = 0; x < s.fw; x++) { const i = (y * s.fw + x) * 4; if (s.front[i + 3] > 127) rect(8 + x * T * 2 / s.k, oy + y * T * 2 / s.k, T * 2 / s.k, T * 2 / s.k, [s.front[i], s.front[i + 1], s.front[i + 2]]); }
  let ox = 8 + 64 * T + 40;
  for (const cls of ['hair', 'skin', 'other']) {
    const cs = s.colours.filter((c) => c.class === cls); rect(ox - 4, oy, 2, rowH - 24, cls === 'hair' ? [255, 200, 60] : cls === 'skin' ? [255, 120, 120] : [60, 60, 60]);
    cs.forEach((c, j) => rect(ox + (j % 12) * (SW + 2), oy + Math.floor(j / 12) * (SW + 2), SW, SW, c.rgb));
    ox += 12 * (SW + 2) + 16;
  }
});
fs.writeFileSync(out, encodePng(W, H, px));
if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(sheets.map((s) => ({ id: s.id, colours: s.colours.map(({ hex, n, topShare, class: c }) => ({ hex, n, topShare, class: c })) })), null, 1));
for (const s of sheets) console.log(s.id.padEnd(22), ['hair', 'skin', 'other'].map((c) => `${c} ${s.colours.filter((x) => x.class === c).length}`).join('  '), ' ', s.colours.filter((x) => x.class === 'hair').map((x) => x.hex).join(' '), '|', s.colours.filter((x) => x.class === 'skin').map((x) => x.hex).join(' '));
