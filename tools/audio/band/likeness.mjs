// How much the pieces of a catalogue resemble each other (journal Passe SN8: the operator heard « cette sensation de copier-coller, surtout niveau structure »).
// Read from the scores' dry passes, no sound: the tunes' two-bar blocks shared by two pieces, the chord progressions two pieces share, the keys, the sections'
// lengths, the motif's statements and where they fall. They find what an ear would recognise from one piece to the next; they do not say a piece is good.
import { parseChord } from './session.mjs';

const pc = (m) => ((m % 12) + 12) % 12;

/** what a score did, gathered while it writes: its chords bar by bar, its crashes (where a section starts), its tune */
export function record(Session, make, tracks) {
  const chords = [], crashes = [], proto = Session.prototype, keep = { chord: proto.chord, pad: proto.pad, bass: proto.bass, drums: proto.drums };
  proto.chord = function (tr, inst, bar, step, sym, ...rest) { chords.push({ at: bar + step / this.steps, sym }); return keep.chord.call(this, tr, inst, bar, step, sym, ...rest); };
  proto.pad = function (tr, inst, bar, step, sym, ...rest) { chords.push({ at: bar + step / this.steps, sym }); return keep.pad.call(this, tr, inst, bar, step, sym, ...rest); };
  proto.bass = function (tr, inst, bar, sym, pattern, o = {}) { chords.push({ at: bar + (o.from ?? 0) / this.steps, sym }); return keep.bass.call(this, tr, inst, bar, sym, pattern, o); };
  proto.drums = function (tr, bar, count, rows, ...rest) { if (rows.crash && /X/.test(rows.crash[0])) crashes.push(bar); return keep.drums.call(this, tr, bar, count, rows, ...rest); };
  try {
    const plan = make({ dry: true }), tune = plan.events.filter((e) => tracks.includes(e.track)); chords.length = 0; crashes.length = 0;
    const s = make({ dry: true, tune }), secsPerBar = s.steps * s.stepSecs, notes = s.events.filter((e) => tracks.includes(e.track)).sort((a, b) => a.t - b.t || b.midi - a.midi);
    // one line: where two tune tracks sound together, the higher note
    const lineOf = (ns) => { const line = []; for (const n of ns) { const last = line[line.length - 1]; if (last && Math.abs(last.t - n.t) < 0.03) { last.midi = Math.max(last.midi, n.midi); continue; } line.push({ t: n.t, midi: n.midi, bar: n.t / secsPerBar, len: n.dur / secsPerBar }); } return line; };
    // the merged line, and each tune track's own: a voice's phrase hidden between another's notes in the merged line is still read (second independent reading)
    const line = lineOf(notes), lines = [line, ...tracks.map((tr) => lineOf(notes.filter((n) => n.track === tr)))].filter((l) => l.length);
    return { id: s.id, bars: s.bars, loop: s.loop, steps: s.steps, line, lines, chords: chords.slice().sort((a, b) => a.at - b.at), crashes: [...new Set(crashes)].sort((a, b) => a - b), events: s.events };
  } finally { Object.assign(proto, keep); }
}

/** the piece's centre: the pitch class its low notes (under E3) sound longest */
export function tonic(rec) {
  const w = new Array(12).fill(0); for (const e of rec.events) if (e.midi < 52) w[pc(e.midi)] += e.dur || 0.1;
  return w.indexOf(Math.max(...w));
}
/** the key every note together points to (Krumhansl and Kessler's profiles against the notes' lengths): a modal piece may read as its relative, a guide, not a proof */
const MAJOR = [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88], MINOR = [6.33, 2.68, 3.52, 5.38, 2.6, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17];
export function keyOf(rec) {
  const w = new Array(12).fill(0); for (const e of rec.events) w[pc(e.midi)] += e.dur || 0.1;
  const corr = (p, t) => { const mx = w.reduce((a, b) => a + b) / 12, mp = p.reduce((a, b) => a + b) / 12; let n = 0, dx = 0, dp = 0; for (let i = 0; i < 12; i++) { const x = w[(i + t) % 12] - mx, y = p[i] - mp; n += x * y; dx += x * x; dp += y * y; } return n / Math.sqrt(dx * dp); };
  let best = { r: -2 }; for (let t = 0; t < 12; t++) for (const [mode, p] of [['major', MAJOR], ['minor', MINOR]]) { const r = corr(p, t); if (r > best.r) best = { tonic: t, mode, r }; }
  return best;
}
/** the runs of `n` notes a written line of intervals holds: the theme's own, which two pieces may share by design */
export function runsOf(intervals, n = 6) { const out = new Set(); for (let i = 0; i + n - 1 <= intervals.length; i++) out.add(intervals.slice(i, i + n - 1).join(' ')); return out; }

/** the tune read as runs of `n` notes, by their intervals alone: the same turn of melody in another key, another meter or another rhythm is the same run;
 *  a run of repeated notes says nothing and is left out. Each run keeps the bar where it first falls */
