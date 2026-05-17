import type { Table } from '../game/table';
import type { Vec2 } from '../game/types';

const TABLE_PADDING = 20;

export interface CanvasView {
  ctx: CanvasRenderingContext2D;
  cssWidth: number;
  cssHeight: number;
  applyTableTransform(table: Table): void;
  resetTransform(): void;
  screenToTable(screen: Vec2, table: Table): Vec2;
}

export function createCanvasView(canvas: HTMLCanvasElement): CanvasView {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D context unavailable');

  let dpr = window.devicePixelRatio || 1;
  let cssWidth = 0;
  let cssHeight = 0;

  const resize = () => {
    dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    cssWidth = rect.width;
    cssHeight = rect.height;
    canvas.width = Math.max(1, Math.round(rect.width * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
  };

  resize();
  window.addEventListener('resize', resize);
  // Re-resize when the canvas's own CSS box changes — needed for canvases
  // that appear inside a dynamic flex layout, where the initial
  // getBoundingClientRect() runs before layout has finalized dimensions.
  if (typeof ResizeObserver !== 'undefined') {
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);
  }

  const computeTransform = (table: Table) => {
    const availW = Math.max(1, cssWidth - TABLE_PADDING * 2);
    const availH = Math.max(1, cssHeight - TABLE_PADDING * 2);
    const scale = Math.min(availW / table.width, availH / table.height);
    const drawW = table.width * scale;
    const drawH = table.height * scale;
    const offsetX = (cssWidth - drawW) / 2;
    const offsetY = (cssHeight - drawH) / 2;
    return { scale, offsetX, offsetY };
  };

  return {
    get ctx() { return ctx; },
    get cssWidth() { return cssWidth; },
    get cssHeight() { return cssHeight; },
    applyTableTransform(table: Table) {
      const { scale, offsetX, offsetY } = computeTransform(table);
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
    },
    resetTransform() {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    },
    screenToTable(screen: Vec2, table: Table): Vec2 {
      const { scale, offsetX, offsetY } = computeTransform(table);
      return {
        x: (screen.x - offsetX) / scale,
        y: (screen.y - offsetY) / scale,
      };
    },
  };
}
