// The duel played by the computer (src/combat/auto.ts, autoData.ts, autoMatch.ts): the model « La Brute » since lot 1 (the operator's PB-1 « Construire ce
// modèle » and PB-2 « 2, 2, 3, 3, 4 selon le niveau », journal Passe CF3; briefs/combat-auto.md §§ 32-33; journal Passe BL1), on the same rules for every fighter
// (SY-01). Three kinds of proof:
// 1. the port: the final workshop's laboratory copy of the duel (tools/auto-final/sim.mjs) under the set of rules the game plays (`BL1`: `BK5`, the haste when
//    hurt alone, the health of SL1-2), run beside the game on the game's own fighters, gives the same duels event for event, on inputs that reach every path
//    (the principle of journal Passe P1); tools/auto-final/port-identity.mjs proves the fighters' building too, against the laboratory of the commit before;
// 2. each rule and each table against an oracle written from the decisions (PB-1, PB-2, SY-01, SY-02, SY-04, AC-02, AC-05, AC-08, AC-11, AC-13, AC-16 with PB-3,
//    AC-17, AC-18, DB5-3 for the heavy blow, DB5-4 with RY-3, DB7-1, SL1-2), on hand-made fighters and views, never read from the code;
// 3. the game: every version 2 game plays it, its bouts, challenges and off-screen bouts; today's game (`v2=0`) keeps its own duel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';
import { makeSim } from '../tools/auto-final/sim.mjs';
import { VARIANTS } from '../tools/auto-final/variants.mjs';

const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const AM = await load('/src/combat/autoMatch.ts');
const ST = await load('/src/combat/stats.ts');
const SK = await load('/src/combat/skills.ts');
const L = await load('/src/tournament/lab.ts');
const G = await load('/src/simulation/index.ts');
const PO = await load('/src/tournament/pool.ts');
const VG = await load('/src/simulation/v2gear.ts');
const GEAR_MOD = await load('/src/simulation/gear.ts');
const PROF = await load('/src/combat/profiles.ts');
const { Rng } = await load('/src/core/rng.ts');
const { GENERICS } = await load('/src/narrative/generics.ts');

const RIVALS = Object.keys(ST.RIVAL_SHEETS);
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ------------------------------------------------------------------------------------------------- 1. the port against the laboratory's copy

test('the port: the same duels as the final workshop\'s copy under BL1, event for event, on kits, levels, gears, rivals, generic fighters, stages, plans and presses that reach every path', () => {
  // the laboratory's copy on the game's rules (its AP and its guard of before unused under BL1: no AP, the guard by the stats); the health ×4.08 is the game's
  // own (BL1's 2.04 on the old ×2), so the copy takes ×1 of it
  const SIM = makeSim({ hitFactor: ST.hitFactor, AUTO_RULES: { ...AU.AUTO_RULES, ap: { start: 1, max: 5, light: 1 }, guardReduce: 0.8 }, autoFormsOf: AU.autoFormsOf, autoDraw: AU.autoDraw });
  const cfg = { ...VARIANTS.BL1.cfg, hp: 1 };
  const kits = [['t1', 't4', 'd1', 's1'], ['t1', 't2', 't3', 't4'], ['k_sunder', 'k_feint', 't4', 'k_focus'], ['k_parry', 'k_feint', 't1', 't4'], ['k_iron', 'd1', 't4', 'k_cry'], ['t3', 'k_sunder', 't4', 'k_cry'], ['t2', 'k_feint', 't4', 's1']];
  const gears = [{ weapon: 'training-sword', armour: null, acc: [null, null] }, { weapon: 'duelist-sabre', armour: 'padded-jack', acc: ['swift-boots', 'lucky-ribbon'] }, { weapon: 'imported-blade', armour: 'mail-shirt', acc: ['iron-ring', 'champion-token'] }, { weapon: 'imported-blade', armour: 'dock-leathers', acc: ['fervour-charm', null] }];
  const viv = (g) => [g.weapon, g.armour, ...g.acc].reduce((n, id) => n + (id ? GEAR_MOD.GEAR[id]?.fx?.viv ?? 0 : 0), 0);
  const tactics = [undefined, { 0: 'open', 2: 'ready' }, { 1: 'start', 3: 'hurt' }, { 0: 'never', 1: 'follow' }];
  const seen = { ward: 0, boost: 0, dodged: 0, guarded: 0, break: 0, parry: 0, interrupt: 0, chain: 0, heavy: 0, ko: 0, foeWins: 0 };
  let n = 0;
  for (const [ki, loadout] of kits.entries()) for (const foe of [...RIVALS, 'aldric', 'corra']) for (let gi = 0; gi < gears.length; gi++) {
    const stage = (ki + gi + foe.length) % 3, g = gears[gi], lv = 1 + ((ki + gi) % 5);
    const levels = Object.fromEntries([...loadout, 'heavy'].map((id, j) => [id, 1 + ((lv + j) % 5)]));
    const tc = tactics[(ki + gi) % 4], tactic = tc ? Object.fromEntries(Object.entries(tc).map(([i, c]) => [loadout[i], c])) : undefined;
    const stats = { hp: 300 + 30 * gi, atk: 14 + gi, def: 11 + (ki % 4), end: 10 + (gi % 2) * 4, viv: 10 + viv(g) };
    const A = AD.autoRen(stats, { loadout, levels, ...(tactic ? { tactic } : {}) }, { weapon: g.weapon, hpShare: gi === 3 ? 0.8 : 1, taken: ki === 2 ? 1.15 : 1, effect: g.acc.includes('fervour-charm') ? 1.3 : 1, gear: [g.weapon, g.armour, ...g.acc], pieceViv: viv(g) });
    const Gn = GENERICS[foe];
    const B = Gn ? AD.autoFoe(foe, AD.autoGenericSheet(Gn.profile, Gn, stage, 0), { kitOf: Gn.profile, stage }) : AD.autoFoe(foe, AD.autoRaceSheet(foe, stage, stage === 0 ? ki % 3 : 0, { preparation: 20 + 15 * (ki % 5) }), { stage });
    for (const seed of [11 + gi, 4242 + ki * 7]) {
      const cmds = seed % 3 === 0 ? [{ t: 12, skill: loadout[1] }, { t: 40, skill: loadout[2] }] : undefined;
      const m = AU.autoDuel(A, B, seed, { log: true, commands: cmds }), p = SIM.duel({ ...A, gear: g }, B, seed, { log: true, commands: cmds }, cfg); n++;
      assert.deepEqual(m.log, p.log, `${loadout} against ${foe} (stage ${stage}, gear ${gi}), seed ${seed}`);
      assert.deepEqual([m.t, m.hp, m.maxHp, m.winner, m.leadChanges], [p.t, p.hp, p.maxHp, p.winner, p.leadChanges]);
      for (const e of m.log) { if (e.ev in seen) seen[e.ev]++; if ((e.hit ?? 1) > 1) seen.chain++; if (e.act === 'heavy' || e.act === 'm_heavy') seen.heavy++; }
      if (m.winner !== null) seen.ko++;
      if (AU.autoWinner(m) === 1) seen.foeWins++;
    }
  }
  for (const [k, v] of Object.entries(seen)) assert.ok(v > 0, `${k} reached (${JSON.stringify(seen)}, ${n} duels)`);
});

// ------------------------------------------------------------------------------------------------- 2. the tables against the decisions

