// Renders the real sound engine offline (journal Passes SN1 / SN2): src/audio/ bundled as it stands, driven in a headless page on a virtual clock
// (tools/audio/harness.js), the effects, every ambience, the music and whole duels of the bot; written as raw float files for
// tools/audio/analyse.mjs. No GPU, no game page, no real time: 1 s of sound in a few ms.
//   node tools/audio/render.mjs <outDir> [--root=<folder>] [--only=<a,b>] [--scripts=<file.js>] [--duels=charge]
// --root: a frozen copy of the repository to render instead of this one (`git -c core.autocrlf=false archive <commit>`): its events come from the
// same duels, so two renders compare. --only: jobs whose name holds one of the words. CHROME_PATH as the other tools.
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { build, createServer } from 'vite';

const args = process.argv.slice(2), out = path.resolve(args.find((a) => !a.startsWith('--')) ?? 'out-audio');
const opt = (k) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const here = import.meta.dirname, ROOT = path.resolve(here, '..', '..'), root = path.resolve(opt('root') ?? ROOT), only = opt('only')?.split(',');
fs.mkdirSync(out, { recursive: true });

// ---- the engine, bundled from the chosen root
const entry = path.join(out, 'entry.gen.ts');
// the duel's sounds' levels (lot S3) and lot 4's candidate of the form's sign (src/audio/formCue.ts, journal Passe LC6) where the root has them: the listening
// tools' pages read them
const extraOf = (f) => (fs.existsSync(path.join(root, f)) ? `export * from '${root.replaceAll('\\', '/')}/${f.replace(/\.ts$/, '')}';\n` : '');
fs.writeFileSync(entry, `export { Sound } from '${root.replaceAll('\\', '/')}/src/audio/Sound';\nexport * from '${root.replaceAll('\\', '/')}/src/audio/score';\n${extraOf('src/audio/sfx.ts')}${extraOf('src/audio/formCue.ts')}`);
await build({ root, configFile: false, logLevel: 'error', cacheDir: path.join(out, '.vite'), publicDir: false,
  build: { write: true, outDir: path.join(out, 'bundle'), emptyOutDir: true, minify: false, lib: { entry, formats: ['iife'], name: 'AUD', fileName: () => 'audio.js' } } });

// ---- three whole duels, their events kept (the same for both roots: this repository's simulation). Since lot 4 of the duel played by the computer (journal Passe
// LC6) they are that duel's, the game's: the arena's replay of its script at the arena's step (src/arena/autoView.ts), every event it tells with its time, Ren of a
// new game against the pool's Marek, Vessa and Orla (the arena's own page); `res.tiers` the charge's ladder its sounds count. `--duels=charge`: the three-button duel
// of before, its bot's (lot 5 retires it)
const duelsFile = path.join(out, 'duels.json');
if (!fs.existsSync(duelsFile)) {
  const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: path.join(out, '.vite-ssr'), server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
  const duels = {};
  if (opt('duels') === 'charge') {
    const V = await server.ssrLoadModule('/src/combat/v2duel.ts'), B = await server.ssrLoadModule('/src/combat/bot.ts'), C = await server.ssrLoadModule('/src/combat/charge.ts');
    for (const [foe, skill, seed] of [['marek', 0.6, 3], ['vessa', 0.6, 5], ['orla', 0.75, 7]]) {
      const evs = [], od = C.ChargedDuel.prototype.drain;
      C.ChargedDuel.prototype.drain = function () { const r = od.call(this); for (const e of r) evs.push({ t: +this.sim.t.toFixed(3), ...e }); return r; };
      const d = V.v2DuelData(foe, { seed: 3000 + seed, playerName: 'Ren', opponentName: foe }), res = B.runV2BotDuel(d.data, d.tiers, { skill, seed: 40 + seed });
      C.ChargedDuel.prototype.drain = od;
      duels[foe] = { res: { ...res, tiers: d.tiers.length }, evs };
      console.log(foe, 'winner', res.winner, 't', res.t, 'events', evs.length);
    }
  } else {
    const AV = await server.ssrLoadModule('/src/arena/autoView.ts');
    for (const [foe, seed] of [['marek', 3], ['vessa', 5], ['orla', 7]]) {
      const d = AV.sceneAutoDuel(foe, 3000 + seed), rp = new AV.AutoReplay(d.result, { ren: d.ren, marek: d.foe }), evs = rp.drain().map((e) => ({ ...e, t: 0 }));
      for (let i = 0; i < 1e6 && !rp.over; i++) { rp.step(); for (const e of rp.drain()) evs.push({ ...e, t: +(e.t ?? rp.t).toFixed(3) }); }
      const res = { winner: rp.winner === 'ren' ? 'ren' : 'marek', t: d.result.t, tiers: rp.tiers };
      duels[foe] = { res, evs };
      console.log(foe, 'winner', res.winner, 't', res.t, 'events', evs.length);
    }
  }
  fs.writeFileSync(duelsFile, JSON.stringify(duels));
  await server.close();
}
const duels = JSON.parse(fs.readFileSync(duelsFile, 'utf8'));

