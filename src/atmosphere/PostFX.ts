import * as THREE from 'three';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { FullScreenQuad } from 'three/examples/jsm/postprocessing/Pass.js';

export interface PostParams {
  exposure: number;
  bloomStrength: number; bloomRadius: number; bloomThreshold: number;
  dofStrength: number; dofFocus: number; dofRange: number; dofMaxBlur: number;
  tiltStrength: number; tiltCenter: number; tiltWidth: number;
  vignette: number; grain: number; saturation: number; contrast: number;
  shadowTint: THREE.Color; highlightTint: THREE.Color;
  renderScale: number;
  msaa: number;
}

export const defaultPost = (): PostParams => ({
  exposure: 1.0,
  bloomStrength: 0.62, bloomRadius: 0.72, bloomThreshold: 0.92,
  dofStrength: 0.8, dofFocus: 38, dofRange: 22, dofMaxBlur: 7.5,
  tiltStrength: 0.62, tiltCenter: 0.52, tiltWidth: 0.24,
  vignette: 0.28, grain: 0.012, saturation: 1.02, contrast: 1.05,
  shadowTint: new THREE.Color(0.9, 1.0, 1.25), highlightTint: new THREE.Color(1.08, 1.0, 0.9),
  renderScale: 1, msaa: 4,
});

const VERT = /* glsl */ `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;

const DOF_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tColor;
uniform sampler2D tDepth;
uniform vec2 uTexel;
uniform float uNear, uFar;
uniform float uFocus, uRange, uMaxBlur, uStrength;
uniform float uTilt, uTiltCenter, uTiltWidth;
varying vec2 vUv;
float viewZ(float d){ float z = d * 2.0 - 1.0; return (2.0 * uNear * uFar) / (uFar + uNear - z * (uFar - uNear)); }
float coc(vec2 uv, float vz){
  float dz = vz - uFocus;
  float dofC = dz < 0.0 ? smoothstep(0.0, uRange * 0.9, -dz) : smoothstep(0.0, uRange * 3.0, dz) * 0.6;
  float t = abs(uv.y - uTiltCenter);
  float tiltC = smoothstep(uTiltWidth, uTiltWidth + 0.36, t);
  return clamp(max(dofC, tiltC * uTilt), 0.0, 1.0) * uStrength;
}
void main(){
  float d0 = texture2D(tDepth, vUv).x;
  float z0 = viewZ(d0);
  float c0 = coc(vUv, z0);
  vec4 base = texture2D(tColor, vUv);
  float rad = c0 * uMaxBlur;
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
    float rs = coc(suv, zs) * uMaxBlur;
    float dist = r * rad;
    float reach = smoothstep(dist - 1.2, dist + 0.6, rs);
    // background samples must not smear over a nearer, sharper centre pixel
    float behind = zs > z0 + 1.5 ? smoothstep(0.0, 1.0, c0 * 2.0) : 1.0;
    vec3 col = texture2D(tColor, suv).rgb;
    float lum = dot(col, vec3(0.3, 0.55, 0.15));
    float w = reach * behind * (1.0 + smoothstep(1.2, 5.0, lum) * 1.6);
    acc += col * w; wsum += w;
  }
  gl_FragColor = vec4(acc / wsum, 1.0);
}
`;

