import { Rng } from '../core/rng';
import { SlotSet, mat, type V3 } from '../core/MeshBuilder';
import type { Socket } from '../architecture/Types';
import type { DistrictConfig } from '../district/MerchantDistrictGenerator';
import { atlasRect, beam } from '../architecture/FacadeGrammar';
import { EMBLEM_CELLS, type EmblemKind } from '../materials/CanvasArt';
import { BuildCtx } from '../architecture/Types';

export interface BannerOpts {
  pos: V3; yaw?: number; w: number; h: number; emblem: EmblemKind;
  shape?: 'rect' | 'swallow' | 'pennant' | 'torn';
  /** 0..1 how loosely the banner hangs (wind sway weight) */
  loose?: number;
  rod?: boolean;
  tilt?: number;
  tint?: V3;
}

/** Cloth banner with painted heraldry (emblem atlas), wind-driven sway weight increasing toward the free edge. */
export function addBanner(S: SlotSet, o: BannerOpts): void {
  const cols = 8, rows = 14;
  const cell = EMBLEM_CELLS[o.emblem];
  const [u0, v0, u1, v1] = atlasRect(cell % 4, Math.floor(cell / 4), 4, 2, 0.006);
  const shape = o.shape ?? 'swallow';
  const loose = o.loose ?? 0.6;
  const tint: V3 = o.tint ?? [1, 1, 1];
  const uvAt = (uu: number, vv: number): [number, number] => [u0 + uu * (u1 - u0), v1 - vv * (v1 - v0)];
  S.with(mat(o.pos, o.yaw ?? 0, 1, 0, o.tilt ?? 0), () => {
    const w = o.w, h = o.h;
    const P: V3[][] = [];
    for (let j = 0; j <= rows; j++) {
      const v = j / rows, row: V3[] = [];
      for (let i = 0; i <= cols; i++) {
        const u = i / cols;
        // fold ripples across the cloth, bulging a little toward the viewer
        const fold = Math.sin(u * Math.PI * 3 + v * 2.4) * 0.025 * (0.3 + v) + Math.sin(u * Math.PI) * 0.03 * v;
        row.push([(u - 0.5) * w, -v * h, fold]);
      }
      P.push(row);
    }
    const sway = (v: number, u: number) => (0.12 + v * (0.6 + loose * 0.5)) * (shape === 'torn' ? 1.3 : 1) * (0.5 + 0.5 * Math.min(1, Math.abs(u - 0.5) * 2 + 0.4));
    const ao = (v: number) => 0.7 + 0.3 * (1 - Math.abs(v - 0.5) * 0.5);
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const v0r = j / rows, v1r = (j + 1) / rows, ua = i / cols, ub = (i + 1) / cols;
      const cx = (ua + ub) / 2, cy = (v0r + v1r) / 2;
      // cut the swallow-tail notch / the torn corner out of the cloth
      if (shape === 'swallow' && cy > 0.86 && cy > 1 - (1 - Math.abs(cx - 0.5) * 2) * 0.18) continue;
      if (shape === 'pennant' && Math.abs(cx - 0.5) * 2 < (cy - 0.3) / 0.7) continue;
      if (shape === 'torn' && ((cx > 0.55 && cy > 0.62 - (cx - 0.55) * 0.7) || (cx < 0.32 && cy > 0.88))) continue;
      const uvs = [...uvAt(ua, v0r), ...uvAt(ub, v0r), ...uvAt(ub, v1r), ...uvAt(ua, v1r)];
      S.banner.quad(P[j][i], P[j][i + 1], P[j + 1][i + 1], P[j + 1][i], { uvs, tint, ao: [ao(v0r), ao(v0r), ao(v1r), ao(v1r)], swayArr: [sway(v0r, ua), sway(v0r, ub), sway(v1r, ub), sway(v1r, ua)], aux: [0, 0, 0.37, 0] });
    }
    if (o.rod !== false) {
      S.timber.boxMM(-w / 2 - 0.1, 0.0, -0.025, w / 2 + 0.1, 0.07, 0.04, { tint: [0.8, 0.7, 0.6], grain: 'x' });
      for (const sx of [-1, 1]) S.metal.boxMM(sx * (w / 2 + 0.11) - 0.035, -0.02, -0.035, sx * (w / 2 + 0.11) + 0.035, 0.1, 0.05, { tint: [1.3, 1.1, 0.8] });
    }
  });
}
/** Rope with triangular pennants hanging in a catenary. */
export function addBunting(S: SlotSet, rng: Rng, a: V3, b: V3, o: { sag?: number; flags?: number; palette?: V3[] } = {}): void {
  const n = o.flags ?? Math.max(5, Math.round(Math.hypot(b[0] - a[0], b[2] - a[2]) / 0.55));
  const sag = o.sag ?? 0.55 + 0.04 * Math.hypot(b[0] - a[0], b[2] - a[2]);
  const pal = o.palette ?? [[0.7, 0.14, 0.12], [0.16, 0.26, 0.6], [0.78, 0.58, 0.14], [0.2, 0.5, 0.3], [0.62, 0.22, 0.4]];
  const pts: V3[] = [];
  const seg = n * 2;
  for (let i = 0; i <= seg; i++) {
    const t = i / seg;
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t]);
  }
  S.cloth.sweep(pts, 0.012, 4, { tint: [0.5, 0.42, 0.3] });
  const dx = b[0] - a[0], dz = b[2] - a[2], len = Math.hypot(dx, dz) || 1;
  const nx = -dz / len, nz = dx / len;
  for (let i = 1; i < n; i++) {
    const t = i / n;
    const p: V3 = [a[0] + dx * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + dz * t];
    const w = 0.22, h = 0.34 + rng.range(-0.03, 0.04);
    const col = pal[(i + Math.floor(rng.next() * 2)) % pal.length];
    const tx = dx / len * w, tz = dz / len * w;
    S.cloth.tri([p[0] - tx, p[1], p[2] - tz], [p[0] + tx, p[1], p[2] + tz], [p[0] + nx * 0.02, p[1] - h, p[2] + nz * 0.02], { tint: col, ao: [1, 1, 0.8], swayArr: [0.2, 0.2, 1.0], aux: [0, 0, rng.next(), 0], flip: false });
    S.cloth.tri([p[0] - tx, p[1], p[2] - tz], [p[0] + tx, p[1], p[2] + tz], [p[0] + nx * 0.02, p[1] - h, p[2] + nz * 0.02], { tint: col, ao: [1, 1, 0.8], swayArr: [0.2, 0.2, 1.0], flip: true });
  }
}

