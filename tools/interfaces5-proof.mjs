// The interfaces' lot 5 in a browser (journal Passe IA7; the operator's sheet https://claude.ai/artifact/BRKQQcAXD6N9HTMZdmohnc, IA-11 and IA-12 read back at the recommendation, journal Passe IA2):
// played with real keys, a fake pad, its effect read back from the page:
//   - IA-11 (C-26, A-13): the manual duel's four D-pad caps are four different drawings (each cap photographed, no two alike, one solid arm each); the new game's button says
//     whose game it starts (« Enter the Cité as Ren », the field's name as it is typed), at the pad as at the keyboard;
//   - IA-12: the title's keys line never says the arrows twice (A-14); the guide's list never shows a row cut at its top edge (A-16); the controls part shows no vibration switch with no pad
//     and its rebind line stands above the keys (A-18); a hint fades the corner's figures (C-15); the sheet of a challenge keeps its stake and its notes whole in its column (C-12) and
//     a challenge's result has no pool table (C-13); a page over the duel (the result, the settings opened from the pause) takes the HUD away (C-03, C-28); Mara's goods keep the one
//     height for the tiles whatever has the focus (B-07); the conditions of a place leave the foot inside the card (B-16); an accessory asking its place says Esc cancels (B-10);
//   - Space reads on a card the keyboard has reached the foot of, then presses its button once the text is read.
//   node tools/interfaces5-proof.mjs <outDir>   (DEV server: named states; BASE_URL, CHROME_PATH as play-flow; W / H the window, 1280 x 720 by default, 568 x 320 the phone;
//   PAGE_LANG=fr the texts read from the French table, REDUCED=1 the game's reduced motion, MOTION=reduce the system's); exit 1 on a failure
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', LANG = process.env.PAGE_LANG || 'en', outDir = process.argv[2];
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
if (!outDir) throw new Error('usage: node tools/interfaces5-proof.mjs <outDir>');
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) fails++; };
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: 600000 });
const FR = LANG === 'fr';
const REDUCED = process.env.REDUCED ? '&reduced=1' : '';
const PHONE = H <= 480;

// the texts the page must say, read from the game's own tables (the English as written, the French from its table)
const table = (f) => fs.readFileSync(new URL(`../src/narrative/text/${f}`, import.meta.url), 'utf8');
const EN_T = table('en.ts'), FR_T = table('fr-texts.ts');
const say = (key, vals = {}) => {
  const m = (FR ? FR_T : EN_T).match(new RegExp(`['"]${key.replace(/\./g, '\\.')}['"]: (['"])((?:\\\\.|(?!\\1).)*)\\1`));
  if (!m) throw new Error(`no text ${key}`);
  return m[2].split("\\'").join("'").split('\\"').join('"').replace(/\{(\w+)(?:\|\w+)?\}/g, (_, k) => String(vals[k] ?? `{${k}}`));
};
const XBOX = 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)';
function fakePad(id) {
  const pad = { id, index: 0, connected: true, mapping: 'standard', timestamp: 0, buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0] };
  window.__fakePad = pad;
  Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [window.__fakePad, null, null, null] });
  window.__padSet = (i, on) => { const x = pad.buttons[i]; x.pressed = on; x.touched = on; x.value = on ? 1 : 0; pad.timestamp = performance.now(); };
}

async function newPage(opts = {}) {
  const page = await b.newPage();
  if (opts.pad) await page.evaluateOnNewDocument(fakePad, XBOX);
  else await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  if (opts.storage) await page.evaluateOnNewDocument((kv) => { try { for (const [k, v] of Object.entries(kv)) localStorage.setItem(k, v); } catch {} }, opts.storage);
  if (process.env.MOTION === 'reduce') await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: opts.w ?? W, height: opts.h ?? H, deviceScaleFactor: opts.dpr ?? 1 });
  page.on('pageerror', (e) => { fails++; console.log('KO  page error:', e.message); });
  return page;
}
const ready = (page) => page.waitForFunction('window.__ready === true || window.__error', { timeout: 600000 });
async function go(page, url) { await page.goto(`${BASE}${url}`, { waitUntil: 'load', timeout: 600000 }); await ready(page); await sleep(1500); }
const shot = (page, name) => page.screenshot({ path: path.join(outDir, `${name}-${W}x${H}-${LANG}.png`) });
const key = async (page, k, n = 1, ms = 160) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await sleep(ms); } };
const readNews = async (page) => { await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click()); await sleep(350); };
const state = (name, extra = '') => `?play=1&noreload=1&state=${name}&name=Ren&vis=0&tutorial=0&lang=${LANG}${REDUCED}${extra}`;
const press = async (page, i, hold = 130) => { await page.evaluate((i) => window.__padSet(i, true), i); await sleep(hold); await page.evaluate((i) => window.__padSet(i, false), i); await sleep(170); };

