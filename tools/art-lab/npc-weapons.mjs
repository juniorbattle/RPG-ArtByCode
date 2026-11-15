// The townsfolk templates' weapons (journal Passe PN1, src/characters/NpcWeapons.ts): the line of the template's sword in every frame of npc-m-x3-combat and
// npc-f-x3-combat, pinned in art-lab/characters/variants/npc.json (`weapon`), and the review pages of every weapon of the list drawn along it.
//   node tools/art-lab/npc-weapons.mjs <outDir> [--find] [--refind=<frame,...>] [--look=skin,hair,cloak] [--only=<frame,...>] [--scale=2]
// --find     writes the line of every frame that has none (a frame written by hand is never touched; --refind forgets those frames first): the sword's steel
//            (its light colours) in 8-connected groups, the largest and the groups along its line, their principal axis; the hilt end is the end with the hand's
//            skin plainly nearer, else the end nearer the body; the crossguard the widest place of the steel within 12 texels of that end, the tip the far end. A line the
//            finder cannot read is written by hand (the man's brace, skillDef.1: the crossguard by his left fist, his right hand on the flat near the tip).
// Writes, per sheet, pages of frames: the original, the sword taken out, then each weapon drawn (under --look's recolouring when given).
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { encodePng } from './png.mjs';

const ROOT = path.resolve(import.meta.dirname, '../..');
const args = process.argv.slice(2), outDir = args.find((a) => !a.startsWith('--'));
if (!outDir) throw new Error('usage: node tools/art-lab/npc-weapons.mjs <outDir> [--find] [--refind=<frame,...>] [--look=skin,hair,cloak] [--only=<frame,...>]');
const flag = (n) => args.includes(`--${n}`), opt = (n) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3);
const FILE = path.join(ROOT, 'art-lab/characters/variants/npc.json');
const file = JSON.parse(fs.readFileSync(FILE, 'utf8'));
const only = opt('only')?.split(','), scale = Number(opt('scale') ?? 2);
const lookArg = opt('look')?.split(','), look = lookArg ? { skin: lookArg[0] || undefined, hair: lookArg[1] || undefined, cloak: lookArg[2] || undefined } : null;
/** the template sword's light steel and its dark edge (lib/combat.mjs STEEL_RAMP: the sheets' only cool greys) */
const STEEL = ['eceef4', 'bec4d0', '848a98'], EDGE = ['4e5260', '2c2e3a'];
fs.mkdirSync(outDir, { recursive: true });

const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
try {
  const { decodePng } = await server.ssrLoadModule('/src/characters/BakedDecode.ts');
  const { namedFrames } = await server.ssrLoadModule('/src/characters/FighterSkins.ts');
  const { sheetMaterials, recolorLook } = await server.ssrLoadModule('/src/characters/HeroLook.ts');
  const { NPC_WEAPONS, eraseSword, drawWeapon, handsOf, centreLine } = await server.ssrLoadModule('/src/characters/NpcWeapons.ts');
  for (const sheetId of Object.keys(file.sheets)) {
    const sv = file.sheets[sheetId];
    const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${sheetId}.png`))));
    const { fw, fh, frames } = namedFrames(img, JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${sheetId}.json`), 'utf8')), true);
    const skin = new Set([...sv.skin.skin, ...(sv.skin.shade ?? [])].map((c) => parseInt(c, 16)));
    sv.weapon ??= { steel: STEEL, edge: EDGE, frames: {} };
    const re = opt('refind')?.split(',') ?? [];
    for (const n of re) delete sv.weapon.frames[n];
    if (flag('find') || re.length) for (const f of frames) if (!sv.weapon.frames[f.name]) { const seg = findLine(f.rgba, fw, fh, sv.weapon, skin); if (seg) sv.weapon.frames[f.name] = seg; else console.log(`  ${sheetId} ${f.name}: no sword found`); }
    if (flag('colours')) bladeColours(frames, fw, fh, sv.weapon.frames);
    if (flag('remnants')) bladeColours(frames.map((f) => (sv.weapon.frames[f.name] ? { ...f, rgba: eraseSword(f.rgba, fw, fh, sv.weapon.frames[f.name], sv.weapon, handsOf(f.rgba, fw, fh, sv.weapon.frames[f.name], skin)) } : f)), fw, fh, sv.weapon.frames);
    const maps = look ? sheetMaterials(frames, fw, fh, sv) : null;
    const list = frames.map((f, n) => ({ f, n })).filter(({ f }) => !only || only.includes(f.name));
    const cols = 2 + NPC_WEAPONS.length, gap = 6, per = Number(opt('per') ?? 6);
    for (let p = 0; p * per < list.length; p++) {
      const part = list.slice(p * per, (p + 1) * per), boxes = part.map(({ f }) => figureBox(f.rgba, fw, fh, 22));
      const bw = Math.max(...boxes.map((b) => (b[2] - b[0] + 1) * scale)), bh = Math.max(...boxes.map((b) => (b[3] - b[1] + 1) * scale));
      const W = gap + cols * (bw + gap), H = gap + part.length * (bh + gap), px = Buffer.alloc(W * H * 4);
      for (let i = 0; i < W * H; i++) px.set([44, 50, 66, 255], i * 4);
      part.forEach(({ f, n }, row) => {
        const base = maps ? recolorLook(f.rgba, maps[n], file, look) : f.rgba, pinned = sv.weapon.frames[f.name], seg = pinned && centreLine(f.rgba, fw, fh, pinned, sv.weapon), hands = seg ? handsOf(f.rgba, fw, fh, seg, skin) : null;
        const cells = [f.rgba, seg ? eraseSword(base, fw, fh, seg, sv.weapon, hands) : base, ...NPC_WEAPONS.map((k) => (seg ? drawWeapon(eraseSword(base, fw, fh, seg, sv.weapon, hands), fw, fh, seg, k, hands) : base))];
        cells.forEach((c, col) => blit(px, W, c, fw, boxes[row], gap + col * (bw + gap), gap + row * (bh + gap), scale));
        if (seg) { mark(px, W, boxes[row], gap, gap + row * (bh + gap), scale, Math.round(seg[0]), Math.round(seg[1]), [255, 60, 60]); mark(px, W, boxes[row], gap, gap + row * (bh + gap), scale, Math.round(seg[2]), Math.round(seg[3]), [60, 220, 255]); }
      });
      const name = `${sheetId}-weapons-${String(p + 1).padStart(2, '0')}.png`;
      fs.writeFileSync(path.join(outDir, name), encodePng(W, H, px));
      console.log(`  ${name}: ${part.map(({ f }) => f.name).join(' ')}`);
    }
    console.log(`${sheetId}: ${Object.keys(sv.weapon.frames).length} lines of ${frames.length} frames`);
  }
  if (flag('find') || opt('refind')) fs.writeFileSync(FILE, compact(file) + '\n');
} finally { await server.close(); }

