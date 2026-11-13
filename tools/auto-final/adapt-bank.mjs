// The tactic by rival learnt at a set of rules' own race (journal Passe CF1): on the reference's calibration bouts (whole games, the race in force), for each rival
// and stage the best tactic of Ren's four (tacticGrid), kept only when it beats the automatic by `margin`; then the reference's whole games on held-out seeds
// with that table at the match sheet (`adapte-tactique`).
//   node tools/auto-final/adapt-bank.mjs --variant=<name> [--race=f.json] [--cal=1..100,301..400] [--held=101..300] [--margin=0.03] [--out=table.json]
import fs from 'node:fs';
import * as L from './lab.mjs';
import * as B from './bank.mjs';
import { VARIANTS } from './variants.mjs';
import { tacticGrid } from './explore.mjs';
import { judge, seedsOf } from './measure.mjs';
import { chooserOf } from './final.mjs';
const V = VARIANTS[L.arg('variant', 'PF')];
try {
  L.setModel(V.cfg);
  if (L.arg('race')) { const r = JSON.parse(fs.readFileSync(L.arg('race'), 'utf8')); Object.assign(L.AD.AUTO_RACE.norm, r.norm); L.AD.AUTO_RACE.pool = r.pool; Object.assign(L.AD.AUTO_RACE.stage, r.stage); }
  const cal = B.captureBank(seedsOf(L.arg('cal', '1..100,301..400'))), grid = tacticGrid({ loadout: ['t1', 't4', 'd1', 's1'] }), margin = +L.arg('margin', '0.03');
  const auto = B.replay(cal), best = {};
  for (const [k, v] of Object.entries(auto.rival)) best[k] = { w: B.wr(v), i: -1 };
  for (let i = 0; i < grid.length; i++) { const r = B.replay(cal, () => ({ kit: { tactic: grid[i] } })); for (const [k, v] of Object.entries(r.rival)) if (B.wr(v) > best[k].w + (best[k].i < 0 ? margin : 1e-9)) best[k] = { w: B.wr(v), i }; }
  const table = { 0: {}, 1: {}, 2: {} };
  for (const [k, b] of Object.entries(best)) { const [foe, s] = k.split(':'); if (b.i >= 0) table[s][foe] = { rows: [{ loadout: ['t1', 't4', 'd1', 's1'], tactic: grid[b.i] }], start: { tactic: grid[b.i] }, auto: B.wr(auto.rival[k]), w: b.w }; }
  console.log(`${V.about}\n  tactiques retenues (calage, ${cal.length} combats) : ${Object.entries(table).map(([s, T]) => `étape ${s} : ${Object.entries(T).map(([f, x]) => `${f} ${Math.round(100 * x.auto)}→${Math.round(100 * x.w)} %`).join(', ') || 'aucune'}`).join(' ; ')}`);
  if (L.arg('out')) fs.writeFileSync(L.arg('out'), JSON.stringify(table, null, 1));
  const held = seedsOf(L.arg('held', '101..300'));
  judge(['reference'], held);
  L.setKitChooser(chooserOf(table, true));
  judge([{ ...L.LAB.POLICIES.reference, name: 'adapte-tactique' }], held);
} finally { L.setKitChooser(null); L.setModel(null); await L.server.close(); }
