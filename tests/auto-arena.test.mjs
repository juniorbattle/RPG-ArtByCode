// Lot 2 of the duel played by the computer (briefs/combat-auto.md § 17.3, journal Passe LC3): the arena plays the duel's script (src/arena/autoView.ts) and the
// match sheet says what decides it, the player setting the order of his four skills (AC-09). What is proved here, in Node:
// - the replay ends on the duel's own result, at the arena's step as when skipped or sought, and tells each blow once (the effects, the stands and the sound
//   read those events); the trace (each event's AP and gauges) changes nothing of the duel;
// - the form of the day is known before the bout (AC-08), the reactions the sheet shows are the duel's (AC-05), against oracles written here;
// - the order: the player's, a minor action of the save; the automatic follows it; a skill brought later takes its place after the others;
// - the arena's rules by page: a version 2 bout and the arena's own page play the duel played by the computer, `?duel=charge` the three buttons of before.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const AM = await load('/src/combat/autoMatch.ts');
const AV = await load('/src/arena/autoView.ts');
const DV = await load('/src/arena/dynamicView.ts');
const G = await load('/src/simulation/index.ts');
const ST = await load('/src/combat/stats.ts');
const PV = await load('/src/simulation/preview.ts');

const RIVALS = Object.keys(ST.RIVAL_SHEETS);
const duelOf = (foe, stage, seed, loadout = ['t1', 't4', 'd1', 's1'], order, weapon = 'imported-blade') => {
  const ren = AD.autoRen({ ...ST.REN_BASE, hp: 324, atk: 17, def: 15 }, { loadout, levels: { t1: 2, t2: 1, t3: 1, t4: 1, d1: 1, s1: 1, k_iron: 1, k_parry: 1, k_cry: 1, k_focus: 1, k_sunder: 1, k_feint: 1, heavy: 1 }, order }, { weapon });
  const f = AD.autoFoe(foe, AD.autoRaceSheet(foe, stage, 1));
  return { ren, foe: f, result: AU.autoDuel(ren, f, seed, { log: true, trace: true }) };
};
const blows = (r) => r.log.filter((e) => e.ev === 'hit' || e.ev === 'guarded' || e.ev === 'dodged');
/** a fighter's gauge just after line i of the script, from the script alone (lot 4, journal Passe LC6): a line's trace is written before its blow fills the gauge
 *  (src/combat/auto.ts), so the gauge after it is the next line's trace with its decay undone, full when the next line is that fighter's break or when it is broken;
 *  undefined when the next line finds it empty (a stun ended between them, or a decay to nothing) or there is no next line. k: 1 the first fighter, 3 the second */
function gaugeAfter(log, i, k) {
  const R = AU.AUTO_RULES, e = log[i], n = log[i + 1];
  if (e.s[k] >= R.gauge.max) return R.gauge.max;
  if (!n) return undefined;
  if (n.ev === 'break' && n.s[k] >= R.gauge.max) return R.gauge.max;
  return n.s[k] > 0 ? Math.min(R.gauge.max, n.s[k] + R.gauge.decay * (n.t - e.t)) : undefined;
}

test('the trace changes nothing of the duel: the same script, each line with both fighters\' AP and gauges', () => {
  for (const [foe, seed] of [['orla', 3], ['vessa', 11], ['marek', 7]]) {
    const { ren, foe: f, result } = duelOf(foe, 1, seed), plain = AU.autoDuel(ren, f, seed, { log: true });
    assert.deepEqual(result.log.map(({ s, fx, ...e }) => e), plain.log, foe);
    assert.deepEqual({ ...result, log: null }, { ...plain, log: null });
    for (const e of result.log) {
      assert.equal(e.s.length, 4);
      assert.ok(e.s[0] >= 0 && e.s[0] <= 5 && e.s[2] >= 0 && e.s[2] <= 5, 'AP within 0..5');
      assert.ok(e.s[1] >= 0 && e.s[1] <= AU.AUTO_RULES.gauge.max && e.s[3] >= 0 && e.s[3] <= AU.AUTO_RULES.gauge.max, 'gauges within 0..70');
      if (e.ev === 'break') assert.equal(e.s[e.who === 'ren' ? 1 : 3], AU.AUTO_RULES.gauge.max, 'a break: the gauge full');
      if (e.ev === 'hit' || e.ev === 'guarded') assert.equal(e.hp, Math.max(0, e.hp), 'health');
    }
  }
});

