// The tournament's heraldry (journal Passe VP3, the operator's request: « des emblèmes liés à notre tournoi comme des deux épées qui se
// croisent ou des silhouettes de combattants »): eight new emblems in a 4 x 4 atlas painted only for the version 2's pages (its squares, the
// town and the arena of a version 2 game); today's 4 x 2 atlas painted call for call as on main, its cells where they were; a tournament
// emblem asked of today's atlas refused; every banner of the squares one of the tournament's; the pages that set it, and only those.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { load } from './load.mjs';
import { recordingDocument } from './heraldry-canvas.mjs';

const CA = await load('/src/materials/CanvasArt.ts');
const FG = await load('/src/architecture/FacadeGrammar.ts');
const PZ = await load('/src/world/Plazas.ts');
const TODAY = ['scales', 'hammers', 'fleur', 'key', 'mortar', 'scissors', 'tankard', 'anvil'];
const TOURNAMENT = ['swords', 'duel', 'laurel', 'trophy', 'helm', 'horn', 'lances', 'crown'];
const src = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const paint = (rows) => { const r = recordingDocument(); globalThis.document = r.document; const c = rows === undefined ? CA.makeEmblemAtlas() : CA.makeEmblemAtlas(rows); return { ...r, c }; };

test("today's atlas: the same calls on the same 768 x 512 canvas as main's (its bytes), the tournament's painted after them in a 4 x 4 one", () => {
  // the hash of main's makeEmblemAtlas() under the recording canvas (main aaa48f0, journal Passe VP3)
  const today = paint(), two = paint(2), four = paint(4);
  assert.equal(today.hash(), '1309cb6d1043de3cfd30ee5aaa3687c0f3303a1400d178e8e9e985024b2e74a1');
  assert.equal(two.hash(), today.hash());
  assert.deepEqual([today.c.width, today.c.height, four.c.width, four.c.height], [768, 512, 768, 1024]);
  // the 4 x 4 atlas: today's eight cells drawn by the same calls, then the tournament's eight
  assert.deepEqual(four.log.slice(2, today.log.length), today.log.slice(2));
  assert.ok(four.log.length > today.log.length * 2);
  // each cell starts with its field (fillRect 0, 0, 192, 256) after the cell's translate
  const cells = [];
  four.log.forEach((e, i) => { if (e[0] === 'fillRect' && e[1] === 0 && e[2] === 0 && e[3] === 192 && e[4] === 256) { let j = i; while (four.log[j][0] !== 'translate') j--; cells.push(`${four.log[j][1]},${four.log[j][2]}`); } });
  assert.deepEqual(cells.filter((c, i) => c !== cells[i - 1]), Array.from({ length: 16 }, (_, i) => `${(i % 4) * 192},${Math.floor(i / 4) * 256}`));
  for (const k of TOURNAMENT) assert.ok(CA.EMBLEM_CELLS[k] >= 8 && CA.EMBLEM_FIELD[k], k);
  assert.deepEqual(TODAY.map((k) => CA.EMBLEM_CELLS[k]), [0, 1, 2, 3, 4, 5, 6, 7]);
});

test("an emblem's cell: today's rectangles at 2 rows; at 4 the same texels inset, the tournament's in the lower half; refused in today's atlas", () => {
  CA.setTournamentHeraldry(false);
  assert.equal(CA.emblemAtlasRows(), 2); assert.equal(CA.tournamentHeraldry(), false);
  for (const k of TODAY) for (const inset of [0.006, 0.01]) {
    const i = CA.EMBLEM_CELLS[k];
    assert.deepEqual(FG.emblemRect(k, inset), FG.atlasRect(i % 4, Math.floor(i / 4), 4, 2, inset), k);
  }
  for (const k of TOURNAMENT) assert.throws(() => FG.emblemRect(k, 0.006), /tournament/);
  CA.setTournamentHeraldry(true);
  assert.equal(CA.emblemAtlasRows(), 4);
  for (const k of [...TODAY, ...TOURNAMENT]) {
    const i = CA.EMBLEM_CELLS[k], [u0, v0, u1, v1] = FG.emblemRect(k, 0.006);
    // the cell in texels: the same inset as in today's atlas (4.6 x 3.1 px of a 192 x 256 cell)
    const col = i % 4, row = Math.floor(i / 4);
    assert.ok(Math.abs(u0 * 768 - (col * 192 + 0.006 * 768)) < 1e-6 && Math.abs(u1 * 768 - ((col + 1) * 192 - 0.006 * 768)) < 1e-6, k);
    assert.ok(Math.abs((1 - v1) * 1024 - (row * 256 + 0.006 * 512)) < 1e-6 && Math.abs((1 - v0) * 1024 - ((row + 1) * 256 - 0.006 * 512)) < 1e-6, k);
    if (TOURNAMENT.includes(k)) assert.ok(v1 <= 0.5, `${k} in the lower half`);
  }
  CA.setTournamentHeraldry(false);
});

