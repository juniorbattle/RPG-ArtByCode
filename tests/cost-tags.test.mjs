// What an action costs, as the town's interface shows it (the operator's decision P2, « En premier », journal Passes UI1 / UI2): one tag per
// currency, the coins from the simulation (`ActionOption.coins`, not the label) and the slot, « free » only when nothing is spent. The
// coins are checked against two oracles that do not go through `coins()`: the game's rules written out here, and what the action's own
// `apply` really takes from the purse.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const A = await load('/src/simulation/actions.ts');
const { costTag } = await load('/src/ui/townUi.ts');

/** the rules, written out: Mara's list prices (the shortage on steel, her favour), Bram's tempering, the informant, the watch, the healer
 *  (free once the Temple pays), the bellows (half with Orla's arms) */
const LIST = { whetstone: 8, salve: 10, 'imported-blade': 30 };
// the version 2's catalogue as the operator's chantier 5 made it (the sheet https://claude.ai/artifact/Eg4nNbYLtAaCfngnEKZLGs, EQ-1 to EQ-9, journal Passe GP5-2), written out: the list
// prices of the shops' pieces, the pieces of the end of the tournament (EQ-5: dear, from day 6, their price fixed), the places each is sold at (EQ-9: seven at two places), the
// stage of the tournament in the prices (EQ-7: the shops' pieces ×1.15 from day 6, ×1.3 from day 9) and the two shortages (EQ-8)
const LISTV2 = {
  'imported-blade': 24, 'duelist-sabre': 50, 'padded-jack': 14, 'mail-shirt': 40, 'dock-leathers': 30, 'lucky-ribbon': 10, 'iron-ring': 32, 'swift-boots': 24, 'fervour-charm': 12, 'docker-wrap': 12, whetstone: 8, salve: 10,
  'viper-blade': 26, 'serrated-cutlass': 30, 'ember-sword': 30, 'mirror-blade': 30, 'hex-falchion': 30, 'torpor-rapier': 30,
  'bezoar-stone': 16, 'salamander-charm': 18, 'wayfarer-hood': 18, 'field-tourniquet': 18,
  'caravan-greatblade': 90, 'tournament-plate': 100, 'masters-sash': 85, 'champion-laurel': 80,
};
const LIST_PASSERS = { 'river-pearl': 30, 'knight-hauberk': 60, 'pilgrim-medal': 14, 'mender-gloves': 22, 'courier-boots': 12, 'minstrel-charm': 12, 'sergeant-gorget': 14, 'hostler-leathers': 18 };
const END = ['caravan-greatblade', 'tournament-plate', 'masters-sash', 'champion-laurel'];
const SOLD = {
  mara: ['whetstone', 'salve', 'imported-blade', 'viper-blade', 'serrated-cutlass', 'padded-jack', 'dock-leathers', 'docker-wrap', 'field-tourniquet', 'caravan-greatblade'],
  armourer: ['padded-jack', 'mail-shirt', 'iron-ring', 'salamander-charm', 'wayfarer-hood', 'tournament-plate'],
  master: ['imported-blade', 'duelist-sabre', 'serrated-cutlass', 'ember-sword', 'mirror-blade', 'hex-falchion', 'torpor-rapier', 'swift-boots', 'wayfarer-hood', 'masters-sash'],
  trinkets: ['lucky-ribbon', 'fervour-charm', 'docker-wrap', 'iron-ring', 'bezoar-stone', 'salamander-charm', 'champion-laurel'],
};
const STEEL = ['imported-blade', 'duelist-sabre', 'padded-jack', 'mail-shirt', 'dock-leathers', 'viper-blade', 'serrated-cutlass', 'ember-sword', 'mirror-blade', 'hex-falchion', 'torpor-rapier', 'caravan-greatblade', 'tournament-plate'];
const ARMOURS = ['padded-jack', 'mail-shirt', 'dock-leathers', 'tournament-plate'], ACCESSORIES = ['lucky-ribbon', 'iron-ring', 'swift-boots', 'fervour-charm', 'docker-wrap', 'bezoar-stone', 'salamander-charm', 'wayfarer-hood', 'field-tourniquet', 'masters-sash', 'champion-laurel'];
function rule(st, a) {
  switch (a.type) {
    // the version 2's bargains (lot L2a, EV-6): the piece's price less the argument's share (the name 20 %, a friend 15 %, two at once 25 % on both, what
    // touches a passer-by 30 %), paid only if it works; a passer-by's piece at its price
    case 'bargain': {
      const off = (p, d) => Math.max(1, Math.round(p * (1 - d))), d = { name: 0.2, friend: 0.15, pair: 0.25 }[a.arg];
      // the pair: the shop's cheapest other piece sold today that the player lacks (list price, then name; the salve never)
      const ITEMS = SOLD[a.shop].filter((id) => id !== 'salve' && (!END.includes(id) || st.day >= 6)).sort((x, y) => LISTV2[x] - LISTV2[y] || (x < y ? -1 : 1));
      const held = (id) => id === 'whetstone' ? st.player.items.includes('whetstone') : [st.v2.gear.weapon, st.v2.gear.armour, ...st.v2.gear.acc, ...st.v2.gear.bag].includes(id);
      const pair = a.arg === 'pair' ? ITEMS.find((id) => id !== a.item && !held(id)) : null;
      return off(rule(st, { type: 'shopBuy', shop: a.shop, item: a.item }), d) + (pair ? off(rule(st, { type: 'shopBuy', shop: a.shop, item: pair }), d) : 0);
    }
    // a challenge's coins staked are put on the table at once (lot L2b, EV-3: 10, won back twice); paying a reprisal's muscle off, 20
    case 'challenge': return a.stake === 'coins' ? 10 : 0;
    case 'payMuscle': return 20;
    // a thief caught pays the fine of whoever holds them, what the purse has up to it (GP-03, journal Passe PN1); fighting it, or taking a piece by force, costs no coin
    case 'payFine': return Math.min(st.v2.caught.fine, st.player.coins);
    // a restitution at Sergeant Hale's (lot L2a): the pieces still held go back, the others taken are paid at their list price (a theft caught took nothing:
    // journal Passe CO2), his fee of 5; a thin purse pays all it has
    case 'restitute': {
      const PRICE = { ...LISTV2, ...LIST_PASSERS };
      const g = st.v2.gear, held = (id) => id === 'whetstone' ? st.player.items.includes('whetstone') : [g.weapon, g.armour, ...g.acc, ...g.bag].includes(id);
      const open = (st.v2.thefts ?? []).filter((x) => !x.settled), debt = open.filter((x) => x.seen !== 'caught' && !held(x.item)).reduce((n, x) => n + PRICE[x.item], 0) + (open.length || (st.v2.marks ?? 0) > 0 ? 5 : 0);
      return Math.min(debt, st.player.coins);
    }
    // the passers-by of GP-06 (journal Passe PN1, « Un passant par lieu et par moment (douze) »): their pieces' prices, « proposé »
    case 'barter': { const p = { fenwick: 26, edda: 34, sela: 18, nell: 16, jory: 14, yselle: 15, garrick: 20, maud: 22, dov: 28, hettie: 10 }[a.who]; return !a.arg ? p : Math.max(1, Math.round(p * (a.arg === 'name' ? 0.8 : 0.7))); }
    case 'buy': return Math.round(LIST[a.item] * (a.item === 'salve' ? 1 : st.services.shopFactor) * (st.flags['discount:mara'] ? 0.9 : 1));
    case 'temper': case 'buyInfo': return 10;
    case 'payWatch': return 15;
    case 'heal': return st.flags['free-care'] ? 0 : 8;
    case 'repair': return (st.competitors.orla?.relationships.player ?? 0) >= 20 ? 6 : 12;
    // the version 2 (journal Passe V2): the weapon master's skills, a tenth off for a reputation of 40 or more
    case 'shopBuy': {
      const FACTOR = { mara: 1, armourer: 1.15, master: 1.1, trinkets: 0.9 }, KEEPER = { mara: 'mara', armourer: 'hilde', master: 'corvin', trinkets: 'pip' };
      const steel = STEEL.includes(a.item) ? st.services.shopFactor : 1;
      // the stage of the tournament (EQ-7) for the shops' pieces, not the salve nor the whetstone nor the pieces of the end (EQ-5); House Dree's order (EQ-8: Hilde's armours, days 3 to 5
      // once its event fired) and the parade's rush (Pip's accessories on day 9)
      const stage = a.item === 'whetstone' || a.item === 'salve' || END.includes(a.item) ? 1 : st.day >= 9 ? 1.3 : st.day >= 6 ? 1.15 : 1;
      const dree = a.shop === 'armourer' && ARMOURS.includes(a.item) && st.flags['ev:v2-dree-order'] !== undefined && st.day >= 3 && st.day <= 5 ? 1.3 : 1;
      const rush = a.shop === 'trinkets' && ACCESSORIES.includes(a.item) && st.flags['ev:v2-parade-rush'] !== undefined && st.day === 9 ? 1.5 : 1;
      const k = Math.min(0.15, st.player.reputation / 400), rel = (st.town[KEEPER[a.shop]] ?? 0) >= 15 ? 0.9 : 1, night = st.slot === 'evening' ? 1.2 : 1;
      // the keeper's markup after a theft caught (lot V4), reached by a named state since lot L2a (v2-wanted-night)
      const markup = (st.v2?.shops?.[a.shop]?.markup ?? 0) >= st.day ? 1.25 : 1;
      return Math.max(1, Math.round(LISTV2[a.item] * FACTOR[a.shop] * (1 - k) * rel * steel * dree * rush * stage * night * markup));
    }
    // the forge's own tiers: the Wyrmsteel is no tier since the steel cargo was rewritten (the operator's Q-02 « Attaque +1, en plus des paliers, tout de suite », journal
    // Passe QE2)
    case 'upgradeWeapon': { const tier = Math.min(3, st.v2.gear.tier); return tier >= 3 ? 0 : [10, 25, 40][tier]; }
    case 'buySkill': return Math.round({ t3: 45, k_sunder: 40, k_iron: 35 }[a.skill] * (st.player.reputation >= 40 ? 0.9 : 1) * (st.flags[`lesson:${st.day}`] ? 0.8 : 1));
    case 'checkGear': return 5;
    // lot L3 (journal Passe EVL5): a rumour of the next opponent, a round at Lio's 3, the stranger's word 8; Clerk Odo's strongroom on the eve of a bout 5
    case 'rumour': return { lio: 3, stranger: 8 }[a.src];
    case 'lockGear': return 5;
    // lot L6 (the festival of day 9, FE-3): a round at Lio's for the festival 10; the hall's lanterns hung and Brother Ambrose's flame carried take a slot, no coin
    case 'festDeed': return a.deed === 'round' ? 10 : 0;
    // the town's quests (journal Passe QE2: Q-03, Q-04, Q-05): Fenwick's river moss 5, Pip's price for Master Corvin's treatise 15, the card sharps paid off 15, faced with
    // the watch nothing
    case 'buyHerbs': return 5;
    case 'buyTreatise': return 15;
    case 'faceSharps': return a.how === 'pay' ? 15 : 0;
    // the player's sabotage (the operator's SA-1, SF-2; journal Passe SB4): the stranger's blade 8 and Corra Dunmere's watch 20, each times the stage's price (×1.15 from day 6, ×1.3 from day 9)
    case 'buyTool': return Math.round(8 * (st.day >= 9 ? 1.3 : st.day >= 6 ? 1.15 : 1));
    case 'cutStrap': return a.accomplice ? Math.round(20 * (st.day >= 9 ? 1.3 : st.day >= 6 ? 1.15 : 1)) : 0;
    default: return 0;
  }
}

