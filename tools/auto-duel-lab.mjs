// The combat workshop's measuring tool (journal Passe AC1, briefs/combat-auto.md): the prototype of the duel played by the computer on a timeline
// (tools/auto-duel/sim.mjs), fed by the game's own data, measured on isolated duels and on whole games of the TournamentLab. Not the game: nothing
// in src/ reads it; the construction, after the operator's sheet, ports what he keeps. Node only, no browser.
//   node tools/auto-duel-lab.mjs refs [--policies=idle,diligent,curious,planner] [--seeds=1..30] [--json=f]
//       the player each policy really is at each bout of a whole game (today's duel): his stats, his kit's levels, his gear's AP, the rival's
//       sheet and preparation; medians by stage (the « reachable reference player » of the AU5 proposal 5)
//   node tools/auto-duel-lab.mjs duels [--stage=0|1|2] [--ren=hp,atk,def,end,viv] [--levels=1] [--loadout=t1,t4,d1,s1] [--foes=...] [--decider=auto|semi|careless] [--seeds=1..100]
//       isolated duels of a Ren against the stage's rivals: wins, length, actions, breaks, turns
//   node tools/auto-duel-lab.mjs games [--policies=...] [--seeds=1..50] [--decider=auto]
//       whole games of the TournamentLab, the player's bouts and challenges fought in the prototype (the off-screen matches keep today's race):
//       the stages won, the cut, the final, the title, the bouts' length
//   node tools/auto-duel-lab.mjs offscreen [--seeds=1..40]
//       every pair of rivals in the prototype at each stage against today's race (raceWinChance of V2_RACERS), and its cost (ms a duel)
//   every command: --set=<path>=<value>[,<path>=<value>] changes RULES (sim.mjs) or KIT (kits.mjs) or GROWTH (here), e.g.
//       --set=defence=alert,ap.mode=none,KIT.foePower=0.6,GROWTH.1.hp=1.4
import fs from 'node:fs';
import { duel, RULES, DECIDERS } from './auto-duel/sim.mjs';
import { loadGame, renFighter, foeFighter, KIT } from './auto-duel/kits.mjs';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const range = (s) => { const m = s.match(/^(\d+)\.\.(\d+)$/); return m ? Array.from({ length: +m[2] - +m[1] + 1 }, (_, i) => +m[1] + i) : s.split(',').map(Number); };
const med = (a) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
const pct = (a, n) => (n ? (100 * a) / n : NaN);
const q = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };

const M = await loadGame();
/** the rivals' growth by stage (src/combat/stats.ts STAGE_GROWTH by default: DB13's x1.7 / x3.5 and their points); `--set=GROWTH.1.hp=...` */
export const GROWTH = JSON.parse(JSON.stringify(M.stats.STAGE_GROWTH));

// --set
for (const kv of (arg('set', '') || '').split(',').filter(Boolean)) {
  const [p, v] = kv.split('='), path = p.split('.');
  const root = path[0] === 'KIT' ? KIT : path[0] === 'GROWTH' ? GROWTH : RULES, keys = path[0] === 'KIT' || path[0] === 'GROWTH' ? path.slice(1) : path;
  let o = root; for (const k of keys.slice(0, -1)) o = o[k];
  const val = v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v;
  o[keys[keys.length - 1]] = val;
}

/** a rival's sheet at a stage under GROWTH */
function sheetAt(id, stage) {
  const b = M.stats.RIVAL_SHEETS[id] ?? M.stats.RIVAL_SHEETS.marek, g = GROWTH[stage];
  return { hp: b.hp * g.hp, atk: b.atk + g.atk, def: b.def + g.def, end: b.end + g.end, viv: b.viv + g.viv };
}
const decider = (n) => DECIDERS[n] ?? DECIDERS.auto;

/** a duel's outcome as the game takes it (DuelOutcome); a duel past maxT decided on the health shares */
function outcomeOf(r) {
  const win = r.winIdx != null ? r.winIdx === 0 : r.hp[0] / r.maxHp[0] >= r.hp[1] / r.maxHp[1];
  return { winner: win ? 'player' : 'opponent', playerHp: r.hp[0], playerMaxHp: r.maxHp[0], opponentHp: r.hp[1], opponentMaxHp: r.maxHp[1], finisher: r.finisher };
}

