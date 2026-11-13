// The symmetric model at several common cadences (every charge and power × c, Ren's and the rivals'): the rhythm and the length of the reference's duels
// (isolated, day 4 and the final, against the seven rivals), before the race is fitted.
import * as L from './lab.mjs';
const { range, med, arg } = L;
export const SYM = { ...L.GAME, streams: 'split', ap: 'pay', combo: 'weapon', table: 'ren', cadence: 1, cooldown: 'db53', traits: 'none', ai: 'auto', heavy: 'base', renHeavy: 'base', heavyCd: arg('heavycd', '0') === '1' };
try {
  L.setModel(L.GAME);
  for (const day of [4, 10]) { const R = L.duelsOf({ day, seeds: range('1..40'), log: true }).flatMap((r) => r.rh); console.log(`jeu, jour ${day} : ${L.rhythmLine(R)} ; durée méd. ${med(R.map((x) => x.t)).toFixed(0)} s`); }
  for (const c of (arg('c', '1,0.75,0.6,0.5')).split(',').map(Number)) {
    L.setModel({ ...SYM, cadence: c });
    for (const day of [4, 10]) {
      const rows = L.duelsOf({ day, seeds: range('1..40'), log: true }), R = rows.flatMap((r) => r.rh);
      console.log(`symétrique ×${c}, jour ${day} : ${L.rhythmLine(R)} ; durée méd. ${med(R.map((x) => x.t)).toFixed(0)} s ; Ren gagne ${Math.round(100 * rows.reduce((n, r) => n + r.w / r.n, 0) / rows.length)} %`);
    }
  }
} finally { L.setModel(null); await L.server.close(); }
