// The player's settings (journal Passe RG2, the operator's sheet: RG-1 to RG-10): the record read back, today's defaults to the value, the address's own
// parameters first, the quality's tiers, the keyboard's layouts, the language, and every scene wired to them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const S = await load('/src/settings/settings.ts');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const q = (s) => new URLSearchParams(s);

test('the defaults are today\'s game: no resolution cap, MSAA 4, the reflection at half, a60, depth of field and bloom on, no reduced motion', () => {
  assert.deepEqual({ ...S.DEFAULT_SETTINGS }, { res: 'native', msaa: 4, refl: 0.5, fps: 60, dof: true, bloom: true, reducedMotion: false, keyboard: null, lang: null });
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
  const all = { res: 720, msaa: 0, refl: 1, fps: 0, dof: false, bloom: false, reducedMotion: true, keyboard: 'azerty', lang: 'fr' };
  assert.deepEqual(S.readSettings(JSON.stringify(all)), all);
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
  assert.deepEqual(['z', 'q', 's', 'd', 'a', 'w', 'e', 'm', 'j', 'n', 'Escape', 'ArrowUp', ' '].map((k) => S.gameKey(k, 'azerty')), ['w', 'a', 's', 'd', 'q', 'z', 'e', 'm', 'j', 'n', 'escape', 'arrowup', ' ']);
  assert.deepEqual(['W', 'A', 'S', 'D', 'Q', 'Z'].map((k) => S.gameKey(k, 'qwerty')), ['w', 'a', 's', 'd', 'q', 'z']);
  // a key the gamepad presses is the game's own (src/input/PadInput.ts dispatches the keys the interface shows)
  assert.equal(S.gameKey('q', 'azerty', false), 'q');
  // the caps show the key one presses
  assert.deepEqual(['w', 'a', 's', 'd', 'q', 'e'].map((k) => S.shownKey(k, 'azerty')), ['Z', 'Q', 'S', 'D', 'A', 'E']);
  assert.deepEqual(['w', 'a', 's', 'd', 'q'].map((k) => S.shownKey(k, 'qwerty')), ['W', 'A', 'S', 'D', 'Q']);
  assert.equal(S.shownKey('Esc', 'azerty'), 'Esc');
  // what a key shows, the game reads back: the two functions undo each other on both keyboards
  for (const l of ['qwerty', 'azerty']) for (const k of 'wasdqzemjtkgvn') assert.equal(S.gameKey(S.shownKey(k, l), l), k, `${l} ${k}`);
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

test('the walking keys go through the keyboard\'s layout (RG-7); the list\'s key and its cap too', () => {
  const actors = src('src/characters/ActorSystem.ts'), plaza = src('src/world/PlazaApp.ts');
  assert.match(actors, /const k = gameKey\(e\.key, layout\(\), e\.isTrusted\);\n      this\.keys\.add\(k\);/);
  assert.match(plaza, /keys\.add\(gameKey\(e\.key, layout\(\), e\.isTrusted\)\)/);
  for (const t of [actors, plaza]) assert.match(t, /keys\.delete\(gameKey\(e\.key, layout\(\), e\.isTrusted\)\)/);
  assert.match(src('src/arena/ArenaApp.ts'), /walkKeys\.add\(gameKey\(e\.key, layout\(\), e\.isTrusted\)\)/);
  const town = src('src/ui/townUi.ts');
  assert.match(town, /const k = keyOf\(e\);/);
  assert.match(town, /<kbd>\$\{shownKey\('q', layout\(\)\)\}<\/kbd>/);
  assert.match(town, /onSettings\(\(\) => this\.render\(\)\);/);
  // the duel's keys (J, K, L) are the same on both keyboards and are read as typed
  assert.match(src('src/arena/ArenaApp.ts'), /const k = e\.key\.toLowerCase\(\), m = KEYS\[k\];/);
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
  assert.match(town, /add\(tx\('set\.open'\), \(\) => this\.openSettings\(\), 'V'\);/);
  assert.match(town, /else if \(k === 'v' && isV2\(this\.st\)\) this\.openSettings\('sound'\);/);
  assert.doesNotMatch(town, /openSound/);
  assert.match(src('src/ui/title.ts'), /add\('settings', tx\('set\.open'\), tx\('set\.openSub'\)/);
  const arena = src('src/arena/ArenaApp.ts');
  assert.match(arena, /if \(!this\.charge \|\| !this\.paused \|\| this\.moment \|\| this\.sim\.over \|\| this\.settingsOpen\) return;/);
  assert.match(arena, /else if \(k === 'escape'\) this\.openSettings\(\);/);
  assert.match(arena, /if \(e\.repeat \|\| e\.metaKey \|\| e\.ctrlKey \|\| e\.altKey \|\| !this\.ready \|\| this\.settingsOpen\) return;/, 'the duel ignores the keys of the page');
});
