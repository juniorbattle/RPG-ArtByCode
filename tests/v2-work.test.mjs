// The money of a version 2 game (the operator's sheet of journal Passe ECO2, eight of eight: ECO-2 « Un travail par lieu et par jour (jusqu’à trois par
// jour) », ECO-3 « 10 pièces », ECO-4 « Bourses qui montent : jour 6 35 / 10, jour 8 45 / 15, finale 80 / 30 », ECO-6 « Mara rachète à moitié prix ce qui
// est dans le sac, jamais un objet volé », ECO-7 « L’étiquette, un chapitre du guide et un conseil », ECO-8 « Un joueur « planificateur » de plus, les trois
// autres inchangés »): the town's jobs, the purses by stage, the resale, the tag, the planner of the laboratory; today's game (`v2=0`) untouched. The oracles
// are the decisions written out here, not the code's tables.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const W = await load('/src/simulation/v2work.ts');
const POOL = await load('/src/tournament/pool.ts');
const LAB = await load('/src/tournament/lab.ts');
const WARES = await load('/src/ui/wares.ts');
const { tx } = await load('/src/narrative/text/index.ts');

const v2 = () => G.makeV2(G.namedState('day1-morning'));
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const refused = (st, a) => { const r = G.advance(st, a); assert.equal(r.ok, false, JSON.stringify(a)); return r.reason; };
const at = (st, place, slot) => { const s = structuredClone(st); s.place = place; s.slot = slot; return s; };
const opt = (st, a) => G.actions(st).find((o) => JSON.stringify(o.action) === JSON.stringify(a));
// the decisions, written out: a job a place, its moment, its employer; 10 coins
const JOBS = { crates: ['district', 'morning', 'mara'], pads: ['training', 'morning', 'corvin'], armour: ['forecourt', 'afternoon', 'hilde'], tables: ['lanterns', 'evening', 'lio'] };

test('the town\'s jobs: one a place, at its moment, at its employer\'s, 10 coins and a slot, once a day each (ECO-2, ECO-3)', () => {
  for (const [job, [place, slot, by]] of Object.entries(JOBS)) {
    const st = at(v2(), place, slot), o = opt(st, { type: 'work', job });
    assert.ok(o, `${job} offered at ${place} in the ${slot}`); assert.equal(o.ok, true, `${job}: ${o.reason}`);
    assert.equal(o.gain, 10, 'the tag says what it pays'); assert.equal(o.cost, 1, 'a slot'); assert.equal(o.coins, 0, 'it costs no coin');
    const r = act(st, { type: 'work', job });
    assert.equal(r.state.player.coins, st.player.coins + 10, `${job} pays 10`);
    assert.equal(r.state.town[by] ?? 0, (st.town[by] ?? 0) + 15, `${job}: the goodwill of ${by}, as Mara's crates gave it`);
    assert.ok(r.events.some((e) => e.id === `work:${job}` && e.visible && /10 coins/.test(e.text)), 'said in the news');
    assert.notEqual(r.state.slot, st.slot, 'the slot is spent');
    // once a day: the same moment of the same day again is refused
    const again = structuredClone(r.state); again.day = st.day; again.slot = slot; again.place = place;
    assert.equal(refused(again, { type: 'work', job }), tx('v2.work.done'));
    // at another moment: said when it is done
    const other = at(v2(), place, slot === 'morning' ? 'afternoon' : 'morning');
    assert.equal(refused(other, { type: 'work', job }), tx(`v2.work.when.${slot}`));
  }
  // one job a place: the quay offers none but Mara's crates, the forecourt none but Hilde's
  assert.deepEqual(G.actions(at(v2(), 'district', 'morning')).filter((o) => o.action.type === 'work').map((o) => o.action.job), ['crates']);
  // up to three a day: the quay's morning, the forecourt's afternoon, the festival square's evening
  let st = at(v2(), 'district', 'morning'); const c0 = st.player.coins;
  st = act(st, { type: 'work', job: 'crates' }).state; st = act(st, { type: 'move', to: 'forecourt' }).state;
  st = act(st, { type: 'work', job: 'armour' }).state; st = act(st, { type: 'move', to: 'lanterns' }).state;
  st = act(st, { type: 'work', job: 'tables' }).state;
  assert.equal(st.day, 2); assert.equal(st.player.coins - c0, 30, 'three jobs on day 1: 30 coins');
});

test('the jobs refused: a bout\'s afternoon, a player the watch wants, today\'s game (v2=0) keeping Mara\'s crates at 6 coins', () => {
  // the bout comes first (day 2's afternoon is the player's bout against Vessa)
  let st = v2(); while (!(st.day === 2 && st.slot === 'afternoon')) st = act(st, { type: 'wait' }).state;
  st.place = 'forecourt';
  assert.equal(refused(st, { type: 'work', job: 'armour' }), tx('refuse.boutFirst'));
  // nobody hires a player the watch wants (three marks)
  const w = at(v2(), 'district', 'morning'); w.v2.marks = 3;
  assert.equal(refused(w, { type: 'work', job: 'crates' }), tx('v2.work.wanted'));
  // today's game: no job, Mara's crates as before
  const old = G.namedState('day1-morning'); old.place = 'district';
  assert.ok(!G.actions(old).some((o) => o.action.type === 'work' || o.action.type === 'sell'), 'today\'s game offers no job and no resale');
  const r = act(old, { type: 'restock' }); assert.equal(r.state.player.coins, old.player.coins + 6);
  assert.ok(!G.actions(at(v2(), 'district', 'morning')).some((o) => o.action.type === 'restock'), 'a version 2 game: the crates are the quay\'s job');
});

