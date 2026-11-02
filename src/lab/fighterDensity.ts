/** DEV-ONLY: the combat sheets in the duel before their approval (journal Passe RC1; before it, the density trial of journal Passe AA2, whose sheets and values
 *  x2 / x3 / x4 were removed by the operator's decision RC1-4 « Les retirer, garder fighterdensity=combat »; the rivals' sheets since journal Passe CX1). A sheet is judged in the
 *  scene where it will live. Reached only through a dynamic import that `ArenaApp` guards with `import.meta.env.DEV`: production builds compile it
 *  out, and the arena without the parameter is untouched. Nothing becomes canonical: the sheets join the arena's atlas for this page load (src/arena/CombatSheets.ts).
 *    ?scene=arena&fighterdensity=combat  hero-x3-combat, Ren's COMBAT sheet at x3 (manifest `lab`), and the sheet of whoever sits in the opponent's seat when it has one
 *                                        (`<foe>-x3-combat`, DEV `foe=<id>` on the arena's page): cells of the arena (192 x 288 texels, feet on row 270), their frames on the seats'
 *                                        own keys (`ren/side/<clip>.<i>/0`, `marek/side/...`), so the duel plays them on its moments (sheetFrame: today's techniques and the
 *                                        offensive skills play `skillOff`, Rampart `skillDef`, Fervour `skillSup`), the knockout its three frames (fall, knee, ground) on its own
 *                                        clock
 *    &fighteredge=dark|rim|painted       the sheets' edge; absent = the operator's decision RC1-2 « Liseré peint la nuit, contour noir de
 *                                        jour »: painted at night (a one-texel cool rim painted into the texels on the sides the backlight
 *                                        catches, FighterArt's rimLight, the generated fighters' treatment, with the shader's crown rim), the
 *                                        town's dark outline by day (`time=`); rim = the shader's crown rim alone
 *    &fighterpose=<clip>.<i>             holds one frame of Ren's sheet through the duel
 *    &fightershade=<k>                   the sheets' shade in the arena's light; absent = the operator's (CX-L1 « 0,65 », CX-L2 « 1,3 »)
 *  Today the sheets are in production (src/arena/CombatCast.ts, a version 2 duel): this module shows them on any rules.
 *  Both fighters keep the hero's town presentation scale (0.9, BakedCast). `window.__density` reports the sheets,
 *  the atlas cost, `measure()` (the on-screen size of a texel) and `setPose()`. */
import type * as THREE from 'three';
import { type Actor, type SpriteRenderer } from '../characters/SpriteRenderer';
import type { ArenaSpriteSet } from '../arena/FighterArt';
import { CELL_W, CELL_H } from '../arena/FighterArt';
import type { Anim } from '../characters/SpriteGenerator';
import { bakedFaces, COMBAT as SHEETS, edgeFor, installSheets, koFrame, paintRim, shadeFor, sheetFrame, SKILL_FRAMES, texelPixels, type InstalledSheets, type Seat, type SheetSource } from '../arena/CombatSheets';

export { edgeFor, koFrame, paintRim, sheetFrame, SKILL_FRAMES };

export interface DensityTrial extends Omit<InstalledSheets, 'attach'> {
  id: string;
  /** the renderer the arena built (its edge mode for the sheets), and the on-screen measure */
  attach(sprites: SpriteRenderer, camera: THREE.Camera, renderWidth: () => number): void;
}

export async function installFighterDensity(set: ArenaSpriteSet, params: URLSearchParams, foe = 'marek'): Promise<DensityTrial> {
  const d = params.get('fighterdensity') ?? '';
  if (d !== COMBAT.param) throw new Error(`fighterdensity "${d}": combat`);
  return installCombat(set, params, foe);
}

/* ------------------------------------------------------------------ the combat sheets (journal Passes RC1, CX1) */

