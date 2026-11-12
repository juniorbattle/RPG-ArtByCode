// The player's keys (the remapping sheet, journal Passes RM1 / RM2, ten of ten at the recommendation), proven at the keyboard in a browser that does not
// announce automation. The keys are typed as a real keyboard sends them (the DevTools protocol's key events, trusted, each with its place `code` and the
// character `key`), a fake gamepad defined before the page's scripts:
//   1. a fresh profile: nothing kept, today's keys (W walks, the list's cap Q, the controls' slots W / Up ... Space);
//   2. the controls: Enter on a slot waits for a key, I typed: walk up is I, kept in `cite-du-tournoi.settings`, said on its line; I walks, W no more,
//      the arrow still (RM-2); the title's line names I;
//   3. a key taken in the same moment swaps (RM-4): run on E, talk takes Shift, both said; Tab refused (reserved), Esc cancels a wait without closing
//      the page; Backspace empties a second slot, never an action's last key; the pad's A waits, its B cancels (the pad gives no key, RM-3);
//   4. the list on L: its cap at the foot of the screen shows L, L opens and closes it (RM-6);
//   5. talk on F: a cutscene's next line follows F, E (run now) does not; Enter still;
//   6. the duel: attack on U: U held charges and its bar's cap shows U, J no more, the second slot's 1 still; the menu's caps the player's;
//   7. AZERTY: each keyboard keeps its keys (RM-5): the AZERTY table at its starting keys, a real AZERTY keyboard's Z walks, its A opens the list,
//      its top-row « 1 » (typing « & ») charges in the duel; the map moved on AZERTY, QWERTY's kept;
//   8. the French names (RM-7): Espace, Maj, Échap on the caps;
//   9. Explore's tool keys give way (RM-4): F toggles the forge, but not once talk is on F; « Default keys » puts the starting keys back.
// A DEV server (named states).   node tools/remap-proof.mjs <outDir>   (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/remap-proof.mjs <outDir>');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1600), H = +(process.env.H || 900), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--lang=en-US', '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const XBOX = 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)';
const PAD = { A: 0, B: 1 };
let failed = 0, errors = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const HUMAN = `Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });`;
function fakePad(id) {
  const pad = { id, index: 0, connected: true, mapping: 'standard', timestamp: 0, buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0],
    vibrationActuator: { type: 'dual-rumble', playEffect: () => Promise.resolve('complete') } };
  window.__fakePad = pad;
  Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [window.__fakePad, null, null, null] });
  window.__padSet = (i, on) => { const x = pad.buttons[i]; x.pressed = on; x.touched = on; x.value = on ? 1 : 0; pad.timestamp = performance.now(); };
}
/** a key's Windows virtual key code by its place (enough for the keys typed here) */
const VK = (code) => (/^Key[A-Z]$/.test(code) ? code.charCodeAt(3) : /^Digit\d$/.test(code) ? 48 + +code[5] : ({ Enter: 13, Escape: 27, Tab: 9, Backspace: 8, Space: 32, ArrowUp: 38, ArrowLeft: 37, ShiftLeft: 16, Semicolon: 186 })[code] ?? 0);

