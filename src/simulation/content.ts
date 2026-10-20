import { SCHEMA_VERSION, type GameState } from './state';

/** The content tables' version a state is made with: a save made with other content is refused (`deserialize`). */
export const CONTENT_ID = 'slice-1';

/** the slice's first morning: the player arrives in the Cité for the tournament (journal Passe L1) */
export function initialState(seed: number, name: string): GameState {
  return {
    schemaVersion: SCHEMA_VERSION, content: CONTENT_ID, seed, day: 1, slot: 'morning', over: false, place: 'district', step: 0,
    player: { name, coins: 60, reputation: 10, injury: 0, training: 0, items: [] },
    competitors: {},
    tournament: { phase: 'I', points: {}, matches: [] },
    pulse: { excitement: 40, activeCompetitors: 0, playerFame: 5, publicPressure: 20, security: 60, commerce: 50, festivity: 40, sabotageRisk: 10 },
    services: { forge: 'open', shopFactor: 1, shopCause: '', forgeWatch: false },
    quests: {}, town: {}, flags: {}, facts: [],
    log: [{ seq: 0, day: 1, slot: 'morning', kind: 'slot', id: 'arrival', cause: 'new-game', text: `${name} arrives in the Cité du Tournoi for the great tournament.`, visible: true }],
    pendingMatch: null,
  };
}
