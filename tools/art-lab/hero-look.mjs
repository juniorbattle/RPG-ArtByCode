// Ren's look (journal Passe PR3, src/characters/HeroLook.ts): the review of the material maps of hero-x2-v4 and hero-x3-combat under art-lab/characters/variants/hero.json.
//   node tools/art-lab/hero-look.mjs <outDir> [--suggest] [--ranges] [--fingerprints] [--look=skin,hair,cloak] [--per=<n>] [--only=<frame,...>]
// Writes, per sheet, pages of frames: the original, the maps (skin cyan, hair magenta, cloak yellow) over a dimmed copy, the look; prints each sheet's
// fingerprint, its texel counts and the ranges over both sheets.
// --suggest   fills the head rectangle (--resuggest=<sheet>: forgets that sheet's rectangles first) (and, on the combat sheet, the eyes' rectangle in `clear`) of every frame that has none, from the figure: the town
//             sheet's head is the top 27 rows of the figure; a combat frame's is a box round its face (the largest group of the three skin colours) and its
//             eyes the band above that face; a frame already written (by hand) is never touched.
// --ranges    writes each material's range over both sheets into the file; --fingerprints writes each sheet's fingerprint (the approval step only).
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2), outDir = args.find((a) => !a.startsWith('--'));
if (!outDir) throw new Error('usage: node tools/art-lab/hero-look.mjs <outDir> [--suggest] [--ranges] [--fingerprints] [--look=skin,hair,cloak] [--per=<n>] [--only=<frame,...>]');
const flag = (n) => args.includes(`--${n}`), opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const FILE = path.join(ROOT, 'art-lab/characters/variants/hero.json');
const file = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const lookArg = opt('look')?.split(','), look = lookArg ? { skin: lookArg[0] || undefined, hair: lookArg[1] || undefined, cloak: lookArg[2] || undefined } : file.look;
const PER = Number(opt('per') ?? 8), only = opt('only')?.split(',');
fs.mkdirSync(outDir, { recursive: true });

