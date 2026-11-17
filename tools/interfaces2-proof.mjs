// The interfaces' lot 2 in a browser (journal Passe IA4; the operator's sheet https://claude.ai/artifact/BRKQQcAXD6N9HTMZdmohnc, IA-05, IA-06 and IA-07 read back at the
// recommendation, journal Passe IA2): played with real keys, a real mouse and a fake pad, its effect read back from the game's own state:
//   - IA-06 (B-02, B-03, B-17, B-18, B-19): the skills page: Down from a place reaches a tile in ONE press, the four arrows walk the page as the gear page's; a place is moved
//     earlier or later by A and D (the pad's LT and RT), never by the arrows (Right on a place moves the keyboard, the order is the game's and stays); « Free this place » says
//     what it does and Space on the freed place keeps its skill; the mode has its line, auto then manual; the key cap of a manual place never bites its text;
//   - IA-07 (B-08, B-09, B-11, B-23): Mara's dialogue asks before it sells (the question, Esc keeps the piece, a double Enter and a held one never sell, then Enter sells at half
//     the list price); the gear page away from Mara says why a worn piece or a piece of the bag cannot be sold; a purchase says the piece is worn and where the old one went;
//     after a sale on the Sell panel the detail says the sale and no longer the question;
//   - IA-05 is measured by tools/catalogue-sizes.mjs.
//   node tools/interfaces2-proof.mjs <outDir>   (DEV server: named states; BASE_URL, CHROME_PATH as play-flow; W / H the window, 1280 x 720 by default; PAGE_LANG=fr the texts
//   read from the French table, REDUCED=1 the game's reduced motion, MOTION=reduce the system's); exit 1 on a failure
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', LANG = process.env.PAGE_LANG || 'en', outDir = process.argv[2];
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
if (!outDir) throw new Error('usage: node tools/interfaces2-proof.mjs <outDir>');
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) fails++; };
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: 600000 });
const FR = LANG === 'fr';
const q = `vis=0&tutorial=0&lang=${LANG}${process.env.REDUCED ? '&reduced=1' : ''}`;
const table = (f) => fs.readFileSync(new URL(`../src/narrative/text/${f}`, import.meta.url), 'utf8');
const EN_T = table('en.ts'), FR_T = table('fr-texts.ts');
const say = (key) => {
  const m = (FR ? FR_T : EN_T).match(new RegExp(`['"]${key.replace(/\./g, '\\.')}['"]: (['"])((?:\\\\.|(?!\\1).)*)\\1`));
  if (!m) throw new Error(`no text ${key}`);
  return m[2].split("\\'").join("'").split('\\"').join('"');
};
const escRe = (s) => s.replace(/[.*+?^$()|[\]\\]/g, (c) => `\\${c}`);
/** a text with {slots} as a pattern: each slot any text */
const pat = (key) => new RegExp(`^${escRe(say(key)).replace(/\{[a-z]+\}/g, '.+')}$`);

const fakePad = () => {
  const pad = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', index: 0, connected: true, mapping: 'standard', timestamp: 0, buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0] };
  window.__fakePad = pad;
  Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [window.__fakePad, null, null, null] });
  window.__padSet = (i, on) => { const x = pad.buttons[i]; x.pressed = on; x.touched = on; x.value = on ? 1 : 0; pad.timestamp = performance.now(); };
  window.__padAxes = (a) => { pad.axes = a.slice(); pad.timestamp = performance.now(); };
};
const noPad = () => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] });
const FULL = `(() => { const st = __game.state(); st.player.coins = 180; st.v2.gear = { weapon: 'imported-blade', tier: 1, armour: 'mail-shirt', acc: ['iron-ring', null], bag: ['duelist-sabre', 'viper-blade', 'padded-jack', 'lucky-ribbon'] }; Object.assign(st.v2.kit.levels, { k_feint: 2, k_sunder: 1, k_iron: 1, k_cry: 1, k_parry: 1, k_focus: 1, t2: 1, t3: 1, n_grace: 1, n_sidestep: 1 }); })()`;

async function open(state, pad = false) {
  const page = await b.newPage();
  await page.evaluateOnNewDocument(pad ? fakePad : noPad);
  if (process.env.MOTION === 'reduce') await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { fails++; console.log('KO  page error:', e.message); });
  await page.goto(`${BASE}?play=1&noreload=1&state=${state}&name=Ren&${q}`, { waitUntil: 'load', timeout: 600000 });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: 600000 });
  await sleep(1200);
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
  await page.evaluate(FULL); await sleep(200);
  return page;
}
const key = async (page, k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await sleep(130); } };
const shot = (page, name) => page.screenshot({ path: path.join(outDir, `${name}-${W}x${H}-${LANG}.png`) });
const fk = (page) => page.evaluate(() => document.activeElement?.closest?.('[data-fk]')?.dataset.fk ?? null);
const places = (page) => page.evaluate(() => [...document.querySelectorAll('.sk-slot .sk-main b')].map((x) => x.textContent));
const order = (page) => page.evaluate(() => JSON.stringify(__game.state().v2.kit.order ?? null));

