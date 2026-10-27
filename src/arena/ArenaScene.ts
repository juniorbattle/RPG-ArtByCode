import * as THREE from 'three';
import { Rng } from '../core/rng';
import { SlotSet, MeshBuilder, mat, SLOTS, type V3, type Slot } from '../core/MeshBuilder';
import { fbm, smoothstep } from '../core/noise';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import type { LightDef } from '../atmosphere/LightRig';
import { LAYER_CAST, LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import { InstanceBatch } from '../props/PropGenerator';
import { addBanner } from '../props/Banners';
import { tournamentHeraldry } from '../materials/CanvasArt';
import { createMerchantBuilding } from '../architecture/BuildingGenerator';
import { farHouse, tower, farMaterial, FAR_KIND } from '../district/DistantCity';
import type { Emitter } from '../district/MerchantDistrictGenerator';

/** The arena of the Cité du Tournoi (journal Passe P1), built from the town's own parts: the ashlar / brick / timber / iron materials of
 *  the Merchant District, its lamp posts, lanterns, barrels and hay, its cloth banners, its generated timber houses behind the stands and
 *  its far-city modules on the hill. Layout (metres; the duel runs along x at z = 0, the camera looks toward -z from z ~ +15):
 *    - a sanded cobble floor with the dueling ring inlaid in darker flags, puddles where the light falls;
 *    - an arc of curtain wall (3.4 m) with two arched fighters' doors, lit from inside, then the stands rising in four tiers to a
 *      crenellated back wall, spectators on the tiers;
 *    - the grand gate in the middle: two towers carrying the navy banners, open to the sky, through which the low moon lays its light
 *      across the floor between the fighters; past it the terrace, its lamps leading to a balustrade, the lower city and the castle hill;
 *    - town houses behind the stands, their upper floors and roofs over the back wall.
 *  Light is the scarce resource (art direction): two lamp posts on the ring, two braziers at the gate, the doors' glow, a few lanterns. */

export interface ArenaBuild {
  group: THREE.Group;
  lights: LightDef[];
  emitters: Emitter[];
  /** where the spectators stand: feet position and the tier (0 = lowest) */
  stands: Array<{ pos: V3; tier: number }>;
  stats: { triangles: number; instances: number };
  /** the braziers' coals in a mesh of their own (`fireApart`, by day: journal Passe AD1), so they keep their glow while the window glass dims;
   *  null at night (the coals stay in the glow slot's mesh, as before) */
  fire: THREE.Mesh | null;
  dispose(): void;
}

/** the curtain wall's arc: centre (x, z) and inner radius; the gate's half-width at the wall */
export const ARC = { cx: 0, cz: 1.5, r: 12.5, thick: 0.9, h: 3.4 };
export const GATE_HALF = 4.0;
const TIER = { n: 4, depth: 0.95, rise: 0.6, base: 2.6 };
const LAMP_WARM: [number, number, number] = [1.0, 0.6, 0.27];
const FIRE: [number, number, number] = [1.0, 0.52, 0.2];

const onArc = (theta: number, r = ARC.r): V3 => [ARC.cx + r * Math.sin(theta), 0, ARC.cz - r * Math.cos(theta)];
const xf = (p: V3, pos: V3, yaw: number): V3 => { const c = Math.cos(yaw), s = Math.sin(yaw); return [pos[0] + p[0] * c + p[2] * s, pos[1] + p[1], pos[2] - p[0] * s + p[2] * c]; };

export function buildArena(lib: MaterialLibrary, seed: number, opts: { fireApart?: boolean } = {}): ArenaBuild {
  const rng = new Rng(seed).fork('arena');
  const group = new THREE.Group(); group.name = 'arena';
  const W = new SlotSet();
  // by day the braziers' coals go to a set of their own (their own mesh below); at night they stay in W, written as before
  const F = opts.fireApart ? new SlotSet() : W;
  const batch = new InstanceBatch(seed ^ 0xa7e4, 3);
  const lights: LightDef[] = [];
  const emitters: Emitter[] = [];
  const stands: ArenaBuild['stands'] = [];
  const disposables: Array<{ dispose(): void }> = [];
  const gateTheta = Math.asin(GATE_HALF / ARC.r);
  const TOWER = { w: 2.8, d: 3.2, h: 9.5 };
  const towerTheta = gateTheta + Math.asin(TOWER.w / 2 / ARC.r);
  const wallFrom = gateTheta + Math.asin(TOWER.w / ARC.r), wallTo = (78 * Math.PI) / 180;
  const doorTheta = (44 * Math.PI) / 180, DOOR_LEN = 3.4, doorHalf = Math.asin(DOOR_LEN / 2 / ARC.r);
  const stone: V3 = [0.86, 0.88, 0.96], stoneDark: V3 = [0.66, 0.68, 0.76], coping: V3 = [1.0, 1.0, 1.06];

  // ---------------------------------------------------------------- curtain wall, both wings (sign -1 = left / Ren's side)
  for (const side of [-1, 1]) {
    const n = 18;
    for (let i = 0; i < n; i++) {
      const t0 = wallFrom + ((wallTo - wallFrom) * i) / n, t1 = wallFrom + ((wallTo - wallFrom) * (i + 1)) / n, tm = (t0 + t1) / 2;
      const len = 2 * ARC.r * Math.sin((t1 - t0) / 2) + 0.04, pos = onArc(side * tm), yaw = -side * tm;
      // the door replaces the segments it spans (one piece of its own, built once at the door's angle)
      const inDoor = Math.abs(tm - doorTheta) < doorHalf, door = inDoor && Math.abs(tm - doorTheta) <= (t1 - t0) / 2 + 1e-9;
      if (!inDoor || door) {
      W.at(door ? onArc(side * doorTheta) : pos, door ? -side * doorTheta : yaw, () => {
        if (door) archedDoor(W, DOOR_LEN, ARC.thick, ARC.h, stone, stoneDark);
        else W.stone.boxMM(-len / 2, 0, -ARC.thick, len / 2, ARC.h, 0, { tint: stone, aoY: [0.55, 1], skip: ['-y'] });
        // coping and a pilaster every other segment: the wall's rhythm
        const L2 = door ? DOOR_LEN / 2 : len / 2;
        W.stone.boxMM(-L2 - 0.01, ARC.h, -ARC.thick - 0.08, L2 + 0.01, ARC.h + 0.18, 0.1, { tint: coping, aoY: [0.8, 1] });
        if (i % 3 === 1 && !door) W.stone.boxMM(-0.32, 0, 0, 0.32, ARC.h, 0.22, { tint: stone, aoY: [0.5, 1], skip: ['-y', '-z'] });
        // a moss / soot band at the foot (dark cool stone) so the wall sits in the floor
        if (!door) W.stone.boxMM(-L2, 0, 0, L2, 0.32, 0.06, { tint: stoneDark, ao: 0.7, skip: ['-y', '-z'] });
      });
      if (door) {
        // the fighters' doors: a tunnel into the stands' body, lit from deep inside; lanterns either side
        const pos = onArc(side * doorTheta), yaw = -side * doorTheta;
        const inner = onArc(side * doorTheta, ARC.r + ARC.thick + 2.2);
        lights.push({ pos: [inner[0], 1.4, inner[2]], color: FIRE, intensity: 2.2, radius: 5.5, kind: 'fire', priority: 5 });
        for (const o of [-1.55, 1.55]) {
          const lp = xf([o, 2.35, 0.22], pos, yaw);
          batch.add('lantern', { pos: [lp[0], lp[1] - 0.25, lp[2]], yaw: yaw }, 0);
          W.at(xf([o, 2.35, 0.08], pos, yaw), yaw, () => W.metal.boxMM(-0.02, -0.02, -0.08, 0.02, 0.02, 0.14, { tint: [0.4, 0.4, 0.44] }));
          lights.push({ pos: [lp[0], lp[1] + 0.02, lp[2]], color: LAMP_WARM, intensity: 1.0, radius: 4.2, kind: 'lantern', halo: 1.0, priority: 4 });
        }
        // a stack of barrels, a crate and the weapon rack on the floor beside each door
        const f = (x: number, z: number): V3 => xf([x, 0, z], pos, yaw);
        if (side < 0) {
          batch.add('barrel', { pos: f(-2.6, 0.7), yaw: 0.4, tint: [0.8, 0.82, 0.9] });
          batch.add('barrel', { pos: f(-3.35, 0.95), yaw: 1.3, tint: [0.75, 0.78, 0.86] });
          batch.add('crate', { pos: f(2.5, 0.75), yaw: 0.2, scale: 1.1 });
          weaponRack(W, f(3.6, 0.5), yaw + 0.05);
        } else {
          batch.add('barrel', { pos: f(-2.6, 0.7), yaw: 0.9, tint: [0.78, 0.8, 0.88] });
          batch.add('barrelOpen', { pos: f(-3.3, 1.0), yaw: 2.1, tint: [0.74, 0.76, 0.84] });
          batch.add('bucket', { pos: f(2.4, 0.6), yaw: 0 });
          batch.add('crate', { pos: f(3.0, 0.8), yaw: -0.3 });
        }
      }
      // ---- the stands behind this segment: four tiers of stone risers, then the back wall
      for (let k = 0; k < TIER.n; k++) {
        const r0 = ARC.r + ARC.thick + k * TIER.depth, r1 = r0 + TIER.depth, hk = TIER.base + (k + 1) * TIER.rise;
        const segLen = door ? DOOR_LEN * (r1 / ARC.r) + 0.05 : 2 * r1 * Math.sin((t1 - t0) / 2) + 0.05, p = onArc(side * (door ? doorTheta : tm), r0);
        const tint: V3 = k % 2 ? stone : [0.8, 0.82, 0.9];
        W.at(p, door ? -side * doorTheta : yaw, () => {
          if (!door) { W.stone.boxMM(-segLen / 2, 0, -(r1 - r0), segLen / 2, hk, 0, { tint, aoY: [0.6, 1], skip: ['-y'] }); return; }
          // over the fighters' tunnel: the tier stands on a lintel
          W.stone.boxMM(-segLen / 2, 0, -(r1 - r0), -1.15, hk, 0, { tint, aoY: [0.6, 1], skip: ['-y'] });
          W.stone.boxMM(1.15, 0, -(r1 - r0), segLen / 2, hk, 0, { tint, aoY: [0.6, 1], skip: ['-y'] });
          W.stone.boxMM(-1.15, 3.0, -(r1 - r0), 1.15, hk, 0, { tint, aoY: [0.8, 1] });
        });
        // spectators: one row per tier, irregular (gaps, clusters), more near the gate where the view is best
        const per = tm > (60 * Math.PI) / 180 ? 0 : door ? 4 : 2;
        for (let s = 0; s < per; s++) {
          if (k > 1 || rng.next() < 0.5) continue;
          const ta = door ? doorTheta - doorHalf : t0, tb = door ? doorTheta + doorHalf : t1;
          const tt = ta + (tb - ta) * ((s + 0.5 + rng.range(-0.25, 0.25)) / per);
          const q = onArc(side * tt, r0 + TIER.depth * 0.45);
          stands.push({ pos: [q[0], hk, q[2]], tier: k });
        }
      }
      }
      {
        const r0 = ARC.r + ARC.thick + TIER.n * TIER.depth, hb = TIER.base + TIER.n * TIER.rise + 1.6;
        const segLen = 2 * (r0 + 0.8) * Math.sin((t1 - t0) / 2) + 0.05, p = onArc(side * tm, r0);
        W.at(p, yaw, () => {
          W.stone.boxMM(-segLen / 2, 0, -0.8, segLen / 2, hb, 0, { tint: stone, aoY: [0.5, 1], skip: ['-y'] });
          // merlons
          for (let m = 0; m < 2; m++) W.stone.boxMM(-segLen / 2 + segLen * (m / 2) + 0.1, hb, -0.8, -segLen / 2 + segLen * ((m + 0.55) / 2), hb + 0.6, 0, { tint: coping, aoY: [0.8, 1] });
        });
        if (i % 4 === 2) {
          // a navy pennant on a pole over the back wall
          const pp = onArc(side * tm, r0 - 0.4 + 0.8);
          W.at([pp[0], hb, pp[2]], yaw, () => W.timber.boxMM(-0.05, 0, -0.05, 0.05, 3.2, 0.05, { tint: [0.5, 0.46, 0.44] }));
          addBanner(W, { pos: [pp[0], hb + 3.05, pp[2]], yaw, w: 0.7, h: 1.5, emblem: tournamentHeraldry() ? (i % 8 === 2 ? 'swords' : 'laurel') : 'fleur', shape: 'pennant', loose: 0.8, rod: true });
        }
        if (i % 9 === 4) {
          const lp = onArc(side * tm, r0 - 0.12);
          batch.add('lantern', { pos: [lp[0], hb - 1.25, lp[2]], yaw }, 0);
          lights.push({ pos: [lp[0], hb - 0.95, lp[2]], color: LAMP_WARM, intensity: 1.6, radius: 6, kind: 'lantern', halo: 1.0, priority: 2 });
        }
      }
    }
  }

  // ---------------------------------------------------------------- the grand gate: two towers, open to the sky, the navy banners
  for (const side of [-1, 1]) {
    const pos = onArc(side * towerTheta, ARC.r - 0.2), yaw = -side * towerTheta;
    W.at(pos, yaw, () => {
      const { w, d, h } = TOWER;
      W.stone.boxMM(-w / 2, 0, -d, w / 2, h, 0.2, { tint: stone, aoY: [0.5, 1.05], skip: ['-y'] });
      W.stone.boxMM(-w / 2 - 0.12, ARC.h - 0.05, -d - 0.12, w / 2 + 0.12, ARC.h + 0.22, 0.32, { tint: coping });
      W.stone.boxMM(-w / 2 - 0.16, h - 0.5, -d - 0.16, w / 2 + 0.16, h - 0.2, 0.36, { tint: coping });
      for (const [mx, mz] of [[-1, 0.36], [0, 0.36], [1, 0.36], [-1, -d + 0.06], [1, -d + 0.06]] as Array<[number, number]>) {
        const cx = mx * (w / 2 - 0.3) * 1.0;
        W.stone.boxMM(cx - 0.3, h - 0.2, mz - 0.22, cx + 0.3, h + 0.55, mz + 0.0, { tint: coping });
      }
      // an arrow slit and a lit window high in the tower
      W.dark.boxMM(-0.12, 5.0, 0.19, 0.12, 6.1, 0.22, {});
      W.glow.box(0, 7.6, 0.21, 0.42, 0.7, 0.02, { uvs: [0.06, 0.66, 0.2, 0.66, 0.2, 0.8, 0.06, 0.8], aux: [0, 1, 0.3, 0], skip: ['-z'] });
      W.stone.boxMM(-0.32, 7.2, 0.2, 0.32, 7.26, 0.3, { tint: coping });
    });
    // the banner on the tower's arena face
    const bp = xf([0, 8.1, 0.32], pos, yaw);
    addBanner(W, { pos: bp, yaw, w: 1.55, h: 3.9, emblem: tournamentHeraldry() ? (side < 0 ? 'duel' : 'crown') : 'fleur', shape: 'swallow', loose: 0.35, rod: true });
    // braziers at the gate's inner corners: fire, embers, a little smoke
    const br: V3 = [side * 6.0, 0, -5.4];   // in front of the towers, clear of the fighters' heads and of the walls (critiques of Passe P2)
    brazier(W, br, F);
    lights.push({ pos: [br[0], 1.75, br[2]], color: FIRE, intensity: 2.0, radius: 4.8, kind: 'fire', halo: 1.3, priority: 8 });
    emitters.push({ kind: 'forge', tag: 'flame', pos: [br[0], 1.32, br[2]], rate: 0.5 }, { kind: 'forge', tag: 'embers', pos: [br[0], 1.45, br[2]], rate: 1 }, { kind: 'chimney', pos: [br[0], 1.9, br[2]], rate: 0.35 });
    // the gate passage's side walls between the towers' backs and the terrace
    // the causeway's low walls from the towers' backs to the balustrade
    const back0 = onArc(side * towerTheta, ARC.r + TOWER.d - 0.4);
    W.stone.boxMM(side > 0 ? GATE_HALF + 0.2 : -GATE_HALF - 0.8, 0, -24.3, side > 0 ? GATE_HALF + 0.8 : -GATE_HALF - 0.2, 1.1, back0[2], { tint: stoneDark, aoY: [0.6, 1] });
    W.stone.boxMM(side > 0 ? GATE_HALF + 0.12 : -GATE_HALF - 0.88, 1.1, -24.3, side > 0 ? GATE_HALF + 0.88 : -GATE_HALF - 0.12, 1.24, back0[2], { tint: coping });
  }

  // ---------------------------------------------------------------- the terrace past the gate: lamps leading to the balustrade
  for (const z of [-17.5, -22.2]) for (const side of [-1, 1]) {
    const pos: V3 = [side * 3.0, 0, z], yaw = side < 0 ? 0 : Math.PI;
    batch.add('lampPost', { pos, yaw, scale: 1 }, 0);
    const lp = xf([0.52, 3.2 - 0.38, 0], pos, yaw);
    lights.push({ pos: lp, color: LAMP_WARM, intensity: 3.2, radius: 8, kind: 'lantern', halo: 1.5, priority: z < -20 ? 3 : 4 });
  }
  {
    const z = -24.6;
    W.stone.boxMM(-14, 0, z - 0.35, 14, 0.25, z + 0.35, { tint: stone, aoY: [0.6, 1] });
    W.stone.boxMM(-14, 0.92, z - 0.32, 14, 1.08, z + 0.32, { tint: coping });
  }
  // balusters: lathed posts along the rail (one builder, translated)
  {
    const z = -24.6, B = new SlotSet();
    B.stone.lathe([[0.11, 0.25], [0.07, 0.4], [0.12, 0.6], [0.07, 0.82], [0.1, 0.92]], 6, { tint: stone });
    for (let x = -13.6; x <= 13.61; x += 0.55) W.append(B, mat([x, 0, z]));
  }

  // ---------------------------------------------------------------- the dueling ring: darker flags inlaid in the floor
  {
    const n = 72, r = 6.9, w = 0.36;
    for (let i = 0; i < n; i++) {
      const a0 = (i / n) * Math.PI * 2, a1 = ((i + 1) / n) * Math.PI * 2, am = (a0 + a1) / 2, len = 2 * r * Math.sin((a1 - a0) / 2) + 0.02;
      W.at([Math.sin(am) * r, 0, -1 + Math.cos(am) * r], am + Math.PI / 2, () => W.stone.boxMM(-len / 2, -0.04, -w / 2, len / 2, 0.012, w / 2, { tint: i % 2 ? [1.25, 1.24, 1.3] : [1.15, 1.14, 1.2], ao: 0.95, skip: ['-y'] }));
    }
    // a medallion at the centre
    W.stone.cylinder(0.9, -0.04, 0.012, 16, { tint: [1.15, 1.14, 1.2], capTop: true });
    W.metal.cylinder(0.32, -0.03, 0.016, 12, { tint: [0.62, 0.52, 0.32], capTop: true });
  }

  // ---------------------------------------------------------------- lamp posts at the ring's back corners (their arms over the ring)
  for (const side of [-1, 1]) {
    const pos: V3 = [side * 5.6, 0, -3.0], yaw = side < 0 ? 0 : Math.PI;
    batch.add('lampPost', { pos, yaw, scale: 1 }, 0);
    const lp = xf([0.52, 3.2 - 0.38, 0], pos, yaw);
    lights.push({ pos: lp, color: LAMP_WARM, intensity: 2.4, radius: 5.2, kind: 'lantern', halo: 1.6, priority: 7 });
  }

  // ---------------------------------------------------------------- the front braziers, just outside the frame: warm pools in the corners
  for (const side of [-1, 1]) {
    const pos: V3 = [side * 7.4, 0, 4.6];
    brazier(W, pos, F);
    lights.push({ pos: [pos[0], 1.75, pos[2]], color: FIRE, intensity: 1.5, radius: 5.5, kind: 'fire', halo: 1.4, priority: 9 });
    emitters.push({ kind: 'forge', tag: 'flame', pos: [pos[0], 1.32, pos[2]], rate: 0.5 }, { kind: 'forge', tag: 'embers', pos: [pos[0], 1.45, pos[2]], rate: 1 });
  }

  // the fighters' key: a cool moonlit fill from the camera side (the bounce of the moon off the stands), not the braziers' amber, so the floor
  // and the walls stay slate and the warm light stays in pools (critique of Passe P1)
  lights.push({ pos: [0, 8, 11], color: [0.6, 0.7, 1.0], intensity: 2.0, radius: 19, kind: 'steady', priority: 10 });

  // ---------------------------------------------------------------- town houses behind the stands (their upper floors over the back wall)
  const houseSlots: Array<{ pos: V3; yaw: number; floors: number; width: number }> = [
    { pos: [-25.5, 0, -16.5], yaw: 0.55, floors: 4, width: 7.2 }, { pos: [-17.5, 0, -23.0], yaw: 0.32, floors: 4, width: 8.0 }, { pos: [-9.5, 0, -27.5], yaw: 0.12, floors: 3, width: 6.6 },
    { pos: [9.8, 0, -27.8], yaw: -0.12, floors: 4, width: 7.0 }, { pos: [17.8, 0, -23.2], yaw: -0.32, floors: 3, width: 7.6 }, { pos: [25.8, 0, -16.8], yaw: -0.55, floors: 4, width: 7.0 },
  ];
  for (const [i, h] of houseSlots.entries()) {
    const res = createMerchantBuilding({
      floors: h.floors, width: h.width, asymmetry: 0.55, overhang: 0.5, timberRatio: 0.55, shopType: 'house', roofStyle: i % 3 === 1 ? 'crooked' : 'gable',
      seed: rng.fork(`house${i}`).seed, chimney: true, balcony: false, dormers: i % 2, palette: (['slate', 'ash', 'mist', 'dusk', 'stone', 'slate'] as const)[i], detail: 0.6, lit: 0.5, stoneGround: true,
    });
    W.append(res.slots, mat(h.pos, h.yaw));
    if (i % 2 === 0) emitters.push({ kind: 'chimney', pos: xf([res.width * 0.22, res.ridgeY + 0.9, -res.depth * 0.5], h.pos, h.yaw), rate: 0.8 });
  }

  // ---------------------------------------------------------------- the city below and the castle hill (the far city's modules)
  const far = new MeshBuilder();
  {
    const r = rng.fork('far');
    const wallPal: V3[] = [[0.3, 0.31, 0.36], [0.34, 0.34, 0.38], [0.26, 0.28, 0.34], [0.36, 0.35, 0.37], [0.3, 0.3, 0.34]];
    const roofPal: V3[] = [[0.12, 0.14, 0.2], [0.15, 0.16, 0.21], [0.1, 0.12, 0.17]];
    const hill = (x: number, z: number) => 34 * Math.exp(-Math.pow((x + 26) / 95, 2) - Math.pow((z + 250) / 70, 2)) * (0.88 + 0.24 * fbm(x * 0.02, z * 0.02, 0, 3, 41));
    const base = (x: number, z: number) => -7 + 7 * smoothstep(-60, -150, z) + hill(x, z);
    // terrain: the lower city's ground and the hill
    const P: V3[][] = [];
    for (let j = 0; j <= 16; j++) { const z = -32 - j * 24, row: V3[] = []; for (let i = 0; i <= 24; i++) { const x = -260 + i * (520 / 24); row.push([x, base(x, z) - 0.6, z]); } P.push(row); }
    far.grid(P, { tint: [0.05, 0.055, 0.07], aux: [0, 0, 0, FAR_KIND.GROUND], flip: true });
    let id = 300;
    // the lower city: rooftops and lit upper floors just over the balustrade, thickening toward the hill
    for (let n = 0; n < 150; n++) {
      const z = r.range(-46, -200), spread = 30 + (-z - 40) * 0.42, x = r.range(-spread, spread), y = base(x, z), s = r.range(0.85, 1.25);
      if (Math.abs(x) < 14 - (-z - 46) * 0.09) continue;   // the gate's axis stays open toward the castle hill
      farHouse(far, { x: Math.round(x), y, z: Math.round(z), w: r.range(5, 8) * s, d: r.range(5, 7) * s, h: r.range(6, 12) * s, wall: r.pick(wallPal), roof: r.pick(roofPal), id: id++, lit: 0.05 + 0.05 * r.next(), hip: r.bool(0.3), timber: z > -110 && r.bool(0.5) });
    }
    // towers of the lower city
    for (const [x, z] of [[-44, -96], [38, -128], [-8, -150]] as Array<[number, number]>) tower(far, x, base(x, z), z, 2.4, 16, 10, [0.3, 0.31, 0.36], [0.1, 0.12, 0.17], id++, 0.2);
    // the castle on its hill, left of the moon
    {
      const cx = -36, cz = -252, cy = base(cx, cz) - 1, cw: V3 = [0.3, 0.3, 0.34], cr: V3 = [0.09, 0.1, 0.15];
      far.boxMM(cx - 15, cy - 4, cz - 11, cx + 15, cy + 10, cz + 11, { tint: cw, aux: [0.08, cy, 900, FAR_KIND.LAND], skip: ['-y'] });
      far.boxMM(cx - 8, cy - 4, cz - 7, cx + 8, cy + 22, cz + 7, { tint: cw, aux: [0.2, cy, 901, FAR_KIND.LAND], skip: ['-y'] });
      for (const [tx, tz] of [[-15, -11], [15, -11], [-15, 11], [15, 11]] as Array<[number, number]>) tower(far, cx + tx, cy, cz + tz, 2.8, 17, 10, cw, cr, id++, 0.2);
      tower(far, cx + 3, cy + 22, cz - 2, 3.4, 10, 16, cw, cr, id++, 0.3);
      tower(far, cx - 5, cy + 22, cz + 4, 1.7, 6, 9, cw, cr, id++, 0.2);
    }
  }
  const farMat = farMaterial(); disposables.push(farMat);
  const farMesh = new THREE.Mesh(far.toGeometry(), farMat); farMesh.name = 'arena:far'; farMesh.frustumCulled = false; farMesh.layers.set(0);
  group.add(farMesh);

  // ---------------------------------------------------------------- floor: the town's wet cobbles with the arena's own mask
  const RECT = { x0: -22, z0: -27, w: 44, h: 38 };
  {
    const mw = 512, mh = Math.round(512 * (RECT.h / RECT.w));
    const tex = new THREE.DataTexture(arenaMask(seed, RECT, mw, mh), mw, mh, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.colorSpace = THREE.NoColorSpace; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true; tex.anisotropy = 4;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true; disposables.push(tex);
    lib.ground.uniforms.tGroundMask.value = tex;
    lib.ground.uniforms.uGroundRect.value.set(RECT.x0, RECT.z0, RECT.w, RECT.h);
    const g = new THREE.PlaneGeometry(90, 52); g.rotateX(-Math.PI / 2); g.translate(0, 0, -1);
    const ground = new THREE.Mesh(g, lib.ground); ground.name = 'arena:ground'; ground.layers.set(LAYER_NOREFLECT); ground.frustumCulled = false;
    group.add(ground);
  }

  // ---------------------------------------------------------------- meshes
  let triangles = 0;
  for (const s of SLOTS) {
    const b = W.get(s as Slot);
    if (!b.vertexCount) continue;
    const mesh = new THREE.Mesh(b.toGeometry(), lib.slot[s as Slot]);
    mesh.name = `arena:${s}`; mesh.frustumCulled = false;
    if (s === 'decal') { mesh.layers.set(LAYER_NOREFLECT); mesh.renderOrder = 2; }
    else if (s !== 'leaf' && s !== 'cloth' && s !== 'banner') mesh.layers.enable(LAYER_CAST);
    triangles += b.triCount;
    group.add(mesh);
  }
  triangles += far.triCount;
  let fire: THREE.Mesh | null = null;
  if (F !== W) {
    const b = F.get('glow');
    fire = new THREE.Mesh(b.toGeometry(), lib.slot.glow); fire.name = 'arena:fire'; fire.frustumCulled = false;
    triangles += b.triCount;
    group.add(fire);
  }
  const props = batch.build(lib.slot, (o, s) => { if (s !== 'leaf' && s !== 'cloth' && s !== 'glow') o.layers.enable(LAYER_CAST); });
  group.add(props);
  const instances = batch.instanceCount;
  return {
    group, lights, emitters, stands, stats: { triangles, instances }, fire,
    dispose() {
      group.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); });
      batch.dispose(); for (const d of disposables) d.dispose();
    },
  };
}

