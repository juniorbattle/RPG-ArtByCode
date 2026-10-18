// The frame cap's vsync interval (src/app/FrameCap.ts) against the display's real interval, in a VISIBLE maximised Chrome window with
// vsync (journal pass 6k). The cap reads it once at boot (an idle rAF chain while the texture painters work) and checks it in session (the
// loop's callback intervals over windows without a late frame); a wrong interval paces the session on a wrong step (pass 6j: probes of
// 10.1-13 ms on the 165 Hz display while Chrome delivered 98.5 / 116 callbacks/s for a minute).
//   node tools/vsync-probe.mjs [--n=8] [--play=0|<secs>] [--size=max|WxH[@dpr]] [--cpuload=0|<threads>|all] [--gpuload=0|<pages>] [--gpu=igpu|dgpu]
//        [--visible=0|1] [--json=f]
//        "<query or full url>"
// First an idle page measures the display's interval (median rAF interval, before any load); then the app is loaded n times, each time
// reading what the probe concluded (`vsyncMs`, `vsyncFrom`) and its raw intervals: their share near 1, 2, 3 display intervals. --play=<s>
// lets the game run s more seconds and reads the interval the cap then uses (`vsyncFrom` 'loop' after an in-session change). --size
// emulates a viewport in the window (default `max`, the maximised window). The window is discreet by default, as in tools/cadence.mjs
// (off-screen, one tab reused, never focused, `max` emulated); --visible=1 opens it maximised on the desktop.
// --cpuload=<k> runs k busy threads in this process for the whole series ('all' = every logical core): a machine loaded by other programs;
// they end with the series (and at the latest after 15 minutes). --gpuload=<k> renders the same app uncapped (`fps=off`) in k pages of a
// separate headless Chrome on the same adapter for the whole series: another program saturating the GPU.
import fs from 'node:fs';
import os from 'node:os';
import { Worker } from 'node:worker_threads';
import { launch, launchHeaded, MAX_VIEWPORT, quantile as q } from './bench-common.mjs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const opt = { n: 8, play: '0', size: 'max', cpuload: '0', gpuload: '0', gpu: 'igpu', visible: '0', json: '' };
let target = '';
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--(\w+)=(.*)$/);
  if (m) opt[m[1]] = m[2]; else target = a;
}
const url = target.startsWith('http') ? target : `${BASE}?${target}`;
const threads = opt.cpuload === 'all' ? os.availableParallelism() : +opt.cpuload || 0;
const play = +opt.play || 0;

const idleInterval = (page) => page.evaluate(() => new Promise((res) => {
  const t = []; const f = (x) => { t.push(x); if (t.length < 200) requestAnimationFrame(f); else res(t.slice(1).map((v, i) => v - t[i])); };
  requestAnimationFrame(f);
}));
const share = (d, v) => {
  const k = d.map((x) => x / v), near = (n) => k.filter((x) => Math.abs(x - n) < 0.25).length / Math.max(1, k.length);
  return { v1: near(1), v2: near(2), v3: near(3), other: 1 - near(1) - near(2) - near(3) };
};
const pct = (x) => `${(x * 100).toFixed(0)}%`;
const capState = () => { const c = window.__app.frameCap; return { vsync: c.vsync, from: c.vsyncSource, every: c.every(), mode: window.__stats().frameCap.mode, changes: c.vsyncChanges ?? 0, log: (c.vsyncLog ?? []).map((x) => x.join(':')).join(','), deltas: c.probeDeltas.slice() }; };

