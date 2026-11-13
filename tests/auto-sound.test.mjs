// Lot 4 of the duel played by the computer (briefs/combat-auto.md § 17.3, journal Passe LC6): the sound and the effects on its new moments, the approved ones
// first (lot S3's sounds, journal Passes SN15 to SN17; the effects' recipes, journal Passes FX2 to FX5). What is proved here, in Node, against oracles written
// from the duel's script alone:
// - the replay tells Ren's charge of a skill as the charge's tier of the duel of before (its place on the ladder of his four by their charge time), its release
//   at the line its action leaves on, its breath again after a stun; never his light attack's charge, never a rival's;
// - which sound plays: the tier's note at the level the skill was released at before, the whip at its release, an enchaînement's later blows their side's plain
//   blow (the action's own sound on its first blow only), no crowd's reaction on them;
// - the music's rule F (CQ-REGLE « F · Des niveaux plus doux ») on this duel's moments: the lead steps aside while the opponent charges a big action (its
//   sequence), the tension rises on it, on Ren's charge of a skill, on a stun and under 30 % of health;
// - the form of the day's sign (LC6-7 « Les deux signes », journal Passe LC7): once a fighter at the bout's start, its notes computed in the page.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const AV = await load('/src/arena/autoView.ts');
const ST = await load('/src/combat/stats.ts');
const S = await load('/src/audio/sfx.ts');
const P = await load('/src/audio/plan.ts');
const FX = await load('/src/arena/fx/fxRecipes.ts');
const FC = await load('/src/audio/formCue.ts');

const RIVALS = Object.keys(ST.RIVAL_SHEETS);
const LOADOUTS = [['t1', 't4', 'd1', 's1'], ['t3', 'k_sunder', 'k_iron', 'k_cry'], ['t2', 'k_feint', 'k_parry', 'k_focus']];
const duelOf = (foe, stage, seed, loadout) => {
  const ren = AD.autoRen({ ...ST.REN_BASE, hp: 324, atk: 17, def: 15 }, { loadout, levels: { t1: 2, t2: 1, t3: 1, t4: 1, d1: 1, s1: 1, k_iron: 1, k_parry: 1, k_cry: 1, k_focus: 1, k_sunder: 1, k_feint: 1, heavy: 1 } }, { weapon: 'imported-blade' });
  const f = AD.autoFoe(foe, AD.autoRaceSheet(foe, stage, 1));
  return { ren, foe: f, result: AU.autoDuel(ren, f, seed, { log: true, trace: true }) };
};
/** the whole replay at the arena's step, every event with its time */
const play = (d) => {
  const rp = new AV.AutoReplay(d.result, { ren: d.ren, marek: d.foe }), evs = rp.drain();
  for (let i = 0; i < 1e6 && !rp.over; i++) { rp.step(rp.D.dt); evs.push(...rp.drain()); }
  return { rp, evs };
};
const DUELS = [];
for (const [k, foe] of RIVALS.entries()) for (const seed of [1, 2]) DUELS.push(duelOf(foe, seed - 1, seed, LOADOUTS[(k + seed) % LOADOUTS.length]));
// two duels where Ren is broken while he charges a skill (found by a search over seeds, again with SL1-3's automatic, journal Passe SL3): his breath again at the
// stun's end
DUELS.push(duelOf('rhosk', 0, 77, LOADOUTS[0]), duelOf('orla', 0, 26, LOADOUTS[0]));

