import * as THREE from 'three';
import { MaterialLibrary } from '../materials/MaterialLibrary';
import { PostFX } from '../atmosphere/PostFX';
import { MoonShadow, PlanarReflection } from '../atmosphere/ShadowAndReflection';
import { LightRig } from '../atmosphere/LightRig';
import { U } from '../atmosphere/SceneUniforms';
import { CameraRig } from './CameraRig';
import { MerchantDistrictGenerator, DEFAULT_CONFIG, type DistrictConfig, type DistrictBuild } from '../district/MerchantDistrictGenerator';
import type { ForgeState } from '../district/ForgeGenerator';
import { CANONICAL_SEED } from '../core/rng';
import { PerfMonitor, type PerfSnapshot } from '../debug/PerfMonitor';
import { SpriteAtlas } from '../characters/SpriteAtlas';
import { SpriteRenderer } from '../characters/SpriteRenderer';
import { ActorSystem } from '../characters/ActorSystem';
import { ParticleSystem } from '../atmosphere/Particles';
import { PLAYER, BLACKSMITH, MERCHANT_WOMAN, GUARD_A, GUARD_B, HOODED, PORTER, CAT, crowdVariants } from '../characters/SpriteGenerator';

export interface AppOptions { canvas: HTMLCanvasElement; params: URLSearchParams; onProgress: (label: string, f: number) => void }

export class App {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly rig = new CameraRig();
  readonly post: PostFX;
  readonly shadow = new MoonShadow(2048);
  readonly reflection = new PlanarReflection();
  readonly lights = new LightRig();
  readonly perf = new PerfMonitor();
  moonGain = 1;
  ambientLevel = 1;
  ambientBase = new THREE.Color(0.07, 0.10, 0.16);
  private moonBase = new THREE.Color(0.30, 0.38, 0.55);
  lib!: MaterialLibrary;
  atlas!: SpriteAtlas;
  sprites!: SpriteRenderer;
  actors!: ActorSystem;
  particles!: ParticleSystem;
  generator!: MerchantDistrictGenerator;
  district: DistrictBuild | null = null;
  config: DistrictConfig = { ...DEFAULT_CONFIG };
  time = 0;
  simTime = 0;
  frozen: number | null = null;
  frameCount = 0;
  ready = false;
  lastGenMs = 0;
  moonDir = new THREE.Vector3(0.38, 0.8, -0.46).normalize();
  onRegenerate: Array<() => void> = [];
  private lastT = performance.now();

