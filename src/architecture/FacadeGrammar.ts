import { MeshBuilder, mat, type V3, type Slot } from '../core/MeshBuilder';
import { BuildCtx, shopToInterior, shopToEmblem, type ShopType } from './Types';
import { WINDOW_CELLS, SHOP_CELLS, EMBLEM_CELLS, type WindowKind, type ShopKind, type EmblemKind } from '../materials/CanvasArt';

/** Reusable facade modules. Every module works in a WALL-LOCAL frame: x along the wall, y up, z outward,
 *  and the plaster plane at PZ. BuildingGenerator pushes the right frame for front / side / back walls. */

export const PZ = -0.05;          // plaster plane
export const BEAM_BACK = -0.11;   // timber sits proud of the plaster
export const BEAM_FRONT = 0.045;

type Rect = [number, number, number, number];

export function atlasRect(col: number, row: number, cols: number, rows: number, inset = 0.004): [number, number, number, number] {
  const u0 = col / cols + inset, u1 = (col + 1) / cols - inset;
  const v1 = 1 - row / rows - inset, v0 = 1 - (row + 1) / rows + inset;
  return [u0, v0, u1, v1];
}
const quv = (r: [number, number, number, number]) => [r[0], r[1], r[2], r[1], r[2], r[3], r[0], r[3]];

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const cross = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const dot = (a: V3, b: V3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];

/** quad whose front face is guaranteed to look along `want` */
export function quadFacing(b: MeshBuilder, p: [V3, V3, V3, V3], want: V3, o: Parameters<MeshBuilder['quad']>[4] = {}): void {
  const n = cross(sub(p[1], p[0]), sub(p[3], p[0]));
  b.quad(p[0], p[1], p[2], p[3], { ...o, flip: dot(n, want) < 0 ? !o.flip : !!o.flip });
}

/** XY plane quad facing +z. ao = [bl, br, tr, tl] */
export function qz(b: MeshBuilder, x0: number, y0: number, x1: number, y1: number, z: number, ao: number[] | number, tint: V3, o: Parameters<MeshBuilder['quad']>[4] = {}): void {
  b.quad([x0, y0, z], [x1, y0, z], [x1, y1, z], [x0, y1, z], { tint, ao, ...o });
}

export function beam(ctx: BuildCtx, x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, tint?: V3, slot: Slot = 'timber', ao = 1): void {
  const dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0), dz = Math.abs(z1 - z0);
  const grain = dx >= dy && dx >= dz ? 'x' : dy >= dz ? 'y' : 'z';
  ctx.S.get(slot).boxMM(Math.min(x0, x1), Math.min(y0, y1), Math.min(z0, z1), Math.max(x0, x1), Math.max(y0, y1), Math.max(z0, z1), { tint: tint ?? ctx.pal.timber, grain, ao });
}

/** Diagonal beam in the wall plane (brace), thickness t. */
export function brace(ctx: BuildCtx, xa: number, ya: number, xb: number, yb: number, t = 0.11, tint?: V3): void {
  const len = Math.hypot(xb - xa, yb - ya), ang = Math.atan2(yb - ya, xb - xa);
  ctx.S.with(mat([(xa + xb) / 2, (ya + yb) / 2, (BEAM_BACK + BEAM_FRONT) / 2 - 0.005], 0, 1, 0, ang), () => {
    ctx.S.timber.boxMM(-len / 2, -t / 2, -0.065, len / 2, t / 2, 0.065, { tint: tint ?? ctx.pal.timber, grain: 'x' });
  });
}

/** Wall panel (plaster/stone/brick) with at most one rectangular hole. Painted AO darkens edges and openings. Around a hole the panel is
 *  nine pieces at most (the rows below and above it split at the hole's verticals): every edge two pieces share has the same two ends.
 *  The former strips under and over the hole ran across the whole panel, and the side strips' corners sat in the middle of their edges
 *  (a T-junction), where one MSAA sample saw through to the wall behind (journal Passes 5b / Z2). The AO of a row varies in y only and
 *  the UVs come from the world position, so the split is invisible. */
