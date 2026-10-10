import * as THREE from 'three';
import { Rng } from '../core/rng';
import { SlotSet, SLOTS, mat, type V3, type Slot } from '../core/MeshBuilder';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import { createMerchantBuilding } from '../architecture/BuildingGenerator';
import type { BuildingParams, BuildingResult, ShopType, RoofStyle, PaletteName, Socket } from '../architecture/Types';
import { composeStreet, makeGroundMask, GROUND_RECT, TERRACE, QUAY_Z, WATER_Y, NEAR_BANK_Z, type Collider, type MaskObstacle, type MaskBlob } from '../architecture/StreetComposer';
import { InstanceBatch } from '../props/PropGenerator';
import type { LightDef } from '../atmosphere/LightRig';
import { LAYER_CAST, LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import { buildMarket } from '../props/MarketGenerator';
import { buildForgeProps, type ForgeState } from './ForgeGenerator';
import { buildDistantCity } from './DistantCity';
import { buildVegetation } from '../props/Vegetation';
import { buildBanners } from '../props/Banners';

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

export const DEFAULT_CONFIG: DistrictConfig = {
  seed: 1842, buildingDensity: 1.0, asymmetry: 0.6, verticality: 1.0, roofExaggeration: 0.9, propDensity: 1.0, npcDensity: 1.0,
  timberRatio: 0.55, litWindows: 0.7, forgeState: 'NORMAL_FORGE', wetness: 1.0,
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
  buildings: Array<{ id: string; result: BuildingResult; pos: V3; yaw: number }>;
  npcs: NpcSpawn[];
  spawn: V3;
  stats: { triangles: number; instances: number; buildings: number; generatorMs: number; windows: number; modules: Record<string, number>; timings: Record<string, number> };
  heightAt: (x: number, z: number) => number;
  dispose(): void;
  forgeFocus: V3;
  forgeProps: { dispose(): void } | null;
  rebuildForge(state: ForgeState): void;
  streetPath: Array<[number, number]>;
  banners: THREE.Object3D | null;
}

const xf = (p: V3, pos: V3, yaw: number): V3 => { const c = Math.cos(yaw), s = Math.sin(yaw); return [pos[0] + p[0] * c + p[2] * s, pos[1] + p[1], pos[2] - p[0] * s + p[2] * c]; };
const dirXf = (d: V3, yaw: number): V3 => { const c = Math.cos(yaw), s = Math.sin(yaw); return [d[0] * c + d[2] * s, d[1], -d[0] * s + d[2] * c]; };

interface BuildingSlot {
  id: string; pos: V3; yaw: number; role: string;
  params: Omit<BuildingParams, 'seed'>;
}

/** The art-directed slot layout: positions and roles are fixed by composition, everything inside them is seeded. */
function layoutSlots(rng: Rng, cfg: DistrictConfig): BuildingSlot[] {
  const r = rng.fork('slots');
  const v = cfg.verticality;
  const flo = (a: number, b: number) => Math.max(1, Math.round(r.range(a, b) * v));
  const pal = (): PaletteName => r.pick<PaletteName>(['cream', 'ochre', 'sage', 'rose', 'slate', 'lime']);
  const mid: ShopType[] = ['apothecary', 'tailor', 'general', 'tavern'];
  const shops = r.shuffle([...mid]);
  const common = { asymmetry: cfg.asymmetry, timberRatio: cfg.timberRatio, roofExaggeration: cfg.roofExaggeration, verticality: 1, lit: cfg.litWindows };
  const slots: BuildingSlot[] = [
    {
      id: 'guild', pos: [-7.4, 0, -1.6], yaw: Math.PI / 2, role: 'landmark-left',
      params: { ...common, floors: flo(3, 3.6), width: r.range(9, 10.5), depth: 6.5, overhang: 0.55 + r.range(0, 0.25), shopType: 'guild', roofStyle: r.weighted<RoofStyle>(['crooked', 'hip', 'gable'], [3, 2, 2]), stoneGround: true, chimney: true, balcony: true, dormers: Math.round(1 * cfg.buildingDensity), palette: pal(), sides: { left: true, right: true } },
    },
    {
      id: 'shopA', pos: [-0.3, 0, -4.3], yaw: 0, role: 'center-back',
      params: { ...common, floors: flo(2, 2.6), width: r.range(6.4, 7.6), overhang: 0.35 + r.range(0, 0.3), shopType: shops[0], roofStyle: r.weighted<RoofStyle>(['gable', 'crooked'], [3, 2]), stoneGround: false, chimney: r.bool(0.8), balcony: r.bool(0.4), dormers: Math.round(r.range(1, 2) * cfg.buildingDensity), palette: pal(), sides: { left: true, right: false } },
    },
    {
      id: 'tall', pos: [4.9, 0, -5.2], yaw: 0, role: 'narrow-tall',
      params: { ...common, floors: flo(3, 3.8), width: r.range(3.4, 4.2), overhang: 0.6 + r.range(0, 0.3), shopType: shops[1], roofStyle: r.weighted<RoofStyle>(['gableFront', 'crooked'], [3, 2]), chimney: r.bool(0.6), balcony: false, dormers: 0, palette: pal(), sides: { left: false, right: false } },
    },
    {
      id: 'forge', pos: [11.0, 0, -3.8], yaw: 0, role: 'forge',
      params: { ...common, floors: 1, width: 7.8, depth: 3.8, roofTint: [1.45, 1.02, 0.86], overhang: 0, shopType: 'smith', roofStyle: 'leanto', stoneGround: true, forgeBay: true, chimney: true, balcony: false, dormers: 0, palette: 'slate', timberRatio: 0.4, sides: { left: true, right: true }, asymmetry: 0.25 },
    },
  ];
  const extras = Math.round(1 + 2 * cfg.buildingDensity);
  const back: Array<Partial<BuildingSlot> & { pos: V3 }> = [
    { pos: [-0.5, 0, -12.8], yaw: 0 }, { pos: [6.2, 0, -13.2], yaw: 0 }, { pos: [-6.4, 2.9, -12.4], yaw: 0 }, { pos: [-9.5, 0, -11.2], yaw: 0 }, { pos: [12.6, 0, -11.4], yaw: 0 },
  ];
  for (let i = 0; i < Math.min(extras, back.length); i++) {
    const b = back[i];
    slots.push({
      id: `bg${i}`, pos: b.pos, yaw: b.yaw ?? 0, role: 'backdrop',
      params: { ...common, floors: flo(2.5, 4.2), width: r.range(5.5, 8), overhang: r.range(0.3, 0.8), shopType: 'house', roofStyle: r.weighted<RoofStyle>(['gable', 'crooked', 'gableFront', 'hip'], [3, 2, 2, 1]), stoneGround: r.bool(0.3), chimney: r.bool(0.7), balcony: false, dormers: r.int(0, 2), palette: pal(), detail: 0.45, sides: { left: true, right: true } },
    });
  }
  return slots;
}

function aabbOf(res: BuildingResult, pos: V3, yaw: number): MaskObstacle {
  const [x0, z0, x1, z1] = res.colliders[0];
  const pts: V3[] = [[x0, 0, z0], [x1, 0, z0], [x1, 0, z1], [x0, 0, z1]].map((p) => xf(p as V3, pos, yaw));
  return { x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), z0: Math.min(...pts.map((p) => p[2])), z1: Math.max(...pts.map((p) => p[2])), grime: 0.7 };
}

