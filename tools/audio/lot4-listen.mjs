// The listening sheet of lot 4 of the duel played by the computer (journal Passe LC6, briefs/fiche-son-lot4.html): the real engine (tools/audio/render.mjs) on the
// duel played by the computer's own events (the arena's replay at its step, render.mjs's duels.json), today against lot 4:
//   - today: the events the arena told before lot 4 (no charge's tier, release or breath; an enchaînement's later blows their action's own sound; no « Skip »'s
//     fade, no ×2 click), lot 4: the events as they are now;
//   - the form of the day's sign (a candidate, src/audio/formCue.ts, computed in the page; tools/audio/lot4-jobs.page.js): the bout's first seconds, Ren in good
//     form and the rival in poor form, then the other way round; each sign alone;
//   - « Skip » near the end of a bout, today and lot 4; ×2, today and lot 4.
// Each excerpt in MP3 for the sheet, its loudness printed. Nothing is baked.
//   node tools/audio/lot4-listen.mjs <outDir> <siteDir> [--duels=<a render.mjs dir with its duels.json>]   (FFMPEG or the PATH)
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { loudness, truePeak } from './measure.mjs';

const args = process.argv.slice(2), [outDir, siteDir] = args.filter((a) => !a.startsWith('--')).map((p) => path.resolve(p)), opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const here = import.meta.dirname, ROOT = path.resolve(here, '..', '..'), FF = process.env.FFMPEG ?? 'ffmpeg', SR = 48000;
fs.mkdirSync(outDir, { recursive: true }); fs.mkdirSync(path.join(siteDir, 'audio'), { recursive: true });
if (opt('duels')) fs.copyFileSync(path.join(path.resolve(opt('duels')), 'duels.json'), path.join(outDir, 'duels.json'));
const duelsFile = path.join(outDir, 'duels.json');
if (!fs.existsSync(duelsFile)) spawnSync(process.execPath, [path.join(here, 'render.mjs'), outDir, '--only=fx-click'], { stdio: 'inherit' });
const duels = JSON.parse(fs.readFileSync(duelsFile, 'utf8')), CAT = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/audio/catalogue.json'), 'utf8')).pieces;
const ff = (a) => { const r = spawnSync(FF, ['-hide_banner', '-loglevel', 'error', '-y', ...a], { maxBuffer: 1 << 30 }); if (r.status) throw new Error(String(r.stderr)); };

// ---- the events: lot 4's as told, today's as the arena told them before lot 4
const LOT4 = new Set(['chargeTier', 'chargeRelease', 'chargeHold', 'skip', 'speed']);
const today = (evs) => evs.filter((e) => !LOT4.has(e.type)).map(({ follow, ...e }) => e);
/** « Skip » at `at`: the curtain's 0.22 s, then the duel's end told under the black (its last blow and the K.O., as AutoReplay.skip tells them); lot 4 tells the skip */
const skipped = (evs, at, lot4) => {
  const end = Math.max(...evs.map((e) => e.t)), koAt = evs.find((e) => e.type === 'ko')?.t ?? end, last = evs.filter((e) => e.t <= koAt + 1e-9 && e.t > at && e.type === 'impact').at(-1);
  const before = evs.filter((e) => e.t <= at), down = at + 0.22;
  const out = [...before, ...(lot4 ? [{ type: 'skip', t: at, secs: 0.22, quiet: false }] : []), ...(last ? [{ ...last, t: down }] : []), { type: 'ko', who: evs.find((e) => e.type === 'ko').who, t: down }];
  return lot4 ? out : today(out);
};
/** ×2 from `at`: the clock runs twice as fast (the events after `at` come at half their distance); lot 4 tells the toggle */
const doubled = (evs, at, lot4) => {
  const out = evs.map((e) => (e.t > at ? { ...e, t: at + (e.t - at) / 2 } : e));
  return lot4 ? [...out, { type: 'speed', t: at, on: true, quiet: false }].sort((a, b) => a.t - b.t) : today(out);
};

