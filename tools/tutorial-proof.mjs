// The tutorial's proof at the keyboard (journal Passe TU3, the operator's sheet TU-1 to TU-12; the gamepad and the bare address: tools/default-proof.mjs):
//   1. a new game (tutorial=1: a driven browser keeps today's flow without it): the arrival's news, then the tour of six bands at Enter, the real clock,
//      figures, list and menu lit; Esc skips the tour when it is replayed;
//   2. the guide on H: thirteen chapters (« Earning coins » since journal Passe ECO2) walked with the arrows, every chapter's text filled from the game (no brace left), the ten days, the scene here as a
//      live picture, the quay kept for « The Cité and its squares »; Esc closes it;
//   3. the hints, each once: the shop (a keeper's goods), the theft (the list), then the next pages as the game goes on: the eve of the first bout (day 1,
//      afternoon), Space opening its chapter of the guide; the first square (the forecourt), its picture kept beside the quay's; the evening; none twice;
//   4. a game begun before, in a fresh profile: « Continue » hears the guide's line once (TU-8), no tour;
//   5. today's game (v2=0): no tour, no hint, no « Guide » in its menu;
//   6. the first bout, the duel played by the computer (lot 3, journal Passe LC5; TU-11): « Fight » and the replay holds on its first lesson, the four at the foot
//      lit, the band's words above them, the bout held while it is read (its clock still, ×2 and « Skip » refused, its keys and the HUD's buttons), fades only;
//      Enter goes on; every lesson the bout reaches said once, each at the line of the script that opens it (the duel's own log read back: the same oracle as
//      tests/tutorial.test.mjs), its numbers the match sheet's (the chances to dodge and guard, the forms of the day); the bout to its result;
//   6b. the guide's « The duel » (its order of the four drawn from the game): Space forgets the lessons; the next bout (day 4) says them again, Esc on the first
//      skips the rest (none holds the bout again, all of them kept as seen), « Skip » to the result.
// DEV or production server: no named state is used.
//   node tools/tutorial-proof.mjs <outDir>   (BASE_URL, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs; PAGE_LANG=fr every page in French, the texts
//   checked against the French table; REDUCED=1 the game's reduced motion on (RG-5); MOTION=reduce|no-preference the system's, which the game ignores)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/tutorial-proof.mjs <outDir>');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', READY = +(process.env.READY_MS || 600000);
const L = process.env.PAGE_LANG === 'fr' ? 'fr' : 'en', LQ = L === 'fr' ? '&lang=fr' : '', REDUCED = process.env.REDUCED === '1', MOTION = process.env.MOTION;
fs.mkdirSync(outDir, { recursive: true });
// the game's texts in the page's language, from its own tables (no sentence copied here)
const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const TX = await server.ssrLoadModule('/src/narrative/text/index.ts'), { FR } = await server.ssrLoadModule('/src/narrative/text/fr.ts');
const DT = await server.ssrLoadModule('/src/ui/duelTutorial.ts');
const t = (k, v) => { TX.useLanguage(L, L === 'fr' ? FR : undefined); try { return TX.tx(k, v); } finally { TX.useLanguage('en'); } };
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], defaultViewport: { width: 1600, height: 900, deviceScaleFactor: 1 }, protocolTimeout: READY });
let failed = 0, errors = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
console.log(`   language ${L}, the game's reduced motion ${REDUCED ? 'on' : 'off'}, the system's ${MOTION ?? 'as headless Chrome reports it'}`);

/** a page as this run wants it: no real gamepad (the operator's, journal Passe RM3: its drift pressed keys in a proof; PAD=1 keeps it), the game's reduced motion,
 *  the system's */
