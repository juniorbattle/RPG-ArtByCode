// The panache (the operator's CL-3 « Renommée seule, comptée sur le script du duel », his sheet https://claude.ai/artifact/3j8cNwctXgmVRB5BHK39td, journal Passes CL1 / CV2;
// src/simulation/v2flair.ts): what the crowd sees of a bout of the tournament, read from the duel's script like Master Corvin's notes, gives fame and nothing else. The oracles are the
// decisions written out here (the counts read from the script's own events, the fame the pulse's shift), not the code's tables.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const FL = await load('/src/simulation/v2flair.ts');
const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const AN = await load('/src/combat/autoNotes.ts');
const ST = await load('/src/combat/stats.ts');
const LAB = await load('/src/tournament/lab.ts');
const REACT = await load('/src/simulation/v2react.ts');
const T = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR_TEXTS } = await load('/src/narrative/text/fr-texts.ts');

const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const day2 = () => G.namedState('v2-day2-afternoon');
const fame = (s) => s.flags['pulse:playerFame'] ?? 0;
const outcome = (won, flair) => ({ winner: won ? 'player' : 'opponent', playerHp: won ? 300 : 0, playerMaxHp: 300, opponentHp: won ? 0 : 400, opponentMaxHp: 900, finisher: 'light', note: { day: 2, foe: 'vessa', kind: 'bout', won, t: 100, dmg: [1, 1, 1], taken: [0, 0, 0], open: [1, 0], breaks: [0, 0], inOpen: 0, skills: [], clashes: 0, advice: { k: 'keep' }, ...(flair ? { flair } : {}) } });
const LEVELS = { t1: 3, t4: 3, k_feint: 3, k_parry: 3, k_iron: 3, d1: 3, s1: 3, m_ironfall: 3 };
const duelOf = (foe, stage, seed, loadout) => {
  const ren = AD.autoRen({ ...ST.REN_BASE, hp: 324, atk: 17, def: 15 }, { loadout, levels: LEVELS }, { weapon: 'imported-blade' });
  const f = AD.autoFoe(foe, AD.autoRaceSheet(foe, stage, 1), { stage });
  const result = AU.autoDuel(ren, f, seed, { log: true });
  return { ren, foe: f, result, note: AN.boutNote(result, ren, f, { day: 4, foe, kind: 'bout' }) };
};

test('the decisions: the exploit in an opening, the interruption and the parry give fame, at most a table\'s cap a bout; no coins, no patrons; the tiers\' bounds are the fame\'s own', () => {
  assert.deepEqual(Object.keys(FL.FLAIR).sort(), ['cap', 'cut', 'exploit', 'parry']);
  assert.ok(FL.FLAIR.exploit >= 1 && FL.FLAIR.cut >= FL.FLAIR.exploit && FL.FLAIR.parry >= FL.FLAIR.exploit, 'the rarer, riskier moves give at least as much as the exploit');
  assert.ok(FL.FLAIR.cap >= FL.FLAIR.cut, 'a bout can give at least one interruption\'s worth');
  assert.deepEqual({ ...REACT.FAME }, { noticed: 25, known: 55, celebrated: 80 }, 'the fame\'s tiers are not the panache\'s to move');
  const p = (e, c, r) => FL.flairPoints({ exploits: e, cuts: c, parries: r });
  assert.equal(p(0, 0, 0), 0);
  assert.equal(p(1, 0, 0), FL.FLAIR.exploit); assert.equal(p(0, 1, 0), FL.FLAIR.cut); assert.equal(p(0, 0, 1), FL.FLAIR.parry);
  assert.equal(p(9, 9, 9), FL.FLAIR.cap, 'never past the cap');
  assert.equal(p(2, 1, 0), Math.min(FL.FLAIR.cap, 2 * FL.FLAIR.exploit + FL.FLAIR.cut));
});