/** an arched door through a wall segment (local: x along the wall, the arena side at z = 0, the wall back to -thick); the opening
 *  2.0 x 2.9 m, a voussoir ring on the arena face, a dark tunnel behind */
function archedDoor(W: SlotSet, len: number, thick: number, h: number, stone: V3, dark: V3): void {
  const hw = 1.0, spring = 1.9, rad = hw;
  W.stone.boxMM(-len / 2, 0, -thick, -hw, h, 0, { tint: stone, aoY: [0.55, 1], skip: ['-y'] });
  W.stone.boxMM(hw, 0, -thick, len / 2, h, 0, { tint: stone, aoY: [0.55, 1], skip: ['-y'] });
  W.stone.boxMM(-hw, spring + rad, -thick, hw, h, 0, { tint: stone, aoY: [0.8, 1] });
  // the arch's head: thin horizontal courses closing the corners of the opening
  for (let y = spring; y < spring + rad - 1e-6; y += 0.05) {
    const w = Math.sqrt(Math.max(0, rad * rad - (y + 0.025 - spring) * (y + 0.025 - spring)));
    W.stone.boxMM(-hw, y, -thick, -w, y + 0.05, 0, { tint: stone, ao: 0.9, skip: ['-x'] });
    W.stone.boxMM(w, y, -thick, hw, y + 0.05, 0, { tint: stone, ao: 0.9, skip: ['+x'] });
  }
  // voussoirs: a ring of wedge blocks proud of the face, a keystone
  const nv = 9;
  for (let k = 0; k < nv; k++) {
    const a = Math.PI - (k + 0.5) * (Math.PI / nv), cx = Math.cos(a) * (rad + 0.17), cy = spring + Math.sin(a) * (rad + 0.17);
    W.at([cx, cy, 0], 0, () => W.with(new THREE.Matrix4().makeRotationZ(a - Math.PI / 2), () => W.stone.boxMM(k === 4 ? -0.15 : -0.12, -0.17, -0.02, k === 4 ? 0.15 : 0.12, k === 4 ? 0.26 : 0.17, 0.09, { tint: k === 4 ? [1, 1, 1.05] : [0.92, 0.93, 1.0] })));
  }
  for (const s of [-1, 1]) W.stone.boxMM(s * hw - (s > 0 ? 0 : 0.2), 0, -0.02, s * hw + (s > 0 ? 0.2 : 0), spring, 0.08, { tint: [0.92, 0.93, 1.0], aoY: [0.6, 1] });
  // the tunnel: a dark box into the stands, its floor and walls catching the glow from inside
  W.dark.boxMM(-hw, 0, -thick - 3.4, hw, spring + rad, -thick, { skip: ['+z', '-y'], flip: true });
  W.planks.boxMM(-hw + 0.02, 0, -thick - 0.06, hw - 0.02, 0.02, -0.01, { tint: dark });
}

