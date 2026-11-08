import skinsFile from '../../art-lab/characters/variants/fighters.json';
import { recolor, sheetTone, type FighterSkinsFile, type NamedFrame } from './FighterSkins';

/** The generic fighters' skin variants in the game (journal Passe GS1; the rules: FighterSkins.ts). Loaded by the version 2's portraits (PlazaCast) and duels
 *  (CombatCast) only: today's game never reaches this module. In production only an approved file is applied, each sheet's masks at their approved fingerprint;
 *  while it waits for the operator nothing changes. DEV only: `fighterskin=<ramp>` (every generic fighter) or `fighterskin=<who>:<ramp>,...` shows a candidate
 *  skin of the file whatever its approval (the review of the decision sheet). */
const FILE = skinsFile as unknown as FighterSkinsFile;

/** the fighter a sheet belongs to (`kell-x2-v1`, `kell-x3-combat` -> `kell`), or null */
export const fighterOfSheet = (sheetId: string): string | null => { const who = sheetId.replace(/-(x2-v1|x3-combat)$/, ''); return who !== sheetId && FILE.fighters[who] ? who : null; };

/** the DEV review's skin for a fighter: the 1-based candidate the address names, or undefined */
function reviewVariant(who: string): number | undefined {
  if (!import.meta.env.DEV || typeof location === 'undefined') return undefined;
  const p = new URLSearchParams(location.search).get('fighterskin');
  if (!p) return undefined;
  const pick = p.includes(':') ? p.split(',').map((s) => s.split(':')).find(([w]) => w === who)?.[1] : p;
  if (!pick) return undefined;
  const n = FILE.fighters[who]?.variants.indexOf(pick) ?? -1;
  return n >= 0 ? n + 1 : pick === 'original' ? 0 : undefined;
}

/** a sheet's frames as the fighter shows them: a function giving frame n recoloured (by its index in `frames`), or null when the sheet keeps its texels */
export function sheetSkin(sheetId: string, frames: readonly NamedFrame[], fw: number, fh: number): ((n: number, rgba: Uint8Array) => Uint8Array) | null {
  const who = fighterOfSheet(sheetId);
  if (!who) return null;
  const review = reviewVariant(who);
  const tone = review !== undefined ? sheetTone(FILE, who, sheetId, frames, fw, fh, 'candidate', review) : sheetTone(FILE, who, sheetId, frames, fw, fh, 'approved');
  if (!tone) return null;
  const ramp = FILE.ramps.skin[tone.ramp];
  return (n, rgba) => recolor(rgba, tone.masks[n], tone.range, ramp);
}
