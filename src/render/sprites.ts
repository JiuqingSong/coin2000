import type { Coin } from '../game/coin';
import type { Table } from '../game/table';
import type { Walls } from '../game/world';
import { CoinKind, Owner } from '../game/types';
import { config } from '../game/config';
import { EXPLODE_TICKS } from '../game/constants';

const WALL_THICKNESS = 4;
const STONE_COLOR = '#c84acb';
const BOMB_OUTER = '#222222';
const BOMB_INNER = '#f5e8cb';

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
  tctx.moveTo(-2, 4); tctx.lineTo(4, -2);
  tctx.moveTo(0, 6);  tctx.lineTo(6, 0);
  tctx.moveTo(2, 8);  tctx.lineTo(8, 2);
  tctx.stroke();
  wallPattern = ctx.createPattern(tile, 'repeat');
  return wallPattern;
}

const DEFAULT_WALLS: Walls = {
  top: 'kill',
  bottom: 'kill',
  left: 'bounce',
  right: 'bounce',
};

export function drawTable(
  ctx: CanvasRenderingContext2D,
  table: Table,
  walls: Walls = DEFAULT_WALLS,
): void {
  ctx.fillStyle = '#173d2c';
  ctx.fillRect(0, 0, table.width, table.height);

  const pattern = getWallPattern(ctx);
  const bounceFill: string | CanvasPattern = pattern ?? '#3a4252';

  // Bounce walls: thick stone-pattern bar, then thin highlight + shadow lines.
  if (walls.left === 'bounce') {
    ctx.fillStyle = bounceFill;
    ctx.fillRect(0, 0, WALL_THICKNESS, table.height);
    drawBounceEdgeAccent(ctx, WALL_THICKNESS + 0.5, 0, WALL_THICKNESS + 0.5, table.height, 0.5, 0, 0.5, table.height);
  }
  if (walls.right === 'bounce') {
    ctx.fillStyle = bounceFill;
    ctx.fillRect(table.width - WALL_THICKNESS, 0, WALL_THICKNESS, table.height);
    drawBounceEdgeAccent(
      ctx,
      table.width - WALL_THICKNESS - 0.5, 0,
      table.width - WALL_THICKNESS - 0.5, table.height,
      table.width - 0.5, 0,
      table.width - 0.5, table.height,
    );
  }
  if (walls.top === 'bounce') {
    ctx.fillStyle = bounceFill;
    ctx.fillRect(0, 0, table.width, WALL_THICKNESS);
    drawBounceEdgeAccent(ctx, 0, WALL_THICKNESS + 0.5, table.width, WALL_THICKNESS + 0.5, 0, 0.5, table.width, 0.5);
  }
  if (walls.bottom === 'bounce') {
    ctx.fillStyle = bounceFill;
    ctx.fillRect(0, table.height - WALL_THICKNESS, table.width, WALL_THICKNESS);
    drawBounceEdgeAccent(
      ctx,
      0, table.height - WALL_THICKNESS - 0.5,
      table.width, table.height - WALL_THICKNESS - 0.5,
      0, table.height - 0.5,
      table.width, table.height - 0.5,
    );
  }

  // Kill walls: red danger line just inside the edge.
  ctx.strokeStyle = '#8a3a2e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (walls.top === 'kill') {
    ctx.moveTo(0, 1); ctx.lineTo(table.width, 1);
  }
  if (walls.bottom === 'kill') {
    ctx.moveTo(0, table.height - 1); ctx.lineTo(table.width, table.height - 1);
  }
  if (walls.left === 'kill') {
    ctx.moveTo(1, 0); ctx.lineTo(1, table.height);
  }
  if (walls.right === 'kill') {
    ctx.moveTo(table.width - 1, 0); ctx.lineTo(table.width - 1, table.height);
  }
  ctx.stroke();
}

