// The player's sabotage in a browser (the operator's SB-1, SA-1 to SA-6, SF-1 to SF-4, SG-1 to SG-3, SH-1, journal Passes SB4 / SB5 / SB8 / SB11; src/simulation/v2sabotage.ts): a new game to the eve of day 5, each of the
// three steps taken through the pages (the hooded stranger's dialogue at the quay at night, the list at the forecourt by day and by night), the night's result (the strap cut, or seen),
// then what the next day reads of it: the match sheet's lines, the tournament's board (the cause of a grudge, nothing for a clean cut), the purse the bout pays; Node replays the actions
// the pages applied and finds the same fingerprint.
//   node tools/sabotage-flow.mjs <outDir> <cut|seen|blade|both> [seed]   (DEV server: BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/cards-flow.mjs; PAGE_LANG=fr: every page in French,
//   the texts read from the game's own French table; without a seed, the first seed of 1 to 400 whose night ends as asked, against the rival FOE=<id> when it is set)
//   cut:  the night is not seen: the strap is cut and kept secret, the rival takes ×1.15 the damage on the match sheet, nothing on the board, the purse whole (35)
//   blade: the night is not seen and the gesture is the blunted blade (journal Passe SB8): the night's four lines, the line « blunt … alone » taken, the rival's Attack a fifth lower and their weapon's
//         state gone on the match sheet (the lines of the sheet), nothing on the board, the purse whole (35)
//   both: the night is not seen and the gesture is both (journal Passe SB11, the operator's SH-1 « A · Les deux gestes, avec quinze points d’être vu en plus »): two blades bought from the hooded stranger
//         (the evenings of days 3 and 4, the second saying it is for both), the night's six lines, the line « cut … and blunt … alone » taken, the strap cut AND the blade blunted on the match
//         sheet (the lines of both and the weapon's state gone), nothing on the board, the purse whole (35)
//   seen: the night is seen: nothing cut, the registrar's warning in the news, the rival's grudge on the match sheet and on the board, the purse halved (17)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, mode, seedArg] = process.argv.slice(2);
if (!outDir || !['cut', 'seen', 'blade', 'both'].includes(mode)) throw new Error('usage: node tools/sabotage-flow.mjs <outDir> <cut|seen|blade|both> [seed]');
const WANT = mode === 'seen' ? 'seen' : 'cut';   // the night's result asked for (the blade and both are cut in the dark like the strap)
const BOTH = mode === 'both';
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
const TALK = { type: 'talk', who: 'stranger' }, BUY = { type: 'buyTool' };
const TO3 = POOL4.slice(0, 8);   // the pool to the evening of day 3, at the quay: the first blade of « both » is bought then, the second the evening of day 4
const steps = BOTH
  ? [...TO3, TALK, BUY, WAIT, WON, TALK, BUY, { type: 'move', to: 'forecourt' }, { type: 'caseLockers' }, WON, { type: 'cutStrap', both: true }]
  : [...POOL4, TALK, BUY, { type: 'move', to: 'forecourt' }, { type: 'caseLockers' }, WON, { type: 'cutStrap', ...(mode === 'blade' ? { blade: true } : {}) }];
