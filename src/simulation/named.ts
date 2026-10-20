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

export const NAMED_STATES: Record<string, { about: string; script: readonly Action[] }> = {
  'day1-morning': { about: 'a new game, the first morning', script: [] },
  'day1-evening': { about: 'the first evening, nothing done', script: [W, W] },
  'day2-morning': { about: 'the second morning, nothing done', script: [W, W, W] },
  'trained-day1-evening': { about: 'trained twice on day 1', script: [{ type: 'move', to: 'forecourt' }, { type: 'train' }, { type: 'train' }] },
};

export function namedState(name: string, seed = NAMED_SEED, player = 'Ren'): GameState {
  const n = NAMED_STATES[name];
  if (!n) throw new Error(`no named state "${name}" (known: ${Object.keys(NAMED_STATES).join(', ')})`);
  return play(newGame(seed, player), n.script);
}
