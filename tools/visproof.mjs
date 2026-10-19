// Visibility-pruning proof: node tools/visproof.mjs [--thr=2] [--keep=dir] "name|x,z|mode" ...   (env: QUERY, BASE_URL, W / H, CHROME_ARGS, READY_MS, SETTLE_MS: wait before each shot, 450 ms; software WebGL needs seconds)
// mode = stable (zone framing for that player position), A|B|C|D (pinned framing) or X,Y,w (frozen blend of two framings, e.g. C,D,0.5).
// Renders each pose with the pruned visible sets and again with ?vis=0 (everything kept; regenerated in the same session, static=1, frozen
// time) and reports how many pixels differ above the threshold: the culling must be invisible. With --keep=dir the diffs that are not 0 are saved.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const thr = +(args.find((a) => a.startsWith('--thr='))?.slice(6) ?? 2), keep = args.find((a) => a.startsWith('--keep='))?.slice(7);
const scen = args.filter((a) => !a.startsWith('--')).map((s) => { const [name, pos, mode] = s.split('|'); return { name, pos: pos.split(',').map(Number), mode: mode || 'stable' }; });
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find((p) => fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const W = +(process.env.W || 1280), H = +(process.env.H || 720);
const query = process.env.QUERY || 'seed=1842&clean=1&freeze=7.3&static=1&intro=0';
const browser = await puppeteer.launch({
  executablePath: exe, headless: 'new',
  args: [...(process.env.CHROME_ARGS ? process.env.CHROME_ARGS.split(' ').filter(Boolean) : ['--use-gl=angle', '--use-angle=d3d11']), '--ignore-gpu-blocklist', '--no-sandbox', `--window-size=${W},${H}`],
  defaultViewport: { width: W, height: H, deviceScaleFactor: 1 },
});
const place = (sc) => {
  const a = window.__app, [x, z] = sc.pos, p = a.actors.player.pos;
  a.rig.manual = false; a.debugActive = null; a.graph.forced = null; a.graph.arrival = false;
  p.set(x, 0, z);
  const m = sc.mode;
  if (/^[ABCD]$/.test(m)) a.graph.forced = m;
  a.graph.snap(p, a.rig);
  if (m.includes(',')) {
    const [f, g, w] = m.split(','), t = +w, s = t * t * t * (t * (t * 6 - 15) + 10);
    const st = a.graph.blendPose(a.graph.evalAnchor(f, x, z), a.graph.evalAnchor(g, x, z), s, new p.constructor(x, p.y + 1, z), (a.rig.poseAspect ?? a.rig.aspectRatio), f === 'D' || g === 'D' || !!a.graph.anchorAll);
    a.rig.manual = true; a.rig.setPose(st); a.graph.state = st; a.debugActive = [f, g];
  }
};
const shoot = async (page) => {
  const out = [];
  for (const sc of scen) {
    await page.evaluate(place, sc);
    await new Promise((r) => setTimeout(r, +(process.env.SETTLE_MS || 450)));
    out.push(await page.screenshot({ encoding: 'base64' }));
  }
  return out;
};
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${BASE}?${query}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: +(process.env.READY_MS || 120000) });
  const stats = await page.evaluate(() => { const v = window.__app.district.visibility; return { tier3: v.hidden, parts: v.parts, tris: v.trisKept }; });
  const pruned = await shoot(page);
  await page.evaluate(() => { window.__app.opts.params.set('vis', '0'); window.__app.regenerate(); });
  await new Promise((r) => setTimeout(r, 800));
  const full = await shoot(page);
  const dp = await browser.newPage();
  let bad = 0;
  for (let i = 0; i < scen.length; i++) {
    const r = await dp.evaluate(async (ua, ub, t) => {
      const load = (u) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = u; });
      const [ia, ib] = await Promise.all([load('data:image/png;base64,' + ua), load('data:image/png;base64,' + ub)]);
      const w = ia.width, h = ia.height, c = document.createElement('canvas'); c.width = w; c.height = h;
      const g = c.getContext('2d'); g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, w, h).data; g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, w, h);
      let n = 0, mx = 0, x0 = w, y0 = h, x1 = -1, y1 = -1;
      for (let k = 0; k < da.length; k += 4) {
        const d = Math.max(Math.abs(da[k] - db.data[k]), Math.abs(da[k + 1] - db.data[k + 1]), Math.abs(da[k + 2] - db.data[k + 2]));
        mx = Math.max(mx, d);
        if (d > t) { n++; const p = k / 4, x = p % w, y = (p / w) | 0; x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        const v = Math.min(255, d * 8); db.data[k] = v; db.data[k + 1] = v * 0.6; db.data[k + 2] = d > t ? 255 : v * 0.3; db.data[k + 3] = 255;
      }
      g.putImageData(db, 0, 0);
      return { n, mx, box: x1 >= 0 ? [x0, y0, x1, y1] : null, png: c.toDataURL('image/png') };
    }, pruned[i], full[i], thr);
    if (r.n) { bad++; if (keep) { fs.mkdirSync(keep, { recursive: true }); fs.writeFileSync(`${keep}/${scen[i].name}-diff.png`, Buffer.from(r.png.split(',')[1], 'base64')); fs.writeFileSync(`${keep}/${scen[i].name}-pruned.png`, Buffer.from(pruned[i], 'base64')); } }
    console.log(`${scen[i].name.padEnd(22)} ${scen[i].mode.padEnd(10)} player ${scen[i].pos.join(',').padEnd(10)} ${r.n} px differ > ${thr} (max ${r.mx})${r.box ? ` in [${r.box.join(', ')}]` : ''}`);
  }
  console.log(`pruned build: Tier 3 ${stats.tier3}/${stats.parts} parts, ${stats.tris} tris kept; ${bad}/${scen.length} poses differ`);
} finally { await browser.close(); }
