// The version 2 duel's balance, measured off screen (journal Passe DB2, the operator's report of 2026-11-09 after his first trial: the duels too
// long, the skills and the break barely hurting, spamming the light attack the best way, « on peut attaquer presque 10 fois avant que l'ennemie
// attaque et donc on cumule des ap pour esquiver »). Node alone, the game's own duel (v2DuelData: the start kit at level 1, no preparation, no
// gear, as `?scene=arena&foe=<id>` stages it) and its own bot (runV2BotDuel), plus a « spammer » who only taps the light attack between the
// opponent's sequences and defends as the bot does (its AP go to dodges).
//   node tools/duel-balance.mjs [--variant=<name>[,<name>...]] [--seeds=1..20] [--skills=0.2,0.5,0.9] [--foes=a,b] [--static] [--json=f]
//   [--summary] [--audit] [--policies=bot,strat,spam]   (journal Passe DB5: --audit one line a policy, the duel's length and each rival's, the Thrust's and the
//   Flash cut's blows as a share of the bar when clean, guarded and on a break and how often, the breaks, the moments that count; `strat` a heuristic
//   that plays for the break, too simple to prove anything; variants lv<n>, skp<p>, fguard<g>, fdodge<d>, greduce<r>, skap<k>, cd<k>, epic<k>)
// A variant reshapes the duel's data before it is played (`VARIANTS` below: the options of the decision sheet, each « proposé »); `base` is the
// game today. Per rival and policy: wins, the duel's length (median, minutes), the share of the player's damage by source (light, skills, the
// heavy; the part dealt while the opponent is broken), the opponent's breaks and the first one, the light attacks the player lands in one of the
// opponent's pauses, the AP gained per minute and where they went.
import { load } from '../tests/load.mjs';
import fs from 'node:fs';

const V = await load('/src/combat/v2duel.ts');
const B = await load('/src/combat/bot.ts');
const K = await load('/src/combat/skills.ts');
const C = await load('/src/combat/charge.ts');
const ST = await load('/src/combat/stats.ts');
const Rng = (await load('/src/core/rng.ts')).Rng;

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const range = (s) => s.includes('..') ? (([a, b]) => Array.from({ length: b - a + 1 }, (_, i) => a + i))(s.split('..').map(Number)) : s.split(',').map(Number);
const FOES = arg('foes', 'tobin,cassius,ilse,rhosk,orla,marek,vessa').split(',');
const SEEDS = range(arg('seeds', '1..20'));
const SKILLS = arg('skills', '0.2,0.5,0.9').split(',').map(Number);
const SUMMARY = process.argv.includes('--summary') || process.argv.includes('--audit'), AUDIT = process.argv.includes('--audit');

// ------------------------------------------------------------------------------------------------ the variants (the sheet's options)
const mul = (a, k) => { a.damage = Math.round(a.damage * k); };
const playerSkills = (d) => Object.values(d.actions).filter((a) => a.owner === 'ren' && a.id !== 'light');
/** each variant reshapes a fresh duel's data in place (`apply`), and may act on the duel at each step (`hook`, a rule the data cannot say: a
 *  prototype outside the game); variants compose with `+` (`--variant=hp50+skills3`), applied left to right */
