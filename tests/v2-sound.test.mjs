// The version 2's sound (lot V8; the operator's decision AV-17 « Effets, ambiances et musique simple », journal Passe V8): everything made by
// the code, no audio file; the effects' recipes, the ambiences of each place by day and by night, a tune on the day state's mode, the
// settings kept and checked; nothing before a gesture; only the version 2's pages make a sound.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from './load.mjs';

const S = await load('/src/audio/score.ts');
const LOOKS = ['morning', 'midday', 'afternoon', 'night'], PLACES = ['district', 'forecourt', 'training', 'festival', 'arena'];
const src = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

test('the effects: every duel and interface moment has a short sound made of oscillators and noise', () => {
  for (const e of ['hit', 'heavy', 'guard', 'dodge', 'tier', 'release', 'ko', 'break', 'click', 'open', 'coin', 'step', 'denied']) {
    const v = S.EFFECTS[e]; assert.ok(v?.length, e);
    for (const x of v) { assert.ok(x.gain > 0 && x.gain <= 1 && x.attack > 0 && x.decay > 0 && x.f0 >= 20 && x.f1 >= 20, `${e} voice`); }
    assert.ok(S.effectLength(e) <= 1.5, `${e} short`);
  }
  assert.ok(S.effectLength('ko') > S.effectLength('hit') && S.effectLength('heavy') > S.effectLength('hit'), 'the heavy blows last longer');
});

test('the ambiences: a bed in every place at every hour; birds by day, crickets at night; the arena roars; the bouts heard from the town', () => {
  for (const p of PLACES) for (const l of LOOKS) {
    const a = S.ambienceOf(p, l);
    assert.ok(a.beds.length >= 1, `${p} ${l}`);
    const kinds = a.calls.map((c) => c.kind);
    assert.equal(kinds.includes('cricket'), l === 'night', `${p} ${l} crickets`); assert.equal(kinds.includes('bird'), l !== 'night', `${p} ${l} birds`);
    for (const b of a.beds) assert.ok(b.gain > 0 && b.gain <= 0.2);
  }
  assert.ok(S.ambienceOf('arena', 'midday').beds.some((b) => b.kind === 'roar'));
  assert.ok(S.ambienceOf('forecourt', 'midday', true).calls.some((c) => c.kind === 'cheer')); assert.ok(!S.ambienceOf('forecourt', 'midday').calls.some((c) => c.kind === 'cheer'));
  assert.ok(S.ambienceOf('festival', 'night').calls.some((c) => c.kind === 'lute'), 'a lute on the festival square');
  assert.ok(!S.ambienceOf('district', 'night').calls.some((c) => c.kind === 'hammer'), 'the forge\'s hammer sleeps at night');
});

test('the music: the same seed gives the same tune; every note on the day state\'s mode; it comes home to the tonic; night is slower', () => {
  for (const l of LOOKS) {
    const a = S.tune(7, l), b = S.tune(7, l);
    assert.deepEqual(a, b);
    const pcs = new Set(S.MODES[l].map((x) => (S.TONIC[l] + x) % 12));
    for (const n of a.notes) assert.ok(pcs.has(((n.midi % 12) + 12) % 12), `${l}: ${n.midi} on the mode`);
    assert.equal(a.notes.at(-1).midi % 12, S.TONIC[l] % 12, `${l} ends on the tonic`);
    assert.ok(a.notes.every((n) => n.midi >= 40 && n.midi <= 96 && n.t >= 0 && n.t < a.length));
    assert.ok(a.notes.length >= 20);
  }
  // the modes themselves: the morning a major pentatonic (five notes, no semitone), the others diatonic (seven, two semitones), the night minor
  const semis = (m) => m.map((x, i) => ((m[(i + 1) % m.length] - x) + 12) % 12).filter((d) => d === 1).length;
  assert.equal(S.MODES.morning.length, 5); assert.equal(semis(S.MODES.morning), 0);
  for (const l of ['midday', 'afternoon', 'night']) { assert.equal(S.MODES[l].length, 7); assert.equal(semis(S.MODES[l]), 2, l); }
  assert.ok(S.MODES.night.includes(3) && !S.MODES.midday.includes(3), 'the night\'s minor third');
  assert.notDeepEqual(S.tune(7, 'midday').notes, S.tune(8, 'midday').notes);
  assert.ok(S.TEMPO.night < S.TEMPO.midday);
  assert.equal(Math.round(S.hz(69)), 440); assert.equal(Math.round(S.hz(57)), 220);
});

test('the settings: kept values read back within bounds; anything broken is the default', () => {
  assert.deepEqual(S.readSettings(null), S.DEFAULT_SETTINGS);
  assert.deepEqual(S.readSettings('{oops'), S.DEFAULT_SETTINGS);
  assert.deepEqual(S.readSettings('{"volume":3,"muted":true,"music":-1}'), { volume: 1, muted: true, music: 0 });
  assert.deepEqual(S.readSettings('{"volume":"x"}'), S.DEFAULT_SETTINGS);
});

test('no sound before a gesture; only the version 2\'s pages load the engine', () => {
  const eng = src('src/audio/Sound.ts');
  assert.equal((eng.match(/new Ctx\(/g) ?? []).length, 1);
  assert.ok(eng.indexOf('new Ctx(') > eng.indexOf('async unlock()'), 'the context is made in unlock');
  assert.match(eng, /addEventListener\('pointerdown', start/); assert.match(eng, /addEventListener\('keydown', start/);
  assert.doesNotMatch(eng, /\.(mp3|ogg|wav|m4a)\b/, 'no audio file');
  // every importer of the engine: a dynamic import, behind the version 2
  const files = [];
  const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.ts$/.test(f)) files.push(p); } };
  // fileURLToPath, not URL.pathname: on Windows the pathname is '/C:/...' and path.join turns it into 'C:\C:\...' (journal Passe FV2)
  walk(fileURLToPath(new URL('../src', import.meta.url)));
  const users = files.filter((f) => !f.includes(`${path.sep}audio${path.sep}`) && /audio\/Sound/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(fileURLToPath(new URL('..', import.meta.url)), f).split(path.sep).join('/')).sort();
  assert.deepEqual(users, ['src/arena/ArenaApp.ts', 'src/ui/playPlaza.ts', 'src/ui/playTown.ts', 'src/ui/townUi.ts']);
  for (const f of users) { const t = src(f); assert.doesNotMatch(t, /^import .*audio\/Sound/m, `${f}: no static import`); }
  assert.match(src('src/ui/playTown.ts'), /if \(isV2\(st\)\) void import\('\.\.\/audio\/Sound'\)/);
  assert.match(src('src/arena/ArenaApp.ts'), /else if \(this\.rules === 'v2'\) \{[^]*?import\('\.\.\/audio\/Sound'\)/);
});
