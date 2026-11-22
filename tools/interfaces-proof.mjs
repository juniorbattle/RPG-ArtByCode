// The interfaces' lot 1 in a browser (journal Passe IA3; the operator's sheet https://claude.ai/artifact/BRKQQcAXD6N9HTMZdmohnc, IA-01, IA-02 and IA-04 read back at the
// recommendation, journal Passe IA2): played with real keys, a real mouse and a fake pad, its effect read back from the game's own state:
//   - IA-01 (A-01): a new game's first page, one thing bought; F5 and the language chosen in the settings reload the page: the game is the same (same fingerprint, same
//     coins), the address has lost `new`, the tour (the opening) plays again; a game made once, never anew;
//   - IA-01 (A-09): the title's « New game » over a save asks first (the game named, the button saying what it does, Esc keeps the save, a held Enter never answers, the
//     Enter that asks does not answer), and goes straight in without a save;
//   - IA-02 (A-02, C-04, B-04): the guide's long chapter and the skills page's detail read to their end with Page ↓, back with Page ↑, Home and End; the line « Page ↓ for
//     more » while there is more; the fake pad's right stick scrolls the detail and not the list, the line says « Right stick »;
//   - IA-04 (A-06, B-01, B-25, C-08, C-17): the list Q opens on a useful line (a person at the quay, a training at the sand), never on « Wait »; the time to pass and the
//     theft stand last, each under its title; an encounter's answers stand first under « Your answer »; Q then Enter passes nothing.
//   node tools/interfaces-proof.mjs <outDir>   (DEV server: named states; BASE_URL, CHROME_PATH as play-flow; W / H the window (1280 x 720 by default, 568 x 320 the phone),
//   PAGE_LANG=fr the pages' texts checked against the French table, REDUCED=1 the game's reduced motion, MOTION=reduce the system's); exit 1 on a failure
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', LANG = process.env.PAGE_LANG || 'en', outDir = process.argv[2];
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
if (!outDir) throw new Error('usage: node tools/interfaces-proof.mjs <outDir>');
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) fails++; };
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: 600000 });
const FR = LANG === 'fr';
const REDUCED = process.env.REDUCED ? '&reduced=1' : '';
const q = (extra = '') => `vis=0&lang=${LANG}${REDUCED}${extra}`;

// the texts the page must say, read from the game's own tables (the English as written, the French from its table)
const table = (f) => fs.readFileSync(new URL(`../src/narrative/text/${f}`, import.meta.url), 'utf8');
const EN_T = table('en.ts'), FR_T = table('fr-texts.ts');
const say = (key) => {
  const m = (FR ? FR_T : EN_T).match(new RegExp(`['"]${key.replace(/\./g, '\\.')}['"]: (['"])((?:\\\\.|(?!\\1).)*)\\1`));
  if (!m) throw new Error(`no text ${key}`);
  return m[2].split("\\'").join("'").split('\\"').join('"');
};
const escRe = (s) => s.replace(/[.*+?^$()|[\]\\]/g, (c) => `\\${c}`);

const fakePad = () => {
  const pad = { id: 'Xbox Wireless Controller (STANDARD GAMEPAD Vendor: 045e Product: 0b13)', index: 0, connected: true, mapping: 'standard', timestamp: 0, buttons: Array.from({ length: 17 }, () => ({ pressed: false, touched: false, value: 0 })), axes: [0, 0, 0, 0] };
  window.__fakePad = pad;
  Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [window.__fakePad, null, null, null] });
  window.__padSet = (i, on) => { const x = pad.buttons[i]; x.pressed = on; x.touched = on; x.value = on ? 1 : 0; pad.timestamp = performance.now(); };
  window.__padAxes = (a) => { pad.axes = a.slice(); pad.timestamp = performance.now(); };
};
const noPad = () => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] });

async function newPage(pad = false) {
  const page = await b.newPage();
  await page.evaluateOnNewDocument(pad ? fakePad : noPad);
  if (process.env.MOTION === 'reduce') await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { fails++; console.log('KO  page error:', e.message); });
  return page;
}
const ready = (page) => page.waitForFunction('window.__ready === true || window.__error', { timeout: 600000 });
async function go(page, url) { await page.goto(`${BASE}${url}`, { waitUntil: 'load', timeout: 600000 }); await ready(page); await sleep(1200); }
const shot = (page, name) => page.screenshot({ path: path.join(outDir, `${name}-${W}x${H}-${LANG}.png`) });
const key = async (page, k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await sleep(120); } };
const save = (page) => page.evaluate(() => localStorage.getItem('cite-du-tournoi.save'));
const readNews = (page) => page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());

