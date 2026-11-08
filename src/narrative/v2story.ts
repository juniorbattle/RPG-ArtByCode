import { clamp, type GameState } from '../simulation/state';
import type { ActionDef } from '../simulation/actions';
import { isV2 } from '../simulation/v2';
import { PLAYER_ID, RIVALS } from './roster';
import { PEOPLE } from './people';
import { tx, type TextKey } from './text';
import { stageMatches, actOf, v2Ranking, type Stage } from '../tournament/v2calendar';
import { unmaskedHow, paradeOrder, FEST } from '../simulation/v2festival';

/** The version 2's story (lot V6, journal Passe V6; the operator's decision AV-15 « Structure, dialogues et cinématiques »): the ten days' three
 *  acts (src/tournament/v2calendar.ts: the pool and the cut, the semi-finals and the major match, the eve and the final), the rivals' arcs
 *  told by their words as the days pass, Orla's recruitment (the contract's day 7, « recrutement »; the team phase itself is a recorded gap),
 *  and the live cutscenes of the key moments: data played by the squares' pages (the camera scripted, the words, the sprites walking). Every
 *  text is « proposé », for the operator's reading. Pure. */

// ---------------------------------------------------------------------------------------------------------------- the rivals' arcs

const metIn = (s: GameState, a: string, stage?: string) => s.tournament.matches.find((m) => (m.a === PLAYER_ID && m.b === a || m.b === PLAYER_ID && m.a === a) && (!stage || m.stage === stage) && m.winner);
const beatBy = (s: GameState, a: string) => s.tournament.matches.some((m) => m.winner === PLAYER_ID && (m.a === a || m.b === a));
const lostTo = (s: GameState, a: string) => s.tournament.matches.some((m) => m.winner === a && (m.a === PLAYER_ID || m.b === PLAYER_ID));
const inFinal = (s: GameState, id: string) => stageMatches(s, 'final').some((m) => m.a === id || m.b === id);