const num = (name, re) => { const m = name.match(re); return m ? +m[1] : null; };
function variantOf(name) {
  let k;
  if (name === 'base') return { label: 'le jeu d’aujourd’hui', apply() {} };
  // the opponent's health, a share of today's
  if ((k = num(name, /^hp(\d+)$/)) !== null) return { label: `PV des rivaux ×${k / 100}`, apply: (d) => { d.fighters.marek.maxHp = Math.round(d.fighters.marek.maxHp * k / 100); } };
  // the player's skills (and the heavy attack, a skill) hit k times harder
  if ((k = num(name, /^skills([\d.]+)$/)) !== null) return { label: `dégâts des compétences ×${k}`, apply: (d) => { for (const a of playerSkills(d)) mul(a, k); } };
  // the light attack's damage
  if ((k = num(name, /^light([\d.]+)$/)) !== null) return { label: `dégâts de l’attaque rapide ×${k}`, apply: (d) => { mul(d.actions.light, k); } };
  // the light attack's cycle (impact + follow + recover), in s
  if ((k = num(name, /^cycle([\d.]+)$/)) !== null) return { label: `cycle de l’attaque rapide ${k} s`, apply: (d) => { const L = d.actions.light; L.recover = +(Math.max(0.05, k - L.impactAt - L.follow)).toFixed(3); } };
  // AP a light attack gains (0.5: one every second light)
  if ((k = num(name, /^apgain([\d.]+)$/)) !== null) return { label: `PA par attaque rapide ${k}`, apply: (d) => { d.actions.light.apGain = k; } };
  // the break: damage multiplier and stun
  if ((k = num(name, /^brk([\d.]+)$/)) !== null) return { label: `break ×${k}`, apply: (d) => { d.resist.breakDamage = k; } };
  if ((k = num(name, /^stun([\d.]+)$/)) !== null) return { label: `étourdi ${k} s`, apply: (d) => { d.resist.breakStun = k; } };
  // what the player's skills add to the opponent's gauge, and the light's
  if ((k = num(name, /^sgauge([\d.]+)$/)) !== null) return { label: `jauge des compétences ×${k}`, apply: (d) => { for (const a of playerSkills(d)) a.resist = +(a.resist * k).toFixed(2); } };
  if ((k = num(name, /^lgauge([\d.]+)$/)) !== null) return { label: `jauge de l’attaque rapide ${k}`, apply: (d) => { d.actions.light.resist = k; } };
  // journal Passe DB9: the light attack's gauge times k/100 (`lgk<k>`), and what a guarded blow adds to the guarder's gauge (`gshare<k>`, k/100; 1 before), one rule for both
  if ((k = num(name, /^lgk(\d+)$/)) !== null) return { label: `jauge de l’attaque rapide ×${k / 100}`, apply: (d) => { d.actions.light.resist = +(d.actions.light.resist * k / 100).toFixed(2); } };
  if ((k = num(name, /^gshare(\d+)$/)) !== null) return { label: `un coup gardé remplit la jauge du gardien ×${k / 100}`, apply: (d) => { d.resist = { ...d.resist, guard: k / 100 }; } };
  // the charge times (every skill's tier), a share of today's
  if ((k = num(name, /^charge([\d.]+)$/)) !== null) return { label: `temps de charge ×${k}`, apply: (d, t) => { for (const x of t) x.at = +(x.at * k).toFixed(3); } };
  // the player's health, a share of today's
  if ((k = num(name, /^renhp(\d+)$/)) !== null) return { label: `PV du joueur ×${k / 100}`, apply: (d) => { d.fighters.ren.maxHp = Math.round(d.fighters.ren.maxHp * k / 100); } };
  // the opponent's blows, a share of today's
  if ((k = num(name, /^foehit(\d+)$/)) !== null) return { label: `coups des rivaux ×${k / 100}`, apply: (d) => { for (const a of Object.values(d.actions)) if (a.owner === 'marek') a.damage = Math.round(a.damage * k / 100); } };
  // the opponent's pauses, a share of today's
  if ((k = num(name, /^rest(\d+)$/)) !== null) return { label: `pauses adverses ×${k / 100}`, apply: (d) => { for (const l of Object.keys(d.restByLevel)) d.restByLevel[l] = d.restByLevel[l].map((x) => +(x * k / 100).toFixed(2)); } };
  // the riposte: in its pause, the opponent answers the player's k-th light attack landed (hit or guarded) with its next sequence, 0.3 s later;
  // never while it is broken (the break is the time to strike)
  if ((k = num(name, /^riposte(\d+)$/)) !== null) return {
    label: `riposte après ${k} attaques rapides`, apply() {},
    hook(duel, evs, st) {
      const m = duel.sim.f.marek;
      for (const e of evs) { if (e.type === 'sequenceStart' || e.type === 'stunEnd') st.lights = 0; if (e.type === 'impact' && e.from === 'ren' && e.action === 'light' && e.result !== 'dodged') st.lights = (st.lights ?? 0) + 1; }
      if ((st.lights ?? 0) >= k && m.state === 'idle' && !m.inSeq && !m.broken && m.aiWait > 0.3) { m.aiWait = 0.3; st.lights = 0; }
    },
  };
  // journal Passe DB4 (the operator's note after DB3: « une attaque simple devrait infligeait 5 a 10% des pv max de l'ennemie »):
  // a pure change of scale, Marek's health brought to N and every health and blow by the same factor (the balance unchanged, a blow at least 1)
  if ((k = num(name, /^scale(\d+)$/)) !== null) return {
    label: `échelle : Marek à ${k} PV`,
    apply: (d) => { const f = k / MAREK_HP; d.fighters.marek.maxHp = Math.max(1, Math.round(d.fighters.marek.maxHp * f)); d.fighters.ren.maxHp = Math.max(1, Math.round(d.fighters.ren.maxHp * f)); for (const a of Object.values(d.actions)) if (a.damage > 0) a.damage = Math.max(1, Math.round(a.damage * f)); },
  };
  // the light attack's damage, a share (%) of this opponent's health
  if ((k = num(name, /^lightpct([\d.]+)$/)) !== null) return { label: `attaque rapide à ${k} % des PV`, apply: (d, t, f, duel) => { d.actions.light.damage = Math.max(1, Math.round((k / 100) * d.fighters.marek.maxHp * (duel?.playerDamage ?? 1))); } };
  // the offensive skills' damage in light attacks: k light attacks for a charge of 3.4 s (the Flash cut), in proportion to the charge time
  if ((k = num(name, /^skl([\d.]+)$/)) !== null) return {
    label: `compétences à ${k} attaques rapides pour 3,4 s de charge`,
    apply: (d, t) => { const at = Object.fromEntries(t.map((x) => [x.id, x.at])); for (const a of Object.values(d.actions)) if (a.owner === 'ren' && a.family === 'offensive') a.damage = Math.max(1, Math.round(d.actions.light.damage * k * ((at[a.id] ?? K.chargeTime(a.id, 1)) / 3.4))); },
  };
  // the riposte as the game's data says it (DynData.ai.riposte): after k light attacks, 0 = none
  if ((k = num(name, /^rip(\d+)$/)) !== null) return { label: k ? `riposte au ${k}e coup` : 'sans riposte', apply: (d) => { if (k) d.ai.riposte = { after: k, delay: 0.3 }; else delete d.ai.riposte; } };
  // journal Passe DB5 (the operator's audit: « une attaque niveau 5 peut enlever 1/4,/1/3 de de la barre de vie d'une ennemie et plus si
  // l'adversaire est break »): the skills' level (handled where the kit is built), the skills' damage as a share of the opponent's health, its defence
  if ((k = num(name, /^lv([1-5])$/)) !== null) return { label: `compétences au niveau ${k}`, apply() {} };
  if ((k = num(name, /^gearatk(\d+)$/)) !== null) return { label: `attaque de l’équipement à ${k} %`, apply() {} };
  if ((k = num(name, /^gear([0-3])$/)) !== null) return { label: `équipement ${k} (en points, comme rs${k})`, apply() {} };
  // the Thrust (the start kit's strongest, 7.65 s at level 1) at p % of this opponent's health at level 1, every other offensive skill in proportion
  // to its charge time at level 1; the level's power on top (x1.1 a level: level 5 = x1.4)
  if ((k = num(name, /^skp([\d.]+)$/)) !== null) return {
    label: `Estocade à ${k} % des PV au niveau 1`,
    apply: (d, t, f, duel) => { const lvk = K.LEVEL_POWER[(duel?.level ?? 1) - 1] * (duel?.playerDamage ?? 1); for (const a of Object.values(d.actions)) if (a.owner === 'ren' && a.family === 'offensive') a.damage = Math.max(1, Math.round(d.fighters.marek.maxHp * (k / 100) * (K.chargeTime(a.id, 1) / K.chargeTime('t4', 1)) * lvk)); },
  };
  // the rivals' defence in their pauses (lot C3): the share of the player's attacks they guard, and of the heavy ones and skills they dodge
  if ((k = num(name, /^fguard(\d+)$/)) !== null) return { label: `les rivaux gardent ${k} %`, apply: (d) => { d.ai.defense = { guard: k / 100, dodge: d.ai.defense?.dodge ?? 0 }; } };
  if ((k = num(name, /^fdodge(\d+)$/)) !== null) return { label: `les rivaux esquivent ${k} %`, apply: (d) => { d.ai.defense = { guard: d.ai.defense?.guard ?? 0, dodge: k / 100 }; } };
  // the player's skills' AP cost + k (5 at most, the AP's own maximum)
  if ((k = num(name, /^skap(\d+)$/)) !== null) return { label: `compétences +${k} PA`, apply: (d, t) => { for (const a of Object.values(d.actions)) if (a.owner === 'ren' && a.kind === 'skill' && a.apCost) a.apCost = Math.min(d.ap.max, a.apCost + k); for (const x of t) x.ap = d.actions[x.id].apCost ?? 0; } };
  // a cooldown for each offensive skill of the player (none today, C2-5; G5: « cela peut etre integre si on juge que le jeu est pas assez
  // structure »): k times its charge time at level 1 (the Flash cut 3.4 s x k, the Thrust 7.65 s x k), counted from its release; prototyped by
  // closing its tier (AP out of reach) until it is ready
  if ((k = num(name, /^cd([\d.]+)$/)) !== null) return {
    label: `recharge : ${k} × le temps de charge`, apply() {},
    hook(duel, evs, st) {
      const D = duel.sim.D; st.cd ??= {}; st.ap ??= {};
      for (const e of evs) if (e.type === 'commandStart' && e.who === 'ren' && D.actions[e.action]?.family === 'offensive') st.cd[e.action] = duel.sim.t + k * K.chargeTime(e.action, 1);
      for (const x of duel.tiers) {
        const a = D.actions[x.id]; if (!a || a.family !== 'offensive') continue;
        st.ap[x.id] ??= a.apCost ?? 0;
        const locked = (st.cd[x.id] ?? 0) > duel.sim.t;
        a.apCost = locked ? 99 : st.ap[x.id]; x.ap = a.apCost;
      }
    },
  };
  // the guard's reduction (60 % today, one rule for both fighters)
  if ((k = num(name, /^greduce(\d+)$/)) !== null) return { label: `la garde réduit de ${k} %`, apply: (d) => { d.guard = { ...d.guard, reduce: k / 100 }; } };
  // an epic bout: the opponent's health x k / 100, every blow as it is
  if ((k = num(name, /^epic(\d+)$/)) !== null) return { label: `combat épique : PV ×${k / 100}`, apply: (d) => { d.fighters.marek.maxHp = Math.round(d.fighters.marek.maxHp * k / 100); } };
  // the gauge's size (100 today) and its decay in proportion: a break sooner in a short duel
  if ((k = num(name, /^gauge(\d+)$/)) !== null) return { label: `jauge de ${k}`, apply: (d) => { d.resist = { ...d.resist, decay: +(d.resist.decay * k / d.resist.max).toFixed(3), max: k }; } };
  // longer sequences: k blows in a combo at most (from k - 2), the combos the opponent's usual sequence (80 %)
  if ((k = num(name, /^combo(\d+)$/)) !== null) return { label: `séquences adverses jusqu’à ${k} coups`, apply: (d) => { d.ai.comboLen = [Math.max(2, k - 2), k]; d.ai.weights = { combo: 0.8, singleLight: 0.1, singleHeavy: 0.1 }; } };
  // journal Passe DB11 (the operator's trial of 2026-11-10: « les ennemies attaquent beaucoup trop souvent des le debut du jeu », « la barre de break
  // pour nos ennemies est trop lente a monter »): longer combos (`clen<n>`: n more blows at both ends of a combo, the weights kept), the opponent's
  // whole tempo (`tempo<k>`: its pauses, its blows' wind-up and reaction window, a combo's gaps x k/100, as its Speed does), the gauge's decay
  // (`decay<k>`: x k/100), what the player's skills add to the opponent's gauge (`sgk<k>`: x k/100)
  if ((k = num(name, /^clen(\d+)$/)) !== null) return { label: `combos +${k} coup(s)`, apply: (d) => { d.ai.comboLen = [d.ai.comboLen[0] + k, d.ai.comboLen[1] + k]; } };
  if ((k = num(name, /^tempo(\d+)$/)) !== null) return { label: `tempo adverse ×${k / 100}`, apply: (d) => { V.scaleTempo(d, k / 100); } };
  if ((k = num(name, /^decay(\d+)$/)) !== null) return { label: `la jauge se vide ×${k / 100}`, apply: (d) => { d.resist = { ...d.resist, decay: +(d.resist.decay * k / 100).toFixed(3) }; } };
  if ((k = num(name, /^sgk(\d+)$/)) !== null) return { label: `jauge des compétences ×${k / 100}`, apply: (d) => { for (const a of playerSkills(d)) a.resist = +(a.resist * k / 100).toFixed(2); } };
  // the fighters' stats: the game's own since journal Passe DB8 (src/combat/stats.ts); the tokens below are read by duelOf
  if (name === 'rpg') return { label: 'statistiques des combattants (le jeu)', apply() {} };
  if (['rs', 'stage', 'fpow', 'rhp', 'vhp', 'vatk', 'vdef', 'vend', 'rviv', 'vivd'].some((pre) => rpgTok(name, pre) !== null)) return { label: name, apply() {} };
  throw new Error(`unknown variant "${name}"`);
}
/** a numbered token of a spec (`rs2`, `stage1`, `fpow90`), or null */
const rpgTok = (spec, pre) => { const t = spec.split('+').find((x) => x.startsWith(pre) && x.length > pre.length && !Number.isNaN(+x.slice(pre.length))); return t ? +t.slice(pre.length) : null; };

