import type { Rng } from '../core/rng';
import { clamp, slotNumber, type GameState, type WorldPulse } from '../simulation/state';
import type { Emit } from '../simulation/advance';
import { PLAYER_ID } from '../narrative/roster';
import { rankOf } from '../tournament/pool';
import { EVENTS } from './catalog';
import type { Cond, Effect, EventDef, Num } from './types';

/** The events' engine (journal Passe L2): at the end of each slot, every event of the catalogue whose slot, cooldown and causes hold is a
 *  candidate; its `chance` (if any) is drawn from its own stream; the first outcome whose condition holds applies its effects and logs
 *  the event with its cause. Pure. */

const num = (v: number, n: Num) => (n.gte === undefined || v >= n.gte) && (n.lte === undefined || v <= n.lte);

export function holds(c: Cond, s: GameState, pulse: WorldPulse): boolean {
  if ('all' in c) return c.all.every((x) => holds(x, s, pulse));
  if ('any' in c) return c.any.some((x) => holds(x, s, pulse));
  if ('not' in c) return !holds(c.not, s, pulse);
  if ('pulse' in c) return num(pulse[c.pulse], c);
  if ('day' in c) return num(s.day, c);
  if ('slot' in c) return c.slot.includes(s.slot);
  if ('flag' in c) return num(Number(s.flags[c.flag] ?? 0), c);
  if ('flagSet' in c) return s.flags[c.flagSet] !== undefined && s.flags[c.flagSet] !== false;
  if ('forge' in c) return c.forge.includes(s.services.forge);
  if ('watch' in c) return s.services.forgeWatch === c.watch;
  if ('rel' in c) { const [a, b] = c.rel, v = a === PLAYER_ID ? (s.competitors[b]?.relationships[PLAYER_ID] ?? 0) : (s.competitors[a]?.relationships[b] ?? 0); return num(v, c); }
  if ('town' in c) return num(s.town[c.town] ?? 0, c);
  if ('player' in c) return num(s.player[c.player], c);
  if ('item' in c) return s.player.items.includes(c.item);
  if ('quest' in c) return c.in.includes(s.quests[c.quest] ?? 'none');
  if ('fact' in c) return s.facts.includes(c.fact);
  if ('wins' in c) return num(s.tournament.matches.filter((m) => m.winner === PLAYER_ID).length, c);
  if ('rank' in c) return num(rankOf(s, PLAYER_ID), c);
  if ('rivalHurt' in c) return Object.values(s.competitors).some((x) => x.healthState !== 'fit');
  if ('rivalFact' in c) return !!s.competitors[c.rivalFact[0]]?.knownFacts.some((f) => f.startsWith(c.rivalFact[1]));
  if ('fired' in c) return s.flags[`ev:${c.fired}`] !== undefined;
  throw new Error(`unknown condition ${JSON.stringify(c)}`);
}

export function applyEffect(e: Effect, s: GameState): void {
  if ('pulse' in e) { const k = `pulse:${e.pulse}`; s.flags[k] = ((s.flags[k] as number) ?? 0) + e.add; }
  else if ('flag' in e) s.flags[e.flag] = e.add !== undefined ? ((s.flags[e.flag] as number) ?? 0) + e.add : e.set ?? true;
  else if ('fact' in e) { if (!s.facts.includes(e.fact)) s.facts.push(e.fact); }
  else if ('forge' in e) s.services.forge = e.forge;
  else if ('shop' in e) { s.services.shopFactor = e.shop; s.services.shopCause = e.cause; }
  else if ('coins' in e) s.player.coins = Math.max(0, s.player.coins + e.coins);
  else if ('reputation' in e) s.player.reputation = clamp(s.player.reputation + e.reputation);
  else if ('town' in e) s.town[e.town] = clamp((s.town[e.town] ?? 0) + e.add, -100, 100);
  else if ('rel' in e) { const [a, b] = e.rel, c = s.competitors[a]; if (c) c.relationships[b] = clamp((c.relationships[b] ?? 0) + e.add, -100, 100); }
  else if ('points' in e) s.tournament.points[e.points] = (s.tournament.points[e.points] ?? 0) + e.add;
  else if ('rivalRep' in e) { const c = s.competitors[e.rivalRep]; if (c) c.reputation = clamp(c.reputation + e.add); }
  else if ('quest' in e) s.quests[e.quest] = e.stage;
}

/** is this event a candidate now (slot, once / cooldown, causes)? */
export function eligible(ev: EventDef, s: GameState, pulse: WorldPulse): boolean {
  if (ev.slots && !ev.slots.includes(s.slot)) return false;
  const last = s.flags[`ev:${ev.id}`] as number | undefined;
  if (last !== undefined && (ev.once !== false || slotNumber(s) - last < (ev.cooldown ?? 1))) return false;
  return holds(ev.when, s, pulse);
}

export function runEvents(s: GameState, pulse: WorldPulse, emit: Emit, rng: Rng, catalog: readonly EventDef[] = EVENTS): string[] {
  const fired: string[] = [];
  for (const ev of catalog) {
    if (!eligible(ev, s, pulse)) continue;
    if (ev.chance !== undefined && rng.fork(`event:${ev.id}`).next() >= ev.chance) continue;
    const out = ev.outcomes.find((o) => !o.when || holds(o.when, s, pulse));
    if (!out) continue;
    for (const e of out.effects) applyEffect(e, s);
    s.flags[`ev:${ev.id}`] = slotNumber(s);
    emit({ kind: ev.major ? 'consequence' : ev.type === 'targeted' ? 'sign' : 'event', id: ev.id, cause: ev.cause, text: out.text, visible: true });
    fired.push(ev.id);
  }
  return fired;
}
