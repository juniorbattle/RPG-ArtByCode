import * as THREE from 'three';
import { Rng } from '../core/rng';
import { SlotSet, MeshBuilder, mat, SLOTS, type V3, type Slot } from '../core/MeshBuilder';
import { fbm, smoothstep } from '../core/noise';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import type { LightDef } from '../atmosphere/LightRig';
import { LAYER_CAST, LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import { InstanceBatch, trestle, cart, bush } from '../props/PropGenerator';
import { addBanner } from '../props/Banners';
import { garland } from '../props/Bunting';
import { stall, type StallKind } from '../props/MarketGenerator';
import { createMerchantBuilding } from '../architecture/BuildingGenerator';
import type { Socket, ShopType, RoofStyle } from '../architecture/Types';
import type { MaskObstacle, MaskBlob } from '../architecture/StreetComposer';
import { farHouse, farMaterial, tower } from '../district/DistantCity';
import type { Emitter } from '../district/MerchantDistrictGenerator';
import { V2_EXITS, type ExitSide, type PlazaKind } from '../simulation/v2places';
import type { PlaceId } from '../simulation/state';
import { atlasRect, emblemRect, quadFacing } from '../architecture/FacadeGrammar';
import { DECAL_CELLS, type DecalKind, type EmblemKind } from '../materials/CanvasArt';
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
  /** the walkable surface and what stands on it (circles); the lanes of its ways out (journal Passe VP5) beyond it */
  walk: Rect; lanes: Rect[]; blockers: Array<{ x: number; z: number; r: number }>;
  /** the ways out to the other places (journal Passe VP5) */
  exits: PlazaExit[];
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

export type Rect = { x0: number; x1: number; z0: number; z1: number };
/** a way out of a square (journal Passe VP5, the operator's « entrées / sorties comme dans un final fantasy 9 »): the lane the hero walks out
 *  along, the rectangle past which they leave, where one arriving by it stands and which way they face, the point its sign hangs at (the
 *  screen's marker) */
export interface PlazaExit { to: PlaceId; side: ExitSide; lane: Rect; out: Rect; spawn: [number, number]; face: 'up' | 'east' | 'west'; anchor: V3 }
/** the place each square stands for */
export const PLACE_OF_KIND: Record<PlazaKind, PlaceId> = { forecourt: 'forecourt', training: 'training', festival: 'lanterns' };
/** where a row opens onto its side street (after which house, the first from the camera's side being 0), for the sides V2_EXITS gives a way
 *  out; the street's width (« proposé ») */
export const OPEN_AFTER: Record<PlazaKind, Partial<Record<'west' | 'east', number>>> = { forecourt: { west: 0, east: 1 }, training: { west: 1 }, festival: { east: 1 } };
const GAP_W = 4.4;
/** the emblem on the sign over a way out: the place it leads to (the quay's gate carries none: its posts fly the tournament's swords) */
const EXIT_EMBLEM: Partial<Record<PlaceId, EmblemKind>> = { forecourt: 'duel', training: 'helm', lanterns: 'horn' };

const WARM: V3 = [1.0, 0.6, 0.27];
/** the processional way's flagstones, the tournament's two banner tints (gold, blue) */
const PAVE: V3 = [0.74, 0.73, 0.72], GOLD_T: V3 = [0.95, 0.88, 0.62], BLUE_T: V3 = [0.5, 0.6, 0.95];
const FIRE: V3 = [1.0, 0.5, 0.2];
/** the Merchant District's frontage numbers (DEFAULT_CONFIG): the squares' houses share them (the first build used more timber and more lit
 *  windows than the district) */
const COMMON = { asymmetry: 0.42, timberRatio: 0.32, roofExaggeration: 0.95, verticality: 1 } as const;
/** the share of lit windows at night (the first number, 0.46, lit nine windows in fourteen on a house: the district's frontage reads about a
 *  quarter lit, journal Passe VP1) */
const LIT_WINDOWS = 0.3;
const W = { x0: -11, x1: 11, z0: -16, z1: 6.8 };
/** the walkable surface of every square (metres) */
export const PLAZA_WALK: Readonly<typeof W> = W;
/** where the people stand on each square (person id -> x, z): the registrar's table, the armourer's stall, the healer's corner, the champion
 *  by the fountain, the guards at the gate; the master's shed, the rings; the stalls, the tavern's door, the stage (« proposé ») */
export const PLAZA_SPOTS: Record<PlazaKind, Record<string, [number, number]>> = {
  forecourt: { odo: [-7.2, -9.4], hilde: [7.4, -3.0], anwen: [-7.0, 2.6], guardA: [-2.3, -15.9], guardB: [2.3, -15.9], marek: [5.6, -6.8], orla: [-5.2, -2.6], vessa: [-1.6, -12.6], ilse: [6.2, -11.6] },
  training: { corvin: [-6.2, -14.6], orla: [8.2, -7.0], ilse: [-1.8, -6.8], vessa: [1.4, -9.8], drill: [-6.4, -3.6] },
  festival: { pip: [-8.0, -10.6], lio: [-6.2, -14.4], cassius: [1.6, -11.4], bard: [1.4, -13.2] },
};
/** the points the crowd walks between (journal Passe VP6: none nearer the camera than z 1, where a walker filled the frame's bottom edge) */
export const PLAZA_WANDER: Record<PlazaKind, Array<[number, number]>> = {
  forecourt: [[-6, 0.8], [6, 0.5], [-6, -13], [6, -12], [-5, -5], [5, -8], [0, -2], [-1.6, -12.5]],
  training: [[-7, 1], [7, 0.5], [0, -1], [7.4, -7], [-8, -9], [0, -7.5]],
  festival: [[-5, 0.5], [5, 0.5], [0, -4], [-6.4, -10.4], [6.4, -7.6], [0, -11], [-1, -1]],
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
  // the two side rows facing the square (west faces +x, east faces -x), from the camera's side to the north, and their back rows; a row opens
  // onto its side street where the square has a way out on that side (journal Passe VP5), and ends at the forecourt's facade or the north corner
  const openings: Array<{ side: -1 | 1; zs: number; zn: number }> = [], rowEnds: Record<number, number> = {};
  const zEnd = kind === 'forecourt' ? -20.2 : -26;
  for (const side of [-1, 1] as const) {
    const after = OPEN_AFTER[kind][side < 0 ? 'west' : 'east'];
    let z = 4;
    for (let i = 0; i < 4; i++) {
      if (z - zEnd < 4.2) break;
      const r = rng.fork(`row${side}:${i}`), width = Math.min(r.range(5.4, 6.8), z - zEnd);
      const shop: ShopType = kind === 'festival' && side < 0 && i === 1 ? 'tavern' : kind === 'training' && side > 0 && i === 2 ? 'general' : r.pick<ShopType>(['house', 'general', 'house', 'apothecary', 'tailor']);
      house(`row${side}${i}`, [side * 13.2, 0, z - width / 2], side < 0 ? Math.PI / 2 : -Math.PI / 2, r, { width, floors: r.int(2, 4), shop });
      z -= width + r.range(0.1, 0.3);
      if (i === after) { openings.push({ side, zs: z, zn: z - GAP_W }); z -= GAP_W; }
    }
    rowEnds[side] = z;
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
  if (kind !== 'forecourt') for (const side of [-1, 1]) house(`corner${side}`, [side * 16.5, 0, -26], 0, rng.fork(`corner${side}`), { width: 9, floors: 3, back: true });

  // ---------------------------------------------------------------- the lamps: a rhythm along the open south side (the quay's), a few inside
  const lamp = (x: number, z: number, strong = true) => {
    batch.add('lampPost', { pos: [x, 0, z], yaw: Math.PI / 2, scale: 1 }, 0);
    lights.push({ pos: xf([0.52, 3.2 - 0.38, 0], [x, 0, z], Math.PI / 2), color: WARM, intensity: strong ? 4.6 : 3.2, radius: strong ? 12 : 9, kind: 'lantern', halo: strong ? 1.15 : 1.0, priority: strong ? 6 : 5 });
    blockers.push({ x, z, r: 0.35 }); obstacles.push({ x0: x - 0.25, x1: x + 0.25, z0: z - 0.25, z1: z + 0.25, grime: 0.4 });
    puddles.push({ x: x + 0.8, z: z - 1.4, r: 1.6, amount: 0.85 });
  };
  for (const x of [-11.0, -5.6, 5.6, 11.0]) lamp(x, 3.9, kind !== 'training');

  // the sidewalks: a band of grey flagstones along each row's front (journal Passe VP6: « the floors are flat, nothing organises the ground »)
  tracked(() => { for (const sd of [-1, 1]) flagstones(S, rng.fork(`walk${sd}`), [[sd * 12.2, 3.6], [sd * 12.2, kind === 'forecourt' ? -19.4 : -21.0]], 2.0, [0.66, 0.66, 0.68]); });

  // ---------------------------------------------------------------- the ways out (journal Passe VP5): a side street through a row's opening under a
  // timber gateway with the sign of the place it leads to, the quay's gate in the south kerb; their lanes, where one leaves and where one arrives
  const exits: PlazaExit[] = [], lanes: Rect[] = [];
  const ways = V2_EXITS[PLACE_OF_KIND[kind] as keyof typeof V2_EXITS], southGate = ways.some((e) => e.side === 'south');
  for (const e of ways) {
    if (e.side === 'south') {
      const lane = { x0: -1.9, x1: 1.9, z0: 2.5, z1: 7.6 };
      lanes.push(lane);
      exits.push({ to: e.to, side: 'south', lane, out: { x0: -99, x1: 99, z0: 6.6, z1: 99 }, spawn: [0, 3.3], face: 'up', anchor: [0, 2.6, 7.6] });
      tracked(() => quayGate(S, batch, lights, day));
      continue;
    }
    const sd = e.side === 'west' ? -1 : 1, o = openings.find((q) => q.side === sd);
    if (!o) throw new Error(`plaza ${kind}: no opening on the ${e.side} for its way to ${e.to}`);
    const zc = (o.zs + o.zn) / 2, half = GAP_W / 2 - 0.62 - 0.4;
    const lane = sd < 0 ? { x0: -15.6, x1: -10.8, z0: zc - half, z1: zc + half } : { x0: 10.8, x1: 15.6, z0: zc - half, z1: zc + half };
    lanes.push(lane);
    exits.push({ to: e.to, side: e.side, lane, out: sd < 0 ? { x0: -99, x1: -14.9, z0: -99, z1: 99 } : { x0: 14.9, x1: 99, z0: -99, z1: 99 }, spawn: [sd * 12.0, zc], face: sd < 0 ? 'east' : 'west', anchor: [sd * 13.3, 4.4, zc] });
    tracked(() => gateway(S, batch, lights, day, sd, o.zs, o.zn, EXIT_EMBLEM[e.to] ?? 'swords'));
    obstacles.push({ x0: Math.min(sd * 13.2, sd * 21.4), x1: Math.max(sd * 13.2, sd * 21.4), z0: o.zn, z1: o.zs, grime: 0.55 });
  }
  // the forecourt's rows end short of the Colosseum: a high wall closes each corner
  if (kind === 'forecourt') tracked(() => { for (const sd of [-1, 1]) S.get('stone').boxMM(Math.min(sd * 13.2, sd * 14.4), 0, -21.8, Math.max(sd * 13.2, sd * 14.4), 6.8, rowEnds[sd] + 0.1, { tint: [0.6, 0.57, 0.53], uvScale: 0.6, aoY: [0.6, 1] }); });
  // the open south edge: a line of bollards between the lamps (journal Passe VP6: the kerb and the darker lane beyond it read as the district's
  // quay without its water, a dead band across every frame), and at the frame's near edge a low wall of planters and their greenery, parted
  // by the quay's gate where there is one (the foreground layer the district's water and boat give its frames)
  // (journal Passe VP6, fourth critique: the line of bollards read as posts scattered over the square; the walk now runs to the balustrade)
  tracked(() => {
    // journal Passe VP6, second critique: the planters' green was the most saturated thing in the frame (the district has none): a balustrade
    // (fourth critique: « chunky low-poly posts with streaky, stretched texture, blown out by day »: finer balusters in the plaster's smooth
    // grain, the whole a shade darker)
    const St = S.get('stone'), Pl = S.get('plaster'), wall: V3 = [0.5, 0.48, 0.46], cap: V3 = [0.62, 0.6, 0.56];
    for (const [a0, a1] of southGate ? [[-18, -2.7], [2.7, 18]] : [[-18, 18]]) {
      St.boxMM(a0, 0, 8.0, a1, 0.34, 8.6, { tint: wall, uvScale: 0.8, aoY: [0.6, 1] });
      St.boxMM(a0 - 0.05, 0.34, 7.96, a1 + 0.05, 0.42, 8.64, { tint: cap, uvScale: 0.8 });
      for (let x = a0 + 0.3; x < a1 - 0.15; x += 0.32) S.at([x, 0.42, 8.3], 0, () => Pl.lathe([[0.075, 0], [0.1, 0.07], [0.055, 0.18], [0.095, 0.38], [0.055, 0.53], [0.08, 0.6]], 8, { tint: cap }));
      St.boxMM(a0 - 0.05, 1.02, 8.0, a1 + 0.05, 1.12, 8.6, { tint: cap, uvScale: 0.8 });
      for (let x = a0; x <= a1 + 0.01; x += (a1 - a0) / Math.max(1, Math.round((a1 - a0) / 7))) St.boxMM(x - 0.2, 0, 8.08, x + 0.2, 1.22, 8.52, { tint: wall, uvScale: 0.8 });
    }
  });

  // the tops of the south lamps carry the day's bunting
  const lampTops: V3[] = [-11.0, -5.6, 5.6, 11.0].map((x) => [x, 3.05, 3.9]);
  const brazier = (x: number, z: number) => {
    S.at([x, 0, z], 0, () => S.get('metal').cylinder(0.32, 0.9, 1.15, 8, { tint: [0.35, 0.33, 0.32], capBottom: true, r1: 0.42 }));
    S.get('metal').box(x, 0.45, z, 0.12, 0.9, 0.12);
    S.get('glow').box(x, 1.12, z, 0.5, 0.08, 0.5, { tint: [1, 0.55, 0.2] });
    lights.push({ pos: [x, 1.6, z], color: FIRE, intensity: 3.0, radius: 8, kind: 'fire', halo: 1.7, priority: 9, day: true });
    emitters.push({ kind: 'chimney', pos: [x, 1.4, z], rate: 0.3 });
    blockers.push({ x, z, r: 0.5 });
  };
  // a market stall of the district (MarketGenerator.stall): posts, sagging canvas, shelves, goods, its lantern cluster and its key light
  const marketStall = (x: number, z: number, yaw: number, k: StallKind, w: number, lit: boolean, stripes?: [V3, V3]) => {
    const st = stall(rng.fork(`stall${x}${z}`), k, w, stripes);
    S.append(st.S, mat([x, 0, z], yaw));
    for (const p of st.lanterns) batch.add(day || !lit ? 'lanternDark' : 'lantern', { pos: xf(p, [x, 0, z], yaw), yaw }, 0);
    if (lit && !day) for (const l of st.lights) lights.push({ ...l, pos: xf(l.pos, [x, 0, z], yaw) });
    blockers.push({ x, z, r: Math.max(1.3, w / 2) });
    obstacles.push({ x0: x - w / 2, x1: x + w / 2, z0: z - 1, z1: z + 1, grime: 0.5 });
  };
  const paths: Array<Array<[number, number]>> = [];
  // the ground's decals (the district's atlas: cracks, stains, straw, ruts...; journal Passe VP6), a few per square near what made them
  const decal = (k: DecalKind, x: number, z: number, w: number, d: number, rot: number, alpha: number, y = 0.014, tint: V3 = [1, 1, 1]) => {
    const i = DECAL_CELLS[k], [u0, v0, u1, v1] = atlasRect(i % 4, Math.floor(i / 4), 4, 4, 0.002), c = Math.cos(rot), sn = Math.sin(rot);
    const P = ([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]] as Array<[number, number]>).map(([a, b]) => [x + a * c - b * sn, y, z + a * sn + b * c] as V3);
    S.get('decal').quad(P[0], P[1], P[2], P[3], { uvs: [u0, v1, u1, v1, u1, v0, u0, v0], tint, ao: alpha, aux: [0, 0, 0, 0], flip: true });
  };
  const dr = rng.fork('decals');
  const scatter = (k: DecalKind, n: number, x0: number, x1: number, z0: number, z1: number, size: [number, number], alpha: [number, number], y = 0.014, tint: V3 = [1, 1, 1]) => {
    for (let i = 0; i < n; i++) { const sz = dr.range(size[0], size[1]); decal(k, dr.range(x0, x1), dr.range(z0, z1), sz, sz * dr.range(0.7, 1.1), dr.range(0, 6.28), dr.range(alpha[0], alpha[1]), y, tint); }
  };

  if (kind === 'forecourt') {
    colosseum(S, tracked, day, lights, emitters, blockers, obstacles);
    // journal Passe VP6: the processional way from the quay's gate to the arena's gate (its flagstones a leading line through the frame), the
    // fountain's apron and its water, the tournament's masts along the way, the competitors' pavilions in the north corners
    tracked(() => { flagstones(S, rng.fork('way0'), [[0, 6.4], [0, -2.9]], 3.2, PAVE); flagstones(S, rng.fork('way1'), [[0, -11.1], [0, -19.0]], 3.2, PAVE); });
    tracked(() => apron(S, rng.fork('apron'), 0, -7, 2.45, 4.15, PAVE));
    fountain(S, tracked, 0, -7);
    tracked(() => fountainWater(S, 0, -7));
    // the fountain's water in the canal's material: its ripples, the sky and the lights mirrored (journal Passe VP6, fourth critique: « dry, so
    // the focal point is dead »)
    if (lib.water) for (const [r, y, n] of [[1.95, 0.47, 8], [1.12, 1.98, 14], [0.6, 3.13, 12]] as Array<[number, number, number]>) {
      const g = new THREE.CircleGeometry(r, n, Math.PI / 8); g.rotateX(-Math.PI / 2); g.translate(0, y, -7);
      const m = new THREE.Mesh(g, lib.water); m.name = 'plaza:fountain-water'; m.layers.set(LAYER_NOREFLECT); m.frustumCulled = false; group.add(m);
    }
    blockers.push({ x: 0, z: -7, r: 2.5 }); obstacles.push({ x0: -2.3, x1: 2.3, z0: -9.3, z1: -4.7, grime: 0.35 });
    tracked(() => pavilion(S, lights, day, -9.4, -13.8, 0.55, 1.9, [[0.3, 0.37, 0.7], [0.88, 0.84, 0.72]], 'swords'));
    tracked(() => pavilion(S, lights, day, 9.4, -14.4, -0.55, 1.9, [[0.78, 0.6, 0.3], [0.88, 0.84, 0.72]], 'lances'));
    for (const [x, z] of [[-9.4, -13.8], [9.4, -14.4]]) { blockers.push({ x, z, r: 2.1 }); obstacles.push({ x0: x - 2, x1: x + 2, z0: z - 2, z1: z + 2, grime: 0.4 }); }
    // the registrar's table (a trestle, his board, the roll) north of the west street, the draw of the tournament on its board beside him
    S.append(trestle(rng.fork('registrar'), 2.4), mat([-7.4, 0, -10.6], 0.25));
    batch.add('chalkboard', { pos: [-5.9, 0, -10.3], yaw: -0.4 }); batch.add('basket', { pos: [-6.4, 1.0, -10.8], yaw: 1, scale: 0.6 }); batch.add('crate', { pos: [-8.9, 0, -11.6], yaw: 0.3 });
    tracked(() => bracketBoard(S, -9.9, -8.6, 1.25));
    blockers.push({ x: -7.4, z: -10.6, r: 1.4 }, { x: -9.9, z: -8.6, r: 1.1 }); obstacles.push({ x0: -8.7, x1: -6.1, z0: -11.0, z1: -10.2, grime: 0.5 });
    // the armourer south of the east street (his stall, a rack of blades), the healer's corner by the quay
    marketStall(8.3, -4.6, -0.55, 'cloth', 3.0, true, [[0.3, 0.37, 0.66], [0.8, 0.77, 0.68]]);
    tracked(() => weaponRack(S, 10.5, -1.6));
    blockers.push({ x: 10.5, z: -1.6, r: 1.2 });
    healer(S, batch, -8.0, 1.2, 0.6, blockers, obstacles);
    puddles.push({ x: -5.4, z: -6.6, r: 1.2, amount: 0.7 }, { x: 5.6, z: -9.8, r: 1.4, amount: 0.8 });
    // a lantern on each of four corners of the fountain's rim, lit at night (journal Passe VP6: the fountain unlit; the first lanterns on posts
    // round it read as the legs of a table)
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 8 + Math.PI / 4, x = Math.cos(a) * 2.28, z = -7 + Math.sin(a) * 2.28;
      batch.add(day ? 'lanternDark' : 'lantern', { pos: [x, 0.8, z], yaw: a }, 0);
      if (!day) lights.push({ pos: [x, 1.1, z], color: WARM, intensity: 1.6, radius: 5, kind: 'lantern', halo: 1.0, priority: 8 });
    }
    // the gate's braziers burn day and night (the arena's fires, as AD1)
    brazier(-4.6, -15.3); brazier(4.6, -15.3);
    lamp(-10.2, -11.2, false); lamp(6.6, -9.4, false);
    // the near edge: a carter's wagon by the quay's gate, crates and barrels on the other side (the frame's foreground)
    S.append(cart(rng.fork('cart')), mat([-7.6, 0, 6.9], 0.3));
    for (const [x, z, k, y] of [[8.4, 6.2, 'crate', 0.3], [9.2, 5.7, 'barrel', 0.8], [7.6, 6.8, 'barrel', 2.1], [9.9, 6.6, 'crate', 1.2], [8.9, 6.6, 'sack', 0.4]] as Array<[number, number, string, number]>) batch.add(k, { pos: [x, 0, z], yaw: y });
    paths.push([[0, 4], [0, -4], [0, -16.5]], [[-11, -4.3], [-4, -5.5]], [[11, -10.5], [4, -9]], [[-9, 2], [-7.4, -9.6]], [[9, 2], [8.3, -3.4]]);
    decal('grate', 3.2, -4.4, 0.9, 0.6, 0.3, 0.9); decal('manhole', -4.6, -12.2, 0.95, 0.95, 1.1, 0.85);
    scatter('crack', 6, -10, 10, -15, 3, [1.2, 2.2], [0.4, 0.7]); scatter('stain', 6, -10, 10, -15, 3, [1.6, 3.0], [0.25, 0.4], 0.014, [0.6, 0.62, 0.68]);
    scatter('straw', 3, 6.5, 10, -16.5, -13.5, [0.8, 1.3], [0.5, 0.75]); scatter('straw', 2, -10.5, -6.5, -16.5, -13.5, [0.8, 1.3], [0.5, 0.75]);
  } else if (kind === 'training') {
    // journal Passe VP6: the champions' yard: the tilt and its sand lanes across the north half, the quintain at its end, the spectators' stand
    // before the barracks, two sword rings, the archery butts along the east row, the racks by the street to the forecourt, the yard's fence
    // the yard's floor: beaten sand within a border of cobbles along the houses (journal Passe VP6: a cobbled plain with sand discs on it read
    // as a square, not as lists), worn darker where the feet go
    tracked(() => {
      const Tm = S.get('timber');
      // a kerb of light stone where the earth meets the setts (fourth critique: « a flat beige board with a hard black outline »)
      void Tm;
      for (const [x0, x1, z0, z1] of [[-10.2, 10.2, 2.55, 2.85], [-10.2, 10.2, -14.85, -14.55], [-10.25, -9.95, -14.85, 2.85], [9.95, 10.25, -14.85, 2.85]]) S.get('stone').boxMM(x0, 0, z0, x1, 0.07, z1, { tint: [0.7, 0.68, 0.64], uvScale: 1.2 });
    });
    {
      // the earth: the ground's own shading (light, shadows, wet, the mask's grime and wear) with its setts replaced (GroundShaders' SAND)
      const sand = new THREE.ShaderMaterial({ uniforms: lib.ground.uniforms, vertexShader: lib.ground.vertexShader, fragmentShader: lib.ground.fragmentShader, defines: { ...lib.ground.defines, SAND: 1 } });
      disposables.push(sand);
      const g = new THREE.PlaneGeometry(20, 17.2); g.rotateX(-Math.PI / 2); g.translate(0, 0.012, -6.0);
      const m = new THREE.Mesh(g, sand); m.name = 'plaza:sand'; m.layers.set(LAYER_NOREFLECT); m.frustumCulled = false; m.renderOrder = 1;
      group.add(m);
    }

    tracked(() => tiltYard(S, -6.0, 7.2, -11.4));
    for (let x = -6; x <= 7.2; x += 1.1) blockers.push({ x, z: -11.4, r: 0.32 });
    obstacles.push({ x0: -6.6, x1: 7.8, z0: -13.5, z1: -9.3, grime: 0.2 });
    tracked(() => quintain(S, 9.2, -11.4, -0.4));
    blockers.push({ x: 9.2, z: -11.4, r: 0.7 });
    tracked(() => grandstand(S, 0.8, -14.9, 7.2));
    // the yard's fires at the stand's ends, day and night (the arena's braziers)
    brazier(-3.6, -15.0); brazier(5.2, -15.0);
    blockers.push({ x: -1.8, z: -15.8, r: 1.2 }, { x: 0.8, z: -15.8, r: 1.2 }, { x: 3.4, z: -15.8, r: 1.2 });
    for (const [cx, cz, r] of [[-5.6, -4.2, 3.1]] as Array<[number, number, number]>) {
      sandRing(S, batch, cx, cz, r);
      blockers.push({ x: cx, z: cz, r: 0.6 });
      obstacles.push({ x0: cx - r, x1: cx + r, z0: cz - r, z1: cz + r, grime: 0.25 });
    }
    // the champions' platform: the yard's focal point (journal Passe VP6, third critique: « no focal prop, the rings faint lines »)
    tracked(() => sparringDais(S, batch, lights, day, 4.4, -4.2));
    for (const [x, z] of [[2.2, -2.0], [6.6, -2.0], [2.2, -6.4], [6.6, -6.4], [4.4, -4.2]]) blockers.push({ x, z, r: 1.5 });
    obstacles.push({ x0: 1.5, x1: 7.3, z0: -7.1, z1: -1.0, grime: 0.6 });
    for (const z of [-7.6, -9.0]) { tracked(() => archeryButt(S, 10.2, z, -Math.PI / 2)); blockers.push({ x: 10.2, z, r: 0.8 }); }
    for (const z of [-1.2, -5.6]) { tracked(() => weaponRack(S, -10.4, z)); blockers.push({ x: -10.4, z, r: 1.2 }); obstacles.push({ x0: -10.8, x1: -10.0, z0: z - 1.2, z1: z + 1.2, grime: 0.6 }); }
    for (const [x, z, k] of [[-1.4, -2.4, 'hay'], [-0.8, -3.2, 'hay'], [8.6, -9.4, 'bucket'], [7.9, -9.6, 'barrel'], [-8.6, -13.6, 'crate'], [8.8, 1.6, 'hay'], [9.5, 1.2, 'hay'], [-8.8, 2.2, 'barrel']] as Array<[number, number, string]>) {
      if (k === 'hay') batch.add('hay', { pos: [x, 0, z], yaw: x + z, tint: [0.62, 0.58, 0.5] }); else batch.add(k, { pos: [x, 0, z], yaw: x + z }); blockers.push({ x, z, r: 0.6 });
    }
    brazier(-2.2, -1.4);
    // the master's shed and the barracks to the north, facing the yard, their back row
    house('shed', [-5.5, 0, -17.6], 0, rng.fork('shed'), { width: 9, floors: 2, shop: 'general', roof: 'gable' });
    house('barracks', [5.6, 0, -17.6], 0, rng.fork('barracks'), { width: 9.4, floors: 3 });
    house('northB0', [-7.5, 0, -27], 0, rng.fork('nb0'), { width: 8, floors: 3, back: true });
    house('northB1', [4.5, 0, -27.5], 0, rng.fork('nb1'), { width: 8.5, floors: 3, back: true });
    lamp(-9.4, -14.4, false); lamp(9.6, -13.6, false);
    // lamps by the rings: their pools at night (journal Passe VP6: the yard a black void around the hero)
    lamp(-9.2, -7.4, false); lamp(1.2, -6.0, false);
    paths.push([[-11, -10.4], [-5, -9], [-1.5, -8]], [[0, 4], [-1.5, -8], [-5.5, -15]], [[0, 3], [5, -1]], [[-5.6, -4.2], [1, -9.5]]);
    // the sand's marks: the tilt's lanes rutted by hooves, straw where the bales are, scuffs between the rings
    for (const s2 of [-1, 1]) for (let x = -5.4; x <= 6.8; x += 1.7) decal('ruts', x, -11.4 + s2 * 1.1, 1.8, 1.1, Math.PI / 2 + dr.range(-0.08, 0.08), dr.range(0.45, 0.65), 0.04);
    scatter('straw', 5, -2.5, 0.5, -4.5, -1.2, [0.7, 1.2], [0.55, 0.8], 0.03); scatter('straw', 4, 7.5, 10, 0.5, 2.5, [0.7, 1.2], [0.55, 0.8], 0.03);
    scatter('mud', 7, -9, 9, -14, 2, [1.4, 2.6], [0.25, 0.45], 0.028, [0.85, 0.8, 0.74]);
    // the trampled earth round the dummy and the platform's steps
    for (const [x, z, w] of [[-5.6, -4.2, 4.2], [4.4, -0.6, 3.2], [-0.6, -10.2, 3.0]] as Array<[number, number, number]>) decal('mud', x, z, w, w * 0.8, dr.range(0, 6.28), 0.6, 0.03, [0.7, 0.66, 0.6]);
  } else {
    // journal Passe VP6: the festival square: the stage to the north, the maypole and its ribbons, the feast tables under the strings, the
    // puppet booth, stalls in striped canvas, the quay's gate, a wagon of barrels by it
    stage(S, batch, 0, -15.2);
    // the stage's own warm light at night (its backdrop read as a cold lavender block, the brightest surface that was not a light)
    if (!day) lights.push({ pos: [0, 3.3, -14.2], color: WARM, intensity: 2.6, radius: 7, kind: 'lantern', halo: 1.2, priority: 8 });
    blockers.push({ x: -1.8, z: -15.4, r: 1.9 }, { x: 1.8, z: -15.4, r: 1.9 });
    obstacles.push({ x0: -3.6, x1: 3.6, z0: -17, z1: -13.6, grime: 0.6 });
    tracked(() => danceFloor(S, -5.6, -5.4, 3.3));
    tracked(() => maypole(S, -5.6, -5.4, 7.0, 3.0));
    blockers.push({ x: -5.6, z: -5.4, r: 0.7 });
    tracked(() => feastTable(S, batch, 4.2, -5.4, 0.12, 4.4));
    tracked(() => feastTable(S, batch, 3.6, -9.6, -0.08, 3.8));
    for (const [x, z, r] of [[4.2, -5.4, 2.2], [3.6, -9.6, 2.0]]) blockers.push({ x: x - 1.2, z, r: r * 0.6 }, { x, z, r: r * 0.6 }, { x: x + 1.2, z, r: r * 0.6 });
    tracked(() => puppetBooth(S, -9.3, -12.4, 0.75));
    blockers.push({ x: -9.3, z: -12.4, r: 1.3 });
    marketStall(-9.2, -0.6, 0.45, 'candles', 3.0, false, [[0.3, 0.37, 0.7], [0.86, 0.82, 0.72]]);
    marketStall(8.3, -2.4, -0.45, 'pottery', 2.8, true, [[0.78, 0.6, 0.3], [0.86, 0.82, 0.72]]);
    marketStall(8.7, -14.2, -0.3, 'produce', 2.6, false, [[0.42, 0.46, 0.5], [0.8, 0.77, 0.7]]);
    for (const [x, z] of [[-6.4, -14.8], [6.2, -12.4]] as Array<[number, number]>) { batch.add('stool', { pos: [x, 0, z], yaw: x }); batch.add('barrel', { pos: [x + 0.6, 0, z - 0.3], yaw: z }); blockers.push({ x, z, r: 0.7 }); }
    house('north0', [-6, 0, -18.4], 0, rng.fork('north0'), { width: 8, floors: 3, shop: 'tavern' });
    house('north1', [5.5, 0, -18.4], 0, rng.fork('north1'), { width: 9, floors: 3, shop: 'general' });
    house('northB0', [-1.5, 0, -27], 0, rng.fork('nb0'), { width: 9, floors: 3, back: true });
    // strings across the square: lanterns at night (lit on every other string), the tournament's pennants by day (J4, J6) on two of the four,
    // higher (four strings of pennants read as a wall between the camera and the stage: the district's street has one, journal Passe VP1)
    for (let k = 0; k < 4; k++) {
      const z = -2 - k * 3.6, a: V3 = [-12.4, 4.6, z], b: V3 = [12.4, 4.6, z - 0.6];
      if (day) { if (k === 3) garland(S, [a[0], 5.4, a[2]], [b[0], 5.4, b[2]], 1.0, { size: 0.42, width: 0.34, spacing: 0.56, phase: k }); }
      else {
        cord(S, a, b, 0.9);
        for (let t = 1; t < 8; t++) { const u = t / 8, p = sag(a, b, 0.9, u); batch.add('lantern', { pos: [p[0], p[1] - 0.32, p[2]], yaw: t, scale: 1.1 }, 0); }
        if (k % 2) lights.push({ pos: [0, 3.9, z - 0.3], color: WARM, intensity: 2.2, radius: 8.5, kind: 'lantern', halo: 1.3, priority: 7 });
        // pools of light on the ground under the strings (journal Passe VP6, third critique: « the lanterns light nothing »)
        lights.push({ pos: [k % 2 ? 4.6 : -3.6, 3.2, z - 0.3], color: WARM, intensity: 1.9, radius: 6.5, kind: 'lantern', halo: 0, priority: 6 });
      }
    }
    lamp(-9.6, -15.6, false); lamp(10.2, -6.4, false);
    S.append(cart(rng.fork('cart')), mat([7.8, 0, 7.0], -0.35));
    // the right half's own corner (fourth critique: « a dead cobble field »): the cider seller's barrels on their trestle, two benches, a lantern
    // on a post lit at night
    for (const [x, z, k, y] of [[6.2, -0.6, 'barrel', 0.2], [7.0, -0.9, 'barrel', 1.1], [6.6, -0.1, 'barrelLying', 0.3], [7.6, -0.3, 'crate', 0.6]] as Array<[number, number, string, number]>) batch.add(k, { pos: [x, k === 'barrelLying' ? 0.3 : 0, z], yaw: y });
    for (const [x, z, yw] of [[4.2, -0.2, 0.25], [5.0, 1.4, -0.2]] as Array<[number, number, number]>) S.at([x, 0, z], yw, () => { S.get('planks').boxMM(-1.0, 0.4, -0.16, 1.0, 0.46, 0.16, { grain: 'x', tint: [0.6, 0.48, 0.38] }); for (const a of [-0.8, 0.8]) S.get('timber').boxMM(a - 0.04, 0, -0.12, a + 0.04, 0.4, 0.12, { tint: [0.46, 0.37, 0.3] }); });
    S.get('timber').boxMM(7.9, 0, -1.7, 8.02, 2.3, -1.58, { tint: [0.4, 0.33, 0.27], grain: 'y' });
    batch.add(day ? 'lanternDark' : 'lantern', { pos: [7.96, 2.5, -1.64], yaw: 0.4 }, 0);
    if (!day) lights.push({ pos: [7.9, 2.3, -1.3], color: WARM, intensity: 2.0, radius: 6.5, kind: 'lantern', halo: 1.0, priority: 7 });
    blockers.push({ x: 6.8, z: -0.5, r: 1.1 }, { x: 4.2, z: -0.2, r: 0.9 }, { x: 5.0, z: 1.4, r: 0.9 });
    for (const [x, z, k, y] of [[-8.6, 6.2, 'crate', 0.4], [-9.4, 5.7, 'barrel', 1.0], [-7.8, 6.7, 'barrelLying', 0.2], [-10.0, 6.6, 'crate', 1.4]] as Array<[number, number, string, number]>) batch.add(k, { pos: [x, k === 'barrelLying' ? 0.3 : 0, z], yaw: y });
    paths.push([[0, 4], [0, -13]], [[11, -10.5], [4, -11.5]], [[-9, 2], [-9.2, -0.6]], [[9, 2], [8.3, -2.4]], [[-5.6, -5.4], [-8.6, -11.6]]);
    scatter('straw', 5, -10, 10, -15, 2, [0.7, 1.2], [0.5, 0.75]); scatter('leaves', 4, -10, 10, -15, 2, [0.8, 1.3], [0.5, 0.7]);
    scatter('splinters', 3, 2, 6, -11, -4, [0.6, 1.0], [0.5, 0.7]); scatter('stain', 6, -10, 10, -15, 3, [1.6, 3.0], [0.25, 0.4], 0.014, [0.6, 0.62, 0.68]);
    scatter('crack', 4, -10, 10, -15, 3, [1.2, 2.2], [0.4, 0.7]);
  }

  // ---------------------------------------------------------------- the façades' wall lanterns: lit near the focal point, dark elsewhere (hierarchy)
  const [fx, fz] = FOCUS[kind];
  const wallLamps = sockets.filter((s) => s.kind === 'lamp');
  const ranked = [...wallLamps].sort((a, b) => Math.hypot(a.pos[0] - fx, a.pos[2] - fz) - Math.hypot(b.pos[0] - fx, b.pos[2] - fz));
  const litSet = new Set(ranked.slice(0, 3));
  for (const s of wallLamps) {
    if (day || !litSet.has(s)) { batch.add('lanternDark', { pos: [s.pos[0], s.pos[1] - 0.2, s.pos[2]], yaw: Math.atan2(s.dir[0], s.dir[2]) }, 0); continue; }
    batch.add('lantern', { pos: [s.pos[0], s.pos[1] - 0.22, s.pos[2]], yaw: Math.atan2(s.dir[0], s.dir[2]) }, 0);
    lights.push({ pos: [s.pos[0], s.pos[1] + 0.02, s.pos[2]], color: WARM, intensity: 2.7, radius: 9, kind: 'lantern', halo: 1.4, priority: 5 });
  }
  // heraldry as a focal accent: one guild banner on the house nearest the focal point (the district's buildBanners), the tournament's
  // (journal Passe VP3: the training ground's helm, the forecourt's crossed swords, the festival's laurel)
  const banner = [...sockets.filter((s) => s.kind === 'banner')].sort((a, b) => Math.hypot(a.pos[0] - fx, a.pos[2] - fz) - Math.hypot(b.pos[0] - fx, b.pos[2] - fz))[0];
  if (banner) addBanner(S, { pos: [banner.pos[0] + banner.dir[0] * 0.18, banner.pos[1] + 0.3, banner.pos[2] + banner.dir[2] * 0.18], yaw: Math.atan2(banner.dir[0], banner.dir[2]), w: 1.2, h: 2.6, emblem: kind === 'training' ? 'helm' : kind === 'forecourt' ? 'swords' : 'laurel', shape: 'swallow', loose: 0.5 });
  // the tournament's bunting by day only (J6): a swag across each house's first upper floor, and from the nearest façade to each south lamp
  if (day) {
    const front = sockets.filter((s) => s.kind === 'bunting' && (s.tag === 'left1' || s.tag === 'right1'));
    const byHouse = new Map<string, V3[]>();
    for (const s of front) byHouse.set(s.building, [...(byHouse.get(s.building) ?? []), s.pos]);
    let phase = 0;
    for (const pts of byHouse.values()) if (pts.length === 2) garland(S, pts[0], pts[1], 0.5, { size: 0.42, width: 0.34, spacing: 0.42, phase: phase++ });
    for (const top of kind === 'festival' ? [] : lampTops) {
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
  // the skyline beyond the north rows (journal Passe VP6: « no depth past the first row of façades »): the citadel's towers and spires, far
  {
    const r = rng.fork('spires');
    for (let n = 0; n < 5; n++) {
      far.frame.part = part();
      const x = (kind === 'training' ? -1 : 1) * (-46 + n * 24 + r.range(-5, 5)), z = -120 - r.range(0, 40);
      tower(far, x, r.range(2, 8), z, r.range(3.2, 5), r.range(18, 30), r.range(7, 12), [0.3, 0.31, 0.36], [0.12, 0.14, 0.2], 540 + n, day ? 0 : 0.2);
    }
    far.frame.part = 0;
  }
  // the Colosseum seen from the other squares: its drum above the roofs to the north-east (the forecourt stands at its foot)
  if (kind !== 'forecourt') tracked(() => S.at([kind === 'training' ? 58 : -52, 0, -132], 0, () => {
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
    group, lights, emitters, walk: { ...W }, lanes, exits, blockers, spots, wander,
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
  const nk = day ? 1 : 0.84, R = 52, C: V3 = [0, 0, -71.2], stone: V3 = [0.7 * nk, 0.67 * nk, 0.62 * nk], stoneLt: V3 = [0.76 * nk, 0.72 * nk, 0.66 * nk], dark: V3 = day ? [0.17, 0.16, 0.17] : [0.07, 0.07, 0.09], uv = 0.85;
  // journal Passe VP6, third critique (« a single flat plane with a noisy brick texture »): the stone keeps the frame (piers, arches, courses,
  // cornice), the panels between them are smooth stucco
  const Pl = S.get('plaster'), stucco: V3 = [0.7 * nk, 0.67 * nk, 0.62 * nk];
  const St = S.get('stone'), Dk = S.get('dark');
  // two tiers, 6.4 and 10.8 m, the cornice at 11.25 (journal Passe VP1: the third critique asked for the top in the frame; lowered to 5.3 /
  // 8.9 m, the fourth judged it worse, 5.5 / 10 against 6: its flat top and bare masts read as a box with antennae, the landmark lost its mass)
  const TIER_G = 6.4, TIER_U = 10.8;
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
        St.boxMM(s * hw - 0.42, 0, -0.5, s * hw + 0.42, TIER_G, 0.3, { uvScale: uv, tint: stoneLt, aoY: [0.7, 1] });
        // journal Passe VP6 (« articulate the wall »): a pilaster on each pier, its base and its capital
        St.boxMM(s * hw - 0.3, 0.95, 0.3, s * hw + 0.3, TIER_G - 0.35, 0.5, { uvScale: uv, tint: [stoneLt[0] * 1.04, stoneLt[1] * 1.04, stoneLt[2] * 1.04] });
        St.boxMM(s * hw - 0.38, TIER_G - 0.35, 0.28, s * hw + 0.38, TIER_G - 0.2, 0.58, { tint: stoneLt });
        St.boxMM(s * hw - 0.26, TIER_G, -0.4, s * hw + 0.26, TIER_U, 0.18, { uvScale: uv, tint: stoneLt, aoY: [0.8, 1] });
      }
      // the ground tier's arch (the gate wider and taller), the upper tier's
      if (b.gate) arch(0, 0, 2.1, 4.0, 0, stoneLt); else arch(0, 0, 1.25, 3.4, 0, stoneLt);
      // the tunnels behind two ground arches either side lit at night (the arena's galleries; the third critique's « red slab » was an upper arch)
      if (!day && !b.gate && [2, 4].includes(Math.abs(Math.round(b.a * R / bayW)))) S.get('glow').boxMM(-1.24, 0, -0.69, 1.24, 3.4, -0.68, { tint: [0.34, 0.2, 0.08] });
      arch(0, TIER_G + 0.55, 0.95, 1.6, -0.1, stoneLt);
      // at night the arena's galleries keep a light in one upper arch out of three (journal Passe VP6: the facade a dark wall at night)
      // the wall between the arches' heads and the string course above them (the first try left both open onto the sky)
      const top = b.gate ? 6.1 : 4.65, upTop = TIER_G + 0.55 + 1.6 + 0.95;
      Pl.boxMM(-hw + 0.42, top, -0.12, hw - 0.42, TIER_G + 0.05, -0.02, { tint: stucco });
      Pl.boxMM(-0.97, upTop, -0.12, 0.97, TIER_U + 0.02, -0.1, { tint: stucco });
      // the wall around the upper arch, the string courses, the cornice (the top: no attic)
      St.boxMM(-hw + 0.26, TIER_G, -0.12, hw - 0.26, TIER_G + 0.55, -0.1, { uvScale: uv, tint: stone });
      for (const s of [-1, 1]) Pl.boxMM(s > 0 ? 0.95 : -hw + 0.26, TIER_G + 0.55, -0.12, s > 0 ? hw - 0.26 : -0.95, TIER_U, -0.1, { tint: stucco });
      // the gate's two towers on the bays either side of it (journal Passe VP6: a landmark, not a wall)
      if (Math.abs(Math.round(b.a * R / bayW)) === 1) gateTower(S, day, lights, b.a < 0 ? 'swords' : 'crown', stone, stoneLt, uv);
      St.boxMM(-hw - 0.45, TIER_G - 0.2, -0.55, hw + 0.45, TIER_G + 0.15, 0.42, { uvScale: uv, tint: stoneLt });
      St.boxMM(-hw - 0.3, TIER_U, -0.6, hw + 0.3, TIER_U + 0.45, 0.35, { uvScale: uv, tint: stoneLt });
      // journal Passe VP6 (« a uniform flat plane, no parapet, no skyline »): a darker plinth along the base, a crenellated parapet on the cornice
      St.boxMM(-hw - 0.45, 0, -0.56, hw + 0.45, 0.95, 0.38, { uvScale: uv, tint: [stone[0] * 0.78, stone[1] * 0.78, stone[2] * 0.8], aoY: [0.55, 1] });
      St.boxMM(-hw - 0.3, TIER_U + 0.45, -0.5, hw + 0.3, TIER_U + 0.95, -0.1, { uvScale: uv, tint: stone });
      for (const m of [-hw / 2, hw / 2]) St.boxMM(m - 0.45, TIER_U + 0.95, -0.5, m + 0.45, TIER_U + 1.6, -0.1, { uvScale: uv, tint: stoneLt });
      // a mast and its pennant on every other bay, the tournament's colours and its charges (the gate's crown, then swords and laurels)
      const bay = Math.round(b.a * R / bayW);
      if (b.gate || bay % 2 === 0) {
        S.get('timber').boxMM(-0.06, TIER_U + 0.45, -0.2, 0.06, TIER_U + 3.8, -0.08, { tint: [0.5, 0.42, 0.34], grain: 'y' });
        addBanner(S, { pos: [0.12, TIER_U + 3.5, -0.14], yaw: Math.PI / 2, w: 0.5, h: 1.5, emblem: b.gate ? 'crown' : bay % 4 === 0 ? 'swords' : 'laurel', shape: 'pennant', loose: 0.7, rod: false, tint: b.gate ? [0.95, 0.88, 0.62] : [0.5, 0.6, 0.95] });
      }
      if (b.gate) {
        // the portcullis: raised by day (its teeth under the head), shut at night with the doors behind it
        const M = S.get('metal'), y0 = day ? 3.4 : 0;
        for (let i = -4; i <= 4; i++) M.boxMM(i * 0.45 - 0.04, y0, -0.32, i * 0.45 + 0.04, 6.1, -0.26, { tint: [0.3, 0.3, 0.32] });
        for (let y = y0 + 0.3; y < 6.1; y += 0.55) M.boxMM(-2.05, y, -0.33, 2.05, y + 0.06, -0.27, { tint: [0.3, 0.3, 0.32] });
        if (!day) S.get('planks').boxMM(-2.1, 0, -0.6, 2.1, 5.9, -0.5, { grain: 'y', tint: [0.42, 0.32, 0.24] });
        // the great banner over the gate: the duel itself
        addBanner(S, { pos: [0, TIER_U - 0.25, 0.4], yaw: 0, w: 1.6, h: 3.0, emblem: 'duel', shape: 'swallow', loose: 0.35, tint: [0.95, 0.88, 0.62] });
      } else if (Math.abs(b.a) * R < bayW * 2.2) {
        // long banners on the bays beside the gate: the lances on one side, the champion's cup on the other
        addBanner(S, { pos: [0, TIER_U - 0.25, 0.4], yaw: 0, w: 1.1, h: 3.2, emblem: b.a < 0 ? 'lances' : 'trophy', shape: 'swallow', loose: 0.4, tint: [0.5, 0.6, 0.95] });
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
  // at night a torch on a bracket on the gate's piers and two bays further (journal Passe VP6: the forecourt's night was the
  // darkest of the squares, its north frame a dark wall)
  if (!day) for (const s of [-1, 1]) for (const k of [2, 4]) {
    const a = s * (gateW / 2 + bayW * k) / R, x = Math.sin(a) * (R + 0.5), z = C[2] + Math.cos(a) * (R + 0.5);
    S.get('metal').box(x, 3.1, z, 0.1, 0.5, 0.1, { tint: [0.3, 0.28, 0.27] });
    S.get('glow').box(x, 3.45, z, 0.16, 0.22, 0.16, { tint: [1, 0.6, 0.25] });
    lights.push({ pos: [x, 3.6, z + 0.4], color: FIRE, intensity: 2.0, radius: 6.5, kind: 'fire', halo: 1.4, priority: 8 });
  }
  if (!day) for (const s of [-1, 1]) { const a = s * (gateW / 2 + bayW / 2) / R, x = Math.sin(a) * (R + 3.4), z = C[2] + Math.cos(a) * (R + 3.4); lights.push({ pos: [x, 3.6, z + 0.3], color: FIRE, intensity: 2.4, radius: 7, kind: 'fire', halo: 1.2, priority: 9 }); }
  // the gate's passage lit at night (fourth critique: « the gate a black void »): a lantern hung under its arch, its light on the doors
  if (!day) { S.get('metal').boxMM(-0.02, 5.2, C[2] + R - 0.3, 0.02, 6.05, C[2] + R - 0.26, { tint: [0.3, 0.3, 0.32] }); S.get('glow').box(0, 4.95, C[2] + R - 0.28, 0.3, 0.42, 0.3, { tint: [1, 0.62, 0.28] }); lights.push({ pos: [0, 4.6, C[2] + R + 0.8], color: FIRE, intensity: 2.6, radius: 7.5, kind: 'fire', halo: 1.2, priority: 9 }); }
  // inside a few ground arches: the tunnels' torches (warm accents at the focal point, lit day and night like the arena's fires)
  for (const s of [-1, 1]) {
    const a = s * (gateW / 2 + bayW * 1.5) / R, x = Math.sin(a) * R, z = C[2] + Math.cos(a) * R - 0.6;
    S.get('glow').box(x, 2.6, z, 0.18, 0.4, 0.1, { tint: [1, 0.55, 0.2] });
    lights.push({ pos: [x, 2.6, z + 0.5], color: FIRE, intensity: 1.8, radius: 5.5, kind: 'fire', halo: 1.1, priority: 8, day: true });
  }
  void emitters;
  blockers.push({ x: 0, z: -18.6, r: 0.1 });
  for (const s of [-1, 1]) { const a = s * (gateW / 2 + bayW / 2) / R, x = Math.sin(a) * R; blockers.push({ x, z: -17.6, r: 2.4 }); obstacles.push({ x0: x - 2.5, x1: x + 2.5, z0: -20.5, z1: -16.0, grime: 0.8 }); }
  obstacles.push({ x0: -14, x1: 14, z0: -21.5, z1: -19.0, grime: 0.9 });
}

/** one of the arena gate's towers, in the frame of its bay (local z out of the facade): a square tower standing 3.2 m proud of the arcade and
 *  5 m above its cornice, a darker plinth, the tiers' courses carried round it, arrow slits, a corbelled parapet with merlons, the tournament's
 *  banner on its face and a pennant on a pole; a torch on its face and a lit slit at night */
function gateTower(S: SlotSet, day: boolean, lights: PlazaBuild['lights'], emblem: EmblemKind, stone: V3, stoneLt: V3, uv: number): void {
  const St = S.get('stone'), w = 2.4, z0 = -0.6, z1 = 3.2, H = 15.4;
  St.boxMM(-w, 0, z0, w, H, z1, { uvScale: uv, tint: stone, aoY: [0.6, 1] });
  St.boxMM(-w - 0.12, 0, z0, w + 0.12, 1.2, z1 + 0.12, { uvScale: uv, tint: [stone[0] * 0.78, stone[1] * 0.78, stone[2] * 0.8] });
  for (const y of [6.4, 10.8]) St.boxMM(-w - 0.1, y, z0, w + 0.1, y + 0.32, z1 + 0.1, { tint: stoneLt });
  St.boxMM(-w - 0.25, H - 0.4, z0 - 0.25, w + 0.25, H + 0.3, z1 + 0.25, { tint: stoneLt });
  for (let i = 0; i < 6; i++) St.box(-w + 0.2 + (i * (2 * w - 0.4)) / 5, H - 0.6, z1 + 0.12, 0.22, 0.3, 0.26, { tint: stoneLt });
  St.boxMM(-w - 0.25, H + 0.3, z1 - 0.2, w + 0.25, H + 0.7, z1 + 0.25, { tint: stone });
  for (let i = 0; i < 4; i++) { const x = -w + 0.45 + (i * (2 * w - 0.9)) / 3; St.boxMM(x - 0.42, H + 0.7, z1 - 0.2, x + 0.42, H + 1.45, z1 + 0.25, { tint: stoneLt }); }
  for (const xs of [-w - 0.05, w + 0.05]) for (let i = 0; i < 3; i++) { const zz = z0 + 0.5 + i * 1.3; St.boxMM(Math.min(xs, xs * 1.04) - 0.2, H + 0.7, zz - 0.35, Math.max(xs, xs * 1.04) + 0.2, H + 1.45, zz + 0.35, { tint: stoneLt }); }
  const D = S.get('dark');
  for (const [x, y] of [[-1.0, 4.2], [1.0, 4.2], [0, 8.4], [0, 12.6]] as Array<[number, number]>) D.boxMM(x - 0.12, y, z1 + 0.005, x + 0.12, y + 1.1, z1 + 0.02, { tint: [0.06, 0.06, 0.08] });
  if (!day) S.get('glow').boxMM(-0.11, 12.62, z1 + 0.022, 0.11, 13.68, z1 + 0.03, { tint: [0.9, 0.5, 0.2] });
  addBanner(S, { pos: [0, 10.4, z1 + 0.14], yaw: 0, w: 1.5, h: 3.6, emblem, shape: 'swallow', loose: 0.3, rod: true, tint: emblem === 'crown' ? [0.95, 0.88, 0.62] : [0.5, 0.6, 0.95] });
  S.get('timber').boxMM(-0.06, H + 0.3, 1.2, 0.06, H + 4.0, 1.32, { tint: [0.5, 0.42, 0.34], grain: 'y' });
  addBanner(S, { pos: [0.12, H + 3.7, 1.26], yaw: Math.PI / 2, w: 0.55, h: 1.6, emblem, shape: 'pennant', loose: 0.8, rod: false, tint: [0.95, 0.88, 0.62] });
  S.get('metal').box(0, 3.1, z1 + 0.15, 0.1, 0.5, 0.1, { tint: [0.3, 0.28, 0.27] });
  if (!day) S.get('glow').box(0, 3.45, z1 + 0.15, 0.16, 0.22, 0.16, { tint: [1, 0.6, 0.25] });
  void lights;
}

/** the fountain at the forecourt's heart: an octagonal basin with its rim, dark water, a pedestal with a bowl and a spout (the first build's
 *  glowing water ring read as a target at night) */
function fountain(S: SlotSet, tracked: (fn: () => void) => void, x: number, z: number): void {
  tracked(() => S.at([x, 0, z], Math.PI / 8, () => {
    const St = S.get('stone'), oct = (r: number): Array<[number, number]> => Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * Math.PI * 2) * r, Math.sin((i / 8) * Math.PI * 2) * r]);
    St.prism(oct(2.2), 0, 0.5, { tint: [0.74, 0.71, 0.66], capTop: false, aoY: [0.6, 1] });
    // the rim as a ring (journal Passe VP6: a capped prism lidded the basin at 0.64 m, the water under it never seen)
    St.prism(oct(2.36), 0.5, 0.64, { tint: [0.84, 0.8, 0.74], capTop: false });
    const o0 = oct(1.95), o1 = oct(2.36);
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;
      quadFacing(St, [[o0[i][0], 0.64, o0[i][1]], [o0[j][0], 0.64, o0[j][1]], [o1[j][0], 0.64, o1[j][1]], [o1[i][0], 0.64, o1[i][1]]], [0, 1, 0], { tint: [0.84, 0.8, 0.74] });
      const mx = (o0[i][0] + o0[j][0]) / 2, mz = (o0[i][1] + o0[j][1]) / 2;
      quadFacing(St, [[o0[i][0], 0.3, o0[i][1]], [o0[j][0], 0.3, o0[j][1]], [o0[j][0], 0.64, o0[j][1]], [o0[i][0], 0.64, o0[i][1]]], [-mx, 0, -mz], { tint: [0.6, 0.58, 0.54] });
    }
    S.get('dark').prism(oct(1.95), 0.3, 0.32, { tint: [0.1, 0.13, 0.17], capTop: true });
    // journal Passe VP6 (« a four-legged birdbath »): a heavier column, a wide lower bowl, a second tier and a finial
    St.lathe([[0.72, 0.4], [0.7, 0.62], [0.46, 0.78], [0.38, 1.5], [0.5, 1.62], [1.15, 1.78], [1.25, 1.92], [1.2, 2.02], [0.32, 2.06], [0.26, 2.9], [0.66, 3.05], [0.7, 3.16], [0.18, 3.2], [0.15, 3.62], [0.3, 3.78], [0.22, 4.0], [0.01, 4.12]], 12, { tint: [0.8, 0.76, 0.7] });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; St.box(Math.cos(a) * 2.28, 0.72, Math.sin(a) * 2.28, 0.26, 0.16, 0.26, { tint: [0.86, 0.82, 0.76] }); }
  }));
}