export function buildBanners(rng: Rng, cfg: DistrictConfig, buildings: Array<{ id: string; result: { sockets: Socket[] }; pos: V3; yaw: number }>, sockets: Array<Socket & { building: string }>, world: SlotSet): void {
  void cfg; void BuildCtx; void beam;
  const find = (id: string, kind: string) => sockets.find((s) => s.building === id && s.kind === kind);
  // great guild banner (scales) on the tall left building facade
  const g = find('guild', 'banner');
  if (g) {
    const yaw = Math.atan2(g.dir[0], g.dir[2]);
    addBanner(world, { pos: [g.pos[0] + g.dir[0] * 0.18, g.pos[1] + 0.3, g.pos[2] + g.dir[2] * 0.18], yaw, w: 1.35, h: 2.9, emblem: 'scales', shape: 'swallow', loose: 0.5 });
  }
  const a = find('shopA', 'banner');
  if (a) addBanner(world, { pos: [a.pos[0] + a.dir[0] * 0.15, a.pos[1] - 0.2, a.pos[2] + a.dir[2] * 0.15], yaw: Math.atan2(a.dir[0], a.dir[2]), w: 0.9, h: 1.7, emblem: 'mortar', shape: 'swallow', loose: 0.7 });
  const t = find('tall', 'banner');
  if (t) addBanner(world, { pos: [t.pos[0] + t.dir[0] * 0.15, t.pos[1] - 0.1, t.pos[2] + t.dir[2] * 0.15], yaw: Math.atan2(t.dir[0], t.dir[2]), w: 0.85, h: 1.6, emblem: 'scissors', shape: 'swallow', loose: 0.7 });
  // fleur-de-lis banner hanging on the quay wall facing the canal
  addBanner(world, { pos: [-1.8, -0.15, 4.97], yaw: 0, w: 0.95, h: 1.75, emblem: 'fleur', shape: 'swallow', loose: 0.5 });
  addBanner(world, { pos: [8.9, -0.15, 4.97], yaw: 0, w: 0.95, h: 1.75, emblem: 'fleur', shape: 'swallow', loose: 0.5 });
  // bunting across the street
  const eave = (id: string, side: 'left' | 'right') => sockets.find((s) => s.building === id && s.kind === 'bunting' && s.tag === side);
  const pairs: Array<[string, 'left' | 'right', string, 'left' | 'right', number]> = [['guild', 'right', 'shopA', 'left', 0.7], ['shopA', 'right', 'tall', 'left', 0.5], ['guild', 'left', 'shopA', 'left', 0.9]];
  for (const [ia, sa, ib, sb, sag] of pairs) {
    const A = eave(ia, sa), B = eave(ib, sb);
    if (!A || !B) continue;
    if (Math.hypot(A.pos[0] - B.pos[0], A.pos[2] - B.pos[2]) > 14) continue;
    addBunting(world, rng.fork(`${ia}${ib}`), [A.pos[0], A.pos[1], A.pos[2]], [B.pos[0], B.pos[1] - 0.2, B.pos[2]], { sag });
  }
  // a rope of lanterns-free pennants from the guild corner out over the street
  addBunting(world, rng.fork('street'), [-7.1, 6.1, 1.2], [3.6, 5.6, -3.9], { sag: 1.1 });
}
