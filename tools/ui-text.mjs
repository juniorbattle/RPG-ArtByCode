// The interface's text, measured in the page (journal Passe UI3; the operator's decisions S1 and S4 of Passe UI1): for every visible text node of
// the page (its element and every ancestor displayed, visible and not transparent, inside the viewport), the computed font size and font
// family, and every character against the embedded fonts' subset. Fails when a text is smaller than 16 px on a computer or 14 px on a phone
// (the design system's phone query), when a text is drawn in a font that is not one of the two embedded ones, when a character lies outside
// their subset (a fallback to a system font), when a text is cut (beyond the viewport, or beyond an ancestor that hides its overflow), or
// when the fonts are not loaded.
//   node tools/ui-text.mjs [--json=f] "name|<query>|<WxH,WxH..>|<js>" ...
//   (BASE_URL, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs; the page's first card (the news) is closed unless the js names it;
//   `__arena.jump('<moment>')` works on arena pages)
import { createRequire } from 'node:module';
import fs from 'node:fs';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const args = process.argv.slice(2), json = args.find((a) => a.startsWith('--json='))?.slice(7), specs = args.filter((a) => !a.startsWith('--'));
if (!specs.length) throw new Error('usage: node tools/ui-text.mjs [--json=f] "name|query|WxH,..|js" ...');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const T = +(process.env.READY_MS || 600000);

