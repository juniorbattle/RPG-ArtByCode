import { Rng } from '../core/rng';

/** The version 2's sound, its pure half (lot V8, journal Passe V8; the operator's decision AV-17 « Effets, ambiances et musique simple »):
 *  everything is made by the code (Web Audio, src/audio/Sound.ts), no audio file. Here: the effects' recipes (a few oscillators and noise
 *  bursts with their envelopes), the ambiences of each place by the day state (layers of filtered noise and sparse calls: the crowd, the
 *  wind, the water, the birds by day, the crickets at night, the Colosseum's roar on the afternoons of the bouts), and the music: a short
 *  plucked tune on a mode of the day state, generated from a seed, the same notes every time. Every number « proposé ». Pure. */

export type Look = 'morning' | 'midday' | 'afternoon' | 'night';
export type SoundPlace = 'district' | 'forecourt' | 'training' | 'festival' | 'arena';

// ---------------------------------------------------------------------------------------------------------------- effects

/** one voice of an effect: an oscillator (or noise through a band-pass) sweeping from f0 to f1, its attack and decay */
export interface Voice { wave: OscillatorType | 'noise'; f0: number; f1: number; q?: number; gain: number; attack: number; decay: number; delay?: number }
export type Effect = 'hit' | 'heavy' | 'guard' | 'dodge' | 'tier' | 'release' | 'ko' | 'break' | 'click' | 'open' | 'coin' | 'step' | 'denied';

export const EFFECTS: Record<Effect, Voice[]> = {
  hit: [{ wave: 'noise', f0: 1800, f1: 600, q: 0.8, gain: 0.5, attack: 0.002, decay: 0.12 }, { wave: 'sine', f0: 140, f1: 70, gain: 0.5, attack: 0.002, decay: 0.15 }],
  heavy: [{ wave: 'noise', f0: 1200, f1: 300, q: 0.7, gain: 0.7, attack: 0.003, decay: 0.25 }, { wave: 'sine', f0: 110, f1: 45, gain: 0.8, attack: 0.003, decay: 0.32 }],
  guard: [{ wave: 'triangle', f0: 1240, f1: 1180, gain: 0.25, attack: 0.001, decay: 0.35 }, { wave: 'triangle', f0: 1873, f1: 1800, gain: 0.16, attack: 0.001, decay: 0.28 }, { wave: 'noise', f0: 4000, f1: 3000, q: 2, gain: 0.2, attack: 0.001, decay: 0.05 }],
  dodge: [{ wave: 'noise', f0: 600, f1: 2400, q: 1.2, gain: 0.35, attack: 0.04, decay: 0.18 }],
  tier: [{ wave: 'square', f0: 660, f1: 990, gain: 0.12, attack: 0.005, decay: 0.12 }],
  release: [{ wave: 'noise', f0: 900, f1: 3000, q: 1, gain: 0.3, attack: 0.01, decay: 0.15 }, { wave: 'sawtooth', f0: 220, f1: 330, gain: 0.08, attack: 0.01, decay: 0.15 }],
  ko: [{ wave: 'sine', f0: 90, f1: 35, gain: 0.9, attack: 0.005, decay: 0.9 }, { wave: 'noise', f0: 500, f1: 120, q: 0.6, gain: 0.5, attack: 0.005, decay: 0.6 }],
  break: [{ wave: 'noise', f0: 2500, f1: 400, q: 0.9, gain: 0.6, attack: 0.002, decay: 0.4 }, { wave: 'triangle', f0: 900, f1: 200, gain: 0.3, attack: 0.002, decay: 0.4 }],
  click: [{ wave: 'square', f0: 880, f1: 880, gain: 0.06, attack: 0.001, decay: 0.04 }],
  open: [{ wave: 'triangle', f0: 523, f1: 523, gain: 0.08, attack: 0.005, decay: 0.12 }, { wave: 'triangle', f0: 784, f1: 784, gain: 0.07, attack: 0.005, decay: 0.16, delay: 0.06 }],
  coin: [{ wave: 'square', f0: 1318, f1: 1318, gain: 0.07, attack: 0.002, decay: 0.08 }, { wave: 'square', f0: 1760, f1: 1760, gain: 0.07, attack: 0.002, decay: 0.2, delay: 0.07 }],
  step: [{ wave: 'noise', f0: 700, f1: 400, q: 1.5, gain: 0.08, attack: 0.002, decay: 0.05 }],
  denied: [{ wave: 'square', f0: 220, f1: 180, gain: 0.08, attack: 0.002, decay: 0.12 }],
};
/** an effect's length (its longest voice, with its delay) */
export const effectLength = (e: Effect): number => Math.max(...EFFECTS[e].map((v) => (v.delay ?? 0) + v.attack + v.decay));

// ---------------------------------------------------------------------------------------------------------------- ambiences

/** a bed of filtered noise (crowd, wind, water) and sparse calls (birds, crickets, cheers) */
export interface Bed { kind: 'crowd' | 'wind' | 'water' | 'roar'; freq: number; q: number; gain: number; sway: number }
export interface Calls { kind: 'bird' | 'cricket' | 'cheer' | 'hammer' | 'lute'; every: [number, number]; gain: number }
export interface Ambience { beds: Bed[]; calls: Calls[] }

