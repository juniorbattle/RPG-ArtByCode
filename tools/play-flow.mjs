// The play mode's scene changes in a browser (journal Passe L3): a new game in the town page, the clock driven by window.__game to the day's
// bout, the arena page loaded from the save (the address the town would go to: window.__go, read with ?noreload=1), the bout decided by
// scripted inputs on window.__arena in today's game (win: the opponent brought down by a technique; lose: the player struck by heavy blows); a version 2
// game's bout is the duel played by the computer (journal Passe LC3): the state decides it, so <win|lose> is the result the tool expects (a new game that
// only waits wins on day 2 with seed 5 and loses with seed 4 since the clash and the gauge of journal Passe BL1's sheet (with seed 1842 under the model « La Brute » before them); the reverse since lot 2's rhythm and break, journal Passe SL3; with seed 1 from the same rules for every fighter, journal Passe SL1; the reverse before), the duel skipped (« Skip ») and its outcome checked against Node's own; the result
// screen's button, then the town page loaded again from the save. At the end the browser's state is replayed in Node (src/simulation, the
// same actions and the outcome the arena handed in) and both fingerprints must match.
//   node tools/play-flow.mjs <outDir> <win|lose> [seed] [day=2|3]   (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs;
//   COMBAT=dynamic: the new game under the rules of the « tour par tour dynamique », &combat=dynamic, its bout in DynamicSim, journal Passe C2;
//   a version 2 game by default, the default game since the operator's decision of journal Passe VD1: the bare ?play=1&new=1, its flag and the
//   dynamic rules with it, journal Passe V0; V2=0: today's game, &v2=0; COMBAT=dynamic: today's game under the dynamic rules, &v2=0&combat=dynamic;
//   PAGE_LANG=fr: every page in French, &lang=fr, journal Passe RG4: the same fingerprint, the simulation running in English)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, mode, seedS = '1842', dayS = '2'] = process.argv.slice(2);
if (!outDir || !['win', 'lose'].includes(mode)) throw new Error('usage: node tools/play-flow.mjs <outDir> <win|lose> [seed] [day]');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), day = +dayS;
const READY = +(process.env.READY_MS || 600000), V2 = process.env.V2 !== '0' && process.env.COMBAT !== 'dynamic', DYN = process.env.COMBAT === 'dynamic' || V2;
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const errors = [], actionsDone = [];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
try {
  const page = await b.newPage();
  // a real gamepad plugged into the machine reaches headless Chrome (the operator's, journal Passe RM3: its drift pressed keys in a proof): hidden; PAD=1 keeps it
  if (!process.env.PAD) await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  const open = async (q) => { await page.goto(`${BASE}${q}${process.env.PAGE_LANG ? `&lang=${process.env.PAGE_LANG}` : ''}`, { waitUntil: 'load', timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); const e = await page.evaluate(() => window.__error ?? null); check(!e, `page ${q} ready${e ? `: ${e}` : ''}`); };
  const act = async (a) => { const r = await page.evaluate((x) => window.__game.act(x), a); check(r.ok, `act ${JSON.stringify(a).slice(0, 60)}${r.ok ? '' : `: ${r.reason}`}`); if (r.ok) actionsDone.push(a); return r; };
  // 1. the town: a new game, the clock to the bout's afternoon
  await open(`?play=1&new=1&name=Aster&seed=${seedS}&vis=0&noreload=1${V2 ? '' : DYN ? '&v2=0&combat=dynamic' : '&v2=0'}`);
  check((await page.evaluate(() => window.__game.state().flags.v2 ?? null)) === (V2 ? true : null), `the version 2's flag: ${V2 ? 'on' : 'absent'}`);
  { const want = process.env.PAGE_LANG && V2 ? process.env.PAGE_LANG : 'en'; const l = await page.evaluate(() => document.documentElement.lang || 'en'); check(l === want, `the page's language: ${l}`); }
  check((await page.evaluate(() => window.__game.state().flags.combat ?? null)) === (DYN ? 'dynamic' : null), `the game's rules: ${DYN ? 'dynamic' : 'today'}`);
  // the slots to the bout's afternoon: (day - 1) days of three slots and the morning
  const waits = (day - 1) * 3 + 1;
  // the opponent of the day: today's pool (Vessa, Marek), the version 2's (Vessa, Orla, Cassius on days 2, 4, 5: journal Passe V6)
  const FOE = V2 ? { 2: 'Vessa Lark', 4: 'Orla Brask', 5: 'Cassius Dree' } : { 2: 'Vessa Lark', 3: 'Marek Varn' };
  for (let i = 0; i < waits; i++) {
    const st = await page.evaluate(() => window.__game.state());
    if (st.slot === 'afternoon' && st.tournament.matches.some((m) => m.day === st.day && !m.winner && (m.a === 'player' || m.b === 'player'))) {
      // the first bout, if the flow goes to day 3: won by a fixed result, as the named states do
      await act({ type: 'fight', outcome: { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } });
    } else await act({ type: 'wait' });
  }
  const st1 = await page.evaluate(() => window.__game.state());
  check(st1.day === day && st1.slot === 'afternoon', `day ${st1.day} ${st1.slot}: the bout's afternoon`);
  // the town page again, from the save alone: its panel shows the bout's afternoon
  const hBefore = await page.evaluate(() => window.__game.hash());
  await open('?play=1&vis=0&noreload=1');
  check(await page.evaluate(() => window.__game.hash()) === hBefore, 'the town page reloaded from the save holds the same state');
  await page.screenshot({ path: path.join(outDir, `${mode}-1-town.png`) });
  // 2. « Enter the arena »: the town saves and goes to the arena page
  await page.evaluate(() => { window.__ui.openHere(); [...document.querySelectorAll('.pm-talk .pm-btn')].find((x) => /Enter the arena|Entrer dans l’arène/.test(x.textContent)).click(); });
  // the version 2: the match sheet first (lot V9, P6), its four skills kept
  if (V2) {
    const sheet = await page.evaluate(() => document.querySelector('.pm-overlay .pm-card')?.textContent ?? '');
    check(sheet.includes(FOE[day]) && /Enter the arena with these four|Entrer dans l’arène avec ces quatre/.test(sheet), 'the match sheet names the opponent');
    // Enter enters the arena from any line of the sheet (journal Passe UM11)
    await page.evaluate(() => document.activeElement?.blur?.() ?? 0); await page.focus('.pm-glist .pm-btn'); await page.keyboard.press('Enter');
  }
  const to = await page.evaluate(() => window.__go);
  check(/scene=arena/.test(to ?? ''), `the town goes to ${to}`);
  await open(to);
  const sheet = await page.evaluate(() => ({ names: [window.__arena.sim.D.fighters.ren.name, window.__arena.sim.D.fighters.marek.name], assist: window.__arena.assist, rules: window.__arena.rules, hud: document.querySelector('#arena-hud')?.getAttribute('aria-label') }));
  check(sheet.rules === (V2 ? 'auto' : DYN ? 'dynamic' : 'classic'), `the arena plays ${sheet.rules}`);
  check(sheet.names[0] === 'Aster' && sheet.names[1] === FOE[day], `the arena seats ${sheet.names.join(' vs ')}`);
  // the version 2's bout names its stage (journal Passe VP2: « The pool · round 1 », « Semi-final »...), today's the slice's pool
  if (process.env.PAGE_LANG === 'fr' && V2) check(/La poule · tour \d/.test(sheet.hud ?? ''), `French HUD: ${sheet.hud}`);
  else check((V2 ? /The pool · round \d/ : /Pool of eight/).test(sheet.hud ?? ''), `English HUD: ${sheet.hud}`);
  // the version 2's duel: Ren and the seated rival each under their own approved sheet (journal Passe CX4)
  if (V2) { const worn = await page.evaluate(() => window.__arena.sheets?.info.sheets.map((s) => `${s.id} ${s.runtimeUse}`).join(', ') ?? 'none'); check(worn === `hero-x3-combat production, ${sheet.names[1].split(' ')[0].toLowerCase()}-x3-combat production`, `the sheets worn: ${worn}`); }
  await page.screenshot({ path: path.join(outDir, `${mode}-2-report.png`) });
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn').click());
  // 3. the bout, by scripted inputs (a version 2 game: « Skip », the duel played by the computer decided before), the loop stepped from here
  const won = await page.evaluate((m) => {
    const a = window.__arena, s = a.sim;
    if (a.auto) { a.update(1 / 60); a.action('dodge', true); }
    for (let i = 0; i < 60 * 90 && !(window.__go); i++) {
      if (!s.over && !a.auto) {
        if (m === 'win') { if (s.f.marek.hp > 25) s.f.marek.hp = 25; if (s.f.ren.state === 'idle') { s.f.ren.ap = 5; a.action('t4'); } }
        else { s.f.ren.hp = Math.min(s.f.ren.hp, 30); if (s.f.marek.state === 'idle') { if (s.forceAction) s.forceAction('marek', 'm_heavy'); else s.forceSequence(['m_heavy']); } }
      }
      a.update(1 / 60);
      if (s.over && document.querySelector('.pm-overlay')) break;
    }
    return { over: s.over, winner: s.f.ren.state === 'down' ? 'opponent' : 'player', t: s.t };
  }, mode);
  // the version 2: the duel the arena played is the one the game decides (src/combat/autoMatch.ts), computed in Node on the state of the bout
  const auto = V2 ? await page.evaluate(() => ({ end: window.__arena.auto.end, winner: window.__arena.auto.winner, hp: window.__arena.auto.result.hp })) : null;
  check(won.over && won.winner === (mode === 'win' ? 'player' : 'opponent'), `the bout ends: ${won.winner} wins at ${won.t.toFixed(1)} s`);
  await page.waitForSelector('.pm-overlay .pm-btn', { timeout: 20000 });
  await page.screenshot({ path: path.join(outDir, `${mode}-3-result.png`) });
  const st2 = await page.evaluate(() => window.__game.state());
  const fight = st2.log.filter((e) => e.kind === 'match' && (e.id === 'player-won' || e.id === 'player-lost'));
  check(fight.length === Object.keys(FOE).filter((d) => +d <= day).length && fight.at(-1).id === (mode === 'win' ? 'player-won' : 'player-lost'), `the result is in the state: ${fight.at(-1)?.text}`);
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
    if (DYN) s.flags.combat = 'dynamic';
    if (V2) G.makeV2(s);
    for (const a of actionsDone) s = G.advance(s, a).state;
    if (V2) {
      const AM = await server.ssrLoadModule('/src/combat/autoMatch.ts'), o = AM.autoOutcome(s);
      check(o.duel.t === auto.end && o.winner === (auto.winner === 'ren' ? 'player' : 'opponent') && o.playerHp === auto.hp[0] && o.opponentHp === auto.hp[1] && o.winner === outcome.winner && o.playerHp === outcome.playerHp, `the arena's duel is the game's: ${o.winner} at ${o.duel.t} s, ${o.playerHp} / ${o.opponentHp} health`);
    }
    const last = st3.s.log.findLast((e) => e.id === 'player-won' || e.id === 'player-lost');
    s = G.advance(s, { type: 'fight', outcome }).state;
    check(G.hash(s) === st3.h, `Node replay ${G.hash(s)} = browser ${st3.h} (${last?.text})`);
  } finally { await server.close(); }
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
