// The player's sabotage in a browser (the operator's SB-1, SA-1 to SA-6, SF-1 to SF-4, journal Passes SB4 / SB5; src/simulation/v2sabotage.ts): a new game to the eve of day 5, each of the
// three steps taken through the pages (the hooded stranger's dialogue at the quay at night, the list at the forecourt by day and by night), the night's result (the strap cut, or seen),
// then what the next day reads of it: the match sheet's lines, the tournament's board (the cause of a grudge, nothing for a clean cut), the purse the bout pays; Node replays the actions
// the pages applied and finds the same fingerprint.
//   node tools/sabotage-flow.mjs <outDir> <cut|seen> [seed]   (DEV server: BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/cards-flow.mjs; PAGE_LANG=fr: every page in French,
//   the texts read from the game's own French table; without a seed, the first seed of 1 to 400 whose night ends as asked)
//   cut:  the night is not seen: the strap is cut and kept secret, the rival takes ×1.15 the damage on the match sheet, nothing on the board, the purse whole (35)
//   seen: the night is seen: nothing cut, the registrar's warning in the news, the rival's grudge on the match sheet and on the board, the purse halved (17)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, mode, seedArg] = process.argv.slice(2);
if (!outDir || !['cut', 'seen'].includes(mode)) throw new Error('usage: node tools/sabotage-flow.mjs <outDir> <cut|seen> [seed]');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
const LANG = process.env.PAGE_LANG === 'fr' ? 'fr' : 'en';
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const root = path.resolve(import.meta.dirname, '..');
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const WAIT = { type: 'wait' }, WON = { type: 'fight', outcome: { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } };
const POOL4 = [WAIT, WAIT, WAIT, WAIT, WON, WAIT, WAIT, WAIT, WAIT, WAIT, WON];   // the pool to the evening of day 4, at the quay

