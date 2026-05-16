import type { Coin } from './coin';
import type { World } from './world';
import { CoinKind, Owner, Phase } from './types';
import { COIN_MASS, COIN_RADIUS, COINS_PER_SIDE, TABLE } from './constants';

const EDGE_INSET = 50;

export function initialWorld(): World {
  const coins: Coin[] = [];
  const spacing = TABLE.height / (COINS_PER_SIDE + 1);
  const leftX = EDGE_INSET;
  const rightX = TABLE.width - EDGE_INSET;

  let id = 0;
  for (let i = 0; i < COINS_PER_SIDE; i++) {
    coins.push({
      id: id++,
      kind: CoinKind.Coin,
      owner: Owner.P1,
      pos: { x: leftX, y: spacing * (i + 1) },
      vel: { x: 0, y: 0 },
      radius: COIN_RADIUS,
      mass: COIN_MASS,
      alive: true,
    });
  }
  for (let i = 0; i < COINS_PER_SIDE; i++) {
    coins.push({
      id: id++,
      kind: CoinKind.Coin,
      owner: Owner.P2,
      pos: { x: rightX, y: spacing * (i + 1) },
      vel: { x: 0, y: 0 },
      radius: COIN_RADIUS,
      mass: COIN_MASS,
      alive: true,
    });
  }

  return {
    table: { width: TABLE.width, height: TABLE.height },
    coins,
    phase: Phase.Idle,
    current: Owner.P1,
    aliveCount: {
      [Owner.P1]: COINS_PER_SIDE,
      [Owner.P2]: COINS_PER_SIDE,
    },
  };
}