// ------------------------------------------------------------------------------------------------ the fighters' stats (journal Passes DB7 / DB8)
/** The fighters' stats are the game's since journal Passe DB8 (src/combat/stats.ts: the sheets, the formula, the growth; src/combat/v2duel.ts
 *  applyStats). What stays the tool's: Ren's gear states as stat points (`rs<n>`, `gear<n>` its alias: 1 a session and the padded jack; 2 the
 *  imported blade at tier 1, a session, the mail, the wrap; 3 the blade at tier 3, the whetstone, two sessions, the mail, the ring, the wrap), and the
 *  other growths measured in journal Passe DB7 (`stage<3..11>`; 0 to 2 the game's). `rhp<N>` Ren's base health (his vigour), `rviv<N>` his Speed,
 *  `fpow<p>` the rivals' blows at p %, `vhp` / `vatk` / `vdef` / `vend` the opponent's sheet while tuning. */
export const RPG = {
  gear: {
    0: { atk: 0, def: 0, end: 0, hp: 0, viv: 0 },
    1: { atk: 1, def: 1, end: 0, hp: 0, viv: 0 },
    2: { atk: 4, def: 3, end: 0, hp: 9, viv: -0.5 },
    3: { atk: 7.5, def: 3, end: 2, hp: 9, viv: -0.5 },
  },
  stage: {
    3: { atk: 2, def: 2, end: 1, hp: 1.15 }, 4: { atk: 3, def: 3, end: 2, hp: 2.5 }, 5: { atk: 1, def: 3, end: 2, hp: 3 }, 6: { atk: 0, def: 2, end: 2, hp: 2.5 },
    7: { atk: 1, def: 2, end: 2, hp: 2 }, 8: { atk: 0, def: 2, end: 3, hp: 4 }, 9: { atk: -2, def: 2, end: 3, hp: 4 }, 10: { atk: 0, def: 0, end: 0, hp: 1.4 }, 11: { atk: 0, def: 0, end: 0, hp: 2.5 },
  },
};
/** Ren's stats and the opponent's sheet a spec gives */
function statsOf(foe, spec) {
  const rs = rpgTok(spec, 'rs') ?? gearOf(spec), g = RPG.gear[rs] ?? RPG.gear[0], B = ST.REN_BASE;
  const ren = { hp: (rpgTok(spec, 'rhp') ?? B.hp) + g.hp, atk: B.atk + g.atk, def: B.def + g.def, end: B.end + g.end, viv: (rpgTok(spec, 'rviv') ?? B.viv) + g.viv };
  const st = rpgTok(spec, 'stage') ?? 0, b0 = ST.RIVAL_SHEETS[foe] ?? ST.RIVAL_SHEETS.marek;
  const b = { hp: rpgTok(spec, 'vhp') ?? b0.hp, atk: rpgTok(spec, 'vatk') ?? b0.atk, def: rpgTok(spec, 'vdef') ?? b0.def, end: rpgTok(spec, 'vend') ?? b0.end, viv: b0.viv };
  const gr = ST.STAGE_GROWTH[st] ?? RPG.stage[st];
  // journal Passe DB11: `vivd<n>` the opponent n Speed under its sheet (its tempo x its sheet's Speed / its Speed now, as the game reads it)
  return { ren, foe: { hp: b.hp * gr.hp, atk: b.atk + gr.atk, def: b.def + gr.def, end: b.end + gr.end, viv: b.viv - (rpgTok(spec, 'vivd') ?? 0) }, fpow: (rpgTok(spec, 'fpow') ?? 100) / 100 };
}

