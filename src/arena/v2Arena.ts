import { DynamicSim, type DynData } from '../combat/dynamic';
import { ChargedDuel, type ChargeTier, type ChargeView } from '../combat/charge';
import { v2DuelData, type V2Duel } from '../combat/v2duel';
import { tuneDyn } from './dynamicView';
import type { DynPreset } from './DynPresets';

/** The arena's side of the version 2's duel (lot V1, journal Passe V1): `?scene=arena&v2=1` (Ren against Marek, the opponents of C3), or the
 *  bout of a version 2 game (its sheet's data and tiers). The three buttons (the operator's decision AV-5): attack (held: the charge), guard
 *  (held), dodge; `&input=keys` keeps the C2 command for comparing (keys 1-6, the same opponent and levels: AV-5, « l'ancien schéma gardé pour
 *  comparer »). Pure functions and data the tests run in Node. */

export type V2Input = 'charge' | 'keys';
export const v2Input = (params: URLSearchParams): V2Input => (params.get('input') === 'keys' ? 'keys' : 'charge');

/** the scene page's duel: Ren against Marek, as `?scene=arena` stages it, under the version 2 (the prototype's French names kept) */
export function sceneV2Duel(input: V2Input): V2Duel {
  return v2DuelData('marek', { seed: 1337, playerName: 'Ren', opponentName: 'Marek', input });
}

export interface V2ArenaDuel { dyn: DynamicSim; charge: ChargedDuel | null; tiers: ChargeTier[] }
/** the page's simulation: the charged duel (three buttons), or the C2 command on the same data (`input=keys`); `dyn=` the trial's numbers */
export function makeV2Duel(params: URLSearchParams, match?: { data: DynData; tiers?: ChargeTier[] }): V2ArenaDuel {
  const input = v2Input(params), base = match ? { data: match.data, tiers: match.tiers ?? [] } : sceneV2Duel(input);
  const data = tuneDyn(base.data, params.get('dyn'));
  if (input === 'keys') return { dyn: new DynamicSim(data), charge: null, tiers: base.tiers };
  const charge = new ChargedDuel(data, base.tiers);
  return { dyn: charge.sim, charge, tiers: base.tiers };
}

/** the keyboard of the three buttons: J (or 1) attack, held to charge; K (or B) guard, held; L (or A) dodge; R restart, Space pause. The attack
 *  key is none of the forecourt's walking keys (WASD, the arrows: the brief's « la touche d'attaque ne doit pas entrer en conflit avec la
 *  marche du parvis ») */
export const V2_KEYS: Record<string, string> = { j: 'attack', '1': 'attack', k: 'guard', b: 'guard', l: 'dodge', a: 'dodge', r: 'reset', ' ': 'pause' };
/** the keys released that end a hold: the attack (the release launches its tier) and the guard */
export const V2_HELD: Record<string, string> = { j: 'attack', '1': 'attack', k: 'guard', b: 'guard' };
/** the gamepad: X attack (held), B guard (held), A dodge, Start pause, Back reset (the stick walks: no conflict) */
export const V2_PAD: Record<number, string> = { 2: 'attack', 1: 'guard', 0: 'dodge', 9: 'pause', 8: 'reset' };

// ------------------------------------------------------------------------------------------------ the HUD's reading of the charge

export type TierState = 'reached' | 'launch' | 'next' | 'ahead' | 'locked';
export interface ChargeHudModel {
  held: boolean;
  /** 0..100: the charge toward the next tier (100 past the last one) */
  toNext: number;
  tiers: Array<{ id: string; at: number; ap: number; state: TierState }>;
  /** the tier a release launches now */
  launch: string;
}

/** what the tier strip shows: each tier reached, the one a release would launch, the next one and how far the charge is from it, the tiers
 *  whose action points are missing (locked: they do not open, AV-6) */
export function chargeHudModel(v: ChargeView): ChargeHudModel {
  const n = v.tiers.length, next = v.reached + 1 < n ? v.reached + 1 : -1;
  const tiers = v.tiers.map((x, i): ChargeHudModel['tiers'][number] => ({
    id: x.id, at: x.at, ap: x.ap,
    state: !v.open[i] ? 'locked' : v.held && i === v.launch ? 'launch' : v.held && i <= v.reached ? 'reached' : v.held && i === next ? 'next' : 'ahead',
  }));
  const toNext = !v.held ? 0 : next < 0 ? 100 : Math.max(0, Math.min(100, Math.round(((v.t - v.tiers[v.reached].at) / (v.tiers[next].at - v.tiers[v.reached].at)) * 1000) / 10));
  return { held: v.held, toNext, tiers, launch: v.tiers[v.launch].id };
}

// ------------------------------------------------------------------------------------------------ the scripted moments of the charge