/** a raised ring of sand with its timber kerb, a fence of posts and two rails open toward the camera, a practice dummy at its heart */
function sandRing(S: SlotSet, batch: InstanceBatch, cx: number, cz: number, r: number): void {
  const n = 28, poly: Array<[number, number]> = Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * Math.PI * 2) * r, cz + Math.sin((i / n) * Math.PI * 2) * r]);
  // sand: the plaster's ivory warmed (the stone's grey-blue under a sand tint read green)
  S.get('plaster').prism(poly, 0, 0.05, { tint: [0.66, 0.58, 0.47], capTop: true });
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
    S.get('cloth').box(0, 1.36, 0, 1.3, 0.17, 0.17, { tint: straw });
    for (const a of [-0.58, 0.58]) S.get('cloth').box(a, 1.36, 0, 0.2, 0.22, 0.22, { tint: [0.6, 0.49, 0.3] });
    S.get('cloth').cylinder(0.32, 0.7, 1.5, 8, { tint: straw, capTop: true, capBottom: true, r1: 0.26 });
    S.get('dark').cylinder(0.3, 1.08, 1.14, 8, { tint: [0.16, 0.13, 0.11] });
    S.get('cloth').cylinder(0.19, 1.52, 1.9, 8, { tint: sack, capTop: true, capBottom: true, r1: 0.15 });
    // journal Passe VP6 (« the dummies are still crosses »): a battered helm on the head, a round shield on the left arm, cross feet
    S.get('metal').cylinder(0.21, 1.78, 1.98, 8, { tint: [0.5, 0.52, 0.56], capTop: true, r1: 0.12 });
    S.with(mat([-0.5, 1.15, 0.2], 0.3, 1, Math.PI / 2), () => S.get('metal').cylinder(0.34, -0.03, 0.03, 12, { tint: [0.3, 0.36, 0.62], capTop: true, capBottom: true }));
    for (const a of [0, Math.PI / 2]) S.at([0, 0, 0], a, () => T.boxMM(-0.55, 0, -0.06, 0.55, 0.14, 0.06, { tint: [0.4, 0.32, 0.25] }));
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
    for (let i = 0; i < 10; i++) { const x0 = -3.12 + (6.24 * i) / 10, x1 = x0 + 6.24 / 10; C.quad([x0, 0.95, -1.36], [x1, 0.95, -1.36], [x1, 3.7, -1.36], [x0, 3.7, -1.36], { tint: i % 2 ? [0.3, 0.36, 0.62] : [0.62, 0.58, 0.5], swayArr: [0, 0, 0.15, 0.15] }); }
    // the canopy: a striped tent roof over the boards, its ridge along the stage, a scalloped valance on its front eave, guy ropes to pegs
    // (journal Passe VP6, third critique: « a flat striped box with no tent volume »)
    for (let i = 0; i < 10; i++) {
      const x0 = -3.5 + (7.0 * i) / 10, x1 = x0 + 7.0 / 10, t: V3 = i % 2 ? [0.3, 0.37, 0.68] : [0.86, 0.82, 0.7];
      C.quad([x0, 5.3, -0.55], [x1, 5.3, -0.55], [x1, 4.0, 0.75], [x0, 4.0, 0.75], { tint: t, flip: true, swayArr: [0, 0, 0.35, 0.35] });
      C.quad([x0, 4.0, -1.85], [x1, 4.0, -1.85], [x1, 5.3, -0.55], [x0, 5.3, -0.55], { tint: t, flip: true, swayArr: [0.35, 0.35, 0, 0] });
      C.tri([x0, 4.0, 0.76], [x1, 4.0, 0.76], [(x0 + x1) / 2, 3.66, 0.78], { tint: i % 2 ? [0.86, 0.82, 0.7] : [0.3, 0.37, 0.68], swayArr: [0.3, 0.3, 0.6] });
    }
    for (const a of [-3.5, 3.5]) C.tri([a, 4.0, 0.75], [a, 4.0, -1.85], [a, 5.3, -0.55], { tint: [0.3, 0.37, 0.68] });
    T.boxMM(-3.6, 5.28, -0.6, 3.6, 5.38, -0.5, { tint: [0.5, 0.4, 0.32], grain: 'x' });
    for (const a of [-3.5, 3.5]) S.get('cloth').sweep([[a, 4.0, 0.75], [a * 1.25, 0, 2.6]], 0.015, 4, { tint: [0.4, 0.35, 0.3] });
    addBanner(S, { pos: [0, 3.5, -1.3], yaw: 0, w: 1.4, h: 2.2, emblem: 'horn', shape: 'swallow', loose: 0.4, rod: true, tint: [0.95, 0.88, 0.62] });
    // journal Passe VP6: pennants on the canopy's front posts, the players' things on the boards (a chest, a drum, a stool), a lantern on a post at
    // each front corner
    for (const a of [-3.2, 3.2]) { T.boxMM(a - 0.04, 3.8, 0.35, a + 0.04, 5.0, 0.43, { tint: [0.5, 0.4, 0.32], grain: 'y' }); addBanner(S, { pos: [a + 0.05, 4.9, 0.39], yaw: a > 0 ? -Math.PI / 2 : Math.PI / 2, w: 0.4, h: 1.0, emblem: a > 0 ? 'laurel' : 'trophy', shape: 'pennant', loose: 0.85, rod: false, tint: [0.95, 0.88, 0.62] }); }
    S.get('planks').boxMM(-2.6, 0.95, -0.9, -1.7, 1.45, -0.4, { tint: [0.5, 0.36, 0.26], grain: 'x' });
    S.get('metal').boxMM(-2.62, 1.45, -0.92, -1.68, 1.5, -0.38, { tint: [0.9, 0.75, 0.45] });
    S.at([1.6, 0.95, -0.6], 0, () => { S.get('cloth').cylinder(0.32, 0, 0.5, 10, { tint: [0.62, 0.3, 0.24], capTop: true }); S.get('plaster').cylinder(0.3, 0.5, 0.52, 10, { tint: [0.9, 0.86, 0.76], capTop: true }); });
    for (const a of [-3.55, 3.55]) T.boxMM(a - 0.05, 0, 1.75, a + 0.05, 2.3, 1.85, { tint: [0.42, 0.34, 0.27], grain: 'y' });
  });
  for (const a of [-3.55, 3.55]) batch.add('lantern', { pos: [x + a, 2.55, z + 1.8], yaw: 0 }, 0);
  batch.add('barrel', { pos: [x - 2.6, 0.95, z - 0.9], yaw: 0.3 }); batch.add('stool', { pos: [x + 1.8, 0.95, z - 0.6], yaw: 1.2 });
}

