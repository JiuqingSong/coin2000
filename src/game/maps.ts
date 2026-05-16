import type { Coin } from './coin';
import type { StringKey } from '../i18n';
import type { Walls, World } from './world';
import { CoinKind, Owner, Phase } from './types';
import {
  BOMB_MASS,
  BOMB_RADIUS,
  STONE_MASS,
  STONE_RADIUS,
  TABLE,
} from './constants';
import { config } from './config';

const EDGE_INSET = 50;
const FORTIFIED_STONE_OFFSET = 38; // distance from each player's coin column toward center

export type MapId = 'classic' | 'allSides' | 'fortified' | 'crossed';

export interface MapDefinition {
  id: MapId;
  nameKey: StringKey;
  descKey: StringKey;
  build(): World;
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

export const MAPS: readonly MapDefinition[] = [
  {
    id: 'classic',
    nameKey: 'map.classic.name',
    descKey: 'map.classic.desc',
    build: () => buildLeftRightColumns(KILL_TB_BOUNCE_LR, 'center'),
  },
  {
    id: 'allSides',
    nameKey: 'map.allSides.name',
    descKey: 'map.allSides.desc',
    build: () => buildLeftRightColumns(KILL_ALL, 'center'),
  },
  {
    id: 'fortified',
    nameKey: 'map.fortified.name',
    descKey: 'map.fortified.desc',
    build: () => buildLeftRightColumns(KILL_TB_BOUNCE_LR, 'fortified'),
  },
  {
    id: 'crossed',
    nameKey: 'map.crossed.name',
    descKey: 'map.crossed.desc',
    build: () => buildTopBottomRows(KILL_LR_BOUNCE_TB),
  },
];

export function getMapById(id: string): MapDefinition {
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

export function getSelectedMap(): MapDefinition {
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
// Builders
// ---------------------------------------------------------------------------

type NeutralLayout = 'center' | 'fortified';

function buildLeftRightColumns(walls: Walls, neutral: NeutralLayout): World {
  const coinsPerSide = config.coinsPerSide;
  const radius = config.coinRadius;
  const mass = config.coinMass;
  const stoneCount = config.stoneCount;
  const bombCount = config.bombCount;

  const coins: Coin[] = [];
  let id = 0;

  const coinSpacing = TABLE.height / (coinsPerSide + 1);
  const leftX = EDGE_INSET;
  const rightX = TABLE.width - EDGE_INSET;

  for (let i = 0; i < coinsPerSide; i++) {
    coins.push(makeCoin(id++, Owner.P1, leftX, coinSpacing * (i + 1), radius, mass));
  }
  for (let i = 0; i < coinsPerSide; i++) {
    coins.push(makeCoin(id++, Owner.P2, rightX, coinSpacing * (i + 1), radius, mass));
  }

  let neutralCount = 0;
  if (neutral === 'center') {
    neutralCount = placeNeutralColumn(coins, () => id++, TABLE.width / 2, stoneCount, bombCount);
  } else {
    // Fortified: stones flank each side, bombs (if any) still go to center.
    neutralCount = placeFortifiedStones(coins, () => id++, leftX, rightX, stoneCount);
    neutralCount += placeNeutralColumn(coins, () => id++, TABLE.width / 2, 0, bombCount);
  }

  return {
    table: { width: TABLE.width, height: TABLE.height },
    walls,
    coins,
    phase: Phase.Idle,
    current: Owner.P1,
    aliveCount: {
      [Owner.P1]: coinsPerSide,
      [Owner.P2]: coinsPerSide,
      [Owner.Neutral]: neutralCount,
    },
  };
}

function buildTopBottomRows(walls: Walls): World {
  const coinsPerSide = config.coinsPerSide;
  const radius = config.coinRadius;
  const mass = config.coinMass;
  const stoneCount = config.stoneCount;
  const bombCount = config.bombCount;

  const coins: Coin[] = [];
  let id = 0;

  const coinSpacing = TABLE.width / (coinsPerSide + 1);
  const topY = EDGE_INSET;
  const bottomY = TABLE.height - EDGE_INSET;

  // P1 along the bottom, P2 along the top — same hand-orientation as classic.
  for (let i = 0; i < coinsPerSide; i++) {
    coins.push(makeCoin(id++, Owner.P1, coinSpacing * (i + 1), bottomY, radius, mass));
  }
  for (let i = 0; i < coinsPerSide; i++) {
    coins.push(makeCoin(id++, Owner.P2, coinSpacing * (i + 1), topY, radius, mass));
  }

  const neutralCount = placeNeutralRow(
    coins,
    () => id++,
    TABLE.height / 2,
    stoneCount,
    bombCount,
  );

  return {
    table: { width: TABLE.width, height: TABLE.height },
    walls,
    coins,
    phase: Phase.Idle,
    current: Owner.P1,
    aliveCount: {
      [Owner.P1]: coinsPerSide,
      [Owner.P2]: coinsPerSide,
      [Owner.Neutral]: neutralCount,
    },
  };
}

// Stones + bombs alternating in a vertical column at x.
function placeNeutralColumn(
  coins: Coin[],
  nextId: () => number,
  x: number,
  stoneCount: number,
  bombCount: number,
): number {
  const total = stoneCount + bombCount;
  if (total === 0) return 0;
  const spacing = TABLE.height / (total + 1);
  let stonesLeft = stoneCount;
  let bombsLeft = bombCount;
  let placeStone = true;
  for (let i = 0; i < total; i++) {
    const y = spacing * (i + 1);
    const useStone = (placeStone && stonesLeft > 0) || bombsLeft === 0;
    if (useStone) {
      coins.push(makeStone(nextId(), x, y));
      stonesLeft--;
    } else {
      coins.push(makeBomb(nextId(), x, y));
      bombsLeft--;
    }
    placeStone = !placeStone;
  }
  return total;
}

// Stones + bombs alternating in a horizontal row at y.
function placeNeutralRow(
  coins: Coin[],
  nextId: () => number,
  y: number,
  stoneCount: number,
  bombCount: number,
): number {
  const total = stoneCount + bombCount;
  if (total === 0) return 0;
  const spacing = TABLE.width / (total + 1);
  let stonesLeft = stoneCount;
  let bombsLeft = bombCount;
  let placeStone = true;
  for (let i = 0; i < total; i++) {
    const x = spacing * (i + 1);
    const useStone = (placeStone && stonesLeft > 0) || bombsLeft === 0;
    if (useStone) {
      coins.push(makeStone(nextId(), x, y));
      stonesLeft--;
    } else {
      coins.push(makeBomb(nextId(), x, y));
      bombsLeft--;
    }
    placeStone = !placeStone;
  }
  return total;
}

// Split stones evenly between two defensive columns next to each player's coins.
// Odd count: extra stone goes to P1's side.
function placeFortifiedStones(
  coins: Coin[],
  nextId: () => number,
  leftX: number,
  rightX: number,
  stoneCount: number,
): number {
  if (stoneCount === 0) return 0;
  const p1Count = Math.ceil(stoneCount / 2);
  const p2Count = stoneCount - p1Count;
  const p1X = leftX + FORTIFIED_STONE_OFFSET;
  const p2X = rightX - FORTIFIED_STONE_OFFSET;
  placeStoneColumn(coins, nextId, p1X, p1Count);
  placeStoneColumn(coins, nextId, p2X, p2Count);
  return stoneCount;
}

function placeStoneColumn(
  coins: Coin[],
  nextId: () => number,
  x: number,
  count: number,
): void {
  if (count === 0) return;
  const spacing = TABLE.height / (count + 1);
  for (let i = 0; i < count; i++) {
    coins.push(makeStone(nextId(), x, spacing * (i + 1)));
  }
}

function makeCoin(
  id: number,
  owner: Owner.P1 | Owner.P2,
  x: number,
  y: number,
  radius: number,
  mass: number,
): Coin {
  return {
    id,
    kind: CoinKind.Coin,
    owner,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    radius,
    mass,
    alive: true,
  };
}

function makeStone(id: number, x: number, y: number): Coin {
  return {
    id,
    kind: CoinKind.Stone,
    owner: Owner.Neutral,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    radius: STONE_RADIUS,
    mass: STONE_MASS,
    alive: true,
  };
}

function makeBomb(id: number, x: number, y: number): Coin {
  return {
    id,
    kind: CoinKind.Bomb,
    owner: Owner.Neutral,
    pos: { x, y },
    vel: { x: 0, y: 0 },
    radius: BOMB_RADIUS,
    mass: BOMB_MASS,
    alive: true,
  };
}
