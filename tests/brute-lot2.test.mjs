// Lot 2 of « La Brute » (briefs/combat-auto.md § 33.5, journal Passe BL2): what is seen of the duel. What is proved here, in Node:
// - the plan of combat: a condition per skill among its role's (the laboratory's CONDS_BY_ROLE, as its plans were measured), a plan kept for a rival (set on its
//   match sheet, begun from the general plan, played by the bouts against that rival only), the save keeping it;
// - the replay: the openings told as the duel makes them (each fighter's openings against the duel's own count), an interruption and a parry told where the
//   script has them and a parry drawn (the striker's blow reaching the parrier's block), a blow in an opening never guarded nor dodged, an enchaînement's
//   running total, each skill's uses left as the script spends them;
// - the pages' figures: a skill's uses and the gap between two, the order's, as the duel builds them;
// - the first duel's lessons of the opening and the clash, their numbers the duel's; the parry's sound and effect.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { load } from './load.mjs';

const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const AM = await load('/src/combat/autoMatch.ts');
const AV = await load('/src/arena/autoView.ts');
const G = await load('/src/simulation/index.ts');
const ST = await load('/src/combat/stats.ts');
const PV = await load('/src/simulation/preview.ts');
const DT = await load('/src/ui/duelTutorial.ts');
const SC = await load('/src/audio/score.ts');
const SFX = await load('/src/audio/sfx.ts');

const RIVALS = Object.keys(ST.RIVAL_SHEETS);
const LEVELS = { t1: 2, t2: 1, t3: 1, t4: 1, d1: 1, s1: 1, k_iron: 1, k_parry: 1, k_cry: 1, k_focus: 1, k_sunder: 1, k_feint: 1, heavy: 1 };
const duelOf = (foe, stage, seed, loadout = ['t1', 't4', 'd1', 's1']) => {
  const ren = AD.autoRen({ ...ST.REN_BASE, hp: 324, atk: 17, def: 15 }, { loadout, levels: LEVELS }, { weapon: 'imported-blade' });
  const f = AD.autoFoe(foe, AD.autoRaceSheet(foe, stage, 1), { stage });
  return { ren, foe: f, result: AU.autoDuel(ren, f, seed, { log: true, trace: true }) };
};
/** the replay stepped at the arena's step from start to end: every event it tells, with the HUD read after each step */
function replayAll(d) {
  const r = new AV.AutoReplay(d.result, { ren: d.ren, marek: d.foe });
  const evs = [], huds = [];
  r.drain();
  while (!r.over || r.t < r.end + 0.5) { r.step(); for (const e of r.drain()) evs.push(e); huds.push(r.hud()); if (r.t > r.end + 1) break; }
  return { r, evs, huds };
}
/** the kits that reach every new moment: Sunder (an opener) and the Feint (an interrupt) in Ren's hands, Cassius parrying, Vessa dodging */
const KITS = [['t1', 't4', 'd1', 's1'], ['k_sunder', 't4', 'k_feint', 't1'], ['k_feint', 'k_parry', 't4', 'k_sunder']];

test('the plan\'s conditions: each role\'s, the laboratory\'s as its plans were measured; the action takes them, and a family\'s of before', () => {
  const src = fs.readFileSync(new URL('../tools/auto-final/brute.mjs', import.meta.url), 'utf8');
  const block = src.slice(src.indexOf('export const CONDS_BY_ROLE = {') + 'export const CONDS_BY_ROLE = '.length, src.indexOf('};', src.indexOf('export const CONDS_BY_ROLE')) + 1);
  const lab = new Function(`return ${block}`)();
  assert.deepEqual(AD.AUTO_CONDS_BY_ROLE, lab, 'the page offers what the laboratory measured');
  for (const [id, x] of Object.entries(AD.AUTO_ROLES)) if (AD.AUTO_SKILLS[id]) assert.deepEqual(AD.autoCondsFor(id), lab[x.role], id);
  let st = G.makeV2(G.namedState('day1-morning'));
  // the Estoc (an exploit) takes « dans une faille », the Rampart (a ward) does not; a family's condition of before still holds (a plan written before lot 2)
  assert.ok(G.advance(st, { type: 'setTactic', skill: 't4', cond: 'open' }).ok);
  assert.ok(!G.advance(st, { type: 'setTactic', skill: 'd1', cond: 'open' }).ok);
  assert.equal(AD.autoCondOf({ tactic: { t4: 'hurt' } }, 't4'), 'hurt', 'the offensive family\'s « hurt », kept for a plan of before');
  assert.equal(AD.autoCondOf({ tactic: { d1: 'follow' } }, 'd1'), 'auto', 'neither its role\'s nor its family\'s');
});

