import { Bell } from './audio/bell';
import { Music } from './audio/music';
import { Engine } from './game/engine';
import { CoinKind, Owner } from './game/types';
import { applyConfig, config, loadConfig, subscribeConfig, type GameConfig } from './game/config';
import { materializeSelectedMap } from './game/setup';
import type { MapData } from './game/mapData';
import { applyDocumentLocale } from './i18n';
import { AimController } from './input/aim';
import { AIPlayer } from './players/aiPlayer';
import { HumanPlayer } from './players/humanPlayer';
import type { Player } from './players/player';
import { ReplayPlayer, createReplayQueue, type ReplayQueue } from './players/replayPlayer';
import { createCanvasView } from './render/canvas';
import { mountChrome, type P2Mode } from './ui/chrome';
import { mountConfig } from './ui/config';
import { mountHud, type GameInfo } from './ui/hud';
import { mountMapEditor, type MapEditorHandle } from './ui/mapEditor';
import { mountReactions } from './ui/reactions';
import { mountSaveDialog } from './ui/saveDialog';
import { mountWelcome, type WelcomeHandle } from './ui/welcome';
import {
  SAVE_FILE_APP,
  SAVE_FILE_VERSION,
  type SaveFile,
  type ShotRecord,
} from './replay/types';
import { parseSaveFile } from './replay/load';
import {
  REPLAY_FILE_EXT,
  defaultSaveFileName,
  downloadAsFile,
  sanitizeFileName,
  serializeSaveFile,
} from './replay/save';
import {
  MAP_FILE_APP,
  MAP_FILE_KIND,
  MAP_FILE_VERSION,
  type MapFile,
} from './editor/types';
import { MAP_FILE_EXT, defaultMapFileName, serializeMapFile } from './editor/save';
import type { RoundResult } from './game/rules';

const board = document.getElementById('board') as HTMLCanvasElement | null;
const chromeEl = document.getElementById('chrome');
const hudEl = document.getElementById('hud');
const overlayEl = document.getElementById('overlay');
const messageEl = document.getElementById('message-strip');

if (!board || !chromeEl || !hudEl || !overlayEl || !messageEl) {
  throw new Error('Required DOM elements missing.');
}

loadConfig();
applyDocumentLocale();

const view = createCanvasView(board);
const aim = new AimController(board, view);
const bell = new Bell();
bell.setMuted(!config.soundEnabled);
subscribeConfig(() => bell.setMuted(!config.soundEnabled));
const music = new Music();
const reactions = mountReactions(messageEl);

const unlockAudio = () => {
  bell.resume();
  music.unlock();
  window.removeEventListener('pointerdown', unlockAudio);
  window.removeEventListener('keydown', unlockAudio);
};
window.addEventListener('pointerdown', unlockAudio);
window.addEventListener('keydown', unlockAudio);

let p2Mode: P2Mode = 'ai';

type GameMode = 'play' | 'replay';
let gameMode: GameMode = 'play';
let replayQueue: ReplayQueue | null = null;
let recordedShots: ShotRecord[] = [];
let lastResult: RoundResult | null = null;
let preReplayConfig: GameConfig | null = null;
let currentReplaySave: SaveFile | null = null;
let replayBaseShots: ShotRecord[] = [];
let welcome: WelcomeHandle | null = null;
let editor: MapEditorHandle | null = null;
let customMap: MapData | null = null;
// Last map the editor handed off to a Test Play. Lets the "Back to Editor"
// button in chrome re-open the editor with the same in-progress design.
let editingMap: MapData | null = null;

const buildPlayer = (owner: Owner): Player => {
  if (gameMode === 'replay' && replayQueue) {
    return new ReplayPlayer(owner as Owner.P1 | Owner.P2, replayQueue);
  }
  if (owner === Owner.P1) return new HumanPlayer(Owner.P1, aim);
  return p2Mode === 'ai' ? new AIPlayer(Owner.P2) : new HumanPlayer(Owner.P2, aim);
};

const isAiTurn = (owner: Owner) =>
  gameMode === 'play' && owner === Owner.P2 && p2Mode === 'ai';

function gameInfoFromMap(map: MapData, cfg: GameConfig): GameInfo {
  let p1Coins = 0, p2Coins = 0, stones = 0, bombs = 0, holes = 0, trees = 0;
  let coinRadius = cfg.coinRadius;
  let coinMass = cfg.coinMass;
  for (const c of map.coins) {
    if (c.kind === CoinKind.Coin) {
      if (c.owner === Owner.P1) { p1Coins++; coinRadius = c.radius; coinMass = c.mass; }
      else if (c.owner === Owner.P2) p2Coins++;
    } else if (c.kind === CoinKind.Stone) stones++;
    else if (c.kind === CoinKind.Bomb) bombs++;
    else if (c.kind === CoinKind.Hole) holes++;
    else if (c.kind === CoinKind.Tree) trees++;
  }
  return {
    p1Coins, p2Coins, stones, bombs, holes, trees,
    coinRadius, coinMass,
    maxShotSpeed: cfg.maxShotSpeed,
    aiAngleSamples: cfg.aiAngleSamples,
    keepShotOnKill: cfg.keepShotOnKill,
    explosionRadius: cfg.explosionRadius,
  };
}

