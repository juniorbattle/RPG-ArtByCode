/** The casting's sheets in production (journal Passes CA1 / CA3): the people of the version 2's squares and their faces, each approved one by one on the
 *  operator's lot sheet. Loaded only by the squares and by a version 2 game's portraits (decision C2 « Version 2 seule, quartier inchangé »): today's game and
 *  the district's atlas never see them. Each sheet stands for the provisional sprite of its person (`prov-<person>`, PlazaApp); Rhosk has no place in town
 *  (« Portrait seulement », R-ville): his sheet gives his face and enters no square's atlas. */
import { castEntries, type CastEntry } from './BakedCast';

const png = import.meta.glob('../../art-lab/characters/exports/{anwen,cassius,hilde,ilse,lio,orla,rhosk,vessa}-x2-v1.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const json = import.meta.glob('../../art-lab/characters/exports/{anwen,cassius,hilde,ilse,lio,orla,rhosk,vessa}-x2-v1.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const man = import.meta.glob('../../art-lab/characters/manifests/{anwen,cassius,hilde,ilse,lio,orla,rhosk,vessa}-x2-v1.manifest.json', { eager: true, import: 'default' }) as Record<string, { id: string; status: string; approved: boolean; runtimeUse: string }>;
const pack = import.meta.glob('../../art-lab/characters/provenance/{anwen,cassius,hilde,ilse,lio,orla,rhosk,vessa}-x2-v1/PROVENANCE.json', { eager: true, import: 'default' }) as Record<string, { files: Record<string, string> }>;

/** the people with an approved sheet; Orla walks in a cutscene (T1 « Debout, sauf Marek et Orla »), the others stand */
export const PLAZA_PEOPLE = ['anwen', 'cassius', 'hilde', 'ilse', 'lio', 'orla', 'rhosk', 'vessa'] as const;
const WALKS = new Set<string>(['orla']), FACE_ONLY = new Set<string>(['rhosk']);

const pick = <T>(t: Record<string, T>, id: string): T => { const k = Object.keys(t).find((p) => p.includes(`/${id}.`) || p.includes(`/${id}/`)); if (!k) throw new Error(`no ${id}`); return t[k]; };
const entry = (who: string): CastEntry => { const id = `${who}-x2-v1`; return { manifest: pick(man, id), png: pick(png, id), json: pick(json, id), files: pick(pack, id).files, replaces: [`prov-${who}`], scale: 0.9, ...(WALKS.has(who) ? {} : { still: true }) }; };

/** what a square's cast loads: the production cast, then its people. Mara and Bram stand on no square: their sheets stay out (journal Passe CA2, the texture's budget) */
export function plazaCastEntries(): CastEntry[] {
  return [...castEntries(false).filter((e) => !['merchant-x2-v2', 'blacksmith-x2-v1'].includes(e.manifest.id)), ...PLAZA_PEOPLE.filter((w) => !FACE_ONLY.has(w)).map(entry)];
}
/** the approved faces, by person (the interface's portraits in a version 2 game) */
export function plazaFaces(): Record<string, { id: string; png: string; json: unknown; sha256: string }> {
  return Object.fromEntries(castEntries(false, PLAZA_PEOPLE.map(entry)).map((e) => [e.manifest.id.replace('-x2-v1', ''), { id: e.manifest.id, png: e.png, json: e.json, sha256: e.files[`art-lab/characters/exports/${e.manifest.id}.png`] }]));
}
