import * as THREE from 'three';
import { U } from '../atmosphere/SceneUniforms';
import { COMMON_GLSL } from '../materials/ShaderChunks';
import { FRAME_W, FRAME_H, FOOT_Y, type Dir, type Anim } from './SpriteGenerator';
import type { SpriteAtlas } from './SpriteAtlas';
import type { LightRig, LightSource } from '../atmosphere/LightRig';
import { LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';

/** One shared pixel-art billboard per actor, rendered as 3D: depth-tested, lit by the scene's own light list,
 *  grounded by projected contact shadows. Readability rules:
 *   - nearest-texel sampling: every screen pixel shows exactly one authored texel (the sprite palette survives)
 *   - the anchor is snapped to the render-target pixel grid, so texel edges never crawl while actors / camera move
 *   - characters write a protection mask into the scene alpha; the DOF keeps them sharp while the set softens
 *   - a quiet silhouette treatment: lit-side edge lifted toward the key light, shadow-side edge cooler / darker */

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
  /** world-space facing (x, z); dir / flip are re-derived from it against the camera every frame */
  faceVec?: [number, number];
  /** flip to use if this animation only exists in the side view (e.g. the smith's hammer cycle) */
  sideFlip?: boolean;
}

const BODY_VERT = /* glsl */ `
attribute vec2 corner;
attribute vec3 iPos;
attribute vec4 iUV;
attribute vec4 iTint;
attribute float iFlip;
attribute vec4 iFx; // dof protection, key-light side (-1 screen left .. +1 right), key warmth, edge amount
uniform vec2 uWorldSize;
uniform float uFootOffset;
uniform vec3 uBillRight;
uniform vec3 uBillUp;
uniform float uClipY;
uniform float uCharScale;
uniform vec2 uResolution;
varying vec3 vWorld; varying vec3 vFeet; varying vec2 vUv; varying vec4 vTint; varying float vH; varying vec4 vFx; varying float vFlip;
void main(){
  float sc = iTint.w * uCharScale;
  vec3 wp = iPos + uBillRight * ((corner.x - 0.5) * uWorldSize.x * sc) + uBillUp * ((corner.y * uWorldSize.y - uFootOffset) * sc);
  vWorld = wp; vFeet = iPos; vTint = iTint; vH = corner.y; vFx = iFx; vFlip = iFlip;
  float cu = iFlip > 0.0 ? corner.x : 1.0 - corner.x;
  vUv = vec2(mix(iUV.x, iUV.z, cu), mix(iUV.y, iUV.w, corner.y));
  vec4 clip = projectionMatrix * viewMatrix * vec4(wp, 1.0);
  // pixel stability: shift the whole sprite so its anchor lands on a pixel corner of the render target
  // (main pass only; the half-res mirror pass is rippled anyway)
  if (uClipY < -100.0) {
    vec4 ac = projectionMatrix * viewMatrix * vec4(iPos, 1.0);
    vec2 px = (ac.xy / ac.w * 0.5 + 0.5) * uResolution;
    clip.xy += (floor(px + 0.5) - px) / uResolution * 2.0 * clip.w;
  }
  gl_Position = clip;
}
`;

