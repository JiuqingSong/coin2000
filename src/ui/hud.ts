import { Owner, Phase } from '../game/types';
import type { World } from '../game/world';
import type { RoundResult } from '../game/rules';

export type P2Mode = 'ai' | 'human';

export interface HudHandle {
  update(world: World): void;
  setP2Mode(mode: P2Mode): void;
  showResult(result: RoundResult): void;
  clearResult(): void;
}

export function mountHud(
  hudRoot: HTMLElement,
  overlayRoot: HTMLElement,
  onPlayAgain: () => void,
  initialP2Mode: P2Mode = 'ai',
): HudHandle {
  hudRoot.replaceChildren();

  const pill = document.createElement('div');
  pill.className = 'pill';

  const counts = document.createElement('div');
  counts.className = 'counts';
  const p1 = makeCount('P1', 'p1');
  const p2 = makeCount('P2', 'p2');
  counts.append(p1.row, p2.row);

  const status = document.createElement('div');
  status.className = 'status';

  hudRoot.append(pill, counts, status);

  overlayRoot.replaceChildren();
  const card = document.createElement('div');
  card.className = 'overlay-card';
  const winnerText = document.createElement('div');
  winnerText.className = 'winner';
  const banter = document.createElement('div');
  banter.className = 'banter';
  const playAgain = document.createElement('button');
  playAgain.type = 'button';
  playAgain.textContent = 'Play Again';
  playAgain.addEventListener('click', onPlayAgain);
  card.append(winnerText, banter, playAgain);
  overlayRoot.append(card);
  overlayRoot.hidden = true;
  overlayRoot.classList.remove('visible');

  let lastPillText = '';
  let lastPillClass = '';
  let lastP1 = -1;
  let lastP2 = -1;
  let lastStatus = '';
  let p2Mode: P2Mode = initialP2Mode;
  let lastWorld: World | null = null;

  const refreshStatus = (world: World | null) => {
    if (world === null) return;
    const s = statusFor(world, p2Mode);
    if (s !== lastStatus) { status.textContent = s; lastStatus = s; }
  };

  return {
    update(world: World) {
      lastWorld = world;
      const { text: pillText, cls: pillClass } = pillFor(world);
      if (pillText !== lastPillText) {
        pill.textContent = pillText;
        lastPillText = pillText;
      }
      if (pillClass !== lastPillClass) {
        pill.className = 'pill' + (pillClass ? ' ' + pillClass : '');
        lastPillClass = pillClass;
      }

      const a = world.aliveCount[Owner.P1];
      const b = world.aliveCount[Owner.P2];
      if (a !== lastP1) { p1.value.textContent = String(a); lastP1 = a; }
      if (b !== lastP2) { p2.value.textContent = String(b); lastP2 = b; }

      refreshStatus(world);
    },
    setP2Mode(mode: P2Mode) {
      p2Mode = mode;
      refreshStatus(lastWorld);
    },
    showResult(result: RoundResult) {
      if (result.winner === 'draw') {
        winnerText.textContent = 'Draw';
        winnerText.className = 'winner draw';
      } else if (result.winner === Owner.P1) {
        winnerText.textContent = 'P1 wins';
        winnerText.className = 'winner p1';
      } else {
        winnerText.textContent = 'P2 wins';
        winnerText.className = 'winner p2';
      }
      banter.textContent = pickBanter(result);
      overlayRoot.hidden = false;
      requestAnimationFrame(() => overlayRoot.classList.add('visible'));
    },
    clearResult() {
      overlayRoot.classList.remove('visible');
      overlayRoot.hidden = true;
    },
  };
}

const BANTER_P1 = [
  'Crushing victory.',
  'P1 takes the table.',
  'Clean sweep.',
  'P2 had no answer.',
];
const BANTER_P2 = [
  'P2 takes it.',
  'A measured win.',
  'P1 left the table empty.',
  'Outshot and outplayed.',
];
const BANTER_DRAW = [
  'Mutually assured oblivion.',
  'Nobody left standing.',
  'A draw — both tables run dry.',
];

function pickBanter(result: RoundResult): string {
  const pool =
    result.winner === Owner.P1 ? BANTER_P1 :
    result.winner === Owner.P2 ? BANTER_P2 :
    BANTER_DRAW;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function makeCount(label: string, side: 'p1' | 'p2') {
  const row = document.createElement('div');
  row.className = `count ${side}`;
  const labelEl = document.createElement('span');
  labelEl.className = 'label';
  labelEl.textContent = label;
  const value = document.createElement('span');
  value.className = 'value';
  value.textContent = '0';
  row.append(labelEl, value);
  return { row, value };
}

function pillFor(world: World): { text: string; cls: string } {
  switch (world.phase) {
    case Phase.Idle: return { text: 'Idle', cls: '' };
    case Phase.Aiming:
      return world.current === Owner.P1
        ? { text: "P1's turn", cls: 'p1' }
        : { text: "P2's turn", cls: 'p2' };
    case Phase.Simulating: return { text: 'Resolving…', cls: '' };
    case Phase.RoundEnd: return { text: 'Round over', cls: '' };
  }
}

function statusFor(world: World, p2Mode: P2Mode): string {
  if (world.phase === Phase.Aiming) {
    if (world.current === Owner.P1) return 'Drag a P1 coin to aim. Release to shoot.';
    return p2Mode === 'ai'
      ? 'P2 is thinking…'
      : 'Drag a P2 coin to aim. Release to shoot.';
  }
  if (world.phase === Phase.Simulating) return 'Coins in motion.';
  if (world.phase === Phase.RoundEnd) return 'Round over.';
  return '';
}
