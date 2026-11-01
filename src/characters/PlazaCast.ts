/** The casting's sheets in production (journal Passes CA1 to CA5): the people of the version 2's squares and their faces, each approved one by one on the operator's
 *  lot sheet. Loaded only by the squares and by a version 2 game's portraits (decision C2 « Version 2 seule, quartier inchangé »): today's game and the district's
 *  atlas never see them. Each sheet stands for its person on a square (`person-<id>`, PlazaApp); Rhosk and Tobin have no place in town (« Portrait seulement »,
 *  R-ville): their sheets give their faces and enter no square's atlas. */
import { castEntries, type CastEntry } from './BakedCast';

const png = import.meta.glob('../../art-lab/characters/exports/{anwen,brann,cassius,corvin,hilde,ilse,lio,marek,odo,orla,pip,rhosk,tobin,vessa,wren}-x2-v2.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const json = import.meta.glob('../../art-lab/characters/exports/{anwen,brann,cassius,corvin,hilde,ilse,lio,marek,odo,orla,pip,rhosk,tobin,vessa,wren}-x2-v2.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const man = import.meta.glob('../../art-lab/characters/manifests/{anwen,brann,cassius,corvin,hilde,ilse,lio,marek,odo,orla,pip,rhosk,tobin,vessa,wren}-x2-v2.manifest.json', { eager: true, import: 'default' }) as Record<string, { id: string; status: string; approved: boolean; runtimeUse: string }>;
const pack = import.meta.glob('../../art-lab/characters/provenance/{anwen,brann,cassius,corvin,hilde,ilse,lio,marek,odo,orla,pip,rhosk,tobin,vessa,wren}-x2-v2/PROVENANCE.json', { eager: true, import: 'default' }) as Record<string, { files: Record<string, string> }>;

/** the people with a sheet; Marek and Orla walk in a cutscene (T1 « Debout, sauf Marek et Orla »), the others stand */
export const PLAZA_PEOPLE = ['anwen', 'bard', 'cassius', 'corvin', 'drill', 'hilde', 'ilse', 'lio', 'marek', 'odo', 'orla', 'pip', 'rhosk', 'tobin', 'vessa'] as const;
const SHEET: Record<string, string> = { drill: 'brann', bard: 'wren' };
const WALKS = new Set<string>(['marek', 'orla']), FACE_ONLY = new Set<string>(['rhosk', 'tobin']);

const sheetOf = (who: string) => `${SHEET[who] ?? who}-x2-v2`;
const pick = <T>(t: Record<string, T>, id: string): T => { const k = Object.keys(t).find((p) => p.includes(`/${id}.`) || p.includes(`/${id}/`)); if (!k) throw new Error(`no ${id}`); return t[k]; };
const entry = (who: string): CastEntry => { const id = sheetOf(who); return { manifest: pick(man, id), png: pick(png, id), json: pick(json, id), files: pick(pack, id).files, replaces: [`person-${who}`], scale: 0.9, ...(WALKS.has(who) ? {} : { still: true }) }; };

/** what a square's cast loads: the production cast, then its people. Mara and Bram stand on no square: their sheets stay out (journal Passe CA2, the texture's budget) */
export function plazaCastEntries(): CastEntry[] {
  return [...castEntries(false).filter((e) => !['merchant-x2-v2', 'blacksmith-x2-v1'].includes(e.manifest.id)), ...PLAZA_PEOPLE.filter((w) => !FACE_ONLY.has(w)).map(entry)];
}
/** the approved faces, by person (the interface's portraits in a version 2 game) */
export function plazaFaces(): Record<string, { id: string; png: string; json: unknown; sha256: string }> {
  return Object.fromEntries(PLAZA_PEOPLE.map((who) => { const e = castEntries(false, [entry(who)])[0], id = e.manifest.id; return [who, { id, png: e.png, json: e.json, sha256: e.files[`art-lab/characters/exports/${id}.png`] }]; }));
}
