import { COMBAT_DATA, type CombatData } from '../arena/CombatSim';
import { checkDynData, DYNAMIC_DATA, type DynActionId, type DynData } from './dynamic';

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
    // the play mode's names (choice K1): the prototype's short labels (« Estocade ») go with its French names
    if (o.names?.[a.id]) { a.name = o.names[a.id]!; delete a.short; }
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
export function raceWinChance(a: Racer, b: Racer, edge = 0, slope = RACE_SLOPE): number {
  const ta = b.hp / Math.max(1e-6, a.dps), tb = a.hp / Math.max(1e-6, b.dps);
  return 1 / (1 + Math.exp(-(slope * Math.log(tb / ta) + edge)));
}
/** P(the player kit at skill s, with its modifiers, beats this profile): the off-screen reading of a duel the player did not fight */
export function playerWinChance(p: CombatProfile, s: number, pm: Mods = {}, em: Mods = {}): number {
  return raceWinChance({ hp: COMBAT_DATA.fighters.ren.maxHp * (pm.hp ?? 1), dps: playerDps(s, pm.damage ?? 1) }, { hp: p.maxHp * (em.hp ?? 1), dps: enemyDps(p, s, em.damage ?? 1) }, PLAYER_EDGE);
}

/** the reference defender's skill the competitors' damage is read against */
export const REFERENCE_SKILL = 0.5;
export function racerOf(p: CombatProfile, m: Mods = {}): Racer { return { hp: p.maxHp * (m.hp ?? 1), dps: enemyDps(p, REFERENCE_SKILL, m.damage ?? 1) }; }

// ------------------------------------------------------------------------------------------- the « tour par tour dynamique » (lot C1)

/** The same competitors under the rules of the « tour par tour dynamique » (src/combat/dynamic.ts, journal Passe C1), behind its parameter
 *  (CB-10): `PROFILES` and everything above stay the arena's of today. Each kit keeps its attacks' timings, weights and combos; its pauses
 *  come from its level (`DYNAMIC_DATA.restByLevel`), the levels read from today's rests; health and damage aim at duels of 5 to 10 minutes,
 *  « selon la complexite de l'adversaire et ces points de vie » [G5]. The opponents' guard, dodge and skills, and the balancing of the seven
 *  profiles (L7-4 folded in, CB-11), are lot C3. Numbers are starting points, « à régler » at the operator's trial. */

export interface DynAttackProfile { damage: number; impactAt: number; windowDur: number; resist: number }
export interface DynProfile {
  id: string; style: string; level: number; maxHp: number; light: DynAttackProfile; heavy: DynAttackProfile;
  weights: { combo: number; singleLight: number; singleHeavy: number }; comboLen: [number, number]; comboGap: [number, number];
}

/** the levels: today's rests (tobin 6-12 s ... vessa 3.5-7 s) placed on the level table's pauses */
export const DYN_LEVELS: Record<string, number> = { tobin: 1, cassius: 2, ilse: 2, rhosk: 2, orla: 3, marek: 3, vessa: 4 };
/** health against today's (a duel ten to twenty times longer) and each rival's own adjustment; what an enemy blow adds to the gauge */
export const DYN_HP_SCALE = 10;
export const DYN_TUNE: Record<string, { hp?: number; damage?: number }> = { marek: { damage: 1.25 }, vessa: { hp: 0.8 }, tobin: { hp: 1.15 } };
export const DYN_RESIST = { light: 6, heavy: 16 };

export const DYN_PROFILES: Record<string, DynProfile> = Object.fromEntries(Object.values(PROFILES).map((p): [string, DynProfile] => {
  const t = DYN_TUNE[p.id] ?? {}, dmg = (n: number) => Math.round(n * (t.damage ?? 1));
  return [p.id, {
    id: p.id, style: p.style, level: DYN_LEVELS[p.id], maxHp: Math.round(p.maxHp * DYN_HP_SCALE * (t.hp ?? 1)),
    light: { ...p.light, damage: dmg(p.light.damage), resist: DYN_RESIST.light }, heavy: { ...p.heavy, damage: dmg(p.heavy.damage), resist: DYN_RESIST.heavy },
    weights: { ...p.weights }, comboLen: [...p.comboLen], comboGap: [...p.comboGap],
  }];
}));

/** a duel's data under the new rules: DYNAMIC_DATA with the player's name, modifiers and four skills in Ren's seat, the opponent's profile in
 *  Marek's (the seats' ids stay `ren` / `marek`, as in duelData) */
