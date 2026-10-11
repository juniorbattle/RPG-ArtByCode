import * as THREE from 'three';

export type V3 = [number, number, number];
export type Slot = 'plaster' | 'timber' | 'planks' | 'stone' | 'brick' | 'roof' | 'cloth' | 'metal' | 'glow' | 'leaf' | 'dark' | 'banner' | 'shop' | 'decal';
export const SLOTS: Slot[] = ['plaster', 'timber', 'planks', 'stone', 'brick', 'roof', 'cloth', 'metal', 'glow', 'leaf', 'dark', 'banner', 'shop', 'decal'];

/** Shared transform stack: every slot builder of a SlotSet writes through the same current matrix,
 *  so generator modules can be written in local frames (a window in its panel, a lamp on its bracket). */
export class Frame {
  /** visibility part stamped on every vertex emitted through this frame (0 = untracked, never culled) */
  part = 0;
  private stack: THREE.Matrix4[] = [new THREE.Matrix4()];
  private nstack: THREE.Matrix3[] = [new THREE.Matrix3()];
  get m(): THREE.Matrix4 { return this.stack[this.stack.length - 1]; }
  get n(): THREE.Matrix3 { return this.nstack[this.nstack.length - 1]; }
  push(m: THREE.Matrix4): void {
    const c = this.m.clone().multiply(m);
    this.stack.push(c);
    this.nstack.push(new THREE.Matrix3().getNormalMatrix(c));
  }
  pop(): void { this.stack.pop(); this.nstack.pop(); }
}

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
export function mat(pos: V3 = [0, 0, 0], yaw = 0, scale: number | V3 = 1, pitch = 0, roll = 0): THREE.Matrix4 {
  _e.set(pitch, yaw, roll, 'YXZ'); _q.setFromEuler(_e);
  const s = typeof scale === 'number' ? [scale, scale, scale] : scale;
  return new THREE.Matrix4().compose(new THREE.Vector3(...pos), _q.clone(), new THREE.Vector3(s[0], s[1], s[2]));
}
void _m;

export interface FaceOpts {
  tint?: V3;
  /** 1 = no occlusion. A number or one value per vertex. */
  ao?: number | number[];
  aux?: [number, number, number, number];
  /** per-vertex aux.x (sway weight) */
  swayArr?: number[];
  /** explicit uv (2 per vertex) */
  uvs?: number[];
  /** metric uv: 'box' derives from dominant axis of the face; grain picks the long axis for wood */
  grain?: 'x' | 'y' | 'z';
  uvScale?: number;
  uvOff?: [number, number];
  flip?: boolean;
  /** explicit per-vertex normals (smooth shapes) */
  nrm?: V3[];
}

export interface BoxOpts extends FaceOpts {
  skip?: Array<'+x' | '-x' | '+y' | '-y' | '+z' | '-z'>;
  /** vertical ao gradient [bottom, top] applied to side faces */
  aoY?: [number, number];
  aoTop?: number;
  aoBottom?: number;
  /** extra ao multiplier for specific faces */
  aoFace?: Partial<Record<'+x' | '-x' | '+y' | '-y' | '+z' | '-z', number>>;
}

export class MeshBuilder {
  pos: number[] = [];
  nrm: number[] = [];
  uv: number[] = [];
  tint: number[] = [];
  aux: number[] = [];
  idx: number[] = [];
  /** per-vertex visibility part (see Frame.part); whole primitives always share one part */
  part: number[] = [];
  constructor(readonly frame: Frame = new Frame()) {}

  get vertexCount(): number { return this.pos.length / 3; }
  get triCount(): number { return this.idx.length / 3; }

