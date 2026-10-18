// Boot cost and first-use hitches, page by page (journal pass 6).
//   node tools/startup.mjs [--n=4] [--gpu=igpu|dgpu] [--witness=1|0] [--thr=15] [--json=out.json] "label|<query or full url>|<WxH>" ...
// Per load (variants interleaved, one browser): DOMContentLoaded, the loading-label phases (texture painters), MaterialLibrary painter
// timings, sprite atlas build, district generation laps and visibility bake split, the boot's synchronous regenerate() block (under the
// loading screen), what follows it until App.start(), the first frame AFTER start (the largest rAF interval of the loop's first 30
// frames: what the fading loading screen can freeze on) and the programs those frames still create, long tasks, the time to __ready;
// then on the settled page: the FIRST player-occlusion reveal (forced, all occluders), a later one, a forge swap and a regeneration
// (seed change), each with its synchronous time and the next frames' max.
// (The app object is caught as main.ts assigns window.__app, to time regenerate() and start(); journal pass 6: the largest rAF interval
// from the very first frame is the regenerate() block, not the first frame.)
// Summary: median [min-max] per variant. A query is appended to BASE_URL (default http://127.0.0.1:5173/).
import fs from 'node:fs';
import { launch, gpuPid, witness, foreignUse, quantile as q } from './bench-common.mjs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const opt = { n: 4, gpu: 'igpu', json: '', witness: process.platform === 'win32' ? 1 : 0, thr: 15 };
const variants = [];
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--(\w+)=(.*)$/);
  if (m) { opt[m[1]] = isNaN(+m[2]) ? m[2] : +m[2]; continue; }
  const [label, qs = '', size = '1920x1080'] = a.split('|');
  const [w, h] = size.split('x').map(Number);
  variants.push({ label, url: qs.startsWith('http') ? qs : `${BASE}?${qs}`, w, h });
}
if (!variants.length) throw new Error('usage: node tools/startup.mjs [--n=4] "label|query|WxH" ...');

// installed before any page script: loading-label changes, long tasks, every rAF timestamp from the first one
const INSTR = () => {
  window.__boot = { labels: [], longs: [], frames: [] };
  try { new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__boot.longs.push([Math.round(e.startTime), Math.round(e.duration)]); }).observe({ type: 'longtask', buffered: true }); } catch {}
  const mo = new MutationObserver(() => { const el = document.getElementById('ld-label'); if (el && window.__boot.labels.at(-1)?.[1] !== el.textContent) window.__boot.labels.push([Math.round(performance.now()), el.textContent]); });
  document.addEventListener('DOMContentLoaded', () => mo.observe(document.body, { subtree: true, childList: true, characterData: true }));
  const raf = window.requestAnimationFrame.bind(window), ts = window.__boot.frames;
  window.requestAnimationFrame = (cb) => raf((t) => { if (ts.length < 4000) ts.push(t); cb(t); });
  let app;
  Object.defineProperty(window, '__app', { configurable: true, get: () => app, set: (a) => {
    app = a;
    const reg = a.regenerate.bind(a), st = a.start.bind(a);
    a.regenerate = (...x) => { const t0 = performance.now(); reg(...x); (window.__boot.regen ??= []).push([t0, performance.now() - t0]); };
    a.start = () => { window.__boot.start = performance.now(); window.__boot.progsAtStart = a.renderer.info.programs.length; st(); };
  } });
};

