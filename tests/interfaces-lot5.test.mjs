// The interfaces' lot 5 (journal Passe IA7; the operator's IA-11 « Corriger les caps de la croix et le nom ; vérifier le reste à ma manette » and IA-12 « Un lot de finitions », read
// back at the recommendation in journal Passe IA2; the findings C-26, A-13, A-14, A-16, A-17, A-18, A-20, B-07, B-10, B-16, B-24, C-03, C-12, C-13, C-15, C-28 of journal Passe IA1,
// and Space as a scroll key where it does nothing else, which journal Passe IA3 could not place). What is proved here, in Node:
// - the four caps of the D-pad are four different drawings, one arm filled each, and the hand's four skills have four different caps;
// - the new game's button says whose game it starts, in both languages; the title's keys line never says the arrows twice;
// - Space reads on only where it does nothing else (`spaceReads`);
// - the texts: the tour and the guide no longer call a number a « key » next to a button's symbol; the guide holds the chapters the documents say;
// - the finishes as the source holds them: the settings' controls (the vibration after a pad was seen, the rebind line above the keys), the gear page's Esc while an accessory
//   asks its place, the challenge's result without the pool, the HUD under a page, the hint over the corner's figures, the sheet of a challenge stake first, the gear detail's one
//   height, the conditions in the catalogue's place, a list's row never a fragment, the contrast tool's exemption of a disabled control.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const GL = await load('/src/input/glyphs.ts');
const PAD = await load('/src/input/pad.ts');
const ZONE = await load('/src/input/zone.ts');
const KY = await load('/src/settings/keys.ts');
const TX = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR } = await load('/src/narrative/text/fr.ts');
const TITLE = await load('/src/ui/title.ts');
const TUT = await load('/src/ui/tutorial.ts');

const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');
const STYLE = src('src/ui/style.ts'), SETTINGS = src('src/ui/settings.ts'), GEAR = src('src/ui/gearPage.ts'), ARENA = src('src/ui/playArena.ts'), TOWN = src('src/ui/townUi.ts');
const HUDCSS = src('src/arena/ArenaHud.ts'), TUTSRC = src('src/ui/tutorial.ts');
const inFrench = (f) => { TX.useLanguage('fr', FR); try { return f(); } finally { TX.useLanguage('en'); } };

// ------------------------------------------------------------------------------------------------- IA-11: the pad

test('IA-11, C-26: the four caps of the D-pad are four drawings, one arm filled each, and the hand\'s four skills have four different caps', () => {
  const dirs = ['up', 'down', 'left', 'right'];
  const drawn = dirs.map((d) => GL.dpad(d));
  assert.equal(new Set(drawn).size, 4, 'four different drawings');
  // the arm of each direction, and only that one, is the solid part: one `fill="currentColor"` path, at the arm's place
  const ARM = { up: 'M7 1.5h6V7H7Z', down: 'M7 13h6v5.5H7Z', left: 'M1.5 7H7v6H1.5Z', right: 'M13 7h5.5v6H13Z' };
  dirs.forEach((d, i) => {
    assert.equal((drawn[i].match(/fill="currentColor"/g) ?? []).length, 1, `${d}: one solid arm`);
    assert.ok(drawn[i].includes(`<path d="${ARM[d]}" fill="currentColor"`), `${d}: its own arm`);
    assert.match(drawn[i], /stroke-opacity="\.5"/, `${d}: the rest of the cross is faint`);
  });
  // the cross is drawn on 20 px (it was 14: the one filled arm was lost in the cross's own outline)
  for (const d of drawn) assert.match(d, /width="20" height="20" viewBox="0 0 20 20"/);
  // no direction: the whole cross at full strength
  assert.doesNotMatch(GL.dpad(null), /fill="currentColor"|stroke-opacity/);
  // the pad's caps for the four of the order: the D-pad's up, right, down, left, each its own drawing and its own name
  const skillBtns = ['skill1', 'skill2', 'skill3', 'skill4'].map((a) => PAD.bindButton(a, 'arena'));
  assert.deepEqual(skillBtns, [PAD.BTN.UP, PAD.BTN.RIGHT, PAD.BTN.DOWN, PAD.BTN.LEFT]);
  for (const fam of ['xbox', 'ps', 'nintendo']) {
    const caps = skillBtns.map((b) => GL.capOf(fam, b));
    assert.equal(new Set(caps.map((c) => c.html)).size, 4, `${fam}: four different caps`);
    assert.deepEqual(caps.map((c) => c.label), ['D-pad up', 'D-pad right', 'D-pad down', 'D-pad left']);
  }
  // the walking keys on the D-pad are four different caps as well
  assert.equal(new Set(['up', 'down', 'left', 'right'].map((a) => GL.capOf('xbox', PAD.bindButton(a, 'other')).html)).size, 4);
});

