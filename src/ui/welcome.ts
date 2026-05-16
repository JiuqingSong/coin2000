import { subscribeLocale, t, toggleLocale, type StringKey } from '../i18n';
import {
  MAPS,
  getSelectedMapId,
  setSelectedMapId,
  subscribeMap,
  type MapId,
} from '../game/maps';
import { parseSaveFile, SaveFileParseError, type SaveFileErrorReason } from '../replay/load';
import type { SaveFile } from '../replay/types';

export interface WelcomeOptions {
  onStart(): void;
  onSettings(): void;
  onLoadReplay(save: SaveFile): void;
}

export interface WelcomeHandle {
  hide(): void;
}

type ModalKind = 'about' | 'guide' | 'loadError';

interface ModalConfig {
  titleKey: StringKey;
  bodyKey?: StringKey;
  closable: boolean;
  cardClass?: string;
}

const MODAL_CONFIG: Record<Exclude<ModalKind, 'loadError'>, ModalConfig> = {
  about: { titleKey: 'welcome.about.title', bodyKey: 'welcome.about.body', closable: true },
  guide: { titleKey: 'welcome.guide.title', bodyKey: 'welcome.guide.body', closable: true, cardClass: 'guide' },
};

const LOAD_ERROR_BODY_KEY: Record<SaveFileErrorReason, StringKey> = {
  badJson: 'save.error.badJson',
  badShape: 'save.error.badShape',
  wrongApp: 'save.error.wrongApp',
  wrongVersion: 'save.error.wrongVersion',
  badMap: 'save.error.badMap',
  badConfig: 'save.error.badConfig',
  badShots: 'save.error.badShots',
  badResult: 'save.error.badResult',
};

