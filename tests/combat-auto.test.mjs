// The duel played by the computer (lot 1 of briefs/combat-auto.md § 17.3; the operator's rules sheet read back in journal Passe AC4): src/combat/auto.ts,
// autoData.ts, autoMatch.ts. Three kinds of proof:
// 1. the port: the workshop's prototype (tools/auto-duel/sim.mjs, kits.mjs, journal Passes AC1 to AC3), run beside it on the same fighters and seeds under its
//    complete model, gives the same fighters and the same duels, event for event (the principle of journal Passe P1: a port proves itself against the original
//    run beside it, on inputs that reach every path); the new duel's tables are set back to the prototype's for it (tests/auto-prototype.json), the balance of
//    lot 1 changing only data;
// 2. each rule against an oracle written from the decisions (AC-02 to AC-09, AC-11, AC-13, AC-16 to AC-18, DB5-3, DB5-4, DB7-1), on hand-made fighters and
//    views, never read from the code;
// 3. the game: every version 2 game plays it since lot 2 (journal Passe LC3), its bouts, challenges and off-screen bouts; today's game (`v2=0`) keeps its own duel.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load } from './load.mjs';
import { duel as protoDuel, RULES as PROTO_RULES, DECIDERS as PROTO_DECIDERS } from '../tools/auto-duel/sim.mjs';
import { renFighter as protoRen, foeFighter as protoFoe, renActions as protoRenActions, KIT as PROTO_KIT } from '../tools/auto-duel/kits.mjs';

const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const AM = await load('/src/combat/autoMatch.ts');
const ST = await load('/src/combat/stats.ts');
const SK = await load('/src/combat/skills.ts');
const BOOK = await load('/src/combat/skillbook.ts');
const L = await load('/src/tournament/lab.ts');
const G = await load('/src/simulation/index.ts');
const PO = await load('/src/tournament/pool.ts');
const VG = await load('/src/simulation/v2gear.ts');
const GEAR_MOD = await load('/src/simulation/gear.ts');
const { Rng } = await load('/src/core/rng.ts');
const { GENERICS } = await load('/src/narrative/generics.ts');
// the prototype's own view of the game's data (tools/auto-duel/kits.mjs loadGame)
const PM = { stats: ST, skills: SK, book: BOOK, v2duel: await load('/src/combat/v2duel.ts'), prof: await load('/src/combat/profiles.ts') };

// the prototype's complete model (journal Passe AC3; the shared notes' atelier-combat-model-P.txt and level-P3.json)
Object.assign(PROTO_KIT, { prep: 'stats', combos: 'on', traits: 1, gearK: 2 });
const PROTO_R = JSON.parse(JSON.stringify(PROTO_RULES));
Object.assign(PROTO_R, { hpScale: 2, autoDecider: 'smart' });
PROTO_R.react.skillGuard = 2; PROTO_R.luck.form = 0.15;
const PROTO_TABLES = JSON.parse(fs.readFileSync(path.join(import.meta.dirname, 'auto-prototype.json'), 'utf8'));
/** run fn with the new duel's tables set back to the prototype's, then give the balanced ones back */
function withProto(fn) {
  const live = { skills: AD.AUTO_SKILLS, foes: AD.AUTO_FOES, weapons: AD.AUTO_WEAPONS, race: AD.AUTO_RACE, light: AD.AUTO_LIGHT, cadence: AD.AUTO_CADENCE }, keep = JSON.parse(JSON.stringify(live));
  const set = (src) => { for (const [k, o] of Object.entries(live)) { for (const key of Object.keys(o)) delete o[key]; Object.assign(o, JSON.parse(JSON.stringify(src[k]))); } };
  set(PROTO_TABLES);
  try { return fn(); } finally { set(keep); }
}

const RIVALS = Object.keys(ST.RIVAL_SHEETS);
const pick = (a) => ({ kind: a.kind, charge: a.charge, power: a.power, gauge: a.gauge, ap: a.ap ?? 0, cooldown: a.cooldown, pierce: !!a.pierce, heavy: !!a.heavy, hits: a.hits, gap: a.gap, ward: a.ward, boost: a.boost, weight: a.weight });

test('the port: every skill at every level, every weapon and every rival as the prototype builds them', () => withProto(() => {
  for (const id of Object.keys(SK.SKILLS)) for (let lv = 1; lv <= 5; lv++) for (const eff of [1, 1.3]) {
    const p = protoRenActions(PM, { loadout: [id], levels: { [id]: lv } }, { effect: eff }).skills[0], m = AD.autoSkill(id, lv, eff);
    assert.deepEqual(pick(m), pick(p), `${id} at level ${lv}, effect ${eff}`);
  }
  for (const w of Object.keys(AD.AUTO_WEAPONS)) assert.deepEqual(pick(AD.autoLight(w)), pick(protoRenActions(PM, { loadout: [], levels: {} }, { weapon: w }).light), w);
  for (const id of RIVALS) {
    const p = protoFoe(PM, id, 0, { sheet: ST.RIVAL_SHEETS[id] }), m = AD.autoFoe(id, ST.RIVAL_SHEETS[id]);
    assert.deepEqual(m.skills.map(pick), p.actions.skills.map(pick), `${id}: its skills`);
    assert.deepEqual(pick(m.light), pick(p.actions.light), `${id}: its light`);
    assert.deepEqual(pick(m.combo), pick(p.actions.combo), `${id}: its combo`);
    assert.deepEqual(m.ai, p.ai, `${id}: its habits`);
    for (const k of ['tempo', 'dodgeBonus', 'guardBonus']) assert.equal(m[k], p[k], `${id}: ${k}`);
  }
}));

