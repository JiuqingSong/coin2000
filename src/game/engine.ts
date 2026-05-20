import { Owner, Phase, type CoinId, type Vec2 } from './types';
import type { World } from './world';
import type { AimController } from '../input/aim';
import type { CanvasView } from '../render/canvas';
import type { Player } from '../players/player';
import type { Bell } from '../audio/bell';
import { config } from './config';
import { SIM_DT_MS } from './constants';
import type { MapData } from './mapData';
import { worldFromMapData } from './mapData';
import { allSettled, step, type PhysicsEvents } from './physics';
import { roundEnded, type RoundResult } from './rules';
import { materializeSelectedMap } from './setup';
import { draw } from '../render/renderer';

export interface TurnSettled {
  shooter: Owner;
  killedP1: number;
  killedP2: number;
}

export interface EngineOptions {
  view: CanvasView;
  aim: AimController;
  bell?: Bell;
  buildPlayer(owner: Owner): Player;
  onFrame?(world: World): void;
  onTurnStart?(owner: Owner): void;
  onShotFired?(shooter: Owner): void;
  onShotRecorded?(shooter: Owner.P1 | Owner.P2, coinId: CoinId, vel: Vec2): void;
  onTurnSettled?(info: TurnSettled): void;
  onRoundEnd?(result: RoundResult): void;
  onPaused?(): void;
}

export class Engine {
  world: World;
  private players: { [Owner.P1]: Player; [Owner.P2]: Player };
  private last: number | null = null;
  private acc = 0;
  private running = false;
  private readonly events: PhysicsEvents | undefined;
  private shooter: Owner | null = null;
  private preShotP1 = 0;
  private preShotP2 = 0;
  private currentMap: MapData;
  private paused = false;
  private pauseAfterSettle = false;

  constructor(private readonly opts: EngineOptions) {
    this.currentMap = materializeSelectedMap();
    this.world = worldFromMapData(this.currentMap);
    this.players = {
      [Owner.P1]: opts.buildPlayer(Owner.P1),
      [Owner.P2]: opts.buildPlayer(Owner.P2),
    };
    this.events = opts.bell
      ? {
          onCollide: () => opts.bell!.ringCollision(),
          onDie: () => opts.bell!.ringDie(),
          onExplode: () => opts.bell!.ringExplosion(),
        }
      : undefined;
  }

  getCurrentMap(): MapData {
    return this.currentMap;
  }

  start(): void {
    this.startWithMap(materializeSelectedMap());
  }

  startWithMap(map: MapData): void {
    this.players[this.world.current].cancelTurn();
    this.paused = false;
    this.pauseAfterSettle = false;
    this.currentMap = map;
    this.world = worldFromMapData(map);
    this.world.phase = Phase.Aiming;
    this.world.current = Owner.P1;
    this.last = null;
    this.acc = 0;
    this.shooter = null;
    this.players[this.world.current].startTurn(this.world, this.onShoot);
    this.opts.onTurnStart?.(this.world.current);
    if (!this.running) {
      this.running = true;
      requestAnimationFrame(this.tick);
    }
  }

  stop(): void {
    this.running = false;
    this.paused = false;
    this.pauseAfterSettle = false;
    this.players[Owner.P1].cancelTurn();
    this.players[Owner.P2].cancelTurn();
    this.opts.aim.stop();
    this.world.phase = Phase.Idle;
  }

  isPaused(): boolean {
    return this.paused;
  }

  pause(): void {
    if (this.paused || this.pauseAfterSettle) return;
    if (this.world.phase === Phase.Aiming) {
      this.players[this.world.current].cancelTurn();
      this.paused = true;
      this.opts.onPaused?.();
    } else if (this.world.phase === Phase.Simulating) {
      this.pauseAfterSettle = true;
    }
  }

  resume(): void {
    if (!this.paused) return;
    this.paused = false;
    if (this.world.phase === Phase.Aiming) {
      this.players[this.world.current].startTurn(this.world, this.onShoot);
      this.opts.onTurnStart?.(this.world.current);
    }
  }

