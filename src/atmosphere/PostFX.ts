import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';
import { U, MAX_LIGHTS, maskSafeBlending } from './SceneUniforms';
import type { GpuTimer } from '../debug/GpuTimer';

export interface PostParams {
  exposure: number;
  bloomStrength: number; bloomRadius: number; bloomThreshold: number;
  dofStrength: number; dofFocus: number; dofRange: number; dofMaxBlur: number; dofFar: number;
  /** the near blur's share (1: the town's; the squares' near edge, journal Passe VP7) */
  dofNear: number;
  tiltStrength: number; tiltCenter: number; tiltWidth: number;
  vignette: number; grain: number; saturation: number; contrast: number;
  shadowTint: THREE.Color; highlightTint: THREE.Color;
  /** analytic in-scatter of the key lights through the fog (soft volumetric read) */
  airlight: number;
  /** palette discipline: compresses chroma outside the indigo / amber families */
  palette: number;
  renderScale: number;
  msaa: number;
}

export const defaultPost = (): PostParams => ({
  exposure: 1.2,
  bloomStrength: 0.3, bloomRadius: 0.55, bloomThreshold: 1.15,
  dofStrength: 0.9, dofFocus: 20, dofRange: 16, dofMaxBlur: 7.5, dofFar: 0.22, dofNear: 1,
  tiltStrength: 0, tiltCenter: 0.5, tiltWidth: 0.3,
  vignette: 0.34, grain: 0.01, saturation: 0.96, contrast: 1.06,
  shadowTint: new THREE.Color(0.92, 0.98, 1.22), highlightTint: new THREE.Color(1.07, 1.0, 0.9),
  airlight: 1, palette: 0.85,
  renderScale: 1, msaa: 4,
});

const VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const DOF_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uTexel;
uniform float uNear, uFar;
uniform float uFocus, uRange, uMaxBlur, uStrength, uFarAmt, uNearAmt;
uniform float uTilt, uTiltCenter, uTiltWidth;
varying vec2 vUv;
float viewZ(float d){ float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
float coc(vec2 uv, float vz){
  float dz = vz - uFocus;
  float dofC = dz < 0.0 ? smoothstep(0.0, uRange * 0.9, -dz) * uNearAmt : smoothstep(0.0, uRange * 3.0, dz) * uFarAmt;
  float t = abs(uv.y - uTiltCenter);
  float tiltC = smoothstep(uTiltWidth, uTiltWidth + 0.36, t);
  return clamp(max(dofC, tiltC * uTilt), 0.0, 1.0) * uStrength;
}
void main(){
  // scene alpha is a protection mask: gameplay characters write (1 - protection), everything else 1. Their
  // circle of confusion shrinks accordingly, so the set softens while the characters stay readable.
  vec4 base = texture2D(tColor, vUv);
  float d0 = texture2D(tDepth, vUv).x;
  float z0 = viewZ(d0);
  float c0 = coc(vUv, z0) * base.a;
  float rad = c0 * uMaxBlur;
  // the mask goes on (alpha) for the grade's in-scatter protection, sharp at full resolution
  if (rad < 0.35) { gl_FragColor = base; return; }
  vec3 acc = base.rgb; float wsum = 1.0;
  const int N = 26;
  for (int i = 0; i < N; i++) {
    float fi = float(i) + 0.5;
    float r = sqrt(fi / float(N));
    float a = fi * 2.3999632;
    vec2 off = vec2(cos(a), sin(a)) * r;
    vec2 suv = vUv + off * rad * uTexel;
    float zs = viewZ(texture2D(tDepth, suv).x);
    vec4 sc = texture2D(tColor, suv);
    float rs = coc(suv, zs) * uMaxBlur * sc.a;
    float dist = r * rad;
    float reach = smoothstep(dist - 1.2, dist + 0.6, rs);
    // background samples must not smear over a nearer, sharper centre pixel
    float behind = zs > z0 + 1.5 ? smoothstep(0.0, 1.0, c0 * 2.0) : 1.0;
    vec3 col = sc.rgb;
    float lum = dot(col, vec3(0.3, 0.55, 0.15));
    float w = reach * behind * (1.0 + smoothstep(1.2, 5.0, lum) * 1.6);
    acc += col * w; wsum += w;
  }
  gl_FragColor = vec4(acc / wsum, base.a);
}
`;

/** Closed-form single scattering of point lights along each view ray, clipped at the depth buffer:
 *  lantern glows sit *in* the haze and are occluded by whatever stands in front of them. Half resolution: a texel stands for ONE full
 *  resolution pixel (the one nearest filtering picked before), whose depth it integrates to and whose class it stores in alpha (0 = a
 *  character: protection mask < 1, 1 = the set). The grade upsamples from the texels of the pixel's own class and applies the characters'
 *  share of the haze at full resolution: read here or interpolated across a silhouette, the half-resolution mask and depth smeared a band
 *  around every character (journal Passe S1). */
const AIR_FRAG = /* glsl */ `
precision highp float;
#define MAX_LIGHTS ${MAX_LIGHTS}
uniform sampler2D tDepth;
uniform sampler2D tColor;
uniform mat4 uInvProj;
uniform mat4 uCamWorld;
uniform vec3 uCamPos;
uniform vec4 uLightPos[MAX_LIGHTS];
uniform vec4 uLightCol[MAX_LIGHTS];
uniform int uLightCount;
uniform float uScatter;
varying vec2 vUv;
void main(){
  float d = texture2D(tDepth, vUv).x;
  // the class of the pixel that depth came from: of the 2 x 2 pixels around this texel's centre, the one holding exactly that depth
  // (texelFetch at floor(uv * size) is not always the pixel nearest filtering picks: the set's depth, so its image, would change)
  ivec2 b = ivec2(floor(vUv * vec2(textureSize(tDepth, 0)) - 0.5));
  float cls = 1.0;
  for (int k = 0; k < 4; k++) {
    ivec2 q = b + ivec2(k & 1, k >> 1);
    if (texelFetch(tDepth, q, 0).x == d) { cls = texelFetch(tColor, q, 0).a < 0.999 ? 0.0 : 1.0; break; }
  }
  vec4 vp = uInvProj * vec4(vUv * 2.0 - 1.0, d * 2.0 - 1.0, 1.0);
  vp /= vp.w;
  vec3 wp = (uCamWorld * vec4(vp.xyz, 1.0)).xyz;
  vec3 rd = wp - uCamPos;
  float L = min(length(rd), 400.0);
  rd = normalize(rd);
  vec3 sum = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    if (i >= uLightCount) break;
    vec4 lp = uLightPos[i];
    vec3 v = lp.xyz - uCamPos;
    float t0 = dot(v, rd);
    vec3 perp = v - rd * t0;
    float h2 = dot(perp, perp);
    float r2 = lp.w * lp.w;
    float hh = sqrt(h2 + 0.05 + r2 * 0.002);
    float I = (atan((L - t0) / hh) - atan(-t0 / hh)) / hh;
    sum += uLightCol[i].rgb * I * exp(-h2 / (r2 * 0.3));
  }
  gl_FragColor = vec4(sum * uScatter, cls);
}
`;

const GRADE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tColor;
uniform sampler2D tAir;
uniform vec2 uAirSize;
uniform float uAir;
uniform float uExposure, uVignette, uGrain, uSat, uContrast, uTime, uPalette;
uniform vec3 uShadowTint, uHighTint;
varying vec2 vUv;
vec3 aces(vec3 x){ const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14; return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
// the in-scatter at this pixel from the half-resolution texels of its own class (alpha: 0 = character, 1 = set); the hardware bilinear
// when all four texels are of that class (always, away from characters: the set's image is the plain bilinear upsample)
vec3 airAt(vec2 uv, bool character) {
  vec4 h = texture2D(tAir, uv);
  if (character ? h.a < 0.001 : h.a > 0.999) return h.rgb;
  vec2 t = uv * uAirSize - 0.5, f = fract(t);
  ivec2 i0 = ivec2(floor(t)), hi = ivec2(uAirSize) - 1;
  vec3 acc = vec3(0.0); float ws = 0.0;
  for (int k = 0; k < 4; k++) {
    ivec2 o = ivec2(k & 1, k >> 1);
    vec4 s = texelFetch(tAir, clamp(i0 + o, ivec2(0), hi), 0);
    float w = (o.x == 1 ? f.x : 1.0 - f.x) * (o.y == 1 ? f.y : 1.0 - f.y) * ((s.a < 0.5) == character ? 1.0 : 0.0);
    acc += s.rgb * w; ws += w;
  }
  return ws > 1e-4 ? acc / ws : h.rgb;
}
void main(){
  // characters (scene alpha < 1: the protection mask, carried by the DOF) keep part of their contrast inside a hot haze such as the forge's
  vec4 src = texture2D(tColor, vUv);
  float keep = mix(0.45, 1.0, clamp(src.a, 0.0, 1.0));
  vec3 c = (src.rgb + airAt(vUv, src.a < 0.999) * uAir * keep) * uExposure;
  vec3 t = aces(c);
  float l = dot(t, vec3(0.2126, 0.7152, 0.0722));
  // palette discipline in an opponent space: amber keeps its red/green split, cool colours lose theirs
  // (no purple or teal casts), greens are always compressed. Luminance is preserved.
  float O1 = t.r - t.g, O2 = 0.5 * (t.r + t.g) - t.b;
  float warm = O2 > 0.0 ? smoothstep(0.0, 0.06, O2) : 0.0;
  float O1c = O1 > 0.0 ? O1 * mix(0.35, 1.0, warm) : O1 * 0.3;
  O1 = mix(O1, O1c, uPalette);
  float g = l - 0.2487 * O1 + 0.0722 * O2;
  t = max(vec3(g + O1, g, g + 0.5 * O1 - O2), 0.0);
  // split toning: cool shadows, warm highlights
  vec3 tint = mix(uShadowTint, uHighTint, smoothstep(0.08, 0.75, l));
  t *= tint;
  t = mix(vec3(l), t, uSat);
  t = (t - 0.5) * uContrast + 0.5;
  t = max(t, 0.0);
  // lifted night blacks with an indigo bias (never pure black)
  t += vec3(0.005, 0.008, 0.017) * (1.0 - l);
  vec2 q = vUv - 0.5; q.x *= 1.15;
  float v = smoothstep(0.35, 0.95, length(q));
  t *= 1.0 - v * uVignette;
  vec3 s = toSRGB(t);
  float n = h21(gl_FragCoord.xy + fract(uTime) * 91.7) + h21(gl_FragCoord.yx * 1.37 + fract(uTime * 1.3) * 47.1) - 1.0;
  s += n * (uGrain + 1.0 / 255.0);
  gl_FragColor = vec4(s, 1.0);
}
`;

