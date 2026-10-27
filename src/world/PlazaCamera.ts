import * as THREE from 'three';
import type { CamPose } from '../app/CameraRig';
import type { PlazaKind, Rect } from './Plazas';

/** The squares' camera (journal Passe VP7, the operator's direction: « Jouer aussi sur nos angles de caméra comme district merchant et proposer
 *  une direction belle, simple et épuré »): as the Merchant District's graph (src/app/CameraGraph.ts), a few authored, semi-fixed framings per
 *  square, chosen by the zone the hero stands in (the highest priority zone wins, the current one kept within 0.9 m of its edge), the pivot
 *  following the hero by a gain and within bounds, the page easing from one framing to the next. Each framing is composed once: the square's
 *  monument on a third, the sky above its roofline in the wide ones, the near edge out of frame. A dialogue's or a cutscene's look keeps the
 *  first build's formula (`lookPose`). Pure: the page, the visibility bake and the tests share it. */

export interface PlazaFraming {
  id: string; label: string;
  /** degrees (yaw 0: the camera south of its pivot, looking north; positive: from the east, looking north-west), metres, degrees */
  yaw: number; pitch: number; dist: number; fov: number;
  /** the pivot when the hero stands at `ref`; it follows the hero by `gain` (x, z), its offset bounded by `min` / `max` */
  home: [number, number, number]; ref: [number, number]; gain: [number, number]; min: [number, number]; max: [number, number];
  /** the hero positions this framing takes; the highest `priority` among the zones containing the hero wins */
  zone: Rect; priority: number;
  /** degrees the camera turns per metre the hero stands east of `ref` (within 9 m): toward the side the hero walks to, so the camera stays
   *  between the rows (the first build's follow camera, journal Passe VP6); absent = 0 */
  turn?: number;
}

/** how far past its zone's edge the current framing holds (the district's) */
export const PLAZA_HYSTERESIS = 0.9;

/** the framings of each square (« proposé », journal Passe VP7) */
export const PLAZA_FRAMINGS: Record<PlazaKind, PlazaFraming[]> = {
  // (journal Passe VP7, iteration 3: the first build's follow camera, which both panels of two critiques preferred, near and from the side and
  // turning toward the side the hero walks to (`turn`), over the near edge as the frames' foreground; and near the monument a framing
  // composed for it. Under the framing test's rules: the hero in the frame and over the near edge, no monument hiding the hero or cut by the
  // frame's bottom edge, the camera between the rows)
  // (journal Passe VP8: the training ground's and the festival square's arrival and middle framings 3.5° lower, 3° instead of 6.5°, so the arena
  // rises over their north rows with its rim under a band of sky: at 6.5° the frame's top stood 11° over the horizon, the roofs' line, and the
  // arena showed as a sliver; at 4.5° its rim was cut by the frame, « a band of stone rather than a colosseum », the second critique; the
  // forecourt's 4.5°, its gate's battlements against the sky)
  forecourt: [
    // the arrival by the quay's gate: over the balustrade, the fountain and the arena's gate ahead
    { id: 'entry', label: 'Arrival', yaw: 12, turn: 0.8, pitch: 4.5, dist: 21, fov: 35, home: [0, 2.6, -2], ref: [0, 2], gain: [0.7, 1], min: [-7, -4], max: [7, 4], zone: { x0: -99, x1: 99, z0: 0.5, z1: 99 }, priority: 0 },
    // the court: the fountain at the heart, the gate beyond it, the hero in the lower third
    { id: 'court', label: 'Court', yaw: 12, turn: 0.8, pitch: 4.5, dist: 21, fov: 35, home: [0, 3.2, -6.5], ref: [0, -4], gain: [0.7, 1], min: [-7, -4], max: [7, 4], zone: { x0: -99, x1: 99, z0: -10, z1: 0.5 }, priority: 1 },
    // before the gate: the fountain whole in front, the arch, its braziers, the pavilions on each side
    { id: 'gate', label: 'Gate', yaw: 8, pitch: 6, dist: 21, fov: 40, home: [0, 3.6, -12], ref: [0, -13], gain: [0.5, 0.3], min: [-6, -1.5], max: [6, 1.5], zone: { x0: -99, x1: 99, z0: -99, z1: -10 }, priority: 2 },
  ],
  training: [
    // the arrival from the forecourt's street: over the fence, the yard ahead, the ring before the stand
    // (nearer since iteration 5: « In frame 1 the ring is small and far away behind a band of fence and empty cobbles »)
    { id: 'entry', label: 'Arrival', yaw: 18, turn: 1.2, pitch: 3, dist: 17, fov: 35, home: [1.5, 2.6, -3], ref: [0, 2], gain: [0.7, 1], min: [-7, -4], max: [7, 4], zone: { x0: -99, x1: 99, z0: 0.5, z1: 99 }, priority: 0 },
    // the yard: the dummy's ring, the champions' ring, the butts along the right
    // (nearer since iteration 4: « the platform is a small object in the upper middle and the lower half is empty sand »)
    { id: 'yard', label: 'Yard', yaw: 18, turn: 1.2, pitch: 3, dist: 17, fov: 35, home: [1.5, 2.6, -7], ref: [0, -4], gain: [0.7, 1], min: [-7, -4], max: [7, 4], zone: { x0: -99, x1: 99, z0: -5, z1: 0.5 }, priority: 1 },
    // the ring: the champions' boards, its braziers and the stand behind
    { id: 'ring', label: 'Ring', yaw: 10, pitch: 6, dist: 18, fov: 38, home: [1.5, 2.8, -10], ref: [0, -10], gain: [0.5, 0.5], min: [-7, -2], max: [7, 2], zone: { x0: -99, x1: 99, z0: -99, z1: -5 }, priority: 2 },
  ],
  festival: [
    // the arrival by the quay's gate: over the balustrade, the stalls along the east row, the stage and the bandstand at the end
    { id: 'entry', label: 'Arrival', yaw: -18, turn: 0.8, pitch: 3, dist: 21, fov: 35, home: [0, 2.6, -2], ref: [0, 2], gain: [0.7, 1], min: [-7, -4], max: [7, 4], zone: { x0: -99, x1: 99, z0: 0.5, z1: 99 }, priority: 0 },
    // the court: the strings over the hero, the stalls, the stage beyond
    { id: 'court', label: 'Court', yaw: -18, turn: 0.8, pitch: 3, dist: 21, fov: 35, home: [0, 2.6, -6.5], ref: [0, -4], gain: [0.7, 1], min: [-7, -4], max: [7, 4], zone: { x0: -99, x1: 99, z0: -9, z1: 0.5 }, priority: 1 },
    // before the stage: the boards, the bandstand and the tavern, from the east
    { id: 'stage', label: 'Stage', yaw: 8, pitch: 7, dist: 18, fov: 35, home: [-2, 3, -12.5], ref: [0, -12.5], gain: [0.6, 0.5], min: [-7, -2], max: [7, 2], zone: { x0: -99, x1: 99, z0: -99, z1: -9 }, priority: 2 },
  ],
};

