import * as THREE from 'three';
import type { CamPose, CameraRig } from './CameraRig';

/** Camera Graph V1: a small set of authored, semi-fixed framings for the Merchant District, selected by where
 *  the player stands and blended smoothly (never a free orbit). All three share the same side of the canal and
 *  look up-canal (+x), so blends are short arcs and screen directions never flip.
 *
 *    A  establishing / arrival  wide, low, down the canal: bridge, upper city, castle and moon; player small
 *    B  merchant / interaction  the frontal stall view: stalls and shopfronts dominant, city secondary
 *    C  close district          the forge yard: a closer push-in on the same axis, little background
 *
 *  A -> B -> C is the spatial order along the quay; transitions only ever happen between neighbours. */

export type CamId = 'A' | 'B' | 'C';
export const CAM_IDS: CamId[] = ['A', 'B', 'C'];
/** visibility sets: the three framings plus the poses sampled along their transitions */
export type VisSet = CamId | 'AB' | 'BC';

/** One authored framing (angles in degrees). The pivot follows the smoothed player focus:
 *  pivot = home + clamp(gain * (focus - ref), min, max) on x (along the quay) and z (across it). */
export interface CameraAnchor {
  id: CamId; label: string;
  yaw: number; pitch: number; dist: number; fov: number; shift: number;
  home: [number, number, number]; ref: [number, number];
  gain: [number, number]; min: [number, number]; max: [number, number];
  /** apparent character scale in this framing (readability pass), blended with the camera */
  charScale: number;
}

/** axis-aligned trigger area on the quay; the highest priority zone containing the player wins */
export interface CameraZone { id: CamId; x0: number; x1: number; z0: number; z1: number; priority: number }

export interface CamState extends CamPose { charScale: number }

export const DEFAULT_ANCHORS: Record<CamId, CameraAnchor> = {
  A: {
    id: 'A', label: 'Establishing / arrival',
    yaw: -78, pitch: 2.5, dist: 44, fov: 38, shift: 0,
    home: [5.0, 4.6, 1.9], ref: [-12, 1.2], gain: [0.35, 0.2], min: [-1, -0.6], max: [3, 0.6],
    charScale: 1.0,
  },
  // the art director's frontal stall view, re-staged: a touch higher (characters separate vertically), a longer
  // lens (stalls and shopfronts fill the frame, the city drops to a secondary band) and a tighter follow
  B: {
    id: 'B', label: 'Merchant / interaction',
    yaw: -57.5, pitch: 8, dist: 26, fov: 30, shift: 0,
    home: [-3.2, 2.6, 0.6], ref: [-7.5, 1.2], gain: [0.75, 0.35], min: [-4, -1], max: [30, 1],
    charScale: 1.12,
  },
  // a push-in on nearly the same axis: almost the B camera position with a long lens, so the blend reads as a
  // zoom; the boat's banner stays on the right as a framing element instead of crossing the forge yard
  C: {
    id: 'C', label: 'Close district (forge)',
    yaw: -60, pitch: 8.5, dist: 27, fov: 24, shift: 0,
    home: [7.6, 2.1, -0.5], ref: [8.0, 0.5], gain: [0.5, 0.25], min: [-1.6, -0.6], max: [2.2, 0.6],
    charScale: 1.15,
  },
};

/** A owns the west end of the quay (arrival), C the forge yard away from the water's edge, B everything else */
export const DEFAULT_ZONES: CameraZone[] = [
  { id: 'B', x0: -1e3, x1: 1e3, z0: -1e3, z1: 1e3, priority: 0 },
  { id: 'A', x0: -1e3, x1: -9.4, z0: -1e3, z1: 1e3, priority: 1 },
  { id: 'C', x0: 4.2, x1: 13.2, z0: -1e3, z1: 2.4, priority: 2 },
];

const D2R = Math.PI / 180;
const smoother = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

