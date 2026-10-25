// Rig of hero-x3-trial (LAB, not approved, never in production): the hero at x3 (96 x 144 texels per frame, feet on row 135), the middle
// density the trial prices against x2 and x4 (journal Passe AA2). The recipe is trialRig(3) of hero-trial.common.mjs.
//   node tools/art-lab/build-trial.mjs art-lab/characters/rigs/hero-x3-trial.rig.mjs [--check]
import { trialRig } from './hero-trial.common.mjs';

const rig = trialRig(3);
export const { id, frame, source, prepare, frames } = rig;
/** the shared recipe: hashed into the provenance pack with the rig */
export const uses = ['art-lab/characters/rigs/hero-trial.common.mjs'];
