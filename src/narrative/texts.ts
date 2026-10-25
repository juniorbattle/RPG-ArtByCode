/** The play mode's names of the arena's actions (choice K1, journal Passe L3): the prototype's French names stay in `COMBAT_DATA` for
 *  `?scene=arena`; an official bout's data take these. Pure data. */
export const ACTION_NAMES_EN: Record<string, string> = {
  light: 'Quick strike', heavy: 'Heavy strike', t1: 'Flash cut', t2: 'Lunge', t3: 'Whirlwind', t4: 'Thrust', m_slash: 'Slash', m_heavy: 'Heavy blow',
  // the skills the « tour par tour dynamique » adds (src/combat/dynamic.ts, journal Passes C1 / C2)
  d1: 'Rampart', s1: 'Fervour',
};
