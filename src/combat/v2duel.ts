import { checkDynData, type DynActionDef, type DynActionId, type DynData } from './dynamic';
import { skillAction } from './skillbook';
import { DYN_PROFILES, dynDuelData, type DynProfile, type Mods } from './profiles';
import { chargeTiers, type ChargeTier } from './charge';
import { CHARGE_TRIM, atLevel, chargeTime } from './skills';
import { DB5, KIT_VIV, POWER, REN_BASE, RIVAL_SHEETS, gaugeFactor, hitFactor, rivalSheet, skillPower, speedFactor, type FighterStats, type Stage } from './stats';
import { localize } from '../narrative/text';

/** The duel of the version 2 (lot V1 of briefs/cloud-session-v2-brief.md, journal Passe V1): the rules of the « tour par tour dynamique »
 *  (DynamicSim) under the three-button command and its charged attack (src/combat/charge.ts, the operator's decision A3 / AV-5), the player's
 *  skills at their levels (AV-8, src/combat/skills.ts), and lot C3, the opponents: the « sophisticated » rivals' guard and dodge, their 2 to 4
 *  skills [G3], the seven profiles plus Marek and Vessa refitted, the balance toward « modéré » (L7-4, CB-11 « Intégré à C1 / C3 »). Every
 *  number here is « proposé » (journal Passe V1), to the operator's trial. Behind the version 2's flag. Pure. */

const skill = (id: DynActionId, name: string, family: 'offensive' | 'defensive' | 'support', o: Partial<DynActionDef>): DynActionDef => ({
  id, owner: 'marek', name, kind: 'skill', family, prep: 0, impactAt: 0.3, follow: 0.24, recover: 0.2, damage: 0, resist: 0,
  anim: family === 'offensive' ? 'heavy' : family === 'defensive' ? 'block' : 'ready', ...o,
});
const off = (id: DynActionId, name: string, damage: number, impactAt: number, windowDur: number, resist: number) => skill(id, name, 'offensive', { damage, impactAt, windowDur, resist, reactable: true });
const ward = (id: DynActionId, name: string, dur: number) => skill(id, name, 'defensive', { ward: { dur, damage: 0.6, resist: 0.5 } });
const boost = (id: DynActionId, name: string, dur: number) => skill(id, name, 'support', { boost: { dur, damage: 1.25, resist: 1.4 } });

/** the opponents' skills: an offensive one is a long, telegraphed blow (the light alert of § 9, « surtout pour les compétences »), dodged or
 *  guarded; a defensive one a ward on itself, a support one a boost on itself */
export const FOE_SKILLS: Record<string, DynActionDef> = {
  m_ironfall: off('m_ironfall', 'Iron Fall', 95, 1.15, 0.5, 30),
  m_bulwark: ward('m_bulwark', 'Iron Gate', 7),
  m_resolve: boost('m_resolve', 'Champion\'s Resolve', 8),
  m_lunge: off('m_lunge', 'Quickblade Lunge', 48, 0.5, 0.26, 16),
  m_tempo: boost('m_tempo', 'Tempo', 7),
  m_shoulder: off('m_shoulder', 'Dockside Shoulder', 62, 0.85, 0.4, 22),
  m_brace: ward('m_brace', 'Brace', 6),
  m_riposte: off('m_riposte', 'Gilded Riposte', 55, 0.7, 0.34, 18),
  m_gild: boost('m_gild', 'House Colours', 8),
  m_smite: off('m_smite', 'Temple Smite', 58, 0.9, 0.42, 20),
  m_aegis: ward('m_aegis', 'Aegis', 7),
  m_prayer: boost('m_prayer', 'Vigil', 6),
  m_wild: off('m_wild', 'Wild Swing', 44, 0.95, 0.5, 14),
  m_grit: boost('m_grit', 'Farmboy Grit', 6),
  m_cleave: off('m_cleave', 'Northern Cleave', 88, 1.2, 0.5, 30),
  m_roar: boost('m_roar', 'War Roar', 8),
  m_hide: ward('m_hide', 'Bearskin', 7),
};
// the opponents' skill names in the language shown (journal Passe RG4); the duel's rules never read them
for (const a of Object.values(FOE_SKILLS)) localize(a, ['name']);

