import { config } from './config';
import { getSelectedMap } from './maps';
import type { MapData } from './mapData';

export function materializeSelectedMap(): MapData {
  return getSelectedMap().materialize(config);
}