export function lerpState(a: CamState, b: CamState, t: number): CamState {
  let dy = b.yaw - a.yaw;
  while (dy > Math.PI) dy -= Math.PI * 2;
  while (dy < -Math.PI) dy += Math.PI * 2;
  return {
    yaw: a.yaw + dy * t, pitch: lerp(a.pitch, b.pitch, t), dist: lerp(a.dist, b.dist, t), fov: lerp(a.fov, b.fov, t), shift: lerp(a.shift, b.shift, t),
    tx: lerp(a.tx, b.tx, t), ty: lerp(a.ty, b.ty, t), tz: lerp(a.tz, b.tz, t), charScale: lerp(a.charScale, b.charScale, t),
  };
}

export class CameraGraph {
  readonly anchors: Record<CamId, CameraAnchor> = structuredClone(DEFAULT_ANCHORS);
  zones: CameraZone[] = DEFAULT_ZONES.map((z) => ({ ...z }));
  /** extra metres the player must move past a zone edge before the zone releases (hysteresis) */
  margin = 0.9;
  /** focus smoothing rate (1/s): the pivot trails the player slightly so the camera never jitters */
  followRate = 2.0;
  /** force one framing (debug panel / ?camera=); null = zone driven */
  forced: CamId | null = null;
  /** arrival hold: the establishing shot is kept until the player first moves */
  arrival = false;
  /** the framing the camera is in or blending toward */
  target: CamId = 'B';
  state!: CamState;
  private source: { id: CamId } | { snap: CamState; ids: CamId[] } | null = null;
  private t = 0;
  private dur = 1;
  private readonly focus = new THREE.Vector3();

  evalAnchor(id: CamId, fx: number, fz: number): CamState {
    const a = this.anchors[id];
    const ox = clamp(a.gain[0] * (fx - a.ref[0]), a.min[0], a.max[0]);
    const oz = clamp(a.gain[1] * (fz - a.ref[1]), a.min[1], a.max[1]);
    return { yaw: a.yaw * D2R, pitch: a.pitch * D2R, dist: a.dist, fov: a.fov, shift: a.shift, tx: a.home[0] + ox, ty: a.home[1], tz: a.home[2] + oz, charScale: a.charScale };
  }

  private inside(z: CameraZone, x: number, y: number, m: number): boolean { return x >= z.x0 - m && x <= z.x1 + m && y >= z.z0 - m && y <= z.z1 + m; }

  /** zone choice with hysteresis: the current zone holds until the player is `margin` past its edge */
  zoneFor(x: number, z: number, current: CamId | null = this.target): CamId {
    let best: CameraZone | null = null;
    for (const zn of this.zones) if (this.inside(zn, x, z, 0) && (!best || zn.priority > best.priority)) best = zn;
    const cur = current ? this.zones.find((zn) => zn.id === current && this.inside(zn, x, z, this.margin)) : undefined;
    if (cur && (!best || best.priority <= cur.priority)) return cur.id;
    return best ? best.id : 'B';
  }

  /** blend length scales with how far the framing travels (0.6 s for a nudge, 1.2 s for A <-> B) */
  private duration(a: CamState, b: CamState): number {
    const d = Math.abs(a.yaw - b.yaw) / (25 * D2R) + Math.abs(a.pitch - b.pitch) / (8 * D2R) + Math.abs(a.dist - b.dist) / 20 + Math.hypot(a.tx - b.tx, a.tz - b.tz) / 18 + Math.abs(a.fov - b.fov) / 10;
    return clamp(0.6 + 0.3 * d, 0.6, 1.2);
  }

  /** jump to the settled framing for this player position (spawn, teleport, screenshots) */
  snap(player: THREE.Vector3, rig: CameraRig): void {
    this.focus.copy(player);
    this.target = this.forced ?? (this.arrival ? 'A' : this.zoneFor(player.x, player.z, null));
    this.source = null;
    this.state = this.evalAnchor(this.target, this.focus.x, this.focus.z);
    if (!rig.manual) rig.setPose(this.state);
  }

