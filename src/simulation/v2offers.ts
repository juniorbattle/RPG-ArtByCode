import type { GameState } from './state';
import { offeredBy } from './roles';
import { phaseOf } from './v2town';
import { nextBoutOf, scoutTier } from './v2scout';

/** What a person offers, and what the player has seen of it (the operator's MK1 sheet, journal Passe MK2: MK-3 « Trois sortes, trois formes du losange »,
 *  MK-4 « Ce qui est neuf depuis la dernière conversation avec la personne », MK-5 « Elle part à l’ouverture du dialogue, revient avec une nouveauté », MK-6 « Ni
 *  l’observation des rivaux ni la foule »). One table ranks every offer once; `offerKey` says what makes an offer the same one again; `seeOffers` keeps, as the
 *  dialogue opens, the keys of what the person offers then, in the version 2's state under a « $ » key: saved with the game, outside its fingerprint. Pure;
 *  no import of the action table (the talk action calls it with its own list). */

export type MarkKind = 'item' | 'event' | 'follow';

/** item: something to get or to earn for coins; event: something happening now, for a while; follow: what follows from what happened */
export const KIND_OF: Readonly<Record<string, MarkKind>> = {
  buy: 'item', shopBuy: 'item', sell: 'item', barter: 'item', bargain: 'item', upgradeWeapon: 'item', temper: 'follow', buySkill: 'item', heal: 'item', lockGear: 'item', checkGear: 'item',
  work: 'item', restock: 'item',
  // the town's quests (GP-09): each step follows from the quest taken
  haul: 'follow', buyHerbs: 'follow', brewDraught: 'follow', buyTreatise: 'follow', studyTreatise: 'follow', askWatch: 'follow',
  challenge: 'event', spar: 'event', festDeed: 'event', walkBehind: 'event', walkOwn: 'event', keepWatch: 'event', payWatch: 'event', register: 'event', recruit: 'event', rumour: 'event', buyInfo: 'event', listen: 'event',
  report: 'follow', restitute: 'follow', workDebt: 'follow', confront: 'follow', taunt: 'follow', confrontVessa: 'follow', reportRhosk: 'follow', faceMuscle: 'follow', payMuscle: 'follow', askPapers: 'follow', repair: 'follow',
  // Master Corvin's rehearsal, newly open against the next opponent (the operator's GP-16 « Les corriger », journal Passe GP2, amending MK-6 « Ni l’observation des
  // rivaux ni la foule » for the preparation that follows a watch): an event, as his spar is; only while it is still to do (src/simulation/v2marks.ts, v2prep.ts rehearsalDue)
  rehearse: 'event',
};
/** MK-6: watching a rival train (open whenever they do) never marks: the rival themselves wears no diamond, GP-16 kept it so (the next opponent's watch has a line of
 *  the list's summary instead, src/simulation/v2todo.ts); the passers-by of the crowd (`folk`) never wear a mark */
export const NEVER_MARKED = new Set(['talk', 'scout']);
export const UNMARKED_PEOPLE = new Set(['folk']);
/** the daily guards against a sabotage wear a mark only once a sign of its chain was seen (the operator's GP-11 « Corriger la lecture et ajouter le chapitre », journal
 *  Passe GP2: « le losange des parades seulement après un signe »): the quay's paid watch at the forge after the hood's oil, the loiterer or a friend's warning, while the forge
 *  stands; Clerk Odo's strongroom after the servant at Hilde's, the lockers found open or a friend's warning, while the gear's chain has not struck. Before it they wore one
 *  every evening or every eve, threat or not, and a real threat's mark drowned among them. The actions stay open all the same */
export const FORGE_SIGNS: readonly string[] = ['lamp-oil', 'loiterer', 'friend-warned-forge'];
export const GEAR_SIGNS: readonly string[] = ['armour-asked', 'locker-open', 'friend-warned-gear'];
export function markWorthy(st: Pick<GameState, 'facts' | 'flags'> & Partial<Pick<GameState, 'services'>>, type: string): boolean {
  if (type === 'payWatch' || type === 'keepWatch') return FORGE_SIGNS.some((f) => st.facts.includes(f)) && st.services?.forge !== 'sabotaged' && !st.facts.includes('saboteur-caught');
  if (type === 'lockGear') return GEAR_SIGNS.some((f) => st.facts.includes(f)) && !st.flags['tamper-done'];
  return true;
}

/** the offers that change every day */
const DAILY = new Set(['work', 'restock', 'rumour', 'buyInfo', 'payWatch', 'keepWatch', 'lockGear', 'listen']);

/** what makes an offer the same one again: a daily offer by its day, a challenge by its phase, an offer that comes back by what brings it back (a wound's day of
 *  care, the day a strap is cut, the thefts and marks a restitution settles, the reprisal waiting), the rest by what it names */
export function offerKey(st: Pick<GameState, 'day'> & Partial<Pick<GameState, 'flags' | 'v2' | 'player'>>, a: { type: string } & Record<string, unknown>): string {
  const { type, ...rest } = a;
  if (DAILY.has(type)) return `${type}:${st.day}`;
  if (type === 'heal') return `heal:${st.player?.injury ?? 0}:${st.day}`;
  if (type === 'checkGear') return `checkGear:${st.flags?.[`tampered:${st.day}`] ? st.day : 0}`;
  if (type === 'restitute') return `restitute:${st.v2?.thefts?.length ?? 0}:${st.v2?.marks ?? 0}`;
  if (type === 'workDebt') return `workDebt:${st.v2?.debt ?? 0}`;
  if (type === 'faceMuscle' || type === 'payMuscle') return `${type}:${st.v2?.reprisal?.by ?? ''}:${st.v2?.reprisal?.until ?? 0}`;
  if (type === 'challenge') return `${type}:${String(a.who)}:${phaseOf(st.day)}`;
  // the rehearsal by the bout it prepares and what is known of that opponent: new with the next opponent, and again once their plan is seen (GP-16)
  if (type === 'rehearse') { const n = 'tournament' in st ? nextBoutOf(st as GameState) : null; return `rehearse:${n?.foe ?? ''}:${n ? scoutTier(st as GameState, n.foe) : 0}`; }
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
