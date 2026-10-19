// Checks of the arena prototype (`arena/arena.html`, journal Passe A1), one or more files in turn, same harness as tools/arena-shots.mjs:
//   1. the combat simulation alone (CombatLib, no rendering): 120 s of a fixed input script from a reset, its state hash (same rules = same hash);
//   2. every scripted moment in every mode (hd2d, hybrid, full3d): jump, one render, page errors and console errors counted;
//   3. the telegraph's contrast against the floor in the reaction window (full assistance), read back as the page's device test does
//      (`DeviceTest`, threshold 2:1, also with a deuteranopia simulation).
//   node tools/arena-check.mjs <file.html> [file.html ...]       (env as tools/arena-shots.mjs; exit 1 on an error or a contrast under 2:1)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const files = process.argv.slice(2);
if (!files.length) throw new Error('usage: node tools/arena-check.mjs <file.html> [file.html ...]');
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 } });
let failed = false;
try {
  for (const file of files) {
    const dir = path.dirname(path.resolve(file)), name = path.basename(file);
    const server = http.createServer((q, s) => { const p = path.join(dir, decodeURIComponent(q.url.split('?')[0])); if (!p.startsWith(dir) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) { s.writeHead(404); s.end(); return; } s.writeHead(200, { 'content-type': 'text/html; charset=utf-8' }); s.end(fs.readFileSync(p)); });
    await new Promise((r) => server.listen(0, '127.0.0.1', r));
    const page = await b.newPage(), errors = [];
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error' && !/status of 404/.test(m.text())) errors.push('console: ' + m.text()); });
    await page.setRequestInterception(true);
    page.on('request', (q) => { const u = q.url(); if (u === THREE_URL && process.env.ARENA_THREE) return q.respond({ status: 200, contentType: 'application/javascript', body: fs.readFileSync(process.env.ARENA_THREE) }); if (process.env.ARENA_FONTS === '0' && /fonts\.(googleapis|gstatic)\.com/.test(u)) return q.abort(); return q.continue(); });
    await page.evaluateOnNewDocument(SEED);
    await page.goto(`http://127.0.0.1:${server.address().port}/${name}?clean=1`, { waitUntil: 'load', timeout: 120000 });
    await page.waitForFunction('window.__bake && window.__bake.R && window.__bake.R.hd2d && !document.getElementById("boot")', { timeout: +(process.env.READY_MS || 300000) });
    const res = await page.evaluate(() => {
      const B = window.__bake; B.S.noRender = true;
      // 1. the simulation alone: a fixed input script (attacks, guard, dodges in the windows), 120 s at the simulation's own step
      const sim = new window.CombatLib.CombatSim(), dt = sim.D.dt; let nextAct = 0.5, n = 0;
      for (let i = 0; i < Math.round(120 / dt); i++) {
        const inc = sim.incoming();
        if (inc && inc.windowOpen && inc.kind === 'heavy') sim.react('ren', 'dodge');
        sim.setGuard('ren', !!(inc && inc.kind === 'light' && !inc.windowOpen));
        if (sim.t >= nextAct) { const ids = ['light', 'light', 'heavy', 't1', 'light', 't2', 't3', 't4']; sim.command('ren', ids[n++ % ids.length]); nextAct += 0.7; }
        sim.step(dt); sim.drain(); if (sim.over) { sim.reset(); }
      }
      const simHash = sim.hash();
      // 2. every scripted moment in every mode
      const renders = [];
      for (const mode of ['hd2d', 'hybrid', 'full3d']) { B.setMode(mode); for (const p of B.presets) { B.jump(p); B.renderOnce(); renders.push(mode + ':' + p); } }
      // 3. telegraph against the floor (DeviceTest.readRect, same rectangles), reaction window, full assistance
      B.setMode('hd2d'); window.__assist = 'full'; B.jump('window'); B.renderOnce();
      const a = B.R.hd2d, T = a.THREE, glc = a.renderer.getContext();
      function project(v) { const o = v.clone().project(a.camera), c = a.renderer.domElement; return [(o.x * .5 + .5) * c.width, (o.y * .5 + .5) * c.height]; }
      function readRect(wx0, wx1, wz0, wz1, y) {
        const pts = [[wx0, wz0], [wx1, wz0], [wx0, wz1], [wx1, wz1]].map((p) => project(new T.Vector3(p[0], y, p[1])));
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), x0 = Math.floor(Math.min(...xs)), x1 = Math.ceil(Math.max(...xs)), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
        const w = Math.max(2, Math.min(x1 - x0, 160)), h = Math.max(2, Math.min(y1 - y0, 60)), buf = new Uint8Array(w * h * 4);
        glc.bindFramebuffer(glc.FRAMEBUFFER, null); glc.readPixels(Math.max(0, x0), Math.max(0, y0), w, h, glc.RGBA, glc.UNSIGNED_BYTE, buf);
        const s = [0, 0, 0]; for (let i = 0; i < w * h; i++) { s[0] += buf[i * 4]; s[1] += buf[i * 4 + 1]; s[2] += buf[i * 4 + 2]; } return s.map((v) => v / (w * h));
      }
      const lin = (c) => { c /= 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); };
      const lum = (c) => .2126 * lin(c[0]) + .7152 * lin(c[1]) + .0722 * lin(c[2]);
      const deut = (c) => { const r = lin(c[0]), g = lin(c[1]), bb = lin(c[2]); return .2126 * (.367 * r + .861 * g - .228 * bb) + .7152 * (.28 * r + .673 * g + .047 * bb) + .0722 * (-.012 * r + .043 * g + .969 * bb); };
      const ratio = (x, y) => (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
      const tc = readRect(-1, 1, -.35, .35, .03), fc = readRect(-1, 1, -2.7, -1.9, .03);
      return { simHash, renders: renders.length, telegraph: { tele: tc.map(Math.round), floor: fc.map(Math.round), contrast: +ratio(lum(tc), lum(fc)).toFixed(2), contrastDeuteranopia: +ratio(deut(tc), deut(fc)).toFixed(2) } };
    });
    const bad = errors.length > 0 || res.telegraph.contrast < 2 || res.telegraph.contrastDeuteranopia < 2;
    failed ||= bad;
    console.log(JSON.stringify({ file, ...res, errors: errors.slice(0, 10), errorCount: errors.length, verdict: bad ? 'FAIL' : 'PASS' }));
    await page.close(); server.close();
  }
} finally { await b.close(); }
process.exit(failed ? 1 : 0);
