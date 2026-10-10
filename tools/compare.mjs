// Side-by-side before/after composite: node tools/compare.mjs <out.png> <before.png> <after.png> ["caption"]
// Both inputs are scaled to 960 px wide and labelled; useful for art-pass reviews.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const [out, before, after, caption = ''] = process.argv.slice(2);
if (!out || !before || !after) throw new Error('usage: node tools/compare.mjs <out.png> <before.png> <after.png> ["caption"]');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean).find((p) => fs.existsSync(p));
if (!exe) throw new Error('No Chrome/Edge found. Set CHROME_PATH.');

const uri = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
const panel = (src, label) => `<figure><img src="${uri(src)}"><figcaption>${label}</figcaption></figure>`;
const html = `<!doctype html><html><head><style>
  body{margin:0;background:#05070d;color:#d9c9a8;font:600 15px 'Segoe UI',system-ui,sans-serif;letter-spacing:.12em}
  .row{display:flex} figure{margin:0;position:relative;width:960px} img{display:block;width:960px}
  figcaption{position:absolute;left:12px;top:10px;padding:3px 10px;background:rgba(5,7,13,.72);border:1px solid rgba(233,166,76,.45);border-radius:3px}
  .cap{padding:9px 14px 11px;font-weight:400;letter-spacing:.04em;color:#b9c3d8;font-size:14px}
</style></head><body><div id="c"><div class="row">${panel(before, 'BEFORE')}${panel(after, 'AFTER')}</div>${caption ? `<div class="cap">${caption}</div>` : ''}</div></body></html>`;

const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', defaultViewport: { width: 1920, height: 1200 } });
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  const el = await page.$('#c');
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  await el.screenshot({ path: out });
  console.log(`wrote ${out}`);
} finally { await browser.close(); }
