import type { GameConfig } from './config';
import type { MapCoinData, MapData } from './mapData';
import type { StringKey } from '../i18n';
import type { Walls } from './world';
import { CoinKind, Owner } from './types';
import {
  BOMB_MASS,
  BOMB_RADIUS,
  STONE_MASS,
  STONE_RADIUS,
  TABLE,
} from './constants';

const EDGE_INSET = 50;
const FORTIFIED_STONE_OFFSET = 38; // distance from each player's coin column toward center

export type MapId = 'classic' | 'allSides' | 'fortified' | 'crossed';

export interface MapTemplate {
  id: MapId;
  nameKey: StringKey;
  descKey: StringKey;
  materialize(config: GameConfig): MapData;
}

const KILL_TB_BOUNCE_LR: Walls = {
  top: 'kill',
  bottom: 'kill',
  left: 'bounce',
  right: 'bounce',
};

const KILL_ALL: Walls = {
  top: 'kill',
  bottom: 'kill',
  left: 'kill',
  right: 'kill',
};

const KILL_LR_BOUNCE_TB: Walls = {
  top: 'bounce',
  bottom: 'bounce',
  left: 'kill',
  right: 'kill',
};

export const MAPS: readonly MapTemplate[] = [
  {
    id: 'classic',
    nameKey: 'map.classic.name',
    descKey: 'map.classic.desc',
    materialize: (cfg) => buildLeftRightColumns(cfg, KILL_TB_BOUNCE_LR, 'center'),
  },
  {
    id: 'allSides',
    nameKey: 'map.allSides.name',
    descKey: 'map.allSides.desc',
    materialize: (cfg) => buildLeftRightColumns(cfg, KILL_ALL, 'center'),
  },
  {
    id: 'fortified',
    nameKey: 'map.fortified.name',
    descKey: 'map.fortified.desc',
    materialize: (cfg) => buildLeftRightColumns(cfg, KILL_TB_BOUNCE_LR, 'fortified'),
  },
  {
    id: 'crossed',
    nameKey: 'map.crossed.name',
    descKey: 'map.crossed.desc',
    materialize: (cfg) => buildTopBottomRows(cfg, KILL_LR_BOUNCE_TB),
  },
];

export function getMapById(id: string): MapTemplate {
  return MAPS.find((m) => m.id === id) ?? MAPS[0]!;
}

// ---------------------------------------------------------------------------
// Selection (persisted to localStorage)
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'coin2000.map.v1';

type Listener = (id: MapId) => void;
const listeners = new Set<Listener>();

let selectedId: MapId = loadSelection();

function loadSelection(): MapId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw && MAPS.some((m) => m.id === raw)) return raw as MapId;
  } catch {
    // ignore
  }
  return 'classic';
}

export function getSelectedMapId(): MapId {
  return selectedId;
}

export function getSelectedMap(): MapTemplate {
  return getMapById(selectedId);
}

export function setSelectedMapId(id: MapId): void {
  if (id === selectedId) return;
  selectedId = id;
  try {
    localStorage.setItem(STORAGE_KEY, id);
  } catch {
    // ignore
  }
  listeners.forEach((fn) => fn(id));
}

