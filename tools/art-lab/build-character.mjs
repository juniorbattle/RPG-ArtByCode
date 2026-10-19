// Build an animated baked character from its rig script (Art Lab, development only; never a runtime / build step).
//   node tools/art-lab/build-character.mjs <art-lab/characters/rigs/<id>.rig.mjs> [--check] [--views-only] [--keep <dir>]
// The rig script is the whole recipe: `source` (the archived sheet, the reconstruction pitch, one crop per facing, the palette mode, and the
// optional reconstruct-grid options for every facing: `options: { holes, noShadow, bgThreshold, closingFrom }`, off when absent),
// `prepare(dir, view)` (mirror / shift / recorded pixel edits of each reconstructed view) and `frames(views)` (the animation). Chain:
//   sheet -> reconstruct-grid.mjs (full colours, one per facing) -> quantize-palette.mjs (one palette for every facing) -> prepare ->
//   frames (rig-engine.mjs) -> frame checks (contract section 3) -> Aseprite (batch): <id>.aseprite + sheet PNG + JSON (tags <anim>-<dir>)
//   -> every exported frame compared pixel for pixel with the rig's frame.
// Writes art-lab/characters/provenance/<id>/view-<dir>.png, source/<id>.aseprite, exports/<id>.png|json and provenance/<id>/build.json.
// --check rebuilds into a temporary folder and compares every output with the committed files (pixels for the images, the frame
// table for the JSON): exit 1 on any difference. Needs Chrome / Edge (reconstruction) and Aseprite (ASEPRITE_PATH or a standard place).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as R from './rig-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2), flag = (n) => { const i = args.indexOf(n); if (i < 0) return false; args.splice(i, 1); return true; };
const optv = (n) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : null; };
const check = flag('--check'), viewsOnly = flag('--views-only'), keep = optv('--keep');
const rigFile = args[0];
if (!rigFile) { console.error('usage: node tools/art-lab/build-character.mjs <rig.mjs> [--check] [--views-only] [--keep <dir>]'); process.exit(2); }
const rig = await import(pathToFileURL(path.resolve(rigFile)).href);
// the facings built: front, back, profile, and the three-quarter ones (downSide, upSide; journal Passe H8) only when the rig's source names
// them (a view box or a kept export): every other rig builds exactly as before
const id = rig.id, S = rig.source, DIRS = ['down', 'up', 'side', ...['downSide', 'upSide'].filter((d) => S.views?.[d] || S.keep?.[d])];
const ase = [process.env.ASEPRITE_PATH, 'C:/Program Files/Aseprite/Aseprite.exe', 'C:/Program Files (x86)/Aseprite/Aseprite.exe',
  'C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe', '/Applications/Aseprite.app/Contents/MacOS/aseprite', '/usr/bin/aseprite'].filter(Boolean).find((p) => fs.existsSync(p));

const work = keep ? path.resolve(keep) : fs.mkdtempSync(path.join(os.tmpdir(), `artlab-${id}-`));
fs.mkdirSync(work, { recursive: true });
const repo = (rel) => path.join(ROOT, rel);
const packDir = check ? path.join(work, 'pack') : repo(`art-lab/characters/provenance/${id}`);
const out = check
  ? { ase: path.join(work, `${id}.aseprite`), png: path.join(work, `${id}.png`), json: path.join(work, `${id}.json`) }
  : { ase: repo(`art-lab/characters/source/${id}.aseprite`), png: repo(`art-lab/characters/exports/${id}.png`), json: repo(`art-lab/characters/exports/${id}.json`) };
fs.mkdirSync(packDir, { recursive: true });
const node = process.execPath, tool = (t) => path.join(ROOT, 'tools', 'art-lab', t);

