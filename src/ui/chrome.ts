import { getLocale, setLocale, subscribeLocale, t, type Locale } from '../i18n';
import {
  MAPS,
  getSelectedMapId,
  setSelectedMapId,
  subscribeMap,
  type MapId,
} from '../game/maps';

export type P2Mode = 'ai' | 'human';

export interface ChromeOptions {
  initialP2Mode: P2Mode;
  initialMusicOn: boolean;
  onP2ModeChange(mode: P2Mode): void;
  onMapChange(mapId: MapId): void;
  onRestart(): void;
  onMusicToggle(): void;
  onBackToEditor(): void;
  onBackToWelcome(): void;
}

export interface ChromeHandle {
  setMusicOn(on: boolean): void;
  setReplayMode(on: boolean): void;
  setCustomMapActive(on: boolean): void;
  setEditingMode(on: boolean): void;
}

const CUSTOM_MAP_OPTION = '__custom__';

export function mountChrome(root: HTMLElement, opts: ChromeOptions): ChromeHandle {
  let p2Mode = opts.initialP2Mode;
  let musicOn = opts.initialMusicOn;
  let musicBtnEl: HTMLButtonElement | null = null;
  let controlsEl: HTMLElement | null = null;
  let replayMode = false;
  let customMapActive = false;
  let editingMode = false;

  const refreshMusicBtn = () => {
    if (!musicBtnEl) return;
    musicBtnEl.textContent = musicOn ? t('chrome.music.on') : t('chrome.music.off');
    const title = musicOn ? t('chrome.music.title.on') : t('chrome.music.title.off');
    musicBtnEl.title = title;
    musicBtnEl.setAttribute('aria-label', title);
    musicBtnEl.classList.toggle('off', !musicOn);
  };

  const render = () => {
    root.replaceChildren();

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = t('app.title');

    const controls = document.createElement('div');
    controls.className = 'controls';

    const p2Label = document.createElement('label');
    p2Label.append(t('chrome.opponent'));

    const p2Select = document.createElement('select');
    const optAi = document.createElement('option');
    optAi.value = 'ai';
    optAi.textContent = t('chrome.p2.ai');
    const optHuman = document.createElement('option');
    optHuman.value = 'human';
    optHuman.textContent = t('chrome.p2.human');
    p2Select.append(optAi, optHuman);
    p2Select.value = p2Mode;
    p2Select.addEventListener('change', () => {
      p2Mode = p2Select.value as P2Mode;
      opts.onP2ModeChange(p2Mode);
    });
    p2Label.append(p2Select);

    const mapLabel = document.createElement('label');
    mapLabel.append(t('chrome.map'));
    const mapSelect = document.createElement('select');
    if (customMapActive) {
      const o = document.createElement('option');
      o.value = CUSTOM_MAP_OPTION;
      o.textContent = t('welcome.map.custom');
      mapSelect.append(o);
    }
    for (const m of MAPS) {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = t(m.nameKey);
      mapSelect.append(o);
    }
    mapSelect.value = customMapActive ? CUSTOM_MAP_OPTION : getSelectedMapId();
    mapSelect.addEventListener('change', () => {
      if (mapSelect.value === CUSTOM_MAP_OPTION) return; // already on custom
      const id = mapSelect.value as MapId;
      setSelectedMapId(id);
      opts.onMapChange(id);
    });
    mapLabel.append(mapSelect);

    const restart = document.createElement('button');
    restart.type = 'button';
    restart.textContent = t('chrome.restart');
    restart.addEventListener('click', opts.onRestart);

    const backToEditor = document.createElement('button');
    backToEditor.type = 'button';
    backToEditor.textContent = t('chrome.backToEditor');
    backToEditor.addEventListener('click', opts.onBackToEditor);

    const musicBtn = document.createElement('button');
    musicBtn.type = 'button';
    musicBtn.className = 'music-toggle';
    musicBtn.addEventListener('click', opts.onMusicToggle);
    musicBtnEl = musicBtn;
    refreshMusicBtn();

    const langSelect = document.createElement('select');
    const LANG_OPTIONS: Array<{ value: Locale; label: string }> = [
      { value: 'zh', label: '中文' },
      { value: 'en', label: 'English' },
      { value: 'ja', label: '日本語' },
    ];
    for (const { value, label } of LANG_OPTIONS) {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      langSelect.append(opt);
    }
    langSelect.value = getLocale();
    langSelect.addEventListener('change', () => setLocale(langSelect.value as Locale));

    const backToWelcome = document.createElement('button');
    backToWelcome.type = 'button';
    backToWelcome.textContent = t('chrome.backToWelcome');
    backToWelcome.addEventListener('click', opts.onBackToWelcome);

    controls.append(p2Label, mapLabel, restart);
    if (editingMode) controls.append(backToEditor);
    controls.append(musicBtn, backToWelcome, langSelect);
    controlsEl = controls;
    controls.hidden = replayMode;
    root.append(title, controls);
  };

  render();
  subscribeLocale(render);
  subscribeMap(render);

  return {
    setMusicOn(on: boolean) {
      musicOn = on;
      refreshMusicBtn();
    },
    setReplayMode(on: boolean) {
      replayMode = on;
      if (controlsEl) controlsEl.hidden = on;
    },
    setCustomMapActive(on: boolean) {
      if (customMapActive === on) return;
      customMapActive = on;
      render();
    },
    setEditingMode(on: boolean) {
      if (editingMode === on) return;
      editingMode = on;
      render();
    },
  };
}
