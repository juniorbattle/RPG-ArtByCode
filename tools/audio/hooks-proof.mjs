// The four effects that no code played (lot S0, journal Passes SN1 / SN2), played by the real game on a DEV server: a button's click, a dialog opening,
// the coins changing, the hero's steps; and the duel's table on the real arena page. Since lot S2 (journal Passe SN19): the interface played by the band's baked
// sounds, a refused action's sound, the steps computed in the page, the rain and the thunder after a flash on a square in a storm. Since lot S5 (journal Passe SN22): the
// refused action 6 dB over the duel's refusal (S5-REFUS), the arena's crowd through its carve at 500 Hz (S5-FOULE). Since lot 4 of the duel played by the computer (journal Passe
// LC6): the arena's duel plays by itself, Ren's charge of a skill heard (its tier's note, its breath, its whip), an enchaînement's later blows their side's plain blow,
// ×2's click from its key, « Skip » taking the music down and the K.O.'s jingle after it. Every effect the page asks for is counted at `Sound.play`. Exit 1 on a failure;
// a page of today's game must have no engine at all.
//   node tools/audio/hooks-proof.mjs     (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/detshots.mjs)
import { createRequire } from 'node:module';
import fs from 'node:fs';

const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720), READY = +(process.env.READY_MS || 300000);
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`], defaultViewport: { width: W, height: H } });
let failed = 0, errors = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const Q = 'play=1&name=Aster&vis=0&fps=off&cutscene=0';
const open = async (page, q) => {
  await page.goto(`${BASE}?${q}`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: READY });
};
const count = (page) => page.evaluate(() => { const s = window.__sound; window.__played = {}; window.__gain = {}; const p = s.play.bind(s); s.play = (e, g, a) => { window.__played[e] = (window.__played[e] ?? 0) + 1; window.__gain[e] = g ?? 1; p(e, g, a); }; });
const played = (page, e) => page.evaluate((x) => window.__played[x] ?? 0, e);
try {
  const page = await b.newPage();
  page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
  await open(page, `${Q}&state=v2-forecourt-morning`);
  await page.waitForFunction('!!window.__sound', { timeout: 30000 });
  await count(page);
  await page.mouse.click(W / 2, H / 2);
  await page.waitForFunction('window.__sound.ctx?.state === "running"', { timeout: 10000 });
  await page.waitForFunction('window.__sound.ui?.size === 4', { timeout: 30000 }).catch(() => {});
  await page.evaluate(() => { const s = window.__sound; window.__takes = {}; const t = s.playTake.bind(s); s.playTake = (takes, key, ...rest) => { window.__takes[key] = (window.__takes[key] ?? 0) + 1; t(takes, key, ...rest); }; });
  await wait(300);
  check(await page.evaluate(() => window.__sound.ui.size) === 4, `the interface's sounds by the band decoded: ${await page.evaluate(() => [...window.__sound.ui.keys()].join(', '))}`);

  // a dialog on the V key (the sound's own panel), a click on one of its buttons
  await page.keyboard.press('v');
  await page.waitForSelector('[role="dialog"]', { timeout: 10000 });
  await wait(150);
  check(await played(page, 'open') >= 1, `a dialog opens: open played ${await played(page, 'open')} time(s)`);
  const n0 = await played(page, 'click');
  // its last button, « Close » (the first is « Mute », which left every later sound of this proof silent until lot S2, journal Passe SN19)
  const box = await page.evaluate(() => { const all = document.querySelectorAll('[role="dialog"] button'), r = all[all.length - 1].getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
  await page.mouse.click(box.x, box.y); await wait(150);
  check(await played(page, 'click') > n0, `a button clicked: click played ${await played(page, 'click')} time(s)`);
  // « Close » closed it (an Escape now would open the game's menu, which holds the hero)
  check(await page.evaluate(() => !document.querySelector('[role="dialog"]') && window.__sound.settings.muted === false), 'the panel closed, the sound not muted by the proof');
  const takes = await page.evaluate(() => window.__takes);
  check(takes.click >= 1 && takes.open >= 1, `the click and the dialog played by the band's takes: ${JSON.stringify(takes)}`);
  // an action the game refuses: the refused command's sound
  const d0 = await played(page, 'denied'), refused = await page.evaluate(() => window.__game.act({ type: 'nonsense' }).ok);
  await wait(100);
  check(refused === false && await played(page, 'denied') === d0 + 1, `a refused action: denied played ${await played(page, 'denied') - d0} time(s)`);
  // S5-REFUS « Le refus 6 dB plus fort hors du duel »: asked 6 dB louder, heard through the interface's take at the level of the sheet (0.58)
  const lift = await page.evaluate(() => window.__gain.denied);
  check(Math.abs(20 * Math.log10(lift) - 6) < 0.01, `a refused action: asked ${(20 * Math.log10(lift)).toFixed(2)} dB over the duel's refusal (target 6)`);

  // the coins move in the save: any action that spends or earns
  await page.evaluate(() => { const g = window.__game; const a = g.actions().find((x) => x.ok && x.coins > 0) ?? null; window.__spent = a ? JSON.stringify({ label: a.label, coins: a.coins, ok: g.act(a.action).ok }) : null; });
  await wait(200);
  const coin = await played(page, 'coin'), spent = await page.evaluate(() => window.__spent);
  console.log(`   an action with coins: ${spent ?? 'none on this state'}`);
  check(!!spent && coin >= 1, `the coins changed: coin played ${coin} time(s)`);

  // the hero walks 4 s
  const before = await page.evaluate(() => ({ x: window.__plaza.player.pos.x, z: window.__plaza.player.pos.z }));
  await page.keyboard.down('d'); await wait(4000); await page.keyboard.up('d');
  const after = await page.evaluate(() => ({ x: window.__plaza.player.pos.x, z: window.__plaza.player.pos.z })), dist = Math.hypot(after.x - before.x, after.z - before.z), steps = await played(page, 'step');
  check(steps >= Math.floor(dist) - 1 && steps > 0, `${dist.toFixed(1)} m walked: step played ${steps} time(s)`);
  const made = await page.evaluate(() => [...window.__sound.madeBufs.keys()].filter((k) => k.startsWith('step-')));
  check(made.length >= 2 && made.every((k) => k.startsWith('step-stone')), `the steps on the forecourt's setts, computed in the page: ${made.join(', ')}`);

  // a square in a storm (lot S2): the rain over it, its patter made a few milliseconds at a time, the thunder after a flash the square shows
  // every buffer a source starts, to find the patter's and the thunder's among them: set before the page, whose sound may come up by itself (a gesture earlier in the tab)
  await page.evaluateOnNewDocument(() => { window.__started = []; const st = AudioBufferSourceNode.prototype.start; AudioBufferSourceNode.prototype.start = function (...a) { window.__started.push(this.buffer); return st.apply(this, a); }; });
  await open(page, `${Q}&state=v2-square-afternoon&rain=0.6&storm=1`);
  await page.waitForFunction('!!window.__sound', { timeout: 30000 });
  await page.mouse.click(W / 2, H / 2);
  await page.waitForFunction('window.__sound.ctx?.state === "running"', { timeout: 10000 });
  await page.waitForFunction('window.__sound.madeBufs.has("patter:0")', { timeout: 30000 }).catch(() => {});
  const weather = await page.evaluate(() => ({ w: window.__sound.amb?.weather, patter: window.__sound.madeBufs.has('patter:0'), group: !!window.__sound.ambGroup }));
  check(weather.w?.rain === 0.6 && weather.w?.thunder === true && weather.patter && weather.group, `the storm heard: ${JSON.stringify(weather)}`);
  await page.evaluate(() => { const s = window.__sound; window.__thunder = []; const t = s.thunder.bind(s); s.thunder = (level) => { window.__thunder.push(level); t(level); }; window.__plaza.weather.strike(0); });
  await wait(6000);
  const thunder = await page.evaluate(() => { const m = window.__sound.madeBufs, started = (k) => window.__started.includes(m.get(k)); return { asked: window.__thunder, made: [...m.keys()].filter((k) => k.startsWith('thunder:')), played: [...m.keys()].filter((k) => k.startsWith('thunder:') && started(k)), patter: started('patter:0') }; });
  check(thunder.asked.length >= 1 && thunder.made.length >= 1, `a flash: thunder asked at ${thunder.asked.map((x) => x.toFixed(2)).join(', ')}, takes made ${thunder.made.join(', ')}`);
  check(thunder.played.length >= 1 && thunder.patter, `the thunder started (${thunder.played.join(', ')}), the patter started (${thunder.patter})`);

  // the arena of a version 2 duel (journal Passe SN16): the band's sounds and the crowd decoded after the gesture, the duel's events played through them, lot S0's
  // recipes no more; the count of sounds from the catalogue's own table
  const table = JSON.parse(fs.readFileSync(new URL('../../src/audio/catalogue.json', import.meta.url), 'utf8')).sfx;
  await page.goto(`${BASE}?scene=arena&v2=1&vis=0&fps=off`, { waitUntil: 'load', timeout: READY });
  await page.waitForFunction('!!window.__arena && !!window.__sound', { timeout: READY });
  await page.mouse.click(W / 2, H / 2);
  await page.waitForFunction('window.__sound.ctx?.state === "running"', { timeout: 10000 });
  await page.waitForFunction('window.__sound.bank?.size > 0', { timeout: 60000 });
  await page.evaluate(() => {
    const s = window.__sound; window.__cues = {}; window.__old = 0; window.__ui = {}; window.__evs = []; window.__stings = [];
    const c = s.cue.bind(s); s.cue = (q) => { window.__cues[q.id] = (window.__cues[q.id] ?? 0) + 1; return c(q); };
    const p = s.play.bind(s); s.play = (e, g, a) => { if (e === 'click') window.__ui[e] = (window.__ui[e] ?? 0) + 1; else window.__old++; p(e, g, a); };
    const d = s.duelEvent.bind(s); s.duelEvent = (e) => { window.__evs.push({ type: e.type, follow: e.follow, action: e.action, from: e.from, result: e.result, sign: e.sign }); d(e); };
    const st = s.sting.bind(s); s.sting = (id) => { window.__stings.push(id); st(id); };
  });
  // the duel plays by itself (lot 2), from its start again (the form of the day's sign comes in its first second, journal Passe LC7): twelve seconds of it, then ×2
  // from its key (the attack's), then « Skip » (the dodge's)
  await page.evaluate(() => window.__arena.restart());
  await wait(12000);
  const arena = await page.evaluate(() => { const c = window.__sound.crowd; return { bank: window.__sound.bank.size, crowd: !!c, carve: c instanceof BiquadFilterNode ? { type: c.type, hz: c.frequency.value, q: c.Q.value, db: c.gain.value } : null, cues: window.__cues, old: window.__old, evs: window.__evs }; });
  console.log(`   the arena's sounds played: ${JSON.stringify(arena.cues)}`);
  const duel = Object.values(table).filter((e) => e.family !== 'interface').length;
  check(arena.bank === duel, `the arena: ${arena.bank} of the catalogue's ${duel} duel sounds decoded (the interface apart)`);
  check(arena.crowd, 'the arena: its crowd in place of the rumble');
  // S5-FOULE « Creuser la foule à 500 Hz »: the crowd's way in, a peaking filter at 500 Hz, Q 1, -5 dB
  check(arena.carve?.type === 'peaking' && arena.carve.hz === 500 && arena.carve.q === 1 && arena.carve.db === -5, `the arena: its crowd carved, ${JSON.stringify(arena.carve)}`);
  check(Object.values(arena.cues).reduce((a, n) => a + n, 0) > 0 && arena.old === 0, `the duel's events in the band's sounds (${Object.values(arena.cues).reduce((a, n) => a + n, 0)}), lot S0's recipes ${arena.old} time(s)`);
  // lot 4: Ren's charge of a skill told and heard, an enchaînement's later blows their side's plain blow
  const told = (t) => arena.evs.filter((e) => e.type === t).length, notes = ['charge1', 'charge2', 'charge3'].reduce((a, k) => a + (arena.cues[k] ?? 0), 0), breaths = ['hold1', 'hold2', 'hold3'].reduce((a, k) => a + (arena.cues[k] ?? 0), 0);
  check(told('chargeTier') >= 1 && notes === told('chargeTier'), `Ren's charge of a skill: ${told('chargeTier')} told, ${notes} tier's note(s)`);
  check(breaths >= 1 && (arena.cues.release ?? 0) === told('chargeRelease') && told('chargeRelease') >= 1, `its breath (${breaths}) and its whip at each release (${arena.cues.release ?? 0} for ${told('chargeRelease')})`);
  const follows = arena.evs.filter((e) => e.type === 'impact' && e.follow && e.result === 'hit');
  check(follows.length >= 1, `an enchaînement's later blows told (${follows.length}): ${[...new Set(follows.map((e) => e.action))].join(', ')}`);
  // the form of the day's sign (LC6-7 « Les deux signes »): told for each fighter in good or poor form, its notes computed in the page once (this duel: both in good form)
  const forms = await page.evaluate(() => ({ told: window.__evs.filter((e) => e.type === 'formSign').length, made: [...window.__sound.madeBufs.keys()].filter((k) => k.startsWith('form:')) }));
  check(forms.told === 2 && forms.made.join() === 'form:formUp', `the form of the day: ${forms.told} sign(s) told, computed ${forms.made.join(', ')}`);
  // ×2 from its key: the interface's click once, the arena's clock twice as fast
  const c0 = await page.evaluate(() => window.__ui.click ?? 0);
  await page.keyboard.press('j'); await wait(300);
  const sp = await page.evaluate(() => ({ click: window.__ui.click ?? 0, speed: window.__arena.speed }));
  check(sp.click === c0 + 1 && sp.speed === 2, `×2 from its key: the click played ${sp.click - c0} time(s), the speed ${sp.speed}`);
  // « Skip »: the music down with the curtain, the K.O. told under the black, its jingle after it
  await page.keyboard.press('l'); await wait(2600);
  const sk = await page.evaluate(() => ({ layered: !!window.__sound.layered, ko: window.__evs.filter((e) => e.type === 'ko').length, skip: window.__evs.filter((e) => e.type === 'skip').length, stings: window.__stings }));
  check(sk.skip === 1 && !sk.layered && sk.ko === 1 && (sk.stings[0] === 'victoire' || sk.stings[0] === 'defaite'), `« Skip »: told ${sk.skip}, the music ${sk.layered ? 'still playing' : 'stopped'}, the K.O. told ${sk.ko}, the jingle ${sk.stings.join(', ')}`);

  // today's game: no engine at all
  await open(page, 'play=1&new=1&name=Aster&vis=0&fps=off&v2=0');
  await wait(1000);
  check(await page.evaluate(() => !window.__sound), 'a game of today has no sound engine');
} finally { await b.close(); }
check(errors === 0, `no page error (${errors})`);
console.log(failed ? `\nFAILED ${failed}` : '\nall checks passed');
if (failed) process.exitCode = 1;