test('a note\'s panache is what the script says: Ren\'s exploits that landed clean, the interruptions he made, the parries he made (126 duels, every path reached)', () => {
  let exploits = 0, cuts = 0, parries = 0, duels = 0;
  for (const foe of Object.keys(ST.RIVAL_SHEETS)) for (const seed of [1, 2, 3, 4, 5, 6, 7, 8, 9]) for (const loadout of [['t4', 'k_feint', 'k_parry', 'k_iron'], ['t1', 't4', 'd1', 's1']]) {
    const { ren, result, note } = duelOf(foe, 1, seed, loadout);
    duels++;
    assert.ok(note.flair && ['exploits', 'cuts', 'parries'].every((k) => Number.isInteger(note.flair[k]) && note.flair[k] >= 0), `${foe} ${seed}: a count each`);
    // the oracles: the cuts and parries from the script's own events, the exploits from the note's clean blows of the exploit-role skills
    const log = result.log, roles = new Map(ren.skills.map((s) => [s.id, s.role]));
    assert.equal(note.flair.cuts, log.filter((e) => e.ev === 'interrupt' && e.who === 'ren').length, `${foe} ${seed}: Ren's interruptions`);
    assert.equal(note.flair.parries, log.filter((e) => e.ev === 'parry' && e.who === 'ren').length, `${foe} ${seed}: Ren's parries`);
    assert.equal(note.flair.exploits, note.skills.filter((s) => roles.get(s.id) === 'exploit').reduce((n, s) => n + s.clean, 0), `${foe} ${seed}: Ren's exploits that landed clean`);
    exploits += note.flair.exploits; cuts += note.flair.cuts; parries += note.flair.parries;
  }
  assert.equal(duels, 7 * 9 * 2);
  assert.ok(exploits >= 30 && cuts >= 5 && parries >= 5, `${exploits} exploits, ${cuts} cuts, ${parries} parries: each path is reached`);
});

test('a bout of the tournament gives its panache to the fame (the pulse\'s shift, the events\' own flag) and says it, won or lost; renown alone: no coins, no reputation', () => {
  const st = day2(), flair = { exploits: 2, cuts: 1, parries: 0 }, pts = FL.flairPoints(flair);
  const won = act(st, { type: 'fight', outcome: outcome(true, flair) }), plain = act(st, { type: 'fight', outcome: outcome(true, null) });
  // (the bout's slot passes: the day's events may add to the fame meanwhile, so each case is read against the same bout without panache)
  assert.equal(fame(won.state) - fame(plain.state), pts, 'the shift is the panache, on top of what the day’s events give'); assert.ok(!plain.events.some((e) => e.id === 'flair'), 'no panache, no line');
  const ev = won.events.find((e) => e.id === 'flair');
  assert.ok(ev && ev.visible && ev.kind === 'consequence', 'said in the log');
  assert.match(ev.text, new RegExp(`exploits in an opening ×2 and interruptions ×1\\. \\+${pts} fame\\.`));
  assert.equal(won.state.player.coins, plain.state.player.coins, 'no coin'); assert.equal(won.state.player.reputation, plain.state.player.reputation, 'no reputation: the crowd\'s fame alone');
  assert.equal(won.state.pulse.playerFame - plain.state.pulse.playerFame, pts, 'the pulse\'s fame reads it once the slot has passed');
  // a defeat too: the crowd cheers a style
  const lost = act(st, { type: 'fight', outcome: outcome(false, { exploits: 0, cuts: 0, parries: 2 }) });
  assert.equal(fame(lost.state) - fame(act(st, { type: 'fight', outcome: outcome(false, null) }).state), Math.min(FL.FLAIR.cap, FL.FLAIR.parry * 2));
  // an empty panache or a note of before: nothing said
  for (const f of [{ exploits: 0, cuts: 0, parries: 0 }, undefined]) { const r = act(st, { type: 'fight', outcome: outcome(true, f) }); assert.ok(!r.events.some((e) => e.id === 'flair')); assert.equal(fame(r.state), fame(plain.state)); }
  // the same state, the same fame (the fingerprint)
  assert.equal(G.hash(act(st, { type: 'fight', outcome: outcome(true, flair) }).state), G.hash(won.state));
  // what the result says is not trusted past a whole number from 0 to 9
  const odd = act(st, { type: 'fight', outcome: outcome(true, { exploits: 1e9, cuts: 'x', parries: -3 }) });
  assert.equal(fame(odd.state) - fame(plain.state), Math.min(FL.FLAIR.cap, 9 * FL.FLAIR.exploit));
  assert.deepEqual(FL.flairOf({ flair: 5 }), null); assert.deepEqual(FL.flairOf({}), null); assert.deepEqual(FL.flairOf(null), null);
});