/** a duel of each, on the same fighters and seed: the prototype's fighters from its kits, the port's from autoData */
function both(o) {
  const kit = { loadout: o.loadout, levels: Object.fromEntries([...o.loadout, 'heavy'].map((id) => [id, o.levels ?? 1])) };
  const pa = protoRen(PM, o.ren, kit, { decider: PROTO_DECIDERS.smart, cooldownK: 5, lightCharge: 1.2, weapon: o.weapon, hpShare: o.hpShare, apStart: o.apStart, taken: o.taken, effect: o.effect });
  const k = AD.autoRaceFactor(o.foe, o.stage, o.round), b = ST.RIVAL_SHEETS[o.foe];
  const sheet = { hp: b.hp * k, atk: b.atk * k, def: b.def * k, end: b.end * k, viv: b.viv };
  const pb = protoFoe(PM, o.foe, o.stage, { sheet, preparation: o.prep, mods: { hp: o.foeHp ?? 1 }, decider: PROTO_DECIDERS.rival });
  const ma = AD.autoRen(o.ren, kit, { weapon: o.weapon, hpShare: o.hpShare, apStart: o.apStart, taken: o.taken, effect: o.effect });
  const mb = AD.autoFoe(o.foe, AD.autoRaceSheet(o.foe, o.stage, o.round, { preparation: o.prep, hp: o.foeHp }));
  return { p: protoDuel(pa, pb, o.seed, PROTO_R, { log: true }), m: AU.autoDuel(ma, mb, o.seed, { log: true }) };
}

test('the port: the same duels, event for event, on kits, weapons, stages and states that reach every path', () => withProto(() => {
  const kits = [['t1', 't4', 'd1', 's1'], ['t1', 't2', 't3', 't4'], ['k_sunder', 't1', 't4', 'd1'], ['k_feint', 't2', 't4', 's1'], ['heavy', 't1', 't4', 's1'], ['t3', 'k_parry', 'k_cry', 't4'], ['t1', 'k_iron', 'k_focus', 'heavy']];
  const rens = [{ hp: 300, atk: 14, def: 11, end: 10, viv: 10 }, { hp: 414, atk: 19, def: 16, end: 14, viv: 9 }];
  const seen = { ward: 0, boost: 0, dodged: 0, guarded: 0, break: 0, combo: 0, ko: 0, foeWins: 0 };
  let n = 0;
  for (const [ki, loadout] of kits.entries()) for (const foe of RIVALS) {
    const stage = (ki + RIVALS.indexOf(foe)) % 3, o = { loadout, levels: 1 + (ki % 3), ren: rens[ki % 2], weapon: Object.keys(AD.AUTO_WEAPONS)[ki % 3], foe, stage, round: ki % 3, prep: 20 + 15 * (ki % 5), foeHp: ki === 3 ? 0.85 : 1, hpShare: ki === 4 ? 0.8 : 1, apStart: ki === 5 ? 1 : 0, taken: ki === 6 ? 1.15 : 1, effect: ki === 1 ? 1.3 : 1 };
    for (const seed of [11, 4242 + ki]) {
      const { p, m } = both({ ...o, seed }); n++;
      assert.deepEqual(m.log, p.log, `${loadout} against ${foe} (stage ${stage}), seed ${seed}`);
      assert.equal(AU.autoWinner(m), p.winIdx ?? (p.hp[0] / p.maxHp[0] >= p.hp[1] / p.maxHp[1] ? 0 : 1));
      assert.deepEqual([m.t, m.hp, m.maxHp, m.finisher, m.leadChanges], [p.t, p.hp, p.maxHp, p.finisher, p.leadChanges]);
      for (const e of m.log) { if (e.ev in seen) seen[e.ev]++; if (e.act === 'm_combo') seen.combo++; }
      if (m.winner !== null) seen.ko++;
      if (AU.autoWinner(m) === 1) seen.foeWins++;
    }
  }
  // the inputs reach every path: wards and boosts raised, blows dodged and guarded, breaks, the rivals' combos, K.O.s, and duels won by both sides
  for (const [k, v] of Object.entries(seen)) assert.ok(v > 0, `${k} reached (${JSON.stringify(seen)}, ${n} duels)`);
}));

test('the port: an off-screen bout is the prototype\'s duel of two rivals', () => withProto(() => {
  for (const [a, b] of [['marek', 'vessa'], ['tobin', 'rhosk'], ['orla', 'cassius'], ['ilse', 'orla']]) for (const stage of [0, 1, 2]) for (const seed of [3, 901]) {
    const sh = (id) => { const k = AD.autoRaceFactor(id, stage, 0), x = ST.RIVAL_SHEETS[id]; return { hp: x.hp * k, atk: x.atk * k, def: x.def * k, end: x.end * k, viv: x.viv }; };
    const A = protoFoe(PM, a, stage, { sheet: sh(a), decider: PROTO_DECIDERS.rival }), B = protoFoe(PM, b, stage, { sheet: sh(b), decider: PROTO_DECIDERS.rival });
    const p = protoDuel(A, B, seed, PROTO_R, { log: true }), m = AD.autoOffscreen(a, b, { stage, seed });
    const mLog = AU.autoDuel(AD.autoFoe(a, AD.autoRaceSheet(a, stage), { side: 'ren' }), AD.autoFoe(b, AD.autoRaceSheet(b, stage)), seed, { log: true }).log;
    assert.deepEqual(mLog, p.log, `${a} - ${b}, stage ${stage}, seed ${seed}`);
    assert.deepEqual([m.t, m.hp], [p.t, p.hp]);
  }
}));

