// The preparation of a bout in a browser (lot 3 of « La Brute », journal Passe BL3; the operator's PB-4 « Toutes »): a version 2 game built in Node by the game's own
// actions (Vessa Lark watched at practice on the forecourt, the walk to the training ground) and kept in the browser's save; then, through the page's interface:
//   1. Master Corvin's dialogue offers the rehearsal against Vessa's shadow and his notebook; the rehearsal taken (a slot): its chances the game's (Node's thirty duels
//      on the same state), its line in the news;
//   2. the notebook from the menu: Vessa first, what is known of her (the style), the rehearsal's lines, the notes (none yet) as Node writes them; the bouts to watch;
//   3. a rehearsed win and loss watched again in the arena (`review=win|loss`): the empty stands, the duel Node replays on that seed, its end said, Master Corvin's
//      reading of it, and nothing of the game changed (the fingerprint before and after);
//   4. the day's bout: the match sheet says Vessa's style and the rehearsal « with this plan »; the bout skipped, its result Node's, Master Corvin's note on the result
//      screen as Node reads it from the same duel; back in the town, the notebook keeps it;
//   5. Node replays the page's actions (the bout's result with its note) and finds the same fingerprint.
//   node tools/prep-proof.mjs <outDir> [seed]   (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/play-flow.mjs; PAGE_LANG=fr the page in French, its texts
//   checked against the French table)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, seedS = '1842'] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/prep-proof.mjs <outDir> [seed]');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
const LANG = process.env.PAGE_LANG === 'fr' ? 'fr' : 'en', LQ = LANG === 'fr' ? '&lang=fr' : '';
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const L = (f) => server.ssrLoadModule(f);
const G = await L('/src/simulation/index.ts'), PR = await L('/src/simulation/v2prep.ts'), SC = await L('/src/simulation/v2scout.ts'), AM = await L('/src/combat/autoMatch.ts');
const AU = await L('/src/combat/auto.ts'), AN = await L('/src/combat/autoNotes.ts'), NB = await L('/src/ui/notebook.ts'), T = await L('/src/narrative/text/index.ts');
if (LANG === 'fr') { const { FR } = await L('/src/narrative/text/fr.ts'); T.useLanguage('fr', FR); }
const tx = T.tx;
// the page's text, its spaces as one (what a line says, whatever wraps it)
const norm = (s) => String(s).replace(/\s+/g, ' ').trim();

// the state the page opens on: Vessa watched on the forecourt (her style), the walk to the training ground
const pre = [];
let s0 = G.makeV2(G.newGame(+seedS >>> 0, 'Aster'));
const step = (a) => { const r = G.advance(s0, a); if (!r.ok) throw new Error(`${a.type}: ${r.reason}`); s0 = r.state; pre.push(a); };
step({ type: 'move', to: 'forecourt' }); step({ type: 'scout', who: 'vessa' }); step({ type: 'move', to: 'training' });
check(SC.scoutTier(s0, 'vessa') === 1 && s0.slot === 'afternoon' && s0.place === 'training', `Node: Vessa's style seen, the afternoon on the training ground (tier ${SC.scoutTier(s0, 'vessa')})`);
const saved = G.serialize(s0);