test('the replay ends on the duel\'s own result, at the arena\'s step, skipped or sought, each blow told once', () => {
  let ko = 0, breaks = 0, wards = 0, dodges = 0;
  for (const foe of RIVALS) for (const seed of [1, 2]) {
    const d = duelOf(foe, seed === 1 ? 0 : 2, seed), r = d.result, rp = new AV.AutoReplay(r, { ren: d.ren, marek: d.foe });
    const evs = [];
    for (let i = 0; i < 1e6 && !rp.over; i++) { rp.step(rp.D.dt); evs.push(...rp.drain()); }
    for (let i = 0; i < 240; i++) { rp.step(rp.D.dt); evs.push(...rp.drain()); }
    const w = AU.autoWinner(r) === 0 ? 'ren' : 'marek';
    assert.equal(rp.winner, w, `${foe} ${seed}`);
    assert.equal(rp.f.ren.hp, r.hp[0]); assert.equal(rp.f.marek.hp, r.hp[1]);
    assert.equal(rp.f[w === 'ren' ? 'marek' : 'ren'].state, 'down');
    const impacts = evs.filter((e) => e.type === 'impact');
    assert.equal(impacts.length, blows(r).length, 'one impact a blow of the script');
    impacts.forEach((e, i) => { const b = blows(r)[i]; assert.equal(e.damage ?? 0, b.dmg ?? 0); assert.equal(e.result, b.ev); assert.equal(e.action, b.act); });
    assert.equal(evs.filter((e) => e.type === 'ko').length, 1, 'one K.O.');
    assert.equal(evs.filter((e) => e.type === 'break').length, r.log.filter((e) => e.ev === 'break').length);
    assert.equal(evs.filter((e) => e.type === 'effect').length, r.log.filter((e) => e.ev === 'ward' || e.ev === 'boost').length);
    ko++; breaks += evs.filter((e) => e.type === 'break').length; wards += evs.filter((e) => e.type === 'effect').length; dodges += impacts.filter((e) => e.result === 'dodged').length;
    // « Skip »: the same end, its K.O. told, none of the blows before it
    const sk = new AV.AutoReplay(r, { ren: d.ren, marek: d.foe });
    sk.step(); sk.drain(); sk.skip();
    const se = sk.drain();
    assert.ok(sk.over && sk.winner === w && sk.f.ren.hp === r.hp[0] && sk.f.marek.hp === r.hp[1]);
    assert.equal(se.filter((e) => e.type === 'ko').length, 1);
    assert.ok(se.filter((e) => e.type === 'impact').length <= 1, 'skipped: at most the last blow told');
    // a moment sought: the state of the arena's clock at that time
    const t = Math.round(r.t * 0.4 * 120) / 120, a = new AV.AutoReplay(r, { ren: d.ren, marek: d.foe }), b = new AV.AutoReplay(r, { ren: d.ren, marek: d.foe });
    while (a.t < t - 1e-9) a.step(a.D.dt);
    b.seek(a.t);
    assert.equal(b.hash(), a.hash(), `seek ${foe} ${seed}`);
    assert.deepEqual(b.hud(), a.hud());
  }
  assert.ok(ko === RIVALS.length * 2 && breaks > 0 && wards > 0 && dodges > 0, 'the paths are reached: breaks, wards, dodges');
});

