// Captures of the game's arena scene (`?scene=arena`, journal Passe P1) on a running dev server: the page boots with Math.random seeded,
// then each variant jumps to one of the scripted moments (`__arena.jump(preset)`: deterministic simulation, presentation stepped at fixed
// steps, then paused), runs its js, renders once and is captured. Same moment, two servers or two queries = before / after.
//   node tools/arena-scene-shots.mjs <outDir> "<extra query>" "name|preset|js" ...
//     preset: charging, ready, casting, window, impact, block, guardbreak, dodge, combo, single, technique, strike, heavyRen, ko (empty: as booted)
//     js (optional) runs against window.__arena after the jump, e.g. "__arena.assist='full'"
//   BASE_URL (default http://127.0.0.1:5173/), W / H (viewport, default 1280 x 720), CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs;
//   HOLD=1: the page's loop never starts (ArenaApp.start a no-op, as tools/detshots.mjs holds the town): without it the live seconds between
//   the boot and the first moment leave their mark (the stands' cheers, the particles), so two loads differ on a slow renderer (journal Passe L3)
//   FREEZE_CSS=1: the HUD's CSS transitions and animations stopped before the captures (pulses: journal Passe V1)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const [outDir, extra, ...vars] = process.argv.slice(2);
if (!outDir || extra === undefined || !vars.length) throw new Error('usage: node tools/arena-scene-shots.mjs <outDir> "<extra query>" "name|preset|js" ...');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: +(process.env.READY_MS || 300000) });
let errors = 0;
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  page.on('console', (m) => { if (m.type() === 'error') { errors++; console.log('[console]', m.text()); } });
  await page.evaluateOnNewDocument(SEED);
  if (process.env.HOLD === '1') await page.evaluateOnNewDocument(`Object.defineProperty(window, '__arena', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__arena', { value: v, writable: true, configurable: true }); } });`);
  const q = `scene=arena&freeze=7.3${extra ? '&' + extra : ''}`;
  await page.goto(`${BASE}?${q}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: +(process.env.READY_MS || 300000) });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  // the page's own loop keeps running: stop it from advancing the paused moment (a jump pauses the simulation; the loop only redraws)
  // FREEZE_CSS=1: the HUD's transitions and animations stopped (a pulse's phase differs from one load to the next; journal Passe V1)
  if (process.env.FREEZE_CSS === '1') await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  for (const v of vars) {
    const [label, preset, js] = v.split('|');
    const t0 = Date.now();
    await page.evaluate((p, j) => { const A = window.__arena; if (p) A.jump(p); if (j) (0, eval)(j); A.renderOnce(); }, preset || '', js || '');
    await page.screenshot({ path: path.join(outDir, `${label}.png`) });
    console.log(label, `${Date.now() - t0} ms`, JSON.stringify(await page.evaluate(() => { const s = window.__stats(); return { t: s.t, ren: s.ren, marek: s.marek }; })));
  }
} finally { await b.close(); }
if (errors) { console.log(`${errors} page error(s)`); process.exitCode = 1; }