export function subscribeMap(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

// ---------------------------------------------------------------------------
// Template builders → MapData
// ---------------------------------------------------------------------------

type NeutralLayout = 'center' | 'fortified';

function buildLeftRightColumns(
  cfg: GameConfig,
  walls: Walls,
  neutral: NeutralLayout,
): MapData {
  const coinsPerSide = cfg.coinsPerSide;
  const radius = cfg.coinRadius;
  const mass = cfg.coinMass;
  const stoneCount = cfg.stoneCount;
  const bombCount = cfg.bombCount;

  const coins: MapCoinData[] = [];

  const coinSpacing = TABLE.height / (coinsPerSide + 1);
  const leftX = EDGE_INSET;
  const rightX = TABLE.width - EDGE_INSET;

  for (let i = 0; i < coinsPerSide; i++) {
    coins.push(makeCoin(Owner.P1, leftX, coinSpacing * (i + 1), radius, mass));
  }
  for (let i = 0; i < coinsPerSide; i++) {
    coins.push(makeCoin(Owner.P2, rightX, coinSpacing * (i + 1), radius, mass));
  }

  if (neutral === 'center') {
    placeNeutralColumn(coins, TABLE.width / 2, stoneCount, bombCount);
  } else {
    // Fortified: stones flank each side, bombs (if any) still go to center.
    placeFortifiedStones(coins, leftX, rightX, stoneCount);
    placeNeutralColumn(coins, TABLE.width / 2, 0, bombCount);
  }

  return {
    table: { width: TABLE.width, height: TABLE.height },
    walls,
    coins,
  };
}

function buildTopBottomRows(cfg: GameConfig, walls: Walls): MapData {
  const coinsPerSide = cfg.coinsPerSide;
  const radius = cfg.coinRadius;
  const mass = cfg.coinMass;
  const stoneCount = cfg.stoneCount;
  const bombCount = cfg.bombCount;

  const coins: MapCoinData[] = [];

  const coinSpacing = TABLE.width / (coinsPerSide + 1);
  const topY = EDGE_INSET;
  const bottomY = TABLE.height - EDGE_INSET;

  // P1 along the bottom, P2 along the top — same hand-orientation as classic.
  for (let i = 0; i < coinsPerSide; i++) {
    coins.push(makeCoin(Owner.P1, coinSpacing * (i + 1), bottomY, radius, mass));
  }
  for (let i = 0; i < coinsPerSide; i++) {
    coins.push(makeCoin(Owner.P2, coinSpacing * (i + 1), topY, radius, mass));
  }

  placeNeutralRow(coins, TABLE.height / 2, stoneCount, bombCount);

  return {
    table: { width: TABLE.width, height: TABLE.height },
    walls,
    coins,
  };
}

// Stones + bombs alternating in a vertical column at x.
function placeNeutralColumn(
  coins: MapCoinData[],
  x: number,
  stoneCount: number,
  bombCount: number,
): void {
  const total = stoneCount + bombCount;
  if (total === 0) return;
  const spacing = TABLE.height / (total + 1);
  let stonesLeft = stoneCount;
  let bombsLeft = bombCount;
  let placeStone = true;
  for (let i = 0; i < total; i++) {
    const y = spacing * (i + 1);
    const useStone = (placeStone && stonesLeft > 0) || bombsLeft === 0;
    if (useStone) {
      coins.push(makeStone(x, y));
      stonesLeft--;
    } else {
      coins.push(makeBomb(x, y));
      bombsLeft--;
    }
    placeStone = !placeStone;
  }
}

// Stones + bombs alternating in a horizontal row at y.
function placeNeutralRow(
  coins: MapCoinData[],
  y: number,
  stoneCount: number,
  bombCount: number,
): void {
  const total = stoneCount + bombCount;
  if (total === 0) return;
  const spacing = TABLE.width / (total + 1);
  let stonesLeft = stoneCount;
  let bombsLeft = bombCount;
  let placeStone = true;
  for (let i = 0; i < total; i++) {
    const x = spacing * (i + 1);
    const useStone = (placeStone && stonesLeft > 0) || bombsLeft === 0;
    if (useStone) {
      coins.push(makeStone(x, y));
      stonesLeft--;
    } else {
      coins.push(makeBomb(x, y));
      bombsLeft--;
    }
    placeStone = !placeStone;
  }
}

// Split stones evenly between two defensive columns next to each player's coins.
// Odd count: extra stone goes to P1's side.
function placeFortifiedStones(
  coins: MapCoinData[],
  leftX: number,
  rightX: number,
  stoneCount: number,
): void {
  if (stoneCount === 0) return;
  const p1Count = Math.ceil(stoneCount / 2);
  const p2Count = stoneCount - p1Count;
  const p1X = leftX + FORTIFIED_STONE_OFFSET;
  const p2X = rightX - FORTIFIED_STONE_OFFSET;
  placeStoneColumn(coins, p1X, p1Count);
  placeStoneColumn(coins, p2X, p2Count);
}

function placeStoneColumn(coins: MapCoinData[], x: number, count: number): void {
  if (count === 0) return;
  const spacing = TABLE.height / (count + 1);
  for (let i = 0; i < count; i++) {
    coins.push(makeStone(x, spacing * (i + 1)));
  }
}

function makeCoin(
  owner: Owner.P1 | Owner.P2,
  x: number,
  y: number,
  radius: number,
  mass: number,
): MapCoinData {
  return { kind: CoinKind.Coin, owner, x, y, radius, mass };
}

function makeStone(x: number, y: number): MapCoinData {
  return {
    kind: CoinKind.Stone,
    owner: Owner.Neutral,
    x,
    y,
    radius: STONE_RADIUS,
    mass: STONE_MASS,
  };
}

function makeBomb(x: number, y: number): MapCoinData {
  return {
    kind: CoinKind.Bomb,
    owner: Owner.Neutral,
    x,
    y,
    radius: BOMB_RADIUS,
    mass: BOMB_MASS,
  };
}