/** Marek's health in the scene's duel today (journal Passe DB3: 7 680 x 1.5) */
const MAREK_HP = 11520;
export const variant = (spec) => {
  const parts = spec.split('+').map(variantOf);
  return { label: parts.map((p) => p.label).join(' + '), apply: (d, t, f, x) => parts.forEach((p) => p.apply(d, t, f, x)), hooks: parts.filter((p) => p.hook) };
};
const VARIANTS = new Proxy({}, { get: (_, k) => (typeof k === 'string' ? variant(k) : undefined) });

const gearOf = (spec) => { const m = spec.split('+').map((x) => x.match(/^gear([0-3])$/)).find(Boolean); return m ? +m[1] : 0; };
/** `lv<n>` in a spec: the start kit's four skills (and the heavy attack) at level n, as a trained player has them (journal Passe DB5) */
const levelOf = (spec) => { const m = spec.split('+').map((p) => p.match(/^lv([1-5])$/)).find(Boolean); return m ? +m[1] : 1; };
function duelOf(foe, seed, spec) {
  const lv = levelOf(spec), kit = { loadout: [...V.V2_START_KIT.loadout], levels: Object.fromEntries([...V.V2_START_KIT.loadout, 'heavy'].map((id) => [id, lv])) };
  // the fighters' stats (journal Passe DB8): Ren's gear state in points, the opponent's sheet at its stage, the rivals' blows by `fpow`
  const x = statsOf(foe, spec);
  const d = V.v2DuelData(foe, { seed: 3000 + seed, playerName: 'Ren', opponentName: foe, kit, ren: x.ren, foeSheet: x.foe, enemy: { damage: x.fpow } });
  d.level = lv; d.playerDamage = 1; d.spec = spec;
  variant(spec).apply(d.data, d.tiers, foe, d);
  return d;
}

