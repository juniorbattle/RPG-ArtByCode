// The gamepad in a browser (journal Passe MN2; the operator's sheet MN-1 to MN-11): a fake pad (navigator.getGamepads replaced in the page before its
// scripts: an Xbox pad's id, then a DualSense's) plays a version 2 game with no key pressed except where the keyboard's own return is checked:
//   1. the town: A closes the news, the caps show the pad's buttons; the left stick walks (its tilt sets the speed, B runs), the D-pad walks;
//      next to Mara A opens her dialogue, the D-pad walks its lines, A opens her goods, the D-pad reaches the whetstone, A buys it, B goes back
//      to her, B leaves; Y opens the list and B closes it; Start opens the menu (its shortcuts hidden but the map's), A opens the journal, RB / LB
//      walk the menu's pages, the right stick scrolls a detail; the settings page (journal Passe RG3): a slider of the sound moved by the D-pad, the vibration switch in the controls; View the map;
//      a key pressed gives the caps their keys back, a pad press takes them again;
//   2. the bout: the clock to the first bout's afternoon (window.__game), Y the list, A « Enter the arena », the match sheet (X leaves a skill
//      out and brings it back), A enters; the arena, the duel played by the computer since lot 2 (journal Passe LC3): A « Fight », X ×2 and back, Start
//      pauses (its words under the pad's button) and resumes, a blow Ren takes in the script makes the pad rumble, A « Skip », A « Back to the city »; Node replays every action the pages applied: same fingerprint;
//   3. a square: a cutscene (A the next line, Start skips), the stick walks into a way out (the screen dark, the move saved);
//   4. the title screen: the D-pad walks it, A opens « New game », B goes back, A « Continue » takes up the game;
//   5. a DualSense: the PlayStation symbols; 6. today's game and today's arena: the pad changes nothing (no layer installed, the hero still).
//   node tools/pad-proof.mjs <outDir> [seed]   (a DEV server for the named states: BASE_URL; W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, seedS = '1842'] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/pad-proof.mjs <outDir> [seed]');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const XBOX = 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', DUALSENSE = 'DualSense Wireless Controller (STANDARD GAMEPAD Vendor: 054c Product: 0ce6)';
const B = { A: 0, B: 1, X: 2, Y: 3, LB: 4, RB: 5, LT: 6, RT: 7, VIEW: 8, START: 9, UP: 12, DOWN: 13, LEFT: 14, RIGHT: 15 };
let failed = 0, errors = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** the fake pad, defined before the page's scripts */
function fakePad(id) {
  const pad = { id, index: 0, connected: true, mapping: 'standard', timestamp: 0, buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0],
    vibrationActuator: { type: 'dual-rumble', playEffect: (type, o) => { (window.__rumbles ??= []).push({ type, ...o }); return Promise.resolve('complete'); } } };
  window.__fakePad = pad;
  Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [window.__fakePad, null, null, null] });
  window.__padSet = (i, on) => { const x = pad.buttons[i]; x.pressed = on; x.touched = on; x.value = on ? 1 : 0; pad.timestamp = performance.now(); };
  window.__padAxes = (a) => { pad.axes = a.slice(); pad.timestamp = performance.now(); };
}

