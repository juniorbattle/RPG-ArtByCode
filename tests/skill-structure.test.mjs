// The skills' structure (journal Passe SK2; the operator's sheet https://claude.ai/artifact/2KKiD7u2rzxtWc6NE9CfVX, thirteen of thirteen at the recommendation): SK-1
// three labels a skill (its family, its rank by its role, its role), SK-2 four places with one ultimate and one super at most, SK-5 an ultimate's cinematic every time it
// lands in full (tests/cinematics.test.mjs), SK-6 an ultimate at full strength at least, SK-7 the support or defence of the first day's three before day 6 and every
// rival's signature attack from it, SK-8 the signatures' numbers, SK-10 Breach and only a breaker heavier on the gauge, SK-11 the words, SK-12 nineteen skills; the
// operator's note on SK-6 (a failed ultimate: no cinematic, said over its striker and in the notebook). Oracles written from the decisions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const G = await load('/src/simulation/index.ts');
const AD = await load('/src/combat/autoData.ts'), AU = await load('/src/combat/auto.ts'), SB = await load('/src/combat/skillbook.ts'), K = await load('/src/combat/skills.ts');
const S = await load('/src/simulation/v2skills.ts'), VT = await load('/src/simulation/v2town.ts'), P = await load('/src/simulation/preview.ts'), N = await load('/src/combat/autoNotes.ts');
const H = await load('/src/arena/AutoHud.ts');
const T = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR } = await load('/src/narrative/text/fr.ts');

const RIVALS = ['vessa', 'tobin', 'cassius', 'orla', 'ilse', 'marek', 'rhosk'];
const v2 = (name = 'day1-morning') => G.makeV2(G.namedState(name));
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r.state; };
const refused = (st, a, re) => { const r = G.advance(st, a); assert.equal(r.ok, false, a.type); if (re) assert.match(r.reason, re); };
const inFrench = (f) => { T.useLanguage('fr', FR); try { return f(); } finally { T.useLanguage('en'); } };
const SHEET = 'https://claude.ai/artifact/2KKiD7u2rzxtWc6NE9CfVX';

test('SK-1 / SK-12: nineteen skills, twenty-four since the town fighters\' five (NC-1, journal Passe SK4), each its family, its rank by its role, its role; four ultimates and three supers, a defence and a support always a technique', () => {
  const ids = Object.keys(SB.SKILL_BOOK).filter((id) => id !== 'heavy');
  assert.equal(ids.length, 24);
  const by = (r) => ids.filter((id) => AD.skillRank(id) === r).sort();
  assert.deepEqual(by('ultimate'), ['m_ironfall', 'm_smite', 'n_grace', 't4']);
  assert.deepEqual(by('super'), ['m_cleave', 'm_wild', 't3']);
  for (const id of ids) {
    const role = AD.AUTO_ROLES[id].role;
    // (NC-9 « Garder la règle »: « finir » donne une ultime)
    assert.equal(AD.skillRank(id), role === 'exploit' || role === 'finisher' ? 'ultimate' : role === 'breaker' ? 'super' : 'technique', id);
    if (SB.SKILL_BOOK[id].family !== 'offensive') assert.equal(AD.skillRank(id), 'technique', `${id}: a defence or a support never strikes`);
  }
  // the decisions quoted word for word where the rank is decided
  const src = fs.readFileSync(path.join(ROOT, 'src/combat/autoData.ts'), 'utf8').replace(/\r?\n\s*(\*|\/\/)\s*/g, ' ');
  for (const w of ['« Adopter ces trois étiquettes »', '« Quatre places : une ultime au plus, une super au plus »', '« Ces nombres »', SHEET]) assert.ok(src.includes(w), w);
});

test('SK-7 / SK-8: each rival\'s signature attack, at its rival\'s numbers (the two ultimates ×1.2 and ×1.4), its levels on the pattern of Ren\'s skill of its role', () => {
  assert.deepEqual(Object.keys(SB.SIGNATURES).sort(), [...RIVALS].sort());
  const PAT = { punish: 't1', pierce: 't2', breaker: 't3', exploit: 't4', opener: 'k_sunder' };
  for (const [foe, id] of Object.entries(SB.SIGNATURES)) {
    const f = AD.AUTO_FOES[foe].skills.find((x) => x.id === id), info = SB.SKILL_BOOK[id], role = AD.AUTO_ROLES[id].role;
    assert.ok(f && f.family === 'offensive', `${id}: ${foe}'s attack`);
    assert.deepEqual([info.family, info.source, info.signature], ['offensive', 'challenge', foe], id);
    const p = K.chargeTime(PAT[role], 1);
    for (let lv = 1; lv <= 5; lv++) assert.equal(K.chargeTime(id, lv), +(Math.round((f.charge * K.chargeTime(PAT[role], lv)) / p / 0.05) * 0.05).toFixed(2), `${id} level ${lv}`);
    // in Ren's hands at level 1 as its rival plays it at the pool (level 1): the same charge, uses, gap, weight on the gauge; the power × the tuning
    const ren = AD.autoSkill(id, 1), riv = AD.autoFoeActions(foe, 0).skills.find((x) => x.id === id), k = { m_ironfall: 1.2, m_smite: 1.4 }[id] ?? 1;
    assert.deepEqual([ren.role, ren.uses, ren.cooldown, ren.gauge, +ren.charge.toFixed(6)], [riv.role, riv.uses, riv.cooldown, riv.gauge, +riv.charge.toFixed(6)], id);
    assert.ok(Math.abs(ren.power - riv.power * k) < 1e-9, `${id}: its power ×${k}`);
  }
});

