# COIN2000 — HTML/JavaScript Port Plan

Port of the original Turbo Pascal **COIN2000** (1995–2000, Song Jiuqing / Song Studio) to a browser-based game.

---

## 1. Approach

**Do not port the Turbo Graph framework.** It is ~70% of the Pascal code (windows, dialogs, menus, controls, ICG resources) and would be wasted effort. Replace it with native HTML/CSS for chrome and use Canvas 2D only for the playfield. Port only the gameplay (coin physics, table, bell, AI).

## 2. Tech stack

| Concern | Choice | Why |
|---|---|---|
| Language | **TypeScript** | Catches Pascal-record-style bugs cheaply; small project so overhead is low |
| Build | **Vite** | Zero-config, fast dev server, one-command static build |
| Rendering | **Canvas 2D** | Coins + lines — no WebGL needed |
| UI chrome (menus, dialogs, settings) | **Plain HTML + CSS** | Replaces `GraphDlg`, `GraphMnu` |
| Audio | **Web Audio API** | One oscillator replaces `TBell` |
| Persistence | (later) localStorage for config; download/upload `.txt` for replays | Out of scope for MVP |
| Hosting | **GitHub Pages** off `main` | One-click static deploy |

---

## 3. MVP scope

Locked decisions:

| Area | Decision |
|---|---|
| Pieces | **Coins only** (P1, P2). No stones, no bombs. |
| Match | **One round.** Round ends when a side hits 0 alive coins on the table. |
| Aim | **Drag-and-release** (slingshot). |
| P2 | Toggle between **AIPlayer** and **HumanPlayer**; default = AI. |
| Coins per side | **5** |
| AI | **Fixed Normal**: 5 angle samples per target, no random fallback |
| Layout | **Deterministic mirrored columns**, evenly spaced vertically |
| Visuals | **Modernized**: antialiased, soft shadows, subtle felt texture |
| Sim rate | Fixed **60 Hz**, accumulator-driven from RAF |
| Turn rule | One shot per turn. Turn always passes on shot release. |
| Walls | **Left & right bounce; top & bottom kill** (original behavior) |
| Round end | **Overlay + Play Again button** |

**Out of scope for MVP** (designed-around but not implemented):
- Cheat codes
- Save / load / replay
- Settings dialog (configurable colors, radii, etc.)
- Backwards compat with old `.C2K` save files
- Stones, bombs
- Multi-round match with coin pool & bonus rewards

---

## 4. Phased plan

### Phase 0 — Prep (½ day)
- Convert all `.PAS` files from **GBK → UTF-8** so Chinese comments are readable. The mojibake (`�Ҿ��á�`) is GBK loaded as cp1252. `iconv -f GBK -t UTF-8` fixes it.
- Set up `src/`, `index.html`, `vite.config.ts`, deploy `.github/workflows/pages.yml`.
- Move Pascal sources into `legacy/` so the port lives at repo root.

### Phase 1 — Extract the spec (½ day)
- Confirm physics constants (`miu=0.015`, `g=9.8`, `restitution=0.95`), max shot speed (14), coin radius (11), coin mass (5).
- Confirm collision math by re-reading `COINUSE.PAS:959 hit()`.
- Confirm friction formula `v := sqrt(max(0, v² - 2μgv))` from `COINUSE.PAS:832`.
- Confirm wall reflection from `COINUSE.PAS:820–828`.
- Document in this file (under §6 Reference) — the spec is already mostly there.

### Phase 2 — Core engine (2–3 days)
- `Coin` model with Cartesian `vel` (Pascal uses polar `(v, sita)`; convert at the boundary).
- `Physics.step()` with 60 Hz fixed-step loop driven by RAF accumulator.
- Pair-wise circle collision; resolve via rotated-frame 1D elastic with restitution.
- Walls: x-reflect, y-kill.
- Friction per the Pascal formula.

