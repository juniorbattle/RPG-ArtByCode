// The duel played by the computer (src/combat/auto.ts, autoData.ts, autoMatch.ts), with the same rules for every fighter since lot 1 of the second redesign
// (briefs/combat-auto.md § 26; the operator's sheet read back in journal Passe SY2). Three kinds of proof:
// 1. the port: the second workshop's laboratory copy of the duel (tools/auto-sym/sim.mjs, journal Passe SY1), run beside it on the same fighters, deciders and
//    seeds with one draw per blow, gives the same duels, event for event, on inputs that reach every path (the principle of journal Passe P1);
// 2. each rule and each table against an oracle written from the decisions (SY-01 to SY-05, AC-02 to AC-09, AC-11, AC-13, AC-16 to AC-18, DB5-3, DB5-4,
//    DB7-1), on hand-made fighters and views, never read from the code;
// 3. the game: every version 2 game plays it, its bouts, challenges and off-screen bouts; today's game (`v2=0`) keeps its own duel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';
import { makeSim } from '../tools/auto-sym/sim.mjs';

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
const SIM = makeSim({ Rng, hitFactor: ST.hitFactor, AUTO_RULES: AU.AUTO_RULES, autoFormsOf: AU.autoFormsOf });

const RIVALS = Object.keys(ST.RIVAL_SHEETS);
const near = (a, b, eps = 1e-9) => Math.abs(a - b) < eps;

// ------------------------------------------------------------------------------------------------- 1. the port against the laboratory's copy

test('the port: the same duels as the second workshop\'s copy (one draw per blow), event for event, on kits, weapons, stages and states that reach every path', () => {
  const kits = [['t1', 't4', 'd1', 's1'], ['t1', 't2', 't3', 't4'], ['k_sunder', 't1', 't4', 'd1'], ['k_feint', 't2', 't4', 's1'], ['t3', 'k_parry', 'k_cry', 't4'], ['t1', 'k_iron', 'k_focus', 't2']];
  const rens = [{ hp: 300, atk: 14, def: 11, end: 10, viv: 10 }, { hp: 414, atk: 19, def: 16, end: 14, viv: 9 }];
  const seen = { ward: 0, boost: 0, dodged: 0, guarded: 0, break: 0, chain: 0, heavy: 0, ko: 0, foeWins: 0 };
  let n = 0;
  for (const [ki, loadout] of kits.entries()) for (const foe of RIVALS) {
    const stage = (ki + RIVALS.indexOf(foe)) % 3, levels = Object.fromEntries([...loadout, 'heavy'].map((id) => [id, 1 + (ki % 3)]));
    const A = AD.autoRen(rens[ki % 2], { loadout, levels }, { weapon: Object.keys(AD.AUTO_WEAPONS)[ki % 3], hpShare: ki === 4 ? 0.8 : 1, apStart: ki === 5 ? 1 : 0, taken: ki === 3 ? 1.15 : 1, effect: ki === 1 ? 1.3 : 1 });
    const B = AD.autoFoe(foe, AD.autoRaceSheet(foe, stage, ki % 3, { preparation: 20 + 15 * (ki % 5), hp: ki === 3 ? 0.85 : 1 }));
    for (const seed of [11, 4242 + ki]) {
      const m = AU.autoDuel(A, B, seed, { log: true }), p = SIM.duel(A, B, seed, { deciders: [AU.DECIDERS.player, AU.DECIDERS.rival], streams: 'split', log: true }); n++;
      assert.deepEqual(m.log, p.log, `${loadout} against ${foe} (stage ${stage}), seed ${seed}`);
      assert.deepEqual([m.t, m.hp, m.maxHp, m.winner, m.leadChanges], [p.t, p.hp, p.maxHp, p.winner, p.leadChanges]);
      for (const e of m.log) { if (e.ev in seen) seen[e.ev]++; if ((e.hit ?? 1) > 1) seen.chain++; if (e.act === 'heavy' || e.act === 'm_heavy') seen.heavy++; }
      if (m.winner !== null) seen.ko++;
      if (AU.autoWinner(m) === 1) seen.foeWins++;
    }
  }
  for (const [k, v] of Object.entries(seen)) assert.ok(v > 0, `${k} reached (${JSON.stringify(seen)}, ${n} duels)`);
});

// ------------------------------------------------------------------------------------------------- 2. the tables against the decisions

