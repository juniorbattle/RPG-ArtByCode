// Walking steps by on-screen direction, per framing (journal Passe H6, art-lab/characters/briefs/three-quarter-views.md): the real App.update
// at 1/60 s (seeded Math.random, App.start a no-op from the first script, no rendering; the tools/foot-slip.mjs harness), every NPC step
// projected with the framing's camera. Sectors of 45 deg: front / back < 22.5 deg from the screen vertical, three-quarter 22.5-67.5,
// profile > 67.5; and, for the game's 3-view rule, the share of steps 20-40 deg off the axis of the view it shows (journal Passe F1).
//   node tools/step-angles.mjs [--secs=40] "label|<query or full url>" ...   (BASE_URL env for a bare query; CHROME_PATH, CHROME_ARGS, READY_MS)
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const HOLD = `Object.defineProperty(window, '__app', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__app', { value: v, writable: true, configurable: true }); } });`;
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const args = process.argv.slice(2), secs = +(args.find((a) => a.startsWith('--secs='))?.slice(7) ?? 40);
const runs = args.filter((a) => !a.startsWith('--')).map((a) => { const [label, q] = a.split('|'); return { label, url: q.startsWith('http') ? q : `${BASE}?${q}` }; });
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox'], defaultViewport: { width: 1280, height: 720 } });
try {
  for (const r of runs) {
    const page = await b.newPage(); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
    await page.evaluateOnNewDocument(SEED); await page.evaluateOnNewDocument(HOLD);
    await page.goto(r.url, { waitUntil: 'load' }); await page.waitForFunction('window.__ready === true', { timeout: +(process.env.READY_MS || 180000) });
    const res = await page.evaluate((secs) => {
      const a = window.__app, cam = a.rig.camera, prev = new Map(), out = { n: 0, front: 0, back: 0, q34f: 0, q34b: 0, side: 0, offAxis: 0, shownSide: 0 };
      let clock = 0; const frozen = (fn) => { const n = performance.now; performance.now = () => clock; try { return fn(); } finally { performance.now = n; } };
      for (let i = 0; i < Math.round(secs * 60); i++) {
        clock += 1000 / 60; frozen(() => a.update(1 / 60));
        for (const act of a.actors.actors) {
          if (act === a.actors.player) continue;
          const p = prev.get(act.id); prev.set(act.id, act.pos.clone());
          if (!p || !(act.anim === 'walk' || act.anim === 'carry')) continue;
          const d = act.pos.clone().sub(p); if (d.length() < 1e-4) continue;
          const p0 = p.clone().project(cam), p1 = act.pos.clone().project(cam);
          const dx = (p1.x - p0.x) * cam.aspect, dy = p1.y - p0.y, ang = Math.atan2(Math.abs(dx), Math.abs(dy)) * 180 / Math.PI;
          out.n++;
          if (ang < 22.5) out[dy > 0 ? 'back' : 'front']++; else if (ang < 67.5) out[dy > 0 ? 'q34b' : 'q34f']++; else out.side++;
          // the 3-view rule: the view shown, and how far the step is from that view's axis (vertical for front / back, horizontal for profile)
          const off = act.dir === 'side' ? 90 - ang : ang; if (act.dir === 'side') out.shownSide++;
          if (off >= 20 && off <= 40) out.offAxis++;
        }
      }
      return out;
    }, +secs);
    const pc = (k) => `${(100 * res[k] / Math.max(1, res.n)).toFixed(0)} %`;
    console.log(`${r.label.padEnd(10)} steps ${res.n}: front ${pc('front')}, 3/4 front ${pc('q34f')}, profile ${pc('side')}, 3/4 back ${pc('q34b')}, back ${pc('back')} | 3 views: ${pc('offAxis')} of the steps 20-40 deg off the shown view's axis`);
    await page.close();
  }
} finally { await b.close(); }
