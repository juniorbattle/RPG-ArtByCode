// Frame cadence in a REAL, visible Chrome window with vsync (journal pass 6, P4). The headless harness of tools/perf.mjs turns vsync
// off and its frame-time tail is not trusted, so the cadence the player sees is measured here: on the display itself, the interval
// between two App.render calls in vsync units, its regularity, and the GPU's occupancy by this browser (contention witness counters).
//   node tools/cadence.mjs [--secs=8] [--warm=3] [--rounds=1] [--gpu=igpu|dgpu] [--witness=1|0] [--thr=15] [--json=f]
//        "label|<query or full url>|<max | WxH[@dpr]>|<optional js run once the app is ready, before the warm-up>" ...
// `max` = the maximised window at the display's own device pixel ratio (the operator's real case); WxH@dpr emulates a viewport.
// A Chrome window opens on the desktop for the whole run: leave it on screen. First a trivial page measures the display's vsync
// interval (median rAF interval of an idle page); a page whose app probed its own vsync (FrameCap) is counted with that one. Per variant: delivered fps, interval median / p95, the share of intervals in
// 1, 2, 3, 4, 5+ vsyncs, "irregular" = intervals off the most frequent count, rAF callbacks that did not render (a frame cap skips
// them), the GPU process's 3D-engine utilisation (median of the witness samples, ~1 per 2 s; the driver lowers the clocks when there is
// slack, so a busy share is not a power figure), the mean package and SoC power (tools/energy-witness.ps1: RAPL counters, SoC = package
// minus cores = the integrated GPU's share) and foreign GPU use. Each round starts with the idle page (about:blank) as the power reference.
// An adaptive cap (`fps=a<n>`) also reports its step changes ([rAF ms:vsyncs per frame]; the JSON row's `t0` = the first measured render).
import fs from 'node:fs';
import { launchHeaded, gpuPid, witness, energyWitness, meanPower, foreignUse, quantile as q } from './bench-common.mjs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const opt = { secs: 8, warm: 3, rounds: 1, gpu: 'igpu', json: '', witness: process.platform === 'win32' ? 1 : 0, thr: 15 };
const variants = [];
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--(\w+)=(.*)$/);
  if (m) { opt[m[1]] = isNaN(+m[2]) ? m[2] : +m[2]; continue; }
  const [label, qs = '', size = 'max', js = ''] = a.split('|');
  variants.push({ label, url: qs.startsWith('http') ? qs : `${BASE}?${qs}`, size: size || 'max', js });
}
if (!variants.length) throw new Error('usage: node tools/cadence.mjs [--secs=8] "label|query|max|WxH@dpr" ...');

// installed before any page script: every rAF callback's timestamp, and each App.render call once the app exists
const INSTR = () => {
  window.__cad = { raf: [], render: [], on: false };
  const raf = window.requestAnimationFrame.bind(window);
  window.requestAnimationFrame = (cb) => raf((t) => { if (window.__cad.on) window.__cad.raf.push(performance.now()); cb(t); });
  let app;
  Object.defineProperty(window, '__app', { configurable: true, get: () => app, set: (a) => {
    app = a;
    const r = a.render.bind(a);
    a.render = (...x) => { if (window.__cad.on) window.__cad.render.push(performance.now()); return r(...x); };
  } });
};

