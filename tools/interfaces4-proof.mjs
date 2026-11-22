// The interfaces' lot 4 in a browser (journal Passe IA6; the operator's sheet https://claude.ai/artifact/BRKQQcAXD6N9HTMZdmohnc, IA-08, IA-09 and IA-10 read back at the recommendation,
// journal Passe IA2): played with real keys, its effect read back from the page and from the game's own state:
//   - IA-08 (B-22, A-11, A-10, B-12): the foot of the list Q, a dialogue, the menu and the map says what Enter does and the arrows never stop on it; Enter on it does the line that has the
//     keyboard; Esc in a page opened from the menu comes back to that line of the menu (its foot says « Back to the menu »), Esc again to the game; a page opened by its key closes to the
//     game; V and the menu's line open the settings on the same part; the map names who stands at each place now;
//   - IA-09 (C-19, C-20, C-14, C-11, C-18, B-13, C-02, C-21): a quest offered is a « New quest » with where it is kept; the journal's row says a failure; a theft's line says what being seen
//     costs, by day and at night; a challenge's offer says once a phase; the card sharps' refusal says its cost; the board says where and when to watch a rival; the duel's foot has its pause
//     (a click and the key pause and resume it); the last day says how the tournament ends;
//   - IA-10 (A-07, A-08, C-01): a new game's tour ends on what to do first and the walking keys, and no hint falls as it ends; the list Q opens without a hint; the theft's hint comes when the
//     line reaches a theft, the diamond's next to a marked person; the guide's keys say Page ↓ and Page ↑.
//   node tools/interfaces4-proof.mjs <outDir>   (DEV server: named states; BASE_URL, CHROME_PATH as play-flow; W / H the window, 1280 x 720 by default, 568 x 320 the phone;
//   PAGE_LANG=fr the texts read from the French table, REDUCED=1 the game's reduced motion, MOTION=reduce the system's); exit 1 on a failure
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', LANG = process.env.PAGE_LANG || 'en', outDir = process.argv[2];
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
if (!outDir) throw new Error('usage: node tools/interfaces4-proof.mjs <outDir>');
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) fails++; };
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: 600000 });
const FR = LANG === 'fr';
const REDUCED = process.env.REDUCED ? '&reduced=1' : '';

// the texts the page must say, read from the game's own tables (the English as written, the French from its table)
const table = (f) => fs.readFileSync(new URL(`../src/narrative/text/${f}`, import.meta.url), 'utf8');
const EN_T = table('en.ts'), FR_T = table('fr-texts.ts');
const say = (key, vals = {}) => {
  const m = (FR ? FR_T : EN_T).match(new RegExp(`['"]${key.replace(/\./g, '\\.')}['"]: (['"])((?:\\\\.|(?!\\1).)*)\\1`));
  if (!m) throw new Error(`no text ${key}`);
  return m[2].split("\\'").join("'").split('\\"').join('"').replace(/\{(\w+)(?:\|\w+)?\}/g, (_, k) => String(vals[k] ?? `{${k}}`));
};

async function newPage() {
  const page = await b.newPage();
  await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  if (process.env.MOTION === 'reduce') await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => { fails++; console.log('KO  page error:', e.message); });
  return page;
}
const ready = (page) => page.waitForFunction('window.__ready === true || window.__error', { timeout: 600000 });
async function go(page, url) { await page.goto(`${BASE}${url}`, { waitUntil: 'load', timeout: 600000 }); await ready(page); await sleep(1500); }
const shot = (page, name) => page.screenshot({ path: path.join(outDir, `${name}-${W}x${H}-${LANG}.png`) });
const key = async (page, k, n = 1, ms = 160) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await sleep(ms); } };
const readNews = async (page) => { await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click()); await sleep(350); };
const state = (name, extra = '') => `?play=1&noreload=1&state=${name}&name=Ren&vis=0&tutorial=0&lang=${LANG}${REDUCED}${extra}`;
/** the topmost page or band: its class, its foot's buttons (key + label), what has the keyboard, and everything it says */
const top = (page) => page.evaluate(() => {
  const roots = [...document.querySelectorAll('.pm-overlay, .pm-talk, .tu-hint')].filter((x) => x.offsetParent !== null || getComputedStyle(x).position === 'fixed');
  const r = roots[roots.length - 1]; if (!r) return null;
  const foot = [...r.querySelectorAll('.pm-foot .pm-btn')].map((x) => ({ key: x.querySelector('kbd')?.dataset.key ?? '', label: x.querySelector('span')?.textContent.trim() ?? '' }));
  const f = document.activeElement;
  return { cls: r.className, text: r.innerText.replace(/\s+/g, ' '), foot, focus: f && f !== document.body ? f.textContent.replace(/\s+/g, ' ').trim() : '', focusInFoot: !!f?.closest?.('.pm-foot'), here: !!r.dataset.here };
});
const gone = async (page) => (await top(page)) === null;

