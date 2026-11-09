/** The version 2's sound, its pure half (lot V8, journal Passe V8; the operator's decisions in journal Passe SN1):
 *  written here and played by the code (Web Audio, src/audio/Sound.ts); a baked file would come only through a manifest (SA-8). Here: the effects' recipes (a few oscillators and noise
 *  bursts with their envelopes), the ambiences of each place by the day state (layers of filtered noise and sparse calls: the crowd, the
 *  wind, the water, the birds by day, the crickets at night, the Colosseum's roar on the afternoons of the bouts), and the music's levels (the
 *  band's pieces are baked: src/audio/plan.ts, ./catalogue.json, journal Passe SN10). Every number « proposé ». Pure. */

export type Look = 'morning' | 'midday' | 'afternoon' | 'night';
export type SoundPlace = 'district' | 'forecourt' | 'training' | 'festival' | 'arena';

// ---------------------------------------------------------------------------------------------------------------- effects

/** one voice of an effect: an oscillator (or noise through a band-pass) sweeping from f0 to f1, its attack and decay */
export interface Voice { wave: OscillatorType | 'noise'; f0: number; f1: number; q?: number; gain: number; attack: number; decay: number; delay?: number }
export type Effect = 'hit' | 'heavy' | 'guard' | 'dodge' | 'tier' | 'release' | 'ko' | 'break' | 'click' | 'open' | 'coin' | 'step' | 'denied';

export const EFFECTS: Record<Effect, Voice[]> = {
  hit: [{ wave: 'noise', f0: 3200, f1: 900, q: 0.7, gain: 1, attack: 0.001, decay: 0.1 }, { wave: 'noise', f0: 1400, f1: 700, q: 0.9, gain: 0.8, attack: 0.002, decay: 0.16 }, { wave: 'sine', f0: 210, f1: 85, gain: 0.32, attack: 0.002, decay: 0.14 }, { wave: 'sine', f0: 1780, f1: 1745, gain: 0.12, attack: 0.001, decay: 0.22 }, { wave: 'sine', f0: 4870, f1: 4800, gain: 0.06, attack: 0.001, decay: 0.12 }],
  heavy: [{ wave: 'noise', f0: 2400, f1: 500, q: 0.6, gain: 1, attack: 0.002, decay: 0.22 }, { wave: 'noise', f0: 1000, f1: 420, q: 0.8, gain: 0.9, attack: 0.003, decay: 0.3 }, { wave: 'sine', f0: 150, f1: 48, gain: 0.5, attack: 0.003, decay: 0.3 }, { wave: 'sine', f0: 1280, f1: 1240, gain: 0.16, attack: 0.001, decay: 0.36 }, { wave: 'sine', f0: 3510, f1: 3440, gain: 0.08, attack: 0.001, decay: 0.24 }],
  guard: [{ wave: 'triangle', f0: 1240, f1: 1180, gain: 0.3, attack: 0.001, decay: 0.35 }, { wave: 'triangle', f0: 1873, f1: 1800, gain: 0.2, attack: 0.001, decay: 0.28 }, { wave: 'sine', f0: 3397, f1: 3350, gain: 0.08, attack: 0.001, decay: 0.16 }, { wave: 'noise', f0: 4000, f1: 3000, q: 2, gain: 0.4, attack: 0.001, decay: 0.05 }],
  dodge: [{ wave: 'noise', f0: 600, f1: 2400, q: 1.2, gain: 0.35, attack: 0.04, decay: 0.18 }],
  tier: [{ wave: 'square', f0: 660, f1: 990, gain: 0.12, attack: 0.005, decay: 0.12 }],
  release: [{ wave: 'noise', f0: 900, f1: 3000, q: 1, gain: 0.3, attack: 0.01, decay: 0.15 }, { wave: 'sawtooth', f0: 220, f1: 330, gain: 0.08, attack: 0.01, decay: 0.15 }],
  ko: [{ wave: 'sine', f0: 120, f1: 38, gain: 0.6, attack: 0.005, decay: 0.9 }, { wave: 'noise', f0: 1800, f1: 240, q: 0.6, gain: 1, attack: 0.003, decay: 0.6 }, { wave: 'noise', f0: 700, f1: 200, q: 0.8, gain: 0.9, attack: 0.004, decay: 0.8 }, { wave: 'sine', f0: 960, f1: 900, gain: 0.18, attack: 0.002, decay: 0.8 }],
  break: [{ wave: 'noise', f0: 2500, f1: 400, q: 0.9, gain: 0.6, attack: 0.002, decay: 0.4 }, { wave: 'triangle', f0: 900, f1: 200, gain: 0.3, attack: 0.002, decay: 0.4 }],
  click: [{ wave: 'square', f0: 880, f1: 880, gain: 0.46, attack: 0.001, decay: 0.06 }],
  open: [{ wave: 'triangle', f0: 523, f1: 523, gain: 0.24, attack: 0.005, decay: 0.16 }, { wave: 'triangle', f0: 784, f1: 784, gain: 0.22, attack: 0.005, decay: 0.2, delay: 0.06 }],
  coin: [{ wave: 'square', f0: 1318, f1: 1318, gain: 0.16, attack: 0.002, decay: 0.1 }, { wave: 'square', f0: 1760, f1: 1760, gain: 0.16, attack: 0.002, decay: 0.22, delay: 0.07 }],
  step: [{ wave: 'noise', f0: 900, f1: 350, q: 0.9, gain: 0.7, attack: 0.002, decay: 0.08 }, { wave: 'sine', f0: 120, f1: 70, gain: 0.14, attack: 0.002, decay: 0.07 }],
  denied: [{ wave: 'square', f0: 220, f1: 180, gain: 0.18, attack: 0.002, decay: 0.14 }],
};
/** an effect's length (its longest voice, with its delay) */
export const effectLength = (e: Effect): number => Math.max(...EFFECTS[e].map((v) => (v.delay ?? 0) + v.attack + v.decay));
/** the effects of the interface: their own bus, heard over a crowd */
export const UI_EFFECTS: ReadonlySet<Effect> = new Set<Effect>(['click', 'open', 'coin', 'denied']);

