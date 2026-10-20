import * as THREE from 'three';
import type { PostParams } from './PostFX';

/** The day states (`?time=morning`, `?time=midday` (alias `?time=day`), `?time=afternoon`; journal Passes Y1, Y2, Y4): the operator's day
 *  direction (AGENTS.md "Art direction", journal Passes D4 and D6) laid over the night. Absent (or `night`) = nothing created and no uniform
 *  written: the night stays pixel-identical, and stays the default until the operator approves the day in game (J9). Four fixed states (D6):
 *  the morning, midday (the tournament's launch), the end of day (after the tournament) and the evening, which is the night. */
export type TimeOfDay = 'night' | 'morning' | 'midday' | 'afternoon';
export type DayTime = Exclude<TimeOfDay, 'night'>;

export function parseTime(q: URLSearchParams): DayTime | null {
  const t = q.get('time');
  return t === 'midday' || t === 'day' ? 'midday' : t === 'morning' ? 'morning' : t === 'afternoon' ? 'afternoon' : null;
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
  /** the sky's compile-time variant (Sky.ts): DAY for every day state; midday's is exactly { DAY: 1 } (its shader stays the one of Passe Y2) */
  sky: Record<string, number | string>;
  /** the HUD's name of the state */
  label: string;
  /** ambient walkers at density 1 (the operator's decision J7a « Matin 6, midi 12, fin 9 », journal Passe D7; the night keeps 5) */
  crowd: number;
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
  sky: { DAY: 1 },
  label: 'Midday',
  crowd: 12,
};

/** The morning, the early risers and the preparations (the operator's note to J1): after the generated morning track,
 *  `art-lab/characters/reference/sources/day-state-morning-2026-10-19.png` (journal Passe D6). A pale sky veiled by the haze, a soft sun not
 *  yet high, from the canal side as on the track, a cool mist over the water and the far city, dewy cobbles, slate-blue roofs, a lower
 *  saturation and contrast than midday. */
export const MORNING: DayLook = {
  sunDir: new THREE.Vector3(0.42, 0.5, 0.76).normalize(),
  sunCol: new THREE.Color(2.3, 2.18, 1.95),
  skyAmb: new THREE.Color(0.4, 0.44, 0.52),
  groundAmb: new THREE.Color(0.3, 0.3, 0.3),
  fillCol: new THREE.Color(0.14, 0.15, 0.19),
  fogColor: new THREE.Color(0.6, 0.68, 0.8),
  skyZenith: new THREE.Color(0.26, 0.38, 0.6),
  fogDensity: 0.0045,
  mist: 0.25,
  wet: 0.35,
  glowEmissive: 0.06,
  shopEmissive: 0.35,
  roofTint: new THREE.Color(0.72, 0.8, 1.05),
  post: {
    exposure: 1.15, bloomStrength: 0.12, bloomThreshold: 3.5, vignette: 0.2, palette: 0, saturation: 1.0, contrast: 1.0,
    shadowTint: new THREE.Color(0.98, 1.0, 1.06), highlightTint: new THREE.Color(1.0, 1.0, 1.0),
  },
  sky: { DAY: 1, DAY_HAZE: '0.55' },
  label: 'Morning',
  crowd: 6,
};

/** The end of day, after the tournament: after the generated late-afternoon track,
 *  `art-lab/characters/reference/sources/day-state-late-afternoon-2026-10-19.png` (journal Passe D6). A low golden sun at the far end of the
 *  canal (where the moon hangs at night), long shadows toward the camera's left, a warm haze and glow around the sun, blue shadows. */
export const AFTERNOON: DayLook = {
  sunDir: new THREE.Vector3(0.8, 0.28, 0.52).normalize(),
  sunCol: new THREE.Color(3.3, 2.05, 0.95),
  skyAmb: new THREE.Color(0.3, 0.32, 0.42),
  groundAmb: new THREE.Color(0.36, 0.28, 0.2),
  fillCol: new THREE.Color(0.12, 0.12, 0.15),
  fogColor: new THREE.Color(0.95, 0.64, 0.34),
  skyZenith: new THREE.Color(0.2, 0.32, 0.58),
  fogDensity: 0.004,
  mist: 0.08,
  wet: 0.25,
  glowEmissive: 0.06,
  shopEmissive: 0.35,
  roofTint: new THREE.Color(0.8, 0.82, 0.95),
  post: {
    exposure: 1.22, bloomStrength: 0.25, bloomThreshold: 2.5, vignette: 0.25, palette: 0, saturation: 1.25, contrast: 1.05,
    shadowTint: new THREE.Color(0.94, 0.98, 1.08), highlightTint: new THREE.Color(1.1, 0.98, 0.8),
  },
  sky: { DAY: 1, DAY_SUN: '1.0' },
  label: 'End of day',
  crowd: 9,
};

export const LOOKS: Record<DayTime, DayLook> = { morning: MORNING, midday: DAY, afternoon: AFTERNOON };

/** the sky's defines: none at night (the night's sky, weather or not); a day state's own, plus DAY_WEATHER when its sky is overcast (rain, snow
 *  or storm; journal Passe Y5) - without weather a day state's sky stays exactly its own */
export function skyDefines(look: DayLook | null, overcast: boolean): Record<string, number | string> | null {
  if (!look) return null;
  return overcast ? { ...look.sky, DAY_WEATHER: 1 } : { ...look.sky };
}

/** a light stays lit by day only if it is the forge's (J4 « Éteintes, la forge allumée »): its fire, embers and hot bar, and the fill under
 *  its hood. Its porch lanterns are lanterns, and the shop pools, candles and lamps are off. */
export function litByDay(l: { group: string; kind: string; tag?: string }): boolean {
  return (l.group === 'forge' && l.kind !== 'lantern') || l.tag === 'forge-fill';
}
