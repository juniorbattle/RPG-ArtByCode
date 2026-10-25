// Ren's first combat sheet (journal Passe RC1; the operator's decisions AA2-1 « ×3 », « Génération (Recommandé) », « Clés hors C2
// (Recommandé) »): a lab asset that never reaches the cast, drawn in the arena's cells at x3 on the production hero's palette, holding the
// CB-2 keys outside the C2 trial (briefs/combat-system.md § 14), its generated sources archived; the arena reads it only through the DEV
// module of the density trial, which lends its frames to the clips it does not draw and plays the knockout's three frames.
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
/** the CB-2 list for the keys the C2 trial does not touch, written from the table of briefs/combat-system.md § 14 */
const KEYS = { idle: 2, ready: 2, strike: 3, heavy: 4, block: 2, hit: 2, recover: 2, ko: 3, victory: 2 };
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
  assert.equal(Object.keys(rig.SHEETS).length, 3);
  for (const s of Object.values(rig.SHEETS)) {
    assert.equal(sha(read(s.path)), s.sha256, s.path);
    const rec = json(s.path.replace(/\.png$/, '.source.json'));
    assert.equal(rec.sha256, s.sha256, `${s.path}: its record`);
    assert.match(rec.status, /NON-CANONICAL/, `${s.path}: non-canonical`);
  }
  assert.equal(sha(read(rig.PALETTE.path)), rig.PALETTE.sha256, 'the pinned palette');
});

test('its frames: the CB-2 keys outside C2, the arena cell at x3, the frame contract, the hero\'s palette only', () => {
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

test('the duel finds every frame it asks Ren for: the sheet\'s clips, or the frames the DEV module lends', () => {
  const ren = art.CLIPS.ren;
  for (const [clip, c] of Object.entries(ren)) {
    if (KEYS[clip] !== undefined) { assert.equal(c.frames.length, clip === 'ko' ? 2 : KEYS[clip], `${clip}: the duel's clip`); continue; }
    const from = lab.COMBAT.borrow[clip];
    assert.ok(from && KEYS[from] >= 1, `${clip} borrows a clip of the sheet`);
  }
  // the knockout: three frames on their own clock (§ 14: fall t < 0.25, on one knee t < 0.6, on the ground)
  assert.deepEqual([0, 0.2, 0.3, 0.59, 0.6, 3].map(lab.koFrame), [0, 0, 1, 1, 2, 2]);
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

test('the arena still reaches the combat sheet only through the DEV-guarded trial module', () => {
  for (const f of fs.readdirSync(path.join(ROOT, 'src'), { recursive: true }).filter((f) => /\.ts$/.test(f) && !f.startsWith('lab'))) {
    assert.ok(!read(`src/${f}`).toString('utf8').includes(ID), `src/${f} does not name the combat sheet`);
  }
});
