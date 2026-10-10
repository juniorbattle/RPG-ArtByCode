import { Rng } from '../core/rng';
import { fbm, smoothstep, clamp01 } from '../core/noise';
import { SlotSet, type V3 } from '../core/MeshBuilder';
import { DECAL_CELLS, type DecalKind } from '../materials/CanvasArt';
import { atlasRect } from './FacadeGrammar';

export type Collider = { kind: 'rect'; x0: number; z0: number; x1: number; z1: number } | { kind: 'circle'; x: number; z: number; r: number };

export interface GroundRect { x0: number; z0: number; w: number; h: number }
export const GROUND_RECT: GroundRect = { x0: -16, z0: -17.5, w: 34, h: 28.5 };
export const QUAY_Z = 4.6;
export const TERRACE = { x0: -15, x1: 16.8, z0: -17, z1: 12 };
export const WATER_Y = -2.5;
export const NEAR_BANK_Z = 10.6;

export interface MaskObstacle { x0: number; z0: number; x1: number; z1: number; ao?: number; grime?: number }
export interface MaskBlob { x: number; z: number; r: number; amount: number }

/** World-space street mask: R = standing water, G = grime, B = foot-worn polish, A = painted contact AO. */
export function makeGroundMask(seed: number, rect: GroundRect, resX: number, resY: number, obstacles: MaskObstacle[], puddles: MaskBlob[], path: Array<[number, number]>, wetness: number): Uint8Array {
  const out = new Uint8Array(resX * resY * 4);
  const rng = new Rng(seed).fork('mask');
  const ox = rng.range(0, 100), oz = rng.range(0, 100);
  const distRect = (x: number, z: number, o: MaskObstacle) => {
    const dx = Math.max(o.x0 - x, 0, x - o.x1), dz = Math.max(o.z0 - z, 0, z - o.z1);
    return Math.hypot(dx, dz);
  };
  const distPath = (x: number, z: number) => {
    let best = 1e9;
    for (let i = 0; i < path.length - 1; i++) {
      const [ax, az] = path[i], [bx, bz] = path[i + 1];
      const vx = bx - ax, vz = bz - az, l2 = vx * vx + vz * vz || 1;
      const t = clamp01(((x - ax) * vx + (z - az) * vz) / l2);
      best = Math.min(best, Math.hypot(x - (ax + vx * t), z - (az + vz * t)));
    }
    return best;
  };
  // low-frequency fields are evaluated on a coarse grid (1/4 res) and bilinearly sampled: keeps regeneration fast
  const cs = 4, cw = Math.ceil(resX / cs) + 2, ch = Math.ceil(resY / cs) + 2;
  const mk = (fn: (x: number, z: number) => number) => {
    const g = new Float32Array(cw * ch);
    for (let j = 0; j < ch; j++) for (let i = 0; i < cw; i++) g[j * cw + i] = fn(rect.x0 + ((i * cs) / resX) * rect.w, rect.z0 + ((j * cs) / resY) * rect.h);
    return g;
  };
  const gN = mk((x, z) => fbm(x * 0.16 + ox, z * 0.16 + oz, 0, 4, 3));
  const gG = mk((x, z) => fbm(x * 0.4 + 7, z * 0.4 + 7, 0, 4, 9));
  const gW = mk((x, z) => fbm(x * 1.2, z * 1.2, 0, 3, 13));
  const gJ = mk((x, z) => fbm(x * 0.9, z * 0.9, 0, 3, 8));
  const gP = mk((x, z) => fbm(x * 0.5, z * 0.5, 0, 3, 5));
  const samp = (g: Float32Array, i: number, j: number) => {
    const fx = i / cs, fy = j / cs, x0 = Math.floor(fx), y0 = Math.floor(fy), tx = fx - x0, ty = fy - y0;
    const a = g[y0 * cw + x0], b = g[y0 * cw + x0 + 1], c = g[(y0 + 1) * cw + x0], d = g[(y0 + 1) * cw + x0 + 1];
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
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
      let pud = smoothstep(0.52, 0.72, samp(gN, i, j)) * 0.8;
      const jit = 0.75 + 0.5 * samp(gJ, i, j);
      for (const b of puddles) { const dx = (x - b.x) / b.r, dz = (z - b.z) / b.r, d2 = dx * dx + dz * dz; if (d2 < 6) pud = Math.max(pud, b.amount * Math.exp(-d2 * 1.6) * jit); }
      const gutter = Math.exp(-Math.pow((z - (QUAY_Z - 0.75)) / 0.35, 2)) * 0.5 * samp(gP, i, j);
      pud = Math.max(pud, gutter) * smoothstep(0.0, 0.6, dmin) * (z < QUAY_Z - 0.1 ? 1 : 0);
      const grime = clamp01(0.18 + 0.28 * samp(gG, i, j) + gr * 0.22 + (z > QUAY_Z - 1.2 ? 0.25 : 0));
      const wear = Math.exp(-Math.pow(distPath(x, z) / 1.5, 2)) * (0.55 + 0.45 * samp(gW, i, j));
      const ao = 1 - 0.55 * Math.exp(-dmin / 0.42) - (z > QUAY_Z - 0.45 ? 0.35 : 0);
      const k = (j * resX + i) * 4;
      out[k] = clamp01(pud * wetness) * 255;
      out[k + 1] = grime * 255;
      out[k + 2] = clamp01(wear) * 255;
      out[k + 3] = clamp01(ao) * 255;
    }
  }  return out;
}

