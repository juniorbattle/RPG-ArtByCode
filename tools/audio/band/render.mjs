// The band's renders (journal Passes SN5 / SN7): `node tools/audio/band/render.mjs <outDir> [id ...] [--lufs=-18] [--stems] [--meters] [--loop]`: each score of art-lab/audio/scores/ mixed and
// mastered offline, written as 16-bit WAV, then as AAC in M4A and Opus in WebM through ffmpeg when it is found (FFMPEG or the PATH), its measures in <id>.json.
// ffmpeg is a development tool only, never in the game or the repository (S2-O, journal Passe SN4).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { SR } from './dsp.mjs';
import { master } from './session.mjs';
import { wavBytes, loudness, truePeak, correlation } from '../measure.mjs';
import { octaves, seam } from './check.mjs';

const args = process.argv.slice(2), flags = args.filter((a) => a.startsWith('--')), [out, ...ids] = args.filter((a) => !a.startsWith('--'));
const flag = (k, d) => flags.find((f) => f.startsWith(`--${k}=`))?.split('=')[1] ?? d;
const lufs = Number(flag('lufs', -18)), wantStems = flags.includes('--stems'), wantLoop = flags.includes('--loop'), dir = 'art-lab/audio/scores', ffmpeg = process.env.FFMPEG ?? 'ffmpeg';
if (!out) { console.error('usage: render.mjs <outDir> [id ...] [--lufs=-18] [--stems] [--meters] [--loop]'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
const all = fs.readdirSync(dir).filter((f) => f.endsWith('.score.mjs')).map((f) => f.replace('.score.mjs', ''));
const hasFfmpeg = (() => { try { execFileSync(ffmpeg, ['-version'], { stdio: 'ignore' }); return true; } catch { return false; } })();

function encode(wav, base) {
  if (!hasFfmpeg) return {};
  const run = (a) => execFileSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-y', '-i', wav, ...a], { stdio: 'inherit' });
  run(['-c:a', 'aac', '-b:a', '160k', `${base}.m4a`]); run(['-c:a', 'libopus', '-b:a', '112k', '-vbr', 'on', '-application', 'audio', `${base}.webm`]);
  return { m4a: fs.statSync(`${base}.m4a`).size, webm: fs.statSync(`${base}.webm`).size };
}
/** the end of a piece: the sound's tail, trimmed where it has died */
function trim(L, R) { let n = L.length; while (n > SR && Math.abs(L[n - 1]) < 1e-4 && Math.abs(R[n - 1]) < 1e-4) n--; return [L.subarray(0, n), R.subarray(0, n)]; }

for (const id of ids.length ? ids : all) {
  const t0 = Date.now(), { default: make, tunes = [] } = await import(pathToFileURL(path.resolve(dir, `${id}.score.mjs`)).href), tune = make({ dry: true }).events.filter((e) => tunes.includes(e.track)), s = make({ tune, looped: wantLoop }), t1 = Date.now();
  if (flags.includes('--meters')) s.meter = (tr) => { const a = tr.L.map((v, i) => (v + tr.R[i]) * 0.5 * tr.gain), l = loudness([a, a], SR); return { lufs: +l.lufs.toFixed(1), octaves: octaves(a, SR, 1 << 13) }; };
  const stems = s.mix(), t2 = Date.now(), m = master(stems, { lufs, circular: !!s.loop });
  const [L, R] = s.loop ? [m.L, m.R] : trim(m.L, m.R), piece = s.loop ? `${id}-loop` : id, file = path.join(out, `${piece}.wav`), base = path.join(out, piece); fs.writeFileSync(file, wavBytes([L, R], SR));
  const sizes = encode(file, base), l = loudness([L, R], SR), report = { id, secs: +(L.length / SR).toFixed(1), bpm: s.bpm, lufs: +l.lufs.toFixed(1), lra: +l.lra.toFixed(1), short: +l.short.toFixed(1), truePeak: +truePeak([L, R]).toFixed(1), correlation: +correlation(L, R).toFixed(2), ...(s.loop ? { seam: seam([L, R], SR, 0, L.length) } : {}), renderSecs: +((Date.now() - t0) / 1000).toFixed(1), ...sizes };
  if (wantStems) for (const [name, [a, b]] of stems) if (stems.size > 1) { const g = m.stemsGain, c = [a, b].map((x) => x.map((v) => v * g)), f = path.join(out, `${piece}-${name}.wav`); fs.writeFileSync(f, wavBytes(c, SR)); encode(f, path.join(out, `${piece}-${name}`)); }
  fs.writeFileSync(`${base}.json`, JSON.stringify(report, null, 1)); console.log(JSON.stringify(report), `score ${t1 - t0} ms, mix ${t2 - t1} ms`);
  if (flags.includes('--meters')) for (const [name, x] of Object.entries(s.meters)) console.log(`  ${name.padEnd(12)} ${String(x.lufs).padStart(6)} LUFS  ${Object.entries(x.octaves).map(([f, v]) => `${f < 1000 ? f : `${f / 1000}k`}:${v}`).join(' ')}`);
}
