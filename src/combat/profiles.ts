import { COMBAT_DATA, type CombatData } from '../arena/CombatSim';

/** The competitors' combat profiles (journal Passe L2): each is a set of numbers for the arena's enemy slot of `CombatData` (the AI kit:
 *  health, its light and heavy attacks, how it strings them), so the duel the player fights and the matches played off screen read the
 *  same table (TOURNAMENT_MASTER_CONTRACT § 6: « du même modèle de stats/règles »). The player's slot keeps the prototype's kit (Ren's
 *  actions); a match sheet changes only what the preparation changes (health, damage, action points). `COMBAT_DATA` itself never changes
 *  (choice G1; `?scene=arena` keeps its fingerprint `ARENA_SIM_HASH`). Pure. Numbers are placeholders « Régler après essai » (D1). */

export interface AttackProfile { damage: number; impactAt: number; windowDur: number }
export interface CombatProfile {
  id: string; style: string; maxHp: number; light: AttackProfile; heavy: AttackProfile;
  weights: { combo: number; singleLight: number; singleHeavy: number };
  rest: [number, number]; comboLen: [number, number]; comboGap: [number, number];
}

const M = COMBAT_DATA.actions;
/** Marek is the prototype's enemy, number for number */
export const PROFILES: Record<string, CombatProfile> = {
  marek: {
    id: 'marek', style: 'heavy blows, long rests', maxHp: COMBAT_DATA.fighters.marek.maxHp,
    light: { damage: M.m_slash.damage, impactAt: M.m_slash.impactAt, windowDur: M.m_slash.windowDur! },
    heavy: { damage: M.m_heavy.damage, impactAt: M.m_heavy.impactAt, windowDur: M.m_heavy.windowDur! },
    weights: { ...COMBAT_DATA.ai.weights }, rest: [...COMBAT_DATA.ai.rest], comboLen: [...COMBAT_DATA.ai.comboLen], comboGap: [...COMBAT_DATA.ai.comboGap],
  },
  vessa: { id: 'vessa', style: 'quick combos, short rests', maxHp: 600, light: { damage: 13, impactAt: 0.26, windowDur: 0.2 }, heavy: { damage: 36, impactAt: 0.62, windowDur: 0.36 }, weights: { combo: 0.8, singleLight: 0.15, singleHeavy: 0.05 }, rest: [3.5, 7], comboLen: [3, 5], comboGap: [0.2, 0.32] },
  orla: { id: 'orla', style: 'a docker\'s brawling, steady', maxHp: 700, light: { damage: 15, impactAt: 0.3, windowDur: 0.22 }, heavy: { damage: 44, impactAt: 0.7, windowDur: 0.4 }, weights: { combo: 0.5, singleLight: 0.25, singleHeavy: 0.25 }, rest: [5, 9], comboLen: [2, 3], comboGap: [0.26, 0.4] },
  cassius: { id: 'cassius', style: 'patient fencing, sudden lunges', maxHp: 650, light: { damage: 14, impactAt: 0.32, windowDur: 0.22 }, heavy: { damage: 46, impactAt: 0.78, windowDur: 0.42 }, weights: { combo: 0.4, singleLight: 0.3, singleHeavy: 0.3 }, rest: [6, 11], comboLen: [2, 3], comboGap: [0.28, 0.44] },
  ilse: { id: 'ilse', style: 'a temple knight\'s measured strikes', maxHp: 750, light: { damage: 14, impactAt: 0.3, windowDur: 0.22 }, heavy: { damage: 42, impactAt: 0.72, windowDur: 0.42 }, weights: { combo: 0.5, singleLight: 0.3, singleHeavy: 0.2 }, rest: [6, 10], comboLen: [2, 4], comboGap: [0.25, 0.42] },
  tobin: { id: 'tobin', style: 'eager and green', maxHp: 520, light: { damage: 12, impactAt: 0.34, windowDur: 0.24 }, heavy: { damage: 34, impactAt: 0.8, windowDur: 0.44 }, weights: { combo: 0.45, singleLight: 0.35, singleHeavy: 0.2 }, rest: [6, 12], comboLen: [2, 3], comboGap: [0.3, 0.46] },
  rhosk: { id: 'rhosk', style: 'a northern axe, slow and crushing', maxHp: 900, light: { damage: 18, impactAt: 0.36, windowDur: 0.24 }, heavy: { damage: 56, impactAt: 0.85, windowDur: 0.46 }, weights: { combo: 0.35, singleLight: 0.25, singleHeavy: 0.4 }, rest: [6, 11], comboLen: [2, 3], comboGap: [0.3, 0.46] },
};

