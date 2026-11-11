// The default game's proof (journal Passe VD1, the operator's decision of 2026-11-09: « non je veux que toutes mes implementations soient dans la
// version par default afin de lancer direct le jeu via http://127.0.0.1:5173/ »; its sheet's choices, journal Passe VD2): in a browser that does not
// announce automation, as a person opens it, under Chrome's real autoplay rule and with a fake gamepad defined before the page's scripts (not used
// until the proof presses it):
//   1. the bare address shows the title screen (« New game » and « Explore the district », no « Continue » on a fresh profile), silent;
//   2. « New game » at the keyboard: its Enter is the first gesture and the title plays « titre » (VD-5); a name typed, Enter: the page goes to the
//      play mode's new game, an address without `v2`, and the game is a version 2 game (its flag, the dynamic rules, the ten days, its pad layer);
//   3. the sound on the game's first page: « titre » taken up where the title left it (SA-15), heard at the output;
//   4. the gamepad: A wakes it, its caps show, the stick walks the hero; the tutorial (journal Passe TU3): the tour of six bands at the pad, the guide from the
//      menu (its chapters, the days drawn from the game, the scene's live picture), the tour replayed (X) and skipped (B);
//   5. the bare address again: the title screen offers « Continue », the save a version 2 game;
//   6. « Explore the district » (VD-3): the version 2's look, the pad walks the hero, the town's piece of midday follows « titre »;
//   7. a save of today's game (v2=0): « Continue » marked « the earlier version » (VD-2).
// A DEV server or a production bundle (`vite preview`): no named state is used.
//   node tools/default-proof.mjs <outDir>   (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/default-proof.mjs <outDir>');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
// a headed window kept off-screen (the sound and the autoplay rule as a person has them; tools/audio/page-proof.mjs)
const b = await puppeteer.launch({ executablePath: exe, headless: false, args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--window-position=-3000,0', `--window-size=${W + 40},${H + 140}`, '--autoplay-policy=document-user-activation-required', '--no-first-run', '--no-default-browser-check', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, ignoreDefaultArgs: ['--enable-automation'], protocolTimeout: READY });
const XBOX = 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)';
const BTN = { A: 0, B: 1 };
let failed = 0, errors = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** a browser a person drives: the page must not see automation (tools/title-proof.mjs) */
// an English browser (journal Passe RG4: the game speaks the browser's language, RG-9, and this headed Chrome reports the operator's French Windows);
// the French has its own proofs (tools/settings-proof.mjs, PAGE_LANG=fr in tools/play-flow.mjs)
const HUMAN = `Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false }); Object.defineProperty(Navigator.prototype, 'language', { get: () => 'en-US' });`;
/** the fake pad (tools/pad-proof.mjs), defined before the page's scripts */
function fakePad(id) {
  const pad = { id, index: 0, connected: true, mapping: 'standard', timestamp: 0, buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0],
    vibrationActuator: { type: 'dual-rumble', playEffect: () => Promise.resolve('complete') } };
  window.__fakePad = pad;
  Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [window.__fakePad, null, null, null] });
  window.__padSet = (i, on) => { const x = pad.buttons[i]; x.pressed = on; x.touched = on; x.value = on ? 1 : 0; pad.timestamp = performance.now(); };
  window.__padAxes = (a) => { pad.axes = a.slice(); pad.timestamp = performance.now(); };
}

