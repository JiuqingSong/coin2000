import { SAVE_FILE_APP, SAVE_FILE_VERSION, type SaveFile } from './types';

export type SaveFileErrorReason =
  | 'badJson'
  | 'badShape'
  | 'wrongApp'
  | 'wrongVersion'
  | 'badMap'
  | 'badConfig'
  | 'badShots'
  | 'badResult';

export class SaveFileParseError extends Error {
  constructor(readonly reason: SaveFileErrorReason) {
    super(reason);
    this.name = 'SaveFileParseError';
  }
}

export function parseSaveFile(text: string): SaveFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new SaveFileParseError('badJson');
  }
  if (!raw || typeof raw !== 'object') throw new SaveFileParseError('badShape');
  const f = raw as Record<string, unknown>;
  if (f.app !== SAVE_FILE_APP) throw new SaveFileParseError('wrongApp');
  if (f.version !== SAVE_FILE_VERSION) throw new SaveFileParseError('wrongVersion');
  if (!f.map || typeof f.map !== 'object') throw new SaveFileParseError('badMap');
  const m = f.map as Record<string, unknown>;
  if (!Array.isArray(m.coins) || !m.walls || !m.table) {
    throw new SaveFileParseError('badMap');
  }
  if (!f.config || typeof f.config !== 'object') throw new SaveFileParseError('badConfig');
  if (!Array.isArray(f.shots)) throw new SaveFileParseError('badShots');
  if (!f.result || typeof f.result !== 'object') throw new SaveFileParseError('badResult');
  return f as unknown as SaveFile;
}
