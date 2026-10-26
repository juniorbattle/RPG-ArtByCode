import type { Rng } from '../core/rng';
import { PLACES, V2_PLACES, clamp, placeName, type GameState, type PlaceId } from './state';
import type { Emit } from './advance';
import { PEOPLE, placeOf, titleOf } from '../narrative/people';
import { ROLE_ACTIONS, available, type RoleAction } from './roles';
import { onTalk } from '../narrative/dialogue';
import { applyPlayerDuel, playerMatch, opponentOf, type DuelOutcome } from '../tournament/pool';
import { RIVALS } from '../narrative/roster';
import { tx } from '../narrative/text';
import { V2_SKILL_ACTIONS, type V2SkillAction } from './v2skills';
import { isV2 } from './v2';
import { V2_GEAR_ACTIONS, type V2GearAction } from './v2gear';
import { V2_TOWN_ACTIONS, type V2TownAction } from './v2town';
import { V2_STORY_ACTIONS, type V2StoryAction } from '../narrative/v2story';

/** The player's actions (journal Passe L1). Each says what it costs (0 = a minor action that takes no slot: moving between places,
 *  talking, consulting, GAMEPLAY § 4.2; 1 = a significant action that takes the slot, § 4.1), when it is refused and why (a readable
 *  reason, the state untouched), and what it changes (`apply` works on the copy `advance` made). */

export type Action = BaseAction | RoleAction | V2SkillAction | V2GearAction | V2TownAction | V2StoryAction;
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

/** where the player trains: the forecourt's practice sand, or the version 2's training ground (lot V5) */
const trainAt = (st: GameState): PlaceId => (isV2(st) ? 'training' : 'forecourt');

type Table = { [K in BaseAction['type']]: ActionDef<Extract<BaseAction, { type: K }>> };

