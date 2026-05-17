import type { MapData } from '../game/mapData';

export const MAP_FILE_APP = 'coin2026' as const;
export const MAP_FILE_VERSION = 1 as const;
export const MAP_FILE_KIND = 'map' as const;

export interface MapFile {
  app: typeof MAP_FILE_APP;
  version: typeof MAP_FILE_VERSION;
  kind: typeof MAP_FILE_KIND;
  createdAt: string;
  map: MapData;
}
