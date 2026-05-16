import type { Coin } from './coin';
import type { World } from './world';
import { FRICTION_MU, G, RESTITUTION, SETTLED_EPS } from './constants';

const COLLISION_SLACK = 2;

export interface PhysicsEvents {
  onCollide?(a: Coin, b: Coin): void;
  onDie?(c: Coin): void;
}

export function step(world: World, events?: PhysicsEvents): void {
  const coins = world.coins;
  const prev: Array<{ x: number; y: number }> = new Array(coins.length);

  for (let i = 0; i < coins.length; i++) {
    const c = coins[i]!;
    prev[i] = { x: c.pos.x, y: c.pos.y };
    if (!c.alive) continue;
    c.pos.x += c.vel.x;
    c.pos.y += c.vel.y;
  }

  for (let i = 0; i < coins.length; i++) {
    for (let j = i + 1; j < coins.length; j++) {
      const a = coins[i]!;
      const b = coins[j]!;
      if (!a.alive || !b.alive) continue;
      if (!overlaps(a, b)) continue;
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

  for (let i = 0; i < coins.length; i++) {
    const c = coins[i]!;
    if (!c.alive) continue;
    const r = c.radius;
    const outY = c.pos.y < r || c.pos.y > world.table.height - r;
    if (outY) {
      c.alive = false;
      world.aliveCount[c.owner]--;
      events?.onDie?.(c);
      continue;
    }
    const outX = c.pos.x < r || c.pos.x > world.table.width - r;
    if (outX) {
      const p = prev[i]!;
      c.pos.x = p.x;
      c.pos.y = p.y;
      c.vel.x = -c.vel.x;
    }
  }

  for (const c of coins) {
    if (!c.alive) continue;
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
    if (!c.alive) continue;
    if (c.vel.x !== 0 || c.vel.y !== 0) return false;
  }
  return true;
}