/** the weapon rack beside Ren's door: a timber frame holding blades and spears (the arena's own prop, in the town's materials) */
function weaponRack(W: SlotSet, pos: V3, yaw: number): void {
  W.at(pos, yaw, () => {
    const wood: V3 = [0.72, 0.62, 0.54], iron: V3 = [0.62, 0.64, 0.7];
    for (const x of [-0.75, 0.75]) W.timber.boxMM(x - 0.05, 0, -0.05, x + 0.05, 1.45, 0.05, { tint: wood, aoY: [0.6, 1] });
    W.timber.boxMM(-0.8, 1.3, -0.06, 0.8, 1.38, 0.06, { tint: wood });
    W.timber.boxMM(-0.8, 0.35, -0.2, 0.8, 0.42, 0.2, { tint: wood });
    for (let k = 0; k < 5; k++) {
      const x = -0.55 + k * 0.27, lean = (k % 2 ? 0.07 : -0.05);
      if (k % 2) {
        W.at([x, 0.38, 0], 0, () => W.with(new THREE.Matrix4().makeRotationZ(lean), () => { W.metal.boxMM(-0.025, 0.3, -0.006, 0.025, 1.25, 0.006, { tint: iron }); W.metal.boxMM(-0.09, 0.27, -0.02, 0.09, 0.3, 0.02, { tint: [0.7, 0.6, 0.36] }); W.timber.boxMM(-0.016, 0.06, -0.016, 0.016, 0.27, 0.016, { tint: [0.4, 0.3, 0.24] }); }));
      } else {
        W.at([x, 0.38, 0], 0, () => W.with(new THREE.Matrix4().makeRotationZ(lean), () => { W.timber.boxMM(-0.018, 0, -0.018, 0.018, 1.7, 0.018, { tint: wood }); W.metal.boxMM(-0.03, 1.7, -0.008, 0.03, 1.92, 0.008, { tint: iron }); }));
      }
    }
  });
}

