import * as THREE from 'three';
import { U, OCC_MAX } from '../atmosphere/SceneUniforms';

/** Player occlusion reveal (V1: the player only).
 *
 *  Detection is CPU-side and cheap: the camera -> player-torso segment is tested against small proxy boxes of the
 *  few occludable parts / instances (voxelised from their real vertices). Each occluder owns a fade (fast in, slow
 *  out, with a release delay and a wider re-test radius while active, so nothing flickers at a boundary). The
 *  fades and one screen-space ellipse around the player go to the shared uniforms; the occludable surface variants
 *  (ShaderChunks `occReveal`) discard the fragments of a faded occluder that sit between the camera and the player
 *  inside that ellipse, so the sprite behind really renders (colour and depth) while the rest of the object stays
 *  solid. Everything else in the scene never pays for any of it. */

export type OccStyle = 'soft' | 'dither' | 'hybrid';
export const OCC_STYLES: OccStyle[] = ['soft', 'dither', 'hybrid'];

export interface OccluderDef {
  name: string;
  /** a static visibility part (merged geometry) or one instance of an instanced prototype */
  kind: 'part' | 'instance';
  part?: number;
  /** world proxy boxes, 6 floats each (x0 y0 z0 x1 y1 z1) */
  boxes: Float32Array;
}
export interface OccMeshRef {
  mesh: THREE.Mesh; base: THREE.Material; variant: THREE.Material;
  /** static occluder meshes are only visible while a reveal is active (idle: the main mesh's prefix draws them) */
  hideWhenIdle?: boolean;
}

/** Reveal ellipse size, shared by the runtime and the visibility bake. All values in pixels at `renderH`;
 *  `heightPx` = the sprite's apparent height there. Reference at 1080p: inner semi-axis 40..70, outer 80..120. */
export function revealSize(heightPx: number, renderH: number): { rx: number; ry: number; k: number } {
  const s = renderH / 1080, h = heightPx / s;
  const inner = THREE.MathUtils.clamp(0.5 * h, 40, 70), outer = THREE.MathUtils.clamp(inner * 1.75, 80, 120);
  return { rx: 0.8 * inner * s, ry: inner * s, k: outer / inner };
}

const _v = new THREE.Vector3(), _w = new THREE.Vector3();
function project(cam: THREE.PerspectiveCamera, x: number, y: number, z: number, out: THREE.Vector3): THREE.Vector3 {
  return out.set(x, y, z).applyMatrix4(cam.matrixWorldInverse).applyMatrix4(cam.projectionMatrix);
}

/** the player's reveal ellipse seen through `cam`: centre in NDC, apparent sprite height in NDC-y units */
export function playerReveal(cam: THREE.PerspectiveCamera, px: number, py: number, pz: number, heightM: number, scale: number): { cx: number; cy: number; depth: number; hNdc: number } {
  const t = project(cam, px, py + 0.55 * heightM * scale, pz, _v);
  const depth = -_w.set(px, py + 0.55 * heightM * scale, pz).applyMatrix4(cam.matrixWorldInverse).z;
  const feet = project(cam, px, py, pz, _w).y, head = project(cam, px, py + heightM * scale, pz, new THREE.Vector3()).y;
  return { cx: t.x, cy: t.y, depth, hNdc: Math.abs(head - feet) };
}

/** voxelise vertices into small AABBs (one per occupied cell): a tight, cheap proxy for thin or sparse objects */
export function voxelBoxes(pos: ArrayLike<number>, sel: (vertex: number) => boolean = () => true, cell = 0.5): Float32Array {
  const m = new Map<string, number[]>();
  const n = pos.length / 3;
  for (let i = 0; i < n; i++) {
    if (!sel(i)) continue;
    const x = pos[i * 3], y = pos[i * 3 + 1], z = pos[i * 3 + 2];
    const k = `${Math.floor(x / cell)},${Math.floor(y / cell)},${Math.floor(z / cell)}`;
    const b = m.get(k);
    if (!b) m.set(k, [x, y, z, x, y, z]);
    else { b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.min(b[2], z); b[3] = Math.max(b[3], x); b[4] = Math.max(b[4], y); b[5] = Math.max(b[5], z); }
  }
  return new Float32Array([...m.values()].flat());
}

