
/** The townsfolk who fight themselves (journal Passe PN1; the operator's GP-01 « Les deux : se battre quand on est pris, et prendre de force », GP-02 « Les passants
 *  seulement », GP-03 « Gagné : on s’échappe sans amende (la pièce reste) », and his GP-04 note, word for word « Mais les pnjs peuvent etre des combattants eux-meme
 *  personne ne se bat vraiment pour d'ou la volonte de conception generique avec des declinaisons de peau cheveux, couleur de vetement et armes etc... », answer
 *  « Gabarits d'abord (Recommandé) », journal Passe GP2): nobody fights for them. A keeper who catches a thief at the stall by day (Mara, Hilde, Master Corvin, Pip),
 *  Wynn of the quay watch who catches one forcing a shutter at night, and each passer-by, robbed or challenged for their piece, fights on a townsfolk template
 *  (src/characters/NpcLook.ts) in their own colours and with their own weapon, a kit of the townsfolk (src/combat/autoData.ts AUTO_TOWN_KITS), and a sheet: a pool
 *  rival's (NPC_BASE) at the bout's stage, lower by their shares of its health and its blows. The children of the squares are never among them. Every look, kit
 *  and share is « proposé » (the sheets of chantier 1). English (K1). Pure data. */

/** a townsperson's template (the townsman, the townswoman) and weapon (the art sheet of chantier 1, GA-W); the pages draw them (src/characters/NpcLook.ts, NpcWeapons.ts) */
export type NpcTemplate = 'm' | 'f';
export type NpcWeapon = 'sword' | 'axe' | 'hammer' | 'mace' | 'dagger';
export interface NpcLookSpec {
  template: NpcTemplate;
  /** a ramp of art-lab/characters/variants/npc.json per material (absent: the template's own colour) */
  skin?: string; hair?: string; cloak?: string;
  weapon: NpcWeapon;
}

export interface NpcFighter {
  id: string;
  /** their look on a template: the ramps of art-lab/characters/variants/npc.json, their weapon */
  look: NpcLookSpec;
  /** their health and blows against NPC_BASE's sheet at the bout's stage */
  hp: number; damage: number;
}

/** the pool rival whose sheet a townsperson's is drawn from (the race's level, src/combat/autoData.ts autoGenericSheet) */
export const NPC_BASE = 'orla';

const f = (id: string, look: NpcLookSpec, hp: number, damage: number): NpcFighter => ({ id, look, hp, damage });
export const NPC_FIGHTERS: Record<string, NpcFighter> = {
  // the keepers, by day at their stall, and the watch at night; each look follows the person's town sheet (its hair, its main garment), the skin its own
  mara: f('mara', { template: 'f', skin: 'light', hair: 'chestnut', weapon: 'dagger' }, 0.9, 0.95),
  hilde: f('hilde', { template: 'f', skin: 'light', hair: 'chestnut', cloak: 'wine', weapon: 'hammer' }, 0.85, 0.9),
  corvin: f('corvin', { template: 'm', skin: 'light', hair: 'auburn', cloak: 'wine', weapon: 'sword' }, 0.95, 0.95),
  pip: f('pip', { template: 'm', skin: 'light', hair: 'dark', cloak: 'umber', weapon: 'dagger' }, 0.85, 0.9),
  wynn: f('wynn', { template: 'm', skin: 'light', hair: 'chestnut', weapon: 'mace' }, 0.95, 0.9),
  // the passers-by, one at every place and moment (GP-06 « Un passant par lieu et par moment (douze) »: twelve place-moments, ten people, Lady Edda and Sela keeping their two moments)
  nell: f('nell', { template: 'f', skin: 'light', hair: 'dark', cloak: 'slate', weapon: 'dagger' }, 0.85, 0.9),
  jory: f('jory', { template: 'm', skin: 'light', hair: 'auburn', weapon: 'dagger' }, 0.85, 0.9),
  fenwick: f('fenwick', { template: 'm', skin: 'light', hair: 'grey', cloak: 'umber', weapon: 'axe' }, 0.85, 0.9),
  edda: f('edda', { template: 'f', skin: 'light', hair: 'ash', weapon: 'sword' }, 0.85, 0.9),
  yselle: f('yselle', { template: 'f', skin: 'light', hair: 'ash', cloak: 'wine', weapon: 'dagger' }, 0.8, 0.9),
  garrick: f('garrick', { template: 'm', skin: 'light', hair: 'grey', cloak: 'slate', weapon: 'hammer' }, 0.85, 0.9),
  maud: f('maud', { template: 'f', skin: 'light', weapon: 'axe' }, 0.85, 0.9),
  dov: f('dov', { template: 'm', skin: 'light', hair: 'auburn', cloak: 'umber', weapon: 'sword' }, 0.9, 0.95),
  hettie: f('hettie', { template: 'f', skin: 'light', hair: 'dark', cloak: 'moss', weapon: 'mace' }, 0.85, 0.9),
  sela: f('sela', { template: 'f', skin: 'light', hair: 'ash', weapon: 'dagger' }, 0.85, 0.9),
};
