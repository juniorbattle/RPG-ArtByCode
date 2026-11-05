/** The version 2's spectators in the arena's stands, the pure half (journal Passe PU1, the operator's decision sheet `briefs/fiche-public-gradins.html`):
 *  PU-1 « Les cinq habitants du quartier, avec leurs variantes », PU-2 « Dense : 88 places », PU-3 « Debout », PU-4 « Variantes, horloges décalées,
 *  ailes tournées vers l’arène », PU-5 « Calquée sur la foule sonore », PU-6 « Non : les sauts suffisent », PU-7 « Derrière la version 2 seulement »,
 *  PU-8 « Approuver : en production dans les gradins de la version 2, avec les choix de cette fiche ». No RNG draw anywhere: the seats, who sits where,
 *  the variants, the breathing clocks and the share of the stands a moment moves all come from hashes of the seat's index (the arena's build is untouched).
 *  The loader and the renderer: StandsCast.ts. */
import { ARC, GATE_HALF, TIER, TOWER_W } from './ArenaScene';
import { variantOf } from '../characters/Variants';
import { crowdOf } from '../audio/sfx';

/** the district's five townsfolk (journal Passe 4A-tervicies), each with its two approved colour variants (journal Passes V1-V3) */
export const STANDS_SHEETS = ['artisan-x2-v1', 'traveler-x2-v1', 'townswoman-x2-v1', 'older-merchant-x2-v1', 'courier-x2-v1'] as const;

/** where the seats are: every tier, from the gate towers to 60 deg each side (where the generated spectators stood), a seat every ~`step` m along
 *  the tier, one in `1 / gap` left empty, `depth` of the tier from its front edge; `scale` the presentation scale (the generated spectators' 0.62 x the
 *  cast's 0.9) */
export const STANDS = {
  from: Math.asin(GATE_HALF / ARC.r) + Math.asin(TOWER_W / ARC.r),
  to: (60 * Math.PI) / 180,
  step: 0.55,
  gap: 0.2,
  depth: 0.45,
  scale: 0.62 * 0.9,
};

/** a 32-bit integer hash of n, as a number in [0, 1) */
export function hash01(n: number): number {
  let h = Math.imul(n ^ 0x9e3779b9, 0x85ebca6b) >>> 0;
  h ^= h >>> 13; h = Math.imul(h, 0xc2b2ae35) >>> 0; h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

export interface StandSeat { x: number; y: number; z: number; tier: number; side: -1 | 1 }

/** the seats, left wing then right, tier by tier from the lowest, along the arc from the gate */
export function standsSeats(): StandSeat[] {
  const out: StandSeat[] = [];
  let n = 0;
  for (const side of [-1, 1] as const) for (let k = 0; k < TIER.n; k++) {
    const r = ARC.r + ARC.thick + k * TIER.depth + TIER.depth * STANDS.depth, y = TIER.base + (k + 1) * TIER.rise;
    const m = Math.floor(((STANDS.to - STANDS.from) * r) / STANDS.step);
    for (let s = 0; s < m; s++) {
      n++;
      if (hash01(n * 7 + 1) < STANDS.gap) continue;
      const t = STANDS.from + (STANDS.to - STANDS.from) * ((s + 0.5 + (hash01(n * 7 + 2) - 0.5) * 0.4) / m);
      out.push({ x: ARC.cx + r * Math.sin(side * t), y, z: ARC.cz - r * Math.cos(side * t), tier: k, side });
    }
  }
  return out;
}

/** who sits on seat i: a sheet among `variants.length`, and its variant (0 = the original, 1..variants[sheet] the approved ones), by Variants' own rule.
 *  The seats go by blocks of as many as there are sheets, each block a permutation of them by its hash: every townsperson as often as the others (the
 *  sheet's prototype drew each seat on its own, and the traveler sat 6 times in 88, journal Passe PU1), never twice among a tier's neighbours of a block */
export function seatOf(i: number, variants: readonly number[]): { sheet: number; variant: number } {
  const n = variants.length, block = Math.floor(i / n), order = [...Array(n).keys()];
  for (let j = n - 1; j > 0; j--) { const r = Math.floor(hash01(block * 53 + j) * (j + 1)); [order[j], order[r]] = [order[r], order[j]]; }
  const sheet = order[i % n];
  return { sheet, variant: variantOf(STAND_ID + i, variants[sheet]) };
}
/** the spectators' actor ids (their variant hash; out of the fighters' and effects' ranges) */
export const STAND_ID = 400;

/** each spectator breathes on its own clock: a phase and a rate from 0.85 to 1.15 */
export const breathRate = (i: number): number => 0.85 + hash01(i * 13 + 3) * 0.3;
export const breathPhase = (i: number): number => i * 0.37;

/** the crowd's moments: those of the crowd's sound (lots S3 / S5, `crowdOf`), the share of the stands each moves and how long */
export type Reaction = 'roar' | 'gasp' | 'cheer' | 'oh';
export const REACTION: Record<Reaction, { share: number; len: number }> = {
  roar: { share: 1, len: 3 },       // the K.O.: everyone, three seconds of hops
  gasp: { share: 0.75, len: 0.9 },  // a break: a start, then the breath held
  cheer: { share: 0.8, len: 1.6 },  // Ren's techniques
  oh: { share: 0.45, len: 0.5 },    // the other heavy blows that land
};
/** a duel's event -> the crowd's reaction, the very one its sound plays (src/audio/sfx.ts, read, not changed) */
export function reactionOf(e: { type: string } & Record<string, unknown>): Reaction | null {
  return crowdOf(e);
}
/** does seat i take a reaction of this share fired at time t, and when it starts (a seat's start is spread over 0.35 s) */
export function takes(i: number, t: number, share: number): number | null {
  const h = hash01(i * 977 + Math.floor(t * 120) * 131);
  return h < share ? t + h * 0.35 : null;
}

/** a spectator's lift (m) `dt` seconds into its reaction, and whether its breath is held: hops of 7 cm (9 for the roar), a small one for the « oh »,
 *  the gasp's start of 4 cm then its fall while the breath is held; outside the reaction's length, nothing */
export function reactionPose(r: Reaction | null, dt: number, rate: number): { dy: number; hold: boolean } {
  if (!r || dt < 0 || dt >= REACTION[r].len) return { dy: 0, hold: false };
  if (r === 'roar' || r === 'cheer') return { dy: Math.max(0, Math.sin(dt * 9 * rate)) * (r === 'roar' ? 0.09 : 0.07), hold: false };
  if (r === 'oh') return { dy: Math.max(0, Math.sin(dt * 6.3)) * 0.04, hold: false };
  return { dy: dt < 0.12 ? 0.04 * (dt / 0.12) : 0.04 * Math.exp(-(dt - 0.12) * 3), hold: true };
}
