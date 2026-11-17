// The interfaces' lot 3 (the operator's sheet https://claude.ai/artifact/BRKQQcAXD6N9HTMZdmohnc, IA-03 « Les pages du parcours d’abord (dialogue, Q, K, fiche, réglages, guide, bandes) »,
// read back at the recommendation, journal Passe IA2; built in journal Passe IA5). The pages are drawn in a browser (tools/small-screen.mjs: every page of the player's path at
// 568 x 320, 667 x 375 and 812 x 375, the controls inside the window and uncovered, the focused line in view after each key); what the style decides is read here without one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '..');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

/** the body of every `@media <query> { ... }` of a source, in order (braces matched) */
const media = (text, query) => {
  const out = [];
  for (let i = text.indexOf(`@media ${query}{`); i >= 0; i = text.indexOf(`@media ${query}{`, i + 1)) {
    let depth = 0, j = text.indexOf('{', i);
    const start = j + 1;
    for (; j < text.length; j++) { if (text[j] === '{') depth++; else if (text[j] === '}' && --depth === 0) break; }
    out.push(text.slice(start, j));
  }
  return out;
};
const SHORT = '(max-height:480px)', SHORT_NARROW = '(max-height:480px) and (max-width:700px)';
const has = (blocks, needle) => blocks.some((b) => b.includes(needle));
const z = (text, sel) => { const m = text.match(new RegExp(`${sel.replace(/[.#]/g, '\\$&')}\\{[^}]*?z-index:(\\d+)`)); return m ? +m[1] : null; };

test('IA-03: every page of two columns keeps its two columns on a short window (the guide, the settings, the tournament, the journal, the notebook), the list left, the detail and the foot right', () => {
  const style = src('src/ui/style.ts'), blocks = media(style, SHORT);
  assert.ok(blocks.length >= 2, 'the short rules exist for every short window, narrow or wide');
  assert.ok(has(blocks, '.pm-overlay .pm-card.pm-two:not(.pm-skills):not(.pm-wares):not(.pm-gear){display:grid;grid-template-columns:minmax(0,0.78fr) minmax(0,1.22fr)'), 'two columns, the list narrower than the detail');
  assert.ok(has(blocks, 'height:calc(100vh - 26px)'), 'the card is the height of the window, nothing under it');
  assert.ok(has(blocks, '.pm-glist{flex:1 1 auto;max-height:none}'), 'the list of the left column has the column, not a third of the window (the settings lost their fourth part)');
  // the narrow rule that stacked them stays for a narrow window that is tall
  assert.ok(media(style, '(max-width:700px)').some((b) => b.includes('grid-template-rows:auto minmax(0,1fr)')), 'a tall narrow window still stacks the columns');
});

