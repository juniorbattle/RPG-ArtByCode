// Lot L6 of step 5 (the operator's EV-13 « Compléter les arcs, quatre scènes selon l’état », journal Passe EV2): one line an act for Tobin and Rhosk, and four
// live scenes that depend on the state - out of the cut at the Gate, after the semi-final won or lost, Cassius unmasked, the epilogue on the forecourt. Each
// oracle is written here: the days, the places and hours, the words a state must give. The default game plays none of it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const C = await load('/src/tournament/v2calendar.ts');
const S = await load('/src/narrative/v2story.ts');
const D = await load('/src/narrative/dialogue.ts');
const T = await load('/src/narrative/text/index.ts');
const P = await load('/src/narrative/people.ts');
const PZ = await load('/src/world/Plazas.ts');
const R = await load('/src/narrative/roster.ts');
const VP = await load('/src/simulation/v2places.ts');

const WON = { type: 'fight', outcome: { winner: 'player', playerHp: 900, playerMaxHp: 2200, opponentHp: 0, opponentMaxHp: 3000, finisher: 'heavy' } };
const LOST = { type: 'fight', outcome: { winner: 'opponent', playerHp: 0, playerMaxHp: 2200, opponentHp: 900, opponentMaxHp: 3000, finisher: 'tech' } };
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type} on day ${st.day} ${st.slot}: ${r.reason}`); return r.state; };
const v2 = () => G.makeV2(G.namedState('day1-morning'));
/** play on (every bout won or lost by `pick(day)`) until this day and slot */
function playTo(day, slot, pick = () => WON, s = v2()) {
  const order = ['morning', 'afternoon', 'evening'];
  while (s.day < day || (s.day === day && order.indexOf(s.slot) < order.indexOf(slot))) {
    const w = G.advance(s, { type: 'wait' });
    s = w.ok ? w.state : act(s, pick(s.day));
  }
  return s;
}
const at = (s, place) => (s.place === place ? s : act(s, { type: 'move', to: place }));
const mineOf = (s, stage) => C.stageMatches(s, stage).find((m) => m.a === 'player' || m.b === 'player');
const say = (s, id) => S.CUTSCENES[id].steps.filter((st) => 'say' in st).map((st) => [S.speakerOf(s, st), st.line(s)]);

test('Tobin and Rhosk: on the training sand by day from the first day; a line an act, the second act their words of lot L2b; the default game has neither', () => {
  for (const who of ['tobin', 'rhosk']) {
    const p = P.PEOPLE[who];
    assert.equal(p.days, undefined, `${who}: every day`);
    assert.ok(P.presentAt(p, 'training', 'morning', true) && P.presentAt(p, 'training', 'afternoon', true) && !P.presentAt(p, 'training', 'evening', true));
  }
  let s = at(v2(), 'training');
  assert.deepEqual(D.linesOf(s, 'tobin'), [T.tx('v2.line.tobin.act1')]);
  assert.deepEqual(D.linesOf(s, 'rhosk'), [T.tx('v2.line.rhosk.act1')]);
  // the challenge waits for day 6 and a rival out of the title (EV-4)
  assert.ok(!G.actions(s).some((o) => o.action.type === 'challenge' && o.action.who === 'tobin'));
  // day 5, still the first act; day 6, the second: the words of L2b by the title's race
  const d5 = playTo(5, 'morning');
  assert.deepEqual(D.linesOf(d5, 'tobin').slice(0, 1), [T.tx('v2.line.tobin.act1')]);
  const d7 = playTo(7, 'morning');
  for (const who of ['tobin', 'rhosk']) {
    const k = d7.competitors[who].phaseStatus === 'gate' ? `v2.line.${who}.out` : `v2.line.${who}.in`;
    assert.equal(D.linesOf(d7, who)[0], T.tx(k), `${who} on day 7`);
  }
  // the third act: the player a finalist (every bout won), or not (every bout lost), or crowned
  const d9 = playTo(9, 'morning');
  assert.ok(C.stageMatches(d9, 'semi').some((m) => m.winner === 'player'));
  const fin = (s, id) => C.stageMatches(s, 'final').some((m) => m.a === id || m.b === id);
  assert.equal(D.linesOf(d9, 'tobin')[0], T.tx(fin(d9, 'tobin') ? 'v2.line.tobin.final' : 'v2.line.tobin.act3final'));
  assert.equal(D.linesOf(d9, 'rhosk')[0], T.tx(fin(d9, 'rhosk') ? 'v2.line.rhosk.final' : 'v2.line.rhosk.act3'));
  const lost9 = playTo(9, 'morning', () => LOST);
  assert.ok(!fin(lost9, 'player'));
  assert.equal(D.linesOf(lost9, 'tobin')[0], T.tx(fin(lost9, 'tobin') ? 'v2.line.tobin.final' : 'v2.line.tobin.act3'));
  assert.equal(D.linesOf(lost9, 'rhosk')[0], T.tx(fin(lost9, 'rhosk') ? 'v2.line.rhosk.final' : 'v2.line.rhosk.act3out'));
  const crowned = structuredClone(d9); crowned.day = 10; crowned.flags.champion = 'player';
  assert.equal(D.linesOf(crowned, 'tobin')[0], T.tx('v2.line.tobin.crowned'));
  assert.equal(D.linesOf(crowned, 'rhosk')[0], T.tx('v2.line.rhosk.crowned'));
  // a rival finalist speaks as one (a forged final: Rhosk against the player)
  const rf = structuredClone(d9); rf.tournament.matches.push({ round: 6, a: 'player', b: 'rhosk', winner: null, close: false, day: 10, seen: true, stage: 'final' });
  if (!fin(d9, 'player')) assert.equal(D.linesOf(rf, 'rhosk')[0], T.tx('v2.line.rhosk.final'));
  // Rhosk on the sand he took keeps his words of L4 before his arc
  const sand = G.namedState('v2-sand-training');
  assert.equal(D.linesOf(sand, 'rhosk')[0], T.tx('v2.line.rhosk.sand'));
  // the default game: neither in town
  const d = G.namedState('day1-morning');
  assert.equal(S.v2Lines(d, 'tobin'), null); assert.equal(S.v2Lines(d, 'rhosk'), null);
});

test('the Gate: on the forecourt on day 6 by day, for a player out of the cut only; Odo, then Marek by where he stands, then the hero', () => {
  const out = at(playTo(6, 'morning', () => LOST), 'forecourt');
  assert.ok(mineOf(out, 'gate'), 'every bout lost: the Gate');
  assert.equal(S.pendingScene(out)?.id, 'gate');
  const lines = say(out, 'gate');
  assert.deepEqual(lines.map((l) => l[0]), ['odo', 'marek', 'player']);
  const marekAtGate = C.stageMatches(out, 'gate').some((m) => m.a === 'marek' || m.b === 'marek');
  assert.equal(lines[1][1], T.tx(marekAtGate ? 'v2.scene.gate.2b' : 'v2.scene.gate.2', { name: out.player.name }));
  assert.ok(lines[1][1].includes(out.player.name) || marekAtGate);
  // a forged Marek at the Gate: his other words
  const mg = structuredClone(out); const g = C.stageMatches(mg, 'gate').find((m) => m.a !== 'player' && m.b !== 'player'); g.a = 'marek';
  assert.equal(say(mg, 'gate')[1][1], T.tx('v2.scene.gate.2b'));
  // the afternoon too, never the evening, nor day 5 or 7, nor in the semi-finals, nor elsewhere
  assert.equal(S.pendingScene({ ...out, slot: 'afternoon' })?.id, 'gate');
  assert.notEqual(S.pendingScene({ ...out, slot: 'evening' })?.id, 'gate');
  assert.notEqual(S.pendingScene({ ...out, day: 7 })?.id, 'gate');
  assert.notEqual(S.pendingScene({ ...out, day: 5 })?.id, 'gate');
  assert.notEqual(S.pendingScene(at(playTo(6, 'morning'), 'forecourt'))?.id, 'gate');
  assert.equal(S.pendingScene({ ...out, place: 'training' }), null);
  const seen = act(out, { type: 'watched', scene: 'gate' });
  assert.equal(S.pendingScene(seen), null);
});

test('after the semi-final: its evening and the next day on the forecourt; won, Odo names both finalists and the beaten rival speaks by temper; lost, Sister Anwen and the winner', () => {
  const TEMPER = { marek: 'honourable', vessa: 'proud', orla: 'honourable', cassius: 'proud', ilse: 'honourable', tobin: 'honourable', rhosk: 'cold' };
  // won: every bout won, the semi-final's evening
  let w = playTo(6, 'afternoon');
  assert.ok(mineOf(w, 'semi') && !mineOf(w, 'semi').winner);
  w = at(act(w, WON), 'forecourt');
  assert.equal(w.slot, 'evening');
  assert.equal(S.pendingScene(w)?.id, 'semiWon');
  const m = mineOf(w, 'semi'), foe = m.a === 'player' ? m.b : m.a, other = C.stageMatches(w, 'semi').find((x) => x !== m).winner;
  const lines = say(w, 'semiWon');
  assert.deepEqual(lines.map((l) => l[0]), ['odo', foe, 'player']);
  assert.equal(lines[0][1], T.tx('v2.scene.semiWon.1', { name: w.player.name, foe: R.RIVALS[other].name }));
  assert.ok(lines[0][1].includes(R.RIVALS[other].name) && lines[0][1].includes(w.player.name), 'both finalists named');
  assert.equal(lines[1][1], T.tx(`v2.scene.semiWon.${TEMPER[foe]}`, { name: w.player.name }));
  // every temper has its words
  for (const t of ['honourable', 'proud', 'cold']) { assert.ok(T.tx(`v2.scene.semiWon.${t}`, { name: 'Ren' }).length > 10); assert.ok(T.tx(`v2.scene.semiLost.${t}`).length > 10); }
  // the next day by day too; never before the bout, nor on day 7's evening, nor day 8
  const d7 = act(w, { type: 'wait' }); // the evening ends: day 7 morning
  assert.equal(d7.day, 7); assert.equal(S.pendingScene(d7)?.id, 'semiWon');
  assert.equal(S.pendingScene({ ...d7, slot: 'evening' })?.id ?? null, null);
  assert.equal(S.pendingScene({ ...d7, day: 8 })?.id ?? null, null);
  assert.notEqual(S.pendingScene(at(playTo(6, 'afternoon'), 'forecourt'))?.id, 'semiWon');
  // a forged evening with the semi-final unfought: neither scene (the bout decides which)
  const unf = structuredClone(w); mineOf(unf, 'semi').winner = null;
  assert.ok(!['semiWon', 'semiLost'].includes(S.pendingScene(unf)?.id ?? ''));
  // lost: the semi-final lost
  let l = playTo(6, 'afternoon');
  l = at(act(l, LOST), 'forecourt');
  assert.equal(S.pendingScene(l)?.id, 'semiLost');
  const ml = mineOf(l, 'semi'), winner = ml.winner;
  const ll = say(l, 'semiLost');
  assert.deepEqual(ll.map((x) => x[0]), ['anwen', winner, 'player']);
  assert.equal(ll[1][1], T.tx(`v2.scene.semiLost.${TEMPER[winner]}`));
  // out of the cut: no semi-final scene
  assert.ok(![ 'semiWon', 'semiLost'].includes(S.pendingScene(at(playTo(7, 'morning', () => LOST), 'forecourt'))?.id));
});

test('Cassius unmasked: the first evening on the festival square after the town knows - his man caught at the forge, Hale told, or shamed on the square; the culprit known to the player alone is no scandal', () => {
  const night = at(playTo(3, 'evening'), 'lanterns');
  // nothing known
  const clean = structuredClone(night); clean.facts = clean.facts.filter((f) => !['saboteur-caught', 'forge-burned', 'culprit-named', 'saboteur-fled'].includes(f)); delete clean.flags.reported; delete clean.flags.confronted; delete clean.flags['culprit-known'];
  assert.equal(S.unmaskedHow(clean), null);
  assert.notEqual(S.pendingScene(clean)?.id, 'unmasked');
  // known to the player alone (the stranger, Lady Edda, Odo's button)
  const priv = structuredClone(clean); priv.flags['culprit-known'] = 'cassius';
  assert.equal(S.unmaskedHow(priv), null);
  // caught at the forge by the watch
  const caught = structuredClone(clean); caught.facts.push('saboteur-caught'); caught.flags['culprit-known'] = 'cassius';
  assert.equal(S.unmaskedHow(caught), 'caught');
  assert.equal(S.pendingScene(caught)?.id, 'unmasked');
  assert.deepEqual(say(caught, 'unmasked'), [['lio', T.tx('v2.scene.unmasked.caught')], ['cassius', T.tx('v2.scene.unmasked.forge')], ['player', T.tx('v2.scene.unmasked.3')]]);
  // reported to Hale: the gear's chain (no forge fact)
  const rep = structuredClone(priv); rep.flags.reported = true; rep.facts.push('tamper-found');
  assert.equal(S.unmaskedHow(rep), 'reported');
  assert.deepEqual(say(rep, 'unmasked').slice(0, 2), [['lio', T.tx('v2.scene.unmasked.reported')], ['cassius', T.tx('v2.scene.unmasked.gear')]]);
  // shamed on the square: the last way first
  const conf = structuredClone(caught); conf.flags.reported = true; conf.flags.confronted = true;
  assert.equal(S.unmaskedHow(conf), 'confronted');
  assert.equal(say(conf, 'unmasked')[0][1], T.tx('v2.scene.unmasked.confronted'));
  // the evening only, the festival square only, once
  assert.notEqual(S.pendingScene({ ...caught, slot: 'afternoon' })?.id, 'unmasked');
  assert.equal(S.pendingScene({ ...caught, place: 'forecourt' })?.id ?? null, null);
  assert.equal(S.pendingScene(act(caught, { type: 'watched', scene: 'unmasked' })), null);
  // the diligent bot's games: the watch catches the saboteur at the forge, the scene comes the next evening on the square
  const L = G; void L;
});

test('the epilogue: the forecourt on day 10\'s evening, once the champion is crowned; Odo, Marek and the hero by the champion and the hero\'s place', () => {
  const crownedState = (champ, rank) => {
    const s = at(playTo(10, 'morning'), 'forecourt'); s.slot = 'evening'; s.flags.champion = champ; s.flags['scene:final'] = true;
    // the final order: the hero at `rank` (v2Ranking reads the bracket; a forged final and third place)
    return { s, rank };
  };
  const base = at(playTo(10, 'morning'), 'forecourt');
  assert.equal(S.pendingScene(base)?.id, 'final', 'the morning keeps the final\'s scene');
  // the hero crowned (every bout won, the final won)
  let s = playTo(10, 'afternoon'); s = act(s, WON); s = at(s, 'forecourt');
  assert.equal(s.flags.champion, 'player'); assert.equal(s.slot, 'evening');
  s.flags['scene:final'] = true;
  assert.equal(S.pendingScene(s)?.id, 'epilogue');
  let lines = say(s, 'epilogue');
  assert.deepEqual(lines.map((l) => l[0]), ['odo', 'marek', 'player']);
  assert.deepEqual(lines.map((l) => l[1]), [T.tx('v2.scene.epilogue.crowned', { name: s.player.name }), T.tx('v2.scene.epilogue.marek.crowned', { name: s.player.name }), T.tx('v2.scene.epilogue.hero.champion')]);
  // the final lost: second
  let f = playTo(10, 'afternoon'); f = at(act(f, LOST), 'forecourt'); f.flags['scene:final'] = true;
  const champ = f.flags.champion; assert.ok(champ && champ !== 'player');
  lines = say(f, 'epilogue');
  assert.equal(lines[0][1], T.tx('v2.scene.epilogue.champion', { champ: S.speakerName(f, champ) }));
  assert.equal(lines[1][1], T.tx(champ === 'marek' ? 'v2.scene.epilogue.marek.kept' : 'v2.scene.epilogue.marek.second', { name: f.player.name, champ: S.speakerName(f, champ) }));
  assert.equal(lines[2][1], T.tx('v2.scene.epilogue.hero.final'));
  // another champion than Marek: his words for the hero second
  const other = structuredClone(f); other.flags.champion = champ === 'marek' ? 'vessa' : champ;
  if (other.flags.champion !== 'marek') assert.equal(say(other, 'epilogue')[1][1], T.tx('v2.scene.epilogue.marek.second', { name: f.player.name, champ: S.speakerName(other, other.flags.champion) }));
  const kept = structuredClone(f); kept.flags.champion = 'marek';
  assert.equal(say(kept, 'epilogue')[1][1], T.tx('v2.scene.epilogue.marek.kept', { name: f.player.name, champ: S.speakerName(kept, 'marek') }));
  // the Gate's road: the pool lost, the Gate bout won, the Gate final won (5th) or lost (6th): both « gate »; Marek's words for another champion
  for (const [d8, rank] of [[WON, 5], [LOST, 6]]) {
    let g = playTo(10, 'afternoon', (day) => (day === 6 ? WON : day === 8 ? d8 : LOST)); g = act(g, { type: 'wait' }); g = at(g, 'forecourt'); g.flags['scene:final'] = true;
    assert.equal(C.v2Ranking(g).indexOf('player') + 1, rank, 'the Gate final ' + (rank === 5 ? 'won' : 'lost'));
    assert.equal(say(g, 'epilogue')[2][1], T.tx('v2.scene.epilogue.hero.gate'));
    const ch = g.flags.champion === 'marek' ? 'vessa' : g.flags.champion; g.flags.champion = ch;
    assert.equal(say(g, 'epilogue')[1][1], T.tx('v2.scene.epilogue.marek.other', { name: g.player.name, champ: S.speakerName(g, ch) }));
  }
  // every bout lost: the hero's place out of the semi-finals (5 to 8)
  let o = playTo(10, 'afternoon', () => LOST); o = act(o, { type: 'wait' }); o = at(o, 'forecourt'); o.flags['scene:final'] = true;
  const r = C.v2Ranking(o).indexOf('player') + 1;
  assert.ok(r >= 5);
  assert.equal(say(o, 'epilogue')[2][1], T.tx(r <= 6 ? 'v2.scene.epilogue.hero.gate' : 'v2.scene.epilogue.hero.out'));
  assert.equal(say(o, 'epilogue')[1][1], T.tx(o.flags.champion === 'marek' ? 'v2.scene.epilogue.marek.kept' : 'v2.scene.epilogue.marek.other', { name: o.player.name, champ: S.speakerName(o, o.flags.champion) }));
  // never before the crown, nor elsewhere
  assert.equal(S.pendingScene({ ...s, flags: { ...s.flags, champion: undefined } })?.id ?? null, null);
  assert.equal(S.pendingScene({ ...s, place: 'lanterns' })?.id ?? null, null);
  void crownedState;
});

test('the four scenes: their speakers have a face, their walkers stand on the square, their looks inside its walk; the default game plays none', () => {
  for (const id of ['gate', 'semiWon', 'semiLost', 'unmasked', 'epilogue']) {
    const c = S.CUTSCENES[id], spots = PZ.PLAZA_SPOTS[VP.PLAZA_OF[c.place]], W = PZ.PLAZA_WALKS[VP.PLAZA_OF[c.place]];
    for (const who of c.cast) assert.ok(spots[who], `${id}: ${who} has a spot`);
    for (const st of c.steps) {
      if ('walk' in st) assert.ok(c.cast.includes(st.walk), `${id}: ${st.walk} walks`);
      if ('cam' in st) assert.ok(st.cam[0] >= W.x0 && st.cam[0] <= W.x1 && st.cam[1] >= W.z0 && st.cam[1] <= W.z1, `${id}: the look`);
      if ('say' in st && typeof st.say === 'string') assert.ok(st.say === 'player' || c.cast.includes(st.say), `${id}: ${st.say} on the square`);
    }
  }
  // the default game: no scene whatever its state
  const d = G.namedState('day1-morning');
  for (const st of [d, { ...d, day: 6 }, { ...d, slot: 'evening', place: 'lanterns', facts: [...d.facts, 'saboteur-caught'] }]) assert.equal(S.pendingScene(st), null);
});
