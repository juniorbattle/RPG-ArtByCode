// The version 2's injuries (the operator's decisions V2B1-1 « A. K.O. par un coup puissant » and V2B1-2 « Garder », journal Passe V2B1): in a
// version 2 game, a bout wounds the player only when a heavy blow knocks him down; a win never wounds, however close (GAMEPLAY § 11: the failure
// opens answers; § 14, locks 5 and 9). What a wound costs and its three answers stay as they were. The default game keeps its rule to the byte:
// a heavy knock-down, or a win under 15 % of the player's health. The oracles are written from the decisions, not from the code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const L = await load('/src/tournament/lab.ts');
const VG = await load('/src/simulation/v2gear.ts');
const { tx } = await load('/src/narrative/text/index.ts');

const MAX = 2200;
const won = (ratio, finisher = 'heavy') => ({ winner: 'player', playerHp: ratio * MAX, playerMaxHp: MAX, opponentHp: 0, opponentMaxHp: 6000, finisher });
const lost = (finisher, foeRatio = 0.5) => ({ winner: 'opponent', playerHp: 0, playerMaxHp: MAX, opponentHp: foeRatio * 6000, opponentMaxHp: 6000, finisher });
const fight = (st, outcome) => { const r = G.advance(st, { type: 'fight', outcome }); assert.ok(r.ok, r.reason); return r; };
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const v2Bout = (injury = 0) => { const s = structuredClone(G.namedState('v2-day2-afternoon')); s.player.injury = injury; return s; };
/** today's game on its first bout's afternoon; `dynamic`: under the rules of the « tour par tour dynamique », which keep today's injuries */
const todayBout = (dynamic = false) => { const s = act(G.namedState('day2-morning'), { type: 'wait' }); if (dynamic) s.flags.combat = 'dynamic'; return s; };
const injured = (r) => r.events.filter((e) => e.id === 'player-injured');

test('a version 2 win never wounds, however close, whatever the blow that ended it', () => {
  for (const ratio of [1 / MAX, 0.01, 0.049, 0.05, 0.1, 0.1499, 0.15, 0.5, 1]) for (const finisher of ['heavy', 'light', 'skill', 'tech', null]) {
    const r = fight(v2Bout(), won(ratio, finisher));
    assert.equal(r.state.player.injury, 0, `win at ${ratio}, ${finisher}`);
    assert.equal(injured(r).length, 0, `no word of a wound: win at ${ratio}, ${finisher}`);
  }
  // nor does it add to a wound already there, or heal it
  assert.equal(fight(v2Bout(1), won(0.01)).state.player.injury, 1);
});

test('a version 2 defeat wounds only when a heavy blow knocks the player down, how close the bout was does not count', () => {
  for (const foe of [0.01, 0.25, 0.5, 1]) {
    const r = fight(v2Bout(), lost('heavy', foe));
    assert.equal(r.state.player.injury, 1, `heavy, the opponent at ${foe}`);
    assert.deepEqual(injured(r).map((e) => [e.kind, e.visible, e.text]), [['consequence', true, tx('duel.injured')]]);
    assert.match(injured(r)[0].cause, /^match:/, 'the wound names the bout that caused it');
    for (const finisher of ['light', 'skill', 'tech', null]) {
      const q = fight(v2Bout(), lost(finisher, foe));
      assert.equal(q.state.player.injury, 0, `${finisher}, the opponent at ${foe}`);
      assert.equal(injured(q).length, 0, `no word of a wound: ${finisher}, the opponent at ${foe}`);
    }
  }
});

test('the levels stay two at most in a version 2 game', () => {
  assert.equal(fight(v2Bout(1), lost('heavy')).state.player.injury, 2);
  assert.equal(fight(v2Bout(2), lost('heavy')).state.player.injury, 2);
});

test('the default game keeps its rule to the boundary, today\'s arena and the « tour par tour dynamique » alike', () => {
  for (const dynamic of [false, true]) {
    const at = (o) => fight(todayBout(dynamic), o);
    assert.equal(at(won(0.1499)).state.player.injury, 1, 'a win under 15 % wounds');
    assert.equal(at(won(0.1499)).events.filter((e) => e.id === 'player-injured').length, 1);
    assert.equal(at(won(0.15)).state.player.injury, 0, 'at 15 % exactly it does not');
    assert.equal(at(won(0.5)).state.player.injury, 0);
    assert.equal(at(lost('heavy')).state.player.injury, 1);
    assert.equal(at(lost('light')).state.player.injury, 0);
    assert.equal(at(lost('tech')).state.player.injury, 0);
  }
});

