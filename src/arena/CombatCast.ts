import type { ArenaSpriteSet } from './FighterArt';
import { bakedFaces, edgeFor, installSheets, shadeFor, type InstalledSheets, type Seat, type SheetSource } from './CombatSheets';
import { decodePng } from '../characters/BakedDecode';
import { namedFrames } from '../characters/FighterSkins';
import { sheetSkin } from '../characters/FighterSkinCast';
import { heroSheetLook } from '../characters/HeroLookCast';
import { npcSheetId, npcSheetLook, type NpcLookSpec } from '../characters/NpcLook';
import { NPC_FIGHTERS } from '../narrative/npcFighters';

/** The combat sheets in production (journal Passes CX1 to CX4: each approved on the operator's lot sheets, Ren and Marek together as RC2-5 asked): Ren's and the seven rivals', and since
 *  journal Passe GA2 the three generic fighters' (Ser Aldric Venn, Corra Dunmere, Brother Ambrose: « Production », GA-S1 « Les six ensemble »), since journal Passe GA4 three more (Lucan Rook,
 *  Piers Calloway, Kell Barrow: « Production », GA3-S1 « Les six ensemble »), each on its borrowed rival's clips, loaded by
 *  a duel under the version 2's rules only (`flags.v2`, `?scene=arena&v2=1`), on demand: today's game never reaches this module. A rival without an approved sheet keeps its generated
 *  fighter (none today). `cast=generated` keeps the generated fighters, for comparison. Since journal Passe PN1 the townsfolk who fight themselves (src/narrative/npcFighters.ts): a
 *  template (npc-m-x3-combat, npc-f-x3-combat) in the person's look and weapon (src/characters/NpcLook.ts), in production once the operator's art sheet approves it; DEV only,
 *  `cast=candidate` shows the candidate templates and looks (the art sheet's review). */
const png = import.meta.glob('../../art-lab/characters/exports/{hero,marek,vessa,orla,cassius,ilse,rhosk,tobin,aldric,corra,ambrose,lucan,piers,kell,npc-m,npc-f}-x3-combat.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const json = import.meta.glob('../../art-lab/characters/exports/{hero,marek,vessa,orla,cassius,ilse,rhosk,tobin,aldric,corra,ambrose,lucan,piers,kell,npc-m,npc-f}-x3-combat.json', { import: 'default' }) as Record<string, () => Promise<unknown>>;
const man = import.meta.glob('../../art-lab/characters/manifests/{hero,marek,vessa,orla,cassius,ilse,rhosk,tobin,aldric,corra,ambrose,lucan,piers,kell,npc-m,npc-f}-x3-combat.manifest.json', { import: 'default' }) as Record<string, () => Promise<{ id: string; approved: boolean; runtimeUse: string }>>;
const pack = import.meta.glob('../../art-lab/characters/provenance/{hero,marek,vessa,orla,cassius,ilse,rhosk,tobin,aldric,corra,ambrose,lucan,piers,kell,npc-m,npc-f}-x3-combat/PROVENANCE.json', { import: 'default' }) as Record<string, () => Promise<{ files: Record<string, string> }>>;

const pick = <T>(t: Record<string, T>, id: string): T | null => { const k = Object.keys(t).find((p) => p.includes(`/${id}.`) || p.includes(`/${id}/`)); return k ? t[k] : null; };

async function source(seat: Seat, id: string, o: { look?: NpcLookSpec; candidate?: boolean } = {}): Promise<SheetSource | null> {
  const url = pick(png, id), m = pick(man, id), p = pick(pack, id), j = pick(json, id);
  if (!url || !m || !p || !j) return null;
  const manifest = await m();
  // (DEV only: a candidate template under `cast=candidate`, the art sheet's review)
  if (!(o.candidate && import.meta.env.DEV) && (!manifest.approved || manifest.runtimeUse !== 'production')) throw new Error(`${id}: not approved for production`);
  const want = (await p()).files[`art-lab/characters/exports/${id}.png`];
  if (!want) throw new Error(`${id}: its export is not in its provenance pack`);
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer()), meta = await j();
  return { seat, id, png: bytes, json: meta, sha256: want, runtimeUse: manifest.runtimeUse, ...(o.look ? await lookOf(o.look, bytes, meta, !!o.candidate) : await skinOf(id, bytes, meta)) };
}

/** a townsperson's look and weapon on their template (journal Passe PN1, NpcLook): the frames recoloured by name, the weapon drawn, before the painted rim */
async function lookOf(look: NpcLookSpec, bytes: Uint8Array, meta: unknown, candidate: boolean): Promise<Pick<SheetSource, 'recolor'>> {
  const { fw, fh, frames } = namedFrames(await decodePng(bytes), meta, true), tone = npcSheetLook(look, frames, fw, fh, candidate && import.meta.env.DEV ? 'candidate' : 'approved');
  if (!tone) return {};
  const at = new Map(frames.map((f, n) => [f.name, n]));
  return { recolor: (frame, rgba) => { const n = at.get(frame); return n === undefined ? rgba : tone(n, rgba); } };
}

