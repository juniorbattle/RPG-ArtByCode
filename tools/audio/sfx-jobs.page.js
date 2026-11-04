// Page side of tools/audio/sfx-listen.mjs (lot S3, journal Passe SN15): the real Sound.ts plays the duel, its music and its layers (rule F) untouched; the
// proposal replaces the duel's sounds by the band's (art-lab/audio/sfx/duel.sfx.mjs, decoded from window.__BANK) and the arena's rumble by the crowd in code,
// on the engine's own buses, its room's send and its step back under the blows. Nothing here is the game's code: the integration waits for the operator.
(() => {
  const b64 = (s) => { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
  const SIDE = (who) => (who === 'ren' ? -0.28 : 0.28);
  // the skills that have a sound of their own (one per effect recipe); the plain blows by side
  const OWN = new Set(['t1', 't2', 't3', 't4', 'k_sunder', 'k_feint', 'm_ironfall', 'm_lunge', 'm_shoulder', 'm_riposte', 'm_smite', 'm_wild', 'm_cleave']);
  const WARDS = new Set(['d1', 'm_bulwark', 'm_brace', 'm_aegis', 'm_hide', 'k_iron', 'k_parry']), BOOSTS = new Set(['s1', 'k_cry', 'k_focus', 'm_resolve', 'm_tempo', 'm_gild', 'm_prayer', 'm_grit', 'm_roar']);
  const level = (idx, tiers) => (idx <= 0 ? 0 : idx === 1 ? 1 : idx - 2 < Math.ceil((tiers - 2) / 2) ? 2 : 3);
  AUD_SCRIPTS.sfx = async (s, job) => {
    const c = s.ctx, o = job.sfx;
    window.__buf ??= {};
    for (const [name, data] of Object.entries(window.__BANK)) if (!window.__buf[name]) window.__buf[name] = await c.decodeAudioData(b64(data));
    const B = window.__buf, takes = (id) => Object.keys(B).filter((k) => k === id || k.startsWith(`${id}-`) && /^\d+$/.test(k.slice(id.length + 1))).sort();
    let seed = 0x5f3a ^ (job.rseed ?? 1); const rnd = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const last = {};
    const fxGain = 10 ** ((o.fxDb ?? 0) / 20), crowdGain = 10 ** ((o.crowdDb ?? 0) / 20);
    /** a sound of the bank on the effects' bus: another take than the last, a little higher or lower, a little louder or softer, at its place, with the room */
    const play = (id, { pan = 0, gain = 1 } = {}) => {
      const list = takes(id); if (!list.length || job.crowdOnly) return;
      let k = Math.floor(rnd() * list.length); if (list.length > 1 && k === last[id]) k = (k + 1) % list.length; last[id] = k;
      const src = c.createBufferSource(), g = c.createGain(), p = c.createStereoPanner();
      src.buffer = B[list[k]]; src.playbackRate.value = 1 + (rnd() * 2 - 1) * 0.03; g.gain.value = fxGain * gain * 10 ** ((rnd() * 2 - 1) / 20); p.pan.value = pan;
      src.connect(g); g.connect(p); p.connect(s.buses.fx); s.send(p, AUD.SEND.fx); src.start(c.currentTime + 0.005);
    };
    /** the music and the crowd step back under a blow: as today, at half, or not */
    const duck = (e) => {
      const d = AUD.DUCK[e]; if (!d || o.duck === 'none') return; const k = o.duck === 'half' ? 0.5 : 1, t = c.currentTime;
      for (const [node, share] of [[s.ducks.music, 1], [s.ducks.ambience, AUD.DUCK_AMBIENCE]]) { node.gain.cancelScheduledValues(t); node.gain.setTargetAtTime(10 ** (-d.db * share * k / 20), t, d.attack / 3); node.gain.setTargetAtTime(1, t + d.hold, d.release / 3); }
    };
    // the crowd in place of the arena's rumble: its murmur in a loop, its reactions over it, on the ambience's way (it steps back a little under the blows)
    let crowd = null, quietUntil = -1;
    if (o.crowd) {
      s.buses.ambience.disconnect(); crowd = c.createGain(); crowd.gain.value = crowdGain; crowd.connect(s.ducks.ambience);
      const bed = c.createBufferSource(); bed.buffer = B['crowd-bed']; bed.loop = true; const bg = c.createGain(); bg.gain.value = 10 ** ((o.bedDb ?? 0) / 20); bed.connect(bg); bg.connect(crowd); bed.start(c.currentTime + 0.05, (job.rseed ?? 0) % 16);
    }
    const react = (id, force = false) => {
      if (!crowd) return; const t = c.currentTime; if (!force && t < quietUntil) return; quietUntil = t + 2.6;
      const src = c.createBufferSource(), g = c.createGain(); src.buffer = B[`crowd-${id}`]; src.playbackRate.value = 1 + (rnd() * 2 - 1) * 0.02; g.gain.value = 10 ** (((o.reactDb ?? 0) + (rnd() * 2 - 1)) / 20); src.connect(g); g.connect(crowd); src.start(t + 0.12 + rnd() * 0.08);
    };
    let tiers = job.tiers ?? 6, threatAt = -9;
    s.play = () => {};                            // today's synthesised effects: silent in the proposal
    const engine = s.duelEvent.bind(s);           // the music, its layers, the K.O.'s cut and its jingle: the engine's own
    s.duelEvent = (e) => {
      engine(e);
      const t = c.currentTime;
      if (e.type === 'impact') {
        const foe = e.from !== 'ren', big = e.kind === 'heavy' || e.kind === 'skill';
        if (e.result === 'dodged') { play('whiff', { pan: SIDE(e.to) }); return; }
        if (e.result === 'guarded') { play(e.kind === 'light' ? 'guard' : 'guardHeavy', { pan: SIDE(e.to) }); duck('guard'); return; }
        if (e.result === 'guardbreak') { play('break', { pan: SIDE(e.to) }); duck('break'); return; }
        const id = OWN.has(e.action) ? e.action : foe ? (e.kind === 'heavy' ? 'm_heavy' : 'm_slash') : e.kind === 'heavy' ? 'heavy' : 'light';
        play(id, { pan: SIDE(e.to) }); duck(big || e.damage >= 20 ? 'heavy' : 'hit');
        if (big) react(foe ? 'oh' : OWN.has(e.action) ? 'cheer' : 'oh');
      } else if (e.type === 'effect') play(WARDS.has(e.action) || BOOSTS.has(e.action) ? e.action : e.family === 'defensive' ? 'd1' : 's1', { pan: SIDE(e.who) });
      else if (e.type === 'break') { play('break', { pan: SIDE(e.who) }); duck('break'); react('gasp'); }
      else if (e.type === 'stun') play('stun', { pan: SIDE(e.who) });
      else if (e.type === 'ko') { play('ko'); duck('ko'); react('roar', true); }
      else if (e.type === 'chargeTier' && e.open) { const l = level(e.idx, tiers); if (l) play(`charge${l}`, { pan: SIDE('ren') }); }
      else if (e.type === 'chargeRelease' && e.ok && e.idx >= 1) play('release', { pan: SIDE('ren') });
      else if (e.type === 'commandDenied' && e.who === 'ren') play('denied');
      else if (e.type === 'windowOpen' && e.who !== 'ren') play('window', { pan: SIDE(e.who) });
      else if (e.type === 'reactStart' && e.who === 'ren') play('dodge', { pan: SIDE('ren') });
      else if (e.type === 'sequenceStart' && e.who !== 'ren' && t - threatAt > 1) { threatAt = t; play('threat', { pan: SIDE(e.who) }); }
      else if (e.type === 'pushed') play('pushed', { pan: SIDE(e.who) });
    };
  };
  // today's engine, the blows' step back only changed (the ducks question on today's sounds is not asked: the proposal's are)
  const orig = window.renderJob;
  window.renderJob = (job) => orig(job.keepKey ? { ...job, keep: ['cdt-v2-sound-now', JSON.stringify({ key: job.keepKey, pos: job.keepPos, heard: true, at: Date.now() })] } : job);
})();
