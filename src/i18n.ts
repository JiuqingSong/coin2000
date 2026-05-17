export type Locale = 'zh' | 'en' | 'ja';

const LOCALE_CYCLE: readonly Locale[] = ['zh', 'en', 'ja'];

const STORAGE_KEY = 'coin2026.locale.v1';

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
  'app.title': 'COIN 2026 · 弹硬币',

  // chrome (top bar)
  'chrome.opponent': '对手',
  'chrome.p2.ai': '电脑',
  'chrome.p2.human': '玩家',
  'chrome.map': '地图',
  'chrome.restart': '重新开始',
  'chrome.backToEditor': '返回编辑器',
  'chrome.music.on': '♪ 音乐',
  'chrome.music.off': '🔇 音乐',
  'chrome.music.title.on': '关闭背景音乐',
  'chrome.music.title.off': '开启背景音乐',
  'chrome.lang.toggle': 'EN',
  'chrome.lang.toggle.title': 'Switch to English',

  // welcome screen
  'welcome.titlebar': 'Yesoft 系列产品',
  'welcome.tool.guide': '说明',
  'welcome.tool.settings': '设置',
  'welcome.tool.about': '关于',
  'welcome.tool.lang': 'EN',
  'welcome.signature': '作者: Songthin',
  'welcome.action.start': '开始',
  'welcome.action.replay': '放录相',
  'welcome.action.editor': '编辑地图',
  'welcome.action.loadMap': '载入地图',
  'welcome.map.heading': '地图',
  'welcome.map.custom': '自制',
  'welcome.footer': '本游戏完全免费，欢迎拷贝。 2026年5月',
  'welcome.modal.back': '返回',
  'welcome.about.title': '关于',
  'welcome.about.body':
    'COIN 2026\n作者: Songthin\nYesoft\n\n浏览器移植版 · 2026',
  'welcome.replay.title': '放录相',
  'welcome.replay.body': '暂未实现。',
  'welcome.guide.title': '游戏说明',
  'welcome.guide.body':
    '■ 目标\n将对手的所有硬币撞下桌即获胜。若您先输光，则失败。\n\n' +
    '■ 操作\n' +
    '• 悬停在自己的硬币上，硬币变亮，表示可以操作。\n' +
    '• 拖动硬币，向您希望飞行方向的反方向拖动后松开。\n' +
    '• 拖得越远，力道越大；箭头显示方向和力度。\n' +
    '• 拖动时按 Esc 或单击鼠标右键，取消当前瞄准，再选择其他硬币。\n\n' +
    '■ 棋子\n' +
    '• 硬币（1 和 2）：双方棋子，将对手全部击落即获胜。\n' +
    '• 石头：中立重物，可挡路、可作反弹，出界不会消失。\n' +
    '• 炸弹：接触即爆炸，爆炸范围内的硬币全部消失。\n\n' +
    '■ 边界\n' +
    '• 灰色石墙：将硬币反弹回场内。\n' +
    '• 红色死亡线：桌面边缘，越过红线的棋子坠落出局。\n\n' +
    '■ 回合\n' +
    '双方轮流出手。默认情况下，若本回合击落了对手且自己没有损失，您可继续出手；否则换对手出手（此规则可在「设置」中关闭）。\n\n' +
    '■ 炸弹\n' +
    '任何运动中的棋子接触炸弹都会立即引爆，爆炸范围内的硬币全部消失。开启「连锁爆破」后，一颗炸弹的爆炸可能引爆周围的其它炸弹。\n\n' +
    '■ 技巧\n' +
    '• 利用两侧石墙打反弹球，绕过中央障碍。\n' +
    '• 把对手往红色死亡线推，而不仅是撞向它。\n' +
    '• 炸弹同样会炸到自己的硬币，请保持距离。',

  // HUD
  'hud.count.p1': '玩家',
  'hud.count.p2.ai': '电脑',
  'hud.count.p2.human': '对手',
  'hud.playAgain': '再来一局',
  'hud.saveReplay': '保存录像',
  'hud.backToWelcome': '返回主菜单',
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
  'config.label.treeCount': '树木数',
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

  // save / load
  'save.title': '保存录像',
  'save.filename': '文件名',
  'save.btn.save': '保存',
  'save.btn.cancel': '取消',
  'save.error.title': '无法读取录像',
  'save.error.badJson': '文件内容不是有效的 JSON。',
  'save.error.badShape': '文件结构不正确。',
  'save.error.wrongApp': '这不是 COIN 2026 的录像文件。',
  'save.error.wrongKind': '请选择 .replay.coin 录像文件。',
  'save.error.wrongVersion': '该录像版本不被支持。',
  'save.error.badMap': '录像中的地图信息缺失或损坏。',
  'save.error.badConfig': '录像中的设置信息缺失或损坏。',
  'save.error.badShots': '录像中的出手记录缺失或损坏。',
  'save.error.badResult': '录像中的胜负信息缺失或损坏。',

  // map file errors
  'mapfile.error.title': '无法读取地图',
  'mapfile.error.badJson': '文件内容不是有效的 JSON。',
  'mapfile.error.badShape': '文件结构不正确。',
  'mapfile.error.wrongApp': '这不是 COIN 2026 的地图文件。',
  'mapfile.error.wrongKind': '这是录像文件，不是地图文件。',
  'mapfile.error.wrongVersion': '该地图版本不被支持。',
  'mapfile.error.badMap': '地图数据缺失或损坏。',

  // map editor
  'editor.title': '地图编辑器',
  'editor.section.walls': '边界',
  'editor.wall.top': '上边',
  'editor.wall.bottom': '下边',
  'editor.wall.left': '左边',
  'editor.wall.right': '右边',
  'editor.wall.kill': '出界 (死)',
  'editor.wall.bounce': '反弹',
  'editor.section.tools': '工具',
  'editor.tool.select': '选择 / 移动',
  'editor.tool.p1': '玩家硬币',
  'editor.tool.p2': '电脑硬币',
  'editor.tool.stone': '石头',
  'editor.tool.bomb': '炸弹',
  'editor.tool.tree': '树木',
  'editor.tool.hole': '陷阱',
  'editor.tool.erase': '删除',
  'editor.section.actions': '操作',
  'editor.btn.clear': '清空',
  'editor.btn.save': '保存',
  'editor.btn.test': '试玩',
  'editor.btn.close': '关闭',
  'editor.hint.select': '点击选择棋子，拖动移动，Delete 键删除。',
  'editor.hint.place': '点击空白处放置棋子。',
  'editor.hint.erase': '点击棋子将其删除。',
  'editor.error.noP1': '至少需要 1 颗玩家硬币。',
  'editor.error.noP2': '至少需要 1 颗对手硬币。',
  'editor.error.overlap': '有棋子重叠，请调整位置。',
} as const;

