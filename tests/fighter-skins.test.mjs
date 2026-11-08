// The generic fighters' skin variants (journal Passe GS1, src/characters/FighterSkins.ts, FighterSkinCast.ts): the masks written by palette colours (skin
// anywhere, shade only where skin surrounds it, the smallest group, a boot's highlight, the hand corrections per frame), the recolouring against an oracle
// of the sprite shader's formula written here, the gate (an unapproved file changes nothing, an approved one must match its fingerprints), and the repo's
// file on the six fighters' real sheets.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const F = await load('/src/characters/FighterSkins.ts');
const cast = await load('/src/characters/FighterSkinCast.ts');
const plaza = await load('/src/characters/PlazaCast.ts');
const { decodePng } = await load('/src/characters/BakedDecode.ts');
const W = 64, H = 96;
const hex = (h) => [1, 3, 5].map((o) => parseInt(h.slice(o, o + 2), 16));
/** a frame with coloured blocks: [x0, y0, x1, y1, '#rrggbb'] (inclusive) */
function frame(name, blocks) {
  const rgba = new Uint8Array(W * H * 4);
  for (const [x0, y0, x1, y1, h] of blocks) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) { const j = (y * W + x) * 4; rgba.set([...hex(h), 255], j); }
  return { name, rgba };
}
const SKIN = '#f4bd8f', SHADE = '#9b5c40', HAIR = '#8b563e', OUT = '#141018', CLOTH = '#ead1b5';
const at = (m, x, y) => m[y * W + x];
const mask = { skin: [SKIN.slice(1)], shade: [SHADE.slice(1)] };

test('masks: a skin colour anywhere, never an outline; another colour never, shade only with 4 of 8 skin neighbours', () => {
  const f = frame('idle.0', [[10, 10, 20, 20, SKIN], [15, 15, 15, 15, SHADE], [21, 10, 21, 20, SHADE], [30, 10, 34, 14, HAIR], [10, 21, 20, 21, OUT], [40, 40, 44, 44, CLOTH]]);
  f.rgba.set([...hex(SKIN), 255], (12 * W + 12) * 4);
  const m = F.frameSkin(f, W, H, mask);
  assert.equal(at(m, 12, 12), 1, 'skin');
  assert.equal(at(m, 15, 15), 1, 'shade enclosed by skin (8 neighbours)');
  assert.equal(at(m, 21, 15), 0, 'a shade column beside skin: 3 skin neighbours each, in both passes');
  assert.equal(at(m, 32, 12), 0, 'hair');
  assert.equal(at(m, 15, 21), 0, 'outline');
  assert.equal(at(m, 42, 42), 0, 'cloth');
  // a lone shade texel beside skin (3 skin neighbours) stays
  const g = frame('idle.0', [[10, 10, 12, 10, SKIN], [11, 11, 11, 11, SHADE]]);
  assert.equal(at(F.frameSkin(g, W, H, mask), 11, 11), 0, '3 skin neighbours: not skin');
  const g4 = frame('idle.0', [[10, 10, 12, 10, SKIN], [10, 11, 10, 11, SKIN], [11, 11, 11, 11, SHADE]]);
  assert.equal(at(F.frameSkin(g4, W, H, mask), 11, 11), 1, '4 skin neighbours: skin');
  // an outline-dark colour listed as skin is still an outline
  assert.equal(at(F.frameSkin(frame('idle.0', [[5, 5, 9, 9, OUT]]), W, H, { skin: [OUT.slice(1)] }), 7, 7), 0, 'outline listed as skin');
});

