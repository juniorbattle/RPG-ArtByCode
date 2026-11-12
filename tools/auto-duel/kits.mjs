// The fighters of the workshop's prototype (tools/auto-duel/sim.mjs), built from the game's own data (src/combat/stats.ts, skills.ts, skillbook.ts,
// v2duel.ts, profiles.ts; src/simulation/v2gear.ts for a game's Ren). Not the game. Every number here is « proposé » for the sheet.
import path from 'node:path';
import { createServer } from 'vite';

const ROOT = path.resolve(import.meta.dirname, '..', '..');

/** the game's modules through Vite's SSR loader (as tools/tournament-lab.mjs: its own cache, no watcher) */
export async function loadGame() {
  const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
  const L = (f) => server.ssrLoadModule(f);
  const M = {
    server,
    stats: await L('/src/combat/stats.ts'), skills: await L('/src/combat/skills.ts'), book: await L('/src/combat/skillbook.ts'),
    dyn: await L('/src/combat/dynamic.ts'), v2duel: await L('/src/combat/v2duel.ts'), prof: await L('/src/combat/profiles.ts'),
    lab: await L('/src/tournament/lab.ts'), pool: await L('/src/tournament/pool.ts'), match: await L('/src/combat/match.ts'),
    gear: await L('/src/simulation/v2gear.ts'), v2: await L('/src/simulation/v2.ts'), sim: await L('/src/simulation/index.ts'),
    roster: await L('/src/narrative/roster.ts'), generics: await L('/src/narrative/generics.ts'),
  };
  return M;
}

/** the prototype's kit numbers (« proposé »): the light attack's power (Ren's: DB5-5's 6; a rival's: today's 11.2), the gauge a blow adds per
 *  point of power (the skills more than the light: DB-5 « Jauge par les compétences »), a rival's light charge by its level (its tempo: today's
 *  pauses read as a wait, DYN_LEVELS), its heavy and skills against it, and one factor on the rivals' power (the calibration's lever) */
export const KIT = {
  renLight: 6,
  gauge: { light: 0.1, skill: 0.25, breaker: 2.5 },
  foeLightCharge: { 1: 2.8, 2: 2.5, 3: 2.2, 4: 1.9 },
  foeHeavyCharge: 1.6,
  foeSkillRef: 3.5,
  foePower: 1,
  /** the rivals' preparation (rivalMods: damage x 1 + prep / 400): 'damage' as today, 'stats' as visible stat points (+1 Attack per 25 over 20), 'off' */
  prep: 'damage',
  /** a rival's trait kept from today's kit (C3: Vessa dodges 35 %, Cassius 20 %): that share x traits added to its dodge, shown on the match sheet; 0 = none */
  traits: 0,
  /** the gear's weight (the operator's note after the sheet, journal Passe AC2: « donner des equipements plus impactant »): every stat point and health point the
   *  worn gear and the forge give, x gearK (1 = today's DB7-2 points) */
  gearK: 1,
  /** the enchaînements (the operator's « choregraphies/combos d'attaques ou on enchaine 2-3 coups », journal Passe AC3): 'on' = Ren's light attack chains by his
   *  weapon, Taille éclair and Tourbillon strike several times, the rivals keep today's combos; 'off' = one blow an action (journal Passe AC1) */
  combos: 'off',
};

/** each weapon's enchaînement (« proposé »): the hits of Ren's light attack, each one's share of its power and gauge, the gap between them (s) */
export const WEAPON_CHAINS = {
  'training-sword': { hits: [0.55, 0.55], gap: 0.3 },
  'imported-blade': { hits: [0.62, 0.62], gap: 0.32 },
  'duelist-sabre': { hits: [0.42, 0.42, 0.42], gap: 0.22 },
};
/** the skills that strike several times (« proposé »): Taille éclair two quick cuts, Tourbillon three */
export const SKILL_HITS = { t1: { hits: [0.5, 0.5], gap: 0.25 }, t3: { hits: [0.36, 0.36, 0.36], gap: 0.25 } };

