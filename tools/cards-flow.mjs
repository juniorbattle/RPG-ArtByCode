// The winner's card in a browser (the operator's CL-2, journal Passe CV1; src/simulation/v2cards.ts, src/ui/cardsPage.ts): a new game's first bout (day 2's afternoon) played
// in the arena page, the result page's cards (a row of tiles, « Decide later »), the card taken at the keyboard, at a fake pad, or left for the list; Node replays the actions the
// pages applied (the arena's own outcome included) and finds the same fingerprint.
//   node tools/cards-flow.mjs <outDir> <keys|later|pad> [seed=9]   (DEV server: BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/play-flow.mjs;
//   PAGE_LANG=fr: every page in French, the texts read from the game's own French table; seed 9 wins day 2's bout of a new game since the race fitted last)
//   keys:  Right moves to the second tile, Enter takes it, « Back to the city » then leaves; the number key 3 taking the purse in a second run is not played here (the tiles' keys are
//          the page's own: tests/v2-cards.test.mjs reads them in the source)
//   later: Esc on the result page leaves the cards waiting; the town's list (Q) holds them first, under their own title, and a line there takes one
//   pad:   a fake pad (Xbox): the D-pad's Right moves to the second tile, A takes it, A leaves
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, mode, seedS = '9'] = process.argv.slice(2);
if (!outDir || !['keys', 'later', 'pad'].includes(mode)) throw new Error('usage: node tools/cards-flow.mjs <outDir> <keys|later|pad> [seed]');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
const LANG = process.env.PAGE_LANG === 'fr' ? 'fr' : 'en';
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 } });
const errors = [], actionsDone = [], pageActs = [];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BTN = { A: 0, B: 1, RIGHT: 15, LEFT: 14 };

/** the fake pad of tools/pad-proof.mjs, defined before the page's scripts */
function fakePad() {
  const pad = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', index: 0, connected: true, mapping: 'standard', timestamp: 0, buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0] };
  window.__fakePad = pad;
  Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [window.__fakePad, null, null, null] });
  window.__padSet = (i, on) => { const x = pad.buttons[i]; x.pressed = on; x.touched = on; x.value = on ? 1 : 0; pad.timestamp = performance.now(); };
}

