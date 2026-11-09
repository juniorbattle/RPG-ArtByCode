// The settings page's proof (journal Passes RG2 / RG3, the operator's sheet: RG-1 to RG-10): in a browser that does not announce automation, as a person
// opens the bare address, with a fake gamepad defined before the page's scripts (not used until the proof presses it):
//   1. the title screen offers « Settings »; Enter opens the page above it (its menu hidden under it), the parts on the left;
//   2. the keyboard: → enters the graphics, ← lowers the quality one tier: kept in the browser and applied at once to the town behind (MSAA, reflection,
//      resolution cap), a switch (depth of field) on and off, « High » again, Esc closes, the focus back on « Settings »;
//   3. a setting kept is applied at the next load; the address's own parameter wins over it;
//   4. the gamepad: the D-pad to « Settings », A opens, → enters, ← changes the quality, B closes;
//   5. a version 2 game: V opens the page on the sound, → moves the general volume (kept by the sound engine), Esc; the menu (Esc) lists « Settings »;
//   6. the keyboard's layout: AZERTY chosen in the controls, Z held walks the hero, Q held walks him left without opening the list, A opens the list (typed as
//      a real AZERTY keyboard sends them since the remapping, journal Passe RM2: its Z at QWERTY's W, its Q at QWERTY's A, its A at QWERTY's Q); QWERTY again, W walks;
//   7. the duel of the version 2: Space pauses, Esc opens the page over the paused duel, Space there does not resume it, Esc closes; the pad's Y opens it;
//   8. the reduced motion: the system's « reduce » changes nothing (the game's setting alone); the setting on stops the slides (--ds-move 0) and reaches the
//      duel and its effects; off again;
//   9. the language (journal Passe RG4): the title's « Français · English » line (English pressed in an English browser), the arrows and Enter to French:
//      kept, the page reloaded in French; the settings' language part back to English; a French browser on a fresh profile speaks French; a new game
//      in French; in a duel's pause a new language is kept for the next page without reloading the bout, a line says so; today's game (v2=0) in English.
// A DEV server (named states).   node tools/settings-proof.mjs <outDir>   (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/settings-proof.mjs <outDir>');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1600), H = +(process.env.H || 900), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--lang=en-US', '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const XBOX = 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)';
const BTN = { A: 0, B: 1, X: 2, Y: 3, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
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

try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  await page.evaluateOnNewDocument(HUMAN);
  await page.evaluateOnNewDocument(fakePad, XBOX);
  const frames = (n = 3) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const pad = async (i, hold = 90) => { await page.evaluate((i) => window.__padSet(i, true), i); await frames(3); await sleep(hold); await page.evaluate((i) => window.__padSet(i, false), i); await frames(3); await sleep(80); };
  const key = async (k) => { await page.keyboard.press(k); await frames(2); await sleep(60); };
  const until = async (f, ms, what) => { const t0 = Date.now(); for (;;) { const v = await page.evaluate(f).catch(() => null); if (v) return v; if (Date.now() - t0 > ms) { check(false, `waited ${ms} ms for ${what}`); return null; } await sleep(150); } };
  const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem('cite-du-tournoi.settings') ?? 'null'));
  const focus = () => page.evaluate(() => (document.activeElement?.dataset?.id ?? document.activeElement?.dataset?.section ?? document.activeElement?.textContent ?? '').trim().slice(0, 60));
  const open = () => page.evaluate(() => !!document.querySelector('.pm-settings'));
  const gfx = (who = '__app') => page.evaluate((who) => { const a = window[who]; return a ? { msaa: a.post.params.msaa, refl: a.reflection.scale, cap: a.resCap?.pixels ?? null, px: a.post.width * a.post.height, dof: a.post.dofEnabled, bloom: a.post.bloomEnabled } : null; }, who);
  const title = async () => {
    await page.goto(BASE, { waitUntil: 'load', timeout: READY });
    await page.waitForSelector('#title-screen #title-menu .pm-btn', { timeout: READY });
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
    await sleep(600);
  };

  // 1. the title screen: « Settings », the page above it
  await title();
  check(await page.evaluate(() => navigator.webdriver === false && location.search === ''), 'the bare address, in a browser that does not announce automation');
  const ids = await page.evaluate(() => [...document.querySelectorAll('#title-menu .pm-btn')].map((x) => x.dataset.id).join());
  check(ids === 'new,explore,settings', `the title screen: ${ids}`);
  check(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--ds-move').trim() === '' && !document.documentElement.classList.contains('cdt-reduced')), 'no reduced motion by default');
  check((await stored()) === null, 'nothing stored on a fresh profile');
  const g0 = await gfx();
  check(g0 && g0.msaa === 4 && g0.refl === 0.5 && g0.cap === null && g0.dof && g0.bloom, `the town behind at today's defaults: ${JSON.stringify(g0)}`);
  for (let i = 0; i < 4 && (await focus()) !== 'settings'; i++) await key('ArrowDown');
  check((await focus()) === 'settings', '« Settings » reached by the arrows');
  await key('Enter');
  await until(() => !!document.querySelector('.pm-settings'), 5000, 'the settings page');
  const above = await page.evaluate(() => { const c = document.querySelector('.pm-settings').getBoundingClientRect(), e = document.elementFromPoint(c.left + c.width * 0.7, c.top + c.height * 0.3); return !!e?.closest('.pm-settings') && getComputedStyle(document.querySelector('#title-screen .wrap')).visibility === 'hidden'; });
  check(above, 'the page above the title screen, its menu hidden under it');
  const parts = await page.evaluate(() => [...document.querySelectorAll('.pm-settings .pm-glist .pm-btn')].map((x) => x.dataset.section).join());
  check(parts === 'graphics,sound,controls,language', `the four parts: ${parts}`);
  check((await focus()) === 'graphics', 'the graphics selected first');
  await page.screenshot({ path: path.join(outDir, '1-title-graphics.png') });

  // 2. the keyboard: the quality one tier down, applied at once and kept; a switch; « High » again; Esc
  await key('ArrowRight');
  check(/Quality/.test(await focus()), `→ enters the part on its first setting: ${await focus()}`);
  await key('ArrowLeft');
  const s1 = await stored(), g1 = await gfx();
  check(s1?.res === 1080 && s1?.msaa === 2 && s1?.refl === 0.25, `« Medium » kept: ${JSON.stringify(s1 && { res: s1.res, msaa: s1.msaa, refl: s1.refl })}`);
  check(g1.msaa === 2 && g1.refl === 0.25 && g1.cap === Math.round(1080 * 1080 * 16 / 9) && g1.px <= g1.cap, `applied at once to the town behind: ${JSON.stringify(g1)}`);
  for (let i = 0; i < 5; i++) await key('ArrowDown');
  check(/Depth of field/.test(await focus()), `↓ walks the settings: ${await focus()}`);
  await key('Enter');
  check((await stored()).dof === false && (await gfx()).dof === false, 'Enter switches the depth of field off, at once');
  await key('Enter');
  check((await stored()).dof === true && (await gfx()).dof === true, 'and on again');
  for (let i = 0; i < 6; i++) await key('ArrowUp');
  check(/graphics/i.test(await focus()), `↑ at the top goes back to the parts: ${await focus()}`);
  await key('ArrowRight'); await key('ArrowRight');
  const g2 = await gfx();
  check(g2.msaa === 4 && g2.refl === 0.5 && g2.cap === null, `« High » again: today's defaults ${JSON.stringify(g2)}`);
  await key('Escape');
  check(!(await open()) && (await focus()) === 'settings' && await page.evaluate(() => getComputedStyle(document.querySelector('#title-screen .wrap')).visibility === 'visible'), 'Esc closes, the focus back on « Settings », the title shown');

  // 3. kept for the next load; the address's own parameter first
  await page.evaluate(() => localStorage.setItem('cite-du-tournoi.settings', JSON.stringify({ res: 720, msaa: 0, refl: 0.25, fps: 30 })));
  await title();
  const g3 = await gfx();
  check(g3.msaa === 0 && g3.refl === 0.25 && g3.cap === Math.round(720 * 720 * 16 / 9), `a setting kept is applied at the next load: ${JSON.stringify(g3)}`);
  check(await page.evaluate(() => window.__app.frameCap.mode.kind === 'even' && window.__app.frameCap.mode.fps === 30), '30 frames per second from the setting');
  await page.goto(`${BASE}?seed=1842&msaa=8&fps=off`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true', { timeout: READY });
  const g4 = await gfx();
  check(g4.msaa === 8 && g4.cap === Math.round(720 * 720 * 16 / 9) && await page.evaluate(() => window.__app.frameCap.mode.kind === 'off'), `the address's msaa= and fps= win, the stored resolution stays: ${JSON.stringify(g4)}`);
  await page.evaluate(() => localStorage.removeItem('cite-du-tournoi.settings'));

  // 4. the gamepad on the title screen and the page
  await title();
  for (let i = 0; i < 4 && (await focus()) !== 'settings'; i++) await pad(BTN.DOWN);
  check((await focus()) === 'settings', 'the D-pad reaches « Settings »');
  await pad(BTN.A);
  await until(() => !!document.querySelector('.pm-settings'), 5000, 'the settings page from the pad');
  await pad(BTN.RIGHT);
  check(/Quality/.test(await focus()), `the D-pad's → enters the part: ${await focus()}`);
  await pad(BTN.LEFT);
  check((await stored())?.msaa === 2, 'the D-pad\'s ← changes the quality');
  await pad(BTN.RIGHT);
  check((await stored())?.msaa === 4, 'and back to « High »');
  const caps = await page.evaluate(() => document.querySelector('.pm-settings .pm-foot kbd')?.className ?? '');
  check(/pad/.test(caps), `the page's caps show the pad's buttons: ${caps}`);
  await pad(BTN.B);
  check(!(await open()), 'B closes the page');
  await page.evaluate(() => localStorage.removeItem('cite-du-tournoi.settings'));

  // 5. a version 2 game: V on the sound, the menu's line
  await page.goto(`${BASE}?play=1&state=v2-day1-morning&noreload=1`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true && !!window.__ui', { timeout: READY });
  await sleep(800);
  for (let i = 0; i < 3 && await page.evaluate(() => !!document.querySelector('.pm-band')); i++) { await key('Enter'); await sleep(300); }
  await key('KeyV');
  await until(() => document.activeElement?.type === 'range', 5000, 'the sound part, its first slider');
  check(await page.evaluate(() => document.querySelector('.pm-settings section:last-child .pm-h')?.textContent === 'Sound'), 'V opens the page on the sound');
  const sliders = await page.evaluate(() => [...document.querySelectorAll('.pm-settings input[type=range]')].map((i) => `${i.getAttribute('aria-label')}=${i.value}`).join(', '));
  check(sliders === 'General volume=70, Music=50, Ambience=50, Effects=50', `the four volumes: ${sliders}`);
  await page.screenshot({ path: path.join(outDir, '5-game-sound.png') });
  await key('ArrowRight');
  check(await page.evaluate(() => JSON.parse(localStorage.getItem('cdt-v2-sound') ?? '{}').volume === 0.75), '→ moves the general volume, kept by the sound engine');
  await key('ArrowLeft');
  await key('Escape');
  check(!(await open()), 'Esc closes the page');
  await key('Escape');
  const menu = await page.evaluate(() => [...document.querySelectorAll('.pm-menu .pm-btn')].map((b) => b.textContent.trim()));
  check(menu.includes('SettingsV') && !menu.some((t) => /^Sound/.test(t)), `the menu lists « Settings » with V, no « Sound »: ${menu.join(' | ')}`);
  await key('Escape');

  // 6. the keyboard's layout: AZERTY in the controls
  await key('KeyV'); await sleep(300);
  await key('ArrowUp'); await key('ArrowDown');
  check(await page.evaluate(() => document.querySelector('.pm-settings section:last-child .pm-h')?.textContent === 'Controls'), 'the controls');
  await key('Enter'); await key('ArrowRight');
  check((await stored())?.keyboard === 'azerty', 'AZERTY chosen and kept');
  // the walk's first slots, up, down, left, right (the remapping, journal Passe RM2: a line per action)
  const walkKeys = await page.evaluate(() => ['up', 'left', 'down', 'right'].map((a) => document.querySelector(`.pm-slot[data-act="${a}"][data-col="0"]`)?.textContent).join(''));
  check(walkKeys === 'ZQSD', `the controls show Z Q S D: ${walkKeys}`);
  await page.screenshot({ path: path.join(outDir, '6-game-controls-azerty.png') });
  await key('Escape');
  check(await page.evaluate(() => document.querySelector('#pm-hints kbd')?.textContent === 'A'), 'the list\'s cap shows A');
  const pos = () => page.evaluate(() => { const p = window.__app.actors.player.pos; return { x: p.x, z: p.z }; });
  const hold = async (k, ms = 500) => { await page.keyboard.down(k); await sleep(ms); await page.keyboard.up(k); await frames(3); };
  // a real AZERTY keyboard's key: its place (QWERTY's name) and what it types
  const cdp = await page.createCDPSession(), vk = (k) => k.toUpperCase().charCodeAt(0);
  const azerty = (type, code, k) => cdp.send('Input.dispatchKeyEvent', { type, code, key: k, windowsVirtualKeyCode: vk(k), nativeVirtualKeyCode: vk(k), ...(type === 'keyDown' ? { text: k, unmodifiedText: k } : {}) });
  const holdAz = async (code, k, ms = 500) => { await azerty('keyDown', code, k); await sleep(ms); await azerty('keyUp', code, k); await frames(3); };
  let p0 = await pos(); await holdAz('KeyW', 'z'); let p1 = await pos();
  check(Math.hypot(p1.x - p0.x, p1.z - p0.z) > 0.3, `Z held walks the hero (${Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(2)} m)`);
  p0 = await pos(); await holdAz('KeyA', 'q'); p1 = await pos();
  check(Math.hypot(p1.x - p0.x, p1.z - p0.z) > 0.3 && !(await page.evaluate(() => !!document.querySelector('[data-here]'))), `Q held walks him without opening the list (${Math.hypot(p1.x - p0.x, p1.z - p0.z).toFixed(2)} m)`);
  await azerty('keyDown', 'KeyQ', 'a'); await frames(2); await azerty('keyUp', 'KeyQ', 'a'); await frames(2);
  check(await until(() => !!document.querySelector('[data-here]'), 3000, 'the list'), 'A opens the list');
  await key('Escape');
  await page.evaluate(() => { const s = JSON.parse(localStorage.getItem('cite-du-tournoi.settings')); s.keyboard = 'qwerty'; localStorage.setItem('cite-du-tournoi.settings', JSON.stringify(s)); });
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction('window.__ready === true && !!window.__ui', { timeout: READY }); await sleep(800);
  for (let i = 0; i < 3 && await page.evaluate(() => !!document.querySelector('.pm-band')); i++) { await key('Enter'); await sleep(300); }
  p0 = await pos(); await hold('w'); p1 = await pos();
  check(Math.hypot(p1.x - p0.x, p1.z - p0.z) > 0.3 && await page.evaluate(() => document.querySelector('#pm-hints kbd')?.textContent === 'Q'), `QWERTY again: W walks, the list's cap is Q`);
  await page.evaluate(() => localStorage.removeItem('cite-du-tournoi.settings'));

  // 7. the duel's pause
  await page.goto(`${BASE}?scene=arena`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true && window.__arena?.ready', { timeout: READY });
  await sleep(500);
  await key('Space');
  check(await page.evaluate(() => window.__arena.paused && /Settings/.test(document.querySelector('#ah-pause .ah-set')?.textContent ?? '')), 'Space pauses the duel, its pause shows « Settings »');
  await key('Escape');
  check(await until(() => !!document.querySelector('.pm-settings'), 4000, 'the page over the duel'), 'Esc opens the page over the paused duel');
  await key('Space');
  check(await page.evaluate(() => window.__arena.paused), 'Space on the page does not resume the duel');
  await page.screenshot({ path: path.join(outDir, '7-duel-settings.png') });
  await key('Escape');
  check(!(await open()) && await page.evaluate(() => window.__arena.paused), 'Esc closes the page, the duel still paused');
  await pad(BTN.START); await pad(BTN.START);
  check(await page.evaluate(() => window.__arena.paused), 'the pad pauses (Start)');
  await pad(BTN.Y);
  check(await until(() => !!document.querySelector('.pm-settings'), 4000, 'the page from the pad\'s Y'), 'the pad\'s Y opens the page over the paused duel');
  await pad(BTN.B);
  check(!(await open()), 'B closes it');

  // 8. the reduced motion: the system's changes nothing, the game's setting does
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await title();
  check(await page.evaluate(() => matchMedia('(prefers-reduced-motion: reduce)').matches && !document.documentElement.classList.contains('cdt-reduced') && getComputedStyle(document.documentElement).getPropertyValue('--ds-move').trim() === ''), 'the system asks for reduced motion: the game\'s moves stay (its own setting only)');
  check(await page.evaluate(() => getComputedStyle(document.querySelector('#title-screen .wrap')).animationName === 'ds-in'), 'the title\'s card still slides in');
  await page.evaluate(() => localStorage.setItem('cite-du-tournoi.settings', JSON.stringify({ reducedMotion: true })));
  await title();
  check(await page.evaluate(() => document.documentElement.classList.contains('cdt-reduced') && getComputedStyle(document.documentElement).getPropertyValue('--ds-move').trim() === '0'), 'the setting on: the slides stop (--ds-move 0), the fades stay');
  await page.goto(`${BASE}?scene=arena`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true && window.__arena?.ready', { timeout: READY });
  check(await page.evaluate(() => window.__arena.reducedMotion === true), 'the duel takes it (no shake)');
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await page.evaluate(() => localStorage.removeItem('cite-du-tournoi.settings'));
  await page.reload({ waitUntil: 'load' }); await page.waitForFunction('window.__ready === true && window.__arena?.ready', { timeout: READY });
  check(await page.evaluate(() => window.__arena.reducedMotion === false), 'off again by default');

  // 9. the language (journal Passe RG4, RG-9, RG-10, RG-13, RG-14): the title's line, the settings' part, a duel keeping its language, today's game in English
  const lang = () => page.evaluate(() => document.documentElement.lang || 'en');
  const label = (id) => page.evaluate((id) => document.querySelector(`#title-menu [data-id="${id}"]`)?.firstChild?.firstChild?.textContent?.trim() ?? '', id);
  const reloadTitle = async (act) => { await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: READY }), act()]); await page.waitForSelector('#title-screen #title-menu .pm-btn', { timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); await sleep(600); };
  await title();
  const line = await page.evaluate(() => [...document.querySelectorAll('#title-menu .langs button')].map((x) => `${x.textContent}${x.getAttribute('aria-pressed') === 'true' ? '*' : ''}`).join(' · '));
  check(line === 'Français · English*' && (await lang()) === 'en', `the title's line, English spoken (an English browser): ${line}`);
  for (let i = 0; i < 8 && (await focus()) !== 'lang-fr'; i++) await key('ArrowDown');
  check((await focus()) === 'lang-fr', 'the arrows reach « Français »');
  await reloadTitle(() => page.keyboard.press('Enter'));
  check((await lang()) === 'fr' && (await stored())?.lang === 'fr', 'Enter keeps French and the page speaks it');
  check((await label('new')) === 'Nouvelle partie' && (await label('settings')) === 'Réglages', `the title in French: ${await label('new')}, ${await label('settings')}`);
  await page.screenshot({ path: path.join(outDir, '9-title-fr.png') });
  for (let i = 0; i < 8 && (await focus()) !== 'settings'; i++) await key('ArrowDown');
  await key('Enter');
  await until(() => !!document.querySelector('.pm-settings'), 4000, 'the settings in French');
  for (let i = 0; i < 4 && (await focus()) !== 'language'; i++) await key('ArrowDown');
  await key('ArrowRight');
  check(await page.evaluate(() => document.querySelector('.pm-settings section:last-child .pm-h')?.textContent === 'Langue'), 'the settings\' language part, in French');
  const toggles = await page.evaluate(() => [...document.querySelectorAll('.pm-settings .pm-detail .pm-btn')].map((x) => `${x.getAttribute('lang')}:${x.getAttribute('aria-pressed') === 'true' ? 1 : 0}`).join());
  check(toggles === 'en:0,fr:1', `the two languages offered, French marked: ${toggles}`);
  for (let i = 0; i < 3 && !/English/.test(await focus()); i++) await key('ArrowUp');
  if (!/English/.test(await focus())) for (let i = 0; i < 3 && !/English/.test(await focus()); i++) await key('ArrowDown');
  check(/English/.test(await focus()), `« English » selected: ${await focus()}`);
  await reloadTitle(() => page.keyboard.press('Enter'));
  check((await lang()) === 'en' && (await stored())?.lang === 'en' && (await label('new')) === 'New game', 'English chosen in the settings: kept, the page reloaded in English');
  // a French browser on a fresh profile speaks French (RG-9); nothing stored
  await page.evaluate(() => localStorage.clear());
  const fr = await page.evaluateOnNewDocument(() => { Object.defineProperty(Navigator.prototype, 'language', { get: () => 'fr-FR' }); });
  await title();
  check((await lang()) === 'fr' && (await stored()) === null && (await label('new')) === 'Nouvelle partie', 'a French browser, nothing stored: the game speaks French');
  // a version 2 game in French: the town, then a duel whose pause keeps a new language for the next page
  await page.goto(`${BASE}?play=1&new=1&name=Ren&noreload=1&tutorial=0`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); await sleep(800);
  check(await page.evaluate(() => /Jour 1/.test(document.body.innerText) && !/Day 1/.test(document.body.innerText)), 'a new game in French: « Jour 1 »');
  await page.goto(`${BASE}?play=1&state=v2-day2-afternoon&scene=arena&noreload=1&tutorial=0`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true && window.__arena?.ready', { timeout: READY }); await sleep(500);
  await page.evaluate(() => { window.__stay = 1; });
  // the bout's card first (Enter: fight), then the pause and its settings
  await key('Enter'); await sleep(1200);
  await key('Space'); await key('Escape');
  await until(() => !!document.querySelector('.pm-settings'), 4000, 'the settings over the duel');
  for (let i = 0; i < 4 && (await focus()) !== 'language'; i++) await key('ArrowDown');
  await key('ArrowRight');
  for (let i = 0; i < 3 && !/English/.test(await focus()); i++) await key('ArrowUp');
  if (!/English/.test(await focus())) for (let i = 0; i < 3 && !/English/.test(await focus()); i++) await key('ArrowDown');
  await key('Enter'); await sleep(800);
  check(await page.evaluate(() => window.__stay === 1 && window.__arena.paused && document.documentElement.lang === 'fr'), 'in the duel the choice does not reload the page: the bout goes on in French');
  check((await stored())?.lang === 'en' && await page.evaluate(() => /garde sa langue/.test(document.querySelector('.pm-settings .pm-detail')?.textContent ?? '')), 'kept for the next page, the line says so');
  await page.screenshot({ path: path.join(outDir, '9-duel-language.png') });
  await page.removeScriptToEvaluateOnNewDocument(fr.identifier);
  // today's game (v2=0) speaks English whatever the choice (RG-14)
  await page.evaluate(() => localStorage.setItem('cite-du-tournoi.settings', JSON.stringify({ lang: 'fr' })));
  await page.goto(`${BASE}?play=1&new=1&name=Ren&v2=0&noreload=1`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); await sleep(800);
  check((await lang()) === 'en' && await page.evaluate(() => /Day 1/.test(document.body.innerText)), 'today\'s game (v2=0), French chosen: English');
  await page.evaluate(() => localStorage.removeItem('cite-du-tournoi.settings'));
} finally {
  await b.close();
}
console.log(`\n${failed ? `FAIL: ${failed} check(s) failed` : 'PASS'}${errors ? `, ${errors} page error(s)` : ', no page error'}`);
process.exit(failed || errors ? 1 : 0);
