// Ren's combat sheet (journal Passes RC1 and RC2; the operator's decisions AA2-1 « ×3 », « Génération (Recommandé) », RC1-1 « Bonne base :
// compléter après la fiche C2, avec les reprises », C2-7 « En arrière », C2-10 « Les garder », « Règle du rendu (Recommandé) »): a lab asset
// that never reaches the cast, drawn in the arena's cells at x3 on the production hero's palette, holding the 34 frames of the CB-2 list
// (briefs/combat-system.md § 14), every blade at two texels of steel and a dark edge, its generated sources archived; the arena reads it only through the DEV module,
// whose sheetFrame plays the sheet's own frames on every moment of the duel (no borrowed frame) and the knockout's three frames.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';
import { decodePng } from '../tools/art-lab/png.mjs';

const ID = 'hero-x3-combat';
const read = (rel) => fs.readFileSync(path.join(ROOT, rel));
const json = (rel) => JSON.parse(read(rel).toString('utf8'));
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');
/** the CB-2 list, written from the table of briefs/combat-system.md § 14 (34 frames) */
const KEYS = { idle: 2, ready: 2, strike: 3, heavy: 4, skillOff: 4, skillDef: 3, skillSup: 3, block: 2, dodge: 2, hit: 2, recover: 2, ko: 3, victory: 2 };
/** the figure each frame of the sheet is made of, where the rig draws it from a figure (the other frames are its breath or its blow), read
 *  from the rig's recipe: the blade test reads the blade there */
const FIGURE_OF = {
  'idle-side.0': 'idle', 'ready-side.0': 'ready', 'strike-side.0': 'windup', 'strike-side.1': 'cut', 'strike-side.2': 'follow',
  'heavy-side.0': 'gather', 'heavy-side.1': 'raise', 'heavy-side.2': 'cleave', 'heavy-side.3': 'through',
  'skillOff-side.0': 'lungePrep', 'skillOff-side.1': 'surge', 'skillOff-side.2': 'thrust', 'skillOff-side.3': 'lungeBack',
  'skillDef-side.0': 'wardPrep', 'skillDef-side.1': 'ward', 'skillDef-side.2': 'wardBack', 'skillSup-side.0': 'fervourPrep', 'skillSup-side.1': 'cry',
  'skillSup-side.2': 'fervourBack', 'block-side.0': 'guard', 'dodge-side.0': 'hop', 'dodge-side.1': 'land', 'hit-side.0': 'recoil', 'hit-side.1': 'recovery',
  'recover-side.0': 'stunned', 'ko-side.0': 'fall', 'ko-side.1': 'kneel', 'ko-side.2': 'ground', 'victory-side.0': 'victory',
};
/** the arena cell (FighterArt: 64 x 96 town pixels, feet on row 90) at x3 */
const K = 3, CW = 64 * K, CH = 96 * K, FOOT = 90 * K;
const cast = await load('/src/characters/BakedCast.ts');
const art = await load('/src/arena/FighterArt.ts');
const lab = await load('/src/lab/fighterDensity.ts');
const meta = json(`art-lab/characters/exports/${ID}.json`);
const img = decodePng(read(`art-lab/characters/exports/${ID}.png`));

test('the combat sheet is a lab asset, unapproved, outside the cast, every file of its pack as hashed', () => {
  const m = json(`art-lab/characters/manifests/${ID}.manifest.json`);
  assert.equal(m.runtimeUse, 'lab'); assert.equal(m.approved, false); assert.equal(m.status, 'experimental');
  const ids = [...cast.castEntries(false), ...cast.castEntries(true)].map((e) => e.manifest.id);
  assert.ok(!ids.includes(ID), 'not a cast entry, candidates included');
  const files = json(`art-lab/characters/provenance/${ID}/PROVENANCE.json`).files;
  assert.ok(Object.keys(files).length >= 12, 'the pack lists its files');
  for (const [rel, want] of Object.entries(files)) {
    let b = read(rel); if (/\.(json|mjs|js|ts|md|txt)$/i.test(rel)) b = Buffer.from(b.toString('utf8').replace(/\r\n/g, '\n'), 'utf8');
    assert.equal(sha(b), want, rel);
  }
});

