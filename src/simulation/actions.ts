import type { Rng } from '../core/rng';
import { PLACES, clamp, placeName, type GameState, type PlaceId } from './state';
import type { Emit } from './advance';
import { PEOPLE } from '../narrative/people';
import { ROLE_ACTIONS, available, type RoleAction } from './roles';
import { onTalk } from '../narrative/dialogue';
import { applyPlayerDuel, playerMatch, opponentOf, type DuelOutcome } from '../tournament/pool';
import { RIVALS } from '../narrative/roster';

/** The player's actions (journal Passe L1). Each says what it costs (0 = a minor action that takes no slot: moving between places,
 *  talking, consulting, GAMEPLAY § 4.2; 1 = a significant action that takes the slot, § 4.1), when it is refused and why (a readable
 *  reason, the state untouched), and what it changes (`apply` works on the copy `advance` made). */

export type Action = BaseAction | RoleAction;
type BaseAction =
  | { type: 'move'; to: PlaceId }
  | { type: 'talk'; who: string }
  | { type: 'rest' }
  | { type: 'train' }
  | { type: 'wait' }
  | { type: 'fight'; outcome: DuelOutcome }
  | { type: 'payWatch' }
  | { type: 'nightfall' };

export interface ActionDef<A extends Action = Action> {
  /** the actions of this kind worth offering now (refused ones included, with their reason) */
  list(st: GameState): A[];
  label(st: GameState, a: A): string;
  cost(st: GameState, a: A): number;
  /** the coins it takes from the player's purse (absent = none): the interface shows it beside the slot (journal Passe UI2) */
  coins?(st: GameState, a: A): number;
  /** null = allowed, otherwise why not */
  check(st: GameState, a: A): string | null;
  apply(s: GameState, a: A, rng: Rng, emit: Emit): void;
}

type Table = { [K in BaseAction['type']]: ActionDef<Extract<BaseAction, { type: K }>> };

const BASE: Table = {
  move: {
    list: (st) => PLACES.filter((p) => p !== st.place).map((to) => ({ type: 'move', to })),
    label: (_, a) => `Go to ${placeName(a.to)}`,
    cost: () => 0,
    check: (st, a) => (!PLACES.includes(a.to) ? 'No such place.' : a.to === st.place ? 'You are already there.' : a.to === 'lanterns' && st.slot !== 'evening' ? 'Lantern Row sleeps until dusk: its taverns open at night.' : null),
    apply: (s, a, _r, emit) => { s.place = a.to; emit({ kind: 'action', id: 'move', cause: 'action:move', text: `You walk to ${placeName(a.to)}.`, visible: false }); },
  },
  talk: {
    list: (st) => Object.values(PEOPLE).filter((p) => p.place === st.place).map((p) => ({ type: 'talk', who: p.id })),
    label: (_, a) => `Talk to ${PEOPLE[a.who]?.name ?? a.who}`,
    cost: () => 0,
    check: (st, a) => available(st, a.who),
    apply: (s, a, _r, emit) => {
      const k = `met:${a.who}`;
      if (!s.flags[k]) { s.flags[k] = true; emit({ kind: 'action', id: 'meet', cause: 'action:talk', text: `You meet ${PEOPLE[a.who].name}, ${PEOPLE[a.who].title}.`, visible: true }); }
      onTalk(s, a.who, emit);
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
    label: () => 'Train on the practice sand (+5 % damage at your next bout)',
    cost: () => 1,
    check: (st) => (st.place !== 'forecourt' ? 'The practice sand is at the Arena Forecourt.' : st.slot === 'evening' ? 'The practice sand closes at dusk.' : st.player.training >= 2 ? 'You are as sharp as training can make you before the next bout.' : null),
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
    apply: (s, a, _r, emit) => { applyPlayerDuel(s, a.outcome, emit); s.pendingMatch = null; s.flags.dusk = s.day; },
  },
  nightfall: {
    // back from a bout the evening opens at the end of day (choice G2: `afternoon` as the transition); the night falls when the player says
    list: (st) => (st.slot === 'evening' && st.flags.dusk === st.day && !st.flags[`night:${st.day}`] ? [{ type: 'nightfall' }] : []),
    label: () => 'Let the night fall',
    cost: () => 0,
    check: (st) => (st.slot === 'evening' && st.flags.dusk === st.day && !st.flags[`night:${st.day}`] ? null : 'The sun is not setting on a bout.'),
    apply: (s, _a, _r, emit) => { s.flags[`night:${s.day}`] = true; emit({ kind: 'action', id: 'nightfall', cause: 'action:nightfall', text: 'The sun sinks behind the Colosseum; the lanterns of the Cité are lit.', visible: true }); },
  },
  payWatch: {
    list: (st) => (st.place === 'district' && st.slot === 'evening' ? [{ type: 'payWatch' }] : []),
    label: () => 'Pay Sergeant Hale to watch the forge tonight (15 coins)',
    cost: () => 0,
    coins: () => 15,
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

/** every action: the player's own, and those the town's people offer (roles.ts) */
export const ACTIONS: { [K in Action['type']]: ActionDef<Extract<Action, { type: K }>> } = { ...BASE, ...ROLE_ACTIONS };