/** the roles of § 32.2 (PB-1), written here: exploit, punish, pierce, breaker, opener, interrupt, ward, parry, haste, slow, load; and each gap's class */
const ROLE = {
  t1: ['punish', 'R'], t2: ['pierce', 'R'], t3: ['breaker', 'M'], t4: ['exploit', 'L'], d1: ['ward', 'M'], s1: ['haste', 'L'], k_sunder: ['opener', 'M'], k_feint: ['interrupt', 'R'],
  k_iron: ['ward', 'M'], k_parry: ['parry', 'M'], k_cry: ['slow', 'L'], k_focus: ['load', 'L'],
  m_lunge: ['punish', 'R'], m_tempo: ['haste', 'L'], m_brace: ['ward', 'M'], m_wild: ['breaker', 'M'], m_grit: ['load', 'L'], m_riposte: ['pierce', 'R'], m_gild: ['load', 'L'],
  m_shoulder: ['opener', 'M'], m_smite: ['exploit', 'L'], m_aegis: ['ward', 'M'], m_prayer: ['load', 'L'], m_ironfall: ['exploit', 'L'], m_bulwark: ['ward', 'M'], m_resolve: ['load', 'L'],
  m_cleave: ['breaker', 'M'], m_roar: ['slow', 'L'], m_hide: ['ward', 'M'],
};
const GAP = { R: 8, M: 16, L: 28 }, USES = [2, 2, 3, 3, 4];

test('PB-1 and PB-2: every skill a role, its uses per duel by its level (2, 2, 3, 3, 4), a gap between two by its class (8, 16, 28 s); no AP; the heavy blow keeps DB5-3', () => {
  const C = AD.AUTO_CADENCE, c = C.charge, w = C.power;
  assert.deepEqual([C.charge, C.gap, C.effect], [1.8, 3, 3], 'RY-1, RY-2: the rhythm ×3 of SY-03');
  assert.deepEqual([AD.AUTO_BRUTE.charge, AD.AUTO_BRUTE.roleCharge.exploit, AD.AUTO_BRUTE.usePower], [0.6, 0.66, 1.2], 'the skills ×0.6 their charge, the exploits ×0.4, each ×1.2 its power (§ 32.2)');
  assert.equal(SK.SKILLS.heavy.charge[0], 1.7); assert.equal(SK.SKILLS.t4.charge[0], 7.65);
  assert.equal(AD.AUTO_SKILLS.k_sunder.powerK, 0.6, 'Sunder ×0.6 at AC-12\'s test (journal Passe BL1)');
  for (let lv = 1; lv <= 5; lv++) {
    const ren = AD.autoRen(ST.REN_BASE, { loadout: ['t1', 't4', 'd1', 's1'], levels: { t1: lv, t4: lv, d1: lv, s1: lv, heavy: lv } }, { weapon: 'imported-blade' });
    assert.deepEqual([ren.light.kind, ren.light.hits, ren.light.gap], ['light', AD.AUTO_WEAPONS['imported-blade'].hits, 0.32 * C.gap]);
    assert.ok(near(ren.light.charge, 1.2 * c) && near(ren.light.power, 6 * w) && ren.light.gauge === 1 && !('ap' in ren.light), 'the light attack at the cadence, no AP');
    // SY-02 (A3): the heavy blow, a base attack outside the four, its DB5-3 cooldown (5 × its first-level charge), no role nor uses
    assert.deepEqual([ren.heavy.kind, ren.heavy.id, ren.heavy.role, ren.heavy.uses], ['heavy', 'heavy', undefined, undefined]);
    assert.ok(near(ren.heavy.charge, SK.SKILLS.heavy.charge[lv - 1] * c) && near(ren.heavy.cooldown, 5 * 1.7 * c));
    for (const s of ren.skills) {
      const [role, cls] = ROLE[s.id], k = role === 'exploit' ? 0.6 * 0.66 : 0.6;
      assert.equal(s.role, role, s.id); assert.equal(s.uses, USES[lv - 1], `${s.id} at level ${lv}: ${USES[lv - 1]} uses`); assert.equal(s.cooldown, GAP[cls], `${s.id}: its gap`);
      assert.ok(!('ap' in s), `${s.id}: no AP`);
      assert.ok(near(s.charge, AD.autoCharge(s.id, lv) * c * k), `${s.id}: its charge`);
      if (s.power) assert.ok(near(s.power, 120 * (AD.autoCharge(s.id, 1) / 7.65) * (AD.AUTO_SKILLS[s.id].powerK ?? 1) * SK.LEVEL_POWER[lv - 1] * w * 1.2), `${s.id}: its power`);
    }
  }
  assert.ok(!AD.autoRen(ST.REN_BASE, { loadout: ['heavy', 't1', 't4', 's1'], levels: {} }).skills.some((s) => s.id === 'heavy'), 'never one of the four');
  // what each role carries besides: Tourbillon cannot be dodged, Fente goes through the guard and a ward, the Feint through the guard; a parry's window of 3 s
  // that takes 95 %; a support its role's effect (the haste ×0.7 15 s, the slow ×1.4 12 s, the load ×2 and ×1.5 on the gauge, 15 s)
  const one = (id) => AD.autoSkill(id, 1);
  assert.ok(one('t3').undodge && one('t2').pierce && one('t2').pierceWard && one('k_feint').pierce && !one('t1').pierce);
  assert.deepEqual([one('k_parry').ward.dur, one('k_parry').ward.dmg], [3, 0.05]);
  assert.deepEqual([AU.AUTO_RULES.haste, AU.AUTO_RULES.slow, AU.AUTO_RULES.load], [{ k: 0.7, dur: 15 }, { k: 1.4, dur: 12 }, { dmg: 2, gauge: 1.5, dur: 15 }]);
  assert.deepEqual([one('s1').boost.dur, one('k_cry').boost.dur, one('k_focus').boost.dur], [15, 12, 15]);
  for (const id of Object.keys(AD.AUTO_SKILLS)) if (id !== 'heavy') assert.ok(AD.AUTO_ROLES[id], `${id} has a role`);
});

test('SY-01 with PB-1: the rivals on the same tables, their skills\' uses by their stage (1, 2, 3 at the pool, the bracket, the final), each its style', () => {
  const C = AD.AUTO_CADENCE, c = C.charge, w = C.power;
  /** the styles of § 32.2, written here: the dodge and the guard ×, the heavy blow as soon as ready for the brawlers, Cassius's brace a parry */
  const STYLE = { vessa: [2, 0.5], tobin: [0.8, 0.4, 'ready'], cassius: [1.3, 1.2], orla: [0.6, 1, 'ready'], ilse: [0.5, 1.6], marek: [0.3, 1.3], rhosk: [0.3, 0.8] };
  for (const id of RIVALS) for (const stage of [0, 1, 2]) {
    const f = AD.autoFoe(id, ST.RIVAL_SHEETS[id], { stage }), P = PROF.DYN_PROFILES[id], n = Math.round((P.comboLen[0] + P.comboLen[1]) / 2);
    assert.equal(f.tempo, 10, `${id}: Speed 10 for its tables`);
    assert.deepEqual([f.light.kind, f.light.hits.length], ['light', n], `${id}: its light attack`);
    assert.ok(near(f.light.charge, 1.2 * c) && near(f.light.power, 6 * w) && near(f.light.hits.reduce((a, b) => a + b, 0), 1.1, 1e-3));
    assert.ok(near(f.heavy.charge, 1.7 * c) && near(f.heavy.cooldown, 5 * 1.7 * c), `${id}: the heavy blow at level 1, DB5-3`);
    const [dodge, guard, heavy] = STYLE[id];
    assert.deepEqual([f.style.dodge, f.style.guard, f.style.heavy], [dodge, guard, heavy], `${id}: its style`);
    for (const s of f.skills) {
      const [role, cls] = ROLE[s.id], parry = id === 'cassius' && s.id === 'm_brace';
      assert.equal(s.role, parry ? 'parry' : role, `${id} ${s.id}`); assert.equal(s.uses, USES[stage], `${id} ${s.id} at stage ${stage}`); assert.equal(s.cooldown, GAP[cls]);
      if (s.power) assert.ok(near(s.power, 120 * (s.charge / (c * 0.6 * (role === 'exploit' ? 0.66 : 1)) / 7.65) * w * 1.2), `${id} ${s.id}: its power by its charge`);
    }
    assert.deepEqual(f.tactic, f.skills.map((s) => AD.AUTO_STYLES[id].tactic[s.id] ?? 'auto'), `${id}: its plan`);
    const fam = f.skills.map((s) => (s.ward ? 0 : s.boost ? 1 : 2));
    assert.deepEqual(fam, [...fam].sort(), `${id}: its order (the wards, the supports, then the offensive skills)`);
  }
  // a generic fighter fights in its rival's style
  assert.deepEqual(AD.autoFoe('aldric', ST.RIVAL_SHEETS.marek, { kitOf: 'marek' }).style, AD.autoFoe('marek', ST.RIVAL_SHEETS.marek).style);
  // the chances the match sheet shows (the duel's formulas): the stats, a style, the gear's effects
  assert.deepEqual(AM.autoReactions({ def: 10, viv: 10 }, { atk: 10, viv: 10 }), { dodge: 0.12, guard: 0.35, guardSkill: 0.7, reduce: 0.5 }, 'the stats alone');
  const r = AM.autoReactions({ def: 10, viv: 10, style: { dodge: 2, guard: 0.5 }, gfx: { dodge: 0.5, guardChance: 0.85 } }, { atk: 10, viv: 10 });
  assert.ok(near(r.dodge, 0.12) && near(r.guard, 0.35 * 0.5 * 0.85));
});

