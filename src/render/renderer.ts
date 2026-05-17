import type { World } from '../game/world';
import type { AimPreview } from '../input/aim';
import { CoinKind, type CoinId } from '../game/types';
import type { CanvasView } from './canvas';
import { config } from '../game/config';
import { drawPiece, drawTable } from './sprites';

export function draw(
  view: CanvasView,
  world: World,
  aim: AimPreview | null = null,
  hoverId: CoinId | null = null,
): void {
  view.resetTransform();
  view.ctx.fillStyle = '#0e1115';
  view.ctx.fillRect(0, 0, view.cssWidth, view.cssHeight);

  view.applyTableTransform(world.table);
  drawTable(view.ctx, world.table, world.walls);
  const activeId = aim?.coinId ?? null;
  // Holes are drawn first so dropping pieces shrink visually on top of them.
  for (const coin of world.coins) {
    if (coin.kind !== CoinKind.Hole) continue;
    drawPiece(view.ctx, coin, false, false);
  }
  for (const coin of world.coins) {
    if (coin.kind === CoinKind.Hole) continue;
    const isActive = coin.id === activeId;
    const isHovered = !isActive && coin.id === hoverId;
    drawPiece(view.ctx, coin, isActive, isHovered);
  }
  if (aim) drawAim(view.ctx, aim);
}

function drawAim(ctx: CanvasRenderingContext2D, aim: AimPreview): void {
  const length = aim.power * config.maxShotSpeed * 6;
  // Below ~1px the arrowhead would draw as a degenerate triangle on top of the
  // coin. Skip drawing entirely so the AI's "highlight only" phase reads as
  // just the chosen-coin glow.
  if (length < 1) return;
  const x2 = aim.from.x + aim.dir.x * length;
  const y2 = aim.from.y + aim.dir.y * length;

  ctx.save();
  ctx.strokeStyle = `rgba(255, 230, 120, ${0.4 + 0.6 * aim.power})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(aim.from.x, aim.from.y);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  const head = 6;
  const ang = Math.atan2(aim.dir.y, aim.dir.x);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - head * Math.cos(ang - Math.PI / 6), y2 - head * Math.sin(ang - Math.PI / 6));
  ctx.lineTo(x2 - head * Math.cos(ang + Math.PI / 6), y2 - head * Math.sin(ang + Math.PI / 6));
  ctx.closePath();
  ctx.fillStyle = `rgba(255, 230, 120, ${0.6 + 0.4 * aim.power})`;
  ctx.fill();
  ctx.restore();
}