/** the player's bout or challenge of a game state, fought in the prototype */
function stateDuel(st, kind, dname) {
  const sh = kind === 'challenge' ? M.match.challengeSheetFor(st) : M.match.matchSheetFor(st);
  const o = sh.sides[1].fighters[0], stage = sh.stage ?? 0, mods = M.gear.v2Mods(st), g = M.generics.GENERICS[o.id];
  const ren = renFighter(M, mods.stats, M.v2.v2KitOf(st), { hpShare: mods.hp, apStart: mods.ap ?? 0, taken: mods.taken, effect: mods.effect, decider: decider(dname), cooldownK: RULES.cooldownK, lightCharge: RULES.light.charge });
  const foe = g ? foeFighter(M, o.id, stage, { sheet: M.stats.borrowedSheet(g.profile, g, stage), profile: g.profile, decider: DECIDERS.rival })
    : foeFighter(M, o.id, stage, { sheet: sheetAt(o.id, stage), mods: o.mods, preparation: st.competitors[o.id]?.preparation, decider: DECIDERS.rival });
  const r = duel(ren, foe, (sh.seed ^ 0x5bd1e995) >>> 0, RULES);
  return { r, out: outcomeOf(r), stage, foe: o.id, ren: mods.stats, kit: M.v2.v2KitOf(st), prep: st.competitors[o.id]?.preparation ?? null };
}

// ------------------------------------------------------------------------------------------------------------------------------- refs
async function refs() {
  const pols = arg('policies', 'idle,diligent,curious,planner').split(','), seeds = range(arg('seeds', '1..30')), out = {};
  for (const pn of pols) {
    const P = M.lab.POLICIES[pn], rows = [];
    const wrap = { name: pn, skill: P.skill, choose: (st) => { const a = P.choose(st); if (a.type === 'fight') { const sh = M.match.matchSheetFor(st), mods = M.gear.v2Mods(st), opp = sh.sides[1].fighters[0].id; rows.push({ day: st.day, stage: sh.stage ?? 0, opp, ren: mods.stats, hpShare: mods.hp, ap: mods.ap, levels: M.v2.v2KitOf(st).levels, loadout: M.v2.v2KitOf(st).loadout, prep: st.competitors[opp]?.preparation, oppMods: sh.sides[1].fighters[0].mods, won: a.outcome.winner === 'player' }); } return a; } };
    for (const s of seeds) M.lab.autoplay(s, wrap, 'Ren', 200, 'v2');
    const byStage = {};
    for (const st of [0, 1, 2]) {
      const R = rows.filter((x) => x.stage === st);
      if (!R.length) continue;
      const m = (f) => +med(R.map(f)).toFixed(2);
      byStage[st] = { n: R.length, hp: m((x) => x.ren.hp * x.hpShare), atk: m((x) => x.ren.atk), def: m((x) => x.ren.def), end: m((x) => x.ren.end), viv: m((x) => x.ren.viv), ap: m((x) => x.ap), maxLevel: m((x) => Math.max(...x.loadout.map((id) => x.levels[id] ?? 1))), prep: m((x) => x.prep ?? 0), dmgMod: m((x) => x.oppMods.damage ?? 1), wonToday: +pct(R.filter((x) => x.won).length, R.length).toFixed(0) };
    }
    const byDay = {};
    for (const x of rows) (byDay[x.day] ??= []).push(x);
    out[pn] = { byStage, byDay: Object.fromEntries(Object.entries(byDay).map(([d, R]) => [d, { n: R.length, hp: med(R.map((x) => x.ren.hp * x.hpShare)), atk: med(R.map((x) => x.ren.atk)), def: med(R.map((x) => x.ren.def)), opp: Object.entries(R.reduce((c, x) => ((c[x.opp] = (c[x.opp] ?? 0) + 1), c), {})).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([k, v]) => `${k} ${v}`).join(' ') }])) };
    console.log(`${pn}:`);
    for (const [st, v] of Object.entries(byStage)) console.log(`  stage ${st}  n ${v.n}  PV ${v.hp}  Atq ${v.atk}  Déf ${v.def}  End ${v.end}  Viv ${v.viv}  PA+ ${v.ap}  niv. max ${v.maxLevel}  prépa du rival ${v.prep} (coups x${v.dmgMod})  gagnés (duel d'aujourd'hui) ${v.wonToday} %`);
    for (const [d, v] of Object.entries(out[pn].byDay)) console.log(`    jour ${d}: n ${v.n}, PV ${v.hp}, Atq ${v.atk}, Déf ${v.def} - ${v.opp}`);
  }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
}

