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
const APPROVED = ['anwen', 'cassius', 'hilde', 'ilse', 'lio', 'orla', 'rhosk', 'vessa'], WAITING = ['odo', 'corvin', 'brann', 'wren', 'pip', 'tobin', 'marek'];

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

test('in production: the eight the operator approved on the lot sheet, and only those', () => {
  for (const who of WAITING) { const m = json(`art-lab/characters/manifests/${who}-x2-v1.manifest.json`); assert.equal(m.approved, false, who); assert.equal(m.status, 'superseded', who); assert.equal(m.runtimeUse, 'none', who); }
  for (const who of APPROVED) { const m = json(`art-lab/characters/manifests/${who}-x2-v1.manifest.json`); assert.equal(m.approved, true, who); assert.equal(m.runtimeUse, 'production', who); assert.match(m.approval.note, /Toutes après correction/, who); }
  assert.deepEqual([...APPROVED, ...WAITING].sort(), Object.keys(SHEETS).sort());
  const prod = read('src/characters/PlazaCast.ts');
  for (const who of WAITING) assert.ok(!prod.includes(`'${who}'`) && !new RegExp(`[,{]${who}[,}]`).test(prod), who);
  for (const who of APPROVED) assert.ok(prod.includes(`'${who}'`), who);
});

test('the second recipe (journal Passe CA4): every figure from a clean sheet, a candidate, reached only by the DEV parameter', () => {
  for (const who of Object.keys(SHEETS)) {
    assert.match(read(`art-lab/characters/rigs/${who}-x2-v2.rig.mjs`), /casting-clear-2026-11-01-/, who);
    const m = json(`art-lab/characters/manifests/${who}-x2-v2.manifest.json`);
    assert.equal(m.approved, false, who); assert.equal(m.status, 'candidate', who); assert.equal(m.runtimeUse, 'lab', who);
    assert.equal(json(`art-lab/characters/exports/${who}-x2-v2.json`).frames.length, WALKERS.includes(who) ? 30 : 12, who);
  }
  assert.ok(!/(anwen|cassius|hilde|ilse|lio|orla|rhosk|vessa|odo|corvin|brann|wren|pip|tobin|marek)-x2-v2/.test(read('src/characters/PlazaCast.ts')) && !read('src/characters/PlazaCast.ts').includes('x2-v2.'), 'none in production before the lot sheet');
  assert.match(read('src/lab/plazaCast.ts'), /-x2-v2/);
});

test('heads within the cast: the figures of the combat casting enlarged, emblems out of the five', () => {
  for (const who of ['marek', 'rhosk', 'odo', 'corvin', 'cassius', 'ilse', 'tobin', 'orla']) assert.match(read(`art-lab/characters/rigs/${who}-x2-v1.rig.mjs`), /"?head"?: \{ "?k"?: 1\.\d+ \}/, who);
  for (const who of ['marek', 'odo', 'corvin', 'brann', 'wren']) assert.match(read(`art-lab/characters/rigs/${who}-x2-v1.rig.mjs`), /"?emblem"?: \{/, who);
});

test('the candidates reach a page only through the DEV parameter, and never the frozen district', () => {
  const plaza = read('src/world/PlazaApp.ts'), play = read('src/ui/playPlaza.ts');
  assert.match(plaza, /import\.meta\.env\.DEV && castMode === 'candidate' \? \(await import\('\.\.\/lab\/plazaCast'\)\)/);
  assert.match(play, /import\.meta\.env\.DEV && b\.params\.get\('cast'\) === 'candidate' \? \(await import\('\.\.\/lab\/plazaCast'\)\)/);
  for (const f of ['src/app/App.ts', 'src/characters/BakedCast.ts', 'src/characters/ActorSystem.ts', 'src/ui/playTown.ts', 'src/arena/ArenaApp.ts']) assert.ok(!read(f).includes('lab/plazaCast'), f);
  for (const f of ['src/app/App.ts', 'src/characters/BakedCast.ts', 'src/characters/ActorSystem.ts', 'src/arena/ArenaApp.ts']) assert.ok(!read(f).includes('PlazaCast'), f);
  assert.match(read('src/ui/playTown.ts'), /isV2\(st\) \? \(await import\('\.\.\/characters\/PlazaCast'\)\)\.plazaFaces\(\) : undefined/, 'the default game loads no face of the casting');
  assert.ok(!/from '\.\.\/lab\/plazaCast'/.test(plaza.replace(/import type[^\n]*/g, '')), 'a static import would bundle the candidates');
});

test('every provisional person has a sheet, approved or waiting, Tobin and Rhosk their faces', () => {
  const lab = read('src/lab/plazaCast.ts'), list = /CANDIDATE_PEOPLE = \[([^\]]+)\]/.exec(lab)[1] + /PLAZA_PEOPLE = \[([^\]]+)\]/.exec(read('src/characters/PlazaCast.ts'))[1], prov = /PROVISIONAL = \[([^\]]+)\]/.exec(read('src/world/PlazaApp.ts'))[1];
  for (const id of prov.match(/'[a-z]+'/g)) assert.ok(list.includes(id), id);
  for (const id of ["'tobin'", "'rhosk'"]) assert.ok(list.includes(id), id);
});

test('a still sheet is excused the walk frames, and only a still one', () => {
  const s = read('src/characters/BakedCast.ts');
  assert.match(s, /e\.still \? REQUIRED\.filter\(\(r\) => r\.endsWith\('\/idle'\)\) : REQUIRED/);
  const entries = /const ENTRIES[\s\S]*?\n\];/.exec(s)[0];
  assert.ok(!entries.includes('still'), 'no production entry stands still');
});
