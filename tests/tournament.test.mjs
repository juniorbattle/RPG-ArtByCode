// The tournament of the slice (journal Passe L2): the off-screen resolution against full duels in the arena's simulation (same model,
// TOURNAMENT § 6), the pool's points, the competitors never forgotten, the seventeen configurable events and the forge's sabotage chain,
// countered or not, and the TournamentLab's reproducibility.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const P = await load('/src/combat/profiles.ts');
const { runBotDuel } = await load('/src/combat/bot.ts');
const { COMBAT_DATA, CombatSim, runFingerprintScript, ARENA_SIM_HASH } = await load('/src/arena/CombatSim.ts');
const L = await load('/src/tournament/lab.ts');
const G = await load('/src/simulation/index.ts');
const { EVENTS } = await load('/src/events/catalog.ts');
const { matchSheetFor, sheetData } = await load('/src/combat/match.ts');
const { RIVALS, ROUNDS, POINTS } = await load('/src/narrative/roster.ts');

/** written before the held-out run (journal Passe L2): the simplified win chance within 0.2 of the full duels' win rate, per profile and skill */
const TOLERANCE = 0.2;
const HELD_OUT = Array.from({ length: 40 }, (_, i) => 101 + i);

function fullRate(profile, skill, mods = {}) {
  let w = 0;
  for (const seed of HELD_OUT) {
    const d = P.duelData(P.PROFILES[profile], { seed: 9000 + seed * 11, playerName: 'P', opponentName: profile, player: mods.player, enemy: mods.enemy });
    if (runBotDuel(d, { skill, seed }).winner === 'player') w++;
  }
  return w / HELD_OUT.length;
}

test('the off-screen resolution agrees with full duels in the arena simulation (held-out seeds, tolerance 0.2)', () => {
  const rows = [];
  for (const id of Object.keys(P.PROFILES)) for (const s of [0, 0.5, 1]) {
    const full = fullRate(id, s), pred = P.playerWinChance(P.PROFILES[id], s);
    rows.push(`${id}@${s}: full ${full.toFixed(2)} pred ${pred.toFixed(2)}`);
    assert.ok(Math.abs(full - pred) <= TOLERANCE, rows.at(-1));
  }
  // with the preparation's modifiers: an injury, a tempered blade, a well-prepared opponent
  for (const [id, m] of [['marek', { player: { hp: 0.6 } }], ['vessa', { player: { damage: 1.15 } }], ['rhosk', { enemy: { damage: 1.25, hp: 1.1 } }]]) {
    const full = fullRate(id, 0.3, m), pred = P.playerWinChance(P.PROFILES[id], 0.3, m.player, m.enemy);
    assert.ok(Math.abs(full - pred) <= TOLERANCE, `${id} with ${JSON.stringify(m)}: full ${full.toFixed(2)} pred ${pred.toFixed(2)}`);
  }
});

test('the duel data keep the prototype untouched and change only the opponent seat and the preparation', () => {
  const before = JSON.stringify(COMBAT_DATA);
  const d = P.duelData(P.PROFILES.vessa, { seed: 7, playerName: 'Aster', opponentName: 'Vessa Lark', player: { hp: 0.8, damage: 1.15 }, enemy: { damage: 1.1 } });
  assert.equal(JSON.stringify(COMBAT_DATA), before);
  assert.equal(d.fighters.ren.maxHp, 160); assert.equal(d.fighters.marek.maxHp, 600); assert.equal(d.fighters.ren.name, 'Aster');
  assert.equal(d.actions.light.damage, Math.round(10 * 1.15)); assert.equal(d.actions.m_slash.damage, Math.round(13 * 1.1));
  assert.equal(d.ai.seed, 7);
  // Marek's profile is the prototype's enemy: the arena's fingerprint holds through duelData
  const m = P.duelData(P.PROFILES.marek, { seed: COMBAT_DATA.ai.seed, playerName: 'Ren', opponentName: 'Marek' });
  const sim = new CombatSim(m); runFingerprintScript(sim);
  assert.equal(sim.hash(), ARENA_SIM_HASH);
});