export function dynDuelData(opponent: DynProfile, o: { seed: number; playerName: string; opponentName: string; player?: Mods; enemy?: Mods; names?: Partial<Record<string, string>>; loadout?: DynActionId[] }): DynData {
  const d: DynData = JSON.parse(JSON.stringify(DYNAMIC_DATA));
  const pm = o.player ?? {}, em = o.enemy ?? {};
  d.ai = { ...d.ai, seed: o.seed >>> 0 || 1, level: opponent.level, weights: { ...opponent.weights }, comboLen: [...opponent.comboLen], comboGap: [...opponent.comboGap] };
  d.fighters.ren = { ...d.fighters.ren, name: o.playerName, maxHp: Math.round(d.fighters.ren.maxHp * (pm.hp ?? 1)) };
  d.fighters.marek = { ...d.fighters.marek, name: o.opponentName, maxHp: Math.round(opponent.maxHp * (em.hp ?? 1)) };
  d.ap = { ...d.ap, start: Math.min(d.ap.max, d.ap.start + (pm.ap ?? 0)) };
  if (o.loadout) d.loadout = [...o.loadout];
  for (const a of Object.values(d.actions)) {
    if (a.owner === 'ren') a.damage = Math.round(a.damage * (pm.damage ?? 1));
    if (o.names?.[a.id]) { a.name = o.names[a.id]!; delete a.short; }
  }
  const ed = em.damage ?? 1;
  for (const [k, p] of [['m_slash', opponent.light], ['m_heavy', opponent.heavy]] as const) Object.assign(d.actions[k], { damage: Math.round(p.damage * ed), impactAt: p.impactAt, windowDur: p.windowDur, resist: p.resist });
  checkDynData(d);
  return d;
}

// ------------------------------------------------------------------------- the simplified resolution under the new rules (off screen, E6)

/** The damage race of the new rules, from a kit's numbers: the opponent's cycle (its sequences, the player's defence; its pauses, the
 *  player's time to attack), what a sequence costs the reference defender (the dynamic bot's reading at skill s: the guard held through a
 *  sequence, the heavies dodged, the first blow taken when the bot is pushed back), the breaks of the opponent's gauge (a stun in which it
 *  deals nothing) and the player's ward (Rempart, cast when its own gauge fills). Its constants were measured on calibration seeds 1..20 of
 *  full duels (tools: the dynamic bot in DynamicSim, infinite health for the rates), never on the held-out seeds of the test
 *  (tests/combat-dynamic.test.mjs); the player's side reads DYNAMIC_DATA's kit and its default four skills (another loadout, C4, needs them
 *  measured again). */
export const DYN_RACE = {
  /** sequences that push the bot back (CB-3): their first blow lands whole */
  push: 0.33,
  /** the share of the dodges it means that find an action point: below skill 0.5 it keeps none, from 0.5 one */
  availLow: 0.66, availKeep: 0.93,
  /** the bot's damage per second while the opponent pauses, at skills 0, 0.25, 0.5, 0.75, 1 (the default kit, without a ward) */
  rate: [17.0, 18.9, 20.5, 21.4, 21.5],
  /** while the opponent is broken: rate0 + rate1 x skill */
  stunRate: [25.7, 3.3] as [number, number],
  /** the opponent's resistance the bot fills per point of damage */
  kappa: 0.27,
  /** the ward's share of the time, linear in the bot's gauge gain per second from `from` to `to` (up to `max`); what it costs the attack
   *  (`cost` x share) and the share of its protection the blows meet (`hit`) */
  ward: { from: 1.55, to: 2.4, max: 0.44, cost: 0.45, hit: 0.8 },
};
/** how sharply the race decides a duel of 5 to 10 minutes (fitted with the constants above: long duels leave little to chance) */
export const DYN_RACE_SLOPE = 14;

const meanOf = (r: [number, number]) => (r[0] + r[1]) / 2;
function seqMix(p: DynProfile) {
  const W = p.weights, tot = W.combo + W.singleLight + W.singleHeavy, ns: number[] = [];
  for (let n = p.comboLen[0]; n <= p.comboLen[1]; n++) ns.push(n);
  return { wc: W.combo / tot, wl: W.singleLight / tot, wh: W.singleHeavy / tot, ns, nMean: ns.reduce((a, n) => a + n, 0) / ns.length };
}

/** the opponent's mean cycle (s): a sequence (from its first blow's start to the end of its last), then the time it leaves (its last
 *  recovery and its pause) */
export function dynCycle(p: DynProfile): { seq: number; free: number; T: number; phi: number } {
  const A = DYNAMIC_DATA.actions, L = A.m_slash, H = A.m_heavy, k = seqMix(p);
  const lT = p.light.impactAt + L.follow, hT = p.heavy.impactAt + H.follow, gap = meanOf(p.comboGap);
  const combo = k.ns.reduce((a, n) => a + (n - 1) * (lT + L.recover + gap) + hT, 0) / k.ns.length;
  const seq = k.wc * combo + k.wl * lT + k.wh * hT;
  const free = (k.wc + k.wh) * H.recover + k.wl * L.recover + meanOf(DYNAMIC_DATA.restByLevel[p.level]);
  return { seq, free, T: seq + free, phi: free / (seq + free) };
}

