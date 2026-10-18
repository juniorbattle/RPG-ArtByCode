import * as THREE from 'three';
import { applyPose, type CamPose } from '../app/CameraRig';
import type { CamId, VisSet } from '../app/CameraGraph';

/** Visibility-driven generation.
 *
 *  Everything the district generates is tagged with a visibility part (a building wall per floor, a roof, a far
 *  house, a bridge, ...). After generation the camera graph's sampled poses (every framing over its zone, the
 *  poses along each blend, and their planar-mirror twins) are rendered as part-ID buffers on the GPU. Parts no
 *  pose ever shows are Tier 3: they are dropped from the per-frame passes (shadow casters survive only for the
 *  one-off static moon-shadow render, then their geometry is disposed). The rest is classed by which baked sets show it
 *  (A B C D AB BC CD BD bit mask, see needMask) and ordered by `planDraw`:
 *
 *    each static mesh stores its triangles class by class, a framing draws the prefix of classes up to the last one it needs,
 *    so a framing is one drawRange: no extra draw calls. (Pass 2 / 3 had the fixed chain [needed by C | B only | A only].)
 *
 *  The bake point-samples a quarter-resolution view: a strip thinner than one bake pixel can be missed while the real render (4x MSAA)
 *  still shows it. The frontal framing D sees every front-row side wall nearly edge-on (yaw -20 deg): those walls are such strips
 *  (measured pass 5b: 1-4 px of a missing wall edge at 1080p, a 58 px line at 2560 x 1080). D's stable poses therefore get a second
 *  main-view tile at twice the resolution (BAKE_FINE), counted on top of the normal one, so a part can only gain sets. */

export type Tier = 0 | 1 | 2;
export interface PartMeta {
  /** what it is: a building wall / roof, a simplified far house, a bridge, a landmark, a tree */
  kind: 'wall' | 'roof' | 'forge' | 'house' | 'bridge' | 'landmark' | 'tree' | 'occluder';
  /** authored tier: 0 gameplay / hero, 1 support, 2 atmosphere (3 = invisible is decided by the bake) */
  tier: Tier;
  /** grouping for the report (building id or background band) */
  group: string;
  /** world-facing role for building walls: front / west / east / roof / forge */
  role?: string;
  floor?: number;
}

export const FRAMINGS: CamId[] = ['A', 'B', 'C', 'D'];
/** the baked sets, one bit each in a part's need mask: the four stable framings and the blends between neighbours */
export const SETS: VisSet[] = ['A', 'B', 'C', 'D', 'AB', 'BC', 'CD', 'BD'];
export const ALL_MASK = (1 << SETS.length) - 1;
const setBit = (s: VisSet) => 1 << SETS.indexOf(s);
/** the need bits a draw configuration covers: every stable framing on screen plus the blend sets whose two ends are both on screen */
export function cfgMask(ids: CamId[]): number {
  let m = 0;
  for (const s of SETS) if ((s.length === 1 && ids.includes(s as CamId)) || (s.length === 2 && ids.includes(s[0] as CamId) && ids.includes(s[1] as CamId))) m |= setBit(s);
  return m;
}
/** the draw configurations the planner optimises: each framing settled, and each blend (both ends on screen), with a weight: the
 *  framings that existed before D (A / B / C and their blends) count double, so adding D never makes them draw more than they did
 *  (measured: the D-side configurations then pay the contiguity cost, see the journal) */
const CONFIGS: Array<[CamId[], number]> = [[['A'], 2], [['B'], 2], [['C'], 2], [['D'], 1], [['A', 'B'], 2], [['B', 'C'], 2], [['C', 'D'], 1], [['B', 'D'], 1]];

export interface VisResult {
  /** pixel counts per set, indexed by global part id */
  counts: Record<VisSet, Uint32Array>;
  /** pixels seen only through the player-reveal windows once the occludable parts are removed (see BehindPass) */
  behind?: Record<VisSet, Uint32Array>;
  poses: number;
  ms: number;
  /** time split: GPU render (submitted), readback (includes the GPU finishing), CPU decode */
  split: { render: number; readback: number; decode: number };
  /** pages rendered, the page target size, and the bytes of every target the bake allocated (ID pages, depth, counters) */
  pages: number; page: [number, number]; targetBytes: number;
  /** bake cache (BakeCache.ts): where the result came from, and the time spent computing its key */
  cache?: 'hit' | 'miss' | 'off' | 'verify-ok' | 'verify-mismatch' | 'verify-miss';
  keyMs?: number;
}

