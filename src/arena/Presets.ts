import type { CombatSim } from './CombatSim';

/** The prototype's scripted moments (arena/arena.html, `PRESETS`), for deterministic captures and reviews (journal Passe P1): each is a
 *  list of steps, a step's `act` runs once its `until` holds, the simulation steps in between. `jump` (ArenaApp) runs the script on a
 *  scratch simulation to know when it ends, then from a reset on the real one, delivering the last half second to the presentation. */
export interface PresetStep { until: (s: CombatSim) => boolean; act?: (s: CombatSim) => void }
export interface Preset { label: string; script: PresetStep[] }

const afterImpact = (dt: number) => (s: CombatSim) => { const a = s.f.marek.act; return !!a && a.impacted && a.t >= a.def.impactAt + dt; };

export const PRESETS: Record<string, Preset> = {
  charging: { label: 'Duel (calme)', script: [{ until: (s) => s.t >= 0.6 }] },
  ready: { label: '4 PA', script: [{ until: (s) => s.t >= 0.5, act: (s) => { s.f.ren.ap = 4; } }] },
  casting: { label: 'Marek charge', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.forceAction('marek', 'm_heavy'); } }, { until: (s) => { const i = s.incoming(); return !!i && i.action === 'm_heavy' && i.castProgress >= 0.62; } }] },
  window: { label: 'Fenêtre de réaction', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.forceAction('marek', 'm_heavy'); } }, { until: (s) => { const i = s.incoming(); return !!i && i.windowOpen && i.windowProgress >= 0.4; } }] },
  impact: { label: 'Impact subi', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.forceAction('marek', 'm_heavy'); } }, { until: afterImpact(0.07) }] },
  block: { label: 'Garde (rapide)', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.setGuard('ren', true); } }, { until: (s) => s.t >= 0.5, act: (s) => { s.forceAction('marek', 'm_slash'); } }, { until: afterImpact(0.07) }] },
  guardbreak: { label: 'Garde brisée', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.setGuard('ren', true); } }, { until: (s) => s.t >= 0.5, act: (s) => { s.forceAction('marek', 'm_heavy'); } }, { until: afterImpact(0.35) }] },
  dodge: { label: 'Esquive', script: [{ until: (s) => s.t >= 0.2, act: (s) => { s.forceAction('marek', 'm_slash'); } }, { until: (s) => { const i = s.incoming(); return !!i && i.windowOpen && i.windowProgress >= 0.15; }, act: (s) => { s.react('ren', 'dodge'); } }, { until: afterImpact(0.18) }] },
  combo: { label: 'Ouverture de combo', script: [{ until: (s) => s.t >= 0.2, act: (s) => { const m = s.f.marek; m.plan = ['m_slash', 'm_slash', 'm_heavy']; m.seqLen = 3; m.seqIdx = 0; m.aiWait = 0.05; } }, { until: (s) => { const m = s.f.marek; return m.state === 'acting' && m.seqIdx === 1 && m.act!.t >= 0.12; } }] },
  single: { label: 'Coup simple', script: [{ until: (s) => s.t >= 0.2, act: (s) => { const m = s.f.marek; m.plan = ['m_slash']; m.seqLen = 1; m.seqIdx = 0; m.aiWait = 0.05; } }, { until: (s) => { const m = s.f.marek; return m.state === 'acting' && m.act!.t >= 0.06; } }] },
  technique: { label: 'Technique', script: [{ until: (s) => s.t >= 0.3, act: (s) => { s.f.marek.aiWait = 1e9; s.f.ren.ap = 5; s.command('ren', 't4'); } }, { until: (s) => { const a = s.f.ren.act; return !!a && a.impacted && a.t >= a.def.impactAt + 0.08; } }] },
  // the game's own additions: Ren's light and heavy strikes landing, and a KO
  strike: { label: 'Attaque rapide', script: [{ until: (s) => s.t >= 0.3, act: (s) => { s.f.marek.aiWait = 1e9; s.command('ren', 'light'); } }, { until: (s) => { const a = s.f.ren.act; return !!a && a.impacted && a.t >= a.def.impactAt + 0.03; } }] },
  heavyRen: { label: 'Attaque puissante (Ren)', script: [{ until: (s) => s.t >= 0.3, act: (s) => { s.f.marek.aiWait = 1e9; s.command('ren', 'heavy'); } }, { until: (s) => { const a = s.f.ren.act; return !!a && a.t >= a.def.impactAt - 0.12; } }] },
  ko: { label: 'Marek à terre', script: [{ until: (s) => s.t >= 0.3, act: (s) => { s.f.marek.aiWait = 1e9; s.f.marek.hp = 20; s.f.ren.ap = 5; s.command('ren', 't4'); } }, { until: (s) => s.over && s.f.marek.stateT >= 0.6 }] },
};

/** runs a preset's script; `deliver` sees the events of every step whose time is at or past `from` (the presentation's warm-up) */
export function runScript(sim: CombatSim, script: PresetStep[], deliver?: (from: number) => boolean, onStep?: () => void): number {
  let i = 0, ticks = 0;
  const max = 60 / sim.D.dt;
  while (i < script.length && ticks++ < max) {
    const st = script[i];
    if (st.until(sim)) { st.act?.(sim); i++; continue; }
    sim.step(sim.D.dt);
    if (deliver?.(sim.t)) onStep?.(); else sim.drain();
  }
  return sim.t;
}
