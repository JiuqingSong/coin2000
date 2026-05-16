import type { World } from './world';
import { Owner } from './types';

export type RoundResult = { winner: Owner | 'draw' };

export function roundEnded(world: World): false | RoundResult {
  const p1Out = world.aliveCount[Owner.P1] === 0;
  const p2Out = world.aliveCount[Owner.P2] === 0;
  if (p1Out && p2Out) return { winner: 'draw' };
  if (p1Out) return { winner: Owner.P2 };
  if (p2Out) return { winner: Owner.P1 };
  return false;
}
