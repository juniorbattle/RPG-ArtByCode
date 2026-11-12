import { autoDuel, type AutoAction, type AutoBrain, type AutoEffect, type AutoFamily, type AutoFighter, type AutoResult } from './auto';
import { KIT_VIV, POWER, RIVAL_SHEETS, type FighterStats, type Stage } from './stats';
import { LEVEL_POWER, SKILLS, clampLevel, type Times } from './skills';

/** The duel played by the computer: its own data (lot 1, briefs/combat-auto.md § 17.3). The fighters of today's duel (src/combat/v2duel.ts, profiles.ts,
 *  dynamic.ts) are left as they are, the duel of today stays on screen until lot 2; these tables are the new duel's, built from the same sources by the
 *  workshop's prototype (tools/auto-duel/kits.mjs, journal Passe AC3) and then its own: the skills and the weapons balanced to the test of AC-12, the
 *  race of AC-16 (A3). The heavy attack, the skills' charge times at their levels and the levels' power stay the catalogue's (src/combat/skills.ts). Pure. */

// ------------------------------------------------------------------------------------------------------------------------------------ Ren

/** Ren's light attack: 1.2 s of charge at Speed 10, its power 6 (DB5-5), a tenth of it to the gauge; +1 AP when it lands (AC-03) */
export const AUTO_LIGHT = { charge: 1.2, power: POWER.light, gauge: POWER.light * 0.1 };
/** each weapon's enchaînement (AC-02, « l'arme de Ren »): the hits of the light attack, each one's share of its power and gauge, the gap between them (s) */
export const AUTO_WEAPONS: Record<string, { hits: readonly number[]; gap: number }> = {
  'training-sword': { hits: [0.55, 0.55], gap: 0.3 },
  'imported-blade': { hits: [0.62, 0.62], gap: 0.32 },
  'duelist-sabre': { hits: [0.42, 0.42, 0.42], gap: 0.22 },
};

/** one of Ren's skills on the timeline, at level 1 (the level raises its power or its effect's length by LEVEL_POWER and shortens its charge: skills.ts) */
export interface AutoSkillDef {
  family: AutoFamily;
  /** its AP */
  ap: number;
  /** an offensive skill's power at level 1 against the Thrust's 120 by its charge time (DB5-1: « les autres au prorata de leur temps de charge ») × powerK */
  powerK?: number;
  /** what its power adds to the gauge (the skills more than the light: DB-5); a breaker (Tourbillon, Fracas) × 2.5 */
  gaugeK?: number;
  pierce?: boolean;
  hits?: readonly number[];
  gap?: number;
  /** a ward's or a boost's effect at level 1 */
  ward?: AutoEffect;
  boost?: AutoEffect;
  /** a ward the automatic raises to cover, not only against a blow seen coming (AutoAction.cover) */
  cover?: boolean;
  /** its charge times by level when they are not the catalogue's */
  charge?: Times;
}
const GAUGE_SKILL = 0.25, BREAKER = 2.5;
/** the thirteen skills (src/combat/skillbook.ts): the heavy attack, today's six, the six of the version 2 */
export const AUTO_SKILLS: Record<string, AutoSkillDef> = {
  heavy: { family: 'offensive', ap: 1 },
  t1: { family: 'offensive', ap: 2, hits: [0.5, 0.5], gap: 0.25 },
  t2: { family: 'offensive', ap: 2, pierce: true },
  t3: { family: 'offensive', ap: 3, gaugeK: BREAKER, hits: [0.36, 0.36, 0.36], gap: 0.25 },
  t4: { family: 'offensive', ap: 4 },
  d1: { family: 'defensive', ap: 2, ward: { dur: 9, dmg: 0.6, gauge: 0.5 } },
  s1: { family: 'support', ap: 3, boost: { dur: 12, dmg: 1.25, gauge: 1.5 } },
  k_sunder: { family: 'offensive', ap: 2, gaugeK: BREAKER },
  k_feint: { family: 'offensive', ap: 1, pierce: true },
  k_iron: { family: 'defensive', ap: 2, ward: { dur: 11.2, dmg: 0.8, gauge: 0.3 } },
  k_parry: { family: 'defensive', ap: 1, ward: { dur: 4.8, dmg: 0.35, gauge: 0.6 } },
  k_cry: { family: 'support', ap: 2, boost: { dur: 7.5, dmg: 1.45, gauge: 1.2 } },
  k_focus: { family: 'support', ap: 2, boost: { dur: 13, dmg: 1.1, gauge: 2 } },
};
/** DB5-3 « 5 × le temps de charge » (A3): a skill comes back this many times its charge time at level 1 after it leaves */
export const AUTO_COOLDOWN = 5;

