import type { SaveFile } from './types';

export const REPLAY_FILE_EXT = '.replay.coin';

export function serializeSaveFile(file: SaveFile): string {
  return JSON.stringify(file, null, 2);
}

export function defaultSaveFileName(date: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const hh = pad(date.getHours());
  const mm = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `coin2026-replay-${y}-${m}-${d}-${hh}${mm}${ss}${REPLAY_FILE_EXT}`;
}

// Strip illegal filename characters and force the desired extension.
// Default is REPLAY_FILE_EXT for backwards compatibility with existing callers.
export function sanitizeFileName(raw: string, ext: string = REPLAY_FILE_EXT): string {
  let name = raw.trim().replace(/[\\/:*?"<>|]/g, '_');
  if (!name) name = 'untitled';
  if (!name.toLowerCase().endsWith(ext.toLowerCase())) name += ext;
  return name;
}

export function downloadAsFile(name: string, contents: string): void {
  const blob = new Blob([contents], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