const BREAKERS = new Set(['t3', 'k_sunder']);

/** Ren's actions for a kit ({ loadout, levels }), his gear's effect on the wards' and boosts' length; DB5-3's cooldown by `cooldownK` */
export function renActions(M, kit, o = {}) {
  const { chargeTime, LEVEL_POWER, clampLevel } = M.skills, { skillPower, POWER } = M.stats, K = o.K ?? KIT, ck = o.cooldownK ?? 5, eff = o.effect ?? 1;
  const light = { id: 'light', name: 'Light', kind: 'light', charge: o.lightCharge ?? 1.2, power: K.renLight ?? POWER.light, gauge: (K.renLight ?? 6) * K.gauge.light, ap: 0 };
  if (K.combos === 'on') Object.assign(light, WEAPON_CHAINS[o.weapon] ?? WEAPON_CHAINS['training-sword']);
  const skills = kit.loadout.map((id) => {
    const lv = clampLevel(kit.levels[id] ?? 1), def = M.book.skillAction(id), p = M.v2duel.V2_POWER[id] ?? {}, k = LEVEL_POWER[lv - 1];
    const a = { id, name: def.name, kind: id === 'heavy' ? 'heavy' : 'skill', family: def.family, charge: chargeTime(id, lv), ap: p.ap ?? def.apCost ?? 0, cooldown: ck * chargeTime(id, 1), heavy: id === 'heavy' };
    if (def.ward) a.ward = { dur: +(def.ward.dur * (p.dur ?? 1) * k * eff).toFixed(2), dmg: def.ward.damage, gauge: def.ward.resist };
    else if (def.boost) a.boost = { dur: +(def.boost.dur * (p.dur ?? 1) * k * eff).toFixed(2), dmg: def.boost.damage, gauge: def.boost.resist };
    else { a.power = skillPower(id, lv); a.gauge = a.power * K.gauge.skill * (BREAKERS.has(id) ? K.gauge.breaker : 1); a.pierce = !!def.ignoreGuard; if (K.combos === 'on' && SKILL_HITS[id]) Object.assign(a, SKILL_HITS[id]); }
    return a;
  });
  return { light, skills };
}

/** Ren as a fighter: his stats (FighterStats), the kit, the extras of a state (AP of the gear and a friend, the night's tampering) */
export function renFighter(M, stats, kit, o = {}) {
  // o.weapon: the weapon worn (its enchaînement, KIT.combos)
  return { id: 'ren', name: 'Ren', side: 'ren', hp: stats.hp * (o.hpShare ?? 1), atk: stats.atk, def: stats.def, end: stats.end, viv: stats.viv, tempo: 10, apStart: o.apStart ?? 0, taken: o.taken ?? 1, actions: renActions(M, kit, o), decider: o.decider };
}

/** a rival's kit on the timeline: its light (its tempo by its level), its heavy blow, its own skills (C3's, src/combat/v2duel.ts FOE_SKILLS: an
 *  offensive one's charge from its wind-up, its power by its charge against the reference 3.5 s), each at its own cooldown */
