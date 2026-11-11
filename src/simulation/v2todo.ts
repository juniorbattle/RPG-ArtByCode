import type { GameState } from './state';
import { actions } from './advance';
import { offeredBy } from './roles';
import { isV2 } from './v2';
import { offersHere, freshMark } from './v2marks';
import { offerKey, seenOf, type MarkKind } from './v2offers';
import { hashString } from '../core/rng';

/** What there is to do here and now in a version 2 game (the operator's request of 2026-11-11, journal Passe LA1: « je pense que nous pourrions mettre plus en
 *  evidence cette zone a l'ecran durant nos parcours afin d'inciter le joueur a voir ce qui a a faire durant la periode »; his LA1 sheet, journal Passe LA2:
 *  LA-5 « Le combat, les personnes qui ont du neuf et les activités du lieu (jamais un vol, le repos, l’attente) », LA-6 « Le combat, une suite, un événement,
 *  ce qui rapporte, un objet, le lieu », LA-7 « L’aperçu part une fois la liste ouverte (ou après 8 s) ; le nombre reste ; tout revient avec une nouveauté »).
 *  Read from the state alone, as the list (Q, src/ui/townUi.ts openHere) and the marks (src/simulation/v2marks.ts) read it: the day's bout or a challenge
 *  waiting on the sand; each person here with something new for the player (the diamonds, MK-4); the place's own activities that spend the moment (the practice
 *  sand, the drills, the forge to mend). Never a theft, the rest, the wait or watching a rival (MK-6), nor the crowd. What the player has seen of them in the
 *  list is kept in the version 2's state under a « $ » key: saved with the game, outside its fingerprint. Pure. */

export type TodoKind = 'bout' | MarkKind | 'place';

export interface Todo {
  /** what makes it the same thing again (a person by their new offers, an activity by its place, day and moment) */
  key: string;
  kind: TodoKind;
  /** the person (a mark) */
  who?: string;
  /** the place's activity: train, drill, repair; the bout: fight or challenge */
  what?: string;
  /** coins it pays (a job among the person's new offers) */
  gain?: number;
  /** it spends the moment (the slot) */
  slot?: boolean;
}

/** LA-6: the bout, then what follows, an event, what pays (an item that pays), an item, the place's activities */
const rank = (t: Todo): number => (t.kind === 'bout' ? 0 : t.kind === 'follow' ? 1 : t.kind === 'event' ? 2 : t.kind === 'item' ? (t.gain ? 3 : 4) : 5);
/** the place's own activities that spend the moment, by the action that gives them */
const PLACE_TODO: Readonly<Record<string, string>> = { train: 'train', drillSkill: 'drill', repair: 'repair' };

/** the things to do here now, the most pressing first */
export function todoHere(st: GameState): Todo[] {
  if (!isV2(st) || st.over) return [];
  const opts = actions(st), out: Todo[] = [];
  const fight = st.slot === 'afternoon' && st.tournament.matches.some((m) => m.day === st.day && !m.winner && (m.a === 'player' || m.b === 'player'));
  if (fight) out.push({ key: `bout:${st.day}`, kind: 'bout', what: 'fight', slot: true });
  if (st.v2?.challenge) out.push({ key: `challenge:${st.day}:${st.slot}`, kind: 'bout', what: 'challenge', slot: true });
  for (const m of offersHere(st)) {
    const f = freshMark(m, seenOf(st, m.who));
    if (!f) continue;
    const fresh = new Set(f.offers.map((o) => o.key));
    const pays = opts.filter((o) => o.ok && o.gain && offeredBy(o.action as never) === m.who && fresh.has(offerKey(st, o.action as never)));
    // the person and what is new about them, short (a fingerprint of their new offers' keys): it changes when an offer is new
    out.push({ key: `who:${m.who}:${(hashString([...fresh].sort().join(',')) >>> 0).toString(36)}`, kind: f.kind, who: m.who, ...(pays.length ? { gain: Math.max(...pays.map((o) => o.gain!)) } : {}) });
  }
  const seen = new Set<string>();
  for (const o of opts) {
    const what = PLACE_TODO[o.action.type];
    if (!what || !o.ok || seen.has(what)) continue;
    const by = offeredBy(o.action as never);
    if (by !== null && by !== 'forge') continue;
    seen.add(what);
    out.push({ key: `place:${what}:${st.place}:${st.day}:${st.slot}`, kind: 'place', what, slot: !!(o.cost || o.later) });
  }
  return orderTodo(out);
}

/** LA-6, a stable order: by rank, then as listed */
export function orderTodo(list: readonly Todo[]): Todo[] {
  return list.map((t, i) => ({ t, i })).sort((a, b) => rank(a.t) - rank(b.t) || a.i - b.i).map((x) => x.t);
}

/** the things not seen yet (`seen`: the keys the player has seen) */
export function freshTodo(list: readonly Todo[], seen: ReadonlySet<string>): Todo[] {
  return list.filter((t) => !seen.has(t.key));
}

/** the list was opened in this place at this moment (LA-7: the preview leaves once the list is opened) */
export const openedKey = (st: Pick<GameState, 'place' | 'day' | 'slot'>): string => `open:${st.place}:${st.day}:${st.slot}`;

/** what the player has seen in the list (the keys kept by `seeTodo`) */
export function todoSeen(st: GameState): ReadonlySet<string> {
  return new Set(st.v2?.$todo ?? []);
}

/** the most keys kept: the oldest go first (a key names a day, a moment or a person's offers: an old one never comes back) */
const KEEP = 160;

/** the list opens: keeps the keys of everything it holds to do now, and that it was opened here at this moment */
export function seeTodo(st: GameState, list: readonly Todo[]): void {
  if (!st.v2) return;
  const keys = (st.v2.$todo ?? []).filter((k) => k !== openedKey(st) && !list.some((t) => t.key === k));
  keys.push(...list.map((t) => t.key), openedKey(st));
  st.v2.$todo = keys.slice(-KEEP);
}
