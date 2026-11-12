// The tutorial's proof at the keyboard (journal Passe TU3, the operator's sheet TU-1 to TU-12; the gamepad and the bare address: tools/default-proof.mjs):
//   1. a new game (tutorial=1: a driven browser keeps today's flow without it): the arrival's news, then the tour of six bands at Enter, the real clock,
//      figures, list and menu lit; Esc skips the tour when it is replayed;
//   2. the guide on H: thirteen chapters (« Earning coins » since journal Passe ECO2) walked with the arrows, every chapter's text filled from the game (no brace left), the ten days, the scene here as a
//      live picture, the quay kept for « The Cité and its squares »; Esc closes it;
//   3. the hints, each once: the shop (a keeper's goods), the theft (the list), then the next pages as the game goes on: the eve of the first bout (day 1,
//      afternoon), Space opening its chapter of the guide; the first square (the forecourt), its picture kept beside the quay's; the evening; none twice;
//   4. a game begun before, in a fresh profile: « Continue » hears the guide's line once (TU-8), no tour;
//   5. today's game (v2=0): no tour, no hint, no « Guide » in its menu;
//   6. the first bout: the duel played by the computer since lot 2 (journal Passe LC3), none of the first duel's lessons of journal Passe TU4 (they taught the three
//      buttons of before; lot 3 writes this duel's tutorial), the duel not held.
// DEV or production server: no named state is used.
//   node tools/tutorial-proof.mjs <outDir>   (BASE_URL, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/tutorial-proof.mjs <outDir>');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 }, protocolTimeout: READY });
let failed = 0, errors = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(page, q) {
  await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
  const err = await page.evaluate(() => window.__error ?? null);
  check(!err, `the page ${q} is ready${err ? `: ${err}` : ''}`);
  await sleep(1200);
}
const until = async (page, f, ms, what, arg) => { const t0 = Date.now(); for (;;) { const v = await page.evaluate(f, arg).catch(() => null); if (v) return v; if (Date.now() - t0 > ms) { check(false, `waited ${ms} ms for ${what}`); return null; } await sleep(120); } };
const key = async (page, k) => { await page.keyboard.press(k); await sleep(330); };
const hintTitle = (page) => page.evaluate(() => document.querySelector('.tu-hint .pm-h')?.textContent ?? null);
/** the next page of the play mode (the game saved it; `noreload` leaves its address in __go) */
async function next(page) {
  const go = await page.evaluate(() => window.__go); check(!!go, `the next page: ${go}`); await open(page, go);
  // the news of the slot that ended are read first (the hints wait for them)
  const news = await page.evaluate(() => { const b = document.querySelector('.pm-overlay:not(.tu-hint):not(.tu-band) .pm-btn'); if (!b) return null; const t = b.closest('.pm-card')?.querySelector('.pm-h')?.textContent ?? ''; b.click(); return t; });
  if (news) console.log(`   the page's news read: ${news}`);
}

