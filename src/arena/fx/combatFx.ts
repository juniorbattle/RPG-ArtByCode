/** The version 2's duel effects, in the manner of RPGThreeJS (the operator's decisions of journal Passes FX2 / FX4, H-7 « Tâche à part, derrière flags.v2 »): live
 *  geometry at full resolution, white-hot cores that bloom, light on the arena, recipes written per action. Reached only through the dynamic import
 *  `ArenaApp` makes for a duel under the version 2's rules (`fxOn`, dynamicView.ts): today's arena never loads this module, `fx=off` keeps the former frames.
 *  It binds the engine to the arena: the events of the duel pick the recipes, and the hooks of the engine land on this renderer's own means (LightRig,
 *  the arena's shake and framing, two overlays for the flash and the speed lines). No slow motion but the K.O.'s.
 *  DEV server only, `window.__fx`: `play(recipe, who)`, `step(seconds)`, `clear()`, `stress()` (the cost's worst case: the heaviest recipes one after
 *  another), `recipes`. */
import * as THREE from 'three';
import { parseTime } from '../../atmosphere/DayState';
import type { LightRig, LightSource } from '../../atmosphere/LightRig';
import type { Actor } from '../../characters/SpriteRenderer';
import type { ChargeView } from '../../combat/charge';
import type { FighterId } from '../CombatSim';
import { FX_EXPOSURE, FxEngine, type FxHooks } from './FxEngine';
import { FxDirector, type FxPlayContext, type FxUnitRef } from './FxDirector';
import { RECIPES, blowRecipe, chargeLevel, effectRecipe, type FxRecipe } from './fxRecipes';

/** the figure's height (m), and how far before a fighter the blades meet on generated art (`cast=generated`): Ren holds his sword close, Marek's art at arm's length, Vessa on Ren's clips
 *  (the other rivals wear Marek's there, FighterArt's `FOES`); on the baked sheets, what the guard's frame reaches (`guardReach`) */
const FIGURE_H = 2.75;
const RENS_GUARD = 0.7, MAREKS_GUARD = 1;
export const guardContact = (foe: string): Record<FighterId, number> => ({ ren: RENS_GUARD, marek: foe === 'vessa' ? RENS_GUARD : MAREKS_GUARD });
/** a fighter on a baked sheet: how far its guard's frame reaches, measured on the sheet (m), else its art's value */
const measured = (foe: string, guardReach: FxArena['guardReach']): Record<FighterId, number> => { const c = guardContact(foe); return { ren: guardReach('ren') ?? c.ren, marek: guardReach('marek') ?? c.marek }; };
/** the effects' exposure, the night's stronger bloom on a dark ground, the day's on a light one */
const EXPOSURE = { night: 0.5, day: 0.72 };
/** the charge held: a breath of motes every so many seconds */
const HOLD_BREATH = 0.6;
const STRESS = ['heavy', 'm_ironfall', 't4', 'break', 'guardHeavy', 'charge3', 'ko'];

/** what the effects reach of the arena */
export interface FxArena {
  /** who sits in the opponent's seat */
  foe: string;
  /** how far a fighter's guard reaches on its baked sheet (m), null on generated art */
  guardReach(who: FighterId): number | null;
  lights: LightRig;
  shake(amount: number): void;
  /** the simulation's speed (the K.O.'s slow motion: the duel is over) */
  timeScale(scale: number): void;
  renderHeight(): number;
}

export interface CombatFx {
  /** the duel's events: what plays */
  onEvents(evs: ReadonlyArray<{ type: string } & Record<string, any>>, fighters: Record<FighterId, Actor>, tiers: number): void;
  /** every presentation step */
  present(dt: number, fighters: Record<FighterId, Actor>, charge: ChargeView | null): void;
  /** the framing's push onto a blow */
  pose(p: { dist: number; tx: number; ty: number }): void;
}

interface Slot { src: LightSource; t: number; dur: number }

function overlay(css: string): HTMLDivElement {
  const el = document.createElement('div');
  el.style.cssText = `position:fixed;inset:0;pointer-events:none;opacity:0;z-index:4;${css}`;
  document.body.append(el);
  return el;
}

