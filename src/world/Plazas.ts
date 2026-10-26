import * as THREE from 'three';
import { Rng } from '../core/rng';
import { SlotSet, MeshBuilder, mat, SLOTS, type V3, type Slot } from '../core/MeshBuilder';
import { fbm, smoothstep } from '../core/noise';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import type { LightDef } from '../atmosphere/LightRig';
import { LAYER_CAST, LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import { InstanceBatch, trestle } from '../props/PropGenerator';
import { addBanner } from '../props/Banners';
import { garland } from '../props/Bunting';
import { stall, type StallKind } from '../props/MarketGenerator';
import { createMerchantBuilding } from '../architecture/BuildingGenerator';
import type { Socket, ShopType, RoofStyle } from '../architecture/Types';
import type { MaskObstacle, MaskBlob } from '../architecture/StreetComposer';
import { farHouse, farMaterial } from '../district/DistantCity';
import type { Emitter } from '../district/MerchantDistrictGenerator';
import type { PlazaKind } from '../simulation/v2places';
export type { PlazaKind };

/** The open places of the version 2 (lot V5 of briefs/cloud-session-v2-brief.md, journal Passe V5; the operator's principle, word for word:
 *  « Avec une volonte de respecter nos structure etabli dans district merchant mais en y ajout plus de profondeur, surtout pour la place
 *  principal et training, je veux que les zones est plus d'espaces et non un long couloir comme district merchant »). Rebuilt in journal
 *  Passe VP1 in the Merchant District's own language, after an audit against it: its generators and its numbers (the frontage's timber
 *  ratio, asymmetry, lit windows), a back row whose upper floors read over the front ridgeline, the light as the scarce resource (a lamp
 *  rhythm along the open side, a few wall lanterns lit near the focal point and the rest dark, the market's stalls with their key light under
 *  the canvas), a ground mask (grime at the bases, worn paths between the focal points, puddles where the lamps catch them), the
 *  tournament's bunting by day only, heraldry as a focal accent. Each square around one focal point:
 *  - the forecourt (the main square): the Colosseum's curved arcade facade and its gate to the north, the fountain at the heart, the registrar,
 *    the armourer, the healer;
 *  - the training ground: three raised sand rings with their fences and practice dummies, the weapon racks, the master's shed;
 *  - the festive square (in the place of the Lantern Row mock-up, L7-3): the stage, the market stalls, strings of lanterns at night and of
 *    pennants by day, the tavern.
 *  Every wall and roof is a visibility part (src/world/PlazaVisibility.ts: what no pose of the square shows leaves the frame).
 *  Layout (metres): the square spans x -11..11, z -16..3; the camera stands south (+z) looking north. Every number « proposé ». */

export interface PlazaBuild {
  group: THREE.Group; lights: Array<LightDef & { day?: boolean }>; emitters: Emitter[];
  /** the walkable surface and what stands on it (circles) */
  walk: { x0: number; x1: number; z0: number; z1: number }; blockers: Array<{ x: number; z: number; r: number }>;
  /** where the people stand (person id -> x, z), where the crowd walks */
  spots: Record<string, [number, number]>; wander: Array<[number, number]>;
  stats: { triangles: number; instances: number; buildings: number; parts: number };
  /** the static geometry and its visibility parts (1..nParts; 0 = untracked, always drawn), for the visibility bake */
  world: SlotSet; far: MeshBuilder; nParts: number;
  /** rebuild the static meshes keeping the parts `keep` says are seen (the others leave every per-frame pass; a hidden caster stays in the
   *  shadow pass only); returns the triangles kept and hidden */
  cull(keep: (part: number) => boolean): { kept: number; hidden: number; hiddenParts: number };
  dispose(): void;
}

const WARM: V3 = [1.0, 0.6, 0.27];
const FIRE: V3 = [1.0, 0.5, 0.2];
/** the Merchant District's frontage numbers (DEFAULT_CONFIG): the squares' houses share them (the first build used more timber and more lit
 *  windows than the district) */
const COMMON = { asymmetry: 0.42, timberRatio: 0.32, roofExaggeration: 0.95, verticality: 1 } as const;
/** the share of lit windows at night (the first number, 0.46, lit nine windows in fourteen on a house: the district's frontage reads about a
 *  quarter lit, journal Passe VP1) */
const LIT_WINDOWS = 0.3;
const W = { x0: -11, x1: 11, z0: -16, z1: 3 };
/** the walkable surface of every square (metres) */
export const PLAZA_WALK: Readonly<typeof W> = W;
/** where the people stand on each square (person id -> x, z): the registrar's table, the armourer's stall, the healer's corner, the champion
 *  by the fountain, the guards at the gate; the master's shed, the rings; the stalls, the tavern's door, the stage (« proposé ») */
export const PLAZA_SPOTS: Record<PlazaKind, Record<string, [number, number]>> = {
  forecourt: { odo: [-6.5, -9.2], hilde: [7.0, -10.2], anwen: [7.0, -1.0], guardA: [-3.2, -15.4], guardB: [3.2, -15.4], marek: [3.5, -5.0], orla: [-3.5, -3.5], vessa: [-1.5, -12.0], ilse: [4.8, -13.0] },
  training: { corvin: [-5.5, -14.6], orla: [4.5, -7.6], ilse: [-2.4, -7.0], vessa: [1.0, -10.0], drill: [-6.2, -4.2] },
  festival: { pip: [-7.0, -6.0], lio: [-6.0, -14.6], cassius: [2.2, -10.6], bard: [0, -14.0] },
};
/** the points the crowd walks between */
export const PLAZA_WANDER: Record<PlazaKind, Array<[number, number]>> = {
  forecourt: [[-8, 1], [8, 1], [-8, -14], [8, -14], [-4, -4], [4, -9], [0, 0], [-2, -14]],
  training: [[-8, 1], [8, 1], [-1, -1], [7, -11], [-8, -10], [0, -6]],
  festival: [[-5, 1], [5, 1], [0, -5], [-4, -11], [4, -3], [5, -10], [-1, -1]],
};
/** the focal point of each square: the wall lanterns nearest it are lit, the paths lead to it */
const FOCUS: Record<PlazaKind, [number, number]> = { forecourt: [0, -16], training: [-5.5, -15], festival: [0, -14] };

export function buildPlaza(lib: MaterialLibrary, kind: PlazaKind, seed: number, opts: { day: boolean }): PlazaBuild {
  const rng = new Rng(seed).fork(`plaza:${kind}`), day = opts.day;
  const group = new THREE.Group(); group.name = `plaza:${kind}`;
  const S = new SlotSet(), batch = new InstanceBatch(seed ^ 0x9a2a, 3);
  const lights: PlazaBuild['lights'] = [], emitters: Emitter[] = [], blockers: PlazaBuild['blockers'] = [], disposables: Array<{ dispose(): void }> = [];
  const obstacles: MaskObstacle[] = [], puddles: MaskBlob[] = [];
  const sockets: Array<Socket & { building: string; front: boolean }> = [];
  const spots: PlazaBuild['spots'] = { ...PLAZA_SPOTS[kind] }, wander: PlazaBuild['wander'] = [...PLAZA_WANDER[kind]];
  let nParts = 0, buildings = 0;
  const part = () => ++nParts;
  const tracked = (fn: () => void) => S.inPart(part(), fn);

  // ---------------------------------------------------------------- the houses: the district's generator and numbers, one part per wall / roof
  const house = (id: string, pos: V3, yaw: number, r: Rng, o: { width: number; floors: number; shop?: ShopType; roof?: RoofStyle; detail?: number; back?: boolean; depth?: number }) => {
    const res = createMerchantBuilding({
      ...COMMON, floors: o.floors, width: o.width, depth: o.depth, overhang: r.range(0.4, 0.6), shopType: o.shop ?? 'house', roofStyle: o.roof ?? r.weighted<RoofStyle>(['gable', 'crooked', 'hip'], [3, 2, 1]),
      seed: r.seed, chimney: r.bool(0.65), balcony: !o.back && r.bool(0.25), dormers: o.back ? 0 : r.int(0, 1), palette: r.pick(['slate', 'ash', 'mist', 'dusk', 'stone'] as const),
      detail: o.detail ?? (o.back ? 0.45 : 0.78), lit: day ? 0 : LIT_WINDOWS * (o.back ? 0.45 : 1), stoneGround: r.bool(0.5), sides: { left: true, right: true },
    });
    const base = nParts;
    nParts += res.parts.length;
    S.append(res.slots, mat(pos, yaw), base);
    if (!o.back) {
      for (const l of res.lights) lights.push({ ...l, pos: xf(l.pos, pos, yaw), priority: Math.min(l.priority ?? 5, 6) });
      for (const sk of res.sockets) sockets.push({ ...sk, pos: xf(sk.pos, pos, yaw), dir: rot(sk.dir, yaw), building: id, front: true });
      const hw = res.width / 2 + 0.3, hd = res.depth + 0.3, c = Math.cos(yaw), s = Math.sin(yaw);
      const corners = [[-hw, 0.3], [hw, 0.3], [-hw, -hd], [hw, -hd]].map(([x, z]) => [pos[0] + x * c + z * s, pos[2] - x * s + z * c]);
      obstacles.push({ x0: Math.min(...corners.map((p) => p[0])), x1: Math.max(...corners.map((p) => p[0])), z0: Math.min(...corners.map((p) => p[1])), z1: Math.max(...corners.map((p) => p[1])), grime: 0.7 });
    }
    if (res.params.chimney) emitters.push({ kind: 'chimney', pos: xf([res.width * 0.2, res.ridgeY + 0.9, -res.depth * 0.5], pos, yaw), rate: o.back ? 0.3 : 0.5 });
    buildings++;
    return res;
  };
  // the two side rows facing the square (west faces +x, east faces -x), from the camera's side to the north, and their back rows
  for (const side of [-1, 1]) {
    let z = 4;
    for (let i = 0; i < 4; i++) {
      const r = rng.fork(`row${side}:${i}`), width = r.range(5.4, 6.8);
      const shop: ShopType = kind === 'festival' && side < 0 && i === 1 ? 'tavern' : kind === 'training' && side > 0 && i === 2 ? 'general' : r.pick<ShopType>(['house', 'general', 'house', 'apothecary', 'tailor']);
      house(`row${side}${i}`, [side * 13.2, 0, z - width / 2], side < 0 ? Math.PI / 2 : -Math.PI / 2, r, { width, floors: r.int(2, 4), shop });
      z -= width + r.range(0.1, 0.3);
    }
    // back row: taller and simplified, only its upper floors and roofs read over the frontage ridgeline (the district's back row)
    let zb = 1.5;
    for (let i = 0; i < 3; i++) {
      const r = rng.fork(`back${side}:${i}`), width = r.range(6.2, 7.6);
      house(`back${side}${i}`, [side * 21.5, 0, zb - width / 2], side < 0 ? Math.PI / 2 : -Math.PI / 2, r, { width, floors: r.int(4, 5), back: true });
      zb -= width + r.range(0.6, 1.6);
    }
  }

  // the north corners behind the side rows (the forecourt's are the Colosseum's): a back-row house each (journal Passe VP1: the square opened
  // there onto a cobbled plain to the horizon)
  if (kind !== 'forecourt') for (const side of [-1, 1]) house(`corner${side}`, [side * 16.5, 0, -26], 0, rng.fork(`corner${side}`), { width: 9, floors: 4, back: true });

  // ---------------------------------------------------------------- the lamps: a rhythm along the open south side (the quay's), a few inside
  const lamp = (x: number, z: number, strong = true) => {
    batch.add('lampPost', { pos: [x, 0, z], yaw: Math.PI / 2, scale: 1 }, 0);
    lights.push({ pos: xf([0.52, 3.2 - 0.38, 0], [x, 0, z], Math.PI / 2), color: WARM, intensity: strong ? 4.0 : 2.8, radius: strong ? 10.5 : 8, kind: 'lantern', halo: strong ? 1.8 : 1.4, priority: strong ? 6 : 5 });
    blockers.push({ x, z, r: 0.35 }); obstacles.push({ x0: x - 0.25, x1: x + 0.25, z0: z - 0.25, z1: z + 0.25, grime: 0.4 });
    puddles.push({ x: x + 0.8, z: z - 1.4, r: 1.6, amount: 0.85 });
  };
  for (const x of [-10.2, -3.4, 3.4, 10.2]) lamp(x, 3.9);
  // the tops of the south lamps carry the day's bunting
  const lampTops: V3[] = [-10.2, -3.4, 3.4, 10.2].map((x) => [x, 3.05, 3.9]);
  const brazier = (x: number, z: number) => {
    S.at([x, 0, z], 0, () => S.get('metal').cylinder(0.32, 0.9, 1.15, 8, { tint: [0.35, 0.33, 0.32], capBottom: true, r1: 0.42 }));
    S.get('metal').box(x, 0.45, z, 0.12, 0.9, 0.12);
    S.get('glow').box(x, 1.12, z, 0.5, 0.08, 0.5, { tint: [1, 0.55, 0.2] });
    lights.push({ pos: [x, 1.6, z], color: FIRE, intensity: 3.0, radius: 8, kind: 'fire', halo: 1.7, priority: 9, day: true });
    emitters.push({ kind: 'chimney', pos: [x, 1.4, z], rate: 0.3 });
    blockers.push({ x, z, r: 0.5 });
  };
  // a market stall of the district (MarketGenerator.stall): posts, sagging canvas, shelves, goods, its lantern cluster and its key light
  const marketStall = (x: number, z: number, yaw: number, k: StallKind, w: number, lit: boolean) => {
    const st = stall(rng.fork(`stall${x}${z}`), k, w);
    S.append(st.S, mat([x, 0, z], yaw));
    for (const p of st.lanterns) batch.add(day || !lit ? 'lanternDark' : 'lantern', { pos: xf(p, [x, 0, z], yaw), yaw }, 0);
    if (lit && !day) for (const l of st.lights) lights.push({ ...l, pos: xf(l.pos, [x, 0, z], yaw) });
    blockers.push({ x, z, r: Math.max(1.3, w / 2) });
    obstacles.push({ x0: x - w / 2, x1: x + w / 2, z0: z - 1, z1: z + 1, grime: 0.5 });
  };
  const paths: Array<Array<[number, number]>> = [];

  if (kind === 'forecourt') {
    colosseum(S, tracked, day, lights, emitters, blockers, obstacles);
    // the registrar's table (a trestle, his board, the roll), the armourer's stall, the healer's corner (a canvas lean-to, a bench, buckets)
    S.append(trestle(rng.fork('registrar'), 2.4), mat([-6.5, 0, -10.4], 0.2));
    batch.add('chalkboard', { pos: [-7.9, 0, -10.0], yaw: 0.6 }); batch.add('basket', { pos: [-5.4, 1.0, -10.4], yaw: 1, scale: 0.6 }); batch.add('crate', { pos: [-8.2, 0, -11.2], yaw: 0.3 });
    blockers.push({ x: -6.5, z: -10.4, r: 1.4 }); obstacles.push({ x0: -7.8, x1: -5.2, z0: -10.8, z1: -10.0, grime: 0.5 });
    marketStall(7.4, -11.4, -0.35, 'cloth', 3.0, true);
    batch.add('barrel', { pos: [9.2, 0, -10.0], yaw: 0.2 }); batch.add('crate', { pos: [9.0, 0, -12.6], yaw: 0.8 });
    healer(S, batch, 7.6, -2.0, -0.6, blockers, obstacles);
    fountain(S, tracked, 0, -7);
    blockers.push({ x: 0, z: -7, r: 2.5 }); obstacles.push({ x0: -2.3, x1: 2.3, z0: -9.3, z1: -4.7, grime: 0.35 });
    puddles.push({ x: 0, z: -4.2, r: 1.8, amount: 0.9 }, { x: -2.6, z: -8.4, r: 1.2, amount: 0.7 });
    // the gate's braziers burn day and night (the arena's fires, as AD1)
    brazier(-3.6, -16.4); brazier(3.6, -16.4);
    lamp(-9.6, -13.6, false); lamp(9.6, -6.0, false);
    paths.push([[0, 4], [0, -4], [0, -16.5]], [[-9, 2], [-6.5, -9]], [[9, 2], [7.4, -10]]);
  } else if (kind === 'training') {
    for (const [cx, cz, r] of [[-5, -7, 3.4], [4.5, -5, 3.0], [1, -12.5, 2.8]] as Array<[number, number, number]>) {
      sandRing(S, batch, cx, cz, r);
      blockers.push({ x: cx, z: cz, r: 0.6 });
      obstacles.push({ x0: cx - r, x1: cx + r, z0: cz - r, z1: cz + r, grime: 0.25 });
    }
    // the weapon racks along the west, hay and buckets by the rings (dulled: the first build's hay read as bright yellow blocks)
    for (let i = 0; i < 3; i++) { const z = -2 - i * 4.5; weaponRack(S, -10.3, z); blockers.push({ x: -10.3, z, r: 1.2 }); obstacles.push({ x0: -10.7, x1: -9.9, z0: z - 1.2, z1: z + 1.2, grime: 0.6 }); }
    for (const [x, z, k] of [[-1.6, -3.0, 'hay'], [-1.0, -3.8, 'hay'], [7.8, -8.6, 'bucket'], [7.3, -9.1, 'barrel'], [-8.6, -12.2, 'crate'], [8.4, -1.4, 'hay']] as Array<[number, number, string]>) {
      if (k === 'hay') hay(S, x, z, x + z); else batch.add(k, { pos: [x, 0, z], yaw: x + z }); blockers.push({ x, z, r: 0.6 });
    }
    // the master's shed and the barracks to the north, facing the yard, their back row
    house('shed', [-5.5, 0, -17.6], 0, rng.fork('shed'), { width: 9, floors: 2, shop: 'general', roof: 'gable' });
    house('barracks', [5.6, 0, -17.6], 0, rng.fork('barracks'), { width: 9.4, floors: 3 });
    house('northB0', [-7.5, 0, -27], 0, rng.fork('nb0'), { width: 8, floors: 5, back: true });
    house('northB1', [4.5, 0, -27.5], 0, rng.fork('nb1'), { width: 8.5, floors: 4, back: true });
    lamp(-9.4, -14.4, false); lamp(9.6, -13.2, false);
    paths.push([[0, 4], [-1.5, -8], [-5.5, -15]], [[0, 4], [4.5, -2]], [[-5, -7], [1, -12.5]]);
  } else {
    // the stage: a timber platform with its steps, skirt, posts, canopy and the festival's banner
    stage(S, batch, 0, -15.2);
    blockers.push({ x: -1.8, z: -15.4, r: 1.9 }, { x: 1.8, z: -15.4, r: 1.9 });
    obstacles.push({ x0: -3.6, x1: 3.6, z0: -17, z1: -13.6, grime: 0.6 });
    marketStall(-7.4, -7.6, 0.55, 'candles', 3.0, true);
    marketStall(-7.8, -1.6, 0.35, 'produce', 2.6, false);
    marketStall(7.4, -6.6, -0.5, 'pottery', 2.8, true);
    marketStall(7.8, -12.0, -0.3, 'cloth', 2.6, false);
    for (const [x, z] of [[-2.5, -3], [2.4, -9], [-1.2, -9.4]] as Array<[number, number]>) { batch.add('stool', { pos: [x, 0, z], yaw: x }); batch.add('barrel', { pos: [x + 0.6, 0, z - 0.3], yaw: z }); blockers.push({ x, z, r: 0.7 }); }
    house('north0', [-6, 0, -18.4], 0, rng.fork('north0'), { width: 8, floors: 3, shop: 'tavern' });
    house('north1', [5.5, 0, -18.4], 0, rng.fork('north1'), { width: 9, floors: 3, shop: 'general' });
    house('northB0', [-1.5, 0, -27], 0, rng.fork('nb0'), { width: 9, floors: 5, back: true });
    // strings across the square: lanterns at night (lit on every other string), the tournament's pennants by day (J4, J6) on two of the four,
    // higher (four strings of pennants read as a wall between the camera and the stage: the district's street has one, journal Passe VP1)
    for (let k = 0; k < 4; k++) {
      const z = -2 - k * 3.6, a: V3 = [-12.4, 4.6, z], b: V3 = [12.4, 4.6, z - 0.6];
      if (day) { if (k % 2) garland(S, [a[0], 5.4, a[2]], [b[0], 5.4, b[2]], 1.0, { size: 0.42, width: 0.34, spacing: 0.56, phase: k }); }
      else {
        cord(S, a, b, 0.9);
        for (let t = 1; t < 8; t++) { const u = t / 8, p = sag(a, b, 0.9, u); batch.add(k % 2 ? 'lantern' : 'lanternDark', { pos: [p[0], p[1] - 0.32, p[2]], yaw: t, scale: 1.1 }, 0); }
        if (k % 2) lights.push({ pos: [0, 3.9, z - 0.3], color: WARM, intensity: 2.2, radius: 8.5, kind: 'lantern', halo: 1.3, priority: 7 });
      }
    }
    lamp(-9.6, -13.0, false); lamp(9.6, -14.2, false);
    paths.push([[0, 4], [0, -13]], [[-9, 2], [-7.4, -7.6]], [[9, 2], [7.4, -6.6]]);
  }

  // ---------------------------------------------------------------- the façades' wall lanterns: lit near the focal point, dark elsewhere (hierarchy)
  const [fx, fz] = FOCUS[kind];
  const wallLamps = sockets.filter((s) => s.kind === 'lamp');
  const ranked = [...wallLamps].sort((a, b) => Math.hypot(a.pos[0] - fx, a.pos[2] - fz) - Math.hypot(b.pos[0] - fx, b.pos[2] - fz));
  const litSet = new Set(ranked.slice(0, 3));
  for (const s of wallLamps) {
    if (day || !litSet.has(s)) { batch.add('lanternDark', { pos: [s.pos[0], s.pos[1] - 0.2, s.pos[2]], yaw: Math.atan2(s.dir[0], s.dir[2]) }, 0); continue; }
    batch.add('lantern', { pos: [s.pos[0], s.pos[1] - 0.22, s.pos[2]], yaw: Math.atan2(s.dir[0], s.dir[2]) }, 0);
    lights.push({ pos: [s.pos[0], s.pos[1] + 0.02, s.pos[2]], color: WARM, intensity: 2.3, radius: 8, kind: 'lantern', halo: 1.4, priority: 5 });
  }
  // heraldry as a focal accent: one guild banner on the house nearest the focal point (the district's buildBanners)
  const banner = [...sockets.filter((s) => s.kind === 'banner')].sort((a, b) => Math.hypot(a.pos[0] - fx, a.pos[2] - fz) - Math.hypot(b.pos[0] - fx, b.pos[2] - fz))[0];
  if (banner) addBanner(S, { pos: [banner.pos[0] + banner.dir[0] * 0.18, banner.pos[1] + 0.3, banner.pos[2] + banner.dir[2] * 0.18], yaw: Math.atan2(banner.dir[0], banner.dir[2]), w: 1.2, h: 2.6, emblem: kind === 'training' ? 'hammers' : kind === 'forecourt' ? 'fleur' : 'tankard', shape: 'swallow', loose: 0.5 });
  // the tournament's bunting by day only (J6): a swag across each house's first upper floor, and from the nearest façade to each south lamp
  if (day) {
    const front = sockets.filter((s) => s.kind === 'bunting' && (s.tag === 'left1' || s.tag === 'right1'));
    const byHouse = new Map<string, V3[]>();
    for (const s of front) byHouse.set(s.building, [...(byHouse.get(s.building) ?? []), s.pos]);
    let phase = 0;
    for (const pts of byHouse.values()) if (pts.length === 2) garland(S, pts[0], pts[1], 0.5, { size: 0.42, width: 0.34, spacing: 0.42, phase: phase++ });
    for (const top of lampTops) {
      let best: V3 | null = null;
      for (const s of front) if (!best || Math.hypot(s.pos[0] - top[0], s.pos[2] - top[2]) < Math.hypot(best[0] - top[0], best[2] - top[2])) best = s.pos;
      if (best && Math.hypot(best[0] - top[0], best[2] - top[2]) < 6.5) garland(S, best, top, 0.45, { size: 0.34, width: 0.28, spacing: 0.4 });
    }
  }

  // ---------------------------------------------------------------- the city beyond: a ring of far houses (each a part), the Colosseum's drum as the landmark
  const far = new MeshBuilder();
  {
    const r = rng.fork('far');
    for (let n = 0; n < 26; n++) {
      const a = r.range(-1.05, 1.05), d = r.range(62, 104);
      far.frame.part = part();
      farHouse(far, { x: Math.sin(a) * d, y: r.range(-0.5, 1.5), z: -Math.cos(a) * d - 6, w: r.range(6, 10), d: r.range(5, 8), h: r.range(5, 9), wall: [0.3, 0.31, 0.36], roof: [0.12, 0.14, 0.2], id: 500 + n, lit: day ? 0 : r.range(0.2, 0.6), hip: r.bool(0.3), chimney: r.bool(0.4) });
    }
    far.frame.part = 0;
  }
  // the Colosseum seen from the other squares: its drum above the roofs to the north-east (the forecourt stands at its foot)
  if (kind !== 'forecourt') tracked(() => S.at([kind === 'training' ? 76 : -70, 0, -178], 0, () => {
    S.get('stone').cylinder(30, 0, 21, 36, { tint: [0.5, 0.49, 0.5] });
    S.get('stone').cylinder(30.6, 20.4, 22, 36, { tint: [0.54, 0.52, 0.52] });
    for (const y of [4.5, 11.5]) S.get('dark').cylinder(30.05, y, y + 4, 36, { tint: [0.12, 0.12, 0.15] });
  }));
  const farMat = farMaterial(); disposables.push(farMat);
  if (day) { farMat.defines = { ...farMat.defines, DAY: 1 }; farMat.needsUpdate = true; }

  // ---------------------------------------------------------------- the ground: one plane, its mask (water, grime, wear, contact shadow)
  const RECT = { x0: -18, z0: -26, w: 36, h: 34 };
  {
    const mw = 384, mh = 362;
    const mask = plazaMask(seed, RECT, mw, mh, obstacles, day ? [] : puddles, paths, day ? 0 : 1);
    const tex = new THREE.DataTexture(mask, mw, mh, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.colorSpace = THREE.NoColorSpace; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true; disposables.push(tex);
    lib.ground.uniforms.tGroundMask.value = tex;
    lib.ground.uniforms.uGroundRect.value.set(RECT.x0, RECT.z0, RECT.w, RECT.h);
    const g = new THREE.PlaneGeometry(90, 90); g.rotateX(-Math.PI / 2); g.translate(0, 0, -16);
    const ground = new THREE.Mesh(g, lib.ground); ground.name = 'plaza:ground'; ground.layers.set(LAYER_NOREFLECT); ground.frustumCulled = false;
    group.add(ground);
  }

  // ---------------------------------------------------------------- meshes (rebuilt by cull once the bake has said which parts are seen)
  const casts = (s: string) => s !== 'decal' && s !== 'leaf' && s !== 'cloth' && s !== 'banner';
  let statics: THREE.Mesh[] = [];
  const makeMeshes = (keep: (p: number) => boolean) => {
    for (const m of statics) { group.remove(m); m.geometry.dispose(); }
    statics = [];
    let kept = 0, hidden = 0;
    const emit = (b: MeshBuilder, material: THREE.Material, name: string, cast: boolean, layer0Only = false) => {
      if (!b.vertexCount) return;
      const sp = b.partition((p) => (p <= 0 || keep(p) ? 0 : 1), 2);
      if (sp[0].vertexCount) {
        const mesh = new THREE.Mesh(sp[0].toGeometry(), material); mesh.name = name; mesh.frustumCulled = false;
        if (layer0Only) mesh.layers.set(0); else if (cast) mesh.layers.enable(LAYER_CAST);
        if (name.endsWith(':decal')) { mesh.layers.set(LAYER_NOREFLECT); mesh.renderOrder = 2; }
        group.add(mesh); statics.push(mesh); kept += sp[0].triCount;
      }
      hidden += sp[1].triCount;
      if (cast && sp[1].vertexCount) { const sh = new THREE.Mesh(sp[1].toGeometry(), material); sh.name = `${name}:shadow-only`; sh.frustumCulled = false; sh.layers.set(LAYER_CAST); group.add(sh); statics.push(sh); }
    };
    for (const s of SLOTS) emit(S.get(s as Slot), lib.slot[s as Slot], `plaza:${s}`, casts(s));
    emit(far, farMat, 'plaza:far', false, true);
    return { kept, hidden };
  };
  const first = makeMeshes(() => true);
  const props = batch.build(lib.slot, (o, s) => { if (s !== 'leaf' && s !== 'cloth' && s !== 'glow') o.layers.enable(LAYER_CAST); });
  group.add(props);
  const out: PlazaBuild = {
    group, lights, emitters, walk: { ...W }, blockers, spots, wander,
    stats: { triangles: first.kept, instances: batch.instanceCount, buildings, parts: nParts },
    world: S, far, nParts,
    cull(keep) {
      let hiddenParts = 0;
      for (let p = 1; p <= nParts; p++) if (!keep(p)) hiddenParts++;
      const r = makeMeshes(keep);
      out.stats.triangles = r.kept;
      return { ...r, hiddenParts };
    },
    dispose() { group.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); }); batch.dispose(); for (const d of disposables) d.dispose(); },
  };
  return out;
}

