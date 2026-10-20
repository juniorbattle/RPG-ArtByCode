import * as THREE from 'three';
import { Rng } from '../core/rng';
import type { Actor } from './SpriteRenderer';
import type { SpriteAtlas } from './SpriteAtlas';
import type { Collider } from '../architecture/StreetComposer';
import type { DistrictBuild, NpcSpawn } from '../district/MerchantDistrictGenerator';
import type { Anim, Dir } from './SpriteGenerator';
import { requiredFrames, type AuthoredSpawn } from './BakedSprites';
import type { CastMember } from './BakedCast';
import { variantOf } from './Variants';

/** Player control + NPC behaviours + a tiny circle-vs-box collision solver. */

const HEIGHT: Record<string, number> = { player: 1.78, blacksmith: 1.82, merchant: 1.66, guardA: 1.8, guardB: 1.8, hooded: 1.84, porter: 1.62, cat: 0.5 };

/** a baked walker's animation clock runs at the speed its steps show over the ground speed its cycle draws (walkClock), within these
 *  bounds: above, a cycle drawn for a much slower walk would race (the dock worker's); below, a profile seen walking almost into the depth
 *  would freeze (journal Passe S2) */
const WALK_CLOCK_MIN = 0.4, WALK_CLOCK_MAX = 1.6;
/** the generated player: 2.5 m/s, x1.7 with the run key (its frames simply play faster) */
const PLAYER_SPEED = 2.5, PLAYER_RUN = 1.7;
/** a baked player runs at the speed its run cycle draws (journal Passe H6, the operator's « Héros plus rapide (Recommandé) »: the sheet's
 *  stride kept, the speed follows it): the cast's walkSpeed x the character scale of B / D x HERO_CLOCK, i.e. its frames play at
 *  HERO_CLOCK x the base cadence in B / D with the planted foot on the ground. A 14-texel stride (hero-x2-v2 rebuilt from its Pass H6 rig):
 *  3.73 m/s; the 9-texel export of Pass H5: 2.40 m/s */
const HERO_CLOCK = 1.5, HERO_REF_SCALE = 1.12;
/** the run key on a baked hero: its cycle is already a run, a sprint at x1.2 (4.48 m/s with a 14-texel stride); its clock bound is
 *  HERO_CLOCK_MAX (the cycle is drawn for the hero's own speed: the NPCs' bound, a slow cycle racing, does not apply), which keeps the sprint
 *  within its cycle in A too (character scale 1: clock 2.02, 1 % of slip) */
const HERO_RUN = 1.2, HERO_CLOCK_MAX = 2;
/** a walking facing turns to profile beyond 50 deg from the screen vertical and back to front / back below 40 deg (see screenFacing) */
const SIDE_IN = Math.tan(THREE.MathUtils.degToRad(50)), SIDE_OUT = Math.tan(THREE.MathUtils.degToRad(40));
/** the five-view rule (journal Passe V5; the study's sectors, art-lab/characters/briefs/three-quarter-views.md): the on-screen step's angle
 *  from the vertical, front / back below 22.5 deg, three-quarter from 22.5 to 67.5, profile beyond; each edge held V5_HOLD deg past it from
 *  the side the walker is on (a straight walk never flickers between two views) */
const V5_IN = 22.5, V5_OUT = 67.5, V5_HOLD = 5;
export function fiveViewFacing(prev: Dir, dx: number, dy: number): Dir {
  const ang = THREE.MathUtils.radToDeg(Math.atan2(Math.abs(dx), Math.abs(dy))), up = dy > 0;
  const cur = prev === 'side' ? 2 : prev === 'downSide' || prev === 'upSide' ? 1 : 0;
  const edge1 = V5_IN + (cur === 0 ? V5_HOLD : cur === 1 ? -V5_HOLD : 0), edge2 = V5_OUT + (cur === 1 ? V5_HOLD : cur === 2 ? -V5_HOLD : 0);
  if (ang > edge2) return 'side';
  if (ang >= edge1) return up ? 'upSide' : 'downSide';
  return up ? 'up' : 'down';
}
const _p0 = new THREE.Vector3(), _p1 = new THREE.Vector3();

