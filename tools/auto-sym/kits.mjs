// AC-12's test on a model (tools/auto-lab.mjs kits --norm=rival): each rival at the level where the start kit makes the stage's target against it, then the
// preparations against each; the good answers (within 10 points of the best) and what dominates (within 3 points of the best against all).
//   node tools/auto-sym/kits.mjs --model=game|sym [--c=0.75] [--race=f] [--stage=2] [--seeds=1..60]
import fs from 'node:fs';
import * as L from './lab.mjs';
const { RIVALS, range, arg, AD } = L;
const SYM = { ...L.GAME, streams: 'split', ap: 'pay', combo: 'weapon', table: 'ren', cadence: +arg('c', '0.75'), cooldown: 'db53', traits: 'none', ai: 'auto', heavy: 'base', renHeavy: 'base' };
if (arg('race')) L.setRace(JSON.parse(fs.readFileSync(arg('race'), 'utf8')));
const KITS = {
  'départ': { loadout: ['t1', 't4', 'd1', 's1'] }, 'puissante': { loadout: ['heavy', 't1', 't4', 's1'] }, 'offensives': { loadout: ['t1', 't2', 't3', 't4'] },
  'fracas': { loadout: ['k_sunder', 't1', 't4', 'd1'] }, 'feinte': { loadout: ['k_feint', 't2', 't4', 's1'] }, 'défensif': { loadout: ['t1', 'd1', 'k_iron', 's1'] },
  'épée': { loadout: ['t1', 't4', 'd1', 's1'], weapon: 'training-sword' }, 'lame': { loadout: ['t1', 't4', 'd1', 's1'], weapon: 'imported-blade' }, 'sabre': { loadout: ['t1', 't4', 'd1', 's1'], weapon: 'duelist-sabre' },
};
const STAGE_DAY = { 0: 4, 1: 6, 2: 10 }, TARGET = { 0: 0.85, 1: 0.65, 2: 0.5 };
const stage = +arg('stage', '2'), seeds = range(arg('seeds', '1..60')), day = STAGE_DAY[stage];
try {
  L.setModel(arg('model', 'sym') === 'sym' ? SYM : L.GAME);
  const R = AD.AUTO_RACE, T = Object.fromEntries(Object.keys(KITS).map((k) => [k, {}]));
  for (const id of RIVALS) {
    const keep = R.norm[id]; let lo = 0.2, hi = 5;
    for (let i = 0; i < 12; i++) { const m = (lo + hi) / 2; R.norm[id] = keep * m; const r = L.duelsOf({ day, seeds, stage, foes: [id] })[0]; if (r.w / r.n > TARGET[stage]) lo = m; else hi = m; }
    R.norm[id] = keep * (lo + hi) / 2;
    for (const [k, K] of Object.entries(KITS)) { const r = L.duelsOf({ day, loadout: K.loadout, weapon: K.weapon, seeds, stage, foes: [id] })[0]; T[k][id] = r.w / r.n; }
    R.norm[id] = keep;
  }
  console.log(`étape ${stage}, chaque rival au niveau où le kit de départ fait ${Math.round(100 * TARGET[stage])} % : ${RIVALS.join(' / ')}`);
  for (const [k, v] of Object.entries(T)) console.log(`  ${k.padEnd(11)} ${RIVALS.map((id) => String(Math.round(100 * v[id])).padStart(3)).join(' ')}   moyenne ${Math.round(100 * RIVALS.reduce((n, id) => n + v[id], 0) / RIVALS.length)}`);
  const kits = Object.keys(KITS).filter((k) => !['épée', 'lame', 'sabre'].includes(k)), good = {}, best = {};
  for (const id of RIVALS) { const b = Math.max(...kits.map((k) => T[k][id])); good[id] = kits.filter((k) => T[k][id] >= b - 0.1); best[id] = kits.filter((k) => T[k][id] >= b - 0.03); }
  const dom = kits.filter((k) => RIVALS.every((id) => best[id].includes(k)));
  console.log(`  bonnes réponses : ${RIVALS.map((id) => `${id} ${good[id].join('+')}`).join(' ; ')}`);
  console.log(`  domine partout : ${dom.join(', ') || 'aucun'} ; test ${RIVALS.every((id) => good[id].length >= 2) && !dom.length ? 'tenu' : 'non tenu'}`);
} finally { L.setModel(null); await L.server.close(); }
