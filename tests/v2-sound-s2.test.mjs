// Lot S2 of the sound (journal Passes SN18 / SN19), as the operator decided it on the sheet briefs/fiche-son-lieux.html, word for word: S2-VILLE, S2-PARVIS, S2-LICES
// and S2-HALLE « Garder l’ambiance d’aujourd’hui »; S2-PLUIE « Bonne direction »; S2-ORAGE « Bonne direction », « Sans rafales »; S2-NEIGE « Pas de changement sous la
// neige »; S2-VENT « Pas de son de vent »; S2-INTERFACE and S2-PAS « Bonne direction »; S2-MELANGE « L’ambiance plus en retrait », « −3 dB, nettement »; S2-POIDS
// « Calculer dans la page, cuire l’interface et le murmure (121 Ko) »; S2-FOULE « Le code suffit »; S2-SUITE « Cuire et brancher dans la version 2 ce qui est validé ».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const S = await load('/src/audio/score.ts'), P = await load('/src/audio/places.ts'), H = await load('/src/audio/hooks.ts');
const LOOKS = ['morning', 'midday', 'afternoon', 'night'], PLACES = ['district', 'forecourt', 'training', 'festival'];
const CAT = JSON.parse(fs.readFileSync(new URL('../src/audio/catalogue.json', import.meta.url), 'utf8'));
const src = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8');
const W = (o) => ({ rain: 0, snow: 0, storm: 0, wind: 1, ...o });
/** the places' levels on main before lot S2 (0e2c0ab), read by hand: S2-MELANGE puts each 3 dB further back, the arena's stays */
const MAIN = { district: [8, 8.1, 8.1, 8.1], forecourt: [8.1, 8.2, 8.2, 10.6], training: [10, 10, 10, 13.7], festival: [9.5, 9.6, 9.6, 6.9] };

test('the places keep their sound of lots V8 and S0, 3 dB further back (S2-MELANGE); the arena stays where it was; no weather, no weather sound', () => {
  for (const p of PLACES) LOOKS.forEach((l, i) => {
    const a = S.ambienceOf(p, l);
    assert.equal(S.LEVEL[p][l], MAIN[p][i], `${p} ${l}: today's level`);
    assert.ok(Math.abs(a.trim - (MAIN[p][i] - 3)) < 1e-9 && Math.abs(a.back - 10 ** (-3 / 20)) < 1e-12, `${p} ${l}: 3 dB back, its air with it`);
    assert.equal(a.weather, null, `${p} ${l}`); assert.equal(a.surface, p === 'training' ? 'earth' : 'stone', `${p}: the lists' earth, elsewhere the setts`);
    assert.ok(a.beds.every((b) => ['wind', 'water', 'crowd'].includes(b.kind)) && a.calls.every((c) => ['bird', 'cricket', 'cheer', 'hammer', 'lute'].includes(c.kind)), `${p} ${l}: today's beds and calls only`);
  });
  for (const l of LOOKS) { assert.equal(S.LEVEL.arena[l], 9.6); assert.equal(S.ambienceOf('arena', l).trim, 9.6); assert.equal(S.ambienceOf('arena', l).back, 1); }
  // the mix's target moved with the decision: tools/audio/analyse.mjs holds the music 6 to 9 dB over the places
  assert.match(src('tools/audio/analyse.mjs'), /d >= 6 && d <= 9/);
});

test('the rain (S2-PLUIE): its hiss and patter over the place; the birds and the crickets fall silent from a quarter; the crowd takes cover; nothing else moves', () => {
  for (const p of PLACES) for (const l of LOOKS) {
    const dry = S.ambienceOf(p, l), wet = S.ambienceOf(p, l, false, W({ rain: 0.6 })), light = S.ambienceOf(p, l, false, W({ rain: 0.2 }));
    assert.deepEqual(wet.weather, { rain: 0.6, thunder: false }); assert.equal(wet.trim, dry.trim);
    assert.deepEqual(wet.beds.map((b) => b.kind), dry.beds.map((b) => b.kind));
    wet.beds.forEach((b, i) => assert.ok(Math.abs(b.gain - dry.beds[i].gain * (b.kind === 'crowd' ? S.outInRain(0.6) : 1)) < 1e-12, `${p} ${l} ${b.kind}`));
    assert.deepEqual(wet.calls, dry.calls.filter((c) => c.kind !== 'bird' && c.kind !== 'cricket'), `${p} ${l}: the birds and crickets silent`);
    assert.deepEqual(light.calls, dry.calls, `${p} ${l}: a drizzle leaves them`);
  }
  assert.ok(S.outInRain(0.6) > 0.4 && S.outInRain(0.6) < 0.5, '« le murmure baisse de moitié » at the rainy day');
  assert.equal(S.ambienceOf('arena', 'midday', false, W({ rain: 1, storm: 1 })).weather, null, 'the arena: its own sound');
});

