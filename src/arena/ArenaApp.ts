import * as THREE from 'three';
import { MaterialLibrary } from '../materials/MaterialLibrary';
import { defaultPainters } from '../materials/PainterPool';
import { PostFX } from '../atmosphere/PostFX';
import { MoonShadow, PlanarReflection } from '../atmosphere/ShadowAndReflection';
import { LightRig, type LightSource } from '../atmosphere/LightRig';
import { ParticleSystem } from '../atmosphere/Particles';
import { U } from '../atmosphere/SceneUniforms';
import { buildSky } from '../atmosphere/Sky';
import { LOOKS, arenaLitByDay, arenaSunDir, parseTime, type DayLook } from '../atmosphere/DayState';
import { applyPose, type CamPose } from '../app/CameraRig';
import { FrameCap, parseFrameCap } from '../app/FrameCap';
import { PerfMonitor } from '../debug/PerfMonitor';
import { SpriteRenderer, PIXEL_WORLD, type Actor } from '../characters/SpriteRenderer';
import type { Anim } from '../characters/SpriteGenerator';
import { CombatSim, type CombatData, type CombatEvent, type FighterId, type ActionId } from './CombatSim';
import { buildArena, type ArenaBuild } from './ArenaScene';
import { buildArenaAtlas, clipFrame, CELL_W, CELL_H, CELL_FOOT, type ArenaSpriteSet } from './FighterArt';
import { ArenaHud, type Assist, type ArenaTexts } from './ArenaHud';
import { PRESETS, runScript } from './Presets';
import { FloorUI } from './FloorUI';

/** The arena scene of the game (journal Passe P1): `?scene=arena`. The prototype's duel (CombatSim, ported rule for rule) staged with
 *  the town's renderer: the same materials, lights (LightRig), sky, moon shadow, planar reflection in the puddles and post chain (in-scatter,
 *  DOF, bloom, palette grade); the fighters are generated sprites drawn by the town's SpriteRenderer; the HUD is DOM in the game's UI style.
 *  The town (the default scene) is untouched by it: nothing here runs unless the parameter asks for it.
 *  Parameters: `assist=subtle|full|off` (the prototype's visual assistance; default subtle), `hud=0` / `clean=1` (no HUD), `fps=` (the
 *  game's frame cap), `freeze=<s>` (fixed shader time), `seed=` (the stands' spectators and the town houses), `time=morning|midday|afternoon`
 *  (a day state, DayState.ts: the play mode's pages set it from the slot, journal Passe AD1; absent = the night, exactly as before). Keys: 1-6
 *  attacks and techniques, A dodge, B guard (hold), R restart, Space pause, H HUD. */

/** an official bout of the game's play mode (journal Passe L3): its data (a variant of CombatData, src/combat/match.ts), who sits in the
 *  opponent's seat, the assistance the preparation earned, the play mode's words; no restart, and `onOver` once the bout is decided */
export interface ArenaMatch {
  data: CombatData; foe: string; assist: Assist; texts: ArenaTexts;
  onOver?: (r: { winner: FighterId; hp: Record<FighterId, number>; maxHp: Record<FighterId, number>; finisher: string | null; t: number }) => void;
}
/** the forecourt's walking mode (journal Passe L6): no bout; the hero walks the sand (arrows or A / D, W / S), Marek drills by the ring; the
 *  play mode reads where the hero stands (`walkerX`) */
export interface ArenaForecourt { /** the champion is on the sand (by day) */ marek: boolean }
export interface ArenaOptions { canvas: HTMLCanvasElement; params: URLSearchParams; onProgress: (label: string, f: number) => void; match?: ArenaMatch; forecourt?: ArenaForecourt }

type Clip = string;
const ATTACKS = new Set<Clip>(['strike', 'heavy', 'skill', 'slash']);
/** the impact frame of each attack clip (FighterArt.clipFrame) */
const IMPACT_FRAME: Record<string, number> = { strike: 1, heavy: 2, skill: 1, slash: 1 };
/** the fighters' marks on the floor (x), the camera's base framing */
const HOME = { ren: -2.15, marek: 2.15 };
const CHAR_SCALE = 1.42;
const BASE_POSE: CamPose = { yaw: 0, pitch: THREE.MathUtils.degToRad(3.5), dist: 15.6, fov: 34, shift: 0, tx: 0, ty: 2.3, tz: -0.6 };
/** the moon's colour (cool, faint), and a colour's luminance (the sprites' LUM) */
const NIGHT_MOON = new THREE.Color(0.27, 0.37, 0.58);
const lum = (c: THREE.Color): number => 0.3 * c.r + 0.55 * c.g + 0.15 * c.b;
/** the low moon behind the grand gate, a little right of it: elevation 6.5 deg, azimuth 4 deg */
const MOON_DIR = new THREE.Vector3(Math.sin(THREE.MathUtils.degToRad(4)) * Math.cos(THREE.MathUtils.degToRad(6.5)), Math.sin(THREE.MathUtils.degToRad(6.5)), -Math.cos(THREE.MathUtils.degToRad(4)) * Math.cos(THREE.MathUtils.degToRad(6.5))).normalize();

