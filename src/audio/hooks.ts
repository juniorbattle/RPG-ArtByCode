import { dbGain, REFUSAL_LIFT, STEP_EVERY, type Effect } from './score';

/** The effects that no code played (journal Passe SN1: `click`, `open`, `coin`, `step`; lot S0, journal Passe SN2), wired from outside the interface so
 *  that a screen can change without knowing about the sound: a button's click on the document, a dialog appearing in it, the save's coins, the
 *  hero's walk read from the page's handle, an action the game refuses (lot S2). The screen's darkening at a way out takes the sound down with it (lot S1, journal Passe SN3); `go` asks what
 *  the fade still needs. A version 2 page only: src/audio/Sound.ts installs them with the engine. */

interface Hooked { play(e: Effect, gain?: number): void; leave(): number }
interface Game { subscribe(f: () => void): void; state(): { player: { coins: number } }; act(a: unknown): { ok: boolean } }
interface Pos { x: number; z: number }

/** where the hero of this page stands: the town's actor, a square's, or the forecourt's walker */
function hero(w: Record<string, any>): Pos | null {   // eslint-disable-line @typescript-eslint/no-explicit-any
  const p = w.__app?.actors?.player?.pos ?? w.__plaza?.player?.pos;
  if (p) return p;
  return typeof w.__arena?.walkerX === 'number' ? { x: w.__arena.walkerX, z: 0 } : null;
}

export function installSoundHooks(s: Hooked): void {
  const w = window as unknown as Record<string, any>;   // eslint-disable-line @typescript-eslint/no-explicit-any
  w.__sound = s;   // the proofs' handle, as window.__game
  w.__soundLeave = () => s.leave();
  document.addEventListener('click', (e) => { if ((e.target as Element | null)?.closest?.('button, [role="button"]')) s.play('click'); }, true);

  let open = false;
  new MutationObserver((changes) => {
    if (!changes.some((c) => c.addedNodes.length || c.removedNodes.length)) return;
    const now = !!document.querySelector('[role="dialog"]');
    if (now && !open) s.play('open');
    open = now;
    if (document.querySelector('.pm-fade')) s.leave();
  }).observe(document.body, { childList: true, subtree: true });

  // the game's handle may come after the engine (a page's order): looked for until it is there, and the walk read a few times per step
  let coins: number | null = null, at: Pos | null = null, walked = 0;
  window.setInterval(() => {
    const g = w.__game as Game | undefined;
    if (g && coins === null) {
      coins = g.state().player.coins;
      g.subscribe(() => { const c = g.state().player.coins; if (c !== coins) s.play('coin'); coins = c; });
      // an action the game refuses (too few coins, a closed shop...): the refused command's sound (lot S2, journal Passe SN18), 6 dB over the duel's so that the
      // town's music no longer covers it (S5-REFUS « Le refus 6 dB plus fort hors du duel », journal Passe SN22)
      const act = g.act.bind(g);
      g.act = (a) => { const r = act(a); if (r && r.ok === false) s.play('denied', dbGain(REFUSAL_LIFT)); return r; };
    }
    const p = hero(w); if (!p) return;
    if (at) {
      const d = Math.hypot(p.x - at.x, p.z - at.z);
      if (d < 2) { walked += d; if (walked >= STEP_EVERY) { walked -= STEP_EVERY; s.play('step'); } }  // a longer move is a pose, not a walk
    }
    at = { x: p.x, z: p.z };
  }, 50);
}
