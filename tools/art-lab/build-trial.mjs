// Build a LAB character at another density than x2 (Art Lab, development only; never a runtime / build step). The chain of
// build-character.mjs (which stays as it is: its SHA-256 is pinned in the approved provenance packs) with the frame size the rig declares:
//   node tools/art-lab/build-trial.mjs <art-lab/characters/rigs/<id>.rig.mjs> [--check] [--keep <dir>]
// The rig exports `id`, `frame` ({ W, H, FOOT }: 32k x 48k, feet on 45k), `source` (the archived sheet, the pitch, one crop per facing it
// builds, the pinned palette, the reconstruct-grid options), `prepare(dir, view)` and `frames(views)`. Chain:
//   sheet -> reconstruct-grid.mjs (full colours) -> quantize-palette.mjs (--palette-from the pinned palette) -> prepare -> frames -> frame checks
//   (transparent border ring, binary alpha, idle on the foot row) -> Aseprite (batch): <id>.aseprite + sheet PNG + JSON (tags <anim>-<dir>)
//   -> every exported frame compared pixel for pixel with the rig's frame.
// Writes art-lab/characters/provenance/<id>/view-<dir>.png and build.json, source/<id>.aseprite, exports/<id>.png|json, and the file table of
// provenance/<id>/PROVENANCE.json (written first by hand). --check rebuilds into a temporary folder and compares with the committed files.
// First use: hero-x4-trial, the arena fighters' density trial (journal Passe AA2).
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
const check = flag('--check'), keep = optv('--keep');
const rigFile = args[0];
if (!rigFile) { console.error('usage: node tools/art-lab/build-trial.mjs <rig.mjs> [--check] [--keep <dir>]'); process.exit(2); }
const rig = await import(pathToFileURL(path.resolve(rigFile)).href);
const id = rig.id, S = rig.source, { W: FW, H: FH, FOOT } = rig.frame, DIRS = Object.keys(S.views);
if (FW % 32 || FH !== FW * 1.5 || FOOT !== (FH / 48) * 45) throw new Error(`${id}: frame ${FW} x ${FH} / ${FOOT} is not 32k x 48k with the feet on 45k`);
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

/** the runtime loader's frame contract (BakedSprites.checkBakedSheet) at this frame size */
function checkFrame(name, im, anim) {
  const err = []; let ring = 0, last = -1, semi = 0;
  if (im.W !== FW || im.H !== FH) err.push(`${im.W} x ${im.H}, not ${FW} x ${FH}`);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    const a = im.px[(y * im.W + x) * 4 + 3]; if (a && a !== 255) semi++; if (a < 128) continue;
    last = y; if (!x || !y || x === im.W - 1 || y === im.H - 1) ring++;
  }
  if (semi) err.push(`${semi} semi-transparent texels`);
  if (ring) err.push(`${ring} texels on the border ring`);
  if (last > FOOT) err.push(`last opaque row ${last} below the foot row ${FOOT}`);
  if (anim === 'idle' && last !== FOOT) err.push(`idle frame must stand on row ${FOOT} (last row ${last})`);
  if (err.length) throw new Error(`${name}: ${err.join('; ')}`);
}

