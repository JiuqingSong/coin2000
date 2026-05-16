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

  ringExplosion(): void {
    if (this.muted) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;

    const now = ctx.currentTime;
    const bodyDur = 0.75;

    // 1. Filtered white-noise body — the "boom" itself, with the lowpass cutoff
    //    sweeping down to give a settling, distant-rumble decay.
    const noiseBuf = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * bodyDur), ctx.sampleRate);
    const data = noiseBuf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;

    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuf;

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.Q.value = 0.9;
    lp.frequency.setValueAtTime(3200, now);
    lp.frequency.exponentialRampToValueAtTime(180, now + bodyDur);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0, now);
    noiseGain.gain.linearRampToValueAtTime(0.55, now + 0.005);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + bodyDur);

    noise.connect(lp).connect(noiseGain).connect(ctx.destination);
    noise.start(now);
    noise.stop(now + bodyDur + 0.05);

    // 2. Sub-bass thump — the gut-punch.
    const sub = ctx.createOscillator();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(130, now);
    sub.frequency.exponentialRampToValueAtTime(32, now + 0.55);

    const subGain = ctx.createGain();
    subGain.gain.setValueAtTime(0, now);
    subGain.gain.linearRampToValueAtTime(0.45, now + 0.012);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    sub.connect(subGain).connect(ctx.destination);
    sub.start(now);
    sub.stop(now + 0.65);

    // 3. Sharp crack — the initial transient that gives shape to the attack.
    const crack = ctx.createOscillator();
    crack.type = 'triangle';
    crack.frequency.setValueAtTime(2400, now);
    crack.frequency.exponentialRampToValueAtTime(420, now + 0.08);

    const crackGain = ctx.createGain();
    crackGain.gain.setValueAtTime(0, now);
    crackGain.gain.linearRampToValueAtTime(0.22, now + 0.002);
    crackGain.gain.exponentialRampToValueAtTime(0.001, now + 0.11);

    crack.connect(crackGain).connect(ctx.destination);
    crack.start(now);
    crack.stop(now + 0.13);
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