async function prepare(page) {
  if (!process.env.PAD) await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  if (REDUCED) await page.evaluateOnNewDocument(() => { try { const k = 'cite-du-tournoi.settings', s = JSON.parse(localStorage.getItem(k) ?? '{}'); if (s.reducedMotion !== true) localStorage.setItem(k, JSON.stringify({ ...s, reducedMotion: true })); } catch { /* none */ } });
  if (MOTION) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: MOTION }]);
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
}
async function open(page, q) {
  const url = q.startsWith('?') && LQ && !q.includes('lang=') ? `${q}${LQ}` : q;
  await page.goto(`${BASE}${url}`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
  const err = await page.evaluate(() => window.__error ?? null);
  check(!err, `the page ${url} is ready${err ? `: ${err}` : ''}`);
  await sleep(1200);
}
const until = async (page, f, ms, what, arg) => { const t0 = Date.now(); for (;;) { const v = await page.evaluate(f, arg).catch(() => null); if (v) return v; if (Date.now() - t0 > ms) { check(false, `waited ${ms} ms for ${what}`); return null; } await sleep(120); } };
const key = async (page, k) => { await page.keyboard.press(k); await sleep(330); };
/** a hint or a band ignores a press in its first 0.25 s (a key held from the page before): read it a moment, then Enter */
const readOn = async (page) => { await sleep(300); await key(page, 'Enter'); };
const hintTitle = (page) => page.evaluate(() => document.querySelector('.tu-hint .pm-h')?.textContent ?? null);
/** the hints a page says on arriving (the vigour after a first win, a wound), read and closed */
async function closeHints(page) { for (let i = 0; i < 4 && (await hintTitle(page)); i++) { const h = await hintTitle(page); console.log(`   a hint read: ${h}`); await sleep(300); await key(page, 'Enter'); } }
/** the next page of the play mode (the game saved it; `noreload` leaves its address in __go) */
async function next(page) {
  const go = await page.evaluate(() => window.__go); check(!!go, `the next page: ${go}`); await open(page, go);
  // the news of the slot that ended are read first (the hints wait for them)
  const news = await page.evaluate(() => { const b = document.querySelector('.pm-overlay:not(.tu-hint):not(.tu-band) .pm-btn'); if (!b) return null; const t = b.closest('.pm-card')?.querySelector('.pm-h')?.textContent ?? ''; b.click(); return t; });
  if (news) console.log(`   the page's news read: ${news}`);
}

// ------------------------------------------------------------------------------------------------ the first duel's lessons (lot 3, journal Passe LC5)
const TITLE = Object.fromEntries(DT.LESSONS.map((id) => [t(`tut.duel.${id}.title`), id]));
const lessonNow = (page) => page.evaluate(() => document.querySelector('.tu-duel .pm-h')?.textContent ?? null);
/** the first time each lesson opens in this duel, from its script alone (tests/tutorial.test.mjs's oracle): Ren's first light attack that lands, a blow that is not
 *  its action's first, a guard or a dodge, a skill or a heavy blow landing, a target's gauge a third full at a blow, a break, Ren charging a skill; ×2 and « Skip »
 *  at SPEED_AT; none at the K.O.'s blow or after it */
function oracle(log, ids) {
  const first = { start: 0 }, fresh = {}, put = (id, x) => { if (!(id in first)) first[id] = x; };
  const koAt = log.find((e) => e.hp !== undefined && e.hp <= 0)?.t ?? Infinity, max = 70, decay = 0.63;
  // a target's gauge just after a blow: the next line's trace (written before its own blow fills anything) with its decay undone, full at that fighter's break or
  // while it is broken (lot 4, journal Passe LC6: the HUD shows the gauge at the blow, no longer one line late)
  const after = (i, k) => { const e = log[i], n = log[i + 1]; if (e.s[k] >= max) return max; if (!n) return 0; if (n.ev === 'break' && n.s[k] >= max) return max; return n.s[k] > 0 ? n.s[k] + decay * (n.t - e.t) : 0; };
  for (const [i, e] of log.entries()) {
    if (e.t >= koAt) break;
    if (e.ev === 'charge') { fresh[e.who] = true; if (e.who === ids.ren && e.act !== ids.renLight) put('charge', e.t); continue; }
    if (e.ev === 'break') { put('break', e.t); continue; }
    if (e.ev === 'ward' || e.ev === 'boost') { fresh[e.who] = false; continue; }
    const follow = !fresh[e.who]; fresh[e.who] = false;
    if (e.who === ids.ren && e.act === ids.renLight && e.ev !== 'dodged') put('ap', e.t);
    if (follow) put('combo', e.t);
    if (e.ev !== 'hit') put('react', e.t);
    if (e.ev === 'hit' && !ids.light.includes(e.act)) put('form', e.t);
    if (e.ev !== 'dodged' && after(i, e.who === ids.ren ? 3 : 1) >= max / 3) put('gauge', e.t);
  }
  if (DT.SPEED_AT < koAt) put('speed', DT.SPEED_AT);
  return first;
}

/** « Fight », the first lesson and the hold, then every lesson read at Enter as the bout plays (its clock ×3 through the arena's own time scale), checked against
 *  the script and the match sheet; the bout to its result. Returns the lessons said. */
async function firstBout(page, sheet, tag) {
  await page.evaluate(() => document.querySelector('.pm-overlay.pm-band .pm-btn.primary')?.click());
  const first = await until(page, () => document.querySelector('.tu-duel .pm-h')?.textContent ?? null, 6000, 'the duel\'s first lesson');
  check(first === t('tut.duel.start.title'), `« Fight »: the replay holds on its first lesson: ${first}`);
  // the four at the foot lit; the band's words above them, the HUD over the band
  const lit = await until(page, () => { const s = document.querySelector('.tu-spot.on'); if (!s) return null; const r = s.getBoundingClientRect(), q = [...document.querySelectorAll('#ah-bar .ah-b.slot')].map((x) => x.getBoundingClientRect()); return { n: q.length, inside: q.every((x) => x.left >= r.left && x.right <= r.right && x.top >= r.top && x.bottom <= r.bottom) }; }, 4000, 'the light on the four');
  check(lit?.n === 4 && lit.inside, `its light on the four skills at the foot: ${JSON.stringify(lit)}`);
  const lay = await page.evaluate(() => { const c = document.querySelector('.tu-duel .pm-card').getBoundingClientRect(), bar = document.getElementById('ah-bar').getBoundingClientRect(); return { card: Math.round(c.bottom), bar: Math.round(bar.top), z: getComputedStyle(document.getElementById('arena-hud')).zIndex }; });
  check(lay.card <= lay.bar && lay.z === '41', `the band's words above the foot (${lay.card} ≤ ${lay.bar}), the HUD over the band (z ${lay.z})`);
  // fades only (TU-10); the reduced motion is the game's setting (RG-5)
  const fx = await page.evaluate(() => ({ reduced: document.documentElement.classList.contains('cdt-reduced'), band: getComputedStyle(document.querySelector('.tu-duel')).animationName, spot: getComputedStyle(document.querySelector('.tu-spot')).transitionProperty }));
  // (the game's reduced motion narrows every page's transitions to its fades and colours, src/ui/style.ts: nothing that moves either way)
  check(fx.reduced === REDUCED && fx.band === 'ds-fade' && /\bopacity\b/.test(fx.spot) && !/transform|translate|left|top|width|height|inset|margin|\ball\b/.test(fx.spot), `fades only: the band ${fx.band}, the light ${fx.spot}; the game's reduced motion ${fx.reduced ? 'on' : 'off'}`);
  // held: its clock still; neither ×2 nor « Skip » (the keys, the HUD's buttons)
  const held = await page.evaluate(() => ({ paused: window.__arena.paused, t: window.__arena.auto.t }));
  await sleep(600);
  await page.keyboard.press('j'); await page.keyboard.press('l'); await sleep(150);
  await page.evaluate(() => document.querySelector('#ah-bar .ah-b.ctl[data-act="skip"]')?.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })));
  await sleep(250);
  const after = await page.evaluate(() => ({ t: window.__arena.auto.t, speed: window.__arena.speed, curtain: !!document.querySelector('.ar-skip-fade'), band: !!document.querySelector('.tu-duel') }));
  check(held.paused && after.t === held.t && after.speed === 1 && !after.curtain && after.band, `the bout holds while the lesson is read (t ${held.t}), ×2 and « Skip » refused: ${JSON.stringify(after)}`);
  await page.screenshot({ path: path.join(outDir, `${tag}-lesson-start.png`) });
  await page.keyboard.press('Enter'); await sleep(250);
  const goneOn = await page.evaluate((h) => ({ band: document.querySelector('.tu-duel .pm-h')?.textContent ?? null, paused: window.__arena.paused, t: window.__arena.auto.t }), first);
  check(goneOn.band !== first && (goneOn.band !== null || (!goneOn.paused && goneOn.t > held.t)), `Enter: the bout goes on (${goneOn.band ?? `t ${goneOn.t.toFixed(2)}`})`);
  // the rest as the bout plays, its clock three times faster (the hold is the step's: no line passes a lesson)
  await page.evaluate(() => { window.__arena.timeScale = 3; });
  const said = [{ id: 'start', t: held.t, text: '' }], t0 = Date.now();
  for (;;) {
    const s = await page.evaluate(() => { const h = document.querySelector('.tu-duel .pm-h'); return { h: h?.textContent ?? null, text: document.querySelector('.tu-duel .pm-body')?.textContent ?? '', t: window.__arena?.auto?.t ?? -1, over: window.__arena?.auto?.over ?? null, gone: !window.__arena ? location.href : null, result: !!document.querySelector('.pm-big'), lit: !!document.querySelector('.tu-spot.on') }; });
    if (s.h) {
      const id = TITLE[s.h] ?? s.h;
      if (!said.some((x) => x.id === id && Math.abs(x.t - s.t) < 1e-9)) {
        said.push({ id, t: s.t, text: s.text });
        // the band and its light faded in (0.2 s each, the light two frames after the HUD drew the moment) before the capture
        await sleep(450);
        await page.screenshot({ path: path.join(outDir, `${tag}-lesson-${id}.png`) });
        await page.keyboard.press('Enter');
      }
    }
    if (s.gone) { check(false, `the arena left before the result: ${s.gone}`); break; }
    if (s.result || Date.now() - t0 > 240000) break;
    await sleep(100);
  }
  console.log(`   said in the bout: ${said.map((x) => `${x.id} ${x.t.toFixed(2)}`).join(' | ')}`);
  check(new Set(said.map((x) => x.id)).size === said.length, 'no lesson said twice');
  // against the script
  const duel = await page.evaluate(() => { const a = window.__arena.auto; return { log: a.result.log, ids: { ren: a.fighters.ren.id, renLight: a.fighters.ren.light.id, light: [a.fighters.ren.light.id, a.fighters.marek.light.id].filter(Boolean) }, dt: a.D.dt }; });
  const want = oracle(duel.log, duel.ids);
  check(JSON.stringify(said.map((x) => x.id).sort()) === JSON.stringify(Object.keys(want).sort()), `the lessons the bout reaches before its K.O.: ${Object.keys(want).join(', ')}`);
  const off = said.filter((x) => x.id !== 'start' && !(x.t >= want[x.id] - 1e-9 && x.t - want[x.id] <= duel.dt + 1e-6));
  check(off.length === 0, `each at the line that opens it (within the arena's step)${off.length ? `: ${off.map((x) => `${x.id} ${x.t} / ${want[x.id]}`).join('; ')}` : ''}`);
  // its numbers the match sheet's: the chances to dodge and guard, the forms of the day
  const num = (s) => +String(s).replace(',', '.').match(/\d+(?:\.\d+)?/)[0];
  const react = said.find((x) => x.id === 'react'), form = said.find((x) => x.id === 'form');
  if (react) {
    const got = (react.text.match(/\d+/g) ?? []).slice(-5).map(Number), g = (s) => s.split('·').map(num);
    const wantR = [num(sheet[6][1]), ...g(sheet[7][1]), num(sheet[6][2]), g(sheet[7][2])[0]];
    check(got.join() === wantR.join(), `the guard and the dodge: the match sheet's chances (${got.join(', ')} = ${wantR.join(', ')})`);
  }
  if (form) {
    const got = (form.text.match(/[+−]\d+/g) ?? []), wantF = [sheet[5][1], sheet[5][2]].map((s) => s.match(/[+−]\d+/)[0]);
    check(got.join() === wantF.join(), `the form of the day: the match sheet's (${got.join(', ')} = ${wantF.join(', ')})`);
  }
  check(said.every((x) => !/[{}]/.test(x.text)), 'every lesson filled (no brace left)');
  return said;
}

