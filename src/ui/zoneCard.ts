import { el } from './style';

/** The place's name on arriving there by a way out (the operator's MK-13 « Un carton à chaque arrivée par une sortie », journal Passes MK4 / MK5): a title card in the
 *  design system's manner (direction A « Voile »: the name in the title font over a one-pixel accent rule, on the spot veil, no box), faded in, held, faded
 *  out (the operator's rule of 2026-11-03: short fades on title cards). `hold` keeps it (a test or a capture). */
const CSS = `
.pm-zone{position:fixed;z-index:26;left:50%;top:18%;transform:translateX(-50%);pointer-events:none;padding:26px 110px 28px;text-align:center;background:radial-gradient(closest-side,var(--ds-veil-strong) 78%,transparent 100%);opacity:0;transition:opacity .45s}
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
