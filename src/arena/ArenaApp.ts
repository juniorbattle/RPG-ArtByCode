import * as THREE from 'three';
import { MaterialLibrary } from '../materials/MaterialLibrary';
import { setTournamentHeraldry } from '../materials/CanvasArt';
import { defaultPainters } from '../materials/PainterPool';
import { PostFX } from '../atmosphere/PostFX';
import { MoonShadow, PlanarReflection } from '../atmosphere/ShadowAndReflection';
import { LightRig, type LightSource } from '../atmosphere/LightRig';
import { ParticleSystem } from '../atmosphere/Particles';
import { U } from '../atmosphere/SceneUniforms';
import { buildSky } from '../atmosphere/Sky';
import { LOOKS, arenaLitByDay, arenaSunDir, parseTime, type DayLook } from '../atmosphere/DayState';
import { applyPose, type CamPose } from '../app/CameraRig';
import { FrameCap } from '../app/FrameCap';
import { followGraphics } from '../settings/scene';
import { actHeld, actsOf, capRatio, onSettings, reducedMotion, type ResCap } from '../settings/settings';
import { keyId } from '../settings/keys';
import { PerfMonitor } from '../debug/PerfMonitor';
import { SpriteRenderer, PIXEL_WORLD, type Actor } from '../characters/SpriteRenderer';
import type { Anim } from '../characters/SpriteGenerator';
import { CombatSim, type CombatData, type CombatEvent, type FighterId } from './CombatSim';
import { DynamicSim, DYNAMIC_DATA, type DynData, type DynEvent } from '../combat/dynamic';
import { buildArena, type ArenaBuild } from './ArenaScene';
import { buildArenaAtlas, clipFrame, CELL_W, CELL_H, CELL_FOOT, type ArenaSpriteSet } from './FighterArt';
import { ArenaHud, type Assist, type ArenaTexts } from './ArenaHud';
import { DynamicHud, type DynTexts } from './DynamicHud';
import { PRESETS, runScript } from './Presets';
import { DYN_PRESETS, runDynScript } from './DynPresets';
import { arenaRules, dynClip, dynClipFrame, dynKeys, dynPad, fxOn, tuneDyn, v2Rules, type ArenaRules } from './dynamicView';
import { AutoReplay, sceneAutoDuel, type ReplayEvent } from './autoView';
import { AutoHud, AUTO_TEXTS_EN, AUTO_TEXTS_FR, autoActionName, type AutoTexts } from './AutoHud';
import type { AutoFighter, AutoResult } from '../combat/auto';
import { FloorUI } from './FloorUI';
import { chargeHudModel, makeV2Duel, runV2Script, V2_PAD, V2_PRESETS } from './v2Arena';
import { CHARGE_TEXTS_EN, CHARGE_TEXTS_FR } from './DynamicHud';
import { lang } from '../narrative/text';
import type { ChargedDuel, ChargeTier } from '../combat/charge';
import type { CombatFx } from './fx/combatFx';
import type { PieceId } from '../audio/plan';

/** The arena scene of the game (journal Passe P1): `?scene=arena`. The prototype's duel (CombatSim, ported rule for rule) staged with
 *  the town's renderer: the same materials, lights (LightRig), sky, moon shadow, planar reflection in the puddles and post chain (in-scatter,
 *  DOF, bloom, palette grade); the fighters are generated sprites drawn by the town's SpriteRenderer; the HUD is DOM in the game's UI style.
 *  The town (the default scene) is untouched by it: nothing here runs unless the parameter asks for it.
 *  Parameters: `assist=subtle|full|off` (the prototype's visual assistance; default subtle), `hud=0` / `clean=1` (no HUD), `fps=` (the
 *  game's frame cap), `freeze=<s>` (fixed shader time), `seed=` (the stands' spectators and the town houses), `time=morning|midday|afternoon`
 *  (a day state, DayState.ts: the play mode's pages set it from the slot, journal Passe AD1; absent = the night, exactly as before),
 *  `combat=dynamic` (the duel of the « tour par tour dynamique », src/combat/dynamic.ts, with its HUD, DynamicHud.ts, lot C2 of
 *  briefs/combat-system.md, journal Passe C2; behind this parameter until the operator's trial, CB-10; `dyn=key:value,...` sets the trial's
 *  numbers, dynamicView.ts; absent = the arena of today, CombatSim, unchanged). Keys: 1-6 attacks and techniques (under the new rules: 3-6
 *  the four skill slots), A dodge, B guard (hold), R restart, Space pause, H HUD. */

/** what the presentation reads of a duel's simulation: today's CombatSim and the new rules' DynamicSim both have it */
interface DuelFighter { hp: number; maxHp: number; ap: number; state: string; stateT: number; guarding: boolean; anim: { name: string; t: number; dur: number; impactAt?: number; prep?: number; loop?: boolean } | null }
export interface DuelSim {
  readonly D: { dt: number };
  t: number; over: boolean;
  f: Record<FighterId, DuelFighter>;
  incoming(): { kind: string; action: string; castProgress: number; windowOpen: boolean } | null;
  command(who: FighterId, id: string): unknown;
  react(who: FighterId, type: 'dodge'): boolean;
  setGuard(who: FighterId, on: boolean): void;
  step(dt?: number): void;
  drain(): Array<CombatEvent | DynEvent>;
  reset(): void;
  hash(): string;
}

/** an official bout of the game's play mode (journal Passe L3): its data (a variant of CombatData, src/combat/match.ts), who sits in the
 *  opponent's seat, the assistance the preparation earned, the play mode's words; no restart, and `onOver` once the bout is decided */
