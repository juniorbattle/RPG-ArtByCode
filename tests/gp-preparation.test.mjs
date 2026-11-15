// The preparation (chantier 2 of the general gameplay, journal Passe GP3): the operator's decisions of 15/11/2026 on the sheet
// https://claude.ai/artifact/WyRKyZbsB1MMp8yMmAw8ho (journal Passe GP2), word for word:
// - GP-12 « La fiche dès que l’adversaire est connu »: the match sheet of the next bout as soon as its opponent is known, Ren's plan for them kept and played by Master
//   Corvin's rehearsal; the skills page reckons against that opponent, no longer the pool's Marek;
// - GP-13 « Une fiche courte avant un défi »: a sheet before the sand, the opponent, both fighters, the rival a fighter of the town fights like, a plan for them;
// - GP-14 « La vigueur pour les combats du tournoi seulement (décision A3 : précise DB7-4) »: a challenge won keeps the stake, the skill, the sand's lesson and the
//   scouting, no longer the +24 health; an older save counted again;
// - GP-15 « Les rivaux s’adaptent, la rumeur le dit »: three plans a rival, the next at the cut and after each defeat against the player; the scouting keeps the plan
//   seen and its day; the rumour says the change, never the health nor the kit.
// Oracles written from the decisions, not read from the code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const AD = await load('/src/combat/autoData.ts');
const AM = await load('/src/combat/autoMatch.ts');
const AU = await load('/src/combat/auto.ts');
const P = await load('/src/simulation/preview.ts');
const PR = await load('/src/simulation/v2prep.ts');
const SC = await load('/src/simulation/v2scout.ts');
const I = await load('/src/simulation/v2intel.ts');
const T = await load('/src/simulation/v2town.ts');
const VG = await load('/src/simulation/v2gear.ts');
const POOL = await load('/src/tournament/pool.ts');
const ST = await load('/src/combat/stats.ts');
const TX = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR } = await load('/src/narrative/text/fr.ts');
const { RIVALS } = await load('/src/narrative/roster.ts');
const { GENERICS } = await load('/src/narrative/generics.ts');
const ROOT = path.resolve(import.meta.dirname, '..');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const tx = TX.tx;

