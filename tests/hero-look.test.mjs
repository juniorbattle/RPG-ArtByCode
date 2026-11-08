// Ren's look in a version 2 game (journal Passe PR3, src/characters/HeroLook.ts, HeroLookCast.ts): the hair inside its head rectangle less the eyes' colours,
// the group rule (the largest group and its near locks), the contour browns round the hair, the cloak's deepest fold counted under the outline value, the skin
// grown through its shared tones, the recolouring against an oracle of the sprite shader's formula written here, the gate (an unapproved file changes nothing,
// an approved one must match its fingerprints), the repo's file on Ren's two real sheets, and the wiring (today's game never reaches the look).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const L = await load('/src/characters/HeroLook.ts');
const { namedFrames } = await load('/src/characters/FighterSkins.ts');
const { decodePng } = await load('/src/characters/BakedDecode.ts');
const { hsv } = await load('/src/characters/Variants.ts');
const W = 64, H = 96;
const hex = (h) => [1, 3, 5].map((o) => parseInt(h.slice(o, o + 2), 16));
function frame(name, blocks) {
  const rgba = new Uint8Array(W * H * 4);
  for (const [x0, y0, x1, y1, h] of blocks) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) rgba.set([...hex(h), 255], (y * W + x) * 4);
  return { name, rgba };
}
const at = (m, x, y) => m[y * W + x];
const SKIN = '#fcc89f', SHADE = '#e28a5a', HAIR = '#8c4b31', EYE = '#976947', RIM = '#3b2526', BLUE = '#434d78', FOLD = '#23263f', LEATHER = '#8c4b31', CLOTH = '#e6c9b7';
const sheet = (hair = {}, extra = {}) => ({ skin: { skin: [SKIN.slice(1)], shade: [SHADE.slice(1)] }, hair: { colours: [HAIR.slice(1), EYE.slice(1)], head: { 'idle.0': [10, 5, 40, 30] }, ...hair }, cloak: { colours: [BLUE.slice(1), FOLD.slice(1)], outline: true }, ...extra });

test('hair: its colours inside the head rectangle only; the same brown outside (a glove, a boot) stays', () => {
  const f = frame('idle.0', [[15, 8, 35, 18, HAIR], [18, 19, 30, 28, SKIN], [15, 40, 25, 50, LEATHER], [41, 10, 45, 12, HAIR]]);
  const m = L.frameMaterials(f, W, H, sheet());
  assert.equal(at(m, 20, 10), 2, 'hair in the head');
  assert.equal(at(m, 20, 45), 0, 'the same brown below the head (leather)');
  assert.equal(at(m, 43, 11), 0, 'the same brown right of the head rectangle');
  assert.equal(at(m, 20, 20), 1, 'skin');
  const none = L.frameMaterials({ ...f, name: 'idle.1' }, W, H, sheet());
  assert.equal(at(none, 20, 10), 0, 'a frame without a head rectangle has no hair');
});

test('hair: the eyes\' rectangle protects its own colours only; a later rectangle protects every colour', () => {
  const f = frame('idle.0', [[15, 8, 35, 18, HAIR], [18, 19, 30, 28, SKIN], [20, 16, 21, 17, EYE]]);
  const eyesOnly = L.frameMaterials(f, W, H, sheet({ clear: { 'idle.0': [[18, 14, 26, 18]] }, eyes: [EYE.slice(1)] }));
  assert.equal(at(eyesOnly, 20, 16), 0, 'an eye texel in the rectangle stays');
  assert.equal(at(eyesOnly, 24, 15), 2, 'the fringe crossing the rectangle is hair');
  const all = L.frameMaterials(f, W, H, sheet({ clear: { 'idle.0': [[18, 14, 26, 18]] } }));
  assert.equal(at(all, 24, 15), 0, 'without `eyes` the rectangle protects every colour');
  const glove = L.frameMaterials(f, W, H, sheet({ clear: { 'idle.0': [[18, 14, 19, 14], [30, 8, 35, 12]] }, eyes: [EYE.slice(1)] }));
  assert.equal(at(glove, 32, 10), 0, 'a second rectangle clears the hair colours too (a glove)');
  assert.equal(at(glove, 18, 14), 2, 'the first, eyes-only, leaves the hair');
});

