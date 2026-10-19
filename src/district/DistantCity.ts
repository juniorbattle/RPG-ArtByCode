import * as THREE from 'three';
import { Rng } from '../core/rng';
import { MeshBuilder, mat, type V3 } from '../core/MeshBuilder';
import { fbm, smoothstep } from '../core/noise';
import { U } from '../atmosphere/SceneUniforms';
import { COMMON_GLSL, SURFACE_VERT } from '../materials/ShaderChunks';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import type { DistrictConfig } from './MerchantDistrictGenerator';
import type { PartMeta } from './Visibility';
import { QUAY_Z, QUAY_END_X, SOUTH_QUAY_Z, STREET, WATER_Y } from '../architecture/StreetComposer';

/** The grand-but-subordinate background, authored along the canal axis (+x) in depth bands:
 *    A  the quay frontages continuing toward the bridge (north bank) and the opposite bank (south)
 *    B  the hero bridge: real stone arches you can see through, gate towers, a few lamps
 *    C  the mid city around the widened river, a second lower bridge dissolving in mist
 *    D  the upper city climbing a hill to the castle mass
 *  Everything is repeated simple modules (box + roof, tower, arch) in one cheap material; height fog,
 *  procedural lit windows and the shared horizon haze do the heavy lifting. */

const FAR_FRAG = /* glsl */ `
${COMMON_GLSL}
varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv; varying vec4 vTint; varying vec4 vAux;
float boxAA(vec2 f, vec2 lo, vec2 hi, vec2 w){
  vec2 a = smoothstep(lo - w, lo + w, f) * (1.0 - smoothstep(hi - w, hi + w, f));
  return a.x * a.y;
}
void main(){
  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 base = vTint.rgb;
  float kind = vAux.w;
  vec3 emis = vec3(0.0);
  float timber = step(3.5, kind) * step(kind, 4.5);
  float facade = (step(0.5, kind) * step(kind, 2.5) + timber) * step(abs(N.y), 0.6);
  if (facade > 0.5) {
    vec2 cs = kind > 1.5 && kind < 2.5 ? vec2(2.2, 4.4) : vec2(1.6, 2.6);
    vec2 cell = vUv / cs; vec2 id = floor(cell), f = fract(cell);
    vec2 aa = max(fwidth(cell), vec2(1e-4));
    float above = step(0.0, id.y);
    float h = hash12(id + vAux.z * 41.0);
    float lit = step(1.0 - vAux.x, h) * above;
    vec2 lo = vec2(0.28, 0.3), hi = vec2(0.72, 0.78);
    float win = boxAA(f, lo, hi, aa * 0.5) * above;
    if (kind > 1.5) win *= step(f.y, 0.55 + 0.4 * (1.0 - abs(f.x - 0.5) * 3.0));
    // background houses are the same architecture, simplified: dark frames, pale sills and a stone plinth.
    // The articulation fades once a bay shrinks to a few pixels, so the deep background stays calm.
    float art = 1.0 - smoothstep(0.08, 0.2, max(aa.x, aa.y));
    float frame = max(boxAA(f, lo - vec2(0.07, 0.05), hi + vec2(0.07, 0.05), aa * 0.5) * above - win, 0.0);
    float sill = boxAA(f, vec2(lo.x - 0.1, lo.y - 0.085), vec2(hi.x + 0.1, lo.y - 0.04), aa * 0.5) * above;
    float plinth = 1.0 - smoothstep(0.86, 0.94, vWorld.y - vAux.y);
    base *= 1.0 - (0.3 * frame + 0.2 * plinth) * art;
    base *= 1.0 + 0.3 * sill * art;
    // canal houses: stone ground floor, timber-framed upper floors (posts on the bay lines, rails on the floor
    // lines) - the frontage's own grammar at the support tier's budget
    float tl = max(1.0 - smoothstep(0.0, 0.07 + aa.x, min(f.x, 1.0 - f.x)), 1.0 - smoothstep(0.0, 0.05 + aa.y, min(f.y, 1.0 - f.y)));
    base *= mix(1.0, mix(1.1, 0.38, tl), timber * step(1.0, id.y) * art);
    base *= 1.0 - 0.14 * timber * (1.0 - step(1.0, id.y));
    // far lights thin out with distance: the upper city reads as sparse points, never as a lit wall
    float fade = 1.0 - 0.65 * smoothstep(90.0, 300.0, distance(vWorld, cameraPosition));
    emis = vec3(1.0, 0.6, 0.27) * (0.45 + 0.8 * hash12(id * 1.7 + vAux.z)) * (kind > 1.5 ? 1.4 : 1.7) * lit * win * fade;
    base *= 1.0 - 0.45 * win;
  } else if (kind > 2.5 && kind < 3.5) {
    emis = vec3(1.0, 0.62, 0.3) * 4.2;
  } else if (kind < 0.5 && N.y > 0.25 && N.y < 0.95) {
    // roofs: tile courses run level, so world height gives the rows on every slope
    float ry = vWorld.y / 0.24, w = fwidth(ry);
    base *= 1.0 - 0.24 * smoothstep(0.72, 0.9, fract(ry)) * (1.0 - smoothstep(0.25, 0.6, w));
  } else if (kind > 5.5 && kind < 6.5 && abs(N.y) < 0.6) {
    // bridge and quay walls: coursed ashlar (staggered blocks, dark joints, per-block tone)
    vec2 c = vec2((abs(N.x) > abs(N.z) ? vWorld.z : vWorld.x) / 0.95, vWorld.y / 0.48);
    c.x += 0.5 * mod(floor(c.y), 2.0);
    vec2 g = fract(c), w = max(fwidth(c), vec2(1e-4));
    float joint = max(1.0 - smoothstep(0.0, 0.05 + w.x, min(g.x, 1.0 - g.x)), 1.0 - smoothstep(0.0, 0.07 + w.y, min(g.y, 1.0 - g.y)));
    float fadeM = 1.0 - smoothstep(0.2, 0.5, max(w.x, w.y));
    base *= 1.0 - (0.32 * joint - 0.14 * (hash12(floor(c) + 7.0) - 0.5)) * fadeM;
  }
  // same light response as the near facades (tight moon wrap, no extra lift): the background never out-shines
  // the playable frontage and recedes behind it
  vec3 hemi = mix(uGroundAmb, uSkyAmb, N.y * 0.5 + 0.5);
  float mw = clamp((dot(N, uMoonDir) + 0.14) / 1.14, 0.0, 1.0);
  vec3 col = base * (hemi + uMoonCol * mw * 0.7) + emis * vTint.a;
  // the city is lit from below by its own lanterns: a faint warm lift at street level on facades
  col += base * vec3(1.0, 0.62, 0.34) * 0.3 * exp(-max(vWorld.y - vAux.y, 0.0) / 2.6) * facade;
  gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
}`;

