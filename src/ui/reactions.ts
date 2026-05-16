export type ReactionCategory =
  | 'humanAiming'
  | 'humanKilledOwn'
  | 'humanKilledEnemy'
  | 'humanNothing'
  | 'aiThinking'
  | 'aiShooting'
  | 'aiKilledP1'
  | 'aiTestShot';

const POOLS: Record<ReactionCategory, readonly string[]> = {
  humanAiming: [
    '和谁碰撞，你的观点呢？',
    '千万不能想当然！',
    '一定要老老实实地，受力分析！',
  ],
  humanKilledOwn: [
    '你受力分析了吗？',
    '简直就像"瞎驴撞槽"一样！',
    '明天把改错交上来。',
  ],
  humanNothing: [
    '你，喝了！',
    '你的观点，错！',
    '又想当然了。',
    '早觉悟，晚觉悟，早晚得觉悟。',
    '你不如用柯西不等式试试哦！',
    '绕圈圈，圈圈绕。',
  ],
  humanKilledEnemy: [
    '告诉你，你的观点，完全正确！',
    '唉，太好了，我就等你这么弹了。',
    'Oh, My Goodness！草菅人命！',
    '是啊，打着了，是啊。',
    '足球是城市文明，钢板是教室文明。',
  ],
  aiThinking: [
    '等我再考虑考虑……',
    '抱歉，我有点事，稍等一下。',
    '你先读读课文，我出去一下……',
    '左想五秒，停两秒，右想五秒，停两秒。',
  ],
  aiShooting: [
    '我觉得呢，应该这样弹！',
    '瞬那间，弹掉你。',
    '正步走，一步两动！',
    '马上就让你的钢板，分道扬镳。',
    '我弹的最好的一次是下一次。',
  ],
  aiTestShot: [
    '这只不过是要试试你的神经弹性。',
    '我觉得，咱们同学就应该具有这种心理"素质"。',
    '这也就是逗愣逗愣你。',
  ],
  aiKilledP1: [
    '你，又上当了！',
    '你一定要明白我的意图。',
    '我的钢板，它就是一个好圆！',
    '我弹的这一下，有特色！',
  ],
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
      const pool = POOLS[category];
      const text = pool[Math.floor(Math.random() * pool.length)] ?? '';
      set(text);
    },
    clear() {
      set('');
    },
  };
}
