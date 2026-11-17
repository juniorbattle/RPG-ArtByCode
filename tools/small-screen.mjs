// The short screen of the player's path (journal Passe IA5; A-03, A-04, A-05, B-05, B-21, B-26, C-06, C-07 of journal Passe IA1, the operator's IA-03 « Les pages du parcours d’abord »):
// every page a new player meets on the way (the title, the settings and the guide, the tour, a dialogue, the list Q, the tournament's page, K, the match sheet, an encounter's band,
// the band of a theft caught, the walked town with the list's summary) opened at a phone held sideways (568 x 320 by default) in a version 2 game whose bag is full, and for each:
// every control (button, slider, key cap of the foot) that stands inside the window and is the topmost thing at its centre (nothing drawn over it), the control that has the keyboard,
// the box that scrolls (its height, what lies beyond it), the question and its answers, and a capture. A measure of the layout, not of the pleasure of reading it.
//   node tools/small-screen.mjs <outDir> [--sizes=568x320,667x375] [--pages=title,settings,...] [--json=f]   (DEV server: named states; BASE_URL, CHROME_PATH as play-flow; PAGE_LANG=fr;
//   REDUCED=1 the game's reduced motion, MOTION=reduce the system's; exit 1 when a control is outside the window or covered, or the focus is)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', LANG = process.env.PAGE_LANG || 'en', outDir = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : '';
const arg = (k, d) => (process.argv.find((a) => a.startsWith(`--${k}=`)) ?? `--${k}=${d}`).slice(k.length + 3);
const SIZES = arg('sizes', '568x320').split(',').map((s) => s.split('x').map(Number)), ONLY = arg('pages', '').split(',').filter(Boolean), JSON_OUT = arg('json', '');
const REDUCED = process.env.REDUCED === '1';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
if (outDir) fs.mkdirSync(outDir, { recursive: true });
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: 600000 });
// a bag as full as a player's gets it (coins, six pieces, a long list of skills), for the dialogues and lists that grow with it (B-21)
const FULL = `(() => { const st = __game.state(); st.player.coins = 180; st.v2.gear = { weapon: 'imported-blade', tier: 1, armour: 'mail-shirt', acc: ['iron-ring', null], bag: ['duelist-sabre', 'viper-blade', 'padded-jack', 'lucky-ribbon', 'ember-sword', 'hex-falchion'] }; Object.assign(st.v2.kit.levels, { k_feint: 2, k_sunder: 1, k_iron: 1, k_cry: 1, k_parry: 1, k_focus: 1, t2: 1, t3: 1, n_grace: 1, n_sidestep: 1 }); })()`;

