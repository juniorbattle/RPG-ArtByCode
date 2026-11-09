import { SCHEMA_VERSION, type GameState } from './state';
import { initialCompetitors, initialMatches, initialPoints } from '../tournament/pool';
import { computePulse } from '../tournament/pulse';
import { inEnglish, refOf, tx } from '../narrative/text';

/** The content tables' version a state is made with: a save made with other content is refused (`deserialize`). */
export const CONTENT_ID = 'slice-1';

/** the slice's first morning: the player arrives in the Cité for the tournament (journal Passe L1) */
export function initialState(seed: number, name: string): GameState {
  const s: GameState = {
    schemaVersion: SCHEMA_VERSION, content: CONTENT_ID, seed, day: 1, slot: 'morning', over: false, place: 'district', step: 0,
    player: { name, coins: 60, reputation: 10, injury: 0, training: 0, items: [] },
    competitors: initialCompetitors(),
    tournament: { phase: 'I', points: initialPoints(), matches: initialMatches() },
    pulse: { excitement: 40, activeCompetitors: 0, playerFame: 5, publicPressure: 20, security: 60, commerce: 50, festivity: 40, sabotageRisk: 10 },
    services: { forge: 'open', shopFactor: 1, shopCause: '', forgeWatch: false },
    quests: {}, town: {}, flags: {}, facts: [],
    // the arrival in English, the state's language, with what it says for the journal in the language chosen (journal Passe RG4)
    log: [inEnglish(() => { const text = tx('clock.arrival', { name }), t = refOf(text); return { seq: 0, day: 1, slot: 'morning' as const, kind: 'slot', id: 'arrival', cause: 'new-game', text, visible: true, ...(t ? { $t: t } : {}) }; })],
    pendingMatch: null,
  };
  s.pulse = computePulse(s);
  return s;
}
