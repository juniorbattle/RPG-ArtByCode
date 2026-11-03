// The band as a stage plot (journal Passe SN7): each player's desk, measured on the versions the operator approved (journal Passes SN5 / SN6), so a new piece starts
// from the same mix. A score takes the players it needs and changes what it must.
import { parseLine } from '../../../tools/audio/band/session.mjs';
import { rhodes, bass, brass, strings, ewi, flute, vibes, nylon, bouzouki, marimba, organ, rockGuitar } from '../../../tools/audio/band/instruments.mjs';
import { chorus, compress, phaser, pingPong, tremolo } from '../../../tools/audio/band/dsp.mjs';

export { rhodes, strings, vibes, nylon, bouzouki, marimba, organ };
export const slapped = (m, v, kind, take) => bass(m, v, kind, take), thumb = (m, v, take) => bass(m, v, 'thumb', take), fretless = (m, v, _, take) => bass(m, v, 'fretless', take), finger = (m, v, _, take) => bass(m, v, 'finger', take);
/** a looped render of a piece: `render.mjs --loop`, the game's file; without it the piece has its ending, for the ear */
export const loopOf = (o, from, to) => (o.looped ? { loop: { from, to } } : {});
/** a brass chord of a given length, the inst a chord asks for */
export const hit = (dur, o = {}) => (m, v, take) => brass(m, dur, v, { take, ...o });