// ---------------------------------------------------------------- pieces of the squares

/** The Colosseum's outer wall seen from its forecourt: a curved arcade facade (an arc of the drum, convex toward the square) of two tiers of
 *  arches between piers, string courses and a cornice, the masts and pennants of the tournament along the cornice, the great
 *  gate in the middle (its portcullis raised by day, its doors shut at night) and the cavea's inner wall rising behind; each bay a part. */
function colosseum(S: SlotSet, tracked: (fn: () => void) => void, day: boolean, lights: PlazaBuild['lights'], emitters: Emitter[], blockers: PlazaBuild['blockers'], obstacles: MaskObstacle[]): void {
  // journal Passe VP1, after the second blind critique: darker stone (it went blue-white at night) in larger blocks (uvScale: the wall's bricks
  // read as tiles at the district's scale), no attic (the facade filled every frame to its top: its cornice is now the top, the masts and their
  // pennants stand against the sky), the tournament's fleur-de-lis on its banners (the tavern's tankard was on them)
  // at night a shade darker still: the moon faces the facade, which read brighter than the district's moonlit plaster
  const nk = day ? 1 : 0.84, R = 52, C: V3 = [0, 0, -71.2], stone: V3 = [0.7 * nk, 0.67 * nk, 0.62 * nk], stoneLt: V3 = [0.76 * nk, 0.72 * nk, 0.66 * nk], dark: V3 = [0.07, 0.07, 0.09], uv = 0.6;
  const St = S.get('stone'), Dk = S.get('dark');
  const bayW = 3.7, gateW = 5.6;
  // bay centres along the arc: the gate at 0, five bays each side
  const angles: Array<{ a: number; w: number; gate: boolean }> = [{ a: 0, w: gateW, gate: true }];
  for (const s of [-1, 1]) { let a = s * (gateW / 2 + bayW / 2) / R; for (let i = 0; i < 6; i++) { angles.push({ a, w: bayW, gate: false }); a += s * bayW / R; } }
  const arch = (cx: number, yb: number, hw: number, hRect: number, z: number, ring: V3) => {
    // the dark opening (a recess: its back 0.7 m inside), its semicircular head, and the ring of voussoirs
    Dk.boxMM(cx - hw, yb, z - 0.75, cx + hw, yb + hRect, z - 0.7, { tint: dark });
    const n = 10, yc = yb + hRect;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI;
      Dk.tri([cx + Math.cos(a0) * hw, yc + Math.sin(a0) * hw, z - 0.72], [cx + Math.cos(a1) * hw, yc + Math.sin(a1) * hw, z - 0.72], [cx, yc, z - 0.72], { tint: dark });
      // the head's intrados, from the front plane to the recess (without it a pale crescent of whatever stands behind showed beside each head)
      St.quad([cx + Math.cos(a0) * hw, yc + Math.sin(a0) * hw, z], [cx + Math.cos(a1) * hw, yc + Math.sin(a1) * hw, z], [cx + Math.cos(a1) * hw, yc + Math.sin(a1) * hw, z - 0.72], [cx + Math.cos(a0) * hw, yc + Math.sin(a0) * hw, z - 0.72], { uvScale: uv, tint: [0.54, 0.51, 0.47] });
      // the spandrel between the head and the bay's corners (front plane)
      const corner: V3 = [cx + (a0 < Math.PI / 2 ? hw + 0.02 : -hw - 0.02), yc + hw + 0.02, z];
      St.tri([cx + Math.cos(a0) * hw, yc + Math.sin(a0) * hw, z], [cx + Math.cos(a1) * hw, yc + Math.sin(a1) * hw, z], corner, { uvScale: uv, tint: stone, flip: true });
      if (i % 2 === 0) { const am = (a0 + a1) / 2; St.box(cx + Math.cos(am) * (hw + 0.12), yc + Math.sin(am) * (hw + 0.12), z + 0.04, 0.26, 0.3, 0.16, { tint: ring }); }
    }
    St.boxMM(cx - hw - 0.02, yc + hw, z - 0.02, cx + hw + 0.02, yc + hw + 0.04, z, { uvScale: uv, tint: stone });
    // the reveal: the arch's sides seen in depth
    for (const s of [-1, 1]) St.boxMM(cx + s * hw - (s > 0 ? 0.04 : 0), yb, z - 0.72, cx + s * hw + (s < 0 ? 0.04 : 0), yb + hRect, z, { uvScale: uv, tint: [0.54, 0.51, 0.47] });
  };
  for (const b of angles) tracked(() => {
    const pos: V3 = [C[0] + Math.sin(b.a) * R, 0, C[2] + Math.cos(b.a) * R];
    S.at(pos, b.a, () => {
      const hw = b.w / 2;
      // the piers (one per bay edge; the facade wall behind the openings is the recess)
      for (const s of [-1, 1]) {
        St.boxMM(s * hw - 0.42, 0, -0.5, s * hw + 0.42, 6.4, 0.3, { uvScale: uv, tint: stoneLt, aoY: [0.7, 1] });
        St.boxMM(s * hw - 0.26, 6.4, -0.4, s * hw + 0.26, 10.8, 0.18, { uvScale: uv, tint: stoneLt, aoY: [0.8, 1] });
      }
      // the ground tier's arch (the gate wider and taller), the upper tier's
      if (b.gate) arch(0, 0, 2.1, 4.0, 0, stoneLt); else arch(0, 0, 1.25, 3.4, 0, stoneLt);
      arch(0, 6.95, 0.95, 1.6, -0.1, stoneLt);
      // the wall between the arches' heads and the string course above them (the first try left both open onto the sky)
      const top = b.gate ? 6.1 : 4.65;
      if (top < 6.2) St.boxMM(-hw + 0.42, top, -0.12, hw - 0.42, 6.25, -0.02, { uvScale: uv, tint: stone });
      St.boxMM(-0.97, 9.5, -0.12, 0.97, 10.82, -0.1, { uvScale: uv, tint: stone });
      // the wall around the upper arch, the string courses, the cornice (the top: no attic)
      St.boxMM(-hw + 0.26, 6.4, -0.12, hw - 0.26, 6.95, -0.1, { uvScale: uv, tint: stone });
      for (const s of [-1, 1]) St.boxMM(s > 0 ? 0.95 : -hw + 0.26, 6.95, -0.12, s > 0 ? hw - 0.26 : -0.95, 10.8, -0.1, { uvScale: uv, tint: stone });
      St.boxMM(-hw - 0.45, 6.2, -0.55, hw + 0.45, 6.55, 0.42, { uvScale: uv, tint: stoneLt });
      St.boxMM(-hw - 0.3, 10.8, -0.6, hw + 0.3, 11.25, 0.35, { uvScale: uv, tint: stoneLt });
      // a mast and its pennant on every other bay, the tournament's colours
      if (b.gate || Math.round(b.a * R / bayW) % 2 === 0) {
        S.get('timber').boxMM(-0.06, 11.25, -0.2, 0.06, 14.6, -0.08, { tint: [0.5, 0.42, 0.34], grain: 'y' });
        addBanner(S, { pos: [0.12, 14.3, -0.14], yaw: Math.PI / 2, w: 0.5, h: 1.5, emblem: 'fleur', shape: 'pennant', loose: 0.7, rod: false, tint: b.gate ? [0.95, 0.88, 0.62] : [0.5, 0.6, 0.95] });
      }
      if (b.gate) {
        // the portcullis: raised by day (its teeth under the head), shut at night with the doors behind it
        const M = S.get('metal'), y0 = day ? 3.4 : 0;
        for (let i = -4; i <= 4; i++) M.boxMM(i * 0.45 - 0.04, y0, -0.32, i * 0.45 + 0.04, 6.1, -0.26, { tint: [0.3, 0.3, 0.32] });
        for (let y = y0 + 0.3; y < 6.1; y += 0.55) M.boxMM(-2.05, y, -0.33, 2.05, y + 0.06, -0.27, { tint: [0.3, 0.3, 0.32] });
        if (!day) S.get('planks').boxMM(-2.1, 0, -0.6, 2.1, 5.9, -0.5, { grain: 'y', tint: [0.42, 0.32, 0.24] });
        // the great banner over the gate
        addBanner(S, { pos: [0, 10.55, 0.4], yaw: 0, w: 1.6, h: 3.0, emblem: 'fleur', shape: 'swallow', loose: 0.35, tint: [0.95, 0.88, 0.62] });
      } else if (Math.abs(b.a) * R < bayW * 2.2) {
        // long banners on the bays beside the gate
        addBanner(S, { pos: [0, 10.55, 0.4], yaw: 0, w: 1.1, h: 3.2, emblem: 'fleur', shape: 'swallow', loose: 0.4, tint: [0.5, 0.6, 0.95] });
      }
    });
  });
  // the cavea's inner wall rising behind the facade: the arena's upper rim, plain, with its own cornice (the second plane of the silhouette)
  tracked(() => S.at([0, 0, -82], 0, () => {
    const n = 18, r = 52, a0 = -0.42, a1 = 0.42;
    for (let i = 0; i < n; i++) {
      const u0 = a0 + (a1 - a0) * (i / n), u1 = a0 + (a1 - a0) * ((i + 1) / n);
      const p = (u: number, y: number): V3 => [Math.sin(u) * r, y, Math.cos(u) * r - r + 4];
      St.quad(p(u0, 0), p(u1, 0), p(u1, 15.5), p(u0, 15.5), { tint: [0.68, 0.65, 0.6], flip: true, ao: [0.7, 0.7, 1, 1] });
      St.quad(p(u0, 15.5), p(u1, 15.5), [p(u1, 16.1)[0] * 1.01, 16.1, p(u1, 16.1)[2] + 0.4], [p(u0, 16.1)[0] * 1.01, 16.1, p(u0, 16.1)[2] + 0.4], { tint: [0.78, 0.74, 0.68], flip: true });
      if (i % 2) Dk.quad(p(u0 + 0.004, 12.4), p(u1 - 0.004, 12.4), p(u1 - 0.004, 14.4), p(u0 + 0.004, 14.4), { tint: dark, flip: true });
    }
  }));
  // inside a few ground arches: the tunnels' torches (warm accents at the focal point, lit day and night like the arena's fires)
  for (const s of [-1, 1]) {
    const a = s * (gateW / 2 + bayW / 2) / R, x = Math.sin(a) * R, z = C[2] + Math.cos(a) * R - 0.6;
    S.get('glow').box(x, 2.6, z, 0.18, 0.4, 0.1, { tint: [1, 0.55, 0.2] });
    lights.push({ pos: [x, 2.6, z + 0.5], color: FIRE, intensity: 1.8, radius: 5.5, kind: 'fire', halo: 1.1, priority: 8, day: true });
  }
  void emitters;
  blockers.push({ x: 0, z: -18.6, r: 0.1 });
  obstacles.push({ x0: -14, x1: 14, z0: -21.5, z1: -19.0, grime: 0.9 });
}

