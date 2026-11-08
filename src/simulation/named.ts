import { advance, newGame } from './advance';
import type { Action } from './actions';
import type { GameState } from './state';
import { makeV2 } from './v2';

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

// lot L3 (journal Passe EVL5): the strap cut in the night before the semi-final (seed 1842: Cassius taunted on the festival square the first night, every pool bout won,
// both signs on day 4, the cut through in second place, the strap cut that night), Lio's room asked of Orla, the semi's opponent, on day 6's morning; then the
// semi-final fought on it, the next morning on the forecourt (Lady Edda can name the colours)
const STRAP6: readonly Action[] = [W, W, { type: 'move', to: 'lanterns' }, { type: 'taunt' }, W, W, WON, W, W, W, W, W, WON, W, W, WON, W, { type: 'rumour', src: 'lio' }, W, { type: 'move', to: 'forecourt' }];

// lot L4 (journal Passe EVL7): Vessa Lark beaten on day 2 (seed 1842), her tale of Orla Brask told in the taverns the next morning, the festival square on day 3's
// afternoon (Brother Ambrose saw her pay the rounds); Rhosk out of the title (seed 6: the cut's four others), every bout won, his plan told on the quay on day 8's
// evening, the next morning on the quay (Sergeant Hale can act on it) and at the training ground (the sand taken)
const POOL_WON: readonly Action[] = [W, W, W, W, WON, W, W, W, W, W, WON, W, W, WON, W];
const SAND9: readonly Action[] = [...POOL_WON, W, WON, W, W, W, W, W, W, W];

