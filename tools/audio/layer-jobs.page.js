// Page side of tools/audio/layer-jobs.mjs (lot S3, journal Passe SN13): the real Sound.ts plays the duel; a variant replaces only how the fights' three layers follow it.
(() => {
  const CALM = { foeSeq: false, charge: -1, stunned: 0, low: false, over: false, worst: 1 };
  // the engine's moodStep (src/audio/plan.ts), word for word, plus the lowest share of health seen (for the arc)
  const step = (m, e, maxHp) => {
    const n = { ...m };
    if (e.type === 'sequenceStart' && e.who !== 'ren') n.foeSeq = true;
    else if (e.type === 'sequenceEnd' && e.who !== 'ren') n.foeSeq = false;
    else if (e.type === 'chargeTier' && e.open) n.charge = Math.max(n.charge, e.idx);
    else if (e.type === 'chargeRelease') n.charge = -1;
    else if (e.type === 'stun') { n.stunned++; n.stuns = (n.stuns ?? 0) + 1; }
    else if (e.type === 'stunEnd') n.stunned = Math.max(0, n.stunned - 1);
    else if (e.type === 'impact') { const max = maxHp[e.to]; if (max > 0) { const r = e.hp / max; if (r < 0.3) n.low = true; n.worst = Math.min(n.worst, r); } }
    else if (e.type === 'ko') n.over = true;
    else if (e.type === 'reset') return { ...CALM };
    return n;
  };
  const rule = (m) => [1, m.foeSeq ? 0 : 1, m.foeSeq || m.charge >= 1 || m.stunned > 0 || m.low ? 1 : 0];
  // the variants: the levels a mood asks for, and how often a layer may move
  const POLICIES = {
    all: { levels: () => [1, 1, 1] },
    melody: { levels: (m) => [1, 1, rule(m)[2]] },
    // the rule of today, a change only once its cause has lasted a whole bar, a layer kept four bars once moved
    calm: { levels: rule, hold: 4, stable: true },
    // the duel's arc: the tune never cut; the tension in at half from the first stun or when a fighter falls under two thirds, whole under 30 %; never back
    arc: { levels: (m) => [1, 1, m.low ? 1 : (m.stuns ?? 0) > 0 || m.worst < 2 / 3 ? 0.5 : 0], phrase: 4, ratchet: true },
    soft: { levels: (m) => [1, m.foeSeq ? 0.45 : 1, m.foeSeq || m.charge >= 1 || m.stunned > 0 || m.low ? 1 : 0.35], ramp: 'bar' },
  };
  AUD_SCRIPTS.policy = (s, job, at) => {
    const P = POLICIES[job.policy], set0 = s.layered?.set; if (!set0) throw new Error('no layers');
    const maxHp = job.scene.music.maxHp, c = s.ctx;
    if (job.noDuck) s.duck = () => {};
    let m = { ...CALM };
    for (const e of job.pre ?? []) m = step(m, e, maxHp);
    // a layer moves on a bar line; a second move asked for the same line replaces the first (no jump)
    const st = [0, 1, 2].map((i) => ({ held: set0.levelOf(i), from: set0.levelOf(i), at: -1, last: -1e9 }));
    const ramp = P.ramp === 'bar' ? set0.bar : 0.25;
    const move = (i, v, t) => {
      const g = set0.gains[i].gain, x = st[i];
      if (x.at === t) { g.cancelScheduledValues(t); g.setValueAtTime(x.from, t); if (v !== x.from) g.linearRampToValueAtTime(v, t + ramp); }
      else { x.from = x.held; x.at = t; g.setValueAtTime(x.held, t); g.linearRampToValueAtTime(v, t + ramp); x.last = t; }
      x.held = v; set0.held[i] = v; window.__moves.push([+t.toFixed(3), i, v, ramp]);
    };
    const target = () => { const v = P.levels(m); return P.ratchet ? v.map((x, i) => Math.max(x, st[i].peak ?? 0)) : v; };
    // the levels at the window's start, as the duel left them before it
    const first = target(); first.forEach((v, i) => { if (v !== st[i].held) move(i, v, AUD.nextBoundary(c.currentTime, set0.start, set0.bar)); st[i].peak = Math.max(st[i].peak ?? 0, v); });
    const apply = () => {
      if (m.over || s.layered?.set !== set0) return;
      const now = c.currentTime, grid = P.phrase ? set0.bar * P.phrase : set0.bar, t = AUD.nextBoundary(now, set0.start, grid);
      target().forEach((v, i) => {
        const x = st[i]; if (v === x.held) return;
        if (P.hold && t - x.last < P.hold * set0.bar - 1e-6) return;
        move(i, v, t); st[i].peak = Math.max(st[i].peak ?? 0, v);
      });
    };
    // the variants that wait: a tick before each bar line reads the mood; a cause must have held since the last tick
    if (P.stable || P.hold) {
      let seen = target();
      const tick = () => {
        if (m.over || s.layered?.set !== set0) return;
        const now = target(), t = AUD.nextBoundary(c.currentTime, set0.start, set0.bar);
        now.forEach((v, i) => { const x = st[i]; if (v !== x.held && v === seen[i] && (!P.hold || t - x.last >= P.hold * set0.bar - 1e-6)) move(i, v, t); });
        seen = now;
        const next = AUD.nextBoundary(c.currentTime + 0.1, set0.start, set0.bar) - 0.06;
        window.setTimeout(tick, Math.max(0.01, next - c.currentTime) * 1000);
      };
      window.setTimeout(tick, Math.max(0.01, AUD.nextBoundary(c.currentTime, set0.start, set0.bar) - 0.06 - c.currentTime) * 1000);
    }
    s.duelEvent = (e) => {
      const q = AUD.duelCue(e); if (q) s.play(q.effect, q.gain ?? 1, q);
      const was = m; m = step(m, e, maxHp);
      if (e.type === 'ko' && !was.over) { const l = s.layered; if (l) { l.set.stop(0.4); s.layered = null; } window.setTimeout(() => s.sting(e.who === 'ren' ? 'defaite' : 'victoire'), AUD.JINGLE_AFTER * 1000); return; }
      if (!P.stable && !P.hold) apply();
    };
  };
  // the engine untouched, the blows' step back only switched off
  AUD_SCRIPTS.noduck = (s, job) => { s.duck = () => {}; spy(s); };
  AUD_SCRIPTS.spy = (s) => spy(s);
  // the engine's own moves, recorded without changing them: when, which layer, to what; two asked for the same bar line counted
  function spy(s) {
    const set = s.layered.set, orig = set.level.bind(set), last = {};
    set.level = (i, v, ramp = 0.25) => { const t = orig(i, v, ramp); window.__moves.push([+t.toFixed(3), i, v, ramp]); if (last[i] === t) window.__doubles++; last[i] = t; return t; };
  }
  // the engine's LayerSet asked twice for the same bar line, as Sound.duelEvent does when the opponent's sequence ends before the bar it started on
  AUD_SCRIPTS.double = (s, job, at) => {
    const n = Math.round(s.ctx.sampleRate * 2.4), b = s.ctx.createBuffer(2, n, s.ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = 0.05 * Math.sin(2 * Math.PI * 1000 * i / n); }
    const set = s.layers('probe', [b], 1.2, [1]);
    at(1.0, () => set.level(0, 0)); at(1.1, () => set.level(0, 1));
  };
  // a job's resume record written at its own render, so the loop starts where the game would be at the window's start
  window.__report = () => ({ moves: window.__moves, doubles: window.__doubles });
  const orig = window.renderJob;
  window.renderJob = (job) => { window.__moves = []; window.__doubles = 0; return orig(job.keepKey ? { ...job, keep: ['cdt-v2-sound-now', JSON.stringify({ key: job.keepKey, pos: job.keepPos, heard: true, at: Date.now() })] } : job); };
})();
