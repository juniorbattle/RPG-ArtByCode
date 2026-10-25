// The arena fighters' density trial (journal Passe AA2, the operator's decision AA1-3): its sheets stay lab assets that never reach the game's
// cast, they are the production hero rebuilt at another density (same cycles, same palette), and the arena reaches the trial only behind
// `import.meta.env.DEV` (production builds compile it out; the bundle against frozen main is a local proof).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const read = (rel) => fs.readFileSync(path.join(ROOT, rel));
const json = (rel) => JSON.parse(read(rel).toString('utf8'));
const TRIALS = { 'hero-x3-trial': 3, 'hero-x4-trial': 4 };
const cast = await load('/src/characters/BakedCast.ts');

test('the trial sheets are lab assets, unapproved, outside the cast (candidates included)', () => {
  const ids = [...cast.castEntries(false), ...cast.castEntries(true)].map((e) => e.manifest.id);
  for (const id of Object.keys(TRIALS)) {
    const m = json(`art-lab/characters/manifests/${id}.manifest.json`);
    assert.equal(m.runtimeUse, 'lab', id);
    assert.equal(m.approved, false, id);
    assert.equal(m.status, 'experimental', id);
    assert.ok(!ids.includes(id), `${id} is not a cast entry`);
    const sha = crypto.createHash('sha256').update(read(`art-lab/characters/exports/${id}.png`)).digest('hex');
    assert.equal(json(`art-lab/characters/provenance/${id}/PROVENANCE.json`).files[`art-lab/characters/exports/${id}.png`], sha, `${id}: export against its pack`);
  }
});

test('each trial sheet is the production hero\'s side idle and walk at its density', () => {
  const ref = json('art-lab/characters/exports/hero-x2-v4.json').meta.frameTags;
  const count = (tags, name) => { const t = tags.find((x) => x.name === name); return t ? t.to - t.from + 1 : 0; };
  for (const [id, k] of Object.entries(TRIALS)) {
    const meta = json(`art-lab/characters/exports/${id}.json`);
    for (const f of meta.frames) { assert.equal(f.sourceSize.w, 32 * k, id); assert.equal(f.sourceSize.h, 48 * k, id); }
    assert.deepEqual(meta.meta.frameTags.map((t) => t.name), ['idle-side', 'walk-side'], id);
    for (const tag of ['idle-side', 'walk-side']) assert.equal(count(meta.meta.frameTags, tag), count(ref, tag), `${id} ${tag}`);
  }
});

test('the arena reaches the trial only behind import.meta.env.DEV', () => {
  const src = read('src/arena/ArenaApp.ts').toString('utf8').split(/\r?\n/);
  const uses = src.filter((l) => /densityTrial|fighterDensity/.test(l) && !/^\s*(\/\/|\/\*\*|\*)/.test(l));
  assert.ok(uses.length >= 4, 'the trial is wired');
  for (const l of uses) assert.ok(/import\.meta\.env\.DEV &&/.test(l) || /private declare densityTrial/.test(l), `unguarded: ${l.trim()}`);
  for (const f of fs.readdirSync(path.join(ROOT, 'src'), { recursive: true }).filter((f) => /\.ts$/.test(f) && !f.startsWith('lab'))) {
    if (f.replace(/\\/g, '/') === 'arena/ArenaApp.ts') continue;
    assert.ok(!/fighterDensity/.test(read(`src/${f}`).toString('utf8')), `src/${f} does not reach the trial`);
  }
});
