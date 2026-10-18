import type { BakedFrame } from './BakedSprites';
import { FRAME_W, FOOT_Y } from './SpriteGenerator';

/** The ground speed a baked walk cycle draws (journal Passe S2): in the side view the planted foot slides backwards inside the frame while
 *  the actor moves forwards. On the foot row of each walk-side frame, the opaque runs (feet); between two consecutive frames, the smallest
 *  shift of a foot in the cycle's dominant direction is the planted foot's slide (a frame where the other foot lands shows a large shift the
 *  other way, and does not count). Returns the median slide in texels per frame (texels of the sheet's density k), or null without a side
 *  walk or when the cycle is not a steady treadmill (a slide more than 30 % off the median: no single cadence keeps that foot planted).
 *  Measured on the production cast: 4-4.5 texels / frame at k = 2, i.e. 0.63-0.71 m/s at the 7.5 frames / s walk cadence and the cast's 0.9
 *  scale; the dock worker's cycle (a boot held one frame, then 4 texels; double support) is not steady: null. */
export function walkSlide(frames: readonly BakedFrame[], k: number): number | null {
  const fw = FRAME_W * k, row = FOOT_Y * k;
  const walk = frames.filter((f) => f.dir === 'side' && f.anim === 'walk').sort((a, b) => a.i - b.i);
  if (walk.length < 2) return null;
  const feet = walk.map((f) => {
    const c: number[] = []; let s = -1;
    for (let x = 0; x <= fw; x++) { const on = x < fw && f.rgba[(row * fw + x) * 4 + 3] > 127; if (on && s < 0) s = x; if (!on && s >= 0) { c.push((s + x - 1) / 2); s = -1; } }
    return c;
  });
  const pairs: number[][] = [];
  for (let i = 0; i < walk.length; i++) {
    const a = feet[i], b = feet[(i + 1) % walk.length];
    const d: number[] = []; for (const p of a) for (const q of b) if (Math.abs(q - p) <= 8 * k) d.push(q - p);
    if (d.length) pairs.push(d);
  }
  // the dominant direction: the sign of the median of each pair's smallest shift
  const nearest = pairs.map((d) => d.reduce((m, v) => (Math.abs(v) < Math.abs(m) ? v : m)));
  const dir = Math.sign(median(nearest)) || 1;
  // a foot held in place for a frame (shift 0) is a slide of 0, not a landing
  const slides = pairs.map((d) => d.filter((v) => v === 0 || Math.sign(v) === dir).map(Math.abs)).filter((d) => d.length).map((d) => Math.min(...d));
  if (!slides.length) return null;
  const m = median(slides);
  return slides.every((v) => Math.abs(v - m) <= 0.3 * m) ? m : null;
}

function median(v: number[]): number {
  const s = [...v].sort((a, b) => a - b), n = s.length;
  return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2;
}