/** a side street's gateway (journal Passe VP5; a stone arch since journal Passe VP6, the first timber lintel did not read as a way out): two
 *  piers in the row's front plane, a round arch between them, the wall over it with its coping and the sign of the place the street leads to,
 *  a lantern on a bracket on each pier (lit at night), the street's darker setts, a lantern lit at night where the street turns; the day's
 *  bunting under the arch */
function gateway(S: SlotSet, batch: InstanceBatch, lights: PlazaBuild['lights'], day: boolean, side: -1 | 1, zs: number, zn: number, emblem: EmblemKind): void {
  const x = side * 13.25, inward = -side, zc = (zs + zn) / 2, St = S.get('stone'), Dk = S.get('stone');
  const stone: V3 = [0.68, 0.65, 0.6], cap: V3 = [0.8, 0.76, 0.7], pw = 0.62, th = 0.5, imp = 3.4, R = (zs - zn) / 2 - pw, top = imp + R + 1.25;
  void Dk;
  // the piers, their plinths and imposts
  for (const [za, zb] of [[zs - pw, zs + 0.04], [zn - 0.04, zn + pw]]) {
    St.boxMM(x - th, 0, za, x + th, imp, zb, { tint: stone, aoY: [0.6, 1], uvScale: 0.8 });
    St.boxMM(x - th - 0.06, 0, za - 0.06, x + th + 0.06, 0.45, zb + 0.06, { tint: cap });
    St.boxMM(x - th - 0.06, imp - 0.16, za - 0.04, x + th + 0.06, imp, zb + 0.04, { tint: cap });
    const zp = (za + zb) / 2;
    batch.add(day ? 'lanternDark' : 'lantern', { pos: [x + inward * (th + 0.32), 2.4, zp], yaw: inward > 0 ? Math.PI / 2 : -Math.PI / 2 }, 0);
    S.get('metal').boxMM(Math.min(x + inward * th, x + inward * (th + 0.36)), 2.8, zp - 0.02, Math.max(x + inward * th, x + inward * (th + 0.36)), 2.85, zp + 0.02, { tint: [0.3, 0.3, 0.32] });
    if (!day) lights.push({ pos: [x + inward * (th + 0.4), 2.45, zp], color: WARM, intensity: 2.2, radius: 7, kind: 'lantern', halo: 1.4, priority: 7 });
  }
  // the arch: its soffit, the spandrels on both faces, its ring of voussoirs (inward face), the wall over it and the coping
  const n = 12, P = (a: number, xx: number): V3 => [xx, imp + Math.sin(a) * R, zc + Math.cos(a) * R];
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI, am = (a0 + a1) / 2;
    quadFacing(St, [P(a0, x - th), P(a1, x - th), P(a1, x + th), P(a0, x + th)], [0, -Math.sin(am), -Math.cos(am)], { tint: [0.56, 0.53, 0.49], uvScale: 0.8 });
    for (const f of [-1, 1]) {
      const xx = x + f * th, corner: V3 = [xx, imp + R, am < Math.PI / 2 ? zc + R : zc - R];
      quadFacing(St, [P(a0, xx), P(a1, xx), corner, corner], [f, 0, 0], { tint: stone, uvScale: 0.8 });
      if (f === inward && i % 2 === 0) St.box(xx + f * 0.03, imp + Math.sin(am) * (R + 0.14), zc + Math.cos(am) * (R + 0.14), 0.08, 0.3, 0.3, { tint: cap });
    }
  }
  St.boxMM(x - th, imp + R, zn - 0.04, x + th, top, zs + 0.04, { tint: stone, uvScale: 0.8 });
  St.boxMM(x - th - 0.12, top, zn - 0.16, x + th + 0.12, top + 0.18, zs + 0.16, { tint: cap });
  St.boxMM(x - th - 0.08, imp + R - 0.08, zn - 0.08, x + th + 0.08, imp + R + 0.06, zs + 0.08, { tint: cap });
  // the sign over the arch: the painted shield of the place the street leads to, on the inward face
  const B = S.get('banner'), [u0, v0, u1, v1] = emblemRect(emblem, 0.01), w = 0.78, h = 0.98, ytop = top - 0.1, xs = x + inward * (th + 0.03);
  const P5: Array<[number, number]> = [[-w / 2, ytop], [w / 2, ytop], [w / 2, ytop - h * 0.5], [0, ytop - h], [-w / 2, ytop - h * 0.5]];
  const uvOf = (pz: number, py: number): [number, number] => [u0 + ((pz + w / 2) / w) * (u1 - u0), v1 - ((ytop - py) / h) * (v1 - v0)];
  const ctr: [number, number] = [0, ytop - h * 0.4];
  for (let i = 0; i < 5; i++) {
    const a = P5[i], b = P5[(i + 1) % 5];
    // seen from the square the shield reads left to right along the street's axis
    B.tri([xs, a[1], zc - a[0] * inward], [xs, b[1], zc - b[0] * inward], [xs, ctr[1], zc - ctr[0] * inward], { uvs: [...uvOf(a[0], a[1]), ...uvOf(b[0], b[1]), ...uvOf(ctr[0], ctr[1])], tint: [1, 1, 1], ao: 1, aux: [0.1, 0, 0.5, 0] });
  }
  // the street: its darker setts to the turn, a lantern lit at night on the house it ends at
  const xa = side * 13.2, xb = side * 21.3;
  quadFacing(S.get('stone'), [[Math.min(xa, xb), 0.011, zs], [Math.max(xa, xb), 0.011, zs], [Math.max(xa, xb), 0.011, zn], [Math.min(xa, xb), 0.011, zn]], [0, 1, 0], { tint: [0.46, 0.46, 0.48], uvScale: 1.4 });
  if (!day) { batch.add('lantern', { pos: [side * 21.0, 2.7, zc], yaw: inward > 0 ? Math.PI / 2 : -Math.PI / 2 }, 0); lights.push({ pos: [side * 20.8, 2.8, zc], color: WARM, intensity: 2.0, radius: 7.5, kind: 'lantern', halo: 1.3, priority: 6 }); }
  if (day) garland(S, [x + inward * (th + 0.05), imp - 0.1, zs - pw], [x + inward * (th + 0.05), imp - 0.1, zn + pw], 0.4, { size: 0.36, width: 0.3, spacing: 0.4 });
}

