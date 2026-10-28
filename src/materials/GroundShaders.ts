import { COMMON_GLSL } from './ShaderChunks';

/** rain on standing water (?rain, journal Passe W1): rings that open and fade, two staggered layers of cells; a normal offset (xz) */
const RAIN_GLSL = /* glsl */ `
uniform float uRain;
vec2 rainRings(vec2 p, float t){
  vec2 g = vec2(0.0);
  for (int k = 0; k < 2; k++) {
    vec2 q = p * 2.6 + float(k) * vec2(0.37, 0.61);
    vec2 c = floor(q), f = fract(q) - 0.5;
    float h = hash13(vec3(c, float(k)));
    float ph = fract(t * (0.9 + 0.5 * h) + h * 7.0);
    vec2 d = f - (vec2(hash13(vec3(c, 3.1 + float(k))), hash13(vec3(c, 7.7 + float(k)))) - 0.5) * 0.5;
    float r = length(d), R = ph * 0.42;
    float w = exp(-(r - R) * (r - R) * 420.0) * (1.0 - ph) * step(h, 0.35 + 0.6 * uRain);
    g += d / max(r, 1e-3) * w * sin((r - R) * 46.0);
  }
  return g;
}
`;

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
uniform float uSnow;
${RAIN_GLSL}
uniform float uReflStrength;
uniform float uReflReady;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;

