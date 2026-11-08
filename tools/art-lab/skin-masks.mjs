// Review of the generic fighters' skin masks (journal Passe GS1): for each fighter of art-lab/characters/variants/fighters.json (or --file=<json>), the
// runtime's own masks (src/characters/FighterSkins.ts) on every frame of its town sheet and of its combat sheet: each frame, then its skin in cyan over a
// dimmed copy (`shade` colours taken by the fill in blue). One PNG per fighter, `<outDir>/<id>-masks.png`; prints each sheet's fingerprint and skin count.
//   node tools/art-lab/skin-masks.mjs <outDir> [--file=<json>] [id ...]
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2), outDir = args.find((a) => !a.startsWith('--'));
if (!outDir) throw new Error('usage: node tools/art-lab/skin-masks.mjs <outDir> [--file=<json>] [id ...]');
const fileArg = args.find((a) => a.startsWith('--file='))?.slice(7) ?? path.join(ROOT, 'art-lab/characters/variants/fighters.json');
const only = args.filter((a) => !a.startsWith('--') && a !== outDir);
const file = JSON.parse(fs.readFileSync(fileArg, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
try {
  const { decodePng } = await server.ssrLoadModule('/src/characters/BakedDecode.ts');
  const { namedFrames, sheetSkin, skinFingerprint } = await server.ssrLoadModule('/src/characters/FighterSkins.ts');
  for (const [who, f] of Object.entries(file.fighters)) {
    if (only.length && !only.includes(who)) continue;
    const blocks = [];
    for (const [sheetId, sv] of Object.entries(f.sheets)) {
      const combat = sheetId.endsWith('-combat');
      const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${sheetId}.png`))));
      const { fw, fh, frames } = namedFrames(img, JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${sheetId}.json`), 'utf8')), combat);
      const masks = sheetSkin(frames, fw, fh, sv.mask), noFill = sheetSkin(frames, fw, fh, { ...sv.mask, shade: [] });
      const n = masks.reduce((a, m) => a + m.reduce((b, x) => b + x, 0), 0);
      console.log(`${sheetId.padEnd(20)} skin ${skinFingerprint(masks)}${sv.fingerprint ? ` (file ${sv.fingerprint})` : ''}  ${n} texels over ${frames.length} frames`);
      blocks.push({ sheetId, fw, fh, frames, masks, noFill, s: combat ? 1 : 3 / 2 * 1 });
    }
    // layout: per sheet, rows of frames, each frame then its overlay; a town texel at 3 px, a combat texel at 1 px (the same world size x 1.5)
    const PER = 6, gap = 6, lay = blocks.map((b) => { const s = b.sheetId.endsWith('-combat') ? 1 : 3; return { ...b, s, cw: b.fw * s * 2 + gap, ch: b.fh * s + gap }; });
    const W = Math.max(...lay.map((b) => Math.min(PER, b.frames.length) * b.cw)) + gap, H = lay.reduce((a, b) => a + Math.ceil(b.frames.length / PER) * b.ch + 10, 0) + gap;
    const px = Buffer.alloc(W * H * 4); for (let i = 0; i < W * H; i++) px.set([92, 98, 112, 255], i * 4);
    let oy = gap;
    for (const b of lay) {
      b.frames.forEach((fr, n) => {
        const ox = gap + (n % PER) * b.cw, y0 = oy + Math.floor(n / PER) * b.ch;
        for (let y = 0; y < b.fh; y++) for (let x = 0; x < b.fw; x++) {
          const i = (y * b.fw + x) * 4; if (fr.rgba[i + 3] < 128) continue;
          const c = [fr.rgba[i], fr.rgba[i + 1], fr.rgba[i + 2]], m = b.masks[n][y * b.fw + x], m0 = b.noFill[n][y * b.fw + x];
          const o = m ? (m0 ? [0, 230, 255] : [40, 90, 255]) : c.map((v) => (v >> 2) + 40);
          for (let dy = 0; dy < b.s; dy++) for (let dx = 0; dx < b.s; dx++) {
            px.set([...c, 255], ((y0 + y * b.s + dy) * W + ox + x * b.s + dx) * 4);
            px.set([...o, 255], ((y0 + y * b.s + dy) * W + ox + b.fw * b.s + x * b.s + dx) * 4);
          }
        }
      });
      oy += Math.ceil(b.frames.length / PER) * b.ch + 10;
    }
    fs.writeFileSync(path.join(outDir, `${who}-masks.png`), encodePng(W, H, px));
  }
} finally { await server.close(); }
