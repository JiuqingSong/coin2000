import type { Owner } from '../game/types';
import type { World } from '../game/world';
import type { AimPreview } from '../input/aim';
import { chooseShot } from '../ai/cpu';
import type { Player, ShotCallback } from './player';
import { ScriptedAim } from './scriptedAim';

export class AIPlayer implements Player {
  private aimer = new ScriptedAim();

  constructor(readonly owner: Owner) {}

  startTurn(world: World, onShoot: ShotCallback): void {
    const shot = chooseShot(world);
    if (!shot) return;
    this.aimer.start(world, shot.coinId, shot.vel, onShoot);
  }

  cancelTurn(): void {
    this.aimer.cancel();
  }

  getPreview(): AimPreview | null {
    return this.aimer.getPreview();
  }
}
