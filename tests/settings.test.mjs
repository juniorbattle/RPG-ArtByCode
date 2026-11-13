// The player's settings (journal Passe RG2, the operator's sheet: RG-1 to RG-10): the record read back, today's defaults to the value, the address's own
// parameters first, the quality's tiers, the keyboard's layouts, the language, and every scene wired to them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const S = await load('/src/settings/settings.ts');
const KY = await load('/src/settings/keys.ts');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const q = (s) => new URLSearchParams(s);

test('the defaults are today\'s game: no resolution cap, MSAA 4, the reflection at half, a60, depth of field and bloom on, no reduced motion', () => {
  // keys: null, today's keys (the remapping, journal Passe RM2, RM-9: nothing stored is today's game, key for key)
  assert.deepEqual({ ...S.DEFAULT_SETTINGS }, { res: 'native', msaa: 4, refl: 0.5, fps: 60, dof: true, bloom: true, reducedMotion: false, keyboard: null, lang: null, keys: null });
  const g = S.graphicsFrom(q(''), S.readSettings(null));
  assert.deepEqual(g, { resCap: null, msaa: 4, refl: 0.5, frameCap: { kind: 'adaptive', fps: 60 }, dof: true, bloom: true });
  // the operator's choices of journal Passes 6e to 6h, as the scenes wrote them before (App.ts: a60, PostFX: msaa 4, PlanarReflection: 0.5)
  assert.match(src('src/atmosphere/PostFX.ts'), /msaa: 4/);
  assert.match(src('src/atmosphere/ShadowAndReflection.ts'), /scale = 0\.5;/);
  assert.equal(S.qualityOf(S.DEFAULT_SETTINGS), 'high');
});

test('the record: every field checked, anything broken is its default', () => {
  assert.deepEqual(S.readSettings(null), { ...S.DEFAULT_SETTINGS });
  assert.deepEqual(S.readSettings('{oops'), { ...S.DEFAULT_SETTINGS });
  assert.deepEqual(S.readSettings('[1,2]'), { ...S.DEFAULT_SETTINGS });
  assert.deepEqual(S.readSettings('{"res":800,"msaa":3,"refl":0.3,"fps":45,"dof":"no","bloom":1,"reducedMotion":"yes","keyboard":"dvorak","lang":"de"}'), { ...S.DEFAULT_SETTINGS });
  const all = { res: 720, msaa: 0, refl: 1, fps: 0, dof: false, bloom: false, reducedMotion: true, keyboard: 'azerty', lang: 'fr', keys: { azerty: { talk: [{ c: 'KeyF', k: 'f' }, { c: 'Space', k: ' ' }] } } };
  assert.deepEqual(S.readSettings(JSON.stringify(all)), all);
  // the keys (RM-9): a broken slot is its default, and what is left equal to the starting keys is not kept
  assert.equal(S.readSettings('{"keys":[1]}').keys, null);
  assert.equal(S.readSettings('{"keys":{"qwerty":{"talk":[{"c":"Escape","k":"Escape"},{"c":"Space","k":" "}]}}}').keys, null, 'a reserved key is its default');
  assert.deepEqual(S.readSettings('{"keys":{"qwerty":{"talk":[{"c":"KeyF","k":"f"},7],"nope":[null,null]}}}').keys, { qwerty: { talk: [{ c: 'KeyF', k: 'f' }, { c: 'Space', k: ' ' }] } });
  for (const res of S.RES_STEPS) assert.equal(S.readSettings(JSON.stringify({ res })).res, res);
});

