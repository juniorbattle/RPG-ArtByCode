// Lot L6 of step 5, the festival of day 9 (the operator's EV-14 « Un festival le jour 9, conçu sur une fiche à part » and the festival's sheet, journal Passe EVL11,
// nine of nine at the recommendation: FE-1 « La Lanterne de Tête » ... FE-9). Each oracle is written here, never read back from the module: the crowd's lanterns
// by renown (0 / 3 / 6 / 12 at 25 / 55 / 80, half with one or two marks, none wanted), each person of the town and the reason that sends their lantern behind the
// player, House Dree's six, the three good turns and what each brings, walking behind another rival, the order and its reward at dusk, the board, the words, the
// way shut on the parade's evening, the parade played live and Wren's verse at the crowning. The default game has none of it.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const F = await load('/src/simulation/v2festival.ts');
const S = await load('/src/narrative/v2story.ts');
const D = await load('/src/narrative/dialogue.ts');
const T = await load('/src/narrative/text/index.ts');
const B = await load('/src/ui/board.ts');
const L = await load('/src/tournament/lab.ts');

const WON = { type: 'fight', outcome: { winner: 'player', playerHp: 900, playerMaxHp: 2200, opponentHp: 0, opponentMaxHp: 3000, finisher: 'heavy' } };
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type} on day ${st.day} ${st.slot}: ${r.reason}`); return r.state; };
const v2 = () => G.makeV2(G.namedState('day1-morning'));
const ORDER = ['morning', 'afternoon', 'evening'];
function playTo(day, slot, s = v2()) {
  while (s.day < day || (s.day === day && ORDER.indexOf(s.slot) < ORDER.indexOf(slot))) { const w = G.advance(s, { type: 'wait' }); s = w.ok ? w.state : act(s, WON); }
  return s;
}
const at = (s, place) => (s.place === place ? s : act(s, { type: 'move', to: place }));
const BASE = playTo(9, 'morning');
/** day 9's morning on the festival square, every reason to honour the player taken away, the rivals' renown and the player's fame as given (the pulse set with them:
 *  the pure functions read it, and an advance would compute the same from the reputation) */
function day9({ fame = 0, rep = {}, place = 'lanterns', slot = 'morning' } = {}) {
  const s = structuredClone(BASE);
  s.place = place; s.slot = slot; s.town = {}; s.log = []; s.facts = []; s.quests.cargo = 'asked'; s.services.forge = 'open';
  for (const f of ['reported', 'culprit-known', 'confronted', 'pulse:playerFame']) delete s.flags[f];
  s.tournament.matches = s.tournament.matches.map((m) => ({ ...m, winner: m.winner === 'player' && (m.a === 'marek' || m.b === 'marek') ? (m.a === 'player' ? m.b : m.a) : m.winner }));
  delete s.v2.lie; delete s.v2.festival; s.v2.marks = 0; s.v2.gear.armour = null; s.v2.gear.bag = [];
  s.player.reputation = fame; s.pulse.playerFame = fame; s.player.coins = 60;
  for (const id of Object.keys(s.competitors)) s.competitors[id].reputation = rep[id] ?? 0;
  return s;
}
const total = (ls) => ls.reduce((n, l) => n + l.n, 0);
const people = (s, id) => F.corteges(s)[id].filter((l) => l.who).map((l) => l.who).sort();
const crowd = (s, id) => total(F.corteges(s)[id].filter((l) => !l.who && (l.why === 'v2.fest.why.crowd' || l.why === 'v2.fest.why.crowdWary')));

test('the crowd: the player\'s by fame, a rival\'s by reputation, at 25 / 55 / 80: 0, 3, 6, 12; one or two marks in Hale\'s ledger halve it, three none', () => {
  for (const [fame, n] of [[0, 0], [24, 0], [25, 3], [54, 3], [55, 6], [79, 6], [80, 12], [100, 12]]) {
    assert.equal(crowd(day9({ fame }), 'player'), n, `fame ${fame}`);
    assert.equal(crowd(day9({ rep: { orla: fame } }), 'orla'), n, `Orla's reputation ${fame}`);
  }
  for (const [marks, n] of [[0, 12], [1, 6], [2, 6], [3, 0]]) { const s = day9({ fame: 90 }); s.v2.marks = marks; assert.equal(crowd(s, 'player'), n, `${marks} marks`); }
  const s = day9({ fame: 60 }); s.v2.marks = 1;
  assert.deepEqual(F.corteges(s).player, [{ who: null, n: 3, why: 'v2.fest.why.crowdWary' }]);
});

