// Rig of merchant-x2-v2: idle (4 frames), walk (6 frames) and talk (6 frames) in the three runtime facings, cut out of three reconstructed views of the
// reference sheet's NPC 02, "Merchant (Female)" (front, back, profile: the sheet's 1st, 3rd and 4th views, same pitch as the dock worker,
// one joint 64-colour palette). Her legs are under the dress: the walk moves her boots under the hem, sways the hem and bobs the body.
// Deterministic: `node tools/art-lab/build-character.mjs art-lab/characters/rigs/merchant-x2-v2.rig.mjs`.
import * as R from '../../../tools/art-lab/rig-engine.mjs';

export const id = 'merchant-x2-v2';

export const source = {
  sheet: 'art-lab/characters/reference/sources/merchant-district-night-npc-01-16.webp',
  pitch: 1.775,
  views: { down: '388,117,452,272', up: '546,121,608,272', side: '620,122,683,272' },
  palette: { k: 64 },
};

/** recorded edits of the reconstructed views: dark sheet-shadow remnants below the hem removed; the profile mirrored to face left, its stray
 *  shadow column (x 19, rows 87-90) removed, then moved 2 texels right and 1 down (feet centred on the anchor column, soles on row 90) */
export function prepare(dir, v) {
  if (dir === 'down') return R.erase(v, R.rect(14, 86, 18, 87));
  if (dir === 'up') return R.erase(v, R.rect(32, 86, 32, 89));
  return R.shift(R.erase(R.mirror(v), R.rect(19, 87, 19, 90)), 2, 1);
}

// ---- gait (the dock worker's timing: 6 frames at 7.5 frames / s, one step = 3 frames). BOB = body drop in rows (lowest at contact).
const BOB = [1, 0, 0, 1, 0, 0];
const SWING = [1, 3, 1];                      // lift of the swing boot on frames 0..2 of its swing (front / back): it stays partly visible
const SHIFT = [0, 2, 1, 0, -2, -1];           // weight shift over the planted boot, 2 texels at mid-stance (front / back)
const HEM = [-1, -2, -2, 1, 2, 2];            // the hem lags behind the weight shift (texels at the hem, front / back)
/** front / back: the body (dress included) bobs and shifts its weight over the planted boot, the hem lags behind; each boot is a rigid part
 *  drawn BEHIND the dress, planted on row 90 or lifted (a lifted boot slides partly up under the hem) */
const FB = {
  down: { split: 28, feet: [89, 90], inward: [1, -1] },
  up: { split: 31, feet: [89, 90], inward: [1, -1] },
};
function frontBack(v, o, i) {
  const bob = BOB[i], swing = i < 3 ? 0 : 1, k = i % 3;   // frames 0-2: boot 0 (screen left) swings, 3-5: boot 1
  // the swing leg's knee lifts the hem on its side by one row (rows 78-85 of that half move up; the boot shows below)
  const half = swing ? (x) => x > o.split : (x) => x <= o.split;
  const dress = R.movePart(R.cut(v, (x, y) => y <= 85), (x, y) => y >= 78 && half(x), 0, k === 1 ? -1 : 0, swing ? -1 : 1, 0);
  const body = R.shift(R.shear(dress, 68, 85, HEM[i]), SHIFT[i], bob);
  const boots = [0, 1].map((j) => {
    const b = R.cut(v, (x, y) => y >= 86 && (j ? x > o.split : x <= o.split));
    const foot = R.FOOT - (j === swing ? SWING[k] : 0);
    return R.shift(b, j === swing && k === 1 ? o.inward[j] : 0, foot - o.feet[j]);
  });
  return R.over(...boots, body);
}
// side (facing left): the near boot (the view's own, x 30-41) and a darker copy for the far one, placed by the dock worker's ankle cycle
// (+ = forward); the hem shears forward with the near leg
const CYCLE = [{ x: 7, lift: 0 }, { x: 2.3, lift: 0 }, { x: -2.3, lift: 0 }, { x: -7, lift: 1 }, { x: -1, lift: 3 }, { x: 4.5, lift: 1 }];
const ANKLE = [36, 86], HIPX = 31;
function sideFrame(v, i) {
  const boot = R.cut(v, (x, y) => y >= 86 && x >= 30), far = R.recolour(boot, R.darkener(R.paletteOf(v), 0.1));
  const A = CYCLE[i], B = CYCLE[(i + 3) % 6], bob = BOB[i];
  const body = R.shift(R.shear(R.cut(v, (x, y) => y <= 85), 70, 85, -Math.round(A.x / 3.5)), 0, bob);
  const place = (b, a) => R.shift(b, Math.round(HIPX - a.x - ANKLE[0]), -a.lift);
  return R.over(place(far, B), place(boot, A), body);
}

// talk: the nod moves the head (rows < 38, the chin) one row down over the collar; open mouth: a dark red-brown dash of the palette (#4c2927) under the closed mouth's skin shade, lower lip in the darker skin tone
const MOUTH = {
  down: [{ x: 26, y: 35, c: '#4c2927' }, { x: 27, y: 35, c: '#4c2927' }, { x: 27, y: 36, c: '#e9ac86' }],
  up: [],
  side: [{ x: 22, y: 34, c: '#4c2927' }, { x: 23, y: 34, c: '#5b3938' }],
};

export function frames(V) {
  const out = [];
  for (const dir of ['down', 'up', 'side']) {
    const v = V[dir];
    // idle: rest, rest, inhale (rows 40..55 stretched, above one row up; the dress below does not move), exhale with the head one frame late
    const [inhale, exhale] = R.breath(v, 38, 40, 60);
    [R.clone(v), R.clone(v), inhale, exhale].forEach((im, i) => out.push({ anim: 'idle', dir, i, im }));
    for (let i = 0; i < 6; i++) out.push({ anim: 'walk', dir, i, im: dir === 'side' ? sideFrame(v, i) : frontBack(v, FB[dir], i) });
    // talk (the hawker of the hero stall, like the generated merchant): mouth closed / open (the back view shows no mouth: two still frames)
    // talk, 6 frames at 4 frames / s: mouth closed / open three times, the head nodding once per cycle (frame 3), not on every syllable
    const open = R.patch(v, MOUTH[dir]), nod = R.over(R.erase(open, (x, y) => y < 38), R.shift(R.cut(open, (x, y) => y < 38), 0, 1));
    [R.clone(v), open, R.clone(v), nod, R.clone(v), open].forEach((im, i) => out.push({ anim: 'talk', dir, i, im }));
  }
  return out;
}
