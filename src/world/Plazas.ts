import * as THREE from 'three';
import { Rng } from '../core/rng';
import { SlotSet, MeshBuilder, mat, SLOTS, type V3, type Slot } from '../core/MeshBuilder';
import { fbm, smoothstep } from '../core/noise';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import type { LightDef } from '../atmosphere/LightRig';
import { LAYER_CAST, LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import { InstanceBatch, trestle, bush } from '../props/PropGenerator';
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
 *  tournament's bunting by day only, heraldry as a focal accent. Since journal Passe VP7 (the operator's direction: « une direction belle,
 *  simple et épuré [...] les endroits se doivent d'être spacieux et libre »), each square is one monument, a free floor and dressed edges:
 *  - the forecourt (the main square): the Colosseum's curved arcade facade and its gate to the north at the end of the processional way, the
 *    competitors' pavilions beside it, the registrar, the armourer and the healer at the rows' foot;
 *  - the training ground: since journal Passe VP9 (the operator's choice « Lices au pied du rempart »), the lists along the cité's rampart, its
 *    two round towers, its wall-walk and stair, the spectators' gallery over the stables, the champions' ring, the dummy's ring, the butts;
 *  - the festive square (in the place of the Lantern Row mock-up, L7-3): since journal Passe VP9 (« Place de la halle »), the market hall and
 *    its stage, the arcaded houses on a curve, the well, the puppets, strings of lanterns at night and of pennants by day, the tavern;
 *  and a light plan of 16 lights at most, all burning (the key light at the monument, guides along the way, the rest glowing without a light).
 *  Every wall and roof is a visibility part (src/world/PlazaVisibility.ts: what no pose of the square shows leaves the frame).
 *  Layout (metres): the forecourt spans x -11..11, z -16..3.6; its framings stand south (+z) looking north (src/world/PlazaCamera.ts); the
 *  lists' and the hall's square's own plans with their blocks below (`LISTS`, `HALL`, `ARC`). Every
 *  number « proposé ». */

export interface PlazaBuild {
  /** the lights (`day`: a fire that burns by day too; `key`: the square's key light, the only ones with a halo: journal Passe VP7) */
  group: THREE.Group; lights: Array<LightDef & { day?: boolean; key?: boolean }>; emitters: Emitter[];
  /** the walkable surface and what stands on it (circles); the lanes of its ways out (journal Passe VP5) beyond it */
  walk: Rect; lanes: Rect[]; blockers: Array<{ x: number; z: number; r: number; h?: number }>;
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
// (the forecourt's alone since journal Passe VP9: the lists leave by the passage under their gallery, the hall's square by a gap in its arcades)
export const OPEN_AFTER: Partial<Record<PlazaKind, Partial<Record<'west' | 'east', number>>>> = { forecourt: { west: 0, east: 1 } };
const GAP_W = 4.4;
/** the emblem on the sign over a way out: the place it leads to (the quay's gate carries none: its posts fly the tournament's swords) */
const EXIT_EMBLEM: Partial<Record<PlaceId, EmblemKind>> = { forecourt: 'duel', training: 'helm', lanterns: 'horn' };

const WARM: V3 = [1.0, 0.6, 0.27];
/** the processional way's flagstones, the tournament's two banner tints (gold, blue) */
// (a shade darker since journal Passe VP7, iteration 3: the ways read « overexposed », « like a decal »)
const PAVE: V3 = [0.64, 0.63, 0.62], GOLD_T: V3 = [0.95, 0.88, 0.62], BLUE_T: V3 = [0.5, 0.6, 0.95];
const FIRE: V3 = [1.0, 0.5, 0.2];
/** the Merchant District's frontage numbers (DEFAULT_CONFIG): the squares' houses share them (the first build used more timber and more lit
 *  windows than the district) */
const COMMON = { asymmetry: 0.42, timberRatio: 0.32, roofExaggeration: 0.95, verticality: 1 } as const;
/** the share of lit windows at night (the first number, 0.46, lit nine windows in fourteen on a house: the district's frontage reads about a
 *  quarter lit, journal Passe VP1) */
const LIT_WINDOWS = 0.3;
// (z1 6.0 since journal Passe VP7, iteration 3: two metres of setts before the near edge, the frames' foreground; the quay's gate lane goes on
// to the kerb)
const W = { x0: -11, x1: 11, z0: -16, z1: 6.0 };
/** each square's near edge, the frames' foreground (its line's z, its top's height): the balustrade of the forecourt and of the hall's square;
 *  none on the lists, seen along their wall (journal Passe VP9) */
export const PLAZA_NEAR: Record<PlazaKind, { z: number; top: number } | null> = { forecourt: { z: 8.0, top: 1.14 }, training: null, festival: { z: 8.0, top: 1.14 } };
/** the walkable surface of each square (metres): the forecourt's; since journal Passe VP9 the lists' long yard along the rampart, and the hall's
 *  square from the quay's gate to under the hall's first bay */
export const PLAZA_WALKS: Record<PlazaKind, Readonly<Rect>> = { forecourt: W, training: { x0: -14.0, x1: 15.0, z0: -7.4, z1: 5.0 }, festival: { x0: -10.6, x1: 9.0, z0: -10.8, z1: 6.0 } };
/** where the people stand on each square (person id -> x, z): the registrar's table, the armourer's stall, the healer's corner, the champion
 *  on the way, the guards at the gate; the master by the gallery's passage, the champions' ring, the butts, the stair's foot, the dummy (journal
 *  Passe VP9); the puppets, the stalls, the arcades, the stage's foot under the hall (« proposé ») */
export const PLAZA_SPOTS: Record<PlazaKind, Record<string, [number, number]>> = {
  forecourt: { odo: [-7.9, -10.6], hilde: [7.5, -0.8], anwen: [-7.6, -0.6], guardA: [-2.3, -15.9], guardB: [2.3, -15.9], marek: [5.6, -6.8], orla: [-5.2, -2.6], vessa: [-1.6, -12.6], ilse: [6.2, -11.6] },
  training: { corvin: [-12.6, 3.8], orla: [-3.4, -0.2], ilse: [1.0, -6.2], vessa: [-2.6, -6.8], drill: [11.2, -7.2] },
  festival: { pip: [-8.4, -5.2], lio: [-7.0, -9.0], cassius: [6.6, -4.6], bard: [-1.2, -10.4] },
};
/** the moments of a square's day: the day states' three and the night (the evening) */
export type PlazaPeriod = 'morning' | 'midday' | 'afternoon' | 'night';
/** where the crowd gathers and walks between, by the moment of the day (journal Passe VP7, the operator's direction: « de la population qui
 *  peuple les rues selon les périodes »; « proposé »): in the morning a few hands at the stalls, the ring or the registrar's table, coming and
 *  going; at midday groups round the monument and the stalls; at the end of the day toward the ways out and the lit places; at night a few
 *  by the lights. None nearer the camera than z 1 (journal Passe VP6: a walker there filled the frame's bottom edge). */
export const PLAZA_GATHER: Record<PlazaKind, Record<PlazaPeriod, Array<[number, number]>>> = {
  forecourt: {
    morning: [[-7.6, -11.6], [7.6, -3.6], [-6.6, 0.4], [0, -13.4], [5.6, -12.4], [-3.0, -3.0]],
    midday: [[-7.4, -8.6], [7.4, -6.6], [-6.4, -0.4], [-2.8, -13.6], [3.0, -13.2], [6.4, -12.0], [-6.6, -13.8], [2.6, -3.0], [-3.4, -10.4], [4.4, -8.6]],
    afternoon: [[-9.6, -5.0], [9.8, -11.4], [0.6, 1.0], [-2.6, -13.4], [7.2, -2.8], [-4.0, -8.0]],
    night: [[-3.0, -13.2], [3.2, -13.0], [-4.0, -5.4], [3.8, -5.4], [-6.6, 0.2]],
  },
  // (the lists since journal Passe VP9: by the gallery, the butts, the stair's foot, round the champions' ring; none in the yard's east part,
  // nearest the camera, nor before the ring's steps)
  training: {
    morning: [[-12.6, 1.6], [-2.6, -6.6], [2.4, -6.2], [-4.4, 2.6], [8.6, -5.6], [-13.2, -7.0]],
    midday: [[-4.4, 1.8], [-3.8, -4.8], [-12.4, -2.8], [1.6, -6.4], [3.2, 0.2], [-12.0, 4.2], [-1.0, -3.0], [6.4, -6.8], [-6.0, 3.6]],
    afternoon: [[-12.6, 1.2], [-3.4, 3.4], [-1.6, -6.8], [4.0, -4.6], [-13.4, -3.2], [0.8, 1.6]],
    night: [[-3.6, 3.2], [-3.2, -6.0], [-12.2, 4.0], [1.0, -5.6], [-0.4, 1.2]],
  },
  // (the groups gather at the first points of a moment: near ones and far ones in turn, journal Passe VP7, iteration 2: three groups side by
  // side before the stage read as « two straight rows like a queue »)
  // (the hall's square since journal Passe VP9: under the hall's first bay, before the arcades, by the stalls and the well)
  festival: {
    morning: [[7.0, 0.4], [-3.4, -9.6], [2.6, -9.8], [6.4, -6.6], [-9.6, -10.2], [0.4, -2.0], [-2.2, 0.8]],
    midday: [[-3.0, -9.4], [6.6, -1.6], [1.0, -6.0], [3.4, -9.6], [-8.4, 0.8], [6.8, -6.8], [-1.6, -2.4], [4.8, -10.0], [2.6, 0.6], [-3.4, -5.8]],
    afternoon: [[8.2, -3.8], [0.4, 0.6], [-3.0, -9.6], [7.6, -1.4], [2.8, -9.6], [-2.4, -5.4], [-6.4, 0.2]],
    night: [[-3.2, -9.8], [1.6, -10.0], [0.0, -6.6], [6.4, -1.2], [-4.6, 0.6], [3.0, -1.4]],
  },
};
/** each square's monuments (x, z, radius, height: journal Passe VP7): the framings keep them whole, never cut by the frame's bottom edge */
// (journal Passe VP9: the lists' towers and their champions' ring; the hall)
export const PLAZA_MONUMENTS: Record<PlazaKind, Array<[number, number, number, number]>> = {
  forecourt: [[0, -7, 2.4, 4.1]], training: [[5.0, -11.4, 3.4, 15.4], [-18.6, -11.6, 4.0, 16.8], [-9.0, -3.2, 3.4, 3.0]], festival: [[-1.5, -12.8, 5.5, 10.0]],
};
/** the lists' beaten earth (journal Passe VP6; the lists' since journal Passe VP9, to the rampart's foot and under the gallery): x0, z0, x1, z1 */
const YARD = [-21.0, -10.6, 46.0, 12.0];
/** the ground shader's variants a square compiles (the town's ground compiles none): the training ground's earth within its setts */
export function plazaGroundDefines(kind: PlazaKind): Record<string, string | number> {
  // (journal Passe VP9: the hall's square's setts crossed by a compass of flags about its middle, its rings at 4.6 and 9.2 m)
  return kind === 'training' ? { SAND: 1, SAND_RECT: `vec4(${YARD.map((v) => v.toFixed(2)).join(', ')})` } : kind === 'festival' ? { FLAGS: 'vec4(-0.6, -2.0, 4.6, 9.2)' } : {};
}
/** the festival's bandstand (journal Passe VP6), beside the stage at the square's north end since journal Passe VP7 (in the middle of the
 *  square it stood between a southern camera and the hero walking behind it) */
// (the hall's square's well since journal Passe VP9, by the arcades' south end: in the square's middle « one central feature », the forecourt's
// recipe, the second critique)
const BAND: [number, number] = [9.2, 4.0];
/** the training ground's champions' ring (journal Passe VP7: before the spectators' stand, on the square's axis; before the lists' gallery,
 *  its steps toward the east, since journal Passe VP9) */
const DAIS: [number, number] = [-9.0, -3.2];
/** the houses whose shop windows cast a real light at night (journal Passe VP7, « proposé »): the festival's two taverns; every other window
 *  glows without one (the light plan: the lights a frame shows decided, under the frame's budget) */
const SHOP_LIGHTS: Record<PlazaKind, string[]> = { forecourt: [], training: [], festival: ['west1'] };
/** the near edge's lights at night (intensity, radius; journal Passe VP7, iteration 4): the forecourt and the training ground carry the near floor
 *  on them alone; the festival square's strings light its own (stronger there, a « milky warm haze » filled the frame) */
/** the near edge's stone by day, a third darker than at night (journal Passe VP8: under the squares' daylight it was « the brightest and
 *  largest object in frame », « Bring the balustrade's value down by about 30% », the third critique) */
const NEAR_WALL_DAY: V3 = [0.21, 0.2, 0.2], NEAR_CAP_DAY: V3 = [0.27, 0.26, 0.25];
const NEAR_LIGHT: Record<PlazaKind, [number, number]> = { forecourt: [4.4, 10.5], training: [4.4, 10.5], festival: [2.4, 8] };
/** how many wall lanterns are lit at night, the nearest the focal point (journal Passe VP7: the forecourt's gate has its own fires) */
const WALL_LAMPS: Record<PlazaKind, number> = { forecourt: 0, training: 0, festival: 0 };
/** the focal point of each square: the wall lanterns nearest it are lit, the paths lead to it (journal Passe VP9: the lists' gallery, the hall) */
const FOCUS: Record<PlazaKind, [number, number]> = { forecourt: [0, -16], training: [-16, 1], festival: [-1.5, -12.8] };

export function buildPlaza(lib: MaterialLibrary, kind: PlazaKind, seed: number, opts: { day: boolean; period?: PlazaPeriod }): PlazaBuild {
  const rng = new Rng(seed).fork(`plaza:${kind}`), day = opts.day;
  const group = new THREE.Group(); group.name = `plaza:${kind}`;
  const S = new SlotSet(), batch = new InstanceBatch(seed ^ 0x9a2a, 3);
  const lights: PlazaBuild['lights'] = [], emitters: Emitter[] = [], blockers: PlazaBuild['blockers'] = [], disposables: Array<{ dispose(): void }> = [];
  const obstacles: MaskObstacle[] = [], puddles: MaskBlob[] = [];
  const sockets: Array<Socket & { building: string; front: boolean }> = [];
  const spots: PlazaBuild['spots'] = { ...PLAZA_SPOTS[kind] }, wander: PlazaBuild['wander'] = [...PLAZA_GATHER[kind][opts.period ?? (day ? 'midday' : 'night')]];
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
      // (journal Passe VP7: a light plan of 20 or so real lights a square; the other houses' windows glow without a light of their own)
      if (SHOP_LIGHTS[kind].includes(id)) for (const l of res.lights) lights.push({ ...l, pos: xf(l.pos, pos, yaw), priority: Math.min(l.priority ?? 5, 6) });
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
  const zEnd = kind === 'forecourt' ? -20.2 : -26, walk = PLAZA_WALKS[kind];
  // (the forecourt's alone since journal Passe VP9: the lists and the hall's square are built in their own blocks below)
  if (kind === 'forecourt') for (const side of [-1, 1] as const) {
    const after = OPEN_AFTER[kind]?.[side < 0 ? 'west' : 'east'];
    let z = 4;
    for (let i = 0; i < 4; i++) {
      if (z - zEnd < 4.2) break;
      const r = rng.fork(`row${side}:${i}`), width = Math.min(r.range(5.4, 6.8), z - zEnd);
      // every ground floor a shop (journal Passe VP6, tenth critique: « ground floors with nothing going on [...] activate the perimeter:
      // shopfronts, lit doors, hanging signs, awnings at street level »)
      const shop: ShopType = r.pick<ShopType>(['general', 'tailor', 'general', 'apothecary', 'tailor']);
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


  // ---------------------------------------------------------------- the lamps: a rhythm along the open south side (the quay's), a few inside
  const lamp = (x: number, z: number, strong = true) => {
    batch.add('lampPost', { pos: [x, 0, z], yaw: Math.PI / 2, scale: 1 }, 0);
    lights.push({ pos: xf([0.52, 3.2 - 0.38, 0], [x, 0, z], Math.PI / 2), color: WARM, intensity: strong ? 4.2 : 3.6, radius: strong ? 10 : 9.5, kind: 'lantern', halo: 0.7, priority: strong ? 7 : 6 });
    blockers.push({ x, z, r: 0.35 }); obstacles.push({ x0: x - 0.25, x1: x + 0.25, z0: z - 0.25, z1: z + 0.25, grime: 0.4 });
    puddles.push({ x: x + 0.8, z: z - 1.4, r: 1.6, amount: 0.85 });
  };
  // (the four lamp posts along the open south side left with journal Passe VP7, iteration 3: both panels of its second critique saw them « in
  // the way », cutting through the people; the near edge's lanterns light the near floor)

  // the sidewalks: a band of grey flagstones along each row's front (journal Passe VP6: « the floors are flat, nothing organises the ground »)
  if (kind === 'forecourt') tracked(() => { for (const sd of [-1, 1]) flagstones(S, rng.fork(`walk${sd}`), [[sd * 12.2, 3.6], [sd * 12.2, -19.4]], 2.0, [0.66, 0.66, 0.68]); });

  // ---------------------------------------------------------------- the ways out (journal Passe VP5): a side street through a row's opening under a
  // timber gateway with the sign of the place it leads to, the quay's gate in the south kerb; their lanes, where one leaves and where one arrives
  const exits: PlazaExit[] = [], lanes: Rect[] = [];
  const ways = V2_EXITS[PLACE_OF_KIND[kind] as keyof typeof V2_EXITS], southGate = ways.some((e) => e.side === 'south');
  for (const e of ways) {
    if (e.side === 'south') {
      const lane = { x0: -1.9, x1: 1.9, z0: 2.5, z1: 7.6 };
      lanes.push(lane);
      exits.push({ to: e.to, side: 'south', lane, out: { x0: -99, x1: 99, z0: 6.6, z1: 99 }, spawn: [0, 3.3], face: 'up', anchor: [0, 2.6, 7.6] });
      tracked(() => quayGate(S, batch, lights, day, NEAR_LIGHT[kind]));
      continue;
    }
    if (kind === 'training') {
      // the passage under the lists' gallery (journal Passe VP9): its lane through to the forecourt's street, the sign over it
      const P = LISTS.pass, zc = (P.zn + P.zs) / 2, half = (P.zs - P.zn) / 2 - 1.02, G = LISTS.gallery;
      const lane = { x0: G.x - G.d - 1.4, x1: walk.x0 + 0.4, z0: zc - half, z1: zc + half };
      lanes.push(lane);
      exits.push({ to: e.to, side: e.side, lane, out: { x0: -99, x1: G.x - G.d - 0.6, z0: -99, z1: 99 }, spawn: [walk.x0 + 0.3, zc], face: 'east', anchor: [G.x + 0.1, 4.2, zc] });
      continue;
    }
    if (kind === 'festival') {
      // the gap in the arcades (journal Passe VP9): a gateway between two of their houses, the street to the forecourt beyond
      const zs = ARC.c[1] + 2.2, zn = ARC.c[1] - 2.2, zc = ARC.c[1], half = GAP_W / 2 - 0.62 - 0.4, xg = arcAt(0, ARC.r + ARC.depth)[0];
      const lane = { x0: walk.x1 - 0.4, x1: xg + 2.4, z0: zc - half, z1: zc + half };
      lanes.push(lane);
      exits.push({ to: e.to, side: e.side, lane, out: { x0: xg + 1.7, x1: 99, z0: -99, z1: 99 }, spawn: [walk.x1 - 0.2, zc], face: 'west', anchor: [xg + 0.05, 4.4, zc] });
      tracked(() => gateway(S, batch, lights, day, 1, zs, zn, EXIT_EMBLEM[e.to] ?? 'swords', xg));
      // the walk's flags through the arcades' gap, to the gateway
      tracked(() => quadFacing(S.get('plaster'), [[arcAt(0, ARC.r)[0], 0.03, zn + 0.3], [xg, 0.03, zn + 0.3], [xg, 0.03, zs - 0.3], [arcAt(0, ARC.r)[0], 0.03, zs - 0.3]], [0, 1, 0], { tint: [0.56, 0.55, 0.54], uvScale: 0.7 }));
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
  // (journal Passe VP7, iteration 3: the near edge is the frames' foreground layer again, as the district's quay edge and water, after two
  // critiques in which every panel preferred the frames that had it, « the balustrade gives a foreground plane », to the frames without it,
  // « the bottom 40 % of every frame is empty cobble »; drawn again after their notes on the first one, « oversized », « crude block posts »,
  // « streaky texture », « the brightest and blurriest object in frame », « almost black at night »: lower, darker, in the plaster's smooth
  // grain, a coping and dies, a lantern on a die every few metres lighting the near setts)
  tracked(() => {
    const Pl = S.get('plaster'), wall: V3 = day ? NEAR_WALL_DAY : [0.3, 0.29, 0.29], cap: V3 = day ? NEAR_CAP_DAY : [0.38, 0.37, 0.36], Z = 8.3;
    const edgeLantern = (x: number, top: number, lit: boolean) => {
      batch.add(day ? 'lanternDark' : 'lantern', { pos: [x, top + 0.02, Z], yaw: 0 }, 0);
      if (day || !lit) return;
      lights.push({ pos: [x, top + 1.4, Z - 0.8], color: WARM, intensity: NEAR_LIGHT[kind][0], radius: NEAR_LIGHT[kind][1], kind: 'lantern', halo: 0, priority: 7 });
      puddles.push({ x: x + 0.7, z: 6.6, r: 1.4, amount: 0.9 });
    };
    // (the training ground's timber fence of VP6-VP8 left with journal Passe VP9: the lists are seen along their wall from the east, their near
    // edge the yard's own earth)
    if (kind === 'training') return;
    // (the spans end at the quay gate's dies, which stand for their end dies: journal Passe VP7, iteration 5; the hall's square's at its
    // arcades since journal Passe VP9)
    const east = kind === 'festival' ? arcAt(Math.asin((8.3 - ARC.c[1]) / ARC.r), ARC.r)[0] - 0.2 : 18;
    if (kind === 'festival') {
      // the hall's square's edge (journal Passe VP9): stone troughs of flowers between low dies, a lantern on the dies nearest the middle (the
      // forecourt's balustrade across both squares' foregrounds made them « one template », the first critique)
      for (const [a0, a1] of [[-18, -3.1], [3.1, east]]) {
        const n = Math.max(1, Math.round((a1 - a0) / 2.6)), dies = Array.from({ length: n + 1 }, (_, k) => a0 + ((a1 - a0) * k) / n);
        for (let k = 0; k < n; k++) {
          const x0 = dies[k] + 0.24, x1 = dies[k + 1] - 0.24, fr = rng.fork(`planter${a0}${k}`);
          Pl.boxMM(x0, 0, 7.96, x1, 0.56, 8.64, { tint: wall, aoY: [0.6, 1] });
          Pl.boxMM(x0 - 0.04, 0.56, 7.92, x1 + 0.04, 0.62, 8.68, { tint: cap });
          S.get('dark').boxMM(x0 + 0.06, 0.5, 8.0, x1 - 0.06, 0.6, 8.6, { tint: [0.12, 0.09, 0.07] });
          // the flowers: a mound of dark foliage, its blooms in the tournament's ivory and gold and a little blue ([KO] the district's leaf cards:
          // a neon green under the squares' sun, whatever their tint)
          const C = S.get('cloth'), cols: V3[] = [[0.92, 0.86, 0.66], [0.95, 0.74, 0.3], [0.42, 0.5, 0.86]];
          for (let x = x0 + 0.3; x < x1 - 0.2; x += 0.42) C.blob(x + fr.range(-0.06, 0.06), 0.62, 8.3 + fr.range(-0.08, 0.08), 0.3, 0.16, 0.26, 7, 4, { tint: [0.14, 0.2, 0.12] });
          for (let f = 0; f < Math.round((x1 - x0) * 5); f++) C.blob(fr.range(x0 + 0.15, x1 - 0.15), 0.74 + fr.range(0, 0.06), 8.3 + fr.range(-0.22, 0.22), 0.07, 0.05, 0.07, 6, 3, { tint: cols[(k + f) % 3] });
        }
        for (const x of dies) {
          if (southGate && Math.abs(x) < 3.2) continue;
          Pl.boxMM(x - 0.22, 0, 8.06, x + 0.22, 0.92, 8.54, { tint: wall, aoY: [0.6, 1] });
          Pl.boxMM(x - 0.27, 0.92, 8.01, x + 0.27, 0.99, 8.59, { tint: cap });
        }
        // (one lit a side, the die nearest 7 m from the middle: the light plan's 16)
        const litDie = dies.reduce((p, q) => (Math.abs(Math.abs(q) - 7) < Math.abs(Math.abs(p) - 7) ? q : p));
        for (const x of dies.filter((q) => Math.abs(q) > 3.2 && Math.abs(q) < 12)) edgeLantern(x, 0.99, x === litDie);
      }
      return;
    }
    for (const [a0, a1] of southGate ? [[-18, -3.1], [3.1, east]] : [[-18, east]]) {
      Pl.boxMM(a0, 0, 8.02, a1, 0.3, 8.58, { tint: wall, aoY: [0.6, 1] });
      Pl.boxMM(a0 - 0.04, 0.3, 7.98, a1 + 0.04, 0.36, 8.62, { tint: cap });
      for (let x = a0 + 0.3; x < a1 - 0.15; x += 0.3) S.at([x, 0.36, Z], 0, () => Pl.lathe([[0.07, 0], [0.095, 0.06], [0.05, 0.16], [0.088, 0.33], [0.05, 0.46], [0.075, 0.52]], 8, { tint: cap }));
      Pl.boxMM(a0 - 0.04, 0.88, 8.0, a1 + 0.04, 0.96, 8.6, { tint: cap });
      Pl.boxMM(a0 - 0.08, 0.96, 7.97, a1 + 0.08, 0.99, 8.63, { tint: [0.44, 0.43, 0.41] });
      // the dies: at the span's ends and every five metres or so, their own cap; a lantern on the ones nearest the middle, lit at night
      const n = Math.max(1, Math.round((a1 - a0) / 5)), dies = Array.from({ length: n + 1 }, (_, k) => a0 + ((a1 - a0) * k) / n);
      for (const x of dies) {
        if (southGate && Math.abs(x) < 3.2) continue;
        Pl.boxMM(x - 0.19, 0, 8.1, x + 0.19, 1.08, 8.5, { tint: wall, aoY: [0.6, 1] });
        Pl.boxMM(x - 0.23, 1.08, 8.06, x + 0.23, 1.14, 8.54, { tint: cap });
      }
      for (const x of dies.filter((q) => Math.abs(q) > (southGate ? 3.2 : 2.4) && Math.abs(q) < 12)) edgeLantern(x, 1.14, Math.abs(x) > 6 && Math.abs(x) < 9);
    }
  });

  // a fire's flame over its embers (journal Passe VP8): two crossed blades of the glow, seen from either side
  const flame = (x: number, y: number, z: number, h: number) => flameAt(S, day, x, y, z, h);
  const brazier = (x: number, z: number, key = false) => {
    S.at([x, 0, z], 0, () => S.get('metal').cylinder(0.32, 0.9, 1.15, 8, { tint: [0.35, 0.33, 0.32], capBottom: true, r1: 0.42 }));
    // (a flared iron foot since journal Passe VP8: « Empty bowls on bare thin poles »)
    S.at([x, 0, z], 0, () => S.get('metal').cylinder(0.3, 0, 0.34, 8, { tint: [0.3, 0.29, 0.28], r1: 0.08 }));
    S.get('metal').box(x, 0.45, z, 0.12, 0.9, 0.12);
    // (the embers heaped over the bowl's rim since journal Passe VP7, iteration 5: inside it they did not show, « dark bowls »)
    if (day) S.get('dark').box(x, 1.2, z, 0.42, 0.16, 0.42, { tint: ASH }); else S.get('glow').box(x, 1.2, z, 0.42, 0.16, 0.42, { tint: [1, 0.55, 0.2], uvs: COAL_UV, aux: [0, 1, 0.7, 0] });
    // (the solid flame at night only: by day, « flat orange cones that read as traffic cones » (the first critique of journal Passe VP8); the
    // day's fire is the live flame over the embers)
    if (!day) flame(x, 1.27, z, 0.5);
    // (ninth critique: « at night a warm wash covers the whole wall », « a brown murk »: pools, not a wash; at night only since journal Passe
    // VP8, the audit: « Warm orange pools sit on the tower bases [...] With no visible flame, they read as stains »)
    lights.push({ pos: [x, 1.6, z], color: FIRE, intensity: 2.8, radius: 6.2, kind: 'fire', halo: 1.0, priority: 9, key });
    emitters.push({ kind: 'chimney', pos: [x, 1.4, z], rate: 0.3 }, ...fireEmitters(x, 1.28, z));
    blockers.push({ x, z, r: 0.5 });
  };
  // a market stall of the district (MarketGenerator.stall): posts, sagging canvas, shelves, goods, its lantern cluster and its key light
  const marketStall = (x: number, z: number, yaw: number, k: StallKind, w: number, lit: boolean, stripes?: [V3, V3]) => {
    const st = stall(rng.fork(`stall${x}${z}`), k, w, stripes);
    S.append(st.S, mat([x, 0, z], yaw));
    for (const p of st.lanterns) batch.add(day || !lit ? 'lanternDark' : 'lantern', { pos: xf(p, [x, 0, z], yaw), yaw }, 0);
    // its key light under the canvas (the candle over the goods glows without a light of its own: the light plan, journal Passe VP7)
    if (lit && !day) for (const l of st.lights) if (l.kind === 'lantern') lights.push({ ...l, pos: xf(l.pos, [x, 0, z], yaw) });
    blockers.push({ x, z, r: Math.max(1.3, w / 2), h: 2.6 });
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
    // journal Passe VP7, the operator's direction (« les endroits se doivent d'être spacieux et libre »): one monument, the arena's gate, and
    // the way that leads to it; the competitors' pavilions beside the gate; the registrar, the armourer and the healer at the rows' foot. The
    // fountain of the middle, the rack of lances, the crates and the lamps of the middle are gone (journal Passe VP6 had added them one by one)
    colosseum(S, tracked, day, lights, emitters, blockers, obstacles);
    // the processional way from the quay's gate to the arena's gate (its flagstones the frame's leading line), round the fountain at the
    // heart (journal Passe VP7, both panels of the first critique: « a real focal point »; it was not on the operator's list): its apron, its
    // water in the canal's material, its lanterns, two lit at night (the guides along the way to the gate)
    tracked(() => { flagstones(S, rng.fork('way0'), [[0, 6.4], [0, -2.9]], 3.2, PAVE); flagstones(S, rng.fork('way1'), [[0, -11.1], [0, -19.0]], 3.2, PAVE); });
    tracked(() => apron(S, rng.fork('apron'), 0, -7, 2.45, 4.15, PAVE));
    fountain(S, tracked, 0, -7);
    tracked(() => fountainWater(S, 0, -7));
    // the water falling from the two bowls' lips (journal Passe VP8): drops, not solid streams
    emitters.push({ kind: 'forge', tag: 'spray', pos: [0, 1.95, -7], rate: day ? 1 : 0.6, size: 1.24, warm: 1.45 }, { kind: 'forge', tag: 'spray', pos: [0, 3.12, -7], rate: day ? 0.5 : 0.3, size: 0.68, warm: 1.1 });
    if (lib.water) for (const [r, y, n] of [[1.95, 0.47, 8], [1.12, 1.98, 14], [0.6, 3.13, 12]] as Array<[number, number, number]>) {
      const g = new THREE.CircleGeometry(r, n, Math.PI / 8); g.rotateX(-Math.PI / 2); g.translate(0, y, -7);
      const m = new THREE.Mesh(g, lib.water); m.name = 'plaza:fountain-water'; m.layers.set(LAYER_NOREFLECT); m.frustumCulled = false; group.add(m);
    }
    // the basin (walked round) and its upper bowl (what can hide a head behind it)
    blockers.push({ x: 0, z: -7, r: 2.5 }, { x: 0, z: -7, r: 1.25, h: 2.05 }); obstacles.push({ x0: -2.3, x1: 2.3, z0: -9.3, z1: -4.7, grime: 0.35 });
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + Math.PI / 8 + Math.PI / 4, x = Math.cos(a) * 2.28, z = -7 + Math.sin(a) * 2.28;
      batch.add(day ? 'lanternDark' : 'lantern', { pos: [x, 0.8, z], yaw: a }, 0);
      if (!day && z > -7) lights.push({ pos: [x, 1.1, z], color: WARM, intensity: 3.6, radius: 9.5, kind: 'lantern', halo: 0, priority: 8 });
    }
    puddles.push({ x: -2.6, z: -3.8, r: 1.3, amount: 0.85 }, { x: 3.0, z: -4.4, r: 1.1, amount: 0.8 });
    tracked(() => pavilion(S, lights, day, -9.4, -13.8, 0.55, 1.9, [[0.3, 0.37, 0.7], [0.88, 0.84, 0.72]], 'swords'));
    tracked(() => pavilion(S, lights, day, 9.4, -14.4, -0.55, 1.9, [[0.78, 0.6, 0.3], [0.88, 0.84, 0.72]], 'lances'));
    // the competitors' kit stacked in the corner behind the west pavilion (a corner a southern camera cannot see past it)
    for (const [x, z, k, y] of [[-10.6, -16.2, 'crate', 0.2], [-10.9, -15.4, 'crate', 1.0], [-10.2, -16.5, 'barrel', 0.6]] as Array<[number, number, string, number]>) batch.add(k, { pos: [x, 0, z], yaw: y });
    blockers.push({ x: -10.6, z: -16.0, r: 0.9 });
    for (const [x, z] of [[-9.4, -13.8], [9.4, -14.4]]) { blockers.push({ x, z, r: 2.1, h: 4.4 }); obstacles.push({ x0: x - 2, x1: x + 2, z0: z - 2, z1: z + 2, grime: 0.4 }); }
    // the registrar's table along the west row (a trestle, the roll), the draw of the tournament on its board beside him
    S.append(trestle(rng.fork('registrar'), 2.4), mat([-9.6, 0, -9.9], Math.PI / 2 - 0.15));
    // (the chalkboard against the row since journal Passe VP8, the audit: « a notched board leans in the west pavilion's doorway »)
    batch.add('chalkboard', { pos: [-10.75, 0, -11.7], yaw: 1.5 }); batch.add('basket', { pos: [-9.7, 1.0, -9.4], yaw: 1, scale: 0.6 }); batch.add('crate', { pos: [-10.7, 0, -12.6], yaw: 0.3 });
    // the registrar's things on the table and his stool (journal Passe VP8: « the top is a plain white box, with no stool or ledger »)
    tracked(() => S.at([-9.6, 0, -9.9], Math.PI / 2 - 0.15, () => {
      S.get('planks').boxMM(-0.55, 1.08, -0.2, -0.05, 1.15, 0.14, { tint: [0.46, 0.2, 0.17], grain: 'x' });
      S.get('plaster').boxMM(-0.5, 1.15, -0.17, -0.1, 1.16, 0.11, { tint: [0.88, 0.84, 0.74] });
      S.get('metal').boxMM(0.25, 1.08, -0.05, 0.33, 1.17, 0.03, { tint: [0.2, 0.2, 0.24] });
      S.with(mat([0.75, 1.12, 0.02], 0.2, 1, Math.PI / 2), () => S.get('cloth').cylinder(0.04, -0.26, 0.26, 6, { tint: [0.86, 0.8, 0.64], capTop: true, capBottom: true }));
    }));
    batch.add('stool', { pos: xf([0, 0, -0.62], [-9.6, 0, -9.9], Math.PI / 2 - 0.15), yaw: 0.4 });
    tracked(() => bracketBoard(S, -10.6, -7.6, 1.45));
    blockers.push({ x: -9.6, z: -9.9, r: 1.4 }, { x: -10.6, z: -12.1, r: 0.8 }); obstacles.push({ x0: -10.2, x1: -9.0, z0: -11.2, z1: -8.6, grime: 0.5 });
    // the armourer south of the east street (his stall, a rack of blades, his stock), the healer's corner by the quay
    // (2 m further south since journal Passe VP8, the rack north of it: under the arrival's and the court's framings 2° lower its canopy hid the
    // hero at the east street's mouth, and from the arrival it hid the east pavilion, the audit's « the armourer's awning covers the tent »)
    marketStall(9.6, -2.6, -0.75, 'cloth', 3.0, true, [[0.3, 0.37, 0.66], [0.8, 0.77, 0.68]]);
    tracked(() => weaponRack(S, 10.5, -5.4));
    blockers.push({ x: 10.5, z: -5.4, r: 1.2 });
    for (const [x, z, k, y] of [[10.4, -6.9, 'crate', 0.3], [10.7, -7.6, 'barrel', 0.8]] as Array<[number, number, string, number]>) batch.add(k, { pos: [x, 0, z], yaw: y });
    blockers.push({ x: 10.5, z: -7.2, r: 0.8 });
    // (north of the arrival's strip since journal Passe VP7: its canopy and the healer were cut by the frame's bottom edge)
    healer(S, batch, -9.6, -1.4, 1.0, blockers, obstacles);
    // her lantern under the canopy, lit at night (sixth critique: « at night the lower-left third is almost black »)
    // (hung under the canopy's front beam since journal Passe VP8: on its slope « a grey lantern cap pokes up through the middle of the canvas »)
    batch.add(day ? 'lanternDark' : 'lantern', { pos: xf([0.2, 1.36, 0.92], [-9.6, 0, -1.4], 1.0), yaw: 1.0 }, 0);
    if (!day) lights.push({ pos: xf([0.2, 1.3, 1.15], [-9.6, 0, -1.4], 1.0), color: WARM, intensity: 3.0, radius: 8, kind: 'lantern', halo: 0, priority: 7 });
    // the gate's braziers burn day and night (the arena's fires, as AD1): the key light, its wet setts before the gate at night
    brazier(-4.6, -15.3, true); brazier(4.6, -15.3, true);
    puddles.push({ x: -2.6, z: -13.2, r: 1.6, amount: 0.95 }, { x: 2.9, z: -12.4, r: 1.3, amount: 0.85 }, { x: 0.8, z: -8.6, r: 1.2, amount: 0.8 });
    // (the lamp at the notice board's end and the carter's wagon behind the balustrade left with journal Passe VP8, the audit: « Lamp post
    // against the notice board », « Cart flush behind the near balustrade [...] cut by the left edge »)
    paths.push([[0, 4], [0, -4], [0, -16.5]], [[-11, -4.3], [-4, -5.5]], [[11, -10.5], [4, -9]], [[-9, 2], [-8.4, -9.6]], [[9, 2], [8.6, -4.4]]);
    decal('grate', 3.2, -4.4, 0.9, 0.6, 0.3, 0.9); decal('manhole', -4.6, -12.2, 0.95, 0.95, 1.1, 0.85);
    scatter('crack', 6, -10, 10, -15, 3, [1.2, 2.2], [0.4, 0.7]); scatter('stain', 6, -10, 10, -15, 3, [1.6, 3.0], [0.25, 0.4], 0.014, [0.6, 0.62, 0.68]);
    scatter('straw', 3, 6.5, 10, -16.5, -13.5, [0.8, 1.3], [0.5, 0.75]); scatter('straw', 2, -10.5, -6.5, -16.5, -13.5, [0.8, 1.3], [0.5, 0.75]);
  } else if (kind === 'training') {
    // journal Passe VP9, the operator's choice « Lices au pied du rempart »: the lists along the cité's rampart, its two round towers, its
    // wall-walk and its stair; the spectators' gallery over the stables closing the west end, the passage under it the way to the forecourt;
    // the champions' ring before the gallery, the dummy's ring, the butts and a rack along the wall; seen along the wall from the east, a
    // diagonal as the district's quay (src/world/PlazaCamera.ts). VP6-VP8's yard between two rows of houses, its stand, its fence and its
    // string are gone
    rampart(S, tracked, day, rng);
    roundTower(S, tracked, batch, day, LISTS.t1, 'helm', false);
    roundTower(S, tracked, batch, day, LISTS.t2, 'swords', true);
    wallStair(S, tracked, day);
    listsGallery(S, tracked, batch, lights, day);
    for (const t of [LISTS.t1, LISTS.t2]) { blockers.push({ x: t.x, z: t.z, r: t.r + 0.6, h: t.h }); obstacles.push({ x0: t.x - t.r, x1: t.x + t.r, z0: t.z - t.r, z1: t.z + t.r, grime: 0.8 }); }
    obstacles.push({ x0: LISTS.x0, x1: LISTS.x1, z0: LISTS.zOut, z1: LISTS.zIn + 0.55, grime: 0.75 }, { x0: LISTS.stair.top, x1: LISTS.stair.foot, z0: LISTS.zIn, z1: LISTS.zIn + LISTS.stair.w, grime: 0.6 });
    { const G = LISTS.gallery; obstacles.push({ x0: G.x - G.d, x1: G.x, z0: G.z0, z1: LISTS.pass.zn, grime: 0.65 }, { x0: G.x - G.d, x1: G.x, z0: LISTS.pass.zs, z1: G.z1, grime: 0.65 }); }
    // the town behind the gallery (its upper floors over the gallery's roof), the passage's street between (the lists' south side out of every
    // frame: [KO] a row of houses there, its shadows on the sand with no caster in the frame, the first critique)
    for (const [i, z, w] of [[0, -4.6, 6.2], [1, 7.6, 7.0], [2, 14.8, 6.6]] as Array<[number, number, number]>) house(`west${i}`, [-25.4, 0, z], Math.PI / 2, rng.fork(`lw${i}`), { width: w, floors: i === 1 ? 4 : 3, shop: 'house', back: true });
    // the champions' ring before the gallery, its steps toward the yard's east: the lists' key light at night
    tracked(() => sparringDais(S, batch, lights, emitters, day, DAIS[0], DAIS[1], Math.PI / 2));
    const at = (px: number, pz: number) => xf([px, 0, pz], [DAIS[0], 0, DAIS[1]], Math.PI / 2);
    for (const [dx, dz] of [[-2.5, -2.5], [2.5, -2.5], [-2.5, 2.5], [2.5, 2.5], [0, 0]]) blockers.push({ x: DAIS[0] + dx, z: DAIS[1] + dz, r: 1.6 });
    for (const [px, pz, r] of [[3.45, 0.6, 0.9], [-4.1, 3.9, 0.45], [4.1, 3.9, 0.45]] as Array<[number, number, number]>) { const p = at(px, pz); blockers.push({ x: p[0], z: p[2], r }); }
    obstacles.push({ x0: DAIS[0] - 3.4, x1: DAIS[0] + 3.4, z0: DAIS[1] - 3.4, z1: DAIS[1] + 3.4, grime: 0.6 });
    // the dummy's ring in the yard's east part by the near tower (between the cameras and the yard its fence hid the hero, the first critique of
    // journal Passe VP9), a lantern on its post lit at night
    {
      // (0.8 m west since the fourth critique: « the dummy pen and weapon rack are cut at the right edge »)
      const cx = 9.8, cz = -4.8, r = 2.6;
      sandRing(S, batch, cx, cz, r);
      blockers.push({ x: cx, z: cz, r: 0.6 });
      const lp: V3 = [cx + Math.cos(-Math.PI * 0.75) * (r + 0.45), 1.07, cz + Math.sin(-Math.PI * 0.75) * (r + 0.45)];
      batch.add(day ? 'lanternDark' : 'lantern', { pos: lp, yaw: 0.6 }, 0);
      if (!day) lights.push({ pos: [lp[0] - 0.3, 1.6, lp[2] + 0.3], color: WARM, intensity: 3.0, radius: 8.5, kind: 'lantern', halo: 0, priority: 7 });
      obstacles.push({ x0: cx - r, x1: cx + r, z0: cz - r, z1: cz + r, grime: 0.25 });
      paths.push(Array.from({ length: 17 }, (_, i) => [cx + Math.cos((i / 16) * Math.PI * 2) * 1.9, cz + Math.sin((i / 16) * Math.PI * 2) * 1.9] as [number, number]));
    }
    // the butts against the wall between the stair's foot and the near tower, turned to the yard; the rack and the bales at the stair's foot
    for (const [x, z, yw] of [[-1.4, -8.6, 0.35], [1.0, -8.8, 0.2]] as Array<[number, number, number]>) { tracked(() => archeryButt(S, x, z, yw)); blockers.push({ x, z, r: 0.8, h: 1.9 }); }
    tracked(() => weaponRack(S, -4.2, -8.3, 0)); blockers.push({ x: -4.2, z: -8.3, r: 1.2 });
    for (const [x, z, k] of [[-12.4, 6.0, 'hay'], [-12.9, 5.3, 'hay'], [-11.6, 6.6, 'barrel'], [10.6, -8.6, 'hay'], [11.2, -7.9, 'bucket'], [-6.6, -8.6, 'crate']] as Array<[number, number, string]>) {
      if (k === 'hay') hay(S, x, z, x + z); else batch.add(k, { pos: [x, 0, z], yaw: x + z }); blockers.push({ x, z, r: 0.6 });
    }
    hay(S, -12.6, 5.65, 1.4, 0.42);
    // strings from the wall-walk's parapet to the gallery's eave over the yard: the tournament's pennants by day (J4, J6), lanterns at night with
    // a pool of light each (the first critique of journal Passe VP9: « the lower half is nearly black »). [KO] masts along the yard's south side
    // to hang them from: between the cameras and the yard, « a vertical pole cutting the frame »
    for (const [xw, zg] of [[1.0, 2.0], [-6.0, 7.4]] as Array<[number, number]>) {
      const a: V3 = [xw, LISTS.walkY + 0.9, LISTS.zIn + 0.1], b: V3 = [LISTS.gallery.x + 0.3, LISTS.gallery.eave - 0.2, zg], sg = 1.3;
      if (day) { garland(S, a, b, sg, { size: 0.36, width: 0.3, spacing: 0.5, phase: Math.round(xw) }); continue; }
      cord(S, a, b, sg);
      const m = Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) / 2.3);
      for (let t = 1; t < m; t++) { const p = sag(a, b, sg, t / m); batch.add('lantern', { pos: [p[0], p[1] - 0.32, p[2]], yaw: t, scale: 1.1 }, 0); }
      const p = sag(a, b, sg, 0.42); lights.push({ pos: [p[0], 3.2, p[2]], color: WARM, intensity: 3.0, radius: 7.5, kind: 'lantern', halo: 0, priority: 6 });
    }
    // a brazier on the near yard, day and night (its light at night, its fire by day; a second one by the dummy's ring stood against its fence)
    brazier(5.6, 3.2);
    // the knights' lances on their rack and their shields at the wall's foot past the near tower, bales on the near yard (« an empty sand plane
    // [...] no foreground props such as racks, straw or weapons », the second critique of journal Passe VP9; [KO] the rack on the near yard: the
    // gallery's framing stood its camera on it, the lances' tips as two great cones across the frame)
    tracked(() => lanceRack(S, 11.2, -8.9, 0)); blockers.push({ x: 11.2, z: -8.9, r: 1.5 }); obstacles.push({ x0: 9.6, x1: 12.8, z0: -9.6, z1: -8.2, grime: 0.4 });
    for (const [x, z, y] of [[1.6, 5.4, 0.3], [2.4, 5.9, 1.2], [1.9, 5.6, 0.7]] as Array<[number, number, number]>) hay(S, x, z, y, y === 0.7 ? 0.42 : 0);
    // the fire by the butts, day and night (the rampart's torches glow without a light)
    brazier(3.0, -7.4);
    // the rampart's torches at night (their pools on the wall's foot)
    if (!day) for (const x of LIT_TORCHES) lights.push({ pos: [x, 3.4, LISTS.zIn + 1.0], color: FIRE, intensity: 2.6, radius: 7.0, kind: 'fire', halo: 0, priority: 7 });
    // the night's guides: a lantern on a post at the gallery's south end, one by the near tower's door (its own, roundTower)
    if (!day) lights.push({ pos: [LISTS.t2.x + 0.95, 2.4, LISTS.t2.z + LISTS.t2.r + 0.6], color: WARM, intensity: 2.6, radius: 7.5, kind: 'lantern', halo: 0, priority: 6 });
    lamp(-13.2, 7.2, false);
    // (the puddle before the champions' ring left with the fourth critique of journal Passe VP9: « a hard-edged mirror puddle in front of the
    // ring reads as a hole »)
    puddles.push({ x: -1.0, z: -6.2, r: 1.1, amount: 0.8 });
    paths.push([[14, 2], [2, 0.6], [-4.4, -1.4]], [[-13.6, 1], [-11.2, 1.6]], [[2, 0.6], [0.2, -7.0]], [[-4.6, -6.6], [-1.0, -7.6]], [[8.0, 1.2], [10.0, -1.6]]);
    paths.push(Array.from({ length: 17 }, (_, i) => [DAIS[0] + Math.cos((i / 16) * Math.PI * 2) * 4.0, DAIS[1] + Math.sin((i / 16) * Math.PI * 2) * 4.0] as [number, number]));
    // the earth's marks: straw by the bales and the gallery, scuffs, the feet's ruts along the wall
    scatter('straw', 5, -13.8, -10.4, 3.0, 8.0, [0.7, 1.2], [0.55, 0.8], 0.03, [0.74, 0.7, 0.62]); scatter('straw', 3, 9.6, 12.0, -9.0, -6.8, [0.7, 1.2], [0.55, 0.8], 0.03, [0.74, 0.7, 0.62]);
    scatter('mud', 4, -13, 14, -7.4, 4.6, [1.4, 2.6], [0.18, 0.3], 0.028, [0.85, 0.8, 0.74]);
    // the riders' runs along the yard: ruts and hoof-scuffed earth in two long lanes, the tilt's way
    for (let x = -11; x < 15; x += 2.6) for (const z of [1.8, 3.4]) decal('ruts', x + dr.range(-0.4, 0.4), z + dr.range(-0.25, 0.25), 2.8, 1.1, dr.range(-0.12, 0.12), dr.range(0.35, 0.55), 0.029, [0.78, 0.72, 0.64]);
    for (const [x, z, w] of [[9.8, -4.8, 3.8], [DAIS[0] + 3.8, DAIS[1], 3.2], [-1.0, -7.2, 3.0], [-14.8, 1.0, 3.2]] as Array<[number, number, number]>) decal('mud', x, z, w, w * 0.8, dr.range(0, 6.28), 0.6, 0.03, [0.7, 0.66, 0.6]);
  } else {
    // journal Passe VP9, the operator's choice « Place de la halle »: the great timber hall at the north end, its stage and its candle crowns
    // under it; the arcaded houses along a curve on the east side, the way to the forecourt through a gap in them; the well before them, the
    // puppets and the tavern along the west row; seen from high on the south-west, three quarters, the setts and the strings from above
    // (src/world/PlazaCamera.ts). VP6-VP8's square between two rows with the stage and the bandstand at its end is gone
    marketHall(S, tracked, batch, lights, day, rng, blockers, obstacles);
    arcades(S, tracked, batch, lights, day, blockers);
    // the arcades' houses: set back behind the covered walk on the curve, facing its centre (each front a chord of the circle)
    {
      const R = ARC.r + ARC.depth;
      for (const [run, ws] of [[-1, [5.8, 5.2]], [1, [5.4, 5.0]]] as Array<[number, number[]]>) {
        let t = run * ARC.gap;
        for (const [i, w] of ws.entries()) {
          const dt = w / R, tc = t + (run * dt) / 2, d = Math.sqrt(R * R - (w / 2) * (w / 2)), p = arcAt(tc, d), r = rng.fork(`arc${run}${i}`);
          house(`arc${run < 0 ? 'n' : 's'}${i}`, p, Math.atan2(-Math.cos(tc), -Math.sin(tc)), r, { width: w - 0.05, floors: r.int(3, 4), shop: 'house', depth: 7 });
          t += run * dt;
        }
      }
    }
    // the west row: straight, facing the square, the tavern in it; its back row over it
    {
      // (from z -0.4 since the second critique of journal Passe VP9: its first house by the quay, « a cut-off building plane very close to the
      // camera »; the corner open onto the quay)
      let z = -0.4;
      for (let i = 1; i < 4; i++) {
        const r = rng.fork(`west${i}`), width = r.range(5.6, 6.6);
        house(`west${i}`, [-13.2, 0, z - width / 2], Math.PI / 2, r, { width, floors: r.int(2, 4), shop: i === 1 ? 'tavern' : r.pick<ShopType>(['general', 'tailor', 'apothecary']) });
        z -= width + r.range(0.1, 0.3);
      }
      let zb = 4.5;
      for (let i = 0; i < 3; i++) { const r = rng.fork(`westB${i}`), width = r.range(6.4, 7.6); house(`westB${i}`, [-21.5, 0, zb - width / 2], Math.PI / 2, r, { width, floors: r.int(4, 5), back: true }); zb -= width + r.range(0.6, 1.4); }
      tracked(() => flagstones(S, rng.fork('westwalk'), [[-12.2, -0.4], [-12.2, -20.0]], 2.0, [0.66, 0.66, 0.68]));
    }
    // the north row behind the hall, its upper floors and roofs over the hall's ridge, and the house closing the street east of the hall
    // (two floors and no back row since the second critique of journal Passe VP9: « no sky is visible, so the scene feels boxed-in », the arena
    // « too close »: it rises farther over this row)
    for (const [i, x, w] of [[0, -11.0, 7.4], [1, -3.2, 7.8], [2, 4.8, 7.6]] as Array<[number, number, number]>) house(`north${i}`, [x, 0, -21.6], 0, rng.fork(`north${i}`), { width: w, floors: 2, shop: 'general' });
    house('east0', [13.4, 0, -17.6], -Math.PI / 2, rng.fork('east0'), { width: 7.2, floors: 3, shop: 'general' });
    // the well before the arcades' south end, its iron arch and its pulley (journal Passe VP9: the bandstand of VP6-VP8 has no place here: the
    // hall's stage is the music's, and wherever it stood on this open floor it hid the hero from a framing or a framing cut it)
    tracked(() => well(S, batch, BAND[0], BAND[1], 0.4));
    blockers.push({ x: BAND[0], z: BAND[1], r: 1.35, h: 2.6 }); obstacles.push({ x0: BAND[0] - 1.2, x1: BAND[0] + 1.2, z0: BAND[1] - 1.2, z1: BAND[1] + 1.2, grime: 0.5 });
    puddles.push({ x: BAND[0] + 1.6, z: BAND[1] + 1.5, r: 1.4, amount: 0.95 });
    // the puppets along the west row, a stall under the hall, a heap of casks by the tavern
    tracked(() => puppetBooth(S, -10.0, -6.2, 1.15));
    blockers.push({ x: -10.0, z: -6.2, r: 1.3, h: 2.8 });
    // (the candles' stall under the hall's west bay since the first critique of journal Passe VP9: a market hall's stalls under it, and the
    // square's west side free)
    marketStall(HALL.x0 + 2.0, -10.8, 0, 'candles', 2.8, true, [[0.3, 0.37, 0.7], [0.86, 0.82, 0.72]]);
    for (const [x, z, k, y] of [[-11.6, -2.2, 'barrel', 0.4], [-11.8, -1.4, 'barrel', 1.3], [-11.1, -1.8, 'crate', 0.2]] as Array<[number, number, string, number]>) batch.add(k, { pos: [x, 0, z], yaw: y });
    blockers.push({ x: -11.5, z: -1.8, r: 0.9 });
    // (the floor paved by the ground itself since journal Passe VP9, its setts in a lattice of flags, `plazaGroundDefines`: the way of flags from
    // the quay's gate to the hall read as the forecourt's, the first critique)
    // the strings across the square, high, from the west row to the arcades' houses (the third by the quay's end unflagged): pennants by day
    // (J4, J6), lanterns at night with a pool where they cross the way (the light that leads the eye)
    {
      // (from the houses' second floors since the first critique of journal Passe VP9: at 5.6 m « the pennant string runs straight across the
      // hero's and the crowd's heads »; four pools at night, « the string lanterns glow but light nothing »)
      const arcEnd = (t: number): V3 => { const p = arcAt(t, ARC.r + ARC.depth); return [p[0] - 0.4, 7.0, p[2]]; };
      const ends: Array<[V3, V3, boolean]> = [[[-12.9, 7.0, -1.6], arcEnd(0.02), true], [[-12.9, 7.0, -6.6], arcEnd(-0.2), true], [[-12.9, 6.8, 2.6], arcEnd(0.24), false]];
      for (const [a, b, flag] of ends) {
        const len = Math.hypot(b[0] - a[0], b[2] - a[2]), sg = 0.04 * len;
        if (day) { if (flag) garland(S, a, b, sg, { size: 0.42, width: 0.34, spacing: 0.56, phase: Math.round(len) }); continue; }
        cord(S, a, b, sg);
        const m = Math.max(2, Math.round(len / 2.3));
        for (let t = 1; t < m; t++) { const p = sag(a, b, sg, t / m); batch.add('lantern', { pos: [p[0], p[1] - 0.32, p[2]], yaw: t, scale: 1.1 }, 0); }
        if (flag) for (const u of [0.38, 0.66]) { const p = sag(a, b, sg, u); lights.push({ pos: [p[0], 2.8, p[2]], color: WARM, intensity: 3.2, radius: 8, kind: 'lantern', halo: 0, priority: 6 }); puddles.push({ x: p[0] + 0.9, z: p[2] + 1.2, r: 1.4, amount: 0.9 }); }
      }
    }
    puddles.push({ x: -3.0, z: -6.4, r: 1.5, amount: 0.9 }, { x: 2.6, z: -6.8, r: 1.2, amount: 0.85 });
    paths.push([[0, 4], [-1.5, -8]], [[9, -1], [2, -2.6]], [[-7.5, -9.4], [-4, -6]], [[-6.6, -1.8], [-1.0, -3.2]], [[-4, -10], [2.5, -10]]);
    scatter('straw', 4, -10, 9, -10, 4, [0.7, 1.2], [0.5, 0.75]); scatter('leaves', 3, -10, 9, -10, 4, [0.8, 1.3], [0.5, 0.7]);
    scatter('stain', 6, -10, 9, -10, 5, [1.6, 3.0], [0.25, 0.4], 0.014, [0.6, 0.62, 0.68]);
    scatter('crack', 4, -10, 9, -10, 5, [1.2, 2.2], [0.4, 0.7]);
    // the festival's litter: petals and paper in the tournament's colours, thickest under the strings
    scatter('leaves', 7, -9, 7, -6, 4, [0.5, 0.9], [0.55, 0.8], 0.016, [0.62, 0.72, 1.25]); scatter('leaves', 6, -9, 7, -6, 4, [0.5, 0.9], [0.55, 0.8], 0.016, [1.3, 1.05, 0.6]);
  }

  // ---------------------------------------------------------------- the façades' wall lanterns: lit near the focal point, dark elsewhere (hierarchy)
  const [fx, fz] = FOCUS[kind];
  const wallLamps = sockets.filter((s) => s.kind === 'lamp');
  const ranked = [...wallLamps].sort((a, b) => Math.hypot(a.pos[0] - fx, a.pos[2] - fz) - Math.hypot(b.pos[0] - fx, b.pos[2] - fz));
  // (the two nearest since journal Passe VP7; the side rows' lanterns lit by the seventh critique of Passe VP6 dark again, the light plan)
  const litSet = new Set(ranked.slice(0, WALL_LAMPS[kind]));
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
  }

  // ---------------------------------------------------------------- the city beyond: a ring of far houses (each a part), the Colosseum's drum as the landmark
  const far = new MeshBuilder();
  {
    // (turned toward each square's view since journal Passe VP9: the lists look west-north-west, the hall's square north-north-east)
    const r = rng.fork('far'), [turn, fcx, fcz] = FAR_RING[kind];
    for (let n = 0; n < 26; n++) {
      const a = r.range(-1.05, 1.05) + turn, d = r.range(62, 104);
      const o = { x: Math.sin(a) * d + fcx, y: r.range(-0.5, 1.5), z: -Math.cos(a) * d + fcz, w: r.range(6, 10), d: r.range(5, 8), h: r.range(5, 9), wall: [0.3, 0.31, 0.36] as V3, roof: [0.12, 0.14, 0.2] as V3, id: 500 + n, lit: day ? 0 : r.range(0.2, 0.6), hip: r.bool(0.3), chimney: r.bool(0.4) };
      // (none inside the arena's footprint, journal Passe VP8: its draws kept, the rest of the ring unchanged)
      const fa = FAR_ARENA[kind]; if (fa && Math.hypot(o.x - fa.c[0], o.z - fa.c[1]) < ARENA_R + 8) continue;
      far.frame.part = part();
      farHouse(far, o);
    }
    far.frame.part = 0;
  }
  // the skyline beyond the north rows (journal Passe VP6: « no depth past the first row of façades »): the citadel's towers and spires, far
  {
    const r = rng.fork('spires');
    // (three, farther and darker since journal Passe VP7: five near ones read by day as « plain white cones on cylinders »)
    // (none behind the squares the arena towers over since journal Passe VP8: the landmark is the arena, the spires read « a featureless white
    // needle »; their draws kept)
    for (let n = 0; n < 3; n++) {
      const x = (kind === 'training' ? -1 : 1) * (-40 + n * 34 + r.range(-5, 5)), z = -165 - r.range(0, 35);
      if (FAR_ARENA[kind]) { r.range(2, 8); r.range(3.2, 4.4); r.range(20, 28); r.range(8, 12); continue; }
      far.frame.part = part();
      tower(far, x, r.range(2, 8), z, r.range(3.2, 4.4), r.range(20, 28), r.range(8, 12), [0.22, 0.23, 0.28], [0.12, 0.15, 0.26], 540 + n, day ? 0 : 0.2);
    }
    far.frame.part = 0;
  }
  // (the Colosseum's drum over the other squares' roofs left with journal Passe VP7: both panels of its first critique read it as « a long
  // untextured grey curved wall », « a placeholder backdrop »; back since journal Passe VP8 in the forecourt's language, `farArena`)
  { const fa = FAR_ARENA[kind]; if (fa) farArena(S, tracked, day, fa.c[0], fa.c[1], fa.y0); }
  const farMat = farMaterial(); disposables.push(farMat);
  if (day) { farMat.defines = { ...farMat.defines, DAY: 1 }; farMat.needsUpdate = true; }

  // ---------------------------------------------------------------- the ground: one plane, its mask (water, grime, wear, contact shadow)
  const { rect: RECT, res: [mw, mh], plane } = GROUND[kind];
  {
    // (no puddle on the training ground's earth since journal Passe VP7, iteration 6: « Puddles on sand show as black ovals »)
    const wet = kind === 'training' ? puddles.filter((b) => b.x < YARD[0] - 0.5 || b.x > YARD[2] + 0.5 || b.z < YARD[1] - 0.5 || b.z > YARD[3] + 0.5) : puddles;
    const mask = plazaMask(seed, RECT, mw, mh, obstacles, day ? [] : wet, paths, day ? 0 : 1);
    const tex = new THREE.DataTexture(mask, mw, mh, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.colorSpace = THREE.NoColorSpace; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true; disposables.push(tex);
    lib.ground.uniforms.tGroundMask.value = tex;
    lib.ground.uniforms.uGroundRect.value.set(RECT.x0, RECT.z0, RECT.w, RECT.h);
    const g = new THREE.PlaneGeometry(90, 90); g.rotateX(-Math.PI / 2); g.translate(plane[0], 0, plane[1]);
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
  // the light plan (journal Passe VP7): a halo only round the key light, the hierarchy's top
  for (const l of lights) if (!l.key) l.halo = 0;
  const props = batch.build(lib.slot, (o, s) => { if (s !== 'leaf' && s !== 'cloth' && s !== 'glow') o.layers.enable(LAYER_CAST); });
  group.add(props);
  const out: PlazaBuild = {
    group, lights, emitters, walk: { ...walk }, lanes, exits, blockers, spots, wander,
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
  // (journal Passe VP6, seventh critique: « the warm cream stone sits outside the locked cool stone palette »: a cooler grey)
  // (at night a shade darker again, so the torches' pools carry the wall: eleventh critique, « lit with no visible source and no falloff »)
  // (by day a step darker too, twelfth critique: « the pale limestone is much lighter than anything in R; by day it nearly clips to white »)
  const nk = day ? 0.86 : 0.72, R = 52, C: V3 = [0, 0, -71.2], stone: V3 = [0.67 * nk, 0.66 * nk, 0.64 * nk], stoneLt: V3 = [0.73 * nk, 0.71 * nk, 0.68 * nk], dark: V3 = day ? [0.17, 0.16, 0.17] : [0.07, 0.07, 0.09], uv = 0.6;
  // journal Passe VP6, third critique (« a single flat plane with a noisy brick texture »): the stone keeps the frame (piers, arches, courses,
  // cornice), the panels between them are smooth stucco
  const Pl = S.get('plaster'), stucco: V3 = [0.67 * nk, 0.66 * nk, 0.64 * nk];
  const St = S.get('stone'), Dk = S.get('dark');
  // two tiers, 6.4 and 10.8 m, the cornice at 11.25 (journal Passe VP1: the third critique asked for the top in the frame; lowered to 5.3 /
  // 8.9 m, the fourth judged it worse, 5.5 / 10 against 6: its flat top and bare masts read as a box with antennae, the landmark lost its mass)
  const TIER_G = 6.4, TIER_U = 10.8;
  const bayW = 3.7, gateW = 5.6;
  // bay centres along the arc: the gate at 0, five bays each side
  const angles: Array<{ a: number; w: number; gate: boolean }> = [{ a: 0, w: gateW, gate: true }];
  for (const s of [-1, 1]) { let a = s * (gateW / 2 + bayW / 2) / R; for (let i = 0; i < 6; i++) { angles.push({ a, w: bayW, gate: false }); a += s * bayW / R; } }
  const arch = (cx: number, yb: number, hw: number, hRect: number, z: number, ring: V3, niche = false, through = 0) => {
    // the dark opening (a recess: its back 0.7 m inside), its semicircular head, and the ring of voussoirs; by day the upper arcade's are
    // niches, their back in the shade of the head with a door into the gallery (fifth critique: « the upper arches are black cut-outs »)
    const n = 10, yc = yb + hRect;
    if (through > 0) {
      // the gate's passage by day, `through` m deep, the sunlit arena at its end (sixth critique: « give the gate depth [...] a lit passage
      // behind the portcullis »): its walls and vault in the shade, its paving, the sand and the far stands in the light
      const shade: V3 = [0.4 * nk, 0.38 * nk, 0.36 * nk];
      for (const sx of [-1, 1]) quadFacing(St, [[cx + sx * hw, yb, z - 0.72], [cx + sx * hw, yb, z - through], [cx + sx * hw, yc, z - through], [cx + sx * hw, yc, z - 0.72]], [-sx, 0, 0], { uvScale: uv, tint: shade, ao: [0.75, 0.42, 0.42, 0.75] });
      for (let i = 0; i < n; i++) {
        const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI, am = (a0 + a1) / 2;
        quadFacing(St, [[cx + Math.cos(a0) * hw, yc + Math.sin(a0) * hw, z - 0.72], [cx + Math.cos(a1) * hw, yc + Math.sin(a1) * hw, z - 0.72], [cx + Math.cos(a1) * hw, yc + Math.sin(a1) * hw, z - through], [cx + Math.cos(a0) * hw, yc + Math.sin(a0) * hw, z - through]], [-Math.cos(am), -Math.sin(am), 0], { uvScale: uv, tint: [shade[0] * 0.85, shade[1] * 0.85, shade[2] * 0.85], ao: 0.6 });
      }
      St.boxMM(cx - hw, yb - 0.02, z - through, cx + hw, yb + 0.012, z - 0.5, { uvScale: uv, tint: [0.5, 0.48, 0.45] });
      const zf = z - through + 0.02, Pl2 = S.get('plaster');
      // the far side of the arena seen through: the sunlit sand, the barrier, the tiers of the stands in their shade, a banner (seventh
      // critique: « a blank white field »)
      // (ninth critique, both panels: the end « a blown-out white void », « a flat glowing white grid, not a passage »: the far side in
      // the arena's own shade, the portcullis a silhouette against it)
      Pl2.quad([cx - hw, yb, zf], [cx + hw, yb, zf], [cx + hw, yb + 1.1, zf], [cx - hw, yb + 1.1, zf], { tint: [1.05, 0.88, 0.64] });
      St.boxMM(cx - hw, yb + 1.1, zf, cx + hw, yb + 1.5, zf + 0.012, { tint: [0.62, 0.52, 0.42] });
      for (let t = 0; t < 7; t++) {
        const y0 = yb + 1.5 + t * 0.5;
        Pl2.quad([cx - hw, y0, zf], [cx + hw, y0, zf], [cx + hw, y0 + 0.3, zf], [cx - hw, y0 + 0.3, zf], { tint: [0.6, 0.59, 0.62] });
        Pl2.quad([cx - hw, y0 + 0.3, zf], [cx + hw, y0 + 0.3, zf], [cx + hw, y0 + 0.5, zf], [cx - hw, y0 + 0.5, zf], { tint: [0.32, 0.32, 0.37] });
      }
      S.get('cloth').boxMM(cx - 0.35, yb + 2.2, zf + 0.015, cx + 0.35, yb + 3.6, zf + 0.02, { tint: [0.4, 0.5, 0.95] });
    } else if (niche) {
      Pl.boxMM(cx - hw, yb, z - 0.75, cx + hw, yb + hRect, z - 0.7, { tint: [0.46 * nk, 0.44 * nk, 0.43 * nk], aoY: [0.85, 0.6] });
      Dk.boxMM(cx - hw * 0.42, yb, z - 0.69, cx + hw * 0.42, yb + hRect * 0.82, z - 0.68, { tint: dark });
    } else Dk.boxMM(cx - hw, yb, z - 0.75, cx + hw, yb + hRect, z - 0.7, { tint: dark });
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI;
      if (!through) (niche ? Pl : Dk).tri([cx + Math.cos(a0) * hw, yc + Math.sin(a0) * hw, z - 0.72], [cx + Math.cos(a1) * hw, yc + Math.sin(a1) * hw, z - 0.72], [cx, yc, z - 0.72], { tint: niche ? [0.36 * nk, 0.34 * nk, 0.34 * nk] : dark, ao: niche ? 0.6 : 1 });
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
      if (b.gate) arch(0, 0, 2.1, 4.0, 0, stoneLt, false, day ? 7 : 0); else arch(0, 0, 1.25, 3.4, 0, stoneLt);
      // the tunnels behind two ground arches either side lit at night (the arena's galleries; the third critique's « red slab » was an upper arch)
      // (the glass atlas's hot cell since journal Passe VP8, fading upward: without uvs a box samples the atlas's dark edge, and these tunnels
      // were black)
      if (!day && !b.gate && [2, 4].includes(Math.abs(Math.round(b.a * R / bayW)))) S.get('glow').boxMM(-1.24, 0, -0.69, 1.24, 3.4, -0.68, { tint: [0.15, 0.12, 0.075], uvs: COAL_UV, aoY: [1, 0.15] });
      arch(0, TIER_G + 0.55, 0.95, 1.6, -0.1, stoneLt, day);
      // ([KO] journal Passe VP8, iteration 2: a dim light deep in a few upper arches, for the second critique's « flat ambient-blue wall over
      // the whole upper half »: at the frame's edges, behind the pavilions, « saturated red lit slits [...] read as a bug », the third critique)
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
  if (!day) for (const s of [-1, 1]) for (const k of [1, 2, 4]) {
    const a = s * (gateW / 2 + bayW * k) / R, x = Math.sin(a) * (R + 0.5), z = C[2] + Math.cos(a) * (R + 0.5);
    S.get('metal').box(x, 3.1, z, 0.1, 0.5, 0.1, { tint: [0.3, 0.28, 0.27] });
    S.get('glow').box(x, 3.45, z, 0.16, 0.22, 0.16, { tint: [1, 0.6, 0.25] });
    // (their glow without a light from journal Passe VP7's light plan to its fifth iteration; since its sixth a pair one bay from the gate, lit,
    // the pavilions' two lights given to them: « Light the night: sconces on the gatehouse », « the gatehouse is a flat beige wall »; the
    // pair two bays off stood behind the pavilions)
    if (k === 1) lights.push({ pos: [Math.sin(a) * (R + 1.1), 3.3, C[2] + Math.cos(a) * (R + 1.1)], color: FIRE, intensity: 2.6, radius: 6.5, kind: 'fire', halo: 0, priority: 8 });
  }
  // (the piers' torches lit the wall by the gate until journal Passe VP7: the gate's lantern and its braziers light it, the light plan)
  // the gate's passage lit at night (fourth critique: « the gate a black void »): a lantern hung under its arch, its light on the doors
  if (!day) { S.get('metal').boxMM(-0.02, 5.2, C[2] + R - 0.3, 0.02, 6.05, C[2] + R - 0.26, { tint: [0.3, 0.3, 0.32] }); S.get('glow').box(0, 4.95, C[2] + R - 0.28, 0.3, 0.42, 0.3, { tint: [1, 0.62, 0.28] }); lights.push({ pos: [0, 4.6, C[2] + R + 0.8], color: FIRE, intensity: 2.6, radius: 7.5, kind: 'fire', halo: 1.2, priority: 9, key: true }); }
  // inside a few ground arches: the tunnels' torches (warm accents at the focal point, lit day and night like the arena's fires)
  for (const s of [-1, 1]) {
    const a = s * (gateW / 2 + bayW * 1.5) / R, x = Math.sin(a) * R, z = C[2] + Math.cos(a) * R - 0.6;
    S.get('glow').box(x, 2.6, z, 0.18, 0.4, 0.1, day ? { tint: fireTint(day, [1, 0.55, 0.2]), uvs: COAL_UV, aux: [0, 1, 0.5, 0] } : { tint: [1, 0.55, 0.2] });
    // (their glow without a light since journal Passe VP7, the light plan)
  }
  void emitters;
  blockers.push({ x: 0, z: -18.6, r: 0.1 });
  for (const s of [-1, 1]) { const a = s * (gateW / 2 + bayW / 2) / R, x = Math.sin(a) * R; blockers.push({ x, z: -17.6, r: 2.4, h: 13 }); obstacles.push({ x0: x - 2.5, x1: x + 2.5, z0: -20.5, z1: -16.0, grime: 0.8 }); }
  obstacles.push({ x0: -14, x1: 14, z0: -21.5, z1: -19.0, grime: 0.9 });
}

// the glass atlas's hot cell between its lead bars (the forge's HOT_UV crosses a bar: on a blade a metre wide the bar drew a black cross, the
// first captures of VP8), a pane of its bright core
const FLAME_UV = [0.635, 0.71, 0.66, 0.71, 0.648, 0.79], COAL_UV = [0.635, 0.71, 0.66, 0.71, 0.66, 0.79, 0.635, 0.79];
/** a fire's glow by day (journal Passe VP8, the audit: « empty bowls on bare thin poles, with no coals or flame »): the glass's emission is
 *  the day state's 0.06 (the lanterns and windows unlit, J4), so a fire lit by day carries it in its tint, three times (the tunnels'
 *  torches); the braziers' embers by day are ash (`ASH`, their live flame the particles'): nine times, then three, the third and fourth
 *  critiques: « the brazier tops read as orange discs, not fire », « By day, the braziers' red caps look like plastic »; the night as before */
const FIRE_DAY = 3, ASH: V3 = [0.24, 0.22, 0.21];
const fireTint = (day: boolean, t: V3): V3 => (day ? [t[0] * FIRE_DAY, t[1] * FIRE_DAY, t[2] * FIRE_DAY] : t);
/** a brazier's live fire over its solid flame (journal Passe VP8): tongues the size of its bowl (Particles' 'brazier', the arena's flame
 *  narrowed) and the arena's embers; a still frame (the tools' captures, the loop never started) shows the solid flame alone */
function fireEmitters(x: number, y: number, z: number): Emitter[] {
  return [{ kind: 'forge', tag: 'brazier', pos: [x, y, z], rate: 1 }, { kind: 'forge', tag: 'embers', pos: [x, y + 0.12, z], rate: 0.4 }];
}
/** a fire's flame (journal Passe VP8): three tongues turned about the fire's axis, each a blade narrowing to its tip, both faces drawn, in the
 *  lit glass (aux.y = 1: the flicker of the district's lit windows) */
function flameAt(S: SlotSet, day: boolean, x: number, y: number, z: number, h: number): void {
  const G = S.get('glow'), seed = (((x * 0.37 + z * 0.11) % 1) + 1) % 1;
  for (const [k, [a, hh, off]] of ([[0, 1, 0], [2.1, 0.74, 0.07], [4.2, 0.62, 0.07]] as Array<[number, number, number]>).entries()) {
    const dx = Math.cos(a), dz = Math.sin(a), ox = x + Math.cos(a + 1.6) * off, oz = z + Math.sin(a + 1.6) * off, w = h * 0.26, th = h * hh;
    const L: V3 = [ox - dx * w, y, oz - dz * w], Rr: V3 = [ox + dx * w, y, oz + dz * w], Ml: V3 = [ox - dx * w * 0.55, y + th * 0.45, oz - dz * w * 0.55], Mr: V3 = [ox + dx * w * 0.6, y + th * 0.4, oz + dz * w * 0.6], T: V3 = [ox + dx * w * 0.2, y + th, oz + dz * w * 0.2];
    const o = (t: V3, s: number) => ({ tint: fireTint(day, t), uvs: FLAME_UV, aux: [0, 1, (seed + k * 0.31 + s) % 1, 0] as [number, number, number, number] });
    for (const flip of [false, true]) {
      G.tri(L, Rr, Mr, { ...o([1.05, 0.5, 0.16], 0), flip }); G.tri(L, Mr, Ml, { ...o([1.05, 0.62, 0.22], 0.2), flip }); G.tri(Ml, Mr, T, { ...o([1.1, 0.86, 0.45], 0.4), flip });
    }
  }
}

/** the arena seen from the other squares (journal Passe VP8, the operator, word for word: « je veux intégrer une visibilité commune qui est la
 *  perception du grand colisee/arène de combat en fond arrière pour garde cet élément principale au jeu »): its drum close behind the north
 *  rows, on its rise (`y0`: at its height on level ground the 13-14 m roofs 45 m from the camera hid it whole, a script's count of the
 *  frames' skyline), in the forecourt's language: two tiers of arches between piers, string courses, a crenellated cornice, the cavea's
 *  inner wall rising behind with the masts and pennants of the tournament on its rim; only the half facing the square, each bay a part.
 *  [KO] VP6's drum, a cylinder with two dark bands: « a long untextured grey curved wall », « a placeholder backdrop » (journal Passe VP7);
 *  on an 8 m rise under the framings at 4.5°, its rim cut by the frame, « a band of stone rather than a colosseum » (the second critique):
 *  4.5 m under the framings at 3°, its rim 12-28 px under the frame's top at 720 lines (the script's count) */
// (journal Passe VP9: in each square's new view, the forecourt between them as before: west-north-west of the lists, north-east of the hall)
const FAR_ARENA: Partial<Record<PlazaKind, { c: [number, number]; y0: number }>> = { training: { c: [-125, -60], y0: 9 }, festival: { c: [80, -118], y0: 7 } };
/** the far ring of houses round each square's view: its turn (radians from the north, toward the east) and its centre (journal Passe VP9) */
const FAR_RING: Record<PlazaKind, [number, number, number]> = { forecourt: [0, 0, -6], training: [-0.88, -2, -4], festival: [0.43, 0, -6] };
/** each square's ground: its mask's rectangle and resolution, the plane's centre (journal Passe VP9: the lists' yard is twice as long) */
const GROUND: Record<PlazaKind, { rect: { x0: number; z0: number; w: number; h: number }; res: [number, number]; plane: [number, number] }> = {
  forecourt: { rect: { x0: -18, z0: -26, w: 36, h: 34 }, res: [384, 362], plane: [0, -16] },
  training: { rect: { x0: -28, z0: -16, w: 76, h: 32 }, res: [768, 324], plane: [0, -4] },
  festival: { rect: { x0: -18, z0: -26, w: 36, h: 34 }, res: [384, 362], plane: [0, -16] },
};
const ARENA_R = 52;
function farArena(S: SlotSet, tracked: (fn: () => void) => void, day: boolean, cx: number, cz: number, y0: number): void {
  // (its stone a step darker than the forecourt's: at 80-110 m the squares' haze lifts it toward the sky's value, the first capture « pale »)
  const nk = day ? 0.7 : 0.66, stone: V3 = [0.67 * nk, 0.66 * nk, 0.64 * nk], stoneLt: V3 = [0.73 * nk, 0.71 * nk, 0.68 * nk], reveal: V3 = [0.54 * nk, 0.51 * nk, 0.47 * nk];
  const dark: V3 = day ? [0.17, 0.16, 0.17] : [0.07, 0.07, 0.09], R = ARENA_R, IN = 9, TG = 6.4, TU = 10.8, RIM = 16.1;
  const St = S.get('stone'), Pl = S.get('plaster'), Dk = S.get('dark'), N = Math.round((Math.PI * 2 * R) / 3.7), hw = (Math.PI * R) / N, ihw = (hw * (R - IN)) / R;
  // the outward normal (sin a, cos a) of the bay facing the square
  const toward = Math.atan2(-cx, -cz);
  // an arch between two piers: its dark recess and head, the intrados, the spandrels up to the bay's corners, the reveals (the forecourt's
  // arch, six segments to a head)
  const arch = (yb: number, ah: number, rect: number): number => {
    const n = 6, yc = yb + rect, p = (a: number, z: number): V3 => [Math.cos(a) * ah, yc + Math.sin(a) * ah, z];
    Dk.boxMM(-ah, yb, -0.62, ah, yc, -0.58, { tint: dark });
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI, a1 = ((i + 1) / n) * Math.PI;
      Dk.tri(p(a0, -0.6), p(a1, -0.6), [0, yc, -0.6], { tint: dark });
      St.quad(p(a0, 0), p(a1, 0), p(a1, -0.6), p(a0, -0.6), { tint: reveal });
      St.tri(p(a0, 0), p(a1, 0), [a0 < Math.PI / 2 ? ah + 0.02 : -ah - 0.02, yc + ah + 0.02, 0], { tint: stone, flip: true });
    }
    for (const s of [-1, 1]) St.boxMM(s * ah - (s > 0 ? 0.04 : 0), yb, -0.6, s * ah + (s < 0 ? 0.04 : 0), yc, 0, { tint: reveal });
    return yc + ah;
  };
  for (let i = 0; i < N; i++) {
    const a = (i / N) * Math.PI * 2, d = Math.atan2(Math.sin(a - toward), Math.cos(a - toward));
    if (Math.abs(d) > 1.25) continue;
    tracked(() => S.at([cx + Math.sin(a) * R, y0, cz + Math.cos(a) * R], a, () => {
      // the plinth down to the ground (its rise stands behind the rows), the piers, the ground tier's arch and the wall over its head
      St.boxMM(-hw, -y0 - 0.5, -0.5, hw, 0.9, 0.36, { tint: [stone[0] * 0.78, stone[1] * 0.78, stone[2] * 0.8], aoY: [0.55, 1] });
      for (const s of [-1, 1]) {
        St.boxMM(s * hw - 0.4, 0, -0.5, s * hw + 0.4, TG, 0.3, { tint: stoneLt, aoY: [0.7, 1] });
        St.boxMM(s * hw - 0.26, TG, -0.4, s * hw + 0.26, TU, 0.18, { tint: stoneLt });
      }
      const g = arch(0, hw - 0.4, 3.3);
      Pl.boxMM(-hw + 0.4, g, -0.12, hw - 0.4, TG + 0.05, -0.02, { tint: stone });
      // the string course, the upper tier's arch, the wall round it, the cornice, the parapet and its merlons
      St.boxMM(-hw - 0.05, TG - 0.2, -0.55, hw + 0.05, TG + 0.15, 0.42, { tint: stoneLt });
      const u = arch(TG + 0.55, 0.95, 1.6);
      Pl.boxMM(-0.97, u, -0.12, 0.97, TU + 0.02, -0.1, { tint: stone });
      for (const s of [-1, 1]) Pl.boxMM(s > 0 ? 0.95 : -hw + 0.26, TG + 0.15, -0.12, s > 0 ? hw - 0.26 : -0.95, TU, -0.1, { tint: stone });
      St.boxMM(-hw - 0.05, TU, -0.6, hw + 0.05, TU + 0.45, 0.35, { tint: stoneLt });
      St.boxMM(-hw, TU + 0.45, -0.5, hw, TU + 0.95, -0.1, { tint: stone });
      for (const m of [-hw / 2, hw / 2]) St.boxMM(m - 0.45, TU + 0.95, -0.5, m + 0.45, TU + 1.6, -0.1, { tint: stoneLt });
      // at night the galleries behind one ground arch in three lit (the forecourt's tunnels), and one upper arch in four, the tier the squares
      // see over their roofs (emissive: the light plan's ambient, no light of its own)
      if (!day && i % 3 === 1) S.get('glow').boxMM(-hw + 0.45, 0, -0.57, hw - 0.45, 3.3, -0.56, { tint: [0.3, 0.18, 0.07], uvs: COAL_UV, aoY: [1, 0.2] });
      if (!day && i % 4 === 2) S.get('glow').boxMM(-0.9, TG + 0.55, -0.57, 0.9, TG + 2.15, -0.56, { tint: [0.24, 0.14, 0.06], uvs: COAL_UV, aoY: [1, 0.2] });
      // the cavea's inner wall behind (the arena's upper rim: the second plane of the silhouette), a window in one bay out of two, its cornice
      Pl.quad([-ihw, TU, -IN], [ihw, TU, -IN], [ihw, RIM, -IN], [-ihw, RIM, -IN], { tint: [stone[0] * 1.02, stone[1] * 1.02, stone[2] * 1.02], ao: [0.75, 0.75, 1, 1] });
      St.boxMM(-ihw - 0.02, RIM, -IN - 0.4, ihw + 0.02, RIM + 0.5, -IN + 0.35, { tint: stoneLt });
      if (i % 2) Dk.quad([-0.6, RIM - 3.7, -IN + 0.02], [0.6, RIM - 3.7, -IN + 0.02], [0.6, RIM - 1.7, -IN + 0.02], [-0.6, RIM - 1.7, -IN + 0.02], { tint: dark });
      // at night a torch on the rim every third bay (its crown against the night sky)
      if (!day && i % 3 === 1) S.get('glow').box(0, RIM + 0.85, -IN + 0.3, 0.3, 0.42, 0.3, { tint: [1, 0.6, 0.25], uvs: COAL_UV, aux: [0, 1, (i * 0.37) % 1, 0] });
      // a mast on the rim every third bay, the tournament's pennant (the velarium's masts: the arena's crown over the roofs)
      if (i % 3 === 0) {
        S.get('timber').boxMM(-0.08, RIM + 0.5, -IN - 0.08, 0.08, RIM + 6.4, -IN + 0.08, { tint: [0.5, 0.42, 0.34], grain: 'y' });
        addBanner(S, { pos: [0.16, RIM + 6.0, -IN], yaw: Math.PI / 2, w: 0.8, h: 2.4, emblem: i % 6 === 0 ? 'swords' : 'laurel', shape: 'pennant', loose: 0.7, rod: false, tint: i % 6 === 0 ? [0.5, 0.6, 0.95] : [0.95, 0.88, 0.62] });
      }
    }));
  }
}

/** one of the arena gate's towers, in the frame of its bay (local z out of the facade): a square tower standing 3.2 m proud of the arcade and
 *  5 m above its cornice, a darker plinth, the tiers' courses carried round it, arrow slits, a corbelled parapet with merlons, the tournament's
 *  banner on its face and a pennant on a pole; a torch on its face and a lit slit at night */
function gateTower(S: SlotSet, day: boolean, lights: PlazaBuild['lights'], emblem: EmblemKind, stone: V3, stoneLt: V3, uv: number): void {
  const St = S.get('stone'), w = 2.4, z0 = -0.6, z1 = 3.2, H = 15.4;
  // rendered faces framed by stone quoins (fifth critique: « one huge flat plane of tiled brick »), the render weathered darker toward the foot
  S.get('plaster').boxMM(-w, 0, z0, w, H, z1, { tint: [stone[0] * 1.02, stone[1] * 1.0, stone[2] * 0.98], aoY: [0.62, 1] });
  // the quoins flush with the render (a few mm proud), their heights and lengths irregular, their stone a shade off the render (seventh
  // critique: « evenly spaced cubes stuck along edges [...] the clearest procedural tell »)
  for (const sx of [-1, 1]) for (let i = 0, y = 1.2; y < H - 0.8; i++) {
    const r = Math.abs(Math.sin(i * 12.9898 + sx * 78.233) * 43758.5453) % 1, h = 0.48 + 0.3 * r;
    const lx = (i % 2 ? 0.46 : 0.82) + 0.16 * r, lz = (i % 2 ? 0.82 : 0.46) + 0.12 * (1 - r);
    St.boxMM(sx > 0 ? w - lx : -w - 0.008, y, z1 - lz, sx > 0 ? w + 0.008 : -w + lx, y + h - 0.03, z1 + 0.008, { uvScale: 0.32, tint: [stoneLt[0] * (0.97 + 0.05 * r), stoneLt[1] * (0.97 + 0.05 * r), stoneLt[2] * (0.97 + 0.05 * r)] });
    y += h;
  }
  St.boxMM(-w - 0.12, 0, z0, w + 0.12, 1.2, z1 + 0.12, { uvScale: uv, tint: [stone[0] * 0.78, stone[1] * 0.78, stone[2] * 0.8] });
  for (const y of [6.4, 10.8]) St.boxMM(-w - 0.1, y, z0, w + 0.1, y + 0.32, z1 + 0.1, { tint: stoneLt });
  St.boxMM(-w - 0.25, H - 0.4, z0 - 0.25, w + 0.25, H + 0.3, z1 + 0.25, { tint: stoneLt });
  for (let i = 0; i < 6; i++) St.box(-w + 0.2 + (i * (2 * w - 0.4)) / 5, H - 0.6, z1 + 0.12, 0.22, 0.3, 0.26, { tint: stoneLt });
  St.boxMM(-w - 0.25, H + 0.3, z1 - 0.2, w + 0.25, H + 0.7, z1 + 0.25, { tint: stone });
  for (let i = 0; i < 4; i++) { const x = -w + 0.45 + (i * (2 * w - 0.9)) / 3; St.boxMM(x - 0.42, H + 0.7, z1 - 0.2, x + 0.42, H + 1.45, z1 + 0.25, { tint: stoneLt }); }
  for (const xs of [-w - 0.05, w + 0.05]) for (let i = 0; i < 3; i++) { const zz = z0 + 0.5 + i * 1.3; St.boxMM(Math.min(xs, xs * 1.04) - 0.2, H + 0.7, zz - 0.35, Math.max(xs, xs * 1.04) + 0.2, H + 1.45, zz + 0.35, { tint: stoneLt }); }
  const D = S.get('dark');
  // (the slits half their first size, eleventh critique: « about two-thirds of a character's height, repeated like wallpaper »)
  for (const [x, y] of [[-1.0, 4.4], [1.0, 4.4], [0, 8.6], [0, 12.8]] as Array<[number, number]>) D.boxMM(x - 0.08, y, z1 + 0.005, x + 0.08, y + 0.6, z1 + 0.02, { tint: [0.06, 0.06, 0.08] });
  if (!day) S.get('glow').boxMM(-0.07, 12.82, z1 + 0.022, 0.07, 13.38, z1 + 0.03, { tint: [0.9, 0.5, 0.2] });
  addBanner(S, { pos: [0, 10.4, z1 + 0.14], yaw: 0, w: 1.5, h: 3.6, emblem, shape: 'swallow', loose: 0.3, rod: true, tint: emblem === 'crown' ? [0.95, 0.88, 0.62] : [0.5, 0.6, 0.95] });
  // a slate roof over each tower, the town's blue, its finial and the pennant on it (tenth critique: « a giant flat box [...] it reads as a
  // wall, not a castle: towers with slate turret roofs »)
  {
    const Rf = S.get('roof'), yb = H + 0.75, ya = yb + 5.2, ax = 0, az = (z0 + z1) / 2, inX = w - 0.15, z0i = z0 + 0.15, z1i = z1 - 0.15;
    const C4: V3[] = [[-inX, yb, z1i], [inX, yb, z1i], [inX, yb, z0i], [-inX, yb, z0i]], apex: V3 = [ax, ya, az];
    for (let k = 0; k < 4; k++) {
      const a = C4[k], b = C4[(k + 1) % 4], L = Math.hypot(b[0] - a[0], b[2] - a[2]), mx = (a[0] + b[0]) / 2 - ax, mz = (a[2] + b[2]) / 2 - az, sl = Math.hypot(Math.hypot(mx, mz), ya - yb);
      const u: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], v: V3 = [apex[0] - a[0], apex[1] - a[1], apex[2] - a[2]];
      const nx = u[1] * v[2] - u[2] * v[1], nz = u[0] * v[1] - u[1] * v[0];
      Rf.tri(a, b, apex, { uvs: [0, 0, L, 0, L / 2, sl], tint: [0.96, 0.96, 1.0], ao: [0.75, 0.75, 1], flip: nx * mx + nz * mz < 0 });
      Rf.sweep([a, [apex[0], apex[1] + 0.02, apex[2]]], 0.06, 4, { tint: [0.78, 0.78, 0.84] });
    }
    S.get('metal').cylinder(0.14, ya - 0.05, ya + 0.35, 8, { tint: [1.1, 0.92, 0.55], r1: 0.05 });
    S.get('timber').boxMM(ax - 0.05, ya + 0.3, az - 0.05, ax + 0.05, ya + 2.6, az + 0.05, { tint: [0.5, 0.42, 0.34], grain: 'y' });
    addBanner(S, { pos: [ax + 0.08, ya + 2.4, az], yaw: Math.PI / 2, w: 0.6, h: 1.7, emblem, shape: 'pennant', loose: 0.8, rod: false, tint: [0.95, 0.88, 0.62] });
  }
  S.get('metal').box(0, 3.1, z1 + 0.15, 0.1, 0.5, 0.1, { tint: [0.3, 0.28, 0.27] });
  if (!day) S.get('glow').box(0, 3.45, z1 + 0.15, 0.16, 0.22, 0.16, { tint: [1, 0.6, 0.25] });
  void lights;
}


/** a raised ring of sand with its timber kerb, a fence of posts and two rails open toward the camera, a practice dummy at its heart */
function sandRing(S: SlotSet, batch: InstanceBatch, cx: number, cz: number, r: number): void {
  const n = 28;
  // the ring's floor is the yard's own earth (journal Passe VP6, fifth critique: the disc of plaster read as « a flat beige plane »), trodden
  // dark by the mask's paths and a decal; its kerb and fence below
  const T = S.get('timber');
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, rk = r + 0.06;
    T.quad([cx + Math.cos(a0) * rk, 0, cz + Math.sin(a0) * rk], [cx + Math.cos(a1) * rk, 0, cz + Math.sin(a1) * rk], [cx + Math.cos(a1) * rk, 0.12, cz + Math.sin(a1) * rk], [cx + Math.cos(a0) * rk, 0.12, cz + Math.sin(a0) * rk], { tint: [0.46, 0.38, 0.3] });
  }
  // (iteration 13 took this fence away, four critiques of five having read the posts as « a forest of sticks »; both panels of the twelfth
  // preferred it: « the stakes give the night close-up a foreground layer of silhouettes against the lit ground »)
  // the fence: split rails on squared posts in weathered pale timber (fifth critique: « sparse black sticks »)
  const m = 16, rf = r + 0.45;
  for (let i = 0; i < m; i++) {
    // (its gate one span wide since journal Passe VP8: four open spans facing the camera read as « a row of bare stakes with no rails »)
    const a = (i / m) * Math.PI * 2, a1 = ((i + 1) / m) * Math.PI * 2, open = Math.sin((a + a1) / 2) > 0.97;
    T.box(cx + Math.cos(a) * rf, 0.5, cz + Math.sin(a) * rf, 0.15, 1.0, 0.15, { tint: [0.72, 0.6, 0.46], grain: 'y' });
    T.box(cx + Math.cos(a) * rf, 1.02, cz + Math.sin(a) * rf, 0.19, 0.05, 0.19, { tint: [0.6, 0.5, 0.39] });
    if (open) continue;
    for (const y of [0.45, 0.86]) {
      const p0: V3 = [cx + Math.cos(a) * rf, y, cz + Math.sin(a) * rf], p1: V3 = [cx + Math.cos(a1) * rf, y, cz + Math.sin(a1) * rf];
      const len = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]), yaw = Math.atan2(p1[0] - p0[0], p1[2] - p0[2]);
      S.at([(p0[0] + p1[0]) / 2, y, (p0[2] + p1[2]) / 2], yaw, () => T.box(0, 0, 0.0, 0.09, 0.11, len + 0.12, { tint: [0.76, 0.64, 0.5], grain: 'z' }));
    }
  }
  // a pell, the post a sword is practised on, beside the dummy (journal Passe VP6, iteration 9)
  S.at([cx + 2.0, 0, cz - 1.2], 0.3, () => { T.boxMM(-0.13, 0, -0.13, 0.13, 1.85, 0.13, { tint: [0.56, 0.45, 0.34], grain: 'y' }); for (const yy of [0.9, 1.25, 1.5]) S.get('dark').boxMM(-0.135, yy, -0.135, 0.135, yy + 0.03, 0.135, { tint: [0.5, 0.45, 0.4] }); T.boxMM(-0.4, 0, -0.4, 0.4, 0.1, 0.4, { tint: [0.44, 0.36, 0.28] }); });
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

/** a hay bale in straw's own value (the district's prop is tinted 1.5 x yellow for the forge's light: it read as a bright block here, in the
 *  cloth's smooth grain as « untextured, oversaturated yellow cubes that look emissive », fifth critique, and in the boards' grain as crates):
 *  pressed flakes of straw in two shades, each a little out of line, two dark cords */
function hay(S: SlotSet, x: number, z: number, yaw: number, y = 0): void {
  S.at([x, y, z], yaw, () => {
    const C = S.get('cloth'), k = Math.abs(Math.sin(x * 7.1 + z * 3.7));
    for (let i = 0; i < 6; i++) {
      const j = (k * 9.7 + i * 3.3) % 1, ox = (j - 0.5) * 0.04, oz = (((j * 7.3) % 1) - 0.5) * 0.03, t = i % 2 ? 0.9 : 1;
      C.boxMM(-0.42 + ox, i * 0.07, -0.27 + oz, 0.42 + ox, (i + 1) * 0.07, 0.27 + oz, { tint: [0.56 * t, 0.46 * t, 0.28 * t], aoY: [0.75 + i * 0.04, 0.8 + i * 0.04] });
    }
    for (const a of [-0.14, 0.14]) S.get('timber').boxMM(a - 0.014, -0.005, -0.29, a + 0.014, 0.43, 0.29, { tint: [0.3, 0.26, 0.21] });
  });
}

/** a weapon rack: a timber frame with practice swords, staves and two shields */
function weaponRack(S: SlotSet, x: number, z: number, yaw = Math.PI / 2): void {
  S.at([x, 0, z], yaw, () => {
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
    // journal Passe VP8 (the audit: « The canvas is a single flat sheet: no valance, no ridge, no back or sides, and it leans on nothing »): a
    // beam between the front posts, a scalloped valance along it. [KO] a cloth hung between the back posts: from the arrival's framing, « a
    // closed white box » (the first critique)
    T.boxMM(-1.4, 1.8, 0.74, 1.4, 1.9, 0.86, { tint: [0.56, 0.48, 0.4], grain: 'x' });
    for (let i = 0; i < 8; i++) { const x0 = -1.45 + (2.9 * i) / 8, x1 = x0 + 2.9 / 8; for (const flip of [false, true]) C.tri([x0, 1.86, 0.96], [x1, 1.86, 0.96], [(x0 + x1) / 2, 1.68, 0.98], { tint: i % 2 ? [0.64, 0.62, 0.57] : [0.4, 0.46, 0.62], flip, swayArr: [0.2, 0.2, 0.5] }); }
  });
  batch.add('bucket', { pos: xf([1.0, 0, 0.5], [x, 0, z], yaw), yaw: 1 }); batch.add('basket', { pos: xf([-0.8, 0, 0.6], [x, 0, z], yaw), yaw: 2 });
  blockers.push({ x, z, r: 1.4 }); obstacles.push({ x0: x - 1.4, x1: x + 1.4, z0: z - 1, z1: z + 1, grime: 0.4 });
}

/** the festival's stage: a timber platform on posts, steps toward the square, a cloth skirt, a canopy and the festival's banner */
function stage(S: SlotSet, batch: InstanceBatch, x: number, z: number, canopy = true): void {
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
    // (the hall's stage has none since journal Passe VP9: the hall's roof is over it)
    if (canopy) {
      // the canopy: a hipped tent roof over the boards, its short ridge high over the middle (eighth critique: the gabled roof seen from the
      // front « a striped rectangular box with no peak »), a scalloped valance on its front eave, guy ropes to pegs
      const RY = 6.1, RX = 1.4, RZ = -0.55;
      for (let i = 0; i < 10; i++) {
        const x0 = -3.5 + (7.0 * i) / 10, x1 = x0 + 7.0 / 10, t: V3 = i % 2 ? [0.3, 0.37, 0.68] : [0.86, 0.82, 0.7], r0 = (x0 / 3.5) * RX, r1 = (x1 / 3.5) * RX;
        C.quad([r0, RY, RZ], [r1, RY, RZ], [x1, 4.0, 0.75], [x0, 4.0, 0.75], { tint: t, flip: true, swayArr: [0, 0, 0.35, 0.35] });
        C.quad([x0, 4.0, -1.85], [x1, 4.0, -1.85], [r1, RY, RZ], [r0, RY, RZ], { tint: t, flip: true, swayArr: [0.35, 0.35, 0, 0] });
        C.tri([x0, 4.0, 0.76], [x1, 4.0, 0.76], [(x0 + x1) / 2, 3.66, 0.78], { tint: i % 2 ? [0.86, 0.82, 0.7] : [0.3, 0.37, 0.68], swayArr: [0.3, 0.3, 0.6] });
      }
      for (const a of [-3.5, 3.5]) for (let j = 0; j < 4; j++) {
        const z0 = 0.75 - (2.6 * j) / 4, z1 = 0.75 - (2.6 * (j + 1)) / 4;
        C.tri([a, 4.0, z0], [a, 4.0, z1], [Math.sign(a) * RX, RY, RZ], { tint: j % 2 ? [0.86, 0.82, 0.7] : [0.3, 0.37, 0.68], flip: a < 0 });
      }
      T.boxMM(-RX - 0.05, RY - 0.04, RZ - 0.05, RX + 0.05, RY + 0.06, RZ + 0.05, { tint: [0.5, 0.4, 0.32], grain: 'x' });
      for (const a of [-RX, RX]) { T.boxMM(a - 0.03, RY, RZ - 0.03, a + 0.03, RY + 1.1, RZ + 0.03, { tint: [0.5, 0.42, 0.34], grain: 'y' }); addBanner(S, { pos: [a + 0.04, RY + 1.05, RZ], yaw: a > 0 ? -Math.PI / 2 : Math.PI / 2, w: 0.42, h: 1.1, emblem: 'horn', shape: 'pennant', loose: 0.9, rod: false, tint: [0.95, 0.88, 0.62] }); }
      for (const a of [-3.5, 3.5]) S.get('cloth').sweep([[a, 4.0, 0.75], [a * 1.25, 0, 2.6]], 0.015, 4, { tint: [0.4, 0.35, 0.3] });
      // (their stakes since journal Passe VP8: « The stage's guy ropes end on the cobbles with no stakes »)
      for (const a of [-3.5, 3.5]) T.boxMM(a * 1.25 - 0.04, 0, 2.56, a * 1.25 + 0.04, 0.24, 2.64, { tint: [0.44, 0.36, 0.28] });
    }
    addBanner(S, { pos: [0, 3.5, -1.3], yaw: 0, w: 1.4, h: 2.2, emblem: 'horn', shape: 'swallow', loose: 0.4, rod: true, tint: [0.95, 0.88, 0.62] });
    // journal Passe VP6: pennants on the canopy's front posts, the players' things on the boards (a chest, a drum, a stool), a lantern on a post at
    // each front corner
    for (const a of [-3.2, 3.2]) { T.boxMM(a - 0.04, 3.8, 0.35, a + 0.04, 5.0, 0.43, { tint: [0.5, 0.4, 0.32], grain: 'y' }); addBanner(S, { pos: [a + 0.05, 4.9, 0.39], yaw: a > 0 ? -Math.PI / 2 : Math.PI / 2, w: 0.4, h: 1.0, emblem: a > 0 ? 'laurel' : 'trophy', shape: 'pennant', loose: 0.85, rod: false, tint: [0.95, 0.88, 0.62] }); }
    S.get('planks').boxMM(-2.6, 0.95, -0.9, -1.7, 1.45, -0.4, { tint: [0.5, 0.36, 0.26], grain: 'x' });
    S.get('metal').boxMM(-2.62, 1.45, -0.92, -1.68, 1.5, -0.38, { tint: [0.9, 0.75, 0.45] });
    S.at([1.6, 0.95, -0.6], 0, () => {
      S.get('cloth').cylinder(0.32, 0, 0.5, 10, { tint: [0.62, 0.3, 0.24], capTop: true }); S.get('plaster').cylinder(0.3, 0.5, 0.52, 10, { tint: [0.9, 0.86, 0.76], capTop: true });
      // its hoops and the tension cords between them (journal Passe VP8: « an untextured cylinder with no heads or tension ropes »)
      for (const yy of [0.02, 0.44]) S.get('timber').cylinder(0.335, yy, yy + 0.05, 10, { tint: [0.5, 0.38, 0.26] });
      for (let k = 0; k < 10; k++) { const a0 = (k / 10) * Math.PI * 2, a1 = ((k + 0.5) / 10) * Math.PI * 2; S.get('cloth').sweep([[Math.cos(a0) * 0.335, 0.07, Math.sin(a0) * 0.335], [Math.cos(a1) * 0.335, 0.44, Math.sin(a1) * 0.335]], 0.008, 3, { tint: [0.9, 0.86, 0.74] }); }
    });
    for (const a of [-3.55, 3.55]) T.boxMM(a - 0.05, 0, 1.75, a + 0.05, 2.3, 1.85, { tint: [0.42, 0.34, 0.27], grain: 'y' });
  });
  for (const a of [-3.55, 3.55]) batch.add('lantern', { pos: [x + a, 2.55, z + 1.8], yaw: 0 }, 0);
  batch.add('barrel', { pos: [x - 2.6, 0.95, z - 0.9], yaw: 0.3 }); batch.add('stool', { pos: [x + 1.8, 0.95, z - 0.6], yaw: 1.2 });
}

/** a side street's gateway (journal Passe VP5; a stone arch since journal Passe VP6, the first timber lintel did not read as a way out): two
 *  piers in the row's front plane, a round arch between them, the wall over it with its coping and the sign of the place the street leads to,
 *  a lantern on a bracket on each pier (lit at night), the street's darker setts, a lantern lit at night where the street turns; the day's
 *  bunting under the arch */
function gateway(S: SlotSet, batch: InstanceBatch, lights: PlazaBuild['lights'], day: boolean, side: -1 | 1, zs: number, zn: number, emblem: EmblemKind, x = side * 13.25): void {
  const inward = -side, zc = (zs + zn) / 2, St = S.get('stone'), Dk = S.get('stone');
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
    // one light for the gateway, on its southern pier (journal Passe VP7, the light plan: the other lantern glows without one)
    if (!day && za > zc) lights.push({ pos: [x + inward * (th + 0.4), 2.45, zp], color: WARM, intensity: 2.4, radius: 7.5, kind: 'lantern', halo: 1.4, priority: 7 });
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
  const xa = x - side * 0.05, xb = x + side * 8.05;
  quadFacing(S.get('stone'), [[Math.min(xa, xb), 0.011, zs], [Math.max(xa, xb), 0.011, zs], [Math.max(xa, xb), 0.011, zn], [Math.min(xa, xb), 0.011, zn]], [0, 1, 0], { tint: [0.46, 0.46, 0.48], uvScale: 1.4 });
  // (its glow without a light since journal Passe VP7: a far light down the street, outside the frame's budget)
  if (!day) batch.add('lantern', { pos: [x + side * 7.75, 2.7, zc], yaw: inward > 0 ? Math.PI / 2 : -Math.PI / 2 }, 0);
  if (day) garland(S, [x + inward * (th + 0.05), imp - 0.1, zs - pw], [x + inward * (th + 0.05), imp - 0.1, zn + pw], 0.4, { size: 0.36, width: 0.3, spacing: 0.4 });
}

/** the gate to the quay (journal Passe VP5): two stone pillars ending the hedge wall at the frame's near edge, a lantern on each (lit at night).
 *  Low: the camera stands just behind them when the hero is at the square's far end (journal Passe VP6: posts at the kerb read as grey blocks
 *  in the middle of the frame) */
function quayGate(S: SlotSet, batch: InstanceBatch, lights: PlazaBuild['lights'], day: boolean, near: [number, number]): void {
  // (journal Passe VP7, iteration 5: two dies of the balustrade, a little broader and taller, in its dark plaster, a lantern on each; the pale
  // stone pillars 2 m high read at the frames' bottom edge as « orphan posts », « like a tombstone »)
  const Pl = S.get('plaster'), wall: V3 = day ? NEAR_WALL_DAY : [0.3, 0.29, 0.29], cap: V3 = day ? NEAR_CAP_DAY : [0.38, 0.37, 0.36];
  for (const s of [-1, 1]) {
    const x = s * 3.1, z = 8.3;
    Pl.boxMM(x - 0.3, 0, z - 0.3, x + 0.3, 1.2, z + 0.3, { tint: wall, aoY: [0.6, 1] });
    Pl.boxMM(x - 0.35, 1.2, z - 0.35, x + 0.35, 1.28, z + 0.35, { tint: cap });
    batch.add(day ? 'lanternDark' : 'lantern', { pos: [x, 1.3, z], yaw: 0 }, 0);
    // its lantern lit at night (journal Passe VP7, iteration 3: the near edge's lights, the south lamps gone)
    if (!day) lights.push({ pos: [x - s * 0.5, 2.4, z - 0.8], color: WARM, intensity: near[0], radius: near[1], kind: 'lantern', halo: 0, priority: 7 });
  }
}

// ---------------------------------------------------------------- the squares' landmarks (journal Passe VP6)

/** a competitor's pavilion: a round tent of striped canvas open toward the square, a scalloped valance, a conical roof, a finial and its
 *  pennant; its doorway lit from inside at night */
function pavilion(S: SlotSet, lights: PlazaBuild['lights'], day: boolean, x: number, z: number, yaw: number, r: number, colours: [V3, V3], emblem: EmblemKind): void {
  const C = S.get('cloth'), n = 16, wallH = 2.2, eave = 2.35, roofH = 4.4, night = (c: V3): V3 => (day ? c : [c[0] * 0.72, c[1] * 0.72, c[2] * 0.72]);
  S.at([x, 0, z], yaw, () => {
    const p = (a: number, rr: number, y: number): V3 => [Math.sin(a) * rr, y, Math.cos(a) * rr];
    for (let i = 0; i < n; i++) {
      // (at night the canvas a little darker, the doorway lit from inside: journal Passe VP7, iteration 5, « at night the tents glow ivory with
      // no light source »)
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2, t = night(i % 2 ? colours[0] : colours[1]);
      const out: V3 = [Math.sin(am), 0, Math.cos(am)];
      // the doorway: the two panels facing the local +z drawn back (the inside dark but for its lamp)
      if (Math.cos(am) < 0.93) {
        quadFacing(C, [p(a0, r, 0), p(a1, r, 0), p(a1, r, wallH), p(a0, r, wallH)], out, { tint: t, ao: [0.75, 0.75, 1, 1], swayArr: [0, 0, 0.1, 0.1] });
        // the canvas's inner face in the shade (journal Passe VP8, the audit: the doorway « a black slab standing in the tent »: the dark panel
        // that hid the open inside by day replaced by the inside itself)
        if (day) quadFacing(C, [p(a0, r - 0.02, 0), p(a1, r - 0.02, 0), p(a1, r - 0.02, wallH), p(a0, r - 0.02, wallH)], [-out[0], 0, -out[2]], { tint: [t[0] * 0.5, t[1] * 0.48, t[2] * 0.46], ao: [0.55, 0.55, 0.8, 0.8], swayArr: [0, 0, 0.1, 0.1] });
      } else if (!day) quadFacing(S.get('glow'), [p(a0, r * 0.2, 0), p(a1, r * 0.2, 0), p(a1, r * 0.2, wallH), p(a0, r * 0.2, wallH)], out, { tint: [0.6, 0.36, 0.14] });
      C.tri(p(a0, r + 0.22, eave), p(a1, r + 0.22, eave), [0, roofH, 0], { tint: t, ao: [0.85, 0.85, 1], swayArr: [0.06, 0.06, 0] });
      if (day) C.tri(p(a0, r + 0.2, eave - 0.02), p(a1, r + 0.2, eave - 0.02), [0, roofH - 0.02, 0], { tint: [t[0] * 0.42, t[1] * 0.4, t[2] * 0.38], ao: [0.6, 0.6, 0.85], swayArr: [0.06, 0.06, 0], flip: true });
      C.tri(p(a0, r + 0.22, eave), p(am, r + 0.24, eave - 0.36), p(a1, r + 0.22, eave), { tint: night(i % 2 ? colours[1] : colours[0]), swayArr: [0.1, 0.4, 0.1] });
    }
    // journal Passe VP8 (the audit: « The front wall is simply missing for about two facets: no flaps or door frame », « No guy ropes,
    // stakes »): the door's two flaps tied back against the wall, four guy ropes to their stakes on the side away from the square
    for (const e of [-Math.PI / 8, Math.PI / 8]) {
      const s = Math.sign(e), top = p(e, r + 0.01, wallH), foot = p(e, r + 0.01, 0.05), tie = p(e + s * 0.34, r + 0.16, 0.95);
      for (const flip of [false, true]) C.tri(top, foot, tie, { tint: night(s > 0 ? colours[1] : colours[0]), flip, swayArr: [0, 0, 0.2] });
    }
    for (const a of [-2.3, -2.75, 2.3, 2.75]) {
      const peg = p(a, r + 1.25, 0.02);
      S.get('cloth').sweep([p(a, r + 0.22, eave), peg], 0.013, 4, { tint: [0.46, 0.4, 0.33] });
      S.get('timber').boxMM(peg[0] - 0.035, 0, peg[2] - 0.035, peg[0] + 0.035, 0.22, peg[2] + 0.035, { tint: [0.44, 0.36, 0.28] });
    }
    // the floor rug inside, the pole, the finial and its pennant
    S.get('cloth').cylinder(r * 0.92, 0.01, 0.03, n, { tint: [0.42, 0.3, 0.24], capTop: true });
    S.get('timber').cylinder(0.06, 0, roofH + 1.25, 6, { tint: [0.46, 0.38, 0.3], capTop: true });
    S.get('metal').box(0, roofH + 1.28, 0, 0.14, 0.14, 0.14, { tint: [1.2, 1.0, 0.6] });
    addBanner(S, { pos: [0.05, roofH + 1.15, 0], yaw: Math.PI / 2, w: 0.46, h: 1.25, emblem, shape: 'pennant', loose: 0.85, rod: false, tint: [0.95, 0.9, 0.75] });
  });
  // (its lamp's light given to the gate's torches since journal Passe VP7, iteration 6: the doorway glows, the light plan's ambient)
  void lights;
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
        // (the slivers skipped: the edge's broken line of flags « fade[s] into the cobbles naturally », the first critique of journal Passe VP8;
        // [KO] the half flags kept and a kerb along both edges, the audit's « a staircase of whole flags with no kerb »: « a ruler-edged
        // rectangle that reads like a rug »)
        if (u1 - u0 < 0.2) continue;
        const v0 = r / rows, v1 = (r + 1) / rows, k = 0.9 + rng.range(-0.06, 0.06);
        S.at([ax, 0, az], yaw, () => St.boxMM((u0 - 0.5) * w + 0.03, 0, v0 * len + 0.03, (u1 - 0.5) * w - 0.03, 0.035, v1 * len - 0.03, { tint: [tint[0] * k, tint[1] * k, tint[2] * k], uvScale: 0.7 }));
      }
    }
  }
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
    // (in the stone's grain: [KO] in the plaster's, journal Passe VP8, after the audit's close view (« thick and black, so they read as a wire
    // grid »), the first critique of the frames: « untextured white and looks like a placeholder; at night it glows like a lamp »)
    St.lathe([[0.72, 0.4], [0.7, 0.62], [0.46, 0.78], [0.38, 1.5], [0.5, 1.62], [1.15, 1.78], [1.25, 1.92], [1.2, 2.02], [0.32, 2.06], [0.26, 2.9], [0.66, 3.05], [0.7, 3.16], [0.18, 3.2], [0.15, 3.62], [0.3, 3.78], [0.22, 4.0], [0.01, 4.12]], 12, { tint: [0.8, 0.76, 0.7] });
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; St.box(Math.cos(a) * 2.28, 0.72, Math.sin(a) * 2.28, 0.26, 0.16, 0.26, { tint: [0.86, 0.82, 0.76] }); }
  }));
}
/** the fountain's water: a glossy surface in the basin and the bowl, the spout's jet and four streams falling from the bowl's lip */
function fountainWater(S: SlotSet, x: number, z: number): void {
  const M = S.get('metal'), water: V3 = [0.34, 0.5, 0.62];
  S.at([x, 0, z], Math.PI / 8, () => {
    const oct = (r: number): Array<[number, number]> => Array.from({ length: 8 }, (_, i) => [Math.cos((i / 8) * Math.PI * 2) * r, Math.sin((i / 8) * Math.PI * 2) * r]);
    void M; void water; void oct;
    // the foam where the falling water meets the basin, and the jet (the water itself: the canal's material, buildPlaza)
    // (thinner and greyer, twelfth critique: « a flat white band that looks like plastic »)
    S.get('plaster').sweep(Array.from({ length: 17 }, (_, i) => { const a = (i / 16) * Math.PI * 2; return [Math.cos(a) * 1.3, 0.48, Math.sin(a) * 1.3] as V3; }), 0.035, 4, { tint: [0.72, 0.76, 0.8] });
    S.get('plaster').cylinder(0.05, 4.1, 4.55, 6, { tint: [1.15, 1.2, 1.3], r1: 0.02 });
    // (the water falling from the bowls' lips, the audit's « The fountain is dry », is the particles' spray since journal Passe VP8: eighteen
    // solid streams of 3 cm, then ten of 1.8 cm, read as « a white cage » / wires round the bowls)
  });
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


/** an archery butt: a straw boss on a timber A-frame, its painted face toward the square */
function archeryButt(S: SlotSet, x: number, z: number, yaw: number): void {
  S.at([x, 0, z], yaw, () => {
    const T = S.get('timber'), C = S.get('cloth');
    // (journal Passe VP8, the audit: « Thin painted discs on single bare posts: no straw boss thickness, no easel »: three legs, a ledge, a
    // boss 40 cm thick bound by two cords)
    for (const s of [-1, 1]) S.with(mat([s * 0.55, 0, -0.35], 0, 1, -0.2), () => T.boxMM(-0.05, 0, -0.05, 0.05, 1.9, 0.05, { tint: [0.46, 0.37, 0.3], grain: 'y' }));
    S.with(mat([0, 0, -1.05], 0, 1, 0.42), () => T.boxMM(-0.045, 0, -0.045, 0.045, 1.75, 0.045, { tint: [0.44, 0.35, 0.28], grain: 'y' }));
    T.boxMM(-0.66, 0.5, -0.5, 0.66, 0.58, -0.3, { tint: [0.46, 0.37, 0.3], grain: 'x' });
    S.at([0, 1.15, 0], 0, () => {
      S.with(mat([0, 0, 0], 0, 1, Math.PI / 2 - 0.2), () => {
        C.cylinder(0.62, -0.28, 0.12, 14, { tint: [0.7, 0.6, 0.38], capTop: true, capBottom: true });
        for (const yy of [-0.2, -0.04]) S.get('dark').cylinder(0.625, yy, yy + 0.035, 14, { tint: [0.3, 0.25, 0.2] });
        const ring = (r: number, y: number, t: V3) => C.cylinder(r, y, y + 0.006, 14, { tint: t, capTop: true });
        ring(0.58, 0.12, [0.88, 0.85, 0.78]); ring(0.44, 0.126, [0.26, 0.32, 0.62]); ring(0.3, 0.132, [0.86, 0.82, 0.72]); ring(0.16, 0.138, [0.9, 0.72, 0.3]);
      });
    });
  });
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
    // the stage's painted backdrop, its curtains drawn aside and two puppets on the ledge (journal Passe VP8, the audit: « The stage opening is
    // a flat black void: no curtain, no puppets, no painted backdrop »)
    S.get('plaster').quad([-w / 2, 1.55, -d * 0.8], [w / 2, 1.55, -d * 0.8], [w / 2, 2.35, -d * 0.8], [-w / 2, 2.35, -d * 0.8], { tint: [0.46, 0.6, 0.82] });
    S.get('plaster').quad([-w / 2, 1.55, -d * 0.79], [w / 2, 1.55, -d * 0.79], [w / 2, 1.82, -d * 0.79], [-w / 2, 1.82, -d * 0.79], { tint: [0.78, 0.7, 0.5] });
    S.get('plaster').tri([-0.3, 1.82, -d * 0.785], [0.5, 1.82, -d * 0.785], [0.1, 2.08, -d * 0.785], { tint: [0.7, 0.62, 0.44] });
    for (const sd of [-1, 1]) C.quad([sd * w / 2, 1.55, -0.02], [sd * (w / 2 - 0.34), 1.55, -0.02], [sd * (w / 2 - 0.22), 2.35, -0.02], [sd * w / 2, 2.35, -0.02], { tint: [0.24, 0.3, 0.64], flip: sd > 0, swayArr: [0.1, 0.1, 0, 0] });
    for (const [px, body] of [[-0.35, [0.3, 0.38, 0.7]], [0.4, [0.7, 0.32, 0.24]]] as Array<[number, V3]>) {
      C.boxMM(px - 0.07, 1.58, -0.25, px + 0.07, 1.78, -0.15, { tint: body });
      S.get('plaster').box(px, 1.84, -0.2, 0.1, 0.1, 0.1, { tint: [0.9, 0.78, 0.66] });
    }
    // a little roof over the painted board, in the booth's colours
    for (const sd of [-1, 1]) C.quad([-w / 2 - 0.15, h + 0.45, sd * 0.02 + (sd > 0 ? 0.25 : -d - 0.05)], [w / 2 + 0.15, h + 0.45, sd * 0.02 + (sd > 0 ? 0.25 : -d - 0.05)], [w / 2 + 0.15, h + 0.8, -d / 2], [-w / 2 - 0.15, h + 0.8, -d / 2], { tint: sd > 0 ? [0.26, 0.34, 0.68] : [0.86, 0.8, 0.66], flip: sd < 0 });
    S.get('planks').boxMM(-w / 2, 1.52, -0.4, w / 2, 1.58, 0.06, { tint: [0.6, 0.48, 0.36], grain: 'x' });
    S.get('planks').boxMM(-w / 2 - 0.1, h, -0.05, w / 2 + 0.1, h + 0.45, 0.04, { tint: [0.84, 0.76, 0.5], grain: 'x' });
    for (let i = 0; i < 8; i++) { const x0 = -w / 2 + (w * i) / 8, x1 = x0 + w / 8; C.tri([x0, 2.35, 0.02], [x1, 2.35, 0.02], [(x0 + x1) / 2, 2.12, 0.03], { tint: [0.86, 0.68, 0.3], swayArr: [0.1, 0.1, 0.4] }); }
  });
}

