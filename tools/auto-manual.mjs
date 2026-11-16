// The manual mode of the duel (journal Passe CM1, briefs/audit-competences-modes-cm1.md): Ren's skills pressed by the player, whom the laboratory models, against the
// automatic's gambit. Node only, nothing in src/ reads this file: Ren's decider (the game's DECIDERS.player) is replaced for whole games of the TournamentLab
// (tools/auto-lab.mjs as a library); the rivals keep the game's automatic. The base attacks (light, heavy blow), the guard and the dodge stay automatic in every
// player: only the skills are the player's (the operator's request of 15/11/2026).
//   node tools/auto-manual.mjs [--policies=planner,reference] [--seeds=101..300] [--only=a,b] [--json=f]
//       whole games under each player: the titles, the stages won, the duration of a bout; the first row (« automatique ») is the game's duel as it is
// A player is a pair of what he WANTS to press (his judgement, read on the arena as the gambit reads it) and how he presses it:
//   - `lag` : the press is the wish he formed `lag` choices of Ren ago (a choice every 1.5 to 3 s): he reads the arena a beat late and the opening or the incoming
//     blow is gone; the skill still waits for its use and its gap
//   - `lapse` : one time in `lapse` he does not press when he should (a keyed draw, never the duel's)
//   - `wish` : 'general' the automatic's own rule by role (an expert's judgement), 'ready' every skill as soon as it is ready (a beginner who spams), 'none' nothing
process.argv.splice(2, 0, 'lib');
const LAB = await import('./auto-lab.mjs');
const { AU, range, med, pct, server } = LAB;
const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
import fs from 'node:fs';

/** a manual player's decider for Ren (the game's DECIDERS.player): one history per duel (a decision's time going back is a new duel) */
export function manual({ wish = 'general', lag = 0, lapse = 0, bonus = 1 }) {
  let hist = [], last = -1;
  return (v, x) => {
    if (v.t < last - 1e-9 || v.t === 0) hist = [];
    last = v.t;
    const want = wish === 'none' ? null : AU.planChoice(v, x, wish === 'ready' ? x.skills.map(() => 'ready') : null);
    hist.push(want ? want.id : null);
    const id = hist[Math.max(0, hist.length - 1 - lag)];
    const s = id ? x.skills.find((k) => k.id === id) : null;
    // pressed: usable, its effect not running (planChoice with only this line open says both)
    if (s && !(lapse > 0 && v.rand() < lapse) && AU.planChoice(v, x, x.skills.map((k) => (k === s ? 'ready' : 'never')))) return bonus !== 1 && s.power ? { ...s, power: s.power * bonus } : s;
    return AU.heavyWhen(v, x) ? x.heavy : x.light;
  };
}

/** the players measured */
export const PLAYERS = {
  'automatique (le jeu)': null,
  'manuel, jugement du général, à temps': { wish: 'general' },
  'manuel, jugement du général, un choix en retard': { wish: 'general', lag: 1 },
  'manuel, jugement du général, deux choix en retard': { wish: 'general', lag: 2 },
  'manuel, jugement du général, rate 1 appui sur 4': { wish: 'general', lapse: 0.25 },
  'manuel, jugement du général, rate 1 appui sur 2': { wish: 'general', lapse: 0.5 },
  'manuel, dès que prêtes (le débutant)': { wish: 'ready' },
  'manuel, dès que prêtes, un choix en retard': { wish: 'ready', lag: 1 },
  'manuel, aucun appui (il oublie)': { wish: 'none' },
  // the reward for the hand: what the late and the careless hands need to get back to the automatic's titles
  'manuel, un choix en retard, compétences ×1,15': { wish: 'general', lag: 1, bonus: 1.15 },
  'manuel, un choix en retard, compétences ×1,3': { wish: 'general', lag: 1, bonus: 1.3 },
  'manuel, un choix en retard, compétences ×1,5': { wish: 'general', lag: 1, bonus: 1.5 },
  'manuel, rate 1 appui sur 4, compétences ×1,15': { wish: 'general', lapse: 0.25, bonus: 1.15 },
  'manuel, rate 1 appui sur 4, compétences ×1,3': { wish: 'general', lapse: 0.25, bonus: 1.3 },
  'manuel, à temps, compétences ×1,15': { wish: 'general', bonus: 1.15 },
};

if (process.argv[3] !== 'lib2') {
  const seeds = range(arg('seeds', '101..300')), only = arg('only') ? arg('only').split(',') : null, out = {};
  for (const pn of arg('policies', 'planner,reference').split(',')) {
    console.log(`${pn} : ${seeds.length} parties`);
    for (const [name, p] of Object.entries(PLAYERS)) {
      if (only && !only.some((o) => name.includes(o))) continue;
      const t0 = performance.now();
      const G = p ? LAB.withDeciders(AU.autoDecider, manual(p), () => LAB.gamesOf(pn, seeds)) : LAB.gamesOf(pn, seeds);
      const B = G.bouts.filter((b) => b.kind === 'bout');
      const rate = (k) => pct(G.stageWins[k]?.w ?? 0, G.stageWins[k]?.n ?? 0);
      const skills = med(B.map((b) => b.skills)), dur = [0, 1, 2].map((s) => med(B.filter((b) => b.stage === s).map((b) => b.t)));
      const row = { titles: pct(G.crowns, G.n), j2: rate('pool-j2'), j4: rate('pool-j4'), j5: rate('pool-j5'), semi: rate('semi'), final: rate('final'), skillsMed: skills, dur: dur.map((d) => Math.round(d)), n: G.n };
      (out[pn] ??= {})[name] = row;
      console.log(`  ${name.padEnd(52)} titres ${String(row.titres ?? row.titles).padStart(3)} %  poule j2 ${row.j2} j4 ${row.j4} j5 ${row.j5}  demi ${row.semi}  finale ${row.final} %  appuis/combat ${skills}  durées ${row.dur.join(' / ')} s  (${((performance.now() - t0) / 1000).toFixed(0)} s)`);
    }
  }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
  await server.close();
}
