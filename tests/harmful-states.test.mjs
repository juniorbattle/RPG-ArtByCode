// The harmful states (journal Passes GP4-1, GP4-2; the operator's sheet https://claude.ai/artifact/DqsBjqLm1UQG4ChPC2EeRW, thirteen of thirteen at the recommendation, and the short sheet
// https://claude.ai/artifact/VojskHCbRGGbZQSdEaGaoq, six of six at the recommendation: GC-1 the curse and GC-3 the paralysis adopted as weapon families, GC-2 the weakness set aside):
// GE-1 the four states, GE-2 their numbers, GE-3 a state never ends a duel, GE-4 the weapon families and their counterpart, GE-5 the four signatures, GE-6 the rivals' states
// and resistances, GE-7 the protections, GE-8 the reading, GE-9 the borrowed looks and sounds, GE-10 no new condition, GE-12 the families named for workstream 5. Each
// rule against an oracle written from the decisions, on hand-made fighters.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { load, ROOT } from './load.mjs';

const AD = await load('/src/combat/autoData.ts'), AU = await load('/src/combat/auto.ts'), AN = await load('/src/combat/autoNotes.ts');
const AV = await load('/src/arena/autoView.ts'), H = await load('/src/arena/AutoHud.ts'), SFX = await load('/src/audio/sfx.ts'), SC = await load('/src/simulation/v2scout.ts');
const NB = await load('/src/ui/notebook.ts'), DT = await load('/src/ui/duelTutorial.ts');
const T = await load('/src/narrative/text/index.ts');
const { EN } = await load('/src/narrative/text/en.ts');
const { FR } = await load('/src/narrative/text/fr.ts');

const SHEET = 'https://claude.ai/artifact/DqsBjqLm1UQG4ChPC2EeRW';
const inFrench = (f) => { T.useLanguage('fr', FR); try { return f(); } finally { T.useLanguage('en'); } };
const joined = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8').replace(/\r?\n\s*(\*|\/\/)\s*/g, ' ');

// hand-made fighters (tests/new-skills.test.mjs): one light attack, a heavy blow that never goes, the skills given; the rules without form, reactions or decay
const A = (o = {}) => ({ id: 'light', kind: 'light', charge: 1, power: 100, gauge: 0, hits: [1], gap: 0.3, ...o });
const noHeavy = () => A({ id: 'heavy', kind: 'heavy', charge: 1e9, power: 1 });
const fighter = (o = {}) => ({ id: 'a', side: 'ren', hp: 1e6, atk: 10, def: 10, end: 10, viv: 10, tempo: 10, taken: 1, light: A(), heavy: noHeavy(), skills: [], brain: 'player', ...o });
const dummy = (o = {}) => fighter({ id: 'b', side: 'foe', light: A({ charge: 1e7, power: 1 }), brain: 'rival', ...o });
const rules = (o = {}) => { const r = JSON.parse(JSON.stringify(AU.AUTO_RULES)); r.form = 0; r.react.dodge = 0; r.react.guard = 0; r.gauge.decay = 0; r.maxT = 200; r.lightCharge = 1; r.hpScale = 1; for (const [k, v] of Object.entries(o)) { if (v && typeof v === 'object' && !Array.isArray(v)) r[k] = { ...r[k], ...v }; else r[k] = v; } return r; };
const duel = (a, b, seed, rr, o = {}) => AU.autoDuel(a, b, seed, { rules: rr, log: true, ...o });

test('GE-1 / GE-2 / GE-3 and GC-1 / GC-3: six states and their numbers, a state never ends a duel; the decisions quoted where they are built', () => {
  assert.deepEqual(AU.AUTO_STATE_IDS, ['poison', 'burn', 'blind', 'bleed', 'curse', 'paralysis']);
  // (the four of the first sheet, then the short sheet's curse and paralysis; the weakness, GC-2 « L’écarter », has no rule left)
  assert.deepEqual(AU.AUTO_RULES.states, { poison: { dur: 10, max: 3, pct: 0.0011, tick: 1 }, burn: { dur: 6, max: 1, pct: 0.0033, tick: 1 }, blind: { dur: 6, max: 1, miss: 0.35 }, bleed: { dur: 10, max: 2, pct: 0.01 }, curse: { dur: 8, max: 1, k: 0.25 }, paralysis: { dur: 8, max: 1, chance: 0.3, freeze: 1.5 }, lethal: false });
  assert.ok(!('weakness' in AU.AUTO_RULES.states) && !('AUTO_STATE_CANDIDATES' in AU), 'the weakness is set aside');
  const sheet2 = 'https://claude.ai/artifact/VojskHCbRGGbZQSdEaGaoq'; for (const w of [sheet2, 'GC-1 « L’adopter »', 'GC-3 « L’adopter »', 'GC-2 « L’écarter »', 'GC-4 « Des familles d’armes seulement »']) assert.ok(joined('src/combat/auto.ts').includes(w), `auto.ts: ${w}`);
  for (const [f, words] of [['src/combat/auto.ts', ['GE-1 « Ces quatre »', 'GE-2 « Ces nombres »', 'GE-3 « Un état n’achève pas »', SHEET]], ['src/combat/autoData.ts', ['GE-4 « Ces familles, avec une contrepartie »', 'GE-5 « Ces quatre signatures »', 'GE-6 « Ces porteurs et ces résistances »', 'GE-7 « Ces sept familles »', 'GE-12 « Ainsi »', SHEET]]]) {
    const src = joined(f); for (const w of words) assert.ok(src.includes(w), `${f}: ${w}`);
  }
});

