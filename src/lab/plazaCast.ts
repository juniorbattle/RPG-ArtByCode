/** DEV-ONLY: the casting's five citizens still waiting, on the version 2's squares (journal Passe CA6), behind `cast=candidate`. Reached only through a dynamic import guarded
 *  by `import.meta.env.DEV`: production builds compile it out, and nothing becomes canonical: a manifest stays `candidate` until the operator's lot sheet moves its entry into the
 *  production cast. Each sheet stands for a walker of the crowd (`citizen-<id>`, PlazaApp's CROWD_TURN). */
import type { CastEntry } from '../characters/BakedCast';

const png = import.meta.glob('../../art-lab/characters/exports/{vendor,wayfarer,noble,errand-boy,girl}-x2-v1.png', { eager: true, query: '?url', import: 'default' }) as Record<string, string>;
const json = import.meta.glob('../../art-lab/characters/exports/{vendor,wayfarer,noble,errand-boy,girl}-x2-v1.json', { eager: true, import: 'default' }) as Record<string, unknown>;
const man = import.meta.glob('../../art-lab/characters/manifests/{vendor,wayfarer,noble,errand-boy,girl}-x2-v1.manifest.json', { eager: true, import: 'default' }) as Record<string, { id: string; status: string; approved: boolean; runtimeUse: string }>;
const pack = import.meta.glob('../../art-lab/characters/provenance/{vendor,wayfarer,noble,errand-boy,girl}-x2-v1/PROVENANCE.json', { eager: true, import: 'default' }) as Record<string, { files: Record<string, string> }>;

const at = <T>(t: Record<string, T>, id: string): T => { const k = Object.keys(t).find((p) => p.includes(`/${id}.`) || p.includes(`/${id}/`)); if (!k) throw new Error(`no ${id}`); return t[k]; };

/** the entries the cast's gate reads */
export function citizenEntries(): CastEntry[] {
  return ['vendor', 'wayfarer', 'noble', 'errand-boy', 'girl'].map((who) => { const id = `${who}-x2-v1`; return { manifest: at(man, id), png: at(png, id), json: at(json, id), files: at(pack, id).files, replaces: [`citizen-${who}`], scale: 0.9 }; });
}
