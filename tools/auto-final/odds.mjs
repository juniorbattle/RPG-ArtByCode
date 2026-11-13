// The workshop's odds (journal Passe CF1; the operator's « une structure de combat suffisamment coherente que meme lorsque le heors ne combat pas, il peut
// parier sur les autres combattants », for later, ECO-5): a pre-bout chance read from the two sheets alone, and how well the bouts follow it (the off-screen
// bouts between rivals at every stage and the player's own), fitted on calibration seeds and judged on held-out ones.
// The chance: each fighter's time to bring the other down at equal stats' power, TTK = health_target × (Atk + Def_target) / (2·Atk) / Speed, the Endurance
// as the gauge it holds; p(A) = 1 / (1 + (TTK_A→B / TTK_B→A)^k · (End_B / End_A)^e).
import fs from 'node:fs';
import * as L from './lab.mjs';
const { AU, AD, RIVALS, mean } = L;

export const ttk = (a, b) => (b.hp * (a.atk + b.def)) / (2 * a.atk) / Math.max(1, a.viv);
export const chance = (a, b, k, e) => 1 / (1 + Math.pow(ttk(a, b) / ttk(b, a), k) * Math.pow(b.end / a.end, e));
/** the off-screen bouts of `seeds`: every ordered pair of rivals at every stage, each with a preparation and a health share drawn from the seed */
export function offscreenData(seeds) {
  const rows = [];
  for (const s of seeds) for (const stage of [0, 1, 2]) for (const a of RIVALS) for (const b of RIVALS) {
    if (a === b) continue;
    const h = (x) => { let v = (s * 2654435761 + x * 40503 + stage * 977) >>> 0; v ^= v >>> 13; v = Math.imul(v, 2246822519) >>> 0; return (v >>> 0) / 4294967296; };
    const pa = 20 + 80 * h(1 + a.length), pb = 20 + 80 * h(7 + b.length + a.length * 3), ha = h(11) < 0.15 ? 0.8 : 1, hb = h(13) < 0.15 ? 0.8 : 1;
    const A = AD.autoFoe(a, AD.autoRaceSheet(a, stage, 1, { preparation: pa, hp: ha }), { side: 'ren' }), B = AD.autoFoe(b, AD.autoRaceSheet(b, stage, 1, { preparation: pb, hp: hb }));
    const r = AU.autoDuel(A, B, 50000 + s * 101 + stage * 7 + RIVALS.indexOf(a) * 13 + RIVALS.indexOf(b));
    rows.push({ A, B, seed: 50000 + s * 101 + stage * 7 + RIVALS.indexOf(a) * 13 + RIVALS.indexOf(b), a: { hp: A.hp * ha, atk: A.atk, def: A.def, end: A.end, viv: A.viv }, b: { hp: B.hp * hb, atk: B.atk, def: B.def, end: B.end, viv: B.viv }, win: AU.autoWinner(r) === 0 ? 1 : 0, stage, pair: `${a}-${b}` });
  }
  return rows;
}
const ll = (rows, k, e) => -mean(rows.map((r) => { const p = Math.min(1 - 1e-6, Math.max(1e-6, chance(r.a, r.b, k, e))); return r.win ? Math.log(p) : Math.log(1 - p); }));
/** k and e by a grid, on the calibration rows */
export function fit(rows) {
  let best = { k: 1, e: 0, ll: Infinity };
  for (let k = 0.5; k <= 8; k += 0.25) for (let e = 0; e <= 4; e += 0.25) { const v = ll(rows, k, e); if (v < best.ll) best = { k, e, ll: v }; }
  return best;
}
/** a judgement: the Brier score, the log loss, the calibration by tenths of the chance, the share of the favourite winning */
export function judgeOdds(rows, k, e) {
  const bins = Array.from({ length: 10 }, () => ({ p: 0, w: 0, n: 0 }));
  let brier = 0, fav = 0;
  for (const r of rows) { const p = chance(r.a, r.b, k, e), i = Math.min(9, Math.floor(p * 10)); bins[i].p += p; bins[i].w += r.win; bins[i].n++; brier += (p - r.win) ** 2; if ((p >= 0.5) === (r.win === 1)) fav++; }
  return { brier: brier / rows.length, ll: ll(rows, k, e), fav: fav / rows.length, bins: bins.map((b) => (b.n ? { p: b.p / b.n, w: b.w / b.n, n: b.n } : null)) };
}

/** the rehearsal odds: the share of n duels of the same two fighters won, the forms of the day the bout's own (known before it, AC-08), every other draw
 *  another seed's (the game would compute it as it computes the duel) */
export function rehearsal(A, B, seed, n = 60, cfg = L.model() ?? L.GAME) {
  const forms = AU.autoFormsOf(seed);
  const a = L.prep(A, cfg), b = L.prep(B, cfg);
  let w = 0; for (let i = 1; i <= n; i++) { const r = L.SIM.duel(a, b, (seed ^ Math.imul(i, 0x9e3779b1)) >>> 0, { forms }, cfg); if (AU.autoWinner(r) === 0) w++; }
  return w / n;
}
/** a judgement of chances already computed: rows { p, win } */
export function judgeP(rows) {
  const bins = Array.from({ length: 10 }, () => ({ p: 0, w: 0, n: 0 }));
  let brier = 0, fav = 0, ll = 0;
  for (const r of rows) { const p = Math.min(0.995, Math.max(0.005, r.p)), i = Math.min(9, Math.floor(r.p * 10)); bins[i].p += r.p; bins[i].w += r.win; bins[i].n++; brier += (r.p - r.win) ** 2; ll -= r.win ? Math.log(p) : Math.log(1 - p); if ((r.p >= 0.5) === (r.win === 1)) fav++; }
  return { brier: brier / rows.length, ll: ll / rows.length, fav: fav / rows.length, bins: bins.map((b) => (b.n ? { p: b.p / b.n, w: b.w / b.n, n: b.n } : null)) };
}