const PLAIN = 0, WALL = 1, LAND = 2, LAMP = 3, TIMBER = 4, GROUND = 5, BRIDGE = 6, TREE = 7;
type Aux = [number, number, number, number];

/** south shoreline: straight along the playable canal, opening into a wide river basin toward the bridge */
export function southShore(x: number): number {
  return SOUTH_QUAY_Z + (40 - SOUTH_QUAY_Z) * smoothstep(30, 48, x) - 5 * smoothstep(150, 172, x);
}
export const RIVER_END_X = 172;
export const BRIDGE_X = 50;

const sub = (a: V3, b: V3): V3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
const crs = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
/** quad whose front face looks along `want` (the far material is double sided; this keeps lighting normals right) */
function qf(B: MeshBuilder, p: [V3, V3, V3, V3], want: V3, o: Parameters<MeshBuilder['quad']>[4]): void {
  const n = crs(sub(p[1], p[0]), sub(p[3], p[0]));
  B.quad(p[0], p[1], p[2], p[3], { ...o, flip: n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0 });
}

export interface HouseOpts { x: number; y: number; z: number; w: number; d: number; h: number; wall: V3; roof: V3; id: number; lit: number; hip?: boolean; chimney?: boolean; timber?: boolean }

/** box + gable/hip roof; each wall gets its own window grid sized to the facade so windows never cut corners */
export function farHouse(B: MeshBuilder, o: HouseOpts): void {
  const { x, y, z, w, d, h } = o;
  const x0 = x - w / 2, x1 = x + w / 2, z0 = z - d / 2, z1 = z + d / 2;
  const yb = y - 2.5, yt = y + h;
  const aux: Aux = [o.lit, y, o.id, o.timber ? TIMBER : WALL];
  const rows = Math.max(1, Math.round(h / 2.6)), kv = (rows * 2.6) / h;
  const wall = (p: [V3, V3, V3, V3], want: V3, len: number) => {
    const U0 = Math.max(1, Math.round(len / 1.6)) * 1.6;
    qf(B, p, want, { tint: o.wall, aux, uvs: [0, (yb - y) * kv, U0, (yb - y) * kv, U0, h * kv, 0, h * kv], ao: [0.62, 0.62, 1, 1] });
  };
  wall([[x0, yb, z1], [x1, yb, z1], [x1, yt, z1], [x0, yt, z1]], [0, 0, 1], w);
  wall([[x1, yb, z0], [x0, yb, z0], [x0, yt, z0], [x1, yt, z0]], [0, 0, -1], w);
  wall([[x1, yb, z1], [x1, yb, z0], [x1, yt, z0], [x1, yt, z1]], [1, 0, 0], d);
  wall([[x0, yb, z0], [x0, yb, z1], [x0, yt, z1], [x0, yt, z0]], [-1, 0, 0], d);
  const rt: Aux = [0, y, o.id, PLAIN];
  const ov = 0.35, alongX = w >= d;
  const rh = Math.min(w, d) * (o.hip ? 0.42 : 0.62);
  const ex0 = x0 - ov, ex1 = x1 + ov, ez0 = z0 - ov, ez1 = z1 + ov;
  if (alongX) {
    const inset = o.hip ? Math.min(w * 0.3, d * 0.5) : 0;
    qf(B, [[ex0, yt, ez1], [ex1, yt, ez1], [x1 - inset, yt + rh, z], [x0 + inset, yt + rh, z]], [0, 1, 1], { tint: o.roof, aux: rt });
    qf(B, [[ex1, yt, ez0], [ex0, yt, ez0], [x0 + inset, yt + rh, z], [x1 - inset, yt + rh, z]], [0, 1, -1], { tint: o.roof, aux: rt });
    for (const s of [-1, 1]) {
      const xe = s < 0 ? ex0 : ex1, xr = s < 0 ? x0 + inset : x1 - inset;
      if (o.hip) B.tri([xe, yt, ez0], [xe, yt, ez1], [xr, yt + rh, z], { tint: o.roof, aux: rt });
      else B.tri([s < 0 ? x0 : x1, yt, z0], [s < 0 ? x0 : x1, yt, z1], [s < 0 ? x0 : x1, yt + rh, z], { tint: o.wall, aux: rt });
    }
  } else {
    const inset = o.hip ? Math.min(d * 0.3, w * 0.5) : 0;
    qf(B, [[ex1, yt, ez1], [ex1, yt, ez0], [x, yt + rh, z0 + inset], [x, yt + rh, z1 - inset]], [1, 1, 0], { tint: o.roof, aux: rt });
    qf(B, [[ex0, yt, ez0], [ex0, yt, ez1], [x, yt + rh, z1 - inset], [x, yt + rh, z0 + inset]], [-1, 1, 0], { tint: o.roof, aux: rt });
    for (const s of [-1, 1]) {
      const ze = s < 0 ? ez0 : ez1, zr = s < 0 ? z0 + inset : z1 - inset;
      if (o.hip) B.tri([ex0, yt, ze], [ex1, yt, ze], [x, yt + rh, zr], { tint: o.roof, aux: rt });
      else B.tri([x0, yt, s < 0 ? z0 : z1], [x1, yt, s < 0 ? z0 : z1], [x, yt + rh, s < 0 ? z0 : z1], { tint: o.wall, aux: rt });
    }
  }
  if (o.chimney) B.boxMM(x + w * 0.22 - 0.3, yt, z - 0.3, x + w * 0.22 + 0.3, yt + rh + 0.9, z + 0.3, { tint: [0.16, 0.16, 0.19], aux: rt });
}