/** --colours: per colour, the share of its texels lying on the blade (within 2.5 texels of a line, past the crossguard): the colours a blade was drawn in */
function bladeColours(frames, fw, fh, lines) {
  const tot = new Map(), on = new Map(), hex = (r, i) => [r[i], r[i + 1], r[i + 2]].map((v) => v.toString(16).padStart(2, '0')).join('');
  for (const f of frames) { const seg = lines[f.name]; for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const i = (y * fw + x) * 4; if (f.rgba[i + 3] < 128) continue; const k = hex(f.rgba, i); tot.set(k, (tot.get(k) ?? 0) + 1); if (!seg) continue; const L = Math.hypot(seg[2] - seg[0], seg[3] - seg[1]), dx = (seg[2] - seg[0]) / L, dy = (seg[3] - seg[1]) / L, s = (x - seg[0]) * dx + (y - seg[1]) * dy, r = (x - seg[0]) * -dy + (y - seg[1]) * dx; if (s >= 1 && s <= L + 1 && Math.abs(r) <= 2.5) on.set(k, (on.get(k) ?? 0) + 1); } }
  const rows = [...on.entries()].map(([k, n]) => [k, n, tot.get(k), n / tot.get(k)]).filter((r) => r[1] >= 8).sort((a, b) => b[3] - a[3]);
  for (const r of rows.slice(0, 30)) console.log('   ', r[0], String(r[1]).padStart(5), 'of', String(r[2]).padStart(6), (100 * r[3]).toFixed(0) + '%');
}
/** the sword's line in a frame (see the header), rounded to texels, or null: among the blade's texels (its steel and the greys its shading took), the line that holds the
 *  longest unbroken run of them (pairs of texels tried in a fixed order, inliers within 1.3 texels, gaps of 5 at most), refined on that run; the hilt end is the end with
 *  the hand's skin near it (a skin group reaching out of the line), else the end where the steel spreads widest (the crossguard) */
