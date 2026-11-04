// The listening sheet of lot S2's sounds (journal Passe SN18): the places, their hours and their weather, the interface and the steps, played by the real engine
// (tools/audio/render.mjs), today against a proposal. A proposal's baked sounds (the cues of art-lab/audio/sfx/places.sfx.mjs; on the sheet of SN18 the interface and a
// murmur of the town, which the operator did not take, journal Passe SN19) are encoded as a bake would and put, with the catalogue's entries, into a copy of this
// repository's src/ (`<outDir>/root`): the engine renders from it, nothing enters src/audio/baked before the operator's decision. The computed ones
// (src/audio/places.ts) are the engine's own. The sheet's excerpts came from the engine of Passe SN18's commit (bd8eb8f on main).
//   node --max-old-space-size=8192 tools/audio/places-listen.mjs <outDir> prep                  the copy, the candidates encoded, their weight
//   node --max-old-space-size=8192 tools/audio/places-listen.mjs <outDir> render <today root>   the excerpts' jobs, the proposal and today (a frozen main)
//   node tools/audio/places-listen.mjs <outDir> site <siteDir>                                  the excerpts in MP3 for the sheet, and their measures
// FFMPEG or the PATH.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { encodePair } from './band/encode.mjs';
import { forgetNotes } from './band/instruments.mjs';
import { forgetHits } from './band/drums.mjs';
import { renderPlace, PLACE_IDS } from '../../art-lab/audio/sfx/places.sfx.mjs';
import { loudness, truePeak, wavBytes } from './measure.mjs';

const args = process.argv.slice(2), out = path.resolve(args[0] ?? 'out-places'), stage = args[1] ?? 'prep', here = import.meta.dirname, ROOT = path.resolve(here, '..', '..');
const FF = process.env.FFMPEG ?? 'ffmpeg', SR = 48000;
fs.mkdirSync(out, { recursive: true });
/** the bitrates a bake would use: the interface at the duel's sounds' (64 kb/s in Opus, 80 in AAC without its noise substitution), a loop lower (the murmur of SN18:
 *  far voices, its band stopping at 4.5 kHz) */
const KBPS = { webm: 64, m4a: 80 }, LOOP = { webm: 48, m4a: 64 }, EXTRA = { m4a: ['-aac_pns', '0'] };

if (stage === 'prep') {
  const root = path.join(out, 'root');
  fs.rmSync(root, { recursive: true, force: true });
  fs.cpSync(path.join(ROOT, 'src'), path.join(root, 'src'), { recursive: true });
  const baked = path.join(root, 'src', 'audio', 'baked'), wav = path.join(out, 'candidates'), table = {}, weight = { webm: 0, m4a: 0 }, report = {};
  fs.mkdirSync(wav, { recursive: true });
  for (const id of PLACE_IDS) {
    forgetNotes(); forgetHits();
    const c = renderPlace(id), names = c.takes.map((_, k) => (c.takes.length > 1 ? `sfx-${id}-${k}` : `sfx-${id}`)), loop = c.kind === 'loop';
    c.takes.forEach((t, k) => {
      fs.writeFileSync(path.join(wav, `${names[k]}.wav`), wavBytes([t.L, t.R], SR));
      const got = encodePair(FF, [t.L, t.R], path.join(baked, names[k]), loop ? LOOP : KBPS, loop, EXTRA);
      weight.webm += got.webm.length; weight.m4a += got.m4a.length;
      const m = loudness([t.L, t.R], SR);
      report[names[k]] = { secs: +(t.L.length / SR).toFixed(2), lufs: +m.lufs.toFixed(1), momentary: +m.momentary.toFixed(1), tp: +truePeak([t.L, t.R]).toFixed(1), webm: got.webm.length, m4a: got.m4a.length };
    });
    table[id] = { family: c.family, files: names, frames: c.takes.map((t) => t.L.length), ...(loop ? { loop: true } : {}) };
  }
  const file = path.join(root, 'src', 'audio', 'catalogue.json'), cat = JSON.parse(fs.readFileSync(file, 'utf8'));
  fs.writeFileSync(file, `${JSON.stringify({ ...cat, sfx: { ...cat.sfx, ...table } }, null, 1)}\n`);
  fs.writeFileSync(path.join(out, 'candidates.json'), JSON.stringify({ report, weight }, null, 1));
  for (const [k, v] of Object.entries(report)) console.log(k.padEnd(18), JSON.stringify(v));
  console.log(`weight: ${weight.webm} B in Opus, ${weight.m4a} B in AAC`);
}

