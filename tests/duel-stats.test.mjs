// The fighters' stats (the operator's DB7 sheet of 2026-11-09, decisions A3 recorded word for word in journal Passe DB8; briefs/combat-system.md § 19):
// DB7-1 « Ajouter la Vivacité (vitesse de charge) », DB7-2 « Des points, le reste gardé », DB7-3 « +1 à la stat choisie, pour le prochain combat »,
// DB7-4 « +12 PV par victoire », DB7-5 « Ces fiches », DB7-6 « Tableau ×1,3 et stats ; finale ×2,5 et stats », DB7-7 « Équipement, fiche de match et
// compétences »; with the DB5 sheet's rules (journal Passe DB6: the rivals' guard 90 % and the guard at −80 %, a cooldown of 5 × the charge time, the break
// 10 s ×2 on a gauge of 70) and journal Passe DB9's tuning (the light attack's gauge, a guarded blow's share, the rivals' blows recalibrated). Oracles
// written from the decisions and the sheet's tables, not read from the code.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load } from './load.mjs';

const ST = await load('/src/combat/stats.ts');
const V = await load('/src/combat/v2duel.ts');
const D = await load('/src/combat/dynamic.ts');
const C = await load('/src/combat/charge.ts');
const K = await load('/src/combat/skills.ts');
const M = await load('/src/combat/match.ts');
const A = await load('/src/arena/v2Arena.ts');
const G = await load('/src/simulation/index.ts');
const VG = await load('/src/simulation/v2gear.ts');
const GE = await load('/src/simulation/gear.ts');
const P = await load('/src/simulation/preview.ts');
const AD = await load('/src/combat/autoData.ts');
const T = await load('/src/simulation/v2town.ts');
const { GENERICS } = await load('/src/narrative/generics.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const ROOT = path.resolve(import.meta.dirname, '..');
const src = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r\n/g, '\n');

