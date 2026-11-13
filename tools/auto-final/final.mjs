// The workshop's verdict on whole games (journal Passe CF1): a set of rules, its race refitted as AC-16 does (fitRace), then every policy's whole games on
// held-out seeds, the adaptive players among them: `adapte-tactique` the reference choosing at the match sheet the tactic of its four against each rival,
// `adapte` the reference who also learns the Lunge, buys the Whirlwind and Sunder, and brings the kit and tactic that answer each rival (the table of kits.mjs).
//   node tools/auto-final/final.mjs --variant=<name> [--table=kitsR.json] [--cal=1..100,301..400] [--held=101..300] [--pool=1,1.075,1.15] [--race=f.json] [--out=f.json]
import fs from 'node:fs';
import * as L from './lab.mjs';
import { VARIANTS } from './variants.mjs';
import { adaptive, fitRace, judge, seedsOf } from './measure.mjs';
const { AD, V2 } = L;
const V = VARIANTS[L.arg('variant', 'P1')];
const stageAt = (st) => (st.tournament.matches.some((m) => m.day === st.day && m.stage === 'final' && (m.a === 'player' || m.b === 'player')) ? 2 : st.day >= 6 ? 1 : 0);
/** the match sheet's choice from a table (kits.mjs's rows, ranked): the first kit Ren owns, with its tactic; `tacticOnly` keeps his four */
export function chooserOf(table, tacticOnly = false) {
  return (st, foeId, kit, kitOf) => {
    const rows = table?.[stageAt(st)]?.[kitOf]?.rows ?? [];
    const lv = kit.levels;
    for (const r of rows) {
      if (tacticOnly && [...r.loadout].sort().join('.') !== [...kit.loadout].sort().join('.')) continue;
      if (r.loadout.every((id) => (lv[id] ?? 0) > 0)) return { ...kit, loadout: [...r.loadout], order: undefined, tactic: { ...r.tactic } };
    }
    if (tacticOnly) { const t = table?.[stageAt(st)]?.[kitOf]?.start?.tactic; if (t) return { ...kit, tactic: { ...t } }; }
    return kit;
  };
}
if (process.argv[1].endsWith('final.mjs')) {
  const cal = seedsOf(L.arg('cal', '1..100,301..400')), held = seedsOf(L.arg('held', '101..300')), out = { variant: L.arg('variant', 'P1'), about: V.about };
  try {
    L.setModel(V.cfg);
    let race;
    if (L.arg('race')) { race = JSON.parse(fs.readFileSync(L.arg('race'), 'utf8')); Object.assign(AD.AUTO_RACE, race); AD.AUTO_RACE.pool = race.pool; }
    else race = fitRace({ calSeeds: cal, pool: L.arg('pool', '1,1.075,1.15').split(',').map(Number), quiet: true });
    out.race = race;
    console.log(`${V.about}\n  la course : ${JSON.stringify(race)}`);
    const table = L.arg('table') ? JSON.parse(fs.readFileSync(L.arg('table'), 'utf8')) : null;
    const pols = ['reference', 'planner', 'curious', 'diligent', 'idle'];
    out.games = judge(pols, held, { rhythm: true });
    if (table) {
      L.setKitChooser(chooserOf(table, true));
      Object.assign(out.games, judge([{ ...L.LAB.POLICIES.reference, name: 'adapte-tactique' }], held));
      L.setKitChooser(chooserOf(table));
      Object.assign(out.games, judge([adaptive({ name: 'adapte', learns: ['t2'], buys: ['t3', 'k_sunder'] })], held));
      L.setKitChooser(null);
    }
    if (L.arg('out')) fs.writeFileSync(L.arg('out'), JSON.stringify(out, null, 1));
  } finally { L.setKitChooser(null); L.setModel(null); await L.server.close(); }
}
