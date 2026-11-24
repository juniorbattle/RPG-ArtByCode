// The player's sabotage (the operator's SB-1 « Oui, une forme : couper une sangle de l’adversaire la veille d’un combat de tableau », his note on the difficulty, SB-2, SB-3; his two sheets, SA-1 to
// SA-6 and SF-1 to SF-4, journal Passes CL2 / SB1 to SB4, `briefs/combat-auto.md` § 44): the three steps (the lockers cased by day at the forecourt, the stranger's blade on the quay at night, the night's
// cut at the forecourt), the eves (the evenings of days 5, 7 and 9), the strap cut (the rival takes ×1.15), the chance of being seen (15 / 35 / 55 % at the evening's security of 50, a point more for
// each point above it, Corra Dunmere's watch 15 points less), the rich rivals who keep their gear in Clerk Odo's strongroom from day 7 in one game in two, a sabotage seen (nothing cut, the registrar's
// warning, tomorrow's purse halved, the rival's grudge: their relation −30, their preparation +50 for that bout, the cause on the board), a cut kept secret, and a game that never sabotages keeping
// its state. The oracles are the decisions written out here, not the code's constants.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load } from './load.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const G = await load('/src/simulation/index.ts');
const S = await load('/src/simulation/v2sabotage.ts');
const AM = await load('/src/combat/autoMatch.ts');
const P = await load('/src/tournament/pool.ts');
const PU = await load('/src/tournament/pulse.ts');
const R = await load('/src/simulation/v2rivals.ts');
const TU = await load('/src/ui/tutorial.ts');
const LM = await load('/src/ui/listModel.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { tx } = await load('/src/narrative/text/index.ts');
const { FR_TEXTS } = await load('/src/narrative/text/fr-texts.ts');
const { RIVALS } = await load('/src/narrative/roster.ts');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

const W = { type: 'wait' };
const WON = { type: 'fight', outcome: { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } };
const LOST = { type: 'fight', outcome: { winner: 'opponent', playerHp: 0, playerMaxHp: 200, opponentHp: 300, opponentMaxHp: 600, finisher: 'heavy' } };
const mv = (to) => ({ type: 'move', to });
const run = (st, acts) => { for (const a of acts) { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason} @ day ${st.day} ${st.slot}`); st = r.state; } return st; };
const opt = (st, type, extra = {}) => G.actions(st).find((o) => o.action.type === type && Object.entries(extra).every(([k, v]) => !!o.action[k] === !!v));
const game = (seed) => G.makeV2(G.newGame(seed, 'Ren'));
const POOL4 = [W, W, W, W, WON, W, W, W, W, W, WON];   // the pool's first four days: the evening of day 4 ahead, at the quay

/** the eve of day 5 played through the three steps: the stranger's blade the evening before, the lockers cased in the morning, the pool's bout, then the night's cut */
function eve5(seed, accomplice = false, cut = true) {
  let st = run(game(seed), POOL4); st.player.coins = 60;
  st = run(st, [{ type: 'buyTool' }, mv('forecourt'), { type: 'caseLockers' }, WON]);
  return cut ? run(st, [{ type: 'cutStrap', ...(accomplice ? { accomplice: true } : {}) }]) : st;
}
const result = (st) => st.v2.sabotage.eves[5];
/** the first seed whose cut on the eve of day 5 had this result */
const seedWith = (want, from = 1) => { for (let s = from; s < from + 400; s++) if (result(eve5(s)).result === want) return s; throw new Error('no seed'); };

test('the decisions written out: the numbers of the strap, of being seen, of the rich rivals, of the grudge', () => {
  assert.equal(S.SAB.force, 1.15, 'SF-1 « A · ×1,15, comme la sangle de Cassius »');
  assert.deepEqual({ ...S.SAB.seen }, { 5: 0.15, 7: 0.35, 9: 0.55 }, 'SF-2: 15 / 35 / 55 %');
  assert.equal(S.SAB.accomplice, 0.15, 'SF-2: a complice −15 points'); assert.equal(S.SAB.accompliceCoins, 20, 'SF-2: for 20 coins');
  assert.equal(S.SAB.toolCoins, 8, 'SA-1: the stranger\'s blade, the price of his rumour');
  assert.equal(S.SAB.grudgePrep, 50, 'SF-4 « B · +50 »'); assert.equal(S.SAB.grudgeRel, -30, 'SA-5: relation −30');
  assert.deepEqual([S.SAB.lockFrom, S.SAB.lockWealth, S.SAB.lockChance], [7, 60, 0.5], 'SF-3 « C »: from day 7, a fortune of 60 or more, one game in two');
  assert.deepEqual([...S.EVES], [5, 7, 9]);
  assert.equal(S.forcePct(), 15); assert.equal(S.grudgeAttack(), 2, 'a preparation of +50 is two points of Attack (one per 25)');
  // the rich are Cassius 160, Marek 80, Rhosk 60; the others stay under
  assert.deepEqual(Object.values(RIVALS).filter((r) => r.wealth >= 60).map((r) => r.id).sort(), ['cassius', 'marek', 'rhosk']);
});

test('the three steps, where and when each is offered (SA-1): the lockers by day at the forecourt on the eve, the blade at the quay at night before it, the cut at the forecourt that night', () => {
  const base = game(7), stateAt = (st, day, slot, place) => { const s = structuredClone(st); s.day = day; s.slot = slot; s.place = place; return s; };
  // before the eve nothing is offered: day 4 on the forecourt by day, day 2 at the quay at night
  const afterPool = run(game(7), POOL4);                      // day 4, evening
  assert.equal(opt(stateAt(afterPool, 4, 'morning', 'forecourt'), 'caseLockers'), undefined, 'cased on the eve itself');
  assert.equal(opt(stateAt(base, 2, 'evening', 'district'), 'buyTool'), undefined, 'too early for the stranger (the bracket is days away)');
  // the blade: the quay, at night, from day 3, 8 coins, one slot
  const quay4 = stateAt(afterPool, 4, 'evening', 'district'), tool = opt(quay4, 'buyTool');
  assert.ok(tool?.ok, tool?.reason); assert.equal(tool.cost, 1, 'a slot'); assert.equal(tool.coins, 8);
  assert.equal(opt(stateAt(afterPool, 4, 'morning', 'district'), 'buyTool'), undefined, 'the stranger is a night-time man');
  assert.equal(opt(stateAt(afterPool, 4, 'evening', 'forecourt'), 'buyTool'), undefined, 'on the quay only');
  // the lockers: the forecourt, by day, on the eve (day 5), one slot, once a day
  const eve = stateAt(afterPool, 5, 'morning', 'forecourt'), c = opt(eve, 'caseLockers');
  assert.ok(c?.ok, c?.reason); assert.equal(c.cost, 1);
  const evening = stateAt(afterPool, 5, 'evening', 'forecourt');
  assert.equal(opt(evening, 'caseLockers'), undefined, 'by day only');
  // the cut: the forecourt, in the evening of the eve, alone or with Corra, a slot, 20 coins for her; refused without the blade or the casing, each with its reason
  const alone = opt(evening, 'cutStrap'), withCorra = opt(evening, 'cutStrap', { accomplice: true });
  assert.ok(alone && withCorra, 'two lines');
  assert.equal(alone.ok, false); assert.equal(alone.reason, EN['v2.sab.cut.noTool']);
  assert.equal(alone.cost, 1); assert.equal(withCorra.coins, 20);
  assert.equal(opt(stateAt(afterPool, 5, 'morning', 'forecourt'), 'cutStrap'), undefined, 'at night only');
  // the casing, then the blade, then the night
  const noCase = stateAt(run(stateAt(afterPool, 4, 'evening', 'district'), [{ type: 'buyTool' }]), 5, 'evening', 'forecourt');
  assert.equal(opt(noCase, 'cutStrap').reason, EN['v2.sab.cut.noCase']);
  // one blade at a time; the player must afford it
  const held = run(stateAt(afterPool, 3, 'evening', 'district'), [{ type: 'buyTool' }]);
  assert.equal(opt(stateAt(held, 4, 'evening', 'district'), 'buyTool').reason, EN['v2.sab.tool.have']);
  const poor = structuredClone(quay4); poor.player.coins = 7;
  assert.equal(opt(poor, 'buyTool').reason, tx('v2.sab.tool.poor', { n: 8 }));
  // the blade is bought the evening before, never on the night itself
  assert.equal(opt(stateAt(held, 5, 'evening', 'district'), 'buyTool'), undefined);
  // the sabotage's lines go with the theft and the force in the list (never its first line)
  for (const t of ['caseLockers', 'buyTool', 'cutStrap']) assert.equal(LM.hereGroup(t), 'steal', t);
});

test('the prices climb with the stage as the shops\' do (SA-3, third lever): the blade 8 and the watch 20, ×1.15 from day 6, ×1.3 from day 9', () => {
  const p = (day) => [S.toolPrice({ day }), S.accomplicePrice({ day })];
  assert.deepEqual(p(4), [8, 20]); assert.deepEqual(p(5), [8, 20]);
  assert.deepEqual(p(6), [Math.round(8 * 1.15), Math.round(20 * 1.15)]); assert.deepEqual(p(7), [9, 23]);
  assert.deepEqual(p(9), [Math.round(8 * 1.3), Math.round(20 * 1.3)]); assert.deepEqual(p(9), [10, 26]);
});

test('a strap cut stays secret (SA-6) and the rival takes ×1.15 the damage in tomorrow\'s bout, nothing else (SF-1)', () => {
  const seed = seedWith('cut'), st = eve5(seed), foe = result(st).foe;
  assert.equal(result(st).result, 'cut'); assert.equal(st.v2.sabotage.tool, undefined, 'the blade is used once');
  // the cut is in the player's own journal, in the words of the table, and nowhere else: no fact on the rival, no relation moved, no purse changed
  const line = st.log.find((e) => e.id === 'sabotage:cut'); assert.ok(line && line.visible);
  assert.equal(line.text, tx('v2.sab.cut.log', { name: RIVALS[foe].name, n: 15 }));
  const c = st.competitors[foe];
  assert.ok(!c.knownFacts.some((f) => f.startsWith('sabotaged-by')), 'a clean cut leaves nothing to find');
  assert.equal(R.stanceLine(st, foe) === null || !/locker/.test(R.stanceLine(st, foe)), true, 'the board says nothing of it');
  assert.equal(S.foeCut(st, 6, foe), true); assert.equal(S.foeCut(st, 6, 'marek' === foe ? 'vessa' : 'marek'), false, 'only the rival named');
  assert.equal(S.foeCut(st, 8, foe), false, 'only the next day\'s bout');
  // tomorrow's bout: the rival's `taken` is 1.15, the preparation and the purse as without it
  const next = AM.autoNextBout(st), plain = AM.autoNextBout(run(eve5(seed, false, false), [W]));
  assert.equal(next.foeId, foe); assert.equal(next.foe.taken, 1.15); assert.equal(plain.foe.taken ?? 1, 1, 'the control: the same night without the cut');
  assert.equal(next.prep, plain.prep, 'no grudge on a cut');
  const day6 = run(st, [W]); const bout = AM.autoBoutOf(day6);
  assert.equal(bout.foe.taken, 1.15, 'the day\'s bout the duel is played on');
  assert.equal(P.boutPurse(day6, day6.tournament.matches.find((m) => m.day === 6 && (m.a === 'player' || m.b === 'player')), true), 35, 'the purse is whole');
  // the rival's own damage and stats are the ordinary ones: only the cut changed
  assert.equal(bout.foe.atk, AM.autoBoutOf(run(eve5(seed, false, false), [W])).foe.atk);
});

test('a sabotage seen: nothing is cut, the registrar warns, tomorrow\'s purse is halved, the rival keeps a grudge and the board says why (SA-4, SA-5, SF-4)', () => {
  const seed = seedWith('seen'), st = eve5(seed), foe = result(st).foe, name = RIVALS[foe].name;
  assert.equal(result(st).result, 'seen');
  const control = eve5(seed, false, false);
  // nothing is cut: the rival takes the ordinary damage
  assert.equal(S.foeCut(st, 6, foe), false); assert.equal(AM.autoNextBout(st).foe.taken ?? 1, 1);
  // the grudge: their relation falls by 30, the cause is a fact on them and a line on the board
  const rel = (s) => s.competitors[foe].relationships.player ?? 0;
  assert.equal(rel(st) - rel(control), -30);
  assert.ok(st.competitors[foe].knownFacts.includes('sabotaged-by:player:5'));
  assert.match(R.stanceLine(st, foe) ?? '', /your hand caught at their locker on day 5/);
  // their preparation is +50 for that bout: two points of Attack more, on the match sheet's own figure
  const a = AM.autoNextBout(st), b = AM.autoNextBout(control);
  assert.equal(+(a.prep - b.prep).toFixed(2), 2); assert.equal(+(a.foe.atk - b.foe.atk).toFixed(2), 2);
  assert.equal(st.competitors[foe].preparation, control.competitors[foe].preparation, 'the rival\'s own preparation is not changed: the grudge is for that bout');
  assert.equal(AM.autoFightersFor(st, foe, a.stage, a.round).foe.atk, b.foe.atk, 'a challenge or a rehearsal outside that bout reads none');
  // the registrar's warning and the half purse, said with the numbers: 17 if the semi-final is won, 5 if lost
  const warn = st.log.find((e) => e.id === 'sabotage:warned'); assert.ok(warn?.visible);
  assert.match(warn.text, /halved, 17 coins if you win, 5 if you lose/);
  const day6 = st, m = day6.tournament.matches.find((x) => x.day === 6 && (x.a === 'player' || x.b === 'player'));
  assert.equal(day6.day, 6); assert.equal(P.boutPurse(day6, m, true), 17); assert.equal(P.boutPurse(day6, m, false), 5);
  const coins = day6.player.coins, won = run(day6, [W, WON]);
  assert.equal(won.player.coins - coins, 17, 'the purse paid is the halved one');
  assert.equal(S.purseHalved(day6, 6), true); assert.equal(S.purseHalved(day6, 8), false, 'tomorrow\'s bout only');
  // the stage's purses halve as written: 35 / 10, 45 / 15, 80 / 30
  for (const [stage, w, l] of [['semi', 17, 5], ['gate', 17, 5], ['third', 22, 7], ['gateFinal', 22, 7], ['final', 40, 15]]) {
    const fake = { flags: { v2: true }, v2: { sabotage: { eves: { 9: { foe, result: 'seen' } } } } };
    assert.equal(P.boutPurse(fake, { stage, day: 10 }, true), w, `${stage} won`); assert.equal(P.boutPurse(fake, { stage, day: 10 }, false), l, `${stage} lost`);
  }
  assert.ok(name.length > 0);
});

test('the chance of being seen: 15 / 35 / 55 % at the evening\'s security of 50, a point for each point above, Corra\'s watch −15 points, between 5 and 95 % (SF-2, SA-3)', () => {
  const st = run(game(3), POOL4); st.day = 5; st.slot = 'evening'; st.place = 'forecourt'; st.services.forgeWatch = false;
  const at = (shift) => { const s = structuredClone(st); s.flags['pulse:security'] = shift; return s; };
  assert.equal(PU.computePulse(at(0)).security, 50, 'the evening\'s security with no shift is 50');
  const near = (x, y) => assert.ok(Math.abs(x - y) < 1e-9, `${x} vs ${y}`);
  near(S.seenChance(at(0), 5, false), 0.15); near(S.seenChance(at(0), 7, false), 0.35); near(S.seenChance(at(0), 9, false), 0.55);
  near(S.seenChance(at(0), 9, true), 0.40); near(S.seenChance(at(0), 7, true), 0.20); near(S.seenChance(at(0), 5, true), 0.05, 'the floor');
  near(S.seenChance(at(10), 7, false), 0.45, 'ten points of security above: ten points of chance'); near(S.seenChance(at(-10), 7, false), 0.25);
  near(S.seenChance(at(50), 9, false), 0.95, 'the ceiling'); near(S.seenChance(at(-50), 5, false), 0.05);
  // the quay's paid watch (+15 on the pulse) makes the night 15 points riskier, as the decision says (« le guet payé +15 »)
  const watched = structuredClone(at(0)); watched.services.forgeWatch = true; near(S.seenChance(watched, 7, false), 0.50);
});

test('the roll: over many games the cut at the eve of day 5 is seen as the chance says, with and without Corra', () => {
  for (const acc of [false, true]) {
    let seen = 0, exp = 0, varsum = 0, n = 0;
    for (let seed = 1; seed <= 240; seed++) {
      const before = eve5(seed, acc, false), p = S.seenChance(before, 5, acc);
      const after = run(before, [{ type: 'cutStrap', ...(acc ? { accomplice: true } : {}) }]);
      seen += result(after).result === 'seen' ? 1 : 0; exp += p; varsum += p * (1 - p); n++;
    }
    assert.ok(Math.abs(seen - exp) <= 4.5 * Math.sqrt(varsum), `${acc ? 'with' : 'without'} Corra: ${seen} seen of ${n}, expected ${exp.toFixed(1)}`);
    if (acc) assert.ok(exp < 0.1 * n + 1, 'her watch brings it to the floor on the first eve');
  }
});

test('Corra Dunmere keeps the watch for 20 coins, taken whether the night is seen or not; the blade is used up either way', () => {
  for (const want of ['cut', 'seen']) {
    const seed = seedWith(want), before = eve5(seed, false, false);
    // the same night with her: the coins go, the line says her name
    const coins = before.player.coins, alt = run(before, [{ type: 'cutStrap', accomplice: true }]);
    assert.equal(coins - alt.player.coins, 20, 'her price at day 5'); assert.equal(alt.v2.sabotage.tool, undefined);
    assert.equal(alt.v2.sabotage.eves[5].accomplice, true);
    assert.match(alt.log.find((e) => e.id === (alt.v2.sabotage.eves[5].result === 'cut' ? 'sabotage:cut' : 'sabotage:seen')).text, /Corra Dunmere/);
  }
  const before = eve5(1, false, false); before.player.coins = 19;
  assert.equal(opt(before, 'cutStrap', { accomplice: true }).reason, tx('v2.sab.cut.poor', { n: 20 }));
  assert.ok(opt(before, 'cutStrap').ok, 'alone it costs no coin');
  // one try a night
  const done = run(before, [{ type: 'cutStrap' }]);
  assert.equal(done.v2.sabotage.eves[5] !== undefined, true);
});

test('the rich rivals keep their gear in Clerk Odo\'s strongroom from day 7, one game in two; the casing says so and the cut is refused (SF-3)', () => {
  const lock = (seed, id, day = 7) => S.rivalLocks({ seed, day, flags: { v2: true } }, id, day);
  for (const id of ['tobin', 'orla', 'ilse', 'vessa']) for (let seed = 1; seed <= 100; seed++) assert.equal(lock(seed, id), false, `${id}: not rich`);
  for (const id of ['cassius', 'marek', 'rhosk']) {
    assert.equal(lock(1, id, 6), false, 'not before day 7'); assert.equal(lock(1, id, 5), false);
    let n = 0; for (let seed = 1; seed <= 600; seed++) { const l = lock(seed, id); assert.equal(l, lock(seed, id, 9), 'the same for the whole game'); n += l ? 1 : 0; }
    assert.ok(n > 600 * 0.42 && n < 600 * 0.58, `${id}: ${n} of 600`);
  }
  // an eve 7 state: the semi lost on day 6, the third place's rival on the board; the casing and the cut read the lock
  const semi = G.namedState('v2-semi-lost');
  let at7 = run(semi, [W]); // day 7 morning (6 evening -> 7 morning)
  assert.equal(at7.day, 7); at7.place = 'forecourt'; at7.player.coins = 80;
  // the third place's rival is Marek here (a rich rival: a fortune of 80), set on the board
  const third = at7.tournament.matches.find((m) => m.stage && !m.winner && (m.a === 'player' || m.b === 'player'));
  if (third.a === 'player') third.b = 'marek'; else third.a = 'marek';
  const ahead = S.bracketAhead(at7); assert.equal(ahead.day, 8); assert.equal(ahead.foe, 'marek');
  assert.equal(S.eveOf(at7), 7);
  // a state of this very foe with and without a lock, by the seed
  const withSeed = (want) => { for (let seed = 1; seed < 400; seed++) { if (lock(seed, ahead.foe) === want) { const s = structuredClone(at7); s.seed = seed; return s; } } throw new Error('seed'); };
  const rich = RIVALS[ahead.foe].wealth >= 60; assert.ok(rich);
  const open = withSeed(false), shut = withSeed(true);
  const casingOpen = run(open, [{ type: 'caseLockers' }]), logOpen = casingOpen.log.find((e) => e.id === 'sabotage:case').text;
  assert.match(logOpen, /open locker/);
  if (rich) {
    const casingShut = run(shut, [{ type: 'caseLockers' }]);
    assert.match(casingShut.log.find((e) => e.id === 'sabotage:case').text, /strongroom/);
    // the cut is refused with its reason (the blade bought, the lockers cased, the night)
    const night = (st) => { const s = structuredClone(st); s.v2.sabotage.tool = true; s.slot = 'evening'; return s; };
    assert.equal(opt(night(casingShut), 'cutStrap').reason, tx('v2.sab.cut.locked', { name: RIVALS[ahead.foe].name }));
    assert.ok(opt(night(casingOpen), 'cutStrap').ok, 'the open rival can be cut');
  }
});

test('before the bracket is drawn the lockers say so and the night names the man (SA-2): the eve of day 5, in the morning', () => {
  let st = run(game(5), POOL4); st.player.coins = 40;
  st = run(st, [{ type: 'buyTool' }, mv('forecourt')]);   // day 5 morning, the bracket not drawn
  assert.equal(S.bracketAhead(st).foe, null); assert.equal(S.eveOf(st), 5);
  assert.equal(opt(st, 'caseLockers').label, EN['v2.sab.case.label']);
  const cased = run(st, [{ type: 'caseLockers' }]);
  assert.equal(cased.log.find((e) => e.id === 'sabotage:case').text, EN['v2.sab.case.logAny']);
  // that night, the bracket drawn, the rival named
  const night = run(cased, [WON]);
  assert.ok(S.bracketAhead(night).foe); assert.match(opt(night, 'cutStrap').label, new RegExp(RIVALS[S.bracketAhead(night).foe].name));
});

test('the final\'s eve (day 9): the strap cut or the night seen is read by the day-10 bout, its strap and its purse', () => {
  // the semi won on day 6: the final on day 10, its eve day 9; the strap cut then is read by the day-10 bout
  const st = run(G.namedState('v2-semi-won'), [W, W, W, W, W, W, W]);   // from day 6's evening to day 9's morning, seven moments
  assert.equal(st.day, 9); assert.equal(st.slot, 'morning');
  assert.equal(S.eveOf(st), 9); assert.equal(S.bracketAhead(st).stage, 'final');
  st.place = 'forecourt'; st.player.coins = 80;
  const cased = run(st, [{ type: 'caseLockers' }, W]);   // morning cased, afternoon waited
  const held = structuredClone(cased); held.v2.sabotage.tool = true;
  // the final's rival, if open, can be cut; the result is read by the day-10 bout and by its purse
  const foe = S.bracketAhead(held).foe;
  assert.ok(foe, 'the final\'s rival is on the board');
  {
    held.seed = (() => { for (let seed = 1; seed < 400; seed++) if (!S.rivalLocks({ seed, day: 9, flags: { v2: true } }, foe)) return seed; })();
    const r = G.advance(held, { type: 'cutStrap' }); assert.ok(r.ok, r.reason); {
      const res = r.state.v2.sabotage.eves[9];
      assert.ok(res.result === 'cut' || res.result === 'seen');
      const d10 = r.state; assert.equal(d10.day, 10); const m = d10.tournament.matches.find((x) => x.day === 10 && (x.a === 'player' || x.b === 'player'));
      assert.ok(m, 'the final is on the board'); assert.equal(S.foeCut(d10, 10, foe), res.result === 'cut');
      assert.equal(P.boutPurse(d10, m, true), res.result === 'seen' ? 40 : 80);
      assert.equal(AM.autoBoutOf(d10).foe.taken ?? 1, res.result === 'cut' ? 1.15 : 1);
    }
  }
});

test('a game that never sabotages keeps its state: nothing in `v2.sabotage`, the options listed never move it, the same actions the same fingerprint', () => {
  const play = (seed) => { let st = game(seed); for (const a of [...POOL4, W, W, WON, W]) { st = run(st, [a]); G.actions(st); } return st; };
  const a = play(11), b = play(11);
  assert.equal(a.v2.sabotage, undefined); assert.equal('sabotage' in a.v2, false);
  assert.equal(G.hash(a), G.hash(b));
  const hb = G.hash(a); G.actions(a); assert.equal(G.hash(a), hb, 'listing the lines changes nothing');
  // a sabotage changes the fingerprint, and the same sabotage the same one
  const x = eve5(4), y = eve5(4), z = eve5(4, true);
  assert.equal(G.hash(x), G.hash(y)); assert.notEqual(G.hash(x), G.hash(z));
  // an older save (without the field) plays on as before; a save of a sabotaged game carries it through a round trip
  const old = JSON.parse(JSON.stringify(a)); assert.equal(old.v2.sabotage, undefined);
  const saved = JSON.parse(JSON.stringify(x)); assert.deepEqual(saved.v2.sabotage, x.v2.sabotage); assert.equal(G.hash(saved), G.hash(x));
  // today's game (v2=0) offers none of it
  const classic = G.newGame(3, 'Ren'); classic.day = 5; classic.slot = 'evening'; classic.place = 'forecourt';
  assert.ok(!G.actions(classic).some((o) => ['caseLockers', 'buyTool', 'cutStrap'].includes(o.action.type)));
});

test('the words: every line in both languages with the same slots; the guide and the hint speak the game\'s own numbers; the list and the sheet wire it', () => {
  const keys = Object.keys(EN).filter((k) => /^(v2\.sab\.|v2\.memory\.sabotaged|v2\.sheet\.foe(Strap|Grudge)|tut\.hint\.sabotage|tut\.ch\.events\.sabotage)/.test(k));
  assert.equal(keys.length, 35, 'the sabotage\'s texts: ' + keys.length);
  const slots = (t) => [...t.matchAll(/\{(\w+)(?:\|\w+)?\}/g)].map((m) => m[1]).sort().join(',');
  for (const k of keys) { assert.ok(FR_TEXTS[k], `${k} in French`); assert.equal(slots(FR_TEXTS[k]), slots(EN[k]), `${k}: the same slots`); }
  for (const k of ['tut.hint.sabotage.title', 'tut.hint.sabotage.body', 'tut.ch.events.sabotage']) { assert.doesNotMatch(EN[k], /\d/, k); assert.doesNotMatch(FR_TEXTS[k], /\d/, k); }
  // the guide's chapter says the eves, the chances, the prices and the grudge from the data
  const events = TU.CHAPTERS.find((c) => c.id === 'events'), text = TU.chapterText(game(2), events);
  assert.match(text, /days 5, 7 and 9/); assert.match(text, /seen 15 % of the time the eve of day 5, 35 % that of day 7, 55 % that of day 9/);
  assert.match(text, /the rival takes 15 % more damage/); assert.match(text, /8 coins/); assert.match(text, /20 coins, 15 points less chance/);
  assert.match(text, /falls by 30/); assert.match(text, /trained 2 sessions more/); assert.match(text, /15 % more from day 6, 30 % from day 9/);
  assert.match(TU.hintChapter('sabotage'), /events/); assert.ok(TU.CHAPTERS.some((c) => c.id === TU.hintChapter('sabotage')));
  // the list's group and hint, the match sheet's lines, in the source of the pages
  const town = src('src/ui/townUi.ts');
  assert.match(town, /this\.hint\(isSabotage\(o\.action\.type\) \? 'sabotage' : 'steal'\)/);
  assert.match(town, /tx\('v2\.sheet\.foeStrap', \{ name: r\.name, n: forcePct\(\) \}\)/); assert.match(town, /tx\('v2\.sheet\.foeGrudge', \{ name: r\.name, n: num\(grudgeAttack\(\)\) \}\)/);
  assert.match(src('src/combat/autoMatch.ts'), /foe\.taken = \(foe\.taken \?\? 1\) \* SAB\.force/);
  assert.match(src('src/simulation/v2rivals.ts'), /v2\.memory\.sabotaged/);
});
