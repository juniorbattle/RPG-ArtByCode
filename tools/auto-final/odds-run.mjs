// The odds under a set of rules (journal Passe CF1): fitted on the off-screen bouts of calibration seeds, judged on held-out ones and on the player's bouts.
//   node tools/auto-final/odds-run.mjs --variant=<name> [--cal=1..30] [--held=101..130] [--race=f.json]
import fs from 'node:fs';
import * as L from './lab.mjs';
import * as B from './bank.mjs';
import * as O from './odds.mjs';
import { VARIANTS } from './variants.mjs';
import { seedsOf } from './measure.mjs';
const V = VARIANTS[L.arg('variant', 'game')];
try {
  L.setModel(V.cfg);
  if (L.arg('race')) Object.assign(L.AD.AUTO_RACE, JSON.parse(fs.readFileSync(L.arg('race'), 'utf8')));
  const cal = O.offscreenData(seedsOf(L.arg('cal', '1..30'))), held = O.offscreenData(seedsOf(L.arg('held', '101..130')));
  const F = O.fit(cal), J = O.judgeOdds(held, F.k, F.e);
  const show = (j) => `Brier ${j.brier.toFixed(3)}, perte log ${j.ll.toFixed(3)}, le favori gagne ${(100 * j.fav).toFixed(0)} % ; par dixième de la cote : ${j.bins.map((b, i) => (b ? `${i * 10}-${i * 10 + 10} % → ${(100 * b.w).toFixed(0)} % (${b.n})` : null)).filter(Boolean).join(', ')}`;
  console.log(`${V.about}\n  cote : k ${F.k}, e ${F.e} (calée sur ${cal.length} combats hors écran)\n  hors écran tenus à part (${held.length}) : ${show(J)}`);
  // the player's bouts: Ren's sheet against the rival's
  const bank = B.captureBank(seedsOf(L.arg('bouts', '101..200')));
  const rows = bank.map((e) => { const A = B.renOf(e), Fo = B.foeOf(e), r = L.AU.autoDuel(A, Fo, e.seed); return { a: { hp: A.hp, atk: A.atk, def: A.def, end: A.end, viv: A.viv }, b: { hp: Fo.hp, atk: Fo.atk, def: Fo.def, end: Fo.end, viv: Fo.viv }, win: L.AU.autoWinner(r) === 0 ? 1 : 0 }; });
  console.log(`  combats du joueur (${rows.length}) : ${show(O.judgeOdds(rows, F.k, F.e))}`);
  const n = +L.arg('n', '60');
  const mc = held.slice(0, +L.arg('mcrows', '1260')).map((x) => ({ p: O.rehearsal(x.A, x.B, x.seed, n), win: x.win }));
  console.log(`  cote par ${n} combats d'essai (formes du jour connues) — hors écran tenus à part (${mc.length}) : ${show(O.judgeP(mc))}`);
  console.log(`  — combats du joueur : ${show(O.judgeP(bank.map((e, i) => ({ p: O.rehearsal(B.renOf(e), B.foeOf(e), e.seed, n), win: rows[i].win }))))}`);
  const Fr = O.fit(rows); console.log(`  (calée sur les combats du joueur eux-mêmes : k ${Fr.k}, e ${Fr.e} : ${show(O.judgeOdds(rows, Fr.k, Fr.e))})`);
} finally { L.setModel(null); await L.server.close(); }
