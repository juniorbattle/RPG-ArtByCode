// The model inspired by La Brute at equal level (journal Passe CF2, briefs/combat-auto.md § 32): each set of rules judged once its rivals are brought, stage by
// stage, to where the reference's automatic wins AC-15's aims (the pool 85 %, the bracket 65 %, the final 50 %, on the calibration bank); then, on the held-out
// bank: the automatic; the best tactic of Ren's four for each rival (chosen on calibration, a condition per skill by its role); the best kit for each rival among
// archetypes, each with its role's automatic (Ren owning the catalogue: a skill he has not learnt at level 1); both together; random presses; the rhythm, the
// openings, the interrupts, the parries, the skills' share of Ren's damage.
//   node tools/auto-final/brute.mjs [--variants=a,b] [--cal=1..100,301..400] [--held=101..300] [--kits=1] [--json=f]
import fs from 'node:fs';
import * as L from './lab.mjs';
import * as B from './bank.mjs';
import { VARIANTS } from './variants.mjs';
import { levelBank, careless } from './level.mjs';
const { AD, pct, med, mean } = L;
const seedsOf = (s) => String(s).split(',').flatMap((p) => L.range(p));

/** the conditions a tactic line may take by role (the page's, by what each role does) */
export const CONDS_BY_ROLE = {
  exploit: ['auto', 'ready', 'open', 'incoming', 'broken', 'finish'],
  punish: ['auto', 'ready', 'incoming', 'open', 'finish', 'never'],
  pierce: ['auto', 'warded', 'open', 'incoming', 'finish'],
  breaker: ['auto', 'open', 'foeGauge', 'incoming', 'start'],
  opener: ['auto', 'ready', 'follow', 'foeGauge', 'start'],
  interrupt: ['auto', 'ready', 'open', 'never'],
  ward: ['auto', 'incoming', 'gauge', 'ready', 'never'],
  parry: ['auto', 'ready', 'gauge', 'never'],
  haste: ['auto', 'start', 'follow', 'broken', 'hurt'],
  slow: ['auto', 'start', 'incoming', 'hurt', 'never'],
  load: ['auto', 'ready', 'broken', 'open', 'finish'],
};
const roleOf = (id) => L.BRUTE_ROLES[id]?.role;
/** every tactic of a loadout (one condition per skill by its role) */
export function gridOf(loadout) {
  let grid = [{}];
  for (const id of loadout) { const next = []; for (const g of grid) for (const c of CONDS_BY_ROLE[roleOf(id)] ?? ['auto']) next.push({ ...g, [id]: c }); grid = next; }
  return grid;
}
/** the archetypes of kits a player may bring (four of the catalogue each) */
export const KITS = [
  ['t1', 't4', 'd1', 's1'], ['k_sunder', 't4', 'd1', 's1'], ['k_feint', 't4', 'd1', 's1'], ['k_parry', 't4', 'd1', 's1'], ['k_sunder', 'k_feint', 't4', 'k_focus'],
  ['t2', 't3', 't4', 's1'], ['k_iron', 'd1', 't4', 'k_cry'], ['k_feint', 'k_parry', 't4', 'k_focus'], ['t3', 'k_sunder', 't4', 'k_cry'], ['t1', 't2', 't4', 'k_focus'],
  ['k_parry', 'k_feint', 't1', 't4'], ['t1', 't3', 'd1', 's1'], ['k_sunder', 't1', 't4', 'k_cry'], ['t2', 'k_feint', 't4', 's1'],
];
const REP = [...new Set(KITS.flat())];
/** a bank whose Rens own the catalogue (a skill not learnt at level 1, the others at their levels) */
export const withRep = (bank) => bank.map((e) => ({ ...e, ren: { ...e.ren, kit: { ...e.ren.kit, levels: { ...Object.fromEntries(REP.map((k) => [k, 1])), ...e.ren.kit.levels } } } }));
const line3 = (r) => [0, 1, 2].map((s) => String(pct(r.stage[s][0], r.stage[s][1])).padStart(3)).join(' /');

