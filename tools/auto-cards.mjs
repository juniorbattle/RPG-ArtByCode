// The winner's card measured (the operator's CL-2 « Version légère : deux cartes par victoire (stat, niveau de compétence, bourse) », his note « mais a determiner si on se
// limite que a 2 par victoire ? pk pas + ? », journal Passes CL1 / CV1, briefs/combat-auto.md § 45). Node only, nothing in src/ reads this file: whole games of the
// TournamentLab (tools/auto-lab.mjs as a library) with the offer's numbers changed (`CARD_RULES`, src/simulation/v2cards.ts) and the way each policy takes its card (`LAB_CARDS`,
// src/tournament/lab.ts).
//   node tools/auto-cards.mjs number [--policies=planner,reference,curious] [--seeds=101..300] [--picks=rank,random,best] [--offered=0,2,3,4] [--npicks=1,2] [--json=f]
//       the number of cards offered (0 = none, today's game) and of cards taken, for each way of choosing: the titles, the stages won, the bouts' length, the purse, the
//       cards taken by kind and the lasting points
//   node tools/auto-cards.mjs kinds [--policies=...] [--seeds=...] [--offered=3] [--npicks=1]
//       each kind of card taken alone (a stat, a skill, the purse), against the rank's taste and the player who tries each card (best)
//   node tools/auto-cards.mjs sets "<CARDS.purse=0.5,CARDS.point=2,...>" [--seeds=...]
//       the same with other numbers: CARDS.offered, CARDS.picks, CARDS.purse, CARDS.levelCap, CARDS.point (the stat card's points)
//   every command: --seeds=a..b or a,b,c (default 101..300, the held-out seeds of the race's fit); the first row of `number` (offered 0) is the control: today's game
process.argv.splice(2, 0, 'lib');
const AL = await import('./auto-lab.mjs');
const { server, range, med, pct } = AL;
import fs from 'node:fs';

const arg = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const LAB = await server.ssrLoadModule('/src/tournament/lab.ts');
const CARDS = await server.ssrLoadModule('/src/simulation/v2cards.ts');
const ST = await server.ssrLoadModule('/src/combat/stats.ts');
const PULSE = await server.ssrLoadModule('/src/tournament/pulse.ts');
const REACT = await server.ssrLoadModule('/src/simulation/v2react.ts');

/** the numbers a run may change */
export const TABLES = { CARDS: { offered: [CARDS.CARD_RULES, 'offered'], picks: [CARDS.CARD_RULES, 'picks'], purse: [CARDS.CARD_RULES, 'purse'], levelCap: [CARDS.CARD_RULES, 'levelCap'], point: [ST.CARD, 'point'] } };
export function setNumbers(spec) {
  const keep = [];
  for (const kv of spec.split(',').filter(Boolean)) {
    const [k, v] = kv.split('='), [t, f] = k.split('.'), cell = TABLES[t]?.[f];
    if (!cell) throw new Error(`no number ${k}`);
    keep.push([cell, cell[0][cell[1]]]); cell[0][cell[1]] = +v;
  }
  return () => { for (const [cell, v] of keep.reverse()) cell[0][cell[1]] = v; };
}