export class ActorSystem {
  actors: Actor[] = [];
  player!: Actor;
  colliders: Collider[] = [];
  keys = new Set<string>();
  private nextId = 1;
  private district: DistrictBuild | null = null;
  /** camera yaw: picks which sprite direction faces the viewer */
  camYaw = 0;
  /** yaw the movement keys are mapped through: latched while a key is held so a camera blend never bends
   *  the direction the player is already walking (re-synced by the app when input is released) */
  controlYaw = 0;
  interactTarget: Actor | null = null;
  nearForge = false;
  onInteractForge: (() => void) | null = null;
  talkTimer = 0;
  /** authored NPCs (baked sheets; EXPERIMENTAL, DEV flag only today): spawned after every seeded spawn, outside the district RNG */
  authored: AuthoredSpawn[] = [];
  /** production baked sheets standing in for generated archetypes (`BakedCast.ts`): same spawns, roles, behaviours and RNG draws */
  cast = new Map<string, CastMember>();
  /** the camera's character scale (set by the app every frame): a sprite drawn larger takes longer strides on the ground */
  charScale = 1;
  /** ambient walkers when set (`?crowd=<n>`, journal Passe C1): n walkers, the five townsfolk in turn; null = round(5 x density), in turn too
   *  (the operator's decision of 2026-10-19, « Cinq par défaut », journal Passe C2: at density 1 each approved townsperson walks once) */
  crowdCount: number | null = null;
  /** a day state's walkers at density 1 (DayState's `crowd`: morning 6, midday 12, end of day 9, the operator's decision J7a, journal Passe
   *  D7): round(crowdBase x density) without ?crowd; null = the night's five */
  crowdBase: number | null = null;

  /** the five-view rule for walking facings (fiveViewFacing, journal Passe V5; the default since the operator's decision of 2026-10-19,
   *  Passes D3 / H10; `?views=3` turns it off), for the sheets that have the two three-quarter facings only: every other sprite keeps the
   *  three-view rule, unchanged */
  views5 = true;
  private has34 = new Map<string, boolean>();

