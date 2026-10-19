// The visibility bake cache key (src/district/BakeCache.ts bakeKey, AGENTS.md "Bake cache"): the same inputs give the same key, and every
// input the bake reads (GPU, limits, part count, frame, water level, options, every pose field, the player position, the ID scene's
// geometry, transforms, visibility, material side, the reveal windows) changes it: otherwise a stale result could cull. A fake GL context
// stands in for the GPU (no browser). Test gap listed in journal Passe Q1, filled in Passe Q2.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const { bakeKey } = await load('/src/district/BakeCache.ts');
const THREE = await import('three');

const DBG = 0x9246;
function renderer({ gpu = 'Radeon 780M', maxTex = 16384, rb = 16384, vp = 16384, floatBlend = true } = {}) {
  const gl = {
    MAX_VIEWPORT_DIMS: 0x0d3a, MAX_RENDERBUFFER_SIZE: 0x84e8, RENDERER: 0x1f01,
    getExtension: (n) => (n === 'WEBGL_debug_renderer_info' ? { UNMASKED_RENDERER_WEBGL: DBG } : null),
    getParameter(p) { return p === DBG ? gpu : p === this.MAX_VIEWPORT_DIMS ? new Int32Array([vp, vp]) : p === this.MAX_RENDERBUFFER_SIZE ? rb : 'renderer'; },
  };
  return { getContext: () => gl, capabilities: { maxTextureSize: maxTex }, extensions: { has: (n) => n === 'EXT_float_blend' && floatBlend } };
}
function scene({ dx = 0, visible = true, side = THREE.FrontSide, name = 'wall', vertex = 0 } = {}) {
  const s = new THREE.Scene(), g = new THREE.BoxGeometry(2, 3, 1);
  if (vertex) { g.attributes.position.array[0] += vertex; }
  const m = new THREE.Mesh(g, new THREE.ShaderMaterial({ vertexShader: 'void main(){}', fragmentShader: 'void main(){}', side }));
  m.position.set(1 + dx, 0, 2); m.visible = visible; m.name = name; s.add(m);
  return s;
}
const pose = (yaw = -1, tx = 3) => ({ yaw, pitch: 0.14, dist: 26, fov: 30, shift: 0, tx, ty: 2.6, tz: 0.6, charScale: 1.12 });
function inputs(o = {}) {
  return { renderer: renderer(o.r), scene: o.scene ?? scene(), nParts: o.nParts ?? 738, aspect: o.aspect ?? 16 / 9, waterY: o.waterY ?? -1.15, opts: o.opts ?? {},
    poses: o.poses ?? [{ set: 'B', pose: pose(), player: [-2, 0.5] }, { set: 'AB', pose: pose(-1.2, 1), player: [-9.4, 0.5] }],
    ...(o.behind ? { behind: o.behind } : {}) };
}

test('the same inputs give the same key (64 bits, hex)', () => {
  const a = bakeKey(inputs()), b = bakeKey(inputs());
  assert.match(a, /^[0-9a-f]{16}$/);
  assert.equal(a, b);
  assert.equal(bakeKey(inputs({ scene: scene({ name: 'other' }) })), a, 'a mesh name is not an input of the bake');
});

test('every input the bake reads changes the key', () => {
  const base = bakeKey(inputs());
  const variants = {
    'GPU string': inputs({ r: { gpu: 'RTX 4060' } }),
    'MAX_TEXTURE_SIZE': inputs({ r: { maxTex: 8192 } }),
    'MAX_RENDERBUFFER_SIZE': inputs({ r: { rb: 8192 } }),
    'MAX_VIEWPORT_DIMS': inputs({ r: { vp: 8192 } }),
    'EXT_float_blend': inputs({ r: { floatBlend: false } }),
    'part count': inputs({ nParts: 739 }),
    'frame aspect': inputs({ aspect: 21 / 9 }),
    'water level': inputs({ waterY: -1.1 }),
    'bake options': inputs({ opts: { scale: 2 } }),
    'a pose field, at full precision': inputs({ poses: [{ set: 'B', pose: pose(-1 + 1e-12), player: [-2, 0.5] }, { set: 'AB', pose: pose(-1.2, 1), player: [-9.4, 0.5] }] }),
    'a pose set': inputs({ poses: [{ set: 'C', pose: pose(), player: [-2, 0.5] }, { set: 'AB', pose: pose(-1.2, 1), player: [-9.4, 0.5] }] }),
    'the player of a pose': inputs({ poses: [{ set: 'B', pose: pose(), player: [-2, 0.6] }, { set: 'AB', pose: pose(-1.2, 1), player: [-9.4, 0.5] }] }),
    'pose order': inputs({ poses: [{ set: 'AB', pose: pose(-1.2, 1), player: [-9.4, 0.5] }, { set: 'B', pose: pose(), player: [-2, 0.5] }] }),
    'a mesh moved': inputs({ scene: scene({ dx: 0.001 }) }),
    'a vertex moved': inputs({ scene: scene({ vertex: 1e-6 }) }),
    'a mesh hidden': inputs({ scene: scene({ visible: false }) }),
    'a material side': inputs({ scene: scene({ side: THREE.DoubleSide }) }),
  };
  const keys = new Map();
  for (const [what, inp] of Object.entries(variants)) {
    const k = bakeKey(inp);
    assert.notEqual(k, base, what);
    assert.ok(!keys.has(k), `${what} collides with ${keys.get(k)}`);
    keys.set(k, what);
  }
});

test('the behind pass: its scene and its reveal windows enter the key', () => {
  const win = (r) => ({ scene: scene({ name: 'behind' }), windowsFor: () => [[0.1, 0.2, r, 0.3]] });
  const a = bakeKey(inputs({ behind: win(0.25) }));
  assert.notEqual(a, bakeKey(inputs()), 'with / without the behind pass');
  assert.equal(a, bakeKey(inputs({ behind: win(0.25) })));
  assert.notEqual(a, bakeKey(inputs({ behind: win(0.26) })), 'a window size');
  assert.notEqual(a, bakeKey(inputs({ behind: { scene: scene({ dx: 1 }), windowsFor: () => [[0.1, 0.2, 0.25, 0.3]] } })), 'the behind scene');
});