/** the fountain at the forecourt's heart: an octagonal basin with its rim, dark water, a pedestal with a bowl and a spout (the first build's
 *  glowing water ring read as a target at night) */
function fountain(S: SlotSet, tracked: (fn: () => void) => void, x: number, z: number): void {
  tracked(() => S.at([x, 0, z], Math.PI / 8, () => {
    const St = S.get('stone'), oct = (r: number): Array<[number, number]> => Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * Math.PI * 2) * r, Math.sin((i / 8) * Math.PI * 2) * r]);
    St.prism(oct(2.2), 0, 0.5, { tint: [0.74, 0.71, 0.66], capTop: false, aoY: [0.6, 1] });
    St.prism(oct(2.36), 0.5, 0.64, { tint: [0.84, 0.8, 0.74], capTop: true });
    S.get('dark').prism(oct(1.92), 0.4, 0.46, { tint: [0.16, 0.21, 0.27], capTop: true });
    St.lathe([[0.62, 0.4], [0.62, 0.6], [0.32, 0.72], [0.26, 1.6], [0.8, 1.86], [0.86, 1.98], [0.2, 2.02], [0.16, 2.6], [0.24, 2.72], [0.01, 2.8]], 10, { tint: [0.8, 0.76, 0.7] });
  }));
}

