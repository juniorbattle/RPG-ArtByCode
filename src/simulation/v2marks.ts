import type { GameState } from './state';
import { actions, advance } from './advance';
import { offeredBy } from './roles';
import { talkableHere } from './v2watch';
import { isV2 } from './v2';
import { phaseOf } from './v2town';

/** The people worth talking to in a version 2 game (the operator's request of 2026-11-11, journal Passe MK1: « il va falloir pourvoir mettre en avant de
 *  maniere subtile les pnjs avec lesquels l'interaction peut etre utile car ils ont un objet ou un evenement a proposer »). Read from the state alone, as the
 *  dialogue reads it: what each person present offers now (the actions they offer that the game accepts, src/simulation/roles.ts offeredBy) and what talking
 *  to them changes by itself (src/narrative/dialogue.ts onTalk: a witness, a quest). Three kinds:
 *  - `item`: something to get or to earn for coins (goods, the forge, a skill, care, a paid job, the resale);
 *  - `event`: something happening now, for a while (a challenge open this phase, a spar, the festival's good turns and corteges, the day's rumour);
 *  - `follow`: what follows from what happened (a witness who knows, a report, an answer to a rival, a restitution, the forge to mend).
 *  Each offer carries a key (what makes it the same offer again: an item, today's job, this phase's challenge), so a page can tell what is new since the
 *  player last opened that person's dialogue. Pure. */

export type MarkKind = 'item' | 'event' | 'follow';
export interface Mark {
  who: string;
  /** the strongest kind offered (a follow-up first, then an event, then an item) */
  kind: MarkKind;
  /** each offer's key and kind */
  offers: Array<{ key: string; kind: MarkKind }>;
}

const KIND_OF: Record<string, MarkKind> = {
  buy: 'item', shopBuy: 'item', sell: 'item', barter: 'item', bargain: 'item', upgradeWeapon: 'item', temper: 'item', buySkill: 'item', heal: 'item', lockGear: 'item', checkGear: 'item',
  work: 'item', restock: 'item', haul: 'item',
  challenge: 'event', spar: 'event', festDeed: 'event', walkBehind: 'event', walkOwn: 'event', keepWatch: 'event', payWatch: 'event', register: 'event', recruit: 'event', rumour: 'event', buyInfo: 'event', listen: 'event',
  report: 'follow', restitute: 'follow', confront: 'follow', taunt: 'follow', confrontVessa: 'follow', reportRhosk: 'follow', faceMuscle: 'follow', payMuscle: 'follow', askPapers: 'follow', repair: 'follow',
};
/** watching a rival train is open whenever they do (lot L3): it stays in the list, never a mark (every rival would wear one all day) */
const NEVER = new Set(['talk', 'scout']);
const RANK: Record<MarkKind, number> = { item: 0, event: 1, follow: 2 };

/** what makes an offer the same one again: a daily offer by its day, a challenge by its phase, the rest by what it names */
export function offerKey(st: GameState, a: { type: string } & Record<string, unknown>): string {
  const { type, ...rest } = a;
  if (['work', 'restock', 'rumour', 'buyInfo', 'payWatch', 'keepWatch', 'lockGear', 'listen'].includes(type)) return `${type}:${st.day}`;
  if (type === 'challenge') return `${type}:${String(a.who)}:${phaseOf(st.day)}`;
  return `${type}:${JSON.stringify(rest)}`;
}

/** the people present here and what each offers now (none: no entry); a version 2 game only */
export function marksOf(st: GameState): Mark[] {
  if (!isV2(st) || st.over) return [];
  const opts = actions(st), out: Mark[] = [];
  for (const p of talkableHere(st)) {
    const offers: Mark['offers'] = [];
    for (const o of opts) {
      if (!o.ok || NEVER.has(o.action.type) || offeredBy(o.action as never) !== p.id) continue;
      const kind = KIND_OF[o.action.type];
      if (kind) offers.push({ key: offerKey(st, o.action as never), kind });
    }
    // what talking itself changes (a witness, a quest): the conversation's own events, beyond meeting the person
    const r = advance(st, { type: 'talk', who: p.id });
    if (r.ok && r.events.some((e) => e.kind === 'consequence' || (e.cause === 'action:talk' && e.id !== 'meet'))) offers.push({ key: `talk:${p.id}`, kind: 'follow' });
    if (!offers.length) continue;
    const kind = offers.reduce<MarkKind>((k, o) => (RANK[o.kind] > RANK[k] ? o.kind : k), 'item');
    out.push({ who: p.id, kind, offers });
  }
  return out;
}

/** the offers not seen yet: `seen` holds the keys shown in the person's dialogue (a page keeps it); a mark left with none of them is null */
export function freshMark(m: Mark, seen: ReadonlySet<string>): Mark | null {
  const offers = m.offers.filter((o) => !seen.has(o.key));
  if (!offers.length) return null;
  return { who: m.who, offers, kind: offers.reduce<MarkKind>((k, o) => (RANK[o.kind] > RANK[k] ? o.kind : k), 'item') };
}
