// Viewport proof (visibility bake + responsive framing): node tools/viewport-proof.mjs [--keep=dir] [--sizes=WxH,...] [--seeds=a,b] [--no-resize] [--no-controls]
// Against the running dev server (BASE_URL, default http://127.0.0.1:5173/), static=1, frozen time, occ=0 (the reveal fade would make false
// diffs). For every window size x seed, on a fresh load:
//   bake    the bake succeeded (no visibility error), its pages fit the WebGL2 guaranteed minimum (2048) and the GPU limits, no GL error
//           pending after boot, every building keeps visible parts
//   frame   at the poses below, the window never shows more than the frame the bake covered: the corners of the view, re-projected
//           into the full 16:9 / baked frame, stay inside it; and the player keeps the NDC it has in that frame (CameraRig.applyFrame).
//           Control (must fail on a narrow window): the same corner test on the pre-fix lens (fov x (16:9 / aspect)^0.85)
//   culling pruned vs ?vis=0 regenerated in the same session, same poses: 0 px above the threshold
// Resize (seed 1842, no reload): 1920x1080 -> 665x1200 -> 1920x1080 -> 2560x1080 (wider than the bake: re-bake) -> 665x1200, every step
// compared with a fresh load at that size (same pose): 0 px.
// Negative controls (DEV server only): ?visfail=alloc (a page past the GPU limit: a real refusal) and ?visfail=zero (counts dropped)
// must each end in a reported error with every part kept (Tier 3 = 0) and a render identical to ?vis=0. Run against a pre-fix build,
// the bake / culling checks must fail on non-16:9 windows (that is the bug this proof exists for).
// Exit code 1 when a check fails.
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const args = process.argv.slice(2);
const opt = (k, d) => args.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3) ?? d;
const keep = opt('keep', null), thr = +opt('thr', 2);
const sizes = opt('sizes', '1920x1080,1280x720,900x900,665x1200,390x844,2560x1080').split(',').map((s) => s.split('x').map(Number));
const seeds = opt('seeds', '1842,7719,30417').split(',').map(Number);
const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find((p) => fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const Q = 'clean=1&freeze=7.3&static=1&intro=0&occ=0';
// stable framings at their reference spots, the four blends at their triggers
const POSES = [['A', '-11,1', 'A'], ['B', '2,1.5', 'B'], ['C', '8,1', 'C'], ['D', '16,2', 'D'], ['D-far', '26,3.5', 'D'], ['AB', '-9.4,1', 'A,B,0.5'], ['BC', '4.2,1', 'B,C,0.5'], ['CD', '14,1', 'C,D,0.5'], ['BD', '14,3.3', 'B,D,0.5']]
  .map(([name, pos, mode]) => ({ name, pos: pos.split(',').map(Number), mode }));
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--no-sandbox', '--window-size=2600,1400', '--hide-scrollbars'] });
let failures = 0;
const fail = (msg) => { failures++; console.log(`  FAIL ${msg}`); };

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
/** geometry of the current rig camera against the full frame: max |NDC| of the view's corners in the full frame (<= 1.06 * ... inside
 *  the bake), player NDC drift, and the same corner test for the pre-fix lens */
const frameCheck = () => {
  const a = window.__app, r = a.rig, c = r.camera, V = c.position.constructor;
  const REF = 16 / 9, frame = r.frame ?? Infinity, asp = r.aspectRatio, full = Math.min(Math.max(asp, REF), frame);
  const f = c.clone(); f.aspect = full; f.fov = r.fov; f.updateProjectionMatrix(); f.projectionMatrix.elements[9] = r.shiftY; f.projectionMatrixInverse.copy(f.projectionMatrix).invert(); f.updateMatrixWorld(true);
  const corners = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  const worst = (cam) => { let m = 0; for (const [x, y] of corners) { const p = new V(x, y, 0.5).unproject(cam).project(f); m = Math.max(m, Math.abs(p.x), Math.abs(p.y)); } return m; };
  const pl = a.actors.player.pos, t = new V(pl.x, pl.y + 1, pl.z), n1 = t.clone().project(c), n0 = t.clone().project(f);
  // the pre-fix lens at this window aspect (vertical field widened by (16:9 / aspect)^0.85, nothing cropped)
  const o = c.clone(); o.aspect = asp; o.fov = r.fov * Math.pow(Math.max(1, REF / asp), 0.85); o.updateProjectionMatrix(); o.projectionMatrix.elements[9] = r.shiftY; o.projectionMatrixInverse.copy(o.projectionMatrix).invert();
  return { inside: worst(c), oldLens: worst(o), drift: Math.hypot(n1.x - n0.x, n1.y - n0.y), playerNdc: [n1.x, n1.y], full };
};
const bakeStats = () => {
  const a = window.__app, v = a.district.visibility, s = a.snapshot().visibility ?? {}, gl = a.renderer.getContext();
  return { err: gl.getError(), error: s.error ?? a.visibilityError ?? null, frame: s.frame, pages: v.bakePages, targetMB: s.bakeTargetMB, parts: v.parts, tier3: v.hidden, trisKept: v.trisKept,
    bakeMs: Math.round(v.bakeMs), allHidden: v.buildings.filter((b) => b.hidden === b.parts).map((b) => b.id), buildings: v.buildings.length,
    limit: Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE), gl.getParameter(gl.MAX_RENDERBUFFER_SIZE)), fixed: 'poseAspect' in a.rig };
};
async function open(W, H, query) {
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  const errs = []; page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); page.on('pageerror', (e) => errs.push(e.message));
  await page.goto(`${BASE}?${query}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true || !!window.__error', { timeout: 180000 });
  await page.waitForFunction(() => ![...document.body.children].some((e) => e.textContent?.includes('PAINTING') || e.textContent?.includes('GENERATING')), { timeout: 10000 }).catch(() => {});
  page.errs = errs;
  return page;
}
async function shoot(page, sc) { await page.evaluate(place, sc); await new Promise((r) => setTimeout(r, 450)); return page.screenshot({ encoding: 'base64' }); }
let dpage;
async function diff(a, b, name) {
  dpage ??= await browser.newPage();
  const r = await dpage.evaluate(async (ua, ub, t) => {
    const load = (u) => new Promise((res) => { const im = new Image(); im.onload = () => res(im); im.src = u; });
    const [ia, ib] = await Promise.all([load('data:image/png;base64,' + ua), load('data:image/png;base64,' + ub)]);
    if (ia.width !== ib.width || ia.height !== ib.height) return { n: -1, mx: -1 };
    const w = ia.width, h = ia.height, c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.drawImage(ia, 0, 0); const da = g.getImageData(0, 0, w, h).data; g.drawImage(ib, 0, 0); const db = g.getImageData(0, 0, w, h);
    let n = 0, mx = 0;
    for (let k = 0; k < da.length; k += 4) {
      const d = Math.max(Math.abs(da[k] - db.data[k]), Math.abs(da[k + 1] - db.data[k + 1]), Math.abs(da[k + 2] - db.data[k + 2]));
      mx = Math.max(mx, d); if (d > t) n++;
      const v = Math.min(255, d * 8); db.data[k] = v; db.data[k + 1] = v * 0.6; db.data[k + 2] = d > t ? 255 : v * 0.3; db.data[k + 3] = 255;
    }
    g.putImageData(db, 0, 0);
    return { n, mx, png: n ? c.toDataURL('image/png') : null };
  }, a, b, thr);
  if (r.n && keep && name) { fs.mkdirSync(keep, { recursive: true }); fs.writeFileSync(`${keep}/${name}-diff.png`, Buffer.from(r.png.split(',')[1], 'base64')); fs.writeFileSync(`${keep}/${name}-a.png`, Buffer.from(a, 'base64')); fs.writeFileSync(`${keep}/${name}-b.png`, Buffer.from(b, 'base64')); }
  return r;
}

try {
  console.log(`viewport proof against ${BASE} (threshold ${thr})`);
  // ---- fresh loads: bake, frame geometry, culling
  for (const seed of seeds) for (const [W, H] of sizes) {
    const page = await open(W, H, `seed=${seed}&${Q}`);
    const s = await page.evaluate(bakeStats);
    const tag = `seed ${seed} ${W}x${H}`;
    console.log(`${tag}: bake ${s.error ? 'ERROR' : 'ok'} frame ${s.frame} pages ${s.pages} (${s.targetMB} MB) Tier 3 ${s.tier3}/${s.parts} tris ${s.trisKept} bake ${s.bakeMs} ms${s.allHidden.length ? ` buildings fully culled ${s.allHidden.length}/${s.buildings}` : ''}`);
    if (s.error) fail(`${tag}: bake error ${s.error}`);
    if (s.err) fail(`${tag}: GL error 0x${s.err.toString(16)} pending after boot`);
    if (s.allHidden.length) fail(`${tag}: ${s.allHidden.length}/${s.buildings} buildings have every part culled`);
    if (page.errs.length) fail(`${tag}: console errors: ${page.errs.slice(0, 2).join(' | ').slice(0, 300)}`);
    const pruned = [], geo = [];
    for (const sc of POSES) { pruned.push(await shoot(page, sc)); geo.push(await page.evaluate(frameCheck)); }
    await page.evaluate(() => { window.__app.opts.params.set('vis', '0'); window.__app.regenerate(); });
    const rows = [];
    for (let i = 0; i < POSES.length; i++) {
      const full = await shoot(page, POSES[i]), d = await diff(pruned[i], full, `s${seed}-${W}x${H}-${POSES[i].name}`), g = geo[i];
      rows.push(`${POSES[i].name}:${d.n}${g.inside > 1.0001 ? '!' : ''}`);
      if (d.n) fail(`${tag} ${POSES[i].name}: pruned vs vis=0 ${d.n} px > ${thr} (max ${d.mx})`);
      if (s.fixed && g.inside > 1.0001) fail(`${tag} ${POSES[i].name}: the view leaves the full frame (corner at |NDC| ${g.inside.toFixed(4)})`);
      if (s.fixed && g.drift > 1e-6) fail(`${tag} ${POSES[i].name}: the player's NDC drifts ${g.drift.toExponential(2)} from the full frame`);
    }
    const narrow = W / H < 16 / 9 - 1e-6, worstOld = Math.max(...geo.map((g) => g.oldLens)), worst = Math.max(...geo.map((g) => g.inside));
    console.log(`  pruned vs vis=0 px: ${rows.join(' ')}   view corners in full frame <= ${worst.toFixed(4)} (pre-fix lens ${worstOld.toFixed(3)}${narrow ? ', control must exceed 1' : ''})`);
    if (narrow && worstOld <= 1.0001) fail(`${tag}: control: the pre-fix lens corner test did not detect the widened view`);
    await page.close();
  }

  // ---- resize without reload vs fresh loads
  if (!args.includes('--no-resize')) {
    const steps = [[1920, 1080], [665, 1200], [1920, 1080], [2560, 1080], [665, 1200]], sc = POSES[1];
    const fresh = new Map();
    for (const [W, H] of steps) if (!fresh.has(`${W}x${H}`)) { const p = await open(W, H, `seed=1842&${Q}`); fresh.set(`${W}x${H}`, { shot: await shoot(p, sc), s: await p.evaluate(bakeStats) }); await p.close(); }
    const page = await open(1920, 1080, `seed=1842&${Q}`);
    const out = [];
    for (let i = 0; i < steps.length; i++) {
      const [W, H] = steps[i];
      if (i) { await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 }); await new Promise((r) => setTimeout(r, 1800)); }
      const s = await page.evaluate(bakeStats), f = fresh.get(`${W}x${H}`), d = await diff(await shoot(page, sc), f.shot, `resize-${i}-${W}x${H}`);
      out.push(`${W}x${H}:${d.n}px(frame ${s.frame}, Tier 3 ${s.tier3})`);
      if (d.n) fail(`resize step ${i} ${W}x${H}: ${d.n} px vs a fresh load (max ${d.mx})`);
      if (s.error) fail(`resize step ${i}: bake error ${s.error}`);
    }
    console.log(`resize 16:9 -> portrait -> 16:9 -> 21:9 -> portrait (no reload) vs fresh loads: ${out.join('  ')}`);
    await page.close();
  }

  // ---- negative controls: a failed bake must keep every part, say so, and render like vis=0
  if (!args.includes('--no-controls')) {
    for (const mode of ['alloc', 'zero']) {
      const [W, H] = [665, 1200], page = await open(W, H, `seed=1842&${Q}&visfail=${mode}`), s = await page.evaluate(bakeStats);
      const shot = await shoot(page, POSES[1]);
      await page.evaluate(() => { window.__app.opts.params.set('vis', '0'); window.__app.regenerate(); });
      const d = await diff(shot, await shoot(page, POSES[1]), `control-${mode}`);
      const ok = !!s.error && s.tier3 === 0 && d.n === 0;
      console.log(`control visfail=${mode} ${W}x${H}: error ${s.error ? JSON.stringify(s.error.slice(0, 110)) : 'NONE'}, Tier 3 ${s.tier3}/${s.parts}, vs vis=0 ${d.n} px, console errors ${page.errs.length} -> ${ok ? 'fallback ok' : 'FALLBACK BROKEN'}`);
      if (!ok) fail(`control visfail=${mode}: expected a reported error, Tier 3 = 0 and 0 px vs vis=0`);
      if (!page.errs.some((e) => e.includes('visibility'))) fail(`control visfail=${mode}: no console error reported`);
      await page.close();
    }
  }
  console.log(failures ? `${failures} check(s) failed` : 'all checks passed');
} finally { await browser.close(); }
process.exit(failures ? 1 : 0);
