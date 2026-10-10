import * as THREE from 'three';
import { U, MAX_LIGHTS } from './SceneUniforms';
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

/** Owns the dynamic warm-light list consumed by every shader (cool ambient + warm local light is the art direction). */
export class LightRig {
  readonly sources: LightSource[] = [];
  lanternGain = 1;
  warmGain = 1;
  private nextId = 1;

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

  update(time: number, dt: number): void {
    for (const s of this.sources) {
      s.scale += (s.targetScale - s.scale) * Math.min(1, dt * 2.2);
      const gain = s.kind === 'lantern' ? this.lanternGain : 1;
      s.level = flicker(s.kind, time, s.phase) * s.scale * gain;
    }
    const sorted = this.sources.filter((s) => s.scale > 0.01 && s.intensity > 0).sort((a, b) => b.priority - a.priority);
    const n = Math.min(MAX_LIGHTS, sorted.length);
    for (let i = 0; i < n; i++) {
      const s = sorted[i];
      U.uLightPos.value[i].set(s.pos.x, s.pos.y, s.pos.z, s.radius);
      const k = s.intensity * s.level;
      U.uLightCol.value[i].set(s.color.r * k, s.color.g * k, s.color.b * k, 1);
    }
    U.uLightCount.value = n;
    U.uWarmGain.value = this.warmGain;
  }
}