test('GE-4 / GE-7 / GE-12: the weapon families and their counterpart, the armours and the accessories, named for workstream 5; no piece of the game carries one yet', () => {
  assert.deepEqual(AD.STATE_WEAPON_FAMILIES, { venom: { state: 'poison', chance: 0.12 }, ember: { state: 'burn', chance: 0.08, on: 'any' }, glare: { state: 'blind', chance: 0.15 }, serrated: { state: 'bleed', chance: 0.12 }, hex: { state: 'curse', chance: 0.4 }, numb: { state: 'paralysis', chance: 0.4 } });
  assert.equal(AD.STATE_WEAPON_COUNTERPART, -2);
  // (GC-4 « Des familles d’armes seulement »: no rival carries the curse or the paralysis, no armour or accessory keeps them off)
  for (const [id, st] of Object.entries(AD.AUTO_STYLES)) assert.ok(!['curse', 'paralysis'].includes(st.inflict?.state) && !('curse' in (st.resist ?? {})) && !('paralysis' in (st.resist ?? {})), `${id} carries and resists neither`);
  for (const fam of [...Object.values(AD.STATE_ARMOUR_FAMILIES), ...Object.values(AD.STATE_CHARM_FAMILIES)]) assert.ok(!('curse' in fam) && !('paralysis' in fam));
  for (const s of Object.values(AD.AUTO_SKILL_STATES)) assert.ok(!['curse', 'paralysis'].includes(s.state), 'no signature carries them');
  assert.deepEqual(AD.STATE_ARMOUR_FAMILIES, { leather: { poison: 0.5 }, padded: { burn: 0.5 }, mail: { bleed: 0.5 } });
  assert.deepEqual(AD.STATE_CHARM_FAMILIES, { bezoar: { poison: 1 }, salamander: { burn: 1 }, hood: { blind: 1 }, tourniquet: { bleed: 1 } });
  for (const [id, fx] of Object.entries(AD.AUTO_GEAR_FX)) assert.ok(!fx.inflict && !fx.resist, `${id} carries no state (GE-12: workstream 5)`);
  // the pieces worn: a state the first piece's that carries one (the weapon), each resistance the highest
  AD.AUTO_GEAR_FX.__w = { inflict: AD.STATE_WEAPON_FAMILIES.venom }; AD.AUTO_GEAR_FX.__a = { resist: { poison: 0.5, bleed: 0.5 } }; AD.AUTO_GEAR_FX.__c = { resist: { poison: 1 }, inflict: AD.STATE_WEAPON_FAMILIES.glare };
  try { assert.deepEqual(AD.autoGearFx(['__w', '__a', '__c']), { inflict: AD.STATE_WEAPON_FAMILIES.venom, resist: { poison: 1, bleed: 0.5 } }); } finally { delete AD.AUTO_GEAR_FX.__w; delete AD.AUTO_GEAR_FX.__a; delete AD.AUTO_GEAR_FX.__c; }
});

test('GE-5 / GE-6: the four signatures carry their state, the rivals\' weapons and resistances; a generic fighter takes its rival\'s', () => {
  assert.deepEqual(AD.AUTO_SKILL_STATES, { m_ironfall: { state: 'burn', chance: 1, on: 'any', dur: 1.5 }, m_smite: { state: 'blind', chance: 1, dur: 1.5 }, m_cleave: { state: 'bleed', chance: 1 }, m_riposte: { state: 'poison', chance: 1, dose: 2 } });
  const want = { vessa: [{ state: 'bleed', chance: 0.04 }, undefined], tobin: [{ state: 'blind', chance: 0.05 }, { blind: 0.5 }], cassius: [{ state: 'poison', chance: 0.06 }, { poison: 1 }], orla: [undefined, { bleed: 0.5 }], ilse: [undefined, { blind: 1 }], marek: [{ state: 'burn', chance: 0.08, on: 'any' }, { burn: 1 }], rhosk: [undefined, { bleed: 1 }] };
  for (const [id, [inf, res]] of Object.entries(want)) {
    assert.deepEqual([AD.AUTO_STYLES[id].inflict, AD.AUTO_STYLES[id].resist], [inf, res], id);
    const f = AD.autoFoe(id, AD.autoRaceSheet(id, 0, 0), { stage: 0 });
    assert.deepEqual([f.gfx?.inflict, f.gfx?.resist], [inf, res], `${id} as a fighter`);
    // its signature carries its state (the rival plays it; Ren once learnt, the same table)
    for (const s of f.skills) assert.deepEqual(s.inflict, AD.AUTO_SKILL_STATES[s.id] && !s.ward && !s.boost ? AD.AUTO_SKILL_STATES[s.id] : undefined, `${id} ${s.id}`);
  }
  assert.deepEqual(AD.autoSkill('m_riposte', 1).inflict, AD.AUTO_SKILL_STATES.m_riposte, 'Ren\'s Golden Riposte poisons too');
  // a generic fighter fights with its rival's kit and style, its states and resistances with them
  const g = AD.autoFoe('aldric', AD.autoRaceSheet('marek', 0, 0), { kitOf: 'marek', stage: 0 });
  assert.deepEqual(g.gfx, { inflict: AD.AUTO_STYLES.marek.inflict, resist: AD.AUTO_STYLES.marek.resist });
  assert.deepEqual(AD.autoKitStates('cassius'), { poses: [{ state: 'poison', from: 'weapon' }, { state: 'poison', from: 'm_riposte' }], resists: [{ state: 'poison', k: 1 }] });
  assert.deepEqual(AD.autoKitStates('orla'), { poses: [], resists: [{ state: 'bleed', k: 0.5 }] });
});

