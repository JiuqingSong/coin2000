import type { World } from '../game/world';
import type { AimPreview } from '../input/aim';
import type { CanvasView } from './canvas';
import { MAX_SHOT_SPEED } from '../game/constants';
import { drawCoin, drawTable } from './sprites';

export function draw(view: CanvasView, world: World, aim: AimPreview | null = null): void {
  view.resetTransform();
  view.ctx.fillStyle = '#0e1115';
  view.ctx.fillRect(0, 0, view.cssWidth, view.cssHeight);

  view.applyTableTransform(world.table);
  drawTable(view.ctx, world.table);
  for (const coin of world.coins) {
    drawCoin(view.ctx, coin);
  }
  if (aim) drawAim(view.ctx, aim);
}

function drawAim(ctx: CanvasRenderingContext2D, aim: AimPreview): void {
  const length = aim.power * MAX_SHOT_SPEED * 6;
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