test('its generated sources are archived, non-canonical, and are the files the rig reads', async () => {
  const rig = await import(new URL(`../art-lab/characters/rigs/${ID}.rig.mjs`, import.meta.url).href);
  assert.equal(Object.keys(rig.SHEETS).length, 10, 'a1, a2, b2 (Passe RC1), c1, c2, d1, d2, e1, e2, f2 (Passe RC2)');
  for (const s of Object.values(rig.SHEETS)) {
    assert.equal(sha(read(s.path)), s.sha256, s.path);
    const rec = json(s.path.replace(/\.png$/, '.source.json'));
    assert.equal(rec.sha256, s.sha256, `${s.path}: its record`);
    assert.match(rec.status, /NON-CANONICAL/, `${s.path}: non-canonical`);
  }
  assert.equal(sha(read(rig.PALETTE.path)), rig.PALETTE.sha256, 'the pinned palette');
});

test('its frames: the 34 of the CB-2 list, the arena cell at x3, the frame contract, the hero\'s palette only', () => {
  const tags = Object.fromEntries(meta.meta.frameTags.map((t) => [t.name, t.to - t.from + 1]));
  assert.deepEqual(tags, Object.fromEntries(Object.entries(KEYS).map(([k, n]) => [`${k}-side`, n])));
  assert.equal(meta.frames.length, Object.values(KEYS).reduce((a, b) => a + b));
  const pal = new Set(), ref = decodePng(read('art-lab/characters/exports/hero-x2-v4.png'));
  for (let i = 0; i < ref.rgba.length; i += 4) if (ref.rgba[i + 3]) pal.add(`${ref.rgba[i]},${ref.rgba[i + 1]},${ref.rgba[i + 2]}`);
  for (const f of meta.frames) {
    assert.equal(f.sourceSize.w, CW); assert.equal(f.sourceSize.h, CH);
    const r = f.frame; let last = -1, ring = 0, semi = 0, off = 0;
    for (let y = 0; y < CH; y++) for (let x = 0; x < CW; x++) {
      const i = ((r.y + y) * img.W + r.x + x) * 4, a = img.rgba[i + 3];
      if (a && a !== 255) semi++; if (a < 128) continue;
      last = y; if (!x || !y || x === CW - 1 || y === CH - 1) ring++;
      if (!pal.has(`${img.rgba[i]},${img.rgba[i + 1]},${img.rgba[i + 2]}`)) off++;
    }
    assert.equal(semi, 0, `${f.filename}: binary alpha`); assert.equal(ring, 0, `${f.filename}: transparent ring`);
    assert.equal(last, FOOT, `${f.filename}: on the foot row`); assert.equal(off, 0, `${f.filename}: colours of hero-x2-v4 only`);
  }
});

test('every frame the duel asks Ren for is the sheet\'s own: its clips, today\'s techniques as the offensive family, no borrowed frame', () => {
  assert.equal(lab.COMBAT.borrow, undefined, 'the borrowed frames of Passe RC1 are gone');
  const ren = art.CLIPS.ren;
  for (const [clip, c] of Object.entries(ren)) {
    // § 14: `skill` becomes `skillOff`; Tourbillon's `slash` becomes an offensive skill
    if (clip === 'skill' || clip === 'slash') { assert.equal(lab.COMBAT.renamed[clip], 'skillOff', clip); continue; }
    assert.ok(KEYS[clip] !== undefined, `${clip}: a clip of the sheet`);
    assert.equal(c.frames.length, clip === 'ko' ? 2 : KEYS[clip], `${clip}: the duel's clip`);
  }
  assert.deepEqual(lab.SKILL_FRAMES, { skillOff: 4, skillDef: 3, skillSup: 3 });
  // the knockout: three frames on their own clock (§ 14: fall t < 0.25, on one knee t < 0.6, on the ground)
  assert.deepEqual([0, 0.24, 0.25, 0.26, 0.59, 0.6, 3].map(lab.koFrame), [0, 0, 1, 1, 1, 2, 2]);
});