const wit = witness(!!opt.witness);
const browser = await launch(opt.gpu);
const mine = await gpuPid(browser);
const out = [];
try {
  for (let i = 0; i < opt.n; i++) {
    for (const v of variants) {
      const page = await browser.newPage();
      await page.setViewport({ width: v.w, height: v.h, deviceScaleFactor: 1 });
      await page.evaluateOnNewDocument(INSTR);
      page.on('pageerror', (e) => console.log('[pageerror]', e.message));
      const t0 = Date.now();
      await page.goto(v.url, { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true', { timeout: 120000, polling: 50 });
      const r = await page.evaluate(async () => {
        const app = window.__app, b = window.__boot, s = window.__stats(), R = app.renderer;
        const nav = performance.getEntriesByType('navigation')[0];
        const readyAt = performance.now();
        const genLaps = { ...app.district.stats.timings }, bakeSplit = app.district.visibility.bakeSplit;
        const fr = b.frames.slice(), i0 = fr.findIndex((t) => t >= b.start), loop = fr.slice(i0, i0 + 31);
        const firstAfterStart = Math.round(Math.max(0, ...loop.slice(1).map((t, j) => t - loop[j])));
        const [r0, regenBoot] = b.regen?.[0] ?? [NaN, NaN];
        const progs0 = R.info.programs.length;
        const settle = (ms) => new Promise((res) => setTimeout(res, ms));
        const framesFor = async (k) => { const t = []; await new Promise((res) => { const f = (x) => { t.push(x); if (t.length <= k) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); }); return t.slice(1).map((x, j) => x - t[j]); };
        await settle(2500);
        const steady = (await framesFor(60)).sort((a, c) => a - c)[30];
        const probe = async (fn) => { const t = performance.now(); fn(); const sync = performance.now() - t; const f = await framesFor(20); return { sync: +sync.toFixed(1), max: +Math.max(...f).toFixed(1), first: +f[0].toFixed(1) }; };
        const progsBeforeReveal = R.info.programs.length;
        const occ1 = await probe(() => { app.occlusion.force = 'all'; });
        const progsAfterReveal = R.info.programs.length;
        await settle(600); app.occlusion.force = null; await settle(800);
        const occ2 = await probe(() => { app.occlusion.force = 'all'; });
        app.occlusion.force = null; await settle(600);
        const forge = await probe(() => app.setForgeState(app.config.forgeState === 'NORMAL_FORGE' ? 'SABOTAGED_FORGE' : 'NORMAL_FORGE'));
        await settle(500);
        const regen = await probe(() => app.regenerate({ seed: app.config.seed === 7719 ? 1842 : 7719 }));
        const ext = R.getContext().getExtension('WEBGL_debug_renderer_info');
        return {
          adapter: ext ? R.getContext().getParameter(ext.UNMASKED_RENDERER_WEBGL) : '?',
          dcl: Math.round(nav.domContentLoadedEventEnd), readyAt: Math.round(readyAt), labels: b.labels, lib: app.lib.timings, atlasMs: app.atlas.buildMs,
          gen: s.generatorMs, genLaps, bake: s.visibility?.bakeMs, bakeSplit, longs: b.longs, steady,
          regenBoot: Math.round(regenBoot), regenToStart: Math.round(b.start - r0 - regenBoot), firstAfterStart,
          programs: { atStart: b.progsAtStart, boot: progs0, beforeReveal: progsBeforeReveal, afterReveal: progsAfterReveal, end: R.info.programs.length }, occ1, occ2, forge, regen,
        };
      });
      const paint = (() => { const a = r.labels.find((x) => /ASHLAR|WHITE/.test(x[1])), z = r.labels.find((x) => /READY/.test(x[1])); return a && z ? z[0] - a[0] : NaN; })();
      const row = { label: v.label, i, wallMs: Date.now() - t0, paint, longest: Math.max(0, ...r.longs.map((x) => x[1])), foreign: wit.on ? foreignUse(wit.samples(), t0, Date.now(), mine, opt.thr) : [], ...r };
      out.push(row);
      console.log(`[${i + 1}] ${v.label.padEnd(16)} ready ${r.readyAt} ms  paint ${paint} gen ${r.gen.toFixed(0)} (bake ${r.bake})  regenerate ${r.regenBoot} then ${r.regenToStart} to start  first frame after start ${r.firstAfterStart} (programs created ${r.programs.boot - r.programs.atStart})  longest task ${row.longest}  `
        + `first reveal ${r.occ1.first} (max ${r.occ1.max})  later ${r.occ2.max}  forge ${r.forge.sync}+${r.forge.max}  regen ${r.regen.sync}  programs ${r.programs.beforeReveal}->${r.programs.afterReveal}${row.foreign.length ? '  foreign ' + row.foreign.join(',') : ''}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
  wit.stop();
}
console.log(`\nadapter: ${out[0]?.adapter}`);
const fmt = (xs) => `${q(xs, 0.5).toFixed(0)} [${Math.min(...xs).toFixed(0)}-${Math.max(...xs).toFixed(0)}]`;
for (const v of variants) {
  const rs = out.filter((r) => r.label === v.label);
  console.log(`${v.label.padEnd(16)} ready ${fmt(rs.map((r) => r.readyAt))}  paint ${fmt(rs.map((r) => r.paint))}  gen ${fmt(rs.map((r) => r.gen))}  bake ${fmt(rs.map((r) => r.bake))}  regenerate ${fmt(rs.map((r) => r.regenBoot))}  then to start ${fmt(rs.map((r) => r.regenToStart))}  first frame after start ${fmt(rs.map((r) => r.firstAfterStart))}  programs created by the first frames ${fmt(rs.map((r) => r.programs.boot - r.programs.atStart))}  `
    + `first reveal ${fmt(rs.map((r) => r.occ1.first))}  later reveal max ${fmt(rs.map((r) => r.occ2.max))}  new programs at reveal ${fmt(rs.map((r) => r.programs.afterReveal - r.programs.beforeReveal))}  (${rs.filter((r) => r.foreign.length).length}/${rs.length} loads with foreign GPU use)`);
}
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify(out, null, 1));
