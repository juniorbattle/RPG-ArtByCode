// The skills of the version 2 (lot V2, C4; the operator's decision AV-9 « Achat, entraînement et défi », journal Passe V2): a catalogue of
// twelve skills in three families, each with its charge time, AP and levels; bought from the weapon master (dear), drilled on the practice
// sand (a slot: a base skill learnt or a level gained, up to level 3), won by a challenge (the fighter's skill learnt, raised on a later win);
// four brought to a bout, chosen at the match sheet. The default game never offers any of it. Oracles written from the rules.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const SB = await load('/src/combat/skillbook.ts');
const K = await load('/src/combat/skills.ts');
const S = await load('/src/simulation/v2skills.ts');
const V = await load('/src/combat/v2duel.ts');
const B = await load('/src/combat/bot.ts');
const M = await load('/src/combat/match.ts');
const { PEOPLE } = await load('/src/narrative/people.ts');
const P = await load('/src/simulation/preview.ts');
const T = await load('/src/narrative/text/index.ts');
const { V2_EVENTS } = await load('/src/events/v2catalog.ts');

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const refused = (st, a, re) => { const r = G.advance(st, a); assert.equal(r.ok, false, a.type); if (re) assert.match(r.reason, re); };

test('the catalogue: twelve skills and the heavy attack (journal Passe CH1), since journal Passe SK2 the rivals\' seven signatures (SK-12 « La lever : dix-neuf compétences »), since journal Passe SK4 the town fighters\' five (NC-1), the three families, each with its charge times (five levels, shorter as they rise) and its AP', () => {
  const all = Object.keys(SB.SKILL_BOOK), sigs = Object.values(SB.SIGNATURES), ids = all.filter((id) => !sigs.includes(id));
  assert.equal(all.length, 25, `${all.length} skills and the heavy attack`); assert.equal(sigs.length, 7);
  // a signature is a rival\'s attack, its numbers the duel played by the computer\'s (tests/skill-structure.test.mjs); the three-button duel never carries it
  for (const id of sigs) { assert.equal(SB.SKILL_BOOK[id].family, 'offensive'); assert.equal(SB.SKILL_BOOK[id].source, 'challenge'); for (let lv = 2; lv <= 5; lv++) assert.ok(K.chargeTime(id, lv) < K.chargeTime(id, lv - 1), id); }
  assert.deepEqual({ ...SB.SKILL_BOOK.heavy }, { id: 'heavy', family: 'offensive', source: 'start' });
  for (const f of ['offensive', 'defensive', 'support']) assert.ok(ids.filter((id) => SB.SKILL_BOOK[id].family === f).length >= 2, f);
  // the heavy attack costs its AP under the three buttons (1, « proposé »), free under the old scheme
  const charged = V.v2DuelData('marek', { seed: 1, playerName: 'R', opponentName: 'M' }).data.actions;
  for (const id of ids) {
    const a = SB.skillAction(id), info = SB.SKILL_BOOK[id];
    assert.equal(a.family, info.family, id); assert.ok((id === 'heavy' ? charged.heavy.apCost : a.apCost ?? 0) >= 1, `${id} costs AP (AV-6)`);
    // the charge times trimmed to 0.85 of journal Passe V1's (journal Passe CH1): the heavy attack from 1.7 s, the others from 2 s, none over 8.5 s
    for (let lv = 1; lv <= 5; lv++) { assert.ok(K.chargeTime(id, lv) >= (id === 'heavy' ? 1.25 : 2) && K.chargeTime(id, lv) <= 8.5, id); if (lv > 1) assert.ok(K.chargeTime(id, lv) < K.chargeTime(id, lv - 1), id); }
  }
  assert.deepEqual([1, 2, 3, 4, 5].map((lv) => K.chargeTime('heavy', lv)), [1.7, 1.55, 1.45, 1.35, 1.3]);
  assert.deepEqual([1, 2, 3, 4, 5].map((lv) => K.chargeTime('t4', lv)), [7.65, 6.95, 6.3, 5.7, 5.1]);
  // the three ways, and every challenge skill has its teacher
  for (const src of ['start', 'buy', 'train', 'challenge']) assert.ok(ids.some((id) => SB.SKILL_BOOK[id].source === src), src);
  for (const id of ids.filter((x) => SB.SKILL_BOOK[x].source === 'buy')) assert.ok(SB.SKILL_BOOK[id].price >= 30, `${id} is dear`);
  for (const id of ids.filter((x) => SB.SKILL_BOOK[x].source === 'challenge')) assert.equal(SB.taughtBy(SB.SKILL_BOOK[id].teacher), id);
  for (const [foe, id] of Object.entries(SB.SIGNATURES)) assert.equal(SB.SKILL_BOOK[id].signature, foe);
  assert.equal(SB.taughtBy('mara'), null);
  assert.throws(() => SB.skillAction('light'), /no skill/);
});

