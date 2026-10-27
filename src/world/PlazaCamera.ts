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
}

/** how far past its zone's edge the current framing holds (the district's) */
export const PLAZA_HYSTERESIS = 0.9;

const ALL: Rect = { x0: -99, x1: 99, z0: -99, z1: 99 };

/** the framings of each square (« proposé », journal Passe VP7) */
export const PLAZA_FRAMINGS: Record<PlazaKind, PlazaFraming[]> = {
  forecourt: [
    // the arrival by the quay's gate: the whole forecourt, the arena's front, its towers and their roofs against the sky, the way leading in
    { id: 'entry', label: 'Arrival', yaw: 0, pitch: 6.5, dist: 30, fov: 38, home: [0, 6.5, -4], ref: [0, 2], gain: [0.3, 0.2], min: [-2.5, -0.6], max: [2.5, 0.6], zone: { x0: -99, x1: 99, z0: 0.5, z1: 99 }, priority: 0 },
    // the court: the gate at the end of the way, the pavilions on each side, the hero in the lower third
    { id: 'court', label: 'Court', yaw: -4, pitch: 7.5, dist: 24, fov: 36, home: [0, 4.5, -6], ref: [0, -4], gain: [0.6, 0.4], min: [-6, -2.5], max: [6, 2.5], zone: { x0: -99, x1: 99, z0: -10, z1: 0.5 }, priority: 1 },
    // before the gate: the arch, its braziers and the arena's front up to its cornice
    { id: 'gate', label: 'Gate', yaw: 8, pitch: 8, dist: 23, fov: 40, home: [0, 6, -12], ref: [0, -13], gain: [0.5, 0.3], min: [-6, -1.5], max: [6, 1.5], zone: { x0: -99, x1: 99, z0: -99, z1: -10 }, priority: 2 },
  ],
  training: [
    // the arrival from the forecourt's side: the whole yard, the ring before the stand, the barracks and the citadel beyond
    { id: 'entry', label: 'Arrival', yaw: 0, pitch: 5, dist: 29, fov: 38, home: [1.5, 5.5, -6], ref: [0, 2], gain: [0.3, 0.2], min: [-2.5, -0.6], max: [2.5, 0.6], zone: { x0: -99, x1: 99, z0: 0.5, z1: 99 }, priority: 0 },
    // the yard: the dummy's ring and the champions' ring, the butts along the right
    { id: 'yard', label: 'Yard', yaw: -6, pitch: 7, dist: 20, fov: 36, home: [1.5, 2.8, -6], ref: [0, -4], gain: [0.6, 0.4], min: [-6, -2.5], max: [6, 2.5], zone: { x0: -99, x1: 99, z0: -5, z1: 0.5 }, priority: 1 },
    // the ring: the champions' boards, its braziers and the stand behind, from the south-east
    { id: 'ring', label: 'Ring', yaw: 12, pitch: 8, dist: 18, fov: 36, home: [1.5, 3.0, -9.5], ref: [0, -10], gain: [0.55, 0.3], min: [-6, -1.5], max: [6, 1.5], zone: { x0: -99, x1: 99, z0: -99, z1: -5 }, priority: 2 },
  ],
  festival: [
    // the arrival by the quay's gate: the whole square, the bandstand and the stage at its end, the roofs and the citadel against the sky
    { id: 'entry', label: 'Arrival', yaw: 0, pitch: 6, dist: 27, fov: 38, home: [-1.5, 5.5, -4], ref: [0, 2], gain: [0.3, 0.2], min: [-2.5, -0.6], max: [2.5, 0.6], zone: { x0: -99, x1: 99, z0: 0.5, z1: 99 }, priority: 0 },
    // the court: the stage and the bandstand on the far side, the stalls along the right, the hero in the lower third
    { id: 'court', label: 'Court', yaw: 10, pitch: 8.5, dist: 22, fov: 35, home: [-1.5, 3.5, -6], ref: [0, -4], gain: [0.6, 0.4], min: [-6, -2.5], max: [6, 2.5], zone: { x0: -99, x1: 99, z0: -9, z1: 0.5 }, priority: 1 },
    // before the stage: the boards, the bandstand and the tavern, from the east
    { id: 'stage', label: 'Stage', yaw: 24, pitch: 8.5, dist: 21, fov: 35, home: [-2.5, 3.6, -11.5], ref: [0, -12.5], gain: [0.6, 0.3], min: [-6, -1.5], max: [7, 1.5], zone: { x0: -99, x1: 99, z0: -99, z1: -9 }, priority: 2 },
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
  return { yaw: THREE.MathUtils.degToRad(f.yaw), pitch: THREE.MathUtils.degToRad(f.pitch), dist: f.dist, fov: f.fov, shift: 0, tx: f.home[0] + ox, ty: f.home[1], tz: f.home[2] + oz };
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