### Phase 3 — Player abstraction & AI (1–2 days)
- `Player` interface, `HumanPlayer` & `AIPlayer` implementations.
- `AimController` (drag-release state machine) wired to `HumanPlayer`.
- `cpu.chooseShot` ported from `cgetv` (`COIN2000.PAS:916`).
- `simulate.ts` — headless physics fork for AI lookahead, with tick cap.

### Phase 4 — UI shell (1 day)
- HTML top bar: Start / Restart / P2-mode select.
- Right rail: coin counts per player, current-turn pill, status line.
- End-of-round overlay with winner + Play Again.

### Phase 5 — Polish (½ day)
- Web Audio bell (shoot, collision, die).
- Round-end animation/banter.
- README + screenshot, GitHub Pages deploy.

**Total: 5–7 focused days.**

---

## 5. Detailed design

### 5.1 File layout

```
src/
  main.ts                # mount canvas+HUD, instantiate Engine, wire Start button
  index.html
  style.css

  game/
    types.ts             # Vec2, Owner, CoinKind, CoinId, Phase
    constants.ts         # tunables (table, coin, physics, sim)
    coin.ts              # Coin interface + factory
    table.ts             # Table interface
    world.ts             # World container + small selectors
    physics.ts           # step(), resolveCollision(), allSettled()
    rules.ts             # roundEnded()
    setup.ts             # initialWorld()
    engine.ts            # main loop + phase machine

  players/
    player.ts            # Player interface + ShotCallback
    humanPlayer.ts       # binds AimController to current turn
    aiPlayer.ts          # 400 ms delay → cpu.chooseShot → callback

  ai/
    cpu.ts               # chooseShot(world) → {coinId, vel}
    simulate.ts          # clone+step until settled or 600-tick cap; returns score

  input/
    aim.ts               # AimController: drag-release state machine; emits AimPreview

  render/
    canvas.ts            # DPR-aware Canvas wrapper
    renderer.ts          # draw(world, aimPreview?)
    sprites.ts           # coin, aim line, table primitives

  ui/
    hud.ts               # turn pill, coin counts, status line, end-of-round overlay
    chrome.ts            # Start, Restart, P2-mode select

  audio/
    bell.ts              # WebAudio: shoot/collision/die
```

### 5.2 Core types

```ts
// types.ts
export type Vec2 = { x: number; y: number };
export const enum Owner    { P1 = 0, P2 = 1 }
export const enum CoinKind { Coin = 'coin' }
export type CoinId = number;
export const enum Phase    { Idle, Aiming, Simulating, RoundEnd }

// coin.ts
export interface Coin {
  id: CoinId; kind: CoinKind; owner: Owner;
  pos: Vec2; vel: Vec2;
  radius: number; mass: number;
  alive: boolean;
}

// table.ts
export interface Table { width: number; height: number }

// world.ts
export interface World {
  table: Table;
  coins: Coin[];                                      // length = 10 (5 per side)
  phase: Phase;
  current: Owner;
  aliveCount: { [Owner.P1]: number; [Owner.P2]: number };
}

// players/player.ts
export type ShotCallback = (coinId: CoinId, vel: Vec2) => void;
export interface Player {
  owner: Owner;
  startTurn(world: World, onShoot: ShotCallback): void;
  cancelTurn(): void;
}

// input/aim.ts
export interface AimPreview {
  coinId: CoinId;
  from: Vec2;            // coin center
  dir: Vec2;             // unit vector of shot
  power: number;         // 0..1
}
```

### 5.3 Constants

```ts
// constants.ts
export const TABLE = { width: 620, height: 410 };
export const COINS_PER_SIDE = 5;
export const COIN_RADIUS = 11;
export const COIN_MASS = 5;
export const MAX_SHOT_SPEED = 14;          // px/tick
export const FRICTION_MU = 0.015;
export const G = 9.8;
export const RESTITUTION = 0.95;           // collision energy loss
export const SIM_HZ = 60;
export const SIM_DT_MS = 1000 / SIM_HZ;
export const SETTLED_EPS = 0.05;           // |v| below this counts as stopped
export const POWER_SCALE = 0.05;           // px-drag → vel mapping (tunable)
export const AI_THINK_MS = 400;
export const AI_ANGLE_SAMPLES = 5;         // per (my_coin, enemy_coin) pair
export const AI_SIM_TICK_CAP = 600;
```

