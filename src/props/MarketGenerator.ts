import { Rng } from '../core/rng';
import { SlotSet, mat, type V3 } from '../core/MeshBuilder';
import type { Socket } from '../architecture/Types';
import type { InstanceBatch } from './PropGenerator';
import { pot, basket, candle, lantern, trestle } from './PropGenerator';
import { QUAY_Z, WALK, type Collider, type MaskObstacle } from '../architecture/StreetComposer';
import type { DistrictConfig, LightRecord, NpcSpawn, Emitter } from '../district/MerchantDistrictGenerator';

/** MarketGenerator: one hero stall (the composition's visual anchor) and sparse, purposeful frontage dressing.
 *  Stalls are built from reusable modules (posts, canvas, counter, shelves, goods); repeated small props are instanced. */

export type StallKind = 'pottery' | 'candles' | 'cloth' | 'produce';
/** canvas is ivory for the hero (it glows warm when lit from beneath) and slate for anything secondary */
const CANVAS: Record<StallKind, V3> = {
  candles: [0.74, 0.71, 0.64], pottery: [0.7, 0.68, 0.62], cloth: [0.24, 0.28, 0.38], produce: [0.28, 0.3, 0.36],
};

function rotRect(cx: number, cz: number, hw: number, hd: number, yaw: number): { x0: number; z0: number; x1: number; z1: number } {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const ex = Math.abs(hw * c) + Math.abs(hd * s), ez = Math.abs(hw * s) + Math.abs(hd * c);
  return { x0: cx - ex, x1: cx + ex, z0: cz - ez, z1: cz + ez };
}

interface StallOut {
  S: SlotSet;
  lights: Array<{ pos: V3; color: V3; intensity: number; radius: number; kind: 'candle' | 'lantern'; halo: number; priority: number }>;
  /** local positions for instanced hanging lanterns (the lantern cluster) */
  lanterns: V3[];
}

/** `stripes`: the canvas in two alternating tints (the version 2's squares, journal Passe VP6); absent = the kind's tonal panels, as the
 *  district's stalls */
