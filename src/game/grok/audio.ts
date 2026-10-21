// Night-harbor sound for Grok's level 1, all synthesized with Web Audio: no
// sound files to download. An engine hum follows the throttle, the swell
// hisses, a bell buoy rings at the entrance, and a soft arpeggio grows one
// voice at a time while the leading lights stay in line (DECISIONS.md G16:
// music builds with the combo). Every sound has a visual twin in the scene.

const PENTATONIC = [220, 247.5, 277.2, 330, 370, 440, 495, 554.4, 660];

export class NightAudio {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private engine: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private nextNote = 0;
  private noteIndex = 0;
  muted = false;

  /** Browsers only allow sound after a tap or key press. */
  start(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext;
    if (typeof Ctor !== 'function') return;
    const ctx = new Ctor();
    this.ctx = ctx;
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.5;
    master.connect(ctx.destination);
    this.master = master;

    // Swell: looping filtered noise.
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i++) {
      last = last * 0.97 + (Math.random() * 2 - 1) * 0.03;
      data[i] = last * 4;
    }
    const swell = ctx.createBufferSource();
    swell.buffer = buffer;
    swell.loop = true;
    const swellGain = ctx.createGain();
    swellGain.gain.value = 0.18;
    swell.connect(swellGain).connect(master);
    swell.start();

    const engine = ctx.createOscillator();
    engine.type = 'sawtooth';
    engine.frequency.value = 40;
    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.value = 220;
    const engineGain = ctx.createGain();
    engineGain.gain.value = 0;
    engine.connect(lowpass).connect(engineGain).connect(master);
    engine.start();
    this.engine = engine;
    this.engineGain = engineGain;
  }

  setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.master && this.ctx)
      this.master.gain.setTargetAtTime(muted ? 0 : 0.5, this.ctx.currentTime, 0.05);
  }

  /** throttle -100..100 */
  engineAt(throttle: number): void {
    if (!this.ctx || !this.engine || !this.engineGain) return;
    const t = this.ctx.currentTime;
    const load = Math.abs(throttle) / 100;
    this.engine.frequency.setTargetAtTime(38 + load * 46, t, 0.15);
    this.engineGain.gain.setTargetAtTime(0.05 + load * 0.12, t, 0.15);
  }

  /** Called every frame; plays one arpeggio note on the beat, with more voices for a longer streak. */
  music(streakSeconds: number): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (now < this.nextNote) return;
    const voices = Math.min(4, Math.floor(streakSeconds / 3));
    this.nextNote = now + 0.36;
    if (voices === 0) return;
    for (let v = 0; v < voices; v++) {
      const f = PENTATONIC[(this.noteIndex + v * 2) % PENTATONIC.length] ?? 440;
      this.tone(f, 0.5, 'triangle', 0.05);
    }
    this.noteIndex = (this.noteIndex + 1) % PENTATONIC.length;
  }

  bell(): void {
    this.tone(1180, 2.2, 'sine', 0.12);
    this.tone(2950, 1.2, 'sine', 0.04);
  }

  bump(): void {
    this.tone(70, 0.4, 'square', 0.3);
  }

  splash(): void {
    this.noise(0.5, 1800, 0.35);
  }

  moored(): void {
    [440, 554.4, 660, 880].forEach((f, i) => this.tone(f, 1.6, 'triangle', 0.12, i * 0.09));
  }

  private tone(freq: number, dur: number, type: OscillatorType, vol: number, delay = 0): void {
    if (!this.ctx || !this.master) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(g).connect(this.master);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  private noise(dur: number, cutoff: number, vol: number): void {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = cutoff;
    const g = ctx.createGain();
    g.gain.value = vol;
    src.connect(filter).connect(g).connect(this.master);
    src.start();
  }
}
