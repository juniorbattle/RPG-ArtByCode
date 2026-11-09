/** The fighters' statistics (the operator's DB7 sheet of 2026-11-09, read back in journal Passe DB8; briefs/combat-system.md § 19,
 *  briefs/stats-combattants.md). His words, after the DB6 sheet: « nous basons les actions d'un combattant par ses stats personnelles  ameliorer a
 *  travers les equipement  et/ou le niveau gagnes etc... bref c'est un rpg notre jeu ». His choices, each a decision A3 recorded word for word:
 *  DB7-1 « Ajouter la Vivacité (vitesse de charge) » (note: « certains adversaires seront plus rapide que d'autres et il en est de meme pour notre
 *  protagonist »), DB7-2 « Des points, le reste gardé », DB7-3 « +1 à la stat choisie, pour le prochain combat », DB7-4 « +12 PV par victoire »,
 *  DB7-5 « Ces fiches », DB7-6 « Tableau ×1,3 et stats ; finale ×2,5 et stats ». Every fighter of a version 2 duel has five stats:
 *  - a blow's damage = its power × 2·Atk / (Atk + Def): ×1 at equal stats, diminishing returns, never zero;
 *  - what a blow adds to the target's gauge × 10 / the target's Endurance;
 *  - Ren's charge times × 10 / his Speed; a rival's tempo (its blows' wind-up, a combo's gaps, its pauses) × its sheet's Speed / its Speed now.
 *  The player's powers follow the DB5 sheet: the light attack 1 % of a bar of 600 at equal stats (DB5-5 « 1 % »), the Thrust 20 % (DB5-1), every
 *  other offensive skill in proportion to its charge time at level 1, its level's power over it. The numbers are starting points, recalibrated on
 *  whole games (DB4-5 « Recaler pour garder six sur dix »). Pure. */

import { LEVEL_POWER, chargeTime, clampLevel } from './skills';

export type StatId = 'hp' | 'atk' | 'def' | 'end' | 'viv';
export interface FighterStats { hp: number; atk: number; def: number; end: number; viv: number }
/** the stats a training session may raise (DB7-3: « la stat choisie »; health is the vigour's, DB7-4) */
export const TRAINED_STATS = ['atk', 'def', 'end', 'viv'] as const;
export type TrainedStat = (typeof TRAINED_STATS)[number];

/** Ren at the start of a game */
export const REN_BASE: FighterStats = { hp: 150, atk: 10, def: 10, end: 10, viv: 10 };
/** DB7-4 « +12 PV par victoire »: every bout won, the tournament's or a challenge's, health only (PROJECT_MASTER_CONTRACT § 7) */
export const VIGOUR_HP = 12;
/** a training session (DB7-3): +1 to the stat chosen, for the next bout, two sessions at most (TRAIN_MAX, src/simulation/v2gear.ts) */
export const TRAIN_POINT = 1;

/** the seven rivals' sheets at the pool (DB7-5 « Ces fiches »): each one's identity, the health within DB4-4's 500 to 700; the Speed read from the
 *  tempo their kits already have (their pauses by level, DYN_LEVELS, and their blows' wind-up: journal Passe DB8) */
export const RIVAL_SHEETS: Record<string, FighterStats> = {
  vessa: { hp: 500, atk: 7, def: 8, end: 7, viv: 13 },
  tobin: { hp: 520, atk: 9, def: 8, end: 8, viv: 9 },
  cassius: { hp: 560, atk: 11, def: 10, end: 9, viv: 10 },
  orla: { hp: 600, atk: 12, def: 11, end: 11, viv: 11 },
  ilse: { hp: 620, atk: 10, def: 12, end: 11, viv: 10 },
  marek: { hp: 650, atk: 13, def: 13, end: 12, viv: 10 },
  rhosk: { hp: 700, atk: 12, def: 10, end: 13, viv: 8 },
};