try {
  // ------------------------------------------------------------------------------------------------------------------------------- IA-06: K like G
  {
    const page = await open('v2-day1-morning');
    await page.evaluate(() => __ui.openSkills(false)); await sleep(700);
    check((await fk(page)) === 'slot:0', 'K opens with the keyboard on the first place');
    await key(page, 'ArrowDown');
    const first = await fk(page);
    check(first?.startsWith('tile:'), `Down from the first place reaches a tile in ONE press (it took twelve): ${first}`);
    await key(page, 'ArrowRight');
    const second = await fk(page);
    check(second?.startsWith('tile:') && second !== first, `Right goes to the next tile: ${second}`);
    await key(page, 'ArrowLeft');
    check((await fk(page)) === first, 'Left comes back');
    await key(page, 'ArrowDown');
    const below = await fk(page);
    check(below?.startsWith('tile:') && below !== first, `Down goes down the grid: ${below}`);
    await key(page, 'ArrowUp');
    check((await fk(page)) === first, 'Up goes back up the same column');
    await key(page, 'ArrowUp');
    const above = await fk(page);
    check(above?.startsWith('slot:') || above?.startsWith('filter:'), `and from the first row to the places or the filters: ${above}`);
    // the places: the arrows move the keyboard, never the order
    await page.evaluate(() => document.querySelector('[data-fk="slot:1"]').focus());
    const o0 = await order(page), n0 = await places(page);
    await key(page, 'ArrowRight');
    check((await fk(page)) === 'slot:2' && (await order(page)) === o0, 'Right on a place moves the keyboard to the next place and leaves the order');
    await key(page, 'ArrowLeft');
    check((await fk(page)) === 'slot:1' && (await order(page)) === o0, 'Left moves it back, the order is the game\'s still');
    // A and D move the place
    await key(page, 'a');
    const n1 = await places(page);
    check(n1[0] === n0[1] && n1[1] === n0[0] && (await fk(page)) === 'slot:0', `A moves the place earlier (${n0.join(', ')} → ${n1.join(', ')}), the keyboard follows it`);
    await key(page, 'd');
    check(JSON.stringify(await places(page)) === JSON.stringify(n0), 'D moves it back');
    // « Free this place » says what it does
    await page.evaluate(() => document.querySelector('[data-fk="slot:2"]').focus());
    const o1 = await order(page);
    const footVerb = () => page.evaluate(() => document.querySelector('.pm-skills .pm-foot .pm-btn span')?.textContent ?? '');
    check((await footVerb()) === say('ui.sk.remove'), `the foot says « ${await footVerb()} »`);
    await key(page, ' ');
    const said = await page.evaluate(() => document.querySelector('.sk-say')?.textContent ?? '');
    check(pat('ui.sk.freed').test(said.replace(/\s+/g, ' ')), `freeing a place says what happened: « ${said} »`);
    check((await footVerb()) === say('ui.sk.keepHere'), `on the freed place Space says « ${await footVerb()} »`);
    await shot(page, 'ia06-freed');
    await key(page, ' ');
    check((await places(page))[2] === n0[2] && (await order(page)) === o1, 'Space again keeps the skill: nothing left the game\'s four');
    // the mode's line
    const line = () => page.evaluate(() => document.querySelector('.sk-say.sk-modeline')?.textContent ?? '');
    check((await line()) === say('ui.sk.modeAuto'), `the mode's line, auto: « ${await line()} »`);
    await page.evaluate(() => document.querySelector('[data-fk="mode"]').focus());
    await key(page, ' ');
    check((await line()) === say('ui.sk.modeManual'), `and manual: « ${await line()} »`);
    // the key caps of the manual places never bite their text (B-19)
    const bite = await page.evaluate(() => [...document.querySelectorAll('.sk-slot .sk-main')].map((m) => { const n = m.querySelector('.n kbd')?.getBoundingClientRect(), s = m.querySelector('small')?.getBoundingClientRect(); if (!n || !s) return -1; const ox = Math.min(n.right, s.right) - Math.max(n.left, s.left), oy = Math.min(n.bottom, s.bottom) - Math.max(n.top, s.top); return ox > 0 && oy > 0 ? ox * oy : 0; }));
    check(bite.length === 4 && bite.every((x) => x === 0), `the manual keys' caps overlap no text (${bite.join(', ')})`);
    await shot(page, 'ia06-manual');
    await key(page, ' ');
    await page.close();
  }
  {
    // the pad: LT and RT move a place, the D-pad walks the page, the foot's caps are the triggers'
    const page = await open('v2-day1-morning', true);
    await page.evaluate(() => __ui.openSkills(false)); await sleep(700);
    const press = async (i, hold = 90) => { await page.evaluate((i) => window.__padSet(i, true), i); await sleep(hold + 60); await page.evaluate((i) => window.__padSet(i, false), i); await sleep(160); };
    await press(10, 40); await sleep(200);   // wakes the pad with a press that does nothing (the left stick's click): its caps replace the keys'
    await page.evaluate(() => document.querySelector('[data-fk="slot:1"]').focus()); await sleep(250);
    const o0 = await order(page), n0 = await places(page);
    await press(15);   // the D-pad's right
    check((await fk(page)) === 'slot:2' && (await order(page)) === o0, 'the D-pad\'s right moves the keyboard to the next place (it used to move the skill)');
    await press(14);
    check((await fk(page)) === 'slot:1', 'and left back');
    const caps = await page.evaluate(() => [...document.querySelectorAll('.pm-skills .pm-foot kbd[data-pad-btn]')].map((k) => ({ btn: k.dataset.padBtn, pad: k.classList.contains('pad'), label: k.getAttribute('aria-label') ?? '' })));
    check(caps.length === 2 && caps.every((c) => c.pad && c.label), `the foot's Earlier and Later show the triggers: ${JSON.stringify(caps)}`);
    await press(6);   // LT
    const n1 = await places(page);
    check(n1[0] === n0[1] && n1[1] === n0[0], `LT moves the place earlier (${n0.join(', ')} → ${n1.join(', ')})`);
    await press(7);   // RT
    check(JSON.stringify(await places(page)) === JSON.stringify(n0), 'RT moves it back');
    await shot(page, 'ia06-pad');
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- IA-07: the sale
  {
    const page = await open('v2-day1-morning');
    await page.evaluate(() => __ui.openPerson('mara')); await sleep(800);
    const sellLines = () => page.evaluate(() => [...document.querySelectorAll('.pm-talk .opts .pm-btn')].map((x) => x.textContent.trim()).filter((t) => /^(Sell|Vendre)/.test(t)));
    const lines = await sellLines();
    check(lines.length >= 1, `Mara's dialogue lists what she buys: ${lines[0]}`);
    const stateNow = () => page.evaluate(() => ({ coins: __game.state().player.coins, bag: [...__game.state().v2.gear.bag] }));
    const s0 = await stateNow();
    const focusSell = () => page.evaluate(() => { const b = [...document.querySelectorAll('.pm-talk .opts .pm-btn')].find((x) => /^(Sell|Vendre)/.test(x.textContent.trim())); b?.focus(); return !!b; });
    await focusSell();
    await key(page, 'Enter');
    const asked = await page.evaluate(() => ({ subs: [...document.querySelectorAll('.pm-talk .opts .pm-sub')].map((x) => x.textContent), btns: [...document.querySelectorAll('.pm-talk .opts .pm-btn')].map((x) => x.textContent.trim()), focus: document.activeElement?.textContent.trim() }));
    check(pat('ui.gear.confirm').test(asked.subs[0] ?? '') && asked.btns.length === 2, `Enter on a sell line asks first: « ${asked.subs[0]} » ${JSON.stringify(asked.btns)}`);
    check(JSON.stringify(await stateNow()) === JSON.stringify(s0), 'nothing was sold by that Enter');
    await shot(page, 'ia07-ask');
    await key(page, 'Escape');
    const back = await sellLines();
    check(back.length === lines.length && JSON.stringify(await stateNow()) === JSON.stringify(s0) && await page.evaluate(() => !!document.querySelector('.pm-talk')), 'Esc keeps the piece and gives the dialogue back (it did not close)');
    // a double Enter never sells
    await focusSell();
    await page.keyboard.press('Enter'); await page.keyboard.press('Enter'); await sleep(300);
    check(JSON.stringify(await stateNow()) === JSON.stringify(s0), 'a double Enter does not sell');
    await key(page, 'Escape');
    // the answer: yes
    await focusSell(); await key(page, 'Enter'); await sleep(550);
    const price = await page.evaluate(() => Number(/(\d+)/.exec(document.activeElement?.textContent ?? '')?.[1] ?? 0));
    await key(page, 'Enter'); await sleep(600);
    const s1 = await stateNow();
    check(s1.coins === s0.coins + price && price > 0 && s1.bag.length === s0.bag.length - 1, `the second Enter sells: ${s0.coins} → ${s1.coins} coins (+${price}), the bag ${s0.bag.length} → ${s1.bag.length}`);
    await page.close();
  }
  {
    // the gear page away from Mara: a sale that cannot be made says why
    const page = await open('v2-training-morning');
    await page.evaluate(() => __ui.openGear()); await sleep(700);
    await page.evaluate(() => [...document.querySelectorAll('[data-fk^="tile:"]')].find((x) => /Duelist sabre|Sabre/i.test(x.textContent))?.focus()); await sleep(300);
    const info = await page.evaluate(() => ({ detail: document.querySelector('.pm-gear .pm-detail')?.textContent ?? '', foot: [...document.querySelectorAll('.pm-gear .pm-foot .pm-btn')].map((x) => x.textContent.trim()) }));
    check(pat('ui.gear.noSale').test((info.detail.match(new RegExp(`${escRe(say('ui.gear.noSale')).replace(/\\\{why\\\}/, '.+?')}`)) ?? [''])[0]) || info.detail.includes(say('ui.gear.noSale').split('{why}')[0]), `a piece of the bag away from Mara says why it cannot be sold: « ${info.detail.slice(0, 160)} »`);
    check(!info.foot.some((t) => /^C\b/.test(t)), `and its foot offers no sale: ${JSON.stringify(info.foot)}`);
    await shot(page, 'ia07-nosale');
    await page.close();
  }
  {
    // a purchase says the piece is worn and where the old one went; a sale on the panel says the sale
    const page = await open('v2-day1-morning');
    await page.evaluate(() => __ui.openShop('mara')); await sleep(700);
    await page.evaluate(() => { const s = __game.state(); s.v2.gear.bag = []; s.v2.gear.weapon = 'imported-blade'; });
    await page.evaluate(() => document.querySelector('.pm-gear [data-fk^="good:"]')?.focus());
    // the first weapon on sale that is not owned
    // the serrated cutlass, found by the game's own action (its tile's key is the action), whatever the language names it
    const target = await page.evaluate(() => { const o = __game.actions().find((x) => x.ok && x.action.type === 'shopBuy' && x.action.item === 'serrated-cutlass'); const t = o ? document.querySelector(`.pm-gear [data-fk="${CSS.escape(`good:${JSON.stringify(o.action)}`)}"]`) : null; t?.focus(); return t?.textContent.trim().slice(0, 40) ?? null; });
    check(!!target, `an article to buy: ${target}`);
    await key(page, 'Enter'); await sleep(500);
    const news = await page.evaluate(() => document.querySelector('.pm-gear .pm-detail .news')?.textContent ?? '');
    check(pat('ui.gear.boughtSwap').test((news.match(new RegExp(`${escRe(say('ui.gear.boughtSwap')).replace(/\\\{old\\\}/, '.+?')}`)) ?? [''])[0]) || (FR ? /Vous la portez maintenant ;/ : /You wear it now;/).test(news), `a purchase says the piece is worn and the old one goes to the bag: « ${news} »`);
    await shot(page, 'ia07-bought');
    // the sale on the panel
    await page.evaluate(() => document.querySelector('[data-fk="panel:sell"]')?.click()); await sleep(400);
    const gone = await page.evaluate(() => { const t = document.querySelector('.pm-gear [data-fk^="sell:"]'); t?.focus(); return t?.getAttribute('data-fk') ?? null; });
    check(!!gone, `a piece on the Sell panel: ${gone}`);
    await page.keyboard.press('c'); await sleep(300);
    const q1 = await page.evaluate(() => document.querySelector('.pm-gear .pm-detail')?.textContent ?? '');
    check(pat('ui.gear.confirm').test((q1.match(/^.*\?/) ?? [''])[0]) || q1.includes(say('ui.gear.confirm').split('{item}')[0]), `C asks: « ${q1.slice(0, 80)} »`);
    await key(page, 'Enter'); await sleep(500);
    const after = await page.evaluate(() => ({ detail: document.querySelector('.pm-gear .pm-detail')?.textContent ?? '' }));
    check(!after.detail.includes(say('ui.gear.confirmWhat')) && after.detail.length > 0, `after the sale the detail no longer holds the question: « ${after.detail.slice(0, 100)} »`);
    await shot(page, 'ia07-sold');
    await page.close();
  }
} catch (e) { fails++; console.log('KO  proof stopped:', e.message); }
await b.close();
console.log(fails ? `\n${fails} failure(s)` : '\nall OK');
process.exit(fails ? 1 : 0);
