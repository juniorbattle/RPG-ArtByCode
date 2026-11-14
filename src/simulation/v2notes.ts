import type { GameState } from './state';
import type { BoutNote, NoteKind } from '../combat/autoNotes';

/** Master Corvin's notebook kept with the game (lot 3 of « La Brute », the operator's PB-4 « Toutes », briefs/combat-auto.md § 33.5): a note after each bout and
 *  challenge, read from the duel that was played (src/combat/autoNotes.ts), handed in with its result and kept outside the fingerprint (`V2State.$notes`). A module of
 *  its own, light, so that the tournament's results can keep a note without the rest of the preparation (src/simulation/v2prep.ts). Pure. */

/** the notes the notebook keeps, the newest */
export const NOTES_KEPT = 24;

/** a note kept: the notebook's newest last, its length bounded */
export function keepNote(s: GameState, note: BoutNote): void {
  if (!s.v2) return;
  const notes = (s.v2.$notes ??= []);
  notes.push(note);
  if (notes.length > NOTES_KEPT) notes.splice(0, notes.length - NOTES_KEPT);
}
/** a bout's or a challenge's result handed in with its note (src/combat/autoMatch.ts autoOutcome, the arena's own duel): the note kept, dated today */
export function keepOutcomeNote(s: GameState, o: { note?: BoutNote }, kind: NoteKind): void {
  if (o.note && typeof o.note === 'object' && Array.isArray(o.note.dmg)) keepNote(s, { ...o.note, day: s.day, kind });
}
/** the notes of the bouts and challenges against a fighter, newest first */
export const notesOf = (s: GameState, foe: string): BoutNote[] => (s.v2?.$notes ?? []).filter((n) => n.foe === foe).slice().reverse();