const W = { type: 'wait' };
const WON = { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' };
const LOST = { winner: 'opponent', playerHp: 0, playerMaxHp: 200, opponentHp: 300, opponentMaxHp: 600, finisher: 'tech' };
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const boutDue = (s) => s.slot === 'afternoon' && s.tournament.matches.some((m) => m.day === s.day && !m.winner && (m.a === 'player' || m.b === 'player'));
/** a version 2 game played to a day and slot: every bout on the way won (or lost by `lose`), every other slot waited */
function playTo(day, slot, { seed = 1842, lose = () => false, st = G.makeV2(G.newGame(seed, 'Ren')) } = {}) {
  while (!(st.day === day && st.slot === slot)) st = act(st, boutDue(st) ? { type: 'fight', outcome: lose(st) ? LOST : WON } : W);
  return st;
}
const at = (st, day, slot, place) => { const s = structuredClone(st); s.day = day; s.slot = slot; if (place) s.place = place; return s; };

// ------------------------------------------------------------------------------------------------- GP-14: the vigour, the tournament's bouts alone

test('GP-14 (A3): a challenge won keeps the stake, the skill and the sand\'s lesson, no longer the vigour; the tournament\'s bouts give it', () => {
  const st = at(G.namedState('v2-training-morning'), 1, 'morning', 'training');
  const coins = st.player.coins;
  let s = act(st, { type: 'challenge', who: 'aldric', stake: 'coins' });
  s = act(s, { type: 'challengeResult', outcome: WON });
  assert.equal(s.v2.wins ?? 0, 0, 'no vigour for a challenge won');
  assert.equal(s.player.coins, coins - T.STAKE.coins + 2 * T.STAKE.coins, 'the stake back twice');
  assert.ok((s.v2.kit.levels.n_disarm ?? 0) >= 1, 'Ser Aldric Venn\'s skill learnt');
  assert.equal(VG.healthParts(s).vigour, 0);
  // a bout of the tournament won: +VIGOUR_HP for good
  const b = playTo(3, 'morning');
  assert.equal(b.v2.wins, 1); assert.equal(VG.healthParts(b).vigour, ST.VIGOUR_HP);
});

test('GP-14: a save of before, whose vigour counted its challenges, is counted again on the tournament\'s bouts as it loads', () => {
  const b = playTo(3, 'morning');
  const old = structuredClone(b); old.v2.wins = 5;
  const back = G.deserialize(G.serialize(old));
  assert.equal(back.v2.wins, 1, 'one bout of the tournament won');
  // today's game (v2=0) has no vigour to count
  const today = G.deserialize(G.serialize(G.newGame(1842, 'Ren'))); assert.equal(today.v2, undefined);
  // a game without a win, or whose count is right, comes back with the same fingerprint (play-flow reloads the page from its save)
  for (const s of [G.makeV2(G.newGame(1842, 'Ren')), b]) assert.equal(G.hash(G.deserialize(G.serialize(s))), G.hash(s));
});

test('GP-14: the pages say it in both languages (the result of a challenge, the match sheet, the guide, the hint)', () => {
  for (const [k, re] of [['v2.result.noVigour', /no health: only the tournament's bouts give vigour/], ['v2.sheet.hp.vigour', /for each bout of the tournament won/], ['tut.hint.vigour.body', /a challenge won gives none/]]) {
    assert.match(EN[k], re, k); assert.ok(FR[k], `${k} in French`);
  }
  assert.match(EN['tut.ch.prepare.body'], /with each bout of the tournament you win \(a challenge won adds none\)/);
  assert.match(EN['tut.ch.challenges.body'], /but adds no health: only the tournament's bouts give vigour/);
  // the arena's result of a challenge says none, the town's news a bout won only
  assert.match(src('src/ui/playArena.ts'), /won && v2 && !challenge \? .*v2\.result\.vigour[\s\S]*?: won && v2 && !reprisal \? .*v2\.result\.noVigour/);
  assert.match(src('src/ui/townUi.ts'), /const won = isV2\(this\.st\) && news\.some\(\(e\) => e\.id === 'player-won'\), sand = /);
});

// ------------------------------------------------------------------------------------------------- GP-12: the match sheet as soon as the opponent is known

test('GP-12: the next bout as its sheet shows it: the day before, its fighters as the duel would build them now, the form said on the day; the day, the duel\'s own', () => {
  const d1 = G.namedState('v2-day1-morning'), n1 = AM.autoNextBout(d1);
  assert.equal(n1.foeId, 'vessa'); assert.equal(n1.day, 2); assert.equal(n1.today, false); assert.equal(n1.seed, null);
  const f = AM.autoFightersFor(d1, 'vessa', 0, AD.autoRound(2));
  assert.deepEqual([n1.ren, n1.foe], [f.ren, f.foe]);
  // its day: the very bout autoBoutOf builds, its seed with it
  const d2 = at(d1, 2, 'afternoon'), n2 = AM.autoNextBout(d2), b2 = AM.autoBoutOf(d2);
  assert.equal(n2.today, true); assert.equal(n2.seed, b2.seed); assert.deepEqual(n2.ren, b2.ren); assert.deepEqual(n2.foe, b2.foe);
  // the bout won: the next one (Orla, day 4); every bout fought: none
  const d3 = playTo(3, 'morning'); assert.deepEqual([AM.autoNextBout(d3).foeId, AM.autoNextBout(d3).day], ['orla', 4]);
  // a finalist before the final is drawn: its other finalist, the final's day, no record yet
  const fin = playTo(7, 'morning'), nf = AM.autoNextBout(fin);
  if (nf && nf.day === 10) { assert.equal(nf.match, null); assert.equal(nf.stage, 2); }
});

test('GP-12: the skills page reckons against the next opponent (no longer the pool\'s Marek), and says whom', () => {
  const d1 = G.namedState('v2-day1-morning'), n = AM.autoNextBout(d1);
  const fig = P.skillFigures(d1, 't1', 1), k = ST.hitFactor(n.ren.atk, n.foe.def), a = AD.autoSkill('t1', 1);
  assert.equal(fig.damage, (a.hits ?? [1]).reduce((x, sh) => x + Math.max(1, Math.round(a.power * sh * k)), 0), 'the Flash cut against Vessa\'s Defence');
  assert.deepEqual(P.figuresAgainst(d1), { foe: 'vessa', day: 2 });
  // against the pool's Marek it would differ (her Defence is not his)
  const marek = AD.autoFoe('marek', AD.autoRaceSheet('marek', 0, 0));
  assert.notEqual(n.foe.def, marek.def);
  // a pair given (a challenge's sheet) takes the place of the next bout's
  const vs = { ren: n.ren, foe: marek };
  assert.equal(P.skillFigures(d1, 't1', 1, vs).damage, (a.hits ?? [1]).reduce((x, sh) => x + Math.max(1, Math.round(a.power * sh * ST.hitFactor(n.ren.atk, marek.def))), 0));
  assert.match(EN['ui.skill.against'], /\{name\}, your next opponent \(day \{day\}\)/); assert.ok(FR['ui.skill.against']);
});

test('GP-12: a plan set on the sheet the day before is kept for that rival and the rehearsal plays it', () => {
  const d1 = at(G.namedState('v2-training-morning'), 1, 'morning', 'training'); d1.facts.push('scouted:vessa');
  const before = PR.runRehearsal(d1);
  const s = act(d1, { type: 'setTactic', skill: 't1', cond: 'broken', foe: 'vessa' });
  assert.deepEqual(s.v2.kit.plans.vessa.tactic, { t1: 'broken' });
  const sh = PR.shadowBout(s), i = sh.ren.skills.findIndex((x) => x.id === 't1');
  assert.equal(sh.ren.tactic[i], 'broken', 'the shadow bout plays the plan kept for Vessa');
  assert.notEqual(PR.shadowKey(sh), before.key, 'a rehearsal of before no longer holds « with this plan »');
  const r = act(s, { type: 'rehearse' }).v2.$rehearsals.vessa;
  assert.equal(r.ren.tactic[r.ren.skills.findIndex((x) => x.id === 't1')], 'broken');
  // the real bout plays it too, on its day
  const d2 = at(s, 2, 'afternoon'), b = AM.autoBoutOf(d2);
  assert.equal(b.ren.tactic[b.ren.skills.findIndex((x) => x.id === 't1')], 'broken');
});

test('GP-12: the town opens it from the menu, the board and Master Corvin; the day\'s bout keeps its way into the arena', () => {
  const U = src('src/ui/townUi.ts'), B = src('src/ui/board.ts'), K = src('src/ui/skills.ts');
  assert.match(U, /if \(nb\) add\(tx\('prep\.sheet\.menu', \{ name: fighterName\(nb\.foeId\), day: nb\.day \}\), \(\) => this\.openMatchSheet\(\)\);/);
  assert.match(U, /boardPage\(this\.st, standings\(this\.st\), \(\) => this\.closeModal\(\), isV2\(this\.st\) && autoNextBout\(this\.st\) \? \(\) => this\.openMatchSheet\(\(\) => this\.openBoard\(\)\) : undefined\)/);
  assert.match(U, /tx\('prep\.sheet\.corvin', \{ name: fighterName\(nb\.foeId\) \}\)[\s\S]{0,120}this\.openMatchSheet\(\(\) => this\.openPerson\(who\)\)/);
  assert.match(U, /const enter = nb\.today && s\.slot === 'afternoon';/);
  assert.match(B, /press: \(\) => \{ if \(r\.id === nextFoe\) sheet\?\.\(\); \}/);
  assert.match(K, /const go = sheet === null \|\| !host\.enter \? null : footBtn\('Enter'/);
  for (const k of ['prep.sheet.menu', 'prep.sheet.short', 'prep.sheet.corvin', 'prep.sheet.ahead', 'prep.sheet.formDay', 'prep.sheet.pick']) { assert.ok(EN[k], k); assert.ok(FR[k], `${k} in French`); }
});

// ------------------------------------------------------------------------------------------------- GP-13: a short sheet before a challenge

test('GP-13: the sand\'s door opens a short sheet: the fighter, the rival a fighter of the town fights like, the stake, what a win gives, a plan kept for them', () => {
  const U = src('src/ui/townUi.ts');
  assert.match(U, /b\.addEventListener\('click', \(\) => this\.openChallengeSheet\(\(\) => this\.openHere\(\)\)\);/);
  assert.match(U, /enter: \(\) => \{ writeSave\(this\.st\); this\.closeModal\(\); this\.host\.reload\(\{ scene: 'arena', challenge: '1' \}\); \}/);
  // every fighter of the town fights on a rival's model, now said
  for (const g of Object.values(GENERICS)) {
    const line = tx('prep.challenge.like', { name: g.name, rival: RIVALS[g.profile].name });
    assert.match(line, new RegExp(`${g.name} fights on the model of ${RIVALS[g.profile].name}`));
  }
  for (const k of ['prep.challenge.like', 'prep.challenge.stakeCoins', 'prep.challenge.stakeName', 'prep.challenge.reprisal', 'prep.challenge.teach', 'prep.challenge.raise', 'prep.challenge.go', 'prep.challenge.pick']) { assert.ok(EN[k], k); assert.ok(FR[k], `${k} in French`); }
  // a plan set on it for a fighter of the town is kept for them and the duel on the sand plays it
  const st = at(G.namedState('v2-training-morning'), 1, 'morning', 'training');
  let s = act(st, { type: 'challenge', who: 'aldric', stake: 'coins' });
  s = act(s, { type: 'setTactic', skill: 't1', cond: 'broken', foe: 'aldric' });
  const b = AM.autoBoutOf(s, 'challenge');
  assert.equal(b.foeId, 'aldric'); assert.equal(b.ren.tactic[b.ren.skills.findIndex((x) => x.id === 't1')], 'broken');
  // the tournament's bouts keep the general plan
  const n = AM.autoNextBout(s); assert.equal(n.ren.tactic, undefined);
});

// ------------------------------------------------------------------------------------------------- GP-15: the rivals adapt, the rumour says it

test('GP-15: three plans a rival, the first the pool\'s, each condition among its role\'s, each plan playing other duels than the others', () => {
  for (const [id, plans] of Object.entries(AD.AUTO_PLANS)) {
    assert.equal(plans.length, POOL.PLANS_PER_RIVAL); assert.deepEqual(plans[0], AD.AUTO_STYLES[id].tactic);
    const parry = AD.AUTO_STYLES[id].parry ?? [];
    // (the plans of the pool predate the conditions by role, lot 2 of « La Brute »: the new ones take theirs)
    for (const p of plans.slice(1)) for (const [k, c] of Object.entries(p)) {
      assert.ok(AD.AUTO_FOES[id].skills.some((x) => x.id === k), `${id}: ${k} one of its skills`);
      const conds = parry.includes(k) ? AD.AUTO_CONDS_BY_ROLE.parry : AD.AUTO_CONDS_BY_ROLE[AD.AUTO_ROLES[k].role];
      assert.ok(conds.includes(c), `${id} ${k}: ${c} among its role's`);
    }
    // each plan plays its own duels: against the same Ren on the same seeds, not the same script as another plan's
    const ren = AD.autoRen({ hp: 400, atk: 16, def: 14, end: 12, viv: 10 }, { loadout: ['t1', 't4', 'd1', 's1'], levels: { t1: 2, t4: 2, d1: 1, s1: 1, heavy: 1 } });
    const t = (plan) => Array.from({ length: 12 }, (_, i) => AU.autoDuel(ren, AD.autoFoe(id, AD.autoRaceSheet(id, 1, 0), { stage: 1, plan }), 100 + i).t);
    const runs = [0, 1, 2].map(t);
    for (const [a, b] of [[0, 1], [0, 2], [1, 2]]) assert.notDeepEqual(runs[a], runs[b], `${id}: plans ${a + 1} and ${b + 1} play other duels`);
  }
  // a generic fighter plays its model's first plan whatever is asked
  const g = AD.autoFoe('aldric', AD.autoRaceSheet('ilse', 0, 0), { kitOf: 'ilse', plan: 0 });
  assert.deepEqual(g.tactic, g.skills.map((k) => AD.AUTO_STYLES.ilse.tactic[k.id] ?? 'auto'));
});

test('GP-15: every rival changes its plan at the cut, a rival beaten by the player after the bout or the challenge; the duels and the off-screen bouts play it', () => {
  const d5 = playTo(5, 'evening');
  for (const id of Object.keys(RIVALS)) {
    const c = d5.competitors[id], beaten = d5.tournament.matches.filter((m) => m.winner === 'player' && (m.a === id || m.b === id)).length;
    assert.equal(c.plan, (1 + beaten) % 3, `${id}: the cut and ${beaten} defeat(s)`);
    assert.equal(c.planFrom.why, 'cut'); assert.equal(c.planFrom.day, 5);
  }
  // after the bout of day 2: Vessa beaten, her next plan, its cause
  const d2 = playTo(2, 'evening');
  assert.deepEqual([d2.competitors.vessa.plan, d2.competitors.vessa.planFrom], [1, { day: 2, why: 'beaten' }]);
  const lost = playTo(2, 'evening', { lose: () => true }); assert.equal(lost.competitors.vessa.plan, undefined, 'a defeat of the player changes nothing');
  // a challenge won against a rival (Orla, day 1, the training ground), not against a fighter of the town
  let s = act(at(G.namedState('v2-training-morning'), 1, 'morning', 'training'), { type: 'challenge', who: 'orla', stake: 'coins' });
  s = act(s, { type: 'challengeResult', outcome: WON }); assert.deepEqual([s.competitors.orla.plan, s.competitors.orla.planFrom.why], [1, 'beaten']);
  // the third change brings the first plan back
  const c = structuredClone(s); for (let i = 0; i < 2; i++) POOL.adaptPlan(c, 'orla', 'beaten'); assert.equal(c.competitors.orla.plan, 0);
  // today's game: nothing changes
  const today = G.newGame(1842, 'Ren'); POOL.adaptPlan(today, 'vessa', 'cut'); assert.equal(today.competitors.vessa.plan, undefined);
  // the player's bout and the shadow's real fighter play the plan; an off-screen bout too
  const f = AM.autoFightersFor(d2, 'vessa', 0, 1);
  assert.deepEqual(f.foe.tactic, f.foe.skills.map((k) => AD.AUTO_PLANS.vessa[1][k.id] ?? 'auto'));
  assert.match(src('src/tournament/pool.ts'), /a: \{ preparation: A\.preparation, hp: rivalMods\(A\)\.hp, plan: A\.plan \}, b: \{ preparation: B\.preparation, hp: rivalMods\(B\)\.hp, plan: B\.plan \}/);
  const o0 = AD.autoOffscreen('vessa', 'orla', { stage: 1, seed: 9 }), o1 = AD.autoOffscreen('vessa', 'orla', { stage: 1, seed: 9, a: { plan: 1 }, b: { plan: 2 } });
  assert.notEqual(o0.t, o1.t, 'the off-screen duel plays the plans');
});

test('GP-15: the scouting keeps the plan seen and its day: tier 2 while it holds, a watch again after a change; Master Corvin\'s shadow plays what was seen', () => {
  let s = at(G.namedState('v2-day1-morning'), 1, 'morning', 'forecourt');
  s = act(s, { type: 'scout', who: 'vessa' });
  s = act(at(s, 1, 'evening', 'forecourt'), W); // (a slot later, the same day: refused, so wait to the next day)
  s = at(s, 2, 'morning', 'forecourt');
  s = act(s, { type: 'scout', who: 'vessa' });
  assert.equal(SC.scoutTier(s, 'vessa'), 2); assert.equal(SC.knownPlan(s, 'vessa'), 0); assert.equal(s.flags['scoutPlanDay:vessa'], 2);
  assert.ok(SC.scoutLines(s, 'vessa').includes(SC.planText('vessa', 'Vessa Lark', 0, 2)));
  // Vessa beaten: her plan changes; what was seen holds no more (tier 1), still said with its day, and a watch again opens (another day)
  const c = structuredClone(s); POOL.adaptPlan(c, 'vessa', 'beaten');
  assert.equal(SC.scoutTier(c, 'vessa'), 1); assert.ok(SC.planStale(c, 'vessa'));
  assert.ok(SC.scoutLines(c, 'vessa').includes(SC.planText('vessa', 'Vessa Lark', 0, 2)), 'the plan seen, its day');
  assert.equal(SC.secondWatch(c, 'vessa'), false, 'not the day of the last watch');
  const later = at(c, 3, 'morning', 'forecourt'); assert.ok(SC.secondWatch(later, 'vessa'));
  // the shadow at that moment: the plan seen (Master Corvin plays what the player knows), the real bout the new one
  later.day = 1; // (the next bout is ahead of it)
  const sh = PR.shadowBout(later);
  assert.equal(sh.tier, 2); assert.deepEqual(sh.foe.tactic, sh.foe.skills.map((k) => AD.AUTO_PLANS.vessa[0][k.id] ?? 'auto'));
  later.day = 3;
  const again = G.advance(later, { type: 'scout', who: 'vessa' });
  assert.ok(again.ok, again.reason); assert.equal(again.events[0].text, tx('v2.scout.logNew', { name: 'Vessa Lark' }));
  assert.equal(SC.knownPlan(again.state, 'vessa'), 1); assert.equal(SC.scoutTier(again.state, 'vessa'), 2);
  assert.equal(G.actions(again.state).find((o) => o.action.type === 'scout' && o.action.who === 'vessa')?.reason, tx('v2.scout.knownPlan', { name: 'Vessa Lark' }));
});

test('GP-15: the rumour says the plan\'s news and its cause, never the health nor the kit; the board says the rule; a save of before gets the changes its tournament made', () => {
  const d6 = playTo(6, 'evening');
  const who = I.nextOpponent(d6);
  if (who) {
    const h = I.rumourOf(d6, who, 'stranger', { next: () => 0.5, int: (a) => a, fork() { return this; } });
    assert.equal(h.hp, undefined); assert.equal(h.plan, 'new'); assert.ok(['cut', 'beaten'].includes(h.since));
    assert.match(I.rumourText(who, h), /And their plan has changed since (the cut|you beat them)\./);
  }
  assert.match(EN['v2.board.plans'], /At the cut, and after each defeat against you, a rival changes their plan/); assert.ok(FR['v2.board.plans']);
  assert.match(src('src/ui/board.ts'), /<p>\$\{tx\('v2\.board\.plans'\)\}<\/p>/);
  for (const k of ['v2.rumour.hp.fit', 'v2.rumour.hp.hurt', 'v2.rumour.hp.injured', 'scout.kit']) assert.equal(EN[k], undefined, `${k} out`);
  // an older save (no plan field anywhere): the cut and the bouts won against each rival
  const old = structuredClone(d6); for (const c of Object.values(old.competitors)) { delete c.plan; delete c.planFrom; }
  const back = G.deserialize(G.serialize(old));
  for (const id of Object.keys(RIVALS)) assert.equal(back.competitors[id].plan ?? 0, d6.competitors[id].plan ?? 0, id);
});