/** whole games of a policy under the current numbers: the stages won, the titles, the purse, the cards taken, the lasting points, the fame by the morning of each day */
export function gamesRun(pn, seeds, pick) {
  const P = LAB.POLICIES[pn], keepPick = LAB.LAB_CARDS.pick;
  if (!P) throw new Error(`no policy ${pn}`);
  LAB.LAB_CARDS.pick = pick;
  const R = { pn, n: 0, skipped: 0, crowns: 0, finals: 0, cut: 0, stageWins: {}, dur: { 0: [], 1: [], 2: [] }, coins: [], taken: { stat: 0, skill: 0, purse: 0 }, offers: 0, waiting: 0, points: 0, levels: 0, stats: { atk: 0, def: 0, end: 0, viv: 0 }, fame: [], fameDay: Array.from({ length: 11 }, () => []), purseSum: 0 };
  try {
    for (const seed of seeds) {
      const fameSeen = [];
      const wrap = { name: pn, skill: P.skill, choose: (st) => { if (st.slot === 'morning' && fameSeen[st.day] === undefined) fameSeen[st.day] = st.pulse.playerFame; return P.choose(st); } };
      let st;
      try { st = LAB.autoplay(seed, wrap, 'Ren', 320, 'auto').state; } catch (e) { if (!/refused action|did not finish/.test(String(e))) throw e; R.skipped++; continue; }
      R.n++;
      const mine = st.tournament.matches.filter((m) => m.a === 'player' || m.b === 'player');
      if (st.flags.champion === 'player') R.crowns++;
      if (mine.some((m) => m.stage === 'final')) R.finals++;
      if (mine.some((m) => m.stage === 'semi')) R.cut++;
      for (const m of mine) { const k = m.stage ?? `pool-j${m.day}`; (R.stageWins[k] ??= { w: 0, n: 0 }).n++; if (m.winner === 'player') R.stageWins[k].w++; }
      for (const n of st.v2?.$notes ?? []) if (n.kind === 'bout') R.dur[n.day <= 5 ? 0 : n.day <= 9 ? 1 : 2].push(n.t);
      R.coins.push(st.player.coins);
      const c = st.v2?.cards;
      if (c) {
        for (const id of c.taken) R.taken[id.split(':')[0]]++;
        R.offers += st.log.filter((e) => e.id === 'cards:offered').length; R.waiting += c.offers.length;
        for (const k of Object.keys(R.stats)) R.stats[k] += c.stats[k] ?? 0;
      }
      R.fame.push(st.pulse.playerFame);
      fameSeen.forEach((f, d) => { if (f !== undefined) R.fameDay[d].push(f); });
    }
  } finally { LAB.LAB_CARDS.pick = keepPick; }
  return R;
}
const winRate = (R, keys) => { let w = 0, n = 0; for (const k of keys) { const v = R.stageWins[k]; if (v) { w += v.w; n += v.n; } } return n ? Math.round((100 * w) / n) : NaN; };
export function line(label, R) {
  const r = (k) => pct(R.stageWins[k]?.w ?? 0, R.stageWins[k]?.n ?? 0), per = (x) => (R.n ? (x / R.n).toFixed(1) : '-');
  return `${label.padEnd(34)} titres ${String(pct(R.crowns, R.n)).padStart(3)} %  finale ${String(pct(R.finals, R.n)).padStart(3)} %  demi ${String(pct(R.cut, R.n)).padStart(3)} %  poule ${String(winRate(R, ['pool-j2', 'pool-j4', 'pool-j5'])).padStart(3)} %  j2 ${r('pool-j2')} j4 ${r('pool-j4')} j5 ${r('pool-j5')} demi ${r('semi')} 3e ${r('third')} fin ${r('final')}  durées ${[0, 1, 2].map((s) => (R.dur[s].length ? med(R.dur[s]).toFixed(0) : '-')).join('/')} s  bourse ${med(R.coins)}  cartes ${per(R.taken.stat + R.taken.skill + R.taken.purse)} (stat ${per(R.taken.stat)} niv ${per(R.taken.skill)} bourse ${per(R.taken.purse)}) en attente ${per(R.waiting)}`;
}