export function grams(rec, n = 6) {
  const out = new Map();
  for (const L of rec.lines ?? [rec.line]) for (let i = 0; i + n <= L.length; i++) { const iv = []; for (let k = 1; k < n; k++) iv.push(L[i + k].midi - L[i + k - 1].midi); if (iv.filter((d) => d !== 0).length < 3) continue; const key = iv.join(' '); if (!out.has(key)) out.set(key, +L[i].bar.toFixed(2)); }
  return out;
}
/** the tune cut in blocks of `bars`, each read as its intervals and its rhythm: the same block in another key is the same block; a copy, not a likeness */
export function blocks(rec, bars = 2) {
  const out = new Map();
  // a note the player pushes a hair before the bar line belongs to the bar: half a step of slack
  const slack = 0.5 / rec.steps;
  for (let b = 0; b + bars <= rec.bars; b++) {
    const ns = rec.line.filter((n) => n.bar >= b - slack && n.bar < b + bars - slack); if (ns.length < 4) continue;
    const key = ns.map((n, i) => `${i ? n.midi - ns[i - 1].midi : 0}@${Math.round((n.bar - b) * rec.steps)}`).join(' ');
    if (!out.has(key)) out.set(key, b);
  }
  return out;
}
/** the chords a bar at a time, as degrees of the piece's tonic and their quality: four bars in a row make a progression */
export function progressions(rec, n = 4) {
  const t = tonic(rec), perBar = [];
  for (let b = 0; b < rec.bars; b++) { const c = rec.chords.find((x) => x.at >= b - 1e-6 && x.at < b + 1e-6) ?? rec.chords.filter((x) => x.at < b).pop(); if (c) { const ch = parseChord(c.sym); perBar.push(`${pc(ch.root - t)}${c.sym.replace(/^[A-G][#b]?/, '').replace(/\/.*$/, '')}`); } else perBar.push('-'); }
  const out = new Map(); for (let b = 0; b + n <= perBar.length; b++) { const k = perBar.slice(b, b + n).join(' '); if (!k.includes('-') && new Set(perBar.slice(b, b + n)).size > 1 && !out.has(k)) out.set(k, b); }
  return out;
}
/** the sections' lengths: from one crash on a downbeat to the next */
export const sections = (rec) => rec.crashes.slice(1).map((b, i) => b - rec.crashes[i]);

/** the motif in a line, in any key: its intervals in order, with up to `slack` notes of the line between two of its notes; where it falls, in bars */
export function motifAt(line, motif, slack = 0) {
  const PCS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }, want = motif.map((n) => PCS[n]), iv = want.slice(1).map((p, i) => pc(p - want[i])), hits = [];
  for (let s = 0; s < line.length; s++) {
    let k = 0, i = s, gap = 0;
    while (i + 1 < line.length && k < iv.length) { const d = pc(line[i + 1].midi - line[s + 0].midi), need = pc(want[k + 1] - want[0]); if (d === need) { k++; gap = 0; } else if (++gap > slack) break; i++; }
    if (k === iv.length) hits.push(+line[s].bar.toFixed(2));
  }
  return hits;
}

/** the catalogue's likeness: for each pair, the tune blocks and the progressions they share; for each piece, its key, its sections, its share of borrowed blocks */
export function likeness(recs, { bars = 2, n = 6, ignore = [] } = {}) {
  const G = recs.map((r) => grams(r, n)), B = recs.map((r) => blocks(r, bars)), P = recs.map((r) => progressions(r)), ignored = (k) => ignore.some((f) => f(k));
  const pairs = [], per = recs.map((r) => ({ id: r.id, tonic: tonic(r), key: keyOf(r), sections: sections(r), grams: 0, sharedGrams: 0, blocks: 0, copiedBlocks: 0, progressions: 0, sharedProgressions: 0 }));
  recs.forEach((r, i) => {
    Object.assign(per[i], { grams: G[i].size, blocks: B[i].size, progressions: P[i].size });
    for (const k of G[i].keys()) if (!ignored(k) && recs.some((_, j) => j !== i && G[j].has(k))) per[i].sharedGrams++;
    for (const k of B[i].keys()) if (recs.some((_, j) => j !== i && B[j].has(k))) per[i].copiedBlocks++;
    for (const k of P[i].keys()) if (recs.some((_, j) => j !== i && P[j].has(k))) per[i].sharedProgressions++;
    for (let j = i + 1; j < recs.length; j++) {
      const g = [...G[i].keys()].filter((k) => !ignored(k) && G[j].has(k)), b = [...B[i].keys()].filter((k) => B[j].has(k)).map((k) => [B[i].get(k), B[j].get(k)]), p = [...P[i].keys()].filter((k) => P[j].has(k));
      if (g.length || b.length || p.length) pairs.push({ a: r.id, b: recs[j].id, grams: g.length, gramsAt: g.map((k) => [G[i].get(k), G[j].get(k)]), blocks: b, progressions: p });
    }
  });
  return { pairs, per };
}
