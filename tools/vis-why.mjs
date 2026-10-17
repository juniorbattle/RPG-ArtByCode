// Why does a pose differ between pruned and ?vis=0? node tools/vis-why.mjs [--seed=1842] [--size=1920x1080] [--ss=2] [--q=extra] [--keep=dir] "name|x,z|mode" ...
// mode = A|B|C|D (pinned framing) or X,Y,w (frozen blend), as in visproof / viewport-proof. Against the running dev server (BASE_URL), static=1,
// frozen time, occ=0. Per pose, in one session:
//   missed   the parts this exact camera shows that the active set does not draw: the bake's ID scene rendered through the rig camera at ss x
//            the window (direct) and through the last frame's reflection camera at ss x its target (mirror); for each, the pixels it covers,
//            its box, its need mask and raw counts, and how many pixels it gets at this very pose in a bake-size tile ("tile", 480 wide,
//            fov x 1.06) and in a tile 8 x larger ("tile8x"): tile 0 / tile8x > 0 = thinner than one bake pixel (a sliver)
//   D0       pruned vs vis=0 (pixels above 2 / 255)
//   D1       the pruned build regenerated with every missed part forced into the active framing(s) vs vis=0: what is left once this pose's
//            culling misses are restored (forcing re-plans the draw classes, so it can also flip a z-fight: read D1 with the order column)
//   order    vis=0 shot again with every mesh's triangles in reverse order: pixels within 1 px of a pixel this changes are decided by
//            draw order (coplanar faces), not by which parts are drawn
// What D1 leaves outside "order" is neither a visible missed part nor draw order: look for a pixel that only one MSAA sample decides
// (a rasterisation crack showing a part that sits behind a surface), e.g. by toggling draw levels with and without MSAA.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const seed = +opt('seed', 1842), [W, H] = opt('size', '1920x1080').split('x').map(Number), SS = +opt('ss', 2), keep = opt('keep', null), extra = opt('q', ''), thr = 2;
const scen = args.filter((a) => !a.startsWith('--')).map((s) => { const [name, pos, mode] = s.split('|'); return { name, pos: pos.split(',').map(Number), mode: mode || 'B' }; });
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find((p) => fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=2600,1400', '--hide-scrollbars'] });

const place = (sc) => {
  const a = window.__app, [x, z] = sc.pos, p = a.actors.player.pos;
  a.rig.manual = false; a.debugActive = null; a.graph.forced = null; a.graph.arrival = false;
  p.set(x, 0, z);
  const m = sc.mode;
  if (/^[ABCD]$/.test(m)) a.graph.forced = m;
  a.graph.snap(p, a.rig);
  if (m.includes(',')) {
    const [f, g, w] = m.split(','), t = +w, s = t * t * t * (t * (t * 6 - 15) + 10);
    const st = a.graph.blendPose(a.graph.evalAnchor(f, x, z), a.graph.evalAnchor(g, x, z), s, new p.constructor(x, p.y + 1, z), a.rig.poseAspect ?? a.rig.aspectRatio, f === 'D' || g === 'D');
    a.rig.manual = true; a.rig.setPose(st); a.graph.state = st; a.debugActive = [f, g];
  }
};
const shot = async (page, sc) => { await page.evaluate(place, sc); await new Promise((r) => setTimeout(r, 450)); return page.screenshot({ encoding: 'base64' }); };
let dpage;
const diff = async (a, b) => {
  dpage ??= await browser.newPage();
  return dpage.evaluate(async (ua, ub, t) => {
    const load = (u) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = u; });
    const [ia, ib] = await Promise.all([load('data:image/png;base64,' + ua), load('data:image/png;base64,' + ub)]);
    const w = ia.width, h = ia.height, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, w, h).data; g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, w, h).data;
    const px = []; let mx = 0;
    for (let k = 0; k < da.length; k += 4) {
      const d = Math.max(Math.abs(da[k] - db[k]), Math.abs(da[k + 1] - db[k + 1]), Math.abs(da[k + 2] - db[k + 2]));
      if (d > t) { px.push(k / 4); mx = Math.max(mx, d); }
    }
    return { px, mx, w };
  }, a, b, thr);
};
const bbox = (px, w) => (px.length ? [Math.min(...px.map((k) => k % w)), Math.min(...px.map((k) => (k / w) | 0)), Math.max(...px.map((k) => k % w)), Math.max(...px.map((k) => (k / w) | 0))] : null);

