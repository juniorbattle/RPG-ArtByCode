// N-up labelled crop composite (pixel-level review of the occlusion reveal variants):
//   node tools/occ-compare.mjs <out.png> "<caption>" "label|file.png|x,y,w,h|scale" ...   (crop and scale optional)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';
import path from 'node:path';

const [out, caption, ...panels] = process.argv.slice(2);
if (!out || panels.length === 0) throw new Error('usage: node tools/occ-compare.mjs <out.png> "<caption>" "label|file|x,y,w,h|scale" ...');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean).find((p) => fs.existsSync(p));
const cols = Number(process.env.COLS || panels.length);
const fig = (spec) => {
  const [label, file, crop = '0,0,1920,1080', scale = '1'] = spec.split('|');
  const [x, y, w, h] = crop.split(',').map(Number), s = Number(scale);
  return `<figure style="width:${w * s}px;height:${h * s}px"><img src="data:image/png;base64,${fs.readFileSync(file).toString('base64')}" style="left:${-x * s}px;top:${-y * s}px;transform:scale(${s})"><figcaption>${label}</figcaption></figure>`;
};
const html = `<!doctype html><html><head><style>
  body{margin:0;background:#05070d;color:#d9c9a8;font:600 14px 'Segoe UI',system-ui,sans-serif;letter-spacing:.1em}
  #g{display:grid;grid-template-columns:repeat(${cols},auto);gap:4px;padding:4px;width:max-content}
  figure{margin:0;position:relative;overflow:hidden} img{position:absolute;transform-origin:0 0;image-rendering:pixelated}
  figcaption{position:absolute;left:8px;top:8px;padding:2px 9px;background:rgba(5,7,13,.74);border:1px solid rgba(233,166,76,.45);border-radius:3px}
  .cap{padding:8px 12px;font-weight:400;letter-spacing:.03em;color:#b9c3d8;font-size:13px}
</style></head><body><div id="c"><div id="g">${panels.map(fig).join('')}</div>${caption ? `<div class="cap">${caption}</div>` : ''}</div></body></html>`;
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', defaultViewport: { width: 2400, height: 1400 } });
try {
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'load' });
  fs.mkdirSync(path.dirname(path.resolve(out)), { recursive: true });
  await (await page.$('#c')).screenshot({ path: out });
  console.log(`wrote ${out}`);
} finally { await browser.close(); }
