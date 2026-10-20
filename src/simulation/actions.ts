import type { Rng } from '../core/rng';
import { PLACES, clamp, placeName, type GameState, type PlaceId } from './state';
import type { Emit } from './advance';
import { PEOPLE, presentAt } from '../narrative/people';
import { applyPlayerDuel, playerMatch, opponentOf, type DuelOutcome } from '../tournament/pool';
import { RIVALS } from '../narrative/roster';

/** The player's actions (journal Passe L1). Each says what it costs (0 = a minor action that takes no slot: moving between places,
 *  talking, consulting, GAMEPLAY § 4.2; 1 = a significant action that takes the slot, § 4.1), when it is refused and why (a readable
 *  reason, the state untouched), and what it changes (`apply` works on the copy `advance` made). */

export type Action =
  | { type: 'move'; to: PlaceId }
  | { type: 'talk'; who: string }
  | { type: 'rest' }
  | { type: 'train' }
  | { type: 'wait' }
  | { type: 'fight'; outcome: DuelOutcome }
  | { type: 'payWatch' };

export interface ActionDef<A extends Action = Action> {
  /** the actions of this kind worth offering now (refused ones included, with their reason) */
  list(st: GameState): A[];
  label(st: GameState, a: A): string;
  cost(st: GameState, a: A): number;
  /** null = allowed, otherwise why not */
  check(st: GameState, a: A): string | null;
  apply(s: GameState, a: A, rng: Rng, emit: Emit): void;
}

type Table = { [K in Action['type']]: ActionDef<Extract<Action, { type: K }>> };

export const ACTIONS: Table = {
  move: {
    list: (st) => PLACES.filter((p) => p !== st.place).map((to) => ({ type: 'move', to })),
    label: (_, a) => `Go to ${placeName(a.to)}`,
    cost: () => 0,
    check: (st, a) => (!PLACES.includes(a.to) ? 'No such place.' : a.to === st.place ? 'You are already there.' : null),
    apply: (s, a, _r, emit) => { s.place = a.to; emit({ kind: 'action', id: 'move', cause: 'action:move', text: `You walk to ${placeName(a.to)}.`, visible: false }); },
  },
  talk: {
    list: (st) => Object.values(PEOPLE).filter((p) => p.place === st.place).map((p) => ({ type: 'talk', who: p.id })),
    label: (_, a) => `Talk to ${PEOPLE[a.who]?.name ?? a.who}`,
    cost: () => 0,
    check: (st, a) => {
      const p = PEOPLE[a.who];
      if (!p) return 'Nobody by that name.';
      if (p.place !== st.place) return `${p.name} is not here.`;
      return presentAt(p, st.place, st.slot) ? null : `${p.name} is not around at this hour.`;
    },
    apply: (s, a, _r, emit) => {
      const k = `met:${a.who}`;
      if (!s.flags[k]) { s.flags[k] = true; emit({ kind: 'action', id: 'meet', cause: 'action:talk', text: `You meet ${PEOPLE[a.who].name}, ${PEOPLE[a.who].title}.`, visible: true }); }
    },
  },
  rest: {
    list: () => [{ type: 'rest' }],
    label: () => 'Rest (heals one level of injury)',
    cost: () => 1,
    check: (st) => (st.player.injury > 0 ? null : 'You are not hurt.'),
    apply: (s, _a, _r, emit) => { s.player.injury = Math.max(0, s.player.injury - 1); emit({ kind: 'action', id: 'rest', cause: 'action:rest', text: 'You rest; your wounds ease.', visible: true }); },
  },
  train: {
    list: (st) => (st.place === 'forecourt' ? [{ type: 'train' }] : []),
    label: () => 'Train on the practice sand (+5 % damage at your next duel)',
    cost: () => 1,
    check: (st) => (st.place !== 'forecourt' ? 'The practice sand is at the Arena Forecourt.' : st.slot === 'evening' ? 'The practice sand closes at dusk.' : st.player.training >= 2 ? 'You are as sharp as training can make you before the next duel.' : null),
    apply: (s, _a, _r, emit) => {
      s.player.training++; s.player.reputation = clamp(s.player.reputation + 1);
      emit({ kind: 'action', id: 'train', cause: 'action:train', text: 'You drill on the practice sand until your arms burn.', visible: true });
    },
  },
  fight: {
    // the arena (or the bot, headless) fights the duel and hands its result in; offered as « enter the arena » by the interface
    list: () => [],
    label: (st) => { const m = playerMatch(st); return m ? `Fight ${RIVALS[opponentOf(m)].name} in the arena` : 'Fight'; },
    cost: () => 1,
    check: (st, a) => {
      const m = playerMatch(st);
      if (!m) return 'You have no bout today.';
      if (st.slot !== 'afternoon') return 'Your bout is this afternoon.';
      if (m.winner) return 'You have fought today.';
      const o = a.outcome;
      return o && (o.winner === 'player' || o.winner === 'opponent') && o.playerMaxHp > 0 && o.opponentMaxHp > 0 ? null : 'No result from the arena.';
    },
    apply: (s, a, _r, emit) => { applyPlayerDuel(s, a.outcome, emit); s.pendingMatch = null; },
  },
  payWatch: {
    list: (st) => (st.place === 'district' && st.slot === 'evening' ? [{ type: 'payWatch' }] : []),
    label: () => 'Pay Sergeant Hale to watch the forge tonight (15 coins)',
    cost: () => 0,
    check: (st) => (st.place !== 'district' ? 'Sergeant Hale is on the quay.' : st.slot !== 'evening' ? 'The night watch is hired at dusk.' : st.services.forgeWatch ? 'The watch is already posted.' : st.player.coins < 15 ? 'You cannot pay the watch (15 coins).' : null),
    apply: (s, _a, _r, emit) => {
      s.player.coins -= 15; s.services.forgeWatch = true; s.town.hale = clamp((s.town.hale ?? 0) + 5, -100, 100);
      emit({ kind: 'action', id: 'pay-watch', cause: 'action:payWatch', text: 'You pay Sergeant Hale: two of his men will stand by Bram\'s forge tonight.', visible: true });
    },
  },
  wait: {
    list: () => [{ type: 'wait' }],
    label: () => 'Let the time pass',
    cost: () => 1,
    check: () => null,
    apply: (_s, _a, _r, emit) => { emit({ kind: 'action', id: 'wait', cause: 'action:wait', text: 'You let the hours go by.', visible: false }); },
  },
};
