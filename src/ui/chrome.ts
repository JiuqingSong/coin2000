import { subscribeLocale, t, toggleLocale } from '../i18n';
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
  onP2ModeChange(mode: P2Mode): void;
  onMapChange(mapId: MapId): void;
  onRestart(): void;
}

export function mountChrome(root: HTMLElement, opts: ChromeOptions): void {
  let p2Mode = opts.initialP2Mode;

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
    for (const m of MAPS) {
      const o = document.createElement('option');
      o.value = m.id;
      o.textContent = t(m.nameKey);
      mapSelect.append(o);
    }
    mapSelect.value = getSelectedMapId();
    mapSelect.addEventListener('change', () => {
      const id = mapSelect.value as MapId;
      setSelectedMapId(id);
      opts.onMapChange(id);
    });
    mapLabel.append(mapSelect);

    const restart = document.createElement('button');
    restart.type = 'button';
    restart.textContent = t('chrome.restart');
    restart.addEventListener('click', opts.onRestart);

    const langBtn = document.createElement('button');
    langBtn.type = 'button';
    langBtn.className = 'lang-toggle';
    langBtn.textContent = t('chrome.lang.toggle');
    langBtn.title = t('chrome.lang.toggle.title');
    langBtn.setAttribute('aria-label', t('chrome.lang.toggle.title'));
    langBtn.addEventListener('click', toggleLocale);

    controls.append(p2Label, mapLabel, restart, langBtn);
    root.append(title, controls);
  };

  render();
  subscribeLocale(render);
  subscribeMap(render);
}