export function panelWithHole(ctx: BuildCtx, slot: Slot, x0: number, y0: number, x1: number, y1: number, hole: Rect | null, tint: V3, aoEdge = 0.86, aoHole = 0.6): void {
  const b = ctx.S.get(slot);
  if (!hole) { qz(b, x0, y0, x1, y1, PZ, [aoEdge, aoEdge, aoEdge, aoEdge], tint); return; }
  const [hx0, hy0, hx1, hy1] = hole;
  const left = hx0 > x0 + 0.001, right = x1 > hx1 + 0.001;
  const row = (ya: number, yb: number, ao: number[]) => {
    if (left) qz(b, x0, ya, hx0, yb, PZ, ao, tint);
    qz(b, hx0, ya, hx1, yb, PZ, ao, tint);
    if (right) qz(b, hx1, ya, x1, yb, PZ, ao, tint);
  };
  if (hy0 > y0 + 0.001) row(y0, hy0, [aoEdge, aoEdge, aoHole, aoHole]);
  if (y1 > hy1 + 0.001) row(hy1, y1, [aoHole, aoHole, aoEdge, aoEdge]);
  if (left) qz(b, x0, hy0, hx0, hy1, PZ, [aoEdge, aoHole, aoHole, aoEdge], tint);
  if (right) qz(b, hx1, hy0, x1, hy1, PZ, [aoHole, aoEdge, aoEdge, aoHole], tint);
}

/** Recess reveals of a rectangular opening, from the wall plane back to depth d (in `slot`, dark AO). */
function reveals(ctx: BuildCtx, slot: Slot, x0: number, y0: number, x1: number, y1: number, d: number, tint: V3, aoFront = 0.7, aoBack = 0.35): void {
  const b = ctx.S.get(slot);
  const z0 = PZ, z1 = PZ - d;
  quadFacing(b, [[x0, y0, z1], [x0, y0, z0], [x0, y1, z0], [x0, y1, z1]], [1, 0, 0], { tint, ao: [aoBack, aoFront, aoFront, aoBack] });
  quadFacing(b, [[x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1]], [-1, 0, 0], { tint, ao: [aoBack, aoFront, aoFront, aoBack] });
  quadFacing(b, [[x0, y1, z1], [x0, y1, z0], [x1, y1, z0], [x1, y1, z1]], [0, -1, 0], { tint, ao: [aoBack * 0.8, aoFront * 0.8, aoFront * 0.8, aoBack * 0.8] });
  quadFacing(b, [[x0, y0, z1], [x0, y0, z0], [x1, y0, z0], [x1, y0, z1]], [0, 1, 0], { tint, ao: [aoBack, aoFront, aoFront, aoBack] });
}

export function pickWindowKind(ctx: BuildCtx, lit: boolean, arch = false): WindowKind {
  const r = ctx.rng;
  if (!lit) return r.bool(0.8) ? 'dark' : 'shutter';
  if (arch) return 'arch';
  return r.weighted<WindowKind>(['warm', 'dim', 'curtain', 'candle', 'hot'], [0.4, 0.24, 0.2, 0.13, 0.03]);
}

export interface WindowOpts {
  kind: WindowKind;
  shutters?: 'none' | 'open' | 'closed';
  flowerbox?: boolean;
  trim?: 'timber' | 'stone';
  floor: number;
  /** extra emissive scale for individual windows */
  glowScale?: number;
}