test('SY-01, SY-02, SY-03: the same tables for every fighter — the light attack, the heavy blow, the skills, Speed 10, the common cadence ×0.6, no traits', () => {
  const c = 0.6;
  assert.equal(AD.AUTO_CADENCE.all, c, 'SY-03 « ×0,6 pour tous »');
  // the catalogue's numbers, written here: the light attack 1.2 s and power 6 (DB5-5), the heavy attack 1.7 s at level 1, the Thrust 7.65 s and 120 (DB5-1)
  assert.equal(SK.SKILLS.heavy.charge[0], 1.7); assert.equal(SK.SKILLS.t4.charge[0], 7.65);
  const ren = AD.autoRen(ST.REN_BASE, { loadout: ['t1', 't4', 'd1', 's1'], levels: { heavy: 3 } }, { weapon: 'imported-blade' });
  assert.deepEqual([ren.light.kind, ren.light.ap, ren.light.hits, ren.light.gap], ['light', 0, AD.AUTO_WEAPONS['imported-blade'].hits, 0.32]);
  assert.ok(near(ren.light.charge, 1.2 * c) && near(ren.light.power, 6 * c) && near(ren.light.gauge, 0.6 * c), 'the light attack at the cadence');
  // SY-02 (A3): the heavy blow, a base attack outside the four, no AP, its DB5-3 cooldown, at Ren's level of it
  assert.deepEqual([ren.heavy.kind, ren.heavy.ap, ren.heavy.id], ['heavy', 0, 'heavy']);
  assert.ok(near(ren.heavy.charge, SK.SKILLS.heavy.charge[2] * c) && near(ren.heavy.cooldown, 5 * 1.7 * c), 'its charge at its level, its cooldown 5 × its first-level charge');
  assert.ok(near(ren.heavy.power, 120 * (1.7 / 7.65) * 1.2 * c), 'its power by its charge (DB5-1), × its level, × the cadence');
  assert.ok(!AD.autoRen(ST.REN_BASE, { loadout: ['heavy', 't1', 't4', 's1'], levels: {} }).skills.some((s) => s.id === 'heavy'), 'never one of the four');
  for (const s of ren.skills) {
    assert.ok(near(s.charge, AD.autoCharge(s.id, 1) * c) && near(s.cooldown, 5 * AD.autoCharge(s.id, 1) * c), `${s.id}: its charge and its cooldown at the cadence`);
    if (s.power) assert.ok(near(s.power, 120 * (AD.autoCharge(s.id, 1) / 7.65) * (AD.AUTO_SKILLS[s.id].powerK ?? 1) * c), `${s.id}: its power by its charge (× its balance, SY-06)`);
  }
  // the rivals: their combo of before made their weapon (its blows at the training sword's total), Ren's light attack's charge and power, the heavy blow, their
  // skills at 2 AP with DB5-3, a skill's power by its charge, Speed 10 for their tables, no trait, no AI of their own
  for (const id of RIVALS) {
    const f = AD.autoFoe(id, ST.RIVAL_SHEETS[id]), P = PROF.DYN_PROFILES[id], n = Math.round((P.comboLen[0] + P.comboLen[1]) / 2);
    assert.equal(f.tempo, 10, `${id}: Speed 10 for its tables`);
    for (const k of ['combo', 'ai', 'dodgeBonus', 'guardBonus']) assert.equal(f[k], undefined, `${id}: no ${k}`);
    assert.deepEqual([f.light.kind, f.light.hits.length], ['light', n], `${id}: its light attack`);
    assert.ok(near(f.light.charge, 1.2 * c) && near(f.light.power, 6 * c), `${id}: Ren's light attack's charge and power`);
    assert.ok(near(f.light.hits.reduce((a, b) => a + b, 0), 1.1, 1e-3), `${id}: its weapon's blows at 1.1`);
    assert.deepEqual([f.heavy.kind, f.heavy.ap], ['heavy', 0]);
    assert.ok(near(f.heavy.charge, 1.7 * c) && near(f.heavy.cooldown, 5 * 1.7 * c), `${id}: the heavy blow at level 1, DB5-3`);
    for (const s of f.skills) {
      assert.equal(s.ap, 2, `${id} ${s.id}: 2 AP`); assert.ok(near(s.cooldown, 5 * s.charge), `${id} ${s.id}: DB5-3`);
      if (s.power) assert.ok(near(s.power, 120 * (s.charge / c / 7.65) * c), `${id} ${s.id}: its power by its charge`);
    }
    // its order: the wards, the boosts, then the offensive skills from the strongest
    const fam = f.skills.map((s) => (s.ward ? 0 : s.boost ? 1 : 2));
    assert.deepEqual(fam, [...fam].sort(), `${id}: its order`);
  }
  assert.deepEqual(AM.autoReactions({ def: 10, viv: 10 }, { atk: 10, viv: 10 }), { dodge: 0.12, guard: 0.35, guardSkill: 0.7 }, 'the stats alone');
});