/** the excerpts: each place by day and at night (its ambience alone), the weathers, the interface, the steps, two places with their music; `today` the same jobs
 *  on a frozen main (its engine takes no weather: those are silent there) */
const W = (o) => ({ rain: 0, snow: 0, storm: 0, wind: 1, ...o });
const amb = (name, place, look, secs, o = {}) => ({ name, secs, scene: { place, look, ...(o.bout ? { bout: true } : {}), ...(o.weather ? { weather: o.weather } : {}) }, stem: 'fx', script: 'places', rseed: o.rseed ?? 7, ...(o.events2 ? { events2: o.events2 } : {}) });
const every = (from, to, dt, f) => { const l = []; for (let t = from; t < to; t += dt) l.push(f(t)); return l; };
export const JOBS = [
  amb('L-district-morning', 'district', 'morning', 32), amb('L-district-night', 'district', 'night', 32),
  amb('L-forecourt-bout', 'forecourt', 'midday', 32, { bout: true }), amb('L-forecourt-night', 'forecourt', 'night', 32),
  amb('L-training-midday', 'training', 'midday', 32), amb('L-training-night', 'training', 'night', 32),
  amb('L-festival-afternoon', 'festival', 'afternoon', 32), amb('L-festival-night', 'festival', 'night', 32),
  // the rainy day of the version 2 (the rain front's third day, 0.6), a storm at night with its flashes, the snow on the hall's square, a gale on the lists
  amb('W-rain', 'district', 'midday', 32, { weather: W({ rain: 0.6 }) }),
  amb('W-storm', 'district', 'night', 38, { weather: W({ storm: 1, rain: 0.85, wind: 2 }), events2: [{ t: 3, flash: 1.3 }, { t: 12, flash: 0.55 }, { t: 21, flash: 0.95 }, { t: 30, flash: 0.3 }] }),
  amb('W-snow', 'festival', 'morning', 32, { weather: W({ snow: 1 }) }),
  amb('W-wind', 'training', 'afternoon', 32, { weather: W({ wind: 2.5 }) }),
  // the interface: three clicks, a dialog, the purse, a refused command, a click (no place: the effects alone)
  { name: 'U-palette', secs: 6, settings: { volume: 0.7 }, script: 'places', events2: [0.3, 0.9, 1.5].map((t) => ({ t, play: 'click' })).concat([{ t: 2.3, play: 'open' }, { t: 3.3, play: 'coin' }, { t: 4.3, play: 'denied' }, { t: 5.2, play: 'click' }]) },
  // the steps alone (the ambience muted): a walk on the setts of the town, on the earth of the lists (the snow crunches the same)
  { ...amb('S-stone', 'district', 'midday', 6), stem: undefined, mute: ['ambience', 'music'], events2: every(0.3, 5.6, 0.31, (t) => ({ t, play: 'step' })) },
  { ...amb('S-earth', 'training', 'midday', 6), stem: undefined, mute: ['ambience', 'music'], events2: every(0.3, 5.6, 0.31, (t) => ({ t, play: 'step' })) },
  // two places with their music: the whole page as the player hears it
  { name: 'M-district-morning', secs: 32, scene: { place: 'district', look: 'morning' }, script: 'places', rseed: 7 },
  { name: 'M-festival-night', secs: 32, scene: { place: 'festival', look: 'night' }, script: 'places', rseed: 7 },
];

if (stage === 'render') {
  const today = path.resolve(args[2]), jobsFile = path.join(out, 'places-jobs.mjs');
  fs.writeFileSync(jobsFile, `export const jobs = ${JSON.stringify(JOBS)};\n`);
  fs.copyFileSync(path.join(here, 'places-jobs.page.js'), path.join(out, 'places-jobs.page.js'));
  for (const [dir, root] of [['prop', path.join(out, 'root')], ['today', today]]) {
    fs.mkdirSync(path.join(out, dir), { recursive: true });
    const r = spawnSync(process.execPath, [path.join(here, 'render.mjs'), path.join(out, dir), `--root=${root}`, '--only=L-,W-,U-,S-,M-', `--scripts=${jobsFile}`], { stdio: 'inherit' });
    if (r.status) process.exit(r.status);
  }
}