  constructor(private opts: AppOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false });
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;
    this.post = new PostFX(this.renderer);
    this.rig.camera.layers.enable(2);
    this.scene.add(this.rig.camera);
    const q = opts.params;
    if (q.has('seed')) this.config.seed = parseInt(q.get('seed')!, 10) >>> 0;
    if (q.get('forge') === 'sabotaged') this.config.forgeState = 'SABOTAGED_FORGE';
    if (q.has('freeze')) this.frozen = parseFloat(q.get('freeze')!);
    if (q.has('cam')) {
      const [d, p, y, s, tx, ty, tz] = q.get('cam')!.split(',').map(Number);
      const r = this.rig;
      if (!isNaN(d)) r.dist = d; if (!isNaN(p)) r.pitch = THREE.MathUtils.degToRad(p); if (!isNaN(y)) r.yaw = THREE.MathUtils.degToRad(y); if (!isNaN(s)) r.shiftY = s;
      if (!isNaN(tx)) r.home.set(tx, ty, tz);
      r.followStrength = 0;
    }
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'f' && this.ready && !(e.target instanceof HTMLInputElement)) this.setForgeState(this.config.forgeState === 'NORMAL_FORGE' ? 'SABOTAGED_FORGE' : 'NORMAL_FORGE'); });
  }

  async init(): Promise<void> {
    this.lib = await MaterialLibrary.build(this.renderer, this.opts.onProgress);
    this.generator = new MerchantDistrictGenerator(this.lib);
    this.opts.onProgress('sprites', 0.97);
    await new Promise((r) => setTimeout(r, 0));
    this.atlas = SpriteAtlas.build([PLAYER, BLACKSMITH, MERCHANT_WOMAN, GUARD_A, GUARD_B, HOODED, PORTER, CAT, ...crowdVariants(this.config.seed, 5)]);
    this.sprites = new SpriteRenderer(this.atlas, 40);
    this.actors = new ActorSystem(this.atlas);
    this.actors.onInteractForge = () => this.setForgeState(this.config.forgeState === 'NORMAL_FORGE' ? 'SABOTAGED_FORGE' : 'NORMAL_FORGE');
    this.scene.add(this.sprites.group);
    this.particles = new ParticleSystem(this.lib);
    this.scene.add(this.particles.group);
    this.resize();
    this.regenerate();
    this.ready = true;
  }

  resize(): void {
    const w = window.innerWidth, h = window.innerHeight;
    const pr = Math.min(window.devicePixelRatio || 1, 2);
    this.post.setSize(w, h, pr);
    this.reflection.setSize(w * pr, h * pr);
    this.rig.setAspect(w / h);
    U.uResolution.value.set(this.post.width, this.post.height);
  }

  setMoonGain(v: number): void { this.moonGain = v; U.uMoonCol.value.copy(this.moonBase).multiplyScalar(v); }
  setAmbientLevel(v: number): void { this.ambientLevel = v; this.applyAmbient(); }
  setAmbientColor(c: THREE.Color): void {
    const m = Math.max(c.r, c.g, c.b, 1e-3);
    this.ambientBase.setRGB(c.r / m * 0.16, c.g / m * 0.16, c.b / m * 0.16);
    this.applyAmbient();
  }
  private applyAmbient(): void {
    const k = this.ambientLevel, b = this.ambientBase;
    U.uSkyAmb.value.copy(b).multiplyScalar(k);
    U.uGroundAmb.value.copy(b).multiplyScalar(k * 0.43);
    U.uFillCol.value.copy(b).multiplyScalar(k * 0.64);
  }

  snapshot(): PerfSnapshot {
    const r = this.renderer, p = this.perf;
    const sMem = this.shadow.size * this.shadow.size * 8;
    const bytes = this.lib.textureBytes() + (this.atlas ? this.atlas.width * this.atlas.height * 8 : 0) + this.post.textureBytes() + this.reflection.textureBytes() + sMem + 1536 * 768 * 5.3;
    return {
      fps: p.fps, frameMs: p.frameMs, cpuMs: p.cpuMs, drawCalls: p.drawCalls, triangles: p.triangles, textures: r.info.memory.textures, geometries: r.info.memory.geometries, textureMB: bytes / 1048576,
      lights: this.lights.sources.length, actors: this.actors?.actors.length ?? 0, generatorMs: this.lastGenMs,
      district: this.district ? { triangles: this.district.stats.triangles, instances: this.district.stats.instances, buildings: this.district.stats.buildings, windows: this.district.stats.windows } : { triangles: 0, instances: 0, buildings: 0, windows: 0 },
      resolution: `${this.post.width}x${this.post.height} MSAA${this.post.params.msaa}`,
    };
  }

  setForgeState(state: ForgeState): void {
    this.config.forgeState = state;
    if (!this.district) return;
    this.district.rebuildForge(state);
    this.syncLights();
    this.actors.populate(this.district, this.config.npcDensity, this.config.seed);
    this.particles.setEmitters(this.district.emitters);
    this.onRegenerate.forEach((f) => f());
  }

  private syncLights(): void {
    // keep dynamic light state across forge swaps: only replace the forge group
    this.lights.clearGroup('static'); this.lights.clearGroup('forge');
    for (const l of this.district!.lights) {
      const s = this.lights.add(l, l.group, Math.abs(Math.sin(l.pos[0] * 12.9 + l.pos[2] * 78.2)));
      s.scale = 1;
    }
  }

  regenerate(cfg?: Partial<DistrictConfig>): void {
    if (cfg) Object.assign(this.config, cfg);
    if (this.district) {
      this.scene.remove(this.district.group);
      this.district.dispose();
    }
    const t0 = performance.now();
    this.district = this.generator.generate(this.config);
    this.scene.add(this.district.group);
    this.actors?.populate(this.district, this.config.npcDensity, this.config.seed);
    this.particles?.clear(); this.particles?.setEmitters(this.district.emitters);
    this.syncLights();
    this.lastGenMs = performance.now() - t0;
    this.rig.apply();
    this.updateShadowAndLights(0);
    this.shadow.update(this.renderer, this.scene, new THREE.Vector3(2, 0, -4), this.moonDir, 42, 30);
    this.onRegenerate.forEach((f) => f());
  }

  randomSeed(): number { const s = Math.floor(Math.random() * 99999) + 1; this.regenerate({ seed: s }); return s; }
  resetSeed(): void { this.regenerate({ seed: CANONICAL_SEED }); }

  private updateShadowAndLights(dt: number): void {
    this.lights.update(this.time, dt);
  }

  update(dt: number): void {
    this.simTime += dt;
    this.time = this.frozen ?? this.time + dt;
    U.uTime.value = this.time;
    this.lights.update(this.time, dt);
    U.uMoonDir.value.copy(this.moonDir);
    if (this.actors) {
      this.actors.camYaw = this.rig.yaw;
      this.actors.update(dt, this.simTime);
      this.rig.follow(this.actors.player.pos, dt);
      this.sprites.update(this.actors.actors, this.lights, this.rig.camera, this.moonDir);
      this.particles.update(dt, this.simTime, this.rig.camera, this.post.height, this.lights, (this.simTime * 5.5 - 2) / 4);
    }
  }

  render(): void {
    const r = this.renderer;
    this.perf.beginFrame();
    r.info.reset();
    this.reflection.update(r, this.scene, this.rig.camera);
    this.post.render(this.scene, this.rig.camera, this.time);
    this.perf.endFrame(r);
    this.frameCount++;
  }

  start(): void {
    const loop = () => {
      const now = performance.now();
      const dt = Math.min(0.05, (now - this.lastT) / 1000);
      this.lastT = now;
      this.update(dt);
      this.render();
      requestAnimationFrame(loop);
    };
    loop();
  }
}
