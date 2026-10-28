// The version 2's squares in the Merchant District's language (journal Passe VP1): every wall and roof a visibility part, the bake's poses over
// the whole walkable surface, every dialogue's and cutscene's look and the moves between them, the culling that keeps every part a pose shows
// and only drops whole parts, the cache in entries of its own, a failed bake that keeps everything; the squares' framings (journal Passe VP7:
// three a square, chosen by the hero's zone as the district's graph, the hero always in the frame, the near edge always out of it, no monument
// ever between the camera and the hero; since journal Passe VP9 each square its own axis, its own near edge and its own camera's room); the
// day's bunting and the night's lanterns (J4, J6). The bake itself runs on a GPU: its proof against `vis=0` is a browser one (journal Passe
// VP1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { load } from './load.mjs';

const PZ = await load('/src/world/Plazas.ts');
const PA = await load('/src/world/PlazaApp.ts');
const PV = await load('/src/world/PlazaVisibility.ts');
const PC = await load('/src/world/PlazaCamera.ts');
const CR = await load('/src/app/CameraRig.ts');
const ST = await load('/src/narrative/v2story.ts');
const VP = await load('/src/simulation/v2places.ts');
const SR = await load('/src/atmosphere/ShadowAndReflection.ts');
// the squares fly the tournament's heraldry (journal Passe VP3): their page sets it before it builds them
(await load('/src/materials/CanvasArt.ts')).setTournamentHeraldry(true);

// the squares build without a GPU: a material library of plain materials stands in for the painted one
const lib = { ground: Object.assign(new THREE.ShaderMaterial(), { uniforms: { tGroundMask: { value: null }, uGroundRect: { value: new THREE.Vector4() } } }), slot: new Proxy({}, { get: (o, k) => (o[k] ??= new THREE.MeshBasicMaterial()) }) };
const KINDS = ['forecourt', 'training', 'festival'];
const built = Object.fromEntries(KINDS.flatMap((k) => [false, true].map((day) => [`${k}:${day}`, PZ.buildPlaza(lib, k, 1842, { day })])));

test('every wall and roof is a part; the culling drops whole parts only, keeps what is untracked, and gives everything back', () => {
  for (const [key, b] of Object.entries(built)) {
    assert.ok(b.nParts >= 150, `${key}: ${b.nParts} parts`);
    const all = b.cull(() => true), none = b.cull((p) => p <= 0), again = b.cull(() => true);
    assert.equal(all.hidden, 0); assert.equal(all.hiddenParts, 0);
    assert.equal(none.hiddenParts, b.nParts); assert.equal(none.kept + none.hidden, all.kept);
    assert.ok(none.kept > 0 && none.kept < all.kept * 0.15, `${key}: untracked ${none.kept} of ${all.kept}`);
    assert.deepEqual(again, all, 'reversible');
    // a hidden part that casts a shadow stays in the shadow pass only, never in the image
    b.cull((p) => p <= 0);
    const sh = b.group.children.filter((m) => m.name.endsWith(':shadow-only'));
    assert.ok(sh.length > 0 && sh.every((m) => m.layers.mask === 1 << SR.LAYER_CAST), `${key}: shadow-only casters`);
    b.cull(() => true);
    // one part dropped: exactly its triangles leave
    const one = b.cull((p) => p !== 7); assert.equal(one.hiddenParts, 1); assert.ok(one.hidden > 0 && one.hidden < all.kept / 20);
    b.cull(() => true);
  }
  // the same seed builds the same square
  const again = PZ.buildPlaza(lib, 'forecourt', 1842, { day: true });
  assert.equal(again.nParts, built['forecourt:true'].nParts); assert.equal(again.cull(() => true).kept, built['forecourt:true'].cull(() => true).kept);
});

