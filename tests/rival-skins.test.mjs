// The rivals' skin variants (journal Passe RS1; the generic fighters' rules, src/characters/FighterSkins.ts, through their second file
// art-lab/characters/variants/rivals.json): the file (the NPCs' skin ramps, the seven rivals, their two sheets), the masks on the real sheets
// (skin on every frame that shows some, never an outline, the colours the sheet's own), the order a square decodes a town sheet in (the fingerprint the
// tools write is the one a square checks), and the runtime: a sheet of the file recoloured only through its approval, on a square, in a portrait and in
// a duel; the generic fighters' file and today's game untouched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const F = await load('/src/characters/FighterSkins.ts');
const cast = await load('/src/characters/FighterSkinCast.ts');
const plaza = await load('/src/characters/PlazaCast.ts');
const baked = await load('/src/characters/BakedCast.ts');
const { decodePng, sheetFrames } = await load('/src/characters/BakedDecode.ts');

const read = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));
const file = read('art-lab/characters/variants/rivals.json'), generics = read('art-lab/characters/variants/fighters.json'), npc = read('art-lab/characters/variants/variants.json');
const RIVALS = ['cassius', 'ilse', 'marek', 'orla', 'rhosk', 'tobin', 'vessa'];
const SHEETS = (who) => [`${who}-x2-v2`, `${who}-x3-combat`];
const png = {}, sheets = {};
const bytes = (id) => (png[id] ??= new Uint8Array(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.png`))));
async function sheet(id) {
  return (sheets[id] ??= F.namedFrames(await decodePng(bytes(id)), read(`art-lab/characters/exports/${id}.json`), id.endsWith('-combat')));
}
const count = (m) => m.reduce((a, x) => a + x, 0);

/** the frames where a sheet's skin hides, read on the sheets (their counts pinned); every other frame but a back view shows some */
const HIDDEN = {
  // Ilse lies face down at the knockout: her coif and her hair cover her face and her hands (read on the sheet)
  'ilse-x3-combat': { 'ko.2': 0 },
};

test('the file: the NPCs\' approved skin ramps as they are, the seven rivals with their two sheets, the recorded fingerprints those of the masks', async () => {
  assert.deepEqual(file.ramps.skin, npc.ramps.skin, 'the skin ramps approved for the NPCs (journal Passe V2), unchanged');
  assert.deepEqual(file.ramps, generics.ramps, 'the generic fighters\' ramps');
  assert.deepEqual(Object.keys(file.fighters).sort(), RIVALS, 'the seven rivals (Ren: a customisation of his own, the operator note of 2026-11-08)');
  for (const [w, f] of Object.entries(file.fighters)) {
    assert.deepEqual(Object.keys(f.sheets).sort(), SHEETS(w), w);
    for (const v of f.variants) assert.ok(file.ramps.skin[v], `${w}: ramp ${v}`);
    if (f.fixed !== undefined) assert.ok(Number.isInteger(f.fixed) && f.fixed >= 0 && f.fixed <= f.variants.length, `${w}: fixed in range`);
    for (const [id, sv] of Object.entries(f.sheets)) {
      const s = await sheet(id), masks = F.sheetSkin(s.frames, s.fw, s.fh, sv.mask);
      if (sv.fingerprint) assert.equal(F.skinFingerprint(masks), sv.fingerprint, `${id}: the recorded fingerprint`);
    }
  }
  if (file.approved) for (const [w, f] of Object.entries(file.fighters)) if (f.fixed) for (const [id, sv] of Object.entries(f.sheets)) assert.ok(sv.fingerprint, `${w} ${id}: an approved variant needs its fingerprint`);
  // no sheet in both files: a sheet has one owner
  const mine = new Set(Object.values(file.fighters).flatMap((f) => Object.keys(f.sheets)));
  for (const f of Object.values(generics.fighters)) for (const id of Object.keys(f.sheets)) assert.ok(!mine.has(id), `${id} in both files`);
});

test('the real sheets: skin on every frame that shows some, the hidden ones pinned, never an outline, the colours the sheet\'s own', async () => {
  const value = (r, g, b) => Math.max(r, g, b) / 255;
  for (const [w, f] of Object.entries(file.fighters)) for (const [id, sv] of Object.entries(f.sheets)) {
    const s = await sheet(id), masks = F.sheetSkin(s.frames, s.fw, s.fh, sv.mask);
    const palette = new Set(); for (const fr of s.frames) for (let i = 0; i < fr.rgba.length; i += 4) if (fr.rgba[i + 3] >= 128) palette.add(((fr.rgba[i] << 16) | (fr.rgba[i + 1] << 8) | fr.rgba[i + 2]).toString(16).padStart(6, '0'));
    for (const c of [...sv.mask.skin, ...(sv.mask.shade ?? []), ...(sv.mask.foreign ?? [])]) assert.ok(palette.has(c), `${id}: ${c} is a colour of the sheet`);
    const hidden = HIDDEN[id] ?? {};
    s.frames.forEach((fr, n) => {
      const c = count(masks[n]);
      if (fr.name in hidden) assert.equal(c, hidden[fr.name], `${id} ${fr.name}: the skin it shows`);
      else if (!fr.name.startsWith('up/')) assert.ok(c >= (id.endsWith('-combat') ? 12 : 4), `${id} ${fr.name}: ${c} skin texels`);
    });
    masks.forEach((m, n) => { for (let j = 0; j < m.length; j++) if (m[j]) { const i = j * 4, fr = s.frames[n].rgba; assert.ok(fr[i + 3] >= 128 && value(fr[i], fr[i + 1], fr[i + 2]) >= 0.25, `${id} ${s.frames[n].name}: an outline or a hole masked`); } });
  }
});

test('a square decodes a town sheet in the tools\' order: same names, same texels, so the same masks and fingerprint', async () => {
  for (const [w, f] of Object.entries(file.fighters)) {
    const id = Object.keys(f.sheets).find((k) => !k.endsWith('-combat')), s = await sheet(id);
    const { k, frames } = sheetFrames(id, await decodePng(bytes(id)), read(`art-lab/characters/exports/${id}.json`));
    assert.equal(k * 32, s.fw, `${w}: the frame's width`);
    assert.deepEqual(cast.namedTown(frames).map((q) => q.name), s.frames.map((q) => q.name), `${id}: the frames' names in order`);
    frames.forEach((q, n) => assert.deepEqual(q.rgba, s.frames[n].rgba, `${id} ${s.frames[n].name}: the texels`));
  }
});