// 0. the seed whose night ends as asked, found in Node by the game's own actions (the same ones the pages will apply)
const server = await createServer({ root, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const G = await server.ssrLoadModule('/src/simulation/index.ts');
const SAB = await server.ssrLoadModule('/src/simulation/v2sabotage.ts');
const { RIVALS } = await server.ssrLoadModule('/src/narrative/roster.ts');
const { EN } = await server.ssrLoadModule('/src/narrative/text/en.ts');
const play = (seed, acts) => { let s = G.makeV2(G.newGame(seed, 'Aster')); for (const a of acts) { const r = G.advance(s, a); if (!r.ok) return null; s = r.state; } return s; };
// (opening the stranger's dialogue applies a `talk`, an action like the others: it moves the game's random streams, so the seed is searched with it)
const steps = [...POOL4, { type: 'talk', who: 'stranger' }, { type: 'buyTool' }, { type: 'move', to: 'forecourt' }, { type: 'caseLockers' }, WON, { type: 'cutStrap' }];
let seed = seedArg ? +seedArg : 0;
if (!seed) for (let s = 1; s <= 400 && !seed; s++) { const st = play(s, steps); if (st?.v2?.sabotage?.eves?.[5]?.result === (mode === 'cut' ? 'cut' : 'seen')) seed = s; }
const expect = play(seed, steps);
check(!!expect, `seed ${seed}: the eve plays through in Node`);
const foe = expect.v2.sabotage.eves[5].foe, foeName = RIVALS[foe].name;
check(expect.v2.sabotage.eves[5].result === (mode === 'cut' ? 'cut' : 'seen'), `the night ends ${mode === 'cut' ? 'unseen, the strap cut' : 'seen'} against ${foeName}`);

const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 } });
const errors = [], pageActs = [];
try {
  const page = await b.newPage();
  await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  const open = async (q) => {
    await page.goto(`${BASE}${q}&lang=${LANG}`, { waitUntil: 'load', timeout: READY });
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
    // every action a page applies is kept for the Node replay
    await page.evaluate(() => { const g = window.__game; if (!g || g.__logged) return; const a = g.act; g.act = (x) => { const r = a(x); if (r.ok) (window.__acts ??= []).push(x); return r; }; g.__logged = true; });
    await sleep(600);
  };
  const act = async (a) => { const r = await page.evaluate((x) => window.__game.act(x), a); check(r.ok, `act ${JSON.stringify(a).slice(0, 70)}${r.ok ? '' : `: ${r.reason}`}`); return r; };
  const state = () => page.evaluate(() => window.__game.state());
  const T = async (k, v) => page.evaluate(async (k, v) => { const u = performance.getEntriesByType('resource').map((r) => r.name).find((n) => /\/src\/narrative\/text\/index\.ts/.test(n)) ?? '/src/narrative/text/index.ts'; return (await import(u)).tx(k, v); }, k, v);
  /** the text of every button of the open dialogue or list, with whether it is enabled and its group title */
  const lines = () => page.evaluate(() => [...document.querySelectorAll('.pm-talk .opts .pm-btn, .pm-talk .opts .pm-sub')].map((x) => ({ text: x.textContent.trim().replace(/\s+/g, ' '), title: x.classList.contains('pm-sub'), off: !!x.disabled })));
  const clickLine = async (part) => page.evaluate((t) => { const b = [...document.querySelectorAll('.pm-talk .opts .pm-btn')].find((x) => x.textContent.includes(t)); if (!b || b.disabled) return false; b.click(); return true; }, part);
  const dismiss = async () => { for (let i = 0; i < 4; i++) { const on = await page.evaluate(() => !!document.querySelector('.pm-overlay, .pm-talk')); if (!on) break; await page.keyboard.press('Escape'); await sleep(250); } };

  // 1. a new game, the pool played to the evening of day 4 (the arena's results given as the named states do)
  await open(`?play=1&new=1&name=Aster&seed=${seed}&vis=0&noreload=1`);
  for (const a of POOL4) await act(a);
  let st = await state();
  check(st.day === 4 && st.slot === 'evening' && st.place === 'district', `day ${st.day} ${st.slot} at ${st.place}: the evening before the eve`);
  check(!st.v2.sabotage, 'a game that has not begun the sabotage carries no field of it');
  // 2. step two first, by the hooded stranger at the quay at night: the blade
  await page.evaluate(() => window.__ui.openPerson('stranger')); await sleep(400);
  const toolPart = (await T('v2.sab.tool.label', { n: '@' })).split(' (')[0];
  const stranger = await lines();
  const toolLine = stranger.find((l) => l.text.includes(toolPart));
  check(!!toolLine && !toolLine.off, `the stranger's dialogue offers the blade: ${toolLine?.text.slice(0, 110)}`);
  check(/8/.test(toolLine?.text ?? '') && /1/.test(toolLine?.text ?? ''), 'its tag says the coins and the slot');
  await page.screenshot({ path: path.join(outDir, `${mode}-1-stranger.png`) });
  const coins4 = (await state()).player.coins;
  check(await clickLine(toolPart), 'a click buys the blade'); await sleep(500); await dismiss();
  st = await state();
  check(st.v2.sabotage?.tool === true && st.day === 5 && st.slot === 'morning', `the blade is held, the evening spent: day ${st.day} ${st.slot}`);
  check(coins4 - st.player.coins === 8, `the stranger took 8 coins (day 4's price): ${coins4 - st.player.coins}`);
  // 3. step one by day at the forecourt, in the list (Q): under the group of the foul play
  await act({ type: 'move', to: 'forecourt' });
  await page.evaluate(() => window.__ui.openHere()); await sleep(400);
  const list1 = await lines(), groupTitle = await T('ui.group.steal'), caseLabel = await T('v2.sab.case.label');
  const iTitle = list1.findIndex((l) => l.title && l.text === groupTitle), iCase = list1.findIndex((l) => l.text.startsWith(caseLabel.slice(0, 30)));
  check(iTitle >= 0 && iCase > iTitle, `the lockers' line stands under « ${groupTitle} »`);
  check(!list1.slice(0, iTitle).some((l) => !l.title && /lockers|casiers/i.test(l.text)), 'never above it, never the list\'s first line');
  const first = await page.evaluate(() => document.activeElement?.textContent?.trim() ?? '');
  check(!first.startsWith(caseLabel.slice(0, 20)), 'the list does not open on it');
  await page.screenshot({ path: path.join(outDir, `${mode}-2-list-day.png`) });
  check(await clickLine(caseLabel.slice(0, 25)), 'a click cases the lockers'); await sleep(500); await dismiss();
  st = await state();
  check(st.v2.sabotage?.cased === 5, 'the lockers are cased for the day');
  const casing = st.log.find((e) => e.id === 'sabotage:case');
  // (the state's lines are English whatever the page says: the French is said from the line's reference, journal Passe RG4)
  check(!!casing && casing.text === EN['v2.sab.case.logAny'], 'the log says the rounds are learnt and the bracket not drawn yet');
  // the pool's bout of the afternoon (the arena's result given), the evening: the bracket is drawn, the man named
  await act(WON); st = await state();
  check(st.day === 5 && st.slot === 'evening', `the pool's last bout fought: day ${st.day} ${st.slot}`);
  await page.evaluate(() => window.__ui.openHere()); await sleep(400);
  const list2 = await lines();
  const cutPart = (await T('v2.sab.cut.label', { name: foeName })).slice(0, 40);
  const cutLines = list2.filter((l) => l.text.includes(cutPart));
  if (!cutLines.length) console.log('[debug] the list:', list2.map((l) => l.text).join(' | '), '| the game says:', JSON.stringify(await page.evaluate(() => window.__game.actions().filter((o) => ['cutStrap', 'caseLockers', 'buyTool'].includes(o.action.type)).map((o) => ({ t: o.action.type, ok: o.ok, why: o.reason })))));
  check(cutLines.length === 2 && cutLines.every((l) => !l.off), `the night's two lines, alone and with Corra Dunmere: ${cutLines.map((l) => l.text.slice(0, 70)).join(' | ')}`);
  check(cutLines.some((l) => /20/.test(l.text)), 'her line says her price');
  await page.screenshot({ path: path.join(outDir, `${mode}-3-list-night.png`) });
  const aloneLabel = await T('v2.sab.cut.label', { name: foeName });
  check(await page.evaluate((t) => { const b = [...document.querySelectorAll('.pm-talk .opts .pm-btn')].find((x) => x.textContent.includes(t) && !/Corra/.test(x.textContent)); if (!b || b.disabled) return false; b.click(); return true; }, aloneLabel), 'a click on the line alone');
  await sleep(600);
  const news = await page.evaluate(() => document.querySelector('.pm-overlay, .pm-talk')?.textContent?.replace(/\s+/g, ' ').slice(0, 700) ?? '');
  await page.screenshot({ path: path.join(outDir, `${mode}-4-news.png`) });
  await dismiss();
  st = await state();
  const res = st.v2.sabotage.eves[5];
  check(res.result === (mode === 'cut' ? 'cut' : 'seen') && res.foe === foe, `the night's result is the one Node found: ${res.result} against ${res.foe}`);
  check(st.day === 6 && st.slot === 'morning', `the night spent: day ${st.day} ${st.slot}`);
  const events = st.log.filter((e) => e.day === 5 && e.slot === 'evening' && /^sabotage:/.test(e.id)).map((e) => e.id);
  check(mode === 'cut' ? events.join() === 'sabotage:cut' : events.join() === 'sabotage:seen,sabotage:warned', `the journal's lines: ${events.join(', ')}`);
  if (mode === 'seen') check(/halved|réduite de moitié/.test(news) || st.log.some((e) => e.id === 'sabotage:warned' && /17/.test(e.text)), 'the registrar\'s warning is said, with the halved purse');
  // 4. day 6: what the match sheet says of the rival, and the board
  await page.evaluate(() => window.__ui.openMatchSheet()); await sleep(600);
  const sheet = await page.evaluate(() => document.querySelector('.pm-overlay')?.textContent?.replace(/\s+/g, ' ') ?? '');
  const strapWords = (await T('v2.sheet.foeStrap', { name: foeName, n: 15 })).replace(/\s+/g, ' '), grudgeWords = (await T('v2.sheet.foeGrudge', { name: foeName, n: 2 })).replace(/\s+/g, ' ');
  if (mode === 'cut') {
    check(sheet.includes(strapWords), `the match sheet says it: « ${strapWords.slice(0, 80)} »`);
    check(!sheet.includes(grudgeWords.slice(0, 30)), 'and no grudge');
  } else {
    check(sheet.includes(grudgeWords), `the match sheet says the grudge: « ${grudgeWords.slice(0, 80)} »`);
    check(!sheet.includes(strapWords.slice(0, 30)), 'and no strap cut');
  }
  await page.screenshot({ path: path.join(outDir, `${mode}-5-sheet.png`) });
  await dismiss();
  await page.evaluate(() => window.__ui.openBoard()); await sleep(600);
  const board = await page.evaluate(() => document.querySelector('.pm-overlay')?.textContent?.replace(/\s+/g, ' ') ?? '');
  const cause = await T('v2.memory.sabotaged', { day: 5 });
  check(mode === 'seen' ? board.includes(cause) : !board.includes(cause) && !/locker|casier/i.test(board), mode === 'seen' ? `the board writes the cause: « ${cause} »` : 'the board says nothing of a clean cut');
  await page.screenshot({ path: path.join(outDir, `${mode}-6-board.png`) });
  await dismiss();
  // 5. the bout of day 6 (the arena's result given): the purse the page pays
  const coins = (await state()).player.coins;
  await act(WAIT); await act(WON); st = await state();
  const won = st.player.coins - coins;
  check(won === (mode === 'cut' ? 35 : 17), `the purse of the bout won: ${won} coins (${mode === 'cut' ? 'whole' : 'halved'})`);
  const line = st.log.filter((e) => e.id === 'player-won').pop();
  check(!!line && line.text.includes(String(won)), `the bout's line says it: ${line?.text.slice(0, 100)}`);
  // 6. Node replays what the pages applied: the same fingerprint
  const final = await page.evaluate(() => ({ h: window.__game.hash(), acts: window.__acts ?? [] }));
  pageActs.push(...final.acts);
  let s = G.makeV2(G.newGame(seed, 'Aster'));
  for (const a of pageActs) { const r = G.advance(s, a); if (!r.ok) check(false, `replay refused ${JSON.stringify(a).slice(0, 60)}: ${r.reason}`); else s = r.state; }
  check(G.hash(s) === final.h, `Node replay ${G.hash(s)} = browser ${final.h}`);
  check(['buyTool', 'caseLockers', 'cutStrap'].every((t) => pageActs.some((a) => a.type === t)), `the pages applied the three steps: ${pageActs.filter((a) => ['buyTool', 'caseLockers', 'cutStrap'].includes(a.type)).map((a) => a.type).join(', ')}`);
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); await server.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