test('V2B1-2 « Garder »: a wound still takes 20 % of the health a level, and its three answers are as they were', () => {
  const hp = (inj) => { const s = v2Bout(inj); return VG.v2Mods(s).hp; };
  assert.equal(+(hp(1) / hp(0)).toFixed(4), 0.8); assert.equal(+(hp(2) / hp(0)).toFixed(4), 0.6);
  // a wounded player goes into the bout with less health
  const fit = L.botOutcome(v2Bout(), 0.6), hurt = L.botOutcome(v2Bout(1), 0.6);
  assert.equal(+(hurt.playerMaxHp / fit.playerMaxHp).toFixed(3), 0.8);
  // rest: one slot, one level
  const r0 = structuredClone(G.namedState('v2-day1-morning')); r0.player.injury = 2;
  const r1 = act(r0, { type: 'rest' });
  assert.equal(r1.player.injury, 1); assert.equal(r1.slot, 'afternoon');
  // Sister Anwen: one slot, 8 coins, every level
  const h0 = structuredClone(G.namedState('v2-forecourt-morning')); h0.player.injury = 2; h0.player.coins = 30; delete h0.flags['free-care'];
  const h1 = act(h0, { type: 'heal' });
  assert.equal(h1.player.injury, 0); assert.equal(h1.player.coins, 22); assert.equal(h1.slot, 'afternoon');
  // Mara's salve: coins, no slot, one level
  const s0 = structuredClone(G.namedState('v2-day1-morning')); s0.player.injury = 2; s0.player.coins = 99;
  const s1 = act(s0, { type: 'shopBuy', shop: 'mara', item: 'salve' });
  assert.equal(s1.player.injury, 1); assert.ok(s1.player.coins < 99); assert.equal(s1.slot, 'morning');
});

test('whole version 2 games: every wound follows a heavy knock-down and each one wounds, close wins happen and leave the player whole', () => {
  const S = Array.from({ length: 12 }, (_, i) => i + 1);
  const count = { closeWins: 0, otherDefeats: 0 };
  let kos = 0, wounds = 0;
  for (const policy of [L.POLICIES.diligent, L.POLICIES.idle]) for (const seed of S) {
    let st = G.makeV2(G.newGame(seed, 'Ren'));
    for (let i = 0; i < 400 && !st.over; i++) {
      const a = policy.choose(st), r = G.advance(st, a);
      assert.ok(r.ok, r.reason);
      const w = injured(r).length;
      if (a.type === 'fight') {
        const o = a.outcome, ko = o.winner === 'opponent' && o.finisher === 'heavy';
        assert.equal(w, ko ? 1 : 0, `seed ${seed}, day ${st.day}: ${JSON.stringify(o)}`);
        kos += ko ? 1 : 0;
        if (o.winner === 'player' && o.playerHp / o.playerMaxHp < 0.15) count.closeWins++;
        if (o.winner === 'opponent' && !ko) count.otherDefeats++;
      } else assert.equal(w, 0, 'only a bout wounds');
      wounds += w; st = r.state;
    }
    assert.ok(st.over);
  }
  // the games reach each case the rule tells apart
  assert.equal(wounds, kos); assert.ok(kos >= 10, `${kos} knock-downs`);
  assert.ok(count.closeWins >= 5, `${count.closeWins} close wins`); assert.ok(count.otherDefeats >= 10, `${count.otherDefeats} other defeats`);
});