/** what the preparation changes in a duel, for either side */
export interface Mods {
  /** health multiplier (an injury: 0.8, 0.6) */
  hp?: number;
  /** damage multiplier (a tempered blade, the opponent's preparation) */
  damage?: number;
  /** extra action points at the start (training), player only */
  ap?: number;
}

/** a duel's data: the prototype's table with the player's name and modifiers in Ren's slot, and the opponent's profile in Marek's slot.
 *  The slots' ids stay `ren` / `marek` (the simulation's two seats); `names` gives what the HUD shows. */
export function duelData(opponent: CombatProfile, o: { seed: number; playerName: string; opponentName: string; player?: Mods; enemy?: Mods; names?: Partial<Record<string, string>> }): CombatData {
  const d: CombatData = JSON.parse(JSON.stringify(COMBAT_DATA));
  const pm = o.player ?? {}, em = o.enemy ?? {};
  d.ai = { ...d.ai, seed: o.seed >>> 0 || 1, weights: { ...opponent.weights }, rest: [...opponent.rest], comboLen: [...opponent.comboLen], comboGap: [...opponent.comboGap] };
  d.fighters.ren = { ...d.fighters.ren, name: o.playerName, maxHp: Math.round(d.fighters.ren.maxHp * (pm.hp ?? 1)) };
  d.fighters.marek = { ...d.fighters.marek, name: o.opponentName, maxHp: Math.round(opponent.maxHp * (em.hp ?? 1)) };
  d.ap = { ...d.ap, start: Math.min(d.ap.max, d.ap.start + (pm.ap ?? 0)) };
  for (const a of Object.values(d.actions)) {
    if (a.owner === 'ren') a.damage = Math.round(a.damage * (pm.damage ?? 1));
    if (o.names?.[a.id]) a.name = o.names[a.id]!;
  }
  const L = d.actions.m_slash, H = d.actions.m_heavy, ed = em.damage ?? 1;
  Object.assign(L, { damage: Math.round(opponent.light.damage * ed), impactAt: opponent.light.impactAt, windowDur: opponent.light.windowDur });
  Object.assign(H, { damage: Math.round(opponent.heavy.damage * ed), impactAt: opponent.heavy.impactAt, windowDur: opponent.heavy.windowDur });
  return d;
}

// ------------------------------------------------------------------------------------------- the simplified resolution (off screen)

/** a fighter in the damage race: health and damage per second against a defender of the reference skill */
export interface Racer { hp: number; dps: number }

/** the reference reading of a defender (the bot's rule at skill s, bot.ts): the share of heavies it means to dodge and of lights it means to
 *  guard; READ_AVAIL of those reach the simulation (a dodge needs an action point, a guard an idle fighter: the points go to techniques
 *  and the fighter is often mid-attack) */
export const READ_AVAIL = 0.5;
const dodgeOf = (s: number) => (0.25 + 0.65 * s) * READ_AVAIL, guardOf = (s: number) => (0.2 + 0.6 * s) * READ_AVAIL;

/** an enemy kit's damage per second against a defender of skill s, from its numbers alone: the expected damage of a sequence over its
 *  expected length (attacks' durations, gaps, the rest after it) */
