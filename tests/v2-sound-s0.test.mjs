// Lot S0 of the sound (journal Passes SN1 / SN2): the noise that no longer loops, the blows that never repeat, the mix's order, the ceiling, the duel's
// table (a tier the AP close is silent, a light release too), the effects wired from outside the interface. The loudness itself is rendered and
// measured by tools/audio/analyse.mjs (a browser's OfflineAudioContext): here, the pure half.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';
import { repetition, correlation } from '../tools/audio/measure.mjs';

const S = await load('/src/audio/score.ts');
const src = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('the noise: no cycle in its buffer, unlike the old generator, and two seeds unrelated', () => {
  const n = 44100 * S.NOISE_SECONDS, a = S.noiseSamples(n, 0x12345), b = S.noiseSamples(n, 0x6789a);
  assert.ok(repetition(a, 44100, 0.05, 6, 7).value < 0.02, 'no repetition up to 6 s');
  assert.ok(Math.abs(correlation(a, b)) < 0.02);
  assert.ok(a.every((v) => v >= -1 && v <= 1.0001)); assert.ok(Math.abs(a.reduce((s, v) => s + v, 0) / n) < 0.01, 'centred');
  // the state never comes back inside the buffer: the old generator's cycle was 10 466 samples
  const seen = new Set(); let x = 0x12345, repeated = false;
  for (let i = 0; i < n && !repeated; i++) { x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff; repeated = seen.has(x); seen.add(x); }
  assert.equal(repeated, false);
  // the negative control: the old line loops
  let y = 0x12345; const old = new Float32Array(n); for (let i = 0; i < n; i++) { y = (y * 1103515245 + 12345) & 0x7fffffff; old[i] = y / 0x3fffffff - 1; }
  assert.ok(repetition(old, 44100).value > 0.9);
  assert.deepEqual(S.noiseSamples(64, 7), S.noiseSamples(64, 7));
});

test('the takes: no blow repeats the one before, the moves stay within their bounds, the interface stays the same', () => {
  let seed = 7; const draw = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  for (const e of ['hit', 'heavy', 'guard', 'dodge', 'step']) {
    let k = 2; const seenF = new Set();
    for (let i = 0; i < 300; i++) {
      const t = S.take(e, draw, k); assert.ok(Math.abs(t.k - k) >= 0.35 || k === 2, `${e} a take far from the last`); k = t.k;
      assert.ok(t.k >= -1 && t.k <= 1);
      const v = S.VARY[e];
      t.voices.forEach((x, j) => {
        const o = S.EFFECTS[e][j], r = x.f0 / o.f0;
        assert.ok(r > (1 - v.pitch) * 0.98 && r < (1 + v.pitch) * 1.02, `${e} pitch ${r}`);
        assert.ok(x.gain <= 1 && x.gain > 0 && x.decay > 0 && x.f1 >= 20);
      });
      seenF.add(t.voices[0].f0.toFixed(1));
    }
    assert.ok(seenF.size > 100, `${e} varies`);
  }
  for (const e of ['click', 'open']) assert.equal(S.take(e, draw).voices, S.EFFECTS[e]);
  // the blows have their own middle: a laptop's speakers play what lives over 800 Hz (journal Passe SN1)
  for (const e of ['hit', 'heavy', 'ko']) assert.ok(S.EFFECTS[e].some((v) => v.wave === 'noise' && v.f0 >= 1000 && v.gain >= 0.7), e);
});