// ------------------------------------------------------------------------------------------------------------------------------- duels
/** isolated duels: a Ren (stats, kit) against each rival of a stage; returns the rows and the totals */
export function duelsOf({ ren, levels = 1, loadout = ['t1', 't4', 'd1', 's1'], stage = 0, foes = ['vessa', 'tobin', 'cassius', 'orla', 'ilse', 'marek', 'rhosk'], dname = 'auto', seeds = range('1..100'), prep = 20, apStart = 0 }) {
  const kit = { loadout, levels: Object.fromEntries([...new Set([...loadout, 'heavy'])].map((id) => [id, levels])) };
  const rows = [], all = { w: 0, n: 0, t: [], acts: [], skills: [], fb: [], rb: [], turns: [], left: [] };
  for (const id of foes) {
    const r0 = { id, w: 0, n: 0, t: [], acts: [], skills: [], fb: [], rb: [], turns: [], left: [] };
    for (const s of seeds) {
      const A = renFighter(M, ren, kit, { decider: decider(dname), apStart, cooldownK: RULES.cooldownK, lightCharge: RULES.light.charge });
      const B = foeFighter(M, id, stage, { sheet: sheetAt(id, stage), mods: { damage: 1 + prep / 400 }, preparation: prep, decider: DECIDERS.rival });
      const r = duel(A, B, 7000 + s * 131 + stage, RULES), win = outcomeOf(r).winner === 'player';
      for (const o of [r0, all]) { o.n++; if (win) { o.w++; o.left.push(r.hp[0] / r.maxHp[0]); } o.t.push(r.t); o.acts.push(r.n[0].acts + r.n[1].acts); o.skills.push(r.n[0].skills); o.fb.push(r.n[1].breaks); o.rb.push(r.n[0].breaks); o.turns.push(r.leadChanges); }
    }
    rows.push(r0);
  }
  return { rows, all };
}
function printDuels(D, label) {
  const line = (o) => `${(o.id ?? 'tous').padEnd(8)} gagnés ${pct(o.w, o.n).toFixed(0).padStart(3)} %  durée méd. ${med(o.t).toFixed(0).padStart(3)} s (p10 ${q(o.t, 0.1).toFixed(0)} - p90 ${q(o.t, 0.9).toFixed(0)})  actions ${med(o.acts)}  compétences de Ren ${med(o.skills)}  ruptures adv. ${(o.fb.reduce((a, b) => a + b, 0) / o.n).toFixed(2)} / Ren ${(o.rb.reduce((a, b) => a + b, 0) / o.n).toFixed(2)}  retournements ${(o.turns.reduce((a, b) => a + b, 0) / o.n).toFixed(2)}  PV restants (victoires) ${o.left.length ? (100 * med(o.left)).toFixed(0) : '-'} %`;
  console.log(label);
  for (const r of D.rows) console.log('  ' + line(r));
  console.log('  ' + line(D.all));
}
function duels() {
  const ren = arg('ren') ? Object.fromEntries(['hp', 'atk', 'def', 'end', 'viv'].map((k, i) => [k, +arg('ren').split(',')[i]])) : M.stats.REN_BASE;
  const D = duelsOf({ ren, levels: +arg('levels', '1'), loadout: arg('loadout', 't1,t4,d1,s1').split(','), stage: +arg('stage', '0'), foes: arg('foes', 'vessa,tobin,cassius,orla,ilse,marek,rhosk').split(','), dname: arg('decider', 'auto'), seeds: range(arg('seeds', '1..100')), prep: +arg('prep', '20'), apStart: +arg('ap', '0') });
  printDuels(D, `Ren ${JSON.stringify(ren)} niv. ${arg('levels', '1')} ${arg('loadout', 't1,t4,d1,s1')} - étape ${arg('stage', '0')} - ${arg('decider', 'auto')}`);
}