const CROWD = (g: number): Bed => ({ kind: 'crowd', freq: 520, q: 0.7, gain: g, sway: 0.3 });
const WIND = (g: number): Bed => ({ kind: 'wind', freq: 300, q: 0.4, gain: g, sway: 0.6 });

export function ambienceOf(place: SoundPlace, look: Look, boutDay = false): Ambience {
  const night = look === 'night', beds: Bed[] = [], calls: Calls[] = [];
  beds.push(WIND(night ? 0.05 : 0.03));
  if (place === 'district') { beds.push({ kind: 'water', freq: 900, q: 0.5, gain: 0.05, sway: 0.4 }, CROWD(night ? 0.03 : 0.06)); calls.push({ kind: 'hammer', every: [5, 11], gain: night ? 0 : 0.12 }); }
  if (place === 'forecourt') beds.push(CROWD(night ? 0.04 : 0.09), { kind: 'water', freq: 1400, q: 0.8, gain: 0.03, sway: 0.2 });
  if (place === 'training') { beds.push(CROWD(night ? 0.015 : 0.04)); if (!night) calls.push({ kind: 'hammer', every: [2.5, 6], gain: 0.07 }); }
  if (place === 'festival') { beds.push(CROWD(night ? 0.1 : 0.08)); calls.push({ kind: 'lute', every: [6, 14], gain: 0.06 }); }
  if (place === 'arena') beds.push({ kind: 'roar', freq: 400, q: 0.5, gain: 0.12, sway: 0.5 });
  calls.push(night ? { kind: 'cricket', every: [1.5, 4], gain: 0.03 } : { kind: 'bird', every: [3, 9], gain: look === 'morning' ? 0.05 : 0.03 });
  if (boutDay && place !== 'arena' && !night) calls.push({ kind: 'cheer', every: [12, 25], gain: 0.06 });
  return { beds, calls: calls.filter((c) => c.gain > 0) };
}

// ---------------------------------------------------------------------------------------------------------------- music

/** the modes of the day states: bright by day, dorian at night (semitones from the tonic) */
export const MODES: Record<Look, number[]> = {
  morning: [0, 2, 4, 7, 9], midday: [0, 2, 4, 5, 7, 9, 10], afternoon: [0, 2, 4, 5, 7, 9, 11], night: [0, 2, 3, 5, 7, 9, 10],
};
export const TONIC: Record<Look, number> = { morning: 62, midday: 60, afternoon: 57, night: 57 };
export const TEMPO: Record<Look, number> = { morning: 84, midday: 96, afternoon: 76, night: 66 };
export interface Note { t: number; midi: number; dur: number; vel: number }

/** a tune of `bars` bars of 4 beats: a step-wise walk on the mode, a drone on the tonic and the fifth each bar; the same seed, the same notes */
export function tune(seed: number, look: Look, bars = 8): { notes: Note[]; drone: Note[]; length: number } {
  const r = new Rng(seed).fork(`tune:${look}`), mode = MODES[look], tonic = TONIC[look], beat = 60 / TEMPO[look];
  const notes: Note[] = [], drone: Note[] = [];
  let deg = 0;
  for (let b = 0; b < bars; b++) {
    drone.push({ t: b * 4 * beat, midi: tonic - 12, dur: 4 * beat, vel: 0.5 }, { t: b * 4 * beat, midi: tonic - 5, dur: 4 * beat, vel: 0.35 });
    for (let k = 0; k < 4; k++) {
      // a rest now and then, two eighths sometimes; the last bar comes home to the tonic
      if (r.next() < 0.15 && !(b === bars - 1 && k === 3)) continue;
      deg = b === bars - 1 && k === 3 ? 0 : Math.max(-2, Math.min(mode.length + 2, deg + r.pick([-2, -1, -1, 1, 1, 2, 0])));
      const midi = tonic + 12 * Math.floor(deg / mode.length) + mode[((deg % mode.length) + mode.length) % mode.length];
      if (r.next() < 0.25 && k < 3) {
        notes.push({ t: (b * 4 + k) * beat, midi, dur: beat * 0.5, vel: 0.7 });
        const d2 = deg + r.pick([-1, 1]), m2 = tonic + 12 * Math.floor(d2 / mode.length) + mode[((d2 % mode.length) + mode.length) % mode.length];
        notes.push({ t: (b * 4 + k + 0.5) * beat, midi: m2, dur: beat * 0.5, vel: 0.6 });
      } else notes.push({ t: (b * 4 + k) * beat, midi, dur: beat * (k === 3 ? 1.5 : 0.9), vel: k === 0 ? 0.85 : 0.65 });
    }
  }
  return { notes, drone, length: bars * 4 * beat };
}
export const hz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

// ---------------------------------------------------------------------------------------------------------------- the settings

export interface SoundSettings { volume: number; muted: boolean; music: number }
export const DEFAULT_SETTINGS: SoundSettings = { volume: 0.7, muted: false, music: 0.5 };
/** a stored setting read back, every value checked (a broken entry is the default) */
export function readSettings(text: string | null): SoundSettings {
  try {
    const o = JSON.parse(text ?? 'null');
    if (!o || typeof o !== 'object') return { ...DEFAULT_SETTINGS };
    const n = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : d);
    return { volume: n(o.volume, DEFAULT_SETTINGS.volume), muted: o.muted === true, music: n(o.music, DEFAULT_SETTINGS.music) };
  } catch { return { ...DEFAULT_SETTINGS }; }
}