try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  await page.evaluateOnNewDocument(HUMAN);
  await page.evaluateOnNewDocument(fakePad, XBOX);
  const frames = (n = 3) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const press = async (i, hold = 90) => { await page.evaluate((i) => window.__padSet(i, true), i); await frames(3); await sleep(hold); await page.evaluate((i) => window.__padSet(i, false), i); await frames(3); await sleep(60); };
  const until = async (f, ms, what) => { const t0 = Date.now(); for (;;) { const v = await page.evaluate(f).catch(() => null); if (v) return v; if (Date.now() - t0 > ms) { check(false, `waited ${ms} ms for ${what}`); return null; } await sleep(150); } };
  const sound = () => page.evaluate(() => { const s = window.__sound; return { sound: !!s, ctx: s?.ctx?.state ?? null, now: s?.nowPlaying?.() ?? null, db: s?.ctx ? s.meter() : null }; });
  /** the meter's tap is made at its first reading (empty then): the loudest of a few readings over a second */
  const heard = async () => { let s = await sound(), db = -120; for (let i = 0; i < 8; i++) { s = await sound(); db = Math.max(db, s.db ?? -120); await sleep(150); } return { s, db }; };
  const focused = () => page.evaluate(() => document.activeElement?.dataset?.id ?? null);
  const walked = async () => {
    const p0 = await page.evaluate(() => ({ x: window.__app.actors.player.pos.x, z: window.__app.actors.player.pos.z }));
    await page.evaluate(() => window.__padAxes([1, 0, 0, 0]));
    await sleep(500);
    await page.evaluate(() => window.__padAxes([0, 0, 0, 0]));
    await frames(3);
    const p1 = await page.evaluate(() => ({ x: window.__app.actors.player.pos.x, z: window.__app.actors.player.pos.z }));
    return Math.hypot(p1.x - p0.x, p1.z - p0.z);
  };

  // 1. the bare address: the title screen, silent
  await page.goto(BASE, { waitUntil: 'load', timeout: READY });
  check(await page.evaluate(() => navigator.webdriver === false && location.search === ''), 'the bare address, in a browser that does not announce automation');
  await page.waitForSelector('#title-screen #title-menu .pm-btn', { timeout: READY });
  const buttons = await page.evaluate(() => [...document.querySelectorAll('#title-menu .pm-btn')].map((x) => x.dataset.id));
  check(buttons.join() === 'new,explore,settings', `the title screen: ${buttons.join(', ')} (no save, no « Continue »; « Settings » since journal Passe RG3)`);
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
  await sleep(1200);
  check((await sound()).ctx === null, 'no sound before the first gesture');
  await page.screenshot({ path: path.join(outDir, '1-title.png') });

  // 2. « New game » at the keyboard: its Enter is the first gesture, the title's music starts (VD-5) over the town behind
  check((await focused()) === 'new', '« New game » has the focus');
  await page.keyboard.press('Enter');
  await page.waitForSelector('#title-name', { timeout: 10000 });
  await page.keyboard.type('Aster');
  // past « titre »'s intro (6.7 s), two seconds into its loop
  await until(() => window.__sound?.ctx?.state === 'running' && window.__sound.nowPlaying?.()?.key === 'band:titre' && window.__sound.nowPlaying().pos > 2, 40000, 'the title\'s music two seconds into its loop');
  let h = await heard();
  check(h.s.ctx === 'running' && h.s.now?.key === 'band:titre' && h.db > -60, `the title plays « titre » from its first key: ${h.s.now?.key} at ${h.s.now?.pos?.toFixed(2)} s, ${h.db.toFixed(1)} dB at the output`);
  await page.screenshot({ path: path.join(outDir, '1b-title-name.png') });
  const onTitle = (await sound()).now?.pos ?? 0;
  const nav = page.waitForNavigation({ waitUntil: 'load', timeout: READY });
  await page.keyboard.press('Enter');
  await nav;
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
  const err = await page.evaluate(() => window.__error ?? null);
  check(!err, `the new game's page is ready${err ? `: ${err}` : ''}`);
  const q = await page.evaluate(() => location.search);
  check(/^\?play=1&new=1&name=Aster$/.test(q), `the address « New game » opens: ${q} (no v2 in it)`);
  const st = await page.evaluate(() => { const s = window.__game.state(); return { v2: s.flags.v2 ?? null, combat: s.flags.combat ?? null, day: s.day, slot: s.slot, place: s.place, name: s.player.name, kit: !!s.v2?.kit, foe: s.tournament.matches.find((m) => m.a === 'player' || m.b === 'player')?.day ?? null }; });
  check(st.v2 === true && st.combat === 'dynamic' && st.kit, `a version 2 game: ${JSON.stringify(st)}`);
  check(st.day === 1 && st.slot === 'morning' && st.place === 'district' && st.name === 'Aster' && st.foe === 2, `the first morning on the quay, the first bout on day 2 (the pool of the ten days): day ${st.day}, ${st.slot}, ${st.place}, bout on day ${st.foe}`);
  check(await page.evaluate(() => !!window.__pad), 'the version 2 pad layer is installed in its town');
  const clock = await page.evaluate(() => document.querySelector('#pm-state')?.textContent ?? document.body.innerText.slice(0, 200));
  check(/Day 1 \/ 10/i.test(clock), `the clock says ten days: ${clock.replace(/\s+/g, ' ').slice(0, 120)}`);

  // 3. the sound on the game's first page: « titre » taken up where the title left it, no intro again (SA-15)
  await sleep(1500);
  let s = await sound();
  console.log(`   on the new page, before any gesture there: ${JSON.stringify(s)}`);
  let gesture = false;
  if (s.ctx !== 'running') { await page.mouse.click(W / 2, H / 2); gesture = true; }
  await until(() => window.__sound?.ctx?.state === 'running' && !!window.__sound.nowPlaying?.(), 30000, 'the sound to run');
  s = await sound();
  check(s.now?.key === 'band:titre' && s.now.pos > onTitle, `the game takes « titre » up${gesture ? ' (after a click: the browser held the sound across the page)' : ' (the title\'s gesture carried)'}: ${s.now?.key} at ${s.now?.pos?.toFixed(2)} s, the title left it at ${onTitle.toFixed(2)} s`);
  h = await heard();
  check(h.s.ctx === 'running' && h.db > -60, `it is heard: ${h.db.toFixed(1)} dB at the output`);
  await page.screenshot({ path: path.join(outDir, '2-new-game.png') });

  // 4. the gamepad: A wakes it (or closes the news), the caps change, the stick walks the hero
  await press(BTN.A);
  const pad = await page.evaluate(() => ({ mode: window.__pad?.mode ?? null, family: window.__pad?.family ?? null, cap: document.querySelector('#pm-hints kbd')?.getAttribute('aria-label') ?? null }));
  check(pad.mode === 'pad' && pad.family === 'xbox', `A wakes the pad: ${JSON.stringify(pad)}`);
  // 4b. the tutorial (journal Passe TU3, the operator's sheet TU-1 to TU-12): A closed the arrival's news and the tour opens, six bands at the pad (A goes on), the
  // real clock, figures, list and menu lit; then the guide from the menu with the pad (Start, the D-pad to « Guide », A): thirteen chapters (journal Passe ECO2), the ten days drawn
  // from the game, the scene here as a live picture; X replays the tour, B leaves it
  const band1 = await until(() => document.querySelector('.tu-band .tu-step')?.textContent ?? null, 10000, 'the tour');
  check(band1 === 'Tour · 1 of 6', `the tour opens after the arrival's news: ${band1}`);
  const tourCaps = await page.evaluate(() => [...document.querySelectorAll('.tu-band .pm-foot kbd')].map((k) => k.getAttribute('aria-label') ?? k.textContent));
  check(tourCaps.join() === 'A,B', `its foot shows the pad's buttons: ${tourCaps.join(', ')}`);
  await page.screenshot({ path: path.join(outDir, '3-tour-1.png') });
  const lit = [];
  for (let i = 2; i <= 6; i++) {
    await sleep(320); await press(BTN.A);
    const r = await until(() => { const t = document.querySelector('.tu-band .tu-step')?.textContent; return t ? { t, lit: !!document.querySelector('.tu-spot.on') } : null; }, 5000, `band ${i}`);
    check(r?.t === `Tour · ${i} of 6`, `A goes on: ${r?.t}`);
    lit.push(r?.lit ? 'lit' : '-');
    if (i === 2) await page.screenshot({ path: path.join(outDir, '3-tour-2.png') });
  }
  check(lit.join() === 'lit,lit,lit,lit,-', `bands 2 to 5 light the real clock, figures, list and menu: ${lit.join(', ')}`);
  await sleep(320); await press(BTN.A);
  check(!!(await until(() => !document.querySelector('.tu-band') && !document.querySelector('.tu-spot'), 5000, 'the tour to end')), 'the last band plays on: the tour ends');
  // the people marked on the quay: the marks' hint once the tour is done (the operator's MK-11, journal Passe MK3), A closes it
  const mk = await until(() => document.querySelector('.tu-hint .pm-h')?.textContent ?? null, 5000, 'the marks\' hint');
  check(mk === 'Someone has something new', `the marks' hint after the tour: ${mk}`);
  await sleep(320); await press(BTN.A);
  check(!!(await until(() => !document.querySelector('.tu-hint'), 5000, 'the hint to close')), 'A closes the marks\' hint');
  await press(9);
  await until(() => !!document.querySelector('.pm-menu'), 5000, 'the menu');
  const items = await page.evaluate(() => [...document.querySelectorAll('.pm-menu .pm-body .pm-btn')].map((x) => x.textContent.trim()));
  const gi = items.findIndex((t) => /^Guide/.test(t));
  check(gi > 0, `the menu has « Guide »: ${items.join(' | ')}`);
  for (let k = 0; k < gi; k++) await press(13);
  await press(BTN.A);
  const g = await until(() => (document.querySelector('.tu-guide') ? { n: document.querySelectorAll('.tu-guide .pm-glist .pm-btn').length, days: document.querySelectorAll('.tu-days div').length } : null), 5000, 'the guide');
  check(g?.n === 13 && g?.days === 10, `the guide: ${g?.n} chapters, the tournament's ${g?.days} days drawn from the game`);
  await press(13); await press(13);
  const pic = await until(() => document.querySelector('.tu-guide .tu-fig img')?.getAttribute('src')?.slice(0, 23) ?? null, 5000, 'the scene\'s picture');
  check(pic === 'data:image/webp;base64,', `« Walking and talking » shows the scene here, taken as the guide opened: ${pic}`);
  await page.screenshot({ path: path.join(outDir, '3-guide.png') });
  await sleep(320); await press(2);
  check((await until(() => document.querySelector('.tu-band .tu-step')?.textContent ?? null, 5000, 'the tour replayed')) === 'Tour · 1 of 6', 'X replays the tour from the guide');
  await sleep(320); await press(BTN.B);
  check(!!(await until(() => !document.querySelector('.tu-band'), 5000, 'the tour to be skipped')), 'B skips the tour');
  if (await page.evaluate(() => !!document.querySelector('.pm-overlay'))) await press(BTN.B);
  const d = await walked();
  check(d > 0.3, `the stick walks the hero: ${d.toFixed(2)} m in 0.5 s`);
  const caps = await page.evaluate(() => [...document.querySelectorAll('#pm-hints kbd')].map((k) => k.getAttribute('aria-label') ?? k.textContent));
  check(caps.length > 0 && caps.every((c) => c && !/^(Q|Esc)$/.test(c)), `the caps show the pad's buttons: ${caps.join(', ')}`);
  await page.screenshot({ path: path.join(outDir, '3-pad.png') });

  // 5. the bare address again: « Continue », a version 2 save, nothing more said under it
  await page.goto(BASE, { waitUntil: 'load', timeout: READY });
  await page.waitForSelector('#title-screen #title-menu .pm-btn', { timeout: READY });
  const again = await page.evaluate(() => ({ ids: [...document.querySelectorAll('#title-menu .pm-btn')].map((x) => x.dataset.id), line: document.querySelector('#title-menu [data-id="continue"] .line')?.textContent ?? null }));
  check(again.ids.join() === 'continue,new,explore,settings' && !/earlier/.test(again.line ?? ''), `the title screen again offers « Continue »: ${again.ids.join(', ')} — ${again.line}`);
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
  await page.screenshot({ path: path.join(outDir, '4-title-continue.png') });

  // 6. « Explore the district » (VD-3): the arrows to it, Enter; the version 2's look, the pad walks the hero, the town's piece of midday follows « titre »
  for (let i = 0; i < 4 && (await focused()) !== 'explore'; i++) await page.keyboard.press('ArrowDown');
  check((await focused()) === 'explore', '« Explore the district » reached at the keyboard');
  await page.keyboard.press('Enter');
  await page.waitForFunction(() => !document.getElementById('title-screen'), { timeout: 20000 });
  const ex = await page.evaluate(() => { const p = window.__app.opts.params; return { search: location.search, time: p.get('time'), herolook: p.get('herolook'), heraldry: p.get('heraldry'), skyline: p.get('skyline') }; });
  check(ex.search === '' && ex.time === 'midday' && ex.herolook === '1' && ex.heraldry === 'tournament' && ex.skyline === 'arena', `Explore: the town at midday in the version 2's look, the address unchanged: ${JSON.stringify(ex)}`);
  await press(BTN.A);
  const de = await walked();
  check(de > 0.3, `the stick walks the hero in Explore: ${de.toFixed(2)} m in 0.5 s`);
  await until(() => window.__sound?.nowPlaying?.()?.key === 'band:midi', 30000, 'the town\'s piece of midday');
  s = await sound();
  check(s.ctx === 'running' && s.now?.key === 'band:midi', `Explore plays the town's piece of midday: ${s.now?.key} at ${s.now?.pos?.toFixed(2)} s`);
  await page.screenshot({ path: path.join(outDir, '5-explore.png') });

  // 7. a save of today's game (v2=0, a tool's address) on the title screen: « Continue » marked « the earlier version » (VD-2)
  await page.goto(`${BASE}?play=1&new=1&name=Old&v2=0&noreload=1&vis=0`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
  check(await page.evaluate(() => window.__game.state().flags.v2 !== true), 'a game of today saved (v2=0)');
  await page.goto(BASE, { waitUntil: 'load', timeout: READY });
  await page.waitForSelector('#title-screen #title-menu .pm-btn', { timeout: READY });
  const old = await page.evaluate(() => document.querySelector('#title-menu [data-id="continue"] .line')?.textContent ?? null);
  check(/^Old · day 1, morning · the earlier version$/.test(old ?? ''), `« Continue » says the earlier version: ${old}`);
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
  await page.screenshot({ path: path.join(outDir, '6-title-earlier.png') });
} finally {
  await b.close();
}
check(errors === 0, `no page error (${errors})`);
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
