// The game's headless core (src/simulation/, journal Passe L1): determinism by seed and action script, saves reloaded mid-game equal to
// the continued game, slot costs (a minor action takes none, a significant one takes one, a refused one changes nothing), the save
// format's refusals, the fingerprint against an independent BigInt FNV-1a, the named states, and two structural rules: the game's
// modules stay pure (no three, DOM, Math.random or clock) and the default path (src/main.ts) imports none of them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const { fnv64, canonical } = await load('/src/simulation/canonical.ts');

const PURE_DIRS = ['src/simulation', 'src/tournament', 'src/combat', 'src/events', 'src/narrative'];
/** pure modules outside those folders that the game may import */
const PURE_EXTRA = ['src/core/rng.ts', 'src/arena/CombatSim.ts'];

function filesUnder(dir) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { recursive: true }).filter((f) => /\.ts$/.test(f)).map((f) => path.join(dir, f).split(path.sep).join('/'));
}
const stripComments = (src) => src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`])\/\/.*$/gm, '$1');
/** the static imports of a module (`import ... from '...'` and `export ... from '...'`; not `import(...)`), resolved to repo paths */
function staticImports(file) {
  const src = stripComments(fs.readFileSync(path.join(ROOT, file), 'utf8'));
  const out = [];
  for (const m of src.matchAll(/^\s*(?:import|export)\s[^;]*?\sfrom\s+['"]([^'"]+)['"]/gm)) out.push(m[1]);
  for (const m of src.matchAll(/^\s*import\s+['"]([^'"]+)['"]/gm)) out.push(m[1]);
  return out.map((spec) => {
    if (!spec.startsWith('.')) return spec;
    const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), spec.replace(/\?.*$/, '')));
    for (const c of [base, `${base}.ts`, `${base}/index.ts`]) if (fs.existsSync(path.join(ROOT, c)) && fs.statSync(path.join(ROOT, c)).isFile()) return c;
    return base;
  });
}

test('the game modules are pure: no three, no DOM, no Math.random, no clock, and they import only pure modules', () => {
  const files = PURE_DIRS.flatMap(filesUnder);
  assert.ok(files.length >= 5, `game modules found: ${files.length}`);
  const banned = [/\bfrom\s+['"]three['"]/, /\bdocument\s*[.[]/, /\bwindow\s*[.[]/, /\bglobalThis\b/, /\blocalStorage\b/, /Math\.random/, /Date\.now/, /new\s+Date\b/, /performance\.now/, /requestAnimationFrame/, /setTimeout/];
  for (const f of files) {
    const src = stripComments(fs.readFileSync(path.join(ROOT, f), 'utf8'));
    for (const b of banned) assert.ok(!b.test(src), `${f} uses ${b}`);
    for (const imp of staticImports(f)) {
      const ok = PURE_EXTRA.includes(imp) || PURE_DIRS.some((d) => imp.startsWith(`${d}/`));
      assert.ok(ok, `${f} imports ${imp}, outside the pure modules`);
    }
  }
});

test('the default path (src/main.ts and everything it imports statically) reaches none of the game modules', () => {
  const seen = new Set(), todo = ['src/main.ts'];
  while (todo.length) {
    const f = todo.pop();
    if (seen.has(f)) continue;
    seen.add(f);
    if (!f.startsWith('src/') || !f.endsWith('.ts')) continue;
    for (const i of staticImports(f)) if (i.startsWith('src/')) todo.push(i);
  }
  assert.ok(seen.has('src/app/App.ts'), 'the crawl reaches the town');
  // of the interface, only the loading screen and the design system it is built from (journal Passe UI4): no screen of the play mode
  const loadingScreen = (f) => f === 'src/ui/loading.ts' || f.startsWith('src/ui/design/') || f.startsWith('src/ui/fonts/');
  assert.ok(seen.has('src/ui/loading.ts'), 'the crawl reaches the loading screen');
  for (const f of seen) assert.ok(!PURE_DIRS.some((d) => f.startsWith(`${d}/`)) && (!f.startsWith('src/ui/') || loadingScreen(f)), `the default path imports ${f}`);
});

/** duel results handed in by the arena (fixed here: the arena's own tests play the duels) */
const WIN = { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' };
const LOSS = { winner: 'opponent', playerHp: 0, playerMaxHp: 200, opponentHp: 150, opponentMaxHp: 800, finisher: 'heavy' };
/** a fixed script over the whole slice: moves, talks, refusals, training, rest attempts, waits, the two duels */
const SCRIPT = [
  { type: 'talk', who: 'mara' }, { type: 'move', to: 'forecourt' }, { type: 'talk', who: 'odo' }, { type: 'rest' }, { type: 'train' },
  { type: 'talk', who: 'anwen' }, { type: 'train' },
  { type: 'move', to: 'district' }, { type: 'talk', who: 'stranger' }, { type: 'wait' },
  { type: 'talk', who: 'tam' }, { type: 'fight', outcome: WIN }, { type: 'wait' },
  { type: 'wait' }, { type: 'fight', outcome: WIN },
  { type: 'move', to: 'forecourt' }, { type: 'train' }, { type: 'wait' },
  { type: 'move', to: 'lanterns' }, { type: 'talk', who: 'lio' }, { type: 'wait' },
  { type: 'wait' }, { type: 'fight', outcome: LOSS },
  { type: 'wait' }, { type: 'wait' },
];

function playScript(seed, onStep) {
  let st = G.newGame(seed, 'Aster'), refused = 0;
  for (const a of SCRIPT) {
    const r = G.advance(st, a);
    if (!r.ok) refused++;
    st = r.state;
    onStep?.(st);
  }
  return { st, refused };
}

test('the same seed and script give the same fingerprint (three seeds); different seeds differ', () => {
  const hashes = [];
  for (const seed of [1842, 7719, 30417]) {
    const a = playScript(seed), b = playScript(seed);
    assert.equal(G.hash(a.st), G.hash(b.st), `seed ${seed}`);
    assert.ok(a.st.over, 'the script plays the slice to its end');
    assert.equal(a.st.step, SCRIPT.length - a.refused, 'every applied action is counted (the random streams follow it)');
    hashes.push(G.hash({ ...a.st, seed: 0 }));
  }
  // the seeds diverge beyond the seed itself: the rivals' bouts and activities differ
  assert.equal(new Set(hashes).size, 3);
});

test('a save at every step, reloaded and continued, equals the continued game', () => {
  const ref = playScript(7719).st;
  let st = G.newGame(7719, 'Aster');
  for (const a of SCRIPT) {
    st = G.deserialize(G.serialize(st));
    st = G.advance(st, a).state;
  }
  assert.equal(G.serialize(st), G.serialize(ref));
  assert.equal(G.hash(st), G.hash(ref));
});

test('a minor action takes no slot, a significant one takes one, a refused one changes nothing', () => {
  const st = G.newGame(1842, 'Aster'), before = G.serialize(st);
  const talk = G.advance(st, { type: 'talk', who: 'mara' });
  assert.ok(talk.ok);
  assert.deepEqual([talk.state.day, talk.state.slot], [1, 'morning']);
  const move = G.advance(talk.state, { type: 'move', to: 'forecourt' });
  assert.deepEqual([move.state.day, move.state.slot, move.state.place], [1, 'morning', 'forecourt']);
  const train = G.advance(move.state, { type: 'train' });
  assert.deepEqual([train.state.day, train.state.slot, train.state.player.training], [1, 'afternoon', 1]);
  // refused: nobody to talk to at night, resting unhurt, an unknown action; the state object comes back as it was
  for (const [s0, a] of [[st, { type: 'rest' }], [st, { type: 'fly' }], [G.namedState('day1-evening'), { type: 'talk', who: 'bram' }], [st, { type: 'move', to: 'district' }]]) {
    const h = G.hash(s0), r = G.advance(s0, a);
    assert.equal(r.ok, false, `${a.type} refused`);
    assert.ok(typeof r.reason === 'string' && r.reason.length > 3);
    assert.equal(r.state, s0); assert.equal(r.events.length, 0); assert.equal(G.hash(s0), h);
  }
  assert.equal(G.serialize(st), before, 'advance never mutates its input');
  // the evening rolls over to the next morning; nine significant actions end the slice
  let s = st;
  for (let i = 0; i < 9; i++) {
    assert.equal(s.over, false);
    const fight = s.slot === 'afternoon' && s.day >= 2;
    if (fight) assert.match(G.advance(s, { type: 'wait' }).reason, /bout is this afternoon/);
    s = G.advance(s, fight ? { type: 'fight', outcome: LOSS } : { type: 'wait' }).state;
  }
  assert.equal(s.over, true);
  assert.equal(G.actions(s).length, 0);
  assert.equal(G.advance(s, { type: 'wait' }).ok, false);
});

test('actions() lists refused options with their reason, and costs agree with advance', () => {
  const st = G.namedState('day1-evening');
  const opts = G.actions(st);
  const bram = opts.find((o) => o.action.type === 'talk' && o.action.who === 'bram');
  assert.ok(bram && !bram.ok && /not around/.test(bram.reason));
  // day and night change who is there (PROJECT § 8.1): the informant talks at night only, the smith by day only
  assert.ok(opts.find((o) => o.action.type === 'talk' && o.action.who === 'stranger')?.ok);
  for (const s of ['day1-morning', 'day2-morning']) assert.equal(G.advance(G.namedState(s), { type: 'talk', who: 'stranger' }).ok, false, s);
  assert.ok(G.advance(G.namedState('day1-morning'), { type: 'talk', who: 'bram' }).ok);
  for (const o of opts.filter((x) => x.ok)) {
    const r = G.advance(st, o.action);
    assert.ok(r.ok);
    assert.equal(G.slotNumber(r.state) - G.slotNumber(st), o.cost, o.label);
  }
});

test('the save format refuses other files, newer versions and damaged states with a readable reason', () => {
  const st = G.newGame(5, 'Aster'), good = JSON.parse(G.serialize(st));
  assert.throws(() => G.deserialize('not json'), /not JSON/);
  assert.throws(() => G.deserialize('{"kind":"other"}'), /not a Cité du Tournoi save/);
  assert.throws(() => G.deserialize(JSON.stringify({ ...good, schemaVersion: G.SCHEMA_VERSION + 1 })), /newer version/);
  assert.throws(() => G.deserialize(JSON.stringify({ ...good, state: { ...good.state, day: 9 } })), /damaged/);
  assert.throws(() => G.deserialize(JSON.stringify({ ...good, state: { ...good.state, content: 'other' } })), /damaged/);
  assert.equal(G.hash(G.deserialize(JSON.stringify(good))), G.hash(st));
});

test('the fingerprint is FNV-1a 64 of the canonical text (BigInt reference), independent of key order', () => {
  const ref = (s) => { let h = 0xcbf29ce484222325n; for (let i = 0; i < s.length; i++) { h ^= BigInt(s.charCodeAt(i)); h = (h * 0x100000001b3n) & 0xffffffffffffffffn; } return h.toString(16).padStart(16, '0'); };
  for (const s of ['', 'a', 'foobar', 'Cité du Tournoi', JSON.stringify(G.newGame(1, 'É'))]) assert.equal(fnv64(s), ref(s), JSON.stringify(s).slice(0, 30));
  assert.equal(fnv64('a'), 'af63dc4c8601ec8c');   // the published FNV-1a 64 test vector
  assert.equal(canonical({ b: 1, a: [2, { d: 3, c: 4 }] }), canonical({ a: [2, { c: 4, d: 3 }], b: 1 }));
  const reversed = (v) => (v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).reverse().map((k) => [k, reversed(v[k])])) : Array.isArray(v) ? v.map(reversed) : v);
  const st = playScript(30417).st, shuffled = reversed(st);
  assert.notEqual(JSON.stringify(shuffled), JSON.stringify(st));
  assert.equal(G.hash(shuffled), G.hash(st));
  assert.throws(() => canonical({ x: NaN }), /non-finite/);
});

test('every named state is reachable by its script; the name is cleaned', () => {
  for (const name of Object.keys(G.NAMED_STATES)) {
    const a = G.namedState(name), b = G.namedState(name);
    assert.equal(G.hash(a), G.hash(b), name);
  }
  assert.throws(() => G.namedState('nope'), /no named state/);
  assert.equal(G.cleanName('  Ser <b>Aster</b>   the Bold!!  '), 'Ser bAsterb the Bold');
  assert.equal(G.cleanName('   '), 'Ren');
  assert.equal(G.cleanName('A'.repeat(40)).length, 20);
});
