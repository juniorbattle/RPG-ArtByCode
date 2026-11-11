import { el } from './style';

/** The place's name on arriving there (journal Passe MK4, the sheet's mock-up, DEV `zonecard=1`; `zonecard=hold` keeps it for a capture): a title card in the
 *  design system's manner (direction A « Voile »: the name in the title font over a one-pixel accent rule, on the spot veil, no box), faded in, held, faded
 *  out (the operator's rule of 2026-11-03: short fades on title cards). */
const CSS = `
.pm-zone{position:fixed;z-index:26;left:50%;top:18%;transform:translateX(-50%);pointer-events:none;padding:18px 90px 20px;text-align:center;background:var(--ds-grad-spot);opacity:0;transition:opacity .45s}
.pm-zone b{display:block;font:400 var(--ds-fs-title)/1.1 var(--ds-title);color:var(--ds-ivory);white-space:nowrap}
.pm-zone i{display:block;width:64px;margin:10px auto 8px;border-top:1px solid var(--ds-accent)}
.pm-zone small{display:block;font-size:var(--ds-fs-small);color:var(--ds-ivory)}
body.pm-full .pm-zone{visibility:hidden}
`;

export function showZoneCard(name: string, line: string, hold = false): void {
  if (!document.getElementById('pm-zone-css')) { const st = document.createElement('style'); st.id = 'pm-zone-css'; st.textContent = CSS; document.head.appendChild(st); }
  const e = el('div', 'pm pm-zone', `<b></b><i></i><small></small>`);
  (e.querySelector('b') as HTMLElement).textContent = name; (e.querySelector('small') as HTMLElement).textContent = line;
  document.body.appendChild(e);
  requestAnimationFrame(() => { e.style.opacity = '1'; });
  if (!hold) setTimeout(() => { e.style.opacity = '0'; setTimeout(() => e.remove(), 600); }, 2100);
}
