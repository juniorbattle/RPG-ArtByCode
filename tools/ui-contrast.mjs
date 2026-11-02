// The interface's contrast measured in the real game (journal Passe UM2; UM-1, direction A « Voile »: the text sits on a veil over the live scene,
// so a colour pair says nothing): for each page, every visible text node's own colour against the pixels really under it. The page is shot
// with every text transparent (the veils, the rules and the keys' outlines left): the pixels the player sees behind the words. For each text box, the WCAG ratio of the text's colour on each background
// pixel; the box's figure is the 5th percentile (the 5 % least favourable pixels, the audit's rule, journal Passe UM1). Fails under 4.5:1 (or
// `--min=`). A text over a moving scene changes with the frame: `--shots=n` measures n moments of each page, a second apart, and keeps the worst.
//   node tools/ui-contrast.mjs [--json=f] [--min=4.5] [--shots=2] "name|<query>|<WxH,..>|<js>" ...
//   (a DEV server for named states, BASE_URL, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs; `?title=1` for the title screen; a page's
//   JS is evaluated after its loading screen, the news card closed unless the JS says `news`)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { decodePng } from './art-lab/png.mjs';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const opt = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const specs = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!specs.length) throw new Error('usage: node tools/ui-contrast.mjs [--json=f] [--min=4.5] [--shots=2] "name|<query>|<WxH,..>|<js>" ...');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', MIN = +opt('min', 4.5), SHOTS = +opt('shots', 2), READY = +(process.env.READY_MS || 600000);
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];

const lin = (c) => { const s = c / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

/** in the page: every visible text node (not covered, inside the viewport), its box, colour and effective opacity */
function listTexts() {
  const out = [], tw = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = tw.nextNode(); n; n = tw.nextNode()) {
    const text = n.nodeValue.trim(), el = n.parentElement;
    if (!text || !el || ['SCRIPT', 'STYLE'].includes(el.tagName)) continue;
    let op = 1, vis = true;
    for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e); if (c.display === 'none' || c.visibility === 'hidden') vis = false; op *= +c.opacity; }
    if (!vis || op < 0.05) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    for (const b of r.getClientRects()) {
      if (b.width < 2 || b.height < 2 || b.right <= 0 || b.bottom <= 0 || b.left >= innerWidth || b.top >= innerHeight) continue;
      const hit = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2);
      if (hit && !(hit === el || el.contains(hit) || hit.contains(el)) && !hit.closest?.('canvas')) continue;
      const m = getComputedStyle(el).color.match(/[\d.]+/g).map(Number);
      out.push({ text: text.slice(0, 48), where: el.id ? `#${el.id}` : el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase(), x: b.left, y: b.top, w: b.width, h: b.height, rgb: m.slice(0, 3), a: (m[3] ?? 1) * op });
    }
  }
  return out;
}

const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: READY });
const all = [];
let failed = 0;
try {
  for (const spec of specs) {
    const [name, query, sizes, js] = spec.split('|');
    for (const size of (sizes || '1920x1080').split(',')) {
      const [w, h] = size.split('x').map(Number), page = await b.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      await page.goto(`${BASE}?${query}`, { waitUntil: 'load', timeout: READY });
      await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
      await new Promise((r) => setTimeout(r, 1500));
      if (!/news/.test(js ?? '')) await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
      if (js) await page.evaluate(js);
      await new Promise((r) => setTimeout(r, 700));
      const worst = new Map();
      for (let s = 0; s < SHOTS; s++) {
        if (s) await new Promise((r) => setTimeout(r, 1000));
        const texts = await page.evaluate(listTexts);
        // the background: every text transparent, the transitions cut (the keys' outlines, the rules and the veils stay)
        await page.addStyleTag({ content: '*{transition:none!important;animation:none!important}*,*::before,*::after{color:transparent!important;-webkit-text-stroke-color:transparent!important;caret-color:transparent!important}input::placeholder{color:transparent!important}' });
        await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        const shot = decodePng(Buffer.from(await page.screenshot({ type: 'png' })));
        await page.evaluate(() => document.head.lastElementChild.remove());
        for (const t of texts) {
          const x0 = Math.max(0, Math.round(t.x)), y0 = Math.max(0, Math.round(t.y)), x1 = Math.min(w, Math.round(t.x + t.w)), y1 = Math.min(h, Math.round(t.y + t.h)), rs = [];
          const fg = t.rgb;
          for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
            const i = (y * shot.W + x) * 4, bg = [shot.rgba[i], shot.rgba[i + 1], shot.rgba[i + 2]];
            // the text over its background (a faded text blends toward it)
            const c = fg.map((v, k) => v * t.a + bg[k] * (1 - t.a));
            rs.push(ratio(lum(...c), lum(...bg)));
          }
          if (!rs.length) continue;
          rs.sort((p, q) => p - q);
          const v = rs[Math.floor(rs.length * 0.05)], k = `${t.where}|${t.text}`;
          if (!worst.has(k) || v < worst.get(k).ratio) worst.set(k, { where: t.where, text: t.text, ratio: +v.toFixed(2), box: [x0, y0, x1 - x0, y1 - y0] });
        }
      }
      const rows = [...worst.values()].sort((p, q) => p.ratio - q.ratio), bad = rows.filter((r) => r.ratio < MIN);
      failed += bad.length;
      console.log(`${bad.length ? 'FAIL' : 'ok  '} ${name} ${size}: ${rows.length} texts, lowest ${rows[0]?.ratio}:1 (${rows[0]?.where} « ${rows[0]?.text} »), ${bad.length} under ${MIN}:1`);
      for (const r of bad.slice(0, 8)) console.log(`     ${r.ratio}:1 ${r.where} « ${r.text} » at ${r.box.join(',')}`);
      all.push({ name, size, rows });
      await page.close();
    }
  }
} finally { await b.close(); }
if (opt('json')) { fs.mkdirSync(path.dirname(path.resolve(opt('json'))), { recursive: true }); fs.writeFileSync(opt('json'), JSON.stringify(all, null, 1)); }
console.log(failed ? `${failed} text(s) under ${MIN}:1` : `every text at ${MIN}:1 or more`);
process.exit(failed ? 1 : 0);
