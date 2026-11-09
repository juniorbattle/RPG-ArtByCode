import { DynamicSim, type DynData } from '../combat/dynamic';
import { ChargedDuel, type ChargeTier, type ChargeView } from '../combat/charge';
import { v2DuelData, type V2Duel } from '../combat/v2duel';
import { GENERICS } from '../narrative/generics';
import { tuneDyn } from './dynamicView';
import type { DynPreset } from './DynPresets';

/** The arena's side of the version 2's duel (lot V1, journal Passe V1): `?scene=arena&v2=1` (Ren against Marek, the opponents of C3), or the
 *  bout of a version 2 game (its sheet's data and tiers). The three buttons (the operator's decision AV-5): attack (held: the charge), guard
 *  (held), dodge; `&input=keys` keeps the C2 command for comparing (keys 1-6, the same opponent and levels: AV-5, « l'ancien schéma gardé pour
 *  comparer »). Pure functions and data the tests run in Node. */

export type V2Input = 'charge' | 'keys';
export const v2Input = (params: URLSearchParams): V2Input => (params.get('input') === 'keys' ? 'keys' : 'charge');

/** the scene page's duel: Ren against Marek, as `?scene=arena` stages it, under the version 2 (the prototype's French names kept); `foe`: another rival, for a sheet's review;
 *  DEV, a generic fighter on its borrowed rival's profile, as a game's challenge fights it (`challengeSheetFor`; journal Passe GA2: its sheet holds that rival's clips only) */
export function sceneV2Duel(input: V2Input, foe = 'marek'): V2Duel {
  const g = import.meta.env.DEV ? GENERICS[foe] : undefined;
  return v2DuelData(g?.profile ?? foe, { seed: 1337, playerName: 'Ren', opponentName: g?.name ?? foe[0].toUpperCase() + foe.slice(1), input, ...(g ? { enemy: { hp: g.hp, damage: g.damage } } : {}) });
}

export interface V2ArenaDuel { dyn: DynamicSim; charge: ChargedDuel | null; tiers: ChargeTier[] }
/** the page's simulation: the charged duel (three buttons), or the C2 command on the same data (`input=keys`); `dyn=` the trial's numbers */
export function makeV2Duel(params: URLSearchParams, match?: { data: DynData; tiers?: ChargeTier[] }, foe?: string): V2ArenaDuel {
  const input = v2Input(params), base = match ? { data: match.data, tiers: match.tiers ?? [] } : sceneV2Duel(input, foe);
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
  /** a released tier waits for the duel to take it (the opponent's sequence, a stun: V2-2 « Rien ne la coupe », journal Passe V2C1) */
  waiting: boolean;
  /** 0..100: the charge toward the next tier (100 past the last one) */
  toNext: number;
  tiers: Array<{ id: string; at: number; ap: number; state: TierState }>;
  /** the tier a release launches now */
  launch: string;
}

/** what the tier strip shows: each tier reached, the one a release would launch, the next one and how far the charge is from it, the tiers
 *  whose action points are missing (locked: they do not open, AV-6); a charge held first, else a released tier waiting (the one it launches) */
export function chargeHudModel(v: ChargeView): ChargeHudModel {
  const n = v.tiers.length, next = v.reached + 1 < n ? v.reached + 1 : -1, waiting = !v.held && v.waiting >= 0;
  const tiers = v.tiers.map((x, i): ChargeHudModel['tiers'][number] => ({
    id: x.id, at: x.at, ap: x.ap,
    state: !v.open[i] ? 'locked' : waiting ? (i === v.waiting ? 'launch' : 'ahead') : v.held && i === v.launch ? 'launch' : v.held && i <= v.reached ? 'reached' : v.held && i === next ? 'next' : 'ahead',
  }));
  const toNext = !v.held ? 0 : next < 0 ? 100 : Math.max(0, Math.min(100, Math.round(((v.t - v.tiers[v.reached].at) / (v.tiers[next].at - v.tiers[v.reached].at)) * 1000) / 10));
  return { held: v.held, waiting, toNext, tiers, launch: v.tiers[waiting ? v.waiting : v.launch].id };
}

