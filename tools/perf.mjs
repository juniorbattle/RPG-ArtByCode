// GPU / frame-time probe. All variants run in ONE browser session, interleaved over several rounds, so thermal
// drift of the GPU hits every variant equally (compare A/B only within one run).
//   node tools/perf.mjs [--secs=4] [--warm=2.5] [--rounds=2] [--size=1920x1080] [--gpu=igpu|dgpu] [--witness=1|0] [--thr=15] [--json=out.json]
//        "label|<query or full url>|<optional js>|<optional WxH[@dpr]>" ...
// A query is appended to BASE_URL (default http://127.0.0.1:5173/); a full http(s) URL is used as is (e.g. the
// frozen baseline worktree on another port). The optional JS runs against window.__app after load; the optional size (window
// CSS size and device scale) overrides --size for that variant.
// Reports per-pass GPU ms (EXT_disjoint_timer_query_webgl2: each frame's value recovered from GpuTimer's moving average, mean / p95),
// uncapped frame p50 / p95, main-thread JS ms of App.update / App.render, draw calls, triangles, and the adapter actually used
// (Chrome picks the integrated GPU of a hybrid laptop; --gpu=dgpu forces the discrete one).
// Contention witness (Windows, on by default): tools/gpu-witness.ps1 samples every process's 3D-engine use; a round during which
// another process used more than --thr % of this run's adapter is flagged '*' and left out of the "clean" median. The minimum over
// rounds is the best estimate without contention (sharing the GPU only adds time). The headless frame-time tail (p95) is not
// trusted: an idle page already shows ~40 ms in this harness (journal pass 6).
import fs from 'node:fs';
import { launch, gpuPid, witness, foreignUse, uncapped, quantile as q, mean } from './bench-common.mjs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const opt = { secs: 4, warm: 2.5, rounds: 2, json: '', size: '1920x1080', gpu: 'igpu', witness: process.platform === 'win32' ? 1 : 0, thr: 15 };
const variants = [];
const sizeOf = (s) => { const [wh, dpr = '1'] = s.split('@'); const [w, h] = wh.split('x').map(Number); return { w, h, dpr: +dpr }; };
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--(\w+)=(.*)$/);
  if (m) { opt[m[1]] = isNaN(+m[2]) ? m[2] : +m[2]; continue; }
  const [label, qs = '', js = '', size = ''] = a.split('|');
  variants.push({ label, url: uncapped(qs.startsWith('http') ? qs : `${BASE}?${qs}`), js, size });
}
if (!variants.length) throw new Error('usage: node tools/perf.mjs [--secs=4] [--rounds=2] [--size=WxH] [--gpu=igpu|dgpu] "label|query|js|WxH" ...');

