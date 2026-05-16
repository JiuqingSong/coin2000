import type { World } from '../game/world';
import { type CoinId, type Vec2 } from '../game/types';
import { AI_ANGLE_SAMPLES, MAX_SHOT_SPEED } from '../game/constants';
import { simulate } from './simulate';

export interface ChosenShot {
  coinId: CoinId;
  vel: Vec2;
}

export function chooseShot(world: World): ChosenShot | null {
  const me = world.current;
  let best: { score: number; coinId: CoinId; vel: Vec2 } | null = null;

  for (const my of world.coins) {
    if (!my.alive || my.owner !== me) continue;
    for (const enemy of world.coins) {
      if (!enemy.alive || enemy.owner === me) continue;

      const dx = enemy.pos.x - my.pos.x;
      const dy = enemy.pos.y - my.pos.y;
      const dist = Math.hypot(dx, dy);
      if (dist < 1e-6) continue;

      const baseAngle = Math.atan2(dy, dx);
      const tangentSpread = Math.atan(enemy.radius / dist);
      const half = (AI_ANGLE_SAMPLES - 1) / 2;

      for (let k = 0; k < AI_ANGLE_SAMPLES; k++) {
        const t = half === 0 ? 0 : (k - half) / half;
        const angle = baseAngle + tangentSpread * t;
        const vel: Vec2 = {
          x: Math.cos(angle) * MAX_SHOT_SPEED,
          y: Math.sin(angle) * MAX_SHOT_SPEED,
        };
        const score = simulate(world, my.id, vel);
        if (best === null || score > best.score) {
          best = { score, coinId: my.id, vel };
        }
      }
    }
  }

  return best ? { coinId: best.coinId, vel: best.vel } : null;
}