test('a version 2 game starts with today\'s four skills at level 1, the heavy attack owned beside them (journal Passe CH1); the default game has no version 2 state and never lists these actions', () => {
  const st = v2();
  assert.deepEqual(st.v2.kit.loadout, ['t1', 't4', 'd1', 's1']);
  assert.deepEqual(st.v2.kit.levels, { heavy: 1, t1: 1, t4: 1, d1: 1, s1: 1 });
  // a version 2 game saved before: it owns the heavy attack once read; a default game's save reads as it was
  const old = structuredClone(st); delete old.v2.kit.levels.heavy;
  assert.equal(G.deserialize(G.serialize(old)).v2.kit.levels.heavy, 1);
  const d0 = G.namedState('day1-morning'); assert.equal(G.serialize(G.deserialize(G.serialize(d0))), G.serialize(d0));
  // the heavy attack is drilled as the other skills owned from the start, up to level 3; a base attack of every fighter since SY-02 (A3), never one of the four
  // (the operator's SL1-7, journal Passe SL2: an old save's gives its place to the next skill owned, tests/auto-hand.test.mjs)
  const at = { ...structuredClone(st), place: 'training' };
  assert.ok(G.actions(at).some((o) => o.action.type === 'drillSkill' && o.action.skill === 'heavy' && o.ok));
  assert.deepEqual(act(at, { type: 'drillSkill', skill: 'heavy' }).v2.kit.levels.heavy, 2);
  refused(st, { type: 'setLoadout', skills: ['heavy', 't1', 'd1', 's1'] }, /not one of the four/);
  for (const name of Object.keys(G.NAMED_STATES).filter((n) => !G.NAMED_STATES[n].v2)) {
    const d = G.namedState(name);
    assert.equal(d.v2, undefined, name);
    for (const place of ['district', 'forecourt', 'lanterns', 'training']) {
      const s = structuredClone(d); s.place = place;
      const types = G.actions(s).map((o) => o.action.type);
      for (const t of ['buySkill', 'drillSkill', 'setLoadout']) assert.ok(!types.includes(t), `${name} ${place}: ${t}`);
      assert.ok(!G.actions(s).some((o) => o.action.type === 'talk' && PEOPLE[o.action.who].v2), `${name} ${place}: a version 2 person`);
    }
    refused(d, { type: 'buySkill', skill: 't3' }, d.over ? /pool is over/ : /version 2/);
    if (!d.over) refused(d, { type: 'talk', who: 'corvin' }, /Nobody/);
  }
});

test('buying from the weapon master: dear, by day at the training ground (lot V5), once; a tenth off for a reputation of 40 or more', () => {
  let st = act(v2(), { type: 'move', to: 'training' });
  st.player.coins = 100;
  const o = G.actions(st).find((x) => x.action.type === 'buySkill' && x.action.skill === 't3');
  assert.ok(o && o.ok && o.coins === 45 && o.cost === 0, JSON.stringify(o));
  st = act(st, { type: 'buySkill', skill: 't3' });
  assert.equal(st.player.coins, 55); assert.equal(st.v2.kit.levels.t3, 1);
  refused(st, { type: 'buySkill', skill: 't3' }, /already/);
  refused(st, { type: 'buySkill', skill: 'k_cry' }, /does not teach/);
  st.player.reputation = 40;
  assert.equal(S.skillPrice(st, 'k_sunder'), 36);
  st.player.coins = 10; refused(st, { type: 'buySkill', skill: 'k_sunder' }, /wants 36/);
  const night = v2('day1-evening'); night.place = 'training'; night.player.coins = 99; refused(night, { type: 'buySkill', skill: 'k_iron' }, /by day/);
  const town = v2(); town.player.coins = 99; refused(town, { type: 'buySkill', skill: 'k_iron' }, /training ground/);
});

