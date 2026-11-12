/** The form of the day's sign, a CANDIDATE of lot 4 of the duel played by the computer (journal Passe LC6; its listening sheet briefs/fiche-combat-auto-lot4.html): the
 *  form (AC-08 « Une forme du jour ±15 %, dite sur la fiche de match ») has no sound of its own; this one is proposed to the operator's ear and is wired into no
 *  page until his decision (nothing imports it but the listening tools). Computed in the page, never baked (the way of lot S2's steps and rain, src/audio/
 *  places.ts: no byte under SA-17): two notes of the band's vibraphone (its formula, tools/audio/band/instruments.mjs `vibes`), a fifth of the motif's notes
 *  without a third, rising for a fighter in good form, falling and darker for one in poor form. Its own seed: the same samples every time. Pure. */
import { Draw, seedOf } from './places';

const hz = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);
const D4 = 62, A4 = 69, D5 = 74, A5 = 81;

/** the band's vibraphone (instruments.mjs): three partials ringing, the mallet's click; cut after `dur` with a release */
function vibe(y: Float32Array, sr: number, r: Draw, midi: number, vel: number, at: number, dur: number, rel: number, g: number): void {
  const f = hz(midi), t = Math.min(4, Math.max(1.4, 3 * (440 / f) ** 0.4)), parts = [{ f, a: 0.9, tau: t * 0.5 }, { f: f * 3.99, a: 0.14 + 0.3 * vel, tau: t * 0.12 }, { f: f * 9.92, a: 0.03 + 0.09 * vel, tau: t * 0.03 }];
  const a0 = Math.round(at * sr), hold = Math.round(dur * sr), n = Math.min(y.length - a0, Math.round((dur + rel * 5) * sr)), k = Math.exp(-1 / (rel * sr));
  let e = 1, lp = 0;
  for (let i = 0; i < n; i++) {
    const s = i / sr; if (i > hold) e *= k;
    let v = 0; for (const p of parts) v += p.a * Math.sin(2 * Math.PI * p.f * s) * Math.exp(-s / p.tau);
    v *= Math.min(1, s / 0.001);
    // the mallet: a short burst of noise, smoothed
    if (s < 0.012) { lp += 0.35 * (r.bi() - lp); v += lp * (0.06 + 0.1 * vel) * Math.exp(-s / 0.002) * 4; }
    y[a0 + i] += v * e * g;
  }
}
/** a one-pole low-pass, the poor form's darker colour */
function darken(y: Float32Array, sr: number, f: number): void { const a = 1 - Math.exp(-2 * Math.PI * f / sr); let z = 0; for (let i = 0; i < y.length; i++) { z += a * (y[i] - z); y[i] = z; } }
/** the shimmer over the good form's fifth: a breath of high noise that swells and fades */
function shimmer(y: Float32Array, sr: number, r: Draw, at: number, g: number): void {
  const a0 = Math.round(at * sr), n = Math.min(y.length - a0, Math.round(0.7 * sr)); let h1 = 0, h2 = 0;
  for (let i = 0; i < n; i++) { const s = i / sr, env = Math.min(1, s / 0.15) * Math.exp(-Math.max(0, s - 0.15) / 0.18); const x = r.bi(); h1 += 0.9 * (x - h1); h2 += 0.25 * (h1 - h2); y[a0 + i] += (h1 - h2) * env * g; }
}
/** the level set on its loudest 400 ms (dBFS RMS), as the band's sounds are (art-lab/audio/sfx/duel.sfx.mjs `target`), the peak kept under 0.7 */
function level(y: Float32Array, sr: number, db: number): void {
  const w = Math.round(0.4 * sr); let best = 0;
  for (let i = 0; i + w <= y.length; i += w >> 2) { let s = 0; for (let j = i; j < i + w; j++) s += y[j] * y[j]; best = Math.max(best, Math.sqrt(s / w)); }
  let g = best > 0 ? 10 ** (db / 20) / best : 0, peak = 0; for (const v of y) peak = Math.max(peak, Math.abs(v * g));
  if (peak > 0.7) g *= 0.7 / peak;
  for (let i = 0; i < y.length; i++) y[i] *= g;
}

export type FormSign = 'formUp' | 'formDown';
/** the two candidates: a fighter in good form (a fifth rising, D5 then A5, the shimmer over it, -24 dB as the charge's first note), in poor form (a fifth falling,
 *  A4 then D4, softer and darker, -27 dB); mono, 1.1 s at `sr` */
export function formCue(id: FormSign, sr = 48000): Float32Array {
  const y = new Float32Array(Math.round(1.1 * sr)), r = new Draw(seedOf(`form:${id}`));
  if (id === 'formUp') { vibe(y, sr, r, D5, 0.6, 0, 0.45, 0.14, 0.5); vibe(y, sr, r, A5, 0.6, 0.1, 0.5, 0.16, 0.5); shimmer(y, sr, r, 0.05, 0.05); level(y, sr, -24); }
  else { vibe(y, sr, r, A4, 0.35, 0, 0.4, 0.14, 0.5); vibe(y, sr, r, D4, 0.35, 0.12, 0.5, 0.18, 0.5); darken(y, sr, 2200); level(y, sr, -27); }
  return y;
}
/** who shows a sign: a form of the day this far from 1 (the match sheet's « +14 % »: ±5 points and more), its sign; nothing between */
export const FORM_SIGN_FROM = 0.05;
export const formSignOf = (form: number): FormSign | null => (form >= 1 + FORM_SIGN_FROM ? 'formUp' : form <= 1 - FORM_SIGN_FROM ? 'formDown' : null);
