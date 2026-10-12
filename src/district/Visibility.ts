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
 *    so a framing is one drawRange: no extra draw calls. (Pass 2 / 3 had the fixed chain [needed by C | B only | A only].) */

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

/** Renders part-ID tiles for every pose (main view at 1/4 resolution, mirror view at 1/8, matching the half-res
 *  reflection), reads them back in one go and counts pixels per part and set. The FOV is widened slightly so
 *  anything grazing a frame edge between two samples is kept. */
export function bakeVisibility(renderer: THREE.WebGLRenderer, scene: THREE.Scene, nParts: number, poses: BakePose[], aspect: number, waterY: number, behind?: BehindPass): VisResult {
  const t0 = performance.now();
  const mainW = 480, mainH = Math.round(480 / aspect), mirW = 240, mirH = Math.round(240 / aspect);
  const tiles: Array<{ set: VisSet; pose: CamPose; mirror: boolean; x: number; y: number; w: number; h: number }> = [];
  const cols = 8, W = cols * mainW;
  let y = 0;
  for (let i = 0; i < poses.length; i += cols) { poses.slice(i, i + cols).forEach((p, j) => tiles.push({ ...p, mirror: false, x: j * mainW, y, w: mainW, h: mainH })); y += mainH; }
  const mcols = Math.floor(W / mirW);
  for (let i = 0; i < poses.length; i += mcols) { poses.slice(i, i + mcols).forEach((p, j) => tiles.push({ ...p, mirror: true, x: j * mirW, y, w: mirW, h: mirH })); y += mirH; }
  const H = y;
  const rt = new THREE.WebGLRenderTarget(W, H, { depthBuffer: true, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
  rt.scissorTest = true;
  const rt2 = behind ? new THREE.WebGLRenderTarget(W, H, { depthBuffer: true, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false }) : null;
  if (rt2) rt2.scissorTest = true;
  const cam = new THREE.PerspectiveCamera(34, aspect, 1.5, 900);
  const mir = new THREE.PerspectiveCamera(34, aspect, 1.5, 900);
  const prevTarget = renderer.getRenderTarget(), prevAuto = renderer.autoClear;
  const prevClear = new THREE.Color(); renderer.getClearColor(prevClear); const prevAlpha = renderer.getClearAlpha();
  renderer.autoClear = false;
  renderer.setRenderTarget(rt);
  renderer.setClearColor(0x000000, 0);
  for (const t of tiles) {
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
    if (behind && rt2 && !t.mirror) {
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
  rt.scissorTest = false;
  rt.viewport.set(0, 0, W, H); rt.scissor.set(0, 0, W, H);
  if (rt2) { rt2.scissorTest = false; rt2.viewport.set(0, 0, W, H); rt2.scissor.set(0, 0, W, H); }
  const t1 = performance.now();
  let t2 = 0;
  const countIds = (src: THREE.WebGLRenderTarget, tl: typeof tiles): Record<VisSet, Uint32Array> => {
  const counts = Object.fromEntries(SETS.map((s) => [s, new Uint32Array(nParts + 1)])) as Record<VisSet, Uint32Array>;
  if (renderer.extensions.has('EXT_float_blend') && nParts < 1 << 20) {
    // GPU reduction: one point per ID pixel, additively accumulated into a (part x set) float counter target.
    // Neighbouring pixels land in different lanes (64 of them) so the blend units never serialise on one hot
    // counter; the small lane histogram is read back and summed.
    const CW = 1024, rows = Math.ceil((nParts + 1) / CW), CH = rows * SETS.length * LANES;
    const crt = new THREE.WebGLRenderTarget(CW, CH, { type: THREE.FloatType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
    const maxPx = Math.max(...tl.map((t) => t.w * t.h));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPx * 3), 3));
    const mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: SCATTER_VERT, fragmentShader: SCATTER_FRAG, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
      uniforms: { tIds: { value: src.texture }, uOrigin: { value: new THREE.Vector2() }, uW: { value: 1 }, uRow: { value: 0 }, uCW: { value: CW }, uSize: { value: new THREE.Vector2(CW, CH) } },
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
    const ps = new THREE.Scene(); ps.add(pts);
    const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    renderer.setRenderTarget(crt);
    renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false);
    for (const t of tl) {
      mat.uniforms.uOrigin.value.set(t.x, t.y); mat.uniforms.uW.value = t.w; mat.uniforms.uRow.value = SETS.indexOf(t.set) * rows;
      geo.setDrawRange(0, t.w * t.h);
      renderer.render(ps, oc);
    }
    const buf = new Float32Array(CW * CH * 4);
    renderer.readRenderTargetPixels(crt, 0, 0, CW, CH, buf);
    if (!t2) t2 = performance.now();
    SETS.forEach((s, si) => {
      for (let id = 1; id <= nParts; id++) {
        let n = 0;
        for (let l = 0; l < LANES; l++) n += buf[(((si * rows + Math.floor(id / CW)) * LANES + l) * CW + (id % CW)) * 4];
        counts[s][id] = n;
      }
    });
    geo.dispose(); mat.dispose(); crt.dispose();
  } else {
    renderer.setRenderTarget(src);
    const px = new Uint8Array(W * H * 4);
    renderer.readRenderTargetPixels(src, 0, 0, W, H, px);
    if (!t2) t2 = performance.now();
    for (const t of tl) {
      const cnt = counts[t.set];
      for (let j = t.y; j < t.y + t.h; j++) {
        let k = (j * W + t.x) * 4;
        for (let i = 0; i < t.w; i++, k += 4) {
          if (px[k + 3] === 0) continue;
          const id = px[k] | (px[k + 1] << 8) | (px[k + 2] << 16);
          if (id > 0 && id <= nParts) cnt[id]++;
        }
      }
    }
  }
  return counts;
  };
  const counts = countIds(rt, tiles);
  const behindCounts = rt2 ? countIds(rt2, tiles.filter((t) => !t.mirror)) : undefined;
  renderer.setRenderTarget(prevTarget);
  renderer.setClearColor(prevClear, prevAlpha);
  renderer.autoClear = prevAuto;
  rt.dispose(); rt2?.dispose();
  const t3 = performance.now();
  return { counts, behind: behindCounts, poses: poses.length, ms: t3 - t0, split: { render: t1 - t0, readback: t2 - t1, decode: t3 - t2 } };
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
