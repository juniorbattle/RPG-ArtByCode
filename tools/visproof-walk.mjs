// Visibility proof IN MOTION (journal Passe K6): the same deterministic walk on two pages, the culled default and `vis=0` (every part kept),
// stepped in lockstep (seeded Math.random, App.start a no-op, frozen clock, 1/60 s steps; the player steered like tools/camsim.mjs: each frame
// the key combo whose latched direction is closest to the heading), both rendered and shot every N steps and compared pixel for pixel. It
// proves the poses a walk really produces (a follow that holds its focus back, blends at their real weights), where tools/visproof.mjs and
// tools/viewport-proof.mjs replay the bake's sampled or pinned poses only.
//   node tools/visproof-walk.mjs [--every=6] [--thr=24] [--q=<extra query>] [--keep=<dir>] [--control] "name|x,z|g=x,z;w,d:2;..." ...
// --control: the negative control, the culled page drawing framing A's parts only (App.debugActive) wherever the camera is: it must differ.
// BASE_URL env (default http://127.0.0.1:5173/); the base query is seed=1842&clean=1&freeze=7.3&occ=0&static=1&intro=0 (occ=0: the reveal fade
// out of the comparison; static=1: no characters or particles, the camera still follows the player). Per scenario: shots, shots that differ,
// the worst one (px over thr, its step, the framing(s) on screen); --keep writes every differing pair and its diff. Exit 1 when a page errors.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { decodePng, encodePng } from './art-lab/png.mjs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const HOLD = `Object.defineProperty(window, '__app', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__app', { value: v, writable: true, configurable: true }); } });`;
const args = process.argv.slice(2), opt = (n, d) => { const a = args.find((x) => x.startsWith(`--${n}=`)); return a ? a.slice(n.length + 3) : d; };
const every = +opt('every', 6), thr = +opt('thr', 24), extra = opt('q', ''), keep = opt('keep', null), control = args.includes('--control');
const scen = args.filter((a) => !a.startsWith('--'));
if (!scen.length) throw new Error('usage: node tools/visproof-walk.mjs [--every=6] [--thr=24] [--q=..] [--keep=dir] "name|x,z|plan" ...');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const Q = `seed=1842&clean=1&freeze=7.3&occ=0&static=1&intro=0${extra ? '&' + extra : ''}`;
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
if (keep) fs.mkdirSync(keep, { recursive: true });

// the page side: place the player, then step / steer / shoot on demand (the same in both pages: visibility does not touch the simulation)
function setup(sx, sz) {
  const a = window.__app, p = a.actors.player.pos;
  let clock = 0; const frozen = (fn) => { const n = performance.now; performance.now = () => clock; try { return fn(); } finally { performance.now = n; } };
  for (const k of [...a.actors.keys]) a.actors.keys.delete(k);
  a.graph.arrival = false; p.set(sx, 0, sz); a.graph.snap(p, a.rig); a.actors.controlYaw = a.actors.camYaw = a.rig.yaw;
  for (let i = 0; i < 30; i++) { clock += 1000 / 60; frozen(() => a.update(1 / 60)); }
  const KEYS = [['d'], ['a'], ['w'], ['s'], ['w', 'd'], ['w', 'a'], ['s', 'd'], ['s', 'a']];
  const hold = (ks) => { for (const k of [...a.actors.keys]) a.actors.keys.delete(k); for (const k of ks) a.actors.keys.add(k); };
  window.__vw = {
    // one frame: steer toward (gx, gz) when given, else keep the held keys; returns the distance left to the goal
    step(goal) {
      if (goal) {
        const c = Math.cos(a.actors.controlYaw), s = Math.sin(a.actors.controlYaw), hx = goal[0] - p.x, hz = goal[1] - p.z, hl = Math.hypot(hx, hz) || 1;
        let best = KEYS[0], bd = -9;
        for (const ks of KEYS) {
          const ix = (ks.includes('d') ? 1 : 0) - (ks.includes('a') ? 1 : 0), iy = (ks.includes('w') ? 1 : 0) - (ks.includes('s') ? 1 : 0);
          let mx = c * ix - s * iy, mz = -s * ix - c * iy; const ml = Math.hypot(mx, mz); mx /= ml; mz /= ml;
          const d = (mx * hx + mz * hz) / hl; if (d > bd) { bd = d; best = ks; }
        }
        hold(best);
      }
      clock += 1000 / 60; frozen(() => a.update(1 / 60));
      return goal ? Math.hypot(goal[0] - p.x, goal[1] - p.z) : 0;
    },
    hold,
    render() { frozen(() => a.render()); return { act: a.graph.activeIds().join('+'), blending: a.graph.blending, x: +p.x.toFixed(2), z: +p.z.toFixed(2) }; },
  };
}