/** which baked sets show a part (bit per SETS entry; 0 = never seen = Tier 3). A settled framing needs the parts seen in its own
 *  stable poses; a blend additionally needs what only its blend poses show. Pixels a player reveal can expose behind an occludable
 *  part (v.behind) count like any other visible pixel. Untracked geometry (id <= 0) is needed everywhere. */
export function needMask(v: VisResult, id: number): number {
  if (id <= 0) return ALL_MASK;
  let m = 0;
  for (const s of SETS) if (v.counts[s][id] + (v.behind ? v.behind[s][id] : 0) > 0) m |= setBit(s);
  return m;
}

/** Draw order of the part classes (one class per distinct need mask). Each static mesh stores its triangles class by class, and a
 *  configuration (a framing, or a blend of two) draws the prefix of classes up to the last one it needs, so it is still one
 *  drawRange and costs no extra draw call. The order minimises the triangles drawn over all configurations: an exhaustive search
 *  when the classes are few, otherwise a deterministic move-and-keep-if-better search. Hidden parts (mask 0) are class `order.length`. */
export interface DrawPlan {
  order: number[];
  /** number of classes a configuration draws (the prefix length) */
  hiOf: (ids: CamId[]) => number;
  /** triangles a configuration draws */
  drawnOf: (ids: CamId[]) => number;
  classOfMask: (mask: number) => number;
}
export function planDraw(trisByMask: Map<number, number>): DrawPlan {
  const masks = [...trisByMask.keys()].filter((m) => m !== 0).sort((a, b) => popcount(b) - popcount(a) || b - a);
  const cfgs = CONFIGS.map(([ids]) => cfgMask(ids)), wts = CONFIGS.map(([, w]) => w);
  const hiFor = (order: number[], cm: number) => { for (let k = order.length - 1; k >= 0; k--) if (order[k] & cm) return k + 1; return 0; };
  const prefix = (order: number[]) => { const pre = [0]; order.forEach((m, k) => pre.push(pre[k] + (trisByMask.get(m) ?? 0))); return pre; };
  const cost = (order: number[]) => { const pre = prefix(order); let c = 0; cfgs.forEach((cm, i) => { c += pre[hiFor(order, cm)] * wts[i]; }); return c; };
  let best = masks.slice(), bestCost = cost(best);
  if (masks.length <= 8) {
    const perm = (rest: number[], cur: number[]): void => {
      if (!rest.length) { const c = cost(cur); if (c < bestCost) { bestCost = c; best = cur.slice(); } return; }
      for (let i = 0; i < rest.length; i++) { cur.push(rest[i]); perm([...rest.slice(0, i), ...rest.slice(i + 1)], cur); cur.pop(); }
    };
    perm(masks, []);
  } else {
    // starts: by popcount (most shared first), by mask value up and down; moves: take one class out and put it elsewhere
    for (const start of [masks.slice(), masks.slice().reverse(), masks.slice().sort((a, b) => a - b), masks.slice().sort((a, b) => b - a)]) {
      let cur = start, cc = cost(cur), improved = true;
      while (improved) {
        improved = false;
        for (let i = 0; i < cur.length; i++) for (let j = 0; j < cur.length; j++) {
          if (i === j) continue;
          const t = cur.slice(); const [m] = t.splice(i, 1); t.splice(j, 0, m);
          const c = cost(t);
          if (c < cc) { cc = c; cur = t; improved = true; }
        }
      }
      if (cc < bestCost) { bestCost = cc; best = cur; }
    }
  }
  const pre = prefix(best), idx = new Map(best.map((m, k) => [m, k]));
  return { order: best, hiOf: (ids) => hiFor(best, cfgMask(ids)), drawnOf: (ids) => pre[hiFor(best, cfgMask(ids))], classOfMask: (m) => idx.get(m) ?? best.length };
}
const popcount = (m: number) => { let n = 0; for (; m; m &= m - 1) n++; return n; };

