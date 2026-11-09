// The tutorial of the default game (journal Passes TU1 to TU3, the operator's sheet TU-1 to TU-12): its texts in the table with every number read from the
// game's data (TU-6: no digit written into a chapter or a hint), every key in a cap the gamepad and the keyboard layout follow, the twelve chapters and the
// eight hints (and the line of TU-8) each with its words and its chapter, the tour's six bands; what it remembers lives in the browser's storage and never in
// the save; where it shows (a new game's tour, a game begun before's line, each hint's moment) and that a browser driven by a tool keeps today's flow; the
// constants it reads are the ones the rules use.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const { EN } = await load('/src/narrative/text/en.ts');
const G = await load('/src/simulation/index.ts');
const TU = await load('/src/ui/tutorial.ts');
const CAP = await load('/src/input/caps.ts');
const LAW = await load('/src/simulation/v2law.ts');
const TOWN = await load('/src/simulation/v2town.ts');
const INTEL = await load('/src/simulation/v2intel.ts');
const GEAR = await load('/src/simulation/v2gear.ts');
const STATS = await load('/src/combat/stats.ts');
const { POINTS } = await load('/src/narrative/roster.ts');

const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const v2 = () => { const s = G.newGame(1842, 'Ren'); G.makeV2(s); return s; };
const tutKeys = Object.keys(EN).filter((k) => k.startsWith('tut.'));

test('the texts: in the table, numbers only through slots, every cap known (TU-5, TU-6)', () => {
  assert.ok(tutKeys.length >= 100, `tut keys: ${tutKeys.length}`);
  // a chapter or a hint writes no number of its own: each comes from the data through a slot (a rebalance cannot make the guide wrong)
  for (const k of tutKeys.filter((x) => /^tut\.(ch|hint)\./.test(x))) assert.doesNotMatch(EN[k], /\d/, `${k} writes a number: ${EN[k]}`);
  // a key in a text is a cap the gamepad and the keyboard layout redraw, never a letter in the prose
  // [Move] and [Run], the walk's keys and the run, since the remapping (journal Passe RM2, RM-6: the words « the arrow keys », « Shift » became caps that follow)
  for (const k of tutKeys) for (const m of EN[k].matchAll(/\[([^\]]+)\]/g)) assert.ok(['E', 'Q', 'Menu', 'M', 'Space', 'Enter', 'Back', 'J', 'K', 'L', 'Move', 'Run'].includes(m[1]), `${k}: unknown cap [${m[1]}]`);
  // an action's cap carries its action (data-bind) and shows the player's key; a fixed key's carries its English name (data-key) and shows its name
  const html = TU.rich('Press [E], then [Menu]; <b>x</b>');
  assert.match(html, /<kbd data-bind="talk" data-cap="hints">E<\/kbd>/);
  assert.match(html, /<kbd data-key="Esc" data-cap="hints">Esc<\/kbd>/);
  // the walk's four keys and the run, each the player's (WASD or ZQSD by the keyboard this machine announces, and Shift)
  const move = TU.rich('[Move] [Run]');
  assert.equal(move, '<p>' + ['up', 'left', 'down', 'right'].map((a) => `<kbd data-bind="${a}" data-cap="hints">${CAP.actName(a)}</kbd>`).join('') + ' <kbd data-bind="run" data-cap="hints">Shift</kbd></p>');
  assert.ok(['WASD', 'ZQSD'].includes(['up', 'left', 'down', 'right'].map(CAP.actName).join('')));
  assert.match(html, /&lt;b&gt;x&lt;\/b&gt;/, 'the rest is escaped');
});

