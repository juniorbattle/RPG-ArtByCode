import type { GameState } from '../simulation/state';
import type { Emit } from '../simulation/advance';
import { RIVALS } from './roster';
import { tx, type TextKey } from './text';
import { v2Lines } from './v2story';
import { isV2 } from '../simulation/v2';
import { skillPrice } from '../simulation/v2skills';
import { PEOPLE } from './people';
import { anwenBusy, sandShut, sandTaken, stanceWords, taleOf } from '../simulation/v2rivals';
import { watchPost } from '../simulation/v2watch';
import { marksOf, LAW } from '../simulation/v2law';
import { fameTier, type FameTier } from '../simulation/v2react';
import { festivalWords } from '../simulation/v2festival';

/** what the passers-by make of the player in a version 2 game (lot L5): a name in Sergeant Hale's ledger first, then the fame (src/simulation/v2react.ts) */
const FOLK: Record<FameTier, TextKey> = { unknown: 'v2.line.folk.unknown', noticed: 'v2.line.folk.noticed', known: 'v2.line.folk.known', celebrated: 'v2.line.folk.celebrated' };
function folkLine(s: GameState): string {
  const m = marksOf(s);
  return m >= LAW.wanted ? tx('v2.line.folk.wanted') : m > 0 ? tx('v2.line.folk.wary') : tx(FOLK[fameTier(s)], { name: s.player.name });
}

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
  // a version 2 game (lot L3, the operator's EV-10, « l'enquête mène à l'auteur »): a strap cut and fought on, its culprit unknown, Lady Edda knows the cut, the
  // same as her son's in his qualifier (src/narrative/generics.ts: Ser Aldric), and the colours of the servant who asked about both
  if (who === 'edda' && isV2(s) && s.facts.includes('tamper-suffered') && !s.flags['culprit-known']) {
    s.flags['culprit-known'] = 'cassius';
    if (!s.facts.includes('edda-witness')) s.facts.push('edda-witness');
    emit({ kind: 'consequence', id: 'edda:witness', cause: tx('v2.edda.why'), visible: true, text: tx('v2.edda.witness') });
  }
  // lot L4 (the operator's EV-9 « Chaque rival se souvient ; deux autres agissent »): Brother Ambrose, who lights the festival square's lamps at dusk, saw Vessa Lark
  // pay every round at Lio's to tell her tale (src/simulation/v2rivals.ts): now the player knows whom to answer
  if (who === 'ambrose' && isV2(s) && s.v2?.lie && !s.flags['confronted:vessa'] && !s.facts.includes('vessa-lie-known')) {
    s.facts.push('vessa-lie-known');
    emit({ kind: 'consequence', id: 'ambrose:witness', cause: tx('v2.lie.why'), visible: true, text: tx('v2.lie.ambroseLog', { name: RIVALS[s.v2.lie.who]?.name ?? s.v2.lie.who }) });
  }
}

export function linesOf(s: GameState, who: string): string[] {
  const out = baseLines(s, who);
  if (!isV2(s)) return out;
  // the festival's day (lot L6, FE-2 / FE-4): whom the person's lantern walks behind tonight and why, what would change it; Wren tells the custom, a rival counts
  // their cortege (src/simulation/v2festival.ts)
  const fw = festivalWords(s, who);
  if (fw) out.push(fw);
  // a version 2 game (lot L4, EV-9 « Chaque rival se souvient »): what a rival whose arc says nothing of it remembers of you (src/simulation/v2rivals.ts)
  const st = stanceWords(s, who);
  return st ? [...out, st] : out;
}

/** what a keeper remembers of the player (lot L4, EV-7 « le marchand qui se souvient »): a regular (their goodwill 15 or more: a tenth off, src/simulation/v2gear.ts
 *  shopPrice) or a face they will watch (−15 or less: robbed, a bargain soured) */
const KEEPER_MEMORY: Record<string, [TextKey, TextKey]> = { mara: ['v2.line.mara.regular', 'v2.line.mara.sore'], hilde: ['v2.line.hilde.regular', 'v2.line.hilde.sore'], pip: ['v2.line.pip.regular', 'v2.line.pip.sore'], corvin: ['v2.line.corvin.regular', 'v2.line.corvin.sore'] };
function keeperMemory(s: GameState, who: string): string[] {
  const k = KEEPER_MEMORY[who], g = s.town[who] ?? 0;
  return !k || !isV2(s) ? [] : g >= 15 ? [tx(k[0])] : g <= -15 ? [tx(k[1])] : [];
}

