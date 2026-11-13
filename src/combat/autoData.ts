import { autoDuel, type AutoAction, type AutoBrain, type AutoCond, type AutoEffect, type AutoFamily, type AutoFighter, type AutoResult } from './auto';
import { POWER, RIVAL_SHEETS, type FighterStats, type Stage } from './stats';
import { LEVEL_POWER, SKILLS, clampLevel, type Times } from './skills';

/** The duel played by the computer: its own data (lot 1 of the first redesign, briefs/combat-auto.md § 17.3; the same tables for every fighter since lot 1 of
 *  the second, § 26, journal Passes SY1 / SY2). The fighters of the duel of before (src/combat/v2duel.ts, profiles.ts, dynamic.ts) are left as they are for
 *  `?duel=charge`. Every fighter, Ren as a rival (the operator's SY-01 « Les six changements : les mêmes règles pour tous »): a light attack (1.2 s at Speed
 *  10, its weapon's enchaînement), a heavy blow (the catalogue's heavy attack, SY-02, A3), its skills (a skill's power by its charge, DB5-1; its AP; its DB5-3
 *  cooldown), every charge × 10 / its Speed and the common cadence (SY-03). A rival's identity is its kit (its weapon, its skills, its order) and its sheet. Pure. */

// ------------------------------------------------------------------------------------------------------------------------------- the common tables

/** the common cadence, Ren's and the rivals': every charge × `charge` (the cooldowns with them, DB5-3), every power × `power` (a blow's weight), an enchaînement's
 *  gaps × `gap`, a ward's or a boost's length × `effect`. SY-03 « ×0,6 pour tous » (journal Passe SY2) was 0.6 / 0.6 / 1 / 1; the operator's RY-1 « ×3 plus lent :
 *  environ 40 coups par minute » and RY-2 « Étirés avec le reste » (journal Passe SL3) make every time of the duel three times SY-03's, the effects with it (the
 *  same actions under them), each blow heavier so that his durations hold (SL1-2, A3) */
export const AUTO_CADENCE = { charge: 1.8, power: 3.2, gap: 3, effect: 3 };
/** the light attack: 1.2 s of charge at Speed 10, its power 6 (DB5-5), each of its hits one blow to the gauge (RY-3); +1 AP when it lands (AC-03) */
export const AUTO_LIGHT = { charge: 1.2, power: POWER.light, gauge: 1 };
/** Ren's weapons' enchaînements (AC-02, « l'arme de Ren »): the hits of the light attack, each one's share of its power and gauge, the gap between them (s) */
export const AUTO_WEAPONS: Record<string, { hits: readonly number[]; gap: number }> = {
  // balanced again on the same rules for every fighter (SY-06, the test of AC-12, journal Passe SL1): the training sword and the imported blade heavier, the sabre's
  // three cuts lighter (0.55, 0.62 and 0.23 before; its +2 Speed and +3 Attack, the gear's, made it the best weapon against nearly every rival)
  'training-sword': { hits: [0.85, 0.85], gap: 0.3 },
  'imported-blade': { hits: [0.7, 0.7], gap: 0.32 },
  'duelist-sabre': { hits: [0.17, 0.17, 0.17], gap: 0.22 },
};