/** a skill's charge time at a level (the catalogue's unless the new duel gives its own) */
export function autoCharge(id: string, level: number): number {
  const d = AUTO_SKILLS[id], t = d?.charge ?? SKILLS[id]?.charge;
  if (!t) throw new Error(`no skill "${id}" in the catalogue`);
  return t[clampLevel(level) - 1];
}
/** an offensive skill's power at a level (the Thrust's 120 at level 1, the others by their charge time, × powerK, × the level's power) */
export function autoPower(id: string, level: number): number {
  return POWER.thrust * (autoCharge(id, 1) / autoCharge('t4', 1)) * (AUTO_SKILLS[id].powerK ?? 1) * LEVEL_POWER[clampLevel(level) - 1];
}

/** one of Ren's skills as an action, at its level; `effect` his gear's share on a ward's or a boost's length (the fervour charm) */
export function autoSkill(id: string, level: number, effect = 1): AutoAction {
  const d = AUTO_SKILLS[id];
  if (!d) throw new Error(`no skill "${id}" in the catalogue`);
  const lv = clampLevel(level), k = LEVEL_POWER[lv - 1];
  const a: AutoAction = { id, kind: id === 'heavy' ? 'heavy' : 'skill', family: d.family, charge: autoCharge(id, lv), ap: d.ap, cooldown: AUTO_COOLDOWN * autoCharge(id, 1) };
  if (id === 'heavy') a.heavy = true;
  const eff = (e: AutoEffect): AutoEffect => ({ dur: +(e.dur * k * effect).toFixed(2), dmg: e.dmg, gauge: e.gauge });
  if (d.ward) { a.ward = eff(d.ward); if (d.cover) a.cover = true; }
  else if (d.boost) a.boost = eff(d.boost);
  else {
    a.power = autoPower(id, lv); a.gauge = a.power * GAUGE_SKILL * (d.gaugeK ?? 1);
    if (d.pierce) a.pierce = true;
    if (d.hits) { a.hits = d.hits; a.gap = d.gap; }
  }
  return a;
}

/** Ren's light attack with his weapon's enchaînement */
export function autoLight(weapon?: string | null): AutoAction {
  const w = AUTO_WEAPONS[weapon ?? ''] ?? AUTO_WEAPONS['training-sword'];
  return { id: 'light', kind: 'light', charge: AUTO_LIGHT.charge, power: AUTO_LIGHT.power, gauge: AUTO_LIGHT.gauge, ap: 0, hits: w.hits, gap: w.gap };
}

/** the order the automatic follows when the player has set none (AC-09): the wards and the boosts first (their own conditions decide when they hold), then
 *  the offensive skills from the strongest at their levels, as a player who knows the duel would set them */
export function autoDefaultOrder(loadout: readonly string[], levels: Record<string, number>): string[] {
  const fam = (id: string) => AUTO_SKILLS[id]?.family;
  const off = loadout.filter((id) => fam(id) === 'offensive').map((id, i) => ({ id, i, p: autoPower(id, levels[id] ?? 1) })).sort((a, b) => b.p - a.p || a.i - b.i).map((x) => x.id);
  return [...loadout.filter((id) => fam(id) === 'defensive'), ...loadout.filter((id) => fam(id) === 'support'), ...off];
}

export interface AutoKit { loadout: readonly string[]; levels: Record<string, number>; order?: readonly string[] }
/** Ren as a fighter: his stats (for the bout: his gear, his training, his vigour), his four skills in his order, his weapon; what a state adds on top (the
 *  injury's share of his health, the AP of his gear and a friend, the night's tampering, his gear's share on the effects' length) */