export function windowModule(ctx: BuildCtx, cx: number, ySill: number, w: number, h: number, o: WindowOpts, slot: Slot = 'plaster'): Rect {
  const S = ctx.S, rng = ctx.rng;
  const x0 = cx - w / 2, x1 = cx + w / 2, y0 = ySill, y1 = ySill + h;
  const d = 0.17;
  const wallTint = ctx.pal.plaster;
  ctx.count('window');
  reveals(ctx, slot === 'stone' ? 'stone' : 'plaster', x0, y0, x1, y1, d, slot === 'stone' ? ctx.pal.stone : wallTint);
  const idx = WINDOW_CELLS[o.kind];
  const uv = quv(atlasRect(idx % 4, Math.floor(idx / 4), 4, 2));
  const gs = o.glowScale ?? (0.85 + rng.next() * 0.3);
  S.glow.quad([x0, y0, PZ - d], [x1, y0, PZ - d], [x1, y1, PZ - d], [x0, y1, PZ - d], { uvs: uv, tint: [gs, gs, gs], aux: [0, o.kind === 'dark' ? 0 : 1, rng.next(), 0], ao: 1 });
  // casing and sill
  const tcol = o.trim === 'stone' ? ctx.pal.stone : ctx.pal.timber;
  const tslot: Slot = o.trim === 'stone' ? 'stone' : 'timber';
  const c = 0.075;
  beam(ctx, x0 - c, y1, BEAM_BACK, x1 + c, y1 + c * 1.3, BEAM_FRONT + 0.02, tcol, tslot, 0.9);
  beam(ctx, x0 - c, y0 - c, BEAM_BACK, x0, y1, BEAM_FRONT, tcol, tslot, 0.9);
  beam(ctx, x1, y0 - c, BEAM_BACK, x1 + c, y1, BEAM_FRONT, tcol, tslot, 0.9);
  beam(ctx, x0 - c * 1.4, y0 - c * 1.1, BEAM_BACK, x1 + c * 1.4, y0, BEAM_FRONT + 0.1, tcol, tslot, 0.8);
  // mullion + transom in front of the glass
  if (w > 0.55) beam(ctx, cx - 0.018, y0, PZ - d + 0.03, cx + 0.018, y1, PZ - d + 0.07, ctx.pal.timber, 'timber', 0.85);
  if (h > 0.8) beam(ctx, x0, y0 + h * 0.52 - 0.018, PZ - d + 0.03, x1, y0 + h * 0.52 + 0.018, PZ - d + 0.07, ctx.pal.timber, 'timber', 0.85);
  // shutters
  if (o.shutters && o.shutters !== 'none') {
    const sc = ctx.tint(ctx.pal.shutter, 0.1);
    if (o.shutters === 'open') {
      const lw = w * 0.5 - 0.01;
      for (const s of [-1, 1]) {
        const sx = s < 0 ? x0 - c - lw : x1 + c;
        S.planks.boxMM(sx, y0 - 0.02, 0.0, sx + lw, y1 + 0.02, 0.06, { tint: sc, grain: 'y', ao: 0.9 });
        for (let k = 1; k < 4; k++) S.planks.boxMM(sx + 0.03, y0 + (h * k) / 4 - 0.01, 0.06, sx + lw - 0.03, y0 + (h * k) / 4 + 0.015, 0.075, { tint: sc, grain: 'x' });
      }
    } else {
      const lw = w * 0.5 + c * 0.5;
      for (const s of [-1, 1]) {
        const sx = s < 0 ? cx - lw : cx;
        S.planks.boxMM(sx, y0 - 0.02, 0.0, sx + lw, y1 + 0.02, 0.06, { tint: sc, grain: 'y', ao: 0.85 });
        for (let k = 1; k < 4; k++) S.planks.boxMM(sx + 0.03, y0 + (h * k) / 4 - 0.01, 0.06, sx + lw - 0.03, y0 + (h * k) / 4 + 0.015, 0.075, { tint: sc, grain: 'x' });
      }
    }
  }
  if (o.flowerbox) {
    S.planks.boxMM(x0 - 0.05, y0 - 0.2, 0.0, x1 + 0.05, y0 - 0.02, 0.24, { tint: ctx.tint(ctx.pal.shutter, 0.2), grain: 'x', ao: 0.8 });
    ctx.socket('prop', [cx, y0 - 0.02, 0.12], [0, 1, 0], { tag: 'flowerbox', width: w });
  }
  if (o.kind !== 'dark' && o.kind !== 'shutter') {
    const wp: V3 = [cx, y0 + h * 0.5, 0.2];
    ctx.windows.push({ pos: S.plaster.world(wp), dir: S.plaster.worldDir([0, 0, 1]), kind: o.kind, lit: true, floor: o.floor });
  }
  return [x0, y0, x1, y1];
}