  /** camera: shows a walking facing by its on-screen direction (null: the world rule for every facing) */
  constructor(private atlas: SpriteAtlas, private camera: THREE.PerspectiveCamera | null = null) {
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
      id: this.nextId++, spec, role, detail: this.atlas.specs.get(spec)?.detail ?? 'crowd', pos: pos.clone(), facing: 'down', dir: 'down', flip: false, anim: 'idle', t: o.t ?? Math.random() * 3,
      speed: 0, tint: [1, 1, 1], scale: 1, height: HEIGHT[spec] ?? 1.7, radius: 0.28, ...o,
    };
    // a production baked sheet takes the archetype's place: its sprite, presentation scale and height; the detail tier, role and
    // behaviour stay the archetype's (the cast loader checked that the sheet holds idle + walk in every facing)
    const c = this.cast.get(spec);
    if (c) {
      a.base = spec; a.spec = c.id; a.scale *= c.scale; a.height = c.height;
      // a baked sheet keeps its own colours: the crowd's random tint (the variety device of the generated templates) is not applied to it
      // (the RNG draws that made it stay; the other spawns had no tint)
      a.tint = [1, 1, 1];
      if (!this.atlas.counts.has(`${a.spec}/${a.anim}`)) a.anim = 'idle';
      // NPC variant (journal Passe V1): from the actor's id or fixed per archetype, never from the RNG (every seeded draw stays)
      const cv = c.variants;
      if (cv) { const v = variantOf(a.id, cv.list.length, cv.fixed?.[spec]); if (v > 0) a.variant = { hair: cv.list[v - 1][0], skin: cv.list[v - 1][1], hairRange: cv.hair, skinRange: cv.skin }; }
    }
    this.actors.push(a);
    return a;
  }

  clear(): void { this.actors.length = 0; }

  /** the same district rebuilt (resize re-bake, same seed and config): actors keep their state and follow the new build */
  rebind(d: DistrictBuild): void { this.district = d; this.colliders = d.colliders; }

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
    const n = this.crowdCount ?? Math.round((this.crowdBase ?? 5) * density);
    const taken: THREE.Vector3[] = [spawnPos, ...d.npcs.map((q) => new THREE.Vector3(...q.pos))];
    for (let i = 0; i < n; i++) {
      let p: THREE.Vector3 | null = null;
      for (let k = 0; k < 20 && !p; k++) { const c = this.randomFree(rng); if (c && taken.every((t) => Math.hypot(t.x - c.x, t.z - c.z) > 3.2)) p = c; }
      // ?crowd=<n> and the day states (journal Passe R3; the operator's decision J7b « Accepter », Passe D7): the quay holds 8 walkers at most
      // 3.2 m apart, so a walker that found no place tries again 2.2 then 1.4 m apart; the night's default never comes here (its draws stay)
      if (!p && (this.crowdCount !== null || this.crowdBase !== null)) {
        for (const gap of [2.2, 1.4]) for (let k = 0; k < 20 && !p; k++) { const c = this.randomFree(rng); if (c && taken.every((t) => Math.hypot(t.x - c.x, t.z - c.z) > gap)) p = c; }
      }
      if (p) taken.push(p);
      if (!p) continue;
      // the townsfolk in turn; the old random pick is still drawn, so every later draw of the district RNG keeps its place
      rng.pick(crowd);
      this.spawn(crowd[i % crowd.length], 'crowd', p, { behaviour: { kind: 'wander', seed: rng.int(1, 99999), wait: rng.range(0, 4), target: null }, tint: [rng.range(0.9, 1.1), rng.range(0.9, 1.1), rng.range(0.9, 1.1)], scale: rng.range(0.95, 1.04) });
    }
    if (this.atlas.specs.has('porter') && density > 0.3) this.spawn('porter', 'porter', this.randomFree(rng) ?? new THREE.Vector3(9, 0, 2.5), { behaviour: { kind: 'wander', seed: 7, wait: 1, target: null }, anim: 'carry' });
    // authored NPCs last: they draw nothing from the RNG and are not in `taken`, so every seeded character keeps its place
    for (const s of this.authored) this.spawnAuthored(s);
  }

  /** contract amendment B: refuse a spawn whose sheet lacks a frame its behaviour can ask for (never a silent fallback) */
  private spawnAuthored(s: AuthoredSpawn): Actor {
    const need = requiredFrames(s.behaviour, { faced: s.facing !== undefined, interactive: s.detail !== 'crowd', talk: false });
    const missing = need.filter(([d, an]) => !this.atlas.frames.has(`${s.spec}/${d}/${an}/0`)).map(([d, an]) => `${d}/${an}`);
    if (missing.length) throw new Error(`authored spawn of ${s.spec}: missing frames ${missing.join(', ')} for behaviour ${s.behaviour}`);
    const a = this.spawn(s.spec, s.role ?? 'authored', new THREE.Vector3(s.pos[0], 0, s.pos[1]), {
      detail: s.detail, scale: s.scale, height: s.height, t: 0, behaviour: { kind: s.behaviour, seed: 1 },
    });
    if (s.facing !== undefined) this.face(a, new THREE.Vector3(Math.sin(s.facing), 0, Math.cos(s.facing)));
    return a;
  }

  private spawnNpc(n: NpcSpawn, rng: Rng): void {
    const p = new THREE.Vector3(...n.pos);
    const wp = n.waypoints?.map((w) => new THREE.Vector3(...w));
    const kind: 'idle' | 'patrol' | 'wander' | 'work' = n.role.endsWith('work') ? 'work' : wp && wp.length > 1 ? 'patrol' : n.role.includes('wander') ? 'wander' : 'idle';
    const a = this.spawn(n.archetype, n.role, p, { behaviour: { kind, waypoints: wp, wait: rng.range(0, 3), idx: 0, target: null, seed: rng.int(1, 99999) } });
    if (n.facing !== undefined) this.face(a, new THREE.Vector3(Math.sin(n.facing), 0, Math.cos(n.facing)));
    if (n.role.endsWith('work')) a.anim = 'hammer';
    if (n.role.includes('talk')) { if (this.atlas.counts.has(`${a.spec}/talk`)) a.anim = 'talk'; a.bubble = 'dots'; }
    if (n.role.includes('alarm')) a.bubble = 'exclaim';
  }

  /** a random point on the playable quay (inset from its edges) */
  private randomPoint(rng: Rng, inset = 0.6): THREE.Vector3 {
    const w = this.district!.walk;
    return new THREE.Vector3(rng.range(w.x0 + 2, w.x1 - 1), 0, rng.range(w.z0 + inset, w.z1 - inset));
  }

  private randomFree(rng: Rng): THREE.Vector3 | null {
    for (let i = 0; i < 40; i++) {
      const p = this.randomPoint(rng);
      if (this.walkable(p.x, p.z, 0.4)) return p;
    }
    return null;
  }

  walkable(x: number, z: number, r: number): boolean {
    const w = this.district?.walk;
    if (!w || x < w.x0 || x > w.x1 || z < w.z0 || z > w.z1) return false;
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

  /** remember the world-space facing; the screen direction is re-derived every frame from the camera, so idle
   *  NPCs keep facing the same way in the world when the camera graph swings between framings. `walk`: the heading of a
   *  step (the player's input, a walker's target), shown by its on-screen direction (screenFacing), also once the walker
   *  stops; a staged facing (spawn, turning to talk) keeps the world rule */
  face(a: Actor, v: THREE.Vector3, walk = false): void {
    if (v.lengthSq() < 1e-6) return;
    a.faceVec = [v.x, v.z]; a.faceWalk = walk;
    this.applyFacing(a);
  }

  private applyFacing(a: Actor): void {
    if (!a.faceVec) return;
    const [vx, vz] = a.faceVec;
    if (a.faceWalk && this.screenFacing(a, vx, vz)) return;
    const c = Math.cos(this.camYaw), s = Math.sin(this.camYaw);
    const sx = vx * c - vz * s;   // along camera right
    const sd = vx * s + vz * c;   // toward camera
    a.sideFlip = sx > 0;
    if (Math.abs(sd) >= Math.abs(sx) * 0.85) { a.dir = sd > 0 ? 'down' : 'up'; a.flip = false; }
    else { a.dir = 'side' as Dir; a.flip = sx > 0; }
  }

  /** the view of a heading from the way a step along it moves ON SCREEN. Under the framings' low pitch (2.5-8.5 deg) the
   *  depth axis is squashed and a step drifts toward the vanishing point: a heading 20 deg off the camera axis already moves
   *  ~55 deg from the screen vertical, so the world rule showed a back sliding sideways (a crab walk). Profile beyond 50 deg
   *  from the vertical, front / back below 40 deg, the view held in between (a straight walk across the frame never
   *  flickers). False (world rule) without a camera or behind it */
  private screenFacing(a: Actor, vx: number, vz: number): boolean {
    const cam = this.camera;
    if (!cam) return false;
    const n = 0.05 / Math.hypot(vx, vz);
    _p0.copy(a.pos).project(cam);
    _p1.set(a.pos.x + vx * n, a.pos.y, a.pos.z + vz * n).project(cam);
    if (_p0.z > 1 || _p1.z > 1) return false;
    // in pixels (units of half the height): NDC x spans the width
    const dx = (_p1.x - _p0.x) * cam.aspect, dy = _p1.y - _p0.y;
    if (this.views5 && this.threeQuarters(a.spec)) {
      a.dir = fiveViewFacing(a.dir, dx, dy); a.sideFlip = dx > 0;
      a.flip = a.dir === 'side' || a.dir === 'downSide' || a.dir === 'upSide' ? dx > 0 : false;   // profile and three-quarters drawn facing left
      return true;
    }
    const side = Math.abs(dx) > Math.abs(dy) * (a.dir === 'side' ? SIDE_OUT : SIDE_IN);
    a.sideFlip = dx > 0;
    if (side) { a.dir = 'side'; a.flip = dx > 0; }
    else { a.dir = dy > 0 ? 'up' : 'down'; a.flip = false; }
    return true;
  }

  /** a sheet with both three-quarter facings, idle and walk (the five-view rule falls back to three views without them) */
  private threeQuarters(spec: string): boolean {
    let v = this.has34.get(spec);
    if (v === undefined) { v = ['downSide', 'upSide'].every((d) => ['idle', 'walk'].every((m) => !!this.atlas.frames.get(`${spec}/${d}/${m}/0`))); this.has34.set(spec, v); }
    return v;
  }

  /** the step a walker is shown taking: its actual displacement once the colliders let at least a fifth of the intended step through
   *  (axis-separated slides: a walker pushed along a stall or a wall faces, and steps, the way it moves; journal Passe F1), the intended
   *  step otherwise (fully blocked: it keeps facing where it wants to go) */
  private shownStep(intended: THREE.Vector3, dx: number, dz: number): THREE.Vector3 {
    return Math.hypot(dx, dz) >= intended.length() * 0.2 ? new THREE.Vector3(dx, 0, dz) : intended;
  }

  private setAnim(a: Actor, anim: Anim): void { if (a.anim !== anim) { a.anim = anim; } }

  interact(): void {
    if (this.nearForge) this.onInteractForge?.();
    else if (this.interactTarget) { this.talkTimer = 2.5; }
  }

  private axes(): [number, number] {
    const k = this.keys;
    return [(k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0), (k.has('w') || k.has('arrowup') ? 1 : 0) - (k.has('s') || k.has('arrowdown') ? 1 : 0)];
  }

  /** true while a movement key is held */
  get moveInput(): boolean { const [ix, iy] = this.axes(); return ix !== 0 || iy !== 0; }

  update(dt: number, elapsed: number): void {
    const p = this.player;
    const c = Math.cos(this.controlYaw), s = Math.sin(this.controlYaw);
    // --- player
    const k = this.keys;
    const [ix, iy] = this.axes();
    const hero = this.heroWalkSpeed();
    const run = k.has('shift') ? (hero ? HERO_RUN : PLAYER_RUN) : 1;
    // screen right = (c, -s), toward-camera = (s, c); "up" on screen = away from camera
    const mv = new THREE.Vector3(c * ix - s * iy, 0, -s * ix - c * iy);
    if (mv.lengthSq() > 0) {
      mv.normalize().multiplyScalar(this.playerSpeed() * run * dt);
      const ox = p.pos.x, oz = p.pos.z;
      this.resolve(p, p.pos.x + mv.x, p.pos.z + mv.z);
      const step = this.shownStep(mv, p.pos.x - ox, p.pos.z - oz);
      this.face(p, step, true);
      // a baked hero's clock follows its steps like a walker's (walkClock, the run key's speed included); the generated sprite keeps x1.7
      this.setAnim(p, 'walk'); p.t += dt * (p.base ? this.walkClock(p, step.x / dt, step.z / dt) : run);
    } else { this.setAnim(p, 'idle'); p.t += dt; }
    p.pos.y = this.district?.heightAt(p.pos.x, p.pos.z) ?? 0;

    // --- NPCs
    this.interactTarget = null; this.nearForge = false;
    for (const a of this.actors) {
      if (a !== p || !mv.lengthSq()) this.applyFacing(a);
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
          const t = this.randomPoint(r, 0.4);
          if (this.walkable(t.x, t.z, 0.35)) { b.target = t; break; }
        }
        if (!b.target) { b.wait = 2; return; }
      }
    }
    const to = b.target!.clone().sub(a.pos); to.y = 0;
    const dist = to.length();
    if (dist < 0.2) { b.target = null; b.wait = 1.5 + (b.seed % 5); return; }
    to.normalize();
    const speed = (a.base ?? a.spec) === 'porter' ? 0.9 : a.detail === 'crowd' ? 0.95 : 0.8;
    const nx = a.pos.x + to.x * speed * dt, nz = a.pos.z + to.z * speed * dt;
    const ox = a.pos.x, oz = a.pos.z;
    this.resolve(a, nx, nz);
    if (Math.abs(a.pos.x - ox) + Math.abs(a.pos.z - oz) < speed * dt * 0.2) { b.target = null; b.wait = 0.8; return; }
    const step = this.shownStep(to.clone().multiplyScalar(speed * dt), a.pos.x - ox, a.pos.z - oz);
    this.face(a, step, true);
    // the porter's crate walk where the sheet has one (the generated porter), the plain walk otherwise
    this.setAnim(a, this.atlas.counts.has(`${a.spec}/carry`) ? 'carry' : 'walk');
    // a baked walker's clock (its frame) advances at the speed its steps show over the speed its cycle draws: the planted foot stays put
    // (positions and RNG draws are unchanged: only which frame is shown)
    a.t += dt * (this.walkClock(a, step.x / dt, step.z / dt) - 1);
  }

  /** the cast's walkSpeed of a baked player (null: the generated sprite, or a sheet without a measured cycle) */
  private heroWalkSpeed(): number | null { return this.player?.base ? this.cast.get(this.player.base)?.walkSpeed ?? null : null; }

  /** the player's walking speed (m/s, before the run key): a baked hero's follows the stride its cycle draws (HERO_CLOCK) */
  playerSpeed(): number { const ws = this.heroWalkSpeed(); return ws ? ws * HERO_REF_SCALE * HERO_CLOCK : PLAYER_SPEED; }

  /** animation clock rate of a walking baked actor (1 for a generated sprite or a sheet without a measured cycle): the speed its steps show
   *  over the ground speed its cycle draws at the current character scale. In profile the cycle slides the planted foot along the
   *  billboard, i.e. the camera's right: what it must match is the velocity along that axis (a profile walking mostly into the depth crosses
   *  the screen slowly: at the full speed its feet slid backwards, a moonwalk); seen from the front or the back, the full speed */
  walkClock(a: Actor, vx: number, vz: number): number {
    const ws = a.base ? this.cast.get(a.base)?.walkSpeed : null;
    if (!ws) return 1;
    const shown = a.dir === 'side' ? Math.abs(vx * Math.cos(this.camYaw) - vz * Math.sin(this.camYaw)) : Math.hypot(vx, vz);
    return Math.min(a === this.player ? HERO_CLOCK_MAX : WALK_CLOCK_MAX, Math.max(WALK_CLOCK_MIN, shown / (ws * this.charScale)));
  }
}