const EN_STRINGS: Record<keyof typeof ZH_STRINGS, string> = {
  'app.title': 'COIN 2026 · Coin Flick',

  // chrome (top bar)
  'chrome.opponent': 'Opponent',
  'chrome.p2.ai': 'Computer',
  'chrome.p2.human': 'Human',
  'chrome.map': 'Map',
  'chrome.restart': 'Restart',
  'chrome.backToEditor': 'Back to Editor',
  'chrome.music.on': '♪ Music',
  'chrome.music.off': '🔇 Music',
  'chrome.music.title.on': 'Turn music off',
  'chrome.music.title.off': 'Turn music on',
  'chrome.lang.toggle': '日',
  'chrome.lang.toggle.title': '日本語に切り替え',

  // welcome screen
  'welcome.titlebar': 'A Yesoft Production',
  'welcome.tool.guide': 'Guide',
  'welcome.tool.settings': 'Settings',
  'welcome.tool.about': 'About',
  'welcome.tool.lang': '日',
  'welcome.signature': 'By Songthin',
  'welcome.action.start': 'Start',
  'welcome.action.replay': 'Replay',
  'welcome.action.editor': 'Map Editor',
  'welcome.action.loadMap': 'Load Map',
  'welcome.map.heading': 'Map',
  'welcome.map.custom': 'Custom',
  'welcome.footer': 'Freeware — please share. May 2026',
  'welcome.modal.back': 'Back',
  'welcome.about.title': 'About',
  'welcome.about.body':
    'COIN 2026\nBy Songthin\nYesoft\n\nBrowser port · 2026',
  'welcome.replay.title': 'Replay',
  'welcome.replay.body': 'Not implemented yet.',
  'welcome.guide.title': 'How to Play',
  'welcome.guide.body':
    '■ Goal\nKnock all your opponent’s coins off the board to win. If you run out of coins first, you lose.\n\n' +
    '■ Controls\n' +
    '• Hover over one of your coins — it brightens to show it’s selectable.\n' +
    '• Drag a coin in the direction opposite to where you want it to fly, then release.\n' +
    '• Longer drag = stronger shot; the arrow shows direction and power.\n' +
    '• Press Esc or right-click while dragging to cancel and pick a different coin.\n\n' +
    '■ Pieces\n' +
    '• Coins (1 and 2): your team and your opponent’s — eliminate them all to win.\n' +
    '• Stones: heavy neutral pieces. They block paths and bounce shots; never knocked out.\n' +
    '• Bombs: explode on contact. Everything in the blast radius is destroyed.\n\n' +
    '■ Walls\n' +
    '• Stone walls: bounce coins back into play.\n' +
    '• Red kill line: the edge of the table — pieces crossing the red line fall away for good.\n\n' +
    '■ Turn order\n' +
    'Players alternate. By default, if your shot eliminates at least one enemy coin and none of your own, you keep your turn; otherwise it passes to the opponent (this rule can be turned off in Settings).\n\n' +
    '■ Bombs\n' +
    'A bomb explodes the instant any moving piece touches it. The blast destroys every coin within its radius. With “Chain explosions” on, hitting one bomb can detonate neighboring bombs.\n\n' +
    '■ Tips\n' +
    '• Use the side walls to bank shots around stones.\n' +
    '• Push enemies toward the red kill line, not just into stones.\n' +
    '• Bombs hurt your own coins too — keep yours away.',

  // HUD
  'hud.count.p1': 'You',
  'hud.count.p2.ai': 'CPU',
  'hud.count.p2.human': 'P2',
  'hud.playAgain': 'Play Again',
  'hud.saveReplay': 'Save Replay',
  'hud.backToWelcome': 'Back to Menu',
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
  'config.label.treeCount': 'Tree count',
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

  // save / load
  'save.title': 'Save Replay',
  'save.filename': 'File name',
  'save.btn.save': 'Save',
  'save.btn.cancel': 'Cancel',
  'save.error.title': 'Could not load replay',
  'save.error.badJson': 'The file is not valid JSON.',
  'save.error.badShape': 'The file structure is unexpected.',
  'save.error.wrongApp': 'This is not a COIN 2026 replay file.',
  'save.error.wrongKind': 'Please select a .replay.coin file.',
  'save.error.wrongVersion': 'This replay version is not supported.',
  'save.error.badMap': 'The map data in the replay is missing or damaged.',
  'save.error.badConfig': 'The settings data in the replay is missing or damaged.',
  'save.error.badShots': 'The shot list in the replay is missing or damaged.',
  'save.error.badResult': 'The result data in the replay is missing or damaged.',

  // map file errors
  'mapfile.error.title': 'Could not load map',
  'mapfile.error.badJson': 'The file is not valid JSON.',
  'mapfile.error.badShape': 'The file structure is unexpected.',
  'mapfile.error.wrongApp': 'This is not a COIN 2026 map file.',
  'mapfile.error.wrongKind': 'This is a replay file, not a map file.',
  'mapfile.error.wrongVersion': 'This map version is not supported.',
  'mapfile.error.badMap': 'The map data is missing or damaged.',

  // map editor
  'editor.title': 'Map Editor',
  'editor.section.walls': 'Walls',
  'editor.wall.top': 'Top',
  'editor.wall.bottom': 'Bottom',
  'editor.wall.left': 'Left',
  'editor.wall.right': 'Right',
  'editor.wall.kill': 'Kill',
  'editor.wall.bounce': 'Bounce',
  'editor.section.tools': 'Tools',
  'editor.tool.select': 'Select / Move',
  'editor.tool.p1': 'Player coin',
  'editor.tool.p2': 'Opponent coin',
  'editor.tool.stone': 'Stone',
  'editor.tool.bomb': 'Bomb',
  'editor.tool.tree': 'Tree',
  'editor.tool.hole': 'Hole',
  'editor.tool.erase': 'Erase',
  'editor.section.actions': 'Actions',
  'editor.btn.clear': 'Clear',
  'editor.btn.save': 'Save',
  'editor.btn.test': 'Test Play',
  'editor.btn.close': 'Close',
  'editor.hint.select': 'Click a piece to select, drag to move, Delete to remove.',
  'editor.hint.place': 'Click empty space to place a piece.',
  'editor.hint.erase': 'Click a piece to delete it.',
  'editor.error.noP1': 'At least 1 player coin is required.',
  'editor.error.noP2': 'At least 1 opponent coin is required.',
  'editor.error.overlap': 'Pieces overlap — move them apart.',
};