test('sheetFrame cuts the skills as § 14 does, against an oracle written from its table', () => {
  const sf = lab.sheetFrame;
  // today's Estocade (no preparation, impact 0.24 s): the first half of the run-up, the surge, the strike until 0.36 s, the follow-through
  const est = (t) => sf('skill.0', { name: 'skill', t, impactAt: 0.24 }, false);
  assert.deepEqual([0, 0.11, 0.12, 0.19, 0.2, 0.35, 0.36, 0.5].map(est), ['skillOff.0', 'skillOff.0', 'skillOff.1', 'skillOff.1', 'skillOff.2', 'skillOff.2', 'skillOff.3', 'skillOff.3']);
  // today's Tourbillon (impact 0.2 s): the same family
  assert.deepEqual([0.05, 0.13, 0.25, 0.4].map((t) => sf('slash.1', { name: 'slash', t, impactAt: 0.2 }, false)), ['skillOff.0', 'skillOff.1', 'skillOff.2', 'skillOff.3']);
  // the new rules' Estocade: the preparation (0.7 s) held, impact at 0.94 s
  const dyn = (t) => sf('skill.0', { name: 'skillOff', t, prep: 0.7, impactAt: 0.94 }, false);
  assert.deepEqual([0, 0.69, 0.71, 0.89, 0.91, 1.05, 1.07].map(dyn), ['skillOff.0', 'skillOff.0', 'skillOff.1', 'skillOff.1', 'skillOff.2', 'skillOff.2', 'skillOff.3']);
  // Rampart (dynamicView shows the guard) and Fervour (the raised blade): their own families, 0 until the impact, 1 through the follow-through
  // (the animation's end, impact + follow), 2 in the recovery; an animation without its end: the effect for 0.12 s
  assert.deepEqual([0, 0.39, 0.41, 0.59, 0.61, 0.69].map((t) => sf('block.0', { name: 'skillDef', t, dur: 0.6, prep: 0.3, impactAt: 0.4 }, false)), ['skillDef.0', 'skillDef.0', 'skillDef.1', 'skillDef.1', 'skillDef.2', 'skillDef.2']);
  assert.deepEqual([0.2, 0.61, 0.79, 0.81].map((t) => sf('victory.1', { name: 'skillSup', t, dur: 0.8, prep: 0.5, impactAt: 0.6 }, false)), ['skillSup.0', 'skillSup.1', 'skillSup.1', 'skillSup.2']);
  assert.deepEqual([0.41, 0.51, 0.53].map((t) => sf('block.0', { name: 'skillDef', t, prep: 0.3, impactAt: 0.4 }, false)), ['skillDef.1', 'skillDef.1', 'skillDef.2']);
  // the duel over: its victory, whatever the last skill; every other clip frame for frame; no animation: the duel's frame
  assert.equal(sf('victory.1', { name: 'skillSup', t: 0.7, impactAt: 0.6 }, true), 'victory.1');
  for (const c of ['idle.1', 'ready.0', 'strike.2', 'heavy.3', 'block.1', 'dodge.0', 'hit.1', 'recover.1', 'victory.0']) assert.equal(sf(c, { name: c.split('.')[0], t: 0.3, impactAt: 0.2 }, false), c);
  assert.equal(sf('skill.1', null, false), 'skill.1');
});

