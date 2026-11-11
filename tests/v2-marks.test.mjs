// The people worth talking to (the operator's MK1 sheet, journal Passe MK2, eleven of eleven: MK-3 « Trois sortes, trois formes du losange, la sorte dite dans
// l’invite de près », MK-4 « Ce qui est neuf depuis la dernière conversation avec la personne », MK-5 « Elle part à l’ouverture du dialogue, revient avec une
// nouveauté », MK-6 « Ni l’observation des rivaux ni la foule », MK-10 « Les quatre lieux d’une partie ; Explore sans marque ni carte ; v2=0 inchangé »). The
// oracles are the decisions written out here: who offers what at a given moment, read from the game's own refusals and offers, not from the marks' table.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const M = await load('/src/simulation/v2marks.ts');
const O = await load('/src/simulation/v2offers.ts');
const LAB = await load('/src/tournament/lab.ts');
const B = await load('/src/ui/bubbles.ts');
const TUT = await load('/src/ui/tutorial.ts');
const TXT = await load('/src/narrative/text/index.ts');

const v2 = () => G.makeV2(G.namedState('day1-morning'));
const at = (st, place, slot, day) => { const s = structuredClone(st); s.place = place; s.slot = slot; if (day) s.day = day; return s; };
const talk = (st, who) => { const r = G.advance(st, { type: 'talk', who }); assert.ok(r.ok, `talk ${who}: ${r.reason}`); return r.state; };
const marks = (st) => Object.fromEntries(M.peopleMarks(st));

test('the first morning on the quay: Mara has something to buy and her crates to unload, an item; the crowd never (MK-3, MK-6)', () => {
  const st = v2(), m = marks(st);
  assert.equal(m.mara, 'item', 'her stall and her morning crates');
  assert.ok(!('folk' in m), 'the passers-by of the crowd wear no mark');
  const mara = M.offersHere(st).find((o) => o.who === 'mara');
  assert.ok(mara.offers.some((o) => o.key === 'work:1'), 'today\'s job, keyed by its day');
});

test('a person offering an event and an item wears the event (the strongest first): Lio in the evening, his rumour and his room (MK-3)', () => {
  const st = at(v2(), 'lanterns', 'evening'), lio = M.offersHere(st).find((o) => o.who === 'lio');
  assert.ok(lio, 'Lio is in his room in the evening');
  const kinds = new Set(lio.offers.map((o) => o.kind));
  assert.ok(kinds.has('item') && kinds.has('event'), `his job and his rumour: ${JSON.stringify(lio.offers)}`);
  assert.equal(marks(st).lio, 'event');
});

test('watching a rival train never marks, in any moment of whole games (MK-6)', () => {
  let scouted = 0;
  for (const seed of [1, 2, 3]) {
    let st = G.newGame(seed, 'Ren'); G.makeV2(st);
    const pol = LAB.POLICIES.curious;
    for (let i = 0; i < 400 && !st.over; i++) {
      for (const place of ['district', 'forecourt', 'training', 'lanterns']) {
        const s = at(st, place, st.slot);
        scouted += G.actions(s).filter((o) => o.ok && o.action.type === 'scout').length;
        for (const o of M.offersHere(s)) {
          assert.ok(!o.offers.some((x) => x.key.startsWith('scout:')), `${o.who} marked for being watched`);
          assert.notEqual(o.who, 'folk');
        }
      }
      const r = G.advance(st, pol.choose(st)); assert.ok(r.ok, r.reason); st = r.state;
    }
  }
  assert.ok(scouted > 0, 'the games offered rivals to watch (the test reaches the case)');
});

test('the mark leaves when the dialogue opens and comes back with something new: the next day\'s job (MK-4, MK-5)', () => {
  const st = v2();
  assert.equal(marks(st).mara, 'item');
  const after = talk(st, 'mara');
  assert.ok(!('mara' in marks(after)), 'seen: no mark');
  assert.ok(after.v2.$seen.mara.includes('work:1'), 'what she offered is kept as seen');
  // the same morning of the next day: her crates again, a new offer
  const next = at(after, 'district', 'morning', 2);
  assert.equal(marks(next).mara, 'item', 'the next day\'s job marks her again');
  assert.deepEqual(M.offersHere(next).find((o) => o.who === 'mara').offers.filter((o) => !after.v2.$seen.mara.includes(o.key)).map((o) => o.key), ['work:2']);
});