test('a plan kept for a rival: set on its match sheet, begun from the general plan, played by the bouts against that rival only, in the save', () => {
  let st = G.newGame(1, 'Aster'); G.makeV2(st);
  for (let i = 0; i < 4; i++) st = G.advance(st, { type: 'wait' }).state;
  const b0 = AM.autoBoutOf(st); assert.ok(b0, 'a bout of the day');
  const foe = b0.foeId, other = RIVALS.find((x) => x !== foe);
  const act = (a) => { const r = G.advance(st, a); assert.ok(r.ok, r.reason); st = r.state; };
  act({ type: 'setTactic', skill: 't1', cond: 'never' });
  const general = { ...G.v2KitOf(st).tactic };
  // the match sheet's: the rival's plan, begun from the general one
  act({ type: 'setTactic', skill: 't4', cond: 'open', foe });
  act({ type: 'setOrder', skills: ['t4', 't1', 's1', 'd1'], foe });
  const k = G.v2KitOf(st);
  assert.deepEqual(k.tactic, general, 'the general plan unchanged');
  assert.deepEqual(k.plans[foe].tactic, { ...general, t4: 'open' }, 'the rival\'s begun from the general');
  assert.deepEqual(k.plans[foe].order, ['t4', 't1', 's1', 'd1']);
  // the bout against that rival plays it; a bout against another the general one
  const b = AM.autoBoutOf(st);
  assert.deepEqual(b.ren.skills.map((a) => a.id), ['t4', 't1', 's1', 'd1']);
  assert.deepEqual(b.ren.tactic, ['open', 'never', 'auto', 'auto']);
  const vsOther = AD.autoRen(ST.REN_BASE, AD.autoKitFor(k, other));
  assert.deepEqual(vsOther.tactic, AD.autoTacticOf(k, AD.autoOrderOf(k)), 'another rival: the general plan');
  // the page's order is the rival's on its match sheet, the general one elsewhere
  assert.deepEqual(PV.autoOrderView(st, k.loadout, foe).map((x) => x.id), ['t4', 't1', 's1', 'd1']);
  assert.deepEqual(PV.autoOrderView(st, k.loadout).map((x) => x.id), AD.autoOrderOf(k));
  // in the fingerprint and the save; a bad name refused
  const copy = G.v2KitOf(JSON.parse(JSON.stringify(st)));
  assert.deepEqual(copy.plans, k.plans);
  assert.ok(!G.advance(st, { type: 'setTactic', skill: 't4', cond: 'open', foe: 'Not a name!' }).ok);
  // a plan written before lot 2 (no plans) plays as it did
  let old = G.newGame(1, 'Aster'); G.makeV2(old);
  for (let i = 0; i < 4; i++) old = G.advance(old, { type: 'wait' }).state;
  assert.deepEqual(AM.autoBoutOf(old).ren, b0.ren);
});