  private vtx(p: V3, n: V3, u: number, v: number, t: V3, ao: number, aux: [number, number, number, number], sway: number | undefined): number {
    const m = this.frame.m.elements;
    const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
    const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
    const z = m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14];
    this.pos.push(x, y, z);
    const nm = this.frame.n.elements;
    let nx = nm[0] * n[0] + nm[3] * n[1] + nm[6] * n[2];
    let ny = nm[1] * n[0] + nm[4] * n[1] + nm[7] * n[2];
    let nz = nm[2] * n[0] + nm[5] * n[1] + nm[8] * n[2];
    const il = 1 / (Math.hypot(nx, ny, nz) || 1);
    this.nrm.push(nx * il, ny * il, nz * il);
    this.uv.push(u, v);
    this.tint.push(t[0], t[1], t[2], ao);
    this.aux.push(sway !== undefined ? sway : aux[0], aux[1], aux[2], aux[3]);
    this.part.push(this.frame.part);
    return this.pos.length / 3 - 1;
  }

  /** Transformed (post-frame) position of a local point – used by generators to emit sockets. */
  world(p: V3): V3 {
    const m = this.frame.m.elements;
    return [
      m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12],
      m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13],
      m[2] * p[0] + m[6] * p[1] + m[10] * p[2] + m[14],
    ];
  }

  worldDir(d: V3): V3 {
    const nm = this.frame.n.elements;
    const x = nm[0] * d[0] + nm[3] * d[1] + nm[6] * d[2], y = nm[1] * d[0] + nm[4] * d[1] + nm[7] * d[2], z = nm[2] * d[0] + nm[5] * d[1] + nm[8] * d[2];
    const l = 1 / (Math.hypot(x, y, z) || 1);
    return [x * l, y * l, z * l];
  }

  private faceN(a: V3, b: V3, c: V3): V3 {
    const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2];
    const vx = c[0] - a[0], vy = c[1] - a[1], vz = c[2] - a[2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    const l = 1 / (Math.hypot(nx, ny, nz) || 1);
    return [nx * l, ny * l, nz * l];
  }

  private boxUV(wp: V3, wn: V3, grain: 'x' | 'y' | 'z' | undefined, scale: number, off: [number, number]): [number, number] {
    const ax = Math.abs(wn[0]), ay = Math.abs(wn[1]), az = Math.abs(wn[2]);
    let u: number, v: number;
    if (ay >= ax && ay >= az) { u = wp[0]; v = wp[2]; }
    else if (ax >= az) { u = wp[2]; v = wp[1]; }
    else { u = wp[0]; v = wp[1]; }
    if (grain) {
      // put the grain axis on v
      const axisIdx = grain === 'x' ? 0 : grain === 'y' ? 1 : 2;
      const dom = ay >= ax && ay >= az ? 1 : ax >= az ? 0 : 2;
      if (axisIdx !== dom) {
        const other = [0, 1, 2].find((i) => i !== dom && i !== axisIdx)!;
        u = wp[other]; v = wp[axisIdx];
      }
    }
    return [u * scale + off[0], v * scale + off[1]];
  }

  /** Quad a,b,c,d counter-clockwise seen from the front face. */
  quad(a: V3, b: V3, c: V3, d: V3, o: FaceOpts = {}): void {
    const P = [a, b, c, d];
    const tint = o.tint ?? [1, 1, 1];
    const aux = o.aux ?? [0, 0, 0, 0];
    const flip = o.flip ? -1 : 1;
    let fn = this.faceN(a, b, d);
    if (flip < 0) fn = [-fn[0], -fn[1], -fn[2]];
    // world-space face normal for uv selection
    const nm = this.frame.n.elements;
    const wn: V3 = [nm[0] * fn[0] + nm[3] * fn[1] + nm[6] * fn[2], nm[1] * fn[0] + nm[4] * fn[1] + nm[7] * fn[2], nm[2] * fn[0] + nm[5] * fn[1] + nm[8] * fn[2]];
    const ids: number[] = [];
    for (let i = 0; i < 4; i++) {
      const ao = Array.isArray(o.ao) ? o.ao[i] : o.ao ?? 1;
      let u: number, v: number;
      if (o.uvs) { u = o.uvs[i * 2]; v = o.uvs[i * 2 + 1]; }
      else [u, v] = this.boxUV(this.world(P[i]), wn, o.grain, o.uvScale ?? 1, o.uvOff ?? [0, 0]);
      ids.push(this.vtx(P[i], o.nrm ? o.nrm[i] : fn, u, v, tint, ao, aux, o.swayArr?.[i]));
    }
    if (flip > 0) this.idx.push(ids[0], ids[1], ids[2], ids[0], ids[2], ids[3]);
    else this.idx.push(ids[0], ids[2], ids[1], ids[0], ids[3], ids[2]);
  }

  tri(a: V3, b: V3, c: V3, o: FaceOpts = {}): void {
    const P = [a, b, c];
    const tint = o.tint ?? [1, 1, 1];
    const aux = o.aux ?? [0, 0, 0, 0];
    let fn = this.faceN(a, b, c);
    if (o.flip) fn = [-fn[0], -fn[1], -fn[2]];
    const nm = this.frame.n.elements;
    const wn: V3 = [nm[0] * fn[0] + nm[3] * fn[1] + nm[6] * fn[2], nm[1] * fn[0] + nm[4] * fn[1] + nm[7] * fn[2], nm[2] * fn[0] + nm[5] * fn[1] + nm[8] * fn[2]];
    const ids: number[] = [];
    for (let i = 0; i < 3; i++) {
      const ao = Array.isArray(o.ao) ? o.ao[i] : o.ao ?? 1;
      let u: number, v: number;
      if (o.uvs) { u = o.uvs[i * 2]; v = o.uvs[i * 2 + 1]; }
      else [u, v] = this.boxUV(this.world(P[i]), wn, o.grain, o.uvScale ?? 1, o.uvOff ?? [0, 0]);
      ids.push(this.vtx(P[i], o.nrm ? o.nrm[i] : fn, u, v, tint, ao, aux, o.swayArr?.[i]));
    }
    if (!o.flip) this.idx.push(ids[0], ids[1], ids[2]);
    else this.idx.push(ids[0], ids[2], ids[1]);
  }

  /** Axis aligned box in the current frame. */
  box(cx: number, cy: number, cz: number, sx: number, sy: number, sz: number, o: BoxOpts = {}): void {
    this.boxMM(cx - sx / 2, cy - sy / 2, cz - sz / 2, cx + sx / 2, cy + sy / 2, cz + sz / 2, o);
  }

  boxMM(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, o: BoxOpts = {}): void {
    const skip = o.skip ?? [];
    const gy = o.aoY ?? [o.aoBottom ?? 1, o.aoTop ?? 1];
    const fa = (f: keyof NonNullable<BoxOpts['aoFace']>) => o.aoFace?.[f] ?? 1;
    const base = (f: keyof NonNullable<BoxOpts['aoFace']>, bottom: number, top: number) => {
      const k = (o.ao as number) ?? 1;
      const m = typeof k === 'number' ? k : 1;
      return [bottom * m * fa(f), bottom * m * fa(f), top * m * fa(f), top * m * fa(f)];
    };
    const q = (f: '+x' | '-x' | '+y' | '-y' | '+z' | '-z', a: V3, b: V3, c: V3, d: V3, ao: number[]) => {
      if (skip.includes(f)) return;
      this.quad(a, b, c, d, { ...o, ao });
    };
    // side faces carry the vertical gradient (bottom verts first)
    q('+z', [x0, y0, z1], [x1, y0, z1], [x1, y1, z1], [x0, y1, z1], base('+z', gy[0], gy[1]));
    q('-z', [x1, y0, z0], [x0, y0, z0], [x0, y1, z0], [x1, y1, z0], base('-z', gy[0], gy[1]));
    q('+x', [x1, y0, z1], [x1, y0, z0], [x1, y1, z0], [x1, y1, z1], base('+x', gy[0], gy[1]));
    q('-x', [x0, y0, z0], [x0, y0, z1], [x0, y1, z1], [x0, y1, z0], base('-x', gy[0], gy[1]));
    const kt = Array.isArray(o.ao) ? 1 : (o.ao ?? 1);
    q('+y', [x0, y1, z1], [x1, y1, z1], [x1, y1, z0], [x0, y1, z0], [kt * fa('+y'), kt * fa('+y'), kt * fa('+y'), kt * fa('+y')]);
    q('-y', [x0, y0, z0], [x1, y0, z0], [x1, y0, z1], [x0, y0, z1], [gy[0] * kt * fa('-y'), gy[0] * kt * fa('-y'), gy[0] * kt * fa('-y'), gy[0] * kt * fa('-y')]);
  }

  /** Extrude a convex polygon (x,z pairs, ordered by increasing atan2(z,x)) between y0 and y1. */
  prism(poly: Array<[number, number]>, y0: number, y1: number, o: BoxOpts & { capTop?: boolean; capBottom?: boolean } = {}): void {
    const n = poly.length;
    const gy = o.aoY ?? [1, 1];
    for (let i = 0; i < n; i++) {
      const a = poly[i], b = poly[(i + 1) % n];
      this.quad([a[0], y0, a[1]], [b[0], y0, b[1]], [b[0], y1, b[1]], [a[0], y1, a[1]], { ...o, flip: !o.flip ? true : false, ao: [gy[0], gy[0], gy[1], gy[1]] });
    }
    if (o.capTop !== false) {
      let cx = 0, cz = 0; for (const p of poly) { cx += p[0]; cz += p[1]; } cx /= n; cz /= n;
      for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; this.tri([cx, y1, cz], [b[0], y1, b[1]], [a[0], y1, a[1]], { ...o, ao: 1 }); }
    }
    if (o.capBottom) {
      let cx = 0, cz = 0; for (const p of poly) { cx += p[0]; cz += p[1]; } cx /= n; cz /= n;
      for (let i = 0; i < n; i++) { const a = poly[i], b = poly[(i + 1) % n]; this.tri([cx, y0, cz], [a[0], y0, a[1]], [b[0], y0, b[1]], { ...o, ao: gy[0] }); }
    }
  }

  /** Surface of revolution around local Y. profile = [radius, y] bottom -> top. Smooth normals. */
  lathe(profile: Array<[number, number]>, segs: number, o: FaceOpts & { open?: boolean; aoY?: [number, number]; uvTile?: number; hard?: number[] } = {}): void {
    const rings = profile.length;
    const nrmP: Array<[number, number]> = [];
    for (let i = 0; i < rings; i++) {
      const a = profile[Math.max(0, i - 1)], b = profile[Math.min(rings - 1, i + 1)];
      const dr = b[0] - a[0], dy = b[1] - a[1];
      const l = Math.hypot(dr, dy) || 1;
      nrmP.push([dy / l, -dr / l]); // outward normal for bottom->top profile
    }
    const yMin = profile[0][1], yMax = profile[rings - 1][1];
    const aoY = o.aoY ?? [1, 1];
    const tint = o.tint ?? [1, 1, 1];
    const aux = o.aux ?? [0, 0, 0, 0];
    const ids: number[][] = [];
    let vAcc = 0;
    const vs: number[] = [0];
    for (let i = 1; i < rings; i++) { vAcc += Math.hypot(profile[i][0] - profile[i - 1][0], profile[i][1] - profile[i - 1][1]); vs.push(vAcc); }
    for (let i = 0; i < rings; i++) {
      const row: number[] = [];
      const ao = aoY[0] + (aoY[1] - aoY[0]) * ((profile[i][1] - yMin) / (yMax - yMin || 1));
      for (let s = 0; s <= segs; s++) {
        const th = (s / segs) * Math.PI * 2;
        const c = Math.cos(th), sn = Math.sin(th);
        const r = profile[i][0];
        row.push(this.vtx([r * c, profile[i][1], r * sn], [nrmP[i][0] * c, nrmP[i][1], nrmP[i][0] * sn], (s / segs) * Math.PI * 2 * Math.max(profile[Math.floor(rings / 2)][0], 0.02) * (o.uvTile ?? 1), vs[i] * (o.uvTile ?? 1), tint, ao, aux, o.swayArr?.[i]));
      }
      ids.push(row);
    }
    for (let i = 0; i < rings - 1; i++) for (let s = 0; s < segs; s++) {
      const a = ids[i][s], b = ids[i][s + 1], c = ids[i + 1][s + 1], d = ids[i + 1][s];
      // lathe angle runs counter-clockwise looking down => outward faces need (a,d,c,b)
      this.idx.push(a, d, c, a, c, b);
    }
  }

  cylinder(r: number, y0: number, y1: number, segs = 8, o: FaceOpts & { capTop?: boolean; capBottom?: boolean; r1?: number } = {}): void {
    const r1 = o.r1 ?? r;
    this.lathe([[r, y0], [r1, y1]], segs, o);
    if (o.capTop !== false) this.lathe([[r1, y1], [0.0001, y1]], segs, { ...o }); // outer->center profile => normal up
    if (o.capBottom) this.lathe([[0.0001, y0], [r, y0]], segs, { ...o });
  }

  /** Tube along a polyline using parallel-transport frames. Smooth. */
  sweep(path: V3[], radius: number | ((t: number) => number), segs = 6, o: FaceOpts & { capEnds?: boolean } = {}): void {
    const n = path.length;
    if (n < 2) return;
    const tint = o.tint ?? [1, 1, 1];
    const aux = o.aux ?? [0, 0, 0, 0];
    const T: V3[] = [];
    for (let i = 0; i < n; i++) {
      const a = path[Math.max(0, i - 1)], b = path[Math.min(n - 1, i + 1)];
      const d: V3 = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
      const l = Math.hypot(...d) || 1; T.push([d[0] / l, d[1] / l, d[2] / l]);
    }
    let up: V3 = Math.abs(T[0][1]) > 0.95 ? [1, 0, 0] : [0, 1, 0];
    const rows: number[][] = [];
    let len = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0) len += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1], path[i][2] - path[i - 1][2]);
      const t = T[i];
      // orthonormal frame
      let nx: V3 = [up[1] * t[2] - up[2] * t[1], up[2] * t[0] - up[0] * t[2], up[0] * t[1] - up[1] * t[0]];
      let l = Math.hypot(...nx) || 1; nx = [nx[0] / l, nx[1] / l, nx[2] / l];
      const bx: V3 = [t[1] * nx[2] - t[2] * nx[1], t[2] * nx[0] - t[0] * nx[2], t[0] * nx[1] - t[1] * nx[0]];
      up = bx;
      const r = typeof radius === 'number' ? radius : radius(i / (n - 1));
      const row: number[] = [];
      for (let s = 0; s <= segs; s++) {
        const th = (s / segs) * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
        const nn: V3 = [nx[0] * c + bx[0] * sn, nx[1] * c + bx[1] * sn, nx[2] * c + bx[2] * sn];
        row.push(this.vtx([path[i][0] + nn[0] * r, path[i][1] + nn[1] * r, path[i][2] + nn[2] * r], nn, (s / segs) * Math.PI * 2 * r * (o.uvScale ?? 1), len * (o.uvScale ?? 1), tint, Array.isArray(o.ao) ? o.ao[i] ?? 1 : o.ao ?? 1, aux, o.swayArr?.[i]));
      }
      rows.push(row);
    }
    for (let i = 0; i < n - 1; i++) for (let s = 0; s < segs; s++) {
      const a = rows[i][s], b = rows[i][s + 1], c = rows[i + 1][s + 1], d = rows[i + 1][s];
      this.idx.push(a, b, c, a, c, d);
    }
  }

  /** Surface from a grid of points P[v][u] with smooth or flat normals. */
  grid(P: V3[][], o: FaceOpts & { smooth?: boolean; uvFn?: (u: number, v: number, p: V3) => [number, number]; aoFn?: (u: number, v: number, p: V3) => number; tintFn?: (u: number, v: number, p: V3) => V3; swayFn?: (u: number, v: number, p: V3) => number } = {}): void {
    const rows = P.length, cols = P[0].length;
    const aux = o.aux ?? [0, 0, 0, 0];
    const N: V3[][] = [];
    for (let j = 0; j < rows; j++) {
      N.push([]);
      for (let i = 0; i < cols; i++) {
        const l = P[j][Math.max(0, i - 1)], r = P[j][Math.min(cols - 1, i + 1)];
        const d = P[Math.max(0, j - 1)][i], u = P[Math.min(rows - 1, j + 1)][i];
        const du: V3 = [r[0] - l[0], r[1] - l[1], r[2] - l[2]], dv: V3 = [u[0] - d[0], u[1] - d[1], u[2] - d[2]];
        let nx = du[1] * dv[2] - du[2] * dv[1], ny = du[2] * dv[0] - du[0] * dv[2], nz = du[0] * dv[1] - du[1] * dv[0];
        const il = 1 / (Math.hypot(nx, ny, nz) || 1);
        const f = o.flip ? -1 : 1;
        N[j].push([nx * il * f, ny * il * f, nz * il * f]);
      }
    }
    // degenerate rows (triangular patches collapse to a point): borrow the neighbouring row's normal
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const n = N[j][i];
      if (n[0] === 0 && n[1] === 0 && n[2] === 0) N[j][i] = j > 0 ? N[j - 1][i] : N[Math.min(rows - 1, j + 1)][i];
    }
    const ids: number[][] = [];
    for (let j = 0; j < rows; j++) {
      ids.push([]);
      for (let i = 0; i < cols; i++) {
        const p = P[j][i];
        const uu = i / (cols - 1), vv = j / (rows - 1);
        const [u, v] = o.uvFn ? o.uvFn(uu, vv, p) : [p[0], p[2]];
        const ao = o.aoFn ? o.aoFn(uu, vv, p) : typeof o.ao === 'number' ? o.ao : 1;
        const t = o.tintFn ? o.tintFn(uu, vv, p) : o.tint ?? [1, 1, 1];
        ids[j].push(this.vtx(p, N[j][i], u, v, t, ao, aux, o.swayFn ? o.swayFn(uu, vv, p) : undefined));
      }
    }
    for (let j = 0; j < rows - 1; j++) for (let i = 0; i < cols - 1; i++) {
      const a = ids[j][i], b = ids[j][i + 1], c = ids[j + 1][i + 1], d = ids[j + 1][i];
      if (!o.flip) this.idx.push(a, b, c, a, c, d); else this.idx.push(a, c, b, a, d, c);
    }
  }

  /** Lumpy ellipsoid blob (sacks, bushes, clay). */
  blob(cx: number, cy: number, cz: number, rx: number, ry: number, rz: number, segsU = 10, segsV = 7, o: FaceOpts & { lump?: (nx: number, ny: number, nz: number) => number } = {}): void {
    const P: V3[][] = [];
    for (let j = 0; j <= segsV; j++) {
      const phi = (j / segsV) * Math.PI;
      const row: V3[] = [];
      for (let i = 0; i <= segsU; i++) {
        const th = (i / segsU) * Math.PI * 2;
        const nx = Math.sin(phi) * Math.cos(th), ny = Math.cos(phi), nz = Math.sin(phi) * Math.sin(th);
        const k = o.lump ? o.lump(nx, ny, nz) : 1;
        row.push([cx + nx * rx * k, cy + ny * ry * k, cz + nz * rz * k]);
      }
      P.push(row);
    }
    // seam closure: copy first column to last so normals match
    for (const row of P) row[segsU] = row[0];
    const cuv: [number, number] | null = o.uvs ? [(o.uvs[0] + o.uvs[4]) / 2, (o.uvs[1] + o.uvs[5]) / 2] : null;
    this.grid(P, { ...o, smooth: true, uvFn: (u, v) => cuv ?? [u * (rx + rz) * Math.PI, v * ry * Math.PI] });
  }

  clear(): void { this.pos.length = this.nrm.length = this.uv.length = this.tint.length = this.aux.length = this.idx.length = this.part.length = 0; }

  /** Append another builder's geometry transformed by m (positions + normals). Tracked parts of `other` are
   *  offset by `partBase` (local part ids -> global); untracked vertices take this builder's current part. */
  append(other: MeshBuilder, m?: THREE.Matrix4, partBase = 0): void {
    const base = this.pos.length / 3;
    for (let i = 0; i < other.part.length; i++) { const p = other.part[i]; this.part.push(p > 0 ? p + partBase : this.frame.part); }
    const nmat = m ? new THREE.Matrix3().getNormalMatrix(m) : null;
    const e = m?.elements, ne = nmat?.elements;
    for (let i = 0; i < other.pos.length; i += 3) {
      const x = other.pos[i], y = other.pos[i + 1], z = other.pos[i + 2];
      if (e) this.pos.push(e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]);
      else this.pos.push(x, y, z);
      const nx = other.nrm[i], ny = other.nrm[i + 1], nz = other.nrm[i + 2];
      if (ne) {
        const ax = ne[0] * nx + ne[3] * ny + ne[6] * nz, ay = ne[1] * nx + ne[4] * ny + ne[7] * nz, az = ne[2] * nx + ne[5] * ny + ne[8] * nz;
        const il = 1 / (Math.hypot(ax, ay, az) || 1);
        this.nrm.push(ax * il, ay * il, az * il);
      } else this.nrm.push(nx, ny, nz);
    }
    for (let i = 0; i < other.uv.length; i++) this.uv.push(other.uv[i]);
    for (let i = 0; i < other.tint.length; i++) this.tint.push(other.tint[i]);
    for (let i = 0; i < other.aux.length; i++) this.aux.push(other.aux[i]);
    // a mirroring transform (negative determinant) must flip the winding or every face turns inside out
    const mirrored = !!m && m.determinant() < 0;
    for (let i = 0; i < other.idx.length; i += 3) {
      const a = other.idx[i] + base, b = other.idx[i + 1] + base, c = other.idx[i + 2] + base;
      if (mirrored) this.idx.push(a, c, b); else this.idx.push(a, b, c);
    }
  }

  /** Split by a per-part class (0..n-1): one compacted builder per class (vertices re-indexed). */
  partition(classOf: (part: number) => number, n: number): MeshBuilder[] {
    const out = Array.from({ length: n }, () => new MeshBuilder());
    const nv = this.pos.length / 3;
    const remap = Array.from({ length: n }, () => new Int32Array(nv).fill(-1));
    const take = (k: number, v: number): number => {
      const r = remap[k], o = out[k];
      let j = r[v];
      if (j < 0) {
        j = o.pos.length / 3; r[v] = j;
        o.pos.push(this.pos[v * 3], this.pos[v * 3 + 1], this.pos[v * 3 + 2]);
        o.nrm.push(this.nrm[v * 3], this.nrm[v * 3 + 1], this.nrm[v * 3 + 2]);
        o.uv.push(this.uv[v * 2], this.uv[v * 2 + 1]);
        o.tint.push(this.tint[v * 4], this.tint[v * 4 + 1], this.tint[v * 4 + 2], this.tint[v * 4 + 3]);
        o.aux.push(this.aux[v * 4], this.aux[v * 4 + 1], this.aux[v * 4 + 2], this.aux[v * 4 + 3]);
        o.part.push(this.part[v]);
      }
      return j;
    };
    const cache = new Map<number, number>();
    for (let i = 0; i < this.idx.length; i += 3) {
      const a = this.idx[i], p = this.part[a];
      let k = cache.get(p);
      if (k === undefined) { k = classOf(p); cache.set(p, k); }
      if (k < 0) continue;
      out[k].idx.push(take(k, a), take(k, this.idx[i + 1]), take(k, this.idx[i + 2]));
    }
    return out;
  }

  /** Visibility-bake geometry: positions + part id only. */
  toPartGeometry(partBase = 0): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.pos), 3));
    g.setAttribute('aPart', new THREE.BufferAttribute(new Float32Array(this.part.map((p) => (p > 0 ? p + partBase : 0))), 1));
    g.setIndex(new THREE.BufferAttribute(this.pos.length / 3 > 65535 ? new Uint32Array(this.idx) : new Uint16Array(this.idx), 1));
    return g;
  }

  /** render geometry of an occludable partition: the usual attributes plus `aOcc`, the occluder index of each vertex's part */
  toOccGeometry(occOf: (part: number) => number): THREE.BufferGeometry {
    const g = this.toGeometry();
    g.setAttribute('aOcc', new THREE.BufferAttribute(new Float32Array(this.part.map(occOf)), 1));
    return g;
  }

  toGeometry(): THREE.BufferGeometry {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.pos), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(new Float32Array(this.nrm), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(this.uv), 2));
    g.setAttribute('aTint', new THREE.BufferAttribute(new Float32Array(this.tint), 4));
    g.setAttribute('aAux', new THREE.BufferAttribute(new Float32Array(this.aux), 4));
    const big = this.pos.length / 3 > 65535;
    g.setIndex(new THREE.BufferAttribute(big ? new Uint32Array(this.idx) : new Uint16Array(this.idx), 1));
    g.computeBoundingBox();
    g.computeBoundingSphere();
    return g;
  }
}

