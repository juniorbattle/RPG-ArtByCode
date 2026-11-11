import type { Actor } from '../characters/SpriteRenderer';

/** The district's « … » bubbles in « Explore the district » and behind the title screen (the operator's MK-1 « La retirer du jeu par défaut ; Explore garde la
 *  courte réaction à [E], corrigée ; v2=0 inchangé », journal Passe MK2). The district's actors give the stall keeper and the barrier guard a bubble for good,
 *  and whoever is talked to with E a bubble (and the talking pose) that nothing takes back. Here, from the page (src/characters is left as it is): no bubble
 *  at the start; E's bubble shows while the actors' talk timer runs, then goes, with the pose of anyone who did not talk before. Every other address of the
 *  free district (the tools' night, any parameter) keeps them as they are. */

export interface TalkingActors { actors: Actor[]; talkTimer: number }

/** removes the bubbles now and returns what the page calls each frame */
export function quietBubbles(sys: TalkingActors): () => void {
  const posed = new Map<Actor, boolean>();
  for (const a of sys.actors) { a.bubble = null; posed.set(a, a.anim === 'talk'); }
  return () => {
    if (sys.talkTimer > 0) return;
    for (const a of sys.actors) {
      if (a.bubble !== 'dots') continue;
      a.bubble = null;
      if (a.anim === 'talk' && !posed.get(a)) a.anim = 'idle';
    }
  };
}