// ------------------------------------------------------------------------------------------------ the scripted moments of the charge

const hold = (s: DynamicSim) => { s.f.marek.aiWait = 1e9; };
/** moments for captures and the text measurement (as DynPresets.ts): the charge at its first skill's tier (the heavy attack's own tier before
 *  journal Passe CH1), at a later skill's tier, a tier locked by the AP, the charge held under the guard through a sequence; run on the charged
 *  duel (`runV2Script`) */
export interface V2PresetStep { until: (d: ChargedDuel) => boolean; act?: (d: ChargedDuel) => void }
export const V2_PRESETS: Record<string, { label: string; script: V2PresetStep[] }> = {
  chargeLight: { label: 'Charge (attaque légère)', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.attack(true); } }, { until: (d) => d.view().t >= 0.6 }] },
  chargeFirst: { label: 'Charge (premier palier)', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.sim.f.ren.ap = 5; d.attack(true); } }, { until: (d) => d.view().reached >= 1 && d.view().t >= d.tiers[1].at + 0.2 }] },
  chargeSkill: { label: 'Charge (compétence)', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.sim.f.ren.ap = 5; d.attack(true); } }, { until: (d) => d.view().reached >= 3 }] },
  chargeLocked: { label: 'Charge (palier fermé, PA)', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.sim.f.ren.ap = 1; d.attack(true); } }, { until: (d) => d.view().reached >= 3 }] },
  chargeGuard: { label: 'Charge tenue sous la garde', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.attack(true); d.setGuard('ren', true); } }, { until: (d) => d.t >= 0.8, act: (d) => { d.sim.forceSequence(['m_slash', 'm_slash']); } }, { until: (d) => d.sim.f.marek.seqIdx === 2 && !!d.sim.f.marek.act && d.sim.f.marek.act.t >= 0.1 }] },
  // V2-2 « Rien ne la coupe » (journal Passe V2C1): released in the opponent's sequence, the first tier waits for its end
  chargeWait: { label: 'Palier en attente (séquence adverse)', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.sim.f.ren.ap = 5; d.attack(true); } }, { until: (d) => d.view().t >= d.tiers[1].at + 0.2, act: (d) => { d.sim.forceSequence(['m_slash', 'm_slash']); } }, { until: (d) => d.sim.inSequence(), act: (d) => d.attack(false) }, { until: (d) => d.sim.f.marek.seqIdx === 2 && !!d.sim.f.marek.act && d.sim.f.marek.act.t >= 0.1 }] },
  released: { label: 'Palier lâché (compétence)', script: [{ until: (d) => d.t >= 0.3, act: (d) => { hold(d.sim); d.sim.f.ren.ap = 5; d.attack(true); } }, { until: (d) => d.view().reached >= 2, act: (d) => d.attack(false) }, { until: (d) => { const a = d.sim.f.ren.act; return !!a && a.impacted && a.t >= a.def.impactAt + 0.06; } }] },
  foeSkill: { label: 'Compétence adverse (alerte)', script: [{ until: (d) => d.t >= 0.2, act: (d) => { const k = d.D.ai.skills?.list.find((x) => d.D.actions[x.id].family === 'offensive'); if (k) d.sim.forceSequence([k.id]); } }, { until: (d) => { const i = d.incoming(); return !!i && i.castProgress >= 0.6; } }] },
  // a rival's skills on their own frames (journal Passe CX1): the blow landing, a ward's or a boost's effect
  foeSkillHit: { label: 'Compétence adverse (impact)', script: [{ until: (d) => d.t >= 0.2, act: (d) => { const k = d.D.ai.skills?.list.find((x) => d.D.actions[x.id].family === 'offensive'); if (k) d.sim.forceSequence([k.id]); } }, { until: (d) => { const a = d.f.marek.act; return !!a && a.impacted && a.t >= a.def.impactAt + 0.04; } }] },
  foeWard: { label: 'Compétence adverse (protection)', script: [{ until: (d) => d.t >= 0.2, act: (d) => { const k = d.D.ai.skills?.list.find((x) => d.D.actions[x.id].family === 'defensive'); if (k) d.sim.forceSequence([k.id]); } }, { until: (d) => { const a = d.f.marek.act; return !!a && a.t >= a.def.impactAt + 0.1; } }] },
  foeBoost: { label: 'Compétence adverse (soutien)', script: [{ until: (d) => d.t >= 0.2, act: (d) => { const k = d.D.ai.skills?.list.find((x) => d.D.actions[x.id].family === 'support'); if (k) d.sim.forceSequence([k.id]); } }, { until: (d) => { const a = d.f.marek.act; return !!a && a.t >= a.def.impactAt + 0.1; } }] },
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