test('the snow and the wind change nothing (S2-NEIGE, S2-VENT); the storm thunders after its flashes, without gusts (« Sans rafales »)', () => {
  for (const p of PLACES) for (const l of LOOKS) for (const b of [false, true]) {
    assert.deepEqual(S.ambienceOf(p, l, b, W({ snow: 1 })), S.ambienceOf(p, l, b), `${p} ${l}: the snow`);
    assert.deepEqual(S.ambienceOf(p, l, b, W({ wind: 3 })), S.ambienceOf(p, l, b), `${p} ${l}: the wind`);
    const storm = S.ambienceOf(p, l, b, W({ storm: 1, rain: 0.85, wind: 2 })), rain = S.ambienceOf(p, l, b, W({ rain: 0.85 }));
    assert.deepEqual(storm.weather, { rain: 0.85, thunder: true });
    assert.deepEqual({ ...storm, weather: null }, { ...rain, weather: null }, `${p} ${l}: a storm is its rain and its thunder`);
  }
  // the engine's sound of the weather: the rain and the thunder only, no live wind bed in it any more
  const engine = src('src/audio/Sound.ts');
  assert.ok(!/kind === 'flags'|'fountain'|whistle/.test(engine), 'no gust, whistle or flag left in the engine');
});

test('the thunder after a flash: the strength chooses near, middle or far, the delay grows with the distance, the level stays bounded', () => {
  const at = (u) => () => u;
  assert.equal(S.thunderOf(1.2, at(0)).take, 0); assert.equal(S.thunderOf(0.5, at(0)).take, 1); assert.equal(S.thunderOf(0.2, at(0)).take, 2);
  assert.equal(S.thunderOf(0.75, at(0)).take, 0); assert.equal(S.thunderOf(0.4, at(0)).take, 1, 'the boundaries belong to the nearer');
  for (const lvl of [0.1, 0.5, 1, 1.6]) for (const u of [0, 0.5, 0.999]) { const t = S.thunderOf(lvl, at(u)); assert.ok(t.gain > 0 && t.gain <= 1.2 && t.delay >= 0.25 && t.delay <= 4.5, `${lvl} ${u}`); }
  assert.ok(S.thunderOf(1.2, at(0.999)).delay < S.thunderOf(0.5, at(0)).delay + 1e-9 && S.thunderOf(0.5, at(0.999)).delay <= S.thunderOf(0.2, at(0)).delay + 1e-9, 'farther, later');
});

