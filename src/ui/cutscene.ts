import type { GameState } from '../simulation';
import { speakerName, type Cutscene } from '../narrative/v2story';
import { tx } from '../narrative/text';
import { el, esc } from './style';
import { portraitUrl } from './portraits';

/** A live cutscene on a square of the version 2 (lot V6, journal Passe V6): the page's scene keeps running, the camera goes where the script
 *  looks, the people walk, and each line waits at the bottom of the screen in the design system's parchment (the speaker's face and name)
 *  until E, Space, Enter or a click; Esc skips the rest. The black bands top and bottom say a scene is playing. */

export interface SceneStage {
  /** the camera's focus (x, z on the square) and distance, eased over `secs`; null gives it back to the hero */
  look(at: [number, number] | null, dist?: number, secs?: number): Promise<void>;
  /** a person walks to a point (resolved on arrival) */
  walk(who: string, to: [number, number]): Promise<void>;
  /** the hero's walking keys held off while a scene plays */
  lock(on: boolean): void;
}

const CSS = `.pm-bands::before,.pm-bands::after{content:'';position:fixed;left:0;right:0;height:9vh;background:#000;z-index:38;pointer-events:none}
.pm-bands::before{top:0}.pm-bands::after{bottom:0}
body.pm-bands .pm:not(.pm-scene){visibility:hidden}
.pm-scene{position:fixed;left:50%;bottom:calc(9vh + 12px);transform:translateX(-50%);width:min(760px,calc(100% - 32px));z-index:41;padding:8px 12px}
.pm-scene .pm-parch q{display:block;quotes:none}
.pm-scene .pm-row{display:flex;justify-content:flex-end;gap:8px}`;

export async function playCutscene(s: GameState, c: Cutscene, stage: SceneStage): Promise<void> {
  if (!document.getElementById('pm-scene-css')) { const st = el('style'); st.id = 'pm-scene-css'; st.textContent = CSS; document.head.appendChild(st); }
  document.body.classList.add('pm-bands');
  stage.lock(true);
  let skipped = false;
  const card = el('div', 'pm pm-card pm-scene');
  card.setAttribute('role', 'dialog');
  document.body.appendChild(card);
  const say = (who: string, line: string) => new Promise<void>((done) => {
    const url = who === 'player' ? null : portraitUrl(who);
    card.innerHTML = `<div class="pm-dlg">${url ? `<span class="port"><img src="${url}" alt=""></span>` : ''}<div class="who"><h2 class="pm-h">${esc(speakerName(s, who))}</h2></div></div><div class="pm-parch"><q>${esc(line)}</q></div>`;
    const row = el('div', 'pm-row'), skip = el('button', 'pm-btn', `<kbd>Esc</kbd>${tx('v2.scene.skip')}`), next = el('button', 'pm-btn primary', `<kbd>E</kbd>${tx('v2.scene.next')}`);
    row.append(skip, next); card.appendChild(row);
    const end = (sk: boolean) => { window.removeEventListener('keydown', key, true); if (sk) skipped = true; done(); };
    const key = (e: KeyboardEvent) => { const k = e.key.toLowerCase(); if (k === 'escape') { e.preventDefault(); e.stopPropagation(); end(true); } else if (k === 'e' || k === ' ' || k === 'enter') { e.preventDefault(); e.stopPropagation(); end(false); } };
    window.addEventListener('keydown', key, true);
    next.onclick = () => end(false); skip.onclick = () => end(true);
    next.focus();
  });
  try {
    for (const step of c.steps) {
      if (skipped) break;
      if ('cam' in step) await stage.look(step.cam, step.dist, step.secs);
      else if ('walk' in step) await stage.walk(step.walk, step.to);
      else await say(step.say, step.line());
    }
  } finally {
    card.remove();
    document.body.classList.remove('pm-bands');
    await stage.look(null, undefined, 1);
    stage.lock(false);
  }
}