const JA_STRINGS: Record<keyof typeof ZH_STRINGS, string> = {
  'app.title': 'COIN 2026 · コイン弾き',

  // chrome (top bar)
  'chrome.opponent': '対戦相手',
  'chrome.p2.ai': 'コンピュータ',
  'chrome.p2.human': '対戦',
  'chrome.map': 'マップ',
  'chrome.restart': '再スタート',
  'chrome.backToEditor': 'エディタへ戻る',
  'chrome.music.on': '♪ 音楽',
  'chrome.music.off': '🔇 音楽',
  'chrome.music.title.on': 'BGMをオフ',
  'chrome.music.title.off': 'BGMをオン',
  'chrome.lang.toggle': '中',
  'chrome.lang.toggle.title': '切换到中文',

  // welcome screen
  'welcome.titlebar': 'Yesoft シリーズ',
  'welcome.tool.guide': '遊び方',
  'welcome.tool.settings': '設定',
  'welcome.tool.about': '情報',
  'welcome.tool.lang': '中',
  'welcome.signature': '作者: Songthin',
  'welcome.action.start': '開始',
  'welcome.action.replay': 'リプレイ',
  'welcome.action.editor': 'マップ編集',
  'welcome.action.loadMap': 'マップを開く',
  'welcome.map.heading': 'マップ',
  'welcome.map.custom': 'カスタム',
  'welcome.footer': 'フリーソフトウェア、配布歓迎。 2026年5月',
  'welcome.modal.back': '戻る',
  'welcome.about.title': '情報',
  'welcome.about.body':
    'COIN 2026  バージョン\n作者: Songthin\nYesoft\n\nブラウザ移植版 · 2026',
  'welcome.replay.title': 'リプレイ',
  'welcome.replay.body': '未実装です。',
  'welcome.guide.title': '遊び方',
  'welcome.guide.body':
    '■ 目的\n相手のコインをすべて盤外に落とせば勝利。先に自分のコインが尽きると負けです。\n\n' +
    '■ 操作\n' +
    '• 自分のコインにカーソルを合わせると明るくなり、選択可能になります。\n' +
    '• 飛ばしたい方向の逆へドラッグし、離して発射。\n' +
    '• 引く距離が長いほど強く飛びます。矢印で方向と力を表示。\n' +
    '• ドラッグ中に Esc または右クリックでキャンセルし、別のコインを選び直せます。\n\n' +
    '■ 駒\n' +
    '• コイン（1 と 2）：自分と相手の駒。全滅させれば勝ち。\n' +
    '• 石：中立の重い駒。進路を塞ぎ、反射に使えます。盤外に落ちても消えません。\n' +
    '• 爆弾：接触で爆発。爆発半径内のコインはすべて消滅します。\n\n' +
    '■ 壁\n' +
    '• 石壁：コインを盤内へ跳ね返します。\n' +
    '• 赤いキルライン：盤の縁。赤線を越えた駒は落下して消えます。\n\n' +
    '■ ターン\n' +
    'プレイヤーは交互に行動します。標準設定では、相手のコインを撃ち落とし、自分のコインを落とさなければターンを継続できます（このルールは「設定」でオフにできます）。\n\n' +
    '■ 爆弾\n' +
    '動いている駒が爆弾に触れた瞬間に爆発し、爆発半径内のすべてのコインが消滅します。「連鎖爆発」を有効にすると、近隣の爆弾も誘爆します。\n\n' +
    '■ ヒント\n' +
    '• 横の石壁を使って反射ショットで石を回り込ませる。\n' +
    '• 相手をキルラインへ押し出す。\n' +
    '• 爆弾は味方も巻き込みます。自分のコインを近づけすぎないこと。',

  // HUD
  'hud.count.p1': 'あなた',
  'hud.count.p2.ai': 'CPU',
  'hud.count.p2.human': 'P2',
  'hud.playAgain': 'もう一度',
  'hud.saveReplay': 'リプレイを保存',
  'hud.backToWelcome': 'メニューへ戻る',
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
  'config.label.treeCount': '木の数',
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

  // save / load
  'save.title': 'リプレイを保存',
  'save.filename': 'ファイル名',
  'save.btn.save': '保存',
  'save.btn.cancel': 'キャンセル',
  'save.error.title': 'リプレイを読み込めません',
  'save.error.badJson': 'ファイルが有効な JSON ではありません。',
  'save.error.badShape': 'ファイル構造が想定外です。',
  'save.error.wrongApp': 'COIN 2026 のリプレイファイルではありません。',
  'save.error.wrongKind': '.replay.coin のリプレイファイルを選択してください。',
  'save.error.wrongVersion': 'このリプレイのバージョンには対応していません。',
  'save.error.badMap': 'リプレイのマップ情報が欠落しているか壊れています。',
  'save.error.badConfig': 'リプレイの設定情報が欠落しているか壊れています。',
  'save.error.badShots': 'リプレイのショット記録が欠落しているか壊れています。',
  'save.error.badResult': 'リプレイの結果情報が欠落しているか壊れています。',

  // map file errors
  'mapfile.error.title': 'マップを読み込めません',
  'mapfile.error.badJson': 'ファイルが有効な JSON ではありません。',
  'mapfile.error.badShape': 'ファイル構造が想定外です。',
  'mapfile.error.wrongApp': 'COIN 2026 のマップファイルではありません。',
  'mapfile.error.wrongKind': 'これはリプレイで、マップではありません。',
  'mapfile.error.wrongVersion': 'このマップのバージョンには対応していません。',
  'mapfile.error.badMap': 'マップデータが欠落しているか壊れています。',

  // map editor
  'editor.title': 'マップエディタ',
  'editor.section.walls': '壁',
  'editor.wall.top': '上',
  'editor.wall.bottom': '下',
  'editor.wall.left': '左',
  'editor.wall.right': '右',
  'editor.wall.kill': '落下',
  'editor.wall.bounce': '反射',
  'editor.section.tools': 'ツール',
  'editor.tool.select': '選択 / 移動',
  'editor.tool.p1': 'プレイヤーコイン',
  'editor.tool.p2': '相手コイン',
  'editor.tool.stone': '石',
  'editor.tool.bomb': '爆弾',
  'editor.tool.tree': '木',
  'editor.tool.hole': '穴',
  'editor.tool.erase': '削除',
  'editor.section.actions': '操作',
  'editor.btn.clear': 'クリア',
  'editor.btn.save': '保存',
  'editor.btn.test': '試遊',
  'editor.btn.close': '閉じる',
  'editor.hint.select': '駒をクリックで選択、ドラッグで移動、Delete で削除。',
  'editor.hint.place': '空いた場所をクリックで駒を配置。',
  'editor.hint.erase': '駒をクリックで削除。',
  'editor.error.noP1': 'プレイヤーコインが最低 1 つ必要です。',
  'editor.error.noP2': '相手コインが最低 1 つ必要です。',
  'editor.error.overlap': '駒が重なっています。位置を調整してください。',
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
