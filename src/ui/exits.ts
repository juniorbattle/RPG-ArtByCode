import * as THREE from 'three';
import { placeName, type PlaceId } from '../simulation';
import { tx } from '../narrative/text';
import { el } from './style';

/** The version 2's ways out on screen (journal Passe VP5, the operator's « entrées / sorties comme dans un final fantasy 9 »): over each way
 *  out of the page a tag naming the place it leads to, shown as the hero comes near it; walking through it darkens the screen and goes there
 *  (the page reports the way taken: the square's lane end, the quay's ends). DOM over the canvas, on the design system's veil. Every way on screen shows the
 *  tag's accent chevron from any distance, the tag taking its place near (the operator's MK-12 « Le chevron sur chaque sortie à l’écran, le nom de près »,
 *  journal Passe MK5); a way shut has it grey (MK-14 « Le chevron en gris, l’étiquette dit pourquoi »). The chevron is the ways' shape, the diamond the people's
 *  (src/ui/npcMarks.ts), the same on the minimap. */

/** `shut`: why the way is closed now (lot L6, FE-7: the Lanterns' parade fills the street to the forecourt that evening), said on its tag instead of the place */
export interface WayOut { to: PlaceId; anchor: [number, number, number]; shut?: string | null; note?: string | null }

/** from how far a way's name takes its chevron's place (m; faded over the last 2.5 m): 9 in journal Passe VP5, 13 since the operator's trial of 2026-11-11 (journal
 *  Passe AL1: the name read from 8 to 22 % of a place's floor, the chevrons alone elsewhere, « visuellement on peut parfois galerer a trouver ») */
export const NAME_NEAR = 13;

const CSS = `
.pm-exit{position:fixed;z-index:25;left:0;top:0;pointer-events:none;padding:6px 34px;white-space:nowrap;font-size:var(--ds-fs-small);color:var(--ds-ivory);background:var(--ds-grad-spot);opacity:0;transition:opacity .25s}
.pm-exit::after{content:'';position:absolute;left:50%;bottom:-8px;margin-left:-6px;border:6px solid transparent;border-top-color:var(--ds-accent)}
body.pm-full .pm-exit,body.pm-talking .pm-exit{visibility:hidden}
.pm-exit.shut::after,.pm-exfar.shut::before{border-top-color:var(--ds-muted)}
.pm-exfar{position:fixed;z-index:24;left:0;top:0;pointer-events:none;width:34px;height:28px;display:grid;place-items:center;background:var(--ds-grad-spot);opacity:0;transition:opacity .3s}
.pm-exfar::before{content:'';border:6px solid transparent;border-top-color:var(--ds-accent);margin-top:8px}
body.pm-full .pm-exfar,body.pm-talking .pm-exfar{visibility:hidden}
.pm-fade{position:fixed;inset:0;z-index:60;background:var(--ds-ink);opacity:0;transition:opacity .35s ease-in;pointer-events:none}
`;

export class ExitMarkers {
  private tags: HTMLElement[];
  private leaving = false;
  private readonly v = new THREE.Vector3();

  /** each way's chevron, shown where its tag is not read yet (MK-12) */
  private far: HTMLElement[];
  constructor(private readonly ways: WayOut[], near = NAME_NEAR) {
    this.near = near;
    if (!document.getElementById('pm-exit-css')) { const st = document.createElement('style'); st.id = 'pm-exit-css'; st.textContent = CSS; document.head.appendChild(st); }
    this.tags = ways.map((w) => {
      // a way open says where it leads, and what is shut there or opens beyond it (journal Passe AL1, src/simulation/v2access.ts); a way shut, why (MK-14)
      const t = el('div', 'pm pm-exit', w.shut ?? (w.note ? tx('v2.exit.toNote', { place: placeName(w.to, true), note: w.note }) : tx('v2.exit.to', { place: placeName(w.to, true) })));
      t.dataset.to = w.to; if (w.shut) t.classList.add('shut'); document.body.appendChild(t);
      return t;
    });
    this.far = ways.map((w) => { const e = el('div', `pm-exfar${w.shut ? ' shut' : ''}`); e.dataset.to = w.to; e.setAttribute('aria-hidden', 'true'); document.body.appendChild(e); return e; });
  }
  private readonly near: number;

  /** each frame: the tags over their anchors (faded in within `near` metres of the hero, out of sight off screen); the way the page reports
   *  taken darkens the screen, then `leave` goes there (once) */
  update(camera: THREE.Camera, hero: { x: number; z: number }, taken: PlaceId | null, leave: (to: PlaceId) => void): void {
    const W = window.innerWidth, H = window.innerHeight;
    this.ways.forEach((w, i) => {
      const t = this.tags[i], d = Math.hypot(w.anchor[0] - hero.x, w.anchor[2] - hero.z);
      this.v.set(w.anchor[0], w.anchor[1], w.anchor[2]).project(camera);
      const on = this.v.z < 1 && Math.abs(this.v.x) < 1.05 && Math.abs(this.v.y) < 1.05;
      // a tag stays whole on screen, however narrow (the audit of journal Passe UM1: it left a phone's screen)
      const half = Math.min(W / 2, (t.offsetWidth || 140) / 2), x = THREE.MathUtils.clamp((this.v.x + 1) / 2 * W, half, W - half), y = THREE.MathUtils.clamp((1 - this.v.y) / 2 * H, 40, H - 60);
      t.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) translate(-50%, -100%)`;
      const tagOp = on && !this.leaving ? THREE.MathUtils.clamp((this.near - d) / 2.5, 0, 1) : 0;
      t.style.opacity = String(tagOp);
      // the chevron where the tag is not read yet, at the way's sign (MK-12)
      const f = this.far[i];
      f.style.transform = `translate(${((this.v.x + 1) / 2 * W).toFixed(0)}px, ${((1 - this.v.y) / 2 * H).toFixed(0)}px) translate(-50%, -100%)`;
      f.style.opacity = on && !this.leaving ? String(1 - tagOp) : '0';
    });
    if (taken && !this.leaving) {
      this.leaving = true;
      const f = el('div', 'pm-fade'); document.body.appendChild(f);
      requestAnimationFrame(() => { f.style.opacity = '1'; });
      setTimeout(() => leave(taken), 380);
    }
  }

  /** the ways' tags, for the proofs: where each stands and how visible */
  state(): Array<{ to: string; opacity: number; chevron: number; shut: boolean; text: string }> { return this.tags.map((t, i) => ({ to: t.dataset.to ?? '', opacity: +(t.style.opacity || 0), chevron: +(this.far[i].style.opacity || 0), shut: t.classList.contains('shut'), text: t.textContent ?? '' })); }
}
