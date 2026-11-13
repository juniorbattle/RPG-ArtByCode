// The final combat workshop's duel (journal Passe CF1, briefs/combat-auto.md § 31): a copy of the game's duel played by the computer (src/combat/auto.ts at
// main 9e2bc1f, Passe SL4) with each mechanism the workshop explores behind a switch of `cfg`. With GAME the copy is the game, event for event
// (identity.mjs proves it on isolated duels and on whole games). Node only; nothing in src/ reads it.
//
// The switches (each off in GAME):
//   ap        'game' the AP of AC-03 (1 at the start, 5 at most, +1 a light attack that lands); 'none' no AP: the skills gated by their cooldowns alone
//             (the operator's words of 13/11/2026: « si les recharges gerent deja l'usage de competences a les PA ne sont plus necessaire »)
//   apMax     the AP's cap with 'game' (5); apReact: AP gained by a guard or a dodge of one's own
//   cd        'game' each action's cooldown as the game built it (DB5-3, A3: 5 × its charge at level 1); 'level' 5 × its charge at its level; 'tiers' three
//             classes (fast / medium / long) by type and power, shorter by level (the operator's « la recharge sera rapide,moyen,longue »)
//   guard     the guard's share taken off (DB5-2: 0.8); guardStat {base, lo, hi}: the share by Defence against Attack (base × 2·Def / (Def + Atk), in [lo, hi])
//   terrain   each offensive skill's ground (TERRAIN): 'punish' ×K on an opponent exposed by its charge, 'pierce' through a ward too, 'finish' ×K on a broken
//             opponent or under a third of its health; a breaker keeps its gaugeK
//   parry     a ward that covers a big blow (a skill or a heavy blow landing on it) adds `parry` blows to the striker's gauge (no counter-blow: AC-07)
//   boost     'game' a boost multiplies every blow for its length; 'next' the boosts of BOOST_NEXT multiply the next offensive action (a skill or the heavy
//             blow) leaving within their window, and are spent by it
//   gearFx    the gear's effects of GEAR_FX on top of its stat points (Ren's gear read from the fighter's `gear`)
//   styles    each rival's tactic by its style (STYLE_TACTIC), the same automatic otherwise
//   power, hp every blow's power ×, every health × (the durations)
//   heavy     'game' the heavy blow when the opponent cannot defend or the AP are full; 'open' only when the opponent cannot defend; 'ready' also as soon as
//             no skill goes (with ap 'none')
//   brute     the model inspired by La Brute (journal Passe CF2, briefs/combat-auto.md § 32), an object of its numbers (BRUTE): each skill a role (`role`:
//             exploit / punish / pierce / breaker / opener / interrupt / ward / parry / haste / slow / load, set by lab.mjs's prep from BRUTE_ROLES), a number
//             of uses per duel (`uses`) and a gap between two uses (its cooldown); a fighter's opening (`openUntil`: neither guard nor dodge, the damage ×
//             open.dmg) made by an opener, an interrupt, a parry or the whiff of a big action dodged; the haste and the slow on the charges; each role its
//             automatic (autoRole); a fighter's style (`x.style`: its guard and dodge ×, its heavy blow 'ready' or 'open')
export const GAME = { ap: 'game', apMax: 5, apReact: 0, cd: 'game', guard: 0.8, guardStat: null, terrain: false, parry: 0, boost: 'game', gearFx: false, styles: false, power: 1, hp: 1, heavy: 'game', tiers: null, cdLevel: 0, terrainK: null, gaugeMul: 1, decay: null, auto: 'game' };

