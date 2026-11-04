// The interface played by the band (lot S2, journal Passes SN18 / SN19), written here and baked: a click, a dialog opening, the purse's coins, on the marimba,
// the vibraphone and the electric piano, on the motif's notes without a third, as the duel's sounds. The operator's sheet briefs/fiche-son-lieux.html:
// S2-INTERFACE « Bonne direction », S2-POIDS « Calculer dans la page, cuire l’interface et le murmure (121 Ko) », S2-SUITE « Cuire et brancher dans la version 2
// ce qui est validé »; the murmur was for the places' new ambiences, which the operator did not take (« Garder l’ambiance d’aujourd’hui »): it is not written.
// The refused command is the duel's own (lot S3). The places' rain, thunder and steps are computed in the page (src/audio/places.ts).
import { seedOf } from '../../../tools/audio/band/dsp.mjs';
import { marimba, vibes, rhodes } from '../../../tools/audio/band/instruments.mjs';
import { Cue } from './duel.sfx.mjs';

const D4 = 62, D5 = 74, A5 = 81, E6 = 88;

/** a sound: [family, seconds, takes, writer] as the duel's (art-lab/audio/sfx/duel.sfx.mjs); the writer returns the finish's options */
export const PLACE_CUES = {
  // a button pressed: one short bar of the marimba, the same note each time, a take's own touch
  'ui-click': ['interface', 0.3, 3, (c, take) => { c.put(marimba(A5, 0.45 + 0.05 * take, take), 0, { g: 0.6, dur: 0.07, rel: 0.04, send: 0.06 }); return { target: -24, rt: 0.3 }; }],
  // a dialog appears: two bars of the vibraphone a fifth apart, the electric piano under them
  'ui-open': ['interface', 0.6, 1, (c) => { c.put(vibes(D5, 0.5), 0, { g: 0.45, dur: 0.2, rel: 0.07 }); c.put(vibes(A5, 0.45), 0.055, { g: 0.4, dur: 0.18, rel: 0.07 }); c.put(rhodes(D4, 0.3), 0, { g: 0.18, dur: 0.18, rel: 0.07 }); return { target: -23, rt: 0.35 }; }],
  // the purse: two or three coins against each other, a glint of the vibraphone
  'ui-coin': ['interface', 0.7, 2, (c, take) => {
    c.clang(0, { f: 4100, g: 0.5, tau: 0.05, pan: -0.1 }); c.clang(0.07, { f: 5300, g: 0.4, tau: 0.045, pan: 0.1 });
    if (take) c.clang(0.13, { f: 4700, g: 0.3, tau: 0.04 });
    c.put(vibes(E6, 0.4), 0.02, { g: 0.22, dur: 0.14, rel: 0.06 });
    return { target: -23, rt: 0.3 };
  }],
};

/** a cue of the interface rendered: its takes, each a stereo pair at 48 kHz */
export function renderPlace(id) {
  const [family, secs, takes, write] = PLACE_CUES[id], out = [];
  for (let t = 0; t < takes; t++) { const c = new Cue(secs + 1.2, seedOf(`${id}:${t}`)), o = write(c, t) ?? {}; out.push(c.finish({ family, ...o })); }
  return { id, family, kind: 'once', takes: out };
}
export const PLACE_IDS = Object.keys(PLACE_CUES);
