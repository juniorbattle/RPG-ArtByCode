// The band's offline sound (journal Passe SN5): the instruments in tune, the scores' notes read without an ear (dry sessions: no sound computed), the theory, one
// short render against its seed. A piece's beauty is the operator's ear: these find faults, they do not say it is good.
import test from 'node:test';
import assert from 'node:assert/strict';
import { SR, hz, Rand, seedOf, ring, room, convolve } from '../tools/audio/band/dsp.mjs';
import { rhodes, bass, nylon, vibes, ewi, flute, gestures } from '../tools/audio/band/instruments.mjs';
import { drum, DRUMS } from '../tools/audio/band/drums.mjs';
import { Session, parseChord, tonesOf, voice, parseLine, midiOf, master } from '../tools/audio/band/session.mjs';
import { hasMotif, rubs, outOfRange, octaves, seam } from '../tools/audio/band/check.mjs';
import { fft } from '../tools/audio/measure.mjs';
import { MOTIF } from '../art-lab/audio/scores/theme.mjs';
import midi, { tunes as midiTunes } from '../art-lab/audio/scores/midi.score.mjs';
import matin, { tunes as matinTunes } from '../art-lab/audio/scores/matin.score.mjs';
import nuit, { tunes as nuitTunes } from '../art-lab/audio/scores/nuit.score.mjs';
import duel, { tunes as duelTunes } from '../art-lab/audio/scores/duel.score.mjs';
import titre, { tunes as titreTunes } from '../art-lab/audio/scores/titre.score.mjs';
import fin, { tunes as finTunes } from '../art-lab/audio/scores/fin.score.mjs';
import parvis, { tunes as parvisTunes } from '../art-lab/audio/scores/parvis.score.mjs';
import lices, { tunes as licesTunes } from '../art-lab/audio/scores/lices.score.mjs';
import valse, { tunes as valseTunes } from '../art-lab/audio/scores/valse.score.mjs';
import rival, { tunes as rivalTunes } from '../art-lab/audio/scores/rival.score.mjs';
import finale, { tunes as finaleTunes } from '../art-lab/audio/scores/finale.score.mjs';
import fanfare from '../art-lab/audio/scores/fanfare.score.mjs';
import victoire from '../art-lab/audio/scores/victoire.score.mjs';
import defaite from '../art-lab/audio/scores/defaite.score.mjs';

/** the strongest partial near a pitch, in cents from it */
function cents(x, f, from = 2000) {
  const n = 1 << 16, re = new Float64Array(n), im = new Float64Array(n); for (let i = 0; i < n && i + from < x.length; i++) re[i] = x[i + from] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / n)); fft(re, im);
  const m = (k) => Math.log(Math.hypot(re[k], im[k]) + 1e-12), k0 = Math.round(f * 0.9 * n / SR), k1 = Math.round(f * 1.1 * n / SR); let b = k0; for (let k = k0; k <= k1; k++) if (m(k) > m(b)) b = k;
  const p = 0.5 * (m(b - 1) - m(b + 1)) / (m(b - 1) - 2 * m(b) + m(b + 1)); return 1200 * Math.log2((b + p) * SR / n / f);
}
const finite = (x) => x.every((v) => Number.isFinite(v));

