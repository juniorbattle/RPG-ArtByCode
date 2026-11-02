// Page side of tools/audio/render.mjs (journal Passes SN1 / SN2): the REAL src/audio/Sound.ts, unchanged, on a virtual clock into an
// OfflineAudioContext. A proxy stands for AudioContext (its currentTime the virtual clock, its state running), setTimeout runs on the same
// clock, Math.random is seeded. A job is a scene, a list of duel events, an effect, or a script of timed calls.
(() => {
  const SR = 44100;
  let seed = 1842 >>> 0;
  Math.random = () => { seed = (seed + 0x6d2b79f5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const vt = { now: 0, q: [], id: 1 };
  window.setTimeout = (fn, ms = 0) => { const id = vt.id++; vt.q.push({ at: vt.now + ms / 1000, fn, id }); return id; };
  window.clearTimeout = (id) => { vt.q = vt.q.filter((x) => x.id !== id); };
  let off = null, LEN = 0;
  window.AudioContext = function () {
    off = new OfflineAudioContext(2, LEN, SR);
    return new Proxy(off, { get(t, p) { if (p === 'currentTime') return vt.now; if (p === 'state') return 'running'; if (p === 'addEventListener') return () => {}; const v = t[p]; return typeof v === 'function' ? v.bind(t) : v; }, set(t, p, v) { t[p] = v; return true; } });
  };
  // the engine of `main` before lot S0 has no duelEvent: the mapping of its ArenaApp.soundOf, word for word (journal Passe V8)
  function oldSoundOf(s, e) {
    if (e.type === 'impact') s.play(e.result === 'dodged' ? 'dodge' : e.result === 'guarded' ? 'guard' : e.result === 'guardbreak' ? 'break' : e.kind === 'heavy' || e.damage >= 20 ? 'heavy' : 'hit');
    else if (e.type === 'ko') s.play('ko');
    else if (e.type === 'break') s.play('break');
    else if (e.type === 'chargeTier') s.play('tier');
    else if (e.type === 'chargeRelease') s.play('release');
    else if (e.type === 'commandDenied' && e.who === 'ren') s.play('denied');
    else if (e.type === 'reactStart' && e.who === 'ren') s.play('dodge', 0.6);
  }
  window.renderJob = async (job) => {
    vt.now = 0; vt.q = []; LEN = Math.ceil(job.secs * SR); seed = (job.rseed ?? 1842) >>> 0;
    try { if (job.keep) sessionStorage.setItem(job.keep[0], job.keep[1]); else sessionStorage.clear(); localStorage.clear(); } catch { /* the page has an origin: it does not throw */ }
    const s = new AUD.Sound();
    Object.assign(s.settings, job.settings || {});
    if (job.scene) s.setScene(job.scene.place, job.scene.look, !!job.scene.bout, job.scene.seed ?? 1842);
    await s.unlock();
    const buses = s.buses ?? { music: s.musicBus, ambience: s.fxBus, fx: s.fxBus };
    if (job.stem === 'music') for (const k of Object.keys(buses)) if (k !== 'music') buses[k].disconnect();
    if (job.stem === 'fx') buses.music.disconnect();
    if (job.effect) window.setTimeout(() => s.play(job.effect), 10);
    if (job.events) for (const e of job.events) { const t = e.t - (job.from ?? 0); if (t >= 0 && t < job.secs) window.setTimeout(() => (s.duelEvent ? s.duelEvent(e) : oldSoundOf(s, e)), t * 1000); }
    if (job.script) await AUD_SCRIPTS[job.script](s, job, (t, fn) => window.setTimeout(fn, t * 1000), vt);
    const t0 = performance.now();
    for (;;) { vt.q.sort((a, b) => a.at - b.at || a.id - b.id); const n = vt.q[0]; if (!n || n.at >= job.secs) break; vt.q.shift(); vt.now = n.at; n.fn(); }
    const after = job.report ? window[job.report]?.(s) : undefined;
    const buf = await off.startRendering();
    const ms = performance.now() - t0, a = buf.getChannelData(0), b = buf.getChannelData(1), inter = new Float32Array(a.length * 2);
    for (let i = 0; i < a.length; i++) { inter[2 * i] = a[i]; inter[2 * i + 1] = b[i]; }
    const bytes = new Uint8Array(inter.buffer), CH = 3 << 18;
    for (let i = 0; i < bytes.length; i += CH) { let str = ''; const p = bytes.subarray(i, i + CH); for (let k = 0; k < p.length; k += 0x8000) str += String.fromCharCode.apply(null, p.subarray(k, k + 0x8000)); await window.__chunk(job.name, btoa(str)); }
    return { sr: SR, ms, frames: a.length, after };
  };
  window.AUD_SCRIPTS = {};
})();
