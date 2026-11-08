// Lot L5 of step 5, « la ville qui réagit », played in a browser (journal Passe EVL9; the operator's EV-12 « Les places lisent le pouls, la célébrité compte »,
// journal Passe EV2): a version 2 game built in Node by the game's own actions (the named states of src/simulation/named.ts), kept in the browser's save, its
// pages opened from it, every step taken through the page's interface (`__ui.run`, as a player does), what the page shows read in its DOM and its scene; Node
// replays the browser's actions and must find the same fingerprint.
//   watch: caught stealing at Hilde's on the first morning (seed 1): the forecourt that afternoon, Wynn of the watch standing by her stall and talked to there,
//          the theft barred; the next morning the theft refused with Wynn's reason; the quay without Wynn that day; the day after, Wynn back at the barrier;
//   quay:  caught at Mara's (seed 1842): the quay that afternoon, Wynn standing by Mara's stall, Sergeant Hale saying where his man is;
//   hails: a famous player on day 7's morning at the training ground: the square's crowd as the state counts it, a walker greeting the hero as he comes near,
//          its words over its head, Orla Brask raising a hand, a passer-by spoken to; then the quay, a walker greeting there too.
//   node tools/town-flow.mjs <outDir> <watch|quay|hails>   (BASE_URL: a DEV server, 5173 by default; W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/play-flow.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, kind] = process.argv.slice(2);
if (!outDir || !['watch', 'quay', 'hails'].includes(kind)) throw new Error('usage: node tools/town-flow.mjs <outDir> <watch|quay|hails>');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const G = await server.ssrLoadModule('/src/simulation/index.ts');
const RE = await server.ssrLoadModule('/src/simulation/v2react.ts');
const { tx } = await server.ssrLoadModule('/src/narrative/text/index.ts');
const s0 = G.namedState(kind === 'watch' ? 'v2-watch-forecourt' : kind === 'quay' ? 'v2-watch-quay' : 'v2-famous-training');
const saved = G.serialize(s0);
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const errors = [], done = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  await page.goto(`${BASE}?vis=0`, { waitUntil: 'domcontentloaded', timeout: READY });
  await page.evaluate((t) => localStorage.setItem('cite-du-tournoi.save', t), saved);
  const open = async (q) => { await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); const e = await page.evaluate(() => window.__error ?? null); check(!e, `page ${q} ready${e ? `: ${e}` : ''}`);
    await page.waitForFunction(() => { const l = document.querySelector('#loading'); return !l || +getComputedStyle(l).opacity === 0; }, { timeout: 10000 }).catch(() => {}); };
  // a page of the game: its news read and closed
  const openTown = async () => { await open('?play=1&vis=0&noreload=1'); await page.evaluate(() => { const o = document.querySelector('.pm-overlay'); o?.querySelector('.pm-btn')?.click(); }); await sleep(300); };
  const run = async (a) => { const r = await page.evaluate((x) => window.__ui.run(x), a); check(r.ok, `run ${JSON.stringify(a).slice(0, 70)}${r.ok ? '' : `: ${r.reason}`}`); if (r.ok) done.push(a); return r; };
  const talk = async (who) => { const t = await page.evaluate((w) => { window.__ui.openPerson(w); return document.querySelector('.pm-talk')?.textContent ?? ''; }, who); done.push({ type: 'talk', who }); return t; };
  const closeBand = () => page.keyboard.press('Escape');
  /** the list (Q): a steal's button, its state and its words */
  const stealButton = (rx) => page.evaluate((src) => { window.__ui.openHere(); const x = [...document.querySelectorAll('.pm-talk .pm-btn')].find((e) => new RegExp(src).test(e.textContent)); const r = { found: !!x, off: !!x?.disabled, text: x?.textContent ?? '' }; return r; }, rx);
  const guardOnQuay = () => page.evaluate(() => { const a = window.__app.actors.actors, w = a.find((x) => (x.base ?? x.spec) === 'guardB'), m = a.find((x) => (x.base ?? x.spec) === 'merchant'); return { hidden: !!w?.hidden, x: w?.pos.x, z: w?.pos.z, fromMara: w && m ? Math.hypot(w.pos.x - m.pos.x, w.pos.z - m.pos.z) : null }; });

  if (kind === 'watch') {
    await openTown();
    const st = await page.evaluate(() => ({ people: window.__stats().people, spot: window.__plaza.spotOf('wynn'), hilde: window.__plaza.spotOf('hilde'), place: window.__game.state().place, slot: window.__game.state().slot }));
    check(st.place === 'forecourt' && st.slot === 'afternoon' && !!st.spot && Math.hypot(st.spot[0] - st.hilde[0], st.spot[1] - st.hilde[1]) < 2.2, `Wynn standing by Hilde's stall: ${JSON.stringify(st)}`);
    await page.evaluate((p) => window.__plaza.posePlayer(p[0] - 1.2, p[1] + 2.4, 'up'), st.spot);
    await sleep(400);
    await page.screenshot({ path: path.join(outDir, 'watch-0-forecourt.png') });
    const w = await talk('wynn');
    check(w.includes(tx('v2.line.wynn.posted', { name: 'Hilde' })), `Wynn's words: ${JSON.stringify(w.slice(0, 140))}`);
    await page.screenshot({ path: path.join(outDir, 'watch-1-wynn.png') });
    await closeBand();
    const barred = await stealButton('Steal');
    check(barred.found && barred.off && barred.text.includes(tx('v2.shop.barred')), `the theft at Hilde's barred today: ${JSON.stringify(barred.text.slice(0, 140))}`);
    await closeBand();
    await run({ type: 'wait' }); await openTown();
    await run({ type: 'wait' }); await openTown();
    const st2 = await page.evaluate(() => ({ day: window.__game.state().day, slot: window.__game.state().slot, spot: window.__plaza.spotOf('wynn') }));
    check(st2.day === 2 && st2.slot === 'morning' && !!st2.spot, `day 2's morning, Wynn still there: ${JSON.stringify(st2)}`);
    const watched = await stealButton('Steal');
    check(watched.found && watched.off && watched.text.includes(tx('v2.steal.watched', { name: 'Hilde' })), `the theft refused, Wynn's reason said: ${JSON.stringify(watched.text.slice(0, 160))}`);
    await page.screenshot({ path: path.join(outDir, 'watch-2-refused.png') });
    await closeBand();
    await run({ type: 'move', to: 'district' }); await openTown();
    const away = await guardOnQuay();
    const offered = await page.evaluate(() => window.__game.actions().some((o) => o.action.type === 'talk' && o.action.who === 'wynn'));
    check(away.hidden && !offered, `the quay without Wynn that day: ${JSON.stringify(away)}, talk offered ${offered}`);
    // day 2's bout (Vessa Lark) decided as the named states decide one, then the night: day 3's morning on the quay
    await run({ type: 'wait' }); await openTown();
    await run({ type: 'fight', outcome: { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } }); await openTown();
    await run({ type: 'wait' }); await openTown();
    const back = await guardOnQuay();
    const st3 = await page.evaluate(() => ({ day: window.__game.state().day, slot: window.__game.state().slot }));
    check(st3.day === 3 && !back.hidden && back.fromMara > 5, `day ${st3.day} ${st3.slot}: Wynn back at the barrier ${JSON.stringify(back)}`);
  } else if (kind === 'quay') {
    await openTown();
    const g = await guardOnQuay();
    check(!g.hidden && g.fromMara < 1.8, `Wynn by Mara's stall: ${JSON.stringify(g)}`);
    await page.evaluate((p) => { const pl = window.__app.actors.player; pl.pos.set(p.x - 2.2, 0, p.z + 1.4); }, g);
    await sleep(1200);
    await page.screenshot({ path: path.join(outDir, 'quay-0-wynn.png') });
    const hale = await talk('hale');
    check(hale.includes(tx('v2.line.hale.posted', { name: 'Mara' })), `Hale says where his man is: ${JSON.stringify(hale.slice(0, 160))}`);
    await closeBand();
    const w = await talk('wynn');
    check(w.includes(tx('v2.line.wynn.posted', { name: 'Mara' })), `Wynn's words at the stall: ${JSON.stringify(w.slice(0, 140))}`);
    await closeBand();
    const barred = await stealButton('Steal');
    check(barred.found && barred.off, `the theft at Mara's refused: ${JSON.stringify(barred.text.slice(0, 160))}`);
    await closeBand();
  } else {
    await openTown();
    const st = await page.evaluate(() => window.__game.state());
    const crowd = await page.evaluate(() => window.__plaza.people.filter((a) => a.role === 'crowd').length);
    check(crowd === RE.plazaCrowd(st), `the square's crowd: ${crowd} walkers, the state counts ${RE.plazaCrowd(st)} (excitement ${st.pulse.excitement}, fame ${st.pulse.playerFame}: ${RE.fameTier(st)})`);
    // walk up to a walker: the hero set beside it, the scene stepping on
    const near = async (sel) => page.evaluate((s) => { const P = window.__plaza, a = s === 'crowd' ? P.people.find((x) => x.role === 'crowd' && !x.hidden) : null; const at = a ? [a.pos.x, a.pos.z] : P.spotOf(s); P.posePlayer(at[0] + 1.5, at[1] + 0.3, 'side'); return at; }, sel);
    await near('crowd');
    await page.waitForFunction(() => window.__hails.played.length > 0, { timeout: 8000 }).catch(() => {});
    await sleep(350);
    const h = await page.evaluate(() => ({ played: window.__hails.played, shown: window.__hails.shown(), tags: [...document.querySelectorAll('.pm-hail')].map((t) => ({ text: t.textContent, op: +getComputedStyle(t).opacity })) }));
    const first = h.played[0], want = first ? RE.hailOf(st, first.key, 0) : null;
    check(!!first && first.kind === 'hail' && first.text === want?.text, `a walker greets the hero: ${JSON.stringify(first)} (the state says ${JSON.stringify(want)})`);
    check(h.tags.some((t) => t.text === first?.text), `its words over its head: ${JSON.stringify(h.tags)}`);
    check(new Set(h.tags.map((t) => t.text)).size === h.tags.length, 'two walkers side by side say different words');
    await page.screenshot({ path: path.join(outDir, 'hails-0-greet.png') });
    await sleep(3400);
    await near('orla');
    await page.waitForFunction(() => window.__hails.played.some((p) => p.key === 'orla'), { timeout: 8000 }).catch(() => {});
    await sleep(350);
    const o = await page.evaluate(() => window.__hails.played.find((p) => p.key === 'orla') ?? null);
    check(!!o && o.kind === 'hail' && o.text === RE.gestureOf(st, 'orla')?.text, `Orla Brask raises a hand: ${JSON.stringify(o)}`);
    await page.screenshot({ path: path.join(outDir, 'hails-1-orla.png') });
    const folk = await talk('folk');
    check(folk.includes(tx('v2.line.folk.celebrated', { name: st.player.name })), `a passer-by spoken to: ${JSON.stringify(folk.slice(0, 160))}`);
    await page.screenshot({ path: path.join(outDir, 'hails-2-folk.png') });
    await closeBand();
    await run({ type: 'move', to: 'district' }); await openTown();
    await page.evaluate(() => { const A = window.__app.actors, a = A.actors.find((x) => x.role === 'crowd'); A.player.pos.set(a.pos.x + 1.0, 0, a.pos.z + 0.6); });
    await page.waitForFunction(() => window.__hails.played.length > 0, { timeout: 8000 }).catch(() => {});
    await sleep(350);
    const q = await page.evaluate(() => window.__hails.played[0] ?? null);
    const st2 = await page.evaluate(() => window.__game.state());
    check(!!q && q.text === RE.hailOf(st2, q.key, 0)?.text, `on the quay a walker greets too: ${JSON.stringify(q)}`);
    await page.screenshot({ path: path.join(outDir, 'hails-3-quay.png') });
  }
  const h = await page.evaluate(() => window.__game.hash());
  let s = G.deserialize(saved);
  for (const a of done) { const r = G.advance(s, a); if (!r.ok) check(false, `Node refuses ${a.type}: ${r.reason}`); s = r.state; }
  check(G.hash(s) === h, `Node replay ${G.hash(s)} = browser ${h} (${done.length} actions)`);
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); await server.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