const visible = opt.visible === '1';
const browser = await launchHeaded(opt.gpu, [], { visible });
const workers = [];
let hog = null;
const rows = [];
let display = NaN;
try {
  const [p0] = await browser.pages();
  const page0 = p0 ?? await browser.newPage();
  if (!visible) await page0.setViewport(MAX_VIEWPORT);
  await page0.goto('about:blank'); if (visible) await page0.bringToFront();
  display = q(await idleInterval(page0), 0.5);
  console.log(`display: ${display.toFixed(3)} ms (${(1000 / display).toFixed(1)} Hz), idle page, no load`);
  if (threads) {
    const deadline = Date.now() + 15 * 60 * 1000;
    for (let i = 0; i < threads; i++) workers.push(new Worker(`const { workerData: end } = require('node:worker_threads'); let x = 0; while (Date.now() < end) x = (x * 1103515245 + 12345) | 0;`, { eval: true, workerData: deadline }));
    await new Promise((r) => setTimeout(r, 1500));
    const under = q(await idleInterval(page0), 0.5);
    console.log(`cpu load: ${threads} busy threads (${os.availableParallelism()} logical cores); idle page under load ${under.toFixed(3)} ms`);
  }
  if (+opt.gpuload > 0) {
    hog = await launch(opt.gpu);
    for (let i = 0; i < +opt.gpuload; i++) {
      const p = await hog.newPage();
      await p.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
      await p.goto(`${url}&fps=off`, { waitUntil: 'load' });
      await p.waitForFunction('window.__ready === true', { timeout: 180000, polling: 200 });
    }
    if (visible) await page0.bringToFront();
    const under = q(await idleInterval(page0), 0.5);
    console.log(`gpu load: ${opt.gpuload} uncapped headless page(s) of the app; idle page under load ${under.toFixed(3)} ms`);
  }
  for (let i = 0; i < +opt.n; i++) {
    const page = visible ? await browser.newPage() : page0;
    if (visible) await page.bringToFront();
    if (opt.size !== 'max') { const [wh, dpr = '1'] = opt.size.split('@'); const [w, h] = wh.split('x').map(Number); await page.setViewport({ width: w, height: h, deviceScaleFactor: +dpr }); }
    else if (!visible) await page.setViewport(MAX_VIEWPORT);
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction('window.__ready === true', { timeout: 180000, polling: 100 });
    const r = await page.evaluate(capState);
    let played = null;
    if (play) {
      await new Promise((res) => setTimeout(res, play * 1000));
      played = await page.evaluate(capState);
      delete played.deltas;
    }
    if (visible) await page.close(); else await page.goto('about:blank');
    const d = r.deltas.filter((x) => x > 2.5 && x < 50), s = share(d, display);
    const row = { i, vsync: r.vsync, from: r.from, every: r.every, mode: r.mode, n: d.length, p10: q(d, 0.1), p50: q(d, 0.5), p90: q(d, 0.9), ...s,
      ok: Math.abs(r.vsync / display - 1) < 0.1, played, playOk: played ? Math.abs(played.vsync / display - 1) < 0.1 : null, deltas: r.deltas.map((x) => +x.toFixed(2)) };
    rows.push(row);
    console.log(`[${i + 1}] boot ${r.vsync.toFixed(2)} ms (${r.from}) ${row.ok ? 'OK ' : 'WRONG'}  cap ${r.mode} every ${r.every}  probe intervals n ${d.length} p10/p50/p90 ${row.p10.toFixed(2)}/${row.p50.toFixed(2)}/${row.p90.toFixed(2)}  near 1/2/3 display intervals ${pct(s.v1)}/${pct(s.v2)}/${pct(s.v3)} other ${pct(s.other)}`
      + (played ? `  | after ${play} s: ${played.vsync.toFixed(2)} ms (${played.from}) ${row.playOk ? 'OK' : 'WRONG'} every ${played.every}, ${played.changes} change(s) [${played.log}]` : ''));
  }
} finally {
  for (const w of workers) await w.terminate();
  if (hog) await hog.close();
  await browser.close();
}
const wrong = rows.filter((r) => !r.ok).length, wrongPlay = rows.filter((r) => r.playOk === false).length, changes = rows.reduce((a, r) => a + (r.played?.changes ?? 0), 0);
console.log(`\n${wrong}/${rows.length} boot readings off by more than 10 %${play ? `; after ${play} s of play ${wrongPlay}/${rows.length} off, ${changes} in-session change(s)` : ''} (display ${display.toFixed(3)} ms${threads ? `, ${threads} busy threads` : ''}${+opt.gpuload ? `, ${opt.gpuload} uncapped headless page(s)` : ''})`);
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ display, threads, gpuload: +opt.gpuload, play, rows }, null, 1));