/** a version 2 game's ambiences out of the news (lot L4, the operator's EV-8 « Hors des nouvelles, dans les répliques et le son »): one text a day, by the state */
const MARKET: readonly TextKey[] = ['v2.line.pip.market1', 'v2.line.pip.market2', 'v2.line.pip.market3'];
const PUPPETS: Record<'won' | 'lost', readonly TextKey[]> = { won: ['v2.line.bard.puppetsWon1', 'v2.line.bard.puppetsWon2'], lost: ['v2.line.bard.puppetsLost1', 'v2.line.bard.puppetsLost2'] };
/** the player's last bout fought today or yesterday: whom against, and whether it was won */
function lastBout(s: GameState): { foe: string; won: boolean } | null {
  const m = [...s.tournament.matches].reverse().find((x) => x.winner && (x.a === 'player' || x.b === 'player') && x.day >= s.day - 1 && x.day <= s.day);
  return m ? { foe: RIVALS[m.a === 'player' ? m.b : m.a]?.name ?? '', won: m.winner === 'player' } : null;
}

function baseLines(s: GameState, who: string): string[] {
  // a version 2 game (lot L4): Vessa, once told to her face what she paid Lio's room to say; Rhosk on the sand he took, or warned off it
  if (isV2(s) && who === 'vessa' && s.flags['confronted:vessa']) return [tx('v2.line.vessa.confronted')];
  if (isV2(s) && who === 'rhosk' && sandTaken(s)) return [tx('v2.line.rhosk.sand')];
  if (isV2(s) && who === 'rhosk' && s.flags['reported:rhosk']) return [tx('v2.line.rhosk.warned')];
  // the version 2's rivals speak by the act and what happened between you (lot V6)
  const arc = v2Lines(s, who);
  if (arc) return arc;
  const P = s.pulse, night = s.slot === 'evening', name = s.player.name;
  switch (who) {
    case 'mara': {
      const out: string[] = [];
      if (night) out.push(tx('line.mara.shut'));
      else out.push(s.services.shopFactor > 1 ? tx('line.mara.shortage', { cause: s.services.shopCause }) : tx('line.mara.wares'));
      if (s.facts.includes('lamp-oil')) out.push(tx('line.mara.lampOil'));
      else if (P.commerce >= 60) out.push(tx('line.mara.trade'));
      if (s.flags['discount:mara']) out.push(tx('line.mara.discount'));
      return [...out, ...keeperMemory(s, 'mara')];
    }
    case 'bram':
      if (s.services.forge === 'repaired') return [tx('line.bram.repaired')];
      if (s.quests.cargo === 'delivered') return [tx('line.bram.delivered')];
      if (s.quests.cargo === 'done') return [tx('line.bram.done')];
      return [tx('line.bram.waiting')];
    case 'hale': {
      // (a version 2 game, lot L5: by day the sergeant says « after dark », the night's word « tonight » was said in the morning, journal Passe EVL7)
      const out = [P.security >= 60 ? tx('line.hale.quiet') : isV2(s) && !night ? tx('v2.line.hale.thinDay') : tx('line.hale.thin')];
      // lot L5 (EV-12): where his man stands today
      const post = watchPost(s);
      if (post) out.push(tx('v2.line.hale.posted', { name: PEOPLE[post.keeper]?.name ?? post.keeper }));
      if (s.quests.cargo === 'asked') out.push(tx('line.hale.cargo'));
      if (s.facts.includes('forge-burned') && !s.flags.reported) out.push(tx('line.hale.forge'));
      if (night) out.push(tx('line.hale.night'));
      // a version 2 game (lot L2a, EV-2): the sergeant says what his ledger holds and how a name leaves it
      if (isV2(s) && (s.v2?.marks ?? 0) > 0) out.push(tx(s.v2!.marks === 1 ? 'v2.line.hale.ledger1' : 'v2.line.hale.ledger', { n: s.v2!.marks! }));
      // lot L4 (EV-9): Rhosk's plan to take the training sand, which a word from Hale to the registrar answers; his name in the ledger after
      if (isV2(s) && s.facts.includes('rhosk-offer') && !s.flags['sand-cleared']) out.push(tx('v2.line.hale.rhosk'));
      else if (isV2(s) && s.flags['reported:rhosk']) out.push(tx('v2.line.hale.rhoskLedger'));
      return out;
    }
    case 'wynn': {
      // lot L5 (EV-12 « un garde se poste à l’étal le jour d’un vol »): at the stall he watches
      const post = watchPost(s);
      if (post) return [tx('v2.line.wynn.posted', { name: PEOPLE[post.keeper]?.name ?? post.keeper })];
      if (s.facts.includes('loiterer') && s.services.forge === 'open') return [tx('line.wynn.loiterer')];
      if (s.facts.includes('saboteur-caught')) return [tx('line.wynn.caught', { name })];
      return [night ? tx('line.wynn.night') : tx('line.wynn.day')];
    }
    case 'stranger':
      if (!night) return [tx('line.stranger.day')];
      return [s.services.forge === 'sabotaged' ? tx('line.stranger.fire') : tx('line.stranger.whisper')];
    case 'tam':
      if (s.quests.cargo === 'asked') return [tx('line.tam.asked')];
      if (s.quests.cargo === 'papers') return [tx('line.tam.papers')];
      if (s.quests.cargo === 'delivered' || s.quests.cargo === 'done') return [tx('line.tam.done')];
      return [tx('line.tam.offer')];
    case 'folk': {
      const out: string[] = [], v2 = isV2(s);
      // lot L5 (EV-12 « la célébrité change ce que disent les passants »): what the town makes of you first, Sergeant Hale's ledger before the fame
      if (v2) out.push(folkLine(s));
      if (fought(s, s.day) || fought(s, s.day - 1)) out.push(won(s, s.day) || won(s, s.day - 1) ? tx('line.folk.won', { name }) : v2 && s.day >= 6 ? tx('v2.line.folk.lost', { name }) : tx('line.folk.lost', { name }));
      // the version 2's ten days (journal Passe VP1): the roar on a day of bouts only, the bracket and the final talked of after the pool
      if (v2) out.push(P.excitement >= 70 && s.tournament.matches.some((m) => m.day === s.day) ? tx('line.folk.roar') : s.day >= 9 ? tx('v2.line.folk.final') : s.day >= 6 ? tx('v2.line.folk.bracket') : tx('line.folk.heralds'));
      else if (P.excitement >= 70) out.push(tx('line.folk.roar'));
      else out.push(tx('line.folk.heralds'));
      if (s.facts.includes('forge-burned')) out.push(tx('line.folk.forge'));
      if (s.facts.includes('dree-temple-feud')) out.push(tx('line.folk.feud'));
      if (P.sabotageRisk >= 50 && !s.facts.includes('forge-burned')) out.push(tx('line.folk.danger'));
      return out;
    }
    case 'odo':
      if (isV2(s)) return [s.day >= 6 ? tx('v2.line.odo.bracket') : s.flags.registered ? tx('v2.line.odo.signed') : tx('v2.line.odo.sign')];
      return [s.flags.registered ? tx('line.odo.signed') : tx('line.odo.sign')];
    case 'anwen':
      // a version 2 game (lot L4, EV-7 « un par lieu »): the evening a rival was hurt in the bouts, her infirmary is full until morning
      if (anwenBusy(s)) return [tx('v2.line.anwen.busy')];
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
      // « rich »: the player can pay for the Whirlwind he teaches, at its price today (journal Passe VP1)
      return [night ? tx('line.corvin.night') : s.player.coins >= skillPrice(s, 't3') && !(s.v2?.kit.levels.t3) ? tx('line.corvin.rich') : tx('line.corvin.pitch'), ...keeperMemory(s, 'corvin')];
    case 'hilde':
      return [s.services.shopFactor > 1 ? tx('line.hilde.shortage') : tx('line.hilde.pitch'), ...keeperMemory(s, 'hilde')];
    case 'ilse':
      return [s.v2?.challenged?.ilse ? tx('line.ilse.after') : tx('line.ilse.pitch')];
    case 'pip':
      // the night market at dusk, out of a version 2 game's news (lot L4, EV-8): Pip's stall is in it, one text a day
      return [isV2(s) && night ? tx(MARKET[s.day % MARKET.length]) : tx('line.pip.pitch'), ...keeperMemory(s, 'pip')];
    // the version 2's districts (lot V5): the drill master, the bard
    case 'drill':
      // the morning after a brawl at the barracks (src/events/v2catalog.ts)
      // lot L4: Rhosk on the sand (EV-9); the sand shut until noon the morning after the brawl (EV-7 « un par lieu ») (src/simulation/v2rivals.ts)
      if (sandTaken(s)) return [tx('v2.line.drill.rhosk')];
      if (sandShut(s)) return [tx('v2.line.drill.brawlShut')];
      if (s.flags[`brawl:${s.day}`]) return [tx('v2.line.drill.brawl')];
      // the Colosseum's roar on an afternoon of bouts the player does not fight, out of the news (EV-8)
      if (isV2(s) && s.slot === 'afternoon' && s.tournament.matches.some((m) => m.day === s.day && m.a !== 'player' && m.b !== 'player')) return [tx('v2.line.drill.roar')];
      return [s.slot === 'morning' ? tx('line.drill.bout') : tx('line.drill.day')];
    case 'bard':
    {
      // the puppeteers replay the player's last bout on the square, out of a version 2 game's news (lot L4, EV-8): one text a day, won or lost
      const b = isV2(s) ? lastBout(s) : null;
      if (b) { const k = PUPPETS[b.won ? 'won' : 'lost']; return [tx(k[s.day % k.length], { name, foe: b.foe })]; }
      return [s.player.reputation >= 40 ? tx('line.bard.famous', { name }) : night ? tx('line.bard.night') : tx('line.bard.day')];
    }
    // the version 2's generic fighters (lot L2b); Tobin and Rhosk on the training ground after the cut, in the title's race or out of it
    case 'aldric': return [tx(s.v2?.gear?.armour === 'knight-hauberk' || s.v2?.gear?.bag.includes('knight-hauberk') ? 'v2.line.aldric.hauberk' : 'v2.line.aldric')];
    // lot L4 (L3-11 « Les garder pour L4 »): Corra was offered Rhosk's coin to stand on the sand with him; Brother Ambrose saw Vessa pay Lio's room
    case 'corra': return [s.v2?.reprisal ? tx('v2.line.corra.reprisal', { name: PEOPLE[s.v2.reprisal.by]?.name ?? s.v2.reprisal.by }) : s.facts.includes('rhosk-offer') && !s.flags['sand-cleared'] ? tx('v2.line.corra.rhosk') : tx('v2.line.corra')];
    case 'ambrose': { const tale = s.v2?.lie && !s.flags['confronted:vessa'] ? s.v2.lie.who : null; return [tale ? tx(taleOf(s) ? 'v2.line.ambrose.tale' : 'v2.line.ambrose.taleOld', { name: RIVALS[tale]?.name ?? tale }) : tx('v2.line.ambrose')]; }
    case 'lucan': return [tx('v2.line.lucan')];
    case 'piers': return [tx('v2.line.piers')];
    case 'kell': return [tx('v2.line.kell')];
    case 'tobin': case 'rhosk': return [tx(['gate', 'third'].includes(s.competitors[who]?.phaseStatus ?? '') ? (who === 'tobin' ? 'v2.line.tobin.out' : 'v2.line.rhosk.out') : who === 'tobin' ? 'v2.line.tobin.in' : 'v2.line.rhosk.in')];
    // the version 2's passers-by (lot L2a): their piece, or what is left once it has gone
    case 'fenwick': case 'edda': case 'sela': {
      const gone = s.v2?.passed?.[who] !== undefined;
      const out = [tx(who === 'fenwick' ? (gone ? 'v2.line.fenwick.gone' : 'v2.line.fenwick') : who === 'edda' ? (gone ? 'v2.line.edda.gone' : 'v2.line.edda') : gone ? 'v2.line.sela.gone' : 'v2.line.sela')];
      // Lady Edda and the straps (lot L3, EV-10): a sign once a servant asked Hilde about yours, while nothing came of it yet; the sanction, once Cassius is reported
      if (who === 'edda' && isV2(s)) {
        if (s.flags.reported && s.flags['culprit-known'] === 'cassius' && ['tamper-found', 'tamper-foiled', 'tamper-suffered'].some((f) => s.facts.includes(f))) out.push(tx('v2.line.edda.justice'));
        else if (s.facts.includes('armour-asked') && !['tamper-found', 'tamper-foiled', 'tamper-suffered'].some((f) => s.facts.includes(f))) out.push(tx('v2.line.edda.strap'));
      }
      return out;
    }
    case 'lio':
      return [tx('line.lio.talk', { rhosk: RIVALS.rhosk.name, ilse: RIVALS.ilse.name, cassius: RIVALS.cassius.name })];
    default:
      return [];
  }
}