const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
try {
  const { decodePng } = await server.ssrLoadModule('/src/characters/BakedDecode.ts');
  const { namedFrames } = await server.ssrLoadModule('/src/characters/FighterSkins.ts');
  const { sheetMaterials, lookFingerprint, materialRanges, recolorLook } = await server.ssrLoadModule('/src/characters/HeroLook.ts');
  const sheets = [];
  for (const sheetId of Object.keys(file.sheets)) {
    const combat = sheetId.endsWith('-combat');
    const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${sheetId}.png`))));
    const { fw, fh, frames } = namedFrames(img, JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${sheetId}.json`), 'utf8')), combat);
    const re = opt('resuggest');
    if (re === sheetId) { file.sheets[sheetId].hair.head = {}; file.sheets[sheetId].hair.clear = {}; }
    if (flag('suggest') || re === sheetId) suggest(file.sheets[sheetId], frames, fw, fh, combat);
    sheets.push({ sheetId, combat, fw, fh, frames });
  }
  for (const s of sheets) s.maps = sheetMaterials(s.frames, s.fw, s.fh, file.sheets[s.sheetId]);
  // --text=<sheet>:<frame,...>: a frame's map as text, on its grid (the corrections are read there): '.' empty, ':' other, 'S' skin, 'H' hair, 'c' cloak, '#' outline
  const text = opt('text');
  if (text) {
    const [sid, names] = text.split(':'), s = sheets.find((x) => x.sheetId === sid), { hsv } = await server.ssrLoadModule('/src/characters/Variants.ts');
    for (const name of names.split(',')) {
      const n = s.frames.findIndex((x) => x.name === name), f = s.frames[n], m = s.maps[n], h = file.sheets[sid].hair, r = h.head?.[name];
      const box = r ? [Math.max(0, r[0] - 6), Math.max(0, r[1] - 6), Math.min(s.fw - 1, r[2] + 6), Math.min(s.fh - 1, r[3] + 6)] : [0, 0, s.fw - 1, s.fh - 1];
      let out = `== ${name} head ${JSON.stringify(r)} clear ${JSON.stringify(h.clear?.[name])}\n    ` + [...Array(box[2] - box[0] + 1).keys()].map((i) => (box[0] + i) % 10).join('') + '\n';
      for (let y = box[1]; y <= box[3]; y++) {
        let line = String(y).padStart(3) + ' ';
        for (let x = box[0]; x <= box[2]; x++) { const i = (y * s.fw + x) * 4; if (f.rgba[i + 3] < 128) { line += '.'; continue; } const v = m[y * s.fw + x]; line += v === 1 ? 'S' : v === 2 ? 'H' : v === 3 ? 'c' : hsv(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2])[2] < 0.25 ? '#' : ':'; }
        out += line + '\n';
      }
      console.log(out);
    }
    process.exitCode = 0;
  }
  const ranges = materialRanges(sheets);
  console.log('ranges over both sheets', JSON.stringify(ranges));
  if (flag('ranges')) for (const m of ['skin', 'hair', 'cloak']) if (ranges[m]) file.ranges[m] = ranges[m].map((v) => Number(v.toFixed(6)));
  for (const s of sheets) {
    const fp = lookFingerprint(s.maps), count = [0, 0, 0];
    for (const m of s.maps) for (const v of m) if (v) count[v - 1]++;
    console.log(`${s.sheetId.padEnd(16)} maps ${fp}${file.sheets[s.sheetId].fingerprint ? ` (file ${file.sheets[s.sheetId].fingerprint})` : ''}  skin ${count[0]} hair ${count[1]} cloak ${count[2]} over ${s.frames.length} frames`);
    if (flag('fingerprints')) file.sheets[s.sheetId].fingerprint = fp;
    pages(s, ranges);
  }
  if (flag('suggest') || opt('resuggest') || flag('ranges') || flag('fingerprints')) fs.writeFileSync(FILE, compact(file) + '\n');

  /** the review pages: per frame, the original, the maps, the look; a town texel at 3 px, a combat frame cropped to its figure at 2 px */
  function pages(s, ranges) {
    const pinned = { ...file, ranges: Object.fromEntries(Object.entries(file.ranges).map(([m, r]) => [m, ranges[m] ?? r])) };
    const list = s.frames.map((f, n) => ({ f, n })).filter(({ f }) => !only || only.includes(f.name));
    const scale = Number(opt("scale") ?? 2), gap = 8, cols = Number(opt("cols") ?? 4);
    for (let p = 0; p * PER < list.length; p++) {
      // --heads: each frame cropped to its head rectangle (4 texels round it), to read the hair
      const headBox = (f) => { const r = file.sheets[s.sheetId].hair.head?.[f.name]; return r ? [Math.max(0, r[0] - 4), Math.max(0, r[1] - 4), Math.min(s.fw - 1, r[2] + 4), Math.min(s.fh - 1, r[3] + 4)] : figureBox(f.rgba, s.fw, s.fh); };
      const part = list.slice(p * PER, (p + 1) * PER).map(({ f, n }) => ({ f, n, box: flag('heads') ? headBox(f) : s.combat ? figureBox(f.rgba, s.fw, s.fh) : [0, 0, s.fw - 1, s.fh - 1] }));
      const bw = Math.max(...part.map(({ box }) => (box[2] - box[0] + 1) * scale)), bh = Math.max(...part.map(({ box }) => (box[3] - box[1] + 1) * scale));
      const blockW = 3 * (bw + 2) + gap * 2, rows = Math.ceil(part.length / cols);
      const W = gap + Math.min(cols, part.length) * blockW, H = gap + rows * (bh + gap);
      const px = Buffer.alloc(W * H * 4); for (let i = 0; i < W * H; i++) px.set([60, 64, 78, 255], i * 4);
      part.forEach(({ f, n, box }, q) => {
        const bx = gap + (q % cols) * blockW, oy = gap + Math.floor(q / cols) * (bh + gap);
        const m = s.maps[n], lookRgba = recolorLook(f.rgba, m, pinned, look);
        const overlay = new Uint8Array(f.rgba.length);
        for (let j = 0; j < m.length; j++) { const i = j * 4, c = [null, [0, 230, 230], [235, 0, 205], [245, 205, 0]][m[j]]; overlay[i + 3] = f.rgba[i + 3]; for (let k = 0; k < 3; k++) overlay[i + k] = c ? c[k] : Math.round(f.rgba[i + k] * 0.45); }
        [f.rgba, overlay, lookRgba].forEach((src, c) => blit(px, W, src, s.fw, box, bx + c * (bw + 2), oy, scale));
        const h = file.sheets[s.sheetId].hair, ox = bx + bw + 2;
        const rect = (r, col) => { if (!r) return; for (let x = r[0]; x <= r[2]; x++) for (const y of [r[1], r[3]]) dot(px, W, ox, oy, box, scale, x, y, col); for (let y = r[1]; y <= r[3]; y++) for (const x of [r[0], r[2]]) dot(px, W, ox, oy, box, scale, x, y, col); };
        rect(h.head?.[f.name], [255, 255, 255]);
        for (const r of h.clear?.[f.name] ?? []) rect(r, [255, 80, 60]);
        for (const r of h.paint?.[f.name] ?? []) rect(r, [80, 255, 80]);
      });
      const name = `${s.sheetId}-${String(p + 1).padStart(2, '0')}.png`;
      fs.writeFileSync(path.join(outDir, name), encodePng(W, H, px));
      console.log(`  ${name}: ${part.map(({ f }) => f.name).join(' ')}`);
    }
  }
} finally { await server.close(); }