interface Pres { off: number; knock: number; flash: number; guardHit: number; lastClip: string }
interface Fx { act: Actor; kind: string; age: number; frames: number; step: number }

export class ArenaApp {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene = new THREE.Scene();
  readonly camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.5, 900);
  readonly post: PostFX;
  readonly shadow = new MoonShadow(2048);
  readonly reflection = new PlanarReflection();
  readonly lights = new LightRig();
  readonly frameCap = new FrameCap();
  /** frame time, draws and (?gpuprof=1, or tools/perf.mjs) GPU ms per pass, as the town's App */
  readonly perf = new PerfMonitor();
  buildMs = 0;
  /** a day state (?time=, the operator's decision L7-2, journal Passe AD1): the sun in the moon's place, turned into the arena's frame, the
   *  state's sky, haze, grade and lights; null = the night, untouched */
  readonly look: DayLook | null;
  /** the key light's direction: the low moon behind the gate at night, the state's sun by day */
  readonly keyDir: THREE.Vector3;
  readonly sim: CombatSim;
  lib!: MaterialLibrary;
  arena!: ArenaBuild;
  set!: ArenaSpriteSet;
  sprites!: SpriteRenderer;
  particles!: ParticleSystem;
  hud: ArenaHud | null = null;
  readonly floor = new FloorUI();
  assist: Assist = 'subtle';
  hudVisible = true;
  paused = false;
  /** a scripted moment is on screen (`jump`): the simulation holds without the pause screen */
  moment = false;
  timeScale = 1;
  ready = false;
  /** presentation clock (shaders, loops), frozen by ?freeze= */
  time = 0;
  frozen: number | null = null;
  frameCount = 0;
  readonly fighters: Record<FighterId, Actor>;
  readonly fans: Actor[] = [];
  private readonly pres: Record<FighterId, Pres> = { ren: { off: 0, knock: 0, flash: 0, guardHit: 0, lastClip: '' }, marek: { off: 0, knock: 0, flash: 0, guardHit: 0, lastClip: '' } };
  private fx: Fx[] = [];
  private fanCheer: number[] = [];
  private acc = 0;
  private lastT = performance.now();
  private shake = 0;
  private koT = -1;
  private castLight: LightSource | null = null;
  private hitLight: LightSource | null = null;
  private reducedMotion = false;
  private pose: CamPose = { ...BASE_POSE };
  /** the camera's push-in toward Marek's heavy charge, smoothed (0..1) */
  private push = 0;
  /** the blow that ended the bout, and whether the play mode has been told */
  private finisher: string | null = null;
  private told = false;
  /** the forecourt's walker: held keys, position along the sand, its walk clock */
  private walkKeys = new Set<string>();
  walkerX = -4.5;
  private walkerZ = 0.6;
  private walkT = 0;
  private walkFrames = 0;

  constructor(private opts: ArenaOptions) {
    this.sim = new CombatSim(opts.match?.data);
    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false });
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;
    this.perf.attach(this.renderer.getContext() as WebGL2RenderingContext);
    this.post = new PostFX(this.renderer);
    const q = opts.params;
    if (q.has('gpuprof')) this.perf.gpu.enabled = true;
    this.frameCap.mode = parseFrameCap(q.get('fps')) ?? { kind: 'adaptive', fps: 60 };
    const as = q.get('assist');
    if (as === 'full' || as === 'off' || as === 'subtle') this.assist = as;
    if (opts.match) this.assist = opts.match.assist;
    if (q.get('hud') === '0' || q.has('clean')) this.hudVisible = false;
    if (q.has('freeze')) this.frozen = parseFloat(q.get('freeze')!);
    // ?cam=pitchDeg,dist,fov,ty,tz,tx overrides the base framing while tuning (blank = keep)
    const cv = q.get('cam')?.split(',').map((x) => (x.trim() === '' ? NaN : Number(x)));
    if (cv) {
      if (!isNaN(cv[0])) BASE_POSE.pitch = THREE.MathUtils.degToRad(cv[0]);
      ([['dist', 1], ['fov', 2], ['ty', 3], ['tz', 4], ['tx', 5]] as const).forEach(([k, i]) => { if (!isNaN(cv[i])) BASE_POSE[k] = cv[i]; });
    }
    this.reducedMotion = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.scene.add(this.camera);
    this.camera.layers.enable(2);
    const t = parseTime(q);
    this.look = t ? LOOKS[t] : null;
    this.keyDir = t ? arenaSunDir(t, MOON_DIR) : MOON_DIR.clone();
    this.scene.add(buildSky(this.look?.sky ?? null));
    this.reflection.clipY = 0;
    U.uMoonDir.value.copy(this.keyDir);
    U.uMoonCol.value.copy(NIGHT_MOON);
    if (this.look) this.applyDay(this.look);
    const fighter = (id: FighterId): Actor => ({
      id: id === 'ren' ? 1 : 2, spec: id, role: 'fighter', detail: 'hero', pos: new THREE.Vector3(HOME[id], 0, 0), facing: 'side', dir: 'side', flip: id === 'ren',
      anim: 'idle.0' as Anim, t: 0, speed: 0, tint: [1, 1, 1], scale: 1, height: 1.95, radius: 0.4,
    });
    this.fighters = { ren: fighter('ren'), marek: fighter('marek') };
    window.addEventListener('resize', () => this.resize());
  }

  /** the day look over the night's values (as the town's App.applyDay): the sun in the moon's uniforms, the sky's ambient, the haze, the
   *  cobbles' wetness, the grade; the warm city glow off */
  private applyDay(L: DayLook): void {
    U.uMoonCol.value.copy(L.sunCol);
    U.uSkyAmb.value.copy(L.skyAmb); U.uGroundAmb.value.copy(L.groundAmb); U.uFillCol.value.copy(L.fillCol);
    U.uFogColor.value.copy(L.fogColor); U.uSkyZenith.value.copy(L.skyZenith); U.uCityGlow.value.setRGB(0, 0, 0);
    U.uFogDensity.value = L.fogDensity; U.uMist.value = L.mist; U.uWet.value = L.wet;
    Object.assign(this.post.params, L.post, { shadowTint: L.post.shadowTint!.clone(), highlightTint: L.post.highlightTint!.clone() });
  }

  async init(): Promise<void> {
    const pq = this.opts.params.get('painters');
    const painters = pq === 'main' ? 0 : pq !== null && /^\d+$/.test(pq) ? +pq : defaultPainters();
    this.frameCap.probe();
    this.lib = await MaterialLibrary.build(this.renderer, this.opts.onProgress, painters);
    // by day (J4 transposed): the window and lantern glass dims, the braziers' coals keep the night's glow on their own copy of the material;
    // the town houses' shop windows dim and their roofs take the state's tint, as in the district
    let fireGlow: THREE.ShaderMaterial | null = null;
    if (this.look) {
      const g = this.lib.slot.glow;
      fireGlow = new THREE.ShaderMaterial({ uniforms: { ...g.uniforms, uEmissive: { value: g.uniforms.uEmissive.value } }, vertexShader: g.vertexShader, fragmentShader: g.fragmentShader, defines: { ...g.defines }, side: g.side });
      fireGlow.name = 'glow:fire-day';
      g.uniforms.uEmissive.value = this.look.glowEmissive;
      this.lib.slot.shop.uniforms.uEmissive.value = this.look.shopEmissive;
      this.lib.slot.roof.uniforms.uBase.value.copy(this.look.roofTint);
    }
    this.frameCap.endProbe();
    this.opts.onProgress('arena', 0.96);
    await new Promise((r) => setTimeout(r, 0));
    const seed = (parseInt(this.opts.params.get('seed') ?? '1842', 10) >>> 0) || 1842;
    const tb = performance.now();
    this.arena = buildArena(this.lib, seed, { fireApart: !!this.look });
    this.buildMs = performance.now() - tb;
    this.scene.add(this.arena.group);
    for (const l of this.arena.lights) {
      const s = this.lights.add(l, 'static', Math.abs(Math.sin(l.pos[0] * 12.9 + l.pos[2] * 78.2)));
      // by day only the fires burn: a light at 0 leaves the upload, the in-scatter, the halos and the sprite light shadows (as App.syncLights)
      if (this.look && !arenaLitByDay(l)) s.scale = s.targetScale = 0;
    }
    if (this.look) {
      if (this.arena.fire && fireGlow) this.arena.fire.material = fireGlow;
      // the far city's day variant (its lamps and windows unlit)
      this.arena.group.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined;
        if (m && m.name === 'far' && !m.defines?.DAY) { m.defines = { ...m.defines, DAY: 1 }; m.needsUpdate = true; }
      });
    }
    // two dynamic lights: Marek's charged blade (the heavy's tell) and the flash of a landed blow
    this.castLight = this.lights.add({ pos: [HOME.marek + 0.2, 3.2, -0.6], color: [1.0, 0.46, 0.2], intensity: 2.4, radius: 6, kind: 'steady', priority: 9 }, 'fx', 0);
    this.hitLight = this.lights.add({ pos: [0, 1.4, 0.5], color: [1.0, 0.86, 0.66], intensity: 1.5, radius: 4.5, kind: 'steady', priority: 10 }, 'fx', 0);
    this.castLight.scale = this.castLight.targetScale = 0; this.hitLight.scale = this.hitLight.targetScale = 0;
    this.opts.onProgress('fighters', 0.98);
    this.set = buildArenaAtlas(seed, 5, this.opts.match?.foe, !!this.opts.forecourt);
    this.walkFrames = [...this.set.atlas.frames.keys()].filter((x) => x.startsWith('ren/side/walk.')).length;
    this.sprites = new SpriteRenderer(this.set.atlas, 96, { w: CELL_W, h: CELL_H, foot: CELL_FOOT });
    this.sprites.charScale = CHAR_SCALE;
    this.sprites.protect.crowd = 0.35;
    // by day the silhouette treatment (lit-side lift, crown rim, shadow side: uMoonCol, the sun) keeps the night's strength: scaled by the
    // moon's luminance over the sun's (journal Passe AD1)
    if (this.look) this.sprites.setEdgeGain(lum(NIGHT_MOON) / lum(this.look.sunCol));
    this.scene.add(this.sprites.group);
    this.scene.add(this.floor.mesh);
    // spectators on the tiers: the town's crowd archetypes, front view, idling and cheering in turn
    let k = 0;
    for (const st of this.arena.stands) {
      const h = Math.abs(Math.sin(st.pos[0] * 91.7 + st.pos[2] * 13.3 + k));
      this.fans.push({ id: 100 + k, spec: `fan${Math.floor(h * 997) % this.set.crowd.length}`, role: 'fan', detail: 'crowd', pos: new THREE.Vector3(...st.pos), facing: 'down', dir: 'down', flip: h > 0.5, anim: 'idle', t: h * 10, speed: 0, tint: [0.5, 0.56, 0.74], scale: 0.62, height: 1.4, radius: 0.3 });
      this.fanCheer.push(-10);
      k++;
    }
    this.particles = new ParticleSystem(this.lib);
    this.particles.setEmitters(this.arena.emitters);
    this.scene.add(this.particles.group);
    this.resize();
    this.applyCamera(0);
    this.lights.update(this.time, 0, this.camera);
    // the moon's box is narrow (it lies low behind the gate); a high sun sees the floor and the stands from above: a wider box
    if (this.look) this.shadow.update(this.renderer, this.scene, new THREE.Vector3(0, 2, -4), this.keyDir, 30, 30);
    else this.shadow.update(this.renderer, this.scene, new THREE.Vector3(0, 3.5, -6), MOON_DIR, 24, 9);
    if (!this.opts.params.has('clean')) this.hud = new ArenaHud(this.sim, this.set.portraits, this.opts.match?.texts, parseTime(this.opts.params));
    if (this.hud) {
      this.hud.onAction = (id, down) => this.action(id, down);
      this.hud.project = (who) => this.headScreen(who);
    }
    this.bindInput();
    this.presentFighters(0);
    // the programs, linked in parallel under the loading screen (the town's boot does the same, journal pass 6 P2)
    const prev = this.renderer.getRenderTarget();
    this.renderer.setRenderTarget(this.post.sceneRT);
    const linked = this.renderer.compileAsync(this.scene, this.camera);
    this.renderer.setRenderTarget(prev);
    await linked;
    // the HUD's embedded fonts (journal Passe UI3): loaded before the first frame a capture could take
    await this.hud?.ready;
    this.render();
    this.ready = true;
  }

  resize(): void {
    const w = window.innerWidth, h = window.innerHeight, pr = Math.min(window.devicePixelRatio || 1, 2);
    this.post.setSize(w, h, pr);
    this.reflection.setSize(w * pr, h * pr);
    U.uResolution.value.set(this.post.width, this.post.height);
    this.applyCamera(0);
  }

  // ---------------------------------------------------------------- input
  /** a command from the keys, a gamepad or the action bar */
  action(id: string, down = true): void {
    const s = this.sim;
    if (id === 'guard') { s.setGuard('ren', down); return; }
    if (!down) return;
    if (id === 'dodge') s.react('ren', 'dodge');
    else if (id === 'reset') { if (!this.opts.match) this.restart(); }
    else if (id === 'pause') { this.paused = !this.paused && !this.moment ? true : false; this.moment = false; this.hud?.still(false); }
    else s.command('ren', id as ActionId);
  }

  private bindInput(): void {
    if (this.opts.forecourt) {
      window.addEventListener('keydown', (e) => { if (!e.metaKey && !e.ctrlKey && !e.altKey && !(e.target instanceof HTMLInputElement)) this.walkKeys.add(e.key.toLowerCase()); });
      window.addEventListener('keyup', (e) => this.walkKeys.delete(e.key.toLowerCase()));
      window.addEventListener('blur', () => this.walkKeys.clear());
      return;
    }
    const KEYS: Record<string, string> = { '1': 'light', '2': 'heavy', '3': 't1', '4': 't2', '5': 't3', '6': 't4', a: 'dodge', b: 'guard', r: 'reset', ' ': 'pause' };
    window.addEventListener('keydown', (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || !this.ready) return;
      const k = e.key.toLowerCase(), m = KEYS[k];
      if (m) { e.preventDefault(); this.action(m, true); this.hud?.flash(m); }
      else if (k === 'h') this.hudVisible = !this.hudVisible;
    });
    window.addEventListener('keyup', (e) => { if (e.key.toLowerCase() === 'b') this.action('guard', false); });
    window.addEventListener('blur', () => this.action('guard', false));
  }

  private padPrev: boolean[] = [];
  /** gamepad (the prototype's mapping): A dodge, B guard, X / Y light / heavy, shoulders and triggers the techniques, Start pause, Back reset */
  private pollPad(): void {
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && pads[0]; if (!p) return;
    const PAD: Record<number, string> = { 0: 'dodge', 1: 'guard', 2: 'light', 3: 'heavy', 4: 't1', 5: 't2', 6: 't3', 7: 't4', 9: 'pause', 8: 'reset' };
    for (const [b, id] of Object.entries(PAD)) {
      const i = +b, down = !!p.buttons[i]?.pressed;
      if (down && !this.padPrev[i]) { this.action(id, true); this.hud?.flash(id); }
      if (!down && this.padPrev[i] && id === 'guard') this.action('guard', false);
      this.padPrev[i] = down;
    }
  }

  restart(): void {
    this.sim.reset();
    this.onEvents(this.sim.drain());
    this.paused = false; this.moment = false; this.hud?.still(false);
  }

  // ---------------------------------------------------------------- simulation -> presentation
  private onEvents(evs: CombatEvent[]): void {
    for (const e of evs) {
      if (e.type === 'impact') {
        if (e.hp <= 0) this.finisher = e.kind;
        const to = this.pres[e.to], tgt = this.fighters[e.to], heavy = e.kind === 'heavy' || e.damage >= 20;
        if (e.result === 'hit') { to.knock = heavy ? -0.42 : -0.24; to.flash = 1; this.shake = Math.max(this.shake, heavy ? 1 : 0.45); this.spawnFx(e.from === 'marek' && e.kind === 'heavy' ? 'ember' : 'spark', tgt, e.to); }
        else if (e.result === 'guarded') { to.knock = -0.12; to.guardHit = 1; this.shake = Math.max(this.shake, 0.3); this.spawnFx('guard', tgt, e.to); }
        else if (e.result === 'guardbreak') { to.knock = -0.6; to.flash = 1; this.shake = Math.max(this.shake, 1.2); this.spawnFx('ember', tgt, e.to); this.spawnFx('guard', tgt, e.to); }
        if (e.result !== 'dodged' && this.hitLight) {
          this.hitLight.pos.set(tgt.pos.x - (e.to === 'ren' ? -0.3 : 0.3), 1.45, 1.2);
          this.hitLight.scale = this.hitLight.targetScale = heavy || e.result === 'guardbreak' ? 1 : 0.55;
        }
        this.cheer(e.result === 'hit' && heavy ? 0.9 : e.result === 'guardbreak' ? 0.8 : e.result === 'hit' ? 0.35 : 0.2);
      } else if (e.type === 'ko') { this.koT = this.sim.t; this.cheer(1); }
      else if (e.type === 'reset') {
        this.koT = -1; this.shake = 0; this.push = 0;
        for (const p of Object.values(this.pres)) { p.off = p.knock = p.flash = p.guardHit = 0; }
        for (const f of this.fx) f.act.hidden = true;
        this.fx = [];
      }
    }
    this.hud?.onEvents(evs, this.sim);
  }

  /** a share of the stands react (deterministic: by seat and sim time) */
  private cheer(amount: number): void {
    const t = this.sim.t;
    this.fanCheer.forEach((_, i) => { const h = Math.abs(Math.sin(i * 12.9898 + t * 7.31)) % 1; if (h < amount) this.fanCheer[i] = t + h * 0.3; });
  }

  private spawnFx(kind: string, tgt: Actor, who: FighterId): void {
    const dir = who === 'ren' ? 1 : -1;   // toward the attacker
    const act: Actor = { id: 900 + this.fx.length, spec: 'fx', role: 'fx', detail: 'hero', pos: new THREE.Vector3(tgt.pos.x + dir * 0.32, 0.32, 0.45), facing: 'side', dir: 'side', flip: kind === 'guard' ? who === 'ren' : false, anim: `${kind}.0` as Anim, t: 0, speed: 0, tint: [1, 1, 1], scale: 1, height: 1, radius: 0.1, noShadow: true };
    this.fx.push({ act, kind, age: 0, frames: 3, step: kind === 'guard' ? 0.07 : 0.055 });
  }

  /** each fighter's frame, place and tint from its simulation state */
  private presentFighters(dt: number): void {
    const s = this.sim;
    for (const id of ['ren', 'marek'] as FighterId[]) {
      const f = s.f[id], a = this.fighters[id], p = this.pres[id], an = f.anim!;
      let clip = an.name;
      const clips = this.set.clips[id];
      if (s.over && f.state !== 'down') clip = 'victory';
      if (!clips[clip]) clip = id === 'marek' || f.ap >= 2 ? 'ready' : 'idle';
      const def = clips[clip], n = def.frames.length;
      let fi = clipFrame(clip, n, an.t, an.impactAt ?? 0, def.loop ?? 0);
      if (clip === 'block' && p.guardHit > 0) fi = 1;
      a.anim = `${clip}.${fi}` as Anim;
      // lunges: an attack closes the gap so its blade lands on the opponent at the impact; a dodge leaps back; hits knock back
      const other = id === 'ren' ? 'marek' : 'ren', gap = Math.abs(HOME[other] - HOME[id]);
      if (ATTACKS.has(clip) && an.impactAt !== undefined) {
        const reach = (this.set.reach[`${id}/${clip}.${IMPACT_FRAME[clip]}`] ?? 20) * PIXEL_WORLD * CHAR_SCALE;
        const A = Math.max(0, Math.min(2.4, gap - reach - 0.12)), ia = an.impactAt, t = an.t;
        // the heavy closes the gap only in its last 0.16 s (gap and telegraph stay open through the charge, critique n° 3 of Passe P2)
        const t0 = clip === 'heavy' ? Math.max(0, ia - 0.16) : ia * 0.35;
        if (t <= ia + 0.12) p.off = A * smooth((t - t0) / Math.max(0.05, ia - t0));
        else p.off *= Math.exp(-dt * 5);
      } else if (clip === 'dodge') p.off = Math.min(p.off, -1.05 * smooth(an.t / 0.16));
      else p.off *= Math.exp(-dt * (p.off < 0 ? 4 : 5));
      p.knock *= Math.exp(-dt * 7); p.flash = Math.max(0, p.flash - dt / 0.14); p.guardHit = Math.max(0, p.guardHit - dt / 0.14);
      const facing = id === 'ren' ? 1 : -1;
      a.pos.x = HOME[id] + facing * (p.off + p.knock);
      // the acting fighter draws in front (its blade over the other's body)
      a.pos.z = f.state === 'acting' ? 0.14 : -0.06;
      const k = p.flash;
      a.tint = [1 + 0.35 * k, 1 + 0.3 * k, 1 + 0.22 * k];
      a.t = 0;
      p.lastClip = clip;
    }
  }

  private presentFans(): void {
    const t = this.sim.t;
    this.fans.forEach((a, i) => {
      const c = this.fanCheer[i], on = t >= c && t < c + 1.4;
      a.anim = on ? 'talk' : 'idle';
      a.t = (on ? t - c : t + i * 0.37);
      a.pos.y = this.arena.stands[i].pos[1] + (on ? Math.max(0, Math.sin((t - c) * 9)) * 0.07 : 0);
    });
  }

  private presentFx(dt: number): void {
    for (const f of this.fx) {
      f.age += dt;
      const i = Math.floor(f.age / f.step);
      if (i >= f.frames) { f.act.hidden = true; continue; }
      f.act.anim = `${f.kind}.${i}` as Anim;
    }
    this.fx = this.fx.filter((f) => !f.act.hidden);
  }

  /** the contextual camera: the base framing; a push-in toward Marek while he charges a heavy (scaled by the assistance), held through the
   *  window and released after the impact; a small shake on hard blows (none with reduced motion); a slow push onto a KO */
  private applyCamera(dt: number): void {
    const s = this.sim, inc = s.incoming(), ac = this.assist === 'full' ? 1 : this.assist === 'subtle' ? 0.45 : 0;
    const want = inc && inc.kind === 'heavy' ? ac * smooth((inc.castProgress - 0.1) / 0.75) : inc ? ac * 0.25 * inc.castProgress : 0;
    this.push += (want - this.push) * Math.min(1, dt * (want > this.push ? 6 : 2.5));
    const P = { ...BASE_POSE };
    P.dist -= 1.1 * this.push; P.tx += 0.55 * this.push; P.pitch += THREE.MathUtils.degToRad(0.6) * this.push;
    if (this.koT >= 0) {
      const k = smooth((s.t - this.koT) / 1.6), down = s.f.ren.state === 'down' ? 'ren' : 'marek';
      P.dist -= 2.2 * k; P.tx += (this.fighters[down].pos.x * 0.6) * k; P.ty -= 0.25 * k;
    }
    this.shake = Math.max(0, this.shake - dt * 4.5);
    if (this.shake > 0 && !this.reducedMotion) {
      const a = this.shake * this.shake * 0.07, t = s.t * 53;
      P.tx += Math.sin(t * 1.7) * a; P.ty += Math.sin(t * 2.3 + 1.1) * a * 0.7;
    }
    this.pose = P;
    applyPose(this.camera, P, window.innerWidth / Math.max(1, window.innerHeight));
  }

  /** CSS px of a fighter's head on screen */
  private headScreen(who: FighterId): { x: number; y: number } {
    const a = this.fighters[who], v = new THREE.Vector3(a.pos.x, 2.35 * CHAR_SCALE, a.pos.z).project(this.camera);
    return { x: (v.x * 0.5 + 0.5) * window.innerWidth, y: (-v.y * 0.5 + 0.5) * window.innerHeight };
  }

  /** the fighters' rings (with the HUD) and the telegraph of a reactable attack (full assistance) */
  private updateFloor(): void {
    const inc = this.sim.incoming(), tele = !!inc && this.assist === 'full' && this.hudVisible && !this.sim.over;
    this.floor.update(this.fighters.ren.pos, this.fighters.marek.pos, this.hudVisible && !this.sim.over ? 1 : 0, tele ? 1 : 0, inc ? inc.castProgress : 0, !!inc?.windowOpen, this.sim.t);
  }

  private updateDynamicLights(): void {
    const inc = this.sim.incoming(), c = this.castLight, h = this.hitLight;
    if (c) {
      const glow = this.assist === 'off' ? 0 : inc && inc.action === 'm_heavy' ? Math.min(1, inc.castProgress * 1.25) * (inc.windowOpen ? 1.15 : 0.85) : 0;
      c.pos.set(HOME.marek + 0.2, 3.2, -0.6);
      c.scale = c.targetScale = glow;
    }
    if (h) { h.scale = Math.max(0, h.scale - 1 / 60 / 0.14); h.targetScale = h.scale; }
  }

  /** the forecourt: the hero walks (the town generator's walk, side view), Marek drills his slash by the ring when he is there */
  private presentForecourt(dt: number): void {
    const k = this.walkKeys, ix = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0), iz = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0);
    const r = this.fighters.ren, m = this.fighters.marek;
    if (ix || iz) {
      this.walkerX = Math.max(-6.4, Math.min(6.4, this.walkerX + ix * 2.6 * dt));
      this.walkerZ = Math.max(-1.6, Math.min(2.2, this.walkerZ + iz * 1.8 * dt));
      if (ix) r.flip = ix > 0;
      this.walkT += dt;
      r.anim = (this.walkFrames ? `walk.${Math.floor(this.walkT * 8) % this.walkFrames}` : 'idle.0') as Anim;
    } else { this.walkT = 0; r.anim = `idle.${Math.floor(this.time * 1.7) % 2}` as Anim; }
    r.pos.set(this.walkerX, 0, this.walkerZ);
    m.hidden = !this.opts.forecourt!.marek;
    const cyc = this.time % 3.2, clip = cyc < 2.2 ? 'ready' : 'slash';
    m.anim = `${clip}.${clip === 'ready' ? Math.floor(this.time * 1.4) % 2 : Math.min(2, Math.floor((cyc - 2.2) / 0.33))}` as Anim;
    m.pos.set(3.4, 0, -1.2);
  }

  // ---------------------------------------------------------------- frame
  /** advances the simulation (fixed 1/120 s steps) and the presentation by dt */
  update(dt: number): void {
    this.time = this.frozen ?? this.time + dt;
    U.uTime.value = this.time;
    U.uMoonDir.value.copy(this.keyDir);
    this.pollPad();
    if (!this.paused) {
      this.acc += dt * this.timeScale;
      const step = this.sim.D.dt;
      let n = 0;
      while (this.acc >= step && n++ < 24) { this.sim.step(step); this.onEvents(this.sim.drain()); this.acc -= step; }
      if (n >= 24) this.acc = 0;
    }
    const pdt = this.paused ? 0 : dt;
    if (this.opts.forecourt) this.presentForecourt(dt); else this.presentFighters(pdt);
    this.presentFans();
    this.presentFx(pdt);
    this.updateDynamicLights();
    this.applyCamera(pdt);
    this.updateFloor();
    // depth of field on the duel
    const v = new THREE.Vector3(0, 1.2, 0).applyMatrix4(this.camera.matrixWorldInverse);
    this.post.params.dofFocus = THREE.MathUtils.clamp(-v.z, 6, 40);
    this.lights.update(this.time, pdt, this.camera);
    this.sprites.update([this.fighters.ren, this.fighters.marek, ...this.fx.map((f) => f.act), ...this.fans], this.lights, this.camera, this.keyDir, null, this.fighters.ren);
    this.particles.update(pdt, this.time, this.camera, this.post.height, this.lights, null);
    this.hud?.update(this.sim, this.assist, this.hudVisible, this.paused && !this.moment);
    // an official bout: told once the KO has had its moment on screen
    const m = this.opts.match;
    if (m?.onOver && this.sim.over && !this.told && this.koT >= 0 && this.sim.t - this.koT >= 1.6) {
      this.told = true;
      const f = this.sim.f;
      m.onOver({ winner: f.ren.state === 'down' ? 'marek' : 'ren', hp: { ren: f.ren.hp, marek: f.marek.hp }, maxHp: { ren: f.ren.maxHp, marek: f.marek.maxHp }, finisher: this.finisher, t: this.sim.t });
    }
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
      if (this.frameCap.shouldRender(t)) {
        const now = performance.now(), dt = Math.min(0.05, (now - this.lastT) / 1000);
        this.lastT = now;
        this.update(dt);
        this.render();
      }
      requestAnimationFrame(loop);
    };
    this.lastT = performance.now();
    requestAnimationFrame(loop);
  }

  // ---------------------------------------------------------------- deterministic moments (captures, reviews)
  /** the prototype's `jump`: a scripted moment from a reset, every step delivered to the presentation at the simulation's fixed step (the
   *  prototype delivered its last half second only: a KO before it never reached the screen), then held */
  jump(name: string): boolean {
    const p = PRESETS[name]; if (!p) return false;
    this.sim.reset(); this.hud?.still(false); this.onEvents(this.sim.drain());
    const dt = this.sim.D.dt;
    runScript(this.sim, p.script, () => true, () => {
      this.onEvents(this.sim.drain());
      this.presentFighters(dt); this.presentFans(); this.presentFx(dt); this.updateDynamicLights(); this.applyCamera(dt);
      this.particles.update(dt, this.time, this.camera, this.post.height, this.lights, null);
    });
    this.paused = true; this.moment = true; this.hud?.still(true);
    this.update(0);
    return true;
  }

  renderOnce(): void { this.update(0); this.render(); }

  snapshot(): Record<string, unknown> {
    const r = this.renderer.info, p = this.perf, gpu = p.gpu.enabled ? { ...p.gpu.ms } : undefined;
    const bytes = (this.lib?.textureBytes() ?? 0) + (this.set ? this.set.atlas.width * this.set.atlas.height * 8 : 0) + this.post.textureBytes() + this.reflection.textureBytes() + this.shadow.size * this.shadow.size * 8;
    return {
      fps: p.fps, frameMs: p.frameMs, cpuMs: p.cpuMs, triangles: p.triangles, geometries: r.memory.geometries, textures: r.memory.textures, textureMB: bytes / 1048576, generatorMs: this.buildMs,
      gpu, gpuMs: gpu ? p.gpu.total() : undefined,
      t: +this.sim.t.toFixed(3), hash: this.sim.hash(), ren: { hp: this.sim.f.ren.hp, ap: this.sim.f.ren.ap, state: this.sim.f.ren.state, anim: this.fighters.ren.anim }, marek: { hp: this.sim.f.marek.hp, state: this.sim.f.marek.state, anim: this.fighters.marek.anim },
      lights: this.lights.sources.length, lightsOnScreen: this.lights.active, fans: this.fans.length, instances: this.arena?.stats.instances,
      atlas: this.set ? `${this.set.atlas.width}x${this.set.atlas.height} (${this.set.atlas.frameCount} cells)` : null, drawCalls: p.drawCalls, frameTriangles: p.triangles, arenaTriangles: this.arena?.stats.triangles, resolution: `${this.post.width}x${this.post.height}`,
      pose: this.pose, assist: this.assist,
    };
  }
}

function smooth(x: number): number { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); }