const wit = witness(!!opt.witness);
const browser = await launch(opt.gpu);
const mine = await gpuPid(browser);
const results = new Map(variants.map((v) => [v.label, []]));
let adapter = '?';
try {
  for (let round = 0; round < opt.rounds; round++) {
    for (const v of variants) {
      const { w, h, dpr } = sizeOf(v.size || String(opt.size));
      const page = await browser.newPage();
      await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
      page.on('pageerror', (e) => console.log('[pageerror]', e.message));
      await page.goto(v.url, { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true', { timeout: 120000 });
      if (v.js) await page.evaluate(v.js);
      let t0 = 0;
      const r = await page.evaluate(async (secs, warm) => {
        const app = window.__app ?? window.__arena ?? window.__place ?? window.__plaza, g = app.perf.gpu;   // the town, the arena scene (?scene=arena, journal Passe P1), a light place of the play mode (Lantern Row, Passe L6) or a version 2 square (Passe FV4)
        const gl = app.renderer.getContext(), ext = gl.getExtension('WEBGL_debug_renderer_info');
        const adapter = ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : '?';
        if (g.available) g.enabled = true;
        // per-frame pass values: GpuTimer keeps ema += (v - ema) * 0.06; recover v on every write
        let rec = false; const raw = {}; const store = { ...g.ms };
        Object.defineProperty(g, 'ms', { configurable: true, writable: true, value: new Proxy(store, { set(t, k, val) { const old = t[k]; t[k] = val; if (rec && old !== undefined) (raw[k] ??= []).push(old + (val - old) / 0.06); return true; } }) });
        const upd = [], ren = [];
        const u0 = app.update.bind(app), r0 = app.render.bind(app);
        app.update = (dt) => { const t = performance.now(); u0(dt); if (rec) upd.push(performance.now() - t); };
        app.render = () => { const t = performance.now(); r0(); if (rec) ren.push(performance.now() - t); };
        await new Promise((res) => setTimeout(res, warm * 1000));
        rec = true; const tStart = Date.now();
        const ts = [];
        await new Promise((res) => { const t0 = performance.now(); const f = (t) => { ts.push(t); if (t - t0 < secs * 1000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
        rec = false;
        const d = ts.slice(1).map((t, i) => t - ts[i]);
        const s = window.__stats();
        return { adapter, tStart, tEnd: Date.now(), d, upd, ren, raw, draws: s.drawCalls, tris: s.triangles, geos: s.geometries, tex: s.textures, texMB: s.textureMB, lights: s.lights, lightsOn: app.lights.active ?? s.lights, gen: s.generatorMs, res: s.resolution ?? `${gl.drawingBufferWidth}x${gl.drawingBufferHeight}`, vis: s.visibility ?? null };
      }, opt.secs, opt.warm);
      adapter = r.adapter;
      const passes = Object.fromEntries(Object.entries(r.raw).map(([k, xs]) => [k, mean(xs)]));
      // no timer query (another browser / adapter): GPU columns stay NaN, the frame and JS columns still hold
      const n = Object.keys(r.raw).length ? Math.min(...Object.values(r.raw).map((xs) => xs.length)) : 0;
      const perFrame = Array.from({ length: n }, (_, i) => Object.values(r.raw).reduce((a, xs) => a + xs[i], 0));
      const foreign = wit.on ? foreignUse(wit.samples(), r.tStart, r.tEnd, mine, opt.thr) : [];
      const row = {
        round: round + 1, t: [r.tStart, r.tEnd], foreign, gpuMs: perFrame.length ? mean(perFrame) : NaN, gpuP95: q(perFrame, 0.95), gpu: passes,
        frameP50: q(r.d, 0.5), frameP95: q(r.d, 0.95), frameMean: mean(r.d), cpuUpdate: mean(r.upd), cpuRender: mean(r.ren),
        draws: r.draws, tris: r.tris, geos: r.geos, tex: r.tex, texMB: r.texMB, lights: r.lights, lightsOn: r.lightsOn, gen: r.gen, res: r.res, vis: r.vis,
      };
      results.get(v.label).push(row);
      const g = Object.entries(passes).map(([k, x]) => `${k} ${x.toFixed(2)}`).join(' | ');
      console.log(`[r${round + 1}] ${v.label.padEnd(24)} ${row.res.padEnd(16)} GPU ${row.gpuMs.toFixed(2)}${foreign.length ? '*' : ' '} (p95 ${row.gpuP95.toFixed(2)}) [${g}]  frame p50 ${row.frameP50.toFixed(1)}  js upd ${row.cpuUpdate.toFixed(2)} ren ${row.cpuRender.toFixed(2)}  draws ${row.draws}  tris ${(row.tris / 1000).toFixed(1)}k  lights ${row.lightsOn}/${row.lights}${foreign.length ? '  foreign ' + foreign.join(',') : ''}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
  wit.stop();
}
console.log(`\nadapter: ${adapter}${wit.on ? `  (contention witness on, GPU process ${mine ?? '?'}, threshold ${opt.thr} %)` : '  (contention witness off)'}`);
console.log('=== over rounds: median [min-max], clean = median of the rounds without foreign GPU use ===');
const med = (xs) => q(xs, 0.5);
const fx = (x, d) => (Number.isFinite(x) ? x.toFixed(d) : '-');   // a page may not report a counter (Lantern Row: no texture memory)
const summary = [];
for (const [label, rs] of results) {
  const clean = rs.filter((r) => !r.foreign.length);
  const use = clean.length ? clean : rs;
  const passes = [...new Set(rs.flatMap((r) => Object.keys(r.gpu)))];
  const gpu = Object.fromEntries(passes.map((p) => [p, med(use.map((r) => r.gpu[p] ?? 0))]));
  const row = {
    label, gpuMs: med(rs.map((r) => r.gpuMs)), gpuMin: Math.min(...rs.map((r) => r.gpuMs)), gpuMax: Math.max(...rs.map((r) => r.gpuMs)),
    gpuClean: clean.length ? med(clean.map((r) => r.gpuMs)) : null, cleanRounds: clean.length, gpu, frameMs: med(rs.map((r) => r.frameMean)),
    cpuUpdate: med(rs.map((r) => r.cpuUpdate)), cpuRender: med(rs.map((r) => r.cpuRender)),
    ...Object.fromEntries(['draws', 'tris', 'geos', 'tex', 'texMB', 'lights', 'lightsOn', 'gen'].map((k) => [k, med(rs.map((r) => r[k]))])), res: rs[0].res, vis: rs[rs.length - 1].vis, adapter, rounds: rs,
  };
  summary.push(row);
  console.log(`${label.padEnd(24)} ${row.res.padEnd(16)} GPU ${row.gpuMs.toFixed(2)} [${row.gpuMin.toFixed(2)}-${row.gpuMax.toFixed(2)}] clean ${row.gpuClean === null ? '-' : row.gpuClean.toFixed(2)} (${clean.length}/${rs.length}) [${passes.map((p) => `${p} ${gpu[p].toFixed(2)}`).join(' | ')}]  js upd ${row.cpuUpdate.toFixed(2)} ren ${row.cpuRender.toFixed(2)}  draws ${row.draws.toFixed(0)}  tris ${(row.tris / 1000).toFixed(1)}k  tex ${fx(row.tex, 0)} (${fx(row.texMB, 0)} MB)  lights ${fx(row.lightsOn, 0)}/${fx(row.lights, 0)}  gen ${fx(row.gen, 0)} ms${row.vis ? '  ' + JSON.stringify(row.vis) : ''}`);
}
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify(summary, null, 1));
