import * as THREE from 'three';
import { Rng } from '../core/rng';
import { MeshBuilder, SlotSet, SLOTS, mat, type V3 } from '../core/MeshBuilder';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import { createMerchantBuilding } from '../architecture/BuildingGenerator';
import type { BuildingParams, BuildingResult, ShopType, RoofStyle, PaletteName, Socket } from '../architecture/Types';
import { composeStreet, makeGroundMask, GROUND_RECT, STREET, QUAY_END_X, QUAY_Z, WATER_Y, WALK, type Collider, type MaskObstacle, type MaskBlob } from '../architecture/StreetComposer';
import { InstanceBatch, boat } from '../props/PropGenerator';
import type { LightDef } from '../atmosphere/LightRig';
import { LAYER_CAST, LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import { U } from '../atmosphere/SceneUniforms';
import { buildMarket, HERO_STALL } from '../props/MarketGenerator';
import { buildForgeProps, type ForgeState } from './ForgeGenerator';
import { buildDistantCity, southShore, RIVER_END_X } from './DistantCity';
import { addBanner, buildBanners } from '../props/Banners';
import { needMask, planDraw, ALL_MASK, FRAMINGS, SETS, idMaterial, windowIdMaterial, behindUniforms, type PartMeta, type Tier, type VisResult, type BehindPass } from './Visibility';
import type { CamId, VisSet } from '../app/CameraGraph';
import { voxelBoxes, type OccluderDef, type OccMeshRef } from '../app/Occlusion';
import { OCC_MAX } from '../atmosphere/SceneUniforms';
import type { Slot } from '../core/MeshBuilder';

export interface DistrictConfig {
  seed: number;
  buildingDensity: number;
  asymmetry: number;
  verticality: number;
  roofExaggeration: number;
  propDensity: number;
  npcDensity: number;
  timberRatio: number;
  litWindows: number;
  forgeState: ForgeState;
  wetness: number;
}

/** Art-direction defaults: calmer silhouettes (less asymmetry), lighter timber framing, fewer lit windows
 *  (light is spent where the eye should land), lower prop density. */
export const DEFAULT_CONFIG: DistrictConfig = {
  seed: 1842, buildingDensity: 1.0, asymmetry: 0.42, verticality: 1.0, roofExaggeration: 0.95, propDensity: 1.0, npcDensity: 1.0,
  timberRatio: 0.32, litWindows: 0.46, forgeState: 'NORMAL_FORGE', wetness: 1.0,
};

export interface Emitter { kind: 'chimney' | 'forge' | 'dust' | 'steam'; pos: V3; rate: number; tag?: string; size?: number; warm?: number }
export interface LightRecord extends LightDef { group: string }
export interface NpcSpawn { archetype: string; pos: V3; waypoints?: V3[]; role: string; detail: 'hero' | 'mid' | 'crowd'; facing?: number }

export interface DistrictBuild {
  group: THREE.Group;
  forgeGroup: THREE.Group;
  lights: LightRecord[];
  emitters: Emitter[];
  colliders: Collider[];
  buildings: Array<{ id: string; result: BuildingResult; pos: V3; yaw: number; mirror?: boolean }>;
  npcs: NpcSpawn[];
  spawn: V3;
  /** the one playable ground plane */
  walk: typeof WALK;
  stats: { triangles: number; instances: number; buildings: number; generatorMs: number; windows: number; modules: Record<string, number>; timings: Record<string, number> };
  heightAt: (x: number, z: number) => number;
  dispose(): void;
  forgeFocus: V3;
  forgeProps: { dispose(): void } | null;
  rebuildForge(state: ForgeState): void;
  streetPath: Array<[number, number]>;
  banners: THREE.Object3D | null;
  /** visibility-driven cleanup report (part / triangle counts per class, per-building and background tiers) */
  visibility: VisibilityReport;
  /** draw level of the static meshes = how many part classes are drawn (see Visibility.ts: planDraw) */
  setLevel(level: number): void;
  /** the draw level a set of framings needs (a blend: the larger prefix) */
  levelOf(ids: CamId[]): number;
  /** a reveal is (not) active: the occluder meshes take over from the main meshes' occluder prefix (see addRanged) */
  setOccActive(active: boolean): void;
  /** drop the Tier 3 shadow casters once the static moon shadow has been rendered */
  releaseShadowOnly(): void;
  /** the camera-occludable set (player occlusion reveal): proxies for the detection, meshes carrying the variants */
  occluders: { defs: OccluderDef[]; meshes: OccMeshRef[] };
}

export interface VisibilityReport {
  parts: number; hidden: number;
  trisKept: number; trisHidden: number;
  /** part classes in draw order (the baked sets that show them, parts, triangles); per configuration (framing / blend): class-prefix length and drawn triangles */
  classes: Array<{ mask: string; parts: number; tris: number }>;
  hi: Record<string, number>; drawn: Record<string, number>; levels: number;
  bakeMs: number; poses: number; bakeSplit: VisResult['split'] | null;
  /** bake pages and the bytes of the targets it allocated (0 when nothing was baked) */
  bakePages: number; bakeTargetBytes: number;
  buildings: Array<{ id: string; tier: Tier; parts: number; hidden: number; px: Record<CamId, number> }>;
  background: Record<string, { tier: Tier; total: number; hidden: number }>;
  /** the part registry and raw bake counts (debug / reports) */
  registry: PartMeta[];
  counts: Record<VisSet, Uint32Array> | null;
  /** behind-occluder support: parts the player-reveal windows keep alive that the front-most bake alone would drop */
  behind: { parts: number; tris: number; occludable: number; px: number } | null;
}

const xf = (p: V3, pos: V3, yaw: number): V3 => { const c = Math.cos(yaw), s = Math.sin(yaw); return [pos[0] + p[0] * c + p[2] * s, pos[1] + p[1], pos[2] - p[0] * s + p[2] * c]; };
const dirXf = (d: V3, yaw: number): V3 => { const c = Math.cos(yaw), s = Math.sin(yaw); return [d[0] * c + d[2] * s, d[1], -d[0] * s + d[2] * c]; };

interface BuildingSlot {
  id: string; pos: V3; yaw: number; role: string;
  /** mirror the generated building across its local x (e.g. put the forge bay on the camera-facing side) */
  mirror?: boolean;
  params: Omit<BuildingParams, 'seed'>;
}

/** The art-directed slot layout along the canal axis: one continuous frontage facing the water, a rhythm of
 *  tall / low masses (the forge is the deliberate dip), the guild hall as the landmark behind the hero stall.
 *  Every facade that can sit in the foreground or midground of the camera is generated at full detail, all the
 *  way to the bridge; only the non-walkable background (DistantCity) uses simplified modules.
 *  Positions and roles are fixed by composition; everything inside a slot is seeded. */
function layoutSlots(rng: Rng, cfg: DistrictConfig): BuildingSlot[] {
  const r = rng.fork('slots');
  const v = cfg.verticality;
  const flo = (a: number, b: number) => Math.max(1, Math.round(r.range(a, b) * v));
  const pal = (): PaletteName => r.pick<PaletteName>(['slate', 'ash', 'mist', 'dusk', 'stone']);
  const shops = r.shuffle<ShopType>(['apothecary', 'tailor', 'general']);
  const common = { asymmetry: cfg.asymmetry, timberRatio: cfg.timberRatio, roofExaggeration: cfg.roofExaggeration, verticality: 1, lit: cfg.litWindows };
  const front = (id: string, x: number, z: number, role: string, p: Omit<BuildingParams, 'seed' | 'asymmetry' | 'timberRatio'> & Partial<BuildingParams>): BuildingSlot => ({ id, pos: [x, 0, z], yaw: 0, role, params: { ...common, ...p } });
  const slots: BuildingSlot[] = [
    front('frameL', -15.6, -4.3, 'west-end', { floors: flo(3, 3.4), width: 7.0, overhang: 0.5, shopType: 'house', roofStyle: 'gable', stoneGround: true, chimney: true, balcony: false, dormers: r.int(0, 1), palette: pal(), detail: 0.74, sides: { left: true, right: true } }),
    front('guild', -7.4, -4.5, 'landmark', { floors: flo(3.2, 3.6), width: 9.0, depth: 7, overhang: 0.6, shopType: 'guild', roofStyle: r.weighted<RoofStyle>(['crooked', 'gable'], [2, 3]), stoneGround: true, chimney: true, balcony: true, dormers: 1, palette: 'stone', detail: 0.95, timberRatio: Math.min(1, cfg.timberRatio + 0.14), sides: { left: true, right: true } }),
    front('shopA', 1.0, -4.0, 'shop', { floors: flo(2.6, 3.2), width: 7.2, overhang: 0.45, shopType: shops[0], roofStyle: r.weighted<RoofStyle>(['gable', 'crooked'], [3, 2]), stoneGround: false, chimney: true, balcony: false, dormers: r.int(0, 1), palette: pal(), detail: 0.78, sides: { left: true, right: true } }),
    // the forge steps forward out of the frontage (the street pinches) and is mirrored so its open bay faces
    // down the quay toward the camera: the fire stays readable from the authored angle
    { ...front('forge', 8.7, -2.5, 'forge', { floors: 1, width: 7.8, depth: 3.8, roofTint: [0.82, 0.88, 1.0], overhang: 0, shopType: 'smith', roofStyle: 'leanto', stoneGround: true, forgeBay: true, chimney: true, balcony: false, dormers: 0, palette: 'stone', timberRatio: 0.3, detail: 0.8, sides: { left: true, right: true }, asymmetry: 0.25 }), mirror: true },
    front('tall', 14.6, -4.2, 'narrow-tall', { floors: flo(3.4, 3.9), width: 4.0, overhang: 0.6, shopType: shops[1], roofStyle: 'gableFront', chimney: r.bool(0.5), balcony: false, dormers: 0, palette: pal(), detail: 0.75, sides: { left: true, right: false } }),
    front('tavern', 21.0, -4.3, 'far-end', { floors: flo(2.8, 3.3), width: 7.0, overhang: 0.5, shopType: 'tavern', roofStyle: r.weighted<RoofStyle>(['gable', 'hip'], [3, 1]), stoneGround: r.bool(0.5), chimney: true, balcony: false, dormers: r.int(0, 1), palette: pal(), detail: 0.76, sides: { left: true, right: true } }),
    // beyond the guards' barrier: closed to the player tonight but in plain view, so still real facades
    front('east1', 28.3, -4.3, 'beyond-barrier', { floors: flo(2.8, 3.4), width: 7.2, overhang: 0.5, shopType: shops[2], roofStyle: r.weighted<RoofStyle>(['gable', 'crooked'], [3, 2]), stoneGround: r.bool(0.4), chimney: true, balcony: false, dormers: r.int(0, 1), palette: pal(), detail: 0.74, sides: { left: true, right: true } }),
    front('east2', 35.6, -4.4, 'beyond-barrier', { floors: flo(3.0, 3.6), width: 7.0, overhang: 0.55, shopType: 'house', roofStyle: 'gableFront', stoneGround: r.bool(0.5), chimney: r.bool(0.7), balcony: r.bool(0.5), dormers: 0, palette: pal(), detail: 0.72, sides: { left: true, right: true } }),
    front('east3', 42.6, -4.3, 'bridgehead', { floors: flo(3.2, 3.8), width: 6.2, overhang: 0.5, shopType: 'house', roofStyle: r.weighted<RoofStyle>(['hip', 'gable'], [2, 1]), stoneGround: true, chimney: true, balcony: false, dormers: r.int(0, 1), palette: pal(), detail: 0.72, sides: { left: true, right: true } }),
  ];
  // back row: taller and simplified; only upper floors and roofs read over the frontage ridgeline
  // the first two houses past the bridge are the nearest volumes outside the playable quay: generated (at a lower
  // budget) so the step from full detail to the simplified far city happens behind the bridge, not in front of it
  for (const [i, x] of [57.6, 64.8].entries()) {
    slots.push({
      id: `bgE${i}`, pos: [x, 0, -3.4], yaw: 0, role: 'backdrop',
      params: { ...common, floors: flo(3, 3.8), width: 7.0, overhang: r.range(0.35, 0.6), shopType: 'house', roofStyle: r.weighted<RoofStyle>(['gable', 'hip', 'crooked'], [3, 1, 1]), stoneGround: r.bool(0.5), chimney: r.bool(0.7), balcony: false, dormers: r.int(0, 1), palette: pal(), detail: 0.5, lit: cfg.litWindows * 0.5, sides: { left: true, right: true } },
    });
  }
  const back: V3[] = [[-11.5, 0, -12.4], [0.5, 0, -13.2], [11.5, 0, -12.0], [21.0, 0, -12.8], [30.5, 0, -12.6], [40.0, 0, -12.2]];
  const nBack = Math.min(back.length, Math.round(back.length * Math.min(1, 0.5 + 0.5 * cfg.buildingDensity)));
  for (let i = 0; i < nBack; i++) {
    slots.push({
      id: `bg${i}`, pos: back[i], yaw: 0, role: 'backdrop',
      params: { ...common, floors: flo(3.6, 4.6), width: r.range(6, 8), overhang: r.range(0.3, 0.6), shopType: 'house', roofStyle: r.weighted<RoofStyle>(['gable', 'crooked', 'hip'], [3, 2, 1]), stoneGround: r.bool(0.3), chimney: r.bool(0.7), balcony: false, dormers: 0, palette: pal(), detail: 0.45, lit: cfg.litWindows * 0.45, sides: { left: true, right: true } },
    });
  }
  return slots;
}

function aabbOf(res: BuildingResult, pos: V3, yaw: number, mirror = false): MaskObstacle {
  const [x0, z0, x1, z1] = res.colliders[0];
  const pts: V3[] = [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]].map((p) => xf([mirror ? -p[0] : p[0], 0, p[2]], pos, yaw));
  return { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), z0: Math.min(...pts.map((p) => p[2])), z1: Math.max(...pts.map((p) => p[2])), grime: 0.7 };
}

