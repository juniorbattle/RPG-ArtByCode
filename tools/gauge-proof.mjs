// The break gauge at the blow, frame by frame in a browser (journal Passe LC7; the operator, word for word, 12/11/2026: « apparemment on a la jauge de break qui semble
// avoir du retard lors des actions/coups executes surtout lorsqu'il y a des combos »): the arena's own page of the duel played by the computer, its loop held, stepped
// at 60 frames a second through the arena's own update; at each frame, the blows the frame tells (the arena's `onDuelEvents`) and both cards' gauge bar as the page lays
// it out (its width against its trough, `#ah-<who> .ah-rb i`). Against the duel's script alone (its log and its trace: the gauge after a line is the next line's trace,
// its decay undone, full at a break):
//   - at every frame, each bar shows the script's gauge at the arena's time (to the bar's rounding, a whole percent);
//   - each blow that moves a bar moves it ON ITS OWN FRAME (the frame that tells the blow), counted by kind: an enchaînement's later blows, the last blow of an
//     enchaînement of two and of three, a blow on a ward, a blow under its striker's boost.
// On a base before lot 4 (journal Passe LC6) it must fail: an enchaînement's blows showed the blow before.
//   node tools/gauge-proof.mjs [--secs=240] ["<foe>[|<extra query>]" ...]     (DEV server: `weapon=` / `kit=` for Ren's three-blow enchaînements; BASE_URL, CHROME_PATH)
// Exit 1 on a failure.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const args = process.argv.slice(2), opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const SECS = +opt('secs', 240), BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const CASES = args.filter((a) => !a.startsWith('--'));
if (!CASES.length) CASES.push('marek', 'vessa', 'orla', 'rhosk', ...['marek', 'vessa', 'orla', 'rhosk'].map((f) => `${f}|weapon=duelist-sabre&kit=t3,k_cry,k_iron,t1`));
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1280,720'], defaultViewport: { width: 1280, height: 720 }, protocolTimeout: 600000 });
let failed = 0, errors = 0;
const check = (ok, what) => { console.log(`${ok ? 'OK ' : 'KO '} ${what}`); if (!ok) failed++; };
const total = { blows: 0, moved: 0, onFrame: 0, later: 0, last2: 0, last3: 0, ward: 0, boost: 0, frames: 0, off: 0 };
try {
  for (const c of CASES) {
    const [foe, extra] = c.split('|');
    const page = await b.newPage();
    page.on('pageerror', (e) => { errors++; console.log('[pageerror]', e.message); });
    await page.evaluateOnNewDocument(() => Object.defineProperty(Navigator.prototype, 'getGamepads', { configurable: true, value: () => [] }));
    // the loop held: the proof steps the arena itself
    await page.evaluateOnNewDocument(`Object.defineProperty(window, '__arena', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__arena', { value: v, writable: true, configurable: true }); } });`);
    await page.goto(`${BASE}?scene=arena&foe=${foe}&vis=0&fps=off&lang=en${extra ? '&' + extra : ''}`, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction('window.__ready === true || window.__error', { timeout: 300000 });
    const script = await page.evaluate(() => {
      const a = window.__arena.auto, f = a.fighters;
      const acts = (x) => Object.fromEntries([x.light, x.heavy, ...x.skills].filter(Boolean).map((y) => [y.id, { hits: (y.hits ?? [1]).length, ward: y.ward?.dur ?? 0, boost: y.boost?.dur ?? 0 }]));
      return { log: a.result.log, ids: { ren: f.ren.id, marek: f.marek.id }, acts: { ren: acts(f.ren), marek: acts(f.marek) }, end: a.end };
    });
    // the frames: the blows each tells, both bars as laid out
    const frames = await page.evaluate((secs) => {
      const A = window.__arena, out = [];
      let q = []; A.onDuelEvents = (evs) => { for (const e of evs) if (e.type === 'impact' || e.type === 'break' || e.type === 'ko') q.push({ type: e.type, from: e.from, to: e.to, who: e.who, result: e.result, follow: !!e.follow, action: e.action }); };
      const bar = (who) => { const i = document.querySelector(`#ah-${who} .ah-rb i`), t = document.querySelector(`#ah-${who} .ah-rb`); return t && i ? Math.round((i.getBoundingClientRect().width / t.getBoundingClientRect().width) * 1000) / 10 : null; };
      for (let k = 0; k < secs * 60 && !A.auto.over; k++) { A.update(1 / 60); out.push({ t: A.auto.t, evs: q, ren: bar('ren'), marek: bar('marek') }); q = []; }
      return out;
    }, SECS);
    // the script's gauge after each line, for each seat (index 1 Ren, 3 the opponent in the trace), and its value at a time
    const L = script.log, seatOf = (who) => (who === script.ids.ren ? 'ren' : 'marek'), K = { ren: 1, marek: 3 }, MAX = 70, DECAY = 0.63;
    // a line's trace is written before its blow fills the target's gauge (src/combat/auto.ts): after a blow on that seat, the next line's trace with its decay undone (full
    // at its break); after any other line, its own trace
    const after = (i, k) => {
      const e = L[i], n = L[i + 1];
      if (e.s[k] >= MAX) return MAX;
      const onSeat = (e.ev === 'hit' || e.ev === 'guarded') && (k === 1) !== (e.who === script.ids.ren);
      if (!onSeat || !n) return e.s[k];
      if (n.ev === 'break' && n.s[k] >= MAX) return MAX;
      return n.s[k] > 0 ? Math.min(MAX, n.s[k] + DECAY * (n.t - e.t)) : e.s[k];
    };
    /** the script's gauge of a seat at time t, in percent of DB5-4's 70: full while it is stunned (10 s after its break), empty from its stun's end until the next line,
     *  else the gauge after the last line, decaying */
    const expected = (seat, t) => {
      let i = -1; for (let j = 0; j < L.length && L[j].t <= t + 1e-9; j++) i = j;
      if (i < 0) return 0;
      let stunEnd = -1; for (let j = 0; j <= i; j++) if (L[j].ev === 'break' && seatOf(L[j].who) === seat) stunEnd = L[j].t + 10;
      if (t < stunEnd - 1e-9) return 100;
      if (stunEnd > L[i].t) return 0;
      return (Math.max(0, after(i, K[seat]) - DECAY * (t - L[i].t)) / MAX) * 100;
    };
    // the wards and boosts under way, from the script
    const eff = []; for (const e of L) if (e.ev === 'ward' || e.ev === 'boost') { const s = seatOf(e.who), a = script.acts[s][e.act]; eff.push({ s, kind: e.ev, from: e.t, to: e.t + (a.ward || a.boost) }); }
    const on = (s, kind, t) => eff.some((x) => x.s === s && x.kind === kind && x.from <= t && t < x.to);
    // each blow line in order, matched to the impacts the frames told
    const blowLines = L.map((e, i) => ({ e, i })).filter(({ e }) => e.ev === 'hit' || e.ev === 'guarded' || e.ev === 'dodged');
    let bi = 0, off = 0, worst = 0; const offs = [];
    const n = { blows: 0, moved: 0, onFrame: 0, later: 0, last2: 0, last3: 0, ward: 0, boost: 0 }, misses = [];
    frames.forEach((fr, k) => {
      for (const seat of ['ren', 'marek']) { const x = expected(seat, fr.t), d = Math.abs(fr[seat] - Math.round(x)); worst = Math.max(worst, d); if (d > 1.05) { off++; if (offs.length < 4) offs.push(`${seat} at ${fr.t.toFixed(3)}: bar ${fr[seat]}, the script ${x.toFixed(2)}`); } }
      for (const ev of fr.evs) {
        if (ev.type !== 'impact') continue;
        const { e, i } = blowLines[bi++] ?? {}; if (!e) continue;
        if (e.ev === 'dodged' || (e.hp ?? 1) <= 0) continue;
        const to = ev.to, prev = frames[k - 1]?.[to] ?? 0, now = fr[to], want = Math.round((after(i, K[to] ) / MAX) * 100);
        if (L[i].s[K[to]] >= MAX) continue;   // a blow on a broken fighter: its bar stays full
        n.blows++;
        // a blow that must move the bar: two whole percent at least from what the bar showed the frame before (a smaller one stays within the bar's rounding, which
        // the check of every frame holds)
        if (Math.abs(want - prev) < 2) continue;
        n.moved++;
        const ok = now !== prev && Math.abs(now - want) <= 1.05;
        if (ok) n.onFrame++; else misses.push(`${e.who} ${e.act} hit ${e.hit ?? 1} at ${e.t}: bar ${prev} -> ${now}, the script ${want}`);
        const hits = script.acts[seatOf(e.who)][e.act]?.hits ?? 1;
        if (ok && (e.hit ?? 1) > 1) n.later++;
        if (ok && hits === 2 && e.hit === 2) n.last2++;
        if (ok && hits >= 3 && e.hit === hits) n.last3++;
        if (ok && on(to, 'ward', e.t)) n.ward++;
        if (ok && on(seatOf(e.who), 'boost', e.t)) n.boost++;
      }
    });
    check(off === 0, `${c}: each bar shows the script's gauge at every frame (${frames.length} frames, ${off} off by more than a percent, the largest gap ${worst.toFixed(1)})${offs.length ? '\n     ' + offs.join('\n     ') : ''}`);
    check(n.moved > 10 && n.onFrame === n.moved, `${c}: each blow that moves a bar moves it on its own frame: ${n.onFrame} of ${n.moved} (${n.blows} blows; later blows ${n.later}, last of two ${n.last2}, last of three ${n.last3}, on a ward ${n.ward}, under a boost ${n.boost})${misses.length ? '\n     ' + misses.slice(0, 4).join('\n     ') : ''}`);
    for (const k of Object.keys(n)) total[k] += n[k];
    total.frames += frames.length; total.off += off;
    await page.close();
  }
  check(total.later > 20 && total.last2 > 10 && total.last3 > 5 && total.ward > 5 && total.boost > 5, `every kind reached: ${JSON.stringify(total)}`);
} finally { await b.close(); }
check(errors === 0, `no page error (${errors})`);
console.log(failed ? `\nFAILED ${failed}` : '\nall checks passed');
if (failed) process.exitCode = 1;
