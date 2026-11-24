import { clamp, type GameState, type V2SabEve } from './state';
import type { ActionDef } from './actions';
import { isV2 } from './v2';
import { available } from './roles';
import { stagePrice } from './gear';
import { PLAYER_ID, RIVALS } from '../narrative/roster';
import { tx } from '../narrative/text';
import { hashString } from '../core/rng';
import { computePulse } from '../tournament/pulse';
import { PURSES } from '../tournament/pool';
import { AUTO_RACE, autoKitStates } from '../combat/autoData';
import type { AutoStateId } from '../combat/auto';
import { STATE_NAME, kitOf } from './v2scout';
import { pendingFinal } from '../tournament/v2calendar';

/** The player's sabotage (the operator's SB-1 « Oui, une forme : couper une sangle de l’adversaire la veille d’un combat de tableau », with his note « Il faudrait que cela soit
 *  sophistique afin de pas rendre l'action facile et accessible pour tous... plus on avance dans les jours et donc le tournoi, plus le sabotage en devient plus dur », SB-2 « Plus
 *  dur que le vol : vu, c’est tout de suite l’avertissement du greffier et un point de la poule », SB-3 « Le laboratoire mesure et te montre le chiffre avant de le fixer »; journal
 *  Passes CL2 / SB1 to SB4, `briefs/combat-auto.md` § 44; his two sheets, https://claude.ai/artifact/W845NbXSg4bwzAaFVc87Tv (SA-1 to SA-6) and
 *  https://claude.ai/artifact/3BTGFGBe222cMi8LpTmJzj (SF-1 to SF-4, the numbers measured by `tools/auto-sabotage.mjs`).
 *
 *  The action has three steps (SA-1 « A · Trois temps : repérer, s’équiper, la nuit »), each a slot:
 *  1. case the arena's lockers, by day, at the forecourt, on the eve itself: the guards' rounds, and whether the next opponent keeps their gear in the open or in Clerk Odo's
 *     strongroom (`caseLockers`);
 *  2. a fine tool from the hooded stranger, on the quay at night, an evening before the eve, 8 coins (× the stage's price) (`buyTool`);
 *  3. the night of the eve, at the forecourt, alone or with Corra Dunmere keeping watch (20 coins × the stage's price) (`cutStrap`).
 *  The eves are the evenings of days 5, 7 and 9, whenever a bout of the bracket follows (SA-2 « A · Aussi le soir du 5 »: the first before the bracket is drawn, the target named
 *  that evening). The strap is cut for the next day's bout only: the rival takes ×1.15 the damage (SF-1 « A · ×1,15, comme la sangle de Cassius », the same `AutoFighter.taken`
 *  the strap Cassius cuts on the player sets). Three levers make it harder with the days (SA-3): the chance of being seen follows the evening's pulse of security and a stage more
 *  at each eve, 15 / 35 / 55 % at the pulse of 50 (SF-2 « A · 15 / 35 / 55 % d’être vu, un complice −15 points pour 20 pièces »); the rich rivals keep their gear in Clerk Odo's
 *  strongroom from day 7, one game in two (SF-3 « C · Les riches, un jour sur deux (le repérage le dit) », which replaced « les deux finalistes » of SA-3: it closed the only eve
 *  that pays); the tool and the accomplice cost as the shops' goods do (×1.15 from day 6, ×1.3 from day 9). Seen (SA-4 « B · L’avertissement, et la moitié de la bourse du combat
 *  de demain »): nothing is cut, the registrar warns, tomorrow's purse is halved, and the rival keeps a grudge (SA-5 « A · Il garde rancune : plus dur demain, la page du tournoi s’en
 *  souvient », SF-4 « B · +50 : deux points d’Attaque de plus pour le rival »: their relation falls by 30, their preparation +50 for that bout, the cause on the board). A cut that
 *  was not seen stays secret (SA-6 « A · Un coup réussi reste secret »). The state is `V2State.sabotage`, absent until the player first sets about it (a game that never does keeps
 *  its fingerprint). Every number is the measured one. Pure. */

