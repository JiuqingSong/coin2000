export type Locale = 'zh' | 'en' | 'ja';

const LOCALE_CYCLE: readonly Locale[] = ['zh', 'en', 'ja'];

const STORAGE_KEY = 'coin2000.locale.v1';

type Listener = (locale: Locale) => void;
const listeners = new Set<Listener>();

let currentLocale: Locale = detectInitial();

function detectInitial(): Locale {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'zh' || stored === 'en' || stored === 'ja') return stored;
  } catch {
    // ignore
  }
  const nav =
    typeof navigator !== 'undefined' && typeof navigator.language === 'string'
      ? navigator.language.toLowerCase()
      : '';
  if (nav.startsWith('zh')) return 'zh';
  if (nav.startsWith('ja')) return 'ja';
  return 'en';
}

export function getLocale(): Locale {
  return currentLocale;
}

export function setLocale(next: Locale): void {
  if (next === currentLocale) return;
  currentLocale = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    // ignore
  }
  applyDocumentLocale();
  listeners.forEach((fn) => fn(next));
}

export function toggleLocale(): void {
  const idx = LOCALE_CYCLE.indexOf(currentLocale);
  const next = LOCALE_CYCLE[(idx + 1) % LOCALE_CYCLE.length]!;
  setLocale(next);
}

export function subscribeLocale(fn: Listener): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

export function applyDocumentLocale(): void {
  if (typeof document === 'undefined') return;
  document.documentElement.lang =
    currentLocale === 'zh' ? 'zh-CN' : currentLocale === 'ja' ? 'ja' : 'en';
  document.title = t('app.title');
}

export function t(key: StringKey): string {
  return STRINGS[currentLocale][key] ?? STRINGS.zh[key] ?? key;
}

export function tArray(key: ArrayKey): readonly string[] {
  return ARRAYS[currentLocale][key] ?? ARRAYS.zh[key] ?? [];
}

// ---------------------------------------------------------------------------
// String tables
// ---------------------------------------------------------------------------

type StringDict = Record<StringKey, string>;
type ArrayDict = Record<ArrayKey, readonly string[]>;