const restart = () => {
  if (gameMode !== 'play') return;
  hud.clearResult();
  reactions.clear();
  recordedShots = [];
  replayBaseShots = [];
  lastResult = null;
  if (customMap !== null) {
    engine.startWithMap(customMap);
  } else {
    engine.start();
  }
  hud.setGameInfo(gameInfoFromMap(engine.getCurrentMap(), config));
  music.start();
};

const goToWelcome = () => {
  engine.stop();
  editor?.hide();
  editor = null;
  if (gameMode === 'replay') {
    if (preReplayConfig) {
      applyConfig(preReplayConfig);
      preReplayConfig = null;
    }
    replayQueue = null;
    currentReplaySave = null;
    chrome.setReplayMode(false);
    gameMode = 'play';
    engine.setPlayer(Owner.P1, buildPlayer(Owner.P1));
    engine.setPlayer(Owner.P2, buildPlayer(Owner.P2));
  }
  if (customMap !== null) {
    customMap = null;
    chrome.setCustomMapActive(false);
  }
  if (editingMap !== null) {
    editingMap = null;
    chrome.setEditingMode(false);
  }
  recordedShots = [];
  replayBaseShots = [];
  lastResult = null;
  hud.clearResult();
  hud.setGameInfo(null);
  hud.setReplayControlsVisible(false);
  hud.setReplayPaused(false);
  reactions.clear();
  showWelcome();
};

const continueFromHere = () => {
  if (gameMode !== 'replay' || !engine.isPaused() || !currentReplaySave) return;

  // Determine which shots from the replay file have already been played.
  const totalShots = currentReplaySave.shots.length;
  const remaining = replayQueue?.remaining() ?? 0;
  replayBaseShots = currentReplaySave.shots.slice(0, totalShots - remaining);

  // Keep the replay config as the active config (don't restore preReplayConfig).
  preReplayConfig = null;

  // Tear down replay state.
  replayQueue = null;
  currentReplaySave = null;
  gameMode = 'play';
  recordedShots = [];
  lastResult = null;

  chrome.setReplayMode(false);
  hud.setReplayControlsVisible(false);
  hud.setReplayPaused(false);

  // Atomically swap both players from ReplayPlayer to Human/AI and resume.
  engine.continueAsPlay(buildPlayer(Owner.P1), buildPlayer(Owner.P2));
};

const hud = mountHud(
  hudEl,
  overlayEl,
  {
    onPlayAgain: restart,
    onSaveReplay: () => openSaveDialog(),
    onBackToWelcome: () => goToWelcome(),
    onReplayPause: () => {
      engine.pause();
      if (engine.isPaused()) hud.setReplayPaused(true);
    },
    onReplayResume: () => {
      engine.resume();
      hud.setReplayPaused(false);
    },
    onReplayStep: () => {
      engine.stepOne();
      hud.setReplayPaused(false);
    },
    onContinueFromHere: () => continueFromHere(),
    onReplayAgain: () => {
      if (currentReplaySave) startReplay(currentReplaySave);
    },
    onLoadAnotherReplay: () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.replay.coin';
      input.addEventListener('change', async () => {
        const file = input.files?.[0];
        if (!file) return;
        try {
          const text = await file.text();
          const save = parseSaveFile(text);
          startReplay(save);
        } catch {
          // ignore parse errors silently
        }
      });
      input.click();
    },
  },
  p2Mode,
);

const engine = new Engine({
  view,
  aim,
  bell,
  buildPlayer,
  onFrame: (world) => hud.update(world),
  onTurnStart: (owner) => {
    if (gameMode === 'replay') {
      reactions.clear();
      return;
    }
    if (isAiTurn(owner)) reactions.show('aiThinking');
    else reactions.show('humanAiming');
  },
  onShotFired: (shooter) => {
    if (gameMode === 'replay') return;
    if (isAiTurn(shooter)) reactions.show('aiShooting');
  },
  onShotRecorded: (shooter, coinId, vel) => {
    if (gameMode === 'play') {
      recordedShots.push({ shooter, coinId, vel: { x: vel.x, y: vel.y } });
    }
  },
  onTurnSettled: ({ shooter, killedP1, killedP2 }) => {
    if (gameMode === 'replay') return;
    if (isAiTurn(shooter)) {
      reactions.show(killedP1 > 0 ? 'aiKilledP1' : 'aiTestShot');
      return;
    }
    const enemyKilled = shooter === Owner.P1 ? killedP2 : killedP1;
    const selfKilled = shooter === Owner.P1 ? killedP1 : killedP2;
    if (enemyKilled > 0) reactions.show('humanKilledEnemy');
    else if (selfKilled > 0) reactions.show('humanKilledOwn');
    else reactions.show('humanNothing');
  },
  onRoundEnd: (result) => {
    lastResult = result;
    hud.showResult(result, gameMode);
  },
  onPaused: () => {
    hud.setReplayPaused(true);
  },
});

