import { checkDynData, type DynActionDef, type DynActionId, type DynData } from './dynamic';
import { skillAction } from './skillbook';
import { DYN_PROFILES, dynDuelData, type DynProfile, type Mods } from './profiles';
import { chargeTiers, type ChargeTier } from './charge';
import { atLevel, chargeTime, HEAVY_AT } from './skills';

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

/** the opponents' blows in the version 2, 30 % harder than C3's balance (journal Passe VP4, the operator's request of 2026-10-27: « augmenter
 *  [...] des dégâts des ennemies pour qu'ils soient plus impactant ou rendre le gameplay combat un peu plus rude »; « proposé »: the prepared
 *  player of the TournamentLab wins about six bouts in ten instead of 85 %, the expert nine in ten). Every rival's blows and skills. */
export const V2_FOE_HIT = 1.3;

/** the player's skills in the version 2: the four brought, each at its level (default: today's loadout at level 1) */
export interface V2Kit { loadout: DynActionId[]; levels: Record<string, number> }
export const V2_START_KIT: V2Kit = { loadout: ['t1', 't4', 'd1', 's1'], levels: { t1: 1, t4: 1, d1: 1, s1: 1 } };

export interface V2Duel { data: DynData; tiers: ChargeTier[] }

/** a charged blow pays for its hold (the light attack keeps today's numbers): its damage and what it adds to the opponent's gauge, by action,
 *  and a ward's or a boost's duration (a held charge is time the light attacks did not take) */
export const V2_POWER: Record<string, { damage: number; resist: number; dur?: number }> = {
  heavy: { damage: 2.2, resist: 2 }, t1: { damage: 4, resist: 2 }, t2: { damage: 4.2, resist: 2 }, t3: { damage: 3.2, resist: 2 }, t4: { damage: 3.4, resist: 2.5 },
  d1: { damage: 1, resist: 1, dur: 1.5 }, s1: { damage: 1, resist: 1, dur: 1.5 },
  // the catalogue's new skills (lot V2, « proposé »)
  k_sunder: { damage: 5, resist: 2 }, k_feint: { damage: 3.2, resist: 2 }, k_iron: { damage: 1, resist: 1, dur: 1.4 }, k_parry: { damage: 1, resist: 1, dur: 1.6 },
  k_cry: { damage: 1, resist: 1, dur: 1.5 }, k_focus: { damage: 1, resist: 1, dur: 1.3 },
};
function charged(a: DynActionDef): DynActionDef {
  const p = V2_POWER[a.id] ?? { damage: 1, resist: 1 }, out: DynActionDef = JSON.parse(JSON.stringify(a));
  out.prep = 0; out.damage = Math.round(a.damage * p.damage); out.resist = +(a.resist * p.resist).toFixed(2);
  if (p.dur && out.ward) out.ward.dur = +(out.ward.dur * p.dur).toFixed(2);
  if (p.dur && out.boost) out.boost.dur = +(out.boost.dur * p.dur).toFixed(2);
  return out;
}

/** a version 2 duel's data: today's dynamic duel against this profile (dynDuelData), then the three buttons (the heavy and the skills
 *  without their automatic preparation: the charge is it), the skills at their levels, the opponent's defence and skills (C3) */
/** `input: 'keys'` keeps the C2 command (keys 1-6, each action's automatic preparation, today's numbers) on the same opponent and the same
 *  levels: the old scheme kept for comparing at the trial (AV-5, « l'ancien schéma gardé pour comparer »); its tiers are unused */
/** `gear` (lot V3): what the player wears changes the damage taken (the opponent's blows), what they add to the player's gauge, the charge
 *  times and the effects' durations */