/** a state may carry its own seed (lot L4: Rhosk out of the title needs another draw of the pool than 1842's), taken unless a seed is asked for */
export const NAMED_STATES: Record<string, { about: string; script: readonly Action[]; v2?: boolean; seed?: number }> = {
  'day1-morning': { about: 'a new game, the first morning', script: [] },
  'day1-evening': { about: 'the first evening, nothing done', script: [W, W] },
  'day2-morning': { about: 'the second morning, nothing done', script: [W, W, W] },
  'day2-afternoon': { about: 'the first bout\'s afternoon (Vessa), nothing done', script: [W, W, W, W] },
  'day2-dusk-won': { about: 'back from a won first bout, at the end of day', script: [W, W, W, W, WON] },
  'day2-dusk-lost': { about: 'back from a lost first bout (hurt), at the end of day', script: [W, W, W, W, LOST] },
  'day3-afternoon': { about: 'the second bout\'s afternoon (Marek), the first won', script: [W, W, W, W, WON, W, W] },
  'forecourt-morning': { about: 'the first morning, at the Arena Forecourt', script: [{ type: 'move', to: 'forecourt' }] },
  'forecourt-dusk-lost': { about: 'hurt after the first bout, at the forecourt at sunset', script: [W, W, W, W, LOST, { type: 'move', to: 'forecourt' }] },
  'lanterns-night': { about: 'the first evening, on Lantern Row', script: [W, W, { type: 'move', to: 'lanterns' }] },
  'slice-end': { about: 'the slice played to its end: both bouts won, nothing else done', script: [W, W, W, W, WON, W, W, WON, W] },
  'trained-day1-evening': { about: 'trained twice on day 1', script: [{ type: 'move', to: 'forecourt' }, { type: 'train' }, { type: 'train' }] },
  // the version 2 (src/simulation/v2.ts, journal Passe V0): a new game with the flag
  'v2-day1-morning': { about: 'a version 2 game, the first morning', script: [], v2: true },
  // the version 2's squares (lot V5, journal Passe V5)
  'v2-forecourt-morning': { about: 'a version 2 game, the first morning, on the Arena Forecourt', script: [{ type: 'move', to: 'forecourt' }], v2: true },
  'v2-training-morning': { about: 'a version 2 game, the first morning, at the Training Ground', script: [{ type: 'move', to: 'training' }], v2: true },
  'v2-square-afternoon': { about: 'a version 2 game, the first afternoon, on the Festival Square', script: [W, { type: 'move', to: 'lanterns' }], v2: true },
  'v2-square-night': { about: 'a version 2 game, the first evening, on the Festival Square', script: [W, W, { type: 'move', to: 'lanterns' }], v2: true },
  'v2-day2-afternoon': { about: 'a version 2 game, the first bout\'s afternoon (Vessa), nothing done', script: [W, W, W, W], v2: true },
  'v2-forecourt-midday': { about: 'a version 2 game, the first afternoon, on the Arena Forecourt', script: [W, { type: 'move', to: 'forecourt' }], v2: true },
  'v2-forecourt-night': { about: 'a version 2 game, the first evening, on the Arena Forecourt', script: [W, W, { type: 'move', to: 'forecourt' }], v2: true },
  'v2-training-midday': { about: 'a version 2 game, the first afternoon, at the Training Ground', script: [W, { type: 'move', to: 'training' }], v2: true },
  'v2-training-night': { about: 'a version 2 game, the first evening, at the Training Ground (shut)', script: [W, W, { type: 'move', to: 'training' }], v2: true },
  'v2-square-morning': { about: 'a version 2 game, the first morning, on the Festival Square', script: [{ type: 'move', to: 'lanterns' }], v2: true },
  'v2-training-dusk': { about: 'a version 2 game, back from a won first bout, at the Training Ground at sunset', script: [W, W, W, W, WON, { type: 'move', to: 'training' }], v2: true },
  // lots L2a / L2b (journal Passes EVL2 to EVL4): a thief the watch wants, on the quay at night (seed 1842: caught at Mara's, a ribbon lifted at Pip's, caught
  // there again, caught at Fenwick's pocket: three marks in Hale's ledger, the registrar's points); the training ground on day 7, the cut made (Tobin out of the
  // title, Rhosk in the third place's bout)
  'v2-wanted-night': { about: 'a version 2 thief the watch wants (three marks), on the quay at night', script: [{ type: 'steal', shop: 'mara' }, { type: 'move', to: 'lanterns' }, W, { type: 'steal', shop: 'trinkets' }, { type: 'steal', shop: 'trinkets' }, W, { type: 'move', to: 'district' }, { type: 'pickpocket', who: 'fenwick' }], v2: true },
  'v2-day7-training': { about: 'a version 2 game on day 7, every bout won, at the Training Ground', script: [W, W, W, W, WON, W, W, W, W, W, WON, W, W, WON, W, W, WON, W, { type: 'move', to: 'training' }], v2: true },
  // lot L3 (journal Passe EVL5): the strap cut, before and after the semi-final
  'v2-strap-day6': { about: 'a version 2 game on day 6\'s afternoon, on the forecourt: the strap cut in the night before the semi-final, Lio\'s room asked of Orla', script: STRAP6, v2: true },
  'v2-strap-day7': { about: 'a version 2 game on day 7\'s morning, on the forecourt: the semi-final won on the cut strap, its culprit unknown', script: [...STRAP6, WON, W], v2: true },
  'v2-tale-day3': { about: 'a version 2 game on day 3\'s afternoon, on the festival square: Vessa Lark beaten on day 2, her tale of Orla Brask in the taverns', script: [W, W, W, W, WON, W, W, { type: 'move', to: 'lanterns' }], v2: true },
  'v2-sand-day9': { about: 'a version 2 game on day 9\'s morning, on the quay: every bout won, Rhosk out of the title (seed 6), his plan to take the training sand told the night before', script: SAND9, v2: true, seed: 6 },
  'v2-sand-training': { about: 'a version 2 game on day 9\'s morning, at the training ground: Rhosk on the sand (seed 6)', script: [...SAND9, { type: 'move', to: 'training' }], v2: true, seed: 6 },
  // lot L5 (journal Passe EVL9): Wynn of the watch at a robbed stall (seed 1: caught at Hilde's on the first morning, the forecourt that afternoon; seed 1842: caught
  // at Mara's, the quay that afternoon); a famous player on day 7's morning at the training ground, Orla Brask a friend (the strap's game of lot L3)
  'v2-watch-forecourt': { about: 'a version 2 game on the first afternoon, on the forecourt: caught stealing at Hilde\'s stall that morning, Wynn of the watch beside her (seed 1)', script: [{ type: 'move', to: 'forecourt' }, { type: 'steal', shop: 'armourer' }, W], v2: true, seed: 1 },
  'v2-watch-quay': { about: 'a version 2 game on the first afternoon, on the quay: caught stealing at Mara\'s stall that morning, Wynn of the watch beside her', script: [{ type: 'steal', shop: 'mara' }, W], v2: true },
  'v2-famous-training': { about: 'a version 2 game on day 7\'s morning, at the training ground: every bout won, the passers-by celebrate the player, Orla Brask a friend', script: [...STRAP6, WON, W, { type: 'move', to: 'training' }], v2: true },
};

export function namedState(name: string, seed?: number, player = 'Ren'): GameState {
  const n = NAMED_STATES[name];
  if (!n) throw new Error(`no named state "${name}" (known: ${Object.keys(NAMED_STATES).join(', ')})`);
  const st = newGame(seed ?? n.seed ?? NAMED_SEED, player);
  return play(n.v2 ? makeV2(st) : st, n.script);
}