test('the replay tells Ren\'s charge of a skill as the charge\'s tier, its release where its action leaves, its breath again after a stun; never his light attack, never a rival', () => {
  let tiers = 0, releases = 0, holds = 0;
  for (const d of DUELS) {
    const { rp, evs } = play(d), log = d.result.log, koAt = log.find((e) => e.hp !== undefined && e.hp <= 0)?.t ?? Infinity;
    // the oracle: the ladder (the light attack 0, then his four by their charge time, the shortest first, the order on a tie), each charge of a skill and the
    // line its action leaves on (its first blow or its effect), from the script alone
    const ladder = new Map([...d.ren.skills].map((a, k) => [a, k]).sort((x, y) => x[0].charge - y[0].charge || x[1] - y[1]).map(([a], r) => [a.id, r + 1]));
    assert.equal(rp.tiers, 5);
    const want = [], open = {};
    for (const e of log) {
      if (e.t > koAt) break;
      if (e.who !== d.ren.id) continue;
      // (his heavy blow, a base attack since SY-02, the first tier: the operator's SL1-6 « Sa charge au premier palier (au lot 2) »)
      if (e.ev === 'charge') { open.c = e.act === d.ren.light.id ? null : e; if (open.c) want.push({ type: 'chargeTier', t: e.t, idx: e.act === d.ren.heavy.id ? 1 : ladder.get(e.act) }); continue; }
      if (e.ev === 'break') continue;
      if (open.c) { want.push({ type: 'chargeRelease', t: e.t, idx: open.c.act === d.ren.heavy.id ? 1 : ladder.get(open.c.act) }); open.c = null; }
    }
    const got = evs.filter((e) => e.type === 'chargeTier' || e.type === 'chargeRelease');
    assert.equal(got.length, want.length, `${d.foe.id}: one tier a charge of a skill, one release an action leaving`);
    got.forEach((e, i) => {
      const w = want[i];
      assert.equal(e.type, w.type); assert.equal(e.idx, w.idx, `${e.type} at ${w.t}: its tier`); assert.equal(e.who, 'ren');
      assert.ok(e.t >= w.t - 1e-9 && e.t - w.t <= rp.D.dt + 1e-9, `${e.type} told at its line (${e.t} for ${w.t})`);
      if (e.type === 'chargeTier') assert.equal(e.open, true); else assert.equal(e.ok, true);
    });
    tiers += got.filter((e) => e.type === 'chargeTier').length; releases += got.filter((e) => e.type === 'chargeRelease').length;
    // a stun while he charges a skill: the breath again at its end, at his tier
    const stuns = log.filter((e) => e.ev === 'break' && e.who === d.ren.id && e.t < koAt);
    for (const b of stuns) {
      const before = log.filter((e) => e.who === d.ren.id && e.t <= b.t && e.ev !== 'break'), last = before.reverse().find((e) => e.ev === 'charge' || e.ev === 'hit' || e.ev === 'guarded' || e.ev === 'dodged' || e.ev === 'ward' || e.ev === 'boost');
      const charging = last?.ev === 'charge' && last.act !== d.ren.light.id, end = b.t + AU.AUTO_RULES.brk.stun, leaves = last ? log.find((e) => e.who === d.ren.id && e.t > last.t && e.ev !== 'charge' && e.ev !== 'break') : null;
      const hold = evs.find((e) => e.type === 'chargeHold' && Math.abs(e.t - end) <= rp.D.dt + 1e-9);
      if (charging && leaves && leaves.t > end + rp.D.dt && end < koAt) { assert.ok(hold && hold.idx === (last.act === d.ren.heavy.id ? 1 : ladder.get(last.act)), `${d.foe.id}: the breath again at ${end}`); holds++; }
      else assert.ok(!hold || charging, `${d.foe.id}: no breath after a stun out of a charge`);
    }
    assert.ok(!evs.some((e) => (e.type === 'chargeTier' || e.type === 'chargeHold' || e.type === 'chargeRelease') && e.who !== 'ren'), 'a rival\'s charge tells no tier');
    // « Skip » tells none of it (its last blow and the K.O. only)
    const sk = new AV.AutoReplay(d.result, { ren: d.ren, marek: d.foe }); sk.step(); sk.drain(); sk.skip();
    assert.ok(sk.drain().filter((e) => e.type === 'chargeTier' || e.type === 'chargeHold').length === 0);
  }
  assert.ok(tiers > 150 && releases > 150 && holds >= 1, `the paths are reached: ${tiers} tiers, ${releases} releases, ${holds} breaths after a stun`);
});

test('which sound plays: the tier\'s note at the level its skill was released at before, the whip, an enchaînement\'s later blows their side\'s plain blow, no crowd on them', () => {
  // the levels of the duel of before for a ladder of five (the light attack and four skills): its first skill 1, the next two 2, the last 3 (src/combat/charge.ts)
  assert.deepEqual([1, 2, 3, 4].map((i) => S.chargeLevel(i, 5)), [1, 2, 2, 3]);
  assert.deepEqual([1, 2, 3, 4].map((i) => FX.chargeLevel(i, 5)), [1, 2, 2, 3], 'the effects count the same levels');
  let follows = 0, own = 0, held = 0;
  for (const d of DUELS) {
    const { rp, evs } = play(d);
    let hold = 0;
    for (const e of evs) {
      const ids = S.sfxOf(e, rp.tiers).map((c) => c.id);
      if (e.type === 'chargeTier') assert.deepEqual(ids, [`charge${[0, 1, 2, 2, 3][e.idx]}`], `the tier ${e.idx}`);
      if (e.type === 'chargeRelease') assert.deepEqual(ids, ['release']);
      if (e.type === 'chargeHold') assert.deepEqual(ids, [], 'the breath goes on without its note');
      if (e.type === 'impact' && e.result === 'hit') {
        const plain = e.from === 'ren' ? 'light' : 'm_slash';
        if (e.follow) { assert.deepEqual(ids, [plain], `${e.action}'s later blow`); assert.equal(S.crowdOf(e), null); follows++; }
        else if (['t1', 't3'].includes(e.action)) { assert.deepEqual(ids, [e.action], 'its first blow its own'); own++; }
      }
      const h = S.holdOf(e, rp.tiers, hold);
      if (e.type === 'chargeTier' || e.type === 'chargeHold') { assert.equal(h, [0, 1, 2, 2, 3][e.idx]); held++; }
      if (e.type === 'chargeRelease' || e.type === 'ko' || (e.type === 'stun' && e.who === 'ren')) assert.equal(h, 0);
      hold = h;
    }
  }
  assert.ok(follows > 200 && own > 10 && held > 150, `the paths: ${follows} later blows, ${own} own first blows, ${held} breaths`);
});

