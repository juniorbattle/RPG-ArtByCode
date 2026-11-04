// The listening sheet of lot S3's sounds (journal Passe SN15): the bank of tools/audio/band/sfx.mjs played by the real engine on the same duels of the bot as the
// layers' sheet (tools/audio/sfx-jobs.page.js), today against the proposal; the levels set first on the engine's own output (the crowd's murmur 5 dB under the
// duel's music, the effects at today's share of the mix), then the excerpts, the palettes (each family's sounds one after another) and their weight in Opus.
//   node tools/audio/sfx-listen.mjs <sfxDir> <outDir> <siteDir> [--duels=<dir with duels.json>] [--today=<a render.mjs dir: its fx- and amb- jobs>]   (FFMPEG or the PATH)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loudness, wavBytes } from './measure.mjs';

const args = process.argv.slice(2), [sfxDir, outDir, siteDir] = args.filter((a) => !a.startsWith('--')).map((p) => path.resolve(p)), opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const here = import.meta.dirname, ROOT = path.resolve(here, '..', '..'), FF = process.env.FFMPEG ?? 'ffmpeg', SR = 48000;
fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(path.join(siteDir, 'audio'), { recursive: true });
if (opt('duels')) fs.copyFileSync(path.join(path.resolve(opt('duels')), 'duels.json'), path.join(outDir, 'duels.json'));
const meta = JSON.parse(fs.readFileSync(path.join(sfxDir, 'sfx.json'), 'utf8')), names = Object.keys(meta);
const ff = (a) => { const r = spawnSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...a], { maxBuffer: 1 << 30 }); if (r.status) throw new Error(String(r.stderr)); return r.stdout; };

// ---- the bank: each file in Opus for the page, and its weight at the bitrates a bake would use
const bank = {}, weight = {};
for (const n of names) {
  const wav = path.join(sfxDir, `${n}.wav`), tmp = path.join(outDir, `${n}.webm`);
  ff(['-i', wav, '-c:a', 'libopus', '-b:a', '160k', tmp]); bank[n] = fs.readFileSync(tmp).toString('base64');
  ff(['-i', wav, '-c:a', 'libopus', '-b:a', n === 'crowd-bed' ? '96k' : '80k', '-map_metadata', '-1', tmp]); weight[n] = fs.statSync(tmp).size;
  fs.rmSync(tmp);
}
fs.writeFileSync(path.join(outDir, 'sfx-jobs.page.js'), `window.__BANK = ${JSON.stringify(bank)};\n${fs.readFileSync(path.join(here, 'sfx-jobs.page.js'), 'utf8')}`);

// ---- the jobs
const duelsFile = path.join(outDir, 'duels.json');
if (!fs.existsSync(duelsFile)) spawnSync(process.execPath, [path.join(here, 'render.mjs'), outDir, '--only=fx-click'], { stdio: 'inherit' });
const duels = JSON.parse(fs.readFileSync(duelsFile, 'utf8')), CAT = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/audio/catalogue.json'), 'utf8')).pieces;
const maxHpOf = (evs) => { const m = {}; for (const e of evs) if (e.type === 'impact' && m[e.to] === undefined) m[e.to] = e.hp + e.damage; return m; };
const tiersOf = (evs) => 1 + Math.max(...evs.filter((e) => e.type === 'chargeTier').map((e) => e.idx));
const job = (name, foe, from, secs, o = {}) => {
  const evs = duels[foe].evs, p = CAT.duel, loop = p.frames / SR, pos = (((from - 0.1 - p.intro.loopAt / SR) % loop) + loop) % loop;
  return { name, secs, scene: { place: 'arena', look: 'night', music: { bout: 'duel', maxHp: maxHpOf(evs) } }, events: evs, from, settle: true, keepKey: 'band:duel', keepPos: pos, tiers: tiersOf(evs), rseed: Math.round(from), ...o };
};
const writeJobs = (list) => fs.writeFileSync(path.join(outDir, 'sfx-jobs.mjs'), `export const jobs = ${JSON.stringify(list)};\n`);
const render = (only) => { const r = spawnSync(process.execPath, [path.join(here, 'render.mjs'), outDir, `--only=${only}`, `--scripts=${path.join(outDir, 'sfx-jobs.mjs')}`], { stdio: 'inherit' }); if (r.status) process.exit(r.status); };
const read = (n) => { const b = fs.readFileSync(path.join(outDir, 'raw', `${n}.f32`)), f = new Float32Array(b.buffer, b.byteOffset, b.length / 4), L = new Float32Array(f.length / 2), R = new Float32Array(f.length / 2); for (let i = 0; i < L.length; i++) { L[i] = f[2 * i]; R[i] = f[2 * i + 1]; } return [L, R]; };
const lufs = (n) => loudness(read(n), SR).lufs;

