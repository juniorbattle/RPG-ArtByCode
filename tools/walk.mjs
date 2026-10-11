// Walk-through of camera transitions with real input: node tools/walk.mjs <out-prefix> "<query>" "<keys>" <seconds> [frames=6]
// Holds the given movement keys (e.g. "w" or "w,d") for <seconds>, logs camera state every frame (framing, blend,
// yaw / dist / fov, player position, worst per-frame jumps) and grabs evenly spaced frames into a contact sheet.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const [prefix, query, keys, secs = '4', nFrames = '6'] = process.argv.slice(2);
if (!prefix || !query || !keys) throw new Error('usage: node tools/walk.mjs <out-prefix> "<query>" "<keys>" <seconds> [frames]');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', '/usr/bin/google-chrome', '/usr/bin/chromium']
  .filter(Boolean).find((p) => fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const browser = await puppeteer.launch({
  executablePath: exe, headless: 'new',
  args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=1280,720', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
  defaultViewport: { width: 1280, height: 720, deviceScaleFactor: 1 },
});
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${BASE}?${query}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 120000 });
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate((keys) => {
    const a = window.__app;
    window.__log = [];
    const d = (x) => +x.toFixed(3);
    const rec = () => {
      const g = a.graph, s = g.state, p = a.actors.player.pos;
      window.__log.push({ t: performance.now(), target: g.target, blend: d(g.blendT), active: g.activeIds().join('+'), yaw: d(s.yaw * 57.2958), pitch: d(s.pitch * 57.2958), dist: d(s.dist), fov: d(s.fov), tx: d(s.tx), tz: d(s.tz), char: d(s.charScale), px: d(p.x), pz: d(p.z), ctrl: d(a.actors.controlYaw * 57.2958), level: a.drawLevel, occ: a.occlusion.fades().map(d), occC: a.occlusion.stats.centre.slice(), occR: a.occlusion.stats.radii.slice(), occOn: a.occlusion.stats.active });
      if (window.__walking) requestAnimationFrame(rec);
    };
    window.__walking = true;
    for (const k of keys.split(',')) a.actors.keys.add(k);
    requestAnimationFrame(rec);
  }, keys);
  const frames = [];
  const n = Number(nFrames), total = Number(secs) * 1000;
  for (let i = 0; i < n; i++) {
    await new Promise((r) => setTimeout(r, total / n));
    const f = `${prefix}-${i}.png`;
    await page.screenshot({ path: f });
    frames.push(f);
  }
  const log = await page.evaluate(() => { window.__walking = false; for (const k of [...window.__app.actors.keys]) window.__app.actors.keys.delete(k); return window.__log; });
  fs.writeFileSync(`${prefix}.json`, JSON.stringify(log, null, 0));
  let worst = { yaw: 0, dist: 0, fov: 0, pivot: 0, ctrl: 0 };
  for (let i = 1; i < log.length; i++) {
    const a = log[i - 1], b = log[i];
    worst.yaw = Math.max(worst.yaw, Math.abs(b.yaw - a.yaw)); worst.dist = Math.max(worst.dist, Math.abs(b.dist - a.dist)); worst.fov = Math.max(worst.fov, Math.abs(b.fov - a.fov));
    worst.pivot = Math.max(worst.pivot, Math.hypot(b.tx - a.tx, b.tz - a.tz)); worst.ctrl = Math.max(worst.ctrl, Math.abs(b.ctrl - a.ctrl));
  }
  const changes = log.filter((e, i) => i && e.target !== log[i - 1].target).map((e) => `${e.target}@x=${e.px}`);
  const blendFrames = log.filter((e) => e.blend < 1);
  const blendSecs = blendFrames.length ? (blendFrames[blendFrames.length - 1].t - blendFrames[0].t) / 1000 : 0;
  console.log(`${log.length} frames; framing changes: ${changes.join(', ') || 'none'}; blend time ~${blendSecs.toFixed(2)} s`);
  console.log(`worst per-frame step: yaw ${worst.yaw.toFixed(2)} deg, dist ${worst.dist.toFixed(2)} m, fov ${worst.fov.toFixed(2)} deg, pivot ${worst.pivot.toFixed(2)} m, control yaw jump while held ${worst.ctrl.toFixed(2)} deg`);
  // occlusion reveal: per-frame fade steps, direction reversals per occluder (flicker), and reveal-centre jumps
  const names = await page.evaluate(() => window.__app.occlusion.defs.map((x) => x.name));
  const nOcc = log[0].occ.length, stepMax = Array(nOcc).fill(0), flips = Array(nOcc).fill(0), seen = Array(nOcc).fill(0);
  let cJump = 0, rJump = 0;
  for (let i = 1; i < log.length; i++) {
    for (let k = 0; k < nOcc; k++) {
      const dv = log[i].occ[k] - log[i - 1].occ[k];
      stepMax[k] = Math.max(stepMax[k], Math.abs(dv));
      if (log[i].occ[k] > 0.01) seen[k]++;
      if (i > 1) { const pv = log[i - 1].occ[k] - log[i - 2].occ[k]; if (dv * pv < -1e-6) flips[k]++; }
    }
    if (log[i].occ.some((v) => v > 0.01) && log[i - 1].occ.some((v) => v > 0.01)) {
      cJump = Math.max(cJump, Math.hypot(log[i].occC[0] - log[i - 1].occC[0], log[i].occC[1] - log[i - 1].occC[1]));
      rJump = Math.max(rJump, Math.abs(log[i].occR[1] - log[i - 1].occR[1]));
    }
  }
  const act = names.map((n, k) => (seen[k] ? `${n}: ${seen[k]} frames, max fade step ${stepMax[k].toFixed(3)}, reversals ${flips[k]}` : null)).filter(Boolean);
  console.log(`occlusion: ${act.join(' | ') || 'no occluder active'}; reveal centre max jump ${cJump.toFixed(1)} px, ry max step ${rJump.toFixed(2)} px`);
  console.log(`start ${JSON.stringify({ ...log[0], occ: undefined })}\nend   ${JSON.stringify({ ...log[log.length - 1], occ: undefined })}`);
  const html = `<!doctype html><body style="margin:0;background:#05070d"><div id="c" style="display:grid;grid-template-columns:repeat(${Math.min(3, n)},640px);gap:4px;padding:4px">${frames.map((f, i) => `<figure style="margin:0;position:relative"><img style="width:640px;display:block" src="data:image/png;base64,${fs.readFileSync(f).toString('base64')}"><figcaption style="position:absolute;left:8px;top:6px;color:#f1d9a0;font:600 13px Segoe UI;background:rgba(5,7,13,.7);padding:2px 8px">t=${((i + 1) * total / n / 1000).toFixed(1)}s</figcaption></figure>`).join('')}</div></body>`;
  const p2 = await browser.newPage();
  await p2.setViewport({ width: 1960, height: 1200 });
  await p2.setContent(html, { waitUntil: 'load' });
  await (await p2.$('#c')).screenshot({ path: `${prefix}-sheet.png` });
  for (const f of frames) fs.unlinkSync(f);
  console.log(`wrote ${prefix}-sheet.png, ${prefix}.json`);
} finally { await browser.close(); }
