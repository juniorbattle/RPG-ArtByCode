// The bake (journal Passe SN10; the operator's R-SUITE « Cuire et brancher dans la version 2 », journal Passe SN9): each piece of the catalogue rendered by the band
// as the game plays it, encoded as Opus in WebM and AAC in M4A into src/audio/baked/, under one manifest a piece (art-lab/audio/manifests/, checked by
// tools/audio/validate.mjs), and the engine's catalogue src/audio/catalogue.json (lengths, bars, layers, intros).
//   node --max-old-space-size=8192 tools/audio/band/bake.mjs [id ...] [--check]
// A loop is its body alone, a circle (journal Passe SN7); the fights keep their three layers (C-COUCHES « Trois couches sur les trois combats »), each layer given
// the gain the dynamics gave the whole mix, so that the three together are the approved master; the intros (the fights', the title's) are rendered apart, with
// the loop's own levels, and end where the loop begins. The encoders run bit-exact: the same scores and the same ffmpeg give the same bytes (`--check` rebuilds
// in a scratch folder and compares every file with its manifest). ffmpeg is a development tool (FFMPEG or the PATH; S2-O, journal Passe SN4), never in the
// game or the repository.
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SR } from './dsp.mjs';
import { master, masterWith } from './session.mjs';
import { loudness, truePeak } from '../measure.mjs';
import { seam } from './check.mjs';
import { ENC, OPUS_DELAY, OPUS_LEAD, encodePair } from './encode.mjs';
import { forgetNotes } from './instruments.mjs';
import { forgetHits } from './drums.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..'), SCORES = 'art-lab/audio/scores', BAKED = 'src/audio/baked', MANIFESTS = 'art-lab/audio/manifests', CATALOGUE = 'src/audio/catalogue.json';
const LUFS = -18, DATE = '2026-11-03';

/** what the operator decided on each piece, word for word (journal Passes SN6, SN8, SN9): the version kept by ear, then the plan, the layers and the bake */
const PLAN = ['C-LIEUX « Valider ce plan » (journal Passe SN8)', 'R-SUITE « Cuire et brancher dans la version 2 » (journal Passe SN9)'];
/** the operator's confirmation after the trial in play (journal Passe SN11) */
const CONFIRMED = 'E-PROD « Confirmé : en production dans la version 2 » (journal Passe SN11, 2026-11-04)';
const EAR = {
  titre: ['C-TITRE « Bonne direction » (journal Passe SN8)', 'R-TITRE « Bonne direction » (journal Passe SN9)'],
  matin: ['F-MATIN « Bonne direction » (journal Passe SN6)', 'R-MATIN « Bonne direction » (journal Passe SN9)'],
  midi: ['F-MIDI « Bonne direction » (journal Passe SN6)', 'C-BOUCLE « Rien entendu de gênant » (journal Passe SN8)', 'R-RETOUCHES « Revenir à l’ancienne version » (journal Passe SN9)'],
  fin: ['C-FIN « Bonne direction » (journal Passe SN8)', 'R-FIN « Bonne direction » (journal Passe SN9)'],
  nuit: ['F-NUIT « Bonne direction » (journal Passe SN6)', 'R-NUIT « Bonne direction » (journal Passe SN9)'],
  parvis: ['C-PARVIS « Bonne direction » (journal Passe SN8)', 'R-PARVIS « Bonne direction » (journal Passe SN9)'],
  lices: ['C-LICES « Bonne direction » (journal Passe SN8)', 'R-LICES « Bonne direction » (journal Passe SN9)'],
  valse: ['C-VALSE « Bonne direction » (journal Passe SN8)', 'R-VALSE « Bonne direction » (journal Passe SN9)'],
  duel: ['F-DUEL « Bonne direction » (journal Passe SN6)', 'C-BOUCLE « Rien entendu de gênant » (journal Passe SN8)', 'R-RETOUCHES « Revenir à l’ancienne version » (journal Passe SN9)', 'C-COUCHES « Trois couches sur les trois combats » (journal Passe SN8)'],
  rival: ['C-RIVAL « Bonne direction » (journal Passe SN8)', 'R-RIVAL « Revenir à l’ancienne version » (journal Passe SN9)', 'C-COUCHES « Trois couches sur les trois combats » (journal Passe SN8)'],
  finale: ['C-FINALE « Bonne direction » (journal Passe SN8)', 'R-FINALE « Revenir à l’ancienne version » (journal Passe SN9)', 'C-COUCHES « Trois couches sur les trois combats » (journal Passe SN8)'],
  fanfare: ['F-FANFARE « Bonne direction » (journal Passe SN6)'],
  victoire: ['C-JINGLES « Bonne direction » (journal Passe SN8)'],
  defaite: ['C-JINGLES « Bonne direction » (journal Passe SN8)'],
};
/** the catalogue: how each piece is played and its bitrates (journal Passe SN7: 96 kb/s for a piece, 80 and 64 for the layers) */
export const PIECES = [
  { id: 'titre', kind: 'loop', kbps: 96, intro: 96 },
  { id: 'matin', kind: 'loop', kbps: 96 },
  { id: 'midi', kind: 'loop', kbps: 96 },
  { id: 'fin', kind: 'loop', kbps: 96 },
  { id: 'nuit', kind: 'loop', kbps: 96 },
  { id: 'parvis', kind: 'loop', kbps: 96 },
  { id: 'lices', kind: 'loop', kbps: 96 },
  { id: 'valse', kind: 'loop', kbps: 96 },
  { id: 'duel', kind: 'layers', layers: { base: 80, melody: 64, tension: 64 }, intro: 96 },
  { id: 'rival', kind: 'layers', layers: { base: 80, melody: 64, tension: 64 }, intro: 96 },
  { id: 'finale', kind: 'layers', layers: { base: 80, melody: 64, tension: 64 }, intro: 96 },
  { id: 'fanfare', kind: 'once', kbps: 96 },
  { id: 'victoire', kind: 'once', kbps: 96 },
  { id: 'defaite', kind: 'once', kbps: 96 },
];

