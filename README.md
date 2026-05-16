# COIN 2000

A browser port of the 1995 Turbo Pascal game **COIN 2000** (Song Studio / Song Jiuqing). Two players take turns flicking coins across a table — knock the other side's coins off the top or bottom edge to win.

Play it: <https://jiuqingsong.github.io/coin2000/>

## Controls

- **Drag a coin in your color and release** — slingshot semantics: the shot fires in the *opposite* direction of your drag. Longer drag = harder shot, capped at maximum power.
- One shot per turn. Turn passes automatically when the table settles.
- Side walls bounce; top and bottom kill.
- Round ends when a side has no coins left on the table.

## Modes

- **P1**: always human (you).
- **P2**: toggle between Computer and Human in the top bar. The AI picks shots by sampling angles around each enemy coin and simulating each one to find the highest-scoring outcome.

## Develop

```
npm install
npm run dev      # vite dev server with HMR
npm run build    # tsc --noEmit && vite build → dist/
npm run preview  # serve the production build locally
```

Stack: TypeScript + Vite, Canvas 2D for the playfield, plain HTML/CSS for chrome, Web Audio API for sound effects.

## Deploy

Pushes to `main` deploy automatically to GitHub Pages via `.github/workflows/pages.yml`. `vite.config.ts` sets `base: './'` so the bundle works under any subpath.

## About the port

The original COIN 2000 was a Turbo Pascal program built around a custom `GraphObj` / `GraphDlg` / `GraphMnu` windowing framework that made up roughly 70% of the source. The port skips that framework entirely — chrome and HUD are native HTML/CSS, only the playfield is canvas — and reimplements just the gameplay: coin physics, the table, the bell, and the AI.

Physics constants (friction μ = 0.015, gravity g = 9.8, collision restitution 0.95, max shot speed 14, coin radius 11, coin mass 5) are taken directly from `legacy/COINUSE.PAS`. Collision math is a 1D-elastic-on-rotated-frame port of the original `hit()` procedure. The AI is a simplified port of `cgetv` that samples five angles per (own-coin, enemy-coin) pair and picks the highest-scoring shot via headless physics simulation.

Out of scope for this port: stones, bombs, multi-round matches with coin pools, settings dialog, cheat codes, and `.C2K` save-file compatibility. See `port_plan.md` for the full design.

## Repo layout

```
src/
  game/      world, physics, rules, setup, engine, constants
  players/   Player interface, HumanPlayer, AIPlayer
  ai/        chooseShot, headless simulate
  input/     AimController (drag-release)
  render/    DPR-aware canvas wrapper, sprites, renderer
  ui/        chrome (top bar) + hud (right rail + overlay)
  audio/     Web Audio bell (shoot, collision, die)
  main.ts    entry point — wires the above together
legacy/      original Turbo Pascal sources (reference only)
port_plan.md design doc + Pascal cross-reference
```
