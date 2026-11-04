import type { Look, SoundPlace } from './score';

/** Which piece of the band plays where (journal Passe SN10): the plan of the card C-LIEUX, which the operator validated, « Valider ce plan » (journal Passe
 *  SN8; the card's text, briefs/fiche-son-catalogue.html): « La ville
 *  suit l’heure : matin, midi, fin de journée, nuit. Le parvis et les lices ont leur morceau de jour, et prennent celui de la nuit le soir. La place de la
 *  halle a sa valse à toute heure. Les combats suivent le tournoi : le duel pour les trois tours de poule et la Porte, le rival pour les demi-finales et les
 *  matchs du jour 8, la finale pour le jour 10. Le titre ouvre une partie neuve, puisque l’écran-titre reste muet (SA-16). La fanfare joue aux annonces, les
 *  jingles à la fin d’un combat. » And how the fights' three layers follow the duel (SA-5 « Oui, par couches », C-COUCHES « Trois couches sur les trois
 *  combats »): « proposé », to be judged in play. Pure. */

export type PieceId = 'titre' | 'matin' | 'midi' | 'fin' | 'nuit' | 'parvis' | 'lices' | 'valse' | 'duel' | 'rival' | 'finale';
export type StingId = 'fanfare' | 'victoire' | 'defaite';
export const PIECES: readonly PieceId[] = ['titre', 'matin', 'midi', 'fin', 'nuit', 'parvis', 'lices', 'valse', 'duel', 'rival', 'finale'];
export const STINGS: readonly StingId[] = ['fanfare', 'victoire', 'defaite'];

/** a page's piece: the arena its bout's, a new game's first page the title, the hall's square its waltz, the night's everywhere else in the evening, the forecourt
 *  and the lists their own by day, the town its hour's (`afternoon` is the end of the day) */
export function pieceFor(place: SoundPlace, look: Look, o: { opening?: boolean; bout?: PieceId } = {}): PieceId {
  if (place === 'arena') return o.bout ?? 'duel';
  if (o.opening) return 'titre';
  if (place === 'festival') return 'valse';
  if (look === 'night') return 'nuit';
  if (place === 'forecourt') return 'parvis';
  if (place === 'training') return 'lices';
  return look === 'morning' ? 'matin' : look === 'midday' ? 'midi' : 'fin';
}

/** a bout's piece by its stage (src/tournament/v2calendar.ts): the pool's three rounds (no stage) and the Gate the duel, the semi-finals and day 8's two bouts
 *  (the third place, the Gate final) the rival, the final the finale; a challenge in town is a duel */
export function boutPiece(stage: string | null | undefined): PieceId {
  return stage === 'final' ? 'finale' : stage === 'semi' || stage === 'third' || stage === 'gateFinal' ? 'rival' : 'duel';
}

/** the announcements the fanfare opens (SA-7 « Fanfare et texte »): the registrar's cries to the crowd on the forecourt (src/narrative/v2story.ts: the
 *  arrival, the cut, the final's morning) */
export const ANNOUNCED: ReadonlySet<string> = new Set(['arrival', 'cut', 'final']);

/** the end of a bout: the knocked-out fighter tells which jingle */
export const jingleFor = (knockedOut: string): StingId => (knockedOut === 'ren' ? 'defaite' : 'victoire');

/** what the fights' layers follow, read from the duel's events: the opponent's sequence under way, the hero's charge reached, a fighter stunned, a fighter
 *  low, the K.O. */
export interface Mood { foeSeq: boolean; charge: number; stunned: number; low: boolean; over: boolean }
export const CALM: Mood = { foeSeq: false, charge: -1, stunned: 0, low: false, over: false };
/** under this share of his health a fighter is low: the endgame keeps the tension */
export const LOW_HP = 0.3;
/** from this tier the charge raises the music (0 the light blow, 1 the heavy at 2 s, then the skills: src/combat/charge.ts) */
export const RISING_TIER = 1;

export function moodStep(m: Mood, e: { type: string } & Record<string, unknown>, maxHp: Readonly<Record<string, number>> = {}): Mood {
  const n = { ...m };
  if (e.type === 'sequenceStart' && e.who !== 'ren') n.foeSeq = true;
  else if (e.type === 'sequenceEnd' && e.who !== 'ren') n.foeSeq = false;
  else if (e.type === 'chargeTier' && e.open) n.charge = Math.max(n.charge, e.idx as number);
  else if (e.type === 'chargeRelease') n.charge = -1;
  else if (e.type === 'stun') n.stunned++;
  else if (e.type === 'stunEnd') n.stunned = Math.max(0, n.stunned - 1);
  else if (e.type === 'impact') { const max = maxHp[e.to as string]; if (max > 0 && (e.hp as number) / max < LOW_HP) n.low = true; }
  else if (e.type === 'ko') n.over = true;
  else if (e.type === 'reset') return { ...CALM };
  return n;
}

/** the layers' levels, base, melody, tension: the riff always; the lead steps aside while the opponent presses; the brass, the strings and the timpani come in
 *  on the opponent's sequence, on the charge from its heavy tier, on a stun, and stay for the endgame; the K.O. takes everything */
export function layerLevels(m: Mood): [number, number, number] {
  if (m.over) return [0, 0, 0];
  return [1, m.foeSeq ? 0 : 1, m.foeSeq || m.charge >= RISING_TIER || m.stunned > 0 || m.low ? 1 : 0];
}
