import * as THREE from 'three';
import { MaterialLibrary } from '../materials/MaterialLibrary';
import { PostFX } from '../atmosphere/PostFX';
import { MoonShadow, PlanarReflection } from '../atmosphere/ShadowAndReflection';
import { LightRig } from '../atmosphere/LightRig';
import { U } from '../atmosphere/SceneUniforms';
import { CameraRig } from './CameraRig';
import { CameraGraph, CAM_IDS, lerpState, type CamId } from './CameraGraph';
import { MerchantDistrictGenerator, DEFAULT_CONFIG, type DistrictConfig, type DistrictBuild } from '../district/MerchantDistrictGenerator';
import type { ForgeState } from '../district/ForgeGenerator';
import { CANONICAL_SEED } from '../core/rng';
import { PerfMonitor, type PerfSnapshot } from '../debug/PerfMonitor';
import { SpriteAtlas } from '../characters/SpriteAtlas';
import { SpriteRenderer } from '../characters/SpriteRenderer';
import { ActorSystem } from '../characters/ActorSystem';
import { ParticleSystem } from '../atmosphere/Particles';
import { buildSky } from '../atmosphere/Sky';
import { WATER_Y, WALK } from '../architecture/StreetComposer';
import { bakeVisibility, LEVEL } from '../district/Visibility';
import { PLAYER, BLACKSMITH, MERCHANT_WOMAN, GUARD_A, GUARD_B, HOODED, PORTER, CAT, crowdVariants } from '../characters/SpriteGenerator';

export interface AppOptions { canvas: HTMLCanvasElement; params: URLSearchParams; onProgress: (label: string, f: number) => void }

export class App {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly rig = new CameraRig();
  readonly graph = new CameraGraph();
  readonly post: PostFX;
  readonly shadow = new MoonShadow(2048);
  readonly reflection = new PlanarReflection();
  readonly lights = new LightRig();
  readonly perf = new PerfMonitor();
  moonGain = 1;
  ambientLevel = 1;
  ambientBase = new THREE.Color(0.07, 0.10, 0.16);
  private moonBase = new THREE.Color(0.27, 0.37, 0.58);
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
  /** current visible set (framing ids joined) and the static meshes' draw level */
  visibleSet = 'A';
  drawLevel = -1;
  /** draw every kept class regardless of framing (debug / manual cameras) */
  visibilityFrozen = false;
  /** framings whose visible set is forced (the ?blend= review pose) */
  private debugActive: CamId[] | null = null;
  /** low moon just right of the vanishing point: backlights the frontage, lays a glade on the canal */
  moonDir = new THREE.Vector3(0.965, 0.1736, 0.197).normalize();
  onRegenerate: Array<() => void> = [];
  private lastT = performance.now();

