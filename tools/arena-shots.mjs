// Captures of the arena prototype (`arena/arena.html`, journal Passe A1): the page is served from its folder by a throw-away local server,
// Math.random is seeded, the page's own loop stops rendering (`__bake.S.noRender`) and each variant jumps to one of the prototype's scripted
// moments (`__bake.jump`, deterministic simulation, then paused) before one render and a screenshot. Same moment, two files = before / after.
//   node tools/arena-shots.mjs <outDir> <file.html> "name|preset|js" ...
//     preset: charging, ready, casting, window, impact, block, guardbreak, dodge, technique, combo, single (empty = as booted)
//     js (optional) runs after the jump and before the render, against window.__bake (e.g. "__assist='full'")
//   W / H env: viewport (default 1280 x 720); CHROME_PATH / CHROME_ARGS / READY_MS env as tools/detshots.mjs;
//   ARENA_THREE=<three.min.js r128>: served in place of the cdnjs copy (a machine without access to cdnjs, e.g. a cloud session);
//   ARENA_FONTS=0: the Google Fonts requests are dropped (fallback fonts).
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const [outDir, file, ...vars] = process.argv.slice(2);
if (!outDir || !file || !vars.length) throw new Error('usage: node tools/arena-shots.mjs <outDir> <file.html> "name|preset|js" ...');
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
fs.mkdirSync(outDir, { recursive: true });
const dir = path.dirname(path.resolve(file)), name = path.basename(file);
const server = http.createServer((q, s) => {
  const p = path.join(dir, decodeURIComponent(q.url.split('?')[0]));
  if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); s.end(); return; }
  s.writeHead(200, { 'content-type': p.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' }); s.end(fs.readFileSync(p));
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 } });
try {
  const page = await b.newPage(); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('[console]', m.text()); });
  await page.setRequestInterception(true);
  page.on('request', (q) => {
    const u = q.url();
    if (u === THREE_URL && process.env.ARENA_THREE) return q.respond({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(process.env.ARENA_THREE) });
    if (process.env.ARENA_FONTS === '0' && /fonts\.(googleapis|gstatic)\.com/.test(u)) return q.abort();
    return q.continue();
  });
  await page.evaluateOnNewDocument(SEED);
  await page.goto(`http://127.0.0.1:${server.address().port}/${name}?clean=1`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.__bake && window.__bake.R && window.__bake.R.hd2d && !document.getElementById("boot")', { timeout: +(process.env.READY_MS || 300000) });
  await page.evaluate(() => { window.__bake.S.noRender = true; });
  for (const v of vars) {
    const [label, preset, js] = v.split('|');
    const t0 = Date.now();
    await page.evaluate((p, j) => { const B = window.__bake; if (p) B.jump(p); if (j) (0, eval)(j); B.renderOnce(); }, preset || '', js || '');
    await page.screenshot({ path: path.join(outDir, `${label}.png`) });
    console.log(label, `${Date.now() - t0} ms`);
  }
} finally { await b.close(); server.close(); }