/** the gate to the quay (journal Passe VP5): two stone pillars ending the hedge wall at the frame's near edge, a lantern on each (lit at night).
 *  Low: the camera stands just behind them when the hero is at the square's far end (journal Passe VP6: posts at the kerb read as grey blocks
 *  in the middle of the frame) */
function quayGate(S: SlotSet, batch: InstanceBatch, lights: PlazaBuild['lights'], day: boolean): void {
  const St = S.get('stone');
  for (const s of [-1, 1]) {
    const x = s * 3.1, z = 8.3;
    St.boxMM(x - 0.42, 0, z - 0.42, x + 0.42, 0.3, z + 0.42, { tint: [0.78, 0.74, 0.68] });
    St.boxMM(x - 0.3, 0.3, z - 0.3, x + 0.3, 1.5, z + 0.3, { tint: [0.68, 0.65, 0.6], aoY: [0.6, 1], uvScale: 0.8 });
    St.boxMM(x - 0.36, 1.5, z - 0.36, x + 0.36, 1.6, z + 0.36, { tint: [0.8, 0.76, 0.7] });
    S.at([x, 1.6, z], Math.PI / 4, () => St.cylinder(0.36, 0, 0.36, 4, { tint: [0.8, 0.76, 0.7], r1: 0.02 }));
    batch.add(day ? 'lanternDark' : 'lantern', { pos: [x - s * 0.36, 1.4, z], yaw: s > 0 ? -Math.PI / 2 : Math.PI / 2 }, 0);
    if (!day) lights.push({ pos: [x - s * 0.5, 1.4, z], color: WARM, intensity: 2.2, radius: 7, kind: 'lantern', halo: 1.4, priority: 7 });
  }
}

