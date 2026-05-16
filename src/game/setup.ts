import type { Coin } from './coin';
import type { World } from './world';
import { CoinKind, Owner, Phase } from './types';
import { TABLE } from './constants';
import { config } from './config';

const EDGE_INSET = 50;

export function initialWorld(): World {
  const coinsPerSide = config.coinsPerSide;
  const radius = config.coinRadius;
  const mass = config.coinMass;

  const coins: Coin[] = [];
  const spacing = TABLE.height / (coinsPerSide + 1);
  const leftX = EDGE_INSET;
  const rightX = TABLE.width - EDGE_INSET;

  let id = 0;
  for (let i = 0; i < coinsPerSide; i++) {
    coins.push({
      id: id++,
      kind: CoinKind.Coin,
      owner: Owner.P1,
      pos: { x: leftX, y: spacing * (i + 1) },
      vel: { x: 0, y: 0 },
      radius,
      mass,
      alive: true,
    });
  }
  for (let i = 0; i < coinsPerSide; i++) {
    coins.push({
      id: id++,
      kind: CoinKind.Coin,
      owner: Owner.P2,
      pos: { x: rightX, y: spacing * (i + 1) },
      vel: { x: 0, y: 0 },
      radius,
      mass,
      alive: true,
    });
  }

  return {
    table: { width: TABLE.width, height: TABLE.height },
    coins,
    phase: Phase.Idle,
    current: Owner.P1,
    aliveCount: {
      [Owner.P1]: coinsPerSide,
      [Owner.P2]: coinsPerSide,
    },
  };
}