export interface ArenaMatch {
  /** today's data, or the new rules' (with `rules: 'dynamic'`, the game's `flags.combat`, journal Passe C2); none for the duel played by the computer */
  data?: CombatData | DynData; rules?: ArenaRules; foe: string; assist: Assist; texts: ArenaTexts | DynTexts | AutoTexts;
  /** the duel played by the computer (`rules: 'auto'`, every version 2 bout since lot 2, journal Passe LC3): its result with its script, its two fighters, the
   *  fighters' names on the cards */
  auto?: { result: AutoResult; ren: AutoFighter; foe: AutoFighter; names: { ren: string; marek: string } };
  /** the version 2's charge tiers (with `rules: 'v2'`, src/combat/v2duel.ts, journal Passe V1) */
  tiers?: ChargeTier[];
  /** the band's piece of the bout (src/audio/plan.ts `boutPiece`, journal Passe SN10): the duel, the rival or the finale by the tournament's stage */
  piece?: PieceId;
  /** a bout on the empty stands (lot L2b, EV-5 « L’arène aux gradins vides », journal Passe EVL3): a challenge or a reprisal in town, no spectator, no crowd */
  empty?: boolean;
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
/** « Skip » behind the black (the operator's rule of 2026-11-03, no hard cut; journal Passe LC4): the arena fades to the page's ink, the duel reaches its
 *  K.O. under it, the black lifts on the K.O.; on the arena's own clock (s), so a tool stepping `update` sees it as a player does */
const SKIP_FADE = { down: 0.22, hold: 0.06, up: 0.3 };
/** the duel played by the computer: the fastest a body moves on the floor (m/s), its lunge's own peak (2.4 m closed in 0.13 s on a smoothstep); a move the
 *  script asks faster (a lunge after a block or a dodge) runs at that speed instead of jumping (journal Passe LC4) */
const AUTO_BODY_SPEED = 27;
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
  /** the player's resolution cap (journal Passe RG2, RG-3): none by default */
  resCap: ResCap | null = null;
  /** frame time, draws and (?gpuprof=1, or tools/perf.mjs) GPU ms per pass, as the town's App */
  readonly perf = new PerfMonitor();
  buildMs = 0;
  /** a day state (?time=, the operator's decision L7-2, journal Passe AD1): the sun in the moon's place, turned into the arena's frame, the
   *  state's sky, haze, grade and lights; null = the night, untouched */
  readonly look: DayLook | null;
  /** the key light's direction: the low moon behind the gate at night, the state's sun by day */
  readonly keyDir: THREE.Vector3;
  /** the duel's simulation: today's (`classic`) or the new rules' (`dyn`, ?combat=dynamic or the play mode's dynamic game) */
  readonly sim: DuelSim;
  readonly rules: ArenaRules;
  readonly classic: CombatSim | null = null;
  readonly dyn: DynamicSim | null = null;
  /** the version 2's three buttons and charge of before (`v2`: ?duel=charge; its inner simulation is `dyn`); null with `input=keys` */
  readonly charge: ChargedDuel | null = null;
  /** the duel played by the computer (`auto`: a version 2 game's bout, or the arena's own page): its script played on the arena's clock */
  readonly auto: AutoReplay | null = null;
  /** ×2 (AC-13): the duel's clock twice as fast while the player asks it */
  speed = 1;
  lib!: MaterialLibrary;
  arena!: ArenaBuild;
  set!: ArenaSpriteSet;
  sprites!: SpriteRenderer;
  particles!: ParticleSystem;
  hud: ArenaHud | DynamicHud | AutoHud | null = null;
  readonly floor = new FloorUI();
  assist: Assist = 'subtle';
  hudVisible = true;
  paused = false;
  /** the first duel's lesson being read (journal Passe TU4, src/ui/duelTutorial.ts): the duel holds and its keys do not reach the fight */
  private lesson = false;
  /** the duel's events and its clock after them, for the first duel's tutorial (journal Passes TU4, LC5); none under « Skip »'s curtain */
  onDuelEvents: ((evs: ReadonlyArray<{ type: string } & Record<string, unknown>>, t: number) => void) | null = null;
  /** holds the duel for a lesson (no pause screen; the step that opened it is the last one played), the held commands let go, then gives it back */
  holdForLesson(on: boolean): void {
    if (on) { this.action('guard', false); if (this.charge) this.action('attack', false); this.acc = 0; }
    this.lesson = on; this.paused = on; this.moment = on; this.hud?.still(on);
  }
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
  /** DEV only: the combat sheets (?fighterdensity=combat, src/lab/fighterDensity.ts, journal Passes AA2 / RC1 / CX1); declared, never emitted */
  private declare densityTrial?: import('../lab/fighterDensity').DensityTrial;
  /** the version 2's spectators (journal Passe PU1, StandsCast.ts): a version 2 duel only; today's arena keeps its generated spectators */
  private stands: import('./StandsCast').Stands | null = null;
  /** the version 2's effects (src/arena/fx/, journal Passes FX3 / FX5): loaded on demand by a version 2 duel only; today's arena keeps its frames */
  private combatFx: CombatFx | null = null;
  /** the combat sheets of a duel under the version 2's rules (src/arena/CombatCast.ts, journal Passe CX2): loaded on demand, today's arena never reaches them */
  private sheets: import('./CombatSheets').InstalledSheets | null = null;
  /** who sits in the opponent's seat: the bout's rival, else Marek; DEV `foe=<id>` on the arena's page (a rival's sheet in its own duel, journal Passe CX1) */
  private foe: string;