test('SK-2: one ultimate and one super at most among the four; the match sheet\'s action refuses and says why, in English and in French', () => {
  assert.equal(AD.kitRankFault(['t1', 't4', 'd1', 's1']), null, 'the start kit');
  assert.equal(AD.kitRankFault(['t3', 't4', 'd1', 's1']), null, 'one of each');
  assert.equal(AD.kitRankFault(['t4', 'm_ironfall', 'd1', 's1']), 'ultimate');
  assert.equal(AD.kitRankFault(['t3', 'm_wild', 'd1', 't4']), 'super');
  assert.deepEqual(AD.KIT_RANK_MAX, { ultimate: 1, super: 1 });
  const st = v2();
  for (const id of ['m_ironfall', 't3', 'm_wild']) st.v2.kit.levels[id] = 1;
  refused(st, { type: 'setLoadout', skills: ['t1', 't4', 'm_ironfall', 'd1'] }, /^One ultimate at most among your four\.$/);
  refused(st, { type: 'setLoadout', skills: ['t1', 't3', 'm_wild', 'd1'] }, /^One super at most among your four\.$/);
  const ok = act(st, { type: 'setLoadout', skills: ['t3', 'm_ironfall', 'd1', 's1'] });
  assert.deepEqual(ok.v2.kit.loadout, ['t3', 'm_ironfall', 'd1', 's1']);
  assert.equal(FR['v2.loadout.ultimate'], 'Une ultime au plus parmi vos quatre.'); assert.equal(FR['v2.loadout.super'], 'Une super au plus parmi vos quatre.');
  // the skills page refuses the same, with the same words, and says the rule under each skill
  const page = fs.readFileSync(path.join(ROOT, 'src/ui/skills.ts'), 'utf8');
  assert.match(page, /kitRankFault\(\[\.\.\.chosen, now\]\)/); assert.match(page, /tx\('ui\.skill\.rule'\)/);
});

test('SK-7: before day 6 a challenge teaches the first day\'s three their support or defence; from day 6 every rival its signature, named on the challenge', () => {
  assert.equal(SB.SIGNATURE_DAY, VT.RIVALS_CHALLENGE_DAY, 'the second phase of the challenges');
  const early = v2();
  // (a town fighter teaches its own skill in both phases since journal Passe SK4: tests/new-skills.test.mjs)
  assert.deepEqual(['orla', 'ilse', 'vessa', 'marek', 'aldric', 'corra'].map((w) => S.challengeSkill(early, w)), ['k_cry', 'k_parry', 'k_focus', null, 'n_disarm', null]);
  const late = structuredClone(early); late.day = SB.SIGNATURE_DAY;
  for (const [foe, id] of Object.entries(SB.SIGNATURES)) assert.equal(S.challengeSkill(late, foe), id, foe);
  assert.equal(S.challengeSkill(late, 'aldric'), 'n_disarm', 'a town fighter teaches its own skill in both phases');
  const won = structuredClone(late); assert.equal(S.learnFromChallenge(won, 'marek', () => {}), 'm_ironfall'); assert.equal(won.v2.kit.levels.m_ironfall, 1);
  // the challenge's line names what a win teaches; the line of a fighter who teaches none says the stake alone
  for (const k of ['v2.challenge.labelCoins', 'v2.challenge.labelName']) { assert.match(EN[k], /\{skill\}\)$/); assert.match(FR[k], /\{skill\}\)$/); }
  // the skills a rival out of the title taught before (LATE_TEACHER) are bought or drilled: no one else teaches them
  assert.equal(SB.LATE_TEACHER, undefined);
  for (const id of ['k_iron', 'k_feint', 'k_sunder', 't2']) assert.ok(['buy', 'train'].includes(SB.SKILL_BOOK[id].source), id);
  // a skill is drilled up to the cap and no higher; Master Corvin's lessons beyond it since journal Passe SK4 (NC-11)
  const s = v2(); s.v2.kit.levels.m_smite = 1;
  assert.deepEqual(P.nextLevel(s, 'm_smite'), { level: 2, by: 'drill' }); s.v2.kit.levels.m_smite = S.TRAIN_CAP; assert.equal(P.nextLevel(s, 'm_smite').by, 'lesson');
});

