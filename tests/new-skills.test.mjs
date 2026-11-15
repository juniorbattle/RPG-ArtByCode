// The new skills (journal Passe SK4; the operator's sheet https://claude.ai/artifact/FJdfCEs4igBxqgtVeQj5pV, twelve of twelve at the recommendation): NC-1 five skills
// taught by the town fighters, NC-2 the Leg Sweep set aside (Corra teaches nothing), NC-3 to NC-7 their numbers, NC-8 who teaches and when, NC-9 the rank rule (« finir »
// an ultimate), NC-10 the words, the borrowed effects and sounds, NC-11 Master Corvin's lessons for levels 4 and 5, NC-12 the curious player's same-rank rule. Each rule
// against an oracle written from the decisions, on hand-made fighters.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const AD = await load('/src/combat/autoData.ts'), AU = await load('/src/combat/auto.ts'), SB = await load('/src/combat/skillbook.ts'), K = await load('/src/combat/skills.ts');
const ST = await load('/src/combat/stats.ts'), S = await load('/src/simulation/v2skills.ts'), P = await load('/src/simulation/preview.ts'), N = await load('/src/combat/autoNotes.ts');
const H = await load('/src/arena/AutoHud.ts'), C = await load('/src/arena/cineRule.ts'), SFX = await load('/src/audio/sfx.ts'), R = await load('/src/arena/fx/fxRecipes.ts');
const LAB = await load('/src/tournament/lab.ts');
const T = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR } = await load('/src/narrative/text/fr.ts');

const SHEET = 'https://claude.ai/artifact/FJdfCEs4igBxqgtVeQj5pV';
const FIVE = { n_grace: ['offensive', 'ultimate', 'finisher', 'lucan', 't4'], n_disarm: ['offensive', 'technique', 'strip', 'aldric', 'k_feint'], n_sidestep: ['defensive', 'technique', 'evade', 'piers', 'd1'], n_wind: ['support', 'technique', 'recover', 'ambrose', 's1'], n_wrist: ['offensive', 'technique', 'sap', 'kell', 't1'] };
const v2 = () => G.makeV2(G.namedState('day1-morning'));
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const refused = (st, a, re) => { const r = G.advance(st, a); assert.equal(r.ok, false, a.type); if (re) assert.match(r.reason, re); };
const inFrench = (f) => { T.useLanguage('fr', FR); try { return f(); } finally { T.useLanguage('en'); } };
const joined = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r?\n\s*(\*|\/\/)\s*/g, ' ');

// hand-made fighters (tests/combat-auto.test.mjs): one light attack, a heavy blow that never goes, the skills given
const A = (o = {}) => ({ id: 'light', kind: 'light', charge: 1, power: 100, gauge: 0, hits: [1], gap: 0.3, ...o });
const noHeavy = () => A({ id: 'heavy', kind: 'heavy', charge: 1e9, power: 1 });
const fighter = (o = {}) => ({ id: 'a', side: 'ren', hp: 1e6, atk: 10, def: 10, end: 10, viv: 10, tempo: 10, taken: 1, light: A(), heavy: noHeavy(), skills: [], brain: 'player', ...o });
const dummy = (o = {}) => fighter({ id: 'b', side: 'foe', light: A({ charge: 1e7, power: 1 }), brain: 'rival', ...o });
const rules = (o = {}) => { const r = JSON.parse(JSON.stringify(AU.AUTO_RULES)); r.form = 0; r.react.dodge = 0; r.react.guard = 0; r.gauge.decay = 0; r.maxT = 200; r.lightCharge = 1; r.hpScale = 1; for (const [k, v] of Object.entries(o)) { if (typeof v === 'object') Object.assign(r[k], v); else r[k] = v; } return r; };
const duel = (a, b, seed, rr, o = {}) => AU.autoDuel(a, b, seed, { rules: rr, log: true, ...o });

