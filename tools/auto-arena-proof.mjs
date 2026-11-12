// The duel played by the computer in a browser (lot 2 of briefs/combat-auto.md § 17.3, journal Passe LC3), on a running DEV server (named states):
// 1. the arena's own page (`?scene=arena`, Ren against each rival with DEV `foe=<id>`, the loop held): the HUD of the duel (both cards with their charge on the
//    timeline, Ren's four skills in his order, ×2 and « Skip » with their keys), the approved sheets worn, every step of the whole duel drawn with baked frames
//    only (no generated frame beside a sheet, as tools/arena-sheet-proof.mjs), every scripted moment (`jump`) without a page error, the replay ending on the
//    duel's own result, ×2 doubling the duel's clock on the page's own loop, « Skip » reaching the K.O. under its black curtain; the bodies on the floor never
//    jumping between two frames (journal Passe LC4: the lunge and the knock-back, at most 0.6 m a frame at 60 fps) and each blow landing drawn;
// 2. a version 2 game's match sheet (the named state `v2-day2-afternoon`): its table of both fighters against Node's own fighters for that bout (the health of the
//    bout, the four stats, the forms of the day, the dodge and the guard), the rival's training points, the order shown; the order set with the player's left
//    key, kept in the game; the arena then plays the duel of that order (its result against Node's on the same state), « Skip », the result in the state, and
//    Node's replay of the browser's actions gives the same fingerprint.
//   node tools/auto-arena-proof.mjs <outDir> [rival ...]   (BASE_URL, CHROME_PATH / READY_MS as tools/detshots.mjs; PAGE_LANG=fr every page in French, the sheet
//   checked against the French table (journal Passe LC5); REDUCED=1 the game's reduced motion on (RG-5); MOTION=reduce|no-preference the system's); exit 1 on a failure
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const [outDir, ...rest] = process.argv.slice(2);
if (!outDir) throw new Error('usage: node tools/auto-arena-proof.mjs <outDir> [rival ...]');
const RIVALS = rest.length ? rest : ['marek', 'vessa', 'orla', 'cassius', 'ilse', 'rhosk', 'tobin'];
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', READY = +(process.env.READY_MS || 300000);
const L = process.env.PAGE_LANG === 'fr' ? 'fr' : 'en', REDUCED = process.env.REDUCED === '1', MOTION = process.env.MOTION;
console.log(`   language ${L}, the game's reduced motion ${REDUCED ? 'on' : 'off'}, the system's ${MOTION ?? 'as headless Chrome reports it'}`);
/** a page as this run wants it: the game's reduced motion, the system's */
async function prepare(page) {
  if (REDUCED) await page.evaluateOnNewDocument(() => { try { const k = 'cite-du-tournoi.settings', s = JSON.parse(localStorage.getItem(k) ?? '{}'); if (s.reducedMotion !== true) localStorage.setItem(k, JSON.stringify({ ...s, reducedMotion: true })); } catch { /* none */ } });
  if (MOTION) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: MOTION }]);
}
fs.mkdirSync(outDir, { recursive: true });
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1280,720', '--hide-scrollbars'], defaultViewport: { width: 1280, height: 720 }, protocolTimeout: READY });
let failed = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const server = await createServer({ root: path.resolve(import.meta.dirname, '..'), configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
try {
  const AV = await server.ssrLoadModule('/src/arena/autoView.ts'), G = await server.ssrLoadModule('/src/simulation/index.ts'), AM = await server.ssrLoadModule('/src/combat/autoMatch.ts'), T = await server.ssrLoadModule('/src/narrative/text/index.ts'), { FR } = await server.ssrLoadModule('/src/narrative/text/fr.ts');
  /** the game's words in the page's language */
  const inLang = (f) => { T.useLanguage(L, L === 'fr' ? FR : undefined); try { return f(); } finally { T.useLanguage('en'); } };
  // 1. the arena's own page, each rival
  for (const foe of RIVALS) {
    const page = await b.newPage(), errors = [];
    await prepare(page);
    await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
    page.on('pageerror', (e) => errors.push(e.message));
    // the loop held (the steps are the proof's own)
    await page.evaluateOnNewDocument(`Object.defineProperty(window, '__arena', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__arena', { value: v, writable: true, configurable: true }); } })`);
    await page.goto(`${BASE}?scene=arena&foe=${foe}&freeze=7.3&time=midday&lang=${L}`, { waitUntil: 'load', timeout: READY });
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
    const err = await page.evaluate(() => window.__error ?? null); check(!err, `${foe}: the page ready${err ? `: ${err}` : ''}`);
    const r = await page.evaluate(() => {
      const A = window.__arena, frames = A.set.atlas.frames, off = [], seen = { ren: new Set(), marek: new Set() };
      const drawn = (where) => { for (const id of ['ren', 'marek']) { const anim = A.fighters[id].anim, f = frames.get(`${id}/side/${anim}/0`); seen[id].add(anim); if (!f || !f.cell) off.push(`${where}: ${id} ${anim}`); } };
      const hud = document.querySelector('#arena-hud'), slots = [...hud.querySelectorAll('.ah-b.slot')].map((x) => x.dataset.slot), ctl = [...hud.querySelectorAll('.ah-b.ctl')].map((x) => `${x.dataset.act}:${x.querySelector('kbd')?.dataset.bind}`);
      const moments = A.presetNames(), jumped = [];
      for (const m of moments) { if (A.jump(m)) { A.renderOnce(); drawn(m); jumped.push(m); } }
      // the whole duel at the arena's step, from the start, the page's own presentation each step
      A.auto.reset(); A.onEvents(A.auto.drain()); A.paused = false; A.moment = false; A.hud?.still(false);
      const cards = [0, 0]; let steps = 0;
      // the bodies on the floor (journal Passe LC4): each fighter's lunge and knock-back between two frames (its sprite's own shift, the sheets' push
      // compensation, left out: the body stays where it was), and each blow drawn when it lands
      const P = A.pres, body = { ren: { max: 0, snaps: 0, prev: null }, marek: { max: 0, snaps: 0, prev: null } }, landed = { n: 0, bad: [] }, impacts = [];
      const on = A.onEvents; A.onEvents = function (evs) { on.call(this, evs); for (const e of evs) if (e.type === 'impact') impacts.push(e); };
      for (let i = 0; !A.auto.over && i < 3e5; i++) {
        impacts.length = 0;
        A.update(1 / 60); drawn(`t ${A.auto.t.toFixed(1)}`);
        for (const id of ['ren', 'marek']) { const x = P[id].off + P[id].knock, o = body[id]; if (o.prev !== null) { const d = Math.abs(x - o.prev); o.max = Math.max(o.max, d); if (d > 0.6) o.snaps++; } o.prev = x; }
        for (const e of impacts) { landed.n++; if (A.sim.f[e.from].state !== 'acting' && landed.bad.length < 3) landed.bad.push(`${A.auto.t.toFixed(2)} ${e.from} ${e.action} ${A.sim.f[e.from].anim.name}`); }
        ['#ah-ren .ah-ch', '#ah-marek .ah-ch'].forEach((q, k) => { const c = hud.querySelector(q); if (!c.classList.contains('off') && /^(Charging|Charge\s?:)\s?\S/.test(c.textContent)) cards[k] = (cards[k] ?? 0) + 1; });
        steps = i + 1;
      }
      A.onEvents = on;
      for (let i = 0; i < 120; i++) A.update(1 / 60);
      const res = A.auto.result, end = { t: A.auto.end, winner: A.auto.winner, ren: A.auto.f.ren.hp, marek: A.auto.f.marek.hp, ko: hud.querySelector('#ah-ko')?.textContent };
      // ×2: the duel's clock twice as fast on the page's own loop; « Skip »: the K.O. at once
      A.auto.reset(); A.auto.drain(); A.speed = 1;
      for (let i = 0; i < 60; i++) A.update(1 / 60);
      const t1 = A.auto.t; A.action('attack', true);
      for (let i = 0; i < 60; i++) A.update(1 / 60);
      const t2 = A.auto.t - t1, fast = A.speed; A.action('attack', true);
      // « Skip » behind the black: the curtain down before the duel jumps, its K.O. reached under it, then lifted and gone (on the arena's own clock)
      const fade = { maxOp: 0, overAt: -1, opAtOver: -1, frames: 0 };
      A.action('dodge', true);
      for (let i = 0; i < 60; i++) {
        A.update(1 / 60);
        const el = document.querySelector('.ar-skip-fade'), op = el ? +el.style.opacity : 0;
        fade.maxOp = Math.max(fade.maxOp, op); if (el) fade.frames = i + 1;
        if (A.auto.over && fade.overAt < 0) { fade.overAt = i; fade.opAtOver = op; }
      }
      fade.left = !!document.querySelector('.ar-skip-fade');
      const PT = A.set.portraits;
      return { steps, slots, ctl, jumped, moments: moments.length, off: off.slice(0, 6), nOff: off.length, ren: seen.ren.size, marek: seen.marek.size, cards, end, res: { hp: res.hp, winner: res.winner, t: res.t }, t1, t2, fast, skipped: { over: A.auto.over, t: A.auto.t }, fade, body: { ren: [body.ren.max, body.ren.snaps], marek: [body.marek.max, body.marek.snaps] }, landed, sheets: A.sheets?.info.sheets.map((s) => `${s.id} ${s.runtimeUse}`), face: [PT.ren?.width, PT.marek?.width] };
    });
    const sc = AV.sceneAutoDuel(foe);
    check(JSON.stringify(r.res) === JSON.stringify({ hp: sc.result.hp, winner: sc.result.winner, t: sc.result.t }), `${foe}: the page's duel is Node's (${r.res.winner === 0 ? 'Ren' : r.res.winner === 1 ? foe : 'decided on health'} at ${r.res.t} s, ${r.res.hp.join(' / ')})`);
    check(r.end.ren === r.res.hp[0] && r.end.marek === r.res.hp[1] && /Victory|Defeat|Victoire|Défaite/.test(r.end.ko ?? ''), `${foe}: the replay ends on it (${r.end.ko})`);
    check(r.slots.join() === sc.ren.skills.map((a) => a.id).join() && r.ctl.join() === 'speed:attack,skip:dodge', `${foe}: the foot: ${r.slots.join(', ')} | ${r.ctl.join(', ')}`);
    check(r.cards[0] > 0.6 * r.steps && r.cards[1] > 0.6 * r.steps, `${foe}: each card shows its charge on the timeline (Ren ${Math.round(100 * r.cards[0] / r.steps)} %, ${foe} ${Math.round(100 * r.cards[1] / r.steps)} % of the steps)`);
    check(r.sheets?.join(', ') === `hero-x3-combat production, ${foe}-x3-combat production` && r.face[1] === 32, `${foe}: the sheets worn: ${r.sheets?.join(', ')}; faces ${r.face}`);
    check(r.nOff === 0, `${foe}: every step drawn with baked frames (${r.ren} of Ren's, ${r.marek} of ${foe}'s)${r.nOff ? `: ${r.off.join('; ')}` : ''}`);
    check(r.jumped.length >= 8, `${foe}: ${r.jumped.length} of ${r.moments} scripted moments (${r.jumped.join(', ')})`);
    check(r.fast === 2 && Math.abs(r.t2 - 2 * r.t1) < 0.05, `${foe}: ×2 doubles the clock (${r.t1.toFixed(2)} s then ${r.t2.toFixed(2)} s for 1 s)`);
    check(r.skipped.over && Math.abs(r.skipped.t - r.end.t) < 0.5, `${foe}: « Skip » reaches the K.O. (${r.skipped.t.toFixed(1)} s)`);
    check(r.fade.maxOp === 1 && r.fade.opAtOver === 1 && r.fade.overAt >= 10 && !r.fade.left && r.fade.frames <= 40, `${foe}: « Skip » behind the black: the K.O. reached under the curtain at frame ${r.fade.overAt} (opacity ${r.fade.opAtOver}), lifted and gone after ${r.fade.frames} frames`);
    check(r.body.ren[1] === 0 && r.body.marek[1] === 0 && r.body.ren[0] <= 0.6 && r.body.marek[0] <= 0.6, `${foe}: the bodies never jump on the floor (largest step ${r.body.ren[0].toFixed(2)} m for Ren, ${r.body.marek[0].toFixed(2)} m for ${foe}, a frame at 60 fps)`);
    check(r.landed.n > 50 && r.landed.bad.length === 0, `${foe}: each of ${r.landed.n} blows lands drawn${r.landed.bad.length ? `: ${r.landed.bad.join('; ')}` : ''}`);
    check(errors.length === 0, `${foe}: no page error${errors.length ? `: ${errors.slice(0, 2).join(' | ')}` : ''}`);
    if (foe === RIVALS[0]) {
      for (const m of ['renCharge', 'foeCharge', 'renSkill', 'break', 'ko']) { await page.evaluate((x) => window.__arena.jump(x) && window.__arena.renderOnce(), m); await page.screenshot({ path: path.join(outDir, `arena-${foe}-${m}.png`) }); }
      // the pause and its settings line
      const pz = await page.evaluate(() => { const A = window.__arena; A.auto.reset(); A.paused = false; A.moment = false; A.action('pause', true); A.update(0); return document.querySelector('#ah-pause')?.classList.contains('on'); });
      check(pz, 'the pause: its screen');
      await page.screenshot({ path: path.join(outDir, 'arena-pause.png') });
    }
    await page.close();
  }

  // 2. a version 2 game's match sheet, its order, the bout that follows
  const page = await b.newPage(), errors = [], actions = [];
  await prepare(page);
  await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
  page.on('pageerror', (e) => errors.push(e.message));
  const open = async (q) => { await page.goto(`${BASE}${q}`, { waitUntil: 'load', timeout: READY }); await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY }); const e = await page.evaluate(() => window.__error ?? null); check(!e, `page ${q} ready${e ? `: ${e}` : ''}`); };
  await page.goto(BASE, { waitUntil: 'load', timeout: READY }); await page.evaluate(() => localStorage.clear());
  await open(`?play=1&state=v2-day2-afternoon&tutorial=0&noreload=1&vis=0&lang=${L}`);
  const st0 = await page.evaluate(() => window.__game.state());
  await page.evaluate((enter) => { document.querySelectorAll('.pm-news .pm-btn, .pm-overlay .pm-btn.primary').forEach((x) => x.click()); window.__ui.openHere(); [...document.querySelectorAll('.pm-talk .pm-btn')].find((x) => x.textContent.includes(enter))?.click(); }, inLang(() => T.tx('ui.enterArena')));
  const sheet = await page.evaluate(() => ({ rows: [...document.querySelectorAll('.pm-vs tbody tr')].map((tr) => [...tr.children].map((td) => td.textContent)), order: [...document.querySelectorAll('.pm-ladder2 dt')].map((x) => x.textContent), text: document.querySelector('.pm-skills')?.textContent ?? '', foe: document.querySelector('.pm-foe .pm-h')?.textContent ?? '' }));
  const bout = AM.autoBoutOf(st0), forms = AM.autoForms(bout), rr = AM.autoReactions(bout.ren, bout.foe), fr = AM.autoReactions(bout.foe, bout.ren);
  const pc = (k) => inLang(() => T.tx('auto.sheet.pct', { n: Math.round(k * 100) })), sg = (f) => `${f >= 1 ? '+' : '−'}${pc(Math.abs(f - 1))}`, n1 = (x) => inLang(() => T.num(+x.toFixed(1)));
  const lb = (k) => inLang(() => T.tx(k));
  const want = [
    [lb('auto.sheet.hp'), String(Math.round(bout.ren.hp * 2)), String(Math.round(bout.foe.hp * 2))], [lb('stat.atk'), n1(bout.ren.atk), n1(bout.foe.atk)], [lb('stat.def'), n1(bout.ren.def), n1(bout.foe.def)],
    [lb('stat.end'), n1(bout.ren.end), n1(bout.foe.end)], [lb('stat.viv'), n1(bout.ren.viv), n1(bout.foe.viv)], [lb('auto.sheet.form'), sg(forms[0]), sg(forms[1])],
    [lb('auto.sheet.dodge'), pc(rr.dodge), pc(fr.dodge)], [lb('auto.sheet.guard'), `${pc(rr.guard)} · ${pc(rr.guardSkill)}`, `${pc(fr.guard)} · ${pc(fr.guardSkill)}`],
  ];
  check(JSON.stringify(sheet.rows) === JSON.stringify(want), `the match sheet's table is the duel's fighters: ${sheet.rows.map((r) => r.join(' ')).join(' | ')}`);
  check(bout.prep < 0.05 || sheet.text.includes(inLang(() => T.tx('auto.sheet.prep', { name: sheet.foe, n: T.num(+bout.prep.toFixed(1)) }))), `the rival's training as Attack points (${+bout.prep.toFixed(1)})`);
  check(sheet.order.join() === inLang(() => [...bout.ren.skills.map((x, i) => `${i + 1}. ${T.skillName(x.id)}`), T.tx('ui.skill.light')].join()), `the order shown: ${sheet.order.join(', ')}`);
  await page.screenshot({ path: path.join(outDir, 'sheet-1.png') });
  // the order set at the keyboard: the last skill one place earlier (the player's left key)
  const last = bout.ren.skills[3].id;
  const names = await page.evaluate(() => [...document.querySelectorAll('.pm-glist .pm-btn')].map((x) => x.textContent));
  const idx = names.findIndex((t) => t.startsWith(inLang(() => T.skillName(last))));
  await page.focus(`.pm-glist .pm-btn:nth-child(${idx + 1})`);
  await page.keyboard.press('ArrowLeft');
  const st1 = await page.evaluate(() => window.__game.state());
  const order = st1.v2.kit.order ?? [];
  check(order[2] === last && order.length === 4, `ArrowLeft sets the order in the game: ${order.join(', ')}`);
  actions.push({ type: 'setOrder', skills: order });
  await page.screenshot({ path: path.join(outDir, 'sheet-2-order.png') });
  await page.keyboard.press('Enter');
  const to = await page.evaluate(() => window.__go);
  check(/scene=arena/.test(to ?? ''), `the sheet enters the arena: ${to}`);
  await open(to);
  const a = await page.evaluate(() => { const A = window.__arena; return { rules: A.rules, order: A.auto.fighters.ren.skills.map((x) => x.id), end: A.auto.end, hp: A.auto.result.hp }; });
  const node = AM.autoOutcome(G.advance(st0, { type: 'setOrder', skills: order }).state);
  check(a.rules === 'auto' && a.order.join() === order.join(), `the arena plays the order set: ${a.order.join(', ')}`);
  check(a.end === node.duel.t && a.hp.join() === [node.playerHp, node.opponentHp].join(), `the arena's duel is Node's on that state (${a.end} s, ${a.hp.join(' / ')})`);
  await page.evaluate(() => document.querySelector('.pm-overlay .pm-btn')?.click());
  await page.evaluate(() => { const A = window.__arena; A.update(1 / 60); A.action('dodge', true); for (let i = 0; i < 400 && !document.querySelector('.pm-overlay .pm-btn'); i++) A.update(1 / 60); });
  await page.waitForSelector('.pm-overlay .pm-btn', { timeout: 20000 });
  await page.screenshot({ path: path.join(outDir, 'sheet-3-result.png') });
  const outcome = await page.evaluate(() => window.__outcome), h = await page.evaluate(() => window.__game.hash());
  let s = G.advance(st0, actions[0]).state;
  s = G.advance(s, { type: 'fight', outcome }).state;
  check(G.hash(s) === h, `Node replay ${G.hash(s)} = browser ${h}`);
  check(outcome.winner === node.winner && outcome.playerHp === node.playerHp, `the result is the duel's: ${outcome.winner}`);
  check(errors.length === 0, `no page error (${errors.length})${errors.length ? `: ${errors.slice(0, 2).join(' | ')}` : ''}`);
  await page.close();
} finally { await server.close(); await b.close(); }
console.log(failed ? `${failed} check(s) failed` : 'all checks passed');
process.exit(failed ? 1 : 0);
