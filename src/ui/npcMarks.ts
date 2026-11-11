import * as THREE from 'three';
import type { MarkKind } from '../simulation/v2offers';
import { PHONE_QUERY } from './design/tokens';
import { el } from './style';

/** The people worth talking to, marked on the scene (the operator's MK1 sheet, journal Passe MK2: MK-2 « Losange au-dessus de la tête », MK-3 « Trois sortes,
 *  trois formes du losange »). DOM over the canvas, in the design system's manner (direction A « Voile »: no box on the scene, one-pixel lines, one accent):
 *  a small diamond over the head of each person marked, in the accent, on the spot veil of the ways out's tags (src/ui/exits.ts); hollow for an item, filled for
 *  an event, hollow round a filled one for a follow-up. It follows the person, fades at the screen's edge, hides while a page, a dialogue or a scene is open; it
 *  never moves by itself (fades only). Who is marked comes from the state (src/simulation/v2marks.ts). */

export interface MarkTarget { who: string; pos: THREE.Vector3; /** the head's height over the feet (m) */ head: number }

const CSS = `
.pm-mark{position:fixed;z-index:23;left:0;top:0;width:40px;height:30px;display:grid;place-items:center;pointer-events:none;opacity:0;transition:opacity .3s;color:var(--ds-accent);background:var(--ds-grad-spot)}
.pm-mark svg{width:15px;height:15px;display:block}
.pm-mk{display:inline-block;width:12px;height:12px;margin-right:8px;vertical-align:-1px;color:var(--ds-accent)}
.pm-mk svg{display:block;width:100%;height:100%}
@media ${PHONE_QUERY}{.pm-mark{width:28px;height:22px}.pm-mark svg{width:10px;height:10px}}
body.pm-full .pm-mark,body.pm-talking .pm-mark{visibility:hidden}
`;

export function installMarkCss(): void {
  if (!document.getElementById('pm-mark-css')) { const st = document.createElement('style'); st.id = 'pm-mark-css'; st.textContent = CSS; document.head.appendChild(st); }
}

/** the diamond's three forms (a 15-unit box, one-unit strokes) */
export function markGlyph(kind: MarkKind): string {
  const d = 'M7.5 1.5 L13.5 7.5 L7.5 13.5 L1.5 7.5 Z', inner = 'M7.5 5 L10 7.5 L7.5 10 L5 7.5 Z';
  const shape = kind === 'event' ? `<path d="${d}" fill="currentColor"/>`
    : kind === 'follow' ? `<path d="${d}" fill="none" stroke="currentColor"/><path d="${inner}" fill="currentColor"/>`
      : `<path d="${d}" fill="none" stroke="currentColor"/>`;
  return `<svg viewBox="0 0 15 15" aria-hidden="true">${shape}</svg>`;
}
/** the kind's word (the prompt near the person, MK-3) */
export const MARK_WORD: Record<MarkKind, 'v2.mark.item' | 'v2.mark.event' | 'v2.mark.follow'> = { item: 'v2.mark.item', event: 'v2.mark.event', follow: 'v2.mark.follow' };

export class NpcMarks {
  private tags = new Map<string, { el: HTMLElement; kind: MarkKind }>();
  private readonly v = new THREE.Vector3();
  /** who is marked and how (the page sets it from the state) */
  marks: ReadonlyMap<string, MarkKind> = new Map();

  constructor() { installMarkCss(); }

  private tagOf(who: string, kind: MarkKind): HTMLElement {
    let t = this.tags.get(who);
    if (t && t.kind !== kind) { t.el.remove(); this.tags.delete(who); t = undefined; }
    if (!t) {
      const e = el('div', 'pm pm-mark', markGlyph(kind));
      e.dataset.who = who; e.dataset.kind = kind; e.setAttribute('aria-hidden', 'true'); document.body.appendChild(e);
      t = { el: e, kind }; this.tags.set(who, t);
    }
    return t.el;
  }

  /** each frame: each marked person's diamond over the head, faded out off screen and while `hidden`; returns the people whose mark shows */
  update(camera: THREE.Camera, targets: MarkTarget[], hidden: boolean): string[] {
    const W = window.innerWidth, H = window.innerHeight, live = new Set<string>(), shown: string[] = [];
    for (const t of targets) {
      const kind = this.marks.get(t.who);
      if (!kind) continue;
      live.add(t.who);
      const e = this.tagOf(t.who, kind);
      this.v.set(t.pos.x, t.pos.y + t.head + 0.1, t.pos.z).project(camera);
      const on = this.v.z < 1 && Math.abs(this.v.x) < 1 && Math.abs(this.v.y) < 1;
      e.style.transform = `translate(${((this.v.x + 1) / 2 * W).toFixed(0)}px, ${((1 - this.v.y) / 2 * H).toFixed(0)}px) translate(-50%, -100%)`;
      const show = on && !hidden;
      e.style.opacity = show ? '1' : '0';
      if (show) shown.push(t.who);
    }
    for (const [who, t] of this.tags) if (!live.has(who)) { t.el.remove(); this.tags.delete(who); }
    return shown;
  }

  /** the marks on the page, for the proofs */
  state(): Array<{ who: string; kind: string; opacity: number }> { return [...this.tags].map(([who, t]) => ({ who, kind: t.kind, opacity: +(t.el.style.opacity || 0) })); }
}