// ------------------------------------------------------------------------------------------------- the rules against their oracles (hand-made fighters)

/** a gauge in the old units (what a hit adds at Endurance 10) as the weight the rule of RY-3 takes */
const W = (g) => (g * AU.AUTO_RULES.gauge.blows) / AU.AUTO_RULES.gauge.max;
/** a hand-made fighter: one light attack (power 100, no gauge, one hit, 1 s), a heavy blow that never goes (a charge for ever: no opponent stays open or broken
 *  that long), no skill */
const act = (o = {}) => ({ id: 'light', kind: 'light', charge: 1, power: 100, gauge: 0, hits: [1], gap: 0.3, ...o });
const noHeavy = () => act({ id: 'heavy', kind: 'heavy', charge: 1e9, power: 1 });
const fighter = (o = {}) => ({ id: 'a', side: 'ren', hp: 1e6, atk: 10, def: 10, end: 10, viv: 10, tempo: 10, taken: 1, light: act(), heavy: noHeavy(), skills: [], brain: 'player', ...o });
const dummy = (o = {}) => fighter({ id: 'b', side: 'foe', light: act({ charge: 1e7, power: 1 }), brain: 'rival', ...o });
/** the rules with only what a test isolates: no form, no reaction, no gauge decay, the light attack's charge ×1, health ×1, unless given */
const rules = (o = {}) => { const r = JSON.parse(JSON.stringify(AU.AUTO_RULES)); r.form = 0; r.react.dodge = 0; r.react.guard = 0; r.gauge.decay = 0; r.maxT = 200; r.lightCharge = 1; r.hpScale = 1; for (const [k, v] of Object.entries(o)) { if (typeof v === 'object') Object.assign(r[k], v); else r[k] = v; } return r; };
const blows = (r, who = 'a') => r.log.filter((e) => e.who === who && ['hit', 'guarded', 'dodged'].includes(e.ev));
const duel = (A, B, seed, R, o = {}) => AU.autoDuel(A, B, seed, { rules: R, log: true, ...o });

test('DB7-1: a blow\'s damage is its power × 2·Atk / (Atk + Def); every health ×3.48 (AC-13\'s ×2, the model\'s ×1.2, SL1-2\'s ×1.45)', () => {
  for (const [atk, def] of [[15, 10], [10, 20], [7, 7], [22, 16.5]]) {
    const r = duel(fighter({ atk }), dummy({ def, hp: 1000 }), 5, rules());
    assert.equal(blows(r)[0].dmg, Math.round(100 * (2 * atk) / (atk + def)), `${atk} against ${def}`);
  }
  assert.ok(near(AU.AUTO_RULES.hpScale, 2 * 1.2 * 1.45));
  assert.equal(AU.autoDuel(fighter({ hp: 500 }), dummy({ hp: 1000 }), 1, { rules: { ...rules(), hpScale: AU.AUTO_RULES.hpScale } }).maxHp[1], 3480);
});

test('AC-05 with PB-1: the guard\'s chance from the stats (35 % at equality, ×2 against a big action seen coming, at most 90 %, × a style), a guarded blow loses 30 to 70 % by the Defence against the Attack (DB5-2 changed), ×2 to the guarder\'s gauge', () => {
  assert.deepEqual(AU.AUTO_RULES.react, { dodge: 0.12, guard: 0.35, skillGuard: 2, cap: 0.9 });
  assert.deepEqual(AU.AUTO_RULES.guard, { base: 0.5, lo: 0.3, hi: 0.7 });
  const freq = (A, B, R) => { const b = blows(duel(A, B, 77, R)); return { p: b.filter((e) => e.ev === 'guarded').length / b.length, b }; };
  const R = rules({ react: { guard: 0.35 }, maxT: 2000 });
  // the share taken off (the oracle: 50 % × 2·Def / (Def + Atk), between 30 and 70 %)
  for (const [def, atk, kind, want, off] of [[10, 10, 'light', 0.35, 0.5], [30, 10, 'light', 0.525, 0.7], [10, 10, 'skill', 0.7, 0.5], [10, 10, 'heavy', 0.7, 0.5], [30, 10, 'skill', 0.9, 0.7], [10, 30, 'light', 0.175, 0.3], [14, 10, 'light', 0.35 * 2 * 14 / 24, 0.5 * 2 * 14 / 24]]) {
    const { p, b } = freq(fighter({ atk, light: act({ kind, charge: 0.2 }) }), dummy({ def }), R);
    assert.ok(Math.abs(p - want) < 0.02, `def ${def}, atk ${atk}, ${kind}: ${p.toFixed(3)} for ${want} (${b.length} blows)`);
    const g = b.find((e) => e.ev === 'guarded'), h = b.find((e) => e.ev === 'hit'), k = (2 * atk) / (atk + def);
    assert.equal(g.dmg, Math.round(100 * k * (1 - off)), `the guard takes ${off * 100} % off`); assert.equal(h.dmg, Math.round(100 * k));
  }
  // a style multiplies the guard's chance: Ilse's shield ×1.6
  assert.ok(Math.abs(freq(fighter({ light: act({ charge: 0.2 }) }), dummy({ style: { dodge: 1, guard: 1.6 } }), R).p - 0.56) < 0.02);
  const certain = rules({ react: { guard: 1, cap: 1 } });
  assert.equal(freq(fighter({ light: act({ pierce: true, charge: 0.2 }) }), dummy(), certain).p, 0, 'a pierce blow is never guarded');
  const brk = (R2) => { const r = duel(fighter({ light: act({ gauge: W(10) }) }), dummy(), 3, R2); const i = r.log.findIndex((e) => e.ev === 'break'); return blows(r).filter((e) => r.log.indexOf(e) < i).length; };
  assert.equal(brk(certain), 4, 'a guarded blow fills the gauge twice'); assert.equal(brk(rules()), 7);
});

test('AC-05 with SY-01: the dodge from the Speed (12 % at equality, × a style); a fighter charging anything but its light attack neither guards nor dodges', () => {
  const R = rules({ react: { dodge: 0.12 }, maxT: 2000 });
  for (const [vd, va, st, want] of [[10, 10, 1, 0.12], [20, 10, 1, 0.16], [10, 20, 1, 0.08], [10, 10, 2, 0.24], [10, 10, 0.3, 0.036]]) {
    const b = blows(duel(fighter({ viv: va, light: act({ charge: 0.2 }) }), dummy({ viv: vd, style: { dodge: st, guard: 1 } }), 9, R));
    const p = b.filter((e) => e.ev === 'dodged').length / b.length;
    assert.ok(Math.abs(p - want) < 0.02, `${vd} against ${va}, style ×${st}: ${p.toFixed(3)} for ${want}`);
  }
  const sure = rules({ react: { dodge: 1 }, maxT: 2000 });
  const exposed = (kind) => blows(duel(fighter(), dummy({ light: act({ kind, charge: 1e7 }) }), 4, sure)).filter((e) => e.t > 0.6);
  assert.ok(exposed('light').every((e) => e.ev === 'dodged'));
  assert.ok(exposed('skill').every((e) => e.ev === 'hit')); assert.ok(exposed('heavy').every((e) => e.ev === 'hit'));
  // Tourbillon's role: never dodged
  assert.ok(blows(duel(fighter({ light: act({ undodge: true, charge: 0.2 }) }), dummy(), 9, sure)).every((e) => e.ev === 'hit'));
});

