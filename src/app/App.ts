import * as THREE from 'three';
import { MaterialLibrary } from '../materials/MaterialLibrary';
import { defaultPainters } from '../materials/PainterPool';
import { FrameCap, parseFrameCap, frameCapLabel, type FrameCapMode } from './FrameCap';
import { PostFX } from '../atmosphere/PostFX';
import { MoonShadow, PlanarReflection } from '../atmosphere/ShadowAndReflection';
import { LightRig } from '../atmosphere/LightRig';
import { U } from '../atmosphere/SceneUniforms';
import { CameraRig, REF_ASPECT } from './CameraRig';
import { CameraGraph, CAM_IDS, type CamId, type CamState, type VisSet } from './CameraGraph';
import { MerchantDistrictGenerator, DEFAULT_CONFIG, type DistrictConfig, type DistrictBuild } from '../district/MerchantDistrictGenerator';
import type { ForgeState } from '../district/ForgeGenerator';
import { CANONICAL_SEED } from '../core/rng';
import { PerfMonitor, type PerfSnapshot } from '../debug/PerfMonitor';
import { SpriteAtlas } from '../characters/SpriteAtlas';
import { SpriteRenderer } from '../characters/SpriteRenderer';
import { ActorSystem } from '../characters/ActorSystem';
import type { BakedSheet, AuthoredSpawn } from '../characters/BakedSprites';
import { loadProductionCast } from '../characters/BakedCast';
import { ParticleSystem } from '../atmosphere/Particles';
import { Weather, parseWeather, type WeatherParams } from '../atmosphere/Weather';
import { DAY, litByDay, parseTime } from '../atmosphere/DayState';
import { buildSky } from '../atmosphere/Sky';
import { WATER_Y, WALK } from '../architecture/StreetComposer';
import { type BakeOptions, type BakePose, type BehindPass } from '../district/Visibility';
import { bakeVisibilityCached, type BakeCacheMode } from '../district/BakeCache';
import { OcclusionReveal, OCC_STYLES, playerReveal, revealSize, type OccStyle } from './Occlusion';
import { PLAYER, BLACKSMITH, MERCHANT_WOMAN, GUARD_A, GUARD_B, HOODED, PORTER, CAT, crowdVariants } from '../characters/SpriteGenerator';

export interface AppOptions {
  canvas: HTMLCanvasElement; params: URLSearchParams; onProgress: (label: string, f: number) => void;
  /** EXPERIMENTAL baked sheets + authored spawns; only ever set by the DEV loader (`?baked=`, src/lab/bakedLoader.ts) */
  baked?: Promise<{ sheets: BakedSheet[]; spawns: AuthoredSpawn[] }>;
}

/** The frame cap when `?fps=` is absent: `a60`, evenly paced near 60 fps (55 at 165 Hz, 72 at 144, 60 at 60 / 120) with the adaptive
 *  step (one more vsync per frame while frames keep missing their slot), chosen by the operator on 2026-10-18 (journal pass 6h; `e60`, the
 *  same pace without the step, from pass 6c); `?fps=e60` keeps the fixed step, `?fps=off` restores the uncapped loop. */
const DEFAULT_FRAME_CAP: FrameCapMode = { kind: 'adaptive', fps: 60 };