test('the bake\'s poses: every framing over its zone at every place of the walk and the lanes, the moves between framings, every person\'s look and the way there, every cutscene\'s looks', () => {
  for (const k of KINDS) {
    const b = built[`${k}:false`], poses = PV.plazaBakePoses(k, b);
    assert.ok(poses.every((p) => p.set === 'A'));
    const set = new Set(poses.map((p) => JSON.stringify(p.pose))), has = (pose) => set.has(JSON.stringify(pose));
    // each pose baked once
    assert.equal(set.size, poses.length, `${k}: no pose twice`);
    // the hero's places: the walk and every lane, every 1.5 m, their far corners exactly
    const pts = PV.heroPoints(b);
    for (const R of [b.walk, ...b.lanes]) for (const [cx, cz] of [[R.x0, R.z0], [R.x1, R.z1]]) assert.ok(pts.some(([x, z]) => x === cx && z === cz), `${k}: the corner ${cx},${cz}`);
    for (const [x, z] of pts) for (const f of PC.framingsAround(k, x, z)) assert.ok(has(PC.framingPose(f, x, z)), `${k} ${f.id} at ${x},${z}`);
    // the moves between two framings where their zones meet (the page eases every field: half way, the hero standing or stepping on), on
    // every other column of the grid
    let met = 0;
    for (const [x, z] of pts) {
      const F = PC.framingsAround(k, x, z);
      if (Math.round((x - b.walk.x0) / PV.POSE_STEP) % 2) continue;
      for (const a of F) for (const c of F) if (a !== c) { met++; assert.ok(has(PV.lerpPose(PC.framingPose(a, x, z), PC.framingPose(c, x, z), 0.5)) && has(PV.lerpPose(PC.framingPose(a, x, z), PC.framingPose(c, x, z - PV.POSE_STEP), 0.5)), `${k}: ${a.id} -> ${c.id} at ${x},${z}`); }
    }
    assert.ok(met > 0, `${k}: the framings meet`);
    for (const [x, z] of Object.values(b.spots)) {
      assert.ok(has(PC.lookPose(k, x, z, 9)), `${k}: the look at ${x},${z}`);
      for (const f of PC.framingsAround(k, x, z)) assert.ok(has(PV.lerpPose(PC.framingPose(f, x, z), PC.lookPose(k, x, z, 9), 0.5)), `${k}: the way to ${x},${z} from ${f.id}`);
    }
    for (const c of Object.values(ST.CUTSCENES)) if (VP.PLAZA_OF[c.place] === k) for (const st of c.steps) if ('cam' in st) assert.ok(has(PC.lookPose(k, st.cam[0], st.cam[1], st.dist ?? 14)), `${k}: ${c.id}`);
  }
  // a pose between two is each field between them
  const a = PC.lookPose('forecourt', -9, 2, 9), c = PC.lookPose('forecourt', 9, -15, 14), m = PV.lerpPose(a, c, 0.25);
  for (const f of Object.keys(a)) assert.ok(Math.abs(m[f] - (a[f] + (c[f] - a[f]) * 0.25)) < 1e-12, f);
});

