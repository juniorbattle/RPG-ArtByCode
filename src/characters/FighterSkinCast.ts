import genericsFile from '../../art-lab/characters/variants/fighters.json';
import rivalsFile from '../../art-lab/characters/variants/rivals.json';
import { recolor, sheetTone, type FighterSkinsFile, type NamedFrame } from './FighterSkins';
import type { BakedFrame } from './BakedSprites';

/** The fighters' skin variants in the game (the rules: FighterSkins.ts): the generic fighters' (journal Passe GS1, fighters.json) and the rivals'
 *  (journal Passe RS1, rivals.json), each file with its own approval; a sheet belongs to the fighter whose file names it (any sheet: the code knows no names). Loaded by the version 2's portraits and squares (PlazaCast) and duels (CombatCast)
 *  only: today's game never reaches this module. In production only an approved file is applied, each sheet's masks at their approved fingerprint; while a
 *  file waits for the operator nothing of it changes. DEV only: `fighterskin=<ramp>` (every fighter of both files) or `fighterskin=<who>:<ramp>,...` shows
 *  a candidate skin whatever the file's approval (the review of the decision sheets). */
export const SKIN_FILES = [genericsFile, rivalsFile] as unknown as FighterSkinsFile[];

/** the file and the fighter a sheet belongs to (`kell-x3-combat` -> kell of fighters.json, `orla-x2-v2` -> orla of rivals.json), or null */
function ownerOf(sheetId: string): { file: FighterSkinsFile; who: string } | null {
  for (const file of SKIN_FILES) for (const [who, f] of Object.entries(file.fighters)) if (f.sheets[sheetId]) return { file, who };
  return null;
}
/** the fighter a sheet belongs to, or null */
export const fighterOfSheet = (sheetId: string): string | null => ownerOf(sheetId)?.who ?? null;

/** the DEV review's skin for a fighter: the 1-based candidate the address names, or undefined */
function reviewVariant(file: FighterSkinsFile, who: string): number | undefined {
  if (!import.meta.env.DEV || typeof location === 'undefined') return undefined;
  const p = new URLSearchParams(location.search).get('fighterskin');
  if (!p) return undefined;
  const pick = p.includes(':') ? p.split(',').map((s) => s.split(':')).find(([w]) => w === who)?.[1] : p;
  if (!pick) return undefined;
  const n = file.fighters[who]?.variants.indexOf(pick) ?? -1;
  return n >= 0 ? n + 1 : pick === 'original' ? 0 : undefined;
}

/** a sheet's frames as the fighter shows them: a function giving frame n recoloured (by its index in `frames`), or null when the sheet keeps its texels */
export function sheetSkin(sheetId: string, frames: readonly NamedFrame[], fw: number, fh: number): ((n: number, rgba: Uint8Array) => Uint8Array) | null {
  const own = ownerOf(sheetId);
  if (!own) return null;
  const { file, who } = own, review = reviewVariant(file, who);
  const tone = review !== undefined ? sheetTone(file, who, sheetId, frames, fw, fh, 'candidate', review) : sheetTone(file, who, sheetId, frames, fw, fh, 'approved');
  if (!tone) return null;
  const ramp = file.ramps.skin[tone.ramp];
  return (n, rgba) => recolor(rgba, tone.masks[n], tone.range, ramp);
}

/** a town sheet's frames (BakedDecode's order, named `<dir>/<anim>.<i>` as FighterSkins.namedFrames names them) */
export const namedTown = (frames: readonly BakedFrame[]): NamedFrame[] => frames.map((f) => ({ name: `${f.dir}/${f.anim}.${f.i}`, rgba: f.rgba }));

/** a town sheet recoloured in place to its fighter's skin (a rival walking on a square, journal Passe RS1); false when the sheet keeps its texels */
export function toneTownSheet(sheetId: string, frames: BakedFrame[], fw: number, fh: number): boolean {
  const skin = sheetSkin(sheetId, namedTown(frames), fw, fh);
  if (!skin) return false;
  frames.forEach((f, n) => { f.rgba = skin(n, f.rgba); });
  return true;
}
