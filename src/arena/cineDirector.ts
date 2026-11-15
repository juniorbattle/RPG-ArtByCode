import * as THREE from 'three';
import type { Actor } from '../characters/SpriteRenderer';
import type { Anim } from '../characters/SpriteGenerator';
import { applyPose, type CamPose } from '../app/CameraRig';
import { LAYER_NOREFLECT } from '../atmosphere/ShadowAndReflection';
import type { CineMoment, CineTier } from './cine';
import type { Seat } from './autoView';

/** The cinematic of a skill that lands in full (journal Passes CI1 / CI2; src/arena/cine.ts says when, the operator's sheet https://claude.ai/artifact/2Ut19phdR8vySTVzAU1a98
 *  says how). An `ultra` (an exploitation in an opening or a break): the arena goes under the black, the two fighters fight on in a void of their own (« un décor
 *  indépendant fond noire »), seen whole with a slight zoom only (the operator's note on CI-1, word for word « le zoom in est un peu trop important ... on doit pouvoir
 *  garder une vue globale de la scene avec un leger zoom in eventuellement »): the striker gathers, dashes and strikes, the blow lands in a white frame, the one struck
 *  is thrown back in slow motion, the blow's damage in large, and the black gives the arena back just after that action. A `super` (a breaker landing in full: the
 *  operator's note on CI-2, « l'ecran noir ne serait pas integre lors du super mais l'animation plus simple serait tout de meme bien orchester ! »): the same beats in
 *  the arena itself, the camera eased in a little, no black, no white frame. Under the reduced motion (CI-8 « La version calme »): fades and held poses, no camera
 *  move, no dash in the void, no trail, no shake, no white frame. Presentation only: the duel holds meanwhile and its lines are played after (`CineHost.catchUp`, under
 *  the black for an ultra). Everything is the approved combat sheets' own frames, the effects' recipes and the band's sounds (CI-11, CI-12): no new image, no new sound. */

/** the beats (s on the cinematic's clock, ×1): the black over the arena (an ultra) or the camera easing in (a super), the gather on the striker, the dash, the blow held
 *  (an ultra's white frame), the follow-through in slow motion, the black again (an ultra) or the camera easing back, then (`lift`) the arena coming back; `slow` the
 *  follow-through's first 60 % */
export interface CineBeats { in: number; gather: number; dash: number; stop: number; follow: number; out: number; lift: number; slow: number }
export const CINE_BEATS: Record<CineTier | 'ultraCalm' | 'superCalm', CineBeats> = {
  ultra: { in: 0.18, gather: 0.8, dash: 0.22, stop: 0.12, follow: 0.85, out: 0.2, lift: 0.24, slow: 0.4 },
  super: { in: 0.14, gather: 0.45, dash: 0.18, stop: 0.08, follow: 0.62, out: 0.3, lift: 0, slow: 0.5 },
  ultraCalm: { in: 0.3, gather: 0.75, dash: 0, stop: 0, follow: 0.9, out: 0.3, lift: 0.3, slow: 1 },
  superCalm: { in: 0.14, gather: 0.5, dash: 0.18, stop: 0, follow: 0.7, out: 0.2, lift: 0, slow: 1 },
};
export const beatsOf = (tier: CineTier, calm: boolean): CineBeats => CINE_BEATS[calm ? (tier === 'ultra' ? 'ultraCalm' : 'superCalm') : tier];
/** the blow held at this pace (its clock ×0.6), the follow-through's first 60 % at its `slow` */
export const STOP_PACE = 0.6, SLOW_SHARE = 0.6;
/** a cinematic's length as watched (s, ×1) */
export const cineWall = (b: CineBeats): number => b.in + b.gather + b.dash + b.stop / STOP_PACE + (b.follow * SLOW_SHARE) / b.slow + b.follow * (1 - SLOW_SHARE) + b.out + b.lift;
/** an ultra's white frame on the cinematic's clock (s): one flash a cinematic, under the three a second of the accessibility rules */
export const WHITE_FRAME = 0.06;

