// Reads the renders of tools/audio/render.mjs and checks them against the operator's targets (journal Passes SN1 / SN2; the fiche's note on S0: -18
// LUFS at the output, peaks at -1 dBTP, the music 3 to 6 dB over the ambience where it must be heard), at the default settings.
//   node tools/audio/analyse.mjs <outDir> [--only=<a,b>] [--check] [--base=<outDir of a frozen main>]
// --check: exit 1 on a miss (run on the frozen main it must fail: the negative control). --base: the same table side by side.
import fs from 'node:fs';
import path from 'node:path';
import { correlation, loudness, repetition, rmsDb, samplePeak, shareUnder, truePeak } from './measure.mjs';

const args = process.argv.slice(2), dir = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'out-audio');
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3), only = opt('only')?.split(','), check = args.includes('--check'), base = opt('base');
const meta = JSON.parse(fs.readFileSync(path.join(dir, 'meta.json'), 'utf8'));
const load = (d, n) => { const b = fs.readFileSync(path.join(d, 'raw', `${n}.f32`)), x = new Float32Array(b.buffer, b.byteOffset, b.length >> 2), l = new Float32Array(x.length >> 1), r = new Float32Array(x.length >> 1); for (let i = 0; i < l.length; i++) { l[i] = x[2 * i]; r[i] = x[2 * i + 1]; } return [l, r]; };
const mid = ([l, r]) => { const m = new Float32Array(l.length); for (let i = 0; i < m.length; i++) m[i] = (l[i] + r[i]) / 2; return m; };
const r1 = (v) => Math.round(v * 10) / 10, r3 = (v) => Math.round(v * 1000) / 1000;

function measure(d, n) {
  const c = load(d, n), L = loudness(c, 44100), s = samplePeak(c), o = { lufs: r1(L.lufs), short: r1(L.short), tp: r1(truePeak(c)), peak: r3(s.peak), over: s.over, corr: r3(correlation(c[0], c[1])) };
  if (/^(amb|mix)-/.test(n)) { const m = mid(c), a = repetition(m, 44100), b = repetition(m, 44100, 1, 6, 16); o.rep = r3(a.value); o.repLag = r3(a.lag); o.repLong = r3(b.value); o.repLongLag = r3(b.lag); o.rms = r1(rmsDb(m)); }
  if (/^fx-/.test(n)) { const m = mid(c), e = m.reduce((p, v, i) => (Math.abs(v) > 1e-3 ? i : p), 0); o.low = r3(shareUnder(m.subarray(0, Math.max(64, e)), 44100, 200)); o.rms = r1(rmsDb(m.subarray(0, Math.max(64, e)))); }
  return o;
}

const names = Object.keys(meta).filter((n) => !only || only.some((w) => n.includes(w))), R = {};
for (const n of names) R[n] = measure(dir, n);
const B = {}; if (base) for (const n of names) if (fs.existsSync(path.join(base, 'raw', `${n}.f32`))) B[n] = measure(path.resolve(base), n);
fs.writeFileSync(path.join(dir, 'analysis.json'), JSON.stringify(R, null, 0));
for (const n of names) {
  const r = R[n], b = B[n];
  console.log(n.padEnd(30), `${r.lufs} LUFS`.padEnd(13), `${r.tp} dBTP`.padEnd(13), `corr ${r.corr}`.padEnd(12), r.rep !== undefined ? `rep ${r.rep}@${r.repLag} long ${r.repLong}@${r.repLongLag}` : r.low !== undefined ? `low ${r.low}` : '', b ? `| avant ${b.lufs} LUFS, ${b.tp} dBTP, corr ${b.corr}${b.rep !== undefined ? `, rep ${b.rep}` : ''}` : '');
}

if (check) {
  const miss = [], need = (ok, what) => { if (!ok) miss.push(what); };
  for (const n of names) {
    const r = R[n];
    if (n.startsWith('mix-') || n.startsWith('duel-marek-night') || n.startsWith('duel-vessa')) need(Math.abs(r.lufs + 18) <= 2, `${n}: ${r.lufs} LUFS, target -18 +- 2`);
    if (n.endsWith('-vol1')) { need(r.tp <= -1, `${n}: ${r.tp} dBTP over -1`); need(r.over === 0, `${n}: ${r.over} samples over 1`); }
    // the beds alone: a mix holds the tune's drone, whose own period is no loop of the noise
    if (/^amb-/.test(n)) { need(r.rep < 0.2, `${n}: repetition ${r.rep} at ${r.repLag} s`); need(r.repLong < 0.2, `${n}: long repetition ${r.repLong} at ${r.repLongLag} s`); }
    if (/^(mix|amb|duel)-/.test(n)) need(r.corr < 0.98, `${n}: mono (correlation ${r.corr})`);
  }
  for (const n of names.filter((x) => /^mix-/.test(x) && !x.endsWith('-bout'))) {
    const [, p, l] = n.split('-'), a = R[`amb-${p}-${l}`], m = R[`mus-${l}`];
    if (a && m) { const d = r1(m.lufs - a.lufs); need(d >= 3 && d <= 6, `${n}: the music ${d} dB over the ambience, target 3 to 6`); }
  }
  // the interface over the arena's roar (journal Passe SN1: the click 1.2 dB under it); the effects are rendered at volume 1, the bed at 0.7
  for (const [e, most] of [['hit', 0.6], ['heavy', 0.8], ['ko', 0.95]]) if (R[`fx-${e}`]) need(R[`fx-${e}`].low <= most, `${e}: ${R[`fx-${e}`].low} of its energy under 200 Hz, at most ${most}`);
  const bed = R['amb-arena-night'];
  if (bed) for (const e of ['click', 'open', 'coin']) { const f = R[`fx-${e}`]; if (f) { const d = r1(f.rms + 20 * Math.log10(0.7) - bed.rms); console.log(`${e} over the arena's bed: ${d} dB`); need(d >= 3, `${e}: ${d} dB over the arena's bed, at least 3`); } }
  console.log(miss.length ? `\nFAILED ${miss.length}:\n  ${miss.join('\n  ')}` : '\nall checks passed');
  if (miss.length) process.exitCode = 1;
}
