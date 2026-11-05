import { MIX, type Effect } from './score';

/** The duel's sounds (lot S3, journal Passes SN15 / SN16): which baked sound of the band plays for each event of a duel, and the arena's crowd. The operator's
 *  sheet briefs/fiche-son-duel.html, word for word: S3-DUEL « Mieux : continuer dans cette voie », S3-COUPS, S3-REN, S3-RIVAUX, S3-SOUTIENS, S3-CHARGE and
 *  S3-KO « Bonne direction », S3-LECTURE « Bonne direction, les cinq », S3-FOULE « Bonne direction (par le code) », S3-BAISSE « Garder les baisses »,
 *  S3-SUITE « Cuire et brancher dans la version 2 ce qui est validé ». One sound for each effect recipe of the arena (src/arena/fx/fxRecipes.ts, name for name),
 *  the duel's reading, the crowd in code (art-lab/audio/sfx/). Pure. */

/** the levels, set on the engine's output for the sheet (tools/audio/sfx-listen.mjs): the sounds at today's share of the mix, the crowd's murmur 5 dB under
 *  the duel's music (the arena's rumble played as loud as the music, journal Passe SN15) */
export const SFX_TRIM = -10.7;
export const CROWD_TRIM = 0.7 - MIX.ambience;
/** the crowd (its murmur and its reactions) carved around 500 Hz, where it stood over the fights' melody (journal Passe SN21: 37.5 dB in that octave against
 *  the duel's 35.8): a peaking filter, S5-FOULE « Creuser la foule à 500 Hz » (journal Passe SN22) */
export const CROWD_CARVE = { hz: 500, q: 1, db: -5 } as const;
/** a crowd's reaction at most this often (s), the K.O.'s always */
export const REACT_QUIET = 2.6;
/** the charge held: a breath every so many seconds, as the effect's motes (src/arena/fx/combatFx.ts, HOLD_BREATH) */
export const HOLD_EVERY = 0.6;

export type CrowdId = 'oh' | 'gasp' | 'cheer' | 'roar';
/** how a sound varies from one stroke to the next: the plain blows a little higher or lower and louder or softer (their kit has no pitch to keep); the sounds
 *  tuned on the motif only in level, so that they stay in the music's key; the duel's reading and the charge's notes never, a signal is the same every time */
export type Vary = 'pitch' | 'level' | 'none';
export interface SfxCue { id: string; pan: number; vary: Vary; duck?: Effect }

const SIDE = (who: unknown): number => (who === 'ren' ? -0.28 : 0.28);
/** the skills with a sound of their own; the plain blows take their side's */
const OWN = new Set(['t1', 't2', 't3', 't4', 'k_sunder', 'k_feint', 'm_ironfall', 'm_lunge', 'm_shoulder', 'm_riposte', 'm_smite', 'm_wild', 'm_cleave']);
const SUPPORT = new Set(['d1', 'm_bulwark', 'm_brace', 'm_aegis', 'm_hide', 'k_iron', 'k_parry', 's1', 'k_cry', 'k_focus', 'm_resolve', 'm_tempo', 'm_gild', 'm_prayer', 'm_grit', 'm_roar']);
const PITCHED_BLOWS = new Set(['light', 'heavy', 'm_slash', 'm_heavy', 'guard', 'guardHeavy', 'whiff']);
const SILENT_VARY = new Set(['threat', 'window', 'dodge', 'stun', 'pushed', 'charge1', 'charge2', 'charge3', 'hold1', 'hold2', 'hold3', 'release', 'denied']);
export const varyOf = (id: string): Vary => (PITCHED_BLOWS.has(id) ? 'pitch' : SILENT_VARY.has(id) ? 'none' : 'level');

/** a charge tier's level, as the effect counts it (src/arena/fx/fxRecipes.ts, chargeLevel): 1 the first skill's tier (the heavy blow's before journal
 *  Passe CH1), 3 the last tiers */