// ------------------------------------------------------------------------------------------------- the rules against their oracles (hand-made fighters)

/** a hand-made fighter: one light attack (power 100, no gauge, one hit, 1 s), a heavy blow that never goes (cooldown for ever), no skill; a target never acts */
const act = (o = {}) => ({ id: 'light', kind: 'light', charge: 1, power: 100, gauge: 0, ap: 0, hits: [1], gap: 0.3, ...o });
const noHeavy = () => act({ id: 'heavy', kind: 'heavy', charge: 1, ap: 99, power: 1 }); // never paid: never goes
const fighter = (o = {}) => ({ id: 'a', side: 'ren', hp: 1e6, atk: 10, def: 10, end: 10, viv: 10, tempo: 10, apStart: 0, taken: 1, light: act(), heavy: noHeavy(), skills: [], brain: 'player', ...o });
const dummy = (o = {}) => fighter({ id: 'b', side: 'foe', light: act({ charge: 1e7, power: 1 }), brain: 'rival', ...o });
/** the rules with only what a test isolates: no form, no reaction, no gauge decay unless given */
const rules = (o = {}) => { const r = JSON.parse(JSON.stringify(AU.AUTO_RULES)); r.form = 0; r.react.dodge = 0; r.react.guard = 0; r.gauge.decay = 0; r.maxT = 200; for (const [k, v] of Object.entries(o)) { if (typeof v === 'object') Object.assign(r[k], v); else r[k] = v; } return r; };
const blows = (r, who = 'a') => r.log.filter((e) => e.who === who && ['hit', 'guarded', 'dodged'].includes(e.ev));
/** a duel where the first fighter's heavy blow never goes (the light attack alone, as the tests of the rules want) */
const duel = (A, B, seed, R) => AU.autoDuel(A, B, seed, { rules: R, log: true });

test('DB7-1: a blow\'s damage is its power × 2·Atk / (Atk + Def); AC-13: every health ×2', () => {
  for (const [atk, def] of [[15, 10], [10, 20], [7, 7], [22, 16.5]]) {
    const r = duel(fighter({ atk }), dummy({ def, hp: 1000 }), 5, rules());
    assert.equal(blows(r)[0].dmg, Math.round(100 * (2 * atk) / (atk + def)), `${atk} against ${def}`);
    assert.equal(r.maxHp[1], 2000);
  }
});

test('AC-05 with SY-01: the guard from the Defence alone (35 % at equality), ×2 against a big action seen coming, at most 90 %, a guarded blow −80 % and ×2 to the guarder\'s gauge', () => {
  assert.deepEqual(AU.AUTO_RULES.react, { dodge: 0.12, guard: 0.35, skillGuard: 2, cap: 0.9 }); assert.equal(AU.AUTO_RULES.guardReduce, 0.8);
  const freq = (A, B, R) => { const b = blows(duel(A, B, 77, R)); return { p: b.filter((e) => e.ev === 'guarded').length / b.length, b }; };
  const R = rules({ react: { guard: 0.35 }, maxT: 2000 });
  for (const [def, atk, kind, want] of [[10, 10, 'light', 0.35], [30, 10, 'light', 0.525], [10, 10, 'skill', 0.7], [10, 10, 'heavy', 0.7], [30, 10, 'skill', 0.9], [10, 30, 'light', 0.175]]) {
    const { p, b } = freq(fighter({ atk, light: act({ kind, charge: 0.2 }) }), dummy({ def }), R);
    assert.ok(Math.abs(p - want) < 0.02, `def ${def}, atk ${atk}, ${kind}: ${p.toFixed(3)} for ${want} (${b.length} blows)`);
    const g = b.find((e) => e.ev === 'guarded'), h = b.find((e) => e.ev === 'hit'), k = (2 * atk) / (atk + def);
    assert.equal(g.dmg, Math.round(100 * k * 0.2)); assert.equal(h.dmg, Math.round(100 * k));
  }
  // a pierce blow is never guarded (the guard certain otherwise)
  const certain = rules({ react: { guard: 1, cap: 1 } });
  assert.equal(freq(fighter({ light: act({ pierce: true, charge: 0.2 }) }), dummy(), certain).p, 0);
  // a guarded blow fills the guarder's gauge twice: 70 at the fourth blow of 10 always guarded, at the seventh unguarded
  const brk = (R) => { const r = duel(fighter({ light: act({ gauge: 10 }) }), dummy(), 3, R); const i = r.log.findIndex((e) => e.ev === 'break'); return blows(r).filter((e) => r.log.indexOf(e) < i).length; };
  assert.equal(brk(certain), 4); assert.equal(brk(rules()), 7);
});

