import { Owner } from '../game/types';
import type { World } from '../game/world';
import { AI_THINK_MS } from '../game/constants';
import type { Player, ShotCallback } from './player';
import type { ShotRecord } from '../replay/types';

export interface ReplayQueue {
  next(): ShotRecord | undefined;
  remaining(): number;
}

export function createReplayQueue(shots: readonly ShotRecord[]): ReplayQueue {
  const q = shots.slice();
  return {
    next() { return q.shift(); },
    remaining() { return q.length; },
  };
}

export class ReplayPlayer implements Player {
  private pending: ReturnType<typeof setTimeout> | null = null;

  constructor(
    readonly owner: Owner.P1 | Owner.P2,
    private readonly queue: ReplayQueue,
  ) {}

  startTurn(_world: World, onShoot: ShotCallback): void {
    const shot = this.queue.next();
    if (!shot || shot.shooter !== this.owner) return;
    this.pending = setTimeout(() => {
      this.pending = null;
      onShoot(shot.coinId, shot.vel);
    }, AI_THINK_MS);
  }

  cancelTurn(): void {
    if (this.pending !== null) {
      clearTimeout(this.pending);
      this.pending = null;
    }
  }
}
