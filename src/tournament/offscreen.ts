import type { Rng } from '../core/rng';
import { clamp, type CompetitorState, type GameState } from '../simulation/state';
import type { Emit } from '../simulation/advance';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { tx } from '../narrative/text';

/** What the rivals do while the player spends a slot (TOURNAMENT_MASTER_CONTRACT § 6, GAMEPLAY § 14 verrou 7: the competitors move without
 *  waiting for the player; journal Passe L2). Each rival picks one activity per slot, weighted by its state, objectives and the hour, from
 *  its own stream; every pick is logged (hidden from the player's journal, read by the town's rumours and the TournamentLab), so no
 *  competitor is ever forgotten. Pure. */

export type Activity = 'train' | 'rest' | 'buy' | 'spy' | 'socialise' | 'plot';

export function activityWeights(s: GameState, c: CompetitorState): Record<Activity, number> {
  const night = s.slot === 'evening', hostile = (c.relationships[PLAYER_ID] ?? 0) <= -25;
  return {
    train: c.preparation < 90 ? (night ? 0.6 : 3) : 0.2,
    rest: c.healthState !== 'fit' ? 4 : night ? 1.5 : 0.4,
    buy: c.wealth >= 20 ? (night ? 0.4 : 1.4) : 0,
    spy: c.objectives.some((o) => o.startsWith('beat') || o.startsWith('undermine') || o.startsWith('defend')) ? 0.8 : 0.2,
    socialise: night ? 2 : 0.6,
    plot: c.objectives.includes('undermine-the-favourite') && hostile ? (night ? 3 : 1) : 0,
  };
}

export function rivalsAct(s: GameState, emit: Emit, rng: Rng): void {
  const ids = Object.keys(s.competitors).sort();
  for (const id of ids) {
    const c = s.competitors[id], r = rng.fork(`offscreen:${id}`), w = activityWeights(s, c);
    const acts = Object.keys(w) as Activity[];
    const a = r.weighted(acts, acts.map((k) => w[k]));
    const name = RIVALS[id].name;
    let text = '';
    switch (a) {
      case 'train': c.preparation = clamp(c.preparation + 6 + r.int(0, 4)); text = tx('off.train', { name }); break;
      case 'rest':
        if (c.healthState === 'injured') c.healthState = 'hurt'; else if (c.healthState === 'hurt') c.healthState = 'fit';
        text = tx(c.healthState === 'fit' ? 'off.restFit' : 'off.rest', { name }); break;
      case 'buy': c.wealth -= 15; c.preparation = clamp(c.preparation + 5); text = tx('off.buy', { name }); break;
      case 'spy': {
        const f = s.player.training > 0 ? 'player-trains' : s.player.items.length ? 'player-gear' : 'player-arrived';
        if (!c.knownFacts.includes(f)) c.knownFacts.push(f);
        text = tx('off.spy', { name }); break;
      }
      case 'socialise': {
        const others = ids.filter((o) => o !== id), o = r.pick(others), d = r.int(-6, 8);
        c.relationships[o] = clamp((c.relationships[o] ?? 0) + d, -100, 100);
        text = tx(d < 0 ? 'off.socialiseWords' : 'off.socialise', { name, other: RIVALS[o].name }); break;
      }
      case 'plot': s.flags['plot:forge'] = ((s.flags['plot:forge'] as number) ?? 0) + 1; text = tx('off.plot', { name }); break;
    }
    emit({ kind: 'offscreen', id: `${id}:${a}`, cause: `offscreen:${id}`, text, visible: false });
  }
}
