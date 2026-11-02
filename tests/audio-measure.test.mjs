// The sound's measures (tools/audio/measure.mjs, journal Passe SN2) against what they must read: EBU Tech 3341's loudness cases, a true peak
// between the samples, a looping noise found and a white noise not.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loudness, truePeak, samplePeak, repetition, correlation, shareUnder, wavBytes } from '../tools/audio/measure.mjs';

const SR = 48000;
const sine = (hz, dbfs, secs, phase = 0) => { const a = 10 ** (dbfs / 20), x = new Float32Array(Math.round(secs * SR)); for (let i = 0; i < x.length; i++) x[i] = a * Math.sin(2 * Math.PI * hz * i / SR + phase); return x; };
const join = (...p) => { const o = new Float32Array(p.reduce((s, x) => s + x.length, 0)); let k = 0; for (const x of p) { o.set(x, k); k += x.length; } return o; };
const white = (n, seed = 1) => { const x = new Float32Array(n); let s = seed; for (let i = 0; i < n; i++) { s = (Math.imul(s, 1664525) + 1013904223) | 0; x[i] = s / 2147483648; } return x; };

test('loudness: EBU Tech 3341 cases 1, 2 and 3 (a stereo sine; the gates)', () => {
  const near = (v, want) => assert.ok(Math.abs(v - want) <= 0.1, `${v} for ${want}`);
  const a = sine(1000, -23, 20); near(loudness([a, a], SR).lufs, -23);
  const b = sine(1000, -33, 20); near(loudness([b, b], SR).lufs, -33);
  const c = join(sine(1000, -36, 10), sine(1000, -23, 60), sine(1000, -36, 10)); near(loudness([c, c], SR).lufs, -23);      // the relative gate drops the -36
  const d = join(sine(1000, -72, 10), sine(1000, -36, 10), sine(1000, -23, 60), sine(1000, -36, 10), sine(1000, -72, 10)); near(loudness([d, d], SR).lufs, -23);
  // one channel alone: 3 dB lower
  const z = new Float32Array(a.length); assert.ok(Math.abs(loudness([a, z], SR).lufs - -26) <= 0.1);
  assert.equal(loudness([z, z], SR).lufs, -70, 'silence');
});

test('true peak: the peak between the samples of a sine at a quarter of the rate', () => {
  const a = sine(SR / 4, 0, 1, Math.PI / 4);                                  // every sample at 0.707
  assert.ok(samplePeak([a]).peak < 0.72);
  assert.ok(Math.abs(truePeak([a])) < 0.15, `${truePeak([a])} dBTP`);
  const b = sine(997, -6, 1); assert.ok(Math.abs(truePeak([b]) - -6) < 0.05);
  assert.equal(samplePeak([Float32Array.from([0.5, 1.2, -1.1])]).over, 2);
});

test('repetition: a noise that loops at 0.237 s is found, a white noise is not', () => {
  const unit = white(Math.round(0.2373 * SR)), loop = new Float32Array(SR * 8);
  for (let i = 0; i < loop.length; i++) loop[i] = unit[i % unit.length];
  const r = repetition(loop, SR);
  assert.ok(r.value > 0.95 && Math.abs(r.lag - 0.2373) < 0.001, JSON.stringify(r));
  assert.ok(repetition(white(SR * 8), SR).value < 0.05);
});

test('correlation, the low band, the WAV header', () => {
  const a = white(SR), b = white(SR, 7);
  assert.ok(Math.abs(correlation(a, a) - 1) < 1e-9); assert.ok(Math.abs(correlation(a, b)) < 0.05);
  assert.ok(shareUnder(sine(100, -6, 0.5), SR, 200) > 0.99); assert.ok(shareUnder(sine(1000, -6, 0.5), SR, 200) < 0.01);
  const w = wavBytes([Float32Array.from([0, 1]), Float32Array.from([-1, 0.5])], 44100);
  assert.equal(w.toString('ascii', 0, 4), 'RIFF'); assert.equal(w.readUInt16LE(22), 2); assert.equal(w.readUInt32LE(24), 44100); assert.equal(w.length, 44 + 8);
  assert.equal(w.readInt16LE(46), -32767);
});
