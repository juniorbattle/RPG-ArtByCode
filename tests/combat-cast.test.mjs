// The casting's combat sheets (journal Passe CX1; the casting's decisions X1 « Les sept rivaux », X3 « Ren seul, avant Marek », X4, X5): each rival's sheet at x3 from its own figure, the
// frames of the § 14 list it needs, on its town sheet's palette, in cells the page of the duel can hold beside Ren's; how the duel reads a rival's skills and Ren's charge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';
import { decodePng } from '../tools/art-lab/png.mjs';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel));
const json = (rel) => JSON.parse(read(rel).toString('utf8'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
const K = 3, CW = 64 * K, CH = 96 * K, FOOT = 90 * K;
const sheets = await load('/src/arena/CombatSheets.ts');
const duel = await load('/src/combat/v2duel.ts');
const art = await load('/src/arena/FighterArt.ts');
/** the § 14 list: every fighter's clips, then what a rival's own defence and skills add */
const BASE = { idle: 2, ready: 2, strike: 3, heavy: 4, hit: 2, recover: 2, ko: 3, victory: 2 };
const FAMILY = { offensive: ['skillOff', 4], defensive: ['skillDef', 3], support: ['skillSup', 3] };
const expected = (foe) => {
  const F = duel.V2_FOES[foe], out = { ...BASE };
  if (F.defense?.guard) out.block = 2;
  if (F.defense?.dodge) out.dodge = 2;
  for (const k of F.skills.list) { const [clip, n] = FAMILY[duel.FOE_SKILLS[k.id].family]; out[clip] = n; }
  return out;
};
/** the sheets made so far, in the order X2 */
const RIVALS = ['marek', 'vessa', 'orla', 'cassius', 'ilse', 'rhosk', 'tobin'].filter((r) => fs.existsSync(path.join(ROOT, `art-lab/characters/exports/${r}-x3-combat.png`)));
/** the version 2's generic fighters (journal Passes EVL3, GA2, GA3): each fights on a rival's profile, so its sheet holds that rival's clips; its town sheet is its own -x2-v1.
 *  The three of journal Passe GA3 (GA-P1 to GA-P3) approved on the operator's lot sheet of journal Passe GA4; a candidate (none today) is held to the same contract and loaded by nothing */
const GENERIC = { aldric: 'ilse', corra: 'orla', ambrose: 'cassius', lucan: 'marek', piers: 'vessa', kell: 'tobin' }, GEN = Object.keys(GENERIC);
const CANDIDATES = [], PROD_GEN = GEN.filter((g) => !CANDIDATES.includes(g));
const kitOf = (id) => GENERIC[id] ?? id, townOf = (id) => (id === 'hero' ? 'hero-x2-v4' : GENERIC[id] ? `${id}-x2-v1` : `${id}-x2-v2`);

test('the page of a duel holds Ren and any rival: 80 cells of 255 rows, the same pixels, the feet where they were', () => {
  assert.deepEqual(sheets.SHEET_FRAME, { w: 64, h: 85, foot: 79 });
  assert.equal(sheets.SHEET_FRAME.h - sheets.SHEET_FRAME.foot, art.CELL_H - art.CELL_FOOT, 'the feet keep their distance to the bottom of the quad');
  const rows = (art.CELL_H - sheets.TRIM) * K, perPage = Math.floor(2048 / CW) * Math.floor(2048 / rows);
  assert.equal(perPage, 80);
  const ren = json('art-lab/characters/exports/hero-x3-combat.json').frames.length;
  assert.equal(ren, 39, 'Ren, the charge poses included');
  for (const r of ['marek', 'vessa', 'orla', 'cassius', 'ilse', 'rhosk', 'tobin', ...GEN]) assert.ok(ren + Object.values(expected(kitOf(r))).reduce((a, b) => a + b) <= perPage, r);
});

test('§ 14\'s counts per rival: Vessa and Cassius 34, Marek, Ilse and Rhosk 32, Orla 29, Tobin 27', () => {
  const n = (r) => Object.values(expected(r)).reduce((a, b) => a + b);
  assert.deepEqual(['vessa', 'cassius', 'marek', 'ilse', 'rhosk', 'orla', 'tobin'].map(n), [34, 34, 32, 32, 32, 29, 27]);
});

test('every combat sheet: its frames, the arena cell, the frame contract, nothing in the rows the page cuts, its town sheet\'s palette only (and the steel its rig declares)', async () => {
  for (const id of ['hero', ...RIVALS, ...GEN]) {
    const name = `${id}-x3-combat`, meta = json(`art-lab/characters/exports/${name}.json`), img = decodePng(read(`art-lab/characters/exports/${name}.png`));
    if (id !== 'hero') {
      const tags = Object.fromEntries(meta.meta.frameTags.map((t) => [t.name, t.to - t.from + 1]));
      assert.deepEqual(tags, Object.fromEntries(Object.entries(expected(kitOf(id))).map(([k, n]) => [`${k}-side`, n])), `${id}: the clips of its own kit`);
    }
    const pal = new Set(), ref = decodePng(read(`art-lab/characters/exports/${townOf(id)}.png`));
    for (let i = 0; i < ref.rgba.length; i += 4) if (ref.rgba[i + 3]) pal.add(`${ref.rgba[i]},${ref.rgba[i + 1]},${ref.rgba[i + 2]}`);
    const rig = await import(new URL(`../art-lab/characters/rigs/${name}.rig.mjs`, import.meta.url).href);
    for (const c of rig.EXTRA ?? []) pal.add(c.join(','));
    for (const f of meta.frames) {
      assert.equal(f.sourceSize.w, CW); assert.equal(f.sourceSize.h, CH);
      const r = f.frame; let last = -1, ring = 0, semi = 0, off = 0, high = 0;
      for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
        const i = ((r.y + y) * img.W + r.x + x) * 4, a = img.rgba[i + 3];
        if (a && a !== 255) semi++; if (a < 128) continue;
        last = y; if (!x || !y || x === CW - 1 || y === CH - 1) ring++;
        if (y < sheets.TRIM * K) high++;
        if (!pal.has(`${img.rgba[i]},${img.rgba[i + 1]},${img.rgba[i + 2]}`)) off++;
      }
      assert.equal(semi, 0, `${f.filename}: binary alpha`); assert.equal(ring, 0, `${f.filename}: transparent ring`); assert.equal(high, 0, `${f.filename}: above the cut`);
      assert.equal(last, FOOT, `${f.filename}: on the foot row`); assert.equal(off, 0, `${f.filename}: its palette only`);
    }
  }
});

test('a rival\'s sheet is its own: its pack as hashed, its sources archived and approved through it, on its town sheet\'s palette', async () => {
  for (const id of [...RIVALS, ...GEN]) {
    const name = `${id}-x3-combat`, m = json(`art-lab/characters/manifests/${name}.manifest.json`), files = json(`art-lab/characters/provenance/${name}/PROVENANCE.json`).files;
    for (const [rel, want] of Object.entries(files)) {
      let b = read(rel); if (/\.(json|mjs|js|ts|md|txt)$/i.test(rel)) b = Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
      assert.equal(sha(b), want, rel);
    }
    const cand = CANDIDATES.includes(id);
    assert.equal(m.runtimeUse, cand ? 'lab' : 'production', name);
    const rig = await import(new URL(`../art-lab/characters/rigs/${name}.rig.mjs`, import.meta.url).href);
    assert.equal(rig.PALETTE.path, `art-lab/characters/exports/${townOf(id)}.png`);
    for (const s of Object.values(rig.SHEETS)) {
      assert.equal(sha(read(s.path)), s.sha256, s.path);
      // (a candidate's sources are approved only through its sheets, on the operator's lot sheet)
      if (!cand) assert.match(json(s.path.replace(/\.png$/, '.source.json')).status, /APPROVED AS A SOURCE/, s.path);
    }
  }
});

test('the body moved by the cell is written with the sheet, frame by frame, and matches what its build measured', () => {
  for (const id of ['hero', ...RIVALS, ...GEN]) {
    const name = `${id}-x3-combat`, pushed = json(`art-lab/characters/exports/${name}.json`).meta.pushed, build = json(`art-lab/characters/provenance/${name}/build.json`);
    assert.ok(pushed && typeof pushed === 'object', name);
    const moved = Object.values(build.placement).filter((p) => p.pushed).length;
    assert.ok(Object.keys(pushed).length >= moved - 1, `${name}: ${Object.keys(pushed).length} of ${moved}`);
    for (const [frame, n] of Object.entries(pushed)) { assert.match(frame, /^[a-zA-Z]+\.\d$/); assert.ok(Number.isInteger(n) && n !== 0, frame); }
  }
});

test('the seven rivals, the generic fighters and Ren in production: approved one by one, each a sheet CombatCast loads, none of them anywhere else', async () => {
  const src = read('src/arena/CombatCast.ts').toString('utf8');
  assert.equal(RIVALS.length, 7, 'every rival of the casting has its sheet');
  for (const glob of src.match(/\{[a-z]+,[a-z,]+\}-x3-combat/g)) assert.deepEqual(glob.slice(1, glob.indexOf('}')).split(',').sort(), ['hero', ...RIVALS, ...PROD_GEN].sort(), glob);
  // the oracle's profiles are the game's (src/narrative/generics.ts), and their faces are the portraits' (src/characters/PlazaCast.ts)
  const { GENERICS } = await load('/src/narrative/generics.ts');
  assert.deepEqual(Object.fromEntries(Object.entries(GENERICS).map(([k, g]) => [k, g.profile])), GENERIC);
  const plaza = read('src/characters/PlazaCast.ts').toString('utf8');
  assert.match(plaza, /\{aldric,corra,ambrose,lucan,piers,kell\}-x2-v1\.png/); assert.match(plaza, /export const GENERIC_FACES = \['aldric', 'corra', 'ambrose', 'lucan', 'piers', 'kell'\]/);
  for (const id of PROD_GEN) { const m = json(`art-lab/characters/manifests/${id}-x2-v1.manifest.json`); assert.equal(m.runtimeUse, 'production', id); assert.ok(m.approval?.note.includes('Production'), id); }
  // the candidates (journal Passe GA3): neither approved nor loaded; their manifests and packs say so
  for (const id of CANDIDATES) for (const sheet of [`${id}-x2-v1`, `${id}-x3-combat`]) {
    const m = json(`art-lab/characters/manifests/${sheet}.manifest.json`);
    assert.equal(m.approved, false, sheet); assert.equal(m.runtimeUse, 'lab', sheet); assert.equal(m.status, 'candidate', sheet);
    assert.match(json(`art-lab/characters/provenance/${sheet}/PROVENANCE.json`).status, /^CANDIDATE/, sheet);
    assert.ok(!src.includes(id) && !plaza.includes(id), `${sheet}: loaded by nothing`);
  }
  assert.equal((src.match(/import\.meta\.glob\(/g) ?? []).length, 4);
  for (const id of ['hero', ...RIVALS, ...PROD_GEN]) {
    const m = json(`art-lab/characters/manifests/${id}-x3-combat.manifest.json`);
    assert.equal(m.approved, true, id); assert.equal(m.runtimeUse, 'production', id); assert.equal(m.status, 'approved', id);
    assert.ok(m.approval?.note.includes('Production') || m.approval?.note.includes('Approuvées'), `${id}: the operator's word`);
    assert.match(json(`art-lab/characters/provenance/${id}-x3-combat/PROVENANCE.json`).status, /APPROVED PRODUCTION ASSET/, id);
  }
  // a rival's frames stand on its own seat: the arena's duel asks nothing of Marek's generated clips once a sheet is installed (tools/arena-sheet-proof.mjs proves it in the page)
  assert.match(read('src/arena/CombatSheets.ts').toString('utf8'), /const FALLBACK = /);
});

test('the sheets in the arena\'s light: the operator\'s CX-L1 « 0,65 » by day, CX-L2 « 1,3 » at night', () => {
  assert.deepEqual([null, 'night', 'morning', 'midday', 'afternoon'].map(sheets.shadeFor), [1.3, 1.3, 0.65, 0.65, 0.65]);
});

test('Ren\'s charge: low while a release would be the light attack, high from the first skill\'s tier on, the guard over both, each at § 14\'s rate', () => {
  const cf = sheets.chargeFrame;
  assert.equal(cf(true, 0, 0.1), 'chargeGuard.0'); assert.equal(cf(true, 4, 3), 'chargeGuard.0');
  // tier 0 the light attack: low; two frames over 0.8 s
  assert.deepEqual([0, 0.39, 0.4, 0.79, 0.8].map((t) => cf(false, 0, t)), ['charge.0', 'charge.0', 'charge.1', 'charge.1', 'charge.0']);
  // the first tier is a skill's since the heavy attack became one (journal Passe CH1): high; two frames over 0.6 s
  assert.equal(cf(false, 1, 0), 'chargeHi.0');
  assert.deepEqual([0, 0.29, 0.31, 0.59, 0.61].map((t) => cf(false, 2, t)), ['chargeHi.0', 'chargeHi.0', 'chargeHi.1', 'chargeHi.1', 'chargeHi.0']);
});

test('a rival\'s skill plays its family\'s clip under the heavy\'s, the guard\'s or the stance\'s name, on the table of § 14', () => {
  const sf = sheets.sheetFrame;
  // Iron Fall: no preparation, impact at 1.15 s
  const off = (t) => sf('heavy.1', { name: 'heavy', t, impactAt: 1.15, dur: 1.39 }, false, 'skillOff');
  assert.deepEqual([0, 0.57, 0.58, 1.1, 1.12, 1.26, 1.27].map(off), ['skillOff.0', 'skillOff.0', 'skillOff.1', 'skillOff.1', 'skillOff.2', 'skillOff.2', 'skillOff.3']);
  // Iron Gate and a boost: 0 until the impact, 1 through the follow-through, 2 in the recovery
  const fam = (family, name) => [0, 0.29, 0.31, 0.53, 0.55].map((t) => sf(`${name}.0`, { name, t, impactAt: 0.3, dur: 0.54 }, false, family));
  assert.deepEqual(fam('skillDef', 'block'), ['skillDef.0', 'skillDef.0', 'skillDef.1', 'skillDef.1', 'skillDef.2']);
  assert.deepEqual(fam('skillSup', 'ready'), ['skillSup.0', 'skillSup.0', 'skillSup.1', 'skillSup.1', 'skillSup.2']);
  // the duel over: the frame the duel chose (its victory), whatever the last skill
  assert.equal(sf('victory.1', { name: 'heavy', t: 1, impactAt: 1.15 }, true, 'skillOff'), 'victory.1');
  // no family: the clip's own frame
  assert.equal(sf('heavy.2', { name: 'heavy', t: 0.8, impactAt: 0.75 }, false), 'heavy.2');
  assert.deepEqual(sheets.FAMILY_CLIP, { offensive: 'skillOff', defensive: 'skillDef', support: 'skillSup' });
});
