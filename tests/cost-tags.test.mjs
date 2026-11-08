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
function rule(st, a) {
  switch (a.type) {
    // the version 2's bargains (lot L2a, EV-6): the piece's price less the argument's share (the name 20 %, a friend 15 %, two at once 25 % on both, what
    // touches a passer-by 30 %), paid only if it works; a passer-by's piece at its price
    case 'bargain': {
      const off = (p, d) => Math.max(1, Math.round(p * (1 - d))), d = { name: 0.2, friend: 0.15, pair: 0.25 }[a.arg];
      const ITEMS = { mara: ['whetstone', 'docker-wrap', 'dock-leathers', 'imported-blade'], armourer: ['padded-jack', 'iron-ring', 'mail-shirt'], master: ['swift-boots', 'duelist-sabre'], trinkets: ['lucky-ribbon', 'fervour-charm'] }[a.shop];
      const held = (id) => id === 'whetstone' ? st.player.items.includes('whetstone') : [st.v2.gear.weapon, st.v2.gear.armour, ...st.v2.gear.acc, ...st.v2.gear.bag].includes(id);
      const pair = a.arg === 'pair' ? ITEMS.find((id) => id !== a.item && !held(id)) : null;
      return off(rule(st, { type: 'shopBuy', shop: a.shop, item: a.item }), d) + (pair ? off(rule(st, { type: 'shopBuy', shop: a.shop, item: pair }), d) : 0);
    }
    // a challenge's coins staked are put on the table at once (lot L2b, EV-3: 10, won back twice); paying a reprisal's muscle off, 20
    case 'challenge': return a.stake === 'coins' ? 10 : 0;
    case 'payMuscle': return 20;
    // a restitution at Sergeant Hale's (lot L2a): the pieces still held go back, the others are paid at their list price, his fee of 5; a thin purse pays all it has
    case 'restitute': {
      const PRICE = { 'imported-blade': 30, 'duelist-sabre': 55, 'padded-jack': 18, 'mail-shirt': 40, 'dock-leathers': 26, 'lucky-ribbon': 12, 'iron-ring': 24, 'swift-boots': 30, 'fervour-charm': 16, 'docker-wrap': 14, whetstone: 8, 'river-pearl': 26, 'knight-hauberk': 34, 'pilgrim-medal': 18 };
      const g = st.v2.gear, held = (id) => id === 'whetstone' ? st.player.items.includes('whetstone') : [g.weapon, g.armour, ...g.acc, ...g.bag].includes(id);
      const open = (st.v2.thefts ?? []).filter((x) => !x.settled), debt = open.filter((x) => !held(x.item)).reduce((n, x) => n + PRICE[x.item], 0) + (open.length || (st.v2.marks ?? 0) > 0 ? 5 : 0);
      return Math.min(debt, st.player.coins);
    }
    case 'barter': { const p = { fenwick: 26, edda: 34, sela: 18 }[a.who]; return !a.arg ? p : Math.max(1, Math.round(p * (a.arg === 'name' ? 0.8 : 0.7))); }
    case 'buy': return Math.round(LIST[a.item] * (a.item === 'salve' ? 1 : st.services.shopFactor) * (st.flags['discount:mara'] ? 0.9 : 1));
    case 'temper': case 'buyInfo': return 10;
    case 'payWatch': return 15;
    case 'heal': return st.flags['free-care'] ? 0 : 8;
    case 'repair': return (st.competitors.orla?.relationships.player ?? 0) >= 20 ? 6 : 12;
    // the version 2 (journal Passe V2): the weapon master's skills, a tenth off for a reputation of 40 or more
    case 'shopBuy': {
      const LISTV2 = { 'imported-blade': 30, 'duelist-sabre': 55, 'padded-jack': 18, 'mail-shirt': 40, 'dock-leathers': 26, 'lucky-ribbon': 12, 'iron-ring': 24, 'swift-boots': 30, 'fervour-charm': 16, 'docker-wrap': 14, whetstone: 8, salve: 10 };
      const FACTOR = { mara: 1, armourer: 1.15, master: 1.1, trinkets: 0.9 }, KEEPER = { mara: 'mara', armourer: 'hilde', master: 'corvin', trinkets: 'pip' };
      const steel = ['imported-blade', 'duelist-sabre', 'padded-jack', 'mail-shirt', 'dock-leathers'].includes(a.item) ? st.services.shopFactor : 1;
      const k = Math.min(0.15, st.player.reputation / 400), rel = (st.town[KEEPER[a.shop]] ?? 0) >= 15 ? 0.9 : 1, night = st.slot === 'evening' ? 1.2 : 1;
      // the keeper's markup after a theft caught (lot V4), reached by a named state since lot L2a (v2-wanted-night)
      const markup = (st.v2?.shops?.[a.shop]?.markup ?? 0) >= st.day ? 1.25 : 1;
      return Math.max(1, Math.round(LISTV2[a.item] * FACTOR[a.shop] * (1 - k) * rel * steel * night * markup));
    }
    case 'upgradeWeapon': { const tier = Math.min(3, st.v2.gear.tier + (st.player.items.includes('tempered-blade') ? 1 : 0)); return tier >= 3 ? 0 : [10, 25, 40][tier]; }
    case 'buySkill': return Math.round({ t3: 45, k_sunder: 40, k_iron: 35 }[a.skill] * (st.player.reputation >= 40 ? 0.9 : 1) * (st.flags[`lesson:${st.day}`] ? 0.8 : 1));
    case 'checkGear': return 5;
    // lot L3 (journal Passe EVL5): a rumour of the next opponent, a round at Lio's 3, the stranger's word 8; Clerk Odo's strongroom on the eve of a bout 5
    case 'rumour': return { lio: 3, stranger: 8 }[a.src];
    case 'lockGear': return 5;
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
  for (const k of ['buy:whetstone:8', 'buy:salve:10', 'buy:imported-blade:30', 'buy:whetstone:10', 'buy:imported-blade:38', 'temper:10', 'buyInfo:10', 'payWatch:15', 'heal:8', 'heal:0', 'repair:12', 'repair:6', 'restock:0', 'rumour:3', 'rumour:8', 'lockGear:5']) {
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
