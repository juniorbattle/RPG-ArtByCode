// Lot L4 of step 5 played in a browser (journal Passe EVL7; the operator's EV-9 « Chaque rival se souvient ; deux autres agissent », EV-7 and EV-8, journal Passe
// EV2): a version 2 game built in Node by the game's own actions (the named states of src/simulation/named.ts), kept in the browser's save, the town's pages opened
// from it, every step taken through the page's interface (`__ui.run`, as a player does), what the page shows read in its DOM; Node replays the browser's actions
// and must find the same fingerprint.
//   tale: Vessa Lark beaten on day 2 (seed 1842), day 3's afternoon on the festival square: the taverns' tale of Orla in the journal, Brother Ambrose's word, the
//         board's memory and what the town saw, Vessa told to her face on the forecourt, the board again;
//   sand: Rhosk out of the title (seed 6), day 9's morning: the training sand refused with its reason, Sergeant Brann's words, Sergeant Hale told on the quay, the
//         sand drilled on.
//   node tools/rivals-flow.mjs <outDir> <tale|sand>   (BASE_URL: a DEV server, 5173 by default; W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/play-flow.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, kind] = process.argv.slice(2);
if (!outDir || !['tale', 'sand'].includes(kind)) throw new Error('usage: node tools/rivals-flow.mjs <outDir> <tale|sand>');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const G = await server.ssrLoadModule('/src/simulation/index.ts');
const s0 = G.namedState(kind === 'tale' ? 'v2-tale-day3' : 'v2-sand-day9');
const saved = G.serialize(s0);
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const errors = [], done = [];
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  await page.goto(`${BASE}?vis=0`, { waitUntil: 'domcontentloaded', timeout: READY });
  await page.evaluate((t) => localStorage.setItem('cite-du-tournoi.save', t), saved);
  const open = async (q) => { await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); const e = await page.evaluate(() => window.__error ?? null); check(!e, `page ${q} ready${e ? `: ${e}` : ''}`);
    // the loading screen's 0.8 s fade gone before anything is read or captured (journal Passes FV4, GA2)
    await page.waitForFunction(() => { const l = document.querySelector('#loading'); return !l || +getComputedStyle(l).opacity === 0; }, { timeout: 10000 }).catch(() => {}); };
  // a town page: its news read and closed (the text kept for the checks)
  const openTown = async () => { await open('?play=1&vis=0&noreload=1'); const news = await page.evaluate(() => { const o = document.querySelector('.pm-overlay'); const t = o?.textContent ?? ''; o?.querySelector('.pm-btn')?.click(); return t; }); return news; };
  const run = async (a) => { const r = await page.evaluate((x) => window.__ui.run(x), a); check(r.ok, `run ${JSON.stringify(a).slice(0, 70)}${r.ok ? '' : `: ${r.reason}`}`); if (r.ok) done.push(a); return r; };
  // a person's band: their words, their options, and the news an action left in it
  const talk = async (who) => { const t = await page.evaluate((w) => { window.__ui.openPerson(w); return document.querySelector('.pm-talk')?.textContent ?? ''; }, who); done.push({ type: 'talk', who }); return t; };
  // an action taken in a person's band leaves its news in the band that opens next: the person's own again, as a click on its option does (src/ui/townUi.ts)
  const band = (who) => talk(who);
  const closeBand = () => page.keyboard.press('Escape');
  // the board (T) on a fighter, by their row
  const board = async (name) => {
    await page.keyboard.press('t');
    await page.waitForSelector('.pm-two .pm-detail', { timeout: 20000 }).catch(() => {});
    await page.evaluate((n) => { const r = [...document.querySelectorAll('.pm-two button, .pm-two .pm-btn')].find((x) => x.textContent.includes(n)); r?.focus(); r?.click(); }, name);
    const t = await page.evaluate(() => document.querySelector('.pm-two .pm-detail')?.textContent ?? '');
    return t;
  };

  if (kind === 'tale') {
    await openTown();
    // the journal (J) holds the taverns' word of this morning, its cause without a name
    const told = await page.evaluate(() => window.__game.state().log.filter((e) => e.id === 'v2-tavern-tale' && e.visible).map((e) => ({ day: e.day, slot: e.slot, text: e.text, cause: e.cause })));
    check(told.length === 1 && told[0].day === 3 && /Orla Brask is nursing a wound, and is still rusty/.test(told[0].text) && !/Vessa/.test(told[0].cause), `the taverns' word in the journal: ${JSON.stringify(told[0])}`);
    await page.keyboard.press('j');
    await page.waitForSelector('.pm-days .pm-detail', { timeout: 20000 }).catch(() => {});
    const j = await page.evaluate(() => document.querySelector('.pm-days .pm-detail')?.textContent ?? '');
    check(/In the taverns they say Orla Brask is nursing a wound/.test(j), 'the journal page shows it');
    await page.screenshot({ path: path.join(outDir, 'tale-0-journal.png') });
    await page.keyboard.press('Escape');
    // the board on Vessa: her grudge and its cause, and the rounds the town saw her pay
    const bv = await board('Vessa Lark');
    check(/Vessa Lark holds a grudge: beaten by you on day 2\./.test(bv), `the board: ${JSON.stringify(bv.match(/Vessa Lark holds[^.]*\./)?.[0] ?? '')}`);
    check(/paid for every round at Lio's/.test(bv), `the board: ${JSON.stringify(bv.match(/(Seen|Not seen) in town[^.]*\./)?.[0] ?? '')}`);
    await page.screenshot({ path: path.join(outDir, 'tale-1-board.png') });
    await page.keyboard.press('Escape');
    // Brother Ambrose saw her pay the rounds
    const amb = await talk('ambrose');
    check(/Vessa Lark bought every round at Lio's/.test(amb) && /Brother Ambrose saw Vessa Lark pay every round/.test(amb), `Ambrose's words and his news in the band: ${JSON.stringify(amb.slice(0, 160))}`);
    await page.screenshot({ path: path.join(outDir, 'tale-2-ambrose.png') });
    await closeBand();
    // to the forecourt: Vessa, by day, told to her face
    await run({ type: 'move', to: 'forecourt' });
    await openTown();
    const v = await talk('vessa');
    check(/Tell Vessa Lark, before the forecourt, what she paid Lio's room to say/.test(v), 'the confrontation offered in her band');
    await run({ type: 'confrontVessa' });
    const said = await band('vessa');
    check(/Before the forecourt's crowd you tell Vessa Lark what she paid Lio's room to say of Orla Brask/.test(said), `its news in the band: ${JSON.stringify(said.slice(0, 160))}`);
    await page.screenshot({ path: path.join(outDir, 'tale-3-confront.png') });
    await closeBand();
    const bv2 = await board('Vessa Lark');
    check(/Vessa Lark holds a grudge: beaten by you on day 2 and shamed by you before the forecourt\./.test(bv2), `the board after: ${JSON.stringify(bv2.match(/Vessa Lark holds[^.]*\./)?.[0] ?? '')}`);
    await page.screenshot({ path: path.join(outDir, 'tale-4-board.png') });
    await page.keyboard.press('Escape');
  } else {
    const news = await openTown();
    check(s0.log.some((e) => e.id === 'v2-rhosk-offer' && e.day === 8 && e.visible), 'Corra\'s word on the quay at dusk, day 8, in the news');
    await run({ type: 'move', to: 'training' });
    await openTown();
    const why = await page.evaluate(() => { window.__ui.openHere(); const x = [...document.querySelectorAll('.pm-talk .pm-btn')].find((e) => /Train/.test(e.textContent)); return { off: !!x?.disabled, text: x?.textContent ?? '' }; });
    check(why.off && /Rhosk the Northman stands on the sand you drill on/.test(why.text), `the drill refused, its reason said: ${JSON.stringify(why.text.slice(0, 160))}`);
    await page.screenshot({ path: path.join(outDir, 'sand-0-refused.png') });
    await closeBand();
    const br = await talk('drill');
    check(/The Northman has taken my sand since dawn/.test(br), 'Sergeant Brann\'s words');
    await closeBand();
    await run({ type: 'move', to: 'district' });
    await openTown();
    const hale = await talk('hale');
    check(/Rhosk means to bar the training sand to you/.test(hale) && /Tell Sergeant Hale that Rhosk means to bar the training sand/.test(hale), 'Hale\'s words and the report offered');
    await run({ type: 'reportRhosk' });
    const said = await band('hale');
    check(/Sergeant Hale sends a runner to Clerk Odo/.test(said), `its news in the band: ${JSON.stringify(said.slice(0, 160))}`);
    await page.screenshot({ path: path.join(outDir, 'sand-1-hale.png') });
    await closeBand();
    await run({ type: 'move', to: 'training' });
    await openTown();
    const r = await run({ type: 'train' });
    check(r.ok && !!r.reload, 'the sand drilled on: the slot spent');
    await openTown();
    const st = await page.evaluate(() => window.__game.state());
    check(st.player.training >= 1 && st.slot === 'afternoon', `trained (${st.player.training}), day ${st.day} ${st.slot}`);
    await page.screenshot({ path: path.join(outDir, 'sand-2-trained.png') });
  }
  const h = await page.evaluate(() => window.__game.hash());
  let s = G.deserialize(saved);
  for (const a of done) { const r = G.advance(s, a); if (!r.ok) check(false, `Node refuses ${a.type}: ${r.reason}`); s = r.state; }
  check(G.hash(s) === h, `Node replay ${G.hash(s)} = browser ${h} (${done.length} actions)`);
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); await server.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
