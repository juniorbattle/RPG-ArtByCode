// The arena over the town's far city (journal Passe VP8, the operator, word for word: « je veux intégrer une visibilité commune qui est la
// perception du grand colisee/arène de combat en fond arrière pour garde cet élément principale au jeu »): a version 2 game's town
// (`skyline=arena`) sees the tournament's arena on the upper city's slope in the cathedral's place; today's far city built as on main, byte
// for byte; every other part of the far city the same in both; the pages that set it, and only those.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import { load } from './load.mjs';

const DC = await load('/src/district/DistantCity.ts');
const { Rng } = await load('/src/core/rng.ts');
const src = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');

const build = (arena) => {
  DC.setSkylineArena(arena);
  const metas = [];
  try {
    const d = DC.buildDistantCity(new Rng(1842).fork('city'), null, { buildingDensity: 1 }, (m) => (metas.push(m), metas.length));
    return { B: d.builder, metas };
  } finally { DC.setSkylineArena(false); }
};
const hash = ({ B, metas }) => {
  const h = crypto.createHash('sha256');
  for (const a of [new Float32Array(B.pos), new Float32Array(B.nrm), new Float32Array(B.uv), new Float32Array(B.tint), new Float32Array(B.aux), new Uint32Array(B.idx), new Uint32Array(B.part)]) h.update(Buffer.from(a.buffer));
  h.update(JSON.stringify(metas));
  return h.digest('hex');
};
/** each part's vertices (positions, tints, aux) as one string */
const parts = ({ B }) => {
  const out = new Map();
  for (let v = 0; v < B.part.length; v++) {
    const k = B.part[v];
    out.set(k, (out.get(k) ?? '') + [B.pos[v * 3], B.pos[v * 3 + 1], B.pos[v * 3 + 2], B.tint[v * 4], B.aux[v * 4], B.aux[v * 4 + 2], B.aux[v * 4 + 3]].join(',') + ';');
  }
  return out;
};

test("today's far city: built as on main, byte for byte (its cathedral, no arena)", () => {
  const today = build(false);
  // the hash of main's buildDistantCity (seed 1842, density 1; main e540e53, journal Passe VP8)
  assert.equal(hash(today), '4e80a62133fd6c2ed5e18b57e1c7dd12c20f2d83e24f095935075690fc6700a2');
  assert.equal(today.metas.filter((m) => m.group === 'cathedral').length, 1);
  assert.equal(today.metas.filter((m) => m.group === 'arena').length, 0);
});

test('a version 2 town: the arena in the cathedral\'s place, every other part of the far city the same', () => {
  const today = build(false), v2 = build(true);
  assert.equal(v2.metas.length, today.metas.length);
  const at = today.metas.findIndex((m) => m.group === 'cathedral');
  assert.ok(at >= 0);
  assert.deepEqual(v2.metas[at], { kind: 'landmark', tier: 2, group: 'arena' });
  v2.metas.forEach((m, i) => { if (i !== at) assert.deepEqual(m, today.metas[i], `part ${i + 1}`); });
  // every part but the landmark's: the same vertices (the castle, the upper city, the trees after it: the RNG's draws and the ids unmoved)
  const a = parts(today), b = parts(v2), key = at + 1;
  assert.deepEqual([...a.keys()].sort((x, y) => x - y), [...b.keys()].sort((x, y) => x - y));
  for (const [k, s] of a) if (k !== key) assert.equal(b.get(k), s, `part ${k}`);
  assert.notEqual(b.get(key), a.get(key));
});

test("the arena's drum: round the cathedral's place on the slope, a colosseum's size, arcaded tiers and the tournament's pennants", () => {
  const { B, metas } = build(true), key = metas.findIndex((m) => m.group === 'arena') + 1;
  let n = 0, rMin = Infinity, rMax = 0, yMin = Infinity, yMax = -Infinity, arcades = 0, blue = 0, gold = 0;
  for (let v = 0; v < B.part.length; v++) {
    if (B.part[v] !== key) continue;
    n++;
    const x = B.pos[v * 3], y = B.pos[v * 3 + 1], z = B.pos[v * 3 + 2], r = Math.hypot(x - 200, z + 34);
    rMin = Math.min(rMin, r); rMax = Math.max(rMax, r); yMin = Math.min(yMin, y); yMax = Math.max(yMax, y);
    // the facade kind's arched bays (aux.w 2) and the pennants' royal blue and gold
    if (B.aux[v * 4 + 3] === 2) arcades++;
    if (B.tint[v * 4 + 2] > 0.5 && B.tint[v * 4] < 0.2) blue++;
    if (B.tint[v * 4] > 0.6 && B.tint[v * 4 + 2] < 0.25) gold++;
  }
  assert.ok(n > 500, `${n} vertices`);
  assert.ok(rMin > 20 && rMax < 26, `radius ${rMin.toFixed(1)}..${rMax.toFixed(1)}`);
  // on the slope (the hill under it 14-18 m at the cathedral's place), 31-38 m to its pennants' tops
  assert.ok(yMin > 8 && yMin < 16 && yMax - yMin > 30 && yMax - yMin < 40, `y ${yMin.toFixed(1)}..${yMax.toFixed(1)}`);
  assert.equal(arcades, 40 * 4);
  assert.ok(blue >= 24 && gold >= 24, `${blue} blue, ${gold} gold`);
});

test('the pages that set it: a version 2 game\'s town only; the squares, the arena and today\'s pages never', () => {
  assert.match(src('src/ui/playTown.ts'), /if \(isV2\(st\)\) \{ q\.set\('heraldry', 'tournament'\); q\.set\('skyline', 'arena'\); \}/);
  assert.match(src('src/app/App.ts'), /setSkylineArena\(this\.opts\.params\.get\('skyline'\) === 'arena'\);/);
  assert.equal(src('src/app/App.ts').match(/setSkylineArena\(/g).length, 1);
  for (const f of ['src/world/PlazaApp.ts', 'src/world/PlaceApp.ts', 'src/arena/ArenaApp.ts', 'src/main.ts']) assert.doesNotMatch(src(f), /skyline|setSkylineArena/, f);
  // the flag is the module's and starts off
  assert.match(src('src/district/DistantCity.ts'), /let SKYLINE_ARENA = false;/);
});