// ------------------------------------------------------------------------------------------------------------------------------- games
/** the workshop's reference player (AU5 proposal 5: « un joueur de référence réellement atteignable »): the TournamentLab's planner (the DB7 curve's
 *  gear bought with the town's jobs, two sessions before each bout), with two habits a player who prepares has and the planner lacks (audit § 2.3):
 *  it has Hilde look at its gear on the morning of a bout of the bracket or once a sign was seen (5 coins), and it drills the skills it brings (the
 *  planner drills the heavy attack, which it does not bring) */
function referencePolicy() {
  const P = M.lab.POLICIES.planner, ok = (st, a) => M.sim.actions(st).some((o) => o.ok && JSON.stringify(o.action) === JSON.stringify(a));
  return { name: 'reference', skill: 0.6, choose: (st) => {
    const bout = st.tournament.matches.some((m) => m.day === st.day && !m.winner && (m.a === 'player' || m.b === 'player'));
    const signs = ['armour-asked', 'locker-open', 'friend-warned-gear'].some((f) => st.facts.includes(f));
    if (st.slot === 'morning' && bout && (st.day >= 6 || signs) && !st.flags[`checked:${st.day}`]) {
      const there = st.place === 'forecourt' ? st : { ...st, place: 'forecourt' };
      if (ok(there, { type: 'checkGear' })) { if (st.place === 'forecourt') return { type: 'checkGear' }; if (ok(st, { type: 'move', to: 'forecourt' })) return { type: 'move', to: 'forecourt' }; }
    }
    const a = P.choose(st);
    if (a.type === 'drillSkill' && !M.v2.v2KitOf(st).loadout.includes(a.skill)) for (const k of ['t4', 't1']) if (ok(st, { type: 'drillSkill', skill: k })) return { type: 'drillSkill', skill: k };
    return a;
  } };
}
const policyOf = (pn) => (pn === 'reference' ? referencePolicy() : M.lab.POLICIES[pn]);

