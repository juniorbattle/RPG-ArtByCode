// The sets of rules the workshop measures (journal Passe CF1): each a configuration of sim.mjs. `game` is today's duel.
import { GAME } from './sim.mjs';
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
};