const ZH_STRINGS = {
  'app.title': 'COIN 2000 · 弹硬币',

  // chrome (top bar)
  'chrome.opponent': '对手',
  'chrome.p2.ai': '电脑',
  'chrome.p2.human': '玩家',
  'chrome.map': '地图',
  'chrome.restart': '重新开始',
  'chrome.music.on': '♪ 音乐',
  'chrome.music.off': '🔇 音乐',
  'chrome.music.title.on': '关闭背景音乐',
  'chrome.music.title.off': '开启背景音乐',
  'chrome.lang.toggle': 'EN',
  'chrome.lang.toggle.title': 'Switch to English',

  // welcome screen
  'welcome.titlebar': 'Song Studio<sup>®</sup> 系列产品',
  'welcome.tool.quit': '结束',
  'welcome.tool.settings': '设置',
  'welcome.tool.about': '关于',
  'welcome.tool.lang': 'EN',
  'welcome.signature': '作者: Songthin',
  'welcome.action.start': '开始',
  'welcome.action.replay': '放录相',
  'welcome.map.heading': '地图',
  'welcome.footer': '本游戏完全免费，欢迎拷贝。 2000年10月 V2.61',
  'welcome.modal.back': '返回',
  'welcome.about.title': '关于',
  'welcome.about.body':
    'COIN 2000  版本 2.61\n作者: Songthin\n版权所有 © 1995-2000 Song Studio\n\n浏览器移植版 · 2026',
  'welcome.replay.title': '放录相',
  'welcome.replay.body': '暂未实现。',
  'welcome.quit.title': '感谢游玩',
  'welcome.quit.body': '感谢游玩 COIN 2000。\n请关闭此标签页。',

  // HUD
  'hud.count.p1': '玩家',
  'hud.count.p2.ai': '电脑',
  'hud.count.p2.human': '对手',
  'hud.playAgain': '再来一局',
  'hud.winner.draw': '平局',
  'hud.winner.p1': '您获胜',
  'hud.winner.p2.ai': '电脑获胜',
  'hud.winner.p2.human': '对手获胜',
  'hud.pill.idle': '准备中',
  'hud.pill.p1Turn': '您的回合',
  'hud.pill.aiTurn': '电脑回合',
  'hud.pill.humanTurn': '对手回合',
  'hud.pill.simulating': '运动中…',
  'hud.pill.roundEnd': '本局结束',
  'hud.status.p1Aim': '拖动您的硬币瞄准，松开发射。',
  'hud.status.aiThinking': '电脑思考中……',
  'hud.status.humanAim': '拖动对手的硬币瞄准，松开发射。',
  'hud.status.simulating': '硬币运动中。',
  'hud.status.roundEnd': '本局结束。',

  // config dialog
  'config.title': '设置',
  'config.section.colors': '颜色',
  'config.label.p1Color': '玩家硬币',
  'config.label.p2Color': '电脑硬币',
  'config.section.coins': '硬币',
  'config.label.coinsPerSide': '每方硬币数',
  'config.label.coinRadius': '硬币半径',
  'config.label.coinMass': '硬币质量',
  'config.section.gameplay': '游戏',
  'config.label.maxShotSpeed': '最大速度',
  'config.label.aiDifficulty': '游戏难度',
  'config.label.keepShotOnKill': '杀敌续弹',
  'config.section.pieces': '棋子与炸弹',
  'config.label.stoneCount': '棋子数',
  'config.label.bombCount': '炸弹数',
  'config.label.explosionRadius': '爆破半径',
  'config.label.chainBombs': '连锁爆破',
  'config.label.misfireProtection': '不会被误炸',
  'config.section.other': '其它',
  'config.label.sound': '声音提示',
  'config.btn.ok': '确定',
  'config.btn.cancel': '取消',
  'config.btn.reset': '恢复默认',

  // maps
  'map.classic.name': '经典',
  'map.classic.desc': '硬币分列两侧，棋子在中间；上下出界即死。',
  'map.allSides.name': '四面悬崖',
  'map.allSides.desc': '四面都是悬崖，碰边即出局，谨慎下手。',
  'map.fortified.name': '壁垒',
  'map.fortified.desc': '棋子分列两军阵前作为屏障，攻防皆难。',
  'map.crossed.name': '换边',
  'map.crossed.desc': '硬币排在上下两边，左右成为悬崖。',
} as const;