test('NC-1 / NC-9 / NC-12: twenty-four skills; the five of the town fighters, each its family, its rank by its role (« finir » an ultimate), its role, its teacher, the effects it borrows', () => {
  for (const [id, [family, rank, role, teacher, looks]] of Object.entries(FIVE)) {
    const info = SB.SKILL_BOOK[id];
    assert.deepEqual([info.family, AD.skillRank(id), AD.AUTO_ROLES[id].role, info.source, info.teacher, SB.looksOf(id)], [family, rank, role, 'challenge', teacher, looks], id);
    assert.equal(SB.taughtBy(teacher), id, `${teacher} teaches ${id}`);
  }
  assert.deepEqual(AD.RANK_OF_ROLE, { exploit: 'ultimate', finisher: 'ultimate', breaker: 'super' });
  // the kit's rule counts the Finishing Blow as an ultimate
  assert.equal(AD.kitRankFault(['t1', 't4', 'n_grace', 'd1']), 'ultimate');
  assert.equal(AD.kitRankFault(['t1', 'n_grace', 'n_sidestep', 'n_wind']), null);
  // NC-2: the Leg Sweep set aside, Corra teaches nothing
  assert.equal(SB.SKILL_BOOK.n_sweep, undefined); assert.equal(SB.taughtBy('corra'), null);
  // the decisions quoted word for word where they are built
  for (const [f, words] of [['src/combat/autoData.ts', ['« Adopter ces cinq, enseignées par les combattants de la ville »', '« Ces nombres »', '« Garder la règle »', SHEET]], ['src/combat/skillbook.ts', ['« L’écarter ; Corra n’enseigne rien »', '« Ainsi »', SHEET]], ['src/simulation/v2skills.ts', ['« (a) Les leçons de maître Corvin, 30 / 60 pièces »', SHEET]]]) {
    const src = joined(f); for (const w of words) assert.ok(src.includes(w), `${f}: ${w}`);
  }
});

test('NC-3 to NC-7: their numbers in the duel, at level 1 (the charge of the skill each is measured against, its gap, its power, its effect)', () => {
  const C1 = AD.AUTO_CADENCE, B = AD.AUTO_BRUTE;
  assert.deepEqual(K.TOWN_CHARGE, { n_grace: [7.65, 6.95, 6.3, 5.7, 5.1], n_disarm: [3.4, 3.2, 3.0, 2.75, 2.55], n_wrist: [3.4, 3.2, 3.0, 2.75, 2.55], n_sidestep: [3.0, 2.8, 2.65, 2.45, 2.3], n_wind: [4.25, 4.0, 3.75, 3.5, 3.25] });
  for (const [id, base] of [['n_grace', 't4'], ['n_disarm', 't1'], ['n_wrist', 't1'], ['n_sidestep', 'd1'], ['n_wind', 's1']]) for (let lv = 1; lv <= 5; lv++) assert.equal(K.chargeTime(id, lv), K.chargeTime(base, lv), `${id} charges as ${base}, level ${lv}`);
  const s = Object.fromEntries(Object.keys(FIVE).map((id) => [id, AD.autoSkill(id, 1)]));
  // the gaps: the Finishing Blow's long (the Thrust's), Disarm's and Sidestep's medium, Second Wind's long, Wrist Strike's fast; two uses at level 1 (PB-2)
  assert.deepEqual(Object.values(s).map((a) => [a.cooldown, a.uses]), [[B.gap.L, 2], [B.gap.M, 2], [B.gap.M, 2], [B.gap.L, 2], [B.gap.R, 2]]);
  // the Finishing Blow: the Thrust's charge and power (×0.6 on the charge as an exploit's), Disarm ×1.5 Wrist Strike's power, Wrist Strike the Flash cut's at full power
  const t4 = AD.autoSkill('t4', 1), t1 = AD.autoSkill('t1', 1);
  assert.ok(Math.abs(s.n_grace.power - t4.power) < 1e-9 && Math.abs(s.n_grace.charge - t4.charge) < 1e-9, 'the Finishing Blow: the Thrust\'s');
  assert.ok(Math.abs(s.n_wrist.power - t1.power) < 1e-9 && Math.abs(s.n_disarm.power - 1.5 * s.n_wrist.power) < 1e-9, 'Disarm ×1.5, Wrist Strike the Flash cut\'s');
  assert.equal(s.n_disarm.unparry, true, 'no parry takes Disarm');
  // Sidestep: a stance in the ward's slot, 6 s at level 1, taking nothing off; Second Wind a support that strikes nothing
  assert.deepEqual(s.n_sidestep.ward, { dur: 2 * C1.effect, dmg: 1, gauge: 1 }); assert.ok(!s.n_wind.power && s.n_wind.boost);
  assert.deepEqual([AU.AUTO_RULES.finisher, AU.AUTO_RULES.recover, AU.AUTO_RULES.sap], [{ hi: 2.5, lo: 1, below: 0.5 }, { share: 0.35 }, { delay: 15 }]);
});