test('SY-04: one draw per blow — a reaction’s draw keyed by the striker, its action’s rank and the hit’s rank; a choice changes only what follows from it', () => {
  const R = rules({ react: { dodge: 0.3 }, maxT: 60 }), seed = 321;
  const r = duel(fighter({ light: act({ hits: [0.5, 0.5], charge: 0.5 }) }), dummy(), seed, R);
  let k = 0, j = 0, n = 0;
  for (const e of r.log.filter((x) => x.who === 'a')) {
    if (e.ev === 'charge') { k++; j = 0; continue; }
    j++; n++;
    assert.equal(e.ev === 'dodged', AU.autoDraw(seed, 0, k, j, 1) < 0.3, `action ${k}, hit ${j}`);
  }
  assert.ok(n > 50);
  const sk = act({ id: 'sk', kind: 'skill', charge: 0.5, uses: 1, hits: [0.5, 0.5] });
  const a = duel(fighter({ light: act({ hits: [0.5, 0.5], charge: 0.5 }) }), dummy(), seed, R), b = duel(fighter({ light: act({ hits: [0.5, 0.5], charge: 0.5 }), skills: [sk], tactic: ['ready'] }), dummy(), seed, R);
  const reactions = (x) => x.log.filter((e) => e.who === 'a' && e.ev !== 'charge').map((e) => `${e.ev}:${e.t}`);
  assert.equal(b.log.find((e) => e.who === 'a' && e.ev === 'charge').act, 'sk', 'the skill at the first choice');
  assert.deepEqual(reactions(a).slice(2), reactions(b).slice(2), 'the same reactions from the second action on');
});

test('AC-02: an enchaînement strikes its hits `gap` apart, each its share of the power, each guarded or dodged alone', () => {
  const A = () => fighter({ light: act({ hits: [0.4, 0.4, 0.4], gap: 0.22 }) });
  const first = blows(duel(A(), dummy(), 6, rules({ maxT: 60 }))).slice(0, 3);
  assert.deepEqual(first.map((e) => e.hit), [1, 2, 3]);
  assert.ok(Math.abs(first[1].t - first[0].t - 0.22) < 0.011 && Math.abs(first[2].t - first[1].t - 0.22) < 0.011);
  for (const e of first) assert.equal(e.dmg, 40);
  const r = duel(A(), dummy(), 6, rules({ react: { dodge: 0.3 }, maxT: 60 })), actions = [];
  for (const e of r.log.filter((x) => x.who === 'a')) { if (e.ev === 'charge') actions.push([]); else actions[actions.length - 1].push(e.ev); }
  assert.ok(actions.some((evs) => evs.includes('dodged') && evs.includes('hit')));
  assert.equal(AD.autoSkill('t1', 1).hits.length, 2); assert.equal(AD.autoSkill('t3', 1).hits.length, 3);
  assert.deepEqual(['training-sword', 'imported-blade', 'duelist-sabre'].map((w) => AD.autoLight(w).hits.length), [2, 2, 3]);
  // the light attack charges ×1.35 (§ 32.2: fewer skills, the light fills the time)
  assert.equal(AU.AUTO_RULES.lightCharge, 1.35);
  const c = duel(fighter(), dummy(), 6, rules({ lightCharge: 1.35, maxT: 30 })).log.filter((e) => e.who === 'a' && e.ev === 'charge');
  assert.ok(near(c[1].at - c[1].t, 1.35, 0.011));
});

test('PB-1 and PB-2: a skill leaves as many times as its uses, its gap apart; the heavy blow comes back 5 × its charge (DB5-3)', () => {
  const sk = act({ id: 'sk', kind: 'skill', charge: 1, uses: 3, cooldown: 10 });
  const starts = duel(fighter({ skills: [sk], tactic: ['ready'] }), dummy(), 2, rules({ maxT: 120 })).log.filter((e) => e.act === 'sk' && e.ev === 'charge').map((e) => e.t);
  assert.equal(starts.length, 3, 'its uses, then never again');
  for (let i = 1; i < starts.length; i++) { assert.ok(starts[i] - starts[i - 1] >= 10 - 1e-6); assert.ok(starts[i] - starts[i - 1] < 11.5); }
  // the lucky ribbon: its gaps and the heavy blow's cooldown −15 %
  const ribbon = duel(fighter({ skills: [sk], tactic: ['ready'], gfx: { cd: 0.85 } }), dummy(), 2, rules({ maxT: 120 })).log.filter((e) => e.act === 'sk' && e.ev === 'charge').map((e) => e.t);
  assert.ok(ribbon[1] - ribbon[0] >= 8.5 - 1e-6 && ribbon[1] - ribbon[0] < 10 - 1e-6);
  for (const id of ['t1', 't4', 'k_cry']) assert.equal(AD.autoSkill(id, 3).uses, 3);
  assert.ok(near(AD.autoHeavy(3).cooldown, 5 * AD.autoCharge('heavy', 1) * AD.AUTO_CADENCE.charge));
});

