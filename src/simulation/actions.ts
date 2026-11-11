import type { Rng } from '../core/rng';
import { PLACES, V2_PLACES, clamp, placeName, type GameState, type PlaceId } from './state';
import type { Emit } from './advance';
import { PEOPLE, titleOf } from '../narrative/people';
import { talkableHere } from './v2watch';
import { ROLE_ACTIONS, available, type RoleAction } from './roles';
import { onTalk } from '../narrative/dialogue';
import { seeOffers } from './v2offers';
import { applyPlayerDuel, playerMatch, opponentOf, type DuelOutcome } from '../tournament/pool';
import { RIVALS } from '../narrative/roster';
import { tx } from '../narrative/text';
import { V2_SKILL_ACTIONS, type V2SkillAction } from './v2skills';
import { isV2 } from './v2';
import { V2_GEAR_ACTIONS, type V2GearAction } from './v2gear';
import { V2_TOWN_ACTIONS, type V2TownAction } from './v2town';
import { V2_STORY_ACTIONS, type V2StoryAction } from '../narrative/v2story';
import { V2_LAW_ACTIONS, type V2LawAction } from './v2law';
import { V2_BARTER_ACTIONS, type V2BarterAction } from './v2barter';
import { V2_INTEL_ACTIONS, type V2IntelAction } from './v2intel';
import { V2_RIVAL_ACTIONS, sandRefusal, type V2RivalAction } from './v2rivals';
import { V2_FESTIVAL_ACTIONS, paradeBlocks, type V2FestivalAction } from './v2festival';
import { V2_WORK_ACTIONS, type V2WorkAction } from './v2work';
import { TRAINED_STATS, trainGain, type TrainedStat } from '../combat/stats';
import type { TextKey } from '../narrative/text';

/** a training session's stat in a version 2 game (the operator's DB7-3 « +1 à la stat choisie, pour le prochain combat », journal Passe DB8): the
 *  one chosen, Attack for an action that names none (a script or a tool of before) */
export const sessionStat = (a: { stat?: TrainedStat }): TrainedStat => (a.stat && (TRAINED_STATS as readonly string[]).includes(a.stat) ? a.stat : 'atk');
/** the stats' names and a session's line in its log, by stat (keys written whole: tests/texts.test.mjs) */
export const STAT_NAME: Record<TrainedStat, TextKey> = { atk: 'stat.atk', def: 'stat.def', end: 'stat.end', viv: 'stat.viv', hp: 'ui.stat.hp' };
const TRAIN_LOG: Record<TrainedStat, TextKey> = { atk: 'v2.train.log.atk', def: 'v2.train.log.def', end: 'v2.train.log.end', viv: 'v2.train.log.viv', hp: 'v2.train.log.hp' };
/** a version 2 session recorded for the next bout (src/simulation/v2gear.ts trainedStats) */
export function recordSession(s: GameState, stat: TrainedStat): void { if (s.v2) (s.v2.prep ??= []).push(stat); }

/** The player's actions (journal Passe L1). Each says what it costs (0 = a minor action that takes no slot: moving between places,
 *  talking, consulting, GAMEPLAY § 4.2; 1 = a significant action that takes the slot, § 4.1), when it is refused and why (a readable
 *  reason, the state untouched), and what it changes (`apply` works on the copy `advance` made). */

