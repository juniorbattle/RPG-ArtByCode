// The townsfolk's duels measured (journal Passe PN1): for each townsperson who fights themselves (src/narrative/npcFighters.ts), how often Ren wins on a given day of a
// game the planner of the laboratory plays (his gear, his training and his vigour as they are that morning), over many duel seeds; and the duels' length.
//   node tools/npc-strength.mjs [--games=1..20] [--days=1,4,7] [--duels=20] [--who=mara,wynn]
import { load } from '../tests/load.mjs';

const args = process.argv.slice(2), opt = (n, d) => args.find((a) => a.startsWith(`--${n}=`))?.slice(n.length + 3) ?? d;
const range = (s) => s.split(',').flatMap((p) => { const [a, b] = p.split('..').map(Number); return b ? Array.from({ length: b - a + 1 }, (_, i) => a + i) : [a]; });
const games = range(opt('games', '1..12')), days = range(opt('days', '1,4,7')), duels = Number(opt('duels', '12'));
const G = await load('/src/simulation/index.ts');
const LAB = await load('/src/tournament/lab.ts');
const AM = await load('/src/combat/autoMatch.ts');
const A = await load('/src/combat/auto.ts');
const NF = await load('/src/narrative/npcFighters.ts');
const who = opt('who', Object.keys(NF.NPC_FIGHTERS).join(',')).split(',');
const stats = {};
for (const seed of games) {
  // the planner's game, its morning of each day kept
  let st = G.makeV2(G.newGame(seed, 'Ren'));
  const mornings = {};
  while (!st.over && st.day <= Math.max(...days)) {
    if (st.slot === 'morning' && days.includes(st.day) && !mornings[st.day]) mornings[st.day] = structuredClone(st);
    const a = LAB.POLICIES.planner.choose(st);
    const r = G.advance(st, a); if (!r.ok) { st = G.advance(st, { type: 'wait' }).state; continue; } st = r.state;
  }
  for (const d of days) {
    const m = mornings[d]; if (!m) continue;
    for (const id of who) {
      for (let k = 0; k < duels; k++) {
        const s = structuredClone(m); s.v2.challenge = { who: id, day: s.day + k * 0, kind: 'seize' };
        const b = AM.autoFightersFor(s, id, d <= 5 ? 0 : d <= 8 ? 1 : 2, 0), r = A.autoDuel(b.ren, b.foe, (seed * 7919 + k * 104729 + d) >>> 0);
        const key = `${id}|${d}`, o = (stats[key] ??= { n: 0, won: 0, secs: 0, hpLeft: 0 });
        o.n++; if (A.autoWinner(r) === 0) o.won++; o.secs += r.t ?? r.time ?? 0; o.hpLeft += r.hp[0] / r.maxHp[0];
      }
    }
  }
}
console.log('who'.padEnd(9), days.map((d) => `day ${d}: win %  length  Ren's health left`.padEnd(38)).join(''));
for (const id of who) console.log(id.padEnd(9), days.map((d) => { const o = stats[`${id}|${d}`]; return o ? `${(100 * o.won / o.n).toFixed(0).padStart(3)} %  ${(o.secs / o.n / 60).toFixed(1)} min  ${(100 * o.hpLeft / o.n).toFixed(0)} %`.padEnd(38) : ''.padEnd(38); }).join(''));
