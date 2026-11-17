// The interfaces' lot 2 (the operator's sheet https://claude.ai/artifact/BRKQQcAXD6N9HTMZdmohnc, IA-05 « Deux rangées au moins, le détail se replie », IA-06 « K comme G (flèches,
// réordonner à part, une ligne pour le mode) », IA-07 « Toute vente demande, les messages disent le port et la vente », read back at the recommendation, journal Passe IA2;
// built in journal Passe IA4). The pages are drawn in a browser (tools/interfaces2-proof.mjs, tools/catalogue-sizes.mjs); what they decide is read here without one.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const N = await load('/src/ui/nav.ts');
const PD = await load('/src/input/pad.ts');
const W = await load('/src/ui/wares.ts');
const PV = await load('/src/simulation/preview.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR_TEXTS } = await load('/src/narrative/text/fr-texts.ts');
const ROOT = path.resolve(import.meta.dirname, '..');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

// ---------------------------------------------------------------------------------------------------------------------------------------- IA-06

/** the skills page's layout as boxes: the mode switch at the top right, four places in a row, the filters, a grid of tiles five wide (the places' column spans the page) */
const layout = () => {
  const box = (id, left, top, w, h) => ({ el: id, r: { left, right: left + w, top, bottom: top + h }, col: 'goods' });
  const all = [box('mode', 1000, 50, 160, 30)];
  for (let k = 0; k < 4; k++) all.push(box(`slot:${k}`, 120 + k * 262, 140, 252, 150));
  for (const [i, f] of ['all', 'off', 'def', 'sup'].entries()) all.push(box(`filter:${f}`, 860 + i * 75, 350, 70, 28));
  for (let i = 0; i < 12; i++) all.push(box(`tile:${i}`, 120 + (i % 5) * 210, 390 + Math.floor(i / 5) * 92, 200, 84));
  return all;
};
const cand = (all, id) => all.find((x) => x.el === id);
const press = (all, from, key) => N.pickNeighbour(cand(all, from), all, key);

test('IA-06: from a place the Down arrow reaches the tile under it in one press (it took twelve), the four arrows walk the whole page', () => {
  const all = layout();
  assert.equal(press(all, 'slot:0', 'ArrowDown'), 'tile:0', 'the tile under the first place: one press');
  // the places in a row: Right goes to the next place, Left back, nothing past the ends (no wrap to the other side)
  assert.equal(press(all, 'slot:0', 'ArrowRight'), 'slot:1');
  assert.equal(press(all, 'slot:2', 'ArrowLeft'), 'slot:1');
  assert.ok(!String(press(all, 'slot:3', 'ArrowRight')).startsWith('slot:'), 'past the last place Right goes to no other place');
  // the tiles: along the row, down the column, and back up to the places
  assert.equal(press(all, 'tile:0', 'ArrowRight'), 'tile:1');
  assert.equal(press(all, 'tile:1', 'ArrowLeft'), 'tile:0');
  assert.equal(press(all, 'tile:1', 'ArrowDown'), 'tile:6', 'the tile under it, one row down');
  assert.equal(press(all, 'tile:6', 'ArrowUp'), 'tile:1');
  assert.ok(['slot:0', 'slot:1', 'filter:all'].includes(press(all, 'tile:0', 'ArrowUp')), 'up from the first tile: the filters or the place above');
  // the first press of any key from the mode switch goes somewhere (the page is connected)
  assert.ok(press(all, 'mode', 'ArrowDown') !== null);
  // from the first place to the last tile of the third row: four presses, not a dozen
  let at = 'slot:0';
  const path = ['ArrowDown', 'ArrowDown', 'ArrowDown', 'ArrowRight'];
  for (const key of path) at = press(all, at, key) ?? at;
  assert.equal(at, 'tile:11', 'slot 0, Down, Down, Down, Right: the last tile in four presses');
});

test('IA-06: at the end of a row of tiles Right goes on to the next row, as on the gear page', () => {
  const tiles = ['a', 'b', 'c', 'd', 'e', 'f'];
  assert.equal(N.wrapTile(tiles, 'c', 'ArrowRight'), 'd');
  assert.equal(N.wrapTile(tiles, 'd', 'ArrowLeft'), 'c');
  assert.equal(N.wrapTile(tiles, 'f', 'ArrowRight'), null, 'the last tile has no next');
  assert.equal(N.wrapTile(tiles, 'a', 'ArrowLeft'), null);
  assert.equal(N.wrapTile(tiles, 'a', 'ArrowDown'), null, 'only the sideways arrows read on');
  assert.deepEqual([...N.ARROWS], ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']);
});

test('IA-06: the skills page and the gear page share one rule for the arrows; a place moves by A and D (the pad\'s LT and RT), not by the arrows', () => {
  const k = src('src/ui/skills.ts'), g = src('src/ui/gearPage.ts');
  assert.match(k, /import \{ ARROWS, arrowFocus \} from '\.\/nav';/);
  assert.match(k, /if \(ARROWS\.includes\(e\.key\)\) \{\s*e\.preventDefault\(\); e\.stopPropagation\(\);\s*arrowFocus\(card, e\.key, \{ items: ctrls, rows: '\.sk-tiles' \}\);/, 'K: the four arrows go to the nearest control');
  assert.equal(/e\.key === 'ArrowDown' \|\| e\.key === 'ArrowUp'/.test(k), false, 'K: no longer the vertical arrows alone');
  assert.match(k, /!e\.key\.startsWith\('Arrow'\) && \(a\.includes\('left'\) \|\| a\.includes\('right'\)\)/, 'K: a place is moved by the letters of the left and right actions, never by the arrows');
  assert.match(g, /const go = \(key: string\): boolean => arrowFocus\(card, key, \{ col: \(x\) => x\.closest\('\.pm-self, \.pm-goods'\), rows: '\.gp-tiles' \}\);/, 'G: the same function');
  assert.equal(/const col = \(x: HTMLElement\)/.test(g), false, 'G: its own copy of the scoring is gone');
  // the pad: LT and RT press A and D on a page; the D-pad's left and right are the arrows
  assert.equal(PD.KEYS.page[PD.BTN.LT], 'a'); assert.equal(PD.KEYS.page[PD.BTN.RT], 'd');
  assert.equal(PD.KEYS.page[PD.BTN.LEFT], undefined, 'the D-pad is the arrows (PadInput.nav)');
  assert.match(k, /bindCap\(dir, `data-pad-btn="\$\{dir === 'left' \? 'LT' : 'RT'\}"`\)/, 'the two foot buttons show LT and RT under a pad');
  assert.match(src('src/input/prompts.ts'), /k\.dataset\.padBtn \? \(BTN as Record<string, Btn>\)\[k\.dataset\.padBtn\]/, 'a cap may name its own button');
});

test('IA-06: « Take out » says what it does (it frees the place, the game keeps four), and the mode has its line', () => {
  const k = src('src/ui/skills.ts');
  assert.match(k, /S\.free === slotOf\(fk\) \? 'ui\.sk\.keepHere' : 'ui\.sk\.remove'/, 'on a place already freed Space keeps its skill');
  assert.match(k, /said\(tx\('ui\.sk\.freed', \{ n: k \+ 1, name: skillName\(was\) \}\)\)/, 'freeing a place says so, and that Esc keeps the skill');
  assert.match(k, /pend \? `<p class="sk-say" role="status">[\s\S]*?: `<p class="sk-say sk-modeline" role="status">\$\{esc\(tx\(manual\(\) \? 'ui\.sk\.modeManual' : 'ui\.sk\.modeAuto'\)\)\}<\/p>`/, 'the mode\'s line takes the line a message uses when there is none');
  for (const key of ['ui.sk.remove', 'ui.sk.keepHere', 'ui.sk.freed', 'ui.sk.modeAuto', 'ui.sk.modeManual']) {
    assert.ok(EN[key] && FR_TEXTS[key], `${key} in both languages`);
    assert.equal(EN[key].match(/\{[a-z]+\}/g)?.sort().join() ?? '', FR_TEXTS[key].match(/\{[a-z]+\}/g)?.sort().join() ?? '', `${key}: the same slots`);
  }
  assert.notEqual(EN['ui.sk.remove'], 'Take out', 'the old word that removed nothing');
  assert.match(EN['ui.sk.freed'], /four/); assert.match(EN['ui.sk.modeManual'], /key/); assert.match(EN['ui.sk.modeAuto'], /condition/);
});

// ---------------------------------------------------------------------------------------------------------------------------------------- IA-05

test('IA-05: the catalogue\'s row keeps two rows of tiles, the detail folds on a short window and its fade shortens', () => {
  const s = src('src/ui/style.ts');
  assert.match(s, /\.pm-skills\{--sk-tile:84px;--sk-two:calc\(var\(--sk-tile\)\*2 \+ 14px\)\}/, 'two rows of tiles and their gap');
  assert.match(s, /\.pm-skills \.pm-goods\{grid-template-rows:auto auto auto auto auto minmax\(var\(--sk-two\),1fr\) auto auto\}/, 'the row never goes under them');
  assert.match(s, /@media \(max-height:800px\)\{\.pm-skills \.pm-goods \.pm-detail\{max-height:min\(14vh,104px\);--fade:22px/, 'a short window folds the detail');
  assert.equal((s.match(/var\(--fade,44px\)/g) ?? []).length, 8, 'the three fades, standard and prefixed, read the variable (44 px by default)');
  assert.equal(/calc\(100% - 44px\)/.test(s), false, 'no fixed 44 px left in the fades');
  assert.match(src('src/ui/skills.ts'), /<span class="fam">/, 'the tile\'s family word can be dropped on a narrow sheet');
  assert.match(s, /\.pm-skills:not\(\.pm-solo\) \.sk-tile small \.fam\{display:none\}/);
});

// ---------------------------------------------------------------------------------------------------------------------------------------- IA-07

test('IA-07: a sale in a dialogue asks first, as the gear page does; the press that asks never answers, Esc keeps the piece', () => {
  const t = src('src/ui/townUi.ts');
  assert.match(t, /o\.action\.type === 'sell' \? \(go, line\) => this\.askSale\(o, list, root, go, line\) : undefined/, 'Mara\'s sell lines are gated');
  assert.match(t, /if \(performance\.now\(\) - at < 400\) return;/, 'a held or double Enter does not answer');
  assert.match(t, /e\.key === 'Escape'\) \{ e\.preventDefault\(\); e\.stopPropagation\(\); back\(\);/, 'Esc keeps the piece and gives the dialogue back');
  assert.match(t, /tx\('ui\.gear\.confirm', \{ item: bare\(itemName\(item\)\), n \}\)[\s\S]*?tx\('ui\.gear\.confirmWhat'\)/, 'the gear page\'s own question and its half-price line');
  // what the question says is the game\'s: the sale\'s price is the action\'s gain, half the list price
  const st = G.makeV2(G.namedState('v2-day1-morning'));
  st.player.coins = 100; st.v2.gear = { weapon: 'imported-blade', tier: 1, armour: 'mail-shirt', acc: [null, null], bag: ['duelist-sabre'] };
  const sells = G.actions(st).filter((o) => o.action.type === 'sell');
  assert.ok(sells.length >= 1 && sells.every((o) => o.gain > 0), 'the sell lines carry their price (gain)');
});

test('IA-07: the gear page says why a sale cannot be made, what a purchase did to the body, and what a sale left', () => {
  const g = src('src/ui/gearPage.ts');
  assert.match(g, /sale\?\.ok \? tx\('ui\.wares\.sellHalf'\) : sale \? tx\('ui\.gear\.noSale', \{ why: sale\.reason \?\? '' \}\) : ''/, 'a worn piece that cannot be sold says why');
  assert.match(g, /pk\.kind === 'tile' && sale \? what\(sale\.ok \? tx\('ui\.wares\.sellHalf'\) : tx\('ui\.gear\.noSale'/, 'so does a piece of the bag');
  assert.match(g, /const pv = a\.type === 'shopBuy' \? preview\(host\.state\(\), a\) : null;/, 'a purchase is previewed before it is made');
  assert.match(g, /S\.msg \? news : fk\.startsWith\('filter:'\)/, 'after a sale the detail says the sale, not the question');
  // the game's own reading of a purchase, which the message is made from
  const s = G.makeV2(G.namedState('v2-day1-morning'));
  s.player.coins = 200; s.v2.gear = { weapon: 'imported-blade', tier: 1, armour: null, acc: [null, null], bag: [] };
  const buy = G.actions(s).find((o) => o.ok && o.action.type === 'shopBuy' && o.action.item === 'viper-blade');
  assert.ok(buy, 'a weapon to buy at the quay');
  const pv = PV.preview(s, buy.action);
  assert.equal(pv.slot, 'weapon'); assert.equal(pv.replaces, 'imported-blade'); assert.equal(pv.toBag, false);
  // away from Mara a worn piece cannot be sold, and the game says why
  const away = G.makeV2(G.namedState('v2-training-morning'));
  away.v2.gear = { weapon: 'imported-blade', tier: 1, armour: null, acc: [null, null], bag: ['duelist-sabre'] };
  const sale = W.sellOf(away, 'duelist-sabre');
  assert.ok(sale && sale.ok === false && sale.reason, `no sale at the sand: ${sale?.reason}`);
  for (const key of ['ui.gear.noSale', 'ui.gear.boughtWorn', 'ui.gear.boughtSwap', 'ui.gear.boughtBag']) {
    assert.ok(EN[key] && FR_TEXTS[key], `${key} in both languages`);
    assert.equal(EN[key].match(/\{[a-z]+\}/g)?.sort().join() ?? '', FR_TEXTS[key].match(/\{[a-z]+\}/g)?.sort().join() ?? '', `${key}: the same slots`);
  }
});
