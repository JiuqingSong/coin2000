export interface WelcomeOptions {
  onStart(): void;
  onSettings(): void;
}

export interface WelcomeHandle {
  hide(): void;
}

export function mountWelcome(parent: HTMLElement, opts: WelcomeOptions): WelcomeHandle {
  const overlay = document.createElement('div');
  overlay.id = 'welcome-screen';

  const dialog = document.createElement('div');
  dialog.className = 'welcome-dialog';

  const titlebar = document.createElement('div');
  titlebar.className = 'welcome-titlebar';
  titlebar.innerHTML = 'Song Studio<sup>®</sup> 系列产品';

  const body = document.createElement('div');
  body.className = 'welcome-body';

  const sidebar = document.createElement('aside');
  sidebar.className = 'welcome-sidebar';
  const btnQuit = makeToolButton('结束');
  const btnSettings = makeToolButton('设置');
  const btnAbout = makeToolButton('关于');
  sidebar.append(btnQuit, btnSettings, btnAbout);

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
  signature.textContent = '作者: Songthin';

  const actions = document.createElement('div');
  actions.className = 'welcome-actions';
  const btnStart = makeActionButton('开始', true);
  const btnReplay = makeActionButton('放录相', false);
  actions.append(btnStart, btnReplay);

  main.append(logo, signature, actions);
  body.append(sidebar, main);

  const footer = document.createElement('div');
  footer.className = 'welcome-footer';
  footer.textContent = '本游戏完全免费，欢迎拷贝。 2000年10月 V2.61';

  dialog.append(titlebar, body, footer);
  overlay.append(dialog);
  parent.append(overlay);

  let modal: HTMLElement | null = null;

  const closeModal = () => {
    if (modal) {
      modal.remove();
      modal = null;
    }
  };

  const openModal = (title: string, message: string, closable: boolean) => {
    closeModal();
    modal = document.createElement('div');
    modal.className = 'welcome-modal';
    const card = document.createElement('div');
    card.className = 'welcome-modal-card';
    const h = document.createElement('h3');
    h.textContent = title;
    const p = document.createElement('p');
    p.textContent = message;
    card.append(h, p);
    if (closable) {
      const back = document.createElement('button');
      back.type = 'button';
      back.textContent = '返回';
      back.addEventListener('click', closeModal);
      card.append(back);
    }
    modal.append(card);
    dialog.append(modal);
  };

  btnStart.addEventListener('click', () => opts.onStart());
  btnSettings.addEventListener('click', () => opts.onSettings());
  btnAbout.addEventListener('click', () => {
    openModal(
      '关于',
      'COIN 2000  版本 2.61\n作者: Songthin\n版权所有 © 1995-2000 Song Studio\n\n浏览器移植版 · 2026',
      true,
    );
  });
  btnReplay.addEventListener('click', () => {
    openModal('放录相', '暂未实现。', true);
  });
  btnQuit.addEventListener('click', () => {
    openModal('感谢游玩', '感谢游玩 COIN 2000。\n请关闭此标签页。', false);
  });

  return {
    hide() {
      overlay.remove();
    },
  };
}

function makeToolButton(text: string): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'welcome-tool';
  b.textContent = text;
  return b;
}

function makeActionButton(text: string, primary: boolean): HTMLButtonElement {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'welcome-action' + (primary ? ' primary' : '');
  b.textContent = text;
  return b;
}