test('PB-1: the opening (« la faille ») — neither guard nor dodge, ×1.25 taken; made by an opener (5 s), an interrupt (6 s, its action cut, its use spent, 1 s before it acts), a parry (a big blow taken, 6 s) or a big action dodged (2.5 s)', () => {
  // (an opener's opening 5 s: the laboratory's 8 shortened at AC-12's test, journal Passe BL1)
  assert.deepEqual([AU.AUTO_RULES.open.dmg, AU.AUTO_RULES.whiff, AU.AUTO_RULES.opener, AU.AUTO_RULES.interrupt, AU.AUTO_RULES.parry], [1.25, 2.5, 5, { open: 6, stagger: 1 }, { open: 6, dur: 3 }]);
  // an opener: the target certain to guard and dodge takes every blow for 5 s after it, ×1.25
  const sure = rules({ react: { dodge: 0, guard: 1, cap: 1 }, maxT: 30 });
  const opener = act({ id: 'op', kind: 'skill', role: 'opener', charge: 1, uses: 1, pierce: true });
  const r = duel(fighter({ skills: [opener], tactic: ['ready'], light: act({ charge: 0.5 }) }), dummy(), 3, sure);
  const hitOp = r.log.find((e) => e.act === 'op' && e.ev === 'hit'), after = blows(r).filter((e) => e.act === 'light' && e.t > hitOp.t);
  assert.ok(after.filter((e) => e.t < hitOp.t + 5 - 0.01).every((e) => e.ev === 'hit' && e.dmg === 125), 'open: every blow lands, ×1.25');
  assert.ok(after.filter((e) => e.t > hitOp.t + 5 + 0.01).every((e) => e.ev === 'guarded'), 'closed after 5 s');
  // an interrupt: the target charging a big action has it cut (its use spent), acts again 1 s later, open 6 s
  const big = act({ id: 'big', kind: 'skill', charge: 20, power: 500, uses: 1 }), feint = act({ id: 'fe', kind: 'skill', role: 'interrupt', charge: 1, power: 10, uses: 1 });
  const B = dummy({ skills: [big], tactic: ['ready'], light: act({ charge: 5, power: 1 }) });
  const r2 = duel(fighter({ skills: [feint], tactic: ['ready'], light: act({ charge: 30 }) }), B, 4, rules({ maxT: 40 }));
  const cut = r2.log.find((e) => e.ev === 'interrupt');
  assert.ok(cut && cut.act === 'big' && cut.who === 'a', 'the big action cut');
  assert.ok(!r2.log.some((e) => e.act === 'big' && e.ev === 'hit'), 'it never lands');
  const next = r2.log.find((e) => e.who === 'b' && e.ev === 'charge' && e.t > cut.t);
  assert.ok(near(next.t, cut.t + 1, 0.011) && next.act !== 'big', 'it acts again 1 s later, its use spent');
  // a parry: a big blow landing in its 3 s window is taken whole, its striker open 6 s; a light blow is not parried
  const parry = act({ id: 'pa', kind: 'skill', role: 'parry', charge: 0.5, uses: 1, ward: { dur: 3, dmg: 0.05, gauge: 0.5 } });
  const strike = act({ id: 'st', kind: 'skill', charge: 2, power: 300, uses: 1 });
  const r3 = duel(dummy({ id: 'a', side: 'ren', brain: 'player', skills: [parry], tactic: ['ready'] }), fighter({ id: 'b', side: 'foe', brain: 'rival', skills: [strike], tactic: ['ready'], light: act({ charge: 1e7 }) }), 5, rules({ maxT: 10 }));
  const pa = r3.log.find((e) => e.ev === 'parry');
  assert.ok(pa && pa.who === 'a' && pa.act === 'st', 'the big blow parried');
  assert.ok(!r3.log.some((e) => e.act === 'st' && e.ev === 'hit'), 'no damage');
  // a big action dodged: its striker open 2.5 s (the target then lands everything)
  const dodgeAll = rules({ react: { dodge: 1, guard: 1, cap: 1 }, maxT: 30 });
  const r4 = duel(fighter({ skills: [act({ id: 'sw', kind: 'skill', charge: 1, power: 50, uses: 1 })], tactic: ['ready'], light: act({ charge: 40 }) }), dummy({ light: act({ charge: 0.3, power: 10 }) }), 6, dodgeAll);
  const wh = r4.log.find((e) => e.act === 'sw' && e.ev === 'dodged'), back = blows(r4, 'b').filter((e) => e.t > wh.t);
  assert.ok(back.filter((e) => e.t < wh.t + 2.5 - 0.01).every((e) => e.ev === 'hit') && back.some((e) => e.t > wh.t + 2.5 + 0.01 && e.ev !== 'hit'));
});

test('PB-1: the roles in the blow — the exploit ×2 in an opening, a break or on a fighter charging a big action and ×0.6 else, the punish ×1.7 on a fighter charging a big action, the piercer through a ward, the supports on the charges and the next blow', () => {
  assert.deepEqual([AU.AUTO_RULES.exploit, AU.AUTO_RULES.punish], [{ hi: 2, lo: 0.6 }, 1.7]);
  const dmgOf = (A, B, id) => { const b = blows(duel(A, B, 7, rules({ maxT: 60 }))).find((e) => e.act === id); assert.ok(b, `${id} lands`); return b.dmg; };
  const ex = act({ id: 'ex', kind: 'skill', role: 'exploit', charge: 1, power: 100, uses: 1 }), pu = act({ id: 'pu', kind: 'skill', role: 'punish', charge: 1, power: 100, uses: 1 });
  const charging = dummy({ skills: [act({ id: 'big', kind: 'skill', charge: 50, uses: 1, power: 1 })], tactic: ['ready'] });
  assert.equal(dmgOf(fighter({ skills: [ex], tactic: ['ready'], light: act({ charge: 9 }) }), dummy(), 'ex'), 60, 'the exploit ×0.6 on a fighter at rest');
  assert.equal(dmgOf(fighter({ skills: [ex], tactic: ['ready'], light: act({ charge: 9 }) }), charging, 'ex'), 200, 'the exploit ×2 on a fighter charging a big action');
  assert.equal(dmgOf(fighter({ skills: [pu], tactic: ['ready'], light: act({ charge: 9 }) }), dummy(), 'pu'), 100);
  assert.equal(dmgOf(fighter({ skills: [pu], tactic: ['ready'], light: act({ charge: 9 }) }), charging, 'pu'), 170, 'the punish ×1.7');
  // a ward takes its share off; the piercer goes through it
  const warded = dummy({ skills: [act({ id: 'w', kind: 'skill', charge: 0.1, uses: 1, ward: { dur: 50, dmg: 0.4, gauge: 1 } })], tactic: ['ready'] });
  assert.equal(dmgOf(fighter({ light: act({ charge: 2 }) }), warded, 'light'), 40);
  assert.equal(dmgOf(fighter({ light: act({ charge: 2, pierceWard: true }) }), warded, 'light'), 100);
  // the haste: the fighter's charges ×0.7 for 15 s; the slow: the opponent's ×1.4 for 12 s; the load: the next skill or heavy blow ×2 (×1.5 on the gauge)
  const haste = act({ id: 'h', kind: 'skill', role: 'haste', charge: 0.5, uses: 1, boost: { dur: 15, dmg: 1, gauge: 1 } });
  const ch = duel(fighter({ skills: [haste], tactic: ['ready'] }), dummy(), 1, rules({ maxT: 20 })).log.filter((e) => e.who === 'a' && e.ev === 'charge' && e.act === 'light');
  assert.ok(near(ch[0].at - ch[0].t, 0.7, 0.011), 'the haste ×0.7');
  const slow = act({ id: 'sl', kind: 'skill', role: 'slow', charge: 0.5, uses: 1, boost: { dur: 12, dmg: 1, gauge: 1 } });
  const B = dummy({ light: act({ charge: 1, power: 1 }) }), sl = duel(fighter({ skills: [slow], tactic: ['ready'], light: act({ charge: 30 }) }), B, 1, rules({ maxT: 20 }));
  const land = sl.log.find((e) => e.ev === 'boost').t, bc = sl.log.find((e) => e.who === 'b' && e.ev === 'charge' && e.t > land);
  assert.ok(near(bc.at - bc.t, 1.4, 0.011), 'the slow ×1.4 on the opponent');
  const load = act({ id: 'lo', kind: 'skill', role: 'load', charge: 0.5, uses: 1, boost: { dur: 15, dmg: 2, gauge: 1.5 } }), hit = act({ id: 'hi', kind: 'skill', charge: 0.5, power: 100, uses: 2, cooldown: 0.2 });
  const lr = duel(fighter({ skills: [load, hit], tactic: ['ready', 'ready'], light: act({ charge: 30 }) }), dummy(), 1, rules({ maxT: 20 })), hits = blows(lr).filter((e) => e.act === 'hi');
  assert.deepEqual([hits[0].dmg, hits[1].dmg], [200, 100], 'the load on the next offensive action only');
});