test('the town\'s people: each honours a rival, or nobody, until the reason the game shows sends their lantern behind the player', () => {
  const base = day9();
  // nobody's reason: Master Corvin and Sergeant Brann behind last year's champion, Sister Anwen and Brother Ambrose behind the Temple's knight, Tam and Bram behind the
  // docks' own, Pip behind the farm boy; Lio behind nobody; House Dree's six hirelings
  assert.deepEqual(people(base, 'marek'), ['corvin', 'drill']);
  assert.deepEqual(people(base, 'ilse'), ['ambrose', 'anwen']);
  assert.deepEqual(people(base, 'orla'), ['bram', 'tam']);
  assert.deepEqual(people(base, 'tobin'), ['pip']);
  for (const id of ['player', 'vessa', 'rhosk']) assert.deepEqual(people(base, id), [], id);
  assert.deepEqual(F.corteges(base).cassius, [{ who: null, n: 6, why: 'v2.fest.why.bought' }]);
  assert.equal(total(F.corteges(base).player), 0);
  // Vessa's tale paid to Lio's room (lot L4): Lio walks behind her
  { const s = day9(); s.v2.lie = { who: 'vessa', from: 3, until: 6 }; assert.deepEqual(people(s, 'vessa'), ['lio']); }
  // each reason, one at a time: who moves behind the player, from whom, and the words of the reason
  const cases = [
    ['corvin', 'marek', 'v2.fest.why.pupil', (s) => { s.town.corvin = 15; }, (s) => { s.town.corvin = 14; }],
    ['ambrose', 'ilse', 'v2.fest.why.flame', (s) => { s.v2.festival = { deeds: ['flame'] }; }, null],
    ['tam', 'orla', 'v2.fest.why.cargo', (s) => { s.quests.cargo = 'delivered'; }, (s) => { s.quests.cargo = 'asked'; }],
    ['tam', 'orla', 'v2.fest.why.cargo', (s) => { s.quests.cargo = 'done'; }, null],
    ['bram', 'orla', 'v2.fest.why.forge', (s) => { s.services.forge = 'repaired'; }, (s) => { s.services.forge = 'sabotaged'; }],
    ['lio', null, 'v2.fest.why.house', (s) => { s.town.lio = 10; }, (s) => { s.town.lio = 9; }],
    ['lio', null, 'v2.fest.why.house', (s) => { s.v2.festival = { deeds: ['round'] }; }, null],
    ['pip', 'tobin', 'v2.fest.why.regular', (s) => { s.town.pip = 15; }, (s) => { s.town.pip = 14; }],
    ['mara', null, 'v2.fest.why.regular', (s) => { s.town.mara = 15; }, (s) => { s.town.mara = 14; }],
    ['hilde', null, 'v2.fest.why.regular', (s) => { s.town.hilde = 15; }, (s) => { s.town.hilde = 14; }],
    ['edda', null, 'v2.fest.why.edda', (s) => { s.v2.gear.bag = ['knight-hauberk']; }, null],
    ['edda', null, 'v2.fest.why.edda', (s) => { s.flags.reported = true; s.flags['culprit-known'] = 'cassius'; s.facts.push('tamper-found'); }, (s) => { s.flags.reported = true; s.flags['culprit-known'] = 'cassius'; }],
    ['aldric', null, 'v2.fest.why.hauberk', (s) => { s.v2.gear.armour = 'knight-hauberk'; }, (s) => { s.v2.gear.armour = 'mail-shirt'; }],
    ['lucan', null, 'v2.fest.why.marek', (s) => { s.tournament.matches.push({ a: 'player', b: 'marek', winner: 'player', day: 2, stage: 'pool' }); }, (s) => { s.tournament.matches.push({ a: 'player', b: 'marek', winner: 'marek', day: 2, stage: 'pool' }); }],
    ['lucan', null, 'v2.fest.why.marek', (s) => { s.log.push({ id: 'challenge:won', cause: 'challenge:marek' }); }, null],
    ['kell', null, 'v2.fest.why.sand', (s) => { s.log.push({ id: 'challenge:won', cause: 'challenge:kell' }); }, (s) => { s.log.push({ id: 'challenge:lost', cause: 'challenge:kell' }); }],
    ['piers', null, 'v2.fest.why.sand', (s) => { s.log.push({ id: 'challenge:won', cause: 'challenge:piers' }); }, (s) => { s.log.push({ id: 'challenge:won', cause: 'challenge:kell' }); }],
    ['corra', null, 'v2.fest.why.sand', (s) => { s.log.push({ id: 'challenge:won', cause: 'challenge:corra' }); }, null],
  ];
  for (const [who, from, why, yes, no] of cases) {
    const s = day9(); yes(s);
    assert.ok(F.corteges(s).player.some((l) => l.who === who && l.n === 1 && l.why === why), `${who}: behind the player (${why})`);
    if (from) assert.ok(!people(s, from).includes(who), `${who}: no longer behind ${from}`);
    if (no) { const t = day9(); no(t); assert.ok(!people(t, 'player').includes(who), `${who}: not yet`); }
  }
  // Sergeant Brann and Sister Anwen never move, whatever the player did
  const all = day9({ fame: 90 }); all.town = { corvin: 50, lio: 50, pip: 50, mara: 50, hilde: 50, drill: 50, anwen: 50 }; all.v2.festival = { deeds: ['flame', 'round', 'hang'] };
  assert.deepEqual(people(all, 'marek'), ['drill']); assert.deepEqual(people(all, 'ilse'), ['anwen']);
});

