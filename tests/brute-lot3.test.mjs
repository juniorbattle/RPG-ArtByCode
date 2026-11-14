// Lot 3 of « La Brute » (briefs/combat-auto.md § 33.5, the operator's PB-4 « Toutes » and BL1-4 « Au lot 3 : la ville nourrit le build », journal Passe BL3): the
// preparation. What is proved here, in Node:
// - the scouting by tiers: nothing seen, the style (a first watch, or a bout fought), the plan (a second watch, another day), the rumour's kit for the next bout; the
//   lines the match sheet, the board and the notebook read, each skill's « when » against the rivals' own plans (AUTO_STYLES) and their roles' rule;
// - the rehearsal: where and when it is offered, its slot, its thirty duels on seeds of its own (never the real bout's), the shadow by its roles at tier 1 and its
//   own plan at tier 2 — then the very bout to come but its seed —, a win and a loss watched again, stale once the set-up changes, outside the fingerprint;
// - Master Corvin's notebook: each note against the duel's own counts (the damage by source, the openings) and against the arena's replay (the damage in an opening
//   or a break), an exploit on a fighter charging counted clean, the advice's order, the note carried by the result and kept outside the fingerprint, bounded;
// - the sand's lesson: a challenge won raises the first blow of the plan under level 3, nothing when lost, nothing for a reprisal.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const AU = await load('/src/combat/auto.ts');
const AD = await load('/src/combat/autoData.ts');
const AM = await load('/src/combat/autoMatch.ts');
const AN = await load('/src/combat/autoNotes.ts');
const AV = await load('/src/arena/autoView.ts');
const ST = await load('/src/combat/stats.ts');
const G = await load('/src/simulation/index.ts');
const SC = await load('/src/simulation/v2scout.ts');
const PR = await load('/src/simulation/v2prep.ts');
const NO = await load('/src/simulation/v2notes.ts');
const K = await load('/src/simulation/v2skills.ts');
const NB = await load('/src/ui/notebook.ts');
const U = await load('/src/ui/townUi.ts');
const T = await load('/src/narrative/text/index.ts');
const { FR } = await load('/src/narrative/text/fr.ts');
const { RIVALS } = await load('/src/narrative/roster.ts');

const v2 = (name = 'v2-day1-morning') => G.namedState(name);
const act = (st, a) => { const r = G.advance(st, a); assert.ok(r.ok, `${a.type}: ${r.reason}`); return r; };
const opt = (st, pred) => G.actions(st).find((o) => pred(o.action));
const at = (st, day, slot, place) => { const s = structuredClone(st); s.day = day; s.slot = slot; s.place = place; return s; };
const WIN = { winner: 'player', playerHp: 900, playerMaxHp: 2200, opponentHp: 0, opponentMaxHp: 3000, finisher: 'light' };
const LOSS = { winner: 'opponent', playerHp: 0, playerMaxHp: 2200, opponentHp: 900, opponentMaxHp: 3000, finisher: 'light' };
const inFrench = (f) => { T.useLanguage('fr', FR); try { return f(); } finally { T.useLanguage('en'); } };

// ------------------------------------------------------------------------------------------------- the scouting by tiers

