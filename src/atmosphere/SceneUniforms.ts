import * as THREE from 'three';

export const MAX_LIGHTS = 24;

/** One uniform bag shared *by reference* across every material: the lighting rig, fog, moon shadow and
 *  planar reflection write here once per frame and every surface shader sees it. */
export const U = {
  uTime: { value: 0 },
  uLightPos: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4(0, -100, 0, 1)) },
  uLightCol: { value: Array.from({ length: MAX_LIGHTS }, () => new THREE.Vector4(0, 0, 0, 1)) },
  uLightCount: { value: 0 },
  uMoonDir: { value: new THREE.Vector3(-0.4, 0.8, 0.3).normalize() },
  uMoonCol: { value: new THREE.Color(0.30, 0.38, 0.55) },
  uFillDir: { value: new THREE.Vector3(0.35, 0.28, 0.9).normalize() },
  uFillCol: { value: new THREE.Color(0.045, 0.065, 0.1) },
  uSkyAmb: { value: new THREE.Color(0.07, 0.10, 0.16) },
  uGroundAmb: { value: new THREE.Color(0.03, 0.036, 0.055) },
  uFogColor: { value: new THREE.Color(0.05, 0.09, 0.16) },
  uFogDensity: { value: 0.012 },
  uFogStart: { value: 34 },
  uMist: { value: 0.35 },
  uShadowMap: { value: null as THREE.Texture | null },
  uShadowVP: { value: new THREE.Matrix4() },
  uShadowTexel: { value: 1 / 2048 },
  uShadowOn: { value: 1 },
  uReflMap: { value: null as THREE.Texture | null },
  uReflVP: { value: new THREE.Matrix4() },
  uReflStrength: { value: 1 },
  uReflReady: { value: 0 },
  uClipY: { value: -1000 },
  uWarmGain: { value: 1 },
  uWindAmp: { value: 1 },
  uWet: { value: 1 },
  uResolution: { value: new THREE.Vector2(1920, 1080) },
};

export type SharedUniforms = typeof U;
