// The sets of rules the workshop measures (journal Passe CF1): each a configuration of sim.mjs. `game` is today's duel.
import { GAME, BRUTE, GEAR_FX } from './sim.mjs';
const C = (o) => ({ ...GAME, ...o });
export const TIERS = { R: 15, M: 30, L: 50 };
export const VARIANTS = {
  game: { cfg: GAME, about: 'le duel du jeu (main 9e2bc1f)' },
  // the AP
  'pa-banque8': { cfg: C({ apMax: 8 }), about: 'les PA gardés, plafond 8 (le surplus non perdu)' },
  'pa-reaction': { cfg: C({ apReact: 1 }), about: 'les PA gardés, +1 PA sur une garde ou une esquive' },
  'sans-pa': { cfg: C({ ap: 'none', heavy: 'open' }), about: 'sans PA, les recharges de DB5-3 seules ; le coup puissant quand l\'adversaire ne peut se défendre' },
  'sans-pa-lourd': { cfg: C({ ap: 'none', heavy: 'ready' }), about: 'sans PA ; le coup puissant aussi dès qu\'il est prêt' },
  'sans-pa-niveau': { cfg: C({ ap: 'none', heavy: 'open', cd: 'level' }), about: 'sans PA ; la recharge 5 × la charge à son niveau' },
  'sans-pa-classes': { cfg: C({ ap: 'none', heavy: 'open', cd: 'tiers', tiers: TIERS, cdLevel: 0.06 }), about: 'sans PA ; trois classes de recharge, −6 % par niveau' },
  // the guard
  'garde-50': { cfg: C({ guard: 0.5 }), about: 'la garde à −50 %' },
  'garde-stats': { cfg: C({ guardStat: { base: 0.5, lo: 0.3, hi: 0.7 } }), about: 'la garde de −30 à −70 % selon la Défense contre l\'Attaque (−50 % à égalité)' },
  // the skills as answers
  terrain: { cfg: C({ ap: 'none', heavy: 'open', terrain: true }), about: 'sans PA ; chaque offensive a son terrain' },
  parade: { cfg: C({ ap: 'none', heavy: 'open', parry: 4 }), about: 'sans PA ; une protection qui couvre un gros coup remplit la jauge du frappeur' },
  'renfort-suivant': { cfg: C({ ap: 'none', heavy: 'open', boost: 'next' }), about: 'sans PA ; Ferveur charge la prochaine action offensive' },
  styles: { cfg: C({ ap: 'none', heavy: 'open', styles: true }), about: 'sans PA ; chaque rival sa tactique' },
  'equipement': { cfg: C({ ap: 'none', heavy: 'open', gearFx: true }), about: 'sans PA ; les effets d\'équipement' },
  tout: { cfg: C({ ap: 'none', heavy: 'open', cd: 'tiers', tiers: TIERS, cdLevel: 0.06, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, terrain: true, parry: 4, boost: 'next', styles: true, gearFx: true }), about: 'tout ensemble' },
  // the final candidates: no AP, the automatic's offensives as soon as ready (nothing held without a tactic)
  F0: { cfg: C({ ap: 'none', heavy: 'open', auto: 'ready' }), about: 'sans PA, DB5-3, l’automatique sans rien retenir' },
  F1: { cfg: C({ ap: 'none', heavy: 'open', auto: 'ready', cd: 'tiers', tiers: TIERS, cdLevel: 0.06 }), about: 'F0 et trois classes de recharge' },
  F2: { cfg: C({ ap: 'none', heavy: 'open', auto: 'ready', cd: 'tiers', tiers: TIERS, cdLevel: 0.06, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, terrain: true, parry: 4, boost: 'next' }), about: 'F1, la garde par les stats, les terrains, la parade, le renfort à placer' },
  F3: { cfg: C({ ap: 'none', heavy: 'open', auto: 'ready', cd: 'tiers', tiers: TIERS, cdLevel: 0.06, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, terrain: true, parry: 4, boost: 'next', styles: true, gearFx: true }), about: 'F2, les styles des rivaux et les effets d’équipement' },
  // the same automatic as the game (the strongest offensive kept for the break), no AP, each rival its style
  G1: { cfg: C({ ap: 'none', heavy: 'open', styles: true }), about: 'sans PA (DB5-3), les styles des rivaux' },
  G2: { cfg: C({ ap: 'none', heavy: 'open', styles: true, cd: 'level' }), about: 'G1, la recharge 5 × la charge à son niveau' },
  G3: { cfg: C({ ap: 'none', heavy: 'open', styles: true, cd: 'tiers', tiers: TIERS, cdLevel: 0.06 }), about: 'G1, trois classes de recharge' },
  G4: { cfg: C({ ap: 'none', heavy: 'open', styles: true, terrain: true }), about: 'G1, les terrains des offensives' },
  G5: { cfg: C({ ap: 'none', heavy: 'open', styles: true, terrain: true, parry: 4 }), about: 'G4, la parade' },
  G6: { cfg: C({ ap: 'none', heavy: 'open', styles: true, terrain: true, parry: 4, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 } }), about: 'G5, la garde par les stats' },
  G7: { cfg: C({ ap: 'none', heavy: 'open', styles: true, terrain: true, parry: 4, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, boost: 'next' }), about: 'G6, Ferveur à placer' },
  G8: { cfg: C({ ap: 'none', heavy: 'open', styles: true, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 } }), about: 'G1, la garde par les stats' },
  // the final prototype: no AP, the cooldowns of DB5-3, the automatic of SL1-3 with the strongest on its ground, each rival its style, the offensives' grounds,
  // the parry, the guard by the stats, the gear's effects
  P1: { cfg: C({ ap: 'none', heavy: 'open', auto: 'final', styles: true, terrain: true, parry: 4, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true }), about: 'le prototype : sans PA (DB5-3), styles, terrains, parade, garde par les stats, effets d’équipement' },
  'P1-sans-effets': { cfg: C({ ap: 'none', heavy: 'open', auto: 'final', styles: true, terrain: true, parry: 4, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 } }), about: 'P1 sans les effets d’équipement' },
  'P1-niveau': { cfg: C({ ap: 'none', heavy: 'open', auto: 'final', styles: true, terrain: true, parry: 4, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, cd: 'level' }), about: 'P1, la recharge 5 × la charge à son niveau' },
  'P1-classes': { cfg: C({ ap: 'none', heavy: 'open', auto: 'final', styles: true, terrain: true, parry: 4, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, cd: 'tiers', tiers: TIERS, cdLevel: 0.06 }), about: 'P1, trois classes de recharge' },
  P2: { cfg: C({ ap: 'none', heavy: 'open', auto: 'final', styles: true, terrain: true, parry: 4, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, boost: 'next', nextBoost: { dmg: 2.2, gauge: 2.2 } }), about: 'P1 et Ferveur à placer (la prochaine action offensive ×2,2)' },
  P3: { cfg: C({ ap: 'none', heavy: 'open', styles: true, terrain: true, parry: 4, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true }), about: 'P1 avec l’automatique du jeu (la plus forte gardée pour la rupture, SL1-3)' },
  // the recommended prototype: P1, the parry at 2 blows, the imported blade's gauge ×1.1, the Speed points of the pieces halved, Tourbillon ×0.8 (it dominated without AP)
  PF: { cfg: C({ ap: 'none', heavy: 'open', auto: 'final', styles: true, terrain: true, parry: 2, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5, powerOf: { t3: 0.8 }, gearTable: null }), about: 'le prototype recommandé : sans PA (DB5-3), styles, terrains, parade (2 coups), garde par les stats, effets d’équipement, la Vivacité des pièces à moitié, Tourbillon ×0,8' },
  PG: { cfg: C({ ap: 'none', heavy: 'open', styles: true, terrain: true, parry: 2, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5, powerOf: { t3: 0.8 } }), about: 'PF avec l’automatique du jeu (SL1-3 : la plus forte gardée pour la rupture)' },
  'PF-T2': { cfg: C({ ap: 'none', heavy: 'open', auto: 'final', styles: true, terrain: true, terrainK: { punish: 2, finish: 2, pierceWard: 1 }, parry: 2, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5, powerOf: { t3: 0.8 } }), about: 'PF, les terrains ×2 (une perceuse traverse toute la protection)' },
  'PG-T2': { cfg: C({ ap: 'none', heavy: 'open', styles: true, terrain: true, terrainK: { punish: 2, finish: 2, pierceWard: 1 }, parry: 2, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5, powerOf: { t3: 0.8 } }), about: 'PG, les terrains ×2' },
  'PF-C2': { cfg: C({ ap: 'none', heavy: 'open', auto: 'final', styles: true, terrain: true, parry: 2, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5, powerOf: { t3: 0.8 }, charges: 2 }), about: 'PF, chaque compétence garde jusqu’à deux utilisations prêtes' },
  'PG-C2': { cfg: C({ ap: 'none', heavy: 'open', styles: true, terrain: true, parry: 2, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5, powerOf: { t3: 0.8 }, charges: 2 }), about: 'PG, chaque compétence garde jusqu’à deux utilisations prêtes' },
  'PG-C2T2': { cfg: C({ ap: 'none', heavy: 'open', styles: true, terrain: true, terrainK: { punish: 2, finish: 2, pierceWard: 1 }, parry: 2, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5, powerOf: { t3: 0.8 }, charges: 2 }), about: 'PG, deux utilisations prêtes, les terrains ×2' },
  'PF-S10': { cfg: C({ ap: 'none', heavy: 'open', auto: 'final', styles: true, terrain: true, parry: 2, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5, powerOf: { t3: 0.8 }, breath: 10 }), about: 'PF et un souffle commun : 10 s entre deux compétences' },
  'PG-S10': { cfg: C({ ap: 'none', heavy: 'open', styles: true, terrain: true, parry: 2, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5, powerOf: { t3: 0.8 }, breath: 10 }), about: 'PG et un souffle commun : 10 s entre deux compétences' },
  'PG-S20': { cfg: C({ ap: 'none', heavy: 'open', styles: true, terrain: true, parry: 2, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5, powerOf: { t3: 0.8 }, breath: 20 }), about: 'PG et un souffle commun : 20 s entre deux compétences' },
  // the AP kept (a shared budget), and what measured well around them
  PK: { cfg: C({ styles: true, terrain: true, parry: 2, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5 }), about: 'les PA gardés, les styles, les terrains, la parade (2 coups), la garde par les stats, les effets d’équipement, la Vivacité des pièces à moitié' },
  // the model inspired by La Brute (journal Passe CF2): no AP, each skill its uses per duel by level and a gap between two uses, its role
  BU: { cfg: C({ ap: 'none', heavy: 'open', hp: 1.2, brute: { ...BRUTE, exploit: { hi: 1, lo: 1 }, punish: 1, opener: 0, interrupt: { open: 0, stagger: 0 }, parry: { open: 0, dur: 3 }, whiff: 0 }, styles: false }), about: 'sans PA ; des usages par combat (1 à 3 selon le niveau) et un délai entre deux ; les rôles sans leurs failles ni leurs multiplicateurs' },
  BC: { cfg: C({ ap: 'none', heavy: 'open', hp: 1.2, styles: true, brute: { ...BRUTE, usesAll: Infinity, gap: { R: 15, M: 30, L: 50 } } }), about: 'sans PA ; recharges seules (rapide 15 s, moyenne 30 s, longue 50 s), les rôles et leurs failles, les styles des rivaux' },
  BF: { cfg: C({ ap: 'none', heavy: 'open', hp: 1.2, brute: BRUTE, styles: false }), about: 'sans PA ; des usages par combat et un délai, les rôles et leurs failles ; pas de styles' },
  BS: { cfg: C({ ap: 'none', heavy: 'open', hp: 1.2, styles: true, brute: BRUTE }), about: 'le modèle La Brute : sans PA, usages par combat et délai, rôles et failles, styles des rivaux' },
  BK: { cfg: C({ ap: 'none', heavy: 'open', hp: 1.2, styles: true, brute: BRUTE, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5 }), about: 'BS, la garde par les stats, les effets d’équipement, la Vivacité des pièces à moitié' },
  'BS-2': { cfg: C({ ap: 'none', heavy: 'open', hp: 1.2, styles: true, brute: { ...BRUTE, usesAll: 2 } }), about: 'BS, deux usages pour toute compétence quel que soit son niveau' },
  BK2: { cfg: C({ ap: 'none', heavy: 'open', hp: 1.2, styles: true, brute: { ...BRUTE, roleCharge: { exploit: 0.66 } }, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5 }), about: 'BK, l’Estoc et les compétences qui exploitent chargées plus vite (×0,4 au lieu de ×0,6) : elles tiennent dans une faille' },
  BK3: { cfg: C({ ap: 'none', heavy: 'open', hp: 1.2, styles: true, brute: { ...BRUTE, roleCharge: { exploit: 0.66 }, uses: [2, 2, 3, 3, 4] }, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5 }), about: 'BK2, des usages plus doux : 2, 2, 3, 3, 4 selon le niveau (les rivaux 2, 2, 3)' },
  BK4: { cfg: C({ ap: 'none', heavy: 'open', hp: 1.2, styles: true, brute: { ...BRUTE, roleCharge: { exploit: 0.66 }, late: 0.5 }, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5 }), about: 'BK2 et un automatique qui ne garde rien jusqu’au bout : passée la moitié d’une santé, ce qui attendait son moment part ; la Ferveur à la rupture ou blessé, le Cri sur un gros coup' },
  // lot 1 as built in the game (journal Passe BL1): BK5, the haste when hurt alone, an opener's opening 5 s (AC-12's test), every health ×1.45 more for SL1-2's
  // durations, then ×0.9 with the clash of the operator's BL1-8 (2 × 1.566 = the game's 3.132); Sunder's power ×0.6 is the game's own table (its fighters carry
  // it); the gauge of BL1-9 (a guarded blow ×0.5, the decay 0.3/s, 14 blows) is the rules' own, given to the copy with the game's AUTO_RULES; the padded jack
  // keeps half of the rule's weight of a guarded blow (×0.25 against ×0.5; ×1 against DB9's ×2 before)
  BL1: { cfg: C({ ap: 'none', heavy: 'open', hp: 1.566, styles: true, brute: { ...BRUTE, roleCharge: { exploit: 0.66 }, uses: [2, 2, 3, 3, 4], late: 0.5, plan: 'general', hasteRule: 'hurt', opener: 5, clash: { w: 0.3, recoil: 0.4, spread: 0.6 } }, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, gearTable: { ...GEAR_FX, 'padded-jack': { guardGauge: 0.25 } }, vivK: 0.5 }), about: 'le lot 1 tel que construit : BK5, la Ferveur blessé seul, la faille d’un ouvreur 5 s, les santés ×1,45 de plus (SL1-2) puis ×0,9, l’entrechoc (BL1-8), la jauge de BL1-9' },
  // the balance pass of journal Passe BE1 as built in the game: BL1, the opener's opening 4 s and the exploits ×0.36 their charge (the game's AUTO_BRUTE.roleCharge, its
  // fighters carry it), every health ×3.6 (1.8 on the old ×2); the blows' weights (AUTO_WEIGHT), the protections half as long and the weapons are the game's own tables,
  // which its fighters carry
  BE1: { cfg: C({ ap: 'none', heavy: 'open', hp: 1.8, styles: true, brute: { ...BRUTE, roleCharge: { exploit: 0.6 }, uses: [2, 2, 3, 3, 4], late: 0.5, plan: 'general', hasteRule: 'hurt', opener: 4, clash: { w: 0.3, recoil: 0.4, spread: 0.6 } }, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, gearTable: { ...GEAR_FX, 'padded-jack': { guardGauge: 0.25 } }, vivK: 0.5 }), about: 'la passe d’équilibre telle que construite : BL1, la faille d’un ouvreur 4 s, l’Estoc ×0,36 de charge, les santés ×3,6 ; les poids des coups, les protections et les armes dans les tables du jeu' },
  BK5: { cfg: C({ ap: 'none', heavy: 'open', hp: 1.2, styles: true, brute: { ...BRUTE, roleCharge: { exploit: 0.66 }, uses: [2, 2, 3, 3, 4], late: 0.5, plan: 'general' }, guardStat: { base: 0.5, lo: 0.3, hi: 0.7 }, gearFx: true, vivK: 0.5 }), about: 'le modèle proposé : usages 2, 2, 3, 3, 4, l’Estoc qui tient dans une faille, l’automatique qui joue le plan général (Estoc dans une faille ou à la rupture, Taille éclair dès que prête, Ferveur blessé ou à la rupture), la garde par les stats, les effets d’équipement, les styles' },
};