/** the champions' platform of the training ground: a raised timber deck on posts, steps on the square's side, corner posts with ropes on three
 *  sides and the tournament's pennants, a rack of practice blades and a brazier beside it (lit day and night, as the arena's) */
function sparringDais(S: SlotSet, batch: InstanceBatch, lights: PlazaBuild['lights'], emitters: Emitter[], day: boolean, x: number, z: number, yaw = 0): void {
  // (ninth critique: « restage around the ring: raise it and enlarge it about 1.5 times »)
  // (turned by `yaw` since journal Passe VP9: the lists' ring has its steps toward the east, the camera's side)
  const hw = 2.9, y = 1.0, at = (px: number, pz: number): V3 => xf([px, 0, pz], [x, 0, z], yaw);
  S.at([x, 0, z], yaw, () => {
    const P = S.get('planks'), T = S.get('timber');
    P.boxMM(-hw, y - 0.1, -hw, hw, y, hw, { grain: 'x', tint: [0.64, 0.52, 0.4] });
    // the boards scuffed dark toward the middle, a ring chalked on them (seventh critique: a canvas with ropes « reads as a modern boxing ring »,
    // the brightest plane in every frame)
    P.boxMM(-hw + 0.6, y, -hw + 0.6, hw - 0.6, y + 0.006, hw - 0.6, { grain: 'x', tint: [0.5, 0.4, 0.31] });
    for (let i = 0; i < 24; i++) {
      const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 1) / 24) * Math.PI * 2, r0 = 1.25, r1 = 1.33, yy = y + 0.01;
      quadFacing(S.get('plaster'), [[Math.cos(a0) * r0, yy, Math.sin(a0) * r0], [Math.cos(a1) * r0, yy, Math.sin(a1) * r0], [Math.cos(a1) * r1, yy, Math.sin(a1) * r1], [Math.cos(a0) * r1, yy, Math.sin(a0) * r1]], [0, 1, 0], { tint: day ? [0.62, 0.6, 0.56] : [0.4, 0.39, 0.37] });
    }
    T.boxMM(-hw - 0.08, 0, -hw - 0.08, hw + 0.08, y - 0.1, hw + 0.08, { tint: [0.42, 0.34, 0.27] });
    // (each step a block down to the ground: journal Passe VP7, iteration 5, « the ring's skirt has a black hole at the stair »)
    for (let k = 0; k < 4; k++) P.boxMM(-1.0, 0, hw + 0.08 + 0.3 * (3 - k), 1.0, 0.25 * (k + 1), hw + 0.38 + 0.3 * (3 - k), { grain: 'x', tint: [0.6, 0.48, 0.38] });
    const posts: Array<[number, number]> = [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]];
    for (const [a, b] of posts) T.boxMM(a - 0.09, 0, b - 0.09, a + 0.09, y + 1.9, b + 0.09, { tint: [0.46, 0.37, 0.3], grain: 'y' });
    // (iteration 9's timber railing lost the ring to the eighth critique, « no ropes or posts, it does not read as a fighting ring »; the
    // seventh had read ropes on a white canvas as a boxing ring: the ropes on the darkened boards)
    // ropes of hemp, thin and sagging (fifth critique: « thick, bright lines that float »)
    // (drawn taut since journal Passe VP8, 6 cm of sag: « The front ropes leave the corner posts in S-curves across the deck and disappear
    // mid-span »; the front ones end at two posts by the stair's opening)
    const rope = (a: [number, number], b: [number, number], h: number) => S.get('cloth').sweep(Array.from({ length: 9 }, (_, i) => { const t = i / 8; return [a[0] + (b[0] - a[0]) * t, y + h - 0.06 * Math.sin(t * Math.PI), a[1] + (b[1] - a[1]) * t] as V3; }), 0.014, 4, { tint: [0.5, 0.42, 0.3] });
    for (const s of [-1, 1]) { T.boxMM(s * (hw - 1.2) - 0.07, y - 0.1, hw - 0.07, s * (hw - 1.2) + 0.07, y + 1.32, hw + 0.07, { tint: [0.46, 0.37, 0.3], grain: 'y' }); S.get('metal').box(s * (hw - 1.2), y + 1.36, hw, 0.13, 0.08, 0.13, { tint: [1.0, 0.85, 0.5] }); }
    // the stair's stringers, stepped with its treads, closing its sides against the skirt (« jagged staircases »)
    for (let k = 0; k < 4; k++) for (const s of [-1, 1]) P.boxMM(s > 0 ? 1.0 : -1.08, 0, hw + 0.08 + 0.3 * (3 - k), s > 0 ? 1.08 : -1.0, 0.25 * (k + 1) + 0.03, hw + 0.38 + 0.3 * (3 - k), { grain: 'y', tint: [0.46, 0.36, 0.28] });
    for (const h of [0.6, 1.15]) { rope(posts[0], posts[1], h); rope(posts[1], posts[2], h); rope(posts[3], posts[0], h); rope(posts[2], [hw - 1.2, hw], h); rope(posts[3], [-hw + 1.2, hw], h); }
    // the posts capped, the deck's sides hung with the tournament's striped cloth
    for (const [a, b] of posts) S.get('metal').box(a, y + 1.95, b, 0.16, 0.1, 0.16, { tint: [1.0, 0.85, 0.5] });
    for (let i = 0; i < 16; i++) {
      const t0 = i / 16, t1 = (i + 1) / 16, tint: V3 = i % 2 ? [0.3, 0.37, 0.68] : [0.84, 0.8, 0.7];
      for (const [ax, az, bx, bz] of [[-hw - 0.1, hw + 0.1, hw + 0.1, hw + 0.1], [hw + 0.1, hw + 0.1, hw + 0.1, -hw - 0.1], [-hw - 0.1, -hw - 0.1, -hw - 0.1, hw + 0.1]] as Array<[number, number, number, number]>) {
        const p0: V3 = [ax + (bx - ax) * t0, y - 0.08, az + (bz - az) * t0], p1: V3 = [ax + (bx - ax) * t1, y - 0.08, az + (bz - az) * t1];
        if (az === hw + 0.1 && bz === hw + 0.1 && Math.abs(p0[0]) < 1.1) continue;  // (behind the steps: the planked riser below)
        S.get('cloth').quad(p0, p1, [p1[0], 0.06, p1[2]], [p0[0], 0.06, p0[2]], { tint, swayArr: [0, 0, 0.12, 0.12] });
      }
    }
    // the riser behind the steps, in the boards' timber (journal Passe VP7, iteration 3: « under the stage there is a black gap »)
    P.boxMM(-1.15, 0.06, hw + 0.02, 1.15, y - 0.1, hw + 0.1, { grain: 'x', tint: [0.5, 0.4, 0.31] });
    for (const [i, [a, b]] of posts.entries()) addBanner(S, { pos: [a + 0.08, y + 1.85, b], yaw: Math.PI / 2, w: 0.42, h: 1.0, emblem: i % 2 ? 'laurel' : 'swords', shape: 'pennant', loose: 0.8, rod: false, tint: i % 2 ? [0.95, 0.88, 0.62] : [0.5, 0.6, 0.95] });
  });
  // a lantern hung on each corner post's crown, lit at night (sixth critique), the canvas worn by the feet
  for (const [a, b] of [[-hw, -hw], [hw, -hw], [hw, hw], [-hw, hw]] as Array<[number, number]>) { const p = at(a * 1.07, b * 1.07); batch.add(day ? 'lanternDark' : 'lantern', { pos: [p[0], y + 1.55, p[2]], yaw: Math.atan2(a, b) + yaw }, 0); }
  if (!day) lights.push({ pos: [x, y + 1.7, z], color: WARM, intensity: 4.4, radius: 9, kind: 'lantern', halo: 0.8, priority: 8, key: true });
  // a brazier at each front corner, lit day and night (eleventh critique: « light the ring with braziers or torches at its corners »)
  for (const sx of [-1, 1]) {
    // (1.2 m off the corners since journal Passe VP8: « Braziers sit on the ring's front corners, overlapping the skirt and corner posts »)
    const [bx, , bz] = at(sx * (hw + 1.2), hw + 1.0);
    S.at([bx, 0, bz], 0, () => S.get('metal').cylinder(0.3, 1.0, 1.24, 8, { tint: [0.35, 0.33, 0.32], capBottom: true, r1: 0.4 }));
    S.at([bx, 0, bz], 0, () => S.get('metal').cylinder(0.3, 0, 0.34, 8, { tint: [0.3, 0.29, 0.28], r1: 0.08 }));
    S.get('metal').box(bx, 0.5, bz, 0.11, 1.0, 0.11);
    if (day) S.get('dark').box(bx, 1.28, bz, 0.4, 0.16, 0.4, { tint: ASH }); else S.get('glow').box(bx, 1.28, bz, 0.4, 0.16, 0.4, { tint: [1, 0.55, 0.2], uvs: COAL_UV, aux: [0, 1, 0.4, 0] });
    if (!day) flameAt(S, day, bx, 1.35, bz, 0.5);
    emitters.push(...fireEmitters(bx, 1.36, bz));
    // (at night only since journal Passe VP8: by day the pool on the sand read « as blood »)
    lights.push({ pos: [bx, 1.7, bz], color: FIRE, intensity: 3.2, radius: 7, kind: 'fire', halo: 0.9, priority: 9, key: true });
  }
  { const r = at(hw + 0.55, 0.6); weaponRack(S, r[0], r[2], Math.PI / 2 + yaw); }
  // (the third brazier behind the ring's west corner left with journal Passe VP7: the two before its steps are its key light)
  void batch; void day;
}