export interface DoorOpts { arched?: boolean; open?: boolean; step?: boolean; double?: boolean }

export function doorModule(ctx: BuildCtx, x0: number, x1: number, yBase: number, h: number, o: DoorOpts = {}): Rect {
  const S = ctx.S, rng = ctx.rng;
  ctx.count('door');
  const y1 = yBase + h;
  const d = 0.24;
  reveals(ctx, 'stone', x0, yBase, x1, y1, d, ctx.pal.stone, 0.7, 0.3);
  const cx = (x0 + x1) / 2;
  const leaf = ctx.tint(ctx.pal.shutter, 0.1);
  if (o.open) {
    S.shop.quad([x0, yBase, PZ - d], [x1, yBase, PZ - d], [x1, y1, PZ - d], [x0, y1, PZ - d], { uvs: quv(atlasRect(SHOP_CELLS.tavern % 2, Math.floor(SHOP_CELLS.tavern / 2), 2, 2)), tint: [0.9, 0.9, 0.9], ao: [0.7, 0.7, 1, 1], aux: [0, 1, rng.next(), 0] });
    // leaf swung open against the reveal
    S.with(mat([x0 + 0.02, yBase, PZ - 0.02], -1.15), () => {
      S.planks.boxMM(0, 0.0, -0.03, (x1 - x0) * 0.92, h - 0.04, 0.03, { tint: leaf, grain: 'y', ao: 0.75 });
    });
  } else {
    S.planks.boxMM(x0 + 0.01, yBase, PZ - 0.16, x1 - 0.01, y1 - 0.02, PZ - 0.1, { tint: leaf, grain: 'y', aoY: [0.8, 0.95] });
    if (o.double) S.timber.boxMM(cx - 0.02, yBase, PZ - 0.1, cx + 0.02, y1 - 0.02, PZ - 0.07, { tint: ctx.pal.timber });
    for (const fy of [0.22, 0.72]) S.metal.boxMM(x0 + 0.03, yBase + h * fy - 0.04, PZ - 0.1, x1 - 0.03, yBase + h * fy + 0.04, PZ - 0.085, { tint: [1, 1, 1], grain: 'x' });
    S.metal.boxMM(x1 - 0.2, yBase + h * 0.46, PZ - 0.095, x1 - 0.12, yBase + h * 0.46 + 0.08, PZ - 0.06, { tint: [1.2, 1.1, 1] });
  }
  // stone surround / lintel
  const sc = ctx.pal.stone;
  const t = 0.16;
  S.stone.boxMM(x0 - t, yBase, BEAM_BACK, x0, y1 + 0.02, BEAM_FRONT + 0.03, { tint: sc, ao: 0.88 });
  S.stone.boxMM(x1, yBase, BEAM_BACK, x1 + t, y1 + 0.02, BEAM_FRONT + 0.03, { tint: sc, ao: 0.88 });
  S.timber.boxMM(x0 - t - 0.04, y1, BEAM_BACK, x1 + t + 0.04, y1 + 0.2, BEAM_FRONT + 0.05, { tint: ctx.pal.timber, grain: 'x', ao: 0.9 });
  if (o.step !== false) S.stone.boxMM(x0 - 0.12, 0, BEAM_FRONT, x1 + 0.12, 0.13, 0.5, { tint: sc, aoY: [0.75, 1] });
  ctx.socket('door', [cx, yBase, 0.5], [0, 0, 1], { width: x1 - x0 });
  lampBracket(ctx, x1 + t + 0.32, y1 + 0.5, 0.5, 'door');
  return [x0, yBase, x1, y1];
}