export function autoRen(stats: FighterStats, kit: AutoKit, o: { weapon?: string | null; hpShare?: number; apStart?: number; taken?: number; effect?: number; brain?: AutoBrain } = {}): AutoFighter {
  const order = kit.order?.length ? kit.order.filter((id) => kit.loadout.includes(id)) : autoDefaultOrder(kit.loadout, kit.levels);
  for (const id of kit.loadout) if (!order.includes(id)) order.push(id);
  return {
    id: 'ren', side: 'ren', hp: stats.hp * (o.hpShare ?? 1), atk: stats.atk, def: stats.def, end: stats.end, viv: stats.viv, tempo: 10,
    apStart: o.apStart ?? 0, taken: o.taken ?? 1, light: autoLight(o.weapon), skills: order.map((id) => autoSkill(id, kit.levels[id] ?? 1, o.effect ?? 1)), brain: o.brain ?? 'player',
  };
}

// --------------------------------------------------------------------------------------------------------------------------------- the rivals

/** a rival's kit on the timeline (C3's, src/combat/v2duel.ts and profiles.ts, as the prototype read them): its light attack's charge by its level of today
 *  (Tobin slow, Vessa quick), its heavy blow 1.6 × that charge, a combo of `n` light blows 1.4 × it, each three quarters of a light blow, `gap` s apart;
 *  its own skills (an offensive one's charge from its wind-up, its power by its charge against 3.5 s; a ward or a boost charged 2.5 s), each at its own
 *  cooldown and weight; its habits (the share of its choices a ready skill takes, its heavy blow's, its combo's among its light blows); its traits (today's
 *  dodge, half its guard: AC-05) */
/** `gaugeK`: what an offensive skill adds to the gauge against its power × 0.25 (a rival's breaker: its blow made to break the guard) */
export interface AutoFoeSkill { id: string; family: AutoFamily; charge: number; cooldown: number; weight: number; ward?: AutoEffect; boost?: AutoEffect; gaugeK?: number }
export interface AutoFoeDef {
  light: number; combo: { n: number; gap: number }; skills: AutoFoeSkill[];
  ai: { chance: number; heavy: number; combo: number }; traits: { dodge: number; guard: number };
}
const offS = (id: string, charge: number, cooldown: number, weight = 2): AutoFoeSkill => ({ id, family: 'offensive', charge, cooldown, weight });
const wardS = (id: string, dur: number, cooldown: number): AutoFoeSkill => ({ id, family: 'defensive', charge: 2.5, cooldown, weight: 1, ward: { dur, dmg: 0.6, gauge: 0.5 } });
const boostS = (id: string, dur: number, cooldown: number): AutoFoeSkill => ({ id, family: 'support', charge: 2.5, cooldown, weight: 1, boost: { dur, dmg: 1.25, gauge: 1.4 } });
export const AUTO_FOES: Record<string, AutoFoeDef> = {
  vessa: { light: 1.9, combo: { n: 4, gap: 0.26 }, skills: [offS('m_lunge', 3, 16), boostS('m_tempo', 7, 30), wardS('m_brace', 6, 36)], ai: { chance: 0.3, heavy: 0.25, combo: 0.842 }, traits: { dodge: 0.35, guard: 0.05 } },
  tobin: { light: 2.8, combo: { n: 3, gap: 0.38 }, skills: [offS('m_wild', 3.9, 20), boostS('m_grit', 6, 36)], ai: { chance: 0.22, heavy: 0.38, combo: 0.563 }, traits: { dodge: 0, guard: 0 } },
  cassius: { light: 2.5, combo: { n: 3, gap: 0.36 }, skills: [offS('m_riposte', 3.4, 20), boostS('m_gild', 8, 32), wardS('m_brace', 6, 36)], ai: { chance: 0.3, heavy: 0.46, combo: 0.571 }, traits: { dodge: 0.2, guard: 0.1 } },
  orla: { light: 2.2, combo: { n: 3, gap: 0.33 }, skills: [offS('m_shoulder', 3.7, 22), wardS('m_brace', 6, 34)], ai: { chance: 0.25, heavy: 0.45, combo: 0.667 }, traits: { dodge: 0, guard: 0.075 } },
  ilse: { light: 2.5, combo: { n: 3, gap: 0.33 }, skills: [offS('m_smite', 3.8, 22), wardS('m_aegis', 7, 34), boostS('m_prayer', 6, 36)], ai: { chance: 0.28, heavy: 0.367, combo: 0.625 }, traits: { dodge: 0, guard: 0.15 } },
  marek: { light: 2.2, combo: { n: 3, gap: 0.33 }, skills: [offS('m_ironfall', 4.3, 26), wardS('m_bulwark', 7, 34), boostS('m_resolve', 8, 40)], ai: { chance: 0.32, heavy: 0.4, combo: 0.75 }, traits: { dodge: 0, guard: 0.175 } },
  rhosk: { light: 2.5, combo: { n: 3, gap: 0.38 }, skills: [offS('m_cleave', 4.4, 26), boostS('m_roar', 8, 34), wardS('m_hide', 7, 36)], ai: { chance: 0.28, heavy: 0.54, combo: 0.583 }, traits: { dodge: 0, guard: 0.075 } },
};
/** a rival's blows at equal stats (POWER: the DB7 sheet's, ×2 with Ren's health since DB11-6): its light blow, its heavy one, an offensive skill of 3.5 s */
const FOE_HEAVY_CHARGE = 1.6, FOE_COMBO_CHARGE = 1.4, FOE_COMBO_SHARE = 0.75, FOE_SKILL_REF = 3.5, FOE_GAUGE_LIGHT = 0.1;
/** the rivals' cadence (the operator's note on AC-01, word for word « mais il faut s'assurer que cela soit rythme, dynamique », journal Passe AC4): a rival's
 *  light attack's and combo's charge × `light`, its heavy blow's and its skills' × `big`, each one's power × the same (its damage and its gauge a second
 *  kept), a skill's cooldown unchanged; 1 = the prototype's */
