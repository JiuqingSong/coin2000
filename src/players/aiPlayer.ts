import type { Owner } from '../game/types';
import type { World } from '../game/world';
import { AI_THINK_MS } from '../game/constants';
import { chooseShot } from '../ai/cpu';
import type { Player, ShotCallback } from './player';

export class AIPlayer implements Player {
  private pending: ReturnType<typeof setTimeout> | null = null;

  constructor(readonly owner: Owner) {}

  startTurn(world: World, onShoot: ShotCallback): void {
    const shot = chooseShot(world);
    if (!shot) return;
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
