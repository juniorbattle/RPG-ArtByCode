// Page side of tools/audio/places-listen.mjs (lot S2, journal Passe SN18): the real Sound.ts plays a place as the game asks it (setScene, the weather with it); a job
// may mute a bus (the ambience, to hear the steps alone) and send timed events: a flash of the storm (the event the page's weather sends, src/atmosphere/Weather.ts),
// an effect (a step, a click). Nothing here is the game's code.
(() => {
  AUD_SCRIPTS.places = async (s, job, at) => {
    for (const b of job.mute ?? []) s.buses?.[b]?.disconnect();
    for (const e of job.events2 ?? []) at(e.t, () => {
      if (e.flash !== undefined) window.dispatchEvent(new CustomEvent('cdt-flash', { detail: { level: e.flash } }));
      else s.play(e.play);
    });
  };
})();
