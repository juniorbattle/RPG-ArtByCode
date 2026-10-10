import { Rng } from '../core/rng';
import { SlotSet, mat, type V3 } from '../core/MeshBuilder';
import type { InstanceBatch } from './PropGenerator';
import { bush } from './PropGenerator';
import type { MaskObstacle } from '../architecture/StreetComposer';
import type { DistrictConfig } from '../district/MerchantDistrictGenerator';
import { atlasRect } from '../architecture/FacadeGrammar';
import type { BuildingResult } from '../architecture/Types';

/** Simple vegetation: ivy vines climbing facades (alpha-cut leaf cards, wind-swayed) and leafy clumps.
 *  No botanical modelling: leaf-card clusters + instancing do the work. */

function ivyPatch(S: SlotSet, rng: Rng, x: number, height: number, vines: number, spread: number): void {
  for (let v = 0; v < vines; v++) {
    let px = x + rng.range(-0.25, 0.25), py = 0.05;
    let drift = rng.range(-0.04, 0.04);
    while (py < height) {
      py += rng.range(0.07, 0.13);
      drift += rng.range(-0.012, 0.012);
      px += drift;
      const t = py / height;
      const n = 3 + Math.floor((1 - t) * 3);
      for (let k = 0; k < n; k++) {
        const size = rng.range(0.13, 0.24) * (1 - t * 0.25);
        const cell = Math.floor(rng.next() * 16);
        const [u0, v0, u1, v1] = atlasRect(cell % 4, Math.floor(cell / 4), 4, 4, 0.002);
        const lx = px + rng.range(-spread, spread) * (1 + (1 - t)), ly = py + rng.range(-0.1, 0.1);
        const lit = 0.55 + 0.55 * rng.next();
        S.with(mat([lx, ly, 0.14 + rng.range(0, 0.1)], rng.range(-0.35, 0.35), 1, rng.range(-0.5, 0.15), rng.range(0, 6.28)), () => {
          S.leaf.quad([-size / 2, -size / 2, 0], [size / 2, -size / 2, 0], [size / 2, size / 2, 0], [-size / 2, size / 2, 0], {
            uvs: [u0, v0, u1, v0, u1, v1, u0, v1], tint: [0.7 * lit, 1.15 * lit, 0.55 * lit], ao: 0.55 + 0.4 * t, aux: [0.5 + t * 0.4, 0, rng.next(), 0],
          });
        });
      }
    }
  }
}

export function buildVegetation(rng: Rng, cfg: DistrictConfig, buildings: Array<{ id: string; result: BuildingResult; pos: V3; yaw: number }>, world: SlotSet, batch: InstanceBatch, obstacles: MaskObstacle[]): void {
  void batch; void obstacles;
  const dens = cfg.propDensity;
  const patches: Array<{ id: string; x: (w: number) => number; h: number; vines: number }> = [
    { id: 'guild', x: (w) => -w / 2 + 0.55, h: 4.4, vines: 3 },
    { id: 'shopA', x: (w) => w / 2 - 0.45, h: 4.2, vines: 3 },
    { id: 'guild', x: (w) => w / 2 - 1.0, h: 2.4, vines: 2 },
    { id: 'tall', x: (w) => -w / 2 + 0.3, h: 3.0, vines: 2 },
  ];
  for (const p of patches) {
    if (rng.next() > 0.35 + 0.65 * Math.min(1, dens)) continue;
    const b = buildings.find((q) => q.id === p.id);
    if (!b) continue;
    const S = new SlotSet();
    ivyPatch(S, rng.fork(`${p.id}${p.h}`), p.x(b.result.width), p.h, p.vines, 0.16);
    world.append(S, mat(b.pos, b.yaw));
  }
  // leafy clumps: quay foot, stair foot, and a big out-of-focus one in the foreground like a hanging garden
  const clumps: Array<{ p: V3; r: number; n: number; s?: number }> = [
    { p: [-6.8, 0.0, 3.9], r: 0.75, n: 38 }, { p: [-3.4, 0.0, 4.2], r: 0.45, n: 22 }, { p: [13.4, 0.0, 4.1], r: 0.55, n: 26 }, { p: [-8.2, 0.0, -4.2], r: 0.6, n: 30 },
    { p: [-9.6, 0.45, 12.2], r: 1.6, n: 120 }, { p: [-12.4, 0.45, 11.8], r: 1.8, n: 130 },
  ];
  for (const c of clumps) {
    if (c.p[2] < 6 && dens < 0.5) continue;
    const B = bush(rng.fork(`bush${c.p[0]}`), { radius: c.r, count: Math.round(c.n * Math.min(1.3, 0.6 + dens * 0.5)), y: 0 });
    world.append(B, mat(c.p, rng.range(0, 6.28)));
  }
}