test('the poison: a dose a landed hit, never through a guard; its share of the maximum health each second by dose, three doses at most, each new one renewing the length', () => {
  const S = AU.AUTO_RULES.states.poison;
  const ren = fighter({ light: A({ charge: 4, power: 1, inflict: { state: 'poison', chance: 1 } }) }), foe = dummy({ hp: 100000 });
  const r = duel(ren, foe, 1, rules({ maxT: 40 }));
  const af = r.log.filter((e) => e.ev === 'afflict'), ticks = r.log.filter((e) => e.ev === 'tick');
  assert.deepEqual(af.slice(0, 4).map((e) => e.dose), [1, 2, 3, 3], 'one dose a hit, three at most');
  // the oracle: each second after the first dose, the doses alive then × the share
  for (const k of ticks) {
    const alive = af.filter((e) => e.t <= k.t - 1 + 1e-9).at(-1);
    assert.equal(k.dmg, Math.max(1, Math.round(100000 * S.pct * alive.dose)), `at ${k.t}`);
    assert.equal(k.who, 'b'); assert.equal(k.state, 'poison');
  }
  assert.ok(ticks.length > 20);
  // no tick before a second has passed, none past the last dose's length
  assert.ok(ticks[0].t >= af[0].t + 1 - 1e-9 && ticks.at(-1).t <= af.at(-1).t + S.dur + 1e-9);
  // a guarded hit poisons nothing (the guard always: Defence far over the Attack, the reaction certain)
  const g = duel(ren, dummy({ hp: 100000, def: 1000 }), 2, rules({ maxT: 40, react: { dodge: 0, guard: 1, skillGuard: 2, cap: 1 } }));
  assert.ok(g.log.some((e) => e.ev === 'guarded') && !g.log.some((e) => e.ev === 'afflict'), 'stopped by a guard');
  // the counts kept apart from the blows' damage
  assert.equal(r.sn[0].dmg.poison, ticks.reduce((n, e) => n + e.dmg, 0)); assert.equal(r.n[0].dmg, r.log.filter((e) => e.ev === 'hit').reduce((n, e) => n + e.dmg, 0));
});

test('the burn: through a guard, no doses, a share a second for its length, renewed by a new burn', () => {
  const S = AU.AUTO_RULES.states.burn;
  const ren = fighter({ light: A({ charge: 3, power: 1, inflict: { state: 'burn', chance: 1, on: 'any' } }) }), foe = dummy({ hp: 100000, def: 1000 });
  const r = duel(ren, foe, 3, rules({ maxT: 30, react: { dodge: 0, guard: 1, skillGuard: 2, cap: 1 } }));
  const af = r.log.filter((e) => e.ev === 'afflict'), ticks = r.log.filter((e) => e.ev === 'tick');
  assert.ok(r.log.filter((e) => e.ev === 'guarded').length >= 5 && af.length >= 5, 'a guarded hit burns');
  assert.ok(af.every((e) => e.dose === 1 && e.len === S.dur));
  for (const k of ticks) assert.equal(k.dmg, Math.round(100000 * S.pct), 'one dose');
});

test('the blindness: the blinded fighter\'s hits miss by their own keyed draw, told as dodged with a miss; a big action missed opens its striker; the draws of the rest unchanged', () => {
  const blindFoe = A({ id: 'sand', kind: 'skill', role: 'punish', charge: 1, power: 1, uses: 1, cooldown: 99, inflict: { state: 'blind', chance: 1 } });
  // the opponent blinds Ren at once, then Ren strikes 6 s long: about a third of his hits miss
  const big = A({ id: 'big', kind: 'skill', role: 'punish', charge: 0.5, power: 50, uses: 99, cooldown: 0.5 });
  const ren = fighter({ light: A({ charge: 0.2, hits: [0.5, 0.5] }) }), bigRen = fighter({ light: A({ charge: 0.2 }), skills: [big], tactic: ['ready'] });
  let miss = 0, all = 0, opened = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const r = duel(ren, dummy({ skills: [blindFoe], tactic: ['ready'], hp: 1e7 }), seed, rules({ maxT: 8 }));
    const at = r.log.find((e) => e.ev === 'afflict');
    if (!at) continue;
    for (const e of r.log) if (e.who === 'a' && (e.ev === 'hit' || e.ev === 'dodged') && e.t > at.t && e.t < at.t + AU.AUTO_RULES.states.blind.dur) { all++; if (e.miss) { miss++; assert.equal(e.ev, 'dodged'); } }
    const rb = duel(bigRen, dummy({ skills: [blindFoe], tactic: ['ready'], hp: 1e7 }), seed, rules({ maxT: 8 }));
    opened += rb.n[1].opened;
  }
  assert.ok(all > 400 && Math.abs(miss / all - AU.AUTO_RULES.states.blind.miss) < 0.06, `${miss} of ${all} missed`);
  assert.ok(opened > 0, 'a big action missed opens its striker (counted to its opponent, as a dodge)');
  // without the blindness the same duel's other draws: the reactions keyed by the striker, the action's rank and the hit's rank (SY-04)
  const plain = duel(ren, dummy({ hp: 1e7 }), 5, rules({ maxT: 3 })), again = duel(ren, dummy({ hp: 1e7 }), 5, rules({ maxT: 3 }));
  assert.deepEqual(plain.log, again.log);
});

