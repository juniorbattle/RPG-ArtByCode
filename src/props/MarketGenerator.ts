import { Rng } from '../core/rng';
import { SlotSet, mat, type V3 } from '../core/MeshBuilder';
import type { Socket } from '../architecture/Types';
import type { InstanceBatch } from './PropGenerator';
import { pot, basket, candle, barrel, crate, sack, chalkboard, bush, cart } from './PropGenerator';
import type { Collider, MaskObstacle } from '../architecture/StreetComposer';
import type { DistrictConfig, LightRecord, NpcSpawn, Emitter } from '../district/MerchantDistrictGenerator';
import { brace } from '../architecture/FacadeGrammar';
import { BuildCtx } from '../architecture/Types';

/** MarketGenerator: reusable stall + frontage-dressing generators. Stalls are built from the same modules
 *  (posts, awning, counter, shelves) with deterministic goods; barrels/crates/sacks are instanced. */

export type StallKind = 'pottery' | 'candles' | 'cloth' | 'produce';
const AWNING: Record<StallKind, [V3, V3]> = {
  pottery: [[0.62, 0.2, 0.1], [0.82, 0.4, 0.22]],
  candles: [[0.4, 0.14, 0.34], [0.62, 0.34, 0.5]],
  cloth: [[0.12, 0.28, 0.5], [0.4, 0.55, 0.78]],
  produce: [[0.14, 0.36, 0.2], [0.5, 0.64, 0.3]],
};

function rotRect(cx: number, cz: number, hw: number, hd: number, yaw: number): { x0: number; z0: number; x1: number; z1: number } {
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const ex = Math.abs(hw * c) + Math.abs(hd * s), ez = Math.abs(hw * s) + Math.abs(hd * c);
  return { x0: cx - ex, x1: cx + ex, z0: cz - ez, z1: cz + ez };
}

