import * as THREE from 'three';

/** Orbit pose of the exploration camera: the camera sits `dist` metres from `target` along yaw / pitch. */
export interface CamPose { yaw: number; pitch: number; dist: number; fov: number; shift: number; tx: number; ty: number; tz: number }

/** Place a perspective camera at a pose (shared by the rig and the visibility bake, so both see the same frame). */
export function applyPose(c: THREE.PerspectiveCamera, p: CamPose, aspect: number, fovScale = 1): void {
  const cp = Math.cos(p.pitch);
  // widen the lens on narrow windows so the composition never crops the street
  const narrow = Math.max(1, (16 / 9) / aspect);
  c.fov = p.fov * Math.pow(narrow, 0.85) * fovScale;
  c.aspect = aspect;
  c.position.set(p.tx + p.dist * Math.sin(p.yaw) * cp, p.ty + p.dist * Math.sin(p.pitch), p.tz + p.dist * Math.cos(p.yaw) * cp);
  c.up.set(0, 1, 0);
  c.lookAt(p.tx, p.ty, p.tz);
  c.updateProjectionMatrix();
  c.projectionMatrix.elements[9] = p.shift;
  c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
  c.updateMatrixWorld(true);
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
  private aspect = 16 / 9;

  setAspect(a: number): void { this.aspect = a; this.apply(); }

  get target(): THREE.Vector3 { return this.pivot.clone(); }

  setPose(p: CamPose): void {
    this.yaw = p.yaw; this.pitch = p.pitch; this.dist = p.dist; this.fov = p.fov; this.shiftY = p.shift;
    this.pivot.set(p.tx, p.ty, p.tz);
    this.apply();
  }

  get aspectRatio(): number { return this.aspect; }

  apply(): void {
    applyPose(this.camera, { yaw: this.yaw, pitch: this.pitch, dist: this.dist, fov: this.fov, shift: this.shiftY, tx: this.pivot.x, ty: this.pivot.y, tz: this.pivot.z }, this.aspect);
  }

  /** screen -> world on the street plane (y = h) */
  groundPoint(ndcX: number, ndcY: number, h = 0): THREE.Vector3 | null {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const t = (h - ray.ray.origin.y) / ray.ray.direction.y;
    return t > 0 ? ray.ray.origin.clone().addScaledVector(ray.ray.direction, t) : null;
  }
}