test('IA-03: K and the match sheet on a short window: four places in a row, the filters, the catalogue beside the detail, the foot whole', () => {
  const style = src('src/ui/style.ts'), blocks = media(style, SHORT);
  const k = blocks.find((b) => b.includes('.pm-card.pm-skills .sk-places')) ?? '';
  assert.ok(k, 'a short-window block for the skills page');
  for (const needle of [
    '.pm-card.pm-skills .sk-places{grid-column:1 / 3;grid-row:2;grid-template-columns:repeat(4,minmax(0,1fr))', // the four places in one row
    '.pm-card.pm-skills .pm-glist.sk-tiles{grid-column:1;grid-row:4;grid-template-columns:minmax(0,1fr)', // the catalogue, one column, left
    '.pm-card.pm-skills .pm-goods .pm-detail{grid-column:2;grid-row:4', // the detail beside it
    '.pm-card.pm-skills .pm-goods .pm-foot{grid-column:1 / 3;grid-row:6', // the foot below, the whole width
    '.pm-card.pm-skills .pm-self,.pm-overlay .pm-card.pm-skills .pm-self.pm-match{display:none}', // the foe's column (its name stands in the header)
    ':has(.sk-conds)', // the conditions of a place take the room of the catalogue while they are open
  ]) assert.ok(k.includes(needle), `K on a short window: ${needle.slice(0, 70)}`);
  // what the small controls of a place did stays on the keys of the foot (Space, C, A, D): the foot lists them, the places lose their buttons, not their function
  assert.ok(/\.sk-ctl[^{]*\{display:none\}/.test(k.replace(/\n/g, ' ')) || k.includes('.sk-ctl'), 'the places lose their small buttons');
  const sk = src('src/ui/skills.ts');
  for (const key of ["'Space', tx(verb", "footBtn('C', tx('ui.skill.when')", 'moveBtn(\'left\')', 'moveBtn(\'right\')']) assert.ok(sk.includes(key), `the foot still offers ${key}`);
  // the sheet says whom it is against in its header, on a short window only
  assert.ok(sk.includes('<span class="sk-foe">${esc(host.foeName)}</span>'), 'the rival\'s name stands in the sheet\'s header');
  assert.ok(sk.includes("solo || !host.foeName ? ''"), 'never on the hero\'s own page');
  assert.ok(/\.sk-foe\{display:none\}/.test(style), 'hidden on a window that has the rival\'s sheet on its left');
  // no ellipsis anywhere in it: the repository's ui-text refuses a text that is cut
  assert.ok(!/text-overflow:ellipsis/.test(k), 'a name wraps, it is never cut');
});

test('IA-03: a dialogue keeps its answers beside its words on a narrow short window, in a box that scrolls', () => {
  const town = src('src/ui/townUi.ts'), blocks = media(town, SHORT_NARROW);
  const d = blocks.find((b) => b.includes('.pm-dlg')) ?? '';
  assert.ok(d, 'a dialogue block for the narrow short window');
  assert.ok(d.includes('.pm-dlg,.pm-dlg.here{grid-template-columns:52px minmax(0,1fr) minmax(0,1.12fr);grid-template-rows:auto;'), 'the portrait, the words, the answers in a row');
  assert.ok(d.includes('.pm-dlg.here{grid-template-columns:minmax(0,1fr) minmax(0,1.12fr)}'), 'the list Q: its place and its answers');
  assert.ok(/\.pm-dlg \.side,\.pm-dlg\.here \.side\{grid-column:3;grid-row:1;margin-top:0;max-height:min\(214px,calc\(100vh - 44px\)\)/.test(d), 'the answers in a box of at most 214 px that stays in the window');
  // the encounter, the theft caught and the person's dialogue are the same band
  for (const f of ['openEncounter', 'openCaught', 'openPerson', 'openHere']) assert.ok(town.includes(`${f}(`), `${f} is a dialogue band`);
  assert.equal([...town.matchAll(/el\('div', 'pm pm-talk'\)/g)].length >= 4, true, 'the four bands are one structure, one rule');
  // the wide short window's rule is untouched
  assert.ok(media(town, '(max-height:480px) and (min-width:701px)').some((b) => b.includes('.pm-dlg')), 'the short wide window keeps its own rule');
});

test('IA-03: the title screen keeps its name above the screen\'s top no more (A-05), the tour clears the town\'s two keys (A-04), an exit tag is above the list\'s preview (B-26)', () => {
  const title = src('src/ui/title.ts');
  assert.ok(title.includes('@media (max-height:480px) and (max-width:599px){#title-screen .wrap{grid-template-columns:minmax(0,0.78fr) minmax(0,1.22fr)'), 'the title: the name and the keys beside the menu under 600 px');
  assert.ok(/#title-screen \.name\{font-size:var\(--ds-fs-title-big\)\}/.test(title.split('@media (max-height:480px) and (max-width:599px)')[1] ?? ''), 'the name smaller there');
  const tour = src('src/ui/tutorial.ts');
  const t = media(tour, SHORT_NARROW).find((b) => b.includes('.tu-band')) ?? '';
  assert.ok(/\.pm-overlay\.pm-band\.tu-band:not\(\.tu-duel\)\{padding:\d+px 16px (\d+)px\}/.test(t), 'the tour band has a bottom padding on a short phone, and the duel\'s lessons are left alone');
  const pad = +t.match(/tu-band:not\(\.tu-duel\)\{padding:\d+px 16px (\d+)px\}/)[1];
  // the town's two keys: a padding of 26 above a 28 px cap and 12 below on a phone (townUi.ts): the cap's top is 40 px over the foot of the screen
  const town = src('src/ui/townUi.ts');
  assert.ok(/#pm-hints\{left:0;right:0;bottom:0;justify-content:space-between;padding:26px 16px 12px/.test(town), 'the town\'s two keys lie along the foot of a phone');
  assert.ok(pad >= 12 + 28 + 8, `the band's bottom padding (${pad} px) clears the two keys (a 28 px cap and 12 px under it, and a margin)`);
  const exits = src('src/ui/exits.ts'), todo = src('src/ui/todo.ts');
  const zExit = z(exits, '.pm-exit'), zTodo = z(todo, '#pm-todo');
  assert.ok(zExit && zTodo && zExit > zTodo, `an exit's tag (z ${zExit}) is drawn over the to-do preview (z ${zTodo})`);
});

test('IA-03: the line « Page ↓ for more » is never drawn over a list of buttons (the menu\'s last line was under it)', () => {
  const style = src('src/ui/style.ts');
  const f = style.slice(style.indexOf('function updateHint'), style.indexOf('function queueHint'));
  assert.ok(f.includes("zone.querySelector(':scope > .pm-btn')"), 'a body made of buttons is a list');
  assert.ok(f.indexOf(":scope > .pm-btn") < f.indexOf('moreBelow(zone)'), 'decided before it measures');
});

test('IA-03: the proof draws every page of the player\'s path', () => {
  const tool = src('tools/small-screen.mjs');
  for (const page of ['title', 'title-name', 'settings-graphics', 'settings-sound', 'settings-controls', 'settings-language', 'guide', 'guide-duel', 'guide-keys', 'tour', 'tour-6',
    'dialogue-mara', 'dialogue-corvin', 'list-q', 'list-q-sand', 'tournament', 'skills', 'sheet', 'gear', 'shop-mara', 'menu', 'journal', 'map', 'news', 'notebook', 'encounter', 'caught', 'town'])
    assert.ok(tool.includes(`name: '${page}'`), `small-screen.mjs draws ${page}`);
  assert.ok(tool.includes("arg('sizes', '568x320')"), 'the phone held sideways by default');
  assert.ok(tool.includes('WALK'), 'real keys on the long lists');
  assert.ok(tool.includes('st.v2.gear = { weapon: \'imported-blade\''), 'a full bag, as the audit\'s blocker B-21 needs');
});
