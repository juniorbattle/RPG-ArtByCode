// The pages aligned on the gear's (journal Passe UM11, the audit of Passe UM10): what the skills' page says is the duel's own, the journal loses nothing and says
// each day once, the board counts every bout, and every page has one foot and one way of showing that a list goes on.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const VG = await load('/src/simulation/v2gear.ts');
const VS = await load('/src/simulation/v2skills.ts');
const VT = await load('/src/simulation/v2town.ts');
const P = await load('/src/simulation/preview.ts');
const M = await load('/src/combat/match.ts');
const SB = await load('/src/combat/skillbook.ts');
const AM = await load('/src/combat/autoMatch.ts');
const AD = await load('/src/combat/autoData.ts');
const SK = await load('/src/combat/skills.ts');
const B = await load('/src/ui/board.ts');
const J = await load('/src/ui/journal.ts');
const POOL = await load('/src/tournament/pool.ts');

const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const GEARS = [{}, { weapon: 'imported-blade', tier: 2 }, { armour: 'mail-shirt', acc: ['lucky-ribbon', 'docker-wrap'] }, { weapon: 'duelist-sabre', acc: ['swift-boots', 'iron-ring'] }];

test('what a skill does is the duel\'s own: every skill at every level, the gear in it, against the fighters a bout is built from', () => {
  // the duel played by the computer since lot 2 (journal Passe LC3): the skill as the bout's Ren brings it (src/combat/autoMatch.ts autoBoutOf, his four in his order),
  // its damage by DB7-1's formula against the opponent's Defence, what it adds to that opponent's gauge by its Endurance (written here), its charge at Ren's Speed
  const st = G.makeV2(G.namedState('day2-afternoon'));
  for (const gear of GEARS) for (const id of Object.keys(SB.SKILL_BOOK)) for (let level = 1; level <= SK.MAX_LEVEL; level++) {
    const s = structuredClone(st); Object.assign(s.v2.gear, gear); s.v2.kit.levels[id] = level;
    if (!s.v2.kit.loadout.includes(id)) s.v2.kit.loadout = [id, ...s.v2.kit.loadout.slice(1)];
    // the heavy attack: a base attack of every fighter since SY-02 (journal Passe SY2), never one of the four: the bout's heavy blow
    const b = AM.autoBoutOf(s), a = id === 'heavy' ? b.ren.heavy : b.ren.skills.find((x) => x.id === id), f = P.skillFigures(s, id, level), e = a.ward ?? a.boost;
    assert.ok(a, `${id} brought`);
    const k = (2 * b.ren.atk) / (b.ren.atk + b.foe.def);
    assert.equal(f.ap, a.ap ?? 0, `${id} ${level}`);
    // every blow of a skill that strikes several, as the duel strikes them (journal Passe CO2: Tourbillon's three of 0.36)
    const hits = a.hits ?? [1];
    assert.equal(f.hits, e ? 0 : hits.length, `${id} hits`);
    assert.equal(f.damage, e ? 0 : hits.reduce((n, sh) => n + Math.max(1, Math.round(a.power * sh * k)), 0)); assert.equal(f.gauge, e ? 0 : +(a.gauge * hits.reduce((n, sh) => n + sh, 0) * 10 / b.foe.end).toFixed(1));
    assert.equal(f.charge, +(a.charge * 10 / b.ren.viv).toFixed(2)); assert.equal(f.dur, e?.dur ?? 0);
    assert.deepEqual(f.ward, a.ward ? { damage: a.ward.dmg, resist: a.ward.gauge } : null); assert.deepEqual(f.boost, a.boost ? { damage: a.boost.dmg, resist: a.boost.gauge } : null); assert.equal(f.pierce, !!a.pierce);
  }
});

test('the order the page shows is the duel\'s: the four in the order the automatic follows; a level up never weakens a skill', () => {
  // the duel played by the computer since lot 2 (journal Passe LC3): the order of its Ren (AC-09), each with its AP and its charge at his Speed
  const st = G.makeV2(G.namedState('day2-afternoon'));
  for (const gear of GEARS) for (const order of [undefined, ['t1', 'd1', 't4', 's1']]) {
    const s = structuredClone(st); Object.assign(s.v2.gear, gear); if (order) s.v2.kit.order = order;
    const b = AM.autoBoutOf(s), v = P.autoOrderView(s, s.v2.kit.loadout);
    assert.deepEqual(v.map((x) => x.id), b.ren.skills.map((x) => x.id));
    assert.deepEqual(v.map((x) => x.charge), b.ren.skills.map((x) => +(x.charge * 10 / b.ren.viv).toFixed(2)));
  }
  // three chosen of four: the three, in the automatic's order
  assert.deepEqual(P.autoOrderView(st, st.v2.kit.loadout.slice(0, 3)).map((x) => x.id), AD.autoDefaultOrder(st.v2.kit.loadout.slice(0, 3), st.v2.kit.levels));
  for (const id of Object.keys(SB.SKILL_BOOK)) for (let level = 1; level < SK.MAX_LEVEL; level++) {
    const a = P.skillFigures(st, id, level), b = P.skillFigures(st, id, level + 1);
    assert.ok(b.damage >= a.damage && b.gauge >= a.gauge && b.dur >= a.dur && b.charge <= a.charge, `${id} ${level}`);
  }
});

