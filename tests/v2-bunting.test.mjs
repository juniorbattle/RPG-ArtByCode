// The squares' bunting by the festival (journal Passe FT1; the operator's choice L5-3 « Fanions dans une tâche à part, pas de volets », journal Passe EVL10):
// by day the garlands each square already hangs (J6) follow the pulse's festivity in three tiers - 1 every other swag along the façades (the first of
// each row), 2 every swag along them, 3 and the strings across the square's heart and the gateways' swags (the squares as they were built until this
// pass); the night hangs none. A tier only takes garlands away: every other slot, part and instance stays where it was, and the third tier is today's square to the
// byte. Each tier is its own geometry, so its own visibility bake: its proof against `vis=0` is a browser one (journal Passe FT1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { load, ROOT } from './load.mjs';

const PZ = await load('/src/world/Plazas.ts');
const PV = await load('/src/world/PlazaVisibility.ts');
const RE = await load('/src/simulation/v2react.ts');
(await load('/src/materials/CanvasArt.ts')).setTournamentHeraldry(true);

const lib = { ground: Object.assign(new THREE.ShaderMaterial(), { uniforms: { tGroundMask: { value: null }, uGroundRect: { value: new THREE.Vector4() } } }), slot: new Proxy({}, { get: (o, k) => (o[k] ??= new THREE.MeshBasicMaterial()) }) };
const KINDS = ['forecourt', 'training', 'festival'];
const build = (kind, day, bunting) => PZ.buildPlaza(lib, kind, 1842, { day, ...(bunting ? { bunting } : {}) });
const day = Object.fromEntries(KINDS.map((k) => [k, { 0: build(k, true), 1: build(k, true, 1), 2: build(k, true, 2), 3: build(k, true, 3) }]));

// the garlands' own colours (src/props/Bunting.ts: the blue and ivory pennants, the cord), written here
const PENNANT = [[0.2, 0.3, 0.78], [1.0, 0.94, 0.78], [0.3, 0.26, 0.22]];
const isPennant = (t) => PENNANT.some((c) => Math.abs(c[0] - t[0]) < 1e-6 && Math.abs(c[1] - t[1]) < 1e-6 && Math.abs(c[2] - t[2]) < 1e-6);
/** a slot's triangles, each its three corners and its tint, as keys */
const tris = (b) => {
  const out = [];
  for (let i = 0; i < b.idx.length; i += 3) {
    const v = [b.idx[i], b.idx[i + 1], b.idx[i + 2]];
    out.push({ key: v.map((k) => [b.pos[k * 3], b.pos[k * 3 + 1], b.pos[k * 3 + 2]].map((x) => x.toFixed(5)).join(',')).join('|'), tint: [b.tint[v[0] * 4], b.tint[v[0] * 4 + 1], b.tint[v[0] * 4 + 2]], p: v.map((k) => [b.pos[k * 3], b.pos[k * 3 + 1], b.pos[k * 3 + 2]]) });
  }
  return out;
};
const SLOTS = (await load('/src/core/MeshBuilder.ts')).SLOTS;

test('the tier by the festivity: under 60 the first, from 60 the second, from 90 the third', () => {
  const at = (f) => RE.plazaBunting({ pulse: { festivity: f } });
  for (const [f, t] of [[0, 1], [36, 1], [59, 1], [60, 2], [80, 2], [89, 2], [90, 3], [100, 3]]) assert.equal(at(f), t, `festivity ${f}`);
  assert.deepEqual({ ...RE.BUNTING_AT }, { rising: 60, full: 90 });
});

test('which garland hangs at which tier: the first swag of a row and every other from the first, every swag from the second, the strings and the gateways at the third', () => {
  const H = PZ.buntingHangs;
  for (const site of ['string', 'gateway']) for (const k of [0, 1]) { assert.equal(H(1, site, k), false, `${site} at 1`); assert.equal(H(2, site, k), false, `${site} at 2`); assert.equal(H(3, site, k), true); }
  for (const k of [0, 2, 4, 10]) { assert.equal(H(1, 'swag', k), true, `swag ${k} at 1`); assert.equal(H(2, 'swag', k), true); assert.equal(H(3, 'swag', k), true); }
  for (const k of [1, 3, 9]) { assert.equal(H(1, 'swag', k), false, `swag ${k} at 1`); assert.equal(H(2, 'swag', k), true, `swag ${k} at 2`); assert.equal(H(3, 'swag', k), true); }
  assert.equal(PZ.BUNTING_FULL, 3);
});

test('a square without a tier is its third tier, to the byte; the night hangs nothing whatever the tier', () => {
  for (const k of KINDS) {
    const a = day[k][0], b = day[k][3];
    for (const s of SLOTS) for (const f of ['pos', 'idx', 'tint', 'part', 'uv', 'nrm', 'aux']) assert.deepEqual(b.world.get(s)[f], a.world.get(s)[f], `${k} ${s}.${f}`);
    assert.deepEqual(b.stats, a.stats);
    const n0 = build(k, false), n1 = build(k, false, 1);
    for (const s of SLOTS) assert.deepEqual(n1.world.get(s).pos, n0.world.get(s).pos, `${k} night ${s}`);
    assert.equal(n0.stats.garlands, 0); assert.equal(n0.stats.bunting, 0); assert.equal(n1.stats.garlands, 0);
  }
});