const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1920,1080', '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } });
let failed = false;
const results = [];
try {
  const open = async (q) => {
    const page = await b.newPage(); page.on('pageerror', (e) => { failed = true; console.log('[pageerror]', e.message); });
    await page.evaluateOnNewDocument(SEED); await page.evaluateOnNewDocument(HOLD);
    await page.goto(`${BASE}?${q}`, { waitUntil: 'load' }); await page.waitForFunction('window.__ready === true', { timeout: +(process.env.READY_MS || 180000) });
    await new Promise((r) => setTimeout(r, 1200));
    return page;
  };
  for (const sc of scen) {
    const [name, start, plan] = sc.split('|');
    const [sx, sz] = start.split(',').map(Number);
    const segs = plan.split(';').map((s) => (s.startsWith('g=') ? { goto: s.slice(2).split(',').map(Number) } : (([k, t]) => ({ keys: k === '-' ? [] : k.split(','), frames: Math.round(+t * 60) }))(s.split(':'))));
    const pages = [await open(Q), await open(`${Q}&vis=0`)];
    for (const p of pages) await p.evaluate(setup, sx, sz);
    // --control (negative control): the culled page draws framing A's parts whatever the camera shows, so the proof must report gaps
    if (control) await pages[0].evaluate(() => { window.__app.debugActive = ['A']; });
    let step = 0, shots = 0, differ = 0, worst = { px: 0 };
    const shoot = async () => {
      const st = await Promise.all(pages.map((p) => p.evaluate(() => window.__vw.render())));
      if (JSON.stringify(st[0]) !== JSON.stringify(st[1])) throw new Error(`${name} step ${step}: the two pages diverged ${JSON.stringify(st)}`);
      // one page at a time, brought to the front: a background tab of the same browser produces no frame to capture
      const imgs = [];
      for (const p of pages) { await p.bringToFront(); imgs.push(await p.screenshot({ type: 'png' })); }
      const [ia, ib] = imgs;
      const A = decodePng(Buffer.from(ia)), B = decodePng(Buffer.from(ib)); let px = 0;
      const d = keep ? new Uint8Array(A.rgba.length) : null;
      for (let i = 0; i < A.rgba.length; i += 4) {
        const m = Math.max(Math.abs(A.rgba[i] - B.rgba[i]), Math.abs(A.rgba[i + 1] - B.rgba[i + 1]), Math.abs(A.rgba[i + 2] - B.rgba[i + 2]));
        if (m > thr) { px++; if (d) { d[i] = 255; d[i + 3] = 255; } } else if (d) { d[i] = d[i + 1] = d[i + 2] = A.rgba[i] >> 2; d[i + 3] = 255; }
      }
      shots++;
      if (px) {
        differ++;
        if (keep) { const base = path.join(keep, `${name}-${String(step).padStart(4, '0')}`); fs.writeFileSync(`${base}-culled.png`, ia); fs.writeFileSync(`${base}-vis0.png`, ib); fs.writeFileSync(`${base}-diff.png`, encodePng(A.W, A.H, Buffer.from(d))); }
      }
      if (px > worst.px) worst = { px, step, ...st[0] };
    };
    for (const seg of segs) {
      if (seg.goto) {
        for (let i = 0; i < 1200; i++) {
          const left = await Promise.all(pages.map((p) => p.evaluate((g) => window.__vw.step(g), seg.goto)));
          step++; if (step % every === 0) await shoot();
          if (left[0] <= 0.35) break;
        }
      } else {
        for (const p of pages) await p.evaluate((k) => window.__vw.hold(k), seg.keys);
        for (let i = 0; i < seg.frames; i++) { await Promise.all(pages.map((p) => p.evaluate(() => window.__vw.step(null)))); step++; if (step % every === 0) await shoot(); }
      }
      for (const p of pages) await p.evaluate(() => window.__vw.hold([]));
    }
    for (const p of pages) await p.close();
    results.push({ name, steps: step, shots, differ, worst });
    console.log(`${name.padEnd(14)} ${String(step).padStart(4)} steps, ${shots} shots, ${differ} differ; worst ${worst.px} px${worst.px ? ` at step ${worst.step} (${worst.act}${worst.blending ? ', blending' : ''}, player ${worst.x} / ${worst.z})` : ''}`);
  }
} finally { await b.close(); }
if (process.env.JSON) fs.writeFileSync(process.env.JSON, JSON.stringify(results, null, 1));
process.exit(failed ? 1 : 0);
