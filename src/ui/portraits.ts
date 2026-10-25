import { portrait, MAREK, VESSA } from '../arena/FighterArt';
import { BLACKSMITH, MERCHANT_WOMAN, GUARD_A, GUARD_B, HOODED, PORTER, PLAYER, crowdVariants, type CharSpec } from '../characters/SpriteGenerator';
import { castSource } from '../characters/BakedCast';
import { decodePng, sha256, sheetFrames } from '../characters/BakedDecode';
import { RIVALS } from '../narrative/roster';

/** The dialogues' portraits (choice K3, journal Passe L4; the operator's decision L4, « Visage cuit d'abord, bustes plus tard », journal Passes
 *  UI1 / UI3): a person whose sprite is a baked sheet of the production cast shows that sheet's face (its front idle frame, head and shoulders,
 *  32 x 32 texels), the face the player sees walking in the district; the others (the rivals, the forecourt's officials, the innkeeper, the
 *  arena's fighters: generated or portrait-only) keep the town generator's front frame (24 x 24 texels). Busts come later, in a task of their own
 *  (L4). Painted once, scaled up without smoothing. */

/** the people the district's baked sheets stand for (BakedCast: the archetype each sheet replaces, PERSON_OF in playTown.ts); the guards share
 *  one sheet (Wynn's recolouring, a variant, is not drawn here) */
const BAKED: Record<string, string> = {
  mara: 'merchant-x2-v2', bram: 'blacksmith-x2-v1', hale: 'guard-x2-v1', wynn: 'guard-x2-v1', stranger: 'hooded-x2-v1', tam: 'dockworker-x2-v2',
  folk: 'townswoman-x2-v1', player: 'hero-x2-v4',
};

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

/** the face of a baked sheet's front idle frame: S x S texels from the figure's top row, centred on its head */
export function faceCrop(rgba: Uint8Array, fw: number, fh: number, S = 32): { x: number; y: number; size: number } {
  const op = (x: number, y: number) => rgba[(y * fw + x) * 4 + 3] > 0;
  let top = 0;
  while (top < fh && ![...Array(fw).keys()].some((x) => op(x, top))) top++;
  let x0 = fw, x1 = -1;
  for (let y = top; y < Math.min(fh, top + 12); y++) for (let x = 0; x < fw; x++) if (op(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const cx = x1 >= x0 ? (x0 + x1 + 1) / 2 : fw / 2;
  return { x: Math.max(0, Math.min(fw - S, Math.round(cx - S / 2))), y: Math.max(0, Math.min(fh - S, top - 2)), size: S };
}

const baked = new Map<string, string>();
let loading: Promise<void> | null = null;
/** paints the baked faces once (the pages wait for it, with the fonts, before they say they are ready); a sheet that fails its check keeps
 *  the generated portrait (said in the console) */
export function preloadPortraits(): Promise<void> {
  loading ??= (async () => {
    const sheets = new Map<string, string>();
    for (const id of new Set(Object.values(BAKED))) {
      const src = castSource(id);
      if (!src) continue;
      try {
        const bytes = new Uint8Array(await (await fetch(src.png)).arrayBuffer()), got = await sha256(bytes);
        if (got !== null && got !== src.sha256) throw new Error('SHA-256 does not match its provenance pack');
        const { k, frames } = sheetFrames(id, await decodePng(bytes), src.json);
        const front = frames.find((f) => f.dir === 'down' && f.anim === 'idle' && f.i === 0);
        if (!front) throw new Error('no front idle frame');
        const fw = 32 * k, fh = 48 * k, crop = faceCrop(front.rgba, fw, fh), c = document.createElement('canvas');
        c.width = c.height = crop.size;
        const img = new ImageData(crop.size, crop.size);
        for (let y = 0; y < crop.size; y++) for (let x = 0; x < crop.size; x++) {
          const s = ((crop.y + y) * fw + crop.x + x) * 4, d = (y * crop.size + x) * 4;
          for (let j = 0; j < 4; j++) img.data[d + j] = front.rgba[s + j];
        }
        c.getContext('2d')!.putImageData(img, 0, 0);
        sheets.set(id, c.toDataURL());
      } catch (e) { console.warn(`portrait ${id}: ${(e as Error).message}; the generated portrait stays`); }
    }
    for (const [who, id] of Object.entries(BAKED)) { const u = sheets.get(id); if (u) baked.set(who, u); }
  })();
  return loading;
}

const cache = new Map<string, string>();
/** a data URL of the person's portrait (null if they have none): the baked face once preloaded, else the generator's */
export function portraitUrl(who: string): string | null {
  if (baked.has(who)) return baked.get(who)!;
  if (cache.has(who)) return cache.get(who)!;
  const s = specOf(who), c = s ? portrait(s) : null, url = c ? c.toDataURL() : null;
  if (url) cache.set(who, url);
  return url;
}