test('hair: the group rule keeps the largest group and the groups within `join` texels of it, without chaining', () => {
  const f = frame('idle.0', [[12, 6, 30, 20, HAIR], [32, 8, 33, 9, HAIR], [35, 8, 36, 9, HAIR], [12, 24, 13, 25, HAIR]]);
  const m = L.frameMaterials(f, W, H, sheet({ join: 2 }));
  assert.equal(at(m, 20, 10), 2, 'the largest group');
  assert.equal(at(m, 32, 8), 2, 'a lock 2 texels away (x 31 empty)');
  assert.equal(at(m, 35, 8), 0, 'a group 2 texels from the lock but 5 from the largest: no chaining');
  assert.equal(at(m, 12, 24), 0, 'a glove 3 rows below');
  assert.equal(at(L.frameMaterials(f, W, H, sheet()), 35, 8), 2, 'without `join`, every group');
});

test('hair: a contour brown touching the hair and no skin is hair; next to the skin it stays', () => {
  const f = frame('idle.0', [[15, 8, 35, 18, HAIR], [14, 7, 36, 7, RIM], [18, 19, 30, 26, SKIN], [17, 19, 17, 26, RIM]]);
  const m = L.frameMaterials(f, W, H, sheet({ rim: [RIM.slice(1)] }));
  assert.equal(at(m, 20, 7), 2, 'the contour over the hair');
  assert.equal(at(m, 17, 19), 0, 'the face\'s contour where it touches the hair: beside the skin, it stays');
  assert.equal(at(m, 17, 22), 0, 'the face\'s contour lower down');
  assert.equal(at(L.frameMaterials(f, W, H, sheet()), 20, 7), 0, 'without `rim`, a contour (value under 0.25) never changes');
});

test('cloak: its listed fold counts under the outline value only with `outline`; skin grows through its tones only with `skinFlood`', () => {
  const f = frame('idle.0', [[10, 40, 30, 60, BLUE], [12, 42, 14, 44, FOLD], [18, 19, 30, 26, SKIN], [31, 19, 34, 26, SHADE]]);
  assert.equal(at(L.frameMaterials(f, W, H, sheet()), 13, 43), 3, 'the fold, value 0.247, with outline: true');
  assert.equal(at(L.frameMaterials(f, W, H, { ...sheet(), cloak: { colours: [BLUE.slice(1), FOLD.slice(1)] } }), 13, 43), 0, 'without outline: an outline');
  assert.equal(at(L.frameMaterials(f, W, H, sheet()), 33, 22), 0, 'a shade column beside the skin: not skin by the neighbour rule');
  assert.equal(at(L.frameMaterials(f, W, H, sheet({}, { skinFlood: true })), 33, 22), 1, 'grown from the face through the shade');
});

test('hair grows out of its rectangle through its colours (`grow` steps, never through skin); the neck\'s shadow is skin outside the skin\'s range', () => {
  const f = frame('idle.0', [[15, 8, 35, 18, HAIR], [36, 10, 44, 11, HAIR], [18, 19, 30, 28, SKIN], [31, 22, 33, 26, HAIR], [50, 10, 52, 11, HAIR]]);
  const grown = L.frameMaterials(f, W, H, sheet({ head: { 'idle.0': [10, 5, 35, 18] }, grow: 4 }));
  assert.equal(at(grown, 39, 10), 2, 'a spike 4 texels past the rectangle');
  assert.equal(at(grown, 41, 10), 0, 'not past `grow` steps');
  assert.equal(at(grown, 51, 10), 0, 'an unconnected brown far away');
  assert.equal(at(L.frameMaterials(f, W, H, sheet({ head: { 'idle.0': [10, 5, 35, 18] } })), 37, 10), 0, 'without `grow`, the rectangle bounds the hair');
  const neck = L.frameMaterials(f, W, H, sheet({}, { neck: { 'idle.0': [[31, 22, 33, 26]] } }));
  assert.equal(at(neck, 32, 24), 4, 'a hair brown in the neck rectangle: the neck\'s shadow');
  const r = L.materialRanges([{ frames: [f], maps: [neck] }]), plain = L.materialRanges([{ frames: [f], maps: [L.frameMaterials(f, W, H, sheet())] }]);
  assert.deepEqual(r.skin, plain.skin, 'the neck\'s shadow does not stretch the skin\'s range');
  const out = L.recolorLook(f.rgba, neck, { ramps: { skin: { s: ['#100000', '#300000', '#600000', '#900000', '#c00000'] }, hair: {}, cloak: {} }, ranges: { skin: [0.2, 0.7], hair: [0, 1], cloak: [0, 1] } }, { skin: 's' });
  assert.notDeepEqual([...out.slice((24 * W + 32) * 4, (24 * W + 32) * 4 + 3)], hex(HAIR), 'the neck\'s shadow takes the skin\'s ramp');
});