const EN_STRINGS: Record<keyof typeof ZH_STRINGS, string> = {
  'app.title': 'COIN 2000 · Coin Flick',

  // chrome (top bar)
  'chrome.opponent': 'Opponent',
  'chrome.p2.ai': 'Computer',
  'chrome.p2.human': 'Human',
  'chrome.map': 'Map',
  'chrome.restart': 'Restart',
  'chrome.music.on': '♪ Music',
  'chrome.music.off': '🔇 Music',
  'chrome.music.title.on': 'Turn music off',
  'chrome.music.title.off': 'Turn music on',
  'chrome.lang.toggle': '日',
  'chrome.lang.toggle.title': '日本語に切り替え',

  // welcome screen
  'welcome.titlebar': 'A Song Studio<sup>®</sup> Production',
  'welcome.tool.quit': 'Quit',
  'welcome.tool.settings': 'Settings',
  'welcome.tool.about': 'About',
  'welcome.tool.lang': '日',
  'welcome.signature': 'By Songthin',
  'welcome.action.start': 'Start',
  'welcome.action.replay': 'Replay',
  'welcome.map.heading': 'Map',
  'welcome.footer': 'Freeware — please share. October 2000, V2.61',
  'welcome.modal.back': 'Back',
  'welcome.about.title': 'About',
  'welcome.about.body':
    'COIN 2000  Version 2.61\nBy Songthin\nCopyright © 1995-2000 Song Studio\n\nBrowser port · 2026',
  'welcome.replay.title': 'Replay',
  'welcome.replay.body': 'Not implemented yet.',
  'welcome.quit.title': 'Thanks for Playing',
  'welcome.quit.body': 'Thanks for playing COIN 2000.\nPlease close this tab.',

  // HUD
  'hud.count.p1': 'You',
  'hud.count.p2.ai': 'CPU',
  'hud.count.p2.human': 'P2',
  'hud.playAgain': 'Play Again',
  'hud.winner.draw': 'Draw',
  'hud.winner.p1': 'You Win',
  'hud.winner.p2.ai': 'Computer Wins',
  'hud.winner.p2.human': 'Opponent Wins',
  'hud.pill.idle': 'Getting ready',
  'hud.pill.p1Turn': 'Your turn',
  'hud.pill.aiTurn': "Computer's turn",
  'hud.pill.humanTurn': "Opponent's turn",
  'hud.pill.simulating': 'In motion…',
  'hud.pill.roundEnd': 'Round over',
  'hud.status.p1Aim': 'Drag your coin to aim, release to shoot.',
  'hud.status.aiThinking': 'Computer is thinking…',
  'hud.status.humanAim': "Drag the opponent's coin to aim, release to shoot.",
  'hud.status.simulating': 'Coins in motion.',
  'hud.status.roundEnd': 'Round over.',

  // config dialog
  'config.title': 'Settings',
  'config.section.colors': 'Colors',
  'config.label.p1Color': 'Player coin',
  'config.label.p2Color': 'Computer coin',
  'config.section.coins': 'Coins',
  'config.label.coinsPerSide': 'Coins per side',
  'config.label.coinRadius': 'Coin radius',
  'config.label.coinMass': 'Coin mass',
  'config.section.gameplay': 'Gameplay',
  'config.label.maxShotSpeed': 'Max shot speed',
  'config.label.aiDifficulty': 'AI difficulty',
  'config.label.keepShotOnKill': 'Keep turn on kill',
  'config.section.pieces': 'Stones & bombs',
  'config.label.stoneCount': 'Stone count',
  'config.label.bombCount': 'Bomb count',
  'config.label.explosionRadius': 'Explosion radius',
  'config.label.chainBombs': 'Chain explosions',
  'config.label.misfireProtection': 'Misfire protection',
  'config.section.other': 'Other',
  'config.label.sound': 'Sound effects',
  'config.btn.ok': 'OK',
  'config.btn.cancel': 'Cancel',
  'config.btn.reset': 'Reset to defaults',

  // maps
  'map.classic.name': 'Classic',
  'map.classic.desc': 'Coins line each side, stones in the middle; top and bottom edges kill.',
  'map.allSides.name': 'Cliff Edges',
  'map.allSides.desc': 'All four edges kill — careless shots launch your own coins off the side.',
  'map.fortified.name': 'Fortified',
  'map.fortified.desc': 'Stones flank each player as a defensive barrier instead of sitting in the center.',
  'map.crossed.name': 'Crossed',
  'map.crossed.desc': "Coins line the top and bottom; the left and right edges become the kill zone.",
};