export function stall(rng: Rng, kind: StallKind, w = 2.8): { S: SlotSet; lights: Array<{ pos: V3; color: V3; intensity: number; radius: number; kind: 'candle' | 'lantern' }> } {
  const S = new SlotSet();
  const lights: Array<{ pos: V3; color: V3; intensity: number; radius: number; kind: 'candle' | 'lantern' }> = [];
  const d = 1.7, hw = w / 2;
  const tim: V3 = [0.9, 0.82, 0.76];
  const [ca, cb] = AWNING[kind];
  // posts
  for (const [x, z, h] of [[-hw, -d / 2, 2.6], [hw, -d / 2, 2.6], [-hw, d / 2, 2.2], [hw, d / 2, 2.2]] as Array<[number, number, number]>) {
    S.timber.boxMM(x - 0.06, 0, z - 0.06, x + 0.06, h, z + 0.06, { tint: tim, grain: 'y', aoY: [0.6, 1] });
    S.stone.boxMM(x - 0.12, 0, z - 0.12, x + 0.12, 0.12, z + 0.12, { tint: [0.9, 0.9, 0.95] });
  }
  // awning with stripes, sag and scalloped valance
  const n = 9, dx = (w + 0.5) / n;
  for (let i = 0; i < n; i++) {
    const xa = -hw - 0.25 + i * dx, xb = xa + dx, t = i % 2 ? cb : ca;
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
  // back wall (planks) + two shelves with goods
  S.planks.boxMM(-hw, 0.3, -d / 2 - 0.05, hw, 2.3, -d / 2 + 0.03, { tint: [0.8, 0.75, 0.7], grain: 'y', aoY: [0.6, 0.95] });
  for (const y of [0.95, 1.55]) S.planks.boxMM(-hw + 0.04, y, -d / 2 + 0.03, hw - 0.04, y + 0.05, -d / 2 + 0.42, { tint: [0.9, 0.82, 0.74], grain: 'x' });
  for (const s of [-1, 1]) S.planks.boxMM(s * hw - 0.03, 0.3, -d / 2 + 0.03, s * hw + 0.03, 1.2, d / 2 - 0.1, { tint: [0.8, 0.75, 0.7], grain: 'z', ao: 0.85 });
  // counter with draped cloth
  S.planks.boxMM(-hw + 0.1, 0, 0.0, hw - 0.1, 0.88, 0.62, { tint: [0.8, 0.72, 0.64], grain: 'x', aoY: [0.5, 0.95] });
  S.timber.boxMM(-hw + 0.04, 0.88, -0.04, hw - 0.04, 0.94, 0.7, { tint: tim, grain: 'x' });
  S.cloth.quad([-hw + 0.18, 0.93, 0.12], [hw - 0.18, 0.93, 0.12], [hw - 0.18, 0.93, 0.7], [-hw + 0.18, 0.93, 0.7], { tint: kind === 'cloth' ? [0.5, 0.25, 0.28] : [0.75, 0.68, 0.55], ao: 1 });
  const nd = 7;
  for (let i = 0; i < nd; i++) {
    const xa = -hw + 0.18 + ((w - 0.36) * i) / nd, xb = xa + (w - 0.36) / nd;
    S.cloth.quad([xa, 0.93, 0.7], [xb, 0.93, 0.7], [xb, 0.5 + 0.06 * Math.sin(i * 2), 0.76], [xa, 0.5 + 0.06 * Math.sin(i * 2 + 1), 0.76], { tint: i % 2 ? [0.78, 0.7, 0.55] : [0.68, 0.6, 0.46], flip: true, swayArr: [0, 0, 0.4, 0.4], ao: 0.9 });
  }
  // goods
  const place = (SS: SlotSet, x: number, y: number, z: number, yaw = 0) => S.append(SS, mat([x, y, z], yaw));
  const shelfSlots = [-1, -0.45, 0.1, 0.62, 1.1].map((f) => f * hw * 0.85);
  for (const y of [1.0, 1.6]) for (const x of shelfSlots) {
    if (rng.bool(0.15)) continue;
    const g = kind === 'candles' ? candle() : kind === 'produce' ? basket(rng.fork(`${x}${y}`), { fruit: true }) : pot(rng.fork(`${x}${y}`));
    place(g, x + rng.range(-0.1, 0.1), y + 0.02, -d / 2 + 0.2 + rng.range(-0.04, 0.06), rng.range(0, 6));
    if (kind === 'candles') { place(candle(), x + 0.14, y + 0.02, -d / 2 + 0.2); lights.push({ pos: [x, y + 0.2, -d / 2 + 0.3], color: [1.0, 0.7, 0.35], intensity: 0.0, radius: 2, kind: 'candle' }); }
  }
  for (let i = 0; i < 6; i++) {
    const x = -hw * 0.8 + (i / 5) * hw * 1.6 + rng.range(-0.08, 0.08), z = 0.18 + rng.range(0, 0.35);
    const g = kind === 'pottery' ? pot(rng.fork(`c${i}`)) : kind === 'candles' ? candle() : kind === 'produce' ? basket(rng.fork(`c${i}`)) : sack(rng.fork(`c${i}`));
    place(g, x, 0.94, z, rng.range(0, 6));
  }
  if (kind === 'cloth') for (let i = 0; i < 3; i++) S.with(mat([-hw * 0.55 + i * 0.32, 0, -d / 2 + 0.22]), () => S.cloth.cylinder(0.075, 1.0, 1.55 + 0.0, 8, { tint: [[0.5, 0.2, 0.25], [0.2, 0.3, 0.55], [0.7, 0.55, 0.2]][i] as V3 }));
  // hanging bundles at the front
  for (let i = 0; i < 4; i++) {
    const x = -hw + 0.4 + i * (w - 0.8) / 3;
    S.cloth.cylinder(0.01, 1.8, 2.13, 4, { tint: [0.9, 0.9, 0.8] });
    S.leaf.quad([x - 0.1, 1.72, d / 2 + 0.3], [x + 0.1, 1.72, d / 2 + 0.3], [x + 0.1, 1.94, d / 2 + 0.3], [x - 0.1, 1.94, d / 2 + 0.3], { uvs: [0, 0.5, 0.25, 0.5, 0.25, 0.75, 0, 0.75], tint: [0.8, 1, 0.6], aux: [0.7, 0, rng.next(), 0], ao: 1 });
  }
  lights.push({ pos: [0, 1.5, d / 2 - 0.2], color: [1.0, 0.6, 0.28], intensity: 1.7, radius: 5.5, kind: 'candle' });
  void brace; void BuildCtx;
  return { S, lights };
}

export function buildMarket(rng: Rng, cfg: DistrictConfig, sockets: Array<Socket & { building: string }>, world: SlotSet, batch: InstanceBatch, lights: LightRecord[], colliders: Collider[], obstacles: MaskObstacle[], npcs: NpcSpawn[], emitters: Emitter[]): void {
  void emitters;
  const dens = cfg.propDensity;
  // ---------------------------------------------------------------- stalls (composition-driven anchor points)
  const anchors: Array<{ pos: V3; yaw: number; kind: StallKind; w: number }> = [
    { pos: [-4.9, 0, -0.6], yaw: Math.PI / 2.4, kind: 'pottery', w: 3.2 },
  ];
  if (dens < 0.4) anchors.pop();
  for (const a of anchors) {
    const k = rng.fork(`stall${a.pos[0]}`).pick(['pottery', 'candles', 'cloth', 'produce'] as StallKind[]);
    const st = stall(rng.fork(`s${a.pos[0]}`), a.pos[0] < 0 ? a.kind : k === a.kind ? 'cloth' : k, a.w);
    world.append(st.S, mat(a.pos, a.yaw));
    const c = Math.cos(a.yaw), s = Math.sin(a.yaw);
    for (const l of st.lights) {
      if (l.intensity <= 0) continue;
      lights.push({ pos: [a.pos[0] + l.pos[0] * c + l.pos[2] * s, a.pos[1] + l.pos[1], a.pos[2] - l.pos[0] * s + l.pos[2] * c], color: l.color, intensity: l.intensity, radius: l.radius, kind: l.kind, halo: 0.9, priority: 4, group: 'static' });
    }
    const r = rotRect(a.pos[0], a.pos[2], a.w / 2 + 0.2, 0.95, a.yaw);
    colliders.push({ kind: 'rect', ...r }); obstacles.push({ ...r, grime: 0.7 });
    // lanterns on the front posts (instanced)
    for (const sx of [-1, 1]) {
      const lx = a.pos[0] + (sx * (a.w / 2)) * c + 0.95 * s, lz = a.pos[2] - (sx * (a.w / 2)) * s + 0.95 * c;
      batch.add('lantern', { pos: [lx, 1.72, lz], yaw: a.yaw, scale: 1 }, 0);
    }
    lights.push({ pos: [a.pos[0] + 0.95 * s, 1.9, a.pos[2] + 0.95 * c], color: [1.0, 0.58, 0.26], intensity: 2.2, radius: 7, kind: 'lantern', halo: 1.4, priority: 4, group: 'static' });
  }
  // merchant cart parked in the forge yard (bottom right of the frame)
  if (dens > 0.3) {
    const cp: V3 = [13.6, 0, 2.7], cy = -0.55;
    world.append(cart(rng.fork('cart')), mat(cp, cy));
    const r = rotRect(cp[0] + 0.4, cp[2] - 0.2, 1.6, 0.9, cy);
    colliders.push({ kind: 'rect', ...r }); obstacles.push({ ...r, grime: 0.8 });
    batch.add('barrel', { pos: [12.2, 0, 3.3], yaw: 1 }, 1);
  }
  // merchant behind the first stall, chatting
  npcs.push({ archetype: 'merchant', pos: [-5.35, 0, -0.95], role: 'merchant-talk', detail: 'mid', facing: Math.PI / 2.4 });

  // ---------------------------------------------------------------- frontage dressing from building sockets
  const r = rng.fork('frontage');
  for (const s of sockets) {
    if (s.building.startsWith('bg')) continue;
    const dir: V3 = s.dir;
    const yaw = Math.atan2(dir[0], dir[2]);
    const tangent: V3 = [dir[2], 0, -dir[0]];
    if (s.kind === 'stall' && s.tag === 'shopfront') {
      const n = Math.round(2 * dens);
      for (let i = 0; i < n; i++) {
        const side = i % 2 ? 1 : -1, off = (s.width ?? 2.5) * 0.5 + 0.35 + r.range(0, 0.5);
        const p: V3 = [s.pos[0] + tangent[0] * side * off + dir[0] * r.range(0.1, 0.5), 0, s.pos[2] + tangent[2] * side * off + dir[2] * r.range(0.1, 0.5)];
        batch.add('barrel', { pos: p, yaw: r.range(0, 6.28), scale: r.range(0.92, 1.1), tint: [r.range(0.85, 1.1), r.range(0.8, 1.05), r.range(0.8, 1)] });
        colliders.push({ kind: 'circle', x: p[0], z: p[2], r: 0.36 }); obstacles.push({ x0: p[0] - 0.35, x1: p[0] + 0.35, z0: p[2] - 0.35, z1: p[2] + 0.35, grime: 0.5 });
        if (r.bool(0.7)) batch.add('crate', { pos: [p[0] + tangent[0] * side * 0.62 + dir[0] * 0.1, 0, p[2] + tangent[2] * side * 0.62 + dir[2] * 0.1], yaw: yaw + r.range(-0.3, 0.3), scale: r.range(0.9, 1.1) });
        if (r.bool(0.5)) batch.add('sack', { pos: [p[0] + dir[0] * 0.55, 0, p[2] + dir[2] * 0.55], yaw: r.range(0, 6.28), scale: r.range(0.9, 1.15), tint: [1, 1, 1] });
      }
      if (r.bool(0.6 * dens)) batch.add('chalkboard', { pos: [s.pos[0] + tangent[0] * 1.7 + dir[0] * 0.9, 0, s.pos[2] + tangent[2] * 1.7 + dir[2] * 0.9], yaw });
    }
    if (s.kind === 'door' && dens > 0.3) {
      const p: V3 = [s.pos[0] + tangent[0] * 0.9 + dir[0] * 0.2, 0, s.pos[2] + tangent[2] * 0.9 + dir[2] * 0.2];
      if (r.bool(0.7)) batch.add('planter', { pos: p, yaw });
      if (r.bool(0.5)) batch.add('barrel', { pos: [s.pos[0] - tangent[0] * 0.9 + dir[0] * 0.3, 0, s.pos[2] - tangent[2] * 0.9 + dir[2] * 0.3], yaw: r.range(0, 6) }, 1);
    }
    if (s.kind === 'prop' && s.tag === 'counter') {
      batch.add('basket', { pos: [s.pos[0] + tangent[0] * 0.4, s.pos[1], s.pos[2] + tangent[2] * 0.4], yaw: r.range(0, 6) });
      batch.add('pot', { pos: [s.pos[0] - tangent[0] * 0.5, s.pos[1], s.pos[2] - tangent[2] * 0.5], yaw: r.range(0, 6) });
    }
    if (s.kind === 'prop' && s.tag === 'flowerbox') {
      const S = bush(r.fork(`fb${s.pos[0]}${s.pos[1]}`), { radius: 0.2, count: 9, y: 0, width: (s.width ?? 0.8) * 0.9 });
      world.append(S, mat([s.pos[0], s.pos[1], s.pos[2]], yaw));
    }
  }
  // spare crates / barrels around the street edge for density
  const spare = Math.round(7 * dens);
  const spots: V3[] = [[-6.1, 0, 2.8], [-2.2, 0, 3.9], [14.2, 0, -0.4], [6.3, 0, 3.8], [3.6, 0, -2.9], [-3.1, 0, -3.1], [12.4, 0, 3.6], [1.6, 0, 3.9]];
  for (let i = 0; i < Math.min(spare, spots.length); i++) {
    const p = spots[i];
    const kind = r.pick(['barrel', 'crate', 'sack', 'barrelLying'] as const);
    batch.add(kind, { pos: p, yaw: r.range(0, 6.28), scale: r.range(0.9, 1.1) });
    colliders.push({ kind: 'circle', x: p[0], z: p[2], r: 0.4 });
    obstacles.push({ x0: p[0] - 0.4, x1: p[0] + 0.4, z0: p[2] - 0.4, z1: p[2] + 0.4, grime: 0.5 });
  }
  // guards and a hooded stranger: the street's quiet drama
  npcs.push({ archetype: 'guardA', pos: [3.4, 0, 0.9], role: 'guard-talk-idle', detail: 'mid', facing: -Math.PI / 2 });
  npcs.push({ archetype: 'guardB', pos: [4.6, 0, 1.0], role: 'guard-idle', detail: 'mid', facing: Math.PI / 2 * 0.2 });
  npcs.push({ archetype: 'hooded', pos: [-6.3, 0, 2.2], role: 'stranger-idle', detail: 'mid', facing: 0.4 });
  npcs.push({ archetype: 'cat', pos: [7.2, 0.56, QUAY_Z_CAT], role: 'cat-idle', detail: 'crowd', facing: 0 });
}
const QUAY_Z_CAT = 4.72;