export interface CineHost {
  scene: THREE.Scene; camera: THREE.PerspectiveCamera;
  fighters: Record<Seat, Actor>;
  /** a frame of a fighter's own sheet (CombatSheets.show) */
  show(a: Actor, seat: Seat, frame: string): void;
  /** the arena, its sky, stands, floor and fires shown or hidden (an ultra's void) */
  world(visible: boolean): void;
  /** the effects' recipes on the fighters (src/arena/fx/combatFx.ts) */
  play(recipe: string, on: Seat, from: Seat): void;
  /** the skill's colours in its void: its recipe's element (CombatFx.palette) */
  palette(action: string, who: Seat): { edge: string; light: string };
  /** the band's sound of a duel's event (src/audio/sfx.ts) */
  sound(e: Record<string, unknown>): void;
  portrait(seat: Seat): HTMLCanvasElement | null;
  /** the skill's name, the fighter's name, a blow's place (« in the break ×1.4 »), « Skip » and its key cap (HTML) in the page's language */
  skillName(id: string): string; fighterName(seat: Seat): string; place(m: CineMoment): string; skipLine(): string;
  /** the arena's framing, a fighter's mark on the floor and how far its lunge takes it toward the other (a super stays in the arena) */
  basePose(): CamPose; home(seat: Seat): number; lunge(seat: Seat): number;
  /** a super's end: the arena takes the fighters back where the cinematic left them (the striker's lunge, the knock-back of the one struck), its presentation easing them home */
  settle(striker: Seat, off: number, struck: Seat, knock: number): void;
  /** after the cinematic's action: the duel played on past it (its lines applied, their sounds and effects already told by the cinematic) */
  catchUp(m: CineMoment): void;
  /** the striker's charge tier (Ren's charge sounds: the tier its skill is released at) */
  tier(m: CineMoment): number;
}

const CSS = `
.ci-curtain{position:fixed;inset:0;z-index:2147481000;background:var(--ds-ink,#0b0d14);opacity:0;pointer-events:none}
.ci-band{position:fixed;left:0;right:0;top:15%;height:clamp(88px,19vh,170px);z-index:2147480000;pointer-events:none;display:flex;align-items:center;gap:clamp(14px,2.4vw,34px);padding:0 var(--ds-gutter,48px);
  background:linear-gradient(90deg,transparent 0,rgba(6,7,12,.9) 14%,rgba(6,7,12,.9) 86%,transparent 100%);border-top:1px solid var(--ci-c);border-bottom:1px solid var(--ci-c);opacity:0;transform:translateX(var(--ci-x,0))}
.ci-band.r{flex-direction:row-reverse;text-align:right}
.ci-band.super{top:9%;height:clamp(72px,14vh,128px)}
.ci-band canvas{height:86%;aspect-ratio:1;image-rendering:pixelated;border:1px solid var(--ci-c);background:rgba(0,0,0,.4)}
.ci-band .ci-t{display:flex;flex-direction:column;gap:4px;color:var(--ds-ivory,#efe6d2)}
.ci-band .ci-who{font:600 var(--ds-fs-label,16px)/1.2 var(--ds-text,sans-serif);letter-spacing:.14em;text-transform:uppercase;color:var(--ci-c)}
.ci-band .ci-sk{font:400 clamp(30px,6.2vh,64px)/1 var(--ds-title,serif);letter-spacing:.04em;text-shadow:0 0 18px var(--ci-g)}
.ci-band.super .ci-sk{font-size:clamp(26px,5vh,48px)}
.ci-num{position:fixed;z-index:2147480001;pointer-events:none;transform:translate(-50%,-50%) scale(var(--ci-s,1));text-align:center;opacity:0;color:var(--ds-ivory,#efe6d2)}
.ci-num b{display:block;font:700 clamp(44px,11vh,112px)/1 var(--ds-text,sans-serif);-webkit-text-stroke:4px rgba(6,7,12,.92);paint-order:stroke fill;text-shadow:0 0 24px var(--ci-g)}
.ci-num em{display:block;margin-top:6px;font:600 var(--ds-fs-label,16px)/1.2 var(--ds-text,sans-serif);font-style:normal;letter-spacing:.1em;color:var(--ci-c);-webkit-text-stroke:3px rgba(6,7,12,.92);paint-order:stroke fill}
.ci-num.super b{font-size:clamp(36px,8vh,80px)}
.ci-skip{position:fixed;right:max(var(--ds-gutter,48px),env(safe-area-inset-right,0px));bottom:calc(22px + env(safe-area-inset-bottom,0px));z-index:2147480002;pointer-events:none;opacity:0;display:flex;align-items:center;gap:8px;font:400 var(--ds-fs-body,16px)/1.2 var(--ds-text,sans-serif);color:var(--ds-ivory,#efe6d2);text-shadow:0 0 6px rgba(6,7,12,.9)}
`;

