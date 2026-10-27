import * as THREE from 'three';
import { placeName, type PlaceId } from '../simulation';
import { tx } from '../narrative/text';
import { el } from './style';

/** The version 2's ways out on screen (journal Passe VP5, the operator's « entrées / sorties comme dans un final fantasy 9 »): over each way
 *  out of the page a tag naming the place it leads to, shown as the hero comes near it; walking through it darkens the screen and goes there
 *  (the page reports the way taken: the square's lane end, the quay's ends). DOM over the canvas, in the design system's tag frame. */

export interface WayOut { to: PlaceId; anchor: [number, number, number] }

const CSS = `
.pm-exit{position:fixed;z-index:25;left:0;top:0;pointer-events:none;padding:0 8px;white-space:nowrap;font-size:var(--ds-fs-small);letter-spacing:.06em;text-transform:uppercase;color:var(--ds-ivory);border:calc(3 * var(--ds-px)) solid transparent;border-image:var(--ds-f-tag) 3 fill / calc(3 * var(--ds-px)) stretch;image-rendering:pixelated;opacity:0;transition:opacity .25s}
.pm-exit::after{content:'';position:absolute;left:50%;bottom:calc(-9px - 3 * var(--ds-px));margin-left:-6px;border:6px solid transparent;border-top-color:var(--ds-amberHi)}
.pm-fade{position:fixed;inset:0;z-index:60;background:#05060c;opacity:0;transition:opacity .35s ease-in;pointer-events:none}
`;

export class ExitMarkers {
  private tags: HTMLElement[];
  private leaving = false;
  private readonly v = new THREE.Vector3();

  constructor(private readonly ways: WayOut[], near = 9) {
    this.near = near;
    if (!document.getElementById('pm-exit-css')) { const st = document.createElement('style'); st.id = 'pm-exit-css'; st.textContent = CSS; document.head.appendChild(st); }
    this.tags = ways.map((w) => {
      const t = el('div', 'pm pm-exit', tx('v2.exit.to', { place: placeName(w.to, true) }));
      t.dataset.to = w.to; document.body.appendChild(t);
      return t;
    });
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
      const x = THREE.MathUtils.clamp((this.v.x + 1) / 2 * W, 70, W - 70), y = THREE.MathUtils.clamp((1 - this.v.y) / 2 * H, 40, H - 60);
      t.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) translate(-50%, -100%)`;
      t.style.opacity = on && !this.leaving ? String(THREE.MathUtils.clamp((this.near - d) / 2.5, 0, 1)) : '0';
    });
    if (taken && !this.leaving) {
      this.leaving = true;
      const f = el('div', 'pm-fade'); document.body.appendChild(f);
      requestAnimationFrame(() => { f.style.opacity = '1'; });
      setTimeout(() => leave(taken), 380);
    }
  }

  /** the ways' tags, for the proofs: where each stands and how visible */
  state(): Array<{ to: string; opacity: number }> { return this.tags.map((t) => ({ to: t.dataset.to ?? '', opacity: +(t.style.opacity || 0) })); }
}