export function rig(s) {
  const kitFx = (L, R) => compress(L, R, { th: -14, ratio: 3, attack: 0.004, release: 0.09, makeup: 2 }), lowEq = [['hp', 34], ['low', 130, 0.7, 4], ['peak', 300, 1, -3], ['high', 1500, 0.7, -4]], lowFx = (L, R) => compress(L, R, { th: -12, ratio: 5, attack: 0.002, release: 0.06, makeup: 3 });
  return {
    kit: (o = {}) => s.track('kit', { lay: 0.001, jitter: 0.0035, room: 0.1, gain: 0.8, fx: kitFx, eq: [['hp', 30], ['peak', 3800, 0.9, 1.5]], ...o }),
    slap: (o = {}) => s.track('bass', { lay: 0.003, jitter: 0.003, gain: 0.5, room: 0.02, eq: lowEq, fx: lowFx, ...o }),
    fret: (o = {}) => s.track('fretless', { gain: 0.42, room: 0.04, plate: 0.04, lay: 0.006, eq: [['hp', 40], ['peak', 230, 1, -2], ['peak', 900, 1, 1.5]], fx: (L, R) => compress(L, R, { th: -14, ratio: 3, attack: 0.008, release: 0.14, makeup: 1 }), ...o }),
    keys: (o = {}) => s.track('rhodes', { pan: -0.12, gain: 0.32, plate: 0.13, room: 0.08, jitter: 0.004, eq: [['hp', 150], ['peak', 2200, 1, 1.5]], fx: (L, R) => { phaser(L, R, { rate: 0.31, mix: 0.4 }); chorus(L, R, { rate: 0.7, mix: 0.42 }); }, ...o }),
    keysSoft: (o = {}) => s.track('rhodes', { pan: -0.05, gain: 0.3, plate: 0.2, hall: 0.08, jitter: 0.006, vary: 0.1, lay: 0.004, eq: [['hp', 120], ['high', 5000, 0.7, -2]], fx: (L, R) => { tremolo(L, R, 3.4, 0.3); chorus(L, R, { rate: 0.4, depth: 0.0016, mix: 0.2 }); }, ...o }),
    lead: (o = {}, wind = {}) => { const t = s.track('lead', { pan: 0.02, gain: 0.27, plate: 0.2, hall: 0.05, lay: 0.004, eq: [['hp', 220], ['peak', 1100, 0.8, -2.5], ['peak', 3000, 1, 2.5]], fx: (L, R) => { chorus(L, R, { rate: 0.5, depth: 0.0012, mix: 0.16 }); pingPong(L, R, { time: s.span(3), feedback: 0.3, mix: 0.16 }); }, ...o }); t.voice = (notes, total) => ewi(notes, total, { seed: 7, porta: 0.03, vibDepth: 0.2, ...wind }); return t; },
    softLead: (o = {}, wind = {}) => { const t = s.track('lead', { gain: 0.26, hall: 0.24, plate: 0.14, lay: 0.012, eq: [['hp', 200], ['high', 3800, 0.7, -3]], fx: (L, R) => pingPong(L, R, { time: s.span(6), feedback: 0.3, mix: 0.18, tone: 1900 }), ...o }); t.voice = (notes, total) => ewi(notes, total, { seed: 13, dark: 1, porta: 0.06, scoop: 0.9, scoopT: 0.09, attack: 0.03, release: 0.16, vibRate: 4.6, vibDepth: 0.2, vibDelay: 0.32, ...wind }); return t; },
    flute: (o = {}) => { const t = s.track('flute', { pan: 0.04, gain: 0.31, hall: 0.2, plate: 0.09, lay: 0.006, eq: [['hp', 260], ['peak', 3400, 1, 2]], ...o }); t.voice = (notes, total) => flute(notes, total, { seed: 11, breath: 0.11 }); return t; },
    horns: (o = {}, name = 'brass') => s.track(name, { gain: 0.25, plate: 0.24, room: 0.1, jitter: 0.005, pan: 0.05, eq: [['hp', 170], ['peak', 3000, 1, 1]], fx: (L, R) => chorus(L, R, { rate: 0.9, depth: 0.0016, mix: 0.22 }), ...o }),
    pad: (o = {}) => s.track('strings', { gain: 0.2, hall: 0.26, eq: [['hp', 240]], fx: (L, R) => chorus(L, R, { rate: 0.4, depth: 0.002, mix: 0.25 }), ...o }),
    nylon: (o = {}) => s.track('nylon', { pan: -0.2, gain: 0.56, plate: 0.09, room: 0.12, jitter: 0.005, lay: 0.002, vary: 0.12, eq: [['hp', 80]], fx: (L, R) => compress(L, R, { th: -16, ratio: 2, attack: 0.012, release: 0.12, makeup: 1 }), ...o }),
    bouz: (o = {}) => s.track('bouzouki', { pan: 0.42, gain: 0.3, room: 0.14, plate: 0.08, jitter: 0.004, eq: [['hp', 170]], ...o }),
    hands: (o = {}) => s.track('hands', { gain: 0.6, room: 0.2, plate: 0.05, jitter: 0.006, lay: -0.001, vary: 0.14, eq: [['hp', 60]], ...o }),
    bars: (o = {}) => s.track('marimba', { pan: 0.34, gain: 0.34, room: 0.2, plate: 0.1, jitter: 0.004, eq: [['hp', 200]], ...o }),
    vib: (o = {}) => s.track('vibes', { pan: 0.3, gain: 0.4, hall: 0.24, plate: 0.1, jitter: 0.005, eq: [['hp', 240]], fx: (L, R) => tremolo(L, R, 4.6, 0.22), ...o }),
    org: (o = {}) => s.track('organ', { pan: -0.14, gain: 0.27, room: 0.14, plate: 0.08, jitter: 0.003, eq: [['hp', 130]], fx: (L, R) => { tremolo(L, R, 6.1, 0.28); chorus(L, R, { rate: 6.1, depth: 0.0007, mix: 0.4 }); }, ...o }),
    guitars: (o = {}) => [s.track('guitar L', { pan: -0.78, gain: 0.14, room: 0.06, jitter: 0.004, eq: [['hp', 95], ['peak', 400, 1, -2]], ...o }), s.track('guitar R', { pan: 0.78, gain: 0.14, room: 0.06, jitter: 0.004, lay: 0.004, eq: [['hp', 95], ['peak', 400, 1, -2]], ...o })],
    timp: (o = {}) => s.track('timpani', { gain: 0.34, hall: 0.14, room: 0.1, jitter: 0.004, eq: [['hp', 45]], ...o }),
  };
}

/** a written line on the section, each note its own length: a horn's melody */
export function hornLine(s, tr, bar, step, text, { vel = 0.8, soft = true, art = 0.97, transpose = 0 } = {}) {
  for (const n of parseLine(text).notes) { const at = bar * s.steps + step + n.at, b = Math.floor(at / s.steps), st = at - b * s.steps, dur = s.span(n.len) * art, [t, v] = tr.human(s.t(b, st), vel + (n.accent ? 0.14 : 0)); tr.sound(() => brass(n.midi + transpose, dur, v, { soft, take: tr.take() }), t, { g: v }, n.midi + transpose, dur); }
}
/** power chords on a written line, each guitar its own take */
export function power(s, [gl, gr], bar, text, { vel = 0.9, muted = false, fifth = true, transpose = 0 } = {}) {
  for (const n of parseLine(text).notes) { const m = n.midi + transpose, at = bar * s.steps + n.at, b = Math.floor(at / s.steps), st = at - b * s.steps, dur = s.span(n.len) * 0.94; for (const [tr, take] of [[gl, 0], [gr, 1]]) { const [t, v] = tr.human(s.t(b, st), vel); tr.sound(() => rockGuitar(fifth ? [m, m + 7, m + 12] : [m, m + 12], dur, v, muted, take), t, { g: v }, m); } }
}
