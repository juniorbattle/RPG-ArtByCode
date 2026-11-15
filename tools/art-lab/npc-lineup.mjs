// The townsfolk who fight themselves, as the art sheet of chantier 1 shows them (journal Passe PN1): for each person of src/narrative/npcFighters.ts (or --who), every frame of
// their template under their look and weapon (src/characters/NpcLook.ts, the candidate file), cropped to one box per template, in a strip (<who>.png, frames side by
// side) with its index (strips.json: the clips, their frames and durations); and the two templates as they are (template-m.png, template-f.png); --weapons: each template
// with each weapon of the list (weapons-<t>-<weapon>.png). No browser: the game's own modules through Vite's SSR loader.
//   node tools/art-lab/npc-lineup.mjs <outDir> [--who=mara,wynn] [--weapons] [--scale=2]
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2), outDir = args.find((a) => !a.startsWith('--'));
if (!outDir) throw new Error('usage: node tools/art-lab/npc-lineup.mjs <outDir> [--who=a,b] [--weapons] [--scale=2]');
const opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3), flag = (n) => args.includes(`--${n}`);
const scale = Number(opt('scale') ?? 2);
fs.mkdirSync(outDir, { recursive: true });
const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
try {
  const { decodePng } = await server.ssrLoadModule('/src/characters/BakedDecode.ts');
  const { namedFrames } = await server.ssrLoadModule('/src/characters/FighterSkins.ts');
  const { npcSheetLook, npcSheetId } = await server.ssrLoadModule('/src/characters/NpcLook.ts');
  const { NPC_WEAPONS } = await server.ssrLoadModule('/src/characters/NpcWeapons.ts');
  const { NPC_FIGHTERS } = await server.ssrLoadModule('/src/narrative/npcFighters.ts');
  const sheets = {};
  for (const t of ['m', 'f']) {
    const id = npcSheetId(t), meta = JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8'));
    const { fw, fh, frames } = namedFrames(await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`)))), meta, true);
    // one box for the template: the union of its frames' figures, 6 texels of margin (the weapons reach a little further)
    let b = [fw, fh, -1, -1];
    for (const f of frames) for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (f.rgba[(y * fw + x) * 4 + 3] >= 128) b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)];
    b = [Math.max(0, b[0] - 6), Math.max(0, b[1] - 10), Math.min(fw - 1, b[2] + 6), Math.min(fh - 1, b[3] + 2)];
    const tags = meta.meta.frameTags.map((g) => ({ clip: g.name.replace(/-side$/, ''), from: g.from, to: g.to, ms: (meta.frames[g.from]?.duration ?? 120) }));
    sheets[t] = { id, fw, fh, frames, box: b, tags };
  }
  const strip = (name, t, look) => {
    const s = sheets[t], tone = look ? npcSheetLook(look, s.frames, s.fw, s.fh, 'candidate') : null, bw = s.box[2] - s.box[0] + 1, bh = s.box[3] - s.box[1] + 1;
    const W = s.frames.length * bw * scale, H = bh * scale, px = Buffer.alloc(W * H * 4);
    s.frames.forEach((f, n) => {
      const rgba = tone ? tone(n, f.rgba) : f.rgba;
      for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
        const i = ((s.box[1] + y) * s.fw + s.box[0] + x) * 4; if (rgba[i + 3] < 128) continue;
        for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) { const o = ((y * scale + dy) * W + (n * bw + x) * scale + dx) * 4; px[o] = rgba[i]; px[o + 1] = rgba[i + 1]; px[o + 2] = rgba[i + 2]; px[o + 3] = 255; }
      }
    });
    fs.writeFileSync(path.join(outDir, `${name}.png`), encodePng(W, H, px));
    return { file: `${name}.png`, w: bw * scale, h: bh * scale, frames: s.frames.length };
  };
  const index = { templates: {}, people: {}, weapons: {}, clips: { m: sheets.m.tags, f: sheets.f.tags } };
  for (const t of ['m', 'f']) index.templates[t] = strip(`template-${t}`, t, null);
  const who = opt('who')?.split(',') ?? Object.keys(NPC_FIGHTERS);
  for (const w of who) { const n = NPC_FIGHTERS[w]; index.people[w] = { ...strip(w, n.look.template, n.look), look: n.look }; console.log(`  ${w}: ${n.look.template} ${n.look.weapon}`); }
  if (flag('weapons')) for (const t of ['m', 'f']) for (const k of NPC_WEAPONS) index.weapons[`${t}-${k}`] = strip(`weapons-${t}-${k}`, t, { template: t, weapon: k });
  fs.writeFileSync(path.join(outDir, 'strips.json'), JSON.stringify(index, null, 1));
  console.log(`${Object.keys(index.people).length} people, ${Object.keys(index.weapons).length} weapon strips -> ${outDir}`);
} finally { await server.close(); }
