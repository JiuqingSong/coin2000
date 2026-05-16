import type { World } from './world';
import { Owner, Phase } from './types';
import { TABLE } from './constants';

// TODO Phase 2: place coins in mirrored columns.
export function initialWorld(): World {
  return {
    table: { width: TABLE.width, height: TABLE.height },
    coins: [],
    phase: Phase.Idle,
    current: Owner.P1,
    aliveCount: { [Owner.P1]: 0, [Owner.P2]: 0 },
  };
}
