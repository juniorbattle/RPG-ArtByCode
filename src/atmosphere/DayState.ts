import * as THREE from 'three';
import type { PostParams } from './PostFX';

/** The day state (`?time=day`, journal Passe Y1): the operator's day art direction (AGENTS.md "Art direction", journal Passe D4) laid over
 *  the night. Absent = nothing created and no uniform written: the night stays pixel-identical (J9 « Après ma revue en jeu »: the night
 *  stays the default until the operator approves the day in game). Two fixed states, chosen at boot (J8 « Deux états fixes »). */
export type TimeOfDay = 'night' | 'day';

export function parseTime(q: URLSearchParams): TimeOfDay | null {
  return q.get('time') === 'day' ? 'day' : null;
}

export interface DayLook {
  /** the sun, in the key light's place (the moon's uniforms): midday, a high sun and short crisp shadows (J1 « Midi ») */
  sunDir: THREE.Vector3;
  sunCol: THREE.Color;
  /** the night's palette rule transposed (J2): slate and cool stone ambient, the ivory-warm sun as the warm accent */
  skyAmb: THREE.Color;
  groundAmb: THREE.Color;
  fillCol: THREE.Color;
  /** a pale sky veiled with thin cloud and a light haze (J3); no city glow by day */
  fogColor: THREE.Color;
  skyZenith: THREE.Color;
  fogDensity: number;
  mist: number;
  /** the cobbles drier than the night's (uWet, 1 at night): a tuning choice of this draft, not one of the sheet's decisions */
  wet: number;
  /** lanterns and windows unlit (J4): the window / lantern glass and the shop interiors keep only a faint glow; the forge's coals keep theirs */
  glowEmissive: number;
  shopEmissive: number;
  post: Partial<PostParams>;
}

export const DAY: DayLook = {
  sunDir: new THREE.Vector3(0.45, 0.82, 0.36).normalize(),
  sunCol: new THREE.Color(2.6, 2.3, 1.8),
  skyAmb: new THREE.Color(0.34, 0.38, 0.45),
  groundAmb: new THREE.Color(0.26, 0.24, 0.21),
  fillCol: new THREE.Color(0.1, 0.11, 0.13),
  fogColor: new THREE.Color(0.7, 0.74, 0.8),
  skyZenith: new THREE.Color(0.5, 0.6, 0.75),
  fogDensity: 0.006,
  mist: 0.1,
  wet: 0.35,
  glowEmissive: 0.06,
  shopEmissive: 0.35,
  post: { exposure: 1.0, bloomStrength: 0.18, bloomThreshold: 3.0, vignette: 0.22, palette: 0.6, saturation: 1.0,
    shadowTint: new THREE.Color(0.96, 0.99, 1.1), highlightTint: new THREE.Color(1.08, 1.01, 0.9) },
};

/** a light stays lit by day only if it is the forge's (J4 « Éteintes, la forge allumée »): its fire, embers and hot bar, and the fill under
 *  its hood. Its porch lanterns are lanterns, and the shop pools, candles and lamps are off. */
export function litByDay(l: { group: string; kind: string; tag?: string }): boolean {
  return (l.group === 'forge' && l.kind !== 'lantern') || l.tag === 'forge-fill';
}
