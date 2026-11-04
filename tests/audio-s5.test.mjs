// Lot S5 of the sound (journal Passes SN21 / SN22), the mixing and the reception, as the operator decided it on the sheet briefs/fiche-son-reception.html, word for
// word: S5-PAGES « Bien ainsi, avec la correction »; S5-COMBAT « Bien ainsi »; S5-FOULE « Creuser la foule à 500 Hz »; S5-REFUS « Le refus 6 dB plus fort hors du
// duel »; S5-MOMENTS « Bien ainsi »; S5-DUREE « Rien à changer »; S5-JEU « Bien dans le jeu »; S5-RECEPTION « Reçu, avec les réglages choisis sur cette fiche »;
// SA-10 « Pas de compositeur : la musique du groupe reste ». Here: the record a page leaves (the correction), the refusal out of the duel, the crowd carved.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const S = await load('/src/audio/score.ts'), X = await load('/src/audio/sfx.ts'), H = await load('/src/audio/hooks.ts');
const src = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const MIN = 60 * 1000;

test('the record a page leaves: the music playing at this moment; a page whose music stopped passes on the one it found, with its time (S5-PAGES)', () => {
  const found = { key: 'band:parvis', pos: 33.9, heard: true, at: 1000 };
  assert.deepEqual(S.recordOf({ key: 'band:fin', pos: 4.2 }, found, true, 9000), { key: 'band:fin', pos: 4.2, heard: true, at: 9000 }, 'a page with its music: now');
  assert.deepEqual(S.recordOf(null, found, true, 1000 + 7.5 * MIN), found, 'the duel after its K.O.: the forecourt\'s record, its time kept');
  assert.deepEqual(S.recordOf(null, null, false, 5000), { key: '', pos: 0, heard: false, at: 5000 }, 'nothing found, nothing playing');
  assert.equal(S.recordOf(null, { ...found, heard: false }, true, 2000).heard, true, 'a gesture on this page is kept');
  // the forecourt, a bout of 7 min 30, the forecourt again: taken up where it stood; after a bout of 11 min it starts over (the old record said 0 min ago)
  const short = S.recordOf(null, found, true, 1000 + 7.5 * MIN), long = S.recordOf(null, found, true, 1000 + 11 * MIN);
  assert.equal(S.resumeAt(short, 'band:parvis', 50, 1000 + 7.5 * MIN + 2000), 33.9);
  assert.equal(S.resumeAt(long, 'band:parvis', 50, 1000 + 11 * MIN + 2000), 0, 'more than ten minutes since the forecourt was heard');
  assert.match(src('src/audio/Sound.ts'), /recordOf\(this\.nowPlaying\(\), this\.resume, this\.begun \|\| this\.resume\?\.heard === true, Date\.now\(\)\)/, 'the engine keeps its record so');
});

test('an action of the game refused: 6 dB over the duel\'s refused command; the duel\'s stays as it is (S5-REFUS)', () => {
  assert.equal(S.REFUSAL_LIFT, 6);
  assert.equal(S.UI_LEVEL.denied, 0.29, 'the interface\'s level of the refusal: the duel\'s, unchanged');
  assert.deepEqual(X.sfxOf({ type: 'commandDenied', who: 'ren' }, 6).map((c) => c.id), ['denied'], 'the duel: the band\'s sound at its trim');
  assert.equal(X.SFX_TRIM, -10.7);
  assert.equal(S.duelCue({ type: 'commandDenied', who: 'ren' }).gain, undefined, 'the duel before its sounds are decoded: lot S0\'s level');
  const played = [], timers = [], saved = { window: globalThis.window, document: globalThis.document, MutationObserver: globalThis.MutationObserver };
  try {
    globalThis.window = { setInterval: (f) => { timers.push(f); return 1; } };
    globalThis.document = { addEventListener() {}, querySelector: () => null, body: {} };
    globalThis.MutationObserver = class { observe() {} };
    H.installSoundHooks({ play: (e, g) => played.push([e, g]), leave: () => 0 });
    let answer = { ok: false, reason: 'coins' };
    window.__game = { state: () => ({ player: { coins: 5 } }), subscribe() {}, act: () => answer };
    timers[0]();
    window.__game.act({ type: 'buy' });
    assert.equal(played.length, 1); assert.equal(played[0][0], 'denied');
    assert.ok(Math.abs(20 * Math.log10(played[0][1]) - 6) < 1e-9, `6 dB: ${played[0][1]}`);
    assert.ok(Math.abs(played[0][1] * S.UI_LEVEL.denied - 0.58) < 0.002, 'the level heard on the sheet (0.58)');
    answer = { ok: true }; window.__game.act({ type: 'rest' }); assert.equal(played.length, 1, 'an accepted action: no sound');
  } finally { Object.assign(globalThis, saved); }
});

test('the arena\'s crowd carved around 500 Hz: a peaking filter, its murmur and its reactions through it; its level and the duel\'s otherwise kept (S5-FOULE, S5-COMBAT)', () => {
  assert.deepEqual({ ...X.CROWD_CARVE }, { hz: 500, q: 1, db: -5 });
  assert.ok(Math.abs(X.CROWD_TRIM - (0.7 - S.MIX.ambience)) < 1e-9, 'the crowd\'s trim of lot S3');
  assert.deepEqual({ ...S.MIX }, { ambience: 1.6, music: -1.6, fx: 9.6, ui: 9.6, reverb: 1.6 }, 'S5-COMBAT « Bien ainsi »: no trim of the duel\'s page');
  const code = src('src/audio/Sound.ts'), scene = code.slice(code.indexOf('private crowdScene('), code.indexOf('/** synchronous layers'));
  assert.match(scene, /carve\.type = 'peaking'; carve\.frequency\.value = CROWD_CARVE\.hz; carve\.Q\.value = CROWD_CARVE\.q; carve\.gain\.value = CROWD_CARVE\.db;/);
  assert.match(scene, /carve\.connect\(group\);\s*this\.crowd = carve;/, 'the crowd\'s way: through the carve, then its group');
  assert.match(scene, /s\.connect\(carve\)/, 'the murmur through it');
  assert.match(code, /g\.connect\(this\.crowd\); s\.start/, 'the reactions through it');
  // the peaking filter of the Web Audio API (the RBJ cookbook): -5 dB at 500 Hz, under a decibel an octave and a half away, nothing at the ends
  const resp = (f, sr = 48000) => {
    const A = 10 ** (X.CROWD_CARVE.db / 40), w0 = 2 * Math.PI * X.CROWD_CARVE.hz / sr, al = Math.sin(w0) / (2 * X.CROWD_CARVE.q), c = Math.cos(w0);
    const b = [1 + al * A, -2 * c, 1 - al * A], a = [1 + al / A, -2 * c, 1 - al / A], w = 2 * Math.PI * f / sr;
    const z = (k) => [Math.cos(-w * k), Math.sin(-w * k)], sum = (p) => p.reduce(([r, i], v, k) => [r + v * z(k)[0], i + v * z(k)[1]], [0, 0]);
    const [nr, ni] = sum(b), [dr, di] = sum(a);
    return 10 * Math.log10((nr * nr + ni * ni) / (dr * dr + di * di));
  };
  assert.ok(Math.abs(resp(500) + 5) < 1e-6);
  assert.ok(resp(150) > -1 && resp(1700) > -1, `${resp(150).toFixed(2)} / ${resp(1700).toFixed(2)} dB`);
  assert.ok(resp(40) > -0.1 && resp(8000) > -0.1);
});
