// The laboratory's copy against the game: with the game's configuration and one stream, the same duels event for event and the same whole games.
import * as L from './lab.mjs';
const { AU, AD, LAB, RIVALS, range } = L;
try {
  let same = 0, n = 0;
  for (const day of [2, 4, 6, 10]) for (const id of RIVALS) for (const s of range('1..25')) {
    const R = L.REF[day], st = day >= 10 ? 2 : day >= 6 ? 1 : 0, rd = st === 0 ? AD.autoRound(day) : 0;
    for (const loadout of [['t1', 't4', 'd1', 's1'], ['t1', 't2', 't3', 't4'], ['heavy', 'k_sunder', 'k_iron', 's1'], ['k_feint', 'k_parry', 'k_cry', 'k_focus']]) {
      const A = AD.autoRen(R, { loadout, levels: { t1: R.t1, t4: R.t4 } }, { weapon: R.weapon }), B = AD.autoFoe(id, AD.autoRaceSheet(id, st, rd, { preparation: R.prep }));
      L.setModel(null); const g = AU.autoDuel(A, B, 7000 + s, { log: true, trace: true });
      L.setModel(L.GAME); const m = AU.autoDuel(A, B, 7000 + s, { log: true, trace: true });
      for (const k of ['heavies', 'apWasted', 'dmgExposed']) { delete m.n[0][k]; delete m.n[1][k]; }
      n++; if (JSON.stringify(g) === JSON.stringify(m)) same++; else if (n - same < 3) console.log('différent :', day, id, s, loadout.join('.'));
    }
  }
  console.log(`duels isolés : ${same} / ${n} identiques au jeu, événement par événement (les compteurs neufs du laboratoire retirés)`);
  // off-screen bouts and whole games
  let gs = 0, gn = 0;
  for (const pn of ['reference', 'curious', 'idle']) for (const s of range('101..120')) {
    L.setModel(null); const a = LAB.autoplay(s, LAB.POLICIES[pn], 'Ren', 260, 'v2').state;
    L.setModel(L.GAME); const b = LAB.autoplay(s, LAB.POLICIES[pn], 'Ren', 260, 'v2').state;
    gn++; if (JSON.stringify(a) === JSON.stringify(b)) gs++; else console.log('partie différente :', pn, s);
  }
  console.log(`parties entières : ${gs} / ${gn} états finaux identiques (le combat du joueur, ses défis et les combats hors écran par la copie)`);
} finally { L.setModel(null); await L.server.close(); }
