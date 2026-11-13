// The workshop's exploration on the bank (journal Passe CF1): each set of rules on the reference's own bouts (no race refit: a direction, not a verdict): the
// wins by stage, the durations, the skills and heavy blows a bout, the blows a minute, the breaks; and the adaptation gap: the best tactic against each rival
// (chosen on calibration bouts, judged on held-out ones) against the automatic.
//   node tools/auto-final/explore.mjs [--variants=a,b] [--cal=1..100,301..400] [--held=101..300] [--grid=1]
import fs from 'node:fs';
import * as L from './lab.mjs';
import * as B from './bank.mjs';
import { VARIANTS } from './variants.mjs';
const { RIVALS, med, mean, pct } = L;
const seedsOf = (s) => s.split(',').flatMap((p) => L.range(p));

/** a bank's rhythm and counts under the current model */
export function stats(bank, p) {
  const r = B.replay(bank, p, { keep: true, log: true }), by = { 0: [], 1: [], 2: [] };
  for (const x of r.rows) by[x.e.stage].push(x);
  const out = {};
  for (const [s, X] of Object.entries(by)) {
    const bpm = X.map(({ r: d }) => (60 * d.log.filter((e) => e.ev === 'hit' || e.ev === 'guarded' || e.ev === 'dodged').length) / d.t);
    // blows to a break: the blows the broken one took since the start or its last break
    const toBreak = [];
    for (const { r: d } of X) { const cnt = { ren: 0, foe: 0 }; for (const e of d.log) { if (e.ev === 'hit' || e.ev === 'guarded') cnt[e.who === 'ren' ? 'foe' : 'ren']++; if (e.ev === 'break') { const k = e.who === 'ren' ? 'ren' : 'foe'; toBreak.push(cnt[k]); cnt[k] = 0; } } }
    out[s] = { win: X.filter((x) => x.w).length / X.length, t: med(X.map((x) => x.r.t)), bpm: med(bpm), skills: med(X.map((x) => x.r.n[0].skills)), heavies: med(X.map((x) => x.r.n[0].heavies)), foeSkills: med(X.map((x) => x.r.n[1].skills)), breaks: mean(X.map((x) => x.r.n[1].breaks + x.r.n[0].breaks)), toBreak: med(toBreak) };
  }
  return out;
}
export const statLine = (S) => [0, 1, 2].map((s) => `${['poule', 'tableau', 'finale'][s]} ${pct(S[s].win * 100, 100)} % ${Math.round(S[s].t)} s ${S[s].bpm.toFixed(0)} c/min comp ${S[s].skills}/${S[s].foeSkills} lourd ${S[s].heavies} rupt ${S[s].breaks.toFixed(1)} (${S[s].toBreak} coups)`).join(' | ');

/** the tactic presets on Ren's four (by family and by skill), for the adaptation search */
export function tacticGrid(kit) {
  const fam = (id) => L.AD.AUTO_SKILLS[id]?.family, opts = { defensive: ['auto', 'incoming', 'gauge', 'never'], support: ['auto', 'ready', 'follow', 'broken'], offensive: ['auto', 'ready', 'broken', 'incoming', 'finish', 'warded', 'foeGauge'] };
  let grid = [{}];
  for (const id of kit.loadout) { const next = []; for (const g of grid) for (const c of opts[fam(id)]) next.push({ ...g, [id]: c }); grid = next; }
  return grid;
}
/** the adaptation gap: for each rival and stage, the best tactic of the grid on the calibration bank, then its wins on the held-out bank, against the automatic */
export function adaptGap(cal, held, kitOf = (e) => e.ren.kit) {
  const grid = tacticGrid({ loadout: ['t1', 't4', 'd1', 's1'] });
  const keyOf = (e) => `${e.foeId}:${e.stage}`;
  const score = {};
  for (let i = 0; i < grid.length; i++) {
    const r = B.replay(cal, (e) => ({ kit: { tactic: grid[i] } }));
    for (const [k, v] of Object.entries(r.rival)) { const s = (score[k] ??= { best: -1, i: 0 }); const w = B.wr(v); if (w > s.best) { s.best = w; s.i = i; } }
  }
  const auto = B.replay(held), adapted = B.replay(held, (e) => ({ kit: { tactic: grid[score[keyOf(e)]?.i ?? 0] } }));
  return { auto, adapted, score, grid };
}

if (process.argv[1].endsWith('explore.mjs')) {
  const cal = seedsOf(L.arg('cal', '1..100,301..400')), held = seedsOf(L.arg('held', '101..300'));
  try {
    L.setModel(L.GAME);
    const bankCal = B.captureBank(cal), bankHeld = B.captureBank(held);
    console.log(`banque : ${bankCal.length} combats de calage, ${bankHeld.length} tenus à part (la référence, le jeu d'aujourd'hui)`);
    const out = {};
    for (const name of L.arg('variants', Object.keys(VARIANTS).join(',')).split(',')) {
      const V = VARIANTS[name]; L.setModel(V.cfg);
      const S = stats(bankHeld, V.prep ?? (() => ({})));
      let line = `${name.padEnd(16)} ${statLine(S)}`;
      if (L.arg('grid') === '1') {
        const A = adaptGap(bankCal, bankHeld);
        line += `\n${''.padEnd(16)} adaptation (tactique par rival, choisie au calage, jugée à part) : ` + [0, 1, 2].map((s) => `${pct(A.auto.stage[s][0], A.auto.stage[s][1])} → ${pct(A.adapted.stage[s][0], A.adapted.stage[s][1])}`).join(' | ');
        out[name] = { S, auto: A.auto.stage, adapted: A.adapted.stage };
      } else out[name] = { S };
      console.log(line);
    }
    if (L.arg('json')) fs.writeFileSync(L.arg('json'), JSON.stringify(out, null, 1));
  } finally { L.setModel(null); await L.server.close(); }
}
