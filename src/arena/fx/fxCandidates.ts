import type { FxRecipe } from './fxRecipes';

/** CANDIDATES of lot 4 of the duel played by the computer (journal Passe LC6), shown to the operator on its sheet (briefs/fiche-combat-auto-lot4.html) and played by no
 *  duel until his decision: the DEV server's `window.__fx.candidate(id, who)` alone reaches them (src/arena/fx/combatFx.ts), for the sheet's captures. The form of
 *  the day (AC-08) has no effect of its own: at the start of the bout, a fighter in good form (its blows × 1.05 and more) would rise in motes of its colour round
 *  a small warm glow, one in poor form (× 0.95 and less) let grey motes fall to a little smoke; nothing between. Ren's gold, the opponent's forge-red (the duel's colours, the amber
 *  the one warm accent at night), under a second (FX4's exception) and nothing circular after the glow. Pure data, the recipes' format (src/arena/fx/fxRecipes.ts). */

const up = (id: string, element: 'gold' | 'fire'): FxRecipe => ({ id, element, duration: 0.9, steps: [
  { at: 0, kind: 'orbit', anchor: 'sourceGround', p: { count: 16, radius: 1.1, duration: 0.85, rise: 3.2, spin: 2.6, size: 0.1 } },
  { at: 0.1, kind: 'glow', anchor: 'sourceChest', p: { size: 0.9, duration: 0.4 } },
  { at: 0.1, kind: 'light', anchor: 'sourceChest', p: { intensity: 5, duration: 0.5 } },
] });
const down = (id: string): FxRecipe => ({ id, element: 'smoke', duration: 0.9, steps: [
  { at: 0, kind: 'motes', anchor: 'sourceGround', p: { count: 14, radius: 0.7, sink: true } },
  { at: 0.15, kind: 'smoke', anchor: 'sourceGround', p: { count: 10, spread: 0.6, size: 0.9, life: 1 } },
] });

export const FX_CANDIDATES: Record<string, FxRecipe> = {
  formUp: up('formUp', 'gold'),
  formUpFoe: up('formUpFoe', 'fire'),
  formDown: down('formDown'),
};