try {
  // ------------------------------------------------------------------------------------------------------------------------------- IA-08: the feet, the map, Esc one step back
  {
    const page = await newPage();
    await go(page, state('v2-day1-morning')); await readNews(page);
    await key(page, 'q', 1, 900);
    let t = await top(page);
    check(t?.here && t.foot.length === 2 && t.foot[0].key === 'Enter' && t.foot[0].label === say('ui.foot.choose') && t.foot[1].key === 'Esc' && t.foot[1].label === say('ui.close'),
      `the list Q's foot says what Enter does and what Esc does: ${JSON.stringify(t?.foot)}`);
    // the arrows walk the lines and never stop on the foot's Enter (the Esc « Close » is a stop, as before)
    let stopsOnEnter = 0, stopsOnClose = 0;
    for (let i = 0; i < 45; i++) { await key(page, 'ArrowDown', 1, 30); const x = await page.evaluate(() => { const f = document.activeElement; return { enter: !!f?.closest('.pm-foot') && f.querySelector('kbd')?.dataset.key === 'Enter', esc: !!f?.closest('.pm-foot') && f.querySelector('kbd')?.dataset.key === 'Esc' }; }); if (x.enter) stopsOnEnter++; if (x.esc) stopsOnClose++; }
    check(stopsOnEnter === 0 && stopsOnClose >= 1, `45 presses of Down: never on the foot's Enter (${stopsOnEnter}), on the way out ${stopsOnClose} time(s) before the walk wraps`);
    // a click on the foot's Enter does the line that had the keyboard
    await page.evaluate(() => [...document.querySelectorAll('.pm-talk .opts .pm-btn')].find((x) => /Mara/.test(x.textContent))?.focus());
    await sleep(100);
    await page.evaluate(() => document.querySelector('.pm-talk .pm-foot .pm-btn')?.click()); await sleep(900);
    t = await top(page);
    check(/Mara/.test(t?.text ?? '') && t.foot.length === 2 && t.foot[0].label === say('ui.foot.choose'), `Enter's button does the line that had the keyboard: Mara's dialogue opens, its foot says Enter and Esc: ${t?.text.slice(0, 40)}`);
    await shot(page, 'dialogue-foot');
    await key(page, 'Escape', 1, 500);

    // the menu: Enter says Choose; each page opened from it comes back to its line
    await key(page, 'Escape', 1, 700);
    t = await top(page);
    check(t?.foot.length === 2 && t.foot[0].label === say('ui.foot.choose') && t.foot[1].label === say('ui.menu.back'), `the menu's foot: ${JSON.stringify(t?.foot)}`);
    await key(page, 'Enter', 1, 800);
    t = await top(page);
    check(/The Cité|La Cité/.test(t?.text ?? '') && t.foot[0].key === 'Enter' && t.foot[0].label === say('ui.foot.go') && t.foot[1].label === say('ui.back.menu'), `the map from the menu: Enter ${t?.foot[0]?.label}, Esc ${t?.foot[1]?.label}`);
    const who = t?.text ?? '';
    check(new RegExp(say('ui.map.who', { names: '' }).replace(/[.*+?^$()|[\]\\]/g, '\\$&') + '.*(Odo|Anwen|Vessa)').test(who) && /(Lio|Kell)/.test(who) && /(Orla|Corvin)/.test(who), `the map names who stands at each place now: ${who.slice(60, 330)}`);
    await shot(page, 'map-from-menu');
    await key(page, 'Escape', 1, 700);
    t = await top(page);
    check(/Menu|Menu/.test(t?.text ?? '') && /^(Map|Carte)/.test(t.focus), `Esc in the map comes back to the menu, on the Map line (${t?.focus})`);
    await key(page, 'ArrowDown', 1, 100); await key(page, 'Enter', 1, 800);
    t = await top(page);
    check(t?.foot.length === 1 && t.foot[0].label === say('ui.back.menu'), `the journal from the menu: its foot says ${t?.foot[0]?.label}`);
    await key(page, 'Escape', 1, 700);
    t = await top(page);
    check(/^(Journal)/.test(t?.focus ?? '') && t.foot[1].label === say('ui.menu.back'), `Esc in the journal comes back to the menu, on the Journal line (${t?.focus})`);
    await key(page, 'Escape', 1, 700);
    check(await gone(page), 'Esc in the menu gives back the game');

    // the tournament's page, then the match sheet from it: the sheet comes back to the board, the board to the menu
    await key(page, 'Escape', 1, 700); await key(page, 'ArrowDown', 2, 100); await key(page, 'Enter', 1, 900);
    t = await top(page);
    check(t?.foot.some((x) => x.label === say('ui.back.menu')), `the board from the menu: ${JSON.stringify(t?.foot)}`);
    await page.evaluate(() => [...document.querySelectorAll('.pm-overlay .pm-foot .pm-btn')].find((x) => x.querySelector('kbd')?.dataset.key === 'Enter')?.click()); await sleep(900);
    t = await top(page);
    check(/Vessa/.test(t?.text ?? ''), `the match sheet from the board opens (its foot: ${t?.foot.map((x) => x.label).join(' / ')})`);
    await key(page, 'Escape', 1, 800);
    t = await top(page);
    check(t?.foot.some((x) => x.label === say('ui.back.menu')) && !/Vessa Lark.*Match/.test(t.text.slice(0, 20)), `Esc in the sheet comes back to the board, which still says « ${say('ui.back.menu')} »`);
    await key(page, 'Escape', 1, 800);
    t = await top(page);
    check(/^(Menu)/.test(t?.text ?? ''), 'Esc in the board comes back to the menu');
    await key(page, 'Escape', 1, 700);

    // a page opened by its key closes to the game, its foot says « Close »
    await key(page, 'm', 1, 700);
    t = await top(page);
    check(t?.foot[1]?.label === say('ui.close'), `M's map: Esc says ${t?.foot[1]?.label}`);
    await key(page, 'Escape', 1, 600);
    check(await gone(page), 'Esc in the map opened by M gives back the game');
    await key(page, 'j', 1, 700); t = await top(page);
    check(t?.foot[0]?.label === say('ui.close'), `J's journal: Esc says ${t?.foot[0]?.label}`);
    await key(page, 'Escape', 1, 600);

    // the settings: V and the menu's line open the same part
    const part = () => page.evaluate(() => { const s = document.querySelector('.pm-settings'); const on = s?.querySelector('.pm-glist .pm-btn.on'); return on?.textContent.replace(/\s+/g, ' ').trim() ?? s?.querySelector('section:last-child .pm-h')?.textContent ?? null; });
    await key(page, 'v', 1, 800); const byV = await part(); await key(page, 'Escape', 1, 600);
    await key(page, 'Escape', 1, 700); await page.evaluate(() => [...document.querySelectorAll('.pm-menu .pm-btn')].find((x) => /Settings|Réglages/.test(x.textContent))?.click()); await sleep(800);
    const byMenu = await part(); await key(page, 'Escape', 2, 700);
    check(byV !== null && byV === byMenu, `V and the menu open the settings on the same part (${byV} / ${byMenu})`);
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- IA-09: say it where the player decides
  {
    const page = await newPage();
    await go(page, state('v2-forecourt-morning')); await readNews(page);
    await page.evaluate(() => { __game.state().day = 2; });
    await page.evaluate(() => __ui.openPerson('anwen')); await sleep(900);
    let c = await page.evaluate(() => { const n = document.querySelector('.pm-talk .news.quest'); return n ? { chip: n.querySelector('b')?.textContent, note: n.querySelector('small')?.textContent, body: n.querySelector('span')?.textContent ?? '', text: n.textContent } : null; });
    check(c && c.chip === say('ui.quest.new') && c.note === say('ui.quest.noted') && /Anwen/.test(c.body), `talking to Sister Anwen starts a quest and says so: « ${c?.chip} », « ${c?.note} »`);
    check(c && !/^[^—]{0,12}—/.test(c.body) && c.text.indexOf(c.note) < c.text.indexOf(c.body), 'the note on where the quest is kept comes first, and the offer\'s own « Quest — » is not said twice');
    await shot(page, 'quest-new');
    await key(page, 'Escape', 1, 500);
    await page.evaluate(() => __ui.openJournal()); await sleep(700);
    let row = await page.evaluate(() => [...document.querySelectorAll('.pm-glist .pm-btn')].find((x) => x.dataset.quests)?.textContent.replace(/\s+/g, ' ').trim());
    check(row?.includes(say('ui.quests.one')), `the journal's row says the quest is open: « ${row} »`);
    await key(page, 'Escape', 1, 500);
    await page.evaluate(() => { __game.state().quests.herbs = 'failed'; }); await page.evaluate(() => __ui.openJournal()); await sleep(700);
    row = await page.evaluate(() => [...document.querySelectorAll('.pm-glist .pm-btn')].find((x) => x.dataset.quests)?.textContent.replace(/\s+/g, ' ').trim());
    check(row?.includes(say('ui.quests.lostOne')) && !row.includes(say('ui.quests.settled')), `after a failure the row says so, never « ${say('ui.quests.settled')} »: « ${row} »`);
    await shot(page, 'journal-failed');
    await page.close();
  }
  {
    // the theft's line: what being seen costs, by day and at night
    const page = await newPage();
    await go(page, state('v2-day1-morning')); await readNews(page);
    await page.evaluate(() => __ui.openHere()); await sleep(800);
    const day = await page.evaluate(() => [...document.querySelectorAll('.pm-talk .opts .pm-btn[data-group=steal]')].map((x) => x.querySelector('.pm-who')?.textContent ?? ''));
    check(day.length > 3 && day.every((x) => x === say('ui.steal.risk', { n: 8 })), `${day.length} theft lines by day, each « ${day[0]} »`);
    await page.evaluate(() => { __game.state().slot = 'evening'; __ui.render(); __ui.openHere(); }); await sleep(800);
    const night = await page.evaluate(() => [...document.querySelectorAll('.pm-talk .opts .pm-btn[data-group=steal]')].map((x) => x.querySelector('.pm-who')?.textContent ?? ''));
    check(night.length > 0 && night.some((x) => x === say('ui.steal.risk', { n: 12 })), `at night a shutter forced says « ${night.find((x) => /12/.test(x))} »`);
    await shot(page, 'steal-lines');
    await page.close();
  }
  {
    // a challenge's offer says once a phase; the card sharps' refusal says what it costs; the board says where to watch
    const page = await newPage();
    await go(page, state('v2-training-morning')); await readNews(page);
    await page.evaluate(() => __ui.openPerson('orla')); await sleep(900);
    const tags = await page.evaluate(() => [...document.querySelectorAll('.pm-talk .opts .pm-btn')].filter((x) => /challenge|défi|Challenge|Défier|Defier/i.test(x.textContent)).map((x) => [...x.querySelectorAll('.cost')].map((y) => y.textContent)));
    check(tags.length > 0 && tags.every((t) => t.includes(say('ui.oncePhase'))), `Orla's challenge lines say « ${say('ui.oncePhase')} »: ${JSON.stringify(tags)}`);
    await key(page, 'Escape', 1, 500);
    await page.evaluate(() => { const s = __game.state(); s.v2.encounter = { id: 'sharps', place: s.place, day: s.day, slot: s.slot }; __ui.openEncounter(); }); await sleep(800);
    const refuse = await page.evaluate(() => [...document.querySelectorAll('.pm-talk .opts .pm-btn')].map((x) => x.textContent.replace(/\s+/g, ' ')).find((x) => /Refus|Refuse/.test(x)));
    check(refuse && /−2/.test(refuse), `the sharps' refusal says what it costs: « ${refuse?.slice(0, 160)} »`);
    await page.close();
  }
  {
    const page = await newPage();
    await go(page, state('v2-day1-morning')); await readNews(page);
    await page.evaluate(() => __ui.openBoard()); await sleep(900);
    const board = await page.evaluate(() => document.querySelector('.pm-overlay')?.innerText.replace(/\s+/g, ' ') ?? '');
    const where = say('scout.where', { place: FR ? 'le parvis de l’arène' : 'the Arena Forecourt', when: say('scout.when.day') });
    check(board.includes(where) || (FR && /parvis/i.test(board) && /de jour/.test(board)), `the board says where and when to watch Vessa Lark: « ${(board.match(/\([^)]*(Forecourt|parvis)[^)]*\)/i) ?? [''])[0]} »`);
    await page.close();
  }
  {
    // the last day says how the tournament ends
    const page = await newPage();
    await go(page, state('v2-epilogue')); await readNews(page);
    const next = await page.evaluate(() => document.querySelector('#pm-status .next')?.textContent ?? '');
    check(next === say('v2.next.doneLast') || (await page.evaluate(() => __game.state().day)) < 10, `the status line on the last day: « ${next} »`);
    await page.close();
  }
  {
    // the duel's foot: ×2, Skip and the pause, each inside the window and topmost; a click and the key pause and resume
    const page = await newPage();
    await go(page, `?scene=arena&vis=0&duelseed=3&lang=${LANG}${REDUCED}`); await sleep(2000);
    const ctl = await page.evaluate(() => [...document.querySelectorAll('#ah-bar .ah-b.ctl')].map((x) => {
      const r = x.getBoundingClientRect(), t = document.elementFromPoint(r.left + r.width / 2, r.top + Math.min(r.height / 2, 10)), k = x.querySelector('kbd');
      return { act: x.dataset.act, cap: k?.textContent, inside: r.left >= 0 && r.right <= innerWidth && r.top >= 0 && r.bottom <= innerHeight, topmost: x === t || x.contains(t), capOk: k.scrollWidth <= k.clientWidth + 2 };
    }));
    check(ctl.length === 3 && ctl.map((x) => x.act).join() === 'speed,skip,pause' && ctl.every((x) => x.inside && x.topmost && x.capOk), `the duel's foot: ${ctl.map((x) => `${x.act} [${x.cap}]`).join(', ')}, each inside the window, topmost, its cap whole`);
    check(ctl[2]?.cap === 'Space' || ctl[2]?.cap === 'Espace', `the pause's cap is the player's key (${ctl[2]?.cap})`);
    await page.evaluate(() => document.querySelector('#ah-bar .ah-b.ctl[data-act=pause]').dispatchEvent(new PointerEvent('pointerdown', { bubbles: true }))); await sleep(500);
    const paused = await page.evaluate(() => ({ p: __arena.paused, active: document.querySelector('#ah-bar .ah-b.ctl[data-act=pause]').classList.contains('active'), sub: document.querySelector('#ah-bar .ah-b.ctl[data-act=pause] em').textContent }));
    check(paused.p && paused.active, `a click on the pause control pauses the bout, the control in the accent saying « ${paused.sub} »`);
    await key(page, ' ', 1, 500);
    check(!(await page.evaluate(() => __arena.paused)), 'the key resumes it');
    await shot(page, 'duel-foot');
    await page.close();
  }

  // ------------------------------------------------------------------------------------------------------------------------------- IA-10: the first quarter hour
  {
    const page = await newPage();
    await go(page, `?play=1&new=1&name=Ren&tutorial=1&noreload=1&vis=0&lang=${LANG}${REDUCED}`);
    await key(page, 'Enter', 1, 900); // the news
    const bands = [];
    for (let i = 0; i < 6; i++) { const t = await top(page); bands.push(t?.text ?? ''); if (i < 5) await key(page, 'Enter', 1, 800); }
    check(bands.length === 6 && bands[5].includes(say('tut.tour.end.title')), `the tour: six bands, the last « ${say('tut.tour.end.title')} »`);
    check(/WASD|ZQSD|↑|Move|Marcher/.test(bands[5]) || /\b[WZ]/.test(bands[5]), `the last band says what to do first and the walking keys: « ${bands[5].replace(/\s+/g, ' ').slice(0, 220)} »`);
    await shot(page, 'tour-end');
    await key(page, 'Enter', 1, 600);
    await sleep(3000);
    check(await gone(page), 'no hint falls as the tour ends (the scene stays clear)');
    await key(page, 'q', 1, 1200);
    let t = await top(page);
    check(t?.here && !/tu-hint/.test(t.cls), 'the list Q opens without a hint over it');
    // down to the first theft: the hint comes when the line reaches it
    let hint = null;
    for (let i = 0; i < 40 && !hint; i++) { await key(page, 'ArrowDown', 1, 80); hint = await page.evaluate(() => document.querySelector('.tu-hint .pm-h')?.textContent ?? null); }
    const onSteal = await page.evaluate(() => /Steal|Voler|Lift|Dérober|Prendre/i.test(document.activeElement?.textContent ?? '') || !!document.querySelector('.tu-hint'));
    check(hint === say('tut.hint.steal.title') && onSteal, `the theft's hint comes when the line reaches a theft: « ${hint} »`);
    await shot(page, 'steal-hint');
    await sleep(450); // a press within a quarter second of a hint opening is not an answer (showHint)
    await key(page, 'Enter', 1, 600);
    check(!(await page.evaluate(() => !!document.querySelector('.tu-hint'))) && /Steal|Voler|Lift|Dérober|Prendre/i.test(await page.evaluate(() => document.activeElement?.textContent ?? '')), 'Enter closes it and the keyboard is back on the theft\'s line');
    await key(page, 'Escape', 1, 500);
    // the diamond's hint: next to a person the diamond marks
    const who = await page.evaluate(async () => { for (const id of ['mara', 'bram', 'tam', 'hale']) { __ui.host.nearby = () => id; __ui.update(); await new Promise((r) => setTimeout(r, 400)); const h = document.querySelector('.tu-hint .pm-h')?.textContent; if (h) return { id, h }; } return null; });
    check(who && who.h === say('tut.hint.npcMark.title'), `the diamond's hint comes next to a person it marks: ${JSON.stringify(who)}`);
    await page.close();
  }
  {
    // the guide's keys: Page ↓ and Page ↑
    const page = await newPage();
    await go(page, state('v2-day1-morning')); await readNews(page);
    await page.evaluate(() => __ui.openGuide('keys')); await sleep(900);
    const keys = await page.evaluate(() => [...document.querySelectorAll('.tu-keys .tu-k')].map((x) => ({ caps: [...x.querySelectorAll('kbd')].map((k) => k.textContent), text: x.querySelector('span')?.textContent ?? '' })).find((x) => x.caps.length === 2 && /PgDn|Pg|Page/i.test(x.caps.join(' '))));
    check(!!keys && keys.text === say('tut.key.page'), `the guide's keys: ${JSON.stringify(keys)}`);
    await shot(page, 'guide-keys');
    await page.close();
  }
} finally {
  await b.close();
}
console.log(fails ? `\n${fails} failure(s)` : '\nall checks passed');
process.exit(fails ? 1 : 0);
