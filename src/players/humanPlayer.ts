import type { Owner } from '../game/types';
import type { World } from '../game/world';
import type { AimController, AimPreview } from '../input/aim';
import type { Player, ShotCallback } from './player';

export class HumanPlayer implements Player {
  constructor(
    readonly owner: Owner,
    private readonly aim: AimController,
  ) {}

  startTurn(world: World, onShoot: ShotCallback): void {
    this.aim.startAiming(this.owner, world, onShoot);
  }

  cancelTurn(): void {
    this.aim.stop();
  }

  getPreview(): AimPreview | null {
    return this.aim.preview;
  }
}
