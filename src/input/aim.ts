import type { World } from '../game/world';
import type { Coin } from '../game/coin';
import { Owner, type CoinId, type Vec2 } from '../game/types';
import type { CanvasView } from '../render/canvas';
import type { ShotCallback } from '../players/player';
import { MIN_DRAG_DIST, POWER_SCALE } from '../game/constants';
import { config } from '../game/config';

export interface AimPreview {
  coinId: CoinId;
  from: Vec2;
  dir: Vec2;
  power: number;
}

type State =
  | { kind: 'idle' }
  | {
      kind: 'dragging';
      coinId: CoinId;
      coinPos: Vec2;
      start: Vec2;
      current: Vec2;
      pointerId: number;
    };

export class AimController {
  private state: State = { kind: 'idle' };
  private activeOwner: Owner | null = null;
  private world: World | null = null;
  private onShoot: ShotCallback | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly view: CanvasView,
  ) {
    canvas.addEventListener('pointerdown', this.handleDown);
    canvas.addEventListener('pointermove', this.handleMove);
    canvas.addEventListener('pointerup', this.handleUp);
    canvas.addEventListener('pointercancel', this.handleAbort);
    canvas.addEventListener('pointerleave', this.handleAbort);
    document.addEventListener('keydown', this.handleKey);
  }

  startAiming(owner: Owner, world: World, onShoot: ShotCallback): void {
    this.activeOwner = owner;
    this.world = world;
    this.onShoot = onShoot;
    this.state = { kind: 'idle' };
  }

  stop(): void {
    this.activeOwner = null;
    this.world = null;
    this.onShoot = null;
    this.state = { kind: 'idle' };
  }

  get preview(): AimPreview | null {
    if (this.state.kind === 'idle') return null;
    const { coinId, coinPos, start, current } = this.state;
    const dx = start.x - current.x;
    const dy = start.y - current.y;
    const mag = Math.hypot(dx, dy);
    if (mag < 1e-6) return null;
    const maxSpeed = config.maxShotSpeed;
    const speed = Math.min(mag * POWER_SCALE, maxSpeed);
    return {
      coinId,
      from: { x: coinPos.x, y: coinPos.y },
      dir: { x: dx / mag, y: dy / mag },
      power: speed / maxSpeed,
    };
  }

  private handleDown = (e: PointerEvent) => {
    if (this.activeOwner === null || this.world === null) return;
    if (this.state.kind !== 'idle') return;
    const screen = this.toScreen(e);
    const table = this.view.screenToTable(screen, this.world.table);
    const coin = this.hitTest(table);
    if (!coin) return;
    this.canvas.setPointerCapture(e.pointerId);
    this.state = {
      kind: 'dragging',
      coinId: coin.id,
      coinPos: { x: coin.pos.x, y: coin.pos.y },
      start: screen,
      current: screen,
      pointerId: e.pointerId,
    };
  };

  private handleMove = (e: PointerEvent) => {
    if (this.state.kind !== 'dragging' || e.pointerId !== this.state.pointerId) return;
    this.state.current = this.toScreen(e);
  };

  private handleUp = (e: PointerEvent) => {
    if (this.state.kind !== 'dragging' || e.pointerId !== this.state.pointerId) return;
    const { coinId, start, current } = this.state;
    this.releaseCapture(e.pointerId);
    this.state = { kind: 'idle' };

    if (this.onShoot === null) return;
    const dx = start.x - current.x;
    const dy = start.y - current.y;
    const drag = Math.hypot(dx, dy);
    if (drag < MIN_DRAG_DIST) return;
    const speed = Math.min(drag * POWER_SCALE, config.maxShotSpeed);
    const k = speed / drag;
    this.onShoot(coinId, { x: dx * k, y: dy * k });
  };

  private handleAbort = (e: PointerEvent) => {
    if (this.state.kind !== 'dragging' || e.pointerId !== this.state.pointerId) return;
    this.releaseCapture(e.pointerId);
    this.state = { kind: 'idle' };
  };

  private handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && this.state.kind === 'dragging') {
      this.releaseCapture(this.state.pointerId);
      this.state = { kind: 'idle' };
    }
  };

  private releaseCapture(pointerId: number) {
    if (this.canvas.hasPointerCapture(pointerId)) {
      this.canvas.releasePointerCapture(pointerId);
    }
  }

  private toScreen(e: PointerEvent): Vec2 {
    const rect = this.canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  private hitTest(p: Vec2): Coin | null {
    if (this.world === null || this.activeOwner === null) return null;
    for (const c of this.world.coins) {
      if (!c.alive || c.owner !== this.activeOwner) continue;
      const dx = c.pos.x - p.x;
      const dy = c.pos.y - p.y;
      if (dx * dx + dy * dy <= c.radius * c.radius) return c;
    }
    return null;
  }
}