// ------------------------------------------------------------------------------------------------- the rules against their oracles (hand-made fighters)

/** a hand-made fighter: one light attack (power 100, no gauge, one hit, 1 s), no skill; a target never acts (its light charges for ever) */
const act = (o = {}) => ({ id: 'light', kind: 'light', charge: 1, power: 100, gauge: 0, ap: 0, hits: [1], gap: 0.3, ...o });
const fighter = (o = {}) => ({ id: 'a', side: 'ren', hp: 1e6, atk: 10, def: 10, end: 10, viv: 10, tempo: 10, apStart: 0, taken: 1, light: act(), skills: [], brain: 'player', ...o });
const dummy = (o = {}) => fighter({ id: 'b', side: 'foe', light: act({ charge: 1e7, power: 1 }), brain: 'rival', ...o });
/** the rules with only what a test isolates: no form, no reaction, no gauge decay unless given */
const rules = (o = {}) => { const r = JSON.parse(JSON.stringify(AU.AUTO_RULES)); r.form = 0; r.react.dodge = 0; r.react.guard = 0; r.gauge.decay = 0; r.maxT = 200; for (const [k, v] of Object.entries(o)) { if (typeof v === 'object') Object.assign(r[k], v); else r[k] = v; } return r; };
const blows = (r, who = 'a') => r.log.filter((e) => e.who === who && ['hit', 'guarded', 'dodged'].includes(e.ev));

test('DB7-1: a blow\'s damage is its power × 2·Atk / (Atk + Def); AC-13: every health ×2', () => {
  for (const [atk, def] of [[15, 10], [10, 20], [7, 7], [22, 16.5]]) {
    const r = AU.autoDuel(fighter({ atk }), dummy({ def, hp: 1000 }), 5, { rules: rules(), log: true });
    assert.equal(blows(r)[0].dmg, Math.round(100 * (2 * atk) / (atk + def)), `${atk} against ${def}`);
    assert.equal(r.maxHp[1], 2000);
  }
});

test('AC-05: the guard from the Defence (35 % at equality), ×2 against a skill seen coming, at most 90 %, a guarded blow −80 % and ×2 to the guarder\'s gauge', () => {
  // the decided numbers (AC-05 « Les stats, garde ×2 contre une compétence vue venir… », briefs/combat-auto.md § 3)
  assert.deepEqual(AU.AUTO_RULES.react, { dodge: 0.12, guard: 0.35, skillGuard: 2, cap: 0.9 }); assert.equal(AU.AUTO_RULES.guardReduce, 0.8);
  const freq = (A, B, R) => { const r = AU.autoDuel(A, B, 77, { rules: R, log: true }), b = blows(r); return { p: b.filter((e) => e.ev === 'guarded').length / b.length, b }; };
  const R = rules({ react: { guard: 0.35 }, maxT: 2000 });
  for (const [def, atk, kind, bonus, want] of [[10, 10, 'light', 0, 0.35], [30, 10, 'light', 0, 0.525], [10, 10, 'skill', 0, 0.7], [30, 10, 'skill', 0, 0.9], [10, 30, 'light', 0, 0.175], [10, 10, 'light', 0.1, 0.45]]) {
    const { p, b } = freq(fighter({ atk, light: act({ kind, charge: 0.2 }) }), dummy({ def, guardBonus: bonus }), R);
    assert.ok(Math.abs(p - want) < 0.02, `def ${def}, atk ${atk}, ${kind}, bonus ${bonus}: ${p.toFixed(3)} for ${want} (${b.length} blows)`);
    const g = b.find((e) => e.ev === 'guarded'), h = b.find((e) => e.ev === 'hit'), k = (2 * atk) / (atk + def);
    assert.equal(g.dmg, Math.round(100 * k * 0.2)); assert.equal(h.dmg, Math.round(100 * k));
  }
  // a pierce blow is never guarded
  assert.equal(freq(fighter({ light: act({ pierce: true, charge: 0.2 }) }), dummy({ guardBonus: 1 }), R).p, 0);
  // a guarded blow fills the guarder's gauge twice: 70 at the fourth blow of 10 always guarded (guard certain), at the seventh unguarded
  const certain = rules({ react: { guard: 0, cap: 1 } });
  const brk = (bonus) => { const r = AU.autoDuel(fighter({ light: act({ gauge: 10 }) }), dummy({ guardBonus: bonus }), 3, { rules: certain, log: true }); const i = r.log.findIndex((e) => e.ev === 'break'); return blows(r).filter((e) => r.log.indexOf(e) < i).length; };
  assert.equal(brk(1), 4); assert.equal(brk(0), 7);
});

test('AC-05: the dodge from the Speed (12 % at equality), a rival\'s trait added; a fighter charging a skill neither guards nor dodges', () => {
  const R = rules({ react: { dodge: 0.12 }, maxT: 2000 });
  for (const [vd, va, bonus, want] of [[10, 10, 0, 0.12], [20, 10, 0, 0.16], [10, 20, 0, 0.08], [10, 10, 0.35, 0.47]]) {
    const b = blows(AU.autoDuel(fighter({ viv: va, light: act({ charge: 0.2 }) }), dummy({ viv: vd, dodgeBonus: bonus }), 9, { rules: R, log: true }));
    const p = b.filter((e) => e.ev === 'dodged').length / b.length;
    assert.ok(Math.abs(p - want) < 0.02, `${vd} against ${va}, bonus ${bonus}: ${p.toFixed(3)} for ${want}`);
  }
  // the charge exposes: a target certain to dodge (its trait 1) dodges every blow while it charges its light attack, none while it charges a skill
  const exposed = (kind) => blows(AU.autoDuel(fighter(), dummy({ dodgeBonus: 1, light: act({ kind, charge: 1e7 }) }), 4, { rules: R, log: true })).filter((e) => e.t > 0.6);
  assert.ok(exposed('light').every((e) => e.ev === 'dodged'));
  assert.ok(exposed('skill').every((e) => e.ev === 'hit'));
});