/** segment a -> b against boxes inflated by r (slab test) */
function segHitsBoxes(ax: number, ay: number, az: number, bx: number, by: number, bz: number, boxes: Float32Array, r: number): boolean {
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  for (let i = 0; i < boxes.length; i += 6) {
    let t0 = 0, t1 = 1, ok = true;
    for (let a = 0; a < 3 && ok; a++) {
      const o = a === 0 ? ax : a === 1 ? ay : az, d = a === 0 ? dx : a === 1 ? dy : dz;
      const lo = boxes[i + a] - r, hi = boxes[i + 3 + a] + r;
      if (Math.abs(d) < 1e-9) { if (o < lo || o > hi) ok = false; continue; }
      let u = (lo - o) / d, v = (hi - o) / d;
      if (u > v) { const s = u; u = v; v = s; }
      if (u > t0) t0 = u;
      if (v < t1) t1 = v;
      if (t0 > t1) ok = false;
    }
    if (ok) return true;
  }
  return false;
}

interface State { fade: number; on: boolean; hold: number }

export class OcclusionReveal {
  enabled = true;
  style: OccStyle = 'hybrid';
  /** 'all' forces every occluder open, a number list forces those indices (review shots / visibility proof) */
  force: 'all' | number[] | null = null;
  /** seconds: fade in / fade out / release delay; metres: proxy inflation to enter / to stay active */
  tIn = 0.2; tOut = 0.3; release = 0.25; rEnter = 0.35; rStay = 0.5;
  defs: OccluderDef[] = [];
  meshes: OccMeshRef[] = [];
  private st: State[] = [];
  private variantOn = false;
  stats = { eligible: 0, active: 0, tests: 0, cpuMs: 0, centre: [0, 0] as [number, number], radii: [0, 0, 0] as [number, number, number] };
  private dbg: { c: HTMLCanvasElement; g: CanvasRenderingContext2D } | null = null;

  /** called when the first fade starts / the last one ends (the district swaps the main meshes' occluder prefix for the occluder meshes) */
  onActive: ((active: boolean) => void) | null = null;

  setup(defs: OccluderDef[], meshes: OccMeshRef[], onActive: ((active: boolean) => void) | null = null): void {
    this.defs = defs; this.meshes = meshes; this.onActive = onActive;
    this.st = defs.map(() => ({ fade: 0, on: false, hold: 0 }));
    this.variantOn = false;
    for (const m of meshes) m.mesh.material = m.base;
    U.uOccFade.value.fill(0);
    this.stats.eligible = defs.length;
  }

  fades(): number[] { return this.st.map((s) => s.fade); }
  activeNames(): string[] { return this.defs.filter((_, i) => this.st[i].fade > 0.01).map((d) => d.name); }

  debug(on: boolean): void {
    if (on && !this.dbg) {
      const c = document.createElement('canvas');
      c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;pointer-events:none;z-index:30';
      document.body.appendChild(c);
      this.dbg = { c, g: c.getContext('2d')! };
    } else if (!on && this.dbg) { this.dbg.c.remove(); this.dbg = null; }
  }

