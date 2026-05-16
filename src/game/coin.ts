import type { CoinId, CoinKind, Owner, Vec2 } from './types';

export interface ExplosionState {
  ticksLeft: number;
  startRadius: number;
  peakRadius: number;
}

export interface Coin {
  id: CoinId;
  kind: CoinKind;
  owner: Owner;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  mass: number;
  alive: boolean;
  exploding?: ExplosionState;
}