test('AC-02: an enchaînement strikes its hits `gap` apart, each its share of the power, each guarded or dodged alone', () => {
  const A = () => fighter({ light: act({ hits: [0.4, 0.4, 0.4], gap: 0.22 }) });
  const first = blows(AU.autoDuel(A(), dummy(), 6, { rules: rules({ maxT: 60 }), log: true })).slice(0, 3);
  assert.deepEqual(first.map((e) => e.hit), [1, 2, 3]);
  assert.ok(Math.abs(first[1].t - first[0].t - 0.22) < 0.011 && Math.abs(first[2].t - first[1].t - 0.22) < 0.011);
  for (const e of first) assert.equal(e.dmg, 40);
  // within one action some hits dodged and others not: each hit draws alone (the hits grouped by the charge they follow)
  const r = AU.autoDuel(A(), dummy(), 6, { rules: rules({ react: { dodge: 0.3 }, maxT: 60 }), log: true }), actions = [];
  for (const e of r.log.filter((x) => x.who === 'a')) { if (e.ev === 'charge') actions.push([]); else actions[actions.length - 1].push(e.ev); }
  assert.ok(actions.some((evs) => evs.includes('dodged') && evs.includes('hit')));
  assert.ok(actions.every((evs) => evs.length === 3 || evs === actions[actions.length - 1]));
  // the decided enchaînements (AC-02): Taille éclair 2 hits, Tourbillon 3; the training sword and the imported blade 2, the duelist's sabre 3; the rivals' combos 2 to 5
  assert.equal(AD.autoSkill('t1', 1).hits.length, 2); assert.equal(AD.autoSkill('t3', 1).hits.length, 3);
  assert.deepEqual(['training-sword', 'imported-blade', 'duelist-sabre'].map((w) => AD.autoLight(w).hits.length), [2, 2, 3]);
  for (const id of RIVALS) { const n = AD.autoFoe(id, ST.RIVAL_SHEETS[id]).combo.hits.length, P = PM.prof.DYN_PROFILES[id]; assert.equal(n, Math.round((P.comboLen[0] + P.comboLen[1]) / 2), id); }
});

test('AC-03: the AP — 1 at the start, +1 a light attack that lands (hit or guarded, once per action), 5 at most; the skills pay', () => {
  const skill = act({ id: 'sk', kind: 'skill', ap: 5, charge: 1, power: 1 });
  const lightsBefore = (B, R = rules(), light = act({ hits: [0.5, 0.5] })) => { const r = AU.autoDuel(fighter({ light, skills: [skill] }), B, 2, { rules: R, log: true }); const c = r.log.filter((e) => e.who === 'a' && e.ev === 'charge'); const i = c.findIndex((e) => e.act === 'sk'); return i; };
  // four lights of two hits each landed: 1 + 4 = 5 AP, the skill is the fifth choice
  assert.equal(lightsBefore(dummy()), 4);
  // guarded lights gain them as well (the guard certain)
  assert.equal(lightsBefore(dummy({ guardBonus: 1 }), rules({ react: { cap: 1 } })), 4);
  // dodged lights gain none: the skill never comes
  assert.equal(lightsBefore(dummy({ dodgeBonus: 1 })), -1);
  // never more than 5: a skill of 6 never comes
  assert.equal(AU.autoDuel(fighter({ skills: [act({ id: 'six', kind: 'skill', ap: 6 })] }), dummy(), 2, { rules: rules(), log: true }).log.filter((e) => e.act === 'six').length, 0);
  // a gear's AP at the start
  assert.equal(lightsBefore(dummy(), rules(), act()) - 0, 4);
  const withAp = AU.autoDuel(fighter({ apStart: 2, light: act(), skills: [skill] }), dummy(), 2, { rules: rules(), log: true }).log.filter((e) => e.who === 'a' && e.ev === 'charge');
  assert.equal(withAp.findIndex((e) => e.act === 'sk'), 2);
});

test('DB5-3: a skill comes back 5 × its charge time at level 1 after it leaves (A3)', () => {
  for (const id of Object.keys(AD.AUTO_SKILLS)) assert.equal(AD.autoSkill(id, 3).cooldown, 5 * AD.autoCharge(id, 1), id);
  const sk = act({ id: 'sk', kind: 'skill', cooldown: 10, charge: 1 });
  const starts = AU.autoDuel(fighter({ skills: [sk] }), dummy(), 2, { rules: rules({ maxT: 60 }), log: true }).log.filter((e) => e.act === 'sk' && e.ev === 'charge').map((e) => e.t);
  assert.ok(starts.length >= 4);
  for (let i = 1; i < starts.length; i++) { assert.ok(starts[i] - starts[i - 1] >= 10 - 1e-6); assert.ok(starts[i] - starts[i - 1] < 11.5); }
});

