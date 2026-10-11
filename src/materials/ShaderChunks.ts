import { MAX_LIGHTS, LIGHT_GRID, OCC_MAX } from '../atmosphere/SceneUniforms';

/** Shared GLSL: the whole look hinges on COOL AMBIENT + WARM LOCAL lights, so every shader
 *  (surfaces, ground, water, sprites, decals) evaluates the same light list and fog. */
export const COMMON_GLSL = /* glsl */ `
#define MAX_LIGHTS ${MAX_LIGHTS}
uniform float uTime;
uniform vec4 uLightPos[MAX_LIGHTS];
uniform vec4 uLightCol[MAX_LIGHTS];
uniform int uLightCount;
uniform vec3 uMoonDir;
uniform vec3 uMoonCol;
uniform vec3 uSkyAmb;
uniform vec3 uGroundAmb;
uniform vec3 uFillDir;
uniform vec3 uFillCol;
uniform vec3 uFogColor;
uniform float uFogDensity;
uniform float uFogStart;
uniform float uFogFalloff;
uniform float uFogBase;
uniform float uMist;
uniform vec3 uSkyZenith;
uniform vec3 uCityGlow;
uniform vec3 uCityDir;
uniform float uMoonSpec;
uniform sampler2D uShadowMap;
uniform mat4 uShadowVP;
uniform float uShadowTexel;
uniform float uShadowOn;
uniform float uClipY;
uniform float uWarmGain;
uniform sampler2D uLightGrid;
uniform vec4 uGridRect;
uniform vec2 uGridDim;

float hash13(vec3 p){ p = fract(p*0.1031); p += dot(p, p.zyx+31.32); return fract((p.x+p.y)*p.z); }
float hash12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*0.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
float vn3(vec3 p){
  vec3 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  float a = hash13(i), b = hash13(i+vec3(1,0,0)), c = hash13(i+vec3(0,1,0)), d = hash13(i+vec3(1,1,0));
  float e = hash13(i+vec3(0,0,1)), g = hash13(i+vec3(1,0,1)), h = hash13(i+vec3(0,1,1)), k = hash13(i+vec3(1,1,1));
  return mix(mix(mix(a,b,f.x), mix(c,d,f.x), f.y), mix(mix(e,g,f.x), mix(h,k,f.x), f.y), f.z);
}
float vn2(vec2 p){
  vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), f.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), f.x), f.y);
}

float moonShadow(vec3 P, vec3 N){
  if (uShadowOn < 0.5) return 1.0;
  vec4 sp = uShadowVP * vec4(P + N * 0.07, 1.0);
  vec3 sc = sp.xyz / sp.w * 0.5 + 0.5;
  if (sc.x < 0.0 || sc.x > 1.0 || sc.y < 0.0 || sc.y > 1.0 || sc.z > 1.0) return 1.0;
  float bias = 0.0011;
  float s = 0.0;
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) {
    float d = textureLod(uShadowMap, sc.xy + vec2(float(i), float(j)) * uShadowTexel * 1.4, 0.0).r;
    s += (sc.z - bias > d) ? 0.0 : 1.0;
  }
  return s / 9.0;
}

float ggx(float ndh, float a){
  float a2 = a*a; float d = ndh*ndh*(a2-1.0)+1.0;
  return min(a2 / (3.14159 * d * d + 1e-4), 40.0);
}

void lightOne(int i, vec3 P, vec3 N, vec3 V, float rough, float a, float wrap, inout vec3 diff, inout vec3 spec){
  vec4 lp = uLightPos[i];
  vec3 L = lp.xyz - P;
  float d2 = dot(L, L), r2 = lp.w * lp.w;
  if (d2 >= r2) return;
  float d = sqrt(d2); L /= d;
  float x = 1.0 - d2 / r2;
  float att = x * x / (1.0 + d2 * 0.22);
  float ndl = dot(N, L);
  float w = clamp((ndl + wrap) / (1.0 + wrap), 0.0, 1.0);
  vec3 c = uLightCol[i].rgb * att;
  diff += c * w;
  if (ndl > 0.0 && rough < 0.97) {
    vec3 H = normalize(L + V);
    float ndh = max(dot(N, H), 0.0);
    float vdh = max(dot(V, H), 0.0);
    float F = 0.04 + 0.96 * pow(1.0 - vdh, 5.0);
    spec += c * ggx(ndh, a) * F * ndl;
  }
}

// only the lights listed for this ground cell (LightRig.buildGrid) can reach P: walk that list, not all lights
void lightSum(vec3 P, vec3 N, vec3 V, float rough, float wrap, out vec3 diff, out vec3 spec){
  diff = vec3(0.0); spec = vec3(0.0);
  float a = max(rough*rough, 0.012);
  vec2 g = (P.xz - uGridRect.xy) / uGridRect.zw;
  if (g.x < 0.0 || g.y < 0.0 || g.x >= uGridDim.x || g.y >= uGridDim.y) return;
  int cell = int(g.x) + int(g.y) * int(uGridDim.x);
  bool done = false;
  for (int t = 0; t < ${LIGHT_GRID.per / 4}; t++) {
    if (done) break;
    vec4 q = texelFetch(uLightGrid, ivec2(cell, t), 0) * 255.0;
    for (int k = 0; k < 4; k++) {
      int i = int(q[k] + 0.5);
      if (i >= 255) { done = true; break; }
      lightOne(i, P, N, V, rough, a, wrap, diff, spec);
    }
  }
  diff *= uWarmGain; spec *= uWarmGain;
}

// Analytic mirror image of every light along reflection vector R: cheap, sharp, ripple-friendly lamp glints.
vec3 lightMirror(vec3 P, vec3 R, float sizeBase, float sizeGrow){
  vec3 sum = vec3(0.0);
  for (int i = 0; i < MAX_LIGHTS; i++) {
    if (i >= uLightCount) break;
    vec4 lp = uLightPos[i];
    vec3 L = lp.xyz - P;
    float t = dot(L, R);
    if (t < 0.2) continue;
    vec3 c = L - R * t;
    float s = sizeBase + sizeGrow * t;
    float d2 = dot(c, c);
    float glow = exp(-d2 / (s * s));
    float far = 1.0 - smoothstep(lp.w * 0.7, lp.w * 1.6, t);
    sum += uLightCol[i].rgb * glow * far * (0.35 / (1.0 + t * 0.06));
  }
  return sum * uWarmGain;
}

// Moon glint (GGX) for wet / glossy surfaces: the low moon sits in front of the camera, so this is the cool
// sheen that leads the eye down the street and across the canal.
vec3 moonSpec(vec3 N, vec3 V, float rough, float sh){
  float ndl = dot(N, uMoonDir);
  if (ndl <= 0.0) return vec3(0.0);
  vec3 H = normalize(uMoonDir + V);
  float ndh = max(dot(N, H), 0.0), vdh = max(dot(V, H), 0.0);
  float F = 0.04 + 0.96 * pow(1.0 - vdh, 5.0);
  return uMoonCol * ggx(ndh, max(rough * rough, 0.012)) * F * ndl * sh * uMoonSpec;
}

// Horizon haze: what distant layers dissolve into. Slate-indigo, a desaturated warm lift low over the
// upper city, and forward scatter around the moon. The sky dome uses the same function at the horizon,
// so fully fogged silhouettes melt into the sky without a seam.
vec3 skyHaze(vec3 rd){
  float low = 1.0 - smoothstep(-0.04, 0.3, rd.y);
  vec2 hd = rd.xz / max(length(rd.xz), 1e-4);
  float toward = pow(max(dot(hd, normalize(uCityDir.xz)), 0.0), 5.0);
  vec3 c = uFogColor * (0.84 + 0.16 * low);
  c += uCityGlow * low * low * (0.25 + 0.75 * toward);
  float mu = max(dot(rd, uMoonDir), 0.0);
  c += uMoonCol * (0.016 * pow(mu, 6.0) + 0.04 * pow(mu, 56.0));
  return c;
}
vec3 skyColor(vec3 rd){
  // the gradient resolves inside the framed band of sky: luminous haze at the horizon, deep indigo by ~15 deg
  return mix(skyHaze(rd), uSkyZenith, smoothstep(-0.01, 0.27, rd.y));
}

// Optical depth of exponential height fog along a straight segment (closed form, no marching).
float fogDepth(float y0, float y1, float len, float b){
  float a0 = -b * max(y0 - uFogBase, -2.0), a1 = -b * max(y1 - uFogBase, -2.0);
  float da = a1 - a0;
  float avg = abs(da) > 1e-4 ? (exp(a1) - exp(a0)) / da : exp(a0);
  return len * avg;
}
float fogAmount(vec3 P, out vec3 rd){
  vec3 ro = cameraPosition;
  vec3 dv = P - ro;
  float L = length(dv);
  rd = dv / max(L, 1e-4);
  float s = min(uFogStart, L);
  // the reflection camera sits below the street plane: start its fog at the plane, not underground
  float y0 = max(ro.y, 0.0) + rd.y * s;
  float od = uFogDensity * (fogDepth(y0, P.y, L - s, uFogFalloff) + uMist * fogDepth(y0, P.y, L - s, 0.32));
  return clamp(1.0 - exp(-od), 0.0, 0.985);
}
// fog resolves to the sky colour of the same direction, so every silhouette stays darker than the sky behind it
vec3 applyFog(vec3 c, vec3 P){
  vec3 rd;
  float f = fogAmount(P, rd);
  return mix(c, skyColor(rd), f);
}
`;

