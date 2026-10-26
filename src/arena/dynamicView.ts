import { clipFrame } from './FighterArt';
import type { DynActionId, DynAnimState, DynData, DynamicSim, DynFighterId } from '../combat/dynamic';

/** The arena's side of the « tour par tour dynamique » (lot C2 of briefs/combat-system.md § 15, journal Passe C2): what the presentation reads
 *  from `DynamicSim` (src/combat/dynamic.ts), as pure functions the tests run in Node: which rules a page plays, the keys of the four slots, the
 *  trial's settings in the address, today's clips on the new moments, and what the HUD shows (CB-6: both fighters' health and resistance gauge,
 *  the opponent's « barre de break », the player's action points and four skills with their cost; the priority of the opponent's sequence).
 *  Behind its parameter (CB-10, « Derrière un paramètre, défaut après mon essai »): `?combat=dynamic`, or a game whose `flags.combat` is
 *  'dynamic'; absent = the arena of today (`CombatSim`), unchanged. */

/** 'v2': the version 2's duel (the three buttons and the charge, the opponents of C3; src/arena/v2Arena.ts, journal Passe V1) */
export type ArenaRules = 'classic' | 'dynamic' | 'v2';

/** the rules of an arena page: the play mode's bout says (its game's flags), else `?v2=1`, then `?combat=dynamic`; anything else is the arena
 *  of today */
export function arenaRules(params: URLSearchParams, match?: { rules?: ArenaRules }): ArenaRules {
  if (match) return match.rules === 'dynamic' || match.rules === 'v2' ? match.rules : 'classic';
  const v2 = params.get('v2');
  if (v2 === '' || v2 === '1') return 'v2';
  return params.get('combat') === 'dynamic' ? 'dynamic' : 'classic';
}

/** the keyboard under the new rules: 1 light, 2 heavy, 3-6 the four slots in their order, A dodge, B guard (held), R restart, Space pause */
export function dynKeys(loadout: readonly DynActionId[]): Record<string, string> {
  const k: Record<string, string> = { '1': 'light', '2': 'heavy', a: 'dodge', b: 'guard', r: 'reset', ' ': 'pause' };
  loadout.forEach((id, i) => { k[String(3 + i)] = id; });
  return k;
}

/** the gamepad (the prototype's layout): A dodge, B guard, X / Y light / heavy, the shoulders and triggers the four slots, Start pause, Back reset */
export function dynPad(loadout: readonly DynActionId[]): Record<number, string> {
  const p: Record<number, string> = { 0: 'dodge', 1: 'guard', 2: 'light', 3: 'heavy', 9: 'pause', 8: 'reset' };
  loadout.forEach((id, i) => { p[4 + i] = id; });
  return p;
}

/** the trial's settings (the specification's § 11, « à régler »), read from `?dyn=key:value,...` on top of the duel's data; an unknown key or a
 *  value out of its range is refused (an error names it): the trial never plays a number nobody asked for. Keys:
 *  apMax (3-6), apStart (0-apMax), apRegen (s per AP, 0 = none, else 2-20), gauge (resistance gauge size, 40-300), decay (per s, 0-10),
 *  stun (the break's stun, 3-12 s), breakDmg (damage taken while broken, x1-2), guard (guard's damage cut, 0-0.9), level (the opponent's pauses,
 *  1-5), foeHp / renHp (health, 100-50000) */
export const DYN_TUNE: Record<string, { min: number; max: number; apply: (d: DynData, v: number) => void }> = {
  apMax: { min: 3, max: 6, apply: (d, v) => { d.ap.max = Math.round(v); } },
  apStart: { min: 0, max: 6, apply: (d, v) => { d.ap.start = Math.round(v); } },
  apRegen: { min: 0, max: 20, apply: (d, v) => { d.ap.regen = v; } },
  gauge: { min: 40, max: 300, apply: (d, v) => { d.resist.max = v; } },
  decay: { min: 0, max: 10, apply: (d, v) => { d.resist.decay = v; } },
  stun: { min: 3, max: 12, apply: (d, v) => { d.resist.breakStun = v; } },
  breakDmg: { min: 1, max: 2, apply: (d, v) => { d.resist.breakDamage = v; } },
  guard: { min: 0, max: 0.9, apply: (d, v) => { d.guard.reduce = v; } },
  level: { min: 1, max: 5, apply: (d, v) => { d.ai.level = Math.round(v); } },
  foeHp: { min: 100, max: 50000, apply: (d, v) => { d.fighters.marek.maxHp = Math.round(v); } },
  renHp: { min: 100, max: 50000, apply: (d, v) => { d.fighters.ren.maxHp = Math.round(v); } },
};

/** a copy of the data with the trial's settings applied (keys applied in their order in the address); empty or absent = the data as given */
export function tuneDyn(base: DynData, spec: string | null | undefined): DynData {
  const d: DynData = JSON.parse(JSON.stringify(base));
  if (!spec) return d;
  for (const part of spec.split(',').map((s) => s.trim()).filter(Boolean)) {
    const [k, raw] = part.split(':'), t = DYN_TUNE[k], v = Number(raw);
    if (!t) throw new Error(`dyn: unknown setting "${k}" (${Object.keys(DYN_TUNE).join(', ')})`);
    if (raw === undefined || raw.trim() === '' || !Number.isFinite(v) || v < t.min || v > t.max) throw new Error(`dyn: ${k} must be a number in [${t.min}, ${t.max}], got "${raw}"`);
    if (k === 'apRegen' && v > 0 && v < 2) throw new Error(`dyn: apRegen is 0 (none) or at least 2 s, got "${raw}"`);
    t.apply(d, v);
  }
  if (d.ap.start > d.ap.max) throw new Error(`dyn: apStart ${d.ap.start} is over apMax ${d.ap.max}`);
  return d;
}

