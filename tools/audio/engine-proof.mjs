// The engine's moves of lot S1 measured on its real output (journal Passe SN3): the music steps back under a blow and returns, a layer moves on the next
// bar, stems stay together to the sample, a page's fade, a piece taken up where it stood. Renders the jobs of tools/audio/engine-jobs.mjs, then reads
// them. Exit 1 on a failure.
//   node tools/audio/engine-proof.mjs <outDir> [--root=<folder>]     (--root on a frozen copy: it has no such moves, it must fail)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { correlation, rmsDb } from './measure.mjs';

const out = path.resolve(process.argv[2] ?? 'out-audio-engine'), here = import.meta.dirname, root = process.argv.find((a) => a.startsWith('--root='));
const r = spawnSync(process.execPath, [path.join(here, 'render.mjs'), out, '--only=s1-', `--scripts=${path.join(here, 'engine-jobs.mjs')}`, ...(root ? [root] : [])], { stdio: 'inherit' });
if (r.status) process.exit(r.status);
const SR = 44100, load = (n) => { const b = fs.readFileSync(path.join(out, 'raw', `${n}.f32`)), x = new Float32Array(b.buffer, b.byteOffset, b.length >> 2), l = new Float32Array(x.length >> 1); for (let i = 0; i < l.length; i++) l[i] = x[2 * i]; return l; };
const win = (x, a, b) => x.subarray(Math.round(a * SR), Math.round(b * SR)), level = (x, a, b) => rmsDb(win(x, a, b));
/** the level of one frequency in a window (Goertzel), in dB */
const at = (x, hz, a, b) => { const s = win(x, a, b), w = 2 * Math.PI * hz / SR, k = 2 * Math.cos(w); let p = 0, q = 0; for (const v of s) { const n = v + k * p - q; q = p; p = n; } return 10 * Math.log10(Math.max(1e-14, (p * p + q * q - k * p * q) * 4 / (s.length * s.length) / 2)); };
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };

// the tone alone, by its frequency: a blow's reverberation stays in the mix
const d = load('s1-duck'), base = at(d, 440, 1, 1.9), heavy = at(d, 440, 2.05, 2.1) - base, back = at(d, 440, 3.6, 4.6) - base, ko = at(d, 440, 5.3, 5.6) - base, koBack = at(d, 440, 7.8, 8.4) - base;
check(base > -40, `the tone is there: ${base.toFixed(1)} dB`);
check(Math.abs(heavy + 5) < 1, `a heavy blow takes the music down 5 dB: ${heavy.toFixed(1)}`);
check(Math.abs(back) < 0.3, `it returns: ${back.toFixed(2)}`);
check(Math.abs(ko + 14) < 1.5, `the K.O. takes it down 14 dB: ${ko.toFixed(1)}`);
check(Math.abs(koBack) < 0.5, `it returns: ${koBack.toFixed(2)}`);

const l = load('s1-layers');
check(at(l, 300, 0.5, 0.9) > -50, `layer 1 plays from the start: ${at(l, 300, 0.5, 0.9).toFixed(1)} dB`);
check(at(l, 700, 1.16, 1.28) < at(l, 700, 1.4, 1.5) - 30, `layer 2, asked at 1.0 s, is silent until the bar at 1.3 s: ${at(l, 700, 1.16, 1.28).toFixed(1)} then ${at(l, 700, 1.4, 1.5).toFixed(1)} dB`);
check(at(l, 1500, 3.56, 3.68) < at(l, 1500, 3.8, 3.9) - 30, `layer 3, asked at 3.0 s, waits for the bar at 3.7 s: ${at(l, 1500, 3.56, 3.68).toFixed(1)} then ${at(l, 1500, 3.8, 3.9).toFixed(1)} dB`);

const c = load('s1-sync'), hits = []; let top = 0;
for (const v of c) top = Math.max(top, Math.abs(v));
for (let i = 0; i < c.length; i++) if (Math.abs(c[i]) > top * 0.4) hits.push(i);
const gaps = hits.slice(1).map((v, i) => v - hits[i]).filter((g) => g > 100);
check(hits.length >= 3 && gaps.every((g) => g === Math.round(1.5 * SR)), `three stems' clicks on one sample, every loop: ${gaps.length + 1} loops ${gaps.length ? `${gaps[0]} samples apart` : ''}`);

const f = load('s1-fade');
check(level(f, 0.15, 0.25) < level(f, 2, 2.9) - 5, `the page comes up: ${level(f, 0.15, 0.25).toFixed(1)} then ${level(f, 2, 2.9).toFixed(1)} dB`);
check(level(f, 3.6, 4.5) < level(f, 2, 2.9) - 30, `it goes down with the page: ${level(f, 3.6, 4.5).toFixed(1)} dB after leaving`);

// the same notes, 5 s on: the piece taken up against the piece played; a crude high-pass leaves the drone's phase out
const hp = (x) => { const y = new Float32Array(x.length); for (let i = 1; i < x.length; i++) y[i] = x[i] - x[i - 1]; return y; };
const t = hp(load('s1-tune')), b = hp(load('s1-resume')), o = hp(load('s1-other')), n = Math.round(5.5 * SR);
const same = correlation(win(b, 2, 2 + n / SR), win(t, 7, 7 + n / SR)), off = correlation(win(b, 2.5, 2.5 + n / SR), win(t, 7, 7 + n / SR)), other = correlation(win(o, 2, 2 + n / SR), win(t, 7, 7 + n / SR));
check(same > 0.8, `taken up where it stood: ${same.toFixed(3)} against the piece 5 s on`);
check(Math.abs(off) < 0.5, `the control, half a second off: ${off.toFixed(3)}`);
check(Math.abs(other) < 0.5, `another piece's record starts from its beginning: ${other.toFixed(3)}`);
console.log(failed ? `\nFAILED ${failed}` : '\nall checks passed');
if (failed) process.exitCode = 1;