test('the theory: note names, chord symbols, a voicing near the last one and clear of the tune', () => {
  assert.equal(midiOf('A4'), 69); assert.equal(midiOf('F#4'), 66); assert.equal(midiOf('Bb3'), 58);
  const c = parseChord('Bbmaj9#11/D'); assert.equal(c.root, 10); assert.equal(c.bass, 2); assert.deepEqual(tonesOf(parseChord('Dm9')).sort((a, b) => a - b), [0, 2, 4, 5, 9]);
  assert.equal(parseChord('D6/9').bass, 2, 'six-nine is not a slash chord'); assert.throws(() => parseChord('Dbogus'));
  const a = voice(parseChord('Dm11'), null), b = voice(parseChord('G13sus'), a); assert.equal(a.length, 4); assert.ok(Math.abs(a[0] - b[0]) <= 7, 'the voices stay near each other');
  assert.ok(!voice(parseChord('Am11'), null, { avoid: new Set([0]) }).some((m) => m % 12 === 0), 'a tone left out for the tune');
  assert.equal(voice(parseChord('D'), null, { avoid: new Set([2, 6, 9]) }).length, 3, 'a chord keeps three tones whatever the tune');
});
test('a written line: lengths, marks and rests', () => {
  const l = parseLine('D5:3 .:2 A5:3! | E5:4~ F5:2^ G5:2v'); assert.equal(l.steps, 16); assert.deepEqual(l.notes.map((n) => n.at), [0, 5, 8, 12, 14]); assert.equal(l.notes[1].accent, true); assert.equal(l.notes[2].mods.vib, 1.6); assert.equal(l.notes[3].mods.bend, 1.6); assert.equal(l.notes[4].mods.fall, 3);
  assert.throws(() => parseLine('H5:2'));
});
test('the instruments are in tune and finite', () => {
  for (const [name, x, f] of [['rhodes', rhodes(62, 0.6), hz(62)], ['rhodes high', rhodes(86, 0.6), hz(86)], ['finger', bass(38, 0.8), hz(38)], ['thumb', bass(38, 0.8, 'thumb'), hz(38)], ['pop', bass(50, 0.8, 'pop'), hz(50)], ['fretless', bass(38, 0.8, 'fretless'), hz(38)], ['nylon', nylon(55, 0.6), hz(55)], ['vibes', vibes(74, 0.7), hz(74)]]) {
    assert.ok(finite(x), `${name} finite`); assert.ok(Math.abs(cents(x, f)) < 5, `${name} ${cents(x, f).toFixed(1)} cents`);
  }
  const held = [{ t: 0.05, dur: 1.8, midi: 74, vel: 0.8, mods: {} }], w = ewi(held, SR * 2), fl = flute(held, SR * 2);
  assert.ok(finite(w) && finite(fl), 'a wind voice starting off the control grid stays finite (journal Passe SN5: the filter was unset)');
  assert.ok(Math.abs(cents(w, hz(74), 12000)) < 5); assert.ok(Math.abs(cents(fl, hz(74), 12000)) < 5);
  for (const k of DRUMS) { const d = drum(k, 0.8, 0); assert.ok(finite(d) && d.some((v) => Math.abs(v) > 0.02), `${k} sounds`); }
});
test('a wind phrase: legato notes glide, a detached one scoops up from under its pitch', () => {
  const { P, B } = gestures([{ t: 0, dur: 0.3, midi: 60, vel: 0.8, mods: {} }, { t: 0.3, dur: 0.3, midi: 67, vel: 0.8, mods: {} }, { t: 0.8, dur: 0.3, midi: 60, vel: 0.8, mods: {} }], SR, { vibDepth: 0 });
  assert.ok(P[Math.round(0.002 * SR)] < 60, 'the attack scoops'); const mid = P[Math.round(0.315 * SR)]; assert.ok(mid > 60.5 && mid < 66.5, `the legato glides (${mid})`); assert.ok(B[Math.round(0.72 * SR)] < 0.05, 'the gap breathes');
});
test('a repeated note is tongued, a tied one has no hole: the fanfare\'s call stays three notes, the line no click (journal Passe SN5)', () => {
  const s = new Session({ id: 'r', bpm: 106, bars: 2, dry: true }), lead = s.track('lead'); s.phrase(lead, 0, 0, 'D6:3 D6:3 D6:2 A5:3 C6:5');
  const total = SR * 2, { B } = gestures(lead.notes, total, { vibDepth: 0 }), n = lead.notes, at = (t) => Math.round(t * SR);
  let dip = 1; for (let i = at(n[1].t - 0.04); i < at(n[1].t + 0.01); i++) dip = Math.min(dip, B[i]); assert.ok(dip < B[at(n[0].t + 0.1)] * 0.5, `the second D stands apart (${dip})`);
  for (let i = at(n[3].t); i < at(n[4].t + n[4].dur * 0.5); i++) assert.ok(B[i] > 0, 'no hole in a tied joint');
});
test('the bass counts degrees from the chord: a slash chord, a chord without a seventh', () => {
  const notes = (sym, row) => { const s = new Session({ id: 'b', bpm: 100, bars: 1, dry: true }), t = s.track('b'); s.bass(t, () => null, 0, sym, row); return s.events.map((e) => e.midi % 12); };
  assert.deepEqual(notes('D7/F#', '1...5...7...'), [6, 9, 0], 'over F sharp: the fifth is A, the seventh C');
  assert.deepEqual(notes('Cmaj9/E', '5...7...'), [7, 11]); assert.deepEqual(notes('Cadd9', '7...'), [7], 'no B flat invented'); assert.deepEqual(notes('D', '1...p...'), [2, 2]);
  assert.ok(notes('E', '7...').length === 1);
});
test('the spaces: a room per side, never the same, and a convolution that keeps the signal', () => {
  const [a, b] = room({ seed: 1, rt: 0.4 }); assert.equal(a.length, b.length); let same = 0; for (let i = 0; i < a.length; i++) if (a[i] === b[i] && a[i] !== 0) same++; assert.ok(same < 10);
  const y = convolve(Float32Array.of(0, 1, 0), Float32Array.of(1, 0.5)); assert.ok(Math.abs(y[1] - 1) < 1e-5 && Math.abs(y[2] - 0.5) < 1e-5);
  assert.equal(new Rand(seedOf('x')).next(), new Rand(seedOf('x')).next());
  const x = new Float32Array(2000); ring(x, [{ f: 440, a: 1, tau: 0.1 }]); assert.ok(Math.abs(x[50]) > 0);
});