test('the computed sounds: the steps, the patter, the thunder; the same samples every time, finite, under full scale; the patter a circle; the long ones in steps', () => {
  assert.deepEqual(Object.keys(P.COMPUTED).sort(), ['patter', 'step-earth', 'step-stone', 'thunder'], 'only what the operator kept');
  for (const [id, n] of Object.entries(P.COMPUTED)) for (let k = 0; k < n; k++) {
    const a = P.compute(id, k, 48000), b = P.compute(id, k, 48000);
    assert.deepEqual(a, b, `${id} ${k}: the same samples`);
    let peak = 0; for (const c of a) for (const v of c) { assert.ok(Number.isFinite(v), `${id} ${k}: finite`); peak = Math.max(peak, Math.abs(v)); }
    assert.ok(peak > 0.05 && peak <= 0.7 + 1e-6, `${id} ${k}: peak ${peak}`);
  }
  for (const s of ['stone', 'earth']) { const takes = [0, 1, 2, 3].map((k) => P.compute(`step-${s}`, k, 48000)[0]); for (let i = 1; i < 4; i++) assert.notDeepEqual(takes[i], takes[0], `${s}: four takes`); }
  // the patter loops: its drops round the circle are the same drops written flat, past the end folded back onto the start
  const [cL, cR] = P.finish(P.patterDrops(48000, 7, 1, true)), [fL, fR] = P.finish(P.patterDrops(48000, 7, 1, false)), n = cL.length;
  assert.ok(fL.length > n, 'the flat drops run past the circle');
  let worst = 0, past = 0;
  for (let i = 0; i < n; i++) for (const [c, f] of [[cL, fL], [cR, fR]]) worst = Math.max(worst, Math.abs(c[i] - (f[i] + (i + n < f.length ? f[i + n] : 0))));
  for (let i = n; i < fL.length; i++) past = Math.max(past, Math.abs(fL[i]));
  assert.ok(past > 0.01, 'some drops ring past the end: the fold is tested');
  assert.ok(worst < 1e-6, `the circle is the flat drops folded (${worst})`);
  // and its high-pass runs round the circle too: the patter's start is the drops filtered with the circle's end before them (an RBJ high-pass at 300 Hz, written
  // here, primed by a lap); filtered once from silence, the first 10 ms differed by -35.6 dB (journal Passe SN19)
  const [pL] = P.compute('patter', 0, 48000), w = 2 * Math.PI * 300 / 48000, cw = Math.cos(w), al = Math.sin(w) / 1.4, a0 = 1 + al, b0 = (1 + cw) / 2 / a0, b1 = -(1 + cw) / a0, a1 = -2 * cw / a0, a2 = (1 - al) / a0;
  let x1 = 0, x2 = 0, y1 = 0, y2 = 0; const hp = new Float64Array(n);
  for (let lap = 0; lap < 2; lap++) for (let i = 0; i < n; i++) { const x = cL[i], y = b0 * x + b1 * x1 + b0 * x2 - a1 * y1 - a2 * y2; x2 = x1; x1 = x; y2 = y1; y1 = y; if (lap) hp[i] = y; }
  let num = 0, den = 0; for (let i = n >> 1; i < (n >> 1) + 48000; i++) { num += pL[i] * hp[i]; den += hp[i] * hp[i]; }
  const g = num / den, rms = (f, a, b) => { let s = 0; for (let i = a; i < b; i++) s += f(i) ** 2; return Math.sqrt(s / (b - a)); };
  const seam = 20 * Math.log10(rms((i) => pL[i] - g * hp[i], 0, 480) / rms((i) => pL[i], 0, n));
  assert.ok(seam < -100, `the patter's start, its circle's: ${seam.toFixed(1)} dB`);
  // written in steps, so the engine spreads them (Sound.madeSlowly): many small steps, the same samples
  const count = (g) => { let n = 0; for (;;) { const r = g.next(); if (r.done) return n; n++; } };
  assert.ok(count(P.computeSteps('patter', 0, 48000)) >= 14 && count(P.computeSteps('thunder', 0, 48000)) >= 14);
  for (const f of ['src/audio/places.ts', 'src/audio/Sound.ts', 'src/audio/score.ts']) assert.ok(!/Math\.random\s*\(/.test(src(f)), `${f}: its own draws`);
});

test('the interface by the band (S2-INTERFACE): the click three takes, the dialog, the purse two, baked; the refused command the duel\'s; the murmur not baked', () => {
  assert.equal(CAT.sfx['ui-click'].files.length, 3); assert.equal(CAT.sfx['ui-open'].files.length, 1); assert.equal(CAT.sfx['ui-coin'].files.length, 2);
  for (const id of ['ui-click', 'ui-open', 'ui-coin']) assert.equal(CAT.sfx[id].family, 'interface');
  assert.equal(CAT.sfx.denied.family, 'duel-charge', 'the refused command: lot S3\'s');
  assert.ok(!Object.keys(CAT.sfx).some((k) => k.includes('murmur')), 'no place took the murmur');
  assert.deepEqual(Object.keys(S.UI_LEVEL).sort(), ['click', 'coin', 'denied', 'open']);
  assert.match(src('src/audio/Sound.ts'), /click: 'ui-click', open: 'ui-open', coin: 'ui-coin', denied: 'denied'/);
});

test('a refused action plays the refused command, an accepted one does not (src/audio/hooks.ts)', () => {
  const played = [], timers = [], saved = { window: globalThis.window, document: globalThis.document, MutationObserver: globalThis.MutationObserver };
  try {
    globalThis.window = { setInterval: (f) => { timers.push(f); return 1; } };
    globalThis.document = { addEventListener() {}, querySelector: () => null, body: {} };
    globalThis.MutationObserver = class { observe() {} };
    H.installSoundHooks({ play: (e) => played.push(e), leave: () => 0 });
    let answer = { ok: false, reason: 'coins' };
    window.__game = { state: () => ({ player: { coins: 5 } }), subscribe() {}, act: () => answer };
    timers[0]();
    assert.equal(window.__game.act({ type: 'buy' }).ok, false); assert.deepEqual(played, ['denied']);
    answer = { ok: true }; window.__game.act({ type: 'rest' }); assert.deepEqual(played, ['denied'], 'an accepted action: no sound of refusal');
  } finally { Object.assign(globalThis, saved); }
});
