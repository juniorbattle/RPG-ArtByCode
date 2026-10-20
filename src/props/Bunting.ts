import type { SlotSet, V3 } from '../core/MeshBuilder';
import type { Socket } from '../architecture/Types';

/** The tournament's bunting, by day only (the operator's decisions D6 « Comme l'image » and J6 « Le jour seulement »; journal Passe Y3), after
 *  the generated midday track: blue and ivory pennants on cords, along the frontage, across the street to the quay lamps and along the quay
 *  wall. Untracked geometry (part 0: never culled). No random draw: the district's seed stream is untouched, and nothing is built at night. */
const BLUE: V3 = [0.2, 0.3, 0.78];
const IVORY: V3 = [1.0, 0.94, 0.78];
const CORD: V3 = [0.3, 0.26, 0.22];

export interface GarlandOpts {
  /** pennant height, width along the cord, spacing between pennant centres (m) */
  size: number; width: number; spacing: number;
  /** which colour starts the row */
  phase?: number;
}

/** a cord hung from a to b with a parabolic sag, pennants pointing down along it; the cloth slot (double-sided, wind) carries both, the
 *  pennants' tips sway */
export function garland(S: SlotSet, a: V3, b: V3, sag: number, o: GarlandOpts): void {
  const at = (t: number): V3 => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t), a[2] + (b[2] - a[2]) * t];
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  if (len < 0.5) return;
  const seg = Math.max(4, Math.ceil(len / 0.5));
  for (let i = 0; i < seg; i++) {
    const p = at(i / seg), q = at((i + 1) / seg);
    S.cloth.quad(p, q, [q[0], q[1] - 0.025, q[2]], [p[0], p[1] - 0.025, p[2]], { tint: CORD, ao: 0.8 });
  }
  const n = Math.max(1, Math.floor(len / o.spacing)), hw = o.width / 2 / len;
  for (let k = 0; k < n; k++) {
    const t = (k + 0.5) / n, p0 = at(Math.max(0, t - hw)), p1 = at(Math.min(1, t + hw)), m = at(t);
    S.cloth.tri(p0, p1, [m[0], m[1] - o.size, m[2]], { tint: (k + (o.phase ?? 0)) % 2 ? IVORY : BLUE, ao: 0.9, swayArr: [0.05, 0.05, 0.9] });
  }
}

export interface BuntingInput {
  /** the district's sockets in world space: the 'bunting' ones tagged left1 / right1 sit at the top of each house's first upper floor */
  sockets: Array<Socket & { building: string }>;
  /** the tops of the quay lamps of the walkable stretch */
  lampTops: V3[];
  /** the quay wall: its x span, the pennants' cord height and depth (just under the coping, in front of the wall face), spans to skip */
  quay: { x0: number; x1: number; y: number; z: number; skip: Array<[number, number]> };
}

export function buildBunting(S: SlotSet, inp: BuntingInput): void {
  const front = inp.sockets.filter((s) => s.kind === 'bunting' && (s.tag === 'left1' || s.tag === 'right1') && !s.building.startsWith('bg'));
  // along the frontage: one swag across each house's first upper floor
  const byHouse = new Map<string, V3[]>();
  for (const s of front) byHouse.set(s.building, [...(byHouse.get(s.building) ?? []), s.pos]);
  let phase = 0;
  for (const pts of byHouse.values()) {
    if (pts.length !== 2) continue;
    const [a, b] = [...pts].sort((p, q) => p[0] - q[0]);
    garland(S, a, b, 0.55, { size: 0.42, width: 0.34, spacing: 0.42, phase: phase++ });
  }
  // across the street: from the nearest frontage anchor down to each quay lamp
  for (const top of inp.lampTops) {
    let best: V3 | null = null;
    for (const s of front) if (!best || Math.abs(s.pos[0] - top[0]) < Math.abs(best[0] - top[0])) best = s.pos;
    if (best && Math.abs(best[0] - top[0]) < 4) garland(S, best, top, 0.45, { size: 0.34, width: 0.28, spacing: 0.4 });
  }
  // along the quay wall: scallops under the coping, the landing steps left clear
  const q = inp.quay, span = 2.4;
  for (let x = q.x0; x + span <= q.x1; x += span) {
    if (q.skip.some(([s0, s1]) => x + span > s0 && x < s1)) continue;
    garland(S, [x, q.y, q.z], [x + span, q.y, q.z], 0.08, { size: 0.38, width: 0.32, spacing: 0.4, phase: Math.round(x / span) & 1 });
  }
}
