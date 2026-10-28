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
  // (journal Passe VP9, the operator's choices « Lices au pied du rempart » and « Place de la halle »: each square its own structure and its own
  // angle. The lists seen along their rampart from the east, low, the wall a diagonal from the frame's right edge to the corner tower and the
  // gallery at the far end (the district's quay, mirrored: the arena north-west of the lists rises over the wall); their zones along the yard.
  // The hall's square from high on the south-west, three quarters, its flags and its strings seen from above, the hall at the end, the
  // arcades curving along the right; its zones from the quay's gate to the hall)
  training: [
    // the yard's east end: the near tower, the butts, the wall receding to the corner tower
    { id: 'east', label: 'Wall', yaw: 46, pitch: 4.5, dist: 20, fov: 36, home: [7.5, 2.4, -3.4], ref: [10, -1], gain: [0.6, 0.25], min: [-4, -1.4], max: [5, 1.4], zone: { x0: 4, x1: 99, z0: -99, z1: 99 }, priority: 0 },
    // the lists: the champions' ring before the gallery, the stair rising to the corner tower, the arena over the rampart
    { id: 'lists', label: 'Lists', yaw: 52, pitch: 4.5, dist: 20, fov: 36, home: [0, 2.4, -3.4], ref: [0, -1], gain: [0.75, 0.25], min: [-6, -1.4], max: [6, 1.4], zone: { x0: -6, x1: 4, z0: -99, z1: 99 }, priority: 1 },
    // before the gallery: its stand, its judges' box over the passage, the corner tower
    { id: 'stand', label: 'Stand', yaw: 64, pitch: 5, dist: 18, fov: 36, home: [-8.5, 2.4, -2.0], ref: [-10, 0], gain: [0.5, 0.3], min: [-3, -1.4], max: [3, 1.4], zone: { x0: -99, x1: -6, z0: -99, z1: 99 }, priority: 2 },
  ],
  festival: [
    // the arrival by the quay's gate: from high, the setts to the hall, the arcades along the right, the well before them
    { id: 'entry', label: 'Arrival', yaw: -36, pitch: 12, dist: 24, fov: 38, home: [0.5, 3.0, -3.0], ref: [0, 2], gain: [0.6, 0.6], min: [-6, -3], max: [6, 3], zone: { x0: -99, x1: 99, z0: 1, z1: 99 }, priority: 0 },
    // the square: the strings over the hero, the hall ahead
    { id: 'square', label: 'Square', yaw: -34, pitch: 12, dist: 22, fov: 38, home: [-0.5, 3.0, -5.0], ref: [0, -2], gain: [0.6, 0.5], min: [-6, -2], max: [6, 2], zone: { x0: -99, x1: 99, z0: -5, z1: 1 }, priority: 1 },
    // under the hall: low, the camera under its eave, its timbers, its banners, its stage and its crowns (the second critique of journal Passe
    // VP9: the high framing before the hall was « a closer, tighter version of the first », the forecourt's recipe)
    { id: 'hall', label: 'Hall', yaw: -12, pitch: 5, dist: 16, fov: 40, home: [-1.5, 2.4, -10.0], ref: [-1.5, -8.5], gain: [0.5, 0.3], min: [-5, -1.2], max: [5, 1.2], zone: { x0: -99, x1: 99, z0: -99, z1: -5 }, priority: 2 },
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
 *  written for); each square's from its framings' side since journal Passe VP9 (its yaw, turned by `gain` degrees per metre east of x 0, the
 *  point clamped to its walk, the pivot `tx` of the way toward it) */
const LOOK = { pitch: 7, fov: 35, ty: 2.6 };
const LOOKS: Record<PlazaKind, { yaw: number; gain: number; tx: number; clamp: Rect }> = {
  forecourt: { yaw: 18, gain: 1.2, tx: 0.8, clamp: { x0: -9, x1: 9, z0: -15, z1: 2 } },
  training: { yaw: 54, gain: 0.5, tx: 1, clamp: { x0: -13, x1: 14, z0: -7, z1: 4.5 } },
  festival: { yaw: -20, gain: 0.8, tx: 1, clamp: { x0: -10, x1: 8.5, z0: -10.5, z1: 5.5 } },
};
export function lookPose(kind: PlazaKind, px: number, pz: number, dist: number): CamPose {
  const L = LOOKS[kind], x = THREE.MathUtils.clamp(px, L.clamp.x0, L.clamp.x1), z = THREE.MathUtils.clamp(pz, L.clamp.z0, L.clamp.z1);
  return { yaw: THREE.MathUtils.degToRad(L.yaw - x * L.gain), pitch: THREE.MathUtils.degToRad(LOOK.pitch), dist, fov: LOOK.fov, shift: 0, tx: x * L.tx, ty: LOOK.ty, tz: z };
}

/** each square's axis, from its way in from the quay or the forecourt to its monument (the framings' zones follow it; the tests walk it) */
export const PLAZA_AXIS: Record<PlazaKind, [[number, number], [number, number]]> = {
  forecourt: [[0, 6], [0, -16]], training: [[15, -1], [-14, -1]], festival: [[0, 6], [-1.5, -10.8]],
};

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