const BODY_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D tAtlas;
uniform sampler2D tEmis;
uniform vec2 uAtlasSize;
uniform float uSat;
uniform float uLightChroma;
uniform float uEdge;
varying vec3 vWorld; varying vec3 vFeet; varying vec2 vUv; varying vec4 vTint; varying float vH; varying vec4 vFx; varying float vFlip;
void main(){
  // nearest texel (the old sharp-bilinear sampled texel boundaries, blending every pixel with its neighbour)
  vec2 uv = (floor(vUv * uAtlasSize) + 0.5) / uAtlasSize;
  vec4 c = texture2D(tAtlas, uv);
  if (c.a < 0.5) discard;
  float prot = 1.0 - vFx.x;
  if (vTint.r < 0.0) { gl_FragColor = vec4(applyFog(c.rgb * 1.15, vWorld), prot); return; }
  float em = texture2D(tEmis, uv).r;
  vec3 V = normalize(cameraPosition - vWorld);
  vec3 N = normalize(V + vec3(0.0, 0.45, 0.0));
  vec3 albedo = c.rgb * vTint.rgb;
  // characters sit inside the scene palette: readable value contrast, slightly muted chroma
  albedo = mix(vec3(dot(albedo, vec3(0.3, 0.55, 0.15))), albedo, uSat);
  vec3 hemi = mix(uGroundAmb, uSkyAmb, 0.7);
  float sh = moonShadow(vFeet + vec3(0.0, 0.5, 0.0), vec3(0.0, 1.0, 0.0));
  vec3 moon = uMoonCol * (0.55 + 0.25 * N.y) * sh;
  vec3 diff, spec;
  lightSum(vWorld, N, V, 1.0, 0.7, diff, spec);
  // warm lights compress harder than on walls so a hero light (the forge fire) tints a character amber instead of
  // blowing its ramps out to white
  vec3 dl = diff / (1.0 + 0.95 * diff);
  // restrained light colour: the cool ambient / moon keep only part of their blue, the lamps most of their amber;
  // the sprite's own ramps carry the hue. A small cool floor keeps silhouettes legible in the darkest pockets.
  const vec3 LUM = vec3(0.3, 0.55, 0.15);
  vec3 amb = hemi * 1.25 + moon;
  amb = mix(vec3(dot(amb, LUM)), amb, uLightChroma);
  dl = mix(vec3(dot(dl, LUM)), dl, 0.85);
  vec3 light = amb + dl + vec3(0.012, 0.016, 0.026);
  float vert = mix(0.72, 1.04, smoothstep(0.0, 0.45, vH));
  vec3 col = albedo * light * vert;
  // silhouette: edge texels (a transparent neighbour) facing the key light lift toward it, edges facing away
  // cool and darken, the crown catches a thin moon rim; reads as separation, never as a cartoon line
  vec2 tx = vec2(vFlip / uAtlasSize.x, 0.0), ty = vec2(0.0, 1.0 / uAtlasSize.y);
  float aR = step(0.5, texture2D(tAtlas, uv + tx).a), aL = step(0.5, texture2D(tAtlas, uv - tx).a), aU = step(0.5, texture2D(tAtlas, uv + ty).a);
  float side = vFx.y, amt = vFx.w * uEdge;
  float litEdge = (1.0 - (side >= 0.0 ? aR : aL)) * abs(side);
  float shdEdge = (1.0 - (side >= 0.0 ? aL : aR)) * abs(side);
  vec3 key = mix(uMoonCol * 1.6, vec3(1.0, 0.64, 0.34) * 0.9, vFx.z);
  col += key * (0.1 + 0.5 * dot(albedo, vec3(0.3, 0.55, 0.15))) * litEdge * amt;
  col += uMoonCol * 0.22 * (1.0 - aU) * amt * sh;
  col *= 1.0 - shdEdge * amt * vec3(0.3, 0.26, 0.12);
  col = col / (1.0 + 0.18 * col);
  col += albedo * em * 2.6;
  gl_FragColor = vec4(applyFog(col, vWorld), prot);
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
uniform float uCharScale;
varying vec2 vUv; varying float vAlpha; varying vec2 vLocal; varying float vBlob; varying float vFade;
void main(){
  bool blob = iShadow.z < 0.0;
  vec3 dir = vec3(iShadow.x, 0.0, iShadow.y);
  vec3 wp;
  float S = uCharScale;
  float h = (corner.y * uWorldSize.y - uFootOffset) * S;
  if (blob) {
    // contact ellipse aligned to the view: wide across the screen, shallow in depth
    vec2 q = (corner - vec2(0.5, 0.5)) * 2.0;
    vec3 fwd = vec3(-uBillRight.z, 0.0, uBillRight.x);
    wp = iPos + (uBillRight * q.x * 0.46 + fwd * q.y * 0.3) * S + vec3(0.0, 0.025, 0.0);
    vLocal = q;
  } else {
    wp = iPos + uBillRight * ((corner.x - 0.5) * uWorldSize.x * S) + dir * (max(h, 0.0) * iShadow.z) + vec3(0.0, 0.02, 0.0);
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
  // blob: soft ambient-occlusion pool plus a tight dark core right under the feet (no floating)
  if (vBlob > 0.5) { float d = length(vLocal); a = min(1.0, (smoothstep(1.0, 0.15, d) * 0.72 + smoothstep(0.42, 0.0, d) * 0.4) * vAlpha); }
  else a = texture2D(tAtlas, vUv).a > 0.5 ? vAlpha * vFade : 0.0;
  if (a < 0.01) discard;
  gl_FragColor = vec4(0.012, 0.02, 0.05, a);
}
`;

export class SpriteRenderer {
  readonly group = new THREE.Group();
  private body: THREE.Mesh;
  /** readability overlay: the characters again, after the transparent effects (halos, haze, smoke), at partial
   *  opacity and with a depth-equal test - glows in front of a character are halved, nothing shows through walls,
   *  and the DOF protection mask those additive effects erode is written back */
  private overlay: THREE.Mesh;
  overlayAmount = 0.55;
  private overlayMat: THREE.ShaderMaterial;
  private shadow: THREE.Mesh;
  private cap = 0;
  private attrs!: { pos: THREE.InstancedBufferAttribute; uv: THREE.InstancedBufferAttribute; tint: THREE.InstancedBufferAttribute; flip: THREE.InstancedBufferAttribute; fx: THREE.InstancedBufferAttribute };
  private sattrs!: { pos: THREE.InstancedBufferAttribute; uv: THREE.InstancedBufferAttribute; sh: THREE.InstancedBufferAttribute; flip: THREE.InstancedBufferAttribute };
  private bodyMat: THREE.ShaderMaterial;
  private shadowMat: THREE.ShaderMaterial;
  private readonly shared: { uWorldSize: { value: THREE.Vector2 }; uFootOffset: { value: number }; uBillRight: { value: THREE.Vector3 }; uBillUp: { value: THREE.Vector3 }; uCharScale: { value: number } };
  tilt = 0.85;
  shadowAlpha = 1;
  /** apparent character scale (driven by the camera graph: larger in the close framings) */
  charScale = 1;
  /** DOF protection per detail tier (1 = never blurred); the player and the interaction target are always 1 */
  protect = { hero: 1, mid: 1, crowd: 0.8 };

  constructor(private atlas: SpriteAtlas, capacity = 48) {
    this.shared = {
      uWorldSize: { value: new THREE.Vector2(FRAME_W * PIXEL_WORLD, FRAME_H * PIXEL_WORLD) },
      uFootOffset: { value: (FRAME_H - FOOT_Y) * PIXEL_WORLD },
      uBillRight: { value: new THREE.Vector3(1, 0, 0) },
      uBillUp: { value: new THREE.Vector3(0, 1, 0) },
      uCharScale: { value: 1 },
    };
    const shared = this.shared;
    this.bodyMat = new THREE.ShaderMaterial({
      uniforms: { ...U, ...shared, tAtlas: { value: atlas.texture }, tEmis: { value: atlas.emis }, uAtlasSize: { value: new THREE.Vector2(atlas.width, atlas.height) }, uSat: { value: 0.8 }, uLightChroma: { value: 0.62 }, uEdge: { value: 1 } },
      vertexShader: BODY_VERT, fragmentShader: BODY_FRAG, side: THREE.DoubleSide,
    });
    this.shadowMat = new THREE.ShaderMaterial({
      uniforms: { ...shared, tAtlas: { value: atlas.texture } },
      vertexShader: SHADOW_VERT, fragmentShader: SHADOW_FRAG, transparent: true, depthWrite: false, depthTest: true, side: THREE.DoubleSide,
      polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
    });
    this.overlayMat = this.bodyMat.clone();
    Object.assign(this.overlayMat, {
      uniforms: this.bodyMat.uniforms, transparent: true, depthWrite: false, depthFunc: THREE.LessEqualDepth,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation,
      blendSrc: THREE.ConstantAlphaFactor, blendDst: THREE.OneMinusConstantAlphaFactor, blendAlpha: this.overlayAmount,
      blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.ZeroFactor,
    });
    this.body = new THREE.Mesh(new THREE.BufferGeometry(), this.bodyMat);
    this.overlay = new THREE.Mesh(this.body.geometry, this.overlayMat);
    this.shadow = new THREE.Mesh(new THREE.BufferGeometry(), this.shadowMat);
    this.body.frustumCulled = false; this.shadow.frustumCulled = false; this.overlay.frustumCulled = false;
    this.shadow.layers.set(LAYER_NOREFLECT); this.shadow.renderOrder = 3;
    this.overlay.layers.set(LAYER_NOREFLECT); this.overlay.renderOrder = 8;
    this.group.add(this.body, this.shadow, this.overlay);
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
    this.attrs = { pos: mk(3), uv: mk(4), tint: mk(4), flip: mk(1), fx: mk(4) };
    g.setAttribute('iPos', this.attrs.pos); g.setAttribute('iUV', this.attrs.uv); g.setAttribute('iTint', this.attrs.tint); g.setAttribute('iFlip', this.attrs.flip); g.setAttribute('iFx', this.attrs.fx);
    this.body.geometry.dispose(); this.body.geometry = g; this.overlay.geometry = g;
    const sg = mkGeo(0);
    const sn = n * 5;
    const mk2 = (size: number) => { const a = new THREE.InstancedBufferAttribute(new Float32Array(sn * size), size); a.setUsage(THREE.DynamicDrawUsage); return a; };
    this.sattrs = { pos: mk2(3), uv: mk2(4), sh: mk2(4), flip: mk2(1) };
    sg.setAttribute('iPos', this.sattrs.pos); sg.setAttribute('iUV', this.sattrs.uv); sg.setAttribute('iShadow', this.sattrs.sh); sg.setAttribute('iFlip', this.sattrs.flip);
    this.shadow.geometry.dispose(); this.shadow.geometry = sg;
  }

  update(actors: Actor[], lights: LightRig, camera: THREE.Camera, moonDir: THREE.Vector3, target: Actor | null = null, player: Actor | null = null): void {
    if (actors.length * 2 > this.cap) this.alloc(Math.max(this.cap * 2, actors.length * 2));
    // billboard basis from the main camera (also used when rendering the planar reflection)
    const m = camera.matrixWorldInverse.elements;
    const right = new THREE.Vector3(m[0], m[4], m[8]); right.y = 0; right.normalize();
    const camUp = new THREE.Vector3(m[1], m[5], m[9]);
    const up = new THREE.Vector3(0, 1, 0).lerp(camUp, this.tilt).normalize();
    this.shared.uBillRight.value.copy(right); this.shared.uBillUp.value.copy(up);
    this.shared.uCharScale.value = this.charScale;
    this.overlayMat.blendAlpha = this.overlayAmount; this.overlay.visible = this.overlayAmount > 0.01;
    const S = this.charScale;

    let bi = 0, si = 0;
    const a = this.attrs, s = this.sattrs;
    const putShadow = (act: Actor, fr: { u0: number; v0: number; u1: number; v1: number }, flip: boolean, dx: number, dz: number, len: number, alpha: number) => {
      if (alpha < 0.01) return;
      s.pos.setXYZ(si, act.pos.x, act.pos.y, act.pos.z);
      s.uv.setXYZW(si, fr.u0, fr.v0, fr.u1, fr.v1);
      s.sh.setXYZW(si, dx, dz, len, alpha * this.shadowAlpha);
      s.flip.setX(si, flip ? -1 : 1);
      si++;
    };
    const mh = Math.hypot(moonDir.x, moonDir.z) || 1;
    const moonSide = (moonDir.x * right.x + moonDir.z * right.z) / mh;
    for (const act of actors) {
      if (act.hidden) continue;
      // some cycles exist only in the side view (the smith's hammer) or not at all for an archetype: fall back
      // instead of silently dropping the character
      let fr = this.atlas.frame(act.spec, act.dir, act.anim, frameIndex(this.atlas, act)), flip = act.flip;
      if (!fr) { fr = this.atlas.frame(act.spec, 'side', act.anim, frameIndex(this.atlas, act)); flip = !!act.sideFlip; }
      if (!fr) { fr = this.atlas.frame(act.spec, act.dir, 'idle', 0); flip = act.flip; }
      if (!fr) continue;
      // shadow budget: contact blob + the two strongest warm lights + moon
      const cand: Array<{ l: LightSource; w: number }> = [];
      for (const l of lights.sources) {
        if (l.scale < 0.05) continue;
        const dx = act.pos.x - l.pos.x, dz = act.pos.z - l.pos.z;
        const d2 = dx * dx + dz * dz + (l.pos.y - 1) * (l.pos.y - 1);
        if (d2 > l.radius * l.radius) continue;
        cand.push({ l, w: (l.intensity * l.level * l.scale) / (1 + d2 * 0.25) });
      }
      cand.sort((p, q) => q.w - p.w);
      // silhouette key: the strongest warm light when one is close, otherwise the moon
      let side = moonSide * 0.8, warm = 0, edge = 0.55;
      if (cand.length && cand[0].w > 0.25) {
        const l = cand[0].l, hx = l.pos.x - act.pos.x, hz = l.pos.z - act.pos.z, hd = Math.hypot(hx, hz) || 1;
        side = THREE.MathUtils.clamp(((hx * right.x + hz * right.z) / hd) * 1.25, -1, 1);
        warm = Math.min(1, cand[0].w * 0.7);
        edge = Math.min(1, 0.55 + cand[0].w * 0.3);
      }
      const prot = act === player || act === target ? 1 : this.protect[act.detail];
      a.pos.setXYZ(bi, act.pos.x, act.pos.y + 0.01, act.pos.z);
      a.uv.setXYZW(bi, fr.u0, fr.v0, fr.u1, fr.v1);
      a.tint.setXYZW(bi, act.tint[0], act.tint[1], act.tint[2], act.scale);
      a.flip.setX(bi, flip ? -1 : 1);
      a.fx.setXYZW(bi, prot, side, warm, edge);
      bi++;
      s.pos.setXYZ(si, act.pos.x, act.pos.y, act.pos.z); s.uv.setXYZW(si, fr.u0, fr.v0, fr.u1, fr.v1); s.sh.setXYZW(si, 0, 0, -1, 0.85 * this.shadowAlpha); s.flip.setX(si, 1); si++;
      for (let k = 0; k < Math.min(2, cand.length); k++) {
        const l = cand[k].l;
        let dx = act.pos.x - l.pos.x, dz = act.pos.z - l.pos.z;
        const hd = Math.hypot(dx, dz) || 0.001;
        dx /= hd; dz /= hd;
        const lh = Math.max(l.pos.y, 1.9);
        const len = Math.min(2.6, (act.height * hd) / Math.max(0.6, lh - act.height * 0.9));
        putShadow(act, fr, flip, dx, dz, Math.max(0.35, len) / (act.height + 0.001) * 1.0, Math.min(0.6, cand[k].w * 0.32 + 0.1));
      }
      putShadow(act, fr, flip, -moonDir.x / mh, -moonDir.z / mh, (mh / Math.max(0.2, moonDir.y)) * 1.0, 0.16);
      if (act.bubble) {
        const bf = this.atlas.frames.get(`fx/bubble/${act.bubble}`);
        if (bf) {
          const bob = Math.sin(performance.now() * 0.004) * 0.04;
          a.pos.setXYZ(bi, act.pos.x, act.pos.y + act.height * S - 0.05 + bob, act.pos.z);
          a.uv.setXYZW(bi, bf.u0, bf.v0, bf.u1, bf.v1); a.tint.setXYZW(bi, -1, -1, -1, 0.9); a.flip.setX(bi, 1); a.fx.setXYZW(bi, 1, 0, 0, 0); bi++;
        }
      }
    }
    a.pos.needsUpdate = a.uv.needsUpdate = a.tint.needsUpdate = a.flip.needsUpdate = a.fx.needsUpdate = true;
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
