import type { Coin } from './coin';
import type { World } from './world';
import { CoinKind, Owner } from './types';
import {
  DROP_TICKS,
  EXPLODE_TICKS,
  FRICTION_MU,
  G,
  RESTITUTION,
  SETTLED_EPS,
} from './constants';
import { config } from './config';

const COLLISION_SLACK = 2;

export interface PhysicsEvents {
  onCollide?(a: Coin, b: Coin): void;
  onDie?(c: Coin): void;
  onExplode?(bomb: Coin): void;
}

export function step(world: World, events?: PhysicsEvents): void {
  const coins = world.coins;
  const prev: Array<{ x: number; y: number }> = new Array(coins.length);

  // 1. Save pre-move positions, then move (exploding bombs don't move)
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i]!;
    prev[i] = { x: c.pos.x, y: c.pos.y };
    if (!c.alive || c.exploding) continue;
    c.pos.x += c.vel.x;
    c.pos.y += c.vel.y;
  }

  // 2. Advance ongoing explosion / drop animations
  for (const c of coins) {
    if (c.exploding) {
      c.exploding.ticksLeft--;
      if (c.exploding.ticksLeft <= 0) {
        c.alive = false;
        c.exploding = undefined;
      }
    }
    if (c.dropping) {
      c.dropping.ticksLeft--;
      if (c.dropping.ticksLeft <= 0) {
        c.dropping = undefined;
      }
    }
  }

  // 3. Pair collisions — trigger explosions for non-exploding bombs
  for (let i = 0; i < coins.length; i++) {
    for (let j = i + 1; j < coins.length; j++) {
      const a = coins[i]!;
      const b = coins[j]!;
      if (!a.alive || !b.alive) continue;
      if (a.exploding || b.exploding) continue;
      if (!overlaps(a, b)) continue;

      const aBomb = a.kind === CoinKind.Bomb;
      const bBomb = b.kind === CoinKind.Bomb;

      if (aBomb || bBomb) {
        const bomb = aBomb ? a : b;
        const trigger = aBomb ? b : a;
        if (trigger.kind === CoinKind.Bomb) {
          // Two bombs colliding — both trigger; treat one as the bomb and the
          // other as the trigger that will (likely) die in the explosion.
          triggerExplosion(world, bomb, trigger, events);
        } else {
          triggerExplosion(world, bomb, trigger, events);
        }
        continue;
      }

      const pa = prev[i]!;
      const pb = prev[j]!;
      a.pos.x = pa.x;
      a.pos.y = pa.y;
      b.pos.x = pb.x;
      b.pos.y = pb.y;
      resolveCollision(a, b);
      events?.onCollide?.(a, b);
    }
  }

  // 4. Walls
  const walls = world.walls;
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i]!;
    if (!c.alive || c.exploding) continue;
    const r = c.radius;
    const outTop = c.pos.y < r;
    const outBottom = c.pos.y > world.table.height - r;
    const outLeft = c.pos.x < r;
    const outRight = c.pos.x > world.table.width - r;

    if (
      (outTop && walls.top === 'kill') ||
      (outBottom && walls.bottom === 'kill') ||
      (outLeft && walls.left === 'kill') ||
      (outRight && walls.right === 'kill')
    ) {
      c.alive = false;
      c.vel.x = 0;
      c.vel.y = 0;
      c.dropping = {
        ticksLeft: DROP_TICKS,
        totalTicks: DROP_TICKS,
        startRadius: c.radius,
      };
      decrementAlive(world, c);
      events?.onDie?.(c);
      continue;
    }

    const p = prev[i]!;
    if (outTop || outBottom) {
      c.pos.y = p.y;
      c.vel.y = -c.vel.y;
    }
    if (outLeft || outRight) {
      c.pos.x = p.x;
      c.vel.x = -c.vel.x;
    }
  }

  // 5. Friction
  for (const c of coins) {
    if (!c.alive || c.exploding) continue;
    const s = Math.hypot(c.vel.x, c.vel.y);
    if (s < SETTLED_EPS) {
      c.vel.x = 0;
      c.vel.y = 0;
      continue;
    }
    const s2sq = s * s - 2 * FRICTION_MU * G * s;
    if (s2sq <= 0) {
      c.vel.x = 0;
      c.vel.y = 0;
      continue;
    }
    const k = Math.sqrt(s2sq) / s;
    c.vel.x *= k;
    c.vel.y *= k;
  }
}

