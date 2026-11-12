// The black curtain before every page change (the operator's rule of 2026-11-03 and his AU-07 « Appliquer la règle : le même fondu au noir avant chaque
// changement de page », built in journal Passe LC4, src/ui/curtain.ts), in a browser on a running server (DEV or production): each page logs, frame by frame,
// the curtain's opacity (.pm-curtain, or a way out's .pm-fade) and the loading screen's (#loading) into the tab's sessionStorage; the game's page changes are
// played as a player does (the title's « New game » and a name, the menu's « Quit », the title's language line, « Continue », a wait in the town: the play
// mode's go()); for each: the curtain fully down before the page leaves, the next page on its own dark ground then its loading screen at full opacity, then
// that screen lifting by a fade. MOTION=reduce emulates the system's reduced motion, which the game ignores (RG-5: the fades kept); the operator's rule asks
// for both runs.
//   node tools/curtain-proof.mjs   (BASE_URL, CHROME_PATH as tools/play-flow.mjs; MOTION=reduce|no-preference); exit 1 on a failure
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const LOG = `(() => {
  const key = '__ct', page = location.search || '/', t0 = performance.timeOrigin;
  const rows = [];
  const op = (el) => (el ? +getComputedStyle(el).opacity : -1);
  const tick = () => {
    const cs = [...document.querySelectorAll('.pm-curtain, .pm-fade')].map(op);
    rows.push([Math.round(t0 + performance.now()), cs.length ? Math.max(...cs) : 0, op(document.getElementById('loading'))]);
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
  addEventListener('pagehide', () => { try { const all = JSON.parse(sessionStorage.getItem(key) || '[]'); all.push({ page, rows }); sessionStorage.setItem(key, JSON.stringify(all)); } catch {} });
})();`;
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'], defaultViewport: { width: 1280, height: 720 } });
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const p = await b.newPage();
  if (process.env.MOTION) await p.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: process.env.MOTION }]);
  await p.evaluateOnNewDocument(LOG);
  await p.goto(`${BASE}?lang=fr`, { waitUntil: 'load' }); await p.evaluate(() => { localStorage.clear(); sessionStorage.clear(); });
  const ready = async () => { await p.waitForFunction('window.__ready === true', { timeout: 300000 }); await wait(1600); };
  const leave = async (what, act) => { const nav = p.waitForNavigation({ waitUntil: 'load', timeout: 60000 }); await act(); await nav; await ready(); console.log(`   (${what})`); };
  // 1. the title, « New game », a name, Enter: the play mode's first page
  await p.goto(`${BASE}?title=1&lang=fr&tutorial=0`, { waitUntil: 'load' }); await ready();
  await leave('title -> new game', async () => { await p.keyboard.press('Enter'); await wait(300); await p.keyboard.type('Ren'); await p.keyboard.press('Enter'); });
  // 2. the town: the menu's « Quit » back to the title
  await p.evaluate(() => document.querySelectorAll('.pm-news .pm-btn, .pm-overlay .pm-btn.primary').forEach((x) => x.click()));
  await leave('town menu -> quit to the title', async () => { await p.keyboard.press('Escape'); await wait(300); await p.evaluate(() => [...document.querySelectorAll('.pm-menu .pm-btn, .pm-overlay .pm-btn')].find((x) => /Quitter|Quit/.test(x.textContent))?.click()); });
  // 3. the title (asked: a driven browser's bare address is the night district, VD-6), its language line: French, the page reloaded behind the black
  await p.goto(`${BASE}?title=1&tutorial=0`, { waitUntil: 'load' }); await ready();
  await leave('title -> language reloaded', async () => { await p.evaluate(() => [...document.querySelectorAll('#title-screen button, #title-screen [role=button], #title-screen a')].find((x) => /Fran/.test(x.textContent))?.click()); });
  // 4. « Continue »: the town again
  await leave('title -> continue', async () => { await p.evaluate(() => [...document.querySelectorAll('#title-screen button')].find((x) => /Continu/.test(x.textContent))?.click()); });
  // 5. the town: a wait, the next moment of the day (the play mode's go(), every move between places and moments)
  await leave('town -> wait (go)', async () => { await p.evaluate(() => { document.querySelectorAll('.pm-news .pm-btn, .pm-overlay .pm-btn.primary').forEach((x) => x.click()); window.__ui.run({ type: 'wait' }); }); });
  await p.goto(`${BASE}?lang=en`, { waitUntil: 'load' });
  const all = await p.evaluate(() => JSON.parse(sessionStorage.getItem('__ct') || '[]'));
  // the tool's own navigations (page.goto) have no curtain: only the game's page changes are read
  const game = new Set(['?title=1&lang=fr&tutorial=0 -> ?play=1&new=1&name=Ren', '?play=1&new=1&name=Ren -> /', '?title=1&tutorial=0 -> ?title=1&tutorial=0', '?title=1&tutorial=0 -> ?play=1', '?play=1 -> ?play=1']);
  for (let i = 0; i + 1 < all.length; i++) {
    const a = all[i], n = all[i + 1], name = `${a.page} -> ${n.page}`;
    if (!game.has(name)) continue;
    const last = a.rows.slice(-3).map((r) => r[1]), rise = a.rows.filter((r) => r[1] > 0.02 && r[1] < 0.98).length;
    const gap = n.rows[0][0] - a.rows[a.rows.length - 1][0], born = n.rows.findIndex((r) => r[2] >= 0), shown = n.rows[born];
    const fade = n.rows.slice(born).filter((r) => r[2] > 0.001 && r[2] < 0.999).length, gone = n.rows.slice(born).findIndex((r) => r[2] < 0);
    check(last.every((x) => x >= 0.999) && rise >= 3, `${name}: the curtain down before leaving (${rise} frames of fade, last ${last.join(' / ')})`);
    check(born >= 0 && shown[2] >= 0.999 && shown[0] - n.rows[0][0] < 1500, `   ${n.page}: ${gap} ms after the last frame, ${born} frames of the page's own dark ground (${born ? shown[0] - n.rows[0][0] : 0} ms) then its loading screen at full opacity`);
    check(fade >= 3 && gone > 0, `   ${n.page}: the loading screen lifts by a fade (${fade} frames), then leaves`);
  }
  check(all.length >= 5, `${all.length} pages logged`);
} finally { await b.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