test('each blow drawn from before it lands (journal Passe LC4): its run-up read from the script, within its charge or the enchaînement\'s gap, never in its striker\'s stun; the blow drawn when it lands', () => {
  let firsts = 0, follows = 0, effects = 0;
  for (const foe of RIVALS) for (const seed of [1, 2]) {
    const d = duelOf(foe, seed === 1 ? 0 : 2, seed), r = d.result, rp = new AV.AutoReplay(r, { ren: d.ren, marek: d.foe });
    const seatOf = (who) => (who === d.ren.id ? 'ren' : 'marek');
    // the oracle, from the script alone: each blow's or effect's window ends its run-up on the line's time
    const want = { ren: [], marek: [] }, charge = { ren: null, marek: null }, prev = { ren: -1e9, marek: -1e9 }, stun = { ren: [], marek: [] };
    for (const e of r.log) {
      const s = seatOf(e.who);
      if (e.ev === 'charge') { charge[s] = e; continue; }
      if (e.ev === 'break') { stun[s].push([e.t, e.t + AU.AUTO_RULES.brk.stun]); continue; }
      const first = !!charge[s], len = first ? charge[s].at - charge[s].t : 0;
      want[s].push({ t: e.t, first, len, gap: e.t - prev[s], effect: e.ev === 'ward' || e.ev === 'boost', act: e.act });
      if (!(e.ev === 'ward' || e.ev === 'boost')) prev[s] = e.t;
      charge[s] = null;
    }
    for (const s of ['ren', 'marek']) {
      const ws = rp.wins[s];
      assert.equal(ws.length, want[s].length, `${foe} ${seed} ${s}: one window a blow or an effect`);
      ws.forEach((w, i) => {
        const o = want[s][i], lead = w.impactAt;
        assert.ok(i === 0 || ws[i - 1].t0 <= w.t0, 'in the order they start');
        const free = o.t - Math.max(-1e9, ...stun[s].filter(([, b]) => b <= o.t + 1e-9).map(([, b]) => b));
        assert.ok(Math.abs(w.t0 + lead - o.t) < 1e-9 && lead >= Math.min(0.04, free) - 1e-9, `${foe} ${s} ${o.act} at ${o.t}: its run-up ends on its line (${lead})`);
        assert.equal(w.id, o.act);
        if (o.first || o.effect) { assert.ok(lead <= 0.6 * o.len + 1e-9 || lead <= 0.04 + 1e-12, `${o.act}: within 60 % of its charge (${lead} of ${o.len})`); o.effect ? effects++ : firsts++; }
        else { assert.ok(w.follow && lead <= 0.8 * o.gap + 1e-9 && lead <= AV.WIND.nextHit + 1e-9, `${o.act}: an enchaînement's next blow within its gap (${lead} of ${o.gap})`); follows++; }
        for (const [a, b] of stun[s]) assert.ok(!(w.t0 > a + 1e-9 && w.t0 < b - 1e-9), `${foe} ${s} ${o.act}: no run-up begun in its own stun`);
      });
    }
    // at the arena's step: every blow's run-up drawn before its impact, and the blow drawn when its impact is told
    const ran = new Set(), clip = { light: 'strike', heavy: 'heavy', skill: 'skillOff' };
    for (let i = 0; i < 1e6 && !rp.over; i++) {
      rp.step(rp.D.dt);
      for (const s of ['ren', 'marek']) { const an = rp.f[s].anim; if (rp.f[s].state === 'acting' && an.prep === 0 && an.t < an.impactAt - 1e-9) ran.add(`${s}:${(rp.t - an.t).toFixed(5)}`); }
      for (const e of rp.drain()) {
        if (e.type !== 'impact') continue;
        const f = rp.f[e.from];
        assert.equal(f.state, 'acting', `${foe} ${seed}: ${e.from}'s ${e.action} lands drawn (${f.state} ${f.anim.name})`);
        assert.equal(f.anim.name, f.act.def.kind === 'skill' && f.act.def.family !== 'offensive' ? f.anim.name : clip[e.kind] ?? f.anim.name);
        assert.ok(Math.abs(f.anim.t - f.anim.impactAt) <= rp.D.dt + 1e-9, `${e.action}: its impact on the frame it lands (${f.anim.t} / ${f.anim.impactAt})`);
      }
    }
    for (const s of ['ren', 'marek']) for (const w of rp.wins[s]) if (w.t0 + w.impactAt <= rp.t) assert.ok(ran.has(`${s}:${w.t0.toFixed(5)}`), `${foe} ${seed} ${s}: the run-up of ${w.id} at ${w.t0 + w.impactAt} drawn before it lands`);
  }
  assert.ok(firsts > 100 && follows > 20 && effects > 0, `the paths are reached: ${firsts} first blows, ${follows} next blows, ${effects} effects`);
});

