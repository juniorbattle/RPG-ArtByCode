import type { GameState } from '../simulation/state';
import type { Emit } from '../simulation/advance';
import { RIVALS } from './roster';

/** What the town's people say (journal Passe L4; GAMEPLAY § 8: the city reacts to the tournament, the player's fame, the sabotage, the
 *  hour, readable without a debug screen). Lines are chosen from the state: the slot, the pulse, the facts learnt, the quests, the results.
 *  `onTalk` is what talking itself changes (a quest offered, a person met). English (choice K1). Pure. */

const won = (s: GameState, day: number) => s.tournament.matches.some((m) => m.day === day && m.winner === 'player');
const fought = (s: GameState, day: number) => s.tournament.matches.some((m) => m.day === day && m.winner && (m.a === 'player' || m.b === 'player'));
const rival = (s: GameState, id: string) => s.competitors[id]?.relationships.player ?? 0;

export function onTalk(s: GameState, who: string, emit: Emit): void {
  if (who === 'tam' && !s.quests.cargo) {
    s.quests.cargo = 'asked';
    emit({ kind: 'action', id: 'quest:cargo', cause: 'action:talk', visible: true, text: 'Quest — The Steel Cargo: Tam\'s crate of Wyrmsteel for Bram is held by the watch. Get Sergeant Hale\'s release, then haul it to the forge: Bram could temper your blade with it.' });
  }
  if (who === 'tam' && !s.facts.includes('met-orla-name')) s.facts.push('met-orla-name');
  if (who === 'orla' && !s.facts.includes('orla-introduced')) {
    s.facts.push('orla-introduced');
    emit({ kind: 'action', id: 'recruit:orla', cause: 'action:talk', visible: true, text: 'Orla Brask, Tam\'s cousin, fights for the docks\' pride. She is looking for comrades for the team bouts to come.' });
  }
}

