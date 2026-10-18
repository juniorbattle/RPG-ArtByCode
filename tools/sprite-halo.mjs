// Character halo / washout measure, in motion (journal Passe S1). Math.random is seeded and App.start is a no-op from the first script
// (the game loop never runs outside this harness): every frame is stepped at 1/60 s with a frozen clock, NPCs walk by their own
// behaviours, the player can steer to goals with the real keys (same steering as tools/camsim.mjs). Every `every` frames, four renders of
// the same frame: post on / off x characters on / off (read back with gl.readPixels right after each render).
//   silhouette S = pixels the characters change with the post chain off (bodies, contact shadows, reflections, bubbles)
//   ring        = pixels 1..R px outside S, inside a character's screen box (head to hips): what the post chain makes the characters
//                 change AROUND them (the halo); measured as |dL| between characters on / off, post on
//   contrast    = std of the luminance inside S over the same box, post on / post off (1 = the post chain keeps the sprite's own contrast)
// node tools/sprite-halo.mjs <out.json> "<query>" [route] [secs=6] [every=10] [ring=6]
//   route: "g=x,z;g=x,z;-:2" (goals for the player, then idle seconds); empty = the player stands still. BASE_URL env; POST=air,bloom,dof
//   (default all three) chooses the effects of the "post on" renders, to attribute a ring to one of them.
import { createRequire } from 'node:module';
import fs from 'node:fs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const HOLD = `Object.defineProperty(window, '__app', { configurable: true, get() { return undefined; }, set(v) { v.start = () => {}; Object.defineProperty(window, '__app', { value: v, writable: true, configurable: true }); } });`;
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const [out, query, route = '', secsS = '6', everyS = '10', ringS = '6'] = process.argv.slice(2);
const POST = (process.env.POST || 'air,bloom,dof').split(',');
if (!out || !query) throw new Error('usage: node tools/sprite-halo.mjs <out.json> "<query>" [route] [secs] [every] [ring]');
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1920,1080', '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: 1920, height: 1080, deviceScaleFactor: 1 } });
let res;
try {
  const page = await b.newPage(); page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.evaluateOnNewDocument(SEED); await page.evaluateOnNewDocument(HOLD);
  await page.goto(`${BASE}?${query}`, { waitUntil: 'load' }); await page.waitForFunction('window.__ready === true', { timeout: 180000 });
  res = await page.evaluate((route, secs, every, R, POST) => {
    const a = window.__app, p = a.actors.player.pos, u = a.update.bind(a), r = a.render.bind(a), post = a.post;
    let clock = 0; const frozen = (fn) => { const n = performance.now; performance.now = () => clock; try { return fn(); } finally { performance.now = n; } };
    const gl = a.renderer.getContext();
    const grab = () => { const W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, px = new Uint8Array(W * H * 4); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px); return { W, H, px }; };
    const lum = (d, i) => 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
    const shot = (chars, fx) => { a.sprites.group.visible = chars; const s = { air: post.airEnabled, bloom: post.bloomEnabled, dof: post.dofEnabled };
      if (!fx) post.airEnabled = post.bloomEnabled = post.dofEnabled = false;
      else { post.airEnabled = s.air && POST.includes('air'); post.bloomEnabled = s.bloom && POST.includes('bloom'); post.dofEnabled = s.dof && POST.includes('dof'); }
      frozen(() => r()); const g = grab(); Object.assign(post, { airEnabled: s.air, bloomEnabled: s.bloom, dofEnabled: s.dof }); a.sprites.group.visible = true; return g; };
    const KEYS = [['d'], ['a'], ['w'], ['s'], ['w', 'd'], ['w', 'a'], ['s', 'd'], ['s', 'a']];
    const steer = (gx, gz) => { const c = Math.cos(a.actors.controlYaw), s = Math.sin(a.actors.controlYaw), hx = gx - p.x, hz = gz - p.z, hl = Math.hypot(hx, hz) || 1; let best = KEYS[0], bd = -9;
      for (const ks of KEYS) { const ix = (ks.includes('d') ? 1 : 0) - (ks.includes('a') ? 1 : 0), iy = (ks.includes('w') ? 1 : 0) - (ks.includes('s') ? 1 : 0); let mx = c * ix - s * iy, mz = -s * ix - c * iy; const ml = Math.hypot(mx, mz); mx /= ml; mz /= ml; const d = (mx * hx + mz * hz) / hl; if (d > bd) { bd = d; best = ks; } }
      for (const k of [...a.actors.keys]) a.actors.keys.delete(k); for (const k of best) a.actors.keys.add(k); };
    const segs = route.split(';').filter(Boolean).map((s) => (s.startsWith('g=') ? { goto: s.slice(2).split(',').map(Number) } : { wait: Number(s.split(':')[1]) }));
    const V = a.rig.camera.position.constructor;
    const boxes = () => { const cam = a.rig.camera, cs = a.sprites.charScale, W = gl.drawingBufferWidth, H = gl.drawingBufferHeight, outB = [];
      for (const act of a.actors.actors) { if (act.hidden) continue;
        const f = new V(act.pos.x, act.pos.y, act.pos.z).project(cam), h = new V(act.pos.x, act.pos.y + act.height * cs, act.pos.z).project(cam);
        if (f.z > 1 || f.z < -1) continue;
        const fx = (f.x + 1) / 2 * W, fy = (f.y + 1) / 2 * H, hy = (h.y + 1) / 2 * H, hpx = hy - fy;   // GL rows (0 = bottom)
        if (hpx < 12) continue;
        const x0 = Math.round(fx - hpx * 0.42), x1 = Math.round(fx + hpx * 0.42), y0 = Math.round(fy + hpx * 0.45), y1 = Math.round(hy + hpx * 0.08);   // head to hips
        if (x1 < 0 || x0 >= W || y1 < 0 || y0 >= H) continue;
        outB.push({ id: act.id, spec: act.spec, x0: Math.max(0, x0), x1: Math.min(W - 1, x1), y0: Math.max(0, y0), y1: Math.min(H - 1, y1), hpx: +hpx.toFixed(1) }); }
      return outB; };
    const measure = () => {
      const F1 = shot(true, true), F0 = shot(false, true), P1 = shot(true, false), P0 = shot(false, false), W = F1.W, H = F1.H;
      const S = new Uint8Array(W * H);
      for (let i = 0, j = 0; j < S.length; i += 4, j++) if (Math.max(Math.abs(P1.px[i] - P0.px[i]), Math.abs(P1.px[i + 1] - P0.px[i + 1]), Math.abs(P1.px[i + 2] - P0.px[i + 2])) > 2) S[j] = 1;
      // distance (chessboard) to S, up to R
      const D = new Uint8Array(W * H).fill(255); for (let j = 0; j < S.length; j++) if (S[j]) D[j] = 0;
      for (let k = 1; k <= R; k++) for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const j = y * W + x; if (D[j] !== 255) continue;
        if (D[j - 1] === k - 1 || D[j + 1] === k - 1 || D[j - W] === k - 1 || D[j + W] === k - 1 || D[j - W - 1] === k - 1 || D[j - W + 1] === k - 1 || D[j + W - 1] === k - 1 || D[j + W + 1] === k - 1) D[j] = k; }
      const rows = [];
      for (const bx of boxes()) { let rn = 0, rsum = 0, rbad = 0, n = 0, s1 = 0, q1 = 0, s0 = 0, q0 = 0; const dn = new Array(R + 1).fill(0), ds = new Array(R + 1).fill(0);
        for (let y = bx.y0; y <= bx.y1; y++) for (let x = bx.x0; x <= bx.x1; x++) { const j = y * W + x, i = j * 4;
          if (D[j] >= 1 && D[j] <= R) { const d = Math.abs(lum(F1.px, i) - lum(F0.px, i)); rn++; rsum += d; if (d > 4) rbad++; dn[D[j]]++; ds[D[j]] += d; }
          else if (D[j] === 0) { const l1 = lum(F1.px, i), l0 = lum(P1.px, i); n++; s1 += l1; q1 += l1 * l1; s0 += l0; q0 += l0 * l0; } }
        if (n < 30 || rn < 30) continue;
        const sd1 = Math.sqrt(Math.max(0, q1 / n - (s1 / n) ** 2)), sd0 = Math.sqrt(Math.max(0, q0 / n - (s0 / n) ** 2));
        rows.push({ id: bx.id, spec: bx.spec, hpx: bx.hpx, ringPx: rn, ringMean: +(rsum / rn).toFixed(2), ringOver4: +(rbad / rn).toFixed(4), byDist: dn.slice(1).map((c, k) => +(c ? ds[k + 1] / c : 0).toFixed(2)), contrast: +(sd0 ? sd1 / sd0 : 0).toFixed(3), lumIn: +(s1 / n).toFixed(1), lumInNoPost: +(s0 / n).toFixed(1) }); }
      return rows; };
    for (const k of [...a.actors.keys]) a.actors.keys.delete(k);
    for (let i = 0; i < 30; i++) { clock += 1000 / 60; frozen(() => u(1 / 60)); }
    const frames = [], total = Math.round(secs * 60); let seg = 0, waitLeft = segs[0]?.wait ? segs[0].wait * 60 : 0;
    for (let k = 0; k < total; k++) {
      const s = segs[seg];
      if (s?.goto) { if (Math.hypot(s.goto[0] - p.x, s.goto[1] - p.z) <= 0.35) { seg++; const n = segs[seg]; waitLeft = n?.wait ? n.wait * 60 : 0; for (const kk of [...a.actors.keys]) a.actors.keys.delete(kk); } else steer(s.goto[0], s.goto[1]); }
      else if (s && waitLeft-- <= 0) { seg++; const n = segs[seg]; waitLeft = n?.wait ? n.wait * 60 : 0; }
      if (!s || !segs[seg]?.goto) for (const kk of [...a.actors.keys]) a.actors.keys.delete(kk);
      clock += 1000 / 60; frozen(() => u(1 / 60));
      if (k % every === 0) frames.push({ k, cam: a.graph.target, blending: a.graph.blending, player: [+p.x.toFixed(2), +p.z.toFixed(2)], rows: measure() });
    }
    return frames;
  }, route, +secsS, +everyS, +ringS, POST);
} finally { await b.close(); }
// summary: over every (frame, character) sample
const all = res.flatMap((f) => f.rows);
const q = (arr, t) => { const s = [...arr].sort((x, y) => x - y); return s.length ? s[Math.min(s.length - 1, Math.floor(t * s.length))] : null; };
const sum = { samples: all.length, frames: res.length, ringMean: { med: q(all.map((r) => r.ringMean), 0.5), p90: q(all.map((r) => r.ringMean), 0.9), max: q(all.map((r) => r.ringMean), 1) },
  ringOver4: { med: q(all.map((r) => r.ringOver4), 0.5), p90: q(all.map((r) => r.ringOver4), 0.9), max: q(all.map((r) => r.ringOver4), 1) },
  contrast: { p10: q(all.map((r) => r.contrast), 0.1), med: q(all.map((r) => r.contrast), 0.5) } };
fs.writeFileSync(out, JSON.stringify({ query, route, post: POST, summary: sum, frames: res }, null, 1));
console.log(out, JSON.stringify(sum));