const chrome = mountChrome(chromeEl, {
  initialP2Mode: p2Mode,
  initialMusicOn: music.isEnabled(),
  onP2ModeChange: (mode) => {
    p2Mode = mode;
    hud.setP2Mode(mode);
    engine.setPlayer(Owner.P2, buildPlayer(Owner.P2));
  },
  onMapChange: () => {
    // Picking a built-in template exits custom-map mode (and any editor test).
    if (customMap !== null) {
      customMap = null;
      chrome.setCustomMapActive(false);
    }
    if (editingMap !== null) {
      editingMap = null;
      chrome.setEditingMode(false);
    }
    restart();
  },
  onRestart: restart,
  onMusicToggle: () => music.toggle(),
  onBackToWelcome: () => goToWelcome(),
  onBackToEditor: () => {
    if (editingMap === null) return;
    engine.stop();
    customMap = null;
    chrome.setCustomMapActive(false);
    chrome.setEditingMode(false);
    hud.clearResult();
    reactions.clear();
    openEditor(editingMap);
  },
});
music.subscribe((on) => chrome.setMusicOn(on));

const configDialog = mountConfig(document.body);
const saveDialog = mountSaveDialog(document.body);

const welcomeOpts = {
  onStart: () => {
    welcome?.hide();
    welcome = null;
    if (customMap !== null) {
      customMap = null;
      chrome.setCustomMapActive(false);
    }
    if (editingMap !== null) {
      editingMap = null;
      chrome.setEditingMode(false);
    }
    recordedShots = [];
    lastResult = null;
    engine.start();
    hud.setGameInfo(gameInfoFromMap(engine.getCurrentMap(), config));
    music.start();
  },
  onSettings: () => configDialog.open(),
  onLoadReplay: (save: SaveFile) => {
    welcome?.hide();
    welcome = null;
    startReplay(save);
  },
  onLoadMap: (file: MapFile) => {
    welcome?.hide();
    welcome = null;
    startCustomMap(file.map);
  },
  onEditMap: () => {
    welcome?.hide();
    welcome = null;
    editingMap = null;
    openEditor(materializeSelectedMap());
  },
};

const showWelcome = () => {
  if (welcome) return;
  welcome = mountWelcome(document.body, welcomeOpts);
};

const startCustomMap = (map: MapData) => {
  customMap = map;
  chrome.setCustomMapActive(true);
  hud.clearResult();
  reactions.clear();
  recordedShots = [];
  lastResult = null;
  engine.startWithMap(map);
  hud.setGameInfo(gameInfoFromMap(map, config));
  music.start();
};

const openEditor = (initialMap: MapData) => {
  editor?.hide();
  editor = mountMapEditor(document.body, {
    initialMap,
    onSaveMap: (map) => {
      const filename = defaultMapFileName();
      const file: MapFile = {
        app: MAP_FILE_APP,
        version: MAP_FILE_VERSION,
        kind: MAP_FILE_KIND,
        createdAt: new Date().toISOString(),
        map,
      };
      saveDialog.open({
        defaultName: filename,
        extension: MAP_FILE_EXT,
        onSave: (name) => {
          downloadAsFile(sanitizeFileName(name, MAP_FILE_EXT), serializeMapFile(file));
        },
      });
    },
    onTestMap: (map) => {
      editor?.hide();
      editor = null;
      editingMap = map;
      chrome.setEditingMode(true);
      startCustomMap(map);
    },
    onClose: () => {
      editor?.hide();
      editor = null;
      editingMap = null;
      showWelcome();
    },
  });
};

const startReplay = (save: SaveFile) => {
  replayBaseShots = [];
  currentReplaySave = save;
  preReplayConfig = { ...config };
  applyConfig(save.config);
  gameMode = 'replay';
  replayQueue = createReplayQueue(save.shots);
  engine.setPlayer(Owner.P1, buildPlayer(Owner.P1));
  engine.setPlayer(Owner.P2, buildPlayer(Owner.P2));
  hud.clearResult();
  reactions.clear();
  chrome.setReplayMode(true);
  engine.startWithMap(save.map);
  hud.setGameInfo(gameInfoFromMap(save.map, save.config));
  hud.setReplayControlsVisible(true);
  hud.setReplayPaused(false);
  music.start();
};


const openSaveDialog = () => {
  if (!lastResult || gameMode !== 'play') return;
  const result = lastResult;
  // If the game was continued from a replay, prepend the already-played shots
  // so the saved file replays the full game from the beginning.
  const shots = [...replayBaseShots, ...recordedShots];
  saveDialog.open({
    defaultName: defaultSaveFileName(),
    extension: REPLAY_FILE_EXT,
    onSave: (name) => {
      const file: SaveFile = {
        app: SAVE_FILE_APP,
        version: SAVE_FILE_VERSION,
        createdAt: new Date().toISOString(),
        map: engine.getCurrentMap(),
        config: { ...config },
        p2Mode,
        shots,
        result,
      };
      downloadAsFile(sanitizeFileName(name, REPLAY_FILE_EXT), serializeSaveFile(file));
    },
  });
};

showWelcome();