// --sets=CARDS.purse=0.5,CARDS.point=1: other numbers under every run of `number` and `kinds`
const EXTRA = arg('sets') ? `,${arg('sets')}` : '';
const POLICIES = arg('policies', 'planner,reference,curious').split(','), seeds = range(arg('seeds', '101..300')), out = {};
const cmd = process.argv[3 + 1 - 1 + 1] ?? process.argv[3];
const command = process.argv.find((x, i) => i > 2 && !x.startsWith('--') && x !== 'lib');
if (command === 'number') {
  for (const pn of POLICIES) {
    console.log(`${pn} : ${seeds.length} parties`);
    for (const pick of arg('picks', 'rank,random,best').split(',')) for (const k of arg('npicks', '1').split(',').map(Number)) for (const n of arg('offered', '0,2,3,4').split(',').map(Number)) {
      if (n === 0 && (pick !== arg('picks', 'rank,random,best').split(',')[0] || k !== 1)) continue;
      if (k > n && n > 0) continue;
      const undo = setNumbers(`CARDS.offered=${n},CARDS.picks=${k}${EXTRA}`), t0 = performance.now();
      const R = gamesRun(pn, seeds, pick); undo();
      const label = n === 0 ? 'aucune carte (témoin)' : `${n} cartes, ${k} prise${k > 1 ? 's' : ''}, ${pick}`;
      console.log(`  ${line(label, R)}  (${((performance.now() - t0) / 1000).toFixed(0)} s)`);
      (out[pn] ??= {})[label] = R;
    }
  }
} else if (command === 'kinds') {
  const n = +arg('offered', '3'), k = +arg('npicks', '1');
  for (const pn of POLICIES) {
    console.log(`${pn} : ${seeds.length} parties, ${n} cartes, ${k} prise${k > 1 ? 's' : ''}`);
    const undo0 = setNumbers(`CARDS.offered=0${EXTRA}`);
    const C = gamesRun(pn, seeds, 'rank'); undo0(); console.log(`  ${line('aucune carte (témoin)', C)}`); (out[pn] ??= {}).control = C;
    for (const pick of arg('picks', 'stat,skill,purse,rank,random,best').split(',')) {
      const undo = setNumbers(`CARDS.offered=${n},CARDS.picks=${k}${EXTRA}`), R = gamesRun(pn, seeds, pick); undo();
      console.log(`  ${line(`toujours : ${pick}`, R)}`); out[pn][pick] = R;
    }
  }
} else if (command === 'sets') {
  const spec = process.argv.find((x, i) => i > 3 && !x.startsWith('--')) ?? '';
  for (const pn of POLICIES) {
    const undo = setNumbers(spec), R = gamesRun(pn, seeds, arg('pick', 'rank')); undo();
    console.log(`${pn} : ${line(spec || 'le jeu', R)}`); (out[pn] ??= {})[spec] = R;
  }
} else if (command === 'fit') {
  // the race refitted with the cards (PB-3, journal Passe CV1): the bracket's and the final's factors on the planner's whole games, the planner taking its card as `--fitpick` says (random
  // by default: no taste assumed); the pool's day-2 fit reads the planner's bouts before any card and its slope is SL1-1's, so only the two stage factors move; then the held-out games
  // of every policy under each way of choosing, with the refitted race
  const n = +arg('offered', '3'), k = +arg('npicks', '1'), undo = setNumbers(`CARDS.offered=${n},CARDS.picks=${k}${EXTRA}`), keepPick = LAB.LAB_CARDS.pick;
  const seedList = (x) => String(x).split(',').flatMap((q) => range(q)), AD = await server.ssrLoadModule('/src/combat/autoData.ts');
  const before = JSON.stringify({ norm: AD.AUTO_RACE.norm, pool: AD.AUTO_RACE.pool, stage: AD.AUTO_RACE.stage });
  LAB.LAB_CARDS.pick = arg('fitpick', 'random');
  const race = AL.fitRace({ calSeeds: seedList(arg('cal', '1..100,301..400')), pn: 'planner', targets: arg('targets', '50,50').split(',').map((x) => +x / 100) });
  console.log(`avant : ${before}\nla course avec ${n} cartes, ${k} prise${k > 1 ? 's' : ''}, le planificateur au choix « ${arg('fitpick', 'random')} » : ${JSON.stringify(race)}`);
  if (arg('raceout')) fs.writeFileSync(arg('raceout'), JSON.stringify(race, null, 1));
  for (const pn of POLICIES) {
    console.log(`${pn} : ${seeds.length} parties tenues à part`);
    for (const pick of arg('picks', 'random,rank,best,none').split(',')) {
      const R = gamesRun(pn, seeds, pick); console.log(`  ${line(`choix : ${pick}`, R)}`); (out[pn] ??= {})[pick] = R;
    }
  }
  out.race = race; LAB.LAB_CARDS.pick = keepPick; undo();
} else if (command === 'fame') {
  // the fame the games reach (journal Passe CL3): the pulse's playerFame by the morning of each day and at the end, and the tiers' shares
  const F = ST; void F;
  for (const pn of POLICIES) {
    const R = gamesRun(pn, seeds, arg('pick', 'rank'));
    const tiers = (xs) => { const t = { unknown: 0, noticed: 0, known: 0, celebrated: 0 }; for (const f of xs) t[REACT.fameTier({ pulse: { playerFame: f } })]++; return Object.entries(t).map(([k, v]) => `${k} ${pct(v, xs.length)} %`).join(' · '); };
    console.log(`${pn} (${R.n} parties) : fame finale méd. ${med(R.fame)} [${Math.min(...R.fame)}-${Math.max(...R.fame)}] ; ${tiers(R.fame)}`);
    for (let d = 1; d <= 10; d++) if (R.fameDay[d].length) console.log(`   matin du jour ${String(d).padStart(2)} : méd. ${med(R.fameDay[d])} ; ${tiers(R.fameDay[d])}`);
    out[pn] = R;
  }
} else console.log('commands: number | kinds | sets "<CARDS.x=v,...>" | fame (see the header)');
void PULSE;
if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
await server.close();