/** a raised ring of sand with its timber kerb, a fence of posts and two rails open toward the camera, a practice dummy at its heart */
function sandRing(S: SlotSet, batch: InstanceBatch, cx: number, cz: number, r: number): void {
  const n = 28, poly: Array<[number, number]> = Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cz + Math.sin((i / n) * Math.PI * 2) * r]);
  // sand: the plaster's ivory warmed (the stone's grey-blue under a sand tint read green)
  S.get('plaster').prism(poly, 0, 0.05, { tint: [0.82, 0.72, 0.57], capTop: true });
  // the sand's worn edge and the rake's arcs (journal Passe VP1: a flat disc read as a puddle at night): a darker band inside the kerb, two raked
  // rings of a shade between
  const band = (r0: number, r1: number, tint: V3) => {
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, y = 0.052;
      S.get('plaster').quad([cx + Math.cos(a0) * r1, y, cz + Math.sin(a0) * r1], [cx + Math.cos(a1) * r1, y, cz + Math.sin(a1) * r1], [cx + Math.cos(a1) * r0, y, cz + Math.sin(a1) * r0], [cx + Math.cos(a0) * r0, y, cz + Math.sin(a0) * r0], { tint, flip: true });
    }
  };
  band(r - 0.42, r, [0.62, 0.53, 0.41]);
  for (const k of [0.42, 0.68]) band(r * k, r * k + 0.07, [0.72, 0.62, 0.48]);
  const T = S.get('timber');
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, rk = r + 0.06;
    T.quad([cx + Math.cos(a0) * rk, 0, cz + Math.sin(a0) * rk], [cx + Math.cos(a1) * rk, 0, cz + Math.sin(a1) * rk], [cx + Math.cos(a1) * rk, 0.12, cz + Math.sin(a1) * rk], [cx + Math.cos(a0) * rk, 0.12, cz + Math.sin(a0) * rk], { tint: [0.46, 0.38, 0.3] });
  }
  const m = 14, rf = r + 0.45;
  for (let i = 0; i < m; i++) {
    const a = (i / m) * Math.PI * 2, a1 = ((i + 1) / m) * Math.PI * 2, open = Math.sin(a) > 0.7 || Math.sin(a1) > 0.7;
    T.box(cx + Math.cos(a) * rf, 0.45, cz + Math.sin(a) * rf, 0.1, 0.9, 0.1, { tint: [0.52, 0.42, 0.32] });
    if (open) continue;
    for (const y of [0.42, 0.8]) {
      const p0: V3 = [cx + Math.cos(a) * rf, y, cz + Math.sin(a) * rf], p1: V3 = [cx + Math.cos(a1) * rf, y, cz + Math.sin(a1) * rf];
      const len = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]), yaw = Math.atan2(p1[0] - p0[0], p1[2] - p0[2]);
      S.at([(p0[0] + p1[0]) / 2, y, (p0[2] + p1[2]) / 2], yaw, () => T.box(0, 0, 0, 0.06, 0.07, len, { tint: [0.5, 0.4, 0.3], grain: 'z' }));
    }
  }
  // the practice dummy: a post, arms on a crossbar wrapped in straw at their ends, a straw body bound by a dark rope, a sacking head (journal
  // Passe VP1: the first one, a pale cylinder on a stake, read as a bollard)
  S.at([cx, 0, cz], 0.4, () => {
    const straw: V3 = [0.56, 0.45, 0.27], sack: V3 = [0.5, 0.43, 0.34];
    T.cylinder(0.08, 0, 1.75, 6, { tint: [0.42, 0.33, 0.25], capTop: true });
    T.box(0, 1.36, 0, 1.3, 0.13, 0.13, { tint: [0.44, 0.35, 0.27], grain: 'x' });
    for (const a of [-0.58, 0.58]) S.get('cloth').box(a, 1.36, 0, 0.2, 0.2, 0.2, { tint: straw });
    S.get('cloth').cylinder(0.25, 0.8, 1.48, 7, { tint: straw, capTop: true, capBottom: true, r1: 0.19 });
    S.get('dark').cylinder(0.215, 1.1, 1.15, 7, { tint: [0.16, 0.13, 0.11] });
    S.get('cloth').cylinder(0.15, 1.52, 1.86, 7, { tint: sack, capTop: true, capBottom: true, r1: 0.12 });
  });
  batch.add('bucket', { pos: [cx + r * 0.7, 0, cz + r * 0.75], yaw: cx });
}