/** the best of `opts` (preparations) for each rival and stage on `cal`, then judged on `held` */
export function perRival(cal, held, opts, margin = 0.03, minN = 25) {
  const best = {}, base = B.replay(cal);
  for (const [k, v] of Object.entries(base.rival)) best[k] = { w: B.wr(v) + margin, i: -1, n: v[1] };
  for (let i = 0; i < opts.length; i++) {
    const r = B.replay(cal, () => opts[i]);
    for (const [k, v] of Object.entries(r.rival)) { const x = best[k]; if (!x || x.n < minN) continue; const q = B.wr(v); if (q > x.w + 1e-9) { x.w = q; x.i = i; } }
  }
  return { res: B.replay(held, (e) => { const i = best[`${e.foeId}:${e.stage}`]?.i ?? -1; return i >= 0 ? opts[i] : {}; }), best };
}
/** the duels' counts on a bank: the skills a duel, the openings made, the interrupts, the parries, the skills' share of Ren's damage, the rhythm */
export function counts(bank, p = () => ({})) {
  const r = B.replay(bank, p, { keep: true, log: true }), by = { 0: [], 1: [], 2: [] };
  for (const x of r.rows) by[x.e.stage].push(x);
  const out = {};
  for (const [s, X] of Object.entries(by)) {
    const bpm = X.map(({ r: d }) => (60 * d.log.filter((e) => e.ev === 'hit' || e.ev === 'guarded' || e.ev === 'dodged').length) / d.t);
    const toBreak = [];
    for (const { r: d } of X) { const cnt = { ren: 0, foe: 0 }; for (const e of d.log) { if (e.ev === 'hit' || e.ev === 'guarded') cnt[e.who === 'ren' ? 'foe' : 'ren']++; if (e.ev === 'break') { const k = e.who === 'ren' ? 'ren' : 'foe'; toBreak.push(cnt[k]); cnt[k] = 0; } } }
    out[s] = {
      win: X.filter((x) => x.w).length / X.length, t: med(X.map((x) => x.r.t)), bpm: med(bpm), toBreak: med(toBreak),
      skills: mean(X.map((x) => x.r.n[0].skills)), foeSkills: mean(X.map((x) => x.r.n[1].skills)), heavies: mean(X.map((x) => x.r.n[0].heavies)),
      opened: mean(X.map((x) => x.r.n[0].opened ?? 0)), foeOpened: mean(X.map((x) => x.r.n[1].opened ?? 0)), interrupts: mean(X.map((x) => x.r.n[0].interrupts ?? 0)), parried: mean(X.map((x) => x.r.n[0].parried ?? 0)),
      skillShare: mean(X.map((x) => x.r.n[0].skillDmg / Math.max(1, x.r.n[0].dmg))), breaks: mean(X.map((x) => x.r.n[0].breaks + x.r.n[1].breaks)),
    };
  }
  return out;
}
const countLine = (S) => [0, 1, 2].map((s) => `${['poule', 'tableau', 'finale'][s]} ${Math.round(S[s].t)} s ${S[s].bpm.toFixed(0)} c/min comp ${S[s].skills.toFixed(1)}/${S[s].foeSkills.toFixed(1)} lourds ${S[s].heavies.toFixed(1)} failles ${S[s].opened.toFixed(1)}/${S[s].foeOpened.toFixed(1)} interr ${S[s].interrupts.toFixed(1)} parades ${S[s].parried.toFixed(1)} part comp ${Math.round(100 * S[s].skillShare)} % rupt ${S[s].breaks.toFixed(1)} (${S[s].toBreak} coups)`).join('\n           ');