test('the guide: twelve chapters, each filled from the game\'s data (TU-1, TU-6)', () => {
  const s = v2();
  assert.deepEqual(TU.CHAPTERS.map((c) => c.id), ['tournament', 'time', 'moving', 'places', 'shops', 'law', 'challenges', 'intel', 'renown', 'prepare', 'duel', 'keys']);
  const text = Object.fromEntries(TU.CHAPTERS.map((c) => [c.id, TU.chapterText(s, c)]));
  for (const [id, t] of Object.entries(text)) assert.doesNotMatch(t, /[{}]/, id);
  assert.match(text.tournament, new RegExp(`a win is worth ${POINTS.win} points, a close defeat ${POINTS.close}`));
  assert.match(text.tournament, /pool on days 2, 4 and 5/);
  assert.match(text.tournament, /semi-finals on day 6/);
  assert.match(text.law, new RegExp(`up to ${TOWN.STEAL_FINE.day} coins by day, ${TOWN.STEAL_FINE.night} at night`));
  assert.match(text.law, new RegExp(`At ${LAW.LAW.wanted} marks`));
  assert.match(text.challenges, new RegExp(`You stake ${TOWN.STAKE.coins} coins or ${TOWN.STAKE.name} of your reputation`));
  assert.match(text.intel, new RegExp(`${INTEL.RUMOUR.lio.coins} coins, right about 67 %`));
  assert.match(text.intel, new RegExp(`for ${INTEL.STRONGROOM} coins`));
  // a session since journal Passe DB8 (the operator's DB7-3 « +1 à la stat choisie, pour le prochain combat »)
  assert.match(text.prepare, new RegExp(`gives \\+${STATS.TRAIN_POINT} to the stat you choose \\(Attack, Defence, Endurance or Speed\\) at your next bout, up to ${GEAR.TRAIN_MAX} sessions`));
  assert.match(text.prepare, new RegExp(`takes ${Math.round(GEAR.INJURY_HP * 100)} % of your health`));
  assert.match(text.places, /the Arena Forecourt, the Training Ground and the Festival Square/);
});

test('the constants the guide reads are the rules\' own (the training, the wound, the fine)', () => {
  // the bout's numbers are made from them (src/simulation/v2gear.ts), the theft's fine too (src/simulation/v2town.ts)
  const gear = src('src/simulation/v2gear.ts'), town = src('src/simulation/v2town.ts');
  assert.match(gear, /1 - INJURY_HP \* s\.player\.injury/);
  assert.match(gear, /const n = Math\.min\(TRAIN_MAX, s\.player\.training\)/);
  assert.match(gear, /for \(const k of trainedStats\(s\)\) st\[k\] \+= TRAIN_POINT;/);
  assert.match(town, /const cap = night \? STEAL_FINE\.night : STEAL_FINE\.day/);
  assert.deepEqual([GEAR.INJURY_HP, STATS.TRAIN_POINT, GEAR.TRAIN_MAX, TOWN.STEAL_FINE.day, TOWN.STEAL_FINE.night], [0.2, 1, 2, 15, 25]);
});

test('the tour\'s six bands and the hints, each with its words and its chapter (TU-2, TU-3, TU-8)', () => {
  assert.equal(TU.TOUR.length, 6);
  assert.deepEqual(TU.TOUR.map((b) => b.at ?? null), [null, 'status', 'figs', 'list', 'menu', null]);
  for (const b of TU.TOUR) { assert.ok(b.title in EN && b.body in EN, b.title); }
  const ids = ['square', 'shop', 'steal', 'mark', 'eve', 'challenge', 'evening', 'hurt', 'guide'];
  for (const id of ids) {
    assert.ok(`tut.hint.${id}.title` in EN && `tut.hint.${id}.body` in EN, id);
    assert.ok(TU.CHAPTERS.some((c) => c.id === TU.hintChapter(id)), `${id} opens a chapter`);
  }
});