// ---------------------------------------------------------------- the squares' landmarks (journal Passe VP6)

/** a competitor's pavilion: a round tent of striped canvas open toward the square, a scalloped valance, a conical roof, a finial and its
 *  pennant; lit from inside at night (the canvas glows) */
function pavilion(S: SlotSet, lights: PlazaBuild['lights'], day: boolean, x: number, z: number, yaw: number, r: number, colours: [V3, V3], emblem: EmblemKind): void {
  const C = S.get('cloth'), n = 16, wallH = 2.2, eave = 2.35, roofH = 4.4;
  S.at([x, 0, z], yaw, () => {
    const p = (a: number, rr: number, y: number): V3 => [Math.sin(a) * rr, y, Math.cos(a) * rr];
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2, t = i % 2 ? colours[0] : colours[1];
      const out: V3 = [Math.sin(am), 0, Math.cos(am)];
      // the doorway: the two panels facing the local +z drawn back (the inside dark but for its lamp)
      if (Math.cos(am) < 0.93) quadFacing(C, [p(a0, r, 0), p(a1, r, 0), p(a1, r, wallH), p(a0, r, wallH)], out, { tint: t, ao: [0.75, 0.75, 1, 1], swayArr: [0, 0, 0.1, 0.1] });
      else quadFacing(S.get('dark'), [p(a0, r * 0.2, 0), p(a1, r * 0.2, 0), p(a1, r * 0.2, wallH), p(a0, r * 0.2, wallH)], out, { tint: [0.1, 0.09, 0.1] });
      C.tri(p(a0, r + 0.22, eave), p(a1, r + 0.22, eave), [0, roofH, 0], { tint: t, ao: [0.85, 0.85, 1], swayArr: [0.06, 0.06, 0] });
      C.tri(p(a0, r + 0.22, eave), p(am, r + 0.24, eave - 0.36), p(a1, r + 0.22, eave), { tint: i % 2 ? colours[1] : colours[0], swayArr: [0.1, 0.4, 0.1] });
    }
    // the floor rug inside, the pole, the finial and its pennant
    S.get('cloth').cylinder(r * 0.92, 0.01, 0.03, n, { tint: [0.42, 0.3, 0.24], capTop: true });
    S.get('timber').cylinder(0.06, 0, roofH + 1.25, 6, { tint: [0.46, 0.38, 0.3], capTop: true });
    S.get('metal').box(0, roofH + 1.28, 0, 0.14, 0.14, 0.14, { tint: [1.2, 1.0, 0.6] });
    addBanner(S, { pos: [0.05, roofH + 1.15, 0], yaw: Math.PI / 2, w: 0.46, h: 1.25, emblem, shape: 'pennant', loose: 0.85, rod: false, tint: [0.95, 0.9, 0.75] });
  });
  if (!day) lights.push({ pos: [x, 1.5, z], color: WARM, intensity: 3.4, radius: 7, kind: 'lantern', halo: 0.6, priority: 7 });
}