test('AC-05 with SY-01: the dodge from the Speed alone (12 % at equality); a fighter charging anything but its light attack neither guards nor dodges', () => {
  const R = rules({ react: { dodge: 0.12 }, maxT: 2000 });
  for (const [vd, va, want] of [[10, 10, 0.12], [20, 10, 0.16], [10, 20, 0.08]]) {
    const b = blows(duel(fighter({ viv: va, light: act({ charge: 0.2 }) }), dummy({ viv: vd }), 9, R));
    const p = b.filter((e) => e.ev === 'dodged').length / b.length;
    assert.ok(Math.abs(p - want) < 0.02, `${vd} against ${va}: ${p.toFixed(3)} for ${want}`);
  }
  // the charge exposes: a target certain to dodge dodges every blow while it charges its light attack, none while it charges a skill or a heavy blow
  const sure = rules({ react: { dodge: 1 }, maxT: 2000 });
  const exposed = (kind) => blows(duel(fighter(), dummy({ light: act({ kind, charge: 1e7 }) }), 4, sure)).filter((e) => e.t > 0.6);
  assert.ok(exposed('light').every((e) => e.ev === 'dodged'));
  assert.ok(exposed('skill').every((e) => e.ev === 'hit')); assert.ok(exposed('heavy').every((e) => e.ev === 'hit'));
});

test('SY-04: one draw per blow — a reaction’s draw keyed by the striker, its action’s rank and the hit’s rank; a choice changes only what follows from it', () => {
  // the oracle: the hit j of the striker's k-th action is dodged when autoDraw(seed, striker, k, j, 1) < the dodge's chance (the defender never exposed here)
  const R = rules({ react: { dodge: 0.3 }, maxT: 60 }), seed = 321;
  const r = duel(fighter({ light: act({ hits: [0.5, 0.5], charge: 0.5 }) }), dummy(), seed, R);
  let k = 0, j = 0, n = 0;
  for (const e of r.log.filter((x) => x.who === 'a')) {
    if (e.ev === 'charge') { k++; j = 0; continue; }
    j++; n++;
    assert.equal(e.ev === 'dodged', AU.autoDraw(seed, 0, k, j, 1) < 0.3, `action ${k}, hit ${j}`);
  }
  assert.ok(n > 50);
  // a choice changes only what follows from it: the same fighter with one skill more, used at its first choice only; the reactions to its actions from its
  // second on are the same draws (the rank of each action and hit is the same)
  const sk = act({ id: 'sk', kind: 'skill', charge: 0.5, ap: 0, cooldown: 1e9, hits: [0.5, 0.5] });
  const a = duel(fighter({ light: act({ hits: [0.5, 0.5], charge: 0.5 }) }), dummy(), seed, R), b = duel(fighter({ light: act({ hits: [0.5, 0.5], charge: 0.5 }), skills: [sk] }), dummy(), seed, R);
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
  // the decided enchaînements: Taille éclair 2 hits, Tourbillon 3; the training sword and the imported blade 2, the duelist's sabre 3
  assert.equal(AD.autoSkill('t1', 1).hits.length, 2); assert.equal(AD.autoSkill('t3', 1).hits.length, 3);
  assert.deepEqual(['training-sword', 'imported-blade', 'duelist-sabre'].map((w) => AD.autoLight(w).hits.length), [2, 2, 3]);
});