const hold = (s: DynamicSim) => { s.f.marek.aiWait = 1e9; };
/** moments for captures and the text measurement (as DynPresets.ts): the charge at its heavy tier, at a skill's tier, a tier locked by the AP,
 *  the charge held under the guard through a sequence; run on the charged duel (`runV2Script`) */
export interface V2PresetStep { until: (d: ChargedDuel) => boolean; act?: (d: ChargedDuel) => void }
export const V2_PRESETS: Record<string, { label: string; script: V2PresetStep[] }> = {
  chargeLight: { label: 'Charge (attaque légère)', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.attack(true); } }, { until: (d) => d.view().t >= 0.6 }] },
  chargeHeavy: { label: 'Charge (attaque puissante)', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.attack(true); } }, { until: (d) => d.view().reached >= 1 && d.view().t >= d.tiers[1].at + 0.4 }] },
  chargeSkill: { label: 'Charge (compétence)', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.sim.f.ren.ap = 5; d.attack(true); } }, { until: (d) => d.view().reached >= 3 }] },
  chargeLocked: { label: 'Charge (palier fermé, PA)', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.sim.f.ren.ap = 1; d.attack(true); } }, { until: (d) => d.view().reached >= 3 }] },
  chargeGuard: { label: 'Charge tenue sous la garde', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.attack(true); d.setGuard('ren', true); } }, { until: (d) => d.t >= 0.8, act: (d) => { d.sim.forceSequence(['m_slash', 'm_slash']); } }, { until: (d) => d.sim.f.marek.seqIdx === 2 && !!d.sim.f.marek.act && d.sim.f.marek.act.t >= 0.1 }] },
  released: { label: 'Palier lâché (compétence)', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.sim.f.ren.ap = 5; d.attack(true); } }, { until: (d) => d.view().reached >= 2, act: (d) => d.attack(false) }, { until: (d) => { const a = d.sim.f.ren.act; return !!a && a.impacted && a.t >= a.def.impactAt + 0.06; } }] },
  foeSkill: { label: 'Compétence adverse (alerte)', script: [{ until: (d) => d.t >= 0.2, act: (d) => { const k = d.D.ai.skills?.list.find((x) => d.D.actions[x.id].family === 'offensive'); if (k) d.sim.forceSequence([k.id]); } }, { until: (d) => { const i = d.incoming(); return !!i && i.castProgress >= 0.6; } }] },
};

/** runs a charge moment (each step delivered through `onStep`); the time it ends at */
export function runV2Script(d: ChargedDuel, script: V2PresetStep[], onStep?: () => void): number {
  let i = 0, ticks = 0;
  const max = 60 / d.D.dt;
  while (i < script.length && ticks++ < max) {
    const st = script[i];
    if (st.until(d)) { st.act?.(d); i++; continue; }
    d.step(d.D.dt);
    if (onStep) onStep(); else d.drain();
  }
  return d.t;
}

/** the moments of a version 2 page: the charge's, and the C2 moments that run on the inner simulation */
export function v2PresetNames(dyn: Record<string, DynPreset>): string[] { return [...Object.keys(V2_PRESETS), ...Object.keys(dyn)]; }

/** a fixed input script for the charged duel (300 s from a reset: holds of every length, the tiers released, the guard held through the
 *  sequences with a charge, dodges in the windows of the heavy blows and the skills, resets at each K.O.); its final hash is V2_SIM_HASH, the
 *  regression pin tools/arena-scene-check.mjs replays in the page (`?v2=1`) as it does DYNAMIC_SIM_HASH (journal Passe V1) */
export function runV2Fingerprint(d: ChargedDuel): void {
  const dt = d.D.dt, holds = [0.05, 2.1, 0.05, 3.7, 0.05, 4.2, 5.3, 0.05, 9.4, 2.4];
  let n = 0, next = 0.5, until = -1;
  for (let i = 0; i < Math.round(300 / dt); i++) {
    const inc = d.incoming(), v = d.view();
    if (inc && inc.windowOpen && inc.kind !== 'light' && !v.held) d.react('ren', 'dodge');
    d.setGuard('ren', !!(inc && (inc.kind === 'light' || v.held)));
    if (!v.held && d.t >= next) { d.attack(true); until = d.t + holds[n++ % holds.length]; }
    else if (v.held && d.t >= until && !d.sim.inSequence()) { d.attack(false); next = d.t + 0.3; }
    d.step(dt); d.drain(); if (d.over) d.reset();
  }
}
/** the hash runV2Fingerprint leaves on the scene's duel (sceneV2Duel('charge'), recorded with the rules, journal Passe V1) */
export const V2_SIM_HASH = '1279:1:recovering:0.100:90.750:-:-;4127:0:idle:2.317:43.980:-:-;300.000|0:0.000';