test('House Dree buys Cassius six lanterns, out once he is unmasked before the town (his man caught, Hale told, shamed on the square); the culprit known to the player alone keeps them', () => {
  const six = (s) => F.corteges(s).cassius.filter((l) => l.why === 'v2.fest.why.bought').reduce((n, l) => n + l.n, 0);
  assert.equal(six(day9()), 6);
  { const s = day9(); s.flags['culprit-known'] = 'cassius'; assert.equal(six(s), 6, 'known to the player alone'); }
  { const s = day9(); s.facts.push('saboteur-caught'); assert.equal(six(s), 0, 'caught'); }
  { const s = day9(); s.flags.reported = true; s.flags['culprit-known'] = 'cassius'; assert.equal(six(s), 0, 'reported'); }
  { const s = day9(); s.flags.confronted = true; assert.equal(six(s), 0, 'confronted'); }
});

test('the good turns: on the festival square on day 9 only, the hall\'s lanterns in the morning and Ambrose\'s flame in the afternoon (a slot each), a round at Lio\'s (10 coins, no slot); each once, each three lanterns', () => {
  const offered = (s) => G.actions(s).filter((o) => o.action.type === 'festDeed').map((o) => o.action.deed).sort();
  assert.deepEqual(offered(day9()), ['hang', 'round']);
  assert.deepEqual(offered(day9({ slot: 'afternoon' })), ['flame', 'round']);
  assert.deepEqual(offered(day9({ slot: 'evening' })), []);
  assert.deepEqual(offered(day9({ place: 'forecourt' })), []);
  { const s = day9(); s.day = 8; assert.deepEqual(offered(s), []); assert.equal(G.advance(s, { type: 'festDeed', deed: 'hang' }).reason, T.tx('v2.fest.notToday')); }
  assert.equal(G.advance(day9(), { type: 'festDeed', deed: 'flame' }).reason, T.tx('v2.fest.notNow'));
  // the hall's lanterns: a slot, three porters behind the player, once
  const h = act(day9(), { type: 'festDeed', deed: 'hang' });
  assert.equal(h.slot, 'afternoon'); assert.equal(h.player.coins, 60);
  assert.deepEqual(F.corteges(h).player, [{ who: null, n: 3, why: 'v2.fest.why.porters' }]);
  assert.ok(h.log.some((e) => e.id === 'fest:hang' && e.text === T.tx('v2.fest.deedLog.hang', { n: 3 })), 'the log says it');
  // Brother Ambrose's flame: a slot, he and two pilgrims (he leaves the Temple's knight)
  const f = act(h, { type: 'festDeed', deed: 'flame' });
  assert.equal(f.slot, 'evening');
  assert.equal(total(F.corteges(f).player), 6); assert.deepEqual(people(f, 'ilse'), ['anwen']);
  // a round at Lio's: 10 coins, no slot, Lio and two regulars; once; a thin purse refused
  const r = act(day9(), { type: 'festDeed', deed: 'round' });
  assert.equal(r.slot, 'morning'); assert.equal(r.player.coins, 50); assert.equal(total(F.corteges(r).player), 3);
  assert.equal(G.advance(r, { type: 'festDeed', deed: 'round' }).reason, T.tx('v2.fest.done'));
  { const s = day9(); s.player.coins = 9; assert.equal(G.advance(s, { type: 'festDeed', deed: 'round' }).reason, T.tx('v2.fest.poor', { n: 10 })); }
  // the label says what it brings now: three, or two when Lio already walks behind the player
  const label = (s, d) => G.actions(s).find((o) => o.action.type === 'festDeed' && o.action.deed === d).label;
  assert.equal(label(day9(), 'round'), T.tx('v2.fest.deed.round', { n: 3 }));
  { const s = day9(); s.town.lio = 12; assert.equal(label(s, 'round'), T.tx('v2.fest.deed.round', { n: 2 })); }
  assert.equal(label(day9(), 'hang'), T.tx('v2.fest.deed.hang', { n: 3 }));
  // the price tag is the game's: 10 coins for the round, nothing for the others
  assert.deepEqual(G.actions(day9()).filter((o) => o.action.type === 'festDeed').map((o) => [o.action.deed, o.coins]).sort(), [['hang', 0], ['round', 10]]);
});

