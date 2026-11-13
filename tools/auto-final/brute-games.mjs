// The model inspired by La Brute on whole games (journal Passe CF2, briefs/combat-auto.md § 32): its race refitted as AC-16 does (measure.mjs's fitRace: each
// rival's pool factor at 95 % against the reference of day 2, the pool's slope, the bracket's and the final's factors on whole games of the reference for AC-15's
// semi-final 65 % and final 50 %), then on held-out seeds: every policy of the game; `adapte-tactique` the reference choosing at the match sheet the tactic of its
// four against each rival; `adapte` the reference who also learns the Feint and buys Sunder, then brings against each rival the kit and the tactic of a table
// learnt on calibration bouts (the best archetype by its automatic, then the best tactic of that kit); careless hands (one choice in four, in two).
//   node tools/auto-final/brute-games.mjs --variant=<name> [--cal=1..100,301..400] [--held=101..300] [--race=f.json] [--out=f.json] [--target=0.65,0.5]
import fs from 'node:fs';
import * as L from './lab.mjs';
import * as B from './bank.mjs';
import { VARIANTS } from './variants.mjs';
import { adaptive, fitRace, judge, seedsOf } from './measure.mjs';
import { chooserOf } from './final.mjs';
import { careless } from './level.mjs';
import { KITS, gridOf, withRep } from './brute.mjs';
const { AD } = L;
const name = L.arg('variant', 'BS'), V = VARIANTS[name];
const cal = seedsOf(L.arg('cal', '1..100,301..400')), held = seedsOf(L.arg('held', '101..300')), out = { variant: name, about: V.about };
const save = () => L.arg('out') && fs.writeFileSync(L.arg('out'), JSON.stringify(out, null, 1));
try {
  L.setModel(V.cfg);
  let race;
  if (L.arg('race')) { race = JSON.parse(fs.readFileSync(L.arg('race'), 'utf8')); race = race.race ?? race; Object.assign(AD.AUTO_RACE.norm, race.norm); AD.AUTO_RACE.pool = [...race.pool]; Object.assign(AD.AUTO_RACE.stage, race.stage); }
  else race = fitRace({ calSeeds: cal, pool: L.arg('pool', '1,1.075,1.15').split(',').map(Number), targets: L.arg('target', '0.65,0.5').split(',').map(Number), quiet: true, policy: L.arg('fitPolicy', 'reference') });
  out.race = race; save();
  console.log(`${V.about}\n  la course : ${JSON.stringify(race)}`);
  out.games = L.arg('adaptOnly') ? {} : judge(['reference', 'planner', 'curious', 'diligent', 'idle'], held, { rhythm: true }); save();
  // the table of the match sheet: against each rival and stage (25 calibration bouts at least), the best archetype by its automatic and the best tactic of that kit,
  // and the start kit's best tactic; a row kept only when it beats what the reference brings (the start kit, its automatic) by 3 points on calibration; every kit
  // in the game's own order of the four (autoDefaultOrder), as the match sheet builds it
  const bc = withRep(B.captureBank(cal)), table = { 0: {}, 1: {}, 2: {} }, start = ['t1', 't4', 'd1', 's1'], margin = +L.arg('margin', '0.03');
  const keyOf = (e) => `${e.foeId}:${e.stage}`, ranks = {}, base = B.replay(bc).rival;
  for (let i = 0; i < KITS.length; i++) { const r = B.replay(bc, () => ({ kit: { loadout: KITS[i], tactic: {} } })); for (const [k, v] of Object.entries(r.rival)) (ranks[k] ??= []).push({ i, w: B.wr(v), n: v[1] }); }
  const bestTactic = (sub, k, kit) => { let best = { w: -1, t: {} }; for (const t of gridOf(kit)) { const r = B.replay(sub, () => ({ kit: { loadout: kit, tactic: t } })); const w = B.wr(r.rival[k]); if (w > best.w + 1e-9) best = { w, t }; } return best; };
  for (const [k, list] of Object.entries(ranks)) {
    const [foe, s] = k.split(':'), sub = bc.filter((e) => keyOf(e) === k), w0 = B.wr(base[k]);
    if (sub.length < 25) continue;
    const rows = [];
    for (const { i } of list.sort((a, b) => b.w - a.w).slice(0, 2)) { const kit = KITS[i], bt = bestTactic(sub, k, kit); if (bt.w >= w0 + margin) rows.push({ loadout: kit, tactic: bt.t, w: bt.w }); }
    const bs = bestTactic(sub, k, start); if (bs.w >= w0 + margin) rows.push({ loadout: start, tactic: bs.t, w: bs.w });
    rows.sort((a, b) => b.w - a.w);
    if (rows.length) table[s][foe] = { rows, n: sub.length, auto: w0 };
  }
  out.table = table; save();
  console.log(`  la table (calage, ${bc.length} combats ; gardé à +${100 * margin} points sur l'automatique) : ${Object.entries(table).map(([s, T]) => `étape ${s} : ${Object.entries(T).map(([f, x]) => `${f} ${x.rows[0].loadout.join('.')} ${Math.round(100 * x.auto)}→${Math.round(100 * x.rows[0].w)} %`).join(', ') || 'rien'}`).join(' ; ')}`);
  {
    let uni = { m: -1, t: {} };
    for (const t of gridOf(start)) { const r = B.replay(bc, () => ({ kit: { loadout: start, tactic: t } })); const m = (B.wr(r.stage[0]) + B.wr(r.stage[1]) + B.wr(r.stage[2])) / 3; if (m > uni.m) uni = { m, t }; }
    out.single = uni.t; console.log(`  une tactique pour tous : ${JSON.stringify(uni.t)}`);
    L.setKitChooser((st, foeId, kit) => ([...kit.loadout].sort().join('.') === [...start].sort().join('.') ? { ...kit, tactic: { ...uni.t } } : kit));
    Object.assign(out.games, judge([{ ...L.LAB.POLICIES.reference, name: 'tactique-unique' }], held));
  }
  L.setKitChooser(chooserOf(table, true));
  Object.assign(out.games, judge([{ ...L.LAB.POLICIES.reference, name: 'adapte-tactique' }], held));
  L.setKitChooser(chooserOf(table));
  Object.assign(out.games, judge([adaptive({ name: 'adapte', learns: ['k_feint'], buys: ['k_sunder'] })], held));
  L.setKitChooser(null); save();
  for (const [p, seed, label] of [[0.25, 7, 'hasard-1/4'], [0.5, 11, 'hasard-1/2']]) {
    L.setModel(V.cfg, { player: () => careless(p, seed) });
    Object.assign(out.games, judge([{ ...L.LAB.POLICIES.reference, name: label }], held));
  }
  save();
} finally { L.setKitChooser(null); L.setModel(null); await L.server.close(); }
