// The laboratory's copy of the duel played by the computer (src/combat/auto.ts, autoDuel), for the second workshop (the same rules for Ren and the rivals;
// the skills automatic, by hand or by gambits). Not the game: nothing in src/ reads it. Two differences from the game's, each a switch:
//  - `streams: 'one'` draws everything from the duel's one Rng, as the game does (the same duel, event for event: `identity`); `streams: 'split'` gives each
//    draw its own key: a reaction by (the striker, its action's rank, the hit's rank), the initiative by the side, a decision's draw by (the side, the
//    decision's rank, the call's rank): a choice changes only what follows from it;
//  - `o.commands` (by hand) and the deciders receive the view with `log` and the fighter's index, so a gambit or a command can read the timeline.
// Everything else is the game's: the timeline, the charge, the enchaînements, the AP, the cooldowns, the reactions, the gauge, the break, the form of the day.

/** a hash of five numbers to [0, 1) (mulberry-like finaliser over a mixed key) */
export function h5(a, b, c, d, e) {
  let x = (a >>> 0) ^ Math.imul(b + 0x9e37, 0x85ebca6b) ^ Math.imul(c + 0x7f4a, 0xc2b2ae35) ^ Math.imul(d + 0x165667b1, 0x27d4eb2f) ^ Math.imul(e + 0x3c6ef372, 0x9e3779b1);
  x = Math.imul(x ^ (x >>> 16), 0x85ebca6b); x = Math.imul(x ^ (x >>> 13), 0xc2b2ae35); x ^= x >>> 16;
  let t = (x + 0x6d2b79f5) >>> 0; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// `gaugeHit` (optional): a hit's gauge by the game's rule since the operator's RY-3 (journal Passe SL3, src/combat/auto.ts autoGaugeHit); without it, the workshop's
export function makeSim({ Rng, hitFactor, AUTO_RULES, autoFormsOf, gaugeHit }) {
  const ratio = (a, b) => (2 * a) / Math.max(1e-6, a + b);
  const zero = () => ({ acts: 0, skills: 0, lights: 0, heavies: 0, dodged: 0, guarded: 0, hit: 0, hits: 0, breaks: 0, dmg: 0, dmgBroken: 0, skillDmg: 0, wasted: 0, apWasted: 0, dmgExposed: 0 });

  /** one duel; `o.deciders` [deciderOfA, deciderOfB] (each (view, fighter) => action); `o.rules`; `o.streams`; `o.log` */
  function duel(A, B, seed, o = {}) {
    const R = o.rules ?? AUTO_RULES, s0 = seed >>> 0 || 1, split = o.streams === 'split', rng = new Rng(s0), log = o.log ? [] : null;
    const one = () => rng.next();
    const put = (e) => { if (o.trace) e.s = [F[0].ap, +gaugeNow(F[0]).toFixed(2), F[1].ap, +gaugeNow(F[1]).toFixed(2)]; log.push(e); };
    const mk = (x, i) => { const hp = Math.round(x.hp * R.hpScale); return { i, x, hp, maxHp: hp, ap: R.ap.start + (x.apStart ?? 0), g: 0, gT: 0, broken: false, stunEnd: 0, cd: {}, ward: null, boost: null, act: null, at: 0, pending: false, combo: null, comboAt: 0, form: 1, n: zero(), dec: 0 }; };
    const F = [mk(A, 0), mk(B, 1)];
    { const fm = autoFormsOf(s0, R); F[0].form = fm[0]; F[1].form = fm[1]; }
    const other = (f) => (f === F[0] ? F[1] : F[0]);
    const speed = (f) => f.x.tempo / Math.max(1, f.x.viv);
    let t = 0, over = false, winner = null, finisher = null, leadChanges = 0, lastLead = 0;
    const T = () => +t.toFixed(2);
    const gaugeNow = (f) => (f.broken ? R.gauge.max : Math.max(0, f.g - R.gauge.decay * (t - f.gT)));
    const settle = (f) => { if (f.broken && t >= f.stunEnd) { f.broken = false; f.g = 0; f.gT = f.stunEnd; } f.g = gaugeNow(f); f.gT = t; };
    const usable = (f, a) => (a.ap ?? 0) <= f.ap && (!a.cooldown || (f.cd[a.id] ?? 0) <= t + 1e-9);
    // a decision's own draws (the rivals' old AI): split, by (side, decision's rank, call's rank)
    // (with `o.salt`, a decision taken after the lookahead's choice draws from the other key too: the rivals' future choices stay unknown)
    const view = (f) => { let c = 0; const d = f.dec, ds = o.salt && t > o.salt.t + 1e-9 ? (s0 ^ o.salt.v) >>> 0 : s0; return { t, me: f, foe: other(f), rules: R, log, usable: (a) => usable(f, a), gauge: gaugeNow, chargeOf: (g, a) => a.charge * speed(g), rand: split ? () => h5(ds, f.i, d, c++, 4) : one }; };
    const decide = (f) => { const a = o.deciders[f.i](view(f), f.x); f.dec++; return a; };

    function start(f, a) {
      settle(f);
      if (a.ap) f.ap -= a.ap;
      if (a.cooldown) f.cd[a.id] = t + a.cooldown;
      f.act = a; f.at = t + a.charge * speed(f); f.n.acts++;
      if (a.kind === 'light') f.n.lights++; else if (a.base === 'heavy') f.n.heavies++; else f.n.skills++;
      log && put({ t: T(), who: f.x.id, ev: 'charge', act: a.id, at: +f.at.toFixed(2) });
    }
    function land(f) {
      const a = f.act; f.act = null;
      settle(f); settle(other(f));
      if (a.ward) { f.ward = { until: t + a.ward.dur, dmg: a.ward.dmg, gauge: a.ward.gauge }; log && put({ t: T(), who: f.x.id, ev: 'ward', act: a.id }); return false; }
      if (a.boost) { f.boost = { until: t + a.boost.dur, dmg: a.boost.dmg, gauge: a.boost.gauge }; log && put({ t: T(), who: f.x.id, ev: 'boost', act: a.id }); return false; }
      f.combo = { a, hits: a.hits ?? [1], i: 0, ap: false, k: f.n.acts };
      hitOnce(f);
      if (over || !f.combo) return false;
      if (f.combo.i < f.combo.hits.length) { f.comboAt = t + (a.gap ?? 0.3); return true; }
      f.combo = null; return false;
    }
    function hitOnce(f) {
      const c = f.combo, a = c.a, share = c.hits[c.i], g = other(f); c.i++;
      settle(g);
      const exposed = R.exposed && ((!!g.act && g.act.kind !== 'light') || !!g.combo);
      // `o.salt` (the lookahead's expectation): the draws of the actions after a rank come from another key, unknown to the one who decides
      const ks = o.salt && c.k > o.salt.from[f.i] ? (s0 ^ o.salt.v) >>> 0 : s0;
      const r1 = split ? () => h5(ks, f.i, c.k, c.i, 1) : one, r2 = split ? () => h5(ks, f.i, c.k, c.i, 2) : one;
      let res = 'hit';
      if (!g.broken && !exposed) {
        if (r1() < R.react.dodge * ratio(g.x.viv, f.x.viv) + (g.x.dodgeBonus ?? 0)) res = 'dodged';
        else if (!a.pierce && r2() < Math.min(R.react.cap, R.react.guard * ratio(g.x.def, f.x.atk) * (a.kind === 'light' ? 1 : R.react.skillGuard) + (g.x.guardBonus ?? 0))) res = 'guarded';
      }
      if (res === 'dodged') { g.n.dodged++; if (a.kind !== 'light') f.n.wasted++; log && put({ t: T(), who: f.x.id, ev: 'dodged', act: a.id }); return; }
      const wardOn = !!g.ward && g.ward.until > t, boostOn = !!f.boost && f.boost.until > t;
      let k = hitFactor(f.x.atk, g.x.def) * (res === 'guarded' ? 1 - R.guardReduce : 1) * (g.x.taken ?? 1) * f.form;
      if (boostOn) k *= f.boost.dmg;
      if (wardOn) k *= g.ward.dmg;
      if (g.broken) k *= R.brk.dmg;
      const dmg = Math.max(1, Math.round((a.power ?? 0) * share * k));
      g.hp = Math.max(0, g.hp - dmg); f.n.dmg += dmg; if (g.broken) f.n.dmgBroken += dmg; if (exposed) f.n.dmgExposed += dmg; if (a.kind !== 'light') f.n.skillDmg += dmg;
      if (res === 'guarded') g.n.guarded++; else g.n.hit++;
      f.n.hits++;
      if (a.kind === 'light' && !c.ap) { c.ap = true; if (f.ap >= R.ap.max) f.n.apWasted++; f.ap = Math.min(R.ap.max, f.ap + R.ap.light); }
      log && put({ t: T(), who: f.x.id, ev: res, act: a.id, dmg, hp: g.hp, hit: c.i });
      if (g.hp <= 0) { over = true; winner = f === F[0] ? 0 : 1; finisher = a.kind === 'light' ? 'light' : a.heavy ? 'heavy' : 'skill'; return; }
      if (!g.broken) {
        const add = (gaugeHit ? gaugeHit(a, share, g.x.end, R) : (a.gauge ?? 0) * share * (10 / Math.max(1, g.x.end))) * (res === 'guarded' ? R.gauge.guardMul : 1) * (boostOn ? f.boost.gauge : 1) * (wardOn ? g.ward.gauge : 1);
        g.g = Math.min(R.gauge.max, gaugeNow(g) + add); g.gT = t;
        if (g.g >= R.gauge.max) {
          g.broken = true; g.stunEnd = t + R.brk.stun; g.n.breaks++;
          if (g.act) g.at += R.brk.stun;
          if (g.combo) { g.combo = null; g.pending = true; g.at = g.stunEnd; }
          log && put({ t: T(), who: g.x.id, ev: 'break' });
        }
      }
    }
    const after = (f) => { if (f.broken) { f.pending = true; f.at = f.stunEnd; } else start(f, decide(f)); };
    const leadNow = () => { const ld = Math.sign(F[0].hp / F[0].maxHp - F[1].hp / F[1].maxHp); if (ld && lastLead && ld !== lastLead) leadChanges++; if (ld) lastLead = ld; };

    for (const f of F) { f.at = (split ? h5(s0, f.i, 0, 0, 3) : one()) * R.start; f.pending = true; }
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
  return { duel };
}
