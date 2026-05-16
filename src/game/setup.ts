import type { World } from './world';
import { getSelectedMap } from './maps';

export function initialWorld(): World {
  return getSelectedMap().build();
}
