// Nearest-neighbour crop + upscale for pixel-level review: node tools/zoom.mjs <in.png> <out.png> x y w h [scale=3]
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const [src, out, x, y, w, h, scale = '3'] = process.argv.slice(2);
if (!src || !out || h === undefined) throw new Error('usage: node tools/zoom.mjs <in.png> <out.png> x y w h [scale]');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean).find((p) => fs.existsSync(p));
const s = Number(scale), W = Number(w) * s, H = Number(h) * s;
const html = `<!doctype html><body style="margin:0"><div id="c" style="width:${W}px;height:${H}px;overflow:hidden;position:relative">
<img src="data:image/png;base64,${fs.readFileSync(src).toString('base64')}" style="position:absolute;left:${-x * s}px;top:${-y * s}px;image-rendering:pixelated;transform-origin:0 0;transform:scale(${s})"></div></body>`;
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', defaultViewport: { width: Math.max(800, W), height: Math.max(600, H) } });
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  await (await page.$('#c')).screenshot({ path: out });
  console.log(`wrote ${out}`);
} finally { await browser.close(); }