export const SAB = {
  /** the damage the cut rival takes (SF-1) */
  force: 1.15,
  /** the share of the rival's Attack the blunted blade takes off, and the state their weapon carries with it (SG-1 « A · L’Attaque du rival −20 %, l’état de son arme retiré ») */
  blade: 0.2,
  /** the chance of being seen alone at the pulse of 50 of the evening, by eve (SF-2); each point of the pulse above 50 adds a point */
  seen: { 5: 0.15, 7: 0.35, 9: 0.55 } as Readonly<Record<number, number>>,
  /** the evening's security the chances are given at (the pulse's own: 62 by day less 12 at night, src/tournament/pulse.ts) */
  pulse: 50,
  /** what Corra Dunmere's watch takes off the chance (SF-2) */
  accomplice: 0.15,
  /** the tool's price and the accomplice's, before the stage's factor */
  toolCoins: 8, accompliceCoins: 20,
  /** the rival's relation to the player after a sabotage seen, and the preparation it adds to their next bout: two points of Attack (SA-5, SF-4) */
  grudgeRel: -30, grudgePrep: 50,
  /** the rivals rich enough (their fortune, `roster.ts`) keep their gear in the strongroom from this day, a share of the games (SF-3) */
  lockFrom: 7, lockWealth: 60, lockChance: 0.5,
  /** the first day the tool can be bought (the bracket is near) */
  toolFrom: 3,
} as const;

/** how a sabotage of an eve ended: cut (secret) or seen */
export type SabEve = V2SabEve;
/** the eves, the evenings of the days before the bracket's bouts */
export const EVES: readonly number[] = [5, 7, 9];

/** the player's next bout of the bracket after today: its opponent (null until the bracket is drawn: before the cut every bout of the bracket is day 6's), its day and stage */
export function bracketAhead(s: GameState): { foe: string | null; day: number; stage: string } | null {
  if (!isV2(s) || s.over) return null;
  const mine = s.tournament.matches.filter((m) => m.stage && !m.winner && (m.a === PLAYER_ID || m.b === PLAYER_ID) && m.day > s.day).sort((a, b) => a.day - b.day)[0];
  if (mine) return { foe: mine.a === PLAYER_ID ? mine.b : mine.a, day: mine.day, stage: mine.stage! };
  const f = pendingFinal(s);
  if (f && f.day > s.day) return { foe: f.foe, day: f.day, stage: 'final' };
  return s.day <= 5 ? { foe: null, day: 6, stage: 'semi' } : null;
}
/** the eve the next bout of the bracket gives (the day before it: 5, 7 or 9), or null */
export function eveOf(s: GameState): number | null {
  const b = bracketAhead(s);
  return b ? b.day - 1 : null;
}

/** does this rival keep their gear in Clerk Odo's strongroom: a rich one (the fortune of the roster), from day 7, in the games the seed picks (SF-3) */
export function rivalLocks(s: Pick<GameState, 'seed' | 'day' | 'flags'>, id: string, day = s.day): boolean {
  return isV2(s) && day >= SAB.lockFrom && (RIVALS[id]?.wealth ?? 0) >= SAB.lockWealth && (hashString(`${s.seed}:strap:${id}`) >>> 0) / 4294967296 < SAB.lockChance;
}

/** the chance of being seen at this eve: the stage's, plus a point for each point of the evening's security above its usual, less the accomplice's watch (SF-2); never under 5 % nor over 95 % */
export function seenChance(s: GameState, eve: number, accomplice: boolean): number {
  const base = SAB.seen[eve] ?? SAB.seen[9], pulse = computePulse(s).security;
  return clamp(base + (pulse - SAB.pulse) / 100 - (accomplice ? SAB.accomplice : 0), 0.05, 0.95);
}

/** the tool's and the accomplice's price now: the shops' stage factor on their base price */
export const toolPrice = (s: Pick<GameState, 'day'>): number => Math.round(SAB.toolCoins * stagePrice(s.day));
export const accomplicePrice = (s: Pick<GameState, 'day'>): number => Math.round(SAB.accompliceCoins * stagePrice(s.day));

/** what the eve before this bout's day came to, if the player sabotaged it */
export const eveBefore = (s: Pick<GameState, 'v2'>, boutDay: number): SabEve | undefined => s.v2?.sabotage?.eves?.[boutDay - 1];
/** the strap of this rival is cut for the bout of this day: they take ×1.15 */
export const foeCut = (s: Pick<GameState, 'v2'>, boutDay: number, foe: string): boolean => { const e = eveBefore(s, boutDay); return !!e && e.result === 'cut' && e.foe === foe && e.gesture !== 'blade'; };
/** the weapon of this rival is blunted for the bout of this day: their Attack −20 % and the state their weapon carries gone (SG-1) */
export const foeBlunted = (s: Pick<GameState, 'v2'>, boutDay: number, foe: string): boolean => { const e = eveBefore(s, boutDay); return !!e && e.result === 'cut' && e.foe === foe && e.gesture === 'blade'; };
/** the state a rival's weapon carries (a bleeding, a blindness, a poison, a burn), or null: Orla, Ilse and Rhosk carry none in the weapon (theirs are in their skills) */
export const weaponState = (id: string): AutoStateId | null => autoKitStates(kitOf(id)).poses.find((p) => p.from === 'weapon')?.state ?? null;
/** the preparation a sabotage seen adds to this rival's bout of this day (SF-4) */
export const foeGrudge = (s: Pick<GameState, 'v2'>, boutDay: number, foe: string): number => { const e = eveBefore(s, boutDay); return e && e.result === 'seen' && e.foe === foe ? SAB.grudgePrep : 0; };
/** the purse of this day's bout is halved: the sabotage of the eve before was seen (SA-4) */
export const purseHalved = (s: Pick<GameState, 'v2'>, boutDay: number): boolean => eveBefore(s, boutDay)?.result === 'seen';