export interface V2Foe {
  /** its defence in its pauses (DynData.ai.defense) */
  defense?: { guard: number; dodge: number };
  /** its skills and the share of its sequences they take */
  skills: { chance: number; list: Array<{ id: DynActionId; weight: number; cooldown: number }> };
  /** its health and damage against today's dynamic profile (the balance toward « modéré ») */
  hp: number; damage: number;
}

/** C3: the seven rivals, Marek and Vessa among them. Defence for the « sophisticated » (Marek, Vessa, Cassius, Ilse; Rhosk and Orla a little),
 *  none for Tobin; 2 to 4 skills by level [G3] (Tobin 2, the level 2-3 rivals 2-3, Marek and Vessa 3) */
export const V2_FOES: Record<string, V2Foe> = {
  marek: { defense: { guard: 0.35, dodge: 0 }, skills: { chance: 0.32, list: [{ id: 'm_ironfall', weight: 2, cooldown: 26 }, { id: 'm_bulwark', weight: 1, cooldown: 34 }, { id: 'm_resolve', weight: 1, cooldown: 40 }] }, hp: 0.8, damage: 1.05 },
  vessa: { defense: { guard: 0.1, dodge: 0.35 }, skills: { chance: 0.3, list: [{ id: 'm_lunge', weight: 2, cooldown: 16 }, { id: 'm_tempo', weight: 1, cooldown: 30 }, { id: 'm_brace', weight: 1, cooldown: 36 }] }, hp: 0.65, damage: 0.95 },
  orla: { defense: { guard: 0.15, dodge: 0 }, skills: { chance: 0.25, list: [{ id: 'm_shoulder', weight: 2, cooldown: 22 }, { id: 'm_brace', weight: 1, cooldown: 34 }] }, hp: 0.9, damage: 1.4 },
  cassius: { defense: { guard: 0.2, dodge: 0.2 }, skills: { chance: 0.3, list: [{ id: 'm_riposte', weight: 2, cooldown: 20 }, { id: 'm_gild', weight: 1, cooldown: 32 }, { id: 'm_brace', weight: 1, cooldown: 36 }] }, hp: 0.85, damage: 1.35 },
  ilse: { defense: { guard: 0.3, dodge: 0 }, skills: { chance: 0.28, list: [{ id: 'm_smite', weight: 2, cooldown: 22 }, { id: 'm_aegis', weight: 1, cooldown: 34 }, { id: 'm_prayer', weight: 1, cooldown: 36 }] }, hp: 0.85, damage: 1.3 },
  tobin: { skills: { chance: 0.22, list: [{ id: 'm_wild', weight: 2, cooldown: 20 }, { id: 'm_grit', weight: 1, cooldown: 36 }] }, hp: 0.9, damage: 1.7 },
  rhosk: { defense: { guard: 0.15, dodge: 0 }, skills: { chance: 0.28, list: [{ id: 'm_cleave', weight: 2, cooldown: 26 }, { id: 'm_roar', weight: 1, cooldown: 34 }, { id: 'm_hide', weight: 1, cooldown: 36 }] }, hp: 0.85, damage: 1.1 },
};

/** The opponents' blows and health, and Ren's, were multipliers until the operator's DB7 sheet (V2_FOE_HIT, V2_FOE_HP, V2_REN_HP, V2_SKILL_HIT:
 *  journal Passes VP4, V2C2, DB3): since journal Passe DB8 they come from each fighter's stats (src/combat/stats.ts, briefs/combat-system.md § 19). */

