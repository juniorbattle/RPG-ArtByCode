import type { GameState } from './state';
import type { Emit } from './advance';
import type { BoutNote } from '../combat/autoNotes';
import { isV2 } from './v2';
import { joined, tx } from '../narrative/text';

/** The panache (the operator's CL-3 « Renommée seule, comptée sur le script du duel », the sheet https://claude.ai/artifact/3j8cNwctXgmVRB5BHK39td, journal Passes CL1 / CV2;
 *  no patrons, no coins): what the crowd sees of a bout of the tournament, read from the duel's script as Master Corvin's notes are (src/combat/autoNotes.ts: `BoutNote.flair`),
 *  gives the player fame. An exploit of his that lands in an opening, a break or on an action being charged, an interruption he makes, a parry he makes: `FLAIR` fame points
 *  each (the exploit 1, the rarer interruption and parry 2), at most `cap` a bout (4), won or lost (the crowd cheers a style, not a result). The fame is the pulse's `playerFame` (src/tournament/pulse.ts: the reputation and what the
 *  events add, the same `pulse:playerFame` shift as the events' and the parade's), which the passers-by's greetings and the Lanterns' parade read (src/simulation/v2react.ts,
 *  v2festival.ts): renown alone, nothing else changes. The numbers are « proposés », measured in the laboratory (journal Passe CV2: `tools/auto-cards.mjs fame`). A bout's panache
 *  is said on its result page by the log line. Pure. */
export const FLAIR = { exploit: 1, cut: 2, parry: 2, cap: 4 };

export interface Flair { exploits: number; cuts: number; parries: number }

/** a note's panache, each count a whole number from 0 to 9 (the note comes with the result: nothing it says is trusted past that), or null for a note of before or none */
export function flairOf(note: { flair?: unknown } | undefined | null): Flair | null {
  const f = note?.flair as Partial<Flair> | undefined;
  if (!f || typeof f !== 'object') return null;
  const n = (v: unknown): number => (typeof v === 'number' && Number.isFinite(v) ? Math.max(0, Math.min(9, Math.floor(v))) : 0);
  return { exploits: n(f.exploits), cuts: n(f.cuts), parries: n(f.parries) };
}

/** the fame a panache gives */
export const flairPoints = (f: Flair): number => Math.min(FLAIR.cap, f.exploits * FLAIR.exploit + f.cuts * FLAIR.cut + f.parries * FLAIR.parry);

/** a bout of the tournament's panache given to the fame (the pulse's `playerFame` shift, as the events add), and said in the log: what the crowd saw and what it gave; nothing
 *  for a note without panache or an empty one, nothing in today's game */
export function applyFlair(s: GameState, note: BoutNote | undefined, cause: string, emit: Emit): void {
  if (!isV2(s)) return;
  const f = flairOf(note);
  if (!f) return;
  const n = flairPoints(f);
  if (n <= 0) return;
  s.flags['pulse:playerFame'] = ((s.flags['pulse:playerFame'] as number) ?? 0) + n;
  const parts = [f.exploits ? tx('v2.flair.exploit', { n: f.exploits }) : '', f.cuts ? tx('v2.flair.cut', { n: f.cuts }) : '', f.parries ? tx('v2.flair.parry', { n: f.parries }) : ''].filter(Boolean);
  emit({ kind: 'consequence', id: 'flair', cause: `match:${cause}`, visible: true, text: tx('v2.flair.earned', { parts: joined(parts, 'list.and'), n }) });
}
