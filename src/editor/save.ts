import type { MapFile } from './types';

export const MAP_FILE_EXT = '.map.coin';

export function serializeMapFile(file: MapFile): string {
  return JSON.stringify(file, null, 2);
}

export function defaultMapFileName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `coin2026-map-${y}-${m}-${d}-${hh}${mm}${ss}${MAP_FILE_EXT}`;
}