/** today's clips (FighterArt.ts, the generated fighters, not retouched: AA1-6) on the new moments: an offensive skill plays `skill`, a defensive
 *  one the guard's brace (`block`), a support one the raised blade (`victory`); every other clip keeps its name (CB-2's sheets will bring their
 *  own `skillOff` / `skillDef` / `skillSup`) */
export const DYN_CLIP: Record<string, string> = { skillOff: 'skill', skillDef: 'block', skillSup: 'victory' };
export const dynClip = (name: string): string => DYN_CLIP[name] ?? name;

/** the frame of a clip under the new rules: the preparation holds the first frame (§ 14: « 0 préparation, tenue pendant le délai »); a
 *  defensive or support skill shows its effect frame from the impact on; anything without a preparation is today's `clipFrame` */
export function dynClipFrame(source: string, clip: string, n: number, an: DynAnimState, loopRate = 0): number {
  const ia = an.impactAt ?? 0, prep = an.prep ?? 0;
  if (source === 'skillDef' || source === 'skillSup') return Math.min(n - 1, an.t < ia ? 0 : 1);
  if (prep > 0 && an.t < prep) return 0;
  if (clip === 'heavy' && prep > 0) return an.t < ia - 0.03 ? 1 : an.t < ia + 0.11 ? 2 : 3;
  return clipFrame(clip, n, an.t, ia, loopRate);
}

// ------------------------------------------------------------------------------------------------ the HUD's reading of the simulation

export type DynPhase = 'open' | 'defense' | 'foeBroken' | 'broken' | 'over';
export type DynButton = 'on' | 'locked' | 'noap' | 'off';
export interface DynGauge { hpPct: number; hp: number; maxHp: number; resistPct: number; broken: boolean; stunPct: number; stunLeft: number; ward: number; boost: number; wardPct: number; boostPct: number }
export interface DynHudModel {
  phase: DynPhase;
  ap: number; apMax: number;
  ren: DynGauge; marek: DynGauge;
  /** the bar: the guard, the dodge, the light and heavy attacks, the four slots (in their order) */
  buttons: Record<string, DynButton>;
  slots: Array<{ id: DynActionId; cost: number; family: string }>;
  /** the player's action in its preparation (0..1 of the delay), else null */
  prep: { action: DynActionId; pct: number } | null;
  guarding: boolean;
}

const pct = (a: number, b: number) => (b > 0 ? Math.max(0, Math.min(100, Math.round((a / b) * 1000) / 10)) : 0);

function gauge(sim: DynamicSim, id: DynFighterId): DynGauge {
  const f = sim.f[id], D = sim.D, broken = f.broken && f.state === 'stunned';
  return {
    hpPct: pct(f.hp, f.maxHp), hp: Math.ceil(f.hp), maxHp: f.maxHp,
    resistPct: broken ? 100 : pct(f.resist, D.resist.max), broken,
    stunPct: f.state === 'stunned' && f.stunDur > 0 ? pct(f.stunLeft, f.stunDur) : 0, stunLeft: f.state === 'stunned' ? Math.max(0, f.stunLeft) : 0,
    ward: f.ward ? Math.max(0, f.ward.left) : 0, boost: f.boost ? Math.max(0, f.boost.left) : 0,
    wardPct: f.ward ? pct(f.ward.left, f.ward.dur) : 0, boostPct: f.boost ? pct(f.boost.left, f.boost.dur) : 0,
  };
}

/** what the HUD shows at this step (the rules' own queries: `inSequence`, `available`, `canAfford`) */
export function dynHudModel(sim: DynamicSim): DynHudModel {
  const R = sim.f.ren, M = sim.f.marek, D = sim.D;
  const phase: DynPhase = sim.over ? 'over' : R.state === 'stunned' ? 'broken' : M.state === 'stunned' ? 'foeBroken' : sim.inSequence() ? 'defense' : 'open';
  const buttons: Record<string, DynButton> = {};
  const free = !sim.over && R.state !== 'down' && R.state !== 'stunned';
  for (const id of ['light', 'heavy', ...D.loadout] as DynActionId[]) {
    buttons[id] = !free ? 'off' : !sim.canAfford('ren', id) ? 'noap' : sim.inSequence() ? 'locked' : sim.available('ren', id) ? 'on' : 'off';
  }
  buttons.guard = free && R.state !== 'pushed' ? 'on' : 'off';
  buttons.dodge = !free ? 'off' : R.ap < D.reactions.dodge.apCost ? 'noap' : 'on';
  const a = R.state === 'acting' ? R.act : null;
  return {
    phase, ap: R.ap, apMax: D.ap.max, ren: gauge(sim, 'ren'), marek: gauge(sim, 'marek'), buttons,
    slots: D.loadout.map((id) => ({ id, cost: D.actions[id].apCost ?? 0, family: D.actions[id].family ?? '' })),
    prep: a && a.def.prep > 0 && a.t < a.def.prep ? { action: a.def.id, pct: pct(a.t, a.def.prep) } : null,
    guarding: R.guarding,
  };
}