export class App {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly rig = new CameraRig();
  readonly graph = new CameraGraph();
  /** player occlusion reveal (?occ=0 disables, ?occstyle=soft|dither|hybrid, ?occforce=all|0,1, ?occdebug=1) */
  readonly occlusion = new OcclusionReveal();
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
  /** ?rain / ?snow / ?storm / ?wind (journal Passe W1); null = no weather parameter: nothing created, the game as before */
  weather: Weather | null = null;
  /** the smoke's drift as authored (a weather's wind scales it) */
  private readonly baseWind = new THREE.Vector3();
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
  /** the day state (?time=day, DayState.ts, journal Passe Y1): the sun in the moon's place, the day's sky, haze, lights and grade; false = the
   *  night, untouched */
  readonly day: boolean;
  /** by day, the forge's own copy of the glow material (its coals stay lit while the window glass dims); null at night */
  private forgeGlow: THREE.ShaderMaterial | null = null;
  onRegenerate: Array<() => void> = [];
  /** why the last visibility bake was rejected (culling is then off: every part kept); null when it succeeded or was not asked */
  visibilityError: string | null = null;
  private rebakeTimer = 0;
  private lastT = performance.now();
  /** frame-rate cap (journal pass 6, P4 and 6h): `?fps=off|<n>|v<k>|e<n>|a<n>`, otherwise DEFAULT_FRAME_CAP */
  readonly frameCap = new FrameCap();
  /** internal resolution cap (journal pass 6, P6): `?res=<lines>p[:px]` = at most lines x lines x 16 / 9 rendered pixels (1080p: 1920 x 1080),
   *  scaled up by the browser (`:px` = nearest, `image-rendering: pixelated`); `?res=native` or absent = none (the default, kept by the operator
   *  on 2026-10-18, journal pass 6e) */
  resCap: { pixels: number; filter: 'smooth' | 'pixelated' } | null = null;

