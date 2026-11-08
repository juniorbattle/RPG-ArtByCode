import heroFile from '../../art-lab/characters/variants/hero.json';
import { sheetLook, type HeroLookFile, type HeroMaterial } from './HeroLook';
import type { NamedFrame } from './FighterSkins';
import type { BakedFrame } from './BakedSprites';
import { castSource, type CastEntry } from './BakedCast';

/** Ren's look in the game (journal Passe PR3; the rules: HeroLook.ts). Loaded by the version 2's pages only: the squares (PlazaApp), the duel (CombatCast and its
 *  HUD face), the portraits of a version 2 game, and the town page of a version 2 game, which asks for it by `herolook=1` (set by playTown.ts) and imports it on
 *  demand: today's game never reaches this module. In production only an approved file is applied, each sheet's maps at their approved fingerprint; while it
 *  waits for the operator nothing changes. DEV only: `herolook=candidate` shows the file's look whatever its approval, `herolook=<skin>.<hair>.<cloak>` another
 *  look of its ramps (`-` keeps a material), for the review. */
const FILE = heroFile as unknown as HeroLookFile;
/** Ren's town sheet; his combat sheet is named by CombatCast alone (tests/combat-sheet.test.mjs), which hands its frames to `heroSheetLook` */
export const HERO_TOWN = 'hero-x2-v4';

/** the DEV review's look, or null (production: always null) */
function review(): Partial<Record<HeroMaterial, string>> | null {
  if (!import.meta.env.DEV || typeof location === 'undefined') return null;
  const p = new URLSearchParams(location.search).get('herolook');
  if (!p || p === '1') return null;
  if (p === 'candidate') return { ...FILE.look };
  const [skin, hair, cloak] = p.split('.').map((s) => (s && s !== '-' ? s : undefined));
  return { skin, hair, cloak };
}

/** a sheet's frames under Ren's look: a function giving frame n recoloured, or null when the sheet keeps its texels */
export function heroSheetLook(sheetId: string, frames: readonly NamedFrame[], fw: number, fh: number): ((n: number, rgba: Uint8Array) => Uint8Array) | null {
  const look = review();
  return look ? sheetLook(FILE, sheetId, frames, fw, fh, 'candidate', look) : sheetLook(FILE, sheetId, frames, fw, fh, 'approved');
}

/** the town sheet's frames (BakedDecode's order) named as FighterSkins.namedFrames names them */
const named = (frames: readonly BakedFrame[]): NamedFrame[] => frames.map((f) => ({ name: `${f.dir}/${f.anim}.${f.i}`, rgba: f.rgba }));

/** the town sheet recoloured in place to Ren's look; false when it keeps its texels */
export function toneHeroTown(frames: BakedFrame[], fw: number, fh: number): boolean {
  const look = heroSheetLook(HERO_TOWN, named(frames), fw, fh);
  if (!look) return false;
  frames.forEach((f, n) => { f.rgba = look(n, f.rgba); });
  return true;
}

/** the cast with Ren's town sheet under his look (the town and the squares of a version 2 game) */
export const heroEntries = (entries: readonly CastEntry[]): CastEntry[] => entries.map((e) => (e.manifest.id === HERO_TOWN ? { ...e, tone: (frames: BakedFrame[], fw: number, fh: number) => { toneHeroTown(frames, fw, fh); } } : e));

/** Ren's portrait source for a version 2 game's pages (portraits.ts: his face in the dialogues and his figure on the gear page, under his look) */
export function heroPortrait(): { id: string; png: string; json: unknown; sha256: string; tone: (frames: BakedFrame[], fw: number, fh: number) => void } {
  const src = castSource(HERO_TOWN);
  if (!src) throw new Error(`${HERO_TOWN}: not in the production cast`);
  return { id: HERO_TOWN, ...src, tone: (frames, fw, fh) => { toneHeroTown(frames, fw, fh); } };
}

/** Ren's front idle frame under his look (the duel's HUD face), or null */
export function heroFace(frames: readonly BakedFrame[], fw: number, fh: number): Uint8Array | null {
  const all = named(frames), n = all.findIndex((f) => f.name === 'down/idle.0'), look = n < 0 ? null : heroSheetLook(HERO_TOWN, all, fw, fh);
  return look ? look(n, all[n].rgba) : null;
}