test('the scouting by tiers: nothing seen, the style at a first watch or a bout fought, the plan at a second watch another day, the kit by a rumour; today\'s game watches once', () => {
  const s0 = v2();
  const foe = SC.nextBoutOf(s0).foe;
  assert.equal(foe, 'vessa', 'the first bout: Vessa');
  assert.equal(SC.scoutTier(s0, foe), 0);
  let lines = SC.scoutLines(s0, foe);
  assert.deepEqual(lines, [T.tx('scout.unseen', { name: 'Vessa Lark' })]);
  // a first watch: the style (her skills and their roles, her leathers), and how to learn more
  const where = G.PEOPLE?.vessa?.place ?? 'forecourt';
  const w1 = act(at(s0, 1, 'morning', 'forecourt'), { type: 'scout', who: 'vessa' }).state;
  assert.equal(SC.scoutTier(w1, foe), 1);
  lines = SC.scoutLines(w1, foe);
  assert.equal(lines[0], SC.styleText('vessa', 'Vessa Lark'));
  assert.match(lines[0], /Lunge \(punish\)/); assert.match(lines[0], /light leathers/);
  assert.equal(lines.at(-1), T.tx('scout.more', { name: 'Vessa Lark' }));
  // the same day: refused; another day: the plan
  assert.equal(opt(at(w1, 1, 'afternoon', 'forecourt'), (a) => a.type === 'scout' && a.who === 'vessa')?.reason, T.tx('v2.scout.today', { name: 'Vessa Lark' }));
  const w2 = act(at(w1, 2, 'morning', 'forecourt'), { type: 'scout', who: 'vessa' }).state;
  assert.equal(SC.scoutTier(w2, foe), 2);
  assert.ok(SC.scoutLines(w2, foe).includes(SC.planText('vessa', 'Vessa Lark')));
  assert.equal(opt(at(w2, 3, 'morning', 'forecourt'), (a) => a.type === 'scout' && a.who === 'vessa')?.reason, T.tx('v2.scout.knownPlan', { name: 'Vessa Lark' }));
  void where;
  // a bout fought against a rival shows its style
  const fought = structuredClone(s0); const m = fought.tournament.matches.find((x) => x.a === 'player' || x.b === 'player'); m.winner = 'player';
  assert.equal(SC.scoutTier(fought, m.a === 'player' ? m.b : m.a), 1);
  // a rumour of the next opponent: its kit for that bout, the uses each skill has at its stage
  const heard = structuredClone(s0); heard.v2.heard = { vessa: { day: 1, src: 'lio', hp: 'fit', form: 'steady' } };
  assert.ok(SC.kitKnown(heard, 'vessa'));
  assert.ok(SC.scoutLines(heard, 'vessa').includes(SC.kitText('vessa', 'Vessa Lark', 0)));
  assert.match(SC.kitText('vessa', 'Vessa Lark', 0), new RegExp(`${AD.AUTO_BRUTE.uses[0]} uses each`));
  assert.equal(SC.usesAt(2), AD.AUTO_BRUTE.uses[AD.autoRivalLevel(2) - 1]);
  // the match sheet's word and the board's follow (a version 2 game)
  assert.equal(U.foeIntel(w2, 'vessa'), SC.scoutLines(w2, 'vessa').join(' '));
  // today's game: one watch, the old refusal
  const old = G.namedState('day1-morning'); old.place = 'forecourt';
  const o1 = act(old, { type: 'scout', who: 'vessa' }).state;
  assert.equal(opt(at(o1, 1, 'afternoon', 'forecourt'), (a) => a.type === 'scout' && a.who === 'vessa')?.reason, T.tx('scout.known', { name: 'Vessa Lark' }));
});

test('the plan in words: each rival skill\'s moment its own condition (AUTO_STYLES), or its role\'s rule; the style\'s roles the duel\'s', () => {
  const ROLE_WHEN = { exploit: 'scout.role.exploit', punish: 'scout.role.punish', pierce: 'scout.role.pierce', breaker: 'scout.role.breaker', opener: 'scout.role.opener', interrupt: 'scout.role.interrupt', ward: 'scout.role.ward', parry: 'scout.role.parry', haste: 'scout.role.haste', slow: 'scout.role.slow', load: 'scout.role.load' };
  for (const id of Object.keys(AD.AUTO_FOES)) {
    const name = RIVALS[id].name, plan = SC.planText(id, name), style = SC.styleText(id, name);
    for (const s of AD.AUTO_FOES[id].skills) {
      const c = AD.AUTO_STYLES[id].tactic[s.id] ?? 'auto', role = AD.AUTO_ROLES[s.id].role;
      const when = c === 'auto' ? T.tx(ROLE_WHEN[role]) : T.tx(`scout.when.${c}`);
      assert.ok(plan.includes(`${SC.anySkillName(s.id)} ${when}`), `${id} ${s.id}: ${plan}`);
      assert.ok(style.includes(`${SC.anySkillName(s.id)} (${T.tx(`ui.role.${role}`)})`), `${id} ${s.id}: ${style}`);
    }
    if (AD.AUTO_STYLES[id].heavy === 'ready') assert.ok(style.includes(T.tx('auto.style.heavy', { name })));
    // in French too, nothing left unsaid
    inFrench(() => { for (const x of [SC.planText(id, name), SC.styleText(id, name), SC.kitText(id, name, 1)]) assert.ok(!/[{}]/.test(x), x); });
  }
});

// ------------------------------------------------------------------------------------------------- the rehearsal

