// A challenge or a reprisal of the version 2 played in a browser (lot L2b, journal Passe EVL3; the operator's EV-3 « Pleine vie, une mise, une fois par
// phase », EV-5 « L’arène aux gradins vides », his note on EV-2 « une possibilite de combat et de represaille reelle »): the state is built in Node by
// the game's own actions (for a reprisal, a theft caught at a sore keeper's stall and the dawn it hires the muscle; the draws forced through `advance`'s
// rng), kept in the browser's save, the town page opened from it, the challenge put or the muscle faced through the page's interface (`__ui.run`), the
// arena page loaded from the save: its stands empty (no spectator, no crowd), the lists' piece, both fighters at full health; the bout is the duel played by
// the computer since lot 2 (journal Passe LC3): the state decides it, so <win|lose> is the result the tool expects, the duel skipped (« Skip ») and its result
// checked against Node's own on the browser's state; the town page again; Node replays the browser's actions and must find the same fingerprint. The arena's two sheets are
// checked (Ren's and the opponent's, approved), and the opponent's face in the dialogue (journal Passe GA2).
//   node tools/challenge-flow.mjs <outDir> <challenge|reprisal> <win|lose> [seed] [who]   (who: the fighter challenged, orla by default; aldric, ambrose, lucan,
//   piers or kell, the generic fighters, at their place and hour (journal Passes GA2 / GA3); BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/play-flow.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, kind, mode, seedS = '1842', who = 'orla'] = process.argv.slice(2);
if (!outDir || !['challenge', 'reprisal'].includes(kind) || !['win', 'lose'].includes(mode)) throw new Error('usage: node tools/challenge-flow.mjs <outDir> <challenge|reprisal> <win|lose> [seed]');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const G = await server.ssrLoadModule('/src/simulation/index.ts'), { GENERICS } = await server.ssrLoadModule('/src/narrative/generics.ts');
/** where and when each fighter takes a challenge (src/narrative/people.ts) */
const AT = { orla: ['training', 'morning'], aldric: ['training', 'morning'], ambrose: ['lanterns', 'afternoon'], lucan: ['forecourt', 'evening'], piers: ['district', 'morning'], kell: ['lanterns', 'morning'] };
if (kind === 'challenge' && !AT[who]) throw new Error(`who: one of ${Object.keys(AT).join(', ')}`);
const foeId = kind === 'challenge' ? who : 'corra';
const LOSE = { next: () => 0.999, fork() { return this; } };
// the state the page opens on, built by the game's own actions (the draws of a reprisal's theft forced)
const pre = [];
let s0 = G.makeV2(G.newGame(+seedS >>> 0, 'Aster'));
const step = (a, rng) => { const r = G.advance(s0, a, rng); if (!r.ok) throw new Error(`${a.type}: ${r.reason}`); s0 = r.state; pre.push({ a, forced: !!rng }); };
// (the day's bout, when the slot to reach comes after it, is won as the reprisal's wait wins it)
const boutDue = () => s0.slot === 'afternoon' && s0.tournament.matches.some((m) => m.day === s0.day && !m.winner && (m.a === 'player' || m.b === 'player'));
if (kind === 'challenge') while (s0.slot !== AT[who][1]) step(boutDue() ? { type: 'fight', outcome: { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } } : { type: 'wait' });
if (kind === 'reprisal') {
  // Mara's goodwill soured by a first catch, then a second at her stall: under the grudge; the night falls, the dawn hires the muscle; the next evening
  step({ type: 'steal', shop: 'mara' }, LOSE);
  // the second catch on day 3: Wynn of the watch stands by Mara's stall the day of a catch and the next (lot L5, journal Passe EVL9), and the flow stole there
  // on day 2 since then (found in journal Passe CO3); the day's bout on the way is won
  while (!(s0.day === 3 && s0.slot === 'morning')) step(boutDue() ? { type: 'fight', outcome: { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } } : { type: 'wait' });
  step({ type: 'steal', shop: 'mara' }, LOSE);
  while (!(s0.slot === 'evening' && s0.v2.reprisal)) step(s0.slot === 'afternoon' && s0.tournament.matches.some((m) => m.day === s0.day && !m.winner && (m.a === 'player' || m.b === 'player')) ? { type: 'fight', outcome: { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } } : { type: 'wait' });
  if (s0.place !== 'district') step({ type: 'move', to: 'district' });
  check(!!s0.v2.reprisal, `Node: the muscle waits for Mara's debt (${JSON.stringify(s0.v2.reprisal)})`);
}
const saved = G.serialize(s0), coins0 = s0.player.coins;
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const errors = [], done = [];
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  await page.goto(`${BASE}?vis=0`, { waitUntil: 'domcontentloaded', timeout: READY });
  await page.evaluate((t) => localStorage.setItem('cite-du-tournoi.save', t), saved);
  const open = async (q) => { await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); const e = await page.evaluate(() => window.__error ?? null); check(!e, `page ${q} ready${e ? `: ${e}` : ''}`); };
  // a town page: its news band read and closed
  const openTown = async (q) => { await open(q); await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click()); };
  // the page's interface takes the action, as a player does (journal Passe EVL1)
  const run = async (a) => { const r = await page.evaluate((x) => window.__ui.run(x), a); check(r.ok, `run ${JSON.stringify(a).slice(0, 70)}${r.ok ? '' : `: ${r.reason}`}`); if (r.ok) done.push(a); return r; };
  await openTown('?play=1&vis=0&noreload=1');
  if (kind === 'challenge') {
    // (a fighter of the quay is met where the game starts: no move)
    if (s0.place !== AT[who][0]) { await run({ type: 'move', to: AT[who][0] }); await openTown('?play=1&vis=0&noreload=1'); }
    const tag = await page.evaluate((w) => { window.__ui.openPerson(w); return [...document.querySelectorAll('.pm-talk .pm-btn')].find((x) => /10 coins staked/.test(x.textContent))?.querySelector('.cost')?.parentElement?.textContent ?? ''; }, who);
    check(/10 coins/.test(tag) && /1 slot/.test(tag), `the stake and the slot in its tags: ${tag}`);
    const face = await page.evaluate(() => document.querySelector('.pm-talk img')?.getAttribute('src')?.slice(0, 22) ?? 'none');
    check(face.startsWith('data:image/png'), `${who}'s face in the dialogue: ${face}`);
    await page.screenshot({ path: path.join(outDir, `${kind}-${mode}-0-talk.png`) });
    // (opening the dialogue talks to the fighter: an action of the game, replayed)
    done.push({ type: 'talk', who });
    await run({ type: 'challenge', who, stake: 'coins' });
  } else {
    const said = await page.evaluate(() => { window.__ui.openPerson('corra'); return document.querySelector('.pm-talk')?.textContent ?? ''; });
    check(/Mara sent me/.test(said) && /Face Corra Dunmere on the sand/.test(said) && /Pay Corra Dunmere off/.test(said), 'Corra on the quay at night: Mara\'s debt, face her or pay her off');
    const face = await page.evaluate(() => document.querySelector('.pm-talk img')?.getAttribute('src')?.slice(0, 22) ?? 'none');
    check(face.startsWith('data:image/png'), `Corra's face in the dialogue: ${face}`);
    await page.screenshot({ path: path.join(outDir, `${kind}-${mode}-0-talk.png`) });
    done.push({ type: 'talk', who: 'corra' });
    await run({ type: 'faceMuscle' });
  }
  await page.screenshot({ path: path.join(outDir, `${kind}-${mode}-1-town.png`) });
  const label = await page.evaluate(() => { window.__ui.openHere(); const b = [...document.querySelectorAll('.pm-talk .pm-btn.primary')].find((x) => /Enter the sand/.test(x.textContent)); const t = b?.textContent ?? ''; b?.click(); return t; });
  check(kind === 'challenge' ? /Enter the sand for your challenge/.test(label) : /Enter the sand to face Corra Dunmere/.test(label), `the list's door: ${label}`);
  const to = await page.evaluate(() => window.__go);
  check(/scene=arena/.test(to ?? '') && /challenge=1/.test(to ?? ''), `the town goes to ${to}`);
  await open(to);
  const seen = await page.evaluate(() => { const a = window.__arena, st = a.snapshot(); return { names: [a.sim.D.fighters.ren.name, a.sim.D.fighters.marek.name], hp: [a.sim.f.marek.hp, a.sim.f.marek.maxHp], rules: a.rules, stands: !!st.stands, fans: st.fans, empty: !!a.opts.match?.empty, piece: a.opts.match?.piece, hud: document.querySelector('#arena-hud')?.getAttribute('aria-label') ?? '' }; });
  const foe = kind === 'challenge' ? (GENERICS[who]?.name ?? 'Orla Brask') : 'Corra Dunmere';
  check(seen.rules === 'auto' && seen.names[0] === 'Aster' && seen.names[1] === foe, `the arena seats ${seen.names.join(' vs ')} (${seen.rules})`);
  check(seen.empty && !seen.stands && seen.fans === 0, `the stands empty: no townsfolk (${seen.stands}), no generated spectator (${seen.fans})`);
  check(seen.piece === 'lices', `the lists' piece: ${seen.piece}`);
  check(seen.hp[0] === seen.hp[1], `the opponent at full health: ${seen.hp.join(' / ')}`);
  check(kind === 'challenge' ? /A challenge/.test(seen.hud) : /A reprisal/.test(seen.hud), `the HUD says it: ${seen.hud}`);
  const worn = await page.evaluate(() => window.__arena.sheets?.info.sheets.map((s) => `${s.id} ${s.runtimeUse}`).join(', ') ?? 'none');
  check(worn === `hero-x3-combat production, ${foeId}-x3-combat production`, `the sheets worn: ${worn}`);
  await page.screenshot({ path: path.join(outDir, `${kind}-${mode}-2-gate.png`) });
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn').click());
  await page.evaluate(() => { const a = window.__arena; for (let i = 0; i < 40; i++) a.update(1 / 60); });
  await page.screenshot({ path: path.join(outDir, `${kind}-${mode}-3-sand.png`) });
  // the duel the game decides, on the browser's state at the arena (Node's own duel)
  const atArena = await page.evaluate(() => window.__game.state());
  const AM = await server.ssrLoadModule('/src/combat/autoMatch.ts'), node = AM.autoOutcome(atArena, 'challenge');
  const won = await page.evaluate((m) => {
    const a = window.__arena, s = a.sim;
    if (a.auto) a.action('dodge', true);
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
  check(won.over && won.winner === (mode === 'win' ? 'player' : 'opponent'), `the bout ends: ${won.winner} wins at ${won.t.toFixed(1)} s`);
  await page.waitForSelector('.pm-overlay .pm-btn', { timeout: 20000 });
  await page.screenshot({ path: path.join(outDir, `${kind}-${mode}-4-result.png`) });
  const outcome = await page.evaluate(() => window.__outcome);
  console.log(`outcome ${JSON.stringify(outcome)}`);
  check(outcome.winner === node.winner && outcome.playerHp === node.playerHp && outcome.opponentHp === node.opponentHp, `the arena's duel is the game's (${node.winner} at ${node.duel.t} s)`);
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn').click());
  await openTown(await page.evaluate(() => window.__go));
  const st = await page.evaluate(() => ({ s: window.__game.state(), h: window.__game.hash() }));
  check(!st.s.v2.challenge, 'the challenge is over');
  if (kind === 'challenge') check(st.s.player.coins === coins0 - 10 + (mode === 'win' ? 20 : 0), `the stake: ${coins0} -> ${st.s.player.coins}`);
  else check(!st.s.v2.reprisal && st.s.player.coins === (mode === 'win' ? coins0 : coins0 - Math.min(20, coins0)), `the reprisal settled: coins ${coins0} -> ${st.s.player.coins}`);
  await page.screenshot({ path: path.join(outDir, `${kind}-${mode}-5-town.png`) });
  // Node replays the page's actions, then the bout's result
  let s = G.deserialize(saved);
  for (const a of done) s = G.advance(s, a).state;
  s = G.advance(s, { type: 'challengeResult', outcome }).state;
  check(G.hash(s) === st.h, `Node replay ${G.hash(s)} = browser ${st.h}`);
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); await server.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