  /** runs after the camera graph has produced the frame's final pose (settled or mid-blend) */
  update(dt: number, cam: THREE.PerspectiveCamera, player: { pos: THREE.Vector3; height: number; scale: number } | null, charScale: number, W: number, H: number): void {
    const t0 = performance.now();
    let tests = 0;
    const fade = U.uOccFade.value;
    if (!player || !this.enabled) {
      for (let i = 0; i < this.st.length; i++) { const s = this.st[i]; s.on = false; s.fade = 0; fade[i] = 0; }
    } else {
      const S = charScale * player.scale, p = player.pos;
      const tx = p.x, ty = p.y + 0.55 * player.height * S, tz = p.z;
      const c = cam.position;
      for (let i = 0; i < this.defs.length; i++) {
        const s = this.st[i];
        const forced = this.force === 'all' || (Array.isArray(this.force) && this.force.includes(i));
        tests++;
        const hit = forced || segHitsBoxes(c.x, c.y, c.z, tx, ty, tz, this.defs[i].boxes, s.on ? this.rStay : this.rEnter);
        if (hit) { s.on = true; s.hold = this.release; } else if (s.on) { s.hold -= dt; if (s.hold <= 0) s.on = false; }
        const rate = (s.on ? 1 / this.tIn : 1 / this.tOut) * dt;
        s.fade = Math.max(0, Math.min(1, s.fade + THREE.MathUtils.clamp((s.on ? 1 : 0) - s.fade, -rate, rate)));
        fade[i] = s.fade * s.fade * (3 - 2 * s.fade);
      }
      const any = this.st.some((s) => s.fade > 0.001);
      if (any) {
        const r = playerReveal(cam, p.x, p.y, p.z, player.height, S);
        const sz = revealSize(r.hNdc * 0.5 * H, H);
        const cx = Math.round((r.cx * 0.5 + 0.5) * W), cy = Math.round((r.cy * 0.5 + 0.5) * H);
        U.uOccC.value.set(cx, cy, r.depth, OCC_STYLES.indexOf(this.style));
        U.uOccR.value.set(sz.rx, sz.ry, sz.k, 0);
        this.stats.centre = [cx, cy]; this.stats.radii = [sz.rx, sz.ry, sz.k];
      }
    }
    for (let i = this.st.length; i < OCC_MAX; i++) fade[i] = 0;
    const active = this.st.some((s) => s.fade > 0.001);
    if (active !== this.variantOn) { this.variantOn = active; for (const m of this.meshes) m.mesh.material = active ? m.variant : m.base; this.onActive?.(active); }
    this.stats.active = this.st.filter((s) => s.on).length;
    this.stats.tests = tests;
    this.stats.cpuMs += (performance.now() - t0 - this.stats.cpuMs) * 0.1;
    if (this.dbg) this.drawDebug(cam, player, W, H);
  }

  private drawDebug(cam: THREE.PerspectiveCamera, player: { pos: THREE.Vector3; height: number } | null, W: number, H: number): void {
    const { c, g } = this.dbg!;
    const cw = window.innerWidth, ch = window.innerHeight;
    if (c.width !== cw || c.height !== ch) { c.width = cw; c.height = ch; }
    g.clearRect(0, 0, cw, ch);
    const sx = (n: number) => (n * 0.5 + 0.5) * cw, sy = (n: number) => (1 - (n * 0.5 + 0.5)) * ch;
    const edges = [[0, 1], [1, 3], [3, 2], [2, 0], [4, 5], [5, 7], [7, 6], [6, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
    const pt = new THREE.Vector3();
    this.defs.forEach((d, i) => {
      const on = this.st[i].fade > 0.01;
      g.strokeStyle = on ? 'rgba(255,70,90,0.95)' : 'rgba(80,255,170,0.35)'; g.lineWidth = on ? 1.5 : 1;
      for (let b = 0; b < d.boxes.length; b += 6) {
        const bx = d.boxes, pts: Array<[number, number, number]> = [];
        for (let k = 0; k < 8; k++) { const p = project(cam, bx[b + (k & 1 ? 3 : 0)], bx[b + 1 + (k & 2 ? 3 : 0)], bx[b + 2 + (k & 4 ? 3 : 0)], pt); pts.push([sx(p.x), sy(p.y), p.z]); }
        if (pts.some((q) => q[2] > 1)) continue;
        g.beginPath(); for (const [a, e] of edges) { g.moveTo(pts[a][0], pts[a][1]); g.lineTo(pts[e][0], pts[e][1]); } g.stroke();
      }
    });
    if (player && this.stats.radii[1] > 0) {
      const k = cw / W, [cx, cy] = this.stats.centre, [rx, ry, kk] = this.stats.radii;
      const x = cx * k, y = (H - cy) * (ch / H);
      g.strokeStyle = 'rgba(120,220,255,0.9)'; g.setLineDash([]);
      g.beginPath(); g.ellipse(x, y, rx * k, ry * (ch / H), 0, 0, Math.PI * 2); g.stroke();
      g.setLineDash([4, 4]); g.beginPath(); g.ellipse(x, y, rx * kk * k, ry * kk * (ch / H), 0, 0, Math.PI * 2); g.stroke();
      g.fillStyle = 'rgba(120,220,255,0.9)'; g.fillRect(x - 2, y - 2, 4, 4);
      g.font = '11px monospace'; g.fillStyle = '#9fe'; g.setLineDash([]);
      g.fillText(`occ ${this.stats.active}/${this.stats.eligible} [${this.activeNames().join(', ')}] style ${this.style}`, 12, ch - 12);
    }
  }
}
