// The hero's motion, step by step (journal Passe MV1): the real page's update at 1/60 s (seeded Math.random, the page's loop never started, no
// rendering; the town page `window.__app` or a square `window.__plaza`), a script of held keys (`d:2;-:0.5;a:2;d+shift:2`: keys joined by +, `-` nothing held, secs
// after the colon) or of the gamepad's tilt (`pad=x,y[,speed[,run]]:secs`). For every step: the hero's ground speed (m/s), his speed on
// screen (share of the screen's width a second, projected with the page's camera), the frames' clock, and the camera's own move.
//   - the speed reached and the steps it takes to reach it from a stand (a start), and to stop (a stop): 0 = at once, the hero's speed is the key's
//   - the jerk: the largest change of the hero's screen speed between two steps while the keys are the same, in % of that speed (a camera that
//     catches up, a framing's change gliding, show here), and how many steps the hero's screen position goes against his walk
//   - the animation: the frame rate of the cycle (frames of the sheet a second) over the ground speed it draws: 1 = the planted foot stays put
//   node tools/hero-motion.mjs [--json=f] "label|<query or url>|<script>" ...   (BASE_URL env for a bare query; CHROME_PATH, CHROME_ARGS, READY_MS)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const HOLD = ['__app', '__plaza'].map((n) => `Object.defineProperty(window, '${n}', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '${n}', { value: v, writable: true, configurable: true }); } });`).join('\n');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const args = process.argv.slice(2), opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const json = opt('json', '');
const runs = args.filter((a) => !a.startsWith('--')).map((a) => { const [label, q, script = 'd:3'] = a.split('|'); return { label, url: q.startsWith('http') ? q : `${BASE}?${q}`, script }; });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const NOPAD = `Object.defineProperty(navigator, 'getGamepads', { value: () => [null, null, null, null] });`;
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox'], defaultViewport: { width: 1280, height: 720 } });
const report = {};
try {
  for (const r of runs) {
    const page = await b.newPage(); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
    await page.evaluateOnNewDocument(SEED); await page.evaluateOnNewDocument(HOLD); await page.evaluateOnNewDocument(NOPAD);
    await page.goto(r.url, { waitUntil: 'load' });
    await page.waitForFunction('window.__ready === true || !!(window.__plaza && window.__plaza.atlas && window.__plaza.player)', { timeout: +(process.env.READY_MS || 180000) });
    const res = await page.evaluate((script) => {
      const T = window.__app ? 'town' : 'plaza', app = window.__app ?? window.__plaza;
      const cam = T === 'town' ? app.rig.camera : app.camera, P = T === 'town' ? app.actors.player : app.player;
      const keys = T === 'town' ? app.actors.keys : app.keys, holder = T === 'town' ? app.actors : app;
      const upd = (dt) => app.update(dt);
      let clock = 0; const n0 = performance.now; performance.now = () => clock;
      const V = new cam.position.constructor();
      const scr = () => { cam.updateMatrixWorld(); V.set(P.pos.x, P.pos.y, P.pos.z).project(cam); return [V.x * cam.aspect, V.y]; };
      const rows = [], segs = [];
      const step = (n) => { for (let i = 0; i < n; i++) { clock += 1000 / 60; const before = [P.pos.x, P.pos.z], s0 = scr(), t0 = P.t, d0 = P.dir; upd(1 / 60); const s1 = scr(); const m = cam.matrixWorld.elements, zc = -V.set(P.pos.x, P.pos.y, P.pos.z).applyMatrix4(cam.matrixWorldInverse).z, visW = 2 * zc * Math.tan((cam.fov * Math.PI) / 360) * cam.aspect, along = Math.abs((P.pos.x - before[0]) * m[0] + (P.pos.z - before[1]) * m[2]) * 60; rows.push({ x: P.pos.x, z: P.pos.z, fr: T === 'plaza' ? app.framing?.id : '', cross: along / visW, v: Math.hypot(P.pos.x - before[0], P.pos.z - before[1]) * 60, sx: (s1[0] - s0[0]) * 60, sy: (s1[1] - s0[1]) * 60, dt: (P.t - t0) * 60, anim: P.anim, dir: P.dir, turn: d0 !== P.dir, seg: segs.length - 1 }); } };
      try {
        step(300);
        for (const part of script.split(';')) {
          const [what, secs] = part.split(':'), n = Math.round(+secs * 60);
          keys.clear?.(); holder.pad = null;
          if (what.startsWith('pad=')) { const [x, y, speed = 1, run = 0] = what.slice(4).split(',').map(Number); holder.pad = { x, y, speed, run: !!run }; }
          else for (const k of what.split('+')) if (k && k !== '-') keys.add(k);
          segs.push(what); step(n);
        }
      } finally { performance.now = n0; }
      return { T, rows, segs, charScale: app.actors?.charScale ?? null };
    }, r.script);
    report[r.label] = {};
    console.log(`== ${r.label} (${res.T}, ${r.script})`);
    res.segs.forEach((seg, si) => {
      const rows = res.rows.filter((x) => x.seg === si);
      const moving = seg !== '-' && !seg.startsWith('pad=0,0');
      const vmax = Math.max(...rows.map((x) => x.v)), full = rows.filter((x) => x.v >= 0.95 * vmax);
      const med = (v) => { const s = [...v].sort((p, q) => p - q); return s.length ? s[s.length >> 1] : 0; };
      const vs = med(full.map((x) => x.v)), sxs = med(full.map((x) => Math.hypot(x.sx, x.sy)));
      // steps to reach 95 % of the walk's speed from the start of the segment, and to fall under 5 % after it
      const reach = rows.findIndex((x) => x.v >= 0.95 * vs);
      const prevRows = si > 0 ? res.rows.filter((x) => x.seg === si - 1) : [];
      const prevV = med(prevRows.slice(-30).map((x) => x.v));
      const stopSteps = !moving ? rows.findIndex((x) => x.v <= 0.05 * Math.max(prevV, 1e-6)) : null;
      let jerk = 0, at = '', kick = 0, kat = ''; for (let i = 1; i < rows.length; i++) { const a = Math.hypot(rows[i - 1].sx, rows[i - 1].sy), c = Math.hypot(rows[i].sx, rows[i].sy); if (moving && !rows[i].turn && a > 0.2 && Math.abs(c - a) / a > jerk) { jerk = Math.abs(c - a) / a; at = `x ${rows[i].x.toFixed(1)} z ${rows[i].z.toFixed(1)} ${rows[i].fr}`; } }
      for (let i = 1; i < rows.length; i++) { if (!moving || rows[i].turn) continue; const k = Math.hypot(rows[i].sx - rows[i - 1].sx, rows[i].sy - rows[i - 1].sy) / 60 * 640; if (k > kick) { kick = k; kat = `x ${rows[i].x.toFixed(1)} z ${rows[i].z.toFixed(1)} ${rows[i].fr}`; } }
      const cross = med(full.map((x) => x.cross));
      const fps = med(full.map((x) => x.dt * 7.5));
      const row = { speed: +vs.toFixed(2), screenWidthPerSec: +(sxs / (2 * 1.7778)).toFixed(3), crossWidthsPerSec: +cross.toFixed(3), jerkAt: at, kickPx: +kick.toFixed(1), kickAt: kat, startSteps: moving ? reach : null, stopSteps, jerkPct: Math.round(100 * jerk), cycleFps: +fps.toFixed(1), views: [...new Set(rows.map((x) => x.dir))].join('/') };
      report[r.label][`${si}:${seg}`] = row;
      console.log(`  ${seg.padEnd(12)} ${moving ? `speed ${row.speed} m/s, ${row.crossWidthsPerSec} visible widths/s on the ground (${row.screenWidthPerSec} on screen, the camera following); 95 % reached after ${row.startSteps} steps; jerk ${row.jerkPct} % (${row.jerkAt}); the largest kick of the hero's screen position between two steps ${row.kickPx} px (${row.kickAt}); cycle ${row.cycleFps} frames/s; views ${row.views}` : `stops after ${row.stopSteps} steps (from ${prevV.toFixed(2)} m/s)`}`);
    });
    await page.close();
  }
} finally { await b.close(); }
if (json) fs.writeFileSync(json, JSON.stringify(report, null, 2));