test('walking behind another rival (L4-6 at the festival): told to them in person, all but Cassius; the player\'s lanterns join theirs; told again, back to one\'s own', () => {
  const s = day9({ place: 'training', fame: 60 });
  const listed = G.actions(s).filter((o) => o.action.type === 'walkBehind').map((o) => o.action.who).sort();
  assert.deepEqual(listed, ['ilse', 'orla', 'rhosk', 'tobin']);
  const b = act(s, { type: 'walkBehind', who: 'tobin' });
  assert.equal(b.v2.festival.behind, 'tobin'); assert.equal(b.slot, 'morning');
  assert.equal(total(F.corteges(b).player), 0);
  assert.equal(total(F.corteges(b).tobin), 1 + 6, 'Pip and the player\'s crowd');
  assert.equal(G.advance(b, { type: 'walkBehind', who: 'tobin' }).ok, false);
  assert.deepEqual(G.actions(b).filter((o) => o.action.type === 'walkOwn').map((o) => o.action.who), ['tobin']);
  const own = act(b, { type: 'walkOwn', who: 'tobin' });
  assert.equal(own.v2.festival.behind, undefined); assert.equal(total(F.corteges(own).player), 6);
  // never Cassius; never another day
  { const c = day9({ place: 'training' }); c.day = 8; assert.equal(G.advance(c, { type: 'walkBehind', who: 'orla' }).reason, T.tx('v2.fest.notToday')); }
  { const c = day9({ place: 'training', slot: 'evening' }); assert.equal(G.advance(c, { type: 'walkBehind', who: 'orla' }).ok, false, 'not after dusk'); }
  assert.equal(G.advance(day9(), { type: 'walkBehind', who: 'cassius' }).ok, false);
  assert.equal(F.V2_FESTIVAL_ACTIONS.walkBehind.check(day9(), { type: 'walkBehind', who: 'cassius' }), T.tx('v2.fest.notHim'));
});