/** one of Ren's skills on the timeline, at level 1 (the level raises its power or its effect's length by LEVEL_POWER and shortens its charge: skills.ts) */
export interface AutoSkillDef {
  family: AutoFamily;
  /** its AP */
  ap: number;
  /** an offensive skill's power at level 1 against the Thrust's 120 by its charge time (DB5-1: « les autres au prorata de leur temps de charge ») × powerK */
  powerK?: number;
  /** what its power adds to the gauge (the skills more than the light: DB-5); a breaker (Tourbillon, Fracas) × 1.5 */
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
/** a skill's or a heavy blow's weight on the gauge, in blows of the default count (RY-3): two light hits (the skills fill it more, DB-5), × its gaugeK (a breaker) */
const GAUGE_SKILL = 2, BREAKER = 1.5;
/** the catalogue's skills (src/combat/skillbook.ts): today's six and the six of the version 2, and the heavy attack, a base attack of every fighter since SY-02
 *  (its numbers; never one of the four). Balanced to the test of AC-12 (the operator's « Équilibrer avec ce test : chaque adversaire a ses réponses, rien ne
 *  domine », journal Passes AC4 / LC1) */
export const AUTO_SKILLS: Record<string, AutoSkillDef> = {
  heavy: { family: 'offensive', ap: 0 },
  t1: { family: 'offensive', ap: 2, hits: [0.5, 0.5], gap: 0.25 },
  t2: { family: 'offensive', ap: 2, pierce: true },
  // Tourbillon ×1.8 and the Thrust ×0.8 on the same rules (journal Passe SL1: the offensive kits fell to 2 to 21 % of the start kit's level)
  t3: { family: 'offensive', ap: 3, gaugeK: BREAKER, hits: [0.36, 0.36, 0.36], gap: 0.25, powerK: 1.8 },
  t4: { family: 'offensive', ap: 4, powerK: 0.8 },
  d1: { family: 'defensive', ap: 2, ward: { dur: 9, dmg: 0.4, gauge: 0.3 }, cover: true },
  s1: { family: 'support', ap: 2, boost: { dur: 12, dmg: 1.8, gauge: 2 } },
  k_sunder: { family: 'offensive', ap: 2, gaugeK: 2 },
  k_feint: { family: 'offensive', ap: 1, pierce: true },
  k_iron: { family: 'defensive', ap: 2, ward: { dur: 11.2, dmg: 0.3, gauge: 0.15 }, cover: true },
  k_parry: { family: 'defensive', ap: 1, ward: { dur: 6.5, dmg: 0.05, gauge: 0.5 } },
  k_cry: { family: 'support', ap: 2, boost: { dur: 7.5, dmg: 1.9, gauge: 1.5 } },
  k_focus: { family: 'support', ap: 2, boost: { dur: 13, dmg: 1.5, gauge: 4 } },
};
/** DB5-3 « 5 × le temps de charge » (A3): a skill comes back this many times its charge time at level 1 after it leaves; the heavy blow too (SY-02) */
export const AUTO_COOLDOWN = 5;

/** a skill's charge time at a level, before the cadence (the catalogue's unless the duel gives its own) */
export function autoCharge(id: string, level: number): number {
  const d = AUTO_SKILLS[id], t = d?.charge ?? SKILLS[id]?.charge;
  if (!t) throw new Error(`no skill "${id}" in the catalogue`);
  return t[clampLevel(level) - 1];
}
/** an offensive skill's power at a level, before the cadence (the Thrust's 120 at level 1, the others by their charge time, × powerK, × the level's power) */
export function autoPower(id: string, level: number): number {
  return POWER.thrust * (autoCharge(id, 1) / autoCharge('t4', 1)) * (AUTO_SKILLS[id].powerK ?? 1) * LEVEL_POWER[clampLevel(level) - 1];
}

/** one of Ren's skills as an action, at its level and the cadence; `effect` his gear's share on a ward's or a boost's length (the fervour charm) */
export function autoSkill(id: string, level: number, effect = 1): AutoAction {
  const d = AUTO_SKILLS[id];
  if (!d) throw new Error(`no skill "${id}" in the catalogue`);
  const lv = clampLevel(level), k = LEVEL_POWER[lv - 1], C = AUTO_CADENCE, c = C.charge;
  const a: AutoAction = { id, kind: id === 'heavy' ? 'heavy' : 'skill', family: d.family, charge: autoCharge(id, lv) * c, ap: d.ap, cooldown: AUTO_COOLDOWN * autoCharge(id, 1) * c };
  if (id === 'heavy') a.heavy = true;
  const eff = (e: AutoEffect): AutoEffect => ({ dur: +(e.dur * k * effect * C.effect).toFixed(2), dmg: e.dmg, gauge: e.gauge });
  if (d.ward) { a.ward = eff(d.ward); if (d.cover) a.cover = true; }
  else if (d.boost) a.boost = eff(d.boost);
  else {
    a.power = autoPower(id, lv) * C.power; a.gauge = GAUGE_SKILL * (d.gaugeK ?? 1);
    if (d.pierce) a.pierce = true;
    if (d.hits) { a.hits = d.hits; a.gap = (d.gap ?? 0.3) * C.gap; }
  }
  return a;
}
/** a fighter's heavy blow (SY-02, A3: « une attaque de base pour tous, avec sa recharge »): the catalogue's heavy attack at a level, no AP, its DB5-3 cooldown;
 *  `id` its name on the timeline (Ren's 'heavy', a rival's 'm_heavy') */
export function autoHeavy(level = 1, id = 'heavy'): AutoAction {
  return { ...autoSkill('heavy', level), id, kind: 'heavy', heavy: true, ap: 0 };
}
/** a light attack with a weapon's enchaînement, at the cadence (Ren's weapons, or a rival's: AUTO_FOES) */
export function autoLight(weapon?: string | null, id = 'light', w = AUTO_WEAPONS[weapon ?? ''] ?? AUTO_WEAPONS['training-sword']): AutoAction {
  const C = AUTO_CADENCE;
  return { id, kind: 'light', charge: AUTO_LIGHT.charge * C.charge, power: AUTO_LIGHT.power * C.power, gauge: AUTO_LIGHT.gauge, ap: 0, hits: w.hits, gap: w.gap * C.gap };
}

/** a fighter's order when its player has set none (AC-09): the wards and the boosts first (their own conditions decide when they hold), then the offensive
 *  skills from the strongest, as a player who knows the duel would set them; a rival's order (SY-01) */
export function autoDefaultOrder(loadout: readonly string[], levels: Record<string, number>): string[] {
  const fam = (id: string) => AUTO_SKILLS[id]?.family;
  const off = loadout.filter((id) => fam(id) === 'offensive').map((id, i) => ({ id, i, p: autoPower(id, levels[id] ?? 1) })).sort((a, b) => b.p - a.p || a.i - b.i).map((x) => x.id);
  return [...loadout.filter((id) => fam(id) === 'defensive'), ...loadout.filter((id) => fam(id) === 'support'), ...off];
}

export interface AutoKit { loadout: readonly string[]; levels: Record<string, number>; order?: readonly string[]; tactic?: Readonly<Record<string, string>> }
/** the order the automatic follows (AC-09): the player's (kit.order, set on the match sheet), a skill brought since taking their place after the others; else
 *  its own (autoDefaultOrder); never the heavy attack, a base attack since SY-02 */
export function autoOrderOf(kit: AutoKit): string[] {
  const loadout = kit.loadout.filter((id) => id !== 'heavy');
  const order = kit.order?.length ? kit.order.filter((id) => loadout.includes(id)) : autoDefaultOrder(loadout, kit.levels);
  for (const id of loadout) if (!order.includes(id)) order.push(id);
  return order;
}
/** Ren as a fighter: his stats (for the bout: his gear, his training, his vigour), his skills in his order, his weapon, his heavy blow at its level (the sand's
 *  drill); what a state adds on top (the injury's share of his health, the AP of his gear and a friend, the night's tampering, his gear's share on the effects'
 *  length) */
export function autoRen(stats: FighterStats, kit: AutoKit, o: { weapon?: string | null; hpShare?: number; apStart?: number; taken?: number; effect?: number; brain?: AutoBrain } = {}): AutoFighter {
  const order = autoOrderOf(kit), tactic = autoTacticOf(kit, order);
  return {
    id: 'ren', side: 'ren', hp: stats.hp * (o.hpShare ?? 1), atk: stats.atk, def: stats.def, end: stats.end, viv: stats.viv, tempo: 10,
    apStart: o.apStart ?? 0, taken: o.taken ?? 1, light: autoLight(o.weapon), heavy: autoHeavy(kit.levels.heavy ?? 1),
    skills: order.map((id) => autoSkill(id, kit.levels[id] ?? 1, o.effect ?? 1)), brain: o.brain ?? 'player', ...(tactic ? { tactic } : {}),
  };
}
/** the conditions a skill of each family may carry in a tactic (SY-08: the page offers these, the automatic's first) */
export const AUTO_CONDS_OF: Record<AutoFamily, readonly AutoCond[]> = {
  defensive: ['auto', 'ready', 'incoming', 'gauge', 'hurt', 'never'],
  support: ['auto', 'ready', 'follow', 'broken', 'finish', 'hurt', 'never'],
  offensive: ['auto', 'ready', 'broken', 'incoming', 'finish', 'hurt', 'never'],
};
/** a skill's condition in a kit's tactic (`kit.tactic`, set on the match sheet: setTactic); 'auto' when it has none or one its family does not take */
export function autoCondOf(kit: Pick<AutoKit, 'tactic'>, id: string): AutoCond {
  const c = kit.tactic?.[id] as AutoCond | undefined, fam = AUTO_SKILLS[id]?.family;
  return c && fam && AUTO_CONDS_OF[fam].includes(c) ? c : 'auto';
}
/** the tactic of Ren's four in their order, or undefined when every line is the automatic's (the fighter as before the tactic) */
export function autoTacticOf(kit: Pick<AutoKit, 'tactic'>, order: readonly string[]): AutoCond[] | undefined {
  const t = order.map((id) => autoCondOf(kit, id));
  return t.some((c) => c !== 'auto') ? t : undefined;
}

// --------------------------------------------------------------------------------------------------------------------------------- the rivals

/** a rival's skill of its own (C3's, as the workshop read them): an offensive one's charge from its wind-up (its power by that charge, DB5-1), a ward's or a
 *  boost's effect; `gaugeK` its weight on the gauge against a skill's two blows (a breaker: the brawlers' big blows, journal Passe LC1) */
export interface AutoFoeSkill { id: string; family: AutoFamily; charge: number; ward?: AutoEffect; boost?: AutoEffect; gaugeK?: number }
/** a rival's kit (SY-01): its weapon (its combo of before made its light attack's enchaînement, its blows at the training sword's total, 2 × 0.55) and its skills */
export interface AutoFoeDef { weapon: { hits: readonly number[]; gap: number }; skills: AutoFoeSkill[] }
/** a rival's skills cost 2 AP, as Ren's Rempart and Ferveur (SY-01) */
export const AUTO_FOE_AP = 2;
const offS = (id: string, charge: number, gaugeK = 1): AutoFoeSkill => ({ id, family: 'offensive', charge, ...(gaugeK !== 1 ? { gaugeK } : {}) });
const wardS = (id: string, dur: number): AutoFoeSkill => ({ id, family: 'defensive', charge: 2.5, ward: { dur, dmg: 0.6, gauge: 0.5 } });
const boostS = (id: string, dur: number): AutoFoeSkill => ({ id, family: 'support', charge: 2.5, boost: { dur, dmg: 1.25, gauge: 1.4 } });
const weaponOf = (n: number, gap: number) => ({ hits: Array(n).fill(+(1.1 / n).toFixed(4)) as readonly number[], gap });
export const AUTO_FOES: Record<string, AutoFoeDef> = {
  vessa: { weapon: weaponOf(4, 0.26), skills: [offS('m_lunge', 3), boostS('m_tempo', 7), wardS('m_brace', 6)] },
  tobin: { weapon: weaponOf(3, 0.38), skills: [offS('m_wild', 3.9, 1.6), boostS('m_grit', 6)] },
  cassius: { weapon: weaponOf(3, 0.36), skills: [offS('m_riposte', 3.4), boostS('m_gild', 8), wardS('m_brace', 6)] },
  orla: { weapon: weaponOf(3, 0.33), skills: [offS('m_shoulder', 3.7, 2), wardS('m_brace', 6)] },
  ilse: { weapon: weaponOf(3, 0.33), skills: [offS('m_smite', 3.8), wardS('m_aegis', 7), boostS('m_prayer', 6)] },
  marek: { weapon: weaponOf(3, 0.33), skills: [offS('m_ironfall', 4.3, 1.6), wardS('m_bulwark', 7), boostS('m_resolve', 8)] },
  rhosk: { weapon: weaponOf(3, 0.38), skills: [offS('m_cleave', 4.4, 2), boostS('m_roar', 8), wardS('m_hide', 7)] },
};

/** a rival's actions on the common tables: its light attack with its weapon, its heavy blow, its skills (2 AP each, DB5-3, at the cadence) in its order (the
 *  wards, the boosts, then the offensive skills from the strongest) */
export function autoFoeActions(kitOf: string): Pick<AutoFighter, 'light' | 'heavy' | 'skills'> {
  const K = AUTO_FOES[kitOf] ?? AUTO_FOES.marek, C = AUTO_CADENCE, c = C.charge;
  const skills = K.skills.map((s): AutoAction => {
    const a: AutoAction = { id: s.id, kind: 'skill', family: s.family, charge: s.charge * c, ap: AUTO_FOE_AP, cooldown: AUTO_COOLDOWN * s.charge * c };
    if (s.ward) a.ward = { ...s.ward, dur: +(s.ward.dur * C.effect).toFixed(2) };
    else if (s.boost) a.boost = { ...s.boost, dur: +(s.boost.dur * C.effect).toFixed(2) };
    else { a.power = POWER.thrust * (s.charge / autoCharge('t4', 1)) * C.power; a.gauge = GAUGE_SKILL * (s.gaugeK ?? 1); }
    return a;
  });
  const off = skills.filter((s) => !s.ward && !s.boost).map((s, i) => ({ s, i })).sort((a, b) => (b.s.power ?? 0) - (a.s.power ?? 0) || a.i - b.i).map((z) => z.s);
  return { light: autoLight(null, 'm_light', K.weapon), heavy: autoHeavy(1, 'm_heavy'), skills: [...skills.filter((s) => s.ward), ...skills.filter((s) => s.boost), ...off] };
}

/** a rival or a generic fighter as a fighter: its sheet for the bout (autoRaceSheet), its kit (`kitOf`: its own, a generic fighter's rival's), Speed 10 for its
 *  tables as every fighter's (SY-01) */
export function autoFoe(id: string, sheet: FighterStats, o: { kitOf?: string; brain?: AutoBrain; side?: 'ren' | 'foe' } = {}): AutoFighter {
  const kitOf = o.kitOf ?? (AUTO_FOES[id] ? id : 'marek');
  return { id, side: o.side ?? 'foe', hp: sheet.hp, atk: sheet.atk, def: sheet.def, end: sheet.end, viv: sheet.viv, tempo: 10, apStart: 0, taken: 1, ...autoFoeActions(kitOf), brain: o.brain ?? 'rival' };
}

// --------------------------------------------------------------------------------------------------------------------------------- the race

/** The race of the rivals (the operator's AC-16 « La course, niveau commun en poule, +10 % par tour (décision A3 : change DB7-5, DB7-6, DB11-2) », journal
 *  Passe AC4): each rival keeps the shape of its sheet (DB7-5's RIVAL_SHEETS), brought to a common level in the pool (`norm`: its health, Attack, Defence and
 *  Endurance × the same factor; its pool Speed kept the whole tournament), then a share more each round of the pool (`pool`: the rounds of days 2, 4, 5; +7.5 % a
 *  round, the operator's SL1-1 « +7,5 % par tour (décision A3 : change SY-05) », journal Passe SL2) and a lot at each stage of the final phase (`stage`: the bracket,
 *  the final); its preparation as visible Attack points, +1 per `prepPer` over `prepFrom` (AC-17). Fitted once on the rules of lot 2 (journal Passe SL3: the
 *  rhythm ×3 and the break of RY-3, SL1-3's automatic): each rival's pool factor so that the reference player of day 2 beats it 95 times in 100 (isolated duels),
 *  the bracket's and the final's on 200 whole games of the reference (seeds 1 to 100 and 301 to 400; 80 seeds left the semi-final 16 points off on held-out ones)
 *  for the semi-final's 65 % and the final's 50 % (AC-15), held out on seeds 101 to 300. */
export const AUTO_RACE = {
  norm: { vessa: 1.248, tobin: 1.721, cassius: 1.114, orla: 0.985, ilse: 1.184, marek: 1.092, rhosk: 1.62 } as Record<string, number>,
  pool: [1, 1.075, 1.15] as readonly number[],
  stage: { 1: 1.335, 2: 1.749 } as Record<1 | 2, number>,
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

/** A bout the player does not fight, played by the same duel, the same automatic on both sides (the operator's AC-18 « La même simulation, l'IA des deux
 *  côtés », SY-11; TOURNAMENT § 6: « du même modèle de stats/règles »): both rivals at the bout's stage and round, their preparation in Attack points, an
 *  injury's share of their health. */
export function autoOffscreen(a: string, b: string, o: { stage: Stage; round?: number; seed: number; a?: { preparation?: number; hp?: number }; b?: { preparation?: number; hp?: number } }): AutoResult {
  const A = autoFoe(a, autoRaceSheet(a, o.stage, o.round ?? 0, o.a ?? {}), { side: 'ren' }), B = autoFoe(b, autoRaceSheet(b, o.stage, o.round ?? 0, o.b ?? {}));
  return autoDuel(A, B, o.seed);
}
