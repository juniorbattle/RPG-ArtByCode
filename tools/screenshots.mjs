// Headless screenshot harness: `npm run shots [-- name=query ...]`
// Requires the dev server (npm run dev) on http://127.0.0.1:5173 and a local Chrome/Edge install.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const CHROME_CANDIDATES = [
  process.env.CHROME_PATH,
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);
const exe = CHROME_CANDIDATES.find((p) => fs.existsSync(p));
if (!exe) throw new Error('No Chrome/Edge found. Set CHROME_PATH.');

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const OUT = path.resolve(process.env.SHOTS_DIR || 'screenshots');
fs.mkdirSync(OUT, { recursive: true });

// name -> query string (`player=x,z` places the player and settles the follow camera; `@x,y,w,h` clips)
const DEFAULT_SHOTS = {
  '01-hero': 'seed=1842&forge=normal&clean=1&freeze=7.3',
  '02-forge-sabotaged': 'seed=1842&forge=sabotaged&clean=1&freeze=7.3&player=6.4,1.2',
  '03-far-quay': 'seed=1842&forge=normal&clean=1&freeze=7.3&player=24,1.2',
  '04-alt-seed-a': 'seed=7719&forge=normal&clean=1&freeze=7.3',
  '05-alt-seed-b': 'seed=30417&forge=normal&clean=1&freeze=7.3',
};

const args = process.argv.slice(2);
const shots = {};
const flags = { width: 1920, height: 1080, gl: 'angle-d3d11', metrics: false };
for (const a of args) {
  const m = a.match(/^(\w+)=(.*)$/);
  if (!m) continue;
  if (m[1] in flags) flags[m[1]] = m[2] === 'false' ? false : m[2] === 'true' ? true : isNaN(+m[2]) ? m[2] : +m[2];
}
const named = args.filter((a) => /^[\w-]+:/.test(a)).map((a) => a.split(/:(.*)/s));
if (named.length) for (const [k, v] of named) shots[k] = v; else Object.assign(shots, DEFAULT_SHOTS);

const glArgs = flags.gl === 'swiftshader'
  ? ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
  : ['--use-gl=angle', '--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist'];

const browser = await puppeteer.launch({
  executablePath: exe,
  headless: 'new',
  args: [...glArgs, '--no-sandbox', `--window-size=${flags.width},${flags.height}`, '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
  defaultViewport: { width: flags.width, height: flags.height, deviceScaleFactor: 1 },
});
try {
  for (const [name, query] of Object.entries(shots)) {
    const page = await browser.newPage();
    const logs = [];
    page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
    page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}`));
    const [q0, clipS] = query.split('@');
    const url = `${BASE}?${q0}`;
    const t0 = Date.now();
    await page.goto(url, { waitUntil: 'load' });
    try {
      await page.waitForFunction('window.__ready === true', { timeout: 120000 });
    } catch (e) {
      console.log('TIMEOUT waiting for __ready on', name);
      console.log(logs.join('\n'));
    }
    await new Promise((r) => setTimeout(r, flags.settle ?? 1800));
    const file = path.join(OUT, `${name}.png`);
    const clip = clipS ? (([x, y, width, height]) => ({ x, y, width, height }))(clipS.split(',').map(Number)) : undefined;
    await page.screenshot({ path: file, clip });
    const stats = await page.evaluate('window.__stats ? JSON.stringify(window.__stats()) : null');
    console.log(`${name}: ${file} (${Date.now() - t0} ms)`, stats ?? '');
    const errs = logs.filter((l) => /error|warn/i.test(l));
    if (errs.length) console.log(errs.slice(0, 12).join('\n'));
    await page.close();
  }
} finally {
  await browser.close();
}
