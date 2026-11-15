// The town's quests and the events' answer played in a browser (journal Passe QE2; the operator's sheet https://claude.ai/artifact/9QYryPbxZZo5Dx456KJJJD: Q-01 to Q-10):
// a version 2 game built in Node by the game's own actions (a named state of src/simulation/named.ts), kept in the browser's save, its pages opened from it, every step
// taken through the page's interface (`__ui.run`, `__ui.openPerson`, as a player does), what the page shows read in its DOM; Node replays the browser's actions and must
// find the same fingerprint.
//   cargo:     the first morning on the quay: the list's preview says Tam's quest by its name, Tam's dialogue offers it, Sergeant Hale's release, the crate hauled, the
//              journal's « In progress » page with the next step, Bram's temper: the Wyrmsteel's Attack +1 on top of the forge's tiers (Node's own number), the page saying
//              the quest done;
//   sharps:    day 2's evening on the festival square: Lio's dialogue offers his quest, the sharps paid off, then the eve of day 4's bout: the news card with Lio's word,
//              the opponent's plan known (the second tier of the scouting);
//   encounter: the same square, the card sharps' event struck in Node (5 coins taken): the page asks its answer once the news are read, « refuse » gives the coins back.
//   node tools/quest-flow.mjs <outDir> <cargo|sharps|encounter>   (BASE_URL: a DEV server, 5173 by default; PAGE_LANG=fr the texts checked against the French table;
//   REDUCED=1 the game's reduced motion; MOTION=reduce the system's, which the game ignores; W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/play-flow.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, kind] = process.argv.slice(2);
if (!outDir || !['cargo', 'sharps', 'encounter'].includes(kind)) throw new Error('usage: node tools/quest-flow.mjs <outDir> <cargo|sharps|encounter>');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
const LANG = process.env.PAGE_LANG === 'fr' ? 'fr' : 'en';
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const G = await server.ssrLoadModule('/src/simulation/index.ts');
const VG = await server.ssrLoadModule('/src/simulation/v2gear.ts');
const Q = await server.ssrLoadModule('/src/simulation/v2quests.ts');
const SC = await server.ssrLoadModule('/src/simulation/v2scout.ts');
const ENG = await server.ssrLoadModule('/src/events/engine.ts');
const { V2_EVENTS } = await server.ssrLoadModule('/src/events/v2catalog.ts');
const { computePulse } = await server.ssrLoadModule('/src/tournament/pulse.ts');
const T = await server.ssrLoadModule('/src/narrative/text/index.ts');
if (LANG === 'fr') T.useLanguage('fr', (await server.ssrLoadModule('/src/narrative/text/fr-texts.ts')).FR_TEXTS);
const tx = T.tx;
// the starting state, built in Node by the game's own actions
let s0 = G.namedState(kind === 'cargo' ? 'v2-day1-morning' : 'v2-quest-sharps');
if (kind === 'encounter') {
  // the card sharps strike where the player is (GP-10, Q-08), their chance passed: the state the game writes at the evening's end, the next morning on the square
  s0 = G.advance(s0, { type: 'talk', who: 'lio' }).state;
  s0.flags['pulse:festivity'] = 100; s0.flags['pulse:security'] = -100;
  const lucky = { fork: () => ({ next: () => 0, fork: () => lucky.fork() }) };
  ENG.runEvents(s0, computePulse(s0), () => ({}), lucky, V2_EVENTS.filter((e) => e.id === 'v2-card-sharps'));
  s0.log.push({ seq: s0.log.length, day: s0.day, slot: s0.slot, kind: 'event', id: 'v2-card-sharps', cause: 'a festive night and a thin watch', text: 'A friendly game by the stage turns out to be played with marked cards: the sharp holds out his hand for your 5 coins.', visible: true });
}
const saved = G.serialize(s0);
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const errors = [], done = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  if (process.env.MOTION) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: process.env.MOTION }]);
  await page.goto(`${BASE}?vis=0`, { waitUntil: 'domcontentloaded', timeout: READY });
  await page.evaluate((t, reduced) => {
    localStorage.setItem('cite-du-tournoi.save', t);
    // the game's own reduced motion (RG-5), stored as a player sets it
    if (reduced) { const k = 'cite-du-tournoi.settings', s = JSON.parse(localStorage.getItem(k) ?? '{}'); s.reducedMotion = true; localStorage.setItem(k, JSON.stringify(s)); }
  }, saved, !!process.env.REDUCED);
  const open = async (q) => { await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); const e = await page.evaluate(() => window.__error ?? null); check(!e, `page ${q} ready${e ? `: ${e}` : ''}`);
    await page.waitForFunction(() => { const l = document.querySelector('#loading'); return !l || +getComputedStyle(l).opacity === 0; }, { timeout: 10000 }).catch(() => {}); };
  const q = `?play=1&vis=0&noreload=1&lang=${LANG}`;
  /** a page of the game: its news card's text, read and closed */
  const openTown = async () => { await open(q); await sleep(400); const news = await page.evaluate(() => document.querySelector('.pm-overlay')?.textContent ?? ''); await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click()); await sleep(300); return news; };
  const run = async (a) => { const r = await page.evaluate((x) => window.__ui.run(x), a); check(r.ok, `run ${JSON.stringify(a).slice(0, 70)}${r.ok ? '' : `: ${r.reason}`}`); if (r.ok) done.push(a); return r; };
  const talk = async (who) => { const t = await page.evaluate((w) => { window.__ui.openPerson(w); return document.querySelector('.pm-talk')?.textContent ?? ''; }, who); done.push({ type: 'talk', who }); return t; };
  const closeBand = async () => { await page.keyboard.press('Escape'); await sleep(250); };
  const journal = async () => { const t = await page.evaluate(() => { window.__ui.openJournal(); return document.querySelector('.pm-days')?.textContent ?? ''; }); return t; };
  const state = () => page.evaluate(() => window.__game.state());

  if (kind === 'cargo') {
    await openTown();
    await page.waitForFunction(() => window.__ui.todo?.state().shown, { timeout: 8000 }).catch(() => {});
    const cue = await page.evaluate(() => window.__ui.todo?.state() ?? null);
    const wantLine = tx('ui.todo.who', { name: 'Tam', kind: tx('ui.what.quest', { quest: tx('v2.quest.cargo.title') }) });
    check(!!cue && cue.lines.some((l) => l.includes(wantLine)), `the list's preview says Tam's quest by its name: ${JSON.stringify(cue?.lines)}`);
    await page.screenshot({ path: path.join(outDir, 'cargo-0-todo.png') });
    const t = await talk('tam');
    check(t.includes(tx('v2.quest.cargo.offer').slice(0, 40)), `Tam's dialogue offers the quest: ${JSON.stringify(t.slice(0, 200))}`);
    await page.screenshot({ path: path.join(outDir, 'cargo-1-tam.png') });
    await closeBand();
    await run({ type: 'askPapers' });
    await run({ type: 'haul' }); await openTown();
    const j = await journal();
    check(j.includes(tx('ui.quests.title')) && j.includes(tx('v2.quest.cargo.step.temper', { price: 10 })), `the « In progress » page: the next step, Bram's temper: ${JSON.stringify(j.slice(0, 260))}`);
    await page.screenshot({ path: path.join(outDir, 'cargo-2-journal.png') });
    await closeBand();
    const before = VG.v2Stats(await state()).atk;
    await run({ type: 'temper' }); await openTown();
    const after = await state();
    check(after.quests.cargo === 'done' && VG.v2Stats(after).atk - before === Q.QUEST.wyrmAtk, `the Wyrmsteel: Attack +${VG.v2Stats(after).atk - before} on top of the forge's tiers`);
    // no quest open: the journal opens on the last day (Q-07); its « In progress » row says the quest done
    await journal();
    check(await page.evaluate(() => document.querySelector('.pm-days .pm-btn.on')?.dataset.quests !== '1'), 'no quest open: the journal opens on the last day');
    const j2 = await page.evaluate(() => { document.querySelector('.pm-days [data-quests]')?.focus(); return document.querySelector('.pm-days')?.textContent ?? ''; });
    check(j2.includes(tx('ui.quests.done')), `the page says the quest done: ${JSON.stringify(j2.slice(0, 200))}`);
    await page.screenshot({ path: path.join(outDir, 'cargo-3-done.png') });
    await closeBand();
  }
  if (kind === 'sharps') {
    await openTown();
    const t = await talk('lio');
    check(t.includes(tx('v2.quest.sharps.offer').slice(0, 40)), `Lio's dialogue offers the quest: ${JSON.stringify(t.slice(0, 200))}`);
    await page.screenshot({ path: path.join(outDir, 'sharps-0-lio.png') });
    await closeBand();
    await run({ type: 'faceSharps', how: 'pay' }); await openTown();
    check((await state()).facts.includes('sharps-gone'), 'the card sharps gone');
    await run({ type: 'wait' }); await openTown();
    await run({ type: 'wait' }); await openTown();
    await run({ type: 'wait' }); const news = await openTown();
    const st = await state(), foe = st.tournament.matches.find((m) => m.day === 4 && (m.a === 'player' || m.b === 'player')), id = foe.a === 'player' ? foe.b : foe.a;
    const name = (await server.ssrLoadModule('/src/narrative/roster.ts')).RIVALS[id].name;
    check(news.includes(tx('v2.quest.sharps.word', { name })), `the news card of day 4's morning: Lio's word: ${JSON.stringify(news.slice(0, 300))}`);
    check(SC.scoutTier(st, id) === 2, `${id}'s plan known (the second tier)`);
    await page.screenshot({ path: path.join(outDir, 'sharps-1-word.png') });
  }
  if (kind === 'encounter') {
    await open(q); await sleep(400);
    await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
    await page.waitForFunction(() => !!document.querySelector('.pm-talk[data-encounter]'), { timeout: 8000 }).catch(() => {});
    const band = await page.evaluate(() => { const r = document.querySelector('.pm-talk[data-encounter]'); return r ? { text: r.textContent, buttons: [...r.querySelectorAll('.opts .pm-btn')].map((x) => x.textContent) } : null; });
    check(!!band && band.text.includes(tx('v2.encounter.title')) && band.buttons.length === 2, `the answer asked once the news are read: ${JSON.stringify(band)}`);
    // the band rises as the dialogue's does: a fade, its 8 px slide scaled by --ds-move, none under the game's reduced motion whatever the system says (RG-5)
    const fx = await page.evaluate(() => ({ reduced: document.documentElement.classList.contains('cdt-reduced'), move: getComputedStyle(document.documentElement).getPropertyValue('--ds-move').trim() }));
    check(fx.reduced === !!process.env.REDUCED && (fx.reduced ? fx.move === '0' : fx.move !== '0'), `the game's reduced motion ${fx.reduced ? 'on' : 'off'} (the system's ${process.env.MOTION ?? 'as headless Chrome reports it'}), --ds-move ${JSON.stringify(fx.move)}`);
    await page.screenshot({ path: path.join(outDir, 'encounter-0-band.png') });
    const c0 = (await state()).player.coins;
    await page.evaluate(() => [...document.querySelectorAll('.pm-talk[data-encounter] .opts .pm-btn')][1].click());
    done.push({ type: 'answer', how: 'refuse' });
    await sleep(400);
    const st = await state();
    check(st.player.coins === c0 + 5 && !st.v2.encounter, `refused: the 5 coins back (${c0} → ${st.player.coins})`);
    const toast = await page.evaluate(() => document.querySelector('#pm-toast')?.textContent ?? '');
    check(toast.includes(tx('v2.encounter.sharps.refuseLog', { n: 5 }).slice(0, 30)), `its words in the bandeau: ${JSON.stringify(toast.slice(0, 160))}`);
    await page.screenshot({ path: path.join(outDir, 'encounter-1-refused.png') });
  }
  const h = await page.evaluate(() => window.__game.hash());
  let s = G.deserialize(saved);
  for (const a of done) { const r = G.advance(s, a); if (!r.ok) check(false, `Node refuses ${a.type}: ${r.reason}`); s = r.state; }
  check(G.hash(s) === h, `Node replay ${G.hash(s)} = browser ${h} (${done.length} actions)`);
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); await server.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
