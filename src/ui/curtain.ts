/** The black curtain before a page change (the operator's rule of 2026-11-03, « no hard cut between screens »; his AU-07 « Appliquer la règle : le même
 *  fondu au noir avant chaque changement de page », journal Passe AU2; built in journal Passe LC4): the fade the walk through a way out already draws
 *  (src/ui/exits.ts, `.pm-fade`, 0.35 s to the page's ink), then the next page, whose loading screen opens on that same ink and lifts once it is ready.
 *  A curtain already down (a way out walked) is not drawn twice; the version 2's sound goes down meanwhile (its own wait, SA-15). The fade is kept with the
 *  reduced motion (RG-5, « les fondus gardés »). Nothing else: no DOM read, the next page's own loading does the rest. */

/** the fade's length, as the way out's (ms), and the moment the page leaves after it starts */
export const CURTAIN_MS = 350, LEAVE_MS = 380;

/** draws the curtain (or finds the one a way out drew) and resolves once it is down */
export function curtainDown(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  const down = [...document.querySelectorAll<HTMLElement>('.pm-fade, .pm-curtain')].some((f) => f.style.opacity === '1');
  if (down) return Promise.resolve();
  const f = document.createElement('div');
  f.className = 'pm-curtain';
  f.setAttribute('aria-hidden', 'true');
  f.style.cssText = `position:fixed;inset:0;z-index:2147483000;background:var(--ds-ink,#0b0d14);opacity:0;transition:opacity ${CURTAIN_MS / 1000}s ease-in;pointer-events:all`;
  document.body.appendChild(f);
  requestAnimationFrame(() => requestAnimationFrame(() => { f.style.opacity = '1'; }));
  return new Promise((r) => setTimeout(r, LEAVE_MS));
}

/** leaves for `url` (or reloads the page) behind the curtain, once the sound's own fade has had its time */
export function leavePage(url: string | 'reload'): void {
  const wait: number = (window as { __soundLeave?: () => number }).__soundLeave?.() ?? 0;
  const go = () => { if (url === 'reload') location.reload(); else location.assign(url); };
  void curtainDown().then(() => { const left = wait - LEAVE_MS; if (left > 0) setTimeout(go, left); else go(); });
}
