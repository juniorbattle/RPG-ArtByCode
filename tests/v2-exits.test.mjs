// The version 2's ways between places (journal Passe VP5, the operator's request: « je veux que les villes soient connecté [...] via des
// entrés/sorties comme dans un final fantasy 9 »): the graph walked both ways, each square's ways out where its rows open (a side street
// under a gateway, the quay's gate in the kerb), each way's lane walkable from the way in to the way out, the arrival inside the square and
// clear of what stands on it, the quay's two ends; only a version 2 game has them. The walk in a browser: tools/exits-proof.mjs. And the
// squares' own walkers: the people's spots and the crowd's points clear of what stands there, the crowd led round it (journal Passe VP6).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { load } from './load.mjs';

const VP = await load('/src/simulation/v2places.ts');
const PZ = await load('/src/world/Plazas.ts');
const SC = await load('/src/architecture/StreetComposer.ts');
(await load('/src/materials/CanvasArt.ts')).setTournamentHeraldry(true);
const src = (f) => fs.readFileSync(new URL(`../${f}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const lib = { ground: Object.assign(new THREE.ShaderMaterial(), { uniforms: { tGroundMask: { value: null }, uGroundRect: { value: new THREE.Vector4() } } }), slot: new Proxy({}, { get: (o, k) => (o[k] ??= new THREE.MeshBasicMaterial()) }) };
const KINDS = ['forecourt', 'training', 'festival'];
const inRect = (r, x, z) => x >= r.x0 - 1e-9 && x <= r.x1 + 1e-9 && z >= r.z0 - 1e-9 && z <= r.z1 + 1e-9;

test('the graph: every way walked both ways, one way per side, the festival, the forecourt and the training ground west to east above the quay', () => {
  const E = VP.V2_EXITS;
  assert.deepEqual(Object.keys(E).sort(), ['district', 'forecourt', 'lanterns', 'training']);
  for (const [place, ways] of Object.entries(E)) {
    assert.equal(new Set(ways.map((w) => w.side)).size, ways.length, `${place}: one way per side`);
    for (const w of ways) {
      const back = E[w.to].find((x) => x.to === place);
      assert.ok(back, `${place} -> ${w.to} and back`);
      // a west way comes back by an east one; the quay's ends come back by the squares' south gates
      const opposite = { west: 'east', east: 'west', south: null }[w.side];
      if (place === 'district') assert.equal(back.side, 'south'); else if (w.to === 'district') assert.equal(w.side, 'south'); else assert.equal(back.side, opposite);
      assert.equal(VP.arrivalSide(w.to, place), back.side);
    }
  }
  assert.equal(VP.arrivalSide('forecourt', 'nowhere'), null);
  // every version 2 place is reached from the quay
  const seen = new Set(['district']), todo = ['district'];
  while (todo.length) for (const w of E[todo.pop()]) if (!seen.has(w.to)) { seen.add(w.to); todo.push(w.to); }
  assert.deepEqual([...seen].sort(), ['district', 'forecourt', 'lanterns', 'training']);
});

test('each square: its ways out are its place\'s, a row opens where a side street leaves, the lane walked from the way in to the way out', () => {
  for (const k of KINDS) for (const day of [false, true]) {
    const b = PZ.buildPlaza(lib, k, 1842, { day }), place = PZ.PLACE_OF_KIND[k];
    assert.deepEqual(b.exits.map((e) => `${e.side}:${e.to}`).sort(), VP.V2_EXITS[place].map((e) => `${e.side}:${e.to}`).sort(), k);
    assert.deepEqual(Object.keys(PZ.OPEN_AFTER[k]).sort(), VP.V2_EXITS[place].filter((e) => e.side !== 'south').map((e) => e.side).sort(), `${k}: the rows open on the ways' sides`);
    for (const e of b.exits) {
      // the lane overlaps the square's edge (one walks into it) and reaches past the way out
      const W = b.walk, L = e.lane;
      assert.ok(L.x0 <= W.x1 && L.x1 >= W.x0 && L.z0 <= W.z1 && L.z1 >= W.z0, `${k} ${e.side}: the lane meets the square`);
      // the way in: inside the walk, clear of everything standing on the square, not already out
      const [sx, sz] = e.spawn;
      assert.ok([W, ...b.lanes].some((r) => inRect(r, sx, sz)), `${k} ${e.side}: arrival inside the walk`);
      for (const o of b.blockers) assert.ok(Math.hypot(sx - o.x, sz - o.z) >= o.r + 0.3, `${k} ${e.side}: arrival clear of a blocker at ${o.x},${o.z}`);
      assert.ok(!inRect(e.out, sx, sz), `${k} ${e.side}: arriving does not leave`);
      // walking out from the way in, with the square's own walk (src/world/Plazas.ts walkTo), reaches the way out
      const dir = e.side === 'west' ? [-1, 0] : e.side === 'east' ? [1, 0] : [0, 1];
      let x = sx, z = sz, n = 0;
      while (!inRect(e.out, x, z) && n++ < 200) [x, z] = PZ.walkTo(b, x, z, x + dir[0] * 0.1, z + dir[1] * 0.1);
      assert.ok(inRect(e.out, x, z) && inRect(e.lane, x, z), `${k} ${e.side}: walked out at ${x.toFixed(2)},${z.toFixed(2)}`);
      // its sign: the anchor over the lane's mouth
      assert.ok(Math.abs(e.anchor[2] - (L.z0 + L.z1) / 2) < 0.01 || e.side === 'south', `${k} ${e.side}: the sign over the lane`);
    }
    // outside a lane the square's edge still holds
    assert.deepEqual(PZ.walkTo(b, -5, 2, -5, 20), [-5, b.walk.z1], `${k}: the kerb holds beside the quay's gate`);
  }
});

