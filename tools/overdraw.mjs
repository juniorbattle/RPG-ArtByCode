// Overdraw of the main scene pass in the real draw order (journal pass 6): every object is drawn with an additive 1/255 counter material
// (depth test and write as usual), so the sum per pixel = the fragments that passed the depth test when drawn, i.e. what early-z lets
// through and the surface shader pays for. Prints fragments / covered pixels and the per-pixel layer histogram (0..8+).
//   node tools/overdraw.mjs "label|<query or full url>|<WxH>" ...      (a query is appended to BASE_URL, default http://127.0.0.1:5173/)
import { launch } from './bench-common.mjs';

const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const browser = await launch(process.env.GPU || 'igpu');
try {
  for (const a of process.argv.slice(2)) {
    const [label, qs, size = '1920x1080'] = a.split('|');
    const [w, h] = size.split('x').map(Number);
    const page = await browser.newPage();
    await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
    await page.goto(qs.startsWith('http') ? qs : `${BASE}?${qs}`, { waitUntil: 'load' });
    await page.waitForFunction('window.__ready === true', { timeout: 120000 });
    await new Promise((r) => setTimeout(r, 1500));
    const r = await page.evaluate(() => {
      const app = window.__app, R = app.renderer, sc = app.scene, cam = app.rig.camera;
      // three's classes from live objects (no global THREE): the moon shadow's MeshBasicMaterial, the scene target's class
      const Basic = app.shadow.mat.constructor, RT = app.post.sceneRT.constructor;
      const W = app.post.width, H = app.post.height, rt = new RT(W, H, { depthBuffer: true });
      const m = new Basic({ color: 0xffffff }); m.color.setRGB(1 / 255, 1 / 255, 1 / 255); m.blending = 2; m.depthTest = true; m.depthWrite = true;
      const prev = sc.overrideMaterial; sc.overrideMaterial = m;
      R.setRenderTarget(rt); R.setClearColor(0x000000, 1); R.clear(true, true, true); R.render(sc, cam);
      sc.overrideMaterial = prev;
      const px = new Uint8Array(W * H * 4); R.readRenderTargetPixels(rt, 0, 0, W, H, px); R.setRenderTarget(null);
      let frags = 0, covered = 0; const hist = new Array(9).fill(0);
      for (let i = 0; i < px.length; i += 4) { const n = px[i]; frags += n; if (n) covered++; hist[Math.min(8, n)]++; }
      rt.dispose(); m.dispose();
      return { W, H, frags, covered, overdraw: +(frags / Math.max(1, covered)).toFixed(2), hist };
    });
    console.log(`${label.padEnd(12)} ${r.W}x${r.H}  overdraw ${r.overdraw}  (${r.frags} fragments over ${r.covered} covered px)  layers 0..8+: ${r.hist.join(' ')}`);
    await page.close();
  }
} finally { await browser.close(); }