/** the model inspired by La Brute (cfg.brute): its numbers */
export const BRUTE = {
  // uses per duel by level (1 to 5); the gap between two uses of one skill by class (s): fast, medium, long (the operator's « rapide, moyen, long »)
  uses: [1, 2, 2, 3, 3], gap: { R: 8, M: 16, L: 28 },
  // an opening: the damage taken ×, no guard nor dodge; the whiff of a big action dodged opens its striker (s)
  open: { dmg: 1.25 }, whiff: 2.5,
  // the roles' numbers: exploit × in an opening (or a break) and outside; punish × on a fighter charging a big action; an opener's opening (s); an
  // interrupt's opening and the stagger before the interrupted one acts again; a parry's opening of the striker; the haste's and the slow's charges ×; a
  // load's × on the next offensive action
  exploit: { hi: 2, lo: 0.6 }, punish: 1.7, opener: 8, interrupt: { open: 6, stagger: 1 }, parry: { open: 6, dur: 3 }, haste: { k: 0.7, dur: 15 }, slow: { k: 1.4, dur: 12 }, load: { dmg: 2, gauge: 1.5, dur: 15 },
  // every skill's charge × (rare now, they come out faster); a rival's skills' level by stage (the pool, the bracket, the final)
  charge: 0.6, rivalLevel: [1, 2, 3],
  // the light attack's charge × (fewer skills: the light fills the time; RY-1's forty blows a minute kept)
  lightCharge: 1.35,
  // every offensive skill's power × (fewer uses, each heavier)
  usePower: 1.2,
};
/** each skill's role, its gap's class and what it does besides (Ren's catalogue and the rivals' own) */
export const BRUTE_ROLES = {
  t1: { role: 'punish', gap: 'R' }, t2: { role: 'pierce', gap: 'R', pierceWard: true }, t3: { role: 'breaker', gap: 'M', undodge: true }, t4: { role: 'exploit', gap: 'L' },
  d1: { role: 'ward', gap: 'M' }, s1: { role: 'haste', gap: 'L' },
  k_sunder: { role: 'opener', gap: 'M' }, k_feint: { role: 'interrupt', gap: 'R', pierce: true }, k_iron: { role: 'ward', gap: 'M' }, k_parry: { role: 'parry', gap: 'M' },
  k_cry: { role: 'slow', gap: 'L' }, k_focus: { role: 'load', gap: 'L' },
  m_lunge: { role: 'punish', gap: 'R' }, m_tempo: { role: 'haste', gap: 'L' }, m_brace: { role: 'ward', gap: 'M' },
  m_wild: { role: 'breaker', gap: 'M' }, m_grit: { role: 'load', gap: 'L' },
  m_riposte: { role: 'pierce', gap: 'R', pierceWard: true }, m_gild: { role: 'load', gap: 'L' },
  m_shoulder: { role: 'opener', gap: 'M' },
  m_smite: { role: 'exploit', gap: 'L' }, m_aegis: { role: 'ward', gap: 'M' }, m_prayer: { role: 'load', gap: 'L' },
  m_ironfall: { role: 'exploit', gap: 'L' }, m_bulwark: { role: 'ward', gap: 'M' }, m_resolve: { role: 'load', gap: 'L' },
  m_cleave: { role: 'breaker', gap: 'M', undodge: true }, m_roar: { role: 'slow', gap: 'L' }, m_hide: { role: 'ward', gap: 'M' },
};
/** each rival's style under brute: its guard and dodge × (its kit's pieces: a shield, light leathers), its heavy blow ('ready' a brawler's, else when the
 *  opponent cannot defend), the conditions of its skills (by id; 'auto' its role's automatic). Cassius's brace parries. */
export const BRUTE_STYLES = {
  vessa: { dodge: 2, guard: 0.5, tactic: { m_tempo: 'ready', m_lunge: 'auto', m_brace: 'incoming' } },
  tobin: { dodge: 0.8, guard: 0.4, heavy: 'ready', tactic: { m_grit: 'follow', m_wild: 'ready' } },
  cassius: { dodge: 1.3, guard: 1.2, parry: ['m_brace'], tactic: { m_brace: 'incoming', m_riposte: 'auto', m_gild: 'follow' } },
  orla: { dodge: 0.6, guard: 1, heavy: 'ready', tactic: { m_shoulder: 'ready', m_brace: 'incoming' } },
  ilse: { dodge: 0.5, guard: 1.6, tactic: { m_aegis: 'ready', m_smite: 'auto', m_prayer: 'follow' } },
  marek: { dodge: 0.3, guard: 1.3, tactic: { m_resolve: 'follow', m_ironfall: 'auto', m_bulwark: 'incoming' } },
  rhosk: { dodge: 0.3, guard: 0.8, tactic: { m_hide: 'gauge', m_roar: 'ready', m_cleave: 'ready' } },
};

/** each skill's ground with `terrain` (the catalogue's and the rivals' own): punish / pierce / finish; a breaker is its gaugeK */
export const TERRAIN = {
  t1: 'punish', t2: 'pierce', t4: 'finish', k_feint: 'pierce', heavy: null,
  m_lunge: 'punish', m_riposte: 'pierce', m_smite: 'finish', m_ironfall: 'finish',
};
/** the cooldown classes with cd 'tiers' (s at the rhythm ×3, before the level): fast, medium, long */
export const CD_CLASS = {
  heavy: 'R', t1: 'R', k_feint: 'R', k_parry: 'R', t2: 'M', k_sunder: 'M', t3: 'M', d1: 'M', k_iron: 'M', t4: 'L', s1: 'L', k_cry: 'L', k_focus: 'L',
  m_heavy: 'R', m_lunge: 'R', m_riposte: 'M', m_wild: 'M', m_shoulder: 'M', m_smite: 'M', m_ironfall: 'L', m_cleave: 'L',
  m_brace: 'M', m_aegis: 'M', m_bulwark: 'M', m_hide: 'M', m_tempo: 'L', m_grit: 'L', m_gild: 'L', m_prayer: 'L', m_resolve: 'L', m_roar: 'L',
};
/** the boosts that load the next offensive action with boost 'next' (their window, their ×): the others keep their length */
export const BOOST_NEXT = { s1: true, m_resolve: true, m_grit: true };