export function mountWelcome(parent: HTMLElement, opts: WelcomeOptions): WelcomeHandle {
  const overlay = document.createElement('div');
  overlay.id = 'welcome-screen';

  const dialog = document.createElement('div');
  dialog.className = 'welcome-dialog';

  const titlebar = document.createElement('div');
  titlebar.className = 'welcome-titlebar';

  const body = document.createElement('div');
  body.className = 'welcome-body';

  const sidebar = document.createElement('aside');
  sidebar.className = 'welcome-sidebar';
  const btnGuide = makeToolButton();
  const btnSettings = makeToolButton();
  const btnAbout = makeToolButton();
  const btnLang = makeToolButton();
  btnLang.classList.add('lang');
  sidebar.append(btnGuide, btnSettings, btnAbout, btnLang);

  const main = document.createElement('div');
  main.className = 'welcome-main';

  const logo = document.createElement('div');
  logo.className = 'welcome-logo';
  logo.innerHTML =
    '<div class="logo-coin">' +
    '<span class="logo-c">C</span><span class="logo-oin">oin</span>' +
    '</div>' +
    '<div class="logo-2000">2000</div>';

  const signature = document.createElement('div');
  signature.className = 'welcome-signature';

  const mapPicker = buildMapPicker();

  const actions = document.createElement('div');
  actions.className = 'welcome-actions';
  const btnStart = makeActionButton(true);
  const btnReplay = makeActionButton(false);
  actions.append(btnStart, btnReplay);

  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = '.json,application/json';
  fileInput.hidden = true;
  fileInput.style.display = 'none';

  main.append(logo, signature, mapPicker.root, actions, fileInput);
  body.append(sidebar, main);

  const footer = document.createElement('div');
  footer.className = 'welcome-footer';

  dialog.append(titlebar, body, footer);
  overlay.append(dialog);
  parent.append(overlay);

  let modal: HTMLElement | null = null;
  let modalTitleEl: HTMLElement | null = null;
  let modalBodyEl: HTMLElement | null = null;
  let modalBackBtn: HTMLButtonElement | null = null;
  let currentModalKind: ModalKind | null = null;
  let currentModalTitleKey: StringKey | null = null;
  let currentModalBodyKey: StringKey | null = null;

  const closeModal = () => {
    if (modal) {
      modal.remove();
      modal = null;
      modalTitleEl = null;
      modalBodyEl = null;
      modalBackBtn = null;
      currentModalKind = null;
      currentModalTitleKey = null;
      currentModalBodyKey = null;
    }
  };

  const openCfgModal = (kind: 'about' | 'guide') => {
    const cfg = MODAL_CONFIG[kind];
    openModal({
      kind,
      titleKey: cfg.titleKey,
      bodyKey: cfg.bodyKey ?? null,
      closable: cfg.closable,
      cardClass: cfg.cardClass,
    });
  };

  const openModal = (m: {
    kind: ModalKind;
    titleKey: StringKey;
    bodyKey: StringKey | null;
    closable: boolean;
    cardClass?: string;
  }) => {
    closeModal();
    currentModalKind = m.kind;
    currentModalTitleKey = m.titleKey;
    currentModalBodyKey = m.bodyKey;
    modal = document.createElement('div');
    modal.className = 'welcome-modal';
    const card = document.createElement('div');
    card.className = 'welcome-modal-card' + (m.cardClass ? ' ' + m.cardClass : '');
    modalTitleEl = document.createElement('h3');
    modalTitleEl.textContent = t(m.titleKey);
    card.append(modalTitleEl);
    if (m.bodyKey) {
      modalBodyEl = document.createElement('p');
      modalBodyEl.textContent = t(m.bodyKey);
      card.append(modalBodyEl);
    }
    if (m.closable) {
      modalBackBtn = document.createElement('button');
      modalBackBtn.type = 'button';
      modalBackBtn.textContent = t('welcome.modal.back');
      modalBackBtn.addEventListener('click', closeModal);
      card.append(modalBackBtn);
    }
    modal.append(card);
    dialog.append(modal);
  };

  const applyLocale = () => {
    titlebar.innerHTML = t('welcome.titlebar');
    btnGuide.textContent = t('welcome.tool.guide');
    btnSettings.textContent = t('welcome.tool.settings');
    btnAbout.textContent = t('welcome.tool.about');
    btnLang.textContent = t('welcome.tool.lang');
    signature.textContent = t('welcome.signature');
    btnStart.textContent = t('welcome.action.start');
    btnReplay.textContent = t('welcome.action.replay');
    footer.textContent = t('welcome.footer');
    mapPicker.refresh();

    if (currentModalKind && currentModalTitleKey) {
      if (modalTitleEl) modalTitleEl.textContent = t(currentModalTitleKey);
      if (modalBodyEl && currentModalBodyKey) modalBodyEl.textContent = t(currentModalBodyKey);
      if (modalBackBtn) modalBackBtn.textContent = t('welcome.modal.back');
    }
  };

  applyLocale();
  const unsubscribeLocale = subscribeLocale(applyLocale);
  const unsubscribeMap = subscribeMap(() => mapPicker.refresh());

  btnStart.addEventListener('click', () => opts.onStart());
  btnSettings.addEventListener('click', () => opts.onSettings());
  btnAbout.addEventListener('click', () => openCfgModal('about'));
  btnGuide.addEventListener('click', () => openCfgModal('guide'));
  btnLang.addEventListener('click', toggleLocale);

  btnReplay.addEventListener('click', () => fileInput.click());
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    fileInput.value = '';
    if (!file) return;
    let saveFile: SaveFile;
    try {
      const text = await file.text();
      saveFile = parseSaveFile(text);
    } catch (err) {
      const reason: SaveFileErrorReason =
        err instanceof SaveFileParseError ? err.reason : 'badJson';
      openModal({
        kind: 'loadError',
        titleKey: 'save.error.title',
        bodyKey: LOAD_ERROR_BODY_KEY[reason],
        closable: true,
      });
      return;
    }
    opts.onLoadReplay(saveFile);
  });

  return {
    hide() {
      unsubscribeLocale();
      unsubscribeMap();
      overlay.remove();
    },
  };
}

interface MapPicker {
  root: HTMLElement;
  refresh(): void;
}

function buildMapPicker(): MapPicker {
  const root = document.createElement('div');
  root.className = 'welcome-maps';

  const heading = document.createElement('div');
  heading.className = 'welcome-maps-heading';
  root.append(heading);

  const grid = document.createElement('div');
  grid.className = 'welcome-maps-grid';
  root.append(grid);

  const desc = document.createElement('div');
  desc.className = 'welcome-maps-desc';
  root.append(desc);

  const buttons: Array<{ id: MapId; btn: HTMLButtonElement }> = [];
  for (const m of MAPS) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'welcome-map-btn';
    btn.dataset.mapId = m.id;
    btn.addEventListener('click', () => setSelectedMapId(m.id));
    grid.append(btn);
    buttons.push({ id: m.id, btn });
  }

  const refresh = () => {
    heading.textContent = t('welcome.map.heading');
    const current = getSelectedMapId();
    for (const { id, btn } of buttons) {
      const def = MAPS.find((m) => m.id === id)!;
      btn.textContent = t(def.nameKey);
      btn.classList.toggle('selected', id === current);
    }
    const currentDef = MAPS.find((m) => m.id === current);
    desc.textContent = currentDef ? t(currentDef.descKey) : '';
  };
  refresh();

  return { root, refresh };
}

function makeToolButton(): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'welcome-tool';
  return b;
}

function makeActionButton(primary: boolean): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'welcome-action' + (primary ? ' primary' : '');
  return b;
}
