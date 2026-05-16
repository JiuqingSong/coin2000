export class Bell {
  private ctx: AudioContext | null = null;
  private muted = false;

  setMuted(m: boolean): void {
    this.muted = m;
  }

  resume(): void {
    const ctx = this.ensureCtx();
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  }

  ringShoot(): void {
    this.tone({ from: 220, to: 660, dur: 0.12, gain: 0.18, type: 'triangle' });
  }

  ringCollision(): void {
    this.tone({ from: 1000, to: 1000, dur: 0.05, gain: 0.10, type: 'square' });
  }

  ringDie(): void {
    this.tone({ from: 800, to: 380, dur: 0.30, gain: 0.20, type: 'sawtooth' });
  }

  private tone(o: { from: number; to: number; dur: number; gain: number; type: OscillatorType }): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = o.type;
    osc.frequency.setValueAtTime(o.from, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(1, o.to), now + o.dur);
    env.gain.setValueAtTime(0, now);
    env.gain.linearRampToValueAtTime(o.gain, now + 0.005);
    env.gain.exponentialRampToValueAtTime(0.0001, now + o.dur);
    osc.connect(env).connect(ctx.destination);
    osc.start(now);
    osc.stop(now + o.dur + 0.02);
  }

  private ensureCtx(): AudioContext | null {
    if (this.ctx) return this.ctx;
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    this.ctx = new Ctor();
    return this.ctx;
  }
}
