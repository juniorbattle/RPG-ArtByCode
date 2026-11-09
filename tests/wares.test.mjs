// The gear and the shops' page (the operator's choice UM7-3 « Lot à part : héros, détail, comparaison », journal Passe UM9): what a line changes is the
// game's own: the numbers read from the duel's data, the « after » the real action on a copy, never a rule of the interface.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const GE = await load('/src/simulation/gear.ts');
const VG = await load('/src/simulation/v2gear.ts');
const P = await load('/src/simulation/preview.ts');
const M = await load('/src/combat/match.ts');
const W = await load('/src/ui/wares.ts');
const ROOT = path.resolve(import.meta.dirname, '..');

const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const rows = (p) => Object.fromEntries(p.rows.map((r) => [r.id, r]));

test('the numbers of a bout are the duel\'s own: health as the arena builds it, Ren\'s stats, the AP and the effects, gear and wounds included (DB7-7, journal Passe DB8)', () => {
  const st = G.makeV2(G.namedState('day2-afternoon'));
  for (const gear of [{}, { weapon: 'imported-blade', tier: 2 }, { armour: 'mail-shirt', acc: ['lucky-ribbon', 'docker-wrap'] }, { weapon: 'duelist-sabre', acc: ['swift-boots', 'iron-ring'] }]) for (const injury of [0, 1]) for (const wins of [0, 3]) {
    const s = structuredClone(st); Object.assign(s.v2.gear, gear); s.player.injury = injury; s.v2.wins = wins;
    const m = VG.v2Mods(s), { data: d } = M.v2SheetData(M.matchSheetFor(s), undefined, s.v2.kit, m), n = P.duelStats(s);
    assert.equal(n.hp, d.fighters.ren.maxHp); assert.equal(n.ap, d.ap.start); assert.equal(n.effect, m.effect * 100);
    assert.deepEqual([n.atk, n.def, n.end, n.viv], [m.stats.atk, m.stats.def, m.stats.end, m.stats.viv]);
    // the vigour (DB7-4 « +12 PV par victoire ») and the wound's share of it
    assert.equal(d.fighters.ren.maxHp, Math.round(m.stats.hp * (1 - 0.2 * injury))); assert.equal(m.stats.hp - VG.v2Stats({ ...s, v2: { ...s.v2, wins: 0 } }).hp, 12 * wins);
    assert.equal(n.blow, undefined, 'the heavy blow is a skill\'s figure (the skills page)');
  }
  const plain = G.namedState('day2-afternoon'), classic = M.sheetData(M.matchSheetFor(plain));
  assert.deepEqual(P.duelStats(plain), { hp: classic.fighters.ren.maxHp, blow: classic.actions.heavy.damage }, 'the default game: its own two numbers');
  const dyn = structuredClone(plain); dyn.flags.combat = 'dynamic';
  assert.equal(P.duelStats(dyn).hp, M.dynSheetData(M.matchSheetFor(dyn)).fighters.ren.maxHp, 'a game on the dynamic rules reads them');
});

test('every line sold anywhere: the « after » is what buying it really gives, the coins too, and the state is left as it was', () => {
  for (const name of ['day1-morning', 'forecourt-morning']) for (const place of ['district', 'forecourt', 'training', 'lanterns']) for (const slot of ['morning', 'afternoon']) {
    const st = v2(name); st.place = place; st.slot = slot; st.player.coins = 300; st.player.injury = 1;
    for (const o of G.actions(st).filter((x) => x.ok && W.isWare(x) && x.action.type !== 'upgradeWeapon')) {
      const before = G.hash(st), p = P.preview(st, o.action), next = act(st, o.action), had = P.duelStats(st), got = P.duelStats(next);
      assert.equal(G.hash(st), before, `${o.label}: a preview changes nothing`);
      assert.deepEqual(p.coins, [st.player.coins, next.player.coins], o.label);
      for (const id of P.STAT_IDS.filter((x) => had[x] !== undefined)) {
        const r = rows(p)[id];
        if (r) { assert.equal(r.now, had[id], `${o.label}: ${id}`); assert.equal(r.after, got[id], `${o.label}: ${id}`); } else assert.equal(+got[id].toFixed(3), +had[id].toFixed(3), `${o.label}: ${id} does not move`);
      }
    }
  }
});

test('better and worse follow the number\'s sense: more Defence is better, less Speed is worse', () => {
  const st = v2('forecourt-morning'); st.player.coins = 300;
  const r = rows(P.preview(st, { type: 'shopBuy', shop: 'armourer', item: 'mail-shirt' }));
  // the mail (DB7-2): Defence +3, Speed -0.5
  assert.equal(r.def.better, true); assert.equal(r.def.after, r.def.now + 3);
  assert.equal(r.viv.better, false); assert.equal(r.viv.after, r.viv.now - 0.5);
  const w = v2(); w.player.coins = 300;
  const b = rows(P.preview(w, { type: 'shopBuy', shop: 'mara', item: 'docker-wrap' }));
  // Ren 150 at the start (journal Passe DB8), the wrap +9
  assert.equal(b.hp.better, true); assert.equal(b.hp.after, 159);
});

