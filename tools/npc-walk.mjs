// What the walkers of the town do, and how they are shown (journal Passe MV1): the real page's update at 1/60 s (seeded Math.random, the page's loop
// never started, no rendering: the harness of tools/step-angles.mjs for the town page `window.__app` and of tools/plaza-shots.mjs for a square
// `window.__plaza`), every walker that is not a standing person followed for `--secs` seconds of game time.
//   - the time in walk against the time at rest, the length of a trip (a run of frames in walk, in metres and in seconds) and of a pause
//   - for each step the way it crosses the SCREEN (the actor's displacement projected with the page's camera, degrees from the vertical) against
//     the view shown (front / back, three-quarter, profile): a body is « sideways » when a front or back view crosses the screen more than 35 deg
//     from the vertical (it slides across) or a profile moves more than 35 deg from the horizontal (it walks into the depth)
//   node tools/npc-walk.mjs [--secs=120] [--json=f] "label|<query or full url>" ...   (BASE_URL env for a bare query; CHROME_PATH, CHROME_ARGS, READY_MS)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const HOLD = ['__app', '__plaza'].map((n) => `Object.defineProperty(window, '${n}', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '${n}', { value: v, writable: true, configurable: true }); } });`).join('\n');
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const args = process.argv.slice(2), opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const secs = +opt('secs', 120), json = opt('json', '');
const runs = args.filter((a) => !a.startsWith('--')).map((a) => { const [label, q] = a.split('|'); return { label, url: q.startsWith('http') ? q : `${BASE}?${q}` }; });
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
    const res = await page.evaluate((secs) => {
      const T = window.__app ? 'town' : 'plaza', app = window.__app ?? window.__plaza;
      const cam = T === 'town' ? app.rig.camera : app.camera, player = T === 'town' ? app.actors.player : app.player;
      const list = () => (T === 'town' ? app.actors.actors : app.people).filter((a) => a !== player && a.spec !== 'cat' && a.behaviour && (a.behaviour.kind === 'wander' || a.behaviour.kind === 'patrol'));
      const upd = T === 'town' ? (dt, el) => app.update(dt, el) : (dt) => app.update(dt);
      let clock = 0; const n0 = performance.now;
      performance.now = () => clock;
      const st = new Map(), trips = [], pauses = [];
      const tot = { frames: 0, walk: 0, steps: 0, skew: 0, skewFront: 0, skewSide: 0, accepted: 0, beyond: 0, bins: {}, skewBy: {}, slips: [] };
      const castOf = T === 'town' ? app.actors.cast : app.cast, CS = T === 'town' ? app.actors.charScale : 1.12;
      const yawOf = () => (T === 'town' ? app.actors.camYaw : app.pose.yaw);
      const V0 = new cam.position.constructor(), V1 = new cam.position.constructor();
      const N = Math.round(secs * 60);
      try {
        for (let i = 0; i < N; i++) {
          clock += 1000 / 60; upd(1 / 60, i / 60);
          cam.updateMatrixWorld();
          for (const a of list()) {
            let s = st.get(a); if (!s) { s = { x: a.pos.x, z: a.pos.z, at: a.t, walking: false, len: 0, t: 0, rest: 0 }; st.set(a, s); }
            const dx = a.pos.x - s.x, dz = a.pos.z - s.z, moved = Math.hypot(dx, dz), walking = (a.anim === 'walk' || a.anim === 'carry') && moved > 1e-5;
            tot.frames++;
            if (walking) {
              tot.walk++; tot.steps++;
              V0.set(s.x, a.pos.y, s.z).project(cam); V1.set(s.x + (dx / moved) * 0.05, a.pos.y, s.z + (dz / moved) * 0.05).project(cam);
              const sx = (V1.x - V0.x) * cam.aspect, sy = V1.y - V0.y, ang = (Math.atan2(Math.abs(sx), Math.abs(sy)) * 180) / Math.PI;
              const view = a.dir === 'down' || a.dir === 'up' ? 'fb' : a.dir === 'side' ? 'side' : 'q34';
              const bin = ang < 22.5 ? 'v' : ang < 67.5 ? 'q' : 'h';
              const k = `${view}:${bin}`; tot.bins[k] = (tot.bins[k] ?? 0) + 1;
              // a 'down' drawn turned to the left (frontLeft) is a light three-quarter front, accepted up to 72.5 deg (journal Passe F3)
              const fl = !!castOf?.get(a.base ?? '')?.frontLeft && a.dir === 'down';
              if (view === 'fb' && ang > 35) { if (fl && ang <= 72.5) tot.accepted++; else { tot.skew++; tot.skewFront++; const kb = `${a.spec}@${Math.floor(ang / 5) * 5}`; tot.skewBy[kb] = (tot.skewBy[kb] ?? 0) + 1; } }
              if ((view === 'fb' && ang > 50 && !(fl && ang <= 72.5)) || (view === 'side' && ang < 40)) tot.beyond++;
              if (view === 'side' && ang < 55) { tot.skew++; tot.skewSide++; }
            }
            if (walking) {
              // the planted foot: the ground the cycle draws at the clock the walker runs (its speed x the character scale x the clock) against the ground it covers
              const ws = castOf?.get(a.base ?? '')?.walkSpeed, clock = (a.t - s.at) * 60;
              if (ws && clock > 0) {
                const yw = yawOf(), shown = a.dir === 'side' ? Math.abs(dx * 60 * Math.cos(yw) - dz * 60 * Math.sin(yw)) : moved * 60;
                tot.slips.push(1 - shown / (ws * CS * clock));
              }
            }
            s.at = a.t;
            if (walking) { if (!s.walking) { s.len = 0; s.t = 0; if (s.rest) pauses.push(s.rest / 60); s.rest = 0; } s.len += moved; s.t++; }
            else { if (s.walking) trips.push([s.len, s.t / 60]); s.rest++; }
            s.walking = walking; s.x = a.pos.x; s.z = a.pos.z;
          }
        }
      } finally { performance.now = n0; }
      return { T, walkers: st.size, ...tot, trips, pauses };
    }, secs);
    const med = (v) => { const s = [...v].sort((x, y) => x - y); return s.length ? s[s.length >> 1] : NaN; };
    const pct = (x, y) => (y ? Math.round((1000 * x) / y) / 10 : 0);
    const lens = res.trips.map((t) => t[0]), durs = res.trips.map((t) => t[1]);
    const row = {
      walkers: res.walkers, walkShare: pct(res.walk, res.frames), trips: res.trips.length,
      tripLenMed: +med(lens).toFixed(1), tripLenMean: +(lens.reduce((x, y) => x + y, 0) / (lens.length || 1)).toFixed(1), tripSecMed: +med(durs).toFixed(1), tripSecMax: +Math.max(0, ...durs).toFixed(1),
      pauseSecMed: +med(res.pauses).toFixed(1), pauses: res.pauses.length, skewBy: Object.entries(res.skewBy).sort((x, y) => y[1] - x[1]).slice(0, 6).map(([k, v]) => `${k} ${v}`).join(', '), skewShare: pct(res.skew, res.steps), accepted: pct(res.accepted, res.steps), beyond: pct(res.beyond, res.steps), slipMed: Math.round(100 * med(res.slips)), slipBad: pct(res.slips.filter((x) => Math.abs(x) > 0.15).length, res.slips.length), skewFront: pct(res.skewFront, res.steps), skewSide: pct(res.skewSide, res.steps), bins: res.bins,
    };
    report[r.label] = row;
    console.log(`== ${r.label} (${res.T}, ${secs} s, ${row.walkers} walkers)`);
    console.log(`  walking ${row.walkShare} % of the time; ${row.trips} trips: length median ${row.tripLenMed} m (mean ${row.tripLenMean}), ${row.tripSecMed} s (longest ${row.tripSecMax} s); ${row.pauses} pauses, median ${row.pauseSecMed} s`);
    console.log(`  steps shown sideways: ${row.skewShare} % (a front or back view crossing the screen ${row.skewFront} %, a profile walking into the depth ${row.skewSide} %); ${row.accepted} % more are the front three-quarter accepted in Passe F3; ${row.beyond} % are past the edges of that rule itself (a front or back beyond 50 deg, a profile under 40)`);
    if (row.skew || row.skewFront) console.log(`  where: ${row.skewBy}`);
    console.log(`  the planted foot: the cycle draws ${row.slipMed} % more ground than the walker covers (median, + = the feet slide back); ${row.slipBad} % of the steps are off by more than 15 %`);
    console.log(`  view : step on screen (v < 22.5, q 22.5-67.5, h > 67.5 deg from the vertical): ${Object.entries(row.bins).sort().map(([k, v]) => `${k} ${pct(v, res.steps)}%`).join('  ')}`);
    await page.close();
  }
} finally { await b.close(); }
if (json) fs.writeFileSync(json, JSON.stringify(report, null, 2));
