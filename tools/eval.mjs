// Evaluate a JS snippet inside the running app: node tools/eval.mjs "<expr using window.__app>" [query]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const exe = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find((p) => fs.existsSync(p));
const expr = process.argv[2];
const query = process.argv[3] ?? 'clean=1&freeze=7.3';
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-size=1280,720'], defaultViewport: { width: 1280, height: 720 } });
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${process.env.BASE_URL || 'http://127.0.0.1:5173/'}?${query}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 120000 });
  const out = await page.evaluate(expr);
  if (process.argv[4]) { await new Promise((r) => setTimeout(r, 1500)); await page.screenshot({ path: process.argv[4] }); }
  console.log(typeof out === 'string' ? out : JSON.stringify(out, null, 1));
} finally { await browser.close(); }