export function stall(rng: Rng, kind: StallKind, w = 2.8, stripes?: [V3, V3]): StallOut {
  const S = new SlotSet();
  const lights: StallOut['lights'] = [];
  const lanterns: V3[] = [];
  const d = 1.7, hw = w / 2;
  const tim: V3 = [0.86, 0.84, 0.86];
  const canvas = stripes?.[0] ?? CANVAS[kind], canvasAlt: V3 = stripes?.[1] ?? [canvas[0] * 1.08, canvas[1] * 1.08, canvas[2] * 1.07];
  // posts
  for (const [x, z, h] of [[-hw, -d / 2, 2.6], [hw, -d / 2, 2.6], [-hw, d / 2, 2.2], [hw, d / 2, 2.2]] as Array<[number, number, number]>) {
    S.timber.boxMM(x - 0.06, 0, z - 0.06, x + 0.06, h, z + 0.06, { tint: tim, grain: 'y', aoY: [0.6, 1] });
    S.stone.boxMM(x - 0.12, 0, z - 0.12, x + 0.12, 0.12, z + 0.12, { tint: [0.9, 0.92, 0.98] });
  }
  // canvas: one calm sagging sheet with a scalloped valance (tonal panels, no stripes)
  const n = 9, dx = (w + 0.5) / n;
  for (let i = 0; i < n; i++) {
    const xa = -hw - 0.25 + i * dx, xb = xa + dx, t = i % 2 ? canvasAlt : canvas;
    const rows = 3;
    for (let r = 0; r < rows; r++) {
      const v0 = r / rows, v1 = (r + 1) / rows;
      const yy = (v: number) => 2.62 - 0.46 * v - 0.07 * Math.sin(v * Math.PI), zz = (v: number) => -d / 2 - 0.1 + (d + 0.5) * v;
      S.cloth.quad([xa, yy(v0), zz(v0)], [xb, yy(v0), zz(v0)], [xb, yy(v1), zz(v1)], [xa, yy(v1), zz(v1)], { tint: t, ao: [0.75 + 0.25 * v0, 0.75 + 0.25 * v0, 0.75 + 0.25 * v1, 0.75 + 0.25 * v1], flip: true, swayArr: [v0 * 0.55, v0 * 0.55, v1 * 0.55, v1 * 0.55] });
    }
    const yf = 2.16, zf = d / 2 + 0.4;
    S.cloth.quad([xa, yf, zf], [xb, yf, zf], [xb, yf - 0.14, zf + 0.02], [xa, yf - 0.14, zf + 0.02], { tint: t, flip: true, swayArr: [0.5, 0.5, 0.65, 0.65] });
    S.cloth.tri([xa, yf - 0.14, zf + 0.02], [xb, yf - 0.14, zf + 0.02], [(xa + xb) / 2, yf - 0.34, zf + 0.03], { tint: t, swayArr: [0.65, 0.65, 0.9] });
  }
  S.timber.boxMM(-hw - 0.2, 2.6, -d / 2 - 0.12, hw + 0.2, 2.68, -d / 2 + 0.04, { tint: tim, grain: 'x' });
  S.timber.boxMM(-hw - 0.2, 2.14, d / 2 + 0.34, hw + 0.2, 2.2, d / 2 + 0.42, { tint: tim, grain: 'x' });
  // back wall + shelves
  S.planks.boxMM(-hw, 0.3, -d / 2 - 0.05, hw, 2.3, -d / 2 + 0.03, { tint: [0.78, 0.76, 0.76], grain: 'y', aoY: [0.6, 0.95] });
  for (const y of [0.95, 1.55]) S.planks.boxMM(-hw + 0.04, y, -d / 2 + 0.03, hw - 0.04, y + 0.05, -d / 2 + 0.42, { tint: [0.86, 0.82, 0.8], grain: 'x' });
  for (const s of [-1, 1]) S.planks.boxMM(s * hw - 0.03, 0.3, -d / 2 + 0.03, s * hw + 0.03, 1.2, d / 2 - 0.1, { tint: [0.78, 0.76, 0.76], grain: 'z', ao: 0.85 });
  // counter with a draped ivory cloth
  S.planks.boxMM(-hw + 0.1, 0, 0.0, hw - 0.1, 0.88, 0.62, { tint: [0.76, 0.72, 0.7], grain: 'x', aoY: [0.5, 0.95] });
  S.timber.boxMM(-hw + 0.04, 0.88, -0.04, hw - 0.04, 0.94, 0.7, { tint: tim, grain: 'x' });
  S.cloth.quad([-hw + 0.18, 0.93, 0.12], [hw - 0.18, 0.93, 0.12], [hw - 0.18, 0.93, 0.7], [-hw + 0.18, 0.93, 0.7], { tint: [0.72, 0.68, 0.6], ao: 1 });
  const nd = 7;
  for (let i = 0; i < nd; i++) {
    const xa = -hw + 0.18 + ((w - 0.36) * i) / nd, xb = xa + (w - 0.36) / nd;
    S.cloth.quad([xa, 0.93, 0.7], [xb, 0.93, 0.7], [xb, 0.5 + 0.06 * Math.sin(i * 2), 0.76], [xa, 0.5 + 0.06 * Math.sin(i * 2 + 1), 0.76], { tint: i % 2 ? [0.72, 0.68, 0.6] : [0.66, 0.62, 0.55], flip: true, swayArr: [0, 0, 0.4, 0.4], ao: 0.9 });
  }
  // goods: candles and small lanterns on the shelves, clay pots on the counter (one material family, warm-lit)
  const place = (SS: SlotSet, x: number, y: number, z: number, yaw = 0, sc = 1) => S.append(SS, mat([x, y, z], yaw, sc));
  const shelfSlots = [-1, -0.5, 0.0, 0.5, 1.0].map((f) => f * hw * 0.85);
  for (const y of [1.0, 1.6]) for (const x of shelfSlots) {
    if (rng.bool(0.2)) continue;
    if (kind === 'candles' && rng.bool(0.45)) place(lantern(rng.fork(`sl${x}${y}`)), x + rng.range(-0.06, 0.06), y + 0.02, -d / 2 + 0.22, rng.range(0, 6), 0.72);
    else {
      const g = kind === 'candles' ? candle() : kind === 'produce' ? basket(rng.fork(`${x}${y}`), { fruit: true }) : pot(rng.fork(`${x}${y}`));
      place(g, x + rng.range(-0.1, 0.1), y + 0.02, -d / 2 + 0.2 + rng.range(-0.04, 0.06), rng.range(0, 6));
      if (kind === 'candles') place(candle(), x + 0.13, y + 0.02, -d / 2 + 0.2);
    }
  }
  // counter stays low (candles, two small pots at the ends) so the merchant reads behind it
  for (let i = 0; i < 6; i++) {
    const x = -hw * 0.8 + (i / 5) * hw * 1.6 + rng.range(-0.06, 0.06), z = 0.22 + rng.range(0, 0.3);
    const g = i === 0 || i === 5 ? pot(rng.fork(`c${i}`), { kind: 'bowl' }) : candle();
    place(g, x, 0.94, z, rng.range(0, 6));
  }
  // the lantern cluster: hung on cords under the front beam, high in the middle so faces stay clear
  const lc = kind === 'candles' ? 4 : 2;
  for (let i = 0; i < lc; i++) {
    const t = lc > 1 ? i / (lc - 1) : 0.5;
    const x = -hw + 0.3 + t * (w - 0.6);
    const edge = Math.abs(t - 0.5) * 2;
    const drop = 0.08 + 0.26 * edge + rng.range(0, 0.05);
    const zc = d / 2 + 0.38;
    S.metal.boxMM(x - 0.006, 2.14 - drop + 0.1, zc - 0.006, x + 0.006, 2.14, zc + 0.006, { tint: [1, 1, 1] });
    lanterns.push([x, 2.14 - drop - 0.32, zc]);
  }
  // key light under the canvas (the anchor of the whole frame) + a soft fill from the shelf candles
  lights.push({ pos: [0, 1.75, d / 2 + 0.25], color: [1.0, 0.6, 0.28], intensity: 3.4, radius: 8.5, kind: 'lantern', halo: 1.5, priority: 9 });
  lights.push({ pos: [0, 1.35, -d / 2 + 0.45], color: [1.0, 0.66, 0.34], intensity: 1.4, radius: 4.2, kind: 'candle', halo: 0, priority: 8 });
  return { S, lights, lanterns };
}

