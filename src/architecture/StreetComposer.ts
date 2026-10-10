import { Rng } from '../core/rng';
import { fbm, smoothstep, clamp01 } from '../core/noise';
import { SlotSet, type V3 } from '../core/MeshBuilder';
import { DECAL_CELLS, type DecalKind } from '../materials/CanvasArt';
import { atlasRect } from './FacadeGrammar';

export type Collider = { kind: 'rect'; x0: number; z0: number; x1: number; z1: number } | { kind: 'circle'; x: number; z: number; r: number };

export interface GroundRect { x0: number; z0: number; w: number; h: number }
/** Composition constants. The quarter is authored along the canal axis (+x = toward the bridge and the upper city). */
export const QUAY_Z = 4.6;
export const WATER_Y = -1.15;
export const SOUTH_QUAY_Z = 15.5;
/** authored street block: the playable quay plus the non-playable foreground behind the camera side */
export const STREET = { x0: -34, x1: 30, z0: -18 };
/** the cobbled quay and its coping run on past the authored block, up to the hero bridge abutment */
export const QUAY_END_X = 46.5;
/** walkable quay (the one playable ground plane) */
export const WALK = { x0: -13.5, x1: 26, z0: -3.2, z1: 4.05 };
export const GROUND_RECT: GroundRect = { x0: -26, z0: -8, w: 56, h: 13 };
/** landing steps down to the water, beside the moored boat */
export const WATER_STEPS = { x0: 5.2, x1: 8.0, run: 0.36, n: 6 };

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
  }
  return out;
}

export interface StreetResult {
  slots: SlotSet;
  colliders: Collider[];
  obstacles: MaskObstacle[];
  bollards: V3[];
  /** iron mooring rings / posts at the landing (small, instanced as bollards) */
  moorings: V3[];
  decals: SlotSet;
  walkable: typeof WALK;
}

/** Quay walls on both banks, block coping along the playable edge, landing steps and a few ground decals.
 *  The quay edge is one of the authored focal lines, so it gets block-level detail; everything else stays plain. */
