/** The list Q without a page (the operator's IA-04 « Grouper et ouvrir sur la première ligne utile (le vol rangé, « Wait » jamais en premier) », journal Passe IA2;
 *  A-06, B-01, B-25, C-08 and C-17 of journal Passe IA1: the list opened on « Wait » (Q then Enter passed the morning), the people stood after nine to eleven lines of
 *  theft (Mara at ten presses of ↓, Corvin and Orla at twenty-five) and the answers to an encounter were mixed with the theft, without a name). A version 2 game's
 *  lines go by their group, in this order: the bout and a challenge first (the page), the answer an encounter waits for, what the place is for (the sand's training and
 *  drills), the people, then the time to pass (rest, wait, nightfall) and last the theft and the force, in one group each under its own title. The list opens on
 *  the first line of the first groups, never on the time or the theft. Pure: the page draws it. */

export type HereGroup = 'card' | 'answer' | 'do' | 'time' | 'steal';

/** the sabotage's three steps (src/simulation/v2sabotage.ts) */
export const isSabotage = (type: string): boolean => type === 'caseLockers' || type === 'buyTool' || type === 'cutStrap';

/** the groups in the order the list shows them (the people stand between `do` and `time`) */
export const HERE_GROUPS: readonly HereGroup[] = ['card', 'answer', 'do', 'time', 'steal'];

/** the group of a line of the place's list, by its action's type */
export function hereGroup(type: string): HereGroup {
  // the sabotage's three steps (the operator's SB-1, src/simulation/v2sabotage.ts) go with the theft and the force: the foul play, never the list's first line
  if (type === 'steal' || type === 'pickpocket' || type === 'seize' || isSabotage(type)) return 'steal';
  if (type === 'rest' || type === 'wait' || type === 'nightfall') return 'time';
  if (type === 'answer') return 'answer';
  // the winner's card (the operator's CL-2, journal Passe CV1) waits first: it changes the next bout
  if (type === 'takeCard') return 'card';
  return 'do';
}

/** the lines of the list, grouped, each group in the order the game gave them */
export function groupHere<T extends { action: { type: string } }>(opts: readonly T[]): Record<HereGroup, T[]> {
  const out: Record<HereGroup, T[]> = { card: [], answer: [], do: [], time: [], steal: [] };
  for (const o of opts) out[hereGroup(o.action.type)].push(o);
  return out;
}

/** the groups the list opens on: never the time to pass nor the theft */
export const opensOn = (g: HereGroup): boolean => g === 'card' || g === 'answer' || g === 'do';
