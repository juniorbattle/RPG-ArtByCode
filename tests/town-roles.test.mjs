// The town's people in game roles (journal Passe L4): the steel cargo quest that changes a bout, Mara's shop and its prices (a shortage, her
// favour), day and night (who is there, what is open), the sabotage's answers (the watch kept, the informant, the report, the repair, the
// merchant's blade), the healer, scouting and the future recruit; every person has words in every slot they are there; and the title
// screen's « Explore the district » is today's town path, untouched.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const R = await load('/src/simulation/roles.ts');
const { linesOf } = await load('/src/narrative/dialogue.ts');
const { PEOPLE } = await load('/src/narrative/people.ts');
const { matchSheetFor, sheetData } = await load('/src/combat/match.ts');

const ok = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${JSON.stringify(a)}: ${r.reason}`); return r.state; };
const no = (st, a, re) => { const r = G.advance(st, a); assert.equal(r.ok, false, JSON.stringify(a)); if (re) assert.match(r.reason, re); return r; };
const WIN = { type: 'fight', outcome: { winner: 'player', playerHp: 150, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } };

test('the steel cargo: Tam asks, the watch releases, the crate is hauled, Bram tempers the blade, and the bout\'s data change', () => {
  let st = G.newGame(1842, 'Aster');
  no(st, { type: 'haul' }, /no crate|Sergeant Hale/);
  st = ok(st, { type: 'talk', who: 'tam' });
  assert.equal(st.quests.cargo, 'asked');
  no(st, { type: 'haul' }, /Sergeant Hale must sign/);
  st = ok(st, { type: 'askPapers' });
  st = ok(st, { type: 'haul' });   // a slot: day 1 afternoon
  assert.deepEqual([st.quests.cargo, st.slot], ['delivered', 'afternoon']);
  const coins = st.player.coins;
  st = ok(st, { type: 'temper' });   // day 1 evening
  assert.ok(st.player.items.includes('tempered-blade'));
  assert.equal(st.player.coins, coins - 10);
  st = ok(st, { type: 'wait' }); st = ok(st, { type: 'wait' });   // day 2 afternoon: the bout
  const d = sheetData(matchSheetFor(st));
  assert.equal(d.actions.light.damage, Math.round(10 * 1.15), 'the tempered blade: +15 % damage in the bout');
});

test('Mara\'s shop: open by day, shut at night, prices raised by the shortage, lowered by her favour', () => {
  let st = G.newGame(1842, 'Aster');
  assert.equal(R.priceOf(st, 'imported-blade'), 30);
  st = ok(st, { type: 'restock' });   // the morning's crates: her goodwill
  assert.ok(st.flags['discount:mara'], 'merchant-favour fires from her goodwill');
  assert.equal(R.priceOf(st, 'imported-blade'), 27);
  st = ok(st, { type: 'wait' });   // evening
  no(st, { type: 'buy', item: 'whetstone' }, /shut for the night/);
  // the sabotage's shortage: the shop's factor 1.4
  const s2 = structuredClone(st); s2.services.shopFactor = 1.4; s2.slot = 'morning';
  assert.equal(R.priceOf(s2, 'imported-blade'), Math.round(30 * 1.4 * 0.9));
  assert.equal(R.priceOf(s2, 'salve'), 9, 'the salve is not steel');
});

test('day and night change who is there: the smith by day, the informant at night, Bram gone from a ruined forge', () => {
  const morning = G.newGame(1842, 'Aster'), evening = G.namedState('day1-evening');
  assert.ok(G.advance(morning, { type: 'talk', who: 'bram' }).ok);
  no(evening, { type: 'talk', who: 'bram' }, /not around/);
  no(morning, { type: 'talk', who: 'stranger' }, /not around/);
  assert.ok(G.advance(evening, { type: 'talk', who: 'stranger' }).ok);
  const ruined = structuredClone(morning); ruined.services.forge = 'sabotaged';
  no(ruined, { type: 'talk', who: 'bram' }, /ruin/);
  no(evening, { type: 'repair' }, /working/);
  const ruinedNight = structuredClone(evening); ruinedNight.services.forge = 'sabotaged';
  no(ruinedNight, { type: 'repair' }, /in the dark/);
});

/** day 2's evening after a won first bout: the chain's causes hold, both signs seen */
function chainEvening(seed = 1842) {
  let st = G.newGame(seed, 'Aster');
  for (let i = 0; i < 4; i++) st = ok(st, { type: 'wait' });
  return ok(st, WIN);
}

test('the sabotage\'s answers: the watch kept by the player, the informant\'s name, the report, the repair and the merchant\'s blade', () => {
  const ev = chainEvening();
  assert.ok(ev.facts.includes('lamp-oil') && ev.facts.includes('loiterer'));
  // keeping watch oneself (a slot) foils the attempt and names the culprit
  const kept = ok(ev, { type: 'keepWatch' });
  assert.equal(kept.services.forge, 'open'); assert.equal(kept.flags['culprit-known'], 'cassius');
  // no answer: the forge burns; the informant names the paymaster at night, the watch docks him
  let burnt = ok(ev, { type: 'wait' });
  assert.equal(burnt.services.forge, 'sabotaged');
  no(burnt, { type: 'report' });
  burnt = ok(ok(burnt, { type: 'wait' }), WIN);   // day 3's bout, then its evening
  burnt = ok(burnt, { type: 'nightfall' });
  const before = burnt.tournament.points.cassius, coins = burnt.player.coins;
  burnt = ok(burnt, { type: 'buyInfo' });
  assert.equal(burnt.flags['culprit-known'], 'cassius');
  burnt = ok(burnt, { type: 'report' });
  assert.equal(burnt.tournament.points.cassius, before - 3);
  assert.equal(burnt.player.coins, coins - 10 + 15);
  // the morning after the fire: the repair (a slot) or Mara's imported blade, at the shortage's price
  const morning = ok(ev, { type: 'wait' });
  assert.deepEqual([morning.day, morning.slot, morning.services.shopFactor], [3, 'morning', 1.4]);
  const fixed = ok(morning, { type: 'repair' });
  assert.equal(fixed.services.forge, 'repaired');
  const rich = structuredClone(morning); rich.player.coins = 60;
  const bought = ok(rich, { type: 'buy', item: 'imported-blade' });
  assert.equal(bought.player.coins, 60 - 42);
  assert.ok(bought.player.items.includes('imported-blade'));
});

test('the forecourt: registration, the healer (paid or free), scouting (the bout\'s assistance and intel), Orla the future recruit', () => {
  let st = ok(G.newGame(1842, 'Aster'), { type: 'move', to: 'forecourt' });
  st = ok(st, { type: 'register' });
  no(st, { type: 'heal' }, /not hurt/);
  st = ok(st, { type: 'scout', who: 'vessa' });   // afternoon
  st = ok(st, { type: 'spar' });   // evening
  assert.ok(st.facts.includes('orla-introduced') === false, 'not talked to her yet');
  assert.ok((st.competitors.orla.relationships.player ?? 0) >= 25 && st.facts.includes('orla-recruitable'));
  st = ok(ok(st, { type: 'wait' }), { type: 'wait' });   // day 2 afternoon
  const sh = matchSheetFor(st);
  assert.equal(sh.assist, 'full'); assert.equal(sh.intel.length, 2);
  // hurt after a lost bout: Anwen heals (8 coins), free once Ilse gives her purse
  const hurt = G.namedState('day2-dusk-lost');
  assert.equal(hurt.player.injury, 1);
  const f = ok(ok(hurt, { type: 'nightfall' }), { type: 'move', to: 'forecourt' });
  const healed = ok(f, { type: 'heal' });
  assert.equal(healed.player.injury, 0); assert.equal(healed.player.coins, f.player.coins - (f.flags['free-care'] ? 0 : 8));
});

test('every person has words in every slot they are there, and the people\'s options are theirs', () => {
  for (const name of ['day1-morning', 'day1-evening', 'day2-afternoon', 'day2-dusk-won', 'day2-dusk-lost', 'day3-afternoon']) {
    for (const place of ['district', 'forecourt']) {
      const st = structuredClone(G.namedState(name)); st.place = place;
      for (const p of Object.values(PEOPLE).filter((x) => x.place === place)) {
        if (!G.advance(st, { type: 'talk', who: p.id }).ok) continue;
        const lines = linesOf(st, p.id);
        assert.ok(lines.length > 0 && lines.every((l) => l.length > 8), `${p.id} in ${name}`);
      }
    }
  }
  for (const o of G.actions(G.newGame(1, 'A'))) {
    const by = R.offeredBy(o.action);
    if (by && by !== 'forge') assert.ok(PEOPLE[by], `${o.action.type} offered by ${by}`);
  }
});

test('« Explore the district » runs today\'s town path at midday (decision L7-6a, journal Passe D9): main.ts\'s startTown is main d129433\'s, called with time=midday only', () => {
  // line endings normalised: a Windows checkout (core.autocrlf) has CRLF on disk, `git show` gives the index's LF (journal Passe Q3)
  const lf = (t) => t.replace(/\r\n/g, '\n');
  const now = lf(fs.readFileSync(path.join(ROOT, 'src/main.ts'), 'utf8'));
  let base;
  try { base = lf(execFileSync('git', ['show', 'd129433:src/main.ts'], { cwd: ROOT, encoding: 'utf8' })); } catch { base = null; }
  const fn = (src) => src.slice(src.indexOf('function startTown(): void {'));
  assert.match(now, /m\.showTitle\(\{ explore: exploreByDay \}\)/);
  // the button's day: midday, set only when the address names no state, then the town path itself
  const day = now.slice(now.indexOf('function exploreByDay(): void {'), now.indexOf('async function startArena'));
  assert.match(day, /^function exploreByDay\(\): void \{\n  if \(!params\.has\('time'\)\) params\.set\('time', 'midday'\);\n  label\.textContent = 'PAINTING THE DAY\.\.\.';\n  startTown\(\);\n\}\n/);
  assert.match(now, /const title = params\.get\('title'\) === '1' \|\| \(location\.search === '' && !navigator\.webdriver\);/);
  if (base) {
    assert.equal(fn(now), fn(base), 'startTown is unchanged');
    // everything before the dispatch (the loading screen) is unchanged too
    const head = (src) => src.slice(0, src.indexOf('// ?'));
    assert.equal(head(now), head(base));
    assert.equal(now.slice(now.indexOf('async function startArena'), now.indexOf('function startTown')), base.slice(base.indexOf('async function startArena'), base.indexOf('function startTown')), 'startArena is unchanged');
  }
});

test('Lantern Row (journal Passe L6): open at night only; the tavern\'s talk takes the evening; Cassius mocked, or named once the culprit is known', () => {
  no(G.newGame(1842, 'Aster'), { type: 'move', to: 'lanterns' }, /sleeps until dusk/);
  let st = ok(G.namedState('day1-evening'), { type: 'move', to: 'lanterns' });
  assert.equal(st.place, 'lanterns');
  const rel = st.competitors.cassius.relationships.player;
  st = ok(st, { type: 'taunt' });
  assert.equal(st.competitors.cassius.relationships.player, rel - 15);
  no(st, { type: 'taunt' });
  no(st, { type: 'confront' }, /no proof/);
  const heard = ok(st, { type: 'listen' });
  assert.deepEqual([heard.day, heard.slot], [2, 'morning']);
  assert.ok(heard.facts.includes('tavern-talk'));
  const known = structuredClone(st); known.flags['culprit-known'] = 'cassius';
  const named = ok(known, { type: 'confront' });
  assert.equal(named.competitors.cassius.reputation, known.competitors.cassius.reputation - 10);
});

test('the forecourt\'s walking atlas adds the hero\'s walk; without it the duel\'s atlas is unchanged', async () => {
  const F = await load('/src/arena/FighterArt.ts');
  const duel = F.buildArenaAtlas(1842, 5), walk = F.buildArenaAtlas(1842, 5, 'marek', true);
  const keys = [...walk.atlas.frames.keys()].filter((k) => k.startsWith('ren/side/walk.'));
  assert.ok(keys.length >= 4, `${keys.length} walk frames`);
  assert.equal([...duel.atlas.frames.keys()].filter((k) => k.startsWith('ren/side/walk.')).length, 0);
  assert.equal(duel.atlas.frameCount + keys.length, walk.atlas.frameCount);
});
