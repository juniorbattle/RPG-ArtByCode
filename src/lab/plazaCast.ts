/** DEV-ONLY: the casting's sheets still waiting, on the version 2's squares (journal Passes CA1 / CA2), behind `cast=candidate`. Reached only through a
 *  dynamic import guarded by `import.meta.env.DEV`: production builds compile it out, every page without the parameter is untouched, and nothing
 *  becomes canonical: a manifest stays `candidate` until the operator's lot sheet moves its entry into the production cast. Each sheet stands for the
 *  provisional sprite of its person (`prov-<person>`, PlazaApp), the rivals' portraits follow; Tobin has no place in town (« Portrait
 *  seulement », R-ville): his sheet gives his face only. */
import type { CastEntry } from '../characters/BakedCast';

const png = import.meta.glob('../../art-lab/characters/exports/{odo,corvin,brann,wren,pip,tobin,marek}-x2-v1.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const json = import.meta.glob('../../art-lab/characters/exports/{odo,corvin,brann,wren,pip,tobin,marek}-x2-v1.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const man = import.meta.glob('../../art-lab/characters/manifests/{odo,corvin,brann,wren,pip,tobin,marek}-x2-v1.manifest.json', { eager: true, import: 'default' }) as Record<string, { id: string; status: string; approved: boolean; runtimeUse: string }>;
const pack = import.meta.glob('../../art-lab/characters/provenance/{odo,corvin,brann,wren,pip,tobin,marek}-x2-v1/PROVENANCE.json', { eager: true, import: 'default' }) as Record<string, { files: Record<string, string> }>;

/** the people whose sheet still waits for the lot sheet (the eight approved live in src/characters/PlazaCast.ts); Marek walks in a cutscene, the others stand */
export const CANDIDATE_PEOPLE = ['odo', 'corvin', 'drill', 'pip', 'bard', 'tobin', 'marek'] as const;
const SHEET: Record<string, string> = { drill: 'brann', bard: 'wren' };
const WALKS = new Set(['marek']);

const sheetOf = (who: string) => `${SHEET[who] ?? who}-x2-v1`;
const at = <T>(t: Record<string, T>, id: string): T => { const k = Object.keys(t).find((p) => p.includes(`/${id}.`) || p.includes(`/${id}/`)); if (!k) throw new Error(`no ${id}`); return t[k]; };

/** the entries the cast's gate reads, the production cast's first */
export function plazaEntries(production: readonly CastEntry[]): CastEntry[] {
  const out: CastEntry[] = CANDIDATE_PEOPLE.map((who) => { const id = sheetOf(who); return { manifest: at(man, id), png: at(png, id), json: at(json, id), files: at(pack, id).files, replaces: [`prov-${who}`], scale: 0.9, ...(WALKS.has(who) ? {} : { still: true }) }; });
  return [...production, ...out];
}
/** the faces of the candidate sheets, by person (the interface's portraits) */
export function plazaPortraits(): Record<string, { id: string; png: string; json: unknown; sha256: string }> {
  return Object.fromEntries(CANDIDATE_PEOPLE.map((who) => { const id = sheetOf(who); return [who, { id, png: at(png, id), json: at(json, id), sha256: at(pack, id).files[`art-lab/characters/exports/${id}.png`] }]; }));
}
