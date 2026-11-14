import { AUTO_RULES, type AutoAction, type AutoEvent, type AutoFighter, type AutoResult } from './auto';

/** Master Corvin's notebook (lot 3 of « La Brute », the operator's PB-4 « Toutes », briefs/combat-auto.md § 33.5; the proposition's « Le carnet du maître d'armes :
 *  après chaque combat, ce qui l'a décidé (dégâts par source, failles créées et manquées, coups d'éclat gâchés, interruptions, parades) et un conseil »): what a
 *  duel's script says of Ren's bout, read with the duel's own rules (src/combat/auto.ts hitOnce: an opener's first blow that lands opens its target, an interruption
 *  the interrupted, a parry the striker, a big action dodged its striker; a break stuns), and one piece of advice, the first of an order that holds. A note is
 *  kept with the game outside its fingerprint (`V2State.$notes`), the rehearsal sums thirty of them (src/simulation/v2prep.ts). Pure. */

export type NoteKind = 'bout' | 'challenge' | 'rehearsal';
/** one of Ren's four in a bout: its uses spent and allowed, the blows that landed (an action's first, guarded or not), those that landed in an opening, a break
 *  or on an opponent charging a big action (where an exploit is twice as strong), those that came to nothing (dodged, parried, cut by an interruption, lost in a
 *  clash), and its damage */
export interface NoteSkill { id: string; used: number; max: number; landed: number; clean: number; void: number; dmg: number }
export type AdviceKey = 'feint' | 'exploit' | 'dodged' | 'foeSkill' | 'unspent' | 'noOpen' | 'keep' | 'rehearse';
export interface Advice { k: AdviceKey; skill?: string; foeSkill?: string; n?: number; of?: number; pct?: number }
export interface BoutNote {
  day: number; foe: string; kind: NoteKind; won: boolean;
  /** the duel's length (s) */
  t: number;
  /** Ren's damage by source: his light attacks, his heavy blow, his skills */
  dmg: [number, number, number];
  /** the damage Ren took, by the same sources */
  taken: [number, number, number];
  /** the openings each made (the duel's own count) and the breaks each suffered */
  open: [number, number];
  breaks: [number, number];
  /** Ren's damage that landed in an opening or a break of his opponent */
  inOpen: number;
  skills: NoteSkill[];
  /** the opponent's offensive skill that did Ren the most harm */
  foeTop?: { id: string; dmg: number };
  clashes: number;
  advice: Advice;
}

/** the advice's thresholds (« proposé »): a Feint wasted when half of them cut nothing (from two fired), an opponent's skill heavy from 35 % of Ren's wounds, two
 *  uses left unspent, two big blows dodged */
export const NOTE_RULES = { feintFrom: 2, foeShare: 0.35, unspent: 2, dodged: 2 };

const kindOf = (a: AutoAction): 0 | 1 | 2 => (a.kind === 'light' ? 0 : a.kind === 'heavy' ? 1 : 2);