test('the numbers of the decision: seeds 1..50 give Passe V2B1\'s wounds a game, and a player who treats his wounds wins what he won', () => {
  const S = Array.from({ length: 50 }, (_, i) => i + 1);
  const idle = L.labReport(S, L.POLICIES.idle, 'v2'), prepared = L.labReport(S, L.POLICIES.diligent, 'v2');
  // the rule unchanged; its numbers measured again once the heavy attack became a skill and the charge times and the charged blows' power were trimmed
  // (journal Passe CH1; Passe V2B1: 0.80 and 1.62 wounds a game, 60.4 % of the bouts, crowned 4 %, the cut 88 %)
  // (journal Passe DB3, the duel of 3 to 4 minutes recalibrated to six bouts in ten: 0.76 and 1.74 wounds a game before, 59.2 % of the bouts, crowned 2 %,
  // the cut 88 %)
  // (journal Passe DB9, the fighters' stats recalibrated to six bouts in ten: 0.54 and 1.68 wounds a game before, 60.4 % of the bouts, crowned 8 %, the cut 92 %)
  // (journal Passe DB10, the rivals at the DB7 sheet's strength, the operator's « The DB7 sheet's curve »: 0.56 and 1.4 before, 59.6 % of the bouts, the cut 92 %;
  // the lab's prepared player never drills his skills, so it loses and is knocked down more)
  // (journal Passe ECO2, the purses by stage: 1.00 before; a bracket bout's purse buys the mail shirt sooner, one wound fewer in fifty games, its wins unchanged)
  // (journal Passe DB13, the operator's DB11 sheet: the pool easier, the bracket and the final on the DB7 sheet's curve: 0.98 and 1.64 before, 42.0 % of the bouts, the cut 74 %)
  // (lot 2 of the duel played by the computer, journal Passe LC3, every bout the computer's: 1.02 and 1.34 before, 55.2 % of the bouts, the cut 100 %; the lab's
  // prepared player buys a little and never drills his skills: he reaches the bracket's harder bouts, and its heavy blows, more than the idle one) LC3_PINS
  // (lot 1 of the second redesign, journal Passe SL1, the same rules for every fighter and the heavy blow a base attack with its cooldown for all: 1.52 and 1.4
  // before, 35.2 % of the bouts, the cut 60 %)
  // (lot 2 of the second redesign, journal Passe SL3, the rhythm ×3 and the break of RY-3, the race refitted: 0.56 and 0.56 before, 44.6 % of the bouts, the cut 78 %)
  // (lot 1 of the model « La Brute », journal Passe BL1: 0.46 and 0.7 before, 69.2 % of the bouts, the cut 98 %; the brawlers' heavy blow as soon as it is ready
  // and a heavy blow on an opening knock the lab's players down more often, the race fitted on the planner)
  // (the clash and the gauge of the operator's BL1-8 and BL1-9, the race fitted again, journal Passe BL1: 0.88 and 1.42 before, 52.4 % of the bouts, the cut 90 %)
  // (the blows' weights of journal Passe BE1, the heavy blow ×1.5 and the race fitted again: 0.96 and 1.18 before, 40.4 % of the bouts, the cut 70 %; a heavy blow
  // that knocks down more often wounds more often)
  assert.equal(+prepared.rates.playerInjured.toFixed(2), 1.44); assert.equal(+idle.rates.playerInjured.toFixed(2), 1.34);
  // (lot L4, journal Passe EVL7: 0.592 since Rhosk takes the training sand on the free day before a bracket bout, which the prepared player does not answer: seed 27
  // loses the major match it won; 0.596 before; 0.604 with the duel of journal Passe DB3)
  assert.equal(+prepared.rates.playerWins.toFixed(3), 0.404); assert.equal(prepared.v2.champion, 0); assert.equal(prepared.v2.madeCut, 0.7);
  // less than half as often until journal Passe DB9; at the sheet's strength the lab's prepared player, without his skills' levels, still less often than the idle one;
  // since lot 2 of the duel played by the computer (journal Passe LC3) the player who prepares the duel is the reference of AC-14 (the planner, Hilde's look, his kit
  // drilled): wounded far less often than the idle one (0.56 a game), the lab's diligent player no longer; since lot 1 of the second redesign (journal Passe SL1)
  // 0.32 a game against the idle one's 0.56: less often, no longer less than half as often (every rival's heavy blow under the same rule as Ren's)
  const reference = L.labReport(S, L.POLICIES.reference, 'v2');
  // (0.36 against 0.7 since lot 2, journal Passe SL3; 0.36 against 1.42 under the model « La Brute », journal Passe BL1; 0.3 against 1.18 with BL1-8 and BL1-9;
  // 0.38 against 1.34 with the blows' weights of journal Passe BE1)
  assert.equal(+reference.rates.playerInjured.toFixed(2), 0.38);
  assert.ok(reference.rates.playerInjured < idle.rates.playerInjured, 'the player who prepares the duel is wounded less often than the idle one');
  assert.ok(prepared.eventCounts['healer-offer'] > 0 && idle.eventCounts['healer-offer'] > 0, 'the healer still writes to the wounded');
});