// ---- pass 1, the levels: the music alone, the crowd's murmur alone, the effects alone, at 0 dB
const W = 60, base = { crowd: true, duck: 'today', fxDb: 0, crowdDb: 0, bedDb: 0, reactDb: 0 };
writeJobs([
  job('C-music', 'marek', W, 40, { stem: 'music' }),
  { ...job('C-bed', 'marek', W, 20, { script: 'sfx', sfx: base, stem: 'fx' }), events: [] },
  job('C-fx', 'marek', W, 40, { script: 'sfx', sfx: { ...base, crowd: false }, stem: 'fx' }),
  job('C-today-fx', 'marek', W, 40, { stem: 'fx' }),
]);
render('C-');
const music = lufs('C-music'), bed = lufs('C-bed'), fxNew = lufs('C-fx'), todayFx = lufs('C-today-fx');
// today's effects and rumble together, less the rumble (measured alone in the analysis renders: as loud as the music, -20.8 against -20.7): the effects' own share
const ambToday = Number(opt('amb') ?? -20.8), musicRef = Number(opt('music') ?? -20.7), todayAmbHere = music + (ambToday - musicRef), fxToday = 10 * Math.log10(Math.max(1e-9, 10 ** (todayFx / 10) - 10 ** (todayAmbHere / 10)));
const set = { ...base, crowdDb: +(music - 5 - bed).toFixed(1), fxDb: +(fxToday - fxNew).toFixed(1) };
console.log({ music, bed, fxNew, todayFx, fxToday, set });

// ---- pass 2, the excerpts: the same 90 s of Marek's duel (from 1:00) as the layers' sheet, the dips under the blows three ways, the K.O. of Orla's duel
const K = duels.orla.res.t, from = Math.floor(K - 16);
writeJobs([
  job('S-duel-today', 'marek', W, 90),
  job('S-duel-new', 'marek', W, 90, { script: 'sfx', sfx: set }),
  job('S-duel-half', 'marek', W, 45, { script: 'sfx', sfx: { ...set, duck: 'half' } }),
  job('S-duel-none', 'marek', W, 45, { script: 'sfx', sfx: { ...set, duck: 'none' } }),
  job('S-duel-crowd', 'marek', W, 45, { script: 'sfx', sfx: set, stem: 'fx', crowdOnly: true }),
  job('S-ko-today', 'orla', from, 24),
  job('S-ko-new', 'orla', from, 24, { script: 'sfx', sfx: set }),
]);
render('S-');