/** what the action's apply takes from the purse (a gain is not a cost) */
function spent(st, a) {
  const s = structuredClone(st);
  A.ACTIONS[a.type].apply(s, a, G.rngFor(st, 'test'), (e) => e);
  return Math.max(0, st.player.coins - s.player.coins);
}

/** every named state, in every place, rich (and poor with the price changers all off or all on), with the price changers on and off */
function* states() {
  for (const name of Object.keys(G.NAMED_STATES)) {
    const base = G.namedState(name);
    for (const place of G.NAMED_STATES[name].v2 ? ['district', 'forecourt', 'lanterns', 'training'] : ['district', 'forecourt', 'lanterns']) for (let v = 0; v < 32; v++) for (const coins of v % 31 ? [200] : [0, 200]) {
      const s = structuredClone(base); s.place = place; s.player.coins = coins;
      if (v & 1) { s.flags['discount:mara'] = true; s.services.shopFactor = 1.4; }
      if (v & 2) s.flags['free-care'] = true;
      if (v & 4) { s.player.injury = 1; s.quests.cargo = 'delivered'; }
      if (v & 8) { s.services.forge = 'sabotaged'; s.flags['culprit-known'] = 'cassius'; }
      if (v & 16 && s.competitors.orla) s.competitors.orla.relationships.player = 25;
      yield s;
    }
  }
}

