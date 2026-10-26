// The version 2's ten days and its story (lot V6; the operator's decision AV-15 « Structure, dialogues et cinématiques », journal Passe V6):
// the project contract's planning lock (§ 4: ten days, from the arrival to the final), the pool's three rounds, the cut, the semi-finals and
// the Gate bouts, the major match, the final and the crown; the rivals' words by the act, Orla's recruitment, the live cutscenes. The default
// game keeps its three days.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const C = await load('/src/tournament/v2calendar.ts');
const S = await load('/src/narrative/v2story.ts');
const D = await load('/src/narrative/dialogue.ts');
const L = await load('/src/tournament/lab.ts');
const VG = await load('/src/simulation/v2gear.ts');
const PZ = await load('/src/world/Plazas.ts');
const VP = await load('/src/simulation/v2places.ts');
const P = await load('/src/narrative/people.ts');

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };

test('ten days for a version 2 game, three for today\'s; a save of day 7 reads back only as a version 2 game', () => {
  assert.equal(C.daysOf(G.newGame(1, 'A')), 3); assert.equal(C.daysOf(v2()), 10);
  assert.ok(G.namedState('slice-end').over, 'today\'s slice ends after day 3');
  const WIN = { winner: 'player', playerHp: 900, playerMaxHp: 2200, opponentHp: 0, opponentMaxHp: 3000, finisher: 'heavy' };
  let s = v2('day1-morning');
  for (let i = 0; i < 9; i++) s = act(s, G.advance(s, { type: 'wait' }).ok ? { type: 'wait' } : { type: 'fight', outcome: WIN });
  assert.equal(s.day, 4); assert.ok(!s.over);
  const back = G.deserialize(G.serialize(s)); assert.equal(G.hash(back), G.hash(s));
  const forged = structuredClone(G.namedState('day2-morning')); forged.day = 4;
  assert.throws(() => G.deserialize(G.serialize(forged)), /damaged/);
  // today's game keeps its two rounds, no stage
  assert.deepEqual(G.newGame(1842, 'Ren').tournament.matches.map((m) => m.day), [2, 2, 2, 2, 3, 3, 3, 3]);
  assert.ok(G.newGame(1842, 'Ren').tournament.matches.every((m) => m.stage === undefined));
});

test('the pool: three rounds (days 2, 4, 5), every competitor once a round, every pair at most once', () => {
  const ms = v2().tournament.matches, ids = ['player', 'marek', 'vessa', 'orla', 'cassius', 'ilse', 'tobin', 'rhosk'];
  assert.deepEqual([...new Set(ms.map((m) => m.day))], [2, 4, 5]);
  for (const day of [2, 4, 5]) assert.deepEqual(ms.filter((m) => m.day === day).flatMap((m) => [m.a, m.b]).sort(), [...ids].sort());
  const pairs = ms.map((m) => [m.a, m.b].sort().join('-')); assert.equal(new Set(pairs).size, pairs.length);
  // a named state played before the flag keeps its fought bout
  const won = v2('day2-dusk-won'); assert.equal(won.tournament.matches.find((m) => m.day === 2 && m.a === 'player').winner, 'player');
});

test('the bracket over whole games: the cut takes the pool\'s best four, the semi-finals\' winners meet in the final, the champion is its winner', () => {
  for (const seed of [1, 2, 3, 7, 11]) for (const pol of ['diligent', 'idle']) {
    const policy = L.POLICIES?.[pol] ?? L[pol];
    const run = L.autoplay(seed, policy, 'Ren', 400, 'v2'), s = run.state;
    assert.ok(s.over && s.day === 10 && s.slot === 'evening', `seed ${seed} ${pol} over on the tenth evening`);
    const semis = C.stageMatches(s, 'semi'), gates = C.stageMatches(s, 'gate'), fin = C.stageMatches(s, 'final')[0];
    assert.equal(semis.length, 2); assert.equal(gates.length, 2);
    for (const m of [...semis, ...gates]) assert.equal(m.day, 6);
    const top4 = [...semis.flatMap((m) => [m.a, m.b])], rest = gates.flatMap((m) => [m.a, m.b]);
    assert.equal(new Set([...top4, ...rest]).size, 8);
    // the cut: the standings at the end of day 5 (points earned after it are the bracket's)
    const pts = {}; for (const m of s.tournament.matches.filter((x) => x.day <= 5)) { const l = m.winner === m.a ? m.b : m.a; pts[m.winner] = (pts[m.winner] ?? 0) + 3; pts[l] = (pts[l] ?? 0) + (m.close ? 1 : 0); }
    assert.ok(Math.min(...top4.map((id) => pts[id])) >= Math.max(...rest.map((id) => pts[id])), `seed ${seed}: the four best of the pool go on`);
    assert.deepEqual([fin.a, fin.b].sort(), semis.map((m) => m.winner).sort());
    assert.equal(fin.day, 10); assert.equal(s.flags.champion, fin.winner);
    const third = C.stageMatches(s, 'third')[0]; assert.deepEqual([third.a, third.b].sort(), semis.map((m) => (m.winner === m.a ? m.b : m.a)).sort());
    const rank = C.v2Ranking(s); assert.equal(rank.length, 8); assert.equal(rank[0], fin.winner);
    // the heralds cry each day from the second to the tenth
    for (let d = 2; d <= 10; d++) assert.ok(s.log.some((e) => e.id === `v2:day:${d}` && e.day === d), `the heralds of day ${d}`);
    assert.ok(s.log.some((e) => e.id === 'cut:in' || e.id === 'cut:out'));
  }
});

