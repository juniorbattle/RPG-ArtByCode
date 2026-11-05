/** The version 2's spectators (journal Passe PU1; the rules and their decisions: stands.ts): the district's five townsfolk and their approved variants on the
 *  arena's 88 seats, standing, each wing turned to the ring, each breathing on its own clock, hopping on the moments the crowd's sound plays. Loaded on
 *  demand by a duel under the version 2's rules only (`flags.v2`, `?scene=arena&v2=1`, a version 2 game's bouts): today's arena keeps its generated
 *  spectators and never reaches this module; `cast=generated` keeps them in a version 2 duel too, for comparison.
 *  The sheets pass the production gate of the town (BakedCast.loadProductionCast: approved manifests, SHA-256 against their provenance packs, the approved
 *  variants file and its mask fingerprints); their idle frames alone enter a texture of their own, drawn by a renderer of their own at the town's frame,
 *  with the town's dark outline (« Contour noir 25 %, de jour et de nuit », journal Passe S3b), day and night. */
import * as THREE from 'three';
import { SpriteRenderer, type Actor } from '../characters/SpriteRenderer';
import { SpriteAtlas } from '../characters/SpriteAtlas';
import { castEntries, loadProductionCast, type CastMember } from '../characters/BakedCast';
import type { BakedSheet } from '../characters/BakedSprites';
import type { LightRig } from '../atmosphere/LightRig';
import { STANDS, STANDS_SHEETS, STAND_ID, REACTION, breathPhase, breathRate, reactionOf, reactionPose, seatOf, standsSeats, takes, type Reaction } from './stands';

export interface Stands {
  group: THREE.Group;
  actors: Actor[];
  /** the duel's events: the reactions they fire (sim time) */
  onEvents(evs: ReadonlyArray<{ type: string } & Record<string, unknown>>, t: number): void;
  /** each spectator's lift and breath at sim time t, then the renderer */
  update(t: number, lights: LightRig, camera: THREE.Camera, keyDir: THREE.Vector3): void;
  info: { sheets: Array<{ id: string; frames: number; variants: number }>; seats: number; texture: [number, number]; reactions: Record<string, number> };
}

/** `charScale`: the arena's; `edgeGain`: its silhouette gain (by day, the night's strength); `shade`: the combat sheets' shade in its light (CX-L1 / CX-L2) */
export async function installStands(opts: { charScale: number; edgeGain: number; shade: number }): Promise<Stands> {
  const entries = castEntries(false).filter((e) => (STANDS_SHEETS as readonly string[]).includes(e.manifest.id));
  const { sheets, cast } = await loadProductionCast(false, 'approved', undefined, entries);
  const members = new Map<string, CastMember>();
  for (const m of cast.values()) members.set(m.id, m);
  const missing = STANDS_SHEETS.filter((id) => !members.has(id) || !members.get(id)!.variants);
  if (missing.length) throw new Error(`the stands' sheets ${missing.join(', ')}: not approved for production, or without their approved variants`);
  // the idle frames alone (a spectator never walks), their materials kept with them
  const idle: BakedSheet[] = STANDS_SHEETS.map((id) => {
    const s = sheets.find((q) => q.id === id)!, keep = s.frames.map((f, i) => (f.anim === 'idle' ? i : -1)).filter((i) => i >= 0);
    return { ...s, frames: keep.map((i) => s.frames[i]), ...(s.materials ? { materials: keep.map((i) => s.materials![i]) } : {}) };
  });
  const atlas = SpriteAtlas.build([], idle);
  const seats = standsSeats();
  const renderer = new SpriteRenderer(atlas, seats.length * 2);
  renderer.charScale = opts.charScale;
  renderer.protect.crowd = 0.35;
  renderer.setEdgeMode('dark');
  renderer.setEdgeGain(opts.edgeGain);

  const counts = STANDS_SHEETS.map((id) => members.get(id)!.variants!.list.length);
  const actors: Actor[] = seats.map((st, i) => {
    const { sheet, variant } = seatOf(i, counts), id = STANDS_SHEETS[sheet], m = members.get(id)!, vs = m.variants!, row = variant > 0 ? vs.list[variant - 1] : null;
    return {
      id: STAND_ID + i, spec: id, role: 'fan', detail: 'crowd', pos: new THREE.Vector3(st.x, st.y, st.z), facing: 'down', dir: 'down',
      // the townsfolk's front is a three-quarter turned to the left (BakedCast `frontLeft`): the left wing is mirrored, both look at the ring
      flip: st.side < 0, anim: 'idle', t: 0, speed: 0, tint: [opts.shade, opts.shade, opts.shade], scale: STANDS.scale, height: m.height * STANDS.scale, radius: 0.3,
      ...(row ? { variant: { hair: row[0], skin: row[1], hairRange: vs.hair, skinRange: vs.skin } } : {}),
    };
  });
  const base = seats.map((s) => s.y), rate = seats.map((_, i) => breathRate(i));
  const start = seats.map(() => -10), kind: Array<Reaction | null> = seats.map(() => null);
  const reactions: Record<string, number> = {};
  const fire = (r: Reaction, t: number) => {
    reactions[r] = (reactions[r] ?? 0) + 1;
    for (let i = 0; i < seats.length; i++) { const at = takes(i, t, REACTION[r].share); if (at !== null) { start[i] = at; kind[i] = r; } }
  };
  const group = new THREE.Group(); group.name = 'stands'; group.add(renderer.group);
  return {
    group, actors,
    onEvents(evs, t) {
      for (const e of evs) {
        if (e.type === 'reset') { start.fill(-10); kind.fill(null); continue; }
        const r = reactionOf(e);
        if (r) fire(r, t);
      }
    },
    update(t, lights, camera, keyDir) {
      for (let i = 0; i < actors.length; i++) {
        const a = actors[i], p = reactionPose(kind[i], t - start[i], rate[i]);
        a.pos.y = base[i] + p.dy;
        // the gasp holds the breath (the idle frame of its start held); otherwise each spectator breathes on its own clock
        a.t = p.hold ? Math.floor(start[i] * 1.7) / 1.7 : t * rate[i] + breathPhase(i);
      }
      renderer.update(actors, lights, camera, keyDir);
    },
    info: { sheets: idle.map((s) => ({ id: s.id, frames: s.frames.length, variants: members.get(s.id)!.variants!.list.length })), seats: seats.length, texture: [atlas.bakedWidth, atlas.bakedHeight], reactions },
  };
}
