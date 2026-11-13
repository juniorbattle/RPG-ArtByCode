// The kits and tactics against each rival under a set of rules (journal Passe CF1): search.mjs on the adaptive player's bank (its repertoire learnt and bought),
// chosen on calibration games, the chosen answers judged again on held-out Rens; AC-12's test; the conditions the answers use; the automatic's place.
//   node tools/auto-final/kits.mjs --variant=<name> [--stages=0,1,2] [--rep=t1,t2,t3,t4,d1,s1,k_sunder] [--cal=1..100] [--held=101..200] [--race=f.json] [--out=f.json]
import fs from 'node:fs';
import * as L from './lab.mjs';
import * as B from './bank.mjs';
import * as S from './search.mjs';
import { VARIANTS } from './variants.mjs';
import { seedsOf } from './measure.mjs';
import { levelBank } from './level.mjs';
const { RIVALS, pct } = L;
const AIM = { 0: 0.85, 1: 0.65, 2: 0.5 };
/** each rival's own factor at a stage (its pool factor for the pool, a per-rival share of the stage's factor otherwise) so that the start kit's automatic wins AIM */
function rivalNorm(bank, stage) {
  const R = L.AD.AUTO_RACE, cross = S.crossOf(bank, stage, 120);
  for (const id of RIVALS) {
    const keep = R.norm[id]; let lo = 0.3, hi = 4;
    for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; R.norm[id] = keep * m; const w = S.winsOf(cross(id), { kit: { loadout: ['t1', 't4', 'd1', 's1'] } }); if (w > AIM[stage]) lo = m; else hi = m; }
    R.norm[id] = keep * (lo + hi) / 2;
  }
}
const V = VARIANTS[L.arg('variant', 'game')], rep = L.arg('rep', 't1,t2,t3,t4,d1,s1,k_sunder').split(',');
try {
  L.setModel(V.cfg);
  if (L.arg('race')) Object.assign(L.AD.AUTO_RACE, JSON.parse(fs.readFileSync(L.arg('race'), 'utf8')));
  // a bank whose Rens own the whole repertoire (the skills not owned put at level 1, the others at the reference's levels)
  const withRep = (bank) => bank.map((e) => ({ ...e, ren: { ...e.ren, kit: { ...e.ren.kit, levels: { ...Object.fromEntries(rep.map((k) => [k, 1])), ...e.ren.kit.levels } } } }));
  const cal0 = B.captureBank(seedsOf(L.arg('cal', '1..100'))), held = withRep(B.captureBank(seedsOf(L.arg('held', '101..200'))));
  // the rivals at the level where the reference's automatic wins AC-15's aims (the pool 85 %, the bracket 65 %, the final 50 %)
  if (L.arg('level', '1') === '1') { const f = levelBank(cal0); console.log('niveaux : ' + [0, 1, 2].map((s) => 'x' + f[s].toFixed(2)).join(' / ')); }
  const cal = withRep(cal0);
  const out = {};
  for (const stage of L.arg('stages', '0,1,2').split(',').map(Number)) {
    // each rival alone at the level where the start kit's automatic wins the stage's aim on the cross duels (AC-12 by rival, journal Passe LC1)
    if (L.arg('norm') === 'rival') rivalNorm(cal, stage);
    const R = S.searchStage(cal, stage, rep, { n: +L.arg('n', '120') }), A = S.ac12Of(R), crossH = S.crossOf(held, stage, 200);
    console.log(`étape ${stage} — ${V.about}`);
    const used = {};
    out[stage] = {};
    for (const foe of RIVALS) {
      const top = R[foe][0], start = R[foe].find((r) => r.loadout.join('.') === 't1.t4.d1.s1');
      const hb = crossH(foe), hTop = S.winsOf(hb, { kit: { loadout: top.loadout, tactic: top.tactic } }), hAuto = S.winsOf(hb, { kit: { loadout: ['t1', 't4', 'd1', 's1'] } });
      for (const r of R[foe].filter((x) => x.w >= top.w - 0.1)) for (const [id, c] of Object.entries(r.tactic)) used[`${S.FAM(id)}:${c}`] = (used[`${S.FAM(id)}:${c}`] ?? 0) + 1;
      console.log(`  ${foe.padEnd(8)} départ auto ${pct(start.auto * 100, 100)} %, sa tactique ${pct(start.w * 100, 100)} % | meilleur ${top.loadout.join('.')} ${JSON.stringify(top.tactic).replace(/"/g, '')} ${pct(top.w * 100, 100)} % (auto ${pct(top.auto * 100, 100)} %) | tenus à part : départ auto ${pct(hAuto * 100, 100)} → meilleur ${pct(hTop * 100, 100)} % | bonnes réponses ${A.good[foe].length}`);
      out[stage][foe] = { top: { loadout: top.loadout, tactic: top.tactic, w: top.w, auto: top.auto }, start: { auto: start.auto, w: start.w, tactic: start.tactic }, held: { auto: hAuto, top: hTop }, good: A.good[foe], rows: R[foe].slice(0, 8).map((r) => ({ loadout: r.loadout, tactic: r.tactic, w: r.w, auto: r.auto })) };
    }
    console.log(`  test AC-12 : ${A.ok ? 'tenu' : 'non tenu'} ; domine : ${A.dominates.join(', ') || 'aucun'}`);
    console.log(`  conditions des bonnes réponses : ${Object.entries(used).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${k} ${n}`).join(', ')}`);
    out[stage].ac12 = A; out[stage].used = used;
  }
  if (L.arg('out')) fs.writeFileSync(L.arg('out'), JSON.stringify(out, null, 1));
} finally { L.setModel(null); await L.server.close(); }
