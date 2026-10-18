// Deterministic captures WITH characters (journal Passes M5 / S1): Math.random is seeded and App.start is a no-op from the first script
// (the game loop never runs outside this harness), then N fixed 1/60 s steps with a frozen clock, then one render + screenshot per variant
// (its JS runs first, against window.__app). Variants share the page, so the NPCs stand where they stood: before / after or effect on / off
// on the same frame. Two loads of the same query give 0 px (repetition witness, Passe M5); tools/screenshots.mjs does not (the loop runs).
//   node tools/detshots.mjs <outDir> "<query>" <steps> "name|js" ...      (BASE_URL env; CLIP=x,y,w,h crops; W / H env = viewport)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const HOLD = `Object.defineProperty(window, '__app', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__app', { value: v, writable: true, configurable: true }); } });`;
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const [outDir, query, stepsS, ...vars] = process.argv.slice(2);
if (!outDir || !query || !vars.length) throw new Error('usage: node tools/detshots.mjs <outDir> "<query>" <steps> "name|js" ...');
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const clip = process.env.CLIP ? (([x, y, width, height]) => ({ x, y, width, height }))(process.env.CLIP.split(',').map(Number)) : undefined;
fs.mkdirSync(outDir, { recursive: true });
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 } });
try {
  const page = await b.newPage(); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.evaluateOnNewDocument(SEED); await page.evaluateOnNewDocument(HOLD);
  await page.goto(`${BASE}?${query}`, { waitUntil: 'load' }); await page.waitForFunction('window.__ready === true', { timeout: 180000 });
  await new Promise((r) => setTimeout(r, 1200));   // the loading screen fades out (the app does not run meanwhile)
  await page.evaluate((steps) => {
    const a = window.__app, u = a.update.bind(a), r = a.render.bind(a);
    let clock = 0; const frozen = (fn) => { const n = performance.now; performance.now = () => clock; try { return fn(); } finally { performance.now = n; } };
    for (let i = 0; i < steps; i++) { clock += 1000 / 60; frozen(() => u(1 / 60)); }
    // a variant may change what the sprites show (a uniform, a flag): their instance data is rebuilt before each render
    window.__det = { render: () => frozen(() => { a.sprites.update(a.actors.actors, a.lights, a.rig.camera, a.moonDir, a.actors.interactTarget, a.actors.player); r(); }) };
  }, +stepsS);
  for (const v of vars) {
    const [name, js] = v.split(/\|(.*)/s);
    if (js) await page.evaluate(js);
    await page.evaluate(() => window.__det.render());
    await page.screenshot({ path: path.join(outDir, `${name}.png`), clip });
    console.log('shot', name);
  }
} finally { await b.close(); }