export function tower(B: MeshBuilder, x: number, y: number, z: number, r: number, h: number, spire: number, tint: V3, roof: V3, id: number, lit = 0.25): void {
  const poly: Array<[number, number]> = [];
  const n = 8;
  for (let i = 0; i < n; i++) poly.push([x + Math.cos((i / n) * Math.PI * 2) * r, z + Math.sin((i / n) * Math.PI * 2) * r]);
  B.prism(poly, y, y + h, { tint, aux: [lit, y, id, LAND], capTop: false, aoY: [0.55, 1] });
  B.frame.push(mat([x, 0, z]));
  B.cylinder(r * 1.12, y + h, y + h + 0.7, n, { tint: roof, aux: [0, y, id, PLAIN], r1: r * 1.04 });
  B.lathe([[r * 1.22, y + h + 0.6], [r * 0.78, y + h + spire * 0.32], [r * 0.32, y + h + spire * 0.78], [0.01, y + h + spire]], n, { tint: roof, aux: [0, y, id, PLAIN] });
  B.frame.pop();
}

interface BridgeOpts { x: number; z0: number; z1: number; width: number; spans: number; pier: number; spring: number; parapet: number; tint: V3; id: number; lamps: number; gates?: boolean }

/** Stone arch bridge with true openings: spandrel faces follow the intrados, the vault is closed underneath,
 *  piers carry cutwaters on the camera side, a cornice line and parapet give the crisp horizontal silhouette. */
