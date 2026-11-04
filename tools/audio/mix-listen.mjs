// Lot S5 (journal Passe SN21): the whole sound as a game plays it, measured and made listenable. Reads the renders of tools/audio/render.mjs with
// tools/audio/mix-jobs.mjs (<out>/raw, <out>/meta.json) and of render.mjs's own jobs.
//   node tools/audio/mix-listen.mjs <out> measure          the journeys joined page after page (the load between two pages as silence), each page's loudness,
//                                                          the jumps between pages, the stings against what they come over, the whole duels minute by minute
//   node tools/audio/mix-listen.mjs <out> site <siteDir>   the sheet's excerpts in MP3 and the curves in SVG (FFMPEG or the PATH)
// `--gap=<s>`: the load between two pages (default 2 s: the page's fade 0.35 s is in the leaving page's render, the next page's 1.2 s in the next).
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { biquad, kFilters, loudness, truePeak } from './measure.mjs';

const args = process.argv.slice(2), out = path.resolve(args[0] ?? 'out-mix'), stage = args[1] ?? 'measure';
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const GAP = +(opt('gap') ?? 2), FF = process.env.FFMPEG ?? 'ffmpeg';
const meta = JSON.parse(fs.readFileSync(path.join(out, 'meta.json'), 'utf8'));
const SR = (n) => meta[n]?.sr ?? 48000;
export function read(dir, n) {
  const b = fs.readFileSync(path.join(dir, 'raw', `${n}.f32`)), f = new Float32Array(b.buffer, b.byteOffset, b.length / 4), L = new Float32Array(f.length / 2), R = new Float32Array(f.length / 2);
  for (let i = 0; i < L.length; i++) { L[i] = f[2 * i]; R[i] = f[2 * i + 1]; }
  return [L, R];
}
const cut = ([L, R], sr, a, b) => [L.slice(Math.round(a * sr), Math.round(b * sr)), R.slice(Math.round(a * sr), Math.round(b * sr))];
const r1 = (v) => Math.round(v * 10) / 10;
const lk = (e) => -0.691 + 10 * Math.log10(Math.max(e, 1e-12));

/** the K-weighted power of a signal, summed, for windows of any length read at any time */
function powerOf([L, R], sr) {
  const { shelf, high } = kFilters(sr), n = L.length, sum = new Float64Array(n + 1);
  const yl = biquad(biquad(L, shelf.b, shelf.a), high.b, high.a), yr = biquad(biquad(R, shelf.b, shelf.a), high.b, high.a);
  for (let i = 0; i < n; i++) sum[i + 1] = sum[i] + yl[i] * yl[i] + yr[i] * yr[i];
  return { sr, n, at: (a, b) => { const i = Math.max(0, Math.round(a * sr)), j = Math.min(n, Math.round(b * sr)); return j > i ? lk((sum[j] - sum[i]) / (j - i)) : -70; } };
}
/** the short-term loudness (3 s) every `hop` seconds */
const shortTerm = (P, hop = 0.5) => { const o = []; for (let t = 0; t + 3 <= P.n / P.sr; t += hop) o.push([+(t + 1.5).toFixed(2), r1(P.at(t, t + 3))]); return o; };

