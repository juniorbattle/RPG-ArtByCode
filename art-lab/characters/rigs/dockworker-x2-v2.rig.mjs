// Rig of dockworker-x2-v2: idle (4 frames) and walk (6 frames) in the three runtime facings, cut out of three reconstructed views of the
// same character (reference sheet NPC 05, "Dock Worker (Male)": front = the approved dockworker-x2-v1 export; back and side = the same
// sheet row, same reconstruction, mapped onto the approved palette). Deterministic: `node tools/art-lab/build-character.mjs <this file>`.
import * as R from '../../../tools/art-lab/rig-engine.mjs';

export const id = 'dockworker-x2-v2';

// ---- gait shared by every facing: 6 frames at the runtime's 7.5 frames / s = 0.8 s per cycle, one step = 3 frames = 0.4 s. The side
// view's planted ankle travels 13 texels per step (x 6.5 .. -6.5 around the hip) = 0.28 m at the presentation scale 0.9 (0.0212 m / texel):
// 0.69 m / s against the wanderers' 0.8-0.95 m / s (ActorSystem), a slight slide accepted: a longer stride (16 texels, the first version)
// read as a lunge on these short legs (independent review, Passe 4A-sedecies).
// Leg A is forward on frame 0; leg B is the same cycle half a period later. Ankle offsets are texels from the hip (x, + = forward / -x);
// lift = ankle height above its standing height; foot = boot angle (+ = toe up).
const CYCLE = [
  { x: 6.5, lift: 0, foot: 6 },    // 0 contact: heel strike in front
  { x: 2.2, lift: 0, foot: 0 },    // 1 mid-stance, the body passes over the foot
  { x: -2.2, lift: 0, foot: 0 },   // 2 push
  { x: -6.5, lift: 2, foot: -18 }, // 3 toe-off behind (the other leg strikes)
  { x: -1, lift: 6, foot: -15 },   // 4 passing: knee forward, foot lifted under the body, toe down
  { x: 4.5, lift: 2, foot: 4 },    // 5 reach
];
/** body drop (rows) per frame, from the side view's planted leg (computed once, reused by the front and back views) */
let BOB = null;

/** the recipe's input: back and side reconstructed from the archived sheet (row 2, the dock worker's 3rd and 4th views) like the front
 *  was (pitch 1.775), mapped onto the approved front's 64 colours; the front IS the approved export */
export const source = {
  sheet: 'art-lab/characters/reference/sources/merchant-district-night-npc-01-16.webp',
  pitch: 1.775,
  views: { up: '195,347,269,505', side: '282,345,341,505' },
  keep: { down: 'art-lab/characters/exports/dockworker-x2-v1.png' },
  palette: { from: 'art-lab/characters/exports/dockworker-x2-v1.png' },
  // revision of 2026-10-17 (operator: black pixels), back / side reconstructions only (the front is the approved v1 export, unchanged):
  // the vertical closing only from row 48 down (reconstruct-grid --closing-from=48): above, it
  // filled the background beside the head and the neck with its darkest colour (black strokes that read as long hair); below, it
  // restores the dark leg and boot outlines the flood fill takes for background
  options: { closingFrom: 48 },
};
/** side: mirrored to face left (the runtime's native side), moved 2 texels left (feet centred on the anchor column), its top row cleared
 *  and one cap row removed (row 5): the profile reconstructs 2 rows taller than the front (91), the frame keeps a transparent ring */
export function prepare(dir, v) {
  if (dir !== 'side') return v;
  const m = R.erase(R.shift(R.mirror(v), -2, 0), (x, y) => y === 0);
  return R.over(R.cut(m, (x, y) => y > 5), R.shift(R.cut(m, (x, y) => y < 5), 0, 1));
}

