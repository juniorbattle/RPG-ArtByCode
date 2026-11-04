// The engine's moves of lot S1 measured on its real output (journal Passe SN3): the music steps back under a blow and returns, a layer moves on the next
// bar, stems stay together to the sample, a page's fade, a piece taken up where it stood; and the band's pieces in it (journal Passe SN10): the duel's intro and
// its loop where they belong to the sample, a loop's turn without a step, the layers following the duel (the operator's rule F and a move replaced on its bar
// line, journal Passe SN13), the K.O.'s jingle, the music stepping back under the fanfare, each read against the baked files decoded by ffmpeg (FFMPEG or the PATH). Renders the jobs of tools/audio/engine-jobs.mjs, then reads them. Exit 1
// on a failure.
//   node tools/audio/engine-proof.mjs <outDir> [--root=<folder>]     (--root on a frozen copy: it has no such moves, it must fail)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { correlation, rmsDb } from './measure.mjs';

const out = path.resolve(process.argv[2] ?? 'out-audio-engine'), here = import.meta.dirname, root = process.argv.find((a) => a.startsWith('--root='));
const r = spawnSync(process.execPath, [path.join(here, 'render.mjs'), out, '--only=s1-,sn-', `--scripts=${path.join(here, 'engine-jobs.mjs')}`, ...(root ? [root] : [])], { stdio: 'inherit' });
if (r.status) process.exit(r.status);
const META = JSON.parse(fs.readFileSync(path.join(out, 'meta.json'), 'utf8')), SR = META['s1-duck']?.sr ?? 44100, load = (n) => { const b = fs.readFileSync(path.join(out, 'raw', `${n}.f32`)), x = new Float32Array(b.buffer, b.byteOffset, b.length >> 2), l = new Float32Array(x.length >> 1); for (let i = 0; i < l.length; i++) l[i] = x[2 * i]; return l; };
const win = (x, a, b) => x.subarray(Math.round(a * SR), Math.round(b * SR)), level = (x, a, b) => rmsDb(win(x, a, b));
/** the level of one frequency in a window (Goertzel), in dB */
const at = (x, hz, a, b) => { const s = win(x, a, b), w = 2 * Math.PI * hz / SR, k = 2 * Math.cos(w); let p = 0, q = 0; for (const v of s) { const n = v + k * p - q; q = p; p = n; } return 10 * Math.log10(Math.max(1e-14, (p * p + q * q - k * p * q) * 4 / (s.length * s.length) / 2)); };
/** the operator's rule F for the fights' layers, from the sheet and not from the code (CQ-REGLE « F · Des niveaux plus doux », journal Passe SN13) */
const MELODY_ASIDE = 0.45, TENSION_REST = 0.35;
let failed = 0;
const check =(ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };

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
// ---- the band (journal Passe SN10), against its files decoded by ffmpeg
const ffmpeg = process.env.FFMPEG ?? 'ffmpeg', REPO = path.join(here, '..', '..'), CAT = JSON.parse(fs.readFileSync(path.join(REPO, 'src/audio/catalogue.json'), 'utf8')).pieces;
const baked = (id) => { const d = spawnSync(ffmpeg, ['-hide_banner', '-loglevel', 'error', '-i', path.join(REPO, 'src/audio/baked', `${id}.webm`), '-f', 'f32le', '-ac', '2', '-ar', String(SR), 'pipe:1'], { maxBuffer: 1 << 30 }); if (d.status !== 0 || !d.stdout) { console.error('engine-proof: the band checks need ffmpeg (FFMPEG or the PATH)'); process.exit(1); } const x = new Float32Array(d.stdout.buffer.slice(d.stdout.byteOffset, d.stdout.byteOffset + d.stdout.length)), l = new Float32Array(x.length >> 1); for (let i = 0; i < l.length; i++) l[i] = x[2 * i]; return l; };
/** a decoded file laid in a render of `n` samples from `at` seconds, round and round when `period` (samples) is given */
const lay = (x, n, at, period = 0) => { const y = new Float32Array(n), a = Math.round(at * SR); for (let i = Math.max(0, a); i < n; i++) { const k = i - a; if (period) y[i] = x[k % period]; else if (k < x.length) y[i] = x[k]; } return y; };
/** the gains that best make `y` of the parts `xs` over a window (least squares), and the share of `y` they leave unexplained */
function fit(y, xs, a, b) {
  const i0 = Math.round(a * SR), i1 = Math.round(b * SR), k = xs.length, A = Array.from({ length: k }, () => new Float64Array(k + 1));
  for (let i = i0; i < i1; i++) for (let p = 0; p < k; p++) { const xp = xs[p][i]; A[p][k] += xp * y[i]; for (let q = 0; q < k; q++) A[p][q] += xp * xs[q][i]; }
  for (let p = 0; p < k; p++) A[p][p] += 1e-9;
  for (let c = 0; c < k; c++) { let m = c; for (let r = c + 1; r < k; r++) if (Math.abs(A[r][c]) > Math.abs(A[m][c])) m = r; [A[c], A[m]] = [A[m], A[c]]; for (let r = 0; r < k; r++) if (r !== c) { const f = A[r][c] / A[c][c]; for (let q = c; q <= k; q++) A[r][q] -= f * A[c][q]; } }
  const g = A.map((row, p) => row[k] / row[p]); let e = 0, t = 0;
  for (let i = i0; i < i1; i++) { let v = y[i]; for (let p = 0; p < k; p++) v -= g[p] * xs[p][i]; e += v * v; t += y[i] * y[i]; }
  return { g, rest: e / (t + 1e-20) };
}
/** where a render meets what it should be: the lag (samples) of the best match over a window */
function lagOf(y, x, a, b, span = 48) { let best = -1, lag = 0; for (let k = -span; k <= span; k++) { let s = 0, e1 = 0, e2 = 0; for (let i = Math.round(a * SR); i < Math.round(b * SR); i++) { const u = y[i], v = x[i - k] ?? 0; s += u * v; e1 += u * u; e2 += v * v; } const c = s / Math.sqrt(e1 * e2 + 1e-20); if (c > best) { best = c; lag = k; } } return { lag, best }; }
// the output's own delay (the compressor's look-ahead, the ceiling's oversampling): the sync job's clicks, written 1000 samples into a loop of 1.5 s started at 0.1 s (the first
// one under the page's fade)
const LAT = (hits[0] - (Math.round(0.1 * SR) + 1000)) % Math.round(1.5 * SR), T0 = 0.1 + LAT / SR, dB = (v) => 20 * Math.log10(Math.max(1e-9, Math.abs(v)));
check(LAT >= 0 && LAT < 0.05 * SR, `the output's delay, measured on a click: ${LAT} samples (${(LAT / SR * 1000).toFixed(1)} ms)`);