test('the runtime: every sheet of the file owned by its fighter; recoloured only through the approval and a fixed variant, on a square, in a portrait and in a duel', async () => {
  for (const w of RIVALS) for (const id of SHEETS(w)) assert.equal(cast.fighterOfSheet(id), w, id);
  assert.equal(cast.fighterOfSheet('kell-x3-combat'), 'kell', 'the generic fighters\' file still read');
  for (const id of ['anwen-x2-v2', 'brann-x2-v2', 'artisan-x2-v1', 'hero-x2-v4', 'hero-x3-combat', 'marek-x2-v1']) assert.equal(cast.fighterOfSheet(id), null, id);
  for (const [w, f] of Object.entries(file.fighters)) for (const id of Object.keys(f.sheets)) {
    const s = await sheet(id), skin = cast.sheetSkin(id, s.frames, s.fw, s.fh);
    if (!file.approved || !f.fixed) assert.equal(skin, null, `${id}: no variant without an approved fixed one`);
    else { const n = s.frames.findIndex((q) => q.name.endsWith('idle.0')); assert.notDeepEqual(skin(n, s.frames[n].rgba), s.frames[n].rgba, `${id}: recoloured`); }
  }
  // a square: each person's entry carries the hook, which leaves a sheet without an approved variant as it is
  const entries = plaza.plazaCastEntries();
  for (const w of ['marek', 'vessa', 'orla', 'cassius', 'ilse']) {
    const e = entries.find((x) => x.replaces.includes(`person-${w}`));
    assert.equal(typeof e.tone, 'function', `${w}: the square's hook`);
    const id = `${w}-x2-v2`, { k, frames } = sheetFrames(id, await decodePng(bytes(id)), read(`art-lab/characters/exports/${id}.json`)), before = frames.map((q) => q.rgba);
    e.tone(frames, 32 * k, 48 * k);
    if (!file.approved || !file.fighters[w].fixed) frames.forEach((q, n) => assert.equal(q.rgba, before[n], `${id} ${n}: untouched`));
    else assert.ok(frames.some((q, n) => q.rgba !== before[n]), `${id}: recoloured on the square`);
  }
  assert.ok(!entries.some((x) => x.replaces.includes('person-rhosk') || x.replaces.includes('person-tobin')), 'Rhosk and Tobin stand on no square (« Portrait seulement »)');
  assert.equal(entries.find((x) => x.replaces.includes('player')).tone, undefined, 'the hero keeps his sheet (his customisation: a task of its own)');
  // today's game: its cast entries carry no hook (the district, the quay, the default game's portraits)
  for (const e of baked.castEntries(false)) assert.equal(e.tone, undefined, `${e.manifest.id}: no hook in today's cast`);
  // the portraits: a hook on every rival and generic face
  const faces = plaza.plazaFaces();
  for (const w of [...RIVALS, 'aldric', 'corra', 'ambrose', 'lucan', 'piers', 'kell']) assert.equal(typeof faces[w].face, 'function', `${w}: the portrait's hook`);
  for (const w of RIVALS) {
    const id = `${w}-x2-v2`, { k, frames } = sheetFrames(id, await decodePng(bytes(id)), read(`art-lab/characters/exports/${id}.json`));
    const face = faces[w].face(frames, 32 * k, 48 * k);
    if (!file.approved || !file.fighters[w].fixed) assert.equal(face, null, `${w}: the portrait keeps its texels`);
    else { const front = frames.find((q) => q.dir === 'down' && q.anim === 'idle' && q.i === 0); assert.ok(face instanceof Uint8Array && face.length === front.rgba.length, `${w}: a recoloured front frame`); assert.notDeepEqual(face, front.rgba, `${w}: the portrait under its skin`); }
  }
  // the duel: CombatCast recolours every combat sheet but Ren's through FighterSkinCast (its sources are loaded in the browser only: read on the source)
  const cc = fs.readFileSync(path.join(ROOT, 'src/arena/CombatCast.ts'), 'utf8');
  assert.match(cc, /import \{ sheetSkin \} from '\.\.\/characters\/FighterSkinCast'/);
  assert.match(cc, /skin = id\.startsWith\('hero-'\) \? heroSheetLook\(id, frames, fw, fh\) : sheetSkin\(id, frames, fw, fh\)/, 'a rival\'s combat sheet through its skin');
  assert.match(cc, /\.\.\.\(await skinOf\(id, bytes, meta\)\)/, 'every duel sheet through skinOf');
});

