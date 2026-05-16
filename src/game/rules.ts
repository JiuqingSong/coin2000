import type { World } from './world';
import type { Owner } from './types';

export type RoundResult = { winner: Owner | 'draw' };

// TODO Phase 2: implement roundEnded.
export function roundEnded(_world: World): false | RoundResult {
  return false;
}