const args = process.argv.slice(2), check = args.includes('--check'), only = args.filter((a) => !a.startsWith('--'));
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
let version; try { version = execFileSync(ffmpeg, ['-hide_banner', '-version'], { encoding: 'utf8' }).split('\n')[0].replace(/^ffmpeg version /, '').replace(/ Copyright.*$/, '').trim(); } catch { console.error('bake: ffmpeg not found (FFMPEG or the PATH)'); process.exit(1); }
const outRoot = check ? fs.mkdtempSync(path.join(os.tmpdir(), 'bake-check-')) : ROOT;
fs.mkdirSync(path.join(outRoot, BAKED), { recursive: true }); fs.mkdirSync(path.join(outRoot, MANIFESTS), { recursive: true });

const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

/** a stereo pair to the two files of the game (tools/audio/band/encode.mjs: bit-exact, Opus's delay on a whole millisecond); returns their records */
function encode([L, R], name, kbps, role) {
  const rel = `${BAKED}/${name}`, got = encodePair(ffmpeg, [L, R], path.join(outRoot, rel), kbps, role.startsWith('loop'));
  return ['webm', 'm4a'].map((x) => ({ path: `${rel}.${x}`, bytes: got[x].length, sha256: sha(got[x]), codec: x === 'webm' ? 'opus' : 'aac-lc', kbps, role, frames: L.length }));
}
/** the end of a sound: its tail, trimmed where it has died */
function trim([L, R]) { let n = L.length; while (n > SR && Math.abs(L[n - 1]) < 1e-4 && Math.abs(R[n - 1]) < 1e-4) n--; return [L.subarray(0, n), R.subarray(0, n)]; }
const measures = ([L, R]) => { const l = loudness([L, R], SR); return { lufs: +l.lufs.toFixed(1), lra: +l.lra.toFixed(1), truePeak: +truePeak([L, R]).toFixed(1) }; };