/** how much a take of an effect may move: its pitch (a share), its level (dB) and its length (a share); the interface stays the same each time */
export const VARY: Partial<Record<Effect, { pitch: number; db: number; time: number }>> = {
  hit: { pitch: 0.1, db: 2, time: 0.2 }, heavy: { pitch: 0.08, db: 1.5, time: 0.15 }, guard: { pitch: 0.06, db: 1.5, time: 0.12 }, dodge: { pitch: 0.12, db: 2, time: 0.15 },
  release: { pitch: 0.08, db: 1.5, time: 0.1 }, break: { pitch: 0.06, db: 1, time: 0.1 }, ko: { pitch: 0.04, db: 0.5, time: 0.05 }, step: { pitch: 0.16, db: 3, time: 0.2 },
};
export const dbGain = (db: number): number => 10 ** (db / 20);
/** one take of an effect (journal Passes SN1 / SN2: eight fixed sounds, a hundred a minute): each voice its own small drift, the whole moved by a
 *  draw that keeps away from the previous one, so no blow repeats the blow before it */
export function take(e: Effect, draw: () => number, last = 2): { voices: Voice[]; k: number } {
  const v = VARY[e]; if (!v) return { voices: EFFECTS[e], k: 0 };
  let k = draw() * 2 - 1; if (Math.abs(k - last) < 0.35) k = k > 0 ? k - 0.8 : k + 0.8;
  const level = dbGain(v.db * (draw() * 2 - 1)), time = 1 + v.time * (draw() * 2 - 1);
  return { k, voices: EFFECTS[e].map((x) => { const f = (1 + v.pitch * k) * (1 + 0.015 * (draw() * 2 - 1)); return { ...x, f0: Math.max(20, x.f0 * f), f1: Math.max(20, x.f1 * f), gain: Math.min(1, x.gain * level), decay: x.decay * time }; }) };
}