/** a fixed input script for the charged duel (360 s from a reset: holds of every length, the tiers released at their time, in the opponent's
 *  sequences too, where they wait; until 40 s of a duel the guard against the light blows and dodges in the windows of the heavy blows and
 *  skills two seconds in three, a charge held or not; to 110 s the guard against every blow, until the player's gauge breaks; then neither, to
 *  the K.O. with a charge held; a reset at each K.O.: the paths of V2-2 « Rien ne la coupe », journal Passe V2C1); its final hash is
 *  V2_SIM_HASH, the regression pin tools/arena-scene-check.mjs replays in the page (`?v2=1`) as it does DYNAMIC_SIM_HASH (journal Passe V1).
 *  `seen` gets each step's events and whether a charge was held before it (the tests) */
export function runV2Fingerprint(d: ChargedDuel, seen?: (events: ReturnType<ChargedDuel['drain']>, held: boolean) => void): void {
  // the holds on the tiers of the scene's duel (journal Passe CH1: Rampart 3 s, Flash cut 3.4, Fervour 4.25, Thrust 7.65; a 12 s hold reaches a
  // break with a charge held); three taps before each charge since journal Passe DB3 (the AP the skills need; three taps in a row draw the riposte)
  const dt = d.D.dt, holds = [0.05, 0.05, 0.05, 3.1, 0.05, 0.05, 0.05, 3.5, 0.05, 0.05, 0.05, 4.3, 0.05, 0.05, 0.05, 7.7, 0.05, 9.4, 12];
  let n = 0, next = 0.5, until = -1;
  for (let i = 0; i < Math.round(360 / dt); i++) {
    const inc = d.incoming(), v = d.view();
    if (inc && inc.windowOpen && inc.kind !== 'light' && d.t < 40 && Math.floor(d.t) % 3 !== 0) d.react('ren', 'dodge');
    d.setGuard('ren', !!(inc && d.t < 110 && (inc.kind === 'light' || d.t >= 40)));
    if (!v.held && d.t >= next) { d.attack(true); until = d.t + holds[n++ % holds.length]; }
    else if (v.held && d.t >= until) { d.attack(false); next = d.t + 0.3; }
    d.step(dt); const e = d.drain(); seen?.(e, v.held); if (d.over) { d.reset(); next = 0.5; }
  }
}
/** the hash runV2Fingerprint leaves on the scene's duel (sceneV2Duel('charge'), recorded with the rules, journal Passe V1; Ren's health
 *  again under V2_FOE_HIT, journal Passe VP4; the script and the rule of V2-2, journal Passe V2C1; the rivals' blows and health of journal Passe V2C2;
 *  the heavy attack a skill, the charge times and the charged blows' power trimmed, the script's holds on the new tiers, journal Passe CH1; one
 *  release waiting at most, journal Passe DB1; the duel of journal Passe DB3 and three taps before each charge) */
export const V2_SIM_HASH = '1943:4:idle:0.083:36.650:-:-;10776:0:acting:0.392:20.020:6.908:-;71.375|0:0.000:0';
