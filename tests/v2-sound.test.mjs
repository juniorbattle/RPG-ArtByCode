// The version 2's sound (lot V8, journal Passe V8; the operator's decision SA-8 « Elle bouge : cuit, avec manifeste », journal Passe SN1, replaced
// AV-17's « no audio file »: a baked file reaches the game only through a manifest); the effects' recipes, the ambiences of each place by day and by night, the band's plan
// (journal Passe SN10: which piece where, the fights' layers), the settings kept and checked; nothing before a gesture; only the version 2's pages make a sound.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { load } from './load.mjs';

const S = await load('/src/audio/score.ts'), P = await load('/src/audio/plan.ts');
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

test('the band\'s plan (journal Passe SN10; C-LIEUX « Valider ce plan »): the town by the hour, the forecourt and the lists by day and the night\'s in the evening, the waltz at every hour, the fights by the tournament, the title on a new game', () => {
  // the card's plan, read by hand (briefs/fiche-son-catalogue.html, C-LIEUX)
  const WANT = { district: { morning: 'matin', midday: 'midi', afternoon: 'fin', night: 'nuit' }, forecourt: { morning: 'parvis', midday: 'parvis', afternoon: 'parvis', night: 'nuit' },
    training: { morning: 'lices', midday: 'lices', afternoon: 'lices', night: 'nuit' }, festival: { morning: 'valse', midday: 'valse', afternoon: 'valse', night: 'valse' } };
  for (const [p, row] of Object.entries(WANT)) for (const l of LOOKS) { assert.equal(P.pieceFor(p, l), row[l], `${p} ${l}`); assert.equal(P.pieceFor(p, l, { opening: true }), 'titre', `a new game opens on the title (${p} ${l})`); }
  for (const l of LOOKS) { assert.equal(P.pieceFor('arena', l), 'duel'); assert.equal(P.pieceFor('arena', l, { bout: 'finale', opening: true }), 'finale'); }
  const STAGE = { undefined: 'duel', gate: 'duel', semi: 'rival', third: 'rival', gateFinal: 'rival', final: 'finale' };
  for (const [st, want] of Object.entries(STAGE)) assert.equal(P.boutPiece(st === 'undefined' ? undefined : st), want, `stage ${st}`);
  assert.equal(P.boutPiece(null), 'duel', 'a challenge in town');
  assert.deepEqual([...P.ANNOUNCED].sort(), ['arrival', 'cut', 'final']);
  for (const id of P.ANNOUNCED) assert.ok(src('src/narrative/v2story.ts').includes(`id: '${id}', place: 'forecourt', cast: ['odo'`), `${id}: a scene of the registrar's`);
  assert.equal(P.jingleFor('ren'), 'defaite'); assert.equal(P.jingleFor('marek'), 'victoire');
  // every piece and jingle in the catalogue, the fights in their three layers with an intro, the title with its own
  const C = JSON.parse(src('src/audio/catalogue.json')).pieces;
  assert.deepEqual(Object.keys(C).sort(), [...P.PIECES, ...P.STINGS].sort());
  for (const id of ['duel', 'rival', 'finale']) { assert.deepEqual(C[id].layers, ['base', 'melody', 'tension']); assert.ok(C[id].intro.loopAt > 0 && C[id].intro.frames > C[id].intro.loopAt); }
  assert.ok(C.titre.intro); for (const id of ['matin', 'midi', 'fin', 'nuit', 'parvis', 'lices', 'valse']) { assert.equal(C[id].kind, 'loop'); assert.equal(C[id].intro, undefined); }
  for (const id of P.STINGS) assert.equal(C[id].kind, 'once');
});

test('the fights\' layers follow the duel by the operator\'s rule F (« F · Des niveaux plus doux », journal Passe SN13): the riff always, the lead down to 45 % while the opponent presses, the tension from its rest at 35 % up on his sequence, the heavy charge, a stun and the endgame; the K.O. takes all', () => {
  let m = { ...P.CALM }; const go = (e) => { m = P.moodStep(m, e, { ren: 100, marek: 200 }); return P.layerLevels(m); };
  assert.deepEqual(P.layerLevels(m), [1, 1, 0.35]);
  assert.deepEqual(go({ type: 'sequenceStart', who: 'ren' }), [1, 1, 0.35], 'the hero\'s own sequence');
  assert.deepEqual(go({ type: 'sequenceStart', who: 'marek', len: 3 }), [1, 0.45, 1]); assert.deepEqual(go({ type: 'sequenceEnd', who: 'marek' }), [1, 1, 0.35]);
  assert.deepEqual(go({ type: 'chargeTier', idx: 0, open: true }), [1, 1, 0.35], 'the light blow');
  assert.deepEqual(go({ type: 'chargeTier', idx: 2, open: false }), [1, 1, 0.35], 'a tier the AP close');
  assert.deepEqual(go({ type: 'chargeTier', idx: 1, open: true }), [1, 1, 1], 'the heavy at 2 s'); assert.deepEqual(go({ type: 'chargeRelease', idx: 1, ok: true }), [1, 1, 0.35]);
  go({ type: 'stun', who: 'marek', dur: 6 }); go({ type: 'stun', who: 'ren', dur: 6 }); assert.deepEqual(go({ type: 'stunEnd', who: 'marek' }), [1, 1, 1], 'one still stunned');
  assert.deepEqual(go({ type: 'stunEnd', who: 'ren' }), [1, 1, 0.35]);
  assert.deepEqual(go({ type: 'impact', to: 'marek', hp: 61 }), [1, 1, 0.35], '30.5 % of 200'); assert.deepEqual(go({ type: 'impact', to: 'marek', hp: 59 }), [1, 1, 1], 'under 30 %');
  assert.deepEqual(go({ type: 'sequenceStart', who: 'marek' }), [1, 0.45, 1]); assert.deepEqual(go({ type: 'sequenceEnd', who: 'marek' }), [1, 1, 1], 'the endgame stays');
  assert.deepEqual(go({ type: 'ko', who: 'marek' }), [0, 0, 0]); assert.deepEqual(go({ type: 'reset' }), [1, 1, 0.35]);
  // every move of the duel's layers takes a whole bar (Sound.duelEvent)
  assert.match(src('src/audio/Sound.ts'), /l\.set\.level\(i, v, l\.set\.bar\)/);
  assert.deepEqual(P.moodStep(P.CALM, { type: 'impact', to: 'ren', hp: 1 }), P.CALM, 'without the fighters\' health, no endgame');
});

