import { mat, type V3 } from '../core/MeshBuilder';
import { BuildCtx, type RoofStyle } from './Types';
import { PZ, beam, windowModule, qz, quadFacing, pickWindowKind } from './FacadeGrammar';
import { smoothstep } from '../core/noise';

export interface RoofSpec {
  style: RoofStyle;
  x0: number; x1: number;       // wall plane extents of the top floor
  zF: number; zB: number;       // front / back wall planes (zB < zF)
  yBase: number;
  pitch: number;                // radians
  ohF: number; ohB: number; ohS: number;
  crook: number;
  lean?: 'front' | 'back';       // for lean-to roofs: which way it falls
}

export interface RoofResult {
  ridgeY: number;
  ridge: V3[];
  /** unperturbed roof height at (x,z), used to seat dormers & chimneys */
  heightAt(x: number, z: number): number;
  zMid: number; xMid: number;
}

const lerp3 = (a: V3, b: V3, t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const len3 = (a: V3, b: V3) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

type Disp = (along: number, v: number) => V3;

/** A displaced bilinear tile patch A,B (eave) -> D,C (ridge). Returns the eave row and ridge row. */
function facet(ctx: BuildCtx, A: V3, B: V3, C: V3, D: V3, disp: Disp | null, tint: V3, alongAxis: 0 | 2, cell = 0.3): { eave: V3[]; ridge: V3[] } {
  const lenU = Math.max(len3(A, B), len3(D, C)), lenV = Math.max(len3(A, D), len3(B, C));
  const nu = Math.max(1, Math.ceil(lenU / cell)), nv = Math.max(1, Math.ceil(lenV / 1.1));
  const P: V3[][] = [];
  for (let j = 0; j <= nv; j++) {
    const v = j / nv;
    const L = lerp3(A, D, v), R = lerp3(B, C, v);
    const row: V3[] = [];
    for (let i = 0; i <= nu; i++) {
      const p = lerp3(L, R, i / nu);
      if (disp) { const d = disp(p[alongAxis], v); p[0] += d[0]; p[1] += d[1]; p[2] += d[2]; }
      row.push(p);
    }
    P.push(row);
  }
  const ny = (B[2] - A[2]) * (D[0] - A[0]) - (B[0] - A[0]) * (D[2] - A[2]);
  const flip = ny < 0;
  ctx.S.roof.grid(P, {
    flip, tint,
    uvFn: (u, v) => [u * lenU, v * lenV],
    aoFn: (_u, v) => 0.7 + 0.3 * smoothstep(0, 0.22, v),
  });
  return { eave: P[0], ridge: P[nv] };
}

function edgeStrip(ctx: BuildCtx, row: V3[], outward: V3, th = 0.13, tint?: V3, ao = 0.7): void {
  for (let i = 0; i < row.length - 1; i++) {
    const p = row[i], q = row[i + 1];
    quadFacing(ctx.S.timber, [p, q, [q[0], q[1] - th, q[2]], [p[0], p[1] - th, p[2]]], outward, { tint: tint ?? ctx.pal.timber, ao, grain: 'x' });
  }
}

function rafterTails(ctx: BuildCtx, row: V3[], dir: V3, spacing = 0.55): void {
  // rafter tails are eave-line micro-detail: only for frontages that carry the hero budget
  if ((ctx.p.detail ?? 1) <= 0.6) return;
  const cum: number[] = [0];
  for (let i = 1; i < row.length; i++) cum.push(cum[i - 1] + Math.hypot(row[i][0] - row[i - 1][0], row[i][2] - row[i - 1][2]));
  const total = cum[cum.length - 1];
  const grain = Math.abs(dir[0]) > 0.5 ? 'x' : 'z';
  let seg = 0;
  for (let s = spacing * 0.5; s < total; s += spacing) {
    while (seg < row.length - 2 && cum[seg + 1] < s) seg++;
    const p = row[seg], q = row[seg + 1];
    const t = (s - cum[seg]) / Math.max(1e-6, cum[seg + 1] - cum[seg]);
    const x = p[0] + (q[0] - p[0]) * t, y = p[1] + (q[1] - p[1]) * t - 0.17, z = p[2] + (q[2] - p[2]) * t;
    ctx.S.timber.boxMM(x - 0.045, y - 0.07, z - 0.045, x + 0.045, y + 0.07, z + 0.045, { tint: ctx.pal.timber, grain, ao: 0.75 });
  }
}
/** Triangular infill wall (gable end) in the current wall-local frame: base at y0 from xa..xb, apex at (xm, ya). */
export function gableFill(ctx: BuildCtx, xa: number, xb: number, y0: number, xm: number, ya: number, opts: { window?: boolean; hoist?: boolean; floor: number }): void {
  const S = ctx.S;
  ctx.count('gable');
  S.plaster.tri([xa, y0, PZ], [xb, y0, PZ], [xm, ya, PZ], { tint: ctx.pal.plaster, ao: [0.85, 0.85, 0.95] });
  const t = ctx.pal.timber;
  // frame: rakers, collar, king post
  const h = ya - y0;
  beam(ctx, xm - 0.06, y0, -0.1, xm + 0.06, ya - 0.05, 0.04, t);
  const bz = (x: number, y: number, x2: number, y2: number) => {
    const len = Math.hypot(x2 - x, y2 - y), ang = Math.atan2(y2 - y, x2 - x);
    S.with(mat([(x + x2) / 2, (y + y2) / 2, -0.03], 0, 1, 0, ang), () => S.timber.boxMM(-len / 2, -0.055, -0.07, len / 2, 0.055, 0.07, { tint: t, grain: 'x' }));
  };
  bz(xa, y0, xm, ya); bz(xb, y0, xm, ya);
  beam(ctx, xa + (xm - xa) * 0.42, y0 + h * 0.42 - 0.055, -0.1, xb - (xb - xm) * 0.42, y0 + h * 0.42 + 0.055, 0.04, t);
  if (opts.window && xb - xa > 1.4) {
    const kind = pickWindowKind(ctx, ctx.rng.bool(ctx.p.lit ?? 0.6));
    S.with(mat([xm, y0 + h * 0.1, 0.0]), () => {
      windowModule(ctx, 0, 0.0, 0.6, 0.75, { kind, shutters: 'open', floor: opts.floor });
    });
  }
  if (opts.hoist) {
    // hayloft door with hoist beam & pulley
    const y = y0 + 0.15;
    S.planks.boxMM(xm - 0.42, y, PZ - 0.02, xm + 0.42, y + 1.05, PZ + 0.04, { tint: ctx.tint(ctx.pal.shutter, 0.1), grain: 'y', ao: 0.85 });
    beam(ctx, xm - 0.55, y + 1.05, -0.1, xm + 0.55, y + 1.18, 0.06, t);
    S.timber.boxMM(xm - 0.04, ya - 0.7, 0.0, xm + 0.04, ya - 0.5, 1.15, { tint: t, grain: 'z' });
    S.metal.boxMM(xm - 0.07, ya - 0.78, 1.05, xm + 0.07, ya - 0.58, 1.12, { tint: [1, 1, 1] });
  }
}

export function chimney(ctx: BuildCtx, x: number, z: number, yBottom: number, yTop: number, w: number, d: number, brick: boolean): void {
  const S = ctx.S;
  ctx.count('chimney');
  const b = brick ? S.brick : S.stone;
  const tint = brick ? ctx.pal.brick : ctx.pal.stone;
  b.boxMM(x - w / 2, yBottom, z - d / 2, x + w / 2, yTop, z + d / 2, { tint, aoY: [0.6, 1] });
  // corbelled cap
  for (let i = 0; i < 2; i++) {
    const g = 0.05 * (i + 1), y = yTop + i * 0.1;
    b.boxMM(x - w / 2 - g, y, z - d / 2 - g, x + w / 2 + g, y + 0.1, z + d / 2 + g, { tint, ao: 0.95 });
  }
  b.boxMM(x - w / 2 - 0.02, yTop + 0.2, z - d / 2 - 0.02, x + w / 2 + 0.02, yTop + 0.3, z + d / 2 + 0.02, { tint: [tint[0] * 0.9, tint[1] * 0.9, tint[2] * 0.9], ao: 1 });
  S.dark.quad([x - w / 2 + 0.08, yTop + 0.305, z + d / 2 - 0.08], [x + w / 2 - 0.08, yTop + 0.305, z + d / 2 - 0.08], [x + w / 2 - 0.08, yTop + 0.305, z - d / 2 + 0.08], [x - w / 2 + 0.08, yTop + 0.305, z - d / 2 + 0.08], { ao: 1 });
  ctx.socket('smoke', [x, yTop + 0.35, z], [0, 1, 0], { tag: brick ? 'brick' : 'stone', width: w });
}

function dormer(ctx: BuildCtx, x: number, yRoof: number, zRoof: number, tint: V3, floor: number, lit: boolean): void {
  const S = ctx.S;
  ctx.count('dormer');
  const w = 1.05, hw = w / 2, h = 1.0, zd = zRoof + 0.55;
  const y0 = yRoof - 0.15;
  // cheeks and back-fill
  const cheek = (sx: number) => {
    S.plaster.quad([x + sx, y0 - 0.5, zd], [x + sx, y0 - 0.5, zRoof - 0.4], [x + sx, y0 + h + 0.1, zRoof - 0.4], [x + sx, y0 + h + 0.1, zd], { tint: ctx.pal.plaster, ao: 0.8, flip: sx < 0 });
  };
  cheek(-hw - 0.02); cheek(hw + 0.02);
  S.with(mat([x, y0, zd]), () => {
    qz(S.plaster, -hw, -0.5, hw, 0, PZ, 0.85, ctx.pal.plaster);
    const hole = windowModule(ctx, 0, 0.0, 0.62, 0.78, { kind: pickWindowKind(ctx, lit), shutters: 'open', floor, trim: 'timber' });
    qz(S.plaster, -hw, 0, hole[0], h, PZ, [0.85, 0.7, 0.7, 0.85], ctx.pal.plaster);
    qz(S.plaster, hole[2], 0, hw, h, PZ, [0.7, 0.85, 0.85, 0.7], ctx.pal.plaster);
    qz(S.plaster, hole[0], hole[3] + 0.0, hole[2], h, PZ, 0.7, ctx.pal.plaster);
    beam(ctx, -hw - 0.04, -0.5, BEAM_B, -hw + 0.08, h + 0.02, 0.06, ctx.pal.timber);
    beam(ctx, hw - 0.08, -0.5, BEAM_B, hw + 0.04, h + 0.02, 0.06, ctx.pal.timber);
    beam(ctx, -hw - 0.04, h - 0.04, BEAM_B, hw + 0.04, h + 0.1, 0.08, ctx.pal.timber);
    // tiny gable roof running back into the slope
    const ridgeY = h + 0.55, back = -(zd - zRoof) - 0.2;
    const A: V3 = [-hw - 0.14, h, 0.12], B: V3 = [-hw - 0.14, h, back], C: V3 = [0, ridgeY, back], D: V3 = [0, ridgeY, 0.12];
    facet(ctx, A, B, C, D, null, tint, 2, 0.4);
    const A2: V3 = [hw + 0.14, h, back], B2: V3 = [hw + 0.14, h, 0.12], C2: V3 = [0, ridgeY, 0.12], D2: V3 = [0, ridgeY, back];
    facet(ctx, A2, B2, C2, D2, null, tint, 2, 0.4);
    S.plaster.tri([-hw, h + 0.1, PZ], [hw, h + 0.1, PZ], [0, ridgeY - 0.04, PZ], { tint: ctx.pal.plaster, ao: 0.8 });
  });
}
const BEAM_B = -0.11;

export function buildRoof(ctx: BuildCtx, s: RoofSpec): RoofResult {
  const S = ctx.S, rng = ctx.rng;
  const tint: V3 = ctx.tint(ctx.pal.roof, 0.05);
  const tanP = Math.tan(s.pitch);
  const crook = s.crook;
  const ph1 = rng.range(0, 6), ph2 = rng.range(0, 6);
  const xMid = (s.x0 + s.x1) / 2, zMid = (s.zF + s.zB) / 2;
  const ridgePts: V3[] = [];
  const style = s.style === 'crooked' ? 'gable' : s.style;

  const makeDisp = (rangeLo: number, rangeHi: number, alongAxis: 0 | 2): Disp => (along, v) => {
    const k = (along - rangeLo) / (rangeHi - rangeLo);
    const sag = crook * 0.2 * Math.sin(Math.PI * Math.min(1, Math.max(0, k))) * Math.pow(v, 1.4);
    const twist = crook * 0.14 * (k - 0.5) * v;
    const wave = crook * 0.05 * Math.sin(along * 2.1 + ph2) * (1 - v) + crook * 0.03 * Math.sin(along * 5.3 + ph1);
    const wob = crook * 0.12 * Math.sin(along * 0.85 + ph1) * v;
    const out: V3 = [0, -sag + twist + wave, 0];
    if (alongAxis === 0) out[2] = wob; else out[0] = wob;
    return out;
  };

  if (style === 'gable') {
    const ezF = s.zF + s.ohF, ezB = s.zB - s.ohB;
    const xa = s.x0 - s.ohS, xb = s.x1 + s.ohS;
    const yEF = s.yBase - s.ohF * tanP, yEB = s.yBase - s.ohB * tanP;
    const yR = s.yBase + (s.zF - zMid) * tanP;
    const disp = makeDisp(xa, xb, 0);
    const f = facet(ctx, [xa, yEF, ezF], [xb, yEF, ezF], [xb, yR, zMid], [xa, yR, zMid], disp, tint, 0);
    const b = facet(ctx, [xb, yEB, ezB], [xa, yEB, ezB], [xa, yR, zMid], [xb, yR, zMid], disp, tint, 0);
    ridgePts.push(...f.ridge);
    edgeStrip(ctx, f.eave, [0, 0, 1]);
    edgeStrip(ctx, [...b.eave].reverse(), [0, 0, -1]);
    rafterTails(ctx, f.eave, [1, 0, 0]);
    rafterTails(ctx, b.eave, [-1, 0, 0]);
    // verge boards along gable ends
    for (const [x, sgn] of [[xa, -1], [xb, 1]] as Array<[number, number]>) {
      const slope: V3[] = [[x, yEF, ezF], [x, yR, zMid], [x, yEB, ezB]];
      for (let i = 0; i < 2; i++) {
        const p = slope[i], q = slope[i + 1];
        quadFacing(S.timber, [p, q, [q[0], q[1] - 0.16, q[2]], [p[0], p[1] - 0.16, p[2]]], [sgn, 0, 0], { tint: ctx.pal.timber, ao: 0.75, grain: 'z' });
      }
    }
    // gable end walls at the wall planes
    for (const side of [0, 1]) {
      const wx = side ? s.x1 : s.x0;
      const frame = side ? mat([wx, 0, 0], Math.PI / 2) : mat([wx, 0, 0], -Math.PI / 2);
      S.with(frame, () => {
        // local x = (side? -z : +z); span from back to front
        const xl0 = side ? -s.zF : s.zB, xl1 = side ? -s.zB : s.zF;
        const xm = side ? -zMid : zMid;
        gableFill(ctx, xl0, xl1, s.yBase, xm, yR, { window: true, floor: 9 });
      });
    }
    const heightAt = (_x: number, z: number) => (z >= zMid ? s.yBase + (s.zF - z) * tanP : s.yBase + (z - s.zB) * tanP);
    S.roof.sweep(ridgePts, 0.075, 5, { tint: [tint[0] * 0.8, tint[1] * 0.8, tint[2] * 0.8], ao: 0.95 });
    return { ridgeY: yR, ridge: ridgePts, heightAt, zMid, xMid };
  }

  if (style === 'gableFront') {
    const ezF = s.zF + s.ohF, ezB = s.zB - s.ohB;
    const xa = s.x0 - s.ohS, xb = s.x1 + s.ohS;
    const yE = s.yBase - s.ohS * tanP;
    const yR = s.yBase + (xMid - s.x0) * tanP;
    const disp = makeDisp(ezB, ezF, 2);
    const l = facet(ctx, [xa, yE, ezB], [xa, yE, ezF], [xMid, yR, ezF], [xMid, yR, ezB], disp, tint, 2);
    const r = facet(ctx, [xb, yE, ezF], [xb, yE, ezB], [xMid, yR, ezB], [xMid, yR, ezF], disp, tint, 2);
    ridgePts.push(...l.ridge);
    edgeStrip(ctx, l.eave, [-1, 0, 0]); edgeStrip(ctx, r.eave, [1, 0, 0]);
    rafterTails(ctx, l.eave, [0, 0, 1], 0.6); rafterTails(ctx, r.eave, [0, 0, 1], 0.6);
    // barge boards on the front and back gables
    for (const [z, sgn] of [[ezF, 1], [ezB, -1]] as Array<[number, number]>) {
      const sl: V3[] = [[xa, yE, z], [xMid, yR, z], [xb, yE, z]];
      for (let i = 0; i < 2; i++) {
        const p = sl[i], q = sl[i + 1];
        quadFacing(S.timber, [p, q, [q[0], q[1] - 0.2, q[2]], [p[0], p[1] - 0.2, p[2]]], [0, 0, sgn], { tint: ctx.pal.timber, ao: 0.8, grain: 'x' });
      }
    }
    // front gable face (in front-wall frame) and back gable
    S.with(mat([0, 0, s.zF]), () => gableFill(ctx, s.x0, s.x1, s.yBase, xMid, yR, { window: false, hoist: true, floor: 9 }));
    S.with(mat([0, 0, s.zB], Math.PI), () => gableFill(ctx, -s.x1, -s.x0, s.yBase, -xMid, yR, { window: false, floor: 9 }));
    const heightAt = (x: number) => s.yBase + (xMid - Math.abs(x - xMid)) * tanP - (s.x0 - xMid) * 0;
    S.roof.sweep(ridgePts, 0.075, 5, { tint: [tint[0] * 0.8, tint[1] * 0.8, tint[2] * 0.8], ao: 0.95 });
    return { ridgeY: yR, ridge: ridgePts, heightAt: (x) => heightAt(x), zMid, xMid };
  }

  if (style === 'hip') {
    const ezF = s.zF + s.ohF, ezB = s.zB - s.ohB;
    const xa = s.x0 - s.ohS, xb = s.x1 + s.ohS;
    const yEF = s.yBase - s.ohF * tanP, yEB = s.yBase - s.ohB * tanP;
    const run = (s.zF - zMid) + 0;
    const yR = s.yBase + run * tanP * 0.95;
    const rl = Math.max(0.5, (xb - xa) * 0.5 - (ezF - zMid) * 0.9);
    const rx0 = xMid - rl, rx1 = xMid + rl;
    const f = facet(ctx, [xa, yEF, ezF], [xb, yEF, ezF], [rx1, yR, zMid], [rx0, yR, zMid], null, tint, 0);
    const b = facet(ctx, [xb, yEB, ezB], [xa, yEB, ezB], [rx0, yR, zMid], [rx1, yR, zMid], null, tint, 0);
    const l = facet(ctx, [xa, yEB, ezB], [xa, yEF, ezF], [rx0, yR, zMid], [rx0, yR, zMid], null, tint, 2);
    const r = facet(ctx, [xb, yEF, ezF], [xb, yEB, ezB], [rx1, yR, zMid], [rx1, yR, zMid], null, tint, 2);
    edgeStrip(ctx, f.eave, [0, 0, 1]); edgeStrip(ctx, [...b.eave].reverse(), [0, 0, -1]);
    edgeStrip(ctx, l.eave, [-1, 0, 0]); edgeStrip(ctx, r.eave, [1, 0, 0]);
    rafterTails(ctx, f.eave, [1, 0, 0]); rafterTails(ctx, b.eave, [-1, 0, 0]);
    ridgePts.push([rx0, yR, zMid], [rx1, yR, zMid]);
    S.roof.sweep(ridgePts, 0.08, 5, { tint: [tint[0] * 0.8, tint[1] * 0.8, tint[2] * 0.8] });
    for (const [a, b2] of [[[xa, yEF, ezF], [rx0, yR, zMid]], [[xb, yEF, ezF], [rx1, yR, zMid]], [[xa, yEB, ezB], [rx0, yR, zMid]], [[xb, yEB, ezB], [rx1, yR, zMid]]] as Array<[V3, V3]>) S.roof.sweep([a, b2], 0.07, 5, { tint: [tint[0] * 0.8, tint[1] * 0.8, tint[2] * 0.8] });
    return { ridgeY: yR, ridge: ridgePts, heightAt: (_x, z) => (z >= zMid ? s.yBase + (s.zF - z) * tanP * 0.95 : s.yBase + (z - s.zB) * tanP * 0.95), zMid, xMid };
  }

  // lean-to: single plane falling toward the front (default) or the back
  {
    const front = (s.lean ?? 'front') === 'front';
    const ezF = s.zF + s.ohF, ezB = s.zB - s.ohB;
    const xa = s.x0 - s.ohS, xb = s.x1 + s.ohS;
    const rise = (s.zF - s.zB) * tanP;
    const yHigh = s.yBase + rise, yLowF = s.yBase - s.ohF * tanP;
    const yHighB = s.yBase + rise + s.ohB * tanP;
    const disp = makeDisp(xa, xb, 0);
    if (front) {
      const f = facet(ctx, [xa, yLowF, ezF], [xb, yLowF, ezF], [xb, yHighB, ezB], [xa, yHighB, ezB], disp, tint, 0, 0.3);
      edgeStrip(ctx, f.eave, [0, 0, 1]); rafterTails(ctx, f.eave, [1, 0, 0]);
      edgeStrip(ctx, f.ridge, [0, 0, -1], 0.2);
      for (const [x, sgn] of [[xa, -1], [xb, 1]] as Array<[number, number]>) {
        const p: V3 = [x, yLowF, ezF], q: V3 = [x, yHighB, ezB];
        quadFacing(S.timber, [p, q, [q[0], q[1] - 0.16, q[2]], [p[0], p[1] - 0.16, p[2]]], [sgn, 0, 0], { tint: ctx.pal.timber, ao: 0.75, grain: 'z' });
      }
      ridgePts.push(...f.ridge);
    } else {
      const f = facet(ctx, [xb, yLowF, ezB], [xa, yLowF, ezB], [xa, yHigh, ezF], [xb, yHigh, ezF], disp, tint, 0, 0.3);
      edgeStrip(ctx, [...f.eave].reverse(), [0, 0, -1]); ridgePts.push(...f.ridge);
    }
    return { ridgeY: yHigh, ridge: ridgePts, heightAt: (_x, z) => s.yBase + (front ? (z - s.zB) * -tanP + rise : (z - s.zB) * tanP), zMid, xMid };
  }
}

export function addDormers(ctx: BuildCtx, roof: RoofResult, s: RoofSpec, count: number): void {
  if (count <= 0) return;
  const w = s.x1 - s.x0;
  const tint = ctx.tint(ctx.pal.roof, 0.05);
  for (let i = 0; i < count; i++) {
    const x = s.x0 + w * ((i + 0.5) / count) + ctx.rng.range(-0.25, 0.25);
    const z = s.zF + s.ohF * 0.4 - 0.15;
    const y = roof.heightAt(x, z) + 0.12;
    dormer(ctx, x, y, z, tint, 9, ctx.rng.bool(ctx.p.lit ?? 0.6));
  }
}

export { beam };