/** One MeshBuilder per material slot, all sharing one transform stack. */
export class SlotSet {
  readonly frame = new Frame();
  readonly plaster = new MeshBuilder(this.frame);
  readonly timber = new MeshBuilder(this.frame);
  readonly planks = new MeshBuilder(this.frame);
  readonly stone = new MeshBuilder(this.frame);
  readonly brick = new MeshBuilder(this.frame);
  readonly roof = new MeshBuilder(this.frame);
  readonly cloth = new MeshBuilder(this.frame);
  readonly metal = new MeshBuilder(this.frame);
  readonly glow = new MeshBuilder(this.frame);
  readonly leaf = new MeshBuilder(this.frame);
  readonly dark = new MeshBuilder(this.frame);
  readonly banner = new MeshBuilder(this.frame);
  readonly shop = new MeshBuilder(this.frame);
  readonly decal = new MeshBuilder(this.frame);

  get(slot: Slot): MeshBuilder { return this[slot]; }
  push(m: THREE.Matrix4): void { this.frame.push(m); }
  pop(): void { this.frame.pop(); }
  at(pos: V3, yaw: number, fn: () => void, scale: number | V3 = 1): void {
    this.frame.push(mat(pos, yaw, scale)); fn(); this.frame.pop();
  }
  with(m: THREE.Matrix4, fn: () => void): void { this.frame.push(m); fn(); this.frame.pop(); }
  /** Append all slots of another set (already built in its own local frame) with a transform. */
  append(other: SlotSet, m?: THREE.Matrix4, partBase = 0): void {
    const cm = this.frame.m.clone();
    if (m) cm.multiply(m);
    for (const s of SLOTS) this.get(s).append(other.get(s), cm, partBase);
  }
  /** set the visibility part for everything emitted inside fn */
  inPart(part: number, fn: () => void): void { const prev = this.frame.part; this.frame.part = part; fn(); this.frame.part = prev; }
  /** split every slot by part class (see MeshBuilder.partition) */
  partition(classOf: (part: number) => number, n: number): SlotSet[] {
    const out = Array.from({ length: n }, () => new SlotSet());
    for (const s of SLOTS) {
      const parts = this.get(s).partition(classOf, n);
      parts.forEach((b, k) => { const d = out[k].get(s); d.pos = b.pos; d.nrm = b.nrm; d.uv = b.uv; d.tint = b.tint; d.aux = b.aux; d.idx = b.idx; d.part = b.part; });
    }
    return out;
  }
  triCount(): number { let t = 0; for (const s of SLOTS) t += this.get(s).triCount; return t; }
}