/** an iron brazier on a tripod: the bowl, glowing coals (the window glow material; in `F` when it is a set apart), a few iron bands */
function brazier(W: SlotSet, pos: V3, F: SlotSet = W): void {
  const coals = (S: SlotSet) => S.glow.box(0, 1.41, 0, 0.66, 0.05, 0.66, { uvs: [0.06, 0.66, 0.2, 0.66, 0.2, 0.8, 0.06, 0.8], aux: [0, 1, 0.7, 0], skip: ['-y'] });
  W.at(pos, 0, () => {
    const iron: V3 = [0.38, 0.38, 0.42];
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + 0.3, ax = Math.cos(a), az = Math.sin(a);
      W.metal.sweep([[ax * 0.42, 0, az * 0.42], [ax * 0.2, 0.7, az * 0.2], [ax * 0.28, 1.2, az * 0.28]], 0.03, 5, { tint: iron });
    }
    W.metal.lathe([[0.12, 1.08], [0.3, 1.16], [0.44, 1.3], [0.5, 1.42], [0.46, 1.44]], 10, { tint: iron, aoY: [0.6, 1] });
    if (F === W) coals(W);
  });
  if (F !== W) F.at(pos, 0, () => coals(F));
}

/** the arena floor's mask (the ground shader's channels: puddles, grime, wear, contact AO): sand-worn along the dueling line and the ring,
 *  grime and shade at the foot of the walls, puddles where the moonlight through the gate and the lamps fall */
