// Rig of vendor-x2-v1 (journal Passe CA6): NPC 01 of the reference sheet 01-16, "Merchant (Male)" (front, back, profile: the sheet's 1st, 3rd and 4th views), a stallholder, the operator's « Cuire » on the casting sheet (journal Passe CA1).
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/vendor-x2-v1.rig.mjs`.
import { citizenRig } from './lib/citizen.mjs';

export const { id, source, prepare, frames } = citizenRig({
  "id": "vendor-x2-v1",
  "pitch": 1.7,
  "views": {
    "down": "33,123,104,271",
    "up": "191,124,264,271",
    "side": "277,125,330,270"
  },
  "walk": "legs",
  "P": {
    "down": {
      "crotch": 77,
      "split": 32,
      "lift": 60
    },
    "up": {
      "crotch": 70,
      "split": 32,
      "lift": 74
    },
    "side": {
      "hem": 74,
      "bootTop": 82,
      "leg": [
        29,
        41
      ],
      "hipX": 32
    }
  },
  "chin": 38,
  "closingFrom": 78,
  "loose": {
    "up": [
      [
        31,
        84,
        33,
        84
      ]
    ]
  }
});
