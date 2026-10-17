import * as THREE from 'three';

/** Orbit pose of the exploration camera: the camera sits `dist` metres from `target` along yaw / pitch. */
export interface CamPose { yaw: number; pitch: number; dist: number; fov: number; shift: number; tx: number; ty: number; tz: number }

/** the aspect the framings are authored for: the vertical field of view of a pose is the one it has at 16:9 */
export const REF_ASPECT = 16 / 9;

/** Place a perspective camera at a pose (shared by the rig, the camera graph and the visibility bake, so all see the same frame). The
 *  vertical field is the pose's at every aspect: a wider frame sees more on the sides. Windows narrower than 16:9 are not placed
 *  here but cropped out of the 16:9 frame (applyFrame); they used to widen the lens (x2.7 at 665 x 1200: the district shrank to a
 *  band between sky and water). */
export function applyPose(c: THREE.PerspectiveCamera, p: CamPose, aspect: number, fovScale = 1): void {
  const cp = Math.cos(p.pitch);
  c.fov = p.fov * fovScale;
  c.aspect = aspect;
  c.position.set(p.tx + p.dist * Math.sin(p.yaw) * cp, p.ty + p.dist * Math.sin(p.pitch), p.tz + p.dist * Math.cos(p.yaw) * cp);
  c.up.set(0, 1, 0);
  c.lookAt(p.tx, p.ty, p.tz);
  c.updateProjectionMatrix();
  c.projectionMatrix.elements[9] = p.shift;
  c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
  c.updateMatrixWorld(true);
}

const _f = new THREE.Vector3();
/** Place the camera of a window of aspect `aspect`. The window shows the frame of aspect clamp(aspect, REF_ASPECT, frame), where
 *  `frame` is the widest frame the visibility bake covered: between 16:9 and `frame` that is applyPose itself (as before). A window
 *  narrower than 16:9 shows a horizontal crop of the 16:9 frame, a window wider than `frame` (until the district is re-baked for it)
 *  a vertical crop of that frame. The crop is placed with an off-axis lens shift so the focus point (the player) keeps the NDC it has
 *  in the full frame: the shot keeps its composition around the player, and the crop never leaves the baked frame, so it can never
 *  show a part the bake culled. */
export function applyFrame(c: THREE.PerspectiveCamera, p: CamPose, aspect: number, frame: number, focus: THREE.Vector3 | null): void {
  if (aspect >= REF_ASPECT && aspect <= frame) { applyPose(c, p, aspect); return; }
  const full = aspect < REF_ASPECT ? REF_ASPECT : frame;
  applyPose(c, p, full);
  if (focus) _f.copy(focus).project(c); else _f.set(0, 0, 0);
  const fx = Math.max(-1, Math.min(1, _f.x)), fy = Math.max(-1, Math.min(1, _f.y));
  if (aspect < full) {
    // the crop is k of the frame's width, centred at fx (1 - k): the focus stays at NDC fx
    const k = aspect / full;
    c.aspect = aspect;
    c.updateProjectionMatrix();
    c.projectionMatrix.elements[9] = p.shift;
    c.projectionMatrix.elements[8] = (fx * (1 - k)) / k;
  } else {
    const k = full / aspect;
    c.fov = (2 * Math.atan(Math.tan((c.fov * Math.PI) / 360) * k) * 180) / Math.PI;
    c.aspect = aspect;
    c.updateProjectionMatrix();
    c.projectionMatrix.elements[9] = (p.shift + fy * (1 - k)) / k;
  }
  c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
}

/** Applies a camera pose. The pose itself is authored by the CameraGraph (three semi-fixed framings blended
 *  along the quay); `?cam=` puts the rig in manual mode with a fixed pose. */
export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(34, 16 / 9, 1.5, 900);
  yaw = THREE.MathUtils.degToRad(-55);
  pitch = THREE.MathUtils.degToRad(5);
  dist = 30;
  fov = 34;
  shiftY = 0;
  /** orbit pivot of the current framing */
  readonly pivot = new THREE.Vector3(2.9, 3.1, 1.55);
  /** manual pose (from ?cam=): the graph stops driving the rig */
  manual = false;
  /** the widest frame aspect the district's visibility bake covered (Infinity: nothing culled, any frame is safe) */
  frame = Infinity;
  /** the point a cropped window keeps in place (the camera graph sets the player's torso; null: centred crop) */
  focus: THREE.Vector3 | null = null;
  private aspect = 16 / 9;

  setAspect(a: number): void { this.aspect = a; this.apply(); }

  get target(): THREE.Vector3 { return this.pivot.clone(); }

  setPose(p: CamPose): void {
    this.yaw = p.yaw; this.pitch = p.pitch; this.dist = p.dist; this.fov = p.fov; this.shiftY = p.shift;
    this.pivot.set(p.tx, p.ty, p.tz);
    this.apply();
  }

  get aspectRatio(): number { return this.aspect; }
  /** aspect of the full frame the window shows (the graph composes its poses in it): the window, clamped to [16:9, frame] */
  get poseAspect(): number { return Math.min(Math.max(this.aspect, REF_ASPECT), this.frame); }

  apply(): void {
    applyFrame(this.camera, { yaw: this.yaw, pitch: this.pitch, dist: this.dist, fov: this.fov, shift: this.shiftY, tx: this.pivot.x, ty: this.pivot.y, tz: this.pivot.z }, this.aspect, this.frame, this.focus);
  }

  /** screen -> world on the street plane (y = h) */
  groundPoint(ndcX: number, ndcY: number, h = 0): THREE.Vector3 | null {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const t = (h - ray.ray.origin.y) / ray.ray.direction.y;
    return t > 0 ? ray.ray.origin.clone().addScaledVector(ray.ray.direction, t) : null;
  }
}
