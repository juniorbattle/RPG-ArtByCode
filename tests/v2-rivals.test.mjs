// Lot L4 of step 5 (journal Passe EVL7; the operator's choices on the EV1 sheet, journal Passe EV2: EV-7 « Les suites des actions, puis un par lieu, puis le
// ciblé », with his note « il faut que cela puisse impacter la preparation du joueur en jouant sur cet aspect imprevisible »; EV-8 « Hors des nouvelles, dans les
// répliques et le son »; EV-9 « Chaque rival se souvient ; deux autres agissent »): the three ambiences out of a version 2 game's news and into its people's words;
// every rival's memory of the player on the board and in words; Master Corvin's lesson after a challenge won; the keepers who remember; the training sand shut the
// morning after a brawl; Sister Anwen busy the evening a rival was hurt; Vessa Lark's tale in Lio's room; Rhosk on the training sand; a friend's warning of
// Cassius's two chains; the curious player answering; today's game offering none of it. The oracles are the rules written out here (the thresholds, the days,
// the places and hours, the words that must be said), not the code's.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import nodeFs from 'node:fs';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const E = await load('/src/events/engine.ts');
const CAT = await load('/src/events/catalog.ts');
const V = await load('/src/events/v2catalog.ts');
const R = await load('/src/simulation/v2rivals.ts');
const I = await load('/src/simulation/v2intel.ts');
const D = await load('/src/narrative/dialogue.ts');
const J = await load('/src/ui/journal.ts');
const LAB = await load('/src/tournament/lab.ts');
const { computePulse } = await load('/src/tournament/pulse.ts');
const { Rng } = await load('/src/core/rng.ts');

