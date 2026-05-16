import type { World } from '../game/world';
import { Owner, type CoinId, type Vec2 } from '../game/types';
import { AI_SIM_TICK_CAP } from '../game/constants';
import { allSettled, step } from '../game/physics';

export function simulate(world: World, shooterId: CoinId, vel: Vec2): number {
  const w: World = structuredClone(world);
  const shooter = w.coins[shooterId];
  if (!shooter || !shooter.alive) return -Infinity;

  const own = shooter.owner;
  const enemy = own === Owner.P1 ? Owner.P2 : Owner.P1;
  const ownStart = w.aliveCount[own];
  const enemyStart = w.aliveCount[enemy];

  shooter.vel = { x: vel.x, y: vel.y };

  for (let t = 0; t < AI_SIM_TICK_CAP; t++) {
    step(w);
    if (allSettled(w)) break;
  }

  const ownKilled = ownStart - w.aliveCount[own];
  const enemyKilled = enemyStart - w.aliveCount[enemy];
  return enemyKilled - ownKilled;
}
