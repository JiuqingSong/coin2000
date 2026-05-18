import { Owner } from '../game/types';
import type { World } from '../game/world';
import type { AimPreview } from '../input/aim';
import type { Player, ShotCallback } from './player';
import type { ShotRecord } from '../replay/types';
import { ScriptedAim } from './scriptedAim';

export interface ReplayQueue {
  next(): ShotRecord | undefined;
  prepend(shot: ShotRecord): void;
  remaining(): number;
}

export function createReplayQueue(shots: readonly ShotRecord[]): ReplayQueue {
  const q = shots.slice();
  return {
    next() { return q.shift(); },
    prepend(shot) { q.unshift(shot); },
    remaining() { return q.length; },
  };
}

export class ReplayPlayer implements Player {
  private aimer = new ScriptedAim();
  private pendingShot: ShotRecord | null = null;

  constructor(
    readonly owner: Owner.P1 | Owner.P2,
    private readonly queue: ReplayQueue,
  ) {}

  startTurn(world: World, onShoot: ShotCallback): void {
    const shot = this.queue.next();
    if (!shot || shot.shooter !== this.owner) return;
    this.pendingShot = shot;
    this.aimer.start(world, shot.coinId, shot.vel, (coinId, vel) => {
      this.pendingShot = null;
      onShoot(coinId, vel);
    });
  }

  cancelTurn(): void {
    this.aimer.cancel();
    if (this.pendingShot !== null) {
      this.queue.prepend(this.pendingShot);
      this.pendingShot = null;
    }
  }

  getPreview(): AimPreview | null {
    return this.aimer.getPreview();
  }
}