  constructor(private opts: ArenaOptions) {
    this.foe = opts.match?.foe ?? (import.meta.env.DEV ? opts.params.get('foe') : null) ?? 'marek';
    this.rules = arenaRules(opts.params, opts.match);
    if (this.rules === 'dynamic') this.sim = this.dyn = new DynamicSim(tuneDyn((opts.match?.data as DynData | undefined) ?? DYNAMIC_DATA, opts.params.get('dyn')));
    else if (v2Rules(this.rules)) {
      let maxHp: Record<FighterId, number>;
      if (this.rules === 'auto') {
        // the duel played by the computer: decided before the page (the game's own result), played from its script; the arena's own page plays Ren against Marek
        const a = opts.match?.auto ?? sceneAutoDuel(this.foe, (parseInt(opts.params.get('duelseed') ?? '1337', 10) >>> 0) || 1337);
        this.auto = new AutoReplay(a.result, { ren: a.ren, marek: a.foe }, opts.match?.auto?.names ?? { ren: 'Ren', marek: this.foe[0].toUpperCase() + this.foe.slice(1) }); this.sim = this.auto as unknown as DuelSim;
        maxHp = { ren: this.auto.f.ren.maxHp, marek: this.auto.f.marek.maxHp };
      } else {
        const v = makeV2Duel(opts.params, opts.match ? { data: opts.match.data as DynData, tiers: opts.match.tiers } : undefined, this.foe); this.dyn = v.dyn; this.charge = v.charge; this.sim = (v.charge ?? v.dyn) as unknown as DuelSim;
        maxHp = { ren: v.dyn.f.ren.maxHp, marek: v.dyn.f.marek.maxHp };
      }
      // the version 2's sound (lot V8): the arena's roar, the duel's effects and the bout's piece of the band in its three layers (journal Passe SN10; the arena's
      // own page outside a game: `music=rival|finale`, the duel else), after the person's first gesture; N mutes
      const t = opts.params.get('time'), look = t === 'morning' || t === 'midday' || t === 'afternoon' ? t : 'night', m0 = opts.params.get('music');
      const piece: PieceId = opts.match?.piece ?? (m0 === 'rival' || m0 === 'finale' ? m0 : 'duel');
      void import('../audio/Sound').then((m) => {
        const snd = m.sound(); this.snd = snd as unknown as { duelEvent(e: unknown): void }; snd.setScene('arena', look, false, 1842, { bout: piece, maxHp, tiers: this.charge?.tiers.length ?? this.auto?.tiers, ...(opts.match?.empty ? { empty: true } : {}) });
        // mute: the player's key (the remapping, journal Passe RM2: mute is heard in the duel too)
        window.addEventListener('keydown', (e) => { if (!e.repeat && actsOf(e, 'duel').includes('mute')) snd.set({ muted: !snd.settings.muted }); });
      });
    }
    else this.sim = this.classic = new CombatSim(opts.match?.data as CombatData | undefined);
    this.renderer = new THREE.WebGLRenderer({ canvas: opts.canvas, antialias: false, powerPreference: 'high-performance', stencil: false, alpha: false });
    this.renderer.autoClear = false;
    this.renderer.info.autoReset = false;
    this.perf.attach(this.renderer.getContext() as WebGL2RenderingContext);
    this.post = new PostFX(this.renderer);
    const q = opts.params;
    if (q.has('gpuprof')) this.perf.gpu.enabled = true;
    // the player's graphics (journal Passe RG2, src/settings/), `fps=` first; nothing stored = today's a60, MSAA 4, the reflection at half
    followGraphics(this, q);
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
    // the reduced motion is the game's own setting, off by default, never the system's (the operator's rule of 2026-11-03; RG-5, journal Passe RG2)
    this.reducedMotion = reducedMotion();
    onSettings((s) => { this.reducedMotion = s.reducedMotion; });
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
    // the version 2's arena flies the tournament's heraldry (journal Passe VP3); today's arena keeps its fleurs, byte for byte
    setTournamentHeraldry(v2Rules(this.rules));
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
    this.set = buildArenaAtlas(seed, 5, this.foe, !!this.opts.forecourt);
    // DEV only: the combat sheets (?fighterdensity=combat: Ren and the opponent's seat drawn by their baked x3 sheets, src/lab/fighterDensity.ts, journal Passes
    // AA2 / RC1 / CX1); compiled out of production builds, absent = the arena as before
    if (import.meta.env.DEV && this.opts.params.has('fighterdensity')) this.densityTrial = await (await import('../lab/fighterDensity')).installFighterDensity(this.set, this.opts.params, this.foe);
    // the version 2's duel on the approved combat sheets (journal Passe CX2, the operator's CX-P1 « Ren et Marek ensemble »); `cast=generated` keeps the generated fighters, for comparison
    if (v2Rules(this.rules) && !this.opts.forecourt && !(import.meta.env.DEV && this.densityTrial) && this.opts.params.get('cast') !== 'generated') this.sheets = await (await import('./CombatCast')).installCombatCast(this.set, this.foe, this.opts.params);
    this.walkFrames = [...this.set.atlas.frames.keys()].filter((x) => x.startsWith('ren/side/walk.')).length;
    this.sprites = new SpriteRenderer(this.set.atlas, 96, (import.meta.env.DEV && this.densityTrial?.frame) || this.sheets?.frame || { w: CELL_W, h: CELL_H, foot: CELL_FOOT });
    this.sprites.charScale = CHAR_SCALE;
    this.sprites.protect.crowd = 0.35;
    if (import.meta.env.DEV && this.densityTrial) this.densityTrial.attach(this.sprites, this.camera, () => this.post.width);
    this.sheets?.attach(this.sprites);
    // by day the silhouette treatment (lit-side lift, crown rim, shadow side: uMoonCol, the sun) keeps the night's strength: scaled by the
    // moon's luminance over the sun's (journal Passe AD1)
    if (this.look) this.sprites.setEdgeGain(lum(NIGHT_MOON) / lum(this.look.sunCol));
    this.scene.add(this.sprites.group);
    this.scene.add(this.floor.mesh);
    if (fxOn(this.rules, this.opts.params)) this.combatFx = (await import('./fx/combatFx')).installCombatFx(this.scene, this.camera, this.opts.params, { foe: this.foe, guardReach: (who) => { const r = ((import.meta.env.DEV && this.densityTrial) || this.sheets) && this.set.reach[`${who}/block.0`]; return r ? r * PIXEL_WORLD * CHAR_SCALE : null; }, lights: this.lights, shake: (k) => { this.shake = Math.max(this.shake, k); }, timeScale: (k) => { this.timeScale = k; }, renderHeight: () => this.post.height });
    // a version 2 duel: the district's townsfolk on the stands (journal Passe PU1, the operator's sheet PU-1 to PU-8); `cast=generated` keeps today's spectators
    if (v2Rules(this.rules) && !this.opts.forecourt && !this.opts.match?.empty && this.opts.params.get('cast') !== 'generated') {
      this.stands = await (await import('./StandsCast')).installStands({ charScale: CHAR_SCALE, edgeGain: this.look ? lum(NIGHT_MOON) / lum(this.look.sunCol) : 1, shade: (await import('./CombatSheets')).shadeFor(this.opts.params.get('time')) });
      this.scene.add(this.stands.group);
    }
    // spectators on the tiers: the town's crowd archetypes, front view, idling and cheering in turn
    let k = 0;
    for (const st of this.stands || this.opts.match?.empty ? [] : this.arena.stands) {
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
    if (!this.opts.params.has('clean') && this.auto) {
      const a = this.opts.match?.auto, texts = (this.opts.match?.texts as AutoTexts | undefined) ?? (lang() === 'fr' ? AUTO_TEXTS_FR : AUTO_TEXTS_EN);
      this.hud = new AutoHud(this.auto, this.set.portraits, a?.names ?? { ren: 'Ren', marek: this.foe[0].toUpperCase() + this.foe.slice(1) }, (id) => autoActionName(id, texts), texts, parseTime(this.opts.params));
    } else if (!this.opts.params.has('clean')) {
      this.hud = this.dyn ? new DynamicHud(this.dyn, this.set.portraits, this.opts.match?.texts as DynTexts | undefined, parseTime(this.opts.params), this.charge ? { texts: this.opts.match ? (lang() === 'fr' ? CHARGE_TEXTS_FR : CHARGE_TEXTS_EN) : CHARGE_TEXTS_FR, tiers: this.charge.tiers } : null)
        : new ArenaHud(this.classic!, this.set.portraits, this.opts.match?.texts, parseTime(this.opts.params));
    }
    if (this.hud) {
      this.hud.onAction = (id, down) => this.action(id, down, 'hud');
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
    const w = window.innerWidth, h = window.innerHeight, pr = capRatio(w, h, Math.min(window.devicePixelRatio || 1, 2), this.resCap);
    this.post.setSize(w, h, pr);
    this.reflection.setSize(w * pr, h * pr);
    U.uResolution.value.set(this.post.width, this.post.height);
    this.applyCamera(0);
  }

  // ---------------------------------------------------------------- input
  /** a command from the keys, a gamepad or the action bar */
  action(id: string, down = true, from?: 'hud'): void {
    const s = this.sim;
    // the duel played by the computer: the attack's key ×2, the dodge's « Skip » (the player's keys, the remapping), the pause's the pause
    if (this.auto) {
      // a lesson of the first duel being read holds the bout (journal Passe LC5): neither ×2 nor « Skip » meanwhile, the HUD's buttons included
      if (!down || this.lesson) return;
      // ×2: the interface's click from the keys and the pad, as the HUD's button gives it by itself (lot 4, journal Passe LC6)
      if (id === 'attack' || id === 'speed') { if (!this.auto.over) { this.speed = this.speed > 1 ? 1 : 2; this.snd?.duelEvent({ type: 'speed', on: this.speed > 1, quiet: from === 'hud' }); } }
      else if (id === 'dodge' || id === 'skip') { if ((!this.paused || this.moment) && !this.auto.over && !this.skipFade) this.beginSkip(from === 'hud'); }
      else if (id === 'pause') { this.paused = !this.paused && !this.moment ? true : false; this.moment = false; this.hud?.still(false); }
      else if (id === 'settings') this.openSettings();
      else if (id === 'reset') { if (!this.opts.match) this.restart(); }
      return;
    }
    if (id === 'guard') { s.setGuard('ren', down); return; }
    // the version 2's attack: held, it charges; released, it launches the tier reached (src/combat/charge.ts)
    if (id === 'attack') { this.charge?.attack(down); return; }
    if (!down) return;
    if (id === 'dodge') s.react('ren', 'dodge');
    else if (id === 'reset') { if (!this.opts.match) this.restart(); }
    else if (id === 'pause') { this.paused = !this.paused && !this.moment ? true : false; this.moment = false; this.hud?.still(false); }
    else if (id === 'settings') this.openSettings();
    else s.command('ren', id);
  }

  /** the settings page over a paused duel of the version 2 (the operator's RG-2 « Depuis la pause du duel aussi », journal Passe RG2): Esc, the gamepad's
   *  Y or the pause's line; the duel stays paused under it, the image changes at once (src/settings/scene.ts), its keys go to the page alone */
  private settingsOpen = false;
  openSettings(): void {
    if (!(this.charge || this.auto) || !this.paused || this.moment || this.sim.over || this.settingsOpen) return;
    this.settingsOpen = true; document.body.classList.add('cdt-settings');
    void import('../ui/settings').then((m) => { const p = m.settingsPage({ inDuel: true, close: () => { this.settingsOpen = false; document.body.classList.remove('cdt-settings'); } }); document.body.appendChild(p.root); p.focus(); });
  }

  private bindInput(): void {
    if (this.opts.forecourt) {
      window.addEventListener('keydown', (e) => { if (!e.metaKey && !e.ctrlKey && !e.altKey && !(e.target instanceof HTMLInputElement)) this.walkKeys.add(keyId(e)); });
      window.addEventListener('keyup', (e) => this.walkKeys.delete(keyId(e)));
      window.addEventListener('blur', () => this.walkKeys.clear());
      return;
    }
    // the version 2's duel reads the player's keys (the remapping, journal Passe RM2: attack, guard, dodge, pause, today's V2_KEYS at the start; R, the
    // arena page's restart, and H, the HUD, give way to a key the player put there, RM-4); the other rules keep the prototype's keys (RM-1)
    const duelKeys = !!(this.charge || this.auto);
    const KEYS: Record<string, string> = duelKeys ? { r: 'reset' } : this.dyn ? dynKeys(this.dyn.D.loadout) : { '1': 'light', '2': 'heavy', '3': 't1', '4': 't2', '5': 't3', '6': 't4', a: 'dodge', b: 'guard', r: 'reset', ' ': 'pause' };
    window.addEventListener('keydown', (e) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || !this.ready || this.lesson || this.settingsOpen) return;
      const bound = duelKeys ? actsOf(e, 'duel') : [], k = e.key.toLowerCase(), m = bound.find((a) => a !== 'mute') ?? (bound.length ? undefined : KEYS[k]);
      if (m) { e.preventDefault(); this.action(m, true); this.hud?.flash(m); }
      else if (k === 'h' && !bound.length) this.hudVisible = !this.hudVisible;
      else if (k === 'escape') this.openSettings();
    });
    window.addEventListener('cdt-open-settings', () => this.openSettings());
    window.addEventListener('keyup', (e) => {
      if (duelKeys) { const a = actsOf(e, 'duel'); if (a.includes('attack')) this.action('attack', false); if (a.includes('guard')) this.action('guard', false); }
      else if (e.key.toLowerCase() === 'b') this.action('guard', false);
    });
    window.addEventListener('blur', () => { this.action('guard', false); if (this.charge) this.action('attack', false); });
    // the version 2's charged duel reads the shared gamepad (the operator's MN-5 « Les deux : X, B, A et les gâchettes en double », journal Passe MN2):
    // whichever pad was used last, X or RT the attack held, B or LT the guard held, A the dodge, Start the pause, View the page's restart; the
    // bands before and after the bout answer it as pages; the player's hits make it rumble (MN-9). Every other arena keeps pollPad, as before
    if (duelKeys) void import('../input/PadInput').then((m) => {
      this.pad = m.installPad({ duel: (id, down) => { this.action(id, down); if (down) this.hud?.flash(id); }, sound: () => import('../audio/Sound').then((s) => s.sound()) });
    });
  }
  /** the shared gamepad of a version 2 duel (src/input/PadInput.ts) */
  private pad: { duelEvents(evs: ReadonlyArray<{ type: string } & Record<string, unknown>>): void } | null = null;

