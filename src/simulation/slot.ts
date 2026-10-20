import type { Rng } from '../core/rng';
import type { GameState } from './state';
import type { Emit } from './advance';
import { playOffscreenMatches } from '../tournament/pool';
import { rivalsAct } from '../tournament/offscreen';
import { computePulse } from '../tournament/pulse';
import { runEvents } from '../events/engine';

/** The end of a slot (journal Passes L1 / L2): what the world does while the player spends it, in this order: the pool's other bouts (on a
 *  match afternoon), the rivals' off-screen activity, the events (read against the pulse of the slot ending), then the pulse published for
 *  the next slot. A night's watch at the forge lasts that night only. */
export function endSlot(s: GameState, emit: Emit, rng: Rng): void {
  if (s.slot === 'afternoon') playOffscreenMatches(s, emit, rng.fork('matches'));
  rivalsAct(s, emit, rng.fork('rivals'));
  runEvents(s, computePulse(s), emit, rng.fork('events'));
  if (s.slot === 'evening') s.services.forgeWatch = false;
  emit({ kind: 'slot', id: 'slot-end', cause: 'clock', text: `The ${s.slot} of day ${s.day} ends.`, visible: false });
}
