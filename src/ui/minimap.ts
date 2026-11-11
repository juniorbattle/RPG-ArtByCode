import * as THREE from 'three';
import type { MarkKind } from '../simulation/v2marks';
import { PHONE_QUERY } from './design/tokens';

/** A small plan of the place in a corner of the screen (the operator's request of 2026-11-11, journal Passe MK1: « peut etre meme integrer aussi une mini map sur le
 *  coin »; the interface had been decided without one, UM-R5). Drawn in the design system's manner (direction A « Voile »): no frame, the plan in one-pixel
 *  ivory lines fading at its edge on the spot veil, the one accent for what can be acted on (the people marked, the ways out); the hero in ivory. Turned with the
 *  camera (what is ahead on screen is up on the plan), centred on the hero. A 2D canvas redrawn a few times a second. `corner`: the sheet's mock-ups (DEV). */

export interface PlanRect { x0: number; x1: number; z0: number; z1: number }
export interface MapPlan {
  /** the walkable ground */
  walk: PlanRect[];
  /** what stands on it (stalls, wells, monuments) */
  blocks: Array<PlanRect | { x: number; z: number; r: number }>;
  /** the lines the place's edges draw (a frontage, a quay's edge): pairs of points */
  edges: Array<[number, number, number, number]>;
  /** the ways out (their sign's point) */
  exits: Array<{ x: number; z: number }>;
  /** the plan's reach around the hero (m, half the side) */
  reach: number;
}
export interface MapPerson { x: number; z: number; kind: MarkKind | null }
export type MapCorner = 'tr' | 'bl';

const CSS = (corner: MapCorner) => `
#pm-map{position:fixed;z-index:21;pointer-events:none;width:168px;height:168px;${corner === 'tr' ? 'right:28px;top:104px' : 'left:28px;bottom:28px'};background:radial-gradient(closest-side,var(--ds-veil) 52%,transparent 100%);transition:opacity .3s}
@media ${PHONE_QUERY}{#pm-map{width:104px;height:104px;${corner === 'tr' ? 'right:10px;top:62px' : 'left:10px;bottom:56px'}}}
body.pm-full #pm-map,body.pm-talking #pm-map{visibility:hidden}
`;

export class MiniMap {
  readonly canvas = document.createElement('canvas');
  private readonly ctx: CanvasRenderingContext2D;
  private frame = 0;
  private readonly f = new THREE.Vector3();
  /** the last draw's cost (ms), for the measure */
  lastMs = 0;
  /** the page's tone (ivory, accent), read once */
  private tone: string[] | null = null;
  draws = 0;

  constructor(private readonly plan: MapPlan, corner: MapCorner = 'tr') {
    if (!document.getElementById('pm-map-css')) { const st = document.createElement('style'); st.id = 'pm-map-css'; st.textContent = CSS(corner); document.head.appendChild(st); }
    this.canvas.id = 'pm-map'; this.canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d')!;
  }