export const SURFACE_VERT = /* glsl */ `
attribute vec4 aTint;
attribute vec4 aAux;
uniform float uTime;
uniform float uWindAmp;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
varying vec4 vTint;
varying vec4 vAux;
#ifdef OCC
  attribute float aOcc;
  varying float vOcc;
#endif
#ifdef OCC_INST
  uniform float uOccBase;
  varying float vOcc;
#endif
void main(){
  #ifdef OCC
    vOcc = aOcc;
  #endif
  #ifdef OCC_INST
    vOcc = uOccBase + float(gl_InstanceID);
  #endif
  mat4 model = modelMatrix;
  #ifdef USE_INSTANCING
    model = modelMatrix * instanceMatrix;
  #endif
  vec4 wp = model * vec4(position, 1.0);
  vec3 n = normalize(mat3(model) * normal);
  #ifdef WIND
    float sw = aAux.x;
    if (sw > 0.0) {
      float ph = wp.x * 0.55 + wp.z * 0.8 + aAux.z * 6.0;
      vec3 d = vec3(sin(uTime * 1.6 + ph) * 0.55 + sin(uTime * 3.3 + ph * 1.9) * 0.22,
                    sin(uTime * 2.4 + ph * 1.3) * 0.12,
                    cos(uTime * 1.25 + ph * 0.7) * 0.5 + sin(uTime * 2.9 + ph * 2.1) * 0.15);
      wp.xyz += d * sw * uWindAmp * 0.12;
    }
  #endif
  vWorld = wp.xyz; vNormal = n; vUv = uv; vTint = aTint; vAux = aAux;
  #ifdef USE_INSTANCING_COLOR
    vTint.rgb *= instanceColor;
  #endif
  gl_Position = projectionMatrix * viewMatrix * wp;
}
`;