export function chargeLevel(idx: number, tiers: number): 0 | 1 | 2 | 3 {
  if (idx <= 0) return 0;
  if (idx === 1) return 1;
  return idx - 2 < Math.ceil((tiers - 2) / 2) ? 2 : 3;
}

const cue = (id: string, pan: number, duck?: Effect): SfxCue => ({ id, pan, vary: varyOf(id), ...(duck ? { duck } : {}) });

/** the sounds of a duel's event; `tiers` the hero's charge tiers */
export function sfxOf(e: { type: string } & Record<string, unknown>, tiers: number): SfxCue[] {
  switch (e.type) {
    case 'impact': {
      const foe = e.from !== 'ren', pan = SIDE(e.to);
      if (e.result === 'dodged') return [cue('whiff', pan)];
      if (e.result === 'guarded') return [cue(e.kind === 'light' ? 'guard' : 'guardHeavy', pan, 'guard')];
      if (e.result === 'guardbreak') return [cue('break', pan, 'break')];
      const action = String(e.action), id = OWN.has(action) ? action : foe ? (e.kind === 'heavy' ? 'm_heavy' : 'm_slash') : e.kind === 'heavy' ? 'heavy' : 'light';
      return [cue(id, pan, e.kind === 'heavy' || e.kind === 'skill' || (e.damage as number) >= 20 ? 'heavy' : 'hit')];
    }
    case 'effect': { const a = String(e.action); return [cue(SUPPORT.has(a) ? a : e.family === 'defensive' ? 'd1' : 's1', SIDE(e.who))]; }
    case 'break': return [cue('break', SIDE(e.who), 'break')];
    case 'stun': return [cue('stun', SIDE(e.who))];
    case 'ko': return [cue('ko', 0, 'ko')];
    case 'chargeTier': { const l = e.open ? chargeLevel(e.idx as number, tiers) : 0; return l ? [cue(`charge${l}`, SIDE('ren'))] : []; }
    case 'chargeRelease': return e.ok && (e.idx as number) >= 1 ? [cue('release', SIDE('ren'))] : [];
    case 'commandDenied': return e.who === 'ren' ? [cue('denied', 0)] : [];
    case 'windowOpen': return e.who !== 'ren' ? [cue('window', SIDE(e.who))] : [];
    case 'reactStart': return e.who === 'ren' ? [cue('dodge', SIDE('ren'))] : [];
    case 'sequenceStart': return e.who !== 'ren' ? [cue('threat', SIDE(e.who))] : [];
    case 'pushed': return [cue('pushed', SIDE(e.who))];
    default: return [];
  }
}

/** the crowd's reaction to a duel's event: an « oh » when a heavy blow or a skill lands, a cheer when it is one of Ren's skills, a gasp at a break, the roar
 *  of the K.O. */
export function crowdOf(e: { type: string } & Record<string, unknown>): CrowdId | null {
  if (e.type === 'ko') return 'roar';
  if (e.type === 'break') return 'gasp';
  if (e.type === 'impact' && e.result === 'hit' && (e.kind === 'heavy' || e.kind === 'skill')) return e.from === 'ren' && OWN.has(String(e.action)) ? 'cheer' : 'oh';
  return null;
}
/** the charge held: the level its breath plays at after this event (0: none), `now` the level before it; the breath stops when the charge ends or Ren is stunned */
export function holdOf(e: { type: string } & Record<string, unknown>, tiers: number, now: number): number {
  if (e.type === 'chargeTier' && e.open) { const l = chargeLevel(e.idx as number, tiers); return l || now; }
  if (e.type === 'chargeRelease' || e.type === 'chargeEnd' || e.type === 'ko' || e.type === 'reset' || e.type === 'stun' && e.who === 'ren') return 0;
  return now;
}
/** the sound of the threat at most once a second: the opponent's sequences come about seven times a minute */
export const THREAT_QUIET = 1;