  stepOne(): void {
    if (!this.paused) return;
    this.paused = false;
    this.pauseAfterSettle = true;
    if (this.world.phase === Phase.Aiming) {
      this.players[this.world.current].startTurn(this.world, this.onShoot);
      this.opts.onTurnStart?.(this.world.current);
    }
  }

  // Switch both players atomically while unpausing, so the world is never left
  // in a state where one player is a ReplayPlayer and the other is not.
  continueAsPlay(p1: Player, p2: Player): void {
    if (!this.paused) return;
    this.paused = false;
    this.pauseAfterSettle = false;
    this.players[Owner.P1] = p1;
    this.players[Owner.P2] = p2;
    const current = this.world.current;
    this.players[current].startTurn(this.world, this.onShoot);
    this.opts.onTurnStart?.(current);
  }

  setPlayer(owner: Owner.P1 | Owner.P2, player: Player): void {
    const wasActive =
      this.world.phase === Phase.Aiming && this.world.current === owner;
    if (wasActive) this.players[owner].cancelTurn();
    this.players[owner] = player;
    if (wasActive) {
      player.startTurn(this.world, this.onShoot);
      this.opts.onTurnStart?.(owner);
    }
  }

  private tick = (now: number) => {
    if (!this.running) return;
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
    const hoverId = this.world.phase === Phase.Aiming ? this.opts.aim.hover : null;
    const preview =
      this.world.phase === Phase.Aiming
        ? this.players[this.world.current].getPreview?.() ?? null
        : null;
    draw(this.opts.view, this.world, preview, hoverId);
    requestAnimationFrame(this.tick);
  };

  private onShoot = (coinId: CoinId, vel: Vec2) => {
    if (this.world.phase !== Phase.Aiming) return;
    const c = this.world.coins[coinId];
    if (!c || !c.alive || c.owner !== this.world.current) return;
    this.shooter = this.world.current;
    this.preShotP1 = this.world.aliveCount[Owner.P1];
    this.preShotP2 = this.world.aliveCount[Owner.P2];
    this.world.shooterCoin = c;
    this.world.shooterFirstHitOpponent = false;
    c.vel = { x: vel.x, y: vel.y };
    this.world.phase = Phase.Simulating;
    this.opts.bell?.ringShoot();
    this.opts.onShotRecorded?.(this.shooter, coinId, { x: vel.x, y: vel.y });
    this.opts.onShotFired?.(this.shooter);
  };

  private onSettled(): void {
    const shooter = this.shooter;
    const killedP1 = this.preShotP1 - this.world.aliveCount[Owner.P1];
    const killedP2 = this.preShotP2 - this.world.aliveCount[Owner.P2];
    const firstHitOpponent = this.world.shooterFirstHitOpponent;
    this.world.shooterCoin = null;
    this.world.shooterFirstHitOpponent = false;

    if (shooter !== null) {
      this.opts.onTurnSettled?.({ shooter, killedP1, killedP2 });
      this.shooter = null;
    }

    const result = roundEnded(this.world);
    if (result) {
      this.world.phase = Phase.RoundEnd;
      this.opts.onRoundEnd?.(result);
      return;
    }

    const enemyKilled = shooter === Owner.P1 ? killedP2 : killedP1;
    const ownKilled = shooter === Owner.P1 ? killedP1 : killedP2;
    const keepShot =
      shooter !== null &&
      config.keepShotOnKill &&
      enemyKilled > 0 &&
      ownKilled === 0 &&
      firstHitOpponent;

    if (!keepShot) {
      this.world.current = this.world.current === Owner.P1 ? Owner.P2 : Owner.P1;
    }
    this.world.phase = Phase.Aiming;
    this.opts.aim.stop();

    if (this.pauseAfterSettle) {
      this.pauseAfterSettle = false;
      this.paused = true;
      this.opts.onPaused?.();
      return;
    }

    this.players[this.world.current].startTurn(this.world, this.onShoot);
    this.opts.onTurnStart?.(this.world.current);
  }
}