/** the gear's effects (gearFx), each with its counterpart; `w` the piece's id */
export const GEAR_FX = {
  // the sabre's last cut goes through the guard; its cuts fill the gauge less
  'duelist-sabre': { lastPierce: true, gauge: 0.7 },
  // the imported blade's blows fill the gauge more (×1.1); its light attack charges longer
  'imported-blade': { gauge: 1.1, lightCharge: 1.1 },
  // the padded jack: a guarded blow fills one's gauge as an unguarded one (DB9's ×2 gone)
  'padded-jack': { guardGauge: 1 },
  // the mail: the light blows' damage −20 %; the dodge halved
  'mail-shirt': { lightTaken: 0.8, dodge: 0.5 },
  'knight-hauberk': { lightTaken: 0.8, dodge: 0.5 },
  // the dock leathers: the dodge ×1.3; the guard ×0.85
  'dock-leathers': { dodge: 1.3, guardChance: 0.85 },
  // the iron ring: one's break shorter (−30 %)
  'iron-ring': { stun: 0.7 },
  // the lucky ribbon (its AP without AP): the cooldowns −15 %
  'lucky-ribbon': { cd: 0.85 },
  'champion-token': { cd: 0.9 },
  // the swift boots: the first charge of the duel at once
  'swift-boots': { firstFast: true },
};

/** the rivals' tactics by their style (styles): one condition per skill of their kit, by id ('auto' the automatic's rule) */
export const STYLE_TACTIC = {
  // Vessa, the quick: her lunge when Ren charges a big action, her tempo as soon as ready
  vessa: { m_lunge: 'incoming', m_tempo: 'ready', m_brace: 'auto' },
  // Tobin, the brawler: his grit then his wild blow
  tobin: { m_grit: 'follow', m_wild: 'ready' },
  // Cassius, the duelist: his riposte through Ren's ward, his brace over Ren's big blows
  cassius: { m_riposte: 'warded', m_gild: 'follow', m_brace: 'incoming' },
  // Orla, the shover: her shoulder when Ren's gauge is high
  orla: { m_shoulder: 'foeGauge', m_brace: 'incoming' },
  // Ilse, the paladin: her aegis as soon as ready, her smite to finish
  ilse: { m_aegis: 'ready', m_smite: 'auto', m_prayer: 'follow' },
  // Marek, the hammer: his resolve then his iron fall, at the break
  marek: { m_resolve: 'follow', m_ironfall: 'auto', m_bulwark: 'incoming' },
  // Rhosk, the rock: his hide at his gauge, his cleave as soon as ready
  rhosk: { m_hide: 'gauge', m_roar: 'follow', m_cleave: 'ready' },
};

