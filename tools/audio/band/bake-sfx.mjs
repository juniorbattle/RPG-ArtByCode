// The bake of the duel's sounds and the arena's crowd (lot S3, journal Passe SN16; the operator's S3-SUITE « Cuire et brancher dans la version 2 ce qui est
// validé », journal Passe SN16): each sound of art-lab/audio/sfx/ rendered from its own writing, encoded as Opus in WebM and AAC in M4A into src/audio/baked/
// (tools/audio/band/encode.mjs, bit-exact), one manifest a family (art-lab/audio/manifests/, checked by tools/audio/validate.mjs), and the engine's table
// `sfx` in src/audio/catalogue.json (each sound's files and lengths, the crowd's murmur a loop). `--check` rebuilds in a scratch folder and compares.
//   node --max-old-space-size=8192 tools/audio/band/bake-sfx.mjs [--check]
import { execFileSync } from 'node:child_process';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ENC, OPUS_LEAD, encodePair } from './encode.mjs';
import { forgetNotes } from './instruments.mjs';
import { forgetHits } from './drums.mjs';
import { CUES, renderCue } from '../../../art-lab/audio/sfx/duel.sfx.mjs';
import { CROWD, renderCrowd } from '../../../art-lab/audio/sfx/crowd.sfx.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..', '..'), BAKED = 'src/audio/baked', MANIFESTS = 'art-lab/audio/manifests', CATALOGUE = 'src/audio/catalogue.json', DATE = '2026-11-04';
/** the operator's sheet, word for word (journal Passe SN16): the whole, the dips, the bake */
const SHEET = ['S3-DUEL « Mieux : continuer dans cette voie »', 'S3-BAISSE « Garder les baisses »', 'S3-SUITE « Cuire et brancher dans la version 2 ce qui est validé »'].map((d) => `${d} (journal Passe SN16, ${DATE})`);
/** the families: their sounds, their card on the sheet, their bitrates (the cues at 64 kb/s in Opus and 80 in AAC, the murmur at 96: SA-17, journal Passe SN15) */
const FAMILIES = [
  { id: 'duel-coups', kind: 'effect', ear: 'S3-COUPS « Bonne direction »', cues: ['light', 'heavy', 'm_slash', 'm_heavy', 'guard', 'guardHeavy', 'whiff', 'break'] },
  { id: 'duel-ren', kind: 'effect', ear: 'S3-REN « Bonne direction »', cues: ['t1', 't2', 't3', 't4', 'k_sunder', 'k_feint'] },
  { id: 'duel-rivaux', kind: 'effect', ear: 'S3-RIVAUX « Bonne direction »', cues: ['m_ironfall', 'm_lunge', 'm_shoulder', 'm_riposte', 'm_smite', 'm_wild', 'm_cleave'] },
  { id: 'duel-soutiens', kind: 'effect', ear: 'S3-SOUTIENS « Bonne direction »', cues: ['d1', 'm_bulwark', 'm_brace', 'm_aegis', 'm_hide', 'k_iron', 'k_parry', 's1', 'k_cry', 'k_focus', 'm_resolve', 'm_tempo', 'm_gild', 'm_prayer', 'm_grit', 'm_roar'] },
  { id: 'duel-charge', kind: 'effect', ear: 'S3-CHARGE « Bonne direction »', cues: ['charge1', 'charge2', 'charge3', 'hold1', 'hold2', 'hold3', 'release', 'denied'] },
  { id: 'duel-lecture', kind: 'effect', ear: 'S3-LECTURE « Bonne direction, les cinq »', cues: ['threat', 'window', 'dodge', 'stun', 'pushed'] },
  { id: 'duel-ko', kind: 'effect', ear: 'S3-KO « Bonne direction »', cues: ['ko'] },
  { id: 'foule', kind: 'ambience', ear: 'S3-FOULE « Bonne direction (par le code) »', crowd: ['bed', 'oh', 'gasp', 'cheer', 'roar'] },
];
const KBPS = { webm: 64, m4a: 80 }, BED = { webm: 96, m4a: 96 };
/** AAC without its perceptual noise substitution: a band coded as noise is drawn again by each decoder, and Firefox's drew another cymbal than ffmpeg's
 *  (tools/audio/decode-proof.mjs: five noisy sounds matched at 0.85 to 0.89, journal Passe SN16); coded as it is, every decoder gives the same sound */
const EXTRA = { m4a: ['-aac_pns', '0'] };

const check = process.argv.includes('--check'), ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
let version; try { version = execFileSync(ffmpeg, ['-hide_banner', '-version'], { encoding: 'utf8' }).split('\n')[0].replace(/^ffmpeg version /, '').replace(/ Copyright.*$/, '').trim(); } catch { console.error('bake-sfx: ffmpeg not found (FFMPEG or the PATH)'); process.exit(1); }
const outRoot = check ? fs.mkdtempSync(path.join(os.tmpdir(), 'bake-sfx-check-')) : ROOT;
fs.mkdirSync(path.join(outRoot, BAKED), { recursive: true }); fs.mkdirSync(path.join(outRoot, MANIFESTS), { recursive: true });
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
// every sound of the bank is in one family, every family's sound in the bank
const all = FAMILIES.flatMap((f) => f.cues ?? []), crowds = FAMILIES.flatMap((f) => f.crowd ?? []);
if (all.length !== Object.keys(CUES).length || all.some((c) => !CUES[c]) || crowds.length !== Object.keys(CROWD).length) throw new Error('bake-sfx: the families do not hold the bank');

