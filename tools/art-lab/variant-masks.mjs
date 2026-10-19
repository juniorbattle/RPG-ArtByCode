// Review of the NPC variant masks (journal Passe V1): for every production sheet, the runtime's own sheetMasks (src/characters/Variants.ts)
// with the sheet's settings from art-lab/characters/variants/variants.json (defaults otherwise), on the front / side / back idle and two walk
// frames: the frame, then hair in magenta and skin in cyan over a dimmed copy. Prints each sheet's mask fingerprint (all frames).
//   node tools/art-lab/variant-masks.mjs <out.png> [id ...]
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const [out, ...only] = process.argv.slice(2);
if (!out) throw new Error('usage: node tools/art-lab/variant-masks.mjs <out.png> [id ...]');
const vfile = path.join(ROOT, 'art-lab/characters/variants/variants.json');
const settings = fs.existsSync(vfile) ? JSON.parse(fs.readFileSync(vfile, 'utf8')).sheets ?? {} : {};
const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const rows = [];
try {
  const { decodePng, sheetFrames } = await server.ssrLoadModule('/src/characters/BakedDecode.ts');
  const { sheetMasks, maskFingerprint } = await server.ssrLoadModule('/src/characters/Variants.ts');
  let ids = fs.readdirSync(path.join(ROOT, 'art-lab/characters/manifests')).filter((f) => f.endsWith('.manifest.json'))
    .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/manifests', f), 'utf8'))).filter((m) => m.runtimeUse === 'production').map((m) => m.id).sort();
  if (only.length) ids = ids.filter((id) => only.includes(id));
  for (const id of ids) {
    const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`))));
    const { k, frames } = sheetFrames(id, img, JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8')));
    const s = settings[id]?.mask ?? { zones: {} };
    const masks = sheetMasks(frames, 32 * k, 48 * k, s);
    const pick = [['down', 'idle', 0], ['side', 'idle', 0], ['up', 'idle', 0], ['side', 'walk', 1], ['down', 'walk', 2]]
      .map(([d, a, i]) => frames.findIndex((f) => f.dir === d && f.anim === a && f.i === i)).filter((i) => i >= 0);
    const count = (m, v) => m.reduce((n, x) => n + (x === v ? 1 : 0), 0);
    rows.push({ id, k, frames: pick.map((i) => ({ f: frames[i], m: masks[i] })), fp: maskFingerprint(masks), hair: masks.reduce((n, m) => n + count(m, 1), 0), skin: masks.reduce((n, m) => n + count(m, 2), 0) });
  }
} finally { await server.close(); }
// one row per sheet: for each picked frame, the frame and its overlay, at T px per x2 texel
const T = 3, fw = 64, fh = 96, cell = fw * T + 8, W = 8 + 10 * cell, H = rows.length * (fh * T + 12) + 8;
const px = Buffer.alloc(W * H * 4); for (let i = 0; i < W * H; i++) px.set([128, 128, 128, 255], i * 4);
const put = (x0, y0, c) => { for (let y = 0; y < T; y++) for (let x = 0; x < T; x++) { const X = x0 + x, Y = y0 + y; if (X < W && Y < H) px.set([...c, 255], (Y * W + X) * 4); } };
rows.forEach((r, ri) => {
  const oy = 8 + ri * (fh * T + 12), s = 2 / r.k;
  r.frames.forEach(({ f, m }, j) => {
    const fwk = 32 * r.k, fhk = 48 * r.k;
    for (let y = 0; y < fhk; y++) for (let x = 0; x < fwk; x++) {
      const i = (y * fwk + x) * 4; if (f.rgba[i + 3] < 128) continue;
      const c = [f.rgba[i], f.rgba[i + 1], f.rgba[i + 2]], mm = m[y * fwk + x];
      put(8 + 2 * j * cell + x * T * s, oy + y * T * s, c);
      put(8 + (2 * j + 1) * cell + x * T * s, oy + y * T * s, mm === 1 ? [255, 0, 255] : mm === 2 ? [0, 230, 255] : c.map((v) => (v >> 2) + 40));
    }
  });
});
fs.writeFileSync(out, encodePng(W, H, px));
for (const r of rows) console.log(`${r.id.padEnd(22)} mask ${r.fp}  hair ${r.hair} texels  skin ${r.skin} texels`);
