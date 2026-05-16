// Entry point. Phase 0 scaffold: wire up nothing yet, just confirm the page boots.

const board = document.getElementById('board') as HTMLCanvasElement | null;
const chrome = document.getElementById('chrome');
const hud = document.getElementById('hud');

if (!board || !chrome || !hud) {
  throw new Error('Required DOM elements missing.');
}

chrome.textContent = 'COIN 2000 — Phase 0 scaffold';
hud.textContent = 'HUD placeholder';

const ctx = board.getContext('2d')!;
const resize = () => {
  const dpr = window.devicePixelRatio || 1;
  const rect = board.getBoundingClientRect();
  board.width = Math.round(rect.width * dpr);
  board.height = Math.round(rect.height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.fillStyle = '#0e1115';
  ctx.fillRect(0, 0, rect.width, rect.height);
  ctx.fillStyle = '#6db4ff';
  ctx.font = '16px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('canvas ready', rect.width / 2, rect.height / 2);
};
resize();
window.addEventListener('resize', resize);
