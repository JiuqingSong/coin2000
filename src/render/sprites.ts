import type { Coin } from '../game/coin';
import type { Table } from '../game/table';
import { Owner } from '../game/types';

const OWNER_COLOR: Record<Owner, string> = {
  [Owner.P1]: '#4aa3ff',
  [Owner.P2]: '#ff6b5a',
};

export function drawTable(ctx: CanvasRenderingContext2D, table: Table): void {
  ctx.fillStyle = '#173d2c';
  ctx.fillRect(0, 0, table.width, table.height);
  ctx.strokeStyle = '#d9c89a';
  ctx.lineWidth = 2;
  ctx.strokeRect(0.5, 0.5, table.width - 1, table.height - 1);
}

export function drawCoin(ctx: CanvasRenderingContext2D, coin: Coin): void {
  if (!coin.alive) return;
  ctx.fillStyle = OWNER_COLOR[coin.owner];
  ctx.beginPath();
  ctx.arc(coin.pos.x, coin.pos.y, coin.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();
}