function drawBounceEdgeAccent(
  ctx: CanvasRenderingContext2D,
  hiX1: number, hiY1: number, hiX2: number, hiY2: number,
  shX1: number, shY1: number, shX2: number, shY2: number,
): void {
  ctx.lineWidth = 1;
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.beginPath();
  ctx.moveTo(hiX1, hiY1);
  ctx.lineTo(hiX2, hiY2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.moveTo(shX1, shY1);
  ctx.lineTo(shX2, shY2);
  ctx.stroke();
}

export function drawPiece(ctx: CanvasRenderingContext2D, coin: Coin, active = false): void {
  if (coin.exploding) {
    drawExplosion(ctx, coin);
    return;
  }
  if (!coin.alive) return;
  switch (coin.kind) {
    case CoinKind.Stone:
      drawStone(ctx, coin);
      return;
    case CoinKind.Bomb:
      drawBomb(ctx, coin);
      return;
    case CoinKind.Coin:
    default:
      drawCoin(ctx, coin, active);
      return;
  }
}

function drawCoin(ctx: CanvasRenderingContext2D, coin: Coin, active: boolean): void {
  const { x, y } = coin.pos;
  const r = coin.radius;
  const ownerColor = coin.owner === Owner.P1 ? config.p1Color : config.p2Color;
  const base = active ? lighten(ownerColor, 0.18) : ownerColor;

  shadow(ctx, x, y, r);

  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  applyBevel(ctx, x, y, r);

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

function drawStone(ctx: CanvasRenderingContext2D, coin: Coin): void {
  const { x, y } = coin.pos;
  const r = coin.radius;

  shadow(ctx, x, y, r);

  ctx.fillStyle = STONE_COLOR;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  applyBevel(ctx, x, y, r);

  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBomb(ctx: CanvasRenderingContext2D, coin: Coin): void {
  const { x, y } = coin.pos;
  const r = coin.radius;

  shadow(ctx, x, y, r);

  // outer dark casing
  ctx.fillStyle = BOMB_OUTER;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // inner light core (fuse marker)
  ctx.fillStyle = BOMB_INNER;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.45, 0, Math.PI * 2);
  ctx.fill();

  // small fuse spark dot at top
  ctx.fillStyle = '#ff9a3c';
  ctx.beginPath();
  ctx.arc(x, y - r + 2, 1.6, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.stroke();
}

function drawExplosion(ctx: CanvasRenderingContext2D, coin: Coin): void {
  if (!coin.exploding) return;
  const { x, y } = coin.pos;
  const { ticksLeft, startRadius, peakRadius } = coin.exploding;
  // EXPLODE_TICKS is implicit: progress = 1 - ticksLeft / startTicks, but we
  // don't have startTicks here; derive from the current ticksLeft / a constant
  // assumed equal to constants.EXPLODE_TICKS. Instead, just normalize using
  // ticksLeft directly: render with radius shrinking from peakRadius (at the
  // start) toward startRadius (at the end of the animation).
  const t = Math.max(0, ticksLeft);
  const p = 1 - t / EXPLODE_TICKS;
  const radius = startRadius + (peakRadius - startRadius) * p;

  const grad = ctx.createRadialGradient(x, y, Math.max(1, radius * 0.2), x, y, radius);
  grad.addColorStop(0, `rgba(255, 230, 90, ${0.85 * (1 - p * 0.6)})`);
  grad.addColorStop(0.5, `rgba(255, 130, 40, ${0.55 * (1 - p * 0.6)})`);
  grad.addColorStop(1, 'rgba(160, 30, 10, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 90, 30, ${0.9 * (1 - p)})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.stroke();
}

function shadow(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.ellipse(x + 1, y + 2, r * 0.95, r * 0.55, 0, 0, Math.PI * 2);
  ctx.fill();
}

function applyBevel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const grad = ctx.createRadialGradient(x - r * 0.4, y - r * 0.5, 1, x, y, r);
  grad.addColorStop(0, 'rgba(255,255,255,0.55)');
  grad.addColorStop(0.55, 'rgba(255,255,255,0.0)');
  grad.addColorStop(1, 'rgba(0,0,0,0.25)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.beginPath();
  ctx.arc(x, y, r - 2, Math.PI * 1.25, Math.PI * 0.25);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.5)';
  ctx.beginPath();
  ctx.arc(x, y, r - 2, Math.PI * 0.25, Math.PI * 1.25);
  ctx.stroke();
}

function lighten(hex: string, amount: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) return hex;
  const n = parseInt(m[1]!, 16);
  const r = (n >> 16) & 0xff;
  const g = (n >> 8) & 0xff;
  const b = n & 0xff;
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  return '#' + ((mix(r) << 16) | (mix(g) << 8) | mix(b)).toString(16).padStart(6, '0');
}