if (stage === 'site') {
  const site = path.resolve(args[2]), dir = path.join(site, 'audio'), measures = {};
  fs.mkdirSync(dir, { recursive: true });
  const read = (from, n) => { const b = fs.readFileSync(path.join(out, from, 'raw', `${n}.f32`)), f = new Float32Array(b.buffer, b.byteOffset, b.length / 4), L = new Float32Array(f.length / 2), R = new Float32Array(f.length / 2); for (let i = 0; i < L.length; i++) { L[i] = f[2 * i]; R[i] = f[2 * i + 1]; } return [L, R]; };
  const cut = ([L, R], a, b) => [L.slice(Math.round(a * SR), Math.round(b * SR)), R.slice(Math.round(a * SR), Math.round(b * SR))];
  /** pieces joined with a crossfade of `x` seconds */
  const join = (parts, x = 1) => {
    const n = Math.round(x * SR), len = parts.reduce((a, p) => a + p[0].length, 0) - n * (parts.length - 1), L = new Float32Array(len), R = new Float32Array(len); let at = 0;
    parts.forEach(([pl, pr], k) => { for (let i = 0; i < pl.length; i++) { const fin = k > 0 && i < n ? i / n : 1, fout = k < parts.length - 1 && i >= pl.length - n ? (pl.length - i) / n : 1, g = fin * fout; L[at + i] += pl[i] * g; R[at + i] += pr[i] * g; } at += pl.length - n; });
    return [L, R];
  };
  /** an excerpt in MP3: a fade-out of 1.5 s, the same gain for every excerpt of a kind (the levels between today and the proposal are the engine's own) */
  const mp3 = (name, [L, R], db = 0) => {
    const g = 10 ** (db / 20), n = L.length, fade = Math.round(1.5 * SR), pcm = Buffer.alloc(n * 8);
    for (let i = 0; i < n; i++) { const e = g * (i >= n - fade ? (n - i) / fade : 1); pcm.writeFloatLE(L[i] * e, 8 * i); pcm.writeFloatLE(R[i] * e, 8 * i + 4); }
    execFileSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', 'pipe:0', '-c:a', 'libmp3lame', '-b:a', '192k', path.join(dir, `${name}.mp3`)], { input: pcm, maxBuffer: 1 << 30 });
    const m = loudness([L, R], SR); measures[name] = { secs: +(n / SR).toFixed(1), lufs: +(m.lufs + db).toFixed(1), tp: +(truePeak([L, R]) + db).toFixed(1) };
  };
  // the places' ambiences alone, 4 dB up for every excerpt (today's and the proposal's alike): a place's sound sits 4 to 5 dB under its music, quiet alone
  const AMB = 4;
  for (const [p, day] of [['district', 'district-morning'], ['forecourt', 'forecourt-bout'], ['training', 'training-midday'], ['festival', 'festival-afternoon']]) {
    mp3(`${p}-today`, join([cut(read('today', `L-${day}`), 1.5, 17.5), cut(read('today', `L-${p}-night`), 1.5, 17.5)]), AMB);
    mp3(`${p}-day`, cut(read('prop', `L-${day}`), 1.5, 31.5), AMB);
    mp3(`${p}-night`, cut(read('prop', `L-${p}-night`), 1.5, 31.5), AMB);
  }
  mp3('rain-today', cut(read('today', 'W-rain'), 1.5, 17.5), AMB);
  for (const w of ['rain', 'snow', 'wind']) mp3(w, cut(read('prop', `W-${w}`), 1.5, 31.5), AMB);
  mp3('storm', cut(read('prop', 'W-storm'), 1.5, 37.5), AMB);
  mp3('ui-today', read('today', 'U-palette')); mp3('ui-new', read('prop', 'U-palette'));
  mp3('steps-today', read('today', 'S-stone')); mp3('steps-stone', read('prop', 'S-stone')); mp3('steps-earth', read('prop', 'S-earth'));
  mp3('mix-today', join([cut(read('today', 'M-district-morning'), 1.5, 16.5), cut(read('today', 'M-festival-night'), 1.5, 16.5)]));
  mp3('mix-new', join([cut(read('prop', 'M-district-morning'), 1.5, 16.5), cut(read('prop', 'M-festival-night'), 1.5, 16.5)]));
  fs.writeFileSync(path.join(out, 'site-measures.json'), JSON.stringify(measures, null, 1));
  for (const [k, v] of Object.entries(measures)) console.log(k.padEnd(16), JSON.stringify(v));
}