test('Orla\'s recruitment: not before day 7, only once she is a friend; at your side she gives one AP at the start of your bouts', () => {
  let s = v2(); s.place = 'training'; s.facts.push('orla-recruitable');
  assert.match(G.advance(s, { type: 'recruit', who: 'orla' }).reason, /day 7/);
  s.day = 7; const mods = VG.v2Mods(s).ap;
  s = act(s, { type: 'recruit', who: 'orla' });
  assert.ok(s.facts.includes('orla-recruited')); assert.equal(VG.v2Mods(s).ap, mods + 1); assert.equal(s.competitors.orla.teamId, 'player');
  assert.match(G.advance(s, { type: 'recruit', who: 'orla' }).reason, /already/);
  const cold = v2(); cold.place = 'training'; cold.day = 8; assert.ok(!G.actions(cold).some((o) => o.action.type === 'recruit'));
  // the default game: no recruit, no ally
  const d = G.namedState('day1-morning'); d.place = 'forecourt'; d.facts.push('orla-recruitable', 'orla-recruited'); assert.equal(G.advance(d, { type: 'recruit', who: 'orla' }).ok, false);
});

test('the rivals speak by the act: their words change after the cut; today\'s game keeps today\'s words', () => {
  const early = v2(), late = v2(); late.day = 7;
  assert.notDeepEqual(D.linesOf(early, 'vessa'), D.linesOf(late, 'vessa'));
  assert.equal(S.v2Lines(G.namedState('day1-morning'), 'vessa'), null);
  for (const who of ['marek', 'vessa', 'cassius', 'orla']) { const d = G.namedState('day3-afternoon'); assert.ok(D.linesOf(d, who).every((l) => !/semi-final|final|teams are coming/.test(l)), who); }
});

test('the cutscenes: each once, at its place and moment; its speakers and walkers stand on its square; none in today\'s game', () => {
  const fc = act(v2(), { type: 'move', to: 'forecourt' });
  assert.equal(S.pendingScene(fc)?.id, 'arrival');
  const seen = act(fc, { type: 'watched', scene: 'arrival' });
  assert.equal(S.pendingScene(seen), null);
  assert.equal(G.advance(fc, { type: 'watched', scene: 'nope' }).ok, false);
  assert.equal(S.pendingScene(act(G.namedState('day1-morning'), { type: 'move', to: 'forecourt' })), null);
  for (const c of Object.values(S.CUTSCENES)) {
    const spots = PZ.PLAZA_SPOTS[VP.PLAZA_OF[c.place]];
    for (const id of c.cast) assert.ok(spots[id], `${c.id}: ${id} has a spot`);
    for (const st of c.steps) {
      if (st.say) { assert.ok(st.say === 'player' || c.cast.includes(st.say), `${c.id}: ${st.say} is on the square`); assert.ok(st.line().length > 10); }
      if (st.walk) assert.ok(c.cast.includes(st.walk));
      if (st.cam) assert.ok(Math.abs(st.cam[0]) <= 11 && st.cam[1] <= 3 && st.cam[1] >= -16);
    }
    assert.ok(P.PEOPLE[c.cast[0]], `${c.id}: a person of the game`);
  }
  assert.ok(Object.keys(S.CUTSCENES).length >= 5);
});