export function overlaps(a: Coin, b: Coin): boolean {
  const dx = a.pos.x - b.pos.x;
  const dy = a.pos.y - b.pos.y;
  const r = a.radius + b.radius + COLLISION_SLACK;
  return dx * dx + dy * dy <= r * r;
}

export function resolveCollision(a: Coin, b: Coin): void {
  const s = Math.atan2(b.pos.y - a.pos.y, b.pos.x - a.pos.x);
  const cs = Math.cos(s);
  const sn = Math.sin(s);

  const aAlong =  a.vel.x * cs + a.vel.y * sn;
  const aCross = -a.vel.x * sn + a.vel.y * cs;
  const bAlong =  b.vel.x * cs + b.vel.y * sn;
  const bCross = -b.vel.x * sn + b.vel.y * cs;

  const m1 = a.mass;
  const m2 = b.mass;
  const sum = m1 + m2;
  const aAlong2 = ((m1 - m2) * aAlong + 2 * m2 * bAlong) / sum * RESTITUTION;
  const bAlong2 = ((m2 - m1) * bAlong + 2 * m1 * aAlong) / sum * RESTITUTION;

  a.vel.x = aAlong2 * cs - aCross * sn;
  a.vel.y = aAlong2 * sn + aCross * cs;
  b.vel.x = bAlong2 * cs - bCross * sn;
  b.vel.y = bAlong2 * sn + bCross * cs;
}

export function allSettled(world: World): boolean {
  for (const c of world.coins) {
    if (c.exploding) return false;
    if (c.dropping) return false;
    if (!c.alive) continue;
    if (c.vel.x !== 0 || c.vel.y !== 0) return false;
  }
  return true;
}

function triggerExplosion(
  world: World,
  initialBomb: Coin,
  initialTrigger: Coin,
  events: PhysicsEvents | undefined,
): void {
  const triggerOwner = initialTrigger.owner;
  const peakRadius = config.explosionRadius;
  const queue: Coin[] = [initialBomb];

  while (queue.length > 0) {
    const bomb = queue.shift()!;
    if (bomb.exploding || !bomb.alive) continue;

    bomb.exploding = {
      ticksLeft: EXPLODE_TICKS,
      startRadius: bomb.radius,
      peakRadius,
    };
    bomb.vel.x = 0;
    bomb.vel.y = 0;
    events?.onExplode?.(bomb);

    for (const victim of world.coins) {
      if (victim === bomb) continue;
      if (!victim.alive) continue;
      if (victim.exploding) continue;

      const dx = victim.pos.x - bomb.pos.x;
      const dy = victim.pos.y - bomb.pos.y;
      const r = peakRadius + victim.radius;
      if (dx * dx + dy * dy > r * r) continue;

      const isInitialTrigger = victim === initialTrigger;
      if (
        !isInitialTrigger &&
        config.misfireProtection &&
        victim.owner !== Owner.Neutral &&
        victim.owner === triggerOwner
      ) {
        continue;
      }

      if (victim.kind === CoinKind.Bomb && config.chainBombs && !victim.exploding) {
        queue.push(victim);
        continue;
      }

      victim.alive = false;
      decrementAlive(world, victim);
      // Skip events.onDie here — the bomb's onExplode covers the audio cue for
      // every victim in the blast. Per-victim die tones would pile on top of
      // the boom and sound chaotic.
    }
  }
}

function decrementAlive(world: World, c: Coin): void {
  if (c.owner === Owner.P1) world.aliveCount[Owner.P1]--;
  else if (c.owner === Owner.P2) world.aliveCount[Owner.P2]--;
  else world.aliveCount[Owner.Neutral]--;
}