// ---------------------------------------------------------------- the lists at the rampart's foot (journal Passe VP9)

/** the lists' plan (journal Passe VP9, the operator's choice « Lices au pied du rempart »; « proposé »): the cité's rampart along the north,
 *  its inner face toward the yard (z), its wall-walk (y), from x0 to x1; the corner tower at the west end and the one nearer the camera (x, z,
 *  radius, the drum's height, the roof's apex); the stair rising west along the wall from its foot to the wall-walk by the corner tower; the
 *  spectators' gallery closing the west end over the stables (its front's x, from z0 to z1, its depth, its floor, eave and ridge) and the
 *  passage under it, the way to the forecourt (zn..zs); metres */
const LISTS = {
  zIn: -10, zOut: -13.2, walkY: 7.8, x0: -27, x1: 44,
  t1: { x: -18.6, z: -11.6, r: 4.0, h: 11.6, roof: 16.8 },
  t2: { x: 5.0, z: -11.4, r: 3.4, h: 10.8, roof: 15.4 },
  stair: { top: -14.2, foot: -4.8, w: 2.0 },
  gallery: { x: -16.2, z0: -6.4, z1: 9.6, d: 4.2, floor: 3.0, eave: 6.0, ridge: 8.2 },
  pass: { zn: -1.2, zs: 3.2 },
};
/** the rampart's torches along its inner face (x); the three nearest the yard's middle cast a light at night (journal Passe VP9) */
const TORCHES = [-10.6, -1.2, 11.6, 23.0], LIT_TORCHES = [-10.6, -1.2, 11.6];
/** the rampart's face and its towers' drums: ashlar, each block its own geometry and its own shade, a little proud of its mortar (`ashlarBand`,
 *  `ashlarRing`) (journal Passe VP9: the stone texture over the whole face, « a grid of identical oversized grey blocks with heavy black grout »
 *  at 0.4 x, « one uniformly tiled brick texture over half the frame » at its own scale, the first and the second critiques; [KO] a render
 *  between stone pilasters, « huge pale grey-white surfaces with thin crack lines and almost no masonry, overexposed by day [...] at night
 *  they stay bright lavender », the third; [KO] the render in the stone's tint, a cream wall off the cool palette) */