### 5.4 Classes & responsibilities

#### Physics (stateless functions)

```ts
step(world: World): void
  // one sim tick:
  //   move:        c.pos += c.vel
  //   collide:     pairwise circle test; resolveCollision for each touching pair
  //   walls:       x out of [r, W-r] → reflect vx
  //                y out of [r, H-r] → mark dead, decrement aliveCount[owner]
  //   friction:    s' = sqrt(max(0, s² - 2μgs)); scale vel by s'/s
  //   settle:      |v| < SETTLED_EPS → snap to zero

resolveCollision(a: Coin, b: Coin): void
  // Pascal hit() port:
  //   s = atan2(b.y - a.y, b.x - a.x)
  //   rotate both velocities into (along, across) frame
  //   1D elastic on 'along' with masses (a.mass, b.mass), scale by RESTITUTION
  //   rotate back

allSettled(world: World): boolean
```

#### Rules (stateless)

```ts
roundEnded(world: World): false | { winner: Owner | 'draw' }
  // one player at 0 alive → other wins
  // both at 0 simultaneously → draw
```

#### Setup

```ts
initialWorld(): World
  // 5 P1 coins on left column (x≈50, y evenly spaced)
  // 5 P2 coins on right column (x≈W-50, mirrored)
  // matches original cm=4 (deterministic) mode
```

#### Player abstraction

- **HumanPlayer**: on `startTurn`, hands control to `AimController`; when AimController emits a committed shot, calls `onShoot`. `cancelTurn` tears down AimController.
- **AIPlayer**: on `startTurn`, calls `cpu.chooseShot(world)`, waits `AI_THINK_MS`, calls `onShoot`. Synchronous compute; delay is for UX only.

Switching modes = swapping `players[Owner.P2]` between an `AIPlayer` and a `HumanPlayer`.

#### AimController

States: `Idle | Dragging(coinId, startWorldPos, currentWorldPos)`.

```
pointerdown on alive own-coin → Dragging
pointermove                   → update currentWorldPos; emit AimPreview
pointerup                     → vel = clamp((start - current) * POWER_SCALE, MAX_SHOT_SPEED)
                                if |vel| > minThreshold: emit onShoot; else cancel
pointerleave / Escape         → cancel
```

Slingshot semantics: drag direction is *opposite* to shot direction. Refuses to start a drag if pointer is not on an alive coin owned by `world.current`.

#### AI (`cpu.chooseShot`)

Simplified port of `cgetv` (`COIN2000.PAS:916`):

```
best = { score: -Infinity, coinId, vel }
for each my coin m (alive):
  for each enemy coin e (alive):
    baseAngle    = angle(e.pos - m.pos)
    tangentSpread = atan(e.radius / dist(m, e))
    for k in [-AI_ANGLE_SAMPLES/2..AI_ANGLE_SAMPLES/2]:
      angle = baseAngle + tangentSpread * (2k / AI_ANGLE_SAMPLES)
      vel   = (cos(angle), sin(angle)) * MAX_SHOT_SPEED
      score = simulate(world, m.id, vel)
      if score > best.score: best = {score, coinId: m.id, vel}
return best
```

`simulate(world, coinId, vel)` clones the world (`structuredClone` is fine), sets `coins[coinId].vel = vel`, runs `Physics.step` until `allSettled` or `AI_SIM_TICK_CAP` ticks, returns `(enemy_killed) - (own_killed)`.

#### Engine (orchestrator)