  private padPrev: boolean[] = [];
  /** gamepad (the prototype's mapping): A dodge, B guard, X / Y light / heavy, shoulders and triggers the techniques, Start pause, Back reset */
  private pollPad(): void {
    // the version 2's duels (the charged one, the one played by the computer): the shared gamepad reads them (bindInput); read here too, a press came twice
    // (journal Passe LC4: Start paused and resumed at once, A asked « Skip » twice)
    if (this.charge || this.auto) return;
    const pads = typeof navigator !== 'undefined' && navigator.getGamepads ? navigator.getGamepads() : [];
    const p = pads && pads[0]; if (!p) return;
    const PAD: Record<number, string> = this.charge ? V2_PAD : this.dyn ? dynPad(this.dyn.D.loadout) : { 0: 'dodge', 1: 'guard', 2: 'light', 3: 'heavy', 4: 't1', 5: 't2', 6: 't3', 7: 't4', 9: 'pause', 8: 'reset' };
    for (const [b, id] of Object.entries(PAD)) {
      const i = +b, down = !!p.buttons[i]?.pressed;
      if (down && !this.padPrev[i]) { this.action(id, true); this.hud?.flash(id); }
      if (!down && this.padPrev[i] && (id === 'guard' || id === 'attack')) this.action(id, false);
      this.padPrev[i] = down;
    }
  }

