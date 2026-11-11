import { BTN, type Btn, type PadFamily } from './pad';
import { word } from '../narrative/text';

/** The pad's prompts in the interface's keycap (journal Passe MN1; direction A « Voile »: keys in outline, no drop shadow, ivory, ink and one
 *  accent). The cap keeps its one-pixel outline in the current colour; the face buttons go round, the shoulders and the small buttons stay a
 *  pill. Xbox and Nintendo letters, the shoulders' names and the signs + and − are text of the embedded text font (in its latin subset); the
 *  PlayStation symbols, the menu's lines, the View and Create buttons, the D-pad and the sticks are drawn (SVG, the current colour), since the
 *  fonts hold none of them (U+25A1, U+25B3, U+25CB, U+2630 are outside LATIN_RANGE). Pure strings, run in Node by the tests. */

export type GlyphStyle = 'outline' | 'colour' | 'word';

/** the button's name as the pad's maker prints it (the cap's accessible name and its tooltip), in the page's language (journal Passe TF1: « Croix »,
 *  « Affichage »...) */
export function padName(f: PadFamily, b: Btn): string { return word(padNameEn(f, b)); }
function padNameEn(f: PadFamily, b: Btn): string {
  const face: Record<PadFamily, string[]> = { xbox: ['A', 'B', 'X', 'Y'], ps: ['Cross', 'Circle', 'Square', 'Triangle'], nintendo: ['B', 'A', 'Y', 'X'] };
  if (b <= 3) return face[f][b];
  const n: Record<PadFamily, Record<number, string>> = {
    xbox: { 4: 'LB', 5: 'RB', 6: 'LT', 7: 'RT', 8: 'View', 9: 'Menu', 10: 'LS', 11: 'RS' },
    ps: { 4: 'L1', 5: 'R1', 6: 'L2', 7: 'R2', 8: 'Create', 9: 'Options', 10: 'L3', 11: 'R3' },
    nintendo: { 4: 'L', 5: 'R', 6: 'ZL', 7: 'ZR', 8: 'Minus', 9: 'Plus', 10: 'LS', 11: 'RS' },
  };
  return n[f][b] ?? ({ 12: 'D-pad up', 13: 'D-pad down', 14: 'D-pad left', 15: 'D-pad right', 16: 'Home' } as Record<number, string>)[b] ?? `Button ${b}`;
}

const svg = (w: number, body: string) => `<svg class="pad-s" width="${w}" height="14" viewBox="0 0 ${w} 14" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
/** the PlayStation face symbols, drawn on a 14 px grid */
const PS: string[] = [
  svg(14, '<path d="M3 3 11 11M11 3 3 11"/>'),
  svg(14, '<circle cx="7" cy="7" r="4.6"/>'),
  svg(14, '<rect x="2.8" y="2.8" width="8.4" height="8.4"/>'),
  svg(14, '<path d="M7 2.4 12 11.2H2Z"/>'),
];
const MENU = svg(14, '<path d="M3 4.2h8M3 7h8M3 9.8h8"/>');
const VIEW = svg(14, '<rect x="2.4" y="2.4" width="6.4" height="6.4"/><path d="M5.2 11.6h6.4V5.2"/>');
const CREATE = svg(14, '<path d="M7 2.6v3M3.4 5l2.2 2M10.6 5 8.4 7M4.4 11h5.2"/>');
const stick = (letter: string) => `<span class="pad-l">${letter}</span>`;
/** the D-pad, the direction pressed filled */
export function dpad(dir: 'up' | 'down' | 'left' | 'right' | null): string {
  const arm = { up: 'M5.4 1.6h3.2v3.8H5.4Z', down: 'M5.4 8.6h3.2v3.8H5.4Z', left: 'M1.6 5.4h3.8v3.2H1.6Z', right: 'M8.6 5.4h3.8v3.2H8.6Z' };
  return svg(14, `<path d="M5.4 1.6h3.2v3.8h3.8v3.2H8.6v3.8H5.4V8.6H1.6V5.4h3.8Z"/>${dir ? `<path d="${arm[dir]}" fill="currentColor" stroke="none"/>` : ''}`);
}

/** the brands' own colours, for the « colour » style only (an alternative on the sheet: outside the palette of UM-S3) */
const BRAND: Record<PadFamily, string[]> = {
  xbox: ['#5dc21e', '#e8382f', '#2f7fe8', '#f4c20d'],
  ps: ['#5e8fd6', '#e05a6a', '#d58ac2', '#3bbf9c'],
  nintendo: ['#cfd2db', '#cfd2db', '#cfd2db', '#cfd2db'],
};

/** what the cap holds and its shape: `round` a face button or a stick, `pill` a shoulder or a small button */
export function capOf(f: PadFamily, b: Btn, style: GlyphStyle = 'outline'): { html: string; shape: 'round' | 'pill'; label: string; colour?: string } {
  const label = padName(f, b);
  if (b <= 3) {
    if (style === 'word') return { html: label, shape: 'pill', label };
    const html = f === 'ps' ? PS[b] : `<span class="pad-l">${label}</span>`;
    return { html, shape: 'round', label, colour: style === 'colour' ? BRAND[f][b] : undefined };
  }
  if (b === BTN.START) return { html: f === 'nintendo' ? '<span class="pad-l">+</span>' : MENU, shape: f === 'xbox' || f === 'nintendo' ? 'round' : 'pill', label };
  if (b === BTN.VIEW) return { html: f === 'nintendo' ? '<span class="pad-l">−</span>' : f === 'ps' ? CREATE : VIEW, shape: f === 'ps' ? 'pill' : 'round', label };
  if (b === BTN.LS || b === BTN.RS) return { html: stick(b === BTN.LS ? 'L' : 'R'), shape: 'round', label };
  if (b >= BTN.UP && b <= BTN.RIGHT) return { html: dpad((['up', 'down', 'left', 'right'] as const)[b - BTN.UP]), shape: 'round', label };
  return { html: `<span class="pad-l">${label}</span>`, shape: 'pill', label };
}

/** the caps' styles, beside the design system's keycap (src/ui/design/system.ts): the same outline, height and colour; round for a face button */
export const PAD_CSS = `
kbd.pad{display:inline-flex!important;align-items:center;justify-content:center;gap:0;vertical-align:middle}
kbd.pad.round{width:28px;min-width:28px!important;height:28px;padding:0!important;border-radius:50%!important}
kbd.pad.pill{border-radius:13px!important;min-width:40px!important}
kbd.pad .pad-l{display:block;line-height:26px}
kbd.pad .pad-s{display:block}
kbd.pad.fill{border-color:transparent!important;color:var(--ds-ink)!important}
kbd.pad.fill .pad-l{font-weight:700}
`;