/** Ren's combat sheet, a rival's by its name, and how the duel reads them */
export const COMBAT = { param: 'combat', id: 'hero-x3-combat', foe: (who: string) => `${who}-x3-combat`, ...SHEETS };
const LAB = '/art-lab/characters';
async function json(url: string): Promise<any> {
  const r = await fetch(url);
  // the dev server answers a missing file with the app's index.html (200): a non-JSON answer means "no such file"
  if (!r.ok || !(r.headers.get('content-type') ?? '').includes('json')) throw new Error(`cannot load ${url}: no such file`);
  return r.json();
}
async function sheet(seat: Seat, id: string): Promise<SheetSource> {
  const man = await json(`${LAB}/manifests/${id}.manifest.json`), prov = await json(`${LAB}/provenance/${id}/PROVENANCE.json`);
  if (man.runtimeUse !== 'lab' && man.runtimeUse !== 'production') throw new Error(`${id}: manifest runtimeUse "${man.runtimeUse}" does not allow runtime use`);
  const want = prov.files?.[`art-lab/characters/exports/${id}.png`];
  if (!want) throw new Error(`${id}: its export is not in its provenance pack`);
  return { seat, id, png: new Uint8Array(await (await fetch(`${LAB}/exports/${id}.png`)).arrayBuffer()), json: await json(`${LAB}/exports/${id}.json`), sha256: want, runtimeUse: man.runtimeUse };
}

async function installCombat(set: ArenaSpriteSet, params: URLSearchParams, foe: string): Promise<DensityTrial> {
  const edge = params.get('fighteredge') ?? edgeFor(params.get('time'));
  if (edge !== 'dark' && edge !== 'rim' && edge !== 'painted') throw new Error(`fighteredge "${edge}": dark | rim | painted`);
  const list = [await sheet('ren', COMBAT.id)];
  // the opponent's seat takes its sheet when it has one (today's generated fighter otherwise)
  const rival = await sheet('marek', COMBAT.foe(foe)).catch(() => null);
  if (rival) { list.push(rival); await bakedFaces(set, foe); }
  // &fighterpose=<clip>.<i>: one frame of Ren's sheet held through the duel (the sheet's frames side by side in the scene); absent = the duel's
  let pose = params.get('fighterpose');
  const on = await installSheets(set, list, edge, { pose: () => pose, shade: Number(params.get('fightershade') ?? shadeFor(params.get('time'))) });
  const check = (p: string) => { if (!set.atlas.frames.has(`ren/side/${p}/0`)) throw new Error(`fighterpose "${p}": ${COMBAT.id} has ${Object.entries(on.info.counts.ren).map(([c, n]) => `${c}.0-${n - 1}`).join(', ')}`); return p; };
  if (pose !== null) check(pose);
  let camera: THREE.Camera | null = null, sprites: SpriteRenderer | null = null, renderWidth: () => number = () => 0, ren: Actor | null = null;
  const k = set.atlas.baked.get(COMBAT.id)!.k, cw = CELL_W * k, ch = CELL_H * k;
  const info: Record<string, unknown> = { ...on.info, id: COMBAT.id, k, scale: 0.9, renamed: COMBAT.renamed, pose, cell: [cw, ch], bytesPerCell: on.info.bytes / on.info.cells };
  Object.defineProperty(info, 'measure', {
    enumerable: false,
    /** device pixels of one texel across Ren's quad, and the frame shown */
    value: () => (camera && sprites && ren ? { ...texelPixels(ren, sprites, camera, renderWidth(), cw), k, scale: ren.scale, charScale: sprites.charScale, anim: ren.anim } : null),
  });
  /** captures: hold another frame (null = the duel's own) without reloading the page */
  Object.defineProperty(info, 'setPose', { enumerable: false, value: (p: string | null) => { pose = p === null ? null : check(p); info.pose = pose; if (ren && pose) ren.anim = pose as Anim; } });
  (window as Window & { __density?: unknown }).__density = info;
  return {
    ...on, id: COMBAT.id,
    attach(s, cam, width) { on.attach(s); sprites = s; camera = cam; renderWidth = width; },
    present(fighters, time, sim, charge) { ren = fighters.ren; on.present(fighters, time, sim, charge); },
  };
}
