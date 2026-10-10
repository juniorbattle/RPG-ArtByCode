import { COMMON_GLSL } from './ShaderChunks';

export const GROUND_VERT = /* glsl */ `
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
void main(){
  vec4 wp = modelMatrix * vec4(position, 1.0);
  vWorld = wp.xyz; vNormal = normalize(mat3(modelMatrix) * normal); vUv = uv;
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

/** Wet cobblestone street: two-scale tile breakup, world-space masks (puddles, grime, wear, contact AO),
 *  GGX glints from the warm lights, planar reflection in puddles and wet stones. */
export const GROUND_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D tCobble;
uniform sampler2D tCobbleNR;
uniform sampler2D tGroundMask;
uniform sampler2D uReflMap;
uniform mat4 uReflVP;
uniform vec4 uGroundRect;
uniform float uWet;
uniform float uReflStrength;
uniform float uReflReady;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;

void main(){
  vec3 P = vWorld;
  vec3 V = normalize(cameraPosition - P);
  vec2 gp = P.xz;
  const float ca = 0.8, sa = 0.6;
  vec2 uvA = gp / 4.0;
  vec2 uvB = vec2(ca * gp.x - sa * gp.y, sa * gp.x + ca * gp.y) / 5.3 + 0.37;
  vec4 A1 = texture2D(tCobble, uvA), A2 = texture2D(tCobble, uvB);
  vec4 N1 = texture2D(tCobbleNR, uvA), N2 = texture2D(tCobbleNR, uvB);
  float bn = vn2(gp * 0.085);
  float t = smoothstep(0.0, 1.0, clamp((bn - 0.5) * 6.0 + (A2.a - A1.a) * 2.2 + 0.5, 0.0, 1.0));
  vec4 A = mix(A1, A2, t);
  vec2 n2 = N2.xy * 2.0 - 1.0;
  n2 = vec2(ca * n2.x + sa * n2.y, -sa * n2.x + ca * n2.y);
  vec2 nxy = mix(N1.xy * 2.0 - 1.0, n2, t);
  float ao = mix(N1.b, N2.b, t);
  float rough0 = mix(N1.a, N2.a, t);

  vec2 muv = (P.xz - uGroundRect.xy) / uGroundRect.zw;
  vec4 M = texture2D(tGroundMask, muv);
  float inMask = step(0.0, muv.x) * step(muv.x, 1.0) * step(0.0, muv.y) * step(muv.y, 1.0);
  M = mix(vec4(0.0, 0.3, 0.0, 1.0), M, inMask);

  float h = A.a;
  vec3 albedo = A.rgb;
  float fine = vn2(gp * 3.1);
  albedo *= 0.92 + 0.16 * vn2(gp * 0.7);
  albedo = mix(albedo, albedo * vec3(0.62, 0.52, 0.44), M.g * 0.7);
  albedo *= mix(0.72, 1.0, M.a);
  albedo = mix(albedo, albedo * vec3(1.18, 1.12, 1.08), M.b * 0.5);

  // wetness: water collects in joints first, then drowns the stones
  float fill = M.r * 1.3 + (1.0 - h) * 0.3 - 0.14;
  float puddle = smoothstep(0.5, 0.6, fill) * uWet;
  float damp = clamp(uWet * (0.5 + 0.5 * vn2(gp * 0.31)) * (0.55 + M.g * 0.5) + puddle, 0.0, 1.0);
  albedo *= mix(1.0, 0.6, damp);
  float rough = mix(rough0, 0.05, puddle);
  rough = mix(rough, rough * 0.5, damp * (1.0 - puddle)) * mix(1.0, 0.75, M.b);

  vec3 Nt = normalize(vec3(nxy.x * 1.0, 1.0, nxy.y * 1.0));
  vec3 N = normalize(mix(Nt, vec3(0.0, 1.0, 0.0), puddle * 0.92));
  // ripples in standing water
  if (puddle > 0.01) {
    vec2 rp = gp * 6.0;
    N = normalize(N + vec3(vn2(rp + uTime * 0.4) - 0.5, 0.0, vn2(rp.yx - uTime * 0.37) - 0.5) * 0.05 * puddle);
  }

  vec3 hemi = mix(uGroundAmb, uSkyAmb, N.y * 0.5 + 0.5);
  float mw = clamp((dot(N, uMoonDir) + 0.1) / 1.1, 0.0, 1.0);
  float sh = moonShadow(P, vec3(0.0, 1.0, 0.0));
  vec3 moon = uMoonCol * mw * sh;
  vec3 diff, spec;
  lightSum(P, N, V, rough, 0.1, diff, spec);

  vec3 col = albedo * (hemi * ao * M.a + moon * ao + diff * mix(1.0, ao, 0.5));
  float specAmt = mix(0.5, 1.5, damp);
  col += spec * specAmt * ao;

  vec3 R = reflect(-V, N);
  float fr = 0.05 + 0.95 * pow(1.0 - max(dot(vec3(0.0, 1.0, 0.0), V), 0.0), 4.0);
  float mirrorAmt = (puddle * 1.0 + damp * 0.4 * (1.0 - rough)) ;
  // analytic lamp glints
  col += lightMirror(P, R, 0.12 + rough * 0.9, 0.018 + rough * 0.18) * mirrorAmt * (0.5 + fr);
  // planar reflection of the real scene
  if (uReflReady > 0.5) {
    vec4 rp = uReflVP * vec4(P, 1.0);
    vec2 ruv = rp.xy / rp.w * 0.5 + 0.5;
    ruv += N.xz * (0.02 + 0.07 * (1.0 - puddle));
    vec3 rc = texture2D(uReflMap, ruv, 0.5 + rough * 5.0).rgb;
    float rAmt = (puddle * 0.95 + damp * 0.22 * (1.0 - rough)) * (0.35 + 0.65 * fr) * uReflStrength;
    col = mix(col, col + rc * albedo * 0.2, 0.0) + rc * rAmt * 0.9;
  } else {
    col += uSkyAmb * 3.0 * fr * mirrorAmt;
  }
  gl_FragColor = vec4(applyFog(col, P), 1.0);
}
`;

