import { subscribeLocale, t, tArray, type StringKey, type ArrayKey } from '../i18n';
import { Owner, Phase } from '../game/types';
import type { World } from '../game/world';
import type { RoundResult } from '../game/rules';

export type P2Mode = 'ai' | 'human';
export type OverlayMode = 'play' | 'replay';

export interface GameInfo {
  p1Coins: number;
  p2Coins: number;
  stones: number;
  bombs: number;
  holes: number;
  trees: number;
  coinRadius: number;
  coinMass: number;
  maxShotSpeed: number;
  aiAngleSamples: number;
  keepShotOnKill: boolean;
  explosionRadius: number;
}

export interface HudCallbacks {
  onPlayAgain(): void;
  onSaveReplay(): void;
  onBackToWelcome(): void;
  onReplayAgain(): void;
  onLoadAnotherReplay(): void;
  onReplayPause(): void;
  onReplayResume(): void;
  onReplayStep(): void;
  onContinueFromHere(): void;
}

export interface HudHandle {
  update(world: World): void;
  setP2Mode(mode: P2Mode): void;
  showResult(result: RoundResult, mode: OverlayMode): void;
  clearResult(): void;
  setGameInfo(info: GameInfo | null): void;
  setReplayControlsVisible(visible: boolean): void;
  setReplayPaused(paused: boolean): void;
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

  const replayControls = document.createElement('div');
  replayControls.className = 'hud-replay-controls';
  replayControls.hidden = true;

  const pauseBtn = document.createElement('button');
  pauseBtn.type = 'button';
  pauseBtn.className = 'hud-replay-btn';

  const stepBtn = document.createElement('button');
  stepBtn.type = 'button';
  stepBtn.className = 'hud-replay-btn';
  stepBtn.textContent = '⏭';

  const continueBtn = document.createElement('button');
  continueBtn.type = 'button';
  continueBtn.className = 'hud-replay-btn';
  continueBtn.textContent = '🕹️';

  replayControls.append(pauseBtn, stepBtn, continueBtn);

  const infoSection = document.createElement('div');
  infoSection.className = 'hud-info';
  infoSection.hidden = true;

  hudRoot.append(pill, counts, status, replayControls, infoSection);

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

  const replayAgainBtn = document.createElement('button');
  replayAgainBtn.type = 'button';
  replayAgainBtn.className = 'primary';
  replayAgainBtn.addEventListener('click', callbacks.onReplayAgain);

  const loadReplayBtn = document.createElement('button');
  loadReplayBtn.type = 'button';
  loadReplayBtn.addEventListener('click', callbacks.onLoadAnotherReplay);

  buttonRow.append(playAgainBtn, saveBtn, replayAgainBtn, loadReplayBtn, backBtn);
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

  let replayPaused = false;

  const applyReplayPaused = () => {
    if (replayPaused) {
      pauseBtn.textContent = '▶';
      pauseBtn.title = t('hud.replay.resume');
      pauseBtn.onclick = () => callbacks.onReplayResume();
      stepBtn.disabled = false;
      continueBtn.disabled = false;
    } else {
      pauseBtn.textContent = '⏸';
      pauseBtn.title = t('hud.replay.pause');
      pauseBtn.onclick = () => callbacks.onReplayPause();
      stepBtn.disabled = true;
      continueBtn.disabled = true;
    }
    stepBtn.title = t('hud.replay.step');
    continueBtn.title = t('hud.replay.continueFromHere');
  };

  applyReplayPaused();

  let currentInfo: GameInfo | null = null;

  const INFO_ROWS: Array<{ key: StringKey; get: (i: GameInfo) => string }> = [
    { key: 'hud.info.p1Coins',        get: (i) => String(i.p1Coins) },
    { key: 'hud.info.p2Coins',        get: (i) => String(i.p2Coins) },
    { key: 'hud.info.stones',         get: (i) => String(i.stones) },
    { key: 'hud.info.bombs',          get: (i) => String(i.bombs) },
    { key: 'hud.info.holes',          get: (i) => String(i.holes) },
    { key: 'hud.info.trees',          get: (i) => String(i.trees) },
    { key: 'hud.info.coinRadius',     get: (i) => String(i.coinRadius) },
    { key: 'hud.info.coinMass',       get: (i) => String(i.coinMass) },
    { key: 'hud.info.maxSpeed',       get: (i) => String(i.maxShotSpeed) },
    { key: 'hud.info.aiDifficulty',   get: (i) => String(i.aiAngleSamples) },
    { key: 'hud.info.keepShotOnKill', get: (i) => t(i.keepShotOnKill ? 'hud.info.on' : 'hud.info.off') },
    { key: 'hud.info.explosionRadius',get: (i) => String(i.explosionRadius) },
  ];

  const refreshInfo = () => {
    if (currentInfo === null) {
      infoSection.hidden = true;
      return;
    }
    infoSection.hidden = false;
    infoSection.replaceChildren();

    const heading = document.createElement('div');
    heading.className = 'hud-info-heading';
    heading.textContent = t('hud.info.heading');
    infoSection.append(heading);

    for (const { key, get } of INFO_ROWS) {
      const row = document.createElement('div');
      row.className = 'hud-info-row';
      const label = document.createElement('span');
      label.className = 'hud-info-label';
      label.textContent = t(key);
      const val = document.createElement('span');
      val.className = 'hud-info-value';
      val.textContent = get(currentInfo);
      row.append(label, val);
      infoSection.append(row);
    }
  };

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
    replayAgainBtn.textContent = t('hud.replayAgain');
    loadReplayBtn.textContent = t('hud.loadReplay');
  };

  const applyOverlayMode = () => {
    const isReplay = overlayMode === 'replay';
    playAgainBtn.hidden = isReplay;
    saveBtn.hidden = isReplay;
    replayAgainBtn.hidden = !isReplay;
    loadReplayBtn.hidden = !isReplay;
    backBtn.hidden = false;
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
  stepBtn.addEventListener('click', () => callbacks.onReplayStep());
  continueBtn.addEventListener('click', () => callbacks.onContinueFromHere());

  subscribeLocale(() => {
    applyStaticLabels();
    lastPillText = '';
    lastStatus = '';
    refreshPill();
    refreshStatus();
    refreshResult();
    refreshInfo();
    applyReplayPaused();
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
    setGameInfo(info: GameInfo | null) {
      currentInfo = info;
      refreshInfo();
    },
    setReplayControlsVisible(visible: boolean) {
      replayControls.hidden = !visible;
    },
    setReplayPaused(paused: boolean) {
      replayPaused = paused;
      applyReplayPaused();
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
