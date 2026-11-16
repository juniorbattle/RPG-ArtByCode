// The gear page in a browser (journal Passes EP1 to EP3; the operator's request of 16/11/2026 « il faudra faire pareil pour les equipements afin d'avoir un aspect intuitif et
// manipulable pour gerer nos armes/armure/accessoires », the sheet https://claude.ai/artifact/Q2F5qVfX6u6vL2Sp1aKQa1, PE-1 to PE-10): the page of a version 2 game's gear (G) and the
// keepers' goods, played with real keys and a real mouse, its effect read back from the game's own state:
//   - G: four places and a catalogue of tiles, the first piece owned has the keyboard; the arrows go from tile to tile, down the grid and left to the places; Space wears a
//     piece of the bag (the old one to the bag) and takes a worn one off; an accessory with both places taken asks which one it replaces (the keyboard goes to the places, the
//     « after » follows the place, Enter puts it there, Esc cancels without closing the page); a place's Remove button; a free place filters the catalogue to what fits;
//     C asks before selling, Esc keeps the piece, Enter sells it for half its list price;
//   - Mara's goods: the Buy / Sell switch (PE-6's note), Enter buys the article, the Sell panel lists what she buys and asks first;
//   - the pointer: it selects the tile under it, and a page drawn again under a pointer that does not move leaves the keyboard where it was;
//   - a short phone: the four places stay on top as pastilles, the list and the detail side by side, the foot below (PE-9), every control inside the card.
//   node tools/gear-proof.mjs <outDir>   (DEV server: named states; BASE_URL, CHROME_PATH as play-flow; W / H the window (default 1280 x 720; 568 x 320 the phone), PAGE_LANG=fr, REDUCED=1, MOTION=reduce)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', LANG = process.env.PAGE_LANG || 'en', outDir = process.argv[2];
const W = +(process.env.W || 1280), H = +(process.env.H || 720), phone = H <= 480;
if (!outDir) throw new Error('usage: node tools/gear-proof.mjs <outDir>');
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) fails++; };
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: 600000 });
const q = `vis=0&tutorial=0&lang=${LANG}${process.env.REDUCED ? '&reduced=1' : ''}`;
const FULL = `(() => { const st = __game.state(); st.player.coins = 180; st.v2.gear = { weapon: 'imported-blade', tier: 1, armour: 'mail-shirt', acc: ['iron-ring', null], bag: ['duelist-sabre', 'viper-blade', 'padded-jack', 'lucky-ribbon', 'swift-boots', 'fervour-charm', 'docker-wrap', 'bezoar-stone', 'minstrel-charm'] }; })()`;
const EN = LANG === 'en';

async function open(state, open) {
  const page = await b.newPage();
  await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  if (process.env.MOTION === 'reduce') await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { fails++; console.log('KO  page error:', e.message); });
  await page.goto(`${BASE}?play=1&noreload=1&state=${state}&name=Ren&${q}`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: 600000 });
  await sleep(1500);
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
  await page.evaluate(FULL); await page.evaluate(open); await sleep(600);
  return page;
}
const fk = (page) => page.evaluate(() => document.activeElement?.closest?.('[data-fk]')?.dataset.fk ?? null);
const gear = (page) => page.evaluate(() => { const s = __game.state(); return { coins: s.player.coins, ...JSON.parse(JSON.stringify(s.v2.gear)) }; });
const isOpen = (page) => page.evaluate(() => !!document.querySelector('.pm-gear'));
const say = (page) => page.evaluate(() => document.querySelector('.pm-gear .sk-lab.say')?.textContent ?? '');
const detail = (page) => page.evaluate(() => document.querySelector('.pm-gear .pm-detail')?.textContent ?? '');
const foot = (page) => page.evaluate(() => [...document.querySelectorAll('.pm-gear .pm-foot .pm-btn')].map((x) => `${x.querySelector('kbd')?.dataset.key ?? ''}:${x.querySelector('span')?.textContent ?? ''}`).join(' | '));
const key = async (page, k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await sleep(110); } };
const focusFk = (page, id) => page.evaluate((id) => document.querySelector(`[data-fk="${id}"]`)?.focus(), id);
const asks = (t) => t.includes('?');
const inside = (page) => page.evaluate(() => { const c = document.querySelector('.pm-gear').getBoundingClientRect(); return [...document.querySelectorAll('.pm-gear [data-fk], .pm-gear .pm-foot .pm-btn')].filter((x) => x.offsetParent !== null).every((x) => { const r = x.getBoundingClientRect(), p = x.closest('.pm-scroll')?.getBoundingClientRect(); return r.bottom <= (p ? p.bottom : c.bottom) + 1 && r.top >= (p ? p.top : c.top) - 1 && r.right <= c.right + 1 && r.left >= c.left - 1 || !!p; }); });