const VERT = `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`;
const FRAG = `
uniform vec3 uInk; uniform vec3 uGlow; uniform vec2 uGlowPos; uniform float uGlowAmt; uniform float uLines; uniform float uDir; uniform float uRadial; uniform float uFlash; uniform float uTime; uniform float uAspect;
varying vec2 vUv;
float hash(float n){ return fract(sin(n) * 43758.5453); }
void main(){
  vec2 p = vUv * 2.0 - 1.0; p.x *= uAspect;
  vec2 g = uGlowPos; g.x *= uAspect;
  vec2 dv = p - g; float d = length(dv);
  vec3 c = uInk + uGlow * uGlowAmt * (0.2 * exp(-d * d * 2.2) + 0.05 * exp(-d * 1.2));
  // the dash's lines: sparse streaks along the rows, flowing against the striker
  float row = floor(vUv.y * 96.0), h = hash(row + 3.7);
  float x = fract(vUv.x * (0.45 + 0.5 * h) + uDir * uTime * (2.2 + 3.4 * h) + h * 9.0);
  float streak = step(0.62, h) * smoothstep(0.0, 0.015, x) * (1.0 - smoothstep(0.015, 0.08 + 0.3 * h, x));
  c += (uGlow * 0.6 + 0.12) * streak * uLines;
  // the gather's thin rays toward the striker (atan guarded at the centre: one NaN pixel blacks the frame through the bloom)
  float a = atan(dv.y, dv.x + 1e-5) * 9.5493, ray = hash(floor(a * 6.0) + 1.3), thin = 1.0 - smoothstep(0.0, 0.16, abs(fract(a * 6.0) - 0.5));
  float rays = step(0.6, ray) * thin * smoothstep(0.3, 1.2, d) * smoothstep(0.0, 0.5, fract(d * 0.7 + uTime * (1.4 + ray)));
  c += (uGlow * 0.5 + 0.08) * rays * uRadial;
  c = mix(c, vec3(1.0), uFlash);
  gl_FragColor = vec4(c, 1.0);
}`;