test('every blade at two texels of steel and a dark edge: the two light lines along the pinned segment, the dark one beyond', async () => {
  const rig = await import(new URL(`../art-lab/characters/rigs/${ID}.rig.mjs`, import.meta.url).href);
  assert.deepEqual(Object.keys(rig.BLADES).sort(), Object.keys(rig.FIGURES).sort(), 'one blade per figure');
  assert.deepEqual(Object.values(FIGURE_OF).sort(), Object.keys(rig.FIGURES).sort(), 'every figure in the sheet');
  const at = (r, x, y) => { const i = ((r.y + y) * img.W + r.x + x) * 4; return img.rgba[i + 3] ? [img.rgba[i], img.rgba[i + 1], img.rgba[i + 2]].join(',') : null; };
  const L = rig.STEEL.light.join(','), L2 = rig.STEEL.light2.join(','), E = rig.STEEL.edge.join(',');
  for (const t of meta.meta.frameTags) for (let k = t.from; k <= t.to; k++) {
    const name = FIGURE_OF[`${t.name}.${k - t.from}`]; if (!name) continue;
    const [h, p] = rig.BLADES[name], r = meta.frames[k].frame, n = Math.max(Math.abs(p[0] - h[0]), Math.abs(p[1] - h[1])), flat = Math.abs(p[0] - h[0]) >= Math.abs(p[1] - h[1]);
    const [ox, oy] = flat ? [0, 1] : [1, 0];
    let core = 0, second = 0, edge = 0, pts = 0;
    for (let i = 2; i < n - 1; i++) {
      const x = Math.round(h[0] + ((p[0] - h[0]) * i) / n), y = Math.round(h[1] + ((p[1] - h[1]) * i) / n);
      pts++; if (at(r, x, y) === L) core++; if (at(r, x + ox, y + oy) === L2) second++; if (at(r, x + 2 * ox, y + 2 * oy) === E) edge++;
    }
    assert.ok(core >= 0.8 * pts, `${name}: light steel on ${core} of ${pts} texels of the blade`);
    assert.ok(second >= 0.7 * pts, `${name}: the second light on ${second} of ${pts}`);
    assert.ok(edge >= 0.6 * pts, `${name}: the dark edge on ${edge} of ${pts}`);
  }
});

test('the painted rim lights only the silhouette\'s border texels, never the inside or the alpha', () => {
  const W = 12, H = 14, px = new Uint8Array(W * H * 4);
  for (let y = 2; y <= 11; y++) for (let x = 3; x <= 8; x++) { const i = (y * W + x) * 4; px[i] = 40; px[i + 1] = 30; px[i + 2] = 20; px[i + 3] = 255; }
  const before = Uint8Array.from(px), n = lab.paintRim(px, W, H);
  assert.ok(n > 0);
  let changed = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4, inside = x > 3 && x < 8 && y > 2 && y < 11;
    assert.equal(px[i + 3], before[i + 3], 'alpha untouched');
    if (px[i] !== before[i] || px[i + 1] !== before[i + 1] || px[i + 2] !== before[i + 2]) { changed++; assert.ok(!inside && before[i + 3], `(${x}, ${y}) is a border texel`); }
  }
  assert.equal(changed, n);
  // the bottom row (the feet on the ground) is never lit
  for (let x = 0; x < W; x++) { const i = (11 * W + x) * 4; assert.equal(px[i], before[i], `(${x}, 11)`); }
});

test('the edge by the day state (RC1-2 « Liseré peint la nuit, contour noir de jour »), and only the combat sheet left (RC1-4)', async () => {
  assert.deepEqual([null, 'night', 'morning', 'midday', 'afternoon', 'day'].map(lab.edgeFor), ['painted', 'painted', 'dark', 'dark', 'dark', 'dark']);
  for (const d of ['x2', 'x3', 'x4', '']) await assert.rejects(lab.installFighterDensity({}, new URLSearchParams(`fighterdensity=${d}`)), /fighterdensity/, d);
  for (const id of ['hero-x3-trial', 'hero-x4-trial']) assert.ok(!fs.existsSync(path.join(ROOT, `art-lab/characters/manifests/${id}.manifest.json`)), `${id} removed`);
});

test('the arena reaches the combat sheet only through the DEV module, behind import.meta.env.DEV', () => {
  const src = read('src/arena/ArenaApp.ts').toString('utf8').split(/\r?\n/);
  const uses = src.filter((l) => /densityTrial|fighterDensity/.test(l) && !/^\s*(\/\/|\/\*\*|\*)/.test(l));
  assert.ok(uses.length >= 4, 'the module is wired');
  for (const l of uses) assert.ok(/import\.meta\.env\.DEV &&/.test(l) || /private declare densityTrial/.test(l), `unguarded: ${l.trim()}`);
  for (const f of fs.readdirSync(path.join(ROOT, 'src'), { recursive: true }).filter((f) => /\.ts$/.test(f) && !f.startsWith('lab'))) {
    const s = read(`src/${f}`).toString('utf8');
    assert.ok(!s.includes(ID), `src/${f} does not name the combat sheet`);
    if (f.replace(/\\/g, '/') !== 'arena/ArenaApp.ts') assert.ok(!/fighterDensity/.test(s), `src/${f} does not reach the DEV module`);
  }
});