/** what a duel's event sounds like: an effect, its level, its side of the stage, its pitch */
export interface DuelCue { effect: Effect; gain?: number; pan?: number; rate?: number }
/** Ren stands on the left of the stage, the opponent on the right: a blow is heard where it lands */
const sideOf = (who: unknown): number => (who === 'ren' ? -0.28 : 0.28);
/** the duel's events to its sounds (it was ArenaApp.soundOf): a tier the AP close is silent, as its effect on screen; each open tier a step higher;
 *  a light release is the blade's own business, only a heavy blow or a skill sounds at the release (combatFx's rule, `e.ok && e.idx >= 1`) */
export function duelCue(e: { type: string } & Record<string, unknown>): DuelCue | null {
  if (e.type === 'impact') return { effect: e.result === 'dodged' ? 'dodge' : e.result === 'guarded' ? 'guard' : e.result === 'guardbreak' ? 'break' : e.kind === 'heavy' || (e.damage as number) >= 20 ? 'heavy' : 'hit', pan: sideOf(e.to) };
  if (e.type === 'ko') return { effect: 'ko' };
  if (e.type === 'break') return { effect: 'break', pan: sideOf(e.who) };
  if (e.type === 'chargeTier') return e.open ? { effect: 'tier', rate: 2 ** (2 * (e.idx as number) / 12), pan: sideOf('ren') } : null;
  if (e.type === 'chargeRelease') return e.ok && (e.idx as number) >= 1 ? { effect: 'release', pan: sideOf('ren') } : null;
  if (e.type === 'commandDenied') return e.who === 'ren' ? { effect: 'denied' } : null;
  if (e.type === 'reactStart') return e.who === 'ren' ? { effect: 'dodge', gain: 0.6, pan: sideOf('ren') } : null;
  return null;
}
/** a step every this many metres walked */
export const STEP_EVERY = 1;

// ---------------------------------------------------------------------------------------------------------------- ambiences

/** a bed of filtered noise (crowd, wind, water) and sparse calls (birds, crickets, cheers): the places' sound of lots V8 and S0, which the operator kept on the
 *  sheet of lot S2 (briefs/fiche-son-lieux.html, journal Passe SN19): S2-VILLE, S2-PARVIS, S2-LICES and S2-HALLE « Garder l’ambiance d’aujourd’hui » */
export interface Bed { kind: 'crowd' | 'wind' | 'water' | 'roar'; freq: number; q: number; gain: number; sway: number }
export interface Calls { kind: 'bird' | 'cricket' | 'cheer' | 'hammer' | 'lute'; every: [number, number]; gain: number }
/** a call's place in the stereo field: how far it may wander to each side */
export const CALL_PAN: Record<Calls['kind'], number> = { bird: 0.8, cricket: 0.7, cheer: 0.25, hammer: 0.45, lute: 0.35 };
/** the page's weather as the sound reads it (src/atmosphere/Weather.ts's parameters: rain, snow and storm 0..1, wind 0..3 with 1 as authored) */
export interface WeatherNow { rain: number; snow: number; storm: number; wind: number }
/** the weather heard over a place (lot S2): the rain's hiss and patter (S2-PLUIE « Bonne direction »), the thunder after each flash (S2-ORAGE « Bonne direction »,
 *  without gusts: « Sans rafales »); the snow and the wind change nothing (S2-NEIGE « Pas de changement sous la neige », S2-VENT « Pas de son de vent ») */
export interface WeatherSound { rain: number; thunder: boolean }
/** a place's sound: its beds and calls, its level (dB), how far back it stands (the share of its calls' send to the room, so that its air goes back with it),
 *  the weather over it, the ground under the steps */
export interface Ambience { beds: Bed[]; calls: Calls[]; trim: number; back: number; weather: WeatherSound | null; surface: 'stone' | 'earth' }
/** the places 3 dB further back under their music, their air with them: S2-MELANGE « L’ambiance plus en retrait », then « −3 dB, nettement » (journal Passe SN19);
 *  the arena's crowd stays where lot S3 put it */