/** a named state as a version 2 game (a version 2 state as it is: makeV2 would start its own state again) */
const v2 = (name = 'day1-morning', seed) => { const s = G.namedState(name, seed); return s.flags.v2 === true ? s : G.makeV2(s); };
const act = (st, a, rng) => { const r = G.advance(st, a, rng); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const opt = (st, pred) => G.actions(st).find((o) => pred(o.action));
const at = (st, day, slot, place = st.place) => { const s = structuredClone(st); s.day = day; s.slot = slot; s.place = place; s.pulse = computePulse(s); return s; };
const byId = Object.fromEntries([...CAT.EVENTS, ...V.V2_EVENTS].map((e) => [e.id, e]));
const run = (s, ids) => { const out = []; E.runEvents(s, s.pulse, (e) => { out.push(e); return e; }, new Rng(1), ids.map((id) => byId[id])); return out; };
const W = { type: 'wait' };
const WON = { type: 'fight', outcome: { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } };
const WON_CLEAN = { type: 'fight', outcome: { winner: 'player', playerHp: 190, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } };
const LOST = { type: 'fight', outcome: { winner: 'opponent', playerHp: 0, playerMaxHp: 200, opponentHp: 300, opponentMaxHp: 600, finisher: 'tech' } };
/** a version 2 game played by the script from a new game (seed 1842 unless given) */
const playV2 = (script, seed = 1842) => G.play(G.makeV2(G.newGame(seed, 'Ren')), script);
/** the pool's three bouts won: day 6's morning */
const POOL = [W, W, W, W, WON, W, W, W, W, W, WON, W, W, WON, W];

// ------------------------------------------------------------------------------------------------- EV-8: the ambiences out of the news, into the words

test('the night market, the Colosseum\'s roar and the puppets leave a version 2 game\'s news (their pulse kept), and stay in today\'s', () => {
  const quiet = ['night-market', 'colosseum-roar', 'v2-puppet-show'];
  for (const v of [true, false]) {
    const s = v ? v2() : G.namedState('day1-morning');
    s.day = 4; s.slot = 'afternoon'; s.flags['pulse:festivity'] = 60;
    s.tournament.matches.find((m) => m.day === 2 && (m.a === 'player' || m.b === 'player')).winner = 'player';
    s.pulse = computePulse(s);
    const before = { commerce: s.flags['pulse:commerce'] ?? 0, excitement: s.flags['pulse:excitement'] ?? 0 };
    const out = run(s, quiet.filter((id) => v || !id.startsWith('v2-')));
    assert.equal(out.length, v ? 3 : 2, out.map((e) => e.id).join());
    for (const e of out) assert.equal(e.visible, !v, `${e.id} in ${v ? 'a version 2 game' : 'today\'s game'}`);
    // their pulse: the market +2 commerce, the roar +3 excitement, the puppets +3 festivity
    assert.equal(s.flags['pulse:commerce'] - before.commerce, 2); assert.equal(s.flags['pulse:excitement'] - before.excitement, 3);
  }
  // only those three: every other event of a version 2 game is told
  for (const e of [...CAT.EVENTS, ...V.V2_EVENTS]) assert.equal(!!e.v2quiet, quiet.includes(e.id), e.id);
  // a whole version 2 game: they fired, and never reached the journal
  const g = LAB.autoplay(3, LAB.POLICIES.diligent, 'Ren', 400, 'v2'), st = g.state;
  assert.ok(st.log.some((e) => e.id === 'night-market') && st.log.some((e) => e.id === 'colosseum-roar'));
  assert.ok(st.log.filter((e) => quiet.includes(e.id)).every((e) => !e.visible));
  const told = J.journalDays(st).flatMap((d) => d.slots.flatMap((x) => x.entries));
  assert.ok(!told.some((e) => quiet.includes(e.id)) && told.length > 50);
});

test('the people say them instead: Pip the night market at dusk, one text a day; Wren the puppets after a bout; Sergeant Brann the roar on an afternoon of others\' bouts', () => {
  const base = v2();
  const pip = (day, slot) => D.linesOf(at(base, day, slot, 'lanterns'), 'pip')[0];
  const nights = [1, 2, 3].map((d) => pip(d, 'evening'));
  assert.equal(new Set(nights).size, 3, 'a text a day'); for (const t of nights) assert.match(t, /night market/i);
  assert.doesNotMatch(pip(2, 'afternoon'), /night market/i);
  // Wren: the player's last bout, today or yesterday, won or lost, the opponent named
  const won = playV2([W, W, W, W, WON]), lost = playV2([W, W, W, W, LOST]);
  for (const [s, re] of [[won, /puppet/i], [lost, /puppet/i]]) { const l = D.linesOf(at(s, 2, 'evening', 'lanterns'), 'bard')[0]; assert.match(l, re); assert.match(l, /Vessa Lark/); }
  assert.notEqual(D.linesOf(at(won, 2, 'evening', 'lanterns'), 'bard')[0], D.linesOf(at(lost, 2, 'evening', 'lanterns'), 'bard')[0]);
  assert.match(D.linesOf(at(won, 3, 'afternoon', 'lanterns'), 'bard')[0], /puppet/i, 'the day after');
  assert.doesNotMatch(D.linesOf(at(won, 4, 'afternoon', 'lanterns'), 'bard')[0], /puppet/i, 'two days after: the bout is old news');
  assert.doesNotMatch(D.linesOf(at(base, 1, 'afternoon', 'lanterns'), 'bard')[0], /puppet/i, 'no bout yet');
  // Brann: an afternoon of bouts the player does not fight (the pool's days 2, 4, 5 have them), never a free day (3, 7, 9)
  for (const d of [2, 4, 5]) assert.match(D.linesOf(at(base, d, 'afternoon', 'training'), 'drill')[0], /Colosseum/);
  for (const d of [3, 7, 9]) assert.doesNotMatch(D.linesOf(at(base, d, 'afternoon', 'training'), 'drill')[0], /Colosseum/);
  assert.doesNotMatch(D.linesOf(at(base, 2, 'morning', 'training'), 'drill')[0], /Colosseum/);
});

// ------------------------------------------------------------------------------------------------- EV-9: every rival remembers

/** the stances written out: a grudge from -15 down, a friendship from 25 up, else respect for an honourable or cold rival the player beat */
const STANCE = (rel, temper, beaten) => (rel <= -15 ? 'grudge' : rel >= 25 ? 'friend' : temper !== 'proud' && beaten ? 'respect' : null);

test('every rival\'s stance toward the player, and what it remembers, said on the board with its causes', () => {
  const s = v2();
  const TEMPER = { vessa: 'proud', cassius: 'proud', marek: 'honourable', orla: 'honourable', ilse: 'honourable', tobin: 'honourable', rhosk: 'cold' };
  for (const [who, temper] of Object.entries(TEMPER)) for (const rel of [-40, -15, -14, 0, 24, 25, 60]) for (const beaten of [false, true]) {
    const t = structuredClone(s); t.competitors[who].relationships.player = rel;
    if (beaten) t.competitors[who].knownFacts.push('lost-to:player');
    assert.equal(R.stanceOf(t, who), STANCE(rel, temper, beaten), `${who} ${rel} ${beaten}`);
  }
  // Vessa beaten on day 2: a proud loser falls 15, a grudge; the board says when; « barely touched » when the player kept more than 70 % of its health
  const won = playV2([W, W, W, W, WON]), clean = playV2([W, W, W, W, WON_CLEAN]);
  assert.equal(R.stanceOf(won, 'vessa'), 'grudge');
  assert.equal(R.stanceLine(won, 'vessa'), 'Vessa Lark holds a grudge: beaten by you on day 2.');
  assert.equal(R.stanceLine(clean, 'vessa'), 'Vessa Lark holds a grudge: beaten by you on day 2, barely touched.');
  assert.ok(clean.competitors.vessa.knownFacts.includes('humbled-by:player:2') && !won.competitors.vessa.knownFacts.some((f) => f.startsWith('humbled-by')));
  // today's game keeps no such memory
  const today = G.play(G.newGame(1842, 'Ren'), [W, W, W, W, WON_CLEAN]);
  assert.ok(!today.competitors.vessa.knownFacts.some((f) => f.startsWith('humbled-by')));
  assert.equal(R.stanceLine(today, 'vessa'), null);
  // Orla helped: the cargo, two bouts of sparring, a friend; Cassius jealous of the first win and mocked on the square
  const o = structuredClone(won); o.quests.cargo = 'done'; o.competitors.orla.relationships.player = 40;
  o.log.push({ seq: 900, day: 3, slot: 'morning', kind: 'action', id: 'spar', cause: 'action:spar', text: '', visible: true }, { seq: 901, day: 3, slot: 'afternoon', kind: 'action', id: 'spar', cause: 'action:spar', text: '', visible: true });
  assert.equal(R.stanceLine(o, 'orla'), 'Orla Brask counts you a friend: grateful for the cargo you hauled for Tam and 2 bouts of sparring with you.');
  const c = structuredClone(won); c.flags.taunted = true; c.competitors.cassius.relationships.player = -40; c.facts.push('cassius-resents');
  assert.equal(R.stanceLine(c, 'cassius'), 'Cassius Dree holds a grudge: jealous of your first win and mocked by you on the festival square.');
  // nothing between you: no line
  assert.equal(R.stanceLine(v2(), 'marek'), null);
});

test('the rivals whose arc does not say it speak of it: Ilse, Tobin and Rhosk with respect, Ilse, Tobin and Marek as friends; nobody else, never in today\'s game', () => {
  const s = v2(); s.day = 7; s.slot = 'morning';
  const with_ = (who, rel, beaten) => { const t = structuredClone(s); t.place = who === 'marek' || who === 'vessa' ? 'forecourt' : 'training'; t.competitors[who].relationships.player = rel; if (beaten) t.competitors[who].knownFacts.push('lost-to:player'); return t; };
  const SAYS = { ilse: ['respect', 'friend'], tobin: ['respect', 'friend'], rhosk: ['respect'], marek: ['friend'] };
  for (const who of ['ilse', 'tobin', 'rhosk', 'marek', 'orla', 'vessa', 'cassius']) for (const [rel, beaten, st] of [[10, true, 'respect'], [30, false, 'friend']]) {
    const t = with_(who, rel, beaten), extra = R.stanceWords(t, who);
    assert.equal(!!extra, !!SAYS[who]?.includes(st), `${who} ${st}`);
    if (extra) assert.equal(D.linesOf(t, who).at(-1), extra, `${who}: the line said after the others`);
  }
  const today = G.namedState('day1-morning'); today.competitors.ilse.relationships.player = 30;
  assert.equal(R.stanceWords(today, 'ilse'), null);
});

// ------------------------------------------------------------------------------------------------- EV-7: the actions' consequences, the places' services

test('the keepers remember: a regular (15 or more) and a face to watch (-15 or less) said by Mara, Hilde, Pip and Corvin; today\'s Mara as she was', () => {
  const s = v2();
  const place = { mara: 'district', hilde: 'forecourt', pip: 'lanterns', corvin: 'training' }, slot = { mara: 'morning', hilde: 'morning', pip: 'evening', corvin: 'morning' };
  for (const who of Object.keys(place)) {
    const lines = (g) => { const t = at(s, 2, slot[who], place[who]); t.town[who] = g; return D.linesOf(t, who); };
    assert.equal(lines(15).length, lines(0).length + 1); assert.match(lines(15).at(-1), /10 % off/);
    assert.equal(lines(-15).length, lines(0).length + 1); assert.doesNotMatch(lines(-15).at(-1), /10 % off/);
    assert.equal(lines(14).length, lines(0).length); assert.equal(lines(-14).length, lines(0).length);
  }
  const today = G.namedState('day1-morning'); const before = D.linesOf(today, 'mara'); today.town.mara = 40;
  assert.deepEqual(D.linesOf(today, 'mara'), before);
});

test('the training sand: shut the morning after a brawl at the barracks, open again at noon; Orla still spars; today\'s game drills as before', () => {
  // (day 3, a free day: the afternoon of a bout belongs to the bout)
  const s = at(v2(), 3, 'morning', 'training'); s.flags['brawl:3'] = true;
  for (const a of [{ type: 'train' }, { type: 'drillSkill', skill: 't1' }]) {
    const o = opt(s, (x) => x.type === a.type); assert.ok(o && !o.ok, a.type); assert.match(o.reason, /shut until noon/);
  }
  assert.ok(opt(s, (x) => x.type === 'spar').ok, 'Orla still spars');
  assert.match(D.linesOf(s, 'drill')[0], /black eyes/);
  assert.ok(opt(at(s, 3, 'afternoon'), (x) => x.type === 'train').ok, 'the afternoon');
  assert.ok(opt(at(s, 4, 'morning'), (x) => x.type === 'train').ok, 'the next morning');
  // the brawl writes its morning (src/events/v2catalog.ts: tomorrow)
  const b = at(v2(), 4, 'evening', 'training'); b.flags['pulse:security'] = -30; b.pulse = computePulse(b);
  E.runEvents(b, b.pulse, (e) => e, { fork: () => ({ next: () => 0 }) }, [byId['v2-barracks-brawl']]); assert.ok(b.flags['brawl:5']);
  const today = G.namedState('forecourt-morning'); today.flags['brawl:1'] = true; assert.ok(opt(today, (x) => x.type === 'train').ok);
});

test('Sister Anwen busy the evening a rival was hurt in the afternoon\'s bouts: her care waits for the morning; today\'s healer as she was', () => {
  const s = at(v2(), 2, 'evening', 'forecourt'); s.player.injury = 1; s.player.coins = 50;
  const busy = structuredClone(s); busy.flags['ev:rival-injured'] = 4; // day 2's afternoon is the game's slot 4 (day 1: 0, 1, 2)
  const o = opt(busy, (x) => x.type === 'heal'); assert.ok(!o.ok); assert.match(o.reason, /busy/);
  assert.match(D.linesOf(busy, 'anwen')[0], /first light/);
  assert.ok(opt(at(busy, 3, 'morning'), (x) => x.type === 'heal').ok, 'the morning');
  const other = structuredClone(s); other.flags['ev:rival-injured'] = 1; assert.ok(opt(other, (x) => x.type === 'heal').ok, 'another day\'s');
  const today = G.namedState('forecourt-dusk-lost'); today.flags['ev:rival-injured'] = 4; assert.ok(opt(today, (x) => x.type === 'heal').ok);
});

// ------------------------------------------------------------------------------------------------- EV-9: Vessa Lark's tale

test('Vessa beaten on day 2 pays Lio\'s room that evening: the taverns tell the next morning that Orla is hurt and rusty, seen on the board as rounds paid', () => {
  const dusk = playV2([W, W, W, W, WON]);
  const r = act(dusk, W), st = r.state;
  assert.deepEqual(st.v2.lie, { who: 'orla', from: 3, until: 4 });
  const word = r.events.find((e) => e.id === 'v2-tavern-tale');
  assert.ok(word && word.visible && word.day === 3 && word.slot === 'morning');
  // the rumours speak of training since the operator's CO-7 « Les rumeurs disent « entraînement » » (journal Passe CO3)
  assert.match(word.text, /^In the taverns they say Orla Brask is nursing a wound, and has trained little/);
  assert.doesNotMatch(word.cause, /Vessa/, 'the news does not name who paid');
  assert.match(I.seenInTown(st, 'vessa'), /paid for every round at Lio's/);
  // day 4's evening: the next one, Cassius, until day 5's bout
  const four = G.play(st, [W, W, W, W, WON]);
  const r4 = act(four, W); assert.deepEqual(r4.state.v2.lie, { who: 'cassius', from: 5, until: 5 });
});

test('Vessa tells no tale when she did not lose, holds no grudge, was confronted, on another evening, or when the opponent is already hurt and rusty', () => {
  const tells = (s) => act(s, W).state.v2.lie;
  assert.equal(tells(playV2([W, W, W, W, LOST])), undefined, 'she beat the player');
  const kind = playV2([W, W, W, W, WON]); kind.competitors.vessa.relationships.player = -14; assert.equal(tells(kind), undefined, 'no grudge');
  const shamed = playV2([W, W, W, W, WON]); shamed.flags['confronted:vessa'] = 2; assert.equal(tells(shamed), undefined, 'confronted');
  const weak = playV2([W, W, W, W, WON]); weak.competitors.orla.healthState = 'hurt'; weak.competitors.orla.preparation = 10; assert.equal(tells(weak), undefined, 'a true tale is no lie');
  const half = playV2([W, W, W, W, WON]); half.competitors.orla.healthState = 'hurt'; half.competitors.orla.preparation = 50; assert.ok(tells(half), 'hurt but in form: still a lie');
  const three = G.play(playV2([W, W, W, W, WON]), [W]); delete three.v2.lie; assert.equal(tells(G.play(three, [W, W])), undefined, 'day 3\'s evening');
  // today's game: nothing
  const today = G.play(G.newGame(1842, 'Ren'), [W, W, W, W, WON]); assert.equal(G.advance(today, W).state.v2, undefined);
});

test('Lio\'s room repeats the tale of that rival until the bout, every time; the hooded stranger tells the truth and who paid; Brother Ambrose saw it', () => {
  const st = act(playV2([W, W, W, W, WON]), W).state;
  for (const day of [3, 4]) for (let i = 0; i < 200; i++) {
    const h = I.rumourOf(at(st, day, 'morning'), 'orla', 'lio', new Rng(i));
    assert.deepEqual([h.hp, h.form], ['hurt', 'rusty'], `day ${day}`);
  }
  // after the bout, and of anyone else, the room is as before: right two times in three, never this tale every time
  const after = at(st, 5, 'morning'), other = at(st, 3, 'morning');
  const told = (s, who) => Array.from({ length: 300 }, (_, i) => I.rumourOf(s, who, 'lio', new Rng(i))).filter((h) => h.hp === 'hurt' && h.form === 'rusty').length;
  assert.ok(told(after, 'orla') < 200 && told(other, 'cassius') < 200);
  // the stranger on day 3's evening: the truth of Orla, and who paid for the tale
  const night = at(st, 3, 'evening', 'district'); night.player.coins = 30;
  const s1 = act(night, { type: 'rumour', src: 'stranger' });
  assert.match(s1.events[0].text, /Orla Brask is whole/); assert.match(s1.events[0].text, /A duelist from the river towns paid for it/);
  assert.ok(s1.state.facts.includes('vessa-lie-known'));
  // Brother Ambrose on the festival square (day 3's afternoon): the consequence, the fact, his words
  const sq = v2('v2-tale-day3');
  assert.match(D.linesOf(sq, 'ambrose')[0], /Vessa Lark bought every round at Lio's/);
  const a = act(sq, { type: 'talk', who: 'ambrose' });
  assert.ok(a.events.some((e) => e.id === 'ambrose:witness' && /Vessa Lark/.test(e.text))); assert.ok(a.state.facts.includes('vessa-lie-known'));
  // without a tale, neither says anything of it
  const plain = at(v2(), 3, 'afternoon', 'lanterns'); assert.ok(!act(plain, { type: 'talk', who: 'ambrose' }).state.facts.includes('vessa-lie-known'));
});

test('told to her face before the forecourt, by day, once the player knows: the tale dies, her name pays, she tells no more', () => {
  const st = act(playV2([W, W, W, W, WON]), W).state;
  const fc = at(st, 3, 'morning', 'forecourt');
  assert.equal(opt(fc, (x) => x.type === 'confrontVessa'), undefined, 'not offered before the player knows');
  fc.facts.push('vessa-lie-known');
  assert.ok(!opt(at(fc, 3, 'evening'), (x) => x.type === 'confrontVessa').ok, 'not at night: she is gone');
  const rep = fc.player.reputation, vr = fc.competitors.vessa.reputation, rel = fc.competitors.vessa.relationships.player;
  const r = act(fc, { type: 'confrontVessa' }), s = r.state;
  assert.equal(r.events[0].id, 'vessa:confronted'); assert.match(r.events[0].text, /Orla Brask/);
  assert.equal(s.player.reputation, rep + 3); assert.equal(s.competitors.vessa.reputation, vr - 5); assert.equal(s.competitors.vessa.relationships.player, rel - 5);
  assert.equal(s.v2.lie, undefined); assert.equal(R.taleOf(s), null);
  assert.match(D.linesOf(s, 'vessa')[0], /what was said at Lio's/);
  assert.equal(opt(s, (x) => x.type === 'confrontVessa'), undefined, 'once');
  // day 4's evening: no new tale
  const four = G.play(at(s, 3, 'morning', 'forecourt'), [W, W, W, W, WON]); assert.equal(act(four, W).state.v2.lie, undefined);
});

// ------------------------------------------------------------------------------------------------- EV-9: Rhosk on the training sand

test('Rhosk out of the title takes the training sand on the free day before the player\'s next bout: Corra tells it the night before', () => {
  const st = v2('v2-sand-day9');
  assert.equal(st.competitors.rhosk.phaseStatus, 'gate'); assert.equal(st.day, 9); assert.equal(st.slot, 'morning');
  const sign = st.log.find((e) => e.id === 'v2-rhosk-offer');
  assert.ok(sign && sign.day === 8 && sign.slot === 'evening' && sign.visible && /Corra Dunmere/.test(sign.text) && /training sand tomorrow/.test(sign.text));
  assert.ok(st.flags['sand:9'] && st.facts.includes('rhosk-offer'));
  // the sign's causes, written out: Rhosk at the Gate, the player one of the semi-finals' four, the next bout in exactly two days, nothing cleared yet
  // seed 6 again since the same rules for every fighter (journal Passe SL1; seed 11 from the duel played by the computer, journal Passe LC3, which put Rhosk in the
  // semi-finals' four at seed 6)
  const eve = G.play(G.makeV2(G.newGame(6, 'Ren')), [...POOL, W, WON, W, W, W, W, W, W]); // day 8's evening
  assert.equal(eve.day, 8); assert.equal(eve.slot, 'evening');
  const fires = (mut) => { const s = structuredClone(eve); mut(s); s.pulse = computePulse(s); return run(s, ['v2-rhosk-offer']).length === 1; };
  assert.ok(fires(() => {}));
  for (const status of ['semi', 'third', 'final', 'champion', 'pool']) assert.ok(!fires((s) => { s.competitors.rhosk.phaseStatus = status; }), status);
  assert.ok(!fires((s) => { s.flags['sand-cleared'] = true; }), 'cleared');
  assert.ok(!fires((s) => { s.day = 9; }), 'the bout tomorrow');
  assert.ok(!fires((s) => { s.day = 6; }), 'the bout in four days');
  assert.ok(!fires((s) => { for (const m of s.tournament.matches) if (m.stage === 'semi') { if (m.a === 'player') m.a = 'tobin'; if (m.b === 'player') m.b = 'tobin'; } }), 'not in the bracket\'s four');
  // the semi lost: the third place on day 8, the sand on day 7
  const lost = G.play(G.makeV2(G.newGame(6, 'Ren')), [...POOL, W, LOST, W, W]);
  assert.equal(lost.day, 7); assert.ok(lost.flags['sand:7']);
});

test('on the sand day, by day, the training ground refuses a drill; Orla spars, a challenge won or Hale\'s word clears it; the next day it is free', () => {
  const tr = v2('v2-sand-training');
  for (const a of [{ type: 'train' }, { type: 'drillSkill', skill: 't1' }]) { const o = opt(tr, (x) => x.type === a.type); assert.ok(!o.ok); assert.match(o.reason, /Rhosk/); }
  assert.ok(opt(tr, (x) => x.type === 'spar').ok, 'Orla still spars');
  assert.match(D.linesOf(tr, 'drill')[0], /Northman/); assert.match(D.linesOf(tr, 'rhosk')[0], /sand belongs/);
  assert.ok(opt(at(tr, 9, 'afternoon'), (x) => x.type === 'train').ok === false, 'the whole day');
  assert.ok(opt(at(tr, 10, 'morning'), (x) => x.type === 'train').ok, 'the next day');
  // Hale's word: on the quay, once the plan is known
  const quay = v2('v2-sand-day9');
  assert.match(D.linesOf(quay, 'hale').join(' '), /runner to the registrar/);
  const r = act(quay, { type: 'reportRhosk' }); assert.equal(r.events[0].id, 'rhosk:reported');
  assert.ok(r.state.flags['sand-cleared'] && r.state.competitors.rhosk.reputation === quay.competitors.rhosk.reputation - 5);
  assert.ok(opt(at(r.state, 9, 'morning', 'training'), (x) => x.type === 'train').ok, 'the sand free');
  assert.equal(opt(r.state, (x) => x.type === 'reportRhosk'), undefined, 'once');
  assert.match(D.linesOf(at(r.state, 9, 'morning', 'training'), 'rhosk')[0], /registrar's runner/);
  const blind = structuredClone(quay); blind.facts = blind.facts.filter((f) => f !== 'rhosk-offer'); assert.equal(opt(blind, (x) => x.type === 'reportRhosk'), undefined, 'nothing to act on');
  // a challenge won against him, on the sand day
  const ch = act(tr, { type: 'challenge', who: 'rhosk', stake: 'name' }).state;
  const won = act(ch, { type: 'challengeResult', outcome: WON.outcome });
  assert.ok(won.events.some((e) => e.id === 'rhosk:beaten')); assert.ok(won.state.flags['sand-cleared']);
  // Corra's words at night, while the plan stands
  const night = at(quay, 8, 'evening', 'district'); assert.match(D.linesOf(night, 'corra')[0], /Northman/);
});

// ------------------------------------------------------------------------------------------------- EV-9: a friend warns of Cassius's chains

test('a friend warns of the forge\'s sabotage the afternoon after the hood bought the oil, and of the gear\'s on the eve, by day; nobody without a friend', () => {
  const forge = () => { const s = at(v2(), 3, 'afternoon', 'district'); s.competitors.cassius.relationships.player = -40; s.tournament.matches.find((m) => m.day === 2 && m.a === 'player').winner = 'player'; s.flags['ev:sign-lamp-oil'] = 6; s.pulse = computePulse(s); return s; };
  const plain = forge(); assert.equal(run(plain, ['v2-friend-forge']).length, 0, 'no friend');
  const almost = forge(); for (const who of ['orla', 'ilse', 'tobin', 'marek']) almost.competitors[who].relationships.player = 24; assert.equal(run(almost, ['v2-friend-forge']).length, 0, 'not a friend under 25');
  const FR = { orla: /Orla Brask/, ilse: /Ilse Morrow/, tobin: /Tobin Fenn/, marek: /Marek Varn/ };
  for (const [who, re] of Object.entries(FR)) { const s = forge(); s.competitors[who].relationships.player = 25; const out = run(s, ['v2-friend-forge']); assert.equal(out.length, 1, who); assert.match(out[0].text, re); assert.match(out[0].text, /Hale's watch/); assert.ok(s.facts.includes('friend-warned-forge')); }
  const both = forge(); both.competitors.orla.relationships.player = 30; both.competitors.marek.relationships.player = 30; assert.match(run(both, ['v2-friend-forge'])[0].text, /Orla/, 'Orla first');
  for (const mut of [(s) => { s.slot = 'morning'; }, (s) => { s.flags['ev:forge-sabotage'] = 5; }, (s) => { s.services.forge = 'sabotaged'; }, (s) => { delete s.flags['ev:sign-lamp-oil']; }, (s) => { s.competitors.cassius.relationships.player = 0; }]) {
    const s = forge(); s.competitors.orla.relationships.player = 30; mut(s); s.pulse = computePulse(s); assert.equal(run(s, ['v2-friend-forge']).length, 0);
  }
  // the gear: day 5 by day among the pool's best four; day 7 or 9 with a semi-final played and a bout tomorrow; not day 6 nor 8
  const gear = (day, slot) => { const s = at(v2(), day, slot, 'forecourt'); s.competitors.cassius.relationships.player = -40; s.competitors.orla.relationships.player = 30; s.flags['ev:v2-sign-armourer'] = 9; s.tournament.points.player = 9; s.pulse = computePulse(s); return s; };
  for (const slot of ['morning', 'afternoon']) { const out = run(gear(5, slot), ['v2-friend-gear']); assert.equal(out.length, 1, slot); assert.match(out[0].text, /Clerk Odo before dusk/); }
  assert.equal(run(gear(5, 'evening'), ['v2-friend-gear']).length, 0, 'not at dusk: Odo has gone');
  const done = gear(5, 'morning'); done.flags['tamper-done'] = true; assert.equal(run(done, ['v2-friend-gear']).length, 0);
  const lowly = gear(5, 'morning'); lowly.tournament.points.player = 0; for (const id of ['vessa', 'orla', 'cassius', 'marek', 'ilse']) lowly.tournament.points[id] = 9; lowly.pulse = computePulse(lowly); assert.equal(run(lowly, ['v2-friend-gear']).length, 0, 'out of the four');
  const semi = (day, next) => { const s = gear(day, 'morning'); s.tournament.matches.push({ round: 4, a: 'player', b: 'marek', winner: 'marek', close: false, day: 6, seen: true, stage: 'semi' }); if (next) s.tournament.matches.push({ round: 5, a: 'player', b: 'ilse', winner: null, close: false, day: next, seen: true, stage: 'third' }); s.pulse = computePulse(s); return s; };
  assert.equal(run(semi(7, 8), ['v2-friend-gear']).length, 1, 'the eve of the third place');
  assert.equal(run(semi(8, 8), ['v2-friend-gear']).length, 0, 'the bout\'s own day');
  assert.equal(run(semi(7, null), ['v2-friend-gear']).length, 0, 'no bout tomorrow');
  assert.equal(run(semi(6, 8), ['v2-friend-gear']).length, 0, 'day 6');
});

// ------------------------------------------------------------------------------------------------- the curious player, today's game

test('the curious player tells Hale of Rhosk\'s plan before the sand day, and takes a friend\'s warning as a sign of its chain', () => {
  let signs = 0;
  // the seeds re-read since the same rules for every fighter (journal Passe SL1): the sign on seeds 4, 11 and 12 among these (6, 9, 12 and 13 from the duel
  // played by the computer, journal Passe LC3, to then)
  for (const seed of [4, 6, 7, 11, 12, 13]) {
    const st = LAB.autoplay(seed, LAB.POLICIES.curious, 'Ren', 400, 'v2').state;
    const sign = st.log.find((e) => e.id === 'v2-rhosk-offer');
    if (!sign) continue;
    signs++;
    const rep = st.log.find((e) => e.id === 'rhosk:reported');
    assert.ok(rep && rep.seq > sign.seq && (rep.day === sign.day || rep.day === sign.day + 1), `seed ${seed}: reported`);
  }
  assert.ok(signs >= 2, `${signs} games with the sign`);
  // the policy reads the friends' warnings among its signs (src/tournament/lab.ts)
  const src = nodeFs.readFileSync(new URL('../src/tournament/lab.ts', import.meta.url), 'utf8');
  assert.match(src, /'friend-warned-forge'/); assert.match(src, /'friend-warned-gear'/);
});

test('today\'s game offers none of it: no confrontation, no report of Rhosk, no tale, no sand, no stance words', () => {
  for (const name of Object.keys(G.NAMED_STATES).filter((n) => !G.NAMED_STATES[n].v2)) {
    const st = G.namedState(name);
    for (const place of ['district', 'forecourt', 'lanterns']) {
      const s = structuredClone(st); s.place = place; s.facts.push('vessa-lie-known', 'rhosk-offer'); s.flags[`sand:${s.day}`] = true;
      assert.ok(!G.actions(s).some((o) => o.action.type === 'confrontVessa' || o.action.type === 'reportRhosk'), `${name} ${place}`);
      assert.equal(R.sandRefusal(s), null); assert.equal(R.anwenBusy(s), false);
    }
  }
});
