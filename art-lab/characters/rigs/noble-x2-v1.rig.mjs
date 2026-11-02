// Rig of noble-x2-v1 (journal Passe CA6): NPC 10 of the reference sheet 01-16, "Noble Customer (Female)" (front, back, profile: the sheet's 1st, 3rd and 4th views), a spectator of the tournament, the operator's « Cuire » on the casting sheet (journal Passe CA1).
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/noble-x2-v1.rig.mjs`.
import { citizenRig } from './lib/citizen.mjs';

export const { id, source, prepare, frames } = citizenRig({
  "id": "noble-x2-v1",
  "pitch": 2,
  "views": {
    "down": "385,566,466,743",
    "up": "551,571,630,743",
    "side": "632,576,704,743"
  },
  "walk": "gown",
  "P": {
    "down": {
      "waist": 52,
      "split": 30
    },
    "up": {
      "waist": 52,
      "split": 32
    },
    "side": {
      "waist": 52,
      "split": 31
    }
  },
  "chin": 36,
  "loose": {
    "up": [
      [
        49,
        84,
        52,
        87
      ]
    ],
    "side": [
      [
        49,
        80,
        52,
        86
      ]
    ]
  }
});
