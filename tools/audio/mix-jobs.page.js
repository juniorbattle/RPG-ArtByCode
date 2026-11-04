// Page side of tools/audio/mix-jobs.mjs (lot S5, journal Passe SN21): the real Sound.ts as a game asks it, page after page. A job sends timed events: an
// effect (a step, a click, a dialog, the purse, a refusal), the fanfare (`sting`), the page's way out (`leave`: the engine's own fade and its record of the
// music's place for the tab, which the next job takes up). Its report: the record, and the layers' levels when the page had a duel. Nothing here is the game's code.
(() => {
  const UI0 = { ...AUD.UI_LEVEL };
  AUD_SCRIPTS.mix = async (s, job, at) => {
    // a stem: some buses taken out (the stings and the room's return go round the buses: they stay)
    for (const b of job.mute ?? []) s.buses?.[b]?.disconnect();
    // the sheet's proposals (lot S5), tried on the real engine: the interface's levels, the arena's crowd carved in a band (a peaking filter on its group)
    Object.assign(AUD.UI_LEVEL, UI0, job.ui ?? {});
    if (job.carve && s.crowd) { const f = s.ctx.createBiquadFilter(); f.type = 'peaking'; f.frequency.value = job.carve.f; f.Q.value = job.carve.q; f.gain.value = job.carve.db; s.crowd.disconnect(); s.crowd.connect(f); f.connect(s.buses.ambience); }
    for (const e of job.events2 ?? []) at(e.t, () => {
      if (e.leave) s.leave();
      else if (e.sting) s.sting(e.sting);
      else if (e.flash !== undefined) window.dispatchEvent(new CustomEvent('cdt-flash', { detail: { level: e.flash } }));
      else s.play(e.play);
    });
  };
  window.__mixReport = (s) => { let rec = null; try { rec = JSON.parse(sessionStorage.getItem('cdt-v2-sound-now') ?? 'null'); } catch { /* none */ } return { rec, now: s.nowPlaying?.() ?? null }; };
})();
