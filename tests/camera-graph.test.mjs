// Camera graph zone choice (src/app/CameraGraph.ts, AGENTS.md "Camera graph"): A at the west end (x < -9.4), B by default, C in the
// forge yard (x 4.2..13.2, z < 2.4), D past the forge (x >= 14); the zone in force holds until the player is 0.9 m past its edge.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { load } from './load.mjs';

const { CameraGraph, DEFAULT_ZONES } = await load('/src/app/CameraGraph.ts');
const graph = () => new CameraGraph();

test('the authored zones and margin', () => {
  const z = Object.fromEntries(DEFAULT_ZONES.map((d) => [d.id, d]));
  assert.equal(z.A.x1, -9.4);
  assert.deepEqual([z.C.x0, z.C.x1, z.C.z1], [4.2, 13.2, 2.4]);
  assert.equal(z.D.x0, 14);
  assert.ok(z.D.priority > z.C.priority && z.C.priority > z.A.priority && z.A.priority > z.B.priority);
  assert.equal(graph().margin, 0.9);
});

test('a fresh choice (no current zone) takes the highest-priority zone containing the player', () => {
  const g = graph();
  for (const [x, z, want] of [[-20, 0, 'A'], [-9.5, 3, 'A'], [-9.3, 0, 'B'], [0, 0, 'B'], [4.3, 0, 'C'], [13.1, 2.3, 'C'],
    [8, 2.5, 'B'], [13.5, 0, 'B'], [14.1, 0, 'D'], [20, 5, 'D'], [5000, 0, 'B']]) {
    assert.equal(g.zoneFor(x, z, null), want, `(${x}, ${z})`);
  }
});

test('hysteresis: the current zone holds within 0.9 m past its edge, then releases', () => {
  const g = graph();
  // D releases at 13.1 (into C on the quay, into B along the water's edge)
  assert.equal(g.zoneFor(13.5, 0, 'D'), 'D');
  assert.equal(g.zoneFor(13.15, 0, 'D'), 'D');
  assert.equal(g.zoneFor(13.05, 0, 'D'), 'C');
  assert.equal(g.zoneFor(13.05, 3, 'D'), 'B');
  // C releases 0.9 m west of x 4.2 and 0.9 m north of z 2.4
  assert.equal(g.zoneFor(3.35, 0, 'C'), 'C');
  assert.equal(g.zoneFor(3.25, 0, 'C'), 'B');
  assert.equal(g.zoneFor(8, 3.25, 'C'), 'C');
  assert.equal(g.zoneFor(8, 3.35, 'C'), 'B');
  // A releases 0.9 m east of x -9.4
  assert.equal(g.zoneFor(-8.55, 0, 'A'), 'A');
  assert.equal(g.zoneFor(-8.45, 0, 'A'), 'B');
});

test('a higher-priority zone takes over at its own edge, whatever the current zone', () => {
  const g = graph();
  assert.equal(g.zoneFor(4.25, 0, 'B'), 'C');
  assert.equal(g.zoneFor(14.05, 0, 'C'), 'D');
  assert.equal(g.zoneFor(14.05, 3, 'B'), 'D');
  assert.equal(g.zoneFor(-9.45, 0, 'B'), 'A');
});

test('the margin is read from the instance', () => {
  const g = graph();
  g.margin = 0.2;
  assert.equal(g.zoneFor(13.75, 0, 'D'), 'B');
  assert.equal(g.zoneFor(13.85, 0, 'D'), 'D');
});