/** a rival's words in a version 2 game, by the act and what happened between you (null: today's words) */
export function v2Lines(s: GameState, who: string): string[] | null {
  if (!isV2(s)) return null;
  const act = actOf(s.day), name = s.player.name;
  switch (who) {
    case 'marek':
      if (s.flags.champion === PLAYER_ID) return [tx('v2.line.marek.crowned', { name })];
      if (inFinal(s, PLAYER_ID) && inFinal(s, 'marek')) return [tx('v2.line.marek.final', { name })];
      if (act >= 2) return [beatBy(s, 'marek') ? tx('v2.line.marek.beaten') : tx('v2.line.marek.act2')];
      return null;
    case 'vessa':
      if (act >= 2 && beatBy(s, 'vessa')) return [tx('v2.line.vessa.grudge')];
      if (act >= 2) return [tx('v2.line.vessa.act2')];
      // beaten in the pool's first round: the tournament is long (journal Passe VP1; today's line says « next year »)
      if (beatBy(s, 'vessa')) return [tx('v2.line.vessa.lost')];
      return null;
    case 'cassius':
      if (metIn(s, 'cassius')) return [lostTo(s, 'cassius') ? tx('v2.line.cassius.won') : tx('v2.line.cassius.lost')];
      if (s.day >= 4) return [tx('v2.line.cassius.before')];
      return null;
    case 'orla':
      if (s.facts.includes('orla-recruited')) return [act === 3 ? tx('v2.line.orla.eve') : tx('v2.line.orla.ally')];
      if (s.facts.includes('orla-recruitable')) return [s.day >= RECRUIT_DAY ? tx('v2.line.orla.ask') : tx('v2.line.orla.soon')];
      if (metIn(s, 'orla')) return [beatBy(s, 'orla') ? tx('v2.line.orla.beaten') : tx('v2.line.orla.won')];
      return null;
    case 'ilse':
      if (act >= 2) return [tx('v2.line.ilse.act2')];
      return null;
    // lot L6 (the operator's EV-13 « Compléter les arcs, quatre scènes selon l’état »): one line an act for the pool's two who had none; the second act keeps
    // their words of lot L2b, in the title's race or out of it (src/narrative/dialogue.ts)
    case 'tobin':
      if (act === 1) return [tx('v2.line.tobin.act1')];
      if (act === 3) return [tx(s.flags.champion === PLAYER_ID ? 'v2.line.tobin.crowned' : inFinal(s, 'tobin') ? 'v2.line.tobin.final' : inFinal(s, PLAYER_ID) ? 'v2.line.tobin.act3final' : 'v2.line.tobin.act3')];
      return null;
    case 'rhosk':
      if (act === 1) return [tx('v2.line.rhosk.act1')];
      if (act === 3) return [tx(s.flags.champion === PLAYER_ID ? 'v2.line.rhosk.crowned' : inFinal(s, 'rhosk') ? 'v2.line.rhosk.final' : inFinal(s, PLAYER_ID) ? 'v2.line.rhosk.act3' : 'v2.line.rhosk.act3out')];
      return null;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------------------------------------------- Orla's recruitment

/** the day Orla's question comes (the contract's day 7: « préparation libre, enquête, recrutement, récupération ») */
export const RECRUIT_DAY = 7;

export type V2StoryAction = { type: 'recruit'; who: 'orla' } | { type: 'watched'; scene: string };

export const V2_STORY_ACTIONS: { [K in V2StoryAction['type']]: ActionDef<Extract<V2StoryAction, { type: K }>> & { by: string | null } } = {
  recruit: {
    by: 'orla',
    list: (s) => (isV2(s) && s.place === 'training' && s.facts.includes('orla-recruitable') && !s.facts.includes('orla-recruited') ? [{ type: 'recruit', who: 'orla' }] : []),
    label: () => tx('v2.recruit.label'),
    cost: () => 0,
    check: (s) => (!isV2(s) ? tx('v2.only') : !s.facts.includes('orla-recruitable') ? tx('v2.recruit.notYet') : s.facts.includes('orla-recruited') ? tx('v2.recruit.done')
      : s.day < RECRUIT_DAY ? tx('v2.recruit.wait', { day: RECRUIT_DAY }) : null),
    apply: (s, _a, _r, emit) => {
      s.facts.push('orla-recruited');
      const o = s.competitors.orla; if (o) { o.relationships.player = clamp((o.relationships.player ?? 0) + 20, -100, 100); o.teamId = 'player'; }
      emit({ kind: 'consequence', id: 'recruit:orla:done', cause: 'action:recruit', visible: true, text: tx('v2.recruit.log') });
    },
  },
  // a cutscene seen (the squares' pages hand it in once played): a flag, nothing else
  watched: {
    by: null,
    list: () => [],
    label: () => tx('v2.scene.watched'),
    cost: () => 0,
    check: (s, a) => (!isV2(s) ? tx('v2.only') : !CUTSCENES[a.scene] ? tx('v2.scene.unknown') : null),
    apply: (s, a) => { s.flags[`scene:${a.scene}`] = true; },
  },
};

/** what Orla at your side changes in a duel (« proposé »): her advice from the stands, one action point at the start */
export const ORLA_AP = 1;
export function allyAp(s: GameState): number { return isV2(s) && s.facts.includes('orla-recruited') ? ORLA_AP : 0; }

// ---------------------------------------------------------------------------------------------------------------- the cutscenes

/** one step of a live cutscene: the camera looks at a point of the square, a person walks to a point, a person speaks (lot L6: the speaker and the
 *  words may follow the state, a scene that depends on what happened) */
export type SceneStep = (
  | { cam: [number, number]; dist?: number; secs?: number }
  | { walk: string; to: [number, number] }
  | { say: string | ((s: GameState) => string); line: (s: GameState) => string }
  // a step played only when the state says so (lot L6: the parade's leader walks, Wren's verse; a look is never skipped: the squares' visibility bake samples
  // each look and the way from one to the next, src/world/PlazaVisibility.ts)
) & { if?: (s: GameState) => boolean };

/** who speaks a step (a step whose speaker follows the state names them from it) */
export const speakerOf = (s: GameState, step: { say: string | ((s: GameState) => string) }): string => (typeof step.say === 'function' ? step.say(s) : step.say);

export interface Cutscene {
  id: string;
  /** where it plays (a square's place) and when (first true on a page load, once per game) */
  place: 'forecourt' | 'training' | 'lanterns';
  when: (s: GameState) => boolean;
  /** who must stand on the square for it (the page adds them if the hour would not) */
  cast: string[];
  steps: SceneStep[];
}

/** the Lanterns' parade (lot L6): its order as set at dusk (the board's own, src/simulation/v2festival.ts), who may walk at its head on the square (the hero and
 *  the rivals who have a sheet there), and where: the foot of the hall's stage, beside Wren */
const paradeOf = (s: GameState): Array<{ id: string; n: number }> => {
  const f = s.v2?.festival;
  return f?.leader && f.lanterns ? Object.entries(f.lanterns).map(([id, n]) => ({ id, n })).sort((a, b) => (a.id === f.leader ? -1 : b.id === f.leader ? 1 : 0)) : paradeOrder(s);
};
export const PARADE_WALKERS = ['player', 'marek', 'ilse', 'vessa', 'orla', 'cassius'] as const;
export const STAGE_FOOT: [number, number] = [-2.8, -9.6];

export const CUTSCENES: Record<string, Cutscene> = {
  arrival: {
    id: 'arrival', place: 'forecourt', cast: ['odo', 'marek'],
    when: (s) => s.day === 1 && s.slot !== 'evening',
    steps: [
      { cam: [0, -14], dist: 20, secs: 2.5 },
      { say: 'odo', line: () => tx('v2.scene.arrival.1') },
      { walk: 'marek', to: [1.2, -3.0] },
      { cam: [1.5, -3], dist: 12, secs: 1.5 },
      { say: 'marek', line: () => tx('v2.scene.arrival.2') },
      { say: 'player', line: () => tx('v2.scene.arrival.3') },
    ],
  },
  cut: {
    id: 'cut', place: 'forecourt', cast: ['odo'],
    when: (s) => s.day === 5 && s.slot === 'evening' && stageMatches(s, 'semi').length > 0,
    steps: [
      { cam: [-6.5, -9], dist: 14, secs: 2 },
      { say: 'odo', line: () => tx('v2.scene.cut.1') },
      { say: 'player', line: () => tx('v2.scene.cut.2') },
    ],
  },
  orla: {
    id: 'orla', place: 'training', cast: ['orla'],
    when: (s) => s.day >= RECRUIT_DAY && s.facts.includes('orla-recruitable') && !s.facts.includes('orla-recruited') && s.slot !== 'evening',
    steps: [
      // between the sword ring and the tilt's lanes (journal Passe VP6: the yard's new layout put a ring's fence on her old way; the champions'
      // ring enlarged, iteration 11: in front of its north edge); by the champions' ring's steps since journal Passe VP9 (the lists)
      { cam: [-4.8, 0.4], dist: 12, secs: 2 },
      { walk: 'orla', to: [-4.0, 1.4] },
      { say: 'orla', line: () => tx('v2.scene.orla.1') },
      { say: 'player', line: () => tx('v2.scene.orla.2') },
      { say: 'orla', line: () => tx('v2.scene.orla.3') },
    ],
  },
  // the eve of the final, the Lanterns' parade played live (lot L6, FE-8 « Une scène en direct »): its two lines kept (the hero's second by whether they fight the
  // final), Wren calls the corteges in their order, the one at their head walks to the hall's stage (the hero, or a rival who has a sheet on the squares; Tobin and
  // Rhosk, in portrait only, are named by Wren), Wren's verse for the hero who led; the rivals who have a sheet stand on the square for it
  eve: {
    id: 'eve', place: 'lanterns', cast: ['bard', 'marek', 'ilse', 'vessa', 'orla', 'cassius'],
    when: (s) => s.day === 9 && s.slot === 'evening',
    steps: [
      // (before the hall's stage since journal Passe VP9)
      { cam: [-1.5, -9.8], dist: 16, secs: 2.5 },
      { say: 'bard', line: () => tx('v2.scene.eve.1') },
      { say: 'player', line: (s) => tx(inFinal(s, PLAYER_ID) ? 'v2.scene.eve.2' : 'v2.scene.eve.2out') },
      { cam: [-1.5, -7.0], dist: 18, secs: 2 },
      { say: 'bard', line: (s) => { const o = paradeOf(s), nm = (id: string) => speakerName(s, id); return tx('v2.scene.eve.call', { first: nm(o[0].id), n: o[0].n, second: nm(o[1].id), third: nm(o[2].id) }); } },
      ...PARADE_WALKERS.map((who) => ({ walk: who, to: STAGE_FOOT, if: (s: GameState) => paradeOf(s)[0].id === who })),
      { say: 'bard', line: (s) => tx('v2.scene.eve.verse', { name: s.player.name, purse: FEST.purse }), if: (s) => paradeOf(s)[0].id === PLAYER_ID },
      { say: 'bard', line: (s) => tx('v2.scene.eve.gift', { name: s.player.name, rival: speakerName(s, s.v2!.festival!.behind!) }), if: (s) => !!s.v2?.festival?.behind && paradeOf(s)[0].id === s.v2.festival.behind },
    ],
  },
  final: {
    id: 'final', place: 'forecourt', cast: ['odo'],
    when: (s) => s.day === 10 && s.slot === 'morning',
    steps: [
      { cam: [0, -15], dist: 22, secs: 3 },
      { say: 'odo', line: () => tx('v2.scene.final.1') },
      { say: 'player', line: () => tx('v2.scene.final.2') },
    ],
  },
  // ---- lot L6 (the operator's EV-13 « Compléter les arcs, quatre scènes selon l’état »): four scenes that depend on what happened, « proposé »
  // out of the cut: the Gate bouts' morning on the forecourt; Marek, who fought there his first year (or stands there himself)
  gate: {
    id: 'gate', place: 'forecourt', cast: ['odo', 'marek'],
    when: (s) => s.day === 6 && s.slot !== 'evening' && !!mine(s, 'gate'),
    steps: [
      { cam: [0, -14], dist: 20, secs: 2.5 },
      { say: 'odo', line: () => tx('v2.scene.gate.1') },
      { walk: 'marek', to: [1.2, -3.0] },
      { cam: [1.5, -3], dist: 12, secs: 1.5 },
      { say: 'marek', line: (s) => tx(stageMatches(s, 'gate').some((m) => m.a === 'marek' || m.b === 'marek') ? 'v2.scene.gate.2b' : 'v2.scene.gate.2', { name: s.player.name }) },
      { say: 'player', line: () => tx('v2.scene.gate.3') },
    ],
  },
  // after the semi-final: the evening of the bout or the next day, on the forecourt; won, the registrar names both finalists and the beaten rival speaks
  semiWon: {
    id: 'semiWon', place: 'forecourt', cast: ['odo'],
    when: (s) => afterSemi(s) && mine(s, 'semi')!.winner === PLAYER_ID,
    steps: [
      { cam: [0, -14], dist: 20, secs: 2.5 },
      { say: 'odo', line: (s) => tx('v2.scene.semiWon.1', { name: s.player.name, foe: RIVALS[otherFinalist(s) ?? '']?.name ?? '' }) },
      { say: (s) => semiFoe(s), line: (s) => tx(SEMI_WON[RIVALS[semiFoe(s)]?.temper ?? 'honourable'], { name: s.player.name }) },
      { say: 'player', line: () => tx('v2.scene.semiWon.3') },
    ],
  },
  // lost, Sister Anwen tends the hero and the winner speaks; the third place is fought on day 8
  semiLost: {
    id: 'semiLost', place: 'forecourt', cast: ['anwen'],
    when: (s) => afterSemi(s) && mine(s, 'semi')!.winner !== PLAYER_ID,
    steps: [
      { cam: [-7.6, -0.6], dist: 12, secs: 2 },
      { say: 'anwen', line: () => tx('v2.scene.semiLost.1') },
      { say: (s) => semiFoe(s), line: (s) => tx(SEMI_LOST[RIVALS[semiFoe(s)]?.temper ?? 'honourable']) },
      { say: 'player', line: () => tx('v2.scene.semiLost.3') },
    ],
  },
  // Cassius unmasked before the town (his man caught at the forge, Hale told, or shamed on the square): the first evening after, on the festival square
  unmasked: {
    id: 'unmasked', place: 'lanterns', cast: ['cassius', 'lio'],
    when: (s) => s.slot === 'evening' && !!unmaskedHow(s),
    steps: [
      { cam: [6.6, -4.6], dist: 12, secs: 2 },
      { say: 'lio', line: (s) => tx(UNMASKED[unmaskedHow(s) ?? 'caught']) },
      { say: 'cassius', line: (s) => tx(dreeChain(s) === 'forge' ? 'v2.scene.unmasked.forge' : 'v2.scene.unmasked.gear') },
      { say: 'player', line: () => tx('v2.scene.unmasked.3') },
    ],
  },
  // the epilogue: the crowning on the forecourt the evening of day 10, by the champion and the hero's place
  epilogue: {
    id: 'epilogue', place: 'forecourt', cast: ['odo', 'marek', 'bard'],
    when: (s) => s.day === 10 && s.slot === 'evening' && !!s.flags.champion,
    steps: [
      { cam: [0, -15], dist: 22, secs: 3 },
      { say: 'odo', line: (s) => (s.flags.champion === PLAYER_ID ? tx('v2.scene.epilogue.crowned', { name: s.player.name }) : tx('v2.scene.epilogue.champion', { champ: RIVALS[String(s.flags.champion)]?.name ?? '' })) },
      { walk: 'marek', to: [1.2, -3.0] },
      { cam: [1.5, -3], dist: 12, secs: 1.5 },
      { say: 'marek', line: (s) => tx(MAREK_END[marekEnd(s)], { name: s.player.name, champ: RIVALS[String(s.flags.champion)]?.name ?? '' }) },
      { say: 'player', line: (s) => tx(HERO_END[placeEnd(s)]) },
      // the hero who led the Lanterns' parade keeps a verse in Wren's song (lot L6, FE-5)
      { say: 'bard', line: (s) => tx(s.flags.champion === PLAYER_ID ? 'v2.scene.epilogue.wren.crowned' : 'v2.scene.epilogue.wren', { name: s.player.name }), if: (s) => s.v2?.festival?.leader === PLAYER_ID },
    ],
  },
};


/** the scenes' words by the state (each key written out: tests/texts.test.mjs finds every key asked for in the code) */
const SEMI_WON: Record<Temper, TextKey> = { honourable: 'v2.scene.semiWon.honourable', proud: 'v2.scene.semiWon.proud', cold: 'v2.scene.semiWon.cold' };
const SEMI_LOST: Record<Temper, TextKey> = { honourable: 'v2.scene.semiLost.honourable', proud: 'v2.scene.semiLost.proud', cold: 'v2.scene.semiLost.cold' };
const UNMASKED: Record<'confronted' | 'reported' | 'caught', TextKey> = { confronted: 'v2.scene.unmasked.confronted', reported: 'v2.scene.unmasked.reported', caught: 'v2.scene.unmasked.caught' };
const MAREK_END: Record<ReturnType<typeof marekEnd>, TextKey> = { crowned: 'v2.scene.epilogue.marek.crowned', kept: 'v2.scene.epilogue.marek.kept', second: 'v2.scene.epilogue.marek.second', other: 'v2.scene.epilogue.marek.other' };
const HERO_END: Record<ReturnType<typeof placeEnd>, TextKey> = { champion: 'v2.scene.epilogue.hero.champion', final: 'v2.scene.epilogue.hero.final', semis: 'v2.scene.epilogue.hero.semis', gate: 'v2.scene.epilogue.hero.gate', out: 'v2.scene.epilogue.hero.out' };
type Temper = 'proud' | 'honourable' | 'cold';

/** the player's bout of a stage of the bracket, if any */
const mine = (s: GameState, stage: Stage) => stageMatches(s, stage).find((m) => m.a === PLAYER_ID || m.b === PLAYER_ID);
/** the player's semi-final fought, its evening or the next day */
const afterSemi = (s: GameState): boolean => !!mine(s, 'semi')?.winner && (s.day === 6 && s.slot === 'evening' || s.day === 7 && s.slot !== 'evening');
/** the rival the player met in their semi-final */
const semiFoe = (s: GameState): string => { const m = mine(s, 'semi'); return m ? (m.a === PLAYER_ID ? m.b : m.a) : ''; };
/** the other semi-final's winner */
const otherFinalist = (s: GameState): string | null => stageMatches(s, 'semi').find((m) => m.a !== PLAYER_ID && m.b !== PLAYER_ID)?.winner ?? null;

/** how Cassius was unmasked before the town (src/simulation/v2festival.ts: the bought lanterns go out with it), re-exported for the scenes' tests */
export { unmaskedHow };
/** which of House Dree's two chains the town knows: the quay's forge, or the gear's strap (as the report and the confrontation say, src/simulation/roles.ts) */
const dreeChain = (s: GameState): 'forge' | 'gear' => (['forge-burned', 'saboteur-caught', 'culprit-named', 'saboteur-fled'].some((f) => s.facts.includes(f)) ? 'forge' : 'gear');

/** Marek's words at the crowning: the hero crowned, Marek crowned, the hero second, or another's crown */
function marekEnd(s: GameState): 'crowned' | 'kept' | 'second' | 'other' {
  if (s.flags.champion === PLAYER_ID) return 'crowned';
  if (s.flags.champion === 'marek') return 'kept';
  return v2Ranking(s).indexOf(PLAYER_ID) === 1 ? 'second' : 'other';
}
/** the hero's last words by their place (v2EndLine's ranks) */
function placeEnd(s: GameState): 'champion' | 'final' | 'semis' | 'gate' | 'out' {
  const r = v2Ranking(s).indexOf(PLAYER_ID) + 1;
  return r === 1 ? 'champion' : r === 2 ? 'final' : r <= 4 ? 'semis' : r <= 6 ? 'gate' : 'out';
}

/** the cutscene a page of this state plays first, if any (never twice in a game) */
export function pendingScene(s: GameState): Cutscene | null {
  if (!isV2(s)) return null;
  for (const c of Object.values(CUTSCENES)) if (c.place === s.place && !s.flags[`scene:${c.id}`] && c.when(s)) return c;
  return null;
}

/** the speaker's name in a cutscene */
export function speakerName(s: GameState, who: string): string { return who === 'player' ? s.player.name : PEOPLE[who]?.name ?? who; }
