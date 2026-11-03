// The checks a score can pass without an ear (journal Passe SN5): what the notes say (the tune rubbing on a sustained note of the band, an instrument out of its
// range; the motif's place and the pieces' likeness are `likeness.mjs`'s, journal Passe SN8), and what a render says (the balance by octave, the loudness along the piece). They find faults; they do not say a piece is good.
import fs from 'node:fs';
import zlib from 'node:zlib';
import { fft, loudness } from '../measure.mjs';

const pc = (m) => ((m % 12) + 12) % 12;
const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
export const noteName = (m) => `${NAMES[pc(m)]}${Math.floor(m / 12) - 1}`;

/** the tune's held notes a semitone above something the band sustains under them (a flat ninth): the rub an arranger takes out first, listed with where it falls.
 *  A major seventh is a colour: a semitone below stays. Passing notes shorter than `hold` seconds are the tune's business. */
export function rubs(events, tunes, { hold = 0.3, share = 0.6, secondsPerBar = 2 } = {}) {
  const out = [], band = events.filter((e) => !tunes.includes(e.track) && e.dur > 0);
  for (const n of events) {
    if (!tunes.includes(n.track) || n.dur < hold) continue;
    for (const b of band) {
      const over = Math.min(n.t + n.dur, b.t + b.dur) - Math.max(n.t, b.t); if (over < n.dur * share) continue;
      const d = n.midi - b.midi; if (pc(d) === 1 && d > 0) { out.push({ bar: +(n.t / secondsPerBar).toFixed(2), tune: noteName(n.midi), band: noteName(b.midi), track: b.track }); break; }
    }
  }
  return out;
}

/** each track's lowest and highest notes against a table of ranges */
export function outOfRange(events, ranges) {
  const out = [];
  for (const e of events) { const r = ranges[e.track]; if (r && (e.midi < r[0] || e.midi > r[1])) out.push({ track: e.track, note: noteName(e.midi), t: +e.t.toFixed(2) }); }
  return out;
}

// ------------------------------------------------------------------------------------------------- a render

export function readWav(file) {
  const b = fs.readFileSync(file); let p = 12, fmt = null;
  while (p + 8 <= b.length) { const id = b.toString('ascii', p, p + 4), n = b.readUInt32LE(p + 4); if (id === 'fmt ') fmt = { ch: b.readUInt16LE(p + 10), sr: b.readUInt32LE(p + 12) }; if (id === 'data') { const frames = n / (2 * fmt.ch), c = Array.from({ length: fmt.ch }, () => new Float32Array(frames)); for (let i = 0; i < frames; i++) for (let k = 0; k < fmt.ch; k++) c[k][i] = b.readInt16LE(p + 8 + 2 * (i * fmt.ch + k)) / 32768; return { channels: c, sr: fmt.sr }; } p += 8 + n + (n & 1); }
  throw new Error(`no data chunk in ${file}`);
}
/** the power spectrum, averaged over the piece, by octave from 31 Hz: each octave's level against the loudest */
export function octaves(x, sr, size = 1 << 14) {
  const bands = [31.25, 62.5, 125, 250, 500, 1000, 2000, 4000, 8000, 16000], sum = new Float64Array(bands.length), win = Float64Array.from({ length: size }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / size));
  for (let at = 0; at + size < x.length; at += size) {
    const re = new Float64Array(size), im = new Float64Array(size); for (let i = 0; i < size; i++) re[i] = x[at + i] * win[i]; fft(re, im);
    for (let k = 1; k < size / 2; k++) { const f = k * sr / size, b = Math.floor(Math.log2(f / 22.1)) ; if (b >= 0 && b < bands.length) sum[b] += re[k] * re[k] + im[k] * im[k]; }
  }
  const top = Math.max(...sum); return Object.fromEntries(bands.map((f, i) => [f, +(10 * Math.log10((sum[i] + 1e-12) / top)).toFixed(1)]));
}
/** loudness over windows of `secs`: the piece's shape */
export function shape(channels, sr, secs) {
  const n = Math.round(secs * sr), out = []; for (let at = 0; at + n <= channels[0].length; at += n) out.push(+loudness(channels.map((c) => c.subarray(at, at + n)), sr).lufs.toFixed(1)); return out;
}
/** the join of a loop: the step from its last sample to its first against the signal's largest step anywhere: a join heard as a click stands out of it, a circular body does not */
export function seam(channels, sr, start, end) {
  let step = 0, most = 1e-9, peak = 1e-9;
  for (const x of channels) { step = Math.max(step, Math.abs(x[start] - x[end - 1])); for (let i = start + 1; i < end; i++) { most = Math.max(most, Math.abs(x[i] - x[i - 1])); peak = Math.max(peak, Math.abs(x[i])); } }
  return { step: +(step / peak).toFixed(3), ofLargest: +(step / most).toFixed(2) };
}
/** a picture of a render: time across, log frequency up, 20 Hz to 16 kHz; for a reader who cannot listen */
export function spectrogram(x, sr, out, { w = 1400, h = 420, size = 4096, floor = -80 } = {}) {
  const hop = Math.max(1, Math.floor((x.length - size) / w)), win = Float64Array.from({ length: size }, (_, i) => 0.5 - 0.5 * Math.cos(2 * Math.PI * i / size)), rows = [];
  for (let c = 0; c < w; c++) {
    const re = new Float64Array(size), im = new Float64Array(size), at = c * hop; for (let i = 0; i < size; i++) re[i] = (x[at + i] ?? 0) * win[i]; fft(re, im);
    const col = new Uint8Array(h); for (let y = 0; y < h; y++) { const f = 20 * 800 ** (y / h), f2 = 20 * 800 ** ((y + 1) / h), k = Math.round(f * size / sr), k2 = Math.max(k + 1, Math.round(f2 * size / sr)); let m = 0; for (let j = k; j < k2 && j < size / 2; j++) m = Math.max(m, re[j] * re[j] + im[j] * im[j]); const d = 10 * Math.log10(m / (size * size / 16) + 1e-12); col[y] = Math.round(255 * Math.min(1, Math.max(0, (d - floor) / -floor))); }
    rows.push(col);
  }
  const raw = Buffer.alloc((w * 3 + 1) * h); let p = 0; const ramp = (v) => [Math.min(255, v * 1.5), Math.max(0, Math.min(255, (v - 70) * 1.5)), Math.max(0, Math.min(255, 110 - v + Math.max(0, v - 190) * 2.6))];
  for (let y = h - 1; y >= 0; y--) { raw[p++] = 0; for (let c = 0; c < w; c++) { const [r, g, b] = ramp(rows[c][y]); raw[p++] = r; raw[p++] = g; raw[p++] = b; } }
  const crcT = Int32Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; }), crc = (b) => { let c = -1; for (const v of b) c = crcT[(c ^ v) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; };
  const chunk = (id, d) => { const l = Buffer.alloc(4); l.writeUInt32BE(d.length); const t = Buffer.concat([Buffer.from(id), d]), c = Buffer.alloc(4); c.writeUInt32BE(crc(t)); return Buffer.concat([l, t, c]); };
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 2;
  fs.writeFileSync(out, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
}