export interface ShopOpts { interior: ShopKind; counter?: boolean; awningTint?: V3; awning?: boolean; stripes?: boolean; slotWall: Slot; shutters?: boolean }

/** Wide shop opening with glowing interior, counter and awning. */
export function shopOpening(ctx: BuildCtx, x0: number, x1: number, y0: number, h: number, o: ShopOpts): Rect {
  const S = ctx.S, rng = ctx.rng;
  ctx.count('shop');
  const y1 = y0 + h, d = 0.95;
  const cx = (x0 + x1) / 2;
  // dark timber-lined box, glowing back wall
  const idx = SHOP_CELLS[o.interior];
  S.shop.quad([x0, y0, PZ - d], [x1, y0, PZ - d], [x1, y1, PZ - d], [x0, y1, PZ - d], { uvs: quv(atlasRect(idx % 2, Math.floor(idx / 2), 2, 2)), tint: [1, 1, 1], aux: [0, 1, rng.next(), 0], ao: [0.8, 0.8, 1, 1] });
  const side = (xa: number, dirx: number) => quadFacing(S.glow, [[xa, y0, PZ - d], [xa, y0, PZ], [xa, y1, PZ], [xa, y1, PZ - d]], [dirx, 0, 0], { uvs: quv(atlasRect(0, 0, 4, 2, 0.2)), tint: [0.6, 0.35, 0.18], ao: [1, 0.12, 0.12, 1], aux: [0, 0.4, rng.next(), 0] });
  side(x0, 1); side(x1, -1);
  quadFacing(S.glow, [[x0, y1, PZ - d], [x0, y1, PZ], [x1, y1, PZ], [x1, y1, PZ - d]], [0, -1, 0], { uvs: quv(atlasRect(0, 0, 4, 2, 0.2)), tint: [0.5, 0.28, 0.14], ao: [1, 0.08, 0.08, 1], aux: [0, 0.4, rng.next(), 0] });
  // heavy timber frame
  const pw = 0.22;
  beam(ctx, x0 - pw, y0, BEAM_BACK - 0.02, x0, y1 + 0.3, BEAM_FRONT + 0.06, ctx.pal.timber, 'timber', 0.9);
  beam(ctx, x1, y0, BEAM_BACK - 0.02, x1 + pw, y1 + 0.3, BEAM_FRONT + 0.06, ctx.pal.timber, 'timber', 0.9);
  beam(ctx, x0 - pw, y1, BEAM_BACK - 0.02, x1 + pw, y1 + 0.3, BEAM_FRONT + 0.1, ctx.pal.timber, 'timber', 0.95);
  // knee braces
  brace(ctx, x0, y1 - 0.5, x0 + 0.5, y1, 0.1);
  brace(ctx, x1, y1 - 0.5, x1 - 0.5, y1, 0.1);
  if (o.counter !== false) {
    const cz = 0.62;
    S.planks.boxMM(x0 - 0.05, 0.0, PZ + 0.02, x1 + 0.05, 0.92, cz, { tint: ctx.tint(ctx.pal.shutter, 0.15), grain: 'y', aoY: [0.55, 0.9] });
    S.timber.boxMM(x0 - 0.12, 0.92, PZ + 0.02, x1 + 0.12, 1.0, cz + 0.14, { tint: ctx.pal.timber, grain: 'x', ao: 0.95 });
    ctx.socket('prop', [cx, 1.0, 0.36], [0, 0, 1], { tag: 'counter', width: x1 - x0 });
  }
  if (o.awning !== false) awning(ctx, x0 - 0.35, x1 + 0.35, y1 + 0.28, 1.35, 0.55, o.awningTint ?? ctx.pal.awning, !!o.stripes);
  // light pool onto the street
  ctx.light({ pos: [cx, y0 + 1.55, 1.1], color: [1.0, 0.62, 0.3], intensity: 1.9, radius: 6.5, kind: 'window', halo: 0, priority: 3, tag: 'shop' });
  ctx.windows.push({ pos: S.plaster.world([cx, y0 + 1.4, 0.3]), dir: S.plaster.worldDir([0, 0, 1]), kind: 'warm', lit: true, floor: 0 });
  ctx.socket('stall', [cx, 0, 1.6], [0, 0, 1], { width: x1 - x0, tag: 'shopfront' });
  return [x0, y0, x1, y1];
}