export function enemyDps(p: CombatProfile, s: number, damage = 1): number {
  const L = COMBAT_DATA.actions.m_slash, H = COMBAT_DATA.actions.m_heavy, g = COMBAT_DATA.guard.reduce;
  const lDur = p.light.impactAt + L.follow + L.recover, hDur = p.heavy.impactAt + H.follow + H.recover;
  const lDmg = p.light.damage * damage * (1 - guardOf(s) * g), hDmg = p.heavy.damage * damage * (1 - dodgeOf(s));
  const W = p.weights, tot = W.combo + W.singleLight + W.singleHeavy, n = (p.comboLen[0] + p.comboLen[1]) / 2, gap = (p.comboGap[0] + p.comboGap[1]) / 2;
  const rest = (p.rest[0] + p.rest[1]) / 2;
  const dmg = (W.combo * ((n - 1) * lDmg + hDmg) + W.singleLight * lDmg + W.singleHeavy * hDmg) / tot;
  const time = (W.combo * ((n - 1) * lDur + hDur + (n - 1) * gap) + W.singleLight * lDur + W.singleHeavy * hDur) / tot + rest;
  return dmg / time;
}

/** the player kit's damage per second (Ren's actions) at skill s: lights earn one action point each; the techniques, in the bot's order
 *  (t4, t3, t1, t2), spend the points as fast as their cooldowns allow; the fighter is always busy (a light's cycle includes the wait
 *  between commands, longer at low skill). Solved for the light rate L: L x light time + sum(x_i x tech time) = 1, with the technique
 *  rates x_i = min(1 / cooldown, points left / cost). */
export function playerDps(s: number, damage = 1): number {
  const A = COMBAT_DATA.actions, l = A.light;
  const lTime = Math.max(l.impactAt + l.follow + l.recover, 0.25 + (1 - s) * 0.45 + 0.125);
  const techs = (['t4', 't3', 't1', 't2'] as const).map((k) => A[k]);
  const at = (L: number) => {
    let ap = L, time = L * lTime, dmg = L * l.damage;
    for (const t of techs) { const x = Math.min(1 / t.cooldown!, ap / t.apCost!); ap -= x * t.apCost!; time += x * (t.impactAt + t.follow + t.recover); dmg += x * t.damage; }
    return { time, dmg };
  };
  let lo = 0, hi = 1 / lTime;
  for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (at(m).time > 1) hi = m; else lo = m; }
  return at(lo).dmg * damage;
}

/** how sharply a damage-race advantage decides a match (logistic slope on the log of the time-to-kill ratio) */
export const RACE_SLOPE = 3.2;
/** the player kit's head start (logit): it opens with 3 action points and its techniques front-load the damage while the enemy waits a
 *  second before its first sequence, so an even race is not an even duel (fitted on the calibration seeds, journal Passe L2) */
export const PLAYER_EDGE = 0.75;
/** P(a beats b) in a damage race: each needs the other's health over its own damage per second; `edge` = a's head start (logit) */
export function raceWinChance(a: Racer, b: Racer, edge = 0): number {
  const ta = b.hp / Math.max(1e-6, a.dps), tb = a.hp / Math.max(1e-6, b.dps);
  return 1 / (1 + Math.exp(-(RACE_SLOPE * Math.log(tb / ta) + edge)));
}
/** P(the player kit at skill s, with its modifiers, beats this profile): the off-screen reading of a duel the player did not fight */
export function playerWinChance(p: CombatProfile, s: number, pm: Mods = {}, em: Mods = {}): number {
  return raceWinChance({ hp: COMBAT_DATA.fighters.ren.maxHp * (pm.hp ?? 1), dps: playerDps(s, pm.damage ?? 1) }, { hp: p.maxHp * (em.hp ?? 1), dps: enemyDps(p, s, em.damage ?? 1) }, PLAYER_EDGE);
}

/** the reference defender's skill the competitors' damage is read against */
export const REFERENCE_SKILL = 0.5;
export function racerOf(p: CombatProfile, m: Mods = {}): Racer { return { hp: p.maxHp * (m.hp ?? 1), dps: enemyDps(p, REFERENCE_SKILL, m.damage ?? 1) }; }