test('the replay\'s HUD: both charges on the timeline, the gauges as the script leaves them, Ren\'s four in his order with their cooldowns (DB5-3)', () => {
  const d = duelOf('cassius', 1, 5), r = d.result, rp = new AV.AutoReplay(r, { ren: d.ren, marek: d.foe });
  const order = d.ren.skills.map((a) => a.id);
  assert.deepEqual(rp.hud().slots.map((s) => s.id), order);
  let charged = 0, cooled = 0;
  r.log.forEach((e, i) => {
    if (rp.hud().over) return;
    while (rp.t < e.t - 1e-9) rp.step(rp.D.dt);
    rp.step(rp.D.dt / 4); rp.drain();
    const h = rp.hud(), last = !r.log[i + 1] || r.log[i + 1].t > e.t + 1e-9;
    // the gauge as the last line of that instant left it (several lines can share one instant), the line's blow in it (lot 4: no longer one line late)
    const ga = gaugeAfter(r.log, i, 1);
    if (e.s && last && Math.abs(rp.t - e.t) < 0.01 && !h.over && ga !== undefined) {
      const g = ga / AU.AUTO_RULES.gauge.max * 100, gr = h.ren.broken ? 100 : h.ren.gaugePct;
      assert.ok(Math.abs(gr - g) < 0.5 || h.ren.broken, `the gauge at ${e.t}: ${gr} for ${g}`);
    }
    if (e.ev === 'charge' && e.who === 'ren' && e.act !== 'light' && e.act !== d.ren.heavy.id && !h.over) { charged++; assert.ok(h.slots.find((s) => s.id === e.act).charging, `${e.act} lit while charging`); }
    if (h.slots.some((s) => s.cool > 0)) cooled++;
  });
  assert.ok(charged > 3 && cooled > 0);
});

test('the gauge at the blow that fills it (journal Passe LC5\'s note, fixed on the presentation\'s side in lot 4): the HUD and the impact say the gauge after the blow, the script\'s own', () => {
  let checked = 0, late = 0, breaks = 0;
  // every blow, and by kind (the operator's report, journal Passe LC7: « la jauge de break qui semble avoir du retard lors des actions/coups executes surtout lorsqu'il y a
  // des combos »): an enchaînement's later blows, the last blow of an enchaînement of two and of three, a blow on a ward, a blow under its striker's boost
  const kinds = { later: 0, last2: 0, last3: 0, ward: 0, boost: 0 };
  const cases = [];
  for (const foe of RIVALS) for (const seed of [1, 2]) cases.push([foe, seed === 1 ? 0 : 2, seed]);
  // Ren's three-blow enchaînements: the duelist's sabre's light attack and Tourbillon, with a ward and a boost of his own
  for (const foe of RIVALS) cases.push([foe, 1, 3, ['t3', 'k_cry', 'k_iron', 't1'], undefined, 'duelist-sabre']);
  for (const [foe, stage, seed, loadout, order, weapon] of cases) {
    const d = duelOf(foe, stage, seed, loadout, order, weapon), r = d.result, rp = new AV.AutoReplay(r, { ren: d.ren, marek: d.foe }), max = AU.AUTO_RULES.gauge.max;
    // the wards and boosts under way at each line, from the script alone
    const eff = [];
    for (const e of r.log) if (e.ev === 'ward' || e.ev === 'boost') { const f = e.who === d.ren.id ? d.ren : d.foe, a = [f.light, f.heavy, ...f.skills].find((x) => x?.id === e.act); eff.push({ who: e.who, kind: e.ev, from: e.t, to: e.t + (a.ward ?? a.boost).dur }); }
    const on = (who, kind, t) => eff.some((x) => x.who === who && x.kind === kind && x.from <= t && t < x.to);
    const hitsOf = (who, act) => { const f = who === d.ren.id ? d.ren : d.foe; return ([f.light, f.heavy, ...f.skills].find((x) => x?.id === act)?.hits ?? [1]).length; };
    const seat = (who) => (who === d.ren.id ? 'ren' : 'marek'), byLine = new Map();
    // each blow's impact, in the order of the script's blows
    const imps = [];
    for (let i = 0; i < 1e6 && !rp.over; i++) { rp.step(rp.D.dt); imps.push(...rp.drain().filter((e) => e.type === 'impact')); }
    const bl = r.log.map((e, i) => ({ e, i })).filter(({ e }) => e.ev === 'hit' || e.ev === 'guarded' || e.ev === 'dodged');
    bl.forEach(({ e, i }, k) => byLine.set(i, imps[k]));
    for (const [i, imp] of byLine) {
      const e = r.log[i]; if (!imp || e.ev === 'dodged' || (e.hp ?? 1) <= 0) continue;
      const kt = seat(e.who) === 'ren' ? 3 : 1, want = gaugeAfter(r.log, i, kt);
      if (want === undefined) continue;
      assert.ok(Math.abs(imp.resist - want) < 0.02, `${foe} ${seed} line ${i} (${e.ev} ${e.act} at ${e.t}): the impact says ${imp.resist}, the script ${want}`);
      checked++; if (want - e.s[kt] > 0.5) late++; if (r.log[i + 1]?.ev === 'break') breaks++;
      const n = hitsOf(e.who, e.act), target = e.who === d.ren.id ? d.foe.id : d.ren.id;
      if ((e.hit ?? 1) > 1) kinds.later++;
      if (n === 2 && e.hit === 2) kinds.last2++;
      if (n >= 3 && e.hit === n) kinds.last3++;
      if (on(target, 'ward', e.t)) kinds.ward++;
      if (on(e.who, 'boost', e.t)) kinds.boost++;
    }
    // the HUD at the step after a blow: the gauge after it, a blow that breaks shows it full
    const h = new AV.AutoReplay(r, { ren: d.ren, marek: d.foe });
    for (const [i] of byLine) {
      const e = r.log[i]; if (e.ev === 'dodged' || (e.hp ?? 1) <= 0 || r.log[i + 1]?.t === e.t && r.log[i + 1]?.ev !== 'charge' && r.log[i + 1]?.ev !== 'break') continue;
      const kt = seat(e.who) === 'ren' ? 3 : 1, want = gaugeAfter(r.log, i, kt); if (want === undefined) continue;
      h.seek(e.t);
      const g = h.hud()[seat(e.who) === 'ren' ? 'marek' : 'ren'];
      if (h.hud().over) continue;
      assert.ok(Math.abs((g.broken ? 100 : g.gaugePct) - (want / max) * 100) < 0.5, `${foe} ${seed}: the HUD at ${e.t} shows ${g.gaugePct} for ${(want / max) * 100}`);
    }
  }
  // the fault this fixes was there: blows whose share was shown one line late; every kind of blow reached
  assert.ok(checked > 1000 && late > 300 && breaks > 0, `blows checked ${checked}, of which ${late} late before lot 4, ${breaks} breaking`);
  assert.ok(kinds.later > 300 && kinds.last2 > 100 && kinds.last3 > 50 && kinds.ward > 50 && kinds.boost > 50, `by kind: ${JSON.stringify(kinds)}`);
});

