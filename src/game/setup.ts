import type { Coin } from './coin';
import type { World } from './world';
import { CoinKind, Owner, Phase } from './types';
import {
  BOMB_MASS,
  BOMB_RADIUS,
  STONE_MASS,
  STONE_RADIUS,
  TABLE,
} from './constants';
import { config } from './config';

const EDGE_INSET = 50;

export function initialWorld(): World {
  const coinsPerSide = config.coinsPerSide;
  const radius = config.coinRadius;
  const mass = config.coinMass;
  const stoneCount = config.stoneCount;
  const bombCount = config.bombCount;

  const coins: Coin[] = [];
  let id = 0;

  // Player columns
  const coinSpacing = TABLE.height / (coinsPerSide + 1);
  const leftX = EDGE_INSET;
  const rightX = TABLE.width - EDGE_INSET;

  for (let i = 0; i < coinsPerSide; i++) {
    coins.push({
      id: id++,
      kind: CoinKind.Coin,
      owner: Owner.P1,
      pos: { x: leftX, y: coinSpacing * (i + 1) },
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
      pos: { x: rightX, y: coinSpacing * (i + 1) },
      vel: { x: 0, y: 0 },
      radius,
      mass,
      alive: true,
    });
  }

  // Neutral center column: stones and bombs alternating
  const neutralCount = stoneCount + bombCount;
  if (neutralCount > 0) {
    const neutralX = TABLE.width / 2;
    const neutralSpacing = TABLE.height / (neutralCount + 1);
    let stonesLeft = stoneCount;
    let bombsLeft = bombCount;
    let placeStone = true;
    for (let i = 0; i < neutralCount; i++) {
      const useStone = (placeStone && stonesLeft > 0) || bombsLeft === 0;
      if (useStone) {
        coins.push({
          id: id++,
          kind: CoinKind.Stone,
          owner: Owner.Neutral,
          pos: { x: neutralX, y: neutralSpacing * (i + 1) },
          vel: { x: 0, y: 0 },
          radius: STONE_RADIUS,
          mass: STONE_MASS,
          alive: true,
        });
        stonesLeft--;
      } else {
        coins.push({
          id: id++,
          kind: CoinKind.Bomb,
          owner: Owner.Neutral,
          pos: { x: neutralX, y: neutralSpacing * (i + 1) },
          vel: { x: 0, y: 0 },
          radius: BOMB_RADIUS,
          mass: BOMB_MASS,
          alive: true,
        });
        bombsLeft--;
      }
      placeStone = !placeStone;
    }
  }

  return {
    table: { width: TABLE.width, height: TABLE.height },
    coins,
    phase: Phase.Idle,
    current: Owner.P1,
    aliveCount: {
      [Owner.P1]: coinsPerSide,
      [Owner.P2]: coinsPerSide,
      [Owner.Neutral]: neutralCount,
    },
  };
}
