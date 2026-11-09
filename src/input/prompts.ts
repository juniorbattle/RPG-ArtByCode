import { capButton, type CapPlace, type PadFamily } from './pad';
import { capOf, PAD_CSS, type GlyphStyle } from './glyphs';

/** The key caps of the interface as pad buttons (journal Passe MN1): while the pad was the last device used, every `<kbd>` the pages show holds
 *  the button the pad presses for that key in that place (src/input/pad.ts, `capButton`), drawn in the design system's keycap; a keyboard
 *  shortcut the pad reaches through the menu is hidden; a key press gives every cap back its key. The pages are not touched: the caps are found
 *  in the DOM as they come (a MutationObserver), their key kept in `data-key`. */

export interface PromptMode { family: PadFamily; style: GlyphStyle }

// a cap may say which place's key it shows (`data-cap`, the tutorial's texts: journal Passe TU3): the exploring keys, the duel's
const placeOf = (k: Element): CapPlace => (k.closest('#pm-hints, [data-cap=hints]') ? 'hints' : k.closest('.pm-scene') ? 'scene' : k.closest('#arena-hud, [data-cap=arena]') ? 'arena' : k.closest('.pm-menu') ? 'menu' : 'other');

/** a cap's key: the one it was written with, whatever it shows now */
export const capKey = (k: Element): string => (k as HTMLElement).dataset?.key ?? k.textContent ?? '';

export class Prompts {
  private mode: PromptMode | null = null;
  private obs: MutationObserver | null = null;
  /** every change of mode, for the proofs */
  readonly changes: Array<string> = [];

  get current(): PromptMode | null { return this.mode; }

  /** a mode held by the review (?padglyph=): the pad's own changes leave it */
  private forced = false;
  force(mode: PromptMode): void { this.forced = false; this.set(mode); this.forced = true; }

  /** the pad's family and style, or null: the keys */
  set(mode: PromptMode | null): void {
    if (this.forced || (mode?.family === this.mode?.family && mode?.style === this.mode?.style)) return;
    this.mode = mode ? { ...mode } : null;
    this.changes.push(mode ? `${mode.family}:${mode.style}` : 'keys');
    if (mode) {
      if (!document.getElementById('pad-css')) { const st = document.createElement('style'); st.id = 'pad-css'; st.textContent = PAD_CSS; document.head.appendChild(st); }
      if (!this.obs) {
        this.obs = new MutationObserver((list) => {
          if (!this.mode) return;
          for (const m of list) for (const n of m.addedNodes) {
            if (!(n instanceof Element)) continue;
            if (n.tagName === 'KBD') this.apply(n as HTMLElement); else n.querySelectorAll('kbd').forEach((k) => this.apply(k));
          }
        });
        this.obs.observe(document.body, { childList: true, subtree: true });
      }
    }
    document.body.classList.toggle('pm-pad', !!mode);
    document.querySelectorAll('kbd').forEach((k) => this.apply(k));
  }

  private apply(k: HTMLElement): void {
    const key = capKey(k);
    if (k.dataset.key !== undefined) this.restore(k);
    if (!this.mode) return;
    const b = capButton(key, placeOf(k));
    if (b === null) return;
    k.dataset.key = key;
    if (b === 'hide') { k.style.display = 'none'; return; }
    const c = capOf(this.mode.family, b, this.mode.style);
    k.innerHTML = c.html;
    k.classList.add('pad', c.shape);
    if (c.colour) { k.classList.add('fill'); k.style.background = c.colour; }
    k.setAttribute('role', 'img'); k.setAttribute('aria-label', c.label);
  }

  private restore(k: HTMLElement): void {
    k.textContent = k.dataset.key ?? '';
    delete k.dataset.key;
    k.classList.remove('pad', 'round', 'pill', 'fill');
    k.style.display = ''; k.style.background = '';
    k.removeAttribute('role'); k.removeAttribute('aria-label');
  }
}

let shared: Prompts | null = null;
/** the page's one set of caps (the pad's layer and the review share it) */
export function prompts(): Prompts { return (shared ??= new Prompts()); }

/** DEV only, for the review of journal Passe MN1: `padglyph=xbox|ps|nintendo[:outline|colour|word]` shows every cap as the pad's, no pad needed */
export function reviewPrompts(params: URLSearchParams): Prompts {
  const [family, style = 'outline'] = (params.get('padglyph') ?? 'xbox').split(':');
  const p = prompts();
  const on = () => p.force({ family: (['xbox', 'ps', 'nintendo'].includes(family) ? family : 'xbox') as PadFamily, style: (['outline', 'colour', 'word'].includes(style) ? style : 'outline') as GlyphStyle });
  if (document.body) on(); else addEventListener('DOMContentLoaded', on);
  (window as unknown as { __prompts: Prompts }).__prompts = p;
  return p;
}