test('a match sheet takes lists of fighters and refuses a team format (outside the slice)', () => {
  const st = G.namedState('day2-morning');
  const s2 = G.advance(st, { type: 'wait' }).state;   // day 2 afternoon: the bout against Vessa
  const sh = matchSheetFor(s2);
  assert.equal(sh.sides[1].fighters[0].id, 'vessa');
  assert.ok(sheetData(sh).fighters.marek.name === 'Vessa Lark');
  const team = { ...sh, sides: [sh.sides[0], { fighters: [...sh.sides[1].fighters, sh.sides[1].fighters[0]] }] };
  assert.throws(() => sheetData(team), /team formats \(1v2\) are outside the slice/);
  assert.equal(matchSheetFor(G.namedState('day1-morning')), null);
});

test('the pool: every bout of both rounds is played, points add up, nobody is eliminated', () => {
  for (const seed of [1842, 7719, 30417, 5]) {
    const st = L.autoplay(seed, L.POLICIES.idle).state;
    assert.equal(st.tournament.matches.length, ROUNDS.length * 4);
    let total = 0;
    for (const m of st.tournament.matches) { assert.ok(m.winner, `match ${m.a}-${m.b} played`); total += POINTS.win + (m.close ? POINTS.close : POINTS.loss); }
    assert.equal(Object.values(st.tournament.points).reduce((a, b) => a + b, 0) + 3 * (st.flags['ev:forge-sabotage'] !== undefined && st.facts.includes('saboteur-caught') ? 1 : 0), total);
    assert.ok(Object.values(st.competitors).every((c) => c.phaseStatus === 'pool'));
    assert.equal(st.pulse.activeCompetitors, 8);
  }
});

test('no competitor is ever forgotten: each is logged every day of the slice (50 seeds, both policies)', () => {
  for (const p of ['idle', 'diligent']) {
    const r = L.labReport(Array.from({ length: 50 }, (_, i) => i + 1), L.POLICIES[p]);
    assert.equal(r.forgotten, 0, p);
    assert.equal(r.rates.eliminations, 0);
  }
});

test('at least twelve configurable events, of the six types, each with a cause; the major one has signs and answers', () => {
  assert.ok(EVENTS.length >= 12, `${EVENTS.length} events`);
  assert.deepEqual([...new Set(EVENTS.map((e) => e.type))].sort(), ['district', 'faction', 'global', 'personal', 'targeted', 'tournament']);
  assert.equal(new Set(EVENTS.map((e) => e.id)).size, EVENTS.length);
  for (const e of EVENTS) {
    assert.ok(e.cause.length > 5 && e.outcomes.length > 0, e.id);
    assert.doesNotThrow(() => JSON.stringify(e), 'an event is data');
    if (e.major) { assert.ok(e.major.signs.length >= 1 && e.major.answers.length >= 2, e.id); for (const sg of e.major.signs) assert.ok(EVENTS.some((x) => x.id === sg), sg); }
  }
  // every event fires in some game: over 60 seeds of both policies and the three scripted games of the slice (journal Passe L5)
  const seen = new Set();
  for (const p of ['idle', 'diligent']) for (const g of L.labReport(Array.from({ length: 30 }, (_, i) => 200 + i), L.POLICIES[p]).games) g.events.forEach((id) => seen.add(id));
  for (const sc of Object.values(L.SCRIPTS)) for (const seed of [1842, 7719]) L.autoplay(seed, sc()).state.log.forEach((e) => seen.add(e.id));
  for (const e of EVENTS) assert.ok(seen.has(e.id), `event ${e.id} never fired`);
  // a fired event is logged with its cause
  const st = L.autoplay(1842, L.POLICIES.idle).state;
  for (const ev of st.log.filter((x) => EVENTS.some((e) => e.id === x.id))) assert.equal(ev.cause, EVENTS.find((e) => e.id === ev.id).cause);
});

/** plays to day 2's evening with a won first bout */
function toDay2Evening(seed) {
  let st = G.newGame(seed, 'Aster');
  for (const a of [{ type: 'wait' }, { type: 'wait' }, { type: 'wait' }, { type: 'wait' }]) st = G.advance(st, a).state;
  st = G.advance(st, { type: 'fight', outcome: { winner: 'player', playerHp: 150, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } }).state;
  return st;
}