  update(player: THREE.Vector3, dt: number, rig: CameraRig): void {
    this.focus.lerp(player, 1 - Math.exp(-dt * this.followRate));
    const want = this.forced ?? (this.arrival ? 'A' : this.zoneFor(player.x, player.z));
    if (want !== this.target) {
      // retarget from wherever the camera is right now: an interrupted blend continues from its current pose
      const ids = this.source ? [...('id' in this.source ? [this.source.id] : this.source.ids), this.target] : [this.target];
      this.source = this.source ? { snap: { ...this.state }, ids: [...new Set(ids)] } : { id: this.target };
      this.dur = this.duration(this.state, this.evalAnchor(want, this.focus.x, this.focus.z));
      this.t = 0;
      this.target = want;
    }
    const tgt = this.evalAnchor(this.target, this.focus.x, this.focus.z);
    if (this.source) {
      this.t += dt;
      const w = smoother(Math.min(1, this.t / this.dur));
      const src = 'id' in this.source ? this.evalAnchor(this.source.id, this.focus.x, this.focus.z) : this.source.snap;
      this.state = lerpState(src, tgt, w);
      if (this.t >= this.dur) this.source = null;
    } else this.state = tgt;
    if (!rig.manual) rig.setPose(this.state);
  }

  /** framings that may be on screen right now (both ends of a blend) */
  activeIds(): CamId[] {
    if (!this.source) return [this.target];
    return [...new Set([...('id' in this.source ? [this.source.id] : this.source.ids), this.target])];
  }

  get blending(): boolean { return !!this.source; }
  get blendT(): number { return this.source ? Math.min(1, this.t / this.dur) : 1; }

  /** Representative poses of every framing over its zone, plus poses sampled along each transition (the
   *  AB / BC buffers). The visibility bake renders these, so nothing a blend can show is ever culled. */
  samplePoses(walk: { x0: number; x1: number; z0: number; z1: number }): Array<{ set: VisSet; pose: CamState }> {
    const out: Array<{ set: VisSet; pose: CamState }> = [];
    const seen = new Set<string>();
    const add = (set: VisSet, pose: CamState) => {
      const k = `${set}:${[pose.yaw, pose.pitch, pose.dist, pose.fov, pose.tx, pose.tz].map((v) => v.toFixed(2)).join(',')}`;
      if (!seen.has(k)) { seen.add(k); out.push({ set, pose }); }
    };
    const zs = [walk.z0 + 0.7, 0.5, walk.z1 - 0.45];
    const range = (a: number, b: number, s: number) => { const r: number[] = []; for (let x = a; x <= b + 1e-6; x += s) r.push(x); return r; };
    // A over its zone and wherever the arrival hold can show it (the spawn sits in the market)
    for (const x of [walk.x0 + 0.5, -11.5, -10, -8, -6, -4]) for (const z of zs) add('A', this.evalAnchor('A', x, z));
    for (const x of range(-9, walk.x1, 2)) for (const z of zs) if (this.zoneFor(x, z, null) === 'B') add('B', this.evalAnchor('B', x, z));
    for (const x of [4.5, 7, 9.5, 12.5]) for (const z of [walk.z0 + 0.7, 0, 2]) add('C', this.evalAnchor('C', x, z));
    // transitions, sampled where the zones meet (and where the arrival hold releases): the AB / BC buffers
    const pairs: Array<[CamId, CamId, VisSet, number[], number[]]> = [['A', 'B', 'AB', [-11, -9.4, -7.5, -5], [-1, 2.5]], ['B', 'C', 'BC', [4.2, 8.5, 13.2], [0, 2.4]]];
    for (const [a, b, set, xs, zz] of pairs) for (const x of xs) for (const z of zz) for (const w of [0.33, 0.67]) {
      add(set, lerpState(this.evalAnchor(a, x, z), this.evalAnchor(b, x, z), smoother(w)));
    }
    return out;
  }
}
