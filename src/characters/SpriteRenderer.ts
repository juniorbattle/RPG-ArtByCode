import * as THREE from 'three';
import { U } from '../atmosphere/SceneUniforms';
import { COMMON_GLSL } from '../materials/ShaderChunks';
import { FRAME_W, FRAME_H, FOOT_Y, type Dir, type Anim } from './SpriteGenerator';
import type { SpriteAtlas } from './SpriteAtlas';
import type { LightRig, LightSource } from '../atmosphere/LightRig';
import { LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';

/** One shared pixel-art billboard per actor, rendered as 3D: depth-tested, lit by the scene's own light list,
 *  grounded by projected contact shadows and sharp-bilinear sampled so pixels stay crisp at any zoom. */

export const PIXEL_WORLD = 0.047; // metres per sprite pixel

export interface Actor {
  id: number;
  spec: string;
  role: string;
  detail: 'hero' | 'mid' | 'crowd';
  pos: THREE.Vector3;
  facing: Dir | 'left' | 'right';
  dir: Dir;
  flip: boolean;
  anim: Anim;
  t: number;
  speed: number;
  tint: [number, number, number];
  bubble?: 'dots' | 'exclaim' | null;
  scale: number;
  height: number;
  radius: number;
  hidden?: boolean;
  behaviour?: { kind: 'idle' | 'patrol' | 'wander' | 'work' | 'player'; waypoints?: THREE.Vector3[]; wait?: number; idx?: number; target?: THREE.Vector3 | null; seed: number };
}

const BODY_VERT = /* glsl */ `
attribute vec2 corner;
attribute vec3 iPos;
attribute vec4 iUV;
attribute vec4 iTint;
attribute float iFlip;
uniform vec2 uWorldSize;
uniform float uFootOffset;
uniform vec3 uBillRight;
uniform vec3 uBillUp;
uniform float uClipY;
varying vec3 vWorld; varying vec3 vFeet; varying vec2 vUv; varying vec4 vTint; varying float vH;
void main(){
  vec3 wp = iPos + uBillRight * ((corner.x - 0.5) * uWorldSize.x * iTint.w) + uBillUp * ((corner.y * uWorldSize.y - uFootOffset) * iTint.w);
  vWorld = wp; vFeet = iPos; vTint = iTint; vH = corner.y;
  float cu = iFlip > 0.0 ? corner.x : 1.0 - corner.x;
  vUv = vec2(mix(iUV.x, iUV.z, cu), mix(iUV.y, iUV.w, corner.y));
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
`;

const BODY_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D tAtlas;
uniform sampler2D tEmis;
uniform vec2 uAtlasSize;
varying vec3 vWorld; varying vec3 vFeet; varying vec2 vUv; varying vec4 vTint; varying float vH;
// keeps texels square and edges crisp under perspective, without shimmering
vec2 sharpUV(vec2 uv){
  vec2 tc = uv * uAtlasSize;
  vec2 fw = max(fwidth(tc), vec2(1e-4));
  vec2 f = fract(tc);
  vec2 region = clamp(0.5 - 0.5 * fw, 0.0, 0.5);
  vec2 amt = clamp((f - 0.5) / max(fw, vec2(1e-4)) + 0.5, 0.0, 1.0);
  amt = mix(vec2(0.5), amt, step(vec2(1e-3), region));
  return (floor(tc) + amt) / uAtlasSize;
}
void main(){
  if (uClipY > -100.0 && vWorld.y < uClipY - 0.02) discard;
  vec2 uv = sharpUV(vUv);
  vec4 c = texture2D(tAtlas, uv);
  if (c.a < 0.5) discard;
  float em = texture2D(tEmis, uv).r;
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 N = normalize(V + vec3(0.0, 0.45, 0.0));
  if (vTint.r < 0.0) { gl_FragColor = vec4(applyFog(c.rgb * 1.15, vWorld), 1.0); return; }
  vec3 albedo = c.rgb * vTint.rgb;
  vec3 hemi = mix(uGroundAmb, uSkyAmb, 0.7);
  float sh = moonShadow(vFeet + vec3(0.0, 0.5, 0.0), vec3(0.0, 1.0, 0.0));
  vec3 moon = uMoonCol * (0.55 + 0.25 * N.y) * sh;
  vec3 diff, spec;
  lightSum(vWorld + vec3(0.0, 0.0, 0.0), N, V, 1.0, 0.7, diff, spec);
  float vert = mix(0.72, 1.04, smoothstep(0.0, 0.45, vH));
  vec3 dl = diff * 1.0; dl = dl / (1.0 + 0.7 * dl);
  vec3 col = albedo * (hemi * 1.25 + moon + dl) * vert;
  col = col / (1.0 + 0.18 * col);
  col += albedo * em * 2.6;
  gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
}
`;

const SHADOW_VERT = /* glsl */ `
attribute vec2 corner;
attribute vec3 iPos;
attribute vec4 iUV;
attribute vec4 iShadow; // dir.x, dir.z, length(m), alpha
attribute float iFlip;
uniform vec2 uWorldSize;
uniform float uFootOffset;
uniform vec3 uBillRight;
varying vec2 vUv; varying float vAlpha; varying vec2 vLocal; varying float vBlob; varying float vFade;
void main(){
  bool blob = iShadow.z < 0.0;
  vec3 dir = vec3(iShadow.x, 0.0, iShadow.y);
  vec3 wp;
  float h = corner.y * uWorldSize.y - uFootOffset;
  if (blob) {
    vec2 q = (corner - vec2(0.5, 0.5)) * 2.0;
    wp = iPos + vec3(q.x * 0.5, 0.0, q.y * 0.34) + vec3(0.0, 0.025, 0.0);
    vLocal = q;
  } else {
    wp = iPos + uBillRight * ((corner.x - 0.5) * uWorldSize.x) + dir * (max(h, 0.0) * iShadow.z) + vec3(0.0, 0.02, 0.0);
    vLocal = vec2(0.0);
  }
  float cu = iFlip > 0.0 ? corner.x : 1.0 - corner.x;
  vUv = vec2(mix(iUV.x, iUV.z, cu), mix(iUV.y, iUV.w, corner.y));
  vAlpha = iShadow.w; vBlob = blob ? 1.0 : 0.0; vFade = 1.0 - corner.y * 0.7;
  gl_Position = projectionMatrix * viewMatrix * vec4(wp, 1.0);
}
`;
const SHADOW_FRAG = /* glsl */ `
uniform sampler2D tAtlas;
varying vec2 vUv; varying float vAlpha; varying vec2 vLocal; varying float vBlob; varying float vFade;
void main(){
  float a;
  if (vBlob > 0.5) { float d = length(vLocal); a = smoothstep(1.0, 0.1, d) * vAlpha; }
  else a = texture2D(tAtlas, vUv).a > 0.5 ? vAlpha * vFade : 0.0;
  if (a < 0.01) discard;
  gl_FragColor = vec4(0.012, 0.02, 0.05, a);
}
`;

export class SpriteRenderer {
  readonly group = new THREE.Group();
  private body: THREE.Mesh;
  private shadow: THREE.Mesh;
  private cap = 0;
  private attrs!: { pos: THREE.InstancedBufferAttribute; uv: THREE.InstancedBufferAttribute; tint: THREE.InstancedBufferAttribute; flip: THREE.InstancedBufferAttribute };
  private sattrs!: { pos: THREE.InstancedBufferAttribute; uv: THREE.InstancedBufferAttribute; sh: THREE.InstancedBufferAttribute; flip: THREE.InstancedBufferAttribute };
  private bodyMat: THREE.ShaderMaterial;
  private shadowMat: THREE.ShaderMaterial;
  tilt = 0.85;
  shadowAlpha = 1;

  constructor(private atlas: SpriteAtlas, capacity = 48) {
    const shared = {
      uWorldSize: { value: new THREE.Vector2(FRAME_W * PIXEL_WORLD, FRAME_H * PIXEL_WORLD) },
      uFootOffset: { value: (FRAME_H - FOOT_Y) * PIXEL_WORLD },
      uBillRight: { value: new THREE.Vector3(1, 0, 0) },
      uBillUp: { value: new THREE.Vector3(0, 1, 0) },
    };
    this.bodyMat = new THREE.ShaderMaterial({
      uniforms: { ...U, ...shared, tAtlas: { value: atlas.texture }, tEmis: { value: atlas.emis }, uAtlasSize: { value: new THREE.Vector2(atlas.width, atlas.height) } },
      vertexShader: BODY_VERT, fragmentShader: BODY_FRAG, side: THREE.DoubleSide,
    });
    this.shadowMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, tAtlas: { value: atlas.texture } },
      vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    });
    this.body = new THREE.Mesh(new THREE.BufferGeometry(), this.bodyMat);
    this.shadow = new THREE.Mesh(new THREE.BufferGeometry(), this.shadowMat);
    this.body.frustumCulled = false; this.shadow.frustumCulled = false;
    this.shadow.layers.set(LAYER_NOREFLECT); this.shadow.renderOrder = 3;
    this.group.add(this.body, this.shadow);
    this.alloc(capacity);
  }

  private alloc(n: number): void {
    this.cap = n;
    const quad = new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]);
    const mkGeo = (inst: number) => {
      const g = new THREE.InstancedBufferGeometry();
      g.setAttribute('corner', new THREE.BufferAttribute(quad, 2));
      g.setIndex([0, 1, 2, 0, 2, 3]);
      g.instanceCount = inst;
      return g;
    };
    const g = mkGeo(0);
    const mk = (size: number) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(n * size), size); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.attrs = { pos: mk(3), uv: mk(4), tint: mk(4), flip: mk(1) };
    g.setAttribute('iPos', this.attrs.pos); g.setAttribute('iUV', this.attrs.uv); g.setAttribute('iTint', this.attrs.tint); g.setAttribute('iFlip', this.attrs.flip);
    this.body.geometry.dispose(); this.body.geometry = g;
    const sg = mkGeo(0);
    const sn = n * 5;
    const mk2 = (size: number) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(sn * size), size); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.sattrs = { pos: mk2(3), uv: mk2(4), sh: mk2(4), flip: mk2(1) };
    sg.setAttribute('iPos', this.sattrs.pos); sg.setAttribute('iUV', this.sattrs.uv); sg.setAttribute('iShadow', this.sattrs.sh); sg.setAttribute('iFlip', this.sattrs.flip);
    this.shadow.geometry.dispose(); this.shadow.geometry = sg;
  }

  update(actors: Actor[], lights: LightRig, camera: THREE.Camera, moonDir: THREE.Vector3): void {
    if (actors.length * 2 > this.cap) this.alloc(Math.max(this.cap * 2, actors.length * 2));
    // billboard basis from the main camera (also used when rendering the planar reflection)
    const m = camera.matrixWorldInverse.elements;
    const right = new THREE.Vector3(m[0], m[4], m[8]); right.y = 0; right.normalize();
    const camUp = new THREE.Vector3(m[1], m[5], m[9]);
    const up = new THREE.Vector3(0, 1, 0).lerp(camUp, this.tilt).normalize();
    this.bodyMat.uniforms.uBillRight.value.copy(right); this.bodyMat.uniforms.uBillUp.value.copy(up);
    this.shadowMat.uniforms.uBillRight.value.copy(right);

    let bi = 0, si = 0;
    const a = this.attrs, s = this.sattrs;
    const putShadow = (act: Actor, fr: { u0: number; v0: number; u1: number; v1: number }, dx: number, dz: number, len: number, alpha: number) => {
      if (alpha < 0.01) return;
      s.pos.setXYZ(si, act.pos.x, act.pos.y, act.pos.z);
      s.uv.setXYZW(si, fr.u0, fr.v0, fr.u1, fr.v1);
      s.sh.setXYZW(si, dx, dz, len, alpha * this.shadowAlpha);
      s.flip.setX(si, act.flip ? -1 : 1);
      si++;
    };
    for (const act of actors) {
      if (act.hidden) continue;
      const fr = this.atlas.frame(act.spec, act.dir, act.anim, frameIndex(this.atlas, act));
      if (!fr) continue;
      a.pos.setXYZ(bi, act.pos.x, act.pos.y + 0.01, act.pos.z);
      a.uv.setXYZW(bi, fr.u0, fr.v0, fr.u1, fr.v1);
      a.tint.setXYZW(bi, act.tint[0], act.tint[1], act.tint[2], act.scale);
      a.flip.setX(bi, act.flip ? -1 : 1);
      bi++;
      // shadow budget: contact blob + the two strongest warm lights + moon
      const blobFr = fr;
      s.pos.setXYZ(si, act.pos.x, act.pos.y, act.pos.z); s.uv.setXYZW(si, blobFr.u0, blobFr.v0, blobFr.u1, blobFr.v1); s.sh.setXYZW(si, 0, 0, -1, 0.85 * this.shadowAlpha); s.flip.setX(si, 1); si++;
      const cand: Array<{ l: LightSource; w: number }> = [];
      for (const l of lights.sources) {
        if (l.scale < 0.05) continue;
        const dx = act.pos.x - l.pos.x, dz = act.pos.z - l.pos.z;
        const d2 = dx * dx + dz * dz + (l.pos.y - 1) * (l.pos.y - 1);
        if (d2 > l.radius * l.radius) continue;
        cand.push({ l, w: (l.intensity * l.level * l.scale) / (1 + d2 * 0.25) });
      }
      cand.sort((p, q) => q.w - p.w);
      for (let k = 0; k < Math.min(2, cand.length); k++) {
        const l = cand[k].l;
        let dx = act.pos.x - l.pos.x, dz = act.pos.z - l.pos.z;
        const hd = Math.hypot(dx, dz) || 0.001;
        dx /= hd; dz /= hd;
        const lh = Math.max(l.pos.y, 1.9);
        const len = Math.min(2.6, (act.height * hd) / Math.max(0.6, lh - act.height * 0.9));
        putShadow(act, fr, dx, dz, Math.max(0.35, len) / (act.height + 0.001) * 1.0, Math.min(0.6, cand[k].w * 0.32 + 0.1));
      }
      const mh = Math.hypot(moonDir.x, moonDir.z) || 1;
      putShadow(act, fr, -moonDir.x / mh, -moonDir.z / mh, (mh / Math.max(0.2, moonDir.y)) * 1.0, 0.16);
      if (act.bubble) {
        const bf = this.atlas.frames.get(`fx/bubble/${act.bubble}`);
        if (bf) {
          const bob = Math.sin(performance.now() * 0.004) * 0.04;
          a.pos.setXYZ(bi, act.pos.x, act.pos.y + act.height - 0.05 + bob, act.pos.z);
          a.uv.setXYZW(bi, bf.u0, bf.v0, bf.u1, bf.v1); a.tint.setXYZW(bi, -1, -1, -1, 0.9); a.flip.setX(bi, 1); bi++;
        }
      }
    }
    a.pos.needsUpdate = a.uv.needsUpdate = a.tint.needsUpdate = a.flip.needsUpdate = true;
    s.pos.needsUpdate = s.uv.needsUpdate = s.sh.needsUpdate = s.flip.needsUpdate = true;
    (this.body.geometry as THREE.InstancedBufferGeometry).instanceCount = bi;
    (this.shadow.geometry as THREE.InstancedBufferGeometry).instanceCount = si;
  }
}

export function frameIndex(atlas: SpriteAtlas, act: Actor): number {
  const n = atlas.counts.get(`${act.spec}/${act.anim}`) ?? 1;
  const rate = act.anim === 'walk' || act.anim === 'carry' ? 7.5 : act.anim === 'hammer' ? 5.5 : act.anim === 'talk' ? 4 : 1.7;
  return Math.floor(act.t * rate) % n;
}
