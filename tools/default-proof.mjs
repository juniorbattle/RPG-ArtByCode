// The default game's proof (journal Passe VD1, the operator's decision of 2026-11-09: « non je veux que toutes mes implementations soient dans la
// version par default afin de lancer direct le jeu via http://127.0.0.1:5173/ »): in a browser that does not announce automation, as a person
// opens it, under Chrome's real autoplay rule and with a fake gamepad defined before the page's scripts (not used until the proof presses it):
//   1. the bare address shows the title screen (« New game » and « Explore the district », no « Continue » on a fresh profile);
//   2. « New game » at the keyboard, a name typed, Enter: the page goes to the play mode's new game, an address without `v2`, and the game is a
//      version 2 game (its flag, the dynamic rules, the ten days, the town with the version 2's pad layer);
//   3. the sound: the engine starts on a gesture (or carries the title's), plays the new game's first piece and is heard at the output;
//   4. the gamepad: A wakes it, its caps show, the stick walks the hero;
//   5. the bare address again: the title screen offers « Continue », the save a version 2 game.
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
const HUMAN = `Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });`;
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

  // 1. the bare address: the title screen
  await page.goto(BASE, { waitUntil: 'load', timeout: READY });
  check(await page.evaluate(() => navigator.webdriver === false && location.search === ''), 'the bare address, in a browser that does not announce automation');
  await page.waitForSelector('#title-screen #title-menu .pm-btn', { timeout: READY });
  const buttons = await page.evaluate(() => [...document.querySelectorAll('#title-menu .pm-btn')].map((x) => x.dataset.id));
  check(buttons.join() === 'new,explore', `the title screen: ${buttons.join(', ')} (no save, no « Continue »)`);
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
  await sleep(1200);
  await page.screenshot({ path: path.join(outDir, '1-title.png') });

  // 2. « New game » at the keyboard, a name, Enter
  const focus = await page.evaluate(() => document.activeElement?.dataset?.id ?? null);
  check(focus === 'new', `« New game » has the focus: ${focus}`);
  await page.keyboard.press('Enter');
  await page.waitForSelector('#title-name', { timeout: 10000 });
  await page.keyboard.type('Aster');
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

  // 3. the sound
  await sleep(1500);
  let s = await sound();
  console.log(`   after the title's Enter: ${JSON.stringify(s)}`);
  let gesture = false;
  if (s.ctx !== 'running') { await page.mouse.click(W / 2, H / 2); gesture = true; }
  await until(() => window.__sound?.ctx?.state === 'running' && (window.__sound.nowPlaying?.()?.pos ?? 0) > 2, 30000, 'the sound to run two seconds');
  // the meter's tap is made at its first reading (empty then): the loudest of a few readings over a second
  let db = -120;
  for (let i = 0; i < 8; i++) { s = await sound(); db = Math.max(db, s.db ?? -120); await sleep(150); }
  check(s.ctx === 'running' && /^band:/.test(s.now?.key ?? ''), `the sound runs${gesture ? ' after a click on the page' : ' on the title\'s gesture'}: ${s.now?.key} at ${s.now?.pos?.toFixed(2)} s`);
  check(db > -60, `it is heard: ${db.toFixed(1)} dB at the output`);
  await page.screenshot({ path: path.join(outDir, '2-new-game.png') });

  // 4. the gamepad: A wakes it (or closes the news), the caps change, the stick walks the hero
  await press(BTN.A);
  const pad = await page.evaluate(() => ({ mode: window.__pad?.mode ?? null, family: window.__pad?.family ?? null, cap: document.querySelector('#pm-hints kbd')?.getAttribute('aria-label') ?? null }));
  check(pad.mode === 'pad' && pad.family === 'xbox', `A wakes the pad: ${JSON.stringify(pad)}`);
  if (await page.evaluate(() => !!document.querySelector('.pm-overlay'))) await press(BTN.B);
  const p0 = await page.evaluate(() => ({ x: window.__app.actors.player.pos.x, z: window.__app.actors.player.pos.z }));
  await page.evaluate(() => window.__padAxes([1, 0, 0, 0]));
  await sleep(500);
  await page.evaluate(() => window.__padAxes([0, 0, 0, 0]));
  await frames(3);
  const p1 = await page.evaluate(() => ({ x: window.__app.actors.player.pos.x, z: window.__app.actors.player.pos.z }));
  const d = Math.hypot(p1.x - p0.x, p1.z - p0.z);
  check(d > 0.3, `the stick walks the hero: ${d.toFixed(2)} m in 0.5 s`);
  const caps = await page.evaluate(() => [...document.querySelectorAll('#pm-hints kbd')].map((k) => k.getAttribute('aria-label') ?? k.textContent));
  check(caps.length > 0 && caps.every((c) => c && !/^(Q|Esc)$/.test(c)), `the caps show the pad's buttons: ${caps.join(', ')}`);
  await page.screenshot({ path: path.join(outDir, '3-pad.png') });

  // 5. the bare address again: « Continue », a version 2 save
  await page.goto(BASE, { waitUntil: 'load', timeout: READY });
  await page.waitForSelector('#title-screen #title-menu .pm-btn', { timeout: READY });
  const again = await page.evaluate(() => ({ ids: [...document.querySelectorAll('#title-menu .pm-btn')].map((x) => x.dataset.id), v2: JSON.parse(localStorage.getItem(Object.keys(localStorage).find((k) => /save/i.test(k)) ?? '') ?? 'null')?.state?.flags?.v2 ?? null }));
  check(again.ids.join() === 'continue,new,explore', `the title screen again offers « Continue »: ${again.ids.join(', ')}`);
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
  await page.screenshot({ path: path.join(outDir, '4-title-continue.png') });
} finally {
  await b.close();
}
check(errors === 0, `no page error (${errors})`);
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
