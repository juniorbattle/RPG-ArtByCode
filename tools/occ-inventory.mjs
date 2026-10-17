// Empirical occluder inventory (Pass 3, step 0): for a grid of player positions on the quay and the camera pose the
// graph would use there (settled framing + blend poses near the zone edges), trace camera -> player torso against
// every rendered triangle and cluster what the ray crosses.
//   node tools/occ-inventory.mjs [query] [out.json]      (dev server on BASE_URL, default :5173)
import puppeteer from 'puppeteer-core';
import fs from 'node:fs';

const exe = [process.env.CHROME_PATH, 'C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].filter(Boolean).find((p) => fs.existsSync(p));
const BASE = process.env.BASE_URL || 'http://127.0.0.1:5173/';
const query = process.argv[2] || 'clean=1&freeze=7.3&static=1&vis=0&occ=0';
const out = process.argv[3];
const FRAC = Number(process.env.OCC_FRAC || 0.55);
const browser = await puppeteer.launch({ executablePath: exe, headless: 'new', args: ['--use-gl=angle', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--window-size=1280,720'], defaultViewport: { width: 1280, height: 720 } });
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`${BASE}?${query}`, { waitUntil: 'load' });
  await page.waitForFunction('window.__ready === true', { timeout: 120000 });
  const res = await page.evaluate((__FRAC__) => {
    const app = window.__app, g = app.graph, d = app.district;
    const WALK = { x0: -13.5, x1: 26, z0: -3.2, z1: 4.05 };
    // triangle soup in world space, per mesh (instanced meshes expanded), with an AABB per mesh / instance
    const soups = [];
    d.group.updateMatrixWorld(true);
    d.group.traverse((o) => {
      if (!o.isMesh || !(o.layers.mask & 1)) return;
      const geo = o.geometry, pos = geo.attributes.position, idx = geo.index;
      const n = idx ? Math.min(idx.count, geo.drawRange.count === Infinity ? idx.count : geo.drawRange.count) : pos.count;
      const insts = o.isInstancedMesh ? o.count : 1;
      for (let k = 0; k < insts; k++) {
        const m = new Float32Array(16);
        const e = o.matrixWorld.elements;
        if (o.isInstancedMesh) { const im = o.instanceMatrix.array, a = new Float32Array(im.buffer, im.byteOffset + k * 64, 16);
          // world = matrixWorld * instanceMatrix
          for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let t = 0; t < 4; t++) s += e[t * 4 + r] * a[c * 4 + t]; m[c * 4 + r] = s; }
        } else m.set(e);
        const tris = new Float32Array(n * 3);
        const v = [0, 0, 0];
        const P = (i) => { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); return [m[0] * x + m[4] * y + m[8] * z + m[12], m[1] * x + m[5] * y + m[9] * z + m[13], m[2] * x + m[6] * y + m[10] * z + m[14]]; };
        const out = new Float32Array(n * 3);
        for (let i = 0; i < n; i++) { const vi = idx ? idx.getX(i) : i; const p = P(vi); out[i * 3] = p[0]; out[i * 3 + 1] = p[1]; out[i * 3 + 2] = p[2]; }
        void tris; void v;
        let b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9];
        for (let i = 0; i < n; i++) for (let c = 0; c < 3; c++) { b[c] = Math.min(b[c], out[i * 3 + c]); b[3 + c] = Math.max(b[3 + c], out[i * 3 + c]); }
        soups.push({ name: o.name || (o.isInstancedMesh ? 'instanced' : 'mesh'), inst: o.isInstancedMesh ? k : -1, tris: out, bb: b, n: n / 3 });
      }
    });
    const hitSeg = (o, dr, L, a, b, c) => {
      const e1 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], e2 = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
      const p = [dr[1] * e2[2] - dr[2] * e2[1], dr[2] * e2[0] - dr[0] * e2[2], dr[0] * e2[1] - dr[1] * e2[0]];
      const det = e1[0] * p[0] + e1[1] * p[1] + e1[2] * p[2];
      if (Math.abs(det) < 1e-9) return -1;
      const inv = 1 / det, t0 = [o[0] - a[0], o[1] - a[1], o[2] - a[2]];
      const u = (t0[0] * p[0] + t0[1] * p[1] + t0[2] * p[2]) * inv; if (u < 0 || u > 1) return -1;
      const q = [t0[1] * e1[2] - t0[2] * e1[1], t0[2] * e1[0] - t0[0] * e1[2], t0[0] * e1[1] - t0[1] * e1[0]];
      const v = (dr[0] * q[0] + dr[1] * q[1] + dr[2] * q[2]) * inv; if (v < 0 || u + v > 1) return -1;
      const t = (e2[0] * q[0] + e2[1] * q[1] + e2[2] * q[2]) * inv;
      return t > 0.05 && t < L ? t : -1;
    };
    const segBox = (o, dr, L, b) => { let t0 = 0, t1 = L; for (let i = 0; i < 3; i++) { if (Math.abs(dr[i]) < 1e-9) { if (o[i] < b[i] || o[i] > b[3 + i]) return false; } else { let a = (b[i] - o[i]) / dr[i], c = (b[3 + i] - o[i]) / dr[i]; if (a > c) [a, c] = [c, a]; t0 = Math.max(t0, a); t1 = Math.min(t1, c); if (t0 > t1) return false; } } return true; };
    const camPos = (s) => { const cp = Math.cos(s.pitch); return [s.tx + s.dist * Math.sin(s.yaw) * cp, s.ty + s.dist * Math.sin(s.pitch), s.tz + s.dist * Math.cos(s.yaw) * cp]; };
    const inCollider = (x, z) => d.colliders.some((c) => c.kind === 'rect' ? x > c.x0 - 0.25 && x < c.x1 + 0.25 && z > c.z0 - 0.25 && z < c.z1 + 0.25 : Math.hypot(x - c.x, z - c.z) < c.r + 0.25);
    const H = app.actors.player.height, FR = __FRAC__;
    const clusters = new Map();
    let rays = 0, blocked = 0;
    const setCount = {}, blockedBy = {};
    const trace = (set, st, x, z) => {
      const o = camPos(st), T = [x, (FR * H) * st.charScale, z];
      const dv = [T[0] - o[0], T[1] - o[1], T[2] - o[2]], L = Math.hypot(...dv), dr = dv.map((q) => q / L);
      rays++; setCount[set] = (setCount[set] ?? 0) + 1;
      const seen = new Set();
      for (const s of soups) {
        if (!segBox(o, dr, L, s.bb)) continue;
        for (let i = 0; i < s.n; i++) {
          const a = [s.tris[i * 9], s.tris[i * 9 + 1], s.tris[i * 9 + 2]], b = [s.tris[i * 9 + 3], s.tris[i * 9 + 4], s.tris[i * 9 + 5]], c = [s.tris[i * 9 + 6], s.tris[i * 9 + 7], s.tris[i * 9 + 8]];
          const t = hitSeg(o, dr, L, a, b, c);
          if (t < 0) continue;
          const cx = (a[0] + b[0] + c[0]) / 3, cy = (a[1] + b[1] + c[1]) / 3, cz = (a[2] + b[2] + c[2]) / 3;
          const key = `${s.name}${s.inst >= 0 ? '#' + s.inst : ''} @${Math.round(cx)},${Math.round(cy / 2) * 2},${Math.round(cz)}`;
          if (seen.has(key)) continue; seen.add(key);
          const e = clusters.get(key) ?? { key, mesh: s.name, inst: s.inst, n: 0, sets: {}, px: [1e9, -1e9], pz: [1e9, -1e9], c: [cx, cy, cz], tMin: 1e9 };
          e.n++; e.sets[set] = (e.sets[set] ?? 0) + 1; e.px = [Math.min(e.px[0], x), Math.max(e.px[1], x)]; e.pz = [Math.min(e.pz[0], z), Math.max(e.pz[1], z)]; e.tMin = Math.min(e.tMin, t / L);
          clusters.set(key, e);
        }
      }
      if (seen.size) { blocked++; blockedBy[set] = (blockedBy[set] ?? 0) + 1; }
    };
    for (let x = WALK.x0; x <= WALK.x1 + 1e-6; x += 1.0) for (let z = WALK.z0; z <= WALK.z1 + 1e-6; z += 0.75) {
      if (inCollider(x, z)) continue;
      const id = g.zoneFor(x, z, null);
      trace(id, g.evalAnchor(id, x, z), x, z);
      // blend poses around the zone edges
      for (const [a, b, set] of [['A', 'B', 'AB'], ['B', 'C', 'BC'], ['C', 'D', 'CD'], ['B', 'D', 'BD']]) {
        const sa = g.evalAnchor(a, x, z), sb = g.evalAnchor(b, x, z);
        const near = set === 'AB' ? x < -5 && x > -13 : set === 'BC' ? x > 3 && x < 14.5 && z < 3.4 : set === 'CD' ? x > 11 && x < 20 && z < 3.4 : x > 11 && x < 20 && z > 2.3;
        if (!near) continue;
        for (const w of [0.25, 0.5, 0.75]) {
          const sm = w * w * w * (w * (w * 6 - 15) + 10);
          trace(set, g.blendPose(sa, sb, sm, new d.group.position.constructor(x, 1, z), (app.rig.poseAspect ?? app.rig.aspectRatio), a === 'D' || b === 'D'), x, z);
        }
      }
    }
    const list = [...clusters.values()].sort((p, q) => q.n - p.n).slice(0, 60).map((c) => ({ ...c, c: c.c.map((v) => +v.toFixed(2)), tMin: +c.tMin.toFixed(2) }));
    return { rays, blocked, blockedBy, setCount, soups: soups.length, list };
  }, FRAC);
  console.log(`rays ${res.rays}, blocked ${res.blocked} (${((100 * res.blocked) / res.rays).toFixed(1)}%), sets ${JSON.stringify(res.setCount)}, blocked per set ${JSON.stringify(res.blockedBy)}`);
  for (const c of res.list) console.log(`${String(c.n).padStart(4)}  ${c.key.padEnd(38)} sets ${JSON.stringify(c.sets)}  x ${c.px.map((v) => v.toFixed(1)).join('..')} z ${c.pz.map((v) => v.toFixed(1)).join('..')}  centroid ${c.c.join(',')}`);
  if (out) fs.writeFileSync(out, JSON.stringify(res, null, 1));
} finally { await browser.close(); }
