// Rig of wayfarer-x2-v1 (journal Passe CA6): NPC 08 of the reference sheet 01-16, "Traveler (Female)" (front, back, profile: the sheet's 2nd, 3rd and 4th views, the 1st shows another scarf and hair), a traveller come for the tournament, the operator's « Cuire » on the casting sheet (journal Passe CA1).
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/wayfarer-x2-v1.rig.mjs`.
import { citizenRig } from './lib/citizen.mjs';

export const { id, source, prepare, frames } = citizenRig({
  "id": "wayfarer-x2-v1",
  "pitch": 1.74,
  "views": {
    "down": "1191,354,1260,506",
    "up": "1273,353,1341,504",
    "side": "1353,356,1412,503"
  },
  "walk": "dress",
  "P": {
    "down": {
      "hem": 81,
      "split": 32
    },
    "up": {
      "hem": 73,
      "split": 30
    },
    "side": {
      "hem": 80,
      "bootTop": 81,
      "leg": [
        29,
        40
      ],
      "hipX": 32
    }
  },
  "chin": 38,
  "loose": {
    "up": [
      [
        42,
        84,
        44,
        89
      ],
      [
        41,
        90,
        41,
        90
      ]
    ]
  }
});
