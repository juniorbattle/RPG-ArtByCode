import { advance, newGame } from './advance';
import type { Action } from './actions';
import type { GameState } from './state';

/** Named states for tests, the lab and `?state=<name>` (DEV) (PROJECT_MASTER_CONTRACT § 10.3: « hooks de test permettant de charger des
 *  états nommés »). Each is reached by playing a script of actions from a new game (seed 1842 unless given), never by writing fields, so
 *  every named state is one the game itself can reach. */

export const NAMED_SEED = 1842;

export function play(st: GameState, script: readonly Action[]): GameState {
  for (const a of script) {
    const r = advance(st, a);
    if (!r.ok) throw new Error(`named state script: "${a.type}" refused on day ${st.day} ${st.slot}: ${r.reason}`);
    st = r.state;
  }
  return st;
}

const W: Action = { type: 'wait' };
/** fixed results of the arena, for the named states past a bout */
const WON: Action = { type: 'fight', outcome: { winner: 'player', playerHp: 120, playerMaxHp: 200, opponentHp: 0, opponentMaxHp: 600, finisher: 'tech' } };
const LOST: Action = { type: 'fight', outcome: { winner: 'opponent', playerHp: 0, playerMaxHp: 200, opponentHp: 300, opponentMaxHp: 600, finisher: 'heavy' } };

export const NAMED_STATES: Record<string, { about: string; script: readonly Action[] }> = {
  'day1-morning': { about: 'a new game, the first morning', script: [] },
  'day1-evening': { about: 'the first evening, nothing done', script: [W, W] },
  'day2-morning': { about: 'the second morning, nothing done', script: [W, W, W] },
  'day2-afternoon': { about: 'the first bout\'s afternoon (Vessa), nothing done', script: [W, W, W, W] },
  'day2-dusk-won': { about: 'back from a won first bout, at the end of day', script: [W, W, W, W, WON] },
  'day2-dusk-lost': { about: 'back from a lost first bout (hurt), at the end of day', script: [W, W, W, W, LOST] },
  'day3-afternoon': { about: 'the second bout\'s afternoon (Marek), the first won', script: [W, W, W, W, WON, W, W] },
  'forecourt-morning': { about: 'the first morning, at the Arena Forecourt', script: [{ type: 'move', to: 'forecourt' }] },
  'forecourt-dusk-lost': { about: 'hurt after the first bout, at the forecourt at sunset', script: [W, W, W, W, LOST, { type: 'move', to: 'forecourt' }] },
  'slice-end': { about: 'the slice played to its end: both bouts won, nothing else done', script: [W, W, W, W, WON, W, W, WON, W] },
  'trained-day1-evening': { about: 'trained twice on day 1', script: [{ type: 'move', to: 'forecourt' }, { type: 'train' }, { type: 'train' }] },
};

export function namedState(name: string, seed = NAMED_SEED, player = 'Ren'): GameState {
  const n = NAMED_STATES[name];
  if (!n) throw new Error(`no named state "${name}" (known: ${Object.keys(NAMED_STATES).join(', ')})`);
  return play(newGame(seed, player), n.script);
}
