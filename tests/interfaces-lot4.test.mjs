// The interfaces' lot 4 (journal Passe IA6; the operator's IA-08 « Entrée dite partout, Échap d’un cran, la carte plus parlante », IA-09 « Tout dire là où le joueur décide » and IA-10
// « Resserrer l’ordre et la première leçon, juger le combat à mon essai », read back at the recommendation in journal Passe IA2; the findings A-07, A-08, A-10, A-11, B-12, B-13, B-14,
// B-22, C-02, C-11, C-14, C-16, C-18, C-19, C-20, C-21, C-24 of journal Passe IA1). What is proved here, in Node:
// - the map says who stands at each place now (`whoAt`), against the people table written out;
// - a rival one may watch is told where and when (`watchWhere`), in both languages;
// - what a theft seen costs on its line is the simulation's own number, by day, at night and for a pocket;
// - a quest offered is told as a new quest with where it is kept; the journal's row says a failure; a refusal says what it costs; Corra's line says what is owed;
// - the foot of the list Q, the dialogues, the map and the menu says what Enter does, and Esc goes back one step (a page opened from the menu comes back to it);
// - the first quarter hour: the tour ends on what to do first, the diamond's hint comes next to the first marked person, the theft's hint when the line reaches a theft, the first
//   lesson of the duel is two sentences;
// - the duel's foot says its pause, the guide's keys say Page ↓ and Page ↑, the last day says how the tournament ends.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const R = await load('/src/simulation/roles.ts');
const T = await load('/src/simulation/v2town.ts');
const SC = await load('/src/simulation/v2scout.ts');
const Q = await load('/src/simulation/v2quests.ts');
const QD = await load('/src/simulation/v2questData.ts');
const EN2 = await load('/src/simulation/v2encounter.ts');
const L = await load('/src/simulation/v2law.ts');
const DL = await load('/src/narrative/dialogue.ts');
const TX = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR } = await load('/src/narrative/text/fr.ts');
const JN = await load('/src/ui/journal.ts');

