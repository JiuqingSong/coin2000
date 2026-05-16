import type { CoinId, Vec2 } from '../game/types';

export interface AimPreview {
  coinId: CoinId;
  from: Vec2;
  dir: Vec2;
  power: number;
}

// TODO Phase 3: AimController — drag-release state machine.