function archBridge(B: MeshBuilder, o: BridgeOpts): void {
  const xw = o.x - o.width / 2, xe = o.x + o.width / 2;
  const span = (o.z1 - o.z0 - (o.spans - 1) * o.pier) / o.spans;
  const rise = span * 0.5, yS = o.spring, crown = yS + rise, yD = crown + 0.75;
  const foot = WATER_Y - 1.2;
  const aux: Aux = [0, 0, o.id, BRIDGE];
  const dark: V3 = [o.tint[0] * 0.55, o.tint[1] * 0.55, o.tint[2] * 0.6];
  const K = 14;
  for (let i = 0; i < o.spans; i++) {
    const za = o.z0 + i * (span + o.pier), zb = za + span, zm = (za + zb) / 2;
    const arc: Array<[number, number]> = [];
    for (let k = 0; k <= K; k++) { const a = Math.PI * (1 - k / K); arc.push([zm + Math.cos(a) * span / 2, yS + Math.sin(a) * rise]); }
    for (let k = 0; k < K; k++) {
      const [z0, y0] = arc[k], [z1, y1] = arc[k + 1];
      for (const [xf, s] of [[xw, -1], [xe, 1]] as Array<[number, number]>) qf(B, [[xf, y0, z0], [xf, y1, z1], [xf, yD, z1], [xf, yD, z0]], [s, 0, 0], { tint: o.tint, aux });
      // vault soffit, darker toward the crown
      qf(B, [[xw, y0, z0], [xe, y0, z0], [xe, y1, z1], [xw, y1, z1]], [0, yS - (y0 + y1) / 2, zm - (z0 + z1) / 2], { tint: dark, aux, ao: 0.55 });
      // voussoir ring proud of the camera-side face
      const ox = xw - 0.14, r0 = 1, r1 = 1.13;
      const p = (zz: number, yy: number, rr: number): V3 => [ox, yS + (yy - yS) * rr, zm + (zz - zm) * rr];
      qf(B, [p(z0, y0, r0), p(z1, y1, r0), p(z1, y1, r1), p(z0, y0, r1)], [-1, 0, 0], { tint: [o.tint[0] * 1.12, o.tint[1] * 1.12, o.tint[2] * 1.12], aux });
    }
    // jambs below the springing
    for (const [zz, s] of [[za, 1], [zb, -1]] as Array<[number, number]>) qf(B, [[xw, foot, zz], [xe, foot, zz], [xe, yS, zz], [xw, yS, zz]], [0, 0, s], { tint: dark, aux, ao: 0.7 });
  }
  // piers + cutwaters (camera side)
  for (let i = 1; i < o.spans; i++) {
    const pz0 = o.z0 + i * (span + o.pier) - o.pier, pz1 = pz0 + o.pier, pm = (pz0 + pz1) / 2;
    for (const [xf, s] of [[xw, -1], [xe, 1]] as Array<[number, number]>) qf(B, [[xf, foot, pz0], [xf, foot, pz1], [xf, yD, pz1], [xf, yD, pz0]], [s, 0, 0], { tint: o.tint, aux });
    const tip: V3 = [xw - 1.5, 0, pm], top = yS + 0.55;
    qf(B, [[xw, foot, pz0], [tip[0], foot, pm], [tip[0], top, pm], [xw, top, pz0]], [-1, 0, -1], { tint: o.tint, aux });
    qf(B, [[tip[0], foot, pm], [xw, foot, pz1], [xw, top, pz1], [tip[0], top, pm]], [-1, 0, 1], { tint: o.tint, aux });
    qf(B, [[xw, top, pz0], [tip[0], top, pm], [xw, top + 0.9, pm], [xw, top + 0.9, pm]], [-1, 1, 0], { tint: dark, aux });
    B.tri([xw, top, pz1], [tip[0], top, pm], [xw, top + 0.9, pm], { tint: dark, aux });
  }
  // abutments, deck, cornice, parapets, lamps
  const za0 = o.z0 - 6, za1 = o.z1 + 6;
  B.boxMM(xw, foot, za0, xe, yD, o.z0, { tint: o.tint, aux, skip: ['-y', '+y', '+z'] });
  B.boxMM(xw, foot, o.z1, xe, yD, za1, { tint: o.tint, aux, skip: ['-y', '+y', '-z'] });
  qf(B, [[xw, yD, za0], [xe, yD, za0], [xe, yD, za1], [xw, yD, za1]], [0, 1, 0], { tint: [0.2, 0.2, 0.24], aux });
  B.boxMM(xw - 0.2, yD - 0.38, za0, xw + 0.05, yD + 0.02, za1, { tint: [o.tint[0] * 1.1, o.tint[1] * 1.1, o.tint[2] * 1.1], aux, skip: ['-y'] });
  for (const [a, b] of [[xw - 0.1, xw + 0.4], [xe - 0.4, xe + 0.1]] as Array<[number, number]>) B.boxMM(a, yD, za0, b, yD + o.parapet, za1, { tint: o.tint, aux, skip: ['-y'] });
  for (let i = 0; i < o.lamps; i++) {
    const z = o.z0 + (i + 0.5) * ((o.z1 - o.z0) / o.lamps);
    B.boxMM(xw + 0.05, yD + o.parapet, z - 0.06, xw + 0.17, yD + o.parapet + 1.0, z + 0.06, { tint: [0.06, 0.06, 0.08], aux });
    B.boxMM(xw - 0.04, yD + o.parapet + 1.0, z - 0.15, xw + 0.26, yD + o.parapet + 1.42, z + 0.15, { tint: [1, 1, 1], aux: [0, 0, o.id, LAMP] });
  }
  if (o.gates) {
    // bridge-head gate towers: the strongest verticals on the horizon line
    for (const [zc, gw] of [[o.z0 - 3.2, 6.4], [o.z1 + 3.2, 6.0]] as Array<[number, number]>) {
      const gx0 = xw - 0.6, gx1 = xe + 0.6, gz0 = zc - gw / 2, gz1 = zc + gw / 2, gt = yD + 9.5;
      B.boxMM(gx0, yD, gz0, gx1, gt, gz1, { tint: o.tint, aux: [0.18, yD, o.id + 1, LAND], skip: ['-y'] });
      const cx = (gx0 + gx1) / 2;
      for (const [a, b, c, want] of [
        [[gx0 - 0.3, gt, gz0 - 0.3], [gx0 - 0.3, gt, gz1 + 0.3], [cx, gt + 5.5, zc], [-1, 1, 0]],
        [[gx1 + 0.3, gt, gz1 + 0.3], [gx1 + 0.3, gt, gz0 - 0.3], [cx, gt + 5.5, zc], [1, 1, 0]],
        [[gx0 - 0.3, gt, gz1 + 0.3], [gx1 + 0.3, gt, gz1 + 0.3], [cx, gt + 5.5, zc], [0, 1, 1]],
        [[gx1 + 0.3, gt, gz0 - 0.3], [gx0 - 0.3, gt, gz0 - 0.3], [cx, gt + 5.5, zc], [0, 1, -1]],
      ] as Array<[V3, V3, V3, V3]>) {
        const n = crs(sub(b, a), sub(c, a));
        B.tri(a, b, c, { tint: [0.1, 0.11, 0.15], aux: [0, yD, o.id, PLAIN], flip: n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0 });
      }
    }
  }
}