test('NC-3 the Finishing Blow: ×2.5 on a target under half of its health, ×1 else (an ultimate at full strength at least, SK-6)', () => {
  const fin = A({ id: 'fin', kind: 'skill', role: 'finisher', charge: 1, power: 100, uses: 99, cooldown: 0.5 });
  const r = duel(fighter({ skills: [fin], tactic: ['ready'], light: A({ charge: 1e7 }) }), dummy({ hp: 1500 }), 1, rules());
  const hits = r.log.filter((e) => e.act === 'fin' && e.ev === 'hit');
  assert.ok(hits.length >= 6);
  for (const e of hits) { const before = e.hp + e.dmg; assert.equal(e.dmg, before / 1500 < 0.5 ? 250 : 100, `at ${before}`); }
  assert.ok(hits.some((e) => e.dmg === 250) && hits.some((e) => e.dmg === 100));
});

test('NC-4 Disarm: its blow lifts the target\'s protection, quickening and load, and no parry takes it', () => {
  // a protection halving every blow, up long: the light attacks halved until Disarm lands, then whole
  const ward = A({ id: 'wd', kind: 'skill', role: 'ward', charge: 0.2, uses: 1, ward: { dur: 100, dmg: 0.5, gauge: 0.5 } });
  const strip = A({ id: 'dis', kind: 'skill', role: 'strip', charge: 6, power: 10, uses: 1, unparry: true });
  const r = duel(fighter({ skills: [strip], tactic: ['ready'], light: A({ charge: 0.5 }) }), dummy({ skills: [ward], tactic: ['ready'] }), 2, rules({ maxT: 20 }));
  const at = r.log.find((e) => e.ev === 'strip');
  assert.ok(at && at.who === 'a' && at.act === 'dis', 'Disarm told');
  const lights = r.log.filter((e) => e.who === 'a' && e.act === 'light' && e.ev === 'hit');
  assert.ok(lights.filter((e) => e.t < at.t - 1e-9 && e.t > 0.3).every((e) => e.dmg === 50), 'halved under the protection');
  assert.ok(lights.filter((e) => e.t > at.t + 1e-9).every((e) => e.dmg === 100) && lights.some((e) => e.t > at.t), 'whole once it is lifted');
  // a parry stance up: a big blow would be parried, Disarm is not, and it lifts the stance
  const parry = A({ id: 'pa', kind: 'skill', role: 'parry', charge: 0.2, uses: 1, ward: { dur: 30, dmg: 0.05, gauge: 0.5 } });
  const r2 = duel(fighter({ skills: [strip], tactic: ['ready'], light: A({ charge: 1e7 }) }), dummy({ skills: [parry], tactic: ['ready'] }), 3, rules({ maxT: 20 }));
  assert.ok(!r2.log.some((e) => e.ev === 'parry'), 'not parried'); assert.ok(r2.log.some((e) => e.ev === 'hit' && e.act === 'dis') && r2.log.some((e) => e.ev === 'strip'));
  // a quickening and a load lifted: nothing up, nothing told
  const r3 = duel(fighter({ skills: [strip], tactic: ['ready'], light: A({ charge: 1e7 }) }), dummy(), 4, rules({ maxT: 20 }));
  assert.ok(r3.log.some((e) => e.act === 'dis' && e.ev === 'hit') && !r3.log.some((e) => e.ev === 'strip'), 'nothing to lift: no word');
});

