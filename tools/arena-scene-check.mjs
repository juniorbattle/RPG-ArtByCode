// Checks of the game's arena scene (`?scene=arena`, journal Passe P1) on a running dev server, same harness as tools/arena-scene-shots.mjs:
//   1. the simulation in the page (the ported CombatSim): the fixed input script of tools/arena-check.mjs, its hash against the prototype's;
//      under the new rules (`combat=dynamic` in the extra query, journal Passe C2): DynamicSim's own script (runDynamicFingerprint, 300 s),
//      its hash against DYNAMIC_SIM_HASH, the value recorded with the rules (journal Passe C1);
//   2. every scripted moment in every assistance mode (subtle, full, off): jump, one render, page errors and console errors counted;
//   3. the floor telegraph's contrast in the reaction window (full assistance), read back from a capture: the band against the floor just
//      behind and just in front of it (threshold 2:1, also with a deuteranopia simulation), as the prototype's device test;
//   under the version 2 (`v2=1`, journal Passe V1): the charged duel's script (runV2Fingerprint), its hash against V2_SIM_HASH; check 4 also
//      at the charge's moments (a skill's tier, a tier locked, the opponent's skill and its alert);
//   4. the floor's marks clear of the HUD at every window size of FLOOR_SIZES (default from 1920 x 1080 down to a 568 x 320 phone; journal
//      Passe AF1: under 600 px high the reaction window's bar covered them through the whole window): at the moments where the HUD shows a
//      bar or a sign over the floor (the window, under the new rules also an attack refused while the opponent attacks), the band (full
//      assistance) and the fighters' rings (both assistances) sampled on the floor, projected to the screen, and none of their points may lie
//      inside a box the HUD paints (a background, a frame, an image or text; transitions frozen).
//   node tools/arena-scene-check.mjs ["<extra query>"]      (BASE_URL, W / H, FLOOR_SIZES=WxH,..., CHROME_PATH / CHROME_ARGS / READY_MS as
//   tools/arena-scene-shots.mjs; exit 1 on an error, a wrong hash, a contrast under 2:1 or a floor mark under the HUD)
import { createRequire } from 'node:module';
import fs from 'node:fs';
import { decodePng } from './art-lab/png.mjs';
const puppeteer = createRequire(import.meta.url)('puppeteer-core');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome'].find((p) => p && fs.existsSync(p));
const SEED = `(() => { let s = 1842; Math.random = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; })();`;
const PROTOTYPE_HASH = '152:1:idle:20.233:0.00,0.00,0.00,0.00;800:0:idle:5.283:0.00,0.00,0.00,0.00;20.233';
// src/combat/dynamic.ts DYNAMIC_SIM_HASH (journal Passe C1)
const DYNAMIC_HASH = '1687:1:idle:0.483:0.000:-:-;4989:0:idle:1.500:61.275:-:-;300.000';
// src/arena/v2Arena.ts V2_SIM_HASH (`v2=1`: the version 2's charged duel, journal Passe V1)
const V2_HASH = '2042:2:idle:4.850:18.180:3.850:-;6002:0:idle:1.467:29.800:-:-;60.733|1:4.858:';
const extra = process.argv[2] ?? '';
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/', W = +(process.env.W || 1280), H = +(process.env.H || 720);
const gl = process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11'];
const b = await puppeteer.launch({ executablePath: exe, headless: 'new', args: [...gl, '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--hide-scrollbars', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'], defaultViewport: { width: W, height: H, deviceScaleFactor: 1 }, protocolTimeout: +(process.env.READY_MS || 300000) });
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
    const sim = A.rules === 'v2' ? new A.sim.constructor(A.sim.D, A.sim.tiers) : new A.sim.constructor(), dt = sim.D.dt; let nextAct = 0.5, n = 0;
    if (A.rules === 'v2') {
      // runV2Fingerprint (src/arena/v2Arena.ts), on a fresh charged duel of the page's own data (no dyn= in the address); the script of V2-2
      // « Rien ne la coupe » (journal Passe V2C1): dodges, guarded and unguarded blows, a break and the K.O. on a charge held, releases in the
      // opponent's sequences
      const holds = [0.05, 2.1, 0.05, 3.7, 0.05, 4.2, 5.3, 0.05, 9.4, 2.4]; let next = 0.5, until = -1;
      for (let i = 0; i < Math.round(360 / dt); i++) {
        const inc = sim.incoming(), v = sim.view();
        if (inc && inc.windowOpen && inc.kind !== 'light' && sim.t < 40 && Math.floor(sim.t) % 3 !== 0) sim.react('ren', 'dodge');
        sim.setGuard('ren', !!(inc && sim.t < 110 && (inc.kind === 'light' || sim.t >= 40)));
        if (!v.held && sim.t >= next) { sim.attack(true); until = sim.t + holds[n++ % holds.length]; }
        else if (v.held && sim.t >= until) { sim.attack(false); next = sim.t + 0.3; }
        sim.step(dt); sim.drain(); if (sim.over) { sim.reset(); next = 0.5; }
      }
    } else if (A.rules === 'dynamic') {
      // runDynamicFingerprint (src/combat/dynamic.ts), on a fresh DynamicSim of the default data
      const ids = ['light', 'light', 'heavy', 't1', 'light', 'd1', 'light', 't4', 's1', 'light', 'heavy'];
      for (let i = 0; i < Math.round(300 / dt); i++) {
        const inc = sim.incoming();
        if (inc && inc.windowOpen && inc.kind === 'heavy') sim.react('ren', 'dodge');
        sim.setGuard('ren', !!(inc && inc.kind === 'light'));
        if (sim.t >= nextAct) { sim.command('ren', ids[n++ % ids.length]); nextAct += 0.45; }
        sim.step(dt); sim.drain(); if (sim.over) sim.reset();
      }
    } else
    for (let i = 0; i < Math.round(120 / dt); i++) {
      const inc = sim.incoming();
      if (inc && inc.windowOpen && inc.kind === 'heavy') sim.react('ren', 'dodge');
      sim.setGuard('ren', !!(inc && inc.kind === 'light' && !inc.windowOpen));
      if (sim.t >= nextAct) { const ids = ['light', 'light', 'heavy', 't1', 'light', 't2', 't3', 't4']; sim.command('ren', ids[n++ % ids.length]); nextAct += 0.7; }
      sim.step(dt); sim.drain(); if (sim.over) sim.reset();
    }
    // 2. every moment in every assistance mode
    const presets = A.rules === 'dynamic' || A.rules === 'v2' ? A.presetNames() : ['charging', 'ready', 'casting', 'window', 'impact', 'block', 'guardbreak', 'dodge', 'combo', 'single', 'technique', 'strike', 'heavyRen', 'ko'];
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
    return { simHash: sim.hash(), rules: A.rules ?? 'classic', renders, band: rect(-0.7, 0.7), behind: rect(-2.3, -1.4), front: rect(1.4, 2.3) };
  });
  const shot = decodePng(Buffer.from(await page.screenshot({ type: 'png' }))), png = { width: shot.W, height: shot.H, data: shot.rgba };
  const mean = ([x0, y0, x1, y1]) => { const s = [0, 0, 0]; let n = 0; for (let y = Math.max(0, y0); y < Math.min(png.height, y1); y++) for (let x = Math.max(0, x0); x < Math.min(png.width, x1); x++) { const i = (y * png.width + x) * 4; s[0] += png.data[i]; s[1] += png.data[i + 1]; s[2] += png.data[i + 2]; n++; } return s.map((v) => v / Math.max(1, n)); };
  const lin = (c) => { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  const lum = (c) => 0.2126 * lin(c[0]) + 0.7152 * lin(c[1]) + 0.0722 * lin(c[2]);
  const deut = (c) => { const r = lin(c[0]), g = lin(c[1]), bb = lin(c[2]); return 0.2126 * (0.367 * r + 0.861 * g - 0.228 * bb) + 0.7152 * (0.28 * r + 0.673 * g + 0.047 * bb) + 0.0722 * (-0.012 * r + 0.043 * g + 0.969 * bb); };
  const ratio = (x, y) => (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
  const tc = mean(res.band), fb = mean(res.behind), ff = mean(res.front);
  const contrast = +Math.min(ratio(lum(tc), lum(fb)), ratio(lum(tc), lum(ff))).toFixed(2), contrastDeuteranopia = +Math.min(ratio(deut(tc), deut(fb)), ratio(deut(tc), deut(ff))).toFixed(2);
  // 4. the floor's marks clear of the HUD, window size by window size
  await page.addStyleTag({ content: '*,*::before,*::after{transition:none!important;animation:none!important}' });
  const floor = [];
  for (const size of (process.env.FLOOR_SIZES || '1920x1080,1280x720,1280x600,1024x540,960x540,900x500,844x390,812x375,740x360,667x375,568x320').split(',')) {
    const [w, h] = size.split('x').map(Number);
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    floor.push(...await page.evaluate((size) => {
      const A = window.__arena, out = [];
      A.resize();
      const shown =(el) => { for (let e = el; e && e !== document.body; e = e.parentElement) { const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; } return true; };
      const painted = () => [...document.querySelectorAll('#arena-hud *')].filter((el) => {
        const cs = getComputedStyle(el), rc = el.getBoundingClientRect();
        if (!rc.width || !rc.height || !shown(el)) return false;
        return !/^(transparent|rgba\(0, 0, 0, 0\))$/.test(cs.backgroundColor) || cs.borderImageSource !== 'none' || cs.backgroundImage !== 'none'
          || [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) || /^(svg|img|canvas)$/i.test(el.tagName);
      }).map((el) => ({ id: el.id || String(el.className?.baseVal ?? el.className ?? '').split(' ')[0] || el.tagName.toLowerCase(), r: el.getBoundingClientRect() }));
      const scr = (x, z) => { const v = new A.camera.position.constructor(x, 0.012, z).project(A.camera); return [(v.x * 0.5 + 0.5) * innerWidth, (-v.y * 0.5 + 0.5) * innerHeight]; };
      const cases = [['window', 'full'], ['window', 'subtle'], ...(A.rules === 'dynamic' || A.rules === 'v2' ? [['denied', 'full'], ['denied', 'subtle']] : []), ...(A.rules === 'v2' ? [['chargeSkill', 'subtle'], ['chargeLocked', 'full'], ['foeSkill', 'subtle']] : [])];
      for (const [moment, mode] of cases) {
        A.assist = mode; A.jump(moment); A.renderOnce();
        const r = A.fighters.ren.pos.x, m = A.fighters.marek.pos.x, x0 = Math.min(r, m) - 0.9, x1 = Math.max(r, m) - 0.35, pts = [];
        // the band (as FloorUI draws it: from Marek's ring to past Ren, its ivory rim at |z| 0.86) and both rings (radius 0.8 / 0.9, z squeezed 1.6)
        if (mode === 'full') for (let i = 0; i <= 48; i++) for (let j = 0; j <= 8; j++) pts.push(['band', ...scr(x0 + (x1 - x0) * i / 48, -0.86 + 1.72 * j / 8)]);
        for (const [c, rad] of [[r, 0.8], [m, 0.9]]) for (let k = 0; k < 48; k++) { const t = k / 48 * Math.PI * 2; pts.push(['rings', ...scr(c + Math.cos(t) * rad, Math.sin(t) * rad / 1.6)]); }
        const boxes = painted(), hits = {};
        for (const [what, x, y] of pts) { const bx = boxes.find((q) => x >= q.r.left && x <= q.r.right && y >= q.r.top && y <= q.r.bottom); if (bx) hits[`${what}:${bx.id}`] = (hits[`${what}:${bx.id}`] ?? 0) + 1; }
        out.push({ size, moment, mode, points: pts.length, covered: hits });
      }
      return out;
    }, size));
  }
  const floorBad = floor.filter((c) => Object.keys(c.covered).length);
  const wantHash = res.rules === 'v2' ? V2_HASH : res.rules === 'dynamic' ? DYNAMIC_HASH : PROTOTYPE_HASH;
  const bad = errors.length > 0 || res.simHash !== wantHash || contrast < 2 || contrastDeuteranopia < 2 || !(live.advanced > 0) || !live.lastAction || floorBad.length > 0;
  failed = bad;
  console.log(JSON.stringify({ live: { advanced: live.advanced, lastAction: live.lastAction, marekHp: live.marekHp, frames: live.frames, drawCalls: live.stats.drawCalls, frameTriangles: live.stats.frameTriangles, triangles: live.stats.arenaTriangles, instances: live.stats.instances, lights: live.stats.lights, atlas: live.stats.atlas }, rules: res.rules, simHash: res.simHash, sameAsPrototype: res.simHash === PROTOTYPE_HASH, sameAsRecorded: res.simHash === wantHash, renders: res.renders, telegraph: { band: tc.map(Math.round), behind: fb.map(Math.round), front: ff.map(Math.round), contrast, contrastDeuteranopia }, floorClear: { cases: floor.length, covered: floorBad.map((c) => `${c.size} ${c.moment} ${c.mode} ${JSON.stringify(c.covered)}`) }, errors: errors.slice(0, 10), errorCount: errors.length, verdict: bad ? 'FAIL' : 'PASS' }));
} finally { await b.close(); }
process.exit(failed ? 1 : 0);
