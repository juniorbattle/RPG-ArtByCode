// The sound's measures (journal Passe SN2): loudness after ITU-R BS.1770 / EBU R128, true peak, the waveform's repetition, the two channels'
// correlation, a 16-bit WAV. Pure and without dependencies: tests/audio-measure.test.mjs checks them against EBU Tech 3341's cases, and
// tools/audio/render.mjs + analyse.mjs read the real engine's offline renders through them. Ported from the audit's analyse.py (journal Passe SN1).

/** a biquad, direct form II transposed */
export function biquad(x, b, a) {
  const y = new Float64Array(x.length); let z1 = 0, z2 = 0;
  for (let i = 0; i < x.length; i++) { const v = x[i], o = b[0] * v + z1; z1 = b[1] * v - a[1] * o + z2; z2 = b[2] * v - a[2] * o; y[i] = o; }
  return y;
}

/** BS.1770's K-weighting: its shelf and its high-pass, re-derived for a sample rate (Mansbridge et al.'s analog prototypes) */
export function kFilters(sr) {
  let f0 = 1681.9744509555319, Q = 0.7071752369554193, K = Math.tan(Math.PI * f0 / sr);
  const G = 3.99984385397, Vh = 10 ** (G / 20), Vb = Vh ** 0.499666774155, a0 = 1 + K / Q + K * K;
  const shelf = { b: [(Vh + Vb * K / Q + K * K) / a0, 2 * (K * K - Vh) / a0, (Vh - Vb * K / Q + K * K) / a0], a: [1, 2 * (K * K - 1) / a0, (1 - K / Q + K * K) / a0] };
  f0 = 38.13547087613982; Q = 0.5003270373253953; K = Math.tan(Math.PI * f0 / sr);
  const d = 1 + K / Q + K * K, high = { b: [1, -2, 1], a: [1, 2 * (K * K - 1) / d, (1 - K / Q + K * K) / d] };
  return { shelf, high };
}

const lk = (e) => -0.691 + 10 * Math.log10(Math.max(e, 1e-12));
const mean = (v) => v.reduce((s, x) => s + x, 0) / Math.max(1, v.length);

/** integrated loudness (gated), the highest momentary (400 ms) and short-term (3 s) loudness, and the range; channels = [left, right], each a
 *  Float32Array or Float64Array */
export function loudness(channels, sr) {
  const { shelf, high } = kFilters(sr), n = channels[0].length, p = new Float64Array(n);
  for (const c of channels) { const y = biquad(biquad(c, shelf.b, shelf.a), high.b, high.a); for (let i = 0; i < n; i++) p[i] += y[i] * y[i]; }
  const sum = new Float64Array(n + 1); for (let i = 0; i < n; i++) sum[i + 1] = sum[i] + p[i];
  const blocks = (T, step) => { const w = Math.round(T * sr), s = Math.round(step * sr), o = []; if (n < w) return [sum[n] / Math.max(1, n)]; for (let i = 0; i + w <= n; i += s) o.push((sum[i + w] - sum[i]) / w); return o; };
  const m = blocks(0.4, 0.1), st = blocks(3, 0.1), abs = m.filter((e) => lk(e) > -70);
  if (!abs.length) return { lufs: -70, momentary: -70, short: -70, lra: 0 };
  const rel = lk(mean(abs)) - 10, g = abs.filter((e) => lk(e) > rel);
  const st2 = st.filter((e) => lk(e) > -70).sort((a, b) => a - b), s3 = st2.filter((e) => lk(e) > lk(mean(st2)) - 20).map(lk);
  const pct = (q) => s3[Math.min(s3.length - 1, Math.floor(q * s3.length))];
  return { lufs: lk(mean(g)), momentary: Math.max(...m.map(lk)), short: Math.max(...st.map(lk)), lra: s3.length > 3 ? pct(0.95) - pct(0.1) : 0 };
}