test('the rehearsal: Master Corvin on the training ground by day, the next opponent seen, a slot; thirty duels of its own seeds; the shadow by tier; a win and a loss to watch again; outside the fingerprint', () => {
  const s0 = v2('v2-training-morning');
  // not yet seen: refused, its reason said; the evening, the sand shut
  const unseen = opt(s0, (a) => a.type === 'rehearse');
  assert.equal(unseen.ok, false); assert.equal(unseen.reason, T.tx('prep.rehearse.unseen', { name: 'Vessa Lark' }));
  const seen = structuredClone(s0); seen.facts.push('scouted:vessa');
  assert.equal(opt(at(seen, 1, 'evening', 'training'), (a) => a.type === 'rehearse').ok, false);
  // the afternoon of the bout: the bout first
  assert.equal(opt(at(seen, 2, 'afternoon', 'training'), (a) => a.type === 'rehearse').reason, T.tx('refuse.boutFirst'));
  // nowhere else
  assert.equal(opt(at(seen, 1, 'morning', 'forecourt'), (a) => a.type === 'rehearse'), undefined);
  const o = opt(seen, (a) => a.type === 'rehearse');
  assert.ok(o.ok, o.reason); assert.equal(o.cost, 1);
  const r = act(seen, { type: 'rehearse' }), st = r.state, reh = st.v2.$rehearsals.vessa;
  assert.notEqual(st.slot, seen.slot, 'a slot');
  assert.equal(reh.n, PR.REHEARSAL.n); assert.equal(reh.tier, 1);
  assert.equal(r.events[0].text, T.tx('prep.rehearse.log', { name: 'Vessa Lark', wins: reh.wins, n: reh.n }));
  // the oracle: the thirty duels again, the shadow as the bout to come with its skills by their roles
  const b = PR.shadowBout(seen), seeds = PR.rehearsalSeeds(seen, 'vessa');
  assert.ok(b.foe.tactic.every((c) => c === 'auto'), 'tier 1: each skill by its role');
  const real = AM.autoFightersFor(seen, 'vessa', 0, AD.autoRound(2));
  assert.deepEqual(b.ren, real.ren, 'Ren as he would fight it now');
  let wins = 0;
  for (const sd of seeds) wins += AU.autoWinner(AU.autoDuel(b.ren, b.foe, sd)) === 0 ? 1 : 0;
  assert.equal(reh.wins, wins);
  assert.equal(new Set(seeds).size, seeds.length, 'thirty seeds');
  // never the real bout's seed (the afternoon's sheet)
  const bout = AM.autoBoutOf(at(seen, 2, 'afternoon', 'arena'));
  assert.ok(!seeds.includes(bout.seed));
  // a win and a loss to watch again: the arena's duel (logged, traced) on those seeds, their result as said
  for (const which of ['win', 'loss']) {
    const sd = reh.seeds[which]; if (sd === undefined) continue;
    const rv = PR.reviewOf(st, which);
    assert.equal(rv.seed, sd); assert.deepEqual([rv.ren, rv.foe], [reh.ren, reh.shadow], 'the very bout rehearsed');
    assert.equal(AU.autoWinner(rv.result) === 0, which === 'win');
  }
  assert.ok(reh.seeds.win !== undefined || reh.seeds.loss !== undefined);
  // « with this plan » while the player's side is the same (the rival trains on meanwhile, slot after slot); not after a training session; the bout watched again the
  // one rehearsed all the same
  assert.equal(PR.rehearsalFresh(st, reh), true);
  const trained = act(at(st, 1, 'afternoon', 'training'), { type: 'train', stat: 'atk' }).state;
  assert.equal(PR.rehearsalFresh(trained, trained.v2.$rehearsals.vessa), false);
  const which = reh.seeds.win !== undefined ? 'win' : 'loss';
  assert.equal(AU.autoWinner(PR.reviewOf(trained, which).result) === 0, which === 'win');
  // outside the fingerprint (the log's line says its chances)
  const bare = structuredClone(st); delete bare.v2.$rehearsals;
  assert.equal(G.hash(bare), G.hash(st));
  // gone once the bout is fought
  const after = structuredClone(st); after.tournament.matches.find((m) => m.day === 2 && (m.a === 'player' || m.b === 'player')).winner = 'player';
  assert.equal(PR.rehearsalOf(after, 'vessa'), null);
});

