import type { World } from '../game/world';
import type { CoinId, Vec2 } from '../game/types';
import type { AimPreview } from '../input/aim';
import { AIM_CHARGE_MS, AIM_HIGHLIGHT_MS, AIM_HOLD_MS } from '../game/constants';
import { config } from '../game/config';
import type { ShotCallback } from './player';

interface Aiming {
  world: World;
  coinId: CoinId;
  vel: Vec2;
  dir: Vec2;
  targetPower: number;
  startMs: number;
}

// Drives the pre-shot aiming animation for any player that already knows what
// it wants to shoot (AI, replay). The animation has three phases:
//   1. highlight  — coin glows, no aim line yet
//   2. charging   — aim line grows from 0 to the target speed
//   3. hold       — line stays at full draw, then the shot fires
export class ScriptedAim {
  private state: Aiming | null = null;
  private pending: ReturnType<typeof setTimeout> | null = null;

  start(
    world: World,
    coinId: CoinId,
    vel: Vec2,
    onShoot: ShotCallback,
  ): void {
    const speed = Math.hypot(vel.x, vel.y);
    if (speed < 1e-6) {
      onShoot(coinId, vel);
      return;
    }
    this.state = {
      world,
      coinId,
      vel,
      dir: { x: vel.x / speed, y: vel.y / speed },
      targetPower: Math.min(1, speed / config.maxShotSpeed),
      startMs: performance.now(),
    };
    const total = AIM_HIGHLIGHT_MS + AIM_CHARGE_MS + AIM_HOLD_MS;
    this.pending = setTimeout(() => {
      this.pending = null;
      this.state = null;
      onShoot(coinId, vel);
    }, total);
  }

  cancel(): void {
    if (this.pending !== null) {
      clearTimeout(this.pending);
      this.pending = null;
    }
    this.state = null;
  }

  getPreview(): AimPreview | null {
    if (this.state === null) return null;
    const { coinId, dir, targetPower, startMs, world } = this.state;
    const coin = world.coins[coinId];
    if (!coin || !coin.alive) return null;
    const elapsed = performance.now() - startMs;
    let power: number;
    if (elapsed <= AIM_HIGHLIGHT_MS) {
      power = 0;
    } else if (elapsed <= AIM_HIGHLIGHT_MS + AIM_CHARGE_MS) {
      const t = (elapsed - AIM_HIGHLIGHT_MS) / AIM_CHARGE_MS;
      power = targetPower * t;
    } else {
      power = targetPower;
    }
    return {
      coinId,
      from: { x: coin.pos.x, y: coin.pos.y },
      dir,
      power,
    };
  }
}
