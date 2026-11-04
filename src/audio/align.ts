/** Where a baked loop starts in what a browser decoded (journal Passe SN10): decoders differ on the codec's delays at the start of a file, and a loop must close
 *  on its sample. Pure: tools/audio/decode-proof.mjs runs it in the browsers, tests/audio-baked.test.mjs on decodes that keep the delays. */

export type Format = 'webm' | 'm4a';
/** what alignLoop reads of a decoded buffer */
export interface Pcm { length: number; sampleRate: number; numberOfChannels: number; getChannelData(c: number): Float32Array }
/** the delays a decoder may leave at the start of a file, in samples at 48 kHz: Opus's pre-skip (the bake writes 336, 7 ms, tools/audio/band/bake.mjs), AAC's priming (ffmpeg's encoder: 1024;
 *  Apple's convention: 2112) */
export const CODEC_DELAY: Record<Format, readonly number[]> = { webm: [0, 336], m4a: [0, 1024, 2112] };
/** a codec's frame, in samples at 48 kHz: the padding an encoder adds after the sound is shorter (Opus's 20 ms, AAC's 1024) */
export const FRAME: Record<Format, number> = { webm: 960, m4a: 1024 };

/** how far the join of a circle at `o`, `n` samples long, steps against the steps around it: small where the loop really closes. Pure */
export function seamScore(buf: Pcm, o: number, n: number, span = 48): number {
  let join = 0, rest = 0, count = 0;
  for (let c = 0; c < buf.numberOfChannels; c++) {
    const x = buf.getChannelData(c), at = (k: number) => (k < 0 ? x[Math.round(o + n + k)] : x[Math.round(o + k)]) ?? 0;
    for (let k = -span; k < span; k++) { const d = at(k) - at(k - 1); if (k === 0) join += d * d; else { rest += d * d; count++; } }
  }
  return join / (rest / Math.max(1, count) + 1e-12);
}

/** where a loop of `frames` samples at `rate` Hz starts in a decoded buffer (journal Passe SN10). A decoder that honours the file's delays (Opus's pre-skip,
 *  the M4A's edit list) gives the frames exactly; one that does not leaves the codec's delay at the start and its padding at the end. Among the delays the
 *  format may leave that the length allows, the one whose join closes best. Pure */
export function alignLoop(buf: Pcm, frames: number, rate = 48000, format?: Format): { offset: number; how: 'exact' | 'seam' } {
  const k = buf.sampleRate / rate, n = frames * k;
  if (Math.abs(buf.length - n) <= 2) return { offset: 0, how: 'exact' };
  const delays = format ? CODEC_DELAY[format] : [...new Set([...CODEC_DELAY.webm, ...CODEC_DELAY.m4a])];
  let fit = delays.map((d) => Math.round(d * k)).filter((o) => o + n <= buf.length + 1);
  // a decoder that dropped the codec's delay leaves less than a frame of padding after the sound; a frame or more over the length means it kept the delay
  // (the join alone misleads where the codec blurred the loop's two edges: three AAC loops of the catalogue, journal Passe SN10)
  if (format && buf.length - n >= FRAME[format] * k - 2) fit = fit.filter((o) => o > 0);
  if (fit.length <= 1) return { offset: fit[0] ?? 0, how: 'seam' };
  let best = fit[0], score = Infinity;
  for (const o of fit) { const s = seamScore(buf, o, n); if (s < score) { score = s; best = o; } }
  return { offset: best, how: 'seam' };
}

/** where a sound that is not a loop (an intro, a jingle) starts in a decoded buffer: at 0 when the length is exact, else at the delay this browser's loops of
 *  the same format showed (`known`), else at 0. An intro must meet its loop on the sample: the engine aligns the loops first. Pure */
export function startOf(buf: Pcm, frames: number, rate = 48000, format?: Format, known?: number): number {
  const n = frames * (buf.sampleRate / rate);
  if (Math.abs(buf.length - n) <= 2) return 0;
  return known !== undefined && known + n <= buf.length + 1 ? known : 0;
}
