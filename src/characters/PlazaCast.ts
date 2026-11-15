/** The casting's sheets in production (journal Passes CA1 to CA7): the people of the version 2's squares, their faces and the crowd's five citizens, each approved one by one on the operator's
 *  lot sheet. Loaded only by the squares and by a version 2 game's portraits (decision C2 « Version 2 seule, quartier inchangé »): today's game and the district's
 *  atlas never see them. Each sheet stands for its person on a square (`person-<id>`, PlazaApp); Rhosk and Tobin have no place in town (« Portrait seulement »,
 *  R-ville): their sheets give their faces and enter no square's atlas. */
import { castEntries, type CastEntry } from './BakedCast';
import type { BakedFrame } from './BakedSprites';
import { namedTown, sheetSkin, toneTownSheet } from './FighterSkinCast';

const png = import.meta.glob(['../../art-lab/characters/exports/{anwen,brann,cassius,corvin,hilde,ilse,lio,marek,odo,orla,pip,rhosk,tobin,vessa,wren}-x2-v2.png', '../../art-lab/characters/exports/{vendor,wayfarer,noble,errand-boy,girl}-x2-v1.png', '../../art-lab/characters/exports/{aldric,corra,ambrose,lucan,piers,kell}-x2-v1.png'], { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const json = import.meta.glob(['../../art-lab/characters/exports/{anwen,brann,cassius,corvin,hilde,ilse,lio,marek,odo,orla,pip,rhosk,tobin,vessa,wren}-x2-v2.json', '../../art-lab/characters/exports/{vendor,wayfarer,noble,errand-boy,girl}-x2-v1.json', '../../art-lab/characters/exports/{aldric,corra,ambrose,lucan,piers,kell}-x2-v1.json'], { eager: true, import: 'default' }) as Record<string, unknown>;
const man = import.meta.glob(['../../art-lab/characters/manifests/{anwen,brann,cassius,corvin,hilde,ilse,lio,marek,odo,orla,pip,rhosk,tobin,vessa,wren}-x2-v2.manifest.json', '../../art-lab/characters/manifests/{vendor,wayfarer,noble,errand-boy,girl}-x2-v1.manifest.json', '../../art-lab/characters/manifests/{aldric,corra,ambrose,lucan,piers,kell}-x2-v1.manifest.json'], { eager: true, import: 'default' }) as Record<string, { id: string; status: string; approved: boolean; runtimeUse: string }>;
const pack = import.meta.glob(['../../art-lab/characters/provenance/{anwen,brann,cassius,corvin,hilde,ilse,lio,marek,odo,orla,pip,rhosk,tobin,vessa,wren}-x2-v2/PROVENANCE.json', '../../art-lab/characters/provenance/{vendor,wayfarer,noble,errand-boy,girl}-x2-v1/PROVENANCE.json', '../../art-lab/characters/provenance/{aldric,corra,ambrose,lucan,piers,kell}-x2-v1/PROVENANCE.json'], { eager: true, import: 'default' }) as Record<string, { files: Record<string, string> }>;

/** the people with a sheet; Marek and Orla walk in a cutscene (T1 « Debout, sauf Marek et Orla »), the others stand */
export const PLAZA_PEOPLE = ['anwen', 'bard', 'cassius', 'corvin', 'drill', 'hilde', 'ilse', 'lio', 'marek', 'odo', 'orla', 'pip', 'rhosk', 'tobin', 'vessa'] as const;
const SHEET: Record<string, string> = { drill: 'brann', bard: 'wren' };
const WALKS = new Set<string>(['marek', 'orla']), FACE_ONLY = new Set<string>(['rhosk', 'tobin']);

const sheetOf = (who: string) => `${SHEET[who] ?? who}-x2-v2`;
const pick = <T>(t: Record<string, T>, id: string): T => { const k = Object.keys(t).find((p) => p.includes(`/${id}.`) || p.includes(`/${id}/`)); if (!k) throw new Error(`no ${id}`); return t[k]; };
/** the crowd's five citizens, each a walker in its turn (`citizen-<id>`, PlazaApp's CROWD_TURN) */
const CITIZENS = ['vendor', 'wayfarer', 'noble', 'errand-boy', 'girl'];
const citizen = (who: string): CastEntry => { const id = `${who}-x2-v1`; return { manifest: pick(man, id), png: pick(png, id), json: pick(json, id), files: pick(pack, id).files, replaces: [`citizen-${who}`], scale: 0.9 }; };
/** a person's sheet on a square; `tone`: a rival's skin variant (journal Passe RS1, FighterSkinCast: an approved variant, or the DEV review's; nothing for anyone else) */
const entry = (who: string): CastEntry => { const id = sheetOf(who); return { manifest: pick(man, id), png: pick(png, id), json: pick(json, id), files: pick(pack, id).files, replaces: [`person-${who}`], scale: 0.9, tone: (frames, fw, fh) => { toneTownSheet(id, frames, fw, fh); }, ...(WALKS.has(who) ? {} : { still: true }) }; };

/** the version 2's generic fighters (src/narrative/generics.ts): their approved town sheets give their faces (journal Passes GA2, GA4) and, since the operator's GP-05 « Debout à
 *  leur place et à leur heure (production de leurs feuilles de ville sur les places) » (journal Passes GP2 / PN1), stand them at their place and hour, under their approved skin
 *  (FighterSkinCast): Ser Aldric Venn on the lists, Lucan Rook on the forecourt, Brother Ambrose and Kell Barrow on the hall's square, Corra Dunmere and Piers Calloway on the quay */
export const GENERIC_FACES = ['aldric', 'corra', 'ambrose', 'lucan', 'piers', 'kell'] as const;
/** the generic fighters who stand on the quay (the town page's cast in a version 2 game: src/ui/playTown.ts gives them to src/app/App.ts, `extraCast`) */
export const QUAY_GENERICS = ['corra', 'piers'] as const;
const generic = (who: string): CastEntry => { const id = `${who}-x2-v1`; return { manifest: pick(man, id), png: pick(png, id), json: pick(json, id), files: pick(pack, id).files, replaces: [`person-${who}`], scale: 0.9, still: true, tone: (frames, fw, fh) => { toneTownSheet(id, frames, fw, fh); } }; };
/** the quay's generic fighters as cast entries of the town page (GP-05) */
export const quayGenericEntries = (): CastEntry[] => QUAY_GENERICS.map(generic);

/** what a square's cast loads: the production cast, then its people and its citizens. Mara and Bram stand on no square: their sheets stay out (journal Passe CA2, the texture's budget) */
export function plazaCastEntries(people?: readonly string[]): CastEntry[] {
  // the generic fighters standing on a square (GP-05, journal Passe PN1): only those the page shows (`people`, the square's at this moment), the sprite atlas holding two columns
  // of 1024 x 2048 at most (four more sheets on every square overflowed it on the training ground)
  const standing = GENERIC_FACES.filter((w) => !(QUAY_GENERICS as readonly string[]).includes(w) && (!people || people.includes(w)));
  return [...castEntries(false).filter((e) => !['merchant-x2-v2', 'blacksmith-x2-v1'].includes(e.manifest.id)), ...PLAZA_PEOPLE.filter((w) => !FACE_ONLY.has(w)).map(entry), ...CITIZENS.map(citizen), ...standing.map(generic)];
}
/** a portrait's source; `face`: the front idle frame as the person shows it (a fighter's skin variant, journal Passes GS1 / RS1), null = the sheet's own */
export interface FaceSource { id: string; png: string; json: unknown; sha256: string; face?: (frames: readonly BakedFrame[], fw: number, fh: number) => Uint8Array | null }
/** a fighter's front idle frame under its skin variant (a generic fighter's or a rival's; FighterSkinCast: an approved variant, or the DEV review's), or null */
export function fighterFace(sheetId: string, frames: readonly BakedFrame[], fw: number, fh: number): Uint8Array | null {
  const named = namedTown(frames), n = named.findIndex((f) => f.name === 'down/idle.0');
  const skin = n < 0 ? null : sheetSkin(sheetId, named, fw, fh);
  return skin ? skin(n, named[n].rgba) : null;
}
/** the approved faces, by person (the interface's portraits in a version 2 game) */
export function plazaFaces(): Record<string, FaceSource> {
  const face = (e: CastEntry) => { const id = e.manifest.id; return { id, png: e.png, json: e.json, sha256: e.files[`art-lab/characters/exports/${id}.png`] }; };
  // the passers-by (lot L2a, journal Passe EVL2): the faces of the sheets they stand as, a citizen of a square or a townsperson of the quay
  const older = castEntries(false).find((e) => e.manifest.id === 'older-merchant-x2-v1');
  const crowd = (id: string) => castEntries(false).find((e) => e.manifest.id === id);
  // (the seven more of GP-06, journal Passe PN1: a townsperson of the crowd or a citizen of the squares, the sheet they stand as)
  const passers: Array<[string, CastEntry | undefined]> = [['edda', castEntries(false, [citizen('noble')])[0]], ['sela', castEntries(false, [citizen('wayfarer')])[0]], ['fenwick', older],
    ['nell', crowd('townswoman-x2-v1')], ['jory', crowd('courier-x2-v1')], ['yselle', castEntries(false, [citizen('wayfarer')])[0]], ['garrick', older], ['maud', crowd('artisan-x2-v1')], ['dov', crowd('traveler-x2-v1')], ['hettie', crowd('townswoman-x2-v1')]];
  const toned = (f: FaceSource): FaceSource => ({ ...f, face: (frames: readonly BakedFrame[], fw: number, fh: number) => fighterFace(f.id, frames, fw, fh) });
  return Object.fromEntries([...PLAZA_PEOPLE.map((who) => [who, toned(face(castEntries(false, [entry(who)])[0]))]), ...GENERIC_FACES.map((who) => [who, toned(face(castEntries(false, [generic(who)])[0]))]), ...passers.filter(([, e]) => !!e).map(([who, e]) => [who, face(e!)])]);
}