test('dusk: the longest cortege opens the parade; the player: 30 coins, +5 reputation, +10 fame (the pulse\'s shift); a rival: +5 reputation; equal, the greater renown, then the roster', () => {
  // the player at the head: fame 90 (12), Mara and Hilde regulars, the three good turns (9): 23 against Marek's 12 + 2
  let s = day9({ fame: 90, rep: { marek: 90 }, slot: 'afternoon' }); s.town = { mara: 15, hilde: 15 }; s.v2.festival = { deeds: ['hang', 'flame', 'round'] }; s.player.reputation = 90;
  assert.deepEqual(F.paradeOrder(s).slice(0, 2), [{ id: 'player', n: 12 + 2 + 3 + 3 + 3 }, { id: 'marek', n: 12 + 2 }]);
  const d = act(s, { type: 'wait' });
  assert.equal(d.v2.festival.leader, 'player'); assert.equal(d.v2.festival.lanterns.player, 23); assert.equal(d.v2.festival.lanterns.marek, 14);
  assert.equal(d.player.coins, 60 + 30); assert.equal(d.player.reputation, 95); assert.equal(d.flags['pulse:playerFame'], 10);
  assert.equal(d.pulse.playerFame, 100, '95 + 10, held at 100');
  const lead = d.log.find((e) => e.id === 'v2-lantern-lead');
  assert.equal(lead.text, T.tx('v2.fest.lead.you', { n: 23, purse: 30 })); assert.equal(lead.cause, T.tx('v2.fest.cause'));
  // once: the next slots leave it as it is
  const e = act(d, { type: 'wait' }); assert.equal(e.player.coins, 90); assert.equal(e.log.filter((x) => x.id === 'v2-lantern-lead').length, 1);
  // a rival at the head: its reputation, the player nothing
  s = day9({ fame: 30, rep: { marek: 85, ilse: 60 }, slot: 'afternoon' }); s.player.reputation = 30;
  const r = act(s, { type: 'wait' });
  assert.equal(r.v2.festival.leader, 'marek'); assert.equal(r.competitors.marek.reputation, 90); assert.equal(r.player.coins, 60); assert.equal(r.player.reputation, 30);
  assert.equal(r.log.find((x) => x.id === 'v2-lantern-lead').text, T.tx('v2.fest.lead.rival', { name: 'Marek Varn', n: 14 }));
  // equal counts: the greater renown; equal renown: the roster's order (the player first)
  const tie = (fame, marek) => { const t = day9({ fame, rep: { marek } }); t.town = { mara: 15, hilde: 15 }; t.flags.confronted = true; return F.paradeOrder(t)[0].id; };
  assert.equal(tie(60, 60), 'player'); assert.equal(tie(60, 61), 'marek'); assert.equal(tie(61, 60), 'player');
  // the default game: no dusk
  const def = G.namedState('day1-morning'); def.day = 9; def.slot = 'afternoon';
  const dd = G.advance(def, { type: 'wait' }); assert.ok(dd.ok); assert.equal(dd.state.v2, undefined); assert.ok(!dd.state.log.some((x) => x.id === 'v2-lantern-lead'));
});

test('dusk, the player walking behind a rival: that rival a friend (25 at least), +3 reputation, no purse even when that cortege leads; the gift said', () => {
  // behind Tobin (0 reputation, Pip): with the player's crowd of 12 and three good turns he still trails Marek (14): a friend, not a leader
  let s = day9({ fame: 90, rep: { marek: 90 }, slot: 'afternoon', place: 'training' }); s.player.reputation = 90; s.competitors.tobin.relationships.player = -10;
  s = act(s, { type: 'walkBehind', who: 'tobin' });
  const d = act(s, { type: 'wait' });
  assert.equal(d.v2.festival.leader, 'marek'); assert.equal(d.v2.festival.lanterns.tobin, 1 + 12); assert.equal(d.v2.festival.lanterns.player, 0);
  assert.equal(d.competitors.tobin.relationships.player, 25, 'from -10: at least the friendship\'s 25');
  assert.equal(d.player.reputation, 93); assert.equal(d.player.coins, 60);
  assert.equal(d.log.find((x) => x.id === 'v2-lantern-gift').text, T.tx('v2.fest.gift', { name: 'Tobin Fenn' }));
  // behind Orla with a crowd that makes her lead: no purse for the player, her reputation, the gift's lead
  let o = day9({ fame: 90, rep: { marek: 60 }, slot: 'afternoon', place: 'training' }); o.player.reputation = 90; o.competitors.orla.relationships.player = 30;
  o = act(o, { type: 'walkBehind', who: 'orla' });
  const od = act(o, { type: 'wait' });
  assert.equal(od.v2.festival.leader, 'orla'); assert.equal(od.player.coins, 60); assert.equal(od.competitors.orla.relationships.player, 55);
  assert.equal(od.competitors.orla.reputation, 5);
  assert.equal(od.log.find((x) => x.id === 'v2-lantern-lead').text, T.tx('v2.fest.lead.gift', { name: 'Orla Brask', n: 2 + 12 }));
  assert.ok(!od.log.some((x) => x.id === 'v2-lantern-gift'), 'the lead says it');
});

