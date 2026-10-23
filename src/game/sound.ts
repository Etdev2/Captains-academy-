// Engine, bump, docking chime and horn, synthesized with Web Audio so there
// are no sound files to load. Every sound has a visual partner elsewhere, so
// the game plays the same muted (G16). Audio starts on the first touch or key,
// as browsers require.

const MUTE_KEY = 'captains-academy:muted';

export class Sound {
  private ctx: AudioContext | null = null;
  private engineGain: GainNode | null = null;
  private engineOsc: OscillatorNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private master: GainNode | null = null;
  muted: boolean;

  constructor() {
    let saved = false;
    try {
      saved = window.localStorage.getItem(MUTE_KEY) === '1';
    } catch {
      // Storage can be blocked; default to sound on.
    }
    this.muted = saved;
  }

  /** Call from a user gesture. Safe to call more than once. */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.6;
    master.connect(ctx.destination);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 300;
    const gain = ctx.createGain();
    gain.gain.value = 0;
    const osc = ctx.createOscillator();
    osc.type = 'sawtooth';
    osc.frequency.value = 45;
    osc.connect(filter).connect(gain).connect(master);
    osc.start();
    this.ctx = ctx;
    this.master = master;
    this.engineOsc = osc;
    this.engineFilter = filter;
    this.engineGain = gain;
  }

  toggleMute(): void {
    this.muted = !this.muted;
    try {
      window.localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch {
      // Not saved; the toggle still works for this visit.
    }
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(this.muted ? 0 : 0.6, this.ctx.currentTime, 0.05);
    }
  }

  /** Engine note follows the throttle lever (0 to 100) and the boat's speed (0 to 1). */
  engine(throttlePercent: number, speedShare: number): void {
    const { ctx, engineOsc, engineGain, engineFilter } = this;
    if (!ctx || !engineOsc || !engineGain || !engineFilter) return;
    const load = Math.abs(throttlePercent) / 100;
    const t = ctx.currentTime;
    engineOsc.frequency.setTargetAtTime(42 + 38 * load + 20 * speedShare, t, 0.15);
    engineFilter.frequency.setTargetAtTime(220 + 600 * load, t, 0.15);
    engineGain.gain.setTargetAtTime(0.05 + 0.12 * load, t, 0.15);
  }

  silenceEngine(): void {
    if (this.ctx && this.engineGain) {
      this.engineGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.2);
    }
  }

  /** A short, dull knock of hull on wood. */
  bump(hard: boolean): void {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    const length = Math.floor(ctx.sampleRate * (hard ? 0.5 : 0.18));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / length) ** 3;
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = hard ? 500 : 260;
    const gain = ctx.createGain();
    gain.gain.value = hard ? 1 : 0.7;
    src.connect(filter).connect(gain).connect(master);
    src.start();
  }

  /** Two rising bell notes. */
  chime(): void {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    [784, 1175].forEach((freq, i) => {
      const start = ctx.currentTime + i * 0.18;
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.35, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.9);
      osc.connect(gain).connect(master);
      osc.start(start);
      osc.stop(start + 1);
    });
  }

  /** One bell note for a right answer, a step higher for each combo step (G13). */
  rightAnswer(combo: number): void {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    const start = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = 660 * 2 ** (Math.min(combo, 5) / 12);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.5);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + 0.6);
  }

  /** A ship's horn blast. A short blast is about 1 second (Rule 32). */
  horn(seconds: number): void {
    const { ctx, master } = this;
    if (!ctx || !master) return;
    const start = ctx.currentTime;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.3, start + 0.05);
    gain.gain.setValueAtTime(0.3, start + seconds - 0.08);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + seconds);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 900;
    filter.connect(gain).connect(master);
    for (const freq of [155, 196]) {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = freq;
      osc.connect(filter);
      osc.start(start);
      osc.stop(start + seconds);
    }
  }
}