/** a banner mast: a tall timber mast on a stone foot, a yard and a long banner of the tournament hanging from it */
function bannerMast(S: SlotSet, x: number, z: number, h: number, yaw: number, emblem: EmblemKind, tint: V3): void {
  S.get('stone').boxMM(x - 0.36, 0, z - 0.36, x + 0.36, 0.55, z + 0.36, { tint: [0.72, 0.69, 0.64], aoY: [0.6, 1] });
  S.at([x, 0, z], yaw, () => {
    S.get('timber').cylinder(0.1, 0.55, h, 8, { tint: [0.44, 0.36, 0.29], r1: 0.07, capTop: true });
    S.get('metal').cylinder(0.1, h, h + 0.32, 6, { tint: [1.15, 0.95, 0.55], r1: 0.01 });
    S.get('timber').boxMM(-0.75, h - 0.62, -0.05, 0.75, h - 0.52, 0.05, { tint: [0.44, 0.36, 0.29], grain: 'x' });
    addBanner(S, { pos: [0, h - 0.6, 0.08], yaw: 0, w: 1.05, h: 3.5, emblem, shape: 'swallow', loose: 0.32, rod: false, tint });
  });
}

/** the fountain's water: a glossy surface in the basin and the bowl, the spout's jet and four streams falling from the bowl's lip */
function fountainWater(S: SlotSet, x: number, z: number): void {
  const M = S.get('metal'), water: V3 = [0.34, 0.5, 0.62];
  S.at([x, 0, z], Math.PI / 8, () => {
    const oct = (r: number): Array<[number, number]> => Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * Math.PI * 2) * r, Math.sin((i / 8) * Math.PI * 2) * r]);
    void M; void water; void oct;
    // the foam where the falling water meets the basin, and the jet (the water itself: the canal's material, buildPlaza)
    S.get('plaster').sweep(Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [Math.cos(a) * 1.32, 0.48, Math.sin(a) * 1.32] as V3; }), 0.06, 4, { tint: [1.1, 1.14, 1.2] });
    S.get('plaster').cylinder(0.05, 4.1, 4.55, 6, { tint: [1.15, 1.2, 1.3], r1: 0.02 });
  });
}