// ------------------------------------------------------------------------------------------------ the policies
/** the guarding spammer (journal Passe DB9, tests/duel-stats.test.mjs): it taps the light attack whenever it is free outside the opponent's sequences,
 *  holds the guard through every sequence and dodges a heavy blow or a skill 3 times in 5; the perfect player of one tactic, who must lose */
function runGuardSpammer(data, tiers, o) {
  const duel = new C.ChargedDuel(data, tiers), sim = duel.sim, rng = new Rng(o.seed >>> 0 || 1), dt = data.dt;
  let wasDown = false;
  while (!sim.over && sim.t < 1800) {
    const inc = sim.incoming();
    if (inc && inc.windowOpen && inc.kind !== 'light' && rng.next() < 0.6) sim.react('ren', 'dodge');
    duel.setGuard('ren', sim.inSequence());
    if (wasDown) { duel.attack(false); wasDown = false; } else if (!sim.inSequence() && sim.f.ren.state === 'idle') { duel.attack(true); wasDown = true; }
    duel.step(dt); o.observe(duel.drain(), duel);
  }
  const r = sim.f.ren, k = sim.f.marek;
  return { winner: r.state === 'down' ? 'opponent' : k.state === 'down' ? 'player' : null, t: sim.t, renHp: r.hp };
}

/** the spammer: between the opponent's sequences it taps the light attack whenever it is free; in a sequence it defends as the bot does */
function runSpammer(data, tiers, o) {
  const duel = new C.ChargedDuel(data, tiers), sim = duel.sim, rng = new Rng(o.seed >>> 0 || 1), dt = data.dt, s = o.skill;
  let decided = null, seqSeen = false, guardSeq = false, dodge = false, react = 0, wasDown = false;
  while (!sim.over && sim.t < 1800) {
    const inc = sim.incoming(), m = sim.f.marek, r = sim.f.ren;
    if (sim.inSequence() && !seqSeen) { seqSeen = true; guardSeq = rng.next() < 0.2 + 0.6 * s; }
    if (!sim.inSequence()) seqSeen = false;
    if (inc && m.act !== decided) { decided = m.act; dodge = inc.kind !== 'light' && rng.next() < 0.25 + 0.65 * s; react = 0.32 - 0.22 * s + rng.next() * 0.08; }
    if (!inc) decided = null;
    if (inc && dodge && inc.windowOpen && inc.t >= inc.windowOpensAt + react * 0.5) sim.react('ren', 'dodge');
    duel.setGuard('ren', sim.inSequence() && guardSeq && !(inc && inc.t < react && m.seqIdx === 1));
    // a tap: pressed one step, released the next (a human's reaction delay between two taps: the bot's own)
    if (wasDown) { duel.attack(false); wasDown = false; }
    else if (!sim.inSequence() && r.state === 'idle') { duel.attack(true); wasDown = true; }
    duel.step(dt); o.observe(duel.drain(), duel);
  }
  const r = sim.f.ren, k = sim.f.marek;
  return { winner: r.state === 'down' ? 'opponent' : k.state === 'down' ? 'player' : null, t: sim.t, renHp: r.hp };
}

/** the strategist (journal Passe DB5): it plays for the break. It defends as the bot does. Out of a break it builds AP and the opponent's gauge with
 *  light attacks, pushes the gauge with its cheapest offensive skill once the gauge is under way, and always keeps the AP of the best skill a stun
 *  leaves the time to charge; in the opponent's break it charges the strongest skill that fits in what is left of the stun, and releases it there */
function runStrategist(data, tiers, o) {
  const duel = new C.ChargedDuel(data, tiers), sim = duel.sim, rng = new Rng(o.seed >>> 0 || 1), dt = data.dt, s = o.skill, D = data;
  let decided = null, seqSeen = false, guardSeq = false, dodge = false, react = 0, wasDown = false, target = -1, nextAct = 0.4;
  const off = tiers.map((x, i) => ({ i, x, a: D.actions[x.id] })).filter((o2) => o2.i > 0 && o2.a.family === 'offensive');
  const cheapest = off.slice().sort((a, b) => a.x.at - b.x.at)[0];
  const fitsStun = (left) => off.filter((o2) => o2.x.at + o2.a.impactAt + 0.15 <= left).sort((a, b) => b.a.damage - a.a.damage);
  const stunBest = fitsStun(D.resist.breakStun)[0];
  while (!sim.over && sim.t < 1800) {
    const inc = sim.incoming(), m = sim.f.marek, r = sim.f.ren, v = duel.view();
    if (sim.inSequence() && !seqSeen) { seqSeen = true; guardSeq = rng.next() < 0.2 + 0.6 * s; }
    if (!sim.inSequence()) seqSeen = false;
    if (inc && m.act !== decided) { decided = m.act; dodge = inc.kind !== 'light' && rng.next() < 0.25 + 0.65 * s; react = 0.32 - 0.22 * s + rng.next() * 0.08; }
    if (!inc) decided = null;
    if (inc && dodge && inc.windowOpen && inc.t >= inc.windowOpensAt + react * 0.5) sim.react('ren', 'dodge');
    duel.setGuard('ren', sim.inSequence() && guardSeq && !(inc && inc.t < react && m.seqIdx === 1));
    if (wasDown) { duel.attack(false); wasDown = false; }
    else if (v.held) {
      if (target >= 0 && v.reached >= target && (!sim.inSequence() || m.broken)) { duel.attack(false); target = -1; nextAct = sim.t + 0.25 + (1 - s) * 0.4 * rng.next(); }
    } else if (r.state === 'idle' && sim.t >= nextAct) {
      const keep = stunBest ? stunBest.x.ap : 0, gauge = m.resist / D.resist.max;
      if (m.broken) {
        const best = fitsStun(m.stunLeft).find((o2) => r.ap >= o2.x.ap);
        if (best) { target = best.i; duel.attack(true); } else { duel.attack(true); wasDown = true; }
      } else {
        // the skill a stun leaves the time for is kept for the break; the others build toward it
        const reserve = 0, pick = off.slice().sort((a, b) => b.a.damage - a.a.damage).find((o2) => o2 !== stunBest && r.ap >= o2.x.ap + reserve);
        if (pick) { target = pick.i; duel.attack(true); } else if (!sim.inSequence()) { duel.attack(true); wasDown = true; }
      }
    }
    duel.step(dt); o.observe(duel.drain(), duel);
  }
  const r = sim.f.ren, k = sim.f.marek;
  return { winner: r.state === 'down' ? 'opponent' : k.state === 'down' ? 'player' : null, t: sim.t, renHp: r.hp };
}