const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const TOWN = src('src/ui/townUi.ts'), STYLE = src('src/ui/style.ts'), HUD = src('src/arena/AutoHud.ts'), TUT = src('src/ui/tutorial.ts');
const inFrench = (f) => { TX.useLanguage('fr', FR); try { return f(); } finally { TX.useLanguage('en'); } };
const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const at = (st, place, slot, day) => { const s = structuredClone(st); s.place = place; s.slot = slot; if (day) s.day = day; return s; };
const act = (st, a, rng) => { const r = G.advance(st, a, rng); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const LOSE = { next: () => 0.999, fork() { return this; } };

// ------------------------------------------------------------------------------------------------- IA-08: the map says who is there

test('IA-08, B-12: the map says who stands at each place now: the people table written out, never the passers-by, the crowd nor Wynn', () => {
  const st = v2();
  // the table's people by their place and hours in a version 2 game (Orla trains on the training ground, Corvin and the generic fighters stand where their hours put them)
  assert.deepEqual(R.whoAt(at(st, 'district', 'morning'), 'district'), ['mara', 'bram', 'hale', 'tam', 'piers']);
  assert.deepEqual(R.whoAt(at(st, 'district', 'evening'), 'district'), ['mara', 'hale', 'stranger', 'corra']);
  assert.deepEqual(R.whoAt(at(st, 'district', 'morning'), 'forecourt'), ['odo', 'anwen', 'vessa', 'marek', 'hilde']);
  assert.deepEqual(R.whoAt(at(st, 'district', 'morning'), 'training'), ['orla', 'corvin', 'ilse', 'drill', 'aldric', 'tobin', 'rhosk']);
  assert.deepEqual(R.whoAt(at(st, 'district', 'evening'), 'lanterns'), ['cassius', 'lio', 'pip', 'bard', 'ambrose']);
  // the hour changes it: nobody of the quay's smith by night; the festival square's morning is Lio and Kell
  assert.deepEqual(R.whoAt(at(st, 'district', 'morning'), 'lanterns'), ['lio', 'kell']);
  for (const slot of ['morning', 'afternoon', 'evening']) for (const place of ['district', 'forecourt', 'training', 'lanterns']) {
    const ids = R.whoAt(at(st, place, slot), place);
    for (const bad of ['folk', 'wynn', 'fenwick', 'nell', 'edda', 'sela', 'garrick']) assert.ok(!ids.includes(bad), `${bad} at ${place} ${slot}`);
  }
  // a sabotaged forge: Bram is gone from the quay
  const burnt = at(st, 'district', 'morning'); burnt.services.forge = 'sabotaged';
  assert.ok(!R.whoAt(burnt, 'district').includes('bram'));
  // today's game has none of the version 2's people
  const old = G.namedState('day1-morning');
  assert.ok(!R.whoAt(old, 'training').includes('corvin') && !R.whoAt(old, 'forecourt').includes('hilde'));
});

test('IA-08: the map\'s line, its foot and its words (the people named, five at most), in both languages', () => {
  assert.match(TOWN, /const ids = whoAt\(s, \(o\.action as \{ to: GameState\['place'\] \}\)\.to\), shown = ids\.slice\(0, 5\)/);
  assert.match(TOWN, /fillFoot\(foot, enterFoot\(body, tx\('ui\.foot\.go'\)\), close\)/);
  assert.equal(TX.tx('ui.map.who', { names: 'Mara, Bram' }), 'There now: Mara, Bram');
  assert.equal(EN['ui.map.nobody'], 'Nobody you know is there now');
  assert.equal(inFrench(() => TX.tx('ui.map.who', { names: 'Mara, Bram' })), 'Sur place : Mara, Bram');
  assert.match(STYLE, /\.pm-btn \.pm-who\{display:block/, 'the map\'s line stays on a phone (the reasons are hidden there, this one is not)');
});

// ------------------------------------------------------------------------------------------------- IA-08: Enter said, Esc one step back

test('IA-08, B-22: the list Q, a dialogue, an encounter, a theft caught, the map and the menu say what Enter does; the arrows never stop on it', () => {
  const uses = TOWN.match(/enterFoot\(/g) ?? [];
  assert.ok(uses.length >= 6, `${uses.length} uses`);
  for (const where of ['openEncounter', 'openCaught', 'openHere', 'openPerson', 'openMap', 'openMenu']) {
    // the method's own text: from its definition to its closing brace (two spaces in)
    const i = TOWN.search(new RegExp(`\\n  (private )?${where}\\([^)]*\\): (void|Promise<void>) \\{`)), j = TOWN.indexOf('\n  }\n', i);
    assert.ok(i > 0 && j > i, where);
    assert.match(TOWN.slice(i, j), /enterFoot\(/, where);
  }
  // the foot's Enter does the line that has the keyboard, and is not a stop of the arrows
  assert.match(STYLE, /export function enterFoot\(list: HTMLElement, label: string\): HTMLButtonElement/);
  assert.match(STYLE, /b\.tabIndex = -1; b\.dataset\.nostop = '1'/);
  assert.match(STYLE, /button:not\(:disabled\):not\(\[data-nostop\]\)/);
  assert.equal(EN['ui.foot.choose'], 'Choose'); assert.equal(FR['ui.foot.choose'], 'Choisir');
  assert.equal(EN['ui.foot.go'], 'Go there'); assert.equal(FR['ui.foot.go'], 'Y aller');
});

test('IA-08, A-11: a page opened from the menu comes back to the menu on Esc, its foot says so; a page opened by its key closes to the game', () => {
  // the menu's lines hand the page the line they were pressed on; the page takes it, and Esc (the foot's button too) goes back to that line of the menu
  assert.match(TOWN, /b\.addEventListener\('click', \(\) => \{ this\.nextVia = i; f\(\); this\.nextVia = null; \}\)/);
  assert.match(TOWN, /const via = this\.nextVia; this\.nextVia = null;[\s\S]*this\.via = via; setOutLabel\(via !== null \? tx\('ui\.back\.menu'\) : null\);/);
  assert.match(TOWN, /if \(b\) \{ this\.nextVia = via; b\(\); this\.nextVia = null; \} else if \(via !== null\) this\.openMenu\(via\);/);
  assert.match(TOWN, /\(body\.querySelectorAll<HTMLButtonElement>\('\.pm-btn'\)\[at\] \?\? body\.querySelector<HTMLButtonElement>\('\.pm-btn'\)\)\?\.focus\(\)/);
  // every page's way out is `leave`, not a plain close
  for (const f of ['journalPage(this.st, () => this.leave())', 'settingsPage({ section, close: () => this.leave() })', 'close: () => this.leave() }, null)', ', () => this.leave(), first));', 'const close = footBtn(\'Esc\', closeLabel(), () => this.leave());']) assert.ok(TOWN.includes(f), f);
  assert.match(TOWN, /boardPage\(this\.st, standings\(this\.st\), \(\) => this\.leave\(\)/);
  // the page next door (the pad's shoulders) keeps where Esc leads
  assert.match(TOWN, /this\.nextVia = this\.via;\n[\s\S]*this\.nextVia = null;\n  \}/);
  // each page's foot says it (the one label, set while the page is built)
  for (const f of ['journal', 'board', 'notebook', 'settings', 'tutorial', 'skills', 'gearPage', 'wares']) assert.match(src(`src/ui/${f}.ts`), /closeLabel\(\)/, f);
  assert.match(STYLE, /export const closeLabel = \(\): string => outLabel \?\? tx\('ui\.close'\)/);
  assert.equal(EN['ui.back.menu'], 'Back to the menu'); assert.equal(FR['ui.back.menu'], 'Retour au menu');
});

test('IA-08, A-10: the settings open on the same part from V, the menu and the pad\'s shoulders', () => {
  const calls = TOWN.match(/openSettings\('sound'\)/g) ?? [];
  assert.equal(calls.length, 3, 'V, the menu\'s line, the shoulders');
  assert.ok(!/this\.openSettings\(\)/.test(TOWN), 'no door left on the first part');
});

// ------------------------------------------------------------------------------------------------- IA-09: say it where the player decides

test('IA-09, C-14: what a theft seen costs is said on its line, and it is the simulation\'s own number: a stall by day, a shutter forced at night, a pocket', () => {
  assert.deepEqual({ ...T.STEAL_REP }, { day: 8, night: 12, pocket: 8 });
  const lose = (st, a) => { const s0 = structuredClone(st); s0.player.reputation = 60; const r = act(s0, a, LOSE); return 60 - r.state.player.reputation; };
  assert.equal(lose(at(v2(), 'district', 'morning'), { type: 'steal', shop: 'mara', item: 'whetstone' }), T.STEAL_REP.day);
  assert.equal(lose(at(v2(), 'district', 'evening'), { type: 'steal', shop: 'mara', item: 'whetstone' }), T.STEAL_REP.night);
  assert.equal(lose(at(v2(), 'district', 'morning'), { type: 'pickpocket', who: 'nell' }), T.STEAL_REP.pocket);
  // the line carries it (the list Q's theft lines), under the words, said in both languages
  assert.match(TOWN, /forced\(s, o\.action\.shop\) \? STEAL_REP\.night : STEAL_REP\.day/);
  assert.equal(TX.tx('ui.steal.risk', { n: 8 }), 'if seen: −8 reputation');
  assert.equal(inFrench(() => TX.tx('ui.steal.risk', { n: 8 })), 'si l’on vous voit : −8 de réputation');
  // the first theft's hint waits for the line to reach a theft (IA-10)
  assert.match(TOWN, /if \(grp === 'steal' && o\.ok\) b\.addEventListener\('focus', \(\) => this\.hint\('steal'\), \{ once: true \}\)/);
  assert.ok(!/this\.hint\('steal'\);\n/.test(TOWN.replace(/\(\) => this\.hint\('steal'\)/g, '')), 'not on opening the list');
});

test('IA-09, C-19: a quest offered by the person talked to is told as a new quest, with where it is kept; only the offer, never a failure or a word', () => {
  const asked = [];
  for (const [id, who, day] of [['cargo', 'tam', 1], ['herbs', 'anwen', 2], ['treatise', 'corvin', 3], ['sharps', 'lio', 2]]) {
    const s = v2(); s.day = day;
    const emitted = []; Q.offerQuest(s, who, (e) => emitted.push(e));
    assert.deepEqual(emitted.map((e) => e.id), [`quest:${id}`]); asked.push(...emitted.map((e) => e.id));
  }
  assert.ok(asked.every((id) => /^quest:[a-z]+$/.test(id)));
  for (const id of ['quest:herbs:failed', 'quest:sharps:word:vessa', 'quest:cargo:failed']) assert.ok(!/^quest:[a-z]+$/.test(id), id);
  assert.match(TOWN, /if \(\/\^quest:\[a-z\]\+\$\/\.test\(e\.id\)\) this\.questLines\.add\(said\(e\.text, e\.\$t\)\)/);
  assert.match(TOWN, /<p class="news quest" role="status"><b>\$\{esc\(tx\('ui\.quest\.new'\)\)\}<\/b>/);
  // the offer's own « Quest — » is not said twice
  for (const [lang, table] of [['en', EN], ['fr', FR]]) for (const q of ['cargo', 'herbs', 'treatise', 'sharps']) {
    const t = table[`v2.quest.${q}.offer`]; assert.match(t, /^[^—]{0,12}— /, `${lang} ${q}`);
    assert.doesNotMatch(t.replace(/^[^—]{0,12}— /, ''), /^(Quest|Quête)/);
  }
  assert.equal(EN['ui.quest.new'], 'New quest'); assert.equal(FR['ui.quest.new'], 'Nouvelle quête');
  assert.match(EN['ui.quest.noted'], /journal.*In progress/); assert.match(FR['ui.quest.noted'], /journal.*En cours/);
});

test('IA-09, C-20: the « In progress » row says a failure: open, failed, settled', () => {
  const e = (state) => ({ id: 'cargo', state, title: 't', step: null, place: null, deadline: null, reward: 'r' });
  assert.equal(JN.questSummary([]), 'no quest yet');
  assert.equal(JN.questSummary([e('open')]), '1 quest open');
  assert.equal(JN.questSummary([e('open'), e('open')]), '2 quests open');
  assert.equal(JN.questSummary([e('done')]), 'all settled');
  assert.equal(JN.questSummary([e('failed')]), '1 quest failed', 'after a failure, never « all settled »');
  assert.equal(JN.questSummary([e('done'), e('failed'), e('failed')]), '2 quests failed');
  assert.equal(JN.questSummary([e('open'), e('failed')]), '1 quest open · 1 quest failed');
  assert.equal(inFrench(() => JN.questSummary([e('failed')])), '1 quête ratée');
  assert.equal(inFrench(() => JN.questSummary([e('open'), e('failed'), e('failed')])), '1 quête ouverte · 2 quêtes ratées');
});

test('IA-09, C-18, C-16, C-11: a refusal says what it costs, Corra says what is owed, a challenge says it is once a phase', () => {
  // the card sharps' refusal: the reputation and Lio's goodwill, from the event's own numbers
  const s = at(v2(), 'lanterns', 'evening', 2); s.v2.encounter = { id: 'sharps', place: 'lanterns', day: s.day, slot: s.slot };
  const refuse = G.actions(s).find((o) => o.action.type === 'answer' && o.action.how === 'refuse');
  assert.ok(refuse, 'the refusal is offered');
  assert.equal(EN2.ENCOUNTERS.sharps.refuse.reputation, -2);
  assert.match(refuse.label, /−2 reputation, and Lio less friendly/);
  assert.match(inFrench(() => G.actions(s).find((o) => o.action.type === 'answer' && o.action.how === 'refuse').label), /−2 de réputation, et Lio moins aimable/);
  // the muscle's line: who sent them and the coins that settle it
  const r = at(v2(), 'district', 'evening', 4); r.v2.reprisal = { by: 'mara', until: 6 };
  const line = DL.linesOf(r, 'corra')[0];
  assert.match(line, new RegExp(`Mara sent me: you took what was theirs\\. Pay me ${L.LAW.payOff} coins`));
  assert.match(inFrench(() => DL.linesOf(r, 'corra')[0]), new RegExp(`Mara m’envoie : tu as pris ce qui lui appartenait\\. Paie-moi ${L.LAW.payOff} pièces`));
  // a challenge's offer says it is once a phase (the refusal's words stay)
  assert.match(TOWN, /tag && o\.ok && o\.action\.type === 'challenge' \? `<span class="cost">\$\{esc\(tx\('ui\.oncePhase'\)\)\}<\/span>`/);
  assert.equal(EN['ui.oncePhase'], 'once a phase'); assert.equal(FR['ui.oncePhase'], 'une fois par phase');
});

test('IA-09, B-13: the board and Master Corvin say where and when to watch a rival, in both languages; B-14: a job says when it is open', () => {
  assert.equal(SC.watchWhere('vessa'), 'the Arena Forecourt, by day');
  assert.equal(SC.watchWhere('marek'), 'the Arena Forecourt, by day');
  for (const id of ['orla', 'ilse', 'rhosk', 'tobin']) assert.equal(SC.watchWhere(id), 'the Training Ground, by day', id);
  assert.equal(SC.watchWhere('cassius'), 'the Festival Square, at night');
  for (const id of G.SCOUTED_V2 ?? ['vessa', 'marek', 'orla', 'ilse', 'cassius', 'rhosk', 'tobin']) assert.match(SC.watchWhere(id), /^the (Arena Forecourt|Training Ground|Festival Square), (by day|at night)$/, id);
  const s = v2();
  const en = SC.scoutLines(s, 'vessa').join(' ');
  assert.match(en, /watch them at practice \(the Arena Forecourt, by day\)/);
  const fr = inFrench(() => SC.scoutLines(s, 'vessa').join(' '));
  assert.match(fr, /à l’entraînement \(.*parvis.*, de jour\)/i);
  assert.equal(EN['v2.work.when.morning'], 'That work can only be done in the morning.');
  assert.equal(FR['v2.work.when.evening'], 'Ce travail ne se fait que le soir.');
});

test('IA-09, C-02: the duel\'s foot says its pause, with the player\'s key; a click on it pauses and resumes', () => {
  assert.match(HUD, /\$\{ctl\('pause', 'pause', t\.pauseBtn, t\.pauseSub\)\}/);
  assert.match(HUD, /const ctl = \(id: 'speed' \| 'skip' \| 'pause', act: 'attack' \| 'dodge' \| 'pause'/);
  assert.match(HUD, /for \(const id of \['speed', 'skip', 'pause'\]\) this\.cls/);
  assert.match(HUD, /pauseBtn: 'Pause', pauseSub: 'the bout waits'/); assert.match(HUD, /pauseBtn: 'Pause', pauseSub: 'le combat attend'/);
  assert.match(HUD, /#arena-hud \.ah-b\.ctl kbd\{width:max-content;min-width:30px;flex:none\}/, 'a cap is never squeezed under its word');
  assert.match(src('src/arena/ArenaApp.ts'), /else if \(id === 'pause'\) \{ this\.paused = !this\.paused && !this\.moment \? true : false;/);
});

test('IA-09, C-21: the last day says how the tournament ends', () => {
  assert.match(TOWN, /tx\(s\.day >= 10 \? 'v2\.next\.doneLast' : 'v2\.next\.done'\)/);
  assert.match(EN['v2.next.doneLast'], /tenth day.*evening.*resting or waiting/);
  assert.match(FR['v2.next.doneLast'], /dixième jour.*soirée.*reposant ou en attendant/);
});

// ------------------------------------------------------------------------------------------------- IA-10: the first quarter hour

test('IA-10, A-07, A-08, C-01: the tour ends on what to do first, the diamond\'s hint comes next to the first marked person, never as the tour ends', () => {
  for (const [lang, t] of [['en', EN['tut.tour.end.body']], ['fr', FR['tut.tour.end.body']]]) {
    assert.match(t, /\[E\]/, lang); assert.match(t, /\[Q\]/, lang); assert.match(t, /\[Move\]/, lang, 'the walking keys said (A-08)'); assert.match(t, /\{day\}/, lang);
  }
  assert.match(EN['tut.tour.end.body'], /^Start by talking to someone/); assert.match(FR['tut.tour.end.body'], /^Commencez par parler à quelqu’un/);
  // no hint on the scene as the page's welcome ends: the hint waits for a marked person next to the player
  assert.match(TOWN, /markShown\(\): boolean \{ return this\.welcomed && !this\.modal; \}/);
  assert.match(TOWN, /if \(mk && this\.welcomed && !this\.modal\) this\.hint\('npcMark'\);/);
  assert.ok(!/markShown\(\): boolean \{[^}]*this\.hint\(/.test(TOWN));
});

test('IA-10, C-24: the first lesson of the duel is two sentences and the pause line, in both languages; the guide\'s « The duel » keeps the rest', () => {
  for (const [lang, t] of [['en', EN['tut.duel.start.body']], ['fr', FR['tut.duel.start.body']]]) {
    const [first, pause, ...rest] = t.split('\n');
    assert.equal(rest.length, 0, lang);
    assert.ok((first.match(/\.(\s|$)/g) ?? []).length <= 2, `${lang}: ${first}`);
    assert.match(first, /\{n\}/); assert.ok(pause.length < 80, lang);
  }
  assert.match(EN['tut.duel.start.body'], /^The computer fights this bout as you prepared it\. You use your \{n\} skills in your order/);
  // what the lesson no longer says is in the guide: the automatic's order, the rivals' rules, where it is set
  assert.match(EN['tut.ch.duel.body'], /the first of your order that has a use left[\s\S]*else your heavy blow when the opponent cannot defend, else your light attack\. Your rivals fight by the same rules/);
});

test('IA-08, IA-02: the guide\'s keys say Page ↓ and Page ↑ (the line « Page ↓ for more » said it only where it is needed)', () => {
  assert.match(TUT, /row\(`\$\{p\('PageDown'\)\}\$\{p\('PageUp'\)\}`, 'tut\.key\.page'\)/);
  assert.match(src('src/input/caps.ts'), /PageUp: 'key\.pageUp', PageDown: 'key\.pageDown'/);
  assert.match(EN['tut.key.page'], /right stick/); assert.match(FR['tut.key.page'], /stick droit/);
  assert.doesNotMatch(EN['tut.key.page'], /\d/, 'the table\'s tutorial texts hold no digit of their own');
});
