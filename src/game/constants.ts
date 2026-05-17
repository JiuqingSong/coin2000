export const TABLE = { width: 620, height: 410 };

export const COINS_PER_SIDE = 5;
export const COIN_RADIUS = 11;
export const COIN_MASS = 5;

export const MAX_SHOT_SPEED = 14;
export const FRICTION_MU = 0.015;
export const G = 9.8;
export const RESTITUTION = 0.95;

export const SIM_HZ = 60;
export const SIM_DT_MS = 1000 / SIM_HZ;
export const SETTLED_EPS = 0.05;

export const POWER_SCALE = 0.07;
export const MIN_DRAG_DIST = 15;

export const STONE_RADIUS = 15;
export const STONE_MASS = 8;
export const BOMB_RADIUS = 12;
export const BOMB_MASS = 1;
export const TREE_RADIUS = 14;
export const TREE_MASS = 1e6;
export const HOLE_RADIUS = 20;
export const HOLE_MASS = 1e6;
export const EXPLODE_TICKS = 14;
export const DROP_TICKS = 28;

export const AI_ANGLE_SAMPLES = 5;
export const AI_SIM_TICK_CAP = 600;

// Scripted aim animation, shared by AI and replay playback. First the chosen
// coin is highlighted on its own (so the viewer sees *which* coin), then the
// aim line ramps from 0 to the target speed (so the viewer sees *where* and
// *how hard*), then it holds at full draw for a beat before firing.
export const AIM_HIGHLIGHT_MS = 350;
export const AIM_CHARGE_MS = 550;
export const AIM_HOLD_MS = 220;
