// How much of a catalogue the player sees (journal Passe IA4; B-20, B-04, B-06, C-05 of journal Passe IA1, the operator's IA-05 « Deux rangées au moins, le détail se replie »):
// for each window size, the skills page (K), the gear page (G), Mara's goods and the match sheet of the first afternoon's bout, each opened in a version 2 game with a full bag:
// the height of the box that holds the tiles, how many rows of tiles are whole in it, the height of the detail and whether the foot and every control stand inside the card
// and the window. A measure of the layout, not of the pleasure of reading it.
//   node tools/catalogue-sizes.mjs [--sizes=1280x720,1366x768,...] [--min=2] [--json=f]   (DEV server: named states; BASE_URL, CHROME_PATH as play-flow; PAGE_LANG=fr;
//   exit 1 when a page shows fewer whole rows than --min at a size of 1280 x 720 and up, or a control outside its card)
import { createRequire } from 'node:module';
import fs from 'node:fs';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', LANG = process.env.PAGE_LANG || 'en';
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).slice(k.length + 3);
const SIZES = arg('sizes', '1920x1080,1600x900,1440x900,1366x768,1280x720,1280x600,1024x768').split(',').map((s) => s.split('x').map(Number));
const MIN = +arg('min', 2), JSON_OUT = arg('json', ''), ONLY = arg('pages', '').split(',').filter(Boolean), SHOT = arg('shots', '');
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: 600000 });
const FULL = `(() => { const st = __game.state(); st.player.coins = 180; st.v2.gear = { weapon: 'imported-blade', tier: 1, armour: 'mail-shirt', acc: ['iron-ring', null], bag: ['duelist-sabre', 'viper-blade', 'padded-jack', 'lucky-ribbon'] }; Object.assign(st.v2.kit.levels, { k_feint: 2, k_sunder: 1, k_iron: 1, k_cry: 1, k_parry: 1, k_focus: 1, t2: 1, t3: 1, n_grace: 1, n_sidestep: 1 }); })()`;

/** the layout of the page open now: the tiles' box, the whole rows in it, the detail, the foot, the controls outside the card */
const measure = (sel) => {
  const box = document.querySelector(sel.tiles), card = document.querySelector(sel.card);
  if (!box || !card) return null;
  const r = box.getBoundingClientRect(), tiles = [...box.querySelectorAll('.sk-tile')];
  const whole = tiles.filter((t) => { const q = t.getBoundingClientRect(); return q.top >= r.top - 1 && q.bottom <= r.bottom + 1 && q.height > 0; });
  const rows = new Set(whole.map((t) => Math.round(t.getBoundingClientRect().top)));
  const all = [...box.querySelectorAll('.sk-tile')].map((t) => Math.round(t.getBoundingClientRect().top));
  const d = card.querySelector('.pm-detail'), foot = card.querySelector('.pm-foot'), c = card.getBoundingClientRect();
  const out = [...card.querySelectorAll('[data-fk], .pm-foot .pm-btn')].filter((x) => x.offsetParent !== null && !x.closest('.sk-tiles')).filter((x) => { const q = x.getBoundingClientRect(); return q.width > 0 && (q.bottom > Math.min(c.bottom, innerHeight) + 1 || q.top < Math.max(c.top, 0) - 1); });
  return { box: Math.round(r.height), tileH: tiles[0] ? Math.round(tiles[0].getBoundingClientRect().height) : 0, rows: rows.size, tiles: tiles.length, tilesWhole: whole.length, rowsAll: new Set(all).size, detail: d ? Math.round(d.getBoundingClientRect().height) : -1, detailScroll: d ? Math.round(d.scrollHeight - d.clientHeight) : -1,
    foot: foot ? Math.round(foot.getBoundingClientRect().bottom) : -1, card: [Math.round(c.top), Math.round(c.bottom)], outside: out.map((x) => x.dataset.fk ?? x.textContent.trim().slice(0, 20)) };
};
const PAGES = [
  ['K', 'v2-day1-morning', '__ui.openSkills(false)', { tiles: '.pm-skills .sk-tiles', card: '.pm-skills' }],
  ['G', 'v2-day1-morning', '__ui.openGear()', { tiles: '.pm-gear .gp-tiles', card: '.pm-gear' }],
  ['Mara', 'v2-day1-morning', "__ui.openShop('mara')", { tiles: '.pm-gear .gp-tiles', card: '.pm-gear' }],
  ['sheet', 'v2-day2-afternoon', '__ui.openMatchSheet()', { tiles: '.pm-skills .sk-tiles', card: '.pm-skills' }],
];
const result = {};
let fails = 0;
for (const [name, state, open, sel] of PAGES) {
  if (ONLY.length && !ONLY.includes(name)) continue;
  const page = await b.newPage();
  await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  page.on('pageerror', (e) => { fails++; console.log('KO  page error:', e.message); });
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1 });
  await page.goto(`${BASE}?play=1&noreload=1&state=${state}&name=Ren&vis=0&tutorial=0&lang=${LANG}`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: 600000 });
  await sleep(1200);
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
  await page.evaluate(FULL);
  for (const [w, h] of SIZES) {
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 }); await sleep(300);
    await page.evaluate(open); await sleep(700);
    const m = await page.evaluate(measure, sel);
    (result[`${w}x${h}`] ??= {})[name] = m;
    const ok = !m || ((w < 1280 || h < 720 || m.rows >= Math.min(MIN, m.rowsAll)) && m.outside.length === 0);
    if (!ok) fails++;
    console.log(`${ok ? 'OK ' : 'KO '} ${String(w).padStart(4)}x${String(h).padEnd(4)} ${name.padEnd(5)} ${m ? `tiles ${String(m.box).padStart(3)} px (a tile ${m.tileH}), ${m.rows} whole row(s) of ${m.rowsAll}, detail ${String(m.detail).padStart(3)} px (+${m.detailScroll}), foot at ${m.foot}/${h}${m.outside.length ? `, OUTSIDE: ${m.outside.join(', ')}` : ''}` : 'not open'}`);
    if (SHOT) { fs.mkdirSync(SHOT, { recursive: true }); await page.screenshot({ path: `${SHOT}/${name}-${w}x${h}.png` }); }
    await page.keyboard.press('Escape'); await sleep(250);
    await page.evaluate(() => { document.querySelectorAll('.pm-overlay').forEach((x) => x.remove()); window.__ui.closeModal?.(); });
  }
  await page.close();
}
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(result, null, 1));
await b.close();
console.log(fails ? `\n${fails} failure(s)` : '\nall OK');
process.exit(fails ? 1 : 0);