export function arenaMask(seed: number, rect: { x0: number; z0: number; w: number; h: number }, resX: number, resY: number): Uint8Array {
  const out = new Uint8Array(resX * resY * 4);
  const r = new Rng(seed).fork('arenaMask'), ox = r.range(0, 100), oz = r.range(0, 100);
  const puddles = [{ x: 0.9, z: -3.0, r: 2.5, a: 0.95 }, { x: -2.6, z: 1.8, r: 1.3, a: 0.75 }, { x: -6.0, z: -2.0, r: 1.5, a: 0.85 }, { x: 5.6, z: -5.8, r: 1.7, a: 0.85 }, { x: 1.2, z: -14.5, r: 2.2, a: 0.9 }, { x: -1.6, z: -20.5, r: 1.8, a: 0.9 }, { x: 7.5, z: 3.0, r: 1.2, a: 0.6 }];
  const cl = (v: number) => Math.max(0, Math.min(1, v));
  for (let j = 0; j < resY; j++) {
    const z = rect.z0 + ((j + 0.5) / resY) * rect.h;
    for (let i = 0; i < resX; i++) {
      const x = rect.x0 + ((i + 0.5) / resX) * rect.w;
      // distance to the curtain wall (inside the arc) and to the gate passage's walls
      const dc = Math.hypot(x - ARC.cx, z - ARC.cz), inside = z > -11.5 || Math.abs(x) > GATE_HALF;
      const dWall = inside ? Math.max(0, ARC.r - dc) : Math.max(0, Math.abs(x) - 0) * 0 + Math.max(0, GATE_HALF - Math.abs(x));
      let pud = smoothstep(0.56, 0.74, fbm(x * 0.17 + ox, z * 0.17 + oz, 0, 4, 3)) * 0.7;
      const jit = 0.75 + 0.5 * fbm(x * 0.9, z * 0.9, 0, 3, 8);
      for (const b of puddles) { const dx = (x - b.x) / b.r, dz = (z - b.z) / b.r, d2 = dx * dx + dz * dz; if (d2 < 6) pud = Math.max(pud, b.a * Math.exp(-d2 * 1.6) * jit); }
      pud *= smoothstep(0.2, 0.9, dWall);
      // wear: the line the fighters fight along, and a band just inside the ring
      const ring = Math.exp(-Math.pow((Math.hypot(x, z + 1) - 6.3) / 0.6, 2)) * 0.45;
      const line = Math.exp(-Math.pow(z / 1.4, 2)) * smoothstep(7.5, 3.5, Math.abs(x)) * 0.8;
      const path = Math.exp(-Math.pow(x / 1.8, 2)) * smoothstep(-2, -12, z) * 0.6;
      const wear = cl((line + ring + path) * (0.6 + 0.4 * fbm(x * 1.2, z * 1.2, 0, 3, 13)));
      const grime = cl(0.16 + 0.3 * fbm(x * 0.4 + 7, z * 0.4 + 7, 0, 4, 9) + 0.5 * Math.exp(-dWall / 1.2) - wear * 0.25);
      const ao = cl(1 - 0.5 * Math.exp(-dWall / 0.5));
      const k = (j * resX + i) * 4;
      out[k] = cl(pud) * 255; out[k + 1] = grime * 255; out[k + 2] = wear * 255; out[k + 3] = ao * 255;
    }
  }
  return out;
}