const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const errors = [], done = [];
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  await page.goto(`${BASE}?vis=0`, { waitUntil: 'domcontentloaded', timeout: READY });
  await page.evaluate((t) => localStorage.setItem('cite-du-tournoi.save', t), saved);
  const open = async (q) => { await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); const e = await page.evaluate(() => window.__error ?? null); if (e) throw new Error(e); };
  // a town page: its news band read (its text kept) and closed
  const openTown = async (q) => { await open(q); const news = await page.evaluate(() => { const o = document.querySelector('.pm-overlay'); const t = o?.textContent ?? ''; o?.querySelector('.pm-btn')?.click(); return t; }); return norm(news); };
  const run = async (a) => { const r = await page.evaluate((x) => window.__ui.run(x), a); check(r.ok, `run ${JSON.stringify(a).slice(0, 70)}${r.ok ? '' : `: ${r.reason}`}`); if (r.ok) done.push(a); return r; };
  // (a page's fade-in done, the loading screen gone)
  const shot = async (n) => { await new Promise((r) => setTimeout(r, 1200)); await page.screenshot({ path: path.join(outDir, `prep-${LANG}-${n}.png`) }); };
  const town = `?play=1&vis=0&noreload=1${LQ}`;
  await openTown(town);

  // 1. Master Corvin: the rehearsal and his notebook
  const talk = await page.evaluate(() => { window.__ui.openPerson('corvin'); return [...document.querySelectorAll('.pm-talk .pm-btn')].map((x) => x.textContent.replace(/\s+/g, ' ').trim()); });
  done.push({ type: 'talk', who: 'corvin' });
  const label = tx('prep.rehearse.label', { name: 'Vessa Lark', n: PR.REHEARSAL.n });
  check(talk.some((t) => t.includes(label)), `Corvin offers « ${label} »`);
  check(talk.some((t) => t.includes(tx('nb.see'))), `Corvin offers his notebook « ${tx('nb.see')} »`);
  await shot('1-corvin');
  const nodeReh = PR.runRehearsal(await page.evaluate(() => window.__game.state()));
  await page.evaluate(() => document.querySelector('.pm-talk')?.remove());
  await run({ type: 'rehearse' });
  let to = await page.evaluate(() => window.__go);
  const news = to ? await openTown(to) : '';
  const st1 = await page.evaluate(() => window.__game.state()), reh = st1.v2.$rehearsals?.vessa;
  check(!!reh && reh.wins === nodeReh.wins && reh.n === PR.REHEARSAL.n, `the rehearsal's chances the game's: ${reh?.wins} of ${reh?.n} (Node ${nodeReh.wins})`);
  check(news.includes(norm(tx('prep.rehearse.log', { name: 'Vessa Lark', wins: nodeReh.wins, n: nodeReh.n }))), `its line in the news: ${news.slice(0, 160)}`);

  // 2. the notebook, from the menu
  const nb = await page.evaluate((line) => {
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true }));
    const b = [...document.querySelectorAll('.pm-overlay .pm-btn')].find((x) => x.textContent.includes(line)); b?.click();
    const card = document.querySelector('.pm-notebook');
    return { found: !!b, open: !!card, head: card?.querySelector('.pm-who-at')?.textContent ?? '', detail: card?.querySelector('.pm-detail')?.textContent ?? '', foot: [...(card?.querySelectorAll('.pm-foot .pm-btn') ?? [])].map((x) => x.textContent), rows: [...(card?.querySelectorAll('.pm-glist .pm-btn') ?? [])].map((x) => x.textContent) };
  }, tx('nb.open'));
  check(nb.found && nb.open, 'the notebook from the menu');
  check(norm(nb.head).includes('Vessa Lark') && norm(nb.rows[0] ?? '').includes('Vessa Lark'), `Vessa first, the next opponent: ${norm(nb.rows[0] ?? '')}`);
  const want = [...SC.scoutLines(st1, 'vessa'), ...NB.rehearsalLines(reh), tx('nb.noNotes')];
  for (const l of want) check(norm(nb.detail).includes(norm(l)), `the notebook says « ${l.slice(0, 90)} »`);
  check(nb.foot.some((t) => t.includes(tx('nb.watchWin'))) === (reh.seeds.win !== undefined) && nb.foot.some((t) => t.includes(tx('nb.watchLoss'))) === (reh.seeds.loss !== undefined), `the bouts to watch: ${nb.foot.map(norm).join(' | ')}`);
  await shot('2-notebook');
  const hash1 = await page.evaluate(() => window.__game.hash());

  // 3. a rehearsed win and loss watched again
  for (const which of ['win', 'loss']) {
    if (reh.seeds[which] === undefined) { console.log(`(no rehearsed ${which})`); continue; }
    await page.evaluate((k) => { const b = [...document.querySelectorAll('.pm-notebook .pm-foot .pm-btn')].find((x) => x.textContent.includes(k)); b?.click(); }, tx(which === 'win' ? 'nb.watchWin' : 'nb.watchLoss'));
    to = await page.evaluate(() => window.__go);
    check(/scene=arena/.test(to ?? '') && new RegExp(`review=${which}`).test(to ?? ''), `the notebook goes to ${to}`);
    await open(to);
    const nodeRv = PR.reviewOf(await page.evaluate(() => window.__game.state()), which);
    const seen = await page.evaluate(() => { const a = window.__arena, st = a.snapshot(); return { rules: a.rules, end: a.auto?.end, winner: a.auto?.winner, empty: !!st.empty || st.fans === 0, stands: !!st.stands, hud: document.body.textContent.replace(/\s+/g, ' ') }; });
    check(seen.rules === 'auto' && Math.abs(seen.end - nodeRv.result.t) < 1e-6 && (seen.winner === 'ren') === (which === 'win'), `the arena replays Node's rehearsed ${which}: ${seen.winner} at ${seen.end} s (Node ${nodeRv.result.t} s)`);
    check(!seen.stands, 'the stands empty');
    check(seen.hud.includes(norm(tx('prep.review.title', { name: 'Vessa Lark' }))), 'the HUD says the rehearsal');
    await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn').click());
    await page.evaluate(() => { const a = window.__arena; for (let i = 0; i < 30; i++) a.update(1 / 60); a.action('dodge', true); for (let i = 0; i < 60 * 30 && !document.querySelector('.pm-overlay .pm-btn'); i++) a.update(1 / 60); });
    await page.waitForSelector('.pm-overlay .pm-btn', { timeout: 30000 });
    const end = await page.evaluate(() => ({ text: document.querySelector('.pm-overlay').textContent, out: window.__reviewOutcome, hash: window.__game.hash() }));
    const note = AN.boutNote(nodeRv.result, nodeRv.ren, nodeRv.foe, { day: st1.day, foe: 'vessa', kind: 'rehearsal' });
    check(norm(end.text).includes(norm(tx(which === 'win' ? 'prep.review.won' : 'prep.review.lost'))) && end.out?.winner === (which === 'win' ? 'player' : 'opponent'), `its end: ${norm(end.text).slice(0, 60)}`);
    for (const l of NB.noteLines(note).slice(1)) check(norm(end.text).includes(norm(l)), `Corvin's reading: « ${l.slice(0, 80)} »`);
    check(end.hash === hash1, 'nothing of the game changed in the arena');
    await shot(`3-review-${which}`);
    await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn').click());
    to = await page.evaluate(() => window.__go);
    check(!/scene=arena/.test(to ?? '') && !/review/.test(to ?? ''), `back to the training ground: ${to}`);
    await openTown(to);
    check(await page.evaluate(() => window.__game.hash()) === hash1, 'nothing of the game changed after it');
    // the notebook again, for the loss
    await page.evaluate((line) => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })); [...document.querySelectorAll('.pm-overlay .pm-btn')].find((x) => x.textContent.includes(line))?.click(); }, tx('nb.open'));
  }
  await page.evaluate(() => document.querySelector('.pm-notebook')?.remove());

  // 4. the day's bout: the match sheet, then the bout and its note
  while (true) {
    const s = await page.evaluate(() => window.__game.state());
    if (s.day === 2 && s.slot === 'afternoon') break;
    await run({ type: 'wait' });
    to = await page.evaluate(() => window.__go); if (to) await openTown(to);
  }
  const st2 = await page.evaluate(() => window.__game.state());
  const sheet = await page.evaluate(() => { window.__ui.openSkills(true); return document.body.textContent; });
  const fresh = PR.rehearsalFresh(st2, st2.v2.$rehearsals.vessa);
  check(fresh, 'Node: the rehearsal still holds « with this plan » on the bout\'s afternoon');
  for (const l of [...SC.scoutLines(st2, 'vessa'), tx('prep.sheet.rehearsal', { wins: reh.wins, n: reh.n, name: 'Vessa Lark' })]) check(norm(sheet).includes(norm(l)), `the match sheet says « ${l.slice(0, 90)} »`);
  await shot('4-sheet');
  await page.keyboard.press('Enter');
  const go = await page.evaluate(() => window.__go);
  check(/scene=arena/.test(go ?? ''), `the match sheet enters the arena: ${go}`);
  await open(go);
  const atArena = await page.evaluate(() => window.__game.state());
  const node = AM.autoOutcome(atArena, 'bout', { log: true });
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn').click());
  await page.evaluate(() => { const a = window.__arena; for (let i = 0; i < 30; i++) a.update(1 / 60); a.action('dodge', true); for (let i = 0; i < 60 * 30 && !document.querySelector('.pm-overlay .pm-btn'); i++) a.update(1 / 60); });
  await page.waitForSelector('.pm-overlay .pm-btn', { timeout: 30000 });
  const result = await page.evaluate(() => ({ text: document.querySelector('.pm-overlay').textContent, outcome: window.__outcome }));
  check(result.outcome.winner === node.winner && result.outcome.playerHp === node.playerHp && result.outcome.opponentHp === node.opponentHp, `the bout is the game's: ${node.winner}, ${node.playerHp} / ${node.opponentHp}`);
  check(JSON.stringify(result.outcome.note) === JSON.stringify(node.note), 'the note handed in is Node\'s, read from the same duel');
  check(norm(result.text).includes(norm(tx('note.title'))), 'Master Corvin\'s note on the result screen');
  for (const l of NB.noteLines(node.note).slice(1)) check(norm(result.text).includes(norm(l)), `the note says « ${l.slice(0, 80)} »`);
  await shot('5-result');
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn').click());
  await openTown(await page.evaluate(() => window.__go));
  const st3 = await page.evaluate(() => ({ s: window.__game.state(), h: window.__game.hash() }));
  check(st3.s.v2.$notes?.length === 1 && st3.s.v2.$notes[0].foe === 'vessa' && st3.s.v2.$notes[0].day === 2, 'the notebook keeps the bout\'s note');
  const nb2 = await page.evaluate((line) => { window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', bubbles: true })); [...document.querySelectorAll('.pm-overlay .pm-btn')].find((x) => x.textContent.includes(line))?.click(); const card = document.querySelector('.pm-notebook'); const v = [...card.querySelectorAll('.pm-glist .pm-btn')].find((x) => x.textContent.includes('Vessa')); v?.focus(); return card.querySelector('.pm-detail').textContent; }, tx('nb.open'));
  for (const l of NB.noteLines(st3.s.v2.$notes[0])) check(norm(nb2).includes(norm(l)), `the notebook's note: « ${l.slice(0, 80)} »`);
  await shot('6-notebook-note');

  // 5. Node replays the page's actions
  let s = G.deserialize(saved);
  for (const a of done) { const r = G.advance(s, a); if (!r.ok) throw new Error(`replay ${a.type}: ${r.reason}`); s = r.state; }
  s = G.advance(s, { type: 'fight', outcome: result.outcome }).state;
  check(G.hash(s) === st3.h, `Node replay ${G.hash(s)} = browser ${st3.h}`);
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); await server.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