test('drilling on the practice sand: a slot; a base skill learnt at level 1, an owned skill raised, never above level 3', () => {
  let st = act(v2(), { type: 'move', to: 'training' });
  const drill = (s, id) => G.actions(s).find((x) => x.action.type === 'drillSkill' && x.action.skill === id);
  assert.equal(drill(st, 't2').cost, 1);
  assert.equal(drill(st, 't3'), undefined, 'a bought skill not owned is not drilled');
  const slot = st.slot;
  st = act(st, { type: 'drillSkill', skill: 't2' });
  assert.equal(st.v2.kit.levels.t2, 1); assert.notEqual(st.slot, slot, 'the slot taken');
  st = act(st, { type: 'drillSkill', skill: 't1' });
  assert.equal(st.v2.kit.levels.t1, 2);
  st.slot = 'morning'; st.v2.kit.levels.t1 = 3;
  refused(st, { type: 'drillSkill', skill: 't1' }, /no higher than level 3/);
  refused(st, { type: 'drillSkill', skill: 'k_cry' }, /base skills/);
  st.slot = 'evening'; refused(st, { type: 'drillSkill', skill: 't4' }, /closes at dusk/);
});

test('a challenge won teaches the fighter\'s skill, then raises it up to level 3 and never beyond (GP-16); the four chosen at the match sheet are four distinct owned skills', () => {
  const st = v2(), events = [], emit = (e) => { events.push(e); return e; };
  assert.equal(S.learnFromChallenge(st, 'orla', emit), 'k_cry');
  assert.equal(st.v2.kit.levels.k_cry, 1);
  for (let i = 0; i < 6; i++) S.learnFromChallenge(st, 'orla', emit);
  // the operator's GP-16 « Les corriger » (journal Passe GP2): the sand teaches up to the training's cap, Master Corvin's lessons beyond; at the cap the fighter
  // teaches nothing more, so the challenge's label names no skill
  assert.equal(S.TRAIN_CAP, 3);
  assert.equal(st.v2.kit.levels.k_cry, S.TRAIN_CAP);
  assert.deepEqual(events.map((e) => e.id), ['skill:learnt', 'skill:raised', 'skill:raised']);
  assert.equal(S.challengeSkill(st, 'orla'), null, 'nothing more to teach at the cap');
  assert.equal(S.learnFromChallenge(st, 'mara', emit), null);
  refused(st, { type: 'setLoadout', skills: ['t1', 't4', 'd1'] }, /four/);
  refused(st, { type: 'setLoadout', skills: ['t1', 't4', 'd1', 'd1'] }, /four/);
  refused(st, { type: 'setLoadout', skills: ['t1', 't4', 'd1', 'k_focus'] }, /do not know Focus/);
  const s2 = act(st, { type: 'setLoadout', skills: ['k_cry', 't4', 'd1', 's1'] });
  assert.deepEqual(s2.v2.kit.loadout, ['k_cry', 't4', 'd1', 's1']);
  assert.equal(s2.slot, st.slot, 'a minor action');
});

test('GP-16: a town fighter beaten again from day 6 raises a skill drilled to level 3 no further, and the challenge then promises none; below the cap it is raised', () => {
  // the defect found in journal Passe GP1: Lucan's Finishing Blow learnt in the first phase, drilled to 3, then a second-phase challenge took it to 4 without a lesson
  const st = v2(), events = [], emit = (e) => { events.push(e); return e; };
  assert.equal(S.learnFromChallenge(st, 'lucan', emit), 'n_grace');
  st.v2.kit.levels.n_grace = S.TRAIN_CAP; st.day = 7;
  assert.equal(S.learnFromChallenge(st, 'lucan', emit), null);
  assert.equal(st.v2.kit.levels.n_grace, S.TRAIN_CAP, 'level 3 kept: the lessons alone go beyond');
  assert.deepEqual(events.map((e) => e.id), ['skill:learnt'], 'nothing said: nothing taught');
  assert.deepEqual(P.nextLevel(st, 'n_grace'), { level: 4, by: 'lesson', price: S.lessonPrice(4), day: S.LESSON.day });
  // the negative control: at level 2 the second phase raises it, to the cap
  const low = v2(); low.v2.kit.levels.n_grace = 2; low.day = 7;
  assert.equal(S.learnFromChallenge(low, 'lucan', () => {}), 'n_grace'); assert.equal(low.v2.kit.levels.n_grace, 3);
  // the challenge's words on the training ground (Orla, the first morning): her skill named while it can still be taught, none once it is at the cap
  const at = v2(); at.place = 'training'; at.slot = 'morning';
  const label = (s) => G.actions(s).find((o) => o.action.type === 'challenge' && o.action.who === 'orla' && o.action.stake === 'coins')?.label ?? '';
  assert.match(label(at), new RegExp(`and ${T.skillName('k_cry')}\\)$`));
  at.v2.kit.levels.k_cry = S.TRAIN_CAP;
  assert.match(label(at), /\(won: twice back\)$/);
});