try {
  // ---- the gear page (G)
  let page = await open('v2-day1-morning', '__ui.openGear()');
  check(await isOpen(page), 'G opens the gear page');
  const cases = await page.evaluate(() => [...document.querySelectorAll('.gp-case')].map((c) => ({ free: c.classList.contains('free'), name: c.querySelector('b')?.textContent })));
  check(cases.length === 4 && cases[3].free && !cases[0].free, `four places, the fourth free: ${JSON.stringify(cases.map((c) => c.free ? '·' : c.name))}`);
  check((await fk(page)) === 'tile:imported-blade', `the first piece owned has the keyboard: ${await fk(page)}`);
  check(await page.evaluate(() => document.querySelectorAll('.gp-tiles .sk-tile').length >= 12), 'the catalogue holds every piece owned (12), not a window of four lines');
  check(await inside(page), 'every control is inside the card');
  await page.screenshot({ path: path.join(outDir, `1-gear-${W}x${H}.png`) });
  if (!phone) {
    await key(page, 'ArrowRight');
    check((await fk(page)) === 'tile:mail-shirt', `ArrowRight goes to the next tile: ${await fk(page)}`);
    await key(page, 'ArrowDown');
    const below = await fk(page);
    check(below.startsWith('tile:') && below !== 'tile:mail-shirt', `ArrowDown goes to a tile in the row below: ${below}`);
    await key(page, 'ArrowLeft', 8);
    check(/^case:/.test(await fk(page)), `ArrowLeft from the first column reaches the places: ${await fk(page)}`);
  }
  // Space wears a piece of the bag
  await focusFk(page, 'tile:duelist-sabre'); await sleep(150);
  check(/Space/.test(await foot(page)), `the foot says what Space does: ${await foot(page)}`);
  await key(page, ' ');
  let g = await gear(page);
  check(g.weapon === 'duelist-sabre' && g.bag.includes('imported-blade'), `Space wears the sabre, the old blade to the bag: ${g.weapon}`);
  check((await fk(page)) === 'tile:duelist-sabre' && (await page.evaluate(() => document.querySelector('[data-fk="tile:duelist-sabre"]').getAttribute('aria-pressed'))) === 'true', 'the keyboard stays on the piece, now marked worn');
  // an accessory on the free place, then the question when both are taken
  await focusFk(page, 'tile:lucky-ribbon'); await sleep(150); await key(page, ' ');
  g = await gear(page);
  check(g.acc[1] === 'lucky-ribbon' && g.acc[0] === 'iron-ring', `an accessory takes the free place: ${g.acc.join(', ')}`);
  await focusFk(page, 'tile:swift-boots'); await sleep(150); await key(page, ' ');
  check((await fk(page)) === 'case:0' && (await say(page)).length > 0, `both places taken: the keyboard goes to the places and the page asks which one: ${await say(page)}`);
  check(!(await gear(page)).acc.includes('swift-boots'), 'nothing changed yet');
  await focusFk(page, 'case:1'); await sleep(200);
  check(/Speed|Vivacité/.test(await detail(page)), `the detail follows the place pointed at: ${(await detail(page)).slice(0, 90)}`);
  await page.screenshot({ path: path.join(outDir, `2-which-place-${W}x${H}.png`) });
  await key(page, 'Escape');
  check((await isOpen(page)) && (await say(page)) === '', 'Esc cancels the question and the page stays open');
  await focusFk(page, 'tile:swift-boots'); await sleep(150); await key(page, ' '); await focusFk(page, 'case:1'); await sleep(150); await key(page, 'Enter');
  g = await gear(page);
  check(g.acc[1] === 'swift-boots' && g.bag.includes('lucky-ribbon'), `Enter on a place puts the accessory there, the old one to the bag: ${g.acc.join(', ')}`);
  // Remove, a free place, the catalogue filtered
  // the Remove button (a place on a phone has none: its pastille is pressed)
  if (phone) { await focusFk(page, 'case:armour'); await key(page, ' '); } else await page.click('[data-rm="armour"]');
  await sleep(250);
  g = await gear(page);
  check(g.armour === null && g.bag.includes('mail-shirt'), 'the Remove button (the pastille on a phone) takes the armour off');
  check(await page.evaluate(() => document.querySelector('[data-fk="case:armour"]')?.closest('.gp-case')?.classList.contains('free')), 'the place is dashed and free');
  await focusFk(page, 'case:armour'); await key(page, ' ');
  check((await fk(page)).startsWith('tile:') && (await page.evaluate(() => document.querySelectorAll('.gp-tiles .sk-tile').length)) <= 3, `a free place filters the catalogue to what fits: ${await fk(page)}`);
  await page.evaluate(() => document.querySelector('[data-fk="filter:all"]').click()); await sleep(200);
  // the sale: C asks, Esc keeps, C then Enter sells for half the list price
  const before = (await gear(page)).coins;
  await focusFk(page, 'tile:viper-blade'); await sleep(150);
  check(/C:/.test(await foot(page)), `the foot offers the sale: ${await foot(page)}`);
  await key(page, 'c');
  check(asks(await detail(page)), 'C asks before selling');
  await page.screenshot({ path: path.join(outDir, `3-sell-asks-${W}x${H}.png`) });
  await key(page, 'Escape');
  check((await gear(page)).coins === before && (await gear(page)).bag.includes('viper-blade'), 'Esc keeps the piece');
  await focusFk(page, 'tile:viper-blade'); await key(page, 'c'); await key(page, 'Enter');
  g = await gear(page);
  check(g.coins === before + 13 && !g.bag.includes('viper-blade'), `Enter sells it for half its list price (26 -> 13): ${before} -> ${g.coins}`);
  await page.close();

  // ---- Mara's goods: the Buy / Sell switch
  page = await open('v2-day1-morning', '__ui.openShop("mara")');
  check(await page.evaluate(() => !!document.querySelector('.gp-panels')), 'Mara has the Buy / Sell switch');
  await page.screenshot({ path: path.join(outDir, `4-mara-buy-${W}x${H}.png`) });
  check((await fk(page)).startsWith('good:'), `the first article has the keyboard: ${(await fk(page)).slice(0, 30)}`);
  const c0 = (await gear(page)).coins;
  await key(page, 'Enter');
  check((await gear(page)).coins < c0, 'Enter buys the article');
  await page.click('[data-fk="panel:sell"]'); await sleep(300);
  check((await page.evaluate(() => document.querySelector('[data-fk="panel:sell"]').getAttribute('aria-pressed'))) === 'true', 'the Sell panel is on');
  const sells = await page.evaluate(() => [...document.querySelectorAll('.gp-tiles [data-fk^="sell:"]')].map((x) => x.dataset.fk));
  check(sells.length >= 6, `the Sell panel lists what Mara buys: ${sells.length} pieces`);
  await page.screenshot({ path: path.join(outDir, `5-mara-sell-${W}x${H}.png`) });
  const c1 = (await gear(page)).coins;
  await page.click('[data-fk="sell:padded-jack"]'); await sleep(300);
  check(asks(await detail(page)) && /Enter/.test(await foot(page)) && /Esc/.test(await foot(page)), `a click asks first, the foot gives Enter and Esc: ${await foot(page)}`);
  await key(page, 'Enter');
  g = await gear(page);
  check(g.coins === c1 + 7 && !g.bag.includes('padded-jack'), `Enter sells the jack for 7: ${c1} -> ${g.coins}`);
  // today's keepers other than Mara have no switch
  await page.close();
  page = await open('v2-forecourt-morning', '__ui.openShop("hilde")');
  check(await page.evaluate(() => !!document.querySelector('.pm-gear') && !document.querySelector('.gp-panels')), 'Hilde buys nothing back: no Buy / Sell switch');
  await page.close();

  // ---- the pointer
  page = await open('v2-day1-morning', '__ui.openGear()');
  const box = await page.evaluate(() => { const t = document.querySelector('[data-fk="tile:viper-blade"]'); t.scrollIntoView({ block: 'nearest' }); const r = t.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await page.mouse.move(box.x - 30, box.y - 10); await page.mouse.move(box.x, box.y, { steps: 4 }); await sleep(300);
  check((await fk(page)) === 'tile:viper-blade', `the pointer selects the tile under it: ${await fk(page)}`);
  await focusFk(page, 'tile:duelist-sabre'); await sleep(150); await key(page, ' '); await sleep(500);
  check((await fk(page)) === 'tile:duelist-sabre', `a page drawn again under a parked pointer keeps the keyboard where it was: ${await fk(page)}`);
  await page.close();
} catch (e) { fails++; console.log('KO  exception:', e.message); }
await b.close();
console.log(fails ? `${fails} check(s) failed` : 'all checks passed');
process.exit(fails ? 1 : 0);