export function makeSim({ hitFactor, AUTO_RULES, autoFormsOf, autoDraw }) {
  const DRAW = { dodge: 1, guard: 2, start: 3, decide: 4, recoil: 5 };
  const ratio = (a, b) => (2 * a) / Math.max(1e-6, a + b);
  const zero = () => ({ acts: 0, skills: 0, heavies: 0, lights: 0, dodged: 0, guarded: 0, hit: 0, hits: 0, breaks: 0, dmg: 0, dmgBroken: 0, skillDmg: 0, wasted: 0 });
  const active = (e, t) => !!e && e.until > t;
  const offensive = (a) => !a.ward && !a.boost && a.kind === 'skill';
  const strongestOf = (x) => { let best = null; for (const s of x.skills) if (offensive(s) && (s.power ?? 0) > (best?.power ?? -1)) best = s; return best; };
  const brokenFor = (v, a) => v.foe.broken && v.foe.stunEnd - v.t >= v.chargeOf(v.me, a);

  /** the conditions of a tactic line (the game's, and the workshop's: 'warded' the opponent under a ward, 'foeGauge' its gauge past two thirds) */
  function condHolds(c, v, x, s) {
    const { me, foe, t, cfg } = v;
    switch (c) {
      case 'ready': return true;
      case 'broken': return brokenFor(v, s);
      case 'incoming': {
        if (!foe.act || foe.act.kind === 'light') return false;
        const land = t + v.chargeOf(me, s);
        return s.ward ? foe.at > land && foe.at < land + s.ward.dur : foe.at >= land;
      }
      case 'gauge': return v.gauge(me) >= (2 / 3) * v.rules.gauge.max;
      case 'foeGauge': return !foe.broken && v.gauge(foe) >= (2 / 3) * v.rules.gauge.max;
      case 'warded': return active(foe.ward, t + v.chargeOf(me, s));
      case 'open': return brokenFor(v, s) || (foe.openUntil ?? 0) - t >= v.chargeOf(me, s);
      case 'start': return t < 15;
      case 'hurt': return me.hp / me.maxHp < 0.5;
      case 'finish': return foe.hp / foe.maxHp < 1 / 3;
      case 'follow': return cfg.ap === 'none'
        ? x.skills.some((o) => o !== s && offensive(o) && v.usable(o)) || v.usable(x.heavy)
        : x.skills.some((o) => o !== s && offensive(o) && v.usable(o) && me.ap >= (o.ap ?? 0) + (s.ap ?? 0));
      default: return false;
    }
  }
  /** the skill a fighter charges by its tactic (the game's tacticChoice, with ap 'none': no AP to pay, the full-AP rule gone, the cover by a skill ready) */
  function tacticChoice(v, x, conds) {
    const { me, foe, t, cfg } = v, top = strongestOf(x), noAp = cfg.ap === 'none';
    let wardTried = false;
    for (let i = 0; i < x.skills.length; i++) {
      const s = x.skills[i], c = conds?.[i] ?? 'auto';
      if (c === 'never' || !v.usable(s)) continue;
      if (s.ward) {
        if (active(me.ward, t)) continue;
        if (c !== 'auto') { if (condHolds(c, v, x, s)) return s; continue; }
        if (wardTried) continue;
        wardTried = true;
        const foeLeft = foe.act ? foe.at - t : 0, foeBig = !!foe.act && foe.act.kind !== 'light';
        if ((foeBig && foeLeft > v.chargeOf(me, s)) || v.gauge(me) >= (2 / 3) * v.rules.gauge.max) return s;
        if (s.cover && !foe.broken && (noAp ? (cfg.cover !== false && x.skills.some((o) => offensive(o) && v.usable(o))) : x.skills.some((o) => offensive(o) && me.ap >= (s.ap ?? 0) + (o.ap ?? 0)))) return s;
        continue;
      }
      if (s.boost) {
        if (active(me.boost, t)) continue;
        if (c === 'auto') { if (cfg.boost === 'next' && s.next ? condHolds('follow', v, x, s) : true) return s; continue; }
        if (condHolds(c, v, x, s)) return s;
        continue;
      }
      if (c === 'auto' ? cfg.auto === 'ready' || s !== top || brokenFor(v, s) || (cfg.auto === 'final' && autoTerrain(v, x, s)) : condHolds(c, v, x, s)) return s;
    }
    if (noAp) return null;
    return top && (conds?.[x.skills.indexOf(top)] ?? 'auto') === 'auto' && me.ap >= v.rules.ap.max && v.usable(top) ? top : null;
  }
  /** with auto 'final', the strongest offensive also leaves on its own ground (a finisher under a third, a piercer on a ward) */
  function autoTerrain(v, x, s) {
    const g = s.terrain;
    if (g === 'finish') return v.foe.hp / v.foe.maxHp < 1 / 3;
    if (g === 'pierce') return active(v.foe.ward, v.t);
    if (g === 'punish') return condHolds('incoming', v, x, s);
    return false;
  }
  /** brute: a skill's effect still running (a ward up, a haste, the opponent slowed, a load waiting): not raised again */
  function running(v, s) {
    const { me, foe, t } = v;
    if (s.ward) return active(me.ward, t);
    if (s.role === 'haste') return (me.hasteUntil ?? 0) > t;
    if (s.role === 'slow') return (foe.slowUntil ?? 0) > t;
    if (s.role === 'load') return !!me.next && me.next.until > t;
    return false;
  }
  /** brute: an interrupt lands while the opponent still charges a big action (and before it leaves) */
  const interruptible = (v, s) => { const { me, foe, t } = v; if (!foe.act || foe.act.kind === 'light' || foe.combo || foe.broken) return false; const land = t + v.chargeOf(me, s); return foe.at > land; };
  /** brute: each role's automatic (the 'auto' line of a tactic): what a player who knows the roles would set without knowing the rival */
  function autoRole(v, x, s) {
    const { me, foe, t, cfg } = v;
    // cfg.brute.late: past this share of either health, a skill held for its moment leaves anyway (a use never spent is lost); haste and slow wait for theirs
    const L = cfg.brute.late, late = !!L && (foe.hp / foe.maxHp < L || me.hp / me.maxHp < L);
    // cfg.brute.plan 'general': the automatic plays the best single plan measured for every rival (journal Passe CF2): the exploit in an opening or a break (or to
    // finish), the punish as soon as ready, the haste when hurt or at the opponent's break
    if (cfg.brute.plan === 'general') switch (s.role) {
      case 'exploit': return condHolds('open', v, x, s) || foe.hp / foe.maxHp < 0.25 || (!!L && me.hp / me.maxHp < L * 0.6);
      case 'punish': return true;
      // cfg.brute.hasteRule 'hurt': the haste when hurt alone (lot 1, journal Passe BL1: the opponent's break left out)
      case 'haste': return cfg.brute.hasteRule === 'hurt' ? me.hp / me.maxHp < 0.5 : brokenFor(v, s) || me.hp / me.maxHp < 0.5;
      case 'slow': return condHolds('incoming', v, x, s) || late;
      default: break;
    }
    if (L) switch (s.role) {
      case 'exploit': return condHolds('open', v, x, s) || condHolds('incoming', v, x, s) || late;
      case 'punish': return condHolds('incoming', v, x, s) || late;
      case 'haste': return brokenFor(v, s) || me.hp / me.maxHp < 0.5 || late;
      case 'slow': return condHolds('incoming', v, x, s) || late;
      case 'load': return condHolds('follow', v, x, s);
      default: break;
    }
    switch (s.role) {
      case 'exploit': return condHolds('open', v, x, s) || condHolds('incoming', v, x, s) || foe.hp / foe.maxHp < 0.25;
      case 'punish': return condHolds('incoming', v, x, s);
      case 'opener': return x.skills.some((o) => o !== s && (o.role === 'exploit' || o.role === 'load') && v.usable(o)) || v.usable(x.heavy) || !x.skills.some((o) => o.role === 'exploit');
      case 'interrupt': return interruptible(v, s);
      case 'parry': return condHolds('incoming', v, x, s);
      case 'ward': {
        const foeLeft = foe.act ? foe.at - t : 0, foeBig = !!foe.act && foe.act.kind !== 'light';
        return (foeBig && foeLeft > v.chargeOf(me, s)) || v.gauge(me) >= (2 / 3) * v.rules.gauge.max;
      }
      case 'load': return condHolds('follow', v, x, s);
      default: return true; // pierce, breaker, haste, slow: as soon as ready
    }
  }
  /** brute: the skill a fighter charges by its tactic (one condition per skill, in its order) */
  function bruteChoice(v, x, conds) {
    for (let i = 0; i < x.skills.length; i++) {
      const s = x.skills[i], c = conds?.[i] ?? 'auto';
      if (c === 'never' || !v.usable(s) || running(v, s)) continue;
      if (c === 'auto' ? autoRole(v, x, s) : condHolds(c, v, x, s)) return s;
    }
    return null;
  }
  function heavyWhen(v, x) {
    const { me, foe, t, cfg } = v;
    if (!v.usable(x.heavy)) return false;
    const tc = v.chargeOf(me, x.heavy), land = t + tc;
    if (foe.broken && foe.stunEnd - t >= tc) return true;
    if (foe.act && foe.act.kind !== 'light' && foe.at >= land) return true;
    if (cfg.brute) return (foe.openUntil ?? 0) - t >= tc || me.x.style?.heavy === 'ready';
    if (cfg.heavy === 'open') return false;
    if (cfg.heavy === 'ready' || cfg.ap === 'none') return cfg.heavy === 'ready';
    return me.ap >= v.rules.ap.max;
  }
  const autoDecider = (v, x) => (v.cfg.brute ? bruteChoice(v, x, x.tactic) : tacticChoice(v, x, x.tactic)) ?? (heavyWhen(v, x) ? x.heavy : x.light);

  /**
   * One duel (the game's autoDuel, the same signature) under `cfg`. `o.deciders` replaces a brain's automatic, `o.commands` the hand.
   */
  function duel(A, B, seed, o = {}, cfg = GAME) {
    const R = o.rules ?? AUTO_RULES, s0 = seed >>> 0 || 1, log = o.log ? [] : null;
    const decay = cfg.decay ?? R.gauge.decay;
    const put = (e) => { if (o.trace) e.s = [F[0].ap, +gaugeNow(F[0]).toFixed(2), F[1].ap, +gaugeNow(F[1]).toFixed(2)]; log.push(e); };
    const mk = (x, i) => {
      const hp = Math.round(x.hp * R.hpScale * (cfg.hp ?? 1));
      return { i, x, hp, maxHp: hp, ap: R.ap.start + (x.apStart ?? 0), g: 0, gT: 0, broken: false, stunEnd: 0, cd: {}, ward: null, boost: null, act: null, at: 0, pending: false, combo: null, comboAt: 0, form: 1, n: zero(), dec: 0, gfx: gearOf(x, cfg), next: null, used: {}, openUntil: 0, hasteUntil: 0, slowUntil: 0 };
    };
    const F = [mk(A, 0), mk(B, 1)];
    { const fm = o.forms ?? autoFormsOf(s0, R); F[0].form = fm[0]; F[1].form = fm[1]; }
    const other = (f) => (f === F[0] ? F[1] : F[0]);
    const speed = (f) => f.x.tempo / Math.max(1, f.x.viv);
    let t = 0, over = false, winner = null, finisher = null, leadChanges = 0, lastLead = 0;
    const T = () => +t.toFixed(2);
    const gaugeNow = (f) => (f.broken ? R.gauge.max : Math.max(0, f.g - decay * (t - f.gT)));
    const settle = (f) => {
      if (f.broken && t >= f.stunEnd) { f.broken = false; f.g = 0; f.gT = f.stunEnd; }
      f.g = gaugeNow(f); f.gT = t;
    };
    const noAp = cfg.ap === 'none', apMax = cfg.ap === 'game' ? cfg.apMax ?? R.ap.max : R.ap.max;
    // cfg.charges k: a skill keeps up to k uses ready, recharged one at a time (the 'full' clock: one more use ready each cooldown; at the start one ready)
    const K = cfg.charges ?? 1;
    // cfg.breath G: after a skill leaves its charge, no other skill of that fighter before G s (a shared breath: the skills compete for the moments)
    const BR = cfg.brute;
    const usable = (f, a) => (!BR || a.kind !== 'skill' || (f.used[a.id] ?? 0) < (a.uses ?? Infinity)) && (noAp || (a.ap ?? 0) <= f.ap) && (!cfg.breath || a.kind !== 'skill' || (f.breathAt ?? -1e9) <= t + 1e-9) && (!a.cooldown || (K > 1 && a.kind === 'skill' ? (f.cd[a.id] ?? (K - 1) * a.cooldown * (f.gfx.cd ?? 1)) - t <= (K - 1) * a.cooldown * (f.gfx.cd ?? 1) + 1e-9 : (f.cd[a.id] ?? 0) <= t + 1e-9));
    const view = (f) => { let c = 0; const d = f.dec; return { t, me: f, foe: other(f), rules: R, cfg, usable: (a) => usable(f, a), gauge: gaugeNow, chargeOf: (g, a) => chargeFor(g, a), rand: () => autoDraw(s0, f.i, d, c++, DRAW.decide) }; };
    const chargeFor = (f, a) => a.charge * speed(f) * (a.kind === 'light' ? (f.gfx.lightCharge ?? 1) * (BR?.lightCharge ?? 1) : 1) * (BR ? (f.hasteUntil > t ? BR.haste.k : 1) * (f.slowUntil > t ? BR.slow.k : 1) : 1);
    const cmds = [...(o.commands ?? [])].sort((a, b) => a.t - b.t);
    let cmdDone = -1;
    const pressed = (f) => {
      if (f.i !== 0 || !cmds.length) return null;
      let k = -1;
      for (let j = 0; j < cmds.length && cmds[j].t <= t + 1e-9; j++) k = j;
      if (k <= cmdDone) return null;
      const a = f.x.skills.find((s) => s.id === cmds[k].skill);
      if (!a) { cmdDone = k; return null; }
      if (!usable(f, a)) return heavyWhen(view(f), f.x) ? f.x.heavy : f.x.light;
      cmdDone = k; return a;
    };
    const decide = (f) => { const p = pressed(f), a = p ?? (o.deciders?.[f.x.brain] ?? autoDecider)(view(f), f.x); f.dec++; return a; };

    function start(f, a) {
      settle(f);
      if (a.ap && !noAp) f.ap -= a.ap;
      if (BR && a.kind === 'skill') f.used[a.id] = (f.used[a.id] ?? 0) + 1;
      if (cfg.breath && a.kind === 'skill') f.breathAt = t + cfg.breath;
      if (a.cooldown) { const C = a.cooldown * (f.gfx.cd ?? 1); f.cd[a.id] = K > 1 && a.kind === 'skill' ? Math.max(f.cd[a.id] ?? (K - 1) * C, t) + C : t + C; }
      let ch = chargeFor(f, a);
      if (f.gfx.firstFast && f.n.acts === 0) ch = 0;
      f.act = a; f.at = t + ch; f.n.acts++;
      if (a.kind === 'light') f.n.lights++; else if (a.kind === 'heavy') f.n.heavies++; else f.n.skills++;
      log && put({ t: T(), who: f.x.id, ev: 'charge', act: a.id, at: +f.at.toFixed(2) });
    }
    function land(f) {
      const a = f.act; f.act = null;
      settle(f); settle(other(f));
      if (BR && (a.role === 'haste' || a.role === 'slow' || a.role === 'load')) {
        if (a.role === 'haste') f.hasteUntil = t + BR.haste.dur;
        else if (a.role === 'slow') other(f).slowUntil = t + BR.slow.dur;
        else f.next = { until: t + BR.load.dur, dmg: BR.load.dmg, gauge: BR.load.gauge };
        log && put({ t: T(), who: f.x.id, ev: 'boost', act: a.id }); return false;
      }
      if (a.ward) { f.ward = { until: t + a.ward.dur, dmg: a.ward.dmg, gauge: a.ward.gauge, parry: a.parry, bparry: BR && a.role === 'parry' }; log && put({ t: T(), who: f.x.id, ev: 'ward', act: a.id }); return false; }
      if (a.boost) {
        if (cfg.boost === 'next' && a.next) f.next = { until: t + a.boost.dur, dmg: a.boost.dmg, gauge: a.boost.gauge };
        else f.boost = { until: t + a.boost.dur, dmg: a.boost.dmg, gauge: a.boost.gauge };
        log && put({ t: T(), who: f.x.id, ev: 'boost', act: a.id }); return false;
      }
      // brute, cfg.brute.clash (lot 1, the operator's BL1-8, journal Passe BL1): the opponent's blow leaves within w s of this one. Two of the same weight
      // clash (no damage, both spent, each back after its recoil and its own keyed draw); a big action against a light attack goes through, the light one lost
      const CL = BR && BR.clash, g = other(f), ga = g.act;
      if (CL && !g.broken && ga && !g.combo && !ga.ward && !ga.boost && ga.role !== 'haste' && ga.role !== 'slow' && ga.role !== 'load' && (ga.power ?? 0) > 0 && g.at - t <= CL.w + 1e-9) {
        const big = a.kind !== 'light', gBig = ga.kind !== 'light';
        const back = (s) => { s.pending = true; s.at = t + CL.recoil + CL.spread * autoDraw(s0, s.i, s.n.acts, 0, DRAW.recoil); };
        if (big === gBig) { g.act = null; back(g); back(f); log && put({ t: T(), who: f.x.id, ev: 'clash', act: a.id, vs: ga.id }); return false; }
        if (big) { g.act = null; back(g); log && put({ t: T(), who: g.x.id, ev: 'clash', act: ga.id, beat: a.id }); }
        else { back(f); log && put({ t: T(), who: f.x.id, ev: 'clash', act: a.id, beat: ga.id }); return false; }
      }
      // a loaded boost ('next'): spent by the first offensive action that leaves in its window
      let load = null;
      if (f.next && a.kind !== 'light') { if (f.next.until > t) load = f.next; f.next = null; }
      f.combo = { a, hits: a.hits ?? [1], i: 0, ap: false, k: f.n.acts, load };
      hitOnce(f);
      if (over || !f.combo) return false;
      if (f.combo.i < f.combo.hits.length) { f.comboAt = t + (a.gap ?? 0.3); return true; }
      f.combo = null; return false;
    }
    function hitOnce(f) {
      const c = f.combo, a = c.a, share = c.hits[c.i], g = other(f); c.i++;
      settle(g);
      const exposed = R.exposed && ((!!g.act && g.act.kind !== 'light') || !!g.combo);
      const lastPierce = f.gfx.lastPierce && a.kind === 'light' && c.i === c.hits.length;
      const open = !!BR && g.openUntil > t, st = BR ? g.x.style ?? {} : {};
      let res = 'hit';
      if (!g.broken && !exposed && !open) {
        if (!(BR && a.undodge) && autoDraw(s0, f.i, c.k, c.i, DRAW.dodge) < R.react.dodge * ratio(g.x.viv, f.x.viv) * (g.gfx.dodge ?? 1) * (st.dodge ?? 1)) res = 'dodged';
        else if (!a.pierce && !lastPierce && autoDraw(s0, f.i, c.k, c.i, DRAW.guard) < Math.min(R.react.cap, R.react.guard * ratio(g.x.def, f.x.atk) * (a.kind === 'light' ? 1 : R.react.skillGuard) * (g.gfx.guardChance ?? 1) * (st.guard ?? 1))) res = 'guarded';
      }
      if (res === 'dodged') {
        g.n.dodged++; if (a.kind !== 'light') f.n.wasted++; if (cfg.apReact && !noAp) g.ap = Math.min(apMax, g.ap + cfg.apReact);
        // brute: a big action dodged leaves its striker open (the whiff)
        if (BR && a.kind !== 'light' && c.i === 1 && BR.whiff) { f.openUntil = Math.max(f.openUntil, t + BR.whiff); g.n.opened = (g.n.opened ?? 0) + 1; }
        log && put({ t: T(), who: f.x.id, ev: 'dodged', act: a.id }); return;
      }
      const wardOn = !!g.ward && g.ward.until > t, boostOn = !!f.boost && f.boost.until > t;
      // brute: a parry (a ward of the parry role) takes a big blow and leaves its striker open, the rest of its enchaînement lost (no counter-blow: AC-07)
      if (BR && wardOn && g.ward.bparry && a.kind !== 'light' && c.i === 1) {
        f.openUntil = Math.max(f.openUntil, t + BR.parry.open); c.i = c.hits.length; g.n.parried = (g.n.parried ?? 0) + 1; g.n.opened = (g.n.opened ?? 0) + 1;
        log && put({ t: T(), who: g.x.id, ev: 'parry', act: a.id }); return;
      }
      const red = cfg.guardStat ? Math.min(cfg.guardStat.hi, Math.max(cfg.guardStat.lo, cfg.guardStat.base * ratio(g.x.def, f.x.atk))) : cfg.guard ?? R.guardReduce;
      let k = hitFactor(f.x.atk, g.x.def) * (res === 'guarded' ? 1 - red : 1) * (g.x.taken ?? 1) * f.form * (cfg.power ?? 1);
      if (boostOn) k *= f.boost.dmg;
      if (c.load) k *= c.load.dmg;
      if (wardOn) k *= a.terrain === 'pierce' && cfg.terrain ? 1 - (1 - g.ward.dmg) * (cfg.terrainK?.pierceWard ?? 0.5) : g.ward.dmg;
      if (g.broken) k *= R.brk.dmg;
      if (cfg.terrain && a.terrain) {
        const TK = cfg.terrainK ?? {};
        if (a.terrain === 'punish' && exposed) k *= TK.punish ?? 1.5;
        if (a.terrain === 'finish' && (g.broken || g.hp / g.maxHp < 1 / 3)) k *= TK.finish ?? 1.5;
      }
      if (BR) {
        if (open) k *= BR.open.dmg;
        if (a.role === 'exploit') k *= open || g.broken || exposed ? BR.exploit.hi : BR.exploit.lo;
        if (a.role === 'punish' && exposed) k *= BR.punish;
        if (wardOn && a.pierceWard) k /= g.ward.dmg;
      }
      if (a.kind === 'light' && g.gfx.lightTaken) k *= g.gfx.lightTaken;
      const dmg = Math.max(1, Math.round((a.power ?? 0) * share * k));
      g.hp = Math.max(0, g.hp - dmg); f.n.dmg += dmg; if (g.broken) f.n.dmgBroken += dmg; if (a.kind !== 'light') f.n.skillDmg += dmg;
      if (res === 'guarded') { g.n.guarded++; if (cfg.apReact && !noAp) g.ap = Math.min(apMax, g.ap + cfg.apReact); } else g.n.hit++;
      f.n.hits++;
      if (a.kind === 'light' && !c.ap) { c.ap = true; f.ap = Math.min(apMax, f.ap + R.ap.light); }
      log && put({ t: T(), who: f.x.id, ev: res, act: a.id, dmg, hp: g.hp, hit: c.i, ...(o.trace ? { fx: (wardOn ? 1 : 0) | (boostOn ? 2 : 0) } : {}) });
      if (g.hp <= 0) { over = true; winner = f === F[0] ? 0 : 1; finisher = a.kind; return; }
      // brute: an opener leaves the opponent open; an interrupt cancels the big action it charges (its use spent), staggers and opens it
      if (BR && c.i === 1 && a.role === 'opener') { g.openUntil = Math.max(g.openUntil, t + BR.opener); f.n.opened = (f.n.opened ?? 0) + 1; }
      if (BR && c.i === 1 && a.role === 'interrupt' && g.act && g.act.kind !== 'light' && !g.combo && !g.broken) {
        log && put({ t: T(), who: f.x.id, ev: 'interrupt', act: g.act.id });
        g.act = null; g.pending = true; g.at = t + BR.interrupt.stagger; g.openUntil = Math.max(g.openUntil, t + BR.interrupt.open); f.n.interrupts = (f.n.interrupts ?? 0) + 1; f.n.opened = (f.n.opened ?? 0) + 1;
      }
      // a parry: a big blow landing on a ward that parries fills the striker's gauge
      if (cfg.parry && wardOn && g.ward.parry && a.kind !== 'light' && c.i === 1 && !f.broken) addGauge(f, cfg.parry * (R.gauge.max / R.gauge.blows) * (10 / Math.max(1, f.x.end)));
      if (!g.broken) {
        const gm = res === 'guarded' ? g.gfx.guardGauge ?? R.gauge.guardMul : 1;
        const add = (R.gauge.max / R.gauge.blows) * (a.gauge ?? 0) * (a.kind === 'light' ? 1 : share) * (10 / Math.max(1, g.x.end)) * gm * (boostOn ? f.boost.gauge : 1) * (c.load ? c.load.gauge : 1) * (wardOn ? g.ward.gauge : 1) * (f.gfx.gauge ?? 1) * (cfg.gaugeMul ?? 1);
        addGauge(g, add);
      }
    }
    function addGauge(g, add) {
      g.g = Math.min(R.gauge.max, gaugeNow(g) + add); g.gT = t;
      if (g.g >= R.gauge.max) {
        const stun = R.brk.stun * (g.gfx.stun ?? 1);
        g.broken = true; g.stunEnd = t + stun; g.n.breaks++;
        if (g.act) g.at += stun;
        if (g.combo) { g.combo = null; g.pending = true; g.at = g.stunEnd; }
        log && put({ t: T(), who: g.x.id, ev: 'break' });
      }
    }
    const after = (f) => { if (f.broken) { f.pending = true; f.at = f.stunEnd; } else if (f.pending && f.at > t + 1e-9) return; else start(f, decide(f)); };
    const leadNow = () => { const ld = Math.sign(F[0].hp / F[0].maxHp - F[1].hp / F[1].maxHp); if (ld && lastLead && ld !== lastLead) leadChanges++; if (ld) lastLead = ld; };

    for (const f of F) { f.at = autoDraw(s0, f.i, 0, 0, DRAW.start) * R.start; f.pending = true; }
    while (!over) {
      let next = F[0], nt = Infinity;
      for (const f of F) { const ft = f.combo ? f.comboAt : f.pending ? Math.max(f.at, f.broken ? f.stunEnd : 0) : f.at; if (ft < nt - 1e-12) { nt = ft; next = f; } }
      t = nt;
      if (t > R.maxT) break;
      if (next.combo) {
        hitOnce(next); if (over) break; leadNow();
        if (next.combo && next.combo.i < next.combo.hits.length) { next.comboAt = t + (next.combo.a.gap ?? 0.3); continue; }
        if (next.combo) { next.combo = null; after(next); }
        continue;
      }
      if (next.pending) { next.pending = false; settle(next); start(next, decide(next)); continue; }
      const inCombo = land(next);
      if (over) break;
      leadNow();
      if (!inCombo) after(next);
    }
    return { winner, finisher, t: T(), hp: [F[0].hp, F[1].hp], maxHp: [F[0].maxHp, F[1].maxHp], form: [F[0].form, F[1].form], n: [F[0].n, F[1].n], leadChanges, log };
  }
  /** the gear's effects a fighter wears (gearFx: Ren's `gear`), merged */
  function gearOf(x, cfg) {
    const out = {};
    if (!cfg.gearFx || !x.gear) return out;
    const G = cfg.gearTable || GEAR_FX;
    for (const id of [x.gear.weapon, x.gear.armour, ...(x.gear.acc ?? [])]) {
      const e = id && G[id];
      if (!e) continue;
      for (const [k, v] of Object.entries(e)) out[k] = typeof v === 'number' && typeof out[k] === 'number' ? out[k] * v : v;
    }
    return out;
  }
  return { duel, autoDecider, tacticChoice, bruteChoice, autoRole, heavyWhen, condHolds, strongestOf, offensive, brokenFor };
}
