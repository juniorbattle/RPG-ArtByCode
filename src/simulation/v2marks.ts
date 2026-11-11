import type { GameState } from './state';
import { actions, advance } from './advance';
import { offeredBy } from './roles';
import { talkableHere } from './v2watch';
import { isV2 } from './v2';
import { KIND_OF, NEVER_MARKED, UNMARKED_PEOPLE, offerKey, seenOf, talkKey, type MarkKind } from './v2offers';

export type { MarkKind } from './v2offers';

/** The people worth talking to in a version 2 game (the operator's request of 2026-11-11, journal Passes MK1 / MK2: « il va falloir pourvoir mettre en avant de
 *  maniere subtile les pnjs avec lesquels l'interaction peut etre utile car ils ont un objet ou un evenement a proposer »). Read from the state alone, as the
 *  dialogue reads it: what each person present offers now (the actions they offer that the game accepts, src/simulation/roles.ts offeredBy) and what talking
 *  to them changes by itself (src/narrative/dialogue.ts onTalk: a witness, a quest); then only what the player has not seen yet in their dialogue (MK-4, MK-5:
 *  src/simulation/v2offers.ts). The kinds and the keys: src/simulation/v2offers.ts. Pure. */

export interface Mark {
  who: string;
  /** the strongest kind offered (a follow-up first, then an event, then an item) */
  kind: MarkKind;
  /** each offer's key and kind */
  offers: Array<{ key: string; kind: MarkKind }>;
}

const RANK: Record<MarkKind, number> = { item: 0, event: 1, follow: 2 };
const strongest = (offers: Mark['offers']): MarkKind => offers.reduce<MarkKind>((k, o) => (RANK[o.kind] > RANK[k] ? o.kind : k), 'item');

/** the people present here and everything each offers now, seen or not (none: no entry); a version 2 game only */
export function offersHere(st: GameState): Mark[] {
  if (!isV2(st) || st.over) return [];
  const opts = actions(st), out: Mark[] = [];
  for (const p of talkableHere(st)) {
    if (UNMARKED_PEOPLE.has(p.id)) continue;
    const offers: Mark['offers'] = [];
    for (const o of opts) {
      if (!o.ok || NEVER_MARKED.has(o.action.type) || offeredBy(o.action as never) !== p.id) continue;
      const kind = KIND_OF[o.action.type];
      if (kind) offers.push({ key: offerKey(st, o.action as never), kind });
    }
    // what talking itself changes (a witness, a quest): the conversation's own events, beyond meeting the person
    const r = advance(st, { type: 'talk', who: p.id });
    if (r.ok && r.events.some((e) => e.kind === 'consequence' || (e.cause === 'action:talk' && e.id !== 'meet'))) offers.push({ key: talkKey(p.id), kind: 'follow' });
    if (offers.length) out.push({ who: p.id, kind: strongest(offers), offers });
  }
  return out;
}

/** the offers not seen yet: a mark left with none of them is null */
export function freshMark(m: Mark, seen: ReadonlySet<string>): Mark | null {
  const offers = m.offers.filter((o) => !seen.has(o.key));
  return offers.length ? { who: m.who, offers, kind: strongest(offers) } : null;
}

const memo = new WeakMap<GameState, Map<string, MarkKind>>();
/** who wears a mark here now and of which kind (MK-4: what is new since the player last opened their dialogue); one computation a state */
export function peopleMarks(st: GameState): Map<string, MarkKind> {
  let m = memo.get(st);
  if (!m) {
    m = new Map();
    for (const o of offersHere(st)) { const f = freshMark(o, seenOf(st, o.who)); if (f) m.set(f.who, f.kind); }
    memo.set(st, m);
  }
  return m;
}