// the camera's room on each square (journal Passe VP9): between the forecourt's rows; on the lists before their south row's fronts (z 14.6, their
// jetties 0.6 m out) and east of their gallery; on the hall's square east of its west row's fronts (x -13.2, from z 6 north) or over the
// quay south of it, and inside the arcades' curve (their houses' fronts 32.1 m from its centre)
const ROOM = { forecourt: (p) => Math.abs(p.x) <= 11.5, training: (p) => p.z <= 13.6 && p.x >= -15.5, festival: (p) => (p.x >= -12.4 || p.z > 6.6) && (Math.hypot(p.x + 18, p.z + 1) <= 31.4 || p.z > 9.6) };
test('the framings: three a square chosen by the hero\'s zone and held 0.9 m past it; the hero always in the frame and over the near edge, no monument between them and the camera nor cut by the frame, the camera between the rows', () => {
  const cam = new THREE.PerspectiveCamera(40, 16 / 9, 0.3, 700), v = new THREE.Vector3();
  const ndc = (x, y, z) => { v.set(x, y, z).applyMatrix4(cam.matrixWorldInverse); if (v.z > -0.3) return null; v.applyMatrix4(cam.projectionMatrix); return [v.x, v.y]; };
  const inside = (r, x, z) => x >= r.x0 && x <= r.x1 && z >= r.z0 && z <= r.z1;
  for (const k of KINDS) {
    const F = PC.PLAZA_FRAMINGS[k], b = built[`${k}:false`];
    assert.ok(F.length >= 3 && F.length <= 4 && new Set(F.map((f) => f.id)).size === F.length, `${k}: three or four framings`);
    // every place the hero can stand is in a framing's own zone
    for (const [x, z] of PV.heroPoints(b, 0.5)) assert.ok(inside(PC.framingAt(k, x, z).zone, x, z), `${k}: a framing at ${x},${z}`);
    // walking up the square's axis (journal Passe VP9: the forecourt's and the hall's from the quay's gate to the monument, the lists' along
    // their wall) and back: each change made 0.9 m past the zone's edge and undone 0.9 m past it the other way (no flicker on a boundary)
    const [[ax, az], [bx, bz]] = PC.PLAZA_AXIS[k], len = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / len, uz = (bz - az) / len;
    let cur = null; const changes = [];
    for (let s = 0; s <= len; s += 0.05) { const x = ax + ux * s, z = az + uz * s, f = PC.framingAt(k, x, z, cur?.id ?? null); if (cur && f !== cur) changes.push([x, z, cur, f]); cur = f; }
    assert.ok(changes.length === F.length - 1, `${k}: ${changes.length} changes up the axis`);
    for (const [x, z, from, to] of changes) {
      assert.equal(PC.framingAt(k, x - ux * 0.8, z - uz * 0.8, to.id), to, `${k}: ${to.id} held stepping back`);
      assert.equal(PC.framingAt(k, x - ux * 1.6, z - uz * 1.6, to.id), to, `${k}: ${to.id} held within its zone grown by the hysteresis`);
      assert.equal(PC.framingAt(k, x - ux * 2.0, z - uz * 2.0, to.id), from, `${k}: ${from.id} again past the hysteresis`);
    }
    // the composition, at every place of the walk clear of what stands there, in every framing it can be seen in, at 16:9
    const tall = b.blockers.filter((o) => (o.h ?? 0) > 1.75), mouths = b.lanes.map((L) => ({ x0: L.x0 - 1.2, x1: L.x1 + 1.2, z0: L.z0 - 0.3, z1: L.z1 + 0.3 }));
    for (const [x, z] of PV.heroPoints(b, 1)) {
      if (!inside(b.walk, x, z) || b.blockers.some((o) => Math.hypot(x - o.x, z - o.z) < o.r + 0.35)) continue;
      for (const f of PC.framingsAround(k, x, z)) {
        CR.applyFrame(cam, PC.framingPose(f, x, z), 16 / 9, PA.PLAZA_FRAME, null);
        const feet = ndc(x, 0, z), head = ndc(x, 1.9, z), at = `${k} ${f.id} at ${x},${z}`;
        assert.ok(feet && Math.abs(feet[0]) <= 0.9 && feet[1] >= -0.92 && head[1] <= 0.9, `${at}: the hero in the frame (${feet})`);
        // the hero's head over the near edge, the frames' foreground (journal Passe VP7, iteration 3: the balustrade; the lists have none)
        const N = PZ.PLAZA_NEAR[k], e = N && ndc(x, N.top, N.z); assert.ok(!e || e[1] <= head[1] - 0.05, `${at}: the near edge over the hero's head (${e})`);
        // the camera in the square's room (beyond it it looked at the end of a row's first house, or from inside one), the monuments whole or
        // out of the frame, never cut by its bottom edge
        assert.ok(ROOM[k](cam.position), `${at}: the camera at ${cam.position.x.toFixed(1)}, ${cam.position.z.toFixed(1)}`);
        for (const [mx, mz, mr, mh] of PZ.PLAZA_MONUMENTS[k]) {
          const cs = []; for (let a = 0; a < 8; a++) for (const y of [0, mh]) cs.push(ndc(mx + Math.cos(a * Math.PI / 4) * mr, y, mz + Math.sin(a * Math.PI / 4) * mr));
          const inn = cs.filter((q) => q && Math.abs(q[0]) < 1 && Math.abs(q[1]) < 1).length, below = cs.filter((q) => !q || (q[1] < -1 && Math.abs(q[0]) < 1)).length;
          assert.ok(!(inn > 0 && below > 0), `${at}: the monument at ${mx},${mz} cut by the bottom edge`);
        }
        // the hero's head never behind a monument (h 3 m and more); behind a stall only away from the people and the ways out
        const key = mouths.some((r) => inside(r, x, z)) || Object.values(b.spots).some(([sx, sz]) => Math.hypot(sx - x, sz - z) < 1.6), t = new THREE.Vector3(x, 1.75, z);
        for (const o of tall) {
          if (o.h < 3 && !key) continue;
          for (let n = 1; n < 40; n++) { const q = cam.position.clone().lerp(t, n / 40); assert.ok(!(q.y < o.h && Math.hypot(q.x - o.x, q.z - o.z) < o.r * 0.8), `${at}: hidden by ${o.x},${o.z} (${o.h} m)`); }
        }
      }
    }
  }
  // the movement keys keep the yaw they were pressed under until released (the district's rule): a framing's change does not turn them
  const app = fs.readFileSync(new URL('../src/world/PlazaApp.ts', import.meta.url), 'utf8');
  assert.match(app, /if \(!ix && !iz\) this\.moveYaw = null;/); assert.match(app, /const yaw = \(this\.moveYaw \?\?= this\.pose\.yaw\)/);
  assert.ok(PA.PLAZA_FRAME >= 2.33, 'the frame covers a 21:9 window');
});