/** The duel after the operator's first trial of the version 2 as the default game (his sheet of 2026-11-09, journal Passes DB2 / DB3; « Je trouve
 *  que les combats sont tres longs [...] le mieux est de spam l'attaque »): duels of 3 to 4 minutes (DB-1, decision A3), the opponent's riposte
 *  at the third light attack of its pause, never in its break (DB-2, decision A3), the player's skills four times harder (DB-4), the gauge filled
 *  by the skills and a break doubling the damage for 8 s (DB-5, decision A3), the rivals and Ren recalibrated to keep the prepared player at six
 *  bouts in ten (DB-7). Every version 2 duel, a game's bout, a challenge and `?scene=arena`; today's game (`v2=0`) and C2's duel keep theirs. */
/** what the player's skills add to the opponent's gauge, and the light attack's own share (3 before), DB-5 « Jauge par les compétences »; the light
 *  attack 0.5 since journal Passe DB9 (2 before): with the guard at −80 % (DB5-2) a player who held the guard through every sequence and only tapped
 *  broke the rivals by his taps and won four rivals in seven; the gauge is the skills' (DB-5), what each blow adds is « à régler » (§ 6) */
export const V2_SKILL_GAUGE = 3;
/** the gauge's decay against DB5-4's (its pace for a gauge of 70): the operator's DB11-1 « Compétences ×1,5, se vide deux fois moins vite » (journal
 *  Passe DB12, after his trial of 2026-11-10: « la barre de break pour nos ennemies est trop lente a monter »): the skills fill it x3 (x2 before,
 *  V2_SKILL_GAUGE), it empties half as fast; the light attack keeps 0.5 (more and the guarding spammer wins again, journal Passe DB11) */
export const V2_GAUGE_DECAY = 0.5;
export const V2_LIGHT_GAUGE = 0.5;
/** what a guarded blow adds to the guarder's gauge, one rule for both fighters (G3; 1 before): the guard's price, « la garde finit par l'étourdir »
 *  [G1, G2] (journal Passe DB9: a guard held through every blow is no longer free; a skill guarded by a rival breaks its guard sooner) */
export const V2_GUARD_GAUGE = 2;
/** the break, one rule for both fighters (G3): stunned 10 s, the damage taken doubled, a gauge of 70 (the operator's DB5-4 « 10 s, ×2, jauge de 70 »,
 *  a decision A3, journal Passe DB6; 8 s and a gauge of 100 since DB-5, 6 s and x1.2 before, C2-9) */
export const V2_BREAK = { stun: DB5.breakStun, damage: DB5.breakDamage, gauge: DB5.gauge };
/** the riposte at the third light attack, its sequence 0.3 s later, DB-2 « Riposte au 3e coup » (DynData.ai.riposte) */
export const V2_RIPOSTE = { after: 3, delay: 0.3 };

/** the player's skills in the version 2: the four brought, each at its level (default: today's loadout at level 1); the heavy attack is owned
 *  from the start since it became a skill (journal Passe CH1), at level 1, after the four (the skills page lists them in this order; the operator's CH-4 « Les quatre d’aujourd’hui, la
 *  puissante à côté », journal Passe CH2) */
/** `order`: the four's order of priority in the duel played by the computer (AC-09; src/combat/autoData.ts autoRen), absent = the automatic's own */
export interface V2Kit { loadout: DynActionId[]; levels: Record<string, number>; order?: string[] }
export const V2_START_KIT: V2Kit = { loadout: ['t1', 't4', 'd1', 's1'], levels: { t1: 1, t4: 1, d1: 1, s1: 1, heavy: 1 } };

export interface V2Duel { data: DynData; tiers: ChargeTier[] }

/** a charged blow pays for its hold (the light attack keeps today's numbers): its damage and what it adds to the opponent's gauge, by action,
 *  and a ward's or a boost's duration (a held charge is time the light attacks did not take); `ap` an action's points under the three buttons
 *  when they are not its own: the heavy attack, a skill since journal Passe CH1, free while it had its own tier (the operator's CH-3 « 1 PA », journal Passe CH2; the old scheme,
 *  input=keys, keeps it free) */