const k = (a, d) => (2 * a) / (a + d);
const duel = (foe = 'orla', o = {}) => V.v2DuelData(foe, { seed: 7, playerName: 'Ren', opponentName: foe, ...o });
const WON = { winner: 'player', playerHp: 100, playerMaxHp: 150, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' };

test('the sheets of the DB7 sheet: Ren at the start, the seven rivals, their growth by stage, the vigour, the powers at equal stats', () => {
  // DB11-6 « Ren 300, tout ce qui touche à ses PV ×2 et les coups des rivaux ×2 » (journal Passe DB12; 150 and +12 before); DB11-5: a session for health, +20
  assert.deepEqual(ST.REN_BASE, { hp: 300, atk: 10, def: 10, end: 10, viv: 10 });
  assert.equal(ST.VIGOUR_HP, 24); assert.equal(ST.TRAIN_POINT, 1); assert.equal(ST.TRAIN_HP, 20);
  assert.deepEqual(ST.TRAINED_STATS, ['atk', 'def', 'end', 'viv', 'hp']); assert.deepEqual(ST.TRAINED_STATS.map(ST.trainGain), [1, 1, 1, 1, 20]);
  // DB7-5 « Ces fiches » (hp, Attack, Defence, Endurance); the Speed its kit's (journal Passe DB8) less 3 in the pool (DB11-2 « Vivacité −3 en poule, celle de la fiche ensuite »)
  assert.deepEqual(ST.KIT_VIV, { vessa: 13, tobin: 9, cassius: 10, orla: 11, ilse: 10, marek: 10, rhosk: 8 }); assert.equal(ST.POOL_SLOW, 3);
  assert.deepEqual(ST.RIVAL_SHEETS, {
    vessa: { hp: 500, atk: 7, def: 8, end: 7, viv: 10 }, tobin: { hp: 520, atk: 9, def: 8, end: 8, viv: 6 }, cassius: { hp: 560, atk: 11, def: 10, end: 9, viv: 7 },
    orla: { hp: 600, atk: 12, def: 11, end: 11, viv: 8 }, ilse: { hp: 620, atk: 10, def: 12, end: 11, viv: 7 }, marek: { hp: 650, atk: 13, def: 13, end: 12, viv: 7 },
    rhosk: { hp: 700, atk: 12, def: 10, end: 13, viv: 5 },
  });
  for (const r of Object.values(ST.RIVAL_SHEETS)) assert.ok(r.hp >= 500 && r.hp <= 700, 'DB4-4: 500 to 700');
  // DB7-6: the bracket +3 / +3 / +2, the final +1 / +3 / +2; the health x 1.7 and x 3.5 since DB11-7's recalibration on the DB7 sheet's curve (journal Passe DB13;
  // x 1.3 and x 2.5 before); the Speed given back from the bracket (DB11-2)
  assert.deepEqual(ST.rivalSheet('marek', 1), { hp: 1105, atk: 16, def: 16, end: 14, viv: 10 });
  assert.deepEqual(ST.rivalSheet('marek', 2), { hp: 2275, atk: 14, def: 16, end: 14, viv: 10 });
  assert.deepEqual([ST.stageOf(2), ST.stageOf(5), ST.stageOf(6), ST.stageOf(8), ST.stageOf(10, true), ST.stageOf(9)], [0, 0, 1, 1, 2, 1]);
  // the light attack 1 % of a bar of 600 (DB5-5), the Thrust 20 % (DB5-1); a skill by its charge time at level 1, its level's power over it
  assert.deepEqual([ST.POWER.light, ST.POWER.thrust], [6, 120]);
  assert.equal(ST.skillPower('t4', 1), 120); assert.equal(+ST.skillPower('t4', 5).toFixed(6), 168);
  assert.equal(+ST.skillPower('t1', 1).toFixed(6), +(120 * K.chargeTime('t1', 1) / K.chargeTime('t4', 1)).toFixed(6));
  // the formula: x1 at equal stats, x4/3 at twice the Defence, x2/3 at half; never zero
  assert.equal(ST.hitFactor(10, 10), 1); assert.equal(ST.hitFactor(20, 10), 4 / 3); assert.equal(ST.hitFactor(5, 10), 2 / 3); assert.ok(ST.hitFactor(1, 100) > 0);
  assert.equal(ST.gaugeFactor(10), 1); assert.equal(ST.gaugeFactor(12), 10 / 12); assert.equal(ST.speedFactor(10), 1); assert.equal(ST.speedFactor(12.5), 0.8);
});

test('a duel\'s numbers come from both fighters\' stats: health, every blow by the formula, the gauge by the target\'s Endurance, the charge by Ren\'s Speed', () => {
  const R = { hp: 180, atk: 13.5, def: 12, end: 11, viv: 12.5 }, d = duel('orla', { ren: R }), O = ST.RIVAL_SHEETS.orla, a = d.data.actions;
  assert.equal(d.data.fighters.ren.maxHp, 180); assert.equal(d.data.fighters.marek.maxHp, 600);
  assert.equal(a.light.damage, Math.round(6 * k(R.atk, O.def)));
  assert.equal(a.t4.damage, Math.round(120 * k(R.atk, O.def)));
  assert.equal(a.t1.damage, Math.round(ST.skillPower('t1', 1) * k(R.atk, O.def)));
  assert.equal(a.m_slash.damage, Math.round(ST.POWER.foeLight * k(O.atk, R.def)));
  assert.equal(a.m_heavy.damage, Math.round(ST.POWER.foeHeavy * k(O.atk, R.def)));
  const foeOff = d.data.ai.skills.list.map((x) => a[x.id]).find((x) => x.family === 'offensive');
  assert.equal(foeOff.damage, Math.round(ST.POWER.foeSkill * k(O.atk, R.def)));
  // the gauge: the light attack 0.5 (journal Passe DB9) by Orla's Endurance 11, her light blow 6 by Ren's 11
  assert.equal(a.light.resist, +(0.5 * 10 / O.end).toFixed(2)); assert.equal(a.m_slash.resist, +(6 * 10 / R.end).toFixed(2));
  // the charge: each skill's time at its level x 10 / Speed
  for (const t of d.tiers.slice(1)) assert.equal(t.at, +(K.chargeTime(t.id, 1) * 10 / R.viv).toFixed(3), t.id);
  // a level raises a skill's power: the Thrust at level 3
  const l3 = duel('orla', { ren: R, kit: { loadout: ['t1', 't4', 'd1', 's1'], levels: { t1: 1, t4: 3, d1: 1, s1: 1, heavy: 1 } } });
  assert.equal(l3.data.actions.t4.damage, Math.round(120 * 1.2 * k(R.atk, O.def)));
  // the stage: Marek in the final
  assert.equal(duel('marek', { stage: 2 }).data.fighters.marek.maxHp, 2275);
  // a state's shares on top: an injury on Ren's health, a rival's preparation on its blows, the night's tampering
  const hurt = duel('orla', { ren: R, player: { hp: 0.8 }, enemy: { hp: 0.9, damage: 1.1 }, gear: { taken: 1.15, gauge: 1, charge: 1, effect: 1 } });
  assert.equal(hurt.data.fighters.ren.maxHp, 144); assert.equal(hurt.data.fighters.marek.maxHp, 540);
  assert.equal(hurt.data.actions.m_heavy.damage, Math.round(ST.POWER.foeHeavy * k(O.atk, R.def) * 1.1 * 1.15));
});

test('a rival\'s tempo follows its Speed against its kit\'s (KIT_VIV): slower in the pool (DB11-2), its kit\'s own from the bracket; its wind-up, gaps and pauses scaled when it differs', () => {
  const kit = (st) => duel('vessa', { stage: st, foeSheet: { ...ST.rivalSheet('vessa', st), viv: ST.KIT_VIV.vessa } });
  for (const st of [1, 2]) assert.equal(JSON.stringify(duel('vessa', { stage: st }).data.restByLevel), JSON.stringify(kit(st).data.restByLevel), `stage ${st}: the kit's tempo`);
  assert.deepEqual([0, 1, 2].map((st) => ST.rivalSheet('vessa', st).viv), [10, 13, 13]);
  for (const [id, v] of Object.entries(ST.KIT_VIV)) assert.equal(ST.RIVAL_SHEETS[id].viv, v - ST.POOL_SLOW, id);
  // the pool: Vessa at 10 against her kit's 13, every time x 1.3 (her pauses 3.5-6.5 s become 4.55-8.45 s)
  const base = kit(0), pool = duel('vessa'), lv = base.data.ai.level, p = 13 / 10;
  assert.deepEqual(pool.data.restByLevel[lv], base.data.restByLevel[lv].map((x) => +(x * p).toFixed(3)));
  assert.deepEqual(pool.data.restByLevel[lv], [4.55, 8.45]);
  assert.equal(pool.data.actions.m_slash.impactAt, +(base.data.actions.m_slash.impactAt * p).toFixed(3));
  assert.deepEqual(pool.data.ai.comboGap, base.data.ai.comboGap.map((x) => +(x * p).toFixed(3)));
  // a faster one: its times shorter
  const fast = duel('vessa', { foeSheet: { ...ST.RIVAL_SHEETS.vessa, viv: 16.25 } }), f = 13 / 16.25;
  assert.deepEqual(fast.data.restByLevel[lv], base.data.restByLevel[lv].map((x) => +(x * f).toFixed(3)));
});

test('the DB5 rules in every version 2 duel: the rivals guard 90 % (their dodge kept), the guard takes 80 % off, a gauge of 70 and its pace, the break 10 s x2, a guarded blow x2 to the guarder\'s gauge, a cooldown on each skill', () => {
  for (const foe of Object.keys(ST.RIVAL_SHEETS)) {
    const d = duel(foe).data;
    assert.equal(d.ai.defense.guard, 0.9, foe); assert.equal(d.ai.defense.dodge, V.V2_FOES[foe].defense?.dodge ?? 0, foe);
    assert.equal(d.guard.reduce, 0.8);
    // the gauge empties half as fast since DB11-1 « Compétences ×1,5, se vide deux fois moins vite »
    assert.deepEqual([d.resist.max, d.resist.decay, d.resist.breakStun, d.resist.breakDamage, d.resist.guard], [70, +(D.DYNAMIC_DATA.resist.decay * 0.7 * 0.5).toFixed(3), 10, 2, 2]);
    for (const id of ['heavy', 't1', 't2', 't3', 't4', 'd1', 's1']) assert.equal(d.actions[id].cooldown, +(5 * K.chargeTime(id, 1)).toFixed(3), `${foe} ${id}`);
    assert.equal(d.actions.light.cooldown, undefined, 'the light attack has none');
  }
  // the old scheme for comparison (input=keys) has the same rules; today's dynamic duel (C2) and today's game none of them
  assert.equal(duel('marek', { input: 'keys' }).data.actions.t4.cooldown, +(5 * K.chargeTime('t4', 1)).toFixed(3));
  for (const a of Object.values(D.DYNAMIC_DATA.actions)) assert.equal(a.cooldown, undefined);
  assert.deepEqual([D.DYNAMIC_DATA.resist.max, D.DYNAMIC_DATA.resist.guard, D.DYNAMIC_DATA.guard.reduce], [100, 1, 0.6]);
});

test('the cooldown (DB5-3 « 5 × le temps de charge », A3): a skill that left cannot leave again until it is over, a cancelled one gives it back; the charge and the HUD read it', () => {
  const d = duel('marek'), c = new C.ChargedDuel(d.data, d.tiers), sim = c.sim;
  sim.f.marek.aiWait = 1e9; sim.f.ren.ap = 5;
  assert.notEqual(sim.command('ren', 't1'), false);
  const cd = d.data.actions.t1.cooldown;
  assert.equal(sim.ready('ren', 't1'), false); assert.ok(Math.abs(sim.cooldownLeft('ren', 't1') - cd) < 1e-9);
  for (let i = 0; i < 120; i++) { sim.step(); sim.drain(); }
  sim.f.ren.ap = 5; sim.drain();
  assert.equal(sim.command('ren', 't1'), false); assert.ok(sim.drain().some((e) => e.type === 'commandDenied' && e.why === 'cooldown'));
  // the charge: a tier still cooling does not open, its seconds left in the view and the HUD's model
  const v = c.view(), i = c.tiers.findIndex((t) => t.id === 't1');
  assert.equal(v.open[i], false); assert.ok(v.cool[i] > 0);
  const m = A.chargeHudModel(v);
  assert.equal(m.tiers[i].state, 'cooling'); assert.equal(m.tiers[i].cool, v.cool[i]);
  while (!sim.ready('ren', 't1')) { sim.step(); sim.drain(); }
  sim.f.ren.ap = 5; assert.notEqual(sim.command('ren', 't1'), false, 'ready again');
  // a skill pushed back by the opponent's sequence before it lands (CB-3): its AP and its cooldown given back
  const e = duel('marek'), s2 = new D.DynamicSim(e.data);
  s2.f.marek.aiWait = 1e9; s2.f.ren.ap = 5; s2.command('ren', 't4'); s2.step(); s2.forceSequence(['m_slash']); s2.f.marek.aiWait = 0;
  for (let j = 0; j < 10 && !s2.drain().some((x) => x.type === 'pushed'); j++) s2.step();
  assert.equal(s2.ready('ren', 't4'), true, 'a cancelled skill is ready again');
  // the HUD shows the seconds left
  const hud = src('src/arena/DynamicHud.ts');
  assert.match(hud, /#ah-tiers \.tr\.cooling s\{display:inline\}/); assert.match(hud, /ct\.secs\(cd\)/);
});

test('Ren\'s stats from his state (DB7-2, DB7-3, DB7-4): the gear in points, the whetstone, the forge\'s tiers, the sessions\' stats for the next bout, the vigour', () => {
  const st = G.makeV2(G.namedState('day1-morning'));
  assert.deepEqual(VG.v2Stats(st), ST.REN_BASE);
  // each piece's points (briefs/stats-combattants.md § 2.3; the health x2 since DB11-6), doubled with the penalties since lot 2 of the duel played by the computer
  // (the operator's AC-11 « Doubler les points de l’équipement (décision A3 : change DB7-2) », journal Passe AC4, applied in journal Passe LC3); the AP and the effects kept
  const POINTS = {
    'imported-blade': { atk: 4 }, 'duelist-sabre': { atk: 3, viv: 2 }, 'padded-jack': { def: 2 }, 'mail-shirt': { def: 6, viv: -1 }, 'dock-leathers': { def: 3, end: 2 },
    'knight-hauberk': { def: 7, viv: -1 }, 'iron-ring': { end: 4 }, 'swift-boots': { viv: 2 }, 'docker-wrap': { hp: 36 }, 'river-pearl': { end: 3, hp: 20 },
    'pilgrim-medal': { hp: 32, effect: 1.15 }, 'champion-token': { ap: 1, end: 1 }, 'lucky-ribbon': { ap: 1 }, 'fervour-charm': { effect: 1.3 }, whetstone: { atk: 1 },
  };
  for (const [id, fx] of Object.entries(POINTS)) assert.deepEqual(GE.GEAR[id].fx, fx, id);
  assert.equal(GE.WEAPON_TIER_ATK, 2);
  const s = structuredClone(st);
  s.v2.gear = { weapon: 'imported-blade', tier: 3, armour: 'dock-leathers', acc: ['iron-ring', 'docker-wrap'], bag: [] };
  s.player.items.push('whetstone'); s.player.training = 2; s.v2.prep = ['viv', 'end']; s.v2.wins = 4;
  assert.deepEqual(VG.v2Stats(s), { hp: 300 + 4 * 24 + 36, atk: 10 + 4 + 6 + 1, def: 13, end: 10 + 2 + 4 + 1, viv: 11 });
  // a session given to health (DB11-5): +20 at the next bout; where the health comes from, as the match sheet says it (journal Passe DB13)
  const h = structuredClone(s); h.v2.prep = ['hp', 'end']; h.player.injury = 1;
  assert.equal(VG.v2Stats(h).hp, 300 + 96 + 36 + 20);
  assert.deepEqual(VG.healthParts(h), { base: 300, vigour: 96, gear: 36, train: 20, wound: 452 - Math.round(452 * 0.8), total: Math.round(452 * 0.8) });
  // a session recorded before DB7 counts as Attack (its +5 % damage of before); two at most
  const old = structuredClone(st); old.player.training = 2; delete old.v2.prep;
  assert.equal(VG.v2Stats(old).atk, 12);
  const over = structuredClone(st); over.player.training = 5; over.v2.prep = ['def', 'def', 'def'];
  assert.equal(VG.v2Stats(over).def, 12);
  // what stays a multiplier: the injury's share, the AP, the night's tampering, the effects
  const m = VG.v2Mods(s);
  assert.deepEqual([m.hp, m.damage, m.gauge, m.charge, m.taken], [1, 1, 1, 1, 1]); assert.deepEqual(m.stats, VG.v2Stats(s));
});

test('a training session in a version 2 game: one line per stat, the stat chosen recorded for the next bout and said in the log; emptied by the bout; today\'s game as before', () => {
  let st = G.makeV2(G.namedState('day1-morning')); st.place = 'training';
  const lines = G.actions(st).filter((o) => o.action.type === 'train');
  assert.deepEqual(lines.map((o) => o.action.stat), ['atk', 'def', 'end', 'viv', 'hp']);
  assert.equal(lines[3].label, 'Train: Speed (+1 at your next bout)');
  // DB11-5 « Le dire partout, et une séance « Santé » (+20 PV au prochain combat) »: the health last
  assert.equal(lines[4].label, 'Train: Health (+20 at your next bout)');
  const hp = G.advance(st, { type: 'train', stat: 'hp' }); assert.ok(hp.ok, hp.reason);
  assert.equal(VG.v2Stats(hp.state).hp, 320); assert.ok(hp.state.log.some((e) => e.id === 'train' && /Health \+20 at your next bout/.test(e.text)));
  const r = G.advance(st, { type: 'train', stat: 'viv' }); assert.ok(r.ok, r.reason);
  assert.deepEqual(r.state.v2.prep, ['viv']); assert.equal(VG.v2Stats(r.state).viv, 11);
  assert.ok(r.state.log.some((e) => e.id === 'train' && /Speed \+1 at your next bout/.test(e.text)));
  // sparring with Orla is a session too
  const o = G.actions({ ...r.state, place: 'training' }).filter((x) => x.action.type === 'spar');
  assert.ok(o.length === 0 || o.map((x) => x.action.stat).join() === 'atk,def,end,viv,hp', JSON.stringify(o.map((x) => x.action)));
  // the bout empties the sessions and their stats; a win is one more bout won (DB7-4)
  const b = G.makeV2(G.namedState('day2-afternoon')); b.player.training = 2; b.v2.prep = ['def', 'end']; b.v2.wins = 1;
  const w = G.advance(b, { type: 'fight', outcome: WON }); assert.ok(w.ok, w.reason);
  assert.deepEqual([w.state.player.training, w.state.v2.prep, w.state.v2.wins], [0, [], 2]);
  assert.equal(VG.v2Stats(w.state).hp, 300 + 2 * 24);
  const l = G.advance(b, { type: 'fight', outcome: { ...WON, winner: 'opponent', playerHp: 0, opponentHp: 300, finisher: 'tech' } });
  assert.equal(l.state.v2.wins, 1, 'a defeat adds no vigour');
  // today's game (v2=0): one line, its words and its rule of before
  const d = G.namedState('day1-morning'); d.place = 'forecourt';
  assert.deepEqual(G.actions(d).filter((x) => x.action.type === 'train').map((x) => [x.action.stat, x.label]), [[undefined, EN['train.label']]]);
});

test('a challenge won is a bout won (DB7-4); a generic fighter\'s sheet is its rival\'s, lower, at the day\'s stage', () => {
  const st = G.makeV2(G.namedState('day1-morning')); st.v2.challenge = { who: 'aldric', day: 1, stake: 'coins' }; st.v2.wins = 0;
  T.applyChallenge(st, WON, () => {}); assert.equal(st.v2.wins, 1);
  const g = GENERICS.aldric, sh = { ...ST.borrowedSheet(g.profile, g) };
  assert.deepEqual(sh, { ...ST.rivalSheet('ilse'), hp: 620 * 0.9, atk: +(10 * 0.95).toFixed(2) });
  assert.deepEqual(M.foeSheetOf({ id: 'aldric', name: '', profile: 'ilse', mods: {} }, 1), ST.borrowedSheet('ilse', g, 1));
  // its duel: the sheet's health, its shares not counted twice
  const day7 = G.makeV2(G.namedState('day1-morning')); day7.day = 7; day7.v2.challenge = { who: 'aldric', day: 7, stake: 'coins' };
  const c = M.challengeSheetFor(day7), x = M.v2SheetData(c, undefined, G.v2KitOf(day7), VG.v2Mods(day7));
  assert.equal(c.stage, 1); assert.equal(x.data.fighters.marek.maxHp, Math.round(620 * 1.7 * 0.9));
});

test('the pages read the stats (DB7-7): the gear page Ren\'s five, the skills page each skill\'s power, the match sheet the opponent\'s, in both languages', () => {
  const st = G.makeV2(G.namedState('day2-afternoon')), n = P.duelStats(st), x = VG.v2Stats(st);
  assert.deepEqual([n.atk, n.def, n.end, n.viv], [x.atk, x.def, x.end, x.viv]);
  assert.deepEqual(P.STAT_IDS.slice(0, 5), ['hp', 'atk', 'def', 'end', 'viv']);
  // the duel played by the computer's power since lot 2 (journal Passe LC3): its own table (src/combat/autoData.ts)
  for (let lv = 1; lv <= 5; lv++) assert.equal(P.skillFigures(st, 't4', lv).power, +AD.autoPower('t4', lv).toFixed(1));
  assert.equal(P.skillFigures(st, 'd1', 1).power, 0, 'a ward has no power');
  // the match sheet: both fighters as the duel builds them (src/combat/autoMatch.ts autoBoutOf), side by side
  assert.match(src('src/ui/townUi.ts'), /const b = autoBoutOf\(s\), vs = b \? this\.autoVsHtml\(b\.ren, b\.foe, autoForms\(b\), r\.name\) : '';/);
  const FR = src('src/narrative/text/fr-texts.ts');
  for (const key of ['auto.sheet.hp', 'auto.sheet.form', 'auto.sheet.dodge', 'auto.sheet.guard', 'auto.sheet.prep', 'ui.skill.power', 'stat.atk', 'stat.def', 'stat.end', 'stat.viv', 'v2.train.stat', 'v2.spar.stat']) { assert.ok(EN[key], key); assert.match(FR, new RegExp(`"${key.replace(/\./g, '\\.')}": `), key); }
  assert.equal(EN['stat.viv'], 'Speed'); assert.match(FR, /"stat\.viv": "Vivacité"/);
});

test('the balance measured (journal Passes DB9 / DB10): the rivals\' blows at the DB7 sheet\'s strength, a spammer who guards every sequence loses to most rivals', () => {
  // the DB7 sheet's own strength (the operator's « The DB7 sheet's curve », journal Passe DB10), x2 with Ren's health since DB11-6
  assert.deepEqual([ST.POWER.foeLight, ST.POWER.foeHeavy, ST.POWER.foeSkill], [11.2, 33.6, 50.4]);
  assert.deepEqual([V.V2_LIGHT_GAUGE, V.V2_GUARD_GAUGE], [0.5, 2]);
  // the spammer: taps whenever free outside the opponent's sequences, holds the guard through every sequence, dodges the heavy blows 3 times in 5
  let wins = 0;
  for (const foe of ['orla', 'marek', 'vessa', 'ilse']) for (let i = 1; i <= 3; i++) {
    const d = V.v2DuelData(foe, { seed: 3000 + i, playerName: 'Ren', opponentName: foe }), c = new C.ChargedDuel(d.data, d.tiers);
    let down = false, r = 7 + i;
    const rnd = () => { r = (r * 1103515245 + 12345) % 2147483648; return r / 2147483648; };
    while (!c.over && c.t < 900) {
      const inc = c.incoming();
      if (inc && inc.windowOpen && inc.kind !== 'light' && rnd() < 0.6) c.react('ren', 'dodge');
      c.setGuard('ren', c.sim.inSequence());
      if (down) { c.attack(false); down = false; } else if (!c.sim.inSequence() && c.sim.f.ren.state === 'idle') { c.attack(true); down = true; }
      c.step(); c.drain();
    }
    if (c.sim.f.marek.state === 'down') wins++;
  }
  assert.ok(wins <= 1, `the guarding spammer won ${wins} of 12`);
});