test('DB5-4 (A3) with RY-3 (A3): the break — a gauge of 70 broken by 22.5 blows by default, stunned 10 s (the iron ring 7), ×1.4 taken, its charge paused, its enchaînement cut; the decay', () => {
  const B = dummy({ light: act({ charge: 30, power: 1 }) }), r = duel(fighter({ light: act({ gauge: W(10) }) }), B, 8, rules({ maxT: 200 }));
  const brk = r.log.find((e) => e.ev === 'break' && e.who === 'b'), b = blows(r), i = b.findIndex((e) => e.t > brk.t);
  assert.equal(b.filter((e) => e.t <= brk.t).length, 7);
  assert.ok(b.slice(i).filter((e) => e.t < brk.t + 10).every((e) => e.dmg === 140), 'the damage ×1.4 while stunned (RY-3)');
  assert.ok(b.find((e) => e.t > brk.t + 10).dmg === 100, 'back to ×1 after');
  const charge = r.log.find((e) => e.who === 'b' && e.ev === 'charge'), landed = r.log.find((e) => e.who === 'b' && ['hit', 'guarded', 'dodged'].includes(e.ev));
  const stuns = r.log.filter((e) => e.ev === 'break' && e.who === 'b' && e.t < landed.t).length;
  assert.ok(stuns >= 2 && Math.abs(landed.t - (charge.at + 10 * stuns)) < 0.011, 'its charge paused by each stun');
  const ring = duel(fighter({ light: act({ gauge: W(10) }) }), dummy({ light: act({ charge: 30, power: 1 }), gfx: { stun: 0.7 } }), 8, rules({ maxT: 200 }), { trace: true });
  const rb = ring.log.find((e) => e.ev === 'break' && e.who === 'b');
  assert.equal(rb.dur, 7, 'the iron ring: its break 7 s (the trace says it)');
  const C = dummy({ light: act({ charge: 0.5, power: 1, hits: [0.2, 0.2, 0.2, 0.2, 0.2], gap: 1 }), gauge: 0 });
  const r2 = duel(fighter({ light: act({ charge: 1.25, gauge: W(70) }) }), C, 1, rules({ maxT: 20 }));
  const b2 = r2.log.find((e) => e.ev === 'break' && e.who === 'b');
  assert.equal(r2.log.filter((e) => e.who === 'b' && e.ev === 'hit' && e.t > b2.t && e.t < b2.t + 10).length, 0, 'no hit of its chain during its stun');
  assert.equal(AU.AUTO_RULES.gauge.decay, 0.16);
  assert.deepEqual([AU.AUTO_RULES.gauge.max, AU.AUTO_RULES.gauge.blows, AU.AUTO_RULES.brk.stun, AU.AUTO_RULES.brk.dmg], [70, 22.5, 10, 1.4]);
  const plain = (end) => { const x = duel(fighter({ light: act({ charge: 1, gauge: 1 }) }), dummy({ end }), 1, rules({ gauge: { decay: 0 }, maxT: 400 })); const k = x.log.find((e) => e.ev === 'break'); return blows(x).filter((e) => e.t <= k.t).length; };
  assert.deepEqual([plain(10), plain(20)], [23, 45]);
  assert.equal(AD.autoLight('imported-blade').gauge, 1); assert.equal(AD.autoSkill('t4', 1).gauge, 2); assert.equal(AD.autoSkill('t3', 1).gauge, 3); assert.equal(AD.autoSkill('k_sunder', 1).gauge, 4);
  // a traced blow carries its target's gauge right after it (the arena reads it)
  const tr = duel(fighter({ light: act({ gauge: 1 }) }), dummy(), 1, rules({ maxT: 5 }), { trace: true }), h = tr.log.find((e) => e.ev === 'hit');
  assert.ok(near(h.g, (70 / 22.5), 0.006) && h.s.length === 2);
});

test('AC-08: each fighter\'s form of the day, ±15 %, from its own stream: the duel\'s other draws are the same without it', () => {
  const forms = [];
  for (let s = 1; s <= 300; s++) { const r = duel(fighter(), dummy({ hp: 50 }), s, rules({ form: 0.15 })); forms.push(...r.form); assert.equal(blows(r)[0].dmg, Math.max(1, Math.round(100 * r.form[0]))); }
  assert.ok(Math.min(...forms) >= 0.85 && Math.max(...forms) <= 1.15 && Math.min(...forms) < 0.87 && Math.max(...forms) > 1.13);
  assert.ok(Math.abs(forms.reduce((a, b) => a + b, 0) / forms.length - 1) < 0.01);
  const ev = (R) => blows(duel(fighter(), dummy(), 42, R)).map((e) => `${e.t} ${e.ev}`);
  assert.deepEqual(ev(rules({ react: { dodge: 0.12, guard: 0.35 }, form: 0.15 })), ev(rules({ react: { dodge: 0.12, guard: 0.35 }, form: 0 })));
  assert.equal(AU.AUTO_RULES.form, 0.15);
  for (const seed of [1, 42, 99991]) {
    const r = duel(fighter(), dummy(), seed, rules({ form: 0.15 })), fr = new Rng((seed ^ 0x9e3779b9) >>> 0);
    assert.deepEqual(r.form, [1 + 0.15 * (2 * fr.next() - 1), 1 + 0.15 * (2 * fr.next() - 1)]);
    assert.equal(r.log.find((e) => e.who === 'a' && e.ev === 'charge').t, +(AU.autoDraw(seed, 0, 0, 0, 3) * AU.AUTO_RULES.start).toFixed(2));
  }
});

test('determinism: the same seed gives the same duel, another seed another', () => {
  const A = () => AD.autoRen({ hp: 324, atk: 17, def: 17, end: 10, viv: 9 }, { loadout: ['t1', 't4', 'd1', 's1'], levels: { t1: 2 } }, { weapon: 'imported-blade', gear: ['imported-blade', 'mail-shirt'], pieceViv: -1 });
  const B = () => AD.autoFoe('orla', AD.autoRaceSheet('orla', 0, 1, { preparation: 61 }));
  const a = AU.autoDuel(A(), B(), 1234, { log: true }), b = AU.autoDuel(A(), B(), 1234, { log: true }), c = AU.autoDuel(A(), B(), 1235, { log: true });
  assert.deepEqual(a, b); assert.notDeepEqual(a.log, c.log);
});

// ------------------------------------------------------------------------------------------------- the plan and the automatic (hand-made views)

const side = (o = {}) => ({ ward: null, broken: false, act: null, at: 0, stunEnd: 0, hp: 100, maxHp: 100, openUntil: 0, hasteUntil: 0, slowUntil: 0, next: null, combo: null, x: { style: undefined }, ...o });
const view = (o = {}) => ({ t: 10, me: side(o.me), foe: side(o.foe), rules: AU.AUTO_RULES, usable: o.usable ?? ((a) => !(a.cooldown >= 1e9)), gauge: (s) => s?.g ?? 0, chargeOf: (_, a) => a.charge, rand: () => 0.99 });
const sk = (id, role, o = {}) => ({ id, kind: 'skill', role, charge: 3, uses: 2, ...o });
const heavy = (o = {}) => ({ id: 'heavy', kind: 'heavy', charge: 1, ...o });
const X = (skills, tactic) => ({ ...fighter(), heavy: heavy({ cooldown: 1e9 }), skills, tactic });

test('SY-01: one automatic for every fighter, Ren as a rival', () => {
  assert.equal(AU.DECIDERS.player, AU.DECIDERS.rival);
  assert.equal(AU.DECIDERS.player, AU.autoDecider);
});

