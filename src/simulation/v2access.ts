import { placeName, type GameState, type PlaceId } from './state';
import { isV2 } from './v2';
import { V2_EXITS } from './v2places';
import { sandShut, sandTaken } from './v2rivals';
import { paradeBlocks } from './v2festival';
import { tx } from '../narrative/text';

/** Where a version 2 game's player can go now, and what is shut there (the operator's trial of 2026-11-11, journal Passe AL1: « durant mes tests je ne suis pas
 *  parvenu a acceder au training ground lors du premier jour »). Every place is open at every moment of every day; one way is shut, the street between the
 *  festival square and the forecourt on the parade's evening (lot L6, FE-7), said on its tag in grey (MK-14). The Training Ground stays open at night, but its
 *  practice sand does not: closed at dusk (`train.closed`), shut the morning after the barracks' brawl, held by Rhosk the day he takes it (lot L4). What is shut
 *  there is said where the player chooses to go: on the way's tag and on the map's line, with its reason. Pure. */

/** why the way from here to `to` is shut now (null: open) */
export function wayShut(s: GameState, to: PlaceId): string | null {
  return paradeBlocks(s, to) ? tx('v2.fest.wayShut') : null;
}

/** what is shut at `to` now, in a few words for a tag or the map's line (null: nothing); read as if the player stood there */
export function placeNote(s: GameState, to: PlaceId): string | null {
  if (!isV2(s) || to !== 'training') return null;
  const there = { ...s, place: to } as GameState;
  if (s.slot === 'evening') return tx('v2.access.sandNight');
  if (sandTaken(there)) return tx('v2.access.sandRhosk');
  if (sandShut(there)) return tx('v2.access.sandBrawl');
  return null;
}

/** what a way's tag adds to « To … » (null: nothing): what is shut where it leads, or, on a way to the forecourt, the Training Ground that opens beyond it (the
 *  quay and the festival square have no way of their own to it: the operator looked for it there) */
export function wayNote(s: GameState, from: PlaceId, to: PlaceId): string | null {
  if (!isV2(s)) return null;
  const shut = placeNote(s, to);
  if (shut) return shut;
  if (from !== 'training' && V2_EXITS[to as keyof typeof V2_EXITS]?.some((e) => e.to === 'training')) return tx('v2.access.beyond', { place: placeName('training', true) });
  return null;
}