export const PLACES_BACK = -3;

const CROWD = (g: number): Bed => ({ kind: 'crowd', freq: 520, q: 0.7, gain: g, sway: 0.3 });
const WIND = (g: number): Bed => ({ kind: 'wind', freq: 300, q: 0.4, gain: g, sway: 0.6 });
/** from this much rain the birds and the crickets fall silent */
export const RAIN_SILENCES = 0.25;
/** the crowd's share still out under the rain: people take cover (« le murmure baisse de moitié » at the rainy day's 0.6) */
export const outInRain = (rain: number): number => 1 - Math.min(0.7, rain * 0.9);

export function ambienceOf(place: SoundPlace, look: Look, boutDay = false, w: WeatherNow | null = null): Ambience {
  const night = look === 'night', beds: Bed[] = [], calls: Calls[] = [], rain = w?.rain ?? 0, storm = w?.storm ?? 0, out = outInRain(rain);
  beds.push(WIND(night ? 0.05 : 0.03));
  if (place === 'district') { beds.push({ kind: 'water', freq: 900, q: 0.5, gain: 0.05, sway: 0.4 }, CROWD((night ? 0.03 : 0.06) * out)); calls.push({ kind: 'hammer', every: [5, 11], gain: night ? 0 : 0.12 }); }
  if (place === 'forecourt') beds.push(CROWD((night ? 0.04 : 0.09) * out), { kind: 'water', freq: 1400, q: 0.8, gain: 0.03, sway: 0.2 });
  if (place === 'training') { beds.push(CROWD((night ? 0.04 : 0.08) * out)); if (!night) calls.push({ kind: 'hammer', every: [2.5, 6], gain: 0.07 }); }
  if (place === 'festival') { beds.push(CROWD((night ? 0.1 : 0.08) * out)); calls.push({ kind: 'lute', every: [6, 14], gain: 0.06 }); }
  if (place === 'arena') beds.push({ kind: 'roar', freq: 400, q: 0.5, gain: 0.12, sway: 0.5 });
  if (rain < RAIN_SILENCES) calls.push(night ? { kind: 'cricket', every: [1.5, 4], gain: 0.03 } : { kind: 'bird', every: [3, 9], gain: look === 'morning' ? 0.05 : 0.03 });
  if (boutDay && place !== 'arena' && !night) calls.push({ kind: 'cheer', every: [12, 25], gain: 0.06 });
  const weather = place !== 'arena' && (rain > 0 || storm > 0) ? { rain, thunder: storm > 0 } : null;
  const back = place === 'arena' ? 0 : PLACES_BACK;
  return { beds, calls: calls.filter((c) => c.gain > 0), trim: LEVEL[place][look] + back, back: dbGain(back), weather, surface: place === 'training' ? 'earth' : 'stone' };
}

/** the weather's own level (dB, on the ambience's bus, the same in every place) and its parts': set on the engine's output for the sheet's rain (the town at midday)
 *  and storm (the town at night), then 3 dB back with the places (S2-MELANGE) */
export const WEATHER_TRIM = -4.6;
export const RAIN_LEVEL = 0.06, PATTER_LEVEL = 0.26, THUNDER_LEVEL = 0.65;
/** the steps 5 dB under a place's sound as the sheet had them (a walk on the setts -30.2 LUFS; lot S0's steps were -25.6, nearly as loud as the place):
 *  S2-PAS « Bonne direction » */
export const STEP_LEVEL: Record<'stone' | 'earth', number> = { stone: 0.155, earth: 0.09 };
/** the interface's sounds by the band, at lot S0's loudness (tools/audio/render.mjs: the click -24.6 LUFS at full volume, the dialog -21.8, the purse -17.9
 *  heard 2 dB softer, the refused command as loud as the duel plays it): S2-INTERFACE « Bonne direction » */