test('SL1-3 changed by PB-1: the automatic plays the general plan, its rule by each skill\'s role, in the fighter\'s order (AC-09), a skill whose effect runs never raised again', () => {
  const C = (s, o, x = X([s])) => AU.autoSkillChoice(view(o), x) === s;
  const ex = sk('t4', 'exploit'), pu = sk('t1', 'punish'), pi = sk('t2', 'pierce'), br = sk('t3', 'breaker');
  // the exploit: in an opening or a break long enough for it to land, to finish (under a quarter), or Ren nearly down (under 30 %)
  assert.ok(!C(ex, {}) && C(ex, { foe: { openUntil: 13.5 } }) && !C(ex, { foe: { openUntil: 12 } }) && C(ex, { foe: { broken: true, stunEnd: 14 } }));
  assert.ok(C(ex, { foe: { hp: 24 } }) && !C(ex, { foe: { hp: 26 } }) && C(ex, { me: { hp: 29 } }) && !C(ex, { me: { hp: 31 } }));
  // the punish, the piercer and the breaker as soon as they are ready
  assert.ok(C(pu, {}) && C(pi, {}) && C(br, {}));
  // the opener when another skill or the heavy blow can profit from it (or no exploit in the kit)
  const op = sk('k_sunder', 'opener');
  assert.ok(C(op, {}, X([op, pu])), 'no exploit in the kit');
  assert.ok(!C(op, { usable: (a) => a !== ex && !(a.cooldown >= 1e9) }, X([op, ex])) && C(op, {}, X([op, ex])), 'an exploit ready to follow');
  // the interrupt on a big action it can cut before it leaves
  const fe = sk('k_feint', 'interrupt', { charge: 1 });
  assert.ok(C(fe, { foe: { act: { kind: 'skill' }, at: 12 } }) && !C(fe, { foe: { act: { kind: 'skill' }, at: 10.5 } }) && !C(fe, { foe: { act: { kind: 'light' }, at: 15 } }));
  // the ward on a big action it can be up for, or its own gauge past two thirds; the parry on a big action coming within its window
  const wa = sk('d1', 'ward', { ward: { dur: 9 } }), pa = sk('k_parry', 'parry', { charge: 1, ward: { dur: 3 } });
  assert.ok(C(wa, { foe: { act: { kind: 'skill' }, at: 15 } }) && !C(wa, { foe: { act: { kind: 'heavy' }, at: 12 } }) && C(wa, { me: { g: 47 } }) && !C(wa, { me: { g: 46 } }));
  assert.ok(C(pa, { foe: { act: { kind: 'skill' }, at: 12 } }) && !C(pa, { foe: { act: { kind: 'skill' }, at: 15 } }));
  assert.ok(!C(wa, { me: { g: 50, ward: { until: 15 } } }), 'a ward up: not raised again');
  // the haste when hurt alone (lot 1: « blessé » seul, journal Passe BL1), never twice at once
  const ha = sk('s1', 'haste', { boost: { dur: 15 } });
  assert.ok(C(ha, { me: { hp: 49 } }) && !C(ha, { me: { hp: 51 } }) && !C(ha, { foe: { broken: true, stunEnd: 20 } }) && !C(ha, { me: { hp: 30, hasteUntil: 12 } }));
  // the slow on a big action coming, or late (past half of either health); the load when something can follow it
  const sl = sk('k_cry', 'slow', { boost: { dur: 12 } }), lo = sk('k_focus', 'load', { boost: { dur: 15 } });
  assert.ok(C(sl, { foe: { act: { kind: 'skill' }, at: 15 } }) && !C(sl, {}) && C(sl, { foe: { hp: 49 } }) && C(sl, { me: { hp: 49 } }));
  assert.ok(C(lo, {}, X([lo, pu])) && !C(lo, { usable: (a) => a === lo }, X([lo, pu])), 'something to follow it (here the heavy blow is never ready)');
  // the first that holds in the order; none: the base attacks
  assert.equal(AU.autoSkillChoice(view({}), X([ex, pu, br])), pu);
  assert.equal(AU.autoSkillChoice(view({}), X([ex])), null);
  assert.deepEqual(AD.autoDefaultOrder(['t1', 't4', 'd1', 's1'], { t1: 1, t4: 1 }), ['d1', 's1', 't4', 't1']);
});

test('SY-08 with PB-1: a plan\'s conditions, « dans une faille » and « au début » with them; « never » never leaves by itself; a skill without uses never', () => {
  const t1 = sk('t1', 'punish'), Cd = (c, o, s = t1, x = X([t1])) => AU.condHolds(c, view(o), x, s);
  assert.ok(Cd('ready', {}) && !Cd('never', {}));
  assert.ok(Cd('open', { foe: { openUntil: 14 } }) && !Cd('open', { foe: { openUntil: 12 } }) && Cd('open', { foe: { broken: true, stunEnd: 14 } }), 'in an opening long enough for it to land');
  assert.ok(Cd('start', { }) && !AU.condHolds('start', { ...view({}), t: 15 }, X([t1]), t1), 'the first 15 s');
  assert.ok(Cd('foeGauge', { foe: { g: 47 } }) && !Cd('foeGauge', { foe: { g: 47, broken: true } }));
  assert.ok(Cd('warded', { foe: { ward: { until: 14 } } }) && !Cd('warded', { foe: { ward: { until: 12 } } }), 'a ward still up when it lands');
  assert.ok(Cd('follow', {}, sk('s1', 'haste', { boost: {} }), X([sk('s1', 'haste', { boost: {} }), t1])) && !Cd('follow', { usable: () => false }, sk('s1', 'haste', { boost: {} }), X([sk('s1', 'haste', { boost: {} }), t1])));
  assert.ok(Cd('hurt', { me: { hp: 49 } }) && Cd('finish', { foe: { hp: 33 } }) && Cd('incoming', { foe: { act: { kind: 'skill' }, at: 14 } }) && Cd('broken', { foe: { broken: true, stunEnd: 14 } }));
  assert.equal(AU.planChoice(view({}), X([t1, sk('t4', 'exploit')]), ['never', 'ready']).id, 't4', '« never » never leaves by itself');
  assert.equal(AU.planChoice(view({ usable: (a) => a.id !== 't1' }), X([t1]), ['ready']), null, 'not usable (no use left, its gap)');
  // the duel: a skill with its uses spent never leaves again
  const used = duel(fighter({ skills: [act({ id: 'u', kind: 'skill', charge: 1, uses: 2 })], tactic: ['ready'] }), dummy(), 3, rules({ maxT: 60 })).log.filter((e) => e.act === 'u' && e.ev === 'charge');
  assert.equal(used.length, 2);
});

test('SY-02 (A3) with PB-1: the heavy blow — when the opponent cannot defend when it lands (broken, charging an action that exposes it, open), as soon as ready for a brawler\'s style; its cooldown; else the light attack', () => {
  const x = (o = {}, style) => ({ ...fighter(), heavy: heavy(o), skills: [], ...(style ? { style } : {}) });
  const v = (o = {}, style) => { const w = view(o); w.me.x = { style }; return w; };
  assert.equal(AU.autoDecider(v({ foe: { broken: true, stunEnd: 12 } }), x()).id, 'heavy', 'broken long enough');
  assert.equal(AU.autoDecider(v({ foe: { broken: true, stunEnd: 10.5 } }), x()).id, 'light', 'risen before it lands');
  assert.equal(AU.autoDecider(v({ foe: { act: { kind: 'skill' }, at: 11.5 } }), x()).id, 'heavy', 'it lands while the opponent charges a skill');
  assert.equal(AU.autoDecider(v({ foe: { act: { kind: 'light' }, at: 15 } }), x()).id, 'light', 'a light attack does not expose');
  assert.equal(AU.autoDecider(v({ foe: { openUntil: 12 } }), x()).id, 'heavy', 'the opponent open long enough');
  assert.equal(AU.autoDecider(v({ foe: { openUntil: 10.5 } }), x()).id, 'light');
  assert.equal(AU.autoDecider(v({}, { dodge: 1, guard: 1, heavy: 'ready' }), x()).id, 'heavy', 'a brawler: as soon as ready');
  assert.equal(AU.autoDecider(v({}, { dodge: 1, guard: 1, heavy: 'ready' }), x({ cooldown: 1e9 })).id, 'light', 'its cooldown');
});

// ------------------------------------------------------------------------------------------------------------------ the race and the gear

test('AC-16 changed by PB-3 (A3), SL1-1 (A3): the race — each rival\'s shape at a common level, +7.5 % each round of the pool, more at the bracket, more again in the final, its pool Speed kept', () => {
  const R = AD.AUTO_RACE;
  assert.deepEqual(R.pool.map((x) => +(x / R.pool[0]).toFixed(6)), [1, 1.075, 1.15]);
  assert.ok(R.stage[1] > R.pool[2] && R.stage[2] > R.stage[1], 'little by little in the pool, a lot in the final phase');
  for (const id of RIVALS) {
    const b = ST.RIVAL_SHEETS[id];
    for (const [stage, round, k] of [[0, 0, R.norm[id] * R.pool[0]], [0, 1, R.norm[id] * R.pool[1]], [0, 2, R.norm[id] * R.pool[2]], [1, 0, R.norm[id] * R.stage[1]], [2, 0, R.norm[id] * R.stage[2]]]) {
      const s = AD.autoRaceSheet(id, stage, round);
      for (const key of ['hp', 'atk', 'def', 'end']) assert.ok(near(s[key], b[key] * k), `${id} ${key} at stage ${stage} round ${round}`);
      assert.equal(s.viv, b.viv, `${id}: its pool Speed at every stage`);
    }
  }
});