/** a hay bale in straw's own value (the district's prop is tinted 1.5 x yellow for the forge's light: it read as a bright block here) */
function hay(S: SlotSet, x: number, z: number, yaw: number): void {
  S.at([x, 0, z], yaw, () => {
    S.get('cloth').boxMM(-0.42, 0, -0.27, 0.42, 0.42, 0.27, { tint: [0.74, 0.62, 0.38], aoY: [0.6, 1] });
    for (const a of [-0.12, 0.12]) S.get('timber').boxMM(a - 0.012, 0, -0.275, a + 0.012, 0.425, 0.275, { tint: [0.45, 0.38, 0.3] });
  });
}

/** a weapon rack: a timber frame with practice swords, staves and two shields */
function weaponRack(S: SlotSet, x: number, z: number): void {
  S.at([x, 0, z], Math.PI / 2, () => {
    const T = S.get('timber'), M = S.get('metal');
    for (const s of [-1, 1]) T.boxMM(s * 1.1 - 0.05, 0, -0.05, s * 1.1 + 0.05, 1.5, 0.05, { tint: [0.48, 0.38, 0.3], grain: 'y' });
    T.boxMM(-1.15, 1.32, -0.06, 1.15, 1.42, 0.06, { tint: [0.48, 0.38, 0.3], grain: 'x' });
    T.boxMM(-1.15, 0.3, -0.18, 1.15, 0.36, 0.18, { tint: [0.48, 0.38, 0.3], grain: 'x' });
    for (let i = 0; i < 7; i++) {
      const px = -0.9 + i * 0.3;
      if (i % 3 === 2) T.boxMM(px - 0.025, 0.32, -0.02, px + 0.025, 1.85, 0.02, { tint: [0.56, 0.46, 0.34], grain: 'y' });
      else M.boxMM(px - 0.03, 0.34, -0.01, px + 0.03, 1.38, 0.01, { tint: [0.62, 0.64, 0.68] });
    }
    for (const s of [-1, 1]) S.at([s * 0.75, 0.9, 0.12], 0, () => T.cylinder(0.3, -0.03, 0.03, 10, { tint: s < 0 ? [0.32, 0.4, 0.7] : [0.6, 0.3, 0.26], capTop: true, capBottom: true }), 1);
  });
}