export const V2_POWER: Record<string, { damage: number; resist: number; dur?: number; ap?: number }> = {
  heavy: { damage: 2.2, resist: 2, ap: 1 }, t1: { damage: 4, resist: 2 }, t2: { damage: 4.2, resist: 2 }, t3: { damage: 3.2, resist: 2 }, t4: { damage: 3.4, resist: 2.5 },
  d1: { damage: 1, resist: 1, dur: 1.5 }, s1: { damage: 1, resist: 1, dur: 1.5 },
  // the catalogue's new skills (lot V2, « proposé »)
  k_sunder: { damage: 5, resist: 2 }, k_feint: { damage: 3.2, resist: 2 }, k_iron: { damage: 1, resist: 1, dur: 1.4 }, k_parry: { damage: 1, resist: 1, dur: 1.6 },
  k_cry: { damage: 1, resist: 1, dur: 1.5 }, k_focus: { damage: 1, resist: 1, dur: 1.3 },
};
/** a charged blow's damage against the table above since the charge times were trimmed (journal Passe CH1; the operator's CH-2 « La puissance suit la tenue (×0,85) », journal Passe CH2): the power follows the
 *  hold, so the duel keeps the balance of journal Passe V2C2 (the prepared player six bouts in ten); a ward's or a boost's length unchanged */
export const V2_POWER_TRIM = CHARGE_TRIM;
function charged(a: DynActionDef): DynActionDef {
  const p = V2_POWER[a.id] ?? { damage: 1, resist: 1 }, out: DynActionDef = JSON.parse(JSON.stringify(a));
  out.prep = 0; out.damage = Math.round(a.damage * p.damage * (p.damage > 1 ? V2_POWER_TRIM : 1)); out.resist = +(a.resist * p.resist).toFixed(2);
  if (p.dur && out.ward) out.ward.dur = +(out.ward.dur * p.dur).toFixed(2);
  if (p.dur && out.boost) out.boost.dur = +(out.boost.dur * p.dur).toFixed(2);
  if (p.ap !== undefined) out.apCost = p.ap;
  return out;
}

/** a version 2 duel's data: today's dynamic duel against this profile (dynDuelData), then the three buttons (the heavy and the skills
 *  without their automatic preparation: the charge is it), the skills at their levels (the heavy among them when it is brought: an offensive
 *  skill, journal Passe CH1), the opponent's defence and skills (C3) */
/** `input: 'keys'` keeps the C2 command (keys 1-6, each action's automatic preparation, today's numbers) on the same opponent and the same
 *  levels: the old scheme kept for comparing at the trial (AV-5, « l'ancien schéma gardé pour comparer »); its tiers are unused */
/** `gear` (lot V3): what the player wears changes the damage taken (the opponent's blows), what they add to the player's gauge, the charge
 *  times and the effects' durations */
export interface V2GearFx { taken: number; gauge: number; charge: number; effect: number }
/** `ren` the player's stats (src/simulation/v2gear.ts v2Stats: his gear, his training, his vigour; Ren at the start by default), `foeSheet` the
 *  opponent's (a generic fighter's, src/combat/stats.ts borrowedSheet; by default the rival's sheet at `stage`); `player.hp` and `enemy` the
 *  shares a state changes on top (an injury, a rival's preparation), `gear.taken` the night's tampering (src/simulation/v2gear.ts v2Mods) */