if (process.argv[1].endsWith('brute.mjs')) {
  const cal = seedsOf(L.arg('cal', '1..100,301..400')), held = seedsOf(L.arg('held', '101..300')), out = {};
  try {
    for (const name of L.arg('variants', 'BS').split(',')) {
      const V = VARIANTS[name]; L.setModel(V.cfg);
      const keep = L.raceNow();
      // two passes: the banks captured again at the level found (a set of rules much harder than today's leaves no final in a bank of today's race)
      levelBank(withRep(B.captureBank(cal)));
      const bc = withRep(B.captureBank(cal)), bh = withRep(B.captureBank(held));
      const f = levelBank(bc);
      const S = counts(bh);
      const start = ['t1', 't4', 'd1', 's1'], grid = gridOf(start);
      const auto = B.replay(bh);
      const tac = perRival(bc, bh, grid.map((t) => ({ kit: { loadout: start, tactic: t } })));
      // the best single tactic for every rival (the mean of the three stages' win rates on calibration)
      let uni = { m: -1, i: -1 };
      for (let i = 0; i < grid.length; i++) { const r = B.replay(bc, () => ({ kit: { loadout: start, tactic: grid[i] } })); const m = (B.wr(r.stage[0]) + B.wr(r.stage[1]) + B.wr(r.stage[2])) / 3; if (m > uni.m) uni = { m, i }; }
      const single = B.replay(bh, () => ({ kit: { loadout: start, tactic: grid[uni.i] } }));
      const kitAuto = L.arg('kits', '1') === '1' ? perRival(bc, bh, KITS.map((k) => ({ kit: { loadout: k, tactic: {} } }))) : null;
      const SK = kitAuto ? counts(bh, (e) => ({ kit: { loadout: (KITS[kitAuto.best[`${e.foeId}:${e.stage}`]?.i] ?? e.ren.kit.loadout), tactic: {} } })) : null;
      const hand = (p, seed) => { const d = careless(p, seed), o = { stage: { 0: [0, 0], 1: [0, 0], 2: [0, 0] } }; for (const e of bh) { const r = L.AU.autoDuel(B.renOf(e), B.foeOf(e), e.seed, { deciders: { player: d } }); o.stage[e.stage][1]++; if (L.AU.autoWinner(r) === 0) o.stage[e.stage][0]++; } return o; };
      const h4 = hand(0.25, 7), h2 = hand(0.5, 11);
      // the conditions the per-rival tactics use, and the kits the per-rival choice brings
      const used = {}; for (const b of Object.values(tac.best)) if (b.i >= 0) for (const [id, c] of Object.entries(grid[b.i])) used[`${id}:${c}`] = (used[`${id}:${c}`] ?? 0) + 1;
      const kitsUsed = {}; if (kitAuto) for (const b of Object.values(kitAuto.best)) { const k = b.i >= 0 ? KITS[b.i].join('.') : 'automatique (rien de mieux)'; kitsUsed[k] = (kitsUsed[k] ?? 0) + 1; }
      console.log(`${name.padEnd(6)} ${V.about}\n         niveaux ×${f[0].toFixed(2)} / ×${f[1].toFixed(2)} / ×${f[2].toFixed(2)}\n           ${countLine(S)}`);
      if (SK) console.log(`         avec le kit par rival :
           ${countLine(SK)}`);
      console.log(`         tenus à part (poule / tableau / finale) : automatique ${line3(auto)} | une tactique pour tous ${line3(single)} ${JSON.stringify(grid[uni.i]).replace(/"/g, '')} | tactique par rival ${line3(tac.res)}${kitAuto ? ` | kit par rival ${line3(kitAuto.res)}` : ''} | hasard 1/4 ${line3(h4)} | hasard 1/2 ${line3(h2)}`);
      console.log(`         conditions retenues : ${Object.entries(used).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}×${n}`).join(' ')}`);
      if (kitAuto) console.log(`         kits retenus : ${Object.entries(kitsUsed).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k}×${n}`).join(' ')}`);
      out[name] = { f, S, SK, auto: auto.stage, single: single.stage, singleTactic: grid[uni.i], tactic: tac.res.stage, kit: kitAuto?.res.stage, h4: h4.stage, h2: h2.stage, used, kitsUsed, tacBest: Object.fromEntries(Object.entries(tac.best).map(([k, b]) => [k, { w: b.w, n: b.n, tactic: b.i >= 0 ? grid[b.i] : null }])), kitBest: kitAuto ? Object.fromEntries(Object.entries(kitAuto.best).map(([k, b]) => [k, { w: b.w, n: b.n, kit: b.i >= 0 ? KITS[b.i] : null }])) : null };
      Object.assign(AD.AUTO_RACE.norm, keep.norm); AD.AUTO_RACE.pool = keep.pool; Object.assign(AD.AUTO_RACE.stage, keep.stage);
      if (L.arg('json')) fs.writeFileSync(L.arg('json'), JSON.stringify(out, null, 1));
    }
  } finally { L.setModel(null); await L.server.close(); }
}