/** one duel, measured */
function measure(foe, seed, variantSpec, policy, skill) {
  const d = duelOf(foe, seed, variantSpec), m = { light: 0, heavy: 0, skills: 0, broken: 0, breaks: 0, firstBreak: null, pauses: [], cur: 0, apGain: 0, apDodge: 0, apSkill: 0, dmgTaken: 0, top: { hit: [], guarded: [], broken: [] }, ce: { hit: [], guarded: [], broken: [] }, moments: [], seqs: 0, ripostes: 0, seqEnd: null, free: [], stunned: false };
  const foeHp = d.data.fighters.marek.maxHp, topId = 't4';
  let brokenNow = false;
  const vt = variant(variantSpec), st = {};
  const observe = (evs, duel) => {
    for (const h of vt.hooks) h.hook(duel, evs, st);
    for (const e of evs) {
      if (e.type === 'impact' && e.from === 'ren' && e.damage > 0) {
        const k = e.action === 'light' ? 'light' : e.action === 'heavy' ? 'heavy' : 'skills'; m[k] += e.damage; if (brokenNow) m.broken += e.damage;
        if (e.action === 'light' && e.result !== 'dodged') m.cur++;
        // journal Passe DB5: the strongest skill's blows by their case, and the moments that count (a skill blow of 4 % of the bar or more)
        if (e.action === 't1') m.ce[brokenNow ? 'broken' : e.result === 'guarded' ? 'guarded' : 'hit'].push(e.damage / foeHp);
        if (e.action === topId) m.top[brokenNow ? 'broken' : e.result === 'guarded' ? 'guarded' : 'hit'].push(e.damage / foeHp);
        if (e.action !== 'light' && e.damage / foeHp >= 0.04) m.moments.push(e.t);
      }
      if (e.type === 'impact' && e.from === 'marek') m.dmgTaken += e.damage;
      if (e.type === 'break' && e.who === 'marek') { brokenNow = true; m.breaks++; m.moments.push(e.t); if (m.firstBreak === null) m.firstBreak = e.t; }
      if (e.type === 'stunEnd' && e.who === 'marek') brokenNow = false;
      if (e.type === 'sequenceStart') { m.pauses.push(m.cur); m.cur = 0; m.seqs++; if (m.seqEnd !== null && !m.stunned) m.free.push(e.t - m.seqEnd); m.seqEnd = null; m.stunned = false; }
      // journal Passe DB11: the opponent's rhythm as the player meets it, the time between the end of a sequence and the start of the next (a pause
      // with a break of its own left out), and the sequences its riposte started
      if (e.type === 'sequenceEnd') m.seqEnd = e.t;
      if (e.type === 'stun' && e.who === 'marek') m.stunned = true;
      if (e.type === 'riposte') m.ripostes++;
      if (e.type === 'apGain' && e.who === 'ren') m.apGain += e.amount;
      if (e.type === 'apSpend' && e.who === 'ren') { if (e.amount && evs.some((x) => x.type === 'reactStart' && x.who === 'ren')) m.apDodge += e.amount; else m.apSkill += e.amount; }
    }
  };
  const r = policy === 'gspam' ? runGuardSpammer(d.data, d.tiers, { seed: 40 + seed, observe }) : policy === 'spam' ? runSpammer(d.data, d.tiers, { skill, seed: 40 + seed, observe }) : policy === 'strat' ? runStrategist(d.data, d.tiers, { skill, seed: 40 + seed, observe }) : B.runV2BotDuel(d.data, d.tiers, { skill, seed: 40 + seed, observe });
  const mo = [...new Set(m.moments.map((x) => +x.toFixed(2)))].sort((a, b) => a - b), gaps = mo.slice(1).map((x, i) => x - mo[i]);
  const dealt = m.light + m.heavy + m.skills;
  return { win: r.winner === 'player' ? 1 : 0, ko: r.winner ? 1 : 0, t: r.t, light: m.light / dealt, skills: m.skills / dealt, heavy: m.heavy / dealt, broken: m.broken / dealt, breaks: m.breaks, firstBreak: m.firstBreak, pauses: m.pauses.slice(1), apGainMin: (m.apGain / r.t) * 60, apDodge: m.apDodge, apSkill: m.apSkill, top: m.top, ce: m.ce, gap: gaps.length ? med(gaps) : null, moments: mo.length, seqMin: m.seqs / (r.t / 60), ripostes: m.ripostes, ripShare: m.seqs ? m.ripostes / m.seqs : 0, free: m.free, renHp: d.data.fighters.ren.maxHp, foeHp, renLeft: (r.renHp ?? r.playerHp ?? 0) / d.data.fighters.ren.maxHp };
}