  /** « Skip »'s curtain under way: its time on the arena's clock, whether the duel has reached its K.O. under it */
  private skipFade: { t: number; done: boolean; el: HTMLDivElement | null } | null = null;
  private beginSkip(quiet = false): void {
    let el: HTMLDivElement | null = null;
    if (typeof document !== 'undefined') {
      el = document.createElement('div');
      el.className = 'ar-skip-fade'; el.setAttribute('aria-hidden', 'true');
      el.style.cssText = 'position:fixed;inset:0;z-index:2147482000;background:var(--ds-ink,#0b0d14);opacity:0;pointer-events:none';
      document.body.appendChild(el);
    }
    this.skipFade = { t: 0, done: false, el };
    // the music goes down with the curtain (the page's own fade, SA-15), the K.O. heard once the duel has reached it under the black (lot 4, journal Passe LC6)
    this.snd?.duelEvent({ type: 'skip', secs: SKIP_FADE.down, quiet });
  }
  /** the curtain's step: down, the duel skipped under the black (its K.O. told), then lifted (the fades kept with the reduced motion, RG-5) */
  private stepSkip(dt: number): void {
    const c = this.skipFade; if (!c) return;
    c.t += dt;
    const S = SKIP_FADE;
    if (!c.done && c.t >= S.down) {
      c.done = true;
      this.paused = false; this.moment = false; this.hud?.still(false);
      this.auto?.skip(); if (this.auto) this.onEvents(this.auto.drain());
    }
    const a = c.t < S.down ? smooth(c.t / S.down) : c.t < S.down + S.hold ? 1 : 1 - smooth((c.t - S.down - S.hold) / S.up);
    if (c.el) c.el.style.opacity = a.toFixed(3);
    if (c.t >= S.down + S.hold + S.up) this.endSkip();
  }
  private endSkip(): void { this.skipFade?.el?.remove(); this.skipFade = null; }

