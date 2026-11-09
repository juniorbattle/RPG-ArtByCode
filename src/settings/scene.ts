import type { PostFX } from '../atmosphere/PostFX';
import type { FrameCap } from '../app/FrameCap';
import { graphicsFrom, loadSettings, onSettings, type GameSettings, type ResCap } from './settings';

/** The graphics settings in a scene (journal Passe RG2, RG-3 / RG-4): the town, the squares, the arena and the old forecourt each render through their
 *  own post chain, reflection and frame cap; they all take the same settings at their start and again at every change, the address's own parameters
 *  first. With nothing stored, every value is the scene's own default (MSAA 4, the reflection at half, a60, depth of field and bloom on, no resolution
 *  cap): the same pixels as before. */
export interface GraphicsScene {
  post: PostFX;
  reflection: { scale: number };
  frameCap: FrameCap;
  resCap: ResCap | null;
  resize(): void;
}

export function applyGraphics(scene: GraphicsScene, params: URLSearchParams, s: GameSettings = loadSettings()): void {
  const g = graphicsFrom(params, s);
  scene.resCap = g.resCap;
  scene.post.params.msaa = g.msaa;
  scene.reflection.scale = g.refl;
  scene.frameCap.mode = g.frameCap;
  scene.post.dofEnabled = g.dof;
  scene.post.bloomEnabled = g.bloom;
}

/** applied now, then at every change of the settings (the render targets rebuilt at once: no reload) */
export function followGraphics(scene: GraphicsScene, params: URLSearchParams): void {
  applyGraphics(scene, params);
  onSettings((s) => { applyGraphics(scene, params, s); scene.resize(); });
}
