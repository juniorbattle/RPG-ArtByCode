// The pool's slope under a set of rules (journal Passe CF1; SL1-1, decision A3): the race of the rules kept (its pool factors, its bracket and final), the
// pool's rounds at several slopes, the reference's and the planner's whole games on held-out seeds.
//   node tools/auto-final/pool.mjs --variant=<name> --race=f.json [--slopes=0.075,0.1,0.125,0.15] [--seeds=101..300]
import fs from 'node:fs';
import * as L from './lab.mjs';
import { VARIANTS } from './variants.mjs';
import { judge, seedsOf } from './measure.mjs';
const V = VARIANTS[L.arg('variant', 'PF')], seeds = seedsOf(L.arg('seeds', '101..300'));
try {
  L.setModel(V.cfg);
  const r = JSON.parse(fs.readFileSync(L.arg('race'), 'utf8'));
  Object.assign(L.AD.AUTO_RACE.norm, r.norm); Object.assign(L.AD.AUTO_RACE.stage, r.stage);
  console.log(`${V.about} ; ${seeds.length} parties`);
  for (const k of L.arg('slopes', '0.075,0.1,0.125,0.15').split(',').map(Number)) {
    L.AD.AUTO_RACE.pool = [1, 1 + k, 1 + 2 * k];
    console.log(`pente +${(100 * k).toFixed(1)} % par tour`);
    judge(['reference', 'planner'], seeds);
  }
} finally { L.setModel(null); await L.server.close(); }