const WALL_FACE: Slot = 'plaster', WALL_UV = 0.6;
/** the rampart's stone by day and at night (the forecourt's cool grey, a step warmer: the wall faces the sun); its ashlar's face and mortar */
const wallStone = (day: boolean): { stone: V3; light: V3; dark: V3; face: V3; mortar: V3 } => {
  // (at night as dark as the forecourt's facade, the third critique: « bright lavender », the moon a quarter stronger on the lists)
  // (the face by day below the forecourt's stucco: the wall faces the sun, « overexposed by day »; its mortar a step under the stones, not black)
  const k = day ? 0.8 : 0.72, f = day ? 0.47 : 0.44, m = day ? 0.56 : 0.4;
  return { stone: [0.64 * k, 0.62 * k, 0.6 * k], light: [0.72 * k, 0.7 * k, 0.66 * k], dark: [0.5 * k, 0.49 * k, 0.48 * k], face: [f, f * 0.99, f * 1.04], mortar: [m, m * 0.98, m * 1.0] };
};
/** the ashlar's courses (m): a course 0.36-0.5 high, a block 0.6-1.25 long (the fourth critique of journal Passe VP9: at 0.48-0.66 by
 *  0.8-1.7, « oversized cinder-block bricks ») */
const ASHLAR = { h0: 0.36, dh: 0.14, w0: 0.6, dw: 0.65 };
/** an ashlar band on a face toward +z, from y0 to y1, between a and b: its courses and its joints laid from the wall's start `xs` (to `xe`), so
 *  that the stretches meet without a seam (a block belongs to the stretch it starts in); each block 0.035 m proud of the mortar behind it, its
 *  own shade (a few warmer, a few cooler), its own patch of the texture, darker toward the yard's grime */