const inside = (r: Rect, x: number, z: number, m = 0) => x >= r.x0 - m && x <= r.x1 + m && z >= r.z0 - m && z <= r.z1 + m;

/** the framing of a hero at (x, z): the highest priority zone containing them, the current one kept while they stay within its zone grown by
 *  the hysteresis */
export function framingAt(kind: PlazaKind, x: number, z: number, current: string | null = null): PlazaFraming {
  const F = PLAZA_FRAMINGS[kind];
  const best = F.filter((f) => inside(f.zone, x, z)).sort((a, b) => b.priority - a.priority)[0] ?? F[0];
  const cur = current ? F.find((f) => f.id === current) : undefined;
  if (cur && cur !== best && inside(cur.zone, x, z, PLAZA_HYSTERESIS) && !(best.priority > cur.priority && inside(best.zone, x, z, -PLAZA_HYSTERESIS))) return cur;
  return best;
}

/** every framing a hero at (x, z) can be seen in: the one their zone gives and those the hysteresis can still hold (the bake's) */
export function framingsAround(kind: PlazaKind, x: number, z: number): PlazaFraming[] {
  return PLAZA_FRAMINGS[kind].filter((f) => inside(f.zone, x, z, PLAZA_HYSTERESIS));
}

/** a framing's pose for a hero at (x, z) */
export function framingPose(f: PlazaFraming, x: number, z: number): CamPose {
  const ox = THREE.MathUtils.clamp(f.gain[0] * (x - f.ref[0]), f.min[0], f.max[0]), oz = THREE.MathUtils.clamp(f.gain[1] * (z - f.ref[1]), f.min[1], f.max[1]);
  const turn = (f.turn ?? 0) * THREE.MathUtils.clamp(x - f.ref[0], -9, 9);
  return { yaw: THREE.MathUtils.degToRad(f.yaw - turn), pitch: THREE.MathUtils.degToRad(f.pitch), dist: f.dist, fov: f.fov, shift: 0, tx: f.home[0] + ox, ty: f.home[1], tz: f.home[2] + oz };
}

/** a dialogue's or a cutscene's look at a point from `dist` (the first build's formula, journal Passe VP1: the composition its scripts were
 *  written for) */
const LOOK = { pitch: 7, fov: 35, ty: 2.6, yawGain: 1.2 };
const LOOK_YAW: Record<PlazaKind, number> = { forecourt: 18, training: 22, festival: -20 };
export function lookPose(kind: PlazaKind, px: number, pz: number, dist: number): CamPose {
  const x = THREE.MathUtils.clamp(px, -9, 9), z = THREE.MathUtils.clamp(pz, -15, 2);
  return { yaw: THREE.MathUtils.degToRad(LOOK_YAW[kind] - x * LOOK.yawGain), pitch: THREE.MathUtils.degToRad(LOOK.pitch), dist, fov: LOOK.fov, shift: 0, tx: x * 0.8, ty: LOOK.ty, tz: z };
}

/** DEV: `plazaframe=<id>:yaw,pitch,dist,fov,hx,hy,hz[,gx,gz]` changes one framing of the page's square while composing (blank = keep) */
export function tuneFraming(kind: PlazaKind, spec: string): void {
  for (const one of spec.split(';')) {
    const [id, vals] = one.split(':'); const f = PLAZA_FRAMINGS[kind].find((q) => q.id === id); if (!f || !vals) continue;
    const v = vals.split(',').map((t) => (t.trim() === '' ? null : +t));
    const set = (i: number, put: (n: number) => void) => { const n = v[i]; if (n !== null && n !== undefined && Number.isFinite(n)) put(n); };
    set(0, (n) => (f.yaw = n)); set(1, (n) => (f.pitch = n)); set(2, (n) => (f.dist = n)); set(3, (n) => (f.fov = n));
    set(4, (n) => (f.home[0] = n)); set(5, (n) => (f.home[1] = n)); set(6, (n) => (f.home[2] = n)); set(7, (n) => (f.gain[0] = n)); set(8, (n) => (f.gain[1] = n));
  }
}