const JA_STRINGS: Record<keyof typeof ZH_STRINGS, string> = {
  'app.title': 'COIN 2000 · コイン弾き',

  // chrome (top bar)
  'chrome.opponent': '対戦相手',
  'chrome.p2.ai': 'コンピュータ',
  'chrome.p2.human': '対戦',
  'chrome.map': 'マップ',
  'chrome.restart': '再スタート',
  'chrome.music.on': '♪ 音楽',
  'chrome.music.off': '🔇 音楽',
  'chrome.music.title.on': 'BGMをオフ',
  'chrome.music.title.off': 'BGMをオン',
  'chrome.lang.toggle': '中',
  'chrome.lang.toggle.title': '切换到中文',

  // welcome screen
  'welcome.titlebar': 'Song Studio<sup>®</sup> シリーズ',
  'welcome.tool.quit': '終了',
  'welcome.tool.settings': '設定',
  'welcome.tool.about': '情報',
  'welcome.tool.lang': '中',
  'welcome.signature': '作者: Songthin',
  'welcome.action.start': '開始',
  'welcome.action.replay': 'リプレイ',
  'welcome.map.heading': 'マップ',
  'welcome.footer': 'フリーソフトウェア、配布歓迎。 2000年10月 V2.61',
  'welcome.modal.back': '戻る',
  'welcome.about.title': '情報',
  'welcome.about.body':
    'COIN 2000  バージョン 2.61\n作者: Songthin\nCopyright © 1995-2000 Song Studio\n\nブラウザ移植版 · 2026',
  'welcome.replay.title': 'リプレイ',
  'welcome.replay.body': '未実装です。',
  'welcome.quit.title': 'ご利用ありがとうございました',
  'welcome.quit.body': 'COIN 2000で遊んでくれてありがとう。\nこのタブを閉じてください。',

  // HUD
  'hud.count.p1': 'あなた',
  'hud.count.p2.ai': 'CPU',
  'hud.count.p2.human': 'P2',
  'hud.playAgain': 'もう一度',
  'hud.winner.draw': '引き分け',
  'hud.winner.p1': 'あなたの勝ち',
  'hud.winner.p2.ai': 'コンピュータの勝ち',
  'hud.winner.p2.human': '対戦相手の勝ち',
  'hud.pill.idle': '準備中',
  'hud.pill.p1Turn': 'あなたの番',
  'hud.pill.aiTurn': 'コンピュータの番',
  'hud.pill.humanTurn': '対戦相手の番',
  'hud.pill.simulating': '移動中…',
  'hud.pill.roundEnd': 'ラウンド終了',
  'hud.status.p1Aim': 'コインをドラッグして狙い、離して発射。',
  'hud.status.aiThinking': 'コンピュータが考え中……',
  'hud.status.humanAim': '対戦相手のコインをドラッグして狙い、離して発射。',
  'hud.status.simulating': 'コインが移動中。',
  'hud.status.roundEnd': 'ラウンド終了。',

  // config dialog
  'config.title': '設定',
  'config.section.colors': '色',
  'config.label.p1Color': 'プレイヤーのコイン',
  'config.label.p2Color': 'コンピュータのコイン',
  'config.section.coins': 'コイン',
  'config.label.coinsPerSide': '各サイドのコイン数',
  'config.label.coinRadius': 'コイン半径',
  'config.label.coinMass': 'コイン質量',
  'config.section.gameplay': 'ゲームプレイ',
  'config.label.maxShotSpeed': '最大ショット速度',
  'config.label.aiDifficulty': 'AI 難易度',
  'config.label.keepShotOnKill': '撃破でターン継続',
  'config.section.pieces': '石と爆弾',
  'config.label.stoneCount': '石の数',
  'config.label.bombCount': '爆弾の数',
  'config.label.explosionRadius': '爆発半径',
  'config.label.chainBombs': '連鎖爆発',
  'config.label.misfireProtection': '誤爆防止',
  'config.section.other': 'その他',
  'config.label.sound': '効果音',
  'config.btn.ok': 'OK',
  'config.btn.cancel': 'キャンセル',
  'config.btn.reset': '既定値に戻す',

  // maps
  'map.classic.name': 'クラシック',
  'map.classic.desc': 'コインは両サイド、石は中央。上下が崖。',
  'map.allSides.name': '四方の崖',
  'map.allSides.desc': '四方すべてが崖。自分のコインまで飛ばさないよう慎重に。',
  'map.fortified.name': '防壁',
  'map.fortified.desc': '石が各陣営の前に防壁として並ぶ。攻めも守りも難しい。',
  'map.crossed.name': '縦戦',
  'map.crossed.desc': 'コインは上下に並び、左右が崖になる。',
};

export type StringKey = keyof typeof ZH_STRINGS;

const STRINGS: Record<Locale, StringDict> = {
  zh: ZH_STRINGS,
  en: EN_STRINGS,
  ja: JA_STRINGS,
};

