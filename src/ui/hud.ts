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
  const p1 = makeCount('玩家', 'p1');
  const p2 = makeCount(labelForP2(initialP2Mode), 'p2');
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
  playAgain.textContent = '再来一局';
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
      const { text: pillText, cls: pillClass } = pillFor(world, p2Mode);
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
      p2.label.textContent = labelForP2(mode);
      lastPillText = '';
      refreshStatus(lastWorld);
    },
    showResult(result: RoundResult) {
      if (result.winner === 'draw') {
        winnerText.textContent = '平局';
        winnerText.className = 'winner draw';
      } else if (result.winner === Owner.P1) {
        winnerText.textContent = '您获胜';
        winnerText.className = 'winner p1';
      } else {
        winnerText.textContent = p2Mode === 'ai' ? '电脑获胜' : '对手获胜';
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
  '酷毙了，您消灭了电脑的全部硬币，获得最终胜利！',
  '您赢了，算您厉害，今天就先放过电脑。',
  '电脑已经输光了，您还真是厉害，服了。',
  '完胜！来日方长。',
];
const BANTER_P2 = [
  '您已经没有硬币了。胜败乃兵家常事，来日方长。',
  '您已经输光了。还要努力啊！',
  '没办法，谁让电脑这么厉害呢。',
  '明天把改错交上来。',
];
const BANTER_DRAW = [
  '两败俱伤。',
  '桌上无人生还。',
  '平局——两边都打光了。',
];

function pickBanter(result: RoundResult): string {
  const pool =
    result.winner === Owner.P1 ? BANTER_P1 :
    result.winner === Owner.P2 ? BANTER_P2 :
    BANTER_DRAW;
  return pool[Math.floor(Math.random() * pool.length)]!;
}

function labelForP2(mode: P2Mode): string {
  return mode === 'ai' ? '电脑' : '对手';
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
  return { row, label: labelEl, value };
}

function pillFor(world: World, p2Mode: P2Mode): { text: string; cls: string } {
  switch (world.phase) {
    case Phase.Idle: return { text: '准备中', cls: '' };
    case Phase.Aiming:
      return world.current === Owner.P1
        ? { text: '您的回合', cls: 'p1' }
        : { text: p2Mode === 'ai' ? '电脑回合' : '对手回合', cls: 'p2' };
    case Phase.Simulating: return { text: '运动中…', cls: '' };
    case Phase.RoundEnd: return { text: '本局结束', cls: '' };
  }
}

function statusFor(world: World, p2Mode: P2Mode): string {
  if (world.phase === Phase.Aiming) {
    if (world.current === Owner.P1) return '拖动您的硬币瞄准，松开发射。';
    return p2Mode === 'ai'
      ? '电脑思考中……'
      : '拖动对手的硬币瞄准，松开发射。';
  }
  if (world.phase === Phase.Simulating) return '硬币运动中。';
  if (world.phase === Phase.RoundEnd) return '本局结束。';
  return '';
}