async function session(id, run) {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  await page.evaluateOnNewDocument(fakePad, id);
  const frames = (n = 3) => page.evaluate((n) => new Promise((r) => { let k = 0; const f = () => (++k >= n ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
  const logLen = () => page.evaluate(() => window.__pad?.log.length ?? 0);
  /** a button pressed and let go, seen by at least a few frames of the page's poller */
  const press = async (i, hold = 90) => { await page.evaluate((i) => window.__padSet(i, true), i); await frames(3); await sleep(hold); await page.evaluate((i) => window.__padSet(i, false), i); await frames(3); await sleep(60); };
  const hold = (i, on) => page.evaluate((i, on) => window.__padSet(i, on), i, on);
  const stick = (x, y, rx = 0, ry = 0) => page.evaluate((a) => window.__padAxes(a), [x, y, rx, ry]);
  const open = async (q) => {
    await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY });
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
    const e = await page.evaluate(() => window.__error ?? null); check(!e, `page ${q} ready${e ? `: ${e}` : ''}`);
    await sleep(900);
    // every action a page applies, for the Node replay (the pages act through window.__game)
    await page.evaluate(() => { const g = window.__game; if (!g || g.__logged) return; const a = g.act; g.act = (x) => { const r = a(x); if (r.ok) (window.__acts ??= []).push(x); return r; }; g.__logged = true; });
  };
  try { await run({ page, frames, press, hold, stick, open, logLen }); } finally { await page.close(); }
}

// a cap names a fixed key in data-key and an action in data-bind (the player's keys, journal Passe RM3)
const caps = (page, sel) => page.evaluate((sel) => [...document.querySelectorAll(sel)].map((k) => ({ key: k.dataset.key ?? k.dataset.bind ?? null, text: k.textContent, label: k.getAttribute('aria-label'), svg: !!k.querySelector('svg'), hidden: k.style.display === 'none' })), sel);
const focused = (page) => page.evaluate(() => (document.activeElement?.textContent ?? '').trim().slice(0, 60));
const acts = [];

try {
  // ------------------------------------------------------------------------------------------------ 1. the town
  await session(XBOX, async ({ page, frames, press, hold, stick, open }) => {
    await open(`?play=1&new=1&name=Aster&seed=${seedS}&vis=0&noreload=1`);
    const flags = await page.evaluate(() => ({ v2: window.__game.state().flags.v2 ?? null, pad: !!window.__pad }));
    check(flags.v2 === true && flags.pad, `a version 2 game, its pad layer installed: ${JSON.stringify(flags)}`);
    const news = await page.evaluate(() => !!document.querySelector('.pm-overlay'));
    await press(B.A);
    const after = await page.evaluate(() => ({ overlay: !!document.querySelector('.pm-overlay'), mode: window.__pad.mode, family: window.__pad.family }));
    check(after.mode === 'pad' && after.family === 'xbox' && (!news || !after.overlay), `A ${news ? 'closes the news' : 'wakes the pad'}: ${JSON.stringify(after)}`);
    const hints = await caps(page, '#pm-hints kbd');
    check(hints.length === 2 && hints[0].key === 'list' && hints[0].label === 'Y' && hints[1].key === 'Esc' && hints[1].label === 'Menu' && hints[1].svg, `the hints show Y and Menu: ${JSON.stringify(hints)}`);
    // the walk, from the quay where the game starts (next to Mara the stall's colliders hold the hero): the stick to the right at full tilt, at half
    // tilt, with B held; the D-pad
    const at = await page.evaluate(() => { const m = window.__app.actors.actors.find((a) => (a.base ?? a.spec) === 'merchant'); return [m.pos.x, m.pos.z]; });
    const home = await page.evaluate(() => [window.__app.actors.player.pos.x, window.__app.actors.player.pos.z]);
    const walk = async (x, y, ms, btn = null) => {
      await page.evaluate((h) => window.__app.actors.player.pos.set(h[0], 0, h[1]), home); await frames(2);
      const p0 = await page.evaluate(() => ({ x: window.__app.actors.player.pos.x, z: window.__app.actors.player.pos.z, t: performance.now() }));
      if (btn !== null) await hold(btn, true); else await stick(x, y);
      await sleep(ms);
      const p1 = await page.evaluate(() => ({ x: window.__app.actors.player.pos.x, z: window.__app.actors.player.pos.z, t: performance.now(), yaw: window.__app.actors.controlYaw }));
      if (btn !== null) await hold(btn, false); else await stick(0, 0);
      await frames(3);
      const d = Math.hypot(p1.x - p0.x, p1.z - p0.z), right = (p1.x - p0.x) * Math.cos(p1.yaw) - (p1.z - p0.z) * Math.sin(p1.yaw);
      return { v: d / ((p1.t - p0.t) / 1000), right };
    };
    // short walks: the quay's furniture must not stop the run before the walk
    const full = await walk(1, 0, 400), half = await walk(0.5, 0, 400);
    await hold(B.B, true); const run = await walk(1, 0, 400); await hold(B.B, false);
    const dp = await walk(0, 0, 500, B.LEFT);
    check(full.v > 1 && full.right > 0, `the stick walks to the screen's right: ${full.v.toFixed(2)} m/s`);
    check(half.right > 0 && half.v / full.v > 0.4 && half.v / full.v < 0.75, `half tilt walks slower: ${(half.v / full.v).toFixed(2)} of full (expected ~0.57)`);
    check(run.v / full.v > 1.1, `B held runs: ${(run.v / full.v).toFixed(2)} x`);
    check(dp.right < 0 && dp.v > 1, `the D-pad walks: ${dp.v.toFixed(2)} m/s to the left`);
    // Mara: A next to her, her dialogue, her goods
    await page.evaluate((m) => window.__app.actors.player.pos.set(m[0] + 0.9, 0, m[1] + 0.6), at);
    await page.waitForFunction("window.__ui.near === 'mara'", { timeout: 60000 }).catch(() => {});
    const prompt = await caps(page, '#pm-prompt kbd');
    check(prompt[0]?.key === 'talk' && prompt[0]?.label === 'A', `the prompt shows A: ${JSON.stringify(prompt)}`);
    await press(B.A);
    await page.waitForSelector('.pm-talk .pm-dlg', { timeout: 20000 }).catch(() => {});
    const dlg = await page.evaluate(() => document.querySelector('.pm-talk .pm-dlg h2')?.firstChild?.textContent ?? null);
    check(dlg === 'Mara', `A next to Mara opens her dialogue: ${dlg}`);
    const f0 = await focused(page); await press(B.DOWN); const f1 = await focused(page); await press(B.UP); const f2 = await focused(page);
    check(f0 !== f1 && f2 === f0, `the D-pad walks her lines: ${f0} -> ${f1} -> ${f2}`);
    const leave = await caps(page, '.pm-talk .pm-foot kbd');
    check(leave[0]?.key === 'Esc' && leave[0]?.label === 'B', `her foot shows B: ${JSON.stringify(leave)}`);
    await press(B.A);
    await page.waitForSelector('.pm-wares .pm-btn.on', { timeout: 20000 }).catch(() => {});
    const on = () => page.evaluate(() => document.querySelector('.pm-glist .pm-btn.on span')?.firstChild?.textContent ?? null);
    let line = await on();
    for (let i = 0; i < 8 && line !== 'Whetstone'; i++) { await press(B.DOWN); line = await on(); }
    check(line === 'Whetstone', `A opens her goods, the D-pad reaches the whetstone: ${line}`);
    const coins = await page.evaluate(() => window.__game.state().player.coins);
    await press(B.A);
    const bought = await page.evaluate(() => ({ coins: window.__game.state().player.coins, items: window.__game.state().player.items, wares: !!document.querySelector('.pm-wares') }));
    check(bought.coins === coins - 8 && bought.items.includes('whetstone') && bought.wares, `A buys it, the page stays: ${JSON.stringify(bought)}`);
    await page.screenshot({ path: path.join(outDir, '1-goods.png') });
    await press(B.B);
    check(await page.evaluate(() => !document.querySelector('.pm-wares') && !!document.querySelector('.pm-talk .pm-dlg')), 'B goes back to Mara');
    await press(B.B);
    check(await page.evaluate(() => !document.querySelector('.pm-talk')), 'B leaves her');
    // Y: the list
    await press(B.Y);
    check(await page.evaluate(() => !!document.querySelector('.pm-talk[data-here]')), 'Y opens the list of what can be done here');
    await press(B.B);
    check(await page.evaluate(() => !document.querySelector('.pm-talk')), 'B closes it');
    // Start: the menu, the journal, the shoulders
    await press(B.START);
    const menu = await caps(page, '.pm-menu kbd');
    check(menu.filter((c) => !c.hidden).map((c) => c.key).join() === 'map,Esc' && menu.find((c) => c.key === 'map')?.label === 'View', `Start opens the menu, its shortcuts hidden but the map's: ${JSON.stringify(menu.map((c) => `${c.key}:${c.hidden ? 'hidden' : c.label}`))}`);
    await press(B.DOWN); await press(B.A);
    const title = () => page.evaluate(() => document.querySelector('.pm-overlay .pm-card')?.getAttribute('aria-label') ?? null);
    const pages = [await title()];
    await press(B.RB); pages.push(await title()); await press(B.RB); pages.push(await title()); await press(B.LB); pages.push(await title());
    check(pages.join(' > ') === 'Journal > The tournament > Your skills > The tournament', `A opens the journal, RB / LB walk the menu's pages: ${pages.join(' > ')}`);
    await press(B.LB);
    const sc = await page.evaluate(() => { const d = document.querySelector('.pm-overlay .pm-detail'); return d ? { top: d.scrollTop, can: d.scrollHeight > d.clientHeight + 1 } : null; });
    await stick(0, 0, 0, 1); await sleep(400); await stick(0, 0, 0, 0); await frames(2);
    const sc2 = await page.evaluate(() => document.querySelector('.pm-overlay .pm-detail')?.scrollTop ?? 0);
    check(!sc?.can || sc2 > sc.top, `the right stick scrolls the journal's day (${sc?.can ? `${sc.top} -> ${sc2}` : 'nothing to scroll here'})`);
    await press(B.B);
    // the settings page (journal Passe RG3, in place of lot V8's sound page): the menu's « Settings », the sound's sliders, the vibration's switch in the controls
    await press(B.START);
    for (let i = 0; i < 5; i++) await press(B.DOWN);
    await press(B.A);
    await page.waitForFunction(() => !!document.querySelector('.pm-settings'), { timeout: 20000 }).catch(() => {});
    const part = () => page.evaluate(() => document.querySelector('.pm-settings section:last-child .pm-h')?.textContent ?? null);
    check((await part()) === 'Graphics', `A opens the settings on the graphics: ${await part()}`);
    await press(B.DOWN); await press(B.RIGHT);
    await page.waitForFunction(() => document.activeElement?.type === 'range', { timeout: 20000 }).catch(() => {});
    const music0 = await page.evaluate(() => document.querySelectorAll('.pm-overlay input[type=range]')[1]?.value);
    await press(B.DOWN);
    const sl = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    await press(B.LEFT);
    const music1 = await page.evaluate(() => document.querySelectorAll('.pm-overlay input[type=range]')[1]?.value);
    check(sl === 'Music' && +music1 === +music0 - 5, `the D-pad reaches the music's slider and moves it: ${sl} ${music0} -> ${music1}`);
    await press(B.RIGHT);
    await press(B.UP); await press(B.UP); await press(B.DOWN);
    check((await part()) === 'Controls', `↑ goes back to the parts, ↓ the controls: ${await part()}`);
    await press(B.RIGHT); await press(B.DOWN);
    const vib = await page.evaluate(() => [...document.querySelectorAll('.pm-overlay .pm-btn')].find((x) => /Gamepad vibration/.test(x.textContent))?.getAttribute('aria-pressed') ?? null);
    check(vib === 'true' && /Gamepad vibration/.test(await page.evaluate(() => document.activeElement?.textContent ?? '')), `the controls show the vibration's switch, on: ${vib}`);
    await press(B.A);
    const vib2 = await page.evaluate(() => JSON.parse(localStorage.getItem('cite-du-tournoi.pad') ?? '{}').vibration);
    await press(B.A);
    const vib3 = await page.evaluate(() => JSON.parse(localStorage.getItem('cite-du-tournoi.pad') ?? '{}').vibration);
    check(vib2 === false && vib3 === true, `A switches the vibration off and on: ${vib2}, ${vib3}`);
    await press(B.B);
    // View: the map
    await press(B.VIEW);
    check((await title()) === 'The Cité', `View opens the map: ${await title()}`);
    await press(B.B);
    // a key gives the caps back, a pad press takes them again
    await page.keyboard.press('Shift');
    const kb = await caps(page, '#pm-hints kbd');
    await press(B.LB);
    const pd = await caps(page, '#pm-hints kbd');
    // the cap keeps naming its action (data-bind, journal Passe RM3); its text is the key again
    check(kb[0].text === 'Q' && kb[0].key === 'list' && kb[0].label === null && pd[0].label === 'Y', `a key gives the caps their keys back (${kb.map((c) => c.text)}), a pad press the buttons (${pd.map((c) => c.label)})`);
    check(await page.evaluate(() => !document.getElementById('pm-padsound') || !document.getElementById('pm-padsound').classList.contains('on') || window.__pad.mode === 'pad'), 'the sound line only with the pad');
    await page.screenshot({ path: path.join(outDir, '1-town.png') });
    acts.push(...await page.evaluate(() => window.__acts ?? []));
  });

  // ------------------------------------------------------------------------------------------------ 2. the bout
  await session(XBOX, async ({ page, frames, press, hold, open }) => {
    await open('?play=1&vis=0&noreload=1');
    for (let i = 0; i < 4; i++) await page.evaluate(() => window.__game.act({ type: 'wait' }));
    const st = await page.evaluate(() => window.__game.state());
    check(st.day === 2 && st.slot === 'afternoon', `day ${st.day}, ${st.slot}: the first bout's afternoon`);
    acts.push(...await page.evaluate(() => window.__acts ?? []));
    await open('?play=1&vis=0&noreload=1');
    await press(B.A);
    await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
    await press(B.Y);
    const first = await focused(page);
    check(/Enter the arena/.test(first), `Y opens the list on « Enter the arena »: ${first}`);
    await press(B.A);
    await page.waitForSelector('.pm-skills', { timeout: 20000 }).catch(() => {});
    const four = () => page.evaluate(() => document.querySelector('.pm-skills .pm-purse b')?.textContent);
    const n0 = await four(); await press(B.X); const n1 = await four(); await press(B.X); const n2 = await four();
    const sheetCaps = await caps(page, '.pm-skills .pm-foot kbd');
    check(n0 === '4' && n1 === '3' && n2 === '4' && sheetCaps.map((c) => c.label).join() === 'X,A,B', `the match sheet: X leaves a skill out and brings it back (${n0} ${n1} ${n2}), its foot X, A, B`);
    await page.screenshot({ path: path.join(outDir, '2-sheet.png') });
    await press(B.A);
    acts.push(...await page.evaluate(() => window.__acts ?? []));
    const to = await page.evaluate(() => window.__go);
    check(/scene=arena/.test(to ?? ''), `A enters the arena: ${to}`);
    await open(to);
    await press(B.A);
    const fight = await page.evaluate(() => ({ band: !!document.querySelector('.pm-overlay'), paused: window.__arena.paused }));
    check(!fight.band && !fight.paused, `A « Fight »: ${JSON.stringify(fight)}`);
    // the duel played by the computer (lot 2, journal Passe LC3): its foot shows ×2 under the attack's button and « Skip » under the dodge's
    const bar = await caps(page, '#ah-bar kbd');
    check(bar.map((c) => `${c.key}:${c.label}`).join() === 'attack:X,dodge:A', `the duel's foot shows X (×2) and A (Skip): ${bar.map((c) => `${c.key}:${c.label}`)}`);
    await press(B.X); await frames(4);
    const fast = await page.evaluate(() => window.__arena.speed);
    await press(B.X); await frames(4);
    const slow = await page.evaluate(() => window.__arena.speed);
    check(fast === 2 && slow === 1, `X: ×2 (${fast}), and back (${slow})`);
    await press(B.START);
    // the pause's words (a cap's own letters left out) and, since journal Passe RG3, its settings line under the pad's Y (RG-2)
    const pause = await page.evaluate(() => ({ paused: window.__arena.paused, words: [...document.querySelectorAll('#ah-pause span')].filter((s) => !s.closest('kbd') && getComputedStyle(s).display !== 'none').map((s) => s.textContent), cap: document.querySelector('#ah-pause .pad-only kbd')?.getAttribute('aria-label'), set: document.querySelector('#ah-pause .ah-set kbd')?.getAttribute('aria-label') ?? null }));
    await page.screenshot({ path: path.join(outDir, '2-pause.png') });
    await press(B.START);
    const resumed = await page.evaluate(() => window.__arena.paused);
    check(pause.paused && pause.cap === 'Menu' && pause.words.join() === 'to resume' && pause.set === 'Y' && !resumed, `Start pauses, under the pad's button (${pause.words}; the settings under ${pause.set}), and resumes`);
    // a blow taken by Ren in the script: the pad rumbles
    await page.waitForFunction(() => (window.__rumbles ?? []).length > 0, { timeout: 60000 }).catch(() => {});
    const rumbles = await page.evaluate(() => window.__rumbles ?? []);
    check(rumbles.length > 0 && rumbles[0].type === 'dual-rumble' && rumbles[0].duration > 0, `a blow taken makes the pad rumble: ${JSON.stringify(rumbles[0] ?? null)}`);
    // A « Skip »: the duel's K.O. at once, then its result
    await press(B.A);
    await page.waitForSelector('.pm-overlay .pm-btn', { timeout: 30000 }).catch(() => {});
    const won = await page.evaluate(() => ({ over: window.__arena.sim.over, t: window.__arena.sim.t }));
    check(won.over, `A skips to the end: ${won.t.toFixed(1)} s`);
    await press(B.A);
    const back = await page.evaluate(() => window.__go);
    check(!!back && !/scene=arena/.test(back), `A « Back to the city »: ${back}`);
    acts.push(...await page.evaluate(() => window.__acts ?? []));
    const outcome = await page.evaluate(() => window.__outcome);
    await open(back);
    const h = await page.evaluate(() => window.__game.hash());
    // Node replays the pages' actions
    const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
    try {
      const G = await server.ssrLoadModule('/src/simulation/index.ts');
      let s = G.newGame(+seedS >>> 0, 'Aster'); G.makeV2(s);
      for (const a of acts) { const r = G.advance(s, a); if (!r.ok) console.log('replay refused', JSON.stringify(a), r.reason); s = r.state; }
      check(acts.some((a) => a.type === 'fight') && G.hash(s) === h, `Node replays the ${acts.length} actions the pages applied (the outcome ${outcome?.winner}): ${G.hash(s)} = ${h}`);
    } finally { await server.close(); }
  });

  // ------------------------------------------------------------------------------------------------ 3. a square: a cutscene, a way out
  await session(XBOX, async ({ page, frames, press, stick, open }) => {
    await open('?play=1&noreload=1&state=v2-forecourt-morning&name=Aster&vis=0&cutscene=1');
    const scene = await page.waitForSelector('.pm-scene .pm-line', { timeout: 30000 }).then(() => true).catch(() => false);
    if (scene) {
      const l0 = await page.evaluate(() => document.querySelector('.pm-scene .pm-line')?.textContent);
      await press(B.A);
      const l1 = await page.waitForFunction((l0) => { const l = document.querySelector('.pm-scene .pm-line')?.textContent ?? null; return l !== l0 ? l ?? 'end' : null; }, { timeout: 20000 }, l0).then((h) => h.jsonValue()).catch(() => null);
      // the pad's first press took the caps: the next line's row shows its buttons
      const sceneCaps = await caps(page, '.pm-scene kbd');
      check(sceneCaps.map((c) => c.label).join() === 'A,Menu' && !!l1, `a cutscene: its row shows ${sceneCaps.map((c) => c.label).join(' and ')}, A the next line (${(l0 ?? '').slice(0, 30)} -> ${(l1 ?? '').slice(0, 30)})`);
      // Start skips at a line (the keyboard's Esc as well): pressed until the scene is over
      for (let i = 0; i < 30 && await page.evaluate(() => !!document.querySelector('.pm-scene')); i++) { await press(B.START); await sleep(400); }
      check(await page.evaluate(() => !document.querySelector('.pm-scene')), 'Start skips the rest');
    } else check(true, 'no cutscene pending on this square (nothing to skip)');
    await press(B.A); await page.evaluate(() => { for (const x of document.querySelectorAll('.pm-overlay .pm-btn')) { x.click(); break; } });
    await page.evaluate(() => { const P = window.__plaza, x = P.place.exits.find((w) => w.to === 'training'); P.player.pos.set(x.out.x0 > 0 ? x.out.x0 + 0.4 : x.out.x1 - 0.4, 0, (x.lane.z0 + x.lane.z1) / 2); });
    await stick(1, 0);
    const go = await page.waitForFunction('window.__go', { timeout: 60000 }).then((h) => h.jsonValue()).catch(() => null);
    await stick(0, 0);
    check(!!go && go.includes('arrive=forecourt'), `the stick walks into the way to the training ground: ${go}`);
  });

  // ------------------------------------------------------------------------------------------------ 4. the title screen
  await session(XBOX, async ({ page, press }) => {
    await page.goto(`${BASE}?title=1`, { waitUntil: 'load', timeout: READY });
    await page.waitForSelector('#title-menu .pm-btn', { timeout: 60000 });
    await sleep(800);
    const f0 = await focused(page); await press(B.DOWN); const f1 = await focused(page);
    check(/Continue/.test(f0) && /New game/.test(f1), `the D-pad walks the title screen: ${f0.slice(0, 20)} -> ${f1.slice(0, 20)}`);
    await press(B.A);
    const named = await page.evaluate(() => document.activeElement?.id);
    await press(B.DOWN); await press(B.B);
    const back = await page.evaluate(() => [...document.querySelectorAll('#title-menu .pm-btn')].map((x) => x.dataset.id).join());
    check(named === 'title-name' && back === 'continue,new,explore,settings', `A opens « New game » (${named}), B goes back (${back})`);
    await Promise.all([page.waitForNavigation({ timeout: 60000 }).catch(() => null), page.evaluate(() => window.__padSet(0, true))]);
    check(/play=1/.test(page.url()), `A « Continue » takes up the game: ${page.url().replace(BASE, '/')}`);
  });

  // ------------------------------------------------------------------------------------------------ 5. a DualSense
  await session(DUALSENSE, async ({ page, press, open }) => {
    await open('?play=1&noreload=1&state=v2-day1-morning&name=Aster&vis=0');
    await press(B.A);
    const hints = await caps(page, '#pm-hints kbd');
    check(await page.evaluate(() => window.__pad.family) === 'ps' && hints[0].label === 'Triangle' && hints[0].svg && hints[1].label === 'Options', `a DualSense shows its symbols: ${JSON.stringify(hints.map((c) => c.label))}`);
    await press(B.Y);
    await page.screenshot({ path: path.join(outDir, '5-dualsense.png') });
  });

  // ------------------------------------------------------------------------------------------------ 6. today's game, today's arena: nothing
  await session(XBOX, async ({ page, press, stick, open }) => {
    await open(`?play=1&new=1&name=Aster&seed=${seedS}&vis=0&noreload=1&v2=0`);
    const p0 = await page.evaluate(() => [window.__app.actors.player.pos.x, window.__app.actors.player.pos.z]);
    await press(B.A); await stick(1, 0); await new Promise((r) => setTimeout(r, 600)); await stick(0, 0);
    const r = await page.evaluate(() => ({ pad: !!window.__pad, at: [window.__app.actors.player.pos.x, window.__app.actors.player.pos.z], keys: [...document.querySelectorAll('#pm-hints kbd')].map((k) => k.textContent) }));
    check(!r.pad && r.at[0] === p0[0] && r.at[1] === p0[1] && r.keys.join() === 'Q,Esc', `today's game: no pad layer, the hero still, the keys shown: ${JSON.stringify(r)}`);
    // today's arena is `v2=0` since VD-4 (journal Passe VD2: the bare `?scene=arena` plays the version 2's duel, which reads the shared pad)
    await open('?scene=arena&v2=0');
    check(await page.evaluate(() => !window.__pad), 'today\'s arena: no shared pad layer (its own pollPad, unchanged)');
  });
  check(errors === 0, `no page error (${errors})`);
} finally { await b.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
