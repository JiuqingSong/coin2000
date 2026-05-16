import { tArray, type ArrayKey } from '../i18n';

export type ReactionCategory =
  | 'humanAiming'
  | 'humanKilledOwn'
  | 'humanKilledEnemy'
  | 'humanNothing'
  | 'aiThinking'
  | 'aiShooting'
  | 'aiKilledP1'
  | 'aiTestShot';

const KEY_BY_CATEGORY: Record<ReactionCategory, ArrayKey> = {
  humanAiming: 'reactions.humanAiming',
  humanKilledOwn: 'reactions.humanKilledOwn',
  humanKilledEnemy: 'reactions.humanKilledEnemy',
  humanNothing: 'reactions.humanNothing',
  aiThinking: 'reactions.aiThinking',
  aiShooting: 'reactions.aiShooting',
  aiKilledP1: 'reactions.aiKilledP1',
  aiTestShot: 'reactions.aiTestShot',
};

export interface ReactionsHandle {
  show(category: ReactionCategory): void;
  clear(): void;
}

export function mountReactions(root: HTMLElement): ReactionsHandle {
  let last = '';
  let fadeTimer: ReturnType<typeof setTimeout> | null = null;

  const set = (text: string) => {
    if (text === last) return;
    last = text;
    if (fadeTimer !== null) clearTimeout(fadeTimer);
    root.classList.add('fading');
    fadeTimer = setTimeout(() => {
      root.textContent = text;
      root.classList.remove('fading');
      fadeTimer = null;
    }, 180);
  };

  return {
    show(category: ReactionCategory) {
      const pool = tArray(KEY_BY_CATEGORY[category]);
      const text = pool[Math.floor(Math.random() * pool.length)] ?? '';
      set(text);
    },
    clear() {
      set('');
    },
  };
}
