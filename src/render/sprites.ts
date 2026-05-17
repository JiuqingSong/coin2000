import type { Coin } from '../game/coin';
import type { Table } from '../game/table';
import type { Walls } from '../game/world';
import { CoinKind, Owner } from '../game/types';
import { config } from '../game/config';
import { EXPLODE_TICKS } from '../game/constants';

const WALL_THICKNESS = 4;
const STONE_COLOR = '#7a7d82';
const BOMB_OUTER = '#222222';
const TREE_COLOR = '#2a6d3a';

let wallPattern: CanvasPattern | null = null;
let feltPattern: CanvasPattern | null = null;

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

function getFeltPattern(ctx: CanvasRenderingContext2D): CanvasPattern | null {
  if (feltPattern) return feltPattern;
  const size = 96;
  const tile = document.createElement('canvas');
  tile.width = size;
  tile.height = size;
  const tctx = tile.getContext('2d');
  if (!tctx) return null;

  tctx.fillStyle = '#173d2c';
  tctx.fillRect(0, 0, size, size);

  // Stable pseudo-random sequence so the tile edges seam reasonably.
  let seed = 1337;
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Dense fine speckles — felt-like fuzz.
  const speckleCount = size * size * 0.55;
  for (let i = 0; i < speckleCount; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const t = rand();
    const a = 0.05 + rand() * 0.08;
    tctx.fillStyle = t < 0.5
      ? `rgba(255,255,255,${a.toFixed(3)})`
      : `rgba(0,0,0,${a.toFixed(3)})`;
    tctx.fillRect(x, y, 1, 1);
  }

  // A handful of slightly larger fibers for visual variety.
  for (let i = 0; i < 40; i++) {
    const x = rand() * size;
    const y = rand() * size;
    const len = 2 + rand() * 4;
    const ang = rand() * Math.PI;
    tctx.strokeStyle = `rgba(255,255,255,${(0.04 + rand() * 0.05).toFixed(3)})`;
    tctx.lineWidth = 0.6;
    tctx.beginPath();
    tctx.moveTo(x, y);
    tctx.lineTo(x + Math.cos(ang) * len, y + Math.sin(ang) * len);
    tctx.stroke();
  }

  feltPattern = ctx.createPattern(tile, 'repeat');
  return feltPattern;
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
  const felt = getFeltPattern(ctx);
  ctx.fillStyle = felt ?? '#173d2c';
  ctx.fillRect(0, 0, table.width, table.height);

  // Soft center highlight, like an overhead lamp.
  const cx = table.width / 2;
  const cy = table.height / 2;
  const innerR = Math.min(table.width, table.height) * 0.15;
  const outerR = Math.hypot(table.width, table.height) * 0.6;
  const lamp = ctx.createRadialGradient(cx, cy, innerR, cx, cy, outerR);
  lamp.addColorStop(0, 'rgba(255,255,230,0.07)');
  lamp.addColorStop(0.55, 'rgba(0,0,0,0)');
  lamp.addColorStop(1, 'rgba(0,0,0,0.32)');
  ctx.fillStyle = lamp;
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

export function drawPiece(
  ctx: CanvasRenderingContext2D,
  coin: Coin,
  active = false,
  hovered = false,
): void {
  if (coin.exploding) {
    drawExplosion(ctx, coin);
    return;
  }
  if (coin.dropping) {
    drawDropping(ctx, coin);
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
    case CoinKind.Tree:
      drawTree(ctx, coin);
      return;
    case CoinKind.Hole:
      drawHole(ctx, coin);
      return;
    case CoinKind.Coin:
    default:
      drawCoin(ctx, coin, active, hovered);
      return;
  }
}

function drawDropping(ctx: CanvasRenderingContext2D, coin: Coin): void {
  if (!coin.dropping) return;
  const { ticksLeft, totalTicks, startRadius } = coin.dropping;
  const p = 1 - Math.max(0, ticksLeft) / totalTicks; // 0 → 1
  const radius = startRadius * (1 - p);
  if (radius < 0.5) return;

  const { x, y } = coin.pos;
  const base = pieceBaseColor(coin);
  // Darken toward black as the coin drops.
  const darkened = mixHex(base, '#000000', Math.min(1, p * 1.2));

  ctx.fillStyle = darkened;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function pieceBaseColor(coin: Coin): string {
  switch (coin.kind) {
    case CoinKind.Stone:
      return STONE_COLOR;
    case CoinKind.Bomb:
      return BOMB_OUTER;
    case CoinKind.Tree:
      return TREE_COLOR;
    case CoinKind.Hole:
      return '#000000';
    case CoinKind.Coin:
    default:
      return coin.owner === Owner.P1 ? config.p1Color : config.p2Color;
  }
}

function mixHex(a: string, b: string, t: number): string {
  const ma = /^#([0-9a-f]{6})$/i.exec(a);
  const mb = /^#([0-9a-f]{6})$/i.exec(b);
  if (!ma || !mb) return a;
  const na = parseInt(ma[1]!, 16);
  const nb = parseInt(mb[1]!, 16);
  const blend = (sa: number, sb: number) => Math.round(sa + (sb - sa) * t);
  const r = blend((na >> 16) & 0xff, (nb >> 16) & 0xff);
  const g = blend((na >> 8) & 0xff, (nb >> 8) & 0xff);
  const bl = blend(na & 0xff, nb & 0xff);
  return '#' + ((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0');
}

function drawCoin(ctx: CanvasRenderingContext2D, coin: Coin, active: boolean, hovered: boolean): void {
  const { x, y } = coin.pos;
  const r = coin.radius;
  const ownerColor = coin.owner === Owner.P1 ? config.p1Color : config.p2Color;
  const base = active || hovered ? lighten(ownerColor, 0.18) : ownerColor;

  shadow(ctx, x, y, r);

  // Body
  ctx.fillStyle = base;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Metallic specular highlight (top-left lit)
  const spec = ctx.createRadialGradient(x - r * 0.45, y - r * 0.55, r * 0.05, x, y, r);
  spec.addColorStop(0, 'rgba(255,255,255,0.7)');
  spec.addColorStop(0.35, 'rgba(255,255,255,0.18)');
  spec.addColorStop(0.7, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Rim shading (darker around the edge → sphere/disc feel)
  const rim = ctx.createRadialGradient(x, y, r * 0.7, x, y, r);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, 'rgba(0,0,0,0.35)');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Reeded (milled) edge ticks
  const ticks = 18;
  ctx.strokeStyle = 'rgba(0,0,0,0.45)';
  ctx.lineWidth = 0.7;
  for (let i = 0; i < ticks; i++) {
    const ang = (i / ticks) * Math.PI * 2;
    const cx = Math.cos(ang);
    const sy = Math.sin(ang);
    ctx.beginPath();
    ctx.moveTo(x + cx * (r - 1.8), y + sy * (r - 1.8));
    ctx.lineTo(x + cx * (r - 0.3), y + sy * (r - 0.3));
    ctx.stroke();
  }

  // Inner ring (raised rim border)
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.arc(x, y, r - 2.2, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.beginPath();
  ctx.arc(x, y, r - 2.8, 0, Math.PI * 2);
  ctx.stroke();

  // Embossed "1" / "2" stamp
  const label = coin.owner === Owner.P1 ? '1' : '2';
  ctx.font = `bold ${Math.round(r * 1.15)}px "Trebuchet MS", sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillText(label, x, y + 1);
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillText(label, x, y);

  // Outer dark outline
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(x, y, r - 0.3, 0, Math.PI * 2);
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

  // Base body
  ctx.fillStyle = STONE_COLOR;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Mottled texture, clipped to the stone circle. Seeded by coin.id so it's
  // stable across frames (and different per stone).
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  const rand = seededRandom(coin.id * 7919 + 13);

  // Soft tinted blobs — lighter & darker patches.
  for (let i = 0; i < 9; i++) {
    const px = x + (rand() - 0.5) * r * 1.8;
    const py = y + (rand() - 0.5) * r * 1.8;
    const pr = r * (0.22 + rand() * 0.45);
    const darkBlob = rand() < 0.5;
    ctx.fillStyle = darkBlob
      ? `rgba(35,38,42,${(0.14 + rand() * 0.14).toFixed(3)})`
      : `rgba(225,228,232,${(0.08 + rand() * 0.12).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Grit speckles.
  for (let i = 0; i < 14; i++) {
    const px = x + (rand() - 0.5) * r * 1.9;
    const py = y + (rand() - 0.5) * r * 1.9;
    ctx.fillStyle = `rgba(0,0,0,${(0.18 + rand() * 0.22).toFixed(3)})`;
    ctx.fillRect(px, py, 1, 1);
  }

  // A short hairline crack — adds character.
  const crackAng = rand() * Math.PI * 2;
  const crackR = r * (0.5 + rand() * 0.3);
  const cx0 = x + Math.cos(crackAng) * crackR * 0.2;
  const cy0 = y + Math.sin(crackAng) * crackR * 0.2;
  const cx1 = x + Math.cos(crackAng) * crackR;
  const cy1 = y + Math.sin(crackAng) * crackR;
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.moveTo(cx0, cy0);
  ctx.lineTo(cx1 + (rand() - 0.5) * 1.5, cy1 + (rand() - 0.5) * 1.5);
  ctx.stroke();

  ctx.restore();

  // 3D shading: bright top-left, dark bottom-right.
  const shade = ctx.createRadialGradient(x - r * 0.45, y - r * 0.5, r * 0.1, x, y, r);
  shade.addColorStop(0, 'rgba(255,255,255,0.35)');
  shade.addColorStop(0.55, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.4)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Crisp dark outline.
  ctx.strokeStyle = 'rgba(0,0,0,0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(x, y, r - 0.3, 0, Math.PI * 2);
  ctx.stroke();
}

function drawBomb(ctx: CanvasRenderingContext2D, coin: Coin): void {
  const { x, y } = coin.pos;
  const r = coin.radius;

  shadow(ctx, x, y, r);

  // Cannonball body — very dark base.
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Rim shading darkens the perimeter, giving sphere depth.
  const rim = ctx.createRadialGradient(x, y, r * 0.55, x, y, r);
  rim.addColorStop(0, 'rgba(0,0,0,0)');
  rim.addColorStop(1, 'rgba(0,0,0,0.85)');
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Glossy specular highlight (top-left).
  const spec = ctx.createRadialGradient(
    x - r * 0.4, y - r * 0.5, r * 0.05,
    x - r * 0.3, y - r * 0.4, r * 0.55,
  );
  spec.addColorStop(0, 'rgba(255,255,255,0.85)');
  spec.addColorStop(0.4, 'rgba(255,255,255,0.18)');
  spec.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = spec;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Fuse hole — small dark disc near the top.
  const holeX = x;
  const holeY = y - r + 2.5;
  ctx.fillStyle = '#0a0a0a';
  ctx.beginPath();
  ctx.arc(holeX, holeY, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Short fuse stub angling up & right — drawn just inside the circle.
  const tipX = x + r * 0.4;
  const tipY = y - r * 0.7;
  ctx.strokeStyle = '#b3923d';
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(holeX, holeY);
  ctx.quadraticCurveTo(holeX + 1, holeY - 2, tipX, tipY);
  ctx.stroke();

  // Spark glow at the fuse tip.
  const sparkGrad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, r * 0.55);
  sparkGrad.addColorStop(0, 'rgba(255,250,180,1)');
  sparkGrad.addColorStop(0.35, 'rgba(255,160,40,0.85)');
  sparkGrad.addColorStop(1, 'rgba(255,60,0,0)');
  ctx.fillStyle = sparkGrad;
  ctx.beginPath();
  ctx.arc(tipX, tipY, r * 0.55, 0, Math.PI * 2);
  ctx.fill();

  // Outline.
  ctx.strokeStyle = 'rgba(0,0,0,0.9)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.arc(x, y, r - 0.3, 0, Math.PI * 2);
  ctx.stroke();
}

function drawTree(ctx: CanvasRenderingContext2D, coin: Coin): void {
  const { x, y } = coin.pos;
  const r = coin.radius;

  shadow(ctx, x, y, r);

  // Canopy base — dark forest green.
  ctx.fillStyle = TREE_COLOR;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Foliage texture, clipped to canopy. Seeded by id so it's stable per tree.
  ctx.save();
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.clip();

  const rand = seededRandom(coin.id * 6151 + 29);

  // Lighter leaf clusters — sunlit top of canopy.
  for (let i = 0; i < 10; i++) {
    const px = x + (rand() - 0.5) * r * 1.6;
    const py = y + (rand() - 0.5) * r * 1.6;
    const pr = r * (0.25 + rand() * 0.35);
    ctx.fillStyle = `rgba(140,200,110,${(0.18 + rand() * 0.22).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Darker leaf pockets — shaded gaps between clusters.
  for (let i = 0; i < 8; i++) {
    const px = x + (rand() - 0.5) * r * 1.7;
    const py = y + (rand() - 0.5) * r * 1.7;
    const pr = r * (0.18 + rand() * 0.28);
    ctx.fillStyle = `rgba(15,55,25,${(0.22 + rand() * 0.18).toFixed(3)})`;
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Tiny highlight speckles.
  for (let i = 0; i < 18; i++) {
    const px = x + (rand() - 0.5) * r * 1.9;
    const py = y + (rand() - 0.5) * r * 1.9;
    ctx.fillStyle = `rgba(220,255,200,${(0.18 + rand() * 0.22).toFixed(3)})`;
    ctx.fillRect(px, py, 1, 1);
  }

  ctx.restore();

  // 3D shading: bright top-left, dark bottom-right.
  const shade = ctx.createRadialGradient(x - r * 0.45, y - r * 0.5, r * 0.1, x, y, r);
  shade.addColorStop(0, 'rgba(255,255,255,0.22)');
  shade.addColorStop(0.55, 'rgba(255,255,255,0)');
  shade.addColorStop(1, 'rgba(0,0,0,0.45)');
  ctx.fillStyle = shade;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Trunk hint — small brown dot at the center.
  ctx.fillStyle = '#5a3a1f';
  ctx.beginPath();
  ctx.arc(x, y, Math.max(1.5, r * 0.14), 0, Math.PI * 2);
  ctx.fill();

  // Dark outline.
  ctx.strokeStyle = 'rgba(0,0,0,0.75)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(x, y, r - 0.3, 0, Math.PI * 2);
  ctx.stroke();
}

function drawHole(ctx: CanvasRenderingContext2D, coin: Coin): void {
  const { x, y } = coin.pos;
  const r = coin.radius;

  // Outer rim shadow on the felt — soft ellipse below the hole.
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(x, y + 1.5, r * 1.02, r * 0.85, 0, 0, Math.PI * 2);
  ctx.fill();

  // Pit body: radial gradient from near-black center to a slightly lighter
  // rim, so the hole reads as a recessed dark pit rather than a black disc.
  const pit = ctx.createRadialGradient(x, y - r * 0.1, r * 0.1, x, y, r);
  pit.addColorStop(0, '#000000');
  pit.addColorStop(0.7, '#050708');
  pit.addColorStop(1, '#181c20');
  ctx.fillStyle = pit;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  // Subtle bottom-rim highlight — the far inside wall of the depression
  // catches the light, so the lit crescent sits on the lower half.
  ctx.strokeStyle = 'rgba(255,255,255,0.18)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, r - 0.6, Math.PI * 0.05, Math.PI * 0.95);
  ctx.stroke();

  // Hard outline so the hole reads against the felt.
  ctx.strokeStyle = 'rgba(0,0,0,0.85)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  ctx.arc(x, y, r - 0.3, 0, Math.PI * 2);
  ctx.stroke();
}

function seededRandom(seed: number): () => number {
  let s = (seed | 0) || 1;
  return () => {
    s = (s * 9301 + 49297) & 0x7fffffff;
    return s / 0x7fffffff;
  };
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
