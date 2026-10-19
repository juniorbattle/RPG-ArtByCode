import dockworkerPng from '../../art-lab/characters/exports/dockworker-x2-v2.png?url';
import dockworkerJson from '../../art-lab/characters/exports/dockworker-x2-v2.json';
import { id as dwId, status as dwStatus, approved as dwApproved, runtimeUse as dwUse } from '../../art-lab/characters/manifests/dockworker-x2-v2.manifest.json';
import { files as dockworkerFiles } from '../../art-lab/characters/provenance/dockworker-x2-v2/PROVENANCE.json';
import merchantPng from '../../art-lab/characters/exports/merchant-x2-v2.png?url';
import merchantJson from '../../art-lab/characters/exports/merchant-x2-v2.json';
import { id as mcId, status as mcStatus, approved as mcApproved, runtimeUse as mcUse } from '../../art-lab/characters/manifests/merchant-x2-v2.manifest.json';
import { files as merchantFiles } from '../../art-lab/characters/provenance/merchant-x2-v2/PROVENANCE.json';
import blacksmithPng from '../../art-lab/characters/exports/blacksmith-x2-v1.png?url';
import blacksmithJson from '../../art-lab/characters/exports/blacksmith-x2-v1.json';
import { id as bsId, status as bsStatus, approved as bsApproved, runtimeUse as bsUse } from '../../art-lab/characters/manifests/blacksmith-x2-v1.manifest.json';
import { files as blacksmithFiles } from '../../art-lab/characters/provenance/blacksmith-x2-v1/PROVENANCE.json';
import guardPng from '../../art-lab/characters/exports/guard-x2-v1.png?url';
import guardJson from '../../art-lab/characters/exports/guard-x2-v1.json';
import { id as gdId, status as gdStatus, approved as gdApproved, runtimeUse as gdUse } from '../../art-lab/characters/manifests/guard-x2-v1.manifest.json';
import { files as guardFiles } from '../../art-lab/characters/provenance/guard-x2-v1/PROVENANCE.json';
import hoodedPng from '../../art-lab/characters/exports/hooded-x2-v1.png?url';
import hoodedJson from '../../art-lab/characters/exports/hooded-x2-v1.json';
import { id as hdId, status as hdStatus, approved as hdApproved, runtimeUse as hdUse } from '../../art-lab/characters/manifests/hooded-x2-v1.manifest.json';
import { files as hoodedFiles } from '../../art-lab/characters/provenance/hooded-x2-v1/PROVENANCE.json';
import artisanPng from '../../art-lab/characters/exports/artisan-x2-v1.png?url';
import artisanJson from '../../art-lab/characters/exports/artisan-x2-v1.json';
import { id as arId, status as arStatus, approved as arApproved, runtimeUse as arUse } from '../../art-lab/characters/manifests/artisan-x2-v1.manifest.json';
import { files as artisanFiles } from '../../art-lab/characters/provenance/artisan-x2-v1/PROVENANCE.json';
import travelerPng from '../../art-lab/characters/exports/traveler-x2-v1.png?url';
import travelerJson from '../../art-lab/characters/exports/traveler-x2-v1.json';
import { id as trId, status as trStatus, approved as trApproved, runtimeUse as trUse } from '../../art-lab/characters/manifests/traveler-x2-v1.manifest.json';
import { files as travelerFiles } from '../../art-lab/characters/provenance/traveler-x2-v1/PROVENANCE.json';
import townswomanPng from '../../art-lab/characters/exports/townswoman-x2-v1.png?url';
import townswomanJson from '../../art-lab/characters/exports/townswoman-x2-v1.json';
import { id as twId, status as twStatus, approved as twApproved, runtimeUse as twUse } from '../../art-lab/characters/manifests/townswoman-x2-v1.manifest.json';
import { files as townswomanFiles } from '../../art-lab/characters/provenance/townswoman-x2-v1/PROVENANCE.json';
import olderMerchantPng from '../../art-lab/characters/exports/older-merchant-x2-v1.png?url';
import olderMerchantJson from '../../art-lab/characters/exports/older-merchant-x2-v1.json';
import { id as omId, status as omStatus, approved as omApproved, runtimeUse as omUse } from '../../art-lab/characters/manifests/older-merchant-x2-v1.manifest.json';
import { files as olderMerchantFiles } from '../../art-lab/characters/provenance/older-merchant-x2-v1/PROVENANCE.json';
import courierPng from '../../art-lab/characters/exports/courier-x2-v1.png?url';
import courierJson from '../../art-lab/characters/exports/courier-x2-v1.json';
import { id as coId, status as coStatus, approved as coApproved, runtimeUse as coUse } from '../../art-lab/characters/manifests/courier-x2-v1.manifest.json';
import { files as courierFiles } from '../../art-lab/characters/provenance/courier-x2-v1/PROVENANCE.json';
import heroPng from '../../art-lab/characters/exports/hero-x2-v3.png?url';
import heroJson from '../../art-lab/characters/exports/hero-x2-v3.json';
import { id as heId, status as heStatus, approved as heApproved, runtimeUse as heUse } from '../../art-lab/characters/manifests/hero-x2-v3.manifest.json';
import { files as heroFiles } from '../../art-lab/characters/provenance/hero-x2-v3/PROVENANCE.json';
import { FRAME_W, FOOT_Y } from './SpriteGenerator';
import { PIXEL_WORLD, WALK_CADENCE } from './SpriteRenderer';
import { walkSlide } from './Stride';
import { checkBakedSheet, DIRS, type BakedSheet } from './BakedSprites';
import { decodePng, sheetFrames, sha256, figureRows } from './BakedDecode';
import variantsFile from '../../art-lab/characters/variants/variants.json';
import { sheetMasks, maskFingerprint, materialRange, rampTable, type VariantsFile } from './Variants';

