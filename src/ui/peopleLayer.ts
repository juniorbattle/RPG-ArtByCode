import type * as THREE from 'three';
import type { GameState } from '../simulation';
import { peopleMarks } from '../simulation/v2marks';
import { NpcMarks, type MarkTarget } from './npcMarks';
import { MiniMap, type MapPlan } from './minimap';

/** What a version 2 game's place shows of its people (the operator's MK1 sheet, journal Passe MK2): the marks over the heads of those with something new
 *  (src/ui/npcMarks.ts) and the plan in the corner (src/ui/minimap.ts), both from the state of the moment (src/simulation/v2marks.ts: one computation a
 *  state). The quay's and the squares' pages hand it their people each frame; Explore and today's game build none (MK-10). */
export class PeopleLayer {
  readonly marks = new NpcMarks();
  readonly map: MiniMap;
  private told = false;

  constructor(private readonly state: () => GameState, plan: MapPlan, private readonly firstShown: () => boolean) {
    this.map = new MiniMap(plan);
  }

  /** each frame: who is marked now, their marks, the plan; `hidden` while a page, a dialogue or a scene is open */
  update(camera: THREE.Camera, hero: { x: number; z: number }, people: MarkTarget[], hidden: boolean): void {
    const kinds = peopleMarks(this.state());
    this.marks.marks = kinds;
    const shown = this.marks.update(camera, people, hidden);
    if (shown.length && !this.told) this.told = this.firstShown();
    this.map.update(camera, hero, people.map((p) => ({ x: p.pos.x, z: p.pos.z, kind: kinds.get(p.who) ?? null })), hidden);
  }
}
