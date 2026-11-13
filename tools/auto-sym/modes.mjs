// What each way of deciding Ren's skills yields: whole games of the reference player (held-out seeds), Ren's decider replaced; the game's model or the
// symmetric one with its fitted race.   node tools/auto-sym/modes.mjs --model=game|sym [--c=0.75] [--race=tools/auto-sym/races/<f>.json] [--seeds=101..300] [--look=101..160] [--only=a,b]
import fs from 'node:fs';
import * as L from './lab.mjs';
import { tactic, cueTactic, careless, lookahead } from './deciders.mjs';
const { range, pct, arg, med } = L;
const SYM = { ...L.GAME, streams: 'split', ap: 'pay', combo: 'weapon', table: 'ren', cadence: +arg('c', '0.75'), cooldown: 'db53', traits: 'none', ai: 'auto', heavy: 'base', renHeavy: 'base', heavyCd: arg('heavycd', '0') === '1' };
const model = arg('model', 'sym'), base = model === 'sym' ? SYM : { ...L.GAME, streams: arg('streams', 'split') };
if (arg('race')) L.setRace(JSON.parse(fs.readFileSync(arg('race'), 'utf8')));
const offensive = (a) => !a.ward && !a.boost && a.kind !== 'light' && a.base !== 'heavy';
const strongest = (x) => x.skills.filter(offensive).reduce((m, s) => ((s.power ?? 0) > (m?.power ?? -1) ? s : m), null);
/** the presets measured (each a tactic: one condition per skill of the order) */
export const MODES = {
  'automatique': { d: null },
  'tactique « aux signaux » (attend, sauf PA pleins)': { d: tactic(cueTactic, { alsoFull: true }) },
  'tactique « aux signaux » (attend toujours)': { d: tactic(cueTactic, { alsoFull: false }) },
  'tactique « aux signaux » (PA pleins : la moins chère)': { d: tactic(cueTactic, { alsoFull: 'cheap' }) },
  'tactique « la plus forte à la rupture »': { d: tactic((x) => x.skills.map((s) => (s.ward || s.boost ? 'auto' : s === strongest(x) ? 'broken' : 'ready'))) },
  'tactique « la plus forte pour finir »': { d: tactic((x) => x.skills.map((s) => (s.ward || s.boost ? 'auto' : s === strongest(x) ? 'finish' : 'ready'))) },
  'tactique « protections dès que prêtes »': { d: tactic((x) => x.skills.map((s) => (s.ward ? 'ready' : s.boost ? 'auto' : 'ready'))) },
  'tactique « soutiens jamais »': { d: tactic((x) => x.skills.map((s) => (s.boost ? 'never' : s.ward ? 'auto' : 'ready'))) },
  'main distraite (un appui au hasard sur quatre choix)': { d: careless(null, 0.25, 7) },
  'main au hasard (un appui sur deux)': { d: careless(null, 0.5, 11) },
};
const only = arg('only') ? arg('only').split(',') : null;
try {
  const seeds = range(arg('seeds', '101..300')), out = {};
  for (const [name, m] of Object.entries(MODES)) {
    if (only && !only.some((o) => name.includes(o))) continue;
    const auto = L.deciderOf({ brain: 'player' }, base);
    const d = m.d && name.startsWith('main') ? careless(auto, name.includes('deux') ? 0.5 : 0.25, name.includes('deux') ? 11 : 7) : m.d;
    L.setModel({ ...base, renDecider: d ?? undefined });
    const G = L.gamesOf('reference', seeds);
    console.log(`${name.padEnd(52)} ${L.gamesLine(G).slice(10)}`);
    out[name] = { titles: G.crowns / G.n, stageWins: G.stageWins };
  }
  // the one-step lookahead (expectation over six unknown futures): fewer games, the automatic on the same games beside it
  if (arg('look')) {
    const ls = range(arg('look'));
    L.setModel(base); const Ga = L.gamesOf('reference', ls);
    console.log(`${'automatique (mêmes parties)'.padEnd(52)} ${L.gamesLine(Ga).slice(10)}`);
    for (const samples of (arg('samples', '6')).split(',').map(Number)) {
      L.setModel({ ...base, renMode: (X, Y, seed, dA, dB, o) => lookahead(X, Y, seed, dA, dB, { samples, log: o.log }) });
      const t0 = Date.now(), Gl = L.gamesOf('reference', ls);
      console.log(`${(`un coup d'avance (${samples ? `${samples} futurs` : 'le vrai futur'})`).padEnd(52)} ${L.gamesLine(Gl).slice(10)}  [${((Date.now() - t0) / 1000).toFixed(0)} s]`);
      out[`look${samples}`] = { titles: Gl.crowns / Gl.n, stageWins: Gl.stageWins, autoSame: Ga.crowns / Ga.n };
    }
  }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
} finally { L.setModel(null); await L.server.close(); }
