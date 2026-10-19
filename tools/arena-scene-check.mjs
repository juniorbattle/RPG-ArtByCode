// Checks of the game's arena scene (`?scene=arena`, journal Passe P1) on a running dev server, same harness as tools/arena-scene-shots.mjs:
//   1. the simulation in the page (the ported CombatSim): the fixed input script of tools/arena-check.mjs, its hash against the prototype's;
//   2. every scripted moment in every assistance mode (subtle, full, off): jump, one render, page errors and console errors counted;
//   3. the floor telegraph's contrast in the reaction window (full assistance), read back from a capture: the band against the floor just
//      behind and just in front of it (threshold 2:1, also with a deuteranopia simulation), as the prototype's device test.
//   node tools/arena-scene-check.mjs ["<extra query>"]      (BASE_URL, W / H, CHROME_PATH / CHROME_ARGS / READY_MS as tools/arena-scene-shots.mjs;
//   exit 1 on an error, a wrong hash or a contrast under 2:1)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { decodePng } from './art-lab/png.mjs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const PROTOTYPE_HASH = '152:1:idle:20.233:0.00,0.00,0.00,0.00;800:0:idle:5.283:0.00,0.00,0.00,0.00;20.233';
const extra = process.argv[2] ?? '';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720);
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 } });
let failed = false;
try {
  const page = await b.newPage(), errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  await page.evaluateOnNewDocument(SEED);
  await page.goto(`${BASE}?scene=arena&freeze=7.3${extra ? '&' + extra : ''}`, { waitUntil: 'load', timeout: 120000 });
  await page.waitForFunction('window.__ready === true || window.__error', { timeout: +(process.env.READY_MS || 300000) });
  const err = await page.evaluate(() => window.__error);
  if (err) throw new Error(err);
  // 0. live: the page's own loop runs while keys are pressed (light attacks, a technique, guard held, a dodge); the simulation must advance
  //    and take the commands
  const t0 = await page.evaluate(() => window.__arena.sim.t);
  for (const k of ['1', '1', '3', 'b', 'a', '2']) { if (k === 'b') { await page.keyboard.down('b'); await new Promise((r) => setTimeout(r, 600)); await page.keyboard.up('b'); } else await page.keyboard.press(k); await new Promise((r) => setTimeout(r, 700)); }
  const live = await page.evaluate(() => { const A = window.__arena; return { simT: +A.sim.t.toFixed(3), lastAction: A.sim.f.ren.lastAction, marekHp: A.sim.f.marek.hp, frames: A.frameCount, stats: window.__stats() }; });
  live.advanced = +(live.simT - t0).toFixed(3);
  const res = await page.evaluate(() => {
    const A = window.__arena;
    // 1. the simulation alone (a fresh instance of the page's class), the fingerprint script
    const sim = new A.sim.constructor(), dt = sim.D.dt; let nextAct = 0.5, n = 0;
    for (let i = 0; i < Math.round(120 / dt); i++) {
      const inc = sim.incoming();
      if (inc && inc.windowOpen && inc.kind === 'heavy') sim.react('ren', 'dodge');
      sim.setGuard('ren', !!(inc && inc.kind === 'light' && !inc.windowOpen));
      if (sim.t >= nextAct) { const ids = ['light', 'light', 'heavy', 't1', 'light', 't2', 't3', 't4']; sim.command('ren', ids[n++ % ids.length]); nextAct += 0.7; }
      sim.step(dt); sim.drain(); if (sim.over) sim.reset();
    }
    // 2. every moment in every assistance mode
    const presets = ['charging', 'ready', 'casting', 'window', 'impact', 'block', 'guardbreak', 'dodge', 'combo', 'single', 'technique', 'strike', 'heavyRen', 'ko'];
    let renders = 0;
    for (const mode of ['subtle', 'full', 'off']) { A.assist = mode; for (const p of presets) { if (!A.jump(p)) throw new Error('preset ' + p); A.renderOnce(); renders++; } }
    // 3. the telegraph moment, its rectangles projected to the screen
    A.assist = 'full'; A.jump('window'); A.renderOnce();
    const r = A.fighters.ren.pos.x, m = A.fighters.marek.pos.x, x0 = Math.min(r, m) + 0.6, x1 = Math.max(r, m) - 0.65;
    const rect = (zA, zB) => {
      const pts = [[x0, zA], [x1, zA], [x0, zB], [x1, zB]].map(([x, z]) => { const v = new A.camera.position.constructor(x, 0.012, z).project(A.camera); return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight]; });
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
      return [Math.floor(Math.min(...xs)), Math.floor(Math.min(...ys)), Math.ceil(Math.max(...xs)), Math.ceil(Math.max(...ys))];
    };
    return { simHash: sim.hash(), renders, band: rect(-0.4, 0.4), behind: rect(-1.6, -1.0), front: rect(1.0, 1.6) };
  });
  const shot = decodePng(Buffer.from(await page.screenshot({ type: 'png' }))), png = { width: shot.W, height: shot.H, data: shot.rgba };
  const mean = ([x0, y0, x1, y1]) => { const s = [0, 0, 0]; let n = 0; for (let y = Math.max(0, y0); y < Math.min(png.height, y1); y++) for (let x = Math.max(0, x0); x < Math.min(png.width, x1); x++) { const i = (y * png.width + x) * 4; s[0] += png.data[i]; s[1] += png.data[i + 1]; s[2] += png.data[i + 2]; n++; } return s.map((v) => v / Math.max(1, n)); };
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const deut = (c) => { const r = lin(c[0]), g = lin(c[1]), bb = lin(c[2]); return 0.2126 * (0.367 * r + 0.861 * g - 0.228 * bb) + 0.7152 * (0.28 * r + 0.673 * g + 0.047 * bb) + 0.0722 * (-0.012 * r + 0.043 * g + 0.969 * bb); };
  const ratio = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  const tc = mean(res.band), fb = mean(res.behind), ff = mean(res.front);
  const contrast = +Math.min(ratio(lum(tc), lum(fb)), ratio(lum(tc), lum(ff))).toFixed(2), contrastDeuteranopia = +Math.min(ratio(deut(tc), deut(fb)), ratio(deut(tc), deut(ff))).toFixed(2);
  const bad = errors.length > 0 || res.simHash !== PROTOTYPE_HASH || contrast < 2 || contrastDeuteranopia < 2 || !(live.advanced > 0) || !live.lastAction;
  failed = bad;
  console.log(JSON.stringify({ live: { advanced: live.advanced, lastAction: live.lastAction, marekHp: live.marekHp, frames: live.frames, drawCalls: live.stats.drawCalls, frameTriangles: live.stats.frameTriangles, triangles: live.stats.triangles, instances: live.stats.instances, lights: live.stats.lights, atlas: live.stats.atlas }, simHash: res.simHash, sameAsPrototype: res.simHash === PROTOTYPE_HASH, renders: res.renders, telegraph: { band: tc.map(Math.round), behind: fb.map(Math.round), front: ff.map(Math.round), contrast, contrastDeuteranopia }, errors: errors.slice(0, 10), errorCount: errors.length, verdict: bad ? 'FAIL' : 'PASS' }));
} finally { await b.close(); }
process.exit(failed ? 1 : 0);