let seed = seedArg ? +seedArg : 0;
// (FOE=<rival id> asks for a night against that rival: one whose weapon carries a state shows the match sheet's line of the state gone)
if (!seed) for (let s = 1; s <= 400 && !seed; s++) { const st = play(s, steps), e = st?.v2?.sabotage?.eves?.[5]; if (e?.result === WANT && (!process.env.FOE || e.foe === process.env.FOE)) seed = s; }
const expect = play(seed, steps);
check(!!expect, `seed ${seed}: the eve plays through in Node`);
const foe = expect.v2.sabotage.eves[5].foe, foeName = RIVALS[foe].name;
check(expect.v2.sabotage.eves[5].result === WANT, `the night ends ${mode === 'seen' ? 'seen' : mode === 'blade' ? 'unseen, the blade blunted' : BOTH ? 'unseen, the strap cut and the blade blunted' : 'unseen, the strap cut'} against ${foeName}`);
const weapon = SAB.weaponState(foe);

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
  for (const a of BOTH ? TO3 : POOL4) await act(a);
  let st = await state();
  /** step two, by the hooded stranger at the quay at night: a fine blade (the second, for « both », says so), bought through his dialogue */
  const buyBlade = async (key, held, day, shot) => {
    await page.evaluate(() => window.__ui.openPerson('stranger')); await sleep(400);
    const toolPart = (await T(key, { n: '@' })).split(' (')[0];
    const stranger = await lines();
    const toolLine = stranger.find((l) => l.text.includes(toolPart));
    check(!!toolLine && !toolLine.off, `the stranger's dialogue offers the blade: ${toolLine?.text.slice(0, 110)}`);
    check(/8/.test(toolLine?.text ?? '') && /1/.test(toolLine?.text ?? ''), 'its tag says the coins and the slot');
    if (shot) await page.screenshot({ path: path.join(outDir, `${mode}-1-stranger.png`) });
    const coinsBefore = (await state()).player.coins;
    check(await clickLine(toolPart), 'a click buys the blade'); await sleep(500); await dismiss();
    const s2 = await state();
    check(s2.v2.sabotage?.tool === held && s2.day === day && s2.slot === 'morning', `the blade is held (${JSON.stringify(held)}), the evening spent: day ${s2.day} ${s2.slot}`);
    check(coinsBefore - s2.player.coins === 8, `the stranger took 8 coins (the price of the day): ${coinsBefore - s2.player.coins}`);
    return s2;
  };
  if (BOTH) {
    check(st.day === 3 && st.slot === 'evening' && st.place === 'district', `day ${st.day} ${st.slot} at ${st.place}: two evenings before the eve`);
    check(!st.v2.sabotage, 'a game that has not begun the sabotage carries no field of it');
    await buyBlade('v2.sab.tool.label', true, 4, false);
    await act(WAIT); await act(WON); st = await state();
  }
  check(st.day === 4 && st.slot === 'evening' && st.place === 'district', `day ${st.day} ${st.slot} at ${st.place}: the evening before the eve`);
  if (!BOTH) check(!st.v2.sabotage, 'a game that has not begun the sabotage carries no field of it');
  // 2. step two first: the blade (with « both », a second one, the stranger saying it is for both gestures)
  st = await buyBlade(BOTH ? 'v2.sab.tool.labelSecond' : 'v2.sab.tool.label', BOTH ? 2 : true, 5, true);
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
  const cutPart = (await T('v2.sab.cut.label', { name: foeName })).slice(0, 25);   // (the start every line of the night shares: the strap, the blade and both)
  const cutLines = list2.filter((l) => l.text.includes(cutPart));
  if (!cutLines.length) console.log('[debug] the list:', list2.map((l) => l.text).join(' | '), '| the game says:', JSON.stringify(await page.evaluate(() => window.__game.actions().filter((o) => ['cutStrap', 'caseLockers', 'buyTool'].includes(o.action.type)).map((o) => ({ t: o.action.type, ok: o.ok, why: o.reason })))));
  check(cutLines.length === (BOTH ? 6 : 4) && cutLines.every((l) => !l.off), `the night's ${BOTH ? 'six' : 'four'} lines, the strap or the blade${BOTH ? ' or both' : ''}, alone or with Corra Dunmere: ${cutLines.map((l) => l.text.slice(0, 60)).join(' | ')}`);
  check(cutLines.filter((l) => /20/.test(l.text)).length === (BOTH ? 3 : 2), BOTH ? 'her three lines say her price' : 'her two lines say her price');
  if (BOTH) check(cutLines.filter((l) => /15/.test(l.text)).length === 2, 'the two lines of both say the fifteen points more of being seen');
  // (the list opens on what is new, the cards and the people: the night's lines are under their group, scrolled into view for the capture)
  await page.evaluate((t) => { const b = [...document.querySelectorAll('.pm-talk .opts .pm-btn')].filter((x) => x.textContent.includes(t)).at(-1); b?.scrollIntoView({ block: 'end' }); }, cutPart); await sleep(300);
  await page.screenshot({ path: path.join(outDir, `${mode}-3-list-night.png`) });
  const aloneLabel = await T(mode === 'blade' ? 'v2.sab.blade.label' : BOTH ? 'v2.sab.both.label' : 'v2.sab.cut.label', mode === 'both' ? { name: foeName, p: 15 } : { name: foeName });
  check(await page.evaluate((t) => { const b = [...document.querySelectorAll('.pm-talk .opts .pm-btn')].find((x) => x.textContent.includes(t) && !/Corra/.test(x.textContent)); if (!b || b.disabled) return false; b.click(); return true; }, aloneLabel), 'a click on the line alone');
  await sleep(600);
  const news = await page.evaluate(() => document.querySelector('.pm-overlay, .pm-talk')?.textContent?.replace(/\s+/g, ' ').slice(0, 700) ?? '');
  await page.screenshot({ path: path.join(outDir, `${mode}-4-news.png`) });
  await dismiss();
  st = await state();
  const res = st.v2.sabotage.eves[5];
  check(res.result === WANT && res.foe === foe, `the night's result is the one Node found: ${res.result} against ${res.foe}`);
  check(mode === 'blade' ? res.gesture === 'blade' : BOTH ? res.gesture === 'both' : res.gesture === undefined, `the gesture kept: ${res.gesture ?? 'the strap'}`);
  check(BOTH ? st.v2.sabotage.tool === undefined : true, 'the blades are used up');
  check(st.day === 6 && st.slot === 'morning', `the night spent: day ${st.day} ${st.slot}`);
  const events = st.log.filter((e) => e.day === 5 && e.slot === 'evening' && /^sabotage:/.test(e.id)).map((e) => e.id);
  check(mode !== 'seen' ? events.join() === 'sabotage:cut' : events.join() === 'sabotage:seen,sabotage:warned', `the journal's lines: ${events.join(', ')}`);
  if (mode === 'seen') check(/halved|réduite de moitié/.test(news) || st.log.some((e) => e.id === 'sabotage:warned' && /17/.test(e.text)), 'the registrar\'s warning is said, with the halved purse');
  // 4. day 6: what the match sheet says of the rival, and the board
  await page.evaluate(() => window.__ui.openMatchSheet()); await sleep(600);
  const sheet = await page.evaluate(() => document.querySelector('.pm-overlay')?.textContent?.replace(/\s+/g, ' ') ?? '');
  const strapWords = (await T('v2.sheet.foeStrap', { name: foeName, n: 15 })).replace(/\s+/g, ' '), grudgeWords = (await T('v2.sheet.foeGrudge', { name: foeName, n: 2 })).replace(/\s+/g, ' ');
  const bladeWords = (await T('v2.sheet.foeBlade', { name: foeName, n: 20 })).replace(/\s+/g, ' ');
  if (mode === 'blade' || BOTH) {
    if (BOTH) check(sheet.includes(strapWords), `the match sheet says the strap: « ${strapWords.slice(0, 80)} »`);
    check(sheet.includes(bladeWords), `the match sheet says ${BOTH ? 'the blade too' : 'it'}: « ${bladeWords.slice(0, 80)} »`);
    if (weapon) check(sheet.includes((await T('v2.sheet.foeBladeState', { state: await T(`state.name.${weapon}`) })).replace(/\s+/g, ' ')), `and says the weapon's state is gone (${weapon})`);
    else check(!sheet.includes((await T('v2.sheet.foeBladeState', { state: '@' })).split('@')[0]), 'and nothing of a state: their weapon carries none');
    if (BOTH) check(!sheet.includes(grudgeWords.slice(0, 30)), 'no grudge');
    else check(!sheet.includes(strapWords.slice(0, 30)) && !sheet.includes(grudgeWords.slice(0, 30)), 'no strap cut, no grudge');
  } else if (mode === 'cut') {
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
  check(won === (mode === 'seen' ? 17 : 35), `the purse of the bout won: ${won} coins (${mode === 'seen' ? 'halved' : 'whole'})`);
  const line = st.log.filter((e) => e.id === 'player-won').pop();
  check(!!line && line.text.includes(String(won)), `the bout's line says it: ${line?.text.slice(0, 100)}`);
  // 6. Node replays what the pages applied: the same fingerprint
  const final = await page.evaluate(() => ({ h: window.__game.hash(), acts: window.__acts ?? [] }));
  pageActs.push(...final.acts);
  let s = G.makeV2(G.newGame(seed, 'Aster'));
  for (const a of pageActs) { const r = G.advance(s, a); if (!r.ok) check(false, `replay refused ${JSON.stringify(a).slice(0, 60)}: ${r.reason}`); else s = r.state; }
  check(G.hash(s) === final.h, `Node replay ${G.hash(s)} = browser ${final.h}`);
  check(['buyTool', 'caseLockers', 'cutStrap'].every((t) => pageActs.some((a) => a.type === t)), `the pages applied the three steps: ${pageActs.filter((a) => ['buyTool', 'caseLockers', 'cutStrap'].includes(a.type)).map((a) => a.type).join(', ')}`);
  if (BOTH) check(pageActs.filter((a) => a.type === 'buyTool').length === 2 && pageActs.some((a) => a.type === 'cutStrap' && a.both === true), 'two blades bought and the night of both applied');
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); await server.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
