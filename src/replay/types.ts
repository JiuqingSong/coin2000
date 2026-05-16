import type { GameConfig } from '../game/config';
import type { MapData } from '../game/mapData';
import type { RoundResult } from '../game/rules';
import type { Owner, Vec2 } from '../game/types';
import type { P2Mode } from '../ui/chrome';

export const SAVE_FILE_APP = 'coin2000' as const;
export const SAVE_FILE_VERSION = 1 as const;

export interface ShotRecord {
  shooter: Owner.P1 | Owner.P2;
  coinId: number;
  vel: Vec2;
}

export interface SaveFile {
  app: typeof SAVE_FILE_APP;
  version: typeof SAVE_FILE_VERSION;
  createdAt: string;
  map: MapData;
  config: GameConfig;
  p2Mode: P2Mode;
  shots: ShotRecord[];
  result: RoundResult;
}