/** the level by octave (63 Hz to 16 kHz, dB of the mid signal's mean power, Welch over Hann windows of 8192): where a part sits against another */
export const OCTAVES = [63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
export function octaves([L, R], sr, from = 0, to = Infinity) {
  const N = 8192, w = new Float64Array(N); for (let i = 0; i < N; i++) w[i] = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1));
  const a = Math.round(from * sr), b = Math.min(L.length, Math.round(to * sr)), band = new Float64Array(OCTAVES.length); let frames = 0;
  for (let s = a; s + N <= b; s += N / 2) {
    const re = new Float64Array(N), im = new Float64Array(N); for (let i = 0; i < N; i++) re[i] = (L[s + i] + R[s + i]) / 2 * w[i];
    fftIn(re, im);
    for (let k = 1; k < N / 2; k++) { const f = k * sr / N, o = OCTAVES.findIndex((c) => f >= c / Math.SQRT2 && f < c * Math.SQRT2); if (o >= 0) band[o] += re[k] * re[k] + im[k] * im[k]; }
    frames++;
  }
  return [...band].map((e) => r1(10 * Math.log10(Math.max(1e-12, e / Math.max(1, frames)))));
}
function fftIn(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) { let b = n >> 1; for (; j & b; b >>= 1) j ^= b; j ^= b; if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; } }
  for (let len = 2; len <= n; len <<= 1) { const ang = -2 * Math.PI / len, wr = Math.cos(ang), wi = Math.sin(ang); for (let i = 0; i < n; i += len) { let cr = 1, ci = 0; for (let k = 0; k < len / 2; k++) { const x = i + k, y = x + len / 2, tr = re[y] * cr - im[y] * ci, ti = re[y] * ci + im[y] * cr; re[y] = re[x] - tr; im[y] = im[x] - ti; re[x] += tr; im[x] += ti; const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr; } } }
}

/** the journeys: their pages in order */
const JOURNEYS = {
  J1: ['J1-1-district', 'J1-2-forecourt', 'J1-3-training', 'J1-4-district'],
  J2: ['J2-1-forecourt', 'J2-2-duel', 'J2-3-district'],
  J3: ['J3-1-district', 'J3-2-forecourt', 'J3-3-festival', 'J3-4-training'],
};
/** a journey's pages joined, with the load's silence between them; where each page starts */
export function journey(id, gap = GAP) {
  const parts = JOURNEYS[id].map((n) => ({ n, c: read(out, n), sr: SR(n) })), sr = parts[0].sr, g = Math.round(gap * sr);
  const len = parts.reduce((a, p) => a + p.c[0].length, 0) + g * (parts.length - 1), L = new Float32Array(len), R = new Float32Array(len), starts = [];
  let at = 0; for (const p of parts) { starts.push({ n: p.n, t: at / sr, secs: p.c[0].length / sr }); L.set(p.c[0], at); R.set(p.c[1], at); at += p.c[0].length + g; }
  return { c: [L, R], sr, starts };
}