test('the rehearsal at tier 2 plays the bout to come but its seed: the shadow is the duel\'s own opponent with its own plan', () => {
  const s = v2('v2-day2-afternoon'); s.facts.push('scouted:vessa', 'scouted2:vessa');
  const b = PR.shadowBout(s), real = AM.autoBoutOf(s);
  assert.equal(b.tier, 2);
  assert.deepEqual(b.ren, real.ren); assert.deepEqual(b.foe, real.foe);
  // tier 1: the same but the plan
  const t1 = structuredClone(s); t1.facts = t1.facts.filter((f) => f !== 'scouted2:vessa');
  const b1 = PR.shadowBout(t1);
  assert.deepEqual({ ...b1.foe, tactic: undefined }, { ...real.foe, tactic: undefined });
  assert.ok(b1.foe.tactic.every((c) => c === 'auto'));
});

// ------------------------------------------------------------------------------------------------- the notebook

const LEVELS = { t1: 2, t2: 1, t3: 1, t4: 1, d1: 1, s1: 1, k_iron: 1, k_parry: 1, k_cry: 1, k_focus: 1, k_sunder: 1, k_feint: 1, heavy: 1 };
const duelOf = (foe, stage, seed, loadout) => {
  const ren = AD.autoRen({ ...ST.REN_BASE, hp: 324, atk: 17, def: 15 }, { loadout, levels: LEVELS }, { weapon: 'imported-blade' });
  const f = AD.autoFoe(foe, AD.autoRaceSheet(foe, stage, 1), { stage });
  return { ren, foe: f, result: AU.autoDuel(ren, f, seed, { log: true, trace: true }) };
};
/** the arena's replay stepped from start to end: its impacts */
function impactsOf(d) {
  const r = new AV.AutoReplay(d.result, { ren: d.ren, marek: d.foe }), evs = [];
  r.drain();
  while (!r.over || r.t < r.end + 0.5) { r.step(); for (const e of r.drain()) evs.push(e); if (r.t > r.end + 1) break; }
  return evs.filter((e) => e.type === 'impact');
}

test('a note against the duel\'s own counts and the arena\'s replay: the damage by source, the openings, the damage in an opening or a break, the uses spent', () => {
  const KITS = [['t1', 't4', 'd1', 's1'], ['k_sunder', 't4', 'k_feint', 'k_iron'], ['t3', 't2', 'k_parry', 'k_focus']];
  let n = 0;
  for (const foe of Object.keys(AD.AUTO_FOES)) for (const loadout of KITS) for (const seed of [3, 11]) {
    const d = duelOf(foe, 1, seed, loadout), note = AN.boutNote(d.result, d.ren, d.foe, { day: 4, foe, kind: 'bout' }), N = d.result.n;
    assert.equal(note.dmg[0] + note.dmg[1] + note.dmg[2], N[0].dmg, `${foe} ${loadout}: Ren's damage`);
    assert.equal(note.taken[0] + note.taken[1] + note.taken[2], N[1].dmg, 'the damage taken');
    assert.equal(note.dmg[1] + note.dmg[2], N[0].skillDmg, 'the heavy blow and the skills: the duel\'s own count');
    assert.deepEqual(note.open, [N[0].opened, N[1].opened]);
    assert.deepEqual(note.breaks, [N[0].breaks, N[1].breaks]);
    assert.equal(note.clashes, Math.max(0, d.result.log.filter((e) => e.ev === 'clash').length));
    // the uses: each skill's charges, never above its uses
    for (const s of note.skills) {
      assert.equal(s.used, d.result.log.filter((e) => e.ev === 'charge' && e.who === 'ren' && e.act === s.id).length, s.id);
      assert.ok(s.used <= s.max, `${s.id} ${s.used}/${s.max}`);
      assert.ok(s.clean <= s.landed);
    }
    // the damage in an opening or a break, as the arena tells it
    const imp = impactsOf(d).filter((e) => e.from === 'ren');
    assert.equal(note.inOpen, imp.filter((e) => e.inBreak || e.inOpen).reduce((a, e) => a + e.damage, 0), `${foe} ${loadout} ${seed}: in an opening or a break`);
    // an exploit's blows clean at least where the arena says an opening or a break
    for (const s of note.skills.filter((x) => AD.AUTO_ROLES[x.id]?.role === 'exploit')) {
      const firsts = imp.filter((e) => e.action === s.id && !e.follow && e.result !== 'dodged');
      assert.equal(firsts.length, s.landed, `${s.id} landed`);
      assert.ok(s.clean >= firsts.filter((e) => e.inBreak || e.inOpen).length);
    }
    assert.equal(note.won, AU.autoWinner(d.result) === 0);
    n++;
  }
  assert.ok(n >= 42);
});