const ease = (x: number): number => { const t = Math.max(0, Math.min(1, x)); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
type Pose = CamPose & { roll: number };
const mixPose = (a: Pose, b: Pose, k: number): Pose => ({ yaw: lerp(a.yaw, b.yaw, k), pitch: lerp(a.pitch, b.pitch, k), dist: lerp(a.dist, b.dist, k), fov: lerp(a.fov, b.fov, k), shift: 0, tx: lerp(a.tx, b.tx, k), ty: lerp(a.ty, b.ty, k), tz: lerp(a.tz, b.tz, k), roll: lerp(a.roll, b.roll, k) });

/** an ultra's stage in the void (m): the striker's mark, the one struck's, where the striker stands at the blow, how far the blow throws */
export const STAGE = { from: 2.5, to: 1.3, reach: 1.15, throw: 2 };
/** an ultra's framing: both fighters seen whole, eased in a little at the gather and onto the blow (CI-1's note) */
export const ULTRA_VIEW = { dist: 11.4, gatherDist: 10.4, blowDist: 9.9, fov: 34, ty: 1.85, pitch: 0.045 };
/** a super's camera eased in (m off the arena's framing, toward the striker) */
export const SUPER_PUSH = { dist: 2.2, tx: 0.35 };
/** the trail of the dash: so many copies of the striker, so far behind on its own path (s) */
const TRAIL = { n: 4, every: 0.035 };

export class CineRun {
  /** the cinematic's clock (s) and its end */
  t = 0;
  readonly len: number;
  done = false;
  /** the cinematic's copies of the striker (the dash's trail), drawn by the arena's sprites */
  readonly ghosts: Actor[] = [];
  readonly b: CineBeats;
  readonly at: { gather: number; dash: number; stop: number; follow: number; out: number; lift: number };
  readonly ultra: boolean;
  /** what the proofs read: the white frames shown, the band's and the number's texts */
  readonly seen = { white: 0, flashes: 0, band: '', num: '' };
  private readonly s: number;
  private readonly el: { curtain: HTMLDivElement | null; band: HTMLDivElement; num: HTMLDivElement; skip: HTMLDivElement };
  private readonly col: string; private readonly glow: THREE.Color;
  private path: Array<{ t: number; x: number }> = [];
  private told = new Set<string>();
  private swapped = false; private restored = false; private caught = false;
  private readonly hits: number[];
  private shake = 0;
  private wasWhite = false;

  constructor(readonly m: CineMoment, private host: CineHost, readonly calm: boolean, private backdrop: CineBackdrop) {
    this.ultra = m.tier === 'ultra';
    this.b = beatsOf(m.tier, calm);
    const b = this.b, g = b.in, d = g + b.gather, st = d + b.dash, f = st + b.stop, o = f + b.follow, l = o + b.out;
    this.at = { gather: g, dash: d, stop: st, follow: f, out: o, lift: l };
    this.len = l + b.lift;
    this.s = m.who === 'ren' ? 1 : -1;
    const P = host.palette(m.action, m.who);
    this.col = P.edge; this.glow = new THREE.Color(P.light);
    // the action's blows on the cinematic's clock: the first at the blow, the next ones as far apart as the duel has them, never under 0.1 s
    this.hits = Array.from({ length: Math.max(1, m.hits) }, (_, i) => this.at.stop + i * Math.max(0.1, m.hits > 1 ? (m.end - m.t) / (m.hits - 1) : 0));
    if (!document.getElementById('cine-css')) { const st2 = document.createElement('style'); st2.id = 'cine-css'; st2.textContent = CSS; document.head.appendChild(st2); }
    const mk = (cls: string): HTMLDivElement => { const x = document.createElement('div'); x.className = cls; x.setAttribute('aria-hidden', 'true'); document.body.appendChild(x); return x; };
    const sup = this.ultra ? '' : ' super';
    this.el = { curtain: this.ultra ? mk('ci-curtain') : null, band: mk(`ci-band${this.s < 0 ? ' r' : ''}${sup}`), num: mk(`ci-num${sup}`), skip: mk('ci-skip') };
    for (const x of [this.el.band, this.el.num]) { x.style.setProperty('--ci-c', this.col); x.style.setProperty('--ci-g', P.light); }
    const pc = host.portrait(m.who), cv = document.createElement('canvas');
    if (pc) { cv.width = pc.width; cv.height = pc.height; const x = cv.getContext('2d')!; x.imageSmoothingEnabled = false; if (this.s < 0) { x.translate(cv.width, 0); x.scale(-1, 1); } x.drawImage(pc, 0, 0); }
    const t = document.createElement('div'); t.className = 'ci-t';
    const who = document.createElement('span'), sk = document.createElement('span');
    who.className = 'ci-who'; sk.className = 'ci-sk'; who.textContent = host.fighterName(m.who); sk.textContent = host.skillName(m.action);
    t.append(who, sk);
    if (pc) this.el.band.append(cv);
    this.el.band.append(t);
    const nb = document.createElement('b'), ne = document.createElement('em');
    nb.textContent = String(Math.round(m.damage)); ne.textContent = host.place(m);
    this.el.num.append(nb, ne);
    this.el.skip.innerHTML = host.skipLine();
    this.seen.band = `${who.textContent} ${sk.textContent}`; this.seen.num = `${nb.textContent} ${ne.textContent}`;
  }

  /** « Skip » in a cinematic (CI-7): straight to its end (an ultra's black, then the arena) */
  cut(): void { if (this.t < this.at.out) this.t = this.at.out; }

  /** the cinematic drives the fighters and the camera (an ultra from its void's opening to its close, a super all along) */
  stages(): boolean { return !this.done && (this.ultra ? this.swapped && !this.restored : !this.caught); }
  /** the cinematic's own clock pace: the blow held, then the follow-through's first 60 % in slow motion */
  scale(): number { const { at, b } = this, t = this.t; return t >= at.stop && t < at.follow ? STOP_PACE : t >= at.follow && t < at.follow + b.follow * SLOW_SHARE ? b.slow : 1; }

  /** one step of the cinematic (s, its own clock); the duel's arena takes back the camera and the fighters once `done` */
  update(dt: number): void {
    if (this.done) return;
    this.t += dt;
    if (this.ultra) this.stepUltra(dt); else this.stepSuper(dt);
  }

  // ---------------------------------------------------------------- an ultra, in the void
  private stepUltra(dt: number): void {
    const { at, b, host, m, s, calm } = this, t = this.t;
    // the curtain: down over the arena, lifted on the void, down again, lifted on the arena (fades only: the operator's rule of 2026-11-03)
    const lift = Math.min(0.14, b.gather * 0.4);
    const curtain = t < at.gather ? ease(t / b.in) : t < at.gather + lift ? 1 - ease((t - at.gather) / lift) : t < at.out ? 0 : t < at.lift ? ease((t - at.out) / b.out) : 1 - ease((t - at.lift) / b.lift);
    // a curtain lifted leaves the page: nothing stays over the band and the number
    if (this.el.curtain) { this.el.curtain.style.opacity = curtain.toFixed(3); this.el.curtain.style.visibility = curtain > 0 ? 'visible' : 'hidden'; }
    if (!this.swapped && t >= at.gather) { this.swapped = true; host.world(false); this.backdrop.show(true); }
    if (this.swapped && !this.restored && t >= at.lift) {
      this.restored = true; this.backdrop.show(false); host.world(true);
      for (const g of this.ghosts) g.hidden = true;
      this.texts(0, 0, 0);
      this.caught = true; host.catchUp(m);
    }
    if (t >= this.len) { this.end(); return; }
    if (!this.swapped || this.restored) return;
    const A = host.fighters[m.who], B = host.fighters[m.to], from = -s * STAGE.from, to = s * STAGE.to, contact = to - s * STAGE.reach;
    const kd = b.dash > 0 ? ease((t - at.dash) / b.dash) : t >= at.dash ? 1 : 0, inDash = t >= at.dash && t < at.stop;
    // the reduced motion: the striker at the blow's place from the start (no dash)
    const xA = calm ? contact : t < at.dash ? from : t < at.stop ? lerp(from, contact, kd * kd) : contact;
    const kf = (t - at.follow) / b.follow, thrown = t < at.stop ? 0 : t < at.follow ? 0.12 : 0.12 + 0.88 * (1 - Math.pow(1 - Math.min(1, Math.max(0, kf)), 2.2));
    const xB = to + s * STAGE.throw * (calm ? Math.min(1, thrown) * 0.6 : thrown);
    const white = !calm && t >= at.stop && t < at.stop + Math.min(WHITE_FRAME, b.stop * 0.5);
    if (white) { if (!this.wasWhite) this.seen.flashes++; this.seen.white++; }
    this.wasWhite = white;
    this.pose(A, B, xA, xB, thrown, white);
    this.trail(A, !calm && t >= at.dash && t < at.stop + 0.08, t < at.stop ? 1 : 1 - (t - at.stop) / 0.08);
    // the camera: both fighters seen whole (CI-1's note), eased in a little at the gather and onto the blow, back on the throw
    const W = ULTRA_VIEW, mid = (from + to) / 2;
    const G0: Pose = { yaw: s * 0.06, pitch: W.pitch, dist: W.dist, fov: W.fov, shift: 0, tx: mid, ty: W.ty, tz: 0, roll: 0 };
    const G1: Pose = { ...G0, dist: W.gatherDist, tx: mid - s * 0.5 };
    const I: Pose = { ...G0, dist: W.blowDist, tx: (contact + to) / 2 + s * 0.3, yaw: -s * 0.04 };
    const F: Pose = { ...G0, tx: (contact + xB) / 2 + s * 0.3 };
    let P: Pose = calm ? G0 : t < at.dash ? mixPose(G0, G1, ease((t - at.gather) / b.gather)) : t < at.stop ? mixPose(G1, I, kd) : t < at.follow ? I : mixPose(I, F, ease(kf));
    if (!calm && t >= at.stop && t < at.follow + 0.3) { const k = 1 - Math.min(1, (t - at.stop) / 0.32); P = { ...P, dist: P.dist - 0.6 * k * k }; }
    P = this.shaken(P, dt);
    applyPose(host.camera, P, window.innerWidth / Math.max(1, window.innerHeight));
    // the backdrop: the striker's colour behind it, the gather's rays, the dash's lines, the white frame of the blow
    const v = new THREE.Vector3(A.pos.x, 1.6, 0).project(host.camera);
    this.backdrop.set({ glow: this.glow, glowAt: [v.x, v.y], glowAmt: (t < at.stop ? 0.7 + 0.5 * ease((t - at.gather) / b.gather) : 1.3 * (1 - 0.6 * ease(kf))) * (calm ? 0.6 : 1), radial: calm ? 0 : t < at.dash ? ease((t - at.gather) / (b.gather * 0.6)) : 0, lines: inDash ? 1 : t >= at.stop && t < at.stop + 0.25 && !calm ? 1 - (t - at.stop) / 0.25 : 0, dir: -s, flash: white ? 1 : 0, time: t });
    this.overlays(B);
    this.beats();
  }

  // ---------------------------------------------------------------- a super, in the arena
  private stepSuper(dt: number): void {
    const { at, b, host, m, s, calm } = this, t = this.t;
    if (!this.caught && t >= at.lift) {
      // the end: the arena takes the fighters back where the cinematic left them, then the duel past the action
      this.caught = true;
      for (const g of this.ghosts) g.hidden = true;
      this.texts(0, 0, 0);
      host.catchUp(m);
    }
    if (t >= this.len) { this.end(); return; }
    if (this.caught) return;
    const A = host.fighters[m.who], B = host.fighters[m.to], L = host.lunge(m.who);
    const kd = b.dash > 0 ? ease((t - at.dash) / b.dash) : t >= at.dash ? 1 : 0;
    const off = t < at.dash ? 0 : t < at.stop ? L * kd * kd : L;
    const kf = (t - at.follow) / b.follow, thrown = t < at.stop ? 0 : Math.min(1, 0.2 + 0.8 * Math.max(0, kf));
    const back = 0.7 * (calm ? 0.5 : 1) * (1 - Math.pow(1 - thrown, 2)), xA = host.home(m.who) + s * off, xB = host.home(m.to) + s * back;
    // the arena's own state follows (the striker's lunge, the knock-back of the one struck): it takes them back from there, without a jump
    host.settle(m.who, off, m.to, -back);
    this.pose(A, B, xA, xB, thrown, false);
    this.trail(A, !calm && t >= at.dash && t < at.stop + 0.08, t < at.stop ? 1 : 1 - (t - at.stop) / 0.08);
    // the camera: the arena's framing eased in toward the striker, back at the end
    const base = host.basePose(), k = calm ? 0 : t < at.gather ? ease(t / b.in) : t < at.out ? 1 : 1 - ease((t - at.out) / b.out);
    let P: Pose = { ...base, dist: base.dist - SUPER_PUSH.dist * k, tx: base.tx + A.pos.x * SUPER_PUSH.tx * k, roll: 0 };
    P = this.shaken(P, dt);
    applyPose(host.camera, P, window.innerWidth / Math.max(1, window.innerHeight));
    this.overlays(B);
    this.beats();
  }

  // ---------------------------------------------------------------- shared
  /** the frames: the striker charging, surging, striking, following through; the one struck on guard, struck, thrown, recovering (or down) */
  private pose(A: Actor, B: Actor, xA: number, xB: number, thrown: number, white: boolean): void {
    const { at, m, host } = this, t = this.t;
    const hit = this.hits.findIndex((h, i) => t >= h && (i === this.hits.length - 1 || t < this.hits[i + 1]));
    const sinceHit = hit >= 0 ? t - this.hits[hit] : -1;
    const fA = t < at.dash ? (m.who === 'ren' ? `chargeHi.${Math.floor(t * 3.4) % 2}` : 'skillOff.0') : t < at.stop ? 'skillOff.1' : sinceHit >= 0 && sinceHit < 0.2 ? (hit % 2 ? 'skillOff.1' : 'skillOff.2') : 'skillOff.3';
    const since = t - at.stop;
    const fB = t < at.stop ? `ready.${Math.floor(t * 1.4) % 2}` : m.ko ? `ko.${since < 0.3 ? 0 : since < 0.75 ? 1 : 2}` : since < 0.18 ? 'hit.0' : since < 0.55 ? 'hit.1' : 'recover.0';
    for (const [a, seat, x, fr] of [[A, m.who, xA, fA], [B, m.to, xB, fB]] as const) {
      // an ultra's void has no torch: the fighters a little lifted, the one thrown out of the blow's light more so
      const lift = this.ultra ? (seat === m.who ? 1.12 : 1.12 + 0.3 * Math.min(1, thrown)) : 1;
      a.pos.set(x, 0, seat === m.who ? 0.14 : -0.06); a.tint = white ? [0, 0, 0] : [lift, lift, lift]; a.flip = seat === 'ren'; a.hidden = false;
      host.show(a, seat, fr);
    }
  }
  /** the trail: copies of the striker on its path, in its colour, fading (darkening) */
  private trail(A: Actor, on: boolean, fadeAll: number): void {
    const t = this.t;
    this.path.push({ t, x: A.pos.x }); this.path = this.path.filter((p) => t - p.t < 0.4);
    while (this.ghosts.length < TRAIL.n) this.ghosts.push({ ...A, id: 960 + this.ghosts.length, pos: A.pos.clone(), tint: [0, 0, 0], noShadow: true });
    this.ghosts.forEach((g, i) => {
      const back = (i + 1) * TRAIL.every, p = [...this.path].reverse().find((q) => t - q.t >= back);
      const fade = on ? (1 - (i + 1) / (TRAIL.n + 1)) * Math.max(0, fadeAll) : 0;
      g.hidden = !on || !p || fade <= 0.02;
      if (g.hidden) return;
      g.pos.set(p!.x, 0, 0.08 - 0.03 * i); g.flip = A.flip; g.anim = A.anim as Anim; g.scale = A.scale;
      g.tint = [this.glow.r * 1.9 * fade, this.glow.g * 1.9 * fade, this.glow.b * 1.9 * fade];
    });
  }
  private shaken(P: Pose, dt: number): Pose {
    this.shake = this.calm ? 0 : Math.max(0, this.shake - dt * 3.2);
    if (this.shake <= 0) return P;
    const a = this.shake * this.shake * (this.ultra ? 0.12 : 0.08), w = this.t * 61;
    return { ...P, tx: P.tx + Math.sin(w * 1.7) * a, ty: P.ty + Math.sin(w * 2.3 + 1.1) * a * 0.7 };
  }
  /** the band (the striker's face and its skill's name, in from its side, out before the blow), the number over the one struck, « Skip » in the corner */
  private overlays(B: Actor): void {
    const { at, b, calm, s, host } = this, t = this.t;
    const bandIn = ease((t - at.gather - 0.06) / 0.16), bandOut = b.dash > 0 ? 1 - ease((t - at.dash + 0.02) / 0.1) : 1 - ease((t - at.follow) / 0.3);
    const nk = t - at.stop, num = nk >= 0 ? Math.min(1, nk / 0.06) * (1 - ease((nk - b.follow * 0.75) / (b.follow * 0.3))) : 0;
    this.texts(Math.min(bandIn, bandOut), num, Math.min(1, t / 0.2) * (1 - ease((t - at.out) / 0.15)));
    this.el.band.style.setProperty('--ci-x', calm ? '0' : `${(-s * 34 * (1 - bandIn)).toFixed(1)}px`);
    const pv = new THREE.Vector3(B.pos.x, 3.05, 0).project(host.camera);
    this.el.num.style.left = `${((pv.x * 0.5 + 0.5) * 100).toFixed(2)}%`; this.el.num.style.top = `${((-pv.y * 0.5 + 0.5) * 100).toFixed(2)}%`;
    this.el.num.style.setProperty('--ci-s', calm ? '1' : (1 + 0.35 * Math.max(0, 1 - nk / 0.12)).toFixed(3));
  }
  private texts(band: number, num: number, skip: number): void {
    this.el.band.style.opacity = band.toFixed(3); this.el.num.style.opacity = num.toFixed(3); this.el.skip.style.opacity = skip.toFixed(3);
  }
  /** what plays once: the charge's sound and light, the dash's whip, each blow's recipe and sound */
  private beats(): void {
    const { at, b, host, m } = this, t = this.t;
    const once = (k: string, at0: number, f: () => void): void => { if (!this.told.has(k) && t >= at0) { this.told.add(k); f(); } };
    once('gather', at.gather, () => {
      if (m.who === 'ren') { const idx = host.tier(m); if (idx) host.sound({ type: 'chargeTier', who: 'ren', action: m.action, idx, open: true, prep: b.gather }); }
      else host.sound({ type: 'sequenceStart', who: m.who, len: 1 });
      host.play(this.ultra ? 'charge3' : 'charge2', m.who, m.who);
    });
    if (b.dash > 0) once('dash', at.dash, () => { if (m.who === 'ren') host.sound({ type: 'chargeRelease', who: 'ren', idx: Math.max(1, host.tier(m)), ok: true }); host.play('release', m.who, m.who); });
    this.hits.forEach((h, i) => once(`hit${i}`, h, () => {
      const bl = m.blows[i] ?? m.blows[m.blows.length - 1];
      host.sound({ type: 'impact', from: m.who, to: m.to, action: m.action, kind: 'skill', result: 'hit', damage: bl.damage, follow: i > 0, hp: bl.hp, total: m.damage });
      host.play(i === 0 ? m.action : m.who === 'ren' ? 'light' : 'm_slash', m.to, m.who);
      this.shake = Math.max(this.shake, i === 0 ? (this.ultra ? 1.3 : 1) : 0.6);
    }));
    // a K.O.: the arena's own (its recipe, its slow motion, its jingle) when the cinematic gives it back on the fall
  }

  private end(): void {
    if (this.done) return;
    this.done = true;
    if (this.ultra && !this.restored) { this.restored = true; this.backdrop.show(false); this.host.world(true); }
    if (!this.caught) { this.caught = true; this.host.catchUp(this.m); }
    for (const g of this.ghosts) g.hidden = true;
    for (const x of Object.values(this.el)) x?.remove();
  }
  /** dropped at once (a reset, the page leaving): nothing of the duel is played */
  dispose(): void {
    if (this.done) return;
    this.done = true; this.caught = true;
    if (this.ultra && this.swapped && !this.restored) { this.restored = true; this.backdrop.show(false); this.host.world(true); }
    for (const g of this.ghosts) g.hidden = true;
    for (const x of Object.values(this.el)) x?.remove();
  }
}

/** an ultra's ground: one quad over the whole frame, drawn first, the striker's colour behind it */
export class CineBackdrop {
  readonly mesh: THREE.Mesh;
  private readonly u: Record<string, THREE.IUniform>;
  constructor(scene: THREE.Scene, ink = new THREE.Color(0.012, 0.014, 0.022)) {
    this.u = { uInk: { value: ink }, uGlow: { value: new THREE.Color() }, uGlowPos: { value: new THREE.Vector2() }, uGlowAmt: { value: 0 }, uLines: { value: 0 }, uDir: { value: 1 }, uRadial: { value: 0 }, uFlash: { value: 0 }, uTime: { value: 0 }, uAspect: { value: 16 / 9 } };
    const mat = new THREE.ShaderMaterial({ uniforms: this.u, vertexShader: VERT, fragmentShader: FRAG, depthTest: false, depthWrite: false });
    mat.name = 'cine:backdrop';
    this.mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), mat);
    this.mesh.frustumCulled = false; this.mesh.renderOrder = -100000; this.mesh.visible = false;
    // the main pass alone (the water's mirror never draws it)
    this.mesh.layers.set(LAYER_NOREFLECT);
    scene.add(this.mesh);
  }
  show(on: boolean): void { this.mesh.visible = on; }
  set(o: { glow: THREE.Color; glowAt: [number, number]; glowAmt: number; radial: number; lines: number; dir: number; flash: number; time: number }): void {
    const u = this.u;
    (u.uGlow.value as THREE.Color).copy(o.glow); (u.uGlowPos.value as THREE.Vector2).set(o.glowAt[0], o.glowAt[1]);
    u.uGlowAmt.value = o.glowAmt; u.uRadial.value = o.radial; u.uLines.value = o.lines; u.uDir.value = o.dir; u.uFlash.value = o.flash; u.uTime.value = o.time;
    u.uAspect.value = window.innerWidth / Math.max(1, window.innerHeight);
  }
}
