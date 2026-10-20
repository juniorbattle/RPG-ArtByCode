// The first day played in the town page (journal Passe L4): a new game; at the keyboard, the hero placed by Mara's stall and E pressed must
// open her dialogue (portrait, words, her shop); then the day through window.__game (the steel cargo: Tam, Hale, the haul; the forecourt:
// the roll, sparring with Orla; the evening), each slot change saved and the page reloaded from the save, the state's fingerprint kept; the
// second morning reached. Node replays the same actions: same fingerprint.
//   node tools/play-day.mjs <outDir> [seed]   (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, seedS = '1842'] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/play-day.mjs <outDir> [seed]');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
let failed = 0, errors = 0;
const done = [];
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  const open = async (q) => { await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); check(!(await page.evaluate(() => window.__error ?? null)), `page ${q} ready`); await new Promise((r) => setTimeout(r, 1200)); await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click()); };
  await open(`?play=1&new=1&name=Aster&seed=${seedS}&vis=0&noreload=1`);
  // 1. the keyboard: next to Mara, E opens her dialogue
  await page.evaluate(() => { const A = window.__app, m = A.actors.actors.find((a) => (a.base ?? a.spec) === 'merchant'); A.actors.player.pos.set(m.pos.x + 0.9, 0, m.pos.z + 0.6); });
  // a software renderer draws about one frame a second: wait for the prompt to know who stands there
  await page.waitForFunction("window.__ui.near === 'mara'", { timeout: 120000 }).catch(() => {});
  await page.keyboard.press('e');
  await page.waitForSelector('.pm-overlay .pm-dlg', { timeout: 20000 }).catch(() => {});
  const dlg = await page.evaluate(() => { const d = document.querySelector('.pm-overlay .pm-dlg'); return d ? { name: d.querySelector('h2')?.textContent, words: d.querySelectorAll('q').length, img: !!d.querySelector('img'), options: document.querySelectorAll('.pm-overlay .pm-btn').length } : null; });
  check(dlg?.name === 'Mara' && dlg.words > 0 && dlg.img && dlg.options >= 4, `E next to Mara opens her dialogue: ${JSON.stringify(dlg)}`);
  await page.screenshot({ path: path.join(outDir, 'day1-mara-dialogue.png') });
  await page.keyboard.press('Escape');
  if (dlg) done.push({ type: 'talk', who: 'mara' });
  // 2. the day, through the game API; each reload goes through the save
  const steps = [{ type: 'talk', who: 'tam' }, { type: 'talk', who: 'hale' }, { type: 'askPapers' }, { type: 'haul' },
    { type: 'move', to: 'forecourt' }, { type: 'talk', who: 'odo' }, { type: 'register' }, { type: 'talk', who: 'orla' }, { type: 'spar' },
    { type: 'move', to: 'district' }, { type: 'wait' }];
  for (const a of steps) {
    const r = await page.evaluate((x) => window.__game.act(x), a);
    check(r.ok, `act ${JSON.stringify(a)}${r.ok ? '' : `: ${r.reason}`}`);
    if (!r.ok) continue;
    done.push(a);
    if (r.reload) {
      const h = await page.evaluate(() => window.__game.hash()), to = await page.evaluate(() => { const g = window.__game.state(); return g; });
      await open('?play=1&vis=0&noreload=1');
      check(await page.evaluate(() => window.__game.hash()) === h, `reloaded from the save (day ${to.day} ${to.slot}, ${to.place}): same state`);
    }
  }
  const st = await page.evaluate(() => window.__game.state());
  check(st.day === 2 && st.slot === 'morning', `the second morning: day ${st.day} ${st.slot}`);
  check(st.quests.cargo === 'delivered' && st.facts.includes('orla-recruitable'), `the cargo delivered (${st.quests.cargo}), Orla a friend (${st.facts.includes('orla-recruitable')})`);
  const ui = await page.evaluate(() => ({ clock: document.querySelector('#pm-status .clock')?.textContent, next: document.querySelector('#pm-status .next')?.textContent }));
  check(/Day 2 \/ 3 · morning/i.test(ui.clock ?? '') && /Vessa Lark/.test(ui.next ?? ''), `the clock and the next deadline: ${ui.clock} — ${ui.next}`);
  await page.screenshot({ path: path.join(outDir, 'day2-morning.png') });
  const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
  try {
    const G = await server.ssrLoadModule('/src/simulation/index.ts');
    let s = G.newGame(+seedS >>> 0, 'Aster');
    for (const a of done) s = G.advance(s, a).state;
    check(G.hash(s) === await page.evaluate(() => window.__game.hash()), `Node replay ${G.hash(s)} = browser`);
  } finally { await server.close(); }
  check(errors === 0, `no page error (${errors})`);
} finally { await b.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