/** the healer's corner: a canvas lean-to against nothing but its posts, a bench, buckets and a basket of herbs */
function healer(S: SlotSet, batch: InstanceBatch, x: number, z: number, yaw: number, blockers: PlazaBuild['blockers'], obstacles: MaskObstacle[]): void {
  S.at([x, 0, z], yaw, () => {
    const T = S.get('timber'), C = S.get('cloth');
    for (const [a, b, h] of [[-1.3, -0.6, 2.4], [1.3, -0.6, 2.4], [-1.3, 0.8, 1.9], [1.3, 0.8, 1.9]] as Array<[number, number, number]>) T.boxMM(a - 0.05, 0, b - 0.05, a + 0.05, h, b + 0.05, { tint: [0.6, 0.52, 0.44], grain: 'y' });
    const n = 6;
    for (let i = 0; i < n; i++) { const x0 = -1.45 + (2.9 * i) / n, x1 = x0 + 2.9 / n; C.quad([x0, 2.42, -0.7], [x1, 2.42, -0.7], [x1, 1.86, 0.95], [x0, 1.86, 0.95], { tint: i % 2 ? [0.4, 0.46, 0.62] : [0.64, 0.62, 0.57], flip: true, swayArr: [0, 0, 0.5, 0.5] }); }
    S.get('planks').boxMM(-1.1, 0.42, -0.4, 1.1, 0.5, 0.0, { grain: 'x', tint: [0.7, 0.6, 0.5] });
    for (const a of [-0.9, 0.9]) T.boxMM(a - 0.04, 0, -0.36, a + 0.04, 0.42, -0.04, { tint: [0.6, 0.52, 0.44] });
  });
  batch.add('bucket', { pos: xf([1.0, 0, 0.5], [x, 0, z], yaw), yaw: 1 }); batch.add('basket', { pos: xf([-0.8, 0, 0.6], [x, 0, z], yaw), yaw: 2 });
  blockers.push({ x, z, r: 1.4 }); obstacles.push({ x0: x - 1.4, x1: x + 1.4, z0: z - 1, z1: z + 1, grime: 0.4 });
}

