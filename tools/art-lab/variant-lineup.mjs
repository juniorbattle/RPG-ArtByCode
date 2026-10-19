// NPC variants line-up (journal Passe V1): every sheet of art-lab/characters/variants/variants.json, its original and each variant, front and
// side idle, x4 nearest neighbour on neutral grey; recoloured with the runtime's masks and ranges (src/characters/Variants.ts) and the
// shader's formula (luminance rank in the sheet's range of that material -> the target ramp, interpolated in linear light). No lighting:
// the in-scene look is checked with ?variants=candidate (DEV).
//   node tools/art-lab/variant-lineup.mjs <out.png>
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const out = process.argv[2];
if (!out) throw new Error('usage: node tools/art-lab/variant-lineup.mjs <out.png>');
const file = JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/variants/variants.json'), 'utf8'));
const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const toLin = (u) => { const c = u / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const toSrgb = (l) => Math.round(255 * (l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055));
const rows = [];
try {
  const { decodePng, sheetFrames } = await server.ssrLoadModule('/src/characters/BakedDecode.ts');
  const { sheetMasks, materialRange, rampTable, linLum } = await server.ssrLoadModule('/src/characters/Variants.ts');
  const table = rampTable(file);
  const rampLin = (row) => table.rows[row].map((h) => [1, 3, 5].map((o) => toLin(parseInt(h.slice(o, o + 2), 16))));
  for (const [id, sv] of Object.entries(file.sheets)) {
    const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`))));
    const { k, frames } = sheetFrames(id, img, JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8')));
    const fw = 32 * k, fh = 48 * k, masks = sheetMasks(frames, fw, fh, sv.mask);
    const range = { 1: materialRange(frames, masks, 1), 2: materialRange(frames, masks, 2) };
    const pick = ['down', 'side'].map((d) => frames.findIndex((f) => f.dir === d && f.anim === 'idle' && f.i === 0));
    const variants = [null, ...sv.variants];
    const cells = [];
    for (const v of variants) for (const fi of pick) {
      const f = frames[fi], m = masks[fi], o = Uint8Array.from(f.rgba);
      if (v) for (let j = 0; j < m.length; j++) {
        const mat = m[j]; if (!mat) continue;
        const name = mat === 1 ? v.hair : v.skin, row = name ? (mat === 1 ? table.hair[name] : table.skin[name]) : undefined, r = range[mat];
        if (row === undefined || !r) continue;
        const i = j * 4, t = Math.min(1, Math.max(0, (linLum(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2]) - r[0]) / Math.max(r[1] - r[0], 1e-4))) * 4;
        const a = Math.floor(Math.min(3.999, t)), w = t - a, R = rampLin(row);
        for (let c = 0; c < 3; c++) o[i + c] = toSrgb(R[a][c] * (1 - w) + R[a + 1][c] * w);
      }
      cells.push({ rgba: o, fw, fh });
    }
    rows.push({ id, cells, labels: variants.map((v) => (v ? `${v.hair ?? '-'} / ${v.skin ?? '-'}` : 'original')) });
  }
} finally { await server.close(); }
const S = 4, CW = 64 * S, CH = 96 * S, gap = 12, W = gap + 6 * (CW / 2 + gap) + 3 * 20, H = rows.length * (CH / 2 + gap) + gap;
const px = Buffer.alloc(W * H * 4); for (let i = 0; i < W * H; i++) px.set([128, 128, 128, 255], i * 4);
rows.forEach((r, ri) => r.cells.forEach((c, ci) => {
  const ox = gap + ci * (CW / 2 + gap) + Math.floor(ci / 2) * 20, oy = gap + ri * (CH / 2 + gap), s = (S / 2) * (2 / (c.fw / 32));
  for (let y = 0; y < c.fh; y++) for (let x = 0; x < c.fw; x++) { const i = (y * c.fw + x) * 4; if (c.rgba[i + 3] < 128) continue;
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) px.set([c.rgba[i], c.rgba[i + 1], c.rgba[i + 2], 255], ((oy + y * s + dy) * W + ox + x * s + dx) * 4); }
}));
fs.writeFileSync(out, encodePng(W, H, px));
for (const r of rows) console.log(r.id.padEnd(22), r.labels.join('  |  '));
