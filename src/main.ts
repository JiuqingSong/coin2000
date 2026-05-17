import { Bell } from './audio/bell';
import { Music } from './audio/music';
import { Engine } from './game/engine';
import { Owner } from './game/types';
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
import { mountHud } from './ui/hud';
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

const restart = () => {
  if (gameMode !== 'play') return;
  hud.clearResult();
  reactions.clear();
  recordedShots = [];
  lastResult = null;
  if (customMap !== null) {
    engine.startWithMap(customMap);
  } else {
    engine.start();
  }
  music.start();
};

const hud = mountHud(
  hudEl,
  overlayEl,
  {
    onPlayAgain: restart,
    onSaveReplay: () => openSaveDialog(),
    onBackToWelcome: () => exitReplay(),
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
  music.start();
};

const exitReplay = () => {
  engine.stop();
  if (preReplayConfig) {
    applyConfig(preReplayConfig);
    preReplayConfig = null;
  }
  gameMode = 'play';
  replayQueue = null;
  chrome.setReplayMode(false);
  hud.clearResult();
  reactions.clear();
  engine.setPlayer(Owner.P1, buildPlayer(Owner.P1));
  engine.setPlayer(Owner.P2, buildPlayer(Owner.P2));
  showWelcome();
};

const openSaveDialog = () => {
  if (!lastResult || gameMode !== 'play') return;
  const result = lastResult;
  const shots = recordedShots.slice();
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