export const WATER_FRAG = /* glsl */ `
${COMMON_GLSL}
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
void main(){
  vec3 P = vWorld;
  vec3 V = normalize(cameraPosition - P);
  vec2 q = P.xz;
  float t = uTime;
  // layered ripples drifting slowly with the canal flow
  vec2 g = vec2(0.0);
  for (int i = 0; i < 3; i++) {
    float f = 0.9 + float(i) * 1.7;
    vec2 d = vec2(0.37 + float(i) * 0.21, 0.18 - float(i) * 0.12) * t * (0.3 + float(i) * 0.2);
    float e = 0.07;
    float c = vn2(q * f + d);
    g += vec2(vn2(q * f + d + vec2(e, 0.0)) - c, vn2(q * f + d + vec2(0.0, e)) - c) * (1.0 / e) * 0.16 / (1.0 + float(i));
  }
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 R = reflect(-V, N);
  float fr = 0.03 + 0.97 * pow(1.0 - max(N.y * 0.5 + 0.5 * dot(N, V), 0.0), 4.0);
  vec3 deep = vec3(0.004, 0.011, 0.02);
  vec3 sky = uSkyAmb * 1.2 + vec3(0.012, 0.016, 0.026);
  vec3 col = deep + sky * fr * 0.55;
  col += lightMirror(P, R, 0.2, 0.035) * (0.55 + fr) * 1.2;
  col += vec3(0.5, 0.3, 0.14) * exp(-max(P.z - 4.9, 0.0) / 2.2) * (0.012 + 0.02 * vn2(vec2(P.x * 0.7 + uTime * 0.15, P.z * 2.0)));
  vec3 diff, spec; lightSum(P, N, V, 0.06, 0.0, diff, spec);
  col += spec * 0.7 + diff * deep * 0.5;
  gl_FragColor = vec4(applyFog(col, P), 1.0);
}
`;

export const DECAL_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D tDecal;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
varying vec4 vTint;
varying vec4 vAux;
void main(){
  vec4 D = texture2D(tDecal, vUv);
  if (D.a < 0.01) discard;
  vec3 P = vWorld;
  vec3 V = normalize(cameraPosition - P);
  vec3 N = vec3(0.0, 1.0, 0.0);
  vec3 albedo = D.rgb * vTint.rgb * 0.75;
  vec3 hemi = mix(uGroundAmb, uSkyAmb, 1.0);
  float sh = moonShadow(P, N);
  float mw = clamp((dot(N, uMoonDir) + 0.1) / 1.1, 0.0, 1.0);
  vec3 diff, spec; lightSum(P, N, V, 0.45, 0.1, diff, spec);
  vec3 col = albedo * (hemi + uMoonCol * mw * sh + diff) + spec * 0.4 + D.rgb * vAux.y * 2.0;
  gl_FragColor = vec4(applyFog(col, P), D.a * vTint.a);
}
`;
