// The duel played by the computer (lot 1 of briefs/combat-auto.md § 17.3; the operator's rules sheet read back in journal Passe AC4): src/combat/auto.ts,
// autoData.ts, autoMatch.ts. Three kinds of proof:
// 1. the port: the workshop's prototype (tools/auto-duel/sim.mjs, kits.mjs, journal Passes AC1 to AC3), run beside it on the same fighters and seeds under its
//    complete model, gives the same fighters and the same duels, event for event (the principle of journal Passe P1: a port proves itself against the original
//    run beside it, on inputs that reach every path);
// 2. each rule against an oracle written from the decisions (AC-02 to AC-09, DB5-3, DB5-4, AC-11, AC-16, AC-17), on hand-made fighters, never read from the code;
// 3. the game untouched: nothing of the game plays it but a laboratory's game (`flags.autoDuel`), whose bouts and off-screen bouts it plays.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';
import { duel as protoDuel, RULES as PROTO_RULES, DECIDERS as PROTO_DECIDERS } from '../tools/auto-duel/sim.mjs';
import { renFighter as protoRen, foeFighter as protoFoe, renActions as protoRenActions, KIT as PROTO_KIT } from '../tools/auto-duel/kits.mjs';

const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const AM = await load('/src/combat/autoMatch.ts');
const ST = await load('/src/combat/stats.ts');
const SK = await load('/src/combat/skills.ts');
const L = await load('/src/tournament/lab.ts');
const G = await load('/src/simulation/index.ts');
const PO = await load('/src/tournament/pool.ts');
// the prototype's own view of the game's data (tools/auto-duel/kits.mjs loadGame)
const PM = { stats: ST, skills: SK, book: await load('/src/combat/skillbook.ts'), v2duel: await load('/src/combat/v2duel.ts'), prof: await load('/src/combat/profiles.ts') };

// the prototype's complete model (journal Passe AC3; the shared notes' atelier-combat-model-P.txt and level-P3.json)
Object.assign(PROTO_KIT, { prep: 'stats', combos: 'on', traits: 1, gearK: 2 });
const PROTO_R = JSON.parse(JSON.stringify(PROTO_RULES));
Object.assign(PROTO_R, { hpScale: 2, autoDecider: 'smart' });
PROTO_R.react.skillGuard = 2; PROTO_R.luck.form = 0.15;

const RIVALS = Object.keys(ST.RIVAL_SHEETS);
const pick = (a) => ({ kind: a.kind, charge: a.charge, power: a.power, gauge: a.gauge, ap: a.ap ?? 0, cooldown: a.cooldown, pierce: !!a.pierce, heavy: !!a.heavy, hits: a.hits, gap: a.gap, ward: a.ward, boost: a.boost, weight: a.weight });

test('the port: every skill at every level, every weapon and every rival as the prototype builds them', () => {
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
});

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

test('the port: the same duels, event for event, on kits, weapons, stages and states that reach every path', () => {
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
});

test('the port: an off-screen bout is the prototype\'s duel of two rivals', () => {
  for (const [a, b] of [['marek', 'vessa'], ['tobin', 'rhosk'], ['orla', 'cassius'], ['ilse', 'orla']]) for (const stage of [0, 1, 2]) for (const seed of [3, 901]) {
    const sh = (id) => { const k = AD.autoRaceFactor(id, stage, 0), x = ST.RIVAL_SHEETS[id]; return { hp: x.hp * k, atk: x.atk * k, def: x.def * k, end: x.end * k, viv: x.viv }; };
    const A = protoFoe(PM, a, stage, { sheet: sh(a), decider: PROTO_DECIDERS.rival }), B = protoFoe(PM, b, stage, { sheet: sh(b), decider: PROTO_DECIDERS.rival });
    const p = protoDuel(A, B, seed, PROTO_R, { log: true }), m = AD.autoOffscreen(a, b, { stage, seed });
    const mLog = AU.autoDuel(AD.autoFoe(a, AD.autoRaceSheet(a, stage), { side: 'ren' }), AD.autoFoe(b, AD.autoRaceSheet(b, stage)), seed, { log: true }).log;
    assert.deepEqual(mLog, p.log, `${a} - ${b}, stage ${stage}, seed ${seed}`);
    assert.deepEqual([m.t, m.hp], [p.t, p.hp]);
  }
});