const LAMP_WARM: [number, number, number] = [1.0, 0.6, 0.27];
/** quay lamp rhythm: regular spacing reads as perspective and leads the eye to the bridge */
const QUAY_LAMPS_X = [-18, -9, 0, 9, 18, 27, 36];
const LAMP_Z = 4.15;
/** moored boat alongside the north quay, its bow at the landing steps: the right-hand counterweight to the stall */
const BOAT_POS: V3 = [0.8, WATER_Y, 6.35];

/** authored tiers: the playable frontage is gameplay / hero (0); the street beyond the barrier, the houses past
 *  the bridge and the back row are support (1). Tier 2 is DistantCity; Tier 3 is whatever the bake never sees. */
const TIER_OF_ROLE: Record<string, Tier> = { 'west-end': 0, landmark: 0, shop: 0, forge: 0, 'narrow-tall': 0, 'far-end': 0, 'beyond-barrier': 1, bridgehead: 1, backdrop: 1 };

export class MerchantDistrictGenerator {
  constructor(private lib: MaterialLibrary) {}

  /** `bake` renders the visibility part ids from the camera graph's poses (see Visibility.ts); without it every
   *  part is kept and drawn in every framing. */
  generate(cfg: DistrictConfig, bake?: (scene: THREE.Scene, nParts: number, behind?: Pick<BehindPass, 'scene' | 'uniforms'>) => VisResult | null, opts: { occTest?: string[] } = {}): DistrictBuild {
    const t0 = performance.now();
    const tm: Record<string, number> = {};
    const lap = (k: string, from: number) => { tm[k] = performance.now() - from; return performance.now(); };
    const rng = new Rng(cfg.seed);
    const lib = this.lib;
    const group = new THREE.Group(); group.name = 'district';
    const forgeGroup = new THREE.Group(); forgeGroup.name = 'forge-state';
    const lights: LightRecord[] = [];
    const emitters: Emitter[] = [];
    const colliders: Collider[] = [];
    const buildingsOut: DistrictBuild['buildings'] = [];
    const npcs: NpcSpawn[] = [];
    const world = new SlotSet();
    const batch = new InstanceBatch(cfg.seed ^ 0x51ed, 3);
    const obstacles: MaskObstacle[] = [];
    const sockets: Array<Socket & { building: string }> = [];
    const modules: Record<string, number> = {};
    let windows = 0;
    U.uWaterY.value = WATER_Y;

    // ---------------------------------------------------------------- street shell
    const street = composeStreet(cfg.seed);
    world.append(street.slots);
    colliders.push(...street.colliders);
    obstacles.push(...street.obstacles);
    for (const b of street.bollards) batch.add('bollard', { pos: b, yaw: rng.range(0, 6.28), scale: rng.range(0.95, 1.08), tint: [0.86, 0.9, 0.98] });
    for (const b of street.moorings) batch.add('bollard', { pos: b, yaw: 0, scale: 0.72, tint: [0.7, 0.74, 0.82] });

    // ---------------------------------------------------------------- visibility parts registry (id 0 = untracked)
    const parts: PartMeta[] = [{ kind: 'wall', tier: 0, group: '' }];
    const register = (m: PartMeta) => { parts.push(m); return parts.length - 1; };
    const partIdsByGroup = new Map<string, number[]>();
    const tierOfBuilding = new Map<string, Tier>();
    // camera-occludable set (player occlusion reveal): measured with tools/occ-inventory.mjs, deliberately tiny.
    // Static occluders are visibility parts of their own (so the merged geometry can be split by part); instanced
    // ones (the quay lamps) are one occluder per instance.
    const occDefs: OccluderDef[] = [];
    const occOfPart = new Map<number, number>();
    const registerOcc = (name: string): number => {
      const part = register({ kind: 'occluder', tier: 0, group: name, role: name });
      occOfPart.set(part, occDefs.length);
      occDefs.push({ name, kind: 'part', part, boxes: new Float32Array(0) });
      return part;
    };
    let lampBase = -1;

    // ---------------------------------------------------------------- buildings
    let tl = lap('street', t0);
    const slots = layoutSlots(rng, cfg);
    for (const s of slots) {
      const res = createMerchantBuilding({ ...s.params, seed: rng.fork(s.id).seed });
      buildingsOut.push({ id: s.id, result: res, pos: s.pos, yaw: s.yaw, mirror: s.mirror });
      const mx = (p: V3): V3 => (s.mirror ? [-p[0], p[1], p[2]] : p);
      const L = (p: V3) => xf(mx(p), s.pos, s.yaw);
      // every wall / roof of the building becomes a district-wide part (local ids are offset by `base`)
      const base = parts.length - 1, tier = TIER_OF_ROLE[s.role] ?? 1;
      const ids = res.parts.map((bp) => register({
        kind: bp.role === 'roof' ? 'roof' : bp.role === 'forge' ? 'forge' : 'wall', tier, group: s.id, floor: bp.floor,
        role: bp.role === 'left' || bp.role === 'right' ? ((bp.role === 'left') !== !!s.mirror ? 'west' : 'east') : bp.role,
      }));
      partIdsByGroup.set(s.id, ids); tierOfBuilding.set(s.id, tier);
      world.append(res.slots, mat(s.pos, s.yaw, s.mirror ? [-1, 1, 1] : 1), base);
      windows += res.windows.length;
      for (const [k, n] of Object.entries(res.stats.modules)) modules[k] = (modules[k] ?? 0) + n;
      for (const sk of res.sockets) sockets.push({ ...sk, pos: L(sk.pos), dir: dirXf(mx(sk.dir), s.yaw), building: s.id });
      if (s.role !== 'backdrop') {
        for (const l of res.lights) lights.push({ ...l, pos: L(l.pos), group: 'static' });
        for (const c of res.colliders) {
          const [x0, z0, x1, z1] = c;
          const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => L([x, 0, z]));
          colliders.push({ kind: 'rect', x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), z0: Math.min(...pts.map((p) => p[2])), z1: Math.max(...pts.map((p) => p[2])) });
        }
        obstacles.push(aabbOf(res, s.pos, s.yaw, s.mirror));
      }
    }

    // ?occtest=<building ids>: stress test of the behind-occluder bake, those buildings' front walls become occludable
    for (const id of opts.occTest ?? []) for (const p of partIdsByGroup.get(id) ?? []) if (parts[p].role === 'front') {
      occOfPart.set(p, occDefs.length);
      occDefs.push({ name: `test:${id}:${parts[p].floor}`, kind: 'part', part: p, boxes: new Float32Array(0) });
    }

    // ---------------------------------------------------------------- lamps: quay rhythm + a few wall lanterns (light is the scarce resource)
    QUAY_LAMPS_X.forEach((x) => {
      const pos: V3 = [x, 0, LAMP_Z], yaw = Math.PI / 2;
      if (lampBase < 0) lampBase = occDefs.length;
      occDefs.push({ name: `lamp@${x}`, kind: 'instance', boxes: new Float32Array(0) });
      batch.add('lampPost', { pos, yaw, scale: 1 }, 0);
      const lp = xf([0.52, 3.2 - 0.38, 0], pos, yaw);
      const far = x > WALK.x1;
      lights.push({ pos: lp, color: LAMP_WARM, intensity: far ? 3.6 : 4.4, radius: far ? 10 : 11.5, kind: 'lantern', halo: far ? 1.6 : 2.0, priority: far ? 4 : 6, group: 'static' });
      if (!far) { colliders.push({ kind: 'circle', x, z: pos[2], r: 0.3 }); obstacles.push({ x0: x - 0.25, x1: x + 0.25, z0: pos[2] - 0.25, z1: pos[2] + 0.25, grime: 0.4 }); }
    });
    // wall lanterns: lit near the anchor and at the far end, dark elsewhere (hierarchy, not uniform sprinkle)
    const wallLamps = sockets.filter((s) => s.kind === 'lamp' && !s.building.startsWith('bg'));
    const ax = HERO_STALL.pos[0];
    const ranked = [...wallLamps].sort((a, b) => Math.abs(a.pos[0] - ax) - Math.abs(b.pos[0] - ax));
    const litSet = new Set(ranked.slice(0, 3));
    for (const s of wallLamps) {
      if (!litSet.has(s)) { batch.add('lanternDark', { pos: [s.pos[0], s.pos[1] - 0.2, s.pos[2]], yaw: 0 }, 0); continue; }
      batch.add('lantern', { pos: [s.pos[0], s.pos[1] - 0.22, s.pos[2]], yaw: Math.atan2(s.dir[0], s.dir[2]) }, 0);
      lights.push({ pos: [s.pos[0], s.pos[1] + 0.02, s.pos[2]], color: LAMP_WARM, intensity: 2.3, radius: 8, kind: 'lantern', halo: 1.4, priority: 5, group: 'static' });
    }

    tl = lap('buildings', tl);
    // ---------------------------------------------------------------- market anchor, forge yard, banners, boat, distant city
    buildMarket(rng.fork('market'), cfg, sockets, world, batch, lights, colliders, obstacles, npcs, emitters);
    buildBanners(rng.fork('banners'), cfg, buildingsOut, sockets, world);
    {
      const bt = boat(rng.fork('boat'));
      const rigPart = registerOcc('boat-rig'), bannerPart = registerOcc('boat-banner');
      world.append(bt.S, mat(BOAT_POS, 0), rigPart - 1);
      const at = (p: V3): V3 => [BOAT_POS[0] + p[0], BOAT_POS[1] + p[1], BOAT_POS[2] + p[2]];
      const lp = at(bt.lantern);
      batch.add('lantern', { pos: [lp[0], lp[1] - 0.3, lp[2]], yaw: 0.3 }, 0);
      lights.push({ pos: [lp[0], lp[1] - 0.12, lp[2]], color: LAMP_WARM, intensity: 2.4, radius: 7.5, kind: 'lantern', halo: 1.3, priority: 7, group: 'static' });
      // the canal's banner: indigo with the ivory fleur, hung from the yard and facing down the quay
      world.inPart(bannerPart, () => addBanner(world, { pos: at(bt.yard), yaw: -Math.PI / 2, w: 1.2, h: 1.95, emblem: 'fleur', shape: 'swallow', loose: 0.55, rod: false }));
      // mooring lines from bow and stern to the coping
      for (const [end, bx] of [[bt.stern, BOAT_POS[0] - 3.5], [bt.bow, BOAT_POS[0] + 3.3]] as Array<[V3, number]>) {
        const a: V3 = [bx, 0.75, QUAY_Z + 0.12], b = at(end);
        const pts: V3[] = [];
        for (let i = 0; i <= 10; i++) { const t = i / 10; pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - 0.28 * Math.sin(t * Math.PI), a[2] + (b[2] - a[2]) * t]); }
        world.cloth.sweep(pts, 0.022, 4, { tint: [0.5, 0.48, 0.46] });
        batch.add('bollard', { pos: [bx, 0.12, QUAY_Z + 0.1], yaw: 0, scale: 0.8, tint: [0.78, 0.82, 0.9] });
      }
    }
    const city = buildDistantCity(rng.fork('city'), lib, cfg, register);

    tl = lap('props+city', tl);
    // ---------------------------------------------------------------- ground: one clear playable plane
    const wet = cfg.wetness;
    // puddles are authored where they catch the anchor's light and the lamp rhythm
    const puddles: MaskBlob[] = [
      { x: -2.6, z: 0.7, r: 2.1, amount: 1 }, { x: -9.4, z: 2.6, r: 1.7, amount: 0.9 }, { x: 0.4, z: 2.7, r: 1.5, amount: 0.85 }, { x: 8.8, z: 1.9, r: 2.2, amount: 0.95 },
      { x: 17.6, z: 2.2, r: 1.8, amount: 0.9 }, { x: 24.4, z: 0.9, r: 1.6, amount: 0.85 }, { x: -15.2, z: 1.8, r: 1.6, amount: 0.85 },
    ];
    const path: Array<[number, number]> = [[-18, 1.4], [-9, 1.2], [0, 0.9], [9, 1.2], [18, 0.6], [27, 1.0]];
    const maskW = 640, maskH = Math.round(640 * (GROUND_RECT.h / GROUND_RECT.w));
    const maskData = makeGroundMask(cfg.seed, GROUND_RECT, maskW, maskH, obstacles, puddles, path, wet);
    tl = lap('mask', tl);
    const maskTex = new THREE.DataTexture(maskData, maskW, maskH, THREE.RGBAFormat, THREE.UnsignedByteType);
    maskTex.colorSpace = THREE.NoColorSpace; maskTex.magFilter = THREE.LinearFilter; maskTex.minFilter = THREE.LinearMipmapLinearFilter; maskTex.generateMipmaps = true; maskTex.anisotropy = 4;
    maskTex.wrapS = maskTex.wrapT = THREE.ClampToEdgeWrapping; maskTex.needsUpdate = true;
    lib.ground.uniforms.tGroundMask.value = maskTex;
    lib.ground.uniforms.uGroundRect.value.set(GROUND_RECT.x0, GROUND_RECT.z0, GROUND_RECT.w, GROUND_RECT.h);

    const g = new THREE.PlaneGeometry(QUAY_END_X - STREET.x0, QUAY_Z + 0.2 - STREET.z0); g.rotateX(-Math.PI / 2); g.translate((STREET.x0 + QUAY_END_X) / 2, 0, (STREET.z0 + QUAY_Z + 0.2) / 2);
    const groundMesh = new THREE.Mesh(g, lib.ground); groundMesh.name = 'ground'; groundMesh.layers.set(LAYER_NOREFLECT); groundMesh.frustumCulled = false;
    // canal + river basin as one strip following both shorelines
    const W = new MeshBuilder();
    const xs: number[] = [];
    for (let x = STREET.x0 - 30; x < 26; x += 6) xs.push(x);
    for (let x = 26; x <= RIVER_END_X; x += 2) xs.push(x);
    W.grid([0, 1].map((k) => xs.map((x) => [x, WATER_Y, k ? southShore(x) + 0.2 : QUAY_Z + 0.3] as V3)), { flip: true });
    const water = new THREE.Mesh(W.toGeometry(), lib.water); water.name = 'canal'; water.layers.set(LAYER_NOREFLECT); water.frustumCulled = false;
    group.add(groundMesh, water);

    // ---------------------------------------------------------------- visibility bake (camera graph -> visible sets)
    tl = lap('ground+water', tl);
    const casts = (s: string) => s !== 'decal' && s !== 'leaf' && s !== 'cloth' && s !== 'banner';
    let vis: VisResult | null = null;
    // occluder proxies: voxelised vertices of each static occluder part (the instanced lamps are filled in below)
    for (const d of occDefs) {
      if (d.kind !== 'part') continue;
      const arr: number[] = [];
      for (const s of SLOTS) { const b = world.get(s); if (b.vertexCount) arr.push(...voxelBoxes(b.pos, (v) => b.part[v] === d.part)); }
      d.boxes = new Float32Array(arr);
    }
    if (occDefs.length > OCC_MAX) throw new Error(`occluder table overflow (${occDefs.length} > ${OCC_MAX})`);
    if (bake) {
      const bs = new THREE.Scene();
      const disposables: Array<{ dispose(): void }> = [];
      const addId = (b: MeshBuilder, side: THREE.Side, to: THREE.Scene = bs, material?: THREE.ShaderMaterial) => {
        if (!b.vertexCount) return;
        const geo = b.toPartGeometry(), m = material ?? idMaterial(side);
        disposables.push(geo); if (!material) disposables.push(m);
        const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; to.add(mesh);
      };
      const sideOf = (s: Slot) => (s === 'cloth' || s === 'banner' || s === 'leaf' ? THREE.DoubleSide : THREE.FrontSide);
      for (const s of SLOTS) if (s !== 'decal') addId(world.get(s), sideOf(s));
      addId(city.builder, THREE.DoubleSide);
      // behind-occluder pass: the same world minus the occludable parts, ID'd only inside the player-reveal windows
      let behind: Pick<BehindPass, 'scene' | 'uniforms'> | undefined;
      if (occOfPart.size) {
        const scene = new THREE.Scene(), uniforms = behindUniforms();
        for (const s of SLOTS) if (s !== 'decal') {
          const b = world.get(s);
          if (!b.vertexCount) continue;
          const mt = windowIdMaterial(sideOf(s), uniforms); disposables.push(mt);
          addId(b.part.some((p) => occOfPart.has(p)) ? b.partition((p) => (occOfPart.has(p) ? -1 : 0), 1)[0] : b, sideOf(s), scene, mt);
        }
        const mc = windowIdMaterial(THREE.DoubleSide, uniforms); disposables.push(mc);
        addId(city.builder, THREE.DoubleSide, scene, mc);
        behind = { scene, uniforms };
      }
      vis = bake(bs, parts.length - 1, behind);
      for (const d of disposables) d.dispose();
    }
    tl = lap('visibility bake', tl);

    // ---------------------------------------------------------------- meshes, ordered by visibility class
    // each static mesh holds its triangles class by class (a class = the set of framings that need the part, see planDraw);
    // a framing is one drawRange (the prefix up to its last class). Tier 3 (never visible) parts are cut from every
    // per-frame pass; the shadow casters among them live on only for the one-off moon-shadow render (layer CAST only)
    // and are disposed right after it.
    const partMask = parts.map((_, p) => (vis ? needMask(vis, p) : ALL_MASK));
    const trisByMask = new Map<number, number>(), partsByMask = new Map<number, number>();
    for (let p = 1; p < parts.length; p++) partsByMask.set(partMask[p], (partsByMask.get(partMask[p]) ?? 0) + 1);
    for (const m of partsByMask.keys()) trisByMask.set(m, 0);
    const countTris = (b: MeshBuilder) => { for (let i = 0; i < b.idx.length; i += 3) { const m = partMask[Math.max(0, b.part[b.idx[i]])]; trisByMask.set(m, (trisByMask.get(m) ?? 0) + 1); } };
    for (const s of SLOTS) if (s !== 'decal') countTris(world.get(s));
    countTris(city.builder);
    const plan = planDraw(trisByMask), nCls = plan.order.length;
    const classOf = (p: number) => plan.classOfMask(partMask[Math.max(0, p)]);
    const ranged: THREE.Mesh[] = [];
    const shadowOnly: THREE.Mesh[] = [];
    const maskName = (m: number) => SETS.filter((_, i) => m & (1 << i)).join('+');
    const cfgs: CamId[][] = FRAMINGS.map((f) => [f]).concat([['A', 'B'], ['B', 'C'], ['C', 'D'], ['B', 'D']]);
    const visStats = {
      parts: parts.length - 1, hidden: partsByMask.get(0) ?? 0, trisKept: 0, trisHidden: 0,
      classes: plan.order.map((m) => ({ mask: maskName(m), parts: partsByMask.get(m) ?? 0, tris: 0 })),
      hi: Object.fromEntries(cfgs.map((c) => [c.join(''), plan.hiOf(c)])), drawn: Object.fromEntries(cfgs.map((c) => [c.join(''), plan.drawnOf(c)])), levels: nCls,
    };
    const occMeshes: OccMeshRef[] = [];
    // `occSlot`: the occludable parts of this builder get a mesh of their own (same slot) whose vertices carry the
    // occluder index (`aOcc`); it is only drawn while a reveal is active. While idle the main mesh draws them itself from
    // a prefix block [occludable, class by class | the other classes] (drawRange start 0), so an idle frame has exactly Pass 2's draws;
    // while active the main mesh skips the prefix (drawRange start = prefix length) and the occluder mesh takes over.
    const addRanged = (b: MeshBuilder, material: THREE.Material, name: string, cast: boolean, layer0Only = false, occSlot?: Slot) => {
      let occB: MeshBuilder | null = null;
      if (occSlot && occOfPart.size && b.part.some((p) => occOfPart.has(p))) { const sp = b.partition((p) => (occOfPart.has(p) ? 1 : 0), 2); b = sp[0]; occB = sp[1]; }
      let prefix: MeshBuilder | undefined;
      if (occB) { prefix = new MeshBuilder(); if (vis) { const sp = occB.partition(classOf, nCls + 1); for (let k = 0; k < nCls; k++) prefix.append(sp[k]); } else prefix.append(occB); }
      const emit = (src: MeshBuilder, nm: string, occ: boolean, pre?: MeshBuilder) => {
        let merged = src, h = new MeshBuilder();
        // cumulative index count after each class: a draw level n draws the first n classes
        let ends = [src.idx.length];
        if (vis) {
          const sp = src.partition(classOf, nCls + 1);
          merged = new MeshBuilder(); h = sp[nCls]; ends = [];
          for (let k = 0; k < nCls; k++) { merged.append(sp[k]); ends.push(merged.idx.length); visStats.classes[k].tris += sp[k].triCount; }
        }
        visStats.trisKept += (ends[ends.length - 1] ?? 0) / 3; visStats.trisHidden += h.triCount;
        let P = 0;
        if (pre && pre.vertexCount) { const f = new MeshBuilder(); f.append(pre); P = f.idx.length; f.append(merged); merged = f; }
        if (merged.vertexCount) {
          const mesh = new THREE.Mesh(occ ? merged.toOccGeometry((p) => occOfPart.get(p) ?? 0) : merged.toGeometry(), material);
          mesh.name = nm; mesh.frustumCulled = false;
          if (layer0Only) mesh.layers.set(0); else if (cast) mesh.layers.enable(LAYER_CAST);
          mesh.userData.ranges = ends; mesh.userData.prefix = P;
          group.add(mesh); ranged.push(mesh);
          if (occ) { mesh.visible = false; occMeshes.push({ mesh, base: material, variant: lib.occVariant(occSlot!, false), hideWhenIdle: true }); }
        }
        if (cast && h.vertexCount) {
          const sh = new THREE.Mesh(h.toGeometry(), material);
          sh.name = `${nm}:shadow-only`; sh.frustumCulled = false; sh.layers.set(LAYER_CAST);
          group.add(sh); shadowOnly.push(sh);
        }
      };
      emit(b, name, false, prefix);
      if (occB) emit(occB, `occ:${name}`, true);
    };
    for (const s of SLOTS) if (s !== 'decal') addRanged(world.get(s), lib.slot[s], `static:${s}`, casts(s), false, s);
    {
      const b = world.decal;
      if (b.vertexCount) { const mesh = new THREE.Mesh(b.toGeometry(), lib.slot.decal); mesh.name = 'static:decal'; mesh.frustumCulled = false; mesh.layers.set(LAYER_NOREFLECT); mesh.renderOrder = 2; group.add(mesh); }
    }
    for (const s of SLOTS) {
      const b = street.decals.get(s);
      if (!b.vertexCount) continue;
      const mesh = new THREE.Mesh(b.toGeometry(), lib.slot[s]);
      mesh.name = `street:${s}`; mesh.frustumCulled = false;
      if (s === 'decal') { mesh.layers.set(LAYER_NOREFLECT); mesh.renderOrder = 2; }
      group.add(mesh);
    }
    const props = batch.build(lib.slot, (o, s) => { if (s !== 'leaf' && s !== 'cloth' && s !== 'glow') o.layers.enable(LAYER_CAST); });
    group.add(props);
    // the quay lamps: one prototype ('lampPost#0'), so its draws just swap to the occludable twin (no extra draw call);
    // each instance is its own occluder (index lampBase + instance id), proxied from its transformed vertices
    if (lampBase >= 0) {
      const pts: number[][] = QUAY_LAMPS_X.map(() => []);
      const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3();
      for (const o of props.children) {
        const im = o as THREE.InstancedMesh;
        if (!im.isInstancedMesh || !im.name.startsWith('lampPost#0:')) continue;
        const slot = im.name.split(':')[1] as Slot, pos = im.geometry.attributes.position;
        const variant = lib.occVariant(slot, true);
        variant.uniforms.uOccBase.value = lampBase;
        occMeshes.push({ mesh: im, base: im.material as THREE.Material, variant });
        for (let k = 0; k < im.count; k++) {
          im.getMatrixAt(k, m4);
          for (let i = 0; i < pos.count; i++) { v3.fromBufferAttribute(pos, i).applyMatrix4(m4); pts[k].push(v3.x, v3.y, v3.z); }
        }
      }
      pts.forEach((p, k) => { occDefs[lampBase + k].boxes = voxelBoxes(p, () => true, 0.4); });
    }
    // layer 0 only: the city and bridges are reflected in the canal but cast no moon shadow
    addRanged(city.builder, city.material, 'far-city', false, true);

    // ---------------------------------------------------------------- forge (state-dependent)
    let forgeProps = buildForgeProps(rng.fork('forge'), cfg.forgeState, buildingsOut.find((b) => b.id === 'forge')!, sockets, lib, lights, emitters, colliders, npcs, obstacles, forgeGroup);
    group.add(forgeGroup);

    // smoke from chimneys: the backdrop's thinner, so the frontage keeps the motion
    for (const s of sockets.filter((q) => q.kind === 'smoke' && q.building !== 'forge')) emitters.push({ kind: 'chimney', pos: s.pos, rate: s.building.startsWith('bg') ? 0.35 : 0.7, tag: s.building });

    let tris = 0;
    group.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && !shadowOnly.includes(m)) { const idx = m.geometry.index; const base = idx ? idx.count / 3 : m.geometry.attributes.position.count / 3; tris += base * ((m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1); } });

    // per-building report: which tier it was authored at and how much of it any authored view can see
    const report = buildingsOut.map((b) => {
      const ids = partIdsByGroup.get(b.id) ?? [];
      const seen = (set: VisSet) => ids.reduce((a, p) => a + (vis ? vis.counts[set][p] : 1), 0);
      return { id: b.id, tier: tierOfBuilding.get(b.id) ?? 0, parts: ids.length, hidden: ids.filter((p) => partMask[p] === 0).length, px: { A: seen('A'), B: seen('B'), C: seen('C'), D: seen('D') } };
    });
    const farGroups = new Map<string, { tier: Tier; total: number; hidden: number }>();
    for (let p = 1; p < parts.length; p++) {
      const m = parts[p];
      if (m.kind === 'wall' || m.kind === 'roof' || m.kind === 'forge') continue;
      const e = farGroups.get(m.group) ?? { tier: m.tier, total: 0, hidden: 0 };
      e.total++; if (partMask[p] === 0) e.hidden++;
      farGroups.set(m.group, e);
    }
    let curLevel = nCls, occActive = false;
    const applyRanges = () => { for (const m of ranged) { const r = m.userData.ranges as number[], P = (m.userData.prefix as number) ?? 0, n = curLevel > 0 && r.length ? r[Math.min(curLevel, r.length) - 1] : 0; m.geometry.setDrawRange(occActive ? P : 0, n + (occActive ? 0 : P)); } };
    const setLevel = (level: number) => { curLevel = level; applyRanges(); };
    const setOccActive = (a: boolean) => { occActive = a; for (const m of occMeshes) if (m.hideWhenIdle) m.mesh.visible = a; applyRanges(); };

    // behind-occluder support: parts the front-most bake alone would have dropped but the reveal windows can expose
    let behindReport: VisibilityReport['behind'] = null;
    if (vis?.behind) {
      const bare = { ...vis, behind: undefined } as VisResult, restored = new Set<number>();
      for (let p = 1; p < parts.length; p++) if (needMask(bare, p) === 0 && partMask[p] !== 0) restored.add(p);
      let rt = 0;
      for (const s of SLOTS) { const b = world.get(s); for (let i = 0; i < b.idx.length; i += 3) if (restored.has(b.part[b.idx[i]])) rt++; }
      let px = 0;
      for (const s of vis.behind ? (Object.keys(vis.behind) as VisSet[]) : []) for (let i = 1; i < vis.behind[s].length; i++) px += vis.behind[s][i];
      behindReport = { parts: restored.size, tris: rt, occludable: occOfPart.size, px };
    }

    const forgeB = buildingsOut.find((b) => b.id === 'forge')!;
    const out: DistrictBuild = {
      group, forgeGroup, lights, emitters, colliders, buildings: buildingsOut, npcs, spawn: [-7.5, 0, 1.8], walk: street.walkable, streetPath: path,
      stats: { triangles: tris, instances: batch.instanceCount, buildings: buildingsOut.length, generatorMs: performance.now() - t0, windows, modules, timings: tm },
      visibility: { ...visStats, bakeMs: vis?.ms ?? 0, bakeSplit: vis?.split ?? null, poses: vis?.poses ?? 0, bakePages: vis?.pages ?? 0, bakeTargetBytes: vis?.targetBytes ?? 0, buildings: report, background: Object.fromEntries(farGroups), registry: parts, counts: vis?.counts ?? null, behind: behindReport },
      occluders: { defs: occDefs, meshes: occMeshes },
      setLevel, levelOf: (ids) => plan.hiOf(ids), setOccActive,
      releaseShadowOnly: () => { for (const m of shadowOnly) { group.remove(m); m.geometry.dispose(); } shadowOnly.length = 0; },
      heightAt: () => 0,
      forgeFocus: xf([forgeB.mirror ? -1.4 : 1.4, 1.0, 1.0], forgeB.pos, forgeB.yaw), forgeProps, banners: null,
      dispose: () => {
        group.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.geometry) m.geometry.dispose(); });
        city.material.dispose(); maskTex.dispose(); batch.dispose();
      },
      rebuildForge: (state: ForgeState) => {
        forgeProps?.dispose();
        for (let i = lights.length - 1; i >= 0; i--) if (lights[i].group === 'forge') lights.splice(i, 1);
        for (let i = emitters.length - 1; i >= 0; i--) if (emitters[i].kind === 'forge' || emitters[i].tag === 'forge') emitters.splice(i, 1);
        for (let i = npcs.length - 1; i >= 0; i--) if (npcs[i].role.startsWith('forge')) npcs.splice(i, 1);
        for (let i = colliders.length - 1; i >= 0; i--) if ((colliders[i] as any).tag === 'forge') colliders.splice(i, 1);
        forgeProps = buildForgeProps(rng.fork('forge'), state, forgeB, sockets, lib, lights, emitters, colliders, npcs, obstacles, forgeGroup);
        out.forgeProps = forgeProps;
      },
    };
    return out;
  }
}
