import { portrait, MAREK, VESSA } from '../arena/FighterArt';
import { BLACKSMITH, MERCHANT_WOMAN, GUARD_A, GUARD_B, HOODED, PORTER, PLAYER, crowdVariants, type CharSpec } from '../characters/SpriteGenerator';
import { RIVALS } from '../narrative/roster';

/** The dialogues' portraits (choice K3, journal Passe L4): the town generator's own front frame (head and shoulders, 24 x 24 texels), for the
 *  district's people (their archetypes), the rivals (their roster colours, in the generator's grammar) and the forecourt's officials and the
 *  innkeeper, who have no sprite in any scene (portraits only, no spawn). Painted once, scaled up without smoothing. */

const OFFICIALS: Record<string, CharSpec> = {
  odo: { id: 'odo', detail: 'mid', skin: [232, 190, 156], hair: [120, 110, 100], hairStyle: 'short', top: [70, 60, 90], topStyle: 'robe', trim: [200, 180, 110], trousers: [50, 46, 60], boots: [50, 40, 40], anims: ['idle'] },
  anwen: { id: 'anwen', detail: 'mid', skin: [236, 200, 170], hair: [90, 70, 60], hairStyle: 'hood', hat: [220, 214, 200], hooded: true, top: [214, 208, 196], topStyle: 'robe', trim: [160, 60, 60], trousers: [180, 170, 160], boots: [90, 70, 60], anims: ['idle'] },
  lio: { id: 'lio', detail: 'mid', skin: [210, 160, 124], hair: [60, 44, 36], hairStyle: 'kerchief', hat: [150, 60, 50], top: [130, 110, 80], topStyle: 'apronShirt', apron: [220, 210, 190], trousers: [70, 60, 56], boots: [60, 46, 40], beard: [70, 50, 40], anims: ['idle'] },
};

function specOf(who: string): CharSpec | null {
  switch (who) {
    case 'mara': return MERCHANT_WOMAN;
    case 'bram': return BLACKSMITH;
    case 'hale': return GUARD_A;
    case 'wynn': return GUARD_B;
    case 'stranger': return HOODED;
    case 'tam': return PORTER;
    case 'folk': return crowdVariants(1842, 5)[2];
    case 'player': return PLAYER;
    case 'marek': return MAREK;
    case 'vessa': return VESSA;
  }
  if (OFFICIALS[who]) return OFFICIALS[who];
  const r = RIVALS[who];
  if (!r) return null;
  const L = r.look;
  return { id: who, detail: 'mid', skin: L.skin, hair: L.hair, hairStyle: L.hairStyle as CharSpec['hairStyle'], top: L.top, topStyle: 'jerkin', trim: L.trim, trousers: [56, 50, 66], boots: [52, 42, 46], beard: L.beard, sword: true, anims: ['idle'] };
}

const cache = new Map<string, string>();
/** a data URL of the person's portrait (null if they have none) */
export function portraitUrl(who: string): string | null {
  if (cache.has(who)) return cache.get(who)!;
  const s = specOf(who), c = s ? portrait(s) : null, url = c ? c.toDataURL() : null;
  if (url) cache.set(who, url);
  return url;
}
