export type Vec2 = { x: number; y: number };

export const enum Owner {
  P1 = 0,
  P2 = 1,
}

export const enum CoinKind {
  Coin = 'coin',
}

export type CoinId = number;

export const enum Phase {
  Idle,
  Aiming,
  Simulating,
  RoundEnd,
}