/** whole games with the player's bouts and challenges in the prototype */
export function gamesOf(pn, seeds, dname = 'auto') {
  const P = policyOf(pn), bouts = [];
  const wrap = { name: pn, skill: P.skill, choose: (st) => {
    const a = P.choose(st);
    if (a.type === 'fight' || a.type === 'challengeResult') { const d = stateDuel(st, a.type === 'fight' ? 'bout' : 'challenge', dname); const mm = M.gear.v2Mods(st); bouts.push({ kind: a.type, day: st.day, stage: d.stage, foe: d.foe, won: d.out.winner === 'player', t: d.r.t, acts: d.r.n[0].acts + d.r.n[1].acts, taken: mm.taken, hpShare: mm.hp, hp: Math.round(mm.stats.hp * mm.hp), prep: d.prep, skills: d.r.n[0].skills, breaks: d.r.n[1].breaks, renBreaks: d.r.n[0].breaks, turns: d.r.leadChanges }); return { ...a, outcome: d.out }; }
    return a;
  } };
  let crowns = 0, finals = 0, cut = 0;
  const stageWins = {};
  for (const s of seeds) {
    const g = M.lab.autoplay(s, wrap, 'Ren', 220, 'v2'), st = g.state, mine = st.tournament.matches.filter((m) => m.a === 'player' || m.b === 'player');
    if (st.flags.champion === 'player') crowns++;
    if (mine.some((m) => m.stage === 'final')) finals++;
    if (mine.some((m) => m.stage === 'semi')) cut++;
    for (const m of mine) { const k = m.stage ?? `pool-j${m.day}`; (stageWins[k] ??= { w: 0, n: 0 }); stageWins[k].n++; if (m.winner === 'player') stageWins[k].w++; }
  }
  return { pn, n: seeds.length, crowns, finals, cut, stageWins, bouts };
}
function games() {
  const seeds = range(arg('seeds', '1..50')), dname = arg('decider', 'auto');
  for (const pn of arg('policies', 'idle,diligent,curious,planner').split(',')) {
    const G = gamesOf(pn, seeds, dname), B = G.bouts.filter((b) => b.kind === 'fight'), C = G.bouts.filter((b) => b.kind === 'challengeResult');
    const sw = Object.entries(G.stageWins).sort().map(([k, v]) => `${k} ${pct(v.w, v.n).toFixed(0)} % (${v.n})`).join(' · ');
    console.log(`${pn.padEnd(8)} titres ${G.crowns}/${G.n} (${pct(G.crowns, G.n).toFixed(0)} %)  finales ${G.finals}  demi-finales ${G.cut}  combats gagnés ${pct(B.filter((b) => b.won).length, B.length).toFixed(0)} %  durée méd. ${med(B.map((b) => b.t)).toFixed(0)} s (p90 ${q(B.map((b) => b.t), 0.9).toFixed(0)})${C.length ? `  défis ${C.filter((b) => b.won).length}/${C.length}` : ''}`);
    console.log(`         ${sw}`);
    for (const d of [2, 4, 5, 6, 8, 10]) {
      const X = B.filter((b) => b.day === d), by = {};
      if (!X.length) continue;
      for (const b of X) { by[b.foe] ??= { w: 0, n: 0 }; by[b.foe].n++; if (b.won) by[b.foe].w++; }
      const foes = Object.entries(by).sort((a, b) => b[1].n - a[1].n).map(([k, v]) => `${k} ${v.w}/${v.n}`).join(', ');
      console.log(`         jour ${d} : ${foes} ; sangle coupée ${X.filter((b) => b.taken > 1).length}, blessé ${X.filter((b) => b.hpShare < 1).length}, PV méd. ${med(X.map((b) => b.hp))}, prépa adv. méd. ${med(X.map((b) => b.prep ?? 0))}, durée méd. ${med(X.map((b) => b.t)).toFixed(0)} s, comp. ${med(X.map((b) => b.skills))}, ruptures adv. ${(X.reduce((n, b) => n + b.breaks, 0) / X.length).toFixed(2)}`);
    }
  }
}

// ------------------------------------------------------------------------------------------------------------------------------- offscreen
function offscreen() {
  const ids = Object.keys(M.stats.RIVAL_SHEETS), seeds = range(arg('seeds', '1..40'));
  let ms = 0, n = 0, diff = 0, pairs = 0, agree = 0, upP = 0, upR = 0;
  for (const stage of [0, 1, 2]) {
    console.log(`étape ${stage} : P(ligne gagne colonne), prototype / course d'aujourd'hui`);
    console.log('         ' + ids.map((b) => b.slice(0, 7).padEnd(11)).join(''));
    for (const a of ids) {
      const cells = [];
      for (const b of ids) {
        if (a === b) { cells.push('    -      '); continue; }
        let w = 0; const t0 = performance.now();
        for (const s of seeds) { const A = foeFighter(M, a, stage, { sheet: sheetAt(a, stage), decider: DECIDERS.rival }), B = foeFighter(M, b, stage, { sheet: sheetAt(b, stage), decider: DECIDERS.rival }); B.id = b + '#'; const r = duel(A, B, 900 + s, RULES); if (outcomeOf(r).winner === 'player') w++; }
        ms += performance.now() - t0; n += seeds.length;
        const p = w / seeds.length, race = M.prof.raceWinChance(M.v2duel.v2RacerOf(a), M.v2duel.v2RacerOf(b), 0, M.v2duel.V2_RACE_SLOPE);
        diff += Math.abs(p - race); pairs++; upP += Math.min(p, 1 - p); upR += Math.min(race, 1 - race); if ((p >= 0.5) === (race >= 0.5)) agree++;
        cells.push(`${(100 * p).toFixed(0).padStart(3)} / ${(100 * race).toFixed(0).padStart(3)}  `);
      }
      console.log(a.slice(0, 7).padEnd(9) + cells.join(''));
    }
  }
  console.log(`coût : ${(ms / n).toFixed(2)} ms par duel (Node, indicatif) ; écart moyen à la course ${(100 * diff / pairs).toFixed(0)} points ; même favori ${agree}/${pairs} ; chance moyenne du moins fort : prototype ${(100 * upP / pairs).toFixed(1)} %, course ${(100 * upR / pairs).toFixed(1)} %`);
}