const maxHpOf = (evs) => { const m = {}; for (const e of evs) if (e.type === 'impact' && m[e.to] === undefined) m[e.to] = e.hp + e.damage; return m; };
const job = (name, foe, evs, from, secs, o = {}) => {
  const p = CAT[o.piece ?? 'duel'], loop = p.frames / SR, pos = (((from - 0.1 - p.intro.loopAt / SR) % loop) + loop) % loop;
  return { name, secs, scene: { place: 'arena', look: o.look ?? 'night', music: { bout: o.piece ?? 'duel', tiers: duels[foe].res.tiers ?? 5, maxHp: maxHpOf(duels[foe].evs) } }, events: evs, from, settle: true, ...(from > 0 ? { keepKey: `band:${o.piece ?? 'duel'}`, keepPos: pos } : {}), rseed: Math.round(from) + 1, ...o };
};
const M = duels.marek, O = duels.orla, V = duels.vessa;
const jobs = [
  // the bout's first ninety seconds against Marek: the charges, the enchaînements, the music's layers
  job('L-duel-today', 'marek', today(M.evs), 0, 90),
  job('L-duel-lot4', 'marek', M.evs, 0, 90),
  // the form of the day's sign at the start of the bout (lot 4's events): Ren in good form, the rival in poor; then the other way round
  job('L-form-up-down', 'marek', M.evs, 0, 14, { script: 'form', signs: [['ren', 'formUp', 0.35], ['marek', 'formDown', 0.75]] }),
  job('L-form-down-up', 'vessa', V.evs, 0, 14, { script: 'form', signs: [['ren', 'formDown', 0.35], ['marek', 'formUp', 0.75]] }),
  { name: 'L-sign-up', secs: 2, scene: { place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'fx', script: 'form', signs: [['ren', 'formUp', 0.2]], settle: true },
  { name: 'L-sign-down', secs: 2, scene: { place: 'arena', look: 'night', music: { bout: 'duel' } }, stem: 'fx', script: 'form', signs: [['ren', 'formDown', 0.2]], settle: true },
  // « Skip » forty seconds before the end of Orla's bout (won), heard from twelve seconds before it to the jingle
  ...['today', 'lot4'].map((k) => { const at = Math.round(O.res.t - 40); return job(`L-skip-${k}`, 'orla', skipped(O.evs, at, k === 'lot4'), at - 12, 20, { piece: 'rival' }); }),
  // ×2 from the sixtieth second of Vessa's bout, at midday
  ...['today', 'lot4'].map((k) => job(`L-speed-${k}`, 'vessa', doubled(V.evs, 60, k === 'lot4'), 52, 30, { look: 'midday' })),
];
fs.writeFileSync(path.join(outDir, 'lot4-jobs.mjs'), `export const jobs = ${JSON.stringify(jobs)};\n`);
fs.copyFileSync(path.join(here, 'lot4-jobs.page.js'), path.join(outDir, 'lot4-jobs.page.js'));
const r = spawnSync(process.execPath, [path.join(here, 'render.mjs'), outDir, '--only=L-', `--scripts=${path.join(outDir, 'lot4-jobs.mjs')}`], { stdio: 'inherit' });
if (r.status) process.exit(r.status);

// ---- the excerpts: each in MP3, as rendered (the same engine and settings: today's and lot 4's at their own level), a fade at the end
const read = (n) => { const b = fs.readFileSync(path.join(outDir, 'raw', `${n}.f32`)), f = new Float32Array(b.buffer, b.byteOffset, b.length / 4), L = new Float32Array(f.length / 2), R = new Float32Array(f.length / 2); for (let i = 0; i < L.length; i++) { L[i] = f[2 * i]; R[i] = f[2 * i + 1]; } return [L, R]; };
const out = {};
for (const j of jobs) {
  const c = read(j.name), lu = loudness(c, SR), raw = path.join(outDir, 'raw', `${j.name}.f32`), mp3 = path.join(siteDir, 'audio', `${j.name}.mp3`);
  ff(['-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', raw, '-af', `afade=t=out:st=${Math.max(0, j.secs - 1.5)}:d=1.5`, '-c:a', 'libmp3lame', '-b:a', '160k', mp3]);
  out[j.name] = { secs: j.secs, lufs: +lu.lufs.toFixed(1), tp: +truePeak(c).toFixed(1), kb: Math.round(fs.statSync(mp3).size / 1024) };
  console.log(j.name.padEnd(18), `${out[j.name].lufs} LUFS`, `${out[j.name].tp} dBTP`, `${out[j.name].kb} KB`);
}
fs.writeFileSync(path.join(siteDir, 'audio', 'lot4-listen.json'), JSON.stringify({ duels: Object.fromEntries(Object.entries(duels).map(([k, d]) => [k, d.res])), excerpts: out }, null, 1));