function findLine(rgba, fw, fh, w, skin) {
  const blade = new Set([...w.steel, ...w.blade].map((c) => parseInt(c, 16))), steel = new Set(w.steel.map((c) => parseInt(c, 16))), key = (i) => (rgba[i] << 16) | (rgba[i + 1] << 8) | rgba[i + 2];
  const pts = [];
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) { const i = (y * fw + x) * 4; if (rgba[i + 3] >= 128 && blade.has(key(i))) pts.push([x, y, steel.has(key(i))]); }
  const lit = pts.filter((p) => p[2]);
  if (lit.length < 8) return null;
  const runOf = (ax, ay, dx, dy, set) => {
    const on = set.map((p) => [(p[0] - ax) * dx + (p[1] - ay) * dy, Math.abs((p[0] - ax) * -dy + (p[1] - ay) * dx), p]).filter((q) => q[1] <= 1.3).sort((a, b) => a[0] - b[0]);
    let best = [0, 0], start = 0;
    for (let k = 1; k <= on.length; k++) if (k === on.length || on[k][0] - on[k - 1][0] > 5) { const n = on.slice(start, k).filter((q) => q[2][2]).length; if (n > best[1]) best = [start, n, k]; start = k; }
    return { run: on.slice(best[0], best[2]), n: best[1] };
  };
  let top = null;
  const step = Math.max(1, Math.floor(lit.length / 60));
  for (let a = 0; a < lit.length; a += step) for (let b = a + 1; b < lit.length; b += step) {
    const [x0, y0] = lit[a], [x1, y1] = lit[b], L = Math.hypot(x1 - x0, y1 - y0); if (L < 8) continue;
    const dx = (x1 - x0) / L, dy = (y1 - y0) / L, r = runOf(x0, y0, dx, dy, pts);
    if (!top || r.n > top.n) top = { ...r, x0, y0, dx, dy };
  }
  if (!top || top.n < 8) return null;
  // refine on the run: its principal axis
  const P = top.run.map((q) => q[2]), mx = P.reduce((s, p) => s + p[0], 0) / P.length, my = P.reduce((s, p) => s + p[1], 0) / P.length;
  let sxx = 0, syy = 0, sxy = 0; for (const [x, y] of P) { sxx += (x - mx) ** 2; syy += (y - my) ** 2; sxy += (x - mx) * (y - my); }
  const th = 0.5 * Math.atan2(2 * sxy, sxx - syy), dx = Math.cos(th), dy = Math.sin(th);
  const ss = P.map(([x, y]) => (x - mx) * dx + (y - my) * dy), lo = Math.min(...ss), hi = Math.max(...ss), at = (s) => [mx + s * dx, my + s * dy];
  const skinNear = (s) => { const [cx, cy] = at(s); let n = 0; for (let y = Math.round(cy) - 5; y <= Math.round(cy) + 5; y++) for (let x = Math.round(cx) - 5; x <= Math.round(cx) + 5; x++) if (x >= 0 && y >= 0 && x < fw && y < fh && rgba[(y * fw + x) * 4 + 3] >= 128 && skin.has(key((y * fw + x) * 4)) && Math.abs((x - mx) * -dy + (y - my) * dx) > 2) n++; return n; };
  const spread = (s0, s1) => pts.filter((p) => { const s = (p[0] - mx) * dx + (p[1] - my) * dy; return p[2] && s >= Math.min(s0, s1) && s <= Math.max(s0, s1); }).reduce((m, p) => Math.max(m, Math.abs((p[0] - mx) * -dy + (p[1] - my) * dx)), 0);
  // the body: the figure's texels more than 6 texels off the line; the hilt is the end nearer its centre (the tip reaches out), unless the hand's skin is plainly nearer the other end
  let bx = 0, by = 0, bn = 0;
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (rgba[(y * fw + x) * 4 + 3] >= 128 && Math.abs((x - mx) * -dy + (y - my) * dx) > 6) { bx += x; by += y; bn++; }
  const dist = (s) => { const [px, py] = at(s); return Math.hypot(px - bx / bn, py - by / bn); };
  const a = skinNear(lo), b = skinNear(hi), hiltLo = Math.abs(a - b) >= 8 ? a > b : dist(lo) <= dist(hi);
  const end = hiltLo ? lo : hi, dir = hiltLo ? 1 : -1, tip = hiltLo ? hi : lo;
  let guard = end, best = -1;
  for (let k = 0; k <= 10; k++) { const s = end + dir * k, wv = spread(s - 0.6, s + 0.6); if (wv > best + 0.5) { best = wv; guard = s; } }
  const [hx, hy] = at(guard), [tx, ty] = at(tip);
  return [Math.round(hx), Math.round(hy), Math.round(tx), Math.round(ty)];
}
function figureBox(rgba, fw, fh, pad) {
  let x0 = fw, y0 = fh, x1 = -1, y1 = -1;
  for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) if (rgba[(y * fw + x) * 4 + 3] >= 128) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
  return [Math.max(0, x0 - pad), Math.max(0, y0 - pad), Math.min(fw - 1, x1 + pad), Math.min(fh - 1, y1 + pad)];
}
function blit(px, W, src, fw, box, ox, oy, s) {
  for (let y = box[1]; y <= box[3]; y++) for (let x = box[0]; x <= box[2]; x++) {
    const i = (y * fw + x) * 4; if (src[i + 3] < 128) continue;
    for (let dy = 0; dy < s; dy++) for (let dx = 0; dx < s; dx++) { const j = ((oy + (y - box[1]) * s + dy) * W + ox + (x - box[0]) * s + dx) * 4; px[j] = src[i]; px[j + 1] = src[i + 1]; px[j + 2] = src[i + 2]; }
  }
}
function mark(px, W, box, ox, oy, s, x, y, col) {
  if (x < box[0] || x > box[2] || y < box[1] || y > box[3]) return;
  for (let k = 0; k < s; k++) { const j = ((oy + (y - box[1]) * s + k) * W + ox + (x - box[0]) * s + k) * 4; px[j] = col[0]; px[j + 1] = col[1]; px[j + 2] = col[2]; }
}
/** JSON with every array of numbers or strings on one line */
function compact(v) { return JSON.stringify(v, null, 2).replace(/\[\s*([^[\]{}]*?)\s*\]/g, (m, inner) => `[${inner.split(/,\s*/).join(', ')}]`); }