test('the sabotage chain: causes, two signs before the attempt, the forge burnt when nobody answers, the shop affected, the culprit caught when the watch is paid', () => {
  for (const seed of [1842, 7719, 30417]) {
    const st = toDay2Evening(seed);
    assert.deepEqual([st.day, st.slot], [2, 'evening']);
    assert.ok(st.facts.includes('cassius-resents') && st.facts.includes('lamp-oil') && st.facts.includes('loiterer'), 'both signs come before the night');
    // nobody answers: the forge burns, the steel is scarce, the shop raises its prices
    const burnt = G.advance(st, { type: 'wait' }).state;
    assert.equal(burnt.services.forge, 'sabotaged');
    assert.ok(burnt.facts.includes('forge-burned'));
    assert.equal(burnt.services.shopFactor, 1.4);
    // the watch paid: the attempt fails and the culprit is named and docked
    const paid = G.advance(st, { type: 'payWatch' });
    assert.ok(paid.ok);
    const caught = G.advance(paid.state, { type: 'wait' }).state;
    assert.equal(caught.services.forge, 'open');
    assert.equal(caught.flags['culprit-known'], 'cassius');
    assert.equal(caught.tournament.points.cassius, paid.state.tournament.points.cassius - 3);
  }
  // without the cause (the first bout lost), no sign and no attempt
  let st = G.newGame(1842, 'Aster');
  for (const a of [{ type: 'wait' }, { type: 'wait' }, { type: 'wait' }, { type: 'wait' }]) st = G.advance(st, a).state;
  st = G.advance(st, { type: 'fight', outcome: { winner: 'opponent', playerHp: 0, playerMaxHp: 200, opponentHp: 300, opponentMaxHp: 600, finisher: 'light' } }).state;
  st = G.advance(st, { type: 'wait' }).state;
  assert.equal(st.services.forge, 'open'); assert.ok(!st.facts.includes('lamp-oil'));
});

test('a defeat costs points and reputation, sometimes an injury, never the tournament', () => {
  let st = G.namedState('day2-morning');
  st = G.advance(st, { type: 'wait' }).state;
  const rep = st.player.reputation;
  const lost = G.advance(st, { type: 'fight', outcome: { winner: 'opponent', playerHp: 0, playerMaxHp: 200, opponentHp: 100, opponentMaxHp: 600, finisher: 'heavy' } }).state;
  assert.equal(lost.tournament.points.player, 1, 'a close defeat (the opponent below a quarter) earns a point');
  assert.equal(lost.player.injury, 1, 'knocked down by a heavy blow: hurt');
  assert.ok(lost.player.reputation >= rep - 5);
  assert.ok(!lost.over && lost.tournament.matches.some((m) => m.day === 3 && (m.a === 'player' || m.b === 'player')), 'the next bout stands');
});

test('the TournamentLab is reproducible: two runs over 50 seeds give the same report', () => {
  const seeds = Array.from({ length: 50 }, (_, i) => 1000 + i * 37);
  const a = L.labReport(seeds, L.POLICIES.diligent), b = L.labReport(seeds, L.POLICIES.diligent);
  assert.deepEqual(a, b);
  assert.ok(new Set(a.games.map((g) => g.hash)).size > 40, 'seeds give different games');
  assert.match(a.teamTransition, /outside the slice/);
});

test('every rival has a profile, both rounds pair all eight once', () => {
  for (const r of Object.values(RIVALS)) assert.ok(P.PROFILES[r.profile], r.id);
  for (const r of ROUNDS) assert.deepEqual(r.pairs.flat().sort(), ['player', ...Object.keys(RIVALS)].sort());
});

test('the TournamentLab CLI runs a few seeds and reports no forgotten participant', async () => {
  const { execFileSync } = await import('node:child_process');
  const out = execFileSync(process.execPath, ['tools/tournament-lab.mjs', '--seeds=1..3', '--policy=idle'], { encoding: 'utf8' });
  assert.match(out, /^3 games, policy idle/m);
  assert.match(out, /^forgotten participants 0$/m);
  assert.match(out, /team transition: outside the slice/);
});