export function v2DuelData(foe: string, o: { seed: number; playerName: string; opponentName: string; player?: Mods; enemy?: Mods; names?: Partial<Record<string, string>>; kit?: V2Kit; input?: 'charge' | 'keys'; gear?: V2GearFx; ren?: FighterStats; foeSheet?: FighterStats; stage?: Stage }): V2Duel {
  const prof: DynProfile = DYN_PROFILES[foe] ?? DYN_PROFILES.marek, F = V2_FOES[foe] ?? V2_FOES.marek, kit = o.kit ?? V2_START_KIT;
  const gfx = o.gear ?? { taken: 1, gauge: 1, charge: 1, effect: 1 }, em0 = o.enemy ?? {}, em = { ...em0, damage: (em0.damage ?? 1) * gfx.taken };
  const d = dynDuelData(prof, { seed: o.seed, playerName: o.playerName, opponentName: o.opponentName, player: o.player, enemy: em, names: o.names });
  // journal Passe DB3: the riposte; journal Passe DB8: the break of DB5-4
  d.resist = { ...d.resist, breakStun: V2_BREAK.stun, breakDamage: V2_BREAK.damage };
  d.ai = { ...d.ai, riposte: { ...V2_RIPOSTE } };
  // the catalogue's new skills (lot V2) join the player's actions, with the player's damage as today's skills take it
  for (const id of kit.loadout) if (!d.actions[id]) { const a = skillAction(id); a.damage = Math.round(a.damage * (o.player?.damage ?? 1)); if (o.names?.[id]) a.name = o.names[id]!; d.actions[id] = a; }
  d.loadout = [...kit.loadout];
  // the heavy attack is one of the player's offensive skills (journal Passe CH1): it may be brought
  d.actions.heavy = { ...d.actions.heavy, family: 'offensive' };
  checkDynData(d);
  const keys = o.input === 'keys', c = (a: DynActionDef) => (keys ? a : charged(a));
  // the heavy attack charged (its AP under the three buttons: V2_POWER), whether brought or not
  d.actions.heavy = c(d.actions.heavy);
  for (const id of kit.loadout) d.actions[id] = atLevel(id === 'heavy' ? d.actions.heavy : c(d.actions[id]), kit.levels[id] ?? 1);
  for (const k of F.skills.list) {
    const a = JSON.parse(JSON.stringify(FOE_SKILLS[k.id])) as DynActionDef;
    if (o.names?.[k.id]) a.name = o.names[k.id]!;
    d.actions[k.id] = a;
  }
  d.ai = { ...d.ai, ...(F.defense ? { defense: { ...F.defense } } : {}), skills: { chance: F.skills.chance, list: F.skills.list.map((x) => ({ ...x })) } };
  // the gear: the opponent's blows fill the player's gauge by `gauge`, the player's wards and boosts last `effect` longer
  if (gfx.gauge !== 1) for (const a of Object.values(d.actions)) if (a.owner === 'marek') a.resist = +(a.resist * gfx.gauge).toFixed(2);
  if (gfx.effect !== 1) for (const id of kit.loadout) { const a = d.actions[id]; if (a.ward) a.ward.dur = +(a.ward.dur * gfx.effect).toFixed(2); if (a.boost) a.boost.dur = +(a.boost.dur * gfx.effect).toFixed(2); }
  // journal Passe DB3: the player's skills filling the gauge twice as much; the light attack 2
  for (const a of Object.values(d.actions)) if (a.owner === 'ren' && a.id !== 'light') a.resist = +(a.resist * V2_SKILL_GAUGE).toFixed(2);
  d.actions.light = { ...d.actions.light, resist: V2_LIGHT_GAUGE };
  const R = o.ren ?? REN_BASE, S = o.foeSheet ?? rivalSheet(RIVAL_SHEETS[foe] ? foe : 'marek', o.stage ?? 0);
  applyStats(d, kit, R, S, o.player ?? {}, em, KIT_VIV[foe] ?? KIT_VIV.marek);
  // the charge times by Ren's Speed (DB7-1); the gear's own share (gfx.charge) stays for a caller that still gives one
  const charge = Object.fromEntries(kit.loadout.map((id) => [id, +(chargeTime(id, kit.levels[id] ?? 1) * gfx.charge * speedFactor(R.viv)).toFixed(3)]));
  return { data: d, tiers: chargeTiers(kit.loadout, charge, d) };
}