// ---------------------------------------------------------------------------
// Array tables (banter + reactions)
// ---------------------------------------------------------------------------

const ZH_ARRAYS = {
  'banter.p1': [
    '酷毙了，您消灭了电脑的全部硬币，获得最终胜利！',
    '您赢了，算您厉害，今天就先放过电脑。',
    '电脑已经输光了，您还真是厉害，服了。',
    '完胜！来日方长。',
  ],
  'banter.p2': [
    '您已经没有硬币了。胜败乃兵家常事，来日方长。',
    '您已经输光了。还要努力啊！',
    '没办法，谁让电脑这么厉害呢。',
    '明天把改错交上来。',
  ],
  'banter.draw': [
    '两败俱伤。',
    '桌上无人生还。',
    '平局——两边都打光了。',
  ],

  'reactions.humanAiming': [
    '和谁碰撞，你的观点呢？',
    '千万不能想当然！',
    '一定要老老实实地，受力分析！',
  ],
  'reactions.humanKilledOwn': [
    '你受力分析了吗？',
    '简直就像"瞎驴撞槽"一样！',
    '明天把改错交上来。',
  ],
  'reactions.humanNothing': [
    '你，喝了！',
    '你的观点，错！',
    '又想当然了。',
    '早觉悟，晚觉悟，早晚得觉悟。',
    '你不如用柯西不等式试试哦！',
    '绕圈圈，圈圈绕。',
  ],
  'reactions.humanKilledEnemy': [
    '告诉你，你的观点，完全正确！',
    '唉，太好了，我就等你这么弹了。',
    'Oh, My Goodness！草菅人命！',
    '是啊，打着了，是啊。',
    '足球是城市文明，钢板是教室文明。',
  ],
  'reactions.aiThinking': [
    '等我再考虑考虑……',
    '抱歉，我有点事，稍等一下。',
    '你先读读课文，我出去一下……',
    '左想五秒，停两秒，右想五秒，停两秒。',
  ],
  'reactions.aiShooting': [
    '我觉得呢，应该这样弹！',
    '瞬那间，弹掉你。',
    '正步走，一步两动！',
    '马上就让你的钢板，分道扬镳。',
    '我弹的最好的一次是下一次。',
  ],
  'reactions.aiTestShot': [
    '这只不过是要试试你的神经弹性。',
    '我觉得，咱们同学就应该具有这种心理"素质"。',
    '这也就是逗愣逗愣你。',
  ],
  'reactions.aiKilledP1': [
    '你，又上当了！',
    '你一定要明白我的意图。',
    '我的钢板，它就是一个好圆！',
    '我弹的这一下，有特色！',
  ],
} as const;

const EN_ARRAYS: Record<keyof typeof ZH_ARRAYS, readonly string[]> = {
  'banter.p1': [
    'Brilliant! You wiped out every last coin — total victory!',
    'You won. Fine, the computer will let you off the hook today.',
    'The computer is cleaned out. You really are something.',
    'A complete win. Until next time.',
  ],
  'banter.p2': [
    'Out of coins. Win some, lose some — there is always next time.',
    'Wiped out. Try harder next round!',
    'What can you do — the computer is just that good.',
    'Hand in your corrections tomorrow.',
  ],
  'banter.draw': [
    'Mutual destruction.',
    'No survivors on the table.',
    'A draw — both sides cleared out.',
  ],

  'reactions.humanAiming': [
    'Who is it going to hit? What is your read?',
    'Do not just guess — think it through!',
    'Run an honest force analysis!',
  ],
  'reactions.humanKilledOwn': [
    'Did you actually do the force analysis?',
    'Like a bull in a china shop!',
    'Hand in your correction tomorrow.',
  ],
  'reactions.humanNothing': [
    'You whiffed!',
    'Your read — wrong!',
    'Guessing again, are we?',
    'Sooner or later, you will have to learn.',
    'Maybe try a real strategy this time!',
    'Round and round it goes.',
  ],
  'reactions.humanKilledEnemy': [
    'Told you — your read was spot on!',
    'Yes! That is exactly the shot I was waiting for.',
    'Oh, my goodness — ruthless!',
    'Got one! Got one!',
    'Football is for the streets; coins are for the classroom.',
  ],
  'reactions.aiThinking': [
    'Let me think this over…',
    'Sorry, just give me a moment…',
    'Read the textbook while I step out for a sec…',
    'Think left five seconds, pause two; think right five seconds, pause two.',
  ],
  'reactions.aiShooting': [
    'I think this is the shot!',
    'In an instant, you are gone.',
    'Forward march — one step, two moves!',
    'Watch your coins go their separate ways.',
    'My best shot is always the next one.',
  ],
  'reactions.aiTestShot': [
    'Just testing your nerves.',
    'A good student needs this kind of mental fortitude.',
    'Just messing with you.',
  ],
  'reactions.aiKilledP1': [
    'You fell for it again!',
    'You really need to understand my intentions.',
    'My coins are perfectly round!',
    'That shot had character!',
  ],
};

