import type { FxElement } from './fxPalettes';

/**
 * The duel's FX recipes. A recipe is a timeline of primitive steps placed on anchors, the format of RPGThreeJS (dev@5cc6119e,
 * src/combat/fx/fxRecipes.ts, the operator's decision of journal Passe FX2); the recipes themselves are written for this duel. Pure data: the unit
 * tests read them in Node.
 *
 * A duel is not a turn: the simulation says when a blow lands, so a blow's recipe starts on that blow, at 0. Ren owns gold and steel, the opponent
 * the fire of his forge-red blade, guards a cold sky blue: at night the amber stays the one warm accent. The rules of RPGThreeJS hold: a shock ring
 * appears once, on the blow, nothing circular fires after it; a seal belongs to spells, and no one in this duel casts any; a cut carries its dark
 * blade under it (the engine's slash). Slow motion only on the K.O.: « le temps ne s'arrête jamais », the operator's choice of journal Passe FX2.
 * Sizes are world units, set against fighters 2.9 m tall: a blow must leave the one who takes it readable. */

export type FxAnchor = 'source' | 'sourceChest' | 'sourceGround' | 'target' | 'targetChest' | 'targetGround' | 'contact' | 'contactGround' | 'sky';

export type FxStepKind = 'slash' | 'star' | 'burst' | 'ring' | 'pillar' | 'streak' | 'bolt' | 'shards' | 'dome' | 'orb' | 'motes' | 'smoke' | 'glow' | 'decal' | 'light'
  | 'converge' | 'orbit' | 'fissure' | 'shake' | 'flash' | 'slowmo' | 'speedLines' | 'punch';

export interface FxStep {
  at: number;
  kind: FxStepKind;
  anchor?: FxAnchor;
  /** second anchor of a streak or a bolt */
  to?: FxAnchor;
  element?: FxElement;
  p?: Record<string, number | string | boolean>;
}

export interface FxRecipe {
  id: string;
  element: FxElement;
  duration: number;
  steps: FxStep[];
}

const s = (at: number, kind: FxStepKind, anchor?: FxAnchor, p?: FxStep['p'], element?: FxElement): FxStep => ({ at, kind, anchor, p, element });
const recipe = (id: string, element: FxElement, duration: number, steps: FxStep[]): FxRecipe => ({ id, element, duration, steps });

const lit = (at: number, intensity: number, duration: number, anchor: FxAnchor = 'targetChest', element?: FxElement): FxStep => s(at, 'light', anchor, { intensity, duration }, element);

/** what every landed blow shares: the star on the body, its sparks thrown on along the blow, the light */
function landed(at: number, size: number, sparks: number, light: number): FxStep[] {
  return [
    s(at, 'star', 'targetChest', { size }),
    s(at, 'burst', 'targetChest', { count: sparks, speed: 3.6 + size, size: 0.1 + size * 0.02, spray: 'through', cone: 1.4, gravity: 7 }),
    lit(at, light, 0.3 + size * 0.05),
  ];
}

const lightBlow = (id: string, element: FxElement, angle: number): FxRecipe => recipe(id, element, 0.5, [
  s(0, 'slash', 'targetChest', { size: 2.6, angle, duration: 0.24 }),
  ...landed(0.02, 1.3, 16, 10),
  s(0.02, 'shake', undefined, { magnitude: 0.35 }),
]);

const heavyBlow = (id: string, element: FxElement, angle: number): FxRecipe => recipe(id, element, 0.85, [
  s(0, 'slash', 'targetChest', { size: 3.8, angle, duration: 0.3, thickness: 1 }),
  ...landed(0.02, 2.1, 36, 18),
  s(0.02, 'ring', 'targetGround', { radius: 1.9, duration: 0.42 }),
  s(0.02, 'flash', undefined, { opacity: 0.1, duration: 0.14 }),
  s(0.02, 'punch', 'targetChest', { duration: 0.32, amount: 0.7 }),
  s(0.02, 'shake', undefined, { magnitude: 1 }),
  s(0.1, 'decal', 'targetGround', { radius: 1.6 }),
  s(0.1, 'smoke', 'targetGround', { count: 8, spread: 0.6, size: 0.8 }),
]);