  constructor(private opts: AppOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false });
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;
    this.perf.attach(this.renderer.getContext() as WebGL2RenderingContext);
    if (opts.params.has('gpuprof')) this.perf.gpu.enabled = true;
    this.frameCap.mode = parseFrameCap(opts.params.get('fps')) ?? DEFAULT_FRAME_CAP;
    // DEV only (journal pass 6k): a wrong boot reading on demand, and the in-session vsync check off, to prove the check corrects it
    if (import.meta.env.DEV) {
      const fv = Number(opts.params.get('vsyncprobe'));
      if (fv > 0) this.frameCap.forcedVsync = fv;
      if (opts.params.get('vsyncwatch') === '0') this.frameCap.watch = false;
    }
    const rm = opts.params.get('res')?.match(/^(\d{3,4})p(?::(px|pixelated|smooth))?$/);
    if (rm) this.resCap = { pixels: Math.round((+rm[1] * +rm[1] * 16) / 9), filter: rm[2] === 'px' || rm[2] === 'pixelated' ? 'pixelated' : 'smooth' };
    this.post = new PostFX(this.renderer);
    // ?msaa=0|2|4|8: samples of the scene target (default 4, kept by the operator on 2026-10-18 after the 4x / 2x captures, journal pass 6f)
    const ms = Number(opts.params.get('msaa'));
    if (opts.params.has('msaa') && [0, 2, 4, 8].includes(ms)) this.post.params.msaa = ms;
    // ?refl=<scale>: the planar reflection's size against the internal resolution, manual (default 0.5, kept by the operator on 2026-10-18
    // over 1/4 on captures; journal pass 6g)
    const rf = Number(opts.params.get('refl'));
    if (rf > 0 && rf <= 1) this.reflection.scale = rf;
    this.rig.camera.layers.enable(2);
    this.scene.add(this.rig.camera);
    // ?time=day (journal Passe Y1): read before the sky, which is built as the day's variant
    this.day = parseTime(opts.params) === 'midday';
    this.scene.add(buildSky(this.day));
    this.reflection.clipY = WATER_Y;
    U.uMoonCol.value.copy(this.moonBase);
    const q = opts.params;
    if (this.day) this.applyDay();
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
    if (q.get('occ') === '0') this.occlusion.enabled = false;
    const os = q.get('occstyle') as OccStyle | null;
    if (os && OCC_STYLES.includes(os)) this.occlusion.style = os;
    const of = q.get('occforce');
    if (of) this.occlusion.force = of === 'all' || of === '1' ? 'all' : of.split(',').map(Number).filter((n) => !isNaN(n));
    if (q.get('occdebug') === '1') this.occlusion.debug(true);
    // ?camera=A|B|C pins one authored framing (review shots); otherwise the graph follows the zones
    const forced = q.get('camera')?.toUpperCase();
    if (forced && (CAM_IDS as string[]).includes(forced)) this.graph.forced = forced as CamId;
    // every framing blend is anchored by default (the player's screen position glides between its two framings; operator decision K1,
    // journal Passe K4); ?camblend=interpolated brings back the former interpolated A <-> B / B <-> C blends, for comparison
    if (q.get('camblend') === 'interpolated') this.graph.anchorAll = false;
    // D's follow never overtakes the player on screen, by default (journal Passes K5 / K7, the operator's decision RK2); ?camfollow=off: the
    // former follow, for comparison
    if (q.get('camfollow') === 'off') this.graph.screenFollow = false;
    // ?camB=yaw,pitch,dist,fov,shift,hx,hy,hz[,gainX,gainZ,refX,refZ,charScale] overrides a framing while tuning (blank fields
    // keep the authored value)
    for (const id of CAM_IDS) {
      const v = q.get(`cam${id}`)?.split(',').map((s) => (s.trim() === '' ? NaN : Number(s)));
      if (!v) continue;
      const an = this.graph.anchors[id], keys = ['yaw', 'pitch', 'dist', 'fov', 'shift'] as const;
      keys.forEach((k, i) => { if (!isNaN(v[i])) an[k] = v[i]; });
      for (let i = 0; i < 3; i++) if (!isNaN(v[5 + i])) an.home[i] = v[5 + i];
      for (let i = 0; i < 2; i++) { if (!isNaN(v[8 + i])) an.gain[i] = v[8 + i]; if (!isNaN(v[10 + i])) an.ref[i] = v[10 + i]; }
      if (!isNaN(v[12])) an.charScale = v[12];
    }
    window.addEventListener('resize', () => this.resize());
    window.addEventListener('keydown', (e) => { if (e.key.toLowerCase() === 'f' && this.ready && !(e.target instanceof HTMLInputElement)) this.setForgeState(this.config.forgeState === 'NORMAL_FORGE' ? 'SABOTAGED_FORGE' : 'NORMAL_FORGE'); });
  }

  async init(): Promise<void> {
    // texture painters in Web Workers (journal pass 6, P3); ?painters=main paints on the main thread, ?painters=<n> sets the pool size
    const pq = this.opts.params.get('painters');
    const painters = pq === 'main' ? 0 : pq !== null && /^\d+$/.test(pq) ? +pq : defaultPainters();
    // the main thread idles while the workers paint: the frame cap measures the display's vsync interval meanwhile
    this.frameCap.probe();
    this.lib = await MaterialLibrary.build(this.renderer, this.opts.onProgress, painters);
    if (this.day) {
      // the window and lantern glass dims by day (J4); the forge keeps the night's glow on its own copy of the material
      const g = this.lib.slot.glow;
      this.forgeGlow = new THREE.ShaderMaterial({ uniforms: { ...g.uniforms, uEmissive: { value: g.uniforms.uEmissive.value } }, vertexShader: g.vertexShader, fragmentShader: g.fragmentShader, defines: { ...g.defines }, side: g.side });
      this.forgeGlow.name = 'glow:forge-day';
      g.uniforms.uEmissive.value = DAY.glowEmissive;
      this.lib.slot.shop.uniforms.uEmissive.value = DAY.shopEmissive;
      // the saturated blue roofs of the midday track (journal Passe Y2): the roof material's albedo multiplier, white at night
      this.lib.slot.roof.uniforms.uBase.value.copy(DAY.roofTint);
    }
    this.frameCap.endProbe();
    this.generator = new MerchantDistrictGenerator(this.lib);
    this.opts.onProgress('sprites', 0.97);
    await new Promise((r) => setTimeout(r, 0));
    // production cast: approved baked sheets standing in for generated archetypes (src/characters/BakedCast.ts); ?cast=generated keeps the
    // generated cast; DEV only, ?cast=candidate also loads the candidates awaiting the operator's approval
    const castMode = this.opts.params.get('cast');
    // NPC variants (journal Passe V1): applied only from an approved variants file; DEV only, ?variants=candidate shows an unapproved one
    const variants = import.meta.env.DEV && this.opts.params.get('variants') === 'candidate' ? 'candidate' : 'approved';
    const cast = castMode === 'generated' ? null : await loadProductionCast(import.meta.env.DEV && castMode === 'candidate', variants);
    const baked = this.opts.baked ? await this.opts.baked : null;
    const devSheets = (baked?.sheets ?? []).filter((s) => !cast?.sheets.some((p) => p.id === s.id));
    this.atlas = SpriteAtlas.build([PLAYER, BLACKSMITH, MERCHANT_WOMAN, GUARD_A, GUARD_B, HOODED, PORTER, CAT, ...crowdVariants(this.config.seed, 5)], [...(cast?.sheets ?? []), ...devSheets], this.renderer.capabilities.maxTextureSize);
    this.sprites = new SpriteRenderer(this.atlas, 40);
    this.actors = new ActorSystem(this.atlas, this.rig.camera);
    if (cast) this.actors.cast = cast.cast;
    // ?crowd=<n>: n ambient walkers, the five townsfolk in turn (journal Passe C1); absent: round(5 x density), the default (Passe C2)
    const crowd = Number(this.opts.params.get('crowd'));
    if (this.opts.params.has('crowd') && Number.isInteger(crowd) && crowd >= 0 && crowd <= 12) this.actors.crowdCount = crowd;
    // the five-view rule for the sheets that have three-quarter facings, by default (journal Passe V5; the operator's decision of 2026-10-19,
    // « Par défaut avec le héros », Passes D3 / H10); ?views=3: the three-view rule for every sprite, for comparison
    if (this.opts.params.get('views') === '3') this.actors.views5 = false;
    if (baked) this.actors.authored = baked.spawns;
    this.actors.onInteractForge = () => this.setForgeState(this.config.forgeState === 'NORMAL_FORGE' ? 'SABOTAGED_FORGE' : 'NORMAL_FORGE');
    this.scene.add(this.sprites.group);
    this.particles = new ParticleSystem(this.lib);
    this.scene.add(this.particles.group);
    this.baseWind.copy(this.particles.wind);
    this.setWeather(parseWeather(this.opts.params));
    this.resize();
    // the boot links the programs in parallel first (prepareFirstFrame), then warms the occlusion variants
    this.regenerate(undefined, { warm: false });
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
      const st = this.graph.blendPose(this.graph.evalAnchor(a, p.x, p.z), this.graph.evalAnchor(b, p.x, p.z), w, new THREE.Vector3(p.x, p.y + 1, p.z), this.rig.poseAspect, a === 'D' || b === 'D' || this.graph.anchorAll);
      this.rig.manual = true; this.rig.setPose(st);
      this.graph.state = st; this.debugActive = [a, b];
    }
    this.actors.controlYaw = this.actors.camYaw = this.rig.yaw;
    await this.prepareFirstFrame();
    this.ready = true;
  }

  /** Boot only (journal pass 6, P2), under the loading screen: every program of the scene is linked in parallel (compileAsync, which
   *  uses KHR_parallel_shader_compile) with the occlusion variants bound and the scene target bound (a program's key depends on the bound
   *  target: the linear half-float scene target vs the sRGB canvas, otherwise the programs compiled are never used); then the variants'
   *  first draw (warmOcclusionVariants: ANGLE / D3D11 finishes a program only there) and one full frame (mirror, scene, post), so the
   *  loading screen never fades onto a frame that still compiles. Nothing drawn here is presented: the loop's first frame redraws all. */
  private async prepareFirstFrame(): Promise<void> {
    const r = this.renderer, swap = this.occlusion.enabled ? this.occlusion.meshes : [];
    for (const m of swap) m.mesh.material = m.variant;
    const prev = r.getRenderTarget();
    r.setRenderTarget(this.post.sceneRT);
    const linked = r.compileAsync(this.scene, this.rig.camera);
    r.setRenderTarget(prev);
    for (const m of swap) m.mesh.material = m.base;
    await linked;
    this.warmOcclusionVariants();
    this.reflection.update(r, this.scene, this.rig.camera);
    this.post.render(this.scene, this.rig.camera, this.time);
  }

  resize(): void {
    const w = window.innerWidth, h = window.innerHeight;
    // internal resolution cap (journal pass 6, P6): above the pixel budget the scene and its reflection render smaller and the browser
    // scales the canvas up (smoothed, or nearest with `pixelated`); at or under the budget nothing changes
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cap = this.resCap, s = cap ? Math.min(1, Math.sqrt(cap.pixels / (w * dpr * h * dpr))) : 1;
    const pr = dpr * s;
    this.opts.canvas.style.imageRendering = cap?.filter === 'pixelated' && s < 1 ? 'pixelated' : '';
    this.post.setSize(w, h, pr);
    this.reflection.setSize(w * pr, h * pr);
    this.rig.setAspect(w / h);
    U.uResolution.value.set(this.post.width, this.post.height);
    // a window wider than the frame the district was baked for is shown as a vertical crop of that frame (CameraRig.applyFrame: no
    // unbaked part on screen); once the resize has settled the district is rebuilt for the new frame, actors kept where they are
    if (this.ready && w / h > this.rig.frame) {
      clearTimeout(this.rebakeTimer);
      this.rebakeTimer = window.setTimeout(() => { if (window.innerWidth / window.innerHeight > this.rig.frame) this.regenerate(undefined, { keepActors: true }); }, 400);
    }
  }

  /** replaces the weather while playing (the DEV panel): the old one gives its uniforms back, null or a calm one (no rain, snow, storm,
   *  wind 1) leaves none */
  setWeather(p: WeatherParams | null): void {
    if (this.weather) { this.scene.remove(this.weather.group); this.weather.dispose(); this.weather = null; this.particles.wind.copy(this.baseWind); }
    if (!p || (p.rain <= 0 && p.snow <= 0 && p.storm <= 0 && p.wind === 1)) return;
    this.weather = new Weather(p);
    this.scene.add(this.weather.group);
    this.particles.wind.copy(this.baseWind).multiplyScalar(p.wind);
  }

  /** the day look (DayState.ts) over the night's values: in the constructor, before the first generation (the sun's shadow is rendered
   *  there) and before the weather, which then scales the day's haze and gives it back */
  private applyDay(): void {
    this.moonDir.copy(DAY.sunDir);
    this.moonBase.copy(DAY.sunCol);
    U.uMoonCol.value.copy(this.moonBase);
    this.ambientBase.copy(DAY.skyAmb);
    U.uSkyAmb.value.copy(DAY.skyAmb); U.uGroundAmb.value.copy(DAY.groundAmb); U.uFillCol.value.copy(DAY.fillCol);
    U.uFogColor.value.copy(DAY.fogColor); U.uSkyZenith.value.copy(DAY.skyZenith); U.uCityGlow.value.setRGB(0, 0, 0);
    U.uFogDensity.value = DAY.fogDensity; U.uMist.value = DAY.mist; U.uWet.value = DAY.wet;
    // the grade's colours copied, not shared: the DEV panel edits post.params in place
    Object.assign(this.post.params, DAY.post, { shadowTint: DAY.post.shadowTint!.clone(), highlightTint: DAY.post.highlightTint!.clone() });
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
      ...(this.weather ? { weather: { ...this.weather.p, flash: +this.weather.flashLevel.toFixed(3), drops: this.weather.drops() } } : {}),
      gpu, gpuMs: gpu ? p.gpu.total() : undefined,
      visibility: this.district ? {
        set: this.visibleSet, level: this.drawLevel, parts: this.district.visibility.parts, tier3: this.district.visibility.hidden,
        classes: this.district.visibility.levels, trisKept: this.district.visibility.trisKept, trisTier3: this.district.visibility.trisHidden,
        bakeMs: Math.round(this.district.visibility.bakeMs), bakeCache: this.district.visibility.bakeCache ?? 'none', bakeKeyMs: +this.district.visibility.bakeKeyMs.toFixed(1), poses: this.district.visibility.poses, lightsOnScreen: this.lights.active, lightsCulled: this.lights.culled,
        frame: this.rig.frame === Infinity ? 'any' : +this.rig.frame.toFixed(4), bakePages: this.district.visibility.bakePages, bakeTargetMB: +(this.district.visibility.bakeTargetBytes / 1048576).toFixed(1),
        ...(this.visibilityError ? { error: this.visibilityError } : {}),
      } : undefined,
      occlusion: {
        enabled: this.occlusion.enabled ? 1 : 0, style: this.occlusion.style, eligible: this.occlusion.stats.eligible, active: this.occlusion.stats.active, tests: this.occlusion.stats.tests,
        cpuMs: +this.occlusion.stats.cpuMs.toFixed(4), names: this.occlusion.activeNames().join(','), fades: this.occlusion.fades().map((f) => +f.toFixed(2)).join(','),
        centre: this.occlusion.stats.centre.join(','), radii: this.occlusion.stats.radii.map((v) => +v.toFixed(1)).join(','),
        behindParts: this.district?.visibility.behind?.parts ?? 0, behindTris: this.district?.visibility.behind?.tris ?? 0, behindPx: this.district?.visibility.behind?.px ?? 0,
      },
      frameCap: {
        mode: frameCapLabel(this.frameCap.mode), every: this.frameCap.every(), vsyncMs: +this.frameCap.vsync.toFixed(3), vsyncFrom: this.frameCap.vsyncSource, skipped: this.frameCap.skipped,
        vsyncChanges: this.frameCap.vsyncChanges, ...(this.frameCap.vsyncChanges ? { vsyncLog: this.frameCap.vsyncLog.map((x) => x.join(':')).join(',') } : {}),
        ...(this.frameCap.mode.kind === 'adaptive' ? { steps: this.frameCap.steps, trialsFailed: this.frameCap.trialsFailed, log: this.frameCap.log.map((x) => x.join(':')).join(',') } : {}),
      },
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
      // by day only the forge burns (J4): a light at 0 leaves the upload, the in-scatter, the halos and the sprite light shadows
      if (this.day && !litByDay(l)) s.scale = s.targetScale = 0;
    }
    const fg = this.forgeGlow;
    if (fg) this.district!.forgeGroup.traverse((o) => { const m = o as THREE.Mesh; if (m.isMesh && m.material === this.lib.slot.glow) m.material = fg; });
    // by day the far city compiles its day variant (its lamps and windows unlit); the night's material is untouched
    if (this.day) this.district!.group.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
      if (m && m.name === 'far' && !m.defines?.DAY) { m.defines = { ...m.defines, DAY: 1 }; m.needsUpdate = true; }
    });
  }

  /** `keepActors`: the same district rebuilt for another frame (resize re-bake): actors and particles carry on instead of re-spawning;
   *  `warm: false`: the occlusion variants are warmed later by the caller (the boot, see prepareFirstFrame) */
  regenerate(cfg?: Partial<DistrictConfig>, opts: { keepActors?: boolean; warm?: boolean } = {}): void {
    if (cfg) Object.assign(this.config, cfg);
    if (this.district) {
      this.scene.remove(this.district.group);
      this.district.dispose();
    }
    const t0 = performance.now();
    // camera graph -> visible sets: the district is baked against every authored pose (and blend) before its
    // meshes are built, so only what those views can show is kept (?vis=0 keeps everything, for A/B checks). The bake covers the
    // window's frame, at least 16:9 (a narrower window is a crop of the 16:9 frame, see CameraRig.applyFrame). A bake that fails
    // keeps every part and says so (console, stats, panel): a visibility failure must never remove buildings.
    const frame = Math.max(this.rig.aspectRatio, REF_ASPECT);
    let baked = false;
    this.visibilityError = null;
    const bake = this.opts.params.get('vis') === '0' ? undefined
      : (scene: THREE.Scene, n: number, behind?: Pick<BehindPass, 'scene' | 'uniforms'>) => {
        try {
          // through the bake cache (journal pass 6, P5): the same inputs on the same GPU read back the stored result; ?viscache=0 | verify
          const v = bakeVisibilityCached({
            renderer: this.renderer, scene, nParts: n, poses: this.graph.samplePoses(WALK, frame), aspect: frame, waterY: WATER_Y,
            // the behind-occluder pass only on request (?occbehind=1): it restored no part on seeds 1842 / 7719 / 30417 at 720p, 1080p and
            // 2560 x 1080 and cost 90-160 ms per fresh bake, cut at the district's freeze (the operator's decisions T1 / RG1, journal Passe Z1);
            // re-run it (and tools/occ-inventory.mjs) whenever the framings or the composition change
            behind: this.occlusion.enabled && behind && this.opts.params.get('occbehind') === '1' ? { ...behind, windowsFor: (cam, p) => this.revealWindows(cam, p) } : undefined,
            opts: this.bakeOptions(),
          }, this.bakeCacheMode());
          baked = true;
          return v;
        } catch (e) {
          this.visibilityError = String((e as Error)?.message ?? e);
          console.error(`${this.visibilityError} -> visibility culling disabled for this district: every part is kept`);
          return null;
        }
      };
    const occTest = this.opts.params.get('occtest')?.split(',').filter(Boolean);
    this.district = this.generator.generate(this.config, bake, { occTest });
    this.scene.add(this.district.group);
    const dist = this.district;
    this.occlusion.setup(dist.occluders.defs, dist.occluders.meshes, (a) => dist.setOccActive(a));
    if (opts.keepActors && this.actors) this.actors.rebind(this.district);
    else {
      this.actors?.populate(this.district, this.config.npcDensity, this.config.seed);
      this.particles?.clear(); this.particles?.setEmitters(this.district.emitters);
    }
    this.syncLights();
    this.lastGenMs = performance.now() - t0;
    this.rig.frame = baked ? frame : Infinity;
    this.rig.apply();
    this.updateShadowAndLights(0);
    // the static moon shadow sees every caster (all draw levels + the Tier 3 casters), which are then released
    this.district.setLevel(this.district.visibility.levels);
    this.shadow.update(this.renderer, this.scene, new THREE.Vector3(6, 0, 0), this.moonDir, 46, 32);
    this.district.releaseShadowOnly();
    if (opts.warm !== false) this.warmOcclusionVariants();
    this.drawLevel = -1;
    this.onRegenerate.forEach((f) => f());
  }

  /** ANGLE / D3D11 finishes a linked program at its first draw: the occlusion variants, bound only while a reveal fades, froze the first
   *  reveal for 0.3-1.1 s (journal pass 6; compiling them ahead without drawing does not help). One throw-away frame with every variant
   *  bound and every fade at 0 (no fragment is discarded), into the mirror and the scene targets (both redrawn every frame, never
   *  presented), moves that cost to the regeneration (or the boot). At the full draw level, so every occluder triangle is drawn (the
   *  framing's level is re-applied by the next update); the instanced lamps are drawn even when off-frame. */
  private warmOcclusionVariants(): void {
    const occ = this.occlusion, d = this.district, r = this.renderer;
    if (!occ.enabled || !d || !occ.meshes.length) return;
    const culled = occ.meshes.map((m) => m.mesh.frustumCulled);
    for (const m of occ.meshes) { m.mesh.material = m.variant; m.mesh.frustumCulled = false; }
    d.setLevel(d.visibility.levels); this.drawLevel = -1;
    d.setOccActive(true);
    const prev = r.getRenderTarget();
    this.reflection.update(r, this.scene, this.rig.camera);
    r.setRenderTarget(this.post.sceneRT);
    r.clear(true, true, true);
    r.render(this.scene, this.rig.camera);
    r.setRenderTarget(prev);
    d.setOccActive(false);
    occ.meshes.forEach((m, i) => { m.mesh.material = m.base; m.mesh.frustumCulled = culled[i]; });
  }

  /** ?viscache=0 (or off): bake every time, store nothing; ?viscache=verify: bake every time and compare with the stored result */
  private bakeCacheMode(): BakeCacheMode {
    const c = this.opts.params.get('viscache');
    return c === '0' || c === 'off' ? 'off' : c === 'verify' ? 'verify' : 'on';
  }

  /** DEV negative controls / layout checks of the bake: ?visfail=alloc|zero (must fall back, see BakeOptions), ?vispage=<px> (page cap),
   *  experiments: ?visscale=<k> (every tile k x), ?visfine=D:4 | A+B+C+D:2 | 0 (the fine tiles, default BAKE_FINE; 0 = none) */
  private bakeOptions(): BakeOptions {
    if (!import.meta.env.DEV) return {};
    const q = this.opts.params, f = q.get('visfail'), pg = Number(q.get('vispage')), sc = Number(q.get('visscale')), fn = q.get('visfine')?.split(':');
    return { ...(f === 'alloc' || f === 'zero' ? { fail: f } : {}), ...(pg > 0 ? { page: pg } : {}), ...(sc > 0 ? { scale: sc } : {}), ...(fn ? { fine: +fn[1] > 0 ? { sets: fn[0].split('+') as VisSet[], scale: +fn[1] } : null } : {}) };
  }

  /** behind-occluder windows of a baked pose: the reveal ellipse (tile NDC, with margin) around every quay position the
   *  player can hold while the camera sits in that pose, through the same projection / sizing the runtime uses */
  private revealWindows(cam: THREE.PerspectiveCamera, p: BakePose): Array<[number, number, number, number]> {
    if (!p.player) return [];
    const cs = (p.pose as CamState).charScale ?? 1, h = this.actors?.player?.height ?? 1.78, [px] = p.player;
    const hx = 0.5 * 1080 * cam.aspect, hy = 540, out: Array<[number, number, number, number]> = [];
    const zs = [WALK.z0 + 0.3, -1.4, 0.2, 1.7, 3.0, WALK.z1];
    for (let x = px - 4; x <= px + 4 + 1e-6; x += 1) {
      if (x < WALK.x0 - 0.01 || x > WALK.x1 + 0.01) continue;
      for (const z of zs) {
        const r = playerReveal(cam, x, 0, z, h, cs), s = revealSize(r.hNdc * 0.5 * 1080, 1080), k = s.k * 1.25;
        out.push([r.cx, r.cy, (s.rx * k) / hx, (s.ry * k) / hy]);
      }
    }
    return out;
  }

  /** visible set of the current framing(s): each framing draws the prefix of part classes it needs; a blend draws the
   *  union of both ends (the AB / BC / CD / BD buffers are baked into those classes) */
  private applyVisibleSet(): void {
    if (!this.district) return;
    const ids = this.debugActive ?? (this.rig.manual || this.visibilityFrozen ? (['A'] as CamId[]) : this.graph.activeIds());
    const level = this.district.levelOf(ids);
    this.visibleSet = ids.join('+');
    if (level !== this.drawLevel) { this.drawLevel = level; this.district.setLevel(level); }
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
      a.charScale = this.graph.state.charScale;
      // movement keys stay mapped through the yaw they were pressed under; re-sync only when input is released
      if (!a.moveInput) a.controlYaw = this.rig.yaw;
      else if (this.graph.arrival) this.graph.arrival = false;
      a.update(dt, this.simTime);
      this.graph.update(a.player.pos, dt, this.rig);
      this.applyVisibleSet();
      this.sprites.charScale = this.graph.state.charScale;
      // after the camera graph (settled or mid-blend pose): which occluders hide the player, fades, reveal ellipse
      this.occlusion.update(dt, this.rig.camera, a.player, this.graph.state.charScale, this.post.width, this.post.height);
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
      this.weather?.update(this.time, this.rig.camera, this.actors.player.pos);
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
    // a callback the frame cap does not let through skips update and render (dt then spans the skipped vsyncs); `off` lets all through
    const loop = (t: number) => {
      if (this.frameCap.shouldRender(t)) {
        const now = performance.now();
        const dt = Math.min(0.05, (now - this.lastT) / 1000);
        this.lastT = now;
        this.update(dt);
        this.render();
      }
      requestAnimationFrame(loop);
    };
    loop(performance.now());
  }
}