```ts
class Engine {
  start() {
    this.world = setup.initialWorld();
    this.world.phase = Phase.Aiming; this.world.current = Owner.P1;
    this.players[Owner.P1].startTurn(this.world, this.onShoot);
    requestAnimationFrame(this.tick);
  }

  tick = (now: number) => {
    const elapsed = now - (this.last ?? now); this.last = now;
    this.acc += elapsed;
    while (this.acc >= SIM_DT_MS && this.world.phase === Phase.Simulating) {
      physics.step(this.world);
      this.acc -= SIM_DT_MS;
      if (physics.allSettled(this.world)) { this.onSettled(); break; }
    }
    renderer.draw(this.world, this.aim.preview);
    requestAnimationFrame(this.tick);
  }

  onShoot = (coinId: CoinId, vel: Vec2) => {
    this.world.coins[coinId].vel = vel;
    this.world.phase = Phase.Simulating;
    bell.ringShoot();
  }

  onSettled() {
    const end = rules.roundEnded(this.world);
    if (end) { this.world.phase = Phase.RoundEnd; hud.showResult(end); return; }
    this.world.current = (this.world.current === Owner.P1 ? Owner.P2 : Owner.P1);
    this.world.phase = Phase.Aiming;
    this.players[this.world.current].startTurn(this.world, this.onShoot);
  }
}
```

Engine knows Players only via interface — never about Human vs AI specifically.

#### Renderer

Pure read of `World` plus an optional `AimPreview` overlay. Draws table → coins → aim line. DPR-aware canvas (`canvas.ts` sets `width = cssW * devicePixelRatio` and scales context).

#### HUD (DOM)

- Top bar: "P1 (You) vs P2 (Computer/Player 2)" + a "Player 2: [AI ▾]" select.
- Right rail: coin counts per player, current-turn pill, status line.
- Round end: centered overlay with winner + "Play Again" button → `engine.start()`.

#### Bell

Single `AudioContext`, one `OscillatorNode` per ring (created and stopped per call). Three presets:
- `ringShoot()` — short up-sweep
- `ringCollision()` — short 1 kHz tick
- `ringDie()` — descending 800 → 400 Hz

### 5.5 Phase machine

```
Idle ─Start─► Setup ─► Aiming(current=P1)
Aiming ─player.onShoot─► Simulating
Simulating ─allSettled & !roundEnded─► Aiming(current swapped)
Simulating ─allSettled &  roundEnded─► RoundEnd
RoundEnd ─PlayAgain─► Setup
```

### 5.6 Turn interaction sequence

```
HumanPlayer  AimCtrl    Engine    Physics   Renderer    HUD
    │           │          │         │         │         │
    │ start ───►│ (listen) │         │         │         │
    │           │◄─pointerdown on coin                   │
    │           │── preview ────────────────────────────►│
    │           │◄─pointermove (repeat)                  │
    │           │── preview ────────────────────────────►│
    │           │◄─pointerup                             │
    │◄ shot ────│          │         │         │         │
    │── commit ─────────►  │         │         │         │
    │                  phase=Sim     │         │         │
    │                      │── step ►│         │         │
    │                      │◄────────│         │         │
    │                      │── draw ───────────►         │
    │                      │  (loop until settled)       │
    │                      │── swap current ────────────►│ (turn pill)
    │                  phase=Aiming  │         │         │
```

AIPlayer is the same except `startTurn` returns a shot itself (after `AI_THINK_MS`) instead of going through AimController.

### 5.7 Physics (sketch)

```ts
function step(w: World) {
  for (const c of w.coins) if (c.alive) {
    c.pos.x += c.vel.x; c.pos.y += c.vel.y;             // unit step = original "frame"
  }
  for (let i = 0; i < w.coins.length; i++)
    for (let j = i + 1; j < w.coins.length; j++) {
      const a = w.coins[i], b = w.coins[j];
      if (a.alive && b.alive && overlaps(a, b)) resolveCollision(a, b);
    }
  for (const c of w.coins) if (c.alive) {
    // walls — left/right reflect, top/bottom kill
    if (c.pos.x < c.radius || c.pos.x > w.table.width  - c.radius) c.vel.x = -c.vel.x;
    if (c.pos.y < c.radius || c.pos.y > w.table.height - c.radius) {
      c.alive = false; w.aliveCount[c.owner]--; continue;
    }
    // friction (Pascal: v = sqrt(max(0, v² - 2μgv)))
    const s = Math.hypot(c.vel.x, c.vel.y);
    if (s < SETTLED_EPS) { c.vel.x = c.vel.y = 0; continue; }
    const s2 = Math.sqrt(Math.max(0, s*s - 2*FRICTION_MU*G*s));
    const k = s2 / s; c.vel.x *= k; c.vel.y *= k;
  }
}
```