test('AC-03: the AP — 1 at the start, +1 a light attack that lands (hit or guarded, once per action), 5 at most; the skills pay, the heavy blow does not', () => {
  const skill = act({ id: 'sk', kind: 'skill', ap: 5, charge: 1, power: 1 });
  const lightsBefore = (B, R = rules(), light = act({ hits: [0.5, 0.5] })) => { const r = AU.autoDuel(fighter({ light, skills: [skill] }), B, 2, { rules: R, log: true }); const c = r.log.filter((e) => e.who === 'a' && e.ev === 'charge'); return c.findIndex((e) => e.act === 'sk'); };
  assert.equal(lightsBefore(dummy()), 4);
  assert.equal(lightsBefore(dummy(), rules({ react: { guard: 1, cap: 1 } })), 4, 'guarded lights gain them');
  assert.equal(lightsBefore(dummy(), rules({ react: { dodge: 1 } })), -1, 'dodged lights gain none');
  assert.equal(AU.autoDuel(fighter({ skills: [act({ id: 'six', kind: 'skill', ap: 6 })] }), dummy(), 2, { rules: rules(), log: true }).log.filter((e) => e.act === 'six').length, 0, 'never more than 5');
  const withAp = AU.autoDuel(fighter({ apStart: 2, light: act(), skills: [skill] }), dummy(), 2, { rules: rules(), log: true }).log.filter((e) => e.who === 'a' && e.ev === 'charge');
  assert.equal(withAp.findIndex((e) => e.act === 'sk'), 2, 'a gear\'s AP at the start');
  // the rivals gain and pay theirs the same way (SY-01): a rival's 2-AP skill only once its light attacks have landed
  const B = AD.autoFoe('orla', ST.RIVAL_SHEETS.orla), r = AU.autoDuel(fighter({ hp: 1e6 }), B, 5, { rules: rules({ maxT: 120 }), log: true });
  let ap = AU.AUTO_RULES.ap.start;
  for (const e of r.log.filter((x) => x.who === 'orla')) {
    if (e.ev === 'charge') { const a = [B.light, B.heavy, ...B.skills].find((x) => x.id === e.act); assert.ok((a.ap ?? 0) <= ap, `${e.act} at ${e.t}: ${a.ap} AP of ${ap}`); ap -= a.ap ?? 0; }
    else if (e.act === 'm_light' && e.hit === 1 && e.ev !== 'dodged') ap = Math.min(5, ap + 1);
  }
});

test('DB5-3 (A3): a skill comes back 5 × its charge time at level 1 after its charge begins, the heavy blow too (SY-02)', () => {
  for (const id of Object.keys(AD.AUTO_SKILLS)) assert.ok(near(AD.autoSkill(id, 3).cooldown, 5 * AD.autoCharge(id, 1) * AD.AUTO_CADENCE.all), id);
  const sk = act({ id: 'sk', kind: 'skill', cooldown: 10, charge: 1 });
  const starts = AU.autoDuel(fighter({ skills: [sk] }), dummy(), 2, { rules: rules({ maxT: 60 }), log: true }).log.filter((e) => e.act === 'sk' && e.ev === 'charge').map((e) => e.t);
  assert.ok(starts.length >= 4);
  for (let i = 1; i < starts.length; i++) { assert.ok(starts[i] - starts[i - 1] >= 10 - 1e-6); assert.ok(starts[i] - starts[i - 1] < 11.5); }
});

