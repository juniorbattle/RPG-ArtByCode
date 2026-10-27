// Deterministic captures of the version 2's squares (journal Passe VP1): a named state of the play mode (DEV server: `&state=`), Math.random
// seeded, the page's loop never started (PlazaApp.start a no-op, as tools/detshots.mjs holds the town), the interface hidden, then for each
// pose the hero placed at (x, z) with the camera settled on him (`__plaza.posePlayer`), one frame drawn and captured. `static=1` in the extra
// query shows the decor alone. Two loads of the same pose give the same pixels (the witness); compare with tools/diff.mjs.
//   node tools/plaza-shots.mjs <outDir> "<named state>" "<extra query>" "name|x,z[|js]" ...
//   (BASE_URL, W / H (default 1280 x 720), CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, state, extra = '', ...specs] = process.argv.slice(2);
if (!outDir || !state || !specs.length) throw new Error('usage: node tools/plaza-shots.mjs <outDir> "<named state>" "<extra query>" "name|x,z[|js]" ...');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const HOLD = `Object.defineProperty(window, '__plaza', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__plaza', { value: v, writable: true, configurable: true }); } });`;
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: READY });
let failed = 0;
try {
  const page = await b.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { failed++; console.log('[pageerror]', e.message); });
  await page.evaluateOnNewDocument(SEED); await page.evaluateOnNewDocument(HOLD);
  const q = `play=1&noreload=1&state=${encodeURIComponent(state)}&name=Aster&fps=off&cutscene=0${extra ? `&${extra}` : ''}`;
  await page.goto(`${BASE}?${q}`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
  const err = await page.evaluate(() => window.__error ?? null);
  if (err) throw new Error(err);
  // the interface out of the picture: the decor is what is reviewed
  await page.addStyleTag({ content: '.pm,#pm-place-tag{display:none!important}*,*::before,*::after{transition:none!important;animation:none!important}' });
  for (const spec of specs) {
    const [name, at, js] = spec.split('|');
    const [x, z] = at.split(',').map(Number);
    if (js) await page.evaluate(js);
    await page.evaluate(([px, pz]) => window.__plaza.posePlayer(px, pz), [x, z]);
    const file = path.join(outDir, `${name}.png`);
    await page.screenshot({ path: file });
    console.log('shot', file, JSON.stringify(await page.evaluate(() => { const s = window.__plaza.snapshot(); return { drawCalls: s.drawCalls, triangles: s.triangles, placeTriangles: s.placeTriangles, lights: `${s.lightsActive}/${s.lights}`, visibility: s.visibility }; })));
  }
} finally { await b.close(); }
if (failed) { console.log(`${failed} page error(s)`); process.exit(1); }
