import * as THREE from 'three';
import { Rng } from '../core/rng';
import { SlotSet, MeshBuilder, mat, SLOTS, type V3, type Slot } from '../core/MeshBuilder';
import { fbm, smoothstep } from '../core/noise';
import type { MaterialLibrary } from '../materials/MaterialLibrary';
import type { LightDef } from '../atmosphere/LightRig';
import { LAYER_CAST, LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import { InstanceBatch } from '../props/PropGenerator';
import { addBanner } from '../props/Banners';
import { createMerchantBuilding } from '../architecture/BuildingGenerator';
import { farHouse, farMaterial, FAR_KIND } from '../district/DistantCity';
import type { Emitter } from '../district/MerchantDistrictGenerator';

/** Lantern Row, the slice's light third place (choice P3, journal Passe L6): a mock-up, announced as such, built only from the Merchant
 *  District's own generators (its timber houses, lamp posts, lanterns, barrels and crates, its banners, its far-city modules), seen from
 *  one fixed framing and never baked. A narrow street of taverns and gaming houses that wakes at night (PROJECT § 8.1: « Nuit : tournoi
 *  comme réseau social, économique et clandestin »): the houses face each other across 7 m of wet cobbles, paper lanterns strung over
 *  the street, the light kept in amber pools (the art direction: indigo / slate, amber the only warm accent). Layout (metres): the street
 *  runs along -z from the camera; the left row at x = -3.6 faces +x, the right row at x = 3.6 faces -x. */

export interface PlaceBuild {
  group: THREE.Group; lights: LightDef[]; emitters: Emitter[];
  stats: { triangles: number; instances: number; buildings: number };
  dispose(): void;
}

const WARM: [number, number, number] = [1.0, 0.6, 0.27];
const HALF = 3.6;

export function buildLanternRow(lib: MaterialLibrary, seed: number): PlaceBuild {
  const rng = new Rng(seed).fork('lantern-row');
  const group = new THREE.Group(); group.name = 'lantern-row';
  const W = new SlotSet(), batch = new InstanceBatch(seed ^ 0x51a7, 3);
  const lights: LightDef[] = [], emitters: Emitter[] = [], disposables: Array<{ dispose(): void }> = [];
  let buildings = 0;

  // ---------------------------------------------------------------- the two rows of houses, from the camera down the street
  for (const side of [-1, 1]) {
    let z = 2;
    for (let i = 0; i < 6; i++) {
      const r = rng.fork(`h${side}:${i}`), width = r.range(5.4, 7.6), floors = r.int(2, 4);
      const shop = (i === 1 && side < 0) ? 'tavern' : (i === 2 && side > 0) ? 'tavern' : r.pick(['house', 'general', 'house', 'apothecary'] as const);
      const res = createMerchantBuilding({
        floors, width, asymmetry: 0.6, overhang: 0.55, timberRatio: 0.6, shopType: shop, roofStyle: r.bool(0.35) ? 'crooked' : 'gable',
        seed: r.seed, chimney: r.bool(0.6), balcony: r.bool(0.3), dormers: r.int(0, 1), palette: r.pick(['slate', 'ash', 'mist', 'dusk', 'stone'] as const), detail: i < 4 ? 0.9 : 0.6,
        lit: 0.75, stoneGround: r.bool(0.5),
      });
      const zc = z - width / 2, pos: V3 = [side * (HALF + 0.05), 0, zc], yaw = side < 0 ? Math.PI / 2 : -Math.PI / 2;
      W.append(res.slots, mat(pos, yaw));
      for (const l of res.lights) lights.push({ ...l, pos: xf(l.pos, pos, yaw), priority: Math.min(l.priority ?? 5, 6) });
      if (res.params.chimney && i % 2 === 0) emitters.push({ kind: 'chimney', pos: xf([res.width * 0.2, res.ridgeY + 0.9, -res.depth * 0.5], pos, yaw), rate: 0.6 });
      buildings++;
      z -= width + r.range(0.05, 0.35);
    }
  }

  // ---------------------------------------------------------------- paper lanterns strung over the street, lamp posts at its mouth
  for (let k = 0; k < 6; k++) {
    const z = -1.5 - k * 5.2, y = 4.4 + Math.sin(k * 1.7) * 0.25;
    for (const t of [-0.55, 0, 0.55]) batch.add(k % 2 ? 'lantern' : 'lanternDark', { pos: [t * HALF * 1.4, y - Math.abs(t) * -0.35, z], yaw: k * 0.7, scale: 0.9 });
    if (k % 2 === 1) lights.push({ pos: [0, y - 0.2, z], color: WARM, intensity: 1.6, radius: 6.5, kind: 'lantern', halo: 1.2, priority: 8 });
  }
  for (const side of [-1, 1]) {
    const pos: V3 = [side * 2.7, 0, 0.8];
    batch.add('lampPost', { pos, yaw: side < 0 ? 0 : Math.PI, scale: 1 }, 0);
    lights.push({ pos: xf([0.52, 3.2 - 0.38, 0], pos, side < 0 ? 0 : Math.PI), color: WARM, intensity: 2.2, radius: 5.5, kind: 'lantern', halo: 1.5, priority: 9 });
  }
  // the clutter of a tavern street, at the focal points only (the doors)
  for (const [x, z, k] of [[-2.7, -4.0, 'barrel'], [-2.9, -4.7, 'barrelOpen'], [2.8, -11.2, 'crate'], [2.6, -11.9, 'barrel'], [-2.8, -17.5, 'stool'], [-2.4, -17.9, 'stool'], [2.9, -2.5, 'chalkboard']] as Array<[number, number, string]>) {
    batch.add(k, { pos: [x, 0, z], yaw: x * 1.3 + z * 0.2 });
  }
  // two banners of the betting houses, the tournament's navy and ivory
  addBanner(W, { pos: [-HALF + 0.35, 3.1, -9.0], yaw: Math.PI / 2, w: 0.9, h: 1.9, emblem: 'tankard', shape: 'swallow', loose: 0.6 });
  addBanner(W, { pos: [HALF - 0.35, 3.3, -15.5], yaw: -Math.PI / 2, w: 0.9, h: 1.9, emblem: 'scales', shape: 'swallow', loose: 0.6, tint: [0.86, 0.62, 0.66] });
  // the street's end: a far wall of houses and the castle hill's lights, so the view closes on the city
  const far = new MeshBuilder();
  {
    const r = rng.fork('far');
    let id = 400;
    for (let n = 0; n < 14; n++) farHouse(far, { x: r.range(-14, 14), y: 0, z: -40 - r.range(0, 30), w: r.range(5, 8), d: r.range(5, 7), h: r.range(8, 14), wall: [0.3, 0.31, 0.36], roof: [0.12, 0.14, 0.2], id: id++, lit: 0.12, hip: r.bool(0.3), timber: r.bool(0.5) });
    far.boxMM(-30, -1, -110, 30, 0, -30, { tint: [0.05, 0.055, 0.07], aux: [0, 0, 0, FAR_KIND.GROUND] });
  }
  const farMat = farMaterial(); disposables.push(farMat);
  const farMesh = new THREE.Mesh(far.toGeometry(), farMat); farMesh.name = 'row:far'; farMesh.frustumCulled = false;
  group.add(farMesh);

  // ---------------------------------------------------------------- the wet cobbles, puddles under the lanterns
  const RECT = { x0: -8, z0: -40, w: 16, h: 44 };
  {
    const mw = 256, mh = Math.round(256 * (RECT.h / RECT.w)), mask = new Uint8Array(mw * mh * 4);
    for (let j = 0; j < mh; j++) for (let i = 0; i < mw; i++) {
      const x = RECT.x0 + ((i + 0.5) / mw) * RECT.w, z = RECT.z0 + ((j + 0.5) / mh) * RECT.h, wall = Math.max(0, HALF - Math.abs(x));
      const pud = smoothstep(0.6, 0.76, fbm(x * 0.21 + 3, z * 0.21 + 9, 0, 4, 5)) * smoothstep(0.3, 1.2, wall) * 0.75;
      const k = (j * mw + i) * 4;
      mask[k] = pud * 230; mask[k + 1] = (0.2 + 0.35 * fbm(x * 0.5, z * 0.5, 0, 3, 2)) * 255;
      mask[k + 2] = Math.exp(-Math.pow(x / 1.4, 2)) * 120; mask[k + 3] = (1 - 0.5 * Math.exp(-wall / 0.45)) * 255;
    }
    const tex = new THREE.DataTexture(mask, mw, mh, THREE.RGBAFormat, THREE.UnsignedByteType);
    tex.colorSpace = THREE.NoColorSpace; tex.magFilter = THREE.LinearFilter; tex.minFilter = THREE.LinearMipmapLinearFilter; tex.generateMipmaps = true;
    tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping; tex.needsUpdate = true; disposables.push(tex);
    lib.ground.uniforms.tGroundMask.value = tex;
    lib.ground.uniforms.uGroundRect.value.set(RECT.x0, RECT.z0, RECT.w, RECT.h);
    const g = new THREE.PlaneGeometry(40, 60); g.rotateX(-Math.PI / 2); g.translate(0, 0, -18);
    const ground = new THREE.Mesh(g, lib.ground); ground.name = 'row:ground'; ground.layers.set(LAYER_NOREFLECT); ground.frustumCulled = false;
    group.add(ground);
  }

  let triangles = far.triCount;
  for (const s of SLOTS) {
    const b = W.get(s as Slot);
    if (!b.vertexCount) continue;
    const mesh = new THREE.Mesh(b.toGeometry(), lib.slot[s as Slot]);
    mesh.name = `row:${s}`; mesh.frustumCulled = false;
    if (s === 'decal') { mesh.layers.set(LAYER_NOREFLECT); mesh.renderOrder = 2; }
    else if (s !== 'leaf' && s !== 'cloth' && s !== 'banner') mesh.layers.enable(LAYER_CAST);
    triangles += b.triCount;
    group.add(mesh);
  }
  const props = batch.build(lib.slot, (o, s) => { if (s !== 'leaf' && s !== 'cloth' && s !== 'glow') o.layers.enable(LAYER_CAST); });
  group.add(props);
  return {
    group, lights, emitters, stats: { triangles, instances: batch.instanceCount, buildings },
    dispose() { group.traverse((o) => { const m = o as THREE.Mesh; if (m.geometry) m.geometry.dispose(); }); batch.dispose(); for (const d of disposables) d.dispose(); },
  };
}

const xf = (p: V3, pos: V3, yaw: number): V3 => { const c = Math.cos(yaw), s = Math.sin(yaw); return [pos[0] + p[0] * c + p[2] * s, pos[1] + p[1], pos[2] - p[0] * s + p[2] * c]; };