/** a charge reached (1 the first skill's tier, 2 and 3 the later ones; before journal Passe CH1, 1 was the heavy attack's own tier): energy drawn in
 *  on the fighter, more of it and warmer at each level */
const chargeTier = (level: 1 | 2 | 3): FxRecipe => {
  const element: FxElement = level === 1 ? 'sky' : level === 2 ? 'steel' : 'gold';
  return recipe(`charge${level}`, element, 0.8, [
    s(0, 'converge', 'source', { count: [22, 34, 52][level - 1], radius: [2.4, 3, 3.6][level - 1], duration: 0.5, height: 2.6, size: 0.12 }),
    s(0, 'ring', 'sourceGround', { radius: [1.6, 1.9, 2.2][level - 1], duration: 0.4, inward: true, from: 0.1 }),
    s(0.38, 'glow', 'sourceChest', { size: [1.6, 2.1, 2.8][level - 1], duration: 0.34 }),
    lit(0.34, [7, 11, 16][level - 1], 0.4, 'sourceChest'),
    ...(level === 3 ? [s(0.38, 'pillar', 'sourceGround', { radius: 0.28, height: 8, duration: 0.42 })] : []),
  ]);
};

/** the charge held, a breath every 0.6 s: motes climbing around the fighter */
const chargeHold = (level: 1 | 2 | 3): FxRecipe => {
  const element: FxElement = level === 1 ? 'sky' : level === 2 ? 'steel' : 'gold';
  return recipe(`hold${level}`, element, 0.7, [s(0, 'orbit', 'sourceGround', { count: [8, 12, 16][level - 1], radius: 1.5, duration: 0.7, rise: 2.8, spin: 3.4, size: 0.11 })]);
};

const WARD = (id: string, element: FxElement): FxRecipe => recipe(id, element, 1, [
  s(0, 'dome', 'sourceGround', { radius: 3, duration: 0.95 }),
  s(0, 'ring', 'sourceGround', { radius: 1.7, duration: 0.42 }),
  s(0.06, 'motes', 'sourceGround', { count: 20, radius: 1.3, rise: 2.8 }),
  lit(0, 8, 0.6, 'sourceChest'),
]);

const BOOST = (id: string, element: FxElement): FxRecipe => recipe(id, element, 1, [
  s(0, 'orbit', 'sourceGround', { count: 18, radius: 1.5, duration: 0.95, rise: 3, spin: 4.6, size: 0.12 }),
  s(0, 'converge', 'source', { count: 26, radius: 2.8, duration: 0.45, height: 2.6, size: 0.11 }),
  s(0.4, 'glow', 'sourceChest', { size: 2.2, duration: 0.4 }),
  lit(0.38, 10, 0.5, 'sourceChest'),
]);

/** the one recipe with a slow motion: the duel is over */
const KO: FxRecipe = recipe('ko', 'gold', 1.9, [
  s(0, 'slowmo', undefined, { scale: 0.32, duration: 0.65 }),
  s(0, 'flash', undefined, { opacity: 0.26, duration: 0.3 }),
  s(0, 'punch', 'targetChest', { duration: 1, amount: 1 }),
  s(0, 'speedLines', undefined, { duration: 0.55 }),
  s(0, 'star', 'targetChest', { size: 3.4, duration: 0.42 }),
  s(0, 'ring', 'targetGround', { radius: 3.2, duration: 0.6 }),
  s(0, 'burst', 'targetChest', { count: 60, speed: 7, size: 0.15, gravity: 6, life: 1 }),
  lit(0, 26, 0.9),
  s(0.03, 'pillar', 'targetGround', { radius: 0.4, height: 9, duration: 0.6 }),
  s(0.06, 'decal', 'targetGround', { radius: 2.4 }),
  s(0.12, 'smoke', 'targetGround', { count: 22, spread: 1.1, size: 1, life: 1.5 }),
  s(0.2, 'motes', 'targetGround', { count: 26, radius: 1.6, rise: 3 }),
]);

