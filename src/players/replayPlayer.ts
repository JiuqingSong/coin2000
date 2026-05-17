import { Owner } from '../game/types';
import type { World } from '../game/world';
import type { AimPreview } from '../input/aim';
import type { Player, ShotCallback } from './player';
import type { ShotRecord } from '../replay/types';
import { ScriptedAim } from './scriptedAim';

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
  private aimer = new ScriptedAim();

  constructor(
    readonly owner: Owner.P1 | Owner.P2,
    private readonly queue: ReplayQueue,
  ) {}

  startTurn(world: World, onShoot: ShotCallback): void {
    const shot = this.queue.next();
    if (!shot || shot.shooter !== this.owner) return;
    this.aimer.start(world, shot.coinId, shot.vel, onShoot);
  }

  cancelTurn(): void {
    this.aimer.cancel();
  }

  getPreview(): AimPreview | null {
    return this.aimer.getPreview();
  }
}