Two intentional differences from the Pascal:
- **Collision order**: original resolves the first pair found, reverts movement, then continues. Port resolves all overlaps after the move with no positional correction. More robust for many-coin pileups; should be visually indistinguishable.
- **Wall reflection**: Pascal uses `sita := pi - sita` (which flips x-component for a vertical wall). Port directly negates `vel.x`. Equivalent.

---

## 6. Reference: original gameplay (from `COIN2000.PAS` / `COINUSE.PAS`)

**Coin array layout (Pascal):**
- `coins[1..10]`  — P1 coins (color1)
- `coins[11..20]` — P2 coins (color2)
- `coins[21..40]` — stones (out of MVP scope)
- `coins[41..50]` — bombs (out of MVP scope)

**Key procedures:**
- `TCoin.go` — `COINUSE.PAS:800` — per-frame movement + collision + friction. Reverts `realx/realy` to the pre-move position on collision or side-wall hit before applying `hit()` / reflection. The port's batched move-then-resolve (§5.7) is an intentional simplification.
- `TCoin.hitother` — `COINUSE.PAS:848` — overlap test uses `(r1 + r2 + 2)²` — **2-pixel slack** on the radius sum. Port's `overlaps()` should add the same `+2` for matching feel.
- `hit(c1, c2)` — `COINUSE.PAS:959` — elastic collision in rotated frame. The `*0.95` restitution is applied **only to the along-axis components** (`vx1`, `vx2`); the cross-axis components (`vy1`, `vy2`) pass through unchanged. Energy is removed only from the normal direction of impact.
- `getsita(...)` — `COINUSE.PAS:946` — angle from (x1,y1) to (x2,y2). Equivalent to `atan2(y2-y1, x2-x1)`.
- `tm.GetV` — `COIN2000.PAS:656` — human input (hover-select + click-charge)
- `tm.cgetv` — `COIN2000.PAS:916` — computer AI; angle-spread + optional random fallback
- `tm.run` — `COIN2000.PAS:123` — match loop, scoring, bonus rules

**Physics constants:** `miu = 0.015`, `g = 9.8`, restitution `0.95` (hardcoded in `hit()`), collision-overlap slack `+2 px` (hardcoded in `hitother`).

**Tunable defaults & ranges** (from `COINUSE.PAS` config init/validation):
- Coin radius `r1`: default `11`, range `[11, 15]`
- Coin mass `mg1`: default `5`, range `[5, 10]`
- Max shot speed `maxv`: default `14`, range `[11, 20]`

---

## 7. Risks / unknowns

- **AI feel**: original uses Pascal RNG with specific seeding; ours will differ. Most players won't notice.
- **Collision stability**: Pascal runs at low FPS with coarse steps; a fast RAF loop with the same friction constant could behave differently. Mitigation: fixed 60 Hz sim sub-step.
- **Power tuning**: `POWER_SCALE` will need empirical tuning to feel right.
- **AI compute budget**: `5 coins × 5 enemies × 5 angles × ≤600 ticks = ~75k ticks` per AI turn. Should be ≪16ms in JS; if not, we cap sim ticks more aggressively.

---

## 8. Open extension points (post-MVP)

- Add `Stone` and `Bomb` as new `CoinKind` values. Physics already handles mass-weighted collisions; bombs add one branch (`onCollision: trigger explosion`).
- Add settings dialog → mutate `constants.ts` defaults at runtime via a Settings module.
- Add save/replay: serialize World + log of (turn, coinId, vel) tuples.
- Add cheat-code buffer in `input/keys.ts`; mutates settings flags.
- Add multi-round match + coin pool in `rules.ts` (new `Match` layer above `Round`).