export const UI_LEVEL: Partial<Record<Effect, number>> = { click: 0.48, open: 0.43, coin: 0.58, denied: 0.29 };
/** an action of the game refused (src/audio/hooks.ts): its sound this much louder (dB) than the duel's refused command, which the town's music covered
 *  (S5-REFUS « Le refus 6 dB plus fort hors du duel », journal Passes SN21 / SN22); the duel's stays as it is */
export const REFUSAL_LIFT = 6;
/** the thunder after a flash (lot S2): its take by the flash's strength (near, middle, far), its delay (the distance: a second for every 340 m) and its level */
export function thunderOf(level: number, draw: () => number): { take: number; delay: number; gain: number } {
  const take = level >= 0.75 ? 0 : level >= 0.4 ? 1 : 2, [lo, hi] = ([[0.25, 0.9], [1, 2.5], [2.5, 4.5]] as const)[take];
  return { take, delay: lo + (hi - lo) * draw(), gain: Math.min(1.2, 0.4 + 0.7 * level) };
}

// ---------------------------------------------------------------------------------------------------------------- music

/** the band's music (journal Passe SN10; R-SUITE « Cuire et brancher dans la version 2 »): the catalogue baked by tools/audio/band/bake.mjs, at the band's rate;
 *  which piece plays where is src/audio/plan.ts. It replaced the plucked tune of lot V8 (`tune`, a walk on the day state's mode), which only ever played on
 *  the version 2's pages */
export const BAND_RATE = 48000;
/** a jingle's way in after the K.O. (the knock-out's slow moment first), how far the music steps back under a jingle or the fanfare, and how long a fanfare
 *  asked before the person's first gesture may wait for it (seconds, dB); kept by the operator in play (journal Passe SN11): E-KO « Bon moment », E-FANFARE
 *  « Bien placée » */
export const JINGLE_AFTER = 1.2, STING_DUCK = 9, STING_WAIT = 6;
export const hz = (midi: number): number => 440 * Math.pow(2, (midi - 69) / 12);

// ---------------------------------------------------------------------------------------------------------------- the mix

/** The mix, measured (lot S0, journal Passe SN2; tools/audio/analyse.mjs): the fiche's targets at the default settings are -18 LUFS at the output and
 *  the music over the ambience, 3 to 6 dB until lot S2, 6 to 9 dB since (the places 3 dB further back: S2-MELANGE « L’ambiance plus en retrait », then
 *  « −3 dB, nettement », journal Passe SN19). Each bus in dB at the default settings, then each place's ambience (the beds were written at very
 *  different levels). The volume comes after the limiter, so a louder setting never squeezes the mix harder. The band's level kept in play: E-NIVEAU « Bien dosée »
 *  (journal Passe SN11). */
export const MIX = { ambience: 1.6, music: -1.6, fx: 9.6, ui: 9.6, reverb: 1.6 };
export const LEVEL: Record<SoundPlace, Record<Look, number>> = {
  district: { morning: 8, midday: 8.1, afternoon: 8.1, night: 8.1 },
  forecourt: { morning: 8.1, midday: 8.2, afternoon: 8.2, night: 10.6 },
  training: { morning: 10, midday: 10, afternoon: 10, night: 13.7 },
  festival: { morning: 9.5, midday: 9.6, afternoon: 9.6, night: 6.9 },
  arena: { morning: 9.6, midday: 9.6, afternoon: 9.6, night: 9.6 },
};
/** the limiter: a compressor that holds the crest, then a hard ceiling (linear up to its knee, never over `ceiling`) */
export const LIMITER = { threshold: -7, knee: 6, ratio: 12, attack: 0.003, release: 0.14, ceiling: 0.86, curve: 8193 };
/** the ceiling's curve, for a WaveShaper fed at half level (its input is read over [-1, 1], so up to twice the full scale) */
export function ceilingCurve(ceiling = LIMITER.ceiling, n = LIMITER.curve): Float32Array {
  const c = new Float32Array(n), knee = 0.75 * ceiling;
  for (let i = 0; i < n; i++) { const x = (2 * (i / (n - 1)) - 1) * 2, a = Math.abs(x), y = a <= knee ? a : knee + (ceiling - knee) * Math.tanh((a - knee) / (ceiling - knee)); c[i] = Math.sign(x) * y; }
  return c;
}
/** the length of the noise's buffer: the beds read it from different places at different speeds, long enough for a filtered bed not to show its loop */
export const NOISE_SECONDS = 8;
/** white noise from a 31-bit generator. `x * 1103515245` in doubles passed 2^53 and fell into a cycle of 10 466 samples (journal Passe SN1): the
 *  product is taken in integers. Pure, a seed gives its samples */