test('every option\'s coins are the game\'s price, and what its action really takes from the purse', () => {
  const seen = new Set();
  let n = 0;
  for (const st of states()) for (const o of G.actions(st)) {
    const a = o.action, want = rule(st, a);
    assert.equal(o.coins, want, `${o.label} (day ${st.day} ${st.slot}, ${st.place})`);
    // a theft's fine is a risk, not a price (journal Passe V4): its tag is « free », its apply may take up to 15 coins when caught
    if (o.ok && (a.type === 'steal' || a.type === 'pickpocket')) assert.ok(spent(st, a) <= 25, `${o.label}: the fine`);
    // a bargain is paid only when it works (lot L2a): all of its price, or nothing
    else if (o.ok && (a.type === 'bargain' || (a.type === 'barter' && a.arg))) assert.ok([0, o.coins].includes(spent(st, a)), `${o.label}: won or lost`);
    else if (o.ok) { assert.equal(o.coins, spent(st, a), `${o.label}: its apply`); seen.add(`${a.type}:${a.type === 'buy' ? a.item + ':' : ''}${o.coins}`); n++; }
  }
  // the sweep reaches every paid action, both prices of the healer and of the bellows, and Mara's changed prices
  for (const k of ['buy:whetstone:8', 'buy:salve:10', 'buy:imported-blade:30', 'buy:whetstone:10', 'buy:imported-blade:38', 'temper:10', 'buyInfo:10', 'payWatch:15', 'heal:8', 'heal:0', 'repair:12', 'repair:6', 'restock:0', 'rumour:3', 'rumour:8', 'lockGear:5', 'festDeed:10']) {
    assert.ok(seen.has(k), `the sweep never offers ${k}: ${[...seen].sort().join(' ')}`);
  }
  assert.ok(n > 500, `${n} options applied`);
});

