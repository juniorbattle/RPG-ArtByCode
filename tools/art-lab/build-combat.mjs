// Build a fighter's COMBAT sheet for the arena (Art Lab, development only; never a runtime / build step): frames of the arena's cell at density
// k (FighterArt's 64 x 96 town pixels: 64k x 96k texels, the feet on row 90k, the body axis on column 32k, facing left), one Aseprite tag per
// clip `<clip>-side` (the arena's keys `<id>/side/<clip>.<i>/0`). The town's tools stay as they are (build-character.mjs is pinned in the
// approved packs; build-trial.mjs in the trial packs): the same assembly and checks as build-trial.mjs, for the cell and the combat clips.
//   node tools/art-lab/build-combat.mjs <art-lab/characters/rigs/<id>.rig.mjs> [--check]
// The rig exports `id`, `frame` ({ W, H, FOOT, AXIS, K }), `clips` ({ clip: frame count }, in the sheet's order), `SHEETS` and `PALETTE`
// (the files it reads, hashed into the pack), `frames()` ([{ anim: clip, dir: 'side', i, im }], its own reconstruction and rig) and
// `placement` (filled by frames()). Writes source/<id>.aseprite, exports/<id>.png|json, provenance/<id>/build.json and the file table of
// provenance/<id>/PROVENANCE.json (written first by hand). --check rebuilds into a temporary folder and compares with the committed files.
// First use: hero-x3-combat, Ren's first combat sheet (journal Passe RC1).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import * as R from './rig-engine.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const args = process.argv.slice(2), check = args.includes('--check'), rigFile = args.find((a) => !a.startsWith('--'));
if (!rigFile) { console.error('usage: node tools/art-lab/build-combat.mjs <rig.mjs> [--check]'); process.exit(2); }
const rig = await import(pathToFileURL(path.resolve(rigFile)).href);
const id = rig.id, { W: FW, H: FH, FOOT, AXIS, K } = rig.frame;
if (FW !== 64 * K || FH !== 96 * K || FOOT !== 90 * K || AXIS !== 32 * K) throw new Error(`${id}: frame ${FW} x ${FH} / ${FOOT} / ${AXIS} is not the arena cell at x${K}`);
const ase = [process.env.ASEPRITE_PATH, 'C:/Program Files/Aseprite/Aseprite.exe', 'C:/Program Files (x86)/Aseprite/Aseprite.exe',
  'C:/Program Files (x86)/Steam/steamapps/common/Aseprite/Aseprite.exe', '/Applications/Aseprite.app/Contents/MacOS/aseprite', '/usr/bin/aseprite'].filter(Boolean).find((p) => fs.existsSync(p));
if (!ase) { console.error('Aseprite not found (set ASEPRITE_PATH)'); process.exit(2); }

const work = fs.mkdtempSync(path.join(os.tmpdir(), `artlab-${id}-`));
const repo = (rel) => path.join(ROOT, rel);
const out = check
  ? { ase: path.join(work, `${id}.aseprite`), png: path.join(work, `${id}.png`), json: path.join(work, `${id}.json`) }
  : { ase: repo(`art-lab/characters/source/${id}.aseprite`), png: repo(`art-lab/characters/exports/${id}.png`), json: repo(`art-lab/characters/exports/${id}.json`) };
const packDir = repo(`art-lab/characters/provenance/${id}`);
fs.mkdirSync(packDir, { recursive: true });

/** the arena's frame contract for a cell: its size, binary alpha, a transparent one-texel ring, every frame standing on the foot row */
function checkFrame(name, im) {
  const err = []; let ring = 0, last = -1, semi = 0;
  if (im.W !== FW || im.H !== FH) err.push(`${im.W} x ${im.H}, not ${FW} x ${FH}`);
  for (let y = 0; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    const a = im.px[(y * im.W + x) * 4 + 3]; if (a && a !== 255) semi++; if (a < 128) continue;
    last = y; if (!x || !y || x === im.W - 1 || y === im.H - 1) ring++;
  }
  if (semi) err.push(`${semi} semi-transparent texels`);
  if (ring) err.push(`${ring} texels on the border ring`);
  if (last !== FOOT) err.push(`last opaque row ${last}, not the foot row ${FOOT}`);
  if (err.length) throw new Error(`${name}: ${err.join('; ')}`);
}

