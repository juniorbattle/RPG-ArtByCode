import type { Rng } from '../core/rng';
import type { GameState } from './state';
import type { Emit } from './advance';

/** The end of a slot (journal Passe L1): what the world does while the player spends it. The competitors' off-screen activity, the pulse
 *  and the events join it with the tournament (Passe L2). */
export function endSlot(s: GameState, emit: Emit, _rng: Rng): void {
  // a night's watch at the forge lasts that night only
  if (s.slot === 'evening') s.services.forgeWatch = false;
  emit({ kind: 'slot', id: 'slot-end', cause: 'clock', text: `The ${s.slot} of day ${s.day} ends.`, visible: false });
}