// 1. reconstruction of every facing taken from the sheet (a facing may instead reuse an approved export: S.keep[dir])
const recon = {};
for (const dir of DIRS) {
  if (S.keep?.[dir]) continue;
  const pre = path.join(work, `recon-${dir}`);
  const ropt = [...(S.options?.holes ? ['--holes'] : []), ...(S.options?.noShadow ? ['--no-shadow'] : []), ...(S.options?.bgThreshold ? [`--bg-threshold=${S.options.bgThreshold}`] : []), ...(S.options?.closingFrom !== undefined ? [`--closing-from=${S.options.closingFrom}`] : [])];
  execFileSync(node, [tool('reconstruct-grid.mjs'), repo(S.sheet), S.views[dir], String(S.pitch), String(R.FW), String(R.FH), String(R.FOOT), pre, 'full', ...ropt], { stdio: 'ignore' });
  recon[dir] = `${pre}-full.png`;
}
// 2. one palette for every facing
const qdir = path.join(work, 'q'), qargs = S.palette.from ? ['--palette-from', repo(S.palette.from)] : ['--k', String(S.palette.k)];
execFileSync(node, [tool('quantize-palette.mjs'), ...qargs, '--out', qdir, ...Object.values(recon)], { stdio: 'ignore' });
const palReport = JSON.parse(fs.readFileSync(path.join(qdir, 'palette.json'), 'utf8'));
// 3. prepared views
const V = {};
for (const dir of DIRS) {
  const base = S.keep?.[dir] ? R.load(repo(S.keep[dir])) : R.load(path.join(qdir, `recon-${dir}-full-q.png`));
  V[dir] = rig.prepare(dir, base);
  if (!S.keep?.[dir]) R.save(path.join(packDir, `view-${dir}.png`), V[dir]);
}
if (viewsOnly) { console.log(`views written to ${packDir}`); process.exit(0); }
// 4. frames, checked like the runtime loader checks them
const frames = rig.frames(V), order = [];
for (const anim of ['idle', 'walk', 'talk', 'hammer']) for (const dir of DIRS) { const fs_ = frames.filter((f) => f.anim === anim && f.dir === dir).sort((a, b) => a.i - b.i); if (fs_.length) order.push({ tag: `${anim}-${dir}`, anim, list: fs_ }); }
const counts = {};
for (const g of order) { for (const f of g.list) R.check(`${g.tag}-${f.i}`, f.im, f.anim); counts[g.anim] ??= g.list.length; if (counts[g.anim] !== g.list.length) throw new Error(`${g.tag}: ${g.list.length} frames, another facing has ${counts[g.anim]}`); }
const fdir = path.join(work, 'frames'); fs.mkdirSync(fdir, { recursive: true });
const RATE = { idle: 1.7, walk: 7.5, talk: 4, hammer: 5.5 }, lines = [], tags = []; let n = 0;
for (const g of order) {
  tags.push(`${g.tag}|${n}|${n + g.list.length - 1}`);
  for (const f of g.list) { const p = path.join(fdir, `${String(n).padStart(3, '0')}-${g.tag}-${f.i}.png`); R.save(p, f.im); lines.push(`${p.replace(/\\/g, '/')}|${Math.round(1000 / RATE[g.anim])}`); n++; }
}
// 5. Aseprite: the production source (.aseprite) and the runtime-ready export (sheet PNG + JSON array with frame tags)
if (!ase) { console.error('Aseprite not found (set ASEPRITE_PATH)'); process.exit(2); }
const list = path.join(work, 'frames.txt'), tagf = path.join(work, 'tags.txt'), lua = path.join(work, 'assemble.lua');
fs.writeFileSync(list, lines.join('\n') + '\n'); fs.writeFileSync(tagf, tags.join('\n') + '\n');
fs.writeFileSync(lua, `
local p = app.params
local spr = Sprite(${R.FW}, ${R.FH}, ColorMode.RGB)
spr.layers[1].name = "Layer"
local i = 0
for line in io.lines(p.list) do
  local file, dur = line:match("^(.*)|(%d+)$")
  i = i + 1
  if i > 1 then spr:newEmptyFrame(i) end
  spr:newCel(spr.layers[1], i, Image{ fromFile = file }, Point(0, 0))
  spr.frames[i].duration = tonumber(dur) / 1000
end
for line in io.lines(p.tags) do
  local name, a, b = line:match("^(.*)|(%d+)|(%d+)$")
  local t = spr:newTag(tonumber(a) + 1, tonumber(b) + 1)
  t.name = name
end
spr:saveAs(p.out)
`);
const outAse = out.ase.replace(/\\/g, '/');
fs.mkdirSync(path.dirname(out.ase), { recursive: true }); fs.mkdirSync(path.dirname(out.png), { recursive: true });
execFileSync(ase, ['-b', '--script-param', `list=${list.replace(/\\/g, '/')}`, '--script-param', `tags=${tagf.replace(/\\/g, '/')}`, '--script-param', `out=${outAse}`, '--script', lua.replace(/\\/g, '/')], { stdio: 'ignore' });
execFileSync(ase, ['-b', outAse, '--sheet', out.png.replace(/\\/g, '/'), '--data', out.json.replace(/\\/g, '/'), '--format', 'json-array', '--list-tags', '--sheet-type', 'rows', '--sheet-columns', '6'], { stdio: 'ignore' });
// 6. the export must hold exactly the rig's frames
const sheet = R.load(out.png), meta = JSON.parse(fs.readFileSync(out.json, 'utf8'));
if (meta.frames.length !== n) throw new Error(`export holds ${meta.frames.length} frames, the rig made ${n}`);
let k = 0, mismatch = 0;
for (const g of order) for (const f of g.list) {
  const r = meta.frames[k++].frame;
  for (let y = 0; y < R.FH; y++) for (let x = 0; x < R.FW; x++) {
    const a = f.im.px.subarray((y * R.FW + x) * 4, (y * R.FW + x) * 4 + 4), si = ((r.y + y) * sheet.W + r.x + x) * 4, b = sheet.px.subarray(si, si + 4);
    if (a[3] !== b[3] || (a[3] && (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]))) mismatch++;
  }
}
const tagsOut = meta.meta.frameTags.map((t) => `${t.name}:${t.from}-${t.to}`).join(' ');
if (mismatch) throw new Error(`exported sheet differs from the rig frames on ${mismatch} texels`);
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const report = { id, frames: n, tags: tagsOut, sheet: [sheet.W, sheet.H], palette: { mode: palReport.mode, colours: palReport.colours, views: palReport.views },
  views: Object.fromEntries(DIRS.filter((d) => !S.keep?.[d]).map((d) => [d, sha(path.join(packDir, `view-${d}.png`))])) };
