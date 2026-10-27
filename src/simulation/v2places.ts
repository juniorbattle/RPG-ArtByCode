import type { GameState, PlaceId } from './state';
import type { Look } from './look';
import { PEOPLE, presentAt } from '../narrative/people';

/** The version 2's places as pages (lot V5, journal Passe V5): which square of src/world/Plazas.ts a place opens, who stands on it at this
 *  hour (the people the simulation says are there, and the extras of the place: the forecourt's guards at the gate) and the crowd walking it.
 *  The hooded figure the festival square showed at night is gone (journal Passe VP1): the stranger of the simulation is on the quay, and a
 *  hooded extra one could not talk to read as him. Pure. */

export type PlazaKind = 'forecourt' | 'training' | 'festival';
export const PLAZA_OF: Partial<Record<PlaceId, PlazaKind>> = { forecourt: 'forecourt', training: 'training', lanterns: 'festival' };
/** the crowd of a square by the look (« proposé »: a square is smaller than the quay; more people by day, as J7) */
// (journal Passe VP7: a few in the morning, the crowd at midday, fewer at the end of the day, a handful at night; « proposé »)
export const PLAZA_CROWD: Record<Look, number> = { night: 4, morning: 5, midday: 12, afternoon: 8 };

export function plazaPeople(s: GameState): string[] {
  const out = Object.values(PEOPLE).filter((p) => presentAt(p, s.place, s.slot, true)).map((p) => p.id);
  if (s.place === 'forecourt') out.push('guardA', 'guardB');
  return out;
}

/** a side of a place where a way out opens */
export type ExitSide = 'west' | 'east' | 'south';
/** The version 2's walk between places (journal Passe VP5, the operator's request: « je veux que les villes soient connecté [...] via des
 *  entrés/sorties comme dans un final fantasy 9 »): each place's ways out, where they lead and the side they open on. West to east the
 *  Festival Square, the Arena Forecourt and the Training Ground; the Merchant Quay below the first two (its west end under the festival, its
 *  east end, past the guards' barrier, under the forecourt). Every way is walked both ways (« proposé »). */
export const V2_EXITS: Readonly<Record<'district' | 'forecourt' | 'training' | 'lanterns', ReadonlyArray<{ to: PlaceId; side: ExitSide }>>> = {
  district: [{ to: 'lanterns', side: 'west' }, { to: 'forecourt', side: 'east' }],
  forecourt: [{ to: 'lanterns', side: 'west' }, { to: 'training', side: 'east' }, { to: 'district', side: 'south' }],
  training: [{ to: 'forecourt', side: 'west' }],
  lanterns: [{ to: 'forecourt', side: 'east' }, { to: 'district', side: 'south' }],
};
/** the side of `place` one enters by, coming from `from` (null: no way between them) */
export function arrivalSide(place: PlaceId, from: string | null): ExitSide | null {
  return (V2_EXITS as Record<string, ReadonlyArray<{ to: PlaceId; side: ExitSide }>>)[place]?.find((e) => e.to === from)?.side ?? null;
}
