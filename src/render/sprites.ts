import type { Coin } from '../game/coin';
import type { Table } from '../game/table';
import { Owner } from '../game/types';

const OWNER_COLOR: Record<Owner, string> = {
  [Owner.P1]: '#4aa3ff',
  [Owner.P2]: '#ff6b5a',
};

const OWNER_ACTIVE_COLOR: Record<Owner, string> = {
  [Owner.P1]: '#8ac6ff',
  [Owner.P2]: '#ff9a8a',
};

const WALL_THICKNESS = 4;

let wallPattern: CanvasPattern | null = null;

function getWallPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (wallPattern) return wallPattern;
  const tile = document.createElement('canvas');
  tile.width = 6;
  tile.height = 6;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;
  tctx.fillStyle = '#3a4252';
  tctx.fillRect(0, 0, 6, 6);
  tctx.strokeStyle = '#222831';
  tctx.lineWidth = 1.4;
  tctx.beginPath();
  // diagonal stripes (top-left to bottom-right repeat)
  tctx.moveTo(-2, 4); tctx.lineTo(4, -2);
  tctx.moveTo(0, 6);  tctx.lineTo(6, 0);
  tctx.moveTo(2, 8);  tctx.lineTo(8, 2);
  tctx.stroke();
  wallPattern = ctx.createPattern(tile, 'repeat');
  return wallPattern;
}

export function drawTable(ctx: CanvasRenderingContext2D, table: Table): void {
  ctx.fillStyle = '#173d2c';
  ctx.fillRect(0, 0, table.width, table.height);

  const pattern = getWallPattern(ctx);
  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, WALL_THICKNESS, table.height);
    ctx.fillRect(table.width - WALL_THICKNESS, 0, WALL_THICKNESS, table.height);
  } else {
    ctx.fillStyle = '#3a4252';
    ctx.fillRect(0, 0, WALL_THICKNESS, table.height);
    ctx.fillRect(table.width - WALL_THICKNESS, 0, WALL_THICKNESS, table.height);
  }

  // 3D edge: light inner line, dark outer line on each wall
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(WALL_THICKNESS + 0.5, 0);
  ctx.lineTo(WALL_THICKNESS + 0.5, table.height);
  ctx.moveTo(table.width - WALL_THICKNESS - 0.5, 0);
  ctx.lineTo(table.width - WALL_THICKNESS - 0.5, table.height);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.moveTo(0.5, 0);
  ctx.lineTo(0.5, table.height);
  ctx.moveTo(table.width - 0.5, 0);
  ctx.lineTo(table.width - 0.5, table.height);
  ctx.stroke();

  // table outline (top & bottom) — kill edges, in a warmer tone
  ctx.strokeStyle = '#8a3a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, 1); ctx.lineTo(table.width, 1);
  ctx.moveTo(0, table.height - 1); ctx.lineTo(table.width, table.height - 1);
  ctx.stroke();
}

export function drawCoin(ctx: CanvasRenderingContext2D, coin: Coin, active = false): void {
  if (!coin.alive) return;
  const { x, y } = coin.pos;
  const r = coin.radius;
  const base = active ? OWNER_ACTIVE_COLOR[coin.owner] : OWNER_COLOR[coin.owner];

  // soft cast shadow under coin
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 2, r * 0.95, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();

  // base disc
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // radial gradient (highlight top-left)
  const grad = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, 1, x, y, r);
  grad.addColorStop(0, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // inner bevel arcs (3D highlight + shadow) — mirrors Pascal arc 45..225 / 225..45
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.arc(x, y, r - 2, Math.PI * 1.25, Math.PI * 0.25);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.arc(x, y, r - 2, Math.PI * 0.25, Math.PI * 1.25);
  ctx.stroke();

  // outer edge
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();

  // slot marker on top — matches Pascal `drawline(x-1, y-5, x+1, y, 0, 15, 8, -1)`
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y - r + 2);
  ctx.lineTo(x, y - r + 6);
  ctx.stroke();

  if (active) {
    ctx.strokeStyle = 'rgba(255, 230, 120, 0.9)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(x, y, r + 2, 0, Math.PI * 2);
    ctx.stroke();
  }
}