// ---- the files of the sheet
const mp3 = (L, R, name, { fadeOut = 1.5, gainDb = 0 } = {}) => { const wav = path.join(outDir, `${name}.wav`), g = 10 ** (gainDb / 20); fs.writeFileSync(wav, wavBytes([L.map((v) => v * g), R.map((v) => v * g)], SR)); ff(['-i', wav, '-af', `afade=t=out:st=${(L.length / SR - fadeOut).toFixed(2)}:d=${fadeOut}`, '-c:a', 'libmp3lame', '-b:a', '160k', '-map_metadata', '-1', path.join(siteDir, 'audio', `${name}.mp3`)]); fs.rmSync(wav); };
const levels = {};
for (const n of ['S-duel-today', 'S-duel-new', 'S-duel-half', 'S-duel-none', 'S-duel-crowd', 'S-ko-today', 'S-ko-new']) { const [L, R] = read(n); levels[n] = +loudness([L, R], SR).lufs.toFixed(1); mp3(L, R, n.slice(2), { fadeOut: n.startsWith('S-ko') ? 0.8 : 1.5 }); }
// each family's sounds one after another, a pause between, at one level for the family (their own balance kept): what the captions list
const wavRead = (n) => { const b = fs.readFileSync(path.join(sfxDir, `${n}.wav`)), k = (b.length - 44) / 4, L = new Float32Array(k), R = new Float32Array(k); for (let i = 0; i < k; i++) { L[i] = b.readInt16LE(44 + 4 * i) / 32768; R[i] = b.readInt16LE(46 + 4 * i) / 32768; } return [L, R]; };
const FAMILIES = {
  coups: ['light-0', 'light-1', 'light-2', 'heavy', 'm_slash-0', 'm_slash-1', 'm_slash-2', 'm_heavy', 'guard-0', 'guard-1', 'guardHeavy', 'whiff-0', 'whiff-1', 'break'],
  ren: ['t1', 't2', 't3', 't4', 'k_sunder', 'k_feint'],
  rivaux: ['m_ironfall', 'm_lunge', 'm_shoulder', 'm_riposte', 'm_smite', 'm_wild', 'm_cleave'],
  soutiens: ['d1', 'm_bulwark', 'm_brace', 'm_aegis', 'm_hide', 'k_iron', 'k_parry', 's1', 'k_cry', 'k_focus', 'm_resolve', 'm_tempo', 'm_gild', 'm_prayer', 'm_grit', 'm_roar'],
  charge: ['charge1', 'charge2', 'charge3', 'hold1', 'hold2', 'hold3', 'release', 'denied'],
  lecture: ['threat', 'window', 'dodge-0', 'stun', 'pushed'],
  ko: ['ko'],
  foule: ['crowd-oh', 'crowd-gasp', 'crowd-cheer', 'crowd-roar'],
};
const palettes = {};
for (const [fam, list] of Object.entries(FAMILIES)) {
  const parts = list.map(wavRead), gap = Math.round(0.55 * SR), n = parts.reduce((s, [L]) => s + L.length + gap, Math.round(0.3 * SR)), L = new Float32Array(n), R = new Float32Array(n), at = [];
  let p = Math.round(0.3 * SR); parts.forEach(([a, b], i) => { at.push([list[i], +(p / SR).toFixed(1)]); L.set(a, p); R.set(b, p); p += a.length + gap; });
  const m = loudness([L, R], SR).lufs, g = -20 - m; mp3(L, R, `palette-${fam}`, { fadeOut: 0.3, gainDb: g }); palettes[fam] = at;
}
// the crowd's murmur alone, 12 s, at its level against the music's -20.5
{ const [L, R] = wavRead('crowd-bed'); mp3(L.slice(0, 12 * SR), R.slice(0, 12 * SR), 'palette-murmure', { fadeOut: 1, gainDb: -25.5 - loudness([L, R], SR).lufs }); }
// today's sounds, the same way: the engine's effects (render.mjs's fx- jobs, at their output level) and 8 s of its arena rumble
if (opt('today')) {
  const T = path.resolve(opt('today')), raw = (n) => { const b = fs.readFileSync(path.join(T, 'raw', `${n}.f32`)), f = new Float32Array(b.buffer, b.byteOffset, b.length / 4), L = new Float32Array(f.length / 2), R = new Float32Array(f.length / 2); for (let i = 0; i < L.length; i++) { L[i] = f[2 * i]; R[i] = f[2 * i + 1]; } return [L, R]; };
  const trimmed = ([L, R]) => { let a = 0, e = L.length; const pk = Math.max(...L.map(Math.abs)) * 10 ** (-60 / 20); while (a < e && Math.abs(L[a]) < pk) a++; while (e > a && Math.abs(L[e - 1]) < pk) e--; return [L.slice(a, e), R.slice(a, e)]; };
  const list = ['fx-hit', 'fx-heavy', 'fx-guard', 'fx-dodge', 'fx-break', 'fx-tier', 'fx-release', 'fx-denied', 'fx-ko'], parts = list.map((n) => trimmed(raw(n))), gap = Math.round(0.55 * SR);
  const [aL, aR] = raw('amb-arena-night'), amb = [aL.slice(5 * SR, 13 * SR), aR.slice(5 * SR, 13 * SR)];
  const all = [...parts, amb], n = all.reduce((s2, [L]) => s2 + L.length + gap, Math.round(0.3 * SR)), L = new Float32Array(n), R = new Float32Array(n), at = [];
  let q = Math.round(0.3 * SR); all.forEach(([a, b], i) => { at.push([list[i] ?? 'amb-arena', +(q / SR).toFixed(1)]); L.set(a, q); R.set(b, q); q += a.length + gap; });
  mp3(L, R, 'palette-aujourdhui', { fadeOut: 0.5, gainDb: -20 - loudness([L.subarray(0, at[at.length - 1][1] * SR), R.subarray(0, at[at.length - 1][1] * SR)], SR).lufs }); palettes.aujourdhui = at;
}
const kb = (list) => Math.round(list.reduce((s, n) => s + weight[n], 0) / 1024);
fs.writeFileSync(path.join(outDir, 'listen.json'), JSON.stringify({ set, levels, palettes, weight, total: { kb: kb(names), crowd: kb(names.filter((n) => n.startsWith('crowd'))), cues: kb(names.filter((n) => !n.startsWith('crowd'))) } }, null, 1));
console.log({ set, levels, total: { kb: kb(names) } });
