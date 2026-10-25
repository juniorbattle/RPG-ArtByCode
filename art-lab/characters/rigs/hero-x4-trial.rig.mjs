// Rig of hero-x4-trial (LAB, not approved, never in production): the hero at x4 (128 x 192 texels per frame, feet on row 180), the density
// trial of the arena's fighters (journal Passe AA2). The recipe is trialRig(4) of hero-trial.common.mjs.
//   node tools/art-lab/build-trial.mjs art-lab/characters/rigs/hero-x4-trial.rig.mjs [--check]
import { trialRig } from './hero-trial.common.mjs';

const rig = trialRig(4);
export const { id, frame, source, prepare, frames } = rig;
/** the shared recipe: hashed into the provenance pack with the rig */
export const uses = ['art-lab/characters/rigs/hero-trial.common.mjs'];