/** a sequence against the reference defender at skill s, without its ward: the damage it takes and what its gauge takes */
export function dynPerSequence(p: DynProfile, s: number, damage = 1): { dmg: number; res: number } {
  const D = DYNAMIC_DATA, R = DYN_RACE, gr = D.guard.reduce, k = seqMix(p);
  const G = 0.2 + 0.6 * s, Dh = (0.25 + 0.65 * s) * (s >= 0.5 ? R.availKeep : R.availLow), pi = R.push;
  // the guard raised after the bot's reaction delay meets the first blow only if it is up before the impact
  const react0 = 0.32 - 0.22 * s, inTime = (impact: number) => Math.max(0, Math.min(1, (impact - D.guard.raiseTime - react0) / 0.08));
  const mL = 1 - gr * G, mH = (1 - Dh) * (1 - gr * G);
  const fL = pi + (1 - pi) * (1 - gr * G * inTime(p.light.impactAt)), fH = pi + (1 - pi) * (1 - Dh) * (1 - gr * G * inTime(p.heavy.impactAt));
  const l = p.light.damage * damage, h = p.heavy.damage * damage, rl = p.light.resist, rh = p.heavy.resist;
  const dmg = k.wc * (l * fL + (k.nMean - 2) * l * mL + h * mH) + k.wl * l * fL + k.wh * h * fH;
  const res = k.wc * ((k.nMean - 1) * rl + rh * (1 - Dh)) + k.wl * rl + k.wh * rh * (1 - (1 - pi) * Dh);
  return { dmg, res };
}

/** both sides' damage per second in a duel against this profile, the reference defender at skill s (pd, ed: damage multipliers) */
export function dynRates(p: DynProfile, s: number, pd = 1, ed = 1): { player: number; enemy: number; ward: number; stun: number } {
  const D = DYNAMIC_DATA, R = DYN_RACE, c = dynCycle(p), q = dynPerSequence(p, s, ed), Tb = D.resist.breakStun + D.ai.afterStun;
  const t = Math.max(0, Math.min(1, s)) * 4, i = Math.min(3, Math.floor(t)), base = R.rate[i] + (R.rate[i + 1] - R.rate[i]) * (t - i);
  // the opponent's stun share: its gauge filled during its pauses, emptied by time
  const stunShare = (rate: number) => { const fill = R.kappa * rate * c.phi - D.resist.decay; return fill > 0 ? D.resist.breakStun / (D.resist.max / fill + Tb) : 0; };
  // the ward's share, from what the bot's own gauge takes per second
  const gamma = (1 - stunShare(base)) * q.res / c.T;
  const ward = R.ward.max * Math.max(0, Math.min(1, (gamma - R.ward.from) / (R.ward.to - R.ward.from)));
  const rate = base * (1 - R.ward.cost * ward), stun = stunShare(rate);
  // a break comes in a pause: it replaces what is left of it (half, on average) by the stun and the wait after it
  const lost = stun > 0 ? Math.max(0, Tb - c.free / 2) / D.resist.breakStun * stun : 0;
  const player = ((1 - stun) * c.phi * rate + stun * (R.stunRate[0] + R.stunRate[1] * s)) * pd;
  const enemy = (1 - lost) * q.dmg * (1 - (1 - D.actions.d1.ward!.damage) * R.ward.hit * ward) / c.T;
  return { player, enemy, ward, stun };
}
/** an opponent kit's damage per second against the reference defender at skill s, under the new rules */
export function dynEnemyDps(p: DynProfile, s: number, damage = 1): number { return dynRates(p, s, 1, damage).enemy; }

/** P(the player kit at skill s, with its modifiers, beats this profile) under the new rules: each side's time to the K.O. */
export function dynPlayerWinChance(p: DynProfile, s: number, pm: Mods = {}, em: Mods = {}): number {
  const r = dynRates(p, s, pm.damage ?? 1, em.damage ?? 1);
  return raceWinChance({ hp: DYNAMIC_DATA.fighters.ren.maxHp * (pm.hp ?? 1), dps: r.player }, { hp: p.maxHp * (em.hp ?? 1), dps: r.enemy }, 0, DYN_RACE_SLOPE);
}
/** a competitor in the off-screen race of the new rules: its health and its damage against the reference defender */
export function dynRacerOf(p: DynProfile, m: Mods = {}): Racer { return { hp: p.maxHp * (m.hp ?? 1), dps: dynEnemyDps(p, REFERENCE_SKILL, m.damage ?? 1) }; }