try {
  const page = await b.newPage();
  if (mode === 'pad') await page.evaluateOnNewDocument(fakePad);
  else await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  const frames = (n = 3) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const padPress = async (i) => { await page.evaluate((i) => window.__padSet(i, true), i); await frames(3); await sleep(90); await page.evaluate((i) => window.__padSet(i, false), i); await frames(3); await sleep(80); };
  let opened = false;
  // the actions a page applied are read before the next page replaces it
  const grab = async () => { if (opened) pageActs.push(...(await page.evaluate(() => window.__acts ?? []))); };
  const open = async (q) => {
    await grab(); opened = true;
    await page.goto(`${BASE}${q}&lang=${LANG}`, { waitUntil: 'load', timeout: READY });
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
    // every action a page applies is kept for the Node replay (the arena's `fight` with its outcome, the card taken)
    await page.evaluate(() => { const g = window.__game; if (!g || g.__logged) return; const a = g.act; g.act = (x) => { const r = a(x); if (r.ok) (window.__acts ??= []).push(x); return r; }; g.__logged = true; });
    await sleep(600);
  };
  const act = async (a) => { const r = await page.evaluate((x) => window.__game.act(x), a); check(r.ok, `act ${JSON.stringify(a).slice(0, 70)}${r.ok ? '' : `: ${r.reason}`}`); if (r.ok) actionsDone.push(a); return r; };
  const state = () => page.evaluate(() => window.__game.state());
  // the page's own text module (the very URL it loaded, with the dev server's timestamp query when a file changed since it started: another URL would be another instance, in English)
  const T = async (k, v) => page.evaluate(async (k, v) => { const u = performance.getEntriesByType('resource').map((r) => r.name).find((n) => /\/src\/narrative\/text\/index\.ts/.test(n)) ?? '/src/narrative/text/index.ts'; return (await import(u)).tx(k, v); }, k, v);

  // 1. a new game, the clock to day 2's afternoon (the first bout)
  await open(`?play=1&new=1&name=Aster&seed=${seedS}&vis=0&noreload=1`);
  for (let i = 0; i < 4; i++) await act({ type: 'wait' });
  let st = await state();
  check(st.day === 2 && st.slot === 'afternoon', `day ${st.day} ${st.slot}: the first bout's afternoon`);
  check(!st.v2.cards, 'no card before a bout is won (the state carries no field)');
  // 2. the match sheet, then the arena
  await page.evaluate(() => { window.__ui.openHere(); [...document.querySelectorAll('.pm-talk .pm-btn')].find((x) => /Enter the arena|Entrer dans l’arène/.test(x.textContent)).click(); });
  await page.evaluate(() => document.activeElement?.blur?.() ?? 0); await page.focus('.pm-glist .pm-btn'); await page.keyboard.press('Enter');
  const to = await page.evaluate(() => window.__go);
  check(/scene=arena/.test(to ?? ''), `the town goes to ${to}`);
  await open(to);
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn').click());
  // 3. the bout: « Skip » (the dodge's key), the duel decided from the state
  const won = await page.evaluate(() => {
    const a = window.__arena, s = a.sim;
    if (a.auto) { a.update(1 / 60); a.action('dodge', true); }
    for (let i = 0; i < 60 * 90 && !(window.__go); i++) { a.update(1 / 60); if (s.over && document.querySelector('.pm-overlay')) break; }
    return { winner: a.auto?.winner ?? null };
  });
  check(won.winner === 'ren', `the bout is won (seed ${seedS})`);
  await page.waitForSelector('.pm-overlay .pm-btn', { timeout: 20000 });
  await sleep(500);
  // 4. the result page's cards
  const tiles = await page.evaluate(() => [...document.querySelectorAll('.pm-cardrow .cd-tile')].map((t) => ({ kind: t.dataset.kind, id: t.dataset.card, text: t.textContent, inside: (() => { const r = t.getBoundingClientRect(); return r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight; })() })));
  const offer = (await state()).v2.cards?.offers?.[0];
  check(tiles.length === 3 && !!offer && tiles.length === offer.cards.length, `${tiles.length} tiles for the ${offer?.cards.length} cards of the offer`);
  check(tiles.map((t) => t.kind).join() === offer?.cards.map((c) => c.k).join(), `the tiles in the offer's order: ${tiles.map((t) => t.kind).join(', ')}`);
  check(tiles.every((t) => t.text.length > 20 && t.inside), 'every tile says its kind, its card and what it does, inside the window');
  // the panache (journal Passe CV2): the bout's style said on the page, its fame in the state
  const flairEv = (await state()).log.find((e) => e.id === 'flair'), pageText = await page.evaluate(() => document.querySelector('.pm-overlay .pm-body')?.textContent ?? '');
  check(!!flairEv, 'the bout earned panache (an exploit landed in an opening)');
  if (flairEv) { const n = /\+(\d+)/.exec(flairEv.text)[1]; check(pageText.includes(`+${n} `) && /(fame|renommée)/.test(pageText), `the result page says the panache: +${n}`); }
  const foot = await page.evaluate(() => [...document.querySelectorAll('.pm-overlay .pm-foot button')].map((x) => x.textContent.trim()));
  const later = await T('ui.card.later');
  check(foot.length === 1 && foot[0].includes(later), `the foot offers one way out: ${foot.join(' | ')}`);
  const focus0 = await page.evaluate(() => document.activeElement?.dataset?.card ?? null);
  check(focus0 === tiles[0].id, `the first tile has the keyboard: ${focus0}`);
  await page.screenshot({ path: path.join(outDir, `${mode}-1-cards.png`) });
  const hBefore = await page.evaluate(() => window.__game.hash());

  let taken = null;
  if (mode === 'keys') {
    await page.keyboard.press('ArrowRight'); await sleep(80);
    check(await page.evaluate(() => document.activeElement?.dataset?.card) === tiles[1].id, 'Right moves to the second tile');
    await page.keyboard.press('ArrowLeft'); await sleep(80);
    check(await page.evaluate(() => document.activeElement?.dataset?.card) === tiles[0].id, 'Left comes back');
    await page.keyboard.press('ArrowRight'); await sleep(80);
    await page.keyboard.press('Enter'); await sleep(300);
    taken = tiles[1].id;
  } else if (mode === 'pad') {
    await padPress(BTN.RIGHT);
    check(await page.evaluate(() => document.activeElement?.dataset?.card) === tiles[1].id, 'the pad\'s D-pad Right moves to the second tile');
    await padPress(BTN.A); await sleep(300);
    taken = tiles[1].id;
  } else {
    await page.keyboard.press('Escape'); await sleep(600);
  }

  if (taken) {
    st = await state();
    check(st.v2.cards.taken.join() === taken && st.v2.cards.offers.length === 0, `the card taken is in the state: ${st.v2.cards.taken.join()}`);
    check(JSON.stringify(st.v2.cards.stats) !== '{}' || taken.startsWith('skill:') || taken.startsWith('purse:'), 'its effect is kept');
    const after = await page.evaluate(() => ({ tiles: document.querySelectorAll('.pm-cardrow .cd-tile').length, foot: [...document.querySelectorAll('.pm-overlay .pm-foot button')].map((x) => x.textContent.trim()), slot: document.querySelector('.pm-cards-slot')?.textContent ?? '', active: document.activeElement?.textContent ?? '' }));
    const backLabel = await T('ui.arena.back');
    check(after.tiles === 0 && after.foot.length === 1 && after.foot[0].includes(backLabel) && /Enter|⏎|A/.test(after.foot[0]), `the cards leave, the foot says « ${after.foot[0]} »`);
    check(after.slot.length > 10, `the page says what was taken: ${after.slot.trim().slice(0, 80)}`);
    check(after.active.includes(backLabel), 'the back button has the keyboard');
    await page.screenshot({ path: path.join(outDir, `${mode}-2-taken.png`) });
    if (mode === 'pad') await padPress(BTN.A); else await page.keyboard.press('Enter');
  } else {
    check(await page.evaluate(() => window.__game.hash()) === hBefore, 'leaving for later changes nothing of the state');
    st = await state();
    check(st.v2.cards.offers.length === 1 && st.v2.cards.taken.length === 0, 'the offer waits in the state');
  }
  await sleep(400);
  const back = await page.evaluate(() => window.__go);
  check(!!back, `the page goes back to the town: ${back}`);
  await open(back);
  // 5. the town: the list (Q) holds the cards while they wait; a line takes one
  if (mode === 'later') {
    await page.evaluate(() => window.__ui.openHere());
    await sleep(300);
    const list = await page.evaluate(() => ({ title: [...document.querySelectorAll('.pm-talk .opts .pm-sub')].map((x) => x.textContent.trim())[0] ?? '', lines: [...document.querySelectorAll('.pm-talk .opts .pm-btn')].slice(0, 4).map((x) => x.textContent.trim()), focus: document.activeElement?.textContent ?? '' }));
    const group = await T('ui.group.card'), label = (await T('v2.card.label', { card: '@' })).split('@')[0];
    check(list.title === group, `the list's first group: ${list.title}`);
    check(list.lines.slice(0, 3).every((l) => l.startsWith(label)) && list.lines.length >= 3, `the first lines take a card: ${list.lines.slice(0, 3).join(' | ')}`);
    check(list.focus.startsWith(label), 'the list opens on the first card');
    await page.screenshot({ path: path.join(outDir, `${mode}-3-list.png`) });
    await page.keyboard.press('Enter'); await sleep(400);
    st = await state();
    check(st.v2.cards.taken.length === 1 && st.v2.cards.offers.length === 0, `a line of the list takes the card: ${st.v2.cards.taken.join()}`);
    const gone = await page.evaluate(() => [...document.querySelectorAll('.pm-talk .opts .pm-sub')].map((x) => x.textContent.trim()));
    check(!gone.includes(list.title), 'the group is gone once the card is taken');
  }
  const final = await page.evaluate(() => ({ s: window.__game.state(), h: window.__game.hash() }));
  check(final.s.slot === 'evening', `the town: ${final.s.slot}`);
  // 6. Node replays what the pages applied, the arena's own outcome included
  await grab(); const acts = pageActs;
  const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
  try {
    const G = await server.ssrLoadModule('/src/simulation/index.ts');
    let s = G.newGame(+seedS >>> 0, 'Aster'); G.makeV2(s);
    for (const a of acts) { const r = G.advance(s, a); if (!r.ok) check(false, `replay refused ${JSON.stringify(a).slice(0, 60)}: ${r.reason}`); else s = r.state; }
    check(G.hash(s) === final.h, `Node replay ${G.hash(s)} = browser ${final.h}`);
    check(acts.some((a) => a.type === 'fight') && (mode === 'later' ? acts.filter((a) => a.type === 'takeCard').length === 1 : acts.some((a) => a.type === 'takeCard')), `the pages applied: ${acts.map((a) => a.type).join(', ')}`);
  } finally { await server.close(); }
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