/** the damage a cut rival takes more, in percent */
export const forcePct = (): number => Math.round((SAB.force - 1) * 100);
/** the share of Attack a blunted blade takes off, in percent */
export const bladePct = (): number => Math.round(SAB.blade * 100);
/** the Attack points a sabotage seen adds to the rival's next bout (their preparation, one point of Attack for each `prepPer`: AC-17) */
export const grudgeAttack = (): number => +(SAB.grudgePrep / AUTO_RACE.prepPer).toFixed(2);

const nameOf = (id: string): string => RIVALS[id]?.name ?? id;
const PURSE_STAGE = (stage: string) => PURSES[stage as keyof typeof PURSES] ?? PURSES.semi;

/** the night's gesture: `blade` blunts the rival's weapon instead of cutting their strap (SG-2 « A · Le choix la nuit : la sangle ou la lame, une seule par nuit ») */
export type V2SabotageAction = { type: 'caseLockers' } | { type: 'buyTool' } | { type: 'cutStrap'; accomplice?: boolean; blade?: boolean };

const casedToday = (s: GameState): boolean => s.v2?.sabotage?.cased === s.day;
const holdsTool = (s: GameState): boolean => !!s.v2?.sabotage?.tool;

export const V2_SABOTAGE_ACTIONS: { [K in V2SabotageAction['type']]: ActionDef<Extract<V2SabotageAction, { type: K }>> & { by: string | null } } = {
  // step 1: the lockers cased by day at the forecourt, on the eve itself
  caseLockers: {
    by: null,
    list: (s) => (isV2(s) && s.place === 'forecourt' && s.slot !== 'evening' && eveOf(s) === s.day ? [{ type: 'caseLockers' }] : []),
    label: () => tx('v2.sab.case.label'),
    cost: () => 1,
    check: (s) => {
      if (!isV2(s)) return tx('v2.only');
      if (s.place !== 'forecourt') return tx('v2.sab.case.notHere');
      if (eveOf(s) !== s.day) return tx('v2.sab.noEve');
      if (s.slot === 'evening') return tx('v2.sab.case.day');
      return casedToday(s) ? tx('v2.sab.case.done') : null;
    },
    apply: (s, _a, _r, emit) => {
      const ahead = bracketAhead(s), foe = ahead?.foe ?? null;
      (s.v2!.sabotage ??= {}).cased = s.day;
      emit({ kind: 'action', id: 'sabotage:case', cause: 'action:caseLockers', visible: true,
        text: !foe ? tx('v2.sab.case.logAny') : rivalLocks(s, foe) ? tx('v2.sab.case.logLocked', { name: nameOf(foe) })
          // (SG-3 « A · Le repérage des casiers dit ce que porte l’arme du rival »)
          : `${tx('v2.sab.case.logOpen', { name: nameOf(foe) })} ${weaponState(foe) ? tx('v2.sab.case.weapon', { name: nameOf(foe), state: tx(STATE_NAME[weaponState(foe)!]!) }) : tx('v2.sab.case.weaponNone', { name: nameOf(foe) })}` });
    },
  },
  // step 2: the fine tool, from the hooded stranger on the quay at night, an evening before the eve
  buyTool: {
    by: 'stranger',
    list: (s) => { const e = eveOf(s); return isV2(s) && s.place === 'district' && s.slot === 'evening' && e !== null && s.day < e && s.day >= SAB.toolFrom ? [{ type: 'buyTool' }] : []; },
    label: (s) => tx('v2.sab.tool.label', { n: toolPrice(s) }),
    cost: () => 1,
    coins: (s) => toolPrice(s),
    check: (s) => {
      if (!isV2(s)) return tx('v2.only');
      const away = available(s, 'stranger'); if (away) return away;
      const e = eveOf(s);
      if (e === null) return tx('v2.sab.noEve');
      if (s.day >= e) return tx('v2.sab.tool.eve');
      if (s.day < SAB.toolFrom) return tx('v2.sab.tool.soon');
      if (holdsTool(s)) return tx('v2.sab.tool.have');
      return s.player.coins < toolPrice(s) ? tx('v2.sab.tool.poor', { n: toolPrice(s) }) : null;
    },
    apply: (s, _a, _r, emit) => {
      const n = toolPrice(s);
      s.player.coins -= n; (s.v2!.sabotage ??= {}).tool = true;
      emit({ kind: 'action', id: 'sabotage:tool', cause: 'action:buyTool', visible: true, text: tx('v2.sab.tool.log', { n }) });
    },
  },
  // step 3: the night of the eve, at the forecourt, alone or with Corra Dunmere keeping watch
  cutStrap: {
    by: null,
    list: (s) => (isV2(s) && s.place === 'forecourt' && s.slot === 'evening' && eveOf(s) === s.day ? [{ type: 'cutStrap' }, { type: 'cutStrap', accomplice: true }, { type: 'cutStrap', blade: true }, { type: 'cutStrap', blade: true, accomplice: true }] : []),
    label: (s, a) => {
      const foe = bracketAhead(s)?.foe, name = foe ? nameOf(foe) : tx('v2.sab.cut.anyone');
      if (a.blade) return a.accomplice ? tx('v2.sab.blade.labelWith', { name, n: accomplicePrice(s) }) : tx('v2.sab.blade.label', { name });
      return a.accomplice ? tx('v2.sab.cut.labelWith', { name, n: accomplicePrice(s) }) : tx('v2.sab.cut.label', { name });
    },
    cost: () => 1,
    coins: (s, a) => (a.accomplice ? accomplicePrice(s) : 0),
    check: (s, a) => {
      if (!isV2(s)) return tx('v2.only');
      if (s.place !== 'forecourt') return tx('v2.sab.case.notHere');
      const ahead = bracketAhead(s);
      if (!ahead || ahead.day - 1 !== s.day) return tx('v2.sab.noEve');
      if (s.slot !== 'evening') return tx('v2.sab.cut.night');
      if (s.v2?.sabotage?.eves?.[s.day]) return tx('v2.sab.cut.done');
      if (!holdsTool(s)) return tx('v2.sab.cut.noTool');
      if (!casedToday(s)) return tx('v2.sab.cut.noCase');
      if (!ahead.foe) return tx('v2.sab.cut.noFoe');
      if (rivalLocks(s, ahead.foe)) return tx('v2.sab.cut.locked', { name: nameOf(ahead.foe) });
      return a.accomplice && s.player.coins < accomplicePrice(s) ? tx('v2.sab.cut.poor', { n: accomplicePrice(s) }) : null;
    },
    apply: (s, a, rng, emit) => {
      const ahead = bracketAhead(s)!, foe = ahead.foe!, name = nameOf(foe), acc = !!a.accomplice, sab = (s.v2!.sabotage ??= {});
      delete sab.tool;
      if (acc) s.player.coins -= accomplicePrice(s);
      const seen = rng.next() < seenChance(s, s.day, acc);
      (sab.eves ??= {})[s.day] = { foe, result: seen ? 'seen' : 'cut', ...(acc ? { accomplice: true } : {}), ...(a.blade ? { gesture: 'blade' as const } : {}) };
      if (!seen && a.blade) {
        const st = weaponState(foe);
        emit({ kind: 'action', id: 'sabotage:cut', cause: 'action:cutStrap', visible: true,
          text: tx(acc ? 'v2.sab.blade.logWith' : 'v2.sab.blade.log', { name, n: bladePct(), extra: st ? ` ${tx('v2.sab.blade.extra', { name, state: tx(STATE_NAME[st]!) })}` : '' }) });
        return;
      }
      if (!seen) {
        emit({ kind: 'action', id: 'sabotage:cut', cause: 'action:cutStrap', visible: true, text: tx(acc ? 'v2.sab.cut.logWith' : 'v2.sab.cut.log', { name, n: forcePct() }) });
        return;
      }
      // seen: nothing is cut; the rival keeps a grudge (SA-5), the registrar warns and tomorrow's purse is halved (SA-4)
      const c = s.competitors[foe];
      if (c) { c.relationships[PLAYER_ID] = clamp((c.relationships[PLAYER_ID] ?? 0) + SAB.grudgeRel, -100, 100); if (!c.knownFacts.includes(`sabotaged-by:${PLAYER_ID}:${s.day}`)) c.knownFacts.push(`sabotaged-by:${PLAYER_ID}:${s.day}`); }
      const purse = PURSE_STAGE(ahead.stage);
      emit({ kind: 'consequence', id: 'sabotage:seen', cause: 'action:cutStrap', visible: true, text: tx(acc ? 'v2.sab.seen.logWith' : 'v2.sab.seen.log', { name }) });
      emit({ kind: 'consequence', id: 'sabotage:warned', cause: tx('v2.law.causeRules'), visible: true, text: tx('v2.sab.seen.warn', { won: Math.floor(purse[0] / 2), lost: Math.floor(purse[1] / 2) }) });
    },
  },
};
