import * as THREE from 'three';
import { U } from './SceneUniforms';
import { COMMON_GLSL } from '../materials/ShaderChunks';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import type { LightRig } from './LightRig';
import type { Emitter } from '../district/MerchantDistrictGenerator';
import { LAYER_NOREFLECT } from './ShadowAndReflection';
import { Rng } from '../core/rng';

/** Restrained, code-driven life: chimney + forge smoke, sparks on hammer strikes, flames, embers, lantern-lit dust,
 *  and lantern halos. CPU-simulated (a few hundred particles), drawn as soft procedural point sprites. */

const PVERT = /* glsl */ `
attribute float aSize; attribute vec4 aColor; attribute float aRot;
uniform float uScale;
varying vec4 vColor; varying float vRot;
void main(){
  vec4 mv = viewMatrix * modelMatrix * vec4(position, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uScale / max(-mv.z, 0.1), 0.0, 900.0);
  vColor = aColor; vRot = aRot;
}`;
const PFRAG = /* glsl */ `
uniform sampler2D tMap; uniform float uAdd;
varying vec4 vColor; varying float vRot;
void main(){
  vec2 pc = gl_PointCoord - 0.5;
  float c = cos(vRot), s = sin(vRot);
  pc = vec2(c * pc.x - s * pc.y, s * pc.x + c * pc.y) + 0.5;
  float a = texture2D(tMap, pc).a * vColor.a;
  if (a < 0.003) discard;
  gl_FragColor = vec4(vColor.rgb * (uAdd > 0.5 ? a : 1.0), uAdd > 0.5 ? 1.0 : a);
}`;

/** dust motes brighten only where warm light actually reaches them */
const DVERT = /* glsl */ `
${COMMON_GLSL}
attribute float aSize; attribute float aSeed;
uniform float uScale;
varying vec4 vColor;
void main(){
  vec3 P = position;
  vec4 mv = viewMatrix * vec4(P, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = clamp(aSize * uScale / max(-mv.z, 0.1), 1.0, 40.0);
  vec3 lit = vec3(0.0);
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;
    vec3 d = uLightPos[i].xyz - P; float d2 = dot(d, d); float r2 = uLightPos[i].w * uLightPos[i].w;
    if (d2 > r2) continue;
    float x = 1.0 - d2 / r2;
    lit += uLightCol[i].rgb * x * x / (1.0 + d2 * 0.12);
  }
  float tw = 0.55 + 0.45 * sin(uTime * (0.8 + aSeed) + aSeed * 40.0);
  vColor = vec4(lit * 0.85 + uSkyAmb * 1.5, tw * clamp(dot(lit, vec3(0.35)) * 0.8 + 0.12, 0.0, 0.9));
}`;

class PointCloud {
  readonly points: THREE.Points;
  readonly mat: THREE.ShaderMaterial;
  pos: Float32Array; size: Float32Array; col: Float32Array; rot: Float32Array;
  count = 0;
  constructor(readonly capacity: number, tex: THREE.Texture, additive: boolean) {
    const g = new THREE.BufferGeometry();
    this.pos = new Float32Array(capacity * 3); this.size = new Float32Array(capacity); this.col = new Float32Array(capacity * 4); this.rot = new Float32Array(capacity);
    for (const [n, a, i] of [['position', this.pos, 3], ['aSize', this.size, 1], ['aColor', this.col, 4], ['aRot', this.rot, 1]] as Array<[string, Float32Array, number]>) {
      const at = new THREE.BufferAttribute(a, i); at.setUsage(THREE.DynamicDrawUsage); g.setAttribute(n, at);
    }
    g.setDrawRange(0, 0);
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tMap: { value: tex }, uScale: { value: 1000 }, uAdd: { value: additive ? 1 : 0 } },
      vertexShader: PVERT, fragmentShader: PFRAG, transparent: true, depthWrite: false, depthTest: true,
      blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.mat);
    this.points.frustumCulled = false;
    this.points.layers.set(LAYER_NOREFLECT);
    this.points.renderOrder = additive ? 6 : 5;
  }
  flush(): void {
    const g = this.points.geometry;
    for (const n of ['position', 'aSize', 'aColor', 'aRot']) (g.getAttribute(n) as THREE.BufferAttribute).needsUpdate = true;
    g.setDrawRange(0, this.count);
  }
}