if (stage === 'measure') {
  const M = { gap: GAP, journeys: {}, pages: {}, duels: {}, stings: {}, events: {} };
  // ---- each page alone: its loudness (the fades out), and where it stands against the page before it
  for (const [id, names] of Object.entries(JOURNEYS)) {
    const J = journey(id), P = powerOf(J.c, J.sr), rows = [];
    for (const s of J.starts) {
      const page = cut(J.c, J.sr, s.t + 2, s.t + s.secs - 1), L = loudness(page, J.sr);
      rows.push({ page: s.n, at: r1(s.t), secs: r1(s.secs), lufs: r1(L.lufs), lra: r1(L.lra), short: r1(L.short), tp: r1(truePeak(page)), first10: r1(P.at(s.t, s.t + 10)), last10: r1(P.at(s.t + s.secs - 11, s.t + s.secs - 1)) });
    }
    M.journeys[id] = { pages: rows, curve: shortTerm(P), whole: r1(loudness(J.c, J.sr).lufs) };
    console.log(`\n${id}  whole ${M.journeys[id].whole} LUFS`);
    for (const r of rows) console.log(`  ${r.page.padEnd(18)} at ${String(r.at).padStart(6)} s  ${String(r.lufs).padStart(6)} LUFS  LRA ${String(r.lra).padStart(4)}  short max ${r.short}  first 10 s ${r.first10}  last 10 s ${r.last10}  ${r.tp} dBTP`);
  }
  // ---- the whole duels: minute by minute, their end (the K.O., the jingle), their parts
  for (const n of ['J2-2-duel', 'D-orla-rival', 'D-marek-finale', 'D-vessa-music', 'D-vessa-crowd', 'D-vessa-fx'].filter((x) => meta[x])) {
    const c = read(out, n), sr = SR(n), P = powerOf(c, sr), secs = c[0].length / sr, L = loudness(c, sr), mins = [];
    for (let t = 0; t + 30 <= secs; t += 60) mins.push(r1(P.at(t, Math.min(secs, t + 60))));
    M.duels[n] = { secs: r1(secs), lufs: r1(L.lufs), lra: r1(L.lra), short: r1(L.short), momentary: r1(L.momentary), tp: r1(truePeak(c)), minutes: mins, curve: shortTerm(P, 1) };
    console.log(`${n.padEnd(16)} ${r1(secs)} s  ${r1(L.lufs)} LUFS  LRA ${r1(L.lra)}  short max ${r1(L.short)}  momentary max ${r1(L.momentary)}  minutes ${mins.join(' ')}`);
  }
  // ---- the duels' ends: the jingle (1.2 s after the K.O.) against the minute of the duel before the K.O.
  const KO = { 'J2-2-duel': ['vessa', 'victoire', 9.6], 'D-orla-rival': ['orla', 'victoire', 9.6], 'D-marek-finale': ['marek', 'defaite', 12.3] };
  const duels = JSON.parse(fs.readFileSync(path.join(out, 'duels.json'), 'utf8'));
  for (const [n, [foe, sting, len]] of Object.entries(KO)) {
    if (!meta[n]) continue;
    const c = read(out, n), sr = SR(n), P = powerOf(c, sr), ko = duels[foe].res.t + 2;
    M.stings[n] = { sting, before: r1(P.at(ko - 60, ko)), last10: r1(P.at(ko - 10, ko)), jingle: r1(P.at(ko + 1.2, ko + 1.2 + len)), after: r1(P.at(ko + 1.2 + len + 0.5, ko + 1.2 + len + 4)) };
    console.log(`${n} K.O. at ${r1(ko)} s: the minute before ${M.stings[n].before} LUFS, the 10 s before ${M.stings[n].last10}, the ${sting} ${M.stings[n].jingle}, the crowd after it ${M.stings[n].after}`);
  }
  // ---- the fanfare at 6 s over the forecourt's piece (the music 9 dB back under it)
  if (meta['S-fanfare-forecourt']) {
    const c = read(out, 'S-fanfare-forecourt'), P = powerOf(c, SR('S-fanfare-forecourt'));
    M.stings.fanfare = { before: r1(P.at(2, 6)), fanfare: r1(P.at(6.05, 6.05 + 16.1)), peak3: r1(Math.max(...Array.from({ length: 30 }, (_, k) => P.at(6 + k * 0.5, 9 + k * 0.5)))) };
    console.log(`fanfare over the forecourt: the page before ${M.stings.fanfare.before} LUFS, the fanfare's 16 s ${M.stings.fanfare.fanfare}, its loudest 3 s ${M.stings.fanfare.peak3}`);
  }
  // ---- the interface and the steps over each page: the event alone against the page alone in the same window (the events' renders without the music and the
  // place, the page's without the events): the loudness of the window (400 ms; 100 ms for a step), and the octave where the event stands out most
  for (const n of Object.keys(meta).filter((x) => /^S-ui-[a-z-]+$/.test(x) && !/-(alone|page)$/.test(x))) {
    if (!meta[`${n}-alone`] || !meta[`${n}-page`]) continue;
    const ev = read(out, `${n}-alone`), pg = read(out, `${n}-page`), sr = SR(n), PE = powerOf(ev, sr), PP = powerOf(pg, sr), o = {};
    const win = (t, w) => { let best = -70, at = t; for (let d = 0; d < 0.5; d += 0.01) { const v = PE.at(t + d, t + d + w); if (v > best) { best = v; at = t + d; } } return { ev: best, page: PP.at(at, at + w), at }; };
    const band = (at, w) => { const e = octaves(ev, sr, at - 0.05, at + w + 0.12), p = octaves(pg, sr, at - 0.05, at + w + 0.12); let best = -99, f = 0; e.forEach((v, i) => { if (v - p[i] > best) { best = v - p[i]; f = OCTAVES[i]; } }); return { best: r1(best), f }; };
    for (const [e, t] of Object.entries({ click: 6, open: 8, coin: 10, denied: 12 })) { const w = win(t, 0.4); o[e] = { loud: r1(w.ev - w.page), ...band(w.at, 0.4) }; }
    const steps = []; for (let t = 14; t < 19.4; t += 0.27) { const w = win(t - 0.01, 0.1); steps.push(w.ev - w.page); }
    o.step = { loud: r1(steps.reduce((a, b) => a + b, 0) / steps.length) };
    M.events[n] = o;
    console.log(`${n.padEnd(22)} the event alone over the page alone (dB in its window; the octave where it stands out most): ${JSON.stringify(o)}`);
  }
  // ---- by octave: each page's music against its ambience; the duel's three parts
  const oct = (n, a, b) => (meta[n] ? octaves(read(out, n), SR(n), a, b) : null);
  for (const p of ['district-midday', 'district-night', 'forecourt-midday', 'training-midday', 'festival-night']) M.pages[p] = { music: oct(`mus-${p}`, 5, 60), ambience: oct(`amb-${p}`, 5, 45) };
  const ko = duels.vessa.res.t + 2;
  M.duels.octaves = { music: oct('D-vessa-music', 12, ko), crowd: oct('D-vessa-crowd', 12, ko), fx: oct('D-vessa-fx', 12, ko) };
  console.log(`\noctaves ${OCTAVES.join(' ')}`);
  for (const [p, v] of Object.entries(M.pages)) console.log(`${p.padEnd(18)} music ${v.music?.join(' ')}\n${''.padEnd(18)} amb.  ${v.ambience?.join(' ')}`);
  for (const [k, v] of Object.entries(M.duels.octaves)) console.log(`duel ${k.padEnd(13)} ${v?.join(' ')}`);
  fs.writeFileSync(path.join(out, 'mix-measures.json'), JSON.stringify(M));
}