/** The fighters' stats in a version 2 duel (the operator's DB7 sheet, decisions A3, journal Passe DB8; briefs/combat-system.md § 19), with the DB5
 *  sheet's rules (journal Passe DB6): the health, every blow's damage by the formula, what it adds to the gauge by the target's Endurance, the
 *  rival's tempo by its Speed, the rivals' guard, the guard's reduction, the gauge of 70, a cooldown on each of the player's skills. `pm.hp` an
 *  injury's share of Ren's health, `pm.damage` a share of his blows (1 in a game: the gear is in his stats), `em` a state's shares on the opponent
 *  (its injury, its preparation, the night's tampering). */
export function applyStats(d: DynData, kit: V2Kit, R: FighterStats, S: FighterStats, pm: Mods, em: Mods, nativeViv = KIT_VIV.marek): void {
  d.fighters.ren = { ...d.fighters.ren, maxHp: Math.max(1, Math.round(R.hp * (pm.hp ?? 1))) };
  d.fighters.marek = { ...d.fighters.marek, maxHp: Math.max(1, Math.round(S.hp * (em.hp ?? 1))) };
  const kr = hitFactor(R.atk, S.def) * (pm.damage ?? 1), kf = hitFactor(S.atk, R.def) * (em.damage ?? 1);
  for (const a of Object.values(d.actions)) {
    if (a.owner === 'ren') {
      if (a.id === 'light') a.damage = Math.max(1, Math.round(POWER.light * kr));
      else if (a.family === 'offensive') a.damage = Math.max(1, Math.round(skillPower(a.id, kit.levels[a.id] ?? 1) * kr));
      a.resist = +(a.resist * gaugeFactor(S.end)).toFixed(2);
      // DB5-3 « 5 × le temps de charge » (A3): every skill the player may bring, the heavy attack among them; the light attack has none
      if (a.id !== 'light' && (a.kind === 'skill' || a.kind === 'heavy')) a.cooldown = +(DB5.cooldown * chargeTime(a.id, 1)).toFixed(3);
    } else {
      if (a.id === d.ai.light) a.damage = Math.max(1, Math.round(POWER.foeLight * kf));
      else if (a.id === d.ai.heavy) a.damage = Math.max(1, Math.round(POWER.foeHeavy * kf));
      else if (a.family === 'offensive') a.damage = Math.max(1, Math.round(POWER.foeSkill * kf));
      a.resist = +(a.resist * gaugeFactor(R.end)).toFixed(2);
    }
  }
  // the rival's tempo by its Speed against the Speed its kit was written at (nativeViv, KIT_VIV): slower in the pool, its kit's from the bracket (DB11-2)
  const tempo = speedFactor(S.viv, nativeViv);
  if (Math.abs(tempo - 1) > 1e-9) scaleTempo(d, tempo);
  // DB5-2 « 90 %, garde à −80 % »: the rivals guard 90 % of the player's blows in their pauses (their dodge kept), the guard takes 80 % off
  d.ai = { ...d.ai, defense: { guard: DB5.foeGuard, dodge: d.ai.defense?.dodge ?? 0 } };
  d.guard = { ...d.guard, reduce: DB5.guardReduce };
  // DB5-4: a gauge of 70, emptied by time at the same pace for its size, half as fast since DB11-1
  d.resist = { ...d.resist, decay: +(d.resist.decay * DB5.gauge / d.resist.max * V2_GAUGE_DECAY).toFixed(3), max: DB5.gauge, guard: V2_GUARD_GAUGE };
}

