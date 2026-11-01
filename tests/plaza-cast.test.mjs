// The casting's sheets (journal Passes CA1 to CA5): the operator's choices held figure by figure, the squares and a version 2 game's portraits only.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const json = (f) => JSON.parse(read(f));
const SHEETS = { marek: 'a', orla: 'a', rhosk: 'a', cassius: 'a', odo: 'b', corvin: 'b', ilse: 'b', hilde: 'b', anwen: 'c', brann: 'c', lio: 'c', wren: 'c', tobin: 'd', pip: 'd', vessa: 'e' };
const WALKERS = ['marek', 'orla'], FACE_ONLY = ['rhosk', 'tobin'];

test('every sheet comes from its clean source, the operator\'s approval on it', () => {
  for (const [who, s] of Object.entries(SHEETS)) {
    assert.ok(read(`art-lab/characters/rigs/${who}-x2-v2.rig.mjs`).includes(`casting-clear-2026-11-01-${s}.png`), who);
    const m = json(`art-lab/characters/manifests/${who}-x2-v2.manifest.json`);
    assert.equal(m.approved, true, who); assert.equal(m.status, 'approved', who); assert.equal(m.runtimeUse, 'production', who); assert.equal(m.approval.date, '2026-11-01', who); assert.match(m.approval.note, /« Validé »/, who);
  }
});

test('12 frames for those who stand, 30 for the two who walk (T1)', () => {
  for (const who of Object.keys(SHEETS)) {
    const j = json(`art-lab/characters/exports/${who}-x2-v2.json`), tags = j.meta.frameTags.map((t) => t.name);
    assert.equal(j.frames.length, WALKERS.includes(who) ? 30 : 12, who);
    assert.equal(tags.filter((t) => t.startsWith('walk')).length, WALKERS.includes(who) ? 3 : 0, who);
  }
});

test('no first-recipe sheet stays in production', () => {
  for (const who of Object.keys(SHEETS)) { const m = json(`art-lab/characters/manifests/${who}-x2-v1.manifest.json`); assert.equal(m.status, 'superseded', who); assert.notEqual(m.runtimeUse, 'production', who); assert.equal(m.approved, false, who); }
  assert.ok(!/-x2-v1/.test(read('src/characters/PlazaCast.ts').replace("'blacksmith-x2-v1'", '')));
});

test('the sheets reach the squares and a version 2 game, never the frozen district or today\'s game', () => {
  for (const f of ['src/app/App.ts', 'src/characters/BakedCast.ts', 'src/characters/ActorSystem.ts', 'src/arena/ArenaApp.ts', 'src/ui/playForecourt.ts', 'src/ui/playLanterns.ts']) assert.ok(!read(f).includes('PlazaCast'), f);
  assert.match(read('src/ui/playTown.ts'), /isV2\(st\) \? \(await import\('\.\.\/characters\/PlazaCast'\)\)\.plazaFaces\(\) : undefined/);
  assert.match(read('src/world/PlazaApp.ts'), /plazaCastEntries\(\)\)/);
});

test('every person of a square has a sheet, no provisional sprite left, Tobin and Rhosk their faces', () => {
  const app = read('src/world/PlazaApp.ts'), cast = read('src/characters/PlazaCast.ts'), list = /PLAZA_PEOPLE = \[([^\]]+)\]/.exec(cast)[1], people = /SQUARE_PEOPLE = \[([^\]]+)\]/.exec(app)[1];
  for (const id of people.match(/'[a-z]+'/g)) assert.ok(list.includes(id), id);
  for (const who of FACE_ONLY) assert.ok(list.includes(`'${who}'`), who);
  assert.ok(!app.includes('prov-') && !/PROVISIONAL/.test(app));
  assert.match(app, /const generated = cast \? \[\] : crowdVariants/, 'generated people only under cast=generated');
  assert.ok(!fs.existsSync(path.join(ROOT, 'src/lab/plazaCast.ts')));
});

test('a still sheet is excused the walk frames, and only a still one', () => {
  const s = read('src/characters/BakedCast.ts');
  assert.match(s, /e\.still \? REQUIRED\.filter\(\(r\) => r\.endsWith\('\/idle'\)\) : REQUIRED/);
  const entries = /const ENTRIES[\s\S]*?\n\];/.exec(s)[0];
  assert.ok(!entries.includes('still'), 'no entry of the district stands still');
});