function ashlarBand(B: MeshBuilder, xs: number, xe: number, a: number, b: number, y0: number, y1: number, z: number, tint: V3, seed: number): void {
  const J = 0.018, R = 0.03;
  for (let y = y0, row = 0; y < y1 - 0.05; row++) {
    let h = ASHLAR.h0 + ASHLAR.dh * hash1(row * 7.31 + seed);
    if (y1 - (y + h) < 0.24) h = y1 - y;
    const ya = y + J, yb = y + h - J, ao = 0.62 + 0.38 * smoothstep(0.5, 4.5, y + h / 2);
    for (let x = xs - 1.1 * hash1(row * 3.7 + seed + 1), k = 0; x < Math.min(b, xe); k++) {
      const w = ASHLAR.w0 + ASHLAR.dw * hash1(row * 31.7 + k * 3.31 + seed), x0 = Math.max(x, xs), x1 = Math.min(x + w, xe);
      if (x0 >= a && x0 < b && x1 - x0 > 0.1) {
        const hb = hash1(row * 13.1 + k * 7.7 + seed * 0.37), hw = hash1(row * 5.3 + k * 11.9 + seed) - 0.5, v = 0.86 + 0.26 * hb;
        B.boxMM(x0 + J, ya, z, x1 - J, yb, z + R, { tint: [tint[0] * v * (1 + 0.08 * hw), tint[1] * v, tint[2] * v * (1 - 0.08 * hw)], ao, uvScale: 0.9, uvOff: [hb * 7.3, hw * 5.1], skip: ['-z', '-y'] });
      }
      x += w;
    }
    y += h;
  }
}
/** an ashlar band round a drum of radius r (local to the tower), from y0 to y1: the same courses, each block a few flat facets of the circle */
function ashlarRing(B: MeshBuilder, r: number, y0: number, y1: number, tint: V3, seed: number): void {
  const J = 0.018, R = r + 0.03, C = Math.PI * 2 * r;
  for (let y = y0, row = 0; y < y1 - 0.05; row++) {
    let h = ASHLAR.h0 + ASHLAR.dh * hash1(row * 7.31 + seed);
    if (y1 - (y + h) < 0.24) h = y1 - y;
    const ya = y + J, yb = y + h - J, ao = 0.62 + 0.38 * smoothstep(0.5, 4.5, y + h / 2);
    const s0 = 1.1 * hash1(row * 3.7 + seed + 1);
    for (let s = s0, k = 0; s < s0 + C - 0.4; k++) {
      let w = ASHLAR.w0 + ASHLAR.dw * hash1(row * 31.7 + k * 3.31 + seed);
      if (s0 + C - (s + w) < 0.45) w = s0 + C - s;
      const hb = hash1(row * 13.1 + k * 7.7 + seed * 0.37), hw = hash1(row * 5.3 + k * 11.9 + seed) - 0.5, v = 0.86 + 0.26 * hb;
      const t: V3 = [tint[0] * v * (1 + 0.08 * hw), tint[1] * v, tint[2] * v * (1 - 0.08 * hw)], m = Math.max(1, Math.round(w / 0.3));
      for (let f = 0; f < m; f++) {
        const sa = s + J + ((w - 2 * J) * f) / m, sb = s + J + ((w - 2 * J) * (f + 1)) / m, a0 = sa / r, a1 = sb / r, am = (a0 + a1) / 2;
        const P = (aa: number, yy: number): V3 => [Math.cos(aa) * R, yy, Math.sin(aa) * R];
        quadFacing(B, [P(a0, ya), P(a1, ya), P(a1, yb), P(a0, yb)], [Math.cos(am), 0, Math.sin(am)], { tint: t, ao, uvs: [sa * 0.9 + hb * 7.3, ya * 0.9, sb * 0.9 + hb * 7.3, ya * 0.9, sb * 0.9 + hb * 7.3, yb * 0.9, sa * 0.9 + hb * 7.3, yb * 0.9] });
      }
      s += w;
    }
    y += h;
  }
}
/** the rampart's dressed stone (its plinth, courses, frames, corbels, parapets, merlons, stair) in the ashlar's own material, its tints for it
 *  (the fourth critique of journal Passe VP9: « a second, darker striped stone that doesn't match »: the stone texture's courses beside the
 *  ashlar's blocks); the mortar behind the blocks stays in the stone's */
