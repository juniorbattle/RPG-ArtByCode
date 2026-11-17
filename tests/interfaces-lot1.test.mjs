// The interfaces' lot 1 (the operator's sheet https://claude.ai/artifact/BRKQQcAXD6N9HTMZdmohnc, IA-01 to IA-14 read back fourteen of fourteen at the recommendation,
// journal Passe IA2; built in journal Passe IA3): IA-01 a new game made once and a question before a save is replaced, IA-02 one rule for every zone that scrolls, IA-04
// the list Q by groups. The pages are drawn in a browser (tools/interfaces-proof.mjs); what they decide is read here without one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const R = await load('/src/simulation/roles.ts');
const Z = await load('/src/input/zone.ts');
const L = await load('/src/ui/listModel.ts');
const P = await load('/src/ui/play.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR_TEXTS } = await load('/src/narrative/text/fr-texts.ts');
const ROOT = path.resolve(import.meta.dirname, '..');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

// ---------------------------------------------------------------------------------------------------------------------------------------- IA-01

test('IA-01: the address of a game\'s first page loses `new` and keeps the rest, so a reload reads the save', () => {
  assert.equal(P.withoutNew('?play=1&new=1&name=Ren'), '?play=1&name=Ren');
  assert.equal(P.withoutNew('?play=1&new=1'), '?play=1');
  assert.equal(P.withoutNew('?new=1'), '');
  assert.equal(P.withoutNew(''), '');
  assert.equal(P.withoutNew('?play=1&lang=fr&new=1&seed=9&name=Ada%20L'), '?play=1&lang=fr&seed=9&name=Ada+L', 'every other parameter kept (the tools\' carried ones, the seed)');
  // another page's address never carried it
  const q = new URLSearchParams('play=1&new=1&lang=fr&reduced=1');
  assert.equal(P.playUrl(q, { arrive: 'district' }).includes('new'), false, 'playUrl drops `new`');
});

test('IA-01: the game is created once; the page consumes `new` only after its save is written, and a reload plays the opening again without making the game anew', () => {
  const s = src('src/ui/play.ts');
  assert.match(s, /const saved = writeSave\(state\);/, 'the save\'s success is read');
  assert.match(s, /if \(b\.params\.has\('new'\) && saved\) keepOpening\(\);/, 'never consumed when the save failed (a reload would have nothing to read)');
  assert.match(s, /b\.opening = b\.params\.has\('new'\) \|\| openingKept\(\);/, 'the opening (tour, title music) follows `new` or the history entry\'s memory');
  assert.match(s, /history\.replaceState\(\{ \.\.\.\(\(history\.state/, 'the entry remembers the opening');
  assert.match(s, /if \(params\.has\('new'\)\) return \{ state: withRules\(newGame/, 'a game is made anew only by an address that says `new`');
  const town = src('src/ui/playTown.ts');
  assert.equal((town.match(/b\.opening \?\? b\.params\.has\('new'\)/g) ?? []).length, 2, 'the town\'s music and tour read the opening, not the address');
  assert.equal(/b\.params\.has\('new'\)\)/.test(town.replace(/b\.opening \?\? b\.params\.has\('new'\)/g, '')), false, 'nothing else of the town reads `new`');
});

test('IA-01 / A-09: « New game » over a save asks before it replaces it, naming the game; Esc and « Back » keep it; a held Enter never answers', () => {
  const s = src('src/ui/title.ts');
  assert.match(s, /if \(save && !asked\) \{[\s\S]*?replaceAsk[\s\S]*?replaceYes[\s\S]*?go\.focus\(\);[\s\S]*?return;[\s\S]*?\}/, 'the first press asks, the button now says what it does and has the keyboard');
  assert.match(s, /e\.key === 'Enter'\) \{ e\.preventDefault\(\); if \(!e\.repeat\) start\(\);/, 'a key held down does not press twice, and the Enter that asks is consumed (the button the focus moves to is not pressed by it)');
  assert.match(s, /performance\.now\(\) - asked < 400/, 'nor a second press within a breath');
  assert.match(s, /e\.key === 'Escape' && asked[\s\S]*?menuButtons\(\)/, 'Esc keeps the save');
  assert.match(s, /leaveTo\(`\?play=1&new=1&name=/, 'a game without a save goes straight in');
  for (const k of ['ui.title.replaceAsk', 'ui.title.replaceYes']) {
    assert.ok(EN[k] && FR_TEXTS[k], `${k} in both languages`);
    assert.equal(EN[k].match(/\{[a-z]+\}/g)?.sort().join() ?? '', FR_TEXTS[k].match(/\{[a-z]+\}/g)?.sort().join() ?? '', `${k}: the same slots`);
  }
  assert.match(EN['ui.title.replaceAsk'], /\{name\}.*\{day\}/);
});

// ---------------------------------------------------------------------------------------------------------------------------------------- IA-02

/** a box as the page lays it out: a text of `h` px in a window of `view` px, scrolled to `top` */
const box = (h, view, top = 0) => ({ scrollHeight: h, clientHeight: view, scrollTop: top });
/** a page's root as the document answers a query: the boxes by selector */
const page = (m) => ({ querySelectorAll: (sel) => (m[sel] ?? []) });

test('IA-02: the reading zone is the text a page lets the player read: the detail first, then the body, then a list alone, the first that overflows', () => {
  const list = box(900, 300), detail = box(700, 300), body = box(400, 200), fits = box(100, 300);
  // the guide: its list stands before its detail in the page; the right stick scrolled the list (A-02)
  assert.equal(Z.readingZone(page({ '.pm-detail': [detail], '.pm-scroll': [list, detail] })), detail, 'the detail, not the list that comes first');
  assert.equal(Z.readingZone(page({ '.pm-detail': [fits], '.pm-body': [body], '.pm-scroll': [list] })), body, 'a detail that fits gives way to the body');
  assert.equal(Z.readingZone(page({ '.pm-detail': [fits], '.pm-scroll': [list, fits] })), list, 'a list alone is read when it is all there is');
  assert.equal(Z.readingZone(page({ '.pm-detail': [fits], '.pm-body': [fits], '.pm-scroll': [fits] })), null, 'nothing overflows, nothing to scroll');
  assert.equal(Z.readingZone(page({})), null);
  assert.deepEqual([...Z.ZONES], ['.pm-detail', '.pm-body', '.pm-scroll']);
});

test('IA-02: Page ↓ and Page ↑ take a zone by most of its height, Home and End to its ends, never past them', () => {
  const z = box(1000, 300);
  assert.equal(Z.pageTarget(z, 'PageDown'), 255, '0.85 of 300');
  assert.equal(Z.pageTarget(box(1000, 300, 255), 'PageDown'), 510);
  assert.equal(Z.pageTarget(box(1000, 300, 600), 'PageDown'), 700, 'stops at the end');
  assert.equal(Z.pageTarget(box(1000, 300, 700), 'PageDown'), 700);
  assert.equal(Z.pageTarget(box(1000, 300, 100), 'PageUp'), 0, 'stops at the top');
  assert.equal(Z.pageTarget(box(1000, 300, 600), 'PageUp'), 345);
  assert.equal(Z.pageTarget(z, 'End'), 700);
  assert.equal(Z.pageTarget(box(1000, 300, 500), 'Home'), 0);
  assert.equal(Z.pageTarget(z, 'ArrowDown'), null, 'the arrows are the pages\' own');
  assert.equal(Z.pageTarget(box(100, 300), 'PageDown'), 0, 'a short text has no further to go');
  assert.equal(Z.pageTarget(box(1000, 40), 'PageDown'), 40, 'a page is at least 40 px, a tiny zone still moves');
  // the whole text is read in a few presses
  let t = 0, n = 0; while (t < 700) { t = Z.pageTarget(box(1000, 300, t), 'PageDown'); n++; }
  assert.ok(n <= 4, `a 1000 px text in a 300 px zone takes ${n} presses`);
  assert.equal(Z.moreBelow(box(1000, 300, 0)), true);
  assert.equal(Z.moreBelow(box(1000, 300, 700)), false, 'the line leaves at the end');
  assert.equal(Z.moreBelow(box(300, 300)), false);
});

test('IA-02: one rule for every page: scrollFade installs the keys and the line, the pad\'s stick reads the same zone, the texts say it in both languages', () => {
  const st = src('src/ui/style.ts');
  assert.match(st, /export function scrollFade[\s\S]*?installPageKeys\(\); watchPages\(\);/, 'every zone that fades is under the rule');
  assert.match(st, /zone\.matches\('\.pm-detail, \.pm-body'\)/, 'the line is for the text, never for a list the arrows walk');
  const pad = src('src/input/PadInput.ts');
  assert.match(pad, /const box = readingZone<HTMLElement>\(root\);/, 'the right stick scrolls the reading zone (the detail, not the first box)');
  assert.equal(/'\.pm-detail, \.pm-scroll, \.pm-body'/.test(pad), false, 'the former order is gone');
  const z = src('src/input/zone.ts');
  assert.match(z, /e\.defaultPrevented/, 'a key a page took is left to it');
  assert.match(z, /t\.tagName === 'INPUT'/, 'a field keeps Home and End');
  for (const k of ['ui.more.key', 'ui.more.pad', 'ui.group.time', 'ui.group.steal']) assert.ok(EN[k] && FR_TEXTS[k], `${k} in both languages`);
  assert.match(EN['ui.more.key'], /Page ↓/); assert.match(FR_TEXTS['ui.more.key'], /Page ↓/);
  // the arrows are in the embedded fonts' range (src/ui/design/system.ts LATIN_RANGE: U+2191, U+2193)
  assert.match(src('src/ui/design/system.ts'), /U\+2191, U\+2193/);
});

// ---------------------------------------------------------------------------------------------------------------------------------------- IA-04

/** the lines the list shows in a named state, as townUi.openHere filters them */
const lines = (name) => {
  const st = G.namedState(name);
  return { st, opts: G.actions(st).filter((o) => { const by = R.offeredBy(o.action); return o.action.type !== 'talk' && o.action.type !== 'move' && (by === null || by === 'forge') && (o.ok || ['rest', 'wait', 'nightfall'].includes(o.action.type)); }) };
};

test('IA-04: the lines go by group: the answer, what the place is for, the time to pass, then the theft and the force', () => {
  assert.equal(L.hereGroup('steal'), 'steal'); assert.equal(L.hereGroup('pickpocket'), 'steal'); assert.equal(L.hereGroup('seize'), 'steal');
  assert.equal(L.hereGroup('rest'), 'time'); assert.equal(L.hereGroup('wait'), 'time'); assert.equal(L.hereGroup('nightfall'), 'time');
  assert.equal(L.hereGroup('answer'), 'answer');
  for (const t of ['train', 'drillSkill', 'upgradeWeapon', 'register', 'restitute', 'payWatch', 'work']) assert.equal(L.hereGroup(t), 'do', `${t} is what the place is for`);
  assert.deepEqual([...L.HERE_GROUPS], ['answer', 'do', 'time', 'steal']);
  assert.equal(L.opensOn('answer'), true); assert.equal(L.opensOn('do'), true); assert.equal(L.opensOn('time'), false); assert.equal(L.opensOn('steal'), false);
});

test('IA-04: in every place of a game, the grouped list never starts on the time to pass or the theft, and holds the same lines as before', () => {
  for (const name of ['v2-day1-morning', 'v2-forecourt-morning', 'v2-training-morning', 'v2-square-afternoon', 'v2-square-night', 'v2-day2-afternoon', 'v2-training-dusk', 'v2-wanted-night']) {
    const { opts } = lines(name), g = L.groupHere(opts);
    assert.equal(g.answer.length + g.do.length + g.time.length + g.steal.length, opts.length, `${name}: no line lost or doubled`);
    for (const grp of L.HERE_GROUPS) for (const o of g[grp]) assert.equal(L.hereGroup(o.action.type), grp, `${name}: a ${o.action.type} line stands in ${grp}`);
    // each group keeps the game's own order
    for (const grp of L.HERE_GROUPS) assert.deepEqual(g[grp], opts.filter((o) => L.hereGroup(o.action.type) === grp), `${name}: ${grp} in the game's order`);
    // the page appends answer, do, (people), time, steal: the first line the keyboard can take is an answer or a `do`, else a person, never the time or the theft
    const front = [...g.answer, ...g.do].find((o) => o.ok);
    if (front) assert.ok(L.opensOn(L.hereGroup(front.action.type)), `${name}: opens on ${front.action.type}`);
    assert.equal(g.time.concat(g.steal).some((o) => L.opensOn(L.hereGroup(o.action.type))), false, `${name}: the time and the theft are not groups the list opens on`);
  }
  // the training ground: five trainings and seven drills are what the place is for, before the people; Wait comes after them
  const { opts } = lines('v2-training-morning'), g = L.groupHere(opts);
  assert.ok(g.do.length >= 5 && g.do.every((o) => ['train', 'drillSkill'].includes(o.action.type)));
  assert.deepEqual(g.time.map((o) => o.action.type), ['rest', 'wait']);
  assert.ok(g.steal.length >= 5);
});

test('IA-04: the page draws it: the groups under titles, the people between, the first useful line focused, today\'s game untouched', () => {
  const s = src('src/ui/townUi.ts');
  assert.match(s, /const g = groupHere\(opts\)/);
  assert.match(s, /if \(v2\) \{\s*if \(g\.answer\.length\) \{ title\('v2\.encounter\.title'\);/, 'the encounter\'s answers under their own title, first (C-17)');
  assert.match(s, /\} else for \(const o of opts\) list\.appendChild\(line\(o\)\);/, 'today\'s game keeps its list as it was');
  assert.match(s, /if \(v2\) \{ tail\('time', 'ui\.group\.time'\); tail\('steal', 'ui\.group\.steal'\); \}/, 'the time, then the theft, after the people');
  assert.match(s, /\.pm-btn:not\(:disabled\):not\(\[data-group\]\)/, 'the list never opens on the time to pass nor the theft');
  assert.ok(s.indexOf("title('v2.encounter.title')") < s.indexOf('tx(\'ui.peopleHere\')') && s.indexOf('tx(\'ui.peopleHere\')') < s.indexOf("tail('time'"), 'answer, people, time in that order');
  assert.match(EN['v2.encounter.title'], /answer/i);
});
