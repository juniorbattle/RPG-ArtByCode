import lookFile from '../../art-lab/characters/variants/npc.json';
import { lookFingerprint, recolorLook, sheetMaterials, type HeroLookFile, type HeroMaterial } from './HeroLook';
import type { NamedFrame } from './FighterSkins';
import { weaponFrame, type WeaponSheet } from './NpcWeapons';
import type { NpcLookSpec, NpcTemplate } from '../narrative/npcFighters';

/** A townsperson in a duel (journal Passe PN1; the operator's GP-04 note, word for word « Mais les pnjs peuvent etre des combattants eux-meme personne ne se bat
 *  vraiment pour d'ou la volonte de conception generique avec des declinaisons de peau cheveux, couleur de vetement et armes etc... », and his answer « Gabarits
 *  d'abord (Recommandé) », journal Passe GP2): one of two templates (the townsman npc-m-x3-combat, the townswoman npc-f-x3-combat), recoloured once on its texels to
 *  the person's skin, hair and clothes (Ren's look's engine, HeroLook.ts, on art-lab/characters/variants/npc.json), then the person's weapon drawn over the template's
 *  sword (NpcWeapons.ts). Production applies it only with the file approved by the operator and each template's material fingerprint; the DEV review (`mode`
 *  'candidate') shows it whatever the approval. Loaded by a version 2 duel only (src/arena/CombatCast.ts): today's game never reaches this module. */

export type { NpcLookSpec, NpcTemplate };
export const NPC_LOOK_FILE = lookFile as unknown as HeroLookFile & { sheets: Record<string, HeroLookFile['sheets'][string] & { weapon: WeaponSheet }> };
export const npcSheetId = (t: NpcTemplate): string => `npc-${t}-x3-combat`;
/** is the looks' file approved for production (the operator's art sheet) */
export const npcLooksApproved = (): boolean => NPC_LOOK_FILE.approved === true && !!NPC_LOOK_FILE.approval?.by && !!NPC_LOOK_FILE.approval?.date;

/** a template's frames as the person shows them: frame n recoloured to its look, its weapon drawn; null when the file is not approved (production) */
export function npcSheetLook(spec: NpcLookSpec, frames: readonly NamedFrame[], fw: number, fh: number, mode: 'approved' | 'candidate' = 'approved'): ((n: number, rgba: Uint8Array) => Uint8Array) | null {
  if (mode === 'approved' && !npcLooksApproved()) return null;
  const id = npcSheetId(spec.template), s = NPC_LOOK_FILE.sheets[id];
  if (!s) return null;
  const look: Partial<Record<HeroMaterial, string>> = { skin: spec.skin, hair: spec.hair, cloak: spec.cloak };
  // the material maps of the template, at the approved fingerprint in production (a mismatch throws: the file and the export disagree)
  const maps = sheetMaterials(frames, fw, fh, s), fp = lookFingerprint(maps);
  if (mode === 'approved' && s.fingerprint !== fp) throw new Error(`${id}: townsfolk look maps ${fp} are not the approved maps ${s.fingerprint}`);
  const tone = !!(look.skin || look.hair || look.cloak), skin = new Set([...s.skin.skin, ...(s.skin.shade ?? [])].map((c) => parseInt(c, 16)));
  return (n, rgba) => weaponFrame(tone ? recolorLook(rgba, maps[n], NPC_LOOK_FILE, look) : rgba, frames[n].rgba, fw, fh, frames[n].name, s.weapon, spec.weapon, skin);
}
