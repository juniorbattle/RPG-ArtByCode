// The game's texts gathered in tables (the operator's decision AV-4, journal Passe V0) and the version 2's flag (AV-2): every key the code
// uses exists in the English table and every key of the table is used; a template's slots are all filled, a missing one throws; the default
// game's texts are word for word those of main before the tables (games' fingerprints, which hold every log text, and a digest of every
// label, refusal and line at every step of the scripted games, pinned from main 3b0c9d5); the version 2's flag: asked by the address, kept by
// the save, the dynamic rules with it, a named state, the TournamentLab's games; without it, nothing of it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { load, ROOT } from './load.mjs';

const T = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const G = await load('/src/simulation/index.ts');
const L = await load('/src/tournament/lab.ts');
const { PEOPLE } = await load('/src/narrative/people.ts');
const { linesOf } = await load('/src/narrative/dialogue.ts');

const lf = (t) => t.replace(/\r\n/g, '\n');
function sources(dir) {
  return fs.readdirSync(path.join(ROOT, dir), { recursive: true }).filter((f) => /\.ts$/.test(f)).map((f) => lf(fs.readFileSync(path.join(ROOT, dir, f), 'utf8')));
}

test('every key the code asks for is in the table, and every key of the table is asked for', () => {
  const src = sources('src').filter((t) => !/^export const EN = \{/m.test(t)).join('\n'), asked = new Set();
  for (const m of src.matchAll(/\btx\(\s*'([^']+)'/g)) asked.add(m[1]);
  assert.ok(asked.size >= 200, `keys asked: ${asked.size}`);
  for (const k of asked) assert.ok(k in EN, `the code asks for "${k}", not in the table`);
  // a key chosen in a ternary (tx(cond ? 'a' : 'b', ...)) is quoted outside a tx( literal: every key of the table is quoted in the code
  for (const k of Object.keys(EN)) assert.ok(src.includes(`'${k}'`), `the table's "${k}" is never asked for`);
});

test('a template fills its slots, refuses a missing value or an unknown key, and never shows its braces', () => {
  assert.equal(T.tx('move.label', { place: 'Lantern Row' }), 'Go to Lantern Row');
  assert.equal(T.tx('clock.slot', { day: 2, slot: 'evening' }), 'Day 2, evening.');
  assert.throws(() => T.tx('move.label'), /no value for \{place\}/);
  assert.throws(() => T.tx('nope.nothing'), /no text "nope\.nothing"/);
  for (const [k, v] of Object.entries(EN)) {
    const slots = [...v.matchAll(/\{(\w+)\}/g)].map((m) => m[1]), vars = Object.fromEntries(slots.map((s) => [s, 'X']));
    assert.doesNotMatch(T.tx(k, vars), /[{}]/, k);
  }
});

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 16);
/** pinned from main 3b0c9d5 before the tables (journal Passe V0): a game's fingerprint holds every text it logged; the digest holds every
 *  action's label and refusal and every person's lines at every step of the scripted games */
const PIN = {
  'classic:idle:1': '14805fe1b9490194', 'classic:idle:2': 'f5aeb8aa6d8b0ed4', 'classic:idle:3': '4078fce319e44fea',
  'classic:diligent:1': '31788dc7caf6340b', 'classic:diligent:2': 'f5ea54d898152bac', 'classic:diligent:3': 'dc2952fecbd0c4a6',
  'dynamic:idle:1': 'b33c7dee1a71d51c', 'dynamic:idle:2': '0d97caace06f1606', 'dynamic:idle:3': '120b7165d2d48314',
  'dynamic:diligent:1': '472ca6feb1519cf7', 'dynamic:diligent:2': '00f0649465024d52', 'dynamic:diligent:3': '6f09e72abf107662',
  'careful:1': '72cf9080aaf54302:f268fbee151095be', 'careful:2': '407ac9614b43d0fb:103727c4be720b97', 'careful:3': '05e19932a7171ebe:103727c4be720b97',
  'careless:1': 'b3f20d3f0470c506:a5f5f22aee9420f3', 'careless:2': '968cab7d0376e051:f389f7a2489769b7', 'careless:3': 'ae00f323ec629457:f389f7a2489769b7',
  'losing:1': '083293beb9cbbacc:6671aa579465669d', 'losing:2': 'cceb8f95f92f22f2:3962d0f19752bd04', 'losing:3': '6842c45d5a120020:871bb613f2d08d34',
  'named:day1-morning': 'dde92e1a48f22ae2', 'named:day1-evening': '25c1cc8149d5410c', 'named:day2-morning': '72dce3cb9efaa185',
  'named:day2-afternoon': '3365dbd4c6fcaafd', 'named:day2-dusk-won': 'e903245bd9d26230', 'named:day2-dusk-lost': '3293dbadedc7a9ba',
  'named:day3-afternoon': 'd3c37431526b839b', 'named:forecourt-morning': '73efc1c0905c7b3f', 'named:forecourt-dusk-lost': '7344c99949f604ae',
  'named:lanterns-night': '48fcda0c09f58964', 'named:slice-end': '921c33c538088003', 'named:trained-day1-evening': '4edfe3fab8cca1b4',
};

test('the default game\'s texts are main\'s word for word: fingerprints and every label, refusal and line, pinned before the tables', () => {
  const got = {};
  for (const rules of ['classic', 'dynamic']) for (const p of ['idle', 'diligent']) for (let s = 1; s <= 3; s++) got[`${rules}:${p}:${s}`] = L.autoplay(s, L.POLICIES[p], 'Ren', 200, rules).hash;
  for (const sc of ['careful', 'careless', 'losing']) for (let s = 1; s <= 3; s++) {
    const pol = L.SCRIPTS[sc](); let st = G.newGame(s, 'Ren'); const texts = [];
    while (!st.over) {
      for (const o of G.actions(st)) texts.push(o.label + '|' + (o.reason ?? ''));
      for (const id of Object.keys(PEOPLE).filter((k) => !PEOPLE[k].v2)) texts.push(id + ':' + linesOf(st, id).join('/'));
      st = G.advance(st, pol.choose(st)).state;
    }
    got[`${sc}:${s}`] = G.hash(st) + ':' + sha(texts.join('\n'));
  }
  for (const n of Object.keys(G.NAMED_STATES)) if (!G.NAMED_STATES[n].v2) got[`named:${n}`] = G.hash(G.namedState(n));
  assert.deepEqual(got, PIN);
});

test('the version 2\'s flag: asked by the address, the dynamic rules with it, kept by the save; absent, nothing of it', () => {
  const get = (q) => { const p = new URLSearchParams(q); return (k) => p.get(k); };
  assert.equal(G.wantsV2(get('play=1&new=1&v2=1')), true);
  assert.equal(G.wantsV2(get('play=1&new=1&v2')), true);
  for (const q of ['play=1&new=1', 'v2=0', 'v2=yes', 'combat=dynamic']) assert.equal(G.wantsV2(get(q)), false, q);
  const plain = G.newGame(1842, 'Ren');
  assert.equal(G.isV2(plain), false);
  assert.equal(plain.flags.v2, undefined);
  const v = G.makeV2(G.newGame(1842, 'Ren'));
  assert.equal(G.isV2(v), true);
  assert.equal(v.flags.combat, 'dynamic');
  const back = G.deserialize(G.serialize(v));
  assert.equal(G.isV2(back), true);
  assert.equal(back.flags.combat, 'dynamic');
  // a named state of the version 2, and the default ones without the flag
  const n = G.namedState('v2-day1-morning');
  assert.equal(G.isV2(n), true);
  for (const k of Object.keys(G.NAMED_STATES)) if (!G.NAMED_STATES[k].v2) assert.equal(G.isV2(G.namedState(k)), false, k);
  // the TournamentLab's version 2 games carry the flag to their end
  const g = L.autoplay(5, L.POLICIES.diligent, 'Ren', 200, 'v2');
  assert.equal(G.isV2(g.state), true);
  assert.equal(g.state.flags.combat, 'dynamic');
});

test('the play mode\'s entry asks the pure flag (play.ts withRules), and only the play mode and the lab set it', () => {
  const play = lf(fs.readFileSync(path.join(ROOT, 'src/ui/play.ts'), 'utf8'));
  assert.match(play, /if \(wantsV2\(\(k\) => params\.get\(k\)\)\) makeV2\(s\);/);
  const setters = sources('src').filter((s) => /\bmakeV2\(/.test(s) && !/export function makeV2/.test(s));
  assert.equal(setters.length, 3, 'play.ts, named.ts and lab.ts');
});
