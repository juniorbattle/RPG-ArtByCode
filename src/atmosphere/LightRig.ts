import * as THREE from 'three';
import { U, MAX_LIGHTS, LIGHT_GRID } from './SceneUniforms';
import { vnoise } from '../core/noise';

export type FlickerKind = 'lantern' | 'fire' | 'candle' | 'steady' | 'window' | 'ember';

export interface LightDef {
  pos: [number, number, number];
  color: [number, number, number];
  intensity: number;
  radius: number;
  kind: FlickerKind;
  halo?: number;
  priority?: number;
  tag?: string;
}

export interface LightSource {
  id: number;
  pos: THREE.Vector3;
  color: THREE.Color;
  intensity: number;
  radius: number;
  kind: FlickerKind;
  phase: number;
  group: string;
  priority: number;
  halo: number;
  /** externally animated multiplier (forge state fades, etc.) */
  scale: number;
  targetScale: number;
  /** result of the flicker evaluation this frame (0..~1.4) */
  level: number;
}

const flicker = (kind: FlickerKind, t: number, ph: number): number => {
  const n = (f: number, o = 0) => vnoise(t * f + ph * 17.3 + o, 3.1, 0, 0, 5);
  switch (kind) {
    case 'lantern': return 0.9 + 0.17 * n(2.2) + 0.05 * Math.sin(t * 9.1 + ph * 9) * n(0.7, 40);
    case 'fire': return 0.7 + 0.5 * n(7) + 0.26 * n(19, 11) + 0.06 * Math.sin(t * 31 + ph);
    case 'candle': return 0.8 + 0.34 * n(11, 5) + 0.1 * n(27, 9);
    case 'ember': return 0.5 + 0.9 * n(3.4, 7);
    case 'window': return 0.96 + 0.07 * n(1.3);
    default: return 1;
  }
};

/** reflection pass mirrors the view about the street plane */
const MIRROR_Y = new THREE.Matrix4().makeScale(1, -1, 1);

/** Owns the dynamic warm-light list consumed by every shader (cool ambient + warm local light is the art direction). */
export class LightRig {
  readonly sources: LightSource[] = [];
  lanternGain = 1;
  warmGain = 1;
  /** visibility-driven culling: drop lights that cannot touch any pixel of the current view */
  cull = true;
  /** lights uploaded / culled last frame */
  active = 0;
  culled = 0;
  private nextId = 1;
  private readonly frustum = new THREE.Frustum();
  private readonly mirror = new THREE.Frustum();
  private readonly vp = new THREE.Matrix4();
  private readonly sphere = new THREE.Sphere();

  add(def: LightDef, group: string, phase = Math.random()): LightSource {
    const s: LightSource = {
      id: this.nextId++, pos: new THREE.Vector3(...def.pos), color: new THREE.Color(def.color[0], def.color[1], def.color[2]),
      intensity: def.intensity, radius: def.radius, kind: def.kind, phase, group, priority: def.priority ?? 1, halo: def.halo ?? 0,
      scale: 1, targetScale: 1, level: 1,
    };
    this.sources.push(s);
    return s;
  }

  clearGroup(group: string): void {
    for (let i = this.sources.length - 1; i >= 0; i--) if (this.sources[i].group === group) this.sources.splice(i, 1);
  }
  clear(): void { this.sources.length = 0; }
  byGroup(group: string): LightSource[] { return this.sources.filter((s) => s.group === group); }

  /** A light reaches surfaces within its radius (diffuse / spec) and lays mirror glints on water and puddles
   *  out to 1.6x its radius (lightMirror fades there), so a light whose 1.6r sphere misses both the view frustum
   *  and its mirror image (the planar reflection pass) contributes nothing on screen. */
  private visible(s: LightSource): boolean {
    this.sphere.set(s.pos, s.radius * 1.6);
    return this.frustum.intersectsSphere(this.sphere) || this.mirror.intersectsSphere(this.sphere);
  }

  update(time: number, dt: number, camera?: THREE.Camera): void {
    for (const s of this.sources) {
      s.scale += (s.targetScale - s.scale) * Math.min(1, dt * 2.2);
      const gain = s.kind === 'lantern' ? this.lanternGain : 1;
      s.level = flicker(s.kind, time, s.phase) * s.scale * gain;
    }
    const cull = this.cull && !!camera;
    if (cull) {
      this.vp.multiplyMatrices(camera!.projectionMatrix, camera!.matrixWorldInverse);
      this.frustum.setFromProjectionMatrix(this.vp);
      this.mirror.setFromProjectionMatrix(this.vp.multiply(MIRROR_Y));
    }
    const lit = this.sources.filter((s) => s.scale > 0.01 && s.intensity > 0);
    const sorted = (cull ? lit.filter((s) => this.visible(s)) : lit).sort((a, b) => b.priority - a.priority);
    this.culled = lit.length - sorted.length;
    const n = Math.min(MAX_LIGHTS, sorted.length);
    this.active = n;
    for (let i = 0; i < n; i++) {
      const s = sorted[i];
      U.uLightPos.value[i].set(s.pos.x, s.pos.y, s.pos.z, s.radius);
      const k = s.intensity * s.level;
      U.uLightCol.value[i].set(s.color.r * k, s.color.g * k, s.color.b * k, 1);
    }
    U.uLightCount.value = n;
    U.uWarmGain.value = this.warmGain;
    this.buildGrid(sorted, n);
  }

  /** Light grid: for every ground cell, the uploaded lights whose radius reaches it (xz test, conservative), in
   *  priority order. lightSum() walks only that list instead of all MAX_LIGHTS - same pixels, a fraction of the
   *  work. Rebuilt only when the uploaded light order changes (lights never move). */
  readonly grid = makeGridTexture();
  gridMax = 0;
  private gridSig = '';
  private buildGrid(sorted: LightSource[], n: number): void {
    const sig = sorted.slice(0, n).map((s) => s.id).join(',');
    if (sig === this.gridSig) return;
    this.gridSig = sig;
    const data = this.grid.image.data as Uint8Array;
    data.fill(255);
    let max = 0;
    for (let cz = 0; cz < GRID.nz; cz++) for (let cx = 0; cx < GRID.nx; cx++) {
      const x0 = GRID.x0 + cx * GRID.cw, z0 = GRID.z0 + cz * GRID.cd, cell = cz * GRID.nx + cx;
      let k = 0;
      for (let i = 0; i < n && k < GRID.per; i++) {
        const s = sorted[i];
        const dx = Math.max(x0 - s.pos.x, 0, s.pos.x - (x0 + GRID.cw)), dz = Math.max(z0 - s.pos.z, 0, s.pos.z - (z0 + GRID.cd));
        if (dx * dx + dz * dz >= s.radius * s.radius) continue;
        // texel (cell, k >> 2), channel k & 3
        data[((k >> 2) * GRID.nCells + cell) * 4 + (k & 3)] = i;
        k++;
      }
      max = Math.max(max, k);
    }
    this.gridMax = max;
    this.grid.needsUpdate = true;
  }
}

const GRID = LIGHT_GRID;

function makeGridTexture(): THREE.DataTexture {
  const t = new THREE.DataTexture(new Uint8Array(GRID.nCells * (GRID.per / 4) * 4).fill(255), GRID.nCells, GRID.per / 4, THREE.RGBAFormat, THREE.UnsignedByteType);
  t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; t.needsUpdate = true;
  U.uLightGrid.value = t;
  return t;
}