export const RECIPES: Record<string, FxRecipe> = Object.fromEntries([
  // ---- the two plain blows, each side its colour
  lightBlow('light', 'steel', -0.5), heavyBlow('heavy', 'steel', -0.35),
  lightBlow('m_slash', 'fire', 0.5), heavyBlow('m_heavy', 'fire', 0.4),
  // ---- Ren's offensive skills
  recipe('t1', 'lightning', 0.65, [ // Coup éclair: a bolt where the blade lands
    s(0, 'bolt', 'targetChest', { duration: 0.3, width: 0.1 }),
    ...landed(0.03, 1.7, 22, 16),
    s(0.03, 'flash', undefined, { opacity: 0.08, duration: 0.12 }),
    s(0.03, 'shake', undefined, { magnitude: 0.6 }),
  ]),
  recipe('t2', 'sky', 0.6, [ // Fente: one thin line through the body
    { ...s(0, 'streak', 'sourceChest', { width: 0.34, duration: 0.24 }), to: 'targetChest' },
    { ...s(0, 'streak', 'sourceChest', { width: 0.14, duration: 0.32 }), to: 'targetChest' },
    ...landed(0.03, 1.5, 18, 12),
    s(0.03, 'shake', undefined, { magnitude: 0.5 }),
  ]),
  recipe('t3', 'wind', 0.85, [ // Tourbillon: three cuts crossing, a ring that sweeps
    s(0, 'slash', 'targetChest', { size: 3, angle: -0.9, duration: 0.22 }),
    s(0.07, 'slash', 'targetChest', { size: 3.2, angle: 0.8, flip: true, duration: 0.22 }),
    s(0.14, 'slash', 'targetChest', { size: 3.6, angle: 0, duration: 0.24 }),
    s(0.14, 'ring', 'targetGround', { radius: 2.2, duration: 0.42 }),
    ...landed(0.14, 1.9, 26, 14),
    s(0.14, 'shake', undefined, { magnitude: 0.8 }),
  ]),
  recipe('t4', 'gold', 1.15, [ // Estocade: the sky falls on the point of the blade
    s(0, 'speedLines', undefined, { duration: 0.34 }),
    s(0, 'flash', undefined, { opacity: 0.16, duration: 0.2 }),
    s(0, 'pillar', 'targetGround', { radius: 0.45, height: 9, duration: 0.55 }),
    s(0, 'slash', 'targetChest', { size: 4.4, angle: -0.3, duration: 0.3, thickness: 1 }),
    s(0, 'punch', 'targetChest', { duration: 0.42, amount: 0.9 }),
    ...landed(0.02, 2.6, 46, 24),
    s(0.02, 'ring', 'targetGround', { radius: 2.6, duration: 0.46 }),
    s(0.02, 'shake', undefined, { magnitude: 1.2 }),
    s(0.1, 'decal', 'targetGround', { radius: 2 }),
  ]),
  recipe('k_sunder', 'earth', 1, [ // Sunder: the ground opens under the blow
    s(0, 'slash', 'targetChest', { size: 3.4, angle: 0, duration: 0.26 }),
    s(0.02, 'fissure', 'targetGround', { radius: 2.6, duration: 0.9 }),
    ...landed(0.02, 2, 30, 16),
    s(0.02, 'shake', undefined, { magnitude: 1 }),
  ]),
  recipe('k_feint', 'smoke', 0.6, [ // Feint: two thin cuts out of the smoke
    s(0, 'smoke', 'targetGround', { count: 8, spread: 0.5, size: 0.6 }),
    s(0, 'slash', 'targetChest', { size: 2.4, angle: -0.8, duration: 0.18, thickness: 0.5 }, 'steel'),
    s(0.07, 'slash', 'targetChest', { size: 2.4, angle: 0.8, flip: true, duration: 0.18, thickness: 0.5 }, 'steel'),
    ...landed(0.08, 1.2, 12, 8).map((x) => ({ ...x, element: 'steel' as FxElement })),
  ]),
  // ---- the rivals' offensive skills
  recipe('m_ironfall', 'fire', 1.1, [
    s(0, 'flash', undefined, { opacity: 0.14, duration: 0.18 }),
    s(0, 'pillar', 'targetGround', { radius: 0.45, height: 9, duration: 0.5 }),
    s(0, 'slash', 'targetChest', { size: 4.2, angle: 0.3, duration: 0.3, thickness: 1 }),
    s(0, 'punch', 'targetChest', { duration: 0.4, amount: 0.8 }),
    ...landed(0.02, 2.5, 42, 22),
    s(0.02, 'fissure', 'targetGround', { radius: 2.6, duration: 1 }),
    s(0.02, 'shake', undefined, { magnitude: 1.2 }),
  ]),
  recipe('m_lunge', 'ice', 0.55, [
    { ...s(0, 'streak', 'sourceChest', { width: 0.2, duration: 0.24 }), to: 'targetChest' },
    ...landed(0.03, 1.5, 16, 10),
  ]),
  recipe('m_shoulder', 'blunt', 0.75, [
    s(0, 'smoke', 'targetGround', { count: 10, spread: 0.6, size: 0.7 }),
    s(0, 'ring', 'targetGround', { radius: 1.7, duration: 0.36 }),
    ...landed(0, 1.9, 24, 14),
    s(0, 'shake', undefined, { magnitude: 0.9 }),
  ]),
  recipe('m_riposte', 'gold', 0.6, [
    s(0, 'slash', 'targetChest', { size: 2.8, angle: 0.7, flip: true, duration: 0.2, thickness: 0.6 }),
    ...landed(0.02, 1.6, 18, 12),
  ]),
  recipe('m_smite', 'holy', 0.95, [
    s(0, 'pillar', 'targetGround', { radius: 0.4, height: 9, duration: 0.5 }),
    ...landed(0.02, 2, 28, 18),
    s(0.02, 'ring', 'targetGround', { radius: 2, duration: 0.4 }),
    s(0.02, 'shake', undefined, { magnitude: 0.8 }),
  ]),
  recipe('m_wild', 'blunt', 0.7, [
    s(0, 'slash', 'targetChest', { size: 3.6, angle: 0.9, duration: 0.26, thickness: 1 }),
    s(0.1, 'slash', 'targetChest', { size: 3.6, angle: -0.6, flip: true, duration: 0.26, thickness: 1 }),
    ...landed(0.1, 1.8, 22, 12),
  ]),
  recipe('m_cleave', 'earth', 1, [
    s(0, 'slash', 'targetChest', { size: 4.2, angle: 0.1, duration: 0.32, thickness: 1 }),
    s(0.02, 'fissure', 'targetGround', { radius: 2.8, duration: 1 }),
    ...landed(0.02, 2.4, 38, 20),
    s(0.02, 'shake', undefined, { magnitude: 1.2 }),
  ]),
  // ---- a blow stopped: cold light at the contact of the blades, sparks thrown back
  recipe('guard', 'sky', 0.5, [
    s(0, 'star', 'contact', { size: 1.4, duration: 0.22 }),
    s(0, 'burst', 'contact', { count: 16, speed: 4.6, size: 0.1, spray: 'back', cone: 1.5, gravity: 8 }),
    lit(0, 8, 0.24, 'contact'),
  ]),
  recipe('guardHeavy', 'sky', 0.7, [
    s(0, 'star', 'contact', { size: 2, duration: 0.28 }),
    s(0, 'burst', 'contact', { count: 30, speed: 5.6, size: 0.12, spray: 'back', cone: 1.6, gravity: 8 }),
    s(0, 'ring', 'contact', { radius: 1.2, duration: 0.3, ground: false, from: 0.2 }),
    lit(0, 14, 0.3, 'contact'),
    s(0, 'shake', undefined, { magnitude: 0.5 }),
  ]),
  // ---- a gauge breaks: the guard shatters, its light goes out
  recipe('break', 'sky', 1.1, [
    s(0, 'flash', undefined, { opacity: 0.16, duration: 0.2 }),
    s(0, 'ring', 'targetChest', { radius: 1.7, duration: 0.36, ground: false, from: 0.3 }),
    s(0, 'star', 'targetChest', { size: 2.4, duration: 0.34 }),
    s(0, 'burst', 'targetChest', { count: 44, speed: 6.4, size: 0.15, gravity: 11, life: 1 }),
    s(0, 'burst', 'targetChest', { count: 22, speed: 4, size: 0.12, gravity: 9, life: 0.8 }, 'steel'),
    s(0, 'punch', 'targetChest', { duration: 0.42, amount: 0.8 }),
    lit(0, 20, 0.5),
    s(0, 'shake', undefined, { magnitude: 1.2 }),
    s(0.1, 'orb', 'targetChest', { radius: 0.9, duration: 0.42, implode: true }),
  ]),
  KO,
  recipe('release', 'gold', 0.4, [
    s(0, 'star', 'sourceChest', { size: 1.6, duration: 0.2 }),
    s(0, 'speedLines', undefined, { duration: 0.24 }),
    lit(0, 10, 0.24, 'sourceChest'),
  ]),
  chargeTier(1), chargeTier(2), chargeTier(3), chargeHold(1), chargeHold(2), chargeHold(3),
  // ---- wards and boosts: the shared shapes, each caster's colour
  WARD('d1', 'holy'), WARD('m_bulwark', 'fire'), WARD('m_brace', 'blunt'), WARD('m_aegis', 'holy'), WARD('m_hide', 'earth'), WARD('k_iron', 'sky'), WARD('k_parry', 'steel'),
  BOOST('s1', 'gold'), BOOST('k_cry', 'steel'), BOOST('k_focus', 'sky'), BOOST('m_resolve', 'fire'), BOOST('m_tempo', 'ice'), BOOST('m_gild', 'gold'), BOOST('m_prayer', 'holy'), BOOST('m_grit', 'earth'), BOOST('m_roar', 'blood'),
].map((r) => [r.id, r]));