test('DB5-4: the break — a gauge of 70, stunned 10 s, the damage taken ×2, its charge paused, its enchaînement cut, the gauge empty after (A3); the decay', () => {
  // the target charges a light attack of 30 s from its start (≤ 0.6 s): broken at the 7th blow of 10, its blow leaves 10 s later than it would have
  const B = dummy({ light: act({ charge: 30, power: 1 }) }), r = AU.autoDuel(fighter({ light: act({ gauge: 10 }) }), B, 8, { rules: rules({ maxT: 200 }), log: true });
  const brk = r.log.find((e) => e.ev === 'break' && e.who === 'b'), b = blows(r), i = b.findIndex((e) => e.t > brk.t);
  assert.equal(b.filter((e) => e.t <= brk.t).length, 7);
  assert.ok(b.slice(i).filter((e) => e.t < brk.t + 10).every((e) => e.dmg === 200), 'the damage ×2 while stunned');
  assert.ok(b.find((e) => e.t > brk.t + 10).dmg === 100, 'back to ×1 after');
  const charge = r.log.find((e) => e.who === 'b' && e.ev === 'charge'), landed = r.log.find((e) => e.who === 'b' && ['hit', 'guarded', 'dodged'].includes(e.ev));
  const stuns = r.log.filter((e) => e.ev === 'break' && e.who === 'b' && e.t < landed.t).length;
  assert.ok(stuns >= 2 && Math.abs(landed.t - (charge.at + 10 * stuns)) < 0.011, 'its charge paused by each stun');
  // broken at the 7th blow again after the stun: the gauge emptied
  const breaks = r.log.filter((e) => e.ev === 'break' && e.who === 'b');
  assert.ok(breaks.length >= 2 && b.filter((e) => e.t >= breaks[0].t + 10 - 1e-9 && e.t <= breaks[1].t).length === 7, 'seven blows again from the end of the stun');
  // an enchaînement under way is cut by the break: the target strikes a 5-hit combo, the attacker breaks it at its 2nd hit
  const C = dummy({ light: act({ charge: 0.5, power: 1, hits: [0.2, 0.2, 0.2, 0.2, 0.2], gap: 1 }), gauge: 0 });
  const r2 = AU.autoDuel(fighter({ light: act({ charge: 1.25, gauge: 70 }) }), C, 1, { rules: rules({ maxT: 20 }), log: true });
  const b2 = r2.log.find((e) => e.ev === 'break' && e.who === 'b'), after = r2.log.filter((e) => e.who === 'b' && e.ev === 'hit' && e.t > b2.t && e.t < b2.t + 10);
  assert.equal(after.length, 0, 'no hit of its combo during its stun');
  // the decay: 0.63 a second (today's 1.8 a gauge of 100, × 70 / 100, half as fast, DB11-1): a blow of 25 every 10 s breaks at the 4th (25, 43.7, 62.4, 81.1)
  // against the 3rd without it; a blow of 6 every 10 s never
  assert.equal(AU.AUTO_RULES.gauge.decay, +(1.8 * 0.7 * 0.5).toFixed(2));
  const nth = (gauge, decay) => { const r = AU.autoDuel(fighter({ light: act({ charge: 10, gauge }) }), dummy(), 1, { rules: rules({ gauge: { decay }, maxT: 200 }), log: true }); const k = r.log.find((e) => e.ev === 'break'); return k ? blows(r).filter((e) => e.t <= k.t).length : 0; };
  assert.equal(nth(25, 0.63), 4); assert.equal(nth(25, 0), 3); assert.equal(nth(6, 0.63), 0);
  assert.deepEqual([AU.AUTO_RULES.gauge.max, AU.AUTO_RULES.brk.stun, AU.AUTO_RULES.brk.dmg], [70, 10, 2]);
});

test('AC-08: each fighter\'s form of the day, ±15 %, from its own stream: the duel\'s other draws are the same without it', () => {
  const forms = [];
  for (let s = 1; s <= 300; s++) { const r = AU.autoDuel(fighter(), dummy({ hp: 50 }), s, { rules: rules({ form: 0.15 }), log: true }); forms.push(...r.form); assert.equal(blows(r)[0].dmg, Math.max(1, Math.round(100 * r.form[0]))); }
  assert.ok(Math.min(...forms) >= 0.85 && Math.max(...forms) <= 1.15);
  assert.ok(Math.min(...forms) < 0.87 && Math.max(...forms) > 1.13);
  assert.ok(Math.abs(forms.reduce((a, b) => a + b, 0) / forms.length - 1) < 0.01);
  const R1 = rules({ react: { dodge: 0.12, guard: 0.35 }, form: 0.15 }), R0 = rules({ react: { dodge: 0.12, guard: 0.35 }, form: 0 });
  const ev = (R) => blows(AU.autoDuel(fighter(), dummy(), 42, { rules: R, log: true })).map((e) => `${e.t} ${e.ev}`);
  assert.deepEqual(ev(R1), ev(R0));
  assert.equal(AU.AUTO_RULES.form, 0.15);
  // its own stream, seeded by the duel's seed: the forms are its first two draws, and the main stream's first two draws stay the initiative
  for (const seed of [1, 42, 99991]) {
    const r = AU.autoDuel(fighter(), dummy(), seed, { rules: rules({ form: 0.15 }), log: true }), fr = new Rng((seed ^ 0x9e3779b9) >>> 0), main = new Rng(seed);
    assert.deepEqual(r.form, [1 + 0.15 * (2 * fr.next() - 1), 1 + 0.15 * (2 * fr.next() - 1)]);
    const first = r.log.find((e) => e.who === 'a' && e.ev === 'charge');
    assert.equal(first.t, +(main.next() * AU.AUTO_RULES.start).toFixed(2));
  }
});

