// Dynamic in-scene validation of a lab / baked sprite (DEV only): the old DEV preview (`?labsprite=&labhd=1`, its own renderer) or the
// shared-atlas path (`?baked=`, the main renderer, src/lab/bakedLoader.ts). Math.random is seeded before the page loads. The app loop is
// taken over and stepped at 1/60 s; the player is driven by the real movement keys (same steering as tools/camsim.mjs), so collisions,
// camera zones, blends, occlusion reveal and DOF focus are the game's own. Actor 0 can follow the (hidden) player (`labfollow=1` /
// `bakedfollow=1`) or the actors stand still while the camera moves.
// Per frame and per tracked lab actor: a fixed-size 1:1 crop around its feet (JPEG, for the sequence viewer), and the sprite's own pixels
// (frame rendered with / without the lab renderer: the difference isolates it) -> churn vs the previous frame (best +-3 px re-alignment),
// silhouette churn, share of dark outline texels kept, screen px per texel. A half-size full frame is kept every `full` frames.
// node tools/art-lab/dynwalk.mjs <outDir> <name> "<query>" "x,z" "<route: g=x,z;g=x,z;-:secs>" [track=0,1] [full=6] [crop=400x440]
// Check routes with tools/camsim.mjs first. Table: node tools/art-lab/dynwalk-report.mjs <outDir> [run ...]
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5180/';
const [outDir, name, query, start, route, ...opt] = process.argv.slice(2);
const o = Object.fromEntries(opt.map((s) => s.split('=')));
const track = (o.track ?? '0').split(',').map(Number), fullEvery = Number(o.full ?? 6), [CW, CH] = (o.crop ?? '400x440').split('x').map(Number);
const dir = path.join(outDir, name); fs.mkdirSync(dir, { recursive: true });
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1920,1080', '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } });
const log = [];
try {
  const page = await b.newPage(); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.evaluateOnNewDocument(SEED);
  await page.goto(`${BASE}?${query}`, { waitUntil: 'load' }); await page.waitForFunction('window.__ready === true || !!window.__error', { timeout: 180000 });
  const bootErr = await page.evaluate(() => window.__error ?? window.__baked?.error ?? window.__labSprite?.error ?? null);
  if (bootErr) throw new Error(bootErr);
  const [sx, sz] = start.split(',').map(Number);
  await page.evaluate((sx, sz) => {
    const a = window.__app, p = a.actors.player.pos, u = a.update.bind(a), r = a.render.bind(a);
    for (const k of [...a.actors.keys]) a.actors.keys.delete(k);
    a.graph.arrival = false; p.set(sx, 0, sz); a.graph.snap(p, a.rig); a.actors.controlYaw = a.actors.camYaw = a.rig.yaw;
    a.update = () => {}; a.render = () => {};
    // one frozen clock per frame for everything that reads it (speech-bubble bob, ...): the on / off renders of a frame then differ by the
    // tracked sprite only (with a live clock the shared path's re-update moved the bubbles between the two renders)
    let clock = 0; const frozen = (fn) => { const n = performance.now; performance.now = () => clock; try { return fn(); } finally { performance.now = n; } };
    for (let i = 0; i < 90; i++) u(1 / 60);                    // settle at the start pose
    const KEYS = [['d'], ['a'], ['w'], ['s'], ['w', 'd'], ['w', 'a'], ['s', 'd'], ['s', 'a']];
    const steer = (gx, gz) => { const c = Math.cos(a.actors.controlYaw), s = Math.sin(a.actors.controlYaw), hx = gx - p.x, hz = gz - p.z, hl = Math.hypot(hx, hz) || 1; let best = KEYS[0], bd = -9;
      for (const ks of KEYS) { const ix = (ks.includes('d') ? 1 : 0) - (ks.includes('a') ? 1 : 0), iy = (ks.includes('w') ? 1 : 0) - (ks.includes('s') ? 1 : 0); let mx = c * ix - s * iy, mz = -s * ix - c * iy; const ml = Math.hypot(mx, mz); mx /= ml; mz /= ml; const d = (mx * hx + mz * hz) / hl; if (d > bd) { bd = d; best = ks; } }
      for (const k of [...a.actors.keys]) a.actors.keys.delete(k); for (const k of best) a.actors.keys.add(k); };
    const V = a.rig.camera.position.constructor, info = window.__labSprite ?? window.__baked;
    // isolate the tracked sprites: the old preview toggles its own renderer group, the shared path hides its authored actors
    const show = (v) => { if (info.group) info.group.visible = v; else info.setVisible(v); };
    window.__dyn = {
      step(goal) { if (goal) steer(goal[0], goal[1]); else for (const k of [...a.actors.keys]) a.actors.keys.delete(k);
        clock += 1000 / 60; frozen(() => { u(1 / 60); show(true); r(); });
        const cam = a.rig.camera, cs = a.sprites.charScale, g = a.graph, st = g.state, W = innerWidth, H = innerHeight;
        return { px: p.x, pz: p.z, target: g.target, blending: g.blending, blendT: g.blendT, act: g.activeIds().join(''), cs, yaw: st.yaw * 57.29578, fov: st.fov,
          occ: a.occlusion.stats.active, dof: a.post.params.dofFocus, held: [...a.actors.keys].join('') }; },
      project(x, z) { const cam = a.rig.camera, cs = a.sprites.charScale, W = innerWidth, H = innerHeight, f = new V(x, 0, z).project(cam), h = new V(x, info.frame[1] * info.metresPerTexel * info.scale * cs, z).project(cam);
        return { fx: (f.x + 1) / 2 * W, fy: (1 - f.y) / 2 * H, hpx: ((1 - f.y) - (1 - h.y)) / 2 * H, front: f.z < 1, fh: info.frame[1] }; },
      off() { frozen(() => { show(false); r(); }); }, on() { frozen(() => { show(true); r(); }); },
    };
  }, sx, sz);
  // the lab actors' positions (actor 0 follows the player when labfollow=1)
  const labPos = await page.evaluate(() => (window.__labSprite ?? window.__baked).placed);
  const follow = /(lab|baked)follow=1/.test(query);
  const ana = await b.newPage(); await page.bringToFront();   // a background tab produces no frames: captures would hang
  await ana.evaluate(() => { window.prev = {}; window.lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    window.dec = async (b64) => { const i = new Image(); await new Promise((r) => { i.onload = r; i.src = 'data:image/png;base64,' + b64; }); const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const g = c.getContext('2d'); g.drawImage(i, 0, 0); return g.getImageData(0, 0, i.width, i.height); };
    window.measure = async (key, onB, offB, footRow) => { const A = await dec(onB), B = await dec(offB), W = A.width, H = A.height, m = new Uint8Array(W * H); let n = 0, y0 = 1e9, y1 = -1, ring = 0, ringDark = 0;
      for (let y = 0; y < Math.min(H, footRow + 1); y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (Math.max(Math.abs(A.data[i] - B.data[i]), Math.abs(A.data[i + 1] - B.data[i + 1]), Math.abs(A.data[i + 2] - B.data[i + 2])) > 10) { m[y * W + x] = 1; n++; y0 = Math.min(y0, y); y1 = Math.max(y1, y); } }
      for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) if (m[y * W + x] && (!m[y * W + x - 1] || !m[y * W + x + 1] || !m[(y - 1) * W + x] || !m[(y + 1) * W + x])) { ring++; if (lum(A.data, (y * W + x) * 4) < 45) ringDark++; }
      if (n > 0.45 * W * H) return { glitch: true, n };
      const P = prev[key]; let churn = null, shape = null;
      if (P && n && P.n) { let best = 1, bestS = 1; for (let sy = -3; sy <= 3; sy++) for (let sx = -3; sx <= 3; sx++) { let uni = 0, bad = 0, badS = 0;
          for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const qx = x + sx, qy = y + sy, inQ = qx >= 0 && qy >= 0 && qx < W && qy < H; const a = P.m[y * W + x], c = inQ ? m[qy * W + qx] : 0; if (!a && !c) continue; uni++;
            if (a !== c) { bad++; badS++; continue; } const i = (y * W + x) * 4, j = (qy * W + qx) * 4; if (Math.max(Math.abs(P.d[i] - A.data[j]), Math.abs(P.d[i + 1] - A.data[j + 1]), Math.abs(P.d[i + 2] - A.data[j + 2])) > 24) bad++; }
          if (uni) { best = Math.min(best, bad / uni); bestS = Math.min(bestS, badS / uni); } } churn = best; shape = bestS; }
      prev[key] = { m, d: A.data, n }; return { n, h: y1 - y0 + 1, ringDarkPct: ring ? +(100 * ringDark / ring).toFixed(1) : null, churn, shape }; };
  });
  const segs = route.split(';').map((s) => (s.startsWith('g=') ? { goto: s.slice(2).split(',').map(Number) } : { wait: Number(s.split(':')[1]) }));
  let k = 0;
  const frame = async (goal) => {
    const st = await page.evaluate((g) => window.__dyn.step(g), goal);
    const pos = labPos.map((q, i) => (i === 0 && follow ? [st.px, st.pz] : q));
    const boxes = [];
    for (const ti of track) { const pr = await page.evaluate((x, z) => window.__dyn.project(x, z), pos[ti][0], pos[ti][1]);
      const clip = { x: Math.round(pr.fx - CW / 2), y: Math.round(pr.fy - CH + 40), width: CW, height: CH };
      const vis = pr.front && clip.x > -CW / 2 && clip.y > -CH / 2 && clip.x + CW < 1920 + CW / 2 && clip.y + CH < 1080 + CH / 2;
      clip.x = Math.max(0, Math.min(1920 - CW, clip.x)); clip.y = Math.max(0, Math.min(1080 - CH, clip.y));
      boxes.push({ ti, pr, clip, vis }); }
    const rec = { k, t: +(k / 60).toFixed(3), ...st, actors: [] };
    const ons = [];
    for (const bx of boxes) { if (!bx.vis) { rec.actors.push({ ti: bx.ti, vis: false }); ons.push(null); continue; }
      const jp = path.join(dir, `a${bx.ti}-${String(k).padStart(4, '0')}.jpg`); for (let t = 0; t < 3; t++) { await page.evaluate(() => window.__dyn.on()); await page.screenshot({ clip: bx.clip, type: 'jpeg', quality: 92, path: jp }); if (fs.statSync(jp).size > 6000) break; }   // a rare capture comes back black: retake
      await page.evaluate(() => window.__dyn.on()); ons.push(await page.screenshot({ clip: bx.clip, encoding: 'base64' })); }   // a capture needs a fresh frame
    if (k % fullEvery === 0) { await page.evaluate(() => window.__dyn.on()); await page.screenshot({ type: 'jpeg', quality: 70, path: path.join(dir, `full-${String(k).padStart(4, '0')}.jpg`) }); }
    for (const [i, bx] of boxes.entries()) { if (!ons[i]) continue; await page.evaluate(() => window.__dyn.off()); let off = await page.screenshot({ clip: bx.clip, encoding: 'base64' });
      let m = await ana.evaluate((key, a, c, f) => window.measure(key, a, c, f), `a${bx.ti}`, ons[i], off, Math.round(bx.pr.fy) - bx.clip.y), retries = 0;
      while (m.glitch && retries < 2) { retries++; await page.evaluate(() => window.__dyn.on()); ons[i] = await page.screenshot({ clip: bx.clip, encoding: 'base64' }); await page.evaluate(() => window.__dyn.off()); off = await page.screenshot({ clip: bx.clip, encoding: 'base64' });
        m = await ana.evaluate((key, a, c, f) => window.measure(key, a, c, f), `a${bx.ti}`, ons[i], off, Math.round(bx.pr.fy) - bx.clip.y); }
      m.retries = retries;
      rec.actors.push({ ti: bx.ti, vis: true, fx: Math.round(bx.pr.fx), fy: Math.round(bx.pr.fy), hpx: +bx.pr.hpx.toFixed(1), ppt: +(bx.pr.hpx / bx.pr.fh).toFixed(3), ...m }); }
    await page.evaluate(() => window.__dyn.on());
    log.push(rec); k++;
  };
  for (const s of segs) {
    if (s.goto) { for (let i = 0; i < 1500; i++) { const p = log.length ? [log[log.length - 1].px, log[log.length - 1].pz] : [sx, sz]; if (i && Math.hypot(s.goto[0] - p[0], s.goto[1] - p[1]) <= 0.35) break; await frame(s.goto); } }
    else for (let i = 0; i < Math.round(s.wait * 60); i++) await frame(null);
  }
} finally { await b.close(); }
fs.writeFileSync(path.join(dir, 'log.json'), JSON.stringify(log));
// summary per tracked actor and per framing
const sum = {};
for (const ti of track) { const rows = log.flatMap((r) => r.actors.filter((a) => a.ti === ti && a.vis && a.churn != null).map((a) => ({ ...a, target: r.blending ? 'blend' : r.target })));
  const by = {}; for (const r of rows) (by[r.target] ??= []).push(r);
  const st = (arr, f) => { const s = arr.map(f).sort((x, y) => x - y); return s.length ? { med: +(100 * s[s.length >> 1]).toFixed(1), p90: +(100 * s[Math.floor(s.length * 0.9)]).toFixed(1), max: +(100 * s[s.length - 1]).toFixed(1) } : null; };
  sum[`a${ti}`] = Object.fromEntries(Object.entries(by).map(([t, arr]) => [t, { frames: arr.length, ppt: [Math.min(...arr.map((a) => a.ppt)), Math.max(...arr.map((a) => a.ppt))], churn: st(arr, (a) => a.churn), shape: st(arr, (a) => a.shape), ringDarkMed: arr.map((a) => a.ringDarkPct).sort((x, y) => x - y)[arr.length >> 1] }])); }
const frames = log.length, framings = [...new Set(log.map((r) => r.target))].join(''), blends = log.filter((r) => r.blending).length, occ = log.filter((r) => r.occ && r.occ.length).length;
fs.writeFileSync(path.join(dir, 'summary.json'), JSON.stringify({ name, query, start, route, frames, framings, blendFrames: blends, occlusionFrames: occ, sum }, null, 1));
console.log(name, JSON.stringify({ frames, framings, blendFrames: blends, occlusionFrames: occ, sum }));
