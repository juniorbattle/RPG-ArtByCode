import { Rng } from '../core/rng';
import { AudioLoader, type Format } from './baked';
import { alignLoop, startOf } from './align';
import { LayerSet } from './layers';
import CATALOGUE from './catalogue.json';
import { CALM, jingleFor, layerLevels, moodStep, pieceFor, type Mood, type PieceId, type StingId } from './plan';
import { ambienceOf, BAND_RATE, BED_LEVEL, CALL_LEVEL, CALL_PAN, ceilingCurve, dbGain, DEFAULT_SETTINGS, DUCK, DUCK_AMBIENCE, duelCue, FADE, JINGLE_AFTER, LIMITER, LOOP_LEVEL, MIX, NOISE_SECONDS, noiseSamples, NOW_KEY, readNow, readSettings, RESUME_MS, resumeAt, roomImpulse, SEND, STEP_LEVEL, STING_DUCK, STING_WAIT, take, THUNDER_LEVEL, thunderOf, TUNED_CALLS, UI_EFFECTS, UI_LEVEL, type Ambience, type Bed, type Calls, type Effect, type Loop, type Look, type NowPlaying, type SoundPlace, type SoundSettings, type Voice, type WeatherNow } from './score';
import { compute, COMPUTED, type ComputedId } from './places';
import { installSoundHooks } from './hooks';
import { CROWD_TRIM, HOLD_EVERY, REACT_QUIET, SFX_TRIM, THREAT_QUIET, crowdOf, holdOf, sfxOf, type CrowdId, type SfxCue } from './sfx';

/** The version 2's sound engine (lot V8, journal Passe V8; lots S0 and S1, journal Passes SN2 / SN3): Web Audio only, every sound written in
 *  src/audio/score.ts or baked under a manifest (src/audio/baked.ts). Four buses go through a limiter to the volume: the ambience and the music, which
 *  step back under a blow, the effects and the interface, with a room's reverberation on a send. A page's sound comes up and goes down with it, and the
 *  music takes up where it was on the next page (SA-15): the record is kept for the tab. Nothing starts before a gesture of the person (the browsers'
 *  rule: the context is created, or resumed, on the first key or click; after a gesture on an earlier page of the tab the browser may let it go on by
 *  itself); the volume, the music's share and the mute are kept in the browser (a convenience: a blocked storage gives the defaults). Only the version
 *  2's pages create it. The music is the band's (journal Passe SN10, R-SUITE « Cuire et brancher dans la version 2 »): the page's piece by the plan of
 *  src/audio/plan.ts, baked (./catalogue.json), its intro once and its loop on the sample, the fights' three layers following the duel, the fanfare at the
 *  registrar's announcements and a jingle at the end of a bout. */

