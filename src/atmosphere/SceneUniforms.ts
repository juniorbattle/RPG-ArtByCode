import * as THREE from 'three';

export const MAX_LIGHTS = 24;
/** occludable objects that can be revealed at once (parts and instances share one fade table) */
export const OCC_MAX = 16;
/** light grid over the lit part of the district: x -64..96 (4 m cells), z -24..24 (6 m cells); a cell can list
 *  every light, so the grid never drops one (it only skips the ones that cannot reach the cell) */
export const LIGHT_GRID = { x0: -64, z0: -24, cw: 4, cd: 6, nx: 40, nz: 8, per: MAX_LIGHTS, nCells: 40 * 8 };

/** One uniform bag shared *by reference* across every material: the lighting rig, fog, moon shadow and
 *  planar reflection write here once per frame and every surface shader sees it. */
export const U = {
  uTime: { value: 0 },
  uLightPos: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4(0, -100, 0, 1)) },
  uLightCol: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4(0, 0, 0, 1)) },
  uLightCount: { value: 0 },
  /** light grid (see LightRig.buildGrid): per-cell light index lists, the grid origin / cell size and dimensions */
  uLightGrid: { value: null as THREE.Texture | null },
  uGridRect: { value: new THREE.Vector4(LIGHT_GRID.x0, LIGHT_GRID.z0, LIGHT_GRID.cw, LIGHT_GRID.cd) },
  uGridDim: { value: new THREE.Vector2(LIGHT_GRID.nx, LIGHT_GRID.nz) },
  uMoonDir: { value: new THREE.Vector3(0.95, 0.2, 0.17).normalize() },
  uMoonCol: { value: new THREE.Color(0.30, 0.38, 0.55) },
  uFillDir: { value: new THREE.Vector3(-0.6, 0.35, 0.7).normalize() },
  uFillCol: { value: new THREE.Color(0.045, 0.065, 0.1) },
  uSkyAmb: { value: new THREE.Color(0.07, 0.10, 0.16) },
  uGroundAmb: { value: new THREE.Color(0.03, 0.036, 0.055) },
  /** horizon haze: the colour every distant layer dissolves into (also the sky at the horizon) */
  uFogColor: { value: new THREE.Color(0.034, 0.055, 0.098) },
  /** extinction per metre at the fog base height; falls off exponentially with altitude */
  uFogDensity: { value: 0.013 },
  uFogStart: { value: 16 },
  uFogFalloff: { value: 0.06 },
  uFogBase: { value: 0 },
  /** extra low-lying mist hugging the water and the far streets (multiplies the density near the base) */
  uMist: { value: 0.35 },
  uSkyZenith: { value: new THREE.Color(0.007, 0.012, 0.034) },
  /** desaturated warm haze low over the upper city (the only warm note in the sky) */
  uCityGlow: { value: new THREE.Color(0.034, 0.028, 0.026) },
  uCityDir: { value: new THREE.Vector3(1, 0, 0.04).normalize() },
  uMoonSpec: { value: 1 },
  uWaterY: { value: -1.15 },
  /** proxy for what the canal mirrors: the frontage plane (z) and its ridgeline height; rays above it see the far city */
  uReflProxy: { value: new THREE.Vector2(-3, 13) },
  uShadowMap: { value: null as THREE.Texture | null },
  uShadowVP: { value: new THREE.Matrix4() },
  uShadowTexel: { value: 1 / 2048 },
  uShadowOn: { value: 1 },
  uReflMap: { value: null as THREE.Texture | null },
  uReflVP: { value: new THREE.Matrix4() },
  uReflStrength: { value: 1 },
  uReflReady: { value: 0 },
  /** water level while the mirror pass renders, -1000 otherwise (a pass flag: clipping itself is done by the
   *  mirror camera's oblique near plane, so no surface shader needs a discard and early-z stays enabled) */
  uClipY: { value: -1000 },
  uWarmGain: { value: 1 },
  uWindAmp: { value: 1 },
  uWet: { value: 1 },
  uResolution: { value: new THREE.Vector2(1920, 1080) },
  /** player occlusion reveal (only read by the occludable surface variants, see OcclusionReveal): per-occluder fade,
   *  reveal centre in render pixels (xy), the player's view depth (z) and the style (w: 0 soft, 1 dither, 2 hybrid) */
  uOccFade: { value: new Array<number>(OCC_MAX).fill(0) },
  uOccC: { value: new THREE.Vector4(0, 0, 1e4, 0) },
  /** inner ellipse semi-axes in render pixels (xy) and the feather's outer / inner ratio (z) */
  uOccR: { value: new THREE.Vector4(1, 1, 1.7, 0) },
};

export type SharedUniforms = typeof U;
