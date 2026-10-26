import type { GameState, PlaceId } from './state';
import type { Look } from './look';
import { PEOPLE, presentAt } from '../narrative/people';

/** The version 2's places as pages (lot V5, journal Passe V5): which square of src/world/Plazas.ts a place opens, who stands on it at this
 *  hour (the people the simulation says are there, and the extras of the place: the forecourt's guards at the gate, the hooded stranger on
 *  the festival square at night) and the crowd walking it. Pure. */

export type PlazaKind = 'forecourt' | 'training' | 'festival';
export const PLAZA_OF: Partial<Record<PlaceId, PlazaKind>> = { forecourt: 'forecourt', training: 'training', lanterns: 'festival' };
/** the crowd of a square by the look (« proposé »: a square is smaller than the quay; more people by day, as J7) */
export const PLAZA_CROWD: Record<Look, number> = { night: 4, morning: 6, midday: 9, afternoon: 7 };

export function plazaPeople(s: GameState): string[] {
  const out = Object.values(PEOPLE).filter((p) => presentAt(p, s.place, s.slot, true)).map((p) => p.id);
  if (s.place === 'forecourt') out.push('guardA', 'guardB');
  if (s.place === 'lanterns' && s.slot === 'evening') out.push('hooded');
  return out;
}
