// Captures of the play mode (journal Passe L4; PROJECT_MASTER_CONTRACT § 14: « captures desktop et mobile »): a named state of the game
// (DEV server: `?state=`), at several window sizes, optionally with a panel opened by its JS (a dialogue: `__ui.openPerson('mara')`).
// Characters and NPCs move (the loop runs), so these are review images, not pixel proofs.
//   node tools/play-shots.mjs <outDir> "name|<named state>|<WxH,WxH..>|<js>|<extra query>" ...
//   (BASE_URL, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs; the culling bake is skipped with vis=0 unless the extra query sets vis)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, ...specs] = process.argv.slice(2);
if (!outDir || !specs.length) throw new Error('usage: node tools/play-shots.mjs <outDir> "name|state|WxH,..|js|extra" ...');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: +(process.env.READY_MS || 600000) });
let errors = 0;
try {
  for (const spec of specs) {
    const [name, state, sizes, js, extra] = spec.split('|');
    for (const size of (sizes || '1280x720').split(',')) {
      const [w, h] = size.split('x').map(Number), page = await b.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      page.on('pageerror', (e) => { errors++; console.log('[pageerror]', name, e.message); });
      const q = `play=1&noreload=1&state=${encodeURIComponent(state)}&name=Aster${/(^|&)vis=/.test(extra ?? '') ? '' : '&vis=0'}${extra ? `&${extra}` : ''}`;
      await page.goto(`${BASE}?${q}`, { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true || window.__error', { timeout: +(process.env.READY_MS || 600000) });
      const err = await page.evaluate(() => window.__error ?? null);
      if (err) { errors++; console.log('[error]', name, err); }
      await new Promise((r) => setTimeout(r, 1500));   // the loading screen fades
      // the news card of a fresh page is closed first, unless the js asks for it
      if (!/news/.test(js ?? '')) await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
      if (js) await page.evaluate(js);
      await new Promise((r) => setTimeout(r, 600));
      const file = path.join(outDir, `${name}-${w}x${h}.png`);
      await page.screenshot({ path: file });
      console.log('shot', file);
      await page.close();
    }
  }
} finally { await b.close(); }
if (errors) { console.log(`${errors} page error(s)`); process.exit(1); }