test('an exploit on a fighter charging a big action is clean (×2), as the duel strikes it; outside, not', () => {
  // a dummy that charges a long heavy blow, and Ren with the Estoc
  const ren = AD.autoRen({ ...ST.REN_BASE, hp: 400, atk: 30, def: 15 }, { loadout: ['t4', 't1', 'd1', 's1'], levels: LEVELS, tactic: { t4: 'ready' } }, { weapon: 'training-sword' });
  const foe = AD.autoFoe('marek', AD.autoRaceSheet('marek', 0, 0), { stage: 0 });
  let clean = 0, landed = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const r = AU.autoDuel(ren, foe, seed, { log: true }), note = AN.boutNote(r, ren, foe, { day: 1, foe: 'marek', kind: 'bout' }), t4 = note.skills.find((s) => s.id === 't4');
    clean += t4.clean; landed += t4.landed;
    // the oracle on the damage: a clean Estoc's blow is the stronger kind (×2 against ×0.6)
  }
  assert.ok(landed > 0 && clean > 0 && clean < landed, `${clean} of ${landed}`);
});

test('the advice: the first that holds in its order', () => {
  const ren = AD.autoRen({ ...ST.REN_BASE }, { loadout: ['t4', 'k_feint', 't1', 'd1'], levels: LEVELS });
  const base = { day: 1, foe: 'marek', kind: 'bout', won: true, t: 120, dmg: [100, 50, 50], taken: [100, 0, 0], open: [1, 0], breaks: [0, 0], inOpen: 0, clashes: 0, advice: { k: 'keep' } };
  const sk = (id, o = {}) => ({ id, used: 0, max: 2, landed: 0, clean: 0, void: 0, dmg: 0, ...o });
  const note = (o) => ({ ...base, skills: [sk('t4'), sk('k_feint'), sk('t1', { used: 2 }), sk('d1', { used: 2 })], ...o });
  const A = (n, cut = 0, dodged = 0) => AN.adviceOf(n, ren, 'k_feint', cut, dodged).k;
  // a Feint fired twice that cut nothing comes first
  assert.equal(A(note({ skills: [sk('t4', { used: 2, landed: 2, clean: 0 }), sk('k_feint', { used: 2 }), sk('t1'), sk('d1')] })), 'feint');
  assert.equal(A(note({ skills: [sk('t4', { used: 2, landed: 2, clean: 0 }), sk('k_feint', { used: 2 }), sk('t1'), sk('d1')] }), 1), 'feint', 'one of two: half cut nothing');
  // then an exploit spent without an opening
  assert.equal(A(note({ skills: [sk('t4', { used: 2, landed: 2, clean: 1 }), sk('k_feint', { used: 2 }), sk('t1', { used: 2 }), sk('d1', { used: 2 })] }), 2), 'exploit');
  // then big blows dodged
  assert.equal(A(note({ skills: [sk('t4', { used: 2, landed: 2, clean: 2 }), sk('k_feint', { used: 2 }), sk('t1', { used: 2 }), sk('d1', { used: 2 })] }), 2, 2), 'dodged');
  // then an opponent's skill that did the harm
  const full = [sk('t4', { used: 2, landed: 2, clean: 2 }), sk('k_feint', { used: 2 }), sk('t1', { used: 2 }), sk('d1', { used: 2 })];
  assert.equal(A(note({ skills: full, foeTop: { id: 'm_ironfall', dmg: 40 }, taken: [60, 0, 40] }), 2), 'foeSkill');
  // then uses left
  assert.equal(A(note({ skills: [sk('t4', { used: 2, landed: 2, clean: 2 }), sk('k_feint', { used: 2 }), sk('t1', { used: 0 }), sk('d1', { used: 2 })] }), 2), 'unspent');
  // then no opening; then keep, or rehearse after a defeat
  assert.equal(A(note({ skills: full, open: [0, 1] }), 2), 'noOpen');
  assert.equal(A(note({ skills: full }), 2), 'keep');
  assert.equal(A(note({ skills: full, won: false }), 2), 'rehearse');
});