test('the address\'s own parameter wins over a stored setting (the tools and the proofs, journal Passes 6e to 6h)', () => {
  const low = S.readSettings(JSON.stringify({ res: 720, msaa: 0, refl: 0.25, fps: 30 }));
  const kept = S.graphicsFrom(q(''), low);
  assert.deepEqual(kept.resCap, { pixels: Math.round((720 * 720 * 16) / 9), filter: 'smooth' });
  assert.equal(kept.msaa, 0); assert.equal(kept.refl, 0.25); assert.deepEqual(kept.frameCap, { kind: 'even', fps: 30 });
  const url = S.graphicsFrom(q('res=1080p:px&msaa=8&refl=1&fps=off'), low);
  assert.deepEqual(url.resCap, { pixels: 1920 * 1080, filter: 'pixelated' });
  assert.equal(url.msaa, 8); assert.equal(url.refl, 1); assert.deepEqual(url.frameCap, { kind: 'off' });
  // res=native names no cap: the stored one does not come back
  assert.equal(S.graphicsFrom(q('res=native'), low).resCap, null);
  // a broken parameter leaves the setting
  const bad = S.graphicsFrom(q('msaa=3&refl=2&fps=x'), low);
  assert.equal(bad.msaa, 0); assert.equal(bad.refl, 0.25); assert.deepEqual(bad.frameCap, { kind: 'even', fps: 30 });
  assert.deepEqual(S.graphicsFrom(q(''), S.readSettings('{"fps":0}')).frameCap, { kind: 'off' });
  assert.deepEqual(S.graphicsFrom(q(''), S.readSettings('{"dof":false,"bloom":false}')), { resCap: null, msaa: 4, refl: 0.5, frameCap: { kind: 'adaptive', fps: 60 }, dof: false, bloom: false });
});

test('the resolution cap: the pixel ratio the town computed before, for every cap and window', () => {
  const before = (w, h, dpr, cap) => dpr * (cap ? Math.min(1, Math.sqrt(cap.pixels / (w * dpr * h * dpr))) : 1);
  for (const [w, h, dpr] of [[1920, 1080, 1], [2560, 1267, 1.5], [812, 375, 2], [1280, 720, 1]]) {
    for (const cap of [null, { pixels: 1280 * 720 }, { pixels: 1920 * 1080 }, { pixels: 640 * 360 }]) assert.equal(S.capRatio(w, h, dpr, cap), before(w, h, dpr, cap));
  }
  assert.equal(S.capRatio(1280, 720, 1, { pixels: 1920 * 1080 }), 1, 'under the budget nothing changes');
});

test('the quality\'s tiers (RG-3): each sets the resolution, the anti-aliasing and the reflection; « high » is today\'s default; anything else is custom', () => {
  assert.deepEqual(S.QUALITY_STEPS, ['low', 'medium', 'high', 'ultra']);
  assert.deepEqual({ ...S.QUALITY.low }, { res: 720, msaa: 0, refl: 0.25 });
  assert.deepEqual({ ...S.QUALITY.medium }, { res: 1080, msaa: 2, refl: 0.25 });
  assert.deepEqual({ ...S.QUALITY.high }, { res: S.DEFAULT_SETTINGS.res, msaa: S.DEFAULT_SETTINGS.msaa, refl: S.DEFAULT_SETTINGS.refl });
  assert.deepEqual({ ...S.QUALITY.ultra }, { res: 'native', msaa: 8, refl: 1 });
  for (const t of S.QUALITY_STEPS) assert.equal(S.qualityOf({ ...S.DEFAULT_SETTINGS, ...S.QUALITY[t] }), t);
  assert.equal(S.qualityOf({ ...S.DEFAULT_SETTINGS, msaa: 2 }), null);
  assert.equal(S.qualityOf({ ...S.QUALITY.low, refl: 0.5 }), null);
  // every tier's values are among the steps the page offers
  for (const t of S.QUALITY_STEPS) { const v = S.QUALITY[t]; assert.ok(S.RES_STEPS.includes(v.res) && S.MSAA_STEPS.includes(v.msaa) && S.REFL_STEPS.includes(v.refl), t); }
});