test('what was seen is saved with the game and left out of its fingerprint (MK-5)', () => {
  const st = v2(), after = talk(st, 'mara');
  const bare = structuredClone(after); delete bare.v2.$seen;
  assert.equal(G.hash(after), G.hash(bare), 'the fingerprint ignores what was seen');
  const back = G.deserialize(G.serialize(after));
  assert.deepEqual(back.v2.$seen, after.v2.$seen, 'the save keeps it');
  assert.ok(!('mara' in marks(back)), 'a reloaded page shows no mark on her');
});

test('a challenge comes back new after the cut, a day\'s offer the next day; an item by what it names (offerKey)', () => {
  assert.notEqual(O.offerKey({ day: 3 }, { type: 'challenge', who: 'orla' }), O.offerKey({ day: 6 }, { type: 'challenge', who: 'orla' }));
  assert.equal(O.offerKey({ day: 3 }, { type: 'challenge', who: 'orla' }), O.offerKey({ day: 5 }, { type: 'challenge', who: 'orla' }));
  assert.notEqual(O.offerKey({ day: 1 }, { type: 'rumour', src: 'lio' }), O.offerKey({ day: 2 }, { type: 'rumour', src: 'lio' }));
  assert.equal(O.offerKey({ day: 1 }, { type: 'shopBuy', shop: 'hilde', item: 'mail' }), O.offerKey({ day: 7 }, { type: 'shopBuy', shop: 'hilde', item: 'mail' }));
});

test('what talking itself changes is a follow-up: Lady Edda, who knows the cut strap (MK-3)', () => {
  const st = G.namedState('v2-strap-day7');
  assert.ok(st.facts.includes('tamper-suffered') && !st.flags['culprit-known'], 'the state the witness answers');
  let found = null;
  for (const slot of ['morning', 'afternoon']) { const s = at(st, 'forecourt', slot); const e = M.offersHere(s).find((o) => o.who === 'edda'); if (e) { found = { s, e }; break; } }
  assert.ok(found, 'Lady Edda stands on the forecourt by day');
  assert.ok(found.e.offers.some((o) => o.key === 'talk:edda' && o.kind === 'follow'));
  assert.equal(marks(found.s).edda, 'follow');
  assert.ok(!('edda' in marks(talk(found.s, 'edda'))), 'heard: the follow-up is spent');
});

test('today\'s game marks nobody (MK-10)', () => {
  const st = G.namedState('day1-morning');
  assert.ok(!G.isV2(st));
  assert.equal(M.peopleMarks(st).size, 0);
  assert.equal(M.offersHere(st).length, 0);
});

test('Explore\'s bubbles: none at the start, E\'s goes with its timer and gives the pose back (MK-1)', () => {
  const keeper = { bubble: 'dots', anim: 'talk' }, porter = { bubble: null, anim: 'idle' }, guard = { bubble: 'dots', anim: 'idle' };
  const sys = { actors: [keeper, porter, guard], talkTimer: 0 };
  const tick = B.quietBubbles(sys);
  assert.equal(keeper.bubble, null); assert.equal(guard.bubble, null);
  // E next to the porter: the district's actors give him the bubble and the talking pose while the timer runs
  sys.talkTimer = 2.5; porter.bubble = 'dots'; porter.anim = 'talk'; tick();
  assert.equal(porter.bubble, 'dots', 'shown while the timer runs');
  sys.talkTimer = 0; tick();
  assert.equal(porter.bubble, null, 'gone with the timer');
  assert.equal(porter.anim, 'idle', 'his pose given back');
  assert.equal(keeper.anim, 'talk', 'the keeper keeps the pose she always had');
});

// The ways out (the operator's four cards of journal Passe MK5): the guide's line (MK-15) in both languages; the chevrons, the grey shut way and the arrival's card
// are DOM over the scene, proven in a browser (journal Passe MK6)
test('the guide\'s « The Cité and its squares » says what a chevron is, grey when shut, and the plan for the ways unseen (MK-15)', () => {
  const st = v2(), ch = TUT.CHAPTERS.find((c) => c.id === 'places');
  const en = TUT.chapterText(st, ch);
  assert.match(en, /chevron/); assert.match(en, /grey chevron/i); assert.match(en, /top right corner/);
  assert.ok(en.endsWith(TXT.tx('tut.ch.places.ways')), 'a line after the chapter\'s own text');
});
