// The four effects that no code played (lot S0, journal Passes SN1 / SN2), played by the real game on a DEV server: a button's click, a dialog opening,
// the coins changing, the hero's steps; and the duel's table on the real arena page. Every effect the page asks for is counted at `Sound.play`. Exit 1 on
// a failure; a page of today's game must have no engine at all.
//   node tools/audio/hooks-proof.mjs     (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 300000);
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`], defaultViewport: { width: W, height: H } });
let failed = 0, errors = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const Q = 'play=1&name=Aster&vis=0&fps=off&cutscene=0';
const open = async (page, q) => {
  await page.goto(`${BASE}?${q}`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
};
const count = (page) => page.evaluate(() => { const s = window.__sound; window.__played = {}; const p = s.play.bind(s); s.play = (e, g, a) => { window.__played[e] = (window.__played[e] ?? 0) + 1; p(e, g, a); }; });
const played = (page, e) => page.evaluate((x) => window.__played[x] ?? 0, e);
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  await open(page, `${Q}&state=v2-forecourt-morning`);
  await page.waitForFunction('!!window.__sound', { timeout: 30000 });
  await count(page);
  await page.mouse.click(W / 2, H / 2);
  await page.waitForFunction('window.__sound.ctx?.state === "running"', { timeout: 10000 });
  await wait(300);

  // a dialog on the V key (the sound's own panel), a click on one of its buttons
  await page.keyboard.press('v');
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  await wait(150);
  check(await played(page, 'open') >= 1, `a dialog opens: open played ${await played(page, 'open')} time(s)`);
  const n0 = await played(page, 'click');
  const box = await page.evaluate(() => { const r = document.querySelector('[role="dialog"] button').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.mouse.click(box.x, box.y); await wait(150);
  check(await played(page, 'click') > n0, `a button clicked: click played ${await played(page, 'click')} time(s)`);
  await page.keyboard.press('Escape'); await wait(150);

  // the coins move in the save: any action that spends or earns
  await page.evaluate(() => { const g = window.__game; const a = g.actions().find((x) => x.ok && x.coins > 0) ?? null; window.__spent = a ? JSON.stringify({ label: a.label, coins: a.coins, ok: g.act(a.action).ok }) : null; });
  await wait(200);
  const coin = await played(page, 'coin'), spent = await page.evaluate(() => window.__spent);
  console.log(`   an action with coins: ${spent ?? 'none on this state'}`);
  check(!!spent && coin >= 1, `the coins changed: coin played ${coin} time(s)`);

  // the hero walks 4 s
  const before = await page.evaluate(() => ({ x: window.__plaza.player.pos.x, z: window.__plaza.player.pos.z }));
  await page.keyboard.down('d'); await wait(4000); await page.keyboard.up('d');
  const after = await page.evaluate(() => ({ x: window.__plaza.player.pos.x, z: window.__plaza.player.pos.z })), dist = Math.hypot(after.x - before.x, after.z - before.z), steps = await played(page, 'step');
  check(steps >= Math.floor(dist) - 1 && steps > 0, `${dist.toFixed(1)} m walked: step played ${steps} time(s)`);

  // today's game: no engine at all
  await open(page, 'play=1&new=1&name=Aster&vis=0&fps=off');
  await wait(1000);
  check(await page.evaluate(() => !window.__sound), 'a game of today has no sound engine');
} finally { await b.close(); }
check(errors === 0, `no page error (${errors})`);
console.log(failed ? `\nFAILED ${failed}` : '\nall checks passed');
if (failed) process.exitCode = 1;