export function foeActions(M, id, o = {}) {
  const K = o.K ?? KIT, P = M.stats.POWER, lvl = M.prof.DYN_LEVELS[id] ?? 3, F = M.v2duel.V2_FOES[id] ?? M.v2duel.V2_FOES.marek, pm = (o.power ?? 1) * K.foePower;
  const cL = K.foeLightCharge[lvl] ?? 2.2;
  const light = { id: 'm_light', name: 'Light', kind: 'light', charge: cL, power: P.foeLight * pm, gauge: P.foeLight * pm * K.gauge.light, ap: 0 };
  const heavy = { id: 'm_heavy', name: 'Heavy', kind: 'skill', heavy: true, charge: cL * K.foeHeavyCharge, power: P.foeHeavy * pm, gauge: P.foeHeavy * pm * K.gauge.skill, ap: 0 };
  const skills = [heavy];
  // today's combos (DYN_PROFILES: comboLen, comboGap): a chain of light blows, each three quarters of a light, its charge 1.4 x the light's
  const P0 = M.prof.DYN_PROFILES[id], n = P0 ? Math.round((P0.comboLen[0] + P0.comboLen[1]) / 2) : 3;
  const combo = { id: 'm_combo', name: 'Combo', kind: 'light', charge: +(cL * 1.4).toFixed(2), power: P.foeLight * pm * 0.75 * n, gauge: P.foeLight * pm * 0.75 * n * K.gauge.light, ap: 0, hits: Array(n).fill(1 / n), gap: P0 ? +((P0.comboGap[0] + P0.comboGap[1]) / 2).toFixed(2) : 0.35 };
  for (const s of F.skills.list) {
    const d = M.v2duel.FOE_SKILLS[s.id];
    const a = { id: s.id, name: d.name, kind: 'skill', family: d.family, ap: 0, cooldown: s.cooldown, weight: s.weight };
    if (d.ward) Object.assign(a, { charge: 2.5, ward: { dur: d.ward.dur, dmg: d.ward.damage, gauge: d.ward.resist } });
    else if (d.boost) Object.assign(a, { charge: 2.5, boost: { dur: d.boost.dur, dmg: d.boost.damage, gauge: d.boost.resist } });
    else { const c = +(2 + 2 * d.impactAt).toFixed(2); Object.assign(a, { charge: c, power: P.foeSkill * pm * (c / K.foeSkillRef), gauge: P.foeSkill * pm * (c / K.foeSkillRef) * K.gauge.skill }); }
    skills.push(a);
  }
  const W = M.prof.DYN_PROFILES[id]?.weights ?? { combo: 0.6, singleLight: 0.2, singleHeavy: 0.2 }, len = M.prof.DYN_PROFILES[id] ? (M.prof.DYN_PROFILES[id].comboLen[0] + M.prof.DYN_PROFILES[id].comboLen[1]) / 2 : 3;
  // its heavy blow's share of its blows today: the single heavies and one blow of each combo
  const heavyShare = (W.singleHeavy + W.combo / len) / (W.combo + W.singleLight + W.singleHeavy);
  return { actions: { light, skills, combo: K.combos === 'on' ? combo : null }, ai: { chance: F.skills.chance, heavy: +heavyShare.toFixed(3), combo: +(W.combo / Math.max(1e-6, W.combo + W.singleLight)).toFixed(3) } };
}

/** a rival as a fighter at a stage: its sheet (src/combat/stats.ts rivalSheet; `sheet` to give another), its state's mods (an injury's health, its
 *  preparation: KIT.prep), its tempo the Speed its kit was written at (KIT_VIV) */
export function foeFighter(M, id, stage = 0, o = {}) {
  const K = o.K ?? KIT, S = o.sheet ?? M.stats.rivalSheet(M.stats.RIVAL_SHEETS[id] ? id : 'marek', stage), mods = o.mods ?? {};
  const prepPts = K.prep === 'stats' && o.preparation != null ? Math.max(0, (o.preparation - 20) / 25) : 0;
  const power = (K.prep === 'damage' ? mods.damage ?? 1 : 1) * (o.power ?? 1);
  const k = foeActions(M, M.stats.RIVAL_SHEETS[id] ? id : (o.profile ?? 'marek'), { K, power });
  const trait = (M.v2duel.V2_FOES[id]?.defense?.dodge ?? 0) * (K.traits ?? 0), guardTrait = (M.v2duel.V2_FOES[id]?.defense?.guard ?? 0) * 0.5 * (K.traits ?? 0);
  return { id, name: id, side: 'foe', dodgeBonus: trait, guardBonus: guardTrait, hp: S.hp * (mods.hp ?? 1), atk: S.atk + prepPts, def: S.def, end: S.end, viv: S.viv, tempo: M.stats.KIT_VIV[id] ?? M.stats.KIT_VIV[o.profile] ?? 10, apStart: 0, taken: 1, actions: k.actions, ai: k.ai, decider: o.decider };
}