test('the squares spacious (journal Passe VP7): seven tenths of the walk free of what stands there, three quarters of its middle (the walk 2 m in, 3 m on its near side)', () => {
  // the operator's direction, word for word: « les endroits se doivent d'être spacieux et libre avec de la population qui peuple les rues
  // selon les périodes »; the plan's figure: 70 % of the walkable surface free
  for (const k of KINDS) for (const day of [false, true]) {
    const b = built[`${k}:${day}`], W = b.walk; let n = 0, free = 0, nc = 0, fc = 0;
    for (let x = W.x0 + 0.125; x < W.x1; x += 0.25) for (let z = W.z0 + 0.125; z < W.z1; z += 0.25) {
      const f = b.blockers.every((o) => Math.hypot(x - o.x, z - o.z) >= o.r + 0.35); n++; free += f;
      if (x > W.x0 + 2 && x < W.x1 - 2 && z > W.z0 + 2 && z < W.z1 - 3) { nc++; fc += f; }
    }
    assert.ok(free / n >= 0.7, `${k} ${day}: ${(100 * free / n).toFixed(1)} % of the walk free`);
    assert.ok(fc / nc >= 0.75, `${k} ${day}: ${(100 * fc / nc).toFixed(1)} % of its middle free`);
  }
});

test('the bake goes through the district\'s cache in entries of its own; a failed bake keeps everything', () => {
  const cache = fs.readFileSync(new URL('../src/district/BakeCache.ts', import.meta.url), 'utf8');
  assert.match(cache, /const DISTRICT_STORE: BakeStore = \{ prefix: 'hd2d\.visbake\.', index: 'hd2d\.visbake\.index', max: 6 \};/);
  assert.ok(PV.PLAZA_STORE.prefix !== 'hd2d.visbake.' && PV.PLAZA_STORE.index !== 'hd2d.visbake.index');
  const vis = fs.readFileSync(new URL('../src/world/PlazaVisibility.ts', import.meta.url), 'utf8');
  assert.match(vis, /bakeVisibilityCached\(\{ renderer, scene, nParts: place\.nParts, poses, aspect: frame, waterY: 0, opts: \{ fine: null, \.\.\.opts \} \}, mode, PLAZA_STORE\)/);
  const app = fs.readFileSync(new URL('../src/world/PlazaApp.ts', import.meta.url), 'utf8').replace(/\r\n/g, '\n');
  const i = app.indexOf('const v = bakePlaza('), j = app.indexOf('const c = this.place.cull(v.keep);'), e = app.indexOf("console.warn('[plaza] visibility bake failed, every part kept:'");
  assert.ok(i > 0 && j > i && e > j, 'the culling only after a bake that returned');
  assert.match(app, /if \(this\.opts\.params\.get\('vis'\) !== '0'\)/);
});

test('the light, scarce: by day only the fires burn and the bunting is up; at night the lanterns, a few wall lanterns lit near the focus', () => {
  for (const k of KINDS) {
    const day = built[`${k}:true`], night = built[`${k}:false`];
    assert.ok(day.lights.filter((l) => l.day).every((l) => l.kind === 'fire'), `${k}: by day only fires`);
    assert.ok(night.lights.length > day.lights.filter((l) => l.day).length, `${k}: more light at night`);
    const cloth = (b) => { b.cull(() => true); return b.world.get('cloth').vertexCount + b.world.get('banner').vertexCount; };
    assert.ok(cloth(day) > cloth(night), `${k}: the bunting by day`);
  }
});
