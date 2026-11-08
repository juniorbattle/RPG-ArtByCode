// The generic fighters' skin line-up (journal Passe GS1): for each fighter of art-lab/characters/variants/fighters.json (or --file=<json>), its original
// and each candidate skin, recoloured by the runtime's own code (src/characters/FighterSkins.ts: the masks, the sheet's range, the shader's formula): the
// portrait's face (the town sheet's front idle, `faceCrop`, x4), the town sheet's front and side idle (x3), and six frames of the combat sheet (x1.5: the
// same texel as the town at x2... a combat texel is a third of a town pixel). No lighting: the duel's look is checked in the scene (DEV `fighterskin=`).
// One PNG per fighter, `<outDir>/<id>-lineup.png`, rows = original then the variants; `--json` prints the layout (for the decision sheet's labels).
//   node tools/art-lab/skin-lineup.mjs <outDir> [--file=<json>] [id ...]
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2), outDir = args.find((a) => !a.startsWith('--'));
if (!outDir) throw new Error('usage: node tools/art-lab/skin-lineup.mjs <outDir> [--file=<json>] [id ...]');
const fileArg = args.find((a) => a.startsWith('--file='))?.slice(7) ?? path.join(ROOT, 'art-lab/characters/variants/fighters.json');
const only = args.filter((a) => !a.startsWith('--') && a !== outDir);
const file = JSON.parse(fs.readFileSync(fileArg, 'utf8'));
const COMBAT = ['idle.0', 'strike.2', 'skillOff.2', 'hit.0', 'ko.2', 'victory.0'];
fs.mkdirSync(outDir, { recursive: true });
const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
try {
  const { decodePng } = await server.ssrLoadModule('/src/characters/BakedDecode.ts');
  const { namedFrames, sheetTone, toneFrame } = await server.ssrLoadModule('/src/characters/FighterSkins.ts');
  const { faceCrop } = await server.ssrLoadModule('/src/ui/portraits.ts');
  for (const [who, f] of Object.entries(file.fighters)) {
    if (only.length && !only.includes(who)) continue;
    const load = async (id, combat) => { const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`)))); return namedFrames(img, JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8')), combat); };
    const town = await load(`${who}-x2-v1`, false), fight = await load(`${who}-x3-combat`, true);
    const rows = [];
    for (let v = 0; v <= f.variants.length; v++) {
      const tt = v ? sheetTone(file, who, `${who}-x2-v1`, town.frames, town.fw, town.fh, 'candidate', v) : null;
      const tc = v ? sheetTone(file, who, `${who}-x3-combat`, fight.frames, fight.fw, fight.fh, 'candidate', v) : null;
      const tf = (sheet, tone, name) => { const n = sheet.frames.findIndex((q) => q.name === name); if (n < 0) return null; const fr = sheet.frames[n]; return tone ? toneFrame(file, tone, n, fr.rgba) : fr.rgba; };
      const front = tf(town, tt, 'down/idle.0'), side = tf(town, tt, 'side/idle.0'), crop = faceCrop(front, town.fw, town.fh);
      rows.push({ label: v ? f.variants[v - 1] : 'original', front, side, crop, combat: COMBAT.map((n) => tf(fight, tc, n)) });
    }
    // cells: face 32 x4 = 128; town 64x96 x3 = 192 x 288; combat 192x288 x1.5 -> drawn at 1 px per texel x 1.5 (nearest)
    const TOP = 84, gap = 10, FW = 128, TW = 192, TH = 288, CW = 288, CH = Math.round((288 - TOP) * 1.5);   // a combat cell from row TOP: no frame of the six reaches higher
    const W = gap + FW + gap + 2 * (TW + gap) + COMBAT.length * (CW + 2) + gap, RH = Math.max(TH, CH) + gap, H = gap + rows.length * RH;
    const px = Buffer.alloc(W * H * 4);
    rows.forEach((r, ri) => {
      const oy = gap + ri * RH;
      // backgrounds: the portrait's ink, then the town's grey, then the combat frames half night-blue / half sand
      for (let y = oy - gap / 2; y < oy + RH - gap / 2; y++) for (let x = 0; x < W; x++) px.set(x < gap + FW + gap + 2 * (TW + gap) ? [104, 108, 118, 255] : (x - (gap + FW + gap + 2 * (TW + gap))) % (CW + 2) < CW / 2 ? [36, 42, 64, 255] : [176, 156, 122, 255], (y * W + x) * 4);
      const blit = (rgba, fw, fh, sx, sy, sw, sh, ox, oy2, s) => { for (let y = 0; y < sh * s; y++) for (let x = 0; x < sw * s; x++) { const i = ((sy + Math.floor(y / s)) * fw + sx + Math.floor(x / s)) * 4; if (rgba[i + 3] > 127) px.set([rgba[i], rgba[i + 1], rgba[i + 2], 255], ((oy2 + y) * W + ox + x) * 4); } };
      for (let y = 0; y < FW; y++) for (let x = 0; x < FW; x++) px.set([22, 24, 30, 255], ((oy + y) * W + gap + x) * 4);
      blit(r.front, town.fw, town.fh, r.crop.x, r.crop.y, r.crop.size, r.crop.size, gap, oy, 4);
      blit(r.front, town.fw, town.fh, 0, 0, town.fw, town.fh, gap + FW + gap, oy, 3);
      blit(r.side, town.fw, town.fh, 0, 0, town.fw, town.fh, gap + FW + gap + TW + gap, oy, 3);
      r.combat.forEach((c, i) => { if (c) blit(c, fight.fw, fight.fh, 0, TOP, fight.fw, fight.fh - TOP, gap + FW + gap + 2 * (TW + gap) + i * (CW + 2), oy, 1.5); });
    });
    fs.writeFileSync(path.join(outDir, `${who}-lineup.png`), encodePng(W, H, px));
    console.log(`${who.padEnd(8)} ${rows.map((r) => r.label).join(' | ')}`);
  }
} finally { await server.close(); }
