// The townsfolk's duels played in a browser (journal Passe PN1; the operator's GP-01 « Les deux : se battre quand on est pris, et prendre de force », GP-02 « Les passants
// seulement », GP-03 « Gagné : on s’échappe sans amende (la pièce reste) », GP-04 « Gabarits d'abord (Recommandé) »): the state is built in Node by the game's own actions
// (a theft caught, its draw forced through `advance`'s rng), kept in the browser's save, the town page opened from it; `caught`: the band of whoever holds the thief, the fine
// and the fight on its buttons, the fight chosen; `seize`: the passer-by's dialogue, their piece demanded by force; then the sand's door, the arena page loaded from the save:
// its stands empty, the lists' piece, the townsperson on their template in their look (npc-m-x3-combat / npc-f-x3-combat, approved) at full health; the duel played by the
// computer, the state decides it, so <win|lose> is the result the tool expects, the duel run to its end and its result checked against Node's own on the browser's state;
// the town page again (won or lost, what the decision says: a thief's fight won costs no fine and leaves the piece, lost doubles it; a piece taken by force won is the
// player's, lost costs 10 coins); Node replays the browser's actions and must find the same fingerprint.
//   node tools/npc-duel-flow.mjs <outDir> <caught|seize> <win|lose> [who] [seed]
//     caught: who holds the thief, mara (by day, default), hilde, corvin, pip, or wynn (at night, Mara's shutter forced); seize: a passer-by at their place and moment of
//     day 1, nell (default), jory, edda, garrick, maud, hettie, sela, fenwick, yselle, dov. The seed (absent: the first of 1 to 120 where the result asked for happens, read
//     in Node before any browser). BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/play-flow.mjs; PAGE_LANG=fr the page in French (its texts against the table)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, kind, mode, whoArg, seedArg] = process.argv.slice(2);
if (!outDir || !['caught', 'seize'].includes(kind) || !['win', 'lose'].includes(mode)) throw new Error('usage: node tools/npc-duel-flow.mjs <outDir> <caught|seize> <win|lose> [who] [seed]');
const who = whoArg && whoArg !== '-' ? whoArg : kind === 'caught' ? 'mara' : 'nell';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 600000);
const LANG = process.env.PAGE_LANG === 'fr' ? 'fr' : 'en';
fs.mkdirSync(outDir, { recursive: true });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const G = await server.ssrLoadModule('/src/simulation/index.ts'), { PEOPLE } = await server.ssrLoadModule('/src/narrative/people.ts'), { NPC_FIGHTERS } = await server.ssrLoadModule('/src/narrative/npcFighters.ts');
const CH = await server.ssrLoadModule('/src/narrative/champions.ts');
const { PASSERS } = await server.ssrLoadModule('/src/simulation/v2barter.ts'), AM = await server.ssrLoadModule('/src/combat/autoMatch.ts');
const TXT = await server.ssrLoadModule('/src/narrative/text/index.ts'), FR = (await server.ssrLoadModule('/src/narrative/text/fr-texts.ts')).FR_TEXTS, { itemName } = await server.ssrLoadModule('/src/simulation/v2gear.ts');
/** a text of the page's language (the table's own words, its slots filled with the page's words) */
const inLang = (f) => { TXT.useLanguage(LANG, FR); try { return f(); } finally { TXT.useLanguage('en'); } };
const say = (key, vars) => inLang(() => TXT.tx(key, Object.fromEntries(Object.entries(vars ?? {}).map(([k, v]) => [k, typeof v === 'string' ? TXT.word(v) : v]))));
const LOSE = { next: () => 0.999, fork() { return this; } };
/** where each keeper holds a thief (the stall's place, its moment), and the watch at night */
const STALL = { mara: ['mara', 'district', 'morning'], hilde: ['armourer', 'forecourt', 'morning'], corvin: ['master', 'training', 'morning'], pip: ['trinkets', 'lanterns', 'afternoon'], wynn: ['mara', 'district', 'evening'] };
if (kind === 'caught' && !STALL[who]) throw new Error(`who: one of ${Object.keys(STALL).join(', ')}`);
if (kind === 'seize' && !PASSERS[who]) throw new Error(`who: one of ${Object.keys(PASSERS).join(', ')}`);