const JA_ARRAYS: Record<keyof typeof ZH_ARRAYS, readonly string[]> = {
  'banter.p1': [
    'お見事！コインを全滅させて完全勝利！',
    'あなたの勝ち。今日はコンピュータが大目に見てやろう。',
    'コンピュータは全滅。本当にやりますね。',
    '完勝！またね。',
  ],
  'banter.p2': [
    'コインが尽きた。勝ち負けは世の常、次があるさ。',
    '全滅。次のラウンドはもっと頑張れ！',
    '仕方ない、コンピュータが強すぎるんだ。',
    '明日、答え直しを提出するように。',
  ],
  'banter.draw': [
    '相打ち。',
    '盤上に生存者なし。',
    '引き分け——両者全滅。',
  ],

  'reactions.humanAiming': [
    'どこに当たる？君の読みは？',
    '当てずっぽうはダメ、よく考えて！',
    'ちゃんと力の解析をしなさい！',
  ],
  'reactions.humanKilledOwn': [
    '力の解析、ちゃんとやった？',
    'まるで暴れ牛だな！',
    '明日、答え直しを提出するように。',
  ],
  'reactions.humanNothing': [
    '空振り！',
    '君の読み、間違い！',
    'また当てずっぽうか？',
    '遅かれ早かれ、いずれ気づくよ。',
    'たまにはちゃんと戦略を立てたら？',
    'グルグル回るばかり。',
  ],
  'reactions.humanKilledEnemy': [
    'ほら、君の読みは大当たり！',
    'よし！そのショットを待ってた！',
    'おやおや、容赦ない！',
    '当たった！当たった！',
    'サッカーは街角の文化、コインは教室の文化。',
  ],
  'reactions.aiThinking': [
    'もう少し考えさせて……',
    'ごめん、ちょっと待って……',
    '教科書を読んでて、ちょっと席を外す……',
    '左に五秒考え、二秒休み、右に五秒考え、二秒休み。',
  ],
  'reactions.aiShooting': [
    'これこそ会心のショット！',
    '一瞬で消し飛ばす。',
    '前進！一歩で二動作！',
    '君のコインたち、それぞれの道へ。',
    '一番うまいショットは、いつも次の一発。',
  ],
  'reactions.aiTestShot': [
    '君の度胸を試してるだけ。',
    '良い生徒にはこの「精神力」が必要だ。',
    'ただからかってるだけ。',
  ],
  'reactions.aiKilledP1': [
    'また引っかかったね！',
    '私の意図をちゃんと理解しないと。',
    '私のコインは、見事な丸さ！',
    'このショット、味があるだろう！',
  ],
};

export type ArrayKey = keyof typeof ZH_ARRAYS;

const ARRAYS: Record<Locale, ArrayDict> = {
  zh: ZH_ARRAYS,
  en: EN_ARRAYS,
  ja: JA_ARRAYS,
};