/** JSON with every array of numbers or strings on one line (the rectangles, the colours, the ramps) */
function compact(v) { return JSON.stringify(v, null, 2).replace(/\[\s*([^[\]{}]*?)\s*\]/g, (m, inner) => `[${inner.split(/,\s*/).join(', ')}]`); }
function figureBox(rgba, fw, fh) {
  let x0 = fw, y0 = fh, x1 = -1, y1 = -1;
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (rgba[(y * fw + x) * 4 + 3] >= 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return [Math.max(0, x0 - 2), Math.max(0, y0 - 2), Math.min(fw - 1, x1 + 2), Math.min(fh - 1, y1 + 2)];
}
function blit(px, W, src, fw, box, ox, oy, s) {
  for (let y = box[1]; y <= box[3]; y++) for (let x = box[0]; x <= box[2]; x++) {
    const i = (y * fw + x) * 4; if (src[i + 3] < 128) continue;
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) { const j = ((oy + (y - box[1]) * s + dy) * W + ox + (x - box[0]) * s + dx) * 4; px[j] = src[i]; px[j + 1] = src[i + 1]; px[j + 2] = src[i + 2]; }
  }
}
function dot(px, W, ox, oy, box, s, x, y, col) {
  if (x < box[0] || x > box[2] || y < box[1] || y > box[3]) return;
  const j = ((oy + (y - box[1]) * s + Math.floor(s / 2)) * W + ox + (x - box[0]) * s + Math.floor(s / 2)) * 4; px[j] = col[0]; px[j + 1] = col[1]; px[j + 2] = col[2];
}

/** the box of the largest 8-connected group of the skin's own colours inside a rectangle, or null */
function largestSkin(f, fw, fh, skinC, key, r) {
  const lab = new Int32Array(fw * fh).fill(-1), groups = [];
  const ok = (x, y) => x >= r[0] && x <= r[2] && y >= r[1] && y <= r[3] && f.rgba[(y * fw + x) * 4 + 3] >= 128 && skinC.has(key(f.rgba, (y * fw + x) * 4));
  for (let y0 = r[1]; y0 <= r[3]; y0++) for (let x0 = r[0]; x0 <= r[2]; x0++) {
    const j0 = y0 * fw + x0;
    if (lab[j0] >= 0 || !ok(x0, y0)) continue;
    const g = { n: 0, x0: fw, y0: fh, x1: -1, y1: -1 }, st = [j0]; lab[j0] = groups.length;
    while (st.length) { const j = st.pop(), x = j % fw, y = (j - x) / fw; g.n++; g.x0 = Math.min(g.x0, x); g.x1 = Math.max(g.x1, x); g.y0 = Math.min(g.y0, y); g.y1 = Math.max(g.y1, y);
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy; if (ok(X, Y) && lab[Y * fw + X] < 0) { lab[Y * fw + X] = groups.length; st.push(Y * fw + X); } } }
    groups.push(g);
  }
  return groups.sort((a, b) => b.n - a.n)[0] ?? null;
}

