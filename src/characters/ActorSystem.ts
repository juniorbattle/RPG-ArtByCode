import * as THREE from 'three';
import { Rng } from '../core/rng';
import type { Actor } from './SpriteRenderer';
import type { SpriteAtlas } from './SpriteAtlas';
import type { Collider } from '../architecture/StreetComposer';
import type { DistrictBuild, NpcSpawn } from '../district/MerchantDistrictGenerator';
import type { Anim, Dir } from './SpriteGenerator';

/** Player control + NPC behaviours + a tiny circle-vs-box collision solver. */

const HEIGHT: Record<string, number> = { player: 1.78, blacksmith: 1.82, merchant: 1.66, guardA: 1.8, guardB: 1.8, hooded: 1.84, porter: 1.62, cat: 0.5 };

export class ActorSystem {
  actors: Actor[] = [];
  player!: Actor;
  colliders: Collider[] = [];
  keys = new Set<string>();
  private nextId = 1;
  private district: DistrictBuild | null = null;
  camYaw = 0;
  interactTarget: Actor | null = null;
  nearForge = false;
  onInteractForge: (() => void) | null = null;
  talkTimer = 0;

  constructor(private atlas: SpriteAtlas) {
    window.addEventListener('keydown', (e) => {
      const k = e.key.toLowerCase();
      this.keys.add(k);
      if (k === 'e' || k === ' ') this.interact();
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    window.addEventListener('blur', () => this.keys.clear());
  }

  spawn(spec: string, role: string, pos: THREE.Vector3, o: Partial<Actor> = {}): Actor {
    const a: Actor = {
      id: this.nextId++, spec, role, detail: this.atlas.specs.get(spec)?.detail ?? 'crowd', pos: pos.clone(), facing: 'down', dir: 'down', flip: false, anim: 'idle', t: Math.random() * 3,
      speed: 0, tint: [1, 1, 1], scale: 1, height: HEIGHT[spec] ?? 1.7, radius: 0.28, ...o,
    };
    this.actors.push(a);
    return a;
  }

  clear(): void { this.actors.length = 0; }

  populate(d: DistrictBuild, density: number, seed: number): void {
    this.district = d; this.colliders = d.colliders;
    const keepPlayer = this.player && this.actors.includes(this.player) ? this.player.pos.clone() : null;
    this.clear();
    const rng = new Rng(seed).fork('npc');
    const spawnPos = keepPlayer ?? new THREE.Vector3(...d.spawn);
    this.player = this.spawn('player', 'player', spawnPos, { behaviour: { kind: 'player', seed: 1 }, radius: 0.3, tint: [1.08, 1.06, 1.04] });
    for (const n of d.npcs) this.spawnNpc(n, rng);
    // ambient crowd: simplified sprites, count follows NPC density
    const crowd = ['crowd0', 'crowd1', 'crowd2', 'crowd3', 'crowd4'].filter((id) => this.atlas.specs.has(id));
    const n = Math.round(3 * density);
    const taken: THREE.Vector3[] = [spawnPos, ...d.npcs.map((q) => new THREE.Vector3(...q.pos))];
    for (let i = 0; i < n; i++) {
      let p: THREE.Vector3 | null = null;
      for (let k = 0; k < 20 && !p; k++) { const c = this.randomFree(rng); if (c && taken.every((t) => Math.hypot(t.x - c.x, t.z - c.z) > 3.2)) p = c; }
      if (p) taken.push(p);
      if (!p) continue;
      this.spawn(rng.pick(crowd), 'crowd', p, { behaviour: { kind: 'wander', seed: rng.int(1, 99999), wait: rng.range(0, 4), target: null }, tint: [rng.range(0.9, 1.1), rng.range(0.9, 1.1), rng.range(0.9, 1.1)], scale: rng.range(0.95, 1.04) });
    }
    if (this.atlas.specs.has('porter') && density > 0.3) this.spawn('porter', 'porter', this.randomFree(rng) ?? new THREE.Vector3(7, 0, 2.5), { behaviour: { kind: 'wander', seed: 7, wait: 1, target: null }, anim: 'carry' });
  }

  private spawnNpc(n: NpcSpawn, rng: Rng): void {
    const p = new THREE.Vector3(...n.pos);
    const wp = n.waypoints?.map((w) => new THREE.Vector3(...w));
    const kind: 'idle' | 'patrol' | 'wander' | 'work' = n.role.endsWith('work') ? 'work' : wp && wp.length > 1 ? 'patrol' : n.role.includes('wander') ? 'wander' : 'idle';
    const a = this.spawn(n.archetype, n.role, p, { behaviour: { kind, waypoints: wp, wait: rng.range(0, 3), idx: 0, target: null, seed: rng.int(1, 99999) } });
    if (n.facing !== undefined) this.face(a, new THREE.Vector3(Math.sin(n.facing), 0, Math.cos(n.facing)));
    if (n.role.endsWith('work')) a.anim = 'hammer';
    if (n.role.includes('talk')) { a.anim = 'talk'; a.bubble = 'dots'; }
    if (n.role.includes('alarm')) a.bubble = 'exclaim';
  }

  private randomFree(rng: Rng): THREE.Vector3 | null {
    for (let i = 0; i < 40; i++) {
      const p = new THREE.Vector3(rng.range(-4.5, 14), 0, rng.range(-2.6, 3.6));
      if (this.walkable(p.x, p.z, 0.4)) return p;
    }
    return null;
  }

  walkable(x: number, z: number, r: number): boolean {
    const inStreet = x > -6.6 && x < 15.2 && z > -3.7 && z < 4.15;
    const s = this.district;
    const inStairs = x > -7.4 && x < -4.8 && z < -3.6 && z > -9.6;
    if (!inStreet && !inStairs) return false;
    void s;
    for (const c of this.colliders) {
      if (c.kind === 'circle') { if (Math.hypot(x - c.x, z - c.z) < c.r + r) return false; }
      else if (x > c.x0 - r && x < c.x1 + r && z > c.z0 - r && z < c.z1 + r) return false;
    }
    return true;
  }

  private resolve(a: Actor, nx: number, nz: number): void {
    // axis-separated slide against colliders
    if (this.walkable(nx, a.pos.z, a.radius)) a.pos.x = nx;
    if (this.walkable(a.pos.x, nz, a.radius)) a.pos.z = nz;
  }

  face(a: Actor, v: THREE.Vector3): void {
    if (v.lengthSq() < 1e-6) return;
    const c = Math.cos(this.camYaw), s = Math.sin(this.camYaw);
    const sx = v.x * c - v.z * s;   // along camera right
    const sd = v.x * s + v.z * c;   // toward camera
    if (Math.abs(sd) >= Math.abs(sx) * 0.85) { a.dir = sd > 0 ? 'down' : 'up'; a.flip = false; }
    else { a.dir = 'side' as Dir; a.flip = sx > 0; }
  }

  private setAnim(a: Actor, anim: Anim): void { if (a.anim !== anim) { a.anim = anim; } }

  interact(): void {
    if (this.nearForge) this.onInteractForge?.();
    else if (this.interactTarget) { this.talkTimer = 2.5; }
  }

  update(dt: number, elapsed: number): void {
    const p = this.player;
    const c = Math.cos(this.camYaw), s = Math.sin(this.camYaw);
    // --- player
    const k = this.keys;
    const ix = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    const iy = (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0);
    const run = k.has('shift') ? 1.7 : 1;
    // screen right = (c, -s), toward-camera = (s, c); "up" on screen = away from camera
    const mv = new THREE.Vector3(c * ix - s * iy, 0, -s * ix - c * iy);
    if (mv.lengthSq() > 0) {
      mv.normalize().multiplyScalar(2.5 * run * dt);
      this.resolve(p, p.pos.x + mv.x, p.pos.z + mv.z);
      this.face(p, mv);
      this.setAnim(p, 'walk'); p.t += dt * run;
    } else { this.setAnim(p, 'idle'); p.t += dt; }
    p.pos.y = this.district?.heightAt(p.pos.x, p.pos.z) ?? 0;

    // --- NPCs
    this.interactTarget = null; this.nearForge = false;
    for (const a of this.actors) {
      if (a === p) continue;
      a.t += dt;
      if (a.anim === 'hammer') a.t = elapsed;
      const b = a.behaviour;
      if (b) this.behave(a, b, dt, elapsed);
      a.pos.y = a.spec === 'cat' ? a.pos.y : (this.district?.heightAt(a.pos.x, a.pos.z) ?? 0);
      const dx = a.pos.x - p.pos.x, dz = a.pos.z - p.pos.z;
      if (a.detail !== 'crowd' && dx * dx + dz * dz < 4 && !this.interactTarget) this.interactTarget = a;
    }
    const f = this.district?.forgeFocus;
    if (f && Math.hypot(p.pos.x - f[0], p.pos.z - f[2]) < 4.2) this.nearForge = true;
    this.talkTimer = Math.max(0, this.talkTimer - dt);
    if (this.interactTarget && this.talkTimer > 0) {
      const t = this.interactTarget;
      this.face(t, new THREE.Vector3(p.pos.x - t.pos.x, 0, p.pos.z - t.pos.z));
      if (this.atlas.counts.has(`${t.spec}/talk`)) t.anim = 'talk';
      t.bubble = 'dots';
    }
  }

  private behave(a: Actor, b: NonNullable<Actor['behaviour']>, dt: number, elapsed: number): void {
    if (b.kind === 'idle' || b.kind === 'work') {
      if (b.kind === 'idle' && a.anim !== 'talk' && a.anim !== 'idle') a.anim = 'idle';
      return;
    }
    if (a.spec === 'cat') { a.anim = 'idle'; return; }
    if ((b.wait ?? 0) > 0) { b.wait = (b.wait ?? 0) - dt; if (a.anim !== 'talk') this.setAnim(a, 'idle'); return; }
    if (!b.target) {
      if (b.kind === 'patrol' && b.waypoints) { b.idx = ((b.idx ?? 0) + 1) % b.waypoints.length; b.target = b.waypoints[b.idx].clone(); }
      else {
        const r = new Rng(b.seed + Math.floor(elapsed * 10));
        for (let i = 0; i < 12; i++) {
          const t = new THREE.Vector3(r.range(-4.5, 14.5), 0, r.range(-2.6, 3.7));
          if (this.walkable(t.x, t.z, 0.35)) { b.target = t; break; }
        }
        if (!b.target) { b.wait = 2; return; }
      }
    }
    const to = b.target!.clone().sub(a.pos); to.y = 0;
    const dist = to.length();
    if (dist < 0.2) { b.target = null; b.wait = 1.5 + (b.seed % 5); return; }
    to.normalize();
    const speed = a.spec === 'porter' ? 0.9 : a.detail === 'crowd' ? 0.95 : 0.8;
    const nx = a.pos.x + to.x * speed * dt, nz = a.pos.z + to.z * speed * dt;
    const ox = a.pos.x, oz = a.pos.z;
    this.resolve(a, nx, nz);
    if (Math.abs(a.pos.x - ox) + Math.abs(a.pos.z - oz) < speed * dt * 0.2) { b.target = null; b.wait = 0.8; return; }
    this.face(a, to);
    this.setAnim(a, a.spec === 'porter' ? 'carry' : 'walk');
  }
}