try {
  // ------------------------------------------------------------------------------------------------------------------------------- the title: A-14, A-13
  {
    // the first keys emptied: the arrows are said once
    const emptied = JSON.stringify({ keys: { qwerty: Object.fromEntries(['up', 'down', 'left', 'right'].map((d) => [d, [null, { c: `Arrow${d[0].toUpperCase()}${d.slice(1)}`, k: `Arrow${d[0].toUpperCase()}${d.slice(1)}` }]])) } });
    let page = await newPage({ storage: { 'cite-du-tournoi.settings': emptied } });
    await go(page, `?title=1&lang=${LANG}`);
    const line = await page.evaluate(() => document.querySelector('#title-screen .keys')?.textContent ?? '');
    const arrows = FR ? 'flèches' : 'arrows';
    check(line.includes(arrows) && !/Up|Haut/.test(line) && (line.match(new RegExp(arrows, 'g')) ?? []).length === 1, `the first keys emptied, the title says the arrows once: « ${line} »`);
    await page.close();

    // the new game's button names the game it starts, at the keyboard and at the pad
    page = await newPage({ pad: true });
    await go(page, `?title=1&lang=${LANG}`);
    await press(page, 0); await sleep(500); // the pad wakes: A on the first line (« New game » with no save) opens the form
    if (!(await page.$('#title-name'))) { await page.evaluate(() => document.querySelector('#title-menu [data-id="new"]')?.click()); await sleep(400); }
    const btn = () => page.evaluate(() => [...document.querySelectorAll('#title-menu .pm-btn.primary')].map((x) => x.textContent.trim())[0] ?? '');
    check((await btn()) === say('ui.title.enter', { name: 'Ren' }), `the field empty, the button says whose game it starts: « ${await btn()} »`);
    await page.type('#title-name', 'Rowan'); await sleep(150);
    check((await btn()) === say('ui.title.enter', { name: 'Rowan' }), `the name typed, the button follows: « ${await btn()} »`);
    await page.$eval('#title-name', (i) => { i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); }); await sleep(150);
    check((await btn()) === say('ui.title.enter', { name: 'Ren' }), `the field emptied, « Ren » again: « ${await btn()} »`);
    await shot(page, 'title-name');
    // at the pad: A in the field starts the game as Ren
    await press(page, 0);
    await page.waitForFunction(() => /name=Ren/.test(location.search), { timeout: 60000 }).catch(() => {});
    const search = await page.evaluate(() => location.search).catch(() => '?');
    check(/new=1/.test(search) && /name=Ren/.test(search), `A at the pad in the empty field begins the game of « Ren »: ${search}`);
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- the guide's list: A-16
  {
    const page = await newPage();
    await go(page, state('v2-day1-morning')); await readNews(page);
    await page.evaluate(() => __ui.openGuide()); await sleep(900);
    let worst = 0, rowsChecked = 0, cut = 0;
    const cutRows = () => page.evaluate(() => { const box = document.querySelector('.tu-guide .pm-glist'); if (!box) return -1; const bt = box.getBoundingClientRect().top; let n = 0; for (const r of box.children) { const t = r.getBoundingClientRect().top - bt, bo = r.getBoundingClientRect().bottom - bt; if (t < -1 && bo > 1) n++; } return n; });
    for (let i = 0; i < 13; i++) { await key(page, 'ArrowDown', 1, 190); await sleep(60); const n = await cutRows(); rowsChecked++; if (n > 0) cut++; worst = Math.max(worst, n); }
    check(rowsChecked === 13 && cut === 0 && worst === 0, `walking down the guide's list: no row cut at the top edge after any of ${rowsChecked} presses (${cut} cut)`);
    await key(page, 'ArrowUp', 13, 150);
    check((await cutRows()) === 0, 'and back up: none cut');
    await shot(page, 'guide-list');
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- the controls part: A-18
  {
    const page = await newPage();
    await go(page, state('v2-day1-morning')); await readNews(page);
    await page.evaluate(() => __ui.openSettings('controls')); await sleep(900);
    const c = await page.evaluate(() => { const d = document.querySelector('.pm-set-root .pm-detail, .pm-set-root .pm-body') ?? document; const kids = [...d.children].map((x) => ({ tag: x.tagName, cls: x.className, t: x.textContent.trim() })); return { kids: kids.slice(0, 6), vib: /vibration/i.test(d.textContent) }; });
    const noteIdx = c.kids.findIndex((k) => k.t === say('set.keys.rebind')), walkIdx = c.kids.findIndex((k) => k.t === say('set.keys.walk'));
    check(!c.vib, 'with no pad, the controls part shows no vibration switch');
    check(walkIdx >= 0 && noteIdx === walkIdx + 1 && c.kids[noteIdx + 1]?.tag === 'TABLE', `the rebind line is the first thing under the « ${say('set.keys.walk')} » heading, above the keys' table: ${JSON.stringify(c.kids.map((k) => k.t.slice(0, 22)))}`);
    await shot(page, 'controls');
    await page.close();
    // with a pad seen, the switch is there
    const p2 = await newPage({ pad: true });
    await go(p2, state('v2-day1-morning')); await press(p2, 0); await sleep(300); await readNews(p2);
    await p2.evaluate(() => __ui.openSettings('controls'));
    // the switch is there once a pad was seen, and comes in when the pad is first seen with the part already open
    const vib = () => p2.evaluate(() => /vibration/i.test((document.querySelector('.pm-set-root')?.textContent ?? '')));
    await p2.waitForFunction(() => /vibration/i.test(document.querySelector('.pm-set-root')?.textContent ?? ''), { timeout: 4000 }).catch(() => {});
    check(await vib(), 'once a pad was seen, the vibration switch shows');
    await p2.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- a hint: C-15
  {
    const page = await newPage();
    await page.goto(`${BASE}?play=1&noreload=1&state=v2-day1-morning&name=Ren&vis=0&tutorial=1&lang=${LANG}${REDUCED}`, { waitUntil: 'load', timeout: 600000 });
    await ready(page); await sleep(1500); await readNews(page);
    await page.evaluate(() => { try { localStorage.clear(); } catch {} window.__ui.hint('mark'); }); await sleep(1100);
    const m = await page.evaluate(() => { const o = (s) => { const e = document.querySelector(s); return e ? +getComputedStyle(e).opacity : null; }; return { hint: !!document.querySelector('.tu-hint'), status: o('#pm-status'), figs: o('#pm-figs') }; });
    check(m.hint && m.status === 0 && m.figs === 0, `while the hint is up the day, the place and the figures of the corner are faded out: ${JSON.stringify(m)}`);
    await key(page, 'Enter', 1, 600);
    const after = await page.evaluate(() => ({ hint: !!document.querySelector('.tu-hint'), status: +getComputedStyle(document.querySelector('#pm-status')).opacity }));
    check(!after.hint && after.status === 1, `closed, they come back: ${JSON.stringify(after)}`);
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- Mara's goods: B-07 ; the conditions: B-16 ; the accessory's place: B-10
  {
    const page = await newPage();
    await go(page, state('v2-day1-morning')); await readNews(page);
    await page.evaluate(() => __ui.openShop('mara')); await sleep(900);
    const grid = () => page.evaluate(() => { const g = document.querySelector('.pm-wares .gp-tiles, .gp-tiles'); return g ? Math.round(g.getBoundingClientRect().height) : -1; });
    const heights = [await grid()];
    for (let i = 0; i < 16; i++) { await key(page, i % 5 === 4 ? 'ArrowDown' : 'ArrowRight', 1, 130); heights.push(await grid()); }
    const sel = await page.evaluate(() => document.activeElement?.dataset?.fk ?? '');
    check(new Set(heights).size === 1 && heights[0] > 0, `Mara's tiles keep one height (${heights[0]} px) over ${heights.length} focus positions (${[...new Set(heights)].join(', ')}); the keyboard ends on ${sel.slice(0, 24)}`);
    await shot(page, 'mara-goods');
    await page.close();
  }
  {
    const page = await newPage();
    await go(page, state('v2-day1-morning')); await readNews(page);
    await page.evaluate(() => __ui.openSkills(false)); await sleep(900);
    await key(page, 'c', 1, 500);
    const geo = await page.evaluate(() => { const card = document.querySelector('.pm-skills'), foot = document.querySelector('.pm-skills .pm-foot'), conds = document.querySelector('.sk-conds'); const c = card.getBoundingClientRect(), f = foot.getBoundingClientRect(); const btns = [...foot.querySelectorAll('.pm-btn')].map((x) => x.getBoundingClientRect()); return { cardBottom: Math.round(c.bottom), footBottom: Math.round(f.bottom), win: innerHeight, conds: !!conds, inside: btns.every((r) => r.bottom <= innerHeight + 0.5 && r.bottom <= c.bottom + 0.5 && r.top >= c.top), n: btns.length }; });
    check(geo.conds && geo.inside && geo.footBottom <= geo.cardBottom + 1 && geo.footBottom <= geo.win, `the conditions open, the foot's ${geo.n} buttons are inside the card (bottom ${geo.footBottom} of ${geo.cardBottom}) and the window (${geo.win})`);
    const sees = await page.evaluate(() => [...document.querySelectorAll('.sk-conds [data-fk]')].every((x) => { const r = x.getBoundingClientRect(); return r.bottom <= innerHeight && r.top >= 0; }));
    check(sees, 'every line of the conditions is in the window');
    await shot(page, 'conditions');
    await key(page, 'Escape', 1, 400);
    check(await page.evaluate(() => !document.querySelector('.sk-conds') && !!document.querySelector('.pm-skills .sk-tiles') && getComputedStyle(document.querySelector('.pm-skills .sk-tiles')).display !== 'none'), 'closed, the catalogue is back');
    await page.close();
  }
  {
    // an accessory with both places taken asks which one it replaces: the foot says Esc cancels the choice, and it does
    const page = await newPage();
    await go(page, state('v2-day1-morning')); await readNews(page);
    await page.evaluate(() => { const st = __game.state(); st.player.coins = 180; st.v2.gear = { weapon: 'imported-blade', tier: 1, armour: 'mail-shirt', acc: ['iron-ring', 'lucky-ribbon'], bag: ['swift-boots', 'fervour-charm'] }; __ui.openGear(); });
    await sleep(800);
    await page.evaluate(() => document.querySelector('[data-fk="tile:swift-boots"]')?.focus()); await sleep(150);
    await key(page, ' ', 1, 300);
    const foot = () => page.evaluate(() => [...document.querySelectorAll('.pm-gear .pm-foot .pm-btn')].map((x) => `${x.querySelector('kbd')?.dataset.key ?? ''}:${x.querySelector('span')?.textContent ?? ''}`));
    const f = await foot();
    check(f.includes(`Esc:${say('ui.gear.cancelPick')}`) && !f.includes(`Esc:${say('ui.close')}`), `while it asks the place, the foot says Esc cancels the choice: ${JSON.stringify(f)}`);
    await key(page, 'Escape', 1, 300);
    const f2 = await foot();
    check(await page.evaluate(() => !!document.querySelector('.pm-gear')) && f2.includes(`Esc:${say('ui.close')}`), `Esc cancelled the choice, the page is open and its foot says Close again: ${JSON.stringify(f2)}`);
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- the sheet of a challenge: C-12
  {
    const page = await newPage();
    await go(page, state('v2-training-morning')); await readNews(page);
    await page.evaluate(() => { const g = window.__game; g.act({ type: 'talk', who: 'orla' }); g.act({ type: 'challenge', who: 'orla', stake: 'coins' }); window.__ui.openChallengeSheet(); }); await sleep(1000);
    const m = await page.evaluate(() => {
      const col = document.querySelector('.pm-skills .pm-self'); if (!col) return null;
      const cb = col.getBoundingClientRect(), ps = [...col.querySelectorAll('p.pm-sub')].map((p) => ({ t: p.textContent, top: p.getBoundingClientRect().top, bottom: p.getBoundingClientRect().bottom }));
      return { shown: getComputedStyle(col).display !== 'none', colTop: cb.top, colBottom: cb.bottom, over: col.scrollHeight - col.clientHeight, ps, fade: parseFloat(getComputedStyle(col).getPropertyValue('--fade')) || 44 };
    });
    if (PHONE) {
      // on a window of 480 px or less the rival's column is left out (journal Passe IA5, a recorded gap): the sheet keeps its four places and the foot
      check(!!m && !m.shown, 'on a short window the rival\'s column is left out, as journal Passe IA5 records (the challenge\'s stake is in the dialogue\'s own line)');
    } else {
      const stake = m?.ps.find((p) => /coins|pièces/.test(p.t));
      check(!!m && !!stake && stake.bottom < m.colTop + (m.colBottom - m.colTop) / 2, `the stake is in the top half of the column, ahead of the table: « ${stake?.t.slice(0, 50)} » at ${Math.round(stake?.top ?? 0)}`);
      const last = m?.ps[m.ps.length - 1];
      const pageDown = m ? m.over : 0;
      check(!!m && last.bottom <= m.colBottom + 1, `every line of the column is whole inside it (the last ends at ${Math.round(last?.bottom ?? 0)} of ${Math.round(m?.colBottom ?? 0)}; overflow ${pageDown} px)`);
    }
    await shot(page, 'challenge-sheet');
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- the duel: the pause's settings (C-28), the result (C-03, C-13), Space reads on
  {
    const page = await newPage();
    await go(page, `?play=1&noreload=1&state=v2-day2-afternoon&name=Ren&vis=0&tutorial=0&lang=${LANG}${REDUCED}&scene=arena`);
    const hud = () => page.evaluate(() => { const h = document.querySelector('#arena-hud'); return h ? +getComputedStyle(h).opacity : null; });
    await key(page, 'Enter', 1, 1500);
    check((await hud()) === 1, 'in the bout the HUD is at full strength');
    await key(page, ' ', 1, 700);
    check((await hud()) === 1, 'paused, the HUD (and its pause screen) stays');
    await key(page, 'Escape', 1, 900);
    const o = await page.evaluate(() => !!document.querySelector('.pm-set-root'));
    check(o && (await hud()) === 0, `the settings opened from the pause take the screen, the HUD faded out under them (opacity ${await hud()})`);
    await shot(page, 'pause-settings');
    await key(page, 'Escape', 1, 700);
    check((await hud()) === 1, 'closed, the HUD is back');
    await key(page, ' ', 1, 500);
    // skip to the result
    await key(page, 'l', 1, 800);
    await page.waitForFunction(() => [...document.querySelectorAll('.pm-overlay:not(.pm-band)')].some((x) => /pool|poule/i.test(x.textContent) || x.querySelector('.pm-big')), { timeout: 60000 }).catch(() => {});
    await sleep(700);
    const r = await page.evaluate(() => { const h = document.querySelector('#arena-hud'), ko = document.querySelector('#ah-ko'); const root = [...document.querySelectorAll('.pm-overlay:not(.pm-band)')].pop(); return { hud: h ? +getComputedStyle(h).opacity : null, ko: ko ? ko.classList.contains('on') : null, text: root?.innerText.replace(/\s+/g, ' ').slice(0, 80) ?? null, pool: /pool|poule/i.test(root?.textContent ?? '') }; });
    check(r.text !== null && r.hud === 0, `the result card takes the screen, the K.O. word and the bar under it faded out (HUD ${r.hud}): « ${r.text} »`);
    check(r.pool, 'a bout of the tournament still shows the pool\'s table');
    await shot(page, 'result');
    // Space reads the card on, then presses its button: a window short enough to make the card scroll (568 x 320, or the Z stands in the way)
    const zone = () => page.evaluate(() => { const root = [...document.querySelectorAll('.pm-overlay:not(.pm-band)')].pop(); const z = root && [...root.querySelectorAll('.pm-body, .pm-detail')].find((x) => x.scrollHeight > x.clientHeight + 1) || (root && root.scrollHeight > root.clientHeight + 1 ? root : null); return z ? { top: Math.round(z.scrollTop), max: Math.round(z.scrollHeight - z.clientHeight), kind: z.className } : null; });
    const z0 = await zone();
    if (z0) {
      const onFoot = await page.evaluate(() => { const f = document.activeElement; return !!f?.closest?.('.pm-foot'); });
      await key(page, ' ', 1, 400);
      const z1 = await zone();
      check(onFoot && z1 && z1.top > z0.top, `the keyboard on the card's button, Space reads the next page of the text: scroll ${z0.top} → ${z1?.top} of ${z0.max}`);
      for (let i = 0; i < 12 && (await zone())?.top < (await zone())?.max - 1; i++) await key(page, ' ', 1, 350);
      const end = await zone();
      check(!!end && end.top >= end.max - 1, `Space again and again reads to the end (${end?.top} of ${end?.max})`);
      check(!(await page.evaluate(() => !!window.__go)), 'and has not pressed the button on the way');
      // Shift + Space reads back
      await page.keyboard.down('Shift'); await page.keyboard.press('Space'); await page.keyboard.up('Shift'); await sleep(400);
      const back = await zone();
      check(!!back && back.top < end.top, `Shift + Space reads back: ${end.top} → ${back?.top}`);
    } else console.log('-- the result card fits this window: Space reading is checked at 568 x 320');
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- Space on a card of the town, where nothing else takes it: it reads, then it presses the button
  {
    const page = await newPage();
    await go(page, state('v2-day2-afternoon')); await readNews(page);
    await page.evaluate(() => {
      const ui = window.__ui, st = window.__game.state(); let seq = Math.max(...st.log.map((e) => e.seq)) + 5; ui.seenSeq = seq - 1;
      st.log.push({ seq: seq++, visible: true, kind: 'match', id: 'player-lost', text: 'Ren lost to Marek Varn.', day: st.day, slot: st.slot });
      // lines long enough to take two lines of the card, and enough of them to overflow it at any window
      for (let i = 0; i < 24; i++) st.log.push({ seq: seq++, visible: true, kind: 'consequence', id: `x${i}`, text: `A long line of the news, number ${i + 1}, told in enough words to take a line or two of the card, and a few more words after them to be sure of taking the second.`, day: st.day, slot: st.slot });
      ui.showNews();
    });
    await sleep(900);
    const zone = () => page.evaluate(() => { const root = [...document.querySelectorAll('.pm-overlay:not(.pm-band)')].pop(); const z = root && [...root.querySelectorAll('.pm-body, .pm-detail')].find((x) => x.scrollHeight > x.clientHeight + 1); return { open: !!root, z: z ? { top: Math.round(z.scrollTop), max: Math.round(z.scrollHeight - z.clientHeight) } : null, foot: !!document.activeElement?.closest?.('.pm-foot') }; });
    const z0 = await zone();
    check(z0.open && !!z0.z && z0.foot, `a long card of the news, its button has the keyboard: ${JSON.stringify(z0)}`);
    await key(page, ' ', 1, 400);
    const z1 = await zone();
    check(z1.open && !!z1.z && !!z0.z && z1.z.top > z0.z.top, `Space reads the next page of it: ${z0.z?.top} → ${z1.z?.top} of ${z0.z?.max}`);
    for (let i = 0; i < 10; i++) { const q = await zone(); if (!q.z || q.z.top >= q.z.max - 1) break; await key(page, ' ', 1, 350); }
    const z2 = await zone();
    check(z2.open && !!z2.z && z2.z.top >= z2.z.max - 1, `Space reads to the end and the card is still there (${z2.z?.top} of ${z2.z?.max})`);
    await key(page, ' ', 1, 700);
    check(!(await zone()).open, 'the text read, Space presses the card\'s button: the card closes');
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- a challenge's result: no pool (C-13)
  {
    const page = await newPage();
    await go(page, state('v2-training-morning')); await readNews(page);
    await page.evaluate(() => { const g = window.__game; g.act({ type: 'talk', who: 'orla' }); g.act({ type: 'challenge', who: 'orla', stake: 'coins' }); window.__ui.openChallengeSheet(); }); await sleep(900);
    await key(page, 'Enter', 1, 900);
    const to = await page.evaluate(() => window.__go);
    check(/scene=arena/.test(to ?? '') && /challenge=1/.test(to ?? ''), `Enter on the sheet enters the sand: ${to}`);
    await page.goto(new URL(to, BASE).href, { waitUntil: 'load', timeout: 600000 }); await ready(page); await sleep(1500);
    await key(page, 'Enter', 1, 1500); await key(page, 'l', 1, 800);
    await page.waitForFunction(() => document.querySelector('.pm-overlay:not(.pm-band) .pm-big'), { timeout: 60000 }).catch(() => {});
    await sleep(600);
    const t = await page.evaluate(() => [...document.querySelectorAll('.pm-overlay:not(.pm-band)')].pop()?.textContent ?? '');
    check(t.length > 0 && !/pool|poule/i.test(t), `a challenge's result has no pool table: « ${t.replace(/\s+/g, ' ').slice(0, 90)} »`);
    await shot(page, 'challenge-result');
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- the D-pad's caps at the manual duel: C-26
  {
    const page = await newPage({ pad: true, dpr: 2 });
    await go(page, `?play=1&noreload=1&state=v2-day2-afternoon&name=Ren&vis=0&tutorial=0&lang=${LANG}${REDUCED}`);
    await press(page, 0); await sleep(300);
    await page.evaluate(() => { window.__game.act({ type: 'setMode', mode: 'manual' }); window.__ui.openMatchSheet(); }); await sleep(900);
    await press(page, 0); await sleep(900);
    const to = await page.evaluate(() => window.__go);
    await page.goto(new URL(to, BASE).href, { waitUntil: 'load', timeout: 600000 }); await ready(page); await sleep(1500);
    await press(page, 0); await sleep(1800);
    const caps = await page.evaluate(() => [...document.querySelectorAll('#ah-bar .ah-b.slot .ord kbd')].map((k, i) => ({ i, html: k.innerHTML, label: k.getAttribute('aria-label'), solid: (k.innerHTML.match(/fill="currentColor"/g) ?? []).length })));
    check(caps.length === 4 && caps.every((c) => c.solid === 1) && new Set(caps.map((c) => c.html)).size === 4, `the manual HUD at the pad: four caps, four drawings, one solid arm each: ${caps.map((c) => c.label).join(', ')}`);
    // (the French says « Croix directionnelle » then a no-break space and a colon: the comparison reads any space as one)
    const blank = (s) => String(s).replace(/\s/g, ' ');
    check(JSON.stringify(caps.map((c) => blank(c.label))) === JSON.stringify(['D-pad up', 'D-pad right', 'D-pad down', 'D-pad left'].map((l) => (FR ? { 'D-pad up': 'Croix directionnelle : haut', 'D-pad right': 'Croix directionnelle : droite', 'D-pad down': 'Croix directionnelle : bas', 'D-pad left': 'Croix directionnelle : gauche' }[l] : l))), 'their names are the four directions');
    // each cap photographed: no two alike
    const hashes = [];
    for (const k of await page.$$('#ah-bar .ah-b.slot .ord kbd')) hashes.push(crypto.createHash('sha1').update(await k.screenshot({ type: 'png' })).digest('hex'));
    check(hashes.length === 4 && new Set(hashes).size === 4, `the four caps photographed are four different pictures (${new Set(hashes).size} of 4)`);
    const bar = await page.evaluate(() => { const r = document.querySelector('#ah-bar').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    await page.screenshot({ path: path.join(outDir, `hud-dpad-${W}x${H}-${LANG}.png`), clip: { x: bar.x, y: bar.y - 6, width: bar.w, height: bar.h + 12 } });
    await page.close();
  }
} finally { await b.close(); }
console.log(fails ? `${fails} failure(s)` : 'all checks passed');
process.exit(fails ? 1 : 0);