test('determinism: the same seed gives the same duel, another seed another', () => {
  const A = () => AD.autoRen({ hp: 324, atk: 17, def: 17, end: 10, viv: 9 }, { loadout: ['t1', 't4', 'd1', 's1'], levels: { t1: 2 } }, { weapon: 'imported-blade' });
  const B = () => AD.autoFoe('orla', AD.autoRaceSheet('orla', 0, 1, { preparation: 61 }));
  const a = AU.autoDuel(A(), B(), 1234, { log: true }), b = AU.autoDuel(A(), B(), 1234, { log: true }), c = AU.autoDuel(A(), B(), 1235, { log: true });
  assert.deepEqual(a, b); assert.notDeepEqual(a.log, c.log);
});

// ------------------------------------------------------------------------------------------------------------------ the deciders (hand-made views)

const side = (o = {}) => ({ ap: 1, ward: null, boost: null, broken: false, act: null, at: 0, ...o });
const view = (o = {}) => ({ t: 10, me: side(o.me), foe: side(o.foe), rules: AU.AUTO_RULES, usable: o.usable ?? ((a) => (a.ap ?? 0) <= (o.me?.ap ?? 1)), gauge: (s) => (s === undefined ? 0 : s.g ?? 0), chargeOf: (_, a) => a.charge, rand: o.rand ?? (() => 0.99), ...(o.extra ?? {}) });
const sk = (id, o) => ({ id, kind: 'skill', charge: 3, ap: 2, ...o });

test('AC-09: the automatic in the player\'s order — an offensive skill as soon as it can pay it, else the light attack', () => {
  const t1 = sk('t1', { ap: 2, power: 53 }), t4 = sk('t4', { ap: 4, power: 120 }), light = act();
  const x = (skills) => ({ ...fighter(), light, skills });
  assert.equal(AU.playerDecider(view({ me: { ap: 4 } }), x([t1, t4])).id, 't1', 'the first of the player\'s order');
  assert.equal(AU.playerDecider(view({ me: { ap: 4 } }), x([t4, t1])).id, 't4');
  assert.equal(AU.playerDecider(view({ me: { ap: 3 } }), x([t4, t1])).id, 't1', 'the first it can pay');
  assert.equal(AU.playerDecider(view({ me: { ap: 1 } }), x([t4, t1])).id, 'light');
  // the order a player who sets none gets: the wards, the boosts, then the offensive skills from the strongest at their levels
  assert.deepEqual(AD.autoDefaultOrder(['t1', 't4', 'd1', 's1'], { t1: 1, t4: 1 }), ['d1', 's1', 't4', 't1']);
  assert.deepEqual(AD.autoDefaultOrder(['k_feint', 't1', 'k_parry', 'k_cry'], {}), ['k_parry', 'k_cry', 't1', 'k_feint']);
  assert.deepEqual(AD.autoRen(ST.REN_BASE, { loadout: ['t1', 't4', 'd1', 's1'], levels: {}, order: ['t4', 'd1', 't1', 's1'] }).skills.map((s) => s.id), ['t4', 'd1', 't1', 's1']);
});

test('AC-09: the automatic places its supports — a ward against a blow seen coming in time or past two thirds of its gauge, a covering ward, a boost that a skill can follow', () => {
  const ward = sk('d1', { ap: 2, charge: 3, ward: { dur: 9, dmg: 0.5, gauge: 0.5 } }), boost = sk('s1', { ap: 3, boost: { dur: 12, dmg: 1.5, gauge: 1.5 } }), t1 = sk('t1', { ap: 2, power: 53 });
  const x = (skills) => ({ ...fighter(), light: act(), skills });
  const big = { act: { kind: 'skill' }, at: 15 }, soon = { act: { kind: 'skill' }, at: 12 }, small = { act: { kind: 'light' }, at: 15 };
  assert.equal(AU.playerDecider(view({ me: { ap: 2 }, foe: big }), x([ward, t1])).id, 'd1', 'the blow lands after the ward is up');
  assert.equal(AU.playerDecider(view({ me: { ap: 2 }, foe: soon }), x([ward, t1])).id, 't1', 'too late for the ward');
  assert.equal(AU.playerDecider(view({ me: { ap: 2 }, foe: small }), x([ward, t1])).id, 't1', 'a light blow is not a reason');
  assert.equal(AU.playerDecider(view({ me: { ap: 2, g: 47 }, foe: small }), x([ward, t1])).id, 'd1', 'past two thirds of 70');
  assert.equal(AU.playerDecider(view({ me: { ap: 2, ward: { until: 20 } }, foe: big }), x([ward, t1])).id, 't1', 'one ward at a time');
  const cover = { ...ward, cover: true };
  assert.equal(AU.playerDecider(view({ me: { ap: 4 }, foe: small }), x([cover, t1])).id, 'd1', 'a covering ward when the AP after it still pay a skill');
  assert.equal(AU.playerDecider(view({ me: { ap: 3 }, foe: small }), x([cover, t1])).id, 't1', 'not when they would not');
  assert.equal(AU.playerDecider(view({ me: { ap: 4 }, foe: { ...small, broken: true } }), x([cover, t1])).id, 't1', 'nor against a broken opponent');
  assert.equal(AU.playerDecider(view({ me: { ap: 5 }, foe: small }), x([boost, t1])).id, 's1', 'a boost a skill can follow');
  assert.equal(AU.playerDecider(view({ me: { ap: 4 }, foe: small }), x([boost, t1])).id, 't1', 'not when none could');
  assert.equal(AU.playerDecider(view({ me: { ap: 3 }, foe: { ...small, broken: true } }), x([boost, t1])).id, 's1', 'a boost on a broken opponent');
  assert.equal(AU.playerDecider(view({ me: { ap: 5, boost: { until: 20 } }, foe: small }), x([boost, t1])).id, 't1', 'one boost at a time');
});

