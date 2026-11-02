// Rig of errand-boy-x2-v1 (journal Passe CA6): NPC 11 of the reference sheet 01-16, "Child Helper (Male)" (front, back, profile: the sheet's 1st, 3rd and 4th views), a child, by day only, the operator's « Cuire » on the casting sheet (journal Passe CA1).
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/errand-boy-x2-v1.rig.mjs`.
import { citizenRig } from './lib/citizen.mjs';

export const { id, source, prepare, frames } = citizenRig({
  "id": "errand-boy-x2-v1",
  "pitch": 2.14,
  "views": {
    "down": "747,604,814,744",
    "up": "905,607,975,746",
    "side": "988,606,1047,744"
  },
  "walk": "legs",
  "stride": 0.85,
  "P": {
    "down": {
      "crotch": 80,
      "split": 31
    },
    "up": {
      "crotch": 78,
      "split": 32
    },
    "side": {
      "hem": 74,
      "bootTop": 84,
      "leg": [
        28,
        39
      ],
      "hipX": 32
    }
  },
  "chin": 51,
  "breath": 72,
  "closingFrom": 66,
  "carry": {
    "box": [
      15,
      57,
      33,
      71
    ],
    "at": [
      17,
      56
    ],
    "arm": 34
  }
});
