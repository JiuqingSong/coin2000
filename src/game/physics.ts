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
const DROP_DECAY = 0.85;

export interface PhysicsEvents {
  onCollide?(a: Coin, b: Coin): void;
  onDie?(c: Coin): void;
  onExplode?(bomb: Coin): void;
}

export function step(world: World, events?: PhysicsEvents): void {
  const coins = world.coins;
  const prev: Array<{ x: number; y: number }> = new Array(coins.length);

  // 1. Save pre-move positions, then move (exploding bombs, trees, and holes
  //    don't move). Dropping pieces keep gliding along their last velocity but
  //    decay rapidly — visually they sail forward as they shrink into a hole
  //    or off a kill wall.
  for (let i = 0; i < coins.length; i++) {
    const c = coins[i]!;
    prev[i] = { x: c.pos.x, y: c.pos.y };
    if (c.exploding || c.kind === CoinKind.Tree || c.kind === CoinKind.Hole) continue;
    if (!c.alive && !c.dropping) continue;
    c.pos.x += c.vel.x;
    c.pos.y += c.vel.y;
    if (c.dropping) {
      c.vel.x *= DROP_DECAY;
      c.vel.y *= DROP_DECAY;
    }
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

      const aHole = a.kind === CoinKind.Hole;
      const bHole = b.kind === CoinKind.Hole;

      // Holes swallow anything that touches them — including bombs, before
      // the bomb branch gets a chance to detonate. The hole itself is
      // unaffected. Two overlapping holes is a placement bug; ignore.
      if (aHole || bHole) {
        if (aHole && bHole) continue;
        const hole = aHole ? a : b;
        const victim = aHole ? b : a;
        dropIntoHole(world, hole, victim, events);
        continue;
      }

      const aTree = a.kind === CoinKind.Tree;
      const bTree = b.kind === CoinKind.Tree;

      // Trees are static obstacles that bounce coins/stones/bombs — they
      // never move, never explode, never die. Must be checked before the
      // bomb branch so bombs bounce off trees instead of detonating.
      if (aTree || bTree) {
        if (aTree && bTree) continue; // two trees overlapping — placement bug
        const tree = aTree ? a : b;
        const mover = aTree ? b : a;
        resolveStaticCircle(tree, mover);
        events?.onCollide?.(a, b);
        continue;
      }

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
    if (!c.alive || c.exploding || c.kind === CoinKind.Tree || c.kind === CoinKind.Hole) continue;
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
      // Velocity is intentionally preserved — step 1 keeps the piece gliding
      // past the wall (decayed each tick) so it looks like it falls beyond
      // the edge rather than stopping dead at the kill line.
      c.alive = false;
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
    // Per-axis intent: bounce, teleport (with virtual target), or none.
    // Teleport edges are guaranteed to be paired (top↔bottom, left↔right)
    // by the editor, so a piece emerges on a wall of the same kind.
    let actionY: 'none' | 'bounce' | 'teleport' = 'none';
    let actionX: 'none' | 'bounce' | 'teleport' = 'none';
    let targetY = c.pos.y;
    let targetX = c.pos.x;

    if (outTop) {
      if (walls.top === 'teleport') {
        targetY = c.pos.y + (world.table.height - 2 * r);
        actionY = 'teleport';
      } else {
        actionY = 'bounce';
      }
    } else if (outBottom) {
      if (walls.bottom === 'teleport') {
        targetY = c.pos.y - (world.table.height - 2 * r);
        actionY = 'teleport';
      } else {
        actionY = 'bounce';
      }
    }
    if (outLeft) {
      if (walls.left === 'teleport') {
        targetX = c.pos.x + (world.table.width - 2 * r);
        actionX = 'teleport';
      } else {
        actionX = 'bounce';
      }
    } else if (outRight) {
      if (walls.right === 'teleport') {
        targetX = c.pos.x - (world.table.width - 2 * r);
        actionX = 'teleport';
      } else {
        actionX = 'bounce';
      }
    }

    // Virtual move + collide: if the teleport destination would overlap a
    // live piece, exchange velocities using the virtual position to pick
    // the contact normal — but don't actually move anyone. The teleport is
    // canceled and the teleporter falls back to its pre-step position,
    // same as a bounce, except the partner gains momentum from the hit.
    // Holes don't block (they'd swallow on next tick if the teleport
    // succeeded anyway); trees are static so they reflect the teleporter
    // off without moving themselves.
    let teleportBlocked = false;
    if (actionX === 'teleport' || actionY === 'teleport') {
      for (const other of coins) {
        if (other === c) continue;
        if (!other.alive || other.exploding) continue;
        if (other.kind === CoinKind.Hole) continue;
        const dx = targetX - other.pos.x;
        const dy = targetY - other.pos.y;
        const rr = r + other.radius + COLLISION_SLACK;
        if (dx * dx + dy * dy > rr * rr) continue;
        const savedX = c.pos.x;
        const savedY = c.pos.y;
        c.pos.x = targetX;
        c.pos.y = targetY;
        if (other.kind === CoinKind.Tree) {
          resolveStaticCircle(other, c);
        } else {
          resolveCollision(c, other);
        }
        c.pos.x = savedX;
        c.pos.y = savedY;
        teleportBlocked = true;
      }
    }

    if (actionY === 'teleport' && !teleportBlocked) {
      c.pos.y = targetY;
    } else if (actionY === 'bounce') {
      c.pos.y = p.y;
      c.vel.y = -c.vel.y;
    } else if (actionY === 'teleport') {
      // Teleport blocked — velocity already adjusted by the virtual
      // collision; just keep the piece inside the playable area.
      c.pos.y = p.y;
    }
    if (actionX === 'teleport' && !teleportBlocked) {
      c.pos.x = targetX;
    } else if (actionX === 'bounce') {
      c.pos.x = p.x;
      c.vel.x = -c.vel.x;
    } else if (actionX === 'teleport') {
      c.pos.x = p.x;
    }
  }

  // 5. Friction
  for (const c of coins) {
    if (!c.alive || c.exploding || c.kind === CoinKind.Tree || c.kind === CoinKind.Hole) continue;
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

// Reflect `mover` off a static circle (`tree`). Pushes the mover out along
// the contact normal so it no longer overlaps, then bounces the velocity
// component along that normal with RESTITUTION. The tree itself is unchanged.
export function resolveStaticCircle(tree: Coin, mover: Coin): void {
  let dx = mover.pos.x - tree.pos.x;
  let dy = mover.pos.y - tree.pos.y;
  let dist = Math.hypot(dx, dy);
  if (dist < 1e-6) {
    // Degenerate overlap — pick an arbitrary axis to separate along.
    dx = 1;
    dy = 0;
    dist = 1;
  }
  const nx = dx / dist;
  const ny = dy / dist;
  const minDist = tree.radius + mover.radius + COLLISION_SLACK;
  mover.pos.x = tree.pos.x + nx * minDist;
  mover.pos.y = tree.pos.y + ny * minDist;
  const vn = mover.vel.x * nx + mover.vel.y * ny;
  if (vn < 0) {
    mover.vel.x = (mover.vel.x - 2 * vn * nx) * RESTITUTION;
    mover.vel.y = (mover.vel.y - 2 * vn * ny) * RESTITUTION;
  }
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
      // Holes are indestructible — blasts don't touch them.
      if (victim.kind === CoinKind.Hole) continue;

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

// Geometric series sum Σ DECAY^k for k in [0, DROP_TICKS - 1]. A piece moved
// each tick with its velocity scaled by DROP_DECAY accumulates this factor
// times its initial velocity in total displacement, so velocity =
// displacement / DROP_SERIES lands it exactly at the target.
const DROP_SERIES = (1 - Math.pow(DROP_DECAY, DROP_TICKS)) / (1 - DROP_DECAY);

function dropIntoHole(
  world: World,
  hole: Coin,
  victim: Coin,
  events: PhysicsEvents | undefined,
): void {
  // Override the piece's velocity so it drifts to the hole center over the
  // drop animation, regardless of how fast the shot was. Without this, a
  // fast-moving piece would visibly fly past the hole as it shrank.
  victim.vel.x = (hole.pos.x - victim.pos.x) / DROP_SERIES;
  victim.vel.y = (hole.pos.y - victim.pos.y) / DROP_SERIES;
  victim.alive = false;
  victim.dropping = {
    ticksLeft: DROP_TICKS,
    totalTicks: DROP_TICKS,
    startRadius: victim.radius,
  };
  decrementAlive(world, victim);
  events?.onDie?.(victim);
}

function decrementAlive(world: World, c: Coin): void {
  if (c.owner === Owner.P1) world.aliveCount[Owner.P1]--;
  else if (c.owner === Owner.P2) world.aliveCount[Owner.P2]--;
  else world.aliveCount[Owner.Neutral]--;
}
