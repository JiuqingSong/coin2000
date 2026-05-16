import {
  applyConfig,
  CONFIG_DEFAULTS,
  CONFIG_RANGES,
  config,
  type GameConfig,
} from '../game/config';

export interface ConfigDialogHandle {
  open(): void;
  close(): void;
}

export function mountConfig(parent: HTMLElement): ConfigDialogHandle {
  const overlay = document.createElement('div');
  overlay.id = 'config-modal';
  overlay.hidden = true;

  const card = document.createElement('div');
  card.className = 'config-card';

  const title = document.createElement('h2');
  title.textContent = '设置';
  card.append(title);

  // -- color section --
  const colorSec = section('颜色');
  const p1ColorInput = colorRow(colorSec, '玩家硬币', config.p1Color);
  const p2ColorInput = colorRow(colorSec, '电脑硬币', config.p2Color);
  card.append(colorSec.fieldset);

  // -- coin section --
  const coinSec = section('硬币');
  const coinsPerSideRow = sliderRow(
    coinSec,
    '每方硬币数',
    CONFIG_RANGES.coinsPerSide.min,
    CONFIG_RANGES.coinsPerSide.max,
    config.coinsPerSide,
  );
  const radiusRow = sliderRow(
    coinSec,
    '硬币半径',
    CONFIG_RANGES.coinRadius.min,
    CONFIG_RANGES.coinRadius.max,
    config.coinRadius,
  );
  const massRow = sliderRow(
    coinSec,
    '硬币质量',
    CONFIG_RANGES.coinMass.min,
    CONFIG_RANGES.coinMass.max,
    config.coinMass,
  );
  card.append(coinSec.fieldset);

  // -- gameplay section --
  const gameSec = section('游戏');
  const speedRow = sliderRow(
    gameSec,
    '最大速度',
    CONFIG_RANGES.maxShotSpeed.min,
    CONFIG_RANGES.maxShotSpeed.max,
    config.maxShotSpeed,
  );
  const aiRow = sliderRow(
    gameSec,
    '游戏难度',
    CONFIG_RANGES.aiAngleSamples.min,
    CONFIG_RANGES.aiAngleSamples.max,
    config.aiAngleSamples,
  );
  card.append(gameSec.fieldset);

  // -- misc --
  const miscSec = section('其它');
  const soundRow = document.createElement('label');
  soundRow.className = 'config-row checkbox';
  const soundInput = document.createElement('input');
  soundInput.type = 'checkbox';
  soundInput.checked = config.soundEnabled;
  soundRow.append(soundInput, document.createTextNode(' 声音提示'));
  miscSec.fieldset.append(soundRow);
  card.append(miscSec.fieldset);

  // -- actions --
  const actions = document.createElement('div');
  actions.className = 'config-actions';

  const okBtn = document.createElement('button');
  okBtn.type = 'button';
  okBtn.className = 'primary';
  okBtn.textContent = '确定';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.textContent = '取消';

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  resetBtn.textContent = '恢复默认';

  actions.append(okBtn, cancelBtn, resetBtn);
  card.append(actions);

  overlay.append(card);
  parent.append(overlay);

  const reflectFromConfig = () => {
    p1ColorInput.value = config.p1Color;
    p2ColorInput.value = config.p2Color;
    coinsPerSideRow.set(config.coinsPerSide);
    radiusRow.set(config.coinRadius);
    massRow.set(config.coinMass);
    speedRow.set(config.maxShotSpeed);
    aiRow.set(config.aiAngleSamples);
    soundInput.checked = config.soundEnabled;
  };

  const readFromUi = (): GameConfig => ({
    p1Color: p1ColorInput.value,
    p2Color: p2ColorInput.value,
    coinsPerSide: coinsPerSideRow.get(),
    coinRadius: radiusRow.get(),
    coinMass: massRow.get(),
    maxShotSpeed: speedRow.get(),
    aiAngleSamples: aiRow.get(),
    soundEnabled: soundInput.checked,
  });

  const close = () => {
    overlay.hidden = true;
  };

  okBtn.addEventListener('click', () => {
    applyConfig(readFromUi());
    close();
  });

  cancelBtn.addEventListener('click', () => {
    reflectFromConfig();
    close();
  });

  resetBtn.addEventListener('click', () => {
    p1ColorInput.value = CONFIG_DEFAULTS.p1Color;
    p2ColorInput.value = CONFIG_DEFAULTS.p2Color;
    coinsPerSideRow.set(CONFIG_DEFAULTS.coinsPerSide);
    radiusRow.set(CONFIG_DEFAULTS.coinRadius);
    massRow.set(CONFIG_DEFAULTS.coinMass);
    speedRow.set(CONFIG_DEFAULTS.maxShotSpeed);
    aiRow.set(CONFIG_DEFAULTS.aiAngleSamples);
    soundInput.checked = CONFIG_DEFAULTS.soundEnabled;
  });

  return {
    open() {
      reflectFromConfig();
      overlay.hidden = false;
    },
    close,
  };
}

function section(name: string): { fieldset: HTMLFieldSetElement } {
  const fs = document.createElement('fieldset');
  fs.className = 'config-section';
  const legend = document.createElement('legend');
  legend.textContent = name;
  fs.append(legend);
  return { fieldset: fs };
}

function colorRow(
  parent: { fieldset: HTMLFieldSetElement },
  label: string,
  initial: string,
): HTMLInputElement {
  const row = document.createElement('label');
  row.className = 'config-row';
  row.append(document.createTextNode(label));
  const input = document.createElement('input');
  input.type = 'color';
  input.value = initial;
  row.append(input);
  parent.fieldset.append(row);
  return input;
}

interface SliderRow {
  set(v: number): void;
  get(): number;
}

function sliderRow(
  parent: { fieldset: HTMLFieldSetElement },
  label: string,
  min: number,
  max: number,
  initial: number,
): SliderRow {
  const row = document.createElement('label');
  row.className = 'config-row';
  row.append(document.createTextNode(label));

  const input = document.createElement('input');
  input.type = 'range';
  input.min = String(min);
  input.max = String(max);
  input.step = '1';
  input.value = String(initial);

  const valueEl = document.createElement('span');
  valueEl.className = 'config-value';
  valueEl.textContent = String(initial);

  input.addEventListener('input', () => {
    valueEl.textContent = input.value;
  });

  row.append(input, valueEl);
  parent.fieldset.append(row);

  return {
    set(v) {
      input.value = String(v);
      valueEl.textContent = String(v);
    },
    get() {
      return Number(input.value);
    },
  };
}