/** what the district needs to bake and finish the background: the geometry (tagged with visibility parts) and
 *  its one cheap material */
export interface DistantCityDraft { builder: MeshBuilder; material: THREE.ShaderMaterial }

export function buildDistantCity(rng: Rng, lib: MaterialLibrary, cfg: DistrictConfig, register: (m: PartMeta) => number): DistantCityDraft {
  void lib;
  const B = new MeshBuilder();
  const r = rng.fork('far');
  const dens = Math.max(0.4, cfg.buildingDensity);
  const wallPal: V3[] = [[0.3, 0.31, 0.36], [0.34, 0.34, 0.38], [0.26, 0.28, 0.34], [0.36, 0.35, 0.37], [0.3, 0.3, 0.34], [0.4, 0.39, 0.4]];
  const roofPal: V3[] = [[0.12, 0.14, 0.2], [0.15, 0.16, 0.21], [0.1, 0.12, 0.17], [0.17, 0.17, 0.21]];
  let id = 100;
  /** every house / bridge / landmark / tree is its own visibility part; terrain and quay walls stay untracked */
  const tag = (m: PartMeta) => { B.frame.part = register(m); };
  const untag = () => { B.frame.part = 0; };

  // ---------------------------------------------------------------- terrain: flat banks + the upper-city hill
  const hill = (x: number, z: number) => {
    const k = Math.exp(-Math.pow((x - 236) / 74, 2) - Math.pow((z - 6) / 92, 2));
    return Math.max(0, 27 * k * (0.86 + 0.28 * fbm(x * 0.02, z * 0.02, 0, 3, 41)) - 1.2) * smoothstep(RIVER_END_X - 6, RIVER_END_X + 30, x);
  };
  const ground = (x0: number, z0: number, x1: number, z1: number, y: number, tint: V3) => qf(B, [[x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0]], [0, 1, 0], { tint, aux: [0, 0, 0, GROUND] });
  // (the cobbled street plane owns x < QUAY_END_X, z > STREET.z0; these fill around it without overlap)
  ground(STREET.x0 - 30, -160, QUAY_END_X, STREET.z0, 0, [0.05, 0.055, 0.07]);
  ground(QUAY_END_X, -160, RIVER_END_X, QUAY_Z + 0.35, 0, [0.06, 0.065, 0.08]);
  // south banks follow the shoreline curve as a strip
  {
    const P: V3[][] = [];
    const xs: number[] = [];
    for (let x = STREET.x0 - 30; x < STREET.x1 - 4; x += 4) xs.push(x);
    for (let x = STREET.x1 - 4; x <= RIVER_END_X; x += 2) xs.push(x);
    // behind the authored south walkway the bank starts at its back edge; past it, at the shoreline
    for (const far of [0, 1]) P.push(xs.map((x) => [x, 0.3, far ? 200 : x < STREET.x1 - 4 ? SOUTH_QUAY_Z + 4.2 : southShore(x) + 0.45] as V3));
    B.grid(P, { tint: [0.055, 0.06, 0.075], aux: [0, 0, 0, GROUND], flip: false });
  }
  {
    const X0 = RIVER_END_X, X1 = 380, Z0 = -170, Z1 = 200, st = 8;
    const P: V3[][] = [];
    for (let z = Z0; z <= Z1; z += st) { const row: V3[] = []; for (let x = X0; x <= X1; x += st) row.push([x, hill(x, z), z]); P.push(row); }
    B.grid(P, { flip: true, tintFn: (_u, _v, p) => { const g = fbm(p[0] * 0.05, p[2] * 0.05, 0, 3, 3); return [0.04 + 0.02 * g, 0.046 + 0.02 * g, 0.06 + 0.02 * g]; }, aux: [0, 0, 0, GROUND] });
  }

  // ---------------------------------------------------------------- far quays: the canal walls run on toward the bridge
  for (let x = QUAY_END_X; x < RIVER_END_X; x += 6) {
    const xb = Math.min(x + 6, RIVER_END_X);
    qf(B, [[x, WATER_Y - 0.6, QUAY_Z + 0.35], [xb, WATER_Y - 0.6, QUAY_Z + 0.35], [xb, 0.05, QUAY_Z + 0.35], [x, 0.05, QUAY_Z + 0.35]], [0, 0, 1], { tint: [0.2, 0.21, 0.25], aux: [0, 0, 0, BRIDGE], ao: [0.4, 0.4, 1, 1] });
  }
  for (let x = STREET.x1; x < RIVER_END_X; x += 3) {
    const xb = x + 3, za = southShore(x), zb = southShore(xb);
    qf(B, [[x, WATER_Y - 0.6, za], [xb, WATER_Y - 0.6, zb], [xb, 0.32, zb], [x, 0.32, za]], [0, 0, -1], { tint: [0.18, 0.19, 0.23], aux: [0, 0, 0, BRIDGE], ao: [0.4, 0.4, 1, 1] });
  }
  qf(B, [[RIVER_END_X, WATER_Y - 0.6, QUAY_Z], [RIVER_END_X, WATER_Y - 0.6, southShore(RIVER_END_X) + 1], [RIVER_END_X, 0.3, southShore(RIVER_END_X) + 1], [RIVER_END_X, 0.3, QUAY_Z]], [-1, 0, 0], { tint: [0.16, 0.17, 0.2], aux: [0, 0, 0, PLAIN] });

  // ---------------------------------------------------------------- A: quay frontages
  /** a random row of simplified houses; `dry` only consumes the random stream (the opposite bank used to be
   *  built this way: replaying its draws keeps every later background element exactly where it was) */
  const row = (x0: number, x1: number, zFront: number, facing: 1 | -1, hMin: number, hMax: number, lit: number, depth = 7, wMin = 5, wMax = 8, dim = 1, meta: PartMeta | null = null) => {
    let x = x0;
    while (x < x1) {
      const w = Math.min(r.range(wMin, wMax), x1 - x);
      if (w < 3) break;
      const d = r.range(depth * 0.8, depth * 1.2), h = r.range(hMin, hMax);
      const zc = zFront - facing * (d / 2) + r.range(-0.3, 0.3) * facing;
      const wc = r.pick(wallPal);
      const roof = r.pick(roofPal), hid = id++, hip = r.bool(0.2), chimney = r.bool(0.4);
      if (meta) { tag(meta); farHouse(B, { x: x + w / 2, y: 0, z: zc, w: w - 0.15, d, h, wall: [wc[0] * dim, wc[1] * dim, wc[2] * dim], roof, id: hid, lit, hip, chimney }); }
      x += w;
    }
    untag();
  };
  /** The opposite bank as a coherent canal frontage (support tier: the establishing framing looks straight at
   *  it): deep narrow houses with their gables to the water, one front line with a gentle set-back rhythm,
   *  storeys on one shared 2.7 m module (stone ground floor, timber-framed upper floors - the frontage's own
   *  grammar), a calm three / four storey cadence with the odd two-storey dip, chimneys on most roofs. Same
   *  stretch of bank and the same handful of houses as before: cleaner, not denser. */
  const rs = rng.fork('opposite-bank');
  let cid = 5000;
  const SOUTH_PAL: V3[] = [[0.33, 0.33, 0.37], [0.36, 0.35, 0.38], [0.31, 0.32, 0.36]];
  const canalRow = (x0: number, x1: number, zFront: number, storeys: number[], lit: number, dim: number, depth: number, group: string) => {
    const widths = [5.6, 6.4, 5.0, 6.0, 6.8, 5.2];
    let x = x0, i = rs.int(0, widths.length - 1), n = 0;
    while (x < x1) {
      const w = Math.min(widths[i++ % widths.length] + rs.range(-0.2, 0.2), x1 - x);
      if (w < 3.6) break;
      const st = storeys[(n++ + rs.int(0, 1)) % storeys.length];
      const d = Math.max(depth + rs.range(-0.4, 0.4), w + 0.8);
      const back = n % 3 === 0 ? 0.45 : 0;
      const wc = rs.pick(SOUTH_PAL), roof = rs.pick(roofPal.slice(0, 3));
      tag({ kind: 'house', tier: 1, group });
      farHouse(B, { x: x + w / 2, y: 0.3, z: zFront + d / 2 + back, w: w - 0.1, d, h: st * 2.7, wall: [wc[0] * dim, wc[1] * dim, wc[2] * dim], roof, id: cid++, lit, hip: false, chimney: st >= 3 && rs.bool(0.65), timber: true });
      x += w;
    }
    untag();
  };
  // (the north frontage up to the bridge is generated at full detail by the district: nothing simplified sits
  //  in the playable foreground / midground)
  row(STREET.x0 - 6, STREET.x1, SOUTH_QUAY_Z + 4.4, -1, 5, 10, 0.09, 7, 5, 8, 0.62);
  row(STREET.x0 - 6, STREET.x1 + 4, SOUTH_QUAY_Z + 12.5, -1, 8, 11, 0.06, 7, 5, 8, 0.55);
  canalRow(STREET.x0 - 6, STREET.x1, SOUTH_QUAY_Z + 4.3, [3, 3, 4, 3, 2, 3, 4], 0.09, 0.66, 8.6, 'opposite-bank');
  canalRow(STREET.x0 - 6, STREET.x1 + 4, SOUTH_QUAY_Z + 14.2, [4, 4, 5, 4], 0.05, 0.52, 8.0, 'opposite-bank-2');
  // the quarter behind the frontage: set back past the generated back row so it only ever reads as a
  // receding roofscape, never as a second-plane facade
  for (let n = 0; n < Math.round(60 * dens); n++) {
    const x = r.range(STREET.x0 - 10, BRIDGE_X), z = r.range(-62, -25);
    tag({ kind: 'house', tier: 2, group: 'quarter-behind' });
    farHouse(B, { x, y: 0, z, w: r.range(5, 8), d: r.range(5, 8), h: r.range(10, 14) + Math.max(0, -z - 32) * 0.12, wall: r.pick(wallPal), roof: r.pick(roofPal), id: id++, lit: 0.06, hip: r.bool(0.3) });
  }
  untag();

  // ---------------------------------------------------------------- B: hero bridge and the river basin around it
  // (no gate towers: the vanishing point stays open so the castle reads directly above the bridge)
  tag({ kind: 'bridge', tier: 1, group: 'hero-bridge' });
  archBridge(B, { x: BRIDGE_X, z0: QUAY_Z + 0.35, z1: southShore(BRIDGE_X), width: 7, spans: 4, pier: 2.4, spring: WATER_Y + 0.55, parapet: 1.0, tint: [0.3, 0.31, 0.35], id: 7, lamps: 4 });
  untag();
  // waterfront rows around the basin (beyond the bridge and its two generated houses: background, lower and darker)
  row(BRIDGE_X + 18.5, 168, -3.2, 1, 8, 13, 0.08, 8, 5, 8, 0.66, { kind: 'house', tier: 2, group: 'basin-north' });
  {
    let x = STREET.x1 + 4;
    while (x < 166) {
      const w = r.range(5, 8), zs = southShore(x + w / 2) + 4.5;
      const wc = r.pick(wallPal);
      tag({ kind: 'house', tier: 2, group: 'basin-south' });
      farHouse(B, { x: x + w / 2, y: 0.3, z: zs + 3.5, w: w - 0.2, d: 7, h: r.range(7, 11), wall: [wc[0] * 0.75, wc[1] * 0.75, wc[2] * 0.75], roof: r.pick(roofPal), id: id++, lit: 0.08, hip: r.bool(0.2), chimney: r.bool(0.4) });
      x += w;
    }
    untag();
  }

  // ---------------------------------------------------------------- C: mid city + the second, lower bridge in the mist
  for (let n = 0; n < Math.round(150 * dens); n++) {
    const north = r.bool(0.55);
    const x = r.range(BRIDGE_X + 4, RIVER_END_X + 10);
    const z = north ? r.range(-75, -14) : r.range(southShore(x) + 16, 120);
    tag({ kind: 'house', tier: 2, group: 'mid-city' });
    farHouse(B, { x, y: 0, z, w: r.range(4.5, 8), d: r.range(4.5, 8), h: r.range(9, 16), wall: r.pick(wallPal), roof: r.pick(roofPal), id: id++, lit: 0.07, hip: r.bool(0.3), chimney: r.bool(0.3) });
  }
  tag({ kind: 'bridge', tier: 2, group: 'second-bridge' });
  archBridge(B, { x: 128, z0: QUAY_Z + 0.35, z1: southShore(128), width: 5.5, spans: 6, pier: 1.8, spring: WATER_Y + 0.5, parapet: 0.8, tint: [0.28, 0.29, 0.33], id: 8, lamps: 3 });
  for (const [x, z, h] of [[96, -22, 20], [118, 64, 18], [150, -40, 24], [76, 58, 16]] as Array<[number, number, number]>) {
    tag({ kind: 'landmark', tier: 2, group: 'towers' });
    tower(B, x, 0, z, 2.6, h, 10, [0.3, 0.3, 0.34], [0.1, 0.12, 0.17], id++, 0.15);
  }
  untag();

  // ---------------------------------------------------------------- D: the upper city on the hill and the castle mass
  for (let n = 0; n < Math.round(230 * dens); n++) {
    const x = r.range(RIVER_END_X + 4, 320), z = r.range(-110, 130);
    const y = hill(x, z);
    if (y < 0.5 && r.bool(0.5)) continue;
    const s = 0.8 + y / 40;
    tag({ kind: 'house', tier: 2, group: 'upper-city' });
    farHouse(B, { x: Math.round(x / 2) * 2, y, z: Math.round(z / 2) * 2, w: r.range(4, 7) * s, d: r.range(4, 7) * s, h: r.range(6, 11) * s, wall: r.pick(wallPal), roof: r.pick(roofPal), id: id++, lit: 0.035 + 0.04 * smoothstep(5, 25, y), hip: r.bool(0.35) });
  }
  untag();
  // castle: keep, curtain wall, corner towers and a tall donjon (fairy-tale verticals, read only as silhouette)
  {
    tag({ kind: 'landmark', tier: 2, group: 'castle' });
    const cx = 242, cz = 4, cy = hill(cx, cz) - 1, cw: V3 = [0.3, 0.3, 0.34], cr: V3 = [0.09, 0.1, 0.15];
    B.boxMM(cx - 14, cy - 4, cz - 11, cx + 14, cy + 9, cz + 11, { tint: cw, aux: [0.08, cy, 900, LAND], skip: ['-y'] });
    B.boxMM(cx - 8, cy - 4, cz - 7, cx + 8, cy + 20, cz + 7, { tint: cw, aux: [0.2, cy, 901, LAND], skip: ['-y', '+y'] });
    qf(B, [[cx - 8.6, cy + 20, cz + 7.6], [cx + 8.6, cy + 20, cz + 7.6], [cx + 4, cy + 27, cz], [cx - 4, cy + 27, cz]], [0, 1, 1], { tint: cr, aux: [0, cy, 901, PLAIN] });
    qf(B, [[cx + 8.6, cy + 20, cz - 7.6], [cx - 8.6, cy + 20, cz - 7.6], [cx - 4, cy + 27, cz], [cx + 4, cy + 27, cz]], [0, 1, -1], { tint: cr, aux: [0, cy, 901, PLAIN] });
    B.tri([cx - 8.6, cy + 20, cz - 7.6], [cx - 8.6, cy + 20, cz + 7.6], [cx - 4, cy + 27, cz], { tint: cr, aux: [0, cy, 901, PLAIN] });
    B.tri([cx + 8.6, cy + 20, cz + 7.6], [cx + 8.6, cy + 20, cz - 7.6], [cx + 4, cy + 27, cz], { tint: cr, aux: [0, cy, 901, PLAIN] });
    for (const [tx, tz] of [[-14, -11], [14, -11], [-14, 11], [14, 11]] as Array<[number, number]>) tower(B, cx + tx, cy, cz + tz, 2.6, 15, 9, cw, cr, id++, 0.2);
    tower(B, cx + 3, cy + 20, cz - 2, 3.2, 9, 15, cw, cr, id++, 0.3);
    tower(B, cx - 5, cy + 20, cz + 4, 1.6, 6, 8, cw, cr, id++, 0.2);
  }
  // cathedral on the lower slope: nave + crossing spire + west towers, scaled down to stay subordinate
  {
    tag({ kind: 'landmark', tier: 2, group: 'cathedral' });
    const LX = 200, LZ = -34, LY = hill(LX, LZ) - 0.5, cw: V3 = [0.31, 0.3, 0.33], cr: V3 = [0.1, 0.11, 0.16];
    B.boxMM(LX - 16, LY - 3, LZ - 5, LX + 16, LY + 12, LZ + 5, { tint: cw, aux: [0.16, LY, 950, LAND], skip: ['-y', '+y'] });
    qf(B, [[LX - 16.5, LY + 12, LZ + 5.6], [LX + 16.5, LY + 12, LZ + 5.6], [LX + 16.5, LY + 19, LZ], [LX - 16.5, LY + 19, LZ]], [0, 1, 1], { tint: cr, aux: [0, LY, 950, PLAIN] });
    qf(B, [[LX + 16.5, LY + 12, LZ - 5.6], [LX - 16.5, LY + 12, LZ - 5.6], [LX - 16.5, LY + 19, LZ], [LX + 16.5, LY + 19, LZ]], [0, 1, -1], { tint: cr, aux: [0, LY, 950, PLAIN] });
    tower(B, LX - 19, LY, LZ - 3.5, 2.4, 20, 12, cw, cr, id++, 0.15);
    tower(B, LX - 19, LY, LZ + 3.5, 2.4, 20, 12, cw, cr, id++, 0.15);
    tower(B, LX + 2, LY + 12, LZ, 2.0, 8, 16, cw, cr, id++, 0.1);
  }
  untag();
  // a few dark tree masses break the roof rhythm on the banks and slopes
  for (let n = 0; n < Math.round(36 * dens); n++) {
    const x = r.range(STREET.x1, 300), z = r.bool(0.5) ? r.range(southShore(x) + 6, 90) : r.range(-90, -12);
    const y = (x > RIVER_END_X ? hill(x, z) : 0) + (z > 10 ? 0.3 : 0), s = r.range(2.2, 3.6);
    const g: V3 = [0.03 + r.next() * 0.015, 0.045 + r.next() * 0.02, 0.06 + r.next() * 0.02];
    tag({ kind: 'tree', tier: 2, group: 'trees' });
    B.frame.push(mat([x, 0, z]));
    for (let k = 0; k < 3; k++) B.lathe([[1.2 * s * (1 - k * 0.24), y + (0.6 + k * 1.1) * s], [0.01, y + (2.3 + k * 1.1) * s]], 6, { tint: g, aux: [0, y, 0, TREE] });
    B.frame.pop();
  }
  untag();

  return { builder: B, material: farMaterial() };
}

/** the far city's one cheap material (lit windows, roof courses, ashlar, haze); also the arena's backdrop (src/arena/ArenaScene.ts) */
export function farMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({ uniforms: { ...U }, vertexShader: SURFACE_VERT, fragmentShader: FAR_FRAG, side: THREE.DoubleSide });
}

/** the far shader's surface kinds (aux.w) */
export const FAR_KIND = { PLAIN, WALL, LAND, LAMP, TIMBER, GROUND, BRIDGE, TREE } as const;