// ---- side (facing left): the profile shows both legs merged into one trouser mass, so the two legs are PAINTED in the view's own
// trouser / cuff / sock ramp (the idle trousers' mid navy, a lit front, a shaded back, one-texel outline), posed by IK; the far leg is one
// ramp step darker. The boot is the view's own boot, moved rigidly (RotSprite rotation on the heel-strike / toe-off frames). Pelvis, torso,
// hand and bag stay one rigid body over the legs; the near arm swings against the near leg.
const J = { hip: [35, 66.5], knee: [35, 75], ankle: [35, 84.5] };
const NEAR = { bands: [[-0.5, '#47485e'], [0.2, '#414055'], [0.55, '#3b384c'], [0.8, '#343244'], [1, '#2d2b3c']], outline: '#10111a', ow: 1, endBands: [[3.2, '#564549'], [6.4, '#2d2b3c']], endOutline: '#070810' };
const FAR = { bands: [[-0.5, '#414055'], [0.2, '#3b384c'], [0.55, '#343244'], [0.8, '#2d2b3c'], [1, '#1f2031']], outline: '#070810', ow: 1, endBands: [[3.2, '#4b3f46'], [6.4, '#1f2031']], endOutline: '#02030d' };
function sideFrame(v, i) {
  const boot = R.cut(v, (x, y) => y >= 84), farBoot = R.recolour(boot, R.darkener(R.paletteOf(v), 0.06));
  // the near arm (sleeve, rolled cuff, hand: x 26-38, rows 46-64) swings against the near leg: sheared, up to 2 texels at the hand; the
  // texels it uncovers take the vest colour of their row (x 25)
  const arm = (x, y) => x >= 26 && x <= 38 && y >= 46 && y <= 64;
  const body = R.recolour(R.cut(v, (x, y) => y < 66), (c, x, y) => (arm(x, y) ? R.get(v, 25, y) ?? c : c));
  const A = CYCLE[i], B = CYCLE[(i + 3) % 6];
  const l1 = Math.hypot(J.knee[0] - J.hip[0], J.knee[1] - J.hip[1]), l2 = Math.hypot(J.ankle[0] - J.knee[0], J.ankle[1] - J.knee[1]);
  // body drop: the planted leg (lift 0) must reach its ankle with a slightly bent knee
  const reach = (a) => J.hip[1] + Math.sqrt(Math.max(0, ((l1 + l2) * 0.985) ** 2 - a.x * a.x));
  const drop = Math.max(0, ...[A, B].filter((a) => a.lift === 0).map((a) => Math.ceil(J.ankle[1] - reach(a))));
  const hip = [J.hip[0], J.hip[1] + drop];
  const pose = (a, style, bt, lift = a.lift) => {
    const ankle = [J.hip[0] - a.x, J.ankle[1] - lift], k = R.knee(hip, ankle, l1, l2), o = R.blank();
    // the gathered cuff flares above the boot: one more chain point 3.5 texels above the ankle, the chain widening again below it
    const sl = Math.hypot(k[0] - ankle[0], k[1] - ankle[1]), cuff = [ankle[0] + ((k[0] - ankle[0]) * 3.5) / sl, ankle[1] + ((k[1] - ankle[1]) * 3.5) / sl];
    R.limb(o, { p: [[hip[0], hip[1] - 3], k, cuff, ankle], w: [17, 14, 12, 14], ...style });
    return R.over(o, a.foot ? R.transform(bt, J.ankle, ankle, a.foot) : R.shift(bt, Math.round(ankle[0] - J.ankle[0]), Math.round(ankle[1] - J.ankle[1])));
  };
  // the planted leg's sole sits on the foot row; a lifted leg is raised further if its toe would go below it
  const near = pose(A, NEAR, boot), planted = A.lift === 0 ? near : pose(B, FAR, farBoot), fix = R.FOOT - R.bottom(planted);
  let far = pose(B, FAR, farBoot);
  if (B.lift > 0) for (let l = B.lift; R.bottom(far) + fix > R.FOOT && l < B.lift + 6; l += 0.5) far = pose(B, FAR, farBoot, l + 0.5);
  let nearL = near;
  if (A.lift > 0) for (let l = A.lift; R.bottom(nearL) + fix > R.FOOT && l < A.lift + 6; l += 0.5) nearL = pose(A, NEAR, boot, l + 0.5);
  const im = R.over(far, nearL, R.shift(body, 0, drop), R.shift(R.shear(R.cut(v, arm), 46, 64, Math.round(A.x / 4)), 0, drop));
  return { im: R.shift(im, 0, fix), drop: drop + fix };
}

