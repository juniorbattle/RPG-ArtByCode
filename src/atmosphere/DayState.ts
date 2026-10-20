import * as THREE from 'three';
import type { PostParams } from './PostFX';

/** The day states (`?time=midday`, alias `?time=day`; journal Passes Y1, Y2): the operator's day direction (AGENTS.md "Art direction",
 *  journal Passes D4 and D6) laid over the night. Absent (or `night`) = nothing created and no uniform written: the night stays
 *  pixel-identical, and stays the default until the operator approves the day in game (J9). Four fixed states are decided (D6: morning,
 *  midday, end of day, evening = the night); midday is built, the morning and the end of day are still to come. */
export type TimeOfDay = 'night' | 'midday';

export function parseTime(q: URLSearchParams): TimeOfDay | null {
  const t = q.get('time');
  return t === 'midday' || t === 'day' ? 'midday' : null;
}

export interface DayLook {
  /** the sun, in the key light's place (the moon's uniforms): a high sun and short crisp shadows */
  sunDir: THREE.Vector3;
  sunCol: THREE.Color;
  skyAmb: THREE.Color;
  groundAmb: THREE.Color;
  fillCol: THREE.Color;
  /** the horizon's colour (the haze, which the fog takes) and the zenith's */
  fogColor: THREE.Color;
  skyZenith: THREE.Color;
  fogDensity: number;
  mist: number;
  /** the cobbles' wetness (uWet, 1 at night): drier under a midday sun, a tuning choice (no decision names it) */
  wet: number;
  /** lanterns and windows unlit (J4): the window / lantern glass and the shop interiors keep only a faint glow; the forge's coals keep theirs */
  glowEmissive: number;
  shopEmissive: number;
  /** the roofs' albedo multiplier (the roof material's uBase, white at night): the saturated blue roofs of the midday track */
  roofTint: THREE.Color;
  post: Partial<PostParams>;
}

/** Midday, the tournament's launch: the generated midday track is the target (the operator, journal Passe D6: « le jour doit etre cette
 *  image joint »), `art-lab/characters/reference/sources/day-state-midday-2026-10-19.png`: a deep blue sky with white clouds, a high sun,
 *  crisp short shadows, saturated blue roofs, banners and water, almost no haze. The night's palette discipline (which mutes every blue) is
 *  off; the saturation is raised. */
export const DAY: DayLook = {
  sunDir: new THREE.Vector3(0.45, 0.82, 0.36).normalize(),
  sunCol: new THREE.Color(2.9, 2.72, 2.35),
  skyAmb: new THREE.Color(0.38, 0.4, 0.45),
  groundAmb: new THREE.Color(0.38, 0.36, 0.32),
  fillCol: new THREE.Color(0.13, 0.14, 0.17),
  fogColor: new THREE.Color(0.3, 0.52, 0.95),
  skyZenith: new THREE.Color(0.06, 0.2, 0.7),
  fogDensity: 0.003,
  mist: 0.05,
  wet: 0.2,
  glowEmissive: 0.06,
  shopEmissive: 0.35,
  roofTint: new THREE.Color(0.58, 0.74, 1.22),
  post: {
    exposure: 1.24, bloomStrength: 0.15, bloomThreshold: 3.5, vignette: 0.18, palette: 0, saturation: 1.25, contrast: 1.05,
    shadowTint: new THREE.Color(1.0, 1.0, 1.03), highlightTint: new THREE.Color(1.06, 1.02, 0.93),
  },
};

/** a light stays lit by day only if it is the forge's (J4 « Éteintes, la forge allumée »): its fire, embers and hot bar, and the fill under
 *  its hood. Its porch lanterns are lanterns, and the shop pools, candles and lamps are off. */
export function litByDay(l: { group: string; kind: string; tag?: string }): boolean {
  return (l.group === 'forge' && l.kind !== 'lantern') || l.tag === 'forge-fill';
}
