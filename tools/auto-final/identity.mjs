// The workshop's copy against the game (journal Passe CF1): under GAME, the same duels event for event (isolated duels of every rival at every stage, four
// kits, with their trace) and the same whole games (every policy's final state and fingerprint, the player's bouts, challenges and off-screen bouts by the copy).
//   node tools/auto-final/identity.mjs [--seeds=101..140]
import * as L from './lab.mjs';
const { AU, AD, LAB, RIVALS, range } = L;
const REF = {
  2: { hp: 300, atk: 17, def: 11, end: 10, viv: 10, weapon: 'imported-blade', t1: 1, t4: 1, prep: 37 },
  4: { hp: 324, atk: 17, def: 17, end: 10, viv: 9, weapon: 'imported-blade', t1: 2, t4: 1, prep: 61 },
  6: { hp: 408, atk: 18, def: 16, end: 10, viv: 9, weapon: 'imported-blade', t1: 2, t4: 1, prep: 85 },
  10: { hp: 432, atk: 22, def: 17, end: 14, viv: 9, weapon: 'duelist-sabre', t1: 3, t4: 3, prep: 100 },
};
try {
  let same = 0, n = 0;
  for (const day of [2, 4, 6, 10]) for (const id of RIVALS) for (const s of range('1..20')) {
    const R = REF[day], st = day >= 10 ? 2 : day >= 6 ? 1 : 0, rd = st === 0 ? AD.autoRound(day) : 0;
    for (const loadout of [['t1', 't4', 'd1', 's1'], ['t1', 't2', 't3', 't4'], ['k_sunder', 'k_iron', 's1', 't1'], ['k_feint', 'k_parry', 'k_cry', 'k_focus']]) {
      const tactic = s % 3 === 0 ? { [loadout[0]]: 'broken', [loadout[2]]: 'ready' } : undefined;
      const A = AD.autoRen(R, { loadout, levels: { t1: R.t1, t4: R.t4, heavy: 2 }, ...(tactic ? { tactic } : {}) }, { weapon: R.weapon, apStart: s % 2 }), B = AD.autoFoe(id, AD.autoRaceSheet(id, st, rd, { preparation: R.prep }));
      const cmds = s % 4 === 1 ? [{ t: 20, skill: loadout[1] }] : undefined;
      L.setModel(null); const g = AU.autoDuel(A, B, 7000 + s * 13 + day, { log: true, trace: true, commands: cmds });
      L.setModel(L.GAME); const m = AU.autoDuel(A, B, 7000 + s * 13 + day, { log: true, trace: true, commands: cmds });
      n++; if (JSON.stringify(g) === JSON.stringify(m)) same++; else if (n - same < 4) console.log('différent :', day, id, s, loadout.join('.'));
    }
  }
  console.log(`duels isolés : ${same} / ${n} identiques au jeu, événement par événement (trace comprise)`);
  let gs = 0, gn = 0;
  for (const pn of ['reference', 'planner', 'curious', 'diligent', 'idle']) for (const s of range(L.arg('seeds', '101..124'))) {
    L.setModel(null); const a = LAB.autoplay(s, LAB.POLICIES[pn], 'Ren', 260, 'v2');
    L.setModel(L.GAME); const b = LAB.autoplay(s, LAB.POLICIES[pn], 'Ren', 260, 'v2');
    gn++; if (a.hash === b.hash && JSON.stringify(a.state) === JSON.stringify(b.state)) gs++; else console.log('partie différente :', pn, s);
  }
  console.log(`parties entières : ${gs} / ${gn} identiques (état final et empreinte ; le combat du joueur, ses défis et les combats hors écran par la copie)`);
} finally { L.setModel(null); await L.server.close(); }
