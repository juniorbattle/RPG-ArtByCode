// NPC variants (journal Passe V1, src/characters/Variants.ts): material masks from zones + colour rules, propagated to every frame by
// same-colour matching; the alpha encoding; the variant an actor shows (never from the RNG); the gate: an unapproved variants file changes
// nothing in production, an approved one must match the masks' fingerprints.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const V = await load('/src/characters/Variants.ts');
const cast = await load('/src/characters/BakedCast.ts');
const W = 64, H = 96;

/** a 64 x 96 frame with coloured blocks: [x0, y0, x1, y1, '#rrggbb'] (inclusive) */
function frame(dir, anim, i, blocks) {
  const rgba = new Uint8Array(W * H * 4);
  for (const [x0, y0, x1, y1, hex] of blocks) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const j = (y * W + x) * 4; rgba[j] = parseInt(hex.slice(1, 3), 16); rgba[j + 1] = parseInt(hex.slice(3, 5), 16); rgba[j + 2] = parseInt(hex.slice(5, 7), 16); rgba[j + 3] = 255;
  }
  return { dir, anim, i, rgba };
}
const SKIN = '#f0c2a4', LINEN = '#eedccb', HAIR = '#9a503a', OUTLINE = '#1a1418', CAP = '#46506e';
const at = (m, x, y) => m[y * W + x];

test('reference view: skin and hair only inside their zones and by colour; linen, outline, cap and excluded colours stay', () => {
  const ref = frame('down', 'idle', 0, [[20, 10, 40, 20, HAIR], [22, 21, 38, 30, SKIN], [10, 50, 14, 54, SKIN], [10, 45, 14, 49, LINEN], [20, 5, 40, 9, CAP], [21, 31, 37, 31, OUTLINE], [44, 50, 48, 54, SKIN]]);
  const s = { zones: { down: { hair: [[18, 4, 42, 22]], skin: [[20, 20, 40, 31, 0.1], [9, 44, 15, 55]] } } };
  const [m] = V.sheetMasks([ref], W, H, s);
  assert.equal(at(m, 30, 15), 1, 'hair in its zone');
  assert.equal(at(m, 30, 7), 0, 'a cool cap in the hair zone is not hair');
  assert.equal(at(m, 30, 25), 2, 'face');
  assert.equal(at(m, 12, 52), 2, 'hand');
  assert.equal(at(m, 12, 47), 0, 'linen next to the hand (saturation under 0.22)');
  assert.equal(at(m, 30, 31), 0, 'outline');
  assert.equal(at(m, 46, 52), 0, 'skin colour outside every zone');
  const [mx] = V.sheetMasks([ref], W, H, { ...s, exclude: [SKIN.slice(1)] });
  assert.equal(at(mx, 30, 25), 0, 'an excluded colour');
});

test('propagation: another frame of the facing takes the material of the nearest same-colour texel within 3, no further', () => {
  const ref = frame('side', 'idle', 0, [[20, 20, 30, 30, SKIN], [20, 10, 30, 19, HAIR]]);
  const moved = frame('side', 'walk', 1, [[22, 22, 32, 32, SKIN], [22, 12, 32, 21, HAIR], [50, 60, 52, 62, SKIN]]);
  const other = frame('down', 'walk', 0, [[20, 20, 30, 30, SKIN]]);
  const [, m, mo] = V.sheetMasks([ref, moved, other], W, H, { zones: { side: { hair: [[18, 8, 34, 20]], skin: [[18, 18, 34, 34]] } } });
  assert.equal(at(m, 32, 32), 2, 'shifted by 2: still skin');
  assert.equal(at(m, 32, 21), 1, 'shifted by 2: still hair');
  assert.equal(at(m, 51, 61), 0, 'the same colour 20 texels away: not matched');
  assert.equal(mo.every((v) => v === 0), true, 'a facing without zones: nothing');
});

test('fingerprints differ when one texel differs', () => {
  const m = new Uint8Array(W * H); m[0] = 1; m[1] = 2;
  const a = V.maskFingerprint([m]), m2 = Uint8Array.from(m); m2[5] = 1;
  assert.notEqual(a, V.maskFingerprint([m2]));
  assert.equal(a, V.maskFingerprint([Uint8Array.from(m)]));
});

