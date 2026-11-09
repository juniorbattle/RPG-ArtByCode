// The attack button clicked in a row, in a browser (journal Passe DB1, the operator's report of 2026-11-09, word for word: « j'ai aussi remarque
// un bug lorsque j'ai clique plusieurs fois sur le bouton attaque rapide.... l'action est devenu comme bloque et les attaques simples se
// repetaient sans arret, faisant en sorte que plus aucune touche fonctionner »). On a running server, the arena page's version 2 duel
// (`?scene=arena`, VD-4): the HUD's attack button clicked N times with the real mouse (pointer down 40 ms, up, 80 ms apart) while the page's own
// loop runs, then K held: when the guard rises, and when the last light attack left. The opponent is held off for the measure (his first
// sequence never starts), then a second round with him live reports its numbers.
//   node tools/attack-spam-proof.mjs [clicks] ["<extra query>"]      (BASE_URL, CHROME_PATH as tools/arena-scene-check.mjs; exit 1 when a light
//   attack leaves more than 0.7 s after the last click or the guard rises more than 1.2 s after it)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const N = +(process.argv[2] || 12), extra = process.argv[3] ?? '';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = 1280, H = 720;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H } });
let failed = false;
try {
  const page = await b.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  await page.goto(`${BASE}?scene=arena${extra ? '&' + extra : ''}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: 300000 });
  const err = await page.evaluate(() => window.__error); if (err) throw new Error(err);
  const box = await page.evaluate(() => { const r = document.querySelector('#ah-bar [data-act="attack"]').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  for (const live of [false, true]) {
    // a fresh duel; the record: every light attack leaving and the guard rising, on the duel's clock
    await page.evaluate((live) => {
      const A = window.__arena; A.restart(); if (!live) A.dyn.f.marek.aiWait = 1e9;
      const rec = (window.__spam = { lights: [], guard: -1, last: -1, waits: 0 });
      if (!A.__spamHooked) { A.__spamHooked = true; const d = A.charge.drain.bind(A.charge); A.charge.drain = () => { const e = d(); for (const x of e) { if (x.type === 'chargeRelease') window.__spam.lights.push(+A.dyn.t.toFixed(3)); if (x.type === 'chargeWait') window.__spam.waits++; if (x.type === 'guardUp' && x.who === 'ren' && window.__spam.last >= 0 && window.__spam.guard < 0) window.__spam.guard = +A.dyn.t.toFixed(3); } return e; }; }
    }, live);
    await sleep(400);
    for (let k = 0; k < N; k++) { await page.mouse.move(box.x, box.y); await page.mouse.down(); await sleep(40); await page.mouse.up(); await sleep(80); }
    await page.evaluate(() => { window.__spam.last = +window.__arena.dyn.t.toFixed(3); });
    await page.keyboard.down('k');
    await page.waitForFunction('window.__spam.guard >= 0', { timeout: 20000 }).catch(() => {});
    await sleep(300);
    await page.keyboard.up('k');
    const r = await page.evaluate(() => ({ ...window.__spam, ren: window.__arena.dyn.f.ren.state }));
    const after = r.lights.filter((t) => t > r.last), lastLight = after.length ? +(after.at(-1) - r.last).toFixed(2) : 0, guard = r.guard >= 0 ? +(r.guard - r.last).toFixed(2) : null;
    const row = { opponent: live ? 'live' : 'held off', clicks: N, clicksSecs: r.last, lightAttacks: r.lights.length, waits: r.waits, lightsAfterLastClick: after.length, lastLightAfterClick: lastLight, guardRoseAfter: guard };
    console.log(JSON.stringify(row));
    if (!live && (lastLight > 0.7 || guard === null || guard > 1.2)) { failed = true; console.log('FAIL: the attack piles up (a light attack or the guard too late after the last click)'); }
  }
  if (errors.length) { failed = true; console.log(errors.join('\n')); }
  console.log(failed ? 'FAIL' : 'PASS');
} finally { await b.close(); }
process.exit(failed ? 1 : 0);