test('the quay\'s two ends (a version 2 game\'s town only): arrivals inside its walk, the page\'s ways from the graph', () => {
  const W = SC.WALK, t = src('src/ui/playTown.ts');
  assert.match(t, /const ways = isV2\(st\) \? V2_EXITS\.district\.map/);
  assert.match(t, /const arrive = isV2\(st\) \? b\.params\.get\('arrive'\) : null;/);
  for (const [x, z] of [[W.x1 - 1.4, 0], [W.x0 + 1.2, 0.6]]) assert.ok(x > W.x0 && x < W.x1 && z > W.z0 && z < W.z1);
  // the browser proof walks the same ways
  const tool = src('tools/exits-proof.mjs');
  for (const [place, ways] of Object.entries(VP.V2_EXITS)) for (const w of ways) assert.ok(tool.includes(`{ to: '${w.to}', side: '${w.side}' }`), `the proof walks ${place} -> ${w.to}`);
  // the squares' page goes through the same move and arrives by the way in
  const p = src('src/ui/playPlaza.ts');
  assert.match(p, /arriveFrom: b\.params\.get\('arrive'\)/);
  assert.match(p, /if \(r\.ok\) go\(b\.params, \{ arrive: from \}\)/);
});

test('the squares\' walkers: spots and crowd points clear of what stands on the square, every walk between two points led round it', () => {
  for (const k of KINDS) {
    const b = PZ.buildPlaza(lib, k, 1842, { day: false }), big = b.blockers.filter((o) => o.r >= 1);
    // (a person may stand at a stall or a table: the large things only, the fountain, the bandstand, the pavilions, the towers)
    for (const [id, [x, z]] of Object.entries(b.spots)) for (const o of big) if (o.r >= 2) assert.ok(Math.hypot(x - o.x, z - o.z) >= o.r, `${k}: ${id} clear of ${o.x},${o.z}`);
    for (const [x, z] of b.wander) for (const o of big) assert.ok(Math.hypot(x - o.x, z - o.z) >= o.r + 0.45, `${k}: crowd point ${x},${z} clear of ${o.x},${o.z}`);
    // the page's walk (PlazaApp: 0.8 x a townsperson's 1.4 m/s, 1/60 s steps), from every point to every other
    for (const a of b.wander) for (const c of b.wander) {
      if (a === c) continue;
      let x = a[0], z = a[1], n = 0, deepest = 0;
      while (Math.hypot(c[0] - x, c[1] - z) > 0.3 && n++ < 6000) {
        const d = Math.hypot(c[0] - x, c[1] - z), [ux, uz] = PZ.steer(b.blockers, x, z, (c[0] - x) / d, (c[1] - z) / d);
        x += (ux * 1.12) / 60; z += (uz * 1.12) / 60;
        for (const o of big) deepest = Math.max(deepest, o.r - Math.hypot(x - o.x, z - o.z));
      }
      assert.ok(n < 6000, `${k}: ${a} -> ${c} arrives`);
      assert.ok(deepest < 0.5, `${k}: ${a} -> ${c} kept out of what stands there (${deepest.toFixed(2)} m in)`);
    }
  }
});