const med = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : NaN; };
const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : NaN);
const pc = (x) => `${Math.round(x * 100)} %`;

// ------------------------------------------------------------------------------------------------ the static table (the numbers of a duel)
function staticTable(variant) {
  const rows = [];
  for (const foe of FOES) {
    const d = duelOf(foe, 1, variant), D = d.data, A = D.actions, hp = D.fighters.marek.maxHp, rest = D.restByLevel[D.ai.level];
    const L = A.light, lc = L.impactAt + L.follow + L.recover;
    const tiers = d.tiers.slice(1).map((x) => { const a = A[x.id], busy = x.at + a.prep + a.impactAt + a.follow + a.recover; return { id: x.id, at: x.at, ap: x.ap, dmg: a.damage, pctHp: +(100 * a.damage / hp).toFixed(2), resist: a.resist, dmgPerSec: +(a.damage / busy).toFixed(1), lightsInSameTime: +(busy / lc).toFixed(1) }; });
    rows.push({ foe, foeHp: hp, renHp: D.fighters.ren.maxHp, level: D.ai.level, rest, light: { dmg: L.damage, pctHp: +(100 * L.damage / hp).toFixed(2), cycle: +lc.toFixed(2), dmgPerSec: +(L.damage / lc).toFixed(1), resist: L.resist, apGain: L.apGain }, lightsPerPause: [+(rest[0] / lc).toFixed(1), +(rest[1] / lc).toFixed(1)], lightsToKo: Math.ceil(hp / L.damage), lightsToBreak: Math.ceil(D.resist.max / L.resist), breakStun: D.resist.breakStun, breakDamage: D.resist.breakDamage, heavy: { dmg: A.heavy.damage, pctHp: +(100 * A.heavy.damage / hp).toFixed(2) }, foeBlows: { light: A.m_slash.damage, heavy: A.m_heavy.damage, pctRenLight: +(100 * A.m_slash.damage / D.fighters.ren.maxHp).toFixed(1), pctRenHeavy: +(100 * A.m_heavy.damage / D.fighters.ren.maxHp).toFixed(1) }, tiers });
  }
  return rows;
}