const wallTrim = (day: boolean): { stone: V3; light: V3; dark: V3; face: V3; mortar: V3 } => {
  const w = wallStone(day), k = 0.74, f = (v: V3): V3 => [v[0] * k, v[1] * k, v[2] * k];
  return { stone: f(w.stone), light: f(w.light), dark: f(w.dark), face: w.face, mortar: w.mortar };
};
/** a hash in 0..1 (the stones' tints, the slits' places) */
const hash1 = (n: number) => Math.abs(Math.sin(n * 12.9898) * 43758.5453) % 1;

/** The rampart (journal Passe VP9): the cité's wall along the lists' north side, seen from inside: its inner face rendered between stone
 *  pilasters over a battered plinth, loopholes in their stone frames, buttresses, a string course, putlog holes, a corbel table carrying the
 *  wall-walk's low inner parapet, the outer parapet's merlons against the sky, iron torch brackets; each stretch of 4-5 m two parts (its face,
 *  its crown), its stone a little off its neighbours' */
function rampart(S: SlotSet, tracked: (fn: () => void) => void, day: boolean, rng: Rng): void {
  const L = LISTS, St = S.get(WALL_FACE), Sm = S.get('stone'), Dk = S.get('dark'), M = S.get('metal'), { stone, light, dark, face, mortar } = wallTrim(day);
  // the tournament's long banners hung from the wall-walk's parapet over the yard
  for (const [x, emblem, tint] of [[-2.8, 'helm', BLUE_T], [12.6, 'swords', GOLD_T], [17.6, 'laurel', BLUE_T]] as Array<[number, EmblemKind, V3]>) {
    tracked(() => addBanner(S, { pos: [x, L.walkY + 0.8, L.zIn + 0.36], yaw: 0, w: 1.3, h: 4.3, emblem, shape: 'swallow', loose: 0.3, rod: true, tint }));
  }
  const n = Math.round((L.x1 - L.x0) / 4.4), W = L.walkY, zi = L.zIn, zo = L.zOut;
  const open: [number, number] = [L.stair.top - 0.5, L.stair.top + 1.1];
  for (let i = 0; i < n; i++) {
    const a = L.x0 + ((L.x1 - L.x0) * i) / n, b = L.x0 + ((L.x1 - L.x0) * (i + 1)) / n, h = hash1(i + 3);
    const tint: V3 = [stone[0] * (0.95 + 0.1 * h), stone[1] * (0.95 + 0.1 * h), stone[2] * (0.95 + 0.09 * h)];
    tracked(() => {
      // the wall-walk's deck; the inner face in ashlar over its mortar, in two bands either side of the string course (darker toward its foot:
      // the grime of the yard, « no darkening at the base », the second critique)
      S.get(WALL_FACE).boxMM(a, 1.4, zo + 0.5, b, W, zi, { tint: face, uvScale: WALL_UV, skip: ['-y', '-z', '+x', '-x', '+z'] });
      quadFacing(Sm, [[a, 1.4, zi], [b, 1.4, zi], [b, W, zi], [a, W, zi]], [0, 0, 1], { tint: mortar, uvScale: 1.0 });
      ashlarBand(S.get(WALL_FACE), L.x0, L.x1, a, b, 1.6, 4.2, zi, face, 11);
      ashlarBand(S.get(WALL_FACE), L.x0, L.x1, a, b, 4.4, W - 0.42, zi, face, 23);
      // a loophole in the stretch's middle in its stone frame, its slit set back (the third critique: « black slit windows that look like stickers »)
      {
        const xm = (a + b) / 2;
        St.boxMM(xm - 0.3, 4.7, zi, xm + 0.3, 6.2, zi + 0.1, { tint: light, skip: ['-z'] });
        Dk.boxMM(xm - 0.08, 4.85, zi + 0.1, xm + 0.08, 6.05, zi + 0.104, { tint: [0.1, 0.1, 0.12] });
        for (const sx of [-1, 1]) quadFacing(St, [[xm + sx * 0.08, 4.85, zi + 0.1], [xm + sx * 0.16, 4.85, zi + 0.1], [xm + sx * 0.16, 6.05, zi + 0.1], [xm + sx * 0.08, 6.05, zi + 0.1]], [0, 0, 1], { tint: dark, ao: 0.7 });
      }
      // the battered plinth (0.55 m out at its foot) and its top course
      quadFacing(St, [[a, 0, zi + 0.55], [b, 0, zi + 0.55], [b, 1.4, zi], [a, 1.4, zi]], [0, 0.37, 0.93], { tint: dark, uvScale: 1.0, ao: [0.6, 0.6, 0.9, 0.9] });
      St.boxMM(a, 1.4, zi, b, 1.6, zi + 0.12, { tint: light, skip: ['-z', '-y', '+x', '-x'] });
      // the string course
      St.boxMM(a, 4.2, zi, b, 4.4, zi + 0.13, { tint: light, skip: ['-z', '+x', '-x'] });
      // a buttress at every other stretch's start, its top weathered back to the face
      if (i % 2 === 0 && i > 0) {
        St.boxMM(a - 0.45, 0, zi, a + 0.45, 3.6, zi + 0.6, { tint: light, uvScale: 1.0, aoY: [0.7, 1], skip: ['-z'] });
        quadFacing(St, [[a - 0.45, 3.6, zi + 0.6], [a + 0.45, 3.6, zi + 0.6], [a + 0.45, 4.2, zi], [a - 0.45, 4.2, zi]], [0, 0.7, 0.7], { tint: light });
        for (const s of [-1, 1]) St.tri([a + s * 0.45, 3.6, zi + 0.6], [a + s * 0.45, 4.2, zi], [a + s * 0.45, 3.6, zi], { tint: light, flip: s < 0 });
      }
      // the iron torch brackets (`TORCHES`; their flames at night)
      for (const x of TORCHES) if (x >= a && x < b) {
        M.boxMM(x - 0.03, 3.0, zi, x + 0.03, 3.06, zi + 0.42, { tint: [0.24, 0.23, 0.24] });
        M.boxMM(x - 0.05, 3.06, zi + 0.36, x + 0.05, 3.5, zi + 0.46, { tint: [0.26, 0.24, 0.24] });
        if (!day) flameAt(S, day, x, 3.52, zi + 0.41, 0.36);
      }
    });
    // its crown, a part of its own (the face hidden behind the gallery or the towers, the crown over them)
    tracked(() => {
      // the corbel table: a band 0.32 m out on corbels every 1.15 m
      St.boxMM(a, W - 0.42, zi, b, W, zi + 0.32, { tint: light, skip: ['-z', '+x', '-x'] });
      for (let x = Math.ceil(a / 1.15) * 1.15; x < b - 0.1; x += 1.15) {
        St.boxMM(x - 0.16, W - 1.05, zi, x + 0.16, W - 0.42, zi + 0.2, { tint: stone, skip: ['-z'] });
        St.boxMM(x - 0.16, W - 0.72, zi + 0.2, x + 0.16, W - 0.42, zi + 0.3, { tint: stone, skip: ['-z'] });
      }
      // the inner parapet over the band (open where the stair arrives) and its coping
      for (const [p0, p1] of a < open[1] && b > open[0] ? [[a, open[0]], [open[1], b]] : [[a, b]]) {
        if (p1 - p0 < 0.05) continue;
        St.boxMM(p0, W, zi - 0.06, p1, W + 0.82, zi + 0.3, { tint, uvScale: 1.0, skip: ['-y'] });
        St.boxMM(p0, W + 0.82, zi - 0.1, p1, W + 0.92, zi + 0.34, { tint: light });
      }
      // the outer parapet and its merlons (their crenels on a grid along the whole wall)
      St.boxMM(a, W, zo, b, W + 1.15, zo + 0.5, { tint, uvScale: 1.0, skip: ['-y', '-z', '+x', '-x'] });
      for (let m = Math.ceil(a / 2.1); m * 2.1 < b; m++) {
        const x = m * 2.1;
        if (x - 0.62 < a - 0.01 || x + 0.62 > b + 0.01) continue;
        St.boxMM(x - 0.62, W + 1.15, zo, x + 0.62, W + 2.15, zo + 0.5, { tint, uvScale: 1.0, skip: ['-y', '-z'] });
        St.boxMM(x - 0.68, W + 2.15, zo - 0.04, x + 0.68, W + 2.25, zo + 0.54, { tint: light });
      }
    });
  }
}

/** a round tower of the rampart (journal Passe VP9): its drum rendered as the wall between stone courses, on a battered stone foot, arrow slits
 *  toward the yard, a corbelled ring under a bell-cast conical roof of the town's slate, a finial and the tournament's pennant; a door at its
 *  foot toward the yard; its foot, its drum, its ring and its roof each a part */
function roundTower(S: SlotSet, tracked: (fn: () => void) => void, batch: InstanceBatch, day: boolean, t: { x: number; z: number; r: number; h: number; roof: number }, emblem: EmblemKind, door: boolean): void {
  // (44 sides since the fourth critique of journal Passe VP9: « the base of the tower shows faceting »)
  const St = S.get(WALL_FACE), Sm = S.get('stone'), Dk = S.get('dark'), n = 44, { stone, light, dark, face, mortar } = wallTrim(day);
  // (its foot a part of its own: behind the gallery or the yard's things, the drum over them)
  tracked(() => S.at([t.x, 0, t.z], 0, () => St.lathe([[t.r + 0.55, 0], [t.r, 1.7]], n, { tint: dark, uvTile: 1.0, aoY: [0.6, 0.9] })));
  tracked(() => S.at([t.x, 0, t.z], 0, () => {
    // the drum in ashlar over its mortar, either side of its middle course
    Sm.lathe([[t.r, 1.7], [t.r, t.h - 0.6]], n, { tint: mortar, uvTile: 1.0 });
    ashlarRing(S.get(WALL_FACE), t.r, 1.92, t.h * 0.52, face, 31 + t.x);
    ashlarRing(S.get(WALL_FACE), t.r, t.h * 0.52 + 0.22, t.h - 0.6, face, 47 + t.x);
    for (const y of [1.7, t.h * 0.52]) St.lathe([[t.r, y], [t.r + 0.13, y], [t.r + 0.13, y + 0.22], [t.r, y + 0.22]], n, { tint: light });
    // the arrow slits on the yard's half (z > 0), one tier in three a little turned, each in its stone frame
    for (const [k, y] of [[0, 3.4], [1, t.h * 0.52 + 1.4], [2, t.h - 2.6]] as Array<[number, number]>) for (const a0 of [0.55, 1.57, 2.6]) {
      const a = a0 + (k - 1) * 0.35, c = Math.cos(a), s = Math.sin(a);
      S.at([c * (t.r + 0.03), y, s * (t.r + 0.03)], Math.atan2(c, s), () => {
        St.boxMM(-0.2, -0.14, 0, 0.2, 0.92, 0.06, { tint: light, skip: ['-z'] });
        Dk.boxMM(-0.07, 0, 0.06, 0.07, 0.78, 0.064, { tint: [0.1, 0.1, 0.12] });
        if (!day && k === 2 && a0 === 1.57) S.get('glow').boxMM(-0.06, 0.04, 0.064, 0.06, 0.74, 0.07, { tint: [0.9, 0.5, 0.2] });
      });
    }
    // the door toward the yard: its dark arched opening, its stone frame
    // (a square-headed door under a stone lintel, its boards shut, since the second critique of journal Passe VP9: the dark round head « a jagged
    // black hole that reads as a texture error »)
    if (door) S.at([0, 0, t.r - 0.06], 0, () => {
      for (const s of [-1, 1]) St.boxMM(s > 0 ? 0.62 : -0.9, 0, -0.1, s > 0 ? 0.9 : -0.62, 2.35, 0.2, { tint: light, uvScale: 1.0 });
      St.boxMM(-1.0, 2.35, -0.1, 1.0, 2.75, 0.24, { tint: light, uvScale: 1.0 });
      S.get('planks').boxMM(-0.62, 0, -0.06, 0.62, 2.35, 0.1, { tint: [0.4, 0.3, 0.22], grain: 'y' });
      for (const y of [0.45, 1.75]) S.get('metal').boxMM(-0.56, y, 0.1, 0.56, y + 0.07, 0.13, { tint: [0.22, 0.21, 0.22] });
      S.get('metal').box(0.38, 1.1, 0.13, 0.08, 0.08, 0.05, { tint: [0.5, 0.45, 0.35] });
      // over the door the cité's arms carved and painted in a stone panel (the fourth critique: « the round tower and curtain wall are a big
      // uniform block tiling [...] a dead surface in the middle of the frame »)
      St.boxMM(-0.78, 3.4, -0.04, 0.78, 5.5, 0.16, { tint: light, skip: ['-z'] });
      St.boxMM(-0.9, 5.5, -0.06, 0.9, 5.7, 0.22, { tint: light, skip: ['-z'] });
      const Bn = S.get('banner'), [u0, v0, u1, v1] = emblemRect('swords', 0.01), w = 1.1, hh = w * 1.25, yt = 5.32, zz = 0.165;
      const P5: Array<[number, number]> = [[-w / 2, yt], [w / 2, yt], [w / 2, yt - hh * 0.5], [0, yt - hh], [-w / 2, yt - hh * 0.5]], ctr: [number, number] = [0, yt - hh * 0.4];
      const uvOf = (px: number, py: number): [number, number] => [u0 + ((px + w / 2) / w) * (u1 - u0), v1 - ((yt - py) / hh) * (v1 - v0)];
      for (let i = 0; i < 5; i++) { const a = P5[i], b = P5[(i + 1) % 5]; Bn.tri([a[0], a[1], zz], [b[0], b[1], zz], [ctr[0], ctr[1], zz], { uvs: [...uvOf(a[0], a[1]), ...uvOf(b[0], b[1]), ...uvOf(ctr[0], ctr[1])], tint: day ? [1, 1, 1] : [0.7, 0.7, 0.75], ao: 1, aux: [0.1, 0, 0.5, 0], flip: true }); }
    });
  }));
  tracked(() => S.at([t.x, 0, t.z], 0, () => {
    // the corbelled ring: corbels under a course 0.45 m out, the drum's top over it
    for (let k = 0; k < n; k++) { const a = ((k + 0.5) / n) * Math.PI * 2; S.at([Math.cos(a) * (t.r + 0.18), t.h - 0.55, Math.sin(a) * (t.r + 0.18)], Math.atan2(Math.cos(a), Math.sin(a)), () => St.boxMM(-0.15, 0, -0.2, 0.15, 0.45, 0.2, { tint: stone })); }
    St.lathe([[t.r, t.h - 0.6], [t.r + 0.45, t.h - 0.12], [t.r + 0.45, t.h + 0.25], [t.r + 0.2, t.h + 0.32]], n, { tint: light });
  }));
  tracked(() => S.at([t.x, 0, t.z], 0, () => {
    const y0 = t.h + 0.2, r0 = t.r + 0.85;
    // the roof: a bell-cast cone (its eave flared), its soffit in dark planks
    S.get('roof').lathe([[r0, y0], [t.r + 0.35, y0 + 0.75], [t.r * 0.45, y0 + (t.roof - y0) * 0.6], [0.0001, t.roof]], n, { tint: [0.96, 0.96, 1.0], uvTile: 1, aoY: [0.72, 1] });
    S.get('planks').lathe([[t.r + 0.2, y0 - 0.05], [r0, y0 - 0.01]], n, { tint: [0.3, 0.24, 0.2] });
    S.get('metal').cylinder(0.12, t.roof - 0.1, t.roof + 0.35, 8, { tint: [1.1, 0.92, 0.55], r1: 0.05 });
    S.get('timber').boxMM(-0.04, t.roof + 0.3, -0.04, 0.04, t.roof + 2.3, 0.04, { tint: [0.5, 0.42, 0.34], grain: 'y' });
    addBanner(S, { pos: [0.06, t.roof + 2.2, 0], yaw: Math.PI / 2, w: 0.6, h: 1.6, emblem, shape: 'pennant', loose: 0.85, rod: false, tint: [0.95, 0.88, 0.62] });
  }));
  if (door && !day) batch.add('lantern', { pos: [t.x + 0.95, 2.1, t.z + t.r + 0.3], yaw: 0 }, 0);
  else if (door) batch.add('lanternDark', { pos: [t.x + 0.95, 2.1, t.z + t.r + 0.3], yaw: 0 }, 0);
}

