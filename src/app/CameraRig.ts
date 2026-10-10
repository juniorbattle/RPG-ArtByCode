import * as THREE from 'three';

/** Fixed 3/4 diorama camera with weak perspective, a tilt-shift style lens shift and a gentle, bounded follow. */
export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(24, 16 / 9, 8, 420);
  yaw = THREE.MathUtils.degToRad(32);
  pitch = THREE.MathUtils.degToRad(31);
  dist = 43;
  fov = 24;
  shiftY = 0.36;
  readonly home = new THREE.Vector3(3.6, 1.2, -1.2);
  private pan = new THREE.Vector3();
  followStrength = 0.22;
  private aspect = 16 / 9;

  setAspect(a: number): void { this.aspect = a; this.apply(); }

  /** call every frame with the player's world position */
  follow(player: THREE.Vector3, dt: number): void {
    const target = new THREE.Vector3((player.x - this.home.x) * this.followStrength, 0, (player.z - this.home.z) * this.followStrength);
    target.x = THREE.MathUtils.clamp(target.x, -3.2, 3.2); target.z = THREE.MathUtils.clamp(target.z, -2.2, 2.2);
    this.pan.lerp(target, 1 - Math.exp(-dt * 2.2));
    this.apply();
  }

  apply(): void {
    const c = this.camera;
    const tgt = this.home.clone().add(this.pan);
    const cp = Math.cos(this.pitch);
    // widen the lens on narrow windows so the composition never crops the street
    const narrow = Math.max(1, (16 / 9) / this.aspect);
    c.fov = this.fov * Math.pow(narrow, 0.85);
    c.aspect = this.aspect;
    c.position.set(tgt.x + this.dist * Math.sin(this.yaw) * cp, tgt.y + this.dist * Math.sin(this.pitch), tgt.z + this.dist * Math.cos(this.yaw) * cp);
    c.up.set(0, 1, 0);
    c.lookAt(tgt);
    c.updateProjectionMatrix();
    c.projectionMatrix.elements[9] = this.shiftY;
    c.projectionMatrixInverse.copy(c.projectionMatrix).invert();
    c.updateMatrixWorld(true);
  }

  /** screen -> world on the street plane (y = h) */
  groundPoint(ndcX: number, ndcY: number, h = 0): THREE.Vector3 | null {
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(ndcX, ndcY), this.camera);
    const t = (h - ray.ray.origin.y) / ray.ray.direction.y;
    return t > 0 ? ray.ray.origin.clone().addScaledVector(ray.ray.direction, t) : null;
  }
}