  constructor(private opts: AppOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false });
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;
    this.perf.attach(this.renderer.getContext() as WebGL2RenderingContext);
    if (opts.params.has('gpuprof')) this.perf.gpu.enabled = true;
    this.post = new PostFX(this.renderer);
    this.rig.camera.layers.enable(2);
    this.scene.add(this.rig.camera);
    this.scene.add(buildSky());
    this.reflection.clipY = WATER_Y;
    U.uMoonCol.value.copy(this.moonBase);
    const q = opts.params;
    if (q.has('seed')) this.config.seed = parseInt(q.get('seed')!, 10) >>> 0;
    if (q.get('forge') === 'sabotaged') this.config.forgeState = 'SABOTAGED_FORGE';
    if (q.has('freeze')) this.frozen = parseFloat(q.get('freeze')!);
    if (q.has('cam')) {
      const [d, p, y, s, tx, ty, tz, fov] = q.get('cam')!.split(',').map(Number);
      const r = this.rig;
      if (!isNaN(d)) r.dist = d; if (!isNaN(p)) r.pitch = THREE.MathUtils.degToRad(p); if (!isNaN(y)) r.yaw = THREE.MathUtils.degToRad(y); if (!isNaN(s)) r.shiftY = s;
      if (!isNaN(tx)) r.pivot.set(tx, ty, tz);
      if (!isNaN(fov)) r.fov = fov;
      r.manual = true;
    }
    // ?camera=A|B|C pins one authored framing (review shots); otherwise the graph follows the zones
    const forced = q.get('camera')?.toUpperCase();
    if (forced && (CAM_IDS as string[]).includes(forced)) this.graph.forced = forced as CamId;
    // ?camB=yaw,pitch,dist,fov,shift,hx,hy,hz overrides a framing while tuning (blank fields keep the authored value)
    for (const id of CAM_IDS) {
      const v = q.get(`cam${id}`)?.split(',').map((s) => (s.trim() === '' ? NaN : Number(s)));
      if (!v) continue;
      const an = this.graph.anchors[id], keys = ['yaw', 'pitch', 'dist', 'fov', 'shift'] as const;
      keys.forEach((k, i) => { if (!isNaN(v[i])) an[k] = v[i]; });
      for (let i = 0; i < 3; i++) if (!isNaN(v[5 + i])) an.home[i] = v[5 + i];
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
    // ?player=x,z places the player (and settles the camera in that zone's framing) for authored review shots
    const pp = this.opts.params.get('player')?.split(',').map(Number);
    const placed = !!pp && pp.length === 2 && pp.every((v) => !isNaN(v));
    if (placed) this.actors.player.pos.set(pp![0], 0, pp![1]);
    // arrival: a fresh session opens on the establishing shot and settles into the zone framing on first move
    this.graph.arrival = !placed && !this.graph.forced && this.opts.params.get('intro') !== '0';
    // ?static=1: no characters / particles (wandering NPCs and smoke are not deterministic): for pixel diffs
    if (this.opts.params.get('static') === '1') this.sprites.group.visible = this.particles.group.visible = false;
    this.graph.snap(this.actors.player.pos, this.rig);
    // ?blend=A,B,0.5 freezes the camera mid-transition (review shots / popping checks): the pose of the blend at
    // that weight for the placed player, drawn with the blend's visible set (union of both framings)
    const bl = this.opts.params.get('blend')?.split(',');
    if (bl && bl.length === 3 && (CAM_IDS as string[]).includes(bl[0]) && (CAM_IDS as string[]).includes(bl[1])) {
      const [a, b] = [bl[0] as CamId, bl[1] as CamId], p = this.actors.player.pos, t = THREE.MathUtils.clamp(Number(bl[2]), 0, 1);
      const w = t * t * t * (t * (t * 6 - 15) + 10);
      const st = lerpState(this.graph.evalAnchor(a, p.x, p.z), this.graph.evalAnchor(b, p.x, p.z), w);
      this.rig.manual = true; this.rig.setPose(st);
      this.graph.state = st; this.debugActive = [a, b];
    }
    this.actors.controlYaw = this.actors.camYaw = this.rig.yaw;
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
    // fill is the canal-side bounce: kept low so frontages read as calm dark masses carrying warm windows
    U.uFillCol.value.copy(b).multiplyScalar(k * 0.5);
  }

  snapshot(): PerfSnapshot {
    const r = this.renderer, p = this.perf;
    const sMem = this.shadow.size * this.shadow.size * 8;
    const bytes = this.lib.textureBytes() + (this.atlas ? this.atlas.width * this.atlas.height * 8 : 0) + this.post.textureBytes() + this.reflection.textureBytes() + sMem + 1536 * 768 * 5.3;
    const gpu = p.gpu.enabled ? { ...p.gpu.ms } : undefined;
    return {
      fps: p.fps, frameMs: p.frameMs, cpuMs: p.cpuMs, drawCalls: p.drawCalls, triangles: p.triangles, textures: r.info.memory.textures, geometries: r.info.memory.geometries, textureMB: bytes / 1048576,
      lights: this.lights.sources.length, actors: this.actors?.actors.length ?? 0, generatorMs: this.lastGenMs,
      district: this.district ? { triangles: this.district.stats.triangles, instances: this.district.stats.instances, buildings: this.district.stats.buildings, windows: this.district.stats.windows } : { triangles: 0, instances: 0, buildings: 0, windows: 0 },
      resolution: `${this.post.width}x${this.post.height} MSAA${this.post.params.msaa}`,
      gpu, gpuMs: gpu ? p.gpu.total() : undefined,
      visibility: this.district ? {
        set: this.visibleSet, level: this.drawLevel, parts: this.district.visibility.parts, tier3: this.district.visibility.hidden,
        notC: this.district.visibility.notC, onlyA: this.district.visibility.onlyA, trisKept: this.district.visibility.trisKept, trisTier3: this.district.visibility.trisHidden,
        bakeMs: Math.round(this.district.visibility.bakeMs), poses: this.district.visibility.poses, lightsOnScreen: this.lights.active, lightsCulled: this.lights.culled,
      } : undefined,
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
    // camera graph -> visible sets: the district is baked against every authored pose (and blend) before its
    // meshes are built, so only what those views can show is kept (?vis=0 keeps everything, for A/B checks)
    const bake = this.opts.params.get('vis') === '0' ? undefined
      : (scene: THREE.Scene, n: number) => bakeVisibility(this.renderer, scene, n, this.graph.samplePoses(WALK), this.rig.aspectRatio, WATER_Y);
    this.district = this.generator.generate(this.config, bake);
    this.scene.add(this.district.group);
    this.actors?.populate(this.district, this.config.npcDensity, this.config.seed);
    this.particles?.clear(); this.particles?.setEmitters(this.district.emitters);
    this.syncLights();
    this.lastGenMs = performance.now() - t0;
    this.rig.apply();
    this.updateShadowAndLights(0);
    // the static moon shadow sees every caster (all draw levels + the Tier 3 casters), which are then released
    this.district.setLevel(2);
    this.shadow.update(this.renderer, this.scene, new THREE.Vector3(6, 0, 0), this.moonDir, 46, 32);
    this.district.releaseShadowOnly();
    this.drawLevel = -1;
    this.onRegenerate.forEach((f) => f());
  }

  /** visible set of the current framing(s): C draws [always], B adds [notC], A adds [onlyA]; a blend draws the
   *  union of both ends (the AB / BC buffers are baked into those classes) */
  private applyVisibleSet(): void {
    if (!this.district) return;
    const ids = this.debugActive ?? (this.rig.manual || this.visibilityFrozen ? (['A'] as CamId[]) : this.graph.activeIds());
    const level = Math.max(...ids.map((id) => LEVEL[id]));
    this.visibleSet = ids.join('+');
    if (level !== this.drawLevel) { this.drawLevel = level; this.district.setLevel(level as 0 | 1 | 2); }
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
    U.uMoonDir.value.copy(this.moonDir);
    if (this.actors) {
      const a = this.actors;
      a.camYaw = this.rig.yaw;
      // movement keys stay mapped through the yaw they were pressed under; re-sync only when input is released
      if (!a.moveInput) a.controlYaw = this.rig.yaw;
      else if (this.graph.arrival) this.graph.arrival = false;
      a.update(dt, this.simTime);
      this.graph.update(a.player.pos, dt, this.rig);
      this.applyVisibleSet();
      this.sprites.charScale = this.graph.state.charScale;
      // autofocus on the player's view depth (the DOF compares view z, not euclidean distance)
      if (this.post.autoFocus) {
        const p = a.player.pos, v = new THREE.Vector3(p.x, p.y + 0.9, p.z).applyMatrix4(this.rig.camera.matrixWorldInverse);
        this.post.params.dofFocus = THREE.MathUtils.clamp(-v.z, 10, 60);
      }
    }
    this.lights.update(this.time, dt, this.rig.camera);
    if (this.actors) {
      this.sprites.update(this.actors.actors, this.lights, this.rig.camera, this.moonDir, this.actors.interactTarget, this.actors.player);
      this.particles.update(dt, this.simTime, this.rig.camera, this.post.height, this.lights, (this.simTime * 5.5 - 2) / 4);
    }
  }

  render(): void {
    const r = this.renderer;
    this.perf.beginFrame();
    r.info.reset();
    const gpu = this.perf.gpu;
    gpu.begin('reflection');
    this.reflection.update(r, this.scene, this.rig.camera);
    this.post.render(this.scene, this.rig.camera, this.time, gpu);
    gpu.end(); gpu.poll();
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