/** Sloped cloth awning with scalloped valance. Wall edge at z=0.02, front edge at z=depth. */
export function awning(ctx: BuildCtx, x0: number, x1: number, yTop: number, depth: number, drop: number, tint: V3, stripes: boolean): void {
  const S = ctx.S, rng = ctx.rng;
  ctx.count('awning');
  const n = Math.max(3, Math.round((x1 - x0) / 0.32));
  const dx = (x1 - x0) / n;
  // stripes stay tonal (same hue, slightly lighter) so canvas reads as one calm shape
  const alt: V3 = [tint[0] * 1.14 + 0.02, tint[1] * 1.14 + 0.02, tint[2] * 1.12 + 0.02];
  for (let i = 0; i < n; i++) {
    const xa = x0 + i * dx, xb = xa + dx;
    const t = stripes && i % 2 ? alt : tint;
    const sag = (u: number) => -0.05 * Math.sin(u * Math.PI);
    const ya = (u: number) => sag(u);
    // roof strip, 2 rows
    const rowsN = 3;
    for (let r = 0; r < rowsN; r++) {
      const v0 = r / rowsN, v1 = (r + 1) / rowsN;
      const p = (x: number, v: number): V3 => [x, yTop - drop * v + ya(v), 0.02 + (depth - 0.02) * v];
      quadFacing(S.cloth, [p(xa, v0), p(xb, v0), p(xb, v1), p(xa, v1)], [0, 1, 0.5], { tint: t, ao: [0.8 + 0.2 * v0, 0.8 + 0.2 * v0, 0.8 + 0.2 * v1, 0.8 + 0.2 * v1], swayArr: [v0 * 0.5, v0 * 0.5, v1 * 0.5, v1 * 0.5], aux: [0, 0, rng.next(), 0] });
    }
    // valance teeth
    const yf = yTop - drop + ya(1), zf = depth;
    const tooth = 0.17;
    S.cloth.quad([xa, yf, zf], [xb, yf, zf], [xb, yf - 0.1, zf + 0.02], [xa, yf - 0.1, zf + 0.02], { tint: t, ao: 0.9, swayArr: [0.5, 0.5, 0.6, 0.6] });
    S.cloth.tri([xa, yf - 0.1, zf + 0.02], [xb, yf - 0.1, zf + 0.02], [(xa + xb) / 2, yf - 0.1 - tooth, zf + 0.025], { tint: t, ao: 0.9, swayArr: [0.6, 0.6, 0.8], flip: true });
  }
  // wall rod + front rod
  beam(ctx, x0, yTop - 0.025, -0.04, x1, yTop + 0.025, 0.05, ctx.pal.timber, 'timber');
  for (const x of [x0 + 0.04, x1 - 0.04]) brace(ctx, x, yTop - 0.35, x, yTop, 0.06);
  // slender front poles
  if (depth > 1.2) for (const x of [x0 + 0.08, x1 - 0.08]) S.timber.boxMM(x - 0.035, 0, depth - 0.08, x + 0.035, yTop - drop - 0.05, depth - 0.01, { tint: ctx.pal.timber, grain: 'y', aoY: [0.7, 1] });
}

