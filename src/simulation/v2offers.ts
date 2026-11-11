import type { GameState } from './state';
import { offeredBy } from './roles';
import { phaseOf } from './v2town';

/** What a person offers, and what the player has seen of it (the operator's MK1 sheet, journal Passe MK2: MK-3 « Trois sortes, trois formes du losange »,
 *  MK-4 « Ce qui est neuf depuis la dernière conversation avec la personne », MK-5 « Elle part à l’ouverture du dialogue, revient avec une nouveauté », MK-6 « Ni
 *  l’observation des rivaux ni la foule »). One table ranks every offer once; `offerKey` says what makes an offer the same one again; `seeOffers` keeps, as the
 *  dialogue opens, the keys of what the person offers then, in the version 2's state under a « $ » key: saved with the game, outside its fingerprint. Pure;
 *  no import of the action table (the talk action calls it with its own list). */

export type MarkKind = 'item' | 'event' | 'follow';

/** item: something to get or to earn for coins; event: something happening now, for a while; follow: what follows from what happened */
export const KIND_OF: Readonly<Record<string, MarkKind>> = {
  buy: 'item', shopBuy: 'item', sell: 'item', barter: 'item', bargain: 'item', upgradeWeapon: 'item', temper: 'item', buySkill: 'item', heal: 'item', lockGear: 'item', checkGear: 'item',
  work: 'item', restock: 'item', haul: 'item',
  challenge: 'event', spar: 'event', festDeed: 'event', walkBehind: 'event', walkOwn: 'event', keepWatch: 'event', payWatch: 'event', register: 'event', recruit: 'event', rumour: 'event', buyInfo: 'event', listen: 'event',
  report: 'follow', restitute: 'follow', confront: 'follow', taunt: 'follow', confrontVessa: 'follow', reportRhosk: 'follow', faceMuscle: 'follow', payMuscle: 'follow', askPapers: 'follow', repair: 'follow',
};
/** MK-6: watching a rival train (open whenever they do) never marks; the passers-by of the crowd (`folk`) never wear a mark */
export const NEVER_MARKED = new Set(['talk', 'scout']);
export const UNMARKED_PEOPLE = new Set(['folk']);
/** the offers that change every day */
const DAILY = new Set(['work', 'restock', 'rumour', 'buyInfo', 'payWatch', 'keepWatch', 'lockGear', 'listen']);

/** what makes an offer the same one again: a daily offer by its day, a challenge by its phase, the rest by what it names */
export function offerKey(st: Pick<GameState, 'day'>, a: { type: string } & Record<string, unknown>): string {
  const { type, ...rest } = a;
  if (DAILY.has(type)) return `${type}:${st.day}`;
  if (type === 'challenge') return `${type}:${String(a.who)}:${phaseOf(st.day)}`;
  return `${type}:${JSON.stringify(rest)}`;
}

/** the key of what talking to the person changes by itself (a witness, a quest): consumed by the talk */
export const talkKey = (who: string): string => `talk:${who}`;

/** what the player has seen of the person's offers (the keys kept by `seeOffers`) */
export function seenOf(st: GameState, who: string): ReadonlySet<string> {
  return new Set(st.v2?.$seen?.[who] ?? []);
}

/** the dialogue opens: keeps the keys of every offer the person makes now (`list`: the actions listed now, refused ones included, as the dialogue shows them) */
export function seeOffers(s: GameState, who: string, list: ReadonlyArray<{ type: string } & Record<string, unknown>>): void {
  if (!s.v2) return;
  const seen = new Set(s.v2.$seen?.[who] ?? []);
  seen.add(talkKey(who));
  for (const a of list) if (!NEVER_MARKED.has(a.type) && KIND_OF[a.type] && offeredBy(a as never) === who) seen.add(offerKey(s, a));
  (s.v2.$seen ??= {})[who] = [...seen].sort();
}