/** runs in the page: what the window of the short screen must show */
function measure(rootSel) {
  const hit = document.createElement('style'); hit.textContent = '*{pointer-events:auto!important}'; document.head.appendChild(hit);
  const roots = [...document.querySelectorAll(rootSel)].filter((x) => x === document.body || x.offsetParent !== null || getComputedStyle(x).position === 'fixed');
  if (!roots.length) { hit.remove(); return { missing: true, W: innerWidth, H: innerHeight, rows: [], focus: null, scrolls: [], tooSmall: [], unreach: [], card: [0, 0, 0, 0], cardInside: true, title: '' }; }
  const root = roots[roots.length - 1];
  const visible = (el) => { for (let e = el; e && e !== document.documentElement; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; } return true; };
  const label = (e) => (e.dataset?.fk ?? e.getAttribute('aria-label') ?? e.textContent ?? e.tagName).replace(/\s+/g, ' ').trim().slice(0, 28);
  const W = innerWidth, H = innerHeight, controls = [...root.querySelectorAll('button, input, select, [data-fk], .pm-foot kbd, #title-menu *, #title-screen .name, .pm-exit')].filter((e) => visible(e) && !e.closest('[hidden]'));
  const rows = [];
  // a box that scrolls and holds more than it shows: a control inside it is reached by the scrolling (the keyboard keeps its line in view), so what counts is the box itself:
  // inside the window and tall enough to show a line and a half
  const scrolling = (p) => { const s = getComputedStyle(p); return /(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 1; };
  for (const e of controls) {
    let scroller = null; for (let p = e.parentElement; p && p !== root.parentElement; p = p.parentElement) { if (scrolling(p)) { scroller = p; break; } }
    if (scroller) continue;
    const r = e.getBoundingClientRect(); if (r.width <= 0 || r.height <= 0) continue;
    const inside = r.top >= -0.5 && r.left >= -0.5 && r.bottom <= H + 0.5 && r.right <= W + 0.5;
    const cx = Math.min(W - 1, Math.max(0, r.left + r.width / 2)), cy = Math.min(H - 1, Math.max(0, r.top + Math.min(r.height / 2, 10)));
    const top = document.elementFromPoint(cx, cy), covered = !!top && !(e === top || e.contains(top) || top.contains(e));
    rows.push({ label: label(e), tag: e.tagName.toLowerCase() + (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\s+/)[0] : ''), top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left), right: Math.round(r.right), inside, covered: covered ? label(top) : '' });
  }
  const boxes = [...root.querySelectorAll('*')].filter((e) => visible(e) && scrolling(e) && !e.closest('#title') ).map((e) => { const q = e.getBoundingClientRect(); return { cls: e.className.toString().trim().split(/\s+/).slice(0, 2).join('.') || e.tagName.toLowerCase(), top: Math.round(q.top), bottom: Math.round(q.bottom), h: Math.round(q.height), beyond: Math.round(e.scrollHeight - e.clientHeight), inside: q.top >= -0.5 && q.bottom <= H + 0.5 }; });
  const foc = document.activeElement && document.activeElement !== document.body ? document.activeElement : null, fr = foc?.getBoundingClientRect();
  let focus = null;
  if (foc && fr) {
    let sc = null; for (let p = foc.parentElement; p; p = p.parentElement) { const s = getComputedStyle(p); if (/(auto|scroll)/.test(s.overflowY) && p.scrollHeight > p.clientHeight + 1) { sc = p; break; } }
    const sb = sc ? sc.getBoundingClientRect() : null;
    const inWindow = fr.top >= -0.5 && fr.bottom <= H + 0.5 && fr.left >= -0.5 && fr.right <= W + 0.5, inBox = !sb || (fr.top >= sb.top - 1.5 && fr.bottom <= sb.bottom + 1.5); // fractional line heights: a line 0.7 px past the box is the box scrolled to its end
    focus = { label: label(foc), top: Math.round(fr.top), bottom: Math.round(fr.bottom), seen: inWindow && inBox };
  }
  // the box of the question and its answers, or of the text, is the one a player needs: tall enough for a line and a half (a detail may be short, never a few pixels)
  const tooSmall = boxes.filter((x) => x.h < 56);
  const unreach = boxes.filter((x) => !x.inside);
  const card = root.querySelector('.pm-card, .pm-dlg') ?? root, c = card.getBoundingClientRect();
  hit.remove();
  return { W, H, rows, focus, scrolls: boxes, tooSmall, unreach, card: [Math.round(c.top), Math.round(c.bottom), Math.round(c.left), Math.round(c.right)], cardInside: c.top >= -0.5 && c.bottom <= H + 0.5, title: (root.querySelector('h1,h2,.pm-h,.name')?.textContent ?? '').trim().slice(0, 30) };
}

