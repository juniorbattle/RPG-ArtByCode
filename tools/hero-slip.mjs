// The hero's planted foot ON SCREEN, in every view (journal Passe MD1): tools/foot-slip.mjs measures the profile's cycle along the camera's
// right only; a three-quarter or a front walk crosses the screen on a slant, so this tool measures what the eye sees. The page runs its own
// loop (the town page `window.__app` or a square `window.__plaza`); every update is followed, the keys held in the page's own set (QWERTY ids,
// as a tool presses them: « w », « d », « shift ») or the gamepad's walk set on the scene (`pad=x,y[,speed][,run]`). At each change of the
// hero's walk frame: the feet of the frame on its bottom rows (the baked texels, placed on the ground as the billboard places them: anchor,
// camera right, texel x scale x character scale, flip); the foot found nearest to the planted foot of the previous frame change (within
// 1.5 x the hero's advance in that period, 15 cm at least: farther, the other foot landed) is the same foot; its ground drift over that period, projected on screen with the camera of the moment, against the hero's own
// advance on screen: 0 = the foot stays where it stood, 1 = it rides along with the body (a cycle drawn on the spot, sliding with it).
//   node tools/hero-slip.mjs [--secs=4] [--warm=1.5] [--click=x,y] [--json=f] "label|<query or url>|<keys or pad=x,y,..>" ...
// BASE_URL as the other tools (DEV server for the named states); CHROME_PATH / CHROME_ARGS / READY_MS as tools/foot-slip.mjs.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const args = process.argv.slice(2), opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const secs = +opt('secs', 4), warm = +opt('warm', 1.5), json = opt('json', ''), click = opt('click', '');
const runs = args.filter((a) => !a.startsWith('--')).map((a) => { const [label, q, input = ''] = a.split('|'); return { label, url: q.startsWith('http') ? q : `${BASE}?${q}`, input }; });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
// a real gamepad plugged into the machine reaches headless Chrome (journal Passe RM3): hide it
const NOPAD = `Object.defineProperty(navigator, 'getGamepads', { value: () => [null, null, null, null] });`;
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1280,720'], defaultViewport: { width: 1280, height: 720 } });
const report = {};
try {
  for (const r of runs) {
    const page = await b.newPage(); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
    await page.evaluateOnNewDocument(NOPAD);
    await page.goto(r.url, { waitUntil: 'load' });
    await page.waitForFunction('window.__ready === true || !!(window.__plaza && window.__plaza.atlas && window.__plaza.player)', { timeout: +(process.env.READY_MS || 180000) });
    await new Promise((res) => setTimeout(res, warm * 1000));
    if (click) { const [x, y] = click.split(',').map(Number); await page.mouse.click(x, y); await new Promise((res) => setTimeout(res, 500)); }
    const res = await page.evaluate(async (secs, input) => {
      const T = window.__app ? 'town' : 'plaza', app = window.__app ?? window.__plaza;
      const P = T === 'town' ? app.actors.player : app.player, cam = T === 'town' ? app.rig.camera : app.camera;
      const at = app.atlas, data = at.bakedRgba, BW = at.bakedWidth, sprites = app.sprites;
      const keysSet = T === 'town' ? app.actors.keys : app.keys, holder = T === 'town' ? app.actors : app;
      if (input.startsWith('pad=')) { const [x, y, speed = 1, run = 0] = input.slice(4).split(',').map(Number); holder.pad = { x, y, speed, run: !!run }; }
      else for (const k of input.split(',').filter(Boolean)) keysSet.add(k);
      const W = innerWidth, H = innerHeight, V = new cam.position.constructor();
      const px = (x, z) => { V.set(x, P.pos.y, z).project(cam); return [(V.x + 1) / 2 * W, (1 - V.y) / 2 * H]; };
      const feetOf = (dir, fi, rx, rz) => {
        const fr = at.frame(P.spec, dir, P.anim, fi); if (!fr?.cell) return null;
        const [x0, y0, w, h] = fr.cell, k = w / 32, foot = y0 + h - 1 - 45 * k;
        const texel = (0.047 / k) * P.scale * sprites.charScale, sgn = P.flip ? -1 : 1, col = new Array(w).fill(false), out = [];
        for (let y = foot - 2 * k; y <= foot; y++) for (let x = 0; x < w; x++) if (data[(y * BW + x0 + x) * 4 + 3] > 127) col[x] = true;
        let s = -1;
        for (let x = 0; x <= w; x++) { const on = x < w && col[x]; if (on && s < 0) s = x; if (!on && s >= 0) { const o = sgn * ((s + x) / 2 - w / 2) * texel; out.push([P.pos.x + rx * o, P.pos.z + rz * o]); s = -1; } }
        return out;
      };
      const rec = {}; let prev = null, frames = 0, t0 = performance.now();
      const u = app.update.bind(app);
      await new Promise((done) => {
        app.update = (...a) => {
          u(...a); frames++;
          const n = at.counts.get(`${P.spec}/${P.anim}`) ?? 1, fi = Math.floor(P.t * 7.5) % n;
          if (P.anim !== 'walk') { prev = null; return; }
          if (prev && prev.fi === fi && prev.dir === P.dir) return;
          const m = cam.matrixWorldInverse.elements; let rx = m[0], rz = m[8]; const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
          const feet = feetOf(P.dir, fi, rx, rz); if (!feet?.length) { prev = null; return; }
          let foot = null;
          if (prev && prev.dir === P.dir) {
            // the planted foot: the foot of the new frame nearest the ground point of the previous one (a cycle drawn on the spot carries both
            // feet along by the hero's whole advance: still that foot); farther than 1.5 x that advance (and 15 cm), the other foot landed ahead
            const adw = Math.hypot(P.pos.x - prev.x, P.pos.z - prev.z);
            let bd = Math.max(0.15, 1.5 * adw);
            for (const q of feet) { const d = Math.hypot(q[0] - prev.foot[0], q[1] - prev.foot[1]); if (d < bd) { bd = d; foot = q; } }
            const a0 = px(prev.x, prev.z), a1 = px(P.pos.x, P.pos.z), adv = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]);
            if (foot && adv > 0.5) {
              const f0 = px(prev.foot[0], prev.foot[1]), f1 = px(foot[0], foot[1]), slip = Math.hypot(f1[0] - f0[0], f1[1] - f0[1]);
              const key = `${P.dir}${P.flip ? '>' : '<'}`;
              const dtp = (performance.now() - prev.time) / 1000;
              (rec[key] ??= []).push([slip / adv, slip / dtp, (Math.atan2(Math.abs(a1[0] - a0[0]), Math.abs(a1[1] - a0[1])) * 180) / Math.PI, Math.abs(f1[0] - f0[0]) / dtp, Math.abs(f1[1] - f0[1]) / dtp]);
            }
          }
          if (!foot) foot = feet[0];
          prev = { fi, dir: P.dir, foot, x: P.pos.x, z: P.pos.z, time: performance.now() };
        };
        setTimeout(done, secs * 1000);
      });
      app.update = u;
      if (input.startsWith('pad=')) holder.pad = null; else for (const k of input.split(',').filter(Boolean)) keysSet.delete(k);
      return { T, fps: frames / ((performance.now() - t0) / 1000), rec };
    }, secs, r.input);
    const med = (v) => { const s = [...v].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
    console.log(`== ${r.label} (${res.T}, ${res.fps.toFixed(0)} updates/s, ${r.input || 'no input'})`);
    report[r.label] = {};
    for (const [k, v] of Object.entries(res.rec).sort()) {
      const row = { periods: v.length, slip: +med(v.map((x) => x[0])).toFixed(2), pxs: +med(v.map((x) => x[1])).toFixed(0), angle: +med(v.map((x) => x[2])).toFixed(0), hpxs: +med(v.map((x) => x[3])).toFixed(0), vpxs: +med(v.map((x) => x[4])).toFixed(0) };
      report[r.label][k] = row;
      console.log(`  ${k.padEnd(10)} periods ${String(row.periods).padStart(3)}  slip / advance on screen: median ${row.slip.toFixed(2)}  (${row.pxs} px/s: across ${row.hpxs}, up / down ${row.vpxs}; the step ${row.angle} deg from the screen vertical)`);
    }
    await page.close();
  }
} finally { await b.close(); }
if (json) fs.writeFileSync(json, JSON.stringify(report, null, 2));