test('the note travels with the result: kept in the notebook outside the fingerprint, dated, bounded; a challenge\'s too, a reprisal none; its lines in both languages', () => {
  const s = v2('v2-day2-afternoon'), o = AM.autoOutcome(s, 'bout', { log: true });
  assert.ok(o.note && o.note.foe === 'vessa');
  const outcome = { winner: o.winner, playerHp: o.playerHp, playerMaxHp: o.playerMaxHp, opponentHp: o.opponentHp, opponentMaxHp: o.opponentMaxHp, finisher: o.finisher };
  const withNote = act(s, { type: 'fight', outcome: { ...outcome, note: o.note } }).state, without = act(s, { type: 'fight', outcome }).state;
  assert.equal(withNote.v2.$notes.length, 1); assert.equal(without.v2.$notes, undefined);
  assert.equal(withNote.v2.$notes[0].day, 2); assert.equal(withNote.v2.$notes[0].kind, 'bout');
  assert.equal(G.hash(withNote), G.hash(without), 'outside the fingerprint');
  assert.deepEqual(NO.notesOf(withNote, 'vessa')[0], withNote.v2.$notes[0]);
  // bounded
  const many = structuredClone(withNote); for (let i = 0; i < 40; i++) NO.keepNote(many, { ...o.note, day: i });
  assert.equal(many.v2.$notes.length, NO.NOTES_KEPT); assert.equal(many.v2.$notes.at(-1).day, 39);
  // its lines, English and French, every slot filled
  for (const lines of [NB.noteLines(withNote.v2.$notes[0]), inFrench(() => NB.noteLines(withNote.v2.$notes[0]))]) {
    assert.equal(lines.length, 5);
    for (const l of lines) assert.ok(!/[{}]/.test(l), l);
  }
  for (const k of ['feint', 'exploit', 'dodged', 'foeSkill', 'unspent', 'noOpen', 'keep', 'rehearse']) {
    const a = { k, skill: 't4', foeSkill: 'm_lunge', n: 1, of: 2, pct: 40 };
    for (const t of [NB.adviceText(a, 'vessa'), inFrench(() => NB.adviceText(a, 'vessa'))]) assert.ok(t.length > 10 && !/[{}]/.test(t), `${k}: ${t}`);
  }
  // a challenge's note
  let c = v2('v2-training-morning'); c = act(c, { type: 'challenge', who: 'orla', stake: 'name' }).state;
  const co = AM.autoOutcome(c, 'challenge', { log: true });
  const cw = act(c, { type: 'challengeResult', outcome: { winner: co.winner, playerHp: co.playerHp, playerMaxHp: co.playerMaxHp, opponentHp: co.opponentHp, opponentMaxHp: co.opponentMaxHp, finisher: co.finisher, note: co.note } }).state;
  assert.equal(cw.v2.$notes.at(-1).kind, 'challenge'); assert.equal(cw.v2.$notes.at(-1).foe, 'orla');
});

// ------------------------------------------------------------------------------------------------- the sand's lesson

test('the sand\'s lesson (BL1-4): a challenge won raises the first blow of the plan under level 3; none when lost; the player\'s order decides', () => {
  let s = v2('v2-training-morning');
  const first = K.sandLessonSkill(s);
  assert.equal(first, AD.autoOrderOf(G.v2KitOf(s)).find((id) => AD.AUTO_SKILLS[id].family === 'offensive'));
  const before = s.v2.kit.levels[first];
  s = act(s, { type: 'challenge', who: 'ilse', stake: 'name' }).state;
  const won = act(s, { type: 'challengeResult', outcome: WIN });
  assert.equal(won.state.v2.kit.levels[first], before + 1);
  assert.ok(won.events.some((e) => e.text === T.tx('v2.skill.sand', { skill: T.skillName(first), level: before + 1 })));
  const lost = act(s, { type: 'challengeResult', outcome: LOSS }).state;
  assert.equal(lost.v2.kit.levels[first], before);
  // the player's order: the other blow first
  const o = structuredClone(s), four = AD.autoOrderOf(G.v2KitOf(o)), other = four.filter((id) => AD.AUTO_SKILLS[id].family === 'offensive' && id !== first)[0];
  o.v2.kit.order = [other, ...four.filter((id) => id !== other)];
  assert.equal(K.sandLessonSkill(o), other);
  // at the cap: the next one; every blow at the cap: none
  const capped = structuredClone(s); for (const id of four) capped.v2.kit.levels[id] = K.SAND_LESSON.cap;
  assert.equal(K.sandLessonSkill(capped), null);
});