test('what it remembers lives in the browser, never in the save; a driven browser keeps today\'s flow', () => {
  const t = src('src/ui/tutorial.ts');
  assert.doesNotMatch(t, /writeSave|__game|advance\(|\.act\(/, 'the tutorial never acts on the game nor writes its save');
  assert.match(t, /'cite-du-tournoi\.tutorial'/);
  assert.match(t, /'cite-du-tournoi\.places'/);
  assert.equal(TU.tutorialOn(new URLSearchParams('tutorial=1')), true);
  assert.equal(TU.tutorialOn(new URLSearchParams('tutorial=0')), false);
  assert.match(t, /t === '1' \|\| \(t !== '0' && !navigator\.webdriver\)/);
  // no localStorage in Node: the tutorial forgets quietly
  assert.equal(TU.hintSeen('shop'), false);
  assert.doesNotThrow(() => TU.markHint('shop'));
  assert.equal(TU.told(), false);
});

test('where it shows: the tour of a new game, the line of a game begun before, each hint at its moment (TU-2, TU-3, TU-8, TU-9)', () => {
  const ui = src('src/ui/townUi.ts'), town = src('src/ui/playTown.ts'), plaza = src('src/ui/playPlaza.ts');
  assert.match(town, /if \(isV2\(st\) && tutorialOn\(b\.params\)\) \{ void ui\.welcome\(b\.params\.has\('new'\)\);/);
  assert.match(plaza, /if \(tutorialOn\(b\.params\)\) \{ keepPlace\(st\.place, .*\); await ui\.welcome\(false\); ui\.hint\('square'\); \}/);
  assert.match(ui, /if \(fresh\) await this\.tour\(\);\n\s*else if \(!told\(\)\) \{ this\.hint\('guide'\); markTold\(\); \}/);
  assert.match(ui, /if \(next === s\.day \+ 1 && s\.slot !== 'morning'\) this\.hint\('eve'\);/);
  assert.match(ui, /if \(s\.slot === 'evening'\) this\.hint\('evening'\);/);
  assert.match(ui, /if \(opts\.some\(\(o\) => o\.ok && o\.action\.type === 'steal'\)\) this\.hint\('steal'\);/);
  assert.match(ui, /if \(opts\.some\(\(o\) => o\.ok && o\.action\.type === 'challenge'\)\) this\.hint\('challenge', who\);/);
  assert.match(ui, /if \(who\) this\.hint\('shop'\);/);
  assert.match(ui, /if \(this\.welcomed && v2 && \(sus > 0 \|\| P\.injury > 0\)\)/);
  // the guide: in the menu on a line of its own (H), the tour replayed from it (TU-7)
  assert.match(ui, /if \(isV2\(s\)\) add\(tx\('tut\.guide'\), \(\) => this\.openGuide\(\), 'guide'\);/);
  assert.match(ui, /replay: \(\) => void this\.tour\(\)/);
  // today's game (v2=0) shows none of it
  assert.match(town, /tutorial: isV2\(st\) && tutorialOn\(b\.params\)/);
  assert.match(ui, /if \(!this\.host\.tutorial \|\| !isV2\(this\.st\) \|\| hintSeen\(id\)\) return;/);
});

test('it moves by fades only (TU-10: the reduced motion is the game\'s own setting)', () => {
  const css = src('src/ui/tutorial.ts').match(/const CSS = `([\s\S]*?)`;/)[1];
  assert.doesNotMatch(css, /transform|translate|ds-rise|ds-in\b/, 'no slide');
  assert.match(css, /\.tu-spot\{[^}]*transition:opacity \.2s/);
  assert.match(css, /tu-band\{animation:ds-fade/);
  assert.match(css, /tu-hint\{[^}]*animation:ds-fade/);
});

// ------------------------------------------------------------------------------------------------ lot 2: the first duel's lessons (journal Passe TU4, TU-11)
const DT = await load('/src/ui/duelTutorial.ts');
const V2D = await load('/src/combat/v2duel.ts');

test('the first duel\'s lessons: one per first, their numbers from the duel\'s own data (TU-11, TU-6)', () => {
  assert.deepEqual(DT.LESSONS, ['start', 'charge', 'ap', 'priority', 'gauge', 'break', 'riposte']);
  for (const k of tutKeys.filter((x) => /^tut\.duel\./.test(x))) assert.doesNotMatch(EN[k], /\d/, `${k} writes a number`);
  const D = V2D.v2DuelData('marek', { seed: 1, playerName: 'Ren', opponentName: 'Marek' }).data;
  assert.match(DT.lessonText('break', D), new RegExp(`stunned for ${V2D.V2_BREAK.stun} seconds and takes ${V2D.V2_BREAK.damage} times the damage`));
  assert.match(DT.lessonText('riposte', D), new RegExp(`After ${V2D.V2_RIPOSTE.after} quick blows`));
  assert.match(DT.lessonText('priority', D), new RegExp(`takes ${Math.round(D.guard.reduce * 100)} % off each blow`));
  assert.match(DT.lessonText('ap', D), new RegExp(`gives you ${D.actions.light.apGain} action point\. You start a bout with ${D.ap.start} and hold ${D.ap.max} at most`));
  assert.match(DT.lessonText('start', D), /<kbd data-bind="attack" data-cap="arena">J<\/kbd>|\[J\]/);
  // the guide's chapter says the same numbers (read from the same data)
  const duel = TU.chapterText(v2(), TU.CHAPTERS.find((c) => c.id === 'duel'));
  assert.match(duel, new RegExp(`stunned for ${V2D.V2_BREAK.stun} seconds and takes ${V2D.V2_BREAK.damage} times`));
  assert.match(duel, new RegExp(`After ${V2D.V2_RIPOSTE.after} quick blows`));
  // the caps of the duel in a text are the duel's
  assert.match(TU.rich('[J] [K] [L]'), /<kbd data-bind="attack" data-cap="arena">J<\/kbd> <kbd data-bind="guard" data-cap="arena">K<\/kbd> <kbd data-bind="dodge" data-cap="arena">L<\/kbd>/);
});

test('which event is which first: the player\'s charge past the quick blow, an action point, the opponent\'s sequence, a gauge a third full, its break, the riposte', () => {
  const of = DT.lessonOf;
  assert.equal(of({ type: 'chargeTier', idx: 1 }), 'charge');
  assert.equal(of({ type: 'chargeTier', idx: 0 }), null);
  assert.equal(of({ type: 'apGain', who: 'ren', amount: 1, ap: 2 }), 'ap');
  assert.equal(of({ type: 'apGain', who: 'marek', amount: 1, ap: 2 }), null);
  assert.equal(of({ type: 'sequenceStart', who: 'marek', len: 3 }), 'priority');
  assert.equal(of({ type: 'sequenceStart', who: 'ren', len: 1 }), null);
  assert.equal(of({ type: 'impact', from: 'ren', to: 'marek', result: 'hit', resist: DT.GAUGE_SHOWN - 1 }), null);
  assert.equal(of({ type: 'impact', from: 'ren', to: 'marek', result: 'hit', resist: DT.GAUGE_SHOWN }), 'gauge');
  assert.equal(of({ type: 'impact', from: 'ren', to: 'marek', result: 'dodged', resist: 90 }), null);
  assert.equal(of({ type: 'break', who: 'marek' }), 'break');
  assert.equal(of({ type: 'break', who: 'ren' }), null);
  assert.equal(of({ type: 'riposte', who: 'marek', lights: 3 }), 'riposte');
  // the events the duel really emits carry these fields (src/combat/charge.ts, src/combat/dynamic.ts)
  assert.match(src('src/combat/charge.ts'), /type: 'chargeTier'; idx: number/);
  assert.match(src('src/combat/dynamic.ts'), /\{ type: 'impact'; from: DynFighterId; to: DynFighterId; action: DynActionId; kind: DynKind; result: DynImpactResult; damage: number; mitigated: number; hp: number; resist: number \}/);
});

test('the lessons hold the duel and its keys, only in a version 2 game\'s bout; the guide teaches them again (TU-7)', () => {
  const arena = src('src/arena/ArenaApp.ts'), page = src('src/ui/playArena.ts'), dt = src('src/ui/duelTutorial.ts'), tu = src('src/ui/tutorial.ts');
  // the settings page over a paused duel holds its keys too (journal Passe RG3, RG-2)
  assert.match(arena, /if \(e\.repeat \|\| e\.metaKey \|\| e\.ctrlKey \|\| e\.altKey \|\| !this\.ready \|\| this\.lesson \|\| this\.settingsOpen\) return;/);
  assert.match(arena, /this\.lesson = on; this\.paused = on; this\.moment = on; this\.hud\?\.still\(on\);/);
  assert.match(arena, /this\.onDuelEvents\?\.\(evs/);
  assert.match(page, /if \(v2\) \{\n\s*const coach = new DuelCoach\(\{ hold: \(on\) => app\.holdForLesson\(on\), data: \(\) => app\.dyn\?\.D \?\? null \}, b\.params\);/);
  assert.match(dt, /this\.off = !tutorialOn\(params\)/);
  assert.match(dt, /'cite-du-tournoi\.duel-lessons'/);
  assert.doesNotMatch(dt, /writeSave|__game|\.act\(/);
  assert.match(tu, /if \(at\.id === 'duel'\) \{ forgetLessons\(\);/);
  // no localStorage in Node: nothing is said twice, nothing throws
  assert.equal(DT.lessonSeen('start'), false);
  assert.doesNotThrow(() => DT.forgetLessons());
});