test('NC-5 Sidestep: in its stance every blow that can be dodged is dodged, even while charging; an undodgeable one lands; no guard while charging', () => {
  const side = A({ id: 'ss', kind: 'skill', role: 'evade', charge: 0.2, uses: 1, ward: { dur: 50, dmg: 1, gauge: 1 } });
  // the defender raises the stance, then charges a big skill for ever (exposed); the reactions off: only the stance dodges
  const big = A({ id: 'big', kind: 'skill', charge: 1e4, power: 1, uses: 1 });
  const r = duel(fighter({ light: A({ charge: 1 }) }), dummy({ skills: [side, big], tactic: ['ready', 'ready'] }), 5, rules({ maxT: 40, react: { guard: 1, cap: 1 } }));
  const blow = (e) => e.who === 'a' && e.act === 'light' && ['hit', 'guarded', 'dodged'].includes(e.ev);
  const up = r.log.find((e) => e.ev === 'ward' && e.act === 'ss'), lights = r.log.filter((e) => blow(e) && e.t > up.t + 1e-9 && e.t < up.t + 50);
  assert.ok(lights.length >= 5 && lights.every((e) => e.ev === 'dodged'), 'every light blow dodged, the defender charging');
  // an undodgeable blow in the stance, the defender charging: neither dodged nor guarded (exposed)
  const r2 = duel(fighter({ light: A({ charge: 1, undodge: true }) }), dummy({ skills: [side, big], tactic: ['ready', 'ready'] }), 6, rules({ maxT: 20, react: { guard: 1, cap: 1 } }));
  const up2 = r2.log.find((e) => e.ev === 'ward' && e.act === 'ss'), r2b = r2.log.filter((e) => blow(e) && e.t > up2.t + 1e-9);
  assert.ok(r2b.length >= 5 && r2b.every((e) => e.ev === 'hit'), 'an undodgeable blow lands, and no guard while charging');
});

test('NC-6 Second Wind: one\'s own gauge emptied by 35 %', () => {
  const rec = A({ id: 'sw', kind: 'skill', role: 'recover', charge: 6, uses: 1, boost: { dur: 1, dmg: 1, gauge: 1 } });
  const r = duel(fighter({ skills: [rec], tactic: ['ready'], light: A({ charge: 1e7 }) }), dummy({ light: A({ charge: 0.5, power: 1, gauge: 1 }) }), 7, rules({ maxT: 10 }), { trace: true });
  const i = r.log.findIndex((e) => e.ev === 'boost' && e.act === 'sw'), before = r.log.slice(0, i).reverse().find((e) => e.s);
  assert.ok(before.s[0] > 10, 'a gauge filled first');
  assert.ok(Math.abs(r.log[i].s[0] - before.s[0] * 0.65) < 0.02, `${before.s[0]} → ${r.log[i].s[0]}`);
});

test('NC-7 Wrist Strike: when it lands unguarded, the target\'s skills and heavy blow wait 15 s; guarded, nothing', () => {
  const sap = A({ id: 'wr', kind: 'skill', role: 'sap', charge: 5, power: 10, uses: 1 });
  const bs = A({ id: 'bs', kind: 'skill', charge: 0.5, power: 1, uses: 99, cooldown: 1.5 });
  const r = duel(fighter({ skills: [sap], tactic: ['ready'], light: A({ charge: 1e7 }) }), dummy({ skills: [bs], tactic: ['ready'], light: A({ charge: 0.4, power: 1 }) }), 8, rules({ maxT: 40 }));
  const at = r.log.find((e) => e.ev === 'sap'), charges = r.log.filter((e) => e.who === 'b' && e.ev === 'charge' && e.act === 'bs');
  assert.ok(at && charges.filter((e) => e.t < at.t).length >= 2, 'it struck its skill again and again before');
  const next = charges.find((e) => e.t > at.t + 1e-9);
  assert.ok(next && next.t >= at.t + 15 - 1e-6 && next.t < at.t + 16, `its skill again at ${next?.t}, 15 s after ${at.t}`);
  const g = duel(fighter({ skills: [sap], tactic: ['ready'], light: A({ charge: 1e7 }) }), dummy({ skills: [bs], tactic: ['ready'], light: A({ charge: 0.4, power: 1 }) }), 8, rules({ maxT: 40, react: { guard: 1, cap: 1 } }));
  assert.ok(g.log.some((e) => e.act === 'wr' && e.ev === 'guarded') && !g.log.some((e) => e.ev === 'sap'), 'guarded: no wait');
});