/** a flagstone path: slabs laid along a polyline (width w), a little irregular, the cobbles showing in their joints */
function flagstones(S: SlotSet, rng: Rng, pts: Array<[number, number]>, w: number, tint: V3): void {
  // the plaster's smooth grain: the stone's breakup is a green moss on a floor
  const St = S.get('plaster');
  for (let i = 0; i < pts.length - 1; i++) {
    const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = Math.hypot(bx - ax, bz - az), yaw = Math.atan2(bx - ax, bz - az);
    const rows = Math.max(1, Math.round(len / 0.86)), cols = Math.max(1, Math.round(w / 1.05));
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? 0.5 : 0;
      for (let c = -off; c < cols; c++) {
        const u0 = Math.max(0, c) / cols, u1 = Math.min(cols, c + 1) / cols;
        if (u1 - u0 < 0.2) continue;
        const v0 = r / rows, v1 = (r + 1) / rows, k = 0.9 + rng.range(-0.06, 0.06);
        S.at([ax, 0, az], yaw, () => St.boxMM((u0 - 0.5) * w + 0.03, 0, v0 * len + 0.03, (u1 - 0.5) * w - 0.03, 0.035, v1 * len - 0.03, { tint: [tint[0] * k, tint[1] * k, tint[2] * k], uvScale: 0.7 }));
      }
    }
  }
}

/** a ring of radial flagstones around a point (the fountain's apron) */
function apron(S: SlotSet, rng: Rng, x: number, z: number, r0: number, r1: number, tint: V3): void {
  const St = S.get('plaster'), n = Math.round((Math.PI * 2 * (r0 + r1)) / 2 / 0.9);
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + 0.02, a1 = ((i + 1) / n) * Math.PI * 2 - 0.02, k = 0.9 + rng.range(-0.06, 0.06), t: V3 = [tint[0] * k, tint[1] * k, tint[2] * k];
    const P = (a: number, r: number): V3 => [x + Math.cos(a) * r, 0.035, z + Math.sin(a) * r];
    quadFacing(St, [P(a0, r0), P(a1, r0), P(a1, r1), P(a0, r1)], [0, 1, 0], { tint: t, uvScale: 0.7 });
    for (const [a, b] of [[P(a0, r1), P(a1, r1)]] as Array<[V3, V3]>) quadFacing(St, [[a[0], 0, a[2]], [b[0], 0, b[2]], b, a], [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)], { tint: t });
  }
}

/** the tournament's bracket board by the registrar: a board on two posts, the draw painted on it (lines of a bracket on ivory) */
function bracketBoard(S: SlotSet, x: number, z: number, yaw: number): void {
  S.at([x, 0, z], yaw, () => {
    const T = S.get('timber'), D = S.get('dark');
    for (const s of [-1, 1]) T.boxMM(s * 1.0 - 0.07, 0, -0.07, s * 1.0 + 0.07, 2.6, 0.07, { tint: [0.46, 0.37, 0.3], grain: 'y' });
    S.get('planks').boxMM(-1.05, 1.0, -0.04, 1.05, 2.35, 0.04, { tint: [0.86, 0.82, 0.7], grain: 'x' });
    T.boxMM(-1.12, 2.35, -0.08, 1.12, 2.5, 0.08, { tint: [0.42, 0.33, 0.26], grain: 'x' });
    // the draw: eight names, four, two, the final
    const line = (x0: number, y0: number, x1: number, y1: number) => D.boxMM(Math.min(x0, x1) - 0.012, Math.min(y0, y1) - 0.012, 0.045, Math.max(x0, x1) + 0.012, Math.max(y0, y1) + 0.012, 0.052, { tint: [0.12, 0.13, 0.2] });
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) { const y = 1.18 + k * 0.3; line(s * 0.95, y, s * 0.68, y); }
      for (let k = 0; k < 2; k++) { const ya = 1.18 + k * 0.6, yb = ya + 0.3; line(s * 0.68, ya, s * 0.68, yb); line(s * 0.68, (ya + yb) / 2, s * 0.42, (ya + yb) / 2); }
      line(s * 0.42, 1.33, s * 0.42, 1.93); line(s * 0.42, 1.63, s * 0.16, 1.63);
    }
    line(-0.16, 1.63, 0.16, 1.63);
    S.get('glow').box(0, 1.63, 0.06, 0.12, 0.12, 0.01, { tint: [1, 0.75, 0.3] });
  });
}

/** the tilt: the jousting barrier of the training ground (a timber fence painted in the tournament's colours along its posts), its two sand
 *  lanes */
function tiltYard(S: SlotSet, x0: number, x1: number, z: number): void {
  const T = S.get('timber'), P = S.get('plaster');
  for (const s of [-1, 1]) P.quad([x0 - 0.6, 0.03, z + s * 0.2], [x1 + 0.6, 0.03, z + s * 0.2], [x1 + 0.6, 0.03, z + s * 2.0], [x0 - 0.6, 0.03, z + s * 2.0], { tint: [0.8, 0.7, 0.55], flip: s > 0 });
  for (const s of [-1, 1]) T.boxMM(x0 - 0.6, 0, Math.min(z + s * 2.0, z + s * 2.12), x1 + 0.6, 0.1, Math.max(z + s * 2.0, z + s * 2.12), { tint: [0.44, 0.36, 0.28], grain: 'x' });
  const n = Math.round((x1 - x0) / 1.6);
  for (let i = 0; i <= n; i++) T.boxMM(x0 + i * ((x1 - x0) / n) - 0.07, 0, z - 0.07, x0 + i * ((x1 - x0) / n) + 0.07, 1.45, z + 0.07, { tint: [0.46, 0.37, 0.3], grain: 'y' });
  for (let i = 0; i < n; i++) {
    const a = x0 + i * ((x1 - x0) / n), b = a + (x1 - x0) / n;
    S.get('planks').boxMM(a + 0.07, 0.5, z - 0.05, b - 0.07, 1.3, z + 0.05, { tint: i % 2 ? [0.5, 0.62, 1.15] : [1.1, 1.05, 0.92], grain: 'x' });
  }
  T.boxMM(x0 - 0.05, 1.42, z - 0.09, x1 + 0.05, 1.52, z + 0.09, { tint: [0.42, 0.34, 0.27], grain: 'x' });
}

/** an archery butt: a straw boss on a timber A-frame, its painted face toward the square */
function archeryButt(S: SlotSet, x: number, z: number, yaw: number): void {
  S.at([x, 0, z], yaw, () => {
    const T = S.get('timber'), C = S.get('cloth');
    for (const s of [-1, 1]) S.with(mat([s * 0.55, 0, -0.35], 0, 1, -0.2), () => T.boxMM(-0.04, 0, -0.04, 0.04, 1.9, 0.04, { tint: [0.46, 0.37, 0.3], grain: 'y' }));
    S.at([0, 1.15, 0], 0, () => {
      S.with(mat([0, 0, 0], 0, 1, Math.PI / 2 - 0.2), () => {
        C.cylinder(0.62, -0.12, 0.12, 14, { tint: [0.7, 0.6, 0.38], capTop: true, capBottom: true });
        const ring = (r: number, y: number, t: V3) => C.cylinder(r, y, y + 0.006, 14, { tint: t, capTop: true });
        ring(0.58, 0.12, [0.88, 0.85, 0.78]); ring(0.44, 0.126, [0.26, 0.32, 0.62]); ring(0.3, 0.132, [0.86, 0.82, 0.72]); ring(0.16, 0.138, [0.9, 0.72, 0.3]);
      });
    });
  });
}

/** the quintain: a post with a swinging arm, a shield at one end and a sandbag at the other */
function quintain(S: SlotSet, x: number, z: number, yaw: number): void {
  S.at([x, 0, z], yaw, () => {
    const T = S.get('timber');
    T.boxMM(-0.5, 0, -0.5, 0.5, 0.18, 0.5, { tint: [0.44, 0.36, 0.29] });
    T.cylinder(0.1, 0.18, 2.5, 8, { tint: [0.46, 0.37, 0.3], capTop: true });
    T.boxMM(-1.3, 2.25, -0.06, 1.3, 2.37, 0.06, { tint: [0.44, 0.36, 0.29], grain: 'x' });
    S.with(mat([-1.15, 1.75, 0.08], 0, 1, Math.PI / 2), () => S.get('metal').cylinder(0.36, -0.03, 0.03, 12, { tint: [0.3, 0.38, 0.7], capTop: true, capBottom: true }));
    S.get('cloth').boxMM(1.08, 1.45, -0.18, 1.38, 1.95, 0.18, { tint: [0.56, 0.48, 0.36] });
    S.get('cloth').boxMM(1.2, 1.95, -0.02, 1.26, 2.25, 0.02, { tint: [0.3, 0.26, 0.22] });
  });
}

/** a spectators' stand: three tiers of benches under a striped canopy on posts */
function grandstand(S: SlotSet, x: number, z: number, w: number): void {
  S.at([x, 0, z], 0, () => {
    const P = S.get('planks'), T = S.get('timber'), C = S.get('cloth');
    for (let k = 0; k < 3; k++) {
      P.boxMM(-w / 2, 0.45 * k, -0.7 * k - 0.7, w / 2, 0.45 * k + 0.45, -0.7 * k, { tint: [0.62, 0.52, 0.42], grain: 'x' });
      P.boxMM(-w / 2, 0.45 * k + 0.45, -0.7 * k - 0.45, w / 2, 0.45 * k + 0.52, -0.7 * k - 0.15, { tint: [0.7, 0.6, 0.48], grain: 'x' });
    }
    for (const a of [-w / 2, -w / 6, w / 6, w / 2]) for (const b of [0.1, -2.2]) T.boxMM(a - 0.07, 0, b - 0.07, a + 0.07, b > 0 ? 3.0 : 3.5, b + 0.07, { tint: [0.46, 0.37, 0.3], grain: 'y' });
    const n = 10;
    for (let i = 0; i < n; i++) { const x0 = -w / 2 - 0.2 + ((w + 0.4) * i) / n, x1 = x0 + (w + 0.4) / n; C.quad([x0, 3.55, -2.3], [x1, 3.55, -2.3], [x1, 3.0, 0.35], [x0, 3.0, 0.35], { tint: i % 2 ? [0.32, 0.38, 0.68] : [0.86, 0.82, 0.7], flip: true, swayArr: [0, 0, 0.4, 0.4] }); }
    for (let i = 0; i < n; i++) { const x0 = -w / 2 - 0.2 + ((w + 0.4) * i) / n, x1 = x0 + (w + 0.4) / n; C.tri([x0, 3.0, 0.36], [x1, 3.0, 0.36], [(x0 + x1) / 2, 2.72, 0.38], { tint: i % 2 ? [0.86, 0.82, 0.7] : [0.32, 0.38, 0.68], swayArr: [0.3, 0.3, 0.6] }); }
  });
}

/** the maypole: a tall pole, a crown of greenery and a hoop, ribbons in the tournament's colours down to stakes in a ring, a pennant on top */
function maypole(S: SlotSet, x: number, z: number, h: number, rr: number): void {
  const T = S.get('timber'), C = S.get('cloth');
  S.at([x, 0, z], 0, () => {
    S.get('stone').cylinder(0.5, 0, 0.3, 10, { tint: [0.72, 0.69, 0.64], capTop: true });
    T.cylinder(0.12, 0.3, h, 8, { tint: [0.78, 0.7, 0.58], r1: 0.08, capTop: true });
    // the pole wound with a ribbon: bands of the tournament's blue up to the crown
    for (let y = 0.8; y < h - 1.2; y += 0.55) S.get('cloth').cylinder(0.125 - 0.04 * (y / h), y, y + 0.2, 8, { tint: [0.22, 0.32, 0.82] });
    // the crown: a hoop of greenery under the top
    const hoop: V3[] = Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [Math.cos(a) * 0.9, h - 0.9, Math.sin(a) * 0.9]; });
    // a crown of gold and ivory cloth (the district has no green: journal Passe VP6, second critique)
    S.get('cloth').sweep(hoop, 0.07, 6, { tint: [0.72, 0.52, 0.26] });
    for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2; T.boxMM(Math.min(0, Math.cos(a) * 0.9), h - 0.92, Math.min(0, Math.sin(a) * 0.9) - 0.02, Math.max(0, Math.cos(a) * 0.9), h - 0.88, Math.max(0, Math.sin(a) * 0.9) + 0.02, { tint: [0.6, 0.5, 0.4] }); }
    S.get('metal').box(0, h + 0.1, 0, 0.18, 0.2, 0.18, { tint: [1.2, 1.0, 0.6] });
    addBanner(S, { pos: [0.06, h + 0.05, 0], yaw: Math.PI / 2, w: 0.5, h: 1.4, emblem: 'laurel', shape: 'pennant', loose: 0.9, rod: false, tint: [0.95, 0.9, 0.75] });
    // the ribbons from under the crown to pegs in a ring, each a strip with its sag (journal Passe VP6: hanging loose they read as paper strips
    // taped to the pole; the first radial ones, hairlines without sag, as wires)
    const cols: V3[] = [[0.16, 0.26, 0.86], [0.94, 0.9, 0.78], [0.16, 0.26, 0.86], [0.86, 0.6, 0.24]];
    for (let k = 0; k < 12; k++) {
      const a = (k / 12) * Math.PI * 2 + 0.13, top: V3 = [Math.cos(a) * 0.95, h - 0.95, Math.sin(a) * 0.95], foot: V3 = [Math.cos(a) * rr, 0.3, Math.sin(a) * rr];
      const side: V3 = [-Math.sin(a) * 0.09, 0, Math.cos(a) * 0.09];
      for (let i = 0; i < 10; i++) {
        const t0 = i / 10, t1 = (i + 1) / 10, P = (t: number): V3 => [top[0] + (foot[0] - top[0]) * t, top[1] + (foot[1] - top[1]) * t - 0.9 * Math.sin(t * Math.PI), top[2] + (foot[2] - top[2]) * t];
        const a0 = P(t0), a1 = P(t1);
        C.quad([a0[0] - side[0], a0[1], a0[2] - side[2]], [a0[0] + side[0], a0[1], a0[2] + side[2]], [a1[0] + side[0], a1[1], a1[2] + side[2]], [a1[0] - side[0], a1[1], a1[2] - side[2]], { tint: cols[k % 4], swayArr: [0.35 * Math.sin(t0 * Math.PI), 0.35 * Math.sin(t0 * Math.PI), 0.35 * Math.sin(t1 * Math.PI), 0.35 * Math.sin(t1 * Math.PI)] });
      }
      T.boxMM(foot[0] - 0.05, 0, foot[2] - 0.05, foot[0] + 0.05, 0.36, foot[2] + 0.05, { tint: [0.5, 0.41, 0.32] });
    }
  });
}