/** in the page: the parts the current rig / reflection cameras show that the active set does not draw */
const missedParts = (SS) => {
  const a = window.__app, T = window.__THREE, V = window.__VIS, R = window.__RIG, r = a.renderer, cap = window.__cap;
  const idr = (cam, w, h) => {
    const rt = new T.WebGLRenderTarget(w, h, { minFilter: T.NearestFilter, magFilter: T.NearestFilter, depthBuffer: true, generateMipmaps: false });
    const pc = new T.Color(); r.getClearColor(pc); const pa = r.getClearAlpha(), au = r.autoClear;
    r.setRenderTarget(rt); r.setClearColor(0, 0); r.autoClear = false; r.clear(true, true, false); r.render(cap.scene, cam);
    const px = new Uint8Array(w * h * 4); r.readRenderTargetPixels(rt, 0, 0, w, h, px);
    r.setRenderTarget(null); r.setClearColor(pc, pa); r.autoClear = au; rt.dispose();
    const ids = new Int32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const k = ((h - 1 - y) * w + x) * 4; ids[y * w + x] = px[k + 3] ? px[k] | (px[k + 1] << 8) | (px[k + 2] << 16) : -1; }
    return ids;
  };
  const hist = (ids) => { const h = new Map(); for (const id of ids) h.set(id, (h.get(id) ?? 0) + 1); return h; };
  const act = a.debugActive ?? a.graph.activeIds(), cm = V.cfgMask(act), frame = a.rig.poseAspect ?? 16 / 9;
  // this pose through the bake's own camera (fov x 1.06) and its mirror twin, at bake tile size and 8 x
  const rg = a.rig, pose = { yaw: rg.yaw, pitch: rg.pitch, dist: rg.dist, fov: rg.fov, shift: rg.shiftY, tx: rg.pivot.x, ty: rg.pivot.y, tz: rg.pivot.z };
  const bc = new T.PerspectiveCamera(34, frame, 1.5, 900); R.applyPose(bc, pose, frame, 1.06);
  const mc = new T.PerspectiveCamera(34, frame, 1.5, 900); {
    const tg = new T.Vector3(0, 0, -1).applyQuaternion(bc.quaternion).add(bc.position), up = new T.Vector3(0, 1, 0).applyQuaternion(bc.quaternion);
    mc.position.set(bc.position.x, -bc.position.y, bc.position.z); mc.up.set(up.x, -up.y, up.z); mc.lookAt(tg.x, -tg.y, tg.z); mc.updateMatrixWorld(true);
    mc.projectionMatrix.copy(bc.projectionMatrix);
    const pl = new T.Plane(new T.Vector3(0, 1, 0), -a.reflection.clipY).applyMatrix4(mc.matrixWorldInverse), cp = new T.Vector4(pl.normal.x, pl.normal.y, pl.normal.z, pl.constant), e = mc.projectionMatrix.elements;
    const q = new T.Vector4((Math.sign(cp.x) + e[8]) / e[0], (Math.sign(cp.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]); cp.multiplyScalar(2 / cp.dot(q));
    e[2] = cp.x; e[6] = cp.y; e[10] = cp.z + 1; e[14] = cp.w; mc.projectionMatrixInverse.copy(mc.projectionMatrix).invert();
  }
  const th = Math.round(480 / frame), bake = { direct: [hist(idr(bc, 480, th)), hist(idr(bc, 3840, th * 8))], mirror: [hist(idr(mc, 240, Math.round(240 / frame))), hist(idr(mc, 1920, Math.round(240 / frame) * 8))] };
  const views = { direct: [idr(rg.camera.clone(), r.domElement.width * SS, r.domElement.height * SS), r.domElement.width * SS], mirror: [idr(a.reflection.cam.clone(), a.reflection.rt.width * SS, a.reflection.rt.height * SS), a.reflection.rt.width * SS] };
  const out = new Map();
  for (const [tag, [ids, w]] of Object.entries(views)) ids.forEach((id, k) => {
    if (id <= 0 || V.needMask(cap.vis, id) & cm) return;
    const x = Math.floor((k % w) / SS), y = Math.floor(Math.floor(k / w) / SS), key = `${id}:${tag}`;
    const e = out.get(key) ?? { id, tag, px: 0, box: [1e9, 1e9, -1, -1] };
    e.px++; e.box = [Math.min(e.box[0], x), Math.min(e.box[1], y), Math.max(e.box[2], x), Math.max(e.box[3], y)]; out.set(key, e);
  });
  const reg = a.district.visibility.registry;
  return { act, rows: [...out.values()].sort((p, q) => q.px - p.px).map((e) => ({ ...e, part: reg[e.id], mask: V.SETS.filter((_, i) => V.needMask(cap.vis, e.id) & (1 << i)).join('+') || 'TIER3',
    counts: Object.fromEntries(V.SETS.map((s) => [s, cap.vis.counts[s][e.id] + (cap.vis.behind ? cap.vis.behind[s][e.id] : 0)]).filter(([, n]) => n)), tile: bake[e.tag][0].get(e.id) ?? 0, tile8x: bake[e.tag][1].get(e.id) ?? 0 })) };
};

