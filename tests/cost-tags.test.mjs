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
    case 'buy': return Math.round(LIST[a.item] * (a.item === 'salve' ? 1 : st.services.shopFactor) * (st.flags['discount:mara'] ? 0.9 : 1));
    case 'temper': case 'buyInfo': return 10;
    case 'payWatch': return 15;
    case 'heal': return st.flags['free-care'] ? 0 : 8;
    case 'repair': return (st.competitors.orla?.relationships.player ?? 0) >= 20 ? 6 : 12;
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
    for (const place of ['district', 'forecourt', 'lanterns']) for (let v = 0; v < 32; v++) for (const coins of v % 31 ? [200] : [0, 200]) {
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
    if (o.ok) { assert.equal(o.coins, spent(st, a), `${o.label}: its apply`); seen.add(`${a.type}:${a.type === 'buy' ? a.item + ':' : ''}${o.coins}`); n++; }
  }
  // the sweep reaches every paid action, both prices of the healer and of the bellows, and Mara's changed prices
  for (const k of ['buy:whetstone:8', 'buy:salve:10', 'buy:imported-blade:30', 'buy:whetstone:10', 'buy:imported-blade:38', 'temper:10', 'buyInfo:10', 'payWatch:15', 'heal:8', 'heal:0', 'repair:12', 'repair:6', 'restock:0']) {
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
