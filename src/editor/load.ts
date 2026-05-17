import {
  MAP_FILE_APP,
  MAP_FILE_KIND,
  MAP_FILE_VERSION,
  type MapFile,
} from './types';

export type MapFileErrorReason =
  | 'badJson'
  | 'badShape'
  | 'wrongApp'
  | 'wrongKind'
  | 'wrongVersion'
  | 'badMap';

export class MapFileParseError extends Error {
  constructor(readonly reason: MapFileErrorReason) {
    super(reason);
    this.name = 'MapFileParseError';
  }
}

// Loads either a map file (kind: 'map') or a replay file (no kind field, has
// the full SaveFile shape). A replay's embedded MapData is a superset of what
// a map file carries, so loading a replay-as-map is well-defined: we just
// drop the shots/result/config and play a fresh game on that layout.
export function parseMapFile(text: string): MapFile {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    throw new MapFileParseError('badJson');
  }
  if (!raw || typeof raw !== 'object') throw new MapFileParseError('badShape');
  const f = raw as Record<string, unknown>;
  if (f.app !== MAP_FILE_APP) throw new MapFileParseError('wrongApp');
  if (f.kind !== undefined && f.kind !== MAP_FILE_KIND) {
    throw new MapFileParseError('wrongKind');
  }
  if (f.version !== MAP_FILE_VERSION) throw new MapFileParseError('wrongVersion');
  if (!f.map || typeof f.map !== 'object') throw new MapFileParseError('badMap');
  const m = f.map as Record<string, unknown>;
  if (!Array.isArray(m.coins) || !m.walls || !m.table) {
    throw new MapFileParseError('badMap');
  }
  if (f.kind === MAP_FILE_KIND) {
    return f as unknown as MapFile;
  }
  // Replay file — wrap the embedded map in a MapFile envelope.
  return {
    app: MAP_FILE_APP,
    version: MAP_FILE_VERSION,
    kind: MAP_FILE_KIND,
    createdAt: typeof f.createdAt === 'string' ? f.createdAt : new Date().toISOString(),
    map: f.map as MapFile['map'],
  };
}
