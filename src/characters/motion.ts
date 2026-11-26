import { Rng } from '../core/rng';

/** How the hero and the walkers move (journal Passe MV1): the pure half, no scene, no DOM. The operator's answers on the sheet
 *  https://claude.ai/artifact/WCudyo5ttorfhtUatKbzhS (`briefs/fiche-deplacements-mv1.html`, MV-1 to MV-6, six of six at the recommendation, no note). */

/** MV-1 « A · 3,73 m/s partout, comme le quai »: the hero walks at the stride his cycle draws (the cast's walkSpeed) x the character scale of the
 *  quay's B / D framings (and the squares' CHAR_SCALE) x HERO_CLOCK: his frames play at HERO_CLOCK x the base cadence with the planted foot on the
 *  ground, on the quay and on the three squares alike (3.73 m/s with the 14-texel stride of hero-x2-v4, 11.25 frames / s; x1.25 since journal Passe MV2: 4.66 m/s, 14.1 frames / s) */
export const HERO_CLOCK = 1.875, HERO_REF_SCALE = 1.12;
/** MV-2 « A · Garder ×1,2 »: the run key (Shift, the pad's B) is a second gear on the speed MV-1 gives (4.48 m/s, 5.60 since MV2); its clock is bounded at HERO_CLOCK_MAX */
export const HERO_RUN = 1.2, HERO_CLOCK_MAX = 2.5;
export function heroSpeed(walkSpeed: number): number { return walkSpeed * HERO_REF_SCALE * HERO_CLOCK; }

/** a baked walker's animation clock runs at the speed its steps show over the ground speed its cycle draws, within these bounds: above, a cycle
 *  drawn for a much slower walk would race (the dock worker's); below, a profile seen walking almost into the depth would freeze (journal Passe S2) */
export const WALK_CLOCK_MIN = 0.4, WALK_CLOCK_MAX = 1.6;
/** the clock a walker's frames run at: `shown` m/s (the speed along the camera's right for a profile, the whole speed from the front or the back)
 *  over the ground speed its cycle draws at `charScale` (walkSpeed is the cycle's at scale 1); the hero's own bound, and no lower bound while the
 *  hero eases in or out of a walk (his feet follow the ground, MV-3) */
export function walkerClock(walkSpeed: number, charScale: number, shown: number, hero = false, easing = false): number {
  return Math.min(hero ? HERO_CLOCK_MAX : WALK_CLOCK_MAX, Math.max(hero && easing ? 0 : WALK_CLOCK_MIN, shown / (walkSpeed * charScale)));
}

/** MV-3 « A · Courte »: the hero reaches his speed in `rampUp` s and stops in `rampDown` s (7 and 6 game steps), his heading and his feet kept
 *  meanwhile; he glides about 20 cm (v x rampDown / 2) once the key is released. Below `stopBelow` m/s he is standing. */
export const GAIT = { rampUp: 0.12, rampDown: 0.10, stopBelow: 0.15 };
export interface Gait { v: number; hx: number; hz: number; top: number }
export const newGait = (): Gait => ({ v: 0, hx: 0, hz: 0, top: 0 });
/** one step of the gait: `wx, wz` the direction asked (any length; 0, 0 = none), `target` the speed asked (m/s, the run and the stick's tilt in it);
 *  returns the ground displacement of the step and the speed it was taken at. The direction turns at once at the speed the hero has. */
export function stepGait(g: Gait, wx: number, wz: number, target: number, dt: number): { dx: number; dz: number; speed: number } {
  const n = Math.hypot(wx, wz);
  if (n > 1e-9 && target > 0) {
    g.hx = wx / n; g.hz = wz / n; g.top = target;
    // the rate that takes a stand to the target in rampUp seconds; a slower target (the run key let go, a smaller tilt) is reached by the ramp down
    if (g.v < target) g.v = Math.min(target, g.v + (target / GAIT.rampUp) * dt);
    else g.v = Math.max(target, g.v - (g.v / GAIT.rampDown) * dt);
  } else if (g.v > 0) {
    g.v = Math.max(0, g.v - (Math.max(g.top, g.v) / GAIT.rampDown) * dt);
  }
  if (g.v < GAIT.stopBelow && !(n > 1e-9 && target > 0)) g.v = 0;
  return { dx: g.hx * g.v * dt, dz: g.hz * g.v * dt, speed: g.v };
}

/** the walkers' stages and stops (MV-4 « A · Une halte au plus tous les 4 m », MV-5 « A · Haltes 2 à 4 s, arrêt long 8 à 14 s, un regard de côté »):
 *  a walker keeps its destination but walks it in hops of `hopMin` to `hopMax` metres, halting `haltMin` to `haltMax` s after each; at its
 *  destination it lingers `lingerMin` to `lingerMax` s; some halts (`lookChance`) turn the resting view to a side (`lookSide`: 0 left, 1 right,
 *  2 toward the camera, the idle views of the approved sheets), at `look` of the halt's remaining time */
export const HOPS = { hopMin: 2.4, hopMax: 4, haltMin: 2, haltMax: 4, lingerMin: 8, lingerMax: 14, lookChance: 0.4 };
export interface HopPlan { hop: number; halt: number; linger: number; look: number | null; lookSide: number }
/** the plan of a walker's n-th halt, drawn from its seed and the count alone: the same walker in the same place stops the same way */
export function hopPlan(seed: number, n: number): HopPlan {
  const r = new Rng((Math.imul(seed | 0, 2654435761) + Math.imul(n + 1, 40503) + 0x9e3779b9) >>> 0);
  r.next();
  const u = () => r.next();
  const span = (a: number, b: number) => a + (b - a) * u();
  return {
    hop: span(HOPS.hopMin, HOPS.hopMax), halt: span(HOPS.haltMin, HOPS.haltMax), linger: span(HOPS.lingerMin, HOPS.lingerMax),
    look: u() < HOPS.lookChance ? 0.25 + 0.5 * u() : null, lookSide: Math.min(2, Math.floor(u() * 3)),
  };
}
/** MV-6 « A · 0,8 à 0,95 m/s comme au quai, pieds plantés »: the walkers' ground speed (the quay's: the townsfolk 0.95, the others 0.8, the porter 0.9) */
export const walkerSpeed = (crowd: boolean, porter = false): number => (porter ? 0.9 : crowd ? 0.95 : 0.8);

/** a critically damped follow (the squares' camera, Rule 6 bis of the operator: the camera moves ease in and out): moves `cur` toward `target`
 *  with the velocity `vel` kept between calls, the response time `smoothTime` s (no overshoot); starts gently where an exponential starts at
 *  its fastest. Returns the new value and velocity. */
export function smoothDamp(cur: number, target: number, vel: number, smoothTime: number, dt: number): [number, number] {
  if (dt <= 0) return [cur, vel];
  const omega = 2 / Math.max(1e-4, smoothTime), x = omega * dt, e = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = cur - target, temp = (vel + omega * change) * dt;
  return [target + (change + temp) * e, (vel - omega * temp) * e];
}