// ------------------------------------------------------------------------------------------------------------------------------- calibrate
/** the reachable reference players, measured by `refs` on seeds 1..30 (journal Passe AC1): the median of each policy's Ren at its bouts of each
 *  stage, today's duel deciding the wins (his vigour); the planner's final is its plan's own (one finalist in 30: its gear is its plan's), the rival's
 *  preparation at each stage the median met (55, 90, 100) */
export const REFS = {
  idle: [{ hp: 300, atk: 10, def: 10, end: 10, viv: 10, lv: 1 }, { hp: 278, atk: 10, def: 10, end: 10, viv: 10, lv: 1 }, { hp: 300, atk: 10, def: 10, end: 10, viv: 10, lv: 1 }],
  diligent: [{ hp: 324, atk: 11, def: 12, end: 10, viv: 10, lv: 1 }, { hp: 372, atk: 11, def: 11, end: 10, viv: 10, lv: 1 }, { hp: 396, atk: 11, def: 14, end: 10, viv: 9.5, lv: 1 }],
  curious: [{ hp: 372, atk: 10, def: 12, end: 12, viv: 10, lv: 1 }, { hp: 478, atk: 10, def: 13.5, end: 12, viv: 9.5, lv: 1 }, { hp: 550, atk: 10, def: 13.5, end: 12, viv: 9.5, lv: 1 }],
  planner: [{ hp: 324, atk: 14, def: 13, end: 10, viv: 9.5, lv: 1 }, { hp: 390, atk: 14, def: 13, end: 10, viv: 9.5, lv: 1 }, { hp: 414, atk: 16.5, def: 14, end: 12, viv: 9.5, lv: 1 }],
};
export const STAGE_PREP = [55, 90, 100];
/** the rivals met at each stage (the pool's fixed order; the bracket's semi-final and third place; the final), as the whole games meet them */
/** weighted by how often each is met (refs, the planner and the curious: the semi-final mostly Vessa, the final mostly Marek);  */
export const STAGE_FOES = (arg('stagefoes', '') || 'vessa,orla,cassius;vessa,vessa,vessa,vessa,ilse;marek,marek,marek,vessa').split(';').map((x) => x.split(','));
/** a reference's win rate against a stage's rivals */
export function stageRate(pn, stage, seeds = range('1..60'), dname = 'auto') {
  const r = REFS[pn][stage], D = duelsOf({ ren: r, levels: r.lv, stage, foes: STAGE_FOES[stage], seeds, prep: STAGE_PREP[stage], dname });
  return { p: D.all.w / D.all.n, t: med(D.all.t), D };
}
/** the curve: the rivals' power (KIT.foePower) for the pool's target, then each stage's health growth (GROWTH[s].hp, with `p1` / `p2` points to
 *  Attack, Defence and Endurance), by bisection on the reference's win rate; prints the curve for every reference */