test('the board (T): each fighter\'s lanterns tonight and their reasons on day 9, the parade\'s result after; the rule on day 9 only', () => {
  const s = day9({ fame: 60 }); s.town.mara = 15;
  assert.equal(F.festivalLine(s, 'player'), T.tx('v2.fest.board.tonight', { n: 7, list: [T.tx('v2.fest.board.group', { n: 6, why: T.tx('v2.fest.why.crowd') }), T.tx('v2.fest.board.person', { name: 'Mara', why: T.tx('v2.fest.why.regular') })].join('; ') }));
  assert.equal(F.festivalLine(s, 'vessa'), T.tx('v2.fest.board.none', { name: 'Vessa Lark' }));
  { const t = structuredClone(s); t.day = 8; assert.equal(F.festivalLine(t, 'player'), null); }
  const b = act({ ...structuredClone(s), place: 'training' }, { type: 'walkBehind', who: 'orla' });
  assert.equal(F.festivalLine(b, 'player'), T.tx('v2.fest.board.behind', { name: 'Orla Brask' }));
  // after dusk: led, walked, gave; and still on day 10
  const d = act(day9({ fame: 90, slot: 'afternoon' }), { type: 'wait' });
  assert.equal(F.festivalLine(d, 'player'), T.tx('v2.fest.board.led', { n: 12 }));
  assert.equal(F.festivalLine(d, 'tobin'), T.tx('v2.fest.board.walked', { n: 1 }));
  const ten = structuredClone(d); ten.day = 10; assert.equal(F.festivalLine(ten, 'player'), T.tx('v2.fest.board.led', { n: 12 }));
  const g = act(act(day9({ fame: 30, rep: { marek: 90 }, slot: 'afternoon', place: 'training' }), { type: 'walkBehind', who: 'ilse' }), { type: 'wait' });
  assert.equal(F.festivalLine(g, 'player'), T.tx('v2.fest.board.gave', { name: 'Ilse Morrow' }));
  // the rule: day 9 alone
  const rule = T.tx('v2.fest.rule', { purse: 30, rep: 5, fame: 10 });
  assert.ok(B.rulesHtml(s).includes(rule)); { const t = structuredClone(s); t.day = 8; assert.ok(!B.rulesHtml(t).includes(rule)); }
  assert.ok(!B.rulesHtml(G.namedState('day1-morning')).includes(rule));
  assert.equal(F.festivalLine(G.namedState('day1-morning'), 'player'), null);
});

test('the words on day 9: Wren tells the custom, a person says whom their lantern walks behind and what would change it, a rival counts their cortege; nothing after dusk', () => {
  const s = day9({ slot: 'afternoon', rep: { ilse: 60 } });
  const words = (st, who) => D.linesOf(st, who);
  assert.ok(words(s, 'bard').includes(T.tx('v2.fest.wren', { purse: 30 })));
  assert.ok(words(s, 'ambrose').includes(T.tx('v2.fest.walksRival', { name: 'Ilse Morrow', why: T.tx('v2.fest.why.temple'), unless: T.tx('v2.fest.unless', { why: T.tx('v2.fest.why.flame') }) })));
  assert.ok(words(s, 'lio').includes(T.tx('v2.fest.walksNone', { unless: T.tx('v2.fest.unless', { why: T.tx('v2.fest.why.house') }) })));
  { const t = structuredClone(s); t.town.lio = 10; assert.ok(words(t, 'lio').includes(T.tx('v2.fest.walksYou', { why: T.tx('v2.fest.why.house') }))); }
  // Sister Anwen and Sergeant Brann: nothing would change it
  { const t = structuredClone(s); t.place = 'forecourt'; t.slot = 'morning'; assert.ok(words(t, 'anwen').includes(T.tx('v2.fest.walksRival', { name: 'Ilse Morrow', why: T.tx('v2.fest.why.temple'), unless: T.tx('v2.fest.why.never') }))); }
  // the rivals: their count (Ilse: 6 of the crowd, Anwen, Ambrose), Rhosk his own words, the one the player walks behind thanks them
  { const t = structuredClone(s); t.place = 'training'; t.slot = 'morning';
    assert.ok(words(t, 'ilse').includes(T.tx('v2.fest.rivalCount', { n: 8 })));
    assert.ok(words(t, 'rhosk').includes(T.tx('v2.fest.rivalAlone', { n: 0 })));
    const b = act(t, { type: 'walkBehind', who: 'orla' }); assert.ok(words(b, 'orla').includes(T.tx('v2.fest.rivalGift', { name: b.player.name }))); }
  // after dusk, or another day: nothing of it
  const fest = (st) => ['bard', 'ambrose', 'lio'].flatMap((w) => words(st, w)).filter((l) => /lantern/i.test(l) && !/Lantern Row/.test(l));
  { const t = structuredClone(s); t.day = 8; assert.deepEqual(fest(t), []); }
  const e = act(s, { type: 'wait' }); assert.equal(e.slot, 'evening'); assert.equal(F.festivalWords(e, 'bard'), null); assert.equal(F.festivalWords(e, 'lio'), null);
});