test('DB5-4 (A3): the break — a gauge of 70, stunned 10 s, the damage taken ×2, its charge paused, its enchaînement cut, the gauge empty after; the decay', () => {
  const B = dummy({ light: act({ charge: 30, power: 1 }) }), r = duel(fighter({ light: act({ gauge: 10 }) }), B, 8, rules({ maxT: 200 }));
  const brk = r.log.find((e) => e.ev === 'break' && e.who === 'b'), b = blows(r), i = b.findIndex((e) => e.t > brk.t);
  assert.equal(b.filter((e) => e.t <= brk.t).length, 7);
  assert.ok(b.slice(i).filter((e) => e.t < brk.t + 10).every((e) => e.dmg === 200), 'the damage ×2 while stunned');
  assert.ok(b.find((e) => e.t > brk.t + 10).dmg === 100, 'back to ×1 after');
  const charge = r.log.find((e) => e.who === 'b' && e.ev === 'charge'), landed = r.log.find((e) => e.who === 'b' && ['hit', 'guarded', 'dodged'].includes(e.ev));
  const stuns = r.log.filter((e) => e.ev === 'break' && e.who === 'b' && e.t < landed.t).length;
  assert.ok(stuns >= 2 && Math.abs(landed.t - (charge.at + 10 * stuns)) < 0.011, 'its charge paused by each stun');
  const C = dummy({ light: act({ charge: 0.5, power: 1, hits: [0.2, 0.2, 0.2, 0.2, 0.2], gap: 1 }), gauge: 0 });
  const r2 = duel(fighter({ light: act({ charge: 1.25, gauge: 70 }) }), C, 1, rules({ maxT: 20 }));
  const b2 = r2.log.find((e) => e.ev === 'break' && e.who === 'b');
  assert.equal(r2.log.filter((e) => e.who === 'b' && e.ev === 'hit' && e.t > b2.t && e.t < b2.t + 10).length, 0, 'no hit of its chain during its stun');
  assert.equal(AU.AUTO_RULES.gauge.decay, +(1.8 * 0.7 * 0.5).toFixed(2));
  const nth = (gauge, decay) => { const x = duel(fighter({ light: act({ charge: 10, gauge }) }), dummy(), 1, rules({ gauge: { decay }, maxT: 200 })); const k = x.log.find((e) => e.ev === 'break'); return k ? blows(x).filter((e) => e.t <= k.t).length : 0; };
  assert.equal(nth(25, 0.63), 4); assert.equal(nth(25, 0), 3); assert.equal(nth(6, 0.63), 0);
  assert.deepEqual([AU.AUTO_RULES.gauge.max, AU.AUTO_RULES.brk.stun, AU.AUTO_RULES.brk.dmg], [70, 10, 2]);
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
    // the initiative: each side its own keyed draw
    assert.equal(r.log.find((e) => e.who === 'a' && e.ev === 'charge').t, +(AU.autoDraw(seed, 0, 0, 0, 3) * AU.AUTO_RULES.start).toFixed(2));
  }
});

test('determinism: the same seed gives the same duel, another seed another', () => {
  const A = () => AD.autoRen({ hp: 324, atk: 17, def: 17, end: 10, viv: 9 }, { loadout: ['t1', 't4', 'd1', 's1'], levels: { t1: 2 } }, { weapon: 'imported-blade' });
  const B = () => AD.autoFoe('orla', AD.autoRaceSheet('orla', 0, 1, { preparation: 61 }));
  const a = AU.autoDuel(A(), B(), 1234, { log: true }), b = AU.autoDuel(A(), B(), 1234, { log: true }), c = AU.autoDuel(A(), B(), 1235, { log: true });
  assert.deepEqual(a, b); assert.notDeepEqual(a.log, c.log);
});

// ------------------------------------------------------------------------------------------------- the automatic (hand-made views)

const side = (o = {}) => ({ ap: 1, ward: null, boost: null, broken: false, act: null, at: 0, stunEnd: 0, hp: 100, maxHp: 100, ...o });
const view = (o = {}) => ({ t: 10, me: side(o.me), foe: side(o.foe), rules: AU.AUTO_RULES, usable: o.usable ?? ((a) => (a.ap ?? 0) <= (o.me?.ap ?? 1) && !(a.cooldown >= 1e9)), gauge: (s) => (s === undefined ? 0 : s.g ?? 0), chargeOf: (_, a) => a.charge, rand: () => 0.99 });
const sk = (id, o) => ({ id, kind: 'skill', charge: 3, ap: 2, ...o });
const heavy = (o = {}) => ({ id: 'heavy', kind: 'heavy', charge: 1, ap: 0, ...o });

test('SY-01: one automatic for every fighter, Ren as a rival', () => {
  assert.equal(AU.DECIDERS.player, AU.DECIDERS.rival);
  assert.equal(AU.DECIDERS.player, AU.autoDecider);
});

