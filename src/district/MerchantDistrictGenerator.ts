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
import { classify, idMaterial, CLASS_ALWAYS, CLASS_HIDDEN, CLASS_NOT_C, CLASS_ONLY_A, type PartMeta, type Tier, type VisResult } from './Visibility';
import type { VisSet } from '../app/CameraGraph';

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
  /** draw level of the static meshes: 0 = framing C, 1 = B, 2 = A (see Visibility.ts) */
  setLevel(level: 0 | 1 | 2): void;
  /** drop the Tier 3 shadow casters once the static moon shadow has been rendered */
  releaseShadowOnly(): void;
}

export interface VisibilityReport {
  parts: number; hidden: number; always: number; notC: number; onlyA: number;
  trisKept: number; trisHidden: number; trisNotC: number; trisOnlyA: number;
  bakeMs: number; poses: number; bakeSplit: VisResult['split'] | null;
  buildings: Array<{ id: string; tier: Tier; parts: number; hidden: number; px: { A: number; B: number; C: number } }>;
  background: Record<string, { tier: Tier; total: number; hidden: number }>;
  /** the part registry and raw bake counts (debug / reports) */
  registry: PartMeta[];
  counts: Record<VisSet, Uint32Array> | null;
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
  generate(cfg: DistrictConfig, bake?: (scene: THREE.Scene, nParts: number) => VisResult): DistrictBuild {
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

    // ---------------------------------------------------------------- lamps: quay rhythm + a few wall lanterns (light is the scarce resource)
    QUAY_LAMPS_X.forEach((x) => {
      const pos: V3 = [x, 0, LAMP_Z], yaw = Math.PI / 2;
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
      world.append(bt.S, mat(BOAT_POS, 0));
      const at = (p: V3): V3 => [BOAT_POS[0] + p[0], BOAT_POS[1] + p[1], BOAT_POS[2] + p[2]];
      const lp = at(bt.lantern);
      batch.add('lantern', { pos: [lp[0], lp[1] - 0.3, lp[2]], yaw: 0.3 }, 0);
      lights.push({ pos: [lp[0], lp[1] - 0.12, lp[2]], color: LAMP_WARM, intensity: 2.4, radius: 7.5, kind: 'lantern', halo: 1.3, priority: 7, group: 'static' });
      // the canal's banner: indigo with the ivory fleur, hung from the yard and facing down the quay
      addBanner(world, { pos: at(bt.yard), yaw: -Math.PI / 2, w: 1.2, h: 1.95, emblem: 'fleur', shape: 'swallow', loose: 0.55, rod: false });
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
    if (bake) {
      const bs = new THREE.Scene();
      const disposables: Array<{ dispose(): void }> = [];
      const addId = (b: MeshBuilder, side: THREE.Side) => {
        if (!b.vertexCount) return;
        const geo = b.toPartGeometry(), m = idMaterial(side);
        disposables.push(geo, m);
        const mesh = new THREE.Mesh(geo, m); mesh.frustumCulled = false; bs.add(mesh);
      };
      for (const s of SLOTS) if (s !== 'decal') addId(world.get(s), s === 'cloth' || s === 'banner' || s === 'leaf' ? THREE.DoubleSide : THREE.FrontSide);
      addId(city.builder, THREE.DoubleSide);
      vis = bake(bs, parts.length - 1);
      for (const d of disposables) d.dispose();
    }
    tl = lap('visibility bake', tl);

    // ---------------------------------------------------------------- meshes, ordered by visibility class
    // each static mesh holds [always | notC | onlyA]; a framing is one drawRange. Tier 3 (never visible) parts
    // are cut from every per-frame pass; the shadow casters among them live on only for the one-off moon-shadow
    // render (layer CAST only) and are disposed right after it.
    const classOf = (p: number) => (vis ? classify(vis, p) : CLASS_ALWAYS);
    const ranged: THREE.Mesh[] = [];
    const shadowOnly: THREE.Mesh[] = [];
    const visStats = { parts: parts.length - 1, hidden: 0, notC: 0, onlyA: 0, always: 0, trisKept: 0, trisHidden: 0, trisNotC: 0, trisOnlyA: 0 };
    for (let p = 1; p < parts.length; p++) {
      const k = classOf(p);
      if (k === CLASS_HIDDEN) visStats.hidden++; else if (k === CLASS_NOT_C) visStats.notC++; else if (k === CLASS_ONLY_A) visStats.onlyA++; else visStats.always++;
    }
    const addRanged = (b: MeshBuilder, material: THREE.Material, name: string, cast: boolean, layer0Only = false) => {
      let merged = b, h = new MeshBuilder(), r0 = b.idx.length, r1 = r0, r2 = r0;
      if (vis) {
        const [a, n, o, hid] = b.partition(classOf, 4);
        merged = new MeshBuilder(); h = hid;
        merged.append(a); r0 = merged.idx.length;
        merged.append(n); r1 = merged.idx.length;
        merged.append(o); r2 = merged.idx.length;
      }
      visStats.trisKept += r2 / 3; visStats.trisNotC += (r1 - r0) / 3; visStats.trisOnlyA += (r2 - r1) / 3; visStats.trisHidden += h.triCount;
      if (merged.vertexCount) {
        const mesh = new THREE.Mesh(merged.toGeometry(), material);
        mesh.name = name; mesh.frustumCulled = false;
        if (layer0Only) mesh.layers.set(0); else if (cast) mesh.layers.enable(LAYER_CAST);
        mesh.userData.ranges = [r0, r1, r2];
        group.add(mesh); ranged.push(mesh);
      }
      if (cast && h.vertexCount) {
        const sh = new THREE.Mesh(h.toGeometry(), material);
        sh.name = `${name}:shadow-only`; sh.frustumCulled = false; sh.layers.set(LAYER_CAST);
        group.add(sh); shadowOnly.push(sh);
      }
    };
    for (const s of SLOTS) if (s !== 'decal') addRanged(world.get(s), lib.slot[s], `static:${s}`, casts(s));
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
    group.add(batch.build(lib.slot, (o, s) => { if (s !== 'leaf' && s !== 'cloth' && s !== 'glow') o.layers.enable(LAYER_CAST); }));
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
      return { id: b.id, tier: tierOfBuilding.get(b.id) ?? 0, parts: ids.length, hidden: ids.filter((p) => classOf(p) === CLASS_HIDDEN).length, px: { A: seen('A'), B: seen('B'), C: seen('C') } };
    });
    const farGroups = new Map<string, { tier: Tier; total: number; hidden: number }>();
    for (let p = 1; p < parts.length; p++) {
      const m = parts[p];
      if (m.kind === 'wall' || m.kind === 'roof' || m.kind === 'forge') continue;
      const e = farGroups.get(m.group) ?? { tier: m.tier, total: 0, hidden: 0 };
      e.total++; if (classOf(p) === CLASS_HIDDEN) e.hidden++;
      farGroups.set(m.group, e);
    }
    const setLevel = (level: 0 | 1 | 2) => { for (const m of ranged) m.geometry.setDrawRange(0, (m.userData.ranges as number[])[level]); };

    const forgeB = buildingsOut.find((b) => b.id === 'forge')!;
    const out: DistrictBuild = {
      group, forgeGroup, lights, emitters, colliders, buildings: buildingsOut, npcs, spawn: [-7.5, 0, 1.8], walk: street.walkable, streetPath: path,
      stats: { triangles: tris, instances: batch.instanceCount, buildings: buildingsOut.length, generatorMs: performance.now() - t0, windows, modules, timings: tm },
      visibility: { ...visStats, bakeMs: vis?.ms ?? 0, bakeSplit: vis?.split ?? null, poses: vis?.poses ?? 0, buildings: report, background: Object.fromEntries(farGroups), registry: parts, counts: vis?.counts ?? null },
      setLevel,
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
