// The workshop's comparison at equal level (journal Passe CF1): a set of rules judged only once its rivals are brought, stage by stage, to where the reference's
// automatic wins what AC-15 aims at (the pool 85 %, the bracket 65 %, the final 50 %, on the calibration bank); then, on the held-out bank: the automatic, the best
// single tactic for every rival, the best tactic for each rival (chosen on calibration), random presses; the durations, the rhythm, the blows to a break.
//   node tools/auto-final/level.mjs [--variants=a,b] [--cal=1..100,301..400] [--held=101..300] [--json=f]
import fs from 'node:fs';
import * as L from './lab.mjs';
import * as B from './bank.mjs';
import { VARIANTS } from './variants.mjs';
import { tacticGrid, stats, statLine } from './explore.mjs';
const { AD, RIVALS, pct } = L;
const seedsOf = (s) => String(s).split(',').flatMap((p) => L.range(p));
export const TARGET = { 0: 0.85, 1: 0.65, 2: 0.5 };

/** bring the rivals of each stage to the target on a bank (the pool: every rival's factor × f; a stage: its factor) by bisection; the race left set */
export function levelBank(bank, p = () => ({}), target = TARGET) {
  const R = AD.AUTO_RACE, base = JSON.parse(JSON.stringify({ norm: R.norm, stage: R.stage })), out = {};
  for (const s of [0, 1, 2]) {
    const sub = bank.filter((e) => e.stage === s);
    let lo = 0.3, hi = 4;
    for (let i = 0; i < 14; i++) {
      const m = (lo + hi) / 2;
      if (s === 0) for (const id of RIVALS) R.norm[id] = base.norm[id] * m; else R.stage[s] = base.stage[s] * m;
      const r = B.replay(sub, p), w = B.wr(r.stage[s]);
      if (w > target[s]) lo = m; else hi = m;
    }
    const m = (lo + hi) / 2; out[s] = m;
    if (s === 0) for (const id of RIVALS) R.norm[id] = base.norm[id] * m; else R.stage[s] = base.stage[s] * m;
  }
  return out;
}
/** a careless hand: one choice in four where a skill can go, a skill drawn among those that can go */
export function careless(p = 0.25, seed = 7) {
  const h = (a, b, c) => { let x = (a * 2654435761 + b * 40503 + c * 9973) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return (x >>> 0) / 4294967296; };
  return (v, x) => {
    const can = x.skills.filter((s) => v.usable(s));
    if (can.length && h(seed, Math.floor(v.t * 100), v.me.n.acts) < p) return can[Math.floor(h(seed + 1, Math.floor(v.t * 100), v.me.n.acts) * can.length)];
    return L.SIM.autoDecider(v, x);
  };
}
/** the four ways on the held-out bank: the automatic, the best single tactic, the best tactic per rival, random presses */
export function ways(cal, held) {
  const grid = tacticGrid({ loadout: ['t1', 't4', 'd1', 's1'] }), per = {}, all = [];
  for (let i = 0; i < grid.length; i++) {
    const r = B.replay(cal, () => ({ kit: { tactic: grid[i] } }));
    let w = 0, n = 0;
    for (const [k, v] of Object.entries(r.rival)) { const x = (per[k] ??= { best: -1, i: 0 }); const q = B.wr(v); if (q > x.best) { x.best = q; x.i = i; } w += v[0]; n += v[1]; }
    all.push({ i, w: w / n, stage: r.stage });
  }
  // the best single tactic: the best mean over the three stages' win rates
  const uni = all.map((a) => ({ ...a, m: (B.wr(a.stage[0]) + B.wr(a.stage[1]) + B.wr(a.stage[2])) / 3 })).sort((a, b) => b.m - a.m)[0];
  const auto = B.replay(held), single = B.replay(held, () => ({ kit: { tactic: grid[uni.i] } })), adapted = B.replay(held, (e) => ({ kit: { tactic: grid[per[`${e.foeId}:${e.stage}`]?.i ?? 0] } }));
  const keep = L.SIM;
  const hand = (() => { const d = careless(); const out = { stage: { 0: [0, 0], 1: [0, 0], 2: [0, 0] } }; for (const e of held) { const r = L.AU.autoDuel(B.renOf(e), B.foeOf(e), e.seed, { deciders: { player: d } }); out.stage[e.stage][1]++; if (L.AU.autoWinner(r) === 0) out.stage[e.stage][0]++; } return out; })();
  const usedConds = {};
  for (const [k, v] of Object.entries(per)) for (const [id, c] of Object.entries(grid[v.i])) usedConds[`${id}:${c}`] = (usedConds[`${id}:${c}`] ?? 0) + 1;
  return { auto, single, adapted, hand, singleTactic: grid[uni.i], usedConds, per: Object.fromEntries(Object.entries(per).map(([k, v]) => [k, grid[v.i]])) };
}
const line3 = (r) => [0, 1, 2].map((s) => String(pct(r.stage[s][0], r.stage[s][1])).padStart(3)).join(' /');

if (process.argv[1].endsWith('level.mjs')) {
  const cal = seedsOf(L.arg('cal', '1..100,301..400')), held = seedsOf(L.arg('held', '101..300')), out = {};
  try {
    for (const name of L.arg('variants', 'game,F0,F1,F2,F3').split(',')) {
      const V = VARIANTS[name]; L.setModel(V.cfg);
      const keep = L.raceNow();
      const bc = B.captureBank(cal), bh = B.captureBank(held);
      const f = levelBank(bc);
      const S = stats(bh);
      const W = ways(bc, bh);
      console.log(`${name.padEnd(8)} ${V.about}\n         niveaux ×${f[0].toFixed(2)} / ×${f[1].toFixed(2)} / ×${f[2].toFixed(2)} | ${statLine(S)}`);
      console.log(`         tenus à part (poule / tableau / finale) : automatique ${line3(W.auto)} | une tactique pour tous ${line3(W.single)} ${JSON.stringify(W.singleTactic).replace(/"/g, '')} | une tactique par rival ${line3(W.adapted)} | appuis au hasard ${line3(W.hand)}`);
      out[name] = { f, S, auto: W.auto.stage, single: W.single.stage, adapted: W.adapted.stage, hand: W.hand.stage, singleTactic: W.singleTactic, per: W.per, usedConds: W.usedConds };
      L.withRace(keep, () => {}); Object.assign(AD.AUTO_RACE, keep);
    }
    if (L.arg('json')) fs.writeFileSync(L.arg('json'), JSON.stringify(out, null, 1));
  } finally { L.setModel(null); await L.server.close(); }
}