test('AC-17: a rival\'s preparation as visible Attack points, +1 per 25 over 20; an injury\'s share of its health; a generic fighter its rival\'s raced sheet by its shares', () => {
  for (const [prep, pts] of [[0, 0], [20, 0], [45, 1], [70, 2], [100, 3.2]]) assert.ok(near(AD.autoPrepPoints(prep), pts), `${prep}`);
  const base = AD.autoRaceSheet('orla', 1), s = AD.autoRaceSheet('orla', 1, 0, { preparation: 70, hp: 0.85 });
  assert.ok(near(s.atk - base.atk, 2)); assert.ok(near(s.hp, base.hp * 0.85)); assert.equal(s.def, base.def);
  for (const g of Object.values(GENERICS)) {
    const r = AD.autoRaceSheet(g.profile, 2), x = AD.autoGenericSheet(g.profile, g, 2);
    assert.ok(near(x.hp, r.hp * g.hp) && near(x.atk, r.atk * g.damage) && x.def === r.def);
  }
});

/** a version 2 game's state on the morning of day 2, with what a test gives it */
function v2State(o = {}) {
  const st = G.newGame(1842, 'Ren'); G.makeV2(st);
  const g = VG.gearOf(st); Object.assign(g, o.gear ?? {});
  for (const it of o.items ?? []) st.player.items.push(it);
  return st;
}

test('AC-11 (A3): every stat point of every piece and of the forge ×2, the penalties included, in the gear\'s own table; PB-1: the duel counts the pieces\' Speed at half and adds their effects', () => {
  const GR = GEAR_MOD;
  const DB72 = {
    'imported-blade': { atk: 2 }, 'duelist-sabre': { atk: 1.5, viv: 1 }, 'padded-jack': { def: 1 }, 'mail-shirt': { def: 3, viv: -0.5 }, 'dock-leathers': { def: 1.5, end: 1 },
    'lucky-ribbon': { ap: 1 }, 'iron-ring': { end: 2 }, 'swift-boots': { viv: 1 }, 'fervour-charm': { effect: 1.3 }, 'docker-wrap': { hp: 18 }, 'champion-token': { ap: 1, end: 0.5 },
    'river-pearl': { end: 1.5, hp: 10 }, 'knight-hauberk': { def: 3.5, viv: -0.5 }, 'pilgrim-medal': { hp: 16, effect: 1.15 }, whetstone: { atk: 0.5 },
  };
  for (const [id, fx] of Object.entries(DB72)) assert.deepEqual(GR.GEAR[id].fx, Object.fromEntries(Object.entries(fx).map(([k, v]) => [k, k === 'ap' || k === 'effect' ? v : v * 2])), id);
  assert.equal(GR.WEAPON_TIER_ATK, 2);
  const base = AM.autoRenStats(v2State());
  assert.deepEqual(base, VG.v2Stats(v2State()));
  for (const [o, d] of [[{ gear: { weapon: 'imported-blade' } }, { atk: 4 }], [{ gear: { armour: 'mail-shirt' } }, { def: 6, viv: -1 }], [{ gear: { acc: ['iron-ring', 'docker-wrap'] } }, { end: 4, hp: 36 }], [{ items: ['whetstone'] }, { atk: 1 }]]) {
    const st = AM.autoRenStats(v2State(o));
    for (const key of ['hp', 'atk', 'def', 'end', 'viv']) assert.ok(near(st[key], base[key] + (d[key] ?? 0)), `${JSON.stringify(o)} ${key}`);
  }
  // the duel's Ren: the sabre's and the boots' Speed points at half (AUTO_PIECE_VIV), the pieces' effects merged (the sabre's last cut, the boots' first charge)
  const st = v2State({ gear: { weapon: 'duelist-sabre', acc: ['swift-boots', 'lucky-ribbon'] } }), b = AM.autoBoutOf(G.namedState('v2-day2-afternoon'));
  assert.ok(b && b.ren.gfx !== undefined);
  const ren = AD.autoRen(VG.v2Stats(st), { loadout: ['t1', 't4', 'd1', 's1'], levels: {} }, { gear: VG.wornPieces(st), pieceViv: VG.piecesViv(st) });
  assert.equal(AD.AUTO_PIECE_VIV, 0.5);
  assert.ok(near(ren.viv, VG.v2Stats(st).viv - 0.5 * (2 + 2)), 'the sabre +2 and the boots +2 count +2 in the duel');
  assert.deepEqual(ren.gfx, { lastPierce: true, gauge: 0.7, firstFast: true, cd: 0.85 });
  assert.deepEqual(AD.autoGearFx(['lucky-ribbon', 'champion-token']), { cd: 0.85 * 0.9 }, 'two numbers multiplied');
});

// ------------------------------------------------------------------------------------------------------------------ 3. the game: every version 2 game

test('AC-18 with SY-11: an off-screen bout is the same duel, the same automatic on both sides, each rival at the bout\'s stage in its style; a version 2 game resolves its off-screen bouts with it', () => {
  const r = AD.autoOffscreen('marek', 'vessa', { stage: 1, seed: 77 });
  const a = AD.autoFoe('marek', AD.autoRaceSheet('marek', 1), { side: 'ren', stage: 1 }), b = AD.autoFoe('vessa', AD.autoRaceSheet('vessa', 1), { stage: 1 });
  assert.deepEqual(r, AU.autoDuel(a, b, 77));
  assert.deepEqual([a.style.dodge, b.style.dodge, a.skills[0].uses], [0.3, 2, 2], 'each its own style, its uses at the bracket');
  const st = G.newGame(1842, 'Ren'); G.makeV2(st);
  const m0 = st.tournament.matches.find((m) => !m.seen); st.day = m0.day;
  const before = JSON.parse(JSON.stringify(st)), rng = new Rng(4242), events = [];
  PO.playOffscreenMatches(st, (e) => events.push(e), rng);
  const today = st.tournament.matches.filter((m) => m.day === m0.day && !m.seen);
  assert.ok(today.length >= 2);
  for (const m of today) {
    const A = before.competitors[m.a], B = before.competitors[m.b], seed = Math.floor(new Rng(4242).fork(PO.matchId(m)).next() * 4294967296);
    const d = AD.autoOffscreen(m.a, m.b, { stage: 0, round: AD.autoRound(m.day), seed, a: { preparation: A.preparation, hp: PO.rivalMods(A).hp }, b: { preparation: B.preparation, hp: PO.rivalMods(B).hp } });
    assert.equal(m.winner, AU.autoWinner(d) === 0 ? m.a : m.b, PO.matchId(m));
  }
});

test('the game: every version 2 game plays this duel, its bouts, challenges and off-screen bouts; today\'s game (v2=0) keeps its own', () => {
  const st = G.newGame(1842, 'Ren'); G.makeV2(st);
  assert.equal(PO.autoDuelRules(st), true); assert.equal(PO.autoDuelRules(G.newGame(1842, 'Ren')), false);
  let fights = 0;
  const wrap = { name: 'w', skill: 0.6, choose: (s) => {
    const a = L.POLICIES.reference.choose(s);
    if (a.type === 'fight') { fights++; const o = AM.autoOutcome(s), lab = L.botOutcome(s, 0.6); assert.deepEqual(lab, { winner: o.winner, playerHp: o.playerHp, playerMaxHp: o.playerMaxHp, opponentHp: o.opponentHp, opponentMaxHp: o.opponentMaxHp, finisher: o.finisher }); }
    return a;
  } };
  const run = L.autoplay(7, wrap, 'Ren', 260, 'v2');
  assert.ok(run.state.over && fights >= 5);
  const c = L.autoplay(7, L.POLICIES.diligent, 'Ren', 260, 'classic');
  assert.ok(c.state.over && !c.state.flags.v2);
});