/** the form of the day's sign (the operator's LC6-7 « Les deux signes », journal Passe LC7; shown as a candidate on the sheet of journal Passe LC6): at the start of the
 *  bout, a fighter in good form rises in motes of its colour round a small warm glow (Ren's gold, the opponent's forge-red), one in poor form lets grey motes fall
 *  to a little smoke; under a second (FX4's exception), nothing circular. Apart from RECIPES: its sound is computed in the page (src/audio/formCue.ts), not one of the
 *  band's baked sounds one to one with the recipes */
const formUp = (id: string, element: FxElement): FxRecipe => recipe(id, element, 0.9, [
  s(0, 'orbit', 'sourceGround', { count: 16, radius: 1.1, duration: 0.85, rise: 3.2, spin: 2.6, size: 0.1 }),
  s(0.1, 'glow', 'sourceChest', { size: 0.9, duration: 0.4 }),
  lit(0.1, 5, 0.5, 'sourceChest'),
]);
export const FORM_RECIPES: Record<string, FxRecipe> = {
  formUp: formUp('formUp', 'gold'),
  formUpFoe: formUp('formUpFoe', 'fire'),
  formDown: recipe('formDown', 'smoke', 0.9, [s(0, 'motes', 'sourceGround', { count: 14, radius: 0.7, sink: true }), s(0.15, 'smoke', 'sourceGround', { count: 10, spread: 0.6, size: 0.9, life: 1 })]),
};
/** the sign's recipe for a fighter */
export const formRecipe = (sign: string, who: string): FxRecipe => FORM_RECIPES[sign === 'down' ? 'formDown' : who === 'ren' ? 'formUp' : 'formUpFoe'];

/** a landed blow's recipe: its own, else the plain blow of its weight and side */
export function blowRecipe(action: string, kind: string, from: string): FxRecipe {
  return RECIPES[action] ?? RECIPES[from === 'ren' ? (kind === 'heavy' ? 'heavy' : 'light') : kind === 'heavy' ? 'm_heavy' : 'm_slash'];
}

/** a ward's or a boost's recipe: its own, else the shared shape */
export function effectRecipe(action: string, family: string): FxRecipe {
  return RECIPES[action] ?? RECIPES[family === 'defensive' ? 'd1' : 's1'];
}

/** the charge's level for a tier (0 the light attack: nothing; the first skill's tier 1; the tiers after it, the first half 2, the last 3; journal
 *  Passe CH1: the heavy attack, a skill, has no tier of its own, so the level 1 is the first of the four) */
export function chargeLevel(idx: number, tiers: number): 0 | 1 | 2 | 3 {
  if (idx <= 0) return 0;
  if (idx === 1) return 1;
  return idx - 2 < Math.ceil((tiers - 2) / 2) ? 2 : 3;
}
