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
// V2=1: a version 2 game (&v2=1, its flag in the save and the Node replay, journal Passe V0)
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000), V2 = process.env.V2 === '1';
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
  await open(`?play=1&new=1&name=Aster&seed=${seedS}&vis=0&noreload=1${V2 ? '&v2=1' : ''}`);
  check((await page.evaluate(() => window.__game.state().flags.v2 ?? null)) === (V2 ? true : null), `the version 2's flag: ${V2 ? 'on' : 'absent'}`);
  // 1. the keyboard: next to Mara, E opens her dialogue
  await page.evaluate(() => { const A = window.__app, m = A.actors.actors.find((a) => (a.base ?? a.spec) === 'merchant'); A.actors.player.pos.set(m.pos.x + 0.9, 0, m.pos.z + 0.6); });
  // a software renderer draws about one frame a second: wait for the prompt to know who stands there
  await page.waitForFunction("window.__ui.near === 'mara'", { timeout: 120000 }).catch(() => {});
  await page.keyboard.press('e');
  await page.waitForSelector('.pm-talk .pm-dlg', { timeout: 20000 }).catch(() => {});
  const dlg = await page.evaluate(() => { const d = document.querySelector('.pm-talk .pm-dlg'); // the person's words stand beside the portrait since direction A « Voile » (journal Passe UM1; before it, in the parchment under its row: this check counted the row's own,
  // always 0, until journal Passe V0)
  return d ? { name: d.querySelector('h2')?.firstChild?.textContent, words: document.querySelectorAll('.pm-talk .pm-line q').length, img: !!d.querySelector('img'), options: document.querySelectorAll('.pm-talk .pm-btn').length } : null; });
  check(dlg?.name === 'Mara' && dlg.words > 0 && dlg.img && dlg.options >= 3, `E next to Mara opens her dialogue: ${JSON.stringify(dlg)}`);
  await page.screenshot({ path: path.join(outDir, 'day1-mara-dialogue.png') });
  if (dlg) done.push({ type: 'talk', who: 'mara' });
  // 1b. her goods at the keyboard (journal Passe UM9): the first line opens the page, the arrows walk it and the detail follows, Enter buys and the page stays, Esc goes back to her
  await page.keyboard.press('Enter');
  await page.waitForSelector('.pm-wares .pm-btn.on', { timeout: 20000 }).catch(() => {});
  const seen = () => page.evaluate(() => ({ on: document.querySelector('.pm-glist .pm-btn.on span')?.firstChild?.textContent, name: document.querySelector('.pm-detail .nm')?.textContent, cmp: document.querySelector('.pm-cmp')?.textContent ?? '', purse: document.querySelector('.pm-purse b')?.textContent, news: document.querySelector('.pm-detail .news')?.textContent ?? '', hero: !!document.querySelector('.pm-hero') }));
  const first = await seen();
  check(!!first.on && first.on === first.name && first.hero, `the goods: ${JSON.stringify(first)}`);
  let line = first;
  for (let i = 0; i < 6 && line.on !== 'Whetstone'; i++) { await page.keyboard.press('ArrowDown'); line = await seen(); }
  check(line.name === 'Whetstone' && /Heavy blow/.test(line.cmp) && /Coins/.test(line.cmp), `the arrows reach the whetstone, the detail with them: ${JSON.stringify(line)}`);
  await page.screenshot({ path: path.join(outDir, 'day1-mara-goods.png') });
  const coins = await page.evaluate(() => window.__game.state().player.coins);
  await page.keyboard.press('Enter');
  const after = await seen(), st0 = await page.evaluate(() => window.__game.state());
  check(st0.player.coins === coins - 8 && st0.player.items.includes('whetstone') && after.purse === String(coins - 8) && /whetstone/i.test(after.news), `Enter buys it, the page stays and says so: ${JSON.stringify(after)}`);
  done.push(V2 ? { type: 'shopBuy', shop: 'mara', item: 'whetstone' } : { type: 'buy', item: 'whetstone' });
  await page.keyboard.press('Escape');
  await page.waitForSelector('.pm-talk .pm-dlg', { timeout: 20000 }).catch(() => {});
  check(await page.evaluate(() => !document.querySelector('.pm-wares') && !!document.querySelector('.pm-talk .pm-dlg')), 'Esc goes back to Mara');
  done.push({ type: 'talk', who: 'mara' });
  await page.keyboard.press('Escape');
  // 2. the day, through the game API; each reload goes through the save
  const steps = [{ type: 'talk', who: 'tam' }, { type: 'talk', who: 'hale' }, { type: 'askPapers' }, { type: 'haul' },
    { type: 'move', to: 'forecourt' }, { type: 'talk', who: 'odo' }, { type: 'register' },
    // the version 2: Orla drills at the training ground (lot V5)
    ...(V2 ? [{ type: 'move', to: 'training' }] : []), { type: 'talk', who: 'orla' }, { type: 'spar' },
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
  const ui = await page.evaluate(() => ({ clock: document.querySelector('#pm-status .clock')?.textContent, where: document.querySelector('#pm-status .where')?.textContent, next: document.querySelector('#pm-status .next')?.textContent }));
  check(new RegExp(`Day 2 / ${V2 ? 10 : 3}`, 'i').test(ui.clock ?? '') && /morning/i.test(ui.where ?? '') && /Vessa Lark/.test(ui.next ?? ''), `the clock and the next deadline: ${ui.clock} · ${ui.where} — ${ui.next}`);
  await page.screenshot({ path: path.join(outDir, 'day2-morning.png') });
  const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
  try {
    const G = await server.ssrLoadModule('/src/simulation/index.ts');
    let s = G.newGame(+seedS >>> 0, 'Aster');
    if (V2) G.makeV2(s);
    for (const a of done) s = G.advance(s, a).state;
    check(G.hash(s) === await page.evaluate(() => window.__game.hash()), `Node replay ${G.hash(s)} = browser`);
  } finally { await server.close(); }
  check(errors === 0, `no page error (${errors})`);
} finally { await b.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