test('each square\'s garlands at each tier: the forecourt 3 / 6 / 8, the lists 3 / 5 / 7, the hall\'s square 6 / 11 / 14', () => {
  const want = { forecourt: [3, 6, 8], training: [3, 5, 7], festival: [6, 11, 14] };
  for (const k of KINDS) for (const t of [1, 2, 3]) { assert.equal(day[k][t].stats.garlands, want[k][t - 1], `${k} tier ${t}`); assert.equal(day[k][t].stats.bunting, t); }
});

test('a tier only takes garlands away: every other slot, part and instance as at the third; the cloth a subset of the third\'s, what leaves only pennants and cords', () => {
  for (const k of KINDS) {
    const full = day[k][3];
    for (const t of [1, 2]) {
      const b = day[k][t];
      assert.equal(b.nParts, full.nParts, `${k} ${t}: parts`); assert.equal(b.stats.instances, full.stats.instances); assert.equal(b.stats.buildings, full.stats.buildings);
      for (const s of SLOTS) if (s !== 'cloth') for (const f of ['pos', 'idx', 'tint', 'part']) assert.deepEqual(b.world.get(s)[f], full.world.get(s)[f], `${k} ${t}: ${s}.${f}`);
      const have = new Map();
      for (const x of tris(full.world.get('cloth'))) have.set(x.key, (have.get(x.key) ?? 0) + 1);
      const kept = tris(b.world.get('cloth'));
      for (const x of kept) { const n = have.get(x.key) ?? 0; assert.ok(n > 0, `${k} ${t}: a cloth triangle the third tier has not`); have.set(x.key, n - 1); }
      const left = [...have.values()].reduce((a, n) => a + n, 0);
      assert.ok(left > 0, `${k} ${t}: something left`);
      const all = tris(full.world.get('cloth')), seen = new Map(kept.map((x) => [x.key, 0]));
      for (const x of kept) seen.set(x.key, seen.get(x.key) + 1);
      for (const x of all) { const n = seen.get(x.key) ?? 0; if (n > 0) { seen.set(x.key, n - 1); continue; } assert.ok(isPennant(x.tint), `${k} ${t}: a non-pennant triangle left (${x.tint})`); }
    }
    // the parts carry the same triangles where nothing hangs: the bake's parts are the third tier's
    assert.equal(day[k][1].world.get('stone').part.length, full.world.get('stone').part.length);
  }
});

test('the lists\' gallery: a swag a bay under its eave, the first, the third and the fifth bay at the first tier, all five from the second', () => {
  // the gallery (src/world/Plazas.ts LISTS): its front at x -16.2, its eave at 6.0 m, its bays' bounds along z
  const X = -16.2 + 0.2, Y = 6.0 - 0.35, BAYS = [-6.4, -3.8, -1.2, 3.2, 6.4, 9.6];
  const bays = (b) => {
    const on = new Set();
    for (const x of tris(b.world.get('cloth'))) {
      if (!isPennant(x.tint) || !x.p.every((v) => Math.abs(v[0] - X) < 0.02 && v[1] <= Y + 0.01 && v[1] > Y - 1.0)) continue;
      const z = (x.p[0][2] + x.p[1][2] + x.p[2][2]) / 3;
      for (let i = 0; i + 1 < BAYS.length; i++) if (z > BAYS[i] && z < BAYS[i + 1]) on.add(i);
    }
    return [...on].sort();
  };
  assert.deepEqual(bays(day.training[1]), [0, 2, 4]);
  assert.deepEqual(bays(day.training[2]), [0, 1, 2, 3, 4]);
  assert.deepEqual(bays(day.training[3]), [0, 1, 2, 3, 4]);
});

test('the page: the square takes the game\'s tier, and the cache keeps every square by night and at each tier by day', () => {
  const page = fs.readFileSync(`${ROOT}/src/ui/playPlaza.ts`, 'utf8'), app = fs.readFileSync(`${ROOT}/src/world/PlazaApp.ts`, 'utf8');
  assert.match(page, /bunting: plazaBunting\(st\)/);
  assert.match(app, /buildPlaza\(this\.lib, this\.opts\.kind, 1842, \{ day: !!this\.look, period: this\.period, bunting: [^}]*this\.opts\.bunting \}\)/);
  // DEV only: `plazabunting=1|2|3` forces a tier (each tier's proofs); a production build reads the game's
  assert.match(app, /import\.meta\.env\.DEV \? Number\(this\.opts\.params\.get\('plazabunting'\)\) : 0/);
  assert.ok(PV.PLAZA_STORE.max >= KINDS.length * (1 + 3), `the cache: ${PV.PLAZA_STORE.max} entries`);
});