test('recolouring: each material at its pinned range on its ramp, against the shader\'s formula written here', () => {
  const toLin = (u) => { const c = u / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const toSrgb = (l) => Math.round(255 * Math.min(1, Math.max(0, l <= 0.0031308 ? 12.92 * l : 1.055 * l ** (1 / 2.4) - 0.055)));
  const lum = (r, g, b) => 0.2126 * toLin(r) + 0.7152 * toLin(g) + 0.0722 * toLin(b);
  const oracle = (px, range, ramp) => { const t = Math.min(1, Math.max(0, (lum(...px) - range[0]) / (range[1] - range[0]))) * 4, a = Math.min(3, Math.floor(t)), w = t - a; return [0, 1, 2].map((c) => toSrgb(toLin(hex(ramp[a])[c]) * (1 - w) + toLin(hex(ramp[a + 1])[c]) * w)); };
  const ramps = { skin: { s: ['#100000', '#300000', '#600000', '#900000', '#c00000'] }, hair: { h: ['#000010', '#000030', '#000060', '#000090', '#0000c0'] }, cloak: { c: ['#001000', '#003000', '#006000', '#009000', '#00c000'] } };
  const ranges = { skin: [0.2, 0.7], hair: [0.01, 0.5], cloak: [0.02, 0.1] };
  const px = [[252, 200, 159], [140, 75, 49], [67, 77, 120], [230, 201, 183]], rgba = new Uint8Array(px.flatMap((p) => [...p, 255])), map = new Uint8Array([1, 2, 3, 0]);
  const out = L.recolorLook(rgba, map, { ramps, ranges }, { skin: 's', hair: 'h', cloak: 'c' });
  assert.deepEqual([...out.slice(0, 3)], oracle(px[0], ranges.skin, ramps.skin.s));
  assert.deepEqual([...out.slice(4, 7)], oracle(px[1], ranges.hair, ramps.hair.h));
  assert.deepEqual([...out.slice(8, 11)], oracle(px[2], ranges.cloak, ramps.cloak.c));
  assert.deepEqual([...out.slice(12, 15)], px[3], 'no material: untouched');
  assert.deepEqual([...L.recolorLook(rgba, map, { ramps, ranges }, { hair: 'h' }).slice(0, 3)], px[0], 'a material absent from the look keeps its texels');
  assert.deepEqual([...rgba.slice(0, 3)], px[0], 'the source frame untouched');
  assert.throws(() => L.recolorLook(rgba, map, { ramps, ranges }, { hair: 'nope' }), /no hair ramp/);
});

test('the gate: an unapproved file changes nothing; a candidate shows; an approved file needs its fingerprint', () => {
  const f = frame('idle.0', [[15, 8, 35, 18, HAIR], [18, 19, 30, 28, SKIN]]), frames = [f];
  const file = { approved: false, approval: null, ramps: { skin: { tan: ['#64392a', '#80503a', '#9c674c', '#b47e60', '#c89474'] }, hair: { g: ['#303030', '#606060', '#909090', '#b0b0b0', '#d0d0d0'] }, cloak: {} }, look: { skin: 'tan', hair: 'g' }, ranges: { skin: [0.2, 0.7], hair: [0.01, 0.5], cloak: [0, 1] }, sheets: { s: sheet() } };
  assert.equal(L.sheetLook(file, 's', frames, W, H), null, 'unapproved: production changes nothing');
  const cand = L.sheetLook(file, 's', frames, W, H, 'candidate');
  assert.notDeepEqual([...cand(0, f.rgba).slice((10 * W + 20) * 4, (10 * W + 20) * 4 + 3)], hex(HAIR), 'candidate: the hair changes');
  const fp = L.lookFingerprint(L.sheetMaterials(frames, W, H, file.sheets.s));
  const approved = { ...file, approved: true, approval: { by: 'operator', date: '2026-11-08' } };
  assert.throws(() => L.sheetLook(approved, 's', frames, W, H), /not the approved maps/, 'approved without the fingerprint');
  approved.sheets = { s: { ...sheet(), fingerprint: fp } };
  assert.ok(L.sheetLook(approved, 's', frames, W, H), 'approved with its fingerprint');
  assert.equal(L.sheetLook({ ...approved, approval: { by: '', date: '' } }, 's', frames, W, H), null, 'approved without a named approval');
  assert.equal(L.sheetLook(approved, 'other', frames, W, H), null, 'a sheet the file does not name');
  const keep = L.sheetLook(file, 's', frames, W, H, 'candidate', { hair: 'g' });
  assert.deepEqual([...keep(0, f.rgba).slice((20 * W + 20) * 4, (20 * W + 20) * 4 + 3)], hex(SKIN), 'a review look without skin keeps the skin');
});

const FILE = JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/variants/hero.json'), 'utf8'));
const real = await Promise.all(['hero-x2-v4', 'hero-x3-combat'].map(async (id) => {
  const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`))));
  const { fw, fh, frames } = namedFrames(img, JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8')), id.endsWith('-combat'));
  return { id, fw, fh, frames, maps: L.sheetMaterials(frames, fw, fh, FILE.sheets[id]) };
}));

test('the file: the NPCs\' tan, the look\'s ramps, a head on every frame, the ranges pinned to the maps', () => {
  const npc = JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/variants/variants.json'), 'utf8'));
  assert.deepEqual(FILE.ramps.skin.tan, npc.ramps.skin.tan, 'the skin is the NPCs\' approved tan');
  // the operator's choices (journal Passe PR4): PR3-CHEVEUX « Acier (gris moyen) », PR3-PEAU « Hâlée, comme montrée », PR3-CAPE « Ivoire, comme montrée », PR3-PROD « En production »
  assert.deepEqual(FILE.look, { skin: 'tan', hair: 'steel', cloak: 'ivory' }, 'tan skin, steel hair, ivory cloak');
  for (const m of ['skin', 'hair', 'cloak']) { assert.ok(FILE.ramps[m][FILE.look[m]], `${m}: the look's ramp exists`); assert.equal(FILE.ramps[m][FILE.look[m]].length, 5); }
  assert.deepEqual(FILE.ramps.hair.steel, ['#34363e', '#7c7e88', '#a6a7ae', '#c8c8cc', '#e6e5e0'], 'the steel ramp shown on the sheet');
  assert.deepEqual(FILE.ramps.cloak.ivory, ['#5e5a52', '#827c70', '#a49e90', '#c2bcae', '#dad4c6'], 'the ivory ramp shown on the sheet');
  assert.equal(FILE.approved, true);
  assert.equal(FILE.approval?.by, 'operator');
  assert.match(FILE.approval?.note ?? '', /PR3-CHEVEUX « Acier \(gris moyen\) »/);
  assert.match(FILE.approval?.note ?? '', /PR3-PROD « En production »/);
  for (const s of real) assert.equal(FILE.sheets[s.id].fingerprint, L.lookFingerprint(s.maps), `${s.id}: the approved fingerprint is its maps'`);
  for (const s of real) assert.ok(L.sheetLook(FILE, s.id, s.frames, s.fw, s.fh), `${s.id}: production applies the look`);
  for (const s of real) for (const f of s.frames) assert.ok(FILE.sheets[s.id].hair.head[f.name], `${s.id} ${f.name}: a head rectangle`);
  const r = L.materialRanges(real);
  for (const m of ['skin', 'hair', 'cloak']) for (const k of [0, 1]) assert.ok(Math.abs(r[m][k] - FILE.ranges[m][k]) < 1e-6, `${m}: the pinned range is the maps' (${r[m]} vs ${FILE.ranges[m]})`);
});

test('the real sheets: skin, hair and cloak on every frame; outlines changed only where listed (the hair\'s contour, the cloak\'s fold)', () => {
  for (const s of real) {
    const own = FILE.sheets[s.id], allowed = new Set([...(own.hair.rim ?? []), ...(own.cloak.outline ? own.cloak.colours : [])].map((c) => parseInt(c, 16)));
    s.frames.forEach((f, n) => {
      const m = s.maps[n], count = [0, 0, 0, 0, 0];
      for (let j = 0; j < m.length; j++) {
        count[m[j]]++;
        if (!m[j]) continue;
        const i = j * 4, k = (f.rgba[i] << 16) | (f.rgba[i + 1] << 8) | f.rgba[i + 2];
        if (hsv(f.rgba[i], f.rgba[i + 1], f.rgba[i + 2])[2] < 0.25) assert.ok(allowed.has(k), `${s.id} ${f.name}: an outline ${k.toString(16)} recoloured`);
      }
      assert.ok(count[2] > 40, `${s.id} ${f.name}: hair (${count[2]})`);
      assert.ok(count[3] > 100, `${s.id} ${f.name}: cloak (${count[3]})`);
      // the back views show no face
      if (!/^(up|upSide)\//.test(f.name)) assert.ok(count[1] + count[4] > 4, `${s.id} ${f.name}: skin (${count[1]} + neck ${count[4]})`);
    });
  }
});

test('the wiring: today\'s game never reaches the look; a version 2 game asks for it', () => {
  const src = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
  const app = src('src/app/App.ts');
  assert.ok(!/^import[^\n]*HeroLookCast/m.test(app), 'App imports the look on demand only');
  assert.match(app, /params\.has\('herolook'\) \? await import\('\.\.\/characters\/HeroLookCast'\)/, 'App: only under `herolook`');
  assert.match(src('src/ui/playTown.ts'), /if \(isV2\(st\)\) q\.set\('herolook', '1'\)/, 'the town page of a version 2 game asks for it');
  assert.match(src('src/ui/playTown.ts'), /isV2\(st\) \? \(await import\('\.\.\/characters\/PlazaCast'\)\)\.plazaFaces\(\) : undefined;\r?\n[^\n]*\r?\n  if \(faces\) faces\.player = \(await import\('\.\.\/characters\/HeroLookCast'\)\)\.heroPortrait\(\);/, 'the portraits of a version 2 game alone');
  for (const p of ['src/world/PlazaApp.ts', 'src/arena/CombatCast.ts']) assert.match(src(p), /HeroLookCast/, `${p} (version 2 only)`);
  // the modules that import it: the version 2's alone
  const users = [];
  const walk = (d) => { for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) { const p = `${d}/${e.name}`; if (e.isDirectory()) walk(p); else if (/\.ts$/.test(e.name) && /(from |import\()'[^']*\/HeroLookCast'/.test(src(p))) users.push(p); } };
  walk('src');
  assert.deepEqual(users.sort(), ['src/app/App.ts', 'src/arena/CombatCast.ts', 'src/arena/CombatSheets.ts', 'src/ui/playPlaza.ts', 'src/ui/playTown.ts', 'src/world/PlazaApp.ts'].sort());
  assert.match(src('src/arena/CombatSheets.ts'), /import\('\.\.\/characters\/HeroLookCast'\)/, 'the HUD face: on demand, from the version 2\'s duel');
});
