import type { ArenaSpriteSet } from './FighterArt';
import { bakedFaces, edgeFor, installSheets, shadeFor, type InstalledSheets, type Seat, type SheetSource } from './CombatSheets';
import { decodePng } from '../characters/BakedDecode';
import { namedFrames } from '../characters/FighterSkins';
import { sheetSkin } from '../characters/FighterSkinCast';

/** The combat sheets in production (journal Passes CX1 to CX4: each approved on the operator's lot sheets, Ren and Marek together as RC2-5 asked): Ren's and the seven rivals', and since
 *  journal Passe GA2 the three generic fighters' (Ser Aldric Venn, Corra Dunmere, Brother Ambrose: « Production », GA-S1 « Les six ensemble »), since journal Passe GA4 three more (Lucan Rook,
 *  Piers Calloway, Kell Barrow: « Production », GA3-S1 « Les six ensemble »), each on its borrowed rival's clips, loaded by
 *  a duel under the version 2's rules only (`flags.v2`, `?scene=arena&v2=1`), on demand: today's game never reaches this module. A rival without an approved sheet keeps its generated
 *  fighter (none today). `cast=generated` keeps the generated fighters, for comparison. */
const png = import.meta.glob('../../art-lab/characters/exports/{hero,marek,vessa,orla,cassius,ilse,rhosk,tobin,aldric,corra,ambrose,lucan,piers,kell}-x3-combat.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const json = import.meta.glob('../../art-lab/characters/exports/{hero,marek,vessa,orla,cassius,ilse,rhosk,tobin,aldric,corra,ambrose,lucan,piers,kell}-x3-combat.json', { import: 'default' }) as Record<string, () => Promise<unknown>>;
const man = import.meta.glob('../../art-lab/characters/manifests/{hero,marek,vessa,orla,cassius,ilse,rhosk,tobin,aldric,corra,ambrose,lucan,piers,kell}-x3-combat.manifest.json', { import: 'default' }) as Record<string, () => Promise<{ id: string; approved: boolean; runtimeUse: string }>>;
const pack = import.meta.glob('../../art-lab/characters/provenance/{hero,marek,vessa,orla,cassius,ilse,rhosk,tobin,aldric,corra,ambrose,lucan,piers,kell}-x3-combat/PROVENANCE.json', { import: 'default' }) as Record<string, () => Promise<{ files: Record<string, string> }>>;

const pick = <T>(t: Record<string, T>, id: string): T | null => { const k = Object.keys(t).find((p) => p.includes(`/${id}.`) || p.includes(`/${id}/`)); return k ? t[k] : null; };

async function source(seat: Seat, id: string): Promise<SheetSource | null> {
  const url = pick(png, id), m = pick(man, id), p = pick(pack, id), j = pick(json, id);
  if (!url || !m || !p || !j) return null;
  const manifest = await m();
  if (!manifest.approved || manifest.runtimeUse !== 'production') throw new Error(`${id}: not approved for production`);
  const want = (await p()).files[`art-lab/characters/exports/${id}.png`];
  if (!want) throw new Error(`${id}: its export is not in its provenance pack`);
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer()), meta = await j();
  return { seat, id, png: bytes, json: meta, sha256: want, runtimeUse: manifest.runtimeUse, ...(await skinOf(id, bytes, meta)) };
}

/** a generic fighter's skin variant on its combat sheet (journal Passe GS1, FighterSkinCast): the frames recoloured by name before the painted rim; nothing for any other sheet */
async function skinOf(id: string, bytes: Uint8Array, meta: unknown): Promise<Pick<SheetSource, 'recolor'>> {
  if (!/-x3-combat$/.test(id) || id.startsWith('hero-')) return {};
  const { fw, fh, frames } = namedFrames(await decodePng(bytes), meta, true), skin = sheetSkin(id, frames, fw, fh);
  if (!skin) return {};
  const at = new Map(frames.map((f, n) => [f.name, n]));
  return { recolor: (frame, rgba) => { const n = at.get(frame); return n === undefined ? rgba : skin(n, rgba); } };
}

/** a duel's sheets: Ren's, and the rival's when it has one */
export async function installCombatCast(set: ArenaSpriteSet, foe: string, params: URLSearchParams): Promise<InstalledSheets> {
  const ren = await source('ren', 'hero-x3-combat'), rival = await source('marek', `${foe}-x3-combat`);
  if (!ren) throw new Error('hero-x3-combat: no such sheet');
  const time = params.get('time');
  const on = await installSheets(set, rival ? [ren, rival] : [ren], edgeFor(time), { pose: () => null, shade: shadeFor(time) });
  await bakedFaces(set, foe);
  return on;
}
