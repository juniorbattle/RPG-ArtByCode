// The generic fighters' skin variants as Aseprite review documents (journal Passe GS1): for each sheet of art-lab/characters/variants/fighters.json (or
// --file=<json>), one `.aseprite` with the sheet's frames and tags (as its export), layers: "original" (the approved texels), "peau : <ramp>" for each
// candidate skin (hidden; the runtime's recolouring, src/characters/FighterSkins.ts), "masque peau" (the mask in cyan, 60 %, hidden). Built by Aseprite
// in batch mode from a Lua script, as tools/art-lab/build-combat.mjs builds a sheet; the approved sources and exports are never written. Open a document,
// show a skin layer, step through the frames; a correction found there goes into fighters.json (`force` / `clear` per frame), never into the sheet.
//   node tools/art-lab/skin-aseprite.mjs <outDir> [--file=<json>] [id ...]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2), outDir = args.find((a) => !a.startsWith('--'));
if (!outDir) throw new Error('usage: node tools/art-lab/skin-aseprite.mjs <outDir> [--file=<json>] [id ...]');
const fileArg = args.find((a) => a.startsWith('--file='))?.slice(7) ?? path.join(ROOT, 'art-lab/characters/variants/fighters.json');
const only = args.filter((a) => !a.startsWith('--') && a !== outDir);
const ase = [process.env.ASEPRITE_PATH, 'C:/Program Files/Aseprite/Aseprite.exe', 'C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe', '/Applications/Aseprite.app/Contents/MacOS/aseprite', '/usr/bin/aseprite'].filter(Boolean).find((p) => fs.existsSync(p));
if (!ase) throw new Error('Aseprite not found (ASEPRITE_PATH): this review tool needs it; the game never does');
const file = JSON.parse(fs.readFileSync(fileArg, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'skin-ase-'));
const lua = path.join(work, 'skins.lua');
fs.writeFileSync(lua, `
local p = app.params
local spr = nil
local layers = {}
local names = {}
for line in io.lines(p.layers) do table.insert(names, line) end
local n = 0
for line in io.lines(p.frames) do
  n = n + 1
  local parts = {}
  for f in line:gmatch("[^|]+") do table.insert(parts, f) end
  local img0 = Image{ fromFile = parts[1] }
  if spr == nil then
    spr = Sprite(img0.width, img0.height, ColorMode.RGB)
    layers[1] = spr.layers[1]
    layers[1].name = names[1]
    for i = 2, #names do local l = spr:newLayer(); l.name = names[i]; layers[i] = l end
  elseif n > 1 then
    spr:newEmptyFrame(n)
  end
  for i = 1, #names do spr:newCel(layers[i], n, Image{ fromFile = parts[i] }, Point(0, 0)) end
end
for i = 2, #names do layers[i].isVisible = false end
layers[#names].opacity = 153
for line in io.lines(p.tags) do
  local name, a, b = line:match("^(.*)|(%d+)|(%d+)$")
  local t = spr:newTag(tonumber(a) + 1, tonumber(b) + 1)
  t.name = name
end
spr:saveAs(p.out)
`);
const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
try {
  const { decodePng } = await server.ssrLoadModule('/src/characters/BakedDecode.ts');
  const { namedFrames, sheetSkin, sheetTone, toneFrame } = await server.ssrLoadModule('/src/characters/FighterSkins.ts');
  for (const [who, f] of Object.entries(file.fighters)) {
    if (only.length && !only.includes(who)) continue;
    for (const [id, sv] of Object.entries(f.sheets)) {
      const combat = id.endsWith('-combat'), json = JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8'));
      const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`))));
      const { fw, fh, frames } = namedFrames(img, json, combat), masks = sheetSkin(frames, fw, fh, sv.mask);
      const tones = f.variants.map((_, v) => sheetTone(file, who, id, frames, fw, fh, 'candidate', v + 1));
      const dir = path.join(work, id); fs.mkdirSync(dir, { recursive: true });
      const lines = frames.map((fr, n) => {
        const layer = [fr.rgba, ...tones.map((t) => (t ? toneFrame(file, t, n, fr.rgba) : fr.rgba))];
        const m = new Uint8Array(fw * fh * 4); for (let j = 0; j < fw * fh; j++) if (masks[n][j]) m.set([0, 230, 255, 255], j * 4);
        layer.push(m);
        return layer.map((rgba, i) => { const q = path.join(dir, `${String(n).padStart(3, '0')}-${i}.png`); fs.writeFileSync(q, encodePng(fw, fh, Buffer.from(rgba))); return q.replace(/\\/g, '/'); }).join('|');
      });
      const tags = json.meta.frameTags.map((t) => `${t.name}|${t.from}|${t.to}`);
      const lf = path.join(dir, 'frames.txt'), tf = path.join(dir, 'tags.txt'), nf = path.join(dir, 'layers.txt'), out = path.join(outDir, `${id}-peaux.aseprite`);
      fs.writeFileSync(lf, lines.join('\n') + '\n'); fs.writeFileSync(tf, tags.join('\n') + '\n'); fs.writeFileSync(nf, ['original', ...f.variants.map((v) => `peau : ${v}`), 'masque peau'].join('\n') + '\n');
      execFileSync(ase, ['-b', '--script-param', `frames=${lf.replace(/\\/g, '/')}`, '--script-param', `tags=${tf.replace(/\\/g, '/')}`, '--script-param', `layers=${nf.replace(/\\/g, '/')}`, '--script-param', `out=${out.replace(/\\/g, '/')}`, '--script', lua.replace(/\\/g, '/')], { stdio: 'ignore' });
      if (!fs.existsSync(out)) throw new Error(`${id}: Aseprite wrote no document`);
      // the document read back by Aseprite: every layer of every frame exported, the original layer against the approved export, texel for texel
      const back = path.join(dir, 'back-{layer}-{frame}.png');
      execFileSync(ase, ['-b', '--all-layers', out, '--split-layers', '--save-as', back.replace(/\\/g, '/')], { stdio: 'ignore' });
      let diff = 0;
      frames.forEach((fr, n) => { const q = path.join(dir, `back-original-${n}.png`); if (!fs.existsSync(q)) { diff++; return; } const b = decodePngSync(q); for (let j = 0; j < fw * fh; j++) { const a0 = fr.rgba[j * 4 + 3] > 127, a1 = b.rgba[j * 4 + 3] > 127; if (a0 !== a1 || (a0 && [0, 1, 2].some((c) => fr.rgba[j * 4 + c] !== b.rgba[j * 4 + c]))) { diff++; break; } } });
      console.log(`${id.padEnd(20)} ${frames.length} frames, ${f.variants.length + 2} layers -> ${path.relative(ROOT, out)}  (original layer read back: ${diff ? `${diff} frames differ` : 'identical to the export'})`);
    }
  }
} finally { await server.close(); if (!process.env.KEEP) fs.rmSync(work, { recursive: true, force: true }); else console.log(work); }

function decodePngSync(q) { return decodeLocal(fs.readFileSync(q)); }
import { decodePng as decodeLocal } from './png.mjs';
