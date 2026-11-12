// Page side of tools/audio/lot4-listen.mjs (journal Passe LC6): the form of the day's sign, lot 4's candidate (src/audio/formCue.ts, computed in the page), played
// by the real engine as a duel's sound plays (src/audio/Sound.ts `cue`): on the effects' bus at the duel's sounds' level (SFX_TRIM), at its fighter's side, with
// the room's send. `job.signs`: [who, id, t] each.
(() => {
  const side = (who) => (who === 'ren' ? -0.28 : 0.28);
  function sign(s, id, who) {
    const c = s.ctx, y = AUD.formCue(id, c.sampleRate), b = c.createBuffer(2, y.length, c.sampleRate);
    b.getChannelData(0).set(y); b.getChannelData(1).set(y);
    const src = c.createBufferSource(), g = c.createGain(), p = c.createStereoPanner();
    src.buffer = b; g.gain.value = AUD.dbGain(AUD.SFX_TRIM); p.pan.value = side(who);
    src.connect(g); g.connect(p); p.connect(s.buses.fx); s.send(p, AUD.SEND.fx);
    src.start(c.currentTime + 0.005);
  }
  // a job that starts inside a bout takes its piece up where it stands (the tab's record, as tools/audio/sfx-jobs.page.js)
  const orig = window.renderJob;
  window.renderJob = (job) => orig(job.keepKey ? { ...job, keep: ['cdt-v2-sound-now', JSON.stringify({ key: job.keepKey, pos: job.keepPos, heard: true, at: Date.now() })] } : job);
  AUD_SCRIPTS.form = (s, job, at) => { for (const [who, id, t] of job.signs ?? []) at(t, () => sign(s, id, who)); };
})();
