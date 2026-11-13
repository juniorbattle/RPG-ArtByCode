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
export const GAME = { ap: 'game', apMax: 5, apReact: 0, cd: 'game', guard: 0.8, guardStat: null, terrain: false, parry: 0, boost: 'game', gearFx: false, styles: false, power: 1, hp: 1, heavy: 'game', tiers: null, cdLevel: 0, terrainK: null, gaugeMul: 1, decay: null, auto: 'game' };

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
  const DRAW = { dodge: 1, guard: 2, start: 3, decide: 4 };
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
  function heavyWhen(v, x) {
    const { me, foe, t, cfg } = v;
    if (!v.usable(x.heavy)) return false;
    const tc = v.chargeOf(me, x.heavy), land = t + tc;
    if (foe.broken && foe.stunEnd - t >= tc) return true;
    if (foe.act && foe.act.kind !== 'light' && foe.at >= land) return true;
    if (cfg.heavy === 'open') return false;
    if (cfg.heavy === 'ready' || cfg.ap === 'none') return cfg.heavy === 'ready';
    return me.ap >= v.rules.ap.max;
  }
  const autoDecider = (v, x) => tacticChoice(v, x, x.tactic) ?? (heavyWhen(v, x) ? x.heavy : x.light);

  /**
   * One duel (the game's autoDuel, the same signature) under `cfg`. `o.deciders` replaces a brain's automatic, `o.commands` the hand.
   */
  function duel(A, B, seed, o = {}, cfg = GAME) {
    const R = o.rules ?? AUTO_RULES, s0 = seed >>> 0 || 1, log = o.log ? [] : null;
    const decay = cfg.decay ?? R.gauge.decay;
    const put = (e) => { if (o.trace) e.s = [F[0].ap, +gaugeNow(F[0]).toFixed(2), F[1].ap, +gaugeNow(F[1]).toFixed(2)]; log.push(e); };
    const mk = (x, i) => {
      const hp = Math.round(x.hp * R.hpScale * (cfg.hp ?? 1));
      return { i, x, hp, maxHp: hp, ap: R.ap.start + (x.apStart ?? 0), g: 0, gT: 0, broken: false, stunEnd: 0, cd: {}, ward: null, boost: null, act: null, at: 0, pending: false, combo: null, comboAt: 0, form: 1, n: zero(), dec: 0, gfx: gearOf(x, cfg), next: null };
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
    const usable = (f, a) => (noAp || (a.ap ?? 0) <= f.ap) && (!cfg.breath || a.kind !== 'skill' || (f.breathAt ?? -1e9) <= t + 1e-9) && (!a.cooldown || (K > 1 && a.kind === 'skill' ? (f.cd[a.id] ?? (K - 1) * a.cooldown * (f.gfx.cd ?? 1)) - t <= (K - 1) * a.cooldown * (f.gfx.cd ?? 1) + 1e-9 : (f.cd[a.id] ?? 0) <= t + 1e-9));
    const view = (f) => { let c = 0; const d = f.dec; return { t, me: f, foe: other(f), rules: R, cfg, usable: (a) => usable(f, a), gauge: gaugeNow, chargeOf: (g, a) => chargeFor(g, a), rand: () => autoDraw(s0, f.i, d, c++, DRAW.decide) }; };
    const chargeFor = (f, a) => a.charge * speed(f) * (a.kind === 'light' ? f.gfx.lightCharge ?? 1 : 1);
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
      if (a.ward) { f.ward = { until: t + a.ward.dur, dmg: a.ward.dmg, gauge: a.ward.gauge, parry: a.parry }; log && put({ t: T(), who: f.x.id, ev: 'ward', act: a.id }); return false; }
      if (a.boost) {
        if (cfg.boost === 'next' && a.next) f.next = { until: t + a.boost.dur, dmg: a.boost.dmg, gauge: a.boost.gauge };
        else f.boost = { until: t + a.boost.dur, dmg: a.boost.dmg, gauge: a.boost.gauge };
        log && put({ t: T(), who: f.x.id, ev: 'boost', act: a.id }); return false;
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
      let res = 'hit';
      if (!g.broken && !exposed) {
        if (autoDraw(s0, f.i, c.k, c.i, DRAW.dodge) < R.react.dodge * ratio(g.x.viv, f.x.viv) * (g.gfx.dodge ?? 1)) res = 'dodged';
        else if (!a.pierce && !lastPierce && autoDraw(s0, f.i, c.k, c.i, DRAW.guard) < Math.min(R.react.cap, R.react.guard * ratio(g.x.def, f.x.atk) * (a.kind === 'light' ? 1 : R.react.skillGuard) * (g.gfx.guardChance ?? 1))) res = 'guarded';
      }
      if (res === 'dodged') { g.n.dodged++; if (a.kind !== 'light') f.n.wasted++; if (cfg.apReact && !noAp) g.ap = Math.min(apMax, g.ap + cfg.apReact); log && put({ t: T(), who: f.x.id, ev: 'dodged', act: a.id }); return; }
      const wardOn = !!g.ward && g.ward.until > t, boostOn = !!f.boost && f.boost.until > t;
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
      if (a.kind === 'light' && g.gfx.lightTaken) k *= g.gfx.lightTaken;
      const dmg = Math.max(1, Math.round((a.power ?? 0) * share * k));
      g.hp = Math.max(0, g.hp - dmg); f.n.dmg += dmg; if (g.broken) f.n.dmgBroken += dmg; if (a.kind !== 'light') f.n.skillDmg += dmg;
      if (res === 'guarded') { g.n.guarded++; if (cfg.apReact && !noAp) g.ap = Math.min(apMax, g.ap + cfg.apReact); } else g.n.hit++;
      f.n.hits++;
      if (a.kind === 'light' && !c.ap) { c.ap = true; f.ap = Math.min(apMax, f.ap + R.ap.light); }
      log && put({ t: T(), who: f.x.id, ev: res, act: a.id, dmg, hp: g.hp, hit: c.i, ...(o.trace ? { fx: (wardOn ? 1 : 0) | (boostOn ? 2 : 0) } : {}) });
      if (g.hp <= 0) { over = true; winner = f === F[0] ? 0 : 1; finisher = a.kind; return; }
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
    const after = (f) => { if (f.broken) { f.pending = true; f.at = f.stunEnd; } else start(f, decide(f)); };
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
  return { duel, autoDecider, tacticChoice, heavyWhen, condHolds, strongestOf, offensive, brokenFor };
}
