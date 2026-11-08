// Lot L6 of step 5, the festival of day 9 played in a browser (journal Passe EVL11; the operator's EV-14 and the festival's sheet, FE-1 « La Lanterne de Tête »
// ... FE-9 « une partie jouée dans le navigateur jusqu’à la parade, rejouée en Node »): a version 2 game on day 9's morning on the festival square (the named state
// `v2-festival-day9`, every bout won), kept in the browser's save, every step taken through the page's interface (`__ui.run`, as a player does), what the page shows
// read in its DOM and its scene; Node replays the browser's actions and must find the same fingerprint.
//   lead:   Kell Barrow's word (whom his lantern walks behind, what would change it), a round at Lio's and the hall's lanterns hung (each label saying what it brings),
//           Wren telling the custom in the afternoon, the tournament's page (T) listing the player's lanterns and their reasons, Brother Ambrose's flame carried; at dusk
//           the parade's order set; the evening's scene played live (`&cutscene=1`): the eve's two lines, Wren calling the order, the hero walking to the hall's stage,
//           Wren's verse; then the way to the forecourt shut (its tag says why, walking into it goes nowhere) and the quay's open;
//   behind: the same good turns, then Orla told on the training ground that the player walks in her cortege; at dusk Orla opens the parade with the player's lanterns;
//           the evening's scene: Orla walking to the hall's stage, Wren's verse for both; the tournament's page saying the gift.
//   node tools/festival-flow.mjs <outDir> <lead|behind>   (BASE_URL: a DEV server, 5173 by default; W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/play-flow.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, kind] = process.argv.slice(2);
if (!outDir || !['lead', 'behind'].includes(kind)) throw new Error('usage: node tools/festival-flow.mjs <outDir> <lead|behind>');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const G = await server.ssrLoadModule('/src/simulation/index.ts');
const F = await server.ssrLoadModule('/src/simulation/v2festival.ts');
const S = await server.ssrLoadModule('/src/narrative/v2story.ts');
const { tx } = await server.ssrLoadModule('/src/narrative/text/index.ts');
const s0 = G.namedState('v2-festival-day9');
// a purse for the round at Lio's (the named state's own purse, topped up to 40 coins: the replay starts from the same save)
s0.player.coins = Math.max(s0.player.coins, 40);
const saved = G.serialize(s0);
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const errors = [], done = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  await page.goto(`${BASE}?vis=0`, { waitUntil: 'domcontentloaded', timeout: READY });
  await page.evaluate((t) => localStorage.setItem('cite-du-tournoi.save', t), saved);
  const open = async (q) => { await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); const e = await page.evaluate(() => window.__error ?? null); check(!e, `page ${q} ready${e ? `: ${e}` : ''}`);
    await page.waitForFunction(() => { const l = document.querySelector('#loading'); return !l || +getComputedStyle(l).opacity === 0; }, { timeout: 10000 }).catch(() => {}); };
  // a page of the game: its news read and closed
  const openTown = async (extra = '') => { await open(`?play=1&vis=0&noreload=1${extra}`); await page.evaluate(() => { const o = document.querySelector('.pm-overlay'); o?.querySelector('.pm-btn')?.click(); }); await sleep(300); };
  const run = async (a) => { const r = await page.evaluate((x) => window.__ui.run(x), a); check(r.ok, `run ${JSON.stringify(a).slice(0, 70)}${r.ok ? '' : `: ${r.reason}`}`); if (r.ok) done.push(a); return r; };
  const talk = async (who) => { const t = await page.evaluate((w) => { window.__ui.openPerson(w); return document.querySelector('.pm-talk')?.textContent ?? ''; }, who); done.push({ type: 'talk', who }); return t; };
  const closeBand = () => page.keyboard.press('Escape');
  const state = () => page.evaluate(() => window.__game.state());
  /** the list (Q): the good turns' buttons and their words */
  const listed = (rx) => page.evaluate((src) => { window.__ui.openHere(); return [...document.querySelectorAll('.pm-talk .pm-btn')].filter((e) => new RegExp(src).test(e.textContent)).map((e) => ({ text: e.textContent, off: !!e.disabled })); }, rx);

  await openTown();
  let st = await state();
  check(st.day === 9 && st.slot === 'morning' && st.place === 'lanterns', `day 9's morning on the festival square: day ${st.day} ${st.slot} ${st.place}`);
  const kell = await talk('kell');
  check(kell.includes(tx('v2.fest.walksNone', { unless: tx('v2.fest.unless', { why: tx('v2.fest.why.sand') }) })), `Kell Barrow's lantern: ${JSON.stringify(kell.slice(0, 220))}`);
  await closeBand();
  const deeds = await listed('Kell Barrow|round at Lio');
  check(deeds.some((d) => d.text.includes(tx('v2.fest.deed.hang', { n: 3 })) && !d.off) && deeds.some((d) => d.text.includes(tx('v2.fest.deed.round', { n: F.deedGain(st, 'round') })) && !d.off), `the good turns in the list: ${JSON.stringify(deeds.map((d) => d.text.slice(0, 90)))}`);
  await page.screenshot({ path: path.join(outDir, `${kind}-0-list.png`) });
  await closeBand();
  await run({ type: 'festDeed', deed: 'round' });
  await run({ type: 'festDeed', deed: 'hang' }); await openTown();
  st = await state();
  check(st.slot === 'afternoon' && st.v2.festival.deeds.join() === 'round,hang', `the afternoon, two good turns done: ${st.slot} ${JSON.stringify(st.v2.festival)}`);
  const wren = await talk('bard');
  check(wren.includes(tx('v2.fest.wren', { purse: 30 })), `Wren tells the custom: ${JSON.stringify(wren.slice(0, 200))}`);
  await page.screenshot({ path: path.join(outDir, `${kind}-1-wren.png`) });
  await closeBand();
  // the tournament's page (T): the player's lanterns tonight and their reasons, as the state reads them
  const board = await page.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' })); const b = [...document.querySelectorAll('.pm-glist .pm-btn')].find((x) => x.querySelector('.me')); b?.focus(); b?.dispatchEvent(new Event('focus')); return document.querySelector('.pm-detail')?.textContent ?? ''; });
  check(board.includes(F.festivalLine(st, 'player')), `the board's lanterns: ${JSON.stringify(F.festivalLine(st, 'player'))} in ${JSON.stringify(board.slice(0, 160))}`);
  check(board.includes(tx('v2.fest.rule', { purse: 30, rep: 5, fame: 10 })), 'the board says the rule');
  await page.screenshot({ path: path.join(outDir, `${kind}-2-board.png`) });
  await closeBand();
  if (kind === 'behind') {
    await run({ type: 'move', to: 'training' }); await openTown();
    const orla = await talk('orla');
    check(orla.includes(tx('v2.fest.rivalCount', { n: F.corteges(await state()).orla.reduce((n, l) => n + l.n, 0) })), `Orla counts her cortege: ${JSON.stringify(orla.slice(0, 200))}`);
    await closeBand();
    await run({ type: 'walkBehind', who: 'orla' });
    await run({ type: 'move', to: 'lanterns' }); await openTown();
  }
  st = await state();
  const order = F.paradeOrder({ ...st, v2: { ...st.v2, festival: { ...st.v2.festival, deeds: [...st.v2.festival.deeds, 'flame'] } } });
  await run({ type: 'festDeed', deed: 'flame' });
  // the evening: the parade's order set at dusk, its scene played on the square
  await openTown('&cutscene=1');
  st = await state();
  const lead = kind === 'lead' ? 'player' : 'orla';
  check(st.slot === 'evening' && st.v2.festival.leader === lead && st.v2.festival.leader === order[0].id, `dusk: ${st.v2.festival.leader} opens the parade with ${st.v2.festival.lanterns[st.v2.festival.leader]} lanterns (${JSON.stringify(st.v2.festival.lanterns)})`);
  const want = S.CUTSCENES.eve.steps.filter((x) => 'say' in x && (!x.if || x.if(st))).map((x) => x.line(st));
  const heard = [];
  for (let i = 0; i < 40 && heard.length < want.length; i++) {
    const q = await page.evaluate(() => document.querySelector('.pm-scene q')?.textContent ?? null);
    if (q && q !== heard.at(-1)) {
      heard.push(q);
      if (heard.length === 3) { await sleep(200); await page.screenshot({ path: path.join(outDir, `${kind}-3-call.png`) }); }
      // the walk at the head of the parade is played between the call and the next line
      if (heard.length === 3) { await page.keyboard.press('e'); await page.waitForFunction((n) => (document.querySelector('.pm-scene q')?.textContent ?? '') !== n, { timeout: 20000 }, q).catch(() => {}); continue; }
      await page.keyboard.press('e');
    }
    await sleep(250);
  }
  check(JSON.stringify(heard) === JSON.stringify(want), `the parade's lines, in order: ${JSON.stringify(heard.map((l) => l.slice(0, 60)))}`);
  const at = await page.evaluate((w) => (w === 'player' ? [window.__plaza.player.pos.x, window.__plaza.player.pos.z] : window.__plaza.spotOf(w)), lead);
  check(Math.hypot(at[0] - S.STAGE_FOOT[0], at[1] - S.STAGE_FOOT[1]) < 0.3, `${lead} at the hall's stage: ${at.map((v) => v.toFixed(2))}`);
  await page.screenshot({ path: path.join(outDir, `${kind}-4-stage.png`) });
  await page.waitForFunction(() => !document.querySelector('.pm-scene'), { timeout: 10000 }).catch(() => {});
  await sleep(800);
  st = await state();
  check(st.flags['scene:eve'] === true, 'the scene watched, once');
  done.push({ type: 'watched', scene: 'eve' });
  if (kind === 'lead') {
    // the way to the forecourt: its tag says why, the hero walking into it stays on the square
    const tags = await page.evaluate(() => window.__exits.state().map((t) => ({ ...t, text: document.querySelector(`.pm-exit[data-to="${t.to}"]`)?.textContent })));
    const fc = tags.find((t) => t.to === 'forecourt');
    check(fc?.text === tx('v2.fest.shutTag', { place: G.placeName('forecourt', true) }), `the tag over the way to the forecourt: ${JSON.stringify(fc)}`);
    const way = await page.evaluate(() => { const e = window.__plaza.place.exits.find((x) => x.to === 'forecourt'); return { lane: e.lane, spawn: e.spawn }; });
    await page.evaluate((w) => window.__plaza.posePlayer(w.lane.x1 - 0.6, (w.lane.z0 + w.lane.z1) / 2, 'side'), way);
    await page.keyboard.down('d'); await sleep(1800); await page.keyboard.up('d');
    await sleep(500);
    const after = await page.evaluate(() => ({ go: window.__go ?? null, faded: !!document.querySelector('.pm-fade'), x: window.__plaza.player.pos.x, place: window.__game.state().place }));
    check(!after.go && !after.faded && after.place === 'lanterns', `walking into the full street goes nowhere: ${JSON.stringify(after)}`);
    await page.screenshot({ path: path.join(outDir, `${kind}-5-shut.png`) });
    const quay = tags.find((t) => t.to === 'district');
    check(!!quay && quay.text === tx('v2.exit.to', { place: G.placeName('district', true) }), `the quay's way open: ${JSON.stringify(quay)}`);
  } else {
    const board2 = await page.evaluate(() => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 't' })); const b = [...document.querySelectorAll('.pm-glist .pm-btn')].find((x) => x.querySelector('.me')); b?.focus(); return document.querySelector('.pm-detail')?.textContent ?? ''; });
    check(board2.includes(tx('v2.fest.board.gave', { name: 'Orla Brask' })), `the board says the gift: ${JSON.stringify(board2.slice(0, 160))}`);
    await page.screenshot({ path: path.join(outDir, `${kind}-5-board.png`) });
    await closeBand();
  }
  const h = await page.evaluate(() => window.__game.hash());
  let s = G.deserialize(saved);
  for (const a of done) { const r = G.advance(s, a); if (!r.ok) check(false, `Node refuses ${a.type}: ${r.reason}`); s = r.state; }
  check(G.hash(s) === h, `Node replay ${G.hash(s)} = browser ${h} (${done.length} actions)`);
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); await server.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
