// Camera-search workflow for one framing: node tools/camsearch.mjs <out.png> <id> "<x,z;x,z;...>" "<name=yaw,pitch,dist,fov,shift,hx,hy,hz[,gainX,gainZ,refX,refZ,charScale]>" ...
// Pins framing <id> (camera=<id>), then for every candidate (a row) and player position (a column) re-places the player, snaps the
// camera and grabs a frame; writes a labelled contact sheet (candidates x positions). Blank fields keep the authored value.
// env: W/H (default 960x540 per cell), QUERY (extra URL params, default "clean=1&freeze=7.3&vis=0&seed=1842"), BASE_URL.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const [out, id, posArg, ...cands] = process.argv.slice(2);
if (!out || !id || !posArg || !cands.length) throw new Error('usage: node tools/camsearch.mjs <out.png> <id> "x,z;x,z" "name=yaw,pitch,..." ...');
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find((p) => fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const W = +(process.env.W || 960), H = +(process.env.H || 540);
const query = process.env.QUERY || 'clean=1&freeze=7.3&vis=0&seed=1842';
const positions = posArg.split(';').map((s) => s.split(',').map(Number));
const browser = await puppeteer.launch({
  executablePath: exe, headless: 'new',
  args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`, '--disable-background-timer-throttling', '--disable-renderer-backgrounding'],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${BASE}?${query}&camera=${id}&player=${positions[0].join(',')}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 120000 });
  const cells = [];
  for (const c of cands) {
    const [name, spec] = c.split('=');
    const vals = (spec || '').split(',').map((s) => (s.trim() === '' ? NaN : Number(s)));
    for (const [x, z] of positions) {
      await page.evaluate((id, vals, x, z) => {
        const a = window.__app, an = a.graph.anchors[id], keys = ['yaw', 'pitch', 'dist', 'fov', 'shift'];
        if (!an.__orig) an.__orig = JSON.parse(JSON.stringify(an));
        Object.assign(an, JSON.parse(JSON.stringify({ ...an.__orig, __orig: undefined })));
        keys.forEach((k, i) => { if (!isNaN(vals[i])) an[k] = vals[i]; });
        for (let i = 0; i < 3; i++) if (!isNaN(vals[5 + i])) an.home[i] = vals[5 + i];
        for (let i = 0; i < 2; i++) { if (!isNaN(vals[8 + i])) an.gain[i] = vals[8 + i]; if (!isNaN(vals[10 + i])) an.ref[i] = vals[10 + i]; }
        if (!isNaN(vals[12])) an.charScale = vals[12];
        a.actors.player.pos.set(x, 0, z);
        a.graph.snap(a.actors.player.pos, a.rig);
      }, id, vals, x, z);
      await new Promise((r) => setTimeout(r, 700));
      cells.push({ name, x, z, png: (await page.screenshot({ encoding: 'base64' })) });
    }
  }
  const cols = positions.length;
  const html = `<!doctype html><body style="margin:0;background:#05070d"><div id="c" style="display:grid;grid-template-columns:repeat(${cols},${W}px);gap:4px;padding:4px">${cells.map((c) => `<figure style="margin:0;position:relative"><img style="width:${W}px;display:block" src="data:image/png;base64,${c.png}"><figcaption style="position:absolute;left:8px;top:6px;color:#f1d9a0;font:600 15px Segoe UI;background:rgba(5,7,13,.75);padding:2px 8px">${c.name} · player ${c.x}, ${c.z}</figcaption></figure>`).join('')}</div></body>`;
  const p2 = await browser.newPage();
  await p2.setViewport({ width: cols * (W + 4) + 8, height: 1200 });
  await p2.setContent(html, { waitUntil: 'load' });
  await (await p2.$('#c')).screenshot({ path: out });
  console.log(`wrote ${out} (${cells.length} cells)`);
} finally { await browser.close(); }