export const SURFACE_FRAG = /* glsl */ `
${COMMON_GLSL}
vec3 perturbNormal(vec3 N, vec3 P, vec2 uv, vec3 mapN){
  vec3 dp1 = dFdx(P), dp2 = dFdy(P);
  vec2 duv1 = dFdx(uv), duv2 = dFdy(uv);
  vec3 dp2perp = cross(dp2, N), dp1perp = cross(N, dp1);
  vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
  vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
  float m = max(dot(T,T), dot(B,B));
  if (m < 1e-14) return N;
  float invmax = inversesqrt(m);
  return normalize(mat3(T*invmax, B*invmax, N) * mapN);
}


uniform sampler2D tAlbedo;
uniform sampler2D tNR;
uniform vec2 uTile;
uniform vec3 uBase;
uniform float uRough;
uniform float uNormalAmt;
uniform float uSpecAmt;
uniform float uContact;
uniform float uBreakup;
uniform vec3 uDirt;
uniform float uEmissive;
uniform float uWrap;
uniform float uTrans;
varying vec3 vWorld;
varying vec3 vNormal;
varying vec2 vUv;
varying vec4 vTint;
varying vec4 vAux;

#if defined(OCC) || defined(OCC_INST)
// Player occlusion reveal: only occludable surfaces carry this variant (the one place a fragment discard is paid).
// A fragment is removed -- colour AND depth -- when the occluder stands between the camera and the player and
// falls inside the player's screen-space reveal ellipse; the sprite behind then passes its depth test.
uniform float uOccFade[${OCC_MAX}];
uniform vec4 uOccC;
uniform vec4 uOccR;
varying float vOcc;
float occBayer4(vec2 p){
  const float M[16] = float[16](0.0, 8.0, 2.0, 10.0, 12.0, 4.0, 14.0, 6.0, 3.0, 11.0, 1.0, 9.0, 15.0, 7.0, 13.0, 5.0);
  ivec2 i = ivec2(mod(p, 4.0));
  return (M[i.y * 4 + i.x] + 0.5) / 16.0;
}
void occReveal(){
  if (uClipY > -100.0) return;
  float f = uOccFade[int(vOcc + 0.5)];
  if (f <= 0.002) return;
  float vz = -(viewMatrix * vec4(vWorld, 1.0)).z;
  if (vz > uOccC.z - 0.35) return;
  vec2 fc = floor(gl_FragCoord.xy);
  float n = length((gl_FragCoord.xy - uOccC.xy) / uOccR.xy);
  float k = uOccR.z;
  float ign = fract(52.9829189 * fract(dot(fc, vec2(0.06711056, 0.00583715))));
  float bay = occBayer4(floor(fc * 0.5));
  float cov, thr;
  if (uOccC.w < 0.5) { cov = 1.0 - smoothstep(0.6, k, n); thr = ign; }
  else if (uOccC.w < 1.5) { cov = 1.0 - smoothstep(0.8, k, n); thr = bay; }
  else { cov = 1.0 - smoothstep(0.55, k, n); thr = mix(ign, bay, smoothstep(0.9, 1.25, n)); }
  if (cov * f > thr) discard;
}
#endif

void main(){
  #if defined(OCC) || defined(OCC_INST)
    occReveal();
  #endif
  vec3 V = normalize(cameraPosition - vWorld);
  #ifdef GLOW
    vec4 G = texture2D(tAlbedo, vUv);
    float fl = 0.93 + 0.12 * sin(uTime * (3.0 + vAux.z * 4.0) + vAux.z * 40.0) + 0.05 * sin(uTime * 9.0 + vAux.z * 90.0);
    // unlit glass (aux.y = 0) only mirrors a little sky; lit glass flickers at full strength
    vec3 e = G.rgb * vTint.rgb * vTint.a * uEmissive * mix(0.42, fl, vAux.y);
    gl_FragColor = vec4(applyFog(e, vWorld), 1.0);
    return;
  #endif
  vec2 uv = vUv / uTile;
  vec4 A = texture2D(tAlbedo, uv);
  #ifdef LEAF
    if (A.a < 0.5) discard;
  #endif
  vec4 NR = texture2D(tNR, uv);
  vec3 N = normalize(vNormal);
  #ifdef DOUBLE
    if (!gl_FrontFacing) N = -N;
  #endif
  vec3 mapN = normalize(vec3((NR.xy * 2.0 - 1.0) * uNormalAmt, 1.0));
  N = perturbNormal(N, vWorld, uv, mapN);
  vec3 albedo = A.rgb * uBase * vTint.rgb;
  float bk = vn3(vWorld * 0.42 + vec3(vAux.z * 13.0));
  albedo *= 1.0 + (bk - 0.5) * uBreakup;
  float gc = 1.0 - smoothstep(0.0, 1.15, vWorld.y);
  albedo = mix(albedo, albedo * uDirt, gc * uContact);
  float ao = vTint.a * mix(1.0, NR.b, 0.9);
  ao *= mix(1.0, 0.55 + 0.45 * smoothstep(0.0, 0.8, vWorld.y), uContact);
  float rough = clamp(uRough * (0.65 + 0.7 * NR.a), 0.04, 1.0);
  #ifdef LEAF
    N = normalize(mix(N, vec3(0.0, 1.0, 0.0), 0.55));
  #endif
  vec3 hemi = mix(uGroundAmb, uSkyAmb, N.y * 0.5 + 0.5) + uFillCol * clamp(dot(N, uFillDir) * 0.7 + 0.3, 0.0, 1.0);
  // the low moon only grazes the frontages: small wrap keeps vertical planes dark and roofs/edges rim-lit
  float mw = clamp((dot(N, uMoonDir) + 0.14) / 1.14, 0.0, 1.0);
  float sh = mw > 0.0 ? moonShadow(vWorld, N) : 1.0;
  vec3 moon = uMoonCol * mw * sh;
  vec3 diff, spec;
  lightSum(vWorld, N, V, rough, uWrap, diff, spec);
  #ifdef DOUBLE
    // cloth lets lantern light glow through from the back
    vec3 diffB, specB;
    lightSum(vWorld, -N, V, 1.0, 0.0, diffB, specB);
    diff += diffB * uTrans;
  #endif
  vec3 col = albedo * (hemi * ao + moon * mix(1.0, ao, 0.5) + diff * mix(1.0, ao, 0.65));
  col += spec * ao * uSpecAmt;
  // backlit moon catches wet tiles, iron and stone edges as a thin cool rim
  col += moonSpec(N, V, max(rough, 0.25), sh) * ao * uSpecAmt * 0.55;
  col += albedo * uEmissive * vAux.y;
  gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
}
`;