test('the next level says what the game allows: drilling to its cap, then the teacher alone, and the action agrees', () => {
  const s = G.makeV2(G.namedState('day1-morning'));
  s.v2.kit.levels.k_cry = 1; s.v2.kit.levels.t1 = 1;
  assert.deepEqual(P.nextLevel(s, 't1'), { level: 2, by: 'drill' });
  s.v2.kit.levels.t1 = VS.TRAIN_CAP; assert.equal(P.nextLevel(s, 't1'), null, 'no teacher: the cap is the end');
  s.v2.kit.levels.k_cry = VS.TRAIN_CAP; assert.deepEqual(P.nextLevel(s, 'k_cry'), { level: VS.TRAIN_CAP + 1, by: 'challenge', teacher: 'orla' });
  s.v2.kit.levels.k_cry = SK.MAX_LEVEL; assert.equal(P.nextLevel(s, 'k_cry'), null);
  // a skill only a rival out of the title teaches (LATE_TEACHER): raised by a challenge from the day such a rival can be challenged (journal Passe CO1), as
  // learnFromChallenge raises it; « no higher level » only at the top
  for (const [rival, id] of Object.entries(SB.LATE_TEACHER)) {
    s.v2.kit.levels[id] = VS.TRAIN_CAP;
    assert.deepEqual(P.nextLevel(s, id), { level: VS.TRAIN_CAP + 1, by: 'challenge', teacher: rival, fromDay: VT.RIVALS_CHALLENGE_DAY }, id);
    s.v2.kit.levels[id] = SK.MAX_LEVEL; assert.equal(P.nextLevel(s, id), null, `${id} at the top`);
  }
  // the drill's own refusal at the cap, on the practice sand
  const t = structuredClone(s); t.place = 'training';
  const d = G.actions(t).find((o) => o.action.type === 'drillSkill' && o.action.skill === 't1');
  assert.ok(d && !d.ok && /no higher than level/.test(d.reason), 'the action refuses what the page says is the end');
});

test('the journal: every entry told once, none hidden, the last day first and each day in its order', () => {
  const s = G.namedState('v2-training-dusk'), days = J.journalDays(s), seen = days.flatMap((d) => d.slots.flatMap((x) => x.entries));
  assert.deepEqual([...seen].sort((a, b) => a.seq - b.seq).map((e) => e.seq), s.log.filter((e) => e.visible).map((e) => e.seq));
  assert.deepEqual(days.map((d) => d.day), [...new Set(days.map((d) => d.day))].sort((a, b) => b - a));
  for (const d of days) {
    assert.equal(d.size, d.slots.reduce((n, x) => n + x.entries.length, 0));
    const seqs = d.slots.flatMap((x) => x.entries.map((e) => e.seq));
    assert.deepEqual(seqs, [...seqs].sort((a, b) => a - b));
    for (const x of d.slots) assert.ok(x.entries.every((e) => e.slot === x.slot && e.day === d.day));
  }
  assert.ok(days.find((d) => d.day === 2).bout, 'the day of a bout says its result');
});

test('the board: every bout on both fighters\' sheets, the wins and the points agree, the next bout is the player\'s own', () => {
  for (const name of ['v2-training-dusk', 'v2-day2-afternoon', 'day2-afternoon']) {
    const s = G.namedState(name), ids = POOL.standings(s).map((r) => r.id);
    let count = 0;
    for (const id of ids) {
      const bouts = B.boutsOf(s, id); count += bouts.length;
      assert.deepEqual(bouts.map((b) => b.m.day), [...bouts.map((b) => b.m.day)].sort((a, b) => a - b));
      for (const b of bouts) assert.equal(b.won, b.m.winner ? b.m.winner === id : null);
    }
    assert.equal(count, s.tournament.matches.length * 2);
    const n = B.nextBout(s);
    if (n) assert.ok((n.a === 'player' || n.b === 'player') && !n.winner && n.day >= s.day);
  }
});

test('every page has one foot: the action with Enter, the way out with Esc, outside what scrolls; a list that goes on fades, never cut', () => {
  const St = src('src/ui/style.ts'), files = ['townUi', 'wares', 'skills', 'board', 'journal'].map((f) => [f, src(`src/ui/${f}.ts`)]);
  for (const [f, t] of files) {
    assert.ok(!/<kbd>Esc<\/kbd>\$\{tx\('ui\.(close|leave)/.test(t), `${f}: the way out goes through footBtn`);
    assert.ok(!/pm-gfoot|pm-acts|pm-sheet/.test(t), f);
    assert.match(t, /scrollFade\(/, `${f}: its list fades`);
  }
  assert.match(St, /\.pm-foot \.out\{margin-left:auto\}/, 'the way out on the right');
  assert.match(St, /\.pm-scroll\[data-more=b\]/); assert.match(St, /scroll-padding-block:44px/);
  assert.ok(!/accent-color/.test(src('src/ui/townUi.ts')), 'the browser\'s round slider is gone');
  // the accent is the selection's: a skill brought is a filled square, not a page of gold
  assert.ok(!/aria-pressed=true\]\{color/.test(St));
});
