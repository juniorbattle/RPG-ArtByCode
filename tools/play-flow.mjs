// The play mode's scene changes in a browser (journal Passe L3): a new game in the town page, the clock driven by window.__game to the day's
// bout, the arena page loaded from the save (the address the town would go to: window.__go, read with ?noreload=1), the bout decided by
// scripted inputs on window.__arena (win: the opponent brought down by a technique; lose: the player struck by heavy blows), the result
// screen's button, then the town page loaded again from the save. At the end the browser's state is replayed in Node (src/simulation, the
// same actions and the outcome the arena handed in) and both fingerprints must match.
//   node tools/play-flow.mjs <outDir> <win|lose> [seed] [day=2|3]   (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, mode, seedS = '1842', dayS = '2'] = process.argv.slice(2);
if (!outDir || !['win', 'lose'].includes(mode)) throw new Error('usage: node tools/play-flow.mjs <outDir> <win|lose> [seed] [day]');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), day = +dayS;
const READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const errors = [], actionsDone = [];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  const open = async (q) => { await page.goto(`${BASE}${q}`, { waitUntil: 'load' }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); const e = await page.evaluate(() => window.__error ?? null); check(!e, `page ${q} ready${e ? `: ${e}` : ''}`); };
  const act = async (a) => { const r = await page.evaluate((x) => window.__game.act(x), a); check(r.ok, `act ${JSON.stringify(a).slice(0, 60)}${r.ok ? '' : `: ${r.reason}`}`); if (r.ok) actionsDone.push(a); return r; };
  // 1. the town: a new game, the clock to the bout's afternoon
  await open(`?play=1&new=1&name=Aster&seed=${seedS}&vis=0&noreload=1`);
  const waits = day === 2 ? 4 : 7;
  for (let i = 0; i < waits; i++) {
    const st = await page.evaluate(() => window.__game.state());
    if (st.slot === 'afternoon' && st.tournament.matches.some((m) => m.day === st.day && !m.winner && (m.a === 'player' || m.b === 'player'))) {
      // the first bout, if the flow goes to day 3: won by a fixed result, as the named states do
      await act({ type: 'fight', outcome: { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } });
    } else await act({ type: 'wait' });
  }
  const st1 = await page.evaluate(() => window.__game.state());
  check(st1.day === day && st1.slot === 'afternoon', `day ${st1.day} ${st1.slot}: the bout's afternoon`);
  await page.screenshot({ path: path.join(outDir, `${mode}-1-town.png`) });
  // 2. « Enter the arena »: the town saves and goes to the arena page
  await page.evaluate(() => [...document.querySelectorAll('.pm-btn')].find((x) => /Enter the arena/.test(x.textContent)).click());
  const to = await page.evaluate(() => window.__go);
  check(/scene=arena/.test(to ?? ''), `the town goes to ${to}`);
  await open(to);
  const sheet = await page.evaluate(() => ({ names: [window.__arena.sim.D.fighters.ren.name, window.__arena.sim.D.fighters.marek.name], assist: window.__arena.assist, hud: document.querySelector('#ah-title')?.textContent }));
  check(sheet.names[0] === 'Aster' && sheet.names[1] === (day === 2 ? 'Vessa Lark' : 'Marek Varn'), `the arena seats ${sheet.names.join(' vs ')}`);
  check(/Pool of eight/.test(sheet.hud ?? ''), `English HUD: ${sheet.hud}`);
  await page.screenshot({ path: path.join(outDir, `${mode}-2-report.png`) });
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn').click());
  // 3. the bout, by scripted inputs, the loop stepped from here
  const won = await page.evaluate((m) => {
    const a = window.__arena, s = a.sim;
    for (let i = 0; i < 60 * 90 && !(window.__go); i++) {
      if (!s.over) {
        if (m === 'win') { if (s.f.marek.hp > 25) s.f.marek.hp = 25; if (s.f.ren.state === 'idle') { s.f.ren.ap = 5; a.action('t4'); } }
        else { s.f.ren.hp = Math.min(s.f.ren.hp, 30); if (s.f.marek.state === 'idle') s.forceAction('marek', 'm_heavy'); }
      }
      a.update(1 / 60);
      if (s.over && document.querySelector('.pm-overlay')) break;
    }
    return { over: s.over, winner: s.f.ren.state === 'down' ? 'opponent' : 'player', t: s.t };
  }, mode);
  check(won.over && won.winner === (mode === 'win' ? 'player' : 'opponent'), `the bout ends: ${won.winner} wins at ${won.t.toFixed(1)} s`);
  await page.waitForSelector('.pm-overlay .pm-btn', { timeout: 20000 });
  await page.screenshot({ path: path.join(outDir, `${mode}-3-result.png`) });
  const st2 = await page.evaluate(() => window.__game.state());
  const fight = st2.log.filter((e) => e.kind === 'match' && (e.id === 'player-won' || e.id === 'player-lost'));
  check(fight.length === (day === 2 ? 1 : 2) && fight.at(-1).id === (mode === 'win' ? 'player-won' : 'player-lost'), `the result is in the state: ${fight.at(-1)?.text}`);
  const outcome = await page.evaluate(() => window.__outcome);
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn').click());
  const back = await page.evaluate(() => window.__go);
  // 4. the town again, from the save: the end of day
  await open(back);
  const st3 = await page.evaluate(() => ({ s: window.__game.state(), h: window.__game.hash(), look: window.__app.timeOfDay }));
  check(st3.s.slot === 'evening' && st3.look === 'afternoon', `back in town: ${st3.s.slot}, the town shows ${st3.look}`);
  await page.screenshot({ path: path.join(outDir, `${mode}-4-town-dusk.png`) });
  // 5. Node replays the same actions with the arena's outcome
  const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
  try {
    const G = await server.ssrLoadModule('/src/simulation/index.ts');
    let s = G.newGame(+seedS >>> 0, 'Aster');
    for (const a of actionsDone) s = G.advance(s, a).state;
    const last = st3.s.log.findLast((e) => e.id === 'player-won' || e.id === 'player-lost');
    s = G.advance(s, { type: 'fight', outcome }).state;
    check(G.hash(s) === st3.h, `Node replay ${G.hash(s)} = browser ${st3.h} (${last?.text})`);
  } finally { await server.close(); }
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