export class PostFX {
  readonly params = defaultPost();
  sceneRT!: THREE.WebGLRenderTarget;
  private dofRT!: THREE.WebGLRenderTarget;
  private airRT!: THREE.WebGLRenderTarget;
  private bloom!: UnrealBloomPass;
  private quad = new FullScreenQuad();
  private dofMat: THREE.ShaderMaterial;
  private airMat: THREE.ShaderMaterial;
  private gradeMat: THREE.ShaderMaterial;
  private black = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1);
  width = 1; height = 1;
  dofEnabled = true; bloomEnabled = true; airEnabled = true;
  /** focus follows the player (set by the app every frame) */
  autoFocus = true;

  constructor(private renderer: THREE.WebGLRenderer) {
    this.black.needsUpdate = true;
    this.dofMat = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: null }, tDepth: { value: null }, uTexel: { value: new THREE.Vector2() }, uNear: { value: 1 }, uFar: { value: 100 },
        uFocus: { value: 44 }, uRange: { value: 14 }, uMaxBlur: { value: 7 }, uStrength: { value: 1 }, uFarAmt: { value: 0.3 }, uNearAmt: { value: 1 }, uTilt: { value: 1 }, uTiltCenter: { value: 0.5 }, uTiltWidth: { value: 0.2 },
      },
      vertexShader: VERT, fragmentShader: DOF_FRAG, depthTest: false, depthWrite: false,
    });
    this.airMat = new THREE.ShaderMaterial({
      uniforms: {
        tDepth: { value: null }, tColor: { value: null }, uInvProj: { value: new THREE.Matrix4() }, uCamWorld: { value: new THREE.Matrix4() }, uCamPos: { value: new THREE.Vector3() },
        uLightPos: U.uLightPos, uLightCol: U.uLightCol, uLightCount: U.uLightCount, uScatter: { value: 0.01 },
      },
      vertexShader: VERT, fragmentShader: AIR_FRAG, depthTest: false, depthWrite: false,
    });
    this.gradeMat = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: null }, tAir: { value: this.black }, uAirSize: { value: new THREE.Vector2(1, 1) }, uAir: { value: 1 }, uExposure: { value: 1 }, uVignette: { value: 0.3 }, uGrain: { value: 0.01 }, uSat: { value: 1 }, uContrast: { value: 1 }, uTime: { value: 0 }, uPalette: { value: 0 },
        uShadowTint: { value: new THREE.Vector3(1, 1, 1) }, uHighTint: { value: new THREE.Vector3(1, 1, 1) },
      },
      vertexShader: VERT, fragmentShader: GRADE_FRAG, depthTest: false, depthWrite: false,
    });
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.7, 0.9);
    this.bloom.renderToScreen = false;
    // the bloom is added into the HDR buffer the grade reads, protection mask (alpha) included: keep that alpha (its blend material is
    // premultiplied additive: colour ONE, ONE as before; three added the bloom's max channel to the alpha)
    Object.assign(this.bloom.blendMaterial, maskSafeBlending('additive', true));
  }

  setSize(cssW: number, cssH: number, pixelRatio: number): void {
    const s = this.params.renderScale;
    const w = Math.max(2, Math.round(cssW * pixelRatio * s)), h = Math.max(2, Math.round(cssH * pixelRatio * s));
    this.width = w; this.height = h;
    this.sceneRT?.dispose(); this.dofRT?.dispose(); this.airRT?.dispose();
    const depth = new THREE.DepthTexture(w, h);
    depth.type = THREE.UnsignedIntType;
    this.sceneRT = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: this.params.msaa, depthBuffer: true, depthTexture: depth, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.dofRT = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.airRT = new THREE.WebGLRenderTarget(Math.max(2, w >> 1), Math.max(2, h >> 1), { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.bloom.setSize(w, h);
    this.dofMat.uniforms.uTexel.value.set(1 / w, 1 / h);
    this.renderer.setPixelRatio(pixelRatio * s);
    this.renderer.setSize(cssW, cssH, false);
  }

  textureBytes(): number {
    const px = this.width * this.height;
    const msaa = this.sceneRT ? this.sceneRT.samples || 1 : 1;
    const bloom = px * 8 * 0.5 * 2.2; // half-res mip chain, horizontal + vertical
    return px * 8 * msaa + px * 4 + px * 8 + bloom + px * 2;
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera, time: number, gpu?: GpuTimer): void {
    const r = this.renderer, p = this.params;
    gpu?.begin('scene');
    r.setRenderTarget(this.sceneRT);
    r.setClearColor(0x04060c, 1);
    r.clear(true, true, true);
    r.render(scene, camera);

    const useAir = this.airEnabled && p.airlight > 0.001;
    if (useAir) {
      gpu?.begin('air');
      const u = this.airMat.uniforms;
      u.tDepth.value = this.sceneRT.depthTexture; u.tColor.value = this.sceneRT.texture;
      u.uInvProj.value.copy(camera.projectionMatrixInverse); u.uCamWorld.value.copy(camera.matrixWorld); u.uCamPos.value.copy(camera.position);
      // in-scatter scales with the fog the art direction dialled in
      u.uScatter.value = 0.0055 * (U.uFogDensity.value / 0.013);
      this.quad.material = this.airMat;
      r.setRenderTarget(this.airRT); r.clear(); this.quad.render(r);
    }

    let src: THREE.WebGLRenderTarget = this.sceneRT;
    if (this.dofEnabled && p.dofStrength > 0.001) {
      gpu?.begin('dof');
      const u = this.dofMat.uniforms;
      u.tColor.value = this.sceneRT.texture; u.tDepth.value = this.sceneRT.depthTexture;
      u.uNear.value = camera.near; u.uFar.value = camera.far;
      u.uFocus.value = p.dofFocus; u.uRange.value = p.dofRange; u.uMaxBlur.value = p.dofMaxBlur * (this.height / 1080); u.uFarAmt.value = p.dofFar; u.uNearAmt.value = p.dofNear;
      u.uStrength.value = p.dofStrength; u.uTilt.value = p.tiltStrength; u.uTiltCenter.value = p.tiltCenter; u.uTiltWidth.value = p.tiltWidth;
      this.quad.material = this.dofMat;
      r.setRenderTarget(this.dofRT); r.clear(); this.quad.render(r);
      src = this.dofRT;
    }
    if (this.bloomEnabled && p.bloomStrength > 0.001) {
      gpu?.begin('bloom');
      this.bloom.strength = p.bloomStrength; this.bloom.radius = p.bloomRadius; this.bloom.threshold = p.bloomThreshold;
      // additive blend of the bloom chain into the (already sharp / DOF'd) HDR buffer
      this.bloom.render(r, null as any, src, 0, false);
    }
    gpu?.begin('grade');
    const g = this.gradeMat.uniforms;
    g.tColor.value = src.texture; g.tAir.value = useAir ? this.airRT.texture : this.black; g.uAir.value = p.airlight;
    g.uAirSize.value.set(useAir ? this.airRT.width : 1, useAir ? this.airRT.height : 1);
    g.uExposure.value = p.exposure; g.uVignette.value = p.vignette; g.uGrain.value = p.grain; g.uSat.value = p.saturation; g.uContrast.value = p.contrast; g.uTime.value = time; g.uPalette.value = p.palette;
    g.uShadowTint.value.set(p.shadowTint.r, p.shadowTint.g, p.shadowTint.b); g.uHighTint.value.set(p.highlightTint.r, p.highlightTint.g, p.highlightTint.b);
    this.quad.material = this.gradeMat;
    r.setRenderTarget(null);
    this.quad.render(r);
  }
}
