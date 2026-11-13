import { AUTO_RULES } from '../combat/auto';
import { AUTO_CADENCE } from '../combat/autoData';

/** DEV only, a trial parameter of lot 2's rhythm sheet (journal Passe SL3; removed after the operator's choice, VD-8): `autotempo=<s>,<k>[,<gap>]` plays the duel
 *  played by the computer at a rhythm candidate before the arena builds its duel. `s` stretches every time of the duel against SY-03's (its charges and so its
 *  cooldowns, an enchaînement's gaps unless `gap` is given, the wards' and boosts' length: the same actions under them, the first draw); `k` weighs each blow
 *  against SY-03's (its power and its gauge), so that the duel lasts about `s / k` of today's; the gauge's decay follows (× k / s: the same breaks a duel). The
 *  stun of a break stays DB5-4's 10 s (A3). */
export function applyAutoTempo(spec: string): void {
  const [s, k, gap] = spec.split(',').map(Number);
  if (!(s > 0) || !(k > 0)) return;
  Object.assign(AUTO_CADENCE, { charge: 0.6 * s, power: 0.6 * k, gap: gap > 0 ? gap : s, effect: s });
  AUTO_RULES.gauge.decay = 0.63 * (k / s);
  AUTO_RULES.start = 0.6 * s;
}