const BASE: Table = {
  move: {
    // the version 2's places (lot V5): the training ground, and the festival square, open by day as by night, where Lantern Row was
    list: (st) => (isV2(st) ? V2_PLACES : PLACES).filter((p) => p !== st.place).map((to) => ({ type: 'move', to })),
    label: (st, a) => tx('move.label', { place: placeName(a.to, isV2(st)) }),
    cost: () => 0,
    check: (st, a) => (!(isV2(st) ? V2_PLACES : PLACES).includes(a.to) ? tx('move.noPlace') : a.to === st.place ? tx('move.there') : a.to === 'lanterns' && st.slot !== 'evening' && !isV2(st) ? tx('move.lanternsShut') : null),
    apply: (s, a, _r, emit) => { s.place = a.to; emit({ kind: 'action', id: 'move', cause: 'action:move', text: tx('move.log', { place: placeName(a.to, isV2(s)) }), visible: false }); },
  },
  talk: {
    list: (st) => Object.values(PEOPLE).filter((p) => placeOf(p, isV2(st)) === st.place && (!p.v2 || isV2(st))).map((p) => ({ type: 'talk', who: p.id })),
    label: (_, a) => tx('talk.label', { name: PEOPLE[a.who]?.name ?? a.who }),
    cost: () => 0,
    check: (st, a) => available(st, a.who),
    apply: (s, a, _r, emit) => {
      const k = `met:${a.who}`;
      if (!s.flags[k]) { s.flags[k] = true; emit({ kind: 'action', id: 'meet', cause: 'action:talk', text: tx('talk.meet', { name: PEOPLE[a.who].name, title: titleOf(PEOPLE[a.who], isV2(s)) }), visible: true }); }
      onTalk(s, a.who, emit);
    },
  },
  rest: {
    list: () => [{ type: 'rest' }],
    label: () => tx('rest.label'),
    cost: () => 1,
    check: (st) => (st.player.injury > 0 ? null : tx('rest.notHurt')),
    apply: (s, _a, _r, emit) => { s.player.injury = Math.max(0, s.player.injury - 1); emit({ kind: 'action', id: 'rest', cause: 'action:rest', text: tx('rest.log'), visible: true }); },
  },
  train: {
    // the version 2 trains at the training ground (lot V5)
    list: (st) => (st.place === trainAt(st) ? [{ type: 'train' }] : []),
    label: () => tx('train.label'),
    cost: () => 1,
    check: (st) => (st.place !== trainAt(st) ? (isV2(st) ? tx('v2.train.notHere') : tx('train.notHere')) : st.slot === 'evening' ? tx('train.closed') : st.player.training >= 2 ? tx('train.sharp') : null),
    apply: (s, _a, _r, emit) => {
      s.player.training++; s.player.reputation = clamp(s.player.reputation + 1);
      emit({ kind: 'action', id: 'train', cause: 'action:train', text: tx('train.log'), visible: true });
    },
  },
  fight: {
    // the arena (or the bot, headless) fights the duel and hands its result in; offered as « enter the arena » by the interface
    list: () => [],
    label: (st) => { const m = playerMatch(st); return m ? tx('fight.label', { name: RIVALS[opponentOf(m)].name }) : tx('fight.labelPlain'); },
    cost: () => 1,
    check: (st, a) => {
      const m = playerMatch(st);
      if (!m) return tx('fight.noBout');
      if (st.slot !== 'afternoon') return tx('fight.afternoon');
      if (m.winner) return tx('fight.fought');
      const o = a.outcome;
      return o && (o.winner === 'player' || o.winner === 'opponent') && o.playerMaxHp > 0 && o.opponentMaxHp > 0 ? null : tx('fight.noResult');
    },
    apply: (s, a, _r, emit) => { applyPlayerDuel(s, a.outcome, emit); s.pendingMatch = null; s.flags.dusk = s.day; },
  },
  nightfall: {
    // back from a bout the evening opens at the end of day (choice G2: `afternoon` as the transition); the night falls when the player says
    list: (st) => (st.slot === 'evening' && st.flags.dusk === st.day && !st.flags[`night:${st.day}`] ? [{ type: 'nightfall' }] : []),
    label: () => tx('nightfall.label'),
    cost: () => 0,
    check: (st) => (st.slot === 'evening' && st.flags.dusk === st.day && !st.flags[`night:${st.day}`] ? null : tx('nightfall.notNow')),
    apply: (s, _a, _r, emit) => { s.flags[`night:${s.day}`] = true; emit({ kind: 'action', id: 'nightfall', cause: 'action:nightfall', text: tx('nightfall.log'), visible: true }); },
  },
  payWatch: {
    list: (st) => (st.place === 'district' && st.slot === 'evening' ? [{ type: 'payWatch' }] : []),
    // a version 2 game (journal Passe VP1): Hale's men also watch the arena's lockers, the gear's sabotage's answer (src/events/v2catalog.ts)
    label: (st) => tx(isV2(st) ? 'v2.payWatch.label' : 'payWatch.label'),
    cost: () => 0,
    coins: () => 15,
    check: (st) => (st.place !== 'district' ? tx('payWatch.notHere') : st.slot !== 'evening' ? tx('payWatch.dusk') : st.services.forgeWatch ? tx('payWatch.posted') : st.player.coins < 15 ? tx('payWatch.poor') : null),
    apply: (s, _a, _r, emit) => {
      s.player.coins -= 15; s.services.forgeWatch = true; s.town.hale = clamp((s.town.hale ?? 0) + 5, -100, 100);
      emit({ kind: 'action', id: 'pay-watch', cause: 'action:payWatch', text: tx(isV2(s) ? 'v2.payWatch.log' : 'payWatch.log'), visible: true });
    },
  },
  wait: {
    list: () => [{ type: 'wait' }],
    label: () => tx('wait.label'),
    cost: () => 1,
    check: () => null,
    apply: (_s, _a, _r, emit) => { emit({ kind: 'action', id: 'wait', cause: 'action:wait', text: tx('wait.log'), visible: false }); },
  },
};

/** every action: the player's own, and those the town's people offer (roles.ts) */
/** every action: the player's own, those the town's people offer (roles.ts), and the version 2's (listed only in a version 2 game, after
 *  today's: the default game's options keep their order) */
export const ACTIONS: { [K in Action['type']]: ActionDef<Extract<Action, { type: K }>> } = { ...BASE, ...ROLE_ACTIONS, ...V2_SKILL_ACTIONS, ...V2_GEAR_ACTIONS, ...V2_TOWN_ACTIONS, ...V2_STORY_ACTIONS };