try {
  // ------------------------------------------------------------------------------------------------------------------------------- IA-01: a game made once
  {
    const page = await newPage();
    // no `lang=` here: an address's own language wins over the player's choice, and the language is changed below
    await go(page, `?play=1&new=1&name=Ren&vis=0${REDUCED}&tutorial=1`);
    const first = await page.evaluate(() => ({ coins: __game.state().player.coins, hash: __game.hash(), search: location.search, opening: history.state?.cdtOpening === true }));
    check(!/[?&]new=/.test(first.search) && first.opening, `the first page of a new game: its address lost \`new\` (${first.search}) and its history entry remembers the opening`);
    // a purchase that changes the game: the first article the keeper sells that the purse allows
    const bought = await page.evaluate(() => { const o = __game.actions().find((x) => x.ok && x.action.type === 'shopBuy'); if (!o) return null; const r = __game.act(o.action); return r.ok ? o.action.item : null; });
    const before = await page.evaluate(() => ({ coins: __game.state().player.coins, hash: __game.hash() }));
    check(bought && before.coins < first.coins && before.hash !== first.hash, `bought ${bought}: ${first.coins} → ${before.coins} coins`);
    check(!!(await save(page)), 'the save is written');
    await page.reload({ waitUntil: 'load' }); await ready(page); await sleep(1200);
    await readNews(page);   // the news first, then the tour
    await page.waitForSelector('.tu-band', { timeout: 8000 }).catch(() => {});
    const after = await page.evaluate(() => ({ coins: __game.state().player.coins, hash: __game.hash(), tour: !!document.querySelector('.tu-band'), search: location.search }));
    check(after.coins === before.coins && after.hash === before.hash, `F5 on the first page: the same game (${after.coins} coins, same fingerprint), not made anew (${first.coins})`);
    check(after.tour, 'F5: the opening plays again (the tour\'s band)');
    check(!/[?&]new=/.test(after.search), `the address after the reload: ${after.search}`);
    await shot(page, 'ia01-after-f5');
    // the language chosen in the settings (A-01's own path): the real page, the real click, the page reloaded behind its curtain
    await page.evaluate(() => { document.querySelector('.tu-band .pm-foot .pm-btn.out, .tu-band .pm-btn:last-child')?.click(); __ui.openSettings('language'); });
    await sleep(500);
    await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 60000 }), page.evaluate(() => document.querySelector('[data-lang="fr"]')?.click())]);
    await ready(page); await sleep(1200);
    const lang = await page.evaluate(() => ({ coins: __game.state().player.coins, hash: __game.hash(), lang: document.documentElement.lang }));
    check(lang.lang === 'fr' && lang.coins === before.coins && lang.hash === before.hash, `language changed to French: <html lang> ${lang.lang}, ${lang.coins} coins, same fingerprint (the game kept)`);
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- IA-01 / A-09: a save is replaced after a question
  {
    const page = await newPage();
    await go(page, `?play=1&new=1&name=Ren&${q('&tutorial=0')}`);                // a save with a name and a day
    const saved = await save(page);
    check(!!saved, 'a save to protect');
    const title = async () => { await page.goto(`${BASE}?title=1&${q()}`, { waitUntil: 'load' }); await page.waitForSelector('#title-menu [data-id="new"]', { timeout: 120000 }); await sleep(900); };
    const askName = async () => { await page.click('#title-menu [data-id="new"]'); await page.waitForSelector('#title-name'); await page.type('#title-name', 'Ada'); };
    await title(); await askName();
    check(await page.evaluate(() => document.querySelector('#title-menu .warn')?.textContent) === say('ui.title.replaces'), 'the warning is written before the question');
    await page.keyboard.press('Enter'); await sleep(500);
    const asked = await page.evaluate(() => ({ warn: document.querySelector('#title-menu .warn')?.textContent, go: document.activeElement?.textContent, here: !!document.querySelector('#title-screen'), search: location.search }));
    check(asked.here && !/play=1/.test(asked.search), `Enter in the name's field asks first and leaves nothing (address ${asked.search || '(bare)'})`);
    const wantAsk = new RegExp(`^${escRe(say('ui.title.replaceAsk')).replace(escRe('{name}'), 'Ren').replace(escRe('{day}'), '\\d+')}$`);
    check(wantAsk.test(asked.warn ?? ''), `the question names the game: « ${asked.warn} »`);
    check(asked.go === say('ui.title.replaceYes'), `the button says what it does and has the keyboard: « ${asked.go} »`);
    check((await save(page)) === saved, 'the save is untouched by the first Enter');
    await shot(page, 'ia01-title-ask');
    await page.keyboard.press('Escape'); await sleep(400);
    check(await page.evaluate(() => !!document.querySelector('#title-menu [data-id="new"]') && !document.querySelector('#title-name')) && (await save(page)) === saved, 'Esc keeps the save and goes back to the menu');
    // a key held down repeats Enter: it never answers the question
    await askName();
    await page.evaluate(() => document.querySelector('#title-name').dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', repeat: true, bubbles: true })));
    await sleep(300);
    check(await page.evaluate(() => document.querySelector('#title-menu .warn')?.textContent) === say('ui.title.replaces'), 'a held Enter (repeat) does not even ask');
    // the answer: yes (a second Enter within a breath of the question is a double press, not an answer)
    await page.keyboard.press('Enter'); await sleep(650);
    await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 120000 }), page.keyboard.press('Enter')]);
    await ready(page); await sleep(1000);
    const made = await page.evaluate(() => ({ name: __game.state().player.name, search: location.search, day: __game.state().day }));
    check(made.name === 'Ada' && made.day === 1 && !/[?&]new=/.test(made.search), `the second Enter makes the game anew (${made.name}, day ${made.day}), its address without \`new\``);
    // without a save: straight in
    await page.evaluate(() => localStorage.clear());
    await title(); await askName();
    await Promise.all([page.waitForNavigation({ waitUntil: 'load', timeout: 120000 }), page.keyboard.press('Enter')]);
    await ready(page);
    check(await page.evaluate(() => __game.state().player.name) === 'Ada', 'with no save, Enter goes straight in (no question)');
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- IA-02: one rule for the zones that scroll
  const zoneInfo = (page, sel) => page.evaluate((sel) => {
    const d = document.querySelector(sel), l = document.querySelector('.pm-glist, .pm-scroll:not(.pm-detail)');
    const hint = document.querySelector('#pm-more');
    return { top: d?.scrollTop ?? -1, over: d ? d.scrollHeight - d.clientHeight : -1, more: d?.dataset.more ?? '', listTop: l && l !== d ? l.scrollTop : -1, hint: !!hint && hint.classList.contains('on'),
      hintText: hint ? [...hint.querySelectorAll('span')].filter((s) => getComputedStyle(s).display !== 'none').map((s) => s.textContent).join('') : '' };
  }, sel);
  const reading = async (page, what, sel, opener) => {
    await page.evaluate(opener); await sleep(700);
    const s0 = await zoneInfo(page, sel);
    if (s0.over < 20) { console.log(`--  ${what}: the text fits here (${s0.over} px), nothing to scroll`); return false; }
    check(s0.hint && s0.hintText === say('ui.more.key'), `${what}: ${s0.over} px beyond the edge, the line says « ${s0.hintText} »`);
    await key(page, 'PageDown');
    const s1 = await zoneInfo(page, sel);
    check(s1.top > 0 && (s1.listTop <= 0 || s1.listTop === s0.listTop), `${what}: Page ↓ reads on (${s0.top} → ${s1.top}) and leaves the list where it was`);
    // (a page is at least 40 px: the phone's detail is a few lines tall, A-03 of journal Passe IA1, lot 3's: the end takes dozens of presses there)
    for (let i = 0; i < 80 && /b/.test((await zoneInfo(page, sel)).more); i++) await key(page, 'PageDown');
    const end = await zoneInfo(page, sel);
    check(!/b/.test(end.more) && end.top >= end.over - 1 && !end.hint, `${what}: the end is reached by Page ↓ alone (${end.top} of ${end.over}) and the line leaves`);
    await shot(page, `ia02-${what.replace(/\W+/g, '-')}-end`);
    await key(page, 'PageUp');
    const up = await zoneInfo(page, sel);
    check(up.top < end.top && up.hint, `${what}: Page ↑ goes back and the line is back (${end.top} → ${up.top})`);
    await key(page, 'Home'); check((await zoneInfo(page, sel)).top === 0, `${what}: Home goes to the top`);
    await key(page, 'End'); check((await zoneInfo(page, sel)).top >= end.over - 1, `${what}: End goes to the end`);
    await key(page, 'Home');
    return true;
  };
  {
    const page = await newPage();
    await go(page, `?play=1&noreload=1&state=v2-day1-morning&name=Ren&${q('&tutorial=0')}`);
    await readNews(page);
    const guide = await reading(page, 'the guide (The duel)', '.tu-guide .pm-detail', "__ui.openGuide('duel')");
    check(guide, 'the guide\'s chapter The duel overflows and is read to its end (A-02)');
    await page.close();
  }
  {
    const page = await newPage();
    await go(page, `?play=1&noreload=1&state=v2-epilogue&name=Ren&${q('&tutorial=0')}`);
    await readNews(page);
    await reading(page, 'the journal (a day)', '.pm-journal .pm-detail, .pm-days .pm-detail', '__ui.openJournal()');
    await page.evaluate(() => __ui.closeModal?.()); await sleep(300);
    await reading(page, 'the skills page (the detail)', '.pm-skills .pm-detail, .pm-sk .pm-detail', '__ui.openSkills(false)');
    await page.close();
  }
  {
    // the fake pad: the right stick reads the detail, the list stays where the focused chapter put it; the line speaks of the stick
    const page = await newPage(true);
    await go(page, `?play=1&noreload=1&state=v2-day1-morning&name=Ren&${q('&tutorial=0')}`);
    await readNews(page);
    await page.evaluate(() => __ui.openGuide('duel')); await sleep(700);
    const stick = (ry) => page.evaluate((ry) => window.__padAxes([0, 0, 0, ry]), ry);
    await page.evaluate(() => window.__padSet(0, true)); await sleep(100); await page.evaluate(() => window.__padSet(0, false)); await sleep(200);
    const s0 = await zoneInfo(page, '.tu-guide .pm-detail');
    // 300 ms of full tilt reads about 280 px of the chapter's 621: the stick has to stop inside the text, since at the end the line leaves by design (700 ms reached that end
    // when the machine was quiet and fell short under load: a check that sat on the stick's speed, journal Passe IA7)
    await stick(1); await sleep(300); await stick(0); await sleep(300);
    const s1 = await zoneInfo(page, '.tu-guide .pm-detail');
    check(s1.top > s0.top + 100 && s1.listTop === s0.listTop, `the right stick scrolls the guide's TEXT (${s0.top} → ${s1.top}) and not its list (${s0.listTop} → ${s1.listTop})`);
    check(await page.evaluate(() => document.body.classList.contains('pm-pad')), 'the page shows the pad\'s caps');
    check(s1.hint && s1.hintText === say('ui.more.pad'), `the line says the stick: « ${s1.hintText} »`);
    await shot(page, 'ia02-pad');
    await stick(-1); await sleep(900); await stick(0); await sleep(200);
    check((await zoneInfo(page, '.tu-guide .pm-detail')).top < s1.top, 'pushed back, the stick reads back up');
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- IA-04: the list Q
  const listInfo = (page) => page.evaluate(() => {
    const o = document.querySelector('.pm-dlg.here .opts'); if (!o) return null;
    const name = (c) => c.querySelector('span')?.firstChild?.textContent?.trim() || c.textContent.trim().slice(0, 40);
    const rows = [...o.children].map((c) => (c.tagName === 'P' ? { sub: c.textContent } : { btn: name(c), group: c.dataset.group ?? '', off: c.disabled }));
    const f = document.activeElement;
    return { rows, focus: f?.classList?.contains('pm-btn') ? name(f) : f?.textContent?.trim() ?? null, focusGroup: f?.dataset?.group ?? null, slot: __game.state().slot, day: __game.state().day,
      visible: f ? (() => { const r = f.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight + 1; })() : false };
  });
  // the focused line on the screen, at every size: the phone's answers stand beside the words since lot 3 (B-21 of journal Passe IA1, journal Passe IA5)
const visibleLine = (l) => check(l.visible, 'the focused line is on the screen');
const titles = [say('ui.peopleHere'), say('ui.group.time'), say('ui.group.steal')];
  {
    const page = await newPage();
    await go(page, `?play=1&noreload=1&state=v2-day1-morning&name=Ren&${q('&tutorial=0')}`);
    await readNews(page);
    await key(page, 'q'); await sleep(700);
    const l = await listInfo(page);
    check(!!l, 'Q opens the list');
    const subs = l.rows.filter((r) => r.sub).map((r) => r.sub), at = (t) => l.rows.findIndex((r) => r.sub === t);
    check(subs[0] === titles[0] && at(titles[1]) > at(titles[0]) && at(titles[2]) > at(titles[1]), `the quay: people, then « ${titles[1]} », then « ${titles[2]} » (${subs.join(' | ')})`);
    const firstBtn = l.rows.findIndex((r) => r.btn);
    check(l.rows[firstBtn].group === '' && l.focus === l.rows[firstBtn].btn && !l.focusGroup, `the list opens on its first useful line: « ${l.focus} » (not the time, not the theft)`);
    check(l.focus !== say('v2.self.wait') && l.focus !== say('v2.self.rest'), 'never on « Wait » nor « Rest »');
    check(l.rows.filter((r) => r.group === 'steal').length >= 5 && l.rows.filter((r) => r.group === 'time').length === 2, 'the theft in one group, the time (Rest, Wait) in another');
    check(l.rows.slice(at(titles[2]) + 1).every((r) => !r.btn || r.group === 'steal') && l.rows.slice(at(titles[1]) + 1, at(titles[2])).every((r) => !r.btn || r.group === 'time'), 'each group\'s lines stand under its own title, the theft last');
    visibleLine(l);
    await shot(page, 'ia04-list-quay');
    await key(page, 'Enter'); await sleep(500);
    const after = await page.evaluate(() => ({ slot: __game.state().slot, day: __game.state().day }));
    check(after.slot === l.slot && after.day === l.day, `Q then Enter passes nothing (still day ${after.day}, ${after.slot})`);
    await key(page, 'Escape'); await sleep(300);
    // Wait stays reachable: the keyboard goes down through the groups to it
    await key(page, 'q'); await sleep(500);
    const downs = await page.evaluate(() => [...document.querySelectorAll('.pm-dlg.here .opts .pm-btn:not(:disabled)')].findIndex((x) => x.dataset.group === 'time'));
    check(downs > 0, `Wait is below the people, ${downs} lines down`);
    await key(page, 'Escape'); await sleep(200);
    // an encounter waiting for its answer (C-17)
    await page.evaluate(() => { const s = __game.state(); s.v2.encounter = { id: 'cutpurse', place: s.place, day: s.day, slot: s.slot }; });
    await key(page, 'q'); await sleep(700);
    const e = await listInfo(page);
    check(e.rows[0].sub === say('v2.encounter.title'), `an encounter's answers stand first under « ${e.rows[0].sub} »`);
    const letGo = new RegExp(`^${escRe(say('v2.encounter.cutpurse.pay')).replace(escRe('{n}'), '\\d+')}`);
    check(e.rows.slice(1, 3).every((r) => r.btn && r.group === '') && letGo.test(e.rows[1].btn) && e.focus === e.rows[1].btn, `the first answer has the keyboard: « ${e.focus} »`);
    await shot(page, 'ia04-list-encounter');
    await key(page, 'Escape');
    await page.close();
  }
  {
    const page = await newPage();
    await go(page, `?play=1&noreload=1&state=v2-training-morning&name=Ren&${q('&tutorial=0')}`);
    await readNews(page);
    await key(page, 'q'); await sleep(700);
    const l = await listInfo(page);
    const first = l.rows.find((r) => r.btn);
    check(first.group === '' && l.focus === first.btn && l.focus !== say('v2.self.wait'), `the training ground: the list opens on « ${l.focus} » (what the place is for)`);
    check(l.rows.filter((r) => r.group === 'time').length >= 2 && l.rows.findIndex((r) => r.sub === titles[1]) > l.rows.findIndex((r) => r.sub === titles[0]), 'the time to pass after the people');
    visibleLine(l);
    await shot(page, 'ia04-list-training');
    await page.close();
  }
} catch (e) { fails++; console.log('KO  proof stopped:', e.message); }
await b.close();
console.log(fails ? `\n${fails} failure(s)` : '\nall OK');
process.exit(fails ? 1 : 0);
