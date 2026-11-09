// The first day played in the town page (journal Passe L4): a new game; at the keyboard, the hero placed by Mara's stall and E pressed must
// open her dialogue (portrait, words, her shop); then the day through window.__game (the steel cargo: Tam, Hale, the haul; the forecourt:
// the roll, sparring with Orla; the evening), each slot change saved and the page reloaded from the save, the state's fingerprint kept; the
// second morning reached. Node replays the same actions: same fingerprint. A version 2 game (the default; V2=0 today's game) plays its steps through the page's
// interface and checks the reading of journal Passe EVL1: a theft from the list (Q) said in its band, a square's news after a slot ended there
// (none after a walk), Orla's challenge tagged « 1 slot » (and « 10 coins » for its stake in coins, Passe EVL3), the journal's causes in words;
// and lot L3 (Passe EVL5): Clerk Odo's strongroom on the eve of the first bout and the hooded stranger's word at night, each said in the band,
// then the board (T) opened on the next opponent with what the town saw of her and the stranger's word, with its day.
//   node tools/play-day.mjs <outDir> [seed]   (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, seedS = '1842'] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/play-day.mjs <outDir> [seed]');
// a version 2 game by default (the default game since the operator's decision of journal Passe VD1: the bare ?play=1&new=1, its flag in the
// save and the Node replay, journal Passe V0); V2=0: today's game (&v2=0)
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000), V2 = process.env.V2 !== '0';
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
let failed = 0, errors = 0;
const done = [];
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  // the page's news band, read before it is closed (journal Passe EVL1: a square shows the news of a slot that ended there)
  let band = null;
  const open = async (q, shot) => { await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); check(!(await page.evaluate(() => window.__error ?? null)), `page ${q} ready`); await new Promise((r) => setTimeout(r, 1200)); band = await page.evaluate(() => { const o = document.querySelector('.pm-overlay.pm-band'); return o ? [...o.querySelectorAll('.pm-body p')].map((p) => p.textContent) : null; }); if (shot && band) await page.screenshot({ path: shot }); await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click()); };
  await open(`?play=1&new=1&name=Aster&seed=${seedS}&vis=0&noreload=1${V2 ? '' : '&v2=0'}`);
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
  // the whetstone's Attack +0.5 since the fighters' stats (journal Passe DB9; its heavy blow before)
  check(line.name === 'Whetstone' && /Attack/.test(line.cmp) && /Coins/.test(line.cmp), `the arrows reach the whetstone, the detail with them: ${JSON.stringify(line)}`);
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
  // 1c. the pages at the keyboard (journal Passe UM11): T, the next opponent selected and the arrows changing the fighter; J, the days; K (a version 2 game), a skill left out and brought back; Esc leaves each
  await page.keyboard.press('t');
  await page.waitForSelector('.pm-who', { timeout: 20000 }).catch(() => {});
  const fighter = () => page.evaluate(() => document.querySelector('.pm-who .pm-h')?.firstChild?.textContent ?? '');
  const f0 = await fighter(); await page.keyboard.press('ArrowDown'); const f1 = await fighter();
  check(!!f0 && !!f1 && f0 !== f1 && await page.evaluate(() => !!document.querySelector('.pm-foot .out kbd')), `T: the arrows change the fighter: ${f0}, ${f1}`);
  await page.keyboard.press('Escape');
  await page.keyboard.press('j');
  await page.waitForSelector('.pm-days .pm-btn.on', { timeout: 20000 }).catch(() => {});
  check(await page.evaluate(() => !!document.querySelector('.pm-days .pm-detail .pm-entry')), 'J: the days, and what happened on the one selected');
  await page.keyboard.press('Escape');
  check(await page.evaluate(() => !document.querySelector('.pm-overlay')), 'Esc leaves the pages');
  if (V2) {
    await page.keyboard.press('k');
    await page.waitForSelector('.pm-skills .pm-btn.on', { timeout: 20000 }).catch(() => {});
    const four = () => page.evaluate(() => ({ n: document.querySelector('.pm-skills .pm-purse b')?.textContent, on: document.querySelectorAll('.pm-skills .pm-glist [aria-pressed=true]').length, what: document.querySelector('.pm-skills .pm-detail .ab')?.textContent, kit: window.__game.state().v2.kit.loadout.join() }));
    const k0 = await four();
    await page.keyboard.press('Space'); const k1 = await four();
    await page.keyboard.press('Space'); const k2 = await four();
    check(k0.n === '4' && !!k0.what && k1.n === '3' && k1.on === 3 && k2.n === '4' && k2.kit.split(',').length === 4, `K: a skill left out and brought back at the keyboard: ${JSON.stringify([k0, k1, k2])}`);
    await page.keyboard.press('Escape');
    // 1d. the list (Q) at the keyboard, a theft taken from it (journal Passe EVL1): seen or caught, its news stand in the band, under the place
    await page.keyboard.press('q');
    await page.waitForSelector('.pm-talk [data-here], .pm-talk .pm-dlg.here', { timeout: 20000 }).catch(() => {});
    const steal = await page.evaluate(() => { const b = [...document.querySelectorAll('.pm-talk .pm-btn')].find((x) => /^Steal /.test(x.textContent)); if (!b) return null; b.click(); return b.textContent; });
    const told = await page.evaluate(() => ({ band: [...document.querySelectorAll('.pm-talk .pm-dlg .who .news')].map((p) => p.textContent), last: window.__game.state().log.at(-1), toast: getComputedStyle(document.getElementById('pm-toast')).visibility }));
    check(!!steal && told.last.id.startsWith('steal:') && told.band.length === 1 && told.band[0] === told.last.text, `Q: a theft's news in the band (${told.last?.id}): ${JSON.stringify(told.band)}`);
    await page.screenshot({ path: path.join(outDir, 'day1-steal-band.png') });
    if (steal) done.push({ type: 'steal', shop: 'mara' });
    // the next press in the list shows the band again without the old news
    await page.keyboard.press('Escape'); await page.keyboard.press('q');
    check(await page.evaluate(() => document.querySelectorAll('.pm-talk .pm-dlg .who .news').length === 0), 'the list opened again: no old news');
    await page.keyboard.press('Escape');
  }
  // 2. the day, through the game API; each reload goes through the save
  const steps = [{ type: 'talk', who: 'tam' }, { type: 'talk', who: 'hale' }, { type: 'askPapers' }, { type: 'haul' },
    { type: 'move', to: 'forecourt' }, { type: 'talk', who: 'odo' }, { type: 'register' },
    // lot L3 (journal Passe EVL5): the eve of the first bout, the gear in Clerk Odo's strongroom tonight
    ...(V2 ? [{ type: 'lockGear' }] : []),
    // the version 2: Orla drills at the training ground (lot V5)
    ...(V2 ? [{ type: 'move', to: 'training' }] : []), { type: 'talk', who: 'orla' }, { type: 'spar' },
    // lot L3: the hooded stranger's word of tomorrow's opponent, on the quay at night
    { type: 'move', to: 'district' }, ...(V2 ? [{ type: 'talk', who: 'stranger' }, { type: 'rumour', src: 'stranger' }] : []), { type: 'wait' }];
  // a version 2 game plays them as a player does, through the page's interface (window.__ui.run: what it shows counts as shown, journal Passe
  // EVL1); today's game through the game API, as before
  const actIn = (x) => (window.__ui && window.__game.state().flags.v2 === true ? window.__ui.run(x) : window.__game.act(x));
  for (const a of steps) {
    const r = await page.evaluate(actIn, a);
    check(r.ok, `act ${JSON.stringify(a)}${r.ok ? '' : `: ${r.reason}`}`);
    if (!r.ok) continue;
    done.push(a);
    // lot L3: what Odo and the stranger said stands in the band, as the game wrote it
    if (V2 && (a.type === 'lockGear' || a.type === 'rumour')) {
      const said = (r.events ?? []).filter((e) => e.visible).map((e) => e.text), shown = await page.evaluate(() => document.querySelector('#pm-toast')?.textContent ?? document.querySelector('.pm-talk .news')?.textContent ?? '');
      check(said.length === 1 && shown.includes(said[0].slice(0, 40)), `${a.type}: its words shown (${JSON.stringify(said[0]?.slice(0, 80))} / ${JSON.stringify(shown.slice(0, 80))})`);
      await page.screenshot({ path: path.join(outDir, `day1-${a.type}.png`) });
    }
    if (r.reload) {
      const h = await page.evaluate(() => window.__game.hash()), to = await page.evaluate(() => { const g = window.__game.state(); return g; });
      await open('?play=1&vis=0&noreload=1', V2 && to.place !== 'district' ? path.join(outDir, `news-${to.place}-${a.type}.png`) : undefined);
      check(await page.evaluate(() => window.__game.hash()) === h, `reloaded from the save (day ${to.day} ${to.slot}, ${to.place}): same state`);
      // a version 2 square (journal Passe EVL1): the news of the slot that ended there on the page that opens, the last eight; a walk tells nothing
      if (V2 && to.place !== 'district') {
        const want = (r.events ?? []).filter((e) => e.visible && e.id !== 'meet').map((e) => e.text).slice(-8);
        check(want.length ? !!band && want.every((t) => band.includes(t)) : band === null, `the ${to.place}'s news after ${a.type}: ${JSON.stringify(band)}`);
      }
    }
    // a version 2 game, at the training ground: Orla's challenge takes a slot, its tag says so (journal Passe EVL1, rule P2)
    if (V2 && a.type === 'move' && a.to === 'training') {
      await page.evaluate(() => window.__ui.openPerson('orla'));
      done.push({ type: 'talk', who: 'orla' });
      // (since lot L2b, journal Passe EVL3: two stakes, the coins put on the table at once, then the slot)
      const tag = await page.evaluate(() => [...document.querySelectorAll('.pm-talk .pm-btn')].filter((x) => /^Challenge /.test(x.textContent)).map((b) => [...b.querySelectorAll('.cost')].map((c) => c.textContent)));
      check(JSON.stringify(tag) === '[["10 coins","1 slot"],["1 slot"]]', `Orla's challenge, its two stakes: ${JSON.stringify(tag)}`);
      await page.screenshot({ path: path.join(outDir, 'day1-orla-challenge.png') });
      await page.keyboard.press('Escape');
    }
  }
  const st = await page.evaluate(() => window.__game.state());
  check(st.day === 2 && st.slot === 'morning', `the second morning: day ${st.day} ${st.slot}`);
  check(st.quests.cargo === 'delivered' && st.facts.includes('orla-recruitable'), `the cargo delivered (${st.quests.cargo}), Orla a friend (${st.facts.includes('orla-recruitable')})`);
  const ui = await page.evaluate(() => ({ clock: document.querySelector('#pm-status .clock')?.textContent, where: document.querySelector('#pm-status .where')?.textContent, next: document.querySelector('#pm-status .next')?.textContent }));
  check(new RegExp(`Day 2 / ${V2 ? 10 : 3}`, 'i').test(ui.clock ?? '') && /morning/i.test(ui.where ?? '') && /Vessa Lark/.test(ui.next ?? ''), `the clock and the next deadline: ${ui.clock} · ${ui.where} — ${ui.next}`);
  await page.screenshot({ path: path.join(outDir, 'day2-morning.png') });
  // lot L3 (journal Passe EVL5): the board (T) opens on the next opponent, Vessa: what the town saw her do since yesterday, and the stranger's word with its day
  if (V2) {
    await page.keyboard.press('t');
    await page.waitForSelector('.pm-two .pm-detail', { timeout: 20000 }).catch(() => {});
    const body = await page.evaluate(() => document.querySelector('.pm-two .pm-detail')?.textContent ?? '');
    check(/(Seen|Not seen) in town since yesterday/.test(body), `the board: what the town saw of Vessa (${JSON.stringify(body.match(/(Seen|Not seen) in town[^.]*\./)?.[0] ?? '')})`);
    check(/Heard from the hooded stranger on day 1: Vessa Lark /.test(body), `the board: the stranger's word of Vessa (${JSON.stringify(body.match(/Heard from[^.]*\./)?.[0] ?? '')})`);
    await page.screenshot({ path: path.join(outDir, 'day2-board.png') });
    await page.keyboard.press('Escape');
  }
  // a version 2 journal (journal Passe EVL1, UM-R3): every day's causes in words, never a code (`action:steal`, `match:r1:player-vessa`)
  if (V2) {
    await page.keyboard.press('j');
    await page.waitForSelector('.pm-days .pm-btn.on', { timeout: 20000 }).catch(() => {});
    const whys = [];
    for (let i = 0; i < 3; i++) { whys.push(...await page.evaluate(() => [...document.querySelectorAll('.pm-days .pm-detail .why')].map((w) => w.textContent))); await page.keyboard.press('ArrowDown'); }
    check(!whys.some((w) => /[\w-]+:\S/.test(w.replace(/^Why: /, ''))), `the journal's causes in words: ${JSON.stringify([...new Set(whys)])}`);
    await page.keyboard.press('Escape');
  }
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