const ID_VERT = /* glsl */ `
attribute float aPart;
varying float vPart;
void main(){ vPart = aPart; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const ID_FRAG = /* glsl */ `
varying float vPart;
void main(){
  float id = floor(vPart + 0.5);
  gl_FragColor = vec4(mod(id, 256.0), mod(floor(id / 256.0), 256.0), floor(id / 65536.0), 255.0) / 255.0;
}`;

export function idMaterial(side: THREE.Side): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ vertexShader: ID_VERT, fragmentShader: ID_FRAG, side });
}

/** Behind-occluder pass: the world WITHOUT its occludable parts, counted only inside the player-reveal windows
 *  (ellipses in tile NDC around where the player can stand for that pose). Whatever this shows that the normal
 *  bake never did is geometry a reveal can expose, so it must survive the Tier 3 cut. */
export const WIN_MAX = 64;
const ID_FRAG_WIN = /* glsl */ `
varying float vPart;
uniform vec4 uTile;
uniform vec4 uWin[${WIN_MAX}];
uniform int uWinN;
void main(){
  vec2 nd = (gl_FragCoord.xy - uTile.xy) / uTile.zw * 2.0 - 1.0;
  bool inside = false;
  for (int i = 0; i < ${WIN_MAX}; i++) {
    if (i >= uWinN) break;
    vec2 d = (nd - uWin[i].xy) / uWin[i].zw;
    if (dot(d, d) < 1.0) { inside = true; break; }
  }
  float id = floor(vPart + 0.5);
  gl_FragColor = vec4(mod(id, 256.0), mod(floor(id / 256.0), 256.0), floor(id / 65536.0), inside ? 255.0 : 0.0) / 255.0;
}`;

export interface BehindPass {
  scene: THREE.Scene;
  uniforms: { uTile: { value: THREE.Vector4 }; uWin: { value: THREE.Vector4[] }; uWinN: { value: number } };
  /** reveal ellipses (centre xy, semi-axes xy; tile NDC) for a baked pose, seen through the bake camera */
  windowsFor(cam: THREE.PerspectiveCamera, p: BakePose): Array<[number, number, number, number]>;
}

export function behindUniforms(): BehindPass['uniforms'] {
  return { uTile: { value: new THREE.Vector4() }, uWin: { value: Array.from({ length: WIN_MAX }, () => new THREE.Vector4()) }, uWinN: { value: 0 } };
}
export function windowIdMaterial(side: THREE.Side, uniforms: BehindPass['uniforms']): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ vertexShader: ID_VERT, fragmentShader: ID_FRAG_WIN, side, uniforms });
}

/** `player` = where the player stood when the pose was authored (the behind pass opens windows around it) */
export interface BakePose { set: VisSet; pose: CamPose; player?: [number, number] }

/** Upper bound of a bake page (one render target): the WebGL2 guaranteed minimum of MAX_TEXTURE_SIZE and MAX_RENDERBUFFER_SIZE, so
 *  the bake allocates the same modest targets on every device. (It used to stack every tile in one target whose height grew with
 *  1 / aspect: 3840 x 11880 at 16:9, 3840 x 38104 at 665 x 1200; past the GPU limit the target was refused, every count read 0 and
 *  every building was culled.) */
export const BAKE_PAGE = 2048;

export interface BakeOptions {
  /** page size cap (default BAKE_PAGE; always clamped to the GPU limits) */
  page?: number;
  /** negative controls (DEV `?visfail=`): 'alloc' asks for a page past the GPU limit (a real refusal), 'zero' drops the counts after
   *  a successful bake (a silent read failure); both must end in a VisBakeError, never in a culled district */
  fail?: 'alloc' | 'zero';
  /** DEV experiment (`?visscale=`): tile resolution multiplier (main 480 and mirror 240 wide at 1) */
  scale?: number;
  /** extra main-view tiles for the poses of these sets at this scale, counted on top of the normal tiles (additive: a part can only gain
   *  sets). Default BAKE_FINE; null = none (DEV `?visfine=0`, or `?visfine=D:4` / `A+B+C+D:2` to try others) */
  fine?: { sets: VisSet[]; scale: number } | null;
}

/** D's stable poses (21 at 16:9) also baked at 2x: the front-row side walls D sees edge-on. Measured (pass 5b, 1920 x 1080, three seeds):
 *  +16 ms of bake (177 -> 193 ms), a few side walls gain D (0 to +652 triangles drawn in D and its blends, A / B / C unchanged); 4x would catch more
 *  (every D sliver of the proof set) for +75 ms. */
export const BAKE_FINE: { sets: VisSet[]; scale: number } = { sets: ['D'], scale: 2 };

/** the bake could not be trusted (target refused, GL error, empty counts): the caller keeps every part and reports it */
export class VisBakeError extends Error {}

/** Renders part-ID tiles for every pose (main view at 1/4 resolution, mirror view at 1/8, matching the half-res reflection) and
 *  counts pixels per part and set. The FOV is widened slightly so anything grazing a frame edge between two samples is kept.
 *  Tiles are packed into pages of at most BAKE_PAGE x BAKE_PAGE: each page is rendered, then counted into the same accumulating
 *  counters (GPU) or read back and decoded (CPU), so the counts do not depend on how many pages there are. A tile's size depends on
 *  the aspect only (480 x 270 at 16:9, as before). Throws VisBakeError when a target is incomplete, a GL error was raised, or a set
 *  that has poses counted no pixel at all: a failed bake must never read as "nothing is visible". */
export function bakeVisibility(renderer: THREE.WebGLRenderer, scene: THREE.Scene, nParts: number, poses: BakePose[], aspect: number, waterY: number, behind?: BehindPass, opts: BakeOptions = {}): VisResult {
  const t0 = performance.now();
  const gl = renderer.getContext() as WebGL2RenderingContext;
  const vp = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array;
  const limit = Math.min(renderer.capabilities.maxTextureSize, gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number, vp[0], vp[1]);
  const cap = Math.min(opts.page ?? BAKE_PAGE, limit);
  // tile size: 480 x 480 / aspect (wide frames, unchanged), bounded to 480 tall for frames narrower than square
  const tile = (n: number) => (aspect >= 1 ? [n, Math.round(n / aspect)] : [Math.round(n * aspect), n]);
  const sc = opts.scale ?? 1, [mainW, mainH] = tile(480 * sc), [mirW, mirH] = tile(240 * sc);
  if (mainW > cap || mainH > cap) throw new VisBakeError(`visibility bake: a ${mainW} x ${mainH} tile does not fit a ${cap} px page`);
  type Tile = BakePose & { mirror: boolean; fine?: boolean; page: number; x: number; y: number; w: number; h: number };
  const tiles: Tile[] = [];
  // shelf packing, main tiles then mirror tiles (on a new row)
  let page = 0, x = 0, y = 0, rowH = 0, pageW = 0, pageH = 0;
  const place = (p: BakePose, mirror: boolean, w: number, h: number, fine = false) => {
    if (x + w > cap) { x = 0; y += rowH; rowH = 0; }
    if (y + h > cap) { page++; x = 0; y = 0; rowH = 0; }
    tiles.push({ ...p, mirror, fine, page, x, y, w, h });
    x += w; rowH = Math.max(rowH, h); pageW = Math.max(pageW, x); pageH = Math.max(pageH, y + h);
  };
  for (const p of poses) place(p, false, mainW, mainH);
  x = cap;
  for (const p of poses) place(p, true, mirW, mirH);
  const fine = opts.fine === undefined ? BAKE_FINE : opts.fine;
  if (fine) {
    // fine main-view tiles (BAKE_FINE) on a new row: no reveal windows (the normal tile of the same pose has them)
    const [fw, fh] = tile(480 * fine.scale);
    if (fw > cap || fh > cap) throw new VisBakeError(`visibility bake: a ${fw} x ${fh} fine tile does not fit a ${cap} px page`);
    x = cap;
    for (const p of poses) if (fine.sets.includes(p.set)) place(p, false, fw, fh, true);
  }
  const pages = page + 1;
  if (opts.fail === 'alloc') pageH = limit + 1;
  const counter = renderer.extensions.has('EXT_float_blend') && nParts < 1 << 20;
  const CW = 1024, rows = Math.ceil((nParts + 1) / CW), CH = rows * SETS.length * LANES;
  const targetBytes = pageW * pageH * 8 * (behind ? 2 : 1) + (counter ? CW * CH * 16 * (behind ? 2 : 1) : 0);

  const made: Array<{ dispose(): void }> = [];
  const target = (w: number, h: number, o: THREE.RenderTargetOptions) => { const t = new THREE.WebGLRenderTarget(w, h, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false, ...o }); made.push(t); return t; };
  const prevTarget = renderer.getRenderTarget(), prevAuto = renderer.autoClear;
  const prevClear = new THREE.Color(); renderer.getClearColor(prevClear); const prevAlpha = renderer.getClearAlpha();
  const complete = (t: THREE.WebGLRenderTarget) => { renderer.setRenderTarget(t); return gl.checkFramebufferStatus(gl.FRAMEBUFFER); };
  for (let i = 0; i < 32 && gl.getError() !== gl.NO_ERROR; i++);
  let tRead = 0, tDecode = 0;
  try {
    const rt = target(pageW, pageH, { depthBuffer: true });
    const rt2 = behind ? target(pageW, pageH, { depthBuffer: true }) : null;
    for (const t of rt2 ? [rt, rt2] : [rt]) {
      const st = complete(t);
      if (st !== gl.FRAMEBUFFER_COMPLETE) throw new VisBakeError(`visibility bake: the ${t.width} x ${t.height} page target is incomplete (status 0x${st.toString(16)}; GPU limit ${limit})`);
    }
    // counting: additive scatter into a (part x set x lane) float target when the GPU can blend floats, otherwise CPU decode per page
    const makeCounter = (): Counter | null => {
      if (!counter) return null;
      const crt = target(CW, CH, { type: THREE.FloatType, depthBuffer: false });
      if (complete(crt) !== gl.FRAMEBUFFER_COMPLETE) return null;
      renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false);
      return scatterCounter(renderer, crt, Math.max(...tiles.map((t) => t.w * t.h)), rows, nParts, made);
    };
    const main = makeCounter(), back = rt2 ? makeCounter() : null;
    const cpu = Object.fromEntries(SETS.map((s) => [s, new Uint32Array(nParts + 1)])) as Record<VisSet, Uint32Array>;
    const cpu2 = Object.fromEntries(SETS.map((s) => [s, new Uint32Array(nParts + 1)])) as Record<VisSet, Uint32Array>;
    const px = main && (!rt2 || back) ? null : new Uint8Array(pageW * pageH * 4);
    const decode = (src: THREE.WebGLRenderTarget, tl: Tile[], counts: Record<VisSet, Uint32Array>) => {
      const r0 = performance.now();
      renderer.readRenderTargetPixels(src, 0, 0, pageW, pageH, px!);
      const r1 = performance.now(); tRead += r1 - r0;
      for (const t of tl) {
        const cnt = counts[t.set];
        for (let j = t.y; j < t.y + t.h; j++) {
          let k = (j * pageW + t.x) * 4;
          for (let i = 0; i < t.w; i++, k += 4) {
            if (px![k + 3] === 0) continue;
            const id = px![k] | (px![k + 1] << 8) | (px![k + 2] << 16);
            if (id > 0 && id <= nParts) cnt[id]++;
          }
        }
      }
      tDecode += performance.now() - r1;
    };
    const cam = new THREE.PerspectiveCamera(34, aspect, 1.5, 900);
    const mir = new THREE.PerspectiveCamera(34, aspect, 1.5, 900);
    renderer.autoClear = false;
    renderer.setClearColor(0x000000, 0);
    rt.scissorTest = true; if (rt2) rt2.scissorTest = true;
    for (let pg = 0; pg < pages; pg++) {
      const tl = tiles.filter((t) => t.page === pg);
      for (const t of tl) {
        applyPose(cam, t.pose, aspect, 1.06);
        let c = cam;
        if (t.mirror) {
          // the planar reflection camera: mirrored about the street plane, near plane tilted onto the water
          const target = new THREE.Vector3(0, 0, -1).applyQuaternion(cam.quaternion).add(cam.position);
          const up = new THREE.Vector3(0, 1, 0).applyQuaternion(cam.quaternion);
          mir.position.set(cam.position.x, -cam.position.y, cam.position.z);
          mir.up.set(up.x, -up.y, up.z);
          mir.lookAt(target.x, -target.y, target.z);
          mir.updateMatrixWorld(true);
          mir.projectionMatrix.copy(cam.projectionMatrix);
          const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -waterY).applyMatrix4(mir.matrixWorldInverse);
          const cp = new THREE.Vector4(plane.normal.x, plane.normal.y, plane.normal.z, plane.constant);
          const e = mir.projectionMatrix.elements;
          const q = new THREE.Vector4((Math.sign(cp.x) + e[8]) / e[0], (Math.sign(cp.y) + e[9]) / e[5], -1, (1 + e[10]) / e[14]);
          cp.multiplyScalar(2 / cp.dot(q));
          e[2] = cp.x; e[6] = cp.y; e[10] = cp.z + 1; e[14] = cp.w;
          mir.projectionMatrixInverse.copy(mir.projectionMatrix).invert();
          c = mir;
        }
        rt.viewport.set(t.x, t.y, t.w, t.h); rt.scissor.set(t.x, t.y, t.w, t.h);
        renderer.setRenderTarget(rt);
        renderer.clear(true, true, false);
        renderer.render(scene, c);
        if (behind && rt2 && !t.mirror && !t.fine) {
          // the same view without the occludable parts, ID'd only inside the reveal windows (the mirror pass never reveals)
          const bu = behind.uniforms, wins = behind.windowsFor(c, t).slice(0, WIN_MAX);
          bu.uTile.value.set(t.x, t.y, t.w, t.h); bu.uWinN.value = wins.length;
          wins.forEach((w, i) => bu.uWin.value[i].set(w[0], w[1], w[2], w[3]));
          rt2.viewport.set(t.x, t.y, t.w, t.h); rt2.scissor.set(t.x, t.y, t.w, t.h);
          renderer.setRenderTarget(rt2);
          renderer.clear(true, true, false);
          renderer.render(behind.scene, c);
        }
      }
      if (main) main.add(rt, tl); else decode(rt, tl, cpu);
      if (rt2) { const tb = tl.filter((t) => !t.mirror && !t.fine); if (back) back.add(rt2, tb); else decode(rt2, tb, cpu2); }
    }
    // GPU counters: one readback each (it waits for the GPU to finish the pages), then the lane sums on the CPU
    const fromGpu = (c: Counter) => { const t = performance.now(), r = c.read(); tRead += r.readMs; tDecode += performance.now() - t - r.readMs; return r.counts; };
    const counts = main ? fromGpu(main) : cpu;
    const behindCounts = rt2 ? (back ? fromGpu(back) : cpu2) : undefined;
    const err = gl.getError();
    if (err !== gl.NO_ERROR) throw new VisBakeError(`visibility bake: GL error 0x${err.toString(16)} during the bake (${pages} pages of ${pageW} x ${pageH})`);
    if (opts.fail === 'zero') for (const s of SETS) counts[s].fill(0);
    // every set that has poses sees part of the district: an all-zero set means the counts were not read
    const empty = SETS.filter((s) => poses.some((p) => p.set === s) && !counts[s].some((n) => n > 0));
    if (empty.length) throw new VisBakeError(`visibility bake: no pixel counted for ${empty.join(', ')} (${poses.length} poses, ${pages} pages of ${pageW} x ${pageH})`);
    const ms = performance.now() - t0;
    return { counts, behind: behindCounts, poses: poses.length, ms, split: { render: ms - tRead - tDecode, readback: tRead, decode: tDecode }, pages, page: [pageW, pageH], targetBytes };
  } finally {
    renderer.setRenderTarget(prevTarget);
    renderer.setClearColor(prevClear, prevAlpha);
    renderer.autoClear = prevAuto;
    for (const m of made) m.dispose();
  }
}

/** Everything of the bake's own code its result depends on (shaders, the bake and counter functions, the pose placement, constants), for
 *  the bake cache key (BakeCache.ts, journal pass 6, P5): any edit of the bake changes it, so a stale entry can never be read back. */
export function bakeCodeFingerprint(): string {
  return [ID_VERT, ID_FRAG, ID_FRAG_WIN, SCATTER_VERT, SCATTER_FRAG, LANES, BAKE_PAGE, JSON.stringify(BAKE_FINE), WIN_MAX, SETS.join(),
    bakeVisibility.toString(), scatterCounter.toString(), applyPose.toString()].join('\u0000');
}

interface Counter { add(src: THREE.WebGLRenderTarget, tl: Array<{ set: VisSet; x: number; y: number; w: number; h: number }>): void; read(): { counts: Record<VisSet, Uint32Array>; readMs: number } }
/** GPU reduction: one point per ID pixel, additively accumulated into a (part x set) float counter target. Neighbouring pixels land in
 *  different lanes (64 of them) so the blend units never serialise on one hot counter; the lane histogram is read back once and summed. */
function scatterCounter(renderer: THREE.WebGLRenderer, crt: THREE.WebGLRenderTarget, maxPx: number, rows: number, nParts: number, made: Array<{ dispose(): void }>): Counter {
  const CW = crt.width, CH = crt.height;
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPx * 3), 3));
  const mat = new THREE.RawShaderMaterial({
    glslVersion: THREE.GLSL3, vertexShader: SCATTER_VERT, fragmentShader: SCATTER_FRAG, depthTest: false, depthWrite: false,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
    uniforms: { tIds: { value: null }, uOrigin: { value: new THREE.Vector2() }, uW: { value: 1 }, uRow: { value: 0 }, uCW: { value: CW }, uSize: { value: new THREE.Vector2(CW, CH) } },
  });
  made.push(geo, mat);
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
  const ps = new THREE.Scene(); ps.add(pts);
  const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  return {
    add(src, tl) {
      renderer.setRenderTarget(crt);
      mat.uniforms.tIds.value = src.texture;
      for (const t of tl) {
        mat.uniforms.uOrigin.value.set(t.x, t.y); mat.uniforms.uW.value = t.w; mat.uniforms.uRow.value = SETS.indexOf(t.set) * rows;
        geo.setDrawRange(0, t.w * t.h);
        renderer.render(ps, oc);
      }
    },
    read() {
      const buf = new Float32Array(CW * CH * 4);
      const r0 = performance.now();
      renderer.readRenderTargetPixels(crt, 0, 0, CW, CH, buf);
      const readMs = performance.now() - r0;
      const counts = Object.fromEntries(SETS.map((s) => [s, new Uint32Array(nParts + 1)])) as Record<VisSet, Uint32Array>;
      SETS.forEach((s, si) => {
        for (let id = 1; id <= nParts; id++) {
          let n = 0;
          for (let l = 0; l < LANES; l++) n += buf[(((si * rows + Math.floor(id / CW)) * LANES + l) * CW + (id % CW)) * 4];
          counts[s][id] = n;
        }
      });
      return { counts, readMs };
    },
  };
}

const LANES = 64;
const SCATTER_VERT = /* glsl */ `
precision highp float; precision highp int;
uniform highp sampler2D tIds;
uniform vec2 uOrigin; uniform int uW; uniform int uRow; uniform int uCW; uniform vec2 uSize;
in vec3 position;
void main(){
  int i = gl_VertexID;
  ivec2 p = ivec2(i % uW, i / uW);
  vec4 c = texelFetch(tIds, ivec2(int(uOrigin.x) + p.x, int(uOrigin.y) + p.y), 0);
  int id = int(c.r * 255.0 + 0.5) + int(c.g * 255.0 + 0.5) * 256 + int(c.b * 255.0 + 0.5) * 65536;
  gl_PointSize = 1.0;
  if (c.a < 0.5 || id == 0) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  int lane = (p.x & 7) + ((p.y & 7) << 3);
  vec2 cell = vec2(float(id % uCW), float((uRow + id / uCW) * ${LANES} + lane)) + 0.5;
  gl_Position = vec4(cell / uSize * 2.0 - 1.0, 0.0, 1.0);
}`;
const SCATTER_FRAG = /* glsl */ `
precision highp float;
out vec4 fragColor;
void main(){ fragColor = vec4(1.0); }`;
