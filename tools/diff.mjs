// Pixel diff of two same-size screenshots: node tools/diff.mjs <a.png> <b.png> [out.png] [threshold=24]
// Prints the share of pixels whose max channel difference exceeds the threshold and writes an amplified diff.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const [a, b, out, thr = '24'] = process.argv.slice(2);
if (!a || !b) throw new Error('usage: node tools/diff.mjs <a.png> <b.png> [out.png] [threshold]');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean).find((p) => fs.existsSync(p));
const uri = (f) => `data:image/png;base64,${fs.readFileSync(f).toString('base64')}`;
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new' });
try {
  const page = await browser.newPage();
  const res = await page.evaluate(async (ua, ub, t) => {
    const load = (u) => new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = u; });
    const [ia, ib] = await Promise.all([load(ua), load(ub)]);
    const W = ia.width, H = ia.height, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d');
    g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, W, H).data;
    g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, W, H);
    let n = 0, maxd = 0; let bx0 = W, by0 = H, bx1 = -1, by1 = -1;
    const o = db.data;
    for (let i = 0; i < o.length; i += 4) {
      const d = Math.max(Math.abs(da[i] - o[i]), Math.abs(da[i + 1] - o[i + 1]), Math.abs(da[i + 2] - o[i + 2]));
      maxd = Math.max(maxd, d);
      if (d > t) { n++; const p = i / 4, x = p % W, y = Math.floor(p / W); bx0 = Math.min(bx0, x); by0 = Math.min(by0, y); bx1 = Math.max(bx1, x); by1 = Math.max(by1, y); }
      const v = Math.min(255, d * 6); o[i] = v; o[i + 1] = v * 0.6; o[i + 2] = d > t ? 255 : v * 0.3; o[i + 3] = 255;
    }
    g.putImageData(db, 0, 0);
    return { share: n / (W * H), n, maxd, box: bx1 >= 0 ? [bx0, by0, bx1, by1] : null, png: c.toDataURL('image/png') };
  }, uri(a), uri(b), Number(thr));
  if (out) fs.writeFileSync(out, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log(`${(res.share * 100).toFixed(3)}% pixels differ > ${thr} (${res.n} px, max ${res.maxd})${res.box ? ` within [${res.box.join(', ')}]` : ''}`);
} finally { await browser.close(); }
