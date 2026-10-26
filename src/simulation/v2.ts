import type { GameState } from './state';

/** The « version 2 » of the game (the operator's decision AV-2, « Un drapeau « version 2 » pour tout, défaut inchangé », journal Passes AV1 /
 *  V0): every system of the cloud session « Version 2 » (the three-button command and its charged attack, the skills, the equipment and the
 *  shops, haggling / challenging / stealing, the districts, the ten days' story, the events, the sound, the screens) switches on together by
 *  one game flag, `flags.v2`, kept in the save. A new game takes it by `?play=1&new=1&v2=1` (as `combat=dynamic`), a named state by
 *  `&v2=1`. The flag implies the rules of the « tour par tour dynamique » (`flags.combat = 'dynamic'`, brief § 2). Without it the game is
 *  today's, unchanged. Pure. */

export function isV2(s: Pick<GameState, 'flags'>): boolean { return s.flags.v2 === true; }

/** marks a state as a version 2 game (a new game, or a named state for reviews and proofs): the flag and the dynamic rules it implies */
export function makeV2(s: GameState): GameState {
  s.flags.v2 = true;
  s.flags.combat = 'dynamic';
  return s;
}

/** the address asks for the version 2: `v2` or `v2=1` (anything else, `v2=0` included, is today's game) */
export function wantsV2(get: (k: string) => string | null): boolean {
  const v = get('v2');
  return v === '' || v === '1';
}