// 1. reconstruction of every facing the rig names
const recon = {};
for (const dir of DIRS) {
  const pre = path.join(work, `recon-${dir}`);
  const ropt = [...(S.options?.holes ? ['--holes'] : []), ...(S.options?.noShadow ? ['--no-shadow'] : []), ...(S.options?.bgThreshold ? [`--bg-threshold=${S.options.bgThreshold}`] : []), ...(S.options?.closingFrom !== undefined ? [`--closing-from=${S.options.closingFrom}`] : [])];
  execFileSync(node, [tool('reconstruct-grid.mjs'), repo(S.sheet), S.views[dir], String(S.pitch), String(FW), String(FH), String(FOOT), pre, 'full', ...ropt], { stdio: 'ignore' });
  recon[dir] = `${pre}-full.png`;
}
// 2. the pinned palette
const qdir = path.join(work, 'q');
execFileSync(node, [tool('quantize-palette.mjs'), '--palette-from', repo(S.palette.from), '--out', qdir, ...Object.values(recon)], { stdio: 'ignore' });
const palReport = JSON.parse(fs.readFileSync(path.join(qdir, 'palette.json'), 'utf8'));
// 3. prepared views
const V = {};
for (const dir of DIRS) { V[dir] = rig.prepare(dir, R.load(path.join(qdir, `recon-${dir}-full-q.png`))); R.save(path.join(packDir, `view-${dir}.png`), V[dir]); }
// 4. frames, checked like the runtime loader checks them
const frames = rig.frames(V), order = [];
for (const anim of ['idle', 'walk', 'talk', 'hammer']) for (const dir of DIRS) { const fs_ = frames.filter((f) => f.anim === anim && f.dir === dir).sort((a, b) => a.i - b.i); if (fs_.length) order.push({ tag: `${anim}-${dir}`, anim, list: fs_ }); }
for (const g of order) for (const f of g.list) checkFrame(`${g.tag}-${f.i}`, f.im, f.anim);
const fdir = path.join(work, 'frames'); fs.mkdirSync(fdir, { recursive: true });
const RATE = { idle: 1.7, walk: 7.5, talk: 4, hammer: 5.5 }, lines = [], tags = []; let n = 0;
for (const g of order) {
  tags.push(`${g.tag}|${n}|${n + g.list.length - 1}`);
  for (const f of g.list) { const p = path.join(fdir, `${String(n).padStart(3, '0')}-${g.tag}-${f.i}.png`); R.save(p, f.im); lines.push(`${p.replace(/\\/g, '/')}|${Math.round(1000 / RATE[g.anim])}`); n++; }
}
// 5. Aseprite: the source (.aseprite) and the export (sheet PNG + JSON array with frame tags)
if (!ase) { console.error('Aseprite not found (set ASEPRITE_PATH)'); process.exit(2); }
const list = path.join(work, 'frames.txt'), tagf = path.join(work, 'tags.txt'), lua = path.join(work, 'assemble.lua');
fs.writeFileSync(list, lines.join('\n') + '\n'); fs.writeFileSync(tagf, tags.join('\n') + '\n');
fs.writeFileSync(lua, `
local p = app.params
local spr = Sprite(${FW}, ${FH}, ColorMode.RGB)
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
  for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
    const a = f.im.px.subarray((y * FW + x) * 4, (y * FW + x) * 4 + 4), si = ((r.y + y) * sheet.W + r.x + x) * 4, b = sheet.px.subarray(si, si + 4);
    if (a[3] !== b[3] || (a[3] && (a[0] !== b[0] || a[1] !== b[1] || a[2] !== b[2]))) mismatch++;
  }
}
if (mismatch) throw new Error(`exported sheet differs from the rig frames on ${mismatch} texels`);
const tagsOut = meta.meta.frameTags.map((t) => `${t.name}:${t.from}-${t.to}`).join(' ');
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const report = { id, frame: [FW, FH, FOOT], frames: n, tags: tagsOut, sheet: [sheet.W, sheet.H], palette: { mode: palReport.mode, colours: palReport.colours, views: palReport.views },
  views: Object.fromEntries(DIRS.map((d) => [d, sha(path.join(packDir, `view-${d}.png`))])) };
if (!check) {
  fs.writeFileSync(path.join(packDir, 'build.json'), JSON.stringify({ ...report, exports: { png: sha(out.png), json: sha(out.json), aseprite: sha(out.ase) } }, null, 1) + '\n');
  // the pack's file table (as build-character.mjs: text hashed with LF line endings, binaries as stored)
  const pf = path.join(packDir, 'PROVENANCE.json');
  if (fs.existsSync(pf)) {
    const P = JSON.parse(fs.readFileSync(pf, 'utf8')), rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
    const hashRule = (f) => { let b = fs.readFileSync(f); if (/\.(json|mjs|js|ts|md|txt)$/i.test(f)) b = Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n'), 'utf8'); return crypto.createHash('sha256').update(b).digest('hex'); };
    const files = [out.png, out.json, out.ase, ...DIRS.map((d) => path.join(packDir, `view-${d}.png`)), path.join(packDir, 'build.json'), repo(S.palette.from),
      path.resolve(rigFile), ...(rig.uses ?? []).map(repo), ...['build-trial.mjs', 'rig-engine.mjs', 'reconstruct-grid.mjs', 'quantize-palette.mjs', 'png.mjs'].map(tool)];
    P.files = Object.fromEntries(files.map((f) => [rel(f), hashRule(f)]));
    fs.writeFileSync(pf, JSON.stringify(P, null, 1) + '\n');
  }
  console.log(JSON.stringify(report));
} else {
  let bad = 0;
  const same = (a, b) => { const A = R.load(a), B = R.load(b); if (A.W !== B.W || A.H !== B.H) return false; for (let i = 0; i < A.px.length; i += 4) { if (A.px[i + 3] !== B.px[i + 3]) return false; if (A.px[i + 3] && (A.px[i] !== B.px[i] || A.px[i + 1] !== B.px[i + 1] || A.px[i + 2] !== B.px[i + 2])) return false; } return true; };
  for (const d of DIRS) { const ok = same(path.join(packDir, `view-${d}.png`), repo(`art-lab/characters/provenance/${id}/view-${d}.png`)); if (!ok) bad++; console.log(`${ok ? 'ok      ' : 'DIFFERS '} view-${d}.png`); }
  const okPng = same(out.png, repo(`art-lab/characters/exports/${id}.png`)); if (!okPng) bad++; console.log(`${okPng ? 'ok      ' : 'DIFFERS '} exports/${id}.png (pixels)`);
  const committed = JSON.parse(fs.readFileSync(repo(`art-lab/characters/exports/${id}.json`), 'utf8'));
  const table = (m) => JSON.stringify([m.frames.map((f) => [f.frame, f.duration]), m.meta.frameTags.map((t) => [t.name, t.from, t.to]), m.meta.size]);
  const okJson = table(committed) === table(meta); if (!okJson) bad++; console.log(`${okJson ? 'ok      ' : 'DIFFERS '} exports/${id}.json (frames, durations, tags)`);
  if (!keep) fs.rmSync(work, { recursive: true, force: true });
  console.log(bad ? `${bad} difference(s)` : `${id}: rebuilt identical`); process.exit(bad ? 1 : 0);
}
if (!keep) fs.rmSync(work, { recursive: true, force: true });