test('variantOf: deterministic, in range, fixed per archetype wins (clamped)', () => {
  const seen = new Set();
  for (let id = 1; id < 200; id++) { const v = V.variantOf(id, 2); assert.ok(v >= 0 && v <= 2); assert.equal(v, V.variantOf(id, 2)); seen.add(v); }
  assert.deepEqual([...seen].sort(), [0, 1, 2], 'every variant is used');
  assert.equal(V.variantOf(7, 2, 1), 1);
  assert.equal(V.variantOf(7, 2, 9), 2);
  assert.equal(V.variantOf(7, 2, 0), 0);
});

test('materialRange and rampTable', () => {
  const f = frame('down', 'idle', 0, [[0, 0, 0, 0, '#000000'], [1, 0, 1, 0, '#ffffff']]), m = new Uint8Array(W * H); m[0] = 1; m[1] = 1;
  assert.deepEqual(V.materialRange([f], [m], 1), [0, 1]);
  assert.equal(V.materialRange([f], [m], 2), null);
  const t = V.rampTable({ ramps: { hair: { a: ['#000000'], b: ['#111111'] }, skin: { c: ['#222222'] } } });
  assert.deepEqual([t.hair, t.skin, t.rows.length], [{ a: 0, b: 1 }, { c: 2 }, 3]);
});

const file = JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/variants/variants.json'), 'utf8'));
const production = fs.readdirSync(path.join(ROOT, 'art-lab/characters/manifests')).filter((f) => f.endsWith('.manifest.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/manifests', f), 'utf8'))).filter((m) => m.runtimeUse === 'production').map((m) => m.id);

test('the variants file: production sheets only, every ramp exists, 5 stops each', () => {
  for (const r of [...Object.values(file.ramps.hair), ...Object.values(file.ramps.skin)]) { assert.equal(r.length, 5); for (const h of r) assert.match(h, /^#[0-9a-f]{6}$/); }
  for (const [id, s] of Object.entries(file.sheets)) {
    assert.ok(production.includes(id), id);
    for (const v of s.variants) { if (v.hair) assert.ok(file.ramps.hair[v.hair], `${id} ${v.hair}`); if (v.skin) assert.ok(file.ramps.skin[v.skin], `${id} ${v.skin}`); }
  }
  if (file.approved) assert.ok(file.approval?.by && file.approval?.date, 'an approved file names who and when');
});

async function withRepoFetch(fn) {
  const real = globalThis.fetch;
  globalThis.fetch = async (url) => new Response(fs.readFileSync(path.join(ROOT, decodeURIComponent(String(url)).replace(/[?#].*$/, '').replace(/^\//, ''))));
  try { return await fn(); } finally { globalThis.fetch = real; }
}

test('the gate: an unapproved file changes nothing; candidate review applies it; an approved file must match the fingerprints', async () => {
  await withRepoFetch(async () => {
    const unapproved = { ...file, approved: false, approval: null };
    const off = await cast.loadProductionCast(false, 'approved', unapproved);
    for (const m of off.cast.values()) assert.equal(m.variants, undefined);
    for (const s of off.sheets) for (const f of s.frames) for (let j = 3; j < f.rgba.length; j += 4) assert.ok(f.rgba[j] === 0 || f.rgba[j] === 255, `${s.id}: alpha stays binary`);
    const cand = await cast.loadProductionCast(false, 'candidate', unapproved);
    assert.ok(cand.cast.get('crowd0').variants?.list.length === 2, 'candidate: variants applied');
    const art = cand.sheets.find((x) => x.id === 'artisan-x2-v1');
    assert.equal(art.materials?.length, art.frames.length, 'candidate: one material map per frame');
    for (const x of cand.sheets) for (const fr of x.frames) for (let j = 3; j < fr.rgba.length; j += 4) assert.ok(fr.rgba[j] === 0 || fr.rgba[j] === 255, `${x.id}: the sheet keeps its binary alpha`);
    for (const m of off.sheets) assert.equal(m.materials, undefined);
    const wrong = { ...file, approved: true, approval: { by: 'test', date: '2026-10-18' }, sheets: Object.fromEntries(Object.entries(file.sheets).map(([id, s]) => [id, { ...s, fingerprint: '00000000' }])) };
    await assert.rejects(cast.loadProductionCast(false, 'approved', wrong), /are not the approved masks/);
  });
});