/** the stair to the wall-walk (journal Passe VP9): stone steps rising along the rampart's inner face from its foot (east) to the wall-walk by the
 *  corner tower (west), the parapet on its open side down to the ground, its coping following the flight; each half a part */
function wallStair(S: SlotSet, tracked: (fn: () => void) => void, day: boolean): void {
  const L = LISTS, s = L.stair, St = S.get(WALL_FACE), { stone, light, dark } = wallTrim(day);
  const N = 26, run = s.foot - s.top, rise = L.walkY / N, tread = run / N, z0 = L.zIn, zp = L.zIn + s.w - 0.3, z1 = L.zIn + s.w;
  const yAt = (x: number) => Math.max(0, Math.min(L.walkY, ((s.foot - x) / run) * L.walkY));
  for (const [i0, i1] of [[0, N / 2], [N / 2, N]]) tracked(() => {
    for (let i = i0; i < i1; i++) {
      const xa = s.foot - tread * (i + 1), xb = s.foot - tread * i, y1 = rise * (i + 1);
      St.boxMM(xa, y1 - rise - 0.02, z0, xb, y1, zp, { tint: i % 2 ? stone : [stone[0] * 1.04, stone[1] * 1.04, stone[2] * 1.03], uvScale: 1.0, skip: ['-z', '-y'] });
      St.boxMM(xa, y1, z0 + 0.02, xb + 0.04, y1 + 0.05, zp, { tint: light, skip: ['-z', '-y'] });
    }
    // the parapet: its outer face down to the ground, its inner face over the treads, its coping
    const xa = s.foot - tread * i1, xb = s.foot - tread * i0 + (i0 === 0 ? 0.35 : 0), ya = yAt(xa), yb = i0 === 0 ? 0 : yAt(xb), top = 0.85;
    quadFacing(St, [[xa, 0, z1], [xb, 0, z1], [xb, yb + top, z1], [xa, ya + top, z1]], [0, 0, 1], { tint: stone, uvScale: 1.0, ao: [0.7, 0.7, 1, 1] });
    quadFacing(St, [[xa, ya, zp], [xb, yb, zp], [xb, yb + top, zp], [xa, ya + top, zp]], [0, 0, -1], { tint: dark, uvScale: 1.0 });
    // (its coping in the parapet's own stone, a course deep: a light line along the flight « reads as a cable », the third critique)
    quadFacing(St, [[xa, ya + top, zp - 0.04], [xb, yb + top, zp - 0.04], [xb, yb + top + 0.08, z1 + 0.04], [xa, ya + top + 0.08, z1 + 0.04]], [0, 1, 0], { tint: stone });
    quadFacing(St, [[xa, ya + top - 0.2, z1 + 0.04], [xb, yb + top - 0.2, z1 + 0.04], [xb, yb + top + 0.08, z1 + 0.04], [xa, ya + top + 0.08, z1 + 0.04]], [0, 0, 1], { tint: dark, uvScale: 1.0 });
    if (i0 === 0) quadFacing(St, [[xb, 0, zp], [xb, 0, z1], [xb, top, z1], [xb, top, zp]], [1, 0, 0], { tint: stone, uvScale: 1.0 });
  });
  // the landing by the tower and the wall-walk's opening
  tracked(() => St.boxMM(s.top - 0.5, L.walkY - 0.25, z0, s.top + 0.05, L.walkY, zp, { tint: light }));
  // the flight carried on two arches (their dark voids under it, a ring of voussoirs round each: the second critique of journal Passe VP9, « the
  // diagonal stair along the wall reads as a thin floating pole »)
  tracked(() => {
    const Dk = S.get('dark');
    for (const u of [0.2, 0.47]) {
      const xc = s.top + run * u, top = L.walkY * (1 - u) - 1.0, R = 0.85, spring = Math.min(2.4, top - R - 0.3), zf = z1 + 0.012;
      Dk.boxMM(xc - R, 0, z1 - 0.02, xc + R, spring, zf, { tint: [0.06, 0.06, 0.07], skip: ['-z', '-y'] });
      for (let i = 0; i < 8; i++) {
        const a0 = (i / 8) * Math.PI, a1 = ((i + 1) / 8) * Math.PI, am = (a0 + a1) / 2;
        Dk.tri([xc + Math.cos(a0) * R, spring + Math.sin(a0) * R, zf], [xc + Math.cos(a1) * R, spring + Math.sin(a1) * R, zf], [xc, spring, zf], { tint: [0.06, 0.06, 0.07] });
        S.at([xc + Math.cos(am) * (R + 0.16), spring + Math.sin(am) * (R + 0.16), zf], 0, () => St.box(0, 0, 0, 0.22, 0.3, 0.12, { tint: light }));
      }
      for (const sx of [-1, 1]) St.boxMM(xc + sx * R - 0.08, 0, zf - 0.01, xc + sx * R + 0.08, spring, zf + 0.06, { tint: light });
    }
  });
}

/** the spectators' gallery closing the lists' west end (journal Passe VP9): a timber stand of two levels over the stables, facing the yard: its
 *  posts on stone bases, the stalls' half doors, the passage under it to the forecourt's street with the forecourt's sign, the balustrade painted
 *  with the tournament's shields, the benches, the judges' box over the passage under a striped canopy, a slate roof sloping toward the yard,
 *  the tournament's banners on its posts; each bay a part */
function listsGallery(S: SlotSet, tracked: (fn: () => void) => void, batch: InstanceBatch, lights: PlazaBuild['lights'], day: boolean): void {
  const G = LISTS.gallery, P = LISTS.pass, x = G.x, xb = x - G.d, T = S.get('timber'), Pk = S.get('planks'), Dk = S.get('dark'), St = S.get('stone');
  const wood: V3 = [0.56, 0.45, 0.35], pale: V3 = [0.7, 0.59, 0.46], fl = G.floor;
  const zs = [G.z0, -3.8, P.zn, P.zs, 6.4, G.z1];
  const post = (px: number, pz: number, y1: number) => {
    St.boxMM(px - 0.26, 0, pz - 0.26, px + 0.26, 0.42, pz + 0.26, { tint: [0.6, 0.58, 0.55], aoY: [0.6, 1] });
    T.boxMM(px - 0.15, 0.42, pz - 0.15, px + 0.15, y1, pz + 0.15, { tint: wood, grain: 'y' });
  };
  // the shield painted on a balustrade panel (the gateway's sign, facing +x)
  const shield = (pz: number, y: number, emblem: EmblemKind, w = 0.62) => {
    const B = S.get('banner'), [u0, v0, u1, v1] = emblemRect(emblem, 0.01), h = w * 1.25, xs = x + 0.08;
    const P5: Array<[number, number]> = [[-w / 2, y], [w / 2, y], [w / 2, y - h * 0.5], [0, y - h], [-w / 2, y - h * 0.5]], ctr: [number, number] = [0, y - h * 0.4];
    const uvOf = (pz0: number, py: number): [number, number] => [u0 + ((pz0 + w / 2) / w) * (u1 - u0), v1 - ((y - py) / h) * (v1 - v0)];
    for (let i = 0; i < 5; i++) { const a = P5[i], b = P5[(i + 1) % 5]; B.tri([xs, a[1], pz - a[0]], [xs, b[1], pz - b[0]], [xs, ctr[1], pz - ctr[0]], { uvs: [...uvOf(a[0], a[1]), ...uvOf(b[0], b[1]), ...uvOf(ctr[0], ctr[1])], tint: [1, 1, 1], ao: 1, aux: [0.1, 0, 0.5, 0] }); }
  };
  const EMB: EmblemKind[] = ['helm', 'swords', 'laurel', 'trophy', 'lances'];
  for (let b = 0; b < zs.length - 1; b++) {
    const za = zs[b], zb = zs[b + 1], passage = za === P.zn;
    tracked(() => {
      // the front posts up to the eave (the passage's a little stouter), the back posts
      for (const pz of b === 0 ? [za, zb] : [zb]) { post(x, pz, G.eave); post(xb, pz, G.eave); }
      // the floor's beam along the front, the floor's edge, the gallery's deck
      T.boxMM(x - 0.2, fl - 0.3, za, x + 0.12, fl, zb, { tint: pale, grain: 'z' });
      Pk.boxMM(xb, fl - 0.08, za, x - 0.2, fl, zb, { tint: [0.46, 0.37, 0.29], grain: 'x' });
      if (passage) {
        // the passage: its lintel with the forecourt's sign hung under it, the dark way through, the street's setts beyond
        T.boxMM(x - 0.22, fl - 0.56, za, x + 0.14, fl - 0.3, zb, { tint: wood, grain: 'z' });
        for (const s of [-1, 1]) S.with(mat([x, fl - 0.3, s < 0 ? za + 0.15 : zb - 0.15], 0, 1, s * 0.7), () => T.boxMM(-0.07, -0.95, -0.07, 0.07, 0, 0.07, { tint: wood }));
        quadFacing(Dk, [[xb - 0.02, 0, zb], [xb - 0.02, 0, za], [xb - 0.02, fl - 0.08, za], [xb - 0.02, fl - 0.08, zb]], [1, 0, 0], { tint: [0.05, 0.05, 0.06] });
        for (const s of [-1, 1]) quadFacing(Pk, [[x, 0, s < 0 ? za : zb], [xb, 0, s < 0 ? za : zb], [xb, fl - 0.08, s < 0 ? za : zb], [x, fl - 0.08, s < 0 ? za : zb]], [0, 0, -s], { tint: [0.34, 0.27, 0.21], grain: 'x' });
        quadFacing(Pk, [[x, fl - 0.1, za], [xb, fl - 0.1, za], [xb, fl - 0.1, zb], [x, fl - 0.1, zb]], [0, -1, 0], { tint: [0.3, 0.24, 0.19], grain: 'x' });
        shield((za + zb) / 2, fl - 0.62, 'duel', 0.72);
      } else {
        // the stalls: two half doors a bay, their dark openings above, the lintel
        const m = (za + zb) / 2;
        for (const [a0, a1] of [[za + 0.18, m - 0.06], [m + 0.06, zb - 0.18]]) {
          Pk.boxMM(x - 0.42, 0, a0, x - 0.34, 1.3, a1, { tint: [0.44, 0.34, 0.25], grain: 'y' });
          T.boxMM(x - 0.44, 0.55, a0, x - 0.32, 0.65, a1, { tint: wood });
          quadFacing(Dk, [[x - 0.4, 1.3, a1], [x - 0.4, 1.3, a0], [x - 0.4, fl - 0.4, a0], [x - 0.4, fl - 0.4, a1]], [1, 0, 0], { tint: [0.06, 0.06, 0.07] });
        }
        T.boxMM(x - 0.46, fl - 0.42, za, x - 0.3, fl - 0.3, zb, { tint: wood, grain: 'z' });
        Pk.boxMM(xb + 0.05, 0, za, xb + 0.12, fl - 0.1, zb, { tint: [0.36, 0.28, 0.22], grain: 'y' });
      }
      // the balustrade: rails, the planked panel, the bay's shield
      for (const y of [fl + 0.05, fl + 0.82]) T.boxMM(x - 0.12, y, za, x + 0.06, y + 0.1, zb, { tint: pale, grain: 'z' });
      Pk.boxMM(x - 0.08, fl + 0.15, za + 0.15, x - 0.02, fl + 0.82, zb - 0.15, { tint: day ? [0.6, 0.49, 0.37] : [0.42, 0.34, 0.26], grain: 'z' });
      if (!passage) shield((za + zb) / 2, fl + 0.8, EMB[b % EMB.length], 0.54);
      // the benches in three tiers rising to the back wall (seen over the balustrade), the tournament's striped cloth on the back wall, the
      // eave's beam
      for (let k = 0; k < 3; k++) {
        const x0 = x - 0.5 - (k + 1) * 1.05, y = fl + 0.3 + k * 0.42;
        Pk.boxMM(x0, fl, za + 0.05, x0 + 1.05, y, zb - 0.05, { tint: [0.5, 0.4, 0.31], grain: 'z' });
        Pk.boxMM(x0 + 0.1, y, za + 0.1, x0 + 0.62, y + 0.07, zb - 0.1, { tint: [0.66, 0.54, 0.41], grain: 'z' });
      }
      Pk.boxMM(xb - 0.06, fl, za, xb + 0.04, G.eave, zb, { tint: [0.4, 0.31, 0.24], grain: 'y' });
      { const C = S.get('cloth'), k = Math.max(2, Math.round((zb - za) / 0.55)); for (let i = 0; i < k; i++) { const a0 = za + ((zb - za) * i) / k, a1 = za + ((zb - za) * (i + 1)) / k; quadFacing(C, [[xb + 0.06, fl + 1.4, a0], [xb + 0.06, fl + 1.4, a1], [xb + 0.06, G.eave - 0.35, a1], [xb + 0.06, G.eave - 0.35, a0]], [1, 0, 0], { tint: i % 2 ? [0.32, 0.38, 0.7] : [0.86, 0.82, 0.7], swayArr: [0.05, 0.05, 0, 0] }); } }
      T.boxMM(x - 0.18, G.eave - 0.3, za, x + 0.14, G.eave, zb, { tint: pale, grain: 'z' });
      // the tournament's bunting by day along the eave, a swag a bay (J4, J6)
      if (day) garland(S, [x + 0.2, G.eave - 0.35, za + 0.1], [x + 0.2, G.eave - 0.35, zb - 0.1], 0.35, { size: 0.36, width: 0.3, spacing: 0.42, phase: b });
    });
    // the bay's roof, a part of its own (seen over the yard's things from farther than its front)
    tracked(() => {
      // the roof: its slope toward the yard from the eave to the ridge, its back slope, its soffit
      const xr = (x + xb) / 2, ex = x + 0.65, bx = xb - 0.45, R = S.get('roof');
      const L1 = Math.hypot(ex - xr, G.ridge - G.eave), L2 = Math.hypot(xr - bx, G.ridge - G.eave);
      quadFacing(R, [[ex, G.eave - 0.08, zb], [ex, G.eave - 0.08, za], [xr, G.ridge, za], [xr, G.ridge, zb]], [1, 1, 0], { uvs: [zb, 0, za, 0, za, L1, zb, L1], tint: [0.96, 0.96, 1.0], ao: [0.75, 0.75, 1, 1] });
      quadFacing(R, [[bx, G.eave - 0.08, za], [bx, G.eave - 0.08, zb], [xr, G.ridge, zb], [xr, G.ridge, za]], [-1, 1, 0], { uvs: [za, 0, zb, 0, zb, L2, za, L2], tint: [0.96, 0.96, 1.0], ao: [0.75, 0.75, 1, 1] });
      quadFacing(Pk, [[ex, G.eave - 0.14, za], [ex, G.eave - 0.14, zb], [xr, G.ridge - 0.12, zb], [xr, G.ridge - 0.12, za]], [-1, -1, 0], { tint: [0.3, 0.24, 0.2], grain: 'z' });
      T.boxMM(ex - 0.04, G.eave - 0.3, za, ex + 0.04, G.eave - 0.02, zb, { tint: [0.42, 0.33, 0.26], grain: 'z' });
      R.sweep([[xr, G.ridge + 0.04, za], [xr, G.ridge + 0.04, zb]], 0.08, 4, { tint: [0.78, 0.78, 0.84] });
    });
  }
  // the gable ends: the south one in planks, the north one against the corner tower in stone
  tracked(() => {
    const xr = (x + xb) / 2;
    for (const [z, out] of [[G.z1, 1], [G.z0, -1]] as Array<[number, number]>) {
      const B = out > 0 ? Pk : St;
      quadFacing(B, [[x + 0.1, 0, z], [xb, 0, z], [xb, G.eave, z], [x + 0.1, G.eave, z]], [0, 0, out], { tint: out > 0 ? [0.42, 0.33, 0.25] : wallStone(day).stone, grain: 'y', uvScale: 0.5 });
      B.tri([x + 0.65, G.eave - 0.08, z], [xb - 0.45, G.eave - 0.08, z], [xr, G.ridge, z], { tint: out > 0 ? [0.42, 0.33, 0.25] : wallStone(day).stone, flip: out < 0, grain: 'y', uvScale: 0.5 });
    }
  });
  // the judges' box over the passage: a striped canopy out over the balustrade, its valance, its poles and pennants, the tournament's cloth
  tracked(() => {
    const za = P.zn - 0.2, zb = P.zs + 0.2, C = S.get('cloth'), y0 = G.eave - 0.25, y1 = fl + 2.05, xo = x + 1.5, k = 10;
    for (let i = 0; i < k; i++) {
      const a0 = za + ((zb - za) * i) / k, a1 = za + ((zb - za) * (i + 1)) / k, tint: V3 = i % 2 ? [0.3, 0.37, 0.7] : [0.88, 0.84, 0.72];
      C.quad([x, y0, a0], [x, y0, a1], [xo, y1, a1], [xo, y1, a0], { tint, flip: true, swayArr: [0, 0, 0.35, 0.35] });
      for (const flip of [false, true]) C.tri([xo, y1, a0], [xo, y1, a1], [xo + 0.02, y1 - 0.3, (a0 + a1) / 2], { tint: i % 2 ? [0.88, 0.84, 0.72] : [0.3, 0.37, 0.7], flip, swayArr: [0.3, 0.3, 0.6] });
    }
    for (const z of [za, zb]) { T.boxMM(xo - 0.04, fl, z - 0.04, xo + 0.04, y1 + 1.2, z + 0.04, { tint: wood, grain: 'y' }); addBanner(S, { pos: [xo + 0.05, y1 + 1.1, z], yaw: Math.PI / 2, w: 0.42, h: 1.05, emblem: 'laurel', shape: 'pennant', loose: 0.85, rod: false, tint: [0.95, 0.88, 0.62] }); }
    T.boxMM(xo - 0.05, fl - 0.05, za, xo + 0.05, fl + 0.05, zb, { tint: wood, grain: 'z' });
    addBanner(S, { pos: [x + 0.14, fl + 1.12, (P.zn + P.zs) / 2], yaw: Math.PI / 2, w: 2.6, h: 1.25, emblem: 'crown', shape: 'swallow', loose: 0.25, rod: true, tint: [0.5, 0.6, 0.95] });
  });
  // the tournament's banners on the posts beside the passage and at the stand's ends
  for (const [z, emblem, tint] of [[-3.8, 'helm', BLUE_T], [6.4, 'swords', BLUE_T], [G.z0 + 0.3, 'laurel', GOLD_T], [G.z1 - 0.3, 'trophy', GOLD_T]] as Array<[number, EmblemKind, V3]>) {
    tracked(() => addBanner(S, { pos: [x + 0.2, G.eave - 0.35, z], yaw: Math.PI / 2, w: 0.85, h: 2.3, emblem, shape: 'swallow', loose: 0.35, rod: true, tint }));
  }
  // the lanterns: on the passage's posts (one light), in the judges' box (one light), along the stand
  for (const z of [P.zn, P.zs]) batch.add(day ? 'lanternDark' : 'lantern', { pos: [x + 0.32, 2.3, z], yaw: Math.PI / 2 }, 0);
  for (const z of [-3.8, 6.4]) batch.add(day ? 'lanternDark' : 'lantern', { pos: [x + 0.3, G.eave - 0.55, z], yaw: Math.PI / 2 }, 0);
  // (and at the stables' posts, glowing without a light: « the gallery and roofs fall into a near-black void at night », the third critique)
  if (!day) for (const z of [G.z0 + 0.2, -3.8, 6.4, G.z1 - 0.2]) batch.add('lantern', { pos: [x + 0.32, 2.3, z], yaw: Math.PI / 2 }, 0);
  if (!day) {
    lights.push({ pos: [x + 1.0, 2.4, (P.zn + P.zs) / 2], color: WARM, intensity: 3.4, radius: 8.5, kind: 'lantern', halo: 0, priority: 8 });
    lights.push({ pos: [x + 0.9, fl + 1.7, (P.zn + P.zs) / 2], color: WARM, intensity: 2.4, radius: 6.5, kind: 'lantern', halo: 0, priority: 7 });
    batch.add('lantern', { pos: [x + 0.7, fl + 1.75, (P.zn + P.zs) / 2], yaw: Math.PI / 2 }, 0);
  }
}

// ---------------------------------------------------------------- the market hall's square (journal Passe VP9)

/** the hall's plan (journal Passe VP9, the operator's choice « Place de la halle »; « proposé »): its posts (from x0, `cols` columns 4 m apart,
 *  three rows along z), the eave's and the ridge's heights, the roof's overhang; the arcades' curve (its centre, the front line's radius, the
 *  houses' set back behind the covered walk, from t0 to t1 radians, the gap of the way to the forecourt at 0) */
const HALL = { x0: -9.5, cols: 5, rows: [-8.4, -12.8, -17.2], eave: 4.9, ridge: 10.2, over: 1.1, stage: [-1.5, -14.9] as [number, number] };
const ARC = { c: [-18, -1] as [number, number], r: 29.5, depth: 2.6, t0: -0.36, t1: 0.36, gap: 0.0685 };
const hallBox = () => ({ x0: HALL.x0 - HALL.over, x1: HALL.x0 + (HALL.cols - 1) * 4 + HALL.over, z0: HALL.rows[2] - HALL.over, z1: HALL.rows[0] + HALL.over });
/** a point of the arcades' curve at angle t, radius r */
const arcAt = (t: number, r: number, y = 0): V3 => [ARC.c[0] + Math.cos(t) * r, y, ARC.c[1] + Math.sin(t) * r];

/** The market hall (journal Passe VP9): a great timber hall open on every side, oak posts on stone bases in three rows, knee braces, wall plates
 *  and tie beams, a hipped roof of the town's slate with a louvre on its ridge and the tournament's pennants, its soffit in dark planks; under it
 *  the flagged floor, the tournament's banners hung from the tie beams, the stage, the candle crowns (the square's key light at night); each
 *  bay, each face of the roof a part */