const KEY = 'cdt-v2-sound';
type Bus = 'ambience' | 'music' | 'fx' | 'ui';
/** a piece of the catalogue (written by tools/audio/band/bake.mjs) */
interface BandEntry { kind: 'loop' | 'layers' | 'once'; frames: number; bar?: number; files: string[]; layers?: string[]; intro?: { file: string; frames: number; loopAt: number } }
const BAND = CATALOGUE.pieces as Record<string, BandEntry>;
/** the duel's sounds and the crowd (written by tools/audio/band/bake-sfx.mjs, journal Passe SN16): each sound's takes and their lengths, the murmur a loop */
interface SfxEntry { family: string; files: string[]; frames: number[]; loop?: boolean }
/** a take of a baked sound: its buffer and where its sound starts in what this browser decoded */
interface Take { buf: AudioBuffer; start: number }
/** the families of the places and the interface (lot S2): not the duel's bank */
const NOT_DUEL = new Set(['interface', 'lieux']);
/** the interface's effects played by the band (lot S2, journal Passe SN18): the click, the dialog, the purse; the refused command is the duel's own (lot S3) */
const UI_SOUND: Partial<Record<Effect, string>> = { click: 'ui-click', open: 'ui-open', coin: 'ui-coin', denied: 'denied' };
const SFX = ((CATALOGUE as { sfx?: Record<string, SfxEntry> }).sfx ?? {}) as Record<string, SfxEntry>;
/** what a scene asks of the music beyond its place and hour: a new game's first page, a bout's piece, its fighters' health and the hero's charge tiers */
export interface SceneMusic { opening?: boolean; bout?: PieceId; maxHp?: Record<string, number>; tiers?: number }

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
  private want: { place: SoundPlace; look: Look; boutDay: boolean; seed: number; music: SceneMusic; weather: WeatherNow | null } | null = null;
  /** the place's sound now playing, its group (the thunder goes there), the computed sounds' buffers, the baked takes, the interface's (lot S2) */
  private amb: Ambience | null = null;
  private ambGroup: GainNode | null = null;
  private madeBufs = new Map<string, AudioBuffer>();
  private takeSets = new Map<string, Promise<Take[]>>();
  private ui = new Map<Effect, Take[]>();
  private lastOf: Record<string, number> = {};
  /** the music's way in, which steps back under a jingle (the stings go round it, on their own gain) */
  private musicIn: GainNode | null = null;
  private stings: GainNode | null = null;
  /** the duel's state the fights' layers follow, and the fighters' health it reads */
  private mood: Mood = CALM;
  private maxHp: Record<string, number> = {};
  /** the delay a format's loops showed in this browser: an intro or a jingle of the same format starts there (src/audio/align.ts) */
  private known: Partial<Record<Format, number>> = {};
  /** the scene's music loading (the proofs wait on it) */
  private pending: Promise<void> = Promise.resolve();
  /** a fanfare asked before the sound could run: played if the sound comes soon enough */
  private waiting: { id: StingId; until: number } | null = null;
  /** its own draws: a sound never takes from the game's random numbers */
  private rng = new Rng(0x50f7).fork('sound');
  private last: Partial<Record<Effect, number>> = {};
  /** the context runs and the page's sound has come up */
  private begun = false;
  private leftAt: number | null = null;
  /** where the previous page left the music */
  private resume: NowPlaying | null;
  private layered: { key: string; set: LayerSet; layers: boolean } | null = null;
  private files: AudioLoader | null = null;
  private tap: AnalyserNode | null = null;
  /** the duel's sounds, decoded when an arena scene first asks (lot S3, journal Passe SN16): each sound's takes and where each starts in its decode */
  private bank: Map<string, Array<{ buf: AudioBuffer; start: number }>> | null = null;
  private bankLoading: Promise<void> | null = null;
  private lastTake: Record<string, number> = {};
  /** the arena's crowd: its group on the ambience's way, the next reaction it allows, the threat's last stroke, the charge's breath */
  private crowd: GainNode | null = null;
  private quietUntil = 0;
  private threatAt = -Infinity;
  private hold: { level: number; timer: number } | null = null;
  private tiers = 6;

  constructor() {
    let stored: string | null = null, now: string | null = null;
    try { stored = localStorage.getItem(KEY); now = sessionStorage.getItem(NOW_KEY); } catch { /* storage blocked: the defaults */ }
    this.settings = readSettings(stored);
    this.resume = readNow(now);
    const start = () => { void this.unlock(); };
    window.addEventListener('pointerdown', start, { once: false });
    window.addEventListener('keydown', start, { once: false });
    window.addEventListener('pagehide', () => this.save());
    // a flash of the page's storm (src/atmosphere/Weather.ts): its thunder, a little later (lot S2)
    window.addEventListener('cdt-flash', (e) => this.thunder(Number((e as CustomEvent).detail?.level ?? 0.5)));
    window.addEventListener('pageshow', (e) => { if (e.persisted) { this.leftAt = null; this.fadeTo(1, FADE.in); } });
    // a gesture on an earlier page of this tab: the browser may let the sound go on by itself; if it refuses, the next gesture starts it
    if (this.resume?.heard) void this.unlock();
  }

  /** the first gesture: the context, its buses, the noise buffer, then the ambience and the music asked for so far */
  async unlock(): Promise<void> {
    if (this.ctx) { if (this.ctx.state === 'suspended') await this.ctx.resume().catch(() => {}); return; }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    // the band's rate (journal Passe SN10): its loops close on their sample without a resampling at the decode; a browser that refuses gives its own rate
    const make = (o?: AudioContextOptions) => new Ctx(o);
    let made: AudioContext; try { made = make({ sampleRate: BAND_RATE }); } catch { made = make(); }
    const c = this.ctx = made;
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
    this.musicIn = c.createGain(); this.musicIn.connect(this.buses.music);
    // a jingle is a moment of its own: the music's level and share, but neither the blows' step back nor the music's own under it
    this.stings = c.createGain(); this.stings.connect(this.fade);
    this.room = c.createGain(); this.room.gain.value = dbGain(MIX.reverb); this.room.connect(mix);
    const n = c.createBuffer(2, c.sampleRate * NOISE_SECONDS, c.sampleRate);
    n.getChannelData(0).set(noiseSamples(n.length, 0x12345)); n.getChannelData(1).set(noiseSamples(n.length, 0x6789a));
    this.noise = n;
    this.apply(true);
    this.setRoom(this.want?.place ?? 'district');
    this.pending = Promise.all([this.pending, this.loadUi()]).then(() => {});
    c.addEventListener('statechange', () => this.begin());
    this.begin();
    if (c.state === 'suspended') void c.resume().catch(() => {});
  }

  /** the context runs: the page's sound comes up, with the scene asked for so far */
  private begin(): void {
    if (this.begun || this.ctx?.state !== 'running') return;
    this.begun = true;
    this.fadeTo(1, FADE.in);
    if (this.want) this.setScene(this.want.place, this.want.look, this.want.boutDay, this.want.seed, this.want.music, this.want.weather);
    const w = this.waiting; this.waiting = null;
    if (w && performance.now() <= w.until) this.sting(w.id);
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
    if (!this.ctx || !this.layered) return null;
    return { key: this.layered.key, pos: this.layered.set.position() };
  }
  /** the scene's music is loaded and started, or could not be (the proofs wait on it) */
  ready(): Promise<void> { return this.pending; }

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
    if (this.stings) to(this.stings, dbGain(MIX.music) * s.music / DEFAULT_SETTINGS.music);
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
    // a step on the place's ground, the interface by the band (lot S2); lot S0's recipes when they are not there
    if (e === 'step' && this.amb) { this.stepOn(this.amb.surface, gain); return; }
    const ui = this.ui.get(e);
    if (ui?.length) { this.playTake(ui, e, this.buses.ui, gain * (UI_LEVEL[e] ?? 1), at.pan ?? 0, 'none', 0); return; }
    const t0 = c.currentTime + 0.005, { voices, k } = take(e, () => this.rng.next(), this.last[e]), onUi = UI_EFFECTS.has(e);
    this.last[e] = k;
    const pan = c.createStereoPanner(); pan.pan.value = at.pan ?? 0; pan.connect(onUi ? this.buses.ui : this.buses.fx);
    if (!onUi) this.send(pan, SEND.fx);
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

  /** a duel's event (its table is duelCue, src/audio/score.ts); the fights' layers follow it (src/audio/plan.ts), each move over a whole bar (the operator's
   *  rule F, CQ-REGLE « F · Des niveaux plus doux », journal Passe SN13); the K.O. takes the music and gives a jingle */
  duelEvent(e: { type: string } & Record<string, unknown>): void {
    if (this.bank) this.duelSounds(e);
    // the bank not (yet) decoded, or not decodable here: lot S0's recipes, so that a duel never goes silent
    else { const q = duelCue(e); if (q) this.play(q.effect, q.gain ?? 1, q); }
    const was = this.mood; this.mood = moodStep(this.mood, e, this.maxHp);
    const l = this.layered;
    if (e.type === 'ko' && !was.over) {
      if (l) { l.set.stop(0.4); this.layered = null; }
      window.setTimeout(() => this.sting(jingleFor(String(e.who))), JINGLE_AFTER * 1000);
    } else if (l?.layers) layerLevels(this.mood).forEach((v, i) => { if (v !== l.set.levelOf(i)) l.set.level(i, v, l.set.bar); });
  }

  /** a duel's event in the band's sounds (src/audio/sfx.ts): its sounds, the music's step back under a blow (S3-BAISSE « Garder les baisses »), the crowd's
   *  reaction, the charge's breath while a tier stays reached */
  private duelSounds(e: { type: string } & Record<string, unknown>): void {
    const now = this.ctx?.currentTime ?? 0;
    for (const c of sfxOf(e, this.tiers)) {
      if (c.id === 'threat') { if (now - this.threatAt < THREAT_QUIET) continue; this.threatAt = now; }
      this.cue(c);
      if (c.duck) this.duck(c.duck);
    }
    const r = crowdOf(e); if (r) this.react(r, r === 'roar');
    const h = holdOf(e, this.tiers, this.hold?.level ?? 0);
    if (h !== (this.hold?.level ?? 0)) {
      if (this.hold) clearTimeout(this.hold.timer);
      this.hold = null;
      if (h > 0) { const breathe = () => { this.cue({ id: `hold${h}`, pan: -0.28, vary: 'none' }); if (this.hold) this.hold.timer = window.setTimeout(breathe, HOLD_EVERY * 1000); }; this.hold = { level: h, timer: window.setTimeout(breathe, HOLD_EVERY * 1000) }; }
    }
  }
  /** one of the band's sounds on the effects' bus: another take than the last, varied as its kind allows (src/audio/sfx.ts, `varyOf`), at its place, with the
   *  room; false when it cannot play */
  private cue(c: SfxCue): boolean {
    const ctx = this.ctx, takes = this.bank?.get(c.id);
    if (!ctx || !this.begun || !this.buses || !this.reverb || this.settings.muted || !takes?.length) return false;
    let k = Math.floor(this.rng.next() * takes.length); if (takes.length > 1 && k === this.lastTake[c.id]) k = (k + 1) % takes.length; this.lastTake[c.id] = k;
    const t = takes[k], s = ctx.createBufferSource(), g = ctx.createGain(), p = ctx.createStereoPanner();
    s.buffer = t.buf; if (c.vary === 'pitch') s.playbackRate.value = 1 + (this.rng.next() * 2 - 1) * 0.03;
    g.gain.value = dbGain(SFX_TRIM + (c.vary === 'none' ? 0 : this.rng.next() * 2 - 1)); p.pan.value = c.pan;
    s.connect(g); g.connect(p); p.connect(this.buses.fx); this.send(p, SEND.fx);
    s.start(ctx.currentTime + 0.005, t.start / t.buf.sampleRate);
    return true;
  }
  /** the crowd's reaction over its murmur, at most every REACT_QUIET seconds (the K.O.'s always), a little late and never twice the same */
  private react(id: CrowdId, force: boolean): void {
    const ctx = this.ctx, t = this.bank?.get(`crowd-${id}`)?.[0];
    if (!ctx || !this.crowd || !t || this.settings.muted) return;
    if (!force && ctx.currentTime < this.quietUntil) return;
    this.quietUntil = ctx.currentTime + REACT_QUIET;
    const s = ctx.createBufferSource(), g = ctx.createGain();
    s.buffer = t.buf; s.playbackRate.value = 1 + (this.rng.next() * 2 - 1) * 0.02; g.gain.value = dbGain(this.rng.next() * 2 - 1);
    s.connect(g); g.connect(this.crowd); s.start(ctx.currentTime + 0.12 + this.rng.next() * 0.08, t.start / t.buf.sampleRate);
  }
  /** the duel's sounds decoded, once for the page: every take of every sound, where each starts in what this browser decoded (src/audio/align.ts) */
  private loadBank(): Promise<void> {
    if (this.bankLoading) return this.bankLoading;
    const c = this.ctx!;
    this.bankLoading = (async () => {
      const bank = new Map<string, Array<{ buf: AudioBuffer; start: number }>>();
      await Promise.all(Object.entries(SFX).filter(([, e]) => !NOT_DUEL.has(e.family)).map(async ([id]) => {
        const takes = await this.takesOf(id);
        if (takes.length) bank.set(id, takes);
      }));
      // a bank that could not be decoded at all leaves lot S0's recipes playing
      if (this.ctx === c && bank.size) this.bank = bank; else if (!bank.size) console.warn('sound: the duel\'s sounds could not be loaded');
    })();
    return this.bankLoading;
  }
  /** the arena's crowd in place of its rumble (S3-FOULE « Bonne direction (par le code) »): its murmur in a loop on the ambience's way, 5 dB under the duel's
   *  music; the rumble of lot V8 when the murmur cannot be loaded */
  private crowdScene(fallback: Ambience, cross: boolean): void {
    const scene = this.scene, group = this.group(this.buses!.ambience, dbGain(CROWD_TRIM), cross);
    this.crowd = group;
    const p = this.loadBank().then(() => {
      if (this.scene !== scene || !this.ctx) return;
      const bed = this.bank?.get('crowd-bed')?.[0], entry = SFX['crowd-bed'];
      if (!bed || !entry) { this.ambience(fallback, false); return; }
      const c = this.ctx, s = c.createBufferSource(); s.buffer = bed.buf; s.loop = true; s.loopStart = bed.start / bed.buf.sampleRate; s.loopEnd = s.loopStart + entry.frames[0] / BAND_RATE;
      s.connect(group); s.start(c.currentTime + 0.05, s.loopStart);
      scene.stops.push(() => { try { s.stop(); } catch { /* already over */ } });
    });
    this.pending = Promise.all([this.pending, p]).then(() => {});
  }

  /** synchronous layers on the music bus, taken up where it stood if it is the piece the last page played (the engine's proofs, journal Passe SN3) */
  layers(key: string, stems: readonly AudioBuffer[], bar: number, levels: readonly number[]): LayerSet | null {
    const c = this.ctx; if (!c || !this.begun || !this.musicIn) return null;
    const set = new LayerSet(c, stems, bar, this.musicIn, levels, resumeAt(this.resume, key, stems[0].duration, Date.now()));
    this.layered = { key, set, layers: stems.length > 1 };
    return set;
  }

  /** a jingle or the fanfare, once, over the music, which steps back under it; asked before the sound runs, it waits a little (the gesture that starts it) */
  sting(id: StingId): void {
    const c = this.ctx, entry = BAND[id];
    if (!entry) return;
    if (!c || !this.begun || !this.stings || !this.musicIn) { this.waiting = { id, until: performance.now() + STING_WAIT * 1000 }; return; }
    if (this.settings.muted) return;
    const p = this.loader.decoded(id).then((d) => {
      if (!d || this.ctx !== c) return;
      const s = c.createBufferSource(), t = c.currentTime + 0.05, len = entry.frames / BAND_RATE, g = this.musicIn!.gain;
      s.buffer = d.buf; s.connect(this.stings!); s.start(t, startOf(d.buf, entry.frames, BAND_RATE, d.format, this.known[d.format]) / d.buf.sampleRate);
      g.cancelScheduledValues(t); g.setTargetAtTime(dbGain(-STING_DUCK), t, 0.12); g.setTargetAtTime(1, t + len * 0.75, 0.8);
    });
    this.pending = Promise.all([this.pending, p]).then(() => {});
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

  /** the place's ambience and its piece of the band (src/audio/plan.ts), the scene before fading out under them */
  setScene(place: SoundPlace, look: Look, boutDay = false, seed = 1842, music: SceneMusic = {}, weather: WeatherNow | null = null): void {
    this.want = { place, look, boutDay, seed, music, weather };
    if (!this.begun) return;
    const c = this.ctx!, old = this.scene, cross = old.groups.length > 0;
    this.scene = { groups: [], stops: [] };
    for (const g of old.groups) g.gain.setTargetAtTime(0, c.currentTime, FADE.scene / 3);
    if (cross) window.setTimeout(() => { for (const s of old.stops) s(); }, (FADE.scene + 0.3) * 1000);
    this.setRoom(place);
    const amb = ambienceOf(place, look, boutDay, weather);
    this.amb = null; this.ambGroup = null;
    this.crowd = null; if (this.hold) clearTimeout(this.hold.timer); this.hold = null; this.quietUntil = 0; this.threatAt = -Infinity; this.tiers = music.tiers ?? 6;
    if (place !== 'arena') this.ambience(amb, cross);
    this.mood = CALM; this.maxHp = { ...(music.maxHp ?? {}) };
    this.band(pieceFor(place, look, music), cross);
    // the arena: its crowd and the duel's sounds, loaded with the bout's music (lot S3, journal Passe SN16)
    if (place === 'arena') this.crowdScene(amb, cross);
    // the bout's two jingles fetched with its music: the K.O. never waits for a file
    if (place === 'arena') { const p = this.pending, pre = Promise.all((['victoire', 'defaite'] as const).map((id) => this.loader.decoded(id))); this.pending = Promise.all([p, pre]).then(() => {}); }
  }
  /** a group of the scene on a bus, coming up when it replaces another */
  private group(out: AudioNode, level: number, cross: boolean): GainNode {
    const c = this.ctx!, g = c.createGain();
    if (cross) { g.gain.setValueAtTime(0, c.currentTime); g.gain.setTargetAtTime(level, c.currentTime, FADE.scene / 3); } else g.gain.value = level;
    g.connect(out); this.scene.groups.push(g); this.scene.stops.push(() => { g.disconnect(); });
    return g;
  }

  /** the place's sound (lot S2, journal Passe SN18): its live beds, its loops, its calls, under the snow's muffle; the thunder's takes made ahead in a storm */
  private ambience(a: Ambience, cross: boolean): void {
    const c = this.ctx!;
    let out: AudioNode = this.buses!.ambience;
    if (a.muffle > 0) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 7000 - 4500 * a.muffle; f.Q.value = 0.5; f.connect(out); out = f; this.scene.stops.push(() => f.disconnect()); }
    const scene = this.group(out, dbGain(a.trim), cross);
    this.amb = a; this.ambGroup = scene;
    for (const bed of a.beds) this.liveBed(bed, scene);
    for (const l of a.loops) this.loopBed(l, scene);
    for (const call of a.calls) {
      let alive = true, timer = 0;
      const next = () => {
        if (!alive) return;
        this.call(call, scene);
        const [lo, hi] = call.every; timer = window.setTimeout(next, (lo + this.rng.next() * (hi - lo)) * 1000);
      };
      timer = window.setTimeout(next, (0.3 + this.rng.next() * 0.7) * call.every[0] * 1000);
      this.scene.stops.push(() => { alive = false; clearTimeout(timer); });
    }
    // the thunder's three takes made a little after the scene starts, one at a time: the first flash never waits for them
    if (a.thunder) for (let k = 0; k < 3; k++) { const t = window.setTimeout(() => this.made('thunder', k), 600 + 400 * k); this.scene.stops.push(() => clearTimeout(t)); }
  }

  /** a bed played live from the noise: each reads the buffer from its own place at its own speed; its moves (a gust, a wave against the quay, a flag's snap)
   *  drawn from the engine's own numbers */
  private liveBed(b: Bed, out: AudioNode): void {
    const c = this.ctx!, t0 = c.currentTime, rnd = () => this.rng.next(), nodes: AudioScheduledSourceNode[] = [];
    let alive = true, timer = 0;
    const src = (): AudioBufferSourceNode => { const s = c.createBufferSource(); s.buffer = this.noise; s.loop = true; s.playbackRate.value = 0.93 + rnd() * 0.14; s.start(t0, rnd() * NOISE_SECONDS); nodes.push(s); return s; };
    const filt = (type: BiquadFilterType, f: number, q: number, from: AudioNode): BiquadFilterNode => { const n = c.createBiquadFilter(); n.type = type; n.frequency.value = f; n.Q.value = q; from.connect(n); return n; };
    const amp = (v: number, from: AudioNode): GainNode => { const g = c.createGain(); g.gain.value = v; from.connect(g); return g; };
    const every = (lo: number, hi: number, fn: () => void) => { const tick = () => { if (!alive) return; fn(); timer = window.setTimeout(tick, (lo + rnd() * (hi - lo)) * 1000); }; timer = window.setTimeout(tick, rnd() * lo * 1000); };
    const k = BED_LEVEL[b.kind] * b.gain;
    if (b.kind === 'wind') {
      // the wind: a low band whose level and brightness follow the gusts; a whistle in the stones when it blows hard
      const lp = filt('lowpass', 380, 0.5, src()), g = amp(k * 0.7, lp), gust = b.gust ?? 0.5; g.connect(out);
      let whistle: { f: BiquadFilterNode; g: GainNode } | null = null;
      if (gust > 0.6) { const f = filt('bandpass', 800, 9, src()), g2 = amp(0, f); g2.connect(out); whistle = { f, g: g2 }; }
      every(1.2, 3.5, () => {
        const t = c.currentTime, lvl = 1 - gust + gust * rnd(), tau = 0.5 + rnd() * 0.8;
        g.gain.setTargetAtTime(k * lvl, t, tau); lp.frequency.setTargetAtTime(260 + 520 * lvl, t, tau);
        if (whistle) { whistle.g.gain.setTargetAtTime(k * 0.3 * Math.max(0, lvl - 0.5), t, tau); whistle.f.frequency.setTargetAtTime(650 + 500 * lvl, t, tau); }
      });
    } else if (b.kind === 'water') {
      // the canal against the quay: a low band that swells and falls back with each wave, a faint trickle over it
      const s = src(), bp = filt('bandpass', 520, 0.7, s), g = amp(k * 0.25, bp), hi = amp(k * 0.08, filt('bandpass', 2600, 1.8, s)); g.connect(out); hi.connect(out);
      every(0.5, 1.8, () => {
        const t = c.currentTime, up = 0.12 + rnd() * 0.13;
        g.gain.cancelScheduledValues(t); g.gain.setTargetAtTime(k * (0.6 + rnd() * 0.6), t, up / 3); g.gain.setTargetAtTime(k * 0.25, t + up, 0.18 + rnd() * 0.15);
        bp.frequency.setTargetAtTime(420 + rnd() * 260, t, 0.2);
      });
    } else if (b.kind === 'fountain') {
      // falling water: a broad band, shimmering
      const g = amp(k, filt('bandpass', 2200, 0.35, filt('highpass', 350, 0.5, src()))); g.connect(out);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 8 + rnd() * 5; lg.gain.value = k * 0.12; lfo.connect(lg); lg.connect(g.gain); lfo.start(t0); nodes.push(lfo);
    } else if (b.kind === 'rain') {
      // the rain's hiss, and its weight on the roofs
      const s = src(), g = amp(k, filt('bandpass', 4200, 0.35, filt('highpass', 700, 0.5, s))), low = amp(k * 0.35, filt('lowpass', 250, 0.6, s)); g.connect(out); low.connect(out);
      every(2, 5, () => g.gain.setTargetAtTime(k * (0.8 + 0.35 * rnd()), c.currentTime, 1.2));
    } else if (b.kind === 'flags') {
      // cloth in the wind: a band of noise chopped by a flutter (smoothed, so it snaps without clicking), the gusts opening and closing it
      const g = amp(0, filt('bandpass', 900, 1.2, src())); g.connect(out);
      const lfo = c.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 5 + rnd() * 3; const depth = amp(0, filt('lowpass', 30, 0.7, lfo)); depth.connect(g.gain); lfo.start(t0); nodes.push(lfo);
      every(0.8, 2.6, () => { const t = c.currentTime, lvl = rnd(); g.gain.setTargetAtTime(k * 0.5 * lvl, t, 0.3); depth.gain.setTargetAtTime(k * 0.5 * lvl, t, 0.3); lfo.frequency.setTargetAtTime(4 + 5 * lvl, t, 0.3); });
    } else {
      // the arena's rumble of lot V8, for a page whose crowd cannot load
      const g = amp(k, filt('bandpass', 400, 0.5, src())); g.connect(out);
      const lfo = c.createOscillator(), lg = c.createGain(); lfo.frequency.value = 0.12 * (0.8 + rnd() * 0.4); lg.gain.value = k * 0.5; lfo.connect(lg); lg.connect(g.gain); lfo.start(t0); nodes.push(lfo);
    }
    this.scene.stops.push(() => { alive = false; clearTimeout(timer); for (const n of nodes) { try { n.stop(); } catch { /* already over */ } } });
  }

  /** a loop of the place: a baked one (the murmur, the arena's crowd) on the span its decoder gave it, or a computed one (the rain's patter, the fire), from a
   *  place drawn in it, farther behind a low-pass */
  private loopBed(l: Loop, out: AudioNode): void {
    const c = this.ctx!, scene = this.scene, g = c.createGain(); g.gain.value = LOOP_LEVEL[l.id] * l.gain;
    if (l.tone) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = l.tone; f.Q.value = 0.5; g.connect(f); f.connect(out); } else g.connect(out);
    const start = (buf: AudioBuffer, from: number, len: number) => {
      if (this.scene !== scene || !this.ctx) return;
      const s = c.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = from; s.loopEnd = from + len; s.connect(g);
      s.start(c.currentTime + 0.05, from + this.rng.next() * len);
      scene.stops.push(() => { try { s.stop(); } catch { /* already over */ } });
    };
    if (l.id === 'patter' || l.id === 'fire') { const b = this.made(l.id, 0); start(b, 0, b.duration); return; }
    const entry = SFX[l.id];
    const p = this.takesOf(l.id).then((t) => { if (t[0] && entry) start(t[0].buf, t[0].start / t[0].buf.sampleRate, entry.frames[0] / BAND_RATE); });
    this.pending = Promise.all([this.pending, p]).then(() => {});
  }

  /** one call of a place, somewhere in the stereo field, with the place's air around it: another take than the last, a little higher or lower unless it is tuned */
  private call(call: Calls, out: AudioNode): void {
    const c = this.ctx!, kind = call.kind;
    const play = (buf: AudioBuffer, at: number) => {
      const s = c.createBufferSource(), g = c.createGain(), p = c.createStereoPanner();
      s.buffer = buf; if (!TUNED_CALLS.has(kind)) s.playbackRate.value = 1 + (this.rng.next() * 2 - 1) * 0.03;
      g.gain.value = CALL_LEVEL[kind] * call.gain * dbGain((this.rng.next() * 2 - 1) * 1.5); p.pan.value = CALL_PAN[kind] * (this.rng.next() * 2 - 1);
      if (call.tone) { const f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = call.tone; f.Q.value = 0.5; s.connect(f); f.connect(g); } else s.connect(g);
      g.connect(p); p.connect(out); this.send(p, SEND.calls);
      s.start(c.currentTime + 0.01, at);
    };
    if (kind === 'crowd-cheer' || kind === 'crowd-oh') { void this.takesOf(kind).then((t) => { if (t[0] && this.ctx === c) play(t[0].buf, t[0].start / t[0].buf.sampleRate); }); return; }
    const takes = call.takes ?? [...Array(COMPUTED[kind]).keys()];
    let k = takes[Math.floor(this.rng.next() * takes.length)];
    if (takes.length > 1 && k === this.lastOf[kind]) k = takes[(takes.indexOf(k) + 1) % takes.length];
    this.lastOf[kind] = k;
    play(this.made(kind, k), 0);
  }

  /** a computed sound's take (src/audio/places.ts), made the first time it is asked for and kept for the page */
  private made(id: ComputedId, take: number): AudioBuffer {
    const key = `${id}:${take}`; let b = this.madeBufs.get(key);
    if (!b) {
      const c = this.ctx!, chs = compute(id, take, c.sampleRate), buf = c.createBuffer(chs.length, chs[0].length, c.sampleRate);
      chs.forEach((x, i) => buf.getChannelData(i).set(x)); this.madeBufs.set(key, buf); b = buf;
    }
    return b;
  }
  /** a baked sound's takes (the table `sfx` of ./catalogue.json), decoded once for the page, each where its sound starts in this browser's decode */
  private takesOf(id: string): Promise<Take[]> {
    let p = this.takeSets.get(id); if (p) return p;
    const s = SFX[id]; if (!s || !this.ctx) return Promise.resolve([]);
    p = Promise.all(s.files.map((f) => this.loader.decoded(f))).then((got) => {
      const out: Take[] = [];
      got.forEach((d, k) => { if (d) out.push({ buf: d.buf, start: s.loop ? alignLoop(d.buf, s.frames[k], BAND_RATE, d.format).offset : startOf(d.buf, s.frames[k], BAND_RATE, d.format, this.known[d.format]) }); });
      return out;
    });
    this.takeSets.set(id, p);
    return p;
  }
  /** the interface's sounds by the band, fetched at the first gesture (a few kilobytes); lot S0's recipes until they are there, or if they cannot be */
  private loadUi(): Promise<void> {
    return Promise.all(Object.entries(UI_SOUND).map(async ([e, id]) => { const t = await this.takesOf(id!); if (t.length) this.ui.set(e as Effect, t); })).then(() => {});
  }
  /** a baked take on a bus: another take than the last, at its place, a little higher or lower when `rate` says so, varied in level (`varyDb`) */
  private playTake(takes: Take[], key: string, out: AudioNode, gain: number, pan: number, rate: 'none' | 'pitch', varyDb: number): void {
    const c = this.ctx!;
    let k = Math.floor(this.rng.next() * takes.length); if (takes.length > 1 && k === this.lastOf[key]) k = (k + 1) % takes.length; this.lastOf[key] = k;
    const t = takes[k], s = c.createBufferSource(), g = c.createGain(), p = c.createStereoPanner();
    s.buffer = t.buf; if (rate === 'pitch') s.playbackRate.value = 1 + (this.rng.next() * 2 - 1) * 0.04;
    g.gain.value = gain * dbGain((this.rng.next() * 2 - 1) * varyDb); p.pan.value = pan;
    s.connect(g); g.connect(p); p.connect(out);
    s.start(c.currentTime + 0.005, t.start / t.buf.sampleRate);
  }
  /** a step on the place's ground: the setts or the lists' earth (the snow crunches as the earth), four takes, never the same twice */
  private stepOn(surface: 'stone' | 'earth', gain: number): void {
    const c = this.ctx!, id = surface === 'earth' ? 'step-earth' : 'step-stone';
    let k = Math.floor(this.rng.next() * 4); if (k === this.lastOf[id]) k = (k + 1) % 4; this.lastOf[id] = k;
    const s = c.createBufferSource(), g = c.createGain();
    s.buffer = this.made(id, k); s.playbackRate.value = 1 + (this.rng.next() * 2 - 1) * 0.04; g.gain.value = STEP_LEVEL[surface] * gain * dbGain((this.rng.next() * 2 - 1) * 1.5);
    s.connect(g); g.connect(this.buses!.fx); this.send(g, SEND.fx * 0.5);
    s.start(c.currentTime + 0.005);
  }
  /** the thunder of a flash (its strength from 0 to about 1.6 times the storm): near, middle or far, after the time its sound takes to come */
  private thunder(level: number): void {
    const c = this.ctx, a = this.amb, out = this.ambGroup;
    if (!c || !this.begun || !a?.thunder || !out || this.settings.muted) return;
    const th = thunderOf(level, () => this.rng.next()), s = c.createBufferSource(), g = c.createGain();
    s.buffer = this.made('thunder', th.take); g.gain.value = THUNDER_LEVEL * th.gain; s.connect(g); g.connect(out);
    s.start(c.currentTime + th.delay);
  }

  /** the band's piece of the scene (journal Passe SN10): its intro once and then its loop, or its loop taken up where the last page left it (SA-15); each stem
   *  looped on the span its decoder gave it (src/audio/align.ts); a piece that cannot be loaded leaves the scene without music, never an error */
  private band(piece: PieceId, cross: boolean): void {
    const c = this.ctx!, entry = BAND[piece], scene = this.scene;
    this.layered = null;
    if (!entry || entry.kind === 'once') { this.pending = Promise.resolve(); return; }
    const key = `band:${piece}`, group = this.group(this.musicIn!, 1, cross), now = Date.now(), loopSecs = entry.frames / BAND_RATE;
    // the same piece as the last page's, not long ago: its loop where it stood, no intro again
    const again = this.resume?.key === key && now >= this.resume.at && now - this.resume.at <= RESUME_MS, from = resumeAt(this.resume, key, loopSecs, now), intro = again ? undefined : entry.intro;
    this.pending = (async () => {
      const got = await Promise.all([...entry.files.map((f) => this.loader.decoded(f)), intro ? this.loader.decoded(intro.file) : Promise.resolve(null)]);
      // the scene changed while loading, or the bout is already over (a K.O. before the files came)
      if (this.scene !== scene || !this.ctx || this.mood.over) return;
      const stems = got.slice(0, entry.files.length);
      if (stems.some((s) => !s)) { console.warn(`sound: the piece « ${piece} » could not be loaded`); return; }
      const spans = stems.map((s) => ({ offset: alignLoop(s!.buf, entry.frames, BAND_RATE, s!.format).offset, frames: entry.frames, rate: BAND_RATE }));
      this.known[stems[0]!.format] ??= spans[0].offset;
      const t0 = c.currentTime + 0.1, ib = intro ? got[entry.files.length] : null;
      let at = t0;
      if (intro && ib) {
        const s = c.createBufferSource(); s.buffer = ib.buf; s.connect(group); s.start(t0, startOf(ib.buf, intro.frames, BAND_RATE, ib.format, this.known[ib.format]) / ib.buf.sampleRate);
        this.scene.stops.push(() => { try { s.stop(); } catch { /* already over */ } });
        at = t0 + intro.loopAt / BAND_RATE;
      }
      const layers = (entry.layers?.length ?? 0) > 1, set = new LayerSet(c, stems.map((s) => s!.buf), entry.bar ?? loopSecs, group, layers ? layerLevels(this.mood) : [1], ib ? 0 : from, { at, spans });
      this.layered = { key, set, layers };
      this.scene.stops.push(() => set.stop(0.05));
    })();
  }
}

let shared: Sound | null = null;
/** the page's one sound engine (created on demand by a version 2 page) */
export function sound(): Sound { if (!shared) { shared = new Sound(); installSoundHooks(shared); } return shared; }
