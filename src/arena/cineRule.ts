/** The rule of the duel's cinematics (journal Passe CI2), data alone: the guide reads its numbers (src/ui/tutorial.ts) without loading the arena's replay (src/arena/cine.ts). */

/** a cinematic's tier (the operator's note on CI-2, word for word « comme dans street fighter, utiliser nos cinematiques pour les super et les ultra [...] l'ecran
 *  noir ne serait pas integre lors du super mais l'animation plus simple serait tout de meme bien orchester ! »): `ultra` in the black void, `super` in the arena */
export type CineTier = 'ultra' | 'super';
/** when an action lands « totalement »: `hit` every blow of the action lands (neither guarded, dodged, parried, interrupted nor lost in a clash); `open` and in an
 *  opening or a break (CI-3 « Et seulement dans une faille ou une rupture ») */
export type CineLand = 'hit' | 'open';
/** `free`: this tier plays every time it lands, outside `max` and `gap` (the workshop of journal Passe SK1: the operator's « si c'est la competences ultime alors la
 *  cinematique doit se jouer en tout temps, des lors que'elle reussit »); its cinematics still count for the `gap` of the others */
export interface CineTierRule { tier: CineTier; roles: readonly string[]; land: CineLand; free?: boolean }
export interface CineRule {
  tiers: readonly CineTierRule[];
  /** whose skills: Ren's alone, or both fighters' */
  side: 'ren' | 'both';
  /** at most this many a bout (the first ones), and at least `gap` seconds of the duel between two */
  max?: number; gap?: number;
  /** the blow that ends the bout always plays one when it is a skill of a tier, landing in full, whatever `land`, `max` and `gap` */
  ko?: boolean;
}

/** The rule the operator decided on the sheet https://claude.ai/artifact/2Ut19phdR8vySTVzAU1a98 (journal Passe CI2), word for word: CI-2 « Les ultimes seules (les
 *  exploitations) » with its note (the supers for the strong skills, without the black screen), CI-3 « Et seulement dans une faille ou une rupture » for the
 *  ultras and, for the supers, his answer « Super : chaque coup touche (Recommended) » (a breaker never lands in an opening: measured 0 a bout), CI-4 « Les deux
 *  combattants », CI-5 « Au plus 3, 20 s entre deux, le K.O. toujours » */
export const CINE_RULE: CineRule = {
  tiers: [{ tier: 'ultra', roles: ['exploit'], land: 'open' }, { tier: 'super', roles: ['breaker'], land: 'hit' }],
  side: 'both', max: 3, gap: 20, ko: true,
};
