// The laboratory of the duel played by the computer (lot 1 of briefs/combat-auto.md § 17.3): the game's own duel (src/combat/auto.ts, autoData.ts,
// autoMatch.ts) measured on whole games of the TournamentLab (a version 2 game's, the default game's since lot 2: the player's bouts, his challenges and the off-screen bouts in the new duel)
// and on isolated duels. Node only, no browser. The workshop's prototype (tools/auto-duel-lab.mjs) measured the sheet; this one measures the game.
//   node tools/auto-lab.mjs games [--policies=reference,planner,curious,diligent,idle] [--seeds=101..160] [--json=f]
//       the stages won (days 2, 4, 5, the semi-final, the third place, the final), the titles, the bouts' length, skills, blows, breaks, turns, and the rhythm
//   node tools/auto-lab.mjs refs [--seeds=1..40]
//       the reference player at each bout of a whole game (his stats, weapon, levels, the rival's preparation): medians by day, the isolated duels' players
//   node tools/auto-lab.mjs rhythm [--seeds=1..20] [--day=4]
//       the rhythm of journal Passe AC4 (the reference of a day against the seven rivals): blows a minute, the gaps between blows, the longest silence of
//       a duel, the share of the time in silences over 3 s, the gaps between two big actions
//   node tools/auto-lab.mjs kits [--stage=2] [--seeds=1..60] [--kits=<name:a.b.c.d;...>]
//       the test of AC-12: preparations against each rival (isolated duels, the reference of the stage): the good answers and what dominates
//   node tools/auto-lab.mjs offscreen [--seeds=1..40]
//       every pair of rivals at each stage, the less strong's chance, the cost of a duel
//   node tools/auto-lab.mjs level [--t0=95] [--targets=65,50] [--fitseeds=1..80] [--seeds=101..160] [--keep-norm] [--out=f]
//       the race fitted (AC-16): each rival's pool factor on isolated duels against the reference of day 2, the pool's rounds +15 % (LC1-1, A3), the bracket's
//       and the final's factors on whole games of the reference, printed on held-out seeds; --keep-norm keeps the pool factors and fits the two stages alone
//   node tools/auto-lab.mjs modes [--seeds=101..300] [--auto=<name>] [--only=a,b]
//       the ways of deciding Ren's skills (tools/auto-tactics.mjs: the tactics of SY-08, random presses) against the automatic every fighter plays (`--auto` one of
//       AUTOS: a candidate automatic for every fighter, the rivals' included): the reference player's whole games, Ren's decider replaced (SY-07's two criteria)
//   every command: --set=<TABLE>.<path>=<value>[,...] changes RULES (AUTO_RULES), SKILLS (AUTO_SKILLS), FOES (AUTO_FOES), RACE (AUTO_RACE), WEAPONS
//       (AUTO_WEAPONS), LIGHT (AUTO_LIGHT); --race=<file.json> loads a race ({ norm, pool, stage })
import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';
import { makeTactics } from './auto-tactics.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const range = (s) => { const m = s.match(/^(\d+)\.\.(\d+)$/); return m ? Array.from({ length: +m[2] - +m[1] + 1 }, (_, i) => +m[1] + i) : s.split(',').map(Number); };
const q = (a, p) => { if (!a.length) return NaN; const s = [...a].sort((x, y) => x - y); return s[Math.min(s.length - 1, Math.floor(p * s.length))]; };
const med = (a) => q(a, 0.5);
const pct = (w, n) => (n ? Math.round((100 * w) / n) : NaN);

