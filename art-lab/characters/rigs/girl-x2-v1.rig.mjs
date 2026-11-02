// Rig of girl-x2-v1 (journal Passe CA6): NPC 12 of the reference sheet 01-16, "Child (Female)" (front, back, profile: the sheet's 1st, 3rd and 4th views), a child, by day only, the operator's « Cuire » on the casting sheet (journal Passe CA1).
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/girl-x2-v1.rig.mjs`.
import { citizenRig } from './lib/citizen.mjs';

export const { id, source, prepare, frames } = citizenRig({
  "id": "girl-x2-v1",
  "pitch": 2.15,
  "views": {
    "down": "1108,601,1173,746",
    "up": "1275,601,1337,745",
    "side": "1349,603,1413,747"
  },
  "walk": "dress",
  "stride": 0.85,
  "P": {
    "down": {
      "hem": 81,
      "split": 31
    },
    "up": {
      "hem": 80,
      "split": 31
    },
    "side": {
      "hem": 80,
      "bootTop": 81,
      "leg": [
        28,
        39
      ],
      "hipX": 32
    }
  },
  "chin": 50,
  "breath": 72,
  "closingFrom": 66
});
