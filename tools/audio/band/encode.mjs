// The encoders of the bake (journal Passe SN10): a stereo pair to Opus in WebM and AAC in M4A through ffmpeg, bit-exact (no random segment id, no version string,
// no date), Opus's delay on a whole millisecond. Used by tools/audio/band/bake.mjs and the Safari page (tools/audio/safari-page.mjs).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { SR } from './dsp.mjs';

export const ENC = {
  webm: (kbps) => ['-c:a', 'libopus', '-b:a', `${kbps}k`, '-vbr', 'on', '-application', 'audio', '-frame_duration', '20', '-f', 'webm'],
  m4a: (kbps) => ['-c:a', 'aac', '-b:a', `${kbps}k`, '-f', 'mp4'],
};
export const COMMON = ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', 'pipe:0', '-map_metadata', '-1', '-fflags', '+bitexact', '-flags:a', '+bitexact'];

/** Opus's delay on a whole millisecond: libopus starts its output 312 samples late (6.5 ms), and Chrome reads the WebM's CodecDelay through the container's
 *  millisecond, 7 ms: it dropped 24 samples of every file, a step at every turn of a loop. The file starts with 24 samples more (a loop's own last ones, so
 *  that the encoder warms up on the circle; silence before an intro or a jingle) and says 336 samples (7 ms) in both its CodecDelay and its OpusHead */
export const OPUS_LEAD = 24, OPUS_DELAY = 312 + OPUS_LEAD;
export function patchOpusDelay(b) {
  const swap = (from, to) => { const i = b.indexOf(from); if (i < 0 || b.indexOf(from, i + 1) >= 0) throw new Error(`encode: ${from.toString('hex')} not found once`); to.copy(b, i); };
  // the EBML CodecDelay (0x56AA, 3 bytes): 6 500 000 ns to 7 000 000 ns; the OpusHead's pre-skip (after the magic, the version and the channels): 312 to 336
  swap(Buffer.from([0x56, 0xaa, 0x83, 0x63, 0x2e, 0xa0]), Buffer.from([0x56, 0xaa, 0x83, 0x6a, 0xcf, 0xc0]));
  swap(Buffer.from('OpusHead\x01\x02\x38\x01', 'latin1'), Buffer.from('OpusHead\x01\x02\x50\x01', 'latin1'));
  return b;
}
const pcmOf = (L, R, lead) => { const n = L.length + lead.length, pcm = Buffer.alloc(n * 8); for (let i = 0; i < n; i++) { const [l, r] = i < lead.length ? lead[i] : [L[i - lead.length], R[i - lead.length]]; pcm.writeFloatLE(l, 8 * i); pcm.writeFloatLE(r, 8 * i + 4); } return pcm; };

/** a stereo pair to `<base>.webm` and `<base>.m4a` (`kbps` one bitrate, or one per format; `extra` more encoder arguments per format); `circle`: a loop (its last
 *  samples lead its Opus file). Returns the two files' bytes */
export function encodePair(ffmpeg, [L, R], base, kbps, circle, extra = {}) {
  const lead = Array.from({ length: OPUS_LEAD }, (_, i) => (circle ? [L[L.length - OPUS_LEAD + i], R[R.length - OPUS_LEAD + i]] : [0, 0])), out = {};
  for (const x of ['webm', 'm4a']) {
    const file = `${base}.${x}`;
    execFileSync(ffmpeg, [...COMMON, ...ENC[x](typeof kbps === 'object' ? kbps[x] : kbps), ...(extra[x] ?? []), file], { input: pcmOf(L, R, x === 'webm' ? lead : []), maxBuffer: 1 << 30 });
    if (x === 'webm') fs.writeFileSync(file, patchOpusDelay(fs.readFileSync(file)));
    out[x] = fs.readFileSync(file);
  }
  return out;
}