test('the bleeding: each action its fighter starts costs its share by dose, two doses at most', () => {
  const S = AU.AUTO_RULES.states.bleed;
  const cut = A({ id: 'cut', kind: 'skill', role: 'punish', charge: 0.5, power: 1, uses: 2, cooldown: 0.5, inflict: { state: 'bleed', chance: 1 } });
  const foe = dummy({ skills: [cut], tactic: ['ready'] }), ren = fighter({ hp: 100000, light: A({ charge: 1.5, power: 1 }) });
  const r = duel(ren, foe, 4, rules({ maxT: 12 }));
  const af = r.log.filter((e) => e.ev === 'afflict' && e.who === 'b'), ticks = r.log.filter((e) => e.ev === 'tick' && e.state === 'bleed');
  assert.deepEqual(af.map((e) => e.dose), [1, 2]);
  // the oracle: a tick right after each of Ren's charges in the bleeding's length, at the doses then
  const charges = r.log.filter((e) => e.ev === 'charge' && e.who === 'a' && e.t > af[0].t && e.t < af.at(-1).t + S.dur);
  assert.equal(ticks.length, charges.length);
  ticks.forEach((k, i) => { assert.equal(k.t, charges[i].t); const dose = af.filter((e) => e.t <= k.t + 1e-9).at(-1).dose; assert.equal(k.dmg, Math.round(100000 * S.pct * dose), `at ${k.t}`); });
});

test('GE-3: a state leaves its fighter at 1 health at least, the duel ends on a blow; lethal states (never in the game) would end it', () => {
  const ren = fighter({ light: A({ charge: 0.5, power: 1, inflict: { state: 'burn', chance: 1, on: 'any' } }) });
  const r = duel(ren, dummy({ hp: 60 }), 1, rules({ maxT: 120, states: { burn: { dur: 6, max: 1, pct: 0.2, tick: 1 } } }));
  assert.equal(r.finisher, 'light', 'the last blow ends it');
  assert.ok(!r.log.some((e) => e.ev === 'tick' && e.hp <= 0));
  const l = duel(fighter({ light: A({ charge: 0.5, power: 0.001, inflict: { state: 'burn', chance: 1, on: 'any' } }) }), dummy({ hp: 30 }), 1, rules({ maxT: 120, states: { burn: { dur: 6, max: 1, pct: 0.5, tick: 1 }, lethal: true } }));
  assert.equal(l.finisher, 'state'); assert.equal(l.winner, 0);
});

test('GE-7: a resistance cuts the chance by its share; a full one keeps the state off', () => {
  const ren = fighter({ light: A({ charge: 0.4, power: 1, inflict: { state: 'poison', chance: 1 } }) });
  const count = (resist) => { let n = 0, hits = 0; for (let s = 1; s <= 20; s++) { const r = duel(ren, dummy({ hp: 1e7, gfx: { resist } }), s, rules({ maxT: 20 })); n += r.log.filter((e) => e.ev === 'afflict').length; hits += r.log.filter((e) => e.ev === 'hit' && e.who === 'a').length; } return n / hits; };
  assert.equal(count({}), 1); assert.equal(count({ poison: 1 }), 0);
  assert.ok(Math.abs(count({ poison: 0.5 }) - 0.5) < 0.05);
  assert.equal(count({ bleed: 1 }), 1, 'another state\'s resistance changes nothing');
});

test('without a state the duel as before: no tick, no state count; the game\'s rivals with theirs', () => {
  const r = duel(fighter(), dummy({ hp: 2000 }), 9, rules());
  assert.equal(r.sn, undefined); assert.ok(!r.log.some((e) => e.ev === 'afflict' || e.ev === 'tick' || e.miss));
  // the game's: Cassius poisons Ren in a pool bout of the start kit
  let seen = 0;
  for (let s = 1; s <= 10; s++) { const f = AD.autoFoe('cassius', AD.autoRaceSheet('cassius', 0, 0), { stage: 0 }), ren = AD.autoRen({ hp: 300, atk: 10, def: 10, end: 10, viv: 10 }, { loadout: ['t1', 't4', 'd1', 's1'], levels: {} }); const d = AU.autoDuel(ren, f, s, { log: true }); seen += d.log.filter((e) => e.ev === 'afflict' && e.who === 'cassius' && e.state === 'poison').length; }
  assert.ok(seen > 0);
});