test('SK-6 / SK-10: an ultimate at full strength at least; Breach, Orla\'s shoulder and Marek\'s Iron Fall at an ordinary weight on the gauge, only a breaker heavier', () => {
  assert.deepEqual(AU.AUTO_RULES.exploit, { hi: 2, lo: 1 });
  const plain = 2;
  for (const id of Object.keys(SB.SKILL_BOOK).filter((x) => x !== 'heavy')) {
    const a = AD.autoSkill(id, 1); if (!a.gauge) continue;
    if (a.role === 'breaker') assert.ok(a.gauge > plain, `${id}: a breaker weighs more`); else assert.equal(a.gauge, plain, `${id}: an ordinary weight`);
  }
  for (const foe of RIVALS) for (const a of AD.autoFoeActions(foe, 0).skills) if (a.gauge) { if (a.role === 'breaker') assert.ok(a.gauge > plain, a.id); else assert.equal(a.gauge, plain, `${foe}'s ${a.id}`); }
  assert.deepEqual([EN['skill.k_sunder'], FR['skill.k_sunder']], ['Breach', 'Brèche']);
  for (const k of Object.keys(EN)) { assert.doesNotMatch(EN[k], /\bSunder\b/, k); assert.doesNotMatch(FR[k] ?? '', /\bFracas\b/, k); }
});

test('SK-11: the ranks and the signatures by their names, in English and in French', () => {
  assert.deepEqual(['technique', 'super', 'ultimate'].map((r) => EN[`ui.rank.${r}`]), ['technique', 'super', 'ultimate']);
  assert.deepEqual(['technique', 'super', 'ultimate'].map((r) => FR[`ui.rank.${r}`]), ['technique', 'super', 'ultime']);
  const names = { m_ironfall: ['Iron Fall', 'Chute de Fer'], m_smite: ['Temple Smite', 'Frappe du Temple'], m_wild: ['Wild Swing', 'Coup sauvage'], m_cleave: ['Northern Cleave', 'Taille du Nord'], m_riposte: ['Gilded Riposte', 'Riposte dorée'], m_shoulder: ['Dockside Shoulder', 'Coup d’épaule des docks'], m_lunge: ['Quickblade Lunge', 'Fente de la Lame-Vive'] };
  for (const [id, [en, fr]] of Object.entries(names)) { assert.equal(T.skillName(id), en); assert.equal(inFrench(() => T.skillName(id)), fr); }
  // the guide says the structure, its day the game's
  const prep = T.tx('tut.ch.prepare.body', { train: 1, trainHp: 20, base: 300, vigour: 24, sessions: 3, hp: 3.6, wound: 10, anwen: 'Sister Anwen', rehearse: 30, cap: 3, sday: SB.SIGNATURE_DAY, lday: S.LESSON.day, pnext: S.lessonPrice(4), plast: S.lessonPrice(5) });
  assert.match(prep, /an exploitation or a finishing blow is an ultimate, a breaker a super, every other skill a technique\. Among your four, one ultimate and one super at most\. Before day 6, .*; from day 6, beating a rival out of the title, or one of those three, teaches you their signature attack\./);
});

test('the operator\'s note on SK-6: a failed ultimate plays no cinematic, its use spent; said over its striker, and the notebook\'s advice', () => {
  for (const t of [H.AUTO_TEXTS_EN, H.AUTO_TEXTS_FR]) assert.deepEqual(Object.keys(t.ultMiss).sort(), ['cut', 'dodged', 'guarded', 'lost', 'missed', 'parried']); // (missed: a blindness, journal Passe GP4-2)
  assert.equal(H.AUTO_TEXTS_FR.ultMiss.dodged, 'Ultime esquivée');
  // the notebook: an ultimate dodged, parried, cut or lost in a clash, after a Feint wasted and an exploit landed without an opening
  const ren = { skills: [{ id: 't4', role: 'exploit' }, { id: 't1', role: 'punish' }] };
  const note = (sk) => ({ won: false, open: [1, 0], taken: [10, 0, 0], skills: sk });
  assert.deepEqual(N.adviceOf(note([{ id: 't4', used: 2, max: 2, landed: 1, clean: 1, void: 1, dmg: 0 }, { id: 't1', used: 2, max: 2, landed: 2, clean: 0, void: 0, dmg: 0 }]), ren, undefined, 0, 0), { k: 'ultMiss', skill: 't4', n: 1, of: 2 });
  assert.equal(N.adviceOf(note([{ id: 't4', used: 2, max: 2, landed: 2, clean: 1, void: 0, dmg: 0 }]), ren, undefined, 0, 0).k, 'exploit', 'landed without an opening comes first');
  assert.match(EN['advice.ultMiss'], /^\{skill\}, your ultimate, failed \{n\} of \{of\} times/); assert.match(FR['advice.ultMiss'], /^Votre ultime, \{skill\}, a échoué \{n\} fois sur \{of\}/);
});
