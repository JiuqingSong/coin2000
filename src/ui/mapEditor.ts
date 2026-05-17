import { config } from '../game/config';
import {
  BOMB_MASS,
  BOMB_RADIUS,
  HOLE_MASS,
  HOLE_RADIUS,
  STONE_MASS,
  STONE_RADIUS,
  TABLE,
  TREE_MASS,
  TREE_RADIUS,
} from '../game/constants';
import type { MapCoinData, MapData } from '../game/mapData';
import { worldFromMapData } from '../game/mapData';
import { CoinKind, Owner, type Vec2 } from '../game/types';
import type { Walls, WallBehavior } from '../game/world';
import { subscribeLocale, t, type StringKey } from '../i18n';
import { createCanvasView } from '../render/canvas';
import { drawPiece, drawTable } from '../render/sprites';

type ToolKind = 'select' | 'erase' | 'p1' | 'p2' | 'stone' | 'bomb' | 'tree' | 'hole';
type WallEdge = 'top' | 'bottom' | 'left' | 'right';

export interface MapEditorOptions {
  initialMap: MapData;
  onSaveMap(map: MapData): void;
  onTestMap(map: MapData): void;
  onClose(): void;
}

export interface MapEditorHandle {
  hide(): void;
}

export function mountMapEditor(parent: HTMLElement, opts: MapEditorOptions): MapEditorHandle {
  // Working copy — never mutate the caller's MapData.
  const mapData: MapData = cloneMap(opts.initialMap);
  let selectedTool: ToolKind = 'select';
  let selectedIndex: number | null = null;
  let hoverIndex: number | null = null;
  let cursor: Vec2 | null = null;
  let drag: { index: number; offsetX: number; offsetY: number } | null = null;
  let errorKey: StringKey | null = null;

  const overlay = document.createElement('div');
  overlay.id = 'editor-modal';

  const card = document.createElement('div');
  card.className = 'editor-card';

  const titleBar = document.createElement('div');
  titleBar.className = 'editor-titlebar';
  const titleEl = document.createElement('span');
  titleBar.append(titleEl);
  card.append(titleBar);

  const layout = document.createElement('div');
  layout.className = 'editor-layout';

  const canvasWrap = document.createElement('div');
  canvasWrap.className = 'editor-canvas-wrap';
  const canvas = document.createElement('canvas');
  canvas.className = 'editor-canvas';
  canvas.tabIndex = 0;
  canvasWrap.append(canvas);

  const sidebar = document.createElement('div');
  sidebar.className = 'editor-sidebar';

  layout.append(canvasWrap, sidebar);
  card.append(layout);

  // Closure-shared list of label refreshers, populated by section() /
  // makeWallSelect() / appendWallRow(). Declared up-front because those
  // helpers run during construction below.
  const wallRowRefreshers: Array<() => void> = [];

  // ---- Walls section ----
  const wallsSec = section('editor.section.walls');
  const wallSelectors: Record<WallEdge, HTMLSelectElement> = {
    top: makeWallSelect('top'),
    bottom: makeWallSelect('bottom'),
    left: makeWallSelect('left'),
    right: makeWallSelect('right'),
  };
  appendWallRow(wallsSec, 'editor.wall.top', wallSelectors.top);
  appendWallRow(wallsSec, 'editor.wall.bottom', wallSelectors.bottom);
  appendWallRow(wallsSec, 'editor.wall.left', wallSelectors.left);
  appendWallRow(wallsSec, 'editor.wall.right', wallSelectors.right);
  sidebar.append(wallsSec.fieldset);

  // ---- Tools section ----
  const toolsSec = section('editor.section.tools');
  const toolButtons: Array<{ tool: ToolKind; btn: HTMLButtonElement; labelKey: StringKey }> = [];
  const toolList: Array<{ tool: ToolKind; labelKey: StringKey }> = [
    { tool: 'select', labelKey: 'editor.tool.select' },
    { tool: 'p1', labelKey: 'editor.tool.p1' },
    { tool: 'p2', labelKey: 'editor.tool.p2' },
    { tool: 'stone', labelKey: 'editor.tool.stone' },
    { tool: 'bomb', labelKey: 'editor.tool.bomb' },
    { tool: 'tree', labelKey: 'editor.tool.tree' },
    { tool: 'hole', labelKey: 'editor.tool.hole' },
    { tool: 'erase', labelKey: 'editor.tool.erase' },
  ];
  for (const { tool, labelKey } of toolList) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'editor-tool-btn';
    btn.dataset.tool = tool;
    btn.addEventListener('click', () => {
      selectedTool = tool;
      if (tool !== 'select') selectedIndex = null;
      refreshToolButtons();
      refreshHint();
    });
    toolsSec.fieldset.append(btn);
    toolButtons.push({ tool, btn, labelKey });
  }
  sidebar.append(toolsSec.fieldset);

  // ---- Hint + error ----
  const hintEl = document.createElement('div');
  hintEl.className = 'editor-hint';
  sidebar.append(hintEl);

  const errorEl = document.createElement('div');
  errorEl.className = 'editor-error';
  sidebar.append(errorEl);

  // ---- Actions ----
  const actions = document.createElement('div');
  actions.className = 'editor-actions';
  const btnClear = document.createElement('button');
  btnClear.type = 'button';
  const btnSave = document.createElement('button');
  btnSave.type = 'button';
  btnSave.className = 'primary';
  const btnTest = document.createElement('button');
  btnTest.type = 'button';
  const btnClose = document.createElement('button');
  btnClose.type = 'button';
  actions.append(btnClear, btnSave, btnTest, btnClose);
  sidebar.append(actions);

  parent.append(overlay);
  overlay.append(card);

  const view = createCanvasView(canvas);

  // ---------------------------------------------------------------------------
  // Locale + label sync
  // ---------------------------------------------------------------------------

  const applyLocale = () => {
    titleEl.textContent = t('editor.title');
    for (const { btn, labelKey } of toolButtons) btn.textContent = t(labelKey);
    for (const fn of wallRowRefreshers) fn();
    btnClear.textContent = t('editor.btn.clear');
    btnSave.textContent = t('editor.btn.save');
    btnTest.textContent = t('editor.btn.test');
    btnClose.textContent = t('editor.btn.close');
    refreshHint();
    refreshError();
  };
  applyLocale();
  const unsubscribeLocale = subscribeLocale(applyLocale);

  refreshToolButtons();
  refreshWallSelectors();

  // ---------------------------------------------------------------------------
  // Pointer interaction
  // ---------------------------------------------------------------------------

  canvas.addEventListener('pointerdown', (e) => {
    if (e.button !== 0 && e.button !== 2) return;
    canvas.focus();
    e.preventDefault();
    const pos = toTable(e);
    const hit = hitTest(pos);

    // Right-click anywhere on a piece deletes it.
    if (e.button === 2) {
      if (hit !== null) deletePiece(hit);
      return;
    }

    if (selectedTool === 'select') {
      if (hit !== null) {
        selectedIndex = hit;
        const c = mapData.coins[hit]!;
        canvas.setPointerCapture(e.pointerId);
        drag = {
          index: hit,
          offsetX: c.x - pos.x,
          offsetY: c.y - pos.y,
        };
      } else {
        selectedIndex = null;
      }
      return;
    }

    if (selectedTool === 'erase') {
      if (hit !== null) deletePiece(hit);
      return;
    }

    // A piece tool — place if cursor is on empty space.
    if (hit !== null) return;
    placePiece(selectedTool, pos);
  });

  canvas.addEventListener('pointermove', (e) => {
    const pos = toTable(e);
    cursor = pos;
    if (drag !== null && e.pointerId !== undefined) {
      const c = mapData.coins[drag.index];
      if (c) {
        const nx = clamp(pos.x + drag.offsetX, c.radius, mapData.table.width - c.radius);
        const ny = clamp(pos.y + drag.offsetY, c.radius, mapData.table.height - c.radius);
        c.x = nx;
        c.y = ny;
        clearError();
      }
      return;
    }
    hoverIndex = hitTest(pos);
  });

  canvas.addEventListener('pointerup', (e) => {
    if (drag !== null) {
      if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId);
      drag = null;
    }
  });

  canvas.addEventListener('pointerleave', () => {
    cursor = null;
    hoverIndex = null;
  });

  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault();
  });

  canvas.addEventListener('keydown', (e) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedIndex !== null) {
      e.preventDefault();
      deletePiece(selectedIndex);
    }
  });

  // ---------------------------------------------------------------------------
  // Action buttons
  // ---------------------------------------------------------------------------

  btnClear.addEventListener('click', () => {
    mapData.coins.length = 0;
    selectedIndex = null;
    clearError();
  });

  btnSave.addEventListener('click', () => {
    const reason = validate();
    if (reason) {
      setError(reason);
      return;
    }
    clearError();
    opts.onSaveMap(cloneMap(mapData));
  });

  btnTest.addEventListener('click', () => {
    const reason = validate();
    if (reason) {
      setError(reason);
      return;
    }
    clearError();
    opts.onTestMap(cloneMap(mapData));
  });

  btnClose.addEventListener('click', () => {
    opts.onClose();
  });

  // ---------------------------------------------------------------------------
  // Render loop
  // ---------------------------------------------------------------------------

  let running = true;
  const tick = () => {
    if (!running) return;
    render();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);

  return {
    hide() {
      running = false;
      unsubscribeLocale();
      overlay.remove();
    },
  };

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function section(legendKey: StringKey): { fieldset: HTMLFieldSetElement; legend: HTMLLegendElement } {
    const fs = document.createElement('fieldset');
    fs.className = 'editor-section';
    const legend = document.createElement('legend');
    legend.textContent = t(legendKey);
    fs.append(legend);
    wallRowRefreshers.push(() => { legend.textContent = t(legendKey); });
    return { fieldset: fs, legend };
  }

  function makeWallSelect(edge: WallEdge): HTMLSelectElement {
    const sel = document.createElement('select');
    const optKill = document.createElement('option');
    optKill.value = 'kill';
    const optBounce = document.createElement('option');
    optBounce.value = 'bounce';
    sel.append(optKill, optBounce);
    sel.addEventListener('change', () => {
      mapData.walls[edge] = sel.value as WallBehavior;
    });
    wallRowRefreshers.push(() => {
      optKill.textContent = t('editor.wall.kill');
      optBounce.textContent = t('editor.wall.bounce');
    });
    return sel;
  }

  function appendWallRow(
    parent: { fieldset: HTMLFieldSetElement },
    labelKey: StringKey,
    sel: HTMLSelectElement,
  ): void {
    const row = document.createElement('label');
    row.className = 'editor-wall-row';
    const text = document.createTextNode(t(labelKey));
    wallRowRefreshers.push(() => { text.textContent = t(labelKey); });
    row.append(text, sel);
    parent.fieldset.append(row);
  }

  function refreshWallSelectors(): void {
    wallSelectors.top.value = mapData.walls.top;
    wallSelectors.bottom.value = mapData.walls.bottom;
    wallSelectors.left.value = mapData.walls.left;
    wallSelectors.right.value = mapData.walls.right;
  }

  function refreshToolButtons(): void {
    for (const { tool, btn } of toolButtons) {
      btn.classList.toggle('selected', tool === selectedTool);
    }
  }

  function refreshHint(): void {
    const hintKey: StringKey =
      selectedTool === 'select'
        ? 'editor.hint.select'
        : selectedTool === 'erase'
          ? 'editor.hint.erase'
          : 'editor.hint.place';
    hintEl.textContent = t(hintKey);
  }

  function refreshError(): void {
    errorEl.textContent = errorKey ? t(errorKey) : '';
  }

  function setError(key: StringKey): void {
    errorKey = key;
    refreshError();
  }

  function clearError(): void {
    if (errorKey === null) return;
    errorKey = null;
    refreshError();
  }

  function toTable(e: PointerEvent): Vec2 {
    const rect = canvas.getBoundingClientRect();
    return view.screenToTable(
      { x: e.clientX - rect.left, y: e.clientY - rect.top },
      mapData.table,
    );
  }

  function hitTest(p: Vec2): number | null {
    // Topmost (last) piece wins.
    for (let i = mapData.coins.length - 1; i >= 0; i--) {
      const c = mapData.coins[i]!;
      const dx = c.x - p.x;
      const dy = c.y - p.y;
      if (dx * dx + dy * dy <= c.radius * c.radius) return i;
    }
    return null;
  }

  function deletePiece(index: number): void {
    mapData.coins.splice(index, 1);
    if (selectedIndex === index) selectedIndex = null;
    else if (selectedIndex !== null && selectedIndex > index) selectedIndex--;
    clearError();
  }

  function placePiece(tool: Exclude<ToolKind, 'select' | 'erase'>, pos: Vec2): void {
    const piece = makePieceForTool(tool, pos);
    // Clamp into bounds so half the piece can't be off the table.
    piece.x = clamp(piece.x, piece.radius, mapData.table.width - piece.radius);
    piece.y = clamp(piece.y, piece.radius, mapData.table.height - piece.radius);
    mapData.coins.push(piece);
    selectedIndex = mapData.coins.length - 1;
    clearError();
  }

  function validate(): StringKey | null {
    let p1 = 0;
    let p2 = 0;
    for (const c of mapData.coins) {
      if (c.kind === CoinKind.Coin) {
        if (c.owner === Owner.P1) p1++;
        else if (c.owner === Owner.P2) p2++;
      }
    }
    if (p1 === 0) return 'editor.error.noP1';
    if (p2 === 0) return 'editor.error.noP2';
    for (let i = 0; i < mapData.coins.length; i++) {
      for (let j = i + 1; j < mapData.coins.length; j++) {
        const a = mapData.coins[i]!;
        const b = mapData.coins[j]!;
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const r = a.radius + b.radius;
        if (dx * dx + dy * dy < r * r) return 'editor.error.overlap';
      }
    }
    return null;
  }

  function render(): void {
    const ctx = view.ctx;
    view.resetTransform();
    ctx.fillStyle = '#0e1115';
    ctx.fillRect(0, 0, view.cssWidth, view.cssHeight);

    view.applyTableTransform(mapData.table);
    drawTable(ctx, mapData.table, mapData.walls);

    // Snapshot to Coin shapes so drawPiece works. Holes are drawn in a first
    // pass so other pieces (and the selection ring) appear on top of them.
    const world = worldFromMapData(mapData);
    for (const c of world.coins) {
      if (c.kind === CoinKind.Hole) drawPiece(ctx, c, false, false);
    }
    for (let i = 0; i < world.coins.length; i++) {
      const c = world.coins[i]!;
      const isSelected = i === selectedIndex;
      const isHovered = i === hoverIndex;
      if (c.kind !== CoinKind.Hole) drawPiece(ctx, c, isSelected, isHovered);
      if (isSelected) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 230, 120, 0.9)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(c.pos.x, c.pos.y, c.radius + 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    // Ghost preview of the active tool.
    if (cursor && isPieceTool(selectedTool)) {
      const ghost = makePieceForTool(selectedTool, cursor);
      ctx.save();
      ctx.globalAlpha = 0.4;
      const ghostCoin = {
        id: -1,
        kind: ghost.kind,
        owner: ghost.owner,
        pos: { x: ghost.x, y: ghost.y },
        vel: { x: 0, y: 0 },
        radius: ghost.radius,
        mass: ghost.mass,
        alive: true,
      };
      drawPiece(ctx, ghostCoin, false, false);
      ctx.restore();
    }
  }
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

function clamp(v: number, min: number, max: number): number {
  if (max < min) return min;
  return Math.max(min, Math.min(max, v));
}

function cloneMap(m: MapData): MapData {
  return {
    table: { width: m.table.width, height: m.table.height },
    walls: { ...m.walls },
    coins: m.coins.map((c) => ({ ...c })),
  };
}

function isPieceTool(tool: ToolKind): tool is 'p1' | 'p2' | 'stone' | 'bomb' | 'tree' | 'hole' {
  return tool !== 'select' && tool !== 'erase';
}

function makePieceForTool(
  tool: 'p1' | 'p2' | 'stone' | 'bomb' | 'tree' | 'hole',
  pos: Vec2,
): MapCoinData {
  switch (tool) {
    case 'p1':
      return {
        kind: CoinKind.Coin,
        owner: Owner.P1,
        x: pos.x,
        y: pos.y,
        radius: config.coinRadius,
        mass: config.coinMass,
      };
    case 'p2':
      return {
        kind: CoinKind.Coin,
        owner: Owner.P2,
        x: pos.x,
        y: pos.y,
        radius: config.coinRadius,
        mass: config.coinMass,
      };
    case 'stone':
      return {
        kind: CoinKind.Stone,
        owner: Owner.Neutral,
        x: pos.x,
        y: pos.y,
        radius: STONE_RADIUS,
        mass: STONE_MASS,
      };
    case 'bomb':
      return {
        kind: CoinKind.Bomb,
        owner: Owner.Neutral,
        x: pos.x,
        y: pos.y,
        radius: BOMB_RADIUS,
        mass: BOMB_MASS,
      };
    case 'tree':
      return {
        kind: CoinKind.Tree,
        owner: Owner.Neutral,
        x: pos.x,
        y: pos.y,
        radius: TREE_RADIUS,
        mass: TREE_MASS,
      };
    case 'hole':
      return {
        kind: CoinKind.Hole,
        owner: Owner.Neutral,
        x: pos.x,
        y: pos.y,
        radius: HOLE_RADIUS,
        mass: HOLE_MASS,
      };
  }
}

export function blankMap(walls?: Walls): MapData {
  return {
    table: { width: TABLE.width, height: TABLE.height },
    walls: walls
      ? { ...walls }
      : { top: 'kill', bottom: 'kill', left: 'bounce', right: 'bounce' },
    coins: [],
  };
}
