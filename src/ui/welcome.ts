import { subscribeLocale, t, toggleLocale } from '../i18n';
import {
  MAPS,
  getSelectedMapId,
  setSelectedMapId,
  subscribeMap,
  type MapId,
} from '../game/maps';

export interface WelcomeOptions {
  onStart(): void;
  onSettings(): void;
}

export interface WelcomeHandle {
  hide(): void;
}

type ModalKind = 'about' | 'replay' | 'guide';

const MODAL_CONFIG: Record<ModalKind, { titleKey: 'welcome.about.title' | 'welcome.replay.title' | 'welcome.guide.title'; bodyKey: 'welcome.about.body' | 'welcome.replay.body' | 'welcome.guide.body'; closable: boolean; cardClass?: string }> = {
  about: { titleKey: 'welcome.about.title', bodyKey: 'welcome.about.body', closable: true },
  replay: { titleKey: 'welcome.replay.title', bodyKey: 'welcome.replay.body', closable: true },
  guide: { titleKey: 'welcome.guide.title', bodyKey: 'welcome.guide.body', closable: true, cardClass: 'guide' },
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

  main.append(logo, signature, mapPicker.root, actions);
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

  const closeModal = () => {
    if (modal) {
      modal.remove();
      modal = null;
      modalTitleEl = null;
      modalBodyEl = null;
      modalBackBtn = null;
      currentModalKind = null;
    }
  };

  const openModal = (kind: ModalKind) => {
    closeModal();
    currentModalKind = kind;
    const cfg = MODAL_CONFIG[kind];
    modal = document.createElement('div');
    modal.className = 'welcome-modal';
    const card = document.createElement('div');
    card.className = 'welcome-modal-card' + (cfg.cardClass ? ' ' + cfg.cardClass : '');
    modalTitleEl = document.createElement('h3');
    modalTitleEl.textContent = t(cfg.titleKey);
    modalBodyEl = document.createElement('p');
    modalBodyEl.textContent = t(cfg.bodyKey);
    card.append(modalTitleEl, modalBodyEl);
    if (cfg.closable) {
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

    if (currentModalKind) {
      const cfg = MODAL_CONFIG[currentModalKind];
      if (modalTitleEl) modalTitleEl.textContent = t(cfg.titleKey);
      if (modalBodyEl) modalBodyEl.textContent = t(cfg.bodyKey);
      if (modalBackBtn) modalBackBtn.textContent = t('welcome.modal.back');
    }
  };

  applyLocale();
  const unsubscribeLocale = subscribeLocale(applyLocale);
  const unsubscribeMap = subscribeMap(() => mapPicker.refresh());

  btnStart.addEventListener('click', () => opts.onStart());
  btnSettings.addEventListener('click', () => opts.onSettings());
  btnAbout.addEventListener('click', () => openModal('about'));
  btnReplay.addEventListener('click', () => openModal('replay'));
  btnGuide.addEventListener('click', () => openModal('guide'));
  btnLang.addEventListener('click', toggleLocale);

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