export function balcony(ctx: BuildCtx, x0: number, x1: number, y: number, depth = 0.95): void {
  const S = ctx.S;
  ctx.count('balcony');
  S.planks.boxMM(x0 - 0.1, y - 0.1, 0.0, x1 + 0.1, y, depth, { tint: ctx.tint(ctx.pal.shutter, 0.1), grain: 'x', ao: 0.8 });
  beam(ctx, x0 - 0.1, y - 0.2, 0.0, x1 + 0.1, y - 0.1, 0.1, ctx.pal.timber, 'timber', 0.8);
  const n = Math.max(4, Math.round((x1 - x0) / 0.22));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    S.timber.boxMM(x - 0.025, y, depth - 0.06, x + 0.025, y + 0.95, depth - 0.01, { tint: ctx.pal.timber, grain: 'y', aoY: [0.8, 1] });
  }
  for (const s of [0, 1]) {
    const xs = s ? x1 + 0.08 : x0 - 0.08;
    for (let i = 1; i <= 4; i++) S.timber.boxMM(xs - 0.025, y, (depth * i) / 5 - 0.025, xs + 0.025, y + 0.95, (depth * i) / 5 + 0.025, { tint: ctx.pal.timber, grain: 'y' });
    S.timber.boxMM(xs - 0.035, y + 0.92, 0, xs + 0.035, y + 0.98, depth, { tint: ctx.pal.timber, grain: 'z' });
  }
  S.timber.boxMM(x0 - 0.1, y + 0.92, depth - 0.07, x1 + 0.1, y + 0.99, depth, { tint: ctx.pal.timber, grain: 'x' });
  for (const x of [x0 + 0.1, x1 - 0.1]) { brace(ctx, x, y - 0.75, x, y - 0.2, 0.09); }
  for (const x of [x0 + 0.1, x1 - 0.1]) {
    ctx.S.with(mat([x, y - 0.2, 0]), () => {
      ctx.S.timber.boxMM(-0.045, -0.5, 0.0, 0.045, 0.0, 0.1, { tint: ctx.pal.timber });
    });
  }
  ctx.socket('prop', [(x0 + x1) / 2, y, depth * 0.5], [0, 1, 0], { tag: 'balcony', width: x1 - x0 });
}

/** Painted shield sign on an iron bracket. */
export function hangingSign(ctx: BuildCtx, x: number, y: number, armLen: number, emblem: EmblemKind): void {
  const S = ctx.S;
  ctx.count('sign');
  beam(ctx, x - 0.03, y - 0.03, -0.04, x + 0.03, y + 0.03, armLen, [1, 1, 1], 'metal');
  brace(ctx, x, y - 0.5, x, y, 0.045, [1, 1, 1]);
  S.with(mat([x, y - 0.5, 0]), () => { S.metal.boxMM(-0.025, 0, -0.04, 0.025, 0.5, 0.0, { tint: [1, 1, 1] }); });
  // scroll curl
  S.metal.boxMM(x - 0.02, y - 0.16, armLen * 0.55, x + 0.02, y, armLen * 0.55 + 0.04, { tint: [1, 1, 1] });
  const idx = EMBLEM_CELLS[emblem];
  const r = atlasRect(idx % 4, Math.floor(idx / 4), 4, 2, 0.01);
  const [u0, v0, u1, v1] = r;
  const zc = armLen - 0.08, w = 0.62, h = 0.78, ytop = y - 0.2;
  const cu = (u0 + u1) / 2;
  const P: V3[] = [[x - w / 2, ytop, zc], [x + w / 2, ytop, zc], [x + w / 2, ytop - h * 0.5, zc], [x, ytop - h, zc], [x - w / 2, ytop - h * 0.5, zc]];
  const uvOf = (p: V3): [number, number] => [u0 + ((p[0] - (x - w / 2)) / w) * (u1 - u0), v1 - ((ytop - p[1]) / h) * (v1 - v0)];
  const center: V3 = [x, ytop - h * 0.4, zc];
  void cu;
  // shield on both faces; slight sway
  for (const face of [0, 1]) {
    const z = zc + (face ? 0.025 : -0.025);
    for (let i = 0; i < 5; i++) {
      const a = P[i], b = P[(i + 1) % 5];
      const A: V3 = [a[0], a[1], z], B: V3 = [b[0], b[1], z], C: V3 = [center[0], center[1], z];
      const uv = [...uvOf(A), ...uvOf(B), ...uvOf(C)];
      S.banner.tri(A, B, C, { uvs: uv, tint: [1, 1, 1], ao: 1, flip: face === 1, aux: [0.1, 0, ctx.rng.next(), 0] });
    }
  }
  for (const sx of [-w * 0.35, w * 0.35]) S.metal.boxMM(x + sx - 0.01, ytop, zc - 0.02, x + sx + 0.01, y - 0.03, zc + 0.02, { tint: [1, 1, 1] });
  ctx.socket('sign', [x, ytop - h / 2, zc], [0, 0, 1], { tag: emblem });
}