/** the head rectangles (and the combat sheet's eyes) of the frames that have none, from the figure (see the header) */
function suggest(sv, frames, fw, fh, combat) {
  const h = sv.hair, hairC = new Set(h.colours.map((c) => parseInt(c, 16))), skinC = new Set(sv.skin.skin.map((c) => parseInt(c, 16)));
  h.head ??= {}; h.clear ??= {};
  const key = (rgba, i) => (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
  for (const f of frames) {
    const at = (x, y) => (y * fw + x) * 4, op = (x, y) => f.rgba[at(x, y) + 3] >= 128;
    // the town sheet's eyes (not the back views): the band of rows round the top of the face's largest skin group, written once
    if (!combat && h.head[f.name] && !h.clear[f.name] && !/^up/.test(f.name)) {
      const face = largestSkin(f, fw, fh, skinC, key, h.head[f.name]);
      if (face) h.clear[f.name] = [[Math.max(0, face.x0 - 7), Math.max(0, face.y0 - 2), Math.min(fw - 1, face.x1 + 7), Math.min(fh - 1, face.y0 + 2)]];   // the eyes reach past the cheeks
    }
    if (h.head[f.name]) continue;
    if (!combat) {
      let top = -1;
      for (let y = 0; y < fh && top < 0; y++) for (let x = 0; x < fw; x++) if (op(x, y) && hairC.has(key(f.rgba, at(x, y)))) { top = y; break; }
      if (top < 0) continue;
      let x0 = fw, x1 = -1;
      for (let y = top; y <= Math.min(fh - 1, top + 26); y++) for (let x = 0; x < fw; x++) if (op(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
      h.head[f.name] = [x0, Math.max(0, top - 1), x1, Math.min(fh - 1, top + 26)];
      continue;
    }
    // the face: the largest 8-connected group of the skin's own colours
    const lab = new Int32Array(fw * fh).fill(-1), groups = [];
    for (let j0 = 0; j0 < fw * fh; j0++) {
      if (lab[j0] >= 0 || !op(j0 % fw, (j0 - (j0 % fw)) / fw) || !skinC.has(key(f.rgba, j0 * 4))) continue;
      const g = { n: 0, x0: fw, y0: fh, x1: -1, y1: -1 }, st = [j0]; lab[j0] = groups.length;
      while (st.length) { const j = st.pop(), x = j % fw, y = (j - x) / fw; g.n++; g.x0 = Math.min(g.x0, x); g.x1 = Math.max(g.x1, x); g.y0 = Math.min(g.y0, y); g.y1 = Math.max(g.y1, y);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const X = x + dx, Y = y + dy, q = Y * fw + X; if (X >= 0 && Y >= 0 && X < fw && Y < fh && lab[q] < 0 && op(X, Y) && skinC.has(key(f.rgba, q * 4))) { lab[q] = groups.length; st.push(q); } } }
      groups.push(g);
    }
    const face = groups.sort((a, b) => b.n - a.n)[0];
    if (!face) continue;
    const cx = Math.round((face.x0 + face.x1) / 2), cy = face.y0 - 6;
    // the head down to the chin (the collar and its strap stay); the eyes and brows, drawn in the hair's browns, at the front of the face (the figure faces left)
    h.head[f.name] = [Math.max(0, face.x0 - 11), Math.max(0, face.y0 - 32), Math.min(fw - 1, cx + 26), Math.min(fh - 1, face.y1)];   // the fringe hangs 9 texels before the face, the crown up to 30 above it: a raised glove stays out
    h.clear[f.name] = [[Math.max(0, face.x0 - 2), Math.max(0, face.y0 - 3), Math.min(fw - 1, face.x0 + 8), Math.min(fh - 1, face.y0 + 2)]];
  }
}
