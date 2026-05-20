import type { Coin } from './coin';
import type { Table } from './table';
import { Owner, Phase } from './types';

export type WallBehavior = 'kill' | 'bounce' | 'teleport';

export interface Walls {
  top: WallBehavior;
  bottom: WallBehavior;
  left: WallBehavior;
  right: WallBehavior;
}

export interface World {
  table: Table;
  walls: Walls;
  coins: Coin[];
  phase: Phase;
  current: Owner.P1 | Owner.P2;
  aliveCount: { [Owner.P1]: number; [Owner.P2]: number; [Owner.Neutral]: number };
  // Tracks whether the shot coin's first contact was an opponent coin.
  // Set by Engine.onShoot, nulled by physics once first contact is detected.
  shooterCoin: Coin | null;
  shooterFirstHitOpponent: boolean;
}