const server = await createServer({ root: ROOT, configFile: false, logLevel: 'error', appType: 'custom', cacheDir: 'node_modules/.vite-test', server: { middlewareMode: true, hmr: false, ws: false, watch: null }, optimizeDeps: { noDiscovery: true } });
const load = (f) => server.ssrLoadModule(f);
const AU = await load('/src/combat/auto.ts'), AD = await load('/src/combat/autoData.ts'), AM = await load('/src/combat/autoMatch.ts');
const LAB = await load('/src/tournament/lab.ts'), ST = await load('/src/combat/stats.ts'), V2 = await load('/src/simulation/v2.ts');
const TABLES = { CADENCE: AD.AUTO_CADENCE, RULES: AU.AUTO_RULES, SKILLS: AD.AUTO_SKILLS, FOES: AD.AUTO_FOES, RACE: AD.AUTO_RACE, WEAPONS: AD.AUTO_WEAPONS, LIGHT: AD.AUTO_LIGHT };
const RIVALS = Object.keys(ST.RIVAL_SHEETS);
export const TAC = makeTactics(AU);
/** candidate automatics for every fighter (SY-07): the game's, and tactics of the second workshop played by everyone */
export const AUTOS = {
  jeu: AU.autoDecider,
  rupture: TAC.tactic((x) => x.skills.map((s) => (s.ward || s.boost ? 'auto' : s === TAC.strongest(x) ? 'broken' : 'ready'))),
  signaux: TAC.tactic(TAC.cueSpec, { full: 'cheap' }),
  'soutiens-prets': TAC.tactic((x) => x.skills.map((s) => (s.boost ? 'ready' : s.ward ? 'auto' : 'ready'))),
};
/** run fn with every fighter's automatic set to `auto` and Ren's to `ren` (the game's DECIDERS), given back after */
export function withDeciders(auto, ren, fn) {
  const keep = { ...AU.DECIDERS };
  AU.DECIDERS.rival = auto; AU.DECIDERS.player = ren ?? auto;
  try { return fn(); } finally { Object.assign(AU.DECIDERS, keep); }
}

