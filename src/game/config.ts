export interface GameConfig {
  p1Color: string;
  p2Color: string;
  coinsPerSide: number;
  coinRadius: number;
  coinMass: number;
  maxShotSpeed: number;
  aiAngleSamples: number;
  soundEnabled: boolean;
  stoneCount: number;
  bombCount: number;
  explosionRadius: number;
  chainBombs: boolean;
  misfireProtection: boolean;
  keepShotOnKill: boolean;
}

export const CONFIG_DEFAULTS: Readonly<GameConfig> = {
  p1Color: '#4aa3ff',
  p2Color: '#ff6b5a',
  coinsPerSide: 5,
  coinRadius: 11,
  coinMass: 5,
  maxShotSpeed: 12,
  aiAngleSamples: 3,
  soundEnabled: true,
  stoneCount: 5,
  bombCount: 3,
  explosionRadius: 30,
  chainBombs: true,
  misfireProtection: false,
  keepShotOnKill: true,
};

export const CONFIG_RANGES = {
  coinsPerSide: { min: 1, max: 10 },
  coinRadius: { min: 11, max: 15 },
  coinMass: { min: 5, max: 10 },
  maxShotSpeed: { min: 11, max: 20 },
  aiAngleSamples: { min: 1, max: 5 },
  stoneCount: { min: 0, max: 10 },
  bombCount: { min: 0, max: 5 },
  explosionRadius: { min: 15, max: 100 },
} as const;

const STORAGE_KEY = 'coin2000.config.v1';

export const config: GameConfig = { ...CONFIG_DEFAULTS };

type Listener = () => void;
const listeners = new Set<Listener>();

export function subscribeConfig(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function applyConfig(next: GameConfig): void {
  Object.assign(config, sanitize(next));
  saveConfig();
  listeners.forEach((fn) => fn());
}

export function resetConfig(): void {
  applyConfig({ ...CONFIG_DEFAULTS });
}

export function loadConfig(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Partial<GameConfig>;
    Object.assign(config, sanitize({ ...CONFIG_DEFAULTS, ...parsed }));
  } catch {
    // ignore corrupted storage
  }
}

function saveConfig(): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // ignore quota / disabled storage
  }
}

function sanitize(next: GameConfig): GameConfig {
  return {
    p1Color: sanitizeColor(next.p1Color, CONFIG_DEFAULTS.p1Color),
    p2Color: sanitizeColor(next.p2Color, CONFIG_DEFAULTS.p2Color),
    coinsPerSide: clampInt(next.coinsPerSide, CONFIG_RANGES.coinsPerSide.min, CONFIG_RANGES.coinsPerSide.max),
    coinRadius: clampInt(next.coinRadius, CONFIG_RANGES.coinRadius.min, CONFIG_RANGES.coinRadius.max),
    coinMass: clampInt(next.coinMass, CONFIG_RANGES.coinMass.min, CONFIG_RANGES.coinMass.max),
    maxShotSpeed: clampInt(next.maxShotSpeed, CONFIG_RANGES.maxShotSpeed.min, CONFIG_RANGES.maxShotSpeed.max),
    aiAngleSamples: clampInt(next.aiAngleSamples, CONFIG_RANGES.aiAngleSamples.min, CONFIG_RANGES.aiAngleSamples.max),
    soundEnabled: !!next.soundEnabled,
    stoneCount: clampInt(next.stoneCount, CONFIG_RANGES.stoneCount.min, CONFIG_RANGES.stoneCount.max),
    bombCount: clampInt(next.bombCount, CONFIG_RANGES.bombCount.min, CONFIG_RANGES.bombCount.max),
    explosionRadius: clampInt(next.explosionRadius, CONFIG_RANGES.explosionRadius.min, CONFIG_RANGES.explosionRadius.max),
    chainBombs: !!next.chainBombs,
    misfireProtection: !!next.misfireProtection,
    keepShotOnKill: next.keepShotOnKill !== false,
  };
}

function clampInt(v: number, min: number, max: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function sanitizeColor(v: string, fallback: string): string {
  return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v) ? v : fallback;
}
