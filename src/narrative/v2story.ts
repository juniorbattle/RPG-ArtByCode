import { clamp, type GameState } from '../simulation/state';
import type { ActionDef } from '../simulation/actions';
import { isV2 } from '../simulation/v2';
import { PLAYER_ID } from './roster';
import { PEOPLE } from './people';
import { tx } from './text';
import { stageMatches, actOf } from '../tournament/v2calendar';

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

/** one step of a live cutscene: the camera looks at a point of the square, a person walks to a point, a person speaks */
export type SceneStep =
  | { cam: [number, number]; dist?: number; secs?: number }
  | { walk: string; to: [number, number] }
  | { say: string; line: () => string };

export interface Cutscene {
  id: string;
  /** where it plays (a square's place) and when (first true on a page load, once per game) */
  place: 'forecourt' | 'training' | 'lanterns';
  when: (s: GameState) => boolean;
  /** who must stand on the square for it (the page adds them if the hour would not) */
  cast: string[];
  steps: SceneStep[];
}

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
      { cam: [4.5, -7.6], dist: 12, secs: 2 },
      { walk: 'orla', to: [1.0, -2.0] },
      { say: 'orla', line: () => tx('v2.scene.orla.1') },
      { say: 'player', line: () => tx('v2.scene.orla.2') },
      { say: 'orla', line: () => tx('v2.scene.orla.3') },
    ],
  },
  eve: {
    id: 'eve', place: 'lanterns', cast: ['bard'],
    when: (s) => s.day === 9 && s.slot === 'evening',
    steps: [
      { cam: [0, -14], dist: 16, secs: 2.5 },
      { say: 'bard', line: () => tx('v2.scene.eve.1') },
      { say: 'player', line: () => tx('v2.scene.eve.2') },
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
};

/** the cutscene a page of this state plays first, if any (never twice in a game) */
export function pendingScene(s: GameState): Cutscene | null {
  if (!isV2(s)) return null;
  for (const c of Object.values(CUTSCENES)) if (c.place === s.place && !s.flags[`scene:${c.id}`] && c.when(s)) return c;
  return null;
}

/** the speaker's name in a cutscene */
export function speakerName(s: GameState, who: string): string { return who === 'player' ? s.player.name : PEOPLE[who]?.name ?? who; }