test('the replay tells the openings as the duel makes them: each fighter\'s openings made, against the duel\'s own count', () => {
  let opened = 0, kinds = new Set();
  for (const foe of RIVALS) for (const loadout of KITS) for (const seed of [3, 11]) {
    const d = duelOf(foe, 1, seed, loadout), { evs } = replayAll(d);
    const open = evs.filter((e) => e.type === 'open');
    for (const e of open) kinds.add(e.why);
    // the fighter left open is the other of the one who made it (an opener's striker, a dodger, an interrupter, a parrier): their count, the duel's
    for (const [k, seat] of [[0, 'marek'], [1, 'ren']]) assert.equal(open.filter((e) => e.who === seat).length, d.result.n[k].opened, `${foe} ${loadout} ${seed}: ${seat} left open`);
    opened += open.length;
    // the interruptions and parries where the script has them, about the right fighters
    const log = d.result.log, ids = { [d.ren.id]: 'ren', [d.foe.id]: 'marek' };
    assert.deepEqual(evs.filter((e) => e.type === 'interrupt').map((e) => `${e.by}>${e.who}:${e.action}`), log.filter((e) => e.ev === 'interrupt').map((e) => `${ids[e.who]}>${ids[e.who] === 'ren' ? 'marek' : 'ren'}:${e.act}`));
    assert.deepEqual(evs.filter((e) => e.type === 'parry').map((e) => `${e.who}>${e.to}:${e.action}`), log.filter((e) => e.ev === 'parry').map((e) => `${ids[e.who]}>${ids[e.who] === 'ren' ? 'marek' : 'ren'}:${e.act}`));
  }
  assert.ok(opened > 50, `openings seen (${opened})`);
  assert.deepEqual([...kinds].sort(), ['interrupt', 'opener', 'parry', 'whiff'], 'every way of opening');
});

test('a blow in an opening is never guarded nor dodged; an enchaînement\'s total is its blows added up; each skill\'s uses left as the script spends them', () => {
  for (const foe of ['vessa', 'cassius', 'orla', 'marek']) for (const loadout of KITS) {
    const d = duelOf(foe, 1, 7, loadout), { evs, huds } = replayAll(d);
    const imp = evs.filter((e) => e.type === 'impact');
    for (const e of imp.filter((x) => x.inOpen || x.inBreak)) assert.equal(e.result, 'hit', `${foe}: in an opening or a break, a blow lands`);
    // the running total: an action's first blow its own damage, each later one adds its own
    const sum = { ren: 0, marek: 0 };
    for (const e of imp) { sum[e.from] = e.follow ? sum[e.from] + e.damage : e.damage; assert.equal(e.total, sum[e.from], `${foe}: ${e.from}'s total`); }
    // each skill's uses left: its uses less the charges the script shows by then
    const last = huds[huds.length - 1];
    for (const s of last.slots) {
      const spent = d.result.log.filter((e) => e.ev === 'charge' && e.who === d.ren.id && e.act === s.id).length;
      assert.equal(s.uses, d.ren.skills.find((a) => a.id === s.id).uses);
      assert.equal(s.left, Math.max(0, s.uses - spent), `${foe} ${s.id}`);
    }
    // the opening's seconds on a card while it lasts, none once it ran out
    assert.ok(huds.every((h) => h.ren.open >= 0 && h.marek.open >= 0 && h.ren.open <= 6.01 && h.marek.open <= 6.01));
  }
});

test('a parry is drawn: the striker\'s big blow reaching the parrier, who blocks it, at its moment', () => {
  let seen = 0;
  for (const loadout of KITS) for (const seed of [1, 2, 3, 4, 5, 6]) {
    const d = duelOf('cassius', 2, seed, loadout), ids = { [d.ren.id]: 'ren', [d.foe.id]: 'marek' };
    const { wins, reacts } = AV.windowsOf(d.result.log, ids, { ren: new Map([d.ren.light, d.ren.heavy, ...d.ren.skills].map((a) => [a.id, a])), marek: new Map([d.foe.light, d.foe.heavy, ...d.foe.skills].map((a) => [a.id, a])) });
    for (const e of d.result.log.filter((x) => x.ev === 'parry')) {
      const parrier = ids[e.who], striker = parrier === 'ren' ? 'marek' : 'ren';
      assert.ok(wins[striker].some((w) => w.id === e.act && Math.abs(w.t0 + w.impactAt - e.t) < 1e-9), 'the striker\'s blow lands at the parry');
      assert.ok(reacts[parrier].some((w) => w.name === 'block' && w.t0 === e.t), 'the parrier blocks it');
      seen++;
    }
  }
  assert.ok(seen > 0, `parries seen (${seen})`);
});