const catalogueFile = path.join(ROOT, CATALOGUE), catalogue = !check && fs.existsSync(catalogueFile) ? JSON.parse(fs.readFileSync(catalogueFile, 'utf8')) : { sampleRate: SR, pieces: {} };
let mismatches = 0;
for (const p of PIECES.filter((x) => !only.length || only.includes(x.id))) {
  // each piece from its score alone, whatever was rendered before it in this run (a subset checks as the whole catalogue does)
  forgetNotes(); forgetHits();
  const t0 = Date.now(), score = `${SCORES}/${p.id}.score.mjs`, { default: make, tunes = [] } = await import(pathToFileURL(path.join(ROOT, score)).href);
  const tune = make({ dry: true }).events.filter((e) => tunes.includes(e.track)), files = [], entry = { kind: p.kind };
  let report;
  if (p.kind === 'once') {
    const s = make({ tune }), m = master(s.mix(), { lufs: LUFS }), out = trim([m.L, m.R]);
    files.push(...encode(out, p.id, p.kbps, 'once'));
    Object.assign(entry, { frames: out[0].length, files: [p.id] }); report = { ...measures(out), secs: +(out[0].length / SR).toFixed(2) };
  } else {
    const s = make({ tune, looped: true }), stems = s.mix(), m = master(stems, { lufs: LUFS, circular: true, layers: p.kind === 'layers' }), n = m.L.length;
    if (p.kind === 'loop') files.push(...encode([m.L, m.R], p.id, p.kbps, 'loop'));
    else for (const [name, kbps] of Object.entries(p.layers)) { if (!m.layers.has(name)) throw new Error(`${p.id}: no layer ${name}`); files.push(...encode(m.layers.get(name), `${p.id}-${name}`, kbps, `loop:${name}`)); }
    Object.assign(entry, { frames: n, bar: +s.span(s.steps).toFixed(6), files: p.kind === 'loop' ? [p.id] : Object.keys(p.layers).map((x) => `${p.id}-${x}`), ...(p.kind === 'layers' ? { layers: Object.keys(p.layers) } : {}) });
    report = { ...measures([m.L, m.R]), secs: +(n / SR).toFixed(2), seam: seam([m.L, m.R], SR, 0, n) };
    if (p.kind === 'layers') { let most = 0; for (const [, [a, b]] of m.layers) for (let i = 0; i < n; i++) most = Math.max(most, Math.abs(a[i]), Math.abs(b[i])); report.layerPeak = +most.toFixed(3); }
    if (p.intro) {
      const si = make({ tune, looped: true, intro: true }), out = trim((({ L, R }) => [L, R])(masterWith(si.mix(), m.gains)));
      if (out[0].length < si.loopStart) throw new Error(`${p.id}: the intro ends before its loop`);
      files.push(...encode(out, `${p.id}-intro`, p.intro, 'intro'));
      entry.intro = { file: `${p.id}-intro`, frames: out[0].length, loopAt: si.loopStart };
      report.intro = { ...measures(out), secs: +(out[0].length / SR).toFixed(2), loopAt: +(si.loopStart / SR).toFixed(3) };
    }
  }
  const manifest = {
    id: p.id, kind: 'music', runtimeUse: 'production', licence: 'own', generatedByAi: false, score, approved: true,
    approval: `The operator, on the reprise sheet (journal Passe SN9, ${DATE}): R-SUITE « Cuire et brancher dans la version 2 », on the version kept by ear: ${EAR[p.id].join('; ')}; and ${PLAN[0]}. Confirmed after the trial in play: ${CONFIRMED}. Version 2 only (SA-16 « Derrière flags.v2 seulement »): the default game, the title screen and Explore stay silent.`,
    decisions: [...EAR[p.id], ...PLAN, CONFIRMED],
    files,
    bake: { tool: 'tools/audio/band/bake.mjs', ffmpeg: version, encoders: { webm: ENC.webm('<kbps>').join(' '), m4a: ENC.m4a('<kbps>').join(' '), input: 'f32le 48000 Hz stereo, -map_metadata -1 -fflags +bitexact -flags:a +bitexact', opusDelay: `${OPUS_LEAD} samples ahead (a loop's last ones, else silence), CodecDelay and OpusHead pre-skip set to ${OPUS_DELAY} samples (7 ms)` }, sampleRate: SR, lufs: LUFS, date: DATE, measures: report },
  };
  catalogue.pieces[p.id] = entry;
  const mfile = path.join(outRoot, MANIFESTS, `${p.id}.manifest.json`);
  if (check) {
    const was = JSON.parse(fs.readFileSync(path.join(ROOT, MANIFESTS, `${p.id}.manifest.json`), 'utf8'));
    for (const f of files) { const w = was.files.find((x) => x.path === f.path); const ok = w && w.sha256 === f.sha256 && w.bytes === f.bytes; if (!ok) mismatches++; console.log(`${ok ? 'same' : 'DIFFERS'} ${f.path}`); }
  } else fs.writeFileSync(mfile, `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(p.id, JSON.stringify(report), files.filter((f) => f.path.endsWith('.webm')).reduce((a, f) => a + f.bytes, 0), 'B webm,', files.filter((f) => f.path.endsWith('.m4a')).reduce((a, f) => a + f.bytes, 0), `B m4a, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}
if (check) { console.log(mismatches ? `\n${mismatches} file(s) differ` : '\nevery file as its manifest says'); fs.rmSync(outRoot, { recursive: true, force: true }); process.exitCode = mismatches ? 1 : 0; }
else {
  const ordered = { sampleRate: SR, pieces: Object.fromEntries(PIECES.filter((x) => catalogue.pieces[x.id]).map((x) => [x.id, catalogue.pieces[x.id]])) };
  fs.writeFileSync(catalogueFile, `${JSON.stringify(ordered, null, 1)}\n`);
}