const quay = 'v2-day1-morning', afternoon = 'v2-day2-afternoon';
const WALK = {"dialogue-mara":["ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown"],"dialogue-corvin":["ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown"],"list-q":["ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown"],"list-q-sand":["ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown"],"guide":["ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown"],"tournament":["ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown"],"encounter":["ArrowDown","ArrowDown"],"caught":["ArrowDown","ArrowDown"],"menu":["ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown"],"skills":["ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowRight","c","ArrowDown","ArrowDown","ArrowDown","ArrowDown","Escape"],"sheet":["ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowUp","ArrowRight","c","ArrowDown","ArrowDown","ArrowDown","ArrowDown","Escape"],"settings-controls":["Enter","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown"],"settings-graphics":["Enter","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown","ArrowDown"]};
const PAGES = [
  { name: 'title', query: 'title=1', open: '0', root: '#title-screen', wait: '#title-menu' },
  { name: 'title-name', query: 'title=1', open: "document.querySelector('#title-menu .pm-btn')?.click(); setTimeout(() => { const w = document.querySelector('#title-menu .warn'); if (w) w.textContent = 'Your saved game (Ren, day 10) will be erased. Replace it?'; }, 100)", root: '#title-screen', wait: '#title-menu' },
  { name: 'settings-graphics', state: quay, open: "__ui.openSettings('graphics')", root: '.pm-overlay' },
  { name: 'settings-sound', state: quay, open: "__ui.openSettings('sound')", root: '.pm-overlay' },
  { name: 'settings-controls', state: quay, open: "__ui.openSettings('controls')", root: '.pm-overlay' },
  { name: 'settings-language', state: quay, open: "__ui.openSettings('language')", root: '.pm-overlay' },
  { name: 'guide', state: quay, open: '__ui.openGuide()', root: '.pm-overlay' },
  { name: 'guide-duel', state: quay, open: "__ui.openGuide('duel')", root: '.pm-overlay' },
  { name: 'guide-keys', state: quay, open: "__ui.openGuide('keys')", root: '.pm-overlay' },
  { name: 'tour', query: 'play=1&new=1&name=Ren&tutorial=1&noreload=1', open: '0', root: '.tu-band', pre: ['Enter'], after: '.tu-band', news: true },
  { name: 'tour-2', query: 'play=1&new=1&name=Ren&tutorial=1&noreload=1', open: '0', root: '.tu-band', pre: ['Enter'], after: '.tu-band', news: true, enters: 1 },
  { name: 'tour-3', query: 'play=1&new=1&name=Ren&tutorial=1&noreload=1', open: '0', root: '.tu-band', pre: ['Enter'], after: '.tu-band', news: true, enters: 2 },
  { name: 'tour-4', query: 'play=1&new=1&name=Ren&tutorial=1&noreload=1', open: '0', root: '.tu-band', pre: ['Enter'], after: '.tu-band', news: true, enters: 3 },
  { name: 'tour-5', query: 'play=1&new=1&name=Ren&tutorial=1&noreload=1', open: '0', root: '.tu-band', pre: ['Enter'], after: '.tu-band', news: true, enters: 4 },
  { name: 'tour-6', query: 'play=1&new=1&name=Ren&tutorial=1&noreload=1', open: '0', root: '.tu-band', pre: ['Enter'], after: '.tu-band', news: true, enters: 5 },
  { name: 'dialogue-mara', state: quay, open: "__ui.openPerson('mara')", root: '.pm-talk' },
  { name: 'dialogue-corvin', state: 'v2-training-morning', open: "__ui.openPerson('corvin')", root: '.pm-talk' },
  { name: 'list-q', state: quay, open: '__ui.openHere()', root: '.pm-talk' },
  { name: 'list-q-sand', state: 'v2-training-morning', open: '__ui.openHere()', root: '.pm-talk' },
  { name: 'tournament', state: quay, open: '__ui.openBoard()', root: '.pm-overlay' },
  { name: 'skills', state: quay, open: '__ui.openSkills(false)', root: '.pm-overlay' },
  { name: 'skills-manual', state: quay, open: "__game.act({ type: 'setMode', mode: 'manual' }); __ui.openSkills(false)", root: '.pm-overlay' },
  { name: 'skills-conds', state: quay, open: '__ui.openSkills(false)', root: '.pm-overlay', keys: ['c'] },
  { name: 'sheet-conds', state: afternoon, open: '__ui.openMatchSheet()', root: '.pm-overlay', keys: ['c'] },
  { name: 'sheet', state: afternoon, open: '__ui.openMatchSheet()', root: '.pm-overlay' },
  { name: 'gear', state: quay, open: '__ui.openGear()', root: '.pm-overlay' },
  { name: 'shop-mara', state: quay, open: "__ui.openShop('mara')", root: '.pm-overlay' },
  { name: 'menu', state: quay, open: '__ui.openMenu()', root: '.pm-overlay' },
  { name: 'news', state: quay, open: '0', root: '.pm-overlay, .pm-talk', news: true },
  { name: 'notebook', state: afternoon, open: '__ui.openNotebook()', root: '.pm-overlay' },
  { name: 'shop-hilde', state: 'v2-forecourt-morning', open: "__ui.openShop('hilde')", root: '.pm-overlay' },
  { name: 'journal', state: afternoon, open: '__ui.openJournal()', root: '.pm-overlay' },
  { name: 'map', state: quay, open: '__ui.openMap()', root: '.pm-overlay' },
  { name: 'encounter', state: quay, open: "(() => { const s = __game.state(); s.v2.encounter = { id: 'cutpurse', place: s.place, day: s.day, slot: s.slot }; __ui.openEncounter(); })()", root: '.pm-talk' },
  { name: 'caught', state: quay, open: "(() => { const s = __game.state(); s.v2.caught = { by: 'mara', from: 'mara', item: 'duelist-sabre', fine: 20, shop: 'mara' }; __ui.openCaught(); })()", root: '.pm-talk' },
  { name: 'hint-eve', state: afternoon, query: 'play=1&noreload=1&state=v2-day2-afternoon&name=Ren&vis=0&tutorial=1', open: "__ui.hint('eve')", root: '.tu-hint' },
  { name: 'hint-challenge', state: 'v2-training-morning', query: 'play=1&noreload=1&state=v2-training-morning&name=Ren&vis=0&tutorial=1', open: "__ui.hint('challenge', 'orla')", root: '.tu-hint' },
  { name: 'hint-steal', state: quay, query: 'play=1&noreload=1&state=v2-day1-morning&name=Ren&vis=0&tutorial=1', open: "__ui.hint('steal')", root: '.tu-hint' },
  { name: 'town', state: quay, open: '0', root: 'body' },
];
const result = {};
let fails = 0;
for (const [w, h] of SIZES) {
  for (const P of PAGES) {
    if (ONLY.length && !ONLY.includes(P.name)) continue;
    const page = await b.newPage();
    await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
    const errors = []; page.on('pageerror', (e) => errors.push(e.message));
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    if (process.env.MOTION === 'reduce') await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    const q = P.query ?? `play=1&noreload=1&state=${P.state}&name=Ren&vis=0&tutorial=0`;
    await page.goto(`${BASE}?${q}&lang=${LANG}${REDUCED ? '&reduced=1' : ''}`, { waitUntil: 'load', timeout: 600000 });
    await page.waitForFunction(P.wait ? `document.querySelector(${JSON.stringify(P.wait)}) !== null` : 'window.__ready === true || window.__error', { timeout: 600000 });
    await sleep(1500);
    for (const k of P.pre ?? []) { await page.keyboard.press(k); await sleep(600); }
    if (P.after) await page.waitForFunction(`document.querySelector(${JSON.stringify(P.after)}) !== null`, { timeout: 90000 });
    if (!P.news && P.state) { await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click()); await sleep(300); }
    if (P.state) await page.evaluate(FULL);
    if (P.open !== '0') { await page.evaluate(P.open); await sleep(900); }
    for (let i = 0; i < (P.enters ?? 0); i++) { await page.keyboard.press('Enter'); await sleep(700); }
    for (const key of P.keys ?? []) { await page.keyboard.press(key); await sleep(400); }
    const m = await page.evaluate(measure, P.root);
    if (outDir) await page.screenshot({ path: path.join(outDir, `${P.name}-${w}x${h}.png`) });
    // the keys of a player on that page (the arrows, C, Esc), the focused line to stay in view and nothing to be covered after each
    const lost = [];
    for (const [i, key] of (WALK[P.name] ?? []).entries()) {
      await page.keyboard.press(key); await sleep(140);
      const w = await page.evaluate(measure, P.root);
      const miss = w.rows.filter((r) => !r.inside || r.covered);
      if ((w.focus && !w.focus.seen) || miss.length) lost.push(`#${i + 1} ${key}: ${w.focus ? w.focus.label + ' y ' + w.focus.top + '-' + w.focus.bottom + (w.focus.seen ? '' : ' NOT SEEN') : 'no focus'}${miss.length ? '; ' + miss.slice(0, 3).map((r) => r.label + (r.covered ? ' covered' : ' outside')).join(', ') : ''}`);
    }
    const bad = m.rows.filter((r) => !r.inside || r.covered), badFocus = m.focus && !m.focus.seen;
    const ok = !m.missing && !bad.length && !badFocus && !errors.length && !m.tooSmall.length && !m.unreach.length && m.cardInside && !lost.length;
    if (!ok) fails++;
    (result[`${w}x${h}`] ??= {})[P.name] = { ...m, ok };
    const sc = m.scrolls.map((s) => `${s.cls} ${s.h}px${s.beyond ? ` (+${s.beyond})` : ''}`).join('; ');
    console.log(`${ok ? 'OK ' : 'KO '} ${w}x${h} ${P.name.padEnd(18)} ${m.rows.length} controls, focus ${m.focus ? `${m.focus.label} y ${m.focus.top}-${m.focus.bottom}${m.focus.seen ? '' : ' NOT SEEN'}` : 'none'}; ${sc}`
      + (bad.length ? `\n     ${bad.slice(0, 8).map((r) => `${r.label} [${r.tag}] y ${r.top}-${r.bottom} x ${r.left}-${r.right}${r.inside ? '' : ' OUTSIDE'}${r.covered ? ` COVERED by « ${r.covered} »` : ''}`).join('\n     ')}` : '')
      + (m.missing ? `
     the page is not open (nothing matches ${P.root})` : '')
      + (m.tooSmall.length ? `\n     box too short to read: ${m.tooSmall.map((x) => `${x.cls} ${x.h}px (+${x.beyond})`).join(', ')}` : '')
      + (m.unreach.length ? `\n     box outside the window: ${m.unreach.map((x) => `${x.cls} y ${x.top}-${x.bottom}`).join(', ')}` : '')
      + (lost.length ? `
     walk: ${lost.slice(0, 5).join(' | ')}${lost.length > 5 ? ` (+${lost.length - 5})` : ''}` : (WALK[P.name] ? `
     walk: ${WALK[P.name].length} keys, the focused line always in view` : ''))
      + (m.cardInside ? '' : `\n     card outside the window: y ${m.card[0]}-${m.card[1]}`)
      + (errors.length ? `\n     page errors: ${errors.join('; ')}` : ''));
    await page.evaluate(() => { try { localStorage.clear(); sessionStorage.clear(); } catch { /* none */ } }).catch(() => {});
    await page.close();
  }
}
if (JSON_OUT) fs.writeFileSync(JSON_OUT, JSON.stringify(result, null, 1));
await b.close();
console.log(fails ? `\n${fails} page(s) fail` : '\nall pages OK');
process.exit(fails ? 1 : 0);