void main(){
  vec3 P = vWorld;
  vec3 V = normalize(cameraPosition - P);
  vec2 gp = P.xz;
#ifdef COBBLE_SCALE
  // the version 2's squares (journal Passe VP6): smaller setts (compiled there only; the district's ground is the code without it)
  gp *= COBBLE_SCALE;
#endif
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
#ifdef COBBLE_CONTRAST
  // the setts' contrast toward their mean (the coarsest mip): a quieter floor under the characters
  A.rgb = mix(mix(texture2D(tCobble, uvA, 10.0).rgb, texture2D(tCobble, uvB, 10.0).rgb, t), A.rgb, COBBLE_CONTRAST);
#endif
#ifdef FLAGS
  // the hall's square (journal Passe VP9): its setts crossed by bands of flags laid as a compass about the square's middle, FLAGS = (centre x,
  // centre z, inner ring, outer ring): eight rays, two rings and the medallion's rim (the forecourt's setts and its way of flags made the two
  // squares read as one template, the first critique; [KO] great flags over the whole floor, « a CG or bathroom floor », the second; [KO] a
  // lattice of bands on the diagonal, « a regular grid of stone bands that reads like paving tiles or a car park », the third): each band
  // 0.48 m wide of slabs 0.62 m long, a little lighter than the setts' own mean, each slab its own shade, the joints dark and low, a fine
  // grain faded under a few pixels
  {
    vec2 fq = P.xz - FLAGS.xy;
    float fr = length(fq), fth = atan(fq.y, fq.x), sec = 0.78539816, fti = floor(fth / sec + 0.5), dth = fth - fti * sec;
    float dRay = abs(sin(dth)) * fr, onRay = step(dRay, 0.24) * step(1.3, fr) * step(0.0, cos(dth));
    float rr = abs(fr - FLAGS.z) < abs(fr - FLAGS.w) ? FLAGS.z : FLAGS.w, dRing = abs(fr - rr), onRing = step(dRing, 0.24);
    float dRim = abs(fr - 1.1), onRim = step(dRim, 0.24), band = max(max(onRay, onRing), onRim);
    if (band > 0.0) {
      // along a ray the slabs follow the radius; along a ring or the rim, its arc
      bool ray = onRay > 0.0 && onRing < 1.0 && onRim < 1.0;
      float along = ray ? fr : fth * (onRim > 0.0 ? 1.1 : rr), across = ray ? dRay : (onRim > 0.0 ? dRim : dRing);
      float key = ray ? fti * 3.7 : (onRim > 0.0 ? 11.3 : rr * 1.9);
      float sl = floor(along / 0.62), sf = fract(along / 0.62), fh = fract(sin(sl * 12.9898 + key) * 43758.5453);
      float fw = length(fwidth(P.xz)), fwq = fw / 0.62, je = min(min(sf, 1.0 - sf) * 0.62, 0.24 - across);
      float joint = (1.0 - smoothstep(0.012, 0.024 + fw * 0.5, je)) * (1.0 - smoothstep(0.08, 0.2, fwq));
      float fgr = mix(0.5, vn2(P.xz * 7.0), 1.0 - smoothstep(0.3, 0.7, fwidth(P.x) * 7.0));
      vec3 mean = mix(texture2D(tCobble, uvA, 10.0).rgb, texture2D(tCobble, uvB, 10.0).rgb, 0.5);
      vec3 flag = mean * vec3(1.16, 1.14, 1.1) * (0.86 + 0.24 * fh) * (0.9 + 0.2 * fgr);
      A = vec4(mix(flag, mean * 0.45, joint * 0.8), mix(0.7 + 0.1 * fh, 0.12, joint));
      nxy = (vec2(vn2(P.xz * 2.3 + fh * 7.0), vn2(P.xz * 2.3 + 3.1 + fh * 5.0)) - 0.5) * 0.12;
      ao = 1.0 - 0.5 * joint; rough0 = mix(0.6, 0.9, joint);
    }
  }
#endif
#ifdef SAND
  // the training ground's beaten earth (journal Passe VP6): broad damp and dry patches, clods, grain and dark grit at their own scales (in
  // metres, the setts' scale left aside), a rake's arcs that the feet erase (below, with the mask's wear); the fifth critique: « a flat beige
  // plane with no grain, rake marks or colour variation ». SAND_RECT (x0, z0, x1, z1): the yard within the setts, its edge frayed by noise, the
  // earth spilt onto the stones (the sixth: « a flat beige quad with hard straight edges »); without it, the whole plane
  vec2 rakeN = vec2(0.0);
  float yard = 1.0;
#ifdef SAND_RECT
  {
    vec4 YR = SAND_RECT;
    vec2 yc = (YR.xy + YR.zw) * 0.5, yh = (YR.zw - YR.xy) * 0.5, yq = abs(P.xz - yc) - yh + 1.5;
    float sd = length(max(yq, 0.0)) + min(max(yq.x, yq.y), 0.0) - 1.5;
    // (frayed less since journal Passe VP8: its south edge runs along a timber edging, the third critique's « noisy, jagged blend rather than a
    // built edge »)
    float fray = (vn2(P.xz * 0.8) - 0.5) * 0.8 + (vn2(P.xz * 3.9) - 0.5) * 0.32;
    yard = 1.0 - smoothstep(-0.3, 0.3, sd + fray);
  }
#endif
  if (yard > 0.0) {
    vec2 sp = P.xz;
    // the fine grain faded where it gets finer than a pixel or two (journal Passe VP8, the first critique: « the right half of the dirt shows
    // horizontal streaks, as if the texture were stretched along the view »: at the framings' low pitch the grit and the fine noise alias)
    float fw = max(fwidth(sp.x), fwidth(sp.y)), aa21 = 1.0 - smoothstep(0.25, 0.6, fw * 21.0), aa9 = 1.0 - smoothstep(0.25, 0.6, fw * 8.5);
    float l1 = vn2(sp * 0.13), l2 = vn2(sp * 0.47 + 4.3), g1 = vn2(sp * 2.2), g2 = mix(0.5, vn2(sp * 8.5 + 1.7), aa9);
    float grit = smoothstep(0.72, 0.9, vn2(sp * 21.0)) * (0.5 + 0.5 * g1) * aa21;
    // (the damp patches nearer the dry since journal Passe VP9: under the lists' fires at night « a leopard print », both panels)
    vec3 dry = vec3(0.086, 0.069, 0.049), damp0 = vec3(0.066, 0.052, 0.038);
    vec3 sand = mix(damp0, dry, smoothstep(0.25, 0.75, l1 * 0.7 + l2 * 0.3));
    sand *= 0.78 + 0.26 * l2 + 0.2 * g1 + 0.12 * g2;
    sand *= 1.0 - 0.38 * grit;
    // pebbles in the earth (journal Passe VP9: « a blurry, low-frequency smear with no detail (no stones, rake marks or tufts) », both panels of
    // its first critique): in cells of 0.32 m one stone in three at a random offset, a few centimetres across, lighter or darker than the earth,
    // faded where the cells come under a few pixels
    vec2 pc = sp / 0.32, pci = floor(pc), pcf = fract(pc) - 0.5;
    float ph1 = fract(sin(dot(pci, vec2(127.1, 311.7))) * 43758.5453), ph2 = fract(sin(dot(pci, vec2(269.5, 183.3))) * 43758.5453);
    vec2 po = (vec2(ph1, ph2) - 0.5) * 0.5;
    float pd = length(pcf - po) / (0.1 + 0.12 * ph2), aaP = 1.0 - smoothstep(0.35, 0.9, fw * 18.0);
    float peb = (1.0 - smoothstep(0.6, 1.0, pd)) * step(ph1, 0.36) * aaP;
    sand = mix(sand, sand * (ph2 > 0.5 ? 1.5 : 0.55), peb);
    // the rake: arcs round a point off the yard, 15 cm apart, wavering
    vec2 rc = sp - vec2(-26.0, 18.0);
    float rr = length(rc), ph = rr * 41.0 + l2 * 4.0 + g1 * 0.8;
    // (faded where its arcs come closer than about ten pixels, journal Passe VP7, iteration 6: beyond the camera's feet they read as
    // « corrugated stripes », « moiré »; the rake marks stay at the near edge)
    float rakeA = 1.0 - smoothstep(0.25, 0.7, fwidth(ph));
    float rakeH = sin(ph) * rakeA;
    // (fainter since journal Passe VP9: « wavy, brushed streaks [that] look like stretched texture or mud », the second critique)
    rakeN = (rc / rr) * cos(ph) * 0.2 * yard * rakeA;
    A = mix(A, vec4(sand * (1.0 + 0.04 * rakeH), 0.5 + 0.2 * g1 + 0.08 * rakeH), yard);
    vec2 sn = (vec2(vn2(sp * 3.3 + 3.1), vn2(sp * 3.3 + 7.7)) - 0.5) * 0.42 + (vec2(vn2(sp * 11.0), vn2(sp * 11.0 + 5.0)) - 0.5) * 0.18 * aa9 + (pcf - po) * peb * 1.6;
    nxy = mix(nxy, sn, yard);
    ao = mix(ao, 1.0 - 0.25 * grit, yard); rough0 = mix(rough0, 0.95, yard);
  }
#endif

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
#ifdef SAND
  // the feet tread the rake flat and darken the earth where they go (the mask's wear; the setts' polish undone on the earth)
  float trod = smoothstep(0.08, 0.7, M.b);
  albedo *= mix(1.0, 0.62, trod * yard) / mix(1.0, 1.12, M.b * 0.5 * yard);
  nxy += rakeN * (1.0 - trod);
#endif

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
    if (uRain > 0.0) { vec2 rr = rainRings(gp, uTime) * 0.45 * puddle * uRain; N = normalize(N + vec3(rr.x, 0.0, rr.y)); }
  }
  // snow (?snow): a cover on the cobbles, thinner in the joints and where the puddles were (they freeze dark); uSnow = 0 skips it
  if (uSnow > 0.0) {
    float cover = smoothstep(0.42, 0.85, vn2(gp * 0.55) * 0.45 + vn2(gp * 2.7) * 0.25 + h * 0.4 - M.r * 0.5 + 0.3 * uSnow) * min(1.0, uSnow * 1.2);
    albedo = mix(albedo, vec3(0.36, 0.38, 0.44), cover);
    rough = mix(rough, 0.92, cover);
    puddle *= 1.0 - cover; damp *= 1.0 - cover;
    N = normalize(mix(N, vec3(0.0, 1.0, 0.0), cover * 0.6));
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
  // cool moon sheen on the wet stone, strongest in standing water
  col += moonSpec(N, V, max(rough, 0.08), sh) * (0.2 + damp * 0.9 + puddle * 0.8) * ao;

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
    col += skyColor(R) * fr * mirrorAmt;
  }
  gl_FragColor = vec4(applyFog(col, P), 1.0);
}
`;

export const WATER_FRAG = /* glsl */ `
${COMMON_GLSL}
uniform sampler2D uReflMap;
uniform mat4 uReflVP;
uniform float uReflStrength;
uniform float uReflReady;
uniform float uWaterY;
uniform vec2 uReflProxy;
${RAIN_GLSL}
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
void main(){
  vec3 P = vWorld;
  vec3 V = normalize(cameraPosition - P);
  float t = uTime;
  float dist = distance(P, cameraPosition);
  // anisotropic ripples: crests run across the canal, so reflections stretch toward the viewer as streaks
  vec2 q = vec2(P.x, P.z * 0.38);
  vec2 g = vec2(0.0);
  for (int i = 0; i < 3; i++) {
    float f = 0.75 + float(i) * 1.55;
    vec2 d = vec2(0.31 + float(i) * 0.17, 0.11 - float(i) * 0.07) * t * (0.35 + float(i) * 0.2);
    float e = 0.07;
    float c = vn2(q * f + d);
    g += vec2(vn2(q * f + d + vec2(e, 0.0)) - c, vn2(q * f + d + vec2(0.0, e)) - c) * (1.0 / e) * 0.13 / (1.0 + float(i) * 0.8);
  }
  g.y *= 0.38;
  g /= 1.0 + dist * 0.01;
  // rain (?rain): rings on the canal, fading with distance (uRain = 0 skips it)
  if (uRain > 0.0) g -= rainRings(P.xz, uTime) * 0.5 * uRain / (1.0 + dist * 0.04);
  vec3 N = normalize(vec3(-g.x, 1.0, -g.y));
  vec3 R = reflect(-V, N);
  float fr = 0.02 + 0.98 * pow(1.0 - max(dot(N, V), 0.0), 5.0);
  vec3 deep = vec3(0.003, 0.007, 0.015);
  vec3 refl;
  if (uReflReady > 0.5) {
    // the planar pass mirrors about the street plane; re-aim the lookup as if mirrored about the water.
    // Depth of the mirrored content comes from a proxy: the frontage plane while the ray meets it below the
    // ridgeline, otherwise the far city
    vec3 Cw = vec3(cameraPosition.x, 2.0 * uWaterY - cameraPosition.y, cameraPosition.z);
    vec3 dw = normalize(P - Cw);
    float sw = 140.0;
    if (dw.z < -0.02) { float sf = (uReflProxy.x - Cw.z) / dw.z; if (sf > 0.0 && Cw.y + dw.y * sf < uReflProxy.y) sw = sf; }
    vec3 Q = Cw + dw * sw;
    vec4 rp = uReflVP * vec4(Q, 1.0);
    vec2 ruv = rp.xy / rp.w * 0.5 + 0.5;
    vec2 fw = normalize(-V.xz + 1e-5), rt = vec2(fw.y, -fw.x);
    // ripples smear the mirror image toward the viewer: lights and the moon break into vertical glades
    ruv += vec2(dot(N.xz, rt) * 0.04, dot(N.xz, fw) * 0.3);
    refl = texture2D(uReflMap, clamp(ruv, 0.001, 0.999), 0.6).rgb;
  } else refl = skyColor(R);
  vec3 col = deep + refl * fr * uReflStrength * 0.92;
  col += lightMirror(P, R, 0.16, 0.026) * (0.4 + fr) * 1.1;
  col += moonSpec(N, V, 0.11, 1.0) * 0.55;
  // faint warm spill from the street along the north quay
  col += vec3(0.5, 0.3, 0.14) * exp(-max(P.z - 4.95, 0.0) / 1.8) * (0.008 + 0.014 * vn2(vec2(P.x * 0.7 + uTime * 0.15, P.z * 2.0)));
  vec3 diff, spec; lightSum(P, N, V, 0.06, 0.0, diff, spec);
  col += spec * 0.6 + diff * deep * 0.5;
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
