import type { GameState } from './state';
import { actions } from './advance';
import { offeredBy } from './roles';
import { isV2 } from './v2';
import { offersHere, freshMark } from './v2marks';
import { offerKey, seenOf, type MarkKind } from './v2offers';

/** What there is to do here and now in a version 2 game (the operator's request of 2026-11-11, journal Passe LA1: « je pense que nous pourrions mettre plus en
 *  evidence cette zone a l'ecran durant nos parcours afin d'inciter le joueur a voir ce qui a a faire durant la periode »). Read from the state alone, as the
 *  list (Q, src/ui/townUi.ts openHere) and the marks (src/simulation/v2marks.ts) read it: the day's bout or a challenge waiting on the sand; each person here
 *  with something new for the player (the diamonds, MK-4); the place's own activities that spend the moment (the practice sand, the drills, the forge to mend).
 *  Never a theft, the rest, the wait or watching a rival (MK-6), nor the crowd. Pure. */

export type TodoKind = 'bout' | MarkKind | 'place';

export interface Todo {
  /** what makes it the same thing again (a person by their newest offer, an activity by its day and moment) */
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

const ORDER: Record<TodoKind, number> = { bout: 0, follow: 1, event: 2, item: 3, place: 4 };
/** the place's own activities that spend the moment, by the action that gives them */
const PLACE_TODO: Readonly<Record<string, string>> = { train: 'train', drillSkill: 'drill', repair: 'repair' };

/** the things to do here now, the most pressing first (the bout, then what follows, an event, what pays, an item, the place's activities) */
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
    out.push({ key: `who:${m.who}:${[...fresh].sort().join(',')}`, kind: f.kind, who: m.who, ...(pays.length ? { gain: Math.max(...pays.map((o) => o.gain!)) } : {}) });
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
  // a stable order: by kind, then what pays first, then as listed
  return out.map((t, i) => ({ t, i })).sort((a, b) => ORDER[a.t.kind] - ORDER[b.t.kind] || (b.t.gain ?? 0) - (a.t.gain ?? 0) || a.i - b.i).map((x) => x.t);
}

/** the things not seen yet in the list (`seen`: the keys the player has seen there) */
export function freshTodo(list: readonly Todo[], seen: ReadonlySet<string>): Todo[] {
  return list.filter((t) => !seen.has(t.key));
}
