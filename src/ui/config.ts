import {
  applyConfig,
  CONFIG_DEFAULTS,
  CONFIG_RANGES,
  config,
  type GameConfig,
} from '../game/config';
import { subscribeLocale, t, type StringKey } from '../i18n';

export interface ConfigDialogHandle {
  open(): void;
  close(): void;
}

interface SliderRow {
  set(v: number): void;
  get(): number;
}

interface CheckboxRow {
  set(v: boolean): void;
  get(): boolean;
}

export function mountConfig(parent: HTMLElement): ConfigDialogHandle {
  const overlay = document.createElement('div');
  overlay.id = 'config-modal';
  overlay.hidden = true;

  const card = document.createElement('div');
  card.className = 'config-card';

  // Direct-replacement labels (whole textContent = t(key)).
  type LabelEntry = { node: Node; key: StringKey };
  const labels: LabelEntry[] = [];
  const trackLabel = (node: Node, key: StringKey): Node => {
    node.textContent = t(key);
    labels.push({ node, key });
    return node;
  };

  // For text nodes that need wrapping (e.g. leading space for inline checkbox label).
  const refreshers: Array<() => void> = [];

  const title = document.createElement('h2');
  trackLabel(title, 'config.title');
  card.append(title);

  const colorSec = section('config.section.colors');
  const p1ColorInput = colorRow(colorSec, 'config.label.p1Color', config.p1Color);
  const p2ColorInput = colorRow(colorSec, 'config.label.p2Color', config.p2Color);
  card.append(colorSec.fieldset);

  const coinSec = section('config.section.coins');
  const coinsPerSideRow = sliderRow(coinSec, 'config.label.coinsPerSide',
    CONFIG_RANGES.coinsPerSide.min, CONFIG_RANGES.coinsPerSide.max, config.coinsPerSide);
  const radiusRow = sliderRow(coinSec, 'config.label.coinRadius',
    CONFIG_RANGES.coinRadius.min, CONFIG_RANGES.coinRadius.max, config.coinRadius);
  const massRow = sliderRow(coinSec, 'config.label.coinMass',
    CONFIG_RANGES.coinMass.min, CONFIG_RANGES.coinMass.max, config.coinMass);
  card.append(coinSec.fieldset);

  const gameSec = section('config.section.gameplay');
  const speedRow = sliderRow(gameSec, 'config.label.maxShotSpeed',
    CONFIG_RANGES.maxShotSpeed.min, CONFIG_RANGES.maxShotSpeed.max, config.maxShotSpeed);
  const aiRow = sliderRow(gameSec, 'config.label.aiDifficulty',
    CONFIG_RANGES.aiAngleSamples.min, CONFIG_RANGES.aiAngleSamples.max, config.aiAngleSamples);
  const keepShotRow = checkboxRow(gameSec, 'config.label.keepShotOnKill', config.keepShotOnKill);
  card.append(gameSec.fieldset);

  const piecesSec = section('config.section.pieces');
  const stoneCountRow = sliderRow(piecesSec, 'config.label.stoneCount',
    CONFIG_RANGES.stoneCount.min, CONFIG_RANGES.stoneCount.max, config.stoneCount);
  const bombCountRow = sliderRow(piecesSec, 'config.label.bombCount',
    CONFIG_RANGES.bombCount.min, CONFIG_RANGES.bombCount.max, config.bombCount);
  const treeCountRow = sliderRow(piecesSec, 'config.label.treeCount',
    CONFIG_RANGES.treeCount.min, CONFIG_RANGES.treeCount.max, config.treeCount);
  const explosionRow = sliderRow(piecesSec, 'config.label.explosionRadius',
    CONFIG_RANGES.explosionRadius.min, CONFIG_RANGES.explosionRadius.max, config.explosionRadius);
  const chainRow = checkboxRow(piecesSec, 'config.label.chainBombs', config.chainBombs);
  const misfireRow = checkboxRow(piecesSec, 'config.label.misfireProtection', config.misfireProtection);
  card.append(piecesSec.fieldset);

  const miscSec = section('config.section.other');
  const soundRow = checkboxRow(miscSec, 'config.label.sound', config.soundEnabled);
  card.append(miscSec.fieldset);

  const actions = document.createElement('div');
  actions.className = 'config-actions';

  const okBtn = document.createElement('button');
  okBtn.type = 'button';
  okBtn.className = 'primary';
  trackLabel(okBtn, 'config.btn.ok');

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  trackLabel(cancelBtn, 'config.btn.cancel');

  const resetBtn = document.createElement('button');
  resetBtn.type = 'button';
  trackLabel(resetBtn, 'config.btn.reset');

  actions.append(okBtn, cancelBtn, resetBtn);
  card.append(actions);

  overlay.append(card);
  parent.append(overlay);

  subscribeLocale(() => {
    for (const { node, key } of labels) node.textContent = t(key);
    for (const fn of refreshers) fn();
  });

  const reflectFromConfig = () => {
    p1ColorInput.value = config.p1Color;
    p2ColorInput.value = config.p2Color;
    coinsPerSideRow.set(config.coinsPerSide);
    radiusRow.set(config.coinRadius);
    massRow.set(config.coinMass);
    speedRow.set(config.maxShotSpeed);
    aiRow.set(config.aiAngleSamples);
    keepShotRow.set(config.keepShotOnKill);
    soundRow.set(config.soundEnabled);
    stoneCountRow.set(config.stoneCount);
    bombCountRow.set(config.bombCount);
    treeCountRow.set(config.treeCount);
    explosionRow.set(config.explosionRadius);
    chainRow.set(config.chainBombs);
    misfireRow.set(config.misfireProtection);
  };

  const readFromUi = (): GameConfig => ({
    p1Color: p1ColorInput.value,
    p2Color: p2ColorInput.value,
    coinsPerSide: coinsPerSideRow.get(),
    coinRadius: radiusRow.get(),
    coinMass: massRow.get(),
    maxShotSpeed: speedRow.get(),
    aiAngleSamples: aiRow.get(),
    keepShotOnKill: keepShotRow.get(),
    soundEnabled: soundRow.get(),
    stoneCount: stoneCountRow.get(),
    bombCount: bombCountRow.get(),
    treeCount: treeCountRow.get(),
    explosionRadius: explosionRow.get(),
    chainBombs: chainRow.get(),
    misfireProtection: misfireRow.get(),
  });

  const close = () => { overlay.hidden = true; };

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
    keepShotRow.set(CONFIG_DEFAULTS.keepShotOnKill);
    soundRow.set(CONFIG_DEFAULTS.soundEnabled);
    stoneCountRow.set(CONFIG_DEFAULTS.stoneCount);
    bombCountRow.set(CONFIG_DEFAULTS.bombCount);
    treeCountRow.set(CONFIG_DEFAULTS.treeCount);
    explosionRow.set(CONFIG_DEFAULTS.explosionRadius);
    chainRow.set(CONFIG_DEFAULTS.chainBombs);
    misfireRow.set(CONFIG_DEFAULTS.misfireProtection);
  });

  return {
    open() {
      reflectFromConfig();
      overlay.hidden = false;
    },
    close,
  };

  // ---- helpers (closed over `labels`, `refreshers`) ----

  function section(legendKey: StringKey): { fieldset: HTMLFieldSetElement } {
    const fs = document.createElement('fieldset');
    fs.className = 'config-section';
    const legend = document.createElement('legend');
    trackLabel(legend, legendKey);
    fs.append(legend);
    return { fieldset: fs };
  }

  function colorRow(
    parent: { fieldset: HTMLFieldSetElement },
    labelKey: StringKey,
    initial: string,
  ): HTMLInputElement {
    const row = document.createElement('label');
    row.className = 'config-row';
    const text = document.createTextNode('');
    trackLabel(text, labelKey);
    row.append(text);
    const input = document.createElement('input');
    input.type = 'color';
    input.value = initial;
    row.append(input);
    parent.fieldset.append(row);
    return input;
  }

  function checkboxRow(
    parent: { fieldset: HTMLFieldSetElement },
    labelKey: StringKey,
    initial: boolean,
  ): CheckboxRow {
    const row = document.createElement('label');
    row.className = 'config-row checkbox';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = initial;
    const text = document.createTextNode('');
    const refresh = () => { text.textContent = ' ' + t(labelKey); };
    refresh();
    refreshers.push(refresh);
    row.append(input, text);
    parent.fieldset.append(row);
    return {
      set(v) { input.checked = v; },
      get() { return input.checked; },
    };
  }

  function sliderRow(
    parent: { fieldset: HTMLFieldSetElement },
    labelKey: StringKey,
    min: number,
    max: number,
    initial: number,
  ): SliderRow {
    const row = document.createElement('label');
    row.className = 'config-row';
    const text = document.createTextNode('');
    trackLabel(text, labelKey);
    row.append(text);

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
}
