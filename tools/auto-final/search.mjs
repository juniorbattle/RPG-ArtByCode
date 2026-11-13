// The workshop's search of the preparations (journal Passe CF1): against each rival at each stage, every kit of a repertoire with its best tactic (coordinate
// descent on one condition per skill), on cross duels (every Ren the reference's whole games bring to that stage, against that rival at that stage), chosen on
// calibration games and judged on held-out ones. AC-12's test on the kits (each rival two good answers at 10 points of the best, no kit at 3 points of the best
// against every rival), the conditions that some answer uses, the automatic's place.
import * as L from './lab.mjs';
import * as B from './bank.mjs';
const { AU, AD, RIVALS, med, mean, pct } = L;

export const FAM = (id) => AD.AUTO_SKILLS[id]?.family;
export const CONDS = { defensive: ['auto', 'ready', 'incoming', 'gauge', 'hurt', 'never'], support: ['auto', 'ready', 'follow', 'broken', 'finish', 'never'], offensive: ['auto', 'ready', 'broken', 'incoming', 'finish', 'warded', 'foeGauge', 'never'] };
export const combos = (arr, k) => (k === 0 ? [[]] : arr.flatMap((x, i) => combos(arr.slice(i + 1), k - 1).map((c) => [x, ...c])));

/** the cross duels of a stage: each banked Ren of that stage (at most `n`) against `foe` built at that stage (round 1 in the pool, the median preparation) */
export function crossOf(bank, stage, n = 200) {
  const X = bank.filter((e) => e.stage === stage && (stage !== 0 || e.day >= 4)).slice(0, n);
  const prep = med(bank.filter((e) => e.stage === stage).map((e) => e.prep));
  return (foe) => X.map((e) => ({ ...e, foeId: foe, kitOf: foe, prep, round: stage === 0 ? 1 : 0, foeHp: 1 }));
}
/** the wins of a preparation `p` (kit: loadout, tactic by id) on a list of bouts */
export function winsOf(bouts, p) {
  let w = 0;
  for (const e of bouts) { const lv = e.ren.kit.levels; if (p.kit.loadout.some((id) => !(lv[id] > 0))) return NaN; const r = AU.autoDuel(B.renOf(e, p), B.foeOf(e), e.seed); if (AU.autoWinner(r) === 0) w++; }
  return w / bouts.length;
}
/** the best tactic of a kit on `bouts`: coordinate descent from the automatic's (every line 'auto'), `sweeps` passes */
export function bestTactic(bouts, loadout, sweeps = 2, conds = CONDS) {
  const tactic = Object.fromEntries(loadout.map((id) => [id, 'auto']));
  let best = winsOf(bouts, { kit: { loadout, tactic } }); const auto = best;
  for (let s = 0; s < sweeps; s++) {
    let moved = false;
    for (const id of loadout) for (const c of conds[FAM(id)]) {
      if (c === tactic[id]) continue;
      const t = { ...tactic, [id]: c }, w = winsOf(bouts, { kit: { loadout, tactic: t } });
      if (w > best + 1e-9) { best = w; tactic[id] = c; moved = true; }
    }
    if (!moved) break;
  }
  return { tactic, w: best, auto };
}
/** the search on a stage: for each rival, every kit of `rep` (4 of them) with its automatic and its best tactic, on calibration Rens */
export function searchStage(bank, stage, rep, o = {}) {
  const cross = crossOf(bank, stage, o.n ?? 160), kits = combos(rep, 4), out = {};
  for (const foe of o.foes ?? RIVALS) {
    const bouts = cross(foe), rows = [];
    for (const loadout of kits) { const r = bestTactic(bouts, loadout, o.sweeps ?? 2); if (!isNaN(r.w)) rows.push({ loadout, ...r }); }
    rows.sort((a, b) => b.w - a.w);
    out[foe] = rows;
  }
  return out;
}
/** AC-12's test on a search: per rival, the good answers (kits within `band` of the best, each with its best tactic), and what dominates */
export function ac12Of(S, band = 0.1, tie = 0.03) {
  const good = {}, best = {}, keys = new Set();
  for (const [foe, rows] of Object.entries(S)) { const b = rows[0].w; good[foe] = rows.filter((r) => r.w >= b - band).map((r) => r.loadout.join('.')); best[foe] = rows.filter((r) => r.w >= b - tie).map((r) => r.loadout.join('.')); rows.forEach((r) => keys.add(r.loadout.join('.'))); }
  const dominates = [...keys].filter((k) => Object.keys(S).every((f) => best[f].includes(k)));
  return { good, best, dominates, ok: Object.values(good).every((g) => g.length >= 2) && !dominates.length };
}