export function calibrate(targets = [0.85, 0.65, 0.5], ref = 'planner', pts = [0, 2, 3], quiet = false) {
  const bis = (set, lo, hi, stage, t) => { for (let i = 0; i < 14; i++) { const m = (lo + hi) / 2; set(m); if (stageRate(ref, stage).p > t) lo = m; else hi = m; } set((lo + hi) / 2); return (lo + hi) / 2; };
  bis((v) => { KIT.foePower = v; }, 0.2, 2.5, 0, targets[0]);
  for (const s of [1, 2]) { GROWTH[s].atk = pts[s]; GROWTH[s].def = pts[s]; GROWTH[s].end = pts[s]; bis((v) => { GROWTH[s].hp = v; }, 0.3, 5, s, targets[s]); }
  if (!quiet) {
    console.log(`courbe calée sur ${ref} (${targets.map((x) => Math.round(100 * x)).join(' / ')} %) : puissance des rivaux x${KIT.foePower.toFixed(3)} ; tableau PV x${GROWTH[1].hp.toFixed(3)} +${pts[1]} ; finale PV x${GROWTH[2].hp.toFixed(3)} +${pts[2]}`);
    for (const pn of Object.keys(REFS)) console.log(`  ${pn.padEnd(8)} ${[0, 1, 2].map((s) => { const r = stageRate(pn, s); return `${(100 * r.p).toFixed(0).padStart(3)} % ${r.t.toFixed(0).padStart(3)} s`; }).join(' | ')}`);
  }
  return { foePower: KIT.foePower, growth: JSON.parse(JSON.stringify(GROWTH)) };
}

/** the curve fitted on WHOLE games of the reference policy (the audit's lesson, journal Passe AU1: a curve fitted on isolated duels misses what the game
 *  adds — who is met, the strap cut, the wins' vigour): the rivals' power for the pool's rate (days 2, 4, 5), then the bracket's health growth for the
 *  semi-final's rate, then the final's for the final's; calibration seeds `fitSeeds`, the curve then printed on held-out seeds for every policy */
function fit(targets, pts, fitSeeds, heldSeeds, ref = 'reference') {
  const rate = (G, keys) => { let w = 0, n = 0; for (const k of keys) { const v = G.stageWins[k]; if (v) { w += v.w; n += v.n; } } return n ? w / n : NaN; };
  const bis = (set, lo, hi, keys, t, label) => {
    for (let i = 0; i < 9; i++) { const m = (lo + hi) / 2; set(m); const p = rate(gamesOf(ref, fitSeeds), keys); if (p > t) lo = m; else hi = m; }
    set((lo + hi) / 2); console.log(`  ${label} = ${((lo + hi) / 2).toFixed(3)}`); return (lo + hi) / 2;
  };
  console.log(`calage sur ${ref}, graines ${fitSeeds[0]}..${fitSeeds[fitSeeds.length - 1]} : poule ${targets[0] * 100} %, demi-finale ${targets[1] * 100} %, finale ${targets[2] * 100} %`);
  bis((v) => { KIT.foePower = v; }, 0.2, 2.5, ['pool-j2', 'pool-j4', 'pool-j5'], targets[0], 'puissance des rivaux');
  GROWTH[1].atk = GROWTH[1].def = GROWTH[1].end = pts[1];
  bis((v) => { GROWTH[1].hp = v; }, 0.4, 4, ['semi'], targets[1], `tableau PV x (avec +${pts[1]})`);
  GROWTH[2].atk = GROWTH[2].def = GROWTH[2].end = pts[2];
  bis((v) => { GROWTH[2].hp = v; }, 0.4, 5, ['final'], targets[2], `finale PV x (avec +${pts[2]})`);
  console.log(`--set=KIT.foePower=${KIT.foePower.toFixed(3)},GROWTH.1.hp=${GROWTH[1].hp.toFixed(3)},GROWTH.1.atk=${pts[1]},GROWTH.1.def=${pts[1]},GROWTH.1.end=${pts[1]},GROWTH.2.hp=${GROWTH[2].hp.toFixed(3)},GROWTH.2.atk=${pts[2]},GROWTH.2.def=${pts[2]},GROWTH.2.end=${pts[2]}`);
  console.log(`graines tenues à part ${heldSeeds[0]}..${heldSeeds[heldSeeds.length - 1]} :`);
  for (const pn of ['idle', 'diligent', 'curious', 'planner', 'reference']) {
    const G = gamesOf(pn, heldSeeds), B = G.bouts.filter((b) => b.kind === 'fight'), r = (keys) => (100 * rate(G, keys)).toFixed(0);
    console.log(`  ${pn.padEnd(9)} titres ${(100 * G.crowns / G.n).toFixed(0).padStart(3)} %  poule ${r(['pool-j2', 'pool-j4', 'pool-j5'])} %  demi ${r(['semi'])} %  3e ${r(['third'])} %  finale ${r(['final'])} % (${G.stageWins.final?.n ?? 0})  durées poule / tableau / finale ${['pool', 1, 2].map((s) => med(B.filter((b) => (s === 'pool' ? b.stage === 0 : b.stage === s)).map((b) => b.t)).toFixed(0)).join(' / ')} s`);
  }
}