export function noiseSamples(length: number, seed: number): Float32Array {
  const d = new Float32Array(length); let x = seed & 0x7fffffff;
  for (let i = 0; i < length; i++) { x = (Math.imul(x, 1103515245) + 12345) & 0x7fffffff; d[i] = x / 0x3fffffff - 1; }
  return d;
}
/** each place's air: the length of its reverberation (s) and its colour (Hz): a street, two open squares, the walls of the lists, the arena's bowl */
export const ROOM: Record<SoundPlace, { secs: number; bright: number }> = {
  district: { secs: 1, bright: 3000 }, forecourt: { secs: 1.5, bright: 3400 }, training: { secs: 1.1, bright: 2800 }, festival: { secs: 1.2, bright: 3600 }, arena: { secs: 1.9, bright: 3200 },
};
/** a stereo impulse of a room: a few early reflections, then a noise tail that decays and darkens. Pure */
export function roomImpulse(place: SoundPlace, sr: number): [Float32Array, Float32Array] {
  const { secs, bright } = ROOM[place], n = Math.floor(secs * sr), out: [Float32Array, Float32Array] = [new Float32Array(n), new Float32Array(n)];
  out.forEach((d, ch) => {
    const noise = noiseSamples(n, 0x51ed + ch * 7919); let lp = 0;
    for (let i = 0; i < n; i++) {
      const t = i / sr, k = 1 - Math.exp(-2 * Math.PI * Math.max(500, bright * Math.exp(-2.2 * t)) / sr);
      lp += k * (noise[i] - lp); d[i] = lp * Math.exp(-6.9 * t / (secs * 0.7)) * (t < 0.012 ? t / 0.012 : 1);
    }
    const early = noiseSamples(28, 0x1eaf + ch);
    for (let e = 0; e < 14; e++) { const at = Math.floor((0.008 + 0.082 * (early[2 * e] + 1) / 2) * sr); d[at] += early[2 * e + 1] * (1 - e / 18) * 0.8; }
  });
  return out;
}
/** what each bus sends to the room */
export const SEND = { fx: 0.2, calls: 0.3 };

// ---------------------------------------------------------------------------------------------------------------- the engine's moves (lot S1)

