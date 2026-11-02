// The band's session (journal Passe SN5): a score is written against this: bars and steps on a groove's own time, chord symbols voiced the way a keyboard
// player leads his voices, written lines, drum and bass patterns, then the mix. Pure: a score and its seed give the same bytes.
import { SR, Rand, seedOf, clamp, db, eq, room, convolve, compress, limit } from './dsp.mjs';
import { drum } from './drums.mjs';
import { loudness, truePeak } from '../measure.mjs';

// ------------------------------------------------------------------------------------------------- theory

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
export function pitchClass(name) { return (PC[name[0]] + (name[1] === '#' ? 1 : name[1] === 'b' ? -1 : 0) + 12) % 12; }
/** 'F#4' to 66 */
export function midiOf(name) { const m = /^([A-G][#b]?)(-?\d)$/.exec(name); if (!m) throw new Error(`note ${name}`); return pitchClass(m[1]) + 12 * (Number(m[2]) + 1); }

/** the chords the scores name, intervals from the root; the guide tones first, what a voicing keeps */
const QUAL = {
  '': [4, 7, 0], m: [3, 7, 0], 5: [7, 0], 6: [4, 9, 7], '6/9': [4, 9, 14, 7], add9: [4, 14, 7, 0], madd9: [3, 14, 7, 0], maj7: [4, 11, 7, 14], maj9: [4, 11, 14, 7], 'maj7#11': [4, 11, 18, 7], 'maj9#11': [4, 11, 14, 18, 7], 'maj13': [4, 11, 21, 14],
  m7: [3, 10, 7, 14], m9: [3, 10, 14, 7], m11: [3, 10, 17, 7, 14], m6: [3, 9, 7, 14], mmaj9: [3, 11, 14, 7], m7b5: [3, 10, 6, 17], 7: [4, 10, 7, 14], 9: [4, 10, 14, 7], 13: [4, 10, 21, 14], '7#9': [4, 10, 15, 7], '7b9': [4, 10, 13, 7], '7#11': [4, 10, 18, 14], '13#11': [4, 10, 21, 18], '7alt': [4, 10, 15, 20, 13],
  sus: [5, 7, 0], sus2: [2, 7, 0], '7sus': [5, 10, 7, 14], '9sus': [5, 10, 14, 7], '13sus': [5, 10, 21, 14], '7susb9': [5, 10, 13, 7], dim7: [3, 6, 9, 0],
};
/** 'Bbmaj9#11/D' to its root, its bass and its intervals */
export function parseChord(sym) {
  const m = /^([A-G][#b]?)(.*?)(?:\/([A-G][#b]?))?$/.exec(sym); if (!m) throw new Error(`chord ${sym}`);
  const iv = QUAL[m[2]]; if (!iv) throw new Error(`chord quality "${m[2]}" in ${sym}`);
  const root = pitchClass(m[1]); return { sym, root, bass: m[3] ? pitchClass(m[3]) : root, iv };
}
/** the chord's notes as pitch classes */
export const tonesOf = (c) => [...new Set([c.root, ...c.iv.map((i) => (c.root + i) % 12)])];

/** the voicing nearest the last one: `n` tones between lo and hi, no muddy seconds low down, the top voice under `top`; the tones of `avoid` are left out, as long as
 *  three remain: a colour a semitone under the tune rubs against it, an arranger drops it */
export function voice(chord, prev, { lo = 52, hi = 76, n = 4, top = 127, avoid = new Set() } = {}) {
  const every = [...new Set(chord.iv.map((i) => (chord.root + i) % 12))], kept = every.filter((pc) => !avoid.has(pc)), pcs = (kept.length >= 3 ? kept : every).slice(0, n), options = pcs.map((pc) => { const o = []; for (let m = lo; m <= hi; m++) if (m % 12 === pc && m < top) o.push(m); return o; });
  let best = null, bestCost = Infinity; const idx = pcs.map(() => 0), centre = (lo + hi) / 2;
  for (;;) {
    const v = idx.map((k, i) => options[i][k]).filter((m) => m !== undefined).sort((a, b) => a - b);
    if (v.length === pcs.length) {
      let c = 0; for (let i = 1; i < v.length; i++) { const d = v[i] - v[i - 1]; if (d < 3 && v[i - 1] < 57) c += 8; if (d === 1) c += 3; if (d > 9) c += 2; }
      if (v[v.length - 1] - v[0] > 19) c += 5;
      if (prev?.length) { const s = [...prev].sort((a, b) => a - b); for (let i = 0; i < v.length; i++) c += Math.abs(v[i] - s[Math.min(i, s.length - 1)]) * 0.6; } else c += Math.abs(v.reduce((a, b) => a + b, 0) / v.length - centre) * 0.5;
      if (c < bestCost) { bestCost = c; best = v; }
    }
    let k = 0; while (k < idx.length && ++idx[k] >= Math.max(1, options[k].length)) idx[k++] = 0;
    if (k === idx.length) break;
  }
  if (!best) throw new Error(`no voicing for ${chord.sym}`);
  return best;
}

// ------------------------------------------------------------------------------------------------- a written line

/** 'D5:3 A5:3! . :2 E5:6~' to notes: a note and its length in steps, a rest as '.:n', marks after the length: ! accent, ~ more vibrato, ^ bend up into it, v fall off it, < swell, _ held to the end */
export function parseLine(text) {
  const out = []; let at = 0;
  for (const tok of text.replace(/\|/g, ' ').split(/\s+/).filter(Boolean)) {
    const m = /^(\.|[A-G][#b]?-?\d):(\d+(?:\.\d+)?)([!~^v<_]*)$/.exec(tok); if (!m) throw new Error(`token ${tok}`);
    const len = Number(m[2]), marks = m[3]; if (m[1] !== '.') out.push({ midi: midiOf(m[1]), at, len, accent: marks.includes('!'), mods: { vib: marks.includes('~') ? 1.6 : 1, bend: marks.includes('^') ? 1.6 : 0, fall: marks.includes('v') ? 3 : 0, swell: marks.includes('<') } }); at += len;
  }
  return { notes: out, steps: at };
}

// ------------------------------------------------------------------------------------------------- the session

const VEL = { X: 1, x: 0.78, o: 0.5, g: 0.24 };
/** each piece's place in the kit, measured (journal Passe SN5): hats under the snare, a shaker has to be heard */
const TRIM = { hat: 0.56, open: 0.5, ride: 0.72, bell: 0.6, crash: 0.62, shaker: 2, tamb: 1.5, brush: 1.2, sweep: 1.5 };
const PAN = { hat: 0.24, open: 0.24, ride: -0.22, bell: -0.22, crash: -0.3, tomH: -0.18, tomM: 0.05, tomL: 0.26, shaker: 0.32, tamb: -0.34, conga: 0.28, bongo: -0.28 };

export class Track {
  constructor(s, name, o) { Object.assign(this, { s, name, pan: 0, gain: 1, room: 0, plate: 0, hall: 0, eq: [], fx: null, stem: 'main', lay: 0, jitter: 0.003, vary: 0.06, voice: null, notes: [], takes: 3, n: 0 }, o); const size = s.dry ? 0 : s.total; this.L = new Float32Array(size); this.R = new Float32Array(size); this.r = new Rand(seedOf(`${s.seed}:${name}`)); }
  /** a computed note into the track: `dur` cuts it with a damper, `pan` beside the track's own */
  put(buf, t, { g = 1, pan = this.pan, dur, rel = 0.05 } = {}) {
    const a = Math.round(t * SR), hold = dur === undefined ? Infinity : Math.round(dur * SR), n = dur === undefined ? buf.length : Math.min(buf.length, hold + Math.round(rel * 4 * SR)), th = (clamp(pan, -1, 1) + 1) * Math.PI / 4, gl = g * Math.cos(th), gr = g * Math.sin(th), k = Math.exp(-1 / (rel * SR)), { L, R } = this;
    let e = 1; for (let i = 0; i < n; i++) { const p = a + i; if (p >= L.length) break; if (i > hold) e *= k; if (p >= 0) { const v = buf[i] * e; L[p] += v * gl; R[p] += v * gr; } }
  }
  /** a note's sound, unless the session only reads the score; every note is written in `events` for the score's checks */
  sound(make, t, o = {}, midi = null, dur = 0) { if (midi !== null) this.s.events.push({ track: this.name, t, dur: o.dur ?? dur, midi }); if (!this.s.dry) this.put(make(), t, o); }
  /** a played time and level: the player's habit (`lay`), the hand's small errors */
  human(t, v) { return [t + this.lay + this.r.bi() * this.jitter, clamp(v * (1 + this.r.bi() * this.vary), 0, 1)]; }
  take() { return this.n++ % this.takes; }
}

export class Session {
  /** bpm in quarter notes; `steps` to the bar, `beat` steps to a quarter; swing the share of a pair's first step, 0.5 = straight */
  constructor({ id, seed = 1, bpm, steps = 16, beat = 4, swing = 0.5, bars, tail = 4, rooms = {}, dry = false, tune = [] }) {
    Object.assign(this, { id, seed, bpm, steps, beat, swing, bars, dry, tune, events: [], meters: {} }); this.stepSecs = 60 / bpm / beat; this.total = Math.ceil((bars * steps * this.stepSecs + tail) * SR); this.tracks = new Map(); this.rooms = rooms; this.voicings = new Map(); this.r = new Rand(seedOf(`${seed}:${id}`));
  }
  /** a bar and a step, in seconds; a pair's second step leans late by the swing */
  t(bar, step = 0) { const whole = Math.floor(step), late = whole % 2 ? (this.swing - 0.5) * 2 : 0; return (bar * this.steps + whole + (step - whole) + late) * this.stepSecs; }
  span(steps) { return steps * this.stepSecs; }
  /** what the tune holds over this span (read from the score's dry pass): the pitch classes a semitone under its held notes */
  avoidAt(t, dur) { const o = new Set(); for (const n of this.tune) if (n.dur >= 0.26 && Math.min(n.t + n.dur, t + dur) - Math.max(n.t, t) > 0.1) o.add((n.midi + 11) % 12); return o; }
  track(name, o = {}) { let t = this.tracks.get(name); if (!t) { t = new Track(this, name, o); this.tracks.set(name, t); } return t; }

  /** a line for a phrase-played voice: its notes are gathered and the wind voice renders them whole at the mix */
  phrase(tr, bar, step, text, { vel = 0.78, art = 0.98, transpose = 0 } = {}) {
    const { notes } = parseLine(text), total = this.steps;
    notes.forEach((n, i) => { const at = bar * total + step + n.at, b = Math.floor(at / total), st = at - b * total, strong = st % this.beat === 0 ? 0.06 : 0, next = notes[i + 1], joined = next && next.at === n.at + n.len, repeat = joined && next.midi === n.midi, t = this.t(b, st), dur = this.span(n.len) * (repeat ? 0.8 : joined ? 1 : art); tr.notes.push({ t: t + tr.lay + tr.r.bi() * tr.jitter * 0.5, dur, midi: n.midi + transpose, vel: clamp(vel + strong + (n.accent ? 0.16 : 0) + tr.r.bi() * 0.03, 0, 1), mods: n.mods }); this.events.push({ track: tr.name, t, dur, midi: n.midi + transpose }); });
    return tr;
  }
  /** a line on a note-by-note instrument */
  line(tr, inst, bar, step, text, { vel = 0.7, art = 0.92, transpose = 0, rel = 0.06 } = {}) {
    const total = this.steps;
    for (const n of parseLine(text).notes) { const at = bar * total + step + n.at, b = Math.floor(at / total), st = at - b * total, [t, v] = tr.human(this.t(b, st), clamp(vel + (n.accent ? 0.18 : 0) + (st % this.beat === 0 ? 0.05 : 0), 0, 1)); tr.sound(() => inst(n.midi + transpose, v, tr.take()), t, { g: v, dur: this.span(n.len) * art, rel }, n.midi + transpose); }
    return tr;
  }
  /** one chord symbol struck on an instrument, its voices led from the last chord on this track */
  chord(tr, inst, bar, step, sym, len, { vel = 0.6, n = 4, lo = 52, hi = 76, top, strum = 0.006, rel = 0.1, bassNote = false } = {}) {
    const c = parseChord(sym), v = voice(c, this.voicings.get(tr.name), { lo, hi, n, top, avoid: this.avoidAt(this.t(bar, step), this.span(len)) }); this.voicings.set(tr.name, v);
    const [t, vv] = tr.human(this.t(bar, step), vel), notes = bassNote ? [c.root + 36 + (c.root < 4 ? 12 : 0), ...v] : v;
    notes.forEach((m, i) => { const g = vv * (i === notes.length - 1 ? 1.05 : 0.92); tr.sound(() => inst(m, g, tr.take()), t + i * strum, { g, dur: this.span(len), rel }, m); });
    return v;
  }
  /** a bass pattern over a chord: 1 root, 3, 5, 7, 9, p the octave popped, b the seventh popped, x a muted ghost, - hold, . rest; `slap` plays the roots with the thumb */
  bass(tr, inst, bar, sym, pattern, { slap = false, vel = 0.8, lift = 0, art = 0.9, from = 0 } = {}) {
    const c = parseChord(sym), low = 28 + ((c.bass - 4 + 12) % 12) + lift, third = c.iv.find((i) => i === 3 || i === 4) ?? c.iv[0], seventh = c.iv.find((i) => i === 10 || i === 11), fifth = c.iv.includes(7) ? 7 : c.iv.includes(6) ? 6 : c.iv.includes(8) ? 8 : 7;
    // over a slash chord the degrees are the chord's, not the bass note's; a chord without a seventh gets its fifth instead
    const toRoot = (c.root - c.bass + 12) % 12, degree = (i) => (toRoot + i) % 12, low7 = seventh === undefined ? fifth - 12 : seventh - 12, high7 = seventh ?? 12;
    const off = { 1: 0, 3: toRoot ? degree(third) : third, 5: toRoot ? degree(fifth) : fifth, 7: toRoot ? degree(seventh ?? fifth) : low7, 9: 14, p: 12, b: toRoot ? degree(seventh ?? 12) : high7, x: 0 }, line = [...pattern];
    line.forEach((ch, i) => {
      if (!(ch in off)) return; let len = 1; while (line[i + len] === '-') len++;
      const next = line.findIndex((x, j) => j > i + len - 1 && x !== '.'), ring = next < 0 ? line.length - i : next - i, note = low + off[ch] < 28 ? low + off[ch] + 12 : low + off[ch], kind = ch === 'x' ? 'ghost' : ch === 'p' || ch === 'b' ? (slap ? 'pop' : 'finger') : slap ? 'thumb' : 'finger', [t, v] = tr.human(this.t(bar, from + i), vel * (ch === 'x' ? 0.5 : ch === 'p' || ch === 'b' ? 1.05 : 1));
      tr.sound(() => inst(note, v, kind, tr.take()), t, { g: v, dur: this.span(ch === 'x' ? 0.9 : Math.max(len, Math.min(ring, 1.6)) * art), rel: 0.025 }, ch === 'x' ? null : note);
    });
  }
  /** the drums for `count` bars: each row a piece of the kit, one character a step: X x o g velocities; the open hat is choked by the next closed one */
  drums(tr, bar, count, rows, { vel = 1 } = {}) {
    for (let b = bar; b < bar + count; b++) for (const [kind, row] of Object.entries(rows)) for (let i = 0; i < row.length; i++) {
      const v = VEL[row[i]]; if (!v) continue;
      const [t, vv] = tr.human(this.t(b, i), v * vel), lay = kind === 'snare' ? 0.005 : kind === 'kick' ? 0.001 : 0;
      let dur; if (kind === 'open') { const close = rows.hat ? [...rows.hat].findIndex((c, j) => j > i && VEL[c]) : -1; if (close > 0) dur = this.span(close - i); }
      tr.sound(() => drum(kind, vv, tr.take()), t + lay, { g: vv ** 1.3 * (TRIM[kind] ?? 1), pan: PAN[kind] ?? 0, dur, rel: 0.012 });
    }
  }
  /** a pad: a chord held on two-sided ensembles, with its own attack and release */
  pad(tr, inst, bar, step, sym, len, { vel = 0.5, n = 5, lo = 55, hi = 84, attack = 0.5, release = 0.9, top } = {}) {
    const c = parseChord(sym), v = voice(c, this.voicings.get(tr.name), { lo, hi, n, top, avoid: this.avoidAt(this.t(bar, step), this.span(len)) }); this.voicings.set(tr.name, v); this.padNotes(tr, inst, this.t(bar, step), this.span(len), v, { vel, attack, release });
  }
  padNotes(tr, inst, t, dur, notes, { vel = 0.5, attack = 0.5, release = 0.9 } = {}) {
    for (const m of notes) this.events.push({ track: tr.name, t, dur, midi: m });
    if (this.dry) return;
    const a = Math.round(t * SR), n = Math.round((dur + release * 3) * SR), hold = Math.round(dur * SR), k = Math.exp(-1 / (release * SR));
    for (const m of notes) { const [bl, br] = inst(m); let e = 1; for (let i = 0; i < Math.min(n, bl.length); i++) { const p = a + i; if (p >= tr.L.length || p < 0) continue; if (i > hold) e *= k; const g = vel * e * (1 - Math.exp(-(i / SR) / (attack / 3))); tr.L[p] += bl[i] * g; tr.R[p] += br[i] * g; } }
  }

  /** every track through its own chain into its stem, each stem with its own spaces; the wind voices are rendered here, whole */
  mix() {
    const stems = new Map(), rooms = { room: { rt: 0.7, pre: 0.008, damp: 4200, seed: 3 }, plate: { rt: 1.7, pre: 0.022, damp: 5200, bright: 0.7, seed: 5 }, hall: { rt: 2.8, pre: 0.03, damp: 3200, bright: 0.45, seed: 7, size: 0.08 }, ...this.rooms };
    const sends = new Map();
    for (const tr of this.tracks.values()) {
      if (tr.voice) { const x = tr.voice(tr.notes, this.total), th = (tr.pan + 1) * Math.PI / 4, gl = Math.cos(th), gr = Math.sin(th); for (let i = 0; i < this.total; i++) { tr.L[i] += x[i] * gl; tr.R[i] += x[i] * gr; } }
      eq(tr.L, tr.eq); eq(tr.R, tr.eq); tr.fx?.(tr.L, tr.R);
      if (this.meter) this.meters[tr.name] = this.meter(tr);
      const st = stems.get(tr.stem) ?? [new Float32Array(this.total), new Float32Array(this.total)]; stems.set(tr.stem, st);
      const g = tr.gain; for (let i = 0; i < this.total; i++) { st[0][i] += tr.L[i] * g; st[1][i] += tr.R[i] * g; }
      for (const name of Object.keys(rooms)) if (tr[name] > 0) { const key = `${tr.stem}:${name}`, b = sends.get(key) ?? [new Float32Array(this.total), new Float32Array(this.total)]; sends.set(key, b); const a = tr[name] * g; for (let i = 0; i < this.total; i++) { b[0][i] += tr.L[i] * a; b[1][i] += tr.R[i] * a; } }
      tr.L = tr.R = null;
    }
    for (const [key, b] of sends) {
      const [stem, name] = key.split(':'), [irL, irR] = room(rooms[name]), st = stems.get(stem), wl = convolve(b[0], irL), wr = convolve(b[1], irR);
      for (let i = 0; i < this.total; i++) { st[0][i] += wl[i]; st[1][i] += wr[i]; }
    }
    return stems;
  }
}

/** the master: a slow bus compressor, a hard ceiling, the level set on BS.1770 with the same gain for every stem */
export function master(stems, { lufs = -18, ceiling = -1.3, th = -17, ratio = 2, attack = 0.03, release = 0.25 } = {}) {
  const names = [...stems.keys()], n = stems.get(names[0])[0].length, L = new Float32Array(n), R = new Float32Array(n);
  for (const [a, b] of stems.values()) for (let i = 0; i < n; i++) { L[i] += a[i]; R[i] += b[i]; }
  let peak = 0; for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const pre = 0.5 / Math.max(peak, 1e-6), a2 = [L, R].map((x) => x.map((v) => v * pre)); compress(a2[0], a2[1], { th, ratio, attack, release, knee: 8 });
  const m = loudness(a2, SR).lufs, g = db(lufs - m); for (const x of a2) for (let i = 0; i < n; i++) x[i] *= g;
  limit(a2[0], a2[1], db(ceiling));
  const out = loudness(a2, SR), g2 = db(lufs - out.lufs); for (const x of a2) for (let i = 0; i < n; i++) x[i] *= g2;
  return { L: a2[0], R: a2[1], lufs: lufs, tp: truePeak(a2), lra: out.lra, stemsGain: pre * g * g2 };
}
