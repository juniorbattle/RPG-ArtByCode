import { NPC_FIGHTERS } from './npcFighters';
import { PEOPLE } from './people';
import { cap, tx } from './text';

/** The champions of the townsfolk (the operator's request of 2026-11-23, word for word « concernant les combats potentiels contre les pnjs passants non-combattants... on a
 *  integre des combattants generiques mais cela manque de coherence car les combattants ne sont pas les passants que nous defions/volons... donc on devrait clairement dire
 *  que ce sont des combattants au services des pnjs qui decide de se battre contre toi quand tu entres en interactions pour voler/defier avec ces pnjs ... et donc cela doit
 *  se resentir dans le dialogue mais aussi sur les UI ( representant de ... _). », journal Passe CH-PNJ): a keeper robbed at their stall by day (Mara, Hilde, Master Corvin,
 *  Pip) and a passer-by robbed or pressed for their piece are no fighters; the one who meets the player on the sand is **their champion**, a fighter in their service, in
 *  their colours (the look and the weapon of src/narrative/npcFighters.ts), who steps forward on their own and fights in their place. The champion has no name of their own:
 *  « Mara's champion », « Representing Mara ». Presentation only: the simulation still keys the fight by the person (`challenge.who`), its rules, stakes, slots and
 *  fingerprint are unchanged. Not champions: Wynn of the quay watch (a man of the watch, he fights himself), the events' fighters (Marrow Vane, Wick Sallow: their own
 *  names), the six fighters of the town and the rivals (their own names, at their own places). English (K1) in the simulation, the page's language otherwise. */

/** the people whose fight is their own although a template stands for them: the watch fights for the Cité (src/narrative/npcFighters.ts) */
const FIGHTS_THEMSELVES: ReadonlySet<string> = new Set(['wynn']);

/** the person a fighter of the townsfolk fights for, or null: the fighter stands for a person of the town (a keeper, a passer-by) who is no fighter */
export function masterOf(who: string): string | null {
  const n = NPC_FIGHTERS[who];
  return n && !n.name && PEOPLE[who] && !FIGHTS_THEMSELVES.has(who) ? who : null;
}

/** the master's name: whoever the player robbed or pressed (the one who is paid the fine, who keeps the piece, who remembers) */
export const masterName = (who: string): string => PEOPLE[who]?.name ?? who;

/** the champion's name: « Mara's champion » (the French by their template's gender: « le champion de Mara », « la championne de Mara ») */
export function championName(who: string): string {
  const n = NPC_FIGHTERS[who];
  return tx(n?.look.template === 'f' ? 'champion.ofF' : 'champion.ofM', { master: masterName(who) });
}

/** the champion's name as a heading, a HUD's name or a column's head (a capital first letter: the French « le champion de Mara » opens a line as « Le champion de Mara ») */
export const championHead = (who: string): string => cap(championName(who));

/** the line under the champion's name where a title would stand: « Representing Mara » */
export function championTitle(who: string): string {
  const n = NPC_FIGHTERS[who];
  return tx(n?.look.template === 'f' ? 'champion.repF' : 'champion.repM', { master: masterName(who) });
}

/** what the page calls the one on the sand: their champion when they fight for a person of the town, else the fighter's own name (the town's person, the encounter's
 *  fighter, a fighter of the town, a rival) */
export function foeLabel(who: string, own: string): string {
  return masterOf(who) ? championName(who) : own;
}