interface Part { x: number; y: number; z: number; vx: number; vy: number; vz: number; age: number; life: number; size0: number; size1: number; r: number; g: number; b: number; a: number; rot: number; spin: number; grav: number; drag: number; warm: number; kind: number }

export class ParticleSystem {
  readonly group = new THREE.Group();
  private smoke: PointCloud;
  private glow: PointCloud;
  private halo: PointCloud;
  private dust: THREE.Points;
  private dustMat: THREE.ShaderMaterial;
  private parts: Part[] = [];
  private partsGlow: Part[] = [];
  private acc = new Map<Emitter, number>();
  private rng = new Rng(99);
  emitters: Emitter[] = [];
  lastStrike = -1;
  intensity = 1;
  wind = new THREE.Vector3(0.28, 0, -0.12);
  hammerRate = 5.5;
  smokeAmount = 1;
  private lib: MaterialLibrary;

  constructor(lib: MaterialLibrary) {
    this.lib = lib;
    this.smoke = new PointCloud(420, lib.smoke, false);
    this.glow = new PointCloud(520, lib.dot, true);
    this.halo = new PointCloud(48, lib.halo, true);
    this.halo.points.layers.set(0);
    this.halo.points.renderOrder = 7;
    // dust
    const n = 150, g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3), s = new Float32Array(n), sd = new Float32Array(n);
    const r = new Rng(5);
    for (let i = 0; i < n; i++) { p[i * 3] = r.range(-8, 16); p[i * 3 + 1] = r.range(0.3, 5.2); p[i * 3 + 2] = r.range(-5, 5); s[i] = r.range(0.03, 0.075); sd[i] = r.next(); }
    g.setAttribute('position', new THREE.BufferAttribute(p, 3)); g.setAttribute('aSize', new THREE.BufferAttribute(s, 1)); g.setAttribute('aSeed', new THREE.BufferAttribute(sd, 1));
    this.dustMat = new THREE.ShaderMaterial({
      uniforms: { ...U, uScale: { value: 1000 }, tMap: { value: lib.dot } },
      vertexShader: DVERT, fragmentShader: `uniform sampler2D tMap; varying vec4 vColor; void main(){ float a = texture2D(tMap, gl_PointCoord).a * vColor.a; if (a < 0.004) discard; gl_FragColor = vec4(vColor.rgb * a, 1.0); }`,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    });
    this.dust = new THREE.Points(g, this.dustMat);
    this.dust.frustumCulled = false; this.dust.layers.set(LAYER_NOREFLECT); this.dust.renderOrder = 6;
    this.group.add(this.smoke.points, this.glow.points, this.halo.points, this.dust);
  }

  setEmitters(e: Emitter[]): void { this.emitters = e; this.acc.clear(); }

  clear(): void { this.parts.length = 0; this.partsGlow.length = 0; }

  private spawn(list: Part[], p: Partial<Part> & { x: number; y: number; z: number; life: number }): void {
    list.push({ vx: 0, vy: 0, vz: 0, age: 0, size0: 0.2, size1: 0.2, r: 1, g: 1, b: 1, a: 1, rot: this.rng.range(0, 6.28), spin: 0, grav: 0, drag: 0, warm: 0, kind: 0, ...p });
  }

  update(dt: number, time: number, camera: THREE.PerspectiveCamera, viewH: number, lights: LightRig, strikePhase: number | null): void {
    const R = this.rng;
    const scale = viewH / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    this.smoke.mat.uniforms.uScale.value = scale; this.glow.mat.uniforms.uScale.value = scale; this.halo.mat.uniforms.uScale.value = scale; this.dustMat.uniforms.uScale.value = scale;
    // ---------------------------------------------------------------- spawn
    for (const e of this.emitters) {
      const k = (this.acc.get(e) ?? 0) + dt;
      const tag = e.tag ?? '';
      if (e.kind === 'chimney') {
        const big = tag === 'forge';
        const rate = (big ? 11 : 4.2) * e.rate * this.smokeAmount;
        let a = k;
        while (a > 1 / rate) {
          a -= 1 / rate;
          const tone = big ? 0.85 : 1;
          this.spawn(this.parts, {
            x: e.pos[0] + R.range(-0.18, 0.18), y: e.pos[1], z: e.pos[2] + R.range(-0.18, 0.18), vx: this.wind.x * 0.5 + R.range(-0.08, 0.08), vy: R.range(0.55, 0.95) * (big ? 1.25 : 1), vz: this.wind.z * 0.5 + R.range(-0.08, 0.08),
            life: R.range(5.5, 8.5), size0: big ? 0.8 : 0.5, size1: big ? 3.0 : 2.1, r: 0.12 * tone, g: 0.14 * tone, b: 0.2 * tone, a: big ? 0.62 : 0.42, spin: R.range(-0.3, 0.3), drag: 0.15, warm: big ? 1 : 0.35, kind: big ? 2 : 1,
          });
        }
        this.acc.set(e, a);
      } else if (e.kind === 'forge') {
        let rate = 0, mode = tag;
        if (tag === 'flame') rate = 42; else if (tag === 'embers') rate = 7; else if (tag === 'coldSmoke') rate = 2.6; else if (tag === 'steam') rate = 4.5; else if (tag === 'sparks') rate = 0;
        let a = k;
        if (rate > 0) while (a > 1 / rate) {
          a -= 1 / rate;
          if (mode === 'flame') this.spawn(this.partsGlow, { x: e.pos[0] + R.range(-0.5, 0.5), y: e.pos[1], z: e.pos[2] + R.range(-0.18, 0.4), vx: R.range(-0.1, 0.1), vy: R.range(0.7, 1.4), vz: R.range(-0.05, 0.12), life: R.range(0.35, 0.7), size0: R.range(0.28, 0.42), size1: 0.06, r: 3.2, g: 1.3, b: 0.28, a: 0.9, kind: 3 });
          else if (mode === 'embers') this.spawn(this.partsGlow, { x: e.pos[0] + R.range(-0.4, 0.4), y: e.pos[1], z: e.pos[2] + R.range(-0.1, 0.3), vx: R.range(-0.25, 0.3), vy: R.range(0.8, 1.7), vz: R.range(-0.2, 0.2), life: R.range(1.6, 3.4), size0: R.range(0.035, 0.07), size1: 0.015, r: 3.5, g: 1.0, b: 0.2, a: 1, kind: 4 });
          else if (mode === 'coldSmoke') this.spawn(this.parts, { x: e.pos[0] + R.range(-0.3, 0.3), y: e.pos[1], z: e.pos[2] + R.range(-0.1, 0.4), vx: this.wind.x * 0.3, vy: R.range(0.25, 0.5), vz: 0, life: R.range(3, 5), size0: 0.3, size1: 1.3, r: 0.1, g: 0.11, b: 0.14, a: 0.2, warm: 0.2, kind: 1, drag: 0.2 });
          else if (mode === 'steam') this.spawn(this.parts, { x: e.pos[0] + R.range(-0.4, 0.4), y: e.pos[1], z: e.pos[2] + R.range(-0.3, 0.3), vx: R.range(-0.05, 0.1), vy: R.range(0.3, 0.55), vz: R.range(-0.05, 0.05), life: R.range(2, 3.4), size0: 0.3, size1: 1.1, r: 0.22, g: 0.25, b: 0.32, a: 0.16, kind: 1, drag: 0.3 });
        }
        this.acc.set(e, a);
        if (tag === 'sparks' && strikePhase !== null) {
          // hammer strike: a short burst of bright sparks that arc and fall
          const strikeId = Math.floor(strikePhase);
          if (strikeId !== this.lastStrike) {
            this.lastStrike = strikeId;
            const n = R.int(9, 16);
            for (let i = 0; i < n; i++) {
              const ang = R.range(0, 6.28), sp = R.range(0.9, 2.8);
              this.spawn(this.partsGlow, { x: e.pos[0], y: e.pos[1], z: e.pos[2], vx: Math.cos(ang) * sp, vy: R.range(1.0, 2.8), vz: Math.sin(ang) * sp * 0.8, life: R.range(0.5, 1.1), size0: R.range(0.04, 0.075), size1: 0.012, r: 3.4, g: 1.5, b: 0.4, a: 1, grav: 7.5, kind: 5 });
            }
          }
        }
      }
    }
    // ---------------------------------------------------------------- integrate
    const step = (list: Part[]) => {
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.age += dt;
        if (p.age >= p.life) { list.splice(i, 1); continue; }
        p.vy -= p.grav * dt;
        const d = Math.exp(-p.drag * dt);
        p.vx *= d; p.vz *= d;
        if (p.kind === 1 || p.kind === 2) { p.vx += (this.wind.x - p.vx) * 0.25 * dt; p.vz += (this.wind.z - p.vz) * 0.25 * dt; }
        if (p.kind === 4) { p.vx += Math.sin(time * 3 + p.rot * 9) * 0.5 * dt; p.vz += Math.cos(time * 2.4 + p.rot * 7) * 0.5 * dt; }
        p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
        if (p.kind === 5 && p.y < 0.03) { p.y = 0.03; p.vy = Math.abs(p.vy) * 0.28; p.vx *= 0.6; p.vz *= 0.6; }
        p.rot += p.spin * dt;
      }
    };
    step(this.parts); step(this.partsGlow);
    // ---------------------------------------------------------------- write
    let n = 0;
    const sm = this.smoke;
    for (const p of this.parts) {
      if (n >= sm.capacity) break;
      const t = p.age / p.life;
      const fade = Math.min(1, t * 6) * (1 - t) * (1 - t);
      const warm = p.warm * Math.exp(-t * 7);
      // underlit by firelight near the source, cool moonlit grey when high up
      sm.pos[n * 3] = p.x; sm.pos[n * 3 + 1] = p.y; sm.pos[n * 3 + 2] = p.z;
      sm.size[n] = p.size0 + (p.size1 - p.size0) * Math.sqrt(t);
      const wr = p.kind === 2 ? 0.34 : 0.14, wg = p.kind === 2 ? 0.13 : 0.06;
      sm.col[n * 4] = p.r + warm * wr; sm.col[n * 4 + 1] = p.g + warm * wg; sm.col[n * 4 + 2] = p.b + warm * 0.03; sm.col[n * 4 + 3] = p.a * fade;
      sm.rot[n] = p.rot;
      n++;
    }
    sm.count = n; sm.flush();
    n = 0;
    const gl = this.glow;
    for (const p of this.partsGlow) {
      if (n >= gl.capacity) break;
      const t = p.age / p.life;
      gl.pos[n * 3] = p.x; gl.pos[n * 3 + 1] = p.y; gl.pos[n * 3 + 2] = p.z;
      gl.size[n] = p.size0 + (p.size1 - p.size0) * t;
      const cool = p.kind === 3 ? t : p.kind === 5 ? t * 0.5 : t * 0.6;
      gl.col[n * 4] = p.r * (1 - cool * 0.3); gl.col[n * 4 + 1] = p.g * (1 - cool * 0.75); gl.col[n * 4 + 2] = p.b * (1 - cool); gl.col[n * 4 + 3] = p.a * (p.kind === 3 ? Math.sin(Math.min(1, t * 1.15) * Math.PI) : 1 - t * t) * this.intensity;
      gl.rot[n] = p.rot;
      n++;
    }
    gl.count = n; gl.flush();
    // ---------------------------------------------------------------- lantern halos follow the light flicker
    const h = this.halo;
    n = 0;
    for (const s of lights.sources) {
      if (s.halo <= 0 || s.scale < 0.03 || n >= h.capacity) continue;
      h.pos[n * 3] = s.pos.x; h.pos[n * 3 + 1] = s.pos.y; h.pos[n * 3 + 2] = s.pos.z;
      const lv = Math.min(1.5, s.level) * (s.kind === 'fire' ? 0.8 : 1);
      h.size[n] = s.halo * (0.92 + 0.12 * lv);
      const k = Math.min(1, s.intensity / 5) * 0.34 * lv;
      h.col[n * 4] = s.color.r * 2.2 * k; h.col[n * 4 + 1] = s.color.g * 1.9 * k; h.col[n * 4 + 2] = s.color.b * 1.6 * k; h.col[n * 4 + 3] = 1;
      h.rot[n] = 0;
      n++;
    }
    h.count = n; h.flush();
  }
}
