const STORAGE_KEY = 'coin2026.music.v1';
const TRACK_URL = './mp3/coin flicker theme.mp3';

type Listener = (enabled: boolean) => void;

export class Music {
  private audio: HTMLAudioElement;
  private enabled: boolean;
  private wantPlaying = false;
  private readonly listeners = new Set<Listener>();

  constructor() {
    this.enabled = loadEnabled();
    this.audio = new Audio(TRACK_URL);
    this.audio.loop = true;
    this.audio.volume = 0.35;
    this.audio.preload = 'auto';
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  setEnabled(on: boolean): void {
    if (this.enabled === on) return;
    this.enabled = on;
    saveEnabled(on);
    if (on && this.wantPlaying) {
      void this.audio.play().catch(() => undefined);
    } else if (!on) {
      this.audio.pause();
    }
    this.listeners.forEach((fn) => fn(on));
  }

  toggle(): void {
    this.setEnabled(!this.enabled);
  }

  start(): void {
    this.wantPlaying = true;
    if (this.enabled) {
      // play() may reject before any user gesture; the next gesture will retry.
      void this.audio.play().catch(() => undefined);
    }
  }

  stop(): void {
    this.wantPlaying = false;
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  // Browsers block audio until a user gesture; call this from a gesture handler
  // to retry pending playback.
  unlock(): void {
    if (this.enabled && this.wantPlaying && this.audio.paused) {
      void this.audio.play().catch(() => undefined);
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  }
}

function loadEnabled(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw === null) return true;
    return raw === '1';
  } catch {
    return true;
  }
}

function saveEnabled(on: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, on ? '1' : '0');
  } catch {
    // ignore
  }
}