export interface V2GearFx { taken: number; gauge: number; charge: number; effect: number }
export function v2DuelData(foe: string, o: { seed: number; playerName: string; opponentName: string; player?: Mods; enemy?: Mods; names?: Partial<Record<string, string>>; kit?: V2Kit; input?: 'charge' | 'keys'; gear?: V2GearFx }): V2Duel {
  const prof: DynProfile = DYN_PROFILES[foe] ?? DYN_PROFILES.marek, F = V2_FOES[foe] ?? V2_FOES.marek, kit = o.kit ?? V2_START_KIT;
  const gfx = o.gear ?? { taken: 1, gauge: 1, charge: 1, effect: 1 }, em0 = o.enemy ?? {}, em = { ...em0, damage: (em0.damage ?? 1) * gfx.taken };
  const d = dynDuelData(prof, { seed: o.seed, playerName: o.playerName, opponentName: o.opponentName, player: o.player, enemy: { ...em, hp: (em.hp ?? 1) * F.hp, damage: (em.damage ?? 1) * F.damage * V2_FOE_HIT }, names: o.names });
  // the catalogue's new skills (lot V2) join the player's actions, with the player's damage as today's skills take it
  for (const id of kit.loadout) if (!d.actions[id]) { const a = skillAction(id); a.damage = Math.round(a.damage * (o.player?.damage ?? 1)); if (o.names?.[id]) a.name = o.names[id]!; d.actions[id] = a; }
  d.loadout = [...kit.loadout];
  checkDynData(d);
  const keys = o.input === 'keys', c = (a: DynActionDef) => (keys ? a : charged(a));
  d.actions.heavy = c(d.actions.heavy);
  for (const id of kit.loadout) d.actions[id] = atLevel(c(d.actions[id]), kit.levels[id] ?? 1);
  for (const k of F.skills.list) {
    const a = JSON.parse(JSON.stringify(FOE_SKILLS[k.id])) as DynActionDef;
    a.damage = Math.round(a.damage * F.damage * V2_FOE_HIT * (em.damage ?? 1));
    if (o.names?.[k.id]) a.name = o.names[k.id]!;
    d.actions[k.id] = a;
  }
  d.ai = { ...d.ai, ...(F.defense ? { defense: { ...F.defense } } : {}), skills: { chance: F.skills.chance, list: F.skills.list.map((x) => ({ ...x })) } };
  // the gear: the opponent's blows fill the player's gauge by `gauge`, the player's wards and boosts last `effect` longer
  if (gfx.gauge !== 1) for (const a of Object.values(d.actions)) if (a.owner === 'marek') a.resist = +(a.resist * gfx.gauge).toFixed(2);
  if (gfx.effect !== 1) for (const id of kit.loadout) { const a = d.actions[id]; if (a.ward) a.ward.dur = +(a.ward.dur * gfx.effect).toFixed(2); if (a.boost) a.boost.dur = +(a.boost.dur * gfx.effect).toFixed(2); }
  const charge = Object.fromEntries(kit.loadout.map((id) => [id, +(chargeTime(id, kit.levels[id] ?? 1) * gfx.charge).toFixed(3)]));
  return { data: d, tiers: chargeTiers(kit.loadout, charge, d, +(HEAVY_AT * gfx.charge).toFixed(3)) };
}

// ------------------------------------------------------------------------------------------- the off-screen race of the version 2 (E6, C3)

/** Each rival in the off-screen race of the version 2: `kill` = the time (s) the reference player (the version 2's bot at skill 0.5, health
 *  without limit) takes to bring it down, `dps` = the damage per second it deals that player (journal Passe V1; the damage measured again under
 *  V2_FOE_HIT, journal Passe VP4). Measured again under V2-2 « Rien ne la coupe » (journal Passe V2C1: the reference's charges no longer cut,
 *  every kill shorter, Vessa's most, 591 -> 326 s) on calibration seeds 1..40 (duel seeds 5001.., bot seeds 901..), checked on the held-out
 *  seeds 41..60 (within 10 %; tests/combat-charge.test.mjs replays 41..46). A rival a beats b in the time b takes the reference to bring down
 *  over a's damage against it: the reference's own damage cancels out of the race. */
export const V2_RACERS: Record<string, { kill: number; dps: number }> = {
  tobin: { kill: 321.6, dps: 3.04 }, orla: { kill: 436.3, dps: 4.65 }, cassius: { kill: 432.8, dps: 3.35 }, ilse: { kill: 470.7, dps: 3.62 },
  rhosk: { kill: 513.5, dps: 3.29 }, vessa: { kill: 326.4, dps: 4.36 }, marek: { kill: 510.9, dps: 4.91 },
};
/** how sharply the version 2's race decides a match (« proposé »: lower than today's 14, so a rival a third weaker still wins one in ten) */
export const V2_RACE_SLOPE = 8;
/** a rival in the version 2's race, with its state's modifiers (an injury: less health; its preparation: more damage) */
export function v2RacerOf(id: string, m: Mods = {}): { hp: number; dps: number } {
  const r = V2_RACERS[id] ?? V2_RACERS.marek;
  return { hp: r.kill * (m.hp ?? 1), dps: r.dps * (m.damage ?? 1) };
}