const wit = witness(!!opt.witness);
const ew = energyWitness(!!opt.witness);
const browser = await launchHeaded(opt.gpu);
const mine = await gpuPid(browser);
const out = [];
let vsync = NaN;
const idle = [];
try {
  // the display's vsync interval, from an idle page in the same window
  {
    const [p0] = await browser.pages();
    const page = p0 ?? await browser.newPage();
    await page.goto('about:blank');
    await page.bringToFront();
    const d = await page.evaluate(() => new Promise((res) => { const t = []; const f = (x) => { t.push(x); if (t.length < 200) requestAnimationFrame(f); else res(t.slice(1).map((v, i) => v - t[i])); }; requestAnimationFrame(f); }));
    vsync = q(d, 0.5);
    console.log(`display: vsync ${vsync.toFixed(3)} ms (${(1000 / vsync).toFixed(1)} Hz), idle-page interval p5 ${q(d, 0.05).toFixed(2)} / p95 ${q(d, 0.95).toFixed(2)} ms`);
  }
  for (let i = 0; i < opt.rounds; i++) {
    // the power reference: the same window on the idle page
    {
      const [p0] = await browser.pages();
      await p0.bringToFront();
      const t0 = Date.now();
      await new Promise((r) => setTimeout(r, opt.secs * 1000));
      const pw = meanPower(ew.samples(), t0, Date.now());
      idle.push(pw);
      console.log(`[${i + 1}] idle page          pkg ${pw.pkg.toFixed(1)} W  soc ${pw.soc.toFixed(1)} W`);
    }
    for (const v of variants) {
      const page = await browser.newPage();
      await page.bringToFront();
      if (v.size !== 'max') {
        const [wh, dpr = '1'] = v.size.split('@'); const [w, h] = wh.split('x').map(Number);
        await page.setViewport({ width: w, height: h, deviceScaleFactor: +dpr });
      }
      await page.evaluateOnNewDocument(INSTR);
      page.on('pageerror', (e) => console.log('[pageerror]', e.message));
      await page.goto(v.url, { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true', { timeout: 120000, polling: 100 });
      if (v.js) await page.evaluate(`(() => { const app = window.__app; ${v.js} })()`);
      await new Promise((r) => setTimeout(r, opt.warm * 1000));
      const t0 = Date.now();
      await page.evaluate(() => { window.__cad.raf.length = 0; window.__cad.render.length = 0; window.__cad.on = true; });
      await new Promise((r) => setTimeout(r, opt.secs * 1000));
      const r = await page.evaluate(() => {
        window.__cad.on = false;
        const s = window.__stats();
        return { raf: window.__cad.raf.slice(), render: window.__cad.render.slice(), vis: document.visibilityState, res: s.resolution, dpr: devicePixelRatio, inner: `${innerWidth}x${innerHeight}`, cap: s.frameCap ?? null };
      });
      const t1 = Date.now();
      await new Promise((res) => setTimeout(res, 2200)); // the witness samples about every 2 s
      const iv = r.render.slice(1).map((x, j) => x - r.render[j]);
      // intervals counted in the page's own probed vsync when it has one: a static idle page can run at a lower rate than the animated
      // game (Windows dynamic refresh rate: the idle page once read 12.1 ms while the game probed 6.1 ms at 165 Hz, journal pass 6 P4)
      const vs = r.cap?.vsyncFrom === 'probe' ? r.cap.vsyncMs : vsync;
      const k = iv.map((x) => Math.max(1, Math.round(x / vs)));
      const hist = [1, 2, 3, 4, 5].map((n) => k.filter((x) => (n < 5 ? x === n : x >= 5)).length / Math.max(1, k.length));
      const mode = 1 + hist.slice(0, 4).indexOf(Math.max(...hist.slice(0, 4)));
      const span = (r.render.at(-1) - r.render[0]) / 1000;
      const samples = wit.on ? wit.samples().filter((s) => s.t >= t0 && s.t <= t1) : [];
      const own = samples.map((s) => s.ps.filter((p) => p.pid === mine).reduce((a, p) => a + p.u, 0));
      const pw = meanPower(ew.samples(), t0, t1);
      const row = {
        label: v.label, i, url: v.url, size: v.size, cap: r.cap, res: r.res, dpr: r.dpr, inner: r.inner, vis: r.vis,
        fps: (iv.length) / span, p50: q(iv, 0.5), p95: q(iv, 0.95), max: Math.max(...iv), hist, mode, irregular: k.filter((x) => x !== mode).length / Math.max(1, k.length),
        vsync: vs, t0: +r.render[0]?.toFixed(1), intervals: iv.map((x) => +x.toFixed(2)), skipped: r.raf.length - r.render.length, rafs: r.raf.length, gpuBusy: own.length ? q(own, 0.5) : NaN, gpuSamples: own, pkgW: pw.pkg, socW: pw.soc,
        foreign: wit.on ? foreignUse(wit.samples(), t0, t1, mine, opt.thr) : [],
      };
      out.push(row);
      console.log(`[${i + 1}] ${v.label.padEnd(18)} ${r.res} (${r.inner}@${r.dpr}${r.vis !== 'visible' ? ' ' + r.vis : ''})  ${row.fps.toFixed(1)} fps  interval p50 ${row.p50.toFixed(2)} p95 ${row.p95.toFixed(2)} max ${row.max.toFixed(1)} ms  `
        + `vsyncs 1/2/3/4/5+ ${hist.map((h) => (h * 100).toFixed(0)).join('/')} %  irregular ${(row.irregular * 100).toFixed(1)} %  rAF without render ${row.skipped}/${row.rafs}  `
        + `GPU busy ${isNaN(row.gpuBusy) ? '-' : row.gpuBusy + ' %'} [${own.join(',')}]  pkg ${pw.pkg.toFixed(1)} W  soc ${pw.soc.toFixed(1)} W${r.cap ? `  cap ${r.cap.mode} every ${r.cap.every} vsync ${r.cap.vsyncMs} (${r.cap.vsyncFrom})${r.cap.steps !== undefined ? ` steps ${r.cap.steps} trials undone ${r.cap.trialsFailed} [${r.cap.log}]` : ''}` : ''}${row.foreign.length ? '  foreign ' + row.foreign.join(',') : ''}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
  wit.stop();
  ew.stop();
}
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify({ vsync, idle, rows: out }, null, 1));
