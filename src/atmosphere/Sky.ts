import * as THREE from 'three';
import { U } from './SceneUniforms';
import { COMMON_GLSL } from '../materials/ShaderChunks';

/** Camera-centred sky dome at the far plane. Shares skyHaze() with the fog, so fully fogged silhouettes melt
 *  into the horizon seamlessly; also rendered by the planar reflection (layer 0). Drawn after every other opaque
 *  and depth-tested, so only the sky that is actually visible gets shaded (it used to fill the whole screen first
 *  and be painted over). */

const SKY_VERT = /* glsl */ `
varying vec3 vDir;
void main(){
  vDir = position;
  vec4 p = projectionMatrix * vec4(mat3(viewMatrix) * position, 1.0);
  gl_Position = vec4(p.xy, p.w * 0.99999, p.w);
}`;

const SKY_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform float uCloud;
uniform vec4 uBolt;
varying vec3 vDir;
void main(){
  vec3 rd = normalize(vDir);
  vec3 col = skyColor(rd);
  float mu = max(dot(rd, uMoonDir), 0.0);
  // a few thin cloud bands, silhouetted against the haze and silvered near the moon
  float hz = max(rd.y, 0.0);
  vec2 sp = rd.xz / (hz + 0.16);
  float n = vn2(sp * 0.8 + vec2(uTime * 0.003, 0.0)) * 0.62 + vn2(sp * 2.1 + 3.7) * 0.38;
  float cl = smoothstep(0.56, 0.8, n) * smoothstep(0.02, 0.14, rd.y) * (1.0 - smoothstep(0.3, 0.62, rd.y));
  // weather (?rain / ?snow / ?storm, journal Passe W1): a thicker, slower deck over the whole sky that hides the moon (uCloud = 0 skips it)
  float deck = 0.0;
  if (uCloud > 0.0) {
    float m = vn2(sp * 0.45 + vec2(uTime * 0.008, uTime * 0.002)) * 0.6 + vn2(sp * 1.3 + 5.1) * 0.4;
    deck = uCloud * smoothstep(0.62 - 0.45 * uCloud, 0.82, m) * smoothstep(0.0, 0.1, rd.y);
    cl = max(cl, deck);
  }
  vec3 cloud = uFogColor * 0.62 + uMoonCol * 0.32 * pow(mu, 10.0);
  col = mix(col, cloud, cl * 0.42);
  // moon: crisp disc, tight corona, soft glow (bloom picks up the disc)
  float disc = smoothstep(0.99984, 0.99991, mu);
  col += vec3(1.2, 1.26, 1.36) * disc * 1.45 * (1.0 - cl * 0.7) * (1.0 - uCloud);
  col += uMoonCol * (pow(mu, 2600.0) * 0.45 + pow(mu, 220.0) * 0.05) * (1.0 - 0.8 * uCloud);
  // lightning (?storm, journal Passe W3): during a flash, a jagged stroke from the cloud deck down behind the city, with a fork from mid-height
  // and a soft glow; uBolt.w = 0 skips it
  if (uBolt.w > 0.0) {
    float el = asin(clamp(rd.y, -1.0, 1.0)), az = atan(rd.z, rd.x), ce = cos(el);
    float h = clamp((0.32 - el) / 0.3, 0.0, 1.0);
    float span = smoothstep(0.35, 0.3, el) * smoothstep(-0.02, 0.05, el);
    float path = uBolt.x + (vn2(vec2(h * 6.0, uBolt.y)) - 0.5) * 0.1 + (vn2(vec2(h * 23.0, uBolt.y + 7.0)) - 0.5) * 0.03;
    float d = (mod(az - path + 3.14159265, 6.2831853) - 3.14159265) * ce;
    float bolt = exp(-d * d / 1.44e-6) + 0.35 * exp(-d * d / 3.6e-5);
    float hf = clamp((h - 0.4) / 0.6, 0.0, 1.0), side = vn2(vec2(uBolt.y, 9.0)) > 0.5 ? 1.0 : -1.0;
    float fpath = path + side * hf * (0.05 + 0.04 * vn2(vec2(uBolt.y, 3.0))) + (vn2(vec2(h * 19.0, uBolt.y + 3.0)) - 0.5) * 0.02 * hf;
    float df = (mod(az - fpath + 3.14159265, 6.2831853) - 3.14159265) * ce;
    bolt += step(0.4, h) * 0.7 * exp(-df * df / 8.1e-7) * (1.0 - 0.7 * hf);
    col += vec3(1.5, 1.62, 1.95) * bolt * span * uBolt.w;
  }
  // sparse faint stars, only high in the sky and away from the moon
  vec3 sd = rd * 240.0, cell = floor(sd);
  float h = hash13(cell);
  float star = step(0.994, h) * smoothstep(0.24, 0.0, length(fract(sd) - 0.5));
  star *= smoothstep(0.2, 0.5, rd.y) * (1.0 - pow(mu, 30.0)) * (1.0 - cl);
  col += vec3(0.62, 0.68, 0.85) * star * (0.08 + 0.22 * hash13(cell + 7.0));
  gl_FragColor = vec4(col, 1.0);
}`;

export function buildSky(): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U }, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
    side: THREE.BackSide, depthWrite: false, depthTest: true,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), mat);
  mesh.name = 'sky'; mesh.frustumCulled = false; mesh.renderOrder = 1000;
  return mesh;
}
