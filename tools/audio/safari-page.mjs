// The Safari page (journal Passe SN10; the operator's C-SAFARI « Je peux faire l’essai »): the game's baked files, Opus in WebM and AAC in M4A, embedded in one page
// (the artifact service refuses the .m4a: the files ride as data: URIs), measured by the engine's own alignment (src/audio/align.ts, bundled) and listened
// to at their loop's turn; a pure tone of 2 s, encoded as the bake encodes, makes the smallest gap heard. The page saves what Safari decoded and the
// operator's verdicts in its artifact's store (`db`, collection `results`).
//   node tools/audio/safari-page.mjs <out.html>        (FFMPEG or the PATH)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { build } from 'vite';
import { encodePair } from './band/encode.mjs';

const ROOT = path.resolve(import.meta.dirname, '..', '..'), out = process.argv[2], ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
if (!out) { console.error('usage: safari-page.mjs <out.html>'); process.exit(1); }
const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/audio/catalogue.json'), 'utf8')).pieces, tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'safari-page-'));

// the engine's alignment, as the game bundles it
fs.writeFileSync(path.join(tmp, 'entry.ts'), `export * from '${ROOT.replaceAll('\\', '/')}/src/audio/align';\n`);
await build({ root: ROOT, configFile: false, logLevel: 'error', cacheDir: path.join(tmp, '.vite'), publicDir: false, build: { write: true, outDir: path.join(tmp, 'out'), emptyOutDir: true, minify: true, lib: { entry: path.join(tmp, 'entry.ts'), formats: ['iife'], name: 'ALIGN', fileName: () => 'align.js' } } });
const align = fs.readFileSync(path.join(tmp, 'out', 'align.js'), 'utf8').replace(/\bvar ALIGN\b/, 'window.ALIGN');

// a la of 2 s, 880 whole periods: a circle; encoded as the bake encodes a loop
const n = 96000, tone = [0, 1].map(() => Float32Array.from({ length: n }, (_, i) => 0.25 * Math.sin(2 * Math.PI * 880 * i / n)));
const t = encodePair(ffmpeg, tone, path.join(tmp, 'ton'), 96, true);
const uri = (b, x) => `data:${x === 'webm' ? 'audio/webm' : 'audio/mp4'};base64,${b.toString('base64')}`;
const file = (id, x) => fs.readFileSync(path.join(ROOT, 'src/audio/baked', `${id}.${x}`));
const DATA = {
  ton: { frames: n, loop: true, webm: uri(t.webm, 'webm'), m4a: uri(t.m4a, 'm4a') },
  valse: { frames: cat.valse.frames, loop: true, webm: uri(file('valse', 'webm'), 'webm'), m4a: uri(file('valse', 'm4a'), 'm4a') },
  'duel-base': { frames: cat.duel.frames, loop: true, webm: uri(file('duel-base', 'webm'), 'webm'), m4a: uri(file('duel-base', 'm4a'), 'm4a') },
  'duel-intro': { frames: cat.duel.intro.frames, loopAt: cat.duel.intro.loopAt, loop: false, webm: uri(file('duel-intro', 'webm'), 'webm'), m4a: uri(file('duel-intro', 'm4a'), 'm4a') },
};
const page = fs.readFileSync(path.join(import.meta.dirname, 'safari-page.html'), 'utf8').replace('/*@ALIGN@*/', () => align).replace('/*@DATA@*/{}', () => JSON.stringify(DATA));
fs.writeFileSync(out, page);
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`${out}: ${(page.length / 1e6).toFixed(2)} MB`);