export function composeStreet(seed: number): StreetResult {
  const rng = new Rng(seed).fork('street');
  const S = new SlotSet();
  const colliders: Collider[] = [];
  const obstacles: MaskObstacle[] = [];
  const stone: V3 = [0.92, 0.95, 1.02];
  const x0 = STREET.x0, x1 = QUAY_END_X;
  const fz = QUAY_Z + 0.35;
  const st = WATER_STEPS;

  // ---- north quay: wall face toward the canal, darker and slick toward the waterline
  const wallSeg = (a: number, b: number) => S.stone.quad([a, WATER_Y - 0.5, fz], [b, WATER_Y - 0.5, fz], [b, 0.0, fz], [a, 0.0, fz], { tint: [0.74, 0.8, 0.88], ao: [0.22, 0.22, 0.82, 0.82], uvScale: 1 });
  wallSeg(x0, st.x0); wallSeg(st.x1, x1);
  // block coping: one slab per ~1.3 m with tiny height / tone jitter so the edge reads as laid stone, not a strip
  let cx = x0;
  while (cx < x1) {
    const w = Math.min(x1 - cx, 1.15 + rng.range(0, 0.35));
    const a = cx, b = cx + w;
    cx = b;
    if (b > st.x0 && a < st.x1) continue;
    const h = 0.12 + rng.range(-0.012, 0.012), k = 0.92 + rng.range(0, 0.14);
    S.stone.boxMM(a + 0.012, 0, QUAY_Z - 0.12, b - 0.012, h, fz + 0.06, { tint: [stone[0] * k, stone[1] * k, stone[2] * k * 1.02], ao: 0.95, aoFace: { '+z': 0.85 }, skip: ['-y'] });
  }
  colliders.push({ kind: 'rect', x0, z0: QUAY_Z - 0.3, x1, z1: QUAY_Z + 1 });

  // ---- landing steps: a flight projecting into the canal beside the moored boat (decorative, not walkable)
  const rise = -WATER_Y / st.n, zs = QUAY_Z + 0.2;
  S.stone.quad([st.x0, -rise, zs], [st.x1, -rise, zs], [st.x1, 0, zs], [st.x0, 0, zs], { tint: [0.8, 0.85, 0.92], ao: 0.7 });
  for (let i = 0; i < st.n; i++) {
    const za = zs + i * st.run, top = -(i + 1) * rise + 0.02;
    S.stone.boxMM(st.x0, WATER_Y - 0.5, za, st.x1, top, za + st.run, { tint: ctxTint(rng, stone), aoY: [0.35, 1], skip: ['-y'] });
  }
  // stepped cheek walls
  for (const [a, b] of [[st.x0 - 0.32, st.x0], [st.x1, st.x1 + 0.32]] as Array<[number, number]>) {
    for (let i = 0; i < st.n; i++) {
      const za = zs + i * st.run, top = 0.18 - i * rise * 0.9;
      S.stone.boxMM(a, WATER_Y - 0.5, za, b, top, za + st.run + 0.001, { tint: [0.86, 0.9, 0.98], aoY: [0.3, 1], skip: ['-y'] });
    }
  }
  const moorings: V3[] = [[st.x0 - 0.16, 0.18, fz + 0.22], [st.x1 + 0.16, 0.18, fz + 0.22]];

  // ---- south quay (the opposite bank): plain wall + walkway + coping, kept low-contrast and evasive
  const sz = SOUTH_QUAY_Z, sx1 = STREET.x1;
  S.stone.quad([sx1, WATER_Y - 0.5, sz], [x0, WATER_Y - 0.5, sz], [x0, 0.3, sz], [sx1, 0.3, sz], { tint: [0.66, 0.72, 0.82], ao: [0.25, 0.25, 0.8, 0.8] });
  S.stone.boxMM(x0, 0.3, sz - 0.06, sx1, 0.42, sz + 0.45, { tint: [0.9, 0.94, 1.02], ao: 0.95, skip: ['-y'] });
  S.stone.boxMM(x0, -0.2, sz + 0.45, sx1, 0.32, sz + 4.2, { tint: [0.6, 0.66, 0.76], ao: 0.9, skip: ['-y', '-z'] });

  // ---- bollards along the playable edge (rhythm; skip the landing)
  const bollards: V3[] = [];
  for (let x = -19.5; x < x1 - 2.5; x += 3.4 + rng.range(-0.3, 0.4)) {
    if (x > st.x0 - 0.8 && x < st.x1 + 0.8) continue;
    bollards.push([x, 0.12, QUAY_Z + 0.1]);
  }

  const decals = new SlotSet();
  const decalRect = (kind: DecalKind) => { const i = DECAL_CELLS[kind]; return atlasRect(i % 4, Math.floor(i / 4), 4, 4, 0.002); };
  const quadDecal = (kind: DecalKind, x: number, z: number, w: number, d: number, rot: number, tint: V3, alpha: number, y = 0.012, emissive = 0) => {
    const [u0, v0, u1, v1] = decalRect(kind);
    const c = Math.cos(rot), s = Math.sin(rot);
    const P = ([[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]] as Array<[number, number]>).map(([a, b]) => [x + a * c - b * s, y, z + a * s + b * c] as V3);
    decals.decal.quad(P[0], P[1], P[2], P[3], { uvs: [u0, v1, u1, v1, u1, v0, u0, v0], tint: [tint[0], tint[1], tint[2]], ao: alpha, aux: [0, emissive, 0, 0], flip: true });
  };
  // a restrained set: drainage along the gutter, one manhole on the walking line, a few cracks and stains
  quadDecal('grate', -6.2, QUAY_Z - 0.9, 1.1, 0.7, 0.0, [1, 1, 1], 0.9);
  quadDecal('grate', 13.4, QUAY_Z - 0.9, 1.1, 0.7, 0.02, [1, 1, 1], 0.9);
  quadDecal('manhole', 4.4, 1.0, 1.0, 1.0, rng.range(0, 6), [1, 1, 1], 0.9);
  for (let i = 0; i < 5; i++) quadDecal('crack', rng.range(-12, 24), rng.range(-2.5, 3.5), rng.range(1.2, 2.4), rng.range(1.2, 2.4), rng.range(0, 6.28), [1, 1, 1], rng.range(0.45, 0.8));
  for (let i = 0; i < 6; i++) quadDecal('stain', rng.range(-13, 25), rng.range(-3, 3.8), rng.range(1.6, 3.2), rng.range(1.6, 3.2), rng.range(0, 6.28), [0.6, 0.62, 0.68], rng.range(0.22, 0.42));

  return { slots: S, colliders, obstacles, bollards, moorings, decals, walkable: WALK };
}

function ctxTint(r: Rng, base: V3): V3 { const k = 0.9 + r.next() * 0.2; return [base[0] * k, base[1] * k, base[2] * k]; }