test('AC-09: the automatic\'s skills in the fighter\'s order — the first that holds, the wards and boosts by their own conditions', () => {
  const t1 = sk('t1', { ap: 2, power: 53 }), t4 = sk('t4', { ap: 4, power: 120 });
  const x = (skills) => ({ ...fighter(), heavy: heavy({ cooldown: 1e9 }), skills });
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 4 } }), x([t1, t4])).id, 't1', 'the first of the order');
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 3 } }), x([t4, t1])).id, 't1', 'the first it can pay');
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 1 } }), x([t4, t1])), null, 'none: the base attacks decide');
  assert.deepEqual(AD.autoDefaultOrder(['t1', 't4', 'd1', 's1'], { t1: 1, t4: 1 }), ['d1', 's1', 't4', 't1']);
  assert.deepEqual(AD.autoRen(ST.REN_BASE, { loadout: ['t1', 't4', 'd1', 's1'], levels: {}, order: ['t4', 'd1', 't1', 's1'] }).skills.map((s) => s.id), ['t4', 'd1', 't1', 's1']);
  const ward = sk('d1', { ap: 2, charge: 3, ward: { dur: 9, dmg: 0.5, gauge: 0.5 } }), boost = sk('s1', { ap: 3, boost: { dur: 12, dmg: 1.5, gauge: 1.5 } });
  const big = { act: { kind: 'skill' }, at: 15 }, soon = { act: { kind: 'heavy' }, at: 12 }, small = { act: { kind: 'light' }, at: 15 };
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 2 }, foe: big }), x([ward, t1])).id, 'd1', 'the blow lands after the ward is up');
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 2 }, foe: soon }), x([ward, t1])).id, 't1', 'too late for the ward');
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 2, g: 47 }, foe: small }), x([ward, t1])).id, 'd1', 'past two thirds of 70');
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 5 }, foe: small }), x([boost, t1])).id, 's1', 'a boost a skill can follow');
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 3 }, foe: small }), x([boost, t1])).id, 's1', 'a boost as soon as it is ready (SY-07), even when no skill could follow');
  assert.equal(AU.autoSkillChoice(view({ me: { ap: 5, boost: { until: 20 } }, foe: small }), x([boost, t1])).id, 't1', 'one boost at a time');
});

test('SY-02 (A3): the heavy blow — when the opponent cannot defend when it lands, or the AP are full; its cooldown; else the light attack', () => {
  const x = (o = {}) => ({ ...fighter(), heavy: heavy(o), skills: [] });
  assert.equal(AU.autoDecider(view({ foe: { broken: true, stunEnd: 12 } }), x()).id, 'heavy', 'broken long enough');
  assert.equal(AU.autoDecider(view({ foe: { broken: true, stunEnd: 10.5 } }), x()).id, 'light', 'risen before it lands');
  assert.equal(AU.autoDecider(view({ foe: { act: { kind: 'skill' }, at: 11.5 } }), x()).id, 'heavy', 'it lands while the opponent charges a skill');
  assert.equal(AU.autoDecider(view({ foe: { act: { kind: 'heavy' }, at: 11.5 } }), x()).id, 'heavy', 'or a heavy blow');
  assert.equal(AU.autoDecider(view({ foe: { act: { kind: 'skill' }, at: 10.5 } }), x()).id, 'light', 'the opponent\'s action leaves first');
  assert.equal(AU.autoDecider(view({ foe: { act: { kind: 'light' }, at: 15 } }), x()).id, 'light', 'a light attack does not expose');
  assert.equal(AU.autoDecider(view({ me: { ap: 5 } }), x()).id, 'heavy', 'the AP full');
  assert.equal(AU.autoDecider(view({ me: { ap: 5 } }), x({ cooldown: 1e9 })).id, 'light', 'its cooldown');
});

// ------------------------------------------------------------------------------------------------------------------ the race and the gear

test('AC-16 with SY-05 (A3): the race — each rival\'s shape at a common level, +10 % each round of the pool, more at the bracket, more again in the final, its pool Speed kept', () => {
  const R = AD.AUTO_RACE;
  // SY-05 « +10 % par tour (décision A3 : change LC1-1) » (journal Passe SY2)
  assert.deepEqual(R.pool.map((x) => +(x / R.pool[0]).toFixed(6)), [1, 1.1, 1.2]);
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

test('AC-11 (A3): every stat point of every piece and of the forge ×2, the penalties included, in the gear\'s own table; the AP and the effects\' length unchanged', () => {
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
});

// ------------------------------------------------------------------------------------------------------------------ 3. the game: every version 2 game

test('AC-18 with SY-11: an off-screen bout is the same duel, the same automatic on both sides; a version 2 game resolves its off-screen bouts with it', () => {
  const r = AD.autoOffscreen('marek', 'vessa', { stage: 1, seed: 77 });
  const a = AD.autoFoe('marek', AD.autoRaceSheet('marek', 1), { side: 'ren' }), b = AD.autoFoe('vessa', AD.autoRaceSheet('vessa', 1));
  assert.deepEqual(r, AU.autoDuel(a, b, 77));
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