test('the rivals\' AI: its ward past half its gauge, a ready skill by its share and weights, its heavy blow by its share, a combo by its share', () => {
  const ward = sk('w', { ap: 0, ward: { dur: 6, dmg: 0.6, gauge: 0.5 }, weight: 1 }), heavy = sk('h', { ap: 0, heavy: true }), off1 = sk('o1', { ap: 0, weight: 2 }), off2 = sk('o2', { ap: 0, weight: 1 });
  const combo = act({ id: 'c', hits: [0.5, 0.5] }), x = { ...dummy(), light: act(), combo, skills: [heavy, off1, off2, ward], ai: { chance: 0.3, heavy: 0.4, combo: 0.6 } };
  const draws = (...v) => { let i = 0; return () => v[i++]; };
  assert.equal(AU.rivalDecider(view({ me: { g: 36 } }), x).id, 'w', 'past half of 70');
  assert.equal(AU.rivalDecider(view({ me: { g: 30 }, rand: draws(0.1, 0) }), x).id, 'o1', 'a skill (0.1 < 0.3), the first by weight');
  assert.equal(AU.rivalDecider(view({ me: { g: 30 }, rand: draws(0.1, 0.99) }), x).id, 'w', 'a skill, the last by weight');
  assert.equal(AU.rivalDecider(view({ me: { g: 30 }, rand: draws(0.5, 0.3) }), x).id, 'h', 'no skill (0.5), its heavy blow (0.3 < 0.4)');
  assert.equal(AU.rivalDecider(view({ me: { g: 30 }, rand: draws(0.5, 0.5, 0.5) }), x).id, 'c', 'its combo (0.5 < 0.6)');
  assert.equal(AU.rivalDecider(view({ me: { g: 30 }, rand: draws(0.5, 0.5, 0.7) }), x).id, 'light');
});

// ------------------------------------------------------------------------------------------------------------------ the race and the gear

test('AC-16 and LC1-1 (A3): the race — each rival\'s shape at a common level, +15 % each round of the pool, more at the bracket, more again in the final, its pool Speed kept', () => {
  const R = AD.AUTO_RACE;
  // LC1-1 « +15 % par tour (décision A3 : change AC-16) » (journal Passe LC2), in place of AC-16's +10 %
  assert.deepEqual(R.pool.map((x) => +(x / R.pool[0]).toFixed(6)), [1, 1.15, 1.3]);
  assert.ok(R.stage[1] > R.pool[2] && R.stage[2] > R.stage[1], 'little by little in the pool, a lot in the final phase');
  for (const id of RIVALS) {
    const b = ST.RIVAL_SHEETS[id];
    for (const [stage, round, k] of [[0, 0, R.norm[id] * R.pool[0]], [0, 1, R.norm[id] * R.pool[1]], [0, 2, R.norm[id] * R.pool[2]], [1, 0, R.norm[id] * R.stage[1]], [2, 0, R.norm[id] * R.stage[2]]]) {
      const s = AD.autoRaceSheet(id, stage, round);
      for (const key of ['hp', 'atk', 'def', 'end']) assert.ok(Math.abs(s[key] - b[key] * k) < 1e-9, `${id} ${key} at stage ${stage} round ${round}`);
      assert.equal(s.viv, b.viv, `${id}: its pool Speed at every stage (DB11-2 changed)`);
    }
  }
  // the common level: the rivals' health over their sheets apart, their factors one in the pool
  assert.ok(Math.max(...RIVALS.map((id) => R.norm[id])) / Math.min(...RIVALS.map((id) => R.norm[id])) > 1.2, 'each shape brought to the common level by its own factor');
});

test('AC-17: a rival\'s preparation as visible Attack points, +1 per 25 over 20; an injury\'s share of its health; a generic fighter its rival\'s raced sheet by its shares', () => {
  for (const [prep, pts] of [[0, 0], [20, 0], [45, 1], [70, 2], [100, 3.2]]) assert.ok(Math.abs(AD.autoPrepPoints(prep) - pts) < 1e-9, `${prep}`);
  const base = AD.autoRaceSheet('orla', 1), s = AD.autoRaceSheet('orla', 1, 0, { preparation: 70, hp: 0.85 });
  assert.ok(Math.abs(s.atk - base.atk - 2) < 1e-9); assert.ok(Math.abs(s.hp - base.hp * 0.85) < 1e-9); assert.equal(s.def, base.def);
  for (const g of Object.values(GENERICS)) {
    const r = AD.autoRaceSheet(g.profile, 2), x = AD.autoGenericSheet(g.profile, g, 2);
    assert.ok(Math.abs(x.hp - r.hp * g.hp) < 1e-9 && Math.abs(x.atk - r.atk * g.damage) < 1e-9 && x.def === r.def);
  }
});

/** a version 2 game's state on the morning of day 2, with what a test gives it */
function v2State(o = {}) {
  const st = G.newGame(1842, 'Ren'); G.makeV2(st);
  const g = VG.gearOf(st); Object.assign(g, o.gear ?? {});
  for (const it of o.items ?? []) st.player.items.push(it);
  return st;
}