test('the purses by stage: 20 / 5 in the pool, 35 / 10 on day 6, 45 / 15 on day 8, 80 / 30 in the final; today\'s game 20 / 5 (ECO-4)', () => {
  const want = { pool: [20, 5], semi: [35, 10], gate: [35, 10], third: [45, 15], gateFinal: [45, 15], final: [80, 30] };
  const s2 = v2(), s0 = G.namedState('day1-morning');
  for (const [stage, [w, l]] of Object.entries(want)) {
    const m = stage === 'pool' ? {} : { stage };
    assert.equal(POOL.boutPurse(s2, m, true), w, `${stage} won`); assert.equal(POOL.boutPurse(s2, m, false), l, `${stage} lost`);
    assert.equal(POOL.boutPurse(s0, m, true), 20); assert.equal(POOL.boutPurse(s0, m, false), 5);
  }
  // a bout won in a whole game pays its stage's purse, and says it
  let st = v2(); while (!(st.day === 2 && st.slot === 'afternoon')) st = act(st, { type: 'wait' }).state;
  const won = { winner: 'player', playerHp: 100, playerMaxHp: 150, opponentHp: 0, opponentMaxHp: 500, finisher: 'light' }, s = structuredClone(st), said = [];
  POOL.applyPlayerDuel(s, won, (e) => { said.push(e); return e; });
  assert.equal(s.player.coins, st.player.coins + 20, 'the pool’s purse');
  assert.ok(said.some((e) => e.id === 'player-won' && /a purse of 20 coins/.test(e.text)));
  // a semi-final won: 35, and said
  const semi = structuredClone(st), m = semi.tournament.matches.find((x) => x.day === 2 && (x.a === 'player' || x.b === 'player')), heard = [];
  m.stage = 'semi'; POOL.applyPlayerDuel(semi, won, (e) => { heard.push(e); return e; });
  assert.equal(semi.player.coins, st.player.coins + 35); assert.ok(heard.some((e) => /a purse of 35 coins/.test(e.text)));
});

test('the resale: Mara buys what lies in the bag at half its list price, by day, without a slot; never a stolen piece (ECO-6)', () => {
  const st = at(v2(), 'district', 'morning');
  st.v2.gear.bag.push('padded-jack', 'imported-blade');
  const o = opt(st, { type: 'sell', item: 'padded-jack' });
  assert.equal(o.ok, true, o.reason); assert.equal(o.gain, 9, 'half of 18'); assert.equal(o.cost, 0, 'no slot');
  const r = act(st, { type: 'sell', item: 'padded-jack' });
  assert.equal(r.state.player.coins, st.player.coins + 9); assert.equal(r.state.slot, 'morning');
  assert.deepEqual(r.state.v2.gear.bag, ['imported-blade']);
  assert.equal(opt(st, { type: 'sell', item: 'imported-blade' }).gain, 15, 'half of 30');
  // what is worn is not offered; the training sword is worth nothing
  assert.ok(!G.actions(st).some((o) => o.action.type === 'sell' && o.action.item === 'training-sword'));
  // by day only (her stall), at the quay only
  assert.equal(opt(at(st, 'district', 'evening'), { type: 'sell', item: 'padded-jack' }).ok, false);
  assert.ok(!opt(at(st, 'forecourt', 'morning'), { type: 'sell', item: 'padded-jack' }));
  // a piece of a theft not settled: refused; once settled with Sergeant Hale, hers to buy
  const t = structuredClone(st); t.v2.thefts = [{ day: 1, from: 'hilde', item: 'padded-jack', seen: null }];
  assert.equal(refused(t, { type: 'sell', item: 'padded-jack' }), tx('v2.sell.stolen'));
  t.v2.thefts[0].settled = true;
  assert.equal(opt(t, { type: 'sell', item: 'padded-jack' }).ok, true);
});

test('the tag in the list: what an action pays beside what it costs (ECO-7)', () => {
  assert.equal(WARES.costTag({ cost: 1, coins: 0, gain: 10 }), '<span class="cost gain">+10 coins</span><span class="cost">1 slot</span>');
  assert.equal(WARES.costTag({ cost: 0, coins: 0, gain: 9 }), '<span class="cost gain">+9 coins</span>', 'a sale is never « free »: it pays');
  assert.equal(WARES.costTag({ cost: 1, coins: 0 }), '<span class="cost">1 slot</span>', 'an action that pays nothing keeps its tags');
  assert.equal(WARES.costTag({ cost: 0, coins: 0 }), '<span class="cost free">free</span>');
});

test('the planner of the laboratory: it works and reaches the DB7 curve\'s gear; the three others unchanged (ECO-8)', () => {
  const S = Array.from({ length: 12 }, (_, i) => i + 1), plan = LAB.labReport(S, LAB.POLICIES.planner, 'v2');
  // the blade at tier 1, the mail shirt and the wrap by day 6 (four pieces or tiers), the three tiers and the ring by day 10 (seven)
  assert.ok(plan.v2.money.jobs >= 8, `${plan.v2.money.jobs} jobs a game`);
  assert.ok(plan.v2.money.gearD6 >= 3.5, `${plan.v2.money.gearD6} pieces by day 6`);
  assert.ok(plan.v2.money.gearD10 >= 6.5, `${plan.v2.money.gearD10} pieces by day 10`);
  // the others take no job (their choices are theirs: ECO-8)
  for (const p of ['idle', 'diligent', 'curious']) assert.equal(LAB.labReport(S.slice(0, 4), LAB.POLICIES[p], 'v2').v2.money.jobs, 0, p);
});