export function linesOf(s: GameState, who: string): string[] {
  const P = s.pulse, night = s.slot === 'evening', name = s.player.name;
  switch (who) {
    case 'mara': {
      const out: string[] = [];
      if (night) out.push('« My stall is shut, love. Come back with the sun. »');
      else out.push(s.services.shopFactor > 1 ? `« Blades cost four tenths more since the forge burned: ${s.services.shopCause}. I don't like it either. »` : '« Whetstones, salves, a good imported blade. Everything a fighter needs, and no questions. »');
      if (s.facts.includes('lamp-oil')) out.push('« A man in a hood bought all my lamp oil and a pot of pitch. He asked when the smith sleeps. I didn\'t like his eyes. »');
      else if (P.commerce >= 60) out.push('« The tournament crowds are good for trade. The ribbons sold out by noon. »');
      if (s.flags['discount:mara']) out.push('« For you, a tenth off. You carried my crates. »');
      return out;
    }
    case 'bram':
      if (s.services.forge === 'repaired') return ['« New bellows, and Orla\'s back to thank for half of it. The fire\'s good again. »'];
      if (s.quests.cargo === 'delivered') return ['« The Wyrmsteel came! Give me a slot and ten coins and your blade will sing. »'];
      if (s.quests.cargo === 'done') return ['« Mind that edge. It\'ll cut through Marek\'s guard if anything does. »'];
      return ['« My Wyrmsteel is stuck at the watch-house. Tam was to fetch it. Without it I can only sharpen what you have. »'];
    case 'hale': {
      const out = [P.security >= 60 ? '« The quay is quiet. My men are on every corner. »' : '« We\'re stretched thin, with the crowds. If something happens tonight, I\'ll hear of it too late. »'];
      if (s.quests.cargo === 'asked') out.push('« Tam\'s crate? Wyrmsteel for Bram. I can sign the release. »');
      if (s.facts.includes('forge-burned') && !s.flags.reported) out.push('« The forge... If you learn who paid for that, bring me a name. »');
      if (night) out.push('« Fifteen coins and two of my men stand by Bram\'s forge till dawn. »');
      return out;
    }
    case 'wynn':
      if (s.facts.includes('loiterer') && s.services.forge === 'open') return ['« There\'s a hooded one who paces round the forge at dusk. I\'d not leave it alone tonight. »'];
      if (s.facts.includes('saboteur-caught')) return [`« We caught him with the pitch pot in his hands! Thanks to you, ${name}. »`];
      return [night ? '« Long night. The tournament makes the quay jumpy. »' : '« Move along, fighter. Or don\'t: it\'s a free quay. »'];
    case 'stranger':
      if (!night) return ['The hooded figure turns away: « Not in daylight. »'];
      return [s.services.forge === 'sabotaged' ? '« Ten coins, and I tell you who paid for the fire. »' : '« Ten coins buy a whisper. Whispers keep fighters alive. »'];
    case 'tam':
      if (s.quests.cargo === 'asked') return ['« Hale has the crate under seal. Get his release, and we haul it together. »'];
      if (s.quests.cargo === 'papers') return ['« You got the papers! Let\'s roll it to Bram before someone else gets ideas. »'];
      if (s.quests.cargo === 'delivered' || s.quests.cargo === 'done') return ['« My cousin Orla says you hauled like a docker. From her, that\'s love. »'];
      return ['« You\'re in the pool? My cousin Orla too. Say, you look strong: I\'ve a crate of Wyrmsteel for Bram stuck at the watch-house... »'];
    case 'folk': {
      const out: string[] = [];
      if (fought(s, s.day) || fought(s, s.day - 1)) out.push(won(s, s.day) || won(s, s.day - 1) ? `« That's ${name}! I saw you on the sand! »` : `« Hard luck in the arena, ${name}. The pool isn't over. »`);
      if (P.excitement >= 70) out.push('« The whole Cité is at the Colosseum. Listen to them roar! »');
      else out.push('« The heralds say the pool of eight is the strongest in years. »');
      if (s.facts.includes('forge-burned')) out.push('« Did you hear? Bram\'s forge burned in the night. Some say it was no accident. »');
      if (s.facts.includes('dree-temple-feud')) out.push('« House Dree\'s men and the Temple\'s wardens nearly came to blows by the bridge. »');
      if (P.sabotageRisk >= 50 && !s.facts.includes('forge-burned')) out.push('« People say someone powerful wants a fighter of the pool to fall. »');
      return out;
    }
    case 'odo':
      return [s.flags.registered ? '« You are on the roll. Bouts at the afternoon bell, days two and three. A defeat costs points, not your place. »' : '« A fighter for the pool? Sign here. Eight names, two rounds before the first cut. »'];
    case 'anwen':
      return [s.player.injury ? '« Sit. That wound will cost you in the arena if you leave it. »' : '« Whole and well. Keep it that way. »', ...(s.flags['free-care'] ? ['« Ilse Morrow gave her purse to the Temple: no fighter pays today. »'] : [])];
    case 'orla':
      if (s.facts.includes('orla-recruitable')) return ['« When the pool turns to teams, I\'ll stand with you. The docks remember friends. »'];
      return [rival(s, 'orla') >= 15 ? '« Tam told me about the crate. You\'re alright. Want to spar? »' : '« Another fighter. Can you take a hit? Let\'s find out on the practice sand. »'];
    case 'vessa':
      if (won(s, 2)) return ['« A lucky cut. Next year, I\'ll have you. »'];
      if (fought(s, 2)) return ['« Don\'t take it hard. Three cuts before you see the first: nobody sees them. »'];
      return [`« So you're my first bout, ${name}? Try to keep up. »`];
    case 'marek':
      if (won(s, 3)) return ['« ... Well struck. The title is not mine yet, nor yours. We will meet again. »'];
      if (fought(s, 3)) return ['« You lasted. Rest, and come back stronger. »'];
      return [rival(s, 'marek') > 0 ? '« I watched your first bout. You are patient. Good. »' : '« I wait. When you tire, I end it. That is all there is to me. »'];
    case 'cassius':
      return [s.flags['culprit-known'] ? '« Prove it. ... You can\'t? Then smile, peasant, and drink. »' : rival(s, 'cassius') <= -25 ? `« ${name}. The crowd's new pet. Enjoy it while it lasts. »` : '« Ah, one of the pool\'s fillers. House Dree salutes you. »'];
    case 'lio':
      return [`« Ale, a bench, and the tavern's talk: ${RIVALS.rhosk.name} drinks with no one, ${RIVALS.ilse.name} gives her winnings to the Temple, and ${RIVALS.cassius.name} pays everyone's tab. »`];
    default:
      return [];
  }
}