export interface MarketAnchor { pos: V3; yaw: number; kind: StallKind; w: number }
/** the authored anchor: in front of the guild hall, angled toward the camera so its goods face the viewer */
export const HERO_STALL: MarketAnchor = { pos: [-4.4, 0, -2.0], yaw: -0.62, kind: 'candles', w: 3.0 };

export function buildMarket(rng: Rng, cfg: DistrictConfig, sockets: Array<Socket & { building: string }>, world: SlotSet, batch: InstanceBatch, lights: LightRecord[], colliders: Collider[], obstacles: MaskObstacle[], npcs: NpcSpawn[], emitters: Emitter[]): void {
  void emitters;
  const dens = cfg.propDensity;
  const a = HERO_STALL;
  const c = Math.cos(a.yaw), s = Math.sin(a.yaw);
  const toWorld = (p: V3): V3 => [a.pos[0] + p[0] * c + p[2] * s, a.pos[1] + p[1], a.pos[2] - p[0] * s + p[2] * c];
  if (dens >= 0.2) {
    const st = stall(rng.fork('hero-stall'), a.kind, a.w);
    world.append(st.S, mat(a.pos, a.yaw));
    for (const l of st.lights) lights.push({ pos: toWorld(l.pos), color: l.color, intensity: l.intensity, radius: l.radius, kind: l.kind, halo: l.halo, priority: l.priority, group: 'static' });
    for (const p of st.lanterns) batch.add('lantern', { pos: toWorld(p), yaw: a.yaw + rng.range(-0.3, 0.3), scale: 1 }, 0);
    const r = rotRect(a.pos[0], a.pos[2], a.w / 2 + 0.25, 1.0, a.yaw);
    colliders.push({ kind: 'rect', ...r }); obstacles.push({ ...r, grime: 0.7 });
    // stock waiting beside the stall: one tight, readable cluster instead of scattered clutter
    const cl: Array<[string, V3, number]> = [['crate', [a.w / 2 + 0.55, 0, -0.35], 0.2], ['crate', [a.w / 2 + 0.6, 0.62, -0.3], 0.55], ['barrel', [a.w / 2 + 0.5, 0, 0.45], 0]];
    for (const [k, p, y] of cl) {
      const wp = toWorld(p);
      batch.add(k, { pos: wp, yaw: a.yaw + y, scale: k === 'crate' && p[1] > 0 ? 0.85 : 1 });
      if (p[1] === 0) { colliders.push({ kind: 'circle', x: wp[0], z: wp[2], r: 0.38 }); obstacles.push({ x0: wp[0] - 0.35, x1: wp[0] + 0.35, z0: wp[2] - 0.35, z1: wp[2] + 0.35, grime: 0.5 }); }
    }
    // the merchant works the street side of her stall: behind the counter the canvas valance would hide her face
    npcs.push({ archetype: 'merchant', pos: toWorld([-a.w / 2 + 0.15, 0, 1.35]), role: 'merchant-talk', detail: 'mid', facing: a.yaw - 0.5 });
  }

  // ---------------------------------------------------------------- frontage dressing from building sockets (sparse)
  const r = rng.fork('frontage');
  for (const sk of sockets) {
    // dressing stays on the playable stretch; the closed street beyond the barrier keeps a clean, quiet frontage
    if (sk.building.startsWith('bg') || sk.pos[0] > WALK.x1) continue;
    const dir: V3 = sk.dir;
    const tangent: V3 = [dir[2], 0, -dir[0]];
    if (sk.kind === 'stall' && sk.tag === 'shopfront' && r.bool(0.65 * Math.min(1, dens))) {
      const side = r.bool() ? 1 : -1, off = (sk.width ?? 2.5) * 0.5 + 0.45;
      const p: V3 = [sk.pos[0] + tangent[0] * side * off + dir[0] * 0.25, 0, sk.pos[2] + tangent[2] * side * off + dir[2] * 0.25];
      batch.add('barrel', { pos: p, yaw: r.range(0, 6.28), scale: r.range(0.95, 1.05) });
      colliders.push({ kind: 'circle', x: p[0], z: p[2], r: 0.36 }); obstacles.push({ x0: p[0] - 0.35, x1: p[0] + 0.35, z0: p[2] - 0.35, z1: p[2] + 0.35, grime: 0.5 });
    }
  }
  // the landing: a little cargo waiting for the boat
  if (dens > 0.3) {
    for (const [k, p] of [['crate', [9.0, 0, 3.4]], ['barrel', [9.9, 0, 3.6]]] as Array<[string, V3]>) {
      batch.add(k, { pos: p, yaw: r.range(0, 6.28) });
      colliders.push({ kind: 'circle', x: p[0], z: p[2], r: 0.4 }); obstacles.push({ x0: p[0] - 0.4, x1: p[0] + 0.4, z0: p[2] - 0.4, z1: p[2] + 0.4, grime: 0.5 });
    }
  }
  // the playable quay ends at a guards' barrier: the street beyond stays in view (and fully built) but closed tonight
  const bx = WALK.x1 + 0.75;
  for (const [i, z] of [-2.9, -0.15, 2.6].entries()) {
    world.append(trestle(rng.fork(`barrier${i}`)), mat([bx + (i === 1 ? 0.25 : 0), 0, z], Math.PI / 2 + (i - 1) * 0.06));
    colliders.push({ kind: 'rect', x0: bx - 0.3, x1: bx + 0.55, z0: z - 1.3, z1: z + 1.3 });
  }
  batch.add('lantern', { pos: [bx + 0.25, 1.08, -0.6], yaw: 0.4 }, 0);
  lights.push({ pos: [bx + 0.25, 1.32, -0.6], color: [1.0, 0.6, 0.27], intensity: 1.7, radius: 5, kind: 'lantern', halo: 1.0, priority: 5, group: 'static' });
  batch.add('barrel', { pos: [bx + 0.9, 0, 1.2], yaw: 1.3 }, 1);
  // quiet drama, kept secondary: two guards at the barrier, a hooded stranger watching the boat, a cat on the coping
  npcs.push({ archetype: 'guardA', pos: [WALK.x1 - 0.7, 0, -1.4], role: 'guard-talk-idle', detail: 'mid', facing: -Math.PI / 2 });
  npcs.push({ archetype: 'guardB', pos: [WALK.x1 - 0.5, 0, 1.4], role: 'guard-idle', detail: 'mid', facing: -Math.PI / 2 * 0.8 });
  npcs.push({ archetype: 'hooded', pos: [6.0, 0, 3.6], role: 'stranger-idle', detail: 'mid', facing: 0.3 });
  npcs.push({ archetype: 'cat', pos: [12.6, 0.12, QUAY_Z + 0.02], role: 'cat-idle', detail: 'crowd', facing: 0 });
}