/** the tournament's stages (DB7-6): the pool (days 1 to 5), the bracket (days 6 to 8: the semi-finals, the Gate, the major match), the final (day 10) */
export type Stage = 0 | 1 | 2;
/** what a stage adds to a rival's sheet (its health multiplied): DB7-6 « Tableau ×1,3 et stats ; finale ×2,5 et stats »; the Speed does not grow */
export const STAGE_GROWTH: Record<Stage, { hp: number; atk: number; def: number; end: number }> = {
  0: { hp: 1, atk: 0, def: 0, end: 0 },
  1: { hp: 1.3, atk: 3, def: 3, end: 2 },
  2: { hp: 2.5, atk: 1, def: 3, end: 2 },
};
/** a bout's stage: the final when it is one, the bracket from day 6, the pool before (a challenge in town by its day) */
export const stageOf = (day: number, final = false): Stage => (final ? 2 : day >= 6 ? 1 : 0);

/** a rival's sheet at a stage */
export function rivalSheet(id: string, stage: Stage = 0): FighterStats {
  const b = RIVAL_SHEETS[id] ?? RIVAL_SHEETS.marek, g = STAGE_GROWTH[stage];
  return { hp: b.hp * g.hp, atk: b.atk + g.atk, def: b.def + g.def, end: b.end + g.end, viv: b.viv };
}
/** a generic fighter's sheet: the rival whose blows it borrows, lower (its health and attack by its own shares: src/narrative/generics.ts) */
export function borrowedSheet(profile: string, share: { hp: number; damage: number }, stage: Stage = 0): FighterStats {
  const r = rivalSheet(profile, stage);
  return { ...r, hp: r.hp * share.hp, atk: +(r.atk * share.damage).toFixed(2) };
}

/** the damage formula's factor: 2·Atk / (Atk + Def) */
export const hitFactor = (atk: number, def: number): number => (2 * atk) / Math.max(1e-6, atk + def);
/** what a blow adds to a gauge, by the target's Endurance */
export const gaugeFactor = (end: number): number => 10 / Math.max(1, end);
/** the charge times (Ren) or the tempo (a rival), by the Speed: a time × base / Speed */
export const speedFactor = (viv: number, base = 10): number => base / Math.max(1, viv);

/** the actions' power at equal stats (the bar of 600 for the player's, Ren's 150 for the rivals'): the light attack 1 % (DB5-5), the Thrust 20 %
 *  (DB5-1); a rival's light blow, its heavy and an offensive skill 4 %, 11 % and 17 % of Ren's bar: the DB7 sheet's own (5.6, 16.8, 25.2). The
 *  operator's answer of 2026-11-09 to « Which reference should six bouts in ten be measured on? »: « The DB7 sheet's curve » (journal Passe DB10): the
 *  sheet's expected player, not the TournamentLab's (x 0.72 in journal Passe DB9, its prepared player never drilling his skills) */
export const POWER = { light: 6, thrust: 120, foeLight: 5.6, foeHeavy: 16.8, foeSkill: 25.2 } as const;

/** an offensive skill's power at a level, before the stats (the Thrust's 120 at level 1, the others by their charge time at level 1, the level's
 *  power over it: src/combat/skills.ts); the duel multiplies it by the formula (src/combat/v2duel.ts applyStats), the skills page shows it (DB7-7) */
export function skillPower(id: string, level: number): number {
  return POWER.thrust * (chargeTime(id, 1) / chargeTime('t4', 1)) * LEVEL_POWER[clampLevel(level) - 1];
}

/** The DB5 sheet's rules (journal Passes DB5 / DB6): DB5-2 « 90 %, garde à −80 % » (the rivals guard 90 % of the player's blows in their pauses;
 *  the guard takes 80 % off, one rule for both), DB5-3 « 5 × le temps de charge » (A3: a skill comes back 5 times its charge time at level 1 after
 *  it leaves), DB5-4 « 10 s, ×2, jauge de 70 » (A3: the break) */
export const DB5 = { foeGuard: 0.9, guardReduce: 0.8, cooldown: 5, breakStun: 10, breakDamage: 2, gauge: 70 } as const;

/** a stat's value as the pages show it: a whole number, or one decimal */
export const statText = (n: number): string => (Math.abs(n - Math.round(n)) < 0.05 ? String(Math.round(n)) : n.toFixed(1));
