// The laboratory's ways of deciding Ren's skills (tools/auto-tactics.mjs, journal Passe OP1), kept to the game as it is. The file had gone stale without a sign: it read
// `AU.tacticChoice` and the AP, both gone since « La Brute » (journal Passes BL1 / BL2), skipped the modes that needed them and measured the others against a duel without
// the rule they named. What is proved here, in Node, against the game's own duel:
// - the file is built on what the game exports: a function of src/combat/auto.ts or src/combat/autoData.ts that is gone stops it, by its name (never a mode skipped);
// - the modes are the list written out here: none speaks of AP, the page's eleven tactics and their control are all there;
// - the control: the page's tactic whose every line is « auto » is the automatic, event for event, on every rival and several seeds;
// - every mode plays whole duels to a result, Ren's actions always his own (a skill of his four, the heavy blow, the light attack);
// - the modes do what their names say: « soutiens dès que prêts » launches the support in every duel, « soutiens jamais » never;
// - the page's lines are the ones the game accepts: the laboratory's `legal` is the game's own `autoCondOf` for every skill of the catalogue and every condition, and a line
//   the page refuses (« gauge » on an offensive skill) is the automatic's, where the former file's unfiltered tactic would have held the skill back.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';
import { makeTactics } from '../tools/auto-tactics.mjs';

const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const ST = await load('/src/combat/stats.ts');

const RIVALS = Object.keys(ST.RIVAL_SHEETS);
const LV = { t1: 2, t2: 1, t3: 1, t4: 1, d1: 1, s1: 1, k_iron: 1, k_parry: 1, k_cry: 1, k_focus: 1, k_sunder: 1, k_feint: 1, heavy: 1 };
const renOf = (kit = {}) => AD.autoRen({ ...ST.REN_BASE, hp: 324, atk: 17, def: 15 }, { loadout: ['t1', 't4', 'd1', 's1'], levels: LV, ...kit }, { weapon: 'imported-blade' });
const foeOf = (id, stage = 0) => AD.autoFoe(id, AD.autoRaceSheet(id, stage, 1));
const line = (e) => [e.t, e.ev, e.who, e.act ?? '', e.dmg ?? '', e.hp ?? ''].join();
const TAC = makeTactics(AU, AD);
const CONTROL = 'page : tout comme l’automatique (le contrôle)';
/** a duel with Ren's decider replaced by a mode's (the rival keeps the game's automatic) */
const duel = (mode, foe, seed) => AU.autoDuel(renOf(), foeOf(foe), seed, { log: true, deciders: { player: TAC.deciderOf(TAC.MODES[mode], AU.autoDecider) } });

test('the laboratory is built on what the game exports: a function that is gone stops it by its name', () => {
  for (const f of ['planChoice', 'condHolds', 'autoRole', 'autoSkillChoice', 'heavyWhen', 'offensive', 'autoDecider', 'DECIDERS']) {
    assert.throws(() => makeTactics({ ...AU, [f]: undefined }, AD), new RegExp(f), `auto.ts without ${f}`);
  }
  for (const f of ['autoCondsFor', 'AUTO_CONDS_OF']) assert.throws(() => makeTactics(AU, { ...AD, [f]: undefined }), new RegExp(f), `autoData.ts without ${f}`);
  assert.throws(() => makeTactics(AU), /autoCondsFor/, 'the game\'s data is needed too');
});

test('the modes are the list written here: none speaks of the AP, the page\'s tactics are all there', () => {
  assert.deepEqual(Object.keys(TAC.MODES), [
    'automatique', 'aux signaux', 'la plus forte à la rupture', 'la plus forte pour finir', 'protections dès que prêtes', 'soutiens dès que prêts', 'soutiens jamais',
    'appuis au hasard (1 sur 4)', 'appuis au hasard (1 sur 2)', 'appuis au hasard, soutiens seuls (1 sur 4)', 'appuis au hasard, offensives seules (1 sur 4)',
    CONTROL, 'page : offensives à la rupture', 'page : offensives quand il charge un gros coup', 'page : la plus forte à la rupture, les autres quand il charge',
    'page : la plus forte pour finir', 'page : offensives dès que prêtes', 'page : protections quand il charge un gros coup', 'page : protections à la jauge',
    'page : soutiens quand une offensive peut suivre', 'page : soutiens à la rupture', 'page : protections et soutiens dès que prêts', 'page : les signaux partout',
  ]);
  assert.ok(Object.keys(TAC.MODES).every((n) => !/\bPA\b|pleins/.test(n)), 'no mode of the AP');
  assert.equal(AU.AUTO_RULES.ap, undefined, 'the duel has no AP: a mode that named them would play a rule that is not there');
});