test('GE-8: the arena reads the states (the card, the words, the number of a tick, « Missed »), in both languages; the first duel\'s tutorial does not take a miss for a dodge', () => {
  for (const t of [H.AUTO_TEXTS_EN, H.AUTO_TEXTS_FR]) { assert.deepEqual(Object.keys(t.states).sort(), ['bleed', 'blind', 'burn', 'curse', 'paralysis', 'poison']); assert.ok(t.missed); assert.ok(t.ultMiss.missed); }
  assert.deepEqual([H.AUTO_TEXTS_FR.states.poison, H.AUTO_TEXTS_FR.states.burn, H.AUTO_TEXTS_FR.states.blind, H.AUTO_TEXTS_FR.states.bleed, H.AUTO_TEXTS_FR.states.curse, H.AUTO_TEXTS_FR.states.paralysis, H.AUTO_TEXTS_FR.frozen, H.AUTO_TEXTS_FR.missed], ['Poison', 'Brûlure', 'Aveuglé', 'Saignement', 'Maudit', 'Paralysé', 'Figé', 'Manqué']);
  // the replay: a duel with each state; its card's states as the script leaves them, a tick told with its damage, a miss told with its flag
  const blind = A({ id: 'sand', kind: 'skill', role: 'punish', charge: 1, power: 1, uses: 9, cooldown: 3, inflict: { state: 'blind', chance: 1 } });
  const ren = fighter({ id: 'ren', hp: 5000, light: A({ charge: 1.2, power: 5, hits: [0.5, 0.5], inflict: { state: 'poison', chance: 1 } }) });
  const foe = dummy({ id: 'marek', hp: 5000, skills: [blind], tactic: ['ready'], light: A({ id: 'm_light', charge: 1.5, power: 5 }) });
  const res = AU.autoDuel(ren, foe, 3, { log: true, trace: true, rules: { ...AU.AUTO_RULES, maxT: 60 } });
  const rp = new AV.AutoReplay(res, { ren, marek: foe }), evs = [];
  let checked = 0;
  for (let i = 0; i < 1e5 && !rp.over && rp.t < 50; i++) {
    rp.step(rp.D.dt); evs.push(...rp.drain());
    const h = rp.hud(), live = (who, id) => res.log.filter((e) => e.ev === 'afflict' && e.state === id && e.who !== who && e.t <= rp.t + 1e-9).some((e) => e.t + e.len > rp.t + 1e-9);
    for (const [seat, who] of [['ren', 'ren'], ['marek', 'marek']]) for (const id of ['poison', 'blind']) { assert.equal(!!h[seat].states?.some((x) => x.id === id), live(who, id), `${seat} ${id} at ${rp.t}`); checked++; }
  }
  assert.ok(checked > 1000);
  assert.ok(evs.some((e) => e.type === 'state' && e.state === 'poison' && e.who === 'marek') && evs.some((e) => e.type === 'state' && e.state === 'blind' && e.who === 'ren'));
  assert.ok(evs.some((e) => e.type === 'stateTick' && e.who === 'marek' && e.damage > 0));
  const missed = evs.filter((e) => e.type === 'impact' && e.miss);
  assert.ok(missed.length > 0 && missed.every((e) => e.result === 'dodged'));
  assert.ok(!evs.some((e) => e.type === 'reactStart' && e.t === undefined));
  // the tutorial: a miss opens no lesson of the guard and the dodge
  assert.deepEqual(DT.lessonsOf({ type: 'impact', result: 'dodged', miss: true, kind: 'light', follow: false, resist: 0 }), []);
  assert.deepEqual(DT.lessonsOf({ type: 'impact', result: 'dodged', kind: 'light', follow: false, resist: 0 }), ['react']);
});

