// The gear page remade in the skills page's drawing: four places and a catalogue of tiles (the operator's request of 16/11/2026, « il faudra faire pareil pour les
// equipements afin d'avoir un aspect intuitif et manipulable pour gerer nos armes/armure/accessoires »; the sheet https://claude.ai/artifact/Q2F5qVfX6u6vL2Sp1aKQa1,
// PE-1 to PE-10 read back ten of ten at the recommendation, journal Passes EP1 to EP3). The page holds no rule: what it draws and what a click asks for are read here
// against the game's own state and actions (src/ui/gearModel.ts is the page without a page).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const GE = await load('/src/simulation/gear.ts');
const VG = await load('/src/simulation/v2gear.ts');
const WK = await load('/src/simulation/v2work.ts');
const R = await load('/src/simulation/roles.ts');
const M = await load('/src/ui/gearModel.ts');
const T = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR } = await load('/src/narrative/text/fr.ts');
const { FR_TEXTS } = await load('/src/narrative/text/fr-texts.ts');
const ROOT = path.resolve(import.meta.dirname, '..');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

/** a version 2 game at the quay by day (Mara buys), with a chosen gear */
const at = (gear, place = 'district', slot = 'morning', coins = 200) => {
  const s = G.makeV2(G.namedState('day1-morning'));
  s.place = place; s.slot = slot; s.player.coins = coins;
  s.v2.gear = { weapon: 'training-sword', tier: 0, armour: null, acc: [null, null], bag: [], ...gear };
  return s;
};
const act = (s, a) => { const r = G.advance(s, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const BAG = ['duelist-sabre', 'viper-blade', 'padded-jack', 'lucky-ribbon', 'swift-boots', 'fervour-charm', 'docker-wrap', 'bezoar-stone', 'minstrel-charm', 'iron-ring', 'mail-shirt'];
const GEARS = [
  {},
  { bag: BAG },
  { weapon: 'imported-blade', tier: 2, armour: 'mail-shirt', acc: ['iron-ring', null], bag: ['duelist-sabre', 'lucky-ribbon', 'padded-jack'] },
  { weapon: 'duelist-sabre', tier: 1, armour: 'padded-jack', acc: ['iron-ring', 'lucky-ribbon'], bag: ['swift-boots', 'fervour-charm', 'imported-blade'] },
  { weapon: 'imported-blade', acc: [null, 'docker-wrap'], bag: ['docker-wrap', 'iron-ring'] },
];

test('the four places show what the game says is worn: kind, piece, points, the forge\'s tier, the hand\'s own sword, a free place', () => {
  for (const g of GEARS) {
    const s = at(g), v = M.placeViews(s);
    assert.deepEqual(v.map((x) => x.place), ['weapon', 'armour', 0, 1], 'a weapon, an armour, two accessories, in that order');
    assert.deepEqual(v.map((x) => x.kind), ['weapon', 'armour', 'accessory', 'accessory']);
    for (const x of v) {
      assert.equal(x.id, VG.wornAt(s, x.place) ?? (x.place === 'weapon' ? 'training-sword' : null), `place ${x.place} holds what the game says (the hand's sword on the weapon's place)`);
      assert.equal(x.hand, x.id === 'training-sword');
      assert.equal(x.points, x.id ? VG.itemAbout(x.id) : '', 'the points are the piece\'s own words');
      if (x.hand || x.id === null) assert.equal(x.sale, null, 'a free place and the hand\'s sword have no price');
      assert.equal(x.tier, x.place === 'weapon' ? VG.weaponTier(s) : 0);
      // a free place says what the bag holds for it and who sells it, never both a piece and a hint
      if (x.id) assert.equal(x.sellers, ''); else { assert.equal(x.bag, (s.v2.gear.bag).filter((id) => M.kindOfId(id) === x.kind).length); assert.ok(x.sellers.length > 0, 'a free place says where to find what fits'); }
    }
    assert.equal(v[0].hand, g.weapon === undefined, 'the training sword is the hand\'s own');
  }
});

test('everything owned is one catalogue: the worn pieces in place order, then the bag, each tile once; the hand\'s sword is no tile', () => {
  for (const g of GEARS) {
    const s = at(g), own = M.ownedOf(s), keys = own.map((o) => o.key);
    assert.equal(new Set(keys).size, keys.length, 'one tile per piece, even two of the same');
    const worn = [s.v2.gear.weapon === 'training-sword' ? null : s.v2.gear.weapon, s.v2.gear.armour, ...s.v2.gear.acc].filter(Boolean);
    assert.deepEqual(own.filter((o) => o.place !== null).map((o) => o.id), worn);
    assert.deepEqual(own.filter((o) => o.place === null).map((o) => o.id), s.v2.gear.bag);
    assert.ok(!own.some((o) => o.id === 'training-sword'));
  }
  // two of the same piece keep two tiles (the bag may hold a spare)
  const s = at({ acc: ['iron-ring', null], bag: ['iron-ring'] });
  assert.deepEqual(M.ownedOf(s).map((o) => o.key), ['iron-ring', 'iron-ring#2']);
});

test('a click on a piece of the bag asks for the game\'s own equip, and the places it lights are the ones that change', () => {
  for (const g of GEARS) for (const id of at(g).v2.gear.bag) {
    const s = at(g), a = M.wearAction(s, id);
    if (M.kindOfId(id) === 'accessory' && M.freeAcc(s) < 0) {
      // both places taken: no action yet, the player says which one it replaces (« Quelle place prend… ? »)
      assert.equal(a, null, `${id}: it must be told a place`);
      assert.deepEqual(M.hitPlacesFor(s, id, null), [0, 1], 'both accessory places light up');
      for (const at_ of [0, 1]) {
        const b = M.wearAction(s, id, at_), next = act(s, b), old = VG.wornAt(s, at_);
        assert.equal(VG.wornAt(next, at_), id, `${id} takes place ${at_}`);
        assert.ok(next.v2.gear.bag.includes(old), 'the piece it replaces goes to the bag');
        assert.equal(VG.wornAt(next, 1 - at_), VG.wornAt(s, 1 - at_), 'the other place is untouched');
      }
      continue;
    }
    assert.ok(a, `${id}: an action`);
    const next = act(s, a), hit = M.hitPlacesFor(s, id, null), moved = ['weapon', 'armour', 0, 1].filter((p) => VG.wornAt(next, p) !== VG.wornAt(s, p));
    assert.deepEqual(moved, hit, `${id}: the place it takes is the place that lights up`);
    assert.equal(VG.wornAt(next, hit[0]), id);
    const old = VG.wornAt(s, hit[0]);
    if (old && old !== 'training-sword') assert.ok(next.v2.gear.bag.includes(old), 'the old piece to the bag');
  }
});

test('a click on a worn piece (a place, or its tile) asks for the game\'s own unequip: the piece goes back to the bag, the place is free', () => {
  for (const g of GEARS) for (const o of M.ownedOf(at(g)).filter((x) => x.place !== null)) {
    const s = at(g), next = act(s, { type: 'unequip', slot: o.place });
    assert.ok(next.v2.gear.bag.includes(o.id), `${o.id} is in the bag`);
    assert.equal(VG.wornAt(next, o.place), null, 'the place is free');
    if (o.place === 'weapon') assert.equal(next.v2.gear.weapon, 'training-sword', 'the hand\'s own sword is back in hand');
    assert.equal(M.placeId(next, o.place), o.place === 'weapon' ? 'training-sword' : null, 'the page draws the hand\'s sword on the weapon\'s place, a free place elsewhere');
    assert.deepEqual(M.hitPlacesFor(s, o.id, o.place), [o.place]);
  }
  // the hand's own sword is never taken off
  assert.equal(G.advance(at({}), { type: 'unequip', slot: 'weapon' }).ok, false);
});

test('a sale is the game\'s own, at its price and its hour: half the list price at Mara\'s by day, the hand\'s sword never, a stolen piece refused', () => {
  const g = { weapon: 'imported-blade', tier: 1, armour: 'mail-shirt', acc: ['iron-ring', null], bag: ['duelist-sabre', 'padded-jack', 'lucky-ribbon'] };
  const s = at(g), list = M.sellListOf(s);
  assert.deepEqual(list.map((x) => x.o.id), M.ownedOf(s).map((o) => o.id), 'every piece owned can be offered');
  for (const { o, sale } of list) {
    assert.ok(sale.ok, `${o.id}: Mara buys it now`);
    assert.equal(sale.n, Math.floor(GE.GEAR[o.id].price / 2), 'half the list price');
    assert.equal(sale.n, WK.resaleOf(o.id));
    const next = act(s, sale.action);
    assert.equal(next.player.coins - s.player.coins, sale.n, `${o.id}: the coins`);
    assert.ok(!M.ownedOf(next).some((x) => x.id === o.id), 'the piece is gone, from the bag or from the body');
  }
  // the views carry the same price for a worn piece, none for the hand's sword
  for (const x of M.placeViews(s)) assert.equal(x.sale, x.id && !x.hand ? Math.floor(GE.GEAR[x.id].price / 2) : null);
  assert.equal(M.placeViews(at({})).find((x) => x.place === 'weapon').sale, null, 'the training sword has no price');
  // elsewhere or at night Mara does not buy: the check says so and the page offers no sale
  for (const [place, slot] of [['forecourt', 'morning'], ['district', 'evening']]) {
    const t = at(g, place, slot);
    assert.ok(M.sellListOf(t).every((x) => !x.sale.ok), `${place} ${slot}: no sale`);
    assert.ok(M.placeViews(t).every((x) => x.sale === null));
  }
  // a piece of a theft not settled
  const t = at(g); t.v2.thefts = [{ day: 1, from: 'hilde', item: 'padded-jack', seen: null }];
  assert.equal(M.sellListOf(t).find((x) => x.o.id === 'padded-jack').sale.ok, false);
  assert.equal(M.sellListOf(t).find((x) => x.o.id === 'duelist-sabre').sale.ok, true);
});

test('only Mara buys back: the page gives her, and nobody else, the Buy / Sell panels', () => {
  assert.equal(R.offeredBy({ type: 'sell', item: 'padded-jack' }), 'mara');
  const page = src('src/ui/gearPage.ts');
  assert.match(page, /resale = who !== null && offeredBy\(\{ type: 'sell'/, 'the keeper who buys back is the one the game names');
  assert.match(page, /resale \? `<div class="sk-modebox gp-panels"/, 'the switch is drawn for that keeper only');
});

test('a free place says who sells what fits it, from the catalogue: every piece sold anywhere has its keeper named, the pieces sold at two places both', () => {
  for (const kind of ['weapon', 'armour', 'accessory']) {
    const text = M.sellersOf(kind), names = new Set(text.split(', '));
    const keepers = new Set();
    for (const d of Object.values(GE.GEAR)) if (d.slot === kind && d.price > 0) for (const sh of GE.shopsOf(d)) keepers.add(GE.SHOPS[sh].keeper);
    assert.ok(keepers.size > 0 && names.size === keepers.size, `${kind}: ${text}`);
  }
  const two = Object.values(GE.GEAR).filter((d) => d.also);
  assert.ok(two.length >= 7, 'the seven pieces at two places (EQ-9)');
  for (const d of two) for (const sh of GE.shopsOf(d)) assert.ok(M.sellersOf(M.kindOfId(d.id)).toLowerCase().includes(GE.SHOPS[sh].keeper), `${d.id}: ${sh}`);
});

test('a tile says what a click does: worn, or where the piece goes, in both languages', () => {
  const s = at({ weapon: 'imported-blade', armour: 'mail-shirt', acc: ['iron-ring', 'lucky-ribbon'], bag: ['duelist-sabre', 'padded-jack', 'swift-boots'] });
  const say = () => M.ownedOf(s).map((o) => M.statusOf(s, o));
  const en = say();
  assert.deepEqual(en.slice(0, 4), Array(4).fill(T.tx('ui.gear.wornTag')));
  assert.match(en[4], /replaces an imported blade/); assert.match(en[5], /replaces a mail shirt/); assert.equal(en[6], T.tx('ui.gear.either'), 'both accessory places taken');
  T.useLanguage('fr', FR);
  try {
    const fr = say();
    assert.notDeepEqual(fr, en); assert.ok(fr.every((t) => !/[{}]/.test(t)), 'no brace left');
    assert.match(fr[4], /remplace/); assert.equal(fr[0], FR_TEXTS['ui.gear.wornTag']);
    assert.match(M.subOf('lucky-ribbon'), /Accessoire/);
  } finally { T.useLanguage('en'); }
  const free = at({ acc: [null, null], bag: ['swift-boots'] });
  assert.equal(M.statusOf(free, M.ownedOf(free)[0]), T.tx('ui.gear.goesFree'));
  assert.equal(M.statusOf(at({ bag: ['imported-blade'] }), M.ownedOf(at({ bag: ['imported-blade'] }))[0]), T.tx('ui.gear.goesOn'), 'the hand\'s sword is no piece to replace');
});

test('every text the page uses is in both tables with the same slots, and the sale asks first', () => {
  const used = new Set([...src('src/ui/gearPage.ts').matchAll(/'(ui\.gear\.[\w.]+)'/g), ...src('src/ui/gearModel.ts').matchAll(/'(ui\.gear\.[\w.]+)'/g)].map((m) => m[1]));
  assert.ok(used.size >= 30, `the page's keys: ${used.size}`);
  const marks = (s) => [...s.matchAll(/\{(\w+)(?:\|\w+)?\}/g)].map((m) => m[1]).sort().join(',');
  for (const k of used) {
    assert.ok(k in EN, `${k} has its English`); assert.ok(k in FR_TEXTS, `${k} has its French`);
    assert.equal(marks(FR_TEXTS[k]), marks(EN[k]), `${k}: the same slots`);
    if (!['ui.gear.placeN'].includes(k)) assert.notEqual(FR_TEXTS[k], EN[k], `${k}: the French is written, not the English left`);
  }
  const page = src('src/ui/gearPage.ts');
  // PE-6: C and the button only ask; Enter on the question sells, Esc keeps the piece; nothing sells in one press
  assert.match(page, /const askSell = /); assert.match(page, /const confirmSell = /);
  assert.match(page, /if \(S\.ask\) \{ confirmSell\(\); return; \}/, 'Enter on the question sells');
  assert.match(page, /if \(S\.ask\) \{ S\.ask = null;[^}]*paint\(\); return; \}/, 'Esc keeps the piece');
  assert.doesNotMatch(page, /data-sell[^;]{0,200}run\(\{ type: 'sell'/, 'the Sell button asks first');
});

test('the page keeps the system: tokens only, no new image, square and flat, one foot, its catalogue fades, the system\'s reduced motion read nowhere; only a version 2 game gets it', () => {
  for (const f of ['src/ui/gearPage.ts', 'src/ui/gearModel.ts']) {
    const t = src(f);
    assert.doesNotMatch(t, /#[0-9a-f]{3,8}\b/i, `${f}: no colour of its own`);
    assert.doesNotMatch(t, /\.(png|jpe?g|webp|svg)\b/i, `${f}: no image of its own`);
    assert.doesNotMatch(t, /drop-shadow|border-radius|box-shadow:(?!inset)/, `${f}: square, flat`);
    assert.doesNotMatch(t, /prefers-reduced-motion/, `${f}: the game's own setting`);
  }
  const page = src('src/ui/gearPage.ts');
  assert.match(page, /scrollFade\(/); assert.match(page, /footBtn\('Esc'/); assert.match(page, /fillFoot\(/);
  assert.doesNotMatch(page, /<kbd>Esc<\/kbd>\$\{tx\('ui\.(close|leave)/, 'the way out goes through footBtn');
  const css = src('src/ui/style.ts');
  const gearCss = css.slice(css.indexOf('.pm-gear .pm-goods{'), css.indexOf('@media (max-height:760px)'));
  assert.ok(gearCss.length > 800, "the gear rules are found");
  assert.doesNotMatch(gearCss, /#[0-9a-f]{3,8}\b|rgba?\(|border-radius/i, 'the gear rules use the design system tokens');
  // the town page: a version 2 game's gear and goods are the new page, today's game keeps the former
  const town = src('src/ui/townUi.ts');
  assert.match(town, /isV2\(this\.st\) && this\.st\.v2\?\.gear \? gearPage\(who, host\) : waresPage\(who, host\)/);
});
