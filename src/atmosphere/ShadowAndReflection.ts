import * as THREE from 'three';
import { U } from './SceneUniforms';

/** Render layers: 0 = visible to main + reflection, 1 = moon shadow casters, 2 = main only (ground, water, decals, particles). */
export const LAYER_CAST = 1;
export const LAYER_NOREFLECT = 2;

/** One directional moon shadow rendered on demand (the world is static; sprites use contact decals). */
export class MoonShadow {
  readonly rt: THREE.WebGLRenderTarget;
  readonly cam = new THREE.OrthographicCamera(-30, 30, 30, -30, 1, 160);
  private mat = new THREE.MeshBasicMaterial({ colorWrite: false });
  constructor(readonly size = 2048) {
    const depth = new THREE.DepthTexture(size, size);
    depth.type = THREE.UnsignedIntType;
    this.rt = new THREE.WebGLRenderTarget(size, size, { depthBuffer: true, depthTexture: depth, magFilter: THREE.NearestFilter, minFilter: THREE.NearestFilter });
    this.cam.layers.set(LAYER_CAST);
    U.uShadowMap.value = depth;
    U.uShadowTexel.value = 1 / size;
  }

  update(renderer: THREE.WebGLRenderer, scene: THREE.Scene, center: THREE.Vector3, moonDir: THREE.Vector3, halfW = 34, halfH = 26): void {
    const c = this.cam;
    c.left = -halfW; c.right = halfW; c.top = halfH; c.bottom = -halfH;
    c.position.copy(center).addScaledVector(moonDir, 70);
    c.up.set(0, 1, 0); c.lookAt(center);
    c.near = 1; c.far = 150;
    c.updateProjectionMatrix(); c.updateMatrixWorld(true);
    const prev = renderer.getRenderTarget();
    const prevOverride = scene.overrideMaterial;
    scene.overrideMaterial = this.mat;
    renderer.setRenderTarget(this.rt);
    renderer.setClearColor(0x000000, 1);
    renderer.clear(true, true, true);
    renderer.render(scene, c);
    scene.overrideMaterial = prevOverride;
    renderer.setRenderTarget(prev);
    U.uShadowVP.value.multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse);
  }
}

/** Planar reflection of the street plane (y = 0), sampled by the ground shader in puddles and wet stone. */
export class PlanarReflection {
  rt: THREE.WebGLRenderTarget;
  readonly cam = new THREE.PerspectiveCamera();
  scale = 0.5;
  enabled = true;
  /** geometry below this height is clipped from the mirror pass (the water level, so hulls and quay walls reflect) */
  clipY = 0;
  private w = 2; private h = 2;
  constructor() {
    this.rt = this.make(2, 2);
    this.cam.layers.set(0);
  }
  private make(w: number, h: number): THREE.WebGLRenderTarget {
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, depthBuffer: true, generateMipmaps: true, minFilter: THREE.LinearMipmapLinearFilter, magFilter: THREE.LinearFilter });
    return rt;
  }
  setSize(w: number, h: number): void {
    const rw = Math.max(2, Math.round(w * this.scale)), rh = Math.max(2, Math.round(h * this.scale));
    if (rw === this.w && rh === this.h) return;
    this.w = rw; this.h = rh;
    this.rt.dispose(); this.rt = this.make(rw, rh);
    U.uReflMap.value = this.rt.texture;
  }
  textureBytes(): number { return this.w * this.h * 8 * 1.33; }

  update(renderer: THREE.WebGLRenderer, scene: THREE.Scene, main: THREE.PerspectiveCamera): void {
    if (!this.enabled) { U.uReflReady.value = 0; return; }
    const c = this.cam;
    const target = new THREE.Vector3(0, 0, -1).applyQuaternion(main.quaternion).add(main.position);
    c.position.set(main.position.x, -main.position.y, main.position.z);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(main.quaternion);
    c.up.set(up.x, -up.y, up.z);
    c.lookAt(target.x, -target.y, target.z);
    c.fov = main.fov; c.aspect = main.aspect; c.near = main.near; c.far = main.far;
    c.updateProjectionMatrix(); c.updateMatrixWorld(true);
    const prev = renderer.getRenderTarget();
    const prevClip = U.uClipY.value;
    U.uClipY.value = this.clipY;
    renderer.setRenderTarget(this.rt);
    renderer.setClearColor(0x04060c, 1);
    renderer.clear(true, true, true);
    renderer.render(scene, c);
    renderer.setRenderTarget(prev);
    U.uClipY.value = prevClip;
    U.uReflVP.value.multiplyMatrices(c.projectionMatrix, c.matrixWorldInverse);
    U.uReflMap.value = this.rt.texture;
    U.uReflReady.value = 1;
  }
}