test('what it replaces, and the trap a swap hides: the forge\'s tiers leave with the old weapon', () => {
  const st = v2(); st.player.coins = 300; st.v2.gear.tier = 3;
  const p = P.preview(st, { type: 'shopBuy', shop: 'mara', item: 'imported-blade' });
  assert.deepEqual([p.slot, p.replaces, p.tierLost], ['weapon', 'training-sword', 3]);
  const r = rows(p);
  assert.equal(r.atk.better, false, 'three tiers (Attack +3) lost for the blade\'s +2: the Attack falls, and the page says it');
  st.v2.gear.tier = 1;
  const up = P.preview(st, { type: 'upgradeWeapon' });
  assert.deepEqual([up.slot, up.replaces, up.tierLost], ['weapon', null, 0], 'the forge keeps the weapon');
});

test('both accessories on: a third goes to the bag and changes nothing; from the bag the player chooses which one it replaces', () => {
  const st = v2('forecourt-morning'); st.player.coins = 300; st.v2.gear.acc = ['lucky-ribbon', 'docker-wrap'];
  const p = P.preview(st, { type: 'shopBuy', shop: 'armourer', item: 'iron-ring' });
  assert.equal(p.toBag, true); assert.equal(p.slot, null); assert.deepEqual(p.rows, []);
  st.v2.gear.bag = ['iron-ring'];
  const a = P.preview(st, { type: 'equip', item: 'iron-ring', slot: 0 }), b = P.preview(st, { type: 'equip', item: 'iron-ring', slot: 1 });
  assert.deepEqual([a.slot, a.replaces], [0, 'lucky-ribbon']); assert.deepEqual([b.slot, b.replaces], [1, 'docker-wrap']);
  assert.ok(rows(a).ap && !rows(a).ap.better, 'the ribbon off: one AP less'); assert.ok(rows(b).hp && !rows(b).hp.better, 'the wrap off: less health');
  assert.equal(a.coins[0], a.coins[1], 'wearing is free');
});

test('the whetstone and the salve read as the duel reads them, in a version 2 game and in the default game', () => {
  const st = v2(); st.player.coins = 300; st.player.injury = 1;
  assert.ok(rows(P.preview(st, { type: 'shopBuy', shop: 'mara', item: 'whetstone' })).atk.better);
  assert.deepEqual([rows(P.preview(st, { type: 'shopBuy', shop: 'mara', item: 'salve' })).hp.now, rows(P.preview(st, { type: 'shopBuy', shop: 'mara', item: 'salve' })).hp.after], [120, 150]);
  const d = G.namedState('day1-morning'); d.player.coins = 300; d.player.injury = 1;
  for (const o of G.actions(d).filter((x) => W.isWare(x) && x.ok)) {
    const p = P.preview(d, o.action), next = act(d, o.action);
    assert.equal(p.coins[1], next.player.coins);
    for (const r of p.rows) assert.equal(r.after, P.duelStats(next)[r.id], o.label);
    assert.ok(p.rows.length, `${o.label}: it changes a number`);
  }
});

test('a line out of reach still tells what it would change: the coins go below zero, the page says what is short', () => {
  const st = v2(); st.player.coins = 5;
  const o = G.actions(st).find((x) => x.action.type === 'shopBuy' && x.action.item === 'imported-blade');
  assert.equal(o.ok, false);
  const p = P.preview(st, o.action);
  assert.equal(p.coins[1], 5 - o.coins); assert.ok(rows(p).atk.better);
});

test('the dialogue gives one line to the goods: every keeper\'s wares and bargain leave its list, nothing else does', () => {
  const st = v2(); st.player.coins = 300;
  const all = G.actions(st);
  assert.ok(all.filter(W.isWare).some((o) => o.action.type === 'shopBuy') && all.filter(W.isWare).some((o) => o.action.type === 'upgradeWeapon'));
  // the bargains (lot L2a, EV-6): put to a piece of the goods, never a line of their own; a passer-by's piece is goods, its arguments with it
  assert.ok(all.some((o) => o.action.type === 'bargain' && W.isGoods(o) && !W.isWare(o)));
  const fc = structuredClone(st); fc.place = 'forecourt'; const fa = G.actions(fc);
  assert.ok(fa.some((o) => o.action.type === 'barter' && !o.action.arg && W.isWare(o)) && fa.some((o) => o.action.type === 'barter' && o.action.arg && W.isGoods(o) && !W.isWare(o)));
  assert.ok(!fa.some((o) => o.action.type === 'pickpocket' && W.isGoods(o)), 'a pocket stays with the place\'s actions');
  assert.ok(!all.some((o) => o.action.type === 'steal' && W.isGoods(o)), 'stealing stays with the place\'s actions');
  const d = G.namedState('day1-morning');
  assert.ok(G.actions(d).filter(W.isWare).every((o) => o.action.type === 'buy' || o.action.type === 'temper'), 'the default game\'s stall');
});

test('the page keeps the system: tokens only, no green, no red, no new image, the former slots gone', () => {
  const src = fs.readFileSync(path.join(ROOT, 'src/ui/wares.ts'), 'utf8');
  assert.doesNotMatch(src, /#[0-9a-f]{3,8}\b/i, 'no colour of its own');
  assert.doesNotMatch(src, /\.(png|jpe?g|webp|svg)\b/i, 'no image of its own');
  assert.doesNotMatch(src, /drop-shadow|border-radius|box-shadow:(?!inset)/, 'square, flat');
  assert.doesNotMatch(fs.readFileSync(path.join(ROOT, 'src/ui/townUi.ts'), 'utf8'), /pm-slot/);
});