test('GP-16: the day of Master Corvin\'s fifth off (the day after a challenge won, his open lesson), his lessons cost a fifth less too; the list price any other day', () => {
  const base = v2(); base.place = 'training'; base.slot = 'morning'; base.day = 6; base.v2.kit.levels.t4 = S.TRAIN_CAP; base.player.coins = 100;
  const off = structuredClone(base); off.flags['lesson:6'] = true;
  const opt = (s) => G.actions(s).find((o) => o.action.type === 'lessonSkill' && o.action.skill === 't4');
  assert.deepEqual([opt(base).coins, opt(off).coins], [30, 24]);
  assert.equal(opt(off).label, `Take Master Corvin's lesson in ${T.skillName('t4')} (to level 4; 24 coins)`);
  assert.equal(P.nextLevel(off, 't4').price, 24, 'the skills page says the price of the day');
  let s = act(off, { type: 'lessonSkill', skill: 't4' });
  assert.deepEqual([s.v2.kit.levels.t4, s.player.coins], [4, 76]);
  s.slot = 'morning'; s.flags['lesson:6'] = true; s = act(s, { type: 'lessonSkill', skill: 't4' });
  assert.deepEqual([s.v2.kit.levels.t4, s.player.coins], [5, 28], 'level 5: 60 less a fifth');
  // the same fifth as on the skills he sells, and the event says it
  assert.equal(S.skillPrice(off, 'k_sunder'), Math.round(S.skillPrice(base, 'k_sunder') * 0.8));
  const fame = V2_EVENTS.find((e) => e.id === 'v2-challenge-fame');
  assert.ok(fame.outcomes.every((o) => o.effects.some((x) => x.tomorrow === 'lesson')), 'the day after a challenge won');
});

test('the bout takes the player\'s kit: its four skills at their levels, the new skills among them; the bot fights it to a K.O.', () => {
  let st = G.makeV2(G.namedState('day2-afternoon'));
  st.v2.kit = { loadout: ['k_sunder', 't4', 'k_iron', 'k_cry'], levels: { k_sunder: 2, t4: 1, k_iron: 1, k_cry: 3, t1: 1, d1: 1, s1: 1 } };
  const sh = M.matchSheetFor(st), d = M.v2SheetData(sh, undefined, G.v2KitOf(st));
  assert.deepEqual(d.data.loadout, ['k_sunder', 't4', 'k_iron', 'k_cry']);
  assert.deepEqual(d.tiers.map((t) => t.id), ['light', 'k_cry', 'k_iron', 'k_sunder', 't4']);
  assert.equal(d.tiers[1].at, K.chargeTime('k_cry', 3));
  // since journal Passe DB8: its power (the Thrust's 120 by its charge time at level 1, x 1.1 at level 2) by the formula against the opponent's Defence
  const F = M.foeSheetOf(sh.sides[1].fighters[0], sh.stage);
  const kr = (2 * 10) / (10 + F.def);
  assert.equal(d.data.actions.k_sunder.damage, Math.round(120 * (K.chargeTime('k_sunder', 1) / K.chargeTime('t4', 1)) * 1.1 * kr));
  const r = B.runV2BotDuel(d.data, d.tiers, { skill: 0.7, seed: 9 });
  assert.ok(r.winner, 'a K.O.');
  // levels make a kit stronger: today's four at level 3 beat Marek where level 1 often loses (the bot at 0.5, eight duels)
  const wins = (lv) => { let w = 0; for (let i = 1; i <= 8; i++) { const x = V.v2DuelData('marek', { seed: 1000 + i, playerName: 'R', opponentName: 'M', kit: { loadout: ['t1', 't4', 'd1', 's1'], levels: { t1: lv, t4: lv, d1: lv, s1: lv } } }); if (B.runV2BotDuel(x.data, x.tiers, { skill: 0.5, seed: 77 + i }).winner === 'player') w++; } return w; };
  assert.ok(wins(3) > wins(1), 'levels raise the odds');
});
