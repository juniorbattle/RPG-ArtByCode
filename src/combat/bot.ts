import { Rng } from '../core/rng';
import { CombatSim, type ActionId, type CombatData } from '../arena/CombatSim';
import { DynamicSim, impactTime, type DynActionId, type DynData } from './dynamic';

/** A scripted player for the arena's simulation (journal Passe L2): it drives the player's slot (`ren`) of a full CombatSim, so a duel can be
 *  played to its end headless (the scripted games, the TournamentLab, the check of the off-screen resolution). `skill` (0..1) sets how
 *  often it dodges a heavy in its window, guards a light, and how fast it reacts; its own seeded stream decides each reaction once per
 *  enemy action, so a duel replays exactly from (data, skill, seed). A negative skill is a player who does not play: no attack, no guard, no
 *  dodge (the scripted losing game, journal Passe L5). Pure: no DOM, no clock. */

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
    if (s < 0) { sim.step(dt); for (const e of sim.drain()) if (e.type === 'impact' && e.hp <= 0) finisher = e.kind; continue; }
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

// ------------------------------------------------------------------------------------------- the « tour par tour dynamique » (lot C1)

/** The same scripted player for the rules of the « tour par tour dynamique » (src/combat/dynamic.ts, journal Passe C1). In the opponent's
 *  sequences it defends: per sequence, it holds the guard through it (gaps included) or not, decided once; per heavy blow, it dodges in the
 *  window or not, decided once (an action point needed). In the pauses it attacks: the ward when its own gauge fills, the boost when it has
 *  none, the offensive skills when its points allow (keeping one for a dodge at skill >= 0.5), a heavy when its points are full or the
 *  opponent is broken, a light otherwise; a careful bot (each choice, with probability `skill`) keeps a slow action for when the opponent's
 *  shortest pause leaves the time to land it, so a sequence does not push it back (CB-3). `skill` also sets its reaction time, as above. A
 *  negative skill does not play. A duel ends at the K.O. only [G4]: `maxSecs` (30 min by default) is a safety, a duel still on returns no
 *  winner. Pure: no DOM, no clock. */
export function runDynamicBotDuel(data: DynData, o: BotOptions): DuelResult {
  const sim = new DynamicSim(data), rng = new Rng(o.seed >>> 0 || 1), dt = data.dt, s = o.skill;
  let decided: unknown = null, seqSeen = false, guardSeq = false, dodge = false, react = 0, nextAct = 0.4 + rng.next() * 0.3, finisher: string | null = null;
  const maxT = o.maxSecs ?? 1800;
  while (!sim.over && sim.t < maxT) {
    if (s < 0) { sim.step(dt); for (const e of sim.drain()) if (e.type === 'impact' && e.hp <= 0) finisher = e.kind; continue; }
    const inc = sim.incoming(), m = sim.f.marek, r = sim.f.ren;
    // one decision per sequence (the guard held through it) and one per blow (a dodge, and the reaction delay)
    if (sim.inSequence() && !seqSeen) { seqSeen = true; guardSeq = rng.next() < 0.2 + 0.6 * s; }
    if (!sim.inSequence()) seqSeen = false;
    if (inc && m.act !== decided) {
      decided = m.act;
      dodge = inc.kind === 'heavy' && rng.next() < 0.25 + 0.65 * s;
      react = 0.32 - 0.22 * s + rng.next() * 0.08;
    }
    if (!inc) decided = null;
    if (inc && dodge && inc.windowOpen && inc.t >= inc.windowOpensAt + react * 0.5) sim.react('ren', 'dodge');
    sim.setGuard('ren', sim.inSequence() && guardSeq && !(inc && inc.t < react && m.seqIdx === 1));
    if (!sim.inSequence() && sim.t >= nextAct && r.state === 'idle') {
      sim.command('ren', pickDynamic(sim, s, rng));
      nextAct = sim.t + 0.25 + (1 - s) * 0.45 + rng.next() * 0.25;
    }
    sim.step(dt);
    for (const e of sim.drain()) if (e.type === 'impact' && e.hp <= 0) finisher = e.kind;
  }
  const r = sim.f.ren, k = sim.f.marek;
  const winner = r.state === 'down' ? 'opponent' : k.state === 'down' ? 'player' : null;
  return { winner, playerHp: r.hp, opponentHp: k.hp, playerMaxHp: r.maxHp, opponentMaxHp: k.maxHp, t: +sim.t.toFixed(3), finisher, hash: sim.hash() };
}

/** the bot's choice in a pause (see runDynamicBotDuel) */
function pickDynamic(sim: DynamicSim, s: number, rng: Rng): DynActionId {
  const D = sim.D, r = sim.f.ren, m = sim.f.marek, rest = sim.restRange();
  // the time the opponent leaves at least before its next sequence: its stun and wait, its recovery and shortest pause, what is left of it
  const margin = m.state === 'stunned' ? m.stunLeft + D.ai.afterStun : m.state === 'recovering' ? m.recoverLeft + rest[0] : m.resting ? rest[0] - m.stateT : 0;
  const careful = rng.next() < s, fits = (id: DynActionId) => !careful || impactTime(D.actions[id]) < margin;
  const ok = (id: DynActionId) => sim.canUse('ren', id) && fits(id), keep = s >= 0.5 ? D.reactions.dodge.apCost : 0;
  const skills = D.loadout.map((id) => D.actions[id]);
  for (const a of skills) if (a.ward && !r.ward && r.resist >= 0.5 * D.resist.max && ok(a.id)) return a.id;
  for (const a of skills) if (a.boost && !r.boost && r.ap - (a.apCost || 0) >= keep && ok(a.id)) return a.id;
  const off = skills.filter((a) => a.family === 'offensive').sort((a, b) => b.damage - a.damage);
  for (const a of off) if (r.ap - (a.apCost || 0) >= keep && ok(a.id)) return a.id;
  if ((r.ap >= D.ap.max || m.broken) && ok('heavy')) return 'heavy';
  return 'light';
}
