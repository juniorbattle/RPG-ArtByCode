/** The game's simulation (journal Passe L1): the public surface used by the UI, the arena's play mode, the tests and the lab. */
export * from './state';
export { newGame, cleanName, rngFor, actions, advance, serialize, deserialize, hash, type Advance, type ActionOption, type SaveFile } from './advance';
export type { Action } from './actions';
export { namedState, NAMED_STATES, play } from './named';
export { CONTENT_ID } from './content';
