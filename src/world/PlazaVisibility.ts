import * as THREE from 'three';
import { SLOTS, type Slot } from '../core/MeshBuilder';
import { idMaterial, type BakeOptions, type BakePose, type VisResult } from '../district/Visibility';
import { bakeVisibilityCached, type BakeCacheMode, type BakeStore } from '../district/BakeCache';
import type { CamPose } from '../app/CameraRig';
import type { PlazaBuild, PlazaKind } from './Plazas';
import { CUTSCENES } from '../narrative/v2story';
import { PLAZA_OF } from '../simulation/v2places';
import { framingAt, framingPose, framingsAround, lookPose } from './PlazaCamera';

/** The squares' visibility (journal Passe VP1), the Merchant District's rule (src/district/Visibility.ts) on an open space: every wall and roof
 *  of a square is a part; the camera of the square (its framings, src/world/PlazaCamera.ts, journal Passe VP7) is sampled over the whole
 *  walkable surface every 1.5 m, at every person's spot as a dialogue frames it, and at every look of the cutscenes played there, in the widest
 *  frame a window shows (PLAZA_FRAME, wider windows see a crop of it) and with the puddles' mirror; what no sample shows leaves every
 *  per-frame pass (a hidden caster stays in the shadow pass). One set ('A': the square has one camera), no draw classes. A bake that fails
 *  keeps everything (the district's rule: a failed bake never culls). The bake goes through the district's cache (src/district/BakeCache.ts:
 *  its key covers every input, the result is read back only for the same ones), in entries of its own: every move between places reloads a
 *  page, and a square read back costs a few milliseconds instead of a bake. */

/** the squares' entries in the bake cache: three squares by day and by night */
export const PLAZA_STORE: BakeStore = { prefix: 'hd2d.plazabake.', index: 'hd2d.plazabake.index', max: 6 };

export const POSE_STEP = 1.5;

/** the hero's places the bake samples: the walkable surface and its ways out's lanes every `step` m, their edges exactly */
export function heroPoints(place: Pick<PlazaBuild, 'walk' | 'lanes'>, step = POSE_STEP): Array<[number, number]> {
  const out: Array<[number, number]> = [];
  for (const R of [place.walk, ...place.lanes]) {
    const xs: number[] = [], zs: number[] = [];
    for (let x = R.x0; x <= R.x1 + 1e-6; x += step) xs.push(x);
    for (let z = R.z0; z <= R.z1 + 1e-6; z += step) zs.push(z);
    if (R.x1 - xs[xs.length - 1] > 1e-6) xs.push(R.x1);
    if (R.z1 - zs[zs.length - 1] > 1e-6) zs.push(R.z1);
    for (const x of xs) for (const z of zs) out.push([x, z]);
  }
  return out;
}

/** every pose the square's camera can take (journal Passe VP7): each framing over its zone grown by the hysteresis, at every hero's place; a
 *  framing's change (the page eases every field toward the new framing while the hero walks on: between the old framing at the hero's place
 *  and the new one at a neighbouring place, `step` m away at most, the district's blend poses); a dialogue's look at each person's spot and
 *  the way there from every framing the spot can be seen in; the cutscenes' looks and the moves between them, from the framing of each way in */
export function plazaBakePoses(kind: PlazaKind, place: Pick<PlazaBuild, 'walk' | 'lanes' | 'spots' | 'exits'>, step = POSE_STEP): BakePose[] {
  const out: BakePose[] = [], push = (pose: CamPose, player?: [number, number]) => out.push({ set: 'A', pose, ...(player ? { player } : {}) });
  for (const [x, z] of heroPoints(place, step)) {
    const F = framingsAround(kind, x, z);
    for (const f of F) push(framingPose(f, x, z), [x, z]);
    if (F.length < 2) continue;
    for (const a of F) for (const b of F) if (a !== b) for (const [dx, dz] of NEAR) for (const t of BLEND) push(lerpPose(framingPose(a, x, z), framingPose(b, x + dx * step, z + dz * step), t));
  }
  // a dialogue turns the camera to the person spoken to (9 m, playPlaza's focus), from the hero's framing beside them: the look and the way there
  for (const [x, z] of Object.values(place.spots)) {
    const to = lookPose(kind, x, z, 9);
    push(to);
    for (const f of framingsAround(kind, x, z)) for (const t of BLEND) push(lerpPose(framingPose(f, x, z), to, t));
  }
  // the cutscenes played on this square: each look of their scripts, and the moves between them, from the framing of the hero who has just
  // arrived (at a way in, or at the square's mouth) and back to it
  const starts = [[0, 1.5] as [number, number], ...place.exits.map((e) => e.spawn)].map(([x, z]) => framingPose(framingAt(kind, x, z), x, z));
  for (const c of Object.values(CUTSCENES)) if (PLAZA_OF[c.place] === kind) {
    const looks = c.steps.flatMap((st) => ('cam' in st ? [lookPose(kind, st.cam[0], st.cam[1], st.dist ?? 14)] : []));
    for (const l of looks) push(l);
    for (let i = 0; i + 1 < looks.length; i++) for (const t of BLEND) push(lerpPose(looks[i], looks[i + 1], t));
    if (looks.length) for (const s of starts) for (const t of BLEND) { push(lerpPose(s, looks[0], t)); push(lerpPose(looks[looks.length - 1], s, t)); }
  }
  // a framing holds its pose once its offsets reach their bounds: those places repeat poses, baked once
  const seen = new Set<string>();
  return out.filter((p) => { const k = JSON.stringify(p.pose); if (seen.has(k)) return false; seen.add(k); return true; });
}

/** the hero's moves during a framing's change: from the place where it starts to a neighbouring one (and staying put) */
const NEAR: Array<[number, number]> = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
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