export interface StreetResult {
  slots: SlotSet;
  colliders: Collider[];
  obstacles: MaskObstacle[];
  stairs: { x0: number; x1: number; zBottom: number; zTop: number; yTop: number };
  bollards: V3[];
  nearBollards: V3[];
  lampSpots: Array<{ pos: V3; yaw: number }>;
  decals: SlotSet;
  walkable: GroundRect;
}

/** Quay wall, parapet, stairs, canal edges, near bank. Everything the street plane needs around it. */
export function composeStreet(seed: number, density: number): StreetResult {
  const rng = new Rng(seed).fork('street');
  const S = new SlotSet();
  const colliders: Collider[] = [];
  const obstacles: MaskObstacle[] = [];
  const stone: V3 = [1, 1, 1.03];

  // ---- quay: face toward the canal (visible to the camera), parapet and cap
  const x0 = TERRACE.x0, x1 = TERRACE.x1;
  S.stone.quad([x0, WATER_Y - 0.4, QUAY_Z + 0.35], [x1, WATER_Y - 0.4, QUAY_Z + 0.35], [x1, 0.0, QUAY_Z + 0.35], [x0, 0.0, QUAY_Z + 0.35], { tint: [0.85, 0.9, 0.9], ao: [0.25, 0.25, 0.85, 0.85], uvScale: 1 });
  S.stone.boxMM(x0, 0, QUAY_Z - 0.1, x1, 0.46, QUAY_Z + 0.35, { tint: stone, aoY: [0.6, 1], skip: ['-y', '-z'] });
  S.stone.boxMM(x0, 0.46, QUAY_Z - 0.16, x1, 0.56, QUAY_Z + 0.42, { tint: [1.05, 1.05, 1.08], ao: 0.95, skip: ['-y'] });
  colliders.push({ kind: 'rect', x0, z0: QUAY_Z - 0.35, x1, z1: QUAY_Z + 1 });
  // end walls of the canal so the camera never sees under the street
  S.stone.quad([x0, WATER_Y - 0.4, QUAY_Z + 0.35], [x0, WATER_Y - 0.4, NEAR_BANK_Z], [x0, 0.0, NEAR_BANK_Z], [x0, 0.0, QUAY_Z + 0.35], { tint: [0.6, 0.65, 0.7], ao: 0.5 });
  S.stone.quad([x1, WATER_Y - 0.4, NEAR_BANK_Z], [x1, WATER_Y - 0.4, QUAY_Z + 0.35], [x1, 0.0, QUAY_Z + 0.35], [x1, 0.0, NEAR_BANK_Z], { tint: [0.6, 0.65, 0.7], ao: 0.5 });
  // near bank: top walkway slab + parapet
  S.stone.boxMM(x0, WATER_Y - 0.6, NEAR_BANK_Z, x1, 0.4, NEAR_BANK_Z + 8, { tint: [0.8, 0.85, 0.9], aoY: [0.3, 1] });
  S.stone.boxMM(x0, 0.4, NEAR_BANK_Z + 0.05, x1, 0.95, NEAR_BANK_Z + 0.6, { tint: stone, aoY: [0.7, 1] });
  S.stone.boxMM(x0, 0.95, NEAR_BANK_Z - 0.02, x1, 1.07, NEAR_BANK_Z + 0.68, { tint: [1.05, 1.05, 1.08], ao: 0.95 });

  // ---- stairs between the guild house and the apothecary, climbing north
  const stairs = { x0: -7.7, x1: -4.5, zBottom: -4.2, zTop: -9.8, yTop: 0 };
  const steps = 16, rise = 0.19, run = (stairs.zBottom - stairs.zTop) / steps;
  for (let i = 0; i < steps; i++) {
    const zf = stairs.zBottom - i * run, zb = zf - run, h = (i + 1) * rise;
    S.stone.boxMM(stairs.x0, 0, zb, stairs.x1, h, zf, { tint: ctxTint(rng, stone), aoY: [0.55, 1] });
    // cheek walls with a stepped cap
    S.stone.boxMM(stairs.x0 - 0.3, 0, zb, stairs.x0, h + 0.55, zf, { tint: stone, aoY: [0.6, 1] });
    S.stone.boxMM(stairs.x1, 0, zb, stairs.x1 + 0.3, h + 0.55, zf, { tint: stone, aoY: [0.6, 1] });
    S.stone.boxMM(stairs.x0 - 0.35, h + 0.55, zb, stairs.x0 + 0.05, h + 0.63, zf, { tint: [1.05, 1.05, 1.1] });
    S.stone.boxMM(stairs.x1 - 0.05, h + 0.55, zb, stairs.x1 + 0.35, h + 0.63, zf, { tint: [1.05, 1.05, 1.1] });
  }
  stairs.yTop = steps * rise;
  // upper landing
  S.stone.boxMM(stairs.x0 - 0.3, 0, stairs.zTop - 6, stairs.x1 + 0.3, stairs.yTop, stairs.zTop, { tint: stone, aoY: [0.5, 1] });
  obstacles.push({ x0: stairs.x0 - 0.3, z0: stairs.zTop, x1: stairs.x1 + 0.3, z1: stairs.zBottom, grime: 0.8 });

  // ---- bollards along the quay (the dark silhouettes in the reference)
  const bollards: V3[] = [];
  const nearBollards: V3[] = [];
  const lampSpots: Array<{ pos: V3; yaw: number }> = [];
  for (let x = x0 + 1.5; x < x1 - 1; x += 2.8 + rng.range(-0.4, 0.6)) {
    if (x > -8 && x < 26) bollards.push([x, 0.56, QUAY_Z + 0.1]);
  }
  for (let x = x0 + 1; x < x1 - 1; x += 2.4 + rng.range(-0.3, 0.5)) nearBollards.push([x, 1.07, NEAR_BANK_Z + 0.32]);
  void density;

  const decals = new SlotSet();
  const decalRect = (kind: DecalKind) => { const i = DECAL_CELLS[kind]; return atlasRect(i % 4, Math.floor(i / 4), 4, 4, 0.002); };
  const quadDecal = (kind: DecalKind, x: number, z: number, w: number, d: number, rot: number, tint: V3, alpha: number, y = 0.012, emissive = 0) => {
    const [u0, v0, u1, v1] = decalRect(kind);
    const c = Math.cos(rot), s = Math.sin(rot);
    const P = ([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]] as Array<[number, number]>).map(([a, b]) => [x + a * c - b * s, y, z + a * s + b * c] as V3);
    decals.decal.quad(P[0], P[1], P[2], P[3], { uvs: [u0, v1, u1, v1, u1, v0, u0, v0], tint: [tint[0], tint[1], tint[2]], ao: alpha, aux: [0, emissive, 0, 0], flip: true });
  };
  // drainage + manhole + cracks + stains: positioned relative to the street layout
  quadDecal('grate', -1.2, QUAY_Z - 0.9, 1.1, 0.7, 0.0, [1, 1, 1], 0.95);
  quadDecal('grate', 8.4, QUAY_Z - 0.9, 1.1, 0.7, 0.02, [1, 1, 1], 0.95);
  quadDecal('manhole', 2.4, 1.0, 1.0, 1.0, rng.range(0, 6), [1, 1, 1], 0.95);
  for (let i = 0; i < 7; i++) quadDecal('crack', rng.range(-6, 12), rng.range(-3, 3.5), rng.range(1.2, 2.4), rng.range(1.2, 2.4), rng.range(0, 6.28), [1, 1, 1], rng.range(0.5, 0.9));
  for (let i = 0; i < 9; i++) quadDecal('stain', rng.range(-8, 14), rng.range(-3.5, 3.8), rng.range(1.5, 3.2), rng.range(1.5, 3.2), rng.range(0, 6.28), [0.6, 0.6, 0.65], rng.range(0.25, 0.5));
  for (let i = 0; i < 4; i++) quadDecal('mud', rng.range(-6, 14), rng.range(-3, 3.8), rng.range(1.0, 2.0), rng.range(1.0, 2.0), rng.range(0, 6.28), [0.8, 0.7, 0.6], rng.range(0.25, 0.45));
  quadDecal('ruts', 6.0, 1.9, 8.0, 2.1, 0.05, [1, 1, 1], 0.3);
  quadDecal('ruts', 12.0, 0.2, 7.0, 2.0, 0.35, [1, 1, 1], 0.28);
  for (let i = 0; i < 6; i++) quadDecal(rng.pick(['leaves', 'straw'] as DecalKind[]), rng.range(-6, 14), rng.range(-3, 3.8), 1.3, 1.3, rng.range(0, 6.28), [1, 1, 1], rng.range(0.6, 0.9));

  return { slots: S, colliders, obstacles, stairs, bollards, nearBollards, lampSpots, decals, walkable: { x0: -8, z0: -4, w: 24, h: 8 } };
}

function ctxTint(r: Rng, base: V3): V3 { const k = 0.9 + r.next() * 0.2; return [base[0] * k, base[1] * k, base[2] * k]; }