// ------------------------------------------------------------------------------------------------ run
const variants = arg('variant', 'base').split(',');
const out = { seeds: SEEDS, skills: SKILLS, variants: {} };
for (const variant of variants) {
  const res = { static: staticTable(variant), duels: {} };
  if (process.argv.includes('--static')) { console.log(JSON.stringify(res.static, null, 1)); out.variants[variant] = res; continue; }
  console.log(`\n== ${variant}: ${(VARIANTS[variant] ?? VARIANTS.base).label}`);
  console.log('policy        foe      wins  KO  len(min) med [p10-p90]   light skills heavy | in-break  breaks first(s)  lights/pause med max  AP/min dodge:skill');
  const POL = arg('policies', 'bot,spam').split(','), plist = POL.flatMap((p) => (p === 'spam' || p === 'gspam' ? [[p, 0.5]] : SKILLS.map((x) => [p, x])));
  for (const [policy, skill] of plist) {
    const all = [], rivalLen = [];
    for (const foe of FOES) {
      const rs = SEEDS.map((seed) => measure(foe, seed, variant, policy, skill)); all.push(...rs); rivalLen.push(med(rs.map((r) => r.t / 60)));
      const ts = rs.map((r) => r.t / 60), p = rs.flatMap((r) => r.pauses), fb = rs.map((r) => r.firstBreak).filter((x) => x !== null);
      const row = { policy: `${policy}${policy !== 'spam' && policy !== 'gspam' ? ' ' + skill : ''}`, foe, wins: avg(rs.map((r) => r.win)), ko: avg(rs.map((r) => r.ko)), lenMed: med(ts), lenP10: med(ts.slice().sort((a, b) => a - b).slice(0, Math.max(1, Math.round(ts.length * 0.2)))), lenP90: ts.slice().sort((a, b) => a - b)[Math.floor(ts.length * 0.9)], light: avg(rs.map((r) => r.light)), skills: avg(rs.map((r) => r.skills)), heavy: avg(rs.map((r) => r.heavy)), broken: avg(rs.map((r) => r.broken)), breaks: avg(rs.map((r) => r.breaks)), firstBreak: fb.length ? med(fb) : null, pauseMed: med(p), pauseMax: Math.max(...p), apMin: avg(rs.map((r) => r.apGainMin)), apDodge: avg(rs.map((r) => r.apDodge)), apSkill: avg(rs.map((r) => r.apSkill)) };
      (res.duels[row.policy] ??= []).push(row);
      if (!SUMMARY) console.log(`${row.policy.padEnd(13)} ${foe.padEnd(8)} ${pc(row.wins).padStart(5)} ${pc(row.ko).padStart(5)} ${row.lenMed.toFixed(1).padStart(5)} [${ts.slice().sort((a, b) => a - b)[Math.floor(ts.length * 0.1)].toFixed(1)}-${row.lenP90.toFixed(1)}]   ${pc(row.light).padStart(5)} ${pc(row.skills).padStart(5)} ${pc(row.heavy).padStart(5)} | ${pc(row.broken).padStart(5)}  ${row.breaks.toFixed(1).padStart(5)} ${row.firstBreak === null ? '   -' : row.firstBreak.toFixed(0).padStart(5)}     ${String(row.pauseMed).padStart(5)} ${String(row.pauseMax).padStart(3)}   ${row.apMin.toFixed(1).padStart(5)} ${row.apDodge.toFixed(0)}:${row.apSkill.toFixed(0)}`);
    }
    const ts = all.map((r) => r.t / 60), pall = all.flatMap((r) => r.pauses), fball = all.map((r) => r.firstBreak).filter((x) => x !== null);
    res.all = res.all ?? {}; const tops = (k) => all.flatMap((r) => r.top[k]), ces = (k) => all.flatMap((r) => r.ce[k]), gp = all.map((r) => r.gap).filter((x) => x !== null);
    res.all[policy + (policy !== 'spam' && policy !== 'gspam' ? ' ' + skill : '')] = { rivalLen: [Math.min(...rivalLen), Math.max(...rivalLen)], topHit: avg(tops('hit')), topGuarded: avg(tops('guarded')), topBroken: avg(tops('broken')), topN: [tops('hit').length, tops('guarded').length, tops('broken').length], ceHit: avg(ces('hit')), ceGuarded: avg(ces('guarded')), ceBroken: avg(ces('broken')), ceN: [ces('hit').length, ces('guarded').length, ces('broken').length].map((x) => +(x / all.length).toFixed(1)), topPer: +((tops('hit').length + tops('guarded').length + tops('broken').length) / all.length).toFixed(1), gap: gp.length ? med(gp) : null, wins: avg(all.map((r) => r.win)), lenMed: med(ts), lenP10: ts.slice().sort((a, b) => a - b)[Math.floor(ts.length * 0.1)], lenP90: ts.slice().sort((a, b) => a - b)[Math.floor(ts.length * 0.9)], light: avg(all.map((r) => r.light)), skills: avg(all.map((r) => r.skills)), heavy: avg(all.map((r) => r.heavy)), broken: avg(all.map((r) => r.broken)), breaks: avg(all.map((r) => r.breaks)), firstBreak: fball.length ? med(fball) : null, pauseMed: med(pall), pauseMax: Math.max(...pall), apMin: avg(all.map((r) => r.apGainMin)), seqMin: avg(all.map((r) => r.seqMin)), freeMed: med(all.flatMap((r) => r.free)), ripShare: avg(all.map((r) => r.ripShare)), breakMin: avg(all.map((r) => r.breaks / (r.t / 60))), renLeftWon: avg(all.filter((r) => r.win).map((r) => r.renLeft)), renHp: med(all.map((r) => r.renHp)), foeHp: [Math.min(...all.map((r) => r.foeHp)), Math.max(...all.map((r) => r.foeHp))], perFoe: Object.fromEntries(FOES.map((f, i) => [f, { wins: avg(all.slice(i * SEEDS.length, (i + 1) * SEEDS.length).map((r) => r.win)), len: med(all.slice(i * SEEDS.length, (i + 1) * SEEDS.length).map((r) => r.t / 60)), first: med(all.slice(i * SEEDS.length, (i + 1) * SEEDS.length).map((r) => r.firstBreak).filter((x) => x !== null)), seqMin: avg(all.slice(i * SEEDS.length, (i + 1) * SEEDS.length).map((r) => r.seqMin)), free: med(all.slice(i * SEEDS.length, (i + 1) * SEEDS.length).flatMap((r) => r.free)) }])) };
    const A2 = res.all[policy + (policy !== 'spam' && policy !== 'gspam' ? ' ' + skill : '')], pct1 = (x) => (Number.isFinite(x) ? (100 * x).toFixed(1) : '-');
    if (AUDIT) { console.log(`${(policy + (policy !== 'spam' && policy !== 'gspam' ? ' ' + skill : '')).padEnd(10)} wins ${pc(A2.wins).padStart(5)}  len ${A2.lenMed.toFixed(1)} [rivals ${A2.rivalLen[0].toFixed(1)}-${A2.rivalLen[1].toFixed(1)}]  skills ${pc(A2.skills)}  in-break ${pc(A2.broken)}  breaks ${A2.breaks.toFixed(1)} first ${A2.firstBreak === null ? '-' : A2.firstBreak.toFixed(0)}s  Estocade ${pct1(A2.topHit)}/${pct1(A2.topGuarded)}/${pct1(A2.topBroken)} % x${A2.topPer}  Eclair ${pct1(A2.ceHit)}/${pct1(A2.ceGuarded)}/${pct1(A2.ceBroken)} % x${A2.ceN.join('/')}  moment every ${A2.gap === null ? '-' : A2.gap.toFixed(1)}s  lights/pause ${A2.pauseMed}  | seq/min ${A2.seqMin.toFixed(1)} free ${A2.freeMed.toFixed(1)}s riposte ${pc(A2.ripShare)} breaks/min ${A2.breakMin.toFixed(2)} renLeft ${pct1(A2.renLeftWon)} % hp ${A2.renHp} v ${A2.foeHp.join('-')}`); continue; }
    console.log(`${(policy + (policy !== 'spam' && policy !== 'gspam' ? ' ' + skill : '')).padEnd(13)} ALL      ${pc(avg(all.map((r) => r.win))).padStart(5)} ${pc(avg(all.map((r) => r.ko))).padStart(5)} ${med(ts).toFixed(1).padStart(5)}               ${pc(avg(all.map((r) => r.light))).padStart(5)} ${pc(avg(all.map((r) => r.skills))).padStart(5)} ${pc(avg(all.map((r) => r.heavy))).padStart(5)} | ${pc(avg(all.map((r) => r.broken))).padStart(5)}  ${avg(all.map((r) => r.breaks)).toFixed(1).padStart(5)} ${fball.length ? med(fball).toFixed(0).padStart(5) : '    -'}     ${String(med(pall)).padStart(5)} ${String(Math.max(...pall)).padStart(3)}   ${avg(all.map((r) => r.apGainMin)).toFixed(1).padStart(5)}`);
  }
  out.variants[variant] = res;
}
const jf = arg('json', ''); if (jf) fs.writeFileSync(jf, JSON.stringify(out, null, 1));
