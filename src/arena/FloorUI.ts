import * as THREE from 'three';
import { maskSafeBlending } from '../atmosphere/SceneUniforms';
import { LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';

/** Floor marks of the duel (journal Passe P1), the prototype's FloorUI in the town's renderer: a thin ring under each fighter (Ren's cool
 *  ivory, Marek's crimson; with the HUD), and, with the full assistance only, the telegraph of a reactable attack: a crimson band from Marek
 *  to Ren with thick ivory chevrons running toward Ren, filling as the attack charges and pulsing once its reaction window is open (the
 *  prototype's night tuning, journal Passe A2: >= 2:1 against the floor). Drawn after the opaque pass on the floor (LAYER_NOREFLECT), unlit,
 *  colour blended without touching the scene alpha (maskSafeBlending). */

const VERT = /* glsl */ `
varying vec3 vWorld;
void main(){ vec4 w = modelMatrix * vec4(position, 1.0); vWorld = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }`;

const FRAG = /* glsl */ `
uniform vec2 uRen, uMarek;      // fighters' floor positions (x, z)
uniform float uRings;           // ring opacity (HUD)
uniform float uTele;            // telegraph: 0 = none, else its opacity
uniform float uFill;            // charge progress (0..1)
uniform float uOpen;            // the reaction window is open
uniform float uTime;
varying vec3 vWorld;
float ring(vec2 p, vec2 c, float r, float w){ float d = abs(length((p - c) * vec2(1.0, 1.6)) - r); return 1.0 - smoothstep(w * 0.5, w, d); }
void main(){
  vec2 p = vWorld.xz;
  vec4 col = vec4(0.0);
  float rr = ring(p, uRen, 0.8, 0.11) * uRings, rm = ring(p, uMarek, 0.9, 0.11) * uRings;
  col = mix(col, vec4(0.78, 0.86, 1.0, 0.7), rr);
  col = mix(col, vec4(0.92, 0.26, 0.26, 0.75), rm * (1.0 - rr));
  if (uTele > 0.0) {
    float x0 = min(uRen.x, uMarek.x) + 0.5, x1 = max(uRen.x, uMarek.x) - 0.55, z = p.y - uRen.y;
    float inside = step(x0, p.x) * step(p.x, x1) * (1.0 - smoothstep(0.62, 0.68, abs(z)));
    if (inside > 0.0) {
      // from Marek (+x) toward Ren: s = 0 at Marek, 1 at Ren
      float s = (x1 - p.x) / max(x1 - x0, 0.01);
      float filled = step(s, uFill);
      vec3 base = mix(vec3(0.42, 0.06, 0.1), vec3(0.86, 0.14, 0.2), filled);
      // chevrons pointing at Ren, running toward him
      float u = fract((x1 - p.x) / 0.8 - uTime * (uOpen > 0.5 ? 2.2 : 1.1) - abs(z) * 0.9);
      float chev = step(0.0, u) * (1.0 - step(0.34, u));
      vec3 c = mix(base, vec3(1.0, 0.95, 0.84), chev * (0.55 + 0.45 * filled));
      float pulse = uOpen > 0.5 ? 0.82 + 0.18 * sin(uTime * 24.0) : 1.0;
      col = mix(col, vec4(c * pulse * 1.15, 0.9), inside * uTele);
    }
  }
  if (col.a < 0.01) discard;
  gl_FragColor = col;
}`;

export class FloorUI {
  readonly mesh: THREE.Mesh;
  readonly mat: THREE.ShaderMaterial;
  constructor() {
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uRen: { value: new THREE.Vector2() }, uMarek: { value: new THREE.Vector2() }, uRings: { value: 1 }, uTele: { value: 0 }, uFill: { value: 0 }, uOpen: { value: 0 }, uTime: { value: 0 } },
      vertexShader: VERT, fragmentShader: FRAG, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
      ...maskSafeBlending('normal'),
    });
    const g = new THREE.PlaneGeometry(10, 4); g.rotateX(-Math.PI / 2); g.translate(0, 0.012, 0);
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.name = 'arena:floorUI'; this.mesh.layers.set(LAYER_NOREFLECT); this.mesh.renderOrder = 4; this.mesh.frustumCulled = false;
  }
  update(ren: THREE.Vector3, marek: THREE.Vector3, rings: number, tele: number, fill: number, open: boolean, time: number): void {
    const u = this.mat.uniforms;
    u.uRen.value.set(ren.x, 0); u.uMarek.value.set(marek.x, 0);
    u.uRings.value = rings; u.uTele.value = tele; u.uFill.value = fill; u.uOpen.value = open ? 1 : 0; u.uTime.value = time;
  }
  dispose(): void { this.mesh.geometry.dispose(); this.mat.dispose(); }
}