try {
  const page = await b.newPage();
  await prepare(page);

  // 1. a new game: the news, then the tour at the keyboard
  await open(page, '?play=1&new=1&name=Aster&noreload=1&tutorial=1');
  check(await page.evaluate(() => !!document.querySelector('.pm-overlay .pm-h') && !document.querySelector('.tu-band')), 'the arrival\'s news come first, the tour waits');
  await key(page, 'Enter');
  const steps = [];
  for (let i = 1; i <= 6; i++) {
    const r = await until(page, () => { const t = document.querySelector('.tu-band .tu-step')?.textContent; return t ? { t, h: document.querySelector('.tu-band .pm-h').textContent, lit: !!document.querySelector('.tu-spot.on') } : null; }, 5000, `band ${i}`);
    steps.push(r ? `${r.h}${r.lit ? ' (lit)' : ''}` : '-');
    check(r?.t === t('tut.tour.step', { n: i, of: 6 }), `band ${i}: ${r?.h}`);
    if (i === 2) await page.screenshot({ path: path.join(outDir, '1-tour-clock.png') });
    if (i === 6) await page.screenshot({ path: path.join(outDir, '1-tour-end.png') });
    await key(page, 'Enter');
  }
  check(steps.filter((x) => x.endsWith('(lit)')).length === 4, `the clock, figures, list and menu lit: ${steps.join(' | ')}`);
  check(await page.evaluate(() => !document.querySelector('.tu-band') && !document.querySelector('.tu-spot') && !document.body.classList.contains('tu-on')), 'Enter on the last band: the tour ends, nothing left');
  // the people marked on the quay (Mara, her stall and her crates): the marks' hint once the tour is done (the operator's MK-11, journal Passe MK3), then away
  const mk = await until(page, () => { const h = document.querySelector('.tu-hint .pm-h')?.textContent; return h ? { h, body: document.querySelector('.tu-hint .pm-body').textContent, marks: (window.__people?.marks.state() ?? []).map((m) => `${m.who}:${m.kind}`) } : null; }, 5000, 'the marks\' hint');
  check(mk?.h === t('tut.hint.npcMark.title') && mk.body.length > 40, `the marks' hint after the tour: ${mk?.h}`);
  check(!!mk?.marks.includes('mara:item'), `Mara marked on the first morning: ${mk?.marks.join(', ')}`);
  await readOn(page);

  // 2. the guide on H
  await key(page, 'h');
  const n = await until(page, () => document.querySelectorAll('.tu-guide .pm-glist .pm-btn').length, 5000, 'the guide');
  check(n === 13, `H opens the guide: ${n} chapters`);
  const seen = [];
  for (let i = 0; i < 12; i++) {
    const c = await page.evaluate(() => ({ t: document.querySelector('.tu-guide section:last-child .pm-h').textContent, body: document.querySelector('.tu-guide .pm-detail').textContent, img: document.querySelectorAll('.tu-guide .pm-detail img').length, days: document.querySelectorAll('.tu-days div').length, order: document.querySelectorAll('.tu-order > div').length }));
    seen.push(c);
    if (i === 3) await page.screenshot({ path: path.join(outDir, '2-guide-places.png') });
    if (i === 10) await page.screenshot({ path: path.join(outDir, '2-guide-prepare.png') });
    if (i === 11) await page.screenshot({ path: path.join(outDir, '2-guide-duel.png') });
    await key(page, 'ArrowDown');
  }
  check(seen.every((c) => c.body.length > 120 && !/[{}]/.test(c.body)), `every chapter filled from the game: ${seen.map((c) => c.t).join(' | ')}`);
  check(seen[0].days === 10, 'the tournament drawn from the game (ten days)');
  check(seen[2].img === 1, '« Walking and talking »: the scene here, a live picture');
  check(seen[3].img === 1 && seen[3].body.includes(t('tut.fig.unseen')), `« The Cité and its squares »: the quay kept, the squares to discover (${seen[3].img} picture)`);
  check(seen[11].t === t('tut.ch.duel.title') && seen[11].order === 5 && seen[11].body.startsWith(t('ui.order.title')), `« ${seen[11].t} »: the order of the four drawn from the game, then the light attack (${seen[11].order} lines)`);
  await key(page, 'Escape');
  check(await page.evaluate(() => !document.querySelector('.tu-guide')), 'Esc closes the guide');

  // 3. the hints: the shop, the theft; then the eve, the square, the evening
  await page.evaluate(() => window.__ui.openShop('mara'));
  check((await until(page, () => document.querySelector('.tu-hint .pm-h')?.textContent, 4000, 'the shop\'s hint')) === t('tut.hint.shop.title'), 'a keeper\'s goods: the bargaining hint, over the page');
  await page.screenshot({ path: path.join(outDir, '3-hint-shop.png') });
  await readOn(page);
  check(await page.evaluate(() => !document.querySelector('.tu-hint') && !!document.querySelector('.pm-goods') && document.activeElement?.closest('.pm-goods') !== null), 'Enter: the hint closes, the goods page keeps the focus');
  await key(page, 'Escape'); await key(page, 'Escape');
  await page.evaluate(() => window.__ui.openShop('mara'));
  await sleep(500);
  check(!(await hintTitle(page)), 'the shop\'s hint is not said twice');
  await key(page, 'Escape'); await key(page, 'Escape');
  await key(page, 'q');
  check((await until(page, () => document.querySelector('.tu-hint .pm-h')?.textContent, 4000, 'the theft\'s hint')) === t('tut.hint.steal.title'), 'the list offers a theft: the stealing hint');
  await readOn(page); await key(page, 'Escape');
  // the morning passes: the afternoon of day 1 is the eve of the bout of day 2
  check((await page.evaluate(() => window.__ui.run({ type: 'wait' }))).ok, 'the morning passes (wait)');
  await next(page);
  check((await until(page, () => document.querySelector('.tu-hint .pm-h')?.textContent, 6000, 'the eve\'s hint')) === t('tut.hint.eve.title'), 'day 1, afternoon: the eve of the first bout');
  await page.screenshot({ path: path.join(outDir, '3-hint-eve.png') });
  await key(page, ' ');
  const ch = await until(page, () => document.querySelector('.tu-guide .pm-btn.on')?.textContent ?? null, 4000, 'the chapter');
  check((ch ?? '').startsWith(t('tut.ch.prepare.title')), `Space opens its chapter: ${ch}`);
  await key(page, 'Escape');
  // the forecourt: the square's hint, its picture kept beside the quay's
  check((await page.evaluate(() => window.__ui.run({ type: 'move', to: 'forecourt' }))).ok, 'to the Arena Forecourt');
  await next(page);
  check((await until(page, () => document.querySelector('.tu-hint .pm-h')?.textContent, 15000, 'the square\'s hint')) === t('tut.hint.square.title'), 'the first square: its hint');
  await readOn(page);
  await key(page, 'h'); await key(page, 'ArrowDown'); await key(page, 'ArrowDown'); await key(page, 'ArrowDown');
  const pics = await page.evaluate(() => [...document.querySelectorAll('.tu-places figure')].map((f) => (f.querySelector('img') ? 'kept' : 'unseen')));
  check(pics.join() === 'kept,kept,unseen,unseen', `the places as they were walked: ${pics.join(', ')}`);
  await page.screenshot({ path: path.join(outDir, '4-guide-places-kept.png') });
  await key(page, 'Escape');
  // the evening
  check((await page.evaluate(() => window.__ui.run({ type: 'wait' }))).ok, 'the afternoon passes (wait)');
  await next(page);
  check((await until(page, () => document.querySelector('.tu-hint .pm-h')?.textContent, 15000, 'the evening\'s hint')) === t('tut.hint.evening.title'), 'the first evening: its hint');
  await readOn(page);
  // the next day's morning: nothing said again
  check((await page.evaluate(() => window.__ui.run({ type: 'wait' }))).ok, 'the evening passes (wait)');
  await next(page);
  await sleep(1500);
  check(!(await hintTitle(page)) && !(await page.evaluate(() => document.querySelector('.tu-band'))), 'day 2, morning: no tour, no hint said again');

  // 6. the first bout (TU-11, lot 3): day 2's afternoon, the match sheet (its two fighters read), the arena, the lessons
  check((await page.evaluate(() => window.__ui.run({ type: 'wait' }))).ok, 'the morning of day 2 passes (wait)');
  await next(page);
  await closeHints(page);
  await page.evaluate(() => window.__ui.openSkills(true));
  await sleep(600);
  const sheet = await page.evaluate(() => [...document.querySelectorAll('.pm-vs tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent.trim())));
  check(sheet.length === 8, `the match sheet's two fighters: ${sheet.map((r) => r.join(' ')).join(' | ')}`);
  await page.evaluate(() => [...document.querySelectorAll('.pm-overlay .pm-foot .pm-btn.primary')].pop()?.click());
  await sleep(300);
  const arenaAt = await page.evaluate(() => window.__go);
  check(/scene=arena/.test(arenaAt ?? '') && /tutorial=1/.test(arenaAt ?? ''), `the match sheet opens the arena: ${arenaAt}`);
  await open(page, arenaAt);
  await firstBout(page, sheet, '6');
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn.primary')?.click());
  await sleep(300);

  // 6b. the guide's « The duel »: Space forgets the lessons; the next bout says them again, Esc skips the rest
  await next(page);
  await closeHints(page);
  await key(page, 'h');
  for (let i = 0; i < 11; i++) await key(page, 'ArrowDown');
  const duelCh = await page.evaluate(() => ({ t: document.querySelector('.tu-guide section:last-child .pm-h')?.textContent, foot: document.querySelector('.tu-guide .pm-foot')?.textContent ?? '' }));
  check(duelCh.t === t('tut.ch.duel.title') && duelCh.foot.includes(t('tut.duel.again')), `the guide's « ${duelCh.t} »: Space « ${t('tut.duel.again')} »`);
  await key(page, ' ');
  const forgot = await page.evaluate(() => ({ done: document.querySelector('.tu-guide .tu-done')?.textContent ?? null, kept: localStorage.getItem('cite-du-tournoi.auto-lessons') }));
  check(forgot.done === t('tut.duel.again.done') && forgot.kept === null, `Space forgets the lessons: « ${forgot.done} »`);
  await key(page, 'Escape');
  for (let i = 0; i < 8; i++) {
    const st = await page.evaluate(() => { const s = window.__game.state(); return `${s.day}:${s.slot}`; });
    if (st === '4:afternoon') break;
    check((await page.evaluate(() => window.__ui.run({ type: 'wait' }))).ok, `${st} passes (wait)`);
    await next(page); await closeHints(page);
  }
  await page.evaluate(() => window.__ui.openSkills(true));
  await sleep(600);
  await page.evaluate(() => [...document.querySelectorAll('.pm-overlay .pm-foot .pm-btn.primary')].pop()?.click());
  await sleep(300);
  await open(page, await page.evaluate(() => window.__go));
  await page.evaluate(() => document.querySelector('.pm-overlay.pm-band .pm-btn.primary')?.click());
  const again = await until(page, () => document.querySelector('.tu-duel .pm-h')?.textContent ?? null, 6000, 'a lesson again');
  check(again === t('tut.duel.start.title'), `the next bout says the lessons again: ${again}`);
  await sleep(330); await page.keyboard.press('Escape'); await sleep(300);
  await page.evaluate(() => { window.__arena.timeScale = 3; });
  let held2 = false;
  for (let i = 0; i < 40; i++) { if (await page.evaluate(() => !!document.querySelector('.tu-duel') || window.__arena.paused)) { held2 = true; break; } await sleep(250); }
  const after2 = await page.evaluate(() => ({ t: window.__arena.auto.t, kept: JSON.parse(localStorage.getItem('cite-du-tournoi.auto-lessons') ?? '[]') }));
  check(!held2 && after2.t > 20 && after2.kept.length === 9, `Esc skipped the lessons left: none held the bout again (t ${after2.t.toFixed(1)}), all ${after2.kept.length} kept as seen`);
  await page.keyboard.press('l');
  check(!!(await until(page, () => !!document.querySelector('.pm-big'), 15000, 'the result')), '« Skip » to the result');
  await page.close();

  // 4. a game begun before, in a fresh profile: the guide's line once
  const ctx = await b.createBrowserContext();
  const p2 = await ctx.newPage();
  await prepare(p2);
  await open(p2, '?play=1&new=1&name=Old&noreload=1&tutorial=0');
  await open(p2, '?play=1&noreload=1&tutorial=1');
  await p2.evaluate(() => document.querySelector('.pm-overlay:not(.tu-hint) .pm-btn')?.click());
  check((await until(p2, () => document.querySelector('.tu-hint .pm-h')?.textContent, 6000, 'the guide\'s line')) === t('tut.hint.guide.title'), '« Continue » on a game begun before: the guide\'s line, no tour');
  check(!(await p2.evaluate(() => document.querySelector('.tu-band'))), 'no tour on a game begun before');
  await p2.screenshot({ path: path.join(outDir, '5-continue-line.png') });
  await readOn(p2);
  await open(p2, '?play=1&noreload=1&tutorial=1');
  await p2.evaluate(() => document.querySelector('.pm-overlay:not(.tu-hint) .pm-btn')?.click());
  await sleep(1200);
  check(!(await hintTitle(p2)), 'the line is said once');
  await ctx.close();

  // 5. today's game (v2=0): none of it (its pages in English whatever the language, RG-14)
  const ctx3 = await b.createBrowserContext();
  const p3 = await ctx3.newPage();
  await prepare(p3);
  await open(p3, '?play=1&new=1&name=Then&noreload=1&v2=0&tutorial=1');
  await p3.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
  await sleep(1500);
  check(!(await p3.evaluate(() => document.querySelector('.tu-band, .tu-hint'))), 'today\'s game: no tour, no hint');
  await key(p3, 'Escape');
  const menu = await p3.evaluate(() => [...document.querySelectorAll('.pm-menu .pm-body .pm-btn')].map((x) => x.textContent.trim()));
  check(menu.length > 0 && !menu.some((x) => /^Guide/.test(x)), `today's game's menu has no « Guide »: ${menu.join(' | ')}`);
  await ctx3.close();
} finally { await b.close(); await server.close(); }
check(errors === 0, `no page error (${errors})`);
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
