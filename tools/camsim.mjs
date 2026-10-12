// Deterministic walk simulation through the real app update (no rendering, fixed 1/60 s steps):
//   node tools/camsim.mjs [--json=out.json] "name|x,z|keys:secs;keys:secs;..." ...
// e.g. "east|9,0.5|w,d:7" holds w+d for 7 s; "there-and-back|9,0.5|w,d:5;a,s:5"; an empty key set ("-:1.5") waits.
// Per scenario it reports framing changes, blend times, worst per-frame steps (yaw, fov, dist, pivot, char scale), the player's
// on-screen speed against its walking direction (a negative value while walking = the player glides backwards on screen), the
// control-yaw jump while a key is held, and where the forge sits on screen. env: QUERY (default "clean=1&freeze=7.3&static=1&seed=1842"), BASE_URL, W/H.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const jsonOut = args.find((a) => a.startsWith('--json='))?.slice(7);
const scen = args.filter((a) => !a.startsWith('--'));
if (!scen.length) throw new Error('usage: node tools/camsim.mjs [--json=out.json] "name|x,z|keys:secs;..." ...');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find((p) => fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const W = +(process.env.W || 1920), H = +(process.env.H || 1080);
const query = process.env.QUERY || 'clean=1&freeze=7.3&static=1&seed=1842';
const browser = await puppeteer.launch({
  executablePath: exe, headless: 'new',
  args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});
const R2D = 57.29578;
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${BASE}?${query}&intro=0`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 120000 });
  const all = {};
  for (const sc of scen) {
    const [name, start, plan] = sc.split('|');
    const [sx, sz] = start.split(',').map(Number);
    // "g=x,z" = a player who steers to that point (each frame the key combo whose latched screen direction is closest to the heading)
    const segs = plan.split(';').map((s) => { if (s.startsWith('g=')) return { goto: s.slice(2).split(',').map(Number) }; const [k, t] = s.split(':'); return [k === '-' ? [] : k.split(','), +t]; });
    const log = await page.evaluate((sx, sz, segs) => {
      const a = window.__app, p = a.actors.player.pos;
      for (const k of [...a.actors.keys]) a.actors.keys.delete(k);
      a.graph.arrival = false; p.set(sx, 0, sz); a.graph.snap(p, a.rig); a.actors.controlYaw = a.actors.camYaw = a.rig.yaw;
      for (let i = 0; i < 30; i++) a.update(1 / 60);
      const forge = a.district.forgeFocus, out = [], v = new a.rig.camera.position.constructor();
      const ndc = (x, y, z) => { v.set(x, y, z).project(a.rig.camera); return [v.x, v.y]; };
      let t = 0;
      const KEYS = [['d'], ['a'], ['w'], ['s'], ['w', 'd'], ['w', 'a'], ['s', 'd'], ['s', 'a']];
      const steer = (gx, gz) => {
        const c = Math.cos(a.actors.controlYaw), s = Math.sin(a.actors.controlYaw), hx = gx - p.x, hz = gz - p.z, hl = Math.hypot(hx, hz) || 1;
        let best = KEYS[0], bd = -9;
        for (const ks of KEYS) {
          const ix = (ks.includes('d') ? 1 : 0) - (ks.includes('a') ? 1 : 0), iy = (ks.includes('w') ? 1 : 0) - (ks.includes('s') ? 1 : 0);
          let mx = c * ix - s * iy, mz = -s * ix - c * iy; const ml = Math.hypot(mx, mz); mx /= ml; mz /= ml;
          const d = (mx * hx + mz * hz) / hl; if (d > bd) { bd = d; best = ks; }
        }
        for (const k of [...a.actors.keys]) a.actors.keys.delete(k);
        for (const k of best) a.actors.keys.add(k);
      };
      const frame = () => {
          const px0 = p.x, pz0 = p.z;
          a.update(1 / 60);
          const g = a.graph, s = g.state, n = ndc(p.x, p.y + 1, p.z), f = ndc(forge[0], forge[1], forge[2]);
          out.push({ t, target: g.target, blend: g.blendT, blending: g.blending, yaw: s.yaw * 57.29578, pitch: s.pitch * 57.29578, dist: s.dist, fov: s.fov, tx: s.tx, tz: s.tz, cs: s.charScale, px: p.x, pz: p.z, vx: (p.x - px0) * 60, vz: (p.z - pz0) * 60, ctrl: a.actors.controlYaw * 57.29578, held: a.actors.moveInput, nx: n[0], ny: n[1], fx: f[0], fy: f[1], act: g.activeIds().join(''), occ: a.occlusion.stats.active, fades: a.occlusion.fades().slice(), oc: a.occlusion.stats.centre.slice(), or: a.occlusion.stats.radii.slice(), level: a.drawLevel });
          t += 1 / 60;
      };
      for (const seg of segs) {
        if (!Array.isArray(seg)) {
          for (let i = 0; i < 1200 && Math.hypot(seg.goto[0] - p.x, seg.goto[1] - p.z) > 0.35; i++) { steer(seg.goto[0], seg.goto[1]); frame(); }
          for (const k of [...a.actors.keys]) a.actors.keys.delete(k);
          continue;
        }
        const [keys, secs] = seg;
        for (const k of [...a.actors.keys]) a.actors.keys.delete(k);
        for (const k of keys) a.actors.keys.add(k);
        for (let i = 0; i < Math.round(secs * 60); i++) frame();
      }
      for (const k of [...a.actors.keys]) a.actors.keys.delete(k);
      return out;
    }, sx, sz, segs);
    all[name] = log;
    // ---- metrics
    const dt = 1 / 60, ch = [];
    for (let i = 1; i < log.length; i++) if (log[i].target !== log[i - 1].target) ch.push({ i, from: log[i - 1].target, to: log[i].target, t: log[i].t, x: log[i].px, z: log[i].pz });
    const blends = []; let b0 = -1;
    for (let i = 0; i < log.length; i++) { if (log[i].blending && b0 < 0) b0 = i; if (!log[i].blending && b0 >= 0) { blends.push([b0, i]); b0 = -1; } }
    const step = (k) => Math.max(0, ...log.slice(1).map((e, i) => Math.abs(e[k] - log[i][k])));
    const dYaw = step('yaw'), dFov = step('fov'), dDist = step('dist'), dCs = step('cs');
    const dPiv = Math.max(0, ...log.slice(1).map((e, i) => Math.hypot(e.tx - log[i].tx, e.tz - log[i].tz)));
    const backBy = {}, backWorst = {}; let jump = 0, back = 0, backMin = 0, ctrl = 0, nxMin = 9, nxMax = -9, frX = [9, -9];
    for (let i = 1; i < log.length; i++) {
      const e = log[i], q = log[i - 1], dn = (e.nx - q.nx) * (W / 2);
      // expected screen direction of a walk = sign of the world motion projected on the (settled) camera's screen x
      const cy = e.yaw / R2D, rx = Math.cos(cy), rz = -Math.sin(cy), along = e.vx * rx + e.vz * rz;
      if (Math.hypot(e.vx, e.vz) > 0.5 && Math.abs(along) > 0.5) {
        const perPx = dn / dt; // screen px/s
        if (Math.sign(perPx) !== Math.sign(along) && Math.abs(perPx) > 8) { back++; backMin = Math.min(backMin, Math.sign(along) * perPx); const k = e.blending ? e.act : 'settled'; backBy[k] = (backBy[k] ?? 0) + 1; backWorst[k] = Math.min(backWorst[k] ?? 0, Math.sign(along) * perPx); }
      }
      jump = Math.max(jump, Math.abs(dn) - Math.hypot(e.vx, e.vz) * dt * W / 12);
      if (e.held && q.held) ctrl = Math.max(ctrl, Math.abs(e.ctrl - q.ctrl));
      nxMin = Math.min(nxMin, e.nx); nxMax = Math.max(nxMax, e.nx);
      frX = [Math.min(frX[0], e.fx), Math.max(frX[1], e.fx)];
    }
    // occlusion reveal: per occluder frames active, fade reversals (flicker) and the worst fade step; reveal-centre jump beyond the player's own motion
    const nOcc = log[0].fades.length, fl = Array(nOcc).fill(0), act = Array(nOcc).fill(0), stp = Array(nOcc).fill(0);
    let cj = 0;
    for (let i = 1; i < log.length; i++) {
      for (let k = 0; k < nOcc; k++) {
        const dv = log[i].fades[k] - log[i - 1].fades[k];
        if (log[i].fades[k] > 0.01) act[k]++;
        stp[k] = Math.max(stp[k], Math.abs(dv));
        if (i > 1) { const pv = log[i - 1].fades[k] - log[i - 2].fades[k]; if (dv * pv < -1e-6) fl[k]++; }
      }
      if (log[i].fades.some((v) => v > 0.01) && log[i - 1].fades.some((v) => v > 0.01)) cj = Math.max(cj, Math.hypot(log[i].oc[0] - log[i - 1].oc[0], log[i].oc[1] - log[i - 1].oc[1]) - Math.hypot(log[i].vx, log[i].vz) * dt * W / 12);
    }
    const occNames = await page.evaluate(() => window.__app.occlusion.defs.map((x) => x.name));
    const occTxt = occNames.map((n, k) => (act[k] ? `${n}: ${act[k]} frames, reversals ${fl[k]}, max fade step ${stp[k].toFixed(3)}` : null)).filter(Boolean).join(' | ') || 'no occluder active';
    const rev = ch.filter((c, k) => k && ch[k - 1].to === c.from && ch[k - 1].from === c.to && c.t - ch[k - 1].t < 4).length;
    console.log(`\n== ${name}: ${log.length} frames (${(log.length * dt).toFixed(1)} s) from ${start}, end x=${log[log.length - 1].px.toFixed(2)} z=${log[log.length - 1].pz.toFixed(2)}`);
    console.log(`framing changes: ${ch.map((c) => `${c.from}>${c.to}@x=${c.x.toFixed(2)},z=${c.z.toFixed(2)},t=${c.t.toFixed(2)}`).join('  ') || 'none'}  (reversals within 4 s: ${rev})`);
    console.log(`blends: ${blends.map(([a, b]) => `${log[a].target} ${((b - a) * dt).toFixed(2)} s`).join(', ') || 'none'}`);
    console.log(`worst per-frame step @60Hz: yaw ${dYaw.toFixed(3)} deg, fov ${dFov.toFixed(3)} deg, dist ${dDist.toFixed(3)} m, pivot ${dPiv.toFixed(3)} m, charScale ${dCs.toFixed(4)}`);
    console.log(`control-yaw jump while held: ${ctrl.toFixed(3)} deg; player screen: x ndc ${nxMin.toFixed(2)}..${nxMax.toFixed(2)}, per-frame excess jump ${jump.toFixed(1)} px, backwards-gliding frames ${back} (worst ${backMin.toFixed(0)} px/s; by blend ${Object.entries(backBy).map(([k, v]) => k + ':' + v + '@' + backWorst[k].toFixed(0)).join(' ') || '-'}); forge ndc x ${frX[0].toFixed(2)}..${frX[1].toFixed(2)}`);
    console.log(`occlusion: ${occTxt}; reveal centre excess jump ${cj.toFixed(1)} px`);
  }
  if (jsonOut) fs.writeFileSync(jsonOut, JSON.stringify(all));
} finally { await browser.close(); }