/** The PRODUCTION cast of baked characters (`art-lab/characters/runtime-integration-contract.md`): approved manifests with
 *  `runtimeUse: "production"` only; an entry whose manifest is not approved is skipped (never loaded) in every build. Each sheet takes
 *  the place of one generated archetype in the seeded spawns (`ActorSystem.cast`): same spawn points, roles, behaviours and RNG draws;
 *  only the sprite, its presentation scale and its height change. The generated archetype stays in the atlas (its cells and the generated
 *  texture are unchanged), so `?cast=generated` restores the old cast. DEV only, `?cast=candidate` also loads the `candidate` entries
 *  (review before the operator's approval). The exports are bundled assets whatever their status (an unapproved one is shipped but never
 *  fetched). */

// only the gate fields of a manifest reach the bundle (named JSON exports are tree-shaken)
interface Manifest { id: string; status: string; approved: boolean; runtimeUse: string }
/** replaces: the generated archetype(s) the sheet stands in for; needs: frames its archetypes' behaviours ask for beyond idle + walk */
interface Entry { manifest: Manifest; png: string; json: unknown; files: Record<string, string>; replaces: string[]; scale: number; needs?: string[] }

const ENTRIES: Entry[] = [
  // the dock worker of the reference sheet takes the porter's walks (the quay wanderer and the forge yard's patrol)
  { manifest: { id: dwId, status: dwStatus, approved: dwApproved, runtimeUse: dwUse }, png: dockworkerPng, json: dockworkerJson, files: dockworkerFiles, replaces: ['porter'], scale: 0.9 },
  // the sheet's merchant takes the hero stall
  { manifest: { id: mcId, status: mcStatus, approved: mcApproved, runtimeUse: mcUse }, png: merchantPng, json: merchantJson, files: merchantFiles, replaces: ['merchant'], scale: 0.9 },
  // the sheet's blacksmith helper takes the forge (hammering at the anvil: its side-only hammer cycle; the alarm in the sabotaged forge)
  { manifest: { id: bsId, status: bsStatus, approved: bsApproved, runtimeUse: bsUse }, png: blacksmithPng, json: blacksmithJson, files: blacksmithFiles, replaces: ['blacksmith'], scale: 0.9, needs: ['side/hammer'] },
  // one city guard for both generated guards (the barrier, the sabotaged forge): the sheet has one guard uniform. The guard and the hooded
  // passerby are resampled more coarsely (helmet and hood do not fit the frame at the dock worker's pitch, see their rig scripts): at the
  // cast's scale their texels match the others' on screen, and they stand ~10 % smaller than the sheet's unified scale
  { manifest: { id: gdId, status: gdStatus, approved: gdApproved, runtimeUse: gdUse }, png: guardPng, json: guardJson, files: guardFiles, replaces: ['guardA', 'guardB'], scale: 0.9 },
  // the hooded passerby takes the stranger watching the boat (and the one of the sabotaged forge)
  { manifest: { id: hdId, status: hdStatus, approved: hdApproved, runtimeUse: hdUse }, png: hoodedPng, json: hoodedJson, files: hoodedFiles, replaces: ['hooded'], scale: 0.9 },
  // the ambient crowd (Pass 4A-tervicies, approved for production on 2026-10-17): five townsfolk of the reference sheets stand in for the
  // five generated crowd variants the wanderers pick from (ActorSystem.populate); the taller ones are reconstructed at a coarser pitch
  // (1.8-2.0 sheet pixels per texel against the merchant's 1.775, see their rig scripts), all at the cast's scale
  { manifest: { id: arId, status: arStatus, approved: arApproved, runtimeUse: arUse }, png: artisanPng, json: artisanJson, files: artisanFiles, replaces: ['crowd0'], scale: 0.9 },
  { manifest: { id: trId, status: trStatus, approved: trApproved, runtimeUse: trUse }, png: travelerPng, json: travelerJson, files: travelerFiles, replaces: ['crowd1'], scale: 0.9 },
  { manifest: { id: twId, status: twStatus, approved: twApproved, runtimeUse: twUse }, png: townswomanPng, json: townswomanJson, files: townswomanFiles, replaces: ['crowd2'], scale: 0.9 },
  { manifest: { id: omId, status: omStatus, approved: omApproved, runtimeUse: omUse }, png: olderMerchantPng, json: olderMerchantJson, files: olderMerchantFiles, replaces: ['crowd3'], scale: 0.9 },
  { manifest: { id: coId, status: coStatus, approved: coApproved, runtimeUse: coUse }, png: courierPng, json: courierJson, files: courierFiles, replaces: ['crowd4'], scale: 0.9 },
  // CANDIDATE, not approved (journal Pass H8; hero-x2-v2 of Pass H5 before it): the premium hero on the player, DEV review only
  // (?cast=candidate); its three-quarter facings only with ?views=5
  { manifest: { id: heId, status: heStatus, approved: heApproved, runtimeUse: heUse }, png: heroPng, json: heroJson, files: heroFiles, replaces: ['player'], scale: 0.9 },
];