if (stage === 'site') {
  const site = path.resolve(args[2]), dir = path.join(site, 'audio'), measures = {}, M = JSON.parse(fs.readFileSync(path.join(out, 'mix-measures.json'), 'utf8'));
  fs.mkdirSync(dir, { recursive: true });
  /** an excerpt in MP3 at 192 kb/s, its last `fade` seconds faded out; the engine's own level, nothing raised */
  const mp3 = (name, [L, R], sr, fadeS = 1.5) => {
    const n = L.length, fade = Math.round(fadeS * sr), pcm = Buffer.alloc(n * 8);
    for (let i = 0; i < n; i++) { const e = i >= n - fade ? (n - i) / fade : 1; pcm.writeFloatLE(L[i] * e, 8 * i); pcm.writeFloatLE(R[i] * e, 8 * i + 4); }
    execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', String(sr), '-ac', '2', '-i', 'pipe:0', '-c:a', 'libmp3lame', '-b:a', '192k', path.join(dir, `${name}.mp3`)], { input: pcm, maxBuffer: 1 << 30 });
    const m = loudness([L, R], sr); measures[name] = { secs: r1(n / sr), lufs: r1(m.lufs), tp: r1(truePeak([L, R])) };
  };
  // the journeys whole: a morning, an evening; the bout's afternoon with its duel shortened (its first 75 s, its last 45 s, crossfaded)
  for (const id of ['J1', 'J3']) { const J = journey(id); mp3(`journey-${id}`, J.c, J.sr); }
  // `trim`: the duel's page that many dB down after the limiter (an output trim of the arena's page: the same samples scaled, exactly)
  const J2 = journey('J2'), d = J2.starts[1], sr = J2.sr, x = Math.round(0.5 * sr);
  const shortJ2 = (trim = 0) => {
    const k = 10 ** (trim / 20), a = Math.round(d.t * sr), b = Math.round((d.t + d.secs) * sr), c = [J2.c[0].slice(), J2.c[1].slice()];
    for (const ch of c) for (let i = a; i < b; i++) ch[i] *= k;
    const parts = [cut(c, sr, 0, d.t + 75), cut(c, sr, d.t + d.secs - 45, c[0].length / sr)], len = parts[0][0].length + parts[1][0].length - x, L = new Float32Array(len), R = new Float32Array(len);
    parts.forEach(([pl, pr], j) => { const at = j ? parts[0][0].length - x : 0; for (let i = 0; i < pl.length; i++) { const g = j === 0 && i >= pl.length - x ? (pl.length - i) / x : j === 1 && i < x ? i / x : 1; L[at + i] += pl[i] * g; R[at + i] += pr[i] * g; } });
    return [L, R];
  };
  mp3('journey-J2', shortJ2(), sr); mp3('journey-J2-trim', shortJ2(-1.5), sr);
  measures['journey-J2'].cut = { from: r1(d.t + 75), to: r1(d.t + d.secs - 45) };
  // the proposals against today: the arena's crowd carved at 500 Hz (with the duel, then alone), the refusal 6 dB up over the town at midday
  for (const n of ['today', 'carved', 'today-alone', 'carved-alone']) if (meta[`P-crowd-${n}`]) mp3(`crowd-${n}`, cut(read(out, `P-crowd-${n}`), 48000, 3, 44), 48000);
  for (const n of ['today', 'up']) if (meta[`P-denied-${n}`]) mp3(`denied-${n}`, read(out, `P-denied-${n}`), 48000, 0.6);
  // the long duel: its sixth minute against its first (the same duel, the same piece)
  const D = read(out, 'J2-2-duel'), dsr = SR('J2-2-duel');
  mp3('duel-minute1', cut(D, dsr, 2, 62), dsr); mp3('duel-minute6', cut(D, dsr, 302, 362), dsr);
  // the whole duel's three parts, the same 40 s
  for (const p of ['music', 'crowd', 'fx']) if (meta[`D-vessa-${p}`]) mp3(`duel-${p}`, cut(read(out, `D-vessa-${p}`), dsr, 122, 162), dsr);
  // the ends: the K.O. and the jingles
  const ends = JSON.parse(fs.readFileSync(path.join(out, 'duels.json'), 'utf8'));
  for (const [n, foe] of [['J2-2-duel', 'vessa'], ['D-marek-finale', 'marek']]) { const c = read(out, n), ko = ends[foe].res.t + 2; mp3(`end-${foe}`, cut(c, SR(n), ko - 12, ko + 16), SR(n)); }
  if (meta['S-fanfare-forecourt']) mp3('fanfare', read(out, 'S-fanfare-forecourt'), SR('S-fanfare-forecourt'));
  for (const p of ['district-midday', 'festival-night', 'training-midday']) if (meta[`S-ui-${p}`]) mp3(`ui-${p}`, cut(read(out, `S-ui-${p}`), SR(`S-ui-${p}`), 3, 20.5), SR(`S-ui-${p}`));
  // the curves for the sheet: each journey's short-term loudness every second, where each page starts
  const curves = {};
  for (const id of Object.keys(JOURNEYS)) curves[id] = { pages: M.journeys[id].pages.map((p) => ({ page: p.page, at: p.at, secs: p.secs, lufs: p.lufs })), curve: M.journeys[id].curve.filter((_, i) => i % 2 === 0) };
  fs.writeFileSync(path.join(site, 'curves.json'), JSON.stringify(curves));
  fs.writeFileSync(path.join(out, 'site-measures.json'), JSON.stringify(measures, null, 1));
  for (const [k, v] of Object.entries(measures)) console.log(k.padEnd(22), JSON.stringify(v));
}