/** a bout's note from its duel (its script: autoDuel(..., { log: true })); `ren` and `foe` the two fighters as the duel took them (Ren first) */
export function boutNote(r: AutoResult, ren: AutoFighter, foe: AutoFighter, meta: { day: number; foe: string; kind: NoteKind }): BoutNote {
  if (!r.log) throw new Error('a note reads a duel\'s script: autoDuel(..., { log: true })');
  const R = AUTO_RULES, F = [ren, foe] as const, side = (who: string): 0 | 1 => (who === ren.id ? 0 : 1);
  const acts = F.map((x) => new Map<string, AutoAction>([x.light, x.heavy, ...x.skills].map((a) => [a.id, a]))) as [Map<string, AutoAction>, Map<string, AutoAction>];
  // each side: open until, stunned until, the big action it charges (not yet left), the enchaînement under way (its action and the blows left)
  const S = [0, 1].map(() => ({ openUntil: 0, stunEnd: 0, charging: null as AutoAction | null, combo: null as { a: AutoAction; left: number } | null }));
  const skills: NoteSkill[] = ren.skills.map((a) => ({ id: a.id, used: 0, max: a.uses ?? 0, landed: 0, clean: 0, void: 0, dmg: 0 }));
  const sk = (id?: string) => skills.find((x) => x.id === id);
  const dmg: [number, number, number] = [0, 0, 0], taken: [number, number, number] = [0, 0, 0], breaks: [number, number] = [0, 0];
  const foeDmg = new Map<string, number>();
  let inOpen = 0, clashes = 0, cut = 0;
  const feint = ren.skills.find((a) => a.role === 'interrupt');
  for (const e of r.log as AutoEvent[]) {
    const i = side(e.who), o = (1 - i) as 0 | 1, me = S[i], it = S[o], a = e.act ? acts[i].get(e.act) : undefined;
    switch (e.ev) {
      case 'charge':
        if (a) { me.charging = a.kind !== 'light' ? a : null; me.combo = null; if (i === 0 && a.kind === 'skill') { const x = sk(a.id); if (x) x.used++; } }
        break;
      case 'ward': case 'boost': me.charging = null; break;
      case 'hit': case 'guarded': case 'dodged': {
        if (!a) break;
        // an action's first blow (its charge ends), or an enchaînement's next
        const first = !me.combo || me.combo.a.id !== a.id;
        if (first) { me.charging = null; me.combo = { a, left: (a.hits?.length ?? 1) - 1 }; } else me.combo!.left--;
        const broken = it.stunEnd > e.t + 1e-9, open = !broken && it.openUntil > e.t + 1e-9;
        const exposed = R.exposed && (!!it.charging || (!!it.combo && it.combo.left > 0));
        const d = e.ev === 'dodged' ? 0 : e.dmg ?? 0, k = kindOf(a);
        if (i === 0) { dmg[k] += d; if (broken || open) inOpen += d; } else { taken[k] += d; if (k === 2 && !a.ward && !a.boost) foeDmg.set(a.id, (foeDmg.get(a.id) ?? 0) + d); }
        if (i === 0 && a.kind === 'skill') {
          const x = sk(a.id)!;
          if (first && e.ev === 'dodged') x.void++;
          if (first && e.ev !== 'dodged') { x.landed++; if (broken || open || exposed) x.clean++; }
          x.dmg += d;
        }
        if (me.combo && me.combo.left <= 0) me.combo = null;
        if (e.hp !== undefined && e.hp <= 0) break;
        // the openings this blow makes (after its own damage): an opener's first blow that lands opens its target; a big action dodged opens its striker
        if (first && e.ev !== 'dodged' && a.role === 'opener') it.openUntil = Math.max(it.openUntil, e.t + R.opener);
        if (first && e.ev === 'dodged' && a.kind !== 'light' && R.whiff) me.openUntil = Math.max(me.openUntil, e.t + R.whiff);
        break;
      }
      case 'break':
        breaks[i]++; me.stunEnd = e.t + (e.dur ?? R.brk.stun * (F[i].gfx?.stun ?? 1)); me.combo = null;
        break;
      case 'interrupt': {
        // `who` cut the action its opponent charged (e.act, the opponent's)
        const c = e.act ? acts[o].get(e.act) : undefined;
        it.charging = null; it.openUntil = Math.max(it.openUntil, e.t + R.interrupt.open);
        if (i === 0) cut++;
        if (o === 0 && c?.kind === 'skill') sk(c.id)!.void++;
        break;
      }
      case 'parry': {
        // `who` parried its opponent's blow (e.act): the striker open, the rest of its enchaînement lost
        const c = e.act ? acts[o].get(e.act) : undefined;
        it.openUntil = Math.max(it.openUntil, e.t + R.parry.open); it.combo = null; it.charging = null;
        if (o === 0 && c?.kind === 'skill') { const x = sk(c.id)!; x.void++; }
        break;
      }
      case 'clash': {
        clashes++;
        me.charging = null; me.combo = null;
        if (!e.beat) { it.charging = null; it.combo = null; }
        // a skill of Ren's that met the other's blow (no beat: both lost) comes to nothing
        const lost = !e.beat ? [[i, e.act], [o, e.vs]] as const : [[i, e.act]] as const;
        for (const [s, id] of lost) if (s === 0) { const x = sk(id); if (x) x.void++; }
        break;
      }
    }
  }
  let foeTop: BoutNote['foeTop'];
  for (const [id, d] of foeDmg) if (d > 0 && (!foeTop || d > foeTop.dmg)) foeTop = { id, dmg: d };
  const won = (r.winner ?? (r.hp[0] / r.maxHp[0] >= r.hp[1] / r.maxHp[1] ? 0 : 1)) === 0;
  const note: BoutNote = { day: meta.day, foe: meta.foe, kind: meta.kind, won, t: r.t, dmg, taken, open: [r.n[0].opened, r.n[1].opened], breaks, inOpen, skills, ...(foeTop ? { foeTop } : {}), clashes, advice: { k: 'keep' } };
  note.advice = adviceOf(note, ren, feint?.id, cut, r.n[0].wasted);
  return note;
}