/** the festival's stage: a timber platform on posts, steps toward the square, a cloth skirt, a canopy and the festival's banner */
function stage(S: SlotSet, batch: InstanceBatch, x: number, z: number): void {
  S.at([x, 0, z], 0, () => {
    const P = S.get('planks'), T = S.get('timber'), C = S.get('cloth');
    P.boxMM(-3.4, 0.8, -1.6, 3.4, 0.95, 1.6, { grain: 'x', tint: [0.66, 0.54, 0.42] });
    for (const a of [-3.3, -1.1, 1.1, 3.3]) for (const b of [-1.5, 1.5]) T.boxMM(a - 0.07, 0, b - 0.07, a + 0.07, 0.8, b + 0.07, { tint: [0.5, 0.4, 0.32] });
    const n = 12;
    for (let i = 0; i < n; i++) { const x0 = -3.4 + (6.8 * i) / n, x1 = x0 + 6.8 / n; C.quad([x0, 0.78, 1.62], [x1, 0.78, 1.62], [x1, 0.04, 1.66], [x0, 0.04, 1.66], { tint: i % 2 ? [0.32, 0.38, 0.72] : [0.86, 0.82, 0.7], swayArr: [0, 0, 0.3, 0.3] }); }
    for (let k = 0; k < 3; k++) P.boxMM(-0.9, 0.27 * k, 1.66 + 0.32 * (2 - k), 0.9, 0.27 * (k + 1), 1.98 + 0.32 * (2 - k), { grain: 'x', tint: [0.62, 0.5, 0.4] });
    for (const a of [-3.2, 3.2]) T.boxMM(a - 0.08, 0.95, -1.5, a + 0.08, 4.2, -1.34, { tint: [0.5, 0.4, 0.32], grain: 'y' });
    // journal Passe VP1 (the second blind critique: « a flat slab under a white board »): the front posts holding the canopy, a fascia along
    // the platform's edge, a striped backdrop behind the players, the canopy in the tournament's deep blue
    for (const a of [-3.2, 3.2]) T.boxMM(a - 0.07, 0.95, 0.32, a + 0.07, 3.8, 0.46, { tint: [0.5, 0.4, 0.32], grain: 'y' });
    T.boxMM(-3.45, 0.74, 1.6, 3.45, 0.98, 1.7, { tint: [0.4, 0.31, 0.24], grain: 'x' });
    for (let i = 0; i < 10; i++) { const x0 = -3.12 + (6.24 * i) / 10, x1 = x0 + 6.24 / 10; C.quad([x0, 0.95, -1.36], [x1, 0.95, -1.36], [x1, 3.7, -1.36], [x0, 3.7, -1.36], { tint: i % 2 ? [0.3, 0.36, 0.62] : [0.74, 0.7, 0.6], swayArr: [0, 0, 0.15, 0.15] }); }
    for (let i = 0; i < 8; i++) { const x0 = -3.3 + (6.6 * i) / 8, x1 = x0 + 6.6 / 8; C.quad([x0, 4.2, -1.5], [x1, 4.2, -1.5], [x1, 3.75, 0.4], [x0, 3.75, 0.4], { tint: i % 2 ? [0.34, 0.4, 0.68] : [0.3, 0.35, 0.62], flip: true, swayArr: [0, 0, 0.5, 0.5] }); }
    addBanner(S, { pos: [0, 3.5, -1.3], yaw: 0, w: 1.4, h: 2.2, emblem: 'fleur', shape: 'swallow', loose: 0.4, rod: true, tint: [0.95, 0.88, 0.62] });
  });
  batch.add('barrel', { pos: [x - 2.6, 0.95, z - 0.9], yaw: 0.3 }); batch.add('stool', { pos: [x + 1.8, 0.95, z - 0.6], yaw: 1.2 });
}