const GRADE_FRAG = /* glsl */ `
precision highp float;
uniform sampler2D tColor;
uniform float uExposure, uVignette, uGrain, uSat, uContrast, uTime;
uniform vec3 uShadowTint, uHighTint;
varying vec2 vUv;
vec3 aces(vec3 x){ const float a = 2.51, b = 0.03, c = 2.43, d = 0.59, e = 0.14; return clamp((x * (a * x + b)) / (x * (c * x + d) + e), 0.0, 1.0); }
float h21(vec2 p){ vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec3 toSRGB(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
void main(){
  vec3 c = texture2D(tColor, vUv).rgb * uExposure;
  vec3 t = aces(c);
  float l = dot(t, vec3(0.2126, 0.7152, 0.0722));
  // split toning: cool shadows, warm highlights
  vec3 tint = mix(uShadowTint, uHighTint, smoothstep(0.08, 0.75, l));
  t *= tint;
  t = mix(vec3(l), t, uSat);
  t = (t - 0.5) * uContrast + 0.5;
  t = max(t, 0.0);
  // lifted night blacks (never pure black)
  t += vec3(0.004, 0.007, 0.014) * (1.0 - l);
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
  private bloom!: UnrealBloomPass;
  private quad = new FullScreenQuad();
  private dofMat: THREE.ShaderMaterial;
  private gradeMat: THREE.ShaderMaterial;
  width = 1; height = 1;
  dofEnabled = true; bloomEnabled = true;

  constructor(private renderer: THREE.WebGLRenderer) {
    this.dofMat = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: null }, tDepth: { value: null }, uTexel: { value: new THREE.Vector2() }, uNear: { value: 1 }, uFar: { value: 100 },
        uFocus: { value: 44 }, uRange: { value: 14 }, uMaxBlur: { value: 7 }, uStrength: { value: 1 }, uTilt: { value: 1 }, uTiltCenter: { value: 0.5 }, uTiltWidth: { value: 0.2 },
      },
      vertexShader: VERT, fragmentShader: DOF_FRAG, depthTest: false, depthWrite: false,
    });
    this.gradeMat = new THREE.ShaderMaterial({
      uniforms: {
        tColor: { value: null }, uExposure: { value: 1 }, uVignette: { value: 0.3 }, uGrain: { value: 0.01 }, uSat: { value: 1 }, uContrast: { value: 1 }, uTime: { value: 0 },
        uShadowTint: { value: new THREE.Vector3(1, 1, 1) }, uHighTint: { value: new THREE.Vector3(1, 1, 1) },
      },
      vertexShader: VERT, fragmentShader: GRADE_FRAG, depthTest: false, depthWrite: false,
    });
    this.bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.6, 0.7, 0.9);
    this.bloom.renderToScreen = false;
  }

  setSize(cssW: number, cssH: number, pixelRatio: number): void {
    const s = this.params.renderScale;
    const w = Math.max(2, Math.round(cssW * pixelRatio * s)), h = Math.max(2, Math.round(cssH * pixelRatio * s));
    this.width = w; this.height = h;
    this.sceneRT?.dispose(); this.dofRT?.dispose();
    const depth = new THREE.DepthTexture(w, h);
    depth.type = THREE.UnsignedIntType;
    this.sceneRT = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: this.params.msaa, depthBuffer: true, depthTexture: depth, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.dofRT = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: false, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });
    this.bloom.setSize(w, h);
    this.dofMat.uniforms.uTexel.value.set(1 / w, 1 / h);
    this.renderer.setPixelRatio(pixelRatio * s);
    this.renderer.setSize(cssW, cssH, false);
  }

  textureBytes(): number {
    const px = this.width * this.height;
    const msaa = this.sceneRT ? this.sceneRT.samples || 1 : 1;
    const bloom = px * 8 * 0.5 * 2.2; // half-res mip chain, horizontal + vertical
    return px * 8 * msaa + px * 4 + px * 8 + bloom;
  }

  render(scene: THREE.Scene, camera: THREE.PerspectiveCamera, time: number): void {
    const r = this.renderer, p = this.params;
    r.setRenderTarget(this.sceneRT);
    r.setClearColor(0x04060c, 1);
    r.clear(true, true, true);
    r.render(scene, camera);

    let src: THREE.WebGLRenderTarget = this.sceneRT;
    if (this.dofEnabled && p.dofStrength > 0.001) {
      const u = this.dofMat.uniforms;
      u.tColor.value = this.sceneRT.texture; u.tDepth.value = this.sceneRT.depthTexture;
      u.uNear.value = camera.near; u.uFar.value = camera.far;
      u.uFocus.value = p.dofFocus; u.uRange.value = p.dofRange; u.uMaxBlur.value = p.dofMaxBlur * (this.height / 1080);
      u.uStrength.value = p.dofStrength; u.uTilt.value = p.tiltStrength; u.uTiltCenter.value = p.tiltCenter; u.uTiltWidth.value = p.tiltWidth;
      this.quad.material = this.dofMat;
      r.setRenderTarget(this.dofRT); r.clear(); this.quad.render(r);
      src = this.dofRT;
    }
    if (this.bloomEnabled && p.bloomStrength > 0.001) {
      this.bloom.strength = p.bloomStrength; this.bloom.radius = p.bloomRadius; this.bloom.threshold = p.bloomThreshold;
      // additive blend of the bloom chain into the (already sharp / DOF'd) HDR buffer
      this.bloom.render(r, null as any, src, 0, false);
    }
    const g = this.gradeMat.uniforms;
    g.tColor.value = src.texture; g.uExposure.value = p.exposure; g.uVignette.value = p.vignette; g.uGrain.value = p.grain; g.uSat.value = p.saturation; g.uContrast.value = p.contrast; g.uTime.value = time;
    g.uShadowTint.value.set(p.shadowTint.r, p.shadowTint.g, p.shadowTint.b); g.uHighTint.value.set(p.highlightTint.r, p.highlightTint.g, p.highlightTint.b);
    this.quad.material = this.gradeMat;
    r.setRenderTarget(null);
    this.quad.render(r);
  }
}