/** the fades in seconds: a page comes up, a page goes down (as long as the screen's own darkening, src/ui/exits.ts), a scene gives way to another */
export const FADE = { in: 1.2, out: 0.35, scene: 0.8 };
export interface Duck { db: number; attack: number; hold: number; release: number }
/** how far the music steps back under a blow (SA-3: « la musique se baisse sous chaque coup »), how fast and for how long; the K.O. nearly takes it away */
export const DUCK: Partial<Record<Effect, Duck>> = {
  hit: { db: 3, attack: 0.012, hold: 0.06, release: 0.24 }, heavy: { db: 5, attack: 0.012, hold: 0.1, release: 0.36 }, guard: { db: 2, attack: 0.012, hold: 0.05, release: 0.2 },
  break: { db: 6, attack: 0.012, hold: 0.14, release: 0.5 }, ko: { db: 14, attack: 0.01, hold: 0.7, release: 1.8 },
};
/** the ambience steps back by this share of the music's dB: the crowd stays in the room */
export const DUCK_AMBIENCE = 0.35;
/** the next step of a grid (a bar) at least `margin` after now: where a layer moves, so the music changes on its beat. Pure */
export function nextBoundary(now: number, start: number, grid: number, margin = 0.03): number {
  return start + Math.max(0, Math.ceil((now + margin - start) / grid - 1e-9)) * grid;
}
/** where the music stood when a page left, kept for the tab: the next page takes it up there (SA-15 « Reprise avec fondu »), and a gesture was given */
export interface NowPlaying { key: string; pos: number; heard: boolean; at: number }
export const NOW_KEY = 'cdt-v2-sound-now';
/** after this long a piece starts over */
export const RESUME_MS = 10 * 60 * 1000;
/** a stored record read back, every value checked (anything broken: none) */
export function readNow(text: string | null): NowPlaying | null {
  try {
    const o = JSON.parse(text ?? 'null');
    if (!o || typeof o.key !== 'string' || !Number.isFinite(o.pos) || o.pos < 0 || !Number.isFinite(o.at)) return null;
    return { key: o.key, pos: o.pos, heard: o.heard === true, at: o.at };
  } catch { return null; }
}
/** where a piece starts on this page: where it stood if it is the same piece and not too long ago, else its beginning */
export function resumeAt(rec: NowPlaying | null, key: string, period: number, now: number): number {
  if (!rec || rec.key !== key || !(period > 0) || now - rec.at > RESUME_MS || now < rec.at) return 0;
  return rec.pos % period;
}
/** the record a page leaves: what plays and where, at this moment; a page whose music has stopped or never started (the duel after its K.O.) passes on
 *  the record it found with its own time, so that the ten minutes count from when that music was last heard (S5-PAGES « Bien ainsi, avec la correction »,
 *  journal Passe SN22: the duel rewrote the forecourt's record with the time it left). Pure */
export function recordOf(playing: { key: string; pos: number } | null, found: NowPlaying | null, heard: boolean, now: number): NowPlaying {
  if (playing) return { key: playing.key, pos: playing.pos, heard, at: now };
  return { key: found?.key ?? '', pos: found?.pos ?? 0, heard, at: found?.at ?? now };
}

// ---------------------------------------------------------------------------------------------------------------- the settings

/** the general volume, the mute, and the shares of the music, the places' ambience and the effects (the operator's RG-6 « Général, Musique, Ambiance,
 *  Effets », journal Passe RG2): a share at its default (0.5) is the measured mix of lots S2 to S5, 1 is 6 dB over it; the effects are the blows, the
 *  arena's crowd and the interface together */
export interface SoundSettings { volume: number; muted: boolean; music: number; ambience: number; effects: number }
export const DEFAULT_SETTINGS: SoundSettings = { volume: 0.7, muted: false, music: 0.5, ambience: 0.5, effects: 0.5 };
/** a stored setting read back, every value checked (a broken entry is the default) */
export function readSettings(text: string | null): SoundSettings {
  try {
    const o = JSON.parse(text ?? 'null');
    if (!o || typeof o !== 'object') return { ...DEFAULT_SETTINGS };
    const n = (v: unknown, d: number) => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : d);
    const d = DEFAULT_SETTINGS;
    return { volume: n(o.volume, d.volume), muted: o.muted === true, music: n(o.music, d.music), ambience: n(o.ambience, d.ambience), effects: n(o.effects, d.effects) };
  } catch { return { ...DEFAULT_SETTINGS }; }
}

/** each way's gain under the settings (Sound.apply): at the defaults, the measured mix (`MIX`) exactly; the arena's crowd rides the ambience's way but
 *  follows the effects' share (RG-6) */
export function busGains(s: SoundSettings): { master: number; music: number; ambience: number; crowd: number; fx: number; ui: number } {
  const share = (v: number, d: number) => v / d, D = DEFAULT_SETTINGS;
  return {
    master: s.muted ? 0 : s.volume,
    music: dbGain(MIX.music) * share(s.music, D.music),
    ambience: dbGain(MIX.ambience) * share(s.ambience, D.ambience),
    crowd: dbGain(MIX.ambience) * share(s.effects, D.effects),
    fx: dbGain(MIX.fx) * share(s.effects, D.effects),
    ui: dbGain(MIX.ui) * share(s.effects, D.effects),
  };
}
