import { Bell } from './audio/bell';
import { Engine } from './game/engine';
import { Owner } from './game/types';
import { AimController } from './input/aim';
import { AIPlayer } from './players/aiPlayer';
import { HumanPlayer } from './players/humanPlayer';
import type { Player } from './players/player';
import { createCanvasView } from './render/canvas';
import { mountChrome, type P2Mode } from './ui/chrome';
import { mountHud } from './ui/hud';

const board = document.getElementById('board') as HTMLCanvasElement | null;
const chromeEl = document.getElementById('chrome');
const hudEl = document.getElementById('hud');
const overlayEl = document.getElementById('overlay');

if (!board || !chromeEl || !hudEl || !overlayEl) {
  throw new Error('Required DOM elements missing.');
}

const view = createCanvasView(board);
const aim = new AimController(board, view);
const bell = new Bell();

const unlockAudio = () => {
  bell.resume();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('keydown', unlockAudio);
};
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

let p2Mode: P2Mode = 'ai';

const buildPlayer = (owner: Owner): Player => {
  if (owner === Owner.P1) return new HumanPlayer(Owner.P1, aim);
  return p2Mode === 'ai' ? new AIPlayer(Owner.P2) : new HumanPlayer(Owner.P2, aim);
};

const restart = () => {
  hud.clearResult();
  engine.start();
};

const hud = mountHud(hudEl, overlayEl, restart, p2Mode);

const engine = new Engine({
  view,
  aim,
  bell,
  buildPlayer,
  onFrame: (world) => hud.update(world),
  onRoundEnd: (result) => hud.showResult(result),
});

mountChrome(chromeEl, {
  initialP2Mode: p2Mode,
  onP2ModeChange: (mode) => {
    p2Mode = mode;
    hud.setP2Mode(mode);
    engine.setPlayer(Owner.P2, buildPlayer(Owner.P2));
  },
  onRestart: restart,
});

engine.start();