export class MerchantDistrictGenerator {
  constructor(private lib: MaterialLibrary) {}

  generate(cfg: DistrictConfig): DistrictBuild {
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

    // ---------------------------------------------------------------- street shell
    const street = composeStreet(cfg.seed, cfg.buildingDensity);
    world.append(street.slots);
    colliders.push(...street.colliders);
    obstacles.push(...street.obstacles);
    for (const b of street.bollards) batch.add('bollard', { pos: b, yaw: rng.range(0, 6.28), scale: rng.range(0.95, 1.1), tint: [rng.range(0.85, 1), rng.range(0.85, 1), rng.range(0.9, 1.05)] });
    for (const b of street.nearBollards) batch.add('bollard', { pos: b, yaw: rng.range(0, 6.28), scale: rng.range(1.5, 1.8), tint: [0.7, 0.72, 0.8] });

    // ---------------------------------------------------------------- buildings
    let tl = lap('street', t0);
    const slots = layoutSlots(rng, cfg);
    for (const s of slots) {
      const res = createMerchantBuilding({ ...s.params, seed: rng.fork(s.id).seed });
      buildingsOut.push({ id: s.id, result: res, pos: s.pos, yaw: s.yaw });
      world.append(res.slots, mat(s.pos, s.yaw));
      windows += res.windows.length;
      for (const [k, n] of Object.entries(res.stats.modules)) modules[k] = (modules[k] ?? 0) + n;
      for (const sk of res.sockets) sockets.push({ ...sk, pos: xf(sk.pos, s.pos, s.yaw), dir: dirXf(sk.dir, s.yaw), building: s.id });
      if (s.role !== 'backdrop') {
        for (const l of res.lights) lights.push({ ...l, pos: xf(l.pos, s.pos, s.yaw), group: 'static' });
        for (const c of res.colliders) {
          const [x0, z0, x1, z1] = c;
          const pts = [[x0, z0], [x1, z0], [x1, z1], [x0, z1]].map(([x, z]) => xf([x, 0, z], s.pos, s.yaw));
          colliders.push({ kind: 'rect', x0: Math.min(...pts.map((p) => p[0])), x1: Math.max(...pts.map((p) => p[0])), z0: Math.min(...pts.map((p) => p[2])), z1: Math.max(...pts.map((p) => p[2])) });
        }
        obstacles.push(aabbOf(res, s.pos, s.yaw));
      }
    }

    // ---------------------------------------------------------------- lamps: post + wall lanterns (lights are the scarce resource)
    const lampSpecs: Array<{ pos: V3; yaw: number }> = [
      { pos: [-3.6, 0, 0.9], yaw: 0.5 }, { pos: [2.6, 0, -1.8], yaw: 3.4 }, { pos: [9.2, 0, 1.9], yaw: 2.2 }, { pos: [-5.9, 0, -3.5], yaw: 3.9 },
    ];
    for (const l of lampSpecs) {
      batch.add('lampPost', { pos: l.pos, yaw: l.yaw, scale: 1 }, 0);
      const H = 3.2, reach = 0.52;
      const lp = xf([reach, H - 0.58 + 0.2, 0], l.pos, l.yaw);
      lights.push({ pos: lp, color: [1.0, 0.6, 0.27], intensity: 4.6, radius: 12, kind: 'lantern', halo: 2.2, priority: 6, group: 'static' });
      colliders.push({ kind: 'circle', x: l.pos[0], z: l.pos[2], r: 0.3 });
      obstacles.push({ x0: l.pos[0] - 0.25, x1: l.pos[0] + 0.25, z0: l.pos[2] - 0.25, z1: l.pos[2] + 0.25, grime: 0.4 });
    }
    const wallLamps = sockets.filter((s) => s.kind === 'lamp' && !s.building.startsWith('bg'));
    let lampBudget = 6;
    for (const s of wallLamps) {
      if (lampBudget <= 0) { batch.add('lanternDark', { pos: [s.pos[0], s.pos[1] - 0.2, s.pos[2]], yaw: 0 }, 0); continue; }
      lampBudget--;
      batch.add('lantern', { pos: [s.pos[0], s.pos[1] - 0.22, s.pos[2]], yaw: Math.atan2(s.dir[0], s.dir[2]) }, 0);
      lights.push({ pos: [s.pos[0], s.pos[1] + 0.02, s.pos[2]], color: [1.0, 0.6, 0.27], intensity: 2.4, radius: 8.5, kind: 'lantern', halo: 1.6, priority: 5, group: 'static' });
    }
    for (const s of sockets.filter((q) => q.kind === 'lamp' && q.building.startsWith('bg'))) batch.add('lantern', { pos: [s.pos[0], s.pos[1] - 0.22, s.pos[2]], yaw: 0 }, 0);

    tl = lap('buildings', tl);
    // foreground lamp on the near bank: big, close and out of focus, like the reference's blurred hero lantern
    batch.add('lampPost', { pos: [-2.6, 0.4, 12.0], yaw: 0.6, scale: 1.5 }, 0);
    lights.push({ pos: xf([0.52 * 1.5, (3.2 - 0.38) * 1.5, 0], [-2.6, 0.4, 12.0], 0.6), color: [1.0, 0.6, 0.27], intensity: 5.5, radius: 15, kind: 'lantern', halo: 4.2, priority: 7, group: 'static' });

    // ---------------------------------------------------------------- market, forge, banners, vegetation, distant city
    const market = buildMarket(rng.fork('market'), cfg, sockets, world, batch, lights, colliders, obstacles, npcs, emitters);
    void market;
    const vegetation = buildVegetation(rng.fork('veg'), cfg, buildingsOut, world, batch, obstacles);
    void vegetation;
    buildBanners(rng.fork('banners'), cfg, buildingsOut, sockets, world);
    const city = buildDistantCity(rng.fork('city'), lib, cfg);

    tl = lap('props+city', tl);
    // ---------------------------------------------------------------- ground
    const wet = cfg.wetness;
    const puddles: MaskBlob[] = [
      { x: 6.6, z: 0.9, r: 2.2, amount: 1 }, { x: -1.2, z: 1.8, r: 1.6, amount: 0.9 }, { x: 11.5, z: 2.5, r: 2.0, amount: 0.95 }, { x: -5.4, z: -2.2, r: 1.3, amount: 0.8 },
      { x: 2.5, z: -2.6, r: 1.1, amount: 0.8 }, { x: -0.5, z: 3.2, r: 1.6, amount: 0.7 },
    ];
    const path: Array<[number, number]> = [[-6, -3.4], [-3, -1], [1, 0.5], [6, 0], [10, 0.4], [13, -1.2]];
    const maskW = 560, maskH = Math.round(560 * (GROUND_RECT.h / GROUND_RECT.w));
    const maskData = makeGroundMask(cfg.seed, GROUND_RECT, maskW, maskH, obstacles, puddles, path, wet);
    tl = lap('mask', tl);
    const maskTex = new THREE.DataTexture(maskData, maskW, maskH, THREE.RGBAFormat, THREE.UnsignedByteType);
    maskTex.colorSpace = THREE.NoColorSpace; maskTex.magFilter = THREE.LinearFilter; maskTex.minFilter = THREE.LinearMipmapLinearFilter; maskTex.generateMipmaps = true; maskTex.anisotropy = 4;
    maskTex.wrapS = maskTex.wrapT = THREE.ClampToEdgeWrapping; maskTex.needsUpdate = true;
    lib.ground.uniforms.tGroundMask.value = maskTex;
    lib.ground.uniforms.uGroundRect.value.set(GROUND_RECT.x0, GROUND_RECT.z0, GROUND_RECT.w, GROUND_RECT.h);

    const plane = (x0: number, z0: number, x1: number, z1: number, y: number, mat_: THREE.Material, name: string) => {
      const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
      const m = new THREE.Mesh(g, mat_); m.name = name; m.layers.set(LAYER_NOREFLECT); m.frustumCulled = false; return m;
    };
    const groundMesh = plane(TERRACE.x0, TERRACE.z0, TERRACE.x1, QUAY_Z + 0.2, 0, lib.ground, 'ground');
    const upper = plane(street.stairs.x0 - 0.3, street.stairs.zTop - 6, street.stairs.x1 + 0.3, street.stairs.zTop, street.stairs.yTop, lib.ground, 'upper-terrace');
    const water = plane(TERRACE.x0, QUAY_Z + 0.3, TERRACE.x1, NEAR_BANK_Z, WATER_Y, lib.water, 'canal');
    group.add(groundMesh, upper, water);

    // ---------------------------------------------------------------- meshes from slot builders
    const addSlots = (S: SlotSet, parent: THREE.Group, cast = true) => {
      for (const s of SLOTS) {
        const b = S.get(s);
        if (!b.vertexCount) continue;
        const mesh = new THREE.Mesh(b.toGeometry(), lib.slot[s]);
        mesh.name = `static:${s}`; mesh.frustumCulled = false;
        if (s === 'decal') mesh.layers.set(LAYER_NOREFLECT);
        else if (cast && s !== 'leaf' && s !== 'cloth' && s !== 'banner') mesh.layers.enable(LAYER_CAST);
        if (s === 'decal') mesh.renderOrder = 2;
        parent.add(mesh);
      }
    };
    addSlots(world, group);
    addSlots(street.decals, group, false);
    group.add(batch.build(lib.slot, (o, s) => { if (s !== 'leaf' && s !== 'cloth' && s !== 'glow') o.layers.enable(LAYER_CAST); }));
    group.add(city.group);

    // ---------------------------------------------------------------- forge (state-dependent)
    let forgeProps = buildForgeProps(rng.fork('forge'), cfg.forgeState, buildingsOut.find((b) => b.id === 'forge')!, sockets, lib, lights, emitters, colliders, npcs, obstacles, forgeGroup);
    group.add(forgeGroup);

    // smoke from chimneys
    for (const s of sockets.filter((q) => q.kind === 'smoke' && q.building !== 'forge')) emitters.push({ kind: 'chimney', pos: s.pos, rate: s.building.startsWith('bg') ? 0.5 : 0.8, tag: s.building });

    let tris = 0;
    group.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh) { const idx = m.geometry.index; const base = idx ? idx.count / 3 : m.geometry.attributes.position.count / 3; tris += base * ((m as THREE.InstancedMesh).isInstancedMesh ? (m as THREE.InstancedMesh).count : 1); } });

    const forgeB = buildingsOut.find((b) => b.id === 'forge')!;
    const out: DistrictBuild = {
      group, forgeGroup, lights, emitters, colliders, buildings: buildingsOut, npcs, spawn: [1.2, 0, 1.4], streetPath: path,
      stats: { triangles: tris, instances: batch.instanceCount, buildings: buildingsOut.length, generatorMs: performance.now() - t0, windows, modules, timings: tm },
      heightAt: (x, z) => (x > street.stairs.x0 && x < street.stairs.x1 && z < street.stairs.zBottom && z > street.stairs.zTop ? Math.max(0, (street.stairs.zBottom - z) / (street.stairs.zBottom - street.stairs.zTop) * street.stairs.yTop) : 0),
      forgeFocus: xf([1.4, 1.0, 1.0], forgeB.pos, forgeB.yaw), forgeProps, banners: null,
      dispose: () => {
        group.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.geometry) m.geometry.dispose(); });
        maskTex.dispose(); batch.dispose();
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