export const AUTO_CADENCE = { light: 1, big: 1 };
const r2 = (x: number): number => +x.toFixed(2);

/** a rival's actions: its light attack, its combo, its heavy blow and its skills (`skills`, the heavy blow first) */
export function autoFoeActions(kitOf: string): Pick<AutoFighter, 'light' | 'combo' | 'skills' | 'ai'> {
  const K = AUTO_FOES[kitOf] ?? AUTO_FOES.marek, c = AUTO_CADENCE.light, cb = AUTO_CADENCE.big, cL = K.light * c, n = K.combo.n, pl = POWER.foeLight * c;
  const light: AutoAction = { id: 'm_light', kind: 'light', charge: cL, power: pl, gauge: pl * FOE_GAUGE_LIGHT, ap: 0 };
  const cp = pl * FOE_COMBO_SHARE * n;
  const combo: AutoAction = { id: 'm_combo', kind: 'light', charge: r2(cL * FOE_COMBO_CHARGE), power: cp, gauge: cp * FOE_GAUGE_LIGHT, ap: 0, hits: Array(n).fill(1 / n), gap: K.combo.gap };
  const heavy: AutoAction = { id: 'm_heavy', kind: 'skill', heavy: true, charge: K.light * cb * FOE_HEAVY_CHARGE, power: POWER.foeHeavy * cb, gauge: POWER.foeHeavy * cb * GAUGE_SKILL, ap: 0 };
  const skills: AutoAction[] = [heavy, ...K.skills.map((s): AutoAction => {
    const a: AutoAction = { id: s.id, kind: 'skill', family: s.family, charge: s.charge * cb, ap: 0, cooldown: s.cooldown, weight: s.weight };
    if (s.ward) a.ward = { ...s.ward };
    else if (s.boost) a.boost = { ...s.boost };
    else { a.power = POWER.foeSkill * (s.charge / FOE_SKILL_REF) * cb; a.gauge = a.power * GAUGE_SKILL * (s.gaugeK ?? 1); }
    return a;
  })];
  return { light, combo, skills, ai: { ...K.ai } };
}

/** a rival or a generic fighter as a fighter: its sheet for the bout (autoRaceSheet), its kit (`kitOf`: its own, a generic fighter's rival's), its tempo the
 *  Speed its kit was written at (KIT_VIV), its traits */
export function autoFoe(id: string, sheet: FighterStats, o: { kitOf?: string; brain?: AutoBrain; side?: 'ren' | 'foe' } = {}): AutoFighter {
  const kitOf = o.kitOf ?? (AUTO_FOES[id] ? id : 'marek'), T = AUTO_FOES[kitOf]?.traits ?? { dodge: 0, guard: 0 };
  return {
    id, side: o.side ?? 'foe', hp: sheet.hp, atk: sheet.atk, def: sheet.def, end: sheet.end, viv: sheet.viv, tempo: KIT_VIV[kitOf] ?? 10, apStart: 0, taken: 1,
    dodgeBonus: T.dodge, guardBonus: T.guard, ...autoFoeActions(kitOf), brain: o.brain ?? 'rival',
  };
}