const D = CAT.duel, loopAt = T0 + D.intro.loopAt / SR, stems = ['duel-base', 'duel-melody', 'duel-tension'].map(baked), intro = baked('duel-intro');
{
  const y = load('sn-intro'), n = y.length, parts = [lay(intro, n, T0), ...stems.map((x) => lay(x, n, loopAt, D.frames))], sum = parts[0].map((v, i) => v + parts[1][i] + parts[2][i]);
  const a = fit(y, parts, 2, loopAt - 0.15), b = fit(y, parts, loopAt + 0.3, 9.8), la = lagOf(y, sum, 2.5, 3.5), lb = lagOf(y, sum, loopAt + 0.5, loopAt + 1.5);
  check(a.rest < 0.01 && a.g[0] > 0.1, `the duel's intro plays from the start: unexplained ${(a.rest * 100).toFixed(2)} %, at lag ${la.lag}`);
  check(b.rest < 0.01 && Math.abs(dB(b.g[2] / b.g[1])) < 0.5 && Math.abs(b.g[3] / b.g[1] - TENSION_REST) < 0.05, `its loop comes in at ${loopAt.toFixed(3)} s, the base and the lead, the tension at rest (${TENSION_REST}): ${b.g.slice(1).map((v) => v.toFixed(3)).join(' / ')}, unexplained ${(b.rest * 100).toFixed(2)} %`);
  check(la.lag === 0 && lb.lag === 0, `intro and loop on their sample: lags ${la.lag} and ${lb.lag}`);
}
{
  const V = CAT.valse, y = load('sn-seam'), x = lay(baked('valse'), y.length, T0, V.frames), turn = T0 + V.frames / SR, w = fit(y, [x], turn - 1, turn + 1), lg = lagOf(y, x, turn - 0.2, turn + 0.2);
  const local = (c) => { let e = 0, t = 0; for (let i = Math.round((c - 0.01) * SR); i < Math.round((c + 0.01) * SR); i++) { const v = y[i] - w.g[0] * x[i]; e += v * v; t += y[i] * y[i]; } return e / (t + 1e-20); };
  check(w.rest < 0.01 && lg.lag === 0 && local(turn) < 3 * Math.max(local(turn - 0.5), 1e-4), `the waltz turns at ${turn.toFixed(3)} s without a step: unexplained ${(w.rest * 100).toFixed(2)} % over the turn, ${(local(turn) * 100).toFixed(2)} % on it against ${(local(turn - 0.5) * 100).toFixed(2)} % half a second before, lag ${lg.lag}`);
}
{
  const y = load('sn-mood'), n = y.length, parts = stems.map((x) => lay(x, n, loopAt, D.frames)), on = (t) => loopAt + Math.ceil((t + 0.03 - loopAt) / D.bar - 1e-9) * D.bar;
  // the operator's rule F (journal Passe SN13): the lead down to MELODY_ASIDE, the tension up from TENSION_REST, each move over a whole bar; read from the loop's ninth
  // bar on, the tension resting from its third to its eighth (a gain read on a silent stem is no reading)
  const B = D.bar, b = fit(y, parts, loopAt + 8 * B + 0.1, on(19) - 0.05), m = fit(y, parts, on(19) + B / 2 - 0.08, on(19) + B / 2 + 0.08), d = fit(y, parts, on(19) + B + 0.05, on(25) - 0.05), a = fit(y, parts, on(25) + B + 0.05, 31.8), r = (f) => f.g.map((v) => v / f.g[0]);
  const near = (f, lead, ten) => Math.abs(r(f)[1] - lead) < 0.05 && Math.abs(r(f)[2] - ten) < 0.05;
  check(near(b, 1, TENSION_REST), `calm: the base, the lead, the tension at rest ${r(b).map((v) => v.toFixed(2)).join(' / ')}`);
  check(near(m, (1 + MELODY_ASIDE) / 2, (TENSION_REST + 1) / 2), `the opponent's sequence (asked at 19 s): half way through the bar from ${on(19).toFixed(2)} s, half way there ${r(m).map((v) => v.toFixed(2)).join(' / ')}`);
  check(near(d, MELODY_ASIDE, 1), `a bar later the lead down, the tension up: ${r(d).map((v) => v.toFixed(2)).join(' / ')}`);
  check(near(a, 1, TENSION_REST), `its end (25 s): a bar after ${on(25).toFixed(2)} s back to calm: ${r(a).map((v) => v.toFixed(2)).join(' / ')}`);
}
{
  // the sequence over before its bar line: asked down and back up for the same line, the layers hold (the engine before dropped the lead for 0.25 s, then jumped)
  const y = load('sn-double'), n = y.length, parts = stems.map((x) => lay(x, n, loopAt, D.frames)), at = loopAt + Math.ceil((19 + 0.03 - loopAt) / D.bar - 1e-9) * D.bar, r = (f) => f.g.map((v) => v / f.g[0]);
  const w = [[at - 0.3, at - 0.02], [at + 0.02, at + 0.24], [at + 0.3, at + 1.3]].map(([p, q]) => fit(y, parts, p, q));
  check(w.every((f) => Math.abs(r(f)[1] - 1) < 0.05 && Math.abs(r(f)[2] - TENSION_REST) < 0.05 && f.rest < 0.01), `a sequence over before its bar line (${at.toFixed(2)} s): the lead and the tension hold, ${w.map((f) => r(f).slice(1).map((v) => v.toFixed(2)).join('/')).join(', ')}`);
}
{
  // the arena's crowd (journal Passe SN16): its murmur in a loop from its start, on the sample across the turn; the dodge window's bell played as baked, at its event
  const B = JSON.parse(fs.readFileSync(path.join(REPO, 'src/audio/catalogue.json'), 'utf8')).sfx, bed = baked('sfx-crowd-bed'), bell = baked('sfx-window'), at = 0.05 + LAT / SR;
  const y = load('sn-crowd'), x = lay(bed, y.length, at, B['crowd-bed'].frames[0]), turn = at + B['crowd-bed'].frames[0] / SR, f = fit(y, [x], 3, 19.5), lg = lagOf(y, x, turn - 0.5, turn + 0.5);
  check(f.rest < 0.01 && lg.lag === 0 && f.g[0] > 0.1, `the arena's crowd: its murmur from ${at.toFixed(3)} s, round its turn at ${turn.toFixed(2)} s, unexplained ${(f.rest * 100).toFixed(2)} %, lag ${lg.lag}`);
  const w = load('sn-window'), wb = lay(bed, w.length, at, B['crowd-bed'].frames[0]), ring = lay(bell, w.length, 4.005 + LAT / SR), before = fit(w, [wb, ring], 2.5, 3.95), during = fit(w, [wb, ring], 4.0, 4.6);
  check(during.rest < 0.01 && during.g[1] > 0.1 && Math.abs(during.g[0] / before.g[0] - 1) < 0.02, `the dodge window's bell as baked, at 4.005 s and its output's delay: ${during.g.map((v) => v.toFixed(3)).join(' / ')}, unexplained ${(during.rest * 100).toFixed(2)} %`);
}
for (const [job, want] of [['sn-win', 'victoire'], ['sn-lose', 'defaite']]) {
  const y = load(job), n = y.length, at = 6 + 1.2 + 0.05 + LAT / SR, parts = [lay(baked('victoire'), n, at), lay(baked('defaite'), n, at), ...stems.slice(0, 2).map((x) => lay(x, n, loopAt, D.frames))], f = fit(y, parts, at + 0.1, 10.8), k = want === 'victoire' ? 0 : 1;
  check(f.rest < 0.02 && Math.abs(f.g[1 - k]) < 0.05 * Math.abs(f.g[k]) && Math.abs(f.g[2]) < 0.02 * Math.abs(f.g[k]), `the K.O. (${job === 'sn-win' ? 'the opponent' : 'the hero'}) takes the music and gives « ${want} »: ${f.g.map((v) => v.toFixed(3)).join(' / ')}, unexplained ${(f.rest * 100).toFixed(2)} %`);
}
{
  const y = load('sn-fanfare'), n = y.length, x = lay(baked('matin'), n, T0, CAT.matin.frames), fan = lay(baked('fanfare'), n, 4.05 + LAT / SR), before = fit(y, [x, fan], 2.5, 3.95), under = fit(y, [x, fan], 4.9, 11.8), step = dB(under.g[0] / before.g[0]);
  check(under.rest < 0.02 && Math.abs(step + 9) < 1.5 && under.g[1] > 0.1, `the fanfare over the morning's piece, which steps back ${step.toFixed(1)} dB under it (target -9), unexplained ${(under.rest * 100).toFixed(2)} %`);
}
console.log(failed ? `\nFAILED ${failed}` : '\nall checks passed');
if (failed) process.exitCode = 1;