export type Action = BaseAction | RoleAction | V2SkillAction | V2GearAction | V2TownAction | V2StoryAction | V2LawAction | V2BarterAction | V2IntelAction | V2RivalAction | V2FestivalAction | V2WorkAction;
type BaseAction =
  | { type: 'move'; to: PlaceId }
  | { type: 'talk'; who: string }
  | { type: 'rest' }
  | { type: 'train'; stat?: TrainedStat }
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
  /** the coins it puts in the player's purse (absent = none; a version 2 game's jobs and resale, journal Passe ECO2): the interface shows it beside the slot (ECO-7) */
  gain?(st: GameState, a: A): number;
  /** a slot the action books now and spends later (a challenge's, at its result; absent = none): never spent here, `cost` stays the rule; the
   *  interface counts it in its tag, so « free » is said only when nothing is spent (rule P2, journal Passe EVL1) */
  later?(st: GameState, a: A): number;
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
    check: (st, a) => (!(isV2(st) ? V2_PLACES : PLACES).includes(a.to) ? tx('move.noPlace') : a.to === st.place ? tx('move.there') : a.to === 'lanterns' && st.slot !== 'evening' && !isV2(st) ? tx('move.lanternsShut') : paradeBlocks(st, a.to) ? tx('v2.fest.wayShut') : null),
    apply: (s, a, _r, emit) => { s.place = a.to; emit({ kind: 'action', id: 'move', cause: 'action:move', text: tx('move.log', { place: placeName(a.to, isV2(s)) }), visible: false }); },
  },
  talk: {
    // (a version 2 game, lot L5: Wynn at the stall he watches, the passers-by on every place: src/simulation/v2watch.ts)
    list: (st) => talkableHere(st).map((p) => ({ type: 'talk', who: p.id })),
    label: (_, a) => tx('talk.label', { name: PEOPLE[a.who]?.name ?? a.who }),
    cost: () => 0,
    check: (st, a) => available(st, a.who),
    apply: (s, a, _r, emit) => {
      const k = `met:${a.who}`;
      if (!s.flags[k]) { s.flags[k] = true; emit({ kind: 'action', id: 'meet', cause: 'action:talk', text: tx('talk.meet', { name: PEOPLE[a.who].name, title: titleOf(PEOPLE[a.who], isV2(s)) }), visible: true }); }
      onTalk(s, a.who, emit);
      // a version 2 game keeps what the person offers now as seen (MK-5 « Elle part à l’ouverture du dialogue, revient avec une nouveauté », journal Passe MK2):
      // outside the fingerprint (src/simulation/v2offers.ts)
      if (isV2(s)) seeOffers(s, a.who, (Object.values(ACTIONS) as ActionDef[]).flatMap((d) => d.list(s)) as never);
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
    // a version 2 game: one line per stat a session may raise (DB7-3), health last (DB11-5)
    list: (st) => (st.place !== trainAt(st) ? [] : isV2(st) ? TRAINED_STATS.map((stat) => ({ type: 'train' as const, stat })) : [{ type: 'train' }]),
    label: (st, a) => (isV2(st) ? tx('v2.train.stat', { stat: tx(STAT_NAME[sessionStat(a)]), n: trainGain(sessionStat(a)) }) : tx('train.label')),
    cost: () => 1,
    // a version 2 game's sand (lot L4): shut the morning after a brawl at the barracks, or taken by Rhosk (src/simulation/v2rivals.ts)
    check: (st) => (st.place !== trainAt(st) ? (isV2(st) ? tx('v2.train.notHere') : tx('train.notHere')) : st.slot === 'evening' ? tx('train.closed') : sandRefusal(st) ?? (st.player.training >= 2 ? tx('train.sharp') : null)),
    apply: (s, a, _r, emit) => {
      s.player.training++; s.player.reputation = clamp(s.player.reputation + 1);
      if (isV2(s)) { const k = sessionStat(a); recordSession(s, k); emit({ kind: 'action', id: 'train', cause: 'action:train', text: tx(TRAIN_LOG[k], { n: trainGain(k) }), visible: true }); return; }
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
    // the forge alone in every game since lot L3 (the operator's EV-10 « Une réponse par lieu, un effet lisible », journal Passe EV2): a version 2 game's arena
    // lockers have their own answer, Clerk Odo's strongroom (src/simulation/v2intel.ts); from journal Passe VP1 to lot L3 Hale's men watched both
    label: () => tx('payWatch.label'),
    cost: () => 0,
    coins: () => 15,
    check: (st) => (st.place !== 'district' ? tx('payWatch.notHere') : st.slot !== 'evening' ? tx('payWatch.dusk') : st.services.forgeWatch ? tx('payWatch.posted') : st.player.coins < 15 ? tx('payWatch.poor') : null),
    apply: (s, _a, _r, emit) => {
      s.player.coins -= 15; s.services.forgeWatch = true; s.town.hale = clamp((s.town.hale ?? 0) + 5, -100, 100);
      emit({ kind: 'action', id: 'pay-watch', cause: 'action:payWatch', text: tx('payWatch.log'), visible: true });
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
export const ACTIONS: { [K in Action['type']]: ActionDef<Extract<Action, { type: K }>> } = { ...BASE, ...ROLE_ACTIONS, ...V2_SKILL_ACTIONS, ...V2_GEAR_ACTIONS, ...V2_TOWN_ACTIONS, ...V2_STORY_ACTIONS, ...V2_LAW_ACTIONS, ...V2_BARTER_ACTIONS, ...V2_INTEL_ACTIONS, ...V2_RIVAL_ACTIONS, ...V2_FESTIVAL_ACTIONS, ...V2_WORK_ACTIONS };
