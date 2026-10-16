import { FRAME_W, FRAME_H, FOOT_Y, type Dir, type Anim } from './SpriteGenerator';
import type { Actor } from './SpriteRenderer';

/** Baked (authored) character sheets in the shared atlas — EXPERIMENTAL, loaded only behind a DEV flag today
 *  (`art-lab/characters/runtime-integration-contract.md`). A sheet of density k has frames of 32k x 48k texels with the feet on row 45k:
 *  the same world rectangle and foot offset as the generated 32 x 48 sprites, so the shared renderer and its shaders need no change; the
 *  density is only the size of the atlas block an instance samples. */
export interface BakedFrame { dir: Dir; anim: Anim; i: number; rgba: Uint8Array }
export interface BakedSheet {
  /** manifest id (`art-lab/characters/manifests/<id>.manifest.json`) */
  id: string;
  runtimeUse: 'lab' | 'production';
  /** SHA-256 of the exported PNG, checked by the loader against the asset's provenance pack */
  sha256: string;
  /** texel density: frames are 32k x 48k */
  k: number;
  frames: BakedFrame[];
  /** contract amendment B: declared explicitly at the spawn, for an immobile `lab` asset only: the missing idle facings become named
   *  aliases of the front idle frame. Never for walking / working NPCs, never in production. */
  fallback?: 'front-idle';
}

/** An authored NPC placed after every seeded spawn (it never consumes the district RNG). Height and scale are presentation data. */
export interface AuthoredSpawn {
  spec: string;
  pos: [number, number];
  /** world facing (radians, as `NpcSpawn.facing`); absent = never turned, always seen from the front */
  facing?: number;
  scale: number;
  /** metres: cast-shadow length and bubble height */
  height: number;
  detail: Actor['detail'];
  behaviour: 'idle';
  role?: string;
}

export const DIRS: readonly Dir[] = ['down', 'up', 'side'];

/** Frames a behaviour can ask the renderer for (contract amendment B), read from `ActorSystem`: an NPC that is turned (a facing, or
 *  interactive: `mid` / `hero` NPCs face the player when talked to) is seen from any side; walking NPCs need idle + walk in every facing. */
export function requiredFrames(kind: 'idle' | 'wander' | 'patrol' | 'work', o: { faced: boolean; interactive: boolean; talk: boolean }): Array<[Dir, Anim]> {
  const out: Array<[Dir, Anim]> = [];
  const turns = o.faced || o.interactive || kind === 'wander' || kind === 'patrol';
  for (const d of turns ? DIRS : (['down'] as const)) out.push([d, 'idle']);
  if (kind === 'wander' || kind === 'patrol') for (const d of DIRS) out.push([d, 'walk']);
  if (kind === 'work') out.push(['side', 'hammer']);
  if (o.talk) for (const d of DIRS) out.push([d, 'talk']);
  return out;
}

/** Frame invariant (contract section 3): returns every problem found (empty = valid). */
export function checkBakedSheet(s: BakedSheet): string[] {
  const err: string[] = [], k = s.k;
  if (!/^[a-z0-9-]+$/.test(s.id)) err.push(`id "${s.id}" is not a manifest id`);
  if (!Number.isInteger(k) || k < 1) { err.push(`density ${k} is not a positive integer`); return err; }
  const fw = FRAME_W * k, fh = FRAME_H * k, foot = FOOT_Y * k;
  if (!s.frames.length) err.push('no frame');
  const seen = new Set<string>(), per = new Map<string, number[]>();
  for (const f of s.frames) {
    const key = `${f.dir}/${f.anim}/${f.i}`;
    if (seen.has(key)) err.push(`${key}: duplicate`); seen.add(key);
    (per.get(`${f.anim}/${f.dir}`) ?? per.set(`${f.anim}/${f.dir}`, []).get(`${f.anim}/${f.dir}`)!).push(f.i);
    if (f.rgba.length !== fw * fh * 4) { err.push(`${key}: ${f.rgba.length / 4} texels, expected ${fw} x ${fh}`); continue; }
    let last = -1, ring = 0, semi = 0;
    for (let y = 0; y < fh; y++) for (let x = 0; x < fw; x++) {
      const a = f.rgba[(y * fw + x) * 4 + 3];
      if (a !== 0 && a !== 255) semi++;
      if (a < 128) continue;
      last = y; if (!x || !y || x === fw - 1 || y === fh - 1) ring++;
    }
    if (semi) err.push(`${key}: ${semi} semi-transparent texels (alpha must be 0 or 255)`);
    if (ring) err.push(`${key}: ${ring} opaque texels on the frame border (a transparent one-texel ring is required)`);
    if (last > foot) err.push(`${key}: last opaque row ${last} is below the foot row ${foot}`);
    if (f.anim === 'idle' && last !== foot) err.push(`${key}: idle frame must stand on row ${foot} (last opaque row ${last})`);
  }
  // one frame count per animation, identical for every facing, indices 0..n-1 (the renderer keys counts by spec / animation)
  const byAnim = new Map<string, number>();
  for (const [ad, idx] of per) {
    const [anim] = ad.split('/'), n = idx.length, sorted = [...idx].sort((p, q) => p - q);
    if (sorted.some((v, j) => v !== j)) err.push(`${ad}: frame indices must be 0..${n - 1}`);
    if (byAnim.has(anim) && byAnim.get(anim) !== n) err.push(`${anim}: ${n} frames in one facing, ${byAnim.get(anim)} in another`);
    byAnim.set(anim, n);
  }
  if (s.fallback && s.runtimeUse !== 'lab') err.push('fallback front-idle is allowed for lab assets only');
  if (s.fallback && !seen.has('down/idle/0')) err.push('fallback front-idle needs a down/idle/0 frame');
  return err;
}