/** Wall bracket for a lantern. The lantern itself is an instanced prop placed at the socket by the district. */
export function lampBracket(ctx: BuildCtx, x: number, y: number, reach = 0.5, tag = 'wall'): void {
  const S = ctx.S;
  ctx.count('lamp');
  S.metal.boxMM(x - 0.03, y - 0.03, -0.05, x + 0.03, y + 0.03, reach, { tint: [1, 1, 1] });
  brace(ctx, x, y - 0.4, x, y, 0.04, [1, 1, 1]);
  S.metal.boxMM(x - 0.05, y - 0.08, -0.07, x + 0.05, y + 0.08, -0.03, { tint: [1, 1, 1] });
  S.metal.boxMM(x - 0.015, y - 0.18, reach - 0.015, x + 0.015, y, reach + 0.015, { tint: [1, 1, 1] });
  ctx.socket('lamp', [x, y - 0.3, reach], [0, 0, 1], { tag });
}

/** Sill/top rails + studs + braces for a plain framed panel; ratio controls density. */
export function frameStuds(ctx: BuildCtx, x0: number, y0: number, x1: number, y1: number, ratio: number, skipWindow?: Rect): void {
  const w = x1 - x0, h = y1 - y0;
  if (ratio > 0.35 && w > 0.8) {
    const n = Math.floor(w / (0.9 - ratio * 0.4));
    for (let i = 1; i <= n; i++) {
      const x = x0 + (w * i) / (n + 1);
      if (skipWindow && x > skipWindow[0] - 0.1 && x < skipWindow[2] + 0.1) continue;
      beam(ctx, x - 0.055, y0, BEAM_BACK, x + 0.055, y1, BEAM_FRONT - 0.01, ctx.pal.timber, 'timber', 0.95);
    }
  }
  if (!skipWindow && ctx.rng.next() < 0.25 + ratio * 0.65 && w > 0.7) {
    const dirR = ctx.rng.bool();
    brace(ctx, dirR ? x0 : x1, y0, dirR ? x1 : x0, y1, 0.12);
    if (ratio > 0.75 && w > 1.2) brace(ctx, dirR ? x1 : x0, y0, dirR ? (x0 + x1) / 2 : (x0 + x1) / 2, y0 + h * 0.5, 0.1);
  }
  void h;
}

export function shopTypeAwning(ctx: BuildCtx, t: ShopType): V3 {
  // canvas family: ivory (lit from inside it glows warm) or deep slate-indigo; never saturated hues
  const map: Record<ShopType, V3> = {
    smith: [0.16, 0.17, 0.22], apothecary: [0.2, 0.25, 0.36], tailor: [0.62, 0.6, 0.56], tavern: [0.66, 0.62, 0.55], guild: [0.17, 0.21, 0.36], general: [0.6, 0.58, 0.54], house: [0.24, 0.26, 0.32],
  };
  return ctx.tint(map[t], 0.08);
}
export { shopToInterior, shopToEmblem };
