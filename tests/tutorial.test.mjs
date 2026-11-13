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
const WORK = await load('/src/simulation/v2work.ts');
const POOL = await load('/src/tournament/pool.ts');
// the first duel's lessons (lot 3, journal Passe LC5): loaded before any test runs (a load after the first tests ran met the closed loader)
const DT = await load('/src/ui/duelTutorial.ts');
const AV = await load('/src/arena/autoView.ts');
const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const AM = await load('/src/combat/autoMatch.ts');
const T = await load('/src/narrative/text/index.ts');
const { FR } = await load('/src/narrative/text/fr.ts');

const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const v2 = () => { const s = G.newGame(1842, 'Ren'); G.makeV2(s); return s; };
const tutKeys = Object.keys(EN).filter((k) => k.startsWith('tut.'));

test('the texts: in the table, numbers only through slots, every cap known (TU-5, TU-6)', () => {
  assert.ok(tutKeys.length >= 100, `tut keys: ${tutKeys.length}`);
  // a chapter or a hint writes no number of its own: each comes from the data through a slot (a rebalance cannot make the guide wrong)
  for (const k of tutKeys.filter((x) => /^tut\.(ch|hint)\./.test(x))) assert.doesNotMatch(EN[k], /\d/, `${k} writes a number: ${EN[k]}`);
  // a key in a text is a cap the gamepad and the keyboard layout redraw, never a letter in the prose
  // [Move] and [Run], the walk's keys and the run, since the remapping (journal Passe RM2, RM-6: the words « the arrow keys », « Shift » became caps that follow)
  for (const k of tutKeys) for (const m of EN[k].matchAll(/\[([^\]]+)\]/g)) assert.ok(['E', 'Q', 'Menu', 'M', 'Space', 'Enter', 'Back', 'J', 'K', 'L', 'Move', 'Run', 'Left', 'Right'].includes(m[1]), `${k}: unknown cap [${m[1]}]`);
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

test('the guide: thirteen chapters (« Earning coins » since journal Passe ECO2, ECO-7), each filled from the game\'s data (TU-1, TU-6)', () => {
  const s = v2();
  assert.deepEqual(TU.CHAPTERS.map((c) => c.id), ['tournament', 'time', 'moving', 'places', 'shops', 'money', 'law', 'challenges', 'intel', 'renown', 'prepare', 'duel', 'keys']);
  const text = Object.fromEntries(TU.CHAPTERS.map((c) => [c.id, TU.chapterText(s, c)]));
  for (const [id, t] of Object.entries(text)) assert.doesNotMatch(t, /[{}]/, id);
  assert.match(text.tournament, new RegExp(`a win is worth ${POINTS.win} points, a close defeat ${POINTS.close}`));
  assert.match(text.tournament, /pool on days 2, 4 and 5/);
  assert.match(text.tournament, /semi-finals on day 6/);
  assert.match(text.law, new RegExp(`up to ${TOWN.STEAL_FINE.day} coins by day, ${TOWN.STEAL_FINE.night} at night`));
  assert.match(text.law, new RegExp(`At ${LAW.LAW.wanted} marks`));
  // the money (journal Passe ECO2): the jobs' pay and the purses by stage read from the game's own tables
  assert.match(text.money, new RegExp(`pays ${WORK.WORK.pay} coins`));
  assert.match(text.money, new RegExp(`${POOL.PURSES.pool[0]} or ${POOL.PURSES.pool[1]} coins in the pool, ${POOL.PURSES.semi[0]} or ${POOL.PURSES.semi[1]} on day 6, ${POOL.PURSES.third[0]} or ${POOL.PURSES.third[1]} on day 8, ${POOL.PURSES.final[0]} or ${POOL.PURSES.final[1]} in the final`));
  assert.match(text.money, /Mara's crates on the quay/);
  assert.match(text.challenges, new RegExp(`You stake ${TOWN.STAKE.coins} coins or ${TOWN.STAKE.name} of your reputation`));
  assert.match(text.intel, new RegExp(`${INTEL.RUMOUR.lio.coins} coins, right about 67 %`));
  assert.match(text.intel, new RegExp(`for ${INTEL.STRONGROOM} coins`));
  // a session since journal Passe DB8 (the operator's DB7-3 « +1 à la stat choisie, pour le prochain combat »)
  // since DB11-5 « Le dire partout, et une séance « Santé » (+20 PV au prochain combat) » (journal Passe DB13), a session may go to health, and the guide
  // says where Ren's health comes from, the rules' own numbers
  assert.match(text.prepare, new RegExp(`gives \\+${STATS.TRAIN_POINT} to the stat you choose \\(Attack, Defence, Endurance or Speed\\), or \\+${STATS.TRAIN_HP} health, at your next bout, up to ${GEAR.TRAIN_MAX} sessions`));
  assert.match(text.prepare, new RegExp(`Your health starts at ${STATS.REN_BASE.hp} and grows by ${STATS.VIGOUR_HP} for good with each bout you win`));
  assert.match(text.prepare, new RegExp(`takes ${Math.round(GEAR.INJURY_HP * 100)} % of your health`));
  // (how the places connect, journal Passe AL1: the quay has two ways, the Training Ground opens from the forecourt)
  assert.match(text.places, /the Festival Square at its west end, the Arena Forecourt past the guards at its east end; the Training Ground opens from the Arena Forecourt/);
});

test('the constants the guide reads are the rules\' own (the training, the wound, the fine)', () => {
  // the bout's numbers are made from them (src/simulation/v2gear.ts), the theft's fine too (src/simulation/v2town.ts)
  const gear = src('src/simulation/v2gear.ts'), town = src('src/simulation/v2town.ts');
  assert.match(gear, /1 - INJURY_HP \* s\.player\.injury/);
  assert.match(gear, /const n = Math\.min\(TRAIN_MAX, s\.player\.training\)/);
  assert.match(gear, /for \(const k of trainedStats\(s\)\) st\[k\] \+= trainGain\(k\);/);
  assert.match(src('src/combat/stats.ts'), /export const trainGain = \(k: TrainedStat\): number => \(k === 'hp' \? TRAIN_HP : TRAIN_POINT\);/);
  assert.match(town, /const cap = night \? STEAL_FINE\.night : STEAL_FINE\.day/);
  assert.deepEqual([GEAR.INJURY_HP, STATS.TRAIN_POINT, STATS.TRAIN_HP, STATS.REN_BASE.hp, STATS.VIGOUR_HP, GEAR.TRAIN_MAX, TOWN.STEAL_FINE.day, TOWN.STEAL_FINE.night], [0.2, 1, 20, 300, 24, 2, 15, 25]);
});

test('the tour\'s six bands and the hints, each with its words and its chapter (TU-2, TU-3, TU-8)', () => {
  assert.equal(TU.TOUR.length, 6);
  assert.deepEqual(TU.TOUR.map((b) => b.at ?? null), [null, 'status', 'figs', 'list', 'menu', null]);
  for (const b of TU.TOUR) { assert.ok(b.title in EN && b.body in EN, b.title); }
  // 'vigour' since journal Passe DB13 (the operator's DB11-5 « Le dire partout »): after the first bout won, how Ren's health grows
  const ids = ['square', 'shop', 'steal', 'mark', 'eve', 'challenge', 'evening', 'hurt', 'guide', 'vigour'];
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
  assert.match(ui, /if \(next === s\.day \+ 1 && s\.slot === 'afternoon'\) this\.hint\('eve'\);/);
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

// ------------------------------------------------------------------------------------------------ the first duel's lessons (TU-11): the duel played by the computer
// (lot 3 of briefs/combat-auto.md, journal Passe LC5; the three-button duel's lessons of journal Passe TU4 went with lot 2)
const R = AU.AUTO_RULES, pc = (x) => Math.round(x * 100);
const FOES = ['marek', 'vessa', 'orla', 'cassius', 'ilse', 'rhosk', 'tobin'];
const lessonDuel = (d, names = { ren: 'Ren', marek: 'Marek' }) => ({ ren: d.ren, foe: d.foe, form: d.result.form, names });

test('the first duel\'s lessons: one per first of the duel played by the computer, their numbers the bout\'s own (TU-11, TU-6)', () => {
  assert.deepEqual(DT.LESSONS, ['start', 'charge', 'combo', 'ap', 'react', 'form', 'gauge', 'break', 'speed']);
  for (const k of tutKeys.filter((x) => /^tut\.duel\./.test(x))) assert.doesNotMatch(EN[k], /\d/, `${k} writes a number`);
  for (const id of DT.LESSONS) assert.ok(`tut.duel.${id}.title` in EN && `tut.duel.${id}.body` in EN, id);
  // the old duel's lessons are gone with it (no priority of the opponent, no riposte: AC-07, A3)
  assert.ok(!('tut.duel.priority.body' in EN) && !('tut.duel.riposte.body' in EN));
  const d = AV.sceneAutoDuel('marek', 1337), D = lessonDuel(d);
  assert.match(DT.lessonText('start', D), new RegExp(`You use your ${d.ren.skills.length} skills in your order`));
  assert.match(DT.lessonText('charge', D), new RegExp(`your light attack charges ${+(AD.AUTO_LIGHT.charge * AD.AUTO_CADENCE.charge).toFixed(2)} seconds at your Speed of ${d.ren.viv}`));
  assert.match(DT.lessonText('combo', D), new RegExp(`your light attack strikes ${AD.AUTO_WEAPONS['training-sword'].hits.length} with your weapon`));
  assert.match(DT.lessonText('ap', D), new RegExp(`gives you ${R.ap.light} action point\\. You started this bout with ${R.ap.start} and hold ${R.ap.max} at most`));
  assert.match(DT.lessonText('ap', D), new RegExp(`comes back ${AD.AUTO_COOLDOWN} times its first-level charge after its charge begins`)); // the cooldown as the duel counts it (the operator's CO-4, journal Passe CO3)
  const rr = AM.autoReactions(d.ren, d.foe), fr = AM.autoReactions(d.foe, d.ren);
  assert.match(DT.lessonText('react', D), new RegExp(`${R.react.skillGuard} times as often against a skill or a heavy blow seen coming\\. A guarded blow loses ${pc(R.guardReduce)} % of its damage`));
  assert.match(DT.lessonText('react', D), new RegExp(`you dodge ${pc(rr.dodge)} % of Marek's blows and guard ${pc(rr.guard)} %, ${pc(rr.guardSkill)} % of those seen coming; Marek dodges ${pc(fr.dodge)} % of yours and guards ${pc(fr.guard)} %`));
  const sg = (f) => `${f >= 1 ? '\\+' : '−'}${Math.round(Math.abs(f - 1) * 100)}`;
  assert.match(DT.lessonText('form', D), new RegExp(`up to ${pc(R.form)} % either way: today ${sg(d.result.form[0])} % for you, ${sg(d.result.form[1])} % for Marek`));
  assert.match(DT.lessonText('gauge', D), new RegExp(`fills the guarder's ${R.gauge.guardMul} times as much`));
  assert.match(DT.lessonText('break', D), new RegExp(`stunned for ${R.brk.stun} seconds, and takes ${R.brk.dmg} times the damage`));
  // ×2 and « Skip » on the attack's and the dodge's keys (LC3-8), the duel's caps
  assert.match(TU.rich(DT.lessonText('speed', D)), /<kbd data-bind="attack" data-cap="arena">J<\/kbd> plays it twice as fast, and back; <kbd data-bind="dodge" data-cap="arena">L<\/kbd> skips to the result/);
  // the numbers follow the bout, not constants: a Ren at Speed 8 with the sabre and an AP of his gear
  const ren = AD.autoRen({ ...d.ren, hp: 300, viv: 8 }, { loadout: ['t1', 't4', 'd1', 's1'], levels: {} }, { weapon: 'duelist-sabre', apStart: 1 });
  const D2 = { ...D, ren };
  assert.match(DT.lessonText('charge', D2), new RegExp(`charges ${+(AD.AUTO_LIGHT.charge * AD.AUTO_CADENCE.charge * 10 / 8).toFixed(2)} seconds at your Speed of 8`));
  assert.match(DT.lessonText('combo', D2), new RegExp(`strikes ${AD.AUTO_WEAPONS['duelist-sabre'].hits.length} with your weapon`));
  assert.match(DT.lessonText('ap', D2), new RegExp(`You started this bout with ${R.ap.start + 1}`));
  // in French: the decimal comma, the article meeting the name (« des coups d’Orla »)
  const o = AV.sceneAutoDuel('orla', 7), DO = lessonDuel(o, { ren: 'Ren', marek: 'Orla' });
  T.useLanguage('fr', FR);
  try {
    assert.match(DT.lessonText('charge', D2), /se charge en 0,9 secondes à votre Vivacité de 8/);
    assert.match(DT.lessonText('react', DO), /des coups d’Orla et en gardez/);
    for (const id of DT.LESSONS) assert.doesNotMatch(DT.lessonText(id, DO), /[{}]|\b(the|your|and)\b/, id);
  } finally { T.useLanguage('en'); }
});

/** the first time each lesson opens in a duel, from the script alone (its lines and their trace), independent of the replay's events: Ren's first light attack
 *  that lands, a blow that is not its action's first, a guard or a dodge, a skill or a heavy blow landing, a target's gauge a third full at a blow, a break, Ren
 *  charging a skill; the clock's lesson at SPEED_AT; none at the K.O.'s blow or after it */
function oracle(d) {
  const log = d.result.log, light = new Set([d.ren.light.id, d.foe.light.id]), first = { start: 0 }, fresh = {};
  // a target's gauge just after a blow, from the script alone: the next line's trace (written before its own blow fills anything) with its decay undone, full at
  // that fighter's break or while it is broken (lot 4, journal Passe LC6: the HUD shows the gauge at the blow, no longer one line late)
  const after = (i, k) => { const e = log[i], n = log[i + 1]; if (e.s[k] >= R.gauge.max) return R.gauge.max; if (!n) return 0; if (n.ev === 'break' && n.s[k] >= R.gauge.max) return R.gauge.max; return n.s[k] > 0 ? n.s[k] + R.gauge.decay * (n.t - e.t) : 0; };
  const put = (id, t) => { if (!(id in first)) first[id] = t; };
  const koAt = log.find((e) => e.hp !== undefined && e.hp <= 0)?.t ?? Infinity;
  for (const [i, e] of log.entries()) {
    if (e.t >= koAt) break;
    if (e.ev === 'charge') { fresh[e.who] = true; if (e.who === d.ren.id && e.act !== d.ren.light.id) put('charge', e.t); continue; }
    if (e.ev === 'break') { put('break', e.t); continue; }
    if (e.ev === 'ward' || e.ev === 'boost') { fresh[e.who] = false; continue; }
    const follow = !fresh[e.who]; fresh[e.who] = false;
    if (e.who === d.ren.id && e.act === d.ren.light.id && e.ev !== 'dodged') put('ap', e.t);
    if (follow) put('combo', e.t);
    if (e.ev !== 'hit') put('react', e.t);
    if (e.ev === 'hit' && !light.has(e.act)) put('form', e.t);
    if (e.ev !== 'dodged' && after(i, e.who === d.ren.id ? 3 : 1) >= R.gauge.max / 3) put('gauge', e.t);
  }
  if (DT.SPEED_AT < koAt) put('speed', DT.SPEED_AT);
  return first;
}

test('each lesson opens on the line of the script that opens it, at the arena\'s step, once, never at the K.O. (TU-11)', () => {
  let n = 0;
  for (const foe of FOES) for (const seed of [1337, 7, 42]) {
    const d = AV.sceneAutoDuel(foe, seed), rp = new AV.AutoReplay(d.result, { ren: d.ren, marek: d.foe }), dt = rp.D.dt;
    rp.drain();
    const seen = { start: 0 }, count = {};
    while (!rp.over) {
      rp.step();
      const evs = rp.drain();
      if (evs.some((e) => e.type === 'ko')) break;
      for (const e of evs) for (const id of DT.lessonsOf(e)) { count[id] = (count[id] ?? 0) + 1; if (!(id in seen)) seen[id] = rp.t; }
      const at = DT.lessonAt(rp.t); if (at && !(at in seen)) seen[at] = rp.t;
    }
    const want = oracle(d);
    assert.deepEqual(Object.keys(seen).sort(), Object.keys(want).sort(), `${foe} ${seed}: the lessons the bout reaches`);
    for (const [id, t] of Object.entries(want)) {
      assert.ok(seen[id] >= t - 1e-9 && seen[id] - t <= dt + 1e-9, `${foe} ${seed} ${id}: opens at ${seen[id]}, its line at ${t}`);
      n++;
    }
    // each opens once in a bout whatever the events after it (the coach keeps what it said)
    assert.ok(Object.keys(count).length >= 4, `${foe} ${seed}: lessons reached`);
  }
  assert.ok(n >= 7 * 3 * 7, `lessons checked: ${n}`);
  // the replay's impact says what the lessons read: its blow's place in its action, the AP its striker gained
  const d = AV.sceneAutoDuel('marek', 1337), rp = new AV.AutoReplay(d.result, { ren: d.ren, marek: d.foe });
  rp.skip(); rp.reset(); rp.drain();
  const imp = [];
  while (!rp.over) { rp.step(); imp.push(...rp.drain().filter((e) => e.type === 'impact')); }
  assert.ok(imp.some((e) => e.follow === true) && imp.some((e) => e.follow === false));
  assert.ok(imp.filter((e) => e.apGain > 0).every((e) => e.kind === 'light' && e.result !== 'dodged'), 'only a light attack that lands gains AP');
  assert.ok(imp.some((e) => e.from === 'ren' && e.apGain === R.ap.light));
});

test('the coach holds the bout on the step a lesson opens and its keys; the guide teaches it again (TU-7); every bout of a game has it', () => {
  const arena = src('src/arena/ArenaApp.ts'), page = src('src/ui/playArena.ts'), dt = src('src/ui/duelTutorial.ts'), tu = src('src/ui/tutorial.ts');
  // the settings page over a paused duel holds its keys too (journal Passe RG3, RG-2)
  assert.match(arena, /if \(e\.repeat \|\| e\.metaKey \|\| e\.ctrlKey \|\| e\.altKey \|\| !this\.ready \|\| this\.lesson \|\| this\.settingsOpen\) return;/);
  assert.match(arena, /this\.lesson = on; this\.paused = on; this\.moment = on; this\.hud\?\.still\(on\);/);
  // no step after the one that opened a lesson; neither ×2 nor « Skip » while it is read; no lesson under « Skip »'s curtain
  assert.match(arena, /while \(!this\.paused && this\.acc >= step && n\+\+ < 24\)/);
  assert.match(arena, /if \(!down \|\| this\.lesson\) return;/);
  assert.match(arena, /if \(!this\.skipFade\) this\.onDuelEvents\?\.\(evs as unknown as Array<\{ type: string \} & Record<string, unknown>>, this\.sim\.t\);/);
  // a version 2 game's bout or challenge (the duel played by the computer): the coach with the bout's fighters and forms
  assert.match(page, /if \(ao\) \{\n\s*const duel = \{ ren: ao\.bout\.ren, foe: ao\.bout\.foe, form: ao\.duel\.form, names: \{ ren: st\.player\.name, marek: opp\.name \} \};\n\s*const coach = new DuelCoach\(\{ hold: \(on\) => app\.holdForLesson\(on\), data: \(\) => duel \}, b\.params\);/);
  assert.match(page, /app\.onDuelEvents = \(evs, t\) => coach\.onEvents\(evs, t\);\n\s*coach\.begin\(\);/);
  assert.match(dt, /this\.off = !tutorialOn\(params\)/);
  assert.match(dt, /'cite-du-tournoi\.auto-lessons'/);
  assert.match(dt, /if \(evs\.some\(\(e\) => e\.type === 'ko'\)\) \{ this\.ended = true; this\.queue = \[\]; return; \}/);
  assert.doesNotMatch(dt, /writeSave|__game|\.act\(/);
  assert.match(tu, /if \(at\.id === 'duel'\) \{ forgetLessons\(\);/);
  // fades only (TU-10): the light appears at its place
  assert.match(tu, /export function spotlight\(sel: string\): \(\) => void/);
  // no localStorage in Node: nothing is said twice, nothing throws
  assert.equal(DT.lessonSeen('start'), false);
  assert.doesNotThrow(() => DT.forgetLessons());
});

test('the guide\'s « The duel » and « Preparing a bout » for the duel played by the computer, their numbers the duel\'s (lot 3)', () => {
  const s = v2(), duel = TU.chapterText(s, TU.CHAPTERS.find((c) => c.id === 'duel')), prep = TU.chapterText(s, TU.CHAPTERS.find((c) => c.id === 'prepare'));
  const hits = Object.values(AD.AUTO_WEAPONS).map((w) => w.hits.length);
  assert.match(duel, /^The computer fights your bouts as you prepared them\./);
  assert.match(duel, new RegExp(`gives ${R.ap.light} action point; you start with ${R.ap.start} and hold ${R.ap.max} at most\\. A skill comes back ${AD.AUTO_COOLDOWN} times its first-level charge after its charge begins`));
  assert.match(duel, new RegExp(`your light attack ${Math.min(...hits)} to ${Math.max(...hits)} by your weapon`));
  assert.match(duel, new RegExp(`${R.react.skillGuard} times as often against a skill or a heavy blow seen coming; a guarded blow loses ${pc(R.guardReduce)} % of its damage`));
  assert.match(duel, new RegExp(`stunned for ${R.brk.stun} seconds and takes ${R.brk.dmg} times the damage`));
  assert.match(duel, new RegExp(`up to ${pc(R.form)} % either way`));
  assert.doesNotMatch(duel, /riposte|priority|Hold \[J\]/, 'nothing of the duel of before');
  assert.match(prep, /bring four skills and set their order: the duel uses them in that order/);
  assert.match(prep, new RegExp(`every fighter's health is multiplied by ${R.hpScale}`));
  assert.match(prep, /your order of the four, which \[Left\] and \[Right\] change there/);
  assert.match(TU.rich('[Left] [Right]'), /<kbd data-bind="left">.*<\/kbd> <kbd data-bind="right">.*<\/kbd>/);
  // the duel's keys in « Keys »: ×2 on the attack's, « Skip » on the dodge's, the pause; the guard's does nothing there (lot 5 renames them)
  assert.match(src('src/ui/tutorial.ts'), /const duel = row\(a\('attack'\), 'tut\.key\.attack'\) \+ row\(a\('dodge'\), 'tut\.key\.dodge'\) \+ row\(a\('pause'\), 'tut\.key\.pause'\);/);
  assert.equal(EN['tut.key.attack'], 'the bout twice as fast, and back');
  assert.equal(EN['tut.key.dodge'], 'skip to the result');
  // equal numbers read from different rules (the cooldown and the AP's cap are both 5; the guard against a skill seen coming, a guarded blow's gauge and the
  // break's damage are all 2): each text reads its own constant
  const tuSrc = src('src/ui/tutorial.ts'), dtSrc = src('src/ui/duelTutorial.ts');
  for (const [file, line] of [
    [tuSrc, 'gain: R.ap.light, start: R.ap.start, max: R.ap.max, cool: AUTO_COOLDOWN, lo: Math.min(...hits), hi: Math.max(...hits), times: R.react.skillGuard, reduce: pct(R.guardReduce), stun: R.brk.stun, dmg: R.brk.dmg, form: pct(R.form)'],
    [dtSrc, "case 'ap': return tx(k, { gain: R.ap.light, start: R.ap.start + (d.ren.apStart ?? 0), max: R.ap.max, cool: AUTO_COOLDOWN });"],
    [dtSrc, 'return tx(k, { times: R.react.skillGuard, reduce: pct(R.guardReduce), foe,'],
    [dtSrc, "case 'gauge': return tx(k, { mul: R.gauge.guardMul });"],
    [dtSrc, "case 'break': return tx(k, { stun: R.brk.stun, times: R.brk.dmg });"],
  ]) assert.ok(file.includes(line), line);
  // the chapter's figure: the order of the four as the duel follows it (the match sheet's, autoOrderView)
  assert.equal(TU.CHAPTERS.find((c) => c.id === 'duel').fig, 'order');
  // the light attack has one name in the order (the match sheet, the skills page, this chapter's figure) and on the duel's HUD, in English and in French
  // (journal Passe LC5: the French order said « Coup rapide », the old duel's quick blow, where the HUD says « Attaque simple »)
  assert.equal(EN['ui.skill.light'], EN['auto.light']);
  T.useLanguage('fr', FR);
  try { assert.equal(T.tx('ui.skill.light'), T.tx('auto.light')); } finally { T.useLanguage('en'); }
  // the eve's hint and the tour's last band say the order and the duel that plays itself
  assert.match(EN['tut.hint.eve.body'], /choose your four skills and their order/);
  assert.match(EN['tut.tour.end.body'], /you prepare it, and the duel plays itself/);
});