/** runs in the page */
function measure() {
  const RANGES = [[0, 0xff], [0x131, 0x131], [0x152, 0x153], [0x2bb, 0x2bc], [0x2c6, 0x2c6], [0x2da, 0x2da], [0x2dc, 0x2dc], [0x304, 0x304], [0x308, 0x308], [0x329, 0x329],
    [0x2000, 0x206f], [0x20ac, 0x20ac], [0x2122, 0x2122], [0x2191, 0x2191], [0x2193, 0x2193], [0x2212, 0x2212], [0x2215, 0x2215], [0xfeff, 0xfeff], [0xfffd, 0xfffd]];
  const FAMILIES = ['CdT Pixel', 'CdT Text'];
  const phone = matchMedia('(max-width:700px),(max-height:480px)').matches, min = phone ? 14 : 16;
  const visible = (el) => {
    for (let e = el; e && e !== document.documentElement; e = e.parentElement) {
      const cs = getComputedStyle(e);
      if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false;
    }
    return true;
  };
  const out = { phone, min, smallest: null, texts: 0, covered: 0, tooSmall: [], wrongFont: [], outside: [], cut: [], fonts: [] };
  // a text covered by another element (the loading screen under the title screen, a panel under a card's backdrop) is not the one shown:
  // the topmost element at its centre must be its own element or inside it (hit-testing everything, pointer-events:none included)
  const hit = document.createElement('style'); hit.textContent = '*{pointer-events:auto!important}'; document.head.appendChild(hit);
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    const text = n.textContent.replace(/\s+/g, ' ').trim();
    if (!text) continue;
    const el = n.parentElement;
    if (!el || ['SCRIPT', 'STYLE', 'TITLE'].includes(el.tagName) || !visible(el)) continue;
    const r = document.createRange(); r.selectNodeContents(n);
    const rects = [...r.getClientRects()].filter((q) => q.width > 0 && q.height > 0 && q.right > 0 && q.bottom > 0 && q.left < innerWidth && q.top < innerHeight);
    if (!rects.length) continue;
    const q0 = rects[0], top = document.elementFromPoint(Math.min(innerWidth - 1, Math.max(0, q0.left + q0.width / 2)), Math.min(innerHeight - 1, Math.max(0, q0.top + q0.height / 2)));
    if (top && !(el === top || el.contains(top) || top.contains(el))) { out.covered++; continue; }
    const cs = getComputedStyle(el), size = parseFloat(cs.fontSize), fam = cs.fontFamily.split(',')[0].trim().replace(/^["']|["']$/g, '');
    out.texts++;
    // a text cut: beyond the viewport, or beyond an ancestor that hides its overflow (a scrolling box is not a cut: its text scrolls into view)
    const R = r.getBoundingClientRect();
    let cut = '', scrolls = false;
    for (let e = el; !cut && e && e !== document.body; e = e.parentElement) {
      const s = getComputedStyle(e);
      if ([s.overflowX, s.overflowY].some((o) => o === 'auto' || o === 'scroll')) { scrolls = true; break; }
      if (![s.overflowX, s.overflowY].some((o) => o === 'hidden' || o === 'clip')) continue;
      const b = e.getBoundingClientRect(), bl = b.left + parseFloat(s.borderLeftWidth), bt = b.top + parseFloat(s.borderTopWidth), br = b.right - parseFloat(s.borderRightWidth), bb = b.bottom - parseFloat(s.borderBottomWidth);
      if (R.left < bl - 0.5 || R.top < bt - 0.5 || R.right > br + 0.5 || R.bottom > bb + 0.5) cut = e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/).join('.') : '');
    }
    if (!cut && !scrolls && (R.left < -0.5 || R.top < -0.5 || R.right > innerWidth + 0.5 || R.bottom > innerHeight + 0.5)) cut = 'viewport';
    const where = `${el.tagName.toLowerCase()}${el.id ? '#' + el.id : ''}${el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''}`;
    if (!out.smallest || size < out.smallest.size) out.smallest = { size, text: text.slice(0, 40), where };
    if (cut) out.cut.push({ by: cut, text: text.slice(0, 40), where });
    if (size < min) out.tooSmall.push({ size, text: text.slice(0, 40), where });
    if (!FAMILIES.includes(fam)) out.wrongFont.push({ family: cs.fontFamily, text: text.slice(0, 40), where });
    for (const ch of text) { const c = ch.codePointAt(0); if (!RANGES.some(([a, b]) => c >= a && c <= b)) out.outside.push({ char: ch, code: c.toString(16), text: text.slice(0, 40) }); }
  }
  hit.remove();
  out.fonts = [...document.fonts].filter((f) => FAMILIES.includes(f.family.replace(/^["']|["']$/g, ''))).map((f) => `${f.family} ${f.weight} ${f.status}`);
  return out;
}

const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: T });
const rows = [];
let failed = 0;
try {
  for (const spec of specs) {
    const [name, query, sizes, js] = spec.split('|');
    for (const size of (sizes || '1920x1080').split(',')) {
      const [w, h] = size.split('x').map(Number), page = await b.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await page.goto(`${BASE}?${query}`, { waitUntil: 'load', timeout: T });
      // the title screen says nothing is ready (nothing is generated behind it): its menu is enough
      await page.waitForFunction('window.__ready === true || window.__error || document.getElementById("title-menu")', { timeout: T });
      await new Promise((r) => setTimeout(r, 1500));
      if (!/news/.test(js ?? '')) await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
      if (js) await page.evaluate(js);
      await page.evaluate(() => document.fonts.ready);
      await new Promise((r) => setTimeout(r, 500));
      const m = await page.evaluate(measure);
      const loaded = m.fonts.length >= 3 && m.fonts.every((f) => f.endsWith('loaded'));
      const ok = !m.tooSmall.length && !m.wrongFont.length && !m.outside.length && !m.cut.length && loaded && !errors.length && m.texts > 0;
      if (!ok) failed++;
      rows.push({ name, size, ...m, loaded, errors, ok });
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${name} ${size}${m.phone ? ' (phone)' : ''}: ${m.texts} texts (${m.covered} covered), smallest ${m.smallest?.size} px (${m.smallest?.where} « ${m.smallest?.text} »), min ${m.min}; fonts ${loaded ? 'loaded' : m.fonts.join(', ') || 'none'}`
        + (m.tooSmall.length ? `\n     too small: ${m.tooSmall.slice(0, 6).map((x) => `${x.size}px ${x.where} « ${x.text} »`).join('; ')}` : '')
        + (m.wrongFont.length ? `\n     other font: ${m.wrongFont.slice(0, 6).map((x) => `${x.family} ${x.where} « ${x.text} »`).join('; ')}` : '')
        + (m.outside.length ? `\n     outside the subset: ${[...new Set(m.outside.map((x) => `U+${x.code} « ${x.char} »`))].join(', ')}` : '')
        + (m.cut.length ? `
     cut: ${m.cut.slice(0, 6).map((x) => `${x.where} « ${x.text} » by ${x.by}`).join('; ')}` : '')
        + (errors.length ? `\n     page errors: ${errors.join('; ')}` : ''));
      await page.close();
    }
  }
} finally { await b.close(); }
if (json) fs.writeFileSync(json, JSON.stringify(rows, null, 1));
console.log(`${rows.length - failed} / ${rows.length} pages pass`);
if (failed) process.exit(1);
