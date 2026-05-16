import type { SaveFile } from './types';

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
  return `coin2000-replay-${y}-${m}-${d}-${hh}${mm}${ss}.json`;
}

export function sanitizeFileName(raw: string): string {
  let name = raw.trim().replace(/[\\/:*?"<>|]/g, '_');
  if (!name) name = defaultSaveFileName();
  if (!/\.json$/i.test(name)) name += '.json';
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
