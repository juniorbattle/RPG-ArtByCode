import * as THREE from 'three';
import type { MarkKind } from '../simulation/v2marks';
import { tx } from '../narrative/text';
import { el } from './style';

/** The people worth talking to, marked on the scene (the operator's request of 2026-11-11, journal Passe MK1). DOM over the canvas, in the design system's
 *  manner (direction A « Voile »: no box on the scene, one-pixel lines, one accent): each marked person a mark over the head, faded in as it comes on screen,
 *  hidden while a page or a dialogue is open. The kind is the mark's shape. `style` picks among the sheet's mock-ups (DEV `npcmark=`):
 *  - `losange`: a small diamond over the head in the accent, outlined for an item, filled for an event, outlined round a filled one for a follow-up;
 *  - `mot`: the kind's word over the head, on the spot veil, only near the hero;
 *  - `sol`: a one-pixel ellipse at the feet in the accent, whole for an item, doubled for an event, dashed for a follow-up. */

export type MarkStyle = 'losange' | 'mot' | 'sol';
export interface MarkTarget { who: string; pos: THREE.Vector3; /** the head's height over the feet (m) */ head: number }

const CSS = `
.pm-mark{position:fixed;z-index:23;left:0;top:0;pointer-events:none;opacity:0;transition:opacity .3s;color:var(--ds-accent)}
.pm-mark.losange{width:40px;height:30px;display:grid;place-items:center;background:var(--ds-grad-spot)}
.pm-mark.losange svg{width:15px;height:15px;display:block;shape-rendering:crispEdges}
.pm-mark.mot{padding:4px 24px 7px;white-space:nowrap;font-size:var(--ds-fs-small);color:var(--ds-ivory);background:var(--ds-grad-spot)}
.pm-mark.mot::after{content:'';position:absolute;left:50%;bottom:3px;width:18px;margin-left:-9px;border-top:1px solid var(--ds-accent)}
.pm-mark.sol svg{display:block;overflow:visible}
body.pm-full .pm-mark,body.pm-talking .pm-mark{visibility:hidden}
`;

/** the diamond's three forms (a 15 px box, one-pixel strokes) */
export function markGlyph(kind: MarkKind): string {
  const d = 'M7.5 1.5 L13.5 7.5 L7.5 13.5 L1.5 7.5 Z', inner = 'M7.5 5 L10 7.5 L7.5 10 L5 7.5 Z';
  const shape = kind === 'event' ? `<path d="${d}" fill="currentColor"/>` : kind === 'follow' ? `<path d="${d}" fill="none" stroke="currentColor"/><path d="${inner}" fill="currentColor"/>` : `<path d="${d}" fill="none" stroke="currentColor"/>`;
  return `<svg viewBox="0 0 15 15" aria-hidden="true">${shape}</svg>`;
}
export const MARK_WORD: Record<MarkKind, 'v2.mark.item' | 'v2.mark.event' | 'v2.mark.follow'> = { item: 'v2.mark.item', event: 'v2.mark.event', follow: 'v2.mark.follow' };

export class NpcMarks {
  private tags = new Map<string, { el: HTMLElement; kind: MarkKind }>();
  private readonly v = new THREE.Vector3();
  private readonly w = new THREE.Vector3();
  /** who is marked and how (the page sets it from the state) */
  marks = new Map<string, MarkKind>();

  constructor(readonly style: MarkStyle, private readonly near = 7) {
    if (!document.getElementById('pm-mark-css')) { const st = document.createElement('style'); st.id = 'pm-mark-css'; st.textContent = CSS; document.head.appendChild(st); }
  }

  private tagOf(who: string, kind: MarkKind): HTMLElement {
    let t = this.tags.get(who);
    if (t && t.kind !== kind) { t.el.remove(); t = undefined; }
    if (!t) {
      const e = el('div', `pm pm-mark ${this.style}`, this.style === 'mot' ? tx(MARK_WORD[kind]) : this.style === 'losange' ? markGlyph(kind) : '');
      e.dataset.who = who; e.dataset.kind = kind; document.body.appendChild(e);
      t = { el: e, kind }; this.tags.set(who, t);
    }
    return t.el;
  }

  /** each frame: each marked person's mark at their head (or feet), faded by the screen's edge (and, for words, by the hero's distance) */
  update(camera: THREE.Camera, hero: { x: number; z: number }, targets: MarkTarget[], hidden: boolean): void {
    const W = window.innerWidth, H = window.innerHeight, live = new Set<string>();
    for (const t of targets) {
      const kind = this.marks.get(t.who);
      if (!kind) continue;
      live.add(t.who);
      const e = this.tagOf(t.who, kind);
      const feet = this.style === 'sol';
      this.v.set(t.pos.x, t.pos.y + (feet ? 0.02 : t.head + 0.1), t.pos.z).project(camera);
      const on = this.v.z < 1 && Math.abs(this.v.x) < 1 && Math.abs(this.v.y) < 1;
      const x = (this.v.x + 1) / 2 * W, y = (1 - this.v.y) / 2 * H;
      const d = Math.hypot(t.pos.x - hero.x, t.pos.z - hero.z);
      let op = on && !hidden ? 1 : 0;
      if (this.style === 'mot') op *= THREE.MathUtils.clamp((this.near - d) / 2, 0, 1);
      if (feet) {
        // the ellipse's width: half a metre either side of the feet along the screen
        this.w.set(t.pos.x + 0.5, t.pos.y + 0.02, t.pos.z).project(camera);
        const rx = Math.max(10, Math.abs((this.w.x + 1) / 2 * W - x)), ry = Math.max(4, rx * 0.32);
        const stroke = kind === 'follow' ? ' stroke-dasharray="4 3"' : '';
        e.innerHTML = `<svg width="${(rx * 2 + 2).toFixed(0)}" height="${(ry * 2 + 8).toFixed(0)}" viewBox="${(-rx - 1).toFixed(1)} ${(-ry - 4).toFixed(1)} ${(rx * 2 + 2).toFixed(1)} ${(ry * 2 + 8).toFixed(1)}"><ellipse rx="${rx.toFixed(1)}" ry="${ry.toFixed(1)}" fill="none" stroke="currentColor"${stroke}/>${kind === 'event' ? `<ellipse rx="${(rx + 0).toFixed(1)}" ry="${(ry + 3).toFixed(1)}" fill="none" stroke="currentColor" opacity=".55"/>` : ''}</svg>`;
        e.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) translate(-50%, -50%)`;
      } else e.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) translate(-50%, -100%)`;
      e.style.opacity = String(op);
    }
    for (const [who, t] of this.tags) if (!live.has(who)) t.el.style.opacity = '0';
  }

  /** the marks shown, for the proofs */
  state(): Array<{ who: string; kind: string; opacity: number }> { return [...this.tags].map(([who, t]) => ({ who, kind: t.kind, opacity: +(t.el.style.opacity || 0) })); }
}