test('AC-08: the form of the day known before the bout, as the duel draws it; AC-05: the reactions the match sheet shows are the duel\'s formulas', () => {
  for (const seed of [1, 99, 1234, 777777]) {
    const d = duelOf('orla', 1, seed);
    assert.deepEqual(AU.autoFormsOf(seed), d.result.form);
  }
  // the oracles of briefs/combat-auto.md § 3: the dodge 12 % × 2·Spd / (Spd + Spd'), the guard 35 % × 2·Def / (Def + Atk'), ×2 against a skill seen coming, a
  // the stats alone since SY-01, at most 90 %
  const me = { def: 12, viv: 10 }, him = { atk: 18, viv: 8 };
  const r = AM.autoReactions(me, him);
  assert.ok(Math.abs(r.dodge - 0.12 * 20 / 18) < 1e-9);
  assert.ok(Math.abs(r.guard - 0.35 * 24 / 30) < 1e-9);
  assert.ok(Math.abs(r.guardSkill - 0.35 * 24 / 30 * 2) < 1e-9);
  assert.equal(AM.autoReactions({ def: 40, viv: 10 }, { atk: 5, viv: 10 }).guardSkill, 0.9, 'at most 90 %');
});

test('AC-09: the order of the four, the player\'s (a minor action of the save) or the automatic\'s own; a skill brought later after the others', () => {
  let st = G.newGame(1842, 'Ren'); G.makeV2(st);
  const kit = G.v2KitOf(st);
  assert.equal(kit.order, undefined);
  assert.deepEqual(AD.autoOrderOf(kit), AD.autoDefaultOrder(kit.loadout, kit.levels));
  for (const bad of [['t1', 't4', 'd1'], ['t1', 't4', 'd1', 'd1'], ['t1', 't4', 'd1', 'k_iron']]) assert.equal(G.advance(st, { type: 'setOrder', skills: bad }).ok, false, bad.join());
  const want = ['t1', 'd1', 't4', 's1'], r = G.advance(st, { type: 'setOrder', skills: want });
  assert.ok(r.ok); st = r.state;
  assert.deepEqual(G.v2KitOf(st).order, want);
  assert.notEqual(G.hash(st), G.hash(G.newGame(1842, 'Ren')), 'the order is the game\'s');
  assert.deepEqual(AD.autoRen(ST.REN_BASE, G.v2KitOf(st)).skills.map((a) => a.id), want, 'the automatic follows it');
  // a skill swapped in: the others keep their order, the new one last
  assert.deepEqual(AD.autoOrderOf({ loadout: ['t1', 'k_iron', 't4', 's1'], levels: {}, order: want }), ['t1', 't4', 's1', 'k_iron']);
  // the page's view: the order, each with its AP and its charge at Ren's Speed
  const v = PV.autoOrderView(st, G.v2KitOf(st).loadout);
  assert.deepEqual(v.map((x) => x.id), want);
  assert.deepEqual(v.map((x) => x.ap), want.map((id) => AD.autoSkill(id, 1).ap));
  assert.deepEqual(v.map((x) => x.charge), want.map((id) => +AD.autoSkill(id, 1).charge.toFixed(2)));
  // today's game has no such action
  assert.equal(G.advance(G.newGame(1842, 'Ren'), { type: 'setOrder', skills: want }).ok, false);
});

