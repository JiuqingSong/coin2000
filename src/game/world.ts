import type { Coin } from './coin';
import type { Table } from './table';
import { Owner, Phase } from './types';

export interface World {
  table: Table;
  coins: Coin[];
  phase: Phase;
  current: Owner;
  aliveCount: { [Owner.P1]: number; [Owner.P2]: number };
}