/** the state the page opens on, for a seed: built by the game's own actions (the theft's draw forced) */
function build(seed) {
  const pre = [];
  let s = G.makeV2(G.newGame(seed >>> 0, 'Aster'));
  const step = (a, rng) => { const r = G.advance(s, a, rng); if (!r.ok) throw new Error(`${a.type}: ${r.reason}`); s = r.state; pre.push(a); };
  const [where, slot] = kind === 'caught' ? STALL[who].slice(1) : [PEOPLE[who].place, (PEOPLE[who].hours ?? ['morning'])[0]];
  while (s.slot !== slot) step({ type: 'wait' });
  if (s.place !== where) step({ type: 'move', to: where });
  if (kind === 'caught') step({ type: 'steal', shop: STALL[who][0] }, LOSE);
  return s;
}
/** Node first: the page's own steps (the fight chosen, or the piece demanded and the passer-by talked to) and the duel the game decides */
function nodeDuel(s0) {
  let s = s0;
  const go = (a) => { const r = G.advance(s, a); if (!r.ok) throw new Error(`Node: ${a.type}: ${r.reason}`); s = r.state; };
  if (kind === 'caught') go({ type: 'fightCatch' }); else { go({ type: 'talk', who }); go({ type: 'seize', who }); }
  return AM.autoOutcome(s, 'challenge');
}
const want = mode === 'win' ? 'player' : 'opponent';
let seed = seedArg ? +seedArg : 0, s0 = null;
for (const k of seed ? [seed] : Array.from({ length: 120 }, (_, i) => i + 1)) { const s = build(k); const o = nodeDuel(s); if (o.winner === want) { seed = k; s0 = s; console.log(`Node: seed ${k}, ${who}: ${o.winner} wins at ${o.duel.t.toFixed(1)} s`); break; } }
if (!s0) { console.log(`KO  no seed ${seedArg ? seedArg : 'of 1 to 120'} gives « ${mode} » against ${who}`); await server.close(); process.exit(1); }
if (kind === 'caught') check(s0.v2.caught?.by === who, `Node: ${who} holds the thief (${JSON.stringify(s0.v2.caught)})`);
const saved = G.serialize(s0), coins0 = s0.player.coins, fine = s0.v2.caught?.fine ?? 0;
const tmpl = NPC_FIGHTERS[who].look.template;

