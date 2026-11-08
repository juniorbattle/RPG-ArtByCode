import * as THREE from 'three';
import type { Gesture, Hail } from '../simulation/v2react';
import { el } from './style';

/** The passers-by who greet the hero, and the rivals who show their stance (lot L5, « la ville qui réagit »; the operator's choice EV-12 « Les places lisent le
 *  pouls, la célébrité compte », journal Passe EV2: « La célébrité change ce que disent les passants et qui salue le héros »). The page hands its walkers and
 *  its standing rivals; the first time the hero comes near one, what the state says it does (src/simulation/v2react.ts hailOf / gestureOf) is played: a walker
 *  stops and turns to the hero (a greeting, a whisper) or away (a wanted name), a rival turns to them (a friend, a respect) or away (a grudge), and its words
 *  float over its head a moment, on the design system's veil, as the ways out's tags do (src/ui/exits.ts). Once per walker and page: a reload starts again.
 *  A version 2 game only (its pages alone build one). DOM over the canvas. */

export interface HailWalker {
  /** the walker's order on the page (a crowd walker) or the person's id (a rival standing) */
  key: number | string;
  pos: THREE.Vector3; height: number;
  /** stops the walker a while (a standing person: nothing) */
  stop(secs: number): void;
  /** turns the walker toward a ground direction */
  face(dx: number, dz: number): void;
}

const CSS = `
.pm-hail{position:fixed;z-index:24;left:0;top:0;pointer-events:none;padding:5px 28px;white-space:nowrap;font-size:var(--ds-fs-small);color:var(--ds-ivory);background:var(--ds-grad-spot);opacity:0;transition:opacity .3s}
.pm-hail.whisper,.pm-hail.gesture{font-style:italic}
body.pm-full .pm-hail,body.pm-talking .pm-hail{visibility:hidden}
`;

/** how near the hero comes before a walker reacts (m), and a rival standing; how long a walker stops and its words stay (s) */
export const HAIL = { near: 2.4, nearPerson: 3.2, stop: 2.6, show: 2.8, most: 2 } as const;

export class Hails {
  private done = new Set<number | string>();
  private tags: Array<{ el: HTMLElement; w: HailWalker; until: number }> = [];
  private readonly v = new THREE.Vector3();
  private t = 0;
  /** what was played, in order (the proofs read it): the walker's key, the kind, the words */
  readonly played: Array<{ key: number | string; kind: string; text: string }> = [];

  constructor(private readonly crowd: (k: number, n: number) => Hail | null, private readonly person: (who: string) => Gesture | null) {
    if (!document.getElementById('pm-hail-css')) { const st = document.createElement('style'); st.id = 'pm-hail-css'; st.textContent = CSS; document.head.appendChild(st); }
  }

  /** each frame (dt the page's step; 0 = a frozen frame, nothing plays): the walkers near the hero react once, the words follow their heads */
  update(dt: number, camera: THREE.Camera, hero: { x: number; z: number }, walkers: HailWalker[], paused = false): void {
    this.t += dt;
    if (dt > 0 && !paused) for (const w of walkers) {
      if (this.done.has(w.key)) continue;
      const dx = hero.x - w.pos.x, dz = hero.z - w.pos.z, d = Math.hypot(dx, dz), person = typeof w.key === 'string';
      if (d > (person ? HAIL.nearPerson : HAIL.near)) continue;
      this.done.add(w.key);
      // (a walker's words: the page's n-th greeting, so two side by side say different things)
      const h = person ? this.person(w.key as string) : this.crowd(w.key as number, this.played.filter((p) => typeof p.key === 'number').length);
      if (!h) continue;
      const away = h.kind === 'avoid' || h.kind === 'turn';
      w.face(away ? -dx : dx, away ? -dz : dz);
      w.stop(HAIL.stop);
      this.played.push({ key: w.key, kind: h.kind, text: h.text });
      if (h.text && this.tags.length < HAIL.most) {
        const t = el('div', `pm pm-hail${h.kind === 'whisper' ? ' whisper' : person ? ' gesture' : ''}`, h.text);
        t.dataset.kind = h.kind; document.body.appendChild(t);
        this.tags.push({ el: t, w, until: this.t + HAIL.show });
        requestAnimationFrame(() => { t.style.opacity = '1'; });
      }
    }
    const W = window.innerWidth, H = window.innerHeight;
    this.tags = this.tags.filter((g) => {
      if (this.t > g.until + 0.4) { g.el.remove(); return false; }
      if (this.t > g.until) g.el.style.opacity = '0';
      this.v.set(g.w.pos.x, g.w.height + 0.35, g.w.pos.z).project(camera);
      const half = Math.min(W / 2, (g.el.offsetWidth || 160) / 2), x = THREE.MathUtils.clamp((this.v.x + 1) / 2 * W, half, W - half), y = THREE.MathUtils.clamp((1 - this.v.y) / 2 * H, 40, H - 60);
      g.el.style.transform = `translate(${x.toFixed(0)}px, ${y.toFixed(0)}px) translate(-50%, -100%)`;
      return true;
    });
  }

  /** the words on screen now (the proofs) */
  shown(): string[] { return this.tags.map((g) => g.el.textContent ?? ''); }
}