const tags = (html) => [...html.matchAll(/<span class="([^"]*)">([^<]*)<\/span>/g)].map((m) => `${m[1]}|${m[2]}`);

test('one tag per currency: the coins, the slot, « free » only when nothing is spent', () => {
  assert.deepEqual(tags(costTag({ cost: 0, coins: 0 })), ['cost free|free']);
  assert.deepEqual(tags(costTag({ cost: 1, coins: 0 })), ['cost|1 slot']);
  assert.deepEqual(tags(costTag({ cost: 0, coins: 8 })), ['cost|8 coins']);
  assert.deepEqual(tags(costTag({ cost: 1, coins: 10 })), ['cost|10 coins', 'cost|1 slot']);
  assert.deepEqual(tags(costTag({ cost: 0, coins: 1 })), ['cost|1 coin']);
  // nothing else in the markup than the tags
  assert.equal(costTag({ cost: 1, coins: 10 }), '<span class="cost">10 coins</span><span class="cost">1 slot</span>');
});

test('Mara\'s goods no longer say « free »: their tags carry her prices (the audit\'s dialogue, day 1 morning)', () => {
  const st = G.namedState('day1-morning');
  const buy = G.actions(st).filter((o) => o.action.type === 'buy');
  assert.equal(buy.length, 3);
  for (const o of buy) assert.deepEqual(tags(costTag(o)), [`cost|${LIST[o.action.item]} coins`], o.label);
  const restock = G.actions(st).find((o) => o.action.type === 'restock');
  assert.deepEqual(tags(costTag(restock)), ['cost|1 slot'], 'a gain of coins is not a cost');
});