test('NC-8: a town fighter teaches its skill in both phases, learnt then raised a level; Corra teaches nothing', () => {
  const early = v2(), late = structuredClone(early); late.day = SB.SIGNATURE_DAY;
  for (const [id, [, , , teacher]] of Object.entries(FIVE)) { assert.equal(S.challengeSkill(early, teacher), id); assert.equal(S.challengeSkill(late, teacher), id); }
  assert.equal(S.challengeSkill(early, 'corra'), null); assert.equal(S.challengeSkill(late, 'corra'), null);
  const st = v2(); S.learnFromChallenge(st, 'lucan', () => {}); assert.equal(st.v2.kit.levels.n_grace, 1);
  st.day = 7; S.learnFromChallenge(st, 'lucan', () => {}); assert.equal(st.v2.kit.levels.n_grace, 2, 'raised in the second phase');
});

test('NC-11: Master Corvin\'s lessons from day 6, a slot and 30 then 60 coins, a skill drilled to level 3 taken to 4 then 5; refused before, below the cap, at the top, without the coins, at night', () => {
  assert.deepEqual(S.LESSON, { day: 6, price: { 4: 30, 5: 60 } });
  const base = v2(); base.place = 'training'; base.v2.kit.levels.t4 = S.TRAIN_CAP; base.player.coins = 100;
  refused(base, { type: 'lessonSkill', skill: 't4' }, /^Master Corvin teaches beyond level 3 from day 6\.$/);
  let st = structuredClone(base); st.day = 6; st.slot = 'morning';
  refused(st, { type: 'lessonSkill', skill: 't1' }, /^Drill Flash Cut to level 3 on the practice sand first\.$|^Drill .* to level 3 on the practice sand first\.$/);
  const slot = st.slot;
  st = act(st, { type: 'lessonSkill', skill: 't4' });
  assert.deepEqual([st.v2.kit.levels.t4, st.player.coins], [4, 70]); assert.notEqual(st.slot, slot, 'a slot');
  st.slot = 'morning'; st = act(st, { type: 'lessonSkill', skill: 't4' });
  assert.deepEqual([st.v2.kit.levels.t4, st.player.coins], [5, 10]);
  st.slot = 'morning'; refused(st, { type: 'lessonSkill', skill: 't4' }, /is at its highest level\.$/);
  const poor = structuredClone(base); poor.day = 6; poor.player.coins = 29; refused(poor, { type: 'lessonSkill', skill: 't4' }, /^Master Corvin wants 30 coins\.$/);
  const night = structuredClone(base); night.day = 6; night.slot = 'evening'; refused(night, { type: 'lessonSkill', skill: 't4' }, /by day/);
  // offered on the training ground, in Corvin's words, with its price; said in French
  const off = structuredClone(base); off.day = 6;
  const o = G.actions(off).find((x) => x.action.type === 'lessonSkill' && x.action.skill === 't4');
  assert.ok(o?.ok); assert.equal(o.label, `Take Master Corvin's lesson in ${T.skillName('t4')} (to level 4; 30 coins)`);
  assert.match(FR['v2.lesson.label'], /^Prendre la leçon de maître Corvin en \{skill\} \(au niveau \{level\} ; \{price\} pièces\)$/);
  // the page's next level and the guide say the same
  assert.deepEqual(P.nextLevel(off, 't4'), { level: 4, by: 'lesson', price: 30, day: 6 });
  assert.match(EN['ui.skill.lesson'], /^From day \{day\}, Master Corvin's lesson takes it to level \{level\} for \{price\} coins\.$/);
  const g = T.tx('tut.ch.prepare.body', { train: 1, trainHp: 20, base: 300, vigour: 24, sessions: 3, hp: 3.6, wound: 10, anwen: 'Sister Anwen', rehearse: 30, cap: 3, sday: 6, lday: S.LESSON.day, pnext: S.lessonPrice(4), plast: S.lessonPrice(5) });
  assert.match(g, /Drilling stops at level 3; from day 6, Master Corvin's lessons take a skill one level higher for 30 coins, then one more for 60\./);
  assert.match(g, /The town's own fighters, beaten in a challenge, teach you their skill, and raise it by a level when you beat them again from day 6\./);
});

test('NC-10: the words in English and in French, the arena\'s, the borrowed effects and sounds, the Finishing Blow\'s cinematic, the notebook\'s word', () => {
  const names = { n_grace: ['Finishing Blow', 'Coup de grâce'], n_disarm: ['Disarm', 'Désarmement'], n_sidestep: ['Sidestep', 'Pas de côté'], n_wind: ['Second Wind', 'Second souffle'], n_wrist: ['Wrist Strike', 'Coup au poignet'] };
  for (const [id, [en, fr]] of Object.entries(names)) { assert.equal(T.skillName(id), en); assert.equal(inFrench(() => T.skillName(id)), fr); }
  assert.deepEqual(['finisher', 'strip', 'evade', 'recover', 'sap'].map((r) => FR[`ui.role.${r}`]), ['finir', 'désarmer', 'esquiver', 'reprendre son souffle', 'saper']);
  assert.deepEqual([H.AUTO_TEXTS_EN.stripped, H.AUTO_TEXTS_EN.sapped, H.AUTO_TEXTS_FR.stripped, H.AUTO_TEXTS_FR.sapped], ['Disarmed', 'Sapped', 'Désarmé', 'Sapé']);
  // the sound of the skill each borrows (the Thrust's, the Feint's, the Flash cut's; the Rampart's and the Fervour's by their family)
  const hit = (action) => SFX.sfxOf({ type: 'impact', from: 'ren', to: 'marek', action, kind: 'skill', result: 'hit', damage: 300 }, 5)[0].id;
  assert.deepEqual(['n_grace', 'n_disarm', 'n_wrist'].map(hit), ['t4', 'k_feint', 't1']);
  assert.deepEqual([SFX.sfxOf({ type: 'effect', who: 'ren', action: 'n_sidestep', family: 'defensive' }, 5)[0].id, SFX.sfxOf({ type: 'effect', who: 'ren', action: 'n_wind', family: 'support' }, 5)[0].id], ['d1', 's1']);
  assert.equal(R.blowRecipe('n_grace', 'skill', 'ren').element, 'gold', 'the Thrust\'s gold');
  // the Finishing Blow plays its cinematic as every ultimate (NC-3)
  assert.ok(C.CINE_RULE.tiers.find((x) => x.tier === 'ultra').roles.includes('finisher'));
  // the notebook: Ren's gauge broken twice, Second Wind (unless he brings it); a Finishing Blow that failed, as an ultimate's
  const note = (o = {}) => ({ won: false, open: [1, 0], taken: [10, 0, 0], breaks: [2, 0], skills: [], ...o });
  assert.deepEqual(N.adviceOf(note(), { skills: [{ id: 't1', role: 'punish' }] }, undefined, 0, 0), { k: 'broken', n: 2 });
  assert.notEqual(N.adviceOf(note(), { skills: [{ id: 'n_wind', role: 'recover' }] }, undefined, 0, 0).k, 'broken', 'he brings it already');
  assert.equal(N.adviceOf(note({ skills: [{ id: 'n_grace', used: 2, max: 2, landed: 1, clean: 1, void: 1, dmg: 0 }] }), { skills: [{ id: 'n_grace', role: 'finisher' }] }, undefined, 0, 0).k, 'ultMiss');
  assert.match(FR['advice.broken'], /^Votre jauge a rompu \{n\} fois : le Second souffle, qu’enseigne frère Ambrose, la vide ; une protection la ralentit\.$/);
});

test('NC-12: the curious player brings a skill learnt in place of a start skill of its family and its rank only (never a technique in the Thrust\'s place)', () => {
  const st = v2(); st.day = 7; st.place = 'training';
  st.v2.kit.loadout = ['m_shoulder', 't4', 'd1', 's1']; Object.assign(st.v2.kit.levels, { m_shoulder: 1, n_disarm: 1 });
  const a = LAB.POLICIES.curious.choose(st);
  assert.ok(!(a.type === 'setLoadout' && a.skills.includes('n_disarm') && !a.skills.includes('t4')), 'the Thrust kept');
  const s2 = v2(); Object.assign(s2.v2.kit.levels, { n_grace: 1 });
  const b = LAB.POLICIES.curious.choose(s2);
  assert.deepEqual(b, { type: 'setLoadout', skills: ['t1', 'n_grace', 'd1', 's1'] }, 'an ultimate in the Thrust\'s place');
});
