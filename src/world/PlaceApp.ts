import * as THREE from 'three';
import { MaterialLibrary } from '../materials/MaterialLibrary';
import { defaultPainters } from '../materials/PainterPool';
import { PostFX } from '../atmosphere/PostFX';
import { MoonShadow, PlanarReflection, LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import { LightRig } from '../atmosphere/LightRig';
import { ParticleSystem } from '../atmosphere/Particles';
import { U } from '../atmosphere/SceneUniforms';
import { buildSky } from '../atmosphere/Sky';
import { applyPose, type CamPose } from '../app/CameraRig';
import { FrameCap, parseFrameCap } from '../app/FrameCap';
import { PerfMonitor } from '../debug/PerfMonitor';
import { buildLanternRow, type PlaceBuild } from './LanternRow';

/** A light place of the play mode (journal Passe L6): one generated scene, one fixed framing, the town's renderer (its materials, lights,
 *  sky, moon shadow, puddle reflection and post chain), no bake, no actor. Lantern Row is the first and only one: a mock-up (choice P3). */

export interface PlaceOptions { canvas: HTMLCanvasElement; params: URLSearchParams; onProgress: (label: string, f: number) => void }

/** the street seen from its mouth, from a first floor's height: the two rows receding to the far houses; a grazing view (4 deg) turned the
 *  wet cobbles into a mirror of the sky (journal Passe L6) */
const POSE: CamPose = { yaw: 0, pitch: THREE.MathUtils.degToRad(11), dist: 11, fov: 44, shift: 0, tx: 0, ty: 2.4, tz: -9 };
/** a high moon over the street's end, its light raking the right-hand facades */
const MOON_DIR = new THREE.Vector3(-0.35, 0.55, -0.76).normalize();

export class PlaceApp {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(48, 16 / 9, 0.3, 600);
  readonly post: PostFX;
  readonly shadow = new MoonShadow(2048);
  readonly reflection = new PlanarReflection();
  readonly lights = new LightRig();
  readonly frameCap = new FrameCap();
  readonly perf = new PerfMonitor();
  lib!: MaterialLibrary;
  place!: PlaceBuild;
  particles!: ParticleSystem;
  time = 0;
  frozen: number | null = null;
  frameCount = 0;
  buildMs = 0;
  private lastT = performance.now();

  constructor(private opts: PlaceOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false });
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;
    this.perf.attach(this.renderer.getContext() as WebGL2RenderingContext);
    this.post = new PostFX(this.renderer);
    const q = opts.params;
    if (q.has('gpuprof')) this.perf.gpu.enabled = true;
    this.frameCap.mode = parseFrameCap(q.get('fps')) ?? { kind: 'adaptive', fps: 60 };
    if (q.has('freeze')) this.frozen = parseFloat(q.get('freeze')!);
    this.scene.add(this.camera);
    // the ground and the decals are main-pass only (LAYER_NOREFLECT), as in the town and the arena
    this.camera.layers.enable(LAYER_NOREFLECT);
    this.scene.add(buildSky());
    this.reflection.clipY = 0;
    U.uMoonDir.value.copy(MOON_DIR);
    U.uMoonCol.value.setRGB(0.27, 0.37, 0.58);
    window.addEventListener('resize', () => this.resize());
  }

  async init(): Promise<void> {
    const pq = this.opts.params.get('painters');
    const painters = pq === 'main' ? 0 : pq !== null && /^\d+$/.test(pq) ? +pq : defaultPainters();
    this.frameCap.probe();
    this.lib = await MaterialLibrary.build(this.renderer, this.opts.onProgress, painters);
    this.frameCap.endProbe();
    this.opts.onProgress('lantern row', 0.97);
    await new Promise((r) => setTimeout(r, 0));
    const t0 = performance.now();
    this.place = buildLanternRow(this.lib, 1842);
    this.buildMs = performance.now() - t0;
    this.scene.add(this.place.group);
    for (const l of this.place.lights) this.lights.add(l, 'static', Math.abs(Math.sin(l.pos[0] * 12.9 + l.pos[2] * 78.2)));
    this.particles = new ParticleSystem(this.lib);
    this.particles.setEmitters(this.place.emitters);
    this.scene.add(this.particles.group);
    this.resize();
    this.lights.update(this.time, 0, this.camera);
    this.shadow.update(this.renderer, this.scene, new THREE.Vector3(0, 0, -14), MOON_DIR, 30, 24);
    const prev = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.post.sceneRT);
    const linked = this.renderer.compileAsync(this.scene, this.camera);
    this.renderer.setRenderTarget(prev);
    await linked;
    this.render();
  }

  resize(): void {
    const w = window.innerWidth, h = window.innerHeight, pr = Math.min(window.devicePixelRatio || 1, 2);
    this.post.setSize(w, h, pr);
    this.reflection.setSize(w * pr, h * pr);
    U.uResolution.value.set(this.post.width, this.post.height);
    applyPose(this.camera, POSE, w / Math.max(1, h));
  }

  update(dt: number): void {
    this.time = this.frozen ?? this.time + dt;
    U.uTime.value = this.time;
    U.uMoonDir.value.copy(MOON_DIR);
    const v = new THREE.Vector3(0, 1.6, -10).applyMatrix4(this.camera.matrixWorldInverse);
    this.post.params.dofFocus = THREE.MathUtils.clamp(-v.z, 6, 40);
    this.lights.update(this.time, dt, this.camera);
    this.particles.update(dt, this.time, this.camera, this.post.height, this.lights, null);
  }

  render(): void {
    const r = this.renderer, gpu = this.perf.gpu;
    this.perf.beginFrame();
    r.info.reset();
    gpu.begin('reflection');
    this.reflection.update(r, this.scene, this.camera);
    this.post.render(this.scene, this.camera, this.time, gpu);
    gpu.end(); gpu.poll();
    this.perf.endFrame(r);
    this.frameCount++;
  }

  start(): void {
    const loop = (t: number) => {
      if (this.frameCap.shouldRender(t)) { const now = performance.now(), dt = Math.min(0.05, (now - this.lastT) / 1000); this.lastT = now; this.update(dt); this.render(); }
      requestAnimationFrame(loop);
    };
    this.lastT = performance.now();
    requestAnimationFrame(loop);
  }

  snapshot(): Record<string, unknown> {
    const p = this.perf;
    return { fps: p.fps, frameMs: p.frameMs, drawCalls: p.drawCalls, triangles: p.triangles, placeTriangles: this.place?.stats.triangles, instances: this.place?.stats.instances, buildings: this.place?.stats.buildings, lights: this.lights.sources.length, lightsOnScreen: this.lights.active, generatorMs: this.buildMs, resolution: `${this.post.width}x${this.post.height}` };
  }
}
