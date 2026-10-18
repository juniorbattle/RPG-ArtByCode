// Foot slip of the baked walkers, in motion (journal Passe S2): the real App.update at 1/60 s (seeded Math.random, App.start a no-op from
// the first script, no rendering). Every frame, for each baked actor walking in the side view: the feet on its frame's foot row (opaque
// runs of the baked texture), placed in the world as the billboard places them (anchor, camera right, texel size x scale x character scale,
// flip), along the camera's right (the billboard's axis). At each frame change, the foot found within 15 cm of the one taken at the previous
// frame change is the same planted foot (a frame change steps it ~11 cm back; the next foot lands 20-30 cm ahead): its drift over the actor's
// own advance along that axis in the period is the slip. Reported: median slip per sheet and framing (0 = the foot stays put; +0.25 = it
// skates forwards a quarter of the walk across the screen; -0.8 = it slides backwards, a moonwalk).
//   node tools/foot-slip.mjs [--secs=20] "label|<query or full url>" ...   (BASE_URL env for a bare query)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const HOLD = `Object.defineProperty(window, '__app', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__app', { value: v, writable: true, configurable: true }); } });`;
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const args = process.argv.slice(2), secs = +(args.find((a) => a.startsWith('--secs='))?.slice(7) ?? 20);
const runs = args.filter((a) => !a.startsWith('--')).map((a) => { const [label, q] = a.split('|'); return { label, url: q.startsWith('http') ? q : `${BASE}?${q}` }; });
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1280,720'], defaultViewport: { width: 1280, height: 720 } });
try {
  for (const r of runs) {
    const page = await b.newPage(); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
    await page.evaluateOnNewDocument(SEED); await page.evaluateOnNewDocument(HOLD);
    await page.goto(r.url, { waitUntil: 'load' }); await page.waitForFunction('window.__ready === true', { timeout: 180000 });
    const res = await page.evaluate((secs) => {
      const a = window.__app, at = a.atlas, data = at.bakedRgba, BW = at.bakedWidth, cam = a.rig.camera;
      let clock = 0; const frozen = (fn) => { const n = performance.now; performance.now = () => clock; try { return fn(); } finally { performance.now = n; } };
      const prev = new Map(), runsBy = {};
      // feet on the foot row, as positions along the camera's right (the billboard's axis: the axis a profile's cycle slides its foot on)
      const feetOf = (act, rx, rz) => {
        const n = at.counts.get(`${act.spec}/${act.anim}`) ?? 1, fr = at.frame(act.spec, 'side', act.anim, Math.floor(act.t * 7.5) % n);
        if (!fr?.cell) return null;   // generated sprite: no baked texels
        const [x0, y0, w, h] = fr.cell, k = w / 32, row = y0 + h - 1 - 45 * k;
        const texel = (0.047 / k) * act.scale * a.sprites.charScale, sgn = act.flip ? -1 : 1, base = act.pos.x * rx + act.pos.z * rz, out = [];
        let s = -1;
        for (let x = 0; x <= w; x++) { const on = x < w && data[((row * BW) + x0 + x) * 4 + 3] > 127; if (on && s < 0) s = x; if (!on && s >= 0) { out.push(base + sgn * ((s + x) / 2 - w / 2) * texel); s = -1; } }
        return out;
      };
      // sampled at each frame change only: between two frame changes the sprite holds (the foot rides with the actor), then the planted foot
      // steps back by the cycle's slide; over that period a matched cadence leaves the foot where it was
      for (let i = 0; i < Math.round(secs * 60); i++) {
        clock += 1000 / 60; frozen(() => a.update(1 / 60));
        const framing = a.graph.blending ? 'blend' : a.graph.target;
        const m = cam.matrixWorldInverse.elements; let rx = m[0], rz = m[8]; const rl = Math.hypot(rx, rz) || 1; rx /= rl; rz /= rl;
        for (const act of a.actors.actors) {
          const walking = act.dir === 'side' && (act.anim === 'walk' || act.anim === 'carry'), p = prev.get(act.id);
          if (!walking) { prev.delete(act.id); continue; }
          const n = at.counts.get(`${act.spec}/${act.anim}`) ?? 1, fi = Math.floor(act.t * 7.5) % n;
          if (p && p.fi === fi) continue;
          const feet = feetOf(act, rx, rz);
          if (!feet || !feet.length) { prev.delete(act.id); continue; }
          const pr = act.pos.x * rx + act.pos.z * rz;
          let foot = null;
          if (p) {
            const dp = pr - p.pr;
            let bd = 0.15;
            for (const q of feet) { const d = Math.abs(q - p.foot); if (d < bd) { bd = d; foot = q; } }
            // the drift of the planted foot over the actor's advance across the screen in that period: + skates forward, - slides backwards
            if (foot !== null && Math.abs(dp) > 0.01) (runsBy[`${act.spec}|${framing}`] ??= []).push((foot - p.foot) / dp);
            if (foot === null) foot = feet.reduce((m2, q) => ((q - pr) * Math.sign(dp || 1) < (m2 - pr) * Math.sign(dp || 1) ? q : m2));   // a landing: the rearmost foot
          }
          prev.set(act.id, { fi, foot: foot ?? feet[0], pr });
        }
      }
      return runsBy;
    }, secs);
    const med = (v) => { const s = [...v].sort((x, y) => x - y); return s[s.length >> 1]; };
    console.log(`== ${r.label}`);
    for (const [k, v] of Object.entries(res).sort()) console.log(`  ${k.padEnd(30)} periods ${String(v.length).padStart(3)}  slip / speed: median ${med(v).toFixed(2)}  [${Math.min(...v).toFixed(2)} .. ${Math.max(...v).toFixed(2)}]`);
    await page.close();
  }
} finally { await b.close(); }