test('a square\'s cast as the page loads it (loadProductionCast with the squares\' entries): a rival with a fixed variant under its skin, the others as their export', async () => {
  const real = globalThis.fetch;
  globalThis.fetch = async (url) => new Response(fs.readFileSync(path.join(ROOT, decodeURIComponent(String(url)).replace(/[?#].*$/, '').replace(/^\//, ''))));
  try {
    const { sheets } = await baked.loadProductionCast(false, 'approved', undefined, plaza.plazaCastEntries());
    for (const w of ['marek', 'vessa', 'orla', 'cassius', 'ilse']) {
      const id = `${w}-x2-v2`, got = sheets.find((s) => s.id === id), plain = sheetFrames(id, await decodePng(bytes(id)), read(`art-lab/characters/exports/${id}.json`)).frames;
      assert.ok(got, `${id}: on the square`);
      const changed = got.frames.filter((q, n) => !Buffer.from(q.rgba).equals(Buffer.from(plain[n].rgba))).length;
      if (file.approved && file.fighters[w].fixed) assert.ok(changed > 0, `${id}: under its skin on the square`); else assert.equal(changed, 0, `${id}: as its export`);
    }
  } finally { globalThis.fetch = real; }
});

test('the operator choices (journal Passe RS1): Marek dark, Orla and Rhosk medium, Cassius tan in production; Vessa, Ilse and Tobin their original', () => {
  assert.equal(file.approved, true);
  assert.equal(file.approval.by, 'operator (git user wonmii)');
  assert.equal(file.approval.date, '2026-11-08');
  for (const c of ['Marek « Foncée (dark) »', 'Vessa « Garder l’original »', 'Orla « Moyenne (medium) »', 'Cassius « Hâlée (tan) »', 'Ilse « Garder l’original »', 'Rhosk « Moyenne (medium) »', 'Tobin « Garder l’original »', 'RS-PROD « En production »', '« Il faudra aussi effectuer des variants de peau des combattants principaux »']) assert.ok(file.approval.note.includes(c), c);
  const shown = Object.fromEntries(Object.entries(file.fighters).map(([w, f]) => [w, f.fixed ? f.variants[f.fixed - 1] : null]));
  assert.deepEqual(shown, { marek: 'dark', vessa: null, orla: 'medium', cassius: 'tan', ilse: null, rhosk: 'medium', tobin: null });
  // only the variant shown: a fighter keeping its original has no candidate left, no fingerprint (nothing is applied, nothing to check)
  for (const [w, f] of Object.entries(file.fighters)) {
    assert.equal(f.variants.length, f.fixed ? 1 : 0, `${w}: its variants`);
    for (const [id, sv] of Object.entries(f.sheets)) assert.equal(!!sv.fingerprint, !!f.fixed, `${id}: a fingerprint exactly when a variant is applied`);
  }
});