test('a version 2 bout\'s duel is the one the match sheet prepared, and the order changes it', () => {
  let st = G.newGame(1, 'Aster'); G.makeV2(st);
  for (let i = 0; i < 4; i++) st = G.advance(st, { type: 'wait' }).state;
  const b = AM.autoBoutOf(st), o = AM.autoOutcome(st, 'bout', { log: true });
  assert.ok(b && o.duel.log.length > 50);
  assert.deepEqual(o.duel.form, AM.autoForms(b));
  assert.deepEqual(AU.autoDuel(b.ren, b.foe, b.seed), { ...o.duel, log: null });
  const other = G.advance(st, { type: 'setOrder', skills: ['t4', 't1', 's1', 'd1'] }).state, o2 = AM.autoOutcome(other);
  assert.notEqual(`${o2.duel.t}:${o2.playerHp}:${o2.opponentHp}`, `${o.duel.t}:${o.playerHp}:${o.opponentHp}`, 'another order, another duel');
});

test('the arena\'s rules: a version 2 bout and the arena\'s own page play the duel played by the computer; ?duel=charge the three buttons of before; ?v2=0 today\'s', () => {
  const q = (s) => new URLSearchParams(s);
  assert.equal(DV.arenaRules(q('scene=arena')), 'auto');
  assert.equal(DV.arenaRules(q('scene=arena&v2=1')), 'auto');
  assert.equal(DV.arenaRules(q('scene=arena&duel=charge')), 'v2');
  assert.equal(DV.arenaRules(q('scene=arena&v2=0')), 'classic');
  assert.equal(DV.arenaRules(q('scene=arena&v2=0&duel=charge')), 'classic');
  assert.equal(DV.arenaRules(q('scene=arena&combat=dynamic&v2=0')), 'dynamic');
  assert.equal(DV.arenaRules(q(''), { rules: 'auto' }), 'auto');
  assert.ok(DV.fxOn('auto', q('')) && !DV.fxOn('auto', q('fx=off')) && DV.v2Rules('auto') && DV.v2Rules('v2') && !DV.v2Rules('classic'));
  // the arena's own page: Ren of a new game against the pool's Marek, a fixed seed
  const sc = AV.sceneAutoDuel();
  assert.equal(sc.foe.id, 'marek'); assert.deepEqual(sc.ren.skills.map((a) => a.id), AD.autoDefaultOrder(['t1', 't4', 'd1', 's1'], { t1: 1, t4: 1, d1: 1, s1: 1 }));
  assert.ok(sc.result.log.length > 50 && sc.result.log[0].s);
});
