import * as THREE from 'three';
import { Rng } from '../core/rng';
import { MeshBuilder, mat, type V3 } from '../core/MeshBuilder';
import { fbm, smoothstep } from '../core/noise';
import { U } from '../atmosphere/SceneUniforms';
import { COMMON_GLSL, SURFACE_VERT } from '../materials/ShaderChunks';
import { LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import type { DistrictConfig } from './MerchantDistrictGenerator';
import { TERRACE } from '../architecture/StreetComposer';

/** The suggestion of a much larger city, built from a handful of seeded modules: valley terrain, moat river,
 *  repeated far houses with procedural lit windows, an arched bridge, pines and a cathedral landmark.
 *  Cheap geometry + fog + depth compression do the heavy lifting. */

const FAR_FRAG = /* glsl */ `
${COMMON_GLSL}
varying vec3 vWorld; varying vec3 vNormal; varying vec2 vUv; varying vec4 vTint; varying vec4 vAux;
void main(){
  vec3 N = normalize(vNormal);
  vec3 base = vTint.rgb;
  float kind = vAux.w;
  vec3 emis = vec3(0.0);
  float dist = distance(vWorld, cameraPosition);
  if (kind > 0.5 && kind < 2.5 && abs(N.y) < 0.6) {
    vec2 cs = kind < 1.5 ? vec2(1.5, 2.5) : vec2(2.2, 4.4);
    vec2 cell = vUv / cs; vec2 id = floor(cell), f = fract(cell);
    float h = hash12(id + vAux.z * 41.0);
    float lit = step(0.62, h);
    float win = step(0.26, f.x) * step(f.x, 0.74) * step(0.28, f.y) * step(f.y, 0.8);
    float arch = kind > 1.5 ? step(f.y, 0.55 + 0.4 * (1.0 - abs(f.x - 0.5) * 3.0)) : 1.0;
    win *= arch;
    emis = vec3(1.0, 0.6, 0.27) * (0.55 + 0.9 * hash12(id * 1.7 + vAux.z)) * (kind > 1.5 ? 2.2 : 2.6) * lit * win;
    base *= 1.0 - 0.45 * win;
  } else if (kind > 2.5 && kind < 3.5) {
    emis = vec3(1.0, 0.62, 0.28) * 4.0;
  }
  vec3 hemi = mix(uGroundAmb, uSkyAmb, N.y * 0.5 + 0.5) * 1.25;
  float mw = clamp((dot(N, uMoonDir) + 0.3) / 1.3, 0.0, 1.0);
  vec3 col = base * (hemi + uMoonCol * mw * 0.7) + emis * vTint.a;
  if (kind > 3.5) {
    // river: dark glass catching the city glow in soft vertical streaks
    float st = vn2(vec2(vWorld.x * 0.5, vWorld.z * 2.2 + uTime * 0.2));
    vec3 V = normalize(cameraPosition - vWorld);
    float fr = pow(1.0 - clamp(V.y, 0.0, 1.0), 3.0);
    col = vec3(0.004, 0.012, 0.024) + uSkyAmb * (0.5 + fr * 1.3) + vec3(0.9, 0.5, 0.2) * pow(st, 5.0) * 0.12;
  }
  gl_FragColor = vec4(applyFog(col, vWorld), 1.0);
}`;

const WALL = 1, LAND = 2, LAMP = 3, WATER = 4;

function farHouse(B: MeshBuilder, rng: Rng, x: number, y: number, z: number, w: number, d: number, h: number, tintW: V3, tintR: V3, id: number): void {
  const aux: [number, number, number, number] = [0, 0, id, WALL];
  B.boxMM(x - w / 2, y - 3, z - d / 2, x + w / 2, y + h, z + d / 2, { tint: tintW, aux, skip: ['+y', '-y'], aoY: [0.6, 1] });
  const rh = Math.min(w, d) * rng.range(0.45, 0.8), ridgeAlongX = w >= d;
  const hy = y + h;
  const rt: [number, number, number, number] = [0, 0, id, 0];
  if (ridgeAlongX) {
    B.quad([x - w / 2 - 0.3, hy, z + d / 2 + 0.3], [x + w / 2 + 0.3, hy, z + d / 2 + 0.3], [x + w / 2 + 0.3, hy + rh, z], [x - w / 2 - 0.3, hy + rh, z], { tint: tintR, aux: rt, uvs: [0, 0, 1, 0, 1, 1, 0, 1] });
    B.quad([x + w / 2 + 0.3, hy, z - d / 2 - 0.3], [x - w / 2 - 0.3, hy, z - d / 2 - 0.3], [x - w / 2 - 0.3, hy + rh, z], [x + w / 2 + 0.3, hy + rh, z], { tint: tintR, aux: rt, uvs: [0, 0, 1, 0, 1, 1, 0, 1] });
    for (const s of [-1, 1]) B.tri([x + s * w / 2, hy, z - d / 2], [x + s * w / 2, hy, z + d / 2], [x + s * w / 2, hy + rh, z], { tint: tintW, aux, flip: s < 0 });
  } else {
    B.quad([x + w / 2 + 0.3, hy, z + d / 2 + 0.3], [x + w / 2 + 0.3, hy, z - d / 2 - 0.3], [x, hy + rh, z - d / 2 - 0.3], [x, hy + rh, z + d / 2 + 0.3], { tint: tintR, aux: rt, uvs: [0, 0, 1, 0, 1, 1, 0, 1] });
    B.quad([x - w / 2 - 0.3, hy, z - d / 2 - 0.3], [x - w / 2 - 0.3, hy, z + d / 2 + 0.3], [x, hy + rh, z + d / 2 + 0.3], [x, hy + rh, z - d / 2 - 0.3], { tint: tintR, aux: rt, uvs: [0, 0, 1, 0, 1, 1, 0, 1] });
    for (const s of [-1, 1]) B.tri([x - w / 2, hy, z + s * d / 2], [x + w / 2, hy, z + s * d / 2], [x, hy + rh, z + s * d / 2], { tint: tintW, aux, flip: s < 0 });
  }
  if (rng.bool(0.35)) B.boxMM(x - 0.3, hy, z - 0.3, x + 0.3, hy + rh + 0.8, z + 0.3, { tint: [0.3, 0.26, 0.26], aux: [0, 0, id, 0] });
}

function tower(B: MeshBuilder, x: number, y: number, z: number, r: number, h: number, spire: number, tint: V3, roof: V3, id: number): void {
  const poly: Array<[number, number]> = [];
  const n = 8;
  for (let i = 0; i < n; i++) poly.push([x + Math.cos((i / n) * Math.PI * 2) * r, z + Math.sin((i / n) * Math.PI * 2) * r]);
  B.prism(poly, y, y + h, { tint, aux: [0, 0, id, LAND], capTop: false, aoY: [0.55, 1] });
  B.frame.push(mat([x, 0, z]));
  B.cylinder(r * 1.08, y + h, y + h + 0.6, n, { tint: roof, aux: [0, 0, id, 0], r1: r * 1.0 });
  B.lathe([[r * 1.2, y + h + 0.5], [r * 0.75, y + h + spire * 0.35], [r * 0.3, y + h + spire * 0.8], [0.01, y + h + spire]], n, { tint: roof, aux: [0, 0, id, 0] });
  B.frame.pop();
}

export function buildDistantCity(rng: Rng, lib: MaterialLibrary, cfg: DistrictConfig): { group: THREE.Group } {
  const group = new THREE.Group();
  group.name = 'distant-city';
  const B = new MeshBuilder();
  const r = rng.fork('far');
  const T = TERRACE;
  const FLOOR = -5;
  const dens = Math.max(0.4, cfg.buildingDensity);

  // ---------------------------------------------------------------- terrain: valley around the terrace
  const outside = (x: number, z: number) => {
    const dx = Math.max(T.x0 - x, 0, x - T.x1), dz = Math.max(T.z0 - z, 0, z - T.z1);
    return Math.hypot(dx, dz);
  };
  const riverAt = (_d: number) => 34;
  const terrainY = (x: number, z: number) => {
    const d = outside(x, z);
    let y = d <= 0 ? -0.5 : -0.5 + (FLOOR + 0.5) * smoothstep(0, 7, d);
    y += smoothstep(38, 100, d) * 34 + (fbm(x * 0.05, z * 0.05, 0, 4, 11) - 0.5) * 5 * smoothstep(8, 60, d);
    const rd = Math.abs(d - riverAt(d));
    y -= (1 - smoothstep(0, 7, rd)) * 1.6 * smoothstep(14, 24, d);
    return y;
  };
  const X0 = -150, X1 = 130, Z0 = -170, Z1 = 48, step = 3.2;
  const nx = Math.round((X1 - X0) / step), nz = Math.round((Z1 - Z0) / step);
  const P: V3[][] = [];
  for (let j = 0; j <= nz; j++) {
    const row: V3[] = [];
    for (let i = 0; i <= nx; i++) { const x = X0 + i * step, z = Z0 + j * step; row.push([x, terrainY(x, z), z]); }
    P.push(row);
  }
  B.grid(P, {
    flip: true,
    tintFn: (u, v, p) => {
      const d = outside(p[0], p[2]);
      const rock = 1 - smoothstep(0, 9, d);
      const g = fbm(p[0] * 0.08, p[2] * 0.08, 0, 3, 3);
      return [0.035 + 0.02 * g + rock * 0.03, 0.05 + 0.03 * g + rock * 0.025, 0.045 + 0.02 * g + rock * 0.025];
    },
    aoFn: () => 1,
  });
  const riverCenter = (dd: number) => riverAt(dd);
  // river surface sheet (ring-shaped band approximated with strips following the terrace)
  const W: V3[][] = [];
  const rn = 90;
  const ringPt = (t: number, off: number): V3 => {
    // walk around the promontory on the north/east/west sides at distance riverCenter
    const ang = Math.PI * (1.05 + 0.9 * t);
    const cx = (T.x0 + T.x1) / 2, cz = T.z0 + 6, rx = (T.x1 - T.x0) / 2 + riverCenter(30) + off, rz = 46 + off;
    return [cx + Math.cos(ang) * rx, FLOOR + 0.25, cz + Math.sin(ang) * rz];
  };
  for (let k = 0; k <= 1; k++) { const row: V3[] = []; for (let i = 0; i <= rn; i++) row.push(ringPt(i / rn, (k - 0.5) * 15)); W.push(row); }
  const wB = new MeshBuilder();
  wB.grid(W, { tint: [1, 1, 1], aux: [0, 0, 0, WATER], flip: true });

  // ---------------------------------------------------------------- houses: three depth bands, repeated modules
  const wallPal: V3[] = [[0.34, 0.3, 0.32], [0.42, 0.36, 0.32], [0.28, 0.31, 0.38], [0.44, 0.4, 0.34], [0.36, 0.32, 0.4]];
  const roofPal: V3[] = [[0.16, 0.19, 0.28], [0.26, 0.17, 0.16], [0.14, 0.2, 0.24], [0.22, 0.2, 0.22]];
  let id = 0;
  const nHouses = Math.round(320 * dens);
  for (let n = 0; n < nHouses; n++) {
    const ang = r.range(Math.PI * 0.98, Math.PI * 2.02), rad = r.range(10, 95);
    const cx = (T.x0 + T.x1) / 2, cz = T.z0 + 4;
    const x = cx + Math.cos(ang) * (rad + (T.x1 - T.x0) / 2), z = cz + Math.sin(ang) * rad * 1.0 - 4;
    const d = outside(x, z);
    if (d < 6 || Math.abs(d - riverAt(d)) < 8) continue;
    // keep the bridge approach clear
    if (Math.abs(x - 9.5) < 5 && z < -15) continue;
    const y = terrainY(x, z);
    const w = r.range(3.2, 7.5), dd = r.range(3.2, 6.5), h = r.range(3.5, 9) * (d > 70 ? 1.15 : 1);
    farHouse(B, r, Math.round(x / 1.5) * 1.5, y, Math.round(z / 1.5) * 1.5, w, dd, h, r.pick(wallPal), r.pick(roofPal), id++);
  }

  // ---------------------------------------------------------------- arched bridge leading away from the promontory
  const bx = 9.5, bz0 = T.z0 - 1, bz1 = T.z0 - 74, bw = 5.2;
  const deckY = (z: number) => -0.8 + Math.max(0, bz0 - z - 22) * 0.11;
  const piers = 7;
  const stone: V3 = [0.24, 0.23, 0.26];
  for (let i = 0; i <= piers; i++) {
    const z = bz0 + ((bz1 - bz0) * i) / piers;
    B.boxMM(bx - bw / 2 - 0.2, FLOOR - 1, z - 1.6, bx + bw / 2 + 0.2, deckY(z) - 0.2, z + 1.6, { tint: stone, aux: [0, 0, id, WALL], aoY: [0.5, 1] });
  }
  for (let i = 0; i < piers; i++) {
    const za = bz0 + ((bz1 - bz0) * i) / piers, zb = bz0 + ((bz1 - bz0) * (i + 1)) / piers;
    const zm = (za + zb) / 2, span = Math.abs(zb - za) - 3.2, ry = span / 2;
    const baseY = deckY(zm) - 2.2;
    // soffit as a dark arch on both faces
    for (const sx of [-1, 1]) {
      const xs = bx + sx * (bw / 2 + 0.22);
      const fan: V3[] = [];
      for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI; fan.push([xs, baseY - ry * 0.0 + Math.sin(a) * ry * 0.85 - ry * 0.0, zm + Math.cos(a) * span / 2]); }
      for (let k = 0; k < 12; k++) B.tri([xs, baseY - 2.5, fan[k][2]], fan[k], fan[k + 1], { tint: [0.01, 0.012, 0.02], aux: [0, 0, id, 0], flip: sx < 0, ao: 1 });
      B.quad([xs, baseY - 2.5, zm + span / 2], [xs, baseY - 2.5, zm - span / 2], [xs, baseY, zm - span / 2], [xs, baseY, zm + span / 2], { tint: [0.01, 0.012, 0.02], aux: [0, 0, id, 0], flip: sx > 0 });
    }
    B.boxMM(bx - bw / 2 - 0.2, deckY(zm) - 2.4, Math.min(za, zb), bx + bw / 2 + 0.2, deckY(zm) - 0.2, Math.max(za, zb), { tint: stone, aux: [0, 0, id, WALL], skip: ['-y'] });
  }
  B.boxMM(bx - bw / 2 - 0.35, -1.6, bz1 - 2, bx + bw / 2 + 0.35, -0.55, bz0, { tint: [0.2, 0.19, 0.22], aux: [0, 0, id, 0] });
  for (let i = 0; i < 16; i++) {
    const z = bz0 - 1 - i * 4.6;
    for (const sx of [-1, 1]) {
      B.boxMM(bx + sx * (bw / 2 - 0.1) - 0.08, -0.55, z - 0.08, bx + sx * (bw / 2 - 0.1) + 0.08, 1.4, z + 0.08, { tint: [0.1, 0.1, 0.12], aux: [0, 0, id, 0] });
      B.boxMM(bx + sx * (bw / 2 - 0.1) - 0.13, 1.3, z - 0.13, bx + sx * (bw / 2 - 0.1) + 0.13, 1.65, z + 0.13, { tint: [1, 1, 1], aux: [0, 0, id, LAMP] });
    }
  }

  // ---------------------------------------------------------------- landmark: the Tournament Cathedral on the far hill
  const LX = 24, LZ = -44, LY = terrainY(LX, LZ), LS = 0.5;
  B.frame.push(mat([LX, LY, LZ], 0, LS).multiply(mat([-LX, -LY, -LZ])));
  const L = (x: number, y: number, z: number) => [LX + x, LY + y, LZ + z] as V3;
  const cw: V3 = [0.3, 0.28, 0.3], cr: V3 = [0.12, 0.14, 0.2];
  const nave: V3 = L(0, 0, 0);
  B.boxMM(nave[0] - 8, LY - 3, nave[2] - 24, nave[0] + 8, LY + 22, nave[2] + 24, { tint: cw, aux: [0, 0, 7, LAND], skip: ['+y', '-y'], aoY: [0.5, 1] });
  B.quad([nave[0] - 9, LY + 22, nave[2] + 25], [nave[0] + 9, LY + 22, nave[2] + 25], [nave[0], LY + 36, nave[2] + 25], [nave[0], LY + 36, nave[2] - 25], { tint: cr, aux: [0, 0, 7, 0], uvs: [0, 0, 1, 0, 1, 1, 0, 1] });
  B.quad([nave[0] + 9, LY + 22, nave[2] - 25], [nave[0] - 9, LY + 22, nave[2] - 25], [nave[0], LY + 36, nave[2] - 25], [nave[0], LY + 36, nave[2] + 25], { tint: cr, aux: [0, 0, 7, 0], uvs: [0, 0, 1, 0, 1, 1, 0, 1] });
  B.boxMM(nave[0] - 26, LY - 3, nave[2] - 6, nave[0] + 26, LY + 18, nave[2] + 6, { tint: cw, aux: [0, 0, 9, LAND], skip: ['+y', '-y'] });
  B.boxMM(nave[0] - 27, LY + 18, nave[2] - 7, nave[0] + 27, LY + 20, nave[2] + 7, { tint: cr, aux: [0, 0, 9, 0] });
  tower(B, nave[0] - 8, LY + 22, nave[2] + 28, 4.4, 24, 26, cw, cr, 11);
  tower(B, nave[0] + 8, LY + 22, nave[2] + 28, 4.4, 24, 26, cw, cr, 12);
  tower(B, nave[0], LY + 36, nave[2] - 2, 3.6, 12, 42, cw, cr, 13);
  for (const [tx, tz] of [[-28, 0], [28, 0]]) tower(B, nave[0] + tx, LY + 14, nave[2] + tz, 3, 8, 16, cw, cr, 14);
  B.frame.pop();
  // city wall with gate towers along the far bank
  for (let i = 0; i < 14; i++) {
    const x = -90 + i * 12.5, z = -92 - Math.abs(Math.sin(i * 0.9)) * 6;
    const y = terrainY(x, z);
    B.boxMM(x - 6.4, y - 2, z - 1.2, x + 6.4, y + 6.5, z + 1.2, { tint: [0.22, 0.21, 0.24], aux: [0, 0, 20 + i, WALL], aoY: [0.6, 1] });
    if (i % 3 === 0) tower(B, x, y - 2, z, 2.6, 10, 8, [0.26, 0.24, 0.26], [0.1, 0.12, 0.18], 30 + i);
  }

  // ---------------------------------------------------------------- pines on slopes (repeated cone stacks)
  for (let n = 0; n < Math.round(150 * dens); n++) {
    const ang = r.range(Math.PI * 1.0, Math.PI * 2.0), rad = r.range(8, 100);
    const x = (T.x0 + T.x1) / 2 + Math.cos(ang) * (rad + 16) * 1.0, z = T.z0 + 4 + Math.sin(ang) * rad * 1.0 - 4;
    const d = outside(x, z);
    if (d < 3 || Math.abs(d - riverAt(d)) < 8 || (Math.abs(x - 9.5) < 6)) continue;
    const y = terrainY(x, z), s = r.range(1.3, 2.6);
    const g: V3 = [0.02 + r.next() * 0.02, 0.07 + r.next() * 0.04, 0.06 + r.next() * 0.03];
    B.frame.push(mat([x, 0, z]));
    B.cylinder(0.12 * s, y, y + 0.9 * s, 5, { tint: [0.1, 0.07, 0.06], aux: [0, 0, 0, 0], capTop: false });
    for (let k = 0; k < 3; k++) B.lathe([[1.15 * s * (1 - k * 0.22), y + (0.7 + k * 1.2) * s], [0.01, y + (2.2 + k * 1.2) * s]], 6, { tint: g, aux: [0, 0, 0, 0], ao: 0.8 + k * 0.1 });
    B.frame.pop();
  }

  const farMat = new THREE.ShaderMaterial({
    uniforms: { ...U }, vertexShader: SURFACE_VERT, fragmentShader: FAR_FRAG,
  });
  const mesh = new THREE.Mesh(B.toGeometry(), farMat);
  mesh.name = 'far-city'; mesh.frustumCulled = false; mesh.layers.set(LAYER_NOREFLECT);
  const water = new THREE.Mesh(wB.toGeometry(), farMat);
  water.name = 'far-river'; water.frustumCulled = false; water.layers.set(LAYER_NOREFLECT);
  group.add(mesh, water);

  // ---------------------------------------------------------------- terrace retaining walls (stone, camera-facing sides)
  const W2 = new MeshBuilder();
  W2.quad([T.x1, FLOOR, T.z0], [T.x1, FLOOR, 5], [T.x1, 0, 5], [T.x1, 0, T.z0], { tint: [0.8, 0.82, 0.9], ao: [0.35, 0.35, 0.9, 0.9], flip: true });
  W2.quad([T.x0, FLOOR, 5], [T.x0, FLOOR, T.z0], [T.x0, 0, T.z0], [T.x0, 0, 5], { tint: [0.8, 0.82, 0.9], ao: [0.35, 0.35, 0.9, 0.9], flip: true });
  W2.quad([T.x0, FLOOR, T.z0], [T.x1, FLOOR, T.z0], [T.x1, 0, T.z0], [T.x0, 0, T.z0], { tint: [0.8, 0.82, 0.9], ao: [0.35, 0.35, 0.9, 0.9], flip: true });
  W2.boxMM(T.x1 - 0.2, 0, T.z0, T.x1 + 0.35, 0.55, 4.6, { tint: [1, 1, 1.05], ao: 0.95, skip: ['-y'] });
  const wall = new THREE.Mesh(W2.toGeometry(), lib.slot.stone);
  wall.frustumCulled = false; wall.layers.set(0);
  group.add(wall);
  return { group };
}