test('the keyboard (RG-7): on AZERTY, Z Q S D walk and A opens the list; the gamepad\'s keys and QWERTY are left as they are', () => {
  // since the remapping (journal Passe RM2, RM-5) a key is read by its place: each keyboard's starting keys are today's, a real AZERTY keyboard's events
  // (its Z at QWERTY's W, its A at QWERTY's Q, its M at QWERTY's ;) doing what they did through the layout's translation of journal Passe RG3
  const K = { qwerty: S.keysOf(S.readSettings(null), 'qwerty'), azerty: S.keysOf(S.readSettings(null), 'azerty') };
  const real = { qwerty: { w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD', q: 'KeyQ', z: 'KeyZ', e: 'KeyE', m: 'KeyM', j: 'KeyJ', n: 'KeyN' }, azerty: { z: 'KeyW', q: 'KeyA', s: 'KeyS', d: 'KeyD', a: 'KeyQ', w: 'KeyZ', e: 'KeyE', m: 'Semicolon', j: 'KeyJ', n: 'KeyN' } };
  const walkActs = (t, e) => KY.actsOfId(KY.keyId(e), 'walk', t), read = (l, k) => walkActs(K[l], { code: real[l][k], key: k });
  assert.deepEqual(['z', 'q', 's', 'd', 'a', 'w', 'e', 'm', 'j', 'n'].map((k) => read('azerty', k)), [['up'], ['left'], ['down'], ['right'], ['list'], [], ['talk'], ['map'], ['journal'], ['mute']]);
  assert.deepEqual(['w', 'a', 's', 'd', 'q', 'z', 'e', 'm'].map((k) => read('qwerty', k)), [['up'], ['left'], ['down'], ['right'], ['list'], [], ['talk'], ['map']]);
  // a key the gamepad presses is the game's own (src/input/PadInput.ts dispatches the keys the interface shows): « q » is the list on AZERTY's table too
  assert.deepEqual(walkActs(K.azerty, { key: 'q', isTrusted: false }), ['list']);
  // the layout: the browser's keyboard map first, then the language
  assert.equal(S.layoutOfMap(new Map([['KeyQ', 'a'], ['KeyW', 'z']])), 'azerty');
  assert.equal(S.layoutOfMap(new Map([['KeyQ', 'q'], ['KeyW', 'w']])), 'qwerty');
  assert.equal(S.layoutOfMap(new Map()), null);
  assert.equal(S.layoutOfMap(null), null);
  assert.deepEqual(['fr', 'fr-FR', 'fr-BE', 'fr-LU', 'fr-CA', 'fr-CH', 'en-US', 'de', undefined].map(S.layoutOfLanguage), ['azerty', 'azerty', 'azerty', 'azerty', 'qwerty', 'qwerty', 'qwerty', 'qwerty', 'qwerty']);
});

test('the language (RG-9): the player\'s choice among the languages written, else the browser\'s, English in a driven browser', () => {
  assert.ok(S.LANGS.includes('en'));
  const none = S.readSettings(null);
  assert.equal(S.langOf(none, 'en-GB', false), 'en');
  assert.equal(S.langOf(none, 'de-DE', false), 'en');
  assert.equal(S.langOf(none, 'fr-FR', true), 'en', 'a driven browser keeps the English');
  assert.equal(S.langOf(none, 'fr-FR', false), S.LANGS.includes('fr') ? 'fr' : 'en');
  // a stored language the game is not written in yet is not taken
  assert.equal(S.langOf(S.readSettings('{"lang":"fr"}'), 'en-US', false), S.LANGS.includes('fr') ? 'fr' : 'en');
});

test('every scene renders with the settings, the address first; none reads its own fps, msaa, refl or res any more', () => {
  for (const f of ['src/app/App.ts', 'src/world/PlazaApp.ts', 'src/arena/ArenaApp.ts', 'src/world/PlaceApp.ts']) {
    const t = src(f);
    assert.match(t, /followGraphics\(this, (opts\.params|q)\);/, f);
    assert.match(t, /capRatio\(w, h, /, `${f}: the resolution cap in its resize`);
    assert.doesNotMatch(t, /parseFrameCap\(|get\('msaa'\)|get\('refl'\)|get\('res'\)/, `${f}: a parameter read twice`);
  }
  // followGraphics comes once the post chain exists
  const app = src('src/app/App.ts');
  assert.ok(app.indexOf('followGraphics(this, opts.params);') > app.indexOf('this.post = new PostFX(this.renderer);'));
  const scene = src('src/settings/scene.ts');
  for (const k of ['scene.resCap = g.resCap;', 'scene.post.params.msaa = g.msaa;', 'scene.reflection.scale = g.refl;', 'scene.frameCap.mode = g.frameCap;', 'scene.post.dofEnabled = g.dof;', 'scene.post.bloomEnabled = g.bloom;']) assert.ok(scene.includes(k), k);
  assert.match(scene, /onSettings\(\(s\) => \{ applyGraphics\(scene, params, s\); scene\.resize\(\); \}\)/);
});

test('the walking keys go through the player\'s keys (RG-7, then the remapping of journal Passe RM2); the list\'s key and its cap too', () => {
  // a key held by its id (its place, or the QWERTY name the pad and the tools give), the walk and the run read through the player's actions
  const actors = src('src/characters/ActorSystem.ts'), plaza = src('src/world/PlazaApp.ts'), arena = src('src/arena/ArenaApp.ts');
  assert.match(actors, /this\.keys\.add\(keyId\(e\)\);\n      if \(actsOf\(e, 'walk'\)\.includes\('talk'\)\) this\.interact\(\);/);
  assert.match(plaza, /keys\.add\(keyId\(e\)\)/);
  for (const t of [actors, plaza]) assert.match(t, /keys\.delete\(keyId\(e\)\)/);
  assert.match(arena, /walkKeys\.add\(keyId\(e\)\)/);
  for (const t of [actors, plaza, arena]) for (const a of ['up', 'down', 'left', 'right']) assert.ok(t.includes(`actHeld(k, '${a}')`), a);
  for (const t of [actors, plaza]) assert.ok(t.includes("actHeld(k, 'run')"));
  for (const t of [actors, plaza, arena]) assert.doesNotMatch(t, /has\('(arrow\w+|shift|[wasd])'\)/, 'no key read by its letter');
  const town = src('src/ui/townUi.ts');
  assert.match(town, /const acts = actsOf\(e, 'walk'\)/);
  assert.match(town, /this\.hereKey\.innerHTML = `\$\{bindCap\('list'\)\}/);
  assert.match(town, /onSettings\(\(\) => this\.render\(\)\);/);
  // the version 2's duel reads the player's keys too; the other rules keep the prototype's
  assert.match(arena, /const bound = duelKeys \? actsOf\(e, 'duel'\) : \[\]/);
  assert.match(arena, /const duelKeys = !!\(this\.charge \|\| this\.auto\);/);
});

test('the player\'s keys (journal Passe RM2): the starting keys are today\'s, a swap in one moment, the reserved keys, the slots, the record', () => {
  const Q = KY.DEFAULT_KEYS.qwerty, A = KY.DEFAULT_KEYS.azerty, slot = (c, k) => ({ c, k });
  // RM-2: today's keys at the start, the duel's those of V2_KEYS (journal Passe V1), the walk's those of journal Passe RG3, on each keyboard; none shared in a moment
  assert.deepEqual(KY.conflicts(Q), []); assert.deepEqual(KY.conflicts(A), []);
  const label = (t, a) => t[a].map((x) => x?.k ?? null);
  assert.deepEqual(['up', 'left', 'down', 'right', 'run', 'talk', 'list', 'map'].map((a) => label(Q, a)), [['w', 'ArrowUp'], ['a', 'ArrowLeft'], ['s', 'ArrowDown'], ['d', 'ArrowRight'], ['Shift', null], ['e', ' '], ['q', null], ['m', null]]);
  assert.deepEqual(['up', 'left', 'list', 'map'].map((a) => label(A, a)), [['z', 'ArrowUp'], ['q', 'ArrowLeft'], ['a', null], ['m', null]]);
  assert.deepEqual(['journal', 'board', 'skills', 'gear', 'settings', 'guide', 'mute'].map((a) => Q[a][0].k).join(''), 'jtkgvhn');
  // the attack's second key, 1, given to the hand's four on 1 to 4 (lot 2 of the second redesign, journal Passe SL3: briefs/combat-auto.md § 25.5)
  assert.deepEqual(['attack', 'guard', 'dodge', 'pause'].map((a) => label(Q, a)), [['j', null], ['k', 'b'], ['l', 'a'], [' ', null]]);
  assert.deepEqual(['skill1', 'skill2', 'skill3', 'skill4'].map((a) => label(Q, a)), [['1', null], ['2', null], ['3', null], ['4', null]]);
  assert.deepEqual(['skill1', 'skill4'].map((a) => label(A, a)), [['1', null], ['4', null]]);
  // a key read by its place: both Shifts are one, a keypad digit is its digit (the AZERTY top row's « 1 » presses the first skill: it types « & »)
  assert.equal(KY.normCode('ShiftRight', 'Shift'), 'Shift');
  assert.equal(KY.normCode('Numpad1', '1'), 'Digit1');
  assert.deepEqual(KY.actsOfId(KY.keyId({ code: 'Digit1', key: '&' }), 'duel', A), ['skill1']);
  assert.deepEqual(KY.actsOfId(KY.keyId({ code: 'Numpad1', key: '1' }), 'duel', Q), ['skill1']);
  assert.deepEqual(KY.actsOfId(KY.keyId({ code: 'KeyW', key: 'W' }), 'walk', Q), ['up'], 'Shift held changes nothing');
  // mute is heard walking and in the duel; J journals walking and attacks in the duel (two moments, one key: as today)
  assert.deepEqual(KY.actsOfId('KeyN', 'duel', Q), ['mute']);
  assert.deepEqual([KY.actsOfId('KeyJ', 'walk', Q), KY.actsOfId('KeyJ', 'duel', Q)], [['journal'], ['attack']]);
  // RM-4: a key already taken in the same moment swaps
  let r = KY.rebind(Q, 'talk', 0, slot('Shift', 'Shift'));
  assert.ok(r.ok); assert.deepEqual(label(r.table, 'talk'), ['Shift', ' ']); assert.deepEqual(label(r.table, 'run'), ['e', null]);
  assert.deepEqual(r.swaps, [{ act: 'run', slot: 0, to: slot('KeyE', 'e') }]);
  // the duel's attack on K: the guard takes J; walking, K stays the skills'
  r = KY.rebind(Q, 'attack', 0, slot('KeyK', 'k'));
  assert.deepEqual([label(r.table, 'attack'), label(r.table, 'guard'), label(r.table, 'skills')], [['k', null], ['j', 'b'], ['k', null]]);
  // a key free in the moment: nothing swaps; the action's other slot holding it: the two slots trade
  r = KY.rebind(Q, 'map', 0, slot('KeyF', 'f')); assert.deepEqual([r.swaps, label(r.table, 'map')], [[], ['f', null]]);
  r = KY.rebind(Q, 'talk', 0, slot('Space', ' ')); assert.deepEqual(label(r.table, 'talk'), [' ', 'e']);
  // refused: a reserved key, an action left with no key, a swap that would put two actions of one moment on one key
  for (const [c, k] of [['Escape', 'Escape'], ['Enter', 'Enter'], ['Tab', 'Tab'], ['F5', 'F5'], ['ControlLeft', 'Control'], ['AltLeft', 'Alt'], ['MetaLeft', 'Meta'], ['Backspace', 'Backspace'], ['Quote', 'Dead']]) assert.deepEqual(KY.rebind(Q, 'talk', 0, slot(c, k)), { ok: false, why: 'reserved' }, c);
  assert.deepEqual(KY.rebind(Q, 'map', 0, null), { ok: false, why: 'last', act: 'map' });
  assert.deepEqual(KY.rebind(Q, 'list', 1, slot('KeyM', 'm')), { ok: false, why: 'last', act: 'map' }, 'the map would be left with no key');
  r = KY.rebind(Q, 'talk', 1, null); assert.deepEqual(label(r.table, 'talk'), ['e', null]);
  r = KY.rebind(Q, 'talk', 0, null); assert.deepEqual(label(r.table, 'talk'), [null, ' '], 'the first slot may empty while the second keeps a key');
  // the skills on N: mute takes K, the guard's key in the duel: refused, and mute named
  assert.deepEqual(KY.rebind(Q, 'skills', 0, slot('KeyN', 'n')), { ok: false, why: 'clash', act: 'mute' });
  // the record: only what differs from the starting keys, read back the same; a stored table where two actions share a key goes back whole
  r = KY.rebind(Q, 'attack', 0, slot('KeyK', 'k'));
  const kept = KY.toStored(r.table, 'qwerty');
  assert.deepEqual(Object.keys(kept).sort(), ['attack', 'guard']);
  assert.deepEqual(KY.readKeys(JSON.parse(JSON.stringify(kept)), 'qwerty'), r.table);
  assert.equal(KY.toStored(Q, 'qwerty'), undefined);
  assert.equal(KY.readKeys({ talk: [slot('KeyQ', 'q'), null] }, 'qwerty'), Q, 'two actions on Q: the starting keys');
  // RM-5: each keyboard keeps its keys
  const both = S.readSettings(JSON.stringify({ keys: { qwerty: { map: [slot('KeyF', 'f'), null] }, azerty: { map: [slot('KeyU', 'u'), null] } } }));
  assert.deepEqual([S.keysOf(both, 'qwerty').map[0].k, S.keysOf(both, 'azerty').map[0].k], ['f', 'u']);
  // a stored table that puts two actions of one moment on a key (the map on G, the gear's) is the keyboard's starting keys again
  assert.equal(S.readSettings(JSON.stringify({ keys: { azerty: { map: [slot('KeyG', 'g'), null] } } })).keys, null);
});

test('the reduced motion (RG-5): applied on the document before anything shows, followed by the duel and its effects, the system never read', () => {
  const main = src('src/main.ts');
  assert.ok(main.indexOf('applyMotion(); onSettings(applyMotion); detectLayout();') < main.indexOf('showLoading('), 'before the loading screen');
  const arena = src('src/arena/ArenaApp.ts'), fx = src('src/arena/fx/combatFx.ts');
  assert.match(arena, /this\.reducedMotion = reducedMotion\(\);\n    onSettings\(\(s\) => \{ this\.reducedMotion = s\.reducedMotion; \}\);/);
  assert.match(fx, /engine\.reduced = reducedMotion\(\);\n  onSettings\(\(s\) => \{ engine\.reduced = s\.reducedMotion; \}\);/);
  for (const t of [main, arena, fx, src('src/settings/settings.ts')]) assert.doesNotMatch(t, /matchMedia\('\(prefers-reduced-motion/);
});

test('the settings page (RG-1, RG-2): four parts; from the title screen, the version 2\'s menu in place of the sound page, V on the sound, and the duel\'s pause', () => {
  const page = src('src/ui/settings.ts');
  assert.match(page, /const SECTIONS: readonly SettingsSection\[\] = \['graphics', 'sound', 'controls', 'language'\];/);
  for (const k of ['set.quality', 'set.res', 'set.msaa', 'set.refl', 'set.fps', 'set.dof', 'set.bloom', 'set.look', 'set.motion', 'set.fullscreen', 'set.volume', 'v2.sound.music', 'set.ambience', 'set.effects', 'v2.sound.mute', 'set.keyboard', 'v2.sound.vibration']) assert.ok(page.includes(`tx('${k}')`), k);
  const town = src('src/ui/townUi.ts');
  assert.match(town, /add\(tx\('set\.open'\), \(\) => this\.openSettings\(\), 'settings'\);/);
  assert.match(town, /else if \(is\('settings'\) && isV2\(this\.st\)\) this\.openSettings\('sound'\);/);
  assert.doesNotMatch(town, /openSound/);
  assert.match(src('src/ui/title.ts'), /add\('settings', tx\('set\.open'\), tx\('set\.openSub'\)/);
  const arena = src('src/arena/ArenaApp.ts');
  // the version 2's duels: the three buttons of before, or the duel played by the computer (lot 2, journal Passe LC3)
  assert.match(arena, /if \(!\(this\.charge \|\| this\.auto\) \|\| !this\.paused \|\| this\.moment \|\| this\.sim\.over \|\| this\.settingsOpen\) return;/);
  assert.match(arena, /else if \(k === 'escape'\) this\.openSettings\(\);/);
  // with the first duel's lesson (journal Passe TU4): the duel ignores the keys of a lesson and of the page
  assert.match(arena, /if \(e\.repeat \|\| e\.metaKey \|\| e\.ctrlKey \|\| e\.altKey \|\| !this\.ready \|\| this\.lesson \|\| this\.settingsOpen\) return;/, 'the duel ignores the keys of the page');
  // a lesson holds the duel without its pause (moment): the page opens from the pause only
  assert.match(arena, /this\.lesson = on; this\.paused = on; this\.moment = on;/);
});