try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  await page.evaluateOnNewDocument(HUMAN);
  await page.evaluateOnNewDocument(fakePad, XBOX);
  const cdp = await page.createCDPSession();
  const frames = (n = 3) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  /** a real key: its place and what it types */
  // (Enter types « \r », as a keyboard does: without it a focused button is not pressed)
  const send = (type, code, key) => { const text = key === 'Enter' ? '\r' : key.length === 1 ? key : ''; return cdp.send('Input.dispatchKeyEvent', { type, code, key, windowsVirtualKeyCode: VK(code), nativeVirtualKeyCode: VK(code), ...(type === 'keyDown' && text ? { text, unmodifiedText: text } : {}) }); };
  const tap = async (code, key) => { await send('keyDown', code, key); await frames(2); await send('keyUp', code, key); await frames(2); await sleep(80); };
  const hold = async (code, key, ms = 500) => { await send('keyDown', code, key); await sleep(ms); await send('keyUp', code, key); await frames(3); };
  const pad = async (i) => { await page.evaluate((i) => window.__padSet(i, true), i); await frames(3); await sleep(90); await page.evaluate((i) => window.__padSet(i, false), i); await frames(3); await sleep(80); };
  const until = async (f, ms, what, arg) => { const t0 = Date.now(); for (;;) { const v = await page.evaluate(f, arg).catch(() => null); if (v) return v; if (Date.now() - t0 > ms) { check(false, `waited ${ms} ms for ${what}`); return null; } await sleep(150); } };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('cite-du-tournoi.settings') ?? 'null'));
  const pos = () => page.evaluate(() => { const p = window.__app.actors.player.pos; return { x: p.x, z: p.z }; });
  const walked = async (code, key) => { const p0 = await pos(); await hold(code, key); const p1 = await pos(); return Math.hypot(p1.x - p0.x, p1.z - p0.z); };
  const slots = (act) => page.evaluate((a) => [...document.querySelectorAll(`.pm-slot[data-act="${a}"]`)].map((x) => x.textContent), act);
  const said = (act) => page.evaluate((a) => document.querySelector(`.pm-keys tr[data-row="${a}"] .why`)?.textContent ?? '', act);
  const game = async (extra = '') => {
    await page.goto(`${BASE}?play=1&noreload=1&state=v2-day1-morning&name=Aster&vis=0&tutorial=0${extra}`, { waitUntil: 'load', timeout: READY });
    await page.waitForFunction('window.__ready === true && !!window.__ui', { timeout: READY });
    await sleep(900);
    for (let i = 0; i < 4 && await page.evaluate(() => !!document.querySelector('.pm-overlay .pm-btn, .pm-band')); i++) { await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn, .pm-band .pm-btn')?.click()); await sleep(300); }
  };
  const controls = async () => {
    await page.evaluate(() => window.__ui.openSettings('controls'));
    await until(() => document.querySelectorAll('.pm-slot').length === 36, 5000, 'the controls\' slots');
  };
  /** a slot given a key from the controls: the slot focused, Enter, the key */
  const give = async (act, col, code, key) => {
    await page.evaluate((a, c) => document.querySelector(`.pm-slot[data-act="${a}"][data-col="${c}"]`).focus(), act, col);
    await tap('Enter', 'Enter');
    const waiting = await page.evaluate(() => document.activeElement?.classList.contains('wait'));
    if (code) await tap(code, key);
    return waiting;
  };
  const close = async () => { await tap('Escape', 'Escape'); await until(() => !document.querySelector('.pm-settings'), 3000, 'the page closed'); };

  // 1. a fresh profile: today's keys
  await game();
  check(await page.evaluate(() => navigator.webdriver === false), 'a browser that does not announce automation');
  check((await stored()) === null, 'nothing kept on a fresh profile');
  check(await page.evaluate(() => document.querySelector('#pm-hints kbd')?.outerHTML === '<kbd data-bind="list">Q</kbd>'), 'the list\'s cap: Q, by its action');
  check(await walked('KeyW', 'w') > 0.3, 'W walks');
  await controls();
  const start = await page.evaluate(() => [...document.querySelectorAll('.pm-slot')].map((x) => x.textContent).join(' '));
  check(start === 'W Up S Down A Left D Right Shift — E Space Q — M — J — T — K — G — V — H — N — J 1 L A Space —', `today's keys in the slots: ${start}`);
  await page.screenshot({ path: path.join(outDir, '1-controls.png') });

  // 2. walk up on I
  check(await give('up', 0, 'KeyI', 'i'), 'Enter on a slot waits for a key');
  check((await slots('up')).join() === 'I,Up', `walk up: ${(await slots('up')).join(' ')}`);
  check(JSON.stringify((await stored())?.keys) === JSON.stringify({ qwerty: { up: [{ c: 'KeyI', k: 'i' }, { c: 'ArrowUp', k: 'ArrowUp' }] } }), `kept: ${JSON.stringify((await stored())?.keys)}`);
  check((await said('up')) === 'I: Walk up.', `said on its line: ${await said('up')}`);
  await close();
  check(await walked('KeyI', 'i') > 0.3, 'I walks');
  check(await walked('KeyW', 'w') < 0.05, 'W does not any more');
  check(await walked('ArrowUp', 'ArrowUp') > 0.3, 'the arrow, the second slot, still walks');
  await page.goto(BASE, { waitUntil: 'load', timeout: READY });
  await page.waitForSelector('#title-screen .keys', { timeout: READY });
  const line = await page.evaluate(() => document.querySelector('#title-screen .keys')?.textContent);
  check(line === 'Keyboard: arrows or IASD to walk, E to talk', `the title's line: ${line}`);

  // 3. a swap, a refusal, a cancel, an empty slot, the last key kept, the pad
  await game(); await controls();
  await give('run', 0, 'KeyE', 'e');
  check((await slots('run')).join() === 'E,—' && (await slots('talk')).join() === 'Shift,Space', `run on E, talk takes Shift: ${(await slots('run')).join(' ')} / ${(await slots('talk')).join(' ')}`);
  check((await said('run')) === 'E: Run (held). Talk, take a way out takes Shift.', `the swap said: ${await said('run')}`);
  await give('map', 0, 'Tab', 'Tab');
  check((await slots('map')).join() === 'M,—' && /^Tab stays with the game or the browser/.test(await said('map')), `Tab refused: ${await said('map')}`);
  await give('map', 0, null);
  await tap('Escape', 'Escape');
  check(await page.evaluate(() => !!document.querySelector('.pm-settings') && !document.querySelector('.pm-slot.wait')), 'Esc cancels a wait, the page stays open');
  await give('talk', 1, 'Backspace', 'Backspace');
  check((await slots('talk')).join() === 'Shift,—', `Backspace empties the second slot: ${(await slots('talk')).join(' ')}`);
  await give('list', 0, 'Backspace', 'Backspace');
  check((await slots('list')).join() === 'Q,—' && (await said('list')) === 'What can be done here needs at least one key.', `the last key kept: ${await said('list')}`);
  await page.evaluate(() => document.querySelector('.pm-slot[data-act="map"][data-col="0"]').focus());
  await pad(PAD.A);
  check(await page.evaluate(() => document.activeElement?.classList.contains('wait')), 'the pad\'s A waits on a slot');
  await pad(PAD.B);
  check(await page.evaluate(() => !!document.querySelector('.pm-settings') && !document.querySelector('.pm-slot.wait')) && (await slots('map')).join() === 'M,—', 'its B cancels: the pad gives no key');
  await tap('KeyQ', 'q');   // a key pressed gives the keyboard's caps back

  // 4. the list on L
  await give('list', 0, 'KeyL', 'l');
  await close();
  check(await page.evaluate(() => document.querySelector('#pm-hints kbd')?.textContent === 'L'), 'the list\'s cap shows L');
  await tap('KeyL', 'l');
  check(await until(() => !!document.querySelector('[data-here]'), 3000, 'the list'), 'L opens the list');
  await tap('KeyL', 'l');
  check(await until(() => !document.querySelector('[data-here]'), 3000, 'the list closed'), 'L closes it');
  await tap('KeyQ', 'q');
  check(!(await page.evaluate(() => !!document.querySelector('[data-here]'))), 'Q does not open it any more');

  // 5. talk on F: a cutscene's lines
  await controls();
  await give('talk', 0, 'KeyF', 'f');
  await close();
  await page.goto(`${BASE}?play=1&state=v2-gate-day6&vis=0&noreload=1&cutscene=1&tutorial=0`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true', { timeout: READY });
  for (let i = 0; i < 40 && !(await page.evaluate(() => !!document.querySelector('.pm-scene q'))); i++) { await page.evaluate(() => [...document.querySelectorAll('.pm .pm-btn')].find((x) => /Go on|Continue/.test(x.textContent))?.click()); await sleep(250); }
  const lineOf = () => page.evaluate(() => document.querySelector('.pm-scene q')?.textContent ?? '');
  const l0 = await lineOf();
  check(!!l0 && await page.evaluate(() => document.querySelector('.pm-scene kbd[data-bind="talk"]')?.textContent === 'F'), `a scene, its next line's cap F: « ${l0.slice(0, 40)} »`);
  await tap('KeyE', 'e'); await sleep(500);
  check((await lineOf()) === l0, 'E (the run now) does not go on');
  // (the scene's next line comes after a walk and a camera move: some seconds)
  await tap('KeyF', 'f');
  const l1 = await until((a) => { const q = document.querySelector('.pm-scene q')?.textContent; return q && q !== a ? q : null; }, 20000, 'the next line', l0);
  check(!!l1, `F goes on: « ${(l1 ?? '').slice(0, 40)} »`);
  await sleep(300);
  await tap('Enter', 'Enter');
  const l2 = await until((a) => { const q = document.querySelector('.pm-scene q')?.textContent; return q && q !== a ? q : null; }, 20000, 'Enter\'s line', l1);
  check(!!l1 && !!l2, `Enter still goes on: « ${(l2 ?? '').slice(0, 40)} »`);

  // 6. the duel: attack on U
  await game(); await controls();
  await give('attack', 0, 'KeyU', 'u');
  check((await slots('attack')).join() === 'U,1', `attack: ${(await slots('attack')).join(' ')}`);
  await close();
  await tap('Escape', 'Escape');
  const menu = await page.evaluate(() => [...document.querySelectorAll('.pm-menu kbd[data-bind]')].map((k) => `${k.dataset.bind}:${k.textContent}`).join(' '));
  check(menu === 'map:M journal:J board:T skills:K gear:G settings:V guide:H', `the menu's caps, by action: ${menu}`);
  await tap('Escape', 'Escape');
  await page.goto(`${BASE}?scene=arena&duel=charge`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true && window.__arena?.ready', { timeout: READY });
  await sleep(600);
  const held = () => page.evaluate(() => !!window.__arena.snapshot().charge?.held);
  check(await page.evaluate(() => document.querySelector('#ah-bar [data-act="attack"] kbd')?.textContent === 'U'), 'the bar\'s attack cap shows U');
  await send('keyDown', 'KeyU', 'u'); await sleep(250); const u = await held(); await send('keyUp', 'KeyU', 'u'); await frames(3);
  check(u && !(await held()), 'U held charges, released it strikes');
  await send('keyDown', 'KeyJ', 'j'); await sleep(250); const j = await held(); await send('keyUp', 'KeyJ', 'j'); await frames(3);
  check(!j, 'J does not any more');
  await send('keyDown', 'Digit1', '1'); await sleep(250); const one = await held(); await send('keyUp', 'Digit1', '1'); await frames(3);
  check(one, 'the second slot\'s 1 still charges');
  await page.screenshot({ path: path.join(outDir, '6-duel.png') });

  // 7. AZERTY: each keyboard its own keys
  await game(); await controls();
  await page.evaluate(() => document.querySelector('.pm-settings .pm-detail .pm-btn').focus());
  await tap('ArrowRight', 'ArrowRight');
  check((await stored())?.keyboard === 'azerty', 'AZERTY chosen');
  await until(() => document.querySelectorAll('.pm-slot').length === 36, 3000, 'the AZERTY slots');
  const az = await page.evaluate(() => [...document.querySelectorAll('.pm-slot')].map((x) => x.textContent).join(' '));
  check(az === 'Z Up S Down Q Left D Right Shift — E Space A — M — J — T — K — G — V — H — N — J 1 L A Space —', `AZERTY's starting keys, the QWERTY changes left on QWERTY: ${az}`);
  await give('map', 0, 'KeyU', 'u');
  await close();
  check(await walked('KeyW', 'z') > 0.3, 'a real AZERTY keyboard\'s Z (at QWERTY\'s W) walks');
  await tap('KeyQ', 'a');
  check(await until(() => !!document.querySelector('[data-here]'), 3000, 'the list'), 'its A (at QWERTY\'s Q) opens the list');
  await tap('Escape', 'Escape');
  await page.goto(`${BASE}?scene=arena&duel=charge`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true && window.__arena?.ready', { timeout: READY });
  await sleep(600);
  await send('keyDown', 'Digit1', '&'); await sleep(250); const amp = await held(); await send('keyUp', 'Digit1', '&'); await frames(3);
  check(amp, 'its top-row « 1 », which types « & », charges in the duel');
  await game(); await controls();
  check((await slots('map')).join() === 'U,—', 'the map on U on AZERTY');
  await page.evaluate(() => document.querySelector('.pm-settings .pm-detail .pm-btn').focus());
  await tap('ArrowRight', 'ArrowRight');
  await until(() => document.querySelector('.pm-slot[data-act="map"]')?.textContent === 'M', 3000, 'QWERTY\'s map');
  check((await slots('map')).join() === 'M,—' && (await slots('up')).join() === 'I,Up', 'QWERTY again: its own keys, the map on M, walk up on I');

  // 8. the French names
  await game('&lang=fr'); await controls();
  const fr = await page.evaluate(() => [document.querySelector('.pm-slot[data-act="pause"]').textContent, document.querySelector('.pm-slot[data-act="run"][data-col="0"]').textContent, document.querySelector('.pm-settings .pm-foot kbd').outerHTML]);
  check(fr[0] === 'Espace' && fr[2] === '<kbd data-key="Esc">Échap</kbd>', `the French names: ${fr.join(' | ')}`);
  await page.screenshot({ path: path.join(outDir, '8-controls-fr.png') });
  // « Default keys »: QWERTY's starting keys back
  await page.evaluate(() => [...document.querySelectorAll('.pm-settings .pm-detail .pm-btn')].at(-1).click());
  await until(() => document.querySelector('.pm-slot[data-act="up"]')?.textContent === 'W', 3000, 'the starting keys');
  check(!(await stored())?.keys?.qwerty && !!(await stored())?.keys?.azerty, 'QWERTY\'s keys back to the start, AZERTY\'s kept');

  // 9. Explore: F the forge, unless talk is on F
  const explore = async () => {
    await page.goto(BASE, { waitUntil: 'load', timeout: READY });
    await page.waitForSelector('#title-screen #title-menu .pm-btn', { timeout: READY });
    await page.evaluate(() => document.querySelector('#title-menu .pm-btn[data-id="explore"]').click());
    await page.waitForFunction('window.__app?.ready === true', { timeout: READY });
    await sleep(800);
  };
  const forge = () => page.evaluate(() => window.__app.config.forgeState);
  await explore();
  let f0 = await forge(); await tap('KeyF', 'f'); await sleep(300);
  check((await forge()) !== f0, 'F toggles the forge in Explore');
  await tap('KeyF', 'f'); await sleep(300);
  await game(); await controls();
  await give('talk', 0, 'KeyF', 'f');
  await close();
  await explore();
  f0 = await forge(); await tap('KeyF', 'f'); await sleep(300);
  check((await forge()) === f0, 'talk on F: F talks, the forge stays');
} finally { await b.close(); }
if (errors) console.log(`${errors} page error(s)`);
console.log(failed || errors ? `FAIL: ${failed} check(s)` : 'PASS');
process.exit(failed || errors ? 1 : 0);
