/** The champion's master at the edge of the lists (journal Passe CH-PNJ; the rules and the decision: master.ts): one approved town sheet, its idle frames alone in an atlas of its
 *  own, drawn by a renderer of its own at the town's frame with the town's dark outline, breathing on its clock. Loaded on demand by a duel whose fighter is the champion of a keeper
 *  or a passer-by only; never by another bout. The sheet passes the production gate of the town (BakedCast.loadProductionCast: approved manifest, SHA-256 against its
 *  provenance pack). */
import * as THREE from 'three';
import { SpriteRenderer, type Actor } from '../characters/SpriteRenderer';
import { SpriteAtlas } from '../characters/SpriteAtlas';
import { castEntries, loadProductionCast } from '../characters/BakedCast';
import { plazaCastEntries } from '../characters/PlazaCast';
import type { BakedSheet } from '../characters/BakedSprites';
import type { LightRig } from '../atmosphere/LightRig';
import { MASTER_AT, MASTER_SHEET } from './master';

export interface MasterFigure {
  group: THREE.Group;
  actor: Actor;
  update(t: number, lights: LightRig, camera: THREE.Camera, keyDir: THREE.Vector3): void;
  info: { sheet: string; frames: number; texture: [number, number] };
}

/** `who`: the person the champion fights for; `charScale`: the arena's; `edgeGain`: its silhouette gain; `shade`: the combat sheets' shade in its light */
export async function installMaster(opts: { who: string; charScale: number; edgeGain: number; shade: number }): Promise<MasterFigure | null> {
  const id = MASTER_SHEET[opts.who];
  if (!id) return null;
  const entry = [...castEntries(false), ...plazaCastEntries([])].find((e) => e.manifest.id === id);
  if (!entry) throw new Error(`the master's sheet ${id}: not in the production cast`);
  const { sheets, cast } = await loadProductionCast(false, 'approved', undefined, [entry]);
  const s = sheets.find((q) => q.id === id), m = [...cast.values()].find((c) => c.id === id);
  if (!s || !m) throw new Error(`the master's sheet ${id}: not approved for production`);
  // the idle frames alone (a bystander never walks), their materials kept with them
  const keep = s.frames.map((f, i) => (f.anim === 'idle' ? i : -1)).filter((i) => i >= 0);
  const idle: BakedSheet = { ...s, frames: keep.map((i) => s.frames[i]), ...(s.materials ? { materials: keep.map((i) => s.materials![i]) } : {}) };
  const atlas = SpriteAtlas.build([], [idle]);
  const renderer = new SpriteRenderer(atlas, 2);
  renderer.charScale = opts.charScale;
  renderer.protect.crowd = 0.35;
  renderer.setEdgeMode('dark');
  renderer.setEdgeGain(opts.edgeGain);
  const actor: Actor = {
    id: 9300, spec: id, role: 'fan', detail: 'crowd', pos: new THREE.Vector3(MASTER_AT.x, 0, MASTER_AT.z), facing: 'down', dir: 'down', flip: MASTER_AT.flip, anim: 'idle', t: 0, speed: 0,
    tint: [opts.shade, opts.shade, opts.shade], scale: MASTER_AT.scale, height: m.height * MASTER_AT.scale, radius: 0.3,
  };
  const group = new THREE.Group(); group.name = 'master'; group.add(renderer.group);
  return {
    group, actor,
    update(t, lights, camera, keyDir) { actor.t = t * 1.7; renderer.update([actor], lights, camera, keyDir); },
    info: { sheet: id, frames: idle.frames.length, texture: [atlas.bakedWidth, atlas.bakedHeight] },
  };
}