const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: READY });
const errors = [], done = [];
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors.push(e.message); console.log('[pageerror]', e.message); });
  await page.goto(`${BASE}?vis=0`, { waitUntil: 'domcontentloaded', timeout: READY });
  await page.evaluate((t) => localStorage.setItem('cite-du-tournoi.save', t), saved);
  const q = `?play=1&vis=0&noreload=1&lang=${LANG}`;
  const open = async (url) => { await page.goto(`${BASE}${url}`, { waitUntil: 'load', timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); const e = await page.evaluate(() => window.__error ?? null); check(!e, `page ${url} ready${e ? `: ${e}` : ''}`); };
  const run = async (a) => { const r = await page.evaluate((x) => window.__ui.run(x), a); check(r.ok, `run ${JSON.stringify(a).slice(0, 70)}${r.ok ? '' : `: ${r.reason}`}`); if (r.ok) done.push(a); return r; };
  await open(q);
  // journal Passe CH-PNJ: a keeper or a passer-by who is no fighter is stood for on the sand by their champion (« Mara's champion », « Representing Mara »); Wynn of the watch fights himself
  const name = PEOPLE[who].name, isChamp = !!CH.masterOf(who), shown = inLang(() => TXT.word(name)), foe = isChamp ? inLang(() => CH.championName(who)) : shown, rep = isChamp ? inLang(() => CH.championTitle(who)) : '';
  if (kind === 'caught') {
    // the news band read and closed, the holder's band opens by itself: their words, the fine and the fight on its two buttons, their face
    await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
    await page.waitForFunction(() => document.querySelector('.pm-talk[data-caught="1"]'), { timeout: 20000 }).catch(() => null);
    const band = await page.evaluate(() => { const r = document.querySelector('.pm-talk[data-caught="1"]'); return r ? { text: r.textContent, buttons: [...r.querySelectorAll('.pm-btn')].map((x) => x.textContent), face: r.querySelector('img')?.getAttribute('src')?.slice(0, 22) ?? 'none' } : null; });
    check(!!band, 'the holder\'s band opens on the town page by itself');
    if (band) {
      // (a button's price is its tag: « (15 coins) » leaves the label for the tag beside it)
      const pay = say('v2.caught.pay', { name, fine: Math.min(fine, coins0) }), fight = say('v2.caught.fight', { name: foe, fine: 2 * fine }), payWords = pay.replace(/ \([^)]*\)$/, '');
      const payBtn = band.buttons.find((t) => t.startsWith(payWords));
      check(!!payBtn && payBtn.includes(String(Math.min(fine, coins0))) && band.buttons.some((t) => t.includes(fight)), `pay or fight: « ${payBtn} » / « ${fight} » (${JSON.stringify(band.buttons)})`);
      check(!/ (my|mon) (a|an|un|une) /.test(band.text), `the holder's words read: ${band.text.slice(0, 120)}`);
      check(band.text.includes(shown), `${shown} holds you`);
      check(isChamp ? /champion/.test(band.text) : !/champion/.test(band.text), `${shown}'s words ${isChamp ? 'send for their champion' : 'name no champion'}: ${band.text.slice(0, 140)}`);
      check(band.face.startsWith('data:image/png'), `${shown}'s face in the band: ${band.face}`);
    }
    await new Promise((r) => setTimeout(r, 500)); // (the band's fade in)
    await page.screenshot({ path: path.join(outDir, `${kind}-${who}-${mode}-0-held.png`) });
    // the fight chosen through the band's button (an action of the game, replayed)
    const clicked = await page.evaluate((t) => { const x = [...document.querySelectorAll('.pm-talk[data-caught="1"] .pm-btn')].find((y) => y.textContent.includes(t)); x?.click(); return !!x; }, say('v2.caught.fight', { name: foe, fine: 2 * fine }));
    check(clicked, 'the fight chosen');
    done.push({ type: 'fightCatch' });
  } else {
    await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
    const talk = await page.evaluate((w) => { window.__ui.openPerson(w); const r = document.querySelector('.pm-talk'); return { buttons: [...(r?.querySelectorAll('.pm-btn') ?? [])].map((x) => x.textContent), face: r?.querySelector('img')?.getAttribute('src')?.slice(0, 22) ?? 'none' }; }, who);
    const demand = say('v2.seize.label', { item: inLang(() => itemName(PASSERS[who].item)), name, champion: foe });
    const tag = talk.buttons.find((t) => t.includes(demand));
    check(!!tag && /1 (slot|créneau)/.test(tag), `the piece demanded by force, its slot in its tag: ${tag ?? `(none of ${JSON.stringify(talk.buttons)} says « ${demand} »)`}`);
    check(talk.face.startsWith('data:image/png'), `${name}'s face in the dialogue: ${talk.face}`);
    await new Promise((r) => setTimeout(r, 500)); // (the band's fade in)
    await page.screenshot({ path: path.join(outDir, `${kind}-${who}-${mode}-0-talk.png`) });
    done.push({ type: 'talk', who });
    await run({ type: 'seize', who });
    // the sand's door on the list's key
    const label = await page.evaluate(() => { window.__ui.openHere(); const x = [...document.querySelectorAll('.pm-talk .pm-btn.primary')][0]; const t = x?.textContent ?? ''; x?.click(); return t; });
    check(label.includes(say('v2.seize.enter', { name: foe })), `the sand's door: ${label}`);
  }
  // the short sheet before the sand (the operator's GP-13 « Une fiche courte avant un défi », journal Passe GP3: every fight waiting there takes it since this chantier's
  // rebase on it): the townsperson, both fighters' table, what a win and a loss settle; Enter goes onto the sand
  await page.waitForFunction(() => !!document.querySelector('.pm-skills'), { timeout: 5000 }).catch(() => null);
  const sheet = await page.evaluate(() => { const c = document.querySelector('.pm-skills'); return c ? { text: c.textContent, vs: !!c.querySelector('.pm-vs') } : null; });
  check(!!sheet, 'the short sheet opens before the sand (GP-13)');
  if (sheet) {
    const stake = kind === 'caught' ? say('prep.challenge.caught', { item: inLang(() => itemName(s0.v2.caught.item)), fine: 2 * fine })
      : say('prep.challenge.seize', { item: inLang(() => itemName(PASSERS[who].item)), name, n: 10 });
    check(sheet.text.toLowerCase().includes(foe.toLowerCase()) && sheet.vs, `the sheet: ${foe} and both fighters' table`);
    check(!isChamp || sheet.text.includes(rep), `the sheet says who they stand for: ${rep || '(their own fight)'}`);
    check(sheet.text.includes(say(kind === 'caught' ? 'v2.caught.title' : 'v2.seize.title')), 'the sheet says which fight it is');
    check(sheet.text.includes(stake), `what a win and a loss settle: ${stake}`);
    check(!sheet.text.includes(say('v2.result.noVigour')), 'no word of a challenge\'s vigour');
    await new Promise((r) => setTimeout(r, 500)); // (the page's fade in)
    await page.screenshot({ path: path.join(outDir, `${kind}-${who}-${mode}-1-sheet.png`) });
    await page.evaluate(() => document.querySelector('.pm-skills .pm-glist .pm-btn')?.focus());
    await page.keyboard.press('Enter');
  }
  await page.waitForFunction(() => !!window.__go, { timeout: 20000 }).catch(() => null);
  const to = await page.evaluate(() => window.__go);
  check(/scene=arena/.test(to ?? '') && /challenge=1/.test(to ?? ''), `the town goes to ${to}`);
  await open(to);
  const seen = await page.evaluate(() => { const a = window.__arena, st = a.snapshot(); return { names: [a.sim.D.fighters.ren.name, a.sim.D.fighters.marek.name], hp: [a.sim.f.marek.hp, a.sim.f.marek.maxHp], rules: a.rules, stands: !!st.stands, fans: st.fans, empty: !!a.opts.match?.empty, piece: a.opts.match?.piece, hud: document.querySelector('#arena-hud')?.getAttribute('aria-label') ?? '', sub: document.querySelector('#arena-hud')?.textContent ?? '' }; });
  check(seen.rules === 'auto' && seen.names[0] === 'Aster' && seen.names[1].toLowerCase() === foe.toLowerCase(), `the arena seats ${seen.names.join(' vs ')} (${seen.rules})`);
  check(seen.empty && !seen.stands && seen.fans === 0, `the stands empty: no townsfolk (${seen.stands}), no generated spectator (${seen.fans})`);
  check(seen.piece === 'lices', `the lists' piece: ${seen.piece}`);
  check(seen.hp[0] === seen.hp[1], `${foe} at full health: ${seen.hp.join(' / ')}`);
  const title = say(kind === 'caught' ? 'v2.caught.title' : 'v2.seize.title');
  check(seen.hud.includes(title) || seen.sub.includes(title), `the HUD says it: ${title}`);
  check((await page.evaluate(() => document.querySelector('.pm-overlay')?.textContent ?? '')).includes(title), `the gate says which fight it is: ${title}`);
  // the HUD's name stays on one line, whole, in the embedded font at 16 px or more (14 on a phone): a long « Lady Edda's champion » wrapped and pushed the health figure under its bar
  const nm = await page.evaluate(() => { const e = document.querySelector('#ah-marek .ah-nm'), r = e.getBoundingClientRect(), em = e.querySelector('em').getBoundingClientRect(), fs = parseFloat(getComputedStyle(e).fontSize), box = e.parentElement.getBoundingClientRect(); return { h: r.height, fs, emTop: em.top - r.top, right: Math.max(r.right, em.right), cardRight: box.right + 2, w: r.width, scroll: e.scrollWidth }; });
  const phoneSize = W <= 700 || H <= 480;
  // (on a phone held sideways the longest French name, « Le champion de maître Corvin », wraps onto three lines of 14.9 px, whole and clipped by nothing: a recorded limit)
  check(nm.h <= nm.fs * 1.5 * (phoneSize ? 3 : 1) && nm.fs >= (phoneSize ? 14 : 16) && nm.scroll <= nm.w + 1, `the HUD's name ${phoneSize ? 'in at most three lines' : 'on one line'}, ${nm.fs.toFixed(1)} px, ${nm.h.toFixed(0)} px high`);
  const worn = await page.evaluate(() => window.__arena.sheets?.info.sheets.map((s) => `${s.id} ${s.runtimeUse}`).join(', ') ?? 'none');
  check(worn === `hero-x3-combat production, npc-${tmpl}-x3-combat production`, `the sheets worn: ${worn}`);
  await page.screenshot({ path: path.join(outDir, `${kind}-${who}-${mode}-1-gate.png`) });
  const gate = await page.evaluate(() => document.querySelector('.pm-overlay')?.textContent ?? '');
  check(gate.toLowerCase().includes(foe.toLowerCase()) && (!isChamp || gate.includes(rep)), `the gate before the sand says ${foe}${isChamp ? ` and « ${rep} »` : ''}: ${gate.slice(0, 120)}`);
  check(await page.evaluate((t) => document.body.textContent.toLowerCase().includes(t), foe.toLowerCase()), `the HUD names ${foe}`);
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
  await page.evaluate(() => { const a = window.__arena; for (let i = 0; i < 60 * 25; i++) a.update(1 / 60); });
  await page.screenshot({ path: path.join(outDir, `${kind}-${who}-${mode}-2-sand.png`) });
  // the duel the game decides, on the browser's state at the arena (Node's own duel), run to its end
  const atArena = await page.evaluate(() => window.__game.state());
  const node = AM.autoOutcome(atArena, 'challenge');
  const end = await page.evaluate(() => { const a = window.__arena, s = a.sim; for (let i = 0; i < 60 * 600 && !(s.over && document.querySelector('.pm-overlay')); i++) a.update(1 / 60); return { over: s.over, t: s.t }; });
  await page.waitForSelector('.pm-overlay .pm-btn', { timeout: 20000 });
  await page.screenshot({ path: path.join(outDir, `${kind}-${who}-${mode}-3-result.png`) });
  const outcome = await page.evaluate(() => window.__outcome);
  const result = await page.evaluate(() => document.querySelector('.pm-overlay')?.textContent ?? '');
  check(!isChamp || result.toLowerCase().includes(foe.toLowerCase()), `the result screen names ${foe}: ${result.slice(0, 160)}`);
  check(end.over && outcome.winner === want, `the bout ends: ${outcome.winner} wins at ${end.t.toFixed(1)} s`);
  check(outcome.winner === node.winner && outcome.playerHp === node.playerHp && outcome.opponentHp === node.opponentHp, `the arena's duel is the game's (${node.winner} at ${node.duel.t} s)`);
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn').click());
  await open(await page.evaluate(() => window.__go));
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
  const st = await page.evaluate(() => ({ s: window.__game.state(), h: window.__game.hash() }));
  check(!st.s.v2.challenge && !st.s.v2.caught, 'the fight is over, nobody holds the player');
  if (kind === 'caught') check(st.s.player.coins === coins0 - (mode === 'win' ? 0 : Math.min(2 * fine, coins0)), `GP-03: ${mode === 'win' ? 'won, no fine' : 'lost, the fine doubled'}: coins ${coins0} -> ${st.s.player.coins}`);
  else {
    const item = PASSERS[who].item, g = st.s.v2.gear, held = [g.weapon, g.armour, ...g.acc, ...g.bag].includes(item) || st.s.player.items.includes(item);
    check(mode === 'win' ? held && st.s.v2.passed?.[who] === st.s.day && (st.s.v2.marks ?? 0) === 1 : !held && st.s.player.coins === coins0 - Math.min(10, coins0), `GP-01: ${mode === 'win' ? `won, ${item} the player's and a mark` : 'lost, 10 coins on the sand'}`);
  }
  await page.screenshot({ path: path.join(outDir, `${kind}-${who}-${mode}-4-town.png`) });
  // Node replays the page's actions, then the bout's result
  let s = G.deserialize(saved);
  for (const a of done) { const r = G.advance(s, a); check(r.ok, `Node replays ${a.type}${r.ok ? '' : `: ${r.reason}`}`); s = r.state; }
  s = G.advance(s, { type: 'challengeResult', outcome }).state;
  check(G.hash(s) === st.h, `Node replay ${G.hash(s)} = browser ${st.h}`);
  check(errors.length === 0, `no page error (${errors.length})`);
} finally { await b.close(); await server.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