test('a note\'s pitch', () => { assert.equal(Math.round(S.hz(69)), 440); assert.equal(Math.round(S.hz(57)), 220); });

test('every audio file of the game is the band\'s, under its manifest (SA-8, SA-13; journal Passe SN10): src/audio/baked only, nothing in public', () => {
  const audio = [], root = fileURLToPath(new URL('..', import.meta.url)), walk = (d) => { if (!fs.existsSync(d)) return; for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.(mp3|ogg|oga|opus|weba|webm|wav|m4a|aac|flac)$/i.test(f)) audio.push(path.relative(root, p).split(path.sep).join('/')); } };
  for (const d of ['src', 'public']) walk(path.join(root, d));
  const claimed = fs.readdirSync(path.join(root, 'art-lab/audio/manifests')).flatMap((f) => JSON.parse(fs.readFileSync(path.join(root, 'art-lab/audio/manifests', f), 'utf8')).files.map((x) => x.path));
  assert.deepEqual(audio.sort(), claimed.sort()); assert.ok(audio.every((p) => p.startsWith('src/audio/baked/')));
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
  assert.doesNotMatch(eng, /\.(mp3|ogg|opus|webm|wav|m4a|aac|flac)\b/, 'the engine names no audio file');
  // every importer of the engine: a dynamic import, behind the version 2
  const files = [];
  const walk = (d) => { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) walk(p); else if (/\.ts$/.test(f)) files.push(p); } };
  // fileURLToPath, not URL.pathname: on Windows the pathname is '/C:/...' and path.join turns it into 'C:\C:\...' (journal Passe FV2)
  walk(fileURLToPath(new URL('../src', import.meta.url)));
  const users = files.filter((f) => !f.includes(`${path.sep}audio${path.sep}`) && /audio\/Sound/.test(fs.readFileSync(f, 'utf8'))).map((f) => path.relative(fileURLToPath(new URL('..', import.meta.url)), f).split(path.sep).join('/')).sort();
  // since the version 2 is the default game, the title screen and Explore too (VD-3, VD-5, journal Passe VD2)
  assert.deepEqual(users, ['src/arena/ArenaApp.ts', 'src/main.ts', 'src/ui/playPlaza.ts', 'src/ui/playTown.ts', 'src/ui/title.ts', 'src/ui/townUi.ts']);
  for (const f of users) { const t = src(f); assert.doesNotMatch(t, /^import .*audio\/Sound/m, `${f}: no static import`); }
  assert.match(src('src/ui/playTown.ts'), /if \(isV2\(st\)\) void import\('\.\.\/audio\/Sound'\)/);
  assert.match(src('src/arena/ArenaApp.ts'), /else if \(this\.rules === 'v2'\) \{[^]*?import\('\.\.\/audio\/Sound'\)/);
  // the title screen (VD-5): « titre » over the town's ambience, asked at once, heard from the first key or click; a key on the screen starts it
  const title = src('src/ui/title.ts').replace(/\r\n/g, '\n');
  assert.match(title, /const snd = import\('\.\.\/audio\/Sound'\)\.then\(\(m\) => \{ const s = m\.sound\(\); s\.setScene\('district', c\.look \?\? 'midday', false, 1842, \{ opening: true \}\); return s; \}\);/);
  assert.match(title, /root\.addEventListener\('keydown', \(e\) => \{ e\.stopPropagation\(\); void snd\.then\(\(s\) => s\.unlock\(\)\); \}\);/);
  // its pages go once the music went down, its record kept for the next page (SA-15): « New game » and « Continue »
  assert.equal((title.match(/leaveTo\(/g) ?? []).length, 3, 'the function and its two calls');
  assert.doesNotMatch(title, /location\.assign\(['`]\?play/);
  // Explore (VD-3): the town's piece of the hour, from the same engine
  assert.match(src('src/main.ts').replace(/\r\n/g, '\n'), /function exploreInputs\(look: TimeOfDay\): void \{\n  const snd = import\('\.\/audio\/Sound'\)\.then\(\(s\) => \{ const e = s\.sound\(\); e\.setScene\('district', look, false,/);
});
