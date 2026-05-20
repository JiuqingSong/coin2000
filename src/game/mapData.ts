import type { Coin } from './coin';
import type { Walls, World } from './world';
import { CoinKind, Owner, Phase } from './types';

// A fully-specified, concrete map: every coin/stone/bomb has its position,
// radius and mass baked in. Built-in maps produce this via a template +
// GameConfig; custom maps and save files store this directly.
export interface MapCoinData {
  kind: CoinKind;
  owner: Owner;
  x: number;
  y: number;
  radius: number;
  mass: number;
}

export interface MapData {
  table: { width: number; height: number };
  walls: Walls;
  coins: MapCoinData[];
}

export function worldFromMapData(data: MapData): World {
  const coins: Coin[] = data.coins.map((c, id) => ({
    id,
    kind: c.kind,
    owner: c.owner,
    pos: { x: c.x, y: c.y },
    vel: { x: 0, y: 0 },
    radius: c.radius,
    mass: c.mass,
    alive: true,
  }));

  let p1 = 0;
  let p2 = 0;
  let neutral = 0;
  for (const c of coins) {
    if (c.owner === Owner.P1) p1++;
    else if (c.owner === Owner.P2) p2++;
    else neutral++;
  }

  return {
    table: { width: data.table.width, height: data.table.height },
    walls: { ...data.walls },
    coins,
    phase: Phase.Idle,
    current: Owner.P1,
    aliveCount: {
      [Owner.P1]: p1,
      [Owner.P2]: p2,
      [Owner.Neutral]: neutral,
    },
    shooterCoin: null,
    shooterFirstHitOpponent: false,
  };
}