test('masks: the smallest group kept, a boot\'s highlight in the bottom rows dropped, the frame\'s own corrections', () => {
  const f = frame('hit.1', [[10, 10, 19, 19, SKIN], [40, 10, 41, 11, SKIN], [10, 80, 13, 89, CLOTH], [11, 86, 13, 89, SKIN], [30, 70, 33, 89, SKIN], [50, 30, 54, 34, SHADE], [50, 34, 54, 34, CLOTH], [50, 35, 54, 35, OUT]]);
  const m = F.frameSkin(f, W, H, { ...mask, minPart: 5, feet: 6 });
  assert.equal(at(m, 15, 15), 1, 'a group of 100');
  assert.equal(at(m, 40, 10), 0, 'a group of 4 < 5');
  assert.equal(at(m, 12, 88), 0, 'a group lying in the bottom 6 rows (84-89 of a figure ending on row 89)');
  assert.equal(at(m, 31, 88), 1, 'a group reaching above the bottom rows keeps its feet');
  assert.equal(at(F.frameSkin(f, W, H, mask), 40, 10), 1, 'without minPart, every texel');
  assert.equal(at(m, 51, 32), 0, 'a shade group alone');
  const fixed = { ...mask, minPart: 5, force: { 'hit.1': [[50, 30, 52, 35]], 'hit.0': [[0, 0, 1, 1]] }, clear: { 'hit.1': [[10, 10, 12, 19]] } };
  const n = F.frameSkin(f, W, H, fixed);
  assert.equal(at(n, 51, 32), 1, 'a shade colour forced on this frame , its group of 12 kept');
  assert.equal(at(n, 51, 34), 0, 'cloth in the forced rectangle stays');
  assert.equal(at(n, 51, 35), 0, 'an outline in the forced rectangle stays');
  assert.equal(at(n, 53, 32), 0, 'beside the forced rectangle');
  assert.equal(at(n, 11, 15), 0, 'cleared on this frame');
  assert.equal(at(n, 15, 15), 1, 'beside the cleared rectangle');
  assert.equal(at(F.frameSkin({ ...f, name: 'hit.0' }, W, H, fixed), 51, 32), 0, 'a correction belongs to its frame only');
});

