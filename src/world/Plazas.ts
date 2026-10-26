import * as THREE from 'three';
import { Rng } from '../core/rng';
import { SlotSet, MeshBuilder, mat, SLOTS, type V3, type Slot } from '../core/MeshBuilder';
import { fbm, smoothstep } from '../core/noise';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import type { LightDef } from '../atmosphere/LightRig';
import { LAYER_CAST, LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import { InstanceBatch } from '../props/PropGenerator';
import { addBanner } from '../props/Banners';
import { createMerchantBuilding } from '../architecture/BuildingGenerator';
import { farHouse, farMaterial } from '../district/DistantCity';
import type { Emitter } from '../district/MerchantDistrictGenerator';

/** The open places of the version 2 (lot V5 of briefs/cloud-session-v2-brief.md, journal Passe V5; the operator's principle, word for word:
 *  « Avec une volonte de respecter nos structure etabli dans district merchant mais en y ajout plus de profondeur, surtout pour la place
 *  principal et training, je veux que les zones est plus d'espaces et non un long couloir comme district merchant »). Built only from the
 *  Merchant District's own generators (its timber houses, lamp posts, lanterns, barrels, crates, hay, its banners, its far-city modules), as
 *  Lantern Row was, but open: a square to walk across (a surface, not a quay), houses on three sides, the fourth open to the camera.
 *  - the forecourt (the main square): the Colosseum's wall and gate to the north, the registrar's table, the armourer, the healer's corner, a
 *    fountain at its heart, the tournament's banners (identity: the spectacle; function: registration, care, armour; by day the crowds and
 *    the bunting, at night the gate shut and the guards' braziers);
 *  - the training ground: three sand rings, practice posts, weapon racks, the weapon master's shed (identity: sweat; function: drills,
 *    skills, challenges; by day only: it closes at dusk);
 *  - the festive square (in the place of the Lantern Row mock-up, L7-3): stalls, a stage, strings of paper lanterns (identity: the festival;
 *    function: trinkets, the tavern, the night's talk; by day games and stalls, at night lanterns, taverns and the hooded).
 *  Layout (metres): the square spans x -11..11, z -16..3; the camera stands south (+z) looking north. Every number « proposé ». */

import type { PlazaKind } from '../simulation/v2places';
export type { PlazaKind };

export interface PlazaBuild {
  group: THREE.Group; lights: Array<LightDef & { day?: boolean }>; emitters: Emitter[];
  /** the walkable surface and what stands on it (circles) */
  walk: { x0: number; x1: number; z0: number; z1: number }; blockers: Array<{ x: number; z: number; r: number }>;
  /** where the people stand (person id -> x, z), where the crowd walks */
  spots: Record<string, [number, number]>; wander: Array<[number, number]>;
  stats: { triangles: number; instances: number; buildings: number };
  dispose(): void;
}

const WARM: [number, number, number] = [1.0, 0.6, 0.27];
const FIRE: [number, number, number] = [1.0, 0.5, 0.2];
const W = { x0: -11, x1: 11, z0: -16, z1: 3 };
/** the walkable surface of every square (metres) */
export const PLAZA_WALK: Readonly<typeof W> = W;
/** where the people stand on each square (person or extra id -> x, z): the registrar's table, the armourer's stall, the healer's corner, the
 *  champion by the ring, the guards at the gate; the master's shed, the rings; the stalls, the tavern's door, the stage (« proposé ») */
export const PLAZA_SPOTS: Record<PlazaKind, Record<string, [number, number]>> = {
  forecourt: { odo: [-6.5, -9.2], hilde: [7.0, -10.2], anwen: [7.0, -1.0], guardA: [-3.0, -15.3], guardB: [3.0, -15.3], marek: [3.5, -5.0], orla: [-3.5, -3.5], vessa: [-1.5, -12.0], ilse: [4.8, -13.0] },
  training: { corvin: [-5.5, -15.0], orla: [4.5, -7.6], ilse: [-2.4, -7.0], vessa: [1.0, -10.0], drill: [-6.2, -4.2] },
  festival: { pip: [-7.0, -6.0], lio: [-6.0, -15.0], cassius: [2.2, -11.0], hooded: [9.6, -14.8], bard: [0, -14.4] },
};
/** the points the crowd walks between */
export const PLAZA_WANDER: Record<PlazaKind, Array<[number, number]>> = {
  forecourt: [[-8, 1], [8, 1], [-8, -14], [8, -14], [-4, -4], [4, -9], [0, 0], [-2, -14]],
  training: [[-8, 1], [8, 1], [-1, -1], [7, -11], [-8, -10], [0, -6]],
  festival: [[-5, 1], [5, 1], [0, -5], [-4, -11], [4, -3], [5, -10], [-1, -1]],
};

export function buildPlaza(lib: MaterialLibrary, kind: PlazaKind, seed: number, opts: { day: boolean }): PlazaBuild {
  const rng = new Rng(seed).fork(`plaza:${kind}`);
  const group = new THREE.Group(); group.name = `plaza:${kind}`;
  const S = new SlotSet(), batch = new InstanceBatch(seed ^ 0x9a2a, 3);
  const lights: PlazaBuild['lights'] = [], emitters: Emitter[] = [], blockers: PlazaBuild['blockers'] = [], disposables: Array<{ dispose(): void }> = [];
  const spots: PlazaBuild['spots'] = { ...PLAZA_SPOTS[kind] }, wander: PlazaBuild['wander'] = [...PLAZA_WANDER[kind]];
  let buildings = 0;
  const house = (pos: V3, yaw: number, r: Rng, o: { width: number; floors: number; shop?: 'house' | 'general' | 'tavern' | 'apothecary'; detail?: number }) => {
    const res = createMerchantBuilding({
      floors: o.floors, width: o.width, asymmetry: 0.5, overhang: 0.5, timberRatio: 0.55, shopType: o.shop ?? 'house', roofStyle: r.bool(0.3) ? 'crooked' : 'gable',
      seed: r.seed, chimney: r.bool(0.6), balcony: r.bool(0.3), dormers: r.int(0, 1), palette: r.pick(['slate', 'ash', 'mist', 'dusk', 'stone'] as const), detail: o.detail ?? 0.8,
      lit: opts.day ? 0 : 0.7, stoneGround: r.bool(0.5),
    });
    S.append(res.slots, mat(pos, yaw));
    for (const l of res.lights) lights.push({ ...l, pos: xf(l.pos, pos, yaw), priority: Math.min(l.priority ?? 5, 6) });
    if (res.params.chimney) emitters.push({ kind: 'chimney', pos: xf([res.width * 0.2, res.ridgeY + 0.9, -res.depth * 0.5], pos, yaw), rate: 0.5 });
    buildings++;
  };
  // the two side rows, facing the square (west faces +x, east faces -x), from the camera's side to the north
  for (const side of [-1, 1]) {
    let z = 4;
    for (let i = 0; i < 4; i++) {
      const r = rng.fork(`row${side}:${i}`), width = r.range(5.2, 6.8);
      house([side * 13.2, 0, z - width / 2], side < 0 ? Math.PI / 2 : -Math.PI / 2, r, { width, floors: r.int(2, 4), shop: kind === 'festival' && i === 1 ? 'tavern' : r.pick(['house', 'general', 'house', 'apothecary'] as const) });
      z -= width + r.range(0.1, 0.4);
    }
  }
  const lamp = (x: number, z: number, yaw = 0) => {
    batch.add('lampPost', { pos: [x, 0, z], yaw, scale: 1 }, 0);
    lights.push({ pos: xf([0.52, 3.2 - 0.38, 0], [x, 0, z], yaw), color: WARM, intensity: 2.0, radius: 5.5, kind: 'lantern', halo: 1.4, priority: 8 });
    blockers.push({ x, z, r: 0.35 });
  };
  const brazier = (x: number, z: number) => {
    S.at([x, 0, z], 0, () => S.get('metal').cylinder(0.32, 0.9, 1.15, 8, { tint: [0.35, 0.33, 0.32], capBottom: true, r1: 0.42 }));
    S.get('metal').box(x, 0.45, z, 0.12, 0.9, 0.12);
    S.get('glow').box(x, 1.12, z, 0.5, 0.08, 0.5, { tint: [1, 0.55, 0.2] });
    lights.push({ pos: [x, 1.6, z], color: FIRE, intensity: 2.4, radius: 6, kind: 'fire', halo: 1.6, priority: 9, day: true });
    emitters.push({ kind: 'chimney', pos: [x, 1.4, z], rate: 0.3 });
    blockers.push({ x, z, r: 0.5 });
  };
  const trestleStall = (x: number, z: number, yaw: number, tint: V3, wares: string[]) => {
    S.at([x, 0, z], yaw, () => {
      const P = S.get('planks'), C = S.get('cloth'), T = S.get('timber');
      P.box(0, 0.86, 0, 2.4, 0.08, 0.9, { grain: 'x' });
      for (const [a, b] of [[-1.1, -0.38], [1.1, -0.38], [-1.1, 0.38], [1.1, 0.38]]) T.box(a, 0.43, b, 0.08, 0.86, 0.08);
      for (const a of [-1.15, 1.15]) T.box(a, 1.35, -0.42, 0.07, 2.7, 0.07);
      C.quad([-1.35, 2.7, -0.5], [1.35, 2.7, -0.5], [1.35, 2.2, 0.75], [-1.35, 2.2, 0.75], { tint, aux: [0.4, 0, 0, 0] });
    });
    wares.forEach((k, i) => batch.add(k, { pos: xf([-0.8 + i * 0.55, 0.9, 0], [x, 0, z], yaw), yaw: yaw + i, scale: 0.6 }));
    blockers.push({ x, z, r: 1.4 });
  };

  if (kind === 'forecourt') {
    // ---------------------------------------------------------------- the Colosseum's wall and gate, the drum rising behind
    const St = S.get('stone'), Dk = S.get('dark');
    St.boxMM(-14, 0, -21, 14, 13, -18.6, { tint: [0.78, 0.74, 0.68], aoY: [0.7, 1] });
    St.boxMM(-14.4, 12.6, -21.4, 14.4, 13.4, -18.2, { tint: [0.7, 0.66, 0.6] });
    for (let i = -6; i <= 6; i++) {
      const x = i * 2.2;
      St.boxMM(x - 0.32, 0, -18.6, x + 0.32, 12.6, -18.1, { tint: [0.84, 0.8, 0.72] });
      if (Math.abs(i) > 1) Dk.boxMM(x + 0.42, 7.4, -18.62, x + 1.78, 10.6, -18.58, { tint: [0.06, 0.06, 0.08] });
    }
    // the gate: a tall dark arch, shut at night by its doors (planks), open by day onto the sand's glow
    Dk.boxMM(-2.4, 0, -18.66, 2.4, 6.4, -18.55, { tint: opts.day ? [0.16, 0.13, 0.1] : [0.04, 0.04, 0.05] });
    if (!opts.day) S.get('planks').boxMM(-2.3, 0, -18.5, 2.3, 6.2, -18.35, { grain: 'y', tint: [0.42, 0.32, 0.24] });
    St.boxMM(-2.9, 6.4, -18.7, 2.9, 7.2, -18.1, { tint: [0.86, 0.82, 0.74] });
    // the drum of the Colosseum beyond the wall
    S.at([0, 0, -58], 0, () => S.get('stone').cylinder(36, 0, 26, 40, { tint: [0.62, 0.6, 0.58] }));
    addBanner(S, { pos: [-7.7, 11.4, -18.0], yaw: 0, w: 1.1, h: 3.4, emblem: 'tankard', shape: 'swallow', loose: 0.4, tint: [0.5, 0.6, 0.95] });
    addBanner(S, { pos: [7.7, 11.4, -18.0], yaw: 0, w: 1.1, h: 3.4, emblem: 'scales', shape: 'swallow', loose: 0.4, tint: [0.5, 0.6, 0.95] });
    addBanner(S, { pos: [0, 10.4, -17.9], yaw: 0, w: 1.6, h: 2.4, emblem: 'scales', shape: 'rect', loose: 0.3, tint: [0.95, 0.88, 0.62] });
    // the fountain at the square's heart
    S.at([0, 0, -7], 0, () => {
      St.cylinder(2.3, 0, 0.6, 18, { tint: [0.7, 0.68, 0.64], capTop: true });
      St.cylinder(0.45, 0.6, 2.6, 10, { tint: [0.76, 0.72, 0.66], capTop: true });
      S.get('glow').cylinder(1.9, 0.58, 0.62, 18, { tint: [0.45, 0.6, 0.75], capTop: true });
    });
    blockers.push({ x: 0, z: -7, r: 2.6 });
    // the registrar's table, the armourer's stall, the healer's corner (a canvas lean-to)
    trestleStall(-6.5, -10.5, 0.15, [0.62, 0.66, 0.86], ['chalkboard', 'basket']);
    trestleStall(7.2, -11.5, -0.2, [0.78, 0.5, 0.4], ['crate', 'barrel', 'crate']);
    trestleStall(7.6, -2.2, -0.6, [0.9, 0.88, 0.8], ['pot', 'basket', 'bucket']);
    for (const [x, z] of [[-9, -1], [9, 1], [-9, -13], [9, -13]] as Array<[number, number]>) lamp(x, z);
    if (!opts.day) { brazier(-3.4, -16.2); brazier(3.4, -16.2); }
  } else if (kind === 'training') {
    // ---------------------------------------------------------------- the sand rings, the posts, the racks, the master's shed
    const D = S.get('decal'), T = S.get('timber'), P = S.get('planks');
    for (const [cx, cz, r] of [[-5, -7, 3.4], [4.5, -5, 3.0], [1, -12.5, 2.8]] as Array<[number, number, number]>) {
      for (let k = 0; k < 24; k++) {
        const a0 = (k / 24) * Math.PI * 2, a1 = ((k + 1) / 24) * Math.PI * 2;
        D.quad([cx, 0.012, cz], [cx + Math.cos(a1) * r, 0.012, cz + Math.sin(a1) * r], [cx + Math.cos(a0) * r, 0.012, cz + Math.sin(a0) * r], [cx, 0.012, cz], { tint: [0.86, 0.74, 0.52] });
      }
      // a low timber ring fence around the sand, broken at the camera's side
      for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; if (Math.sin(a) > 0.75) continue; T.box(cx + Math.cos(a) * (r + 0.15), 0.35, cz + Math.sin(a) * (r + 0.15), 0.1, 0.7, 0.1); }
      // the practice post at the ring's heart
      blockers.push({ x: cx, z: cz, r: 0.6 });
      S.at([cx, 0, cz], 0, () => T.cylinder(0.14, 0, 1.8, 6, { tint: [0.5, 0.4, 0.3], capTop: true }));
    }
    // weapon racks along the west, hay bales and buckets at the rings
    for (let i = 0; i < 3; i++) { const z = -2 - i * 4.5; P.box(-10.2, 1.0, z, 0.12, 0.12, 2.2, { grain: 'z' }); P.box(-10.2, 0.4, z, 0.12, 0.12, 2.2, { grain: 'z' }); for (const dz of [-1, 1]) T.box(-10.2, 0.7, z + dz, 0.1, 1.4, 0.1); blockers.push({ x: -10.2, z, r: 1.2 }); }
    for (const [x, z, k] of [[-1.8, -3.5, 'hay'], [-1.4, -4.4, 'hay'], [7.8, -8, 'bucket'], [7.4, -8.5, 'barrel'], [-8.6, -12, 'crate'], [8.4, -1.5, 'hay']] as Array<[number, number, string]>) { batch.add(k, { pos: [x, 0, z], yaw: x + z }); blockers.push({ x, z, r: 0.6 }); }
    // the master's shed and the barracks, north, facing the yard
    house([-5.5, 0, -18], 0, rng.fork('shed'), { width: 9, floors: 2, shop: 'general' });
    house([5.5, 0, -18], 0, rng.fork('barracks'), { width: 9, floors: 3 });
    addBanner(S, { pos: [-5.5, 4.6, -17.6], yaw: 0, w: 0.9, h: 1.8, emblem: 'scales', shape: 'pennant', loose: 0.5, tint: [0.5, 0.6, 0.95] });
    for (const [x, z] of [[-9, 1], [9, 1], [0, -16]] as Array<[number, number]>) lamp(x, z);
  } else {
    // ---------------------------------------------------------------- the stalls, the stage, the lanterns over the square
    house([-6, 0, -18], 0, rng.fork('north0'), { width: 8, floors: 3, shop: 'tavern' });
    house([5.5, 0, -18], 0, rng.fork('north1'), { width: 9, floors: 3, shop: 'general' });
    const P = S.get('planks'), T = S.get('timber');
    P.boxMM(-3.2, 0, -16.2, 3.2, 0.9, -12.8, { grain: 'x', tint: [0.62, 0.5, 0.38] });
    for (const x of [-3, 3]) T.box(x, 2.4, -16, 0.16, 3.0, 0.16);
    S.get('cloth').quad([-3.2, 3.9, -16.1], [3.2, 3.9, -16.1], [3.2, 3.3, -15.2], [-3.2, 3.3, -15.2], { tint: [0.55, 0.6, 0.9], aux: [0.3, 0, 0, 0] });
    blockers.push({ x: -1.6, z: -14.5, r: 1.9 }, { x: 1.6, z: -14.5, r: 1.9 });
    trestleStall(-7.2, -7.5, 0.4, [0.86, 0.5, 0.42], ['pot', 'basket', 'pot']);
    trestleStall(-7.6, -1.5, 0.2, [0.62, 0.7, 0.9], ['lantern', 'basket']);
    trestleStall(7.2, -6.5, -0.35, [0.9, 0.8, 0.5], ['barrel', 'crate']);
    trestleStall(7.8, -12.0, -0.2, [0.7, 0.55, 0.8], ['basket', 'pot', 'basket']);
    for (const [x, z] of [[-2.5, -3], [2.4, -9], [-1.2, -9.4]] as Array<[number, number]>) { batch.add('stool', { pos: [x, 0, z], yaw: x }); batch.add('barrel', { pos: [x + 0.6, 0, z - 0.3], yaw: z }); blockers.push({ x, z, r: 0.7 }); }
    // strings of paper lanterns across the square (lit at night)
    for (let k = 0; k < 5; k++) {
      const z = -1.5 - k * 3.2, y = 5.2 + Math.sin(k * 1.3) * 0.3;
      for (const t of [-0.7, -0.35, 0, 0.35, 0.7]) batch.add(opts.day ? 'lanternDark' : k % 2 ? 'lantern' : 'lanternDark', { pos: [t * 13, y - Math.abs(t) * -0.5, z], yaw: k * 0.6, scale: 0.9 });
      if (k % 2 === 1) lights.push({ pos: [0, y - 0.3, z], color: WARM, intensity: 1.7, radius: 7, kind: 'lantern', halo: 1.3, priority: 8 });
    }
    for (const [x, z] of [[-9.5, 1.5], [9.5, 1.5]] as Array<[number, number]>) lamp(x, z);
  }

  // ---------------------------------------------------------------- the city beyond, the ground
  const far = new MeshBuilder();
  {
    const r = rng.fork('far');
    let id = 500;
    for (let n = 0; n < 18; n++) { const a = r.range(-0.9, 0.9); farHouse(far, { x: Math.sin(a) * r.range(34, 60), y: 0, z: -Math.cos(a) * r.range(34, 60), w: r.range(5, 9), d: r.range(5, 8), h: r.range(8, 16), wall: [0.3, 0.31, 0.36], roof: [0.12, 0.14, 0.2], id: id++, lit: opts.day ? 0 : r.range(0.2, 0.7) }); }
  }
  const farMat = farMaterial(); disposables.push(farMat);
  if (opts.day) { farMat.defines = { ...farMat.defines, DAY: 1 }; farMat.needsUpdate = true; }
  const farMesh = new THREE.Mesh(far.toGeometry(), farMat); farMesh.name = 'plaza:far'; farMesh.frustumCulled = false;
  group.add(farMesh);
  const RECT = { x0: -16, z0: -24, w: 32, h: 32 };
  {
    const mw = 256, mh = 256, mask = new Uint8Array(mw * mh * 4);
    for (let j = 0; j < mh; j++) for (let i = 0; i < mw; i++) {
      const x = RECT.x0 + ((i + 0.5) / mw) * RECT.w, z = RECT.z0 + ((j + 0.5) / mh) * RECT.h, edge = Math.min(13 - Math.abs(x), 18 + z);
      const pud = opts.day ? 0 : smoothstep(0.62, 0.78, fbm(x * 0.18 + 5, z * 0.18 + 2, 0, 4, 5)) * smoothstep(0.5, 2, edge) * 0.7;
      const k = (j * mw + i) * 4;
      mask[k] = pud * 230; mask[k + 1] = (0.2 + 0.35 * fbm(x * 0.5, z * 0.5, 0, 3, 2)) * 255;
      mask[k + 2] = 0; mask[k + 3] = (1 - 0.45 * Math.exp(-Math.max(0, edge) / 0.5)) * 255;
    }
    const tex = new THREE.DataTexture(mask, mw, mh, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.colorSpace = THREE.NoColorSpace; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true; disposables.push(tex);
    lib.ground.uniforms.tGroundMask.value = tex;
    lib.ground.uniforms.uGroundRect.value.set(RECT.x0, RECT.z0, RECT.w, RECT.h);
    const g = new THREE.PlaneGeometry(80, 80); g.rotateX(-Math.PI / 2); g.translate(0, 0, -14);
    const ground = new THREE.Mesh(g, lib.ground); ground.name = 'plaza:ground'; ground.layers.set(LAYER_NOREFLECT); ground.frustumCulled = false;
    group.add(ground);
  }
  let triangles = far.triCount;
  for (const s of SLOTS) {
    const b = S.get(s as Slot);
    if (!b.vertexCount) continue;
    const mesh = new THREE.Mesh(b.toGeometry(), lib.slot[s as Slot]);
    mesh.name = `plaza:${s}`; mesh.frustumCulled = false;
    if (s === 'decal') { mesh.layers.set(LAYER_NOREFLECT); mesh.renderOrder = 2; }
    else if (s !== 'leaf' && s !== 'cloth' && s !== 'banner') mesh.layers.enable(LAYER_CAST);
    triangles += b.triCount;
    group.add(mesh);
  }
  const props = batch.build(lib.slot, (o, s) => { if (s !== 'leaf' && s !== 'cloth' && s !== 'glow') o.layers.enable(LAYER_CAST); });
  group.add(props);
  return {
    group, lights, emitters, walk: { ...W }, blockers, spots, wander, stats: { triangles, instances: batch.instanceCount, buildings },
    dispose() { group.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); }); batch.dispose(); for (const d of disposables) d.dispose(); },
  };
}

const xf = (p: V3, pos: V3, yaw: number): V3 => { const c = Math.cos(yaw), s = Math.sin(yaw); return [pos[0] + p[0] * c + p[2] * s, pos[1] + p[1], pos[2] - p[0] * s + p[2] * c]; };

/** the walkable rule: inside the square, outside every blocker (the hero slides along their edge) */
export function walkTo(b: Pick<PlazaBuild, 'walk' | 'blockers'>, x: number, z: number, nx: number, nz: number, radius = 0.35): [number, number] {
  let px = Math.max(b.walk.x0, Math.min(b.walk.x1, nx)), pz = Math.max(b.walk.z0, Math.min(b.walk.z1, nz));
  for (const k of b.blockers) {
    const dx = px - k.x, dz = pz - k.z, d = Math.hypot(dx, dz), min = k.r + radius;
    if (d < min) { if (d < 1e-6) { px = x; pz = z; } else { px = k.x + (dx / d) * min; pz = k.z + (dz / d) * min; } }
  }
  return [px, pz];
}
