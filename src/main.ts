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
import { mountReactions } from './ui/reactions';

const board = document.getElementById('board') as HTMLCanvasElement | null;
const chromeEl = document.getElementById('chrome');
const hudEl = document.getElementById('hud');
const overlayEl = document.getElementById('overlay');
const messageEl = document.getElementById('message-strip');

if (!board || !chromeEl || !hudEl || !overlayEl || !messageEl) {
  throw new Error('Required DOM elements missing.');
}

const view = createCanvasView(board);
const aim = new AimController(board, view);
const bell = new Bell();
const reactions = mountReactions(messageEl);

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

const isAiTurn = (owner: Owner) => owner === Owner.P2 && p2Mode === 'ai';

const restart = () => {
  hud.clearResult();
  reactions.clear();
  engine.start();
};

const hud = mountHud(hudEl, overlayEl, restart, p2Mode);

const engine = new Engine({
  view,
  aim,
  bell,
  buildPlayer,
  onFrame: (world) => hud.update(world),
  onTurnStart: (owner) => {
    if (isAiTurn(owner)) reactions.show('aiThinking');
    else reactions.show('humanAiming');
  },
  onShotFired: (shooter) => {
    if (isAiTurn(shooter)) reactions.show('aiShooting');
  },
  onTurnSettled: ({ shooter, killedP1, killedP2 }) => {
    if (isAiTurn(shooter)) {
      reactions.show(killedP1 > 0 ? 'aiKilledP1' : 'aiTestShot');
      return;
    }
    // shooter is a human (P1 always, or P2 in human mode)
    const enemyKilled = shooter === Owner.P1 ? killedP2 : killedP1;
    const selfKilled = shooter === Owner.P1 ? killedP1 : killedP2;
    if (enemyKilled > 0) reactions.show('humanKilledEnemy');
    else if (selfKilled > 0) reactions.show('humanKilledOwn');
    else reactions.show('humanNothing');
  },
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