/** NPC variants of a sheet (Variants.ts): the ramp rows of each variant (-1 = keep that material), the luminance ranges of its masked
 *  hair / skin, and the variant the operator fixed (per archetype) */
export interface CastVariants { list: Array<[number, number]>; hair: [number, number] | null; skin: [number, number] | null; fixed?: Record<string, number> }
/** `walkSpeed`: the ground speed its walk cycle draws, in m/s at character scale 1 and the base walk cadence (Stride.ts); null = unknown */
export interface CastMember { id: string; scale: number; height: number; walkSpeed: number | null; variants?: CastVariants }

/** every behaviour of the replaced archetypes (idle, turned to talk, wander, patrol) needs these frames (contract amendment B: a missing
 *  frame in production is a load error, never a silent fallback) */
const REQUIRED = DIRS.flatMap((d) => (['idle', 'walk'] as const).map((a) => `${d}/${a}`));

/** production: approved production manifests; candidates: also the unapproved `candidate` ones (callers allow it in DEV builds only).
 *  `entries`: the list to gate, the cast's own by default (the unit tests pass their own, tests/baked-cast.test.mjs) */
export function castEntries(candidates: boolean, entries: readonly Entry[] = ENTRIES): Entry[] {
  return entries.filter((e) => {
    const m = e.manifest;
    if (m.runtimeUse === 'production') { if (m.approved !== true || m.status !== 'approved') throw new Error(`${m.id}: runtimeUse production without an approval`); return true; }
    return candidates && m.status === 'candidate';
  });
}