/** a generic fighter's skin variant on its combat sheet (journal Passe GS1, FighterSkinCast): the frames recoloured by name before the painted rim; nothing for any other sheet */
async function skinOf(id: string, bytes: Uint8Array, meta: unknown): Promise<Pick<SheetSource, 'recolor'>> {
  if (!/-x3-combat$/.test(id)) return {};
  // Ren's look (journal Passe PR3, HeroLookCast: the approved look, or DEV's `herolook` review); a generic fighter's skin otherwise
  const { fw, fh, frames } = namedFrames(await decodePng(bytes), meta, true), skin = id.startsWith('hero-') ? heroSheetLook(id, frames, fw, fh) : sheetSkin(id, frames, fw, fh);
  if (!skin) return {};
  const at = new Map(frames.map((f, n) => [f.name, n]));
  return { recolor: (frame, rgba) => { const n = at.get(frame); return n === undefined ? rgba : skin(n, rgba); } };
}

/** the face the HUD shows for a townsperson's fighter (journal Passe CH-PNJ, the operator's « le portrait du combattant ne semble pas etre le bon pour les combattants representant des pnjs »):
 *  the head and shoulders of the fighter's own idle frame on the template, in their look (the one on the sand), not another person's generated face (white hair for Mara) nor the master's town
 *  face (Master Corvin's, for his champion). The head is found on the template's own frame (the first opaque row: a weapon raised over the head does not move it), the window is read from the
 *  recoloured frame, one pixel in three (the combat sheets are at x3: 24 texels, a head and its shoulders, the size of a generated face, so the HUD draws it three times as large), and mirrored: the sheet faces left, the HUD mirrors the
 *  right card's face again, which then looks to the centre as the rivals' do. No new image: pixels of the approved template. */
export async function npcFace(src: SheetSource): Promise<HTMLCanvasElement | null> {
  const { fw, fh, frames } = namedFrames(await decodePng(src.png), src.json, true), n = frames.findIndex((f) => f.name === 'idle.0');
  if (n < 0) return null;
  const raw = frames[n].rgba, shown = src.recolor ? src.recolor('idle.0', raw) : raw, S = 72, opaque = (x: number, y: number) => raw[(y * fw + x) * 4 + 3] > 0;
  let top = 0;
  while (top < fh && ![...Array(fw).keys()].some((x) => opaque(x, top))) top++;
  let x0 = fw, x1 = -1;
  for (let y = top; y < Math.min(fh, top + 36); y++) for (let x = 0; x < fw; x++) if (opaque(x, y)) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); }
  const cx = x1 >= x0 ? (x0 + x1 + 1) / 2 : fw / 2, ox = Math.max(0, Math.min(fw - S, Math.round(cx - S / 2))), oy = Math.max(0, Math.min(fh - S, top - 6));
  const c = document.createElement('canvas'); c.width = c.height = S / 3;
  const img = new ImageData(S / 3, S / 3);
  for (let y = 0; y < S / 3; y++) for (let x = 0; x < S / 3; x++) {
    const s = ((oy + 3 * y + 1) * fw + ox + 3 * x + 1) * 4, d = (y * (S / 3) + (S / 3 - 1 - x)) * 4;
    for (let j = 0; j < 4; j++) img.data[d + j] = shown[s + j];
  }
  c.getContext('2d')!.putImageData(img, 0, 0);
  return c;
}

/** a duel's sheets: Ren's, and the rival's when it has one */
export async function installCombatCast(set: ArenaSpriteSet, foe: string, params: URLSearchParams): Promise<InstalledSheets> {
  // a townsperson fights on a template in their look (NPC_FIGHTERS); DEV's `cast=candidate` the templates before the operator's approval
  const npc = NPC_FIGHTERS[foe], candidate = import.meta.env.DEV && params.get('cast') === 'candidate';
  const ren = await source('ren', 'hero-x3-combat'), rival = npc ? await source('marek', npcSheetId(npc.look.template), { look: npc.look, candidate }) : await source('marek', `${foe}-x3-combat`);
  if (!ren) throw new Error('hero-x3-combat: no such sheet');
  const time = params.get('time');
  const on = await installSheets(set, rival ? [ren, rival] : [ren], edgeFor(time), { pose: () => null, shade: shadeFor(time) });
  await bakedFaces(set, foe);
  // a townsperson's fighter shows their own face on the card (the sprite on the sand), the town sheet's face belongs to the person they stand for
  if (npc && rival) { const face = await npcFace(rival); if (face) set.portraits.marek = face; }
  return on;
}
