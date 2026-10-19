// The production cast's gate (src/characters/BakedCast.ts, AGENTS.md "Art production principle"): only manifests approved for production
// reach the game, a production entry without an approval is a load error, and every exported PNG must match the SHA-256 of its
// provenance pack. `fetch` is served from the repo's files (the `?url` imports resolve to root-relative paths).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const cast = await load('/src/characters/BakedCast.ts');

const manifests = fs.readdirSync(path.join(ROOT, 'art-lab/characters/manifests')).filter((f) => f.endsWith('.manifest.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(ROOT, 'art-lab/characters/manifests', f), 'utf8')));
const production = manifests.filter((m) => m.runtimeUse === 'production').map((m) => m.id).sort();

const entry = (id, status, approved, runtimeUse) => ({ manifest: { id, status, approved, runtimeUse }, png: '', json: null, files: {}, replaces: [], scale: 1 });

test('the cast loads exactly the manifests approved for production', () => {
  assert.ok(production.length >= 10);
  for (const id of production) {
    const m = manifests.find((x) => x.id === id);
    assert.ok(m.approved === true && m.status === 'approved' && m.approval?.by && m.approval?.date, `${id}: approved, by whom and when`);
  }
  assert.deepEqual(cast.castEntries(false).map((e) => e.manifest.id).sort(), production);
});

test('gate rules on given entries', () => {
  const ok = entry('ok', 'approved', true, 'production'), cand = entry('cand', 'candidate', false, 'lab');
  const lab = entry('lab', 'approved', true, 'lab'), exp = entry('exp', 'experimental', false, 'lab'), none = entry('none', 'planned', false, 'none');
  const list = [ok, cand, lab, exp, none];
  assert.deepEqual(cast.castEntries(false, list).map((e) => e.manifest.id), ['ok']);
  assert.deepEqual(cast.castEntries(true, list).map((e) => e.manifest.id), ['ok', 'cand'], 'candidates only on request');
  for (const bad of [entry('x', 'approved', false, 'production'), entry('x', 'candidate', true, 'production'), entry('x', 'candidate', false, 'production')]) {
    assert.throws(() => cast.castEntries(false, [ok, bad]), /x: runtimeUse production without an approval/);
    assert.throws(() => cast.castEntries(true, [bad]), /without an approval/);
  }
});

/** fetch served from the repo; `tamper(url, bytes)` may change the bytes */
async function withRepoFetch(tamper, fn) {
  const real = globalThis.fetch;
  const fetched = [];
  globalThis.fetch = async (url) => {
    const rel = decodeURIComponent(String(url)).replace(/[?#].*$/, '').replace(/^\//, '');
    fetched.push(rel);
    const bytes = fs.readFileSync(path.join(ROOT, rel));
    tamper?.(rel, bytes);
    return new Response(bytes);
  };
  try { return await fn(fetched); } finally { globalThis.fetch = real; }
}

test('loadProductionCast: every sheet checked against its provenance pack, every replaced archetype cast', async () => {
  await withRepoFetch(null, async (fetched) => {
    const { sheets, cast: members } = await cast.loadProductionCast(false);
    assert.deepEqual(sheets.map((s) => s.id).sort(), production);
    assert.deepEqual(fetched.sort(), production.map((id) => `art-lab/characters/exports/${id}.png`));
    for (const s of sheets) {
      const pack = JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/provenance/${s.id}/PROVENANCE.json`), 'utf8'));
      const file = `art-lab/characters/exports/${s.id}.png`, real = crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT, file))).digest('hex');
      assert.equal(s.sha256, pack.files[file], s.id);
      assert.equal(s.sha256, real, s.id);
      assert.equal(s.runtimeUse, 'production');
      for (const d of ['down', 'up', 'side']) for (const a of ['idle', 'walk']) assert.ok(s.frames.some((f) => f.dir === d && f.anim === a), `${s.id}: ${d}/${a}`);
    }
    assert.deepEqual([...members.keys()].sort(), ['blacksmith', 'crowd0', 'crowd1', 'crowd2', 'crowd3', 'crowd4', 'guardA', 'guardB', 'hooded', 'merchant', 'porter']);
    for (const [role, m] of members) assert.ok(production.includes(m.id) && m.height > 0 && m.scale > 0, role);
  });
});

test('one changed byte in an exported PNG stops the load', async () => {
  for (const id of [production[0], production.at(-1)]) {
    const target = `art-lab/characters/exports/${id}.png`;
    await withRepoFetch((rel, bytes) => { if (rel === target) bytes[bytes.length - 20] ^= 1; },
      () => assert.rejects(cast.loadProductionCast(false), new RegExp(`${id}: exported PNG SHA-256 .* does not match its provenance pack`)));
  }
});

test('a sheet missing a frame its archetype needs is a load error, never a silent fallback (contract amendment B; Passe Q2)', async () => {
  const id = 'dockworker-x2-v2', m = manifests.find((x) => x.id === id);
  const json = JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/exports/${id}.json`), 'utf8'));
  const files = JSON.parse(fs.readFileSync(path.join(ROOT, `art-lab/characters/provenance/${id}/PROVENANCE.json`), 'utf8')).files;
  const entryWith = (j, needs) => ({ manifest: { id, status: m.status, approved: m.approved, runtimeUse: m.runtimeUse }, png: `/art-lab/characters/exports/${id}.png`, json: j, files, replaces: ['porter'], scale: 0.9, ...(needs ? { needs } : {}) });
  await withRepoFetch(null, async () => {
    // the same sheet as production: it loads
    const ok = await cast.loadProductionCast(false, 'off', undefined, [entryWith(json)]);
    assert.deepEqual(ok.sheets.map((s) => s.id), [id]);
    // its walk-up tag dropped from the metadata (the PNG unchanged: its SHA-256 still matches the pack)
    const noWalkUp = { ...json, meta: { ...json.meta, frameTags: json.meta.frameTags.filter((t) => t.name !== 'walk-up') } };
    await assert.rejects(cast.loadProductionCast(false, 'off', undefined, [entryWith(noWalkUp)]), new RegExp(`${id}: .*missing frames up/walk`));
    // an archetype that also needs a frame the sheet does not have (the smith's side hammer)
    await assert.rejects(cast.loadProductionCast(false, 'off', undefined, [entryWith(json, ['side/hammer'])]), /missing frames side\/hammer/);
  });
});