  restart(): void {
    this.sim.reset();
    this.onEvents(this.sim.drain());
    this.paused = false; this.moment = false; this.hud?.still(false);
  }

  // ---------------------------------------------------------------- simulation -> presentation
  /** the version 2's sound (lot V8, src/audio/Sound.ts): loaded on demand by a version 2 duel only; today's arena makes none */
  snd: { duelEvent(e: unknown): void } | null = null;

  private onEvents(evs: Array<CombatEvent | DynEvent | ReplayEvent>): void {
    this.combatFx?.onEvents(evs, this.fighters, this.charge?.tiers.length ?? this.auto?.tiers ?? 0);
    this.stands?.onEvents(evs as unknown as Array<{ type: string } & Record<string, unknown>>, this.sim.t);
    this.pad?.duelEvents(evs as unknown as Array<{ type: string } & Record<string, unknown>>);
    if (!this.skipFade) this.onDuelEvents?.(evs as unknown as Array<{ type: string } & Record<string, unknown>>, this.sim.t);
    for (const e of evs as Array<CombatEvent | DynEvent>) {
      this.snd?.duelEvent(e);
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
      // the new rules' moments (DynamicSim only): a gauge breaks, the player is pushed back, a skill's effect takes hold
      else if (e.type === 'break') {
        const p = this.pres[e.who], a = this.fighters[e.who];
        p.knock = -0.5; p.flash = 1; this.shake = Math.max(this.shake, 1.2); this.spawnFx('ember', a, e.who); this.spawnFx('guard', a, e.who);
        if (this.hitLight) { this.hitLight.pos.set(a.pos.x - (e.who === 'ren' ? -0.3 : 0.3), 1.45, 1.2); this.hitLight.scale = this.hitLight.targetScale = 1; }
        this.cheer(0.8);
      } else if (e.type === 'pushed') { this.pres[e.who].knock = -0.35; this.shake = Math.max(this.shake, 0.3); }
      // the version 2: each tier the charge reaches lights the player a moment
      else if ((e as { type: string }).type === 'chargeTier') this.pres.ren.flash = Math.max(this.pres.ren.flash, 0.45);
      else if (e.type === 'effect') { this.pres[e.who].flash = 0.6; this.spawnFx(e.family === 'defensive' ? 'guard' : 'spark', this.fighters[e.who], e.who === 'ren' ? 'marek' : 'ren'); }
      else if (e.type === 'reset') {
        this.koT = -1; this.shake = 0; this.push = 0; this.endSkip();
        for (const p of Object.values(this.pres)) { p.off = p.knock = p.flash = p.guardHit = 0; }
        for (const f of this.fx) f.act.hidden = true;
        this.fx = [];
      }
    }
    if (this.hud instanceof AutoHud) this.hud.onEvents(evs as ReplayEvent[]);
    else if (this.hud instanceof DynamicHud) this.hud.onEvents(evs as DynEvent[], this.dyn!);
    else this.hud?.onEvents(evs as CombatEvent[], this.classic!);
  }

  /** a share of the stands react (deterministic: by seat and sim time) */
  private cheer(amount: number): void {
    const t = this.sim.t;
    this.fanCheer.forEach((_, i) => { const h = Math.abs(Math.sin(i * 12.9898 + t * 7.31)) % 1; if (h < amount) this.fanCheer[i] = t + h * 0.3; });
  }

  private spawnFx(kind: string, tgt: Actor, who: FighterId): void {
    if (this.combatFx) return;
    const dir = who === 'ren' ? 1 : -1;   // toward the attacker
    const act: Actor = { id: 900 + this.fx.length, spec: 'fx', role: 'fx', detail: 'hero', pos: new THREE.Vector3(tgt.pos.x + dir * 0.32, 0.32, 0.45), facing: 'side', dir: 'side', flip: kind === 'guard' ? who === 'ren' : false, anim: `${kind}.0` as Anim, t: 0, speed: 0, tint: [1, 1, 1], scale: 1, height: 1, radius: 0.1, noShadow: true };
    this.fx.push({ act, kind, age: 0, frames: 3, step: kind === 'guard' ? 0.07 : 0.055 });
  }

  /** each fighter's frame, place and tint from its simulation state */
  /** Ren's charge as the sheets draw it: the three buttons' hold, or the duel played by the computer's charge on the timeline */
  private chargeView(): { held: boolean; reached: number; waiting: number } | null { return this.charge?.view() ?? this.auto?.chargeView() ?? null; }