test('the duel\'s table: each impact its sound and its side; a closed tier and a light release are silent; only Ren\'s refusals sound', () => {
  const q = S.duelCue;
  assert.equal(q({ type: 'impact', result: 'hit', kind: 'light', damage: 10, to: 'marek' }).effect, 'hit');
  assert.equal(q({ type: 'impact', result: 'hit', kind: 'light', damage: 20, to: 'marek' }).effect, 'heavy');
  assert.equal(q({ type: 'impact', result: 'hit', kind: 'heavy', damage: 1, to: 'ren' }).effect, 'heavy');
  assert.equal(q({ type: 'impact', result: 'guarded', kind: 'heavy', damage: 1, to: 'ren' }).effect, 'guard');
  assert.equal(q({ type: 'impact', result: 'guardbreak', kind: 'light', damage: 1, to: 'ren' }).effect, 'break');
  assert.equal(q({ type: 'impact', result: 'dodged', kind: 'light', damage: 0, to: 'ren' }).effect, 'dodge');
  assert.ok(q({ type: 'impact', result: 'hit', kind: 'light', damage: 1, to: 'ren' }).pan < 0, 'Ren on the left');
  assert.ok(q({ type: 'impact', result: 'hit', kind: 'light', damage: 1, to: 'marek' }).pan > 0);
  assert.equal(q({ type: 'chargeTier', idx: 2, open: false }), null, 'a tier the AP close');
  const t1 = q({ type: 'chargeTier', idx: 1, open: true }), t3 = q({ type: 'chargeTier', idx: 3, open: true });
  assert.equal(t1.effect, 'tier'); assert.ok(t3.rate > t1.rate, 'each tier a step higher');
  assert.equal(q({ type: 'chargeRelease', idx: 0, ok: true }), null, 'a light blow');
  assert.equal(q({ type: 'chargeRelease', idx: 1, ok: false }), null, 'a release the duel refused');
  assert.equal(q({ type: 'chargeRelease', idx: 1, ok: true }).effect, 'release');
  assert.equal(q({ type: 'commandDenied', who: 'marek' }), null); assert.equal(q({ type: 'commandDenied', who: 'ren' }).effect, 'denied');
  assert.equal(q({ type: 'reactStart', who: 'ren' }).gain, 0.6); assert.equal(q({ type: 'reactStart', who: 'marek' }), null);
  assert.equal(q({ type: 'ko' }).effect, 'ko'); assert.equal(q({ type: 'break', who: 'ren' }).effect, 'break');
  assert.equal(q({ type: 'effect' }), null, 'lot S3');
});

test('the mix: the ceiling never passes its level and leaves what is under its knee; the rooms fit the sample rates; the buses reach every place', () => {
  const c = S.ceilingCurve(), mid = (c.length - 1) / 2;
  assert.equal(c.length, S.LIMITER.curve); assert.ok(c.every((v) => Math.abs(v) <= S.LIMITER.ceiling + 1e-6));
  assert.ok(Math.abs(c[c.length - 1]) > S.LIMITER.ceiling - 0.01, 'the ceiling is reached');
  // the curve is read over [-1, 1] at half level: an input of 0.3 full scale sits at 0.15 of its range, and comes out at 0.3
  assert.ok(Math.abs(c[Math.round(mid * (1 + 0.15))] - 0.3) < 0.001); assert.ok(Math.abs(c[mid]) < 1e-6);
  assert.ok(S.LIMITER.ceiling <= 10 ** (-1 / 20), 'the fiche\'s -1 dBTP');
  for (const p of ['district', 'forecourt', 'training', 'festival', 'arena']) {
    const [l, r] = S.roomImpulse(p, 44100); assert.equal(l.length, Math.floor(S.ROOM[p].secs * 44100));
    assert.ok(l.every(Number.isFinite) && r.every(Number.isFinite)); assert.ok(Math.abs(correlation(l, r)) < 0.1, `${p}: a wide room`);
    const tail = (d) => Math.max(...d.subarray(d.length - 2000).map(Math.abs)); assert.ok(tail(l) < 0.01, `${p} decays`);
    for (const look of ['morning', 'midday', 'afternoon', 'night']) assert.ok(Math.abs(S.ambienceOf(p, look).trim) < 24, `${p} ${look}`);
  }
  assert.ok(S.ROOM.arena.secs > S.ROOM.district.secs, 'the bowl rings longer than the street');
  assert.ok(S.EFFECTS.click && S.UI_EFFECTS.has('click') && S.UI_EFFECTS.has('coin') && !S.UI_EFFECTS.has('hit'));
});

test('the four effects no code played: wired from outside the interface, by the engine\'s page alone', () => {
  const h = src('src/audio/hooks.ts');
  for (const e of ['click', 'open', 'coin', 'step']) assert.match(h, new RegExp(`s\\.play\\('${e}'\\)`), e);
  assert.match(src('src/audio/Sound.ts'), /installSoundHooks\(shared\)/);
  assert.equal(src('src/arena/ArenaApp.ts').includes('soundOf'), false, 'the table lives in the pure half');
  assert.doesNotMatch(src('src/audio/Sound.ts'), /Math\.random/, 'a sound never draws from the seeded Math.random of a proof');
});
