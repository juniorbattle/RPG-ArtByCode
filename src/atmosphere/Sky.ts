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
#ifdef DAY_WEATHER
// the night's lightning stroke below, as a function for the day's sky (journal Passe Y5): the same shape, kept apart so that the night's code
// does not change
float dayBolt(vec3 rd){
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
  return bolt * span;
}
#endif
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
  #ifdef DAY
  // midday (?time=midday, journal Passes Y1 / Y2; a variant compiled only by day): the deep blue sky of the midday track with white cumulus low
  // over the horizon, lit on top, greyer underneath; no moon, corona or stars (the sun, high at midday, stays above every framing)
  vec2 cp = sp * 0.42 + vec2(uTime * 0.002, 0.0);
  float f = vn2(cp) * 0.5 + vn2(cp * 2.03 + 1.7) * 0.25 + vn2(cp * 4.07 + 3.1) * 0.15 + vn2(cp * 8.3 + 7.7) * 0.1;
  float cum = smoothstep(0.6, 0.7, f) * smoothstep(0.0, 0.06, rd.y) * (1.0 - smoothstep(0.32, 0.6, rd.y));
  vec3 cloudCol = mix(uFogColor * 0.7 + vec3(0.3), vec3(1.5, 1.51, 1.56), smoothstep(0.6, 0.82, f));
  col = mix(skyColor(rd), cloudCol, cum);
  #endif
  #ifdef DAY_HAZE
  // the morning (?time=morning, journal Passe Y4): the sky and its clouds veiled by the pale haze of the morning track
  col = mix(col, skyHaze(rd), DAY_HAZE);
  #endif
  #ifdef DAY_SUN
  // the end of day (?time=afternoon, journal Passe Y4): the low sun's glow at the far end of the canal (the sun in the moon's uniforms), the
  // clouds warmed toward it
  float sg = max(dot(rd, uMoonDir), 0.0);
  col = mix(col, col * uMoonCol * 0.42, cum * pow(sg, 3.0));
  col += uMoonCol * (0.05 * pow(sg, 6.0) + 0.16 * pow(sg, 48.0) + 0.6 * pow(sg, 900.0)) * DAY_SUN;
  #endif
  #ifdef DAY_WEATHER
  // a day state's weather (?rain / ?snow / ?storm by day, journal Passe Y5; compiled only then): the overcast deck greys the sky by the cover,
  // its slow masses darker, in the haze's (veiled) tone; the bolt during a flash
  float wm = vn2(sp * 0.45 + vec2(uTime * 0.008, uTime * 0.002)) * 0.6 + vn2(sp * 1.3 + 5.1) * 0.4;
  vec3 deckCol = uFogColor * (1.08 - 0.3 * smoothstep(0.45, 0.85, wm));
  col = mix(col, mix(skyColor(rd), deckCol, smoothstep(-0.02, 0.12, rd.y)), min(1.0, uCloud * 1.1));
  col += vec3(1.5, 1.62, 1.95) * dayBolt(rd) * uBolt.w;
  #endif
  gl_FragColor = vec4(col, 1.0);
}`;

/** `defines` (?time=..., DayState.ts `sky`, journal Passes Y1 / Y4): a day state's sky, a variant compiled with DAY (and DAY_HAZE / DAY_SUN);
 *  none = the night's material, main's exactly */
export function buildSky(defines: Record<string, number | string> | null = null): THREE.Mesh {
  const mat = new THREE.ShaderMaterial({
    uniforms: { ...U }, vertexShader: SKY_VERT, fragmentShader: SKY_FRAG, defines: defines ? { ...defines } : {},
    side: THREE.BackSide, depthWrite: false, depthTest: true,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 32), mat);
  mesh.name = 'sky'; mesh.frustumCulled = false; mesh.renderOrder = 1000;
  return mesh;
}