try {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${BASE}?seed=${seed}&clean=1&freeze=7.3&static=1&intro=0&occ=0${extra ? '&' + extra : ''}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 180000 });
  // keep the bake's ID scene and result: regenerate the same district through a wrapped bake callback (window.__force adds counts)
  await page.evaluate(async () => {
    const a = window.__app, g = a.generator, orig = g.generate.bind(g);
    window.__force = [];
    g.generate = (cfg, bake, opts) => orig(cfg, bake && ((s, n, b) => { const v = bake(s, n, b); if (v) for (const [id, set] of window.__force) v.counts[set][id] += 1; window.__cap = { scene: s, vis: v }; return v; }), opts);
    const url = performance.getEntriesByType('resource').map((e) => e.name).find((n) => /\/deps\/three\.js/.test(n));
    window.__THREE = await import(url); window.__VIS = await import('/src/district/Visibility.ts'); window.__RIG = await import('/src/app/CameraRig.ts');
  });
  console.log(`vis-why seed ${seed} ${W}x${H} (ID renders at ${SS}x) against ${BASE}`);
  for (const sc of scen) {
    await page.evaluate(() => { window.__force = []; window.__app.opts.params.delete('vis'); window.__app.regenerate(); });
    const P = await shot(page, sc), m = await page.evaluate(missedParts, SS);
    const sets = m.act.length === 2 ? [m.act.join('')] : m.act;
    await page.evaluate((f) => { window.__force = f; window.__app.regenerate(); }, m.rows.flatMap((r) => sets.map((s) => [r.id, s])));
    const F = await shot(page, sc);
    await page.evaluate(() => { window.__force = []; window.__app.opts.params.set('vis', '0'); window.__app.regenerate(); });
    const V = await shot(page, sc);
    await page.evaluate(() => window.__app.district.group.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || !o.geometry.index) return;
      const ix = o.geometry.index.array, n = ix.length / 3, c = ix.slice();
      for (let t = 0; t < n; t++) for (let k = 0; k < 3; k++) ix[t * 3 + k] = c[(n - 1 - t) * 3 + k];
      o.geometry.index.needsUpdate = true;
    }));
    const R = await shot(page, sc);
    const d0 = await diff(P, V), d1 = await diff(F, V), o = new Set((await diff(V, R)).px), w = d0.w;
    const near = (k) => { for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) if (o.has(k + dy * w + dx)) return true; return false; };
    console.log(`\n== ${sc.name} ${sc.pos} ${sc.mode} [${m.act}]`);
    console.log(`  D0 pruned vs vis=0: ${d0.px.length} px (max ${d0.mx}, order ${d0.px.filter(near).length}) box ${bbox(d0.px, w)}`);
    console.log(`  D1 ${m.rows.length} missed parts forced into ${sets}: ${d1.px.length} px (max ${d1.mx}, order ${d1.px.filter(near).length}) box ${bbox(d1.px, w)}`);
    console.log(`  order-sensitive pixels of vis=0 in this view: ${o.size}`);
    for (const r of m.rows) console.log(`   ${String(r.id).padStart(4)} ${r.tag.padEnd(6)} ${String(r.px).padStart(5)} px box ${r.box}  ${r.part.group}/${r.part.role ?? r.part.kind}${r.part.floor != null ? ' F' + r.part.floor : ''}  need ${r.mask} ${JSON.stringify(r.counts)}  tile ${r.tile} tile8x ${r.tile8x}`);
    if (keep && (d0.px.length || d1.px.length)) { fs.mkdirSync(keep, { recursive: true }); for (const [k, v] of Object.entries({ pruned: P, forced: F, vis0: V, reversed: R })) fs.writeFileSync(`${keep}/${seed}-${W}x${H}-${sc.name}-${k}.png`, Buffer.from(v, 'base64')); }
  }
} finally { await browser.close(); }