test('IA-11, A-13: the new game\'s button says whose game it starts, in both languages, and the field\'s name or « Ren »', () => {
  assert.match(EN['ui.title.enter'], /\{name\}/);
  assert.match(FR['ui.title.enter'], /\{name\}/);
  assert.equal(TX.tx('ui.title.enter', { name: 'Ren' }), 'Enter the Cité as Ren');
  assert.equal(inFrench(() => TX.tx('ui.title.enter', { name: 'Ren' })), 'Entrer dans la Cité en tant que Ren');
  const T = src('src/ui/title.ts');
  // the button's words follow the field, the name cleaned as the game cleans it (an empty field is « Ren »)
  assert.match(T, /input\.addEventListener\('input', sayGo\); sayGo\(\);/);
  assert.match(T, /go\.textContent = tx\('ui\.title\.enter', \{ name: cleanName\(input\.value\) \}\)/);
  // and the question over a save still replaces the button's words (the first press asks, then the button says what it does)
  assert.match(T, /go\.textContent = tx\('ui\.title\.replaceYes'\)/);
  assert.match(T, /if \(!asked\) go\.textContent/);
});

test('IA-12, A-14: the title\'s keys line says the arrows once, whatever slot the player emptied', () => {
  const key = (code) => ({ c: code, k: code });
  const ARROWS = { up: key('ArrowUp'), down: key('ArrowDown'), left: key('ArrowLeft'), right: key('ArrowRight') };
  const WASD = { up: { c: 'KeyW', k: 'w' }, down: { c: 'KeyS', k: 's' }, left: { c: 'KeyA', k: 'a' }, right: { c: 'KeyD', k: 'd' } };
  const table = (first, second) => KY.readKeys(Object.fromEntries(['up', 'down', 'left', 'right'].map((d) => [d, [first?.[d] ?? null, second?.[d] ?? null]])), 'qwerty');
  // today's keys: the arrows or WASD
  assert.equal(TITLE.keysLine(KY.DEFAULT_KEYS.qwerty), 'Keyboard: arrows or WASD to walk, E to talk');
  // the first keys emptied: the arrows, once (it said « arrows or Up Left Down Right »)
  assert.equal(TITLE.keysLine(table(null, ARROWS)), 'Keyboard: arrows to walk, E to talk');
  // the arrows emptied: WASD alone
  assert.equal(TITLE.keysLine(table(WASD, null)), 'Keyboard: WASD to walk, E to talk');
  // the first keys changed to the arrows' own letters, the second the arrows: still two things said
  assert.equal(TITLE.keysLine(table({ up: { c: 'KeyY', k: 'y' }, left: { c: 'KeyB', k: 'b' }, down: { c: 'KeyX', k: 'x' }, right: { c: 'KeyC', k: 'c' } }, ARROWS)), 'Keyboard: arrows or YBXC to walk, E to talk');
  assert.match(inFrench(() => TITLE.keysLine(table(null, ARROWS))), /^Clavier\s:\sflèches pour marcher, E pour parler$/u);
});

// ------------------------------------------------------------------------------------------------- Space reads on