/** the advice of a note: the first that holds, in this order (a Feint wasted, an exploit spent without an opening, big blows dodged, an opponent's skill that did
 *  the harm, uses left unspent, no opening made; else keep the plan, or rehearse it after a defeat) */
function adviceOf(n: BoutNote, ren: AutoFighter, feint: string | undefined, cut: number, dodged: number): Advice {
  const N = NOTE_RULES, f = feint ? n.skills.find((x) => x.id === feint) : undefined;
  const role = (id: string) => ren.skills.find((a) => a.id === id);
  const isExploit = (id: string) => role(id)?.role === 'exploit', isBlow = (id: string) => { const a = role(id); return !!a && !a.ward && !a.boost && a.role !== 'haste' && a.role !== 'slow' && a.role !== 'load'; };
  if (f && f.used >= N.feintFrom && cut * 2 <= f.used) return { k: 'feint', skill: f.id, ...(n.foeTop ? { foeSkill: n.foeTop.id } : {}), n: f.used - cut, of: f.used };
  for (const x of n.skills) if (isExploit(x.id) && x.landed > 0 && x.clean < x.landed) return { k: 'exploit', skill: x.id, n: x.landed - x.clean, of: x.landed };
  if (dodged >= N.dodged) return { k: 'dodged', n: dodged };
  const hurt = n.taken[0] + n.taken[1] + n.taken[2];
  if (n.foeTop && hurt > 0 && n.foeTop.dmg / hurt >= N.foeShare) return { k: 'foeSkill', foeSkill: n.foeTop.id, pct: Math.round((100 * n.foeTop.dmg) / hurt) };
  for (const x of n.skills) if (isBlow(x.id) && x.max - x.used >= N.unspent) return { k: 'unspent', skill: x.id, n: x.max - x.used };
  if (n.open[0] === 0) return { k: 'noOpen' };
  return { k: n.won ? 'keep' : 'rehearse' };
}


/** a rehearsal's thirty notes summed: the wins, the damage by source, the openings and uses on average, and the advice seen most often (its first bout's numbers,
 *  and in how many bouts it held) */
export interface NoteSum { n: number; wins: number; dmg: [number, number, number]; open: [number, number]; inOpen: number; used: number; max: number; advice: Advice; often: number }
export function sumNotes(notes: readonly BoutNote[]): NoteSum {
  const n = notes.length, dmg: [number, number, number] = [0, 0, 0], open: [number, number] = [0, 0];
  let wins = 0, inOpen = 0, used = 0, max = 0;
  const seen = new Map<AdviceKey, { first: Advice; count: number }>();
  for (const x of notes) {
    if (x.won) wins++;
    for (let k = 0; k < 3; k++) dmg[k] += x.dmg[k];
    open[0] += x.open[0]; open[1] += x.open[1]; inOpen += x.inOpen;
    for (const s of x.skills) { used += s.used; max += s.max; }
    const a = seen.get(x.advice.k); if (a) a.count++; else seen.set(x.advice.k, { first: x.advice, count: 1 });
  }
  // the advice seen most often; on a tie, the earlier of the advice's own order
  const ORDER: AdviceKey[] = ['feint', 'exploit', 'dodged', 'foeSkill', 'unspent', 'noOpen', 'keep', 'rehearse'];
  let best: { first: Advice; count: number } = { first: { k: 'keep' }, count: 0 };
  for (const k of ORDER) { const a = seen.get(k); if (a && a.count > best.count) best = a; }
  return { n, wins, dmg, open: [open[0] / Math.max(1, n), open[1] / Math.max(1, n)], inOpen, used: used / Math.max(1, n), max: max / Math.max(1, n), advice: best.first, often: best.count };
}
