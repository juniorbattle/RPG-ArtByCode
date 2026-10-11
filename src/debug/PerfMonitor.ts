import type * as THREE from 'three';
import { GpuTimer } from './GpuTimer';

export interface PerfSnapshot {
  fps: number; frameMs: number; cpuMs: number; drawCalls: number; triangles: number; textures: number; geometries: number; textureMB: number;
  lights: number; actors: number; generatorMs: number; district: { triangles: number; instances: number; buildings: number; windows: number };
  resolution: string;
  /** smoothed GPU ms per pass (only when the GPU timer is enabled) */
  gpu?: Record<string, number>; gpuMs?: number;
  /** visibility-driven cleanup counters (see VisibilitySets) */
  visibility?: Record<string, number | string>;
  /** player occlusion reveal: eligible occluders, active ones, proxy tests, detection CPU ms */
  occlusion?: Record<string, number | string>;
}

/** FPS / frame time / draw calls / triangles / texture memory, accumulated across every pass of the frame
 *  (shadow, planar reflection, scene, DOF, bloom, grade) because renderer.info is reset manually per frame. */
export class PerfMonitor {
  fps = 60;
  frameMs = 16;
  cpuMs = 0;
  drawCalls = 0;
  triangles = 0;
  gpu!: GpuTimer;
  private last = performance.now();
  private cpuStart = 0;
  private acc = 0; private n = 0;
  private fpsSamples: number[] = [];

  attach(gl: WebGL2RenderingContext): void { this.gpu = new GpuTimer(gl); }

  beginFrame(): void { this.cpuStart = performance.now(); }

  endFrame(r: THREE.WebGLRenderer): void {
    const now = performance.now();
    const dt = now - this.last; this.last = now;
    this.cpuMs += (now - this.cpuStart - this.cpuMs) * 0.1;
    this.frameMs += (dt - this.frameMs) * 0.08;
    this.fps = 1000 / Math.max(0.1, this.frameMs);
    this.drawCalls = r.info.render.calls;
    this.triangles = r.info.render.triangles;
    this.acc += dt; this.n++;
    if (this.fpsSamples.length > 240) this.fpsSamples.shift();
    this.fpsSamples.push(dt);
  }

  /** 1% low fps over the last ~4 s */
  low1(): number {
    if (!this.fpsSamples.length) return 0;
    const s = [...this.fpsSamples].sort((a, b) => b - a);
    return 1000 / s[Math.floor(s.length * 0.01)];
  }
}
