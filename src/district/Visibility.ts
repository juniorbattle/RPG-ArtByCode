import * as THREE from 'three';
import { applyPose, type CamPose } from '../app/CameraRig';
import type { VisSet } from '../app/CameraGraph';

/** Visibility-driven generation.
 *
 *  Everything the district generates is tagged with a visibility part (a building wall per floor, a roof, a far
 *  house, a bridge, ...). After generation the camera graph's sampled poses (every framing over its zone, the
 *  poses along each blend, and their planar-mirror twins) are rendered as part-ID buffers on the GPU. Parts no
 *  pose ever shows are Tier 3: they are dropped from the per-frame passes (shadow casters survive only for the
 *  one-off static moon-shadow render, then their geometry is disposed). The rest is ordered per framing:
 *
 *    always  needed by C (or untracked)          drawn in every framing
 *    notC    needed by B / A but never by C      dropped while the close C framing is up
 *    onlyA   needed only by the establishing A   drawn only around A
 *
 *  Each static mesh stores its triangles in that order, so a framing is one drawRange: no extra draw calls. */

export type Tier = 0 | 1 | 2;
export interface PartMeta {
  /** what it is: a building wall / roof, a simplified far house, a bridge, a landmark, a tree */
  kind: 'wall' | 'roof' | 'forge' | 'house' | 'bridge' | 'landmark' | 'tree';
  /** authored tier: 0 gameplay / hero, 1 support, 2 atmosphere (3 = invisible is decided by the bake) */
  tier: Tier;
  /** grouping for the report (building id or background band) */
  group: string;
  /** world-facing role for building walls: front / west / east / roof / forge */
  role?: string;
  floor?: number;
}

/** draw levels: framing C draws [always], B [always, notC], A everything */
export const LEVEL: Record<'A' | 'B' | 'C', 0 | 1 | 2> = { C: 0, B: 1, A: 2 };
export const CLASS_ALWAYS = 0, CLASS_NOT_C = 1, CLASS_ONLY_A = 2, CLASS_HIDDEN = 3;

export interface VisResult {
  /** pixel counts per set, indexed by global part id */
  counts: Record<VisSet, Uint32Array>;
  poses: number;
  ms: number;
  /** time split: GPU render (submitted), readback (includes the GPU finishing), CPU decode */
  split: { render: number; readback: number; decode: number };
}

export const SETS: VisSet[] = ['A', 'AB', 'B', 'BC', 'C'];

/** class of a part from its bake counts (needA = A|AB, needB = AB|B|BC, needC = BC|C) */
export function classify(v: VisResult, id: number): number {
  if (id <= 0) return CLASS_ALWAYS;
  const c = v.counts;
  const needC = c.BC[id] + c.C[id] > 0, needB = c.AB[id] + c.B[id] + c.BC[id] > 0, needA = c.A[id] + c.AB[id] > 0;
  if (needC) return CLASS_ALWAYS;
  if (needB) return CLASS_NOT_C;
  if (needA) return CLASS_ONLY_A;
  return CLASS_HIDDEN;
}

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

export interface BakePose { set: VisSet; pose: CamPose }

/** Renders part-ID tiles for every pose (main view at 1/4 resolution, mirror view at 1/8, matching the half-res
 *  reflection), reads them back in one go and counts pixels per part and set. The FOV is widened slightly so
 *  anything grazing a frame edge between two samples is kept. */
export function bakeVisibility(renderer: THREE.WebGLRenderer, scene: THREE.Scene, nParts: number, poses: BakePose[], aspect: number, waterY: number): VisResult {
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
  }
  rt.scissorTest = false;
  rt.viewport.set(0, 0, W, H); rt.scissor.set(0, 0, W, H);
  const t1 = performance.now();
  const counts = Object.fromEntries(SETS.map((s) => [s, new Uint32Array(nParts + 1)])) as Record<VisSet, Uint32Array>;
  let t2: number;
  if (renderer.extensions.has('EXT_float_blend') && nParts < 1 << 20) {
    // GPU reduction: one point per ID pixel, additively accumulated into a (part x set) float counter target.
    // Neighbouring pixels land in different lanes (64 of them) so the blend units never serialise on one hot
    // counter; the small lane histogram is read back and summed.
    const CW = 1024, rows = Math.ceil((nParts + 1) / CW), CH = rows * SETS.length * LANES;
    const crt = new THREE.WebGLRenderTarget(CW, CH, { type: THREE.FloatType, depthBuffer: false, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, generateMipmaps: false });
    const maxPx = Math.max(...tiles.map((t) => t.w * t.h));
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(maxPx * 3), 3));
    const mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: SCATTER_VERT, fragmentShader: SCATTER_FRAG, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor, blendEquation: THREE.AddEquation,
      uniforms: { tIds: { value: rt.texture }, uOrigin: { value: new THREE.Vector2() }, uW: { value: 1 }, uRow: { value: 0 }, uCW: { value: CW }, uSize: { value: new THREE.Vector2(CW, CH) } },
    });
    const pts = new THREE.Points(geo, mat); pts.frustumCulled = false;
    const ps = new THREE.Scene(); ps.add(pts);
    const oc = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    renderer.setRenderTarget(crt);
    renderer.setClearColor(0x000000, 0); renderer.clear(true, false, false);
    for (const t of tiles) {
      mat.uniforms.uOrigin.value.set(t.x, t.y); mat.uniforms.uW.value = t.w; mat.uniforms.uRow.value = SETS.indexOf(t.set) * rows;
      geo.setDrawRange(0, t.w * t.h);
      renderer.render(ps, oc);
    }
    const buf = new Float32Array(CW * CH * 4);
    renderer.readRenderTargetPixels(crt, 0, 0, CW, CH, buf);
    t2 = performance.now();
    SETS.forEach((s, si) => {
      for (let id = 1; id <= nParts; id++) {
        let n = 0;
        for (let l = 0; l < LANES; l++) n += buf[(((si * rows + Math.floor(id / CW)) * LANES + l) * CW + (id % CW)) * 4];
        counts[s][id] = n;
      }
    });
    geo.dispose(); mat.dispose(); crt.dispose();
  } else {
    renderer.setRenderTarget(rt);
    const px = new Uint8Array(W * H * 4);
    renderer.readRenderTargetPixels(rt, 0, 0, W, H, px);
    t2 = performance.now();
    for (const t of tiles) {
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
  renderer.setRenderTarget(prevTarget);
  renderer.setClearColor(prevClear, prevAlpha);
  renderer.autoClear = prevAuto;
  rt.dispose();
  const t3 = performance.now();
  return { counts, poses: poses.length, ms: t3 - t0, split: { render: t1 - t0, readback: t2 - t1, decode: t3 - t2 } };
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