test('the form of the day\'s sign (LC6-7 « Les deux signes »): told once a fighter at the start of the bout from ±5 %, computed in the page the same every time, its recipes apart', async () => {
  const fs = await import('node:fs'), path = await import('node:path');
  for (const id of ['formUp', 'formDown']) {
    const a = FC.formCue(id), b = FC.formCue(id);
    assert.deepEqual(a, b, `${id}: its own seed, the same samples`);
    let peak = 0; for (const v of a) peak = Math.max(peak, Math.abs(v));
    assert.ok(peak > 0.01 && peak <= 0.7 + 1e-6, `${id}: peak ${peak}`);
    assert.equal(a.length, 52800, '1.1 s at the band\'s rate');
    // its loudest 400 ms at its target (-24 dB the good form, as the charge's first note; -27 the poor form), the peak kept under 0.7
    const w = 19200; let best = 0; for (let i = 0; i + w <= a.length; i += w >> 2) { let s = 0; for (let j = i; j < i + w; j++) s += a[j] * a[j]; best = Math.max(best, Math.sqrt(s / w)); }
    const db = 20 * Math.log10(best); assert.ok(Math.abs(db - (id === 'formUp' ? -24 : -27)) < 0.3 || peak > 0.699, `${id}: ${db.toFixed(1)} dB`);
  }
  assert.notDeepEqual(FC.formCue('formUp').subarray(0, 4800), FC.formCue('formDown').subarray(0, 4800));
  // who shows a sign: +5 points and more, -5 and less, nothing between (the match sheet's « +14 % »)
  assert.deepEqual([1.15, 1.05, 1.049, 1, 0.951, 0.95, 0.85].map(AV.formSignOf), ['up', 'up', null, null, null, 'down', 'down']);
  // the replay tells it once a fighter at its time, against the duel's own forms; « Skip » and a seek past it tell nothing
  let told = 0, silent = 0;
  for (const d of DUELS) {
    const { rp, evs } = play(d), signs = evs.filter((e) => e.type === 'formSign');
    ['ren', 'marek'].forEach((seat, k) => {
      const f = d.result.form[k], want = f >= 1.05 - 1e-9 ? 'up' : f <= 0.95 + 1e-9 ? 'down' : null, got = signs.filter((e) => e.who === seat);
      if (!want) { assert.equal(got.length, 0, `${d.foe.id} ${seat}: form ${f}, no sign`); silent++; return; }
      assert.equal(got.length, 1, `${d.foe.id} ${seat}: one sign`); assert.equal(got[0].sign, want);
      assert.ok(got[0].t >= AV.FORM_AT[seat] - 1e-9 && got[0].t - AV.FORM_AT[seat] <= rp.D.dt + 1e-9, `${seat}: at ${AV.FORM_AT[seat]} s (${got[0].t})`);
      told++;
    });
    const sk = new AV.AutoReplay(d.result, { ren: d.ren, marek: d.foe }); sk.drain(); sk.skip();
    assert.equal(sk.drain().filter((e) => e.type === 'formSign').length, 0, 'skipped: no sign');
    const sought = new AV.AutoReplay(d.result, { ren: d.ren, marek: d.foe }); sought.seek(2); sought.drain(); for (let i = 0; i < 60; i++) sought.step();
    assert.equal(sought.drain().filter((e) => e.type === 'formSign').length, 0, 'a moment sought past it: no sign');
  }
  assert.ok(told >= 8 && silent >= 1, `signs told ${told}, fighters without one ${silent}`);
  // its recipes well formed, apart from the duel's one-to-one table (its sound is computed, not baked)
  for (const r of Object.values(FX.FORM_RECIPES)) {
    assert.ok(r.duration > 0 && r.duration <= 1, `${r.id}: under a second (FX4)`);
    assert.ok(r.steps.every((s) => s.at >= 0 && s.at < r.duration && ['orbit', 'glow', 'light', 'smoke', 'motes'].includes(s.kind)), r.id);
    assert.ok(!r.steps.some((s) => s.kind === 'ring'), `${r.id}: nothing circular`);
    assert.equal(FX.RECIPES[r.id], undefined, `${r.id}: not one of the duel's recipes`);
  }
  assert.deepEqual([['up', 'ren'], ['up', 'marek'], ['down', 'ren'], ['down', 'marek']].map(([s, w]) => FX.formRecipe(s, w).id), ['formUp', 'formUpFoe', 'formDown', 'formDown']);
  // wired: the engine plays it (its notes computed once), the effects draw it
  const src = (f) => fs.readFileSync(path.join(import.meta.dirname, '..', f), 'utf8');
  assert.match(src('src/audio/Sound.ts'), /if \(e\.type === 'formSign'\) \{ this\.formSign\(/);
  assert.match(src('src/arena/fx/combatFx.ts'), /else if \(e\.type === 'formSign'\) self\(formRecipe\(e\.sign, e\.who\)/);
});

test('the music\'s rule F on this duel: the lead aside on the opponent\'s sequence (a big action charged), the tension up on it, on Ren\'s charge of a skill, a stun, under 30 %', () => {
  let seqT = 0, chargeT = 0, total = 0;
  for (const d of DUELS) {
    const { rp, evs } = play(d), maxHp = { ren: rp.f.ren.maxHp, marek: rp.f.marek.maxHp };
    // the oracle, from the script: the intervals where the opponent charges an offensive action other than its light attack and its combo (to its first blow),
    // and where Ren charges a skill or his heavy blow (rule F's « la charge lourde », SL1-6: to the line it leaves on); the stuns; the first blow that leaves a fighter under 30 %
    const log = d.result.log, koAt = d.result.t, ivs = { seq: [], ch: [], stun: [] };
    const light = new Set([d.foe.light.id, d.ren.light.id]), big = (who, act) => { const f = who === d.ren.id ? d.ren : d.foe, a = [f.light, f.heavy, ...f.skills].find((x) => x?.id === act); return a && !light.has(act) && !a.ward && !a.boost; };
    const open = {}; let lowAt = Infinity;
    for (const e of log) {
      if (e.ev === 'charge') { open[e.who] = e; continue; }
      if (e.ev === 'break') { ivs.stun.push([e.t, e.t + AU.AUTO_RULES.brk.stun]); continue; }
      const c = open[e.who];
      if (c) { if (e.who === d.foe.id && big(e.who, c.act)) ivs.seq.push([c.t, e.t]); if (e.who === d.ren.id && c.act !== d.ren.light.id) ivs.ch.push([c.t, e.t]); open[e.who] = null; }
      if (e.hp !== undefined && lowAt === Infinity) { const to = e.who === d.ren.id ? 'marek' : 'ren'; if (e.hp / maxHp[to] < P.LOW_HP) lowAt = e.t; }
    }
    // an action still charged at the K.O. holds its moment to the end
    for (const [who, c] of Object.entries(open)) if (c) { if (who === d.foe.id && big(who, c.act)) ivs.seq.push([c.t, koAt]); if (who === d.ren.id && c.act !== d.ren.light.id) ivs.ch.push([c.t, koAt]); }
    const inside = (list, t) => list.some(([a, b]) => t > a + 0.02 && t < b - 0.02);
    let m = P.CALM, k = 0;
    const sorted = evs;
    for (let t = 0.05; t < koAt - 0.05; t += 0.05) {
      while (k < sorted.length && (sorted[k].t ?? 0) <= t) m = P.moodStep(m, sorted[k++], maxHp);
      const [base, lead, tension] = P.layerLevels(m), seq = inside(ivs.seq, t), ch = inside(ivs.ch, t), stun = inside(ivs.stun, t), low = t > lowAt + 0.02;
      const near = (list) => list.some(([a, b]) => Math.abs(t - a) <= 0.03 || Math.abs(t - b) <= 0.03);
      if (near(ivs.seq) || near(ivs.ch) || near(ivs.stun) || Math.abs(t - lowAt) <= 0.03) continue;
      assert.equal(base, 1);
      assert.equal(lead, seq ? P.MELODY_ASIDE : 1, `${d.foe.id} at ${t.toFixed(2)}: the lead (sequence ${seq})`);
      assert.equal(tension, seq || ch || stun || low ? 1 : P.TENSION_REST, `${d.foe.id} at ${t.toFixed(2)}: the tension (seq ${seq}, charge ${ch}, stun ${stun}, low ${low})`);
      total++; if (seq) seqT++; if (ch) chargeT++;
    }
  }
  // the moments are there: the opponent's sequences and Ren's charges each a share of the duel, as the duel of before's (journal Passe SN13)
  assert.ok(seqT / total > 0.1 && chargeT / total > 0.1, `shares: the sequence ${(seqT / total).toFixed(2)}, Ren's charge ${(chargeT / total).toFixed(2)}`);
});