// ---- the jobs
const LOOKS = ['morning', 'midday', 'afternoon', 'night'], PLACES = ['district', 'forecourt', 'training', 'festival', 'arena'];
const EFFECTS = ['hit', 'heavy', 'guard', 'dodge', 'tier', 'release', 'ko', 'break', 'click', 'open', 'coin', 'step', 'denied'];
const jobs = [];
for (const e of EFFECTS) jobs.push({ name: `fx-${e}`, secs: 2, effect: e, settings: { volume: 1, music: 0.5 } });
for (const p of PLACES) for (const l of LOOKS) jobs.push({ name: `amb-${p}-${l}`, secs: 45, scene: { place: p, look: l }, stem: 'fx' });
// each place's piece of the band at each hour (journal Passe SN10: the plan of src/audio/plan.ts), the music bus alone
for (const p of PLACES.slice(0, 4)) for (const l of LOOKS) jobs.push({ name: `mus-${p}-${l}`, secs: 60, scene: { place: p, look: l }, stem: 'music' });
for (const piece of ['duel', 'rival', 'finale']) jobs.push({ name: `mus-arena-${piece}`, secs: 60, scene: { place: 'arena', look: 'night', music: { bout: piece } }, stem: 'music' });
for (const p of PLACES.slice(0, 4)) for (const l of LOOKS) jobs.push({ name: `mix-${p}-${l}`, secs: 45, scene: { place: p, look: l } });
jobs.push({ name: 'mix-forecourt-midday-bout', secs: 45, scene: { place: 'forecourt', look: 'midday', bout: true } });
// the weather over a page (lot S2, journal Passe SN19): the rainy day at midday, a storm at night with four flashes, the storm at full volume for the ceiling
const STORM = { place: 'district', look: 'night', weather: { rain: 0.85, snow: 0, storm: 1, wind: 2 } }, FLASHES = [{ t: 3, level: 1.3 }, { t: 12, level: 0.55 }, { t: 21, level: 0.95 }, { t: 30, level: 0.3 }];
jobs.push({ name: 'wx-rain-district-midday', secs: 45, scene: { place: 'district', look: 'midday', weather: { rain: 0.6, snow: 0, storm: 0, wind: 1 } }, settle: true });
jobs.push({ name: 'wx-storm-district-night', secs: 40, scene: STORM, flashes: FLASHES, settle: true });
jobs.push({ name: 'wx-storm-vol1', secs: 40, scene: STORM, flashes: FLASHES, settings: { volume: 1 }, settle: true });
const tiers = (foe) => duels[foe].res.tiers ?? 6;
jobs.push({ name: 'duel-marek-night', secs: 150, scene: { place: 'arena', look: 'night', music: { tiers: tiers('marek') } }, events: duels.marek.evs, settle: true });
jobs.push({ name: 'duel-vessa-midday', secs: 120, scene: { place: 'arena', look: 'midday', music: { bout: 'rival', tiers: tiers('vessa') } }, events: duels.vessa.evs, settle: true });
// the end of a duel at full volume: its densest blows and the K.O., for the ceiling
jobs.push({ name: 'duel-marek-vol1', secs: 150, from: Math.max(0, duels.marek.res.t - 145), scene: { place: 'arena', look: 'night', music: { bout: 'finale', tiers: tiers('marek') } }, events: duels.marek.evs, settings: { volume: 1 }, settle: true });
const scripts = opt('scripts'), extra = scripts ? (await import(`file://${path.resolve(scripts).replaceAll('\\', '/')}`)).jobs : [];
const list = [...jobs, ...extra].filter((j) => !only || only.some((w) => j.name.includes(w)));

// ---- the page: an origin of its own, so the engine's storage works as in the game
const page0 = '<!doctype html><title>audio</title>', server = http.createServer((_, r) => { r.setHeader('content-type', 'text/html'); r.end(page0); });
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium'].filter(Boolean).find((p) => fs.existsSync(p));
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--no-sandbox', '--disable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], protocolTimeout: 1200000 });
const page = await b.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR', e.message));
page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
const parts = {};
await page.exposeFunction('__chunk', (name, b64) => { (parts[name] ??= []).push(Buffer.from(b64, 'base64')); });
await page.goto(`http://127.0.0.1:${server.address().port}/`);
await page.addScriptTag({ content: fs.readFileSync(path.join(out, 'bundle', 'audio.js'), 'utf8').replace(/\bvar AUD\b/, 'window.AUD') });
await page.addScriptTag({ content: fs.readFileSync(path.join(here, 'harness.js'), 'utf8') });
if (scripts) await page.addScriptTag({ content: fs.readFileSync(path.resolve(scripts).replace(/\.mjs$/, '.page.js'), 'utf8') });
const raw = path.join(out, 'raw'); fs.mkdirSync(raw, { recursive: true });
const metaFile = path.join(out, 'meta.json'), meta = fs.existsSync(metaFile) ? JSON.parse(fs.readFileSync(metaFile, 'utf8')) : {};
for (const j of list) {
  const r = await page.evaluate((job) => window.renderJob(job), j);
  fs.writeFileSync(path.join(raw, `${j.name}.f32`), Buffer.concat(parts[j.name])); delete parts[j.name];
  meta[j.name] = { ...r, secs: j.secs };
  console.log(j.name, `${Math.round(r.ms)} ms`, `${(j.secs * 1000 / Math.max(1, r.ms)).toFixed(0)} x`);
}
fs.writeFileSync(metaFile, JSON.stringify(meta));
await b.close(); server.close();