/** `variants`: 'approved' (production: only an approved variants file is applied), 'candidate' (DEV review of an unapproved one), 'off';
 *  `entries`: the list to load, the cast's own by default (the unit tests pass their own, tests/baked-cast.test.mjs) */
export async function loadProductionCast(candidates = false, variants: 'approved' | 'candidate' | 'off' = 'approved', file: VariantsFile = variantsFile as unknown as VariantsFile, entries: readonly Entry[] = ENTRIES): Promise<{ sheets: BakedSheet[]; cast: Map<string, CastMember> }> {
  const sheets: BakedSheet[] = [], cast = new Map<string, CastMember>();
  const useVariants = variants === 'candidate' || (variants === 'approved' && file.approved === true && !!file.approval?.by && !!file.approval?.date);
  const ramps = rampTable(file);
  for (const e of castEntries(candidates, entries)) {
    const m = e.manifest, id = m.id;
    const bytes = new Uint8Array(await (await fetch(e.png)).arrayBuffer());
    const want = e.files[`art-lab/characters/exports/${id}.png`], got = await sha256(bytes);
    // the hash needs WebCrypto (secure contexts); `npm run art:validate` checks the same file against the same pack at build time
    if (got !== null && got !== want) throw new Error(`${id}: exported PNG SHA-256 ${got.slice(0, 12)}... does not match its provenance pack`);
    const { k, frames } = sheetFrames(id, await decodePng(bytes), e.json);
    const sheet: BakedSheet = { id, runtimeUse: m.runtimeUse === 'production' ? 'production' : 'lab', sha256: want, k, frames };
    const errs = checkBakedSheet(sheet);
    const missing = [...REQUIRED, ...(e.needs ?? [])].filter((r) => !frames.some((f) => `${f.dir}/${f.anim}` === r));
    if (missing.length) errs.push(`missing frames ${missing.join(', ')}`);
    if (errs.length) throw new Error(`${id}: ${errs.join('; ')}`);
    const front = frames.find((f) => f.dir === 'down' && f.anim === 'idle' && f.i === 0)!;
    sheets.push(sheet);
    const height = figureRows(front, FRAME_W * k, FOOT_Y * k) * (PIXEL_WORLD / k) * e.scale;
    const slide = walkSlide(frames, k), walkSpeed = slide === null ? null : slide * WALK_CADENCE * (PIXEL_WORLD / k) * e.scale;
    // NPC variants: the sheet's material masks, written by the atlas into the baked texture's alpha (the sheet keeps its binary alpha)
    let vars: CastVariants | undefined;
    const sv = useVariants ? file.sheets[id] : undefined;
    if (sv && sv.variants.length) {
      const masks = sheetMasks(frames, FRAME_W * k, 48 * k, sv.mask), fp = maskFingerprint(masks);
      if (sv.fingerprint !== fp && variants === 'approved') throw new Error(`${id}: variant masks ${fp} are not the approved masks ${sv.fingerprint}`);
      sheet.materials = masks;
      vars = { list: sv.variants.map((v) => [v.hair ? ramps.hair[v.hair] ?? -1 : -1, v.skin ? ramps.skin[v.skin] ?? -1 : -1]), hair: materialRange(frames, masks, 1), skin: materialRange(frames, masks, 2), fixed: sv.fixed };
    }
    for (const r of e.replaces) cast.set(r, { id, scale: e.scale, height, walkSpeed, ...(vars ? { variants: vars } : {}) });
  }
  return { sheets, cast };
}