test('Space reads on where it does nothing else: a card the keyboard has reached the foot of, never a page whose foot offers Space, a list, a field, a pad\'s press', () => {
  const base = { trusted: true, field: false, footHasSpace: false, onFootButton: true, textZone: true, more: true };
  assert.equal(ZONE.spaceReads(base), true, 'the foot\'s button of a card with more below');
  for (const [k, v] of Object.entries({ trusted: false, field: true, footHasSpace: true, onFootButton: false, textZone: false, more: false })) {
    assert.equal(ZONE.spaceReads({ ...base, [k]: v }), false, `${k} ${v}: Space is left to the page`);
  }
  // the keys the zone answers are unchanged
  assert.deepEqual([...ZONE.SCROLL_KEYS], ['PageDown', 'PageUp', 'Home', 'End']);
  const z = { scrollHeight: 1000, clientHeight: 400, scrollTop: 0 };
  assert.equal(ZONE.pageTarget(z, 'PageDown'), 340);
  // the press that reads never presses the button on its release, and at the end of the text Space is the button's own again
  const Z = src('src/input/zone.ts');
  assert.match(Z, /document\.addEventListener\('keyup', \(e\) => \{ if \(e\.key === ' ' && spaceTaken\)/);
  assert.match(Z, /more: moreBelow\(zone\) \|\| \(e\.shiftKey && zone\.scrollTop > 1\)/);
  assert.match(Z, /onFootButton: !!t\.closest\('\.pm-foot'\) && root\.contains\(t\) && t\.tagName === 'BUTTON'/);
  assert.match(Z, /footHasSpace: !!root\.querySelector\('\.pm-foot kbd\[data-key="Space"\]'\)/);
});

// ------------------------------------------------------------------------------------------------- the words

test('IA-12, A-20: the tour and the guide say a number beside the list\'s button, not a key, in both languages; the guide holds fourteen chapters and the documents say so', () => {
  for (const [lang, T, key] of [['en', EN, /\bkey\b/i], ['fr', FR, /\btouche\b/i]]) {
    for (const k of ['tut.tour.list.body', 'tut.ch.moving.todo']) {
      assert.match(T[k], /\[Q\]/, `${lang} ${k}`);
      assert.doesNotMatch(T[k], key, `${lang} ${k}: no « key » beside the button's symbol`);
    }
  }
  assert.match(EN['tut.tour.list.body'], /The number beside it counts what there is to do here/);
  assert.match(FR['tut.tour.list.body'], /Le nombre à côté compte ce qu’il y a à faire ici/);
  assert.equal(TUT.CHAPTERS.length, 14);
  const agents = src('AGENTS.md');
  assert.doesNotMatch(agents, /twelve chapters/);
  assert.match(agents, /the guide, a page of the menu and H, built as the journal, fourteen chapters/);
  assert.doesNotMatch(TUTSRC, /twelve chapters/);
  // the gear page's two new words, with the same slots in both tables
  assert.equal(EN['ui.gear.cancelPick'], 'Cancel the choice');
  assert.equal(FR['ui.gear.cancelPick'], 'Annuler le choix');
});

// ------------------------------------------------------------------------------------------------- the finishes

test('IA-12, A-18: the controls part shows the vibration switch only once a pad was seen, and the line on rebinding stands above the keys it speaks of', () => {
  assert.match(SETTINGS, /if \(padIn\?\.pad\(\)\?\.seen\) detail\.appendChild\(toggle\(tx\('v2\.sound\.vibration'\)/);
  assert.match(SETTINGS, /heading\(tx\('set\.keys\.walk'\)\), note\(tx\('set\.keys\.rebind'\)\),\n\s+table\(own\('up'/);
  // a pad first seen while the part is open brings its switch in (the part is drawn again, its scroll and focus kept), and the watch ends with the page or the part
  assert.match(SETTINGS, /if \(!m\.pad\(\)\?\.seen\) padWatch = window\.setInterval\(\(\) => \{ if \(shown !== 'controls' \|\| !root\.isConnected\) \{ window\.clearInterval\(padWatch\); return; \} if \(m\.pad\(\)\?\.seen\) \{ window\.clearInterval\(padWatch\); again\(m\); \} \}, 400\);/);
  assert.match(SETTINGS, /window\.clearInterval\(padWatch\);\n\s+\/\/ a change said on its line belongs to its part/);
  assert.match(SETTINGS, /detail\.replaceChildren\(\); controls\(m\); detail\.scrollTop = top;/);
  // not drawn twice: the line is no longer appended before the tables
  assert.equal((SETTINGS.match(/note\(tx\('set\.keys\.rebind'\)\)/g) ?? []).length, 1);
  // PadInput says whether a pad was seen
  assert.match(src('src/input/PadInput.ts'), /seen = false;/);
});

test('IA-12, B-10: while an accessory asks its place the foot says Esc cancels the choice, and Esc does cancel it', () => {
  assert.match(GEAR, /S\.armed \? footBtn\('Esc', tx\('ui\.gear\.cancelPick'\), \(\) => \{ S\.armed = null; S\.msg = ''; paint\(\); \}\) : close/);
  // the page's own Escape handler cancels the choice and stays (the foot told the truth)
  assert.match(GEAR, /if \(S\.armed\) \{ S\.armed = null; S\.msg = ''; e\.preventDefault\(\); e\.stopPropagation\(\); paint\(\); return; \}/);
});

test('IA-12, C-13: a challenge\'s result shows no pool table (the pool is the tournament\'s)', () => {
  assert.match(ARENA, /\$\{challenge \? '' : `<p class="pm-sub">\$\{tx\('ui\.pool'\)\}<\/p>\$\{standingsHtml\(st, standings\(st\)\)\}`\}/);
  assert.doesNotMatch(ARENA, /\$\{corvin\}<p class="pm-sub">\$\{tx\('ui\.pool'\)\}/);
});

test('IA-12, C-03 and C-28: a page over the duel takes the screen, the HUD fading out under it; a band lives beside the HUD', () => {
  assert.match(HUDCSS, /body:has\(\.pm-overlay:not\(\.pm-band\)\) #arena-hud\{opacity:0\}/);
  assert.match(HUDCSS, /#arena-hud\{transition:opacity \.2s ease-out\}/);
  // the gate and the lessons are bands (they live beside the HUD); the result and the settings are not
  assert.match(ARENA, /\[\{ id: 'fight', label: tx\('ui\.arena\.fight'\), primary: true \}\], true\)\.done/);
  assert.match(src('src/ui/duelTutorial.ts'), /'pm pm-overlay pm-band tu-band tu-duel'/);
});

test('IA-12, C-15: a hint fades the corner\'s figures out while it is up', () => {
  assert.match(TUTSRC, /body:has\(\.tu-hint\) #pm-status,body:has\(\.tu-hint\) #pm-figs\{opacity:0\}/);
  assert.match(TUTSRC, /#pm-status,#pm-figs\{transition:opacity \.2s ease-out\}/);
});

test('IA-12, C-12: the sheet of a challenge says its stake and what a win gives before the table, and the table\'s rows tighten on a window of 800 px or less', () => {
  const at = (s) => TOWN.indexOf(s);
  const sheet = TOWN.slice(at('private challengeSheetHtml'), at('private matchSheetHtml'));
  const iStake = sheet.indexOf('${esc(stake)}'), iWin = sheet.indexOf('${esc(win)}'), iNo = sheet.indexOf("tx('v2.result.noVigour')"), iVs = sheet.indexOf('+ vs +'), iKnown = sheet.indexOf('known.map'), iNote = sheet.indexOf("tx('auto.sheet.note'");
  assert.ok(iStake > 0 && iStake < iWin && iWin < iNo && iNo < iVs && iVs < iKnown && iKnown < iNote, `stake, win, no health, the table, what is known, the note: ${[iStake, iWin, iNo, iVs, iKnown, iNote]}`);
  assert.match(STYLE, /@media \(max-height:800px\)\{\.pm-vs\{margin-top:6px\}\.pm-vs td\{padding-top:1px;padding-bottom:1px\}/);
});

test('IA-12, B-07: the gear page\'s detail has one height on a window taller than a phone\'s, so the tiles\' box never changes with the focus', () => {
  assert.match(STYLE, /@media \(min-height:481px\)\{\.pm-gear \.pm-goods \.pm-detail\{height:min\(30vh,250px\)\}\}/);
  // the phone's own rule is the one it was
  assert.match(STYLE, /\.pm-gear \.pm-detail\{grid-column:2;grid-row:2;max-height:none;padding-top:0\}/);
});

test('IA-12, B-16: while the conditions of a place are open they take the catalogue\'s place, at every window (the foot fell under the card by 11 px at 1920 x 1080)', () => {
  assert.match(STYLE, /\n\.pm-skills \.pm-goods:has\(\.sk-conds\)\{grid-template-rows:auto auto minmax\(0,1fr\) auto auto\}/);
  assert.doesNotMatch(STYLE, /@media \(max-height:1000px\)\{\.pm-skills \.pm-goods:has\(\.sk-conds\)/);
  assert.match(STYLE, /\.pm-skills \.pm-goods:has\(\.sk-conds\) \.sk-bar,\.pm-skills \.pm-goods:has\(\.sk-conds\) \.sk-tiles,\.pm-skills \.pm-goods:has\(\.sk-conds\) \.pm-detail\{display:none\}/);
});

test('IA-12, B-16: the places\' box fades like every box that scrolls, while the conditions are open (the text check found it holding more than it shows on a phone held sideways)', () => {
  const SK = src('src/ui/skills.ts');
  assert.match(SK, /const fitPlaces = scrollFade\(places\); places\.classList\.remove\('pm-scroll'\);/);
  assert.match(SK, /places\.classList\.toggle\('pm-scroll', conds\);\n\s+if \(conds\) fitPlaces\(\); else delete places\.dataset\.more;/);
});

test('IA-12, A-16: a list\'s row cut by the top edge is brought whole once the keyboard has moved a line into view, unless that pushes the focused line out', () => {
  assert.match(STYLE, /box\.addEventListener\('focusin', \(\) => requestAnimationFrame\(\(\) => \{/);
  // (the focused line stays inside the box: the bottom clearance the browser leaves under it is what the snap may use, never the box's edge)
  assert.match(STYLE, /const to = Math\.min\(\.\.\.cut\.map\(top\)\);\n\s+if \(bottom\(f\) <= to \+ box\.clientHeight\) \{ box\.scrollTop = to; return; \}/);
  // a box too short to hold two rows and the fade's clearance is left to the browser (the dialogue's list of 95 px at 812 x 375: the rule had left the next row 4 px out of it)
  assert.match(STYLE, /if \(!f \|\| !box\.contains\(f\) \|\| st < 2 \|\| box\.clientHeight < 200\) return;/);
  // a row that cannot be shown whole is let go under the edge while the box can scroll that far; at the very end of the list the box is given the room it lacks, and takes it back at the next move
  assert.match(STYLE, /const c = Math\.max\(\.\.\.cut\.map\(bottom\)\) - st, room = box\.scrollHeight - box\.clientHeight;\n\s+if \(st \+ c > room \+ 0\.5\) \{ box\.style\.paddingBottom = `\$\{parseFloat\(getComputedStyle\(box\)\.paddingBottom\) \+ \(st \+ c - room\)\}px`; box\.dataset\.endPad = '1'; \}\n\s+box\.scrollTop = st \+ c;/);
  assert.match(STYLE, /if \(box\.dataset\.endPad\) \{ delete box\.dataset\.endPad; box\.style\.paddingBottom = ''; \}/);
});

test('IA-12, B-24: the contrast tool counts a disabled control apart, as WCAG 1.4.3 exempts an inactive component', () => {
  const U = src('tools/ui-contrast.mjs');
  assert.match(U, /off: !!el\.closest\('button:disabled,\[aria-disabled="true"\]'\)/);
  assert.match(U, /texts = listed\.filter\(\(t\) => !t\.off\)/);
  assert.match(U, /disabled control text\(s\) exempt, WCAG 1\.4\.3/);
});
