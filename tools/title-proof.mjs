// The title screen's proof (journal Passe L4; plan § 7, PD): the bare address in a browser that does not announce automation shows the title
// screen (« New game », « Explore the district », and « Continue » only with a save); « Explore the district » then gives exactly the town
// at midday (the operator's decision L7-6a, journal Passe D9): the same deterministic capture as a frozen main's ?time=midday (BASE_QUERY,
// default 'time=midday'; BASE_QUERY= gives main's bare address, the night: the negative control), at threshold 0. The harness of
// tools/detshots.mjs (seeded Math.random, the loop held, N fixed steps, one render).
//   node tools/title-proof.mjs <outDir> <base server url> <branch server url> [steps=120]   (W / H, BASE_QUERY, CHROME_PATH / CHROME_ARGS / READY_MS)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, BASE, BRANCH, stepsS = '120'] = process.argv.slice(2);
if (!outDir || !BASE || !BRANCH) throw new Error('usage: node tools/title-proof.mjs <outDir> <base url> <branch url> [steps]');
const BASE_QUERY = process.env.BASE_QUERY ?? 'time=midday';
const W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const HOLD = `Object.defineProperty(window, '__app', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__app', { value: v, writable: true, configurable: true }); } });`;
/** a browser a person drives: the page must not see automation */
const HUMAN = `Object.defineProperty(Navigator.prototype, 'webdriver', { get: () => false });`;
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };

async function capture(url, file, viaTitle, save) {
  const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
  try {
    const page = await b.newPage();
    page.on('pageerror', (e) => { failed++; console.log('[pageerror]', e.message); });
    await page.evaluateOnNewDocument(SEED); await page.evaluateOnNewDocument(HOLD);
    if (viaTitle) await page.evaluateOnNewDocument(HUMAN);
    if (save) {
      // a save in this origin's storage, then the bare address again: « Continue » must show
      await page.goto(`${url}?play=1&noreload=1&new=1&name=Aster&vis=0`, { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
    }
    await page.goto(url, { waitUntil: 'load' });
    if (viaTitle) {
      await page.waitForSelector('#title-screen .pm-btn', { timeout: 60000 });
      const ids = await page.evaluate(() => [...document.querySelectorAll('#title-screen .pm-btn')].map((x) => x.dataset.id));
      check(JSON.stringify(ids) === JSON.stringify(save ? ['continue', 'new', 'explore'] : ['new', 'explore']), `the title screen's buttons ${save ? 'with' : 'without'} a save: ${ids.join(', ')}`);
      check(await page.evaluate(() => window.__app === undefined && window.__ready === undefined), 'nothing generated behind the title screen');
      await page.screenshot({ path: file.replace(/\.png$/, '-title.png') });
      if (save) return;
      await page.click('#title-screen .pm-btn[data-id="explore"]');
    }
    await page.waitForFunction('window.__ready === true', { timeout: READY });
    await new Promise((r) => setTimeout(r, 1200));
    await page.evaluate((steps) => {
      const a = window.__app, u = a.update.bind(a), r = a.render.bind(a);
      let clock = 0; const frozen = (fn) => { const n = performance.now; performance.now = () => clock; try { return fn(); } finally { performance.now = n; } };
      for (let i = 0; i < steps; i++) { clock += 1000 / 60; frozen(() => u(1 / 60)); }
      frozen(() => { a.sprites.update(a.actors.actors, a.lights, a.rig.camera, a.moonDir, a.actors.interactTarget, a.actors.player); r(); });
    }, +stepsS);
    await page.screenshot({ path: file });
  } finally { await b.close(); }
}

const base = path.join(outDir, BASE_QUERY ? `main-${BASE_QUERY.replace(/[^a-z0-9]+/gi, '-')}.png` : 'bare-main.png'), branch = path.join(outDir, 'bare-title-explore.png');
await Promise.all([capture(BASE_QUERY ? `${BASE}${BASE.includes('?') ? '&' : '?'}${BASE_QUERY}` : BASE, base, false, false), capture(BRANCH, branch, true, false)]);
await capture(BRANCH, path.join(outDir, 'bare-with-save.png'), true, true);
console.log(failed ? `${failed} check(s) failed` : 'title checks passed; compare the two captures with tools/diff.mjs at threshold 0');
process.exit(failed ? 1 : 0);