/** a long feast table with its benches, mugs, bowls and a candle */
function feastTable(S: SlotSet, batch: InstanceBatch, x: number, z: number, yaw: number, len: number): void {
  S.at([x, 0, z], yaw, () => {
    const P = S.get('planks'), T = S.get('timber');
    P.boxMM(-len / 2, 0.74, -0.42, len / 2, 0.8, 0.42, { tint: [0.62, 0.5, 0.4], grain: 'x' });
    for (const a of [-len / 2 + 0.3, len / 2 - 0.3]) T.boxMM(a - 0.05, 0, -0.32, a + 0.05, 0.74, 0.32, { tint: [0.48, 0.38, 0.3] });
    for (const s of [-1, 1]) {
      P.boxMM(-len / 2 + 0.1, 0.42, s * 0.75 - 0.15, len / 2 - 0.1, 0.47, s * 0.75 + 0.15, { tint: [0.6, 0.48, 0.38], grain: 'x' });
      for (const a of [-len / 2 + 0.3, len / 2 - 0.3]) T.boxMM(a - 0.04, 0, s * 0.75 - 0.12, a + 0.04, 0.42, s * 0.75 + 0.12, { tint: [0.48, 0.38, 0.3] });
    }
    S.get('cloth').boxMM(-len / 2 + 0.2, 0.8, -0.18, len / 2 - 0.2, 0.805, 0.18, { tint: [0.32, 0.38, 0.66] });
  });
  for (let i = 0; i < Math.round(len / 0.8); i++) {
    const u = -len / 2 + 0.4 + i * 0.8, c = Math.cos(yaw), s = Math.sin(yaw), side = i % 2 ? 0.25 : -0.25;
    batch.add(i % 3 === 1 ? 'basket' : 'pot', { pos: [x + u * c + side * s, 0.8, z - u * s + side * c], yaw: i, scale: i % 3 === 1 ? 0.55 : 0.5 });
  }
}

/** the puppet booth: a tall narrow booth in striped cloth, its little stage, a valance and a painted board over it */
function puppetBooth(S: SlotSet, x: number, z: number, yaw: number): void {
  S.at([x, 0, z], yaw, () => {
    const C = S.get('cloth'), T = S.get('timber');
    const w = 1.9, h = 2.7, d = 0.9, n = 8;
    for (const [a, b] of [[-w / 2, -w / 2 + 0.01], [w / 2 - 0.01, w / 2]]) T.boxMM(a - 0.05, 0, -d, b + 0.05, h + 0.5, -d + 0.1, { tint: [0.46, 0.37, 0.3] });
    for (let i = 0; i < n; i++) {
      const x0 = -w / 2 + (w * i) / n, x1 = x0 + w / n, t: V3 = i % 2 ? [0.26, 0.34, 0.68] : [0.86, 0.8, 0.66];
      C.quad([x0, 0, 0], [x1, 0, 0], [x1, 1.55, 0], [x0, 1.55, 0], { tint: t, swayArr: [0, 0, 0.15, 0.15] });
      C.quad([x0, 2.35, 0], [x1, 2.35, 0], [x1, h, 0], [x0, h, 0], { tint: t, swayArr: [0, 0, 0.1, 0.1] });
    }
    for (const s of [-1, 1]) C.quad([s * w / 2, 0, 0], [s * w / 2, 0, -d], [s * w / 2, h, -d], [s * w / 2, h, 0], { tint: [0.32, 0.38, 0.66] });
    S.get('dark').quad([-w / 2, 1.55, -d * 0.8], [w / 2, 1.55, -d * 0.8], [w / 2, 2.35, -d * 0.8], [-w / 2, 2.35, -d * 0.8], { tint: [0.1, 0.08, 0.1] });
    S.get('planks').boxMM(-w / 2, 1.52, -0.4, w / 2, 1.58, 0.06, { tint: [0.6, 0.48, 0.36], grain: 'x' });
    S.get('planks').boxMM(-w / 2 - 0.1, h, -0.05, w / 2 + 0.1, h + 0.45, 0.04, { tint: [0.84, 0.76, 0.5], grain: 'x' });
    for (let i = 0; i < 8; i++) { const x0 = -w / 2 + (w * i) / 8, x1 = x0 + w / 8; C.tri([x0, 2.35, 0.02], [x1, 2.35, 0.02], [(x0 + x1) / 2, 2.12, 0.03], { tint: [0.86, 0.68, 0.3], swayArr: [0.1, 0.1, 0.4] }); }
  });
}

/** the champions' platform of the training ground: a raised timber deck on posts, steps on the square's side, corner posts with ropes on three
 *  sides and the tournament's pennants, a rack of practice blades and a brazier beside it (lit day and night, as the arena's) */
function sparringDais(S: SlotSet, batch: InstanceBatch, lights: PlazaBuild['lights'], day: boolean, x: number, z: number): void {
  const hw = 2.4, y = 0.62;
  S.at([x, 0, z], 0, () => {
    const P = S.get('planks'), T = S.get('timber');
    P.boxMM(-hw, y - 0.1, -hw, hw, y, hw, { grain: 'x', tint: [0.64, 0.52, 0.4] });
    T.boxMM(-hw - 0.08, 0, -hw - 0.08, hw + 0.08, y - 0.1, hw + 0.08, { tint: [0.42, 0.34, 0.27] });
    for (let k = 0; k < 3; k++) P.boxMM(-1.0, 0.2 * k, hw + 0.08 + 0.3 * (2 - k), 1.0, 0.2 * (k + 1), hw + 0.38 + 0.3 * (2 - k), { grain: 'x', tint: [0.6, 0.48, 0.38] });
    const posts: Array<[number, number]> = [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]];
    for (const [a, b] of posts) T.boxMM(a - 0.09, 0, b - 0.09, a + 0.09, y + 1.9, b + 0.09, { tint: [0.46, 0.37, 0.3], grain: 'y' });
    const rope = (a: [number, number], b: [number, number], h: number) => S.get('cloth').sweep(Array.from({ length: 7 }, (_, i) => { const t = i / 6; return [a[0] + (b[0] - a[0]) * t, y + h - 0.12 * Math.sin(t * Math.PI), a[1] + (b[1] - a[1]) * t] as V3; }), 0.025, 4, { tint: [0.78, 0.7, 0.5] });
    for (const h of [0.6, 1.15]) { rope(posts[0], posts[1], h); rope(posts[1], posts[2], h); rope(posts[3], posts[0], h); rope(posts[2], [hw - 1.2, hw], h); rope(posts[3], [-hw + 1.2, hw], h); }
    // the posts capped, the deck's sides hung with the tournament's striped cloth
    for (const [a, b] of posts) S.get('metal').box(a, y + 1.95, b, 0.16, 0.1, 0.16, { tint: [1.0, 0.85, 0.5] });
    for (let i = 0; i < 16; i++) {
      const t0 = i / 16, t1 = (i + 1) / 16, tint: V3 = i % 2 ? [0.3, 0.37, 0.68] : [0.84, 0.8, 0.7];
      for (const [ax, az, bx, bz] of [[-hw - 0.1, hw + 0.1, hw + 0.1, hw + 0.1], [hw + 0.1, hw + 0.1, hw + 0.1, -hw - 0.1], [-hw - 0.1, -hw - 0.1, -hw - 0.1, hw + 0.1]] as Array<[number, number, number, number]>) {
        const p0: V3 = [ax + (bx - ax) * t0, y - 0.08, az + (bz - az) * t0], p1: V3 = [ax + (bx - ax) * t1, y - 0.08, az + (bz - az) * t1];
        if (az === hw + 0.1 && bz === hw + 0.1 && Math.abs(p0[0]) < 1.1) continue;
        S.get('cloth').quad(p0, p1, [p1[0], 0.06, p1[2]], [p0[0], 0.06, p0[2]], { tint, swayArr: [0, 0, 0.12, 0.12] });
      }
    }
    for (const [i, [a, b]] of posts.entries()) addBanner(S, { pos: [a + 0.08, y + 1.85, b], yaw: Math.PI / 2, w: 0.42, h: 1.0, emblem: i % 2 ? 'laurel' : 'swords', shape: 'pennant', loose: 0.8, rod: false, tint: i % 2 ? [0.95, 0.88, 0.62] : [0.5, 0.6, 0.95] });
  });
  weaponRack(S, x + 3.6, z + 0.6);
  S.at([x - 3.2, 0, z - 2.6], 0, () => S.get('metal').cylinder(0.32, 0.9, 1.15, 8, { tint: [0.35, 0.33, 0.32], capBottom: true, r1: 0.42 }));
  S.get('metal').box(x - 3.2, 0.45, z - 2.6, 0.12, 0.9, 0.12);
  S.get('glow').box(x - 3.2, 1.12, z - 2.6, 0.5, 0.08, 0.5, { tint: [1, 0.55, 0.2] });
  lights.push({ pos: [x - 3.2, 1.6, z - 2.6], color: FIRE, intensity: 3.0, radius: 8, kind: 'fire', halo: 1.4, priority: 9, day: true });
  void batch; void day;
}

/** a ring of boards round the maypole: the dance floor (its planks laid radially, a timber edge) */
function danceFloor(S: SlotSet, x: number, z: number, r: number): void {
  const P = S.get('planks'), n = 24;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2 + 0.01, a1 = ((i + 1) / n) * Math.PI * 2 - 0.01, k = i % 3 ? 1 : 0.9;
    const Q = (a: number, rr: number, y: number): V3 => [x + Math.cos(a) * rr, y, z + Math.sin(a) * rr];
    quadFacing(P, [Q(a0, 0.5, 0.06), Q(a1, 0.5, 0.06), Q(a1, r, 0.06), Q(a0, r, 0.06)], [0, 1, 0], { tint: [0.62 * k, 0.5 * k, 0.4 * k], uvScale: 0.7 });
    quadFacing(S.get('timber'), [Q(a0 - 0.01, r, 0), Q(a1 + 0.01, r, 0), Q(a1 + 0.01, r, 0.07), Q(a0 - 0.01, r, 0.07)], [Math.cos((a0 + a1) / 2), 0, Math.sin((a0 + a1) / 2)], { tint: [0.42, 0.34, 0.27] });
  }
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
export function walkTo(b: Pick<PlazaBuild, 'walk' | 'blockers'> & { lanes?: Rect[] }, x: number, z: number, nx: number, nz: number, radius = 0.35): [number, number] {
  // the square and its ways out's lanes (a lane overlaps the square's edge, so the hero walks into it): the step is kept when it ends in a
  // rectangle that holds or meets the one the hero stands in, else it slides along the edges of the rectangles the hero stands in (never a
  // jump to another rectangle: journal Passe VP5, a long step toward the quay's gate from beside it landed in the gate)
  const rects = [b.walk, ...(b.lanes ?? [])], inside = (r: Rect, px: number, pz: number) => px >= r.x0 - 1e-6 && px <= r.x1 + 1e-6 && pz >= r.z0 - 1e-6 && pz <= r.z1 + 1e-6;
  const meets = (r: Rect, q: Rect) => r.x0 <= q.x1 && r.x1 >= q.x0 && r.z0 <= q.z1 && r.z1 >= q.z0;
  const here = rects.filter((r) => inside(r, x, z)), from = here.length ? here : rects;
  let px = nx, pz = nz;
  if (!rects.some((r) => inside(r, nx, nz) && from.some((q) => meets(r, q)))) {
    let bd = Infinity;
    for (const r of from) {
      const cx = Math.max(r.x0, Math.min(r.x1, nx)), cz = Math.max(r.z0, Math.min(r.z1, nz)), d = (cx - nx) ** 2 + (cz - nz) ** 2;
      if (d < bd) { bd = d; px = cx; pz = cz; }
    }
  }
  for (const k of b.blockers) {
    const dx = px - k.x, dz = pz - k.z, d = Math.hypot(dx, dz), min = k.r + radius;
    if (d < min) { if (d < 1e-6) { px = x; pz = z; } else { px = k.x + (dx / d) * min; pz = k.z + (dz / d) * min; } }
  }
  return [px, pz];
}
