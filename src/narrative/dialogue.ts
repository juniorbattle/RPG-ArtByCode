import type { GameState } from '../simulation/state';
import type { Emit } from '../simulation/advance';
import { RIVALS } from './roster';
import { tx } from './text';

/** What the town's people say (journal Passe L4; GAMEPLAY § 8: the city reacts to the tournament, the player's fame, the sabotage, the
 *  hour, readable without a debug screen). Lines are chosen from the state: the slot, the pulse, the facts learnt, the quests, the results.
 *  `onTalk` is what talking itself changes (a quest offered, a person met). English (choice K1). Pure. */

const won = (s: GameState, day: number) => s.tournament.matches.some((m) => m.day === day && m.winner === 'player');
const fought = (s: GameState, day: number) => s.tournament.matches.some((m) => m.day === day && m.winner && (m.a === 'player' || m.b === 'player'));
const rival = (s: GameState, id: string) => s.competitors[id]?.relationships.player ?? 0;

export function onTalk(s: GameState, who: string, emit: Emit): void {
  if (who === 'tam' && !s.quests.cargo) {
    s.quests.cargo = 'asked';
    emit({ kind: 'action', id: 'quest:cargo', cause: 'action:talk', visible: true, text: tx('quest.cargo.offer') });
  }
  if (who === 'tam' && !s.facts.includes('met-orla-name')) s.facts.push('met-orla-name');
  if (who === 'orla' && !s.facts.includes('orla-introduced')) {
    s.facts.push('orla-introduced');
    emit({ kind: 'action', id: 'recruit:orla', cause: 'action:talk', visible: true, text: tx('recruit.orla.intro') });
  }
}

export function linesOf(s: GameState, who: string): string[] {
  const P = s.pulse, night = s.slot === 'evening', name = s.player.name;
  switch (who) {
    case 'mara': {
      const out: string[] = [];
      if (night) out.push(tx('line.mara.shut'));
      else out.push(s.services.shopFactor > 1 ? tx('line.mara.shortage', { cause: s.services.shopCause }) : tx('line.mara.wares'));
      if (s.facts.includes('lamp-oil')) out.push(tx('line.mara.lampOil'));
      else if (P.commerce >= 60) out.push(tx('line.mara.trade'));
      if (s.flags['discount:mara']) out.push(tx('line.mara.discount'));
      return out;
    }
    case 'bram':
      if (s.services.forge === 'repaired') return [tx('line.bram.repaired')];
      if (s.quests.cargo === 'delivered') return [tx('line.bram.delivered')];
      if (s.quests.cargo === 'done') return [tx('line.bram.done')];
      return [tx('line.bram.waiting')];
    case 'hale': {
      const out = [P.security >= 60 ? tx('line.hale.quiet') : tx('line.hale.thin')];
      if (s.quests.cargo === 'asked') out.push(tx('line.hale.cargo'));
      if (s.facts.includes('forge-burned') && !s.flags.reported) out.push(tx('line.hale.forge'));
      if (night) out.push(tx('line.hale.night'));
      return out;
    }
    case 'wynn':
      if (s.facts.includes('loiterer') && s.services.forge === 'open') return [tx('line.wynn.loiterer')];
      if (s.facts.includes('saboteur-caught')) return [tx('line.wynn.caught', { name })];
      return [night ? tx('line.wynn.night') : tx('line.wynn.day')];
    case 'stranger':
      if (!night) return [tx('line.stranger.day')];
      return [s.services.forge === 'sabotaged' ? tx('line.stranger.fire') : tx('line.stranger.whisper')];
    case 'tam':
      if (s.quests.cargo === 'asked') return [tx('line.tam.asked')];
      if (s.quests.cargo === 'papers') return [tx('line.tam.papers')];
      if (s.quests.cargo === 'delivered' || s.quests.cargo === 'done') return [tx('line.tam.done')];
      return [tx('line.tam.offer')];
    case 'folk': {
      const out: string[] = [];
      if (fought(s, s.day) || fought(s, s.day - 1)) out.push(won(s, s.day) || won(s, s.day - 1) ? tx('line.folk.won', { name }) : tx('line.folk.lost', { name }));
      if (P.excitement >= 70) out.push(tx('line.folk.roar'));
      else out.push(tx('line.folk.heralds'));
      if (s.facts.includes('forge-burned')) out.push(tx('line.folk.forge'));
      if (s.facts.includes('dree-temple-feud')) out.push(tx('line.folk.feud'));
      if (P.sabotageRisk >= 50 && !s.facts.includes('forge-burned')) out.push(tx('line.folk.danger'));
      return out;
    }
    case 'odo':
      return [s.flags.registered ? tx('line.odo.signed') : tx('line.odo.sign')];
    case 'anwen':
      return [s.player.injury ? tx('line.anwen.hurt') : tx('line.anwen.well'), ...(s.flags['free-care'] ? [tx('line.anwen.free')] : [])];
    case 'orla':
      if (s.facts.includes('orla-recruitable')) return [tx('line.orla.recruit')];
      return [rival(s, 'orla') >= 15 ? tx('line.orla.friend') : tx('line.orla.meet')];
    case 'vessa':
      if (won(s, 2)) return [tx('line.vessa.lost')];
      if (fought(s, 2)) return [tx('line.vessa.won')];
      return [tx('line.vessa.before', { name })];
    case 'marek':
      if (won(s, 3)) return [tx('line.marek.lost')];
      if (fought(s, 3)) return [tx('line.marek.won')];
      return [rival(s, 'marek') > 0 ? tx('line.marek.watched') : tx('line.marek.before')];
    case 'cassius':
      return [s.flags['culprit-known'] ? tx('line.cassius.prove') : rival(s, 'cassius') <= -25 ? tx('line.cassius.hostile', { name }) : tx('line.cassius.salute')];
    // the version 2 (journal Passe V2): the weapon master
    case 'corvin':
      return [night ? tx('line.corvin.night') : s.player.coins >= 45 && !(s.v2?.kit.levels.t3) ? tx('line.corvin.rich') : tx('line.corvin.pitch')];
    case 'hilde':
      return [s.services.shopFactor > 1 ? tx('line.hilde.shortage') : tx('line.hilde.pitch')];
    case 'ilse':
      return [s.v2?.challenged?.ilse ? tx('line.ilse.after') : tx('line.ilse.pitch')];
    case 'pip':
      return [tx('line.pip.pitch')];
    // the version 2's districts (lot V5): the drill master, the bard
    case 'drill':
      return [s.slot === 'morning' ? tx('line.drill.bout') : tx('line.drill.day')];
    case 'bard':
      return [s.player.reputation >= 40 ? tx('line.bard.famous', { name }) : night ? tx('line.bard.night') : tx('line.bard.day')];
    case 'lio':
      return [tx('line.lio.talk', { rhosk: RIVALS.rhosk.name, ilse: RIVALS.ilse.name, cassius: RIVALS.cassius.name })];
    default:
      return [];
  }
}
