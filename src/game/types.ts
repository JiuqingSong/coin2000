export type Vec2 = { x: number; y: number };

export const enum Owner {
  P1 = 0,
  P2 = 1,
  Neutral = 2,
}

export const enum CoinKind {
  Coin = 'coin',
  Stone = 'stone',
  Bomb = 'bomb',
  Tree = 'tree',
  Hole = 'hole',
}

export type CoinId = number;

export const enum Phase {
  Idle,
  Aiming,
  Simulating,
  RoundEnd,
}