/** a rival's tempo times k: its blows' wind-up and reaction window, a combo's gaps, its pauses */
export function scaleTempo(d: DynData, k: number): void {
  for (const a of Object.values(d.actions)) if (a.owner === 'marek') { a.impactAt = +(a.impactAt * k).toFixed(3); if (a.windowDur) a.windowDur = +(a.windowDur * k).toFixed(3); }
  d.ai = { ...d.ai, comboGap: [+(d.ai.comboGap[0] * k).toFixed(3), +(d.ai.comboGap[1] * k).toFixed(3)] };
  const r = d.restByLevel[d.ai.level];
  d.restByLevel = { ...d.restByLevel, [d.ai.level]: [+(r[0] * k).toFixed(3), +(r[1] * k).toFixed(3)] };
}

// ------------------------------------------------------------------------------------------- the off-screen race of the version 2 (E6, C3)

/** Each rival in the off-screen race of the version 2: `kill` = the time (s) the reference player (the version 2's bot at skill 0.5, health
 *  without limit) takes to bring it down, `dps` = the damage per second it deals that player (journal Passe V1; the damage measured again under
 *  V2_FOE_HIT, journal Passe VP4). Measured again under V2-2 « Rien ne la coupe » (journal Passe V2C1: the reference's charges no longer cut,
 *  every kill shorter, Vessa's most, 591 -> 326 s) on calibration seeds 1..40 (duel seeds 5001.., bot seeds 901..), checked on the held-out
 *  seeds 41..60 (within 10 %; tests/combat-charge.test.mjs replays 41..46); measured again under V2_FOE_HIT 1.45 and V2_FOE_HP 1.2 (journal
 *  Passe V2C2), and with the heavy attack a skill, the charge times and the charged blows' power trimmed (journal Passe CH1: held-out seeds
 *  within 5 %); measured again with the duel of journal Passe DB3 (the riposte, the skills x4, the break, V2_FOE_HIT 3.4, V2_FOE_HP 1.8: every kill
 *  a little under half of before, Vessa now as hard to bring down as Marek, her dodge taking the skills that carry the damage; held-out seeds within
 *  8 %). Measured again with the fighters' stats of journal Passes DB8 / DB9 (each rival's sheet, the formula, the DB5 rules, the guard's and the light
 *  attack's gauge, the rivals' blows at the DB7 sheet's strength, journal Passe DB10): the reference is Ren at the start, 150 health without limit here;
 *  calibration seeds 1..80, held-out 81..120 within 10 % but Vessa's kill (13 %: her dodge makes it skewed); Vessa second to Marek, her quick kit dealing the
 *  most. Measured again with the duel of journal Passe DB13 (the skills x3 to the gauge and its decay halved, the pool's sheets 3 Speed under their kits, the
 *  rivals' blows x2 with Ren's health): calibration seeds 1..80 at the pool's stage (most of the race's bouts are the pool's; the bracket's rivals fight at
 *  their kits' tempo, a little quicker), held-out 81..120 within 7 %; every kill shorter (the breaks twice as frequent), every dps higher (the blows x2, the
 *  tempo x1.25 to x1.6 slower). A rival a beats b in the time b takes the reference to bring down
 *  over a's damage against it: the reference's own damage cancels out of the race. */
export const V2_RACERS: Record<string, { kill: number; dps: number }> = {
  tobin: { kill: 65.1, dps: 0.83 }, orla: { kill: 140.0, dps: 1.36 }, cassius: { kill: 105.9, dps: 0.95 }, ilse: { kill: 157.6, dps: 1.2 },
  rhosk: { kill: 154.7, dps: 1.02 }, vessa: { kill: 116.7, dps: 2.13 }, marek: { kill: 180.0, dps: 1.53 },
};
/** how sharply the version 2's race decides a match (« proposé »: lower than today's 14, so a rival a third weaker still wins one in ten) */
export const V2_RACE_SLOPE = 8;
/** a rival in the version 2's race, with its state's modifiers (an injury: less health; its preparation: more damage) */
export function v2RacerOf(id: string, m: Mods = {}): { hp: number; dps: number } {
  const r = V2_RACERS[id] ?? V2_RACERS.marek;
  return { hp: r.kill * (m.hp ?? 1), dps: r.dps * (m.damage ?? 1) };
}