// 1. the rig's frames, in the clips' order, checked
const frames = rig.frames(), order = [];
for (const [clip, n] of Object.entries(rig.clips)) {
  const list = frames.filter((f) => f.anim === clip && f.dir === 'side').sort((a, b) => a.i - b.i);
  if (list.length !== n || list.some((f, j) => f.i !== j)) throw new Error(`${clip}: ${list.length} frames, the rig declares ${n}`);
  order.push({ tag: `${clip}-side`, clip, list });
}
if (frames.length !== order.reduce((s, g) => s + g.list.length, 0)) throw new Error('the rig made frames outside its declared clips');
for (const g of order) for (const f of g.list) checkFrame(`${g.tag}-${f.i}`, f.im);
// the frame durations Aseprite shows (the engine picks a frame by the simulation's clock, FighterArt's clipFrame): a loop at its rate
const LOOP = { idle: 1.7, ready: 1.7, recover: 2.5, victory: 1.4 };
const fdir = path.join(work, 'frames'); fs.mkdirSync(fdir, { recursive: true });
const lines = [], tags = []; let n = 0;
for (const g of order) {
  tags.push(`${g.tag}|${n}|${n + g.list.length - 1}`);
  for (const f of g.list) { const p = path.join(fdir, `${String(n).padStart(3, '0')}-${g.tag}-${f.i}.png`); R.save(p, f.im); lines.push(`${p.replace(/\\/g, '/')}|${LOOP[g.clip] ? Math.round(1000 / LOOP[g.clip]) : 100}`); n++; }
}
// 2. Aseprite: the source (.aseprite) and the export (sheet PNG + JSON array with frame tags)
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
// 3. the export must hold exactly the rig's frames
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
const sha = (f) => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const colours = R.paletteOf(...frames.map((f) => f.im)).length;
const report = { id, cell: [FW, FH, FOOT, AXIS], k: K, frames: n, tags: meta.meta.frameTags.map((t) => `${t.name}:${t.from}-${t.to}`).join(' '), sheet: [sheet.W, sheet.H],
  colours, palette: rig.PALETTE.path, sheets: Object.fromEntries(Object.entries(rig.SHEETS).map(([key, s]) => [key, { path: s.path, pitch: s.pitch }])), placement: rig.placement };
if (!check) {
  fs.writeFileSync(path.join(packDir, 'build.json'), JSON.stringify({ ...report, exports: { png: sha(out.png), json: sha(out.json), aseprite: sha(out.ase) } }, null, 1) + '\n');
  // the pack's file table (as build-character.mjs: text hashed with LF line endings, binaries as stored)
  const pf = path.join(packDir, 'PROVENANCE.json');
  if (fs.existsSync(pf)) {
    const P = JSON.parse(fs.readFileSync(pf, 'utf8')), rel = (f) => path.relative(ROOT, f).replace(/\\/g, '/');
    const hashRule = (f) => { let b = fs.readFileSync(f); if (/\.(json|mjs|js|ts|md|txt)$/i.test(f)) b = Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n'), 'utf8'); return crypto.createHash('sha256').update(b).digest('hex'); };
    const files = [out.png, out.json, out.ase, path.join(packDir, 'build.json'), repo(rig.PALETTE.path), ...Object.values(rig.SHEETS).map((s) => repo(s.path)),
      path.resolve(rigFile), ...['build-combat.mjs', 'rig-engine.mjs', 'reconstruct-grid.mjs', 'png.mjs'].map((t) => path.join(ROOT, 'tools', 'art-lab', t))];
    P.files = Object.fromEntries(files.map((f) => [rel(f), hashRule(f)]));
    fs.writeFileSync(pf, JSON.stringify(P, null, 1) + '\n');
  }
  console.log(JSON.stringify(report));
} else {
  const same = (a, b) => { const A = R.load(a), B = R.load(b); if (A.W !== B.W || A.H !== B.H) return false; for (let i = 0; i < A.px.length; i += 4) { if (A.px[i + 3] !== B.px[i + 3]) return false; if (A.px[i + 3] && (A.px[i] !== B.px[i] || A.px[i + 1] !== B.px[i + 1] || A.px[i + 2] !== B.px[i + 2])) return false; } return true; };
  let bad = 0;
  const okPng = same(out.png, repo(`art-lab/characters/exports/${id}.png`)); if (!okPng) bad++; console.log(`${okPng ? 'ok      ' : 'DIFFERS '} exports/${id}.png (pixels)`);
  const committed = JSON.parse(fs.readFileSync(repo(`art-lab/characters/exports/${id}.json`), 'utf8'));
  const table = (m) => JSON.stringify([m.frames.map((f) => [f.frame, f.duration]), m.meta.frameTags.map((t) => [t.name, t.from, t.to]), m.meta.size]);
  const okJson = table(committed) === table(meta); if (!okJson) bad++; console.log(`${okJson ? 'ok      ' : 'DIFFERS '} exports/${id}.json (frames, durations, tags)`);
  fs.rmSync(work, { recursive: true, force: true });
  console.log(bad ? `${bad} difference(s)` : `${id}: rebuilt identical`); process.exit(bad ? 1 : 0);
}
fs.rmSync(work, { recursive: true, force: true });