if (!check) {
  fs.writeFileSync(path.join(packDir, 'build.json'), JSON.stringify({ ...report, exports: { png: sha(out.png), json: sha(out.json), aseprite: sha(out.ase) } }, null, 1) + '\n');
  // the pack's file table (PROVENANCE.json `files`, verified by verify-provenance.mjs): the chain's inputs, tools and outputs. Text files
  // are hashed with LF line endings (hashRule of the packs), binaries as stored.
  const pf = path.join(packDir, 'PROVENANCE.json');
  if (fs.existsSync(pf)) {
    const P = JSON.parse(fs.readFileSync(pf, 'utf8')), rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
    const hashRule = (f) => { let b = fs.readFileSync(f); if (/\.(json|mjs|js|ts|md|txt)$/i.test(f)) b = Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n'), 'utf8'); return crypto.createHash('sha256').update(b).digest('hex'); };
    // the palette a rig maps its views onto is an input too (an archived palette.png, or an approved export)
    const list = [out.png, out.json, out.ase, ...DIRS.filter((d) => !S.keep?.[d]).map((d) => path.join(packDir, `view-${d}.png`)), path.join(packDir, 'build.json'),
      ...(S.palette.from ? [repo(S.palette.from)] : []),
      path.resolve(rigFile), ...['build-character.mjs', 'rig-engine.mjs', 'reconstruct-grid.mjs', 'quantize-palette.mjs', 'png.mjs'].map(tool)];
    P.files = Object.fromEntries(list.map((f) => [rel(f), hashRule(f)]));
    fs.writeFileSync(pf, JSON.stringify(P, null, 1) + '\n');
  }
  console.log(JSON.stringify(report));
} else {
  // compare with the committed outputs: pixels (PNG compression is not part of the contract) and the frame table / tags
  let bad = 0;
  const same = (a, b) => { const A = R.load(a), B = R.load(b); if (A.W !== B.W || A.H !== B.H) return false; for (let i = 0; i < A.px.length; i += 4) { if (A.px[i + 3] !== B.px[i + 3]) return false; if (A.px[i + 3] && (A.px[i] !== B.px[i] || A.px[i + 1] !== B.px[i + 1] || A.px[i + 2] !== B.px[i + 2])) return false; } return true; };
  for (const d of DIRS.filter((d) => !S.keep?.[d])) { const ok = same(path.join(packDir, `view-${d}.png`), repo(`art-lab/characters/provenance/${id}/view-${d}.png`)); if (!ok) bad++; console.log(`${ok ? 'ok      ' : 'DIFFERS '} view-${d}.png`); }
  const okPng = same(out.png, repo(`art-lab/characters/exports/${id}.png`)); if (!okPng) bad++; console.log(`${okPng ? 'ok      ' : 'DIFFERS '} exports/${id}.png (pixels)`);
  const committed = JSON.parse(fs.readFileSync(repo(`art-lab/characters/exports/${id}.json`), 'utf8'));
  const table = (m) => JSON.stringify([m.frames.map((f) => [f.frame, f.duration]), m.meta.frameTags.map((t) => [t.name, t.from, t.to]), m.meta.size]);
  const okJson = table(committed) === table(meta); if (!okJson) bad++; console.log(`${okJson ? 'ok      ' : 'DIFFERS '} exports/${id}.json (frames, durations, tags)`);
  if (!keep) fs.rmSync(work, { recursive: true, force: true });
  console.log(bad ? `${bad} difference(s)` : `${id}: rebuilt identical`); process.exit(bad ? 1 : 0);
}
if (!keep) fs.rmSync(work, { recursive: true, force: true });
