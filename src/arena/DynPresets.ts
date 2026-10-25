import type { DynamicSim } from '../combat/dynamic';

/** The scripted moments of the « tour par tour dynamique » (journal Passe C2), as `Presets.ts` holds today's: for deterministic captures,
 *  the HUD's text measurement and the reviews of the operator's trial. A step's `act` runs once its `until` holds, the simulation steps in
 *  between; `ArenaApp.jump` runs one from a reset and delivers every step to the presentation. The opponent's own schedule (its first
 *  sequence at 1 s) is held off (`aiWait`) wherever the moment is the player's. */
export interface DynPresetStep { until: (s: DynamicSim) => boolean; act?: (s: DynamicSim) => void }
export interface DynPreset { label: string; script: DynPresetStep[] }

const hold = (s: DynamicSim) => { s.f.marek.aiWait = 1e9; };
const landed = (dt: number) => (s: DynamicSim) => { const a = s.f.ren.act; return !!a && a.impacted && a.t >= a.def.prep + a.def.impactAt + dt; };
const foeLanded = (dt: number) => (s: DynamicSim) => { const a = s.f.marek.act; return !!a && a.impacted && a.t >= a.def.prep + a.def.impactAt + dt; };

export const DYN_PRESETS: Record<string, DynPreset> = {
  calm: { label: 'Duel (calme)', script: [{ until: (s) => s.t >= 0.6, act: hold }] },
  charging: { label: 'Duel (calme)', script: [{ until: (s) => s.t >= 0.6 }] },
  strike: { label: 'Attaque légère', script: [{ until: (s) => s.t >= 0.3, act: (s) => { hold(s); s.command('ren', 'light'); } }, { until: landed(0.03) }] },
  prep: { label: 'Préparation (attaque puissante)', script: [{ until: (s) => s.t >= 0.3, act: (s) => { hold(s); s.command('ren', 'heavy'); } }, { until: (s) => !!s.f.ren.act && s.f.ren.act.t >= 0.2 }] },
  heavyRen: { label: 'Attaque puissante (Ren)', script: [{ until: (s) => s.t >= 0.3, act: (s) => { hold(s); s.command('ren', 'heavy'); } }, { until: (s) => { const a = s.f.ren.act; return !!a && a.t >= a.def.prep + a.def.impactAt - 0.12; } }] },
  skillPrep: { label: 'Préparation (Estocade)', script: [{ until: (s) => s.t >= 0.3, act: (s) => { hold(s); s.f.ren.ap = 5; s.command('ren', 't4'); } }, { until: (s) => !!s.f.ren.act && s.f.ren.act.t >= 0.45 }] },
  technique: { label: 'Compétence offensive', script: [{ until: (s) => s.t >= 0.3, act: (s) => { hold(s); s.f.ren.ap = 5; s.command('ren', 't4'); } }, { until: landed(0.08) }] },
  ward: { label: 'Rempart', script: [{ until: (s) => s.t >= 0.3, act: (s) => { hold(s); s.f.ren.ap = 5; s.command('ren', 'd1'); } }, { until: (s) => !!s.f.ren.ward && s.f.ren.ward.left <= s.f.ren.ward.dur - 0.15 }] },
  boost: { label: 'Ferveur', script: [{ until: (s) => s.t >= 0.3, act: (s) => { hold(s); s.f.ren.ap = 5; s.command('ren', 's1'); } }, { until: (s) => !!s.f.ren.boost && s.f.ren.boost.left <= s.f.ren.boost.dur - 0.15 }] },
  combo: { label: 'Séquence adverse (défense)', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.forceSequence(['m_slash', 'm_slash', 'm_heavy']); } }, { until: (s) => { const m = s.f.marek; return m.state === 'acting' && m.seqIdx === 1 && m.act!.t >= 0.12; } }] },
  denied: { label: 'Attaque refusée en défense', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.forceSequence(['m_slash', 'm_slash', 'm_heavy']); } }, { until: (s) => s.f.marek.seqIdx === 2 && !!s.f.marek.act && s.f.marek.act.t >= 0.05, act: (s) => { s.command('ren', 'light'); } }, { until: (s) => !!s.f.marek.act && s.f.marek.act.t >= 0.12 }] },
  window: { label: 'Fenêtre d\'esquive', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.forceSequence(['m_heavy']); } }, { until: (s) => { const i = s.incoming(); return !!i && i.windowOpen && i.windowProgress >= 0.4; } }] },
  block: { label: 'Garde', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.setGuard('ren', true); } }, { until: (s) => s.t >= 0.5, act: (s) => { s.forceSequence(['m_slash']); } }, { until: foeLanded(0.07) }] },
  guardHeavy: { label: 'Coup puissant gardé', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.setGuard('ren', true); } }, { until: (s) => s.t >= 0.5, act: (s) => { s.forceSequence(['m_heavy']); } }, { until: foeLanded(0.1) }] },
  dodge: { label: 'Esquive', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.forceSequence(['m_slash']); } }, { until: (s) => { const i = s.incoming(); return !!i && i.windowOpen && i.windowProgress >= 0.15; }, act: (s) => { s.react('ren', 'dodge'); } }, { until: foeLanded(0.18) }] },
  impact: { label: 'Impact subi', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.forceSequence(['m_heavy']); } }, { until: foeLanded(0.07) }] },
  pushed: { label: 'Repoussé', script: [{ until: (s) => s.t >= 0.3, act: (s) => { s.f.ren.ap = 5; s.command('ren', 't4'); s.forceSequence(['m_slash', 'm_heavy']); } }, { until: (s) => s.f.ren.state === 'pushed' && s.f.ren.stateT >= 0.12 }] },
  foeBreak: { label: 'Break de l\'adversaire', script: [{ until: (s) => s.t >= 0.3, act: (s) => { hold(s); s.f.marek.resist = s.D.resist.max - 1; s.command('ren', 'light'); } }, { until: (s) => s.f.marek.state === 'stunned' && s.f.marek.stateT >= 0.35 }] },
  broken: { label: 'Break du joueur', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.f.ren.resist = s.D.resist.max - 1; s.forceSequence(['m_slash']); } }, { until: (s) => s.f.ren.state === 'stunned' && s.f.ren.stateT >= 0.35 }] },
  ko: { label: 'Adversaire à terre', script: [{ until: (s) => s.t >= 0.3, act: (s) => { hold(s); s.f.marek.hp = 20; s.f.ren.ap = 5; s.command('ren', 't4'); } }, { until: (s) => s.over && s.f.marek.stateT >= 0.6 }] },
  koRen: { label: 'Joueur à terre', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.f.ren.hp = 10; s.forceSequence(['m_heavy']); } }, { until: (s) => s.over && s.f.ren.stateT >= 0.6 }] },
};

/** runs a moment's script on the simulation (each step delivered through `onStep`); the time it ends at */
export function runDynScript(sim: DynamicSim, script: DynPresetStep[], onStep?: () => void): number {
  let i = 0, ticks = 0;
  const max = 60 / sim.D.dt;
  while (i < script.length && ticks++ < max) {
    const st = script[i];
    if (st.until(sim)) { st.act?.(sim); i++; continue; }
    sim.step(sim.D.dt);
    if (onStep) onStep(); else sim.drain();
  }
  return sim.t;
}
