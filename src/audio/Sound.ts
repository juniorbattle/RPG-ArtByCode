import { Rng } from '../core/rng';
import { AudioLoader } from './baked';
import { LayerSet } from './layers';
import { ambienceOf, CALL_PAN, ceilingCurve, dbGain, DEFAULT_SETTINGS, DUCK, DUCK_AMBIENCE, duelCue, FADE, hz, LIMITER, MIX, NOISE_SECONDS, noiseSamples, NOW_KEY, readNow, readSettings, resumeAt, roomImpulse, SEND, take, tune, tuneKey, TURN_REST, UI_EFFECTS, type Ambience, type Effect, type Look, type NowPlaying, type SoundPlace, type SoundSettings, type Voice } from './score';
import { installSoundHooks } from './hooks';

/** The version 2's sound engine (lot V8, journal Passe V8; lots S0 and S1, journal Passes SN2 / SN3): Web Audio only, every sound written in
 *  src/audio/score.ts or baked under a manifest (src/audio/baked.ts). Four buses go through a limiter to the volume: the ambience and the music, which
 *  step back under a blow, the effects and the interface, with a room's reverberation on a send. A page's sound comes up and goes down with it, and the
 *  music takes up where it was on the next page (SA-15): the record is kept for the tab. Nothing starts before a gesture of the person (the browsers'
 *  rule: the context is created, or resumed, on the first key or click; after a gesture on an earlier page of the tab the browser may let it go on by
 *  itself); the volume, the music's share and the mute are kept in the browser (a convenience: a blocked storage gives the defaults). Only the version
 *  2's pages create it. */

const KEY = 'cdt-v2-sound';
type Bus = 'ambience' | 'music' | 'fx' | 'ui';

export class Sound {
  ctx: AudioContext | null = null;
  settings: SoundSettings;
  /** the buses, by name (the tools mute them one by one) */
  buses: Record<Bus, GainNode> | null = null;
  private master: GainNode | null = null;
  /** the page's fade, on the music and the ambience: an effect is heard at once, the first click of a page too */
  private fade: GainNode | null = null;
  private ducks: { music: GainNode; ambience: GainNode } | null = null;
  private room: GainNode | null = null;
  private reverb: ConvolverNode | null = null;
  private roomOf: SoundPlace | null = null;
  private noise: AudioBuffer | null = null;
  /** what a scene owns: its groups, faded together, and what stops it */
  private scene: { groups: GainNode[]; stops: Array<() => void> } = { groups: [], stops: [] };
  private want: { place: SoundPlace; look: Look; boutDay: boolean; seed: number } | null = null;
  /** its own draws: a sound never takes from the game's random numbers */
  private rng = new Rng(0x50f7).fork('sound');
  private last: Partial<Record<Effect, number>> = {};
  /** the context runs and the page's sound has come up */
  private begun = false;
  private leftAt: number | null = null;
  /** where the previous page left the music */
  private resume: NowPlaying | null;
  private playing: { key: string; t0: number; period: number } | null = null;
  private layered: { key: string; set: LayerSet } | null = null;
  private files: AudioLoader | null = null;
  private tap: AnalyserNode | null = null;

  constructor() {
    let stored: string | null = null, now: string | null = null;
    try { stored = localStorage.getItem(KEY); now = sessionStorage.getItem(NOW_KEY); } catch { /* storage blocked: the defaults */ }
    this.settings = readSettings(stored);
    this.resume = readNow(now);
    const start = () => { void this.unlock(); };
    window.addEventListener('pointerdown', start, { once: false });
    window.addEventListener('keydown', start, { once: false });
    window.addEventListener('pagehide', () => this.save());
    window.addEventListener('pageshow', (e) => { if (e.persisted) { this.leftAt = null; this.fadeTo(1, FADE.in); } });
    // a gesture on an earlier page of this tab: the browser may let the sound go on by itself; if it refuses, the next gesture starts it
    if (this.resume?.heard) void this.unlock();
  }