  /** each frame (drawn one frame in three): the plan round the hero, turned as the camera looks */
  update(camera: THREE.Camera, hero: { x: number; z: number }, people: MapPerson[], hidden: boolean): void {
    this.canvas.style.opacity = hidden ? '0' : '1';
    if (hidden || this.frame++ % 3) return;
    const t0 = performance.now();
    const css = this.canvas.clientWidth || 168, dpr = Math.min(2, window.devicePixelRatio || 1), S = Math.round(css * dpr);
    if (this.canvas.width !== S) { this.canvas.width = this.canvas.height = S; }
    const c = this.ctx, R = S / 2, plan = this.plan, sc = (R * 0.84) / plan.reach;

    camera.getWorldDirection(this.f);
    const fl = Math.hypot(this.f.x, this.f.z) || 1, fx = this.f.x / fl, fz = this.f.z / fl;
    // world -> plan: right of the camera to the right, ahead of it up
    const P = (x: number, z: number): [number, number] => { const dx = x - hero.x, dz = z - hero.z; return [R + (-dx * fz + dz * fx) * sc, R - (dx * fx + dz * fz) * sc]; };
    const cs = (this.tone ??= ((g) => [g.getPropertyValue('--ds-ivory').trim() || '#efe9dc', g.getPropertyValue('--ds-accent').trim() || '#e9b45a'])(getComputedStyle(this.canvas)));
    const ivory = cs[0], accent = cs[1];
    c.clearRect(0, 0, S, S);
    c.save();
    // the plan fades at its edge (no frame): a radial mask over everything drawn
    c.beginPath(); c.arc(R, R, R * 0.96, 0, Math.PI * 2); c.clip();
    const px = Math.max(1, Math.round(dpr));
    c.lineWidth = px;
    const rect = (r: PlanRect, fill: string | null, stroke: string | null) => {
      const pts = [P(r.x0, r.z0), P(r.x1, r.z0), P(r.x1, r.z1), P(r.x0, r.z1)];
      c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.closePath();
      if (fill) { c.fillStyle = fill; c.fill(); }
      if (stroke) { c.strokeStyle = stroke; c.stroke(); }
    };
    c.globalAlpha = 1;
    for (const w of plan.walk) rect(w, hexA(ivory, 0.07), hexA(ivory, 0.42));
    for (const b of plan.blocks) {
      if ('r' in b) { const [x, y] = P(b.x, b.z); c.beginPath(); c.arc(x, y, Math.max(1.5 * px, b.r * sc), 0, Math.PI * 2); c.fillStyle = hexA(ivory, 0.22); c.fill(); }
      else rect(b, hexA(ivory, 0.22), null);
    }
    c.strokeStyle = hexA(ivory, 0.62);
    for (const [x0, z0, x1, z1] of plan.edges) { const a = P(x0, z0), b = P(x1, z1); c.beginPath(); c.moveTo(a[0], a[1]); c.lineTo(b[0], b[1]); c.stroke(); }
    // the ways out: a small accent chevron, kept on the plan's rim when beyond it
    for (const e of plan.exits) {
      let [x, y] = P(e.x, e.z); const dx = x - R, dy = y - R, d = Math.hypot(dx, dy) || 1, lim = R * 0.86;
      if (d > lim) { x = R + (dx / d) * lim; y = R + (dy / d) * lim; }
      const a = Math.atan2(dy, dx), s = 4.5 * px;
      c.beginPath(); c.moveTo(x + Math.cos(a) * s, y + Math.sin(a) * s); c.lineTo(x + Math.cos(a + 2.4) * s, y + Math.sin(a + 2.4) * s); c.lineTo(x + Math.cos(a - 2.4) * s, y + Math.sin(a - 2.4) * s); c.closePath();
      c.fillStyle = accent; c.fill();
    }
    // the people: a faint dot each, the marked ones the mark's diamond in the accent
    for (const p of people) {
      const [x, y] = P(p.x, p.z);
      if (!p.kind) { c.beginPath(); c.arc(x, y, 1.5 * px, 0, Math.PI * 2); c.fillStyle = hexA(ivory, 0.45); c.fill(); continue; }
      const s = 4 * px;
      c.beginPath(); c.moveTo(x, y - s); c.lineTo(x + s, y); c.lineTo(x, y + s); c.lineTo(x - s, y); c.closePath();
      if (p.kind === 'item') { c.strokeStyle = accent; c.stroke(); } else { c.fillStyle = accent; c.fill(); if (p.kind === 'follow') { c.strokeStyle = accent; c.beginPath(); c.arc(x, y, s + 2.5 * px, 0, Math.PI * 2); c.stroke(); } }
    }
    // the hero, in ivory, at the centre
    c.beginPath(); c.arc(R, R, 3.2 * px, 0, Math.PI * 2); c.fillStyle = ivory; c.fill();
    c.restore();
    this.lastMs = performance.now() - t0; this.draws++;
  }
}

/** a CSS colour (#rrggbb) at an alpha */
function hexA(hex: string, a: number): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})/i.exec(hex);
  return m ? `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})` : hex;
}
