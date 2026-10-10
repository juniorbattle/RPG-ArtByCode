import * as THREE from 'three';
import { Rng } from '../core/rng';
import { SlotSet, SLOTS, mat, type V3 } from '../core/MeshBuilder';
import type { Socket, BuildingResult } from '../architecture/Types';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import type { Collider, MaskObstacle } from '../architecture/StreetComposer';
import type { LightRecord, NpcSpawn, Emitter } from './MerchantDistrictGenerator';
import { LAYER_CAST, LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import { barrel, crate, sack, bucket, lantern } from '../props/PropGenerator';
import { addBanner } from '../props/Banners';
import { atlasRect } from '../architecture/FacadeGrammar';
import { DECAL_CELLS, type DecalKind } from '../materials/CanvasArt';

export type ForgeState = 'NORMAL_FORGE' | 'SABOTAGED_FORGE';

const HOT_UV = [0.06, 0.66, 0.2, 0.66, 0.2, 0.8, 0.06, 0.8];       // bright core of the warm window cell
const EMBER_UV = [0.62, 0.62, 0.74, 0.62, 0.74, 0.7, 0.62, 0.7];  // darker orange of the hot cell

/** Forge dressing as a pure function of state: the same generated building, different props, lights,
 *  smoke, debris, signage and NPC presence. Rebuilding only touches this group. */
export function buildForgeProps(
  rng: Rng, state: ForgeState, b: { id: string; result: BuildingResult; pos: [number, number, number]; yaw: number },
  sockets: Array<Socket & { building: string }>, lib: MaterialLibrary, lights: LightRecord[], emitters: Emitter[], colliders: Collider[],
  npcs: NpcSpawn[], obstacles: MaskObstacle[], group: THREE.Group,
): { dispose(): void } {
  const sab = state === 'SABOTAGED_FORGE';
  const S = new SlotSet();
  const decals = new SlotSet();
  const sk = (tag: string) => sockets.find((s) => s.building === b.id && s.kind === 'forge' && s.tag === tag)!;
  const hearth = sk('hearth'), anvilS = sk('anvil'), rack = sk('rack'), trough = sk('trough');
  const yard = sockets.find((s) => s.building === b.id && s.tag === 'forge-yard')!;
  const place = (SS: SlotSet, p: V3, yaw = 0, scale = 1, pitch = 0, roll = 0) => S.append(SS, mat(p, yaw, scale, pitch, roll));
  const r = rng.fork(state);

  const decal = (kind: DecalKind, x: number, z: number, w: number, rot: number, alpha: number, tint: V3 = [1, 1, 1], emissive = 0) => {
    const i = DECAL_CELLS[kind]; const [u0, v0, u1, v1] = atlasRect(i % 4, Math.floor(i / 4), 4, 4, 0.002);
    const c = Math.cos(rot), s = Math.sin(rot);
    const P = ([[-w / 2, -w / 2], [w / 2, -w / 2], [w / 2, w / 2], [-w / 2, w / 2]] as Array<[number, number]>).map(([a, bb]) => [x + a * c - bb * s, 0.016, z + a * s + bb * c] as V3);
    decals.decal.quad(P[0], P[1], P[2], P[3], { uvs: [u0, v1, u1, v1, u1, v0, u0, v0], tint, ao: alpha, aux: [0, emissive, 0, 0], flip: true });
  };

  // ---------------------------------------------------------------- hearth
  const hx = hearth.pos[0], hy = hearth.pos[1], hz = hearth.pos[2];
  if (!sab) {
    // fire bed: glowing coals and a flame sheet (emissive atlas cell), driven by flickering lights + flame particles
    S.glow.quad([hx - 0.55, hy + 0.05, hz - 0.45], [hx + 0.55, hy + 0.05, hz - 0.45], [hx + 0.55, hy + 0.62, hz - 0.48], [hx - 0.55, hy + 0.62, hz - 0.48], { uvs: EMBER_UV, tint: [1.0, 0.8, 0.7], aux: [0, 1, 0.2, 0], ao: 1 });
    S.glow.blob(hx, hy + 0.09, hz + 0.0, 0.62, 0.15, 0.5, 8, 5, { uvs: HOT_UV, tint: [1.05, 0.8, 0.65], aux: [0, 1, 0.6, 0] });
    lights.push({ pos: [hx, hy + 0.7, hz + 0.9], color: [1.0, 0.44, 0.14], intensity: 10, radius: 10, kind: 'fire', halo: 2.6, priority: 10, group: 'forge' });
    lights.push({ pos: [hx - 0.4, hy + 0.25, hz + 1.9], color: [1.0, 0.5, 0.18], intensity: 3.2, radius: 4.5, kind: 'ember', halo: 0, priority: 8, group: 'forge' });
    emitters.push({ kind: 'forge', pos: [hx, hy + 0.25, hz + 0.1], rate: 1, tag: 'flame' });
    emitters.push({ kind: 'forge', pos: [hx, hy + 0.6, hz], rate: 1, tag: 'embers' });
  } else {
    // dead hearth: grey ash bed, a few dying embers, spilled brick
    S.stone.blob(hx, hy + 0.05, hz - 0.28, 0.5, 0.12, 0.3, 8, 5, { tint: [0.4, 0.4, 0.42] });
    S.glow.quad([hx - 0.18, hy + 0.1, hz - 0.1], [hx + 0.1, hy + 0.1, hz - 0.1], [hx + 0.1, hy + 0.17, hz - 0.2], [hx - 0.18, hy + 0.17, hz - 0.2], { uvs: EMBER_UV, tint: [0.5, 0.18, 0.1], aux: [0, 1, 0.3, 0], ao: 1 });
    lights.push({ pos: [hx, hy + 0.3, hz + 0.5], color: [1.0, 0.3, 0.1], intensity: 0.7, radius: 3.2, kind: 'ember', halo: 0, priority: 6, group: 'forge' });
    emitters.push({ kind: 'forge', pos: [hx, hy + 0.4, hz - 0.1], rate: 0.6, tag: 'coldSmoke' });
  }

  const chim = sockets.find((s) => s.building === b.id && s.kind === 'smoke');
  if (chim) emitters.push({ kind: 'chimney', pos: chim.pos, rate: sab ? 0.18 : 1.1, tag: 'forge' });

  // ---------------------------------------------------------------- anvil + workpiece
  const ax = anvilS.pos[0], az = anvilS.pos[2];
  const anvil = new SlotSet();
  anvil.timber.cylinder(0.27, 0, 0.55, 10, { tint: [0.85, 0.75, 0.68], ao: 0.85 });
  anvil.metal.boxMM(-0.2, 0.55, -0.14, 0.2, 0.68, 0.14, { tint: [1, 1, 1] });
  anvil.metal.boxMM(-0.13, 0.68, -0.1, 0.13, 0.78, 0.1, { tint: [1, 1, 1] });
  anvil.metal.boxMM(-0.44, 0.78, -0.12, 0.3, 0.9, 0.12, { tint: [1.1, 1.1, 1.15] });
  anvil.metal.lathe([[0.12, 0.0], [0.07, 0.35], [0.01, 0.55]], 8, { tint: [1.1, 1.1, 1.15] });
  if (!sab) {
    place(anvil, [ax, 0, az], 0.35);
    // glowing bar on the anvil face
    S.glow.boxMM(ax - 0.26, 0.91, az - 0.03, ax + 0.14, 0.945, az + 0.03, { uvs: HOT_UV, tint: [1.15, 1, 0.9], aux: [0, 1, 0.8, 0] });
    lights.push({ pos: [ax, 1.05, az + 0.2], color: [1.0, 0.5, 0.2], intensity: 1.5, radius: 2.8, kind: 'ember', halo: 0.9, priority: 7, group: 'forge' });
    emitters.push({ kind: 'forge', pos: [ax - 0.1, 0.95, az], rate: 1, tag: 'sparks' });
    colliders.push({ kind: 'circle', x: ax, z: az, r: 0.5, tag: 'forge' } as Collider);
  } else {
    place(anvil, [ax + 0.6, 0.3, az + 0.9], 1.1, 1, 0, 1.45);
    S.with(mat([ax - 0.1, 0, az]), () => S.timber.cylinder(0.27, 0, 0.55, 10, { tint: [0.85, 0.75, 0.68] }));
    S.metal.boxMM(ax + 0.2, 0.0, az + 1.2, ax + 0.6, 0.04, az + 1.26, { tint: [0.7, 0.7, 0.75] });
    colliders.push({ kind: 'circle', x: ax + 0.4, z: az + 0.6, r: 0.55, tag: 'forge' } as Collider);
    decal('scorch', ax, az + 0.2, 2.2, 0.7, 0.75);
  }

  // ---------------------------------------------------------------- tool rack + hammers + tongs
  const rx = rack.pos[0], rz = rack.pos[2];
  const toolRack = new SlotSet();
  toolRack.planks.boxMM(-0.7, 1.0, -0.03, 0.7, 1.55, 0.03, { tint: [0.8, 0.72, 0.62], grain: 'x' });
  toolRack.timber.boxMM(-0.72, 1.52, -0.05, 0.72, 1.58, 0.06, { tint: [0.85, 0.75, 0.68], grain: 'x' });
  const tools = (n: number) => {
    for (let i = 0; i < n; i++) {
      const x = -0.55 + (i * 1.1) / Math.max(1, n - 1);
      if (i % 2 === 0) {
        toolRack.timber.boxMM(x - 0.012, 1.0, 0.03, x + 0.012, 1.42, 0.06, { tint: [0.9, 0.8, 0.7], grain: 'y' });
        toolRack.metal.boxMM(x - 0.06, 1.38, 0.03, x + 0.06, 1.48, 0.075, { tint: [1, 1, 1.05] });
      } else {
        toolRack.metal.boxMM(x - 0.03, 1.02, 0.03, x - 0.012, 1.45, 0.045, { tint: [1, 1, 1] });
        toolRack.metal.boxMM(x + 0.012, 1.02, 0.03, x + 0.03, 1.45, 0.045, { tint: [1, 1, 1] });
      }
    }
  };
  if (!sab) {
    place(toolRack, [rx, 0, rz], Math.PI / 2);
    S.append((() => { const T = new SlotSet(); T.with(mat([0, 0, 0]), () => tools(6)); return T; })(), mat([rx, 0, rz], Math.PI / 2));
  } else {
    place(toolRack, [rx, -0.25, rz + 0.25], Math.PI / 2 + 0.2, 1, 0, 0.5);
    for (let i = 0; i < 5; i++) {
      const x = ax + r.range(-1.6, 1.4), z = az + r.range(0.1, 2.0);
      S.metal.boxMM(x - 0.22, 0.02, z - 0.015, x + 0.2, 0.05, z + 0.015, { tint: [1, 1, 1.05] });
      S.timber.boxMM(x + 0.1, 0.02, z - 0.03, x + 0.34, 0.07, z + 0.03, { tint: [0.9, 0.8, 0.7], grain: 'x' });
    }
  }

  // ---------------------------------------------------------------- bellows
  const bx = hx - 1.15, bz = hz + 0.4;
  const bellows = new SlotSet();
  bellows.planks.boxMM(-0.35, 0.0, -0.22, 0.35, 0.06, 0.22, { tint: [0.8, 0.7, 0.6], grain: 'x' });
  bellows.planks.prism([[-0.34, -0.2], [-0.34, 0.2], [0.3, 0.12], [0.3, -0.12]].map(([x, z]) => [x, z] as [number, number]), 0.06, 0.12, { tint: [0.8, 0.7, 0.6] });
  bellows.cloth.blob(0, 0.28, 0, 0.3, 0.14, 0.2, 10, 6, { tint: sab ? [0.5, 0.32, 0.22] : [0.75, 0.5, 0.32] });
  bellows.metal.boxMM(0.3, 0.1, -0.03, 0.6, 0.15, 0.03, { tint: [1, 1, 1] });
  place(bellows, [bx, 0.9, bz], 0, 1, 0, sab ? 0.5 : 0);
  S.stone.boxMM(bx - 0.4, 0, bz - 0.26, bx + 0.4, 0.9, bz + 0.26, { tint: [0.85, 0.85, 0.9], aoY: [0.55, 1] });

  // ---------------------------------------------------------------- quench trough + barrels + coal
  const tr = new SlotSet();
  tr.planks.boxMM(-0.5, 0, -0.25, 0.5, 0.5, 0.25, { tint: [0.8, 0.72, 0.64], grain: 'x', aoY: [0.55, 1] });
  tr.dark.quad([-0.45, 0.46, 0.2], [0.45, 0.46, 0.2], [0.45, 0.46, -0.2], [-0.45, 0.46, -0.2], { flip: false });
  tr.metal.boxMM(-0.52, 0.12, -0.27, 0.52, 0.16, 0.27, { tint: [1, 1, 1] });
  tr.metal.boxMM(-0.52, 0.34, -0.27, 0.52, 0.38, 0.27, { tint: [1, 1, 1] });
  if (!sab) place(tr, [trough.pos[0], 0, trough.pos[2]], Math.PI / 2);
  else {
    place(tr, [trough.pos[0] + 0.5, 0.25, trough.pos[2] + 0.9], 0.4, 1, 0, 1.5);
    decal('stain', trough.pos[0] + 0.6, trough.pos[2] + 1.1, 3.2, 0.3, 0.8, [0.5, 0.55, 0.7]);
    emitters.push({ kind: 'forge', pos: [trough.pos[0] + 0.6, 0.15, trough.pos[2] + 1.1], rate: 0.5, tag: 'steam' });
  }
  const yb = new SlotSet();
  const yx = yard.pos[0], yz = yard.pos[2];
  const bar = (p: V3, o: Parameters<typeof barrel>[1] = {}, yaw = 0) => S.append(barrel(r.fork(`b${p[0]}`), o), mat(p, yaw));
  void yb;
  if (!sab) {
    bar([yx - 1.6, 0, hz + 0.6]); bar([yx - 1.35, 0, hz + 1.25]); bar([yx + 1.5, 0, yz - 0.4], { open: true });
    S.append(crate(r.fork('c1')), mat([yx - 1.9, 0, hz + 1.75], 0.3));
    S.append(crate(r.fork('c2')), mat([yx - 1.85, 0.62, hz + 1.7], 0.5, 0.8));
    S.append(sack(r.fork('s1')), mat([yx + 1.8, 0, yz + 0.5], 0.8));
    // coal bin
    const coal = new SlotSet();
    coal.planks.boxMM(-0.4, 0, -0.3, 0.4, 0.4, 0.3, { tint: [0.7, 0.62, 0.55], grain: 'x', aoY: [0.55, 1] });
    coal.dark.blob(0, 0.4, 0, 0.36, 0.14, 0.26, 8, 5, { tint: [1.4, 1.4, 1.5] });
    place(coal, [hx + 1.15, 0, hz + 0.6], 0.2);
  } else {
    bar([yx - 1.6 + 0.4, 0, hz + 1.9], { lying: true }, 0.7);
    bar([yx + 1.1, 0, yz + 0.9], { lying: true }, -0.4);
    bar([yx + 1.5, 0, yz - 0.1], { open: true });
    // smashed crate: loose slats + splinters
    for (let i = 0; i < 7; i++) {
      const x = yx - 1.9 + r.range(-0.7, 0.7), z = hz + 1.9 + r.range(-0.4, 0.8), l = r.range(0.3, 0.6);
      S.with(mat([x, 0.03, z], r.range(0, 6.28)), () => S.planks.boxMM(-l / 2, 0, -0.04, l / 2, 0.035, 0.04, { tint: [0.9, 0.82, 0.74], grain: 'x' }));
    }
    decal('splinters', yx - 1.8, hz + 1.9, 1.8, 0.5, 0.9); decal('coal', hx + 0.9, hz + 1.7, 2.0, 1.1, 0.95); decal('coal', hx + 0.3, hz + 2.5, 1.4, 2.4, 0.8);
    decal('ash', hx, hz + 0.9, 2.2, 0.0, 0.7); decal('scorch', hx, hz + 0.6, 1.9, 2.0, 0.5);
    for (let i = 0; i < 4; i++) S.brick.boxMM(hx - 0.6 + i * 0.4, 0, hz + 1.0 + r.range(0, 0.8), hx - 0.4 + i * 0.4, 0.1, hz + 1.2 + r.range(0, 0.8), { tint: [1, 0.9, 0.85] });
  }

  // ---------------------------------------------------------------- lanterns at the porch posts (lit vs dead)
  const fb = b.result.colliders.length ? b : b;
  void fb;
  for (const post of [[hx - 2.1, 1.7], [hx + 1.7, 1.7]] as Array<[number, number]>) {
    const lz = b.pos[2] + 1.3;
    place(lantern(r.fork(`l${post[0]}`), { lit: !sab }), [post[0], 2.2, lz]);
    if (!sab) lights.push({ pos: [post[0], 2.45, lz], color: [1.0, 0.58, 0.25], intensity: 2.6, radius: 7, kind: 'lantern', halo: 1.5, priority: 6, group: 'forge' });
  }

  // ---------------------------------------------------------------- signage + banner
  const bannerX = hx - 4.85;
  if (!sab) {
    addBanner(S, { pos: [bannerX, 3.1, b.pos[2] + 0.12], yaw: 0, w: 1.05, h: 2.2, emblem: 'hammers', shape: 'swallow', loose: 0.5 });
    // a lit hanging sign over the yard
    addBanner(S, { pos: [hx + 2.1, 3.0, b.pos[2] + 1.62], yaw: 0, w: 0.5, h: 0.62, emblem: 'anvil', shape: 'rect', loose: 0.25, rod: true });
  } else {
    addBanner(S, { pos: [bannerX, 3.1, b.pos[2] + 0.12], yaw: 0, w: 1.05, h: 2.2, emblem: 'hammers', shape: 'torn', loose: 1.0, tilt: 0.0, tint: [0.7, 0.62, 0.62] });
    // boards nailed across the doorway + a rope and a notice cut off the bay
    const doorX = hx - 3.4;
    S.with(mat([doorX, 1.1, b.pos[2] + 0.08], 0, 1, 0, 0.7), () => S.planks.boxMM(-0.7, -0.07, 0, 0.7, 0.07, 0.04, { tint: [0.9, 0.82, 0.74], grain: 'x' }));
    S.with(mat([doorX, 1.1, b.pos[2] + 0.09], 0, 1, 0, -0.7), () => S.planks.boxMM(-0.7, -0.07, 0, 0.7, 0.07, 0.04, { tint: [0.9, 0.82, 0.74], grain: 'x' }));
    const rope: V3[] = []; const x0 = hx - 1.95, x1 = hx + 1.55;
    for (let i = 0; i <= 12; i++) { const t = i / 12; rope.push([x0 + (x1 - x0) * t, 0.95 - 0.28 * Math.sin(t * Math.PI), b.pos[2] + 1.45]); }
    S.cloth.sweep(rope, 0.022, 4, { tint: [1.6, 0.3, 0.25] });
    addBanner(S, { pos: [hx - 0.2, 1.95, b.pos[2] + 1.5], yaw: 0, w: 0.4, h: 0.5, emblem: 'anvil', shape: 'rect', loose: 0.9, rod: false, tint: [0.9, 0.5, 0.45] });
    lights.push({ pos: [hx + 0.2, 1.5, b.pos[2] + 1.9], color: [0.55, 0.7, 1.0], intensity: 1.1, radius: 5, kind: 'steady', halo: 0, priority: 3, group: 'forge' });
  }

  // ---------------------------------------------------------------- NPC presence
  const sp = (archetype: string, p: V3, role: string, facing = 0): NpcSpawn => ({ archetype, pos: p, role, detail: 'mid', facing });
  if (!sab) {
    npcs.push(sp('blacksmith', [ax - 0.65, 0, az + 0.25], 'forge-work', Math.PI * 0.2));
    npcs.push({ archetype: 'porter', pos: [yx + 1.0, 0, yz + 1.2], role: 'forge-wander', detail: 'crowd', waypoints: [[yx + 1, 0, yz + 1.2], [yx - 0.5, 0, yz + 2.4]] });
  } else {
    npcs.push(sp('blacksmith', [ax + 1.4, 0, az + 1.9], 'forge-alarm', -Math.PI * 0.25));
    npcs.push(sp('guardA', [ax - 1.2, 0, az + 2.6], 'forge-guard-idle', Math.PI * 0.2));
    npcs.push(sp('guardB', [ax - 0.2, 0, az + 3.0], 'forge-guard-idle', Math.PI * 0.35));
    npcs.push({ archetype: 'hooded', pos: [hx + 3.2, 0, b.pos[2] + 3.4], role: 'forge-stranger-idle', detail: 'mid', facing: -0.6 });
  }
  obstacles.push({ x0: hx - 2.4, x1: hx + 2.0, z0: hz - 0.8, z1: hz + 1.4, grime: 1 });

  // ---------------------------------------------------------------- bake meshes
  const objs: THREE.Object3D[] = [];
  const geos: THREE.BufferGeometry[] = [];
  const add = (SS: SlotSet, cast: boolean) => {
    for (const s of SLOTS) {
      const bb = SS.get(s);
      if (!bb.vertexCount) continue;
      const g = bb.toGeometry(); geos.push(g);
      const m = new THREE.Mesh(g, lib.slot[s]);
      m.name = `forge:${s}`; m.frustumCulled = false;
      if (s === 'decal') { m.layers.set(LAYER_NOREFLECT); m.renderOrder = 2; }
      else if (cast && s !== 'leaf' && s !== 'cloth' && s !== 'banner' && s !== 'glow') m.layers.enable(LAYER_CAST);
      group.add(m); objs.push(m);
    }
  };
  add(S, true); add(decals, false);
  return { dispose: () => { for (const o of objs) group.remove(o); for (const g of geos) g.dispose(); } };
}