  /** the first gesture: the context, its buses, the noise buffer, then the ambience and the music asked for so far */
  async unlock(): Promise<void> {
    if (this.ctx) { if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => {}); return; }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const c = this.ctx = new Ctx();
    // the buses go to the mix, the mix through the limiter to the volume: the ceiling holds at any volume, and the volume never drives the limiter
    const mix = c.createGain(), comp = c.createDynamicsCompressor(), half = c.createGain(), ceiling = c.createWaveShaper();
    comp.threshold.value = LIMITER.threshold; comp.knee.value = LIMITER.knee; comp.ratio.value = LIMITER.ratio; comp.attack.value = LIMITER.attack; comp.release.value = LIMITER.release;
    half.gain.value = 0.5; ceiling.curve = ceilingCurve() as Float32Array<ArrayBuffer>; ceiling.oversample = '4x';
    this.fade = c.createGain(); this.fade.gain.value = 0;
    this.master = c.createGain();
    this.fade.connect(mix); mix.connect(comp); comp.connect(half); half.connect(ceiling); ceiling.connect(this.master); this.master.connect(c.destination);
    const bus = (): GainNode => { const g = c.createGain(); g.connect(mix); return g; };
    const stepsBack = (): GainNode => { const g = c.createGain(); g.connect(this.fade!); return g; };
    this.ducks = { music: stepsBack(), ambience: stepsBack() };
    this.buses = { ambience: c.createGain(), music: c.createGain(), fx: bus(), ui: bus() };
    this.buses.music.connect(this.ducks.music); this.buses.ambience.connect(this.ducks.ambience);
    this.room = c.createGain(); this.room.gain.value = dbGain(MIX.reverb); this.room.connect(mix);
    const n = c.createBuffer(2, c.sampleRate * NOISE_SECONDS, c.sampleRate);
    n.getChannelData(0).set(noiseSamples(n.length, 0x12345)); n.getChannelData(1).set(noiseSamples(n.length, 0x6789a));
    this.noise = n;
    this.apply(true);
    this.setRoom(this.want?.place ?? 'district');
    c.addEventListener('statechange', () => this.begin());
    this.begin();
    if (c.state === 'suspended') void c.resume().catch(() => {});
  }

  /** the context runs: the page's sound comes up, with the scene asked for so far */
  private begin(): void {
    if (this.begun || this.ctx?.state !== 'running') return;
    this.begun = true;
    this.fadeTo(1, FADE.in);
    if (this.want) this.setScene(this.want.place, this.want.look, this.want.boutDay, this.want.seed);
  }
  private fadeTo(v: number, secs: number): void {
    if (!this.ctx || !this.fade) return;
    const g = this.fade.gain, t = this.ctx.currentTime;
    g.cancelScheduledValues(t); g.setTargetAtTime(v, t, secs / 3);
  }

  /** the page is going: its sound goes down and its place is kept. Returns what the fade still needs, in ms */
  leave(): number {
    if (!this.begun) return 0;
    if (this.leftAt === null) { this.leftAt = performance.now(); this.fadeTo(0, FADE.out); this.save(); }
    return Math.max(0, FADE.out * 1000 - (performance.now() - this.leftAt));
  }
  private save(): void {
    const n = this.nowPlaying() ?? this.resume, rec: NowPlaying = { key: n?.key ?? '', pos: n?.pos ?? 0, heard: this.begun || this.resume?.heard === true, at: Date.now() };
    try { sessionStorage.setItem(NOW_KEY, JSON.stringify(rec)); } catch { /* not kept: the next page starts over */ }
  }
  /** what the music is and where it stands */
  nowPlaying(): { key: string; pos: number } | null {
    const c = this.ctx; if (!c) return null;
    if (this.layered) return { key: this.layered.key, pos: this.layered.set.position() };
    if (!this.playing) return null;
    const { key, t0, period } = this.playing;
    return { key, pos: (((c.currentTime - t0) % period) + period) % period };
  }

  set(p: Partial<SoundSettings>): void {
    Object.assign(this.settings, p);
    try { localStorage.setItem(KEY, JSON.stringify(this.settings)); } catch { /* not kept */ }
    this.apply();
  }
  private apply(now = false): void {
    if (!this.ctx || !this.master || !this.buses) return;
    const t = this.ctx.currentTime, s = this.settings, b = this.buses;
    const to = (g: GainNode, v: number) => { if (now) g.gain.value = v; else g.gain.setTargetAtTime(v, t, 0.05); };
    to(this.master, s.muted ? 0 : s.volume);
    to(b.music, dbGain(MIX.music) * s.music / DEFAULT_SETTINGS.music);
    to(b.ambience, dbGain(MIX.ambience)); to(b.fx, dbGain(MIX.fx)); to(b.ui, dbGain(MIX.ui));
  }

  /** a send to the room, at a level */
  private send(node: AudioNode, level: number): void {
    const s = this.ctx!.createGain(); s.gain.value = level; node.connect(s); s.connect(this.reverb!);
  }
  /** the room of a place: its impulse computed once, the place's first scene */
  private setRoom(place: SoundPlace): void {
    if (this.roomOf === place) return;
    const c = this.ctx!, [l, r] = roomImpulse(place, c.sampleRate), b = c.createBuffer(2, l.length, c.sampleRate);
    b.getChannelData(0).set(l); b.getChannelData(1).set(r);
    this.roomOf = place;
    this.reverb?.disconnect();
    this.reverb = c.createConvolver(); this.reverb.buffer = b; this.reverb.connect(this.room!);
  }

  /** an effect now: one take of its recipe (never the take before), at its place in the stereo field, on its bus; the music steps back under a blow */
  play(e: Effect, gain = 1, at: { pan?: number; rate?: number } = {}): void {
    const c = this.ctx; if (!c || !this.begun || !this.buses || !this.reverb || this.settings.muted) return;
    const t0 = c.currentTime + 0.005, { voices, k } = take(e, () => this.rng.next(), this.last[e]), ui = UI_EFFECTS.has(e);
    this.last[e] = k;
    const pan = c.createStereoPanner(); pan.pan.value = at.pan ?? 0; pan.connect(ui ? this.buses.ui : this.buses.fx);
    if (!ui) this.send(pan, SEND.fx);
    for (const v of voices) this.voice(v, t0, gain, pan, at.rate ?? 1);
    this.duck(e);
  }
  private voice(v: Voice, t0: number, gain: number, out: AudioNode, rate: number): void {
    const c = this.ctx!, t = t0 + (v.delay ?? 0), g = c.createGain(), f0 = v.f0 * rate, f1 = Math.max(20, v.f1 * rate), end = t + v.attack + v.decay;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v.gain * gain, t + v.attack); g.gain.exponentialRampToValueAtTime(0.0001, end);
    g.connect(out);
    if (v.wave === 'noise') {
      const b = c.createBufferSource(), f = c.createBiquadFilter(); b.buffer = this.noise; f.type = 'bandpass'; f.Q.value = v.q ?? 1;
      f.frequency.setValueAtTime(f0, t); f.frequency.exponentialRampToValueAtTime(f1, end);
      b.connect(f); f.connect(g); b.start(t, this.rng.next() * (NOISE_SECONDS - 1)); b.stop(end + 0.05);
    } else {
      const o = c.createOscillator(); o.type = v.wave; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, end);
      o.connect(g); o.start(t); o.stop(end + 0.05);
    }
  }
  /** the music and, less, the ambience step back and return: a new blow takes over from where the last one left them */
  private duck(e: Effect): void {
    const d = DUCK[e]; if (!d || !this.ducks) return;
    const t = this.ctx!.currentTime;
    for (const [node, share] of [[this.ducks.music, 1], [this.ducks.ambience, DUCK_AMBIENCE]] as const) {
      node.gain.cancelScheduledValues(t); node.gain.setTargetAtTime(dbGain(-d.db * share), t, d.attack / 3); node.gain.setTargetAtTime(1, t + d.hold, d.release / 3);
    }
  }

  /** a duel's event (its table is duelCue, src/audio/score.ts) */
  duelEvent(e: { type: string } & Record<string, unknown>): void {
    const q = duelCue(e); if (q) this.play(q.effect, q.gain ?? 1, q);
  }

  /** synchronous layers on the music bus (a piece of the lots S3 and S4), taken up where it stood if it is the piece the last page played */
  layers(key: string, stems: readonly AudioBuffer[], bar: number, levels: readonly number[]): LayerSet | null {
    const c = this.ctx; if (!c || !this.begun || !this.buses) return null;
    const set = new LayerSet(c, stems, bar, this.buses.music, levels, resumeAt(this.resume, key, stems[0].duration, Date.now()));
    this.layered = { key, set };
    return set;
  }
  /** the baked sounds, fetched when they are asked for */
  get loader(): AudioLoader { return (this.files ??= new AudioLoader(this.ctx!)); }

  /** the level at the output, in dB (the proofs) */
  meter(): number {
    if (!this.ctx || !this.master) return -120;
    if (!this.tap) { this.tap = this.ctx.createAnalyser(); this.tap.fftSize = 2048; this.master.connect(this.tap); }
    const d = new Float32Array(2048); this.tap.getFloatTimeDomainData(d);
    return 10 * Math.log10(Math.max(1e-12, d.reduce((s, v) => s + v * v, 0) / d.length));
  }

  /** the place's ambience and the day state's music, the scene before fading out under them */
  setScene(place: SoundPlace, look: Look, boutDay = false, seed = 1842): void {
    this.want = { place, look, boutDay, seed };
    if (!this.begun) return;
    const c = this.ctx!, old = this.scene, cross = old.groups.length > 0;
    this.scene = { groups: [], stops: [] };
    for (const g of old.groups) g.gain.setTargetAtTime(0, c.currentTime, FADE.scene / 3);
    if (cross) window.setTimeout(() => { for (const s of old.stops) s(); }, (FADE.scene + 0.3) * 1000);
    this.setRoom(place);
    this.ambience(ambienceOf(place, look, boutDay), cross);
    if (place !== 'arena') this.music(seed, look, cross); else this.playing = null;
  }
  /** a group of the scene on a bus, coming up when it replaces another */
  private group(out: AudioNode, level: number, cross: boolean): GainNode {
    const c = this.ctx!, g = c.createGain();
    if (cross) { g.gain.setValueAtTime(0, c.currentTime); g.gain.setTargetAtTime(level, c.currentTime, FADE.scene / 3); } else g.gain.value = level;
    g.connect(out); this.scene.groups.push(g); this.scene.stops.push(() => { g.disconnect(); });
    return g;
  }

  private ambience(a: Ambience, cross: boolean): void {
    const c = this.ctx!, scene = this.group(this.buses!.ambience, dbGain(a.trim), cross);
    for (const b of a.beds) {
      // each bed reads the noise from its own place at its own speed: none in phase with another, the two channels unrelated
      const src = c.createBufferSource(); src.buffer = this.noise; src.loop = true; src.playbackRate.value = 0.93 + this.rng.next() * 0.14;
      const f = c.createBiquadFilter(); f.type = b.kind === 'wind' ? 'lowpass' : 'bandpass'; f.frequency.value = b.freq; f.Q.value = b.q;
      const g = c.createGain(); g.gain.value = b.gain;
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = (0.07 + b.sway * 0.1) * (0.8 + this.rng.next() * 0.4); lg.gain.value = b.gain * b.sway; lfo.connect(lg); lg.connect(g.gain);
      src.connect(f); f.connect(g); g.connect(scene); src.start(0, this.rng.next() * NOISE_SECONDS); lfo.start();
      this.scene.stops.push(() => { src.stop(); lfo.stop(); g.disconnect(); });
    }
    for (const call of a.calls) {
      let alive = true, timer = 0;
      const next = () => {
        if (!alive) return;
        this.call(call.kind, call.gain, scene);
        const [lo, hi] = call.every; timer = window.setTimeout(next, (lo + this.rng.next() * (hi - lo)) * 1000);
      };
      timer = window.setTimeout(next, call.every[0] * 500);
      this.scene.stops.push(() => { alive = false; clearTimeout(timer); });
    }
  }

  /** one sparse call of an ambience, somewhere in the stereo field, with the place's air around it */
  private call(kind: keyof typeof CALL_PAN, gain: number, out: AudioNode): void {
    const c = this.ctx!, t = c.currentTime, g = c.createStereoPanner(); g.pan.value = CALL_PAN[kind] * (this.rng.next() * 2 - 1); g.connect(out); this.send(g, SEND.calls);
    const tone = (f0: number, f1: number, at: number, dur: number, wave: OscillatorType = 'sine', v = gain) => {
      const o = c.createOscillator(), e = c.createGain(); o.type = wave; o.frequency.setValueAtTime(f0, t + at); o.frequency.exponentialRampToValueAtTime(f1, t + at + dur);
      e.gain.setValueAtTime(0, t + at); e.gain.linearRampToValueAtTime(v, t + at + 0.01); e.gain.exponentialRampToValueAtTime(0.0001, t + at + dur);
      o.connect(e); e.connect(g); o.start(t + at); o.stop(t + at + dur + 0.02);
    };
    if (kind === 'bird') for (let i = 0; i < 3; i++) tone(2800 + i * 300, 3600 + i * 200, i * 0.11, 0.08);
    else if (kind === 'cricket') for (let i = 0; i < 4; i++) tone(4300, 4200, i * 0.06, 0.03, 'square', gain * 0.5);
    else if (kind === 'hammer') { tone(1500, 1400, 0, 0.18, 'triangle'); tone(2300, 2200, 0, 0.1, 'triangle', gain * 0.5); }
    else if (kind === 'cheer') tone(400, 600, 0, 1.2, 'sawtooth', gain * 0.3);
    else if (kind === 'lute') for (let i = 0; i < 3; i++) this.pluck(hz(57 + [0, 7, 12][i]), t + i * 0.18, gain, g);
  }

  private pluck(f: number, t: number, v: number, bus: AudioNode): void {
    const c = this.ctx!, o = c.createOscillator(), o2 = c.createOscillator(), e = c.createGain(), lp = c.createBiquadFilter();
    o.type = 'triangle'; o2.type = 'sawtooth'; o.frequency.value = f; o2.frequency.value = f * 1.002; lp.type = 'lowpass'; lp.frequency.setValueAtTime(f * 6, t); lp.frequency.exponentialRampToValueAtTime(f * 1.5, t + 0.6);
    e.gain.setValueAtTime(0, t); e.gain.linearRampToValueAtTime(v, t + 0.005); e.gain.exponentialRampToValueAtTime(0.0001, t + 1.2);
    const m = c.createGain(); m.gain.value = 0.25; o2.connect(m); m.connect(lp); o.connect(lp); lp.connect(e); e.connect(bus);
    o.start(t); o2.start(t); o.stop(t + 1.3); o2.stop(t + 1.3);
  }

  /** the tune of the day state, looped with a bar of silence between the turns, on the audio clock; taken up where the last page left it */
  private music(seed: number, look: Look, cross: boolean): void {
    const c = this.ctx!, { notes, drone, length } = tune(seed, look), key = tuneKey(seed, look), period = length + TURN_REST, group = this.group(this.buses!.music, 1, cross);
    const melody = c.createStereoPanner(), under = c.createStereoPanner();
    melody.pan.value = 0.14; under.pan.value = -0.12; melody.connect(group); under.connect(group); this.send(melody, SEND.music);
    const start = c.currentTime + 0.1, playing = this.playing = { key, t0: start - resumeAt(this.resume, key, period, Date.now()), period };
    let alive = true, timer = 0;
    const turn = (t0: number) => {
      if (!alive) return;
      playing.t0 = t0;
      for (const n of notes) if (t0 + n.t >= start) this.pluck(hz(n.midi), t0 + n.t, 0.12 * n.vel, melody);
      for (const n of drone) {
        const a = Math.max(start, t0 + n.t), b = t0 + n.t + n.dur; if (b < a + 0.5) continue;
        const o = c.createOscillator(), e = c.createGain(); o.type = 'sine'; o.frequency.value = hz(n.midi);
        e.gain.setValueAtTime(0, a); e.gain.linearRampToValueAtTime(0.05 * n.vel, a + 0.4); e.gain.linearRampToValueAtTime(0, b);
        o.connect(e); e.connect(under); o.start(a); o.stop(b + 0.05);
      }
      const next = t0 + period;
      timer = window.setTimeout(() => turn(Math.max(next, c.currentTime + 0.1)), Math.max(0, next - 0.5 - c.currentTime) * 1000);
    };
    turn(playing.t0);
    this.scene.stops.push(() => { alive = false; clearTimeout(timer); melody.disconnect(); under.disconnect(); });
  }
}

let shared: Sound | null = null;
/** the page's one sound engine (created on demand by a version 2 page) */
export function sound(): Sound { if (!shared) { shared = new Sound(); installSoundHooks(shared); } return shared; }
