export type P2Mode = 'ai' | 'human';

export interface ChromeOptions {
  initialP2Mode: P2Mode;
  onP2ModeChange(mode: P2Mode): void;
  onRestart(): void;
}

export function mountChrome(root: HTMLElement, opts: ChromeOptions): void {
  root.replaceChildren();

  const title = document.createElement('div');
  title.className = 'title';
  title.textContent = 'COIN 2000 · 弹硬币';

  const controls = document.createElement('div');
  controls.className = 'controls';

  const p2Label = document.createElement('label');
  p2Label.append('对手');

  const select = document.createElement('select');
  const optAi = document.createElement('option');
  optAi.value = 'ai';
  optAi.textContent = '电脑';
  const optHuman = document.createElement('option');
  optHuman.value = 'human';
  optHuman.textContent = '玩家';
  select.append(optAi, optHuman);
  select.value = opts.initialP2Mode;
  select.addEventListener('change', () => {
    opts.onP2ModeChange(select.value as P2Mode);
  });
  p2Label.append(select);

  const restart = document.createElement('button');
  restart.type = 'button';
  restart.textContent = '重新开始';
  restart.addEventListener('click', opts.onRestart);

  controls.append(p2Label, restart);
  root.append(title, controls);
}