test("the squares fly the tournament's emblems only, and refuse today's atlas", () => {
  const lib = { ground: Object.assign(new THREE.ShaderMaterial(), { uniforms: { tGroundMask: { value: null }, uGroundRect: { value: new THREE.Vector4() } } }), slot: new Proxy({}, { get: (o, k) => (o[k] ??= new THREE.MeshBasicMaterial()) }) };
  CA.setTournamentHeraldry(false);
  assert.throws(() => PZ.buildPlaza(lib, 'forecourt', 1842, { day: true }), /tournament/);
  CA.setTournamentHeraldry(true);
  for (const k of ['forecourt', 'training', 'festival']) for (const day of [false, true]) {
    const b = PZ.buildPlaza(lib, k, 1842, { day }); b.cull(() => true);
    const uv = b.world.get('banner').uv, seen = new Set();
    assert.ok(uv.length > 0, k);
    // every vertex of the banner slot samples a tournament cell (v < 0.5 in the 4 x 4 atlas) or a shop's trade sign (its key, mortar,
    // scissors or tankard: a sign, not a flag)
    const TRADE = new Set(['key', 'mortar', 'scissors', 'tankard'].map((e) => CA.EMBLEM_CELLS[e]));
    for (let i = 0; i < uv.length; i += 2) {
      const cell = Math.min(3, Math.floor(uv[i] * 4)) + 4 * Math.min(3, Math.floor((1 - uv[i + 1]) * 4));
      assert.ok(cell >= 8 || TRADE.has(cell), `${k} ${day}: cell ${cell} on a banner`);
      seen.add(cell);
    }
    assert.ok([...seen].filter((c) => c >= 8).length >= (k === 'forecourt' ? 6 : 1), `${k} ${day}: ${[...seen]}`);
  }
  CA.setTournamentHeraldry(false);
});

test('the pages that fly it: the squares always, the town and the arena of a version 2 game; today\'s pages never', () => {
  assert.match(src('src/world/PlazaApp.ts'), /setTournamentHeraldry\(true\);\n    this\.lib = await MaterialLibrary\.build\(/);
  assert.match(src('src/app/App.ts'), /setTournamentHeraldry\(this\.opts\.params\.get\('heraldry'\) === 'tournament'\);\n    this\.lib = await MaterialLibrary\.build\(/);
  assert.match(src('src/arena/ArenaApp.ts'), /setTournamentHeraldry\(this\.rules === 'v2'\);\n    this\.lib = await MaterialLibrary\.build\(/);
  assert.match(src('src/ui/playTown.ts'), /if \(isV2\(st\)\) q\.set\('heraldry', 'tournament'\);/);
  assert.match(src('src/materials/MaterialLibrary.ts'), /emblem: makeEmblemAtlas\(emblemAtlasRows\(\)\)/);
  // the place apps of today's game (the forecourt and Lantern Row pages) never set it
  assert.doesNotMatch(src('src/world/PlaceApp.ts'), /setTournamentHeraldry/);
  // the default town's banners: the guild's scales, the tavern's tankard, the boat's fleur when the heraldry is off
  assert.match(src('src/props/Banners.ts'), /emblem: T \? 'swords' : 'scales'/);
  assert.match(src('src/props/Banners.ts'), /emblem: T \? 'trophy' : 'tankard'/);
  assert.match(src('src/district/MerchantDistrictGenerator.ts'), /emblem: tournamentHeraldry\(\) \? 'duel' : 'fleur'/);
});
