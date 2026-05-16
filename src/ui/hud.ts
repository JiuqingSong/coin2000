import { subscribeLocale, t, tArray, type StringKey, type ArrayKey } from '../i18n';
import { Owner, Phase } from '../game/types';
import type { World } from '../game/world';
import type { RoundResult } from '../game/rules';

export type P2Mode = 'ai' | 'human';
export type OverlayMode = 'play' | 'replay';

export interface HudCallbacks {
  onPlayAgain(): void;
  onSaveReplay(): void;
  onBackToWelcome(): void;
}

export interface HudHandle {
  update(world: World): void;
  setP2Mode(mode: P2Mode): void;
  showResult(result: RoundResult, mode: OverlayMode): void;
  clearResult(): void;
}

export function mountHud(
  hudRoot: HTMLElement,
  overlayRoot: HTMLElement,
  callbacks: HudCallbacks,
  initialP2Mode: P2Mode = 'ai',
): HudHandle {
  hudRoot.replaceChildren();

  const pill = document.createElement('div');
  pill.className = 'pill';

  const counts = document.createElement('div');
  counts.className = 'counts';
  const p1 = makeCount('p1');
  const p2 = makeCount('p2');
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

  const buttonRow = document.createElement('div');
  buttonRow.className = 'overlay-buttons';

  const playAgainBtn = document.createElement('button');
  playAgainBtn.type = 'button';
  playAgainBtn.className = 'primary';
  playAgainBtn.addEventListener('click', callbacks.onPlayAgain);

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.addEventListener('click', callbacks.onSaveReplay);

  const backBtn = document.createElement('button');
  backBtn.type = 'button';
  backBtn.className = 'primary';
  backBtn.addEventListener('click', callbacks.onBackToWelcome);

  buttonRow.append(playAgainBtn, saveBtn, backBtn);
  card.append(winnerText, banter, buttonRow);
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
  let overlayMode: OverlayMode = 'play';

  // Result/banter state held across locale changes.
  let lastResult: RoundResult | null = null;
  let banterPoolKey: ArrayKey | null = null;
  let banterIndex = 0;

  const applyStaticLabels = () => {
    p1.label.textContent = t('hud.count.p1');
    p2.label.textContent = t(p2CountKey(p2Mode));
    playAgainBtn.textContent = t('hud.playAgain');
    saveBtn.textContent = t('hud.saveReplay');
    backBtn.textContent = t('hud.backToWelcome');
  };

  const applyOverlayMode = () => {
    const isReplay = overlayMode === 'replay';
    playAgainBtn.hidden = isReplay;
    saveBtn.hidden = isReplay;
    backBtn.hidden = !isReplay;
  };

  const refreshStatus = () => {
    if (lastWorld === null) return;
    const key = statusKeyFor(lastWorld, p2Mode);
    const s = key === null ? '' : t(key);
    if (s !== lastStatus) {
      status.textContent = s;
      lastStatus = s;
    }
  };

  const refreshPill = () => {
    if (lastWorld === null) return;
    const { text, cls } = pillFor(lastWorld, p2Mode);
    if (text !== lastPillText) {
      pill.textContent = text;
      lastPillText = text;
    }
    if (cls !== lastPillClass) {
      pill.className = 'pill' + (cls ? ' ' + cls : '');
      lastPillClass = cls;
    }
  };

  const refreshResult = () => {
    if (lastResult === null || banterPoolKey === null) return;
    const { winner } = lastResult;
    if (winner === 'draw') {
      winnerText.textContent = t('hud.winner.draw');
      winnerText.className = 'winner draw';
    } else if (winner === Owner.P1) {
      winnerText.textContent = t('hud.winner.p1');
      winnerText.className = 'winner p1';
    } else {
      winnerText.textContent = t(p2Mode === 'ai' ? 'hud.winner.p2.ai' : 'hud.winner.p2.human');
      winnerText.className = 'winner p2';
    }
    const pool = tArray(banterPoolKey);
    banter.textContent = pool[banterIndex % pool.length] ?? '';
  };

  applyStaticLabels();
  applyOverlayMode();
  subscribeLocale(() => {
    applyStaticLabels();
    lastPillText = '';
    lastStatus = '';
    refreshPill();
    refreshStatus();
    refreshResult();
  });

  return {
    update(world: World) {
      lastWorld = world;
      refreshPill();

      const a = world.aliveCount[Owner.P1];
      const b = world.aliveCount[Owner.P2];
      if (a !== lastP1) { p1.value.textContent = String(a); lastP1 = a; }
      if (b !== lastP2) { p2.value.textContent = String(b); lastP2 = b; }

      refreshStatus();
    },
    setP2Mode(mode: P2Mode) {
      p2Mode = mode;
      p2.label.textContent = t(p2CountKey(mode));
      lastPillText = '';
      lastStatus = '';
      refreshPill();
      refreshStatus();
      refreshResult();
    },
    showResult(result: RoundResult, mode: OverlayMode) {
      lastResult = result;
      overlayMode = mode;
      banterPoolKey =
        result.winner === Owner.P1 ? 'banter.p1' :
        result.winner === Owner.P2 ? 'banter.p2' :
        'banter.draw';
      const pool = tArray(banterPoolKey);
      banterIndex = pool.length > 0 ? Math.floor(Math.random() * pool.length) : 0;
      applyOverlayMode();
      refreshResult();
      overlayRoot.hidden = false;
      requestAnimationFrame(() => overlayRoot.classList.add('visible'));
    },
    clearResult() {
      lastResult = null;
      banterPoolKey = null;
      overlayRoot.classList.remove('visible');
      overlayRoot.hidden = true;
    },
  };
}

function p2CountKey(mode: P2Mode): StringKey {
  return mode === 'ai' ? 'hud.count.p2.ai' : 'hud.count.p2.human';
}

function makeCount(side: 'p1' | 'p2') {
  const row = document.createElement('div');
  row.className = `count ${side}`;
  const labelEl = document.createElement('span');
  labelEl.className = 'label';
  const value = document.createElement('span');
  value.className = 'value';
  value.textContent = '0';
  row.append(labelEl, value);
  return { row, label: labelEl, value };
}

function pillFor(world: World, p2Mode: P2Mode): { text: string; cls: string } {
  switch (world.phase) {
    case Phase.Idle:
      return { text: t('hud.pill.idle'), cls: '' };
    case Phase.Aiming:
      return world.current === Owner.P1
        ? { text: t('hud.pill.p1Turn'), cls: 'p1' }
        : { text: t(p2Mode === 'ai' ? 'hud.pill.aiTurn' : 'hud.pill.humanTurn'), cls: 'p2' };
    case Phase.Simulating:
      return { text: t('hud.pill.simulating'), cls: '' };
    case Phase.RoundEnd:
      return { text: t('hud.pill.roundEnd'), cls: '' };
  }
}

function statusKeyFor(world: World, p2Mode: P2Mode): StringKey | null {
  if (world.phase === Phase.Aiming) {
    if (world.current === Owner.P1) return 'hud.status.p1Aim';
    return p2Mode === 'ai' ? 'hud.status.aiThinking' : 'hud.status.humanAim';
  }
  if (world.phase === Phase.Simulating) return 'hud.status.simulating';
  if (world.phase === Phase.RoundEnd) return 'hud.status.roundEnd';
  return null;
}