  private presentFighters(dt: number): void {
    const s = this.sim, cv = this.chargeView();
    for (const id of ['ren', 'marek'] as FighterId[]) {
      const f = s.f[id], a = this.fighters[id], p = this.pres[id], an = f.anim!, before = p.off;
      // under the new rules, today's clips on the new moments (dynamicView.ts: skills, the preparation held on the first frame)
      const dl = !!(this.dyn || this.auto);
      let clip = dl ? dynClip(an.name) : an.name;
      const clips = this.set.clips[id];
      if (s.over && f.state !== 'down') clip = 'victory';
      if (!clips[clip]) clip = id === 'marek' || f.ap >= 2 ? 'ready' : 'idle';
      // the version 2's charge, shown with today's images (the operator's brief, lot V1): the heavy attack's preparation held while the
      // attack is held and the player is free (not guarding: the guard's brace shows then)
      const charging = id === 'ren' && !!cv?.held && f.state === 'idle' && !f.guarding && !!clips.heavy;
      if (charging) clip = 'heavy';
      const def = clips[clip], n = def.frames.length;
      let fi = charging ? 0 : dl ? dynClipFrame(clip === dynClip(an.name) ? an.name : clip, clip, n, an, def.loop ?? 0) : clipFrame(clip, n, an.t, an.impactAt ?? 0, def.loop ?? 0);
      if (clip === 'block' && p.guardHit > 0) fi = 1;
      a.anim = `${clip}.${fi}` as Anim;
      // lunges: an attack closes the gap so its blade lands on the opponent at the impact; a dodge leaps back; hits knock back
      const other = id === 'ren' ? 'marek' : 'ren', gap = Math.abs(HOME[other] - HOME[id]);
      if (ATTACKS.has(clip) && an.impactAt !== undefined) {
        // a rival's offensive skill plays its sheet's own strike under the heavy's name (v2duel.ts, CombatSheets.ts)
        const strike = (f as { act?: { def: { kind: string } } | null }).act?.def.kind === 'skill' ? this.set.reach[`${id}/skillOff.2`] : undefined;
        const reach = (strike ?? this.set.reach[`${id}/${clip}.${IMPACT_FRAME[clip]}`] ?? 20) * PIXEL_WORLD * CHAR_SCALE;
        const A = Math.max(0, Math.min(2.4, gap - reach - 0.12)), ia = an.impactAt, t = an.t;
        // the heavy closes the gap only in its last 0.16 s (gap and telegraph stay open through the charge, critique n° 3 of Passe P2)
        // under the new rules a skill's lunge waits for the end of its preparation
        const pr = an.prep ?? 0, t0 = clip === 'heavy' ? Math.max(0, ia - 0.16) : pr > 0 ? pr + (ia - pr) * 0.35 : ia * 0.35;
        if (this.auto) {
          // the duel played by the computer: a lunge never pulls the body back (an enchaînement's next blow, a blow after a flinch keep it forward) and the
          // body settles while its run-up has not begun (a rival's telegraph holds its first frame)
          const v = t >= t0 && t <= ia + 0.12 ? A * smooth((t - t0) / Math.max(0.05, ia - t0)) : 0, settle = p.off * Math.exp(-dt * (p.off < 0 ? 4 : 5));
          p.off = t <= ia + 0.12 ? Math.max(settle, v) : settle;
        } else if (t <= ia + 0.12) p.off = A * smooth((t - t0) / Math.max(0.05, ia - t0));
        else p.off *= Math.exp(-dt * 5);
      } else if (clip === 'dodge') p.off = Math.min(p.off, -1.05 * smooth(an.t / 0.16));
      else p.off *= Math.exp(-dt * (p.off < 0 ? 4 : 5));
      if (this.auto && dt > 0) { const d = p.off - before, L = AUTO_BODY_SPEED * dt; if (Math.abs(d) > L) p.off = before + Math.sign(d) * L; }
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
    if (import.meta.env.DEV && this.densityTrial) this.densityTrial.present(this.fighters, this.time, s, (this.charge?.view() ?? null) as never);
    this.sheets?.present(this.fighters, this.time, s, cv);
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
    this.combatFx?.present(dt, this.fighters, (this.charge?.view() ?? this.auto?.chargeFx() ?? null) as ReturnType<ChargedDuel['view']> | null);
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
    this.combatFx?.pose(P);
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
    const k = this.walkKeys, ix = (actHeld(k, 'right') ? 1 : 0) - (actHeld(k, 'left') ? 1 : 0), iz = (actHeld(k, 'down') ? 1 : 0) - (actHeld(k, 'up') ? 1 : 0);
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
    this.stepSkip(dt);
    if (!this.paused) {
      this.acc += dt * this.timeScale * this.speed;
      const step = this.sim.D.dt;
      let n = 0;
      // a lesson of the first duel opened by a step holds the duel on that step (journal Passe LC5): no step after it
      while (!this.paused && this.acc >= step && n++ < 24) { this.sim.step(step); this.onEvents(this.sim.drain()); this.acc -= step; }
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
    this.stands?.update(this.sim.t, this.lights, this.camera, this.keyDir);
    this.particles.update(pdt, this.time, this.camera, this.post.height, this.lights, null);
    if (this.hud instanceof AutoHud) this.hud.update(this.auto!.hud(), this.hudVisible, this.paused && !this.moment, this.speed > 1, this.auto!.over);
    else if (this.hud instanceof DynamicHud) this.hud.update(this.dyn!, this.assist, this.hudVisible, this.paused && !this.moment, this.charge ? chargeHudModel(this.charge.view()) : undefined);
    else this.hud?.update(this.classic!, this.assist, this.hudVisible, this.paused && !this.moment);
    // an official bout: told once the KO has had its moment on screen
    const m = this.opts.match;
    if (m?.onOver && this.sim.over && !this.told && this.koT >= 0 && this.sim.t - this.koT >= 1.6) {
      this.told = true;
      const f = this.sim.f, r = this.auto?.result;
      // the duel played by the computer: its own result, as the game decided it (the replay ends on it)
      if (r) m.onOver({ winner: this.auto!.winner, hp: { ren: r.hp[0], marek: r.hp[1] }, maxHp: { ren: r.maxHp[0], marek: r.maxHp[1] }, finisher: r.finisher, t: this.sim.t });
      else m.onOver({ winner: f.ren.state === 'down' ? 'marek' : 'ren', hp: { ren: f.ren.hp, marek: f.marek.hp }, maxHp: { ren: f.ren.maxHp, marek: f.marek.maxHp }, finisher: this.finisher, t: this.sim.t });
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
    if (this.auto) return this.jumpAuto(name);
    const v2p = this.charge ? V2_PRESETS[name] : undefined;
    const p = v2p ?? (this.dyn ? DYN_PRESETS[name] : PRESETS[name]); if (!p) return false;
    this.sim.reset(); this.hud?.still(false); this.onEvents(this.sim.drain());
    const dt = this.sim.D.dt;
    const onStep = () => {
      this.onEvents(this.sim.drain());
      this.presentFighters(dt); this.presentFans(); this.presentFx(dt); this.updateDynamicLights(); this.applyCamera(dt);
      this.particles.update(dt, this.time, this.camera, this.post.height, this.lights, null);
    };
    if (v2p) runV2Script(this.charge!, v2p.script, onStep);
    else if (this.dyn) runDynScript(this.dyn, DYN_PRESETS[name].script, onStep);
    else runScript(this.classic!, PRESETS[name].script, () => true, onStep);
    this.paused = true; this.moment = true; this.hud?.still(true);
    this.update(0);
    return true;
  }

  renderOnce(): void { this.update(0); this.render(); }

  /** the duel played by the computer's moments (captures and reviews): a time of its script, every step before it applied without sounds or effects, then held */
  private jumpAuto(name: string): boolean {
    const a = this.auto!, m = AUTO_MOMENTS[name];
    if (!m) return false;
    const t = m(a);
    if (t < 0) return false;
    a.seek(t); this.onEvents(a.drain()); this.koT = a.over ? a.t : -1;
    this.paused = true; this.moment = true; this.hud?.still(true);
    this.presentFighters(0); this.update(0);
    return true;
  }

  /** the scripted moments `jump` knows under this page's rules */
  presetNames(): string[] { if (this.auto) return Object.keys(AUTO_MOMENTS); return this.charge ? [...Object.keys(V2_PRESETS), ...Object.keys(DYN_PRESETS)] : Object.keys(this.dyn ? DYN_PRESETS : PRESETS); }

  snapshot(): Record<string, unknown> {
    const r = this.renderer.info, p = this.perf, gpu = p.gpu.enabled ? { ...p.gpu.ms } : undefined;
    const bytes = (this.lib?.textureBytes() ?? 0) + (this.set ? this.set.atlas.width * this.set.atlas.height * 8 : 0) + this.post.textureBytes() + this.reflection.textureBytes() + this.shadow.size * this.shadow.size * 8;
    return {
      fps: p.fps, frameMs: p.frameMs, cpuMs: p.cpuMs, triangles: p.triangles, geometries: r.memory.geometries, textures: r.memory.textures, textureMB: bytes / 1048576, generatorMs: this.buildMs,
      gpu, gpuMs: gpu ? p.gpu.total() : undefined,
      t: +this.sim.t.toFixed(3), hash: this.sim.hash(), ren: { hp: this.sim.f.ren.hp, ap: this.sim.f.ren.ap, state: this.sim.f.ren.state, anim: this.fighters.ren.anim }, marek: { hp: this.sim.f.marek.hp, state: this.sim.f.marek.state, anim: this.fighters.marek.anim },
      lights: this.lights.sources.length, lightsOnScreen: this.lights.active, fans: this.fans.length, ...(this.stands ? { stands: this.stands.info } : {}), instances: this.arena?.stats.instances,
      atlas: this.set ? `${this.set.atlas.width}x${this.set.atlas.height} (${this.set.atlas.frameCount} cells)` : null, drawCalls: p.drawCalls, frameTriangles: p.triangles, arenaTriangles: this.arena?.stats.triangles, resolution: `${this.post.width}x${this.post.height}`,
      pose: this.pose, assist: this.assist,
      ...(this.charge ? { charge: this.charge.view() } : {}),
      ...(this.auto ? { auto: { end: this.auto.end, winner: this.auto.winner, over: this.auto.over, speed: this.speed, hud: this.auto.hud() } } : {}),
      ...(this.dyn ? { rules: this.rules, resist: { ren: +this.dyn.f.ren.resist.toFixed(2), marek: +this.dyn.f.marek.resist.toFixed(2) }, phase: this.dyn.inSequence() ? 'defense' : 'open' } : {}),
    };
  }
}

/** the duel played by the computer's scripted moments: a time of its script (-1 when the duel has none) */
const AUTO_MOMENTS: Record<string, (a: AutoReplay) => number> = {
  start: () => 0.05,
  renCharge: (a) => { const t = a.timeOf((e) => e.who === 'ren' && e.ev === 'charge' && e.act !== 'light'); return t < 0 ? -1 : t + 0.5; },
  foeCharge: (a) => { const e = a.result.log!.find((x) => x.who !== 'ren' && x.ev === 'charge' && x.act !== 'm_light' && x.act !== 'm_combo' && (x.at ?? 0) - x.t > 1); return e ? (e.t + (e.at ?? e.t)) / 2 : -1; },
  renSkill: (a) => a.timeOf((e) => e.who === 'ren' && e.ev === 'hit' && e.act !== 'light'),
  foeSkill: (a) => a.timeOf((e) => e.who !== 'ren' && e.ev === 'hit' && e.act !== 'm_light' && e.act !== 'm_combo'),
  ward: (a) => { const t = a.timeOf((e) => e.ev === 'ward' || e.ev === 'boost'); return t < 0 ? -1 : t + 0.1; },
  dodge: (a) => { const t = a.timeOf((e) => e.ev === 'dodged'); return t < 0 ? -1 : t + 0.08; },
  guard: (a) => { const t = a.timeOf((e) => e.ev === 'guarded'); return t < 0 ? -1 : t + 0.08; },
  break: (a) => { const t = a.timeOf((e) => e.ev === 'break'); return t < 0 ? -1 : t + 1; },
  mid: (a) => a.end / 2,
  ko: (a) => a.end + 1.2,
};

function smooth(x: number): number { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); }