/** each variant of the sheet's cards on whole games, over the curve given by --set: `label=path=value&path=value;label2=...` (a variant's own sets on top) */
function variants(spec, pols, seeds) {
  const snap = () => JSON.stringify({ R: RULES, K: KIT, G: GROWTH }), base = snap();
  const restore = () => { const o = JSON.parse(base); Object.assign(RULES, o.R); Object.assign(KIT, o.K); for (const k of Object.keys(GROWTH)) GROWTH[k] = o.G[k]; };
  const apply = (sets) => { for (const kv of sets.split('&').filter(Boolean)) { const [p, v] = kv.split('='), path = p.split('.'); const root = path[0] === 'KIT' ? KIT : path[0] === 'GROWTH' ? GROWTH : RULES, keys = path[0] === 'KIT' || path[0] === 'GROWTH' ? path.slice(1) : path; let o = root; for (const k of keys.slice(0, -1)) o = o[k]; o[keys[keys.length - 1]] = v === 'true' ? true : v === 'false' ? false : isNaN(+v) ? v : +v; } };
  const rate = (G, keys) => { let w = 0, n = 0; for (const k of keys) { const v = G.stageWins[k]; if (v) { w += v.w; n += v.n; } } return n ? Math.round((100 * w) / n) : NaN; };
  console.log('variante | politique | titres | poule | demi | finale | durée méd. poule / tableau / finale | compétences de Ren / duel | ruptures adv. / Ren | retournements');
  for (const part of spec.split(';')) {
    const [label, sets = ''] = part.split(/=(.*)/s);
    restore(); apply(sets);
    for (const pn of pols) {
      const dn = pn.includes(':') ? pn.split(':')[1] : 'auto', p = pn.split(':')[0], G = gamesOf(p, seeds, dn), B = G.bouts.filter((b) => b.kind === 'fight');
      const avg = (f) => (B.reduce((n, b) => n + f(b), 0) / B.length).toFixed(2);
      console.log(`${label} | ${pn} | ${Math.round((100 * G.crowns) / G.n)} % | ${rate(G, ['pool-j2', 'pool-j4', 'pool-j5'])} % | ${rate(G, ['semi'])} % | ${rate(G, ['final'])} % (${G.stageWins.final?.n ?? 0}) | ${[0, 1, 2].map((s) => med(B.filter((b) => b.stage === s).map((b) => b.t)).toFixed(0)).join(' / ')} s | ${med(B.map((b) => b.skills))} | ${avg((b) => b.breaks)} / ${avg((b) => b.renBreaks)} | ${avg((b) => b.turns)}`);
    }
  }
  restore();
}

const cmd = process.argv[2];
try {
  if (cmd === 'variants') variants(arg('variants', 'R0='), arg('policies', 'reference,idle').split(','), range(arg('seeds', '101..160')));
  else if (cmd === 'fit') fit(arg('targets', '85,65,50').split(',').map((x) => +x / 100), [0, +arg('p1', '1'), +arg('p2', '2')], range(arg('fitseeds', '1..40')), range(arg('seeds', '101..160')), arg('ref', 'reference'));
  else if (cmd === 'calibrate') calibrate(arg('targets', '85,65,50').split(',').map((x) => +x / 100), arg('ref', 'planner'), [0, +arg('p1', '2'), +arg('p2', '3')]);
  else if (cmd === 'refs') await refs();
  else if (cmd === 'duels') duels();
  else if (cmd === 'games') games();
  else if (cmd === 'offscreen') offscreen();
  else if (cmd !== 'lib') console.log('commands: refs | duels | games | offscreen (see the header)');
} finally { if (cmd !== 'lib') await M.server.close(); }
export { M, sheetAt, outcomeOf, stateDuel, range, med, q, pct };
