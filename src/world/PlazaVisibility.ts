import * as THREE from 'three';
import { SLOTS, type Slot } from '../core/MeshBuilder';
import { idMaterial, type BakeOptions, type BakePose, type VisResult } from '../district/Visibility';
import { bakeVisibilityCached, type BakeCacheMode, type BakeStore } from '../district/BakeCache';
import type { CamPose } from '../app/CameraRig';
import type { PlazaBuild, PlazaKind } from './Plazas';
import { CUTSCENES } from '../narrative/v2story';
import { PLAZA_OF } from '../simulation/v2places';

/** The squares' visibility (journal Passe VP1), the Merchant District's rule (src/district/Visibility.ts) on an open space: every wall and roof
 *  of a square is a part; the camera of the square (a smooth function of where the hero stands, `plazaCamPose`) is sampled over the whole
 *  walkable surface every 1.5 m, at every person's spot as a dialogue frames it, and at every look of the cutscenes played there, in the widest
 *  frame a window shows (PLAZA_FRAME, wider windows see a crop of it) and with the puddles' mirror; what no sample shows leaves every
 *  per-frame pass (a hidden caster stays in the shadow pass). One set ('A': the square has one camera), no draw classes. A bake that fails
 *  keeps everything (the district's rule: a failed bake never culls). The bake goes through the district's cache (src/district/BakeCache.ts:
 *  its key covers every input, the result is read back only for the same ones), in entries of its own: every move between places reloads a
 *  page, and a square read back costs a few milliseconds instead of a bake. */

/** the squares' entries in the bake cache: three squares by day and by night */
export const PLAZA_STORE: BakeStore = { prefix: 'hd2d.plazabake.', index: 'hd2d.plazabake.index', max: 6 };

export const POSE_STEP = 1.5;

/** every pose the square's camera can take (its targets: the eased camera lies between neighbouring targets, 1.5 m apart) */
export function plazaBakePoses(kind: PlazaKind, place: Pick<PlazaBuild, 'walk' | 'spots'>, poseOf: (x: number, z: number, dist: number | null) => CamPose, step = POSE_STEP): BakePose[] {
  const out: BakePose[] = [], W = place.walk;
  for (let x = W.x0; x <= W.x1 + 1e-6; x += step) for (let z = W.z0; z <= W.z1 + 1e-6; z += step) out.push({ set: 'A', pose: poseOf(x, z, null), player: [x, z] });
  // the squares' edges exactly (the step does not land on them)
  for (const x of [W.x0, W.x1]) for (let z = W.z0; z <= W.z1 + 1e-6; z += step) out.push({ set: 'A', pose: poseOf(x, z, null), player: [x, z] });
  for (const z of [W.z0, W.z1]) for (let x = W.x0; x <= W.x1 + 1e-6; x += step) out.push({ set: 'A', pose: poseOf(x, z, null), player: [x, z] });
  // a dialogue turns the camera to the person spoken to (9 m, playPlaza's focus), from the hero's pose beside them: the look and the way there
  // (the page eases every field of the pose toward its target, so a move between two looks passes through their blends: the district's
  // blend poses, journal Passe VP1)
  for (const [x, z] of Object.values(place.spots)) {
    const from = poseOf(x, z, null), to = poseOf(x, z, 9);
    out.push({ set: 'A', pose: to });
    for (const t of BLEND) out.push({ set: 'A', pose: lerpPose(from, to, t) });
  }
  // the cutscenes played on this square: each look of their scripts, and the moves between them (from the hero's pose at the start, back to it
  // at the end)
  for (const c of Object.values(CUTSCENES)) if (PLAZA_OF[c.place] === kind) {
    const looks = c.steps.flatMap((st) => ('cam' in st ? [poseOf(st.cam[0], st.cam[1], st.dist ?? 14)] : []));
    const start = poseOf(0, 1.5, null), path = [start, ...looks, start];
    for (const l of looks) out.push({ set: 'A', pose: l });
    for (let i = 0; i + 1 < path.length; i++) for (const t of BLEND) out.push({ set: 'A', pose: lerpPose(path[i], path[i + 1], t) });
  }
  // the camera holds its edge pose beyond x ± 9 and z - 15..2 (plazaCamPose): the margins' samples repeat poses, baked once
  const seen = new Set<string>();
  return out.filter((p) => { const k = JSON.stringify(p.pose); if (seen.has(k)) return false; seen.add(k); return true; });
}

/** the blends sampled on a move between two looks */
const BLEND = [0.25, 0.5, 0.75];
/** a pose between two, field by field (the page's easing) */
export function lerpPose(a: CamPose, b: CamPose, t: number): CamPose {
  const out = { ...a } as CamPose;
  for (const k of Object.keys(a) as Array<keyof CamPose>) if (typeof a[k] === 'number' && typeof b[k] === 'number') (out[k] as number) = (a[k] as number) + ((b[k] as number) - (a[k] as number)) * t;
  return out;
}

export interface PlazaVis { result: VisResult; keep: (part: number) => boolean; poses: number }

/** the bake: part-ID tiles of every pose (and its puddle mirror), counted per part */
export function bakePlaza(renderer: THREE.WebGLRenderer, place: PlazaBuild, poses: BakePose[], frame: number, opts: BakeOptions = {}, mode: BakeCacheMode = 'on'): PlazaVis {
  const scene = new THREE.Scene(), made: Array<{ dispose(): void }> = [];
  const add = (b: { vertexCount: number; toPartGeometry(): THREE.BufferGeometry }, side: THREE.Side) => {
    if (!b.vertexCount) return;
    const g = b.toPartGeometry(), m = idMaterial(side); made.push(g, m);
    const mesh = new THREE.Mesh(g, m); mesh.frustumCulled = false; scene.add(mesh);
  };
  const sideOf = (s: Slot) => (s === 'cloth' || s === 'banner' || s === 'leaf' ? THREE.DoubleSide : THREE.FrontSide);
  for (const s of SLOTS) if (s !== 'decal') add(place.world.get(s), sideOf(s));
  add(place.far, THREE.DoubleSide);
  try {
    const result = bakeVisibilityCached({ renderer, scene, nParts: place.nParts, poses, aspect: frame, waterY: 0, opts: { fine: null, ...opts } }, mode, PLAZA_STORE);
    const seen = result.counts.A;
    return { result, keep: (p) => p <= 0 || seen[p] > 0, poses: poses.length };
  } finally { for (const d of made) d.dispose(); }
}
