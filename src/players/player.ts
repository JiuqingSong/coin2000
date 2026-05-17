import type { World } from '../game/world';
import type { CoinId, Owner, Vec2 } from '../game/types';
import type { AimPreview } from '../input/aim';

export type ShotCallback = (coinId: CoinId, vel: Vec2) => void;

export interface Player {
  owner: Owner;
  startTurn(world: World, onShoot: ShotCallback): void;
  cancelTurn(): void;
  getPreview?(): AimPreview | null;
}