// the oracle: BODY_FRAG's recolouring written again from its text (the ramp texture: 5 sRGB stops, linear filtering after decoding)
const lin = (u) => { const c = u / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const srgb = (l) => Math.round(255 * (l <= 0.0031308 ? 12.92 * l : 1.055 * Math.pow(l, 1 / 2.4) - 0.055));
function oracle(rgb, range, ramp) {
  const L = 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  const t = Math.min(1, Math.max(0, (L - range[0]) / Math.max(range[1] - range[0], 1e-4)));
  const u = t * 4, i = Math.min(3, Math.floor(u)), w = u - i, a = hex(ramp[i]), b = hex(ramp[i + 1]);
  return [0, 1, 2].map((c) => srgb(lin(a[c]) * (1 - w) + lin(b[c]) * w));
}

test('recolour: the shader\'s formula on every masked texel, the others and the alpha untouched, the frame itself never written', () => {
  const ramp = ['#38211a', '#4e3024', '#664032', '#7e5242', '#966654'];
  const cols = ['#f4bd8f', '#d89369', '#af6b45', '#9b5c40', '#ffffff', '#000000', '#8b563e'];
  const rgba = new Uint8Array(cols.length * 4), m = new Uint8Array(cols.length);
  cols.forEach((c, i) => { rgba.set([...hex(c), 255], i * 4); m[i] = i === 6 ? 0 : 1; });
  rgba[7] = 200;   // an alpha the recolouring must keep
  const range = [0.08, 0.55], before = Uint8Array.from(rgba), out = F.recolor(rgba, m, range, ramp);
  assert.deepEqual(rgba, before, 'input untouched');
  cols.forEach((c, i) => {
    const got = [...out.slice(i * 4, i * 4 + 3)];
    if (!m[i]) assert.deepEqual(got, hex(c), `${c} unmasked`);
    else assert.deepEqual(got, oracle(hex(c), range, ramp), `${c}`);
    assert.equal(out[i * 4 + 3], rgba[i * 4 + 3], 'alpha');
  });
  assert.deepEqual([...out.slice(16, 19)], hex(ramp[4]), 'above the range: the lightest stop');
  assert.deepEqual([...out.slice(20, 23)], hex(ramp[0]), 'below the range: the darkest stop');
});

const file = JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/variants/fighters.json'), 'utf8'));
const npc = JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/variants/variants.json'), 'utf8'));
const sheets = {};
async function sheet(id) {
  if (sheets[id]) return sheets[id];
  const img = await decodePng(new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`))));
  return (sheets[id] = F.namedFrames(img, JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8')), id.endsWith('-combat')));
}

test('the gate: an unapproved file shows nothing; a candidate shows; an approved file needs its fingerprints, then its fixed variant', async () => {
  const s = await sheet('kell-x3-combat'), base = file.fighters.kell;
  const unapproved = { ...file, approved: false, approval: null, fighters: { kell: { ...base, fixed: 4 } } };
  assert.equal(F.sheetTone(unapproved, 'kell', 'kell-x3-combat', s.frames, s.fw, s.fh), null, 'unapproved: nothing');
  const cand = F.sheetTone(unapproved, 'kell', 'kell-x3-combat', s.frames, s.fw, s.fh, 'candidate', 2);
  assert.equal(cand.ramp, base.variants[1], 'the candidate asked');
  const fp = cand.fingerprint, approval = { by: 'test', date: '2026-11-08' };
  const ok = { ...file, approved: true, approval, fighters: { kell: { ...base, fixed: 4, sheets: { ...base.sheets, 'kell-x3-combat': { ...base.sheets['kell-x3-combat'], fingerprint: fp } } } } };
  assert.equal(F.sheetTone(ok, 'kell', 'kell-x3-combat', s.frames, s.fw, s.fh).ramp, base.variants[3], 'approved: the fixed variant');
  assert.equal(F.sheetTone(ok, 'kell', 'kell-x3-combat', s.frames, s.fw, s.fh, 'approved', 1).ramp, base.variants[3], 'approved: a review variant never overrides the fixed one');
  const bad = structuredClone(ok); bad.fighters.kell.sheets['kell-x3-combat'].fingerprint = '00000000';
  assert.throws(() => F.sheetTone(bad, 'kell', 'kell-x3-combat', s.frames, s.fw, s.fh), /not the approved masks/, 'approved, another fingerprint: refused');
  const none = structuredClone(ok); delete none.fighters.kell.fixed;
  assert.equal(F.sheetTone(none, 'kell', 'kell-x3-combat', s.frames, s.fw, s.fh), null, 'approved without a fixed variant: the original');
  const noDate = { ...ok, approval: { by: 'test' } };
  assert.equal(F.sheetTone(noDate, 'kell', 'kell-x3-combat', s.frames, s.fw, s.fh), null, 'an approval without its date is no approval');
});

test('the file: the NPCs\' approved skin ramps as they are, the six fighters and their two sheets, the recorded fingerprints those of the masks', async () => {
  assert.deepEqual(file.ramps.skin, npc.ramps.skin, 'the skin ramps approved for the NPCs (journal Passe V2), unchanged');
  assert.deepEqual(Object.keys(file.fighters).sort(), ['aldric', 'ambrose', 'corra', 'kell', 'lucan', 'piers']);
  for (const [who, f] of Object.entries(file.fighters)) {
    assert.deepEqual(Object.keys(f.sheets).sort(), [`${who}-x2-v1`, `${who}-x3-combat`], who);
    for (const v of f.variants) assert.ok(file.ramps.skin[v], `${who}: ramp ${v}`);
    if (f.fixed !== undefined) assert.ok(f.fixed >= 0 && f.fixed <= f.variants.length, `${who}: fixed in range`);
    for (const [id, sv] of Object.entries(f.sheets)) {
      const s = await sheet(id), masks = F.sheetSkin(s.frames, s.fw, s.fh, sv.mask);
      if (sv.fingerprint) assert.equal(F.skinFingerprint(masks), sv.fingerprint, `${id}: the recorded fingerprint`);
    }
  }
  if (file.approved) for (const [who, f] of Object.entries(file.fighters)) if (f.fixed) for (const [id, sv] of Object.entries(f.sheets)) assert.ok(sv.fingerprint, `${who} ${id}: an approved variant needs its fingerprint`);
});

test('the real sheets: the five faces masked on every frame that shows one, Aldric\'s closed helm none, never an outline, the colours the sheet\'s own', async () => {
  const hsv = (r, g, b) => Math.max(r, g, b) / 255;
  for (const [who, f] of Object.entries(file.fighters)) for (const [id, sv] of Object.entries(f.sheets)) {
    const s = await sheet(id), masks = F.sheetSkin(s.frames, s.fw, s.fh, sv.mask);
    const palette = new Set(); for (const fr of s.frames) for (let i = 0; i < fr.rgba.length; i += 4) if (fr.rgba[i + 3] >= 128) palette.add(((fr.rgba[i] << 16) | (fr.rgba[i + 1] << 8) | fr.rgba[i + 2]).toString(16).padStart(6, '0'));
    for (const c of [...sv.mask.skin, ...(sv.mask.shade ?? [])]) assert.ok(palette.has(c), `${id}: ${c} is a colour of the sheet`);
    const counts = masks.map((m) => m.reduce((a, x) => a + x, 0));
    if (who === 'aldric') { assert.equal(counts.reduce((a, b) => a + b, 0), 0, 'Aldric: no skin'); continue; }
    // every frame but the back views shows skin (the face, the hands); the frames read on the sheet where it hides: Lucan's raised blade covers his face
    // (heavy.1, skillOff.1: none), Corra lies face down (ko.2: a few texels of a cheek)
    const hidden = { 'lucan-x3-combat': { 'heavy.1': 0, 'skillOff.1': 0 }, 'corra-x3-combat': { 'ko.2': 5 } }[id] ?? {};
    s.frames.forEach((fr, n) => {
      if (fr.name in hidden) assert.equal(counts[n], hidden[fr.name], `${id} ${fr.name}: the skin it shows`);
      else if (!fr.name.startsWith('up/')) assert.ok(counts[n] >= (id.endsWith('-combat') ? 12 : 4), `${id} ${fr.name}: ${counts[n]} skin texels`);
    });
    masks.forEach((m, n) => { for (let j = 0; j < m.length; j++) if (m[j]) { const i = j * 4, fr = s.frames[n].rgba; assert.ok(fr[i + 3] >= 128 && hsv(fr[i], fr[i + 1], fr[i + 2]) >= 0.25, `${id} ${s.frames[n].name}: an outline or a hole masked`); } });
  }
});

test('the runtime: nothing recoloured while the file waits for the operator; never a sheet that is not a generic fighter\'s', async () => {
  assert.equal(cast.fighterOfSheet('kell-x3-combat'), 'kell');
  assert.equal(cast.fighterOfSheet('lucan-x2-v1'), 'lucan');
  assert.equal(cast.fighterOfSheet('hero-x3-combat'), null);
  assert.equal(cast.fighterOfSheet('marek-x3-combat'), null);
  assert.equal(cast.fighterOfSheet('orla-x2-v2'), null);
  for (const who of Object.keys(file.fighters)) for (const id of Object.keys(file.fighters[who].sheets)) {
    const s = await sheet(id), skin = cast.sheetSkin(id, s.frames, s.fw, s.fh), f = file.fighters[who];
    if (!file.approved || !f.fixed) assert.equal(skin, null, `${id}: no variant without an approved fixed one`);
    else { const n = s.frames.findIndex((q) => q.name.endsWith('idle.0')), out = skin(n, s.frames[n].rgba); assert.notDeepEqual(out, s.frames[n].rgba, `${id}: recoloured`); }
  }
  // the portraits' hook: the town sheet's front idle, recoloured or null
  const s = await sheet('kell-x2-v1'), frames = s.frames.map((q) => { const [dir, rest] = q.name.split('/'), [anim, i] = rest.split('.'); return { dir, anim, i: +i, rgba: q.rgba }; });
  const face = plaza.fighterFace('kell-x2-v1', frames, s.fw, s.fh);
  if (!file.approved || !file.fighters.kell.fixed) assert.equal(face, null, 'the portrait keeps its texels');
  const faces = plaza.plazaFaces();
  for (const who of ['aldric', 'corra', 'ambrose', 'lucan', 'piers', 'kell']) assert.equal(typeof faces[who].face, 'function', `${who}: the portrait's hook`);
  assert.equal(faces.orla.face, undefined, 'a rival of the casting: no hook');
});

test('masks: the group rules - a core colour, a border of another material, an anchor nearby, the largest group', () => {
  const LIGHT = '#fac89e', CORE = '#f0af83', CREAM = '#dfc6ad', RED = '#e36258', OUT2 = '#151314';
  // a "face": LIGHT with a CORE texel, under RED hair; a "cloak highlight": LIGHT inside CREAM, far from the hair
  const f = frame('idle.0', [[20, 8, 32, 11, RED], [20, 12, 32, 22, LIGHT], [26, 17, 26, 17, CORE], [10, 50, 30, 70, CREAM], [15, 55, 22, 60, LIGHT], [40, 40, 52, 47, LIGHT], [39, 39, 53, 39, OUT2]]);
  const s = { skin: [LIGHT.slice(1), CORE.slice(1)] };
  const at2 = (m, x, y) => m[y * W + x];
  let m = F.frameSkin(f, W, H, s);
  assert.deepEqual([at2(m, 25, 15), at2(m, 18, 57), at2(m, 45, 43)], [1, 1, 1], 'colour alone: all three');
  m = F.frameSkin(f, W, H, { ...s, core: [CORE.slice(1)] });
  assert.deepEqual([at2(m, 25, 15), at2(m, 18, 57), at2(m, 45, 43)], [1, 0, 0], 'core: only the group holding the core colour');
  assert.equal(at2(F.frameSkin(f, W, H, { ...s, core: [CORE.slice(1)], minCore: 2 }), 25, 15), 0, 'minCore 2: one core texel is not enough');
  m = F.frameSkin(f, W, H, { ...s, foreign: [CREAM.slice(1)] });
  assert.deepEqual([at2(m, 25, 15), at2(m, 18, 57), at2(m, 45, 43)], [1, 0, 1], 'foreign: the group bordered by cream goes, the others stay');
  m = F.frameSkin(f, W, H, { ...s, near: { colours: [RED.slice(1)], radius: 2 } });
  assert.deepEqual([at2(m, 25, 15), at2(m, 18, 57), at2(m, 45, 43)], [1, 0, 0], 'near: only the group within 2 texels of the hair');
  assert.equal(at2(F.frameSkin(f, W, H, { ...s, near: { colours: [RED.slice(1)], radius: 0 } }), 25, 15), 0, 'near radius 0: the face does not touch the hair\'s own texels');
  // the face 143 texels, the cloak highlight 48, the third 104: relative 0.5 keeps the face and the third
  m = F.frameSkin(f, W, H, { ...s, relative: 0.5 });
  assert.deepEqual([at2(m, 25, 15), at2(m, 18, 57), at2(m, 45, 43)], [1, 0, 1], 'relative 0.5: the groups under half the largest go');
  m = F.frameSkin(f, W, H, { ...s, relative: 0.5, force: { 'idle.0': [[15, 55, 16, 56]] }, shade: [] });
  assert.equal(at2(m, 18, 57), 1, 'a group touching a forced rectangle stays');
  m = F.frameSkin(f, W, H, { ...s, foreign: [CREAM.slice(1)], foreignShare: 1.01 });
  assert.equal(at2(m, 18, 57), 1, 'a share above 1 never drops');
});