const table = {}; let mismatches = 0, webm = 0, m4a = 0;
for (const fam of FAMILIES) {
  const files = [];
  const put = (name, L, R, kbps, circle) => {
    const rel = `${BAKED}/${name}`, got = encodePair(ffmpeg, [L, R], path.join(outRoot, rel), kbps, circle, EXTRA);
    for (const x of ['webm', 'm4a']) files.push({ path: `${rel}.${x}`, bytes: got[x].length, sha256: sha(got[x]), codec: x === 'webm' ? 'opus' : 'aac-lc', kbps: kbps[x], role: circle ? 'loop' : 'once', frames: L.length });
  };
  for (const id of fam.cues ?? []) {
    forgetNotes(); forgetHits();
    const c = renderCue(id), names = c.takes.map((_, k) => (c.takes.length > 1 ? `sfx-${id}-${k}` : `sfx-${id}`));
    c.takes.forEach((t, k) => put(names[k], t.L, t.R, KBPS, false));
    table[id] = { family: fam.id, files: names, frames: c.takes.map((t) => t.L.length) };
  }
  for (const id of fam.crowd ?? []) {
    const c = renderCrowd(id), name = `sfx-crowd-${id}`, loop = c.kind === 'loop';
    put(name, c.L, c.R, loop ? BED : KBPS, loop);
    table[`crowd-${id}`] = { family: fam.id, files: [name], frames: [c.L.length], ...(loop ? { loop: true } : {}) };
  }
  const manifest = {
    id: fam.id, kind: fam.kind, runtimeUse: 'production', licence: 'own', generatedByAi: false, score: fam.crowd ? 'art-lab/audio/sfx/crowd.sfx.mjs' : 'art-lab/audio/sfx/duel.sfx.mjs', approved: true,
    approval: `The operator, on the duel's sounds sheet (briefs/fiche-son-duel.html, journal Passe SN16, ${DATE}): S3-SUITE « Cuire et brancher dans la version 2 ce qui est validé », on the sounds kept by ear: ${fam.ear}; S3-DUEL « Mieux : continuer dans cette voie »; S3-BAISSE « Garder les baisses ». To be confirmed after the trial in play. Version 2 only (SA-16 « Derrière flags.v2 seulement »): the default game, the title screen and Explore stay silent.`,
    decisions: [`${fam.ear} (journal Passe SN16, ${DATE})`, ...SHEET],
    files,
    bake: { tool: 'tools/audio/band/bake-sfx.mjs', ffmpeg: version, encoders: { webm: ENC.webm('<kbps>').join(' '), m4a: [...ENC.m4a('<kbps>'), ...EXTRA.m4a].join(' '), input: 'f32le 48000 Hz stereo, -map_metadata -1 -fflags +bitexact -flags:a +bitexact', opusDelay: `${OPUS_LEAD} samples ahead (silence before a sound, the murmur's last ones before it), 336 written as the delay` } },
  };
  const mine = { webm: files.filter((f) => f.path.endsWith('.webm')).reduce((a, f) => a + f.bytes, 0), m4a: files.filter((f) => f.path.endsWith('.m4a')).reduce((a, f) => a + f.bytes, 0) };
  webm += mine.webm; m4a += mine.m4a;
  if (check) {
    const was = JSON.parse(fs.readFileSync(path.join(ROOT, MANIFESTS, `${fam.id}.manifest.json`), 'utf8'));
    for (const f of files) { const w = was.files.find((x) => x.path === f.path), ok = w && w.sha256 === f.sha256 && w.bytes === f.bytes; if (!ok) { mismatches++; console.log(`DIFFERS ${f.path}`); } }
  } else fs.writeFileSync(path.join(outRoot, MANIFESTS, `${fam.id}.manifest.json`), `${JSON.stringify(manifest, null, 1)}\n`);
  console.log(fam.id, files.length / 2, 'sounds,', mine.webm, 'B webm,', mine.m4a, 'B m4a');
}
console.log(`total ${webm} B webm, ${m4a} B m4a`);
// the engine's table: the catalogue's pieces kept as bake.mjs wrote them
if (!check) {
  const file = path.join(ROOT, CATALOGUE), cat = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, `${JSON.stringify({ sampleRate: cat.sampleRate, pieces: cat.pieces, sfx: table }, null, 1)}\n`);
} else {
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, CATALOGUE), 'utf8'));
  if (JSON.stringify(cat.sfx) !== JSON.stringify(table)) { mismatches++; console.log('DIFFERS the catalogue\'s sfx table'); }
  console.log(mismatches ? `\n${mismatches} file(s) differ` : '\nevery file as its manifest says'); fs.rmSync(outRoot, { recursive: true, force: true }); process.exitCode = mismatches ? 1 : 0;
}