/** a cord with a parabolic sag (the lantern strings at night) and the point at u along it */
function sag(a: V3, b: V3, s: number, u: number): V3 { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - s * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u]; }
function cord(S: SlotSet, a: V3, b: V3, s: number): void {
  const seg = 24;
  for (let i = 0; i < seg; i++) { const p = sag(a, b, s, i / seg), q = sag(a, b, s, (i + 1) / seg); S.cloth.quad(p, q, [q[0], q[1] - 0.025, q[2]], [p[0], p[1] - 0.025, p[2]], { tint: [0.3, 0.26, 0.22], ao: 0.8 }); }
}

/** The square's ground mask, after the district's (StreetComposer.makeGroundMask: R = standing water, G = grime, B = foot-worn polish, A =
 *  painted contact AO), without its quay: grime and contact shadow at the bases of what stands, worn paths between the focal points, puddles
 *  where the lamps catch them (none by day). */
export function plazaMask(seed: number, rect: { x0: number; z0: number; w: number; h: number }, resX: number, resY: number, obstacles: MaskObstacle[], puddles: MaskBlob[], paths: Array<Array<[number, number]>>, wetness: number): Uint8Array {
  const out = new Uint8Array(resX * resY * 4);
  const ox = (seed % 97) * 0.37, oz = (seed % 89) * 0.41;
  const distRect = (x: number, z: number, o: MaskObstacle) => Math.hypot(Math.max(o.x0 - x, 0, x - o.x1), Math.max(o.z0 - z, 0, z - o.z1));
  const distPath = (x: number, z: number) => {
    let best = 1e9;
    for (const path of paths) for (let i = 0; i < path.length - 1; i++) {
      const [ax, az] = path[i], [bx, bz] = path[i + 1];
      const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * vx + (z - az) * vz) / l2));
      best = Math.min(best, Math.hypot(x - (ax + vx * t), z - (az + vz * t)));
    }
    return best;
  };
  for (let j = 0; j < resY; j++) {
    const z = rect.z0 + ((j + 0.5) / resY) * rect.h;
    for (let i = 0; i < resX; i++) {
      const x = rect.x0 + ((i + 0.5) / resX) * rect.w;
      let dmin = 6, gr = 0;
      for (const o of obstacles) {
        if (x < o.x0 - 5 || x > o.x1 + 5 || z < o.z0 - 5 || z > o.z1 + 5) continue;
        const d = distRect(x, z, o);
        if (d < dmin) dmin = d;
        if (d < 5) gr += (o.grime ?? 0.6) * Math.exp(-d / 1.1);
      }
      let pud = smoothstep(0.55, 0.75, fbm(x * 0.16 + ox, z * 0.16 + oz, 0, 4, 3)) * 0.6;
      for (const b of puddles) { const dx = (x - b.x) / b.r, dz = (z - b.z) / b.r, d2 = dx * dx + dz * dz; if (d2 < 6) pud = Math.max(pud, b.amount * Math.exp(-d2 * 1.6) * (0.75 + 0.5 * fbm(x * 0.9, z * 0.9, 0, 3, 8))); }
      pud *= smoothstep(0.0, 0.6, dmin);
      const grime = Math.max(0, Math.min(1, 0.16 + 0.26 * fbm(x * 0.4 + 7, z * 0.4 + 7, 0, 4, 9) + gr * 0.22));
      const wear = Math.exp(-Math.pow(distPath(x, z) / 1.6, 2)) * (0.55 + 0.45 * fbm(x * 1.2, z * 1.2, 0, 3, 13));
      const ao = 1 - 0.55 * Math.exp(-dmin / 0.42);
      const k = (j * resX + i) * 4;
      out[k] = Math.max(0, Math.min(1, pud * wetness)) * 255;
      out[k + 1] = grime * 255;
      out[k + 2] = Math.max(0, Math.min(1, wear)) * 255;
      out[k + 3] = Math.max(0, Math.min(1, ao)) * 255;
    }
  }
  return out;
}

const xf = (p: V3, pos: V3, yaw: number): V3 => { const c = Math.cos(yaw), s = Math.sin(yaw); return [pos[0] + p[0] * c + p[2] * s, pos[1] + p[1], pos[2] - p[0] * s + p[2] * c]; };
const rot = (d: V3, yaw: number): V3 => { const c = Math.cos(yaw), s = Math.sin(yaw); return [d[0] * c + d[2] * s, d[1], -d[0] * s + d[2] * c]; };

/** the walkable rule: inside the square, outside every blocker (the hero slides along their edge) */
export function walkTo(b: Pick<PlazaBuild, 'walk' | 'blockers'>, x: number, z: number, nx: number, nz: number, radius = 0.35): [number, number] {
  let px = Math.max(b.walk.x0, Math.min(b.walk.x1, nx)), pz = Math.max(b.walk.z0, Math.min(b.walk.z1, nz));
  for (const k of b.blockers) {
    const dx = px - k.x, dz = pz - k.z, d = Math.hypot(dx, dz), min = k.r + radius;
    if (d < min) { if (d < 1e-6) { px = x; pz = z; } else { px = k.x + (dx / d) * min; pz = k.z + (dz / d) * min; } }
  }
  return [px, pz];
}