test('today\'s game, a challenge and a rehearsal give none: the panache is the version 2\'s bouts of the tournament alone', () => {
  const old = G.namedState('day2-afternoon'); assert.ok(!old.flags.v2);
  const r = act(old, { type: 'fight', outcome: outcome(true, { exploits: 3, cuts: 1, parries: 1 }) });
  assert.equal(fame(r.state), fame(act(old, { type: 'fight', outcome: outcome(true, null) }).state)); assert.ok(!r.events.some((e) => e.id === 'flair'));
  const src = (f) => fs.readFileSync(`${ROOT}/${f}`, 'utf8').replace(/\r\n/g, '\n');
  for (const f of ['src/simulation/v2town.ts', 'src/simulation/v2encounter.ts', 'src/simulation/v2prep.ts', 'src/ui/playArena.ts']) assert.doesNotMatch(src(f), /applyFlair/, `${f} gives no panache`);
  assert.equal([...src('src/tournament/pool.ts').matchAll(/applyFlair\(/g)].length, 1, 'the bout\'s result gives it once');
  assert.match(src('src/tournament/pool.ts'), /if \(s\.v2\) applyFlair\(s, o\.note, matchId\(m\), emit\);/);
});

test('whole games: the laboratory\'s planner earns it bout after bout, deterministic; the fame stays the pulse\'s (a thief caught lowers the reputation under it)', () => {
  const a = LAB.autoplay(5, LAB.POLICIES.planner, 'Ren', 320, 'v2'), b = LAB.autoplay(5, LAB.POLICIES.planner, 'Ren', 320, 'v2');
  assert.equal(a.hash, b.hash);
  const events = a.state.log.filter((e) => e.id === 'flair');
  assert.ok(events.length >= 3, `${events.length} bouts with panache`);
  const total = events.reduce((n, e) => n + +/\+(\d+) fame/.exec(e.text)[1], 0);
  assert.ok(a.state.flags['pulse:playerFame'] >= total, 'the events\' own shifts (the parade, the bookmakers) come on top of it');
  assert.ok(events.every((e) => +/\+(\d+) fame/.exec(e.text)[1] <= FL.FLAIR.cap), 'never past the cap a bout');
});

test('the words in both languages, the guide\'s line from the table (no digit of its own), the result page reading the log line', () => {
  const keys = Object.keys(EN).filter((k) => /^(v2\.flair\.|tut\.ch\.renown\.flair)/.test(k));
  assert.equal(keys.length, 5);
  const slots = (t) => [...t.matchAll(/\{(\w+)(?:\|\w+)?\}/g)].map((m) => m[1]).sort().join();
  for (const k of keys) { assert.ok(FR_TEXTS[k], `${k} in French`); assert.equal(slots(FR_TEXTS[k]), slots(EN[k]), `${k}: the same slots`); }
  assert.doesNotMatch(EN['tut.ch.renown.flair'], /\d/); assert.doesNotMatch(FR_TEXTS['tut.ch.renown.flair'], /\d/);
  assert.match(T.tx('v2.flair.earned', { parts: 'a', n: 3 }), /3 fame/); assert.match(FR_TEXTS['v2.flair.earned'], /\{n\} de renommée/);
  const tut = fs.readFileSync(`${ROOT}/src/ui/tutorial.ts`, 'utf8').replace(/\r\n/g, '\n');
  assert.match(tut, /tx\('tut\.ch\.renown\.flair', \{ exploit: FLAIR\.exploit, cut: FLAIR\.cut, parry: FLAIR\.parry, cap: FLAIR\.cap \}\)/);
  // the result page lists the bout's consequence lines: the panache's is one
  const arena = fs.readFileSync(`${ROOT}/src/ui/playArena.ts`, 'utf8');
  assert.match(arena, /e\.kind === 'match' \|\| e\.kind === 'consequence'/);
});