test('the pages\' figures: a skill\'s uses by its level and the gap between two, the gear\'s share in it, as the duel builds them', () => {
  let st = G.newGame(1, 'Aster'); G.makeV2(st);
  for (let i = 0; i < 4; i++) st = G.advance(st, { type: 'wait' }).state;
  const b = AM.autoBoutOf(st), k = G.v2KitOf(st);
  for (const v of PV.autoOrderView(st, k.loadout)) {
    const a = b.ren.skills.find((x) => x.id === v.id);
    assert.equal(v.uses, a.uses);
    assert.equal(v.gapS, +(a.cooldown * (b.ren.gfx?.cd ?? 1)).toFixed(1));
    const f = PV.skillFigures(st, v.id, k.levels[v.id]);
    assert.equal(f.uses, AD.AUTO_BRUTE.uses[k.levels[v.id] - 1]);
    assert.equal(f.gapS, v.gapS);
  }
  assert.equal(PV.skillFigures(st, 't4', 3).uses, 3, 'PB-2: 2, 2, 3, 3, 4');
});

test('the first duel\'s lessons: an opening (its fighter, its seconds, the duel\'s numbers) and a clash, once each', () => {
  assert.ok(DT.LESSONS.includes('open') && DT.LESSONS.includes('clash'));
  assert.deepEqual(DT.lessonsOf({ type: 'open', who: 'marek', why: 'opener', dur: 4 }), ['open']);
  assert.deepEqual(DT.lessonsOf({ type: 'clash', who: 'ren', to: 'marek', kind: 'light' }), ['clash']);
  const d = duelOf('orla', 0, 5), D = { ren: d.ren, foe: d.foe, form: d.result.form, names: { ren: 'Ren', marek: 'Orla' } }, R = AU.AUTO_RULES;
  const t = DT.lessonText('open', D, { type: 'open', who: 'marek', why: 'opener', dur: 4 });
  for (const n of [R.opener, R.interrupt.open, R.parry.open, R.whiff, Math.round((R.open.dmg - 1) * 100)]) assert.ok(t.includes(String(n)), `${n} in « ${t} »`);
  assert.ok(t.startsWith('Orla'));
  assert.ok(DT.lessonText('clash', D).includes(String(R.clash.w)));
});

test('a parry heard and seen as a big blow guarded where the parrier stands; an interruption and an opening add no sound of their own', () => {
  assert.deepEqual(SC.duelCue({ type: 'parry', who: 'marek', to: 'ren' }), { effect: 'guard', pan: 0.28 });
  const cues = SFX.sfxOf({ type: 'parry', who: 'ren', to: 'marek' }, 5);
  assert.deepEqual(cues.map((c) => [c.id, c.duck]), [['guardHeavy', 'guard']], 'the guard of a big blow');
  assert.ok(cues[0].pan < 0, 'where Ren stands');
  assert.equal(SC.duelCue({ type: 'interrupt', who: 'ren', by: 'marek' }), null);
  assert.equal(SC.duelCue({ type: 'open', who: 'ren', why: 'opener', dur: 4 }), null);
  assert.deepEqual(SFX.sfxOf({ type: 'interrupt', who: 'ren', by: 'marek' }, 5), []);
  assert.deepEqual(SFX.sfxOf({ type: 'open', who: 'ren', why: 'opener', dur: 4 }, 5), []);
});
