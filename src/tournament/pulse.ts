import { clamp, type GameState, type WorldPulse } from '../simulation/state';
import { PLAYER_ID } from '../narrative/roster';

/** The tournament's pulse (TOURNAMENT_MASTER_CONTRACT § 9, journal Passe L2), published after every slot: computed from the state (the day,
 *  the hour, results, reputations, services) plus the lasting shifts the events left (`pulse:<field>` flags), so every value has causes
 *  the code can name. The town reads it (crowd size, rumours), the events read it (their conditions). Pure. */

const FIELDS: (keyof WorldPulse)[] = ['excitement', 'activeCompetitors', 'playerFame', 'publicPressure', 'security', 'commerce', 'festivity', 'sabotageRisk'];

export function computePulse(s: GameState): WorldPulse {
  const night = s.slot === 'evening', matchDay = s.tournament.matches.some((m) => m.day === s.day);
  const played = s.tournament.matches.filter((m) => m.winner).length;
  const shift = (k: keyof WorldPulse) => (s.flags[`pulse:${k}`] as number) ?? 0;
  const hostility = Math.max(0, ...Object.values(s.competitors).map((c) => -(c.relationships[PLAYER_ID] ?? 0)));
  const excitement = clamp(35 + s.day * 10 + (matchDay && s.slot !== 'morning' ? 12 : 0) + played * 2 + shift('excitement'));
  const security = clamp(62 - (night ? 12 : 0) + (s.services.forgeWatch ? 15 : 0) + shift('security'));
  const p: WorldPulse = {
    excitement,
    activeCompetitors: Object.values(s.competitors).filter((c) => c.phaseStatus !== 'eliminated').length + 1,
    playerFame: clamp(s.player.reputation + shift('playerFame')),
    publicPressure: clamp(s.player.reputation * 0.6 + (matchDay ? 20 : 5) + shift('publicPressure')),
    security,
    commerce: clamp(40 + excitement / 4 - (s.services.forge === 'sabotaged' ? 10 : 0) - (night ? 10 : 0) + shift('commerce')),
    festivity: clamp(excitement * (night ? 0.55 : 0.8) + shift('festivity')),
    sabotageRisk: clamp(hostility * 0.6 + s.player.reputation * 0.3 + (60 - security) * 0.5 + shift('sabotageRisk')),
  };
  for (const k of FIELDS) p[k] = Math.round(p[k]);
  return p;
}
