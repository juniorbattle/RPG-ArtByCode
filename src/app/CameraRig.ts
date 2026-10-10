import * as THREE from 'three';

/** Semi-fixed exploration camera authored for the zone: a low, near-level 3/4 view from across the canal
 *  (water in the foreground, the quay and its frontage beyond, the city rising behind). The angle never changes;
 *  the rig only dollies along the quay to keep the player readable, with a small lateral parallax. */
export class CameraRig {
  readonly camera = new THREE.PerspectiveCamera(34, 16 / 9, 1.5, 900);
  yaw = THREE.MathUtils.degToRad(-55);
  pitch = THREE.MathUtils.degToRad(5);
  dist = 30;
  fov = 34;
  shiftY = 0;
  /** orbit pivot of the authored framing (camera sits dist metres behind it along yaw/pitch) */
  readonly home = new THREE.Vector3(2.9, 3.1, 1.55);
  /** where the framing expects the player; follow offsets are measured from here */
  readonly followRef = new THREE.Vector3(-7.5, 0, 1.8);
  private pan = new THREE.Vector3();
  followStrength = 0.5;
  /** dolly limits along the quay (x) and the lateral parallax band (z) */
  followMin = new THREE.Vector3(-4, 0, -0.6);
  followMax = new THREE.Vector3(23, 0, 0.6);
  private aspect = 16 / 9;

  setAspect(a: number): void { this.aspect = a; this.apply(); }

  /** distance from the camera to the current pivot (used for autofocus fallbacks) */
  get target(): THREE.Vector3 { return this.home.clone().add(this.pan); }

  private followTarget(player: THREE.Vector3): THREE.Vector3 {
    const k = this.followStrength;
    return new THREE.Vector3((player.x - this.followRef.x) * k, 0, (player.z - this.followRef.z) * k * 0.3).clamp(this.followMin, this.followMax);
  }

  /** call every frame with the player's world position */
  follow(player: THREE.Vector3, dt: number): void {
    this.pan.lerp(this.followTarget(player), 1 - Math.exp(-dt * 1.8));
    this.apply();
  }

  /** jump straight to the settled follow framing (spawn / teleport / screenshots) */
  snap(player: THREE.Vector3): void { this.pan.copy(this.followTarget(player)); this.apply(); }

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