// ---- front (down) / back (up): the body moves with the side view's drop; each leg is remapped between its hip band and its foot row; the
// forearms and fists swing against the legs (forward = two rows lower and one texel inwards, back = two rows higher: one-texel moves do
// not read at ~1.8 screen px per texel)
const SWING = [2, 5, 2]; // lift of the swing leg on frames 0..2 of its swing (toe-off, passing, reach); it lands on the next contact
const ARM = [1, 0, -0.5, -1, 0, 0.5]; // how far forward arm 1 (screen right) is; arm 0 is the opposite
const FB = {
  down: { hipY: 66, top: 2, legs: [{ cols: (x) => x <= 35, foot: 90, bottom: 13, inward: 1 }, { cols: (x) => x >= 36, foot: 88, bottom: 11, inward: -1 }],
    arms: [R.rect(13, 52, 22, 65), R.rect(47, 50, 54, 65)] },
  up: { hipY: 66, top: 2, legs: [{ cols: (x) => x <= 33, foot: 90, bottom: 12, inward: 1 }, { cols: (x) => x >= 34, foot: 89, bottom: 11, inward: -1 }],
    arms: [R.rect(9, 48, 19, 66), R.rect(42, 46, 52, 64)] },   // the right one to x 52 (Pass 4A-duovicies): the sleeve and its outline columns
                                                               // 50-52 stayed put when the forearm moved in, a seam down the arm (back walk 0)
};
/** a forearm moved down (dy > 0): R.movePart, then the dy rows it uncovers at the top of its mask take, column by column, the texel just
 *  above the mask: the sleeve continues down (a dy-row stretch of the sleeve). Pass 4A-duovicies: movePart filled them sideways with the
 *  vest's dark colour or left them transparent, a band cutting the sleeve (front walk 2-3) and a 5 x 2 hole in the back (back walk 5) */
function forearmDown(im, m, dx, dy, inward) {
  const o = R.movePart(im, m, dx, dy, inward);
  for (let y = 1; y < im.H; y++) for (let x = 0; x < im.W; x++) {
    if (!m(x, y) || m(x, y - 1) || !R.opaque(im, x, y - 1)) continue;   // the mask's top texel in this column, under an opaque texel
    let armHere = false; for (let t = y; m(x, t); t++) if (R.opaque(im, x, t)) { armHere = true; break; }   // the forearm has texels in this column
    for (let k = 0; k < dy && m(x, y + k); k++) {
      const covered = m(x - dx, y + k - dy) && R.opaque(im, x - dx, y + k - dy);   // the moved forearm lands there
      if (!covered && armHere) R.put(o, x, y + k, R.get(im, x, y - 1));
    }
  }
  return o;
}
function frontBack(v, o, i) {
  const bob = BOB[i], swing = i < 3 ? 1 : 0, k = i % 3;   // frames 0-2: leg 1 (screen right) swings, 3-5: leg 0
  // Pass 4A-duovicies: an arm mask may reach hipY (the left back fist's bottom outline, row 66): those texels move with the arm, and the legs'
  // copy of the view gets the leg texel just under them in its column there, else nothing (the outline stayed on the leg: a loose dark dash
  // beside the thigh when the fist rose, back walk 0 / 5)
  const inArms = (x, y) => o.arms.some((m) => m(x, y));
  let upper = R.cut(v, (x, y) => y < o.hipY || inArms(x, y));
  const vLegs = R.clone(v);
  for (let y = o.hipY; y < v.H; y++) for (let x = 0; x < v.W; x++) {
    if (!inArms(x, y) || !R.opaque(v, x, y)) continue;
    let c = null; for (let k = 1; k <= 2 && !c; k++) if (!inArms(x, y + k) && R.opaque(v, x, y + k)) c = R.get(v, x, y + k);
    R.put(vLegs, x, y, c);
  }
  o.arms.forEach((m, j) => {
    const fwd = j ? ARM[i] : -ARM[i], inward = j ? -1 : 1;
    const dy = 2 * (fwd > 0 ? Math.round(fwd) : -Math.round(-fwd)), dx = fwd >= 1 ? inward : 0;
    if (dx || dy) upper = dy > 0 ? forearmDown(upper, m, dx, dy, inward) : R.movePart(upper, m, dx, dy, inward);
  });
  const body = R.shift(upper, 0, bob);
  const legs = o.legs.map((L, j) => {
    const foot = R.FOOT - (j === swing ? SWING[k] : 0);
    const src = R.cut(vLegs, (x, y) => y >= o.hipY && L.cols(x));
    return R.shift(R.remapRows(src, L.cols, o.hipY, L.foot, o.hipY + bob, foot, o.top, L.bottom), j === swing && k === 1 ? L.inward : 0, 0);
  });
  return R.over(...legs, body);
}

export function frames(V) {
  const out = [], side = [0, 1, 2, 3, 4, 5].map((i) => sideFrame(V.side, i));
  BOB = side.map((s) => s.drop);
  for (const dir of ['down', 'up', 'side']) {
    const v = V[dir];
    // idle: rest, rest, inhale, exhale with the head one frame late (rig-engine breath; the chin is about row 32 in every view)
    const [inhale, exhale] = R.breath(v, 32);
    [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
    for (let i = 0; i < 6; i++) out.push({ anim: 'walk', dir, i, im: dir === 'side' ? side[i].im : frontBack(v, FB[dir], i) });
  }
  return out;
}