try {
  const page = await b.newPage();
  // a real gamepad plugged into the machine reaches headless Chrome (the operator's, journal Passe RM3: its drift pressed keys in a proof): hidden; PAD=1 keeps it
  if (!process.env.PAD) await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });

  // 1. a new game: the news, then the tour at the keyboard
  await open(page, '?play=1&new=1&name=Aster&noreload=1&tutorial=1');
  check(await page.evaluate(() => !!document.querySelector('.pm-overlay .pm-h') && !document.querySelector('.tu-band')), 'the arrival\'s news come first, the tour waits');
  await key(page, 'Enter');
  const steps = [];
  for (let i = 1; i <= 6; i++) {
    const r = await until(page, () => { const t = document.querySelector('.tu-band .tu-step')?.textContent; return t ? { t, h: document.querySelector('.tu-band .pm-h').textContent, lit: !!document.querySelector('.tu-spot.on') } : null; }, 5000, `band ${i}`);
    steps.push(r ? `${r.h}${r.lit ? ' (lit)' : ''}` : '-');
    check(r?.t === `Tour · ${i} of 6`, `band ${i}: ${r?.h}`);
    if (i === 2) await page.screenshot({ path: path.join(outDir, '1-tour-clock.png') });
    await key(page, 'Enter');
  }
  check(steps.filter((x) => x.endsWith('(lit)')).length === 4, `the clock, figures, list and menu lit: ${steps.join(' | ')}`);
  check(await page.evaluate(() => !document.querySelector('.tu-band') && !document.querySelector('.tu-spot') && !document.body.classList.contains('tu-on')), 'Enter on the last band: the tour ends, nothing left');
  // the people marked on the quay (Mara, her stall and her crates): the marks' hint once the tour is done (the operator's MK-11, journal Passe MK3), then away
  const mk = await until(page, () => { const h = document.querySelector('.tu-hint .pm-h')?.textContent; return h ? { h, body: document.querySelector('.tu-hint .pm-body').textContent, marks: (window.__people?.marks.state() ?? []).map((m) => `${m.who}:${m.kind}`) } : null; }, 5000, 'the marks\' hint');
  check(mk?.h === 'Someone has something new' && /diamond/.test(mk.body), `the marks' hint after the tour: ${mk?.h}`);
  check(!!mk?.marks.includes('mara:item'), `Mara marked on the first morning: ${mk?.marks.join(', ')}`);
  await key(page, 'Enter');

  // 2. the guide on H
  await key(page, 'h');
  const n = await until(page, () => document.querySelectorAll('.tu-guide .pm-glist .pm-btn').length, 5000, 'the guide');
  check(n === 13, `H opens the guide: ${n} chapters`);
  const seen = [];
  for (let i = 0; i < 12; i++) {
    const c = await page.evaluate(() => ({ t: document.querySelector('.tu-guide section:last-child .pm-h').textContent, body: document.querySelector('.tu-guide .pm-detail').textContent, img: document.querySelectorAll('.tu-guide .pm-detail img').length, days: document.querySelectorAll('.tu-days div').length }));
    seen.push(c);
    if (i === 3) await page.screenshot({ path: path.join(outDir, '2-guide-places.png') });
    await key(page, 'ArrowDown');
  }
  check(seen.every((c) => c.body.length > 120 && !/[{}]/.test(c.body)), `every chapter filled from the game: ${seen.map((c) => c.t).join(' | ')}`);
  check(seen[0].days === 10, 'the tournament drawn from the game (ten days)');
  check(seen[2].img === 1, '« Walking and talking »: the scene here, a live picture');
  check(seen[3].img === 1 && /Not visited yet/.test(seen[3].body), `« The Cité and its squares »: the quay kept, the squares to discover (${seen[3].img} picture)`);
  await key(page, 'Escape');
  check(await page.evaluate(() => !document.querySelector('.tu-guide')), 'Esc closes the guide');

  // 3. the hints: the shop, the theft; then the eve, the square, the evening
  await page.evaluate(() => window.__ui.openShop('mara'));
  check((await until(page, () => document.querySelector('.tu-hint .pm-h')?.textContent, 4000, 'the shop\'s hint')) === 'Bargaining', 'a keeper\'s goods: the bargaining hint, over the page');
  await page.screenshot({ path: path.join(outDir, '3-hint-shop.png') });
  await key(page, 'Enter');
  check(await page.evaluate(() => !document.querySelector('.tu-hint') && !!document.querySelector('.pm-goods') && document.activeElement?.closest('.pm-goods') !== null), 'Enter: the hint closes, the goods page keeps the focus');
  await key(page, 'Escape'); await key(page, 'Escape');
  await page.evaluate(() => window.__ui.openShop('mara'));
  await sleep(500);
  check(!(await hintTitle(page)), 'the shop\'s hint is not said twice');
  await key(page, 'Escape'); await key(page, 'Escape');
  await key(page, 'q');
  check((await until(page, () => document.querySelector('.tu-hint .pm-h')?.textContent, 4000, 'the theft\'s hint')) === 'Stealing', 'the list offers a theft: the stealing hint');
  await key(page, 'Enter'); await key(page, 'Escape');
  // the morning passes: the afternoon of day 1 is the eve of the bout of day 2
  check((await page.evaluate(() => window.__ui.run({ type: 'wait' }))).ok, 'the morning passes (wait)');
  await next(page);
  check((await until(page, () => document.querySelector('.tu-hint .pm-h')?.textContent, 6000, 'the eve\'s hint')) === 'Your bout is tomorrow', 'day 1, afternoon: the eve of the first bout');
  await key(page, ' ');
  const ch = await until(page, () => document.querySelector('.tu-guide .pm-btn.on')?.textContent ?? null, 4000, 'the chapter');
  check(/^Preparing a bout/.test(ch ?? ''), `Space opens its chapter: ${ch}`);
  await key(page, 'Escape');
  // the forecourt: the square's hint, its picture kept beside the quay's
  check((await page.evaluate(() => window.__ui.run({ type: 'move', to: 'forecourt' }))).ok, 'to the Arena Forecourt');
  await next(page);
  check((await until(page, () => document.querySelector('.tu-hint .pm-h')?.textContent, 15000, 'the square\'s hint')) === 'A square of the Cité', 'the first square: its hint');
  await key(page, 'Enter');
  await key(page, 'h'); await key(page, 'ArrowDown'); await key(page, 'ArrowDown'); await key(page, 'ArrowDown');
  const pics = await page.evaluate(() => [...document.querySelectorAll('.tu-places figure')].map((f) => (f.querySelector('img') ? 'kept' : 'unseen')));
  check(pics.join() === 'kept,kept,unseen,unseen', `the places as they were walked: ${pics.join(', ')}`);
  await page.screenshot({ path: path.join(outDir, '4-guide-places-kept.png') });
  await key(page, 'Escape');
  // the evening
  check((await page.evaluate(() => window.__ui.run({ type: 'wait' }))).ok, 'the afternoon passes (wait)');
  await next(page);
  check((await until(page, () => document.querySelector('.tu-hint .pm-h')?.textContent, 15000, 'the evening\'s hint')) === 'The evening', 'the first evening: its hint');
  await key(page, 'Enter');
  // the next day's morning: nothing said again
  check((await page.evaluate(() => window.__ui.run({ type: 'wait' }))).ok, 'the evening passes (wait)');
  await next(page);
  await sleep(1500);
  check(!(await hintTitle(page)) && !(await page.evaluate(() => document.querySelector('.tu-band'))), 'day 2, morning: no tour, no hint said again');

  // 6. the first bout (journal Passe TU4, TU-11): day 2's afternoon, the match sheet, the arena; the duel holds the first time each thing comes up and says it,
  // Enter takes it up again; what the bout does not reach in its first minute and a half is given to the coach as the duel would emit it; Esc skips the rest
  check((await page.evaluate(() => window.__ui.run({ type: 'wait' }))).ok, 'the morning of day 2 passes (wait)');
  await next(page);
  await page.evaluate(() => window.__ui.openSkills(true));
  await sleep(600);
  await page.evaluate(() => [...document.querySelectorAll('.pm-overlay .pm-foot .pm-btn.primary')].pop()?.click());
  await sleep(300);
  const arenaAt = await page.evaluate(() => window.__go);
  check(/scene=arena/.test(arenaAt ?? ''), `the match sheet opens the arena: ${arenaAt}`);
  await open(page, arenaAt);
  await page.evaluate(() => document.querySelector('.pm-overlay.pm-band .pm-btn.primary')?.click());
  // the duel played by the computer since lot 2 (journal Passe LC3): the first duel's lessons (TU-11) taught the three buttons of before and have none of its
  // moments; the bout shows none of them and is not held, until lot 3 writes this duel's tutorial
  await sleep(3000);
  const bout = await page.evaluate(() => ({ rules: window.__arena.rules, band: !!document.querySelector('.tu-duel'), paused: window.__arena.paused, t: window.__arena.snapshot().t }));
  check(bout.rules === 'auto' && !bout.band && !bout.paused && bout.t > 1, `the first bout: the duel played by the computer, no lesson, not held (t ${bout.t})`);
  await page.screenshot({ path: path.join(outDir, '6-duel.png') });
  await page.close();

  // 4. a game begun before, in a fresh profile: the guide's line once
  const ctx = await b.createBrowserContext();
  const p2 = await ctx.newPage();
  if (!process.env.PAD) await p2.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  p2.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  await open(p2, '?play=1&new=1&name=Old&noreload=1&tutorial=0');
  await open(p2, '?play=1&noreload=1&tutorial=1');
  await p2.evaluate(() => document.querySelector('.pm-overlay:not(.tu-hint) .pm-btn')?.click());
  check((await until(p2, () => document.querySelector('.tu-hint .pm-h')?.textContent, 6000, 'the guide\'s line')) === 'New: the guide', '« Continue » on a game begun before: the guide\'s line, no tour');
  check(!(await p2.evaluate(() => document.querySelector('.tu-band'))), 'no tour on a game begun before');
  await p2.screenshot({ path: path.join(outDir, '5-continue-line.png') });
  await key(p2, 'Enter');
  await open(p2, '?play=1&noreload=1&tutorial=1');
  await p2.evaluate(() => document.querySelector('.pm-overlay:not(.tu-hint) .pm-btn')?.click());
  await sleep(1200);
  check(!(await hintTitle(p2)), 'the line is said once');
  await ctx.close();

  // 5. today's game (v2=0): none of it
  const ctx3 = await b.createBrowserContext();
  const p3 = await ctx3.newPage();
  if (!process.env.PAD) await p3.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  p3.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  await open(p3, '?play=1&new=1&name=Then&noreload=1&v2=0&tutorial=1');
  await p3.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
  await sleep(1500);
  check(!(await p3.evaluate(() => document.querySelector('.tu-band, .tu-hint'))), 'today\'s game: no tour, no hint');
  await key(p3, 'Escape');
  const menu = await p3.evaluate(() => [...document.querySelectorAll('.pm-menu .pm-body .pm-btn')].map((x) => x.textContent.trim()));
  check(menu.length > 0 && !menu.some((t) => /^Guide/.test(t)), `today's game's menu has no « Guide »: ${menu.join(' | ')}`);
  await ctx3.close();
} finally { await b.close(); }
check(errors === 0, `no page error (${errors})`);
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