/** `--set=TABLE.a.b=v,...` (a value may be JSON: `SKILLS.d1.ward={"dur":9,"dmg":0.5,"gauge":0.5}`) */
export function applySets(spec) {
  for (const kv of (spec || '').split(/,(?![^{[]*[}\]])/).filter(Boolean)) {
    const i = kv.indexOf('='), p = kv.slice(0, i).split('.'), v = kv.slice(i + 1);
    let o = TABLES[p[0]]; if (!o) throw new Error(`no table ${p[0]} (${Object.keys(TABLES).join(', ')})`);
    for (const k of p.slice(1, -1)) o = o[k] ??= {};
    o[p[p.length - 1]] = v === 'true' ? true : v === 'false' ? false : v === 'undefined' ? undefined : /^[{[]/.test(v) ? JSON.parse(v) : isNaN(+v) ? v : +v;
  }
}
applySets(arg('set'));
if (arg('race')) Object.assign(AD.AUTO_RACE, JSON.parse(fs.readFileSync(arg('race'), 'utf8')));

// ------------------------------------------------------------------------------------------------------------------------------- the rhythm
const BIG = (e) => !['light', 'm_light', 'm_combo'].includes(e.act) && (e.hit ?? 1) === 1;
/** a duel's rhythm from its script: the blows' times (any fighter: hit, guarded, dodged), the gaps between them (from the start), the big actions */
export function rhythmOf(r) {
  const blows = r.log.filter((e) => e.ev === 'hit' || e.ev === 'guarded' || e.ev === 'dodged'), ts = blows.map((e) => e.t), big = blows.filter(BIG).map((e) => e.t);
  const gaps = [], bigGaps = []; let longest = 0, quiet = 0;
  for (let i = 0, p = 0; i < ts.length; p = ts[i], i++) { const d = ts[i] - p; gaps.push(d); longest = Math.max(longest, d); if (d > 3) quiet += d; }
  for (let i = 1; i < big.length; i++) bigGaps.push(big[i] - big[i - 1]);
  // every visible event (a blow, a ward or a boost raised, a break): the silences a person watching the duel sees
  const ev = r.log.filter((e) => e.ev !== 'charge').map((e) => e.t); let evLongest = 0, evQuiet = 0;
  for (let i = 0, p = 0; i < ev.length; p = ev[i], i++) { const d = ev[i] - p; evLongest = Math.max(evLongest, d); if (d > 3) evQuiet += d; }
  return { t: r.t, perMin: (ts.length / r.t) * 60, gaps, bigGaps, longest, quiet: quiet / r.t, evLongest, evQuiet: evQuiet / r.t };
}
export function rhythmSummary(R) {
  const all = R.flatMap((x) => x.gaps), big = R.flatMap((x) => x.bigGaps);
  return { duels: R.length, t: med(R.map((x) => x.t)), perMin: med(R.map((x) => x.perMin)), gap: med(all), gap90: q(all, 0.9), longest: med(R.map((x) => x.longest)), longest90: q(R.map((x) => x.longest), 0.9), longestMax: Math.max(...R.map((x) => x.longest)), quiet: med(R.map((x) => x.quiet)), big: med(big), big90: q(big, 0.9), evLongest: med(R.map((x) => x.evLongest)), evQuiet: med(R.map((x) => x.evQuiet)) };
}
export const rhythmLine = (s) => `${s.duels} duels, durée méd. ${s.t.toFixed(0)} s ; ${s.perMin.toFixed(1)} coups/min ; entre deux coups ${s.gap.toFixed(2)} s (p90 ${s.gap90.toFixed(2)}) ; plus long silence méd. ${s.longest.toFixed(1)} s (p90 ${s.longest90.toFixed(1)}, max ${s.longestMax.toFixed(1)}) ; silences > 3 s ${(100 * s.quiet).toFixed(1)} % du temps ; entre deux grosses actions ${s.big.toFixed(1)} s (p90 ${s.big90.toFixed(1)}) ; sans aucun événement : plus long ${s.evLongest.toFixed(1)} s, > 3 s ${(100 * s.evQuiet).toFixed(1)} %`;

// ------------------------------------------------------------------------------------------------------------------------------- whole games
/** whole games of a policy in the new duel: each bout and challenge fought with its script kept (for the rhythm), the stages won, the titles */
export function gamesOf(pn, seeds) {
  const P = LAB.POLICIES[pn]; if (!P) throw new Error(`no policy ${pn}`);
  const bouts = [];
  const wrap = { name: pn, skill: P.skill, choose: (st) => {
    const a = P.choose(st);
    if (a.type === 'fight' || a.type === 'challengeResult') {
      const kind = a.type === 'fight' ? 'bout' : 'challenge', o = AM.autoOutcome(st, kind, { log: true }), r = o.duel;
      bouts.push({ kind, day: st.day, stage: o.bout.stage, foe: o.bout.foeId, won: o.winner === 'player', t: r.t, skills: r.n[0].skills, hits: r.n[0].hits + r.n[1].hits, breaks: r.n[1].breaks, renBreaks: r.n[0].breaks, turns: r.leadChanges, rhythm: rhythmOf(r), ren: { hp: o.bout.ren.hp, atk: o.bout.ren.atk, def: o.bout.ren.def, end: o.bout.ren.end, viv: o.bout.ren.viv }, kit: o.bout.ren.skills.map((s) => s.id).join('.'), taken: o.bout.ren.taken });
      return { ...a, outcome: { winner: o.winner, playerHp: o.playerHp, playerMaxHp: o.playerMaxHp, opponentHp: o.opponentHp, opponentMaxHp: o.opponentMaxHp, finisher: o.finisher } };
    }
    return a;
  } };
  let crowns = 0, finals = 0, cut = 0; const stageWins = {};
  let skipped = 0;
  for (const s of seeds) {
    // a policy that chooses an action the game refuses (the curious player in the parade's street, under other bout results) is skipped and counted
    let st; try { st = LAB.autoplay(s, wrap, 'Ren', 260, 'auto').state; } catch (e) { if (!/refused action/.test(String(e))) throw e; skipped++; continue; }
    const mine = st.tournament.matches.filter((m) => m.a === 'player' || m.b === 'player');
    if (st.flags.champion === 'player') crowns++;
    if (mine.some((m) => m.stage === 'final')) finals++;
    if (mine.some((m) => m.stage === 'semi')) cut++;
    for (const m of mine) { const k = m.stage ?? `pool-j${m.day}`; (stageWins[k] ??= { w: 0, n: 0 }).n++; if (m.winner === 'player') stageWins[k].w++; }
  }
  return { pn, n: seeds.length - skipped, crowns, finals, cut, stageWins, bouts, skipped };
}
const rate = (G, keys) => { let w = 0, n = 0; for (const k of keys) { const v = G.stageWins[k]; if (v) { w += v.w; n += v.n; } } return n ? w / n : NaN; };
export function gamesLine(G) {
  const B = G.bouts.filter((b) => b.kind === 'bout'), r = (k) => pct(G.stageWins[k]?.w ?? 0, G.stageWins[k]?.n ?? 0);
  return `${G.pn.padEnd(9)} titres ${pct(G.crowns, G.n)} %  j2 ${r('pool-j2')} j4 ${r('pool-j4')} j5 ${r('pool-j5')}  demi ${r('semi')} %  3e ${r('third')} %  finale ${r('final')} % (${G.stageWins.final?.n ?? 0})  durées poule / tableau / finale ${[0, 1, 2].map((s) => med(B.filter((b) => b.stage === s).map((b) => b.t)).toFixed(0)).join(' / ')} s  comp. ${med(B.map((b) => b.skills))}  coups ${med(B.map((b) => b.hits))}  ruptures ${(B.reduce((n, b) => n + b.breaks, 0) / B.length).toFixed(2)} / ${(B.reduce((n, b) => n + b.renBreaks, 0) / B.length).toFixed(2)}  retournements ${(B.reduce((n, b) => n + b.turns, 0) / B.length).toFixed(1)}`;
}

// ------------------------------------------------------------------------------------------------------------------------------- the reference players
/** the reference player's Ren at his bouts, by day, as the whole games make him (refs): his stats, weapon, kit's levels, the rival's preparation (median) */
export function refsOf(seeds, pn = 'reference') {
  const P = LAB.POLICIES[pn], rows = [];
  const wrap = { name: pn, skill: P.skill, choose: (st) => {
    const a = P.choose(st);
    if (a.type === 'fight') { const b = AM.autoBoutOf(st, 'bout'); rows.push({ day: st.day, stage: b.stage, foe: b.foeId, ren: b.ren, weapon: st.v2?.gear?.weapon ?? 'training-sword', levels: V2.v2KitOf(st).levels, loadout: V2.v2KitOf(st).loadout, prep: st.competitors[b.foeId]?.preparation ?? 20, apStart: b.ren.apStart, taken: b.ren.taken }); }
    return a;
  } };
  for (const s of seeds) LAB.autoplay(s, wrap, 'Ren', 260, 'auto');
  const byDay = {};
  for (const x of rows) (byDay[x.day] ??= []).push(x);
  const out = {};
  for (const [d, R] of Object.entries(byDay)) {
    const m = (f) => +med(R.map(f)).toFixed(2), wc = {}; for (const x of R) wc[x.weapon] = (wc[x.weapon] ?? 0) + 1;
    out[d] = { n: R.length, stage: R[0].stage, hp: m((x) => x.ren.hp), atk: m((x) => x.ren.atk), def: m((x) => x.ren.def), end: m((x) => x.ren.end), viv: m((x) => x.ren.viv), apStart: m((x) => x.apStart), weapon: Object.entries(wc).sort((a, b) => b[1] - a[1])[0][0], t1: m((x) => x.levels.t1 ?? 1), t4: m((x) => x.levels.t4 ?? 1), prep: m((x) => x.prep), foes: Object.entries(R.reduce((c, x) => ((c[x.foe] = (c[x.foe] ?? 0) + 1), c), {})).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k} ${v}`).join(' ') };
  }
  return out;
}
/** the isolated duels' reference (measured by `refs` on seeds 1..40 with the race of journal Passe AC3, the reference policy): its median Ren on days 2, 4, 5, the
 *  bracket (day 6) and the final (day 10); the start kit at its median levels; the rival's median preparation */
export const REF = {
  2: { hp: 300, atk: 17, def: 11, end: 10, viv: 10, weapon: 'imported-blade', t1: 1, t4: 1, prep: 37 },
  4: { hp: 324, atk: 17, def: 17, end: 10, viv: 9, weapon: 'imported-blade', t1: 2, t4: 1, prep: 61 },
  5: { hp: 384, atk: 16, def: 16, end: 10, viv: 9, weapon: 'imported-blade', t1: 2, t4: 1, prep: 64 },
  6: { hp: 408, atk: 18, def: 16, end: 10, viv: 9, weapon: 'imported-blade', t1: 2, t4: 1, prep: 85 },
  10: { hp: 432, atk: 22, def: 17, end: 14, viv: 9, weapon: 'imported-blade', t1: 3, t4: 3, prep: 100 },
};
const STAGE_DAY = { 0: 4, 1: 6, 2: 10 };
/** isolated duels: a reference Ren (a day of REF) with a preparation (loadout, weapon, order) against a rival at its stage and round */
/** a weapon's stat points in this duel (the gear's own table, its points doubled by AC-11 since lot 2), to swap the reference's own weapon for another */
const GE = await load('/src/simulation/gear.ts');
export function weaponSwap(R, weapon) {
  if (!weapon || weapon === R.weapon) return R;
  const fx = (w) => GE.GEAR[w]?.fx ?? {}, k = 1, a = fx(R.weapon), b = fx(weapon), out = { ...R, weapon };
  for (const key of ['hp', 'atk', 'def', 'end', 'viv']) out[key] = +(R[key] + k * ((b[key] ?? 0) - (a[key] ?? 0))).toFixed(2);
  return out;
}
export function duelsOf({ day = 4, loadout = ['t1', 't4', 'd1', 's1'], weapon, foes = RIVALS, seeds = range('1..60'), stage, round, levels, log = false }) {
  const R = weaponSwap(REF[day], weapon), st = stage ?? (day >= 10 ? 2 : day >= 6 ? 1 : 0), rd = round ?? (st === 0 ? AD.autoRound(day) : 0);
  const lv = levels ?? Object.fromEntries([...loadout, 'heavy'].map((id) => [id, id === 't1' ? R.t1 : id === 't4' ? R.t4 : 1]));
  const rows = [];
  for (const id of foes) {
    const o = { id, w: 0, n: 0, t: [], rh: [] };
    for (const s of seeds) {
      const A = AD.autoRen(R, { loadout, levels: lv }, { weapon: R.weapon }), B = AD.autoFoe(id, AD.autoRaceSheet(id, st, rd, { preparation: R.prep }));
      const r = AU.autoDuel(A, B, 7000 + s * 131 + st * 7 + rd, { log });
      o.n++; if (AU.autoWinner(r) === 0) o.w++; o.t.push(r.t); if (log) o.rh.push(rhythmOf(r));
    }
    rows.push(o);
  }
  return rows;
}

// ------------------------------------------------------------------------------------------------------------------------------- commands
function games() {
  const seeds = range(arg('seeds', '101..160')), out = {};
  for (const pn of arg('policies', 'reference,planner,curious,diligent,idle').split(',')) {
    const G = gamesOf(pn, seeds); console.log(gamesLine(G));
    const R = G.bouts.filter((b) => b.kind === 'bout').map((b) => b.rhythm); console.log(`          rythme : ${rhythmLine(rhythmSummary(R))}`);
    out[pn] = { titles: G.crowns / G.n, stageWins: G.stageWins, rhythm: rhythmSummary(R) };
  }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
}
function refs() {
  const R = refsOf(range(arg('seeds', '1..40')), arg('policy', 'reference'));
  for (const [d, v] of Object.entries(R)) console.log(`jour ${d} (étape ${v.stage}, ${v.n}) : PV ${v.hp} Atq ${v.atk} Déf ${v.def} End ${v.end} Viv ${v.viv} PA+ ${v.apStart} ${v.weapon} Taille éclair niv. ${v.t1} Estoc niv. ${v.t4} ; prépa adv. ${v.prep} ; ${v.foes}`);
}
function rhythm() {
  const day = +arg('day', '4'), rows = duelsOf({ day, seeds: range(arg('seeds', '1..20')), log: true });
  console.log(`la référence du jour ${day} contre les sept rivaux : ${rhythmLine(rhythmSummary(rows.flatMap((r) => r.rh)))}`);
  for (const r of rows) console.log(`  ${r.id.padEnd(8)} gagnés ${pct(r.w, r.n)} %  ${rhythmLine(rhythmSummary(r.rh))}`);
}
/** the preparations of AC-12's table (briefs/combat-auto.md § 16.2) and the weapons */
export const KITS = {
  'départ': { loadout: ['t1', 't4', 'd1', 's1'] },
  'soutiens': { loadout: ['k_cry', 'k_focus', 't1', 't4'] },
  'offensives': { loadout: ['t1', 't2', 't3', 't4'] },
  'fracas': { loadout: ['k_sunder', 't1', 't4', 'd1'] },
  'feinte': { loadout: ['k_feint', 't2', 't4', 's1'] },
  'défensif': { loadout: ['t1', 'd1', 'k_iron', 's1'] },
  'épée': { loadout: ['t1', 't4', 'd1', 's1'], weapon: 'training-sword' },
  'lame': { loadout: ['t1', 't4', 'd1', 's1'], weapon: 'imported-blade' },
  'sabre': { loadout: ['t1', 't4', 'd1', 's1'], weapon: 'duelist-sabre' },
};
/** the rivals' level scaled by `f` for one measure (the pool's factors, or the stage's), given back after */
export function withLevel(stage, f, fn) {
  const R = AD.AUTO_RACE, keep = JSON.stringify({ norm: R.norm, stage: R.stage });
  if (stage === 0) for (const id of Object.keys(R.norm)) R.norm[id] *= f; else R.stage[stage] *= f;
  try { return fn(); } finally { const o = JSON.parse(keep); Object.assign(R.norm, o.norm); Object.assign(R.stage, o.stage); }
}
/** the level at which the start kit averages `target` against the seven rivals of the stage (bisection on f) */
export function levelFor(stage, target, seeds) {
  const day = STAGE_DAY[stage], avg = () => { const r = duelsOf({ day, seeds, stage }); return r.reduce((n, x) => n + x.w / x.n, 0) / r.length; };
  let lo = 0.3, hi = 3;
  for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; if (withLevel(stage, m, avg) > target) lo = m; else hi = m; }
  return (lo + hi) / 2;
}
export const STAGE_TARGET = { 0: 0.85, 1: 0.65, 2: 0.5 };
/** each rival alone at the level where the start kit wins `target` against it (its own factor on its sheet): AC-12's table then compares the preparations against
 *  each rival at the same strength for the start kit, whatever the race makes of that rival (journal Passe LC1) */
export function rivalLevels(stage, target, seeds) {
  const day = STAGE_DAY[stage], out = {}, R = AD.AUTO_RACE;
  for (const id of RIVALS) {
    const keep = R.norm[id]; let lo = 0.3, hi = 3;
    for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; R.norm[id] = keep * m; const r = duelsOf({ day, seeds, stage, foes: [id] })[0]; if (r.w / r.n > target) lo = m; else hi = m; }
    R.norm[id] = keep; out[id] = (lo + hi) / 2;
  }
  return out;
}
/** AC-12's table with each rival at its own level (rivalLevels) */
export function kitsTableByRival(stage, seeds, names = Object.keys(KITS), levels = rivalLevels(stage, STAGE_TARGET[stage], seeds)) {
  const day = STAGE_DAY[stage], T = Object.fromEntries(names.map((k) => [k, {}])), R = AD.AUTO_RACE;
  for (const id of RIVALS) {
    const keep = R.norm[id]; R.norm[id] = keep * levels[id];
    try { for (const k of names) { const K = KITS[k], r = duelsOf({ day, loadout: K.loadout, weapon: K.weapon, seeds, stage, foes: [id] })[0]; T[k][id] = r.w / r.n; } } finally { R.norm[id] = keep; }
  }
  return T;
}
export function kitsTable(stage, seeds, names = Object.keys(KITS), f = 1) {
  if (f !== 1) return withLevel(stage, f, () => kitsTable(stage, seeds, names, 1));
  const day = STAGE_DAY[stage], T = {};
  for (const k of names) { const K = KITS[k]; T[k] = Object.fromEntries(duelsOf({ day, loadout: K.loadout, weapon: K.weapon, seeds, stage }).map((r) => [r.id, r.w / r.n])); }
  return T;
}
/** AC-12's test on a table: against each rival, the good answers (within `band` of that rival's best kit) among the kits (the weapons apart); a kit that is the best
 *  (or within `tie` of it) against every rival dominates */
export function ac12(T, { band = 0.1, tie = 0.03, kits = Object.keys(KITS).filter((k) => !['épée', 'lame', 'sabre'].includes(k)) } = {}) {
  const good = {}, best = {};
  for (const id of RIVALS) { const b = Math.max(...kits.map((k) => T[k][id])); good[id] = kits.filter((k) => T[k][id] >= b - band); best[id] = kits.filter((k) => T[k][id] >= b - tie); }
  const dominates = kits.filter((k) => RIVALS.every((id) => best[id].includes(k)));
  return { good, best, dominates, ok: RIVALS.every((id) => good[id].length >= 2) && !dominates.length };
}
function kits() {
  const stage = +arg('stage', '2'), seeds = range(arg('seeds', '1..60'));
  if (arg('kits')) for (const kv of arg('kits').split(';')) { const [n, l] = kv.split(':'); KITS[n] = { loadout: l.split('.') }; }
  const byRival = arg('norm') === 'rival', f = arg('norm') === '0' || byRival ? 1 : levelFor(stage, STAGE_TARGET[stage], seeds);
  const T = byRival ? kitsTableByRival(stage, seeds, Object.keys(KITS)) : kitsTable(stage, seeds, Object.keys(KITS), f);
  console.log(`étape ${stage} (la référence du jour ${STAGE_DAY[stage]}), ${seeds.length} graines, ${byRival ? `chaque rival à son niveau (le kit de départ à ${Math.round(100 * STAGE_TARGET[stage])} % contre lui)` : `les rivaux x${f.toFixed(3)} (le kit de départ à ${Math.round(100 * STAGE_TARGET[stage])} % en moyenne)`} : ` + RIVALS.join(' / '));
  for (const [k, v] of Object.entries(T)) console.log(`  ${k.padEnd(11)} ${RIVALS.map((id) => String(Math.round(100 * v[id])).padStart(3)).join(' ')}   moyenne ${Math.round(100 * RIVALS.reduce((n, id) => n + v[id], 0) / RIVALS.length)}`);
  const A = ac12(T); console.log(`  bonnes réponses (à 10 points du meilleur) : ${RIVALS.map((id) => `${id} ${A.good[id].join('+')}`).join(' ; ')}`);
  console.log(`  domine partout (à 3 points du meilleur contre chacun) : ${A.dominates.join(', ') || 'aucun'} ; test ${A.ok ? 'tenu' : 'non tenu'}`);
}
function modes() {
  const seeds = range(arg('seeds', '101..300')), base = AUTOS[arg('auto', 'jeu')], only = arg('only') ? arg('only').split(',') : null, out = {};
  if (!base) throw new Error(`no automatic ${arg('auto')} (${Object.keys(AUTOS).join(', ')})`);
  console.log(`l'automatique de tous : ${arg('auto', 'jeu')} ; ${seeds.length} parties de la référence`);
  for (const [name, m] of Object.entries(TAC.MODES)) {
    if (only && !only.some((o) => name.includes(o))) continue;
    const G = withDeciders(base, TAC.deciderOf(m, base), () => gamesOf('reference', seeds));
    console.log(`  ${name.padEnd(46)} ${gamesLine(G).slice(10, 80)}`); out[name] = G.crowns / G.n;
  }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
}
function offscreen() {
  const seeds = range(arg('seeds', '1..40')); let ms = 0, n = 0, up = 0, pairs = 0;
  for (const stage of [0, 1, 2]) {
    console.log(`étape ${stage} : P(ligne bat colonne)`);
    console.log('          ' + RIVALS.map((b) => b.slice(0, 7).padEnd(8)).join(''));
    for (const a of RIVALS) {
      const cells = [];
      for (const b of RIVALS) {
        if (a === b) { cells.push('   -    '); continue; }
        let w = 0; const t0 = performance.now();
        for (const s of seeds) if (AU.autoWinner(AD.autoOffscreen(a, b, { stage, seed: 900 + s })) === 0) w++;
        ms += performance.now() - t0; n += seeds.length; const p = w / seeds.length; up += Math.min(p, 1 - p); pairs++;
        cells.push(`${String(Math.round(100 * p)).padStart(4)}    `);
      }
      console.log(a.slice(0, 7).padEnd(10) + cells.join(''));
    }
  }
  console.log(`coût : ${(ms / n).toFixed(3)} ms par duel (Node, indicatif) ; chance moyenne du moins fort ${(100 * up / pairs).toFixed(1)} %`);
}
/** the race fitted: each rival's pool factor so that the reference of day 2 beats it `t0` of the time (isolated duels, 60 seeds), the pool's rounds +15 % (LC1-1,
 *  A3; with `keepNorm` the pool factors are left as they are), then the bracket's and the final's factors on whole games of the reference (calibration seeds) for the semi-final's and the final's targets */
export function levelFit(t0, targets, fitSeeds, quiet = false, keepNorm = false) {
  if (!keepNorm) for (const id of RIVALS) {
    let lo = 0.3, hi = 8;
    for (let i = 0; i < 13; i++) { const m = (lo + hi) / 2; AD.AUTO_RACE.norm[id] = m; const r = duelsOf({ day: 2, foes: [id], seeds: range('1..60') })[0]; if (r.w / r.n > t0) lo = m; else hi = m; }
    AD.AUTO_RACE.norm[id] = +((lo + hi) / 2).toFixed(3);
  }
  const bis = (s, key, t, lo, hi) => { for (let i = 0; i < 9; i++) { const m = (lo + hi) / 2; AD.AUTO_RACE.stage[s] = m; if (rate(gamesOf('reference', fitSeeds), [key]) > t) lo = m; else hi = m; } AD.AUTO_RACE.stage[s] = +((lo + hi) / 2).toFixed(3); };
  bis(1, 'semi', targets[0], 0.6, 5); bis(2, 'final', targets[1], 0.6, 8);
  if (!quiet) console.log(`la course : ${JSON.stringify({ norm: AD.AUTO_RACE.norm, pool: AD.AUTO_RACE.pool, stage: AD.AUTO_RACE.stage })}`);
  return { norm: { ...AD.AUTO_RACE.norm }, pool: [...AD.AUTO_RACE.pool], stage: { ...AD.AUTO_RACE.stage } };
}
function level() {
  const L = levelFit(+arg('t0', '95') / 100, arg('targets', '65,50').split(',').map((x) => +x / 100), range(arg('fitseeds', '1..80')), false, process.argv.includes('--keep-norm'));
  if (arg('out')) fs.writeFileSync(arg('out'), JSON.stringify(L, null, 1));
  for (const id of RIVALS) { const sh = (s, r) => { const x = AD.autoRaceSheet(id, s, r); return `${Math.round(x.hp)} PV ${x.atk.toFixed(1)}/${x.def.toFixed(1)}/${x.end.toFixed(1)}/${x.viv}`; }; console.log(`  ${id.padEnd(8)} x${L.norm[id]} : poule ${sh(0, 0)} → ${sh(0, 2)} ; tableau ${sh(1)} ; finale ${sh(2)}`); }
  console.log(`graines tenues à part ${arg('seeds', '101..160')} :`);
  for (const pn of ['reference', 'planner', 'curious', 'diligent', 'idle']) console.log('  ' + gamesLine(gamesOf(pn, range(arg('seeds', '101..160')))));
}

const cmd = process.argv[2];
try {
  if (cmd === 'games') games();
  else if (cmd === 'refs') refs();
  else if (cmd === 'rhythm') rhythm();
  else if (cmd === 'kits') kits();
  else if (cmd === 'offscreen') offscreen();
  else if (cmd === 'level') level();
  else if (cmd === 'modes') modes();
  else if (cmd !== 'lib') console.log('commands: games | refs | rhythm | kits | offscreen | level (see the header)');
} finally { if (cmd !== 'lib') await server.close(); }
export { AU, AD, AM, LAB, ST, range, med, q, pct, rate, server };