const SCORES = [['midi', midi, midiTunes, 'lead'], ['matin', matin, matinTunes, 'flute'], ['nuit', nuit, nuitTunes, 'lead'], ['duel', duel, duelTunes, 'lead'], ['titre', titre, titreTunes, 'horn'], ['fin', fin, finTunes, 'lead'], ['parvis', parvis, parvisTunes, 'lead'], ['lices', lices, licesTunes, 'lead'], ['valse', valse, valseTunes, 'flute'], ['rival', rival, rivalTunes, 'lead'], ['finale', finale, finaleTunes, 'lead']];
const RANGE = { lead: [62, 100], flute: [60, 93], bass: [28, 67], fretless: [28, 67], nylon: [40, 86], rhodes: [40, 90], vibes: [53, 89], marimba: [48, 96], bouzouki: [50, 86] };
for (const [id, make, tunes, carrier] of SCORES) test(`« ${id} »: the motif, room for the tune, the ranges, the same notes for the same seed`, () => {
  const plan = make({ dry: true }), tune = plan.events.filter((e) => tunes.includes(e.track)), s = make({ dry: true, tune });
  assert.ok(hasMotif(s.events, carrier, MOTIF), 'SA-2: the thirteen notes, in order');
  const rub = rubs(s.events, tunes, { hold: 0.34, secondsPerBar: s.steps * s.stepSecs }); assert.ok(rub.length <= 1, JSON.stringify(rub));
  assert.deepEqual(outOfRange(s.events, RANGE), []);
  const again = make({ dry: true, tune }); assert.deepEqual(again.events.map((e) => [e.midi, e.t]), s.events.map((e) => [e.midi, e.t]));
  assert.ok(s.total / SR < 110, 'a piece of the catalogue');
  const looped = make({ dry: true, tune, looped: true }); assert.ok(looped.loop && looped.loopEnd > looped.loopStart, 'every piece goes round'); assert.ok(looped.loopEnd <= looped.total);
});
test('the third is the hour: F sharp in the morning, F natural at night', () => {
  const pcs = (make) => { const o = {}; for (const e of make({ dry: true }).events) o[e.midi % 12] = (o[e.midi % 12] ?? 0) + 1; return o; };
  const day = pcs(matin), night = pcs(nuit); assert.ok(day[6] > (day[5] ?? 0) * 8, `morning F# ${day[6]} F ${day[5]}`); assert.ok(night[5] > (night[6] ?? 0) * 8, `night F ${night[5]} F# ${night[6]}`);
});
test('a mix and its master: the level set, the ceiling held, the same seed the same bytes', () => {
  const make = () => { const s = new Session({ id: 't', seed: 3, bpm: 120, bars: 1, tail: 0.5 }), k = s.track('k', { room: 0.1 }); s.drums(k, 0, 1, { kick: 'X...X...X...X...', snare: '....X.......X...', hat: 'xoxoxoxoxoxoxoxo' }); return master(s.mix(), { lufs: -18 }); };
  const a = make(), b = make(); assert.ok(a.tp <= -1.2, `true peak ${a.tp}`); assert.deepEqual(a.L.slice(0, 4000), b.L.slice(0, 4000));
  assert.ok(Object.keys(octaves(a.L, SR, 1 << 12)).length === 10);
});
test('the catalogue: twelve pieces, twelve minutes (SA-6), the jingles short', () => {
  const secs = (make) => { const s = make({ dry: true }); return s.bars * s.steps * s.stepSecs; }, pieces = SCORES.map(([, make]) => secs(make)), jingles = [fanfare, victoire, defaite].map(secs), total = [...pieces, ...jingles].reduce((a, b) => a + b, 0);
  assert.equal(SCORES.length + 1, 12, 'eleven pieces and the jingles'); assert.ok(total > 600 && total < 800, `${(total / 60).toFixed(1)} minutes`); for (const j of jingles) assert.ok(j < 14, `a jingle of ${j} s`);
});
test('a loop: what rings past its end lands on its start, the file stops on its last sample', () => {
  const s = new Session({ id: 'l', seed: 2, bpm: 120, bars: 3, tail: 1, loop: { from: 1, to: 2 } }), st = new Float32Array(s.total), a = s.loopStart, b = s.loopEnd; st[b + 10] = 1; st[a - 5] = 0.5; st[a + 7] = 0.25;
  const out = s.wrap(new Map([['main', [st, Float32Array.from(st)]]])).get('main'), len = b - a; assert.equal(out[0].length, len, 'the file is the loop'); assert.equal(out[0][10], 1); assert.equal(out[0][7], 0.25); assert.equal(out[0][len - 5], 0.5, 'a hit a hair early lands on the end');
  assert.ok(s.beforeLoop(s.t(0, 8)), 'the intro is not played'); assert.ok(!s.beforeLoop(s.t(1, 0) - 0.01), 'a hit a hair early is');
  const tr = s.track('t', {}); tr.sound(() => new Float32Array(100).fill(1), s.t(0, 2)); assert.equal(tr.L.reduce((n, v) => n + (v ? 1 : 0), 0), 0);
});
test('a master in a circle: the level still set, the first sample following the last', () => {
  const s = new Session({ id: 'c', seed: 4, bpm: 120, bars: 3, tail: 1, loop: { from: 1, to: 3 } }), k = s.track('k', { room: 0.1 }); s.drums(k, 0, 3, { kick: 'X...X...X...X...', snare: '....X.......X...', hat: 'xoxoxoxoxoxoxoxo' });
  const m = master(s.mix(), { lufs: -18, circular: true }), j = seam([m.L, m.R], SR, 0, m.L.length); assert.equal(m.L.length, s.loopEnd - s.loopStart); assert.ok(m.tp <= -1.2); assert.ok(j.ofLargest < 0.5, JSON.stringify(j));
});