test('GE-8: the scouting says a rival\'s states and resistances (its style), the match sheet\'s two rows, the notebook\'s line and advice, in both languages', () => {
  const lines = (f) => [SC.styleText('cassius', 'Cassius'), SC.styleText('orla', 'Orla'), SC.styleText('vessa', 'Vessa'), SC.stateListText([{ state: 'burn', from: 'weapon' }, { state: 'burn', from: 'm_ironfall' }]), SC.resistListText([{ state: 'blind', k: 0.5 }])];
  const en = lines(), fr = inFrench(lines);
  assert.ok(en[0].includes(`Cassius's blows carry: Poison (weapon, ${SC.anySkillName('m_riposte')}). Cassius's resistances: Poison.`), en[0]);
  assert.match(en[1], /Orla carries no harmful state\. Orla's resistances: Bleeding \(half\)\./);
  assert.match(en[2], /Vessa's blows carry: Bleeding \(weapon\)\./); assert.ok(!/resistances/.test(en[2]));
  assert.equal(en[3], `Burn (weapon, ${SC.anySkillName('m_ironfall')})`); assert.equal(en[4], 'Blindness (half)');
  assert.ok(fr[0].includes(`Les coups de Cassius portent : Poison (arme, ${inFrench(() => SC.anySkillName('m_riposte'))}). Résistances de Cassius : Poison.`), fr[0]);
  assert.match(fr[1], /Orla ne porte aucun état néfaste\. Résistances d’Orla : Saignement \(à moitié\)\./);
  assert.equal(fr[4], 'Aveuglement (à moitié)');
  for (const l of [...en, ...fr]) assert.ok(!/[{}]/.test(l), l);
  // the match sheet: the two rows, the opponent's read from the scouting
  const src = joined('src/ui/townUi.ts');
  assert.match(src, /\[tx\('auto\.sheet\.states'\), stateListText\(autoStatesOf\(ren\)\) \|\| '—', foeKnown \? stateListText\(autoStatesOf\(foe\)\) \|\| '—' : '\?'\]/);
  assert.match(src, /\[tx\('auto\.sheet\.resist'\), resistListText\(autoResistsOf\(ren\)\) \|\| '—', foeKnown \? resistListText\(autoResistsOf\(foe\)\) \|\| '—' : '\?'\]/);
  // the notebook: a duel where Marek burns Ren again and again, the note's states and the advice of a protection
  const burn = A({ id: 'm_light', charge: 1, power: 2, inflict: { state: 'burn', chance: 1, on: 'any' } });
  const ren = fighter({ id: 'ren', hp: 400, light: A({ charge: 1, power: 3 }) }), foe = dummy({ id: 'marek', hp: 400, light: burn });
  const r = AU.autoDuel(ren, foe, 1, { log: true, rules: { ...AU.AUTO_RULES, form: 0, hpScale: 1 } });
  const note = AN.boutNote(r, ren, foe, { day: 2, foe: 'marek', kind: 'bout' });
  const burnt = r.log.filter((e) => e.ev === 'tick' && e.who === 'ren').reduce((n, e) => n + e.dmg, 0);
  assert.deepEqual(note.states?.taken, { burn: burnt });
  assert.equal(note.advice.k, 'state'); assert.equal(note.advice.state, 'burn');
  for (const l of [NB.noteLines(note), inFrench(() => NB.noteLines(note))]) { assert.equal(l.length, 6); for (const x of l) assert.ok(!/[{}]/.test(x), x); }
  assert.match(NB.adviceText(note.advice, 'marek'), /^Marek[^']*'s Burn did \d+ % of your wounds: an armour halves its chance, an accessory keeps it off\.$/);
  assert.match(inFrench(() => NB.adviceText(note.advice, 'marek')), /^« Brûlure » de Marek[^:]* a fait \d+ % de vos blessures : une armure en réduit de moitié la chance, un accessoire l’écarte\.$/);
  // Ren's state that the opponent resists in full: the advice says it put none
  const venom = fighter({ id: 'ren', hp: 400, gfx: { inflict: { state: 'poison', chance: 0.3 } } }), cass = dummy({ id: 'cassius', hp: 400, gfx: { resist: { poison: 1 } } });
  assert.deepEqual(AN.adviceOf({ ...note, states: undefined, skills: [], open: [1, 0], foeTop: undefined, taken: [10, 0, 0], won: true, breaks: [0, 0] }, venom, undefined, 0, 0, cass), { k: 'resisted', state: 'poison', from: 'weapon' });
  assert.match(NB.adviceText({ k: 'resisted', state: 'poison', from: 'weapon' }, 'cassius'), /^Cassius[^:]* resists Poison: your weapon put none on them\.$/);
  assert.match(inFrench(() => NB.adviceText({ k: 'resisted', state: 'poison', from: 'weapon' }, 'cassius')), /^Cassius[^:]* résiste à « Poison » : votre arme ne lui en a rien posé\.$/);
});

test('GE-9: the looks and the sounds borrowed, no new art: the form\'s sign for the poison, Marek\'s Resolve, Ilse\'s Prayer, Rhosk\'s Roar', () => {
  assert.deepEqual(SFX.STATE_SOUND, { burn: 'm_resolve', blind: 'm_prayer', bleed: 'm_roar', curse: 'k_cry', paralysis: 'm_tempo' });
  for (const [st, id] of Object.entries(SFX.STATE_SOUND)) assert.deepEqual(SFX.sfxOf({ type: 'state', state: st, who: 'ren' }, 5).map((c) => c.id), [id]);
  assert.deepEqual(SFX.sfxOf({ type: 'state', state: 'poison', who: 'ren' }, 5), [], 'the poison\'s sound the form\'s sign, in the engine');
  assert.match(joined('src/audio/Sound.ts'), /if \(e\.type === 'state' && e\.state === 'poison'\) \{ this\.formSign\(String\(e\.who\), 'formDown'\); return; \}/);
  assert.match(joined('src/arena/fx/combatFx.ts'), /const STATE_LOOKS: Record<string, FxRecipe \| undefined> = \{ poison: FORM_RECIPES\.formDown, burn: RECIPES\.m_resolve, blind: RECIPES\.m_prayer, bleed: RECIPES\.m_roar, curse: RECIPES\.k_cry, paralysis: RECIPES\.m_tempo \};/);
});

test('GE-10: no new condition in the plan', () => {
  for (const conds of Object.values(AD.AUTO_CONDS_BY_ROLE)) for (const c of conds) assert.ok(AU.AUTO_CONDS.includes(c));
  assert.ok(!AU.AUTO_CONDS.some((c) => /poison|burn|blind|bleed|state/.test(c)));
});

test('the words of the harmful states in both languages, every slot filled; the guide\'s paragraph without a digit of its own', () => {
  for (const k of ['state.name.poison', 'state.name.burn', 'state.name.blind', 'state.name.bleed', 'state.name.curse', 'state.name.paralysis', 'state.src.weapon', 'state.with', 'state.half', 'scout.states.poses', 'scout.states.none', 'scout.states.resists', 'auto.sheet.states', 'auto.sheet.resist', 'note.states', 'advice.state', 'advice.resisted']) {
    assert.ok(EN[k] && FR[k], k);
    assert.deepEqual([...FR[k].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(), [...EN[k].matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort(), k);
  }
  assert.match(EN['tut.ch.duel.body'], /Some blows leave a harmful state: the poison, doses that take health each second and that a guard stops; the burn, through the guard; the blindness, one's own blows miss; the bleeding, each action started reopens it\. A state never ends a bout\./);
  assert.match(FR['tut.ch.duel.body'], /Certains coups laissent un état néfaste : le poison/);
  const para = EN['tut.ch.duel.body'].split('\n').at(-1); assert.ok(!/\d/.test(para));
});

test('GC-1: a curse lowers the cursed fighter’s Attack by a quarter for 8 s, its blows read from that Attack; a new curse renews the length, no doses', () => {
  const S = AU.AUTO_RULES.states.curse, base = 10000, low = Math.round(base * (2 * (10 * (1 - S.k))) / (10 * (1 - S.k) + 10));
  const hurt = (r) => r.log.filter((e) => e.who === 'b' && e.ev === 'hit');
  // one curse at about 20.9 s (the foe's blows never meet it: they leave at x.19, it lands at 20.87): the foe's damage before, during (8 s) and after
  const ren = fighter({ light: A({ charge: 20.5, power: 1, inflict: { state: 'curse', chance: 1 } }) }), foe = dummy({ hp: 1e9, light: A({ charge: 1, power: base }) });
  const r = duel(ren, foe, 5, rules({ maxT: 38 })), af = r.log.filter((e) => e.ev === 'afflict');
  assert.equal(af.length, 1); assert.deepEqual([af[0].state, af[0].dose, af[0].len], ['curse', 1, S.dur]);
  const t0 = af[0].t, hits = hurt(r); assert.ok(hits.length > 20);
  for (const e of hits) assert.equal(e.dmg, e.t > t0 && e.t < t0 + S.dur ? low : base, `a blow at ${e.t}`);
  assert.ok(hits.some((e) => e.t > t0 && e.t < t0 + S.dur) && hits.some((e) => e.t > t0 + S.dur), 'the blows of both sides of the length');
  assert.equal(low, 8571, 'the Attack 10 against a Defence of 10 read as 7.5: 2 x 7.5 / 17.5');
  // a curse every 5.5 s renews it (no clash between the blows, the rules' window set to 0): the foe's blows all stay low after the first, never a second dose
  const ren2 = fighter({ light: A({ charge: 5.5, power: 1, inflict: { state: 'curse', chance: 1 } }) }), r2 = duel(ren2, dummy({ hp: 1e9, light: A({ charge: 1, power: base }) }), 5, rules({ maxT: 60, clash: { w: 0 } }));
  const af2 = r2.log.filter((e) => e.ev === 'afflict'); assert.ok(af2.length >= 8 && af2.every((e) => e.dose === 1 && e.len === S.dur));
  for (const e of hurt(r2)) if (e.t > af2[0].t + 0.2) assert.equal(e.dmg, low, `a blow at ${e.t}`);
  assert.equal(r.sn[0].afflicted.curse, 1, 'the count');
});

test('GC-3: a paralysed fighter’s started actions freeze three times in ten for 1.5 s inside the 8 s, nothing outside it; it neither guards nor dodges while frozen; a frozen action starts after the freeze', () => {
  const S = AU.AUTO_RULES.states.paralysis;
  let frozen = 0, started = 0, early = 0, outside = 0;
  for (let seed = 1; seed <= 20; seed++) {
    const ren = fighter({ light: A({ charge: 1, power: 1, inflict: { state: 'paralysis', chance: 1 } }) }), foe = dummy({ hp: 1e9, light: A({ charge: 1, power: 10 }) });
    const r = duel(ren, foe, seed, rules({ maxT: 60 })), first = r.log.find((e) => e.ev === 'afflict');
    const fz = r.log.filter((e) => e.ev === 'freeze' && e.who === 'b'), ch = r.log.filter((e) => e.ev === 'charge' && e.who === 'b' && e.t >= first.t);
    frozen += fz.length; started += ch.length;
    for (const x of fz) { assert.equal(x.len, S.freeze); if (x.t < first.t) outside++; const nx = r.log.find((e) => e.who === 'b' && e.ev === 'charge' && e.t > x.t); if (nx && nx.t - x.t < S.freeze - 1e-9) early++; }
    assert.equal(r.log.filter((e) => e.ev === 'freeze' && e.who === 'a').length, 0, 'the fighter who is not paralysed never freezes');
    assert.equal(r.sn[1].frozen ?? 0, fz.length, 'the count of the frozen actions');
  }
  assert.equal(early, 0, 'a frozen action starts at least 1.5 s later'); assert.equal(outside, 0, 'no freeze before the first paralysis');
  assert.ok(frozen + started > 400 && Math.abs(frozen / (frozen + started) - S.chance) < 0.05, `${frozen} frozen of ${frozen + started} actions started under it (30 %)`);
  // outside its length nothing freezes: one paralysis at 20.9 s, the foe's actions before and after it
  const one = duel(fighter({ light: A({ charge: 20.5, power: 1, inflict: { state: 'paralysis', chance: 1 } }) }), dummy({ hp: 1e9, light: A({ charge: 1, power: 10 }) }), 5, rules({ maxT: 60 }));
  const t0 = one.log.find((e) => e.ev === 'afflict').t;
  for (const e of one.log.filter((x) => x.ev === 'freeze')) assert.ok(e.t > t0 && e.t < t0 + S.dur, `a freeze at ${e.t}`);
  // no guard and no dodge while frozen: a foe that dodges half of the blows and guards every other one when it can (a guarded hit still paralyses: `on` 'any'),
  // its blows landing inside the freezes, and never the same blow elsewhere
  const R = rules({ maxT: 60, react: { dodge: 0.5, guard: 1, skillGuard: 1, cap: 1 } });
  let inWin = 0, inHit = 0, outHit = 0, outAll = 0;
  for (let seed = 1; seed <= 12; seed++) {
    const ren = fighter({ light: A({ charge: 1, power: 1, inflict: { state: 'paralysis', chance: 1, on: 'any' } }) }), foe = dummy({ hp: 1e9, def: 10, light: A({ charge: 1, power: 10 }) });
    const r = duel(ren, foe, seed, R), wins = r.log.filter((e) => e.ev === 'freeze' && e.who === 'b').map((e) => [e.t, e.t + S.freeze]);
    for (const e of r.log) if (e.who === 'a' && (e.ev === 'hit' || e.ev === 'guarded' || e.ev === 'dodged')) {
      const inside = wins.some(([a, b]) => e.t > a && e.t < b);
      if (inside) { inWin++; if (e.ev === 'hit') inHit++; } else { outAll++; if (e.ev === 'hit') outHit++; }
    }
  }
  assert.ok(inWin >= 10, `${inWin} blows inside a freeze`); assert.equal(inHit, inWin, 'every blow inside a freeze lands');
  assert.ok(outAll > inWin, `${outAll} blows outside a freeze against ${inWin} inside`); assert.equal(outHit, 0, `${outHit} of ${outAll} blows outside a freeze land: the foe guards or dodges every one there`);
});

test('GC-4 / GC-5: the weapon families of the curse and the paralysis in a duel, told with their words in both languages, their sounds and looks borrowed (the Cry, Vessa’s Tempo)', () => {
  for (const [fam, st] of [['hex', 'curse'], ['numb', 'paralysis']]) {
    const inf = AD.STATE_WEAPON_FAMILIES[fam]; assert.equal(inf.state, st);
    AD.AUTO_GEAR_FX.__w = { inflict: inf };
    try {
      const fx = AD.autoGearFx(['__w']); assert.deepEqual(fx.inflict, inf);
      assert.deepEqual(AD.autoStatesOf({ skills: [], gfx: fx }), [{ state: st, from: 'weapon' }]);
    } finally { delete AD.AUTO_GEAR_FX.__w; }
    assert.equal(T.tx(SC.STATE_NAME[st]), { curse: 'Curse', paralysis: 'Paralysis' }[st]);
    assert.equal(inFrench(() => T.tx(SC.STATE_NAME[st])), { curse: 'Malédiction', paralysis: 'Paralysie' }[st]);
  }
  assert.deepEqual(SFX.sfxOf({ type: 'state', state: 'curse', who: 'ren' }, 5).map((c) => c.id), ['k_cry']);
  assert.deepEqual(SFX.sfxOf({ type: 'state', state: 'paralysis', who: 'foe' }, 5).map((c) => c.id), ['m_tempo']);
  // the arena's words over the fighter, English and French (GC-5): Cursed, Paralysed and Frozen; Maudit, Paralysé, Figé
  const src = joined('src/arena/AutoHud.ts');
  assert.ok(src.includes("curse: 'Cursed', paralysis: 'Paralysed' }, missed: 'Missed', frozen: 'Frozen'") && src.includes("curse: 'Maudit', paralysis: 'Paralysé' }, missed: 'Manqué', frozen: 'Figé'"));
});

test('GC-1 / GC-3 / GC-5: the arena tells the curse, the paralysis and each frozen action; a card’s states are the script’s', () => {
  const ren = fighter({ id: 'ren', hp: 5000, light: A({ charge: 1.2, power: 5, inflict: { state: 'paralysis', chance: 1 } }) });
  const foe = dummy({ id: 'marek', hp: 5000, light: A({ id: 'm_light', charge: 1.5, power: 5, inflict: { state: 'curse', chance: 1 } }) });
  const res = AU.autoDuel(ren, foe, 3, { log: true, trace: true, rules: { ...AU.AUTO_RULES, maxT: 60 } });
  const rp = new AV.AutoReplay(res, { ren, marek: foe }), evs = [];
  let checked = 0;
  for (let i = 0; i < 1e5 && !rp.over && rp.t < 50; i++) {
    rp.step(rp.D.dt); evs.push(...rp.drain());
    const h = rp.hud(), live = (who, id) => res.log.filter((e) => e.ev === 'afflict' && e.state === id && e.who !== who && e.t <= rp.t + 1e-9).some((e) => e.t + e.len > rp.t + 1e-9);
    for (const [seat, id] of [['marek', 'paralysis'], ['ren', 'curse']]) { assert.equal(!!h[seat].states?.some((x) => x.id === id), live(seat, id), `${seat} ${id} at ${rp.t}`); checked++; }
  }
  assert.ok(checked > 1000);
  assert.ok(evs.some((e) => e.type === 'state' && e.state === 'paralysis' && e.who === 'marek') && evs.some((e) => e.type === 'state' && e.state === 'curse' && e.who === 'ren'));
  const told = evs.filter((e) => e.type === 'freeze'), logged = res.log.filter((e) => e.ev === 'freeze' && e.t <= rp.t + 1e-9);
  assert.ok(told.length > 0 && told.length === logged.length && told.every((e) => e.who === 'marek' && e.dur === AU.AUTO_RULES.states.paralysis.freeze && e.action), `${told.length} frozen actions told of ${logged.length}`);
});
