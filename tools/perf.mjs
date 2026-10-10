// GPU / frame-time probe. All variants run in ONE browser session, interleaved over several rounds, so thermal
// drift of the GPU hits every variant equally (compare A/B only within one run).
//   node tools/perf.mjs [--secs=4] [--rounds=2] [--json=out.json] "label|<query or full url>|<optional js>" ...
// A query is appended to BASE_URL (default http://127.0.0.1:5173/); a full http(s) URL is used as is (e.g. the
// frozen baseline worktree on another port). The optional JS runs against window.__app after load.
// Reports per-pass GPU ms (EXT_disjoint_timer_query_webgl2), uncapped frame mean, draw calls, triangles, etc.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean).find((p) => fs.existsSync(p));
if (!exe) throw new Error('No Chrome/Edge found. Set CHROME_PATH.');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const opt = { secs: 4, rounds: 2, json: '' };
const variants = [];
for (const a of process.argv.slice(2)) {
  const m = a.match(/^--(\w+)=(.*)$/);
  if (m) { opt[m[1]] = isNaN(+m[2]) ? m[2] : +m[2]; continue; }
  const [label, q = '', js = ''] = a.split('|');
  variants.push({ label, url: q.startsWith('http') ? q : `${BASE}?${q}`, js });
}
if (!variants.length) throw new Error('usage: node tools/perf.mjs [--secs=4] [--rounds=2] "label|query|js" ...');

const browser = await puppeteer.launch({
  executablePath: exe, headless: 'new',
  // vsync off + uncapped rAF: otherwise frame times quantise to 16.7 / 33.3 ms buckets and hide the real GPU cost
  args: ['--use-gl=angle', '--use-angle=d3d11', '--enable-gpu-rasterization', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1920,1080', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-gpu-vsync', '--disable-frame-rate-limit'],
  defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 },
});
const results = new Map(variants.map((v) => [v.label, []]));
try {
  for (let round = 0; round < opt.rounds; round++) {
    for (const v of variants) {
      const page = await browser.newPage();
      page.on('pageerror', (e) => console.log('[pageerror]', e.message));
      await page.goto(v.url, { waitUntil: 'load' });
      await page.waitForFunction('window.__ready === true', { timeout: 120000 });
      if (v.js) await page.evaluate(v.js);
      const r = await page.evaluate(async (secs) => {
        const app = window.__app;
        if (app.perf.gpu?.available) app.perf.gpu.enabled = true;
        await new Promise((res) => setTimeout(res, 2500));
        const ts = [];
        await new Promise((res) => { const t0 = performance.now(); const f = (t) => { ts.push(t); if (t - t0 < secs * 1000) requestAnimationFrame(f); else res(); }; requestAnimationFrame(f); });
        const d = ts.slice(1).map((t, i) => t - ts[i]);
        const s = window.__stats();
        return { mean: d.reduce((a, b) => a + b, 0) / d.length, draws: s.drawCalls, tris: s.triangles, geos: s.geometries, tex: s.textures, texMB: s.textureMB, lights: s.lights, lightsOn: app.lights.active ?? s.lights, gen: s.generatorMs, res: s.resolution, gpu: s.gpu ?? {}, gpuMs: s.gpuMs ?? NaN, vis: s.visibility ?? null };
      }, opt.secs);
      results.get(v.label).push(r);
      const g = Object.entries(r.gpu).map(([k, x]) => `${k} ${x.toFixed(2)}`).join(' | ');
      console.log(`[r${round + 1}] ${v.label.padEnd(24)} GPU ${r.gpuMs.toFixed(2)} ms [${g}]  frame ${r.mean.toFixed(1)} ms  draws ${r.draws}  tris ${(r.tris / 1000).toFixed(1)}k  lights ${r.lightsOn}/${r.lights}`);
      await page.close();
    }
  }
} finally {
  await browser.close();
}
console.log('\n=== mean over rounds ===');
const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
const summary = [];
for (const [label, rs] of results) {
  const passes = [...new Set(rs.flatMap((r) => Object.keys(r.gpu)))];
  const gpu = Object.fromEntries(passes.map((p) => [p, avg(rs.map((r) => r.gpu[p] ?? 0))]));
  const row = { label, gpuMs: avg(rs.map((r) => r.gpuMs)), frameMs: avg(rs.map((r) => r.mean)), gpu, ...Object.fromEntries(['draws', 'tris', 'geos', 'tex', 'texMB', 'lights', 'lightsOn', 'gen'].map((k) => [k, avg(rs.map((r) => r[k]))])), res: rs[0].res, vis: rs[rs.length - 1].vis };
  summary.push(row);
  console.log(`${label.padEnd(24)} GPU ${row.gpuMs.toFixed(2)} ms (${(1000 / row.gpuMs).toFixed(1)} fps GPU-bound) [${passes.map((p) => `${p} ${gpu[p].toFixed(2)}`).join(' | ')}]  frame ${row.frameMs.toFixed(1)} ms  draws ${row.draws.toFixed(0)}  tris ${(row.tris / 1000).toFixed(1)}k  geos ${row.geos.toFixed(0)}  tex ${row.tex.toFixed(0)} (${row.texMB.toFixed(0)} MB)  lights ${row.lightsOn.toFixed(0)}/${row.lights.toFixed(0)}  gen ${row.gen.toFixed(0)} ms${row.vis ? '  ' + JSON.stringify(row.vis) : ''}`);
}
if (opt.json) fs.writeFileSync(opt.json, JSON.stringify(summary, null, 1));