function marketHall(S: SlotSet, tracked: (fn: () => void) => void, batch: InstanceBatch, lights: PlazaBuild['lights'], day: boolean, rng: Rng, blockers: PlazaBuild['blockers'], obstacles: MaskObstacle[]): void {
  const H = HALL, B = hallBox(), T = S.get('timber'), Pk = S.get('planks'), St = S.get('stone'), Rf = S.get('roof'), oak: V3 = [0.46, 0.36, 0.28], oakLt: V3 = [0.56, 0.45, 0.34];
  const xs = Array.from({ length: H.cols }, (_, i) => H.x0 + i * 4), cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2, hd = (B.z1 - B.z0) / 2;
  const ridge0 = B.x0 + hd, ridge1 = B.x1 - hd, plate = H.eave - 0.2;
  // the floor: large flags within the posts
  tracked(() => flagstones(S, rng.fork('hallfloor'), [[cx, B.z1 - 0.5], [cx, B.z0 + 0.5]], B.x1 - B.x0 - 1.2, [0.6, 0.59, 0.58]));
  for (const [ri, z] of H.rows.entries()) tracked(() => {
    for (const x of xs) {
      // (no post before the stage's middle: the tie beam spans it)
      if (ri === 1 && Math.abs(x - H.stage[0]) < 0.1) continue;
      St.boxMM(x - 0.34, 0, z - 0.34, x + 0.34, 0.5, z + 0.34, { tint: [0.62, 0.6, 0.57], aoY: [0.6, 1] });
      St.boxMM(x - 0.38, 0.5, z - 0.38, x + 0.38, 0.6, z + 0.38, { tint: [0.7, 0.68, 0.64] });
      T.boxMM(x - 0.18, 0.6, z - 0.18, x + 0.18, plate, z + 0.18, { tint: oak, grain: 'y' });
      // the knee braces to the plate (along x) and to the tie beam (along z)
      for (const s of [-1, 1]) {
        if ((s < 0 && x === xs[0]) || (s > 0 && x === xs[xs.length - 1])) continue;
        T.sweep([[x + s * 0.16, plate - 1.15, z], [x + s * 1.05, plate - 0.22, z]], 0.07, 4, { tint: oak });
      }
      for (const s of [-1, 1]) {
        if ((s < 0 && ri === 2) || (s > 0 && ri === 0)) continue;
        T.sweep([[x, plate - 1.15, z + s * 0.16], [x, plate - 0.22, z + s * 1.05]], 0.07, 4, { tint: oak });
      }
      blockers.push({ x, z, r: 0.42 });
    }
    // the wall plate along the row
    T.boxMM(B.x0 + 0.4, plate - 0.22, z - 0.2, B.x1 - 0.4, plate + 0.1, z + 0.2, { tint: oakLt, grain: 'x' });
  });
  // the tie beams across the rows at each column, the king posts and struts under the ridge
  tracked(() => {
    for (const x of xs) {
      T.boxMM(x - 0.2, plate + 0.1, B.z0 + 0.5, x + 0.2, plate + 0.42, B.z1 - 0.5, { tint: oakLt, grain: 'z' });
      if (x > ridge0 - 0.1 && x < ridge1 + 0.1) T.boxMM(x - 0.15, plate + 0.42, cz - 0.15, x + 0.15, H.ridge - 0.25, cz + 0.15, { tint: oak, grain: 'y' });
      if (x > ridge0 - 0.1 && x < ridge1 + 0.1) for (const s of [-1, 1]) T.sweep([[x, plate + 0.42, cz + s * 0.2], [x, H.ridge - 1.9, cz + s * 1.7]], 0.08, 4, { tint: oak });
    }
  });
  // the roof: its four faces from the eaves to the ridge, a strip a part, the soffit under, the fascia along the eaves, the hips and the ridge
  const top0: V3 = [ridge0, H.ridge, cz], top1: V3 = [ridge1, H.ridge, cz], e = H.eave, slope = Math.hypot(hd, H.ridge - e);
  const strips = 4;
  for (const side of [1, -1]) for (let i = 0; i < strips; i++) tracked(() => {
    // the long faces (south +z, north -z), split along x
    const t0 = i / strips, t1 = (i + 1) / strips, ze = side > 0 ? B.z1 : B.z0;
    const ea: V3 = [B.x0 + (B.x1 - B.x0) * t0, e, ze], eb: V3 = [B.x0 + (B.x1 - B.x0) * t1, e, ze];
    const ra: V3 = [Math.max(ridge0, Math.min(ridge1, ea[0])), H.ridge, cz], rb: V3 = [Math.max(ridge0, Math.min(ridge1, eb[0])), H.ridge, cz];
    // the slates in patches, each a shade off its neighbours, a few of lichen (the first critique of journal Passe VP9: « one huge, uniform tiled
    // plane [...] with no weathering or variation »)
    const lerp3 = (p: V3, q: V3, u: number): V3 => [p[0] + (q[0] - p[0]) * u, p[1] + (q[1] - p[1]) * u, p[2] + (q[2] - p[2]) * u], rows = 5;
    for (let k = 0; k < rows; k++) {
      const v0 = k / rows, v1 = (k + 1) / rows, h = hash1(i * 7 + k * 3 + side * 11), lich = h > 0.74;
      const t: V3 = lich ? [0.8, 0.9, 0.74] : [0.96 * (0.86 + 0.22 * h), 0.96 * (0.86 + 0.22 * h), 1.0 * (0.88 + 0.18 * h)];
      const q: [V3, V3, V3, V3] = [lerp3(ea, ra, v0), lerp3(eb, rb, v0), lerp3(eb, rb, v1), lerp3(ea, ra, v1)];
      quadFacing(Rf, q, [0, 0.6, side * 0.8], { uvs: [q[0][0], v0 * slope, q[1][0], v0 * slope, q[2][0], v1 * slope, q[3][0], v1 * slope], tint: t, ao: [0.72 + 0.28 * v0, 0.72 + 0.28 * v0, 0.72 + 0.28 * v1, 0.72 + 0.28 * v1] });
    }
    quadFacing(Pk, [[ea[0], e - 0.18, ze - side * 0.05], [eb[0], e - 0.18, ze - side * 0.05], [rb[0], H.ridge - 0.2, cz], [ra[0], H.ridge - 0.2, cz]], [0, -0.6, -side * 0.8], { tint: [0.42, 0.34, 0.26], grain: 'x' });
    T.boxMM(ea[0], e - 0.24, ze - 0.06, eb[0], e + 0.02, ze + 0.06, { tint: [0.4, 0.32, 0.25], grain: 'x' });
  });
  for (const side of [-1, 1]) tracked(() => {
    // the hipped ends (west, east): a triangle each
    const xe = side < 0 ? B.x0 : B.x1, top = side < 0 ? top0 : top1, a: V3 = [xe, e, B.z0], b: V3 = [xe, e, B.z1];
    Rf.tri(a, b, top, { uvs: [B.z0, 0, B.z1, 0, cz, slope], tint: [0.96, 0.96, 1.0], ao: [0.72, 0.72, 1], flip: side > 0 });
    Pk.tri([xe + side * -0.05, e - 0.18, B.z0], [xe + side * -0.05, e - 0.18, B.z1], [top[0], H.ridge - 0.2, cz], { tint: [0.42, 0.34, 0.26], flip: side < 0 });
    T.boxMM(xe - 0.06, e - 0.24, B.z0, xe + 0.06, e + 0.02, B.z1, { tint: [0.4, 0.32, 0.25], grain: 'z' });
    for (const z of [B.z0, B.z1]) Rf.sweep([[xe, e + 0.03, z], [top[0], H.ridge + 0.04, cz]], 0.07, 4, { tint: [0.78, 0.78, 0.84] });
  });
  // the ridge and its louvre: a small gabled lantern on the ridge, its slatted sides, the tournament's pennants at the ridge's ends
  tracked(() => {
    Rf.sweep([top0, top1].map((p) => [p[0], p[1] + 0.05, p[2]] as V3), 0.09, 4, { tint: [0.78, 0.78, 0.84] });
    const lx = (ridge0 + ridge1) / 2, lw = 1.3, lh = 1.0;
    for (const s of [-1, 1]) Pk.boxMM(lx - lw, H.ridge - 0.3, cz + s * 0.7 - 0.04, lx + lw, H.ridge + lh, cz + s * 0.7 + 0.04, { tint: [0.5, 0.41, 0.31], grain: 'x' });
    for (const s of [-1, 1]) for (let k = 0; k < 4; k++) S.get('dark').boxMM(lx - lw + 0.3 + k * 0.62, H.ridge + 0.1, cz + s * 0.75 - 0.01, lx - lw + 0.6 + k * 0.62, H.ridge + 0.75, cz + s * 0.75 + 0.01, { tint: [0.16, 0.15, 0.15] });
    for (const s of [-1, 1]) quadFacing(Rf, [[lx - lw - 0.2, H.ridge + lh, cz + s * 1.0], [lx + lw + 0.2, H.ridge + lh, cz + s * 1.0], [lx + lw + 0.2, H.ridge + lh + 0.7, cz], [lx - lw - 0.2, H.ridge + lh + 0.7, cz]], [0, 0.8, s * 0.6], { uvs: [0, 0, 2.9, 0, 2.9, 1.2, 0, 1.2], tint: [0.96, 0.96, 1.0] });
    for (const [p, emblem] of [[top0, 'laurel'], [top1, 'horn']] as Array<[V3, EmblemKind]>) {
      T.boxMM(p[0] - 0.05, p[1], p[2] - 0.05, p[0] + 0.05, p[1] + 2.4, p[2] + 0.05, { tint: [0.5, 0.42, 0.34], grain: 'y' });
      S.get('metal').box(p[0], p[1] + 2.45, p[2], 0.14, 0.14, 0.14, { tint: [1.1, 0.92, 0.55] });
      addBanner(S, { pos: [p[0] + 0.07, p[1] + 2.3, p[2]], yaw: Math.PI / 2, w: 0.55, h: 1.5, emblem, shape: 'pennant', loose: 0.85, rod: false, tint: [0.95, 0.88, 0.62] });
    }
  });
  // three dormers on the south face (the roof's plane broken: « a huge flat blue shape », the first captures of journal Passe VP9)
  for (const dx of [-5.5, -1.5, 2.5]) tracked(() => {
    const zf = B.z1 - 2.1, yr = e + (B.z1 - zf) * ((H.ridge - e) / hd), w = 0.6, hh = 0.95;
    Pk.boxMM(dx - w, yr - 0.6, zf - 1.4, dx + w, yr + hh, zf, { tint: [0.5, 0.41, 0.31], grain: 'y', skip: ['-y', '-z'] });
    // its louvre: slats of board with dark gaps between them ([KO] a dark opening, « solid black pentagons that look like holes », the first
    // critique; lit at night, « flat emissive orange squares [...] like stickers », the second)
    // (at night the candle crowns' glow between its slats, dim: « the dormer louvres go pure black at night and read as holes », the third)
    for (let k = 0; k < 4; k++) {
      const y = yr + 0.12 + k * 0.2;
      if (day) S.get('dark').boxMM(dx - w + 0.14, y, zf + 0.002, dx + w - 0.14, y + 0.07, zf + 0.008, { tint: [0.12, 0.1, 0.09] });
      else S.get('glow').boxMM(dx - w + 0.14, y, zf + 0.002, dx + w - 0.14, y + 0.07, zf + 0.008, { tint: [0.085, 0.05, 0.026], uvs: COAL_UV });
      Pk.boxMM(dx - w + 0.12, y + 0.07, zf - 0.02, dx + w - 0.12, y + 0.19, zf + 0.06, { tint: [0.46, 0.37, 0.28], grain: 'x' });
    }
    for (const s of [-1, 1]) quadFacing(Rf, [[dx + s * (w + 0.18), yr + hh - 0.05, zf + 0.2], [dx, yr + hh + 0.55, zf + 0.2], [dx, yr + hh + 0.55, zf - 1.7], [dx + s * (w + 0.18), yr + hh - 0.05, zf - 1.7]], [s, 1, 0], { uvs: [0, 0, 0.9, 0, 0.9, 1.9, 0, 1.9], tint: [0.96, 0.96, 1.0] });
  });
  // the tournament's banners hung from the tie beams down the hall's length, over the floor
  for (const [x, emblem, tint] of [[xs[0], 'helm', BLUE_T], [xs[1], 'swords', GOLD_T], [xs[3], 'trophy', GOLD_T], [xs[4], 'lances', BLUE_T]] as Array<[number, EmblemKind, V3]>) {
    tracked(() => addBanner(S, { pos: [x, plate + 0.08, cz + 1.6], yaw: 0, w: 1.1, h: 2.1, emblem, shape: 'swallow', loose: 0.3, rod: true, tint }));
  }
  // the stage under the middle bay, its back to the north row
  tracked(() => stage(S, batch, H.stage[0], H.stage[1], false));
  blockers.push({ x: H.stage[0] - 1.8, z: H.stage[1], r: 1.9 }, { x: H.stage[0] + 1.8, z: H.stage[1], r: 1.9 });
  obstacles.push({ x0: B.x0, x1: B.x1, z0: B.z0, z1: B.z1, grime: 0.45 });
  // the candle crowns hung from the tie beams over the floor and before the stage: the square's key light at night
  for (const [x, z, key] of [[xs[1], -10.6, true], [xs[3], -10.6, true], [H.stage[0], -12.9, false]] as Array<[number, number, boolean]>) {
    S.get('metal').boxMM(x - 0.015, 3.3, z - 0.015, x + 0.015, plate + 0.1, z + 0.015, { tint: [0.25, 0.25, 0.27] });
    S.at([x, 3.2, z], 0, () => S.get('metal').cylinder(0.5, 0, 0.07, 12, { tint: [0.4, 0.34, 0.26], capTop: true, capBottom: true }));
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; S.get(day ? 'plaster' : 'glow').box(x + Math.cos(a) * 0.44, 3.36, z + Math.sin(a) * 0.44, 0.05, 0.16, 0.05, { tint: day ? [0.9, 0.86, 0.76] : [1, 0.7, 0.35] }); }
    if (!day) lights.push({ pos: [x, 3.1, z], color: WARM, intensity: key ? 5.2 : 3.4, radius: key ? 10.5 : 7.5, kind: 'lantern', halo: key ? 0.8 : 0, priority: 8, key });
  }
  // the lanterns on the front row's posts (dark by day; their glow at night, the crowns' light)
  for (const x of xs) batch.add(day ? 'lanternDark' : 'lantern', { pos: [x, 2.6, H.rows[0] + 0.3], yaw: 0 }, 0);
}

/** The arcades (journal Passe VP9): the east side's houses set back on a curve, a covered walk before them under a lean-to of the town's slate
 *  on oak posts with curved braces, the walk's flagstones, its lanterns (two lit at night); each bay a part */
function arcades(S: SlotSet, tracked: (fn: () => void) => void, batch: InstanceBatch, lights: PlazaBuild['lights'], day: boolean, blockers: PlazaBuild['blockers']): void {
  const A = ARC, T = S.get('timber'), Pk = S.get('planks'), St = S.get('stone'), Rf = S.get('roof'), oak: V3 = [0.48, 0.38, 0.29];
  const yF = 2.75, yB = 3.2, rB = A.r + A.depth - 0.15;
  const runs: Array<[number, number]> = [[A.t0, -A.gap], [A.gap, A.t1]];
  let lit = 0;
  for (const [t0, t1] of runs) {
    const nb = Math.max(1, Math.round(((t1 - t0) * A.r) / 2.6));
    for (let i = 0; i < nb; i++) {
      const ta = t0 + ((t1 - t0) * i) / nb, tb = t0 + ((t1 - t0) * (i + 1)) / nb;
      const fa = arcAt(ta, A.r), fb = arcAt(tb, A.r), ba = arcAt(ta, rB), bb = arcAt(tb, rB), tm = (ta + tb) / 2, nrm: V3 = [-Math.cos(tm), 0, -Math.sin(tm)];
      tracked(() => {
        // the posts at the bay's ends on their stone bases, the braces to the beam
        for (const [p, t, end] of [[fa, ta, i === 0], [fb, tb, true]] as Array<[V3, number, boolean]>) {
          if (!end) continue;
          St.boxMM(p[0] - 0.24, 0, p[2] - 0.24, p[0] + 0.24, 0.35, p[2] + 0.24, { tint: [0.62, 0.6, 0.56], aoY: [0.6, 1] });
          T.boxMM(p[0] - 0.13, 0.35, p[2] - 0.13, p[0] + 0.13, yF, p[2] + 0.13, { tint: oak, grain: 'y' });
          const tg: V3 = [-Math.sin(t), 0, Math.cos(t)];
          for (const s of [-1, 1]) T.sweep([[p[0] + tg[0] * s * 0.12, yF - 0.85, p[2] + tg[2] * s * 0.12], [p[0] + tg[0] * s * 0.55, yF - 0.32, p[2] + tg[2] * s * 0.55], [p[0] + tg[0] * s * 0.85, yF - 0.14, p[2] + tg[2] * s * 0.85]], 0.06, 4, { tint: oak });
          blockers.push({ x: p[0], z: p[2], r: 0.3 });
        }
        // the beam along the front, the lean-to (its slates, its soffit), the fascia
        quadFacing(T, [[fa[0], yF - 0.05, fa[2]], [fb[0], yF - 0.05, fb[2]], [fb[0], yF + 0.22, fb[2]], [fa[0], yF + 0.22, fa[2]]], nrm, { tint: [0.52, 0.41, 0.31], grain: 'x' });
        const fa2: V3 = [fa[0] + nrm[0] * 0.35, yF + 0.12, fa[2] + nrm[2] * 0.35], fb2: V3 = [fb[0] + nrm[0] * 0.35, yF + 0.12, fb[2] + nrm[2] * 0.35];
        const w = Math.hypot(fb[0] - fa[0], fb[2] - fa[2]), d = Math.hypot(A.depth + 0.35, yB - yF);
        quadFacing(Rf, [fa2, fb2, [bb[0], yB + 0.2, bb[2]], [ba[0], yB + 0.2, ba[2]]], [nrm[0] * 0.3, 1, nrm[2] * 0.3], { uvs: [0, 0, w, 0, w, d, 0, d], tint: [0.96, 0.96, 1.0], ao: [0.78, 0.78, 0.95, 0.95] });
        quadFacing(Pk, [[fa2[0], fa2[1] - 0.1, fa2[2]], [fb2[0], fb2[1] - 0.1, fb2[2]], [bb[0], yB + 0.08, bb[2]], [ba[0], yB + 0.08, ba[2]]], [0, -1, 0], { tint: [0.3, 0.24, 0.19], grain: 'x' });
        quadFacing(T, [[fa2[0], fa2[1] - 0.14, fa2[2]], [fb2[0], fb2[1] - 0.14, fb2[2]], [fb2[0], fb2[1] + 0.04, fb2[2]], [fa2[0], fa2[1] + 0.04, fa2[2]]], nrm, { tint: [0.42, 0.33, 0.26], grain: 'x' });
        // the walk's flags under it
        quadFacing(S.get('plaster'), [[fa[0], 0.03, fa[2]], [fb[0], 0.03, fb[2]], [bb[0], 0.03, bb[2]], [ba[0], 0.03, ba[2]]], [0, 1, 0], { tint: [0.56, 0.55, 0.54], uvScale: 0.7 });
      });
      // a lantern hung under the beam at every other bay, the two nearest the way lit at night
      if (i % 2 === 0 || nb === 1) {
        const p = arcAt(tm, A.r + 0.35, yF - 0.5), on = !day && lit < 2 && Math.abs(tm) < 0.25;
        batch.add(on ? 'lantern' : 'lanternDark', { pos: p, yaw: Math.atan2(nrm[0], nrm[2]) }, 0);
        if (on) { lit++; lights.push({ pos: [p[0] + nrm[0] * 0.6, 2.2, p[2] + nrm[2] * 0.6], color: WARM, intensity: 2.6, radius: 7.5, kind: 'lantern', halo: 0, priority: 7 }); }
      }
    }
  }
}

/** the hall's square's well (journal Passe VP9): an octagonal stone curb with its coping, a wrought-iron arch on two stone posts, its pulley,
 *  its rope and bucket, a second bucket on the rim */
function well(S: SlotSet, batch: InstanceBatch, x: number, z: number, yaw: number): void {
  S.at([x, 0, z], yaw, () => {
    const St = S.get('stone'), M = S.get('metal'), n = 8, ring = (r: number): Array<[number, number]> => Array.from({ length: n }, (_, k) => [Math.cos(Math.PI / 8 + (k / n) * Math.PI * 2) * r, Math.sin(Math.PI / 8 + (k / n) * Math.PI * 2) * r]);
    St.prism(ring(1.12), 0, 0.72, { tint: [0.62, 0.6, 0.57], uvScale: 0.8, aoY: [0.65, 1], capTop: false });
    St.prism(ring(1.2), 0.72, 0.84, { tint: [0.72, 0.7, 0.66] });
    S.get('dark').prism(ring(0.86), 0.5, 0.845, { tint: [0.05, 0.06, 0.07] });
    for (const s of [-1, 1]) { St.boxMM(s * 1.0 - 0.14, 0.84, -0.14, s * 1.0 + 0.14, 1.9, 0.14, { tint: [0.66, 0.64, 0.6] }); St.boxMM(s * 1.0 - 0.18, 1.9, -0.18, s * 1.0 + 0.18, 2.0, 0.18, { tint: [0.74, 0.72, 0.68] }); }
    // the arch: an iron bar curved over the curb, scrolls at its feet, the pulley under its crown
    const arch: V3[] = Array.from({ length: 13 }, (_, i) => { const a = (i / 12) * Math.PI; return [Math.cos(a) * 1.0, 2.0 + Math.sin(a) * 0.62, 0]; });
    M.sweep(arch, 0.035, 5, { tint: [0.22, 0.21, 0.22] });
    for (const s of [-1, 1]) M.sweep(Array.from({ length: 9 }, (_, i) => { const a = (i / 8) * Math.PI * 1.5; return [s * (0.62 + Math.cos(a) * 0.14), 2.18 + Math.sin(a) * 0.14, 0] as V3; }), 0.018, 4, { tint: [0.22, 0.21, 0.22] });
    S.with(mat([0, 2.42, 0], 0, 1, 0, Math.PI / 2), () => M.cylinder(0.13, -0.04, 0.04, 10, { tint: [0.3, 0.28, 0.27], capTop: true, capBottom: true }));
    S.get('cloth').sweep([[0.12, 2.42, 0], [0.12, 1.25, 0]], 0.012, 3, { tint: [0.5, 0.42, 0.32] });
  });
  batch.add('bucket', { pos: xf([0.12, 0.85, 0], [x, 0, z], yaw), yaw: 0.4, scale: 0.8 });
  batch.add('bucket', { pos: xf([-0.5, 0.84, 0.75], [x, 0, z], yaw), yaw: 1.2 });
}

/** the lists' lance rack (journal Passe VP9): two trestles and their bar, five tilting lances leaning on it in the tournament's stripes with their
 *  crowned tips, three round shields at its foot */
function lanceRack(S: SlotSet, x: number, z: number, yaw: number): void {
  S.at([x, 0, z], yaw, () => {
    const T = S.get('timber'), wood: V3 = [0.5, 0.4, 0.31];
    for (const sx of [-1.3, 1.3]) for (const s of [-1, 1]) S.with(mat([sx, 0, s * 0.3], 0, 1, s * 0.32), () => T.boxMM(-0.05, 0, -0.05, 0.05, 1.7, 0.05, { tint: wood, grain: 'y' }));
    T.boxMM(-1.5, 1.52, -0.05, 1.5, 1.62, 0.05, { tint: [0.56, 0.45, 0.35], grain: 'x' });
    for (let i = 0; i < 5; i++) {
      const lx = -1.1 + i * 0.55, blue: V3 = [0.3, 0.37, 0.68], ivory: V3 = [0.88, 0.84, 0.72];
      S.with(mat([lx, 0, 0.55], 0.05 * (i - 2), 1, -0.18), () => {
        for (let k = 0; k < 6; k++) S.get('cloth').cylinder(0.055 - k * 0.004, 0.3 + k * 0.55, 0.85 + k * 0.55, 6, { tint: (k + i) % 2 ? blue : ivory, capTop: k === 5 });
        S.get('metal').cylinder(0.08, 3.6, 3.75, 6, { tint: [0.62, 0.62, 0.66], r1: 0.03, capTop: true });
        S.get('metal').cylinder(0.11, 0.55, 0.62, 8, { tint: [0.4, 0.38, 0.36] });
      });
    }
    for (let i = 0; i < 3; i++) S.with(mat([-0.9 + i * 0.9, 0.42, 0.28], 0.1 * i, 1, Math.PI / 2 - 0.25), () => S.get('metal').cylinder(0.4, -0.03, 0.03, 12, { tint: i === 1 ? [0.62, 0.32, 0.24] : [0.3, 0.37, 0.68], capTop: true, capBottom: true }));
  });
}

/** a cord with a parabolic sag (the lantern strings at night) and the point at u along it */
function sag(a: V3, b: V3, s: number, u: number): V3 { return [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u - s * 4 * u * (1 - u), a[2] + (b[2] - a[2]) * u]; }
function cord(S: SlotSet, a: V3, b: V3, s: number): void {
  const seg = 24;
  // a cord that reads at the camera's distance (fifth critique: « their wires vanish, so the lanterns float »)
  for (let i = 0; i < seg; i++) { const p = sag(a, b, s, i / seg), q = sag(a, b, s, (i + 1) / seg); S.cloth.sweep([p, q], 0.024, 4, { tint: [0.44, 0.38, 0.31] }); }
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


/** a crowd walker's heading (ux, uz, unit) turned round what stands on the square (journal Passe VP6: they walked through the fountain and the
 *  bandstand): within 0.8 m of a blocker's margin (its radius + 0.45, blockers of 1 m and more), the heading's part along the edge on the side
 *  the walker already stands on (head-on, either side), blended in as it nears */
export function steer(blockers: PlazaBuild['blockers'], x: number, z: number, ux: number, uz: number): [number, number] {
  for (const o of blockers) {
    if (o.r < 1) continue;
    const ox = x - o.x, oz = z - o.z, od = Math.hypot(ox, oz), R = o.r + 0.45;
    if (od > R + 0.8 || od < 1e-3 || ux * ox + uz * oz > 0) continue;
    const k = (ux * ox + uz * oz) / (od * od); let tx = ux - k * ox, tz = uz - k * oz;
    if (Math.hypot(tx, tz) < 1e-3) { tx = -oz; tz = ox; }
    const tl = Math.hypot(tx, tz), w = Math.min(1, (R + 0.8 - od) / 0.8);
    ux += (tx / tl - ux) * w; uz += (tz / tl - uz) * w; const n = Math.hypot(ux, uz) || 1; ux /= n; uz /= n;
  }
  return [ux, uz];
}

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
