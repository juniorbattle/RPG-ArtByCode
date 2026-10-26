// The version 2's squares in the Merchant District's language (journal Passe VP1): every wall and roof a visibility part, the bake's poses over
// the whole walkable surface, every dialogue's and cutscene's look and the moves between them, the culling that keeps every part a pose shows
// and only drops whole parts, the cache in entries of its own, a failed bake that keeps everything; the camera a smooth function of the hero's
// place (what lets a grid sample it); the day's bunting and the night's lanterns (J4, J6). The bake itself runs on a GPU: its proof against
// `vis=0` is a browser one (journal Passe VP1).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as THREE from 'three';
import { load } from './load.mjs';

const PZ = await load('/src/world/Plazas.ts');
const PA = await load('/src/world/PlazaApp.ts');
const PV = await load('/src/world/PlazaVisibility.ts');
const ST = await load('/src/narrative/v2story.ts');
const VP = await load('/src/simulation/v2places.ts');
const SR = await load('/src/atmosphere/ShadowAndReflection.ts');

// the squares build without a GPU: a material library of plain materials stands in for the painted one
const lib = { ground: Object.assign(new THREE.ShaderMaterial(), { uniforms: { tGroundMask: { value: null }, uGroundRect: { value: new THREE.Vector4() } } }), slot: new Proxy({}, { get: (o, k) => (o[k] ??= new THREE.MeshBasicMaterial()) }) };
const KINDS = ['forecourt', 'training', 'festival'];
const built = Object.fromEntries(KINDS.flatMap((k) => [false, true].map((day) => [`${k}:${day}`, PZ.buildPlaza(lib, k, 1842, { day })])));
const poseOf = (k) => (x, z, d) => PA.plazaCamPose(k, x, z, d);

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

test('the bake\'s poses: the walkable surface every 1.5 m and its edges, every person\'s look and the way there, every cutscene\'s looks and their moves', () => {
  for (const k of KINDS) {
    const b = built[`${k}:false`], W = b.walk, poses = PV.plazaBakePoses(k, b, poseOf(k));
    assert.ok(poses.every((p) => p.set === 'A'));
    const same = (a, c) => Object.keys(c).every((f) => Math.abs(a[f] - c[f]) < 1e-9), has = (pose) => poses.some((p) => same(p.pose, pose));
    for (let x = W.x0; x <= W.x1 + 1e-6; x += PV.POSE_STEP) for (let z = W.z0; z <= W.z1 + 1e-6; z += PV.POSE_STEP) assert.ok(has(PA.plazaCamPose(k, x, z, null)), `${k} grid ${x},${z}`);
    for (const x of [W.x0, W.x1]) for (let z = W.z0; z <= W.z1 + 1e-6; z += PV.POSE_STEP) assert.ok(has(PA.plazaCamPose(k, x, z, null)), `${k} edge ${x},${z}`);
    // each pose baked once
    assert.equal(new Set(poses.map((p) => JSON.stringify(p.pose))).size, poses.length);
    for (const [x, z] of Object.values(b.spots)) {
      assert.ok(poses.some((p) => same(p.pose, PA.plazaCamPose(k, x, z, 9))), `${k}: the look at ${x},${z}`);
      assert.ok(poses.some((p) => same(p.pose, PV.lerpPose(PA.plazaCamPose(k, x, z, null), PA.plazaCamPose(k, x, z, 9), 0.5))), `${k}: the way to ${x},${z}`);
    }
    for (const c of Object.values(ST.CUTSCENES)) if (VP.PLAZA_OF[c.place] === k) for (const st of c.steps) if ('cam' in st) assert.ok(poses.some((p) => same(p.pose, PA.plazaCamPose(k, st.cam[0], st.cam[1], st.dist ?? 14))), `${k}: ${c.id}`);
  }
  // a pose between two is each field between them
  const a = PA.plazaCamPose('forecourt', -9, 2, null), c = PA.plazaCamPose('forecourt', 9, -15, 9), m = PV.lerpPose(a, c, 0.25);
  for (const f of Object.keys(a)) assert.ok(Math.abs(m[f] - (a[f] + (c[f] - a[f]) * 0.25)) < 1e-12, f);
});

test('the camera is a smooth function of the hero\'s place (a grid samples it), held inside the square\'s frame', () => {
  for (const k of KINDS) for (let x = -11; x <= 11; x += 0.5) for (let z = -16; z <= 3; z += 0.5) {
    const p = PA.plazaCamPose(k, x, z, null), q = PA.plazaCamPose(k, x + 0.1, z + 0.1, null);
    assert.ok(Math.abs(p.yaw - q.yaw) < 0.01 && Math.abs(p.pitch - q.pitch) < 0.01 && Math.abs(p.dist - q.dist) < 0.1 && Math.abs(p.tx - q.tx) < 0.2 && Math.abs(p.tz - q.tz) < 0.2, `${k} ${x},${z}`);
  }
  // beyond x ±9 and z -15..2 the camera holds its edge pose (the walkable surface's margins and corners give no new pose)
  assert.deepEqual(PA.plazaCamPose('forecourt', 30, 0, null), PA.plazaCamPose('forecourt', 9, 0, null));
  assert.deepEqual(PA.plazaCamPose('forecourt', 11, 3, null), PA.plazaCamPose('forecourt', 9, 2, null));
  assert.ok(PA.PLAZA_FRAME >= 2.33, 'the frame covers a 21:9 window');
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
