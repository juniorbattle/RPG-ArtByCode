// The casting's candidate sheets (journal Passes CA1 / CA2): the operator's choices held figure by figure, nothing in production before the lot sheet.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const json = (f) => JSON.parse(read(f));
const SHEETS = { odo: 'combat-casting-2026-11-01-g2.webp', anwen: 'main-characters-casting-2026-10-18-original.png', hilde: 'combat-casting-2026-11-01-g2.webp', corvin: 'combat-casting-2026-11-01-g2.webp', brann: 'main-characters-casting-2026-10-18-original.png', pip: 'tournament-roster-casting-2026-10-18-b-original.png', lio: 'merchant-district-night-npc-17-24.webp', wren: 'main-characters-casting-2026-10-18-original.png', vessa: 'tournament-roster-casting-2026-10-18-a-original.png', ilse: 'combat-casting-2026-11-01-g2.webp', cassius: 'combat-casting-2026-11-01-g2.webp', tobin: 'combat-casting-2026-11-01-g2.webp', rhosk: 'combat-casting-2026-11-01-g1.webp', marek: 'combat-casting-2026-11-01-g1.webp', orla: 'combat-casting-2026-11-01-g1.webp' };
const WALKERS = ['marek', 'orla'];

test('every sheet comes from the sheet the operator chose', () => {
  for (const [who, sheet] of Object.entries(SHEETS)) assert.ok(read(`art-lab/characters/rigs/${who}-x2-v1.rig.mjs`).includes(sheet), who);
});

test('T1 « Debout, sauf Marek et Orla »: 12 frames for those who stand, 30 for the two who walk', () => {
  for (const who of Object.keys(SHEETS)) {
    const j = json(`art-lab/characters/exports/${who}-x2-v1.json`), tags = j.meta.frameTags.map((t) => t.name).sort();
    assert.equal(j.frames.length, WALKERS.includes(who) ? 30 : 12, who);
    assert.deepEqual(tags.filter((t) => t.startsWith('idle')), ['idle-down', 'idle-side', 'idle-up'], who);
    assert.equal(tags.filter((t) => t.startsWith('walk')).length, WALKERS.includes(who) ? 3 : 0, who);
  }
});

test('nothing is approved or in production before the operator\'s lot sheet', () => {
  for (const who of Object.keys(SHEETS)) {
    const m = json(`art-lab/characters/manifests/${who}-x2-v1.manifest.json`);
    assert.equal(m.approved, false, who); assert.equal(m.status, 'candidate', who); assert.equal(m.runtimeUse, 'lab', who);
  }
});

test('the candidates reach a page only through the DEV parameter, and never the frozen district', () => {
  const plaza = read('src/world/PlazaApp.ts'), play = read('src/ui/playPlaza.ts');
  assert.match(plaza, /import\.meta\.env\.DEV && castMode === 'candidate' \? \(await import\('\.\.\/lab\/plazaCast'\)\)/);
  assert.match(play, /import\.meta\.env\.DEV && b\.params\.get\('cast'\) === 'candidate' \? \(await import\('\.\.\/lab\/plazaCast'\)\)/);
  for (const f of ['src/app/App.ts', 'src/characters/BakedCast.ts', 'src/characters/ActorSystem.ts', 'src/ui/playTown.ts', 'src/arena/ArenaApp.ts']) assert.ok(!read(f).includes('plazaCast'), f);
  assert.ok(!/from '\.\.\/lab\/plazaCast'/.test(plaza.replace(/import type[^\n]*/g, '')), 'a static import would bundle the candidates');
});

test('every provisional person has a candidate sheet, Tobin and Rhosk their faces', () => {
  const lab = read('src/lab/plazaCast.ts'), list = /CANDIDATE_PEOPLE = \[([^\]]+)\]/.exec(lab)[1], prov = /PROVISIONAL = \[([^\]]+)\]/.exec(read('src/world/PlazaApp.ts'))[1];
  for (const id of prov.match(/'[a-z]+'/g)) assert.ok(list.includes(id), id);
  for (const id of ["'tobin'", "'rhosk'"]) assert.ok(list.includes(id), id);
});

test('a still sheet is excused the walk frames, and only a still one', () => {
  const s = read('src/characters/BakedCast.ts');
  assert.match(s, /e\.still \? REQUIRED\.filter\(\(r\) => r\.endsWith\('\/idle'\)\) : REQUIRED/);
  const entries = /const ENTRIES[\s\S]*?\n\];/.exec(s)[0];
  assert.ok(!entries.includes('still'), 'no production entry stands still');
});