// --------------------------------------------------------------------------------------------------------------------------------- the race

/** The race of the rivals (the operator's AC-16 « La course, niveau commun en poule, +10 % par tour (décision A3 : change DB7-5, DB7-6, DB11-2) », journal
 *  Passe AC4): each rival keeps the shape of its sheet (DB7-5's RIVAL_SHEETS), brought to a common level in the pool (`norm`: its health, Attack, Defence and
 *  Endurance × the same factor; its pool Speed kept the whole tournament), then +10 % each round of the pool (`pool`: the rounds of days 2, 4, 5) and a lot at
 *  each stage of the final phase (`stage`: the bracket, the final); its preparation as visible Attack points, +1 per `prepPer` over `prepFrom` (AC-17). */
export const AUTO_RACE = {
  norm: { vessa: 0.974, tobin: 1.333, cassius: 1.084, orla: 0.877, ilse: 0.987, marek: 0.826, rhosk: 0.948 } as Record<string, number>,
  pool: [1, 1.1, 1.2] as readonly number[],
  stage: { 1: 1.267, 2: 1.533 } as Record<1 | 2, number>,
  prepFrom: 20, prepPer: 25,
};
/** a bout's round of the pool by its day: day 2 the first, day 4 the second, day 5 the third (a challenge of the pool by its day) */
export const autoRound = (day: number): 0 | 1 | 2 => (day <= 2 ? 0 : day <= 4 ? 1 : 2);
/** the factor of a rival's sheet at a stage (and a round of the pool) */
export function autoRaceFactor(id: string, stage: Stage, round = 0): number {
  return (AUTO_RACE.norm[id] ?? 1) * (stage === 0 ? AUTO_RACE.pool[round] ?? 1 : AUTO_RACE.stage[stage]);
}
/** a rival's preparation as Attack points (AC-17, shown on the match sheet) */
export const autoPrepPoints = (preparation: number): number => Math.max(0, (preparation - AUTO_RACE.prepFrom) / AUTO_RACE.prepPer);
/** a rival's sheet for a bout: its shape at its stage, its preparation's Attack points, an injury's share of its health (`hp`) */
export function autoRaceSheet(id: string, stage: Stage, round = 0, o: { preparation?: number; hp?: number } = {}): FighterStats {
  const b = RIVAL_SHEETS[id] ?? RIVAL_SHEETS.marek, k = autoRaceFactor(RIVAL_SHEETS[id] ? id : 'marek', stage, round);
  return { hp: b.hp * k * (o.hp ?? 1), atk: b.atk * k + autoPrepPoints(o.preparation ?? AUTO_RACE.prepFrom), def: b.def * k, end: b.end * k, viv: b.viv };
}
/** a generic fighter's sheet: the rival it fights like, at the race's level, lower by its own shares (src/narrative/generics.ts: its health, its blows) */
export function autoGenericSheet(profile: string, share: { hp: number; damage: number }, stage: Stage, round = 0): FighterStats {
  const r = autoRaceSheet(profile, stage, round);
  return { ...r, hp: r.hp * share.hp, atk: r.atk * share.damage };
}

// ------------------------------------------------------------------------------------------------------------------------- an off-screen bout

/** A bout the player does not fight, played by the same duel, the AI on both sides (the operator's AC-18 « La même simulation, l'IA des deux côtés »;
 *  TOURNAMENT § 6: « du même modèle de stats/règles »): both rivals at the bout's stage and round, their preparation in Attack points, an injury's share of
 *  their health. Nothing of the game plays it yet but a laboratory's game (lot 2 wires it with the duel). */
export function autoOffscreen(a: string, b: string, o: { stage: Stage; round?: number; seed: number; a?: { preparation?: number; hp?: number }; b?: { preparation?: number; hp?: number } }): AutoResult {
  const A = autoFoe(a, autoRaceSheet(a, o.stage, o.round ?? 0, o.a ?? {}), { side: 'ren' }), B = autoFoe(b, autoRaceSheet(b, o.stage, o.round ?? 0, o.b ?? {}));
  return autoDuel(A, B, o.seed);
}