test('the control: the page\'s tactic whose every line is « auto » is the automatic, event for event', () => {
  assert.equal(typeof TAC.MODES[CONTROL], 'function', 'the control is a tactic of its own, not the automatic itself');
  for (const foe of RIVALS) for (const seed of [3, 41, 977]) {
    const a = AU.autoDuel(renOf(), foeOf(foe), seed, { log: true }), b = duel(CONTROL, foe, seed);
    assert.deepEqual(b.log.map(line), a.log.map(line), `${foe} ${seed}`);
  }
});

test('every mode plays whole duels to a result, Ren\'s actions his own', () => {
  const own = new Set([...renOf().skills.map((s) => s.id), 'heavy', 'light']);
  for (const mode of Object.keys(TAC.MODES)) for (const foe of ['marek', 'vessa', 'cassius']) for (const seed of [5, 88]) {
    const r = duel(mode, foe, seed);
    assert.ok(r.t > 0 && r.winner !== null && r.finisher, `${mode} / ${foe} / ${seed}: a duel to its K.O. (winner ${r.winner}, at ${r.t.toFixed(0)} s)`);
    const acts = new Set(r.log.filter((e) => e.who === 'ren' && e.ev === 'charge').map((e) => e.act));
    for (const a of acts) assert.ok(own.has(a), `${mode} / ${foe} / ${seed}: Ren charged ${a}`);
  }
});

test('the modes do what their names say: the support as soon as it is ready, or never', () => {
  const charged = (mode, foe, seed) => duel(mode, foe, seed).log.some((e) => e.who === 'ren' && e.ev === 'charge' && e.act === 's1');
  for (const foe of RIVALS) for (const seed of [5, 88]) {
    assert.ok(charged('soutiens dès que prêts', foe, seed), `${foe} ${seed}: the support leaves as soon as it is ready`);
    assert.ok(!charged('soutiens jamais', foe, seed), `${foe} ${seed}: « soutiens jamais » never launches it`);
  }
});

test('the page\'s lines are the ones the game accepts: `legal` is its own autoCondOf, a line it refuses is the automatic\'s', () => {
  // the equivalence, for every skill of the catalogue and every condition
  for (const [id, d] of Object.entries(AD.AUTO_SKILLS)) for (const c of AU.AUTO_CONDS) {
    assert.equal(TAC.legal({ id, family: d.family }, c), AD.autoCondOf({ tactic: { [id]: c } }, id), `${id} / ${c}`);
  }
  const t1 = { id: 't1', kind: 'skill', family: 'offensive', role: 'punish', power: 50, uses: 2, charge: 2 };
  const t4 = { id: 't4', kind: 'skill', family: 'offensive', role: 'exploit', power: 90, uses: 2, charge: 4 };
  const x = { skills: [t4, t1], heavy: { id: 'heavy', kind: 'heavy', charge: 1 }, light: { id: 'light', kind: 'light', charge: 0.7 } };
  // a hand-made view (the decision's inputs only: the fighter on its side, the heavy blow's rule reads it)
  const side = (o = {}) => ({ hp: 100, maxHp: 100, g: 0, broken: false, stunEnd: 0, act: null, at: 0, ward: null, openUntil: 0, hasteUntil: 0, slowUntil: 0, next: null, combo: null, ...o });
  const view = (o = {}) => { const me = side({ x, ...o.me }), foe = side(o.foe); return { t: 10, me, foe, rules: AU.AUTO_RULES, usable: () => true, gauge: (s) => s.g, chargeOf: (_, a) => a.charge, rand: () => 0.5 }; };
  // « gauge » is no line of an offensive skill (neither its role's nor its family's): the page refuses it, the line is the automatic's (the punish goes, the exploit waits);
  // the unfiltered tactic holds both back on the same line, Ren's own gauge being low
  assert.ok(!AD.autoCondsFor('t1').includes('gauge') && !AD.AUTO_CONDS_OF.offensive.includes('gauge'), 'neither list of an offensive skill offers « gauge »');
  const page = TAC.page(() => 'gauge'), raw = TAC.tactic(['gauge', 'gauge']);
  assert.equal(page(view(), x), t1, 'the page: both lines the automatic\'s, the punish goes');
  assert.notEqual(raw(view(), x), t1, 'the unfiltered tactic holds the punish back on the same line: the filter is what the page does');
  // a line the page offers is kept: the Thrust\'s « broken » holds for a break long enough for its 4 s charge, not for a shorter one
  const brk = TAC.MODES['page : offensives à la rupture'];
  assert.equal(brk(view({ foe: { broken: true, stunEnd: 15 } }), x), t4, 'foe broken for 5 s: the Thrust lands');
  assert.equal(brk(view({ foe: { broken: true, stunEnd: 12 } }), x), t1, 'foe broken for 2 s: too short for the Thrust; the punish\'s « broken » (its family\'s, kept as the game keeps it) holds for its 2 s charge');
  assert.notEqual(brk(view(), x), t4, 'foe not broken: the Thrust waits');
});
