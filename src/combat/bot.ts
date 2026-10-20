import { Rng } from '../core/rng';
import { CombatSim, type ActionId, type CombatData } from '../arena/CombatSim';

/** A scripted player for the arena's simulation (journal Passe L2): it drives the player's slot (`ren`) of a full CombatSim, so a duel can be
 *  played to its end headless (the scripted games, the TournamentLab, the check of the off-screen resolution). `skill` (0..1) sets how
 *  often it dodges a heavy in its window, guards a light, and how fast it reacts; its own seeded stream decides each reaction once per
 *  enemy action, so a duel replays exactly from (data, skill, seed). Pure: no DOM, no clock. */

export interface DuelResult {
  winner: 'player' | 'opponent' | null;
  /** health left at the end (the loser's is 0 unless the clock ran out) */
  playerHp: number; opponentHp: number; playerMaxHp: number; opponentMaxHp: number;
  /** the simulation time at the end (s) */
  t: number;
  /** the kind of the blow that ended it ('heavy', 'light', 'tech'), when one did */
  finisher: string | null;
  hash: string;
}

export interface BotOptions { skill: number; seed: number; /** a duel still on after this many seconds ends on the health shares */ maxSecs?: number }

export function runBotDuel(data: CombatData, o: BotOptions): DuelResult {
  const sim = new CombatSim(data), rng = new Rng(o.seed >>> 0 || 1), dt = data.dt, s = o.skill;
  let decided: unknown = null, dodge = false, guard = false, react = 0, nextAct = 0.4 + rng.next() * 0.3, finisher: string | null = null;
  const maxT = o.maxSecs ?? 240;
  while (!sim.over && sim.t < maxT) {
    const inc = sim.incoming(), m = sim.f.marek;
    // one decision per enemy action: will it be read (dodged if heavy, guarded if light), and after what reaction delay
    if (inc && m.act !== decided) {
      decided = m.act;
      dodge = inc.kind === 'heavy' && rng.next() < 0.25 + 0.65 * s;
      guard = inc.kind !== 'heavy' && rng.next() < 0.2 + 0.6 * s;
      react = 0.32 - 0.22 * s + rng.next() * 0.08;
    }
    if (!inc) decided = null;
    if (inc && dodge && inc.windowOpen && inc.t >= inc.windowOpensAt + react * 0.5) sim.react('ren', 'dodge');
    sim.setGuard('ren', !!(inc && guard && !dodge && inc.t >= react));
    if (!inc && sim.t >= nextAct && sim.f.ren.state === 'idle') {
      sim.command('ren', pick(sim));
      nextAct = sim.t + 0.25 + (1 - s) * 0.45 + rng.next() * 0.25;
    }
    sim.step(dt);
    for (const e of sim.drain()) if (e.type === 'impact' && e.hp <= 0) finisher = e.kind;
  }
  const r = sim.f.ren, k = sim.f.marek;
  const winner = r.state === 'down' ? 'opponent' : k.state === 'down' ? 'player' : r.hp / r.maxHp >= k.hp / k.maxHp ? 'player' : 'opponent';
  return { winner, playerHp: r.hp, opponentHp: k.hp, playerMaxHp: r.maxHp, opponentMaxHp: k.maxHp, t: +sim.t.toFixed(3), finisher, hash: sim.hash() };
}

/** the strongest technique the bot can afford, else a light attack (a heavy now and then when it has the time) */
function pick(sim: CombatSim): ActionId {
  for (const id of ['t4', 't3', 't1', 't2'] as ActionId[]) if (sim.canUse('ren', id)) return id;
  return sim.f.marek.resting && sim.f.ren.ap >= 1 ? 'heavy' : 'light';
}