export function installCombatFx(scene: THREE.Scene, camera: THREE.Camera, params: URLSearchParams, arena: FxArena): CombatFx {
  FX_EXPOSURE.value = parseTime(params) ? EXPOSURE.day : EXPOSURE.night;
  const contact = measured(arena.foe, arena.guardReach);
  const flashEl = overlay(''), linesEl = overlay('-webkit-mask:radial-gradient(circle,transparent 38%,#000 72%);mask:radial-gradient(circle,transparent 38%,#000 72%)');
  const slots: Slot[] = [0, 1].map(() => {
    const src = arena.lights.add({ pos: [0, -5, 0], color: [1, 1, 1], intensity: 2, radius: 8, kind: 'steady', priority: 11 }, 'fx', 0);
    src.scale = src.targetScale = 0;
    return { src, t: 0, dur: 0 };
  });
  let flash = { t: 0, dur: 0, peak: 0 }, lines = { t: 0, dur: 0 }, punch = { t: 0, dur: 0, x: 0, amount: 0 }, slowLeft = 0, fxScale = 1, holdIn = 0, stress = -1, stressIn = 0;
  const hooks: FxHooks = {
    shake: (magnitude) => arena.shake(magnitude),
    flash: (color, opacity, duration = 0.18) => { flashEl.style.background = color; flash = { t: 0, dur: duration, peak: opacity }; },
    light: (position, color, intensity, duration, distance) => {
      const s = slots.reduce((a, b) => (a.dur <= 0 ? a : b.dur <= 0 ? b : a.t / a.dur > b.t / b.dur ? a : b));
      s.src.pos.copy(position); s.src.color.set(color); s.src.intensity = Math.min(2.8, intensity / 7); s.src.radius = distance * 0.8;
      s.t = 0; s.dur = duration;
    },
    slowmo: (scale, duration) => { fxScale = scale; slowLeft = duration; arena.timeScale(scale); },
    speedLines: (duration, color) => {
      linesEl.style.background = `repeating-conic-gradient(${color} 0 0.5deg,transparent 0.5deg 5deg,${color} 5deg 5.3deg,transparent 5.3deg 11deg)`;
      lines = { t: 0, dur: duration };
    },
    punch: (point, duration, hold) => { punch = { t: 0, dur: duration, x: point.x, amount: hold ? 1.5 : 1 }; },
  };
  const engine = new FxEngine(scene, camera, hooks), director = new FxDirector(engine);
  engine.reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  // drawn once under the loading screen (the boot's frame), hidden at the first step
  let warm = true;
  engine.warm(new THREE.Vector3(0, -3, 0));
  const unit = (a: Actor): FxUnitRef => ({ position: a.pos, height: FIGURE_H });
  const blow = (r: FxRecipe, F: Record<FighterId, Actor>, to: FighterId) => director.play(r, { source: unit(F[to === 'ren' ? 'marek' : 'ren']), target: unit(F[to]), contact: contact[to] });
  const self = (r: FxRecipe, a: Actor) => { const c: FxPlayContext = { source: unit(a), target: unit(a) }; director.play(r, c); };
  let fighters: Record<FighterId, Actor> | null = null;

  const advance = (dt: number, charge: ChargeView | null, F: Record<FighterId, Actor>) => {
    if (slowLeft > 0) { slowLeft -= dt; if (slowLeft <= 0) { fxScale = 1; arena.timeScale(1); } }
    engine.pointScale = arena.renderHeight() * 0.83;
    engine.update(dt * fxScale);
    // the charge held breathes, at the level of the tier a release launches (or of the one that waits, V2-2)
    const idx = charge ? (charge.held ? charge.launch : charge.waiting) : -1, level = charge ? chargeLevel(idx, charge.tiers.length) : 0;
    if (level > 0) { holdIn -= dt; if (holdIn <= 0) { holdIn = HOLD_BREATH; self(RECIPES[`hold${level}`], F.ren); } } else holdIn = 0;
    for (const s of slots) {
      if (s.dur <= 0) continue;
      s.t += dt * fxScale;
      const k = s.t / s.dur, v = k >= 1 ? 0 : k < 0.12 ? k / 0.12 : Math.pow(1 - (k - 0.12) / 0.88, 1.6);
      s.src.scale = s.src.targetScale = v;
      if (k >= 1) s.dur = 0;
    }
    if (flash.dur > 0) { flash.t += dt; const k = flash.t / flash.dur; flashEl.style.opacity = String(k >= 1 ? 0 : flash.peak * (1 - k)); if (k >= 1) flash.dur = 0; }
    if (lines.dur > 0) { lines.t += dt; const k = lines.t / lines.dur; linesEl.style.opacity = String(k >= 1 ? 0 : 0.5 * (1 - k * k)); linesEl.style.transform = `rotate(${Math.floor(lines.t * 30) * 7}deg) scale(1.6)`; if (k >= 1) lines.dur = 0; }
    if (punch.dur > 0) { punch.t += dt; if (punch.t >= punch.dur) punch.dur = 0; }
  };

  const fx: CombatFx = {
    onEvents(evs, F, tiers) {
      for (const e of evs) {
        if (e.type === 'impact') {
          const to = e.to as FighterId, heavy = e.kind === 'heavy' || e.damage >= 20;
          if (e.result === 'hit') blow(blowRecipe(e.action, e.kind, e.from), F, to);
          else if (e.result === 'guarded') blow(RECIPES[heavy ? 'guardHeavy' : 'guard'], F, to);
          else if (e.result === 'guardbreak') blow(RECIPES.break, F, to);
        } else if (e.type === 'break') blow(RECIPES.break, F, e.who);
        else if (e.type === 'ko') blow(RECIPES.ko, F, e.who);
        else if (e.type === 'effect') self(effectRecipe(e.action, e.family), F[e.who as FighterId]);
        else if (e.type === 'chargeTier') { const level = chargeLevel(e.idx, tiers); if (e.open && level > 0) director.play(RECIPES[`charge${level}`], { source: unit(F.ren), target: unit(F.marek) }); }
        else if (e.type === 'chargeRelease') { if (e.ok && e.idx >= 1) self(RECIPES.release, F.ren); }
        else if (e.type === 'reset') { engine.clear(); flash.dur = lines.dur = punch.dur = 0; flashEl.style.opacity = linesEl.style.opacity = '0'; slowLeft = 0; fxScale = 1; arena.timeScale(1); for (const s of slots) { s.dur = 0; s.src.scale = s.src.targetScale = 0; } }
      }
    },
    present(dt, F, charge) {
      fighters = F;
      if (warm) { warm = false; engine.settle(); }
      if (import.meta.env.DEV && stress >= 0) {
        dt = 1 / 60; stressIn -= dt;
        if (stressIn <= 0) { stressIn = 0.3; const r = RECIPES[STRESS[stress++ % STRESS.length]]; if (r.id.startsWith('charge')) director.play(r, { source: unit(F.ren), target: unit(F.marek) }); else blow(r, F, 'marek'); }
      }
      advance(dt, charge, F);
    },
    pose(p) {
      if (punch.dur <= 0) return;
      const k = punch.t / punch.dur, e = (k < 0.14 ? k / 0.14 : 1 - (k - 0.14) / 0.86) * punch.amount;
      p.dist -= 1.5 * e; p.tx += punch.x * 0.12 * e; p.ty -= 0.1 * e;
    },
  };
  if (import.meta.env.DEV) Object.assign(window, { __fx: {
    recipes: Object.keys(RECIPES),
    /** a recipe by hand, on the fighter it lands on (the charge's and a fighter's own on that fighter) */
    play: (id: string, who: FighterId = 'marek') => { const r = RECIPES[id]; if (!r) throw new Error(`no recipe "${id}"`); if (fighters) { if (/^(charge|hold|d1|s1|k_iron|k_parry|k_cry|k_focus|release)/.test(id)) self(r, fighters[who]); else blow(r, fighters, who); } },
    /** fixed steps, for captures */
    step: (seconds: number) => { if (!fighters) return; for (let t = 0; t < seconds - 1e-6; t += 1 / 120) advance(1 / 120, null, fighters); },
    clear: () => { engine.clear(); stress = -1; },
    stress: () => { stress = 0; },
    active: () => engine.activeCount,
  } });
  return fx;
}
