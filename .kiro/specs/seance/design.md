# Design: SSH Séance

## Overview

```
            +--------------------+
 keys --->  |  door (ssh | web)  |  ---> frame string ---> terminal
            +---------+----------+
                      | inputs per tick           ^
                      v                           |
            +--------------------+      +---------+---------+
            |  engine: step()    | ---> |  render/ansi.ts   |
            +--------------------+      +-------------------+
                      ^
                      | bot inputs
            +--------------------+
            |  bots/simple.ts    |
            +--------------------+
```

Each door owns a 100 ms timer. On every tick it collects one heading per human (the last key pressed), asks each bot for a heading, calls `step(state, inputs)`, renders the new state, and writes the frame to every terminal it serves.

## Data model (`src/engine/types.ts`)

```ts
type Dir = 'up' | 'down' | 'left' | 'right';
type Cell = { x: number; y: number };          // 0..59, 0..23

interface Rider {
  id: string; color: number;                   // ANSI 256 color index
  head: Cell; dir: Dir; alive: boolean;
  trail: Cell[];                               // oldest first, includes head
  isBot: boolean;
}

interface Ghost { riderId: string; color: number; path: Cell[]; pos: number }

interface GameState {
  width: 60; height: 24;
  tick: number; round: number;
  riders: Rider[]; ghosts: Ghost[];
  phase: 'playing' | 'intermission';
  intermissionLeft: number;                    // ticks until next round
  winner: string | null;
  rng: number;                                 // mulberry32 state
}

type Inputs = Record<string, Dir | undefined>; // riderId -> heading
```

## Engine (`src/engine/`)

- `rng.ts`: mulberry32. `next(state) -> [value, newState]`. Pure.
- `spawn.ts`: four fixed spawn points (corners, facing inward), order shuffled with the seeded rng at round start. (Req 6.1)
- `step.ts`: `step(state, inputs): GameState`. Order inside one tick:
  1. Apply turns, ignoring exact reversals. (Req 1.2, 1.3)
  2. Compute each living rider's next head.
  3. Build the blocked set: walls, all trails, all ghost cells *before* ghosts move.
  4. Mark crashes: next head in blocked set, or two next heads equal. (Req 1.4, 1.5)
  5. Move survivors; append to trail.
  6. Convert crashed riders to ghosts: last 20 trail cells (or all), trail removed. (Req 2.1, 2.4)
  7. Advance every ghost `pos = (pos + 1) % path.length`. (Req 2.2)
  8. If ≤ 1 alive: phase `intermission`, 30 ticks, record winner. When it reaches 0: new round, ghosts cleared. (Req 1.6, 2.5)
- `ghostCells(g)`: `path[pos]` and the 4 cells before it, wrapping. (Req 2.3)

Decision: ghosts block at step 3 using their pre-move cells, so a rider sees on screen exactly what will kill it.

## Bots (`src/bots/simple.ts`)

`botMove(state, riderId): Dir`. Look ahead up to 8 cells in each of the three non-reverse headings; pick the longest free run; break ties with the seeded rng. Deterministic given state. Pure.

## Render (`src/render/ansi.ts`)

`render(state, viewerId?): string`. Returns a full frame: cursor home (`ESC[H`), 26 lines (wall, 24 rows, wall), one status line (round, alive riders, winner during intermission), one key legend line. Riders use `█` in their color, heads `▓`, ghosts `░` in their color dimmed, walls `#`. No terminal state other than SGR colors and cursor home. 62×28 cells total.

## SSH door (`src/ssh/server.ts`)

- `ssh2.Server` with a host key generated on first run into `.data/host_key` (gitignored).
- Auth: accept `none` and any password/key (Req 5.1). Local use only; README says so.
- On `pty` + `shell`: check cols ≥ 62 and rows ≥ 27, else write a resize message and re-check on `window-change` (Req 5.4).
- One shared `Game` object: joins during `playing` wait for the next round (Req 5.1); fills with bots to 4 while humans < 2 (Req 5.3); disconnect = crash (Req 5.5).
- Key parsing: `src/ssh/keys.ts`, pure, maps bytes to `Dir | 'quit'` (Req 3.1, 3.2, 3.4).

## Web door (`src/web/main.ts`)

- Vite app, xterm.js 62×28, `convertEol: false`.
- One human (`you`) + three bots (Req 4.1). Key handler on the terminal: wasd, hjkl, arrows (Req 3.3).
- Same `step` and `render`. No network after load (Req 4.2); Playwright asserts no extra requests.
- Deployed to GitHub Pages by a workflow.

## Testing

- Unit tests per engine rule (Req 1, 2).
- Property tests (fast-check):
  - P1: a living rider's trail never contains a duplicate cell.
  - P2: no two living riders share a head cell after any step.
  - P3: determinism, same seed + same input log twice gives equal state sequences (Req 6.2).
  - P4: `render` output is always exactly 28 lines of 62 visible cells (Req 6.3).
  - P5: a reverse input never changes `dir` (Req 1.3).
- `keys.ts` table tests (Req 3).
- Playwright: page loads, arena visible, pressing `d` changes the frame, no requests to other origins (Req 4).
- SSH: an integration test opens a `ssh2.Client` to the server on a random port, requests a pty, and reads one frame (Req 5.1, 5.2).
