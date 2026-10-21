import type { GameState } from './state';

/** What the scenes show of the state (journal Passe L3; choice G2): the morning is the `morning` day state, the afternoon `midday`, the
 *  evening the night; back from a bout, the evening opens on the end of day (`afternoon`) until the player lets the night fall. The look
 *  changes only between page loads (a save, then a reload): never while a scene runs. Pure. */

export type Look = 'morning' | 'midday' | 'afternoon' | 'night';

export function lookOf(s: GameState): Look {
  if (s.slot === 'morning') return 'morning';
  if (s.slot === 'afternoon') return 'midday';
  return dusk(s) ? 'afternoon' : 'night';
}

/** the evening right after the player's bout, before the night falls */
export function dusk(s: GameState): boolean { return s.slot === 'evening' && s.flags.dusk === s.day && !s.flags[`night:${s.day}`]; }

/** the town's query for the state (the district stays the frozen one: canonical seed, its framings, its cast; choice P4: only game layers
 *  change, the day state, the forge, the crowd's size, the weather) */
export function townQuery(s: GameState): Record<string, string> {
  const look = lookOf(s), q: Record<string, string> = { seed: '1842', clean: '1', intro: '0' };
  if (look !== 'night') q.time = look;
  if (s.services.forge === 'sabotaged') q.forge = 'sabotaged';
  // the crowd follows the tournament's excitement around the day state's own count (night 5; morning 6, midday 12, end of day 9)
  const base = look === 'night' ? 5 : look === 'morning' ? 6 : look === 'midday' ? 12 : 9;
  q.crowd = String(Math.max(3, Math.min(12, base + Math.round((s.pulse.excitement - 60) / 12))));
  if (s.flags.weather === 'rain' && s.day === 3) q.rain = '0.6';
  return q;
}

/** the arena's query for the state, duel and forecourt (the operator's decision L7-2, « Oui, après la revue du jour (J9), par DayState »,
 *  journal Passe AD1): the canonical seed and the slot's day state, as the town's (the duel's afternoon is midday; the forecourt shows the
 *  morning, midday, the end of day after a bout, or the night) */
export function arenaQuery(s: GameState): Record<string, string> {
  const look = lookOf(s), q: Record<string, string> = { seed: '1842' };
  if (look !== 'night') q.time = look;
  return q;
}
