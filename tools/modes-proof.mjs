// The two combat modes in a browser (journal Passes CM1, CM2; the operator's CM-07 to CM-14, the sheet https://claude.ai/artifact/KKxYTXc7z2Tvm1rhwYwC6J): a version 2 game's
// bout of the first afternoon, once in each mode, through the page's interface:
//   - the skills page (K): four places in a row, the mode's switch, the catalogue; a place taken out stays free on the screen (the game keeps its skill) and Esc keeps it; a skill that
//     replaces another takes its place; Space works on a square (the training ground: the squares' talk key no longer eats it, CM-01);
//   - the match sheet and the arena's gate: the mode said, « leaving the bout counts as a defeat » said (CM-13);
//   - auto: the keys 1 to 4 do nothing, the bar shows each skill's condition and no key; manual: the keys launch the skill (a press while paused too, CM-10), the ready one is ringed,
//     « Skip » hands the rest to the plan (the auto plays on); the duel's result is the page's own and the game applies it;
//   - a bout left before its end (the page reloaded) is LOST in both modes, never wounding (CM-13).
//   node tools/modes-proof.mjs <outDir>   (DEV server: named states; BASE_URL, CHROME_PATH as play-flow; PAGE_LANG=fr, REDUCED=1, MOTION=reduce)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', LANG = process.env.PAGE_LANG || 'en', outDir = process.argv[2];
if (!outDir) throw new Error('usage: node tools/modes-proof.mjs <outDir>');
fs.mkdirSync(outDir, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let fails = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) fails++; };
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--hide-scrollbars'], protocolTimeout: 600000 });
const q = `vis=0&tutorial=0&lang=${LANG}${process.env.REDUCED ? '&reduced=1' : ''}`;
async function newPage() {
  const page = await b.newPage();
  await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  if (process.env.MOTION === 'reduce') await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  await page.setViewport({ width: 1600, height: 900 });
  page.on('pageerror', (e) => { fails++; console.log('KO  page error:', e.message); });
  return page;
}
const ready = async (page) => { await page.waitForFunction('window.__ready === true || window.__error', { timeout: 600000 }); await sleep(1500); };
const key = async (page, k, n = 1) => { for (let i = 0; i < n; i++) { await page.keyboard.press(k); await sleep(130); } };
try {
  // ---- the skills page on the training ground (a square) and on the match sheet
  let page = await newPage();
  await page.goto(`${BASE}?play=1&noreload=1&state=v2-training-morning&name=Ren&${q}`, { waitUntil: 'load', timeout: 600000 });
  await ready(page);
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
  await page.evaluate(() => { Object.assign(window.__game.state().v2.kit.levels, { k_cry: 1, k_iron: 1, k_feint: 1, m_ironfall: 1, t3: 1 }); window.__ui.openSkills(false); });
  await sleep(800);
  const slots = () => page.evaluate(() => [...document.querySelectorAll('.pm-skills .sk-slot')].map((x) => (x.classList.contains('free') ? '·' : x.querySelector('.sk-main b')?.textContent)));
  const kit = () => page.evaluate(() => window.__game.state().v2.kit);
  const s0 = await slots();
  check(s0.length === 4 && s0.every((x) => x !== '·'), `K opens four places in a row of cards: ${s0.join(', ')}`);
  check(await page.evaluate(() => !!document.querySelector('.pm-skills.pm-solo') && document.querySelectorAll('.pm-skills .sk-tile').length >= 5 && !!document.querySelector('.pm-skills .sk-mode') && !!document.querySelector('.pm-skills .sk-filters')), 'the page is the mock-up\'s: the whole width, the catalogue of tiles, the filters, the mode switch');
  await page.screenshot({ path: path.join(outDir, '1-skills-auto.png') });
  // Space on a place (on a square: CM-01): the place is free on the screen, the game keeps its skill; Esc keeps it, the page stays open
  await page.focus('[data-fk="slot:0"]');
  const k0 = (await kit()).loadout.join();
  await key(page, ' ');
  const s1 = await slots();
  check(s1[0] === '·' && (await kit()).loadout.join() === k0, `Space on a square takes a place out: free on the screen (${s1.join(', ')}), the game keeps its skill`);
  await key(page, 'Escape');
  check((await slots())[0] !== '·' && (await page.evaluate(() => !!document.querySelector('.pm-skills'))), 'Esc keeps the skill and the page stays open');
  // a skill that replaces another: a place freed, a tile placed in it (the order kept: the newcomer in the leaver's place)
  await page.focus('[data-fk="slot:1"]'); await key(page, ' ');
  const before = (await slots())[1];
  await page.evaluate(() => document.querySelector('[data-fk="tile:k_cry"]')?.focus());
  await key(page, ' ');
  const s2 = await slots();
  check(s2[1] !== before && s2.includes(await page.evaluate(() => document.querySelector('.pm-skills .sk-slot:nth-child(2) .sk-main b')?.textContent)) && (await kit()).loadout.length === 4, `a skill replaces another in its place: ${s2.join(', ')}`);
  // one ultimate at most, said on the tile and refused with its reason
  const ult = await page.evaluate(() => [...document.querySelectorAll('.pm-skills .sk-tile.warn .st')].map((x) => x.textContent));
  check(ult.length >= 1 && /\d/.test(ult[0]), `a skill that cannot come says why before any click: ${ult[0]}`);
  // the mode switch
  await page.evaluate(() => document.querySelector('[data-fk="mode"]')?.focus());
  await key(page, ' ');
  check((await kit()).mode === 'manual' && await page.evaluate(() => document.querySelectorAll('.pm-skills .sk-slot .n kbd').length === 4), 'Space on the mode switch: manual, the four places show their key');
  await page.screenshot({ path: path.join(outDir, '2-skills-manual.png') });
  await key(page, ' ');
  check((await kit()).mode === undefined, 'and back to auto: the game\'s kit holds no mode');
  await page.close();

  // ---- one bout in each mode
  for (const mode of ['auto', 'manual']) {
    page = await newPage();
    await page.goto(`${BASE}?play=1&noreload=1&state=v2-day2-afternoon&name=Ren&${q}`, { waitUntil: 'load', timeout: 600000 });
    await ready(page);
    await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
    await page.evaluate((m) => { window.__game.act({ type: 'setMode', mode: m }); window.__ui.openMatchSheet(); }, mode);
    await sleep(800);
    check(await page.evaluate((m) => document.querySelector('.sk-mode')?.getAttribute('aria-pressed') === String(m === 'manual'), mode), `${mode}: the match sheet's switch says the mode`);
    const sheet = await page.evaluate(() => ({ caps: document.querySelectorAll('.pm-skills .sk-slot .n kbd').length, chips: document.querySelectorAll('.pm-skills .sk-slot .chip').length, text: document.querySelector('.pm-skills')?.textContent ?? '' }));
    check(mode === 'manual' ? sheet.caps === 4 && sheet.chips === 0 : sheet.caps === 0 && sheet.chips === 4, `${mode}: the places show ${mode === 'manual' ? 'their key and no condition' : 'their condition and no key'}`);
    if (mode === 'manual') check(/rehearsal plays your plan, not your hand|répétition joue votre plan, pas votre main/.test(sheet.text) || !/rehearsal|répétition/i.test(sheet.text), 'manual: the sheet says the rehearsal plays the plan (when a rehearsal is on it)');
    await page.screenshot({ path: path.join(outDir, `3-sheet-${mode}.png`) });
    await key(page, 'Enter');
    const to = await page.evaluate(() => window.__go);
    check(/scene=arena/.test(to ?? ''), `${mode}: Enter on the sheet enters the arena: ${to}`);
    await page.goto(new URL(to, `${BASE}`).href, { waitUntil: 'load', timeout: 600000 });
    await ready(page);
    const gate = await page.evaluate(() => document.querySelector('.pm-overlay')?.textContent ?? '');
    check(/defeat|défaite/.test(gate) && new RegExp(mode === 'manual' ? 'Manual|Manuel' : 'Auto').test(gate), `${mode}: the gate says the mode and that leaving the bout is a defeat`);
    await key(page, 'Enter');
    await sleep(600);
    const a = await page.evaluate(() => ({ hand: !!window.__arena.auto.fighters.ren.hand, hudHand: document.querySelector('#arena-hud')?.classList.contains('hand') ?? false, caps: document.querySelectorAll('#ah-bar .ah-b.slot .ord kbd').length, conds: document.querySelectorAll('#ah-bar .ah-b.slot .cond').length, pending: window.__game.state().v2.$pending?.outcome?.winner ?? null }));
    check(a.hand === (mode === 'manual') && a.hudHand === (mode === 'manual'), `${mode}: Ren is ${mode === 'manual' ? 'a hand fighter, the bar in its manual form' : 'the plan\'s, the bar in its auto form'}`);
    check(mode === 'manual' ? a.caps === 4 && a.conds === 0 : a.caps === 0 && a.conds === 4, `${mode}: the bar shows ${mode === 'manual' ? 'the four keys' : 'the four conditions'}`);
    check(a.pending === 'opponent', 'the result written when the fight starts is a defeat (CM-13)');
    await sleep(4000);
    const n0 = await page.evaluate(() => window.__arena.presses.length);
    await key(page, '1');
    const n1 = await page.evaluate(() => window.__arena.presses.length);
    check(mode === 'manual' ? n1 === n0 + 1 : n1 === n0, `${mode}: the key 1 ${mode === 'manual' ? 'is a press' : 'does nothing (no semi-automatic)'}`);
    if (mode === 'manual') {
      const first = await page.evaluate(() => window.__arena.auto.fighters.ren.skills[0].id);
      await sleep(5000);
      const launched = await page.evaluate((id) => window.__arena.auto.result.log.some((e) => e.who === 'ren' && e.ev === 'charge' && e.act === id), first);
      check(launched, 'manual: the skill pressed leaves');
      // a press while the bout is paused is taken too (CM-10)
      await page.evaluate(() => { window.__arena.paused = true; });
      await key(page, '2');
      check(await page.evaluate(() => window.__arena.presses.length === 2), 'manual: a press in the pause is taken (the tactical pause)');
      await page.evaluate(() => { window.__arena.paused = false; });
      check(await page.evaluate(() => document.querySelector('#ah-bar .ah-b.ctl[data-act="skip"] em')?.textContent?.length > 0), 'manual: « Skip » says that the auto plays on');
    }
    await page.screenshot({ path: path.join(outDir, `4-arena-${mode}.png`) });
    // « Skip »: the result, then the game applies it and the pending result goes
    await key(page, 'l');
    await page.waitForFunction(() => window.__outcome, { timeout: 120000 }).catch(() => null);
    await sleep(800);
    const done = await page.evaluate(() => ({ outcome: window.__outcome ?? null, pending: window.__game.state().v2.$pending ?? null }));
    check(!!done.outcome && done.pending === null, `${mode}: « Skip » reaches the result (${done.outcome?.winner}), the game applies it, the pending defeat is gone`);
    await page.close();
  }

  // ---- a bout left before its end is lost, in both modes (CM-13)
  for (const mode of ['auto', 'manual']) {
    page = await newPage();
    await page.goto(`${BASE}?play=1&noreload=1&state=v2-day2-afternoon&name=Ren&${q}`, { waitUntil: 'load', timeout: 600000 });
    await ready(page);
    await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
    await page.evaluate((m) => { window.__game.act({ type: 'setMode', mode: m }); window.__ui.openMatchSheet(); }, mode);
    await sleep(500); await key(page, 'Enter');
    const to = await page.evaluate(() => window.__go);
    await page.goto(new URL(to, BASE).href, { waitUntil: 'load', timeout: 600000 });
    await ready(page);
    await key(page, 'Enter'); await sleep(3000);
    // the page is left (reloaded to the town) before the K.O.
    await page.goto(`${BASE}?play=1&noreload=1&${q}`, { waitUntil: 'load', timeout: 600000 });
    await ready(page);
    const st = await page.evaluate(() => window.__game.state());
    const m = st.tournament.matches.find((x) => x.day === 2 && (x.a === 'player' || x.b === 'player'));
    check(!!m && m.winner && m.winner !== 'player' && !st.v2.$pending, `${mode}: the bout left is lost (${m?.winner}), nothing pending`);
    check(!JSON.stringify(st.player).includes('wound'), `${mode}: a left bout never wounds`);
    await page.close();
  }
} finally { await b.close(); }
console.log(fails ? `${fails} check(s) failed` : 'all checks passed');
process.exit(fails ? 1 : 0);