test('AC-11 (A3): every stat point of every piece and of the forge ×2, the penalties included, in the gear\'s own table since lot 2; the AP and the effects\' length unchanged', () => {
  const GR = GEAR_MOD;
  // DB7-2's points (journal Passe DB8), the table AC-11 doubles (written here, never read from the code)
  const DB72 = {
    'imported-blade': { atk: 2 }, 'duelist-sabre': { atk: 1.5, viv: 1 }, 'padded-jack': { def: 1 }, 'mail-shirt': { def: 3, viv: -0.5 }, 'dock-leathers': { def: 1.5, end: 1 },
    'lucky-ribbon': { ap: 1 }, 'iron-ring': { end: 2 }, 'swift-boots': { viv: 1 }, 'fervour-charm': { effect: 1.3 }, 'docker-wrap': { hp: 18 }, 'champion-token': { ap: 1, end: 0.5 },
    'river-pearl': { end: 1.5, hp: 10 }, 'knight-hauberk': { def: 3.5, viv: -0.5 }, 'pilgrim-medal': { hp: 16, effect: 1.15 }, whetstone: { atk: 0.5 },
  };
  for (const [id, fx] of Object.entries(DB72)) {
    const want = Object.fromEntries(Object.entries(fx).map(([k, v]) => [k, k === 'ap' || k === 'effect' ? v : v * 2]));
    assert.deepEqual(GR.GEAR[id].fx, want, id);
  }
  assert.equal(GR.WEAPON_TIER_ATK, 2, 'a forge tier +2 Attack (+1 before AC-11)');
  // the duel reads the game's stats as they are (v2Stats), the doubled points in them
  const base = AM.autoRenStats(v2State());
  assert.deepEqual(base, VG.v2Stats(v2State()), 'nothing worn: the same stats');
  const cases = [
    [{ gear: { weapon: 'imported-blade' } }, { atk: 4 }],
    [{ gear: { weapon: 'imported-blade', tier: 2 } }, { atk: 4 + 4 }],
    [{ gear: { armour: 'mail-shirt' } }, { def: 6, viv: -1 }],
    [{ gear: { acc: ['iron-ring', 'docker-wrap'] } }, { end: 4, hp: 36 }],
    [{ gear: { weapon: 'duelist-sabre', acc: ['swift-boots', null] } }, { atk: 3, viv: 4 }],
    [{ items: ['whetstone'] }, { atk: 1 }],
  ];
  for (const [o, d] of cases) {
    const st = AM.autoRenStats(v2State(o));
    assert.deepEqual(st, VG.v2Stats(v2State(o)), JSON.stringify(o));
    for (const key of ['hp', 'atk', 'def', 'end', 'viv']) assert.ok(Math.abs(st[key] - (base[key] + (d[key] ?? 0))) < 1e-9, `${JSON.stringify(o)} ${key}: ${st[key]}`);
  }
});

// ------------------------------------------------------------------------------------------------------------------ the game: every version 2 game

test('AC-18: an off-screen bout is the same duel, the AI on both sides; a version 2 game resolves its off-screen bouts with it', () => {
  const r = AD.autoOffscreen('marek', 'vessa', { stage: 1, seed: 77 });
  const a = AD.autoFoe('marek', AD.autoRaceSheet('marek', 1), { side: 'ren' }), b = AD.autoFoe('vessa', AD.autoRaceSheet('vessa', 1));
  assert.equal(a.brain, 'rival'); assert.equal(b.brain, 'rival');
  assert.deepEqual(r, AU.autoDuel(a, b, 77));
  // the pool's off-screen bouts of a version 2 game, re-derived from the same draws: each one's seed from its match's stream, then the duel
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

test('the game: every version 2 game plays this duel, its bouts, challenges and off-screen bouts (lot 2); today\'s game (v2=0) keeps its own', () => {
  const st = G.newGame(1842, 'Ren'); G.makeV2(st);
  assert.equal(st.flags.autoDuel, undefined, 'no laboratory flag left'); assert.equal(PO.autoDuelRules(st), true);
  const today = G.newGame(1842, 'Ren');
  assert.equal(PO.autoDuelRules(today), false, 'today\'s game keeps its duel');
  // a whole game of the reference player (AC-14): each bout the laboratory fights is this duel's outcome; the TournamentLab's lot 1 name, --rules=auto, the same game
  let fights = 0;
  const wrap = { name: 'w', skill: 0.6, choose: (s) => {
    const a = L.POLICIES.reference.choose(s);
    if (a.type === 'fight') {
      fights++;
      const o = AM.autoOutcome(s), lab = L.botOutcome(s, 0.6);
      assert.deepEqual(lab, { winner: o.winner, playerHp: o.playerHp, playerMaxHp: o.playerMaxHp, opponentHp: o.opponentHp, opponentMaxHp: o.opponentMaxHp, finisher: o.finisher });
    }
    return a;
  } };
  const run = L.autoplay(7, wrap, 'Ren', 260, 'v2');
  assert.ok(run.state.over && fights >= 5);
  assert.equal(L.autoplay(7, L.POLICIES.reference, 'Ren', 260, 'auto').hash, L.autoplay(7, L.POLICIES.reference, 'Ren', 260, 'v2').hash, '--rules=auto is --rules=v2');
  // today's game: its bout fought by the bot in today's arena, as before
  const c = L.autoplay(7, L.POLICIES.diligent, 'Ren', 260, 'classic');
  assert.ok(c.state.over && !c.state.flags.v2);
});