test('the parade\'s evening: the way between the festival square and the forecourt is full, the quay open; the other evenings and the day as before', () => {
  const ev = day9({ slot: 'evening' });
  assert.equal(G.advance(ev, { type: 'move', to: 'forecourt' }).reason, T.tx('v2.fest.wayShut'));
  assert.ok(G.advance(ev, { type: 'move', to: 'district' }).ok);
  const fc = { ...structuredClone(ev), place: 'forecourt' };
  assert.equal(G.advance(fc, { type: 'move', to: 'lanterns' }).reason, T.tx('v2.fest.wayShut'));
  assert.ok(G.advance(fc, { type: 'move', to: 'training' }).ok);
  assert.ok(G.advance(day9({ slot: 'afternoon' }), { type: 'move', to: 'forecourt' }).ok);
  { const t = structuredClone(ev); t.day = 8; assert.ok(G.advance(t, { type: 'move', to: 'forecourt' }).ok); }
  { const t = structuredClone(ev); t.day = 10; assert.ok(G.advance(t, { type: 'move', to: 'forecourt' }).ok); }
  assert.equal(F.paradeBlocks(G.namedState('day1-morning'), 'forecourt'), false);
});

test('the parade played live (FE-8): the eve\'s two lines, Wren calls the order, the one at the head walks to the hall\'s stage (Tobin and Rhosk named only), Wren\'s verse; and again at the crowning', () => {
  const steps = (s, id) => S.CUTSCENES[id].steps.filter((st) => !st.if || st.if(s));
  const lines = (s, id) => steps(s, id).filter((st) => 'say' in st).map((st) => [S.speakerOf(s, st), st.line(s)]);
  const walks = (s, id) => steps(s, id).filter((st) => 'walk' in st).map((st) => [st.walk, st.to]);
  const dusk = (o = {}, f = () => {}) => { const s = day9({ slot: 'afternoon', ...o }); f(s); const d = act(s, { type: 'wait' }); return { ...d, place: 'lanterns' }; };
  // the player at the head (a finalist: every bout won)
  const p = dusk({ fame: 90 });
  assert.equal(S.pendingScene(p).id, 'eve');
  // the order: the player's crowd of 12, House Dree's six, then the twos in the roster's order (no renown between them), Pip's one, the empty ones
  assert.deepEqual(p.v2.festival.order, ['player', 'cassius', 'marek', 'orla', 'ilse', 'tobin', 'vessa', 'rhosk']);
  const eve = [
    ['bard', T.tx('v2.scene.eve.1')], ['player', T.tx('v2.scene.eve.2')],
    ['bard', T.tx('v2.scene.eve.call', { first: p.player.name, n: 12, second: 'Cassius Dree', third: 'Marek Varn' })],
    ['bard', T.tx('v2.scene.eve.verse', { name: p.player.name, purse: 30 })],
  ];
  assert.deepEqual(lines(p, 'eve'), eve);
  // the same after the browser's save (its keys written sorted: the order was lost in the first browser proof, journal Passe EVL11)
  assert.deepEqual(lines({ ...G.deserialize(G.serialize(p)), place: 'lanterns' }, 'eve'), eve);
  assert.deepEqual(walks(p, 'eve'), [['player', [-2.8, -9.6]]]);
  // Marek at the head: he walks, no verse; a player out of the final says so
  const m = dusk({ rep: { marek: 90 } }, (s) => { s.tournament.matches = s.tournament.matches.filter((x) => x.stage !== 'final' || (x.a !== 'player' && x.b !== 'player')); });
  assert.deepEqual(walks(m, 'eve'), [['marek', [-2.8, -9.6]]]);
  assert.deepEqual(lines(m, 'eve').map(([w]) => w), ['bard', 'player', 'bard']);
  assert.equal(lines(m, 'eve')[1][1], m.tournament.matches.some((x) => x.stage === 'final' && (x.a === 'player' || x.b === 'player')) ? T.tx('v2.scene.eve.2') : T.tx('v2.scene.eve.2out'));
  // Tobin at the head (the player behind him, their crowd with his): named by Wren, nobody walks; the verse for both
  const t = dusk({ fame: 90, place: 'training' }, (s) => { Object.assign(s, act(s, { type: 'walkBehind', who: 'tobin' })); });
  assert.equal(t.v2.festival.leader, 'tobin');
  assert.deepEqual(walks(t, 'eve'), []);
  assert.deepEqual(lines(t, 'eve').at(-1), ['bard', T.tx('v2.scene.eve.gift', { name: t.player.name, rival: 'Tobin Fenn' })]);
  assert.equal(lines(t, 'eve')[2][1], T.tx('v2.scene.eve.call', { first: 'Tobin Fenn', n: 13, second: S.speakerName(t, t.v2.festival.order[1]), third: S.speakerName(t, t.v2.festival.order[2]) }));
  // the rivals who have a sheet stand on the square for it; every walker may walk there
  for (const id of ['bard', 'marek', 'ilse', 'vessa', 'orla', 'cassius']) assert.ok(S.CUTSCENES.eve.cast.includes(id), id);
  assert.deepEqual([...S.PARADE_WALKERS].sort(), ['cassius', 'ilse', 'marek', 'orla', 'player', 'vessa']);
  // the crowning: Wren's verse kept for the player who led, crowned or not; none for another leader
  const crown = (s, champ) => ({ ...structuredClone(s), day: 10, slot: 'evening', place: 'forecourt', flags: { ...s.flags, champion: champ, 'scene:final': true } });
  const ep = (s) => lines(s, 'epilogue').filter(([w]) => w === 'bard').map(([, l]) => l);
  assert.deepEqual(ep(crown(p, 'player')), [T.tx('v2.scene.epilogue.wren.crowned', { name: p.player.name })]);
  assert.deepEqual(ep(crown(p, 'marek')), [T.tx('v2.scene.epilogue.wren', { name: p.player.name })]);
  assert.deepEqual(ep(crown(m, 'player')), []);
  // the pages (read in their source: a browser plays them, tools/festival-flow.mjs): the scene's player leaves out a step the state leaves out; the square's page
  // shuts the way the parade fills, its tag saying why
  const cut = fs.readFileSync(new URL('../src/ui/cutscene.ts', import.meta.url), 'utf8'), plaza = fs.readFileSync(new URL('../src/ui/playPlaza.ts', import.meta.url), 'utf8');
  assert.ok(cut.includes('if (step.if && !step.if(s)) continue;'), 'the scene\'s player');
  assert.ok(plaza.includes("shut: shut(e.to) ? tx('v2.fest.shutTag'") && plaza.includes('open(app.exitTaken()?.to ?? null)') && plaza.includes('const open = (to: typeof from | null) => (to && !shut(to) ? to : null);'), 'the square\'s way shut');
  // the default game: no parade scene
  const def = G.namedState('day1-morning'); def.day = 9; def.slot = 'evening'; def.place = 'lanterns'; assert.equal(S.pendingScene(def), null);
});

test('the lab: the curious player does the good turns, the diligent none; whole games set a leader every time', () => {
  const run = (policy) => L.labReport([1, 2, 3], L.POLICIES[policy], 'v2').v2.fest;
  const cur = run('curious'), dil = run('diligent');
  assert.ok(cur.deeds >= 1, `curious: ${cur.deeds}`); assert.equal(dil.deeds, 0);
  for (const f of [cur, dil]) assert.equal(Object.values(f.leaders).reduce((a, b) => a + b, 0), 3);
  assert.equal(dil.behind, 0); assert.equal(cur.behind, 0);
});
