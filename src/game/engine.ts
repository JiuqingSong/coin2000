import { Owner, Phase, type CoinId, type Vec2 } from './types';
import type { World } from './world';
import type { AimController } from '../input/aim';
import type { CanvasView } from '../render/canvas';
import type { Player } from '../players/player';
import type { Bell } from '../audio/bell';
import { SIM_DT_MS } from './constants';
import { allSettled, step, type PhysicsEvents } from './physics';
import { roundEnded, type RoundResult } from './rules';
import { initialWorld } from './setup';
import { draw } from '../render/renderer';

export interface EngineOptions {
  view: CanvasView;
  aim: AimController;
  bell?: Bell;
  buildPlayer(owner: Owner): Player;
  onFrame?(world: World): void;
  onRoundEnd?(result: RoundResult): void;
}

export class Engine {
  world: World;
  private players: { [Owner.P1]: Player; [Owner.P2]: Player };
  private last: number | null = null;
  private acc = 0;
  private running = false;
  private readonly events: PhysicsEvents | undefined;

  constructor(private readonly opts: EngineOptions) {
    this.world = initialWorld();
    this.players = {
      [Owner.P1]: opts.buildPlayer(Owner.P1),
      [Owner.P2]: opts.buildPlayer(Owner.P2),
    };
    this.events = opts.bell
      ? {
          onCollide: () => opts.bell!.ringCollision(),
          onDie: () => opts.bell!.ringDie(),
        }
      : undefined;
  }

  start(): void {
    this.players[this.world.current].cancelTurn();
    this.world = initialWorld();
    this.world.phase = Phase.Aiming;
    this.world.current = Owner.P1;
    this.last = null;
    this.acc = 0;
    this.players[this.world.current].startTurn(this.world, this.onShoot);
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this.tick);
    }
  }

  setPlayer(owner: Owner, player: Player): void {
    const wasActive =
      this.world.phase === Phase.Aiming && this.world.current === owner;
    if (wasActive) this.players[owner].cancelTurn();
    this.players[owner] = player;
    if (wasActive) player.startTurn(this.world, this.onShoot);
  }

  private tick = (now: number) => {
    const elapsed = this.last === null ? 0 : now - this.last;
    this.last = now;
    this.acc += elapsed;
    while (
      this.acc >= SIM_DT_MS &&
      this.world.phase === Phase.Simulating
    ) {
      step(this.world, this.events);
      this.acc -= SIM_DT_MS;
      if (allSettled(this.world)) {
        this.onSettled();
        break;
      }
    }
    if (this.world.phase !== Phase.Simulating) {
      this.acc = 0;
    }
    this.opts.onFrame?.(this.world);
    draw(this.opts.view, this.world, this.opts.aim.preview);
    requestAnimationFrame(this.tick);
  };

  private onShoot = (coinId: CoinId, vel: Vec2) => {
    if (this.world.phase !== Phase.Aiming) return;
    const c = this.world.coins[coinId];
    if (!c || !c.alive || c.owner !== this.world.current) return;
    c.vel = { x: vel.x, y: vel.y };
    this.world.phase = Phase.Simulating;
    this.opts.bell?.ringShoot();
  };

  private onSettled(): void {
    const result = roundEnded(this.world);
    if (result) {
      this.world.phase = Phase.RoundEnd;
      this.opts.onRoundEnd?.(result);
      return;
    }
    this.world.current = this.world.current === Owner.P1 ? Owner.P2 : Owner.P1;
    this.world.phase = Phase.Aiming;
    this.players[this.world.current].startTurn(this.world, this.onShoot);
  }
}