/** the true peak in dBTP: each channel oversampled 4 x by a windowed sinc (the same method as BS.1770's annex 2) */
export function truePeak(channels) {
  const K = 4, half = 24, taps = 2 * half * K + 1, h = new Float64Array(taps);
  for (let i = 0; i < taps; i++) { const t = (i - half * K) / K, w = 0.5 + 0.5 * Math.cos(Math.PI * (i - half * K) / (half * K + 1)); h[i] = (t === 0 ? 1 : Math.sin(Math.PI * t) / (Math.PI * t)) * w; }
  let peak = 0;
  for (const c of channels) for (let i = half; i < c.length - half; i++) {
    const v0 = Math.abs(c[i]); if (v0 > peak) peak = v0;
    if (Math.max(Math.abs(c[i + 1]), v0) < peak * 0.5) continue;       // far under the peak so far: its interpolation cannot pass it by much
    for (let k = 1; k < K; k++) { let s = 0; for (let j = -half + 1; j <= half; j++) s += c[i + j] * h[(half - j) * K + k]; if (Math.abs(s) > peak) peak = Math.abs(s); }
  }
  return 20 * Math.log10(Math.max(peak, 1e-12));
}

export function samplePeak(channels) { let p = 0, over = 0; for (const c of channels) for (let i = 0; i < c.length; i++) { const v = Math.abs(c[i]); if (v > p) p = v; if (v > 1) over++; } return { peak: p, over }; }

/** an in-place radix-2 FFT */
export function fft(re, im, inverse = false) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (inverse ? 2 : -2) * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2, tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
  if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
}

/** the strongest repetition of a signal between two lags (seconds): the normalised autocorrelation on `secs` taken from a quarter into it */
export function repetition(x, sr, lo = 0.05, hi = 1, secs = 6) {
  const n = Math.min(x.length - (x.length >> 2), Math.round(secs * sr)), s = new Float64Array(n), from = x.length >> 2;
  let m = 0; for (let i = 0; i < n; i++) m += x[from + i]; m /= n;
  for (let i = 0; i < n; i++) s[i] = x[from + i] - m;
  let size = 1; while (size < 2 * n) size <<= 1;
  const re = new Float64Array(size), im = new Float64Array(size); re.set(s); fft(re, im);
  for (let i = 0; i < size; i++) { re[i] = re[i] * re[i] + im[i] * im[i]; im[i] = 0; }
  fft(re, im, true);
  const i0 = Math.round(lo * sr), i1 = Math.min(n - 1, Math.round(hi * sr)); let best = -Infinity, at = i0;
  for (let k = i0; k <= i1; k++) if (re[k] > best) { best = re[k]; at = k; }
  return { value: best / (re[0] + 1e-30), lag: at / sr };
}

/** the correlation of two channels: 1 = mono, 0 = unrelated */
export function correlation(a, b) {
  let ab = 0, aa = 0, bb = 0; for (let i = 0; i < a.length; i++) { ab += a[i] * b[i]; aa += a[i] * a[i]; bb += b[i] * b[i]; }
  return aa > 0 && bb > 0 ? ab / Math.sqrt(aa * bb) : 0;
}

/** the share of a signal's energy under `hz`, by a Hann-windowed FFT of its whole length (a short effect) */
export function shareUnder(x, sr, hz) {
  let size = 1; while (size < x.length) size <<= 1;
  const re = new Float64Array(size), im = new Float64Array(size);
  for (let i = 0; i < x.length; i++) re[i] = x[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / Math.max(1, x.length - 1)));
  fft(re, im);
  let low = 0, all = 0; for (let i = 1; i < size / 2; i++) { const e = re[i] * re[i] + im[i] * im[i], f = i * sr / size; all += e; if (f < hz) low += e; }
  return all > 0 ? low / all : 0;
}

/** the level of a signal in dB, its RMS */
export function rmsDb(x) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return 10 * Math.log10(Math.max(s / Math.max(1, x.length), 1e-12)); }

/** channels as a 16-bit PCM WAV */
export function wavBytes(channels, sr) {
  const ch = channels.length, n = channels[0].length, data = Buffer.alloc(44 + n * ch * 2);
  data.write('RIFF', 0); data.writeUInt32LE(36 + n * ch * 2, 4); data.write('WAVEfmt ', 8); data.writeUInt32LE(16, 16); data.writeUInt16LE(1, 20); data.writeUInt16LE(ch, 22);
  data.writeUInt32LE(sr, 24); data.writeUInt32LE(sr * ch * 2, 28); data.writeUInt16LE(ch * 2, 32); data.writeUInt16LE(16, 34); data.write('data', 36); data.writeUInt32LE(n * ch * 2, 40);
  for (let i = 0, o = 44; i < n; i++) for (let c = 0; c < ch; c++, o += 2) data.writeInt16LE(Math.round(Math.max(-1, Math.min(1, channels[c][i])) * 32767), o);
  return data;
}
